// ASHEN VOW — audio. Everything is synthesized at runtime with the Web Audio API: there are no audio files.
//
// Public API (every call is a safe no-op before init() succeeds or when Web Audio is unavailable):
//   AV.audio.init()                        create / resume the AudioContext (call from a user gesture; idempotent)
//   AV.audio.ready                         true once the context exists
//   AV.audio.sfx(id, {vol, pitch, pan})    one-shot sound effect (ids: see SFX below / docs/API.md §12)
//   AV.audio.music(id | null, {fade})      crossfade to a looping generative track; same id = no-op; null = fade out
//   AV.audio.ambience(list, {indoor})      crossfade ambience beds 'wind' | 'rain' | 'fire' (weather ids accepted too)
//   AV.audio.setVolumes({master, music, sfx})   0..1 each (a perceptual curve is applied internally)
//   AV.audio.text(pitch)                   soft dialogue blip
//   AV.audio.update(dt)                    optional per-frame hook (pumps the music scheduler)
//
// Signal flow:
//   voice ─► room (dry | mid | far) ─┬─► bus volume (music | sfx) ───────────────┬─► master ─► compressor ─► out
//                                     └─► reverb send ─► convolver (generated IR) ─┘
//   Music tracks also feed a filtered echo. Ambience beds feed the sfx bus through a muffling low-pass.
// Music is generative: a look-ahead scheduler (setInterval 25 ms, also pumped by update()) asks the current track
// what happens on each beat and schedules notes up to ~0.2 s ahead on ctx.currentTime.
(function (root) {
  'use strict';
  const AV = root.AV || (root.AV = {});
  const A = AV.audio || (AV.audio = {});   // core.js installs a silent stub; we fill in the real thing in place

  // ================================================================ constants & small utilities
  const EPS = 0.0001;            // "silence" target for exponential ramps (−80 dB)
  const LOOKAHEAD = 0.2;         // seconds of music scheduled ahead
  const TICK_MS = 25;
  const MAX_VOICES = 32;         // simultaneous sound effects
  const rnd = Math.random;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const chance = (p) => rnd() < p;
  const rr = (a, b) => a + rnd() * (b - a);
  const curve = (v) => v * v;     // slider value → gain (roughly perceptual)

  function warn(e) {
    try { if (AV.warnOnce) AV.warnOnce('audio: ' + (e && e.message ? e.message : String(e))); } catch (_) { /* never throw */ }
  }

  // ================================================================ state
  let ctx = null;                // AudioContext
  let G = null;                  // global graph nodes
  let nyq = 22050;
  let timer = null;
  let lastPump = 0;
  const vol = { master: 0.8, music: 0.7, sfx: 0.8 };
  const MIX = { music: 1.3, ambience: 0.15 };   // fixed bus trims under the player's volume sliders
  let musicWanted = null;        // last requested music id (may be pending until init)
  let current = null;            // current track instance
  const tracks = [];             // live track instances (current + fading ones)
  let ambWanted = [];            // [{id, vol}]
  let ambIndoor = false;
  const beds = {};               // ambience id → bed instance
  const dyingBeds = [];
  const voices = [];             // live sfx voices
  const lastPlay = {};           // sfx id → last start time (rate limiting)
  let lastText = -1;
  let collector = null;          // while an sfx is being built, every source it creates is recorded here
  const cache = { noise: {}, ks: {}, shaper: {}, wave: {} };

  const fq = (f) => clamp(num(f, 440), 0.01, nyq * 0.92);   // keep every frequency inside the legal range

  // ================================================================ node helpers
  function gain(v) { const g = ctx.createGain(); g.gain.value = v; return g; }

  function wire() {
    for (let i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]);
    return arguments[arguments.length - 1];
  }

  function osc(type, f, t0, t1) {
    const o = ctx.createOscillator();
    if (type === 'organ' || type === 'reed' || type === 'flute') o.setPeriodicWave(wave(type));
    else o.type = type;
    o.frequency.value = fq(f);
    o.start(t0);
    if (t1 != null) o.stop(t1);
    if (collector) collector.push(o);
    return o;
  }

  function bsrc(buf, t0, t1, rate, loop, offset) {
    const s = ctx.createBufferSource();
    s.buffer = buf;
    if (loop) s.loop = true;
    if (rate) s.playbackRate.value = rate;
    s.start(t0, offset || 0);
    if (t1 != null) s.stop(t1);
    if (collector) collector.push(s);
    return s;
  }

  function noise(kind, t0, t1, rate) {
    const b = noiseBuf(kind);
    return bsrc(b, t0, t1, rate, true, rnd() * b.duration * 0.9);
  }

  // Q for lowpass/highpass is in dB in Web Audio (0 ≈ gentle); for band/peak filters it is the usual Q.
  function bq(type, f, q, gdb) {
    const b = ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = fq(f);
    b.Q.value = q == null ? 0 : q;
    if (gdb != null) b.gain.value = gdb;
    return b;
  }

  function panner(pan) {
    if (!ctx.createStereoPanner) return null;
    const p = ctx.createStereoPanner();
    p.pan.value = clamp(num(pan, 0), -1, 1);
    return p;
  }

  function shaper(amount) {
    const key = String(amount);
    let c = cache.shaper[key];
    if (!c) {
      c = new Float32Array(1024);
      const norm = Math.tanh(amount);
      for (let i = 0; i < c.length; i++) { const x = (i / (c.length - 1)) * 2 - 1; c[i] = Math.tanh(x * amount) / norm; }
      cache.shaper[key] = c;
    }
    const s = ctx.createWaveShaper();
    s.curve = c;
    return s;
  }

  function wave(kind) {
    if (cache.wave[kind]) return cache.wave[kind];
    const H = {
      organ: [0, 1, 0.62, 0.3, 0.34, 0.08, 0.15, 0.03, 0.09],
      reed: [0, 1, 0.72, 0.52, 0.44, 0.34, 0.26, 0.2, 0.15, 0.1, 0.08],
      flute: [0, 1, 0.22, 0.07, 0.03],
    }[kind];
    const real = new Float32Array(H.length);
    const imag = new Float32Array(H);
    return (cache.wave[kind] = ctx.createPeriodicWave(real, imag));
  }

  // ---------------------------------------------------------------- envelopes (all start from silence: no clicks)
  function ad(p, t, a, peak, d) {           // attack, exponential decay
    peak = Math.max(peak, EPS * 2);
    a = Math.max(a, 0.0005);
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(peak, t + a);
    p.exponentialRampToValueAtTime(EPS, t + a + d);
    p.setValueAtTime(0, t + a + d + 0.002);
  }
  function ahr(p, t, a, peak, h, r) {       // attack, hold, exponential release
    peak = Math.max(peak, EPS * 2);
    a = Math.max(a, 0.0005);
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(peak, t + a);
    if (h > 0) p.setValueAtTime(peak, t + a + h);
    p.exponentialRampToValueAtTime(EPS, t + a + Math.max(h, 0) + r);
    p.setValueAtTime(0, t + a + Math.max(h, 0) + r + 0.002);
  }
  function env(p, t, a, peak, h, d) { if (h > 0) ahr(p, t, a, peak, h, d); else ad(p, t, a, peak, d); }
  function glide(p, t0, f0, t1, f1) {       // exponential pitch / cutoff sweep
    p.setValueAtTime(fq(f0), t0);
    p.exponentialRampToValueAtTime(fq(f1), Math.max(t1, t0 + 0.001));
  }
  function path(p, t, f0, pts) {            // f0 then [[dt, f], ...] exponential segments
    p.setValueAtTime(fq(f0), t);
    for (const [dt, f] of pts) p.exponentialRampToValueAtTime(fq(f), t + dt);
  }

  // noise burst through a filter. o: {k, type, f, fs:[[dt,f]], f2 (sweep to), q, a, v, h, d, rate}
  function nz(dst, t, o) {
    const a = o.a != null ? o.a : 0.002, h = o.h || 0, d = o.d != null ? o.d : 0.1;
    const end = t + a + h + d + 0.02;
    const s = noise(o.k || 'white', t, end, o.rate);
    let last = s;
    if (o.type) {
      const f = bq(o.type, o.f, o.q);
      if (o.fs) path(f.frequency, t, o.f, o.fs);
      else if (o.f2) glide(f.frequency, t, o.f, t + a + h + d, o.f2);
      last.connect(f); last = f;
    }
    const g = gain(0);
    env(g.gain, t, a, o.v, h, d);
    wire(last, g, dst);
    return g;
  }

  // tone with optional pitch path. o: {w, f, fs, f2, ft, a, v, h, d}
  function tn(dst, t, o) {
    const a = o.a != null ? o.a : 0.002, h = o.h || 0, d = o.d != null ? o.d : 0.2;
    const s = osc(o.w || 'sine', o.f, t, t + a + h + d + 0.03);
    if (o.fs) path(s.frequency, t, o.f, o.fs);
    else if (o.f2) glide(s.frequency, t, o.f, t + (o.ft || a + h + d), o.f2);
    const g = gain(0);
    env(g.gain, t, a, o.v, h, d);
    wire(s, g, dst);
    return s;
  }

  // ================================================================ generated buffers
  function noiseBuf(kind) {
    if (cache.noise[kind]) return cache.noise[kind];
    const sr = ctx.sampleRate;
    const stereo = kind.charAt(kind.length - 1) === 'S';
    const base = stereo ? kind.slice(0, -1) : kind;
    const secs = stereo ? 4 : 2.5;
    const len = Math.floor(sr * secs);
    const seam = Math.floor(sr * 0.05);
    const b = ctx.createBuffer(stereo ? 2 : 1, len, sr);
    for (let ch = 0; ch < b.numberOfChannels; ch++) {
      const d = b.getChannelData(ch);
      if (base === 'crackle') { fillCrackle(d, sr); continue; }
      const tmp = new Float32Array(len + seam);
      if (base === 'pink') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < tmp.length; i++) {
          const w = rnd() * 2 - 1;
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
          b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          tmp[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
          b6 = w * 0.115926;
        }
      } else if (base === 'brown') {
        let l = 0;
        for (let i = 0; i < tmp.length; i++) { l = (l + 0.02 * (rnd() * 2 - 1)) / 1.02; tmp[i] = l; }
      } else {
        for (let i = 0; i < tmp.length; i++) tmp[i] = rnd() * 2 - 1;
      }
      // remove DC, normalise RMS, fold the extra tail over the head so the loop point is seamless
      let mean = 0;
      for (let i = 0; i < tmp.length; i++) mean += tmp[i];
      mean /= tmp.length;
      let rms = 0;
      for (let i = 0; i < tmp.length; i++) { tmp[i] -= mean; rms += tmp[i] * tmp[i]; }
      const k = 0.3 / Math.sqrt(rms / tmp.length || 1);
      for (let i = 0; i < len; i++) d[i] = tmp[i] * k;
      for (let i = 0; i < seam; i++) { const w = i / seam; d[i] = (tmp[i] * w + tmp[len + i] * (1 - w)) * k; }
    }
    return (cache.noise[kind] = b);
  }

  function fillCrackle(d, sr) {
    let pos = 0;
    for (;;) {
      pos += Math.floor(-Math.log(1 - rnd()) * sr / 55) + 1;
      if (pos >= d.length - 400) break;
      const amp = (0.12 + 0.88 * Math.pow(rnd(), 3)) * (rnd() < 0.5 ? -1 : 1);
      const L = 3 + Math.floor(rnd() * rnd() * 90);
      for (let k = 0; k < L * 3 && pos + k < d.length; k++) d[pos + k] += amp * (rnd() * 2 - 1) * Math.exp(-k / L);
    }
    let pk = 0;
    for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
    if (pk > 0) for (let i = 0; i < d.length; i++) d[i] /= pk;
  }

  // A dark, stone-hall impulse response: early reflections, then decaying noise that darkens as it fades.
  function makeIR(secs) {
    const sr = ctx.sampleRate, len = Math.floor(sr * secs);
    const b = ctx.createBuffer(2, len, sr);
    const pre = Math.floor(sr * 0.014);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let lp = 0;
      for (let i = pre; i < len; i++) {
        const x = (i - pre) / (len - pre);
        const tail = x > 0.88 ? (1 - x) / 0.12 : 1;
        const k = 0.1 + 0.78 * x;
        lp += (rnd() * 2 - 1 - lp) * (1 - k);
        d[i] = lp * Math.exp(-x * 6.2) * tail * (1 + 1.6 * k);
      }
      for (let e = 0; e < 10; e++) {
        const i = pre + Math.floor(rr(0.002, 0.075) * sr);
        if (i < len) d[i] += (rnd() < 0.5 ? -1 : 1) * rr(0.4, 1.1) * (1 - e / 12);
      }
    }
    return b;
  }

  // Karplus–Strong plucked string, one cached buffer per MIDI note. Returns {buf, rate}.
  function ksBuf(midi, bright) {
    midi = Math.round(clamp(num(midi, 60), 24, 100));
    const key = midi + (bright ? 'b' : 's');
    if (cache.ks[key]) return cache.ks[key];
    const sr = ctx.sampleRate, f = mf(midi);
    const dur = clamp(3.4 - (midi - 36) * 0.05, 1.1, 3.4);
    const n = Math.floor(sr * dur);
    const N = Math.max(2, Math.round(sr / f - 0.5));
    const buf = ctx.createBuffer(1, n, sr);
    const d = buf.getChannelData(0);
    let lp = 0, mean = 0;
    const sm = bright ? 0.75 : 0.32;
    for (let i = 0; i < N && i < n; i++) { lp += (rnd() * 2 - 1 - lp) * sm; d[i] = lp; mean += lp; }
    mean /= N;
    for (let i = 0; i < N && i < n; i++) d[i] -= mean;
    const rho = Math.pow(0.001, 1 / (f * dur));
    for (let i = N; i < n; i++) {
      const j = i - N - 1;
      d[i] = rho * 0.5 * (d[i - N] + (j >= 0 ? d[j] : d[i - N]));
    }
    const fade = Math.floor(n * 0.08);
    for (let i = 0; i < fade; i++) d[n - 1 - i] *= i / fade;
    let pk = 0;
    for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i]));
    if (pk > 0) for (let i = 0; i < n; i++) d[i] *= 0.9 / pk;
    return (cache.ks[key] = { buf, rate: f * (N + 0.5) / sr });
  }

  // ================================================================ instruments (shared by music and sfx)
  // Plucked string. o: {bright, len (seconds), rate (pitch multiplier), cut}
  function pluck(dst, t, midi, vel, o) {
    o = o || {};
    const k = ksBuf(midi, !!o.bright);
    const rate = k.rate * (o.rate || 1);
    const full = k.buf.duration / rate;
    const dur = o.len ? Math.min(o.len, full) : full;
    const s = bsrc(k.buf, t, t + dur + 0.01, rate);
    const lp = bq('lowpass', o.cut || 3400, 0);
    const g = gain(0);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.003);
    if (o.len && dur < full) {
      g.gain.setValueAtTime(vel, t + Math.max(0.004, dur - 0.12));
      g.gain.exponentialRampToValueAtTime(EPS, t + dur);
    }
    wire(s, lp, g, dst);
  }

  // Church bell: inharmonic partials (hum, prime, tierce, quint, nominal …), lower ones ring longest.
  const BELL = [
    [0.5, 0.45, 1.0], [1.0, 0.8, 0.8], [1.183, 0.42, 0.6], [1.506, 0.28, 0.5], [2.0, 0.45, 0.42],
    [2.514, 0.2, 0.3], [2.662, 0.16, 0.27], [3.011, 0.13, 0.22], [4.166, 0.09, 0.15], [5.433, 0.06, 0.1],
  ];
  // o: {n (partials), big (beating doublets), lp (muffling cutoff), wobble (cents, underwater), strike}
  function bell(dst, t, f, dur, vel, o) {
    o = o || {};
    let out = dst;
    if (o.lp) { const l = bq('lowpass', o.lp, 1); l.connect(dst); out = l; }
    let wob = null;
    if (o.wobble) { const l = osc('sine', rr(0.5, 0.9), t, t + dur + 0.2); wob = gain(o.wobble); l.connect(wob); }
    const n = Math.min(o.n || 9, BELL.length);
    const k = vel / 2.2;
    for (let i = 0; i < n; i++) {
      const [ratio, amp, dk] = BELL[i];
      const fr = f * ratio * (1 + (rnd() - 0.5) * 0.003);
      if (fr > nyq * 0.85) continue;
      const len = dur * dk;
      const g = gain(0);
      ad(g.gain, t, i < 2 ? 0.006 : 0.002, amp * k, len);
      const s = osc('sine', fr, t, t + len + 0.05);
      s.connect(g);
      if (wob) wob.connect(s.detune);
      if (o.big && i < 3) { const s2 = osc('sine', fr + rr(0.7, 1.6), t, t + len + 0.05); s2.connect(g); }
      g.connect(out);
    }
    if (o.strike !== false) nz(out, t, { k: 'white', type: 'bandpass', f: Math.min(f * 3.2, 6000), q: 1.2, a: 0.0006, v: vel * 0.22, d: 0.035 });
  }

  // pure little chime (heal, quest, pickup)
  function chime(dst, t, f, vel, dec) {
    for (const [r, a, dk] of [[1, 1, 1], [2.005, 0.32, 0.6], [3.012, 0.12, 0.35]]) {
      if (f * r > nyq * 0.85) continue;
      tn(dst, t, { f: f * r, a: 0.003, v: vel * a, d: dec * dk });
    }
  }

  // struck metal plate / armour (free-plate partial ratios); list of [ratio, amp, decay]
  const PLATE = [[1, 1, 1], [2.756, 0.6, 0.7], [5.404, 0.4, 0.45], [8.933, 0.2, 0.3], [1.012, 0.5, 0.9]];
  const COIN = [[1, 1, 1], [2.41, 0.5, 0.6], [3.93, 0.3, 0.4], [5.32, 0.15, 0.3]];
  function plate(dst, t, f, vel, dec, ratios) {
    for (const [r, a, dk] of ratios || PLATE) {
      const fr = f * r * (1 + (rnd() - 0.5) * 0.01);
      if (fr > nyq * 0.85) continue;
      tn(dst, t, { f: fr, a: 0.0008, v: vel * a, d: dec * dk });
    }
  }

  // shimmering sines with tremolo
  function shimmer(dst, t, freqs, vel, a, h, r) {
    freqs.forEach((f, i) => {
      const t0 = t + i * 0.12, end = t0 + a + h + r + 0.05;
      const s = osc('sine', f, t0, end);
      const trem = gain(0.6);
      const l = osc('sine', rr(5.5, 8), t0, end); const lg = gain(0.4); wire(l, lg, trem.gain);
      const g = gain(0); ahr(g.gain, t0, a, vel, h, r);
      wire(s, trem, g, dst);
    });
  }

  // Saw pad through a low-pass. o: {a, r, cut, cut2 (swell target), q, vel, type}
  function pad(dst, t, freqs, dur, o) {
    o = o || {};
    const a = o.a != null ? o.a : 1, r = o.r != null ? o.r : 1.5, vel = o.vel != null ? o.vel : 0.1;
    const hold = Math.max(0, dur - a);
    const end = t + a + hold + r + 0.05;
    const f = bq('lowpass', o.cut || 900, o.q != null ? o.q : 0);
    if (o.cut2) {
      f.frequency.setValueAtTime(fq(o.cut), t);
      f.frequency.exponentialRampToValueAtTime(fq(o.cut2), t + a);
      f.frequency.exponentialRampToValueAtTime(fq((o.cut + o.cut2) * 0.5), t + a + hold + r);
    }
    for (const fr of freqs) {
      for (const dt of [-7, 6]) {
        const s = osc(o.type || 'sawtooth', fr, t, end);
        s.detune.value = dt + (rnd() - 0.5) * 4;
        s.connect(f);
      }
    }
    const g = gain(0);
    ahr(g.gain, t, a, vel / Math.sqrt(freqs.length * 2), hold, r);
    wire(f, g, dst);
  }

  // Distant pipe organ (one periodic-wave oscillator per note)
  function organ(dst, t, freqs, dur, o) {
    o = o || {};
    const a = o.a != null ? o.a : 1.5, r = o.r != null ? o.r : 2, vel = o.vel != null ? o.vel : 0.08;
    const hold = Math.max(0, dur - a), end = t + a + hold + r + 0.05;
    const f = bq('lowpass', o.cut || 1500, 0);
    for (const fr of freqs) { const s = osc('organ', fr, t, end); s.detune.value = (rnd() - 0.5) * 6; s.connect(f); }
    const g = gain(0);
    ahr(g.gain, t, a, vel / Math.sqrt(freqs.length), hold, r);
    wire(f, g, dst);
  }

  // Bowed string line (viola / cello): two saws, delayed vibrato, soft bow attack
  function bowed(dst, t, f, dur, o) {
    o = o || {};
    const a = o.a || 0.2, r = o.r || 0.45, vel = o.vel || 0.1;
    const end = t + dur + r + 0.05;
    const s1 = osc('sawtooth', f, t, end), s2 = osc('sawtooth', f, t, end);
    s2.detune.value = 5;
    const vib = osc('sine', rr(4.8, 5.6), t, end);
    const vg = gain(0);
    vg.gain.setValueAtTime(0, t);
    vg.gain.linearRampToValueAtTime(o.vib != null ? o.vib : 11, t + Math.min(0.5, dur * 0.6));
    wire(vib, vg); vg.connect(s1.detune); vg.connect(s2.detune);
    const lp = bq('lowpass', o.cut || Math.min(f * 5 + 500, 3600), 0);
    const g = gain(0);
    ahr(g.gain, t, a, vel * 0.5, Math.max(0, dur - a), r);
    s1.connect(lp); s2.connect(lp);
    wire(lp, g, dst);
  }

  // Formant choir: detuned saw ensemble with shared vibrato through a vowel filter bank.
  const VOW = {
    a: [[730, 1, 9], [1090, 0.55, 11], [2440, 0.2, 16]],
    o: [[570, 1, 9], [840, 0.5, 10], [2410, 0.14, 16]],
    u: [[320, 1, 7], [870, 0.3, 9], [2240, 0.08, 14]],
    e: [[530, 1, 9], [1840, 0.4, 14], [2480, 0.22, 16]],
  };
  const CHOIR_GAIN = 3.2;
  // o: {vowel, a, r, vel, glide (pitch multiplier reached at the end), vib (cents)}
  function choir(dst, t, freqs, dur, o) {
    o = o || {};
    const a = o.a != null ? o.a : 1, r = o.r != null ? o.r : 1.5, vel = o.vel != null ? o.vel : 0.1;
    const end = t + Math.max(dur, a) + r + 0.1;
    const mix = gain(1);
    const vib = osc('sine', rr(4.6, 5.4), t, end);
    const vg = gain(o.vib != null ? o.vib : 13);
    vib.connect(vg);
    for (const f of freqs) {
      for (const k of [-11, 0, 10]) {
        const s = osc('sawtooth', f, t, end);
        s.detune.value = k + (rnd() - 0.5) * 6;
        vg.connect(s.detune);
        if (o.glide) glide(s.frequency, t, f, end, f * o.glide);
        s.connect(mix);
      }
    }
    const out = gain(0);
    for (const [ff, amp, q] of VOW[o.vowel] || VOW.a) {
      const b = bq('bandpass', ff, q);
      wire(mix, b, gain(amp * CHOIR_GAIN), out);
    }
    wire(mix, bq('lowpass', 420, 0), gain(0.12), out);
    ahr(out.gain, t, a, vel / Math.sqrt(freqs.length * 3), Math.max(0, dur - a), r);
    out.connect(dst);
  }

  // Glassy high tone (glass harmonica): slow attack, slow beating
  function glass(dst, t, f, dur, o) {
    o = o || {};
    const a = o.a || 0.5, r = o.r || 2, vel = o.vel || 0.04;
    const hold = Math.max(0, dur - a), end = t + a + hold + r + 0.05;
    const g = gain(0);
    ahr(g.gain, t, a, vel, hold, r);
    osc('sine', f, t, end).connect(g);
    osc('sine', f * 1.0032, t, end).connect(g);
    const h2 = gain(0.14); osc('sine', f * 2, t, end).connect(h2); h2.connect(g);
    g.connect(dst);
  }

  // Brass-like tone: saws through a low-pass that opens with the swell
  function brass(dst, t, f, dur, o) {
    o = o || {};
    const a = o.a != null ? o.a : 0.25, r = o.r != null ? o.r : 0.8, vel = o.vel || 0.1;
    const hold = Math.max(0, dur - a), end = t + a + hold + r + 0.05;
    const lp = bq('lowpass', f * 1.2, 2);
    lp.frequency.setValueAtTime(fq(f * 1.2), t);
    lp.frequency.exponentialRampToValueAtTime(fq(f * (o.bright || 5)), t + a * 0.9);
    lp.frequency.exponentialRampToValueAtTime(fq(f * 2.5), t + a + hold + r);
    const s1 = osc('sawtooth', f, t, end), s2 = osc('sawtooth', f, t, end);
    s2.detune.value = 7;
    const vib = osc('sine', 4.6, t, end); const vg = gain(6); wire(vib, vg); vg.connect(s1.detune);
    const g = gain(0);
    ahr(g.gain, t, a, vel * 0.6, hold, r);
    s1.connect(lp); s2.connect(lp);
    wire(lp, g, dst);
  }

  // Music box tine: cantilever partials 1 : 6.27 : 17.55, tiny click, a little detune from age
  function mbox(dst, t, f, vel) {
    f *= 1 + (rnd() - 0.5) * 0.012;
    for (const [r, a, d] of [[1, 1, 1.9], [6.267, 0.22, 0.3], [17.55, 0.05, 0.08]]) {
      if (f * r > nyq * 0.85) continue;
      tn(dst, t, { f: f * r, a: 0.001, v: vel * a, d });
    }
    nz(dst, t, { k: 'white', type: 'highpass', f: 5000, q: 0, a: 0.0003, v: vel * 0.12, d: 0.006 });
  }

  // Water drop: a sine whose pitch rises (the bubble)
  function drip(dst, t, f, vel) {
    tn(dst, t, { f, f2: f * rr(1.9, 2.6), ft: rr(0.035, 0.06), a: 0.0008, v: vel, d: rr(0.08, 0.14) });
  }

  // Drums
  function taiko(dst, t, vel, o) {
    o = o || {};
    const p = o.p || 1;
    let out = dst;
    if (o.lp) { const l = bq('lowpass', o.lp, 0); l.connect(dst); out = l; }
    tn(out, t, { f: 165 * p, fs: [[0.09, 58 * p], [0.7, 48 * p]], a: 0.002, v: vel * 0.9, d: o.decay || 0.85 });
    nz(out, t, { k: 'brown', type: 'lowpass', f: 700 * p, q: 0, a: 0.001, v: vel * 0.55, d: 0.09 });
    nz(out, t, { k: 'white', type: 'bandpass', f: 1400 * p, q: 0.7, a: 0.0005, v: vel * 0.12, d: 0.02 });
  }
  function tom(dst, t, vel, f) {
    tn(dst, t, { f, f2: f * 0.6, ft: 0.12, a: 0.001, v: vel * 0.7, d: 0.32 });
    nz(dst, t, { k: 'white', type: 'bandpass', f: 1900, q: 0.8, a: 0.0005, v: vel * 0.12, d: 0.03 });
  }
  function brush(dst, t, vel) {
    nz(dst, t, { k: 'white', type: 'bandpass', f: 2600, q: 0.6, a: 0.002, v: vel * 0.35, d: 0.14 });
    tn(dst, t, { f: 195, f2: 150, ft: 0.08, a: 0.001, v: vel * 0.25, d: 0.08 });
  }
  function heart(dst, t, vel) {
    for (const [dt, f0, v] of [[0, 60, 1], [0.27, 68, 0.7]]) {
      tn(dst, t + dt, { f: f0, f2: f0 * 0.72, ft: 0.12, a: 0.004, v: vel * v, d: 0.17 });
      tn(dst, t + dt, { f: f0 * 2, f2: f0 * 1.4, ft: 0.08, a: 0.004, v: vel * v * 0.25, d: 0.1 });
      nz(dst, t + dt, { k: 'brown', type: 'lowpass', f: 220, q: 0, a: 0.003, v: vel * v * 0.5, d: 0.1 });
    }
  }
  function pops(dst, t, n, vel) {
    for (let k = 0; k < n; k++) {
      const tt = t + rnd() * 0.15, len = rr(0.002, 0.014);
      nz(dst, tt, { k: 'white', type: 'highpass', f: rr(900, 3200), q: 0, a: 0.0003, v: vel * (0.25 + 0.75 * Math.pow(rnd(), 2)), d: len });
    }
  }
  function tin(dst, t, vel) {
    plate(dst, t, rr(2600, 4200), vel, 0.3, [[1, 1, 1], [2.32, 0.4, 0.6], [4.25, 0.2, 0.3]]);
  }
  function stab(dst, t, freqs, vel) {
    const lp = bq('lowpass', 3200, 3);
    glide(lp.frequency, t, 3200, t + 0.35, 450);
    const g = gain(0);
    ad(g.gain, t, 0.004, vel / Math.sqrt(freqs.length), 0.55);
    for (const f of freqs) {
      osc('sawtooth', f, t, t + 0.65).connect(lp);
      const q = osc('square', f * 0.5, t, t + 0.65); q.detune.value = 8; q.connect(lp);
    }
    wire(lp, g, dst);
  }
  function tone(dst, t, f, dur, o) {
    o = o || {};
    const a = o.a != null ? o.a : 1, r = o.r != null ? o.r : 2, vel = o.vel || 0.08;
    const hold = Math.max(0, dur - a), end = t + a + hold + r + 0.05;
    const g = gain(0);
    ahr(g.gain, t, a, vel, hold, r);
    osc('sine', f, t, end).connect(g);
    const tg = gain(0.22); osc('triangle', f, t, end).connect(tg); tg.connect(g);
    g.connect(dst);
  }
  // a low bowed tone that slips down a semitone (uncanny)
  function slip(dst, t, f0, f1, dur, vel) {
    const end = t + dur + 0.1;
    const lp = bq('lowpass', 600, 0);
    const g = gain(0);
    ahr(g.gain, t, dur * 0.35, vel, dur * 0.2, dur * 0.45);
    for (const w of ['sine', 'triangle']) {
      const s = osc(w, f0, t, end);
      s.frequency.setValueAtTime(fq(f0), t + dur * 0.3);
      s.frequency.exponentialRampToValueAtTime(fq(f1), t + dur * 0.6);
      s.connect(lp);
    }
    wire(lp, g, dst);
  }
  // voiced grunt / sigh through formants
  function grunt(dst, t, f0, f1, dur, vel, fm) {
    const end = t + dur + 0.05;
    const mix = gain(1);
    for (const dt of [0, 9]) {
      const s = osc('sawtooth', f0, t, end); s.detune.value = dt;
      glide(s.frequency, t, f0, t + dur, f1);
      s.connect(mix);
    }
    const out = gain(0);
    for (const [ff, amp, q] of fm) wire(mix, bq('bandpass', ff, q), gain(amp * 3), out);
    ahr(out.gain, t, Math.min(0.03, dur * 0.2), vel, dur * 0.35, dur * 0.6);
    out.connect(dst);
  }

  // ================================================================ sound effects
  // spec: prio (0 trivial … 3 critical), room ('dry' | 'mid' | 'far'), gap (min s between repeats), max (same-id
  // voices), lvl (calibrated output level). fn(out, t, pitch, opts) builds the sound and returns its length (s).
  const SFX = {};
  function def(id, spec, fn) { spec.fn = fn; SFX[id] = spec; }

  def('swing', { prio: 1, room: 'mid', gap: 0.05, max: 3, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'white', type: 'bandpass', f: 450 * p, fs: [[0.09, rr(2200, 3000) * p], [0.28, 800 * p]], q: 1.3, a: 0.07, v: 0.8, d: 0.21 });
    nz(out, t + 0.03, { k: 'white', type: 'highpass', f: 4200 * p, q: 0, a: 0.05, v: 0.1, d: 0.13 });
    tn(out, t + 0.06, { f: rr(2900, 3400) * p, a: 0.004, v: 0.012, d: 0.28 });
    return 0.4;
  });
  def('swing2', { prio: 1, room: 'mid', gap: 0.05, max: 3, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'white', type: 'bandpass', f: 320 * p, fs: [[0.13, rr(1500, 2000) * p], [0.36, 520 * p]], q: 1.1, a: 0.1, v: 0.8, d: 0.26 });
    nz(out, t, { k: 'pink', type: 'lowpass', f: 520 * p, q: 0, a: 0.09, v: 0.4, d: 0.22 });
    tn(out, t + 0.05, { f: 140 * p, f2: 70 * p, ft: 0.18, a: 0.03, v: 0.2, d: 0.18 });
    return 0.5;
  });
  def('hit', { prio: 2, room: 'dry', gap: 0.03, max: 4, lvl: 1 }, (out, t, p) => {
    tn(out, t, { f: 150 * p, f2: 46 * p, ft: 0.11, a: 0.002, v: 0.8, d: 0.2 });
    nz(out, t, { k: 'pink', type: 'lowpass', f: 1100 * p, q: 0, a: 0.001, v: 0.55, d: 0.12 });
    nz(out, t, { k: 'crackle', rate: 2.5, type: 'highpass', f: 1600 * p, q: 0, a: 0.001, v: 0.8, d: 0.09 });
    nz(out, t, { k: 'white', type: 'bandpass', f: 2800 * p, q: 0.9, a: 0.0008, v: 0.3, d: 0.035 });
    nz(out, t + 0.01, { k: 'pink', type: 'bandpass', f: 2200 * p, fs: [[0.3, 380 * p]], q: 0.8, a: 0.02, v: 0.16, d: 0.28 });
    return 0.45;
  });
  def('hit_heavy', { prio: 2, room: 'dry', gap: 0.04, max: 3, lvl: 1 }, (out, t, p) => {
    const bus = gain(0.8); wire(bus, shaper(2.2), out);
    tn(bus, t, { f: 125 * p, f2: 34 * p, ft: 0.22, a: 0.003, v: 0.9, d: 0.42 });
    nz(bus, t, { k: 'pink', type: 'lowpass', f: 800 * p, q: 0, a: 0.002, v: 0.75, d: 0.25 });
    nz(out, t, { k: 'crackle', rate: 2, type: 'highpass', f: 1300 * p, q: 0, a: 0.001, v: 0.9, d: 0.16 });
    nz(out, t, { k: 'white', type: 'bandpass', f: 2200 * p, q: 0.8, a: 0.0008, v: 0.4, d: 0.05 });
    nz(out, t + 0.015, { k: 'pink', type: 'bandpass', f: 1800 * p, fs: [[0.45, 260 * p]], q: 0.7, a: 0.03, v: 0.22, d: 0.42 });
    return 0.7;
  });
  def('block', { prio: 2, room: 'mid', gap: 0.04, max: 3, lvl: 1 }, (out, t, p) => {
    plate(out, t, rr(500, 560) * p, 0.3, 0.55);
    nz(out, t, { k: 'white', type: 'highpass', f: 2500, q: 0, a: 0.0005, v: 0.45, d: 0.03 });
    nz(out, t, { k: 'white', type: 'bandpass', f: 4200 * p, q: 3, a: 0.002, v: 0.14, d: 0.14 });
    tn(out, t, { f: 190 * p, f2: 95 * p, ft: 0.05, a: 0.001, v: 0.3, d: 0.08 });
    return 0.75;
  });
  const GRUNT = [[600, 1, 5], [1000, 0.6, 6], [2400, 0.2, 8]];
  const SIGH = [[560, 1, 4], [950, 0.5, 5], [2300, 0.15, 7]];
  def('hurt', { prio: 2, room: 'dry', gap: 0.08, max: 2, lvl: 1 }, (out, t, p) => {
    tn(out, t, { f: 110 * p, f2: 44 * p, ft: 0.13, a: 0.002, v: 0.8, d: 0.2 });
    nz(out, t, { k: 'pink', type: 'lowpass', f: 700 * p, q: 0, a: 0.001, v: 0.5, d: 0.1 });
    plate(out, t, rr(390, 430) * p, 0.1, 0.2);
    grunt(out, t + 0.02, 118 * p, 86 * p, 0.3, 0.45, GRUNT);
    nz(out, t + 0.02, { k: 'white', type: 'bandpass', f: 1300, q: 1, a: 0.015, v: 0.05, d: 0.2 });
    return 0.5;
  });
  def('roll', { prio: 1, room: 'dry', gap: 0.1, max: 2, lvl: 1 }, (out, t, p) => {
    const s = noise('pink', t, t + 0.5);
    const bp = bq('bandpass', 1300 * p, 0.8);
    const g = gain(0), q = g.gain;
    q.setValueAtTime(0, t);
    q.linearRampToValueAtTime(0.35, t + 0.03); q.linearRampToValueAtTime(0.12, t + 0.1);
    q.linearRampToValueAtTime(0.45, t + 0.15); q.linearRampToValueAtTime(0.14, t + 0.23);
    q.linearRampToValueAtTime(0.32, t + 0.28); q.exponentialRampToValueAtTime(EPS, t + 0.46);
    q.setValueAtTime(0, t + 0.47);
    wire(s, bp, g, out);
    for (let k = 0; k < 3; k++) tn(out, t + rr(0.02, 0.3), { f: rr(2800, 4800) * p, a: 0.001, v: 0.03, d: 0.07 });
    tn(out, t + 0.3, { f: 95 * p, f2: 52 * p, ft: 0.08, a: 0.002, v: 0.4, d: 0.12 });
    nz(out, t + 0.3, { k: 'pink', type: 'lowpass', f: 600, q: 0, a: 0.002, v: 0.25, d: 0.1 });
    return 0.55;
  });
  def('step', { prio: 0, room: 'dry', gap: 0.07, max: 2, lvl: 1 }, (out, t, p) => {
    const r = rr(0.85, 1.18) * p, v = rr(0.8, 1.1);
    nz(out, t, { k: 'pink', type: 'lowpass', f: 950 * r, q: 0, a: 0.002, v: 0.4 * v, d: 0.07 });
    tn(out, t, { f: 100 * r, f2: 62 * r, ft: 0.04, a: 0.001, v: 0.3 * v, d: 0.06 });
    nz(out, t, { k: 'white', type: 'bandpass', f: 2600 * r, q: 1.3, a: 0.001, v: 0.05 * v, d: 0.025 });
    if (chance(0.3)) tn(out, t + rr(0.01, 0.03), { f: rr(2400, 3600), a: 0.001, v: 0.02, d: 0.09 });
    return 0.2;
  });
  def('step_soft', { prio: 0, room: 'dry', gap: 0.07, max: 2, lvl: 1 }, (out, t, p) => {
    const r = rr(0.85, 1.18) * p, v = rr(0.8, 1.1);
    nz(out, t, { k: 'pink', type: 'lowpass', f: 520 * r, q: 0, a: 0.008, v: 0.4 * v, d: 0.1 });
    nz(out, t + 0.004, { k: 'white', type: 'highpass', f: 3200 * r, q: 0, a: 0.006, v: 0.035 * v, d: 0.08 });
    if (chance(0.2)) tn(out, t + rr(0.01, 0.03), { f: rr(2400, 3600), a: 0.001, v: 0.012, d: 0.08 });
    return 0.2;
  });
  def('step_water', { prio: 0, room: 'dry', gap: 0.07, max: 2, lvl: 1 }, (out, t, p) => {
    const r = rr(0.85, 1.18) * p, v = rr(0.8, 1.1);
    nz(out, t, { k: 'white', type: 'bandpass', f: 1200 * r, q: 0.9, a: 0.003, v: 0.22 * v, d: 0.12 });
    nz(out, t, { k: 'pink', type: 'lowpass', f: 600 * r, q: 0, a: 0.004, v: 0.25 * v, d: 0.1 });
    const n = chance(0.5) ? 2 : 1;
    for (let k = 0; k < n; k++) drip(out, t + rr(0.02, 0.1), rr(500, 950) * r, 0.05 * v);
    return 0.3;
  });
  def('heal', { prio: 2, room: 'mid', gap: 0.2, max: 1, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'pink', type: 'bandpass', f: 280 * p, fs: [[0.55, 1400 * p]], q: 1.1, a: 0.28, v: 0.35, h: 0.08, d: 0.5 });
    tn(out, t, { f: 110 * p, a: 0.3, v: 0.08, h: 0.2, d: 0.8 });
    tn(out, t, { f: 165 * p, a: 0.35, v: 0.05, h: 0.2, d: 0.8 });
    chime(out, t + 0.26, 880 * p, 0.16, 1.6);
    chime(out, t + 0.4, 1318.5 * p, 0.1, 1.4);
    return 2.1;
  });
  def('kindle', { prio: 3, room: 'mid', gap: 0.5, max: 1, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'white', type: 'bandpass', f: 180 * p, fs: [[0.28, 3200 * p]], q: 0.7, a: 0.03, v: 0.5, h: 0.05, d: 0.4 });
    const roar = gain(0.8); wire(roar, shaper(1.8), out);
    nz(roar, t + 0.05, { k: 'brown', type: 'lowpass', f: 150 * p, fs: [[0.75, 2200 * p], [2.4, 500 * p]], q: 1, a: 0.35, v: 0.9, h: 0.4, d: 1.6 });
    nz(out, t + 0.1, { k: 'crackle', rate: 1.4, type: 'highpass', f: 1200, q: 0, a: 0.3, v: 0.5, h: 0.6, d: 1.2 });
    tn(out, t, { f: 55 * p, f2: 41 * p, ft: 1.5, a: 0.15, v: 0.4, h: 0.4, d: 1.2 });
    choir(out, t + 0.15, [62, 65, 69, 74].map((m) => mf(m) * p), 1.2, { vowel: 'a', a: 0.5, r: 1.3, vel: 0.22 });
    shimmer(out, t + 0.3, [1174.7 * p, 1760 * p, 2349.3 * p], 0.025, 0.6, 0.6, 1.0);
    return 3.1;
  });
  def('kindle_end', { prio: 2, room: 'mid', gap: 0.5, max: 1, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'brown', type: 'lowpass', f: 1600 * p, fs: [[1.2, 170 * p]], q: 0.5, a: 0.04, v: 0.55, h: 0.1, d: 1.1 });
    nz(out, t + 0.05, { k: 'white', type: 'highpass', f: 2600, q: 0, a: 0.05, v: 0.1, h: 0.15, d: 0.9 });
    choir(out, t, [62, 65, 69].map((m) => mf(m) * p), 0.3, { vowel: 'o', a: 0.05, r: 1.2, vel: 0.14, glide: 0.94 });
    return 1.7;
  });
  def('death', { prio: 3, room: 'mid', gap: 1, max: 1, lvl: 1 }, (out, t, p) => {
    tn(out, t, { f: 75 * p, f2: 30 * p, ft: 0.6, a: 0.004, v: 0.8, d: 0.9 });
    [0, 0.12, 0.29, 0.41, 0.58, 0.77, 0.96].forEach((dt, k) => {
      const tt = t + dt + rr(-0.02, 0.02), v = 0.34 * (1 - k * 0.11);
      plate(out, tt, rr(250, 420) * (1 - k * 0.05) * p, v * 0.4, 0.28);
      tn(out, tt, { f: 120 * p, f2: 50 * p, ft: 0.08, a: 0.002, v, d: 0.14 });
      nz(out, tt, { k: 'pink', type: 'lowpass', f: 900, q: 0, a: 0.001, v: v * 0.7, d: 0.09 });
    });
    nz(out, t + 0.1, { k: 'pink', type: 'lowpass', f: 3200 * p, fs: [[2.8, 280 * p]], q: 0, a: 0.25, v: 0.22, h: 0.3, d: 2.4 });
    // the breath leaving him: a breathy drone that sinks two octaves
    const bp = bq('bandpass', 700 * p, 2.5), lp = bq('lowpass', 1400, 0), g = gain(0);
    for (const f of [220, 221.6]) {
      const s = osc('sawtooth', f * p, t + 0.3, t + 4);
      glide(s.frequency, t + 0.3, f * p, t + 3.6, f * p / 4);
      s.connect(bp);
    }
    ahr(g.gain, t + 0.3, 0.5, 0.18, 0.7, 2.3);
    wire(bp, lp, g, out);
    nz(out, t + 0.3, { k: 'white', type: 'bandpass', f: 1300 * p, fs: [[3, 280 * p]], q: 2, a: 0.4, v: 0.12, h: 0.7, d: 2.2 });
    return 4.1;
  });
  def('respawn', { prio: 3, room: 'far', gap: 1, max: 1, lvl: 1 }, (out, t, p) => {
    const pn = panner(0);
    let dst = out;
    if (pn) {
      pn.pan.setValueAtTime(-0.7, t); pn.pan.linearRampToValueAtTime(0.7, t + 1.3); pn.pan.linearRampToValueAtTime(0, t + 1.5);
      pn.connect(out); dst = pn;
    }
    // ash swirling *back* together: reversed envelopes, rising band
    for (const [k, f0, f1, v] of [['pink', 200, 3200, 0.55], ['crackle', 800, 5000, 0.45]]) {
      const s = noise(k, t, t + 1.45);
      const b = bq('bandpass', f0 * p, 1.6);
      glide(b.frequency, t, f0 * p, t + 1.3, f1 * p);
      const g = gain(0);
      g.gain.setValueAtTime(0.002, t);
      g.gain.exponentialRampToValueAtTime(v, t + 1.25);
      g.gain.linearRampToValueAtTime(0, t + 1.36);
      wire(s, b, g, dst);
    }
    bell(out, t + 1.3, 110 * p, 4.5, 0.5, { n: 8 });
    tn(out, t + 1.3, { f: 55 * p, a: 0.01, v: 0.35, d: 2.2 });
    return 5.9;
  });
  def('enemy_die', { prio: 1, room: 'mid', gap: 0.05, max: 3, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'pink', type: 'lowpass', f: 4500 * p, fs: [[0.6, 250 * p]], q: 0, a: 0.005, v: 0.5, d: 0.6 });
    nz(out, t, { k: 'crackle', type: 'bandpass', f: 2500 * p, q: 0.8, a: 0.01, v: 0.45, d: 0.35 });
    grunt(out, t + 0.05, 165 * p, 92 * p, 0.55, 0.1, SIGH);
    return 0.8;
  });
  def('pickup', { prio: 1, room: 'far', gap: 0.06, max: 2, lvl: 1 }, (out, t, p) => {
    chime(out, t, 1318.5 * p, 0.14, 0.7);
    chime(out, t + 0.07, 1975.5 * p, 0.1, 0.6);
    nz(out, t, { k: 'white', type: 'highpass', f: 6000, q: 0, a: 0.001, v: 0.04, d: 0.05 });
    return 0.9;
  });
  def('key_item', { prio: 2, room: 'far', gap: 0.5, max: 1, lvl: 1 }, (out, t, p) => {
    bell(out, t, mf(62) * p, 3.4, 0.45, { n: 9 });           // D — the first interval of the vow motif …
    bell(out, t + 0.7, mf(69) * p, 4, 0.42, { n: 9 });        // … A, a fifth above
    organ(out, t + 0.1, [mf(50) * p, mf(57) * p], 1.2, { a: 0.5, r: 2.2, vel: 0.07, cut: 900 });
    return 4.8;
  });
  def('shrine', { prio: 2, room: 'far', gap: 0.5, max: 1, lvl: 1 }, (out, t, p) => {
    bell(out, t, mf(50) * p, 5, 0.5, { n: 8 });
    shimmer(out, t + 0.2, [mf(86), mf(93), mf(90), mf(98)].map((f) => f * p), 0.02, 0.8, 1.2, 2.0);
    organ(out, t, [mf(38) * p, mf(45) * p], 1.5, { a: 1, r: 2.5, vel: 0.1, cut: 700 });
    return 5.6;
  });
  def('rest', { prio: 2, room: 'mid', gap: 0.5, max: 1, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'pink', type: 'bandpass', f: 900 * p, f2: 480 * p, q: 1, a: 0.3, v: 0.12, h: 0.2, d: 0.9 });
    plate(out, t + 0.35, 380 * p, 0.06, 0.2);
    tn(out, t + 0.4, { f: 90 * p, f2: 55 * p, ft: 0.1, a: 0.003, v: 0.3, d: 0.15 });
    organ(out, t + 0.3, [mf(50), mf(57), mf(66)].map((f) => f * p), 1.2, { a: 0.8, r: 2.2, vel: 0.1, cut: 1100 });
    pops(out, t + 0.6, 3, 0.05);
    return 4.2;
  });
  def('door', { prio: 1, room: 'mid', gap: 0.2, max: 2, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'white', type: 'highpass', f: 3000, q: 0, a: 0.0006, v: 0.2, d: 0.02 });
    const s = osc('sawtooth', 110 * p, t, t + 0.55);
    const fp = s.frequency;
    fp.setValueAtTime(fq(110 * p), t);
    for (let k = 1; k <= 6; k++) fp.linearRampToValueAtTime(fq(rr(88, 160) * p), t + k * 0.07);
    const g = gain(0);
    ahr(g.gain, t + 0.03, 0.05, 0.3, 0.25, 0.15);
    const mix = gain(1);
    wire(s, mix);
    wire(mix, bq('bandpass', 900 * p, 5), g);
    wire(mix, bq('bandpass', 1800 * p, 6), gain(0.6), g);
    g.connect(out);
    tn(out, t + 0.42, { f: 85 * p, f2: 50 * p, ft: 0.1, a: 0.002, v: 0.5, d: 0.25 });
    nz(out, t + 0.42, { k: 'pink', type: 'lowpass', f: 500, q: 0, a: 0.002, v: 0.35, d: 0.15 });
    return 0.9;
  });
  def('locked', { prio: 1, room: 'dry', gap: 0.25, max: 1, lvl: 1 }, (out, t, p) => {
    for (const dt of [0, 0.08, 0.17]) {
      nz(out, t + dt, { k: 'white', type: 'bandpass', f: 1800 * p, q: 2, a: 0.001, v: 0.35, d: 0.04 });
      tn(out, t + dt, { f: rr(860, 940) * p, a: 0.001, v: 0.08, d: 0.06 });
    }
    tn(out, t + 0.2, { f: 140 * p, f2: 90 * p, ft: 0.06, a: 0.002, v: 0.25, d: 0.08 });
    return 0.45;
  });
  def('ui_move', { prio: 0, room: 'dry', gap: 0.025, max: 2, lvl: 1 }, (out, t, p) => {
    tn(out, t, { f: 1150 * p, a: 0.001, v: 0.09, d: 0.05 });
    nz(out, t, { k: 'white', type: 'bandpass', f: 3000 * p, q: 1.5, a: 0.0005, v: 0.04, d: 0.012 });
    return 0.1;
  });
  def('ui_select', { prio: 1, room: 'mid', gap: 0.05, max: 2, lvl: 1 }, (out, t, p) => {
    pluck(out, t, 69, 0.3, { rate: p, len: 0.8 });
    chime(out, t + 0.01, 880 * p, 0.08, 0.5);
    return 0.85;
  });
  def('ui_back', { prio: 1, room: 'dry', gap: 0.05, max: 2, lvl: 1 }, (out, t, p) => {
    tn(out, t, { f: 700 * p, f2: 470 * p, ft: 0.1, a: 0.002, v: 0.12, d: 0.14 });
    nz(out, t, { k: 'white', type: 'bandpass', f: 2200 * p, q: 1.2, a: 0.0005, v: 0.035, d: 0.015 });
    return 0.2;
  });
  def('ui_open', { prio: 1, room: 'mid', gap: 0.1, max: 1, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'pink', type: 'bandpass', f: 500 * p, f2: 1600 * p, q: 1, a: 0.08, v: 0.12, d: 0.22 });
    tn(out, t + 0.05, { f: 440 * p, a: 0.01, v: 0.07, d: 0.5 });
    tn(out, t + 0.05, { f: 660 * p, a: 0.01, v: 0.045, d: 0.45 });
    return 0.6;
  });
  def('boss_intro', { prio: 3, room: 'far', gap: 2, max: 1, lvl: 1 }, (out, t, p) => {
    bell(out, t, 55 * p, 9, 0.85, { n: 10, big: true });
    tn(out, t, { f: 41.2 * p, a: 0.06, v: 0.5, h: 0.5, d: 4 });
    nz(out, t, { k: 'brown', type: 'lowpass', f: 110, q: 0, a: 0.9, v: 0.6, h: 1, d: 4.5 });
    nz(out, t, { k: 'pink', type: 'lowpass', f: 900, q: 0, a: 0.002, v: 0.45, d: 0.35 });
    return 9.5;
  });
  def('boss_die', { prio: 3, room: 'far', gap: 2, max: 1, lvl: 1 }, (out, t, p) => {
    tn(out, t, { f: 85 * p, f2: 27 * p, ft: 1, a: 0.004, v: 0.9, d: 1.4 });
    nz(out, t, { k: 'brown', type: 'lowpass', f: 420, q: 0, a: 0.01, v: 0.75, h: 0.3, d: 2.6 });
    nz(out, t + 0.05, { k: 'pink', type: 'lowpass', f: 5200 * p, fs: [[3.6, 220 * p]], q: 0, a: 0.05, v: 0.35, h: 0.3, d: 3.3 });
    nz(out, t, { k: 'crackle', type: 'highpass', f: 1400, q: 0, a: 0.01, v: 0.55, h: 0.5, d: 2.2 });
    // what was bound in it rises and goes home
    [587.3, 880, 1174.7, 1760].forEach((f, k) => tn(out, t + 1 + k * 0.35, { f: f * p, f2: f * 1.5 * p, ft: 3.2, a: 1, v: 0.035, h: 0.6, d: 2 }));
    return 6.2;
  });
  def('bell', { prio: 1, room: 'far', gap: 0.15, max: 3, lvl: 1 }, (out, t, p) => {
    bell(out, t, 330 * p * rr(0.995, 1.005), 4.5, 0.55, { n: 9 });
    return 4.6;
  });
  def('bell_big', { prio: 2, room: 'far', gap: 0.4, max: 2, lvl: 1 }, (out, t, p) => {
    bell(out, t, 98 * p, 8.5, 0.7, { n: 10, big: true });
    tn(out, t, { f: 49 * p, a: 0.02, v: 0.3, d: 5 });
    return 8.6;
  });
  def('whoosh', { prio: 1, room: 'mid', gap: 0.06, max: 3, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'pink', type: 'bandpass', f: 250 * p, fs: [[0.25, 1100 * p], [0.6, 350 * p]], q: 0.9, a: 0.2, v: 0.6, h: 0.05, d: 0.35 });
    nz(out, t, { k: 'brown', type: 'lowpass', f: 300 * p, q: 0, a: 0.2, v: 0.35, d: 0.35 });
    return 0.65;
  });
  def('projectile', { prio: 1, room: 'mid', gap: 0.05, max: 4, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'white', type: 'bandpass', f: 3500 * p, f2: 900 * p, q: 1.5, a: 0.005, v: 0.35, d: 0.2 });
    tn(out, t, { f: 700 * p, f2: 280 * p, ft: 0.15, a: 0.002, v: 0.12, d: 0.15 });
    nz(out, t, { k: 'crackle', type: 'highpass', f: 1500, q: 0, a: 0.01, v: 0.3, d: 0.3 });
    nz(out, t, { k: 'brown', type: 'lowpass', f: 600, q: 0, a: 0.02, v: 0.25, d: 0.3 });
    return 0.5;
  });
  def('slam', { prio: 2, room: 'mid', gap: 0.08, max: 2, lvl: 1 }, (out, t, p) => {
    const bus = gain(0.8); wire(bus, shaper(2.5), out);
    tn(bus, t, { f: 90 * p, f2: 28 * p, ft: 0.3, a: 0.003, v: 1, d: 0.7 });
    nz(bus, t, { k: 'brown', type: 'lowpass', f: 500, q: 0, a: 0.002, v: 0.8, d: 0.5 });
    nz(out, t, { k: 'crackle', rate: 0.7, type: 'lowpass', f: 2500, q: 0, a: 0.005, v: 0.55, d: 0.8 });
    for (let k = 0; k < 5; k++) nz(out, t + rr(0.05, 0.6), { k: 'white', type: 'bandpass', f: rr(1500, 3500), q: 2, a: 0.0005, v: rr(0.04, 0.12), d: 0.03 });
    return 1.3;
  });
  const VFORM = { a: [730, 1090, 2440], o: [570, 840, 2410], u: [320, 870, 2240], e: [530, 1840, 2480], i: [300, 2200, 2950] };
  def('roar', { prio: 2, room: 'mid', gap: 0.3, max: 2, lvl: 1 }, (out, t, p) => {
    const end = t + 1.9, mix = gain(0.5);
    const am = osc('sine', rr(24, 32), t, end), amg = gain(0.5); wire(am, amg, mix.gain);
    for (const f of [72, 75.5, 108]) {
      const s = osc('sawtooth', f * p, t, end);
      path(s.frequency, t, f * p * 0.85, [[0.3, f * p * 1.1], [1.5, f * p * 0.78]]);
      s.connect(mix);
    }
    const drive = shaper(3), out2 = gain(0);
    mix.connect(drive);
    [0, 1, 2].forEach((k) => {
      const b = bq('bandpass', VFORM.a[k], 6);
      b.frequency.setValueAtTime(VFORM.a[k], t);
      b.frequency.linearRampToValueAtTime(VFORM.o[k], t + 1.4);
      wire(drive, b, gain([1, 0.6, 0.25][k] * 2.5), out2);
    });
    ahr(out2.gain, t, 0.12, 0.6, 0.6, 0.7);
    out2.connect(out);
    nz(out, t, { k: 'pink', type: 'bandpass', f: 900, q: 1, a: 0.1, v: 0.25, h: 0.6, d: 0.6 });
    return 1.8;
  });
  def('growl', { prio: 1, room: 'mid', gap: 0.2, max: 2, lvl: 1 }, (out, t, p) => {
    const end = t + 1.1, mix = gain(0.5);
    const am = osc('sine', rr(15, 19), t, end), amg = gain(0.5); wire(am, amg, mix.gain);
    for (const f of [58, 61.2]) { const s = osc('sawtooth', f * p, t, end); glide(s.frequency, t, f * p, t + 1, f * p * 0.85); s.connect(mix); }
    const lp = bq('lowpass', 700, 3), g = gain(0);
    ahr(g.gain, t, 0.08, 0.5, 0.4, 0.5);
    wire(mix, lp, g, out);
    nz(out, t, { k: 'pink', type: 'bandpass', f: 500, q: 1.2, a: 0.08, v: 0.12, h: 0.35, d: 0.45 });
    return 1.05;
  });
  def('moth', { prio: 0, room: 'mid', gap: 0.08, max: 3, lvl: 1 }, (out, t, p) => {
    const end = t + 0.65, s = noise('white', t, end);
    const bp = bq('bandpass', 1600 * p, 1.5);
    path(bp.frequency, t, 1600 * p, [[0.2, rr(1300, 2200) * p], [0.5, rr(1300, 2200) * p]]);
    const flap = gain(0.5), l = osc('square', rr(20, 30), t, end), lg = gain(0.5);
    wire(l, lg, flap.gain);
    const g = gain(0);
    ahr(g.gain, t, 0.1, 0.16, 0.2, 0.3);
    wire(s, bp, flap, g, out);
    return 0.65;
  });
  def('splash', { prio: 1, room: 'mid', gap: 0.08, max: 3, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'white', type: 'bandpass', f: 1400 * p, q: 0.7, a: 0.003, v: 0.5, d: 0.35 });
    nz(out, t, { k: 'pink', type: 'lowpass', f: 700 * p, q: 0, a: 0.005, v: 0.4, d: 0.3 });
    nz(out, t + 0.02, { k: 'white', type: 'highpass', f: 3000, q: 0, a: 0.01, v: 0.12, d: 0.4 });
    for (let k = 0; k < 4; k++) drip(out, t + rr(0.05, 0.5), rr(600, 1500) * p, rr(0.04, 0.09));
    return 0.8;
  });
  def('snuff', { prio: 2, room: 'far', gap: 0.3, max: 2, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'white', type: 'highpass', f: 4000, q: 0, a: 0.0005, v: 0.35, d: 0.012 });
    nz(out, t, { k: 'white', type: 'bandpass', f: 2500 * p, q: 3, a: 0.001, v: 0.15, d: 0.03 });
    nz(out, t + 0.01, { k: 'white', type: 'bandpass', f: 3500 * p, f2: 1800 * p, q: 1.2, a: 0.01, v: 0.12, h: 0.05, d: 0.9 });
    tn(out, t + 0.01, { f: 1100 * p, f2: 880 * p, ft: 0.6, a: 0.005, v: 0.03, d: 0.7 });
    chime(out, t + 0.22, 1760 * p, 0.05, 1.6);   // the flame, going home
    return 2.1;
  });
  def('whisper', { prio: 1, room: 'far', gap: 0.35, max: 2, lvl: 1 }, (out, t, p, o) => {
    let dst = out;
    if (!o.pan) { const pn = panner(rr(-0.6, 0.6)); if (pn) { pn.connect(out); dst = pn; } }
    const syl = [];
    let tt = t;
    const n = 4 + Math.floor(rnd() * 4);
    for (let s = 0; s < n; s++) {
      const d = rr(0.16, 0.3);
      syl.push({ t: tt, d, v: VFORM[pick(['a', 'e', 'i', 'o', 'u'])], lv: rr(0.5, 1) });
      tt += d + (chance(0.25) ? rr(0.05, 0.15) : 0);
    }
    const end = tt + 0.15;
    const src = noise('white', t, end), hp = bq('highpass', 500, 0), envg = gain(0);
    src.connect(hp);
    [[1, 6], [0.7, 8], [0.35, 10]].forEach(([amp, q], k) => {
      const b = bq('bandpass', syl[0].v[k] * p, q);
      b.frequency.setValueAtTime(fq(syl[0].v[k] * p), t);
      for (const s of syl) b.frequency.linearRampToValueAtTime(fq(s.v[k] * p), s.t + s.d * 0.4);
      wire(hp, b, gain(amp * 2), envg);
    });
    const e = envg.gain;
    e.setValueAtTime(0, t);
    for (const s of syl) { e.linearRampToValueAtTime(0.3 * s.lv, s.t + s.d * 0.35); e.linearRampToValueAtTime(0.03, s.t + s.d); }
    e.linearRampToValueAtTime(0, end);
    envg.connect(dst);
    return end - t + 0.05;
  });
  def('quest', { prio: 2, room: 'far', gap: 0.5, max: 1, lvl: 1 }, (out, t, p) => {
    [62, 65, 69].forEach((m, k) => pluck(out, t + k * 0.13, m, 0.32, { rate: p }));
    chime(out, t + 0.42, mf(74) * p, 0.09, 1.8);
    return 2.4;
  });
  def('chapter', { prio: 3, room: 'far', gap: 2, max: 1, lvl: 1 }, (out, t, p) => {
    bell(out, t, mf(38) * p, 7, 0.5, { n: 9, big: true });
    pad(out, t + 0.1, [38, 45, 50, 53, 57, 62].map((m) => mf(m) * p), 3.5, { a: 2.2, r: 3.5, cut: 280, cut2: 1300, q: 1, vel: 0.3 });
    choir(out, t + 0.4, [50, 57, 65].map((m) => mf(m) * p), 3.2, { vowel: 'o', a: 2.2, r: 3.5, vel: 0.2 });
    return 7.8;
  });
  def('break_wall', { prio: 2, room: 'mid', gap: 0.3, max: 2, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'white', type: 'highpass', f: 1500, q: 0, a: 0.0005, v: 0.5, d: 0.05 });
    tn(out, t, { f: 70 * p, f2: 30 * p, ft: 0.35, a: 0.003, v: 0.85, d: 0.5 });
    nz(out, t, { k: 'brown', type: 'lowpass', f: 600, q: 0, a: 0.003, v: 0.8, d: 0.6 });
    nz(out, t + 0.02, { k: 'crackle', rate: 0.8, type: 'bandpass', f: 1200, q: 0.6, a: 0.01, v: 0.8, h: 0.3, d: 1.2 });
    for (let k = 0; k < 8; k++) nz(out, t + rr(0.2, 1.6), { k: 'white', type: 'bandpass', f: rr(1500, 4000), q: 2, a: 0.0005, v: rr(0.03, 0.1), d: 0.03 });
    nz(out, t + 0.1, { k: 'pink', type: 'lowpass', f: 2000, f2: 400, q: 0, a: 0.1, v: 0.15, h: 0.3, d: 1.2 });
    return 2.1;
  });
  def('penny', { prio: 1, room: 'mid', gap: 0.03, max: 4, lvl: 1 }, (out, t, p) => {
    const f = rr(1950, 2250) * p;
    plate(out, t, f, 0.3, 0.5, COIN);
    plate(out, t + rr(0.05, 0.08), f * rr(1.02, 1.08), 0.2, 0.45, COIN);
    if (chance(0.5)) plate(out, t + rr(0.12, 0.17), f * rr(0.96, 1.04), 0.1, 0.35, COIN);
    return 0.7;
  });
  def('fire', { prio: 1, room: 'mid', gap: 0.1, max: 3, lvl: 1 }, (out, t, p) => {
    nz(out, t, { k: 'brown', type: 'lowpass', f: 200 * p, fs: [[0.2, 1400 * p], [1.1, 500 * p]], q: 0.5, a: 0.15, v: 0.6, h: 0.2, d: 0.8 });
    nz(out, t + 0.05, { k: 'crackle', type: 'highpass', f: 1500, q: 0, a: 0.05, v: 0.5, h: 0.3, d: 0.7 });
    nz(out, t, { k: 'white', type: 'bandpass', f: 2500 * p, q: 0.5, a: 0.1, v: 0.08, h: 0.2, d: 0.6 });
    return 1.3;
  });
  // 'text' is routed to A.text (it is in the sfx list for the action `sfx:text`)
  SFX.text = { prio: 0, room: 'dry', gap: 0.03, max: 3, lvl: 1, fn: null };

  // ================================================================ music
  // A track: { bpm, cycle (beats), level, start(T, t), compose(T, cycleIndex, firstBeat), tick(T, t, beat) }.
  // compose() is called at the first beat of every cycle and queues events with T.at(beat, fn(time)).
  const TRACKS = {};
  function track(id, d) { TRACKS[id] = d; }

  // the vow — a leap of a fifth, then the long fall home. Degrees in semitones from the tonic, lengths in beats.
  const LEIT_A = [[0, 2], [7, 2], [8, 1], [7, 1], [5, 2], [3, 1], [2, 3]];          // question (ends on 2)
  const LEIT_B = [[0, 2], [7, 2], [5, 1], [3, 1], [2, 2], [3, 1], [0, 3]];          // answer (home)
  const LEIT_A_SWEET = [[0, 2], [7, 2], [8, 1], [7, 1], [5, 2], [4, 1], [2, 3]];    // major key, borrowed ♭6
  const LEIT_A_MAJ = [[0, 2], [7, 2], [9, 1], [7, 1], [5, 2], [4, 1], [2, 3]];
  const LEIT_B_MAJ = [[0, 2], [7, 2], [5, 1], [4, 1], [2, 2], [4, 1], [0, 3]];
  const LEIT_A_DARK = [[0, 2], [6, 2], [7, 1], [6, 1], [5, 2], [3, 1], [1, 3]];     // tritone, ♭2
  const LEIT_B_DARK = [[0, 2], [6, 2], [5, 1], [3, 1], [1, 2], [3, 1], [-1, 3]];    // never comes home

  const CH = {
    Dm: [50, 57, 62, 65], Bb: [46, 53, 58, 62], Gm: [43, 50, 55, 58], A: [45, 52, 57, 61],
    D: [50, 57, 62, 66], Bm: [47, 54, 59, 62], G: [43, 50, 55, 59],
    Cm: [48, 55, 60, 63], Ab: [44, 51, 56, 60], Fm: [41, 48, 53, 56],
  };
  const freqs = (ms) => ms.map(mf);

  function phrase(T, beat, notes, fn) {
    let b = beat;
    notes.forEach(([deg, len], k) => { T.at(b, (t) => fn(t, deg, len * T.spb, k)); b += len; });
    return b;
  }
  // persistent sources owned by a track or an ambience bed (stopped when it fades out)
  function keepOsc(T, type, f, t) {
    const o = ctx.createOscillator();
    if (type === 'organ' || type === 'reed' || type === 'flute') o.setPeriodicWave(wave(type)); else o.type = type;
    o.frequency.value = fq(f);
    o.start(t);
    T.srcs.push(o);
    return o;
  }
  function keepNoise(T, kind, t) {
    const b = noiseBuf(kind), s = ctx.createBufferSource();
    s.buffer = b; s.loop = true;
    s.start(t, rnd() * b.duration * 0.9);
    T.srcs.push(s);
    return s;
  }
  function lfo(T, param, rate, depth, t) {
    const l = keepOsc(T, 'sine', rate, t), g = gain(depth);
    wire(l, g, param);
    return l;
  }
  function drone(T, type, f, level, dst, t, o) {
    const s = keepOsc(T, type, f, t), g = gain(level);
    wire(s, g, dst);
    if (o && o.lfo) lfo(T, g.gain, o.lfo, o.depth, t);
    return s;
  }

  // ---------------------------------------------------------------- title: a slow lament, the vow motif alone
  track('title', {
    bpm: 54, cycle: 32, level: 1,
    start(T, t) {
      const lp = bq('lowpass', 380, 0); lp.connect(T.mid);
      drone(T, 'triangle', mf(38), 0.1, lp, t, { lfo: 0.05, depth: 0.035 });
      drone(T, 'sine', mf(45), 0.05, lp, t);
    },
    compose(T, c, b0) {
      const chords = [[0, 'Dm', 4], [4, 'Bb', 4], [8, 'Dm', 4], [12, 'Gm', 4], [16, 'A', 4], [20, 'Dm', 4], [24, 'Bb', 2], [26, 'A', 2], [28, 'Dm', 4]];
      for (const [b, ch, len] of chords) T.at(b0 + b, (t) => pad(T.mid, t, freqs(CH[ch]), len * T.spb, { a: 1.6, r: 2.6, cut: 820, vel: 0.12 }));
      const mode = [1, 2, 0, 3][c % 4];
      if (mode === 0 || mode === 3 || c === 0) T.at(b0, (t) => bell(T.far, t, mf(50), 6, 0.14, { n: 8 }));
      if (mode === 1) {
        phrase(T, b0 + 8, LEIT_A, (t, m, d) => bowed(T.echo, t, mf(62 + m), d * 0.96, { vel: 0.15 }));
        phrase(T, b0 + 20, LEIT_B, (t, m, d) => bowed(T.echo, t, mf(62 + m), d * 0.96, { vel: 0.15 }));
      } else if (mode === 2) {
        phrase(T, b0 + 8, LEIT_A, (t, m) => pluck(T.echo, t, 62 + m, 0.34));
        phrase(T, b0 + 20, LEIT_B, (t, m, d, k) => { pluck(T.echo, t, 62 + m, 0.34); if (k === 0 || k === 6) pluck(T.mid, t, 50 + m, 0.2); });
      } else if (mode === 3) {
        phrase(T, b0 + 8, LEIT_A.slice(0, 4), (t, m) => bell(T.far, t, mf(74 + m), 4, 0.08, { n: 6 }));
      }
    },
  });

  // ---------------------------------------------------------------- village: tender, sparse bells, distant organ
  track('village', {
    bpm: 60, cycle: 16, level: 1,
    start(T, t) {
      const lp = bq('lowpass', 320, 0); lp.connect(T.far);
      drone(T, 'sine', mf(38), 0.1, lp, t, { lfo: 0.07, depth: 0.035 });
      drone(T, 'organ', mf(50), 0.03, lp, t);
    },
    compose(T, c, b0) {
      const prog = [[50, 57, 64, 65], [46, 53, 57, 62], [53, 57, 60, 65], [48, 55, 62, 64]];
      const ch = prog[c % 4];
      T.at(b0, (t) => organ(T.far, t, freqs(ch), 16 * T.spb, { a: 3, r: 4, vel: 0.12, cut: 1300 }));
      if (c % 4 === 3) {
        phrase(T, b0 + 2, LEIT_B.slice(0, 5), (t, m) => bell(T.far, t, mf(74 + m), 3.5, 0.07, { n: 6 }));
      } else if (chance(0.6)) {
        const s = pick([1, 2, 5]);
        ch.forEach((m, k) => T.at(b0 + s + k * 1.5, (t) => pluck(T.echo, t, m + 12, 0.16 * (1 - k * 0.12))));
      }
    },
    tick(T, t, i) {
      if (i % 16 > 1 && chance(0.13)) bell(T.far, t + rr(0, 0.5) * T.spb, mf(pick([74, 77, 79, 81, 84])), 3, rr(0.035, 0.07), { n: 6 });
    },
  });

  // ---------------------------------------------------------------- hushwood: fog, glass, something breathing
  track('hushwood', {
    bpm: 50, cycle: 24, level: 1,
    start(T, t) {
      const n = keepNoise(T, 'pinkS', t), bp = bq('bandpass', 1500, 0.9);
      lfo(T, bp.frequency, 0.031, 650, t); lfo(T, bp.frequency, 0.083, 280, t);
      wire(n, bp, gain(0.12), T.far);
      const lp = bq('lowpass', 420, 0); lp.connect(T.mid);
      drone(T, 'sine', mf(40), 0.09, lp, t, { lfo: 0.09, depth: 0.045 });
      drone(T, 'sine', mf(40) * 1.004, 0.05, lp, t);
      drone(T, 'sine', mf(47), 0.035, lp, t, { lfo: 0.061, depth: 0.025 });
    },
    compose(T, c, b0) {
      if (chance(0.6)) T.at(b0 + rr(8, 14), (t) => slip(T.far, t, mf(46), mf(45), 7, 0.09));
      if (chance(0.45)) T.at(b0 + 4, (t) => choir(T.far, t, [mf(64), mf(71)], 6 * T.spb, { vowel: 'u', a: 3, r: 4, vel: 0.06 }));
    },
    tick(T, t) {
      if (chance(0.34)) {
        const m = pick([76, 78, 82, 83, 87, 88, 90]), tt = t + rr(0, 0.6) * T.spb;
        const o = { a: rr(0.3, 0.9), vel: rr(0.025, 0.05), r: rr(2, 3.5) };
        glass(T.echo, tt, mf(m), rr(1.5, 3), o);
        if (chance(0.15)) glass(T.echo, tt + 0.4, mf(m + 1), 2, o);
      }
    },
  });

  // ---------------------------------------------------------------- abbey: plainchant in organum, drowned bells
  const CHANTS = [
    [[0, 2], [3, 1], [5, 1], [7, 2], [7, 1], [9, 1], [7, 2], [5, 1], [3, 1], [5, 2], [3, 1], [2, 1], [0, 4]],
    [[7, 2], [7, 1], [10, 1], [9, 2], [7, 2], [5, 1], [7, 1], [3, 2], [2, 2], [0, 4]],
    [[0, 1], [2, 1], [3, 2], [5, 2], [3, 1], [2, 1], [0, 2], [-2, 2], [0, 4]],
    [[5, 2], [7, 2], [9, 1], [7, 1], [5, 2], [3, 2], [5, 1], [3, 1], [2, 2], [0, 4]],
  ];
  track('abbey', {
    bpm: 46, cycle: 32, level: 1,
    start(T, t) {
      const lp = bq('lowpass', 440, 0); lp.connect(T.far);
      drone(T, 'organ', mf(38), 0.06, lp, t, { lfo: 0.05, depth: 0.025 });
      drone(T, 'organ', mf(45), 0.04, lp, t);
    },
    compose(T, c, b0) {
      const vowel = pick(['a', 'o']);
      phrase(T, b0 + 2, CHANTS[c % CHANTS.length], (t, m, d) => choir(T.mid, t, [mf(50 + m), mf(45 + m)], d, { vowel, a: 0.22, r: 0.7, vel: 0.13 }));
      for (let k = 0; k < 2; k++) {
        if (chance(0.7)) T.at(b0 + rr(0, 30), (t) => bell(T.far, t, mf(pick([62, 57, 65, 69])), 6, 0.12, { n: 7, lp: 650, wobble: 18 }));
      }
    },
  });

  // ---------------------------------------------------------------- greyharrow: wind singing in pikes, far drums
  track('greyharrow', {
    bpm: 64, cycle: 16, level: 1,
    start(T, t) {
      const n = keepNoise(T, 'pinkS', t);
      for (const [m, q, lv, r] of [[45, 30, 1.4, 0.05], [52, 30, 1.0, 0.07], [57, 35, 0.6, 0.041]]) {
        const g = gain(lv);
        lfo(T, g.gain, r, lv * 0.8, t);
        wire(n, bq('bandpass', mf(m), q), g, T.far);
      }
      const n2 = keepNoise(T, 'brownS', t), g2 = gain(0.3);
      lfo(T, g2.gain, 0.06, 0.18, t);
      wire(n2, bq('lowpass', 400, 0), g2, T.mid);
      const lp = bq('lowpass', 260, 0); lp.connect(T.mid);
      drone(T, 'sawtooth', mf(33), 0.06, lp, t, { lfo: 0.08, depth: 0.03 });
      drone(T, 'sawtooth', mf(33) * 1.003, 0.045, lp, t);
    },
    compose(T, c, b0) {
      for (let bar = 0; bar < 4; bar++) {
        if (chance(0.25)) continue;
        const bb = b0 + bar * 4;
        T.at(bb, (t) => taiko(T.far, t, 0.8, { p: 0.7, lp: 260, decay: 1.2 }));
        if (chance(0.7)) T.at(bb + 1.5, (t) => taiko(T.far, t, 0.45, { p: 0.7, lp: 260, decay: 1.2 }));
        if (chance(0.2)) T.at(bb + 2.5, (t) => taiko(T.far, t, 0.3, { p: 0.72, lp: 260, decay: 1 }));
      }
      if (c % 2 === 1) phrase(T, b0 + 2, [[0, 3], [7, 3], [8, 1.5], [7, 4.5]], (t, m, d) => brass(T.far, t, mf(45 + m), d, { vel: 0.14, a: 0.6, r: 1.6 }));
    },
  });

  // ---------------------------------------------------------------- city: ruined grandeur, a broken processional
  track('city', {
    bpm: 58, cycle: 32, level: 1,
    start(T, t) {
      const lp = bq('lowpass', 180, 0); lp.connect(T.mid);
      drone(T, 'sawtooth', mf(24), 0.07, lp, t, { lfo: 0.05, depth: 0.03 });
    },
    compose(T, c, b0) {
      [['Cm', 36], ['Ab', 32], ['Fm', 29], ['Cm', 31]].forEach(([ch, bass], k) => {
        const notes = k === 3 ? [43, 50, 55, 59] : CH[ch];          // last chord: G major, the dominant
        T.at(b0 + k * 8, (t) => {
          pad(T.mid, t, freqs(notes), 8 * T.spb, { a: 1.5, r: 2.5, cut: 350, cut2: 1100, q: 2, vel: 0.14 });
          tone(T.mid, t, mf(bass), 8 * T.spb, { a: 0.8, r: 2, vel: 0.1 });
        });
      });
      T.at(b0, (t) => bell(T.far, t, mf(48), 6, 0.14, { n: 8 }));
      for (let b = 0; b < 32; b++) {
        const on = b % 2 === 0;
        if (chance(on ? 0.2 : 0.35)) continue;                     // steps missing from the procession
        T.at(b0 + b, (t) => (on ? taiko(T.mid, t, rr(0.5, 0.7), { p: 0.8, lp: 500, decay: 0.7 }) : brush(T.mid, t, rr(0.25, 0.4))));
        if (chance(0.08)) T.at(b0 + b + 0.5, (t) => brush(T.mid, t, 0.2));
      }
      if (c % 2 === 1) {
        const n = pick([3, 4, 5]);                                  // the fanfare never finishes
        phrase(T, b0 + 8, LEIT_A.slice(0, n), (t, m, d) => brass(T.echo, t, mf(60 + m), d * 0.9, { vel: 0.12, a: 0.08, r: 0.9, bright: 7 }));
      }
    },
  });

  // ---------------------------------------------------------------- wickward: near silence; a heart; a music box
  track('wickward', {
    bpm: 50, cycle: 32, level: 1,
    start(T, t) {
      const lp = bq('lowpass', 120, 0); lp.connect(T.mid);
      drone(T, 'sine', mf(26), 0.14, lp, t, { lfo: 0.04, depth: 0.06 });
      const n = keepNoise(T, 'brownS', t);
      wire(n, bq('lowpass', 220, 0), gain(0.1), T.far);
    },
    compose(T, c, b0) {
      if (c === 0 || chance(0.7)) {
        const count = pick([3, 4, 4, 5, 6]);
        let b = b0 + rr(4, 10);
        LEIT_A.slice(0, count).forEach(([m, len], k) => {
          T.at(b, (t) => mbox(T.echo, t, mf(86 + m), 0.12));
          b += len * 0.42 * (1 + 0.22 * k);                          // the spring running down
        });
      }
    },
    tick(T, t, i) {
      const b = i % 32;
      if (b < 28 && !chance(0.08)) heart(T.mid, t, 0.55);
      if (chance(0.35)) pops(T.far, t + rnd() * T.spb, 1 + Math.floor(rnd() * 2), 0.06);
      if (chance(0.05)) tin(T.far, t + rnd() * T.spb, 0.03);
    },
  });

  // ---------------------------------------------------------------- pyre: the fire that never went out
  track('pyre', {
    bpm: 40, cycle: 16, level: 1,
    start(T, t) {
      const n = keepNoise(T, 'brownS', t), g = gain(0.55);
      lfo(T, g.gain, 0.11, 0.22, t);
      wire(n, bq('lowpass', 240, 1), g, T.mid);
      const n2 = keepNoise(T, 'pinkS', t), g2 = gain(0.07);
      lfo(T, g2.gain, 3.7, 0.025, t);
      wire(n2, bq('bandpass', 750, 0.8), g2, T.far);
      const lp = bq('lowpass', 220, 2);
      lfo(T, lp.frequency, 0.045, 120, t);
      lp.connect(T.mid);
      drone(T, 'sawtooth', mf(26), 0.08, lp, t);
      drone(T, 'sawtooth', mf(32), 0.05, lp, t);
      drone(T, 'sawtooth', mf(38) * 1.004, 0.04, lp, t);
    },
    compose(T, c, b0) {
      T.at(b0, (t) => choir(T.far, t, [mf(50), mf(51), mf(57)], 11 * T.spb, { vowel: 'o', a: 5, r: 6, vel: 0.08 }));
      if (chance(0.75)) T.at(b0 + 8, (t) => bell(T.far, t, mf(38), 9, 0.22, { big: true, n: 7 }));
    },
    tick(T, t) {
      if (chance(0.4)) pops(T.far, t + rnd() * T.spb, 1 + Math.floor(rnd() * 3), 0.07);
    },
  });

  // ---------------------------------------------------------------- cave: drips and the stone breathing
  track('cave', {
    bpm: 60, level: 1,
    start(T, t) {
      const n = keepNoise(T, 'brownS', t), g = gain(0.14);
      lfo(T, g.gain, 0.05, 0.06, t);
      wire(n, bq('lowpass', 160, 0), g, T.far);
      T.st.pools = [rr(900, 1300), rr(1400, 1900), rr(2000, 2600)];
      T.st.toneEnd = 0;
    },
    tick(T, t) {
      if (chance(0.5)) {
        const n = chance(0.2) ? 2 : 1;
        for (let k = 0; k < n; k++) drip(T.echo, t + rnd() * T.spb, pick(T.st.pools) * rr(0.97, 1.03), rr(0.06, 0.16));
      }
      if (t > T.st.toneEnd && chance(0.15)) {
        const dur = rr(5, 9);
        tone(T.far, t, mf(pick([31, 33, 36, 38, 40])), dur, { a: 2.2, r: 3.5, vel: 0.12 });
        T.st.toneEnd = t + dur * 0.8;
      }
    },
  });

  // ---------------------------------------------------------------- boss: taiko, low saws, dissonant stabs
  track('boss', {
    bpm: 124, cycle: 32, level: 1,
    start(T, t) {
      const f = bq('lowpass', 300, 4), g = gain(0.16);
      wire(f, g, T.dry);
      const s1 = keepOsc(T, 'sawtooth', mf(26), t), s2 = keepOsc(T, 'sawtooth', mf(26), t);
      s2.detune.value = 10;
      s1.connect(f); s2.connect(f);
      T.st.bass = [s1, s2]; T.st.bassF = f;
    },
    compose(T, c, b0) {
      const roots = [26, 27, 26, 24];                                  // D  E♭  D  C
      const chords = [[50, 57, 62, 65], [51, 58, 63, 67], [50, 57, 62, 65], [48, 55, 60, 63]];
      const pat = [0, 0, 12, 0, 1, 0, 7, 0];
      for (let bar = 0; bar < 8; bar++) {
        const bb = b0 + bar * 4, h = bar >> 1, root = roots[h];
        T.at(bb, (t) => { for (const s of T.st.bass) s.frequency.setValueAtTime(mf(root), t); });
        for (let q = 0; q < 4; q++) T.at(bb + q, (t) => glide(T.st.bassF.frequency, t, 950, t + T.spb * 0.9, 220));
        if (bar % 2 === 0) T.at(bb, (t) => pad(T.mid, t, freqs(chords[h]), 8 * T.spb, { a: 0.4, r: 1.2, cut: 900, vel: 0.1 }));
        if (bar === 7 && c % 2 === 1) {
          for (let e = 0; e < 8; e++) T.at(bb + e * 0.5, (t) => tom(T.dry, t, 0.3 + e * 0.08, e < 4 ? 190 : 145));
          T.at(bb, (t) => taiko(T.dry, t, 1));
        } else {
          [[0, 1], [1.5, 0.85], [3, 0.9]].forEach(([o, v]) => T.at(bb + o, (t) => taiko(T.dry, t, v)));
          [1, 2.5, 3.5].forEach((o) => T.at(bb + o, (t) => tom(T.dry, t, 0.22, 200)));
        }
        pat.forEach((d, e) => T.at(bb + e * 0.5, (t) => pluck(T.dry, t, root + 24 + d, e === 0 ? 0.3 : 0.18, { bright: true, len: 0.3 })));
        if ((bar === 3 || bar === 7) && chance(0.85)) T.at(bb, (t) => stab(T.mid, t, freqs([62, 63, 69]), 0.2));
      }
    },
  });

  // ---------------------------------------------------------------- boss_final: the vow, corrupted, sung by the ash
  track('boss_final', {
    bpm: 72, cycle: 32, level: 1,
    start(T, t) {
      const lp = bq('lowpass', 260, 2);
      lfo(T, lp.frequency, 0.07, 110, t);
      lp.connect(T.mid);
      drone(T, 'sawtooth', mf(26), 0.09, lp, t);
      drone(T, 'sawtooth', mf(32), 0.055, lp, t);
      const n = keepNoise(T, 'brownS', t), g = gain(0.2);
      lfo(T, g.gain, 0.13, 0.08, t);
      wire(n, bq('lowpass', 200, 0), g, T.far);
    },
    compose(T, c, b0) {
      T.at(b0, (t) => bell(T.far, t, mf(38), 8, 0.24, { big: true }));
      T.at(b0 + 12, (t) => bell(T.far, t, mf(37), 8, 0.2, { big: true }));
      const sing = (t, m, d) => {
        choir(T.mid, t, [mf(50 + m), mf(43 + m)], d, { vowel: 'a', a: 0.3, r: 0.8, vel: 0.15 });
        choir(T.far, t, [mf(62 + m)], d, { vowel: 'u', a: 0.5, r: 1, vel: 0.05 });
      };
      phrase(T, b0, LEIT_A_DARK, sing);
      phrase(T, b0 + 12, LEIT_B_DARK, sing);
      for (let bar = 0; bar < 8; bar++) {
        const bb = b0 + bar * 4;
        if (bar < 6) {
          T.at(bb, (t) => taiko(T.dry, t, 1));
          T.at(bb + 2, (t) => taiko(T.dry, t, 0.8));
          T.at(bb + 3.5, (t) => tom(T.dry, t, 0.3, 150));
          if (bar % 3 === 2) [3, 3 + 1 / 3, 3 + 2 / 3].forEach((o) => T.at(bb + o, (t) => tom(T.dry, t, 0.35, 170)));
        } else {
          for (let e = 0; e < 8; e++) T.at(bb + e * 0.5, (t) => taiko(T.dry, t, 0.45 + e * 0.06, { p: 1.15 }));
          T.at(bb, (t) => stab(T.mid, t, freqs([50, 51, 56, 62]), 0.22));
        }
      }
    },
  });

  // ---------------------------------------------------------------- ending: the vow resolved, bittersweet
  track('ending', {
    bpm: 56, cycle: 32, level: 1,
    start(T, t) {
      const lp = bq('lowpass', 500, 0); lp.connect(T.far);
      drone(T, 'sine', mf(38), 0.07, lp, t, { lfo: 0.05, depth: 0.025 });
    },
    compose(T, c, b0) {
      const chords = [[0, 'D', 4], [4, 'Bm', 4], [8, 'D', 4], [12, 'Gm', 4], [16, 'A', 4], [20, 'D', 4], [24, 'G', 2], [26, 'A', 2], [28, 'D', 4]];
      for (const [b, ch, len] of chords) T.at(b0 + b, (t) => pad(T.far, t, freqs(CH[ch]), len * T.spb, { a: 1.5, r: 2.5, cut: 1100, vel: 0.1, type: 'triangle' }));
      phrase(T, b0 + 8, LEIT_A_SWEET, (t, m) => pluck(T.echo, t, 62 + m, 0.32));
      phrase(T, b0 + 20, LEIT_B_MAJ, (t, m, d) => {
        pluck(T.echo, t, 62 + m, 0.32);
        if (c % 2 === 1) bowed(T.mid, t, mf(50 + m), d * 0.95, { vel: 0.07 });
      });
      T.at(b0 + 29, (t) => bell(T.far, t, mf(74), 5, 0.08, { n: 6 }));
      if (chance(0.5)) T.at(b0 + 30, (t) => glass(T.far, t, mf(78), 3, { a: 1, vel: 0.03 }));
    },
  });

  // ---------------------------------------------------------------- credits: the vow, slow and warm
  track('credits', {
    bpm: 50, cycle: 32, level: 1,
    start() {},
    compose(T, c, b0) {
      const chords = [[0, 'D', 4], [4, 'D', 4], [8, 'G', 4], [12, 'A', 4], [16, 'D', 4], [20, 'G', 2], [22, 'A', 2], [24, 'D', 4], [28, 'G', 4]];
      const bassOf = { D: 38, G: 43, A: 45 };
      for (const [b, ch, len] of chords) {
        T.at(b0 + b, (t) => {
          organ(T.far, t, freqs(CH[ch]), len * T.spb, { a: 1.2, r: 2.2, vel: 0.09, cut: 1600 });
          tone(T.mid, t, mf(bassOf[ch] - 12), len * T.spb, { a: 0.4, r: 1.5, vel: 0.09 });
          CH[ch].slice(1).forEach((m, k) => { if (k < len) pluck(T.echo, t + k * T.spb, m + 12, 0.1); });
        });
      }
      const line = (t, m, d) => bowed(T.echo, t, mf(50 + m), d * 0.97, { vel: 0.14, cut: 1800 });
      phrase(T, b0 + 4, LEIT_A_MAJ, line);
      phrase(T, b0 + 16, LEIT_B_MAJ, line);
      if (c % 2 === 1) T.at(b0 + 16, (t) => choir(T.far, t, freqs([62, 66, 69]), 12 * T.spb, { vowel: 'u', a: 3, r: 4, vel: 0.06 }));
    },
  });

  // ================================================================ ambience beds
  const BEDS = {};
  BEDS.wind = {
    level: 1,
    start(B, t) {
      const g = gain(0.55);
      B.st.gust = g;
      const n1 = keepNoise(B, 'pinkS', t), bp = bq('bandpass', 420, 0.6);
      lfo(B, bp.frequency, 0.047, 150, t); lfo(B, bp.frequency, 0.13, 80, t);
      wire(n1, bp, g);
      B.st.bp = bp;
      const n2 = keepNoise(B, 'whiteS', t), bp2 = bq('bandpass', 1150, 7);
      lfo(B, bp2.frequency, 0.071, 380, t);
      wire(n2, bp2, gain(0.14), g);
      const n3 = keepNoise(B, 'brownS', t);
      wire(n3, bq('lowpass', 160, 0), gain(0.5), g);
      g.connect(B.out);
      B.st.next = t + rr(2, 6);
    },
    tick(B, now, until) {
      if (B.st.next >= until) return;
      const t = Math.max(B.st.next, now), up = rr(1.2, 2.8), down = rr(2, 4.5), peak = rr(0.85, 1.35);
      const p = B.st.gust.gain;
      p.setValueAtTime(0.55, t); p.linearRampToValueAtTime(peak, t + up); p.linearRampToValueAtTime(0.55, t + up + down);
      const f = B.st.bp.frequency;
      f.setValueAtTime(420, t); f.linearRampToValueAtTime(420 * rr(1.3, 1.8), t + up); f.linearRampToValueAtTime(420, t + up + down);
      B.st.next = t + up + down + rr(1.5, 7);
    },
  };
  BEDS.rain = {
    level: 1,
    start(B, t) {
      const n1 = keepNoise(B, 'whiteS', t);
      wire(n1, bq('highpass', 1100, 0), bq('lowpass', 7500, 0), gain(0.26), B.out);
      const n2 = keepNoise(B, 'pinkS', t);
      wire(n2, bq('lowpass', 1400, 0), bq('highpass', 120, 0), gain(0.42), B.out);
      const n3 = keepNoise(B, 'pinkS', t), g3 = gain(0.14);
      lfo(B, g3.gain, 0.2, 0.05, t);
      wire(n3, bq('bandpass', 3000, 0.5), g3, B.out);
      B.st.next = t;
    },
    tick(B, now, until) {
      if (B.st.next < now) B.st.next = now;
      while (B.st.next < until) {
        const t = B.st.next;
        const pn = panner(rr(-0.9, 0.9));
        const dst = pn || B.out;
        if (pn) pn.connect(B.out);
        if (chance(0.6)) nz(dst, t, { k: 'white', type: 'bandpass', f: rr(1800, 6000), q: 1.5, a: 0.0005, v: rr(0.03, 0.09), d: rr(0.006, 0.02) });
        else tn(dst, t, { f: rr(1400, 3200), fs: [[0.03, rr(900, 1300)]], a: 0.0008, v: rr(0.012, 0.035), d: 0.035 });
        if (chance(0.04)) drip(dst, t + 0.05, rr(600, 1100), 0.07);
        B.st.next += -Math.log(1 - rnd()) / 14;
      }
    },
  };
  BEDS.fire = {
    level: 1,
    start(B, t) {
      const n1 = keepNoise(B, 'brownS', t), g1 = gain(0.8);
      lfo(B, g1.gain, 0.23, 0.2, t); lfo(B, g1.gain, 0.37, 0.12, t);
      wire(n1, bq('lowpass', 320, 0), g1, B.out);
      const n2 = keepNoise(B, 'pinkS', t), g2 = gain(0.08);
      lfo(B, g2.gain, 6.3, 0.03, t);
      wire(n2, bq('bandpass', 2600, 0.6), g2, B.out);
      const n3 = keepNoise(B, 'pinkS', t), g3 = gain(0.25);
      lfo(B, g3.gain, 1.3, 0.08, t);
      wire(n3, bq('bandpass', 500, 0.7), g3, B.out);
      B.st.next = t;
    },
    tick(B, now, until) {
      if (B.st.next < now) B.st.next = now;
      while (B.st.next < until) {
        const t = B.st.next;
        const burst = chance(0.2) ? 3 + Math.floor(rnd() * 4) : 1;
        for (let k = 0; k < burst; k++) {
          const tt = t + (burst > 1 ? rnd() * 0.2 : 0);
          nz(B.out, tt, { k: 'white', type: chance(0.5) ? 'highpass' : 'bandpass', f: rr(900, 3500), q: chance(0.5) ? 0 : 1.2, a: 0.0003, v: 0.03 + 0.25 * Math.pow(rnd(), 3), d: rr(0.002, 0.012) });
        }
        if (chance(0.04)) {
          nz(B.out, t, { k: 'white', type: 'highpass', f: 1200, q: 0, a: 0.0003, v: 0.3, d: 0.02 });
          tn(B.out, t, { f: 130, f2: 60, ft: 0.05, a: 0.001, v: 0.12, d: 0.06 });
        }
        B.st.next += -Math.log(1 - rnd()) / 7;
      }
    },
  };
  const AMB_ALIAS = { wind: 'wind', rain: 'rain', fire: 'fire', ash: 'wind', fog: 'wind', snow: 'wind', embers: 'fire', storm: 'rain' };

  // ================================================================ graph
  function build() {
    nyq = ctx.sampleRate / 2;
    const g = {};
    g.master = gain(curve(vol.master));
    g.comp = ctx.createDynamicsCompressor();
    g.comp.threshold.value = -12;
    g.comp.knee.value = 8;
    g.comp.ratio.value = 4;
    g.comp.attack.value = 0.003;
    g.comp.release.value = 0.22;
    wire(g.master, g.comp, ctx.destination);

    g.verbIn = gain(1);
    g.verb = ctx.createConvolver();
    g.verb.buffer = makeIR(3.4);
    wire(g.verbIn, g.verb, gain(0.9), g.master);

    // mix balance: music sits a little forward, ambience beds well under it (they set mood, never mask music or voices)
    g.musicDry = gain(curve(vol.music)); wire(g.musicDry, gain(MIX.music), g.master);
    g.musicWet = gain(curve(vol.music)); g.musicWet.connect(g.verbIn);
    g.sfxDry = gain(curve(vol.sfx)); g.sfxDry.connect(g.master);
    g.sfxWet = gain(curve(vol.sfx)); g.sfxWet.connect(g.verbIn);

    // music echo: a dark, decaying repeat (feedback < 0.5 through filters: always stable)
    g.echoIn = gain(1);
    const dl = ctx.createDelay(2);
    dl.delayTime.value = 0.46;
    const elp = bq('lowpass', 2400, -1), ehp = bq('highpass', 180, -1), fb = gain(0.38);
    wire(g.echoIn, dl, elp, ehp);
    wire(ehp, fb, dl);
    wire(ehp, gain(0.55), g.musicDry);
    wire(ehp, gain(0.4), g.musicWet);

    // ambience: through a low-pass that closes indoors, into the sfx buses
    g.amb = gain(MIX.ambience);
    g.ambLP = bq('lowpass', nyq * 0.9, 0);
    wire(g.amb, g.ambLP, g.sfxDry);
    wire(g.ambLP, gain(0.15), g.sfxWet);

    const room = (d, w) => { const n = gain(1); wire(n, gain(d), g.sfxDry); wire(n, gain(w), g.sfxWet); return n; };
    g.room = { dry: room(1, 0.1), mid: room(0.85, 0.3), far: room(0.55, 0.85) };
    G = g;
  }

  // ================================================================ sfx voices
  function killVoice(v, now) {
    if (v.dead) return;
    v.dead = true;
    try {
      const p = v.g.gain;
      p.cancelScheduledValues(now);
      p.setValueAtTime(v.lvl, now);
      p.linearRampToValueAtTime(0, now + 0.04);
    } catch (e) { warn(e); }
    for (const s of v.srcs) { try { s.stop(now + 0.05); } catch (_) { /* already stopped */ } }
    v.end = Math.min(v.end, now + 0.06);
  }
  function pruneVoices(now) {
    for (let i = voices.length - 1; i >= 0; i--) {
      const v = voices[i];
      if (now > v.end + 0.5) {
        try { v.g.disconnect(); if (v.p) v.p.disconnect(); } catch (_) { /* ignore */ }
        voices.splice(i, 1);
      }
    }
  }
  function normOpts(o) {
    if (typeof o === 'number') o = { vol: o };
    if (!o || typeof o !== 'object') o = {};
    return { vol: clamp(num(o.vol, 1), 0, 3), pitch: clamp(num(o.pitch, 1), 0.25, 4), pan: clamp(num(o.pan, 0), -1, 1) };
  }

  // ================================================================ music & ambience lifecycles
  // A fader keeps track of a linear gain ramp so a fade can start from exactly where the previous one is.
  function fader(params, now, from, to, dur) {
    const f = { params, a: from, b: to, t0: now, t1: now + dur };
    for (const p of params) { p.setValueAtTime(from, now); p.linearRampToValueAtTime(to, now + dur); }
    return f;
  }
  function faderNow(f, now) {
    if (now >= f.t1) return f.b;
    if (now <= f.t0) return f.a;
    return f.a + (f.b - f.a) * (now - f.t0) / (f.t1 - f.t0);
  }
  function fadeTo(f, now, to, dur) {
    const v = faderNow(f, now);
    for (const p of f.params) { p.cancelScheduledValues(now); p.setValueAtTime(v, now); p.linearRampToValueAtTime(to, now + dur); }
    f.a = v; f.b = to; f.t0 = now; f.t1 = now + dur;
  }

  function startTrack(id, now, fade) {
    const d = TRACKS[id];
    const T = { id, d, i: 0, spb: 60 / d.bpm, next: now + 0.08, srcs: [], q: [], st: {}, end: Infinity };
    T.out = gain(0); T.rev = gain(0); T.ech = gain(0);
    T.out.connect(G.musicDry); T.rev.connect(G.musicWet); T.ech.connect(G.echoIn);
    T.fader = fader([T.out.gain, T.rev.gain, T.ech.gain], now, 0, d.level || 1, fade);
    const room = (dr, w, e) => {
      const n = gain(1);
      if (dr) wire(n, gain(dr), T.out);
      if (w) wire(n, gain(w), T.rev);
      if (e) wire(n, gain(e), T.ech);
      return n;
    };
    T.dry = room(1, 0.1, 0); T.mid = room(0.8, 0.4, 0); T.far = room(0.4, 1, 0); T.echo = room(0.6, 0.5, 0.5);
    T.at = (beat, fn) => {
      const q = T.q;
      let k = q.length;
      while (k > 0 && q[k - 1].at > beat) k--;
      q.splice(k, 0, { at: beat, fn });
    };
    try { if (d.start) d.start(T, T.next); } catch (e) { warn(e); }
    tracks.push(T);
    return T;
  }
  function fadeTrack(T, now, fade) {
    if (T.end !== Infinity) return;
    T.end = now + fade;
    fadeTo(T.fader, now, 0, fade);
    for (const s of T.srcs) { try { s.stop(T.end + 0.1); } catch (_) { /* ignore */ } }
  }
  function retireTrack(T) {
    try { T.out.disconnect(); T.rev.disconnect(); T.ech.disconnect(); } catch (_) { /* ignore */ }
  }
  function stepTrack(T, t, i) {
    const d = T.d;
    try {
      if (d.cycle && i % d.cycle === 0 && d.compose) d.compose(T, i / d.cycle, i);
      if (d.tick) d.tick(T, t, i);
    } catch (e) { warn(e); }
    while (T.q.length && T.q[0].at < i + 1) {
      const e = T.q.shift();
      if (e.at < i - 0.001) continue;                 // skipped while the tab slept
      try { e.fn(t + (e.at - i) * T.spb); } catch (err) { warn(err); }
    }
  }
  function advanceTrack(T, now, until) {
    if (T.next < now - 0.3) {                        // fell behind (throttled timers): skip, don't burst
      const skip = Math.ceil((now - T.next) / T.spb);
      T.i += skip; T.next += skip * T.spb;
    }
    let guard = 0;
    while (T.next < until && guard++ < 64) { stepTrack(T, T.next, T.i); T.i++; T.next += T.spb; }
  }
  function switchMusic(fade) {
    const now = ctx.currentTime;
    if (current) { fadeTrack(current, now, fade); current = null; }
    if (musicWanted && TRACKS[musicWanted]) current = startTrack(musicWanted, now, fade);
  }

  function startBed(id, now, fade, level) {
    const d = BEDS[id];
    const B = { id, d, srcs: [], st: {}, level: (d.level || 1) * level, end: Infinity };
    B.out = gain(0);
    B.out.connect(G.amb);
    B.fader = fader([B.out.gain], now, 0, B.level, fade);
    try { d.start(B, now); } catch (e) { warn(e); }
    return B;
  }
  function fadeBed(B, now, fade) {
    B.end = now + fade;
    fadeTo(B.fader, now, 0, fade);
    for (const s of B.srcs) { try { s.stop(B.end + 0.1); } catch (_) { /* ignore */ } }
  }
  function applyAmbience(fade) {
    const now = ctx.currentTime;
    for (const id of Object.keys(beds)) {
      const w = ambWanted.find((x) => x.id === id);
      const B = beds[id];
      if (!w) { fadeBed(B, now, fade); dyingBeds.push(B); delete beds[id]; }
      else if (Math.abs(B.level - (B.d.level || 1) * w.vol) > 0.001) { B.level = (B.d.level || 1) * w.vol; fadeTo(B.fader, now, B.level, 1); }
    }
    for (const w of ambWanted) if (!beds[w.id] && BEDS[w.id]) beds[w.id] = startBed(w.id, now, fade, w.vol);
    G.ambLP.frequency.setTargetAtTime(ambIndoor ? 650 : nyq * 0.9, now, 0.4);
  }

  // ================================================================ scheduler
  function pump() {
    if (!ctx || !G) return;
    try {
      const now = ctx.currentTime;
      const gap = now - lastPump;
      lastPump = now;
      const until = now + clamp(gap * 1.5, LOOKAHEAD, 1.2);
      for (let k = tracks.length - 1; k >= 0; k--) {
        const T = tracks[k];
        if (now > T.end + 0.3) { retireTrack(T); tracks.splice(k, 1); continue; }
        advanceTrack(T, now, until);
      }
      for (const id in beds) { const B = beds[id]; try { if (B.d.tick) B.d.tick(B, now, until); } catch (e) { warn(e); } }
      for (let k = dyingBeds.length - 1; k >= 0; k--) {
        const B = dyingBeds[k];
        if (now > B.end + 0.3) { try { B.out.disconnect(); } catch (_) { /* ignore */ } dyingBeds.splice(k, 1); }
        else if (B.d.tick) { try { B.d.tick(B, now, Math.min(until, B.end)); } catch (e) { warn(e); } }
      }
      pruneVoices(now);
    } catch (e) { warn(e); }
  }

  function resume() {
    try {
      if (ctx && ctx.state === 'suspended' && ctx.resume) {
        const p = ctx.resume();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (_) { /* ignore */ }
  }

  // ================================================================ public API
  A.ready = false;

  A.init = function () {
    try {
      if (ctx) { resume(); return A.ready; }
      const AC = root.AudioContext || root.webkitAudioContext;
      if (typeof AC !== 'function') return false;
      try { ctx = new AC({ latencyHint: 'interactive' }); } catch (_) { ctx = new AC(); }
      try { build(); } catch (e) {
        warn(e);
        try { ctx.close(); } catch (_) { /* ignore */ }
        ctx = null; G = null;
        return false;
      }
      A.ready = true;
      resume();
      try {                                           // iOS: a silent buffer played inside the gesture unlocks output
        const s = ctx.createBufferSource();
        s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
        s.connect(ctx.destination);
        s.start(0);
      } catch (_) { /* ignore */ }
      lastPump = ctx.currentTime;
      if (!timer && typeof root.setInterval === 'function') timer = root.setInterval(pump, TICK_MS);
      if (musicWanted) current = startTrack(musicWanted, ctx.currentTime, 1.5);
      if (ambWanted.length) applyAmbience(2);
      pump();
      return true;
    } catch (e) {
      warn(e);
      return false;
    }
  };

  A.sfx = function (id, opts) {
    if (!ctx || !G) return;
    try {
      if (id === 'text') { A.text(opts && typeof opts === 'object' ? opts.pitch : undefined); return; }
      const d = SFX[id];
      if (!d || !d.fn) { warn('unknown sfx ' + id); return; }
      const o = normOpts(opts);
      if (o.vol <= 0.001) return;
      const now = ctx.currentTime;
      const last = lastPlay[id];
      if (last != null && now - last < d.gap && now >= last) return;
      pruneVoices(now);
      let live = 0, same = 0, oldestSame = null;
      for (const v of voices) {
        if (v.dead || v.end <= now) continue;
        live++;
        if (v.id === id) { same++; if (!oldestSame || v.t < oldestSame.t) oldestSame = v; }
      }
      if (same >= d.max && oldestSame) { killVoice(oldestSame, now); live--; }
      if (live >= MAX_VOICES) {
        let victim = null;
        for (const v of voices) {
          if (v.dead || v.end <= now) continue;
          if (!victim || v.prio < victim.prio || (v.prio === victim.prio && v.t < victim.t)) victim = v;
        }
        if (!victim || victim.prio > d.prio) return;
        killVoice(victim, now);
      }
      lastPlay[id] = now;
      const t = now + 0.005;
      const v = { id, prio: d.prio, t, end: t + 1, lvl: o.vol * (d.lvl || 1), srcs: [], dead: false };
      v.g = gain(v.lvl);
      let tail = v.g;
      if (o.pan) { v.p = panner(o.pan); if (v.p) { v.g.connect(v.p); tail = v.p; } }
      tail.connect(G.room[d.room] || G.room.mid);
      collector = v.srcs;
      let len;
      try { len = d.fn(v.g, t, o.pitch, o); } finally { collector = null; }
      v.end = t + clamp(num(len, 1), 0.05, 12);
      voices.push(v);
    } catch (e) {
      collector = null;
      warn(e);
    }
  };

  const TEXT_STEPS = [1, 1.122, 1.26, 1.335, 1.498];
  A.text = function (pitch) {
    if (!ctx || !G) return;
    try {
      const now = ctx.currentTime;
      if (now - lastText < 0.032 && now >= lastText) return;
      lastText = now;
      const p = clamp(num(pitch, 1), 0.3, 2.5);
      const t = now + 0.003;
      const f = 190 * p * pick(TEXT_STEPS) * (1 + (rnd() - 0.5) * 0.045);
      const g = gain(0);
      ad(g.gain, t, 0.004, 0.075, 0.075);
      wire(osc('triangle', f, t, t + 0.12), bq('lowpass', 1500 + 400 * p, 0), g, G.room.dry);
    } catch (e) { warn(e); }
  };

  A.music = function (id, opts) {
    try {
      if (id === undefined || id === '' || id === false || id === 'stop' || id === 'none') id = null;
      if (id !== null && !TRACKS[id]) { warn('unknown music ' + id); return; }
      if (id === musicWanted) return;
      musicWanted = id;
      if (!ctx || !G) return;
      const fade = clamp(num(opts && typeof opts === 'object' ? opts.fade : undefined, 2), 0.05, 30);
      switchMusic(fade);
      pump();
    } catch (e) { warn(e); }
  };

  A.ambience = function (list, opts) {
    try {
      if (list == null) list = [];
      if (!Array.isArray(list)) list = [list];
      const want = [];
      for (const x of list) {
        let id = x, v = 1;
        if (x && typeof x === 'object') { id = x.id; v = clamp(num(x.vol, 1), 0, 2); }
        if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(AMB_ALIAS, id)) continue;
        id = AMB_ALIAS[id];
        const prev = want.find((w) => w.id === id);
        if (prev) prev.vol = Math.max(prev.vol, v); else want.push({ id, vol: v });
      }
      ambWanted = want;
      ambIndoor = !!(opts && typeof opts === 'object' && opts.indoor);
      if (!ctx || !G) return;
      applyAmbience(2.5);
      pump();
    } catch (e) { warn(e); }
  };

  A.setVolumes = function (v) {
    try {
      if (!v || typeof v !== 'object') return;
      for (const k of ['master', 'music', 'sfx']) if (typeof v[k] === 'number' && isFinite(v[k])) vol[k] = clamp(v[k], 0, 1);
      if (!ctx || !G) return;
      const now = ctx.currentTime;
      const set = (p, x) => p.setTargetAtTime(curve(x), now, 0.04);
      set(G.master.gain, vol.master);
      set(G.musicDry.gain, vol.music); set(G.musicWet.gain, vol.music);
      set(G.sfxDry.gain, vol.sfx); set(G.sfxWet.gain, vol.sfx);
    } catch (e) { warn(e); }
  };

  A.update = function () { if (ctx) pump(); };

  // read-only conveniences for tools / debugging
  A.ids = { sfx: Object.keys(SFX), music: Object.keys(TRACKS), ambience: Object.keys(BEDS) };
  A.getVolumes = () => ({ master: vol.master, music: vol.music, sfx: vol.sfx });
  A.playing = () => musicWanted;
  A.stats = () => ({
    tracks: tracks.length,
    beds: Object.keys(beds).length,
    dying: dyingBeds.length,
    voices: voices.length,
    live: ctx ? voices.filter((v) => !v.dead && ctx.currentTime <= v.end).length : 0,
  });

  // Safety net: if the engine never calls init(), the first gesture still wakes the audio up.
  if (!AV.headless && typeof root.addEventListener === 'function') {
    const EV = ['pointerdown', 'keydown', 'touchend', 'mousedown'];
    const unlock = () => {
      A.init();
      if (ctx && ctx.state === 'running') for (const e of EV) root.removeEventListener(e, unlock, true);
    };
    for (const e of EV) root.addEventListener(e, unlock, true);
  }
})(typeof window !== 'undefined' ? window : globalThis);
