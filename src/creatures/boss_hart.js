// ASHEN VOW — BOSS 2: THE OLD HART, AUBRENN (hart_barrow). Art + behaviour.
(function (AV) {
  'use strict';
  const U = AV.util;

  // Poses are authored in "design coords" (feet anchor at x 40); place() shifts them by XS into the frame.
  // The frame is tall for the rear/stomp (antler flames) and extends forward for the lowered-head sweep.
  const FW = 112, FH = 104, OX = 44, OY = 100, XS = OX - 40;
  const G0 = OY; // ground line in sprite coords

  // ---------------------------------------------------------------- tiny math
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function rot(x, y, a) { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; }
  function hashf(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 2246822519) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  // light comes from above-front (the hart faces right)
  const LX = 0.42, LY = -0.91;

  const RAMP_NEAR = ['T', 'S', '7', '6', '5'];
  const RAMP_FAR = ['7', '6', '5', '4', '3'];
  function shadeV(nx, ny) { return nx * LX + ny * LY; }
  function band(v) { return v > 0.6 ? 0 : v > 0.08 ? 1 : v > -0.38 ? 2 : v > -0.76 ? 3 : 4; }

  // filled capsule from (x0,y0,r0) to (x1,y1,r1) with a per-pixel colour function
  function capsule(g, x0, y0, x1, y1, r0, r1, fn) {
    const minX = Math.floor(Math.min(x0 - r0, x1 - r1)) - 1, maxX = Math.ceil(Math.max(x0 + r0, x1 + r1)) + 1;
    const minY = Math.floor(Math.min(y0 - r0, y1 - r1)) - 1, maxY = Math.ceil(Math.max(y0 + r0, y1 + r1)) + 1;
    const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5, py = y + 0.5;
      const t = clamp(((px - x0) * dx + (py - y0) * dy) / L2, 0, 1);
      const cx = x0 + dx * t, cy = y0 + dy * t;
      const r = r0 + (r1 - r0) * t;
      const ex = px - cx, ey = py - cy, d = Math.hypot(ex, ey);
      if (d > r) continue;
      const c = fn(x, y, d > 0.01 ? ex / r : 0, d > 0.01 ? ey / r : 0, t, d / r);
      if (c !== undefined) g.px(x, y, c);
    }
  }
  function disc(g, cx, cy, rx, ry, fn) {
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++) for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
      const d = Math.hypot(nx, ny);
      if (d > 1) continue;
      const c = fn(x, y, nx, ny, d);
      if (c !== undefined) g.px(x, y, c);
    }
  }
  function ik(ax, ay, bx, by, l1, l2, bend) {
    const dx = bx - ax, dy = by - ay;
    let d = Math.hypot(dx, dy);
    if (d > l1 + l2 - 0.05) { const k = d / (l1 + l2 - 0.05); l1 *= k; l2 *= k; }
    d = Math.max(0.1, d);
    const a = Math.atan2(dy, dx);
    const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const ang = a + bend * A;
    return [ax + Math.cos(ang) * l1, ay + Math.sin(ang) * l1];
  }

  // ---------------------------------------------------------------- antler & candle geometry (antler-local, standing pose)
  const HA0 = 0.45; // resting head angle the antler geometry was designed at
  const NEAR_ANTLER = {
    beam: [[0, 0], [-2, -5], [-5, -10], [-10, -14], [-16, -16], [-22, -16], [-27, -14]],
    tines: [[[-1, -2], [4, -5]], [[-3, -7], [0, -13]], [[-7, -12], [-6, -19]], [[-13, -15], [-14, -22]], [[-19, -16], [-22, -22]], [[-27, -14], [-31, -18]]],
    candles: [1, 2, 3, 4, 5],
    moss: [[2, 4], [3, 5], [4, 3]],
  };
  const FAR_ANTLER = {
    beam: [[1, 0], [3, -6], [7, -11], [11, -15], [14, -18]],
    tines: [[[2, -3], [7, -4]], [[5, -9], [10, -13]], [[9, -13], [12, -19]], [[14, -18], [17, -21]]],
    candles: [1, 3],
    moss: [[2, 3]],
  };
  const N_CANDLES = NEAR_ANTLER.candles.length + FAR_ANTLER.candles.length;

  // ---------------------------------------------------------------- the pose model
  // H hip, S shoulder, K skull centre, ha head angle (muzzle direction, + = lowered), jaw 0..1,
  // legs {nf, ff, nh, fh}: {hoof:[x,y]} (IK) or {knee:[x,y], hoof:[x,y]} (explicit).
  function standPose(f) {
    return {
      H: [26, G0 - 31], S: [52, G0 - 31], K: [67, G0 - 46], ha: HA0, jaw: 0, f: f || 0, fire: false, sway: 0, tail: 0,
      legs: { nf: { hoof: [56, G0] }, ff: { hoof: [51, G0] }, nh: { hoof: [29, G0] }, fh: { hoof: [24, G0] } },
      lit: null,
    };
  }
  function spineFrame(p) {
    const dx = p.S[0] - p.H[0], dy = p.S[1] - p.H[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const vx = -uy, vy = ux; // v axis points "down" relative to the spine
    return { len, ux, uy, vx, vy, at: (u, v) => [p.H[0] + ux * u + vx * v, p.H[1] + uy * u + vy * v],
      local: (x, y) => { const rx = x - p.H[0], ry = y - p.H[1]; return [rx * ux + ry * uy, rx * vx + ry * vy]; } };
  }
  function headFrame(p) {
    return { at: (x, y) => { const r = rot(x, y, p.ha); return [p.K[0] + r[0], p.K[1] + r[1]]; } };
  }
  function antlerBase(p) { return headFrame(p).at(-1.5, -4.5); }
  function antlerPt(p, base, pt, far) {
    const r = rot(pt[0], pt[1], p.ha - HA0);
    return [base[0] + r[0] + (far ? 1 : 0), base[1] + r[1]];
  }
  // candle positions (sprite coords, the wick) for a pose: near candles first, then far
  function candleTips(p) {
    const out = [];
    const base = antlerBase(p);
    for (const [ant, far] of [[NEAR_ANTLER, false], [FAR_ANTLER, true]]) {
      for (const ti of ant.candles) {
        const tip = antlerPt(p, base, ant.tines[ti][1], far);
        out.push([Math.round(tip[0]), Math.round(tip[1]) - 2, far]);
      }
    }
    return out;
  }

  // bark detail on the torso in spine-local coords, generated once
  const BARK = (() => {
    const R = U.rng(4077), out = [];
    for (let i = 0; i < 34; i++) out.push([Math.round(R() * 36 - 8), Math.round(R() * 18 - 9), 1 + Math.floor(R() * 3), R() < 0.3]);
    return out;
  })();

  // torso silhouette as a profile along the spine (u), top and bottom edges (v, + = down)
  const TORSO_TOP = [[-11, -1], [-9, -6], [-5, -9], [0, -9.6], [6, -8.8], [12, -8.2], [17, -8.8], [21, -10.6], [25, -10], [29, -7.5], [32, -3], [33.5, 1]];
  const TORSO_BOT = [[-11, -1], [-10, 3], [-6, 8.5], [-1, 12], [4, 12.6], [8, 10.4], [12, 8.6], [17, 9], [21, 11.5], [25, 13], [29, 12], [32, 7.5], [33.5, 1]];
  function prof(tab, u) {
    if (u <= tab[0][0]) return tab[0][1];
    for (let i = 1; i < tab.length; i++) if (u <= tab[i][0]) { const a = tab[i - 1], b = tab[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); }
    return tab[tab.length - 1][1];
  }
  function drawTorso(g, sp) {
    const corners = [sp.at(-12, -12), sp.at(35, -12), sp.at(-12, 14), sp.at(35, 14)];
    const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      const [u, v] = sp.local(x + 0.5, y + 0.5);
      if (u < -11 || u > 33.5) continue;
      const t = prof(TORSO_TOP, u), b = prof(TORSO_BOT, u);
      if (v < t || v > b) continue;
      const half = Math.max(1, (b - t) / 2), mid = (t + b) / 2;
      const ny = (v - mid) / half;
      const e = (u - 11) / 22.5;
      const nx = Math.sign(e) * Math.pow(Math.abs(e), 3) * 0.9;
      const wx = nx * sp.ux + ny * sp.vx, wy = nx * sp.uy + ny * sp.vy;
      let s = shadeV(wx, wy) + (hashf(Math.round(u), Math.round(v), 3) - 0.5) * 0.18;
      // anatomy: the shoulder and the haunch catch the light; a crease behind each
      const sh = Math.hypot((u - 24) / 7, (v + 1) / 9), hn = Math.hypot((u - 1) / 7.5, (v - 1) / 9);
      if (sh < 1) s += 0.12 * (1 - sh);
      if (hn < 1) s += 0.1 * (1 - hn);
      if (sh >= 1 && sh < 1.18 && u < 24 && v > -7) s -= 0.3;
      if (hn >= 1 && hn < 1.16 && u > 1 && v > -6 && v < 10) s -= 0.26;
      g.px(x, y, RAMP_NEAR[band(s)]);
    }
  }

  function drawHart(g, p) {
    const sp = spineFrame(p);
    const hf = headFrame(p);
    const sw = p.sway || 0;
    const base = antlerBase(p);

    // ---- far antler, far legs
    drawAntler(g, p, base, FAR_ANTLER, true);
    drawLeg(g, p, sp, 'ff', true);
    drawLeg(g, p, sp, 'fh', true);

    // ---- torso
    drawTorso(g, sp);
    // tail
    const tl = sp.at(-10.5, -4 + (p.tail || 0));
    disc(g, tl[0], tl[1], 2, 2.8, (x, y, nx, ny) => RAMP_NEAR[Math.min(4, band(shadeV(nx, ny)) + 1)]);
    // bark: short fissures across the body, dark knots
    for (const [u, v, len, knot] of BARK) {
      const q = sp.at(u, v);
      const x = Math.round(q[0]), y = Math.round(q[1]);
      if (knot) {
        const c = g.get(x, y);
        if (c === 'T' || c === 'S') { g.px(x, y, '5'); g.px(x + 1, y, '6'); }
        continue;
      }
      for (let k = 0; k < len; k++) {
        const qq = sp.at(u + k * 0.2, v + k);
        const xx = Math.round(qq[0]), yy = Math.round(qq[1]);
        const c = g.get(xx, yy);
        if (c === 'T') g.px(xx, yy, '7');
        else if (c === 'S') g.px(xx, yy, '6');
        else if (c === '7') g.px(xx, yy, '5');
      }
    }
    // the ash-hollow in the flank: bark split open over the ribs
    hollow(g, sp, p);

    // ---- neck with a shaggy ruff
    const n0 = sp.at(25, -2), n1 = hf.at(-2.5, 0.8);
    capsule(g, n0[0], n0[1], n1[0], n1[1], 6.5, 3.6, (x, y, nx, ny) => RAMP_NEAR[band(shadeV(nx, ny) + (hashf(x - Math.round(p.K[0]), y - Math.round(p.K[1]), 5) - 0.5) * 0.14)]);
    // shaggy ruff of bark-strips under the throat
    {
      const dx = n1[0] - n0[0], dy = n1[1] - n0[1], L = Math.hypot(dx, dy) || 1;
      let px = -dy / L, py = dx / L;
      if (py < 0) { px = -px; py = -py; }
      for (let k = 0; k < 7; k++) {
        const t = 0.12 + k * 0.11;
        const r = 6.5 + (3.6 - 6.5) * t - 1;
        const sx = Math.round(n0[0] + dx * t + px * r), sy = Math.round(n0[1] + dy * t + py * r);
        const len = 2 + ((k * 5 + 1) % 3);
        for (let i = 0; i < len; i++) g.px(sx + (i === len - 1 && k % 2 ? -1 : 0), sy + i, i < len - 1 ? '6' : '5');
      }
    }

    // ---- near legs
    drawLeg(g, p, sp, 'nh', false);
    drawLeg(g, p, sp, 'nf', false);

    // ---- head
    const m0 = hf.at(2, 0.3), m1 = hf.at(11, 0.8);
    capsule(g, m0[0], m0[1], m1[0], m1[1], 3.8, 2.3, (x, y, nx, ny) => RAMP_NEAR[band(shadeV(nx, ny))]);
    disc(g, p.K[0], p.K[1], 5.2, 4.8, (x, y, nx, ny) => RAMP_NEAR[band(shadeV(nx, ny))]);
    // ear (points back, a little droop)
    const e0 = hf.at(-3, -3.2), e1 = hf.at(-9, -4.2);
    capsule(g, e0[0], e0[1], e1[0], e1[1], 1.9, 0.9, (x, y, nx, ny) => (ny > 0.25 ? '6' : '7'));
    // dark muzzle tip, mouth
    const nose = hf.at(11.8, 0.6);
    g.px(Math.round(nose[0]), Math.round(nose[1]), '3');
    g.px(Math.round(nose[0]) - 1, Math.round(nose[1]), '5');
    const jaw = p.jaw || 0;
    const mo0 = hf.at(6, 2.6), mo1 = hf.at(11, 2.4);
    if (jaw > 0.3) {
      const j1 = hf.at(10, 2.6 + jaw * 2.2), j0 = hf.at(5, 2.4);
      g.line(mo0[0], mo0[1], mo1[0], mo1[1], '2');
      g.line(j0[0], j0[1], j1[0], j1[1], '1');
      g.line(j0[0], j0[1] + 1, j1[0], j1[1] + 1, '6');
    } else g.line(mo0[0], mo0[1], mo1[0], mo1[1], '5');

    // ---- near antler
    drawAntler(g, p, base, NEAR_ANTLER, false);

    // ---- candle stubs (outlined with the body)
    const tips = candleTips(p);
    for (const [x, y] of tips) { g.px(x, y + 1, 'g'); g.px(x, y + 2, 'f'); g.px(x + 1, y + 1, '9'); g.px(x + 1, y + 2, 'g'); }

    g.outline('0');

    // wax drips down the tines
    for (const [x, y] of tips) { if (g.get(x, y + 3) === '0') g.px(x, y + 3, 'f'); }

    // ---- eye: a pinched wick
    const eye = hf.at(1.4, -1.5);
    const ex = Math.round(eye[0]), ey = Math.round(eye[1]);
    if (p.closed) {
      // lids down: a dark seam, no wick-light
      g.px(ex - 1, ey, '5'); g.px(ex, ey, '3'); g.px(ex + 1, ey, '3'); g.px(ex + 2, ey, '5');
    } else {
      g.px(ex - 1, ey, '2'); g.px(ex, ey, '1'); g.px(ex + 1, ey, '1'); g.px(ex, ey + 1, '3');
      g.px(ex + 1, ey, p.fire ? 'p' : 'o');
      if (p.fire) g.px(ex + 1, ey - 1, 'n');
    }

    // ---- grave-moss: strands hang from the throat ruff, belly and antlers
    for (let k = 0; k < 5; k++) {
      const t = 0.15 + k * 0.17;
      const q = [n0[0] + (n1[0] - n0[0]) * t, n0[1] + (n1[1] - n0[1]) * t + (6.5 - 2.9 * t)];
      moss(g, q[0], q[1] - 1, 3 + ((k * 3) % 4), sw, k, k % 2 === 0);
    }
    for (let k = 0; k < 4; k++) { const q = sp.at(6 + k * 5.5, 8.5 + (k === 3 ? 3 : 0)); moss(g, q[0], q[1], 2 + ((k * 5) % 3), sw, k + 4, false); }
    for (const [ant, far] of [[NEAR_ANTLER, false], [FAR_ANTLER, true]]) {
      for (const [bi, len] of ant.moss) { const q = antlerPt(p, base, ant.beam[bi], far); moss(g, q[0], q[1] + 2, len, sw, bi + 9, false); }
    }

    // ---- flames
    const lit = p.lit == null ? tips.length : p.lit;
    tips.forEach(([x, y, far], i) => {
      if (i < lit) flame(g, x, y, p.fire, p.f * 7 + i * 3, far);
      else { g.px(x, y, '1'); if (p.smoke && i === lit) { g.px(x, y - 2, '6'); g.px(x + 1, y - 4, '5'); } }
    });
  }

  // the ash-hollow: the bark hide split open along the flank, ribs and a coal inside
  const HOLLOW = [
    '...0000.....',
    '.00211100...',
    '0211612100..',
    '0216612610..',
    '.02166126100',
    '..0216L12610',
    '..02L1216610',
    '...00211100.',
    '.....000....',
  ];
  function hollow(g, sp, p) {
    for (let j = 0; j < HOLLOW.length; j++) for (let i = 0; i < HOLLOW[j].length; i++) {
      let c = HOLLOW[j][i];
      if (c === '.') continue;
      const q = sp.at(8 + i, -4 + j);
      const x = Math.round(q[0]), y = Math.round(q[1]);
      if (g.get(x, y) == null) continue;
      if (c === '0') {
        // the lip of the split: dark above, a lit edge below (it faces up into the light)
        c = j >= 6 ? '8' : j <= 1 ? '5' : '4';
      } else if (c === 'L') c = p.fire ? 'n' : 'l';
      g.px(x, y, c);
    }
  }

  function moss(g, x, y, len, sway, k, ruff) {
    x = Math.round(x); y = Math.round(y);
    for (let i = 0; i < len; i++) {
      const ox = Math.round(sway * (i / Math.max(1, len)) * ((k % 2) ? 1 : 0.6));
      let c = (i + k) % 3 === 0 ? 'B' : (i + k) % 3 === 1 ? 'C' : 'D';
      if (i === len - 1) c = 'E';
      if (ruff && i === 0) c = '7';
      g.px(x + ox, y + i, c);
    }
  }

  // candle flame on the wick at (x, y). Phase 2: the candles ignite into tall flames.
  function flame(g, x, y, fire, seed, far) {
    const fl = Math.floor(hashf(seed, 7, 1) * 3);
    if (!fire) {
      g.px(x, y, 'o');
      g.px(x, y - 1, fl === 2 ? 'q' : 'p');
      if (fl === 0) g.px(x, y - 2, 'p');
      if (fl === 2) g.px(x + 1, y - 2, 'o');
      return;
    }
    const h = 5 + fl;
    const lean = fl === 1 ? 1 : 0;
    for (let i = 0; i < h; i++) {
      const w = i < 3 ? 1 : 0;
      const c = i < 1 ? 'm' : i < 2 ? 'n' : i < h - 2 ? 'o' : 'p';
      const ox = i >= h - 2 ? lean : 0;
      for (let dx = -w; dx <= w; dx++) g.px(x + dx + ox, y - i, dx === 0 ? c : (i < 2 ? 'm' : 'n'));
    }
    g.px(x, y - 1, 'p'); g.px(x, y - 2, 'q');
    if (fl === 2) g.px(x - 1, y - h, 'o');
  }

  function drawAntler(g, p, base, ant, far) {
    const ramp = far ? ['7', '6', '5', '4'] : ['9', '8', '7', '6'];
    const pts = ant.beam.map((q) => antlerPt(p, base, q, far));
    const n = pts.length;
    for (let i = 0; i < n - 1; i++) {
      const r0 = 1.8 - (i / (n - 1)) * 0.8, r1 = 1.8 - ((i + 1) / (n - 1)) * 0.8;
      capsule(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], r0, r1, (x, y, nx, ny) => ramp[Math.min(3, band(shadeV(nx, ny)))]);
    }
    for (const [a, b] of ant.tines) {
      const q0 = antlerPt(p, base, a, far), q1 = antlerPt(p, base, b, far);
      capsule(g, q0[0], q0[1], q1[0], q1[1], 1.15, 0.7, (x, y, nx, ny) => ramp[Math.min(3, band(shadeV(nx, ny)))]);
    }
    if (p.fire) {
      // the ignited antlers: tongues of fire lick up from the beam and every tine
      const tongue = (x, y, h, lean) => {
        for (let k = 0; k < h; k++) g.px(x + (k >= h - 1 ? lean : 0), y - k, k === 0 ? 'm' : k < h - 1 ? 'n' : 'o');
        if (h >= 3) g.px(x, y - 1, 'o');
      };
      for (let i = 1; i < n; i++) {
        const q = pts[i];
        tongue(Math.round(q[0]), Math.round(q[1]) - 2, 1 + Math.floor(hashf(i, p.f, far ? 9 : 8) * 3), hashf(i, p.f, 4) < 0.4 ? 1 : 0);
      }
      ant.tines.forEach(([a, b2], ti) => {
        if (ant.candles.includes(ti)) return;
        const q = antlerPt(p, base, b2, far);
        tongue(Math.round(q[0]), Math.round(q[1]) - 1, 2 + Math.floor(hashf(ti, p.f, 12) * 3), hashf(ti, p.f, 13) < 0.5 ? -1 : 1);
      });
    }
  }

  function drawLeg(g, p, sp, which, far) {
    const L = p.legs[which];
    const fore = which === 'nf' || which === 'ff';
    const top = fore ? sp.at(25 + (far ? -3 : 0), 8) : sp.at(5 + (far ? -3 : 0), 10);
    const hoof = L.hoof;
    const l1 = fore ? 11 : 9, l2 = fore ? 13 : 14;
    const knee = L.knee || ik(top[0], top[1], hoof[0], hoof[1], l1, l2, fore ? -1 : 1);
    const ramp = far ? RAMP_FAR : RAMP_NEAR;
    // upper leg (forearm / gaskin)
    capsule(g, top[0], top[1], knee[0], knee[1], fore ? 3 : 3.4, 1.6, (x, y, nx, ny) => ramp[band(shadeV(nx, ny))]);
    // cannon bone darkens toward the hoof (ash-stockings)
    const fx = hoof[0] + (L.fet || 0), fy = hoof[1] - 2;
    capsule(g, knee[0], knee[1], fx, fy, 1.4, 1.2, (x, y, nx, ny, t) => ramp[Math.min(4, band(shadeV(nx, ny)) + (t > 0.6 ? 2 : 1))]);
    // hoof
    const hx = Math.round(fx), hy = Math.round(hoof[1]);
    const up = L.flat ? 0 : 1;
    g.px(hx - 1, hy - 1, '3'); g.px(hx, hy - 1, '3'); g.px(hx + 1, hy - 1, '2');
    g.px(hx - 1, hy, '2'); g.px(hx, hy, '1'); g.px(hx + 1, hy, up ? '1' : '2');
  }

  // ---------------------------------------------------------------- poses per animation
  const G = G0;
  function leg(v) { return typeof v[0] === 'number' ? { hoof: v } : { knee: v[0], hoof: v[1] }; }
  function LEGS(nf, ff, nh, fh) { return { nf: leg(nf), ff: leg(ff), nh: leg(nh), fh: leg(fh) }; }
  function P(o) { const p = standPose(o.f || 0); for (const k in o) p[k] = o[k]; return p; }
  // shift a design-coords pose into the frame (always builds fresh arrays: pose tables are shared)
  function place(p) {
    const sh = (q) => (q ? [q[0] + XS, q[1]] : q);
    p.H = sh(p.H); p.S = sh(p.S); p.K = sh(p.K);
    const legs = {};
    for (const k in p.legs) legs[k] = Object.assign({}, p.legs[k], { hoof: sh(p.legs[k].hoof), knee: sh(p.legs[k].knee) });
    p.legs = legs;
    return p;
  }
  // lying in the barrow: forelegs tucked under the chest, hocks folded back
  const REST_LEGS = () => LEGS([[57, G - 3], [47, G - 1]], [[54, G - 3], [44, G - 1]], [[22, G - 2], [34, G - 1]], [[18, G - 2], [29, G - 1]]);
  const STAND_LEGS = () => LEGS([56, G], [51, G], [29, G], [24, G]);

  const CHARGE_FR = [
    { H: [26, G - 32], S: [52, G - 33], legs: [[64, G - 4], [60, G - 2], [16, G - 3], [19, G - 1]] },  // stretched
    { H: [26, G - 31], S: [52, G - 30], legs: [[57, G], [62, G - 5], [23, G - 6], [19, G - 3]] },      // fore strike
    { H: [26, G - 34], S: [52, G - 33], legs: [[47, G - 4], [51, G - 2], [35, G - 3], [38, G - 1]] },  // gathered
    { H: [26, G - 31], S: [52, G - 32], legs: [[60, G - 7], [56, G - 4], [27, G], [31, G]] },          // hind drive
  ];
  const SWEEP_FR = [
    { S: [52, G - 31], K: [70, G - 44], ha: 0.7, jaw: 0 },
    { S: [53, G - 29], K: [73, G - 33], ha: 1.25, jaw: 0.3 },
    { S: [53, G - 29], K: [72, G - 31], ha: 1.15, jaw: 0.6 },
  ];
  const RISE_FR = [
    { H: [27, G - 15], S: [51, G - 17], K: [64, G - 37], ha: 0.4, legs: REST_LEGS() },
    { H: [26, G - 28], S: [51, G - 18], K: [64, G - 32], ha: 0.6, legs: LEGS([[56, G - 2], [46, G - 1]], [[53, G - 2], [43, G - 1]], [30, G], [25, G]) },
    { H: [26, G - 30], S: [52, G - 27], K: [66, G - 41], ha: 0.5, legs: LEGS([57, G], [[55, G - 5], [48, G - 1]], [29, G], [24, G]) },
    { H: [26, G - 31], S: [52, G - 32], K: [65, G - 50], ha: 0.2, jaw: 0.7, legs: STAND_LEGS() },
  ];
  const DIE_FR = [
    { H: [26, G - 30], S: [52, G - 29], K: [69, G - 38], ha: 0.95, jaw: 0.5, legs: LEGS([58, G], [50, G], [30, G], [22, G]) },   // stagger
    { H: [26, G - 29], S: [51, G - 17], K: [66, G - 28], ha: 0.9, jaw: 0.3, legs: LEGS([[55, G - 2], [45, G - 1]], [[52, G - 2], [42, G - 1]], [29, G], [24, G]) }, // knees fold
    { H: [27, G - 15], S: [51, G - 17], K: [63, G - 33], ha: 0.6, legs: REST_LEGS() },   // down
    { H: [27, G - 15], S: [51, G - 17], K: [66, G - 22], ha: 0.5, legs: REST_LEGS() },   // head lowering
  ];
  const CHIN = { H: [27, G - 15], S: [51, G - 17], K: [69, G - 9], ha: 0.35, legs: REST_LEGS() };   // muzzle to the earth

  // fight anims (each also gets a burning '_f' twin for phase 2)
  const FIGHT = {
    idle: { fps: 3, n: 4, pose(i) { const b = [0, 0, 1, 1][i]; return P({ f: i, H: [26, G - 31 + b], S: [52, G - 31 + b], K: [67, G - 46 + b], sway: [0, 1, 1, 0][i] }); } },
    walk: { fps: 7, n: 6, pose(i) {
      const T = Math.PI * 2, ph = i / 6;
      const L = (bx, off) => { const a = (ph + off) * T; return [Math.round(bx - Math.cos(a) * 5), Math.round(G - Math.max(0, Math.sin(a)) * 4)]; };
      const bob = Math.round(Math.abs(Math.sin(ph * T * 2)));
      return P({ f: i, H: [26, G - 31 - bob], S: [52, G - 31 - bob], K: [67, G - 46 - bob + Math.round(Math.sin(ph * T))], ha: 0.45 + 0.06 * Math.sin(ph * T),
        sway: i % 3 === 0 ? 0 : 1, legs: LEGS(L(56, 0.25), L(51, 0.75), L(29, 0), L(24, 0.5)) });
    } },
    charge_wind: { fps: 5, n: 2, pose(i) { return P({ f: i, H: [25, G - 29], S: [51, G - 29], K: [71, G - 37], ha: 1.05, tail: -1, sway: i, legs: LEGS(i ? [53, G - 5] : [58, G], [52, G], [27, G], [21, G]) }); } },
    charge: { fps: 12, n: 4, pose(i) { const c = CHARGE_FR[i]; return P({ f: i, H: c.H, S: c.S, K: [c.S[0] + 21, c.S[1] - 4], ha: 1.0, tail: -2, sway: i % 2 ? 2 : 1, legs: LEGS(...c.legs) }); } },
    recover: { fps: 3, n: 2, pose(i) { return P({ f: i, H: [26, G - 30], S: [52, G - 29 + i], K: [69, G - 33 + i], ha: 0.95, jaw: i ? 0.9 : 0.5, sway: i, legs: LEGS([58, G], [49, G], [30, G], [22, G]) }); } },
    sweep_wind: { fps: 6, n: 2, pose(i) { return P({ f: i, H: [27, G - 30], S: [51, G - 33], K: [62 - i, G - 51 - i], ha: 0.1, sway: -1, legs: LEGS([60, G], [54, G], [28, G], [21, G]) }); } },
    sweep: { fps: 14, n: 3, loop: false, pose(i) { const s = SWEEP_FR[i]; return P({ f: i, H: [26, G - 31], S: s.S, K: s.K, ha: s.ha, jaw: s.jaw, sway: 2 - i, legs: LEGS([62, G], [55, G], [29, G], [23, G]) }); } },
    root_wind: { fps: 6, n: 2, pose(i) { return P({ f: i, H: [26, G - 33], S: [53, G - 27], K: [70 + i, G - 24 + i], ha: 1.45, jaw: 0.4, sway: i, legs: LEGS([62, G], [56, G], [28, G], [23, G]) }); } },
    rear: { fps: 5, n: 2, pose(i) {
      const u = i * 2;
      return P({ f: i, H: [28, G - 28], S: [47, G - 45 - u], K: [60, G - 60 - u], ha: 0.35, jaw: 0.8, tail: 1, sway: -2,
        legs: LEGS([[61, G - 45 - u], [60, G - 32 - u]], [[58, G - 43 - u], [56, G - 30 - u]], [36, G], [31, G]) });
    } },
    stomp: { fps: 8, n: 2, loop: false, pose(i) { return P({ f: i, H: [26, G - 32], S: [52, G - 27 - i], K: [70, G - 34 - i], ha: 0.9, jaw: 0.6, tail: -1, sway: 2, legs: LEGS([60, G], [55, G], [28, G], [23, G]) }); } },
    vigil: { fps: 6, n: 2, pose(i) { return P({ f: i, H: [26, G - 30], S: [51, G - 34], K: [63, G - 52 - i], ha: -0.2, jaw: 0.9, sway: i, legs: LEGS([59, G], [53, G], [27, G], [21, G]) }); } },
    hurt: { fps: 8, n: 2, pose(i) { return P({ f: i, H: [26, G - 31], S: [51, G - 32], K: [64, G - 49 + i], ha: 0.25, jaw: 0.5, legs: LEGS([55, G], [50, G], [30, G], [25, G]) }); } },
  };
  // story anims (no fire variant)
  const STORY = {
    rest: { fps: 2, n: 3, pose(i) { const b = [0, -1, 0][i]; return P({ f: i, H: [27, G - 15 + b], S: [51, G - 17 + b], K: [63, G - 33 + b], ha: 0.75, closed: true, sway: i === 1 ? 1 : 0, legs: REST_LEGS() }); } },
    rise: { fps: 3, n: 4, loop: false, pose(i) { return P(Object.assign({ f: i }, RISE_FR[i])); } },
    // die: stagger, fold, lie down, lower the head; then the seven candles go out one by one (frames 5..11)
    die: { fps: 3, n: 13, loop: false, pose(i) {
      const p = P(Object.assign({ f: i }, i < 4 ? DIE_FR[i] : CHIN));
      if (i >= 4) { p.lit = i === 4 ? N_CANDLES : Math.max(0, 11 - i); p.smoke = i >= 5 && i <= 11; }
      p.closed = i >= 8;
      return p;
    } },
  };
  const DIE_FPS = STORY.die.fps;
  let DIE_TIPS = null;
  function dieTips() { return DIE_TIPS || (DIE_TIPS = candleTips(place(STORY.die.pose(12)))); }

  const hartAnims = {};
  for (const name in FIGHT) {
    for (const fire of [false, true]) {
      const a = FIGHT[name];
      hartAnims[fire ? name + '_f' : name] = { fps: a.fps, loop: a.loop !== false, count: a.n, draw(g, i) { const p = a.pose(i); p.fire = fire; drawHart(g, place(p)); } };
    }
  }
  for (const name in STORY) {
    const a = STORY[name];
    hartAnims[name] = { fps: a.fps, loop: a.loop !== false, count: a.n, draw(g, i) { drawHart(g, place(a.pose(i))); } };
  }
  AV.art.sheet('boss_hart', { w: FW, h: FH, ox: OX, oy: OY, anims: hartAnims });

  // ---------------------------------------------------------------- root-spikes (ROOT LINES) and flame patches
  // drawn by stationary, non-colliding projectiles; the damage comes from separate hitboxes in the brain
  function spike(g, bx, by, h, w, lean, fire) {
    for (let k = 0; k < h; k++) {
      const t = k / h, hw = w * (1 - t) + 0.35, cx = bx + lean * t;
      for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw) - 1; x++) {
        const e = (x + 0.5 - cx) / hw;
        let c = e < -0.3 ? '8' : e < 0.35 ? '7' : '5';
        if (hashf(x, by - k, 5) < 0.12) c = '5';
        if (k < 3 && hashf(x, k, 6) < 0.35) c = hashf(x, k, 7) < 0.5 ? 'B' : 'C';
        if (fire) {
          c = e < -0.3 ? '5' : e < 0.35 ? '4' : '3';
          if (hashf(x, by - k, 8) < 0.16) c = 'l';
          if (k >= h - 4) c = k >= h - 2 ? 'p' : 'o';
          else if (k >= h - 6) c = 'n';
        }
        g.px(x, by - k, c);
      }
    }
  }
  function rootSpikes(g, i, fire) {
    const GY = 22;
    const h1 = [2, 10, 17, 19, 14, 6][i], h2 = [0, 6, 10, 11, 8, 3][i], h3 = [0, 4, 8, 9, 6, 0][i];
    for (let x = 3; x <= 16; x++) if (hashf(x, 3, 11) < 0.7) g.px(x, GY + 1 + (x % 3 === 0 ? 1 : 0), '1');
    spike(g, 6, GY + 1, h2, 2.2, -2, fire);
    spike(g, 14, GY + 1, h3, 2, 2, fire);
    spike(g, 10, GY, h1, 3.2, 1, fire);
    // clods thrown up by the eruption
    if (i <= 2) { g.px(4 - i, GY - 3 - i * 2, 'c'); g.px(16 + i, GY - 4 - i * 2, 'b'); g.px(9, GY - 5 - i * 4, 'c'); }
    g.outline('0');
    if (fire && i >= 1 && i <= 4) { g.px(10 + (i % 2), GY - h1 - 1, 'p'); g.px(9, GY - h1 - 3 + i, 'o'); }
  }
  AV.art.sheet('boss_hart_root', {
    w: 20, h: 28, ox: 10, oy: 26,
    anims: {
      idle: { fps: 9, loop: false, count: 6, draw(g, i) { rootSpikes(g, i, false); } },
      fire: { fps: 9, loop: false, count: 6, draw(g, i) { rootSpikes(g, i, true); } },
    },
  });
  function flamePatch(g, i) {
    const GY = 16;
    for (let x = 3; x <= 12; x++) g.px(x, GY + 1, hashf(x, i, 2) < 0.5 ? '1' : '2');
    for (let x = 4; x <= 11; x++) if (hashf(x, i, 3) < 0.5) g.px(x, GY, 'k');
    const tongues = [[5, 5 + (i % 2)], [8, 8 - (i % 3)], [11, 4 + ((i + 1) % 3)]];
    for (const [tx, th] of tongues) {
      for (let k = 0; k < th; k++) {
        const w = k < th * 0.4 ? 1 : 0;
        const sway = k > th / 2 ? ((i + tx) % 2 ? 1 : 0) : 0;
        const c = k < 2 ? 'm' : k < th * 0.5 ? 'n' : k < th - 1 ? 'o' : 'p';
        for (let dx = -w; dx <= w; dx++) g.px(tx + dx + sway, GY - k, dx === 0 ? c : 'm');
      }
    }
    g.px(8, GY - 1, 'q'); g.px(8, GY - 2, 'p');
    g.px(4 + ((i * 3) % 8), GY - 9 - (i % 3), 'o');
  }
  AV.art.sheet('boss_hart_flame', {
    w: 16, h: 20, ox: 8, oy: 18,
    anims: { idle: { fps: 10, count: 4, draw(g, i) { flamePatch(g, i); } } },
  });

  // ================================================================ behaviour
  const TELE = '#e2621f', TELE_ROOT = '#c9a26e';
  const CHARGE_SPEED = 215, CHARGE_WIND = 0.7;

  const fireOn = (b) => b.phase >= 2;
  const an = (b, name) => (fireOn(b) ? name + '_f' : name);
  const dirX = (b) => (b.flip ? -1 : 1);
  function faceA(b, a) { if (Math.abs(Math.cos(a)) > 0.05) b.flip = Math.cos(a) < 0; }
  function clampArena(b) {
    const a = b.arena;
    if (!a) return;
    b.x = clamp(b.x, a.x + 18, a.x + a.w - 18);
    b.y = clamp(b.y, a.y + 14, a.y + a.h - 6);
  }
  // how far the hart can travel along angle a before the arena edge or a solid tile (loose: roots, point test)
  function rayLen(b, a, max, loose) {
    const ar = b.arena, c = Math.cos(a), s = Math.sin(a);
    let L = 0;
    for (let r = 4; r <= max; r += 4) {
      const x = b.x + c * r, y = b.y + s * r;
      if (ar && (x < ar.x + 18 || x > ar.x + ar.w - 18 || y < ar.y + 14 || y > ar.y + ar.h - 6)) break;
      if (loose) { const id = b.world.tileAtPx(x, y); if (id == null || AV.tiles.isSolid(id)) break; }
      else if (b.world.rectHitsTiles(x - b.w / 2, y - b.h, x + b.w / 2, y)) break;
      L = r;
    }
    return L;
  }
  function endPattern(b) {
    b.go('stalk');
    b.data.pause = fireOn(b) ? U.rand(0.35, 0.7) : U.rand(0.6, 1.05);
  }
  function dust(x, y, n) { AV.fx.burst(x, y, n, { color: ['#655c69', '#857c86', '#4a4250'], speed: 35, up: 12, g: 30, life: 0.6 }); }

  // lingering fire (phase 2): a flame sprite + a small hitbox re-armed every 0.3 s
  function addFire(b, x, y, life) {
    const d = b.data;
    d.fires.push({ x, y, t: 0, life, tick: 0.25 });
    b.shoot({ x, y, angle: 0, speed: 0.001, lands: true, life, z: 0, glow: true, color: TELE, lightR: 18, trail: null, sprite: 'boss_hart_flame', anim: 'idle' });
  }
  function spawnSpike(b, s) {
    b.shoot({ x: s.x, y: s.y, angle: s.flip ? Math.PI : 0, speed: 0.001, lands: true, life: 0.68, z: 0, glow: s.fire, color: TELE, lightR: 22,
      trail: null, sprite: 'boss_hart_root', anim: s.fire ? 'fire' : 'idle' });
    b.hitbox({ shape: 'circle', x: s.x, y: s.y - 4, r: 9, life: 0.22, knock: 130 });
    AV.fx.burst(s.x, s.y, 5, { color: ['#5a3a24', '#3a261a', '#857c86'], speed: 50, up: 40, g: 160, life: 0.5 });
    if (s.fire) { AV.fx.embers(s.x, s.y - 8, 4); if (s.burn) addFire(b, s.x, s.y + 1, 1.8); }
    if (s.first) AV.audio.sfx('hit_heavy', { pitch: 0.55, vol: 0.4 });
  }
  function updateHazards(b, dt) {
    const d = b.data;
    if (d.spikes.length) {
      d.rootT += dt;
      for (let i = d.spikes.length - 1; i >= 0; i--) if (d.spikes[i].t <= d.rootT) { spawnSpike(b, d.spikes[i]); d.spikes.splice(i, 1); }
    }
    for (let i = d.fires.length - 1; i >= 0; i--) {
      const f = d.fires[i];
      f.t += dt; f.tick -= dt;
      if (f.t >= f.life) { d.fires.splice(i, 1); AV.fx.ash(f.x, f.y - 2, 2, { speed: 15, up: 10 }); continue; }
      if (f.tick <= 0) { f.tick = 0.3; b.hitbox({ shape: 'circle', x: f.x, y: f.y - 3, r: 7, dmg: 1, knock: 60, life: 0.1 }); }
      if (Math.random() < 0.12) AV.fx.embers(f.x, f.y - 4, 1, { speed: 12, up: 25 });
    }
  }

  // ---- pattern starters
  const START = {
    charge(b) {
      const d = b.data;
      d.ca = b.angleTo();
      d.clen = rayLen(b, d.ca, 330, false);
      faceA(b, d.ca);
      b.go('charge_wind');
      b.telegraph({ shape: 'line', x: b.x, y: b.y, a: d.ca, len: d.clen + 16, width: 26, life: CHARGE_WIND, color: TELE });
      b.sfx('growl', { pitch: 0.7 });
    },
    sweep(b) {
      if (b.dist() > 50) { b.go('sweep_close'); return; }
      START.sweep_wind(b);
    },
    sweep_wind(b) {
      const d = b.data;
      d.sa = b.angleTo();
      faceA(b, d.sa);
      b.go('sweep_wind');
      for (let k = -2; k <= 2; k++) b.telegraph({ shape: 'line', x: b.x, y: b.y, a: d.sa + k * 0.55, len: 54, width: 12, life: 0.6, color: TELE });
      b.sfx('growl', { pitch: 1.15, vol: 0.7 });
    },
    roots(b) {
      const d = b.data, fire = fireOn(b), a0 = b.angleTo();
      faceA(b, a0);
      b.go('root_wind');
      d.lines = [a0 - 0.5, a0, a0 + 0.5].map((a) => ({ a, len: Math.max(40, rayLen(b, a, 200, true)) }));
      for (const L of d.lines) {
        b.telegraph({ shape: 'line', x: b.x + Math.cos(L.a) * 14, y: b.y + Math.sin(L.a) * 14, a: L.a, len: L.len - 10, width: 16, life: 0.85, color: fire ? TELE : TELE_ROOT });
      }
      b.sfx('growl', { pitch: 0.55, vol: 0.8 });
    },
    stomp(b) {
      const d = b.data;
      b.faceTarget();
      d.sx = b.x + dirX(b) * 14; d.sy = b.y;
      b.go('rear');
      b.telegraph({ shape: 'circle', x: d.sx, y: d.sy, r: 30, life: 0.75, color: TELE });
      b.sfx('roar', { pitch: 0.8, vol: 0.6 });
    },
    spiral(b) {
      b.go('vigil_wind');
      b.telegraph({ shape: 'circle', x: b.x, y: b.y, r: 34, life: 0.7, color: TELE });
      b.sfx('fire', { vol: 0.8 });
    },
  };

  function choose(b) {
    const d = b.data, dist = b.dist(), fire = fireOn(b);
    const w = { charge: 0, sweep: 0, roots: 0, stomp: 0, spiral: 0 };
    if (dist < 52) { w.sweep = 3; w.stomp = 2.2; w.roots = 0.7; }
    else if (dist < 100) { w.charge = 1.7; w.roots = 2; w.stomp = 0.8; w.sweep = 1; }
    else { w.charge = 3; w.roots = 2.2; w.sweep = 0.3; }
    if (fire && d.sinceSpiral >= 3) w.spiral = dist < 52 ? 0.8 : 1.6;
    const h = d.hist;
    if (h.length >= 2 && h[h.length - 1] === h[h.length - 2]) w[h[h.length - 1]] = 0;   // never three in a row
    if (w.charge && rayLen(b, b.angleTo(), 330, false) < 60) w.charge = 0;               // no room to run
    let tot = 0;
    for (const k in w) tot += w[k];
    let r = Math.random() * tot, pick = null;
    for (const k in w) { if (w[k] <= 0) continue; pick = k; r -= w[k]; if (r <= 0) break; }
    if (!pick) pick = h[h.length - 1] === 'stomp' ? 'sweep' : 'stomp';
    h.push(pick);
    if (h.length > 4) h.shift();
    d.sinceSpiral = pick === 'spiral' ? 0 : d.sinceSpiral + 1;
    d.chained = false;
    START[pick](b);
  }

  AV.data.bosses.boss_hart = {
    name: 'THE OLD HART, AUBRENN', title: 'Warden of the Hushwood graves',
    sprite: 'boss_hart', hp: 95, dmg: 2, speed: 40, music: 'boss',
    w: 28, h: 10, hurt: { w: 40, h: 40 }, weight: 10, shadow: 22,
    light: { r: 70, color: '#f59a36', intensity: 0.55, oy: -62, flicker: 0.12 },
    phases: [0.5],
    introTime: 1.7, introAnim: 'rise',
    idleSprite: 'boss_hart', idleAnim: 'rest',
    deathTime: 5.3,

    init(b) {
      Object.assign(b.data, { hist: [], sinceSpiral: 3, pause: 0.6, fires: [], spikes: [], rootT: 0, lines: [], chit: null, dieF: -1 });
    },
    introUpdate(b, dt) {
      const d = b.data;
      if (Math.random() < 0.35) AV.fx.ash(b.x + U.rand(-24, 24), b.y - U.rand(0, 8), 1, { speed: 20, up: 18 });
      if (!d.risen && b.st > 1.0) { d.risen = true; AV.fx.shake(3, 0.4); AV.audio.sfx('roar', { pitch: 0.65, vol: 0.7 }); dust(b.x, b.y, 12); }
    },
    brain(b, dt) {
      const d = b.data, fire = fireOn(b);
      updateHazards(b, dt);
      switch (b.state) {
        case 'start':
          b.anim = an(b, 'idle');
          endPattern(b);
          break;

        case 'stalk': {
          b.faceTarget();
          if (b.dist() > 40) { b.chase(b.speed * (fire ? 1.2 : 1), dt); b.faceTarget(); b.anim = an(b, 'walk'); }
          else b.anim = an(b, 'idle');
          clampArena(b);
          if (b.st >= d.pause) choose(b);
          break;
        }

        // ---- CHARGE: paw and lower the antlers (0.7 s line), run to the arena edge, stagger
        case 'charge_wind':
          b.anim = an(b, 'charge_wind');
          if (Math.random() < 0.2) dust(b.x + dirX(b) * 14, b.y, 1);
          if (b.st >= CHARGE_WIND) {
            b.go('charge');
            d.cdist = 0; d.trail = 0;
            d.chit = b.hitbox({ shape: 'circle', x: b.x, y: b.y - 8, r: 17, follow: b, fx: Math.cos(d.ca) * 12, fy: -8, life: 3, knock: 200 });
            b.sfx('whoosh', { pitch: 0.6 });
            AV.fx.shake(2, 0.2);
          }
          break;
        case 'charge': {
          b.anim = an(b, 'charge');
          const px = b.x, py = b.y;
          b.move(d.ca, CHARGE_SPEED, dt);
          clampArena(b);
          faceA(b, d.ca);
          const moved = Math.hypot(b.x - px, b.y - py);
          d.cdist += moved;
          if (Math.random() < 0.6) dust(b.x - Math.cos(d.ca) * 10, b.y, 1);
          if (fire) {
            d.trail += moved;
            if (d.trail >= 13) { d.trail = 0; addFire(b, b.x - Math.cos(d.ca) * 10, b.y - Math.sin(d.ca) * 4, 3.2); }
          }
          if (d.cdist >= d.clen || moved < CHARGE_SPEED * dt * 0.3 || b.st > 2.4) {
            if (d.chit) { d.chit.life = 0; d.chit = null; }
            b.go('charge_stop');
            d.chain = fire && !d.chained && Math.random() < 0.5;
            AV.fx.shake(4, 0.3);
            b.sfx('slam', { pitch: 0.8, vol: 0.6 });
            dust(b.x + Math.cos(d.ca) * 16, b.y, 10);
          }
          break;
        }
        case 'charge_stop':
          b.anim = an(b, 'recover');
          if (b.st >= (d.chain ? 0.45 : 1.0)) {
            if (d.chain && rayLen(b, b.angleTo(), 330, false) >= 60) { d.chained = true; START.charge(b); }
            else endPattern(b);
          }
          break;

        // ---- ANTLER SWEEP: head drawn back (0.6 s fan), a wide arc through the antlers
        case 'sweep_close':
          b.anim = an(b, 'walk');
          b.chase(b.speed * 1.7, dt);
          clampArena(b);
          if (b.dist() <= 46 || b.st > 1.3) START.sweep_wind(b);
          break;
        case 'sweep_wind':
          b.anim = an(b, 'sweep_wind');
          if (b.st >= 0.6) {
            b.go('sweep');
            b.hitbox({ shape: 'arc', x: b.x, y: b.y - 6, r: 52, a: d.sa, spread: 1.1, life: 0.14, knock: 180 });
            b.sfx('swing', { pitch: 0.55 });
            b.sfx('whoosh', { pitch: 0.8, vol: 0.6 });
            AV.fx.shake(2, 0.15);
            for (let k = 0; k <= 14; k++) {
              const ang = d.sa - 1.1 + 2.2 * k / 14;
              AV.fx.spawn({ x: b.x + Math.cos(ang) * 44, y: b.y - 8 + Math.sin(ang) * 30, vx: Math.cos(ang) * 30, vy: Math.sin(ang) * 20 - 10, life: 0.35,
                color: fire ? U.pick(['#f59a36', '#e2621f', '#fccf63']) : U.pick(['#cbc4c3', '#a8a0a6', '#ebe5dc']), glow: fire });
            }
          }
          break;
        case 'sweep':
          b.anim = an(b, 'sweep');
          if (b.st >= (fire ? 0.65 : 0.8)) endPattern(b);
          break;

        // ---- ROOT LINES: antlers to the earth (0.85 s, three lines), spikes erupt outward; head stays down after
        case 'root_wind':
          b.anim = an(b, 'root_wind');
          if (Math.random() < 0.3) dust(b.x + dirX(b) * 30, b.y, 1);
          if (b.st >= 0.85) {
            b.go('roots');
            d.spikes = []; d.rootT = 0;
            d.lines.forEach((L) => {
              let n = 0;
              for (let r = 20; r <= L.len; r += 15, n++) {
                d.spikes.push({ x: b.x + Math.cos(L.a) * r, y: b.y + Math.sin(L.a) * r, t: (r - 20) / 240, fire, burn: fire && n % 2 === 0, first: n === 0, flip: (n + Math.round(r)) % 2 === 0 });
              }
            });
            AV.fx.shake(3, 0.3);
            b.sfx('slam', { pitch: 0.7, vol: 0.7 });
          }
          break;
        case 'roots':
          b.anim = an(b, 'root_wind');
          if (b.st >= 1.35) endPattern(b);
          break;

        // ---- STOMP: rear up (0.75 s circle), both forehooves down, a shockwave to roll through
        case 'rear':
          b.anim = an(b, 'rear');
          if (b.st >= 0.75) {
            b.go('stomp');
            b.hitbox({ shape: 'circle', x: d.sx, y: d.sy - 4, r: 26, life: 0.12, knock: 190 });
            b.shockwave({ x: d.sx, y: d.sy, r0: 10, speed: 115, max: 125, thick: 9, color: fire ? '#f59a36' : '#cbc4c3' });
            AV.fx.shake(6, 0.4);
            b.sfx('slam');
            dust(d.sx, d.sy, 16);
            d.second = fire ? 0.42 : 0;
          }
          break;
        case 'stomp':
          b.anim = an(b, 'stomp');
          if (d.second > 0) {
            d.second -= dt;
            if (d.second <= 0) {
              b.shockwave({ x: d.sx, y: d.sy, r0: 8, speed: 100, max: 110, thick: 8, color: '#e2621f' });
              AV.fx.embers(d.sx, d.sy - 4, 12, { speed: 60 });
              b.sfx('fire', { vol: 0.7 });
            }
          }
          if (b.st >= 1.0) endPattern(b);
          break;

        // ---- (phase 2) VIGIL: head raised, the antlers shed a slow two-armed spiral of flame-motes
        case 'vigil_wind':
          b.anim = 'vigil_f';
          if (Math.random() < 0.5) AV.fx.embers(b.x + dirX(b) * 20, b.y - 66, 2, { speed: 30 });
          if (b.st >= 0.7) { b.go('vigil'); d.mt = 0; d.ma = b.angleTo(); }
          break;
        case 'vigil':
          b.anim = 'vigil_f';
          d.mt -= dt;
          if (d.mt <= 0) {
            d.mt = 0.26;
            for (let arm = 0; arm < 2; arm++) {
              const a = d.ma + arm * Math.PI;
              b.shoot({ x: b.x + Math.cos(a) * 14, y: b.y + Math.sin(a) * 8, z: 16, angle: a, speed: 40, dmg: 1, r: 3, life: 5, color: '#f59a36', trail: 'ember', lightR: 16 });
            }
            d.ma += 0.4;
            b.sfx('projectile', { vol: 0.25, pitch: 0.8 });
          }
          if (b.st >= 3.0) b.go('vigil_end');
          break;
        case 'vigil_end':
          b.anim = 'recover_f';
          if (b.st >= 0.7) endPattern(b);
          break;

        // ---- phase change: the antlers catch
        case 'ignite':
          b.anim = 'vigil_f';
          if (Math.random() < 0.6) AV.fx.embers(b.x + dirX(b) * U.rand(0, 30), b.y - U.rand(50, 80), 2, { speed: 40 });
          if (b.st >= 1.3) endPattern(b);
          break;

        default:
          endPattern(b);
      }
    },
    onPhase(b) {
      const d = b.data;
      if (d.chit) { d.chit.life = 0; d.chit = null; }
      if (b.light) { b.light.r = 104; b.light.intensity = 0.95; }
      AV.fx.flash('#e2621f', 0.25);
      AV.fx.embers(b.x + dirX(b) * 18, b.y - 70, 30, { speed: 70 });
      AV.audio.sfx('fire');
      b.go('ignite');
    },
    onHit(b, hit) {
      AV.fx.burst(b.x + U.rand(-10, 10), b.y - U.rand(12, 30), 3, { color: ['#dcd8ca', '#c2beb0', '#a8a0a6'], speed: 50, g: 120, life: 0.4 });
      if (fireOn(b)) AV.fx.embers(b.x, b.y - 24, 2);
    },
    onDeath(b) {
      const d = b.data;
      d.fires.length = 0; d.spikes.length = 0; d.chit = null; d.dieF = -1;
    },
    // folds its legs, lowers its head; the candle-flames go out one by one, then it settles into ash
    deathUpdate(b) {
      const d = b.data, t = b.deathT, f = Math.min(12, Math.floor(t * DIE_FPS));
      if (f !== d.dieF) {
        d.dieF = f;
        if (f === 1) AV.fx.shake(2, 0.2);
        if (f === 2) { AV.fx.shake(4, 0.35); AV.audio.sfx('slam', { pitch: 0.6, vol: 0.6 }); dust(b.x, b.y, 16); }
        if (f === 4) dust(b.x + dirX(b) * 28, b.y, 6);
        if (f >= 5 && f <= 11) {
          const tip = dieTips()[11 - f];
          if (tip) {
            const x = b.x + (tip[0] - OX) * dirX(b), y = b.y + (tip[1] - OY) - 2;
            for (let k = 0; k < 5; k++) AV.fx.spawn({ x: x + U.rand(-1, 1), y, vx: U.rand(-4, 4), vy: U.rand(-20, -10), life: U.rand(1.0, 1.7), color: U.pick(['#857c86', '#a8a0a6', '#655c69']), g: -6, drag: 1 });
          }
          AV.audio.sfx('snuff', { vol: 0.35, pitch: 0.9 + (11 - f) * 0.05 });
        }
      }
      const lit = f <= 4 ? N_CANDLES : Math.max(0, 11 - f);
      if (b.light) { b.light.intensity = 0.05 + 0.7 * lit / N_CANDLES; b.light.r = 40 + lit * 8; }
      if (t > 4.4 && Math.random() < 0.5) AV.fx.ash(b.x + U.rand(-24, 24), b.y - U.rand(2, 22), 2, { speed: 20, up: 18 });
      b.alpha = t > 4.6 ? Math.max(0, 1 - (t - 4.6) / 0.7) : 1;
    },
  };
})(window.AV);
