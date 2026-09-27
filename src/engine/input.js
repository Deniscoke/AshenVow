// ASHEN VOW — keyboard + gamepad input with action mapping, buffering and device-aware prompt labels
(function (AV) {
  'use strict';

  const KEYMAP = {
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    attack: ['KeyJ', 'KeyZ', 'Mouse0'],
    dodge: ['Space', 'KeyK', 'KeyX', 'ShiftLeft', 'ShiftRight'],
    heal: ['KeyR'],
    kindle: ['KeyQ'],
    interact: ['KeyE', 'Enter', 'NumpadEnter'],
    pause: ['Escape', 'KeyP'],
    inventory: ['Tab', 'KeyI'],
    confirm: ['Enter', 'NumpadEnter', 'KeyE', 'Space', 'KeyJ', 'KeyZ'],
    cancel: ['Escape', 'Backspace', 'KeyX', 'KeyK'],
    skip: ['Space', 'Enter', 'KeyE', 'KeyJ', 'KeyZ', 'Escape'],
  };
  // Standard gamepad mapping
  const PADMAP = {
    up: [12], down: [13], left: [14], right: [15],
    attack: [2, 7], dodge: [1], heal: [3], kindle: [5, 4], interact: [0],
    pause: [9], inventory: [8], confirm: [0], cancel: [1], skip: [0, 1, 9],
  };
  const LABELS_KB = {
    attack: 'J', dodge: 'SPACE', heal: 'R', kindle: 'Q', interact: 'E', pause: 'ESC', inventory: 'TAB',
    confirm: 'ENTER', cancel: 'ESC', up: 'W', down: 'S', left: 'A', right: 'D',
  };
  const LABELS_PAD = {
    attack: 'X', dodge: 'B', heal: 'Y', kindle: 'RB', interact: 'A', pause: 'START', inventory: 'SELECT',
    confirm: 'A', cancel: 'B', up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
  };

  const held = new Set();       // currently held keyboard codes
  const tapped = new Set();     // codes pressed since the last update (so quick taps are never lost)
  let padPrev = [];
  let padNow = [];
  let stick = { x: 0, y: 0 };
  const state = {};             // action -> {down, pressed, released}
  const prevDown = {};
  let lastDevice = 'kb';
  let gestureHandled = false;

  const input = AV.input = {
    enabled: true,
    get device() { return lastDevice; },
  };

  function onGesture() {
    if (!gestureHandled) { gestureHandled = true; }
    if (AV.audio && AV.audio.init) AV.audio.init();
  }

  input.attach = function (canvas) {
    window.addEventListener('keydown', (e) => {
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      held.add(e.code); tapped.add(e.code); lastDevice = 'kb';
      onGesture();
      if (e.code === 'F11') { /* browser handles fullscreen */ }
    });
    window.addEventListener('keyup', (e) => { held.delete(e.code); });
    window.addEventListener('blur', () => { held.clear(); });
    const target = canvas || window;
    target.addEventListener('mousedown', (e) => {
      if (e.button === 0) { held.add('Mouse0'); tapped.add('Mouse0'); }
      lastDevice = 'kb'; onGesture();
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) held.delete('Mouse0'); });
    window.addEventListener('touchstart', onGesture, { passive: true });
    target.addEventListener('contextmenu', (e) => e.preventDefault());
  };

  function pollPad() {
    padPrev = padNow;
    padNow = [];
    stick = { x: 0, y: 0 };
    const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
    for (const p of pads) {
      if (!p || !p.connected) continue;
      p.buttons.forEach((b, i) => { if (b.pressed || b.value > 0.5) padNow[i] = true; });
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      const mag = Math.hypot(ax, ay);
      if (mag > 0.25) {
        const k = Math.min(1, (mag - 0.25) / 0.65) / mag;
        stick = { x: ax * k, y: ay * k };
      }
      if (padNow.some(Boolean) || mag > 0.4) { if (lastDevice !== 'pad') lastDevice = 'pad'; onGesture(); }
      break; // first connected pad only
    }
  }

  input.update = function () {
    pollPad();
    for (const action in KEYMAP) {
      let down = false, tap = false;
      for (const code of KEYMAP[action]) { if (held.has(code)) down = true; if (tapped.has(code)) tap = true; }
      for (const b of PADMAP[action] || []) { if (padNow[b]) down = true; if (padNow[b] && !padPrev[b]) tap = true; }
      if (virt.held.has(action)) down = true;
      if (virt.tapped.has(action)) tap = true;
      const was = !!prevDown[action];
      state[action] = { down: down || tap, pressed: tap || (down && !was), released: !down && was };
      prevDown[action] = down;
    }
    tapped.clear();
    virt.tapped.clear();
  };

  input.down = (a) => input.enabled && !!(state[a] && state[a].down);
  input.pressed = (a) => input.enabled && !!(state[a] && state[a].pressed);
  input.released = (a) => !!(state[a] && state[a].released);
  input.consume = (a) => { if (state[a]) { state[a].pressed = false; } };
  input.consumeAll = () => { for (const a in state) state[a].pressed = false; };
  input.anyPressed = () => Object.keys(state).some((a) => state[a].pressed);

  // Movement vector (normalised; analog stick keeps magnitude)
  input.axis = function () {
    if (!input.enabled) return { x: 0, y: 0 };
    let x = 0, y = 0;
    const kd = (a) => KEYMAP[a].some((c) => held.has(c)) || (PADMAP[a] || []).some((b) => padNow[b]);
    if (kd('left')) x -= 1;
    if (kd('right')) x += 1;
    if (kd('up')) y -= 1;
    if (kd('down')) y += 1;
    if (x || y) { const m = Math.hypot(x, y); return { x: x / m, y: y / m }; }
    if (virt.stick.x || virt.stick.y) return { x: virt.stick.x, y: virt.stick.y };
    return { x: stick.x, y: stick.y };
  };

  // Menu navigation with key-repeat
  const rep = { t: 0, dir: null };
  input.menuDir = function (dt) {
    const ax = input.axis();
    let dir = null;
    if (ax.y < -0.5) dir = 'up'; else if (ax.y > 0.5) dir = 'down';
    else if (ax.x < -0.5) dir = 'left'; else if (ax.x > 0.5) dir = 'right';
    if (!dir) { rep.dir = null; return null; }
    if (dir !== rep.dir) { rep.dir = dir; rep.t = 0.32; return dir; }
    rep.t -= dt;
    if (rep.t <= 0) { rep.t = 0.09; return dir; }
    return null;
  };

  // Virtual controls (touch screen): press/release actions and a stick vector
  const virt = input.virt = { held: new Set(), tapped: new Set(), stick: { x: 0, y: 0 } };
  input.virtualDown = (actions) => { for (const a of actions) { if (!virt.held.has(a)) virt.tapped.add(a); virt.held.add(a); } lastDevice = 'touch'; onGesture(); };
  input.virtualUp = (actions) => { for (const a of actions) virt.held.delete(a); };
  input.virtualTap = (actions) => { for (const a of actions) virt.tapped.add(a); lastDevice = 'touch'; onGesture(); };
  input.setStick = (x, y) => { virt.stick.x = x; virt.stick.y = y; if (x || y) lastDevice = 'touch'; };
  const LABELS_TOUCH = { attack: 'ATK', dodge: 'ROLL', heal: 'HEAL', kindle: 'FIRE', interact: 'USE', confirm: 'USE', cancel: 'ROLL', pause: 'II', inventory: 'BAG' };
  input.label = (a) => (lastDevice === 'pad' ? LABELS_PAD[a] : lastDevice === 'touch' ? LABELS_TOUCH[a] || LABELS_KB[a] : LABELS_KB[a]) || a.toUpperCase();
})(window.AV);
