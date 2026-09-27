// ASHEN VOW — FINAL BOSS: WHAT THE ASH REMEMBERS (pyre). Art + behaviour.
// Phase 1 the KINDLER (the Pyre wearing Brand: wick-helm, tabard, torch-sword, his combos, his roll, his lunge).
// Phase 2 it falls apart and rises as the THOUSAND (hands, faces, ash rain, grasp, wail). It does not die: it kneels.
(function (AV) {
  'use strict';
  const U = AV.util;

  // ================================================================ shared helpers
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const R = Math.round;
  function hashf(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 2246822519) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  const asFn = (fn) => (typeof fn === 'function' ? fn : () => fn);
  // filled capsule from (x0,y0,r0) to (x1,y1,r1); fn(x, y, nx, ny, t, d) or a colour char
  function capsule(g, x0, y0, x1, y1, r0, r1, fn) {
    const f = asFn(fn);
    const minX = Math.floor(Math.min(x0 - r0, x1 - r1)) - 1, maxX = Math.ceil(Math.max(x0 + r0, x1 + r1)) + 1;
    const minY = Math.floor(Math.min(y0 - r0, y1 - r1)) - 1, maxY = Math.ceil(Math.max(y0 + r0, y1 + r1)) + 1;
    const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5, py = y + 0.5;
      const t = clamp(((px - x0) * dx + (py - y0) * dy) / L2, 0, 1);
      const ex = px - (x0 + dx * t), ey = py - (y0 + dy * t), d = Math.hypot(ex, ey);
      const r = r0 + (r1 - r0) * t;
      if (d > r) continue;
      const c = f(x, y, d > 0.01 ? ex / r : 0, d > 0.01 ? ey / r : 0, t, d / r);
      if (c !== undefined) g.px(x, y, c);
    }
  }
  // filled ellipse; fn(x, y, nx, ny, d) or a colour char
  function disc(g, cx, cy, rx, ry, fn) {
    const f = asFn(fn);
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++) for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = Math.hypot(nx, ny);
      if (d > 1) continue;
      const c = f(x, y, nx, ny, d);
      if (c !== undefined) g.px(x, y, c);
    }
  }
  // tapered vertical slab (torsos, tabards): centre/half-width interpolate from top to bottom
  function taper(g, x0, y0, hw0, x1, y1, hw1, fn) {
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const t = clamp((y - y0) / Math.max(1, y1 - y0), 0, 1);
      const cx = x0 + (x1 - x0) * t, hw = hw0 + (hw1 - hw0) * t;
      for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
        const nx = (x + 0.5 - cx) / hw;
        if (Math.abs(nx) > 1) continue;
        const c = fn(x, y, nx, t);
        if (c) g.px(x, y, c);
      }
    }
  }
  const FIRE_RAMP = ['q', 'p', 'o', 'n', 'm', 'l', 'k'];
  const FIRE_HEX = ['#f59a36', '#e2621f', '#fccf63', '#b8361a'];
  const ASH_HEX = ['#a8a0a6', '#857c86', '#cbc4c3', '#655c69'];
  const GHOST = '#b9d6d3';
  const ASHY = new Set(['2', '3', '4', '5', '6']);
  // a low bed of flame along the ground at (x, y)
  function groundFire(g, x, y, hw, h, seed) {
    for (let dx = -hw; dx <= hw; dx++) {
      const k = 1 - Math.abs(dx) / (hw + 1);
      const hh = Math.floor(h * k * (0.45 + hashf(dx, seed, 61) * 0.8));
      g.px(x + dx, y, 'l');
      for (let j = 1; j <= hh; j++) g.px(x + dx, y - j, j === hh ? (hashf(dx, j + seed, 62) < 0.4 ? 'p' : 'o') : j === 1 ? 'm' : 'n');
    }
  }

  // ================================================================ THE KINDLER — sheet boss_kindler (54×56, feet at 22,54)
  const KW = 54, KH = 56, KOX = 22, KOY = 54;

  // hands: [dx from the anchor, height above the ground]; ta: torch angle (0 = pointing right); tl: torch length
  function kPose(o) {
    return Object.assign({ bob: 0, crouch: 0, lean: 0, hunch: 0, bow: 0, fl: 3, bl: -3, fly: 0, bly: 0,
      hands: [6, 15], ta: 0.6, tl: 18, f: 0, flare: 0, back: false, kneel: false }, o);
  }
  const kShade = (x, y, nx, ny) => (nx < -0.35 ? '2' : ny < -0.45 || nx > 0.45 ? '4' : '3');
  const kFar = (x, y, nx) => (nx < 0 ? '1' : '2');

  function kLeg(g, hx, hy, fx, fy, far, knee) {
    const sh = far ? kFar : kShade;
    const kx = knee ? knee[0] : (hx + fx) / 2 + 1.5, ky = knee ? knee[1] : (hy + fy) / 2 - 0.5;
    capsule(g, hx, hy, kx, ky, 2.7, 2.2, sh);
    capsule(g, kx, ky, fx, fy - 1.5, 2.2, 1.7, sh);
    g.px(R(kx) + 1, R(ky), far ? '3' : '5');
    const X = R(fx), Y = R(fy);
    g.rect(X - 2, Y - 2, 5, 2, far ? '2' : '3');
    g.px(X + 3, Y - 1, far ? '2' : '3');
  }
  function kArm(g, sx, sy, hx, hy, far) {
    const ex = (sx + hx) / 2 - (far ? 1 : 0), ey = (sy + hy) / 2 + 2;
    const sh = far ? kFar : kShade;
    capsule(g, sx, sy, ex, ey, 2.2, 1.9, sh);
    capsule(g, ex, ey, hx, hy, 1.9, 1.7, sh);
  }
  function kHelm(g, cx, top) {
    for (let y = 0; y < 10; y++) for (let x = -4; x <= 4; x++) {
      if (y === 0 && Math.abs(x) >= 3) continue;
      if (y === 1 && Math.abs(x) === 4) continue;
      let c = x <= -2 ? '2' : x >= 2 ? '4' : '3';
      if (y <= 1 && x > -3) c = '5';
      if (y === 8) c = x >= 1 ? '3' : '2';
      g.px(cx + x, top + y, c);
    }
    g.rect(cx - 3, top + 10, 7, 1, '2');
    g.line(cx, top - 1, cx - 1, top - 6, '1'); // the wick
  }
  function kTorch(g, x, y, a, len) {
    const c = Math.cos(a), s = Math.sin(a), px = -s, py = c;
    g.line(R(x - c * 4), R(y - s * 4), R(x), R(y), 'b');
    g.px(R(x - c * 5), R(y - s * 5), 'K');
    g.line(R(x + c * 2 + px * 3), R(y + s * 2 + py * 3), R(x + c * 2 - px * 3), R(y + s * 2 - py * 3), '5');
    capsule(g, x + c * 3, y + s * 3, x + c * len, y + s * len, 1.4, 0.9, (xx, yy, nx, ny) => (ny < -0.35 ? '4' : ny > 0.35 ? '1' : '2'));
  }
  function kTorchFire(g, x, y, a, len, f, flare) {
    const c = Math.cos(a), s = Math.sin(a);
    for (let k = 5; k <= len - 2; k++) {
      const X = R(x + c * k), Y = R(y + s * k), cur = g.get(X, Y);
      if (cur === '2' || cur === '1') g.px(X, Y, (k + f) % 4 === 0 ? 'n' : 'l');
    }
    for (let k = 6; k <= len - 1; k += 3) {
      const X = R(x + c * k), Y = R(y + s * k) - 1;
      const h = 1 + Math.floor(hashf(k, f, 3) * (2 + flare));
      for (let j = 0; j < h; j++) g.px(X - (j >= 2 ? 1 : 0), Y - j, j === 0 ? 'n' : j === h - 1 ? 'p' : 'o');
    }
    const tx = R(x + c * (len + 1)), ty = R(y + s * (len + 1));
    const th = 4 + flare * 2 + Math.floor(hashf(f, 5, 9) * 2);
    const sway = hashf(f, 2, 7) < 0.5 ? -1 : 0;
    for (let j = 0; j < th; j++) {
      const w = j < th * 0.55 ? (flare >= 2 && j < 3 ? 2 : 1) : 0;
      const core = j < 1 ? 'o' : j < th - 2 ? (j < 3 ? 'q' : 'p') : 'o';
      const ox = j >= th - 2 ? sway : 0;
      for (let dx = -w; dx <= w; dx++) g.px(tx + dx + ox, ty - j, dx === 0 ? core : Math.abs(dx) === 2 ? 'm' : 'n');
    }
  }
  // an ember seam burned into the armour (only over armour pixels)
  function emberLine(g, x0, y0, x1, y1) {
    const n = Math.max(1, Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
    for (let i = 0; i <= n; i++) {
      const X = R(x0 + (x1 - x0) * i / n), Y = R(y0 + (y1 - y0) * i / n);
      const c = g.get(X, Y);
      if (c === '2' || c === '3' || c === '4' || c === '5') g.px(X, Y, i === (n >> 1) ? 'n' : 'l');
    }
  }

  function drawKindler(g, p) {
    const gy = KOY;
    const hipY = gy - 15 + p.crouch * 3 + p.bob;
    const hcx = KOX + p.lean * 0.4;
    const scx = KOX + p.lean + p.bow * 0.5, shY = hipY - 12 + p.hunch;
    const hx = KOX + p.hands[0], hy = gy - p.hands[1];
    // back leg, (wound-back torch), back arm
    if (p.kneel) kLeg(g, hcx - 2, hipY, KOX - 8, gy, true, [KOX - 3, gy - 1]);
    else kLeg(g, hcx - 2, hipY, KOX + p.bl, gy - p.bly, true);
    if (p.back) kTorch(g, hx, hy, p.ta, p.tl);
    kArm(g, scx - 4, shY + 2, hx - 1, hy, true);
    // torso & belt
    taper(g, scx, shY - 1, 6.5, hcx, hipY + 1, 5, (x, y, nx, t) => (t < 0.12 ? '4' : nx < -0.4 ? '2' : nx > 0.45 ? '4' : '3'));
    for (let x = R(hcx) - 5; x <= R(hcx) + 5; x++) g.px(x, R(hipY) - 1, x === R(hcx) + 1 ? 'K' : '2');
    disc(g, scx - 5, shY + 1, 3, 2.5, (x, y, nx, ny) => (ny < -0.3 ? '3' : '2'));
    // front leg
    if (p.kneel) kLeg(g, hcx + 2, hipY, KOX + 7, gy, false, [KOX + 7, hipY + 1]);
    else kLeg(g, hcx + 2, hipY, KOX + p.fl, gy - p.fly, false);
    // the torn grey tabard, hem burning
    taper(g, scx + 1, shY + 3, 3.6, hcx + 1, hipY + 7, 4.4, (x, y, nx) => (nx < -0.35 ? '4' : '5'));
    const hemY = R(hipY + 7);
    for (let x = R(hcx) - 3; x <= R(hcx) + 5; x++) {
      const k = Math.floor(hashf(x - R(hcx), 3, 17) * 3);
      for (let j = 1; j <= k; j++) g.px(x, hemY + j, '4');
    }
    // helm, front pauldron, front arm, torch, gauntlets
    const hcX = R(scx + 1 + p.bow), top = R(shY - 11 + p.bow * 1.5);
    kHelm(g, hcX, top);
    disc(g, scx + 5, shY + 1, 3.2, 2.6, (x, y, nx, ny) => (ny < -0.35 ? '5' : nx > 0.3 ? '4' : '3'));
    kArm(g, scx + 5, shY + 2, hx, hy + 1, false);
    if (!p.back) kTorch(g, hx, hy, p.ta, p.tl);
    disc(g, hx, hy, 1.9, 1.9, (x, y, nx, ny) => (ny < -0.3 ? '4' : '2'));
    g.outline('0');

    // ---- the fire it is made of
    for (let x = R(hcx) - 3; x <= R(hcx) + 5; x++) {
      const k = Math.floor(hashf(x - R(hcx), 3, 17) * 3);
      g.px(x, hemY + k, hashf(x, p.f, 18) < 0.35 ? 'n' : 'l');
    }
    emberLine(g, scx - 3, shY + 3, scx - 1, shY + 7);
    emberLine(g, hcx - 3, hipY - 5, hcx - 1, hipY - 2);
    emberLine(g, scx + 4, shY + 5, scx + 6, shY + 8);
    emberLine(g, KOX + (p.kneel ? 6 : p.fl) + 1, gy - 8, KOX + (p.kneel ? 6 : p.fl), gy - 5);
    // the cracked pauldron, light inside
    g.px(R(scx + 5), R(shY), 'n'); g.px(R(scx + 5), R(shY + 1), 'o'); g.px(R(scx + 6), R(shY + 1), 'l');
    // the Open Hand, glowing on the tabard
    const ex = R(scx + 1), ey = R(shY + 5);
    [[-2, 0], [0, -1], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]].forEach(([dx, dy]) => g.px(ex + dx, ey + dy, dx === 0 && dy === 1 ? 'o' : 'n'));
    // visor slit & the lit wick
    for (let y = 3; y <= 7; y++) g.px(hcX + 2, top + y, y === 4 || y === 5 ? 'q' : 'p');
    g.px(hcX + 3, top + 4, 'n'); g.px(hcX + 3, top + 5, 'o');
    g.px(hcX - 1, top - 7, 'o'); g.px(hcX - 1 + (p.f % 3 === 0 ? -1 : 0), top - 8, 'p');
    if (p.flare) g.px(hcX - 1, top - 9, 'o');
    // flames licking off the back and shoulders
    [[scx - 7, shY], [hcX - 4, top + 3], [hcx - 6, hipY - 3], [scx + 7, shY + 1]].forEach(([x, y], i) => {
      const h = 2 + Math.floor(hashf(i, p.f, 21) * 3) + p.flare;
      for (let j = 0; j < h; j++) g.px(R(x) - (i === 3 ? 0 : Math.floor(j / 2)), R(y) - j, j === 0 ? 'm' : j < h - 1 ? 'n' : 'o');
    });
    // sparks
    for (let i = 0; i < 3; i++) {
      const sx = R(scx - 8 + hashf(i, p.f, 31) * 14), sy = R(top - 2 - hashf(i, p.f, 32) * 8);
      if (!g.get(sx, sy)) g.px(sx, sy, hashf(i, p.f, 33) < 0.5 ? 'o' : 'n');
    }
    kTorchFire(g, hx, hy, p.ta, p.tl, p.f, p.flare);
  }

  const KP = {
    idle: (i) => kPose({ bob: [0, 0, 1, 1][i], f: i, hands: [6, 15 - [0, 0, 1, 1][i]] }),
    walk: (i) => kPose({ bob: [0, 1, 0, 1][i], fl: [6, 2, -3, 1][i], bl: [-4, 0, 5, 2][i], fly: [0, 1, 0, 0][i], bly: [0, 0, 0, 1][i],
      f: i + 4, hands: [6, 15 - [0, 1, 0, 1][i]] }),
    windup: (i) => kPose({ lean: -1, hands: [-1, 26 + i], ta: -2.3 - i * 0.3, fl: 5, bl: -4, f: i + 8, flare: i, back: true }),
    attack: (i) => [kPose({ lean: 1, hands: [4, 24], ta: -0.7, fl: 6, bl: -4, f: 10 }),
      kPose({ lean: 3, crouch: 0.6, hands: [8, 18], ta: 0.3, fl: 8, bl: -5, f: 11 }),
      kPose({ lean: 2, crouch: 0.4, hands: [7, 14], ta: 0.95, tl: 16, fl: 7, bl: -4, f: 12 })][i],
    sweep_wind: (i) => kPose({ lean: -2, crouch: 1, hands: [-3, 14], ta: 2.75, fl: 5, bl: -5, f: 13 + i, flare: i, back: true }),
    sweep: (i) => kPose({ lean: 3, crouch: 0.7, hands: [9, 17 + i * 2], ta: -0.05 - i * 0.3, fl: 8, bl: -6, f: 15 + i }),
    stab_wind: (i) => kPose({ lean: -2, crouch: 1, hands: [-4, 16], ta: 0.05, fl: 6, bl: -6, f: 17 + i, flare: i }),
    stab: (i) => kPose({ lean: 4, crouch: 1, hands: [11, 17], ta: 0.02, tl: 17, fl: 10, bl: -8, f: 19 + i }),
    raise: (i) => kPose({ hands: [5, 30 - i], ta: -1.25, tl: 16, f: 21 + i, flare: 2, bob: i }),
    spent: (i) => kPose({ hunch: 1, bob: 1 + i, hands: [5, 13], ta: 1.15, tl: 14, f: 23 + i, fl: 4, bl: -4 }),
    hurt: () => kPose({ lean: -2, bob: 1, hands: [3, 16], ta: 1.1, tl: 16, f: 25 }),
    kneel: () => kPose({ kneel: true, crouch: 2.5, bow: 1, hunch: 1, hands: [5, 12], ta: 1.45, tl: 12, f: 26 }),
  };

  function kRoll(g, i) {
    const cx = KOX, cy = KOY - 9, rot = i * Math.PI / 2;
    disc(g, cx, cy, 8.5, 8, (x, y, nx, ny) => (ny < -0.4 ? '4' : nx < -0.4 ? '2' : '3'));
    for (let t = -7; t <= 7; t++) g.px(R(cx + Math.cos(rot) * t), R(cy + Math.sin(rot) * t * 0.9), '5');
    const ha = -Math.PI / 2 + rot, hx = cx + Math.cos(ha) * 6, hy = cy + Math.sin(ha) * 6;
    disc(g, hx, hy, 3.5, 3.5, (x, y, nx, ny) => (ny < -0.3 ? '4' : '3'));
    g.line(R(hx + Math.cos(ha) * 3), R(hy + Math.sin(ha) * 3), R(hx + Math.cos(ha) * 7), R(hy + Math.sin(ha) * 7), '1');
    const ta = rot + Math.PI / 4;
    g.line(R(cx - Math.cos(ta) * 9), R(cy - Math.sin(ta) * 9), R(cx + Math.cos(ta) * 9), R(cy + Math.sin(ta) * 9), '2');
    g.outline('0');
    g.px(R(hx + Math.cos(ha + 0.9) * 2), R(hy + Math.sin(ha + 0.9) * 2), 'p');
    const tip = [R(cx + Math.cos(ta) * 10), R(cy + Math.sin(ta) * 10)];
    g.px(tip[0], tip[1], 'p'); g.px(tip[0], tip[1] - 1, 'o');
    for (let k = 0; k < 9; k++) {
      const y = R(cy - 7 + k * 1.8), len = 1 + Math.floor(hashf(k, i, 71) * 4);
      for (let j = 0; j < len; j++) g.px(cx - 9 - j, y, j === len - 1 ? 'o' : j === 0 ? 'm' : 'n');
    }
    g.line(cx - 6, cy - 7, cx - 3, cy + 5, 'l');
  }
  function kRise(g, i) {
    if (i === 0) { groundFire(g, KOX, KOY, 7, 5, 0); return; }
    drawKindler(g, KP.idle(i % 4));
    if (i >= 5) return;
    const cut = [0, KOY + 1, KOY - 14, KOY - 27, KOY - 38][i];
    g.each((x, y, c) => {
      if (!c || y >= cut) return undefined;
      const up = cut - y, n = hashf(x, y, 30 + i);
      if (c === '0') return up < 3 ? 'l' : 'm';
      return n < 0.12 ? 'q' : up < 4 ? 'n' : n < 0.55 ? 'o' : 'p';
    });
    groundFire(g, KOX, KOY, 6 + i, 3 + i, i);
  }
  function kCollapse(g, i) {
    const k = i / 5;
    if (i < 5) {
      drawKindler(g, KP.kneel());
      if (i > 0) g.each((x, y, c) => {
        if (!c) return undefined;
        const h = 1 - (y - 8) / (KOY - 8);
        if (hashf(x, y, 40) < k * 1.25 * (0.35 + h)) return null;
        if (hashf(x, y, 41) < k * 0.9) return c === '0' ? '3' : c === '1' || c === '2' ? '5' : '6';
        return undefined;
      });
    }
    if (i >= 3) {
      g.line(KOX - 13, KOY, KOX + 13, KOY - 1, '2');
      g.px(KOX + 14, KOY - 1, i >= 5 ? 'l' : 'n');
    }
    if (i > 0) {
      const hw = 3 + k * 10, hh = 1 + k * 4;
      disc(g, KOX - 1, KOY - hh * 0.5, hw, hh, (x, y, nx, ny) => (ny < -0.35 ? '7' : ny < 0.3 ? '6' : '5'));
      for (let j = 0; j < 3 + i; j++) g.px(R(KOX - hw + 2 + hashf(j, i, 43) * (hw * 2 - 4)), R(KOY - hashf(j, i, 44) * hh), hashf(j, i, 45) < 0.4 ? 'n' : 'l');
    }
  }

  const kAnim = (fps, n, fn, loop) => ({ fps, count: n, loop: loop !== false, draw(g, i) { drawKindler(g, fn(i)); } });
  AV.art.sheet('boss_kindler', {
    w: KW, h: KH, ox: KOX, oy: KOY,
    anims: {
      idle: kAnim(4, 4, KP.idle),
      walk: kAnim(8, 4, KP.walk),
      windup: kAnim(5, 2, KP.windup, false),
      attack: kAnim(10, 3, KP.attack, false),
      sweep_wind: kAnim(4, 2, KP.sweep_wind, false),
      sweep: kAnim(8, 2, KP.sweep, false),
      stab_wind: kAnim(4, 2, KP.stab_wind, false),
      stab: kAnim(8, 2, KP.stab),
      raise: kAnim(6, 2, KP.raise),
      spent: kAnim(3, 2, KP.spent),
      hurt: kAnim(1, 1, KP.hurt),
      roll: { fps: 12, count: 4, draw: kRoll },
      rise: { fps: 2.8, count: 6, loop: false, draw: kRise },
      collapse: { fps: 4.5, count: 6, loop: false, draw: kCollapse },
      heap: { fps: 1, count: 1, draw(g) { kCollapse(g, 5); } },
    },
  });

  // ================================================================ THE THOUSAND — sheet boss_thousand (112×104, feet at 56,100)
  const TW = 112, TH = 104, TOX = 56, TOY = 100;
  function tPose(o) {
    return Object.assign({ sh: 44, hd: 0, tilt: 0, mouth: 0, glow: 0, ghost: false, fire: 1, f: 0, closed: false, calm: false,
      L: [16, 94], Rh: [96, 94], open: false, buried: false, eb: 9, up: false }, o);
  }
  const ashRamp = (v) => (v > 0.5 ? '6' : v > 0.2 ? '5' : v > -0.15 ? '4' : v > -0.5 ? '3' : '2');

  function face(g, x, y, s, p, i) {
    const rx = [2.6, 3.6, 7.5][s], ry = [3.2, 4.4, 9.5][s];
    const hi = s === 2 ? ['9', '8', '7', '6'] : ['8', '7', '6', '5'];
    disc(g, x, y, rx, ry, (xx, yy, nx, ny, d) => {
      const v = -ny * 0.55 - nx * 0.3 + (1 - d) * 0.35 - (s === 2 ? 0.12 : 0);
      return hi[v > (s === 2 ? 0.6 : 0.45) ? 0 : v > 0.1 ? 1 : v > -0.25 ? 2 : 3];
    });
    if (s === 2) {
      // the great face: long, hollow-cheeked, sockets that go all the way in
      const eyY0 = R(y - ry * 0.25);
      for (const sd of [-1, 1]) {
        const X = R(x + sd * 3);
        g.px(X, eyY0 + 3, '6'); g.px(X + sd, eyY0 + 3, '6'); g.px(X + sd * 2, eyY0 + 2, '7');
        if (!p.closed) { g.px(X, eyY0 - 1, '2'); g.px(X + sd, eyY0 - 1, '2'); }
      }
      g.px(R(x), eyY0 + 2, '7'); g.px(R(x), eyY0 + 1, '8');
    }
    const lit = s === 2 || p.glow || p.ghost || i % 3 === 0;
    const eyeC = p.ghost ? 'x' : p.glow >= 2 ? 'p' : p.glow >= 1 ? 'o' : p.fire < 0.5 ? 'k' : 'l';
    const ex = s === 2 ? 3 : s === 1 ? 1.5 : 1;
    const eyY = R(y - ry * 0.25);
    for (const sd of [-1, 1]) {
      const X = R(x + sd * ex);
      if (p.closed) { g.px(X, eyY + 1, '3'); if (s === 2) g.px(X + sd, eyY + 1, '3'); continue; }
      g.px(X, eyY, '1');
      if (s >= 1) g.px(X, eyY + 1, '1');
      if (s === 2) { g.px(X + sd, eyY, '1'); g.px(X + sd, eyY + 1, '1'); g.px(X, eyY + 2, '1'); g.px(X + sd, eyY + 2, '1'); }
      if (lit) g.px(X, eyY + (s === 2 ? 1 : 0), eyeC);
    }
    const m = s === 2 ? p.mouth : p.closed ? 0 : Math.min(2, p.mouth + ((i + p.f) % 4 === 0 ? 1 : 0));
    const my = R(y + ry * 0.45), X = R(x);
    const inner = p.ghost ? 'y' : p.glow >= 2 ? 'p' : p.glow >= 1 ? 'n' : 'k';
    if (m === 0) { g.px(X, my, '2'); if (s === 2) { g.px(X - 1, my, '2'); g.px(X + 1, my, '2'); g.px(X - 2, my + 1, '3'); g.px(X + 2, my + 1, '3'); } }
    else if (m === 1) {
      if (s === 2) { g.rect(X - 1, my - 1, 3, 3, '1'); g.px(X, my, inner); }
      else { g.px(X, my, '1'); g.px(X, my + 1, '1'); if (p.glow || p.ghost) g.px(X, my, inner); }
    } else if (s === 2) { g.rect(X - 2, my - 2, 5, 6, '1'); g.rect(X - 1, my - 1, 3, 4, inner); g.px(X, my, p.ghost ? 'y' : 'q'); }
    else { g.rect(X - 1, my - 1, 2, 3, '1'); g.px(X, my, inner); }
  }

  function bigHand(g, x, y, dir, open, side) {
    const sh = (xx, yy, nx, ny) => (ny < -0.3 ? '7' : ny > 0.45 ? '4' : '6');
    disc(g, x, y, 4.3, 4, sh);
    const spread = open ? 0.42 : 0.24, flen = open ? 7 : 5.5;
    for (let i = 0; i < 4; i++) {
      const a = dir + (i - 1.5) * spread;
      const ex = x + Math.cos(a) * (3 + flen), ey = y + Math.sin(a) * (3 + flen);
      capsule(g, x + Math.cos(a) * 3, y + Math.sin(a) * 3, ex, ey, 1.35, 0.9, sh);
      if (!open) { const ca = a - side * 1.3; capsule(g, ex, ey, ex + Math.cos(ca) * 2.5, ey + Math.sin(ca) * 2.5, 0.9, 0.8, sh); }
    }
    const ta = dir - side * 1.3;
    capsule(g, x + Math.cos(ta) * 3, y + Math.sin(ta) * 3, x + Math.cos(ta) * 7.5, y + Math.sin(ta) * 7.5, 1.3, 0.9, sh);
  }

  function armT(g, sx, sy, h, side, p) {
    const hx = h[0], hy = h[1];
    const ey2 = p.buried ? TOY + 2 : hy;
    const mx = (sx + hx) / 2 + side * p.eb, my = (sy + ey2) / 2 + (p.up ? -2 : 3);
    const shade = (x, y, nx, ny) => ashRamp(0.25 - ny * 0.6 - nx * 0.25 + (hashf(x, y, 9) - 0.5) * 0.3);
    capsule(g, sx, sy, mx, my, 7, 5.2, shade);
    capsule(g, mx, my, hx, ey2, 5.2, 3.8, shade);
    // fingers of the dead, poking out of the arm
    for (let k = 0; k < 3; k++) {
      const t = 0.3 + k * 0.3, ax = k < 2 ? lerp(sx, mx, t * 1.4) : lerp(mx, hx, 0.5), ay = k < 2 ? lerp(sy, my, t * 1.4) : lerp(my, ey2, 0.5);
      const X = R(ax + side * (k < 2 ? 6 : 4.5)), Y = R(ay - 1);
      g.px(X, Y, '5'); g.px(X + side, Y - 1, '6'); g.px(X + side * 2, Y - 1, '6');
    }
    if (p.buried) {
      for (let i = -7; i <= 7; i++) {
        const hh = Math.floor((1 - Math.abs(i) / 8) * 3 * hashf(i, side, 12)) + (Math.abs(i) < 4 ? 1 : 0);
        for (let j = 0; j < hh; j++) g.px(R(hx) + i, TOY - j, j === hh - 1 ? '7' : '5');
      }
    } else bigHand(g, hx, hy, Math.atan2(hy - my, hx - mx), p.open, side);
  }

  function drawThousand(g, p) {
    const cx = TOX, sh = p.sh;
    // the heap of the dead it stands in
    disc(g, cx, 95, 50, 7, (x, y, nx, ny) => ashRamp(-ny * 0.6 - Math.abs(nx) * 0.3 + (hashf(x, y, 1) - 0.5) * 0.3));
    for (let i = 0; i < 11; i++) {
      const x = 10 + i * 9 + (hashf(i, 0, 2) - 0.5) * 4, y = 90 + hashf(i, 1, 2) * 3;
      disc(g, x, y, 4 + hashf(i, 2, 2) * 2, 3, (xx, yy, nx, ny) => ashRamp(-ny * 0.7 - nx * 0.2 - 0.1));
    }
    // small hands reaching out of the heap
    [[7, 93, -2.5], [105, 92, -0.6], [24, 97, 2.2], [88, 98, 0.9]].forEach(([x, y, a]) => {
      capsule(g, x, y, x + Math.cos(a) * 4, y + Math.sin(a) * 4 - 2, 1.6, 1.2, '5');
      const hx = x + Math.cos(a) * 5, hy = y + Math.sin(a) * 5 - 3;
      for (let k = -1; k <= 1; k++) g.px(R(hx + Math.cos(a + k * 0.5) * 2), R(hy + Math.sin(a + k * 0.5) * 2) - 1, '6');
    });
    // torso: the dead, packed upright
    for (let y = sh; y <= 93; y++) {
      const t = (y - sh) / (93 - sh);
      const hw = 19 + t * 21 + Math.sin(y * 0.7) * 1.5 + Math.sin(y * 1.9 + 1);
      for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
        const nx = (x + 0.5 - cx) / hw;
        if (Math.abs(nx) > 1) continue;
        let v = 0.55 - t * 0.55 - nx * nx * 0.8 - nx * 0.12;
        if (hashf(x, y - sh, 3) < 0.09) v -= 0.3;
        g.px(x, y, ashRamp(v));
      }
    }
    for (const s of [-1, 1]) disc(g, cx + s * 23, sh + 6, 10, 7.5, (x, y, nx, ny) => ashRamp(0.35 - ny * 0.55 - nx * 0.15));
    // curled bodies in the mass
    const rnd = U.rng(911);
    for (let i = 0; i < 16; i++) {
      const rx0 = cx + (rnd() - 0.5) * 62, ry0 = sh + 8 + rnd() * 40, rr = 3 + rnd() * 4, a0 = rnd() * 6.28, span = 1.5 + rnd() * 2;
      for (let k = 0; k <= 12; k++) {
        const a = a0 + span * k / 12, x = R(rx0 + Math.cos(a) * rr), y = R(ry0 + Math.sin(a) * rr * 0.8);
        if (ASHY.has(g.get(x, y))) { g.px(x, y, '3'); if (ASHY.has(g.get(x, y - 1))) g.px(x, y - 1, '5'); }
      }
    }
    // the fire it is gathered around
    const fcx = cx + 1, fcy = sh + 24;
    disc(g, fcx, fcy, 10.5, 12.5, (x, y, nx, ny, d) => {
      const dd = d + 0.08 * Math.sin(Math.atan2(ny, nx) * 5 + p.f * 1.7);
      if (dd > 1) return undefined;
      if (dd > 0.86) return '1';
      return FIRE_RAMP[clamp(Math.floor(dd * 5.2 + (1 - p.fire) * 3.2 + (hashf(x, y, p.f + 40) - 0.5) * 0.8), 0, 6)];
    });
    for (const [oy, tl] of [[-6, 1], [0, -1], [6, 1]]) {
      for (let x = -11; x <= 11; x++) {
        const X = fcx + x, Y = R(fcy + oy + tl * x * 0.12), c = g.get(X, Y);
        if (!c) continue;
        g.px(X, Y, '2');
        const up = g.get(X, Y - 1);
        if (up && FIRE_RAMP.includes(up) && Math.abs(x) < 10) g.px(X, Y - 1, '4');
      }
    }
    // faces in the mass
    [[-17, 8, 1], [16, 10, 0], [-26, 24, 0], [25, 27, 1], [-19, 38, 1], [18, 40, 0], [-31, 44, 0], [30, 45, 0], [-5, 43, 0], [8, 46, 1],
      [-15, 22, 0], [16, 22, 0]].forEach(([dx, dy, s], i) => { if (sh + dy <= 91) face(g, cx + dx, sh + dy, s, p, i); });
    // tin tags, still hanging on their strings
    for (const [dx, dy] of [[-30, 14], [33, 18], [-8, 50]]) {
      const X = cx + dx, Y = sh + dy;
      if (Y < 88) { g.px(X, Y, '5'); g.px(X, Y + 1, '6'); g.rect(X - 1, Y + 2, 2, 2, '8'); }
    }
    // the head: a knot of faces with one great face at its heart, crowned with reaching hands
    const hx = cx + p.tilt, hy = sh - 12 + p.hd;
    for (const [dx, ln] of [[-11, 7], [-5, 10], [2, 8], [8, 11], [13, 6]]) {
      const bx = hx + dx, by = hy - 9, tx = hx + dx * 1.35, ty = by - ln;
      capsule(g, bx, by, tx, ty, 1.6, 1.1, (x, y, nx) => (nx < 0 ? '4' : '5'));
      g.px(R(tx) - 1, R(ty) - 1, '6'); g.px(R(tx), R(ty) - 2, '6'); g.px(R(tx) + 1, R(ty) - 1, '6'); g.px(R(tx) + (dx < 0 ? -2 : 2), R(ty), '5');
    }
    disc(g, hx, hy, 16, 14, (x, y, nx, ny) => ashRamp(0.35 - ny * 0.45 - nx * 0.2 + (hashf(x, y, 5) - 0.5) * 0.25));
    [[-11, -1], [11, -2], [-7, -9], [7, -9], [-13, 7], [13, 8]].forEach(([dx, dy], i) => face(g, hx + dx, hy + dy, 0, p, i + 20));
    face(g, hx, hy + 2, 2, p, 99);
    // arms
    armT(g, cx - 25, sh + 6, p.L, -1, p);
    armT(g, cx + 25, sh + 6, p.Rh, 1, p);
    g.outline('0');
    // coals in the cracks, sparks above
    const coal = p.calm ? 0.02 : 0.045;
    g.each((x, y, c) => {
      if ((c === '2' || c === '3') && hashf(x, y, 77) < coal) return hashf(x, y, 78 + p.f) < 0.3 ? 'n' : p.fire > 0.5 ? 'm' : 'l';
      return undefined;
    });
    if (!p.calm) for (let i = 0; i < 6; i++) {
      const X = R(cx - 30 + hashf(i, p.f, 50) * 60), Y = R(sh - 34 + hashf(i, p.f, 51) * 30);
      if (Y > 0 && !g.get(X, Y)) g.px(X, Y, hashf(i, p.f, 52) < 0.5 ? 'o' : 'n');
    }
  }

  const TP = {
    idle: (i) => tPose({ sh: 44 + [0, 1, 1, 0][i], tilt: [0, 0, 1, 1][i] - 0, f: i, L: [16, 94], Rh: [96, 94] }),
    slam_wind: (i) => tPose({ sh: 42 - i, hd: -2, mouth: 1, L: [12 - i * 2, 16 - i * 4], Rh: [100 + i * 2, 16 - i * 4], open: true, f: 5 + i, eb: 8 }),
    slam: (i) => tPose({ sh: 48 + i, hd: 1, mouth: 1, L: [19, 99], Rh: [93, 99], open: true, f: 7 + i, eb: 10 }),
    spray: (i) => tPose({ sh: 44 - (i ? 1 : 0), hd: -1, mouth: [1, 2, 2][i], glow: [1, 2, 2][i], f: 9 + i, L: [18, 93], Rh: [94, 93] }),
    rain: (i) => tPose({ sh: 42, hd: -3, tilt: 0, mouth: 1, L: [30 - i, 6 - i], Rh: [82 + i, 6 - i], open: true, up: true, eb: 7, f: 12 + i }),
    grasp: (i) => tPose({ sh: 47 + i * 2, hd: 1 + i, mouth: 1, L: [30, 100], Rh: [82, 100], buried: true, eb: 7, f: 14 + i }),
    wail: (i) => tPose({ sh: 42, hd: -4, mouth: 2, ghost: true, L: [5, 38 - i], Rh: [107, 38 - i], open: true, eb: 1, up: true, f: 16 + i }),
    hurt: () => tPose({ sh: 47, hd: 2, mouth: 1, L: [18, 95], Rh: [94, 95], f: 19 }),
    sink: (i) => { const k = i / 5; return tPose({ sh: R(44 + k * 14), hd: R(k * 7), L: [lerp(16, 38, k), lerp(94, 99, k)], Rh: [lerp(96, 74, k), lerp(94, 99, k)],
      fire: 1 - 0.65 * k, closed: k > 0.55, eb: lerp(9, 6, k), f: 20 + i, calm: k > 0.7 }); },
    kneel: (i) => tPose({ sh: 58 + i, hd: 7, L: [38, 99], Rh: [74, 99], fire: 0.35, closed: true, eb: 6, f: 30 + i, calm: true }),
  };
  function tRise(g, i) {
    drawThousand(g, TP.idle(i % 4));
    const dy = R((1 - (i + 1) / 8) * 92);
    if (dy > 0) {
      g.shift(0, dy);
      for (let y = TOY + 2; y < TH; y++) for (let x = 0; x < TW; x++) g.px(x, y, null);
    }
    for (let x = 4; x < TW - 4; x += 1) {
      if (hashf(x, i, 60) > 0.6) continue;
      const hh = 1 + Math.floor(hashf(x, i, 61) * (3 + (i < 6 ? 5 : 2)));
      for (let j = 0; j < hh; j++) g.px(x, TOY + 1 - j, j === 0 ? 'l' : j === hh - 1 ? (hashf(x, j, i) < 0.3 ? 'p' : 'o') : j < 2 ? 'm' : 'n');
    }
  }
  const tAnim = (fps, n, fn, loop) => ({ fps, count: n, loop: loop !== false, draw(g, i) { drawThousand(g, fn(i)); } });
  AV.art.sheet('boss_thousand', {
    w: TW, h: TH, ox: TOX, oy: TOY,
    anims: {
      idle: tAnim(3, 4, TP.idle),
      rise: { fps: 3.6, count: 8, loop: false, draw: tRise },
      slam_wind: tAnim(4, 2, TP.slam_wind, false),
      slam: tAnim(3, 2, TP.slam, false),
      spray: tAnim(4, 3, TP.spray, false),
      rain: tAnim(3, 2, TP.rain),
      grasp: tAnim(3, 2, TP.grasp),
      wail: tAnim(5, 3, TP.wail),
      hurt: tAnim(1, 1, TP.hurt),
      sink: tAnim(2.5, 6, TP.sink, false),
      kneel: tAnim(0.8, 2, TP.kneel),
    },
  });

  // a hand of the dead erupting from the ground (grasp / slam lines) — sheet boss_thousand_hand (20×30, feet at 10,27)
  function handUp(g, i) {
    const gx = 10, gy = 27;
    disc(g, gx, gy, 6, 2, (x, y, nx) => (Math.abs(nx) < 0.3 ? (i >= 5 ? 'k' : 'l') : '1'));
    if (i === 0) { g.px(gx - 3, gy - 1, '6'); g.px(gx + 2, gy - 2, '7'); g.px(gx + 4, gy - 1, '6'); return; }
    const reach = [0, 5, 12, 18, 17, 15, 9][i];
    const top = gy - reach;
    const sh = (x, y, nx) => (nx < -0.3 ? '5' : nx > 0.4 ? '7' : '6');
    if (reach > 6) capsule(g, gx, gy, gx + (i >= 4 ? 1 : 0), top + 5, 2.8, 2.3, sh);
    const open = i <= 3;
    if (i === 1) { for (const dx of [-3, -1, 1, 3]) g.line(gx + dx, gy - 1, gx + dx + (dx > 0 ? 1 : -1), top + (Math.abs(dx) === 3 ? 1 : 0), '6'); }
    else {
      disc(g, gx, top + 4, 3.2, 2.8, sh);
      for (let k = 0; k < 4; k++) {
        const a = -Math.PI / 2 + (k - 1.5) * (open ? 0.42 : 0.2);
        const len = open ? 5.5 : 3;
        capsule(g, gx + Math.cos(a) * 2, top + 4 + Math.sin(a) * 2, gx + Math.cos(a) * (2 + len), top + 4 + Math.sin(a) * (2 + len), 1, 0.8, sh);
        if (!open) g.px(R(gx + Math.cos(a) * (2 + len)) + 1, R(top + 4 + Math.sin(a) * (2 + len)) + 1, '5');
      }
      capsule(g, gx - 3, top + 5, gx - 5.5, top + 1, 1, 0.8, sh);
    }
    g.outline('0');
    if (i >= 5) g.each((x, y, c) => (c && y < gy - 1 && hashf(x, y, i) < (i === 6 ? 0.55 : 0.3) ? (hashf(x, y, 90) < 0.5 ? null : '7') : undefined));
    g.px(gx, gy, i >= 5 ? 'l' : 'n');
  }
  AV.art.sheet('boss_thousand_hand', {
    w: 20, h: 30, ox: 10, oy: 27,
    anims: {
      idle: { fps: 1, count: 1, draw(g) { handUp(g, 3); } },
      erupt: { fps: 10, count: 7, loop: false, draw: handUp },
    },
  });

  // ================================================================ hazards the fight leaves in the arena
  // A line of fire left by a torch sweep: burns ~2 s, hurts (1, as a hazard) in pulses.
  class FireLine extends AV.Entity {
    constructor(world, owner, pts, life) {
      super(null, world);
      this.owner = owner; this.pts = pts; this.life = life || 2; this.t = 0; this.pulse = 0;
      this.x = pts.reduce((s, q) => s + q[0], 0) / pts.length; this.y = pts.reduce((s, q) => s + q[1], 0) / pts.length;
      this.flat = true; this.summoned = true; this.finalHazard = true;
    }
    update(dt) {
      this.t += dt;
      if (this.t >= this.life) { this.gone = true; return; }
      const k = this.t / this.life;
      this.pulse -= dt;
      if (this.t > 0.3 && this.pulse <= 0 && k < 0.9) {
        this.pulse = 0.5;
        for (const q of this.pts) AV.combat.add({ shape: 'ring', x: q[0], y: q[1], r: 4, r0: 0, dmg: 1, knock: 0, hazard: true, team: 'enemy', owner: this.owner, life: 0.08 });
      }
      for (const q of this.pts) {
        if (Math.random() < 0.22 * (1 - k * 0.6)) AV.fx.spawn({ x: q[0] + U.rand(-3, 3), y: q[1] - U.rand(0, 3), vx: U.rand(-4, 4), vy: U.rand(-32, -14), life: U.rand(0.25, 0.5), color: U.pick(FIRE_HEX), glow: true });
      }
      for (let i = 0; i < this.pts.length; i += 3) AV.fx.addLight(this.pts[i][0], this.pts[i][1] - 4, 26, '#e2621f', 0.7 * (1 - k));
    }
    draw(ctx, cam) {
      const k = this.t / this.life, fade = k > 0.8 ? (1 - k) / 0.2 : 1, grow = this.t < 0.15 ? this.t / 0.15 : 1;
      this.pts.forEach((q, i) => {
        const x = Math.round(q[0] - cam.x), y = Math.round(q[1] - cam.y);
        const h = Math.max(1, Math.round((3 + 3 * Math.abs(Math.sin(this.t * 9 + i * 1.7))) * fade * grow));
        ctx.fillStyle = '#3d0f0a'; ctx.fillRect(x - 3, y - 1, 7, 2);
        ctx.fillStyle = '#b8361a'; ctx.fillRect(x - 2, y - h, 5, h);
        ctx.fillStyle = '#e2621f'; ctx.fillRect(x - 1, y - h, 3, Math.max(1, h - 1));
        ctx.fillStyle = '#fccf63'; ctx.fillRect(x, y - h + 1, 1, Math.max(1, h - 2));
      });
    }
  }
  // A pillar of fire (the raised torch): a short-lived column, drawn y-sorted.
  class FireColumn extends AV.Entity {
    constructor(world, x, y, hgt) {
      super(null, world);
      this.x = x; this.y = y; this.t = 0; this.life = 0.6; this.hgt = hgt || 46; this.summoned = true; this.finalHazard = true;
    }
    update(dt) {
      this.t += dt;
      if (this.t >= this.life) { this.gone = true; return; }
      const k = this.t / this.life;
      AV.fx.addLight(this.x, this.y - 16, 70 * (1 - k * 0.6), '#f59a36', 1.2 * (1 - k));
      if (Math.random() < 0.8) AV.fx.embers(this.x + U.rand(-5, 5), this.y - U.rand(0, this.hgt * (1 - k)), 1, { speed: 30, up: 50 });
    }
    sortY() { return this.y + 1; }
    draw(ctx, cam) {
      const k = this.t / this.life;
      const hgt = this.hgt * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85 * 0.7), w = 12 * (1 - k * 0.6);
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
      ctx.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 1;
      for (const [col, f] of [['#b8361a', 1], ['#e2621f', 0.72], ['#fccf63', 0.42], ['#fff3c2', 0.18]]) {
        const ww = Math.max(1, Math.round(w * f)), hh = Math.round(hgt * (0.55 + f * 0.45));
        ctx.fillStyle = col;
        ctx.fillRect(x - (ww >> 1), y - hh, ww, hh);
        ctx.fillRect(x - (ww >> 2), y - hh - 3, Math.max(1, ww >> 1), 3);
      }
      ctx.globalAlpha = 1;
    }
  }
  // A hand of the dead erupting from the ground (visual only; the hit is a separate hitbox).
  class AshHand extends AV.Entity {
    constructor(world, x, y, speed) {
      super(null, world);
      this.x = x; this.y = y; this.t = 0; this.animT = 0; this.k = speed || 1; this.summoned = true; this.finalHazard = true;
      this.flip = Math.random() < 0.5;
    }
    update(dt) { this.t += dt; this.animT += dt * this.k; if (this.animT >= 0.8) this.gone = true; }
    draw(ctx, cam) { AV.art.draw(ctx, 'boss_thousand_hand', 'erupt', this.animT, this.x - cam.x, this.y - cam.y, { flip: this.flip }); }
  }

  // ================================================================ behaviour helpers
  function later(b, t, fn) { b.data.sched.push({ t, fn }); }
  function runSched(b, dt) {
    const s = b.data.sched;
    for (let i = s.length - 1; i >= 0; i--) {
      if (!s[i]) continue;
      s[i].t -= dt;
      if (s[i].t <= 0) { const fn = s[i].fn; s.splice(i, 1); fn(); }
    }
  }
  function clampArena(b, x, y, m) {
    const a = b.arena;
    m = m == null ? 12 : m;
    if (!a) return [x, y];
    return [clamp(x, a.x + m, a.x + a.w - m), clamp(y, a.y + m + 6, a.y + a.h - m)];
  }
  function keepIn(b) { const q = clampArena(b, b.x, b.y, 12); b.x = q[0]; b.y = q[1]; }
  function whisper(b, text, x, y) {
    AV.fx.text(x, y, text, { color: GHOST, life: 2.8, rise: 8 });
    AV.fx.ghostly(x, y + 4, 5);
    b.sfx('whisper', { vol: 0.55 });
  }
  // weighted pick; never the same pattern three times running, and a repeat is half as likely
  function choose(b, opts) {
    const H = b.data.hist, n1 = H[H.length - 1], n2 = H[H.length - 2];
    let pool = opts.filter((o) => o[1] > 0 && !(o[0] === n1 && o[0] === n2));
    if (!pool.length) pool = opts;
    const w = (o) => (o[0] === n1 ? o[1] * 0.5 : o[1]);
    let r = Math.random() * pool.reduce((s, o) => s + w(o), 0);
    let pick = pool[pool.length - 1][0];
    for (const o of pool) { r -= w(o); if (r <= 0) { pick = o[0]; break; } }
    H.push(pick);
    if (H.length > 4) H.shift();
    return pick;
  }
  function clearHazards(b) {
    const D = b.data;
    D.sched.length = 0;
    for (const e of b.world.entities) if (e.finalHazard || e instanceof AV.combat.Telegraph) e.gone = true;
    const hits = AV.combat.hits;
    for (let i = hits.length - 1; i >= 0; i--) if (hits[i].owner === b) hits.splice(i, 1);
  }
  function fireArc(b, cx, cy, a, rad, spread, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const aa = a - spread + (spread * 2) * i / (n - 1);
      pts.push(clampArena(b, cx + Math.cos(aa) * rad, cy + Math.sin(aa) * rad * 0.7, 6));
    }
    b.world.add(new FireLine(b.world, b, pts, 2.1));
  }

  // ================================================================ phase 1: the Kindler
  function toStalk(b, pause) { b.data.pause = pause; b.go('stalk'); }
  function rec(b, t, anim) { b.data.rec = t; b.data.recAnim = anim || 'idle'; b.go('recover'); }

  function startRoll(b) {
    const D = b.data;
    D.rollCd = U.rand(3.2, 4.6);
    D.rollA = b.angleTo() + Math.PI + U.pick([-0.8, 0.8]);
    const q = clampArena(b, b.x + Math.cos(D.rollA) * 50, b.y + Math.sin(D.rollA) * 50, 16);
    if (Math.hypot(q[0] - b.x, q[1] - b.y) < 30) D.rollA += Math.PI * 0.6 * (Math.random() < 0.5 ? -1 : 1);
    b.invuln = true;
    b.sfx('roll', { pitch: 0.8 });
    b.go('roll');
  }
  function comboWind(b) {
    const D = b.data;
    b.faceTarget();
    D.aim = b.angleTo();
    D.wind = D.combo === 0 ? 0.6 : D.combo === 1 ? 0.45 : 0.55;
    b.telegraph({ shape: 'circle', x: b.x + Math.cos(D.aim) * 16, y: b.y + Math.sin(D.aim) * 12, r: D.combo === 2 ? 24 : 20, life: D.wind, color: '#e2621f' });
    b.go('combo_wind');
  }
  function startSweep(b) {
    const D = b.data;
    b.faceTarget();
    D.aim = b.angleTo();
    for (const o of [-1.05, 0, 1.05]) b.telegraph({ shape: 'line', x: b.x, y: b.y, a: D.aim + o, len: 40, width: 12, life: 0.7, color: '#e2621f' });
    b.sfx('fire', { vol: 0.5 });
    b.go('sweep_wind');
  }
  function startLunge(b) {
    const D = b.data;
    b.faceTarget();
    D.aim = b.angleTo();
    D.len = U.clamp(b.dist() + 24, 60, 140);
    b.telegraph({ shape: 'line', x: b.x, y: b.y - 1, a: D.aim, len: D.len, width: 16, life: 0.6, color: '#e2621f' });
    b.go('lunge_wind');
  }
  function pillarAt(b, x, y) {
    const q = clampArena(b, x, y, 14);
    b.telegraph({ shape: 'circle', x: q[0], y: q[1], r: 15, life: 0.8, color: '#f59a36' });
    later(b, 0.8, () => {
      b.hitbox({ shape: 'ring', x: q[0], y: q[1], r: 11, r0: 0, life: 0.15, knock: 120 });
      b.world.add(new FireColumn(b.world, q[0], q[1], 46));
      b.sfx('fire', { vol: 0.6 });
      AV.fx.shake(1.5, 0.15);
    });
  }
  function startRaise(b) {
    const D = b.data, n = b.hpFrac() < 0.75 ? 4 : 3;
    b.faceTarget();
    for (let i = 0; i < n; i++) later(b, 0.5 + i * 0.5, () => { if (b.P) pillarAt(b, b.P.x, b.P.y); });
    D.raiseT = 0.5 + (n - 1) * 0.5 + 1.1;
    b.sfx('fire');
    b.go('raise');
  }
  function kindlerChoose(b) {
    const d = b.dist(), low = b.hpFrac() < 0.75;
    const opts = d < 42 ? [['combo', 4], ['sweep', 3], ['raise', 1]]
      : d < 120 ? [['lunge', 4], ['raise', low ? 3 : 2], ['approach', 2]]
        : [['raise', 3], ['lunge', 2], ['approach', 1]];
    const n = choose(b, opts);
    if (n === 'approach') { b.data.hist.pop(); toStalk(b, 0.6); return; }
    if (n === 'combo') { b.data.combo = 0; comboWind(b); }
    else if (n === 'sweep') startSweep(b);
    else if (n === 'lunge') startLunge(b);
    else startRaise(b);
  }

  function kindler(b, dt) {
    const D = b.data, P = b.P, d = b.dist();
    if (Math.random() < 0.25) AV.fx.ash(b.x + U.rand(-5, 5), b.y - U.rand(8, 30), 1, { speed: 10, up: 6 });
    if (Math.random() < 0.2) AV.fx.embers(b.x + U.rand(-4, 4), b.y - U.rand(20, 36), 1, { speed: 12 });
    switch (b.state) {
      case 'start': toStalk(b, 0.7); break;
      case 'stalk':
        if (d > 30) { b.chase(b.speed * (d > 90 ? 1.2 : 1), dt); b.anim = 'walk'; }
        else if (d < 18) { b.move(b.angleTo() + Math.PI, b.speed * 0.6, dt); b.anim = 'walk'; }
        else b.anim = 'idle';
        b.faceTarget();
        keepIn(b);
        if (P.state === 'attack' && d < 36 && D.rollCd <= 0 && b.st > 0.25) { startRoll(b); break; }
        if (b.st >= D.pause) kindlerChoose(b);
        break;
      case 'roll':
        b.anim = 'roll';
        b.move(D.rollA, 150, dt);
        keepIn(b);
        if (Math.random() < 0.6) AV.fx.embers(b.x, b.y - 6, 1, { speed: 20 });
        if (b.st >= 0.38) {
          b.invuln = false;
          b.faceTarget();
          if (b.dist() > 44 && Math.random() < 0.6) startLunge(b); else toStalk(b, 0.3);
        }
        break;
      case 'combo_wind':
        b.anim = 'windup';
        if (b.st >= D.wind) {
          const heavy = D.combo === 2;
          b.hitbox({ shape: 'arc', x: b.x, y: b.y - 6, r: heavy ? 34 : 31, a: D.aim, spread: heavy ? 1.1 : 0.95, life: 0.12, knock: heavy ? 190 : 130 });
          b.sfx(heavy ? 'swing2' : 'swing', { pitch: 0.75 });
          if (heavy) { fireArc(b, b.x, b.y, D.aim, 24, 0.9, 7); AV.fx.shake(2, 0.2); }
          D.stepV = heavy ? 110 : 80;
          b.go('combo_hit');
        }
        break;
      case 'combo_hit':
        b.anim = 'attack';
        if (D.stepV > 0) { b.move(D.aim, D.stepV, dt); D.stepV = Math.max(0, D.stepV - 600 * dt); keepIn(b); }
        b.flip = Math.cos(D.aim) < 0;
        if (b.st >= 0.26) { D.combo++; if (D.combo < 3) comboWind(b); else rec(b, 1.0, 'spent'); }
        break;
      case 'sweep_wind':
        b.anim = 'sweep_wind';
        if (b.st >= 0.7) {
          b.hitbox({ shape: 'arc', x: b.x, y: b.y - 6, r: 40, a: D.aim, spread: 1.35, life: 0.14, knock: 160 });
          fireArc(b, b.x, b.y, D.aim, 30, 1.2, 13);
          b.sfx('whoosh', { pitch: 0.7 });
          AV.fx.shake(2, 0.2);
          b.go('sweep_hit');
        }
        break;
      case 'sweep_hit':
        b.anim = 'sweep';
        if (b.st >= 0.3) rec(b, 0.9, 'spent');
        break;
      case 'lunge_wind':
        b.anim = 'stab_wind';
        if (b.st >= 0.6) {
          D.left = D.len;
          D.lungeHit = b.hitbox({ shape: 'circle', x: b.x, y: b.y - 8, r: 12, follow: b, fx: Math.cos(D.aim) * 10, fy: Math.sin(D.aim) * 8 - 8, life: 0.5, knock: 170 });
          b.sfx('whoosh');
          b.go('lunge');
        }
        break;
      case 'lunge': {
        b.anim = 'stab';
        const ox = b.x, oy = b.y;
        b.move(D.aim, Math.min(330, D.left / dt), dt);
        b.flip = Math.cos(D.aim) < 0;
        keepIn(b);
        const moved = Math.hypot(b.x - ox, b.y - oy);
        D.left -= 330 * dt;
        if (Math.random() < 0.8) AV.fx.embers(b.x - Math.cos(D.aim) * 8, b.y - 10, 2, { speed: 20 });
        if (moved < 0.5 || D.left <= 0 || b.st > 0.55) {
          if (D.lungeHit) D.lungeHit.t = D.lungeHit.life;
          AV.fx.ash(b.x + Math.cos(D.aim) * 14, b.y, 8, { speed: 40 });
          rec(b, 0.9, 'stab');
        }
        break;
      }
      case 'raise':
        b.anim = 'raise';
        if (Math.random() < 0.7) AV.fx.embers(b.x + (b.flip ? -10 : 10), b.y - 46, 1, { speed: 25, up: 40 });
        AV.fx.addLight(b.x, b.y - 40, 70, '#f59a36', 0.8);
        if (b.st >= D.raiseT) rec(b, 0.5, 'spent');
        break;
      case 'recover':
        b.anim = D.recAnim || 'idle';
        if (b.st >= D.rec) toStalk(b, U.rand(0.35, 0.7));
        break;
      default: toStalk(b, 0.5);
    }
  }

  // ================================================================ the fall and the rising
  function becomeThousand(b) {
    const D = b.data;
    D.form = 'thousand';
    b.sprite = 'boss_thousand';
    b.x = D.cx; b.y = D.cy;
    b.flip = false; b.alpha = 1; b.dmg = 3; b.speed = 12;
    b.hurtW = 44; b.hurtH = 76;
    b.hurtBox = function () { return { x: this.x - 36, y: this.y - 74, w: 72, h: 80 }; };
    b.shadowSize = () => 0;
    b.light = { r: 130, color: '#e2621f', intensity: 1.25, oy: -48 };
    AV.fx.shake(6, 1.4);
    AV.fx.flash('#e2621f', 0.25);
    b.sfx('roar', { pitch: 0.6 });
    b.go('p2rise');
  }
  function shift(b, dt) {
    const D = b.data;
    if (b.state === 'collapse') {
      b.anim = 'collapse';
      if (Math.random() < 0.7) AV.fx.ash(b.x + U.rand(-8, 8), b.y - U.rand(4, 30), 2, { speed: 30, up: 12 });
      if (b.st >= 1.35) b.go('gather');
    } else {
      b.anim = 'heap';
      b.alpha = Math.max(0, 1 - b.st / 0.9);
      for (let i = 0; i < 4; i++) {
        AV.fx.spawn({ x: b.x + U.rand(-10, 10), y: b.y - U.rand(0, 6), vx: U.rand(-30, 30), vy: U.rand(-50, -10), life: 1.2,
          color: U.pick(i ? ASH_HEX : FIRE_HEX), glow: !i, seek: { x: D.cx, y: D.cy - 10 } });
      }
      if (b.st >= 1.0) becomeThousand(b);
    }
  }

  // ================================================================ phase 2: the Thousand
  function rest(b, t, anim) { b.data.rec = t; b.data.recAnim = anim || 'idle'; b.go('rest'); }
  function pushOut(b) {
    const P = b.P;
    if (!P || P.dead) return;
    const rx = 36, ry = 12, cy = b.y - 2;
    const dx = P.x - b.x, dy = P.y - cy, e = Math.hypot(dx / rx, dy / ry);
    if (e >= 1) return;
    let nx = 0, ny = ry;
    if (e > 0.01) { nx = dx / e; ny = dy / e; }
    b.world.move(P, b.x + nx - P.x, cy + ny - P.y);
  }
  function slamLines(b) {
    const D = b.data, P = b.P, two = b.hpFrac() < 0.4;
    const side = P.x < b.x ? -1 : 1;
    D.lines = [];
    const o1 = [b.x + side * 36, b.y + 2];
    D.lines.push([o1, Math.atan2(P.y - o1[1], P.x - o1[0])]);
    if (two) {
      const o2 = [b.x - side * 36, b.y + 2];
      D.lines.push([o2, Math.atan2(P.y - o2[1], P.x - o2[0]) + U.pick([-0.35, 0.35])]);
    }
    for (const [o, a] of D.lines) b.telegraph({ shape: 'line', x: o[0], y: o[1], a, len: 180, width: 22, life: 0.85, color: '#cbc4c3' });
    b.sfx('growl', { pitch: 0.6, vol: 0.7 });
    b.go('slam_wind');
  }
  function slamDown(b) {
    const D = b.data;
    AV.fx.shake(5, 0.3);
    b.sfx('slam');
    for (const [o, a] of D.lines) {
      for (let k = 0; k < 12; k++) {
        const x = o[0] + Math.cos(a) * (14 + k * 15), y = o[1] + Math.sin(a) * (14 + k * 15);
        const a0 = b.arena;
        if (a0 && (x < a0.x + 4 || x > a0.x + a0.w - 4 || y < a0.y + 4 || y > a0.y + a0.h - 4)) break;
        later(b, k * 0.045, () => {
          b.hitbox({ shape: 'ring', x, y, r: 7, r0: 0, life: 0.12, knock: 150 });
          b.world.add(new AshHand(b.world, x, y, 1.6));
          AV.fx.ash(x, y - 2, 5, { speed: 45, up: 20 });
          if (k % 3 === 0) b.sfx('hit_heavy', { pitch: 0.55, vol: 0.4 });
        });
      }
    }
  }
  function volley(b, n, off) {
    const a = b.angleTo();
    for (let i = 0; i < n; i++) {
      const ang = a + (i - (n - 1) / 2) * 0.19 + off;
      b.shoot({ x: b.x + Math.cos(ang) * 16, y: b.y + 6 + Math.sin(ang) * 6, z: 30, angle: ang, speed: 56, r: 4, dmg: 2, life: 5,
        trail: 'ember', color: '#f59a36' });
    }
    b.sfx('projectile', { pitch: 0.7 });
  }
  function dropAt(b, x, y) {
    const q = clampArena(b, x, y, 14);
    b.telegraph({ shape: 'circle', x: q[0], y: q[1], r: 14, life: 0.9, color: '#f59a36' });
    b.shoot({ x: q[0], y: q[1], z: 150, vz: 0, gravity: 370, lands: true, speed: 0, angle: 0, r: 4, color: '#cbc4c3', trail: 'ember',
      onExpire: (p) => {
        b.hitbox({ shape: 'ring', x: p.x, y: p.y, r: 10, r0: 0, life: 0.12, knock: 110 });
        AV.fx.ash(p.x, p.y - 2, 12, { speed: 60, up: 20 });
        b.sfx('slam', { vol: 0.3, pitch: U.rand(1.1, 1.4) });
      } });
  }
  function graspAt(b, x, y) {
    const q = clampArena(b, x, y, 14);
    b.telegraph({ shape: 'circle', x: q[0], y: q[1], r: 16, life: 0.8, color: '#cbc4c3' });
    later(b, 0.8, () => {
      b.hitbox({ shape: 'ring', x: q[0], y: q[1], r: 11, r0: 0, life: 0.15, knock: 120 });
      b.world.add(new AshHand(b.world, q[0], q[1], 1));
      AV.fx.ash(q[0], q[1] - 2, 10, { speed: 50, up: 25 });
      AV.fx.shake(2, 0.15);
      b.sfx('slam', { vol: 0.5, pitch: 0.8 });
    });
  }
  function thousandChoose(b) {
    const D = b.data, d = b.dist();
    const opts = [['slam', 3], ['spray', d > 80 ? 3 : 2], ['rain', 2], ['grasp', d > 50 ? 2 : 1]];
    if (b.hpFrac() < 0.3 && D.wailCd <= 0) opts.push(['wail', 5]);
    const n = choose(b, opts), low = b.hpFrac() < 0.3;
    if (n === 'slam') slamLines(b);
    else if (n === 'spray') {
      D.two = low; D.fired = 0;
      b.sfx('fire', { vol: 0.7 });
      b.go('spray');
    } else if (n === 'rain') {
      const cnt = low ? 10 : 7;
      for (let i = 0; i < cnt; i++) {
        later(b, 0.55 + i * 0.16, () => {
          const P = b.P;
          if (!P) return;
          if (i === 0) dropAt(b, P.x, P.y);
          else { const a = U.rand(Math.PI * 2), r = U.rand(20, 90); dropAt(b, P.x + Math.cos(a) * r, P.y + Math.sin(a) * r * 0.8); }
        });
      }
      D.endT = 0.55 + cnt * 0.16 + 1.0;
      AV.fx.shake(2, 0.4);
      b.sfx('roar', { pitch: 0.5, vol: 0.5 });
      b.go('rain');
    } else if (n === 'grasp') {
      const cnt = low ? 4 : 3;
      for (let i = 0; i < cnt; i++) later(b, 0.45 + i * 0.62, () => { if (b.P) graspAt(b, b.P.x, b.P.y); });
      D.endT = 0.45 + (cnt - 1) * 0.62 + 0.8 + 0.7;
      AV.fx.ash(b.x - 28, b.y, 14, { speed: 50, up: 25 });
      AV.fx.ash(b.x + 28, b.y, 14, { speed: 50, up: 25 });
      b.sfx('slam', { vol: 0.6, pitch: 0.6 });
      b.go('grasp');
    } else {
      D.wailCd = 14; D.waves = 0;
      b.telegraph({ shape: 'circle', x: b.x, y: b.y, r: 46, life: 0.9, color: GHOST });
      b.sfx('roar', { pitch: 0.45 });
      b.go('wail');
    }
  }

  function thousand(b, dt) {
    const D = b.data, P = b.P;
    b.flip = false;
    pushOut(b);
    if (Math.random() < 0.35) AV.fx.spawn({ x: b.x + U.rand(-40, 40), y: b.y - U.rand(10, 80), vx: U.rand(-6, 6), vy: U.rand(10, 25), life: U.rand(0.8, 1.6), color: U.pick(ASH_HEX) });
    if (Math.random() < 0.3) AV.fx.embers(b.x + U.rand(-8, 8), b.y - 34, 1, { speed: 15 });
    if (b.state !== 'p2rise') {
      if (!D.said.row && b.hpFrac() < 0.42) { D.said.row = true; whisper(b, '…row nine…', b.x - 22, b.y - 70); }
      if (!D.said.warm && b.hpFrac() < 0.27) { D.said.warm = true; whisper(b, '…it was so warm…', b.x + 20, b.y - 64); }
    }
    switch (b.state) {
      case 'p2rise':
        b.anim = 'rise';
        if (Math.random() < 0.8) AV.fx.embers(b.x + U.rand(-48, 48), b.y - U.rand(0, 6), 2, { speed: 30, up: 40 });
        if (Math.random() < 0.5) AV.fx.ash(b.x + U.rand(-48, 48), b.y - U.rand(0, 10), 2, { speed: 40, up: 30 });
        if (b.st >= 1.4 && !D.said.back) { D.said.back = true; whisper(b, '…you came back…', b.x, b.y - 84); }
        if (b.st >= 2.4) { b.invuln = false; D.pause = 0.8; b.go('p2idle'); }
        break;
      case 'p2idle': {
        b.anim = 'idle';
        const tx = clamp(P.x, D.cx - 48, D.cx + 48);
        if (Math.abs(tx - b.x) > 2) b.x += Math.sign(tx - b.x) * Math.min(b.speed * dt, Math.abs(tx - b.x));
        if (b.st >= D.pause) thousandChoose(b);
        break;
      }
      case 'slam_wind':
        b.anim = 'slam_wind';
        if (b.st >= 0.85) { slamDown(b); b.go('slam'); }
        break;
      case 'slam':
        b.anim = 'slam';
        if (b.st >= 1.35) rest(b, 0.1, 'slam');
        break;
      case 'spray':
        b.anim = 'spray';
        if (Math.random() < 0.8) AV.fx.spawn({ x: b.x + U.rand(-34, 34), y: b.y - U.rand(20, 60), vx: 0, vy: 0, life: 0.5, color: U.pick(FIRE_HEX), glow: true, seek: { x: b.x, y: b.y - 20 } });
        if (b.st >= 0.75 && D.fired === 0) { D.fired = 1; volley(b, 7, 0); }
        if (D.two && b.st >= 1.35 && D.fired === 1) { D.fired = 2; volley(b, 8, 0); }
        if (b.st >= (D.two ? 2.25 : 1.65)) rest(b, 0.1, 'idle');
        break;
      case 'rain':
        b.anim = 'rain';
        if (b.st >= D.endT) rest(b, 0.3, 'idle');
        break;
      case 'grasp':
        b.anim = 'grasp';
        if (Math.random() < 0.4) AV.fx.ash(b.x + U.pick([-28, 28]) + U.rand(-4, 4), b.y, 1, { speed: 20, up: 15 });
        if (b.st >= D.endT) rest(b, 0.3, 'idle');
        break;
      case 'wail':
        b.anim = 'wail';
        if (Math.random() < 0.6) AV.fx.ghostly(b.x + U.rand(-30, 30), b.y - U.rand(40, 80), 1);
        if (b.st >= 0.9 && D.waves === 0) {
          D.waves = 1;
          b.shockwave({ x: b.x, y: b.y, r0: 16, speed: 100, max: 250, thick: 10, knock: 160, color: GHOST });
          AV.fx.flash(GHOST, 0.2); AV.fx.shake(6, 0.5);
        }
        if (b.st >= 1.55 && D.waves === 1) {
          D.waves = 2;
          b.shockwave({ x: b.x, y: b.y, r0: 16, speed: 100, max: 250, thick: 10, knock: 160, color: GHOST });
          AV.fx.shake(4, 0.4);
        }
        if (b.st >= 1.75) rest(b, 1.5, 'hurt');
        break;
      case 'rest':
        b.anim = D.recAnim || 'idle';
        if (b.st >= D.rec) { D.pause = U.rand(0.55, 0.95); b.go('p2idle'); }
        break;
      default: D.pause = 0.6; b.go('p2idle');
    }
  }

  // ================================================================ the definition
  const SINK = 2.4;
  AV.data.bosses.boss_final = {
    name: 'WHAT THE ASH REMEMBERS', title: 'the Kindler',
    sprite: 'boss_kindler', hp: 170, dmg: 2, speed: 50, music: 'boss_final',
    w: 12, h: 6, hurt: { w: 16, h: 30 }, weight: 10, shadow: 8,
    light: { r: 58, color: '#f59a36', intensity: 1, oy: -22 },
    phases: [0.55],
    introTime: 2.2, introAnim: 'rise',
    idleSprite: null,
    deathTime: 4.2,

    onStart(b) {
      const a = b.arena || { x: b.x - 200, y: b.y - 150, w: 400, h: 300 };
      b.data = { form: 'kindler', sched: [], hist: [], rollCd: 2, wailCd: 0, pause: 0.8, said: {},
        cx: a.x + a.w / 2, cy: a.y + Math.round(a.h * 0.3) };
      b.flip = false;
      if (b.light) b.light.intensity = 0.2;
    },
    introUpdate(b) {
      const D = b.data, t = b.st;
      if (b.light) b.light.intensity = Math.min(1, 0.2 + t / 1.6);
      if (t < 1.2 && Math.random() < 0.7) {
        AV.fx.spawn({ x: D.cx + U.rand(-16, 16), y: D.cy - U.rand(8, 30), vx: 0, vy: 0, life: 1.0, color: U.pick(FIRE_HEX), glow: true, seek: { x: b.x, y: b.y + 4 } });
      }
      if (Math.random() < 0.6) AV.fx.embers(b.x + U.rand(-8, 8), b.y - U.rand(0, 30 * Math.min(1, t / 1.6)), 1, { speed: 20, up: 30 });
      if (!D.introFire) { D.introFire = true; b.sfx('fire', { vol: 0.8 }); }
      if (t > 1.5 && !D.introStep) { D.introStep = true; AV.fx.shake(2, 0.3); }
    },
    // A killing blow is deferred one frame: Boss.die() clears AV.combat.hits, which must not happen while
    // combat.update is still iterating them (it would read past the emptied array).
    onHit(b, hit) {
      if (hit.dmg >= b.hp) { b.hp = hit.dmg + 0.01; b.data.lethal = hit; }
    },
    brain(b, dt) {
      const D = b.data;
      if (D.lethal) { const h = D.lethal; D.lethal = null; b.hp = 0; b.die(h); return; }
      runSched(b, dt);
      if (D.rollCd > 0) D.rollCd -= dt;
      if (D.wailCd > 0) D.wailCd -= dt;
      if (D.form === 'kindler') kindler(b, dt);
      else if (D.form === 'shift') shift(b, dt);
      else thousand(b, dt);
    },
    onPhase(b, phase) {
      if (phase !== 2) return;
      const D = b.data;
      clearHazards(b);
      D.form = 'shift';
      b.invuln = true;
      AV.fx.ash(b.x, b.y - 16, 30, { speed: 70, r: 8 });
      AV.fx.embers(b.x, b.y - 20, 16, { speed: 60 });
      b.sfx('fire', { vol: 0.9 });
      b.go('collapse');
    },
    onDeath(b) {
      const D = b.data;
      clearHazards(b);
      b.invuln = true;
      // It does not die. It kneels, and waits for his choice.
      b.finish = function () {
        if (this.finished) return;
        this.finished = true;
        AV.bosses.end(this, true);
      };
      if (D.form === 'thousand') b.anim = 'sink';
    },
    deathUpdate(b) {
      const D = b.data, t = b.deathT;
      if (D.form !== 'thousand') {
        if (t < 1.4 && Math.random() < 0.6) AV.fx.ash(b.x + U.rand(-8, 8), b.y - U.rand(2, 26), 2, { speed: 25, up: 10 });
        if (b.light) b.light.intensity = Math.max(0.15, 1 - t / 2);
        return;
      }
      if (t < SINK) {
        if (Math.random() < 0.8) AV.fx.spawn({ x: b.x + U.rand(-44, 44), y: b.y - U.rand(20, 80), vx: U.rand(-8, 8), vy: U.rand(20, 40), life: U.rand(0.6, 1.2), color: U.pick(ASH_HEX) });
        if (Math.random() < 0.3) AV.fx.embers(b.x + U.rand(-10, 10), b.y - 30, 1, { speed: 10 });
        if (b.light) b.light.intensity = lerp(1.25, 0.45, t / SINK);
      } else {
        if (Math.random() < 0.12) AV.fx.spawn({ x: b.x + U.rand(-70, 70), y: b.y - U.rand(40, 120), vx: U.rand(-3, 3), vy: U.rand(6, 12), life: U.rand(2, 3.5), color: U.pick(ASH_HEX) });
        if (Math.random() < 0.04) AV.fx.embers(b.x + U.rand(-4, 4), b.y - 24, 1, { speed: 6, up: 10 });
        if (b.light) b.light.intensity = 0.45 + 0.05 * Math.sin(t * 1.3);
      }
      if (t >= SINK + 0.6 && !D.said.sayIt) { D.said.sayIt = true; whisper(b, '…say it…', b.x, b.y - 56); }
    },
    draw(b, ctx, cam) {
      let sprite = b.sprite, anim = b.anim, t = b.animT;
      if (b.dead) {
        t = b.deathT;
        if (b.data.form === 'thousand') { sprite = 'boss_thousand'; if (t < SINK) anim = 'sink'; else { anim = 'kneel'; t -= SINK; } }
        else if (b.data.form === 'shift') { sprite = 'boss_kindler'; anim = 'heap'; }
        else { sprite = 'boss_kindler'; anim = 'collapse'; }
      }
      AV.art.draw(ctx, sprite, anim, t, b.x - cam.x, b.y - cam.y - (b.z || 0), { flip: b.flip, alpha: b.alpha, flash: b.flashT > 0 && !b.dead });
      return true;
    },
  };
})(window.AV);
