// ASHEN VOW — touch controls for phones/tablets: floating joystick (left), action buttons (right),
// landscape lock + fullscreen, and a "turn your phone" screen in portrait.
(function (AV) {
  'use strict';
  const I = AV.input;
  const W = AV.W, H = AV.H;

  const T = AV.touch = {
    enabled: false,           // becomes true on the first touch (or on a touch-first device)
    portrait: false,
    stick: null,              // { id, ox, oy, x, y } in internal pixels
    pressed: new Map(),       // touch id → button
  };

  // Buttons in internal (384×216) coordinates. hit = touch radius, r = drawn radius.
  const BUTTONS = [
    { id: 'attack', x: 342, y: 172, r: 19, label: 'ATK', actions: ['attack'], col: '#e2621f' },
    { id: 'dodge', x: 302, y: 196, r: 13, label: 'ROLL', actions: ['dodge', 'cancel'], col: '#cbc4c3' },
    { id: 'use', x: 305, y: 150, r: 13, label: 'USE', actions: ['interact', 'confirm'], col: '#d4b96a' },
    { id: 'heal', x: 346, y: 128, r: 11, label: 'HEAL', actions: ['heal'], col: '#fccf63', show: () => AV.game.scene === 'play' },
    { id: 'kindle', x: 372, y: 142, r: 10, label: 'FIRE', actions: ['kindle'], col: '#f59a36',
      show: () => AV.game.scene === 'play' && AV.state.get('cinder_unlocked') },
    { id: 'bag', x: 336, y: 30, r: 9, label: 'BAG', actions: ['inventory'], col: '#857c86', show: () => AV.game.scene === 'play' },
    { id: 'pause', x: 362, y: 30, r: 9, label: 'II', actions: ['pause', 'cancel'], col: '#857c86', show: () => AV.game.scene === 'play' || AV.ui.menu },
  ];
  const JOY_R = 26;

  const isTouchDevice = () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  function toInternal(canvas, t) {
    const r = canvas.getBoundingClientRect();
    return { x: (t.clientX - r.left) / r.width * W, y: (t.clientY - r.top) / r.height * H };
  }
  function buttonAt(p) {
    for (const b of BUTTONS) {
      if (b.show && !b.show()) continue;
      if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r * 1.5 + 4) return b;
    }
    return null;
  }

  function goFullscreenLandscape() {
    const el = document.documentElement;
    try {
      if (!document.fullscreenElement && el.requestFullscreen) {
        el.requestFullscreen({ navigationUI: 'hide' }).then(() => {
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
        }).catch(() => {});
      } else if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    } catch (e) { /* not supported (iOS): the PWA manifest / rotate screen covers it */ }
  }

  T.attach = function (canvas) {
    if (isTouchDevice()) T.enabled = true;
    const opts = { passive: false };
    const start = (e) => {
      e.preventDefault();
      T.enabled = true;
      goFullscreenLandscape();
      for (const t of e.changedTouches) {
        const p = toInternal(canvas, t);
        const b = buttonAt(p);
        if (b) { T.pressed.set(t.identifier, b); I.virtualDown(b.actions); b.flash = 0.15; continue; }
        if (p.x < W * 0.45 && !T.stick && AV.game.scene !== 'ending' && AV.game.scene !== 'credits') {
          T.stick = { id: t.identifier, ox: p.x, oy: p.y, x: p.x, y: p.y };
          continue;
        }
        // any other tap: advance text / wake the title screen
        I.virtualTap(['confirm', 'skip']);
      }
    };
    const move = (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (T.stick && t.identifier === T.stick.id) {
          const p = toInternal(canvas, t);
          let dx = p.x - T.stick.ox, dy = p.y - T.stick.oy;
          const d = Math.hypot(dx, dy);
          if (d > JOY_R) { T.stick.ox += dx * (1 - JOY_R / d); T.stick.oy += dy * (1 - JOY_R / d); dx = p.x - T.stick.ox; dy = p.y - T.stick.oy; }
          T.stick.x = p.x; T.stick.y = p.y;
          const m = Math.min(1, Math.hypot(dx, dy) / JOY_R);
          const k = m < 0.18 ? 0 : m;
          const a = Math.atan2(dy, dx);
          I.setStick(Math.cos(a) * k, Math.sin(a) * k);
        }
      }
    };
    const end = (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const b = T.pressed.get(t.identifier);
        if (b) { I.virtualUp(b.actions); T.pressed.delete(t.identifier); }
        if (T.stick && t.identifier === T.stick.id) { T.stick = null; I.setStick(0, 0); }
      }
    };
    canvas.addEventListener('touchstart', start, opts);
    canvas.addEventListener('touchmove', move, opts);
    canvas.addEventListener('touchend', end, opts);
    canvas.addEventListener('touchcancel', end, opts);
    document.body.addEventListener('touchmove', (e) => e.preventDefault(), opts);
  };

  T.update = function (dt) {
    T.portrait = T.enabled && window.innerHeight > window.innerWidth;
    for (const b of BUTTONS) if (b.flash > 0) b.flash -= dt;
  };

  function circle(ctx, x, y, r, fill, stroke, alpha) {
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }

  T.draw = function (ctx) {
    if (!T.enabled) return;
    if (T.portrait) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H);
      const t = AV.game.time;
      ctx.save(); ctx.translate(W / 2, H / 2 - 18); ctx.rotate(Math.sin(t * 2) > 0 ? -Math.PI / 2 : 0);
      ctx.strokeStyle = '#d4b96a'; ctx.lineWidth = 2; ctx.strokeRect(-12, -20, 24, 40); ctx.restore();
      AV.font.draw(ctx, 'Turn your phone sideways', W / 2, H / 2 + 20, '#ebe5dc', { align: 'center' });
      AV.font.draw(ctx, 'The ash waits.', W / 2, H / 2 + 34, '#857c86', { align: 'center' });
      return;
    }
    const scene = AV.game.scene;
    if (scene === 'ending' || scene === 'credits') return;
    const dim = AV.dlg.active || AV.ui.menu ? 0.5 : 1;
    // joystick
    if (T.stick) {
      circle(ctx, T.stick.ox, T.stick.oy, JOY_R, 'rgba(7,6,10,0.35)', '#a88a48', 0.8);
      circle(ctx, T.stick.x, T.stick.y, 9, '#cbc4c3', '#07060a', 0.6);
    } else if (scene === 'play') {
      circle(ctx, 46, 168, JOY_R, 'rgba(7,6,10,0.25)', '#4a3a1c', 0.45 * dim);
      circle(ctx, 46, 168, 8, 'rgba(203,196,195,0.25)', null, 0.5 * dim);
    }
    // buttons
    for (const b of BUTTONS) {
      if (b.show && !b.show()) continue;
      const held = [...T.pressed.values()].includes(b) || b.flash > 0;
      let ready = true;
      if (b.id === 'kindle') ready = AV.state.d.cinder >= 100 || (AV.game.player && AV.game.player.kindled);
      if (b.id === 'heal') ready = AV.state.d.tallow > 0;
      circle(ctx, b.x, b.y, b.r, held ? 'rgba(245,154,54,0.35)' : 'rgba(7,6,10,0.45)', b.col, (ready ? 0.85 : 0.35) * dim);
      ctx.globalAlpha = (ready ? 1 : 0.4) * dim;
      AV.font.draw(ctx, b.label, b.x, b.y - 4, held ? '#fff3c2' : b.col, { align: 'center', shadow: '#07060a' });
    }
    ctx.globalAlpha = 1;
  };
})(window.AV);
