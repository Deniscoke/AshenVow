// ASHEN VOW — voiced dialogue. Plays pre-generated lines (assets/voice, built by tools/voices.js) in sync with
// the dialogue box. Every line has a text fallback: a missing file simply means silence and the usual blips.
(function (AV) {
  'use strict';

  let current = null;       // HTMLAudioElement playing now
  let ducked = false;

  const V = AV.voice = {
    get manifest() { return window.AV_VOICE || {}; },
    get playing() { return !!(current && !current.paused && !current.ended); },
    keyFor(s) { return s && s.id && s.nodeId != null ? s.id + '|' + s.nodeId + '|' + s.page : null; },
    has(s) { const k = V.keyFor(s); return !!(k && V.manifest[k]); },

    // called by the dialogue system whenever a new page appears
    page(s) {
      V.stop();
      const k = V.keyFor(s);
      const src = k && V.manifest[k];
      if (!src) return;
      const st = AV.settings;
      const vol = (st.voice != null ? st.voice : 1) * (st.master != null ? st.master : 1);
      if (vol <= 0) return;
      try {
        const a = new Audio(src);
        a.volume = Math.max(0, Math.min(1, vol));
        a.addEventListener('ended', () => { if (current === a) { current = null; unduck(); } });
        a.addEventListener('error', () => { if (current === a) { current = null; unduck(); } });
        const p = a.play();
        if (p && p.catch) p.catch(() => { if (current === a) { current = null; unduck(); } });
        current = a;
        duck();
      } catch (e) { current = null; }
    },
    stop() {
      if (current) { try { current.pause(); } catch (e) { /* ignore */ } current = null; }
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
