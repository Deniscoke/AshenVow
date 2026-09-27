#!/usr/bin/env node
// Audio smoke test for src/engine/audio.js — runs it against a mock Web Audio implementation in Node.
//
//   node tools/audio_smoke.js              API smoke test: every call, every sfx / music / ambience id, garbage input,
//                                          voice limits, crossfades, leaks; the mock enforces the spec's throw rules and
//                                          records anything suspicious (out-of-range values, ramps from zero, …).
//   node tools/audio_smoke.js --render     additionally renders every sound offline (a small real DSP engine), prints
//                                          loudness / click statistics and writes spectrograms to preview/audio/.
//   options: --only id,id   --secs N (music render length, default 40)   --sr RATE   --out DIR   --verbose
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT, Img, writePNG } = require('./lib');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : def; };
const RENDER = args.includes('--render');
const VERBOSE = args.includes('--verbose');
const ONLY = opt('--only', '').split(',').filter(Boolean);
const MUSIC_SECS = +opt('--secs', 40);
const SR = +opt('--sr', 44100);
const OUT = path.resolve(ROOT, opt('--out', 'preview/audio'));
const BLOCK = 128;

const SFX_IDS = 'swing swing2 hit hit_heavy block hurt roll step step_soft step_water heal kindle kindle_end death respawn enemy_die pickup key_item shrine rest door locked ui_move ui_select ui_back ui_open text boss_intro boss_die bell bell_big whoosh projectile slam roar growl moth splash snuff whisper quest chapter break_wall penny fire'.split(' ');
const MUSIC_IDS = 'title village hushwood abbey greyharrow city wickward pyre cave boss boss_final ending credits'.split(' ');
const AMB_IDS = ['wind', 'rain', 'fire'];

// =====================================================================================================================
// Mock Web Audio: spec-shaped API (throws where browsers throw), pull-based block renderer, issue bookkeeping.
// =====================================================================================================================
class Issues {
  constructor() { this.map = new Map(); }
  add(kind, msg) { const k = `${kind}: ${msg}`; this.map.set(k, (this.map.get(k) || 0) + 1); }
  get size() { return this.map.size; }
  list() { return [...this.map.entries()].map(([k, n]) => (n > 1 ? `${k}  (x${n})` : k)); }
  clear() { this.map.clear(); }
}
const FLT_MAX = 3.4028234663852886e38;
function checkNum(v, what) {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`${what}: non-finite value ${v}`);
}
function domErr(name, msg) { const e = new Error(`${name}: ${msg}`); e.name = name; return e; }

class AudioParamM {
  constructor(node, name, def, min = -FLT_MAX, max = FLT_MAX) {
    this.node = node; this.name = name; this.defaultValue = def; this.minValue = min; this.maxValue = max;
    this._v = def; this.ev = []; this.ins = new Set(); this.buf = new Float32Array(BLOCK); this.blk = -1;
  }
  get ctx() { return this.node.context; }
  get label() { return `${this.node.kind}.${this.name}`; }
  _range(v) {
    if (v < this.minValue - 1e-6 || v > this.maxValue + 1e-6) {
      this.ctx.issues.add('range', `${this.label} = ${+v.toFixed(4)} outside nominal [${+this.minValue.toFixed(2)}, ${+this.maxValue.toFixed(2)}] (browser clamps and logs)`);
    }
  }
  get value() { return this.ev.length ? this.valueAt(this.ctx.currentTime) : this._v; }
  set value(v) {
    checkNum(v, `${this.label}.value`);
    this._range(v);
    if (this.ev.length) this.setValueAtTime(v, this.ctx.currentTime); else this._v = v;
  }
  _time(t, what) { checkNum(t, `${this.label}.${what} time`); if (t < 0) throw new RangeError(`${this.label}.${what}: negative time ${t}`); }
  _insert(e) {
    this._pruneBefore(this.ctx.currentTime - 1);
    const ev = this.ev;
    let k = ev.length;
    while (k > 0 && ev[k - 1].t > e.t) k--;
    ev.splice(k, 0, e);
    this.ctx.stats.automation++;
    if (ev.length > 400 && !this._big) { this._big = true; this.ctx.issues.add('automation', `${this.label} holds ${ev.length} pending events (runaway scheduling?)`); }
    return this;
  }
  _prev(t) { let p = null; for (const e of this.ev) { if (e.t <= t) p = e; else break; } return p; }
  _pruneBefore(t) {
    const ev = this.ev;
    let k = -1;
    for (let i = 0; i < ev.length; i++) { if (ev[i].t <= t) k = i; else break; }
    if (k >= 1) {
      const keep = ev[k];
      if (keep.type === 'target') this._v = this.valueAt(keep.t - 1e-7);
      else if (keep.type !== 'curve') this._v = keep.v;
      this.ev = ev.slice(k);
    }
  }
  setValueAtTime(v, t) { checkNum(v, `${this.label}.setValueAtTime`); this._time(t, 'setValueAtTime'); this._range(v); return this._insert({ type: 'set', v, t }); }
  linearRampToValueAtTime(v, t) {
    checkNum(v, `${this.label}.linearRamp`); this._time(t, 'linearRamp'); this._range(v);
    const p = this._prev(t);
    if (!p) this.ctx.issues.add('ramp', `${this.label}: linear ramp with no preceding event`);
    else if (p.type === 'target') this.ctx.issues.add('ramp', `${this.label}: ramp right after setTargetAtTime (browsers differ)`);
    return this._insert({ type: 'lin', v, t });
  }
  exponentialRampToValueAtTime(v, t) {
    checkNum(v, `${this.label}.exponentialRamp`); this._time(t, 'exponentialRamp');
    if (v === 0) throw new RangeError(`${this.label}.exponentialRampToValueAtTime: value must not be 0`);
    this._range(v);
    const p = this._prev(t);
    if (!p) this.ctx.issues.add('ramp', `${this.label}: exponential ramp with no preceding event`);
    else if (p.type === 'target') this.ctx.issues.add('ramp', `${this.label}: ramp right after setTargetAtTime (browsers differ)`);
    const v0 = p ? (p.type === 'set' || p.type === 'lin' || p.type === 'exp' ? p.v : null) : this._v;
    if (v0 !== null && (v0 === 0 || v0 * v < 0)) this.ctx.issues.add('ramp', `${this.label}: exponential ramp from ${v0} does nothing`);
    return this._insert({ type: 'exp', v, t });
  }
  setTargetAtTime(v, t, tc) {
    checkNum(v, `${this.label}.setTarget`); this._time(t, 'setTarget'); checkNum(tc, `${this.label}.setTarget timeConstant`);
    if (tc < 0) throw new RangeError(`${this.label}.setTargetAtTime: negative timeConstant`);
    this._range(v);
    return this._insert({ type: 'target', v, t, tc });
  }
  setValueCurveAtTime(curve, t, dur) {
    this._time(t, 'setValueCurve'); checkNum(dur, 'setValueCurve duration');
    if (dur <= 0) throw new RangeError('setValueCurveAtTime: duration must be > 0');
    if (!curve || curve.length < 2) throw domErr('InvalidStateError', 'curve needs >= 2 values');
    for (const e of this.ev) if (e.t > t && e.t < t + dur) throw domErr('NotSupportedError', 'event inside a value curve');
    return this._insert({ type: 'curve', curve: Float32Array.from(curve), t, dur, v: curve[curve.length - 1] });
  }
  cancelScheduledValues(t) { this._time(t, 'cancelScheduledValues'); this.ev = this.ev.filter((e) => e.t < t); return this; }
  cancelAndHoldAtTime(t) { this.ctx.issues.add('compat', 'cancelAndHoldAtTime is missing in Firefox'); return this.cancelScheduledValues(t); }

  valueAt(x) {
    let v = this._v, t0 = 0, tgt = null;
    const cur = (t) => (tgt ? tgt.v + (tgt.s - tgt.v) * Math.exp(-(t - tgt.t) / Math.max(tgt.tc, 1e-9)) : v);
    for (const e of this.ev) {
      if (e.t <= x) {
        if (e.type === 'target') { const s = cur(e.t); tgt = { v: e.v, t: e.t, tc: e.tc, s }; t0 = e.t; } else if (e.type === 'curve') {
          if (x < e.t + e.dur) {
            const pos = ((x - e.t) / e.dur) * (e.curve.length - 1), i = Math.floor(pos);
            return e.curve[i] + (e.curve[Math.min(i + 1, e.curve.length - 1)] - e.curve[i]) * (pos - i);
          }
          v = e.v; tgt = null; t0 = e.t + e.dur;
        } else { v = e.v; tgt = null; t0 = e.t; }
        continue;
      }
      if (e.type === 'lin' || e.type === 'exp') {
        const V0 = cur(t0), dt = e.t - t0;
        if (dt <= 0) return e.v;
        const r = (x - t0) / dt;
        if (e.type === 'lin') return V0 + (e.v - V0) * r;
        if (V0 === 0 || V0 * e.v < 0) return V0;
        return V0 * Math.pow(e.v / V0, r);
      }
      break;
    }
    return cur(x);
  }
  fill(t0, sr, blk) {
    if (this.blk === blk) return this.buf;
    this.blk = blk;
    const b = this.buf, ev = this.ev;
    if (ev.length > 6) this._pruneBefore(t0 - 0.25);
    if (!ev.length) b.fill(this._v);
    else {
      const t1 = t0 + BLOCK / sr;
      let nxt = null, last = null;
      for (const e of this.ev) { if (e.t <= t0) last = e; else { nxt = e; break; } }
      const moving = (nxt && (nxt.t <= t1 || nxt.type === 'lin' || nxt.type === 'exp')) ||
        (last && (last.type === 'target' || (last.type === 'curve' && last.t + last.dur > t0)));
      if (!moving) b.fill(this.valueAt(t0));
      else for (let j = 0; j < BLOCK; j++) b[j] = this.valueAt(t0 + j / sr);
    }
    for (const n of this.ins) {
      const o = n.process(blk), L = o[0], R = o[1];
      if (L === R) for (let j = 0; j < BLOCK; j++) b[j] += L[j];
      else for (let j = 0; j < BLOCK; j++) b[j] += 0.5 * (L[j] + R[j]);
    }
    for (let j = 0; j < BLOCK; j++) if (!Number.isFinite(b[j])) { this.ctx.issues.add('nan', `${this.label} became ${b[j]}`); b.fill(0); break; }
    return b;
  }
}

class NodeM {
  constructor(ctx, kind, nIn = 1, nOut = 1) {
    this.context = ctx; this.kind = kind; this.numberOfInputs = nIn; this.numberOfOutputs = nOut;
    this.channelCount = 2; this.channelCountMode = 'max'; this.channelInterpretation = 'speakers';
    this.outs = new Set(); this.ins = new Set(); this.active = false; this.persistent = false; this.blk = -1;
    this.L = new Float32Array(BLOCK); this.R = new Float32Array(BLOCK); this.out = [this.L, this.L];
    ctx.stats.nodes++;
    ctx.stats.kinds[kind] = (ctx.stats.kinds[kind] || 0) + 1;
  }
  connect(dest, output = 0, input = 0) {
    if (dest instanceof AudioParamM) {
      if (dest.ctx !== this.context) throw domErr('InvalidAccessError', 'param from another context');
      if (output >= this.numberOfOutputs) throw domErr('IndexSizeError', 'bad output');
      this.outs.add(dest);
      if (this.active) dest.ins.add(this);
      return undefined;
    }
    if (!(dest instanceof NodeM)) throw new TypeError(`${this.kind}.connect: destination is not an AudioNode`);
    if (dest.context !== this.context) throw domErr('InvalidAccessError', 'node from another context');
    if (output >= this.numberOfOutputs || input >= dest.numberOfInputs) throw domErr('IndexSizeError', `${this.kind} -> ${dest.kind}: bad index`);
    this.outs.add(dest);
    if (this.active) dest._addIn(this);
    return dest;
  }
  disconnect(dest) {
    if (dest === undefined) {
      for (const d of this.outs) { if (d instanceof AudioParamM) d.ins.delete(this); else d._delIn(this); }
      this.outs.clear();
      return;
    }
    if (!this.outs.has(dest)) throw domErr('InvalidAccessError', `${this.kind}.disconnect: not connected`);
    this.outs.delete(dest);
    if (dest instanceof AudioParamM) dest.ins.delete(this); else dest._delIn(this);
  }
  _addIn(n) { this.ins.add(n); if (!this.active) this._activate(); }
  _delIn(n) { if (!this.ins.delete(n)) return; if (this.ins.size === 0 && !this.persistent && this.active) this._deactivate(); }
  _activate() { this.active = true; for (const d of this.outs) { if (d instanceof AudioParamM) d.ins.add(this); else d._addIn(this); } }
  _deactivate() { this.active = false; for (const d of this.outs) { if (d instanceof AudioParamM) d.ins.delete(this); else d._delIn(this); } }
  process(blk) { if (this.blk !== blk) { this.blk = blk; this._render(blk); } return this.out; }
  _t0(blk) { return (blk * BLOCK) / this.context.sampleRate; }
  _sum(blk, L, R) {
    L.fill(0);
    let mono = true;
    const outs = [];
    for (const n of this.ins) { const o = n.process(blk); outs.push(o); if (o[0] !== o[1]) mono = false; }
    if (mono) { for (const o of outs) { const a = o[0]; for (let j = 0; j < BLOCK; j++) L[j] += a[j]; } return [L, L]; }
    R.fill(0);
    for (const o of outs) { const a = o[0], b = o[1]; for (let j = 0; j < BLOCK; j++) { L[j] += a[j]; R[j] += b[j]; } }
    return [L, R];
  }
  _render(blk) { this.out = this._sum(blk, this.L, this.R); }
  addEventListener() {}
  removeEventListener() {}
}

class DestM extends NodeM {
  constructor(ctx) { super(ctx, 'Destination', 1, 0); this.persistent = true; this.active = true; this.maxChannelCount = 2; }
}
class GainM extends NodeM {
  constructor(ctx) { super(ctx, 'Gain'); this.gain = new AudioParamM(this, 'gain', 1); }
  _render(blk) {
    const o = this._sum(blk, this.L, this.R);
    const g = this.gain.fill(this._t0(blk), this.context.sampleRate, blk);
    for (let j = 0; j < BLOCK; j++) o[0][j] *= g[j];
    if (o[1] !== o[0]) for (let j = 0; j < BLOCK; j++) o[1][j] *= g[j];
    this.out = o;
  }
}
class PannerM extends NodeM {
  constructor(ctx) { super(ctx, 'StereoPanner'); this.pan = new AudioParamM(this, 'pan', 0, -1, 1); this.iL = new Float32Array(BLOCK); this.iR = new Float32Array(BLOCK); }
  _render(blk) {
    const [a, b] = this._sum(blk, this.iL, this.iR);
    const p = this.pan.fill(this._t0(blk), this.context.sampleRate, blk);
    const L = this.L, R = this.R;
    for (let j = 0; j < BLOCK; j++) {
      const pan = Math.max(-1, Math.min(1, p[j]));
      if (a === b) { const x = (pan + 1) / 2; L[j] = a[j] * Math.cos((x * Math.PI) / 2); R[j] = a[j] * Math.sin((x * Math.PI) / 2); } else if (pan <= 0) {
        const x = pan + 1; L[j] = a[j] + b[j] * Math.cos((x * Math.PI) / 2); R[j] = b[j] * Math.sin((x * Math.PI) / 2);
      } else { const x = pan; L[j] = a[j] * Math.cos((x * Math.PI) / 2); R[j] = b[j] + a[j] * Math.sin((x * Math.PI) / 2); }
    }
    this.out = [L, R];
  }
}
class ShaperM extends NodeM {
  constructor(ctx) { super(ctx, 'WaveShaper'); this._curve = null; this.oversample = 'none'; }
  get curve() { return this._curve; }
  set curve(c) {
    if (c !== null && !(c instanceof Float32Array)) throw new TypeError('WaveShaper.curve must be a Float32Array');
    if (c && c.length < 2) throw domErr('InvalidStateError', 'curve length < 2');
    this._curve = c ? Float32Array.from(c) : null;
  }
  _render(blk) {
    const o = this._sum(blk, this.L, this.R), c = this._curve;
    if (c) {
      const n = c.length - 1;
      const f = (x) => { const v = ((x + 1) / 2) * n; if (v <= 0) return c[0]; if (v >= n) return c[n]; const i = Math.floor(v); return c[i] + (c[i + 1] - c[i]) * (v - i); };
      for (let j = 0; j < BLOCK; j++) o[0][j] = f(o[0][j]);
      if (o[1] !== o[0]) for (let j = 0; j < BLOCK; j++) o[1][j] = f(o[1][j]);
    }
    this.out = o;
  }
}
function biquadCoefs(type, f, Q, G, sr) {
  const nyq = sr / 2;
  f = Math.max(1e-3, Math.min(f, nyq * 0.9999));
  const w0 = (2 * Math.PI * f) / sr, cw = Math.cos(w0), sw = Math.sin(w0), A = Math.pow(10, G / 40);
  let b0, b1, b2, a0, a1, a2;
  const aQ = sw / (2 * Math.max(Q, 1e-4));
  switch (type) {
    case 'lowpass': { const al = sw / (2 * Math.pow(10, Q / 20)); b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; break; }
    case 'highpass': { const al = sw / (2 * Math.pow(10, Q / 20)); b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; break; }
    case 'bandpass': b0 = aQ; b1 = 0; b2 = -aQ; a0 = 1 + aQ; a1 = -2 * cw; a2 = 1 - aQ; break;
    case 'notch': b0 = 1; b1 = -2 * cw; b2 = 1; a0 = 1 + aQ; a1 = -2 * cw; a2 = 1 - aQ; break;
    case 'allpass': b0 = 1 - aQ; b1 = -2 * cw; b2 = 1 + aQ; a0 = 1 + aQ; a1 = -2 * cw; a2 = 1 - aQ; break;
    case 'peaking': b0 = 1 + aQ * A; b1 = -2 * cw; b2 = 1 - aQ * A; a0 = 1 + aQ / A; a1 = -2 * cw; a2 = 1 - aQ / A; break;
    case 'lowshelf': case 'highshelf': {
      const al = (sw / 2) * Math.sqrt(2), sa = 2 * Math.sqrt(A) * al, s = type === 'lowshelf' ? 1 : -1;
      b0 = A * ((A + 1) - s * (A - 1) * cw + sa); b1 = s * 2 * A * ((A - 1) - s * (A + 1) * cw); b2 = A * ((A + 1) - s * (A - 1) * cw - sa);
      a0 = (A + 1) + s * (A - 1) * cw + sa; a1 = -s * 2 * ((A - 1) + s * (A + 1) * cw); a2 = (A + 1) + s * (A - 1) * cw - sa; break;
    }
    default: b0 = 1; b1 = 0; b2 = 0; a0 = 1; a1 = 0; a2 = 0;
  }
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}
const BIQUAD_TYPES = ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'];
class BiquadM extends NodeM {
  constructor(ctx) {
    super(ctx, 'Biquad');
    const n = ctx.sampleRate / 2;
    this.frequency = new AudioParamM(this, 'frequency', 350, 0, n);
    this.Q = new AudioParamM(this, 'Q', 1);
    this.gain = new AudioParamM(this, 'gain', 0, -FLT_MAX, 1541);
    this.detune = new AudioParamM(this, 'detune', 0, -153600, 153600);
    this._type = 'lowpass';
    this.st = [new Float64Array(4), new Float64Array(4)];
  }
  get type() { return this._type; }
  set type(v) { if (BIQUAD_TYPES.includes(v)) this._type = v; else this.context.issues.add('enum', `Biquad.type '${v}' ignored`); }
  getFrequencyResponse() {}
  _render(blk) {
    const sr = this.context.sampleRate, t0 = this._t0(blk);
    const o = this._sum(blk, this.L, this.R);
    const f = this.frequency.fill(t0, sr, blk)[0] * Math.pow(2, this.detune.fill(t0, sr, blk)[0] / 1200);
    const Q = this.Q.fill(t0, sr, blk)[0], G = this.gain.fill(t0, sr, blk)[0];
    if ((this._type === 'bandpass' || this._type === 'notch' || this._type === 'peaking' || this._type === 'allpass') && Q <= 0.01) this.context.issues.add('filter', `${this._type} with Q=${Q}`);
    if ((this._type === 'lowpass' || this._type === 'highpass') && Q > 24) this.context.issues.add('filter', `${this._type} with ${Q} dB resonance`);
    const [b0, b1, b2, a1, a2] = biquadCoefs(this._type, f, Q, G, sr);
    const run = (x, s) => {
      let x1 = s[0], x2 = s[1], y1 = s[2], y2 = s[3];
      for (let j = 0; j < BLOCK; j++) {
        const xi = x[j];
        let y = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        if (Math.abs(y) < 1e-25) y = 0;
        x2 = x1; x1 = xi; y2 = y1; y1 = y; x[j] = y;
      }
      s[0] = x1; s[1] = x2; s[2] = y1; s[3] = y2;
    };
    run(o[0], this.st[0]);
    if (o[1] !== o[0]) run(o[1], this.st[1]); else this.st[1].set(this.st[0]);
    this.out = o;
  }
}
class DelayM extends NodeM {
  constructor(ctx, max = 1) {
    checkNum(max, 'createDelay');
    if (!(max > 0 && max < 180)) throw domErr('NotSupportedError', `maxDelayTime ${max}`);
    super(ctx, 'Delay');
    this.persistent = true;
    this.delayTime = new AudioParamM(this, 'delayTime', 0, 0, max);
    this.size = Math.ceil(max * ctx.sampleRate) + BLOCK * 4;
    this.ring = [new Float32Array(this.size), new Float32Array(this.size)];
    this.w = 0; this.iL = new Float32Array(BLOCK); this.iR = new Float32Array(BLOCK);
  }
  process(blk) {
    if (this.blk === blk) return this.out;
    this.blk = blk;
    const sr = this.context.sampleRate;
    const d = Math.max(BLOCK, this.delayTime.fill(this._t0(blk), sr, blk)[0] * sr);
    const L = this.L, R = this.R, rl = this.ring[0], rr = this.ring[1], n = this.size;
    for (let j = 0; j < BLOCK; j++) {
      let p = this.w + j - d; while (p < 0) p += n;
      const i = Math.floor(p), fr = p - i, i2 = (i + 1) % n;
      L[j] = rl[i % n] + (rl[i2] - rl[i % n]) * fr;
      R[j] = rr[i % n] + (rr[i2] - rr[i % n]) * fr;
    }
    this.out = [L, R];
    const [a, b] = this._sum(blk, this.iL, this.iR);
    for (let j = 0; j < BLOCK; j++) { const k = (this.w + j) % n; rl[k] = a[j]; rr[k] = b[j]; }
    this.w = (this.w + BLOCK) % n;
    return this.out;
  }
}
// Stand-in for the convolver: a comb/all-pass reverb whose decay and loudness match a normalised convolution
// with the given impulse response (normalised output RMS ≈ 0.00125 · sqrt(IR length) · input RMS, per spec).
class ApproxReverb {
  constructor(sr, ir) {
    const h = ir.getChannelData(0), n = h.length;
    const edc = new Float64Array(n + 1);
    for (let i = n - 1; i >= 0; i--) edc[i] = edc[i + 1] + h[i] * h[i];
    const db = (i) => 10 * Math.log10(edc[i] / edc[0] + 1e-30);
    let i5 = 0, i35 = n - 1;
    for (let i = 0; i < n; i++) if (db(i) <= -5) { i5 = i; break; }
    for (let i = i5; i < n; i++) if (db(i) <= -35) { i35 = i; break; }
    this.rt60 = Math.max(0.3, (2 * (i35 - i5)) / sr);
    const mk = (ms) => { const len = Math.round((ms / 1000) * sr); return { buf: new Float32Array(len), i: 0, len, lp: 0, g: Math.pow(10, (-3 * (len / sr)) / this.rt60) }; };
    this.ch = [0, 1].map((c) => ({
      combs: [29.7, 37.1, 41.1, 43.7, 31.3, 35.9].map((ms) => mk(ms + c * 0.6)),
      aps: [5.0, 1.7].map((ms) => mk(ms + c * 0.3)),
    }));
    this.gain = 1;
    const test = new Float32Array(sr), out = new Float32Array(sr);
    let s = 1;
    for (let i = 0; i < sr; i++) { s = (s * 16807) % 2147483647; test[i] = (s / 2147483647) * 2 - 1; }
    this.run(0, test, out);
    let ri = 0, ro = 0;
    for (let i = sr / 2; i < sr; i++) { ri += test[i] * test[i]; ro += out[i] * out[i]; }
    this.gain = (0.00125 * Math.sqrt(n)) / Math.sqrt(ro / ri);
    for (const c of this.ch) for (const f of [...c.combs, ...c.aps]) { f.buf.fill(0); f.lp = 0; f.i = 0; }
  }
  run(c, x, y) {
    const { combs, aps } = this.ch[c];
    for (let j = 0; j < x.length; j++) {
      let acc = 0;
      for (const f of combs) {
        const d = f.buf[f.i];
        f.lp = d * 0.72 + f.lp * 0.28;
        f.buf[f.i] = x[j] + f.lp * f.g;
        if (++f.i >= f.len) f.i = 0;
        acc += d;
      }
      for (const a of aps) {
        const d = a.buf[a.i], v = acc + d * 0.5;
        a.buf[a.i] = v;
        acc = d - v * 0.5;
        if (++a.i >= a.len) a.i = 0;
      }
      y[j] = acc * this.gain;
    }
  }
}
class ConvolverM extends NodeM {
  constructor(ctx) { super(ctx, 'Convolver'); this.persistent = true; this._buffer = null; this.normalize = true; this.rev = null; this.iL = new Float32Array(BLOCK); this.iR = new Float32Array(BLOCK); }
  get buffer() { return this._buffer; }
  set buffer(b) {
    if (b !== null && !(b instanceof AudioBufferM)) throw new TypeError('Convolver.buffer must be an AudioBuffer');
    if (b && b.sampleRate !== this.context.sampleRate) throw domErr('NotSupportedError', 'IR sample rate differs from context');
    if (b && ![1, 2, 4].includes(b.numberOfChannels)) throw domErr('NotSupportedError', 'IR channel count');
    this._buffer = b;
    this.rev = b ? new ApproxReverb(this.context.sampleRate, b) : null;
  }
  _render(blk) {
    const [a, b] = this._sum(blk, this.iL, this.iR);
    if (!this.rev) { this.L.fill(0); this.out = [this.L, this.L]; return; }
    this.rev.run(0, a, this.L);
    this.rev.run(1, b, this.R);
    this.out = [this.L, this.R];
  }
}
class CompressorM extends NodeM {
  constructor(ctx) {
    super(ctx, 'Compressor');
    this.threshold = new AudioParamM(this, 'threshold', -24, -100, 0);
    this.knee = new AudioParamM(this, 'knee', 30, 0, 40);
    this.ratio = new AudioParamM(this, 'ratio', 12, 1, 20);
    this.attack = new AudioParamM(this, 'attack', 0.003, 0, 1);
    this.release = new AudioParamM(this, 'release', 0.25, 0, 1);
    this.reduction = 0; this.env = 0;
    this.la = Math.round(0.006 * ctx.sampleRate);
    this.ring = [new Float32Array(this.la + 1), new Float32Array(this.la + 1)]; this.ri = 0;
    this.iL = new Float32Array(BLOCK); this.iR = new Float32Array(BLOCK);
    this.meter = { peak: 0, sq: 0, n: 0, maxRed: 0 };
  }
  _render(blk) {
    const sr = this.context.sampleRate, t0 = this._t0(blk);
    const [a, b] = this._sum(blk, this.iL, this.iR);
    const T = this.threshold.fill(t0, sr, blk)[0], K = this.knee.fill(t0, sr, blk)[0], Rt = this.ratio.fill(t0, sr, blk)[0];
    const at = this.attack.fill(t0, sr, blk)[0], rl = this.release.fill(t0, sr, blk)[0];
    const curve = (x) => { if (x <= T - K / 2) return x; if (x >= T + K / 2) return T + (x - T) / Rt; const d = x - T + K / 2; return x + ((1 / Rt - 1) * d * d) / (2 * Math.max(K, 1e-6)); };
    const makeup = Math.pow(1 / Math.pow(10, curve(0) / 20), 0.6);
    const aC = Math.exp(-1 / (Math.max(at, 1e-4) * sr)), rC = Math.exp(-1 / (Math.max(rl, 1e-3) * sr));
    const L = this.L, R = this.R, m = this.meter, n = this.la + 1;
    for (let j = 0; j < BLOCK; j++) {
      const lvl = Math.max(Math.abs(a[j]), Math.abs(b[j]));
      m.peak = Math.max(m.peak, lvl); m.sq += (a[j] * a[j] + b[j] * b[j]) / 2; m.n++;
      const x = 20 * Math.log10(lvl + 1e-9);
      const tgt = curve(x) - x;
      this.env = tgt < this.env ? aC * this.env + (1 - aC) * tgt : rC * this.env + (1 - rC) * tgt;
      m.maxRed = Math.min(m.maxRed, this.env);
      const g = Math.pow(10, this.env / 20) * makeup;
      const k = this.ri;
      this.ring[0][k] = a[j]; this.ring[1][k] = b[j];
      const r = (k + 1) % n;
      L[j] = this.ring[0][r] * g; R[j] = this.ring[1][r] * g;
      this.ri = r;
    }
    this.reduction = this.env;
    this.out = [L, R];
  }
}

class SourceM extends NodeM {
  constructor(ctx, kind) { super(ctx, kind, 0, 1); this.startT = null; this.stopT = Infinity; this.ended = false; this.onended = null; this._finished = false; }
  start(when = 0) {
    if (this.startT !== null) throw domErr('InvalidStateError', `${this.kind}.start() called twice`);
    checkNum(when, `${this.kind}.start`);
    if (when < 0) throw new RangeError(`${this.kind}.start: negative time`);
    this.startT = when;
    this.context._sources.add(this);
    this.context.stats.sources++;
    this._activate();
  }
  stop(when = 0) {
    if (this.startT === null) throw domErr('InvalidStateError', `${this.kind}.stop() before start()`);
    checkNum(when, `${this.kind}.stop`);
    if (when < 0) throw new RangeError(`${this.kind}.stop: negative time`);
    this.stopT = when;
  }
  _naturalEnd() { return Infinity; }
  _checkEnd(tEnd) {
    if (this.ended) return;
    if (this.stopT <= tEnd || this._finished || this._naturalEnd() <= tEnd) {
      this.ended = true;
      this.context._sources.delete(this);
      this._deactivate();
      if (typeof this.onended === 'function') { try { this.onended({ target: this }); } catch (e) { this.context.issues.add('onended', String(e)); } }
    }
  }
}
function polyBlep(t, dt) {
  if (dt <= 0) return 0;
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
}
class OscM extends SourceM {
  constructor(ctx) {
    super(ctx, 'Oscillator');
    const n = ctx.sampleRate / 2;
    this.frequency = new AudioParamM(this, 'frequency', 440, -n, n);
    this.detune = new AudioParamM(this, 'detune', 0, -153600, 153600);
    this._type = 'sine'; this.table = null; this.ph = 0;
  }
  get type() { return this._type; }
  set type(v) {
    if (v === 'custom') throw domErr('InvalidStateError', "type 'custom' must be set with setPeriodicWave()");
    if (!['sine', 'square', 'sawtooth', 'triangle'].includes(v)) { this.context.issues.add('enum', `Oscillator.type '${v}' ignored`); return; }
    this._type = v; this.table = null;
  }
  setPeriodicWave(w) { if (!(w instanceof PeriodicWaveM)) throw new TypeError('setPeriodicWave needs a PeriodicWave'); this._type = 'custom'; this.table = w.table; }
  _render(blk) {
    const sr = this.context.sampleRate, t0 = this._t0(blk), L = this.L, nyq = sr / 2;
    this.out = [L, L];
    const f = this.frequency.fill(t0, sr, blk), dt = this.detune.fill(t0, sr, blk);
    const s0 = this.startT, s1 = this.stopT, type = this._type, tab = this.table;
    let ph = this.ph;
    for (let j = 0; j < BLOCK; j++) {
      const t = t0 + j / sr;
      if (t < s0 || t >= s1) { L[j] = 0; continue; }
      let fr = f[j];
      if (dt[j] !== 0) fr *= Math.pow(2, dt[j] / 1200);
      if (fr > nyq) fr = nyq; else if (fr < -nyq) fr = -nyq;
      const inc = Math.abs(fr) / sr;
      let y;
      if (type === 'sine') y = Math.sin(2 * Math.PI * ph);
      else if (type === 'sawtooth') { const p = (ph + 0.5) % 1; y = 2 * p - 1 - polyBlep(p, inc); } else if (type === 'square') y = (ph < 0.5 ? 1 : -1) + polyBlep(ph, inc) - polyBlep((ph + 0.5) % 1, inc);
      else if (type === 'triangle') y = ph < 0.25 ? 4 * ph : ph < 0.75 ? 2 - 4 * ph : 4 * ph - 4;
      else { const x = ph * 2048, i = Math.floor(x), a = tab[i & 2047]; y = a + (tab[(i + 1) & 2047] - a) * (x - i); }
      L[j] = y;
      ph += fr / sr;
      ph -= Math.floor(ph);
    }
    this.ph = ph;
  }
}
class BufSrcM extends SourceM {
  constructor(ctx) {
    super(ctx, 'BufferSource');
    this._buffer = null; this.loop = false; this.loopStart = 0; this.loopEnd = 0; this.offset = 0; this.pos = null;
    this.playbackRate = new AudioParamM(this, 'playbackRate', 1);
    this.detune = new AudioParamM(this, 'detune', 0, -153600, 153600);
  }
  get buffer() { return this._buffer; }
  set buffer(b) {
    if (b !== null && !(b instanceof AudioBufferM)) throw new TypeError('buffer must be an AudioBuffer');
    if (this._buffer && b) throw domErr('InvalidStateError', 'buffer can only be set once');
    this._buffer = b;
  }
  start(when = 0, offset = 0, duration) {
    super.start(when);
    checkNum(offset, 'BufferSource.start offset');
    if (offset < 0) throw new RangeError('BufferSource.start: negative offset');
    this.offset = offset;
    if (duration !== undefined) { checkNum(duration, 'BufferSource.start duration'); this.stopT = Math.min(this.stopT, when + duration); }
  }
  _naturalEnd() {
    if (this.loop || !this._buffer || this.startT === null) return Infinity;
    return this.startT + Math.max(0, this._buffer.duration - this.offset) / Math.max(1e-6, Math.abs(this.playbackRate.value));
  }
  _render(blk) {
    const sr = this.context.sampleRate, t0 = this._t0(blk), b = this._buffer;
    const L = this.L, R = this.R;
    if (!b) { L.fill(0); this.out = [L, L]; return; }
    const stereo = b.numberOfChannels > 1, d0 = b._data[0], d1 = stereo ? b._data[1] : d0, n = b.length;
    const ratio = b.sampleRate / sr;
    const rate = this.playbackRate.fill(t0, sr, blk), dt = this.detune.fill(t0, sr, blk);
    let ls = 0, le = n;
    if (this.loop && (this.loopStart || this.loopEnd)) { ls = Math.max(0, Math.floor(this.loopStart * b.sampleRate)); le = this.loopEnd > 0 ? Math.min(n, Math.floor(this.loopEnd * b.sampleRate)) : n; if (le <= ls) { ls = 0; le = n; } }
    if (this.pos === null) { this.pos = this.offset * b.sampleRate; if (this.loop) { while (this.pos >= le) this.pos -= le - ls; } }
    let p = this.pos;
    for (let j = 0; j < BLOCK; j++) {
      const t = t0 + j / sr;
      if (t < this.startT || t >= this.stopT || this._finished) { L[j] = 0; R[j] = 0; continue; }
      if (!this.loop && p >= n) { this._finished = true; L[j] = 0; R[j] = 0; continue; }
      const i = Math.floor(p), fr = p - i;
      let i2 = i + 1;
      if (this.loop && i2 >= le) i2 = ls; else if (i2 >= n) i2 = n - 1;
      L[j] = d0[i] + (d0[i2] - d0[i]) * fr;
      R[j] = stereo ? d1[i] + (d1[i2] - d1[i]) * fr : L[j];
      p += rate[j] * ratio * (dt[j] ? Math.pow(2, dt[j] / 1200) : 1);
      if (this.loop) while (p >= le) p -= le - ls;
    }
    this.pos = p;
    this.out = stereo ? [L, R] : [L, L];
  }
}
class AudioBufferM {
  constructor(ch, len, sr) {
    if (!(ch >= 1 && ch <= 32)) throw domErr('NotSupportedError', `numberOfChannels ${ch}`);
    if (!(len >= 1)) throw domErr('NotSupportedError', `length ${len}`);
    if (!(sr >= 3000 && sr <= 768000)) throw domErr('NotSupportedError', `sampleRate ${sr}`);
    this.numberOfChannels = ch; this.length = Math.floor(len); this.sampleRate = sr; this.duration = this.length / sr;
    this._data = Array.from({ length: ch }, () => new Float32Array(this.length));
  }
  getChannelData(c) { if (!(c >= 0 && c < this.numberOfChannels)) throw domErr('IndexSizeError', `channel ${c}`); return this._data[c]; }
  copyToChannel(src, c, o = 0) { this.getChannelData(c).set(src, o); }
  copyFromChannel(dst, c, o = 0) { dst.set(this.getChannelData(c).subarray(o, o + dst.length)); }
}
class PeriodicWaveM {
  constructor(real, imag, opts) {
    if (real.length !== imag.length || real.length < 2) throw domErr('IndexSizeError', 'PeriodicWave arrays');
    const t = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      const x = (2 * Math.PI * i) / 2048;
      let y = 0;
      for (let k = 1; k < real.length; k++) y += real[k] * Math.cos(k * x) + imag[k] * Math.sin(k * x);
      t[i] = y;
    }
    if (!(opts && opts.disableNormalization)) { let m = 0; for (const v of t) m = Math.max(m, Math.abs(v)); if (m > 0) for (let i = 0; i < 2048; i++) t[i] /= m; }
    this.table = t;
  }
}

class MockAudioContext {
  constructor(opts = {}) {
    this.sampleRate = opts.sampleRate || SR;
    this.currentTime = 0;
    this.state = 'suspended';
    this.baseLatency = 0.005;
    this.issues = new Issues();
    this.stats = { nodes: 0, kinds: {}, sources: 0, automation: 0, maxActive: 0 };
    this._sources = new Set();
    this.destination = new DestM(this);
    this.onstatechange = null;
    this.listener = {};
  }
  resume() { if (this.state !== 'closed') this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
  addEventListener() {}
  removeEventListener() {}
  createGain() { return new GainM(this); }
  createOscillator() { return new OscM(this); }
  createBufferSource() { return new BufSrcM(this); }
  createBiquadFilter() { return new BiquadM(this); }
  createDelay(max) { return new DelayM(this, max); }
  createConvolver() { return new ConvolverM(this); }
  createDynamicsCompressor() { return new CompressorM(this); }
  createStereoPanner() { return new PannerM(this); }
  createWaveShaper() { return new ShaperM(this); }
  createBuffer(ch, len, sr) { return new AudioBufferM(ch, len, sr); }
  createPeriodicWave(real, imag, o) { return new PeriodicWaveM(real, imag, o); }
  get activeSources() { return this._sources.size; }
  _endSources(t) { for (const s of [...this._sources]) s._checkEnd(t); this.stats.maxActive = Math.max(this.stats.maxActive, this._sources.size); }
  // advance time without DSP (fast API testing); tick() is called every 25 ms of audio time
  advance(secs, tick) {
    const end = this.currentTime + secs;
    while (this.currentTime < end - 1e-9) {
      this.currentTime = Math.min(end, this.currentTime + 0.025);
      this._endSources(this.currentTime);
      if (tick) tick();
    }
  }
  // real rendering: sink(L, R) receives every 128-frame block
  render(secs, tick, sink) {
    const sr = this.sampleRate;
    let blk = Math.round((this.currentTime * sr) / BLOCK);
    const n = Math.ceil((secs * sr) / BLOCK);
    let nextTick = this.currentTime;
    for (let k = 0; k < n; k++, blk++) {
      this.currentTime = (blk * BLOCK) / sr;
      if (tick && this.currentTime >= nextTick) { tick(); nextTick += 0.025; }
      const o = this.destination.process(blk);
      sink(o[0], o[1]);
      this.currentTime = ((blk + 1) * BLOCK) / sr;
      this._endSources(this.currentTime);
    }
  }
}

// =====================================================================================================================
// Sandbox: core.js + audio.js with the mock
// =====================================================================================================================
function loadAudio({ withAudio = true, sr = SR } = {}) {
  const warns = [], intervals = [], listeners = {};
  const holder = { ctx: null, count: 0 };
  const sb = {
    console: { log: (...a) => warns.push('LOG ' + a.join(' ')), warn: (...a) => warns.push(a.join(' ')), error: (...a) => warns.push('ERROR ' + a.join(' ')), info() {}, debug() {} },
    Math, JSON, Date, Array, Object, String, Number, Boolean, Map, Set, WeakMap, Promise, Symbol, Error, TypeError, RangeError,
    RegExp, parseInt, parseFloat, isNaN, isFinite, Float32Array, Float64Array, Uint8Array, Int32Array, ArrayBuffer, Infinity, NaN,
    setInterval: (fn, ms) => { intervals.push({ fn, ms }); return intervals.length; },
    clearInterval() {}, setTimeout: () => 0, clearTimeout() {},
    addEventListener: (e, fn) => { (listeners[e] = listeners[e] || []).push(fn); },
    removeEventListener: (e, fn) => { const l = listeners[e]; if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); } },
    performance: { now: () => Date.now() },
  };
  if (withAudio) {
    sb.AudioContext = class extends MockAudioContext {
      constructor(o) { super(Object.assign({}, o, { sampleRate: sr })); holder.ctx = this; holder.count++; }
    };
  }
  sb.window = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of ['src/engine/core.js', 'src/engine/audio.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  const tick = () => { for (const it of intervals) it.fn(); };
  return { AV: sb.AV, A: sb.AV.audio, warns, intervals, listeners, tick, holder, get ctx() { return holder.ctx; } };
}

// =====================================================================================================================
// Smoke test
// =====================================================================================================================
let failures = 0, passes = 0;
function check(name, cond, detail) {
  if (cond) { passes++; if (VERBOSE) console.log(`  ok    ${name}`); } else { failures++; console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
}
function noThrow(name, fn) {
  try { fn(); check(name, true); } catch (e) { check(name, false, e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e)); }
}
function takeWarnings(env, expectPattern) {
  const w = env.warns.splice(0);
  return expectPattern ? w.filter((x) => !expectPattern.test(x)) : w;
}

function smoke() {
  console.log('audio smoke test');

  // --- 1. no Web Audio at all
  {
    const env = loadAudio({ withAudio: false });
    const A = env.A;
    noThrow('no-webaudio: every call is a no-op', () => {
      A.init(); A.sfx('hit'); A.music('title'); A.ambience(['wind']); A.setVolumes({ master: 0.5 }); A.text(1); A.update(0.016);
    });
    check('no-webaudio: ready stays false', A.ready === false);
    check('no-webaudio: nothing logged', env.warns.length === 0, env.warns.join(' | '));
  }

  // --- 2. with the mock
  const env = loadAudio();
  const A = env.A;
  check('audio.js replaced the core stub in place', typeof A.stats === 'function' && A.ids && A.ids.sfx.length > 0);
  check('pre-init: ready false', A.ready === false);
  noThrow('pre-init: calls are safe', () => {
    A.sfx('hit'); A.text(1); A.update(0.016); A.setVolumes({ master: 0.9, music: 0.6, sfx: 0.85 });
    A.music('title'); A.ambience(['wind']);
  });
  check('pre-init: no AudioContext created', env.holder.count === 0);
  check('gesture listeners installed', ['keydown', 'pointerdown'].every((e) => (env.listeners[e] || []).length === 1));

  let ok;
  noThrow('init()', () => { ok = A.init(); });
  const ctx = env.ctx;
  check('init returns true, ready true', ok === true && A.ready === true);
  check('context resumed', ctx && ctx.state === 'running');
  check('scheduler interval registered (~25 ms)', env.intervals.length === 1 && env.intervals[0].ms <= 30);
  check('pending music started at init', A.playing() === 'title' && A.stats().tracks === 1);
  check('pending ambience started at init', A.stats().beds === 1);
  noThrow('init() again is idempotent', () => { A.init(); A.init(); });
  check('only one AudioContext', env.holder.count === 1);
  check('volumes set before init were kept', A.getVolumes().music === 0.6);
  noThrow('gesture listener calls init safely', () => { for (const fn of [...(env.listeners.keydown || [])]) fn({}); });
  check('listeners detached once running', (env.listeners.keydown || []).length === 0);

  // every contract id is implemented
  check('every contract sfx id exists', SFX_IDS.every((id) => A.ids.sfx.includes(id)), SFX_IDS.filter((id) => !A.ids.sfx.includes(id)).join(','));
  check('every contract music id exists', MUSIC_IDS.every((id) => A.ids.music.includes(id)), MUSIC_IDS.filter((id) => !A.ids.music.includes(id)).join(','));
  check('every ambience id exists', AMB_IDS.every((id) => A.ids.ambience.includes(id)));
  check('init produced no warnings', takeWarnings(env).length === 0);

  // --- sfx: each id, default and randomised options, extremes
  A.music(null); A.ambience([]);
  ctx.advance(4, env.tick);
  for (const id of SFX_IDS) {
    const before = ctx.stats.sources;
    noThrow(`sfx ${id}`, () => A.sfx(id));
    check(`sfx ${id} makes sound`, ctx.stats.sources > before);
    ctx.advance(0.4, env.tick);
    noThrow(`sfx ${id} with options`, () => {
      A.sfx(id, { vol: 0.7, pitch: 0.8 + Math.random() * 0.4, pan: Math.random() * 2 - 1 }); ctx.advance(0.4, env.tick);
      A.sfx(id, { vol: 1, pitch: 0.25, pan: -1 }); ctx.advance(0.4, env.tick);
      A.sfx(id, { vol: 1, pitch: 4, pan: 1 }); ctx.advance(0.4, env.tick);
      A.sfx(id, 0.5); ctx.advance(0.4, env.tick);
    });
  }
  check('sfx produced no warnings', takeWarnings(env).length === 0);
  ctx.advance(12, env.tick);

  noThrow('sfx garbage input', () => {
    A.sfx('hit', { vol: NaN, pitch: -1, pan: 7 }); ctx.advance(0.1, env.tick);
    A.sfx('hit', { vol: Infinity, pitch: 'x', pan: null }); ctx.advance(0.1, env.tick);
    A.sfx('hit', 'loud'); ctx.advance(0.1, env.tick);
    A.sfx('hit', null); ctx.advance(0.1, env.tick);
    A.sfx(undefined); A.sfx(null); A.sfx(42); A.sfx('definitely_not_a_sound'); A.sfx('toString'); A.sfx('__proto__');
  });
  const w1 = takeWarnings(env, /unknown sfx/);
  check('garbage sfx input only reports unknown ids', w1.length === 0, w1.join(' | '));
  {
    const before = ctx.stats.sources;
    A.sfx('bell', { vol: 0 });
    check('vol 0 creates nothing', ctx.stats.sources === before);
  }

  // rate limiting and voice cap
  {
    ctx.advance(10, env.tick);
    const before = ctx.stats.sources;
    for (let k = 0; k < 20; k++) A.sfx('step');
    const made = ctx.stats.sources - before;
    check('same-instant repeats are rate limited', made > 0 && made <= 8, `${made} sources for 20 calls`);
    let peak = 0;
    for (let k = 0; k < 300; k++) {
      A.sfx(SFX_IDS[k % SFX_IDS.length], { pitch: 1 + (k % 7) * 0.01 });
      if (k % 3 === 0) ctx.advance(0.002, env.tick);
      peak = Math.max(peak, A.stats().live);
    }
    check('voice cap holds under a storm of 300 sfx', peak <= 32, `peak ${peak} live voices`);
    check('storm produced no warnings', takeWarnings(env).length === 0);
    ctx.advance(14, env.tick);
    check('voices are released after they finish', A.stats().voices === 0, `${A.stats().voices} left`);
  }

  // text blips
  {
    const before = ctx.stats.sources;
    noThrow('text() burst', () => { for (let k = 0; k < 60; k++) { A.text(0.5 + (k % 5) * 0.25); ctx.advance(0.01); } });
    const made = ctx.stats.sources - before;
    check('text() is throttled (~30 ms)', made >= 12 && made <= 25, `${made} blips in 0.6 s`);
    noThrow('text() garbage', () => { A.text(); A.text(NaN); A.text(-4); A.text(1e9); A.text('high'); A.sfx('text', { pitch: 1.2 }); });
    check('text produced no warnings', takeWarnings(env).length === 0);
  }

  // --- music
  ctx.advance(3, env.tick);
  for (const id of MUSIC_IDS) {
    const before = ctx.stats.sources;
    noThrow(`music ${id}`, () => A.music(id, { fade: 1 }));
    ctx.advance(95, env.tick);
    const made = ctx.stats.sources - before;
    check(`music ${id} plays (sources scheduled over 95 s: ${made})`, made > 20);
    check(`music ${id}: old track retired after crossfade`, A.stats().tracks === 1, `${A.stats().tracks} tracks`);
    const nodes = ctx.stats.nodes;
    A.music(id);
    check(`music ${id}: same id is a no-op`, ctx.stats.nodes === nodes);
    if (VERBOSE) console.log(`        ${id}: ${(made / 95).toFixed(1)} sources/s, max active ${ctx.stats.maxActive}`);
    ctx.stats.maxActive = 0;
  }
  check('music produced no warnings', takeWarnings(env).length === 0);
  noThrow('music: rapid switching', () => {
    for (let k = 0; k < 30; k++) { A.music(MUSIC_IDS[k % MUSIC_IDS.length], { fade: k % 3 }); ctx.advance(0.05, env.tick); }
    A.music('boss'); A.music('title', { fade: 0 }); A.music('boss', { fade: 1000 }); A.music('title', { fade: -3 });
  });
  ctx.advance(40, env.tick);
  check('rapid switching settles to one track', A.stats().tracks === 1, `${A.stats().tracks} tracks`);
  noThrow('music garbage', () => { A.music('no_such_track'); A.music(12); A.music({}); A.music('stop'); });
  check('music garbage only reports unknown ids', takeWarnings(env, /unknown music/).length === 0);
  ctx.advance(5, env.tick);
  check("music('stop') fades out", A.stats().tracks === 0 && A.playing() === null);
  noThrow('music null twice', () => { A.music(null); A.music(null, { fade: 3 }); });

  // --- ambience
  const combos = [[], ['wind'], ['rain', 'wind'], ['fire'], ['ash'], ['embers', 'fog'], [{ id: 'rain', vol: 0.4 }], ['rain'], 'wind', null, ['bogus', 'wind', 'wind'], []];
  for (const c of combos) {
    noThrow(`ambience ${JSON.stringify(c)}`, () => A.ambience(c, { indoor: Math.random() < 0.3 }));
    ctx.advance(20, env.tick);
  }
  check('ambience produced no warnings', takeWarnings(env).length === 0);
  check('ambience [] leaves nothing playing', A.stats().beds === 0 && A.stats().dying === 0);

  // --- volumes
  noThrow('setVolumes variants', () => {
    A.setVolumes({ master: 0.5 }); A.setVolumes({ music: 0 }); A.setVolumes({ sfx: 2 }); A.setVolumes({ master: NaN, music: -1 });
    A.setVolumes(null); A.setVolumes('x'); A.setVolumes({});
  });
  const v = A.getVolumes();
  check('setVolumes clamps and ignores junk', v.master === 0.5 && v.music === 0 && v.sfx === 1, JSON.stringify(v));
  noThrow('update(dt)', () => { A.update(0.016); A.update(); A.update(NaN); });

  // --- long run: everything at once, then silence → no leaks
  A.setVolumes({ master: 0.8, music: 0.7, sfx: 0.8 });
  A.music('boss'); A.ambience(['rain', 'wind', 'fire']);
  for (let s = 0; s < 240; s++) { A.sfx(SFX_IDS[s % SFX_IDS.length]); ctx.advance(0.5, env.tick); }
  check('long mixed session produced no warnings', takeWarnings(env).length === 0);
  A.music(null); A.ambience([]);
  ctx.advance(20, env.tick);
  check('no sources left running after silence', ctx.activeSources === 0, `${ctx.activeSources} still active`);
  const st = A.stats();
  check('no tracks, beds or voices left', st.tracks === 0 && st.beds === 0 && st.dying === 0 && st.voices === 0, JSON.stringify(st));

  // --- mock-level issues (range violations, dead ramps, runaway automation, NaN …)
  const issues = ctx.issues.list();
  check('no spec issues recorded by the mock', issues.length === 0, '\n        ' + issues.slice(0, 40).join('\n        '));
  console.log(`  nodes created ${ctx.stats.nodes}, sources ${ctx.stats.sources}, automation events ${ctx.stats.automation}`);
  console.log(`${failures ? 'FAILED' : 'PASSED'}: ${passes} checks passed, ${failures} failed`);
}

// =====================================================================================================================
// Offline rendering, statistics and spectrograms (--render)
// =====================================================================================================================
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j], ui = im[i + j];
        const vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci, vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
        re[i + j] = ur + vr; im[i + j] = ui + vi; re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
const EMBER = [[0, 0, 0], [20, 17, 24], [61, 15, 10], [122, 28, 16], [184, 54, 26], [226, 98, 31], [245, 154, 54], [252, 207, 99], [255, 243, 194]];
function ember(x) {
  x = Math.max(0, Math.min(1, x)) * (EMBER.length - 1);
  const i = Math.floor(x), f = x - i, a = EMBER[i], b = EMBER[Math.min(i + 1, EMBER.length - 1)];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}
function spectrogram(mono, sr, file, title, maxCols = 1400) {
  const N = 2048, H = 220, WAVE = 48;
  const hop = Math.max(128, Math.ceil(mono.length / maxCols / 128) * 128);
  const cols = Math.max(1, Math.floor((mono.length - N) / hop));
  const img = new Img(cols, H + WAVE + 1, [8, 7, 11]);
  const win = new Float64Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
  const fLo = 30, fHi = Math.min(16000, sr / 2);
  for (let c = 0; c < cols; c++) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = (mono[c * hop + i] || 0) * win[i];
    fft(re, im);
    for (let y = 0; y < H; y++) {
      const fa = fLo * Math.pow(fHi / fLo, (H - 1 - y) / H), fb = fLo * Math.pow(fHi / fLo, (H - y) / H);
      let ka = Math.floor((fa * N) / sr), kb = Math.max(ka + 1, Math.ceil((fb * N) / sr));
      let m = 0;
      for (let k = ka; k < kb && k < N / 2; k++) m = Math.max(m, Math.hypot(re[k], im[k]));
      const db = 20 * Math.log10((m * 4) / N + 1e-12);
      const [r, g, b] = ember((db + 96) / 86);
      img.setPx(c, WAVE + 1 + y, r, g, b);
    }
    let pk = 0;
    for (let i = 0; i < hop; i++) pk = Math.max(pk, Math.abs(mono[c * hop + i] || 0));
    const h = Math.round(Math.min(1, pk) * (WAVE - 2));
    for (let y = 0; y < h; y++) img.setPx(c, WAVE - 1 - y, 130, 168, 173);
    if (pk > 0.98) img.setPx(c, 0, 255, 60, 60);
  }
  for (let x = 0; x < cols; x++) img.setPx(x, WAVE, 60, 52, 70);
  const secs = mono.length / sr, step = secs > 20 ? 5 : secs > 5 ? 1 : 0.25;   // time ticks
  for (let s = step; s < secs; s += step) { const x = Math.round((s * sr) / hop); for (let y = WAVE + 1; y < WAVE + 6; y++) img.setPx(x, y, 200, 200, 200); }
  for (const f of [100, 1000, 10000]) { const y = WAVE + 1 + Math.round(H - 1 - (Math.log(f / fLo) / Math.log(fHi / fLo)) * H); for (let x = 0; x < 6; x++) img.setPx(x, y, 200, 200, 200); }
  writePNG(file, img);
}
const dbfs = (x) => (x > 0 ? (20 * Math.log10(x)).toFixed(1) : '-inf');
function analyse(L, R, sr) {
  const n = L.length;
  let peak = 0, sq = 0, nan = 0;
  for (let i = 0; i < n; i++) {
    const a = L[i], b = R[i];
    if (!Number.isFinite(a) || !Number.isFinite(b)) { nan++; continue; }
    peak = Math.max(peak, Math.abs(a), Math.abs(b));
    sq += (a * a + b * b) / 2;
  }
  const win = Math.floor(sr * 0.3), hop = Math.floor(sr * 0.05);
  let st = 0;
  for (let s = 0; s + win <= n; s += hop) {
    let e = 0;
    for (let i = s; i < s + win; i++) e += (L[i] * L[i] + R[i] * R[i]) / 2;
    st = Math.max(st, Math.sqrt(e / win));
  }
  let last = 0;
  const thr = peak * 0.001;                          // −60 dB below peak
  for (let i = n - 1; i >= 0; i--) if (Math.abs(L[i]) > thr || Math.abs(R[i]) > thr) { last = i; break; }
  // clicks: a big jump out of (or into) near silence
  let clicks = 0;
  for (let i = 3; i < n - 3; i++) {
    for (const x of [L, R]) {
      const d = Math.abs(x[i] - x[i - 1]);
      if (d > 0.06 && Math.max(Math.abs(x[i - 2]), Math.abs(x[i - 3])) < 0.0015) { clicks++; i += 64; break; }
      if (Math.abs(x[i - 1]) > 0.06 && Math.max(Math.abs(x[i]), Math.abs(x[i + 1]), Math.abs(x[i + 2])) < 0.0015) { clicks++; i += 64; break; }
    }
  }
  return { peak, rms: Math.sqrt(sq / n), st, tail: last / sr, clicks, nan };
}
function renderCase(label, setup, secs, file) {
  const env = loadAudio();
  const A = env.A;
  A.init();
  const ctx = env.ctx;
  const comp = [...Object.values(ctx.destination.ins)][0] || [...ctx.destination.ins][0];
  const extra = setup(A, ctx, env) || {};
  const n = Math.ceil((secs * ctx.sampleRate) / BLOCK) * BLOCK;
  const L = new Float32Array(n), R = new Float32Array(n);
  let w = 0;
  ctx.render(secs, env.tick, (a, b) => { L.set(a, w); R.set(b, w); w += BLOCK; });
  const skip = Math.floor((extra.skip || 0) * ctx.sampleRate);
  const s = analyse(L.subarray(skip), R.subarray(skip), ctx.sampleRate);
  const meter = comp && comp.meter ? comp.meter : null;
  const warns = takeWarnings(env);
  const issues = ctx.issues.list();
  if (file) {
    const mono = new Float32Array(n);
    for (let i = 0; i < n; i++) mono[i] = (L[i] + R[i]) / 2;
    spectrogram(mono, ctx.sampleRate, file, label);
  }
  return { label, s, pre: meter ? meter.peak : 0, red: meter ? meter.maxRed : 0, warns, issues, sources: ctx.stats.sources, nodes: ctx.stats.nodes };
}
function renderAll() {
  fs.mkdirSync(OUT, { recursive: true });
  const want = (id) => !ONLY.length || ONLY.includes(id);
  const row = (r, extra = '') => {
    const s = r.s;
    const flag = [s.clicks ? `CLICKS ${s.clicks}` : '', s.nan ? `NaN ${s.nan}` : '', s.peak >= 0.99 ? 'CLIP' : '', r.warns.length ? 'WARN' : '', r.issues.length ? 'ISSUES' : ''].filter(Boolean).join(' ');
    console.log(`  ${r.label.padEnd(22)} peak ${dbfs(s.peak).padStart(6)}  pre ${dbfs(r.pre).padStart(6)}  st ${dbfs(s.st).padStart(6)}  rms ${dbfs(s.rms).padStart(6)}  gr ${r.red.toFixed(1).padStart(5)}  tail ${s.tail.toFixed(2).padStart(5)}s ${extra} ${flag}`);
    for (const x of r.warns) console.log('      warn: ' + x);
    for (const x of r.issues.slice(0, 8)) console.log('      issue: ' + x);
  };
  console.log(`\nrender @ ${SR} Hz (dBFS; peak/st/rms after the master compressor, pre = compressor input peak, gr = max gain reduction dB)`);
  console.log('sfx (default volumes):');
  for (const id of SFX_IDS) {
    if (!want(id)) continue;
    let len = 0;
    const r = renderCase(id, (A, ctx) => { A.sfx(id); len = 0; }, 0, null);
    void r; void len;
    const r2 = renderCase(id, (A) => { A.sfx(id); }, sfxSecs(id), path.join(OUT, `sfx_${id}.png`));
    row(r2);
  }
  console.log('music (default volumes, first 4 s skipped for the fade-in):');
  for (const id of MUSIC_IDS) {
    if (!want(id)) continue;
    const r = renderCase(id, (A) => { A.music(id, { fade: 0.1 }); return { skip: 4 }; }, MUSIC_SECS, path.join(OUT, `music_${id}.png`));
    row(r, `src ${r.sources}`);
  }
  console.log('ambience (default volumes):');
  for (const id of AMB_IDS) {
    if (!want(id)) continue;
    const r = renderCase(id, (A) => { A.ambience([id]); return { skip: 3 }; }, 16, path.join(OUT, `amb_${id}.png`));
    row(r);
  }
  if (want('mix')) {
    console.log('mix: boss music + rain + a fight:');
    const r = renderCase('mix', (A, ctx, env) => {
      A.music('boss', { fade: 0.1 }); A.ambience(['rain', 'wind']);
      const plan = ['swing', 'hit', 'swing2', 'hit_heavy', 'roar', 'slam', 'hurt', 'roll', 'step', 'step', 'block', 'projectile', 'enemy_die', 'penny', 'heal'];
      let k = 0;
      env.intervals.push({ fn: () => { if (ctx.currentTime > 2 && ctx.currentTime < 14 && Math.random() < 0.06) A.sfx(plan[k++ % plan.length]); }, ms: 25 });
      return { skip: 2 };
    }, 16, path.join(OUT, 'mix_fight.png'));
    row(r);
  }
}
function sfxSecs(id) {
  const long = { boss_intro: 12, bell_big: 11, chapter: 11, boss_die: 9, respawn: 9, shrine: 8, bell: 7, key_item: 7, death: 7, rest: 7, kindle: 6, snuff: 5, heal: 5, quest: 5, whisper: 5 };
  return long[id] || 3.5;
}

smoke();
if (RENDER && !failures) renderAll();
process.exitCode = failures ? 1 : 0;
