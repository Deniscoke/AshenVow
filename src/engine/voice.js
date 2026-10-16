// ASHEN VOW — voiced dialogue. Plays pre-generated lines (assets/voice, built by tools/voices.js) in sync with
// the dialogue box. Only characters are voiced; narration keeps the typewriter blips. Every line has a text
// fallback: a missing file simply means silence and the usual blips.
(function (AV) {
  'use strict';

  let current = null;       // HTMLAudioElement playing now
  let currentUrl = null;    // blob: URL of the current line (packed builds), revoked when it stops
  let ducked = false;
  let seq = 0;              // bumps on every page/stop so a slow pack download never plays a stale line
  let pending = -1;         // seq of a line still downloading (counts as speaking, so no blips first)
  const packs = {};         // pack url -> Promise<ArrayBuffer>

  // A manifest entry is either a file url (source tree) or [pack url, byte offset, byte length] (tools/build.js).
  function sourceFor(entry) {
    if (typeof entry === 'string') return Promise.resolve({ src: entry, blob: false });
    const [url, off, len] = entry;
    if (!packs[url]) {
      packs[url] = fetch(url).then((r) => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.arrayBuffer(); });
      packs[url].catch(() => { delete packs[url]; });   // let a later line retry after a network hiccup
    }
    return packs[url].then((buf) => ({ src: URL.createObjectURL(new Blob([buf.slice(off, off + len)], { type: 'audio/mpeg' })), blob: true }));
  }

  const V = AV.voice = {
    get manifest() { return window.AV_VOICE || {}; },
    get playing() { return pending === seq || !!(current && !current.paused && !current.ended); },
    keyFor(s) { return s && s.id && s.nodeId != null ? s.id + '|' + s.nodeId + '|' + s.page : null; },
    has(s) { const k = V.keyFor(s); return !!(k && V.manifest[k]); },
    // narration (descriptions, atmosphere) is read, never heard: only characters speak aloud
    isNarration(s) { return !s || !s.who || s.who === 'narrator' || s.who === '__page'; },

    // called by the dialogue system whenever a new page appears
    page(s) {
      V.stop();
      if (V.isNarration(s)) return;
      const k = V.keyFor(s);
      const entry = k && V.manifest[k];
      if (!entry) return;
      const st = AV.settings;
      const vol = (st.voice != null ? st.voice : 1) * (st.master != null ? st.master : 1);
      if (vol <= 0) return;
      const my = pending = seq;
      sourceFor(entry).then(({ src, blob }) => {
        if (pending === my) pending = -1;
        if (my !== seq) { if (blob) URL.revokeObjectURL(src); return; }   // the page moved on while loading
        const a = new Audio(src);
        const done = () => { if (current === a) V.stop(); };
        a.volume = Math.max(0, Math.min(1, vol));
        a.addEventListener('ended', done);
        a.addEventListener('error', done);
        current = a;
        currentUrl = blob ? src : null;
        const p = a.play();
        if (p && p.catch) p.catch(done);
        duck();
      }).catch(() => { if (pending === my) pending = -1; /* no voice for this line: the text and blips carry it */ });
    },
    stop() {
      seq++;
      if (current) { try { current.pause(); } catch (e) { /* ignore */ } current = null; }
      if (currentUrl) { URL.revokeObjectURL(currentUrl); currentUrl = null; }
      unduck();
    },
  };

  // lower the music under a spoken line
  function duck() {
    if (ducked || !AV.audio.setVolumes) return;
    ducked = true;
    const st = AV.settings;
    AV.audio.setVolumes({ master: st.master, music: st.music * 0.45, sfx: st.sfx });
  }
  function unduck() {
    if (!ducked) return;
    ducked = false;
    if (AV.settings && AV.settings.apply) AV.settings.apply();
  }
})(window.AV);
