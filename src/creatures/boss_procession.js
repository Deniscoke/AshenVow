// ASHEN VOW — BOSS 1: THE UNNAMED PROCESSION (chapel). Art + behaviour.
// Pilgrims fused into one lurching mass, bearing a burning reliquary palanquin and a processional staff
// crowned with the Open Hand. It chants his name. Phase 2: the reliquary cracks and rains cinders.
(function (AV) {
  'use strict';
  const U = AV.util;

  // ================================================================ pixel toolkit
  const hashf = (x, y, s) => (U.hash2(x | 0, y | 0, s | 0) % 10007) / 10007;
  function put(g, x, y, s) { for (let i = 0; i < s.length; i++) if (s[i] !== '.') g.px(x + i, y, s[i]); }
  function disc(g, cx, cy, rx, ry, fn) {
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++) {
      for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = Math.hypot(nx, ny);
        if (d > 1) continue;
        const c = fn(x, y, nx, ny, d);
        if (c != null) g.px(x, y, c);
      }
    }
  }
  // light from above-front (the mass faces right)
  const LX = 0.42, LY = -0.91;
  const NEAR = ['6', '5', '4', '3', '2'];
  const FAR = ['4', '3', '3', '2', '1'];
  const band = (v) => (v > 0.62 ? 0 : v > 0.12 ? 1 : v > -0.38 ? 2 : v > -0.78 ? 3 : 4);
  const lit = (nx, ny, x, y, ramp, bias) => ramp[band(nx * LX + ny * LY + (bias || 0) + (hashf(x, y, 5) - 0.5) * 0.18)];

  // ================================================================ frame & body plan
  const FW = 112, FH = 90, CX = 50, GY = 87;   // CX: centre of the mass; GY: the ground row (feet)
  const PV = 47;                              // palanquin pole height above the ground, standing
  // the fused pilgrims: hood (u, v) in body space (v = height above ground), torso size, facing
  // (1 forward, -1 back, 0 turned up to the roof), far = behind the palanquin poles
  const BODIES = [
    { u: -15, v: 41, rx: 8, ry: 10, face: -1, far: 1 },
    { u: 1, v: 44, rx: 8, ry: 11, face: 1, far: 1 },
    { u: 15, v: 41, rx: 7, ry: 10, face: 1, far: 1 },
    { u: -21, v: 30, rx: 8, ry: 10, face: 1 },
    { u: -7, v: 36, rx: 8, ry: 11, face: 0 },
    { u: 9, v: 33, rx: 8, ry: 10, face: 1, belt: 1 },
    { u: 21, v: 27, rx: 7, ry: 10, face: 1 },
    { u: -11, v: 19, rx: 7, ry: 8, face: -1, belt: 1 },
    { u: 5, v: 18, rx: 7, ry: 8, face: 1 },
  ];
  const GRIPS = [-24, -9, 8, 22];             // where arms reach up to hold the poles
  const FEET = [-19, -12, -5, 2, 9, 16];
  const FUSED_HANDS = [[-17, 23, -1], [1, 27, 1], [15, 16, 1], [-3, 12, -1]];

  // ---------------------------------------------------------------- one hooded head
  function hood(g, x, y, face, ramp, p, i) {
    disc(g, x, y, 4.5, 4.3, (px, py, nx, ny) => lit(nx, ny, px, py, ramp, 0.1));
    const eye = p.eye || 'o';
    const open = p.chant && (i + (p.f || 0)) % 2 === 0;
    if (face === 0) {
      // turned up to the roof, mouth open
      g.px(x - 4, y - 1, ramp[3]);
      put(g, x - 1, y - 3, 'N1N');
      put(g, x - 2, y - 2, '1' + eye + 'N' + eye + '1');
      put(g, x - 1, y - 1, 'N' + (open || p.chant ? '0' : '1') + 'N');
      g.px(x, y, 'N');
      return;
    }
    const bk = -face;
    g.px(x + bk * 4, y - 4, ramp[2]); g.px(x + bk * 5, y - 3, ramp[3]); g.px(x + bk * 5, y - 2, ramp[3]);
    const dy = p.bow ? 1 : 0;
    const F = (dx, ddy, c) => g.px(x + face * dx, y + ddy + dy, c);
    F(1, -1, '1'); F(2, -1, '1'); F(3, -1, '2');
    F(1, 0, '1'); F(2, 0, eye); F(3, 0, '1');
    F(1, 1, '1'); F(2, 1, 'N'); F(3, 1, 'O');
    F(2, 2, 'N'); F(3, 2, open ? '0' : 'h');
    g.px(x + face * 4, y - 1, ramp[0]); g.px(x + face * 4, y, ramp[1]);
  }

  // ---------------------------------------------------------------- the burning reliquary (a little gilded chapel)
  // (bx, by) = centre of its plinth; tilt shears it (+ = top forward). Flames are queued, drawn after the outline.
  function reliquary(g, bx, by, tilt, p, flames) {
    const T = (x, y) => [Math.round(bx + x - tilt * y), Math.round(by + y)];
    const P = (x, y, c) => { const q = T(x, y); g.px(q[0], q[1], c); };
    const fire = p.fire != null ? p.fire : 1;
    for (let x = -10; x <= 10; x++) { P(x, 0, 'J'); P(x, -1, x > 5 ? 'M' : 'L'); }
    for (let y = -12; y <= -2; y++) {
      for (let x = -9; x <= 9; x++) {
        let c = 'K';
        if (x >= 8) c = 'L';
        if (x === -9) c = 'J';
        if (y === -12) c = x > 0 ? 'M' : 'L';
        P(x, y, c);
      }
    }
    // arched windows with the fire inside (brightest at the bottom, where it feeds)
    const glow = fire >= 2 ? ['q', 'p', 'p', 'o', 'n'] : fire >= 1 ? ['p', 'o', 'o', 'n', 'm'] : ['m', 'l', 'l', 'k', 'k'];
    for (const wx of [-7, 2]) {
      for (let y = -11; y <= -2; y++) for (let x = -1; x <= 4; x++) P(wx + x, y, 'J');
      for (let y = -10; y <= -3; y++) {
        for (let x = 0; x < 4; x++) {
          if (y === -10 && (x === 0 || x === 3)) continue;
          const k = y >= -4 ? 0 : y >= -6 ? (x === 1 || x === 2 ? 1 : 2) : y >= -8 ? 3 : 4;
          P(wx + x, y, glow[k]);
        }
      }
    }
    // a relic in the right window: a small dark skull against the fire
    put2(P, 3, -7, ['.11.', '1..1', '.11.']);
    P(-1, -8, 'L'); P(0, -8, 'M'); P(-1, -5, 'J');
    // gabled roof
    for (let y = -20; y <= -13; y++) {
      const hw = Math.round(1 + (y + 20) * 10 / 7);
      for (let x = -hw; x <= hw; x++) {
        let c = (y % 2 === 0) ? 'J' : 'K';
        if (x >= hw - 1) c = 'M';
        else if (x <= -hw + 1) c = 'J';
        if (y === -13) c = x > 0 ? 'L' : 'K';
        P(x, y, c);
      }
    }
    // finial: the Open Hand, a flame cupped above it
    put2(P, -2, -24, ['L...L', 'LM.ML', '.LML.', '..K..']);
    const fin = T(0, -25);
    flames.push([fin[0], fin[1], fire >= 2 ? 6 : fire >= 1 ? 4 : 2, 3, false]);
    if (fire >= 1) {
      for (const [x, s] of [[-6, 1], [-2, 2], [3, 4], [7, 5]]) {
        const y = -13 - Math.round((11 - Math.abs(x)) * 7 / 10) - 1;
        const q = T(x, y);
        const h = fire >= 2 ? 7 + Math.floor(hashf(s, p.f || 0, 8) * 5) : 3 + Math.floor(hashf(s, p.f || 0, 8) * 3);
        flames.push([q[0], q[1], h, s * 7 + (p.f || 0), fire >= 2]);
      }
    }
    if (p.crack) {
      const C = [[-1, -20], [-2, -17], [0, -15], [-2, -12], [-1, -9], [-3, -6], [-1, -3], [-2, 0]];
      for (let k = 0; k < C.length - 1; k++) {
        const [x0, y0] = C[k], [x1, y1] = C[k + 1];
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let s = 0; s <= n; s++) {
          const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n);
          P(x - 1, y, fire >= 1 ? 'n' : 'l'); P(x + 1, y, fire >= 1 ? 'p' : 'm'); P(x, y, fire >= 1 ? 'q' : 'n');
        }
      }
      // a corner of the roof blown away
      for (const [x, y] of [[-11, -13], [-10, -13], [-9, -13], [-8, -13], [-10, -14], [-9, -14], [-8, -14], [-7, -14], [-8, -15], [-7, -15], [-7, -16], [-6, -16]]) {
        const q = T(x, y); g.px(q[0], q[1], null);
      }
      if (fire >= 1) {
        const a = T(-1, -21), b2 = T(-8, -14);
        flames.push([a[0], a[1], 10 + ((p.f || 0) % 3), 41 + (p.f || 0), true]);
        flames.push([b2[0], b2[1], 6 + ((p.f || 0) % 2) * 2, 53 + (p.f || 0), true]);
      } else {
        const a = T(-1, -21);
        flames.push([a[0], a[1], 1, 5, false]);
      }
    }
    return T;
  }
  function put2(P, x0, y0, rows) {
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') P(x0 + i, y0 + j, row[i]); });
  }

  // a tongue of flame rising from (x, y)
  function flame(g, x, y, h, seed, wide) {
    const r = hashf(seed, 3, 11);
    const lean = r < 0.33 ? -1 : r > 0.66 ? 1 : 0;
    for (let i = 0; i < h; i++) {
      const k = i / h;
      const w = wide ? (k < 0.35 ? 2 : k < 0.7 ? 1 : 0) : (k < 0.45 && h > 2 ? 1 : 0);
      const ox = Math.round(lean * k * k * 2);
      const core = k < 0.2 ? (h > 3 ? 'q' : 'p') : k < 0.5 ? 'p' : k < 0.8 ? 'o' : 'n';
      for (let dx = -w; dx <= w; dx++) {
        const edge = w > 0 && Math.abs(dx) === w;
        g.px(x + dx + ox, y - i, edge ? (k < 0.5 ? 'n' : 'm') : core);
      }
    }
    if (h > 3 && hashf(seed, 9, 2) < 0.5) g.px(x + lean * 2, y - h - 1 - (seed % 2), 'o');
  }

  // ---------------------------------------------------------------- processional staff crowned with the Open Hand
  function staff(g, hx, hy, a, p, flames) {
    const up = 34, down = 8;
    const c = Math.cos(a), s = Math.sin(a);
    const tx = hx + c * up, ty = hy + s * up, bx = hx - c * down, by = hy - s * down;
    // two-tone shaft: lit on the upper side
    const ox = Math.abs(s) > Math.abs(c) ? 1 : 0, oy = ox ? 0 : 1;
    g.line(Math.round(bx + ox), Math.round(by + oy), Math.round(tx + ox), Math.round(ty + oy), 'c');
    g.line(Math.round(bx), Math.round(by), Math.round(tx), Math.round(ty), 'd');
    for (let i = 4; i < up + down; i += 7) {   // iron bands
      const q = [bx + c * i, by + s * i];
      g.px(Math.round(q[0]), Math.round(q[1]), '4');
    }
    const X = Math.round(tx), Y = Math.round(ty);
    put(g, X - 2, Y - 4, 'L...L');
    put(g, X - 2, Y - 3, 'LM.ML');
    put(g, X - 1, Y - 2, 'LML');
    put(g, X - 1, Y - 1, 'KLK');
    g.px(X, Y, 'K');
    flames.push([X, Y - 4, p.fire >= 2 ? 4 : 3, 17 + (p.f || 0), false]);
    // wine-red streamers knotted under the hand; they hang, or stream back in a rush
    const sx = Math.round(tx - c * 4), sy = Math.round(ty - s * 4) + 1;
    const blow = p.blow || 0, f = p.f || 0;
    for (let i = 0; i < 7; i++) {
      const w = Math.round(Math.sin(i * 0.9 + f * 1.3) * 0.8) + Math.round(blow * i * 0.9);
      g.px(sx + w, sy + i - (blow ? Math.round(i * 0.3) : 0), i % 3 === 2 ? 'G' : 'H');
      if (i < 5) g.px(sx + w + 1, sy + i + 1 - (blow ? Math.round(i * 0.3) : 0), 'G');
    }
    return [X, Y];
  }

  // ---------------------------------------------------------------- the whole procession
  // p: { f frame, lean, rise, kneel, bow, lift (palanquin raised on stretched arms), ptilt (poles: + = front down),
  //      fire 0..2, crack, eye, chant, amp (writhing), step, staffA, staffBack, blow, arms (raised free arms),
  //      ground (hands slapped on the floor), dust [[x,y,n]], smear [a0,a1], relAt [x,y] (fallen), rtilt,
  //      polesDown, staffDown, crumble 0..1, flecks }
  function drawProcession(g, p) {
    const f = p.f || 0;
    const kn = p.kneel || 0, lean = p.lean || 0, rise = p.rise || 0, hs = 1 - 0.3 * kn;
    const at = (u, v) => { const k = U.clamp(v / 44, 0, 1); return [CX + u + lean * k, GY - v * hs + rise * k]; };
    const amp = p.amp != null ? p.amp : 1;
    const bob = (i) => Math.round([0, 1, 0, -1][(f + i) % 4] * amp * 0.9);
    const flames = [];
    const fire = p.fire != null ? p.fire : 1;
    let relBox = null;

    // the fallen reliquary (death): behind everything
    if (p.relAt) {
      const T = reliquary(g, p.relAt[0], p.relAt[1], p.rtilt || 0, { fire: p.relFire || 0, crack: true, f }, flames);
      const a = T(-12, 2), b = T(12, -28);
      relBox = [Math.min(a[0], b[0]) - 2, Math.min(a[1], b[1]) - 2, Math.max(a[0], b[0]) + 2, Math.max(a[1], b[1]) + 2];
    }
    if (p.polesDown) {
      g.line(CX - 46, GY - 4, CX + 6, GY - 1, 'd'); g.line(CX - 46, GY - 3, CX + 6, GY, 'c');
      g.line(CX - 40, GY - 7, CX + 10, GY - 4, 'c'); g.line(CX - 40, GY - 6, CX + 10, GY - 3, 'b');
      g.px(CX - 47, GY - 4, 'e'); g.px(CX - 41, GY - 7, 'e');
    }

    // staff behind the mass when swung back
    const staffA = p.staffA != null ? p.staffA : -1.45;
    const sh = p.staffHand || [0, 0];
    const hand0 = at(27 + sh[0], 23 + sh[1]);
    const staffBehind = !p.staffDown && !!p.staffBack;
    let tip = null;
    if (staffBehind) tip = staff(g, Math.round(hand0[0]), Math.round(hand0[1]), staffA, p, flames);

    // ---- skirt of robes to the floor
    const s0 = at(-21, 26), s1 = at(19, 24);
    const top = Math.round(Math.min(s0[1], s1[1]));
    for (let y = top; y <= GY - 1; y++) {
      const t = (y - top) / Math.max(1, GY - 1 - top);
      const xl = Math.round(s0[0] + (CX - 23 - s0[0]) * t - kn * 5 * t);
      const xr = Math.round(s1[0] + (CX + 21 - s1[0]) * t + kn * 6 * t);
      for (let x = xl; x <= xr; x++) {
        if (y >= GY - 2 && hashf(x, y, 21) < 0.3) continue;
        const fold = (x - CX + 60 + Math.round(t * 2)) % 6;
        let c = fold === 0 ? '3' : fold === 1 ? '5' : '4';
        if (x <= xl + 1) c = '3';
        if (x >= xr) c = '5';
        if (y >= GY - 5) c = c === '5' ? '4' : '3';
        if (y >= GY - 2) c = '2';
        g.px(x, y, c);
      }
    }

    // ---- far bodies (behind the poles)
    const body = (B, i, ramp) => {
      const dv = bob(i);
      const [hx, hy] = at(B.u, B.v + dv);
      const [tx, ty] = at(B.u - B.face, B.v + dv - B.ry * 0.85);
      disc(g, tx, ty, B.rx, B.ry * hs, (x, y, nx, ny) => lit(nx, ny, x, y, ramp, 0.05));
      if (B.belt) {
        const yy = Math.round(ty + 2);
        for (let x = Math.round(tx - B.rx + 2); x <= Math.round(tx + B.rx - 2); x++) if (g.get(x, yy) != null) g.px(x, yy, (x % 2) ? 'c' : 'd');
        g.px(Math.round(tx + B.rx - 3), yy + 1, 'd'); g.px(Math.round(tx + B.rx - 3), yy + 2, 'c');
      }
      hood(g, Math.round(hx), Math.round(hy), B.face, ramp, p, i);
    };
    BODIES.forEach((B, i) => { if (B.far) body(B, i, FAR); });

    // ---- palanquin: poles, platform, reliquary, candles
    const lift = p.lift || 0, pt = p.ptilt || 0;
    const poleX = (u) => Math.round(at(u, PV)[0]);
    const poleY = (u) => Math.round(at(u, PV)[1] - lift + pt * u);
    if (!p.relAt) {
      for (const [off, cT, cB] of [[-2, 'c', 'b'], [0, 'd', 'c']]) {
        for (let u = -34; u <= 32; u++) { g.px(poleX(u) + off, poleY(u) + off, cT); g.px(poleX(u) + off, poleY(u) + off + 1, cB); }
      }
      g.px(poleX(32) + 1, poleY(32), 'e'); g.px(poleX(32) + 1, poleY(32) + 1, 'd');
      g.px(poleX(-34) - 1, poleY(-34), 'e'); g.px(poleX(-34) - 1, poleY(-34) + 1, 'd');
      for (let u = -12; u <= 12; u++) { g.px(poleX(u), poleY(u) - 1, 'c'); g.px(poleX(u), poleY(u) - 2, u > 6 ? 'e' : 'd'); }
      reliquary(g, poleX(0), poleY(0) - 3, pt, Object.assign({}, p, { fire }), flames);
      for (const u of [-11, 11]) {
        const x = poleX(u), y = poleY(u) - 3;
        put(g, x, y - 2, 'g9'); put(g, x, y - 1, 'fg'); put(g, x, y, 'fg');
        flames.push([x, y - 3, fire >= 1 ? 2 : 1, 29 + u + f, false]);
      }
    }

    // ---- near bodies
    BODIES.forEach((B, i) => { if (!B.far) body(B, i, NEAR); });
    // hands of the fused, pressing out through the robes
    for (const [u, v, d] of FUSED_HANDS) {
      const [x, y] = at(u, v);
      const X = Math.round(x), Y = Math.round(y);
      g.px(X, Y, 'O'); g.px(X + d, Y, 'N'); g.px(X, Y + 1, 'N'); g.px(X + d, Y - 1, 'O'); g.px(X + 2 * d, Y, 'N');
    }

    // ---- arms up to the poles
    if (!p.relAt) {
      for (const u of GRIPS) {
        const [sx, sy] = at(u - 1, 35);
        const ex = poleX(u), py = poleY(u);
        if (py + 3 >= sy) continue;
        g.line(Math.round(sx), Math.round(sy), ex, py + 3, '4');
        g.line(Math.round(sx) + 1, Math.round(sy), ex + 1, py + 3, '5');
        g.px(ex, py - 1, 'O'); g.px(ex + 1, py - 1, 'N'); g.px(ex, py + 2, 'N'); g.px(ex + 1, py + 2, 'O');
      }
    }
    if (p.arms) {   // free arms thrown up and out
      const w = f % 2;
      for (const [u0, v0, u1, v1] of [[-22, 30, -34, 46 + w * 2], [23, 27, 36, 43 - w * 2], [-4, 40, -8, 56 - w]]) {
        const a = at(u0, v0), b = at(u1, v1);
        g.line(Math.round(a[0]), Math.round(a[1]), Math.round(b[0]), Math.round(b[1]), '4');
        g.line(Math.round(a[0]) + 1, Math.round(a[1]), Math.round(b[0]) + 1, Math.round(b[1]), '5');
        const X = Math.round(b[0]), Y = Math.round(b[1]);
        g.px(X, Y, 'O'); g.px(X + 1, Y, 'N'); g.px(X - 1, Y - 1, 'N'); g.px(X, Y - 2, 'O'); g.px(X + 1, Y - 2, 'N'); g.px(X + 2, Y - 1, 'N');
      }
    }
    if (p.ground) {  // hands slapped flat on the floor in front
      for (const [u0, v0, gx] of [[22, 22, 34], [13, 16, 27], [26, 14, 40]]) {
        const a = at(u0, v0);
        const X = CX + gx + Math.round(lean * 0.3), Y = GY - 1;
        g.line(Math.round(a[0]), Math.round(a[1]), X - 1, Y - 1, '4');
        g.line(Math.round(a[0]), Math.round(a[1]) + 1, X - 1, Y, '3');
        put(g, X - 1, Y - 1, 'NOO'); put(g, X - 1, Y, 'NNON');
      }
    }

    // ---- feet shuffling under the hem
    if (kn < 0.5) {
      FEET.forEach((u, i) => {
        const moving = p.step != null;
        const ph = moving ? (p.step + i) % 4 : 1;
        const x = CX + u + (moving ? [-1, 0, 1, 0][ph] : 0) + Math.round(lean * 0.12);
        const y = GY - (moving && ph === 0 ? 1 : 0);
        put(g, x, y - 1, '223'); put(g, x, y, '1112');
      });
    } else {
      // knees and folded shins pressed to the floor
      for (const u of [-20, -8, 6, 17]) put(g, CX + u, GY - 1, '3332'), put(g, CX + u, GY, '2221');
    }

    // ---- the staff (front)
    if (p.staffDown) {
      g.line(CX + 14, GY - 1, CX + 50, GY - 2, 'd'); g.line(CX + 14, GY, CX + 50, GY - 1, 'c');
      put(g, CX + 50, GY - 4, 'L.L'); put(g, CX + 50, GY - 3, 'LML'); put(g, CX + 51, GY - 2, 'K');
      for (let i = 0; i < 5; i++) g.px(CX + 44 - i, GY - 1 + (i > 2 ? 0 : -0), i % 2 ? 'G' : 'H');
    } else if (!staffBehind) {
      tip = staff(g, Math.round(hand0[0]), Math.round(hand0[1]), staffA, p, flames);
      // the bearer's hands on the shaft
      const X = Math.round(hand0[0]), Y = Math.round(hand0[1]);
      g.px(X, Y, 'O'); g.px(X - 1, Y, 'N'); g.px(X, Y + 1, 'N');
    }
    void tip;

    g.outline('0');

    // ---------------------------------------------------------------- after the outline: light, motion, ruin
    if (p.crumble) crumble(g, p.crumble, relBox, f);
    for (const [x, y, h, seed, wide] of flames) flame(g, x, y, h, seed, wide);
    if (p.smear) {
      const [a0, a1] = p.smear;
      const n = 10;
      for (let k = 0; k <= n; k++) {
        const a = a0 + (a1 - a0) * k / n;
        for (const [r, c] of [[35, '8'], [32, '7'], [29, '6']]) {
          if ((k + r) % 2 && r !== 35) continue;
          g.px(Math.round(hand0[0] + Math.cos(a) * r), Math.round(hand0[1] + Math.sin(a) * r), c);
        }
      }
    }
    if (p.dust) {
      for (const [x, y, n] of p.dust) {
        for (let k = 0; k < n; k++) {
          const dx = Math.round((hashf(k, x, 31) - 0.5) * n * 1.6), dy = -Math.round(hashf(k, y, 37) * n * 0.6);
          g.px(x + dx, y + dy, k % 3 === 0 ? '8' : k % 3 === 1 ? '7' : '6');
        }
      }
    }
    if (p.flecks) {
      for (let k = 0; k < p.flecks; k++) {
        const x = CX - 22 + Math.floor(hashf(k, f, 61) * 44), y = GY - 40 - Math.floor(hashf(k, f, 67) * 26);
        if (g.get(x, y) == null) g.px(x, y, k % 2 ? '7' : '6');
      }
    }
    if (p.heap) heap(g, p.heap, f);
  }

  // the mass crumbles from the top down into drifting ash
  function crumble(g, amt, keepBox, f) {
    const top = GY - 64, H = 66;
    for (let y = 0; y < g.h; y++) {
      for (let x = 0; x < g.w; x++) {
        const c = g.get(x, y);
        if (c == null) continue;
        if (keepBox && x >= keepBox[0] && x <= keepBox[2] && y >= keepBox[1] && y <= keepBox[3]) continue;
        if (y >= GY - 1 && x > CX + 12) continue;       // the fallen staff stays
        const th = top + H * amt + (hashf(x, 3, 17) - 0.5) * 10;
        if (y < th - 2) g.px(x, y, null);
        else if (y < th) g.px(x, y, hashf(x, y, 23) < 0.5 ? '7' : '6');
      }
    }
    // flecks lifting off the crumbling edge
    for (let k = 0; k < 26; k++) {
      const x = CX - 24 + Math.floor(hashf(k, f, 71) * 48);
      const th = top + H * amt + (hashf(x, 3, 17) - 0.5) * 10;
      const y = Math.round(th - 3 - hashf(k, f, 73) * 16);
      if (y > 0 && g.get(x, y) == null) g.px(x, y, k % 3 ? '7' : '8');
    }
  }
  function heap(g, amt, f) {
    const rx = 6 + 19 * amt, ry = 1.5 + 4 * amt;
    disc(g, CX + 1, GY + 0.5, rx, ry * 2, (x, y, nx, ny) => {
      if (y > GY) return null;
      const s = -ny * 0.9 + nx * 0.3 + (hashf(x, y, 81) - 0.5) * 0.5;
      return s > 0.55 ? '8' : s > 0.2 ? '7' : s > -0.2 ? '6' : '5';
    });
    for (let k = 0; k < 6; k++) {
      const x = Math.round(CX + 1 + (hashf(k, 1, 91) - 0.5) * rx * 1.4), y = GY - Math.floor(hashf(k, 2, 93) * ry);
      if (g.get(x, y) != null && hashf(k, f, 97) < 0.7) g.px(x, y, k % 2 ? 'l' : 'n');
    }
  }

  // ================================================================ the sheet
  // Every anim that can happen in phase 2 has a cracked twin '<name>_c' (reliquary split, blazing).
  const SPECS = {
    idle: { fps: 3, count: 4, pose: (i) => ({ f: i, lean: [0, 1, 1, 0][i], rise: [0, 0, 1, 1][i], chant: 1 }) },
    walk: { fps: 5, count: 4, pose: (i) => ({ f: i, lean: [1, 3, 2, 4][i], rise: [0, 1, 0, 1][i], step: i, chant: 1, amp: 1.3,
      staffA: -1.35 + [0, 0.08, 0, 0.1][i] }) },
    slam_wind: { fps: 4, count: 3, loop: false, pose: (i) => ({ f: i, lean: [-2, -4, -5][i], rise: [-2, -4, -5][i], lift: [3, 6, 8][i],
      ptilt: [-0.1, -0.2, -0.26][i], chant: 1, eye: i ? 'p' : 'o', arms: i === 2, staffA: [-1.7, -1.9, -2.0][i], amp: 0.5 }) },
    slam: { fps: 12, count: 3, loop: false, pose: (i) => ({ f: i, lean: [6, 11, 10][i], rise: [2, 6, 6][i], lift: [0, -2, -2][i],
      ptilt: [0.2, 0.34, 0.3][i], ground: i > 0, eye: 'p', chant: 1, staffA: [-1.1, -0.9, -0.95][i], amp: 0.4,
      dust: i ? [[CX + 36, GY - 1, i === 1 ? 10 : 16], [CX + 26, GY - 1, 8]] : null }) },
    slam_rec: { fps: 2.5, count: 2, pose: (i) => ({ f: i, lean: [9, 8][i], rise: [5, 5][i], ptilt: [0.28, 0.25][i], ground: true,
      eye: '6', staffA: -1.0, amp: 0.4, dust: [[CX + 34, GY - 2, i ? 5 : 8]] }) },
    sweep_wind: { fps: 5, count: 3, loop: false, pose: (i) => ({ f: i, lean: [-1, -2, -3][i], staffA: [-2.1, -2.55, -2.85][i],
      staffHand: [[-2, 2], [-4, 3], [-5, 4]][i], chant: 1, eye: i === 2 ? 'p' : 'o', amp: 0.6 }) },
    sweep: { fps: 12, count: 3, loop: false, pose: (i) => ({ f: i, lean: [1, 3, 4][i], staffA: [-1.3, 0, 0.55][i],
      staffHand: [[-1, 2], [2, 0], [3, -1]][i], smear: [[-2.85, -1.3], [-1.6, 0], [-0.4, 0.55]][i], blow: i ? -1 : 0, eye: 'p',
      chant: 1, amp: 0.5 }) },
    sweep_rec: { fps: 3, count: 2, pose: (i) => ({ f: i, lean: [3, 2][i], staffA: [0.7, 0.6][i], staffHand: [3, -2], eye: '6', amp: 0.6 }) },
    charge_wind: { fps: 5, count: 3, loop: false, pose: (i) => ({ f: i, lean: [3, 5, 6][i], rise: [2, 3, 4][i], step: i, chant: 1,
      staffA: [-0.5, -0.3, -0.15][i], eye: 'p', amp: 0.7, dust: [[CX - 20, GY - 1, 4 + i * 3]] }) },
    charge: { fps: 10, count: 4, pose: (i) => ({ f: i, lean: [7, 8, 7, 9][i], rise: [3, 2, 3, 2][i], step: i, chant: 1, amp: 1.5,
      staffA: -0.1, blow: -1, eye: 'p', dust: [[CX - 24, GY - 1, 6]] }) },
    stagger: { fps: 5, count: 4, pose: (i) => ({ f: i, lean: [-5, -4, -6, -4][i], rise: [1, 2, 1, 2][i], ptilt: [-0.18, -0.12, -0.2, -0.14][i],
      eye: '5', staffA: [-2.0, -1.9, -2.1, -1.95][i], amp: 1.8, flecks: 6 }) },
    summon: { fps: 6, count: 4, pose: (i) => ({ f: i, lean: [0, -1, 0, 1][i], rise: [-1, -2, -1, 0][i], arms: true, chant: 1, eye: 'p', amp: 2 }) },
    rain: { fps: 6, count: 3, pose: (i) => ({ f: i, lift: [9, 10, 9][i], rise: -2, fire: 2, chant: 1, eye: 'p', amp: 1.2, staffA: -1.6 }) },
    hurt: { fps: 8, count: 2, loop: false, pose: (i) => ({ f: i, lean: [-3, -1][i], eye: 'p', amp: 1.5 }) },
    // no cracked twin for these:
    huddle: { once: true, fps: 2, count: 4, pose: (i) => ({ f: i, kneel: 1, bow: 1, lean: [-1, 0, 1, 0][i], fire: 0, eye: 'l', chant: i % 2,
      staffA: -1.25, amp: 0.6 }) },
    rise: { once: true, fps: 3, count: 4, loop: false, pose: (i) => ({ f: i, kneel: [0.8, 0.55, 0.3, 0][i], bow: i < 2, fire: [0, 1, 1, 1][i],
      eye: ['l', 'n', 'o', 'o'][i], chant: 1, staffA: -1.3 - i * 0.05, amp: 1.2 }) },
    crack: { once: true, fps: 4, count: 4, loop: false, pose: (i) => ({ f: i, lift: [4, 6, 6, 5][i], rise: [-2, -3, -3, -2][i], fire: 2,
      crack: i > 0, chant: 1, eye: 'p', arms: i > 0, amp: 2 }) },
    windup: { once: true, fps: 4, count: 3, loop: false, pose: (i) => SPECS.slam_wind.pose(i) },
    attack: { once: true, fps: 12, count: 3, loop: false, pose: (i) => SPECS.slam.pose(i) },
    die: { once: true, fps: 2.4, count: 8, loop: false, pose: (i) => {
      if (i === 0) return { f: i, crack: true, fire: 2, eye: 'p', chant: 1, lean: -3, rise: -2, lift: 3, amp: 2 };
      if (i === 1) return { f: i, crack: true, fire: 1, kneel: 0.4, lean: -1, ptilt: -0.12, eye: 'o', staffA: -0.6, amp: 1 };
      if (i === 2) return { f: i, crack: true, fire: 1, kneel: 0.8, lean: -2, ptilt: -0.3, lift: -2, eye: 'n', staffDown: true, amp: 0.5, bow: 1 };
      return { f: i, kneel: 1, bow: 1, amp: 0, eye: i < 5 ? 'l' : '2', relAt: [CX - 30, GY - 1], rtilt: -0.45, relFire: i < 6 ? 1 : 0,
        polesDown: true, staffDown: true, crumble: [0.18, 0.4, 0.62, 0.84, 1.02][i - 3], heap: [0.25, 0.5, 0.75, 0.95, 1][i - 3] };
    } },
  };
  function mkAnim(s, cracked) {
    return {
      fps: s.fps, loop: s.loop !== false, count: s.count,
      draw(g, i) {
        const p = s.pose(i);
        if (cracked) { p.crack = true; p.fire = 2; if (p.eye === 'o' || p.eye == null) p.eye = 'p'; }
        drawProcession(g, p);
      },
    };
  }
  const ANIMS = {};
  for (const name of Object.keys(SPECS)) {
    ANIMS[name] = mkAnim(SPECS[name], false);
    if (!SPECS[name].once) ANIMS[name + '_c'] = mkAnim(SPECS[name], true);
  }
  AV.art.sheet('boss_procession', { w: FW, h: FH, ox: CX, oy: GY, anims: ANIMS });

  // ================================================================ behaviour
  const TIMING = {            // [phase 1, phase 2]
    slamWind: [0.85, 0.7], slamRec: [1.15, 0.85], lurch: [80, 100],
    sweepWind: [0.8, 0.62], sweepRec: [1.0, 0.75],
    chargeWind: [0.9, 0.72], chargeSpeed: [175, 210], stagger: [1.6, 1.2],
    walk: [24, 32], pauseMin: [0.9, 0.5], pauseMax: [1.4, 0.85],
  };
  const T = (b, k) => TIMING[k][b.phase > 1 ? 1 : 0];
  const A = (b, n) => (b.phase > 1 ? n + '_c' : n);
  const RELIQUARY_Y = 60;     // height of the reliquary above the feet (px)
  const BARKS = ['…Brand…', '…Brand… Brand…', '…Brand…', '…Warden…', '…Brand… the gate…', '…Brand…'];

  function bark(b, text, color) {
    AV.fx.text(b.x, b.y - 78, text, { color: color || '#a8a0a6', life: 2.6, rise: 6 });
    AV.audio.sfx('whisper', { vol: 0.55, pitch: U.rand(0.65, 0.8) });
  }
  function keepIn(b) {
    const a = b.arena;
    if (!a) return;
    b.x = U.clamp(b.x, a.x + 22, a.x + a.w - 22);
    b.y = U.clamp(b.y, a.y + 20, a.y + a.h - 6);
  }
  function inArena(b, x, y, mx, my) {
    const a = b.arena;
    return !a || (x >= a.x + mx && x <= a.x + a.w - mx && y >= a.y + my && y <= a.y + a.h - 6);
  }
  // how far the mass can charge along ang before a wall, a pew or the edge of the arena
  function laneLength(b, ang, max) {
    const hw = b.w / 2;
    let d = 4;
    for (; d <= max; d += 4) {
      const x = b.x + Math.cos(ang) * d, y = b.y + Math.sin(ang) * d;
      if (!inArena(b, x, y, 22, 20)) break;
      if (b.world.rectHitsTiles(x - hw, y - b.h, x + hw, y)) break;
    }
    return Math.max(12, d - 4);
  }
  function liveSummons(b) {
    let n = 0;
    for (const e of b.world.entities) if (e.summoned && e.kind === 'pilgrim' && !e.dead && !e.gone) n++;
    return n;
  }
  function spotFree(b, x, y) {
    return inArena(b, x, y, 14, 14) && !b.world.rectHitsTiles(x - 6, y - 8, x + 6, y);
  }
  function endCharge(b) {
    const D = b.data;
    if (D.chargeHit) { D.chargeHit.t = D.chargeHit.life; D.chargeHit = null; }
  }
  function pause(b, k) {
    const D = b.data;
    D.pauseT = U.rand(T(b, 'pauseMin'), T(b, 'pauseMax')) * (k || 1);
    b.go('pause');
  }

  // ---------------------------------------------------------------- patterns
  function choose(b) {
    const D = b.data, d = b.dist(), ph2 = b.phase > 1;
    D.count++;
    let pick = null;
    if (ph2 && D.sinceRain >= 2) pick = 'rain';
    else if (!D.summoned[b.phase] && liveSummons(b) === 0 && (ph2 ? D.count >= D.crackCount + 3 : D.count >= 3)) pick = 'summon';
    else {
      const w = { slam: d < 90 ? 3 : 0.8, sweep: d < 52 ? 3 : d < 70 ? 1 : 0, charge: d > 70 ? 3 : d > 44 ? 1.2 : 0.4 };
      if (laneLength(b, b.angleTo(), 300) < 56) w.charge = 0;   // no room to build speed
      if (D.last1 && D.last1 === D.last2 && w[D.last1] != null) w[D.last1] = 0;
      let sum = 0;
      for (const k in w) sum += w[k];
      let r = Math.random() * sum;
      pick = 'slam';
      for (const k in w) { if (w[k] <= 0) continue; r -= w[k]; if (r <= 0) { pick = k; break; } }
    }
    D.last2 = D.last1; D.last1 = pick;
    if (pick !== 'rain') D.sinceRain++;
    if (pick === 'slam') startSlam(b);
    else if (pick === 'sweep') sweepWind(b, T(b, 'sweepWind'), ph2 ? 2 : 1);
    else if (pick === 'charge') chargeWind(b);
    else if (pick === 'summon') summonStart(b);
    else rainStart(b);
  }

  function startSlam(b) {
    const D = b.data;
    D.lurchT = U.clamp((b.dist() - 30) / T(b, 'lurch'), 0, 0.55);
    if (D.lurchT > 0.06) b.go('slam_lurch');
    else slamWind(b);
  }
  function slamWind(b) {
    const D = b.data;
    D.aim = b.angleTo();
    b.flip = Math.cos(D.aim) < 0;
    D.ix = b.x + Math.cos(D.aim) * 24; D.iy = b.y + Math.sin(D.aim) * 16;
    b.telegraph({ shape: 'circle', x: D.ix, y: D.iy, r: 24, life: T(b, 'slamWind'), color: '#e2621f' });
    b.sfx('growl', { vol: 0.6, pitch: 0.55 });
    b.go('slam_wind');
  }
  function slamHit(b) {
    const D = b.data, ph2 = b.phase > 1;
    b.hitbox({ shape: 'circle', x: D.ix, y: D.iy - 4, r: 24, life: 0.12, knock: 170 });
    b.shockwave({ x: D.ix, y: D.iy, r0: 8, speed: 120, max: ph2 ? 76 : 60, thick: 7, dmg: 1, knock: 120, color: '#a8a0a6' });
    AV.fx.shake(4, 0.3);
    AV.fx.ash(D.ix, D.iy - 2, 18, { speed: 70, up: 20, r: 8 });
    AV.fx.embers(b.x, b.y - RELIQUARY_Y, ph2 ? 14 : 8, { speed: 50 });
    b.sfx('slam', { vol: 1, pitch: 0.72 });
    b.go('slam_hit');
  }

  function sweepWind(b, wind, count) {
    const D = b.data;
    D.aim = b.angleTo();
    b.flip = Math.cos(D.aim) < 0;
    D.wind = wind;
    if (count != null) D.sweeps = count;
    for (let k = -2; k <= 2; k++) b.telegraph({ shape: 'line', x: b.x, y: b.y - 2, a: D.aim + k * 0.5, len: 54, width: 7, life: wind, color: '#e2621f' });
    b.sfx('whoosh', { vol: 0.4, pitch: 0.55 });
    b.go('sweep_wind');
  }
  function sweepHit(b) {
    const D = b.data;
    b.hitbox({ shape: 'arc', x: b.x, y: b.y - 6, r: 54, a: D.aim, spread: 1.05, life: 0.14, knock: 170 });
    b.sfx('swing', { vol: 0.9, pitch: 0.5 });
    AV.fx.ash(b.x + Math.cos(D.aim) * 40, b.y + Math.sin(D.aim) * 30 - 6, 10, { speed: 60, angle: D.aim, spread: 0.8 });
    D.sweeps--;
    b.go('sweep_hit');
  }

  function chargeWind(b) {
    const D = b.data, MAX = 300;
    D.aim = b.angleTo();
    D.lane = laneLength(b, D.aim, MAX);
    D.wall = D.lane < MAX - 4;
    b.flip = Math.cos(D.aim) < 0;
    b.telegraph({ shape: 'line', x: b.x, y: b.y - 3, a: D.aim, len: D.lane + 18, width: 30, life: T(b, 'chargeWind'), color: '#e2621f' });
    b.sfx('growl', { vol: 0.8, pitch: 0.45 });
    b.go('charge_wind');
  }
  function toStagger(b) {
    const D = b.data;
    AV.fx.shake(5, 0.35);
    b.sfx('slam', { vol: 1, pitch: 0.55 });
    b.sfx('break_wall', { vol: 0.35 });
    AV.fx.ash(b.x + Math.cos(D.aim) * 18, b.y + Math.sin(D.aim) * 10 - 20, 24, { speed: 80, r: 10 });
    AV.fx.embers(b.x, b.y - RELIQUARY_Y, 10);
    b.go('stagger');
  }

  function summonStart(b) {
    const D = b.data;
    const want = Math.max(0, 2 - liveSummons(b));
    D.spots = [];
    for (const [dx, dy] of [[-36, 8], [36, 8], [-30, 24], [30, 24], [0, 32], [-46, -6], [46, -6], [0, -24]]) {
      if (D.spots.length >= want) break;
      const x = b.x + dx, y = b.y + dy;
      if (spotFree(b, x, y)) D.spots.push([x, y]);
    }
    for (const [x, y] of D.spots) b.telegraph({ shape: 'circle', x, y, r: 10, life: 0.75, color: '#a8a0a6' });
    D.summoned[b.phase] = true;
    D.spawned = false;
    bark(b, '…Brand… Brand…');
    b.sfx('roar', { vol: 0.45, pitch: 0.65 });
    b.go('summon');
  }

  function rainStart(b) {
    const D = b.data;
    D.rainN = 7; D.rainT = 0; D.sinceRain = 0; D.rainFirst = true;
    bark(b, '…Brand…', '#f59a36');
    b.sfx('fire', { vol: 0.8, pitch: 0.7 });
    b.go('rain_wind');
  }
  // a cinder lobbed from the reliquary; its landing spot is marked the moment it leaves
  function lob(b, onPlayer) {
    const P = b.P, a = b.arena;
    let tx, ty;
    if (onPlayer && P) { tx = P.x; ty = P.y; }
    else if (P && Math.random() < 0.6) { tx = P.x + U.rand(-56, 56); ty = P.y + U.rand(-40, 40); }
    else if (a) { tx = U.rand(a.x + 20, a.x + a.w - 20); ty = U.rand(a.y + 24, a.y + a.h - 10); }
    else { tx = b.x + U.rand(-80, 80); ty = b.y + U.rand(-60, 60); }
    if (a) { tx = U.clamp(tx, a.x + 12, a.x + a.w - 12); ty = U.clamp(ty, a.y + 16, a.y + a.h - 6); }
    const Tf = 0.95, grav = 260, z0 = 52;
    const d = Math.hypot(tx - b.x, ty - b.y);
    b.telegraph({ shape: 'circle', x: tx, y: ty, r: 13, life: Tf, color: '#e2621f' });
    b.shoot({ x: b.x, y: b.y, z: z0, angle: Math.atan2(ty - b.y, tx - b.x), speed: Math.max(1, d / Tf), gravity: grav,
      vz: (0.5 * grav * Tf * Tf - z0) / Tf, lands: true, life: 3, r: 3, trail: 'ember', color: '#f59a36',
      onExpire: () => cinderBurst(b, tx, ty) });
    b.sfx('projectile', { vol: 0.35, pitch: 0.7 });
  }
  function cinderBurst(b, x, y) {
    if (b.dead) return;
    b.hitbox({ shape: 'circle', x, y: y - 4, r: 13, life: 0.12, knock: 110 });
    AV.fx.burst(x, y - 3, 14, { color: ['#f59a36', '#fccf63', '#e2621f', '#b8361a'], speed: 55, up: 30, g: 60, life: 0.5, glow: true });
    AV.fx.ash(x, y - 2, 5, { speed: 30 });
    AV.fx.shake(1.2, 0.08);
    b.sfx('fire', { vol: 0.4, pitch: U.rand(0.9, 1.2) });
  }

  // ---------------------------------------------------------------- the definition
  AV.data.bosses.boss_procession = {
    name: 'THE UNNAMED PROCESSION', title: 'What the chapel kept',
    sprite: 'boss_procession', hp: 60, dmg: 2, speed: 24, music: 'boss',
    w: 30, h: 10, hurt: { w: 42, h: 54 }, weight: 10, shadow: 24,
    light: { r: 64, color: '#f59a36', intensity: 0.85, oy: -RELIQUARY_Y },
    phases: [0.5],
    introTime: 1.6, introAnim: 'rise',
    idleSprite: 'boss_procession', idleAnim: 'huddle',
    deathTime: 4.2,

    init(b) {
      b.data = { count: 0, last1: null, last2: null, sinceRain: 0, summoned: {}, crackCount: 0,
        barkT: U.rand(7, 10), emberT: 0, stepT: 0, pauseT: 0.8, introBark: false };
    },
    introUpdate(b) {
      if (!b.data.introBark && b.st >= 0.5) {
        b.data.introBark = true;
        bark(b, '…Brand…');
        AV.fx.embers(b.x, b.y - RELIQUARY_Y, 12, { speed: 40 });
      }
    },
    brain(b, dt) {
      const D = b.data, ph2 = b.phase > 1;
      // the reliquary burns; the chant never stops for long
      D.emberT -= dt;
      if (D.emberT <= 0) {
        D.emberT = ph2 ? 0.05 : 0.13;
        AV.fx.spawn({ x: b.x + U.rand(-8, 8), y: b.y - U.rand(RELIQUARY_Y - 4, RELIQUARY_Y + 8), vx: U.rand(-6, 6), vy: U.rand(-28, -12),
          life: U.rand(0.6, 1.2), color: U.pick(['#f59a36', '#e2621f', '#fccf63']), glow: true, g: -10 });
      }
      if (ph2 && Math.random() < dt * 4) AV.fx.ash(b.x + U.rand(-30, 30), b.y - U.rand(40, 70), 1, { speed: 10, up: -10, g: 20 });
      D.barkT -= dt;
      if (D.barkT <= 0 && b.state !== 'crack') { D.barkT = U.rand(11, 17); bark(b, U.pick(BARKS)); }

      switch (b.state) {
        case 'start':
          b.anim = 'idle';
          pause(b, 0.7);
          break;
        case 'pause': {
          const d = b.dist();
          b.faceTarget();
          if (d > 44) {
            b.anim = A(b, 'walk');
            b.chase(T(b, 'walk') * (0.45 + 0.9 * Math.max(0, Math.sin(b.st * 4.4))), dt);
          } else b.anim = A(b, 'idle');
          if (b.st >= D.pauseT) choose(b);
          break;
        }
        // ---- lurch & slam
        case 'slam_lurch':
          b.anim = A(b, 'walk');
          b.faceTarget();
          b.move(b.angleTo(), T(b, 'lurch'), dt);
          if (b.dist() < 32 || b.st >= D.lurchT) slamWind(b);
          break;
        case 'slam_wind':
          b.anim = A(b, 'slam_wind');
          if (b.st >= T(b, 'slamWind')) slamHit(b);
          break;
        case 'slam_hit':
          b.anim = A(b, 'slam');
          if (b.st >= 0.3) b.go('slam_rec');
          break;
        case 'slam_rec':   // face-down on the floor, the reliquary low: the punish window
          b.anim = A(b, 'slam_rec');
          if (b.st >= T(b, 'slamRec')) pause(b);
          break;
        // ---- pole sweep
        case 'sweep_wind':
          b.anim = A(b, 'sweep_wind');
          if (b.st >= D.wind) sweepHit(b);
          break;
        case 'sweep_hit':
          b.anim = A(b, 'sweep');
          if (b.st >= 0.3) {
            if (D.sweeps > 0) sweepWind(b, 0.55);     // phase 2: the weight swings it back round
            else b.go('sweep_rec');
          }
          break;
        case 'sweep_rec':
          b.anim = A(b, 'sweep_rec');
          if (b.st >= T(b, 'sweepRec')) pause(b);
          break;
        // ---- charge down the nave
        case 'charge_wind':
          b.anim = A(b, 'charge_wind');
          b.flip = Math.cos(D.aim) < 0;
          if (Math.random() < 0.3) AV.fx.ash(b.x - Math.cos(D.aim) * 16, b.y - 1, 1, { speed: 20, up: 6 });
          if (b.st >= T(b, 'chargeWind')) {
            D.chargeHit = b.hitbox({ shape: 'circle', follow: b, fx: 0, fy: -12, x: b.x, y: b.y - 12, r: 20, life: 4, knock: 190 });
            D.trav = 0; D.stepT = 0;
            b.sfx('roar', { vol: 0.5, pitch: 0.6 });
            b.go('charge');
          }
          break;
        case 'charge': {
          b.anim = A(b, 'charge');
          const sp = T(b, 'chargeSpeed');
          const ox = b.x, oy = b.y;
          b.move(D.aim, sp, dt);
          keepIn(b);
          const moved = Math.hypot(b.x - ox, b.y - oy);
          D.trav += moved;
          b.flip = Math.cos(D.aim) < 0;
          if (Math.random() < 0.6) AV.fx.ash(b.x - Math.cos(D.aim) * 14, b.y - 2, 2, { speed: 30, up: 8 });
          D.stepT -= dt;
          if (D.stepT <= 0) { D.stepT = 0.16; b.sfx('step', { vol: 0.6, pitch: 0.5 }); AV.fx.shake(1, 0.08); }
          const stuck = b.st > 0.1 && moved < sp * dt * 0.4;
          if (stuck || D.trav >= D.lane) {
            endCharge(b);
            if (stuck || D.wall) toStagger(b); else b.go('charge_end');
          } else if (b.st > 3) { endCharge(b); b.go('charge_end'); }
          break;
        }
        case 'charge_end':
          b.anim = A(b, 'slam_rec');
          if (b.st >= 0.6) pause(b);
          break;
        case 'stagger':   // it hit the wall; the whole mass reels
          b.anim = A(b, 'stagger');
          if (Math.random() < 0.2) AV.fx.ash(b.x + U.rand(-16, 16), b.y - U.rand(30, 60), 1, { speed: 20, up: 10 });
          if (b.st >= T(b, 'stagger')) pause(b);
          break;
        // ---- the procession calls for more
        case 'summon':
          b.anim = A(b, 'summon');
          if (!D.spawned && b.st >= 0.75) {
            D.spawned = true;
            for (const [x, y] of D.spots) {
              b.spawn('pilgrim', x, y);
              AV.fx.ash(x, y - 10, 16, { speed: 50, up: 20 });
            }
            b.sfx('growl', { vol: 0.5, pitch: 0.8 });
          }
          if (b.st >= 1.35) pause(b);
          break;
        // ---- phase 2: cinder rain
        case 'rain_wind':
          b.anim = 'rain_c';
          b.faceTarget();
          if (Math.random() < 0.5) AV.fx.embers(b.x, b.y - RELIQUARY_Y - 8, 2, { speed: 40 });
          if (b.st >= 0.6) b.go('rain');
          break;
        case 'rain':
          b.anim = 'rain_c';
          D.rainT -= dt;
          if (D.rainN > 0 && D.rainT <= 0) { lob(b, D.rainFirst); D.rainFirst = false; D.rainN--; D.rainT = 0.22; }
          if (D.rainN <= 0 && b.st >= 1.2) b.go('rain_rec');
          break;
        case 'rain_rec':
          b.anim = A(b, 'idle');
          if (b.st >= 0.9) pause(b);
          break;
        case 'crack':
          b.anim = 'crack';
          if (!D.cracked && b.st >= 0.35) {
            D.cracked = true;
            AV.fx.flash('#f59a36', 0.25);
            AV.fx.embers(b.x, b.y - RELIQUARY_Y, 30, { speed: 90 });
            AV.fx.shake(6, 0.5);
            b.sfx('break_wall', { vol: 0.8 });
            b.sfx('fire', { vol: 0.9 });
            bark(b, '…BRAND…', '#f59a36');
          }
          if (b.st >= 1.4) pause(b, 0.4);
          break;
        default:
          pause(b);
      }
      keepIn(b);
    },
    onPhase(b, phase) {
      if (phase !== 2) return;
      const D = b.data;
      endCharge(b);
      D.sinceRain = 2;          // the first thing the cracked reliquary does is rain
      D.crackCount = D.count;
      D.barkT = U.rand(12, 16);
      b.light = { r: 84, color: '#f59a36', intensity: 1, oy: -RELIQUARY_Y };
      b.go('crack');
    },
    onDeath(b) {
      endCharge(b);
      b.data.lastWord = false;
      b.data.shook = false;
    },
    // it comes apart; the reliquary topples; the ash goes into him
    deathUpdate(b) {
      const D = b.data, t = b.deathT, P = b.P;
      if (!D.lastWord && t > 0.5) { D.lastWord = true; AV.fx.text(b.x, b.y - 74, '…Brand.', { color: '#cbc4c3', life: 3 }); }
      if (!D.shook && t > 1.25) { D.shook = true; AV.fx.shake(3, 0.4); AV.audio.sfx('break_wall', { vol: 0.5, pitch: 0.7 }); }
      if (t < 1.3 && Math.random() < 0.5) AV.fx.ash(b.x + U.rand(-20, 20), b.y - U.rand(10, 50), 2, { speed: 30, up: 10 });
      if (t > 1.2 && t < 3.9 && P && !P.dead) {
        const n = t < 3.2 ? 3 : 1;
        for (let i = 0; i < n; i++) {
          AV.fx.spawn({ x: b.x + U.rand(-22, 22), y: b.y - U.rand(2, 44), vx: U.rand(-40, 40), vy: U.rand(-50, -10), life: 1.3,
            color: U.pick(['#a8a0a6', '#cbc4c3', '#857c86', '#f59a36']), seek: P, glow: Math.random() < 0.3,
            size: Math.random() < 0.3 ? 2 : 1 });
        }
      }
      if (t > 1.3 && Math.random() < 0.15) AV.fx.embers(b.x - 30, b.y - 12, 1, { speed: 20 });
      b.flashT = t < 0.9 && Math.floor(t * 10) % 2 === 0 ? 0.05 : 0;
      if (t > 3.5) b.alpha = Math.max(0, 1 - (t - 3.5) / 0.7);
    },
  };
})(window.AV);
