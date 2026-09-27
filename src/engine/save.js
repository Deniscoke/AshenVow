// ASHEN VOW — localStorage save slot
(function (AV) {
  'use strict';
  const KEY = 'ashenvow.save.v1';
  const META = 'ashenvow.meta';

  AV.save = {
    exists() {
      try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
    },
    write(data) {
      try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
      catch (e) { console.error('[AV] save failed', e); return false; }
    },
    read() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        const d = JSON.parse(raw);
        return d && d.version === 1 ? d : null;
      } catch (e) { console.error('[AV] save corrupt', e); return null; }
    },
    clear() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } },
    // endings reached across all playthroughs (shown on the title screen)
    meta() { try { return JSON.parse(localStorage.getItem(META) || '{}'); } catch (e) { return {}; } },
    markEnding(id) {
      const m = AV.save.meta();
      m.endings = m.endings || {};
      m.endings[id] = (m.endings[id] || 0) + 1;
      try { localStorage.setItem(META, JSON.stringify(m)); } catch (e) { /* ignore */ }
    },
  };
})(window.AV);
