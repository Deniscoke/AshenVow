// ASHEN VOW — BOSS 3: HOLLIN, WHO RANG THE FLOOD (abbey_belfry). Art + behaviour.
// A drowned, bloated abbot hanging from his bell-rope; the great bronze bell has grown into his ribs.
// He is still ringing to wake an abbey that drowned years ago.
(function (AV) {
  'use strict';
  const U = AV.util;

  const FW = 72, FH = 80, OX = 36, OY = 77;

  // ---------------------------------------------------------------- tiny math
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function hashf(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 2246822519) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  const smooth = (t) => t * t * (3 - 2 * t);
  // light from above-front (he faces right)
  const LX = 0.42, LY = -0.91;
  const sh = (nx, ny) => nx * LX + ny * LY;
  function band(v) { return v > 0.55 ? 0 : v > 0.12 ? 1 : v > -0.3 ? 2 : v > -0.7 ? 3 : 4; }

  const SKIN = ['x', 'O', 'N', 'u', 't'];     // drowned, bloated flesh: grey with a wet cyan sheen
  const ROBE = ['u', 't', 's', 'r', '1'];     // the black habit, soaked through
  const BRONZE = ['L', 'K', 'J', 'b', 'a'];
  const SKINSET = new Set(SKIN);

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
  const skinFn = (seed, dark) => (x, y, nx, ny) => SKIN[Math.min(4, band(sh(nx, ny) * 0.9 + 0.1 + (hashf(x, y, 11 + seed) - 0.5) * 0.22) + (dark || 0))];
  const robeFn = (seed, darker) => (x, y, nx, ny) => ROBE[clamp(band(sh(nx, ny)) + (darker || 0) + (hashf(x, y, 31 + seed) < 0.1 ? 1 : 0), 0, 4)];

  // ---------------------------------------------------------------- the rope
  function ropeSeg(g, x0, y0, x1, y1) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      const xi = Math.floor(x), yi = Math.round(y);
      const tw = (((yi + xi) % 3) + 3) % 3;
      const dark = yi < 7; // the rope vanishes up into the dark of the belfry
      g.px(xi, yi, dark ? (tw === 0 ? 'b' : 'a') : (tw === 0 ? 'b' : 'd'));
      g.px(xi + 1, yi, dark ? 'a' : (tw === 1 ? 'd' : 'c'));
    }
  }
  function sagSeg(g, a, b, sag) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag;
    let px = a[0], py = a[1];
    for (let i = 1; i <= 8; i++) {
      const t = i / 8, u = 1 - t;
      const x = u * u * a[0] + 2 * u * t * mx + t * t * b[0], y = u * u * a[1] + 2 * u * t * my + t * t * b[1];
      ropeSeg(g, px, py, x, y);
      px = x; py = y;
    }
  }
  function drawRopes(g, p, bx, by, hands) {
    const tx = OX - 1;
    if (p.rope === 'free') {
      // he has let go: the rope hangs on without him
      ropeSeg(g, tx, 0, tx, 15);
      g.px(tx, 16, 'c'); g.px(tx + 1, 17, 'b'); g.px(tx, 18, 'b');
      return;
    }
    if (p.rope === 'grip') {
      const hi = hands[0][1] < hands[1][1] ? hands[0] : hands[1], lo = hi === hands[0] ? hands[1] : hands[0];
      ropeSeg(g, tx, 0, hi[0] - 0.5, hi[1]);
      ropeSeg(g, hi[0] - 0.5, hi[1], lo[0] - 0.5, lo[1]);
      ropeSeg(g, lo[0] - 0.5, lo[1], lo[0] - 1.5, lo[1] + 6); // the wet tail below his fists
      return;
    }
    // split: the rope forks above his head, one strand knotted round each wrist
    const S = [bx + p.split[0] - 0.5, by + p.split[1]];
    ropeSeg(g, tx, 0, S[0], S[1]);
    for (const h of hands) {
      if (p.rope === 'slack') sagSeg(g, S, [h[0] - 0.5, h[1]], 7);
      else ropeSeg(g, S[0], S[1], h[0] - 0.5, h[1]);
    }
  }

  // ---------------------------------------------------------------- the bell
  const BELL_H = 28;
  const PROF = [[0, 6], [0.07, 8.8], [0.18, 10.2], [0.45, 10.8], [0.66, 11.8], [0.82, 13.6], [0.93, 15.6], [1, 16.4]];
  function bellHalf(t) {
    if (t <= 0) return PROF[0][1];
    for (let i = 1; i < PROF.length; i++) if (t <= PROF[i][0]) {
      const a = PROF[i - 1], b = PROF[i];
      return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
    }
    return PROF[PROF.length - 1][1];
  }
  // bell-local frame: u across (right), v down the axis from the crown
  function bellFrame(p, bx, by) {
    const s = Math.sin(p.tilt), c = Math.cos(p.tilt);
    const cx = bx, cy = by + 29.5;
    return {
      cx, cy,
      at: (u, v) => [cx + u * c + v * s, cy - u * s + v * c],
      local: (x, y) => { const rx = x - cx, ry = y - cy; return [rx * c - ry * s, rx * s + ry * c]; },
    };
  }
  function bellShape(g, F, pass) {
    const ext = pass === 'rim' ? 1.6 : 0;
    for (let y = Math.floor(F.cy - 8); y <= Math.ceil(F.cy + BELL_H + 8); y++) for (let x = Math.floor(F.cx - 22); x <= Math.ceil(F.cx + 22); x++) {
      const lc = F.local(x + 0.5, y + 0.5), u = lc[0], v = lc[1];
      let half;
      if (v < 0) {
        const r = 3.6 + ext;
        if (v < -r) continue;
        half = Math.sqrt(Math.max(0, 1 - (v / r) * (v / r))) * (6 + ext);
      } else if (v > BELL_H) continue;
      else half = bellHalf(v / BELL_H) + ext;
      if (Math.abs(u) > half) continue;
      if (pass === 'rim') {
        // raw, wine-dark flesh where the bronze has grown through him
        if (SKINSET.has(g.get(x, y))) g.px(x, y, Math.abs(u) > half - 0.8 ? 'F' : 'G');
        continue;
      }
      const t = clamp(v / BELL_H, 0, 1);
      const nx = u / Math.max(1, half);
      const ny = v < 0 ? -0.9 : t < 0.2 ? -0.6 : t > 0.8 ? 0.4 : -0.05;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx));
      let k = band(0.5 * nx - 0.55 * ny + 0.35 * nz - 0.25);
      const vi = Math.floor(v);
      if (vi === 5 || vi === BELL_H - 7) k = Math.min(4, k + 1);   // mould grooves
      if (vi === 6 || vi === BELL_H - 6) k = Math.max(0, k - 1);   // and their ridges
      let col = BRONZE[k];
      if (vi === 8 && ((Math.floor(u) % 3) + 3) % 3 === 0 && Math.abs(nx) < 0.8) col = 'J'; // the inscription
      if (Math.abs(nx - 0.42) < 0.16 && t > 0.05 && t < 0.95) col = Math.abs(nx - 0.42) < 0.06 ? 'M' : 'L'; // wet specular stripe
      if (Math.abs(nx) > 0.93) col = k >= 3 ? 'a' : 'J';
      if (t > 0.3 && hashf(Math.floor(u / 2), Math.floor(v / 2), 21) < 0.11) col = k <= 1 ? 'v' : 'u'; // verdigris
      if (t > 0.55 && hashf(Math.round(u), 0, 23) < 0.07) col = k <= 1 ? 'v' : 'u';                                    // green runs
      g.px(x, y, col);
    }
  }
  const GLOW = [['1', '0'], ['1', 's'], ['v', 'w'], ['x', 'y']];
  function bellMouth(g, p, F) {
    const L = F.at(0, BELL_H - 0.5);
    const gl = GLOW[p.glow];
    disc(g, L[0], L[1], 16.4, 3.4, (x, y, nx) => (nx > 0.2 ? 'L' : nx < -0.6 ? 'J' : 'K'));
    disc(g, L[0], L[1] + 0.3, 14.2, 2.3, (x, y, nx, ny, d) => (d < 0.55 ? gl[1] : gl[0]));
    // the clapper, swinging in the mouth
    const cx = L[0] + p.clap, cy = L[1] + 1.6;
    g.line(Math.round(L[0] + p.clap * 0.4), Math.round(L[1] - 2), Math.round(cx), Math.round(cy), '2');
    disc(g, cx, cy, 2.2, 2.2, (x, y, nx, ny) => (sh(nx, ny) > 0.3 ? '5' : sh(nx, ny) > -0.3 ? '3' : '2'));
    if (p.cracks) {
      // a bite gone out of the lip where the crack runs out
      for (let j = 0; j < 4; j++) for (let i = 0; i <= 3 - j; i++) {
        const q = F.at(8 + i + j * 0.5, BELL_H - j);
        g.px(Math.round(q[0]), Math.round(q[1]), j === 0 ? 'r' : '1');
      }
    }
  }
  const CRACK = [[4, 2], [2, 6], [6, 10], [3, 14], [7, 18], [5, 22], [9, 27]];
  const CRACK2 = [[-6, 11], [-8, 15], [-7, 19], [-10, 23]];
  function bellCracks(g, p, F) {
    const lit = p.glow >= 2;
    for (const path of [CRACK, CRACK2]) {
      for (let i = 0; i < path.length - 1; i++) {
        const a = F.at(path[i][0], path[i][1]), b = F.at(path[i + 1][0], path[i + 1][1]);
        const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
        for (let s = 0; s <= n; s++) {
          const x = Math.round(a[0] + (b[0] - a[0]) * s / n), y = Math.round(a[1] + (b[1] - a[1]) * s / n);
          g.px(x - 1, y, '1');
          g.px(x, y, lit ? 'y' : (s % 2 ? 'w' : 'v'));
        }
      }
    }
  }

  // ---------------------------------------------------------------- body parts
  function robeBack(g, bx, by, p) {
    const top = by + 27, hemBase = by + 70 - p.feetUp;
    for (let y = top; y <= hemBase + 3; y++) {
      const t = (y - top) / Math.max(1, hemBase - top);
      const half = 14 + t * 5.5;
      for (let x = Math.floor(bx - half); x <= Math.ceil(bx + half); x++) {
        const rx = x + 0.5 - bx;
        if (Math.abs(rx) > half) continue;
        const col = x - bx;
        const hem = hemBase + Math.round(hashf(col, 3, 5) * 3) - (hashf(col, 9, 2) < 0.2 ? 3 : 0);
        if (y > hem) continue;
        let k = 2 - Math.round(Math.cos(rx * 0.8 + 0.6) * 0.9) + (y > by + 56 && Math.abs(rx) < 11 ? 1 : 0);
        if (rx > half - 2) k -= 1;
        g.px(x, y, ROBE[clamp(k, 0, 4)]);
      }
    }
  }
  function legs(g, R, p) {
    const up = p.feetUp * 1.5;
    const L = [[-5, 57, -5, 68 - up, -5, 70.5 - up], [5, 58, 6, 69 - up, 6, 71.5 - up]];
    L.forEach(([ax, ay, kx, ky, fx, fy], i) => {
      const a = R([ax, ay]), k = R([kx, ky]), f = R([fx, fy]);
      capsule(g, a[0], a[1], k[0], k[1], 2.3, 1.9, skinFn(20 + i, 1));
      disc(g, f[0], f[1], 2.2, 2.7, skinFn(22 + i, 1));
    });
  }
  function ribs(g, bx, by) {
    for (let k = 0; k < 3; k++) {
      const y0 = by + 31 + k * 4;
      const inner = bellHalf(clamp((y0 + 1 - (by + 29.5)) / BELL_H, 0, 1)) - 1.5;
      const outer = 15.5 - k * 0.8;
      for (const sgn of [-1, 1]) {
        for (let i = 0; i <= 10; i++) {
          const s = i / 10;
          const x = Math.round(bx + sgn * (outer + (inner - outer) * s));
          const y = Math.round(y0 - 2.2 * Math.sin(Math.PI * s) + s * 1.5);
          g.px(x, y, s > 0.85 ? '7' : '9');
          g.px(x, y + 1, s > 0.85 ? '6' : '7');
        }
      }
    }
  }
  function arm(g, S, E, H, side) {
    const dx = H[0] - E[0], dy = H[1] - E[1];
    const L = Math.hypot(dx, dy) || 1;
    capsule(g, E[0], E[1], H[0], H[1], 3.3, 2.8, skinFn(side + 2));
    const ox = E[0] + dx / L * 2.5, oy = E[1] + dy / L * 2.5;
    capsule(g, S[0], S[1], ox, oy, 5, 4.4, robeFn(side));
    // the wide sleeve falls back toward the shoulder when the arm is raised
    if (H[1] < E[1] - 2) capsule(g, ox, oy, ox + (side ? 2.5 : -2.5), oy + 7, 3.4, 1.4, robeFn(side + 1, 1));
    disc(g, H[0], H[1], 3.4, 3.1, skinFn(side + 5));
    // knuckles
    g.px(Math.round(H[0] - 1), Math.round(H[1] - 1), 'N');
    g.px(Math.round(H[0] + 1), Math.round(H[1] - 1), 'N');
    // rope wound round the wrist
    const px = -dy / L, py = dx / L;
    for (const d of [3.6, 5.6]) {
      const wx = H[0] - dx / L * d, wy = H[1] - dy / L * d;
      for (let j = -3; j <= 3; j++) g.px(Math.round(wx + px * j), Math.round(wy + py * j), j === -1 ? 'd' : 'c');
    }
  }
  function head(g, hc) {
    disc(g, hc[0], hc[1], 7.5, 7, skinFn(7));
    disc(g, hc[0] + 2.5, hc[1] + 4.6, 5.6, 3.3, skinFn(8));      // swollen jowls
    disc(g, hc[0] - 5.6, hc[1] + 1, 1.7, 2.3, () => SKIN[2]);    // ear
    // the tonsure: a lank wet ring of hair round a bald crown
    for (let y = Math.floor(hc[1] - 5); y <= hc[1] + 3; y++) for (let x = Math.floor(hc[0] - 8); x <= hc[0] + 4; x++) {
      const nx = (x + 0.5 - hc[0]) / 7.5, ny = (y + 0.5 - hc[1]) / 7;
      const d = Math.hypot(nx, ny);
      if (d > 1 || d < 0.55 || ny < -0.55 || ny > 0.3 || nx > 0.1) continue;
      g.px(x, y, ny > 0 ? '3' : '4');
    }
    for (const [sx, len] of [[-7, 5], [-5, 6], [-3, 3]]) {
      for (let i = 0; i < len; i++) g.px(Math.round(hc[0] + sx + (i > 3 ? -1 : 0)), Math.round(hc[1] + 2 + i), i % 2 ? '3' : '4');
    }
    // the nose, turned toward whoever is late
    g.px(Math.round(hc[0] + 7), Math.round(hc[1] + 1), SKIN[1]);
    g.px(Math.round(hc[0] + 8), Math.round(hc[1] + 2), SKIN[2]);
    g.px(Math.round(hc[0] + 7), Math.round(hc[1] + 2), SKIN[2]);
  }
  function face(g, hc, p) {
    const ey = Math.round(hc[1] - 1 + (p.look > 0 ? 1 : p.look < 0 ? -1 : 0));
    const x0 = Math.round(hc[0]);
    for (const ex of [x0 + 1, x0 + 5]) {
      g.px(ex, ey - 1, 'N'); g.px(ex + 1, ey - 1, 'N');
      g.px(ex, ey, '1'); g.px(ex + 1, ey, '1');
      g.px(ex, ey + 1, '2'); g.px(ex + 1, ey + 1, 'u');
      g.px(ex + 1, ey, p.eyes === 0 ? 'v' : 'y');
      if (p.eyes === 2) g.px(ex, ey, 'x');
    }
    const mx = x0 + 3, my = Math.round(hc[1] + 4 + (p.look > 0 ? 1 : 0));
    if (p.mouth === 0) { g.px(mx, my, '1'); g.px(mx + 1, my, '1'); g.px(mx + 2, my, '2'); }
    else if (p.mouth === 1) { g.rect(mx, my - 1, 3, 2, '0'); g.px(mx + 1, my + 1, '1'); }
    else { g.rect(mx, my - 1, 3, 3, '0'); g.px(mx + 1, my, 'r'); g.px(mx - 1, my, '1'); g.px(mx + 1, my + 2, '1'); g.px(mx + 2, my + 3, 'w'); }
  }
  function weeds(g, R) {
    const W = ['B', 'C', 'A', 'E', 'C'];
    [[-15, 27, 7], [-10, 30, 4], [14, 27, 6], [9, 30, 3], [-18, 45, 5], [17, 44, 6]].forEach(([x, y, len], k) => {
      const q = R([x, y]);
      for (let i = 0; i < len; i++) g.px(Math.round(q[0] + (i > 2 ? (k % 2 ? 1 : -1) : 0)), Math.round(q[1] + i), W[(i + k) % 5]);
    });
  }
  function ringLines(g, p, F) {
    const C = F.at(0, BELL_H * 0.62);
    const radii = p.ring >= 2 ? [21, 26] : [22];
    radii.forEach((r, ri) => {
      for (let a = -0.85; a <= 0.86; a += 0.09) {
        if (Math.floor((a + 1) * 11) % 4 === 3) continue;
        for (const side of [0, Math.PI]) {
          const x = Math.round(C[0] + Math.cos(a + side) * r), y = Math.round(C[1] + Math.sin(a + side) * r * 0.85);
          if (!g.get(x, y)) g.px(x, y, ri === 0 ? 'y' : 'x');
        }
      }
    });
  }
  function drips(g, R, p) {
    [[-16, 71], [-8, 72], [7, 72], [15, 71], [-5, 74], [6, 75], [-16, 60], [16, 60]].forEach(([x, y], k) => {
      const q = R([x, y - p.feetUp]);
      const off = (p.drip * 2 + k * 3) % 7;
      const xx = Math.round(q[0]), yy = Math.round(q[1]) + off;
      if (p.clip != null && yy >= p.clip - 1) return;
      if (!g.get(xx, yy)) g.px(xx, yy, 'w');
      if (off > 1 && !g.get(xx, yy - 1)) g.px(xx, yy - 1, 'v');
    });
  }
  // cut the figure at the ground (the bell driven into the floor, or the body going down into the water)
  function clipGround(g, p) {
    const cy = p.clip;
    let minX = 99, maxX = -1;
    for (let x = 0; x < FW; x++) if (g.get(x, cy - 1)) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
    for (let y = cy; y < FH; y++) for (let x = 0; x < FW; x++) g.px(x, y, null);
    if (maxX < 0) return;
    for (let x = minX; x <= maxX; x++) { const c = g.get(x, cy - 1); if (c && c !== '0') g.px(x, cy - 1, '1'); }
    const mx = (minX + maxX) / 2, rx = (maxX - minX) / 2 + 4;
    if (p.ground === 'water') {
      for (const [r, ry, dash] of [[rx, 2, 0], [rx + 5, 3, 3]]) {
        for (let i = 0; i < 72; i++) {
          if (dash && i % dash === 0) continue;
          const a = (i / 72) * Math.PI * 2;
          const x = Math.round(mx + Math.cos(a) * r), y = Math.round(cy - 1 + Math.sin(a) * ry);
          if (y >= FH || x < 0 || x >= FW) continue;
          if (Math.sin(a) > 0) g.px(x, y, dash ? 'v' : (i % 5 === 0 ? 'x' : 'w'));
          else if (!g.get(x, y)) g.px(x, y, dash ? 'u' : 'v');
        }
      }
      return;
    }
    // stone: the floor split under the bell
    const cr = [[minX, cy - 1, minX - 8, cy + 1, minX - 13, cy], [maxX, cy - 1, maxX + 8, cy + 2, maxX + 11, cy + 1],
      [mx - 6, cy, mx - 9, cy + 2, mx - 12, cy + 2], [mx + 5, cy, mx + 8, cy + 2, mx + 9, cy + 2]];
    for (const [x0, y0, x1, y1, x2, y2] of cr) {
      g.line(Math.round(x0), y0, Math.round(x1), y1, '1');
      g.line(Math.round(x1), y1, Math.round(x2), y2, '1');
      g.px(Math.round(x1), y1 + 1, '3');
    }
    const R2 = g.rnd(71);
    for (let i = 0; i < 9; i++) {
      const x = Math.round(R2() < 0.5 ? minX - 2 - R2() * 9 : maxX + 2 + R2() * 9), y = cy - 1 + Math.floor(R2() * 3);
      if (!g.get(x, y)) g.px(x, y, R2() < 0.5 ? '5' : '4');
    }
    for (let i = 0; i < 6; i++) {
      const x = Math.round(minX - 1 + R2() * (maxX - minX + 2)), y = cy + Math.floor(R2() * 2);
      if (!g.get(x, y)) g.px(x, y, 'v');
    }
  }
  function splash(g, p) {
    const cy = p.clip || OY;
    for (const s of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        const x = OX + s * (19 + i * 1.4), y = cy - 3 - Math.round(Math.sin((i / 7) * Math.PI) * 7);
        if (!g.get(Math.round(x), y)) g.px(Math.round(x), y, i % 3 === 0 ? 'x' : 'w');
        if (i % 2 === 0 && !g.get(Math.round(x), y + 2)) g.px(Math.round(x), y + 2, 'v');
      }
    }
  }

  // ---------------------------------------------------------------- the whole abbot
  function drawHollin(g, p) {
    const bx = OX + p.dx, by = p.dy;
    const R = (q) => [bx + q[0], by + q[1]];
    const hands = p.ha.map(R), elbows = p.el.map(R), shoulders = p.sh.map(R);
    let hc = R(p.head);
    if (p.look > 0) hc = [hc[0] + 1, hc[1] + 2]; else if (p.look < 0) hc = [hc[0], hc[1] - 1];
    const F = bellFrame(p, bx, by);

    drawRopes(g, p, bx, by, hands);
    disc(g, hc[0] - 2, hc[1] + 1.5, 9.5, 8.5, robeFn(3, 1));          // the cowl, fallen back
    robeBack(g, bx, by, p);
    legs(g, R, p);
    disc(g, bx, by + 35, 15, 9.5, skinFn(1));                          // the bloated chest
    for (const s of shoulders) disc(g, s[0], s[1], 6, 5, robeFn(4));
    disc(g, bx + 1, by + 28.5, 11, 3.5, robeFn(5));                    // collar of the habit
    bellShape(g, F, 'rim');
    bellShape(g, F, 'body');
    bellMouth(g, p, F);
    if (p.cracks) bellCracks(g, p, F);
    ribs(g, bx, by);
    for (let i = 0; i < 2; i++) arm(g, shoulders[i], elbows[i], hands[i], i);
    head(g, hc);

    g.outline('0');

    face(g, hc, p);
    weeds(g, R);
    if (p.clip != null) clipGround(g, p);
    if (p.ring) ringLines(g, p, F);
    drips(g, R, p);
    if (p.splash) splash(g, p);
  }

  // ---------------------------------------------------------------- poses
  function base(i, cr) {
    return {
      dx: 0, dy: 0,
      sh: [[-12, 29], [12, 29]], el: [[-12, 17], [11, 15]], ha: [[-1, 12], [1, 7]],
      rope: 'grip', split: [0, 4], head: [2, 22], look: 0, mouth: 0, eyes: 1,
      tilt: 0, clap: 0, glow: 0, ring: 0, feetUp: 0, clip: null, ground: null, splash: 0,
      cracks: cr ? 1 : 0, drip: i || 0,
    };
  }
  const POSES = {
    // hanging still from the rope; only the bell sways in him
    drift(i, cr) {
      const p = base(i, cr);
      p.dy = [0, 0, 1, 1][i]; p.tilt = [-0.05, 0, 0.05, 0][i]; p.clap = [-2, 0, 2, 0][i];
      return p;
    },
    // TOLL wind-up: arms stretched high on the rope, head thrown back, the bell gathering light
    windup(i, cr) {
      const p = base(i, cr);
      p.ha = [[0, 7], [1, 2]]; p.el = [[-11, 13], [10, 11]]; p.sh = [[-12, 28], [12, 28]];
      p.look = -1; p.mouth = 1; p.eyes = 2; p.glow = 1 + i; p.tilt = -0.1; p.clap = -3; p.dx = i;
      return p;
    },
    // the stroke: both strands hauled down, elbows flared, the bell swung and ringing
    toll(i, cr) {
      const p = base(i, cr);
      p.rope = 'split'; p.split = [0, 5];
      p.ha = [[-17, 22 - i * 2], [17, 20 - i * 2]]; p.el = [[-20, 30], [20, 29]];
      p.dy = i > 1 ? 1 : 2; p.mouth = 2; p.glow = 3 - i; p.ring = i < 2 ? 2 - i : 0;
      p.tilt = [0.12, 0.06, 0.02][i]; p.clap = [4, 3, 1][i];
      return p;
    },
    // WATER TENDRILS: arms out, palms to the floor, calling the water up
    spread(i, cr) {
      const p = base(i, cr);
      p.rope = 'split'; p.split = [0, 3];
      p.ha = [[-26, 37 + i], [26, 35 + i]]; p.el = [[-20, 29], [20, 28]];
      p.look = 1; p.glow = 1; p.mouth = 1; p.clap = i ? 1 : -1;
      return p;
    },
    cast(i, cr) {
      const p = base(i, cr);
      p.rope = 'split'; p.split = [0, 3];
      p.ha = [[-19, 52], [19, 50]]; p.el = [[-19, 40], [19, 39]];
      p.dy = 1 + i; p.look = 1; p.mouth = 2; p.glow = 2 - i;
      return p;
    },
    // BELL SLAM: climbing the rope, knees drawn up
    rise(i, cr) {
      const p = base(i, cr);
      p.ha = [[1, 7], [0, 2]]; p.el = [[-9, 13], [9, 11]];
      p.dy = -3; p.feetUp = 5; p.dx = i ? 1 : -1; p.look = -1; p.mouth = 1; p.eyes = 2;
      return p;
    },
    slam(i, cr) {
      const p = base(i, cr);
      p.rope = 'split'; p.split = [0, 3];
      p.ha = [[-14, 6], [14, 5]]; p.el = [[-16, 17], [16, 16]];
      p.dy = 19; p.clip = OY; p.ground = 'stone'; p.splash = i === 0 ? 1 : 0;
      p.mouth = 2; p.glow = i ? 1 : 2; p.ring = i ? 0 : 1;
      return p;
    },
    // stuck: the lip of the bell driven into the floor, him slumped over it, hauling at the rim
    stuck(i, cr) {
      const p = base(i, cr);
      p.rope = 'slack'; p.split = [0, 2];
      p.dy = 21 - i; p.tilt = 0.14; p.head = [4, 25]; p.look = 1;
      p.ha = [[-18, 53 - i], [18, 52 - i]]; p.el = [[-17, 40], [17, 40]];
      p.clip = OY; p.ground = 'stone'; p.mouth = i; p.clap = 2;
      return p;
    },
    // calling the children: one fist on the rope, the other arm flung out toward the stair
    call(i, cr) {
      const p = base(i, cr);
      p.rope = 'split'; p.split = [0, 4];
      p.ha = [[-2, 9], [27, 15 + i]]; p.el = [[-12, 16], [19, 22]];
      p.head = [3, 22]; p.mouth = 2; p.glow = 1; p.eyes = 2;
      return p;
    },
    hurt(i, cr) {
      const p = base(i, cr);
      p.dx = i ? 1 : -1; p.look = -1; p.mouth = 1; p.eyes = 2; p.tilt = -0.07; p.clap = -2;
      p.ha = [[-1, 11], [1, 6]];
      return p;
    },
  };
  // death: he stops ringing (0-5), one clean toll (6-7), he lets go and sinks (8-15)
  const SINK = [4, 10, 17, 25, 34, 44, 55, 66];
  function diePose(i) {
    const p = base(i, true);
    if (i <= 5) { p.ha = [[-1, 14], [1, 10]]; p.el = [[-13, 21], [12, 19]]; p.look = 1; p.eyes = 0; }
    else if (i === 6) { p.ha = [[-1, 13], [1, 9]]; p.el = [[-13, 20], [12, 18]]; p.glow = 2; p.ring = 2; p.clap = 3; p.mouth = 1; p.tilt = 0.05; }
    else if (i === 7) { p.ha = [[-1, 14], [1, 10]]; p.el = [[-13, 21], [12, 19]]; p.glow = 1; p.ring = 1; p.clap = 1; p.look = 1; p.eyes = 0; }
    else {
      p.rope = 'free'; p.ha = [[-10, 6], [11, 4]]; p.el = [[-15, 17], [15, 16]];
      p.look = 1; p.eyes = 0; p.dy = SINK[i - 8]; p.clip = OY - 1; p.ground = 'water';
    }
    return p;
  }

  // ---------------------------------------------------------------- sheet
  const ANIMS = {
    drift: [4, 3, true], windup: [2, 8, true], toll: [3, 10, false], spread: [2, 6, true], cast: [2, 8, false],
    rise: [2, 8, true], slam: [2, 8, false], stuck: [2, 3, true], call: [2, 6, true], hurt: [2, 12, true],
  };
  const anims = {
    idle: { fps: 3, count: 4, draw(g, i) { drawHollin(g, POSES.drift(i, false)); } },
    die: { fps: 4, count: 16, loop: false, draw(g, i) { drawHollin(g, diePose(i)); } },
  };
  Object.keys(ANIMS).forEach((name) => {
    const [count, fps, loop] = ANIMS[name];
    [false, true].forEach((cr) => {
      anims[name + (cr ? '_x' : '')] = { fps, count, loop, draw(g, i) { drawHollin(g, POSES[name](i, cr)); } };
    });
  });
  AV.art.sheet('boss_hollin', { w: FW, h: FH, ox: OX, oy: OY, anims });

  // ================================================================ BEHAVIOUR
  const CYAN = '#b9d6d3', PALE = '#e4f4ef', TEAL = '#82a8ad', DEEP = '#537a86', NIGHT = '#0c1219';
  const TOLL_MAX = 124;
  const SLAM_T = 1.0;
  const MUTTER = ['Up. Everyone up.', 'Not the lower cells—', 'Who opened the—', 'Anselm. Leave the books.', 'Keep ringing. Keep—', 'Count them. Count them in.'];

  // ---- hazard / effect entities (built lazily so load order never matters)
  let Spike = null, Ring = null, Jagged = null;
  function classes() {
    if (Spike) return;
    // a spike of black water that stands up out of the floor and falls back
    Spike = class extends AV.Entity {
      constructor(world, x, y) {
        super(null, world);
        this.x = x; this.y = y; this.t = 0; this.life = 0.55;
        this.hmax = U.rand(13, 19); this.wid = 3; this.summoned = true;
      }
      update(dt) { this.t += dt; if (this.t >= this.life) this.gone = true; }
      draw(ctx, cam) {
        const t = this.t;
        const k = t < 0.07 ? t / 0.07 : t < 0.26 ? 1 : Math.max(0, 1 - (t - 0.26) / 0.24);
        const H = Math.round(this.hmax * k);
        const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
        const a0 = ctx.globalAlpha;
        ctx.globalAlpha = a0 * (t > 0.4 ? Math.max(0, 1 - (t - 0.4) / 0.15) : 1);
        ctx.fillStyle = DEEP; ctx.fillRect(x - 5, y - 1, 11, 2);
        ctx.fillStyle = TEAL; ctx.fillRect(x - 3, y - 1, 7, 1);
        if (H > 0) {
          ctx.fillStyle = NIGHT;
          for (let i = 0; i < H; i++) { const w = Math.round((1 - i / H) * this.wid); ctx.fillRect(x - w - 1, y - i - 1, w * 2 + 3, 1); }
          ctx.fillRect(x, y - H - 1, 1, 1);
          for (let i = 0; i < H; i++) {
            const w = Math.round((1 - i / H) * this.wid);
            ctx.fillStyle = DEEP; ctx.fillRect(x - w, y - i - 1, w * 2 + 1, 1);
            ctx.fillStyle = i > H - 4 ? PALE : CYAN; ctx.fillRect(x + (w > 1 ? 1 : 0), y - i - 1, 1, 1);
          }
        }
        ctx.globalAlpha = a0;
      }
    };
    // a harmless ring of sound on the water
    Ring = class extends AV.Entity {
      constructor(world, o) {
        super(null, world);
        this.x = o.x; this.y = o.y; this.r = o.r0 || 4; this.speed = o.speed || 120; this.max = o.max || 100;
        this.color = o.color || PALE; this.flat = true; this.summoned = true;
      }
      update(dt) { this.r += this.speed * dt; if (this.r >= this.max) this.gone = true; }
      draw(ctx, cam) {
        const k = this.r / this.max;
        const a0 = ctx.globalAlpha;
        ctx.globalAlpha = a0 * 0.7 * (1 - k);
        ctx.strokeStyle = this.color; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(Math.round(this.x - cam.x), Math.round(this.y - cam.y), this.r, this.r * 0.62, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = a0;
      }
    };
    // the cracked bell's tolls: the same rolling ring of force, but broken-edged
    Jagged = class extends AV.combat.Shockwave {
      constructor(opts, world) { super(opts, world); this.seed = Math.floor(Math.random() * 97); }
      draw(ctx, cam) {
        const k = this.r / this.max;
        const cx = Math.round(this.x - cam.x), cy = Math.round(this.y - cam.y);
        const a0 = ctx.globalAlpha;
        ctx.globalAlpha = a0 * 0.85 * (1 - k * 0.8);
        for (const [off, col, lw] of [[0, this.color, 2], [-this.thick + 2, DEEP, 1]]) {
          const r = this.r + off;
          if (r <= 1) continue;
          ctx.strokeStyle = col; ctx.lineWidth = lw;
          ctx.beginPath();
          const n = 36;
          for (let i = 0; i <= n; i++) {
            const a = (i / n) * Math.PI * 2, ii = i % n;
            const j = (((ii * 7 + this.seed) % 5) - 2) * 1.3;
            const rr = r + (ii % 2 ? j : -Math.abs(j) * 0.6);
            const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.62;
            if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
          }
          ctx.stroke();
        }
        ctx.lineWidth = 1;
        ctx.globalAlpha = a0;
      }
    };
  }

  // ---- helpers
  function setAnim(b, name, restart) {
    const n = b.data.cracked && name !== 'idle' ? name + '_x' : name;
    if (restart || b.anim !== n) { b.anim = n; b.animT = 0; }
  }
  function bark(b, text) { AV.fx.text(b.x, b.y - (b.z || 0) - 84, text, { color: CYAN, life: 2.8, rise: 6 }); }
  function mutter(b) {
    const D = b.data;
    let i = Math.floor(Math.random() * MUTTER.length);
    if (i === D.lastBark) i = (i + 1) % MUTTER.length;
    D.lastBark = i; D.barkCool = U.rand(14, 20);
    bark(b, MUTTER[i]);
  }
  function bellPos(b) { return { x: b.x, y: b.y - (b.z || 0) - 31 }; }
  function later(b, t, fn) { b.data.q.push({ at: b.data.clock + t, fn }); }
  function arenaBox(b, m) {
    const A = b.arena;
    if (!A) return { x0: b.home.x - 200, x1: b.home.x + 200, y0: b.home.y - 120, y1: b.home.y + 120 };
    return { x0: A.x + m, x1: A.x + A.w - m, y0: A.y + m + 22, y1: A.y + A.h - m * 0.5 - 4 };
  }
  const inBox = (B, x, y) => x >= B.x0 && x <= B.x1 && y >= B.y0 && y <= B.y1;
  const clampBox = (B, x, y) => [U.clamp(x, B.x0, B.x1), U.clamp(y, B.y0, B.y1)];
  function novices(b) {
    let n = 0;
    for (const e of b.world.entities) if (e.kind === 'novice' && e.summoned && !e.dead && !e.gone) n++;
    return n;
  }
  function recover(b, t) { b.data.rec = t; b.go('recover'); }
  function jagged(b, o) { classes(); return b.world.add(new Jagged(Object.assign({ team: 'enemy', owner: b, dmg: b.dmg }, o), b.world)); }
  function initData(b) {
    const D = b.data;
    if (D.ready) return;
    Object.assign(D, { ready: true, clock: 0, q: [], side: Math.random() < 0.5 ? -1 : 1, pause: 0.9, rec: 0.5,
      callCool: 0, barkCool: 8, humT: 2, dripT: 0, cracked: false, crackPending: false, h1: null, h2: null });
  }

  // ---- ambient: the bob, the drip, the bell that never quite stops
  function ambient(b, dt) {
    const D = b.data;
    if (b.state !== 'slam') b.z = U.approach(b.z || 0, 4 + Math.sin(D.clock * 1.7) * 1.6, 40 * dt);
    if (b.light) b.light.intensity = U.approach(b.light.intensity, D.cracked ? 0.7 : 0.55, 0.9 * dt);
    D.dripT -= dt;
    if (D.dripT <= 0) {
      D.dripT = U.rand(0.08, 0.22);
      AV.fx.spawn({ x: b.x + U.rand(-16, 16), y: b.y - (b.z || 0) - U.rand(4, 18), vx: 0, vy: 10, g: 220, life: 0.35, color: U.pick([TEAL, DEEP, CYAN]), alpha: 0.8 });
    }
    if (b.state === 'idle' || b.state === 'recover') {
      D.humT -= dt;
      if (D.humT <= 0) { D.humT = U.rand(3.5, 6); b.sfx('bell', { pitch: D.cracked ? U.rand(0.42, 0.62) : 0.5, vol: 0.14 }); }
    }
  }

  function drift(b, dt, want) {
    const P = b.P;
    if (!P) return;
    const D = b.data, d = b.dist(), a = b.angleTo();
    let ang = a, sp;
    if (d > want + 16) sp = b.speed;
    else if (d < want - 22) { ang = a + Math.PI; sp = b.speed * 0.6; }
    else { ang = a + (Math.PI / 2) * D.side; sp = b.speed * 0.3; }
    const B = arenaBox(b, 24);
    if (!inBox(B, b.x + Math.cos(ang) * sp * 0.4, b.y + Math.sin(ang) * sp * 0.4)) { D.side = -D.side; if (d < want) { b.faceTarget(); return; } }
    b.move(ang, sp, dt);
    const c = clampBox(B, b.x, b.y);
    b.x = c[0]; b.y = c[1];
    b.faceTarget();
  }

  // ---- choosing: by distance and phase, never the same family three times running
  const FAMILY = { toll: 'toll', multi: 'toll', tendril: 'tendril', slam: 'slam', call: 'call' };
  function choose(b) {
    const D = b.data, d = b.dist(), p2 = D.cracked;
    const w = {
      toll: d < 125 ? 2.6 : 1,
      multi: (d < 135 ? 2.2 : 0.8) + (p2 ? 0.8 : 0),
      tendril: d > 55 ? 2.8 : 0.9,
      slam: d < 100 ? 2.6 : 1.2,
      call: p2 && D.callCool <= 0 && novices(b) < 2 ? 4.5 : 0,
    };
    if (D.h1 && D.h1 === D.h2) for (const k in w) if (FAMILY[k] === D.h1) w[k] = 0;
    let sum = 0;
    for (const k in w) sum += w[k];
    let r = Math.random() * sum;
    for (const k in w) { if (w[k] <= 0) continue; r -= w[k]; if (r <= 0) return k; }
    return D.h1 === 'tendril' ? 'toll' : 'tendril';
  }
  function begin(b, id) {
    const D = b.data;
    D.h2 = D.h1; D.h1 = FAMILY[id];
    if (id === 'toll') startToll(b, 1);
    else if (id === 'multi') startToll(b, D.cracked ? U.pick([2, 3, 3]) : U.pick([2, 2, 3]));
    else if (id === 'tendril') startTendril(b);
    else if (id === 'slam') startSlam(b);
    else startCall(b);
  }

  // ---- TOLL / DOUBLE / TRIPLE (phase 2: erratic paired rings and jagged doubles)
  function startToll(b, n) {
    const D = b.data;
    D.n = n; D.k = 0; D.next = 0.8; D.tollAt = -9;
    b.faceTarget();
    b.go('toll');
    setAnim(b, 'windup', true);
    b.telegraph({ shape: 'circle', x: b.x, y: b.y, r: TOLL_MAX * 0.72, life: 0.8, color: CYAN });
    b.sfx('bell', { pitch: 0.45, vol: 0.28 });
    if (D.barkCool <= 0 && Math.random() < 0.35) mutter(b);
  }
  function emitToll(b) {
    const D = b.data, x = b.x, y = b.y, bp = bellPos(b);
    if (!D.cracked) {
      b.shockwave({ x, y, r0: 10, speed: 95, max: TOLL_MAX, thick: 9, knock: 150, color: CYAN });
      b.sfx('bell_big', { vol: 0.8, pitch: 0.9 });
    } else if (Math.random() < 0.5) {
      // two notes at once from a split bell: a fast thin ring and a slow heavy one
      jagged(b, { x, y, r0: 10, speed: 150, max: 132, thick: 7, knock: 150, color: PALE });
      jagged(b, { x, y, r0: 8, speed: 62, max: 104, thick: 10, knock: 150, color: TEAL });
      b.sfx('bell_big', { vol: 0.8, pitch: 0.72 });
      b.sfx('bell', { vol: 0.5, pitch: 1.35 });
    } else {
      // a double stroke: two jagged rings close together (one roll carries you through both)
      jagged(b, { x, y, r0: 10, speed: 100, max: TOLL_MAX, thick: 8, knock: 150, color: PALE });
      later(b, 0.13, () => {
        jagged(b, { x, y, r0: 10, speed: 100, max: TOLL_MAX - 6, thick: 8, knock: 150, color: CYAN });
        b.sfx('bell_big', { vol: 0.55, pitch: 0.66 });
      });
      b.sfx('bell_big', { vol: 0.8, pitch: 0.78 });
    }
    AV.fx.shake(2.5, 0.2);
    AV.fx.burst(bp.x, bp.y + 10, 12, { color: [CYAN, PALE, TEAL], speed: 55, life: 0.45, glow: true });
    if (b.light) b.light.intensity = 1.35;
  }
  function stToll(b) {
    const D = b.data;
    if (D.k < D.n && b.st >= D.next) {
      emitToll(b);
      D.k++; D.tollAt = b.st;
      setAnim(b, 'toll', true);
      if (D.k < D.n) {
        const gap = D.cracked ? U.rand(0.5, 0.8) : 0.62;
        D.next = b.st + gap;
        b.telegraph({ shape: 'circle', x: b.x, y: b.y, r: TOLL_MAX * 0.5, life: gap, color: D.cracked ? PALE : CYAN });
      }
    }
    const since = b.st - D.tollAt;
    if (since < 0.32) setAnim(b, 'toll');
    else if (D.k < D.n) {
      setAnim(b, 'windup');
      const k = 1 - (D.next - b.st) / (D.k === 0 ? 0.8 : 0.6);
      if (b.light) b.light.intensity = Math.max(b.light.intensity, 0.55 + 0.7 * U.clamp(k, 0, 1));
      if (Math.random() < 0.5) {
        const bp = bellPos(b);
        AV.fx.spawn({ x: bp.x + U.rand(-12, 12), y: bp.y + U.rand(-6, 14), vx: 0, vy: -U.rand(8, 20), life: 0.5, color: U.pick([CYAN, PALE]), glow: true });
      }
    } else recover(b, D.cracked ? 0.75 : 0.95); // hanging, ringing out: punish window
  }

  // ---- WATER TENDRILS: marked lines, then spikes of water rising along them, near to far
  const SPIKE_STEP = 12, SPIKE_N = 13;
  function lineOrigin(b, a) { return [b.x + Math.cos(a) * 10, b.y + Math.sin(a) * 6]; }
  function spikeOk(b, x, y) {
    const A = b.arena;
    if (A && (x < A.x + 4 || x > A.x + A.w - 4 || y < A.y + 6 || y > A.y + A.h - 2)) return false;
    return !b.world.rectHitsTiles(x - 2, y - 3, x + 2, y);
  }
  function linePts(b, o, a) {
    const out = [];
    for (let k = 0; k < SPIKE_N; k++) {
      const d = 8 + k * SPIKE_STEP, x = o[0] + Math.cos(a) * d, y = o[1] + Math.sin(a) * d;
      if (!spikeOk(b, x, y)) break;
      out.push([x, y]);
    }
    return out;
  }
  function startTendril(b) {
    const D = b.data, aim = b.angleTo();
    D.vol = D.cracked
      ? [{ at: 0.8, tele: 0.8, angs: [-0.66, -0.22, 0.22, 0.66] }, { at: 1.6, tele: 0.6, angs: [-0.44, 0, 0.44], re: true }]
      : [{ at: 0.8, tele: 0.8, angs: [-0.42, 0, 0.42] }];
    D.vol.forEach((v) => { v.aim = aim; v.shown = false; v.fired = false; });
    b.faceTarget();
    b.go('tendril');
    setAnim(b, 'spread', true);
    b.sfx('splash', { pitch: 0.55, vol: 0.5 });
  }
  function spike(b, x, y, k) {
    b.world.add(new Spike(b.world, x, y));
    b.hitbox({ shape: 'ring', x, y, r: 7, r0: 0, life: 0.16, knock: 120 });
    if (k % 2 === 0) AV.fx.splash(x, y - 2);
    if (k % 4 === 0) b.sfx('splash', { pitch: U.rand(0.9, 1.2), vol: 0.25 });
  }
  function fireLines(b, v) {
    classes();
    for (const da of v.angs) {
      const a = v.aim + da;
      linePts(b, lineOrigin(b, a), a).forEach(([x, y], k) => later(b, k * 0.04, () => spike(b, x, y, k)));
    }
    b.sfx('splash', { pitch: 0.8, vol: 0.7 });
    b.sfx('whoosh', { pitch: 0.55, vol: 0.4 });
    AV.fx.shake(1.5, 0.15);
  }
  function stTendril(b) {
    const D = b.data;
    let pending = false, lastFire = -9;
    for (const v of D.vol) {
      if (!v.shown && b.st >= v.at - v.tele) {
        v.shown = true;
        if (v.re) { v.aim = b.angleTo(); b.faceTarget(); b.sfx('splash', { pitch: 0.7, vol: 0.4 }); }
        for (const da of v.angs) {
          const a = v.aim + da, o = lineOrigin(b, a), pts = linePts(b, o, a);
          if (!pts.length) continue;
          b.telegraph({ shape: 'line', x: o[0], y: o[1], a, len: 16 + (pts.length - 1) * SPIKE_STEP, width: 16, life: Math.max(0.2, v.at - b.st), color: TEAL });
        }
      }
      if (!v.fired && b.st >= v.at) { v.fired = true; fireLines(b, v); }
      if (!v.fired) pending = true; else lastFire = Math.max(lastFire, v.at);
    }
    const since = b.st - lastFire;
    if (since >= 0 && since < 0.5) setAnim(b, 'cast');
    else if (pending) setAnim(b, 'spread');
    if (pending && Math.random() < 0.4) {
      AV.fx.spawn({ x: b.x + U.rand(-20, 20), y: b.y + U.rand(-3, 3), vx: 0, vy: -U.rand(10, 26), g: 80, life: 0.4, color: U.pick([TEAL, CYAN]), alpha: 0.8 });
    }
    if (!pending && since >= 0.55) recover(b, D.cracked ? 0.8 : 1.05);
  }

  // ---- BELL SLAM: marked circle, he climbs the rope and drops the bell on it — then it sticks
  function startSlam(b) {
    const D = b.data;
    const d = Math.min(b.dist(), 84), a = b.angleTo();
    const t = clampBox(arenaBox(b, 28), b.x + Math.cos(a) * d, b.y + Math.sin(a) * d);
    D.from = [b.x, b.y]; D.tgt = t; D.sub = 'rise'; D.freeShown = false;
    D.stuckT = D.cracked ? 1.35 : 1.9;
    b.faceTarget();
    b.go('slam');
    setAnim(b, 'rise', true);
    b.telegraph({ shape: 'circle', x: t[0], y: t[1], r: 30, life: SLAM_T, color: CYAN });
    b.sfx('whoosh', { pitch: 0.5, vol: 0.5 });
    b.sfx('bell', { pitch: 0.4, vol: 0.25 });
  }
  function impact(b) {
    const D = b.data;
    b.x = D.tgt[0]; b.y = D.tgt[1]; b.z = 0;
    D.sub = 'stuck'; D.clunkT = 0.5;
    setAnim(b, 'slam', true);
    b.hitbox({ shape: 'ring', x: b.x, y: b.y, r: 28, r0: 0, life: 0.12, knock: 190 });
    AV.fx.shake(5, 0.35);
    b.sfx('slam', { vol: 0.9, pitch: 0.7 });
    b.sfx('bell_big', { vol: 0.7, pitch: 0.45 });
    classes();
    b.world.add(new Ring(b.world, { x: b.x, y: b.y, r0: 16, speed: 140, max: 60, color: CYAN }));
    for (let i = 0; i < 6; i++) AV.fx.splash(b.x + U.rand(-26, 26), b.y + U.rand(-8, 8));
    if (b.light) b.light.intensity = 1.1;
  }
  function stSlam(b, dt) {
    const D = b.data;
    if (D.sub === 'rise') {
      setAnim(b, 'rise');
      const k = Math.min(1, b.st / SLAM_T);
      const e = smooth(Math.min(1, k / 0.82));
      b.x = U.lerp(D.from[0], D.tgt[0], e); b.y = U.lerp(D.from[1], D.tgt[1], e);
      b.z = k < 0.7 ? 4 + 32 * (k / 0.7) : k < 0.88 ? 36 : 36 * (1 - (k - 0.88) / 0.12);
      if (b.st >= SLAM_T) impact(b);
      return;
    }
    // stuck fast: the punish window
    b.z = 0;
    const s = b.st - SLAM_T;
    if (D.cracked && !D.freeShown && s >= D.stuckT - 0.5) {
      D.freeShown = true;
      b.telegraph({ shape: 'circle', x: b.x, y: b.y, r: 44, life: 0.5, color: PALE });
      b.sfx('bell', { pitch: 0.55, vol: 0.4 });
    }
    if (D.freeShown) setAnim(b, 'rise');
    else setAnim(b, s < 0.3 ? 'slam' : 'stuck');
    D.clunkT -= dt;
    if (D.clunkT <= 0 && !D.freeShown) {
      D.clunkT = U.rand(0.5, 0.8);
      b.sfx('bell', { pitch: 0.36, vol: 0.18 });
      AV.fx.spawn({ x: b.x + U.rand(-14, 14), y: b.y - U.rand(0, 4), vx: 0, vy: -14, life: 0.5, color: CYAN, alpha: 0.7 });
    }
    if (s >= D.stuckT) {
      if (D.cracked) {
        b.shockwave({ x: b.x, y: b.y, r0: 14, speed: 100, max: 50, thick: 8, knock: 150, color: PALE });
        b.sfx('bell_big', { pitch: 0.6, vol: 0.5 });
      }
      b.sfx('break_wall', { vol: 0.35, pitch: 1.2 });
      AV.fx.burst(b.x, b.y - 2, 10, { color: ['#655c69', '#857c86', '#4a4250'], speed: 50, up: 30, g: 200, life: 0.5 });
      recover(b, 0.35);
    }
  }

  // ---- (phase 2) he calls the drowned novices up the stair
  function startCall(b) {
    const D = b.data;
    const n = Math.max(1, 2 - novices(b));
    const B = arenaBox(b, 20);
    D.pts = [];
    for (let i = 0; i < n; i++) {
      for (let tries = 0; tries < 12; tries++) {
        const a = U.rand(0, Math.PI * 2), r = U.rand(42, 76);
        const x = b.x + Math.cos(a) * r, y = b.y + Math.sin(a) * r * 0.7;
        if (!inBox(B, x, y) || b.world.rectHitsTiles(x - 5, y - 6, x + 5, y)) continue;
        if (b.P && U.dist(x, y, b.P.x, b.P.y) < 26) continue;
        D.pts.push([x, y]);
        break;
      }
    }
    D.spawned = false;
    b.faceTarget();
    b.go('call');
    setAnim(b, 'call', true);
    bark(b, D.called ? U.pick(['Up the stair. Quickly now.', "Don't dawdle. Up.", 'Hands on the rail. Up.']) : 'Children, the high dormitory—');
    D.called = true; D.barkCool = Math.max(D.barkCool, 10);
    b.sfx('whisper', { pitch: 0.7, vol: 0.5 });
    for (const [x, y] of D.pts) b.telegraph({ shape: 'circle', x, y, r: 11, life: 0.9, color: TEAL });
  }
  function stCall(b) {
    const D = b.data;
    setAnim(b, 'call');
    if (!D.spawned) {
      for (const [x, y] of D.pts) if (Math.random() < 0.3) AV.fx.spawn({ x: x + U.rand(-6, 6), y: y - 1, vx: U.rand(-4, 4), vy: -3, life: 0.5, color: U.pick([TEAL, CYAN]), alpha: 0.7 });
      if (b.st >= 0.9) {
        D.spawned = true; D.callCool = 15;
        for (const [x, y] of D.pts) { b.spawn('novice', x, y); AV.fx.splash(x, y); AV.fx.splash(x + 3, y - 2); }
        b.sfx('splash', { pitch: 0.9, vol: 0.6 });
      }
    }
    if (b.st >= 1.35) recover(b, 0.5);
  }

  // ---- the bell cracks
  function stCrack(b) {
    setAnim(b, 'hurt');
    if (Math.random() < 0.3) {
      const bp = bellPos(b);
      AV.fx.spawn({ x: bp.x + U.rand(-10, 10), y: bp.y + U.rand(-8, 10), vx: U.rand(-20, 20), vy: -U.rand(10, 30), life: 0.6, color: U.pick([PALE, CYAN]), glow: true });
    }
    if (b.st >= 1.25) recover(b, 0.25);
  }
  function stIdle(b, dt) {
    const D = b.data;
    setAnim(b, 'drift');
    drift(b, dt, D.cracked ? 58 : 66);
    if (b.st < D.pause) return;
    if (D.crackPending) { D.crackPending = false; b.go('crack'); return; }
    begin(b, choose(b));
  }

  // ---------------------------------------------------------------- the definition
  AV.data.bosses.boss_hollin = {
    name: 'HOLLIN, WHO RANG THE FLOOD', title: 'Abbot of Lenten Mere',
    sprite: 'boss_hollin', hp: 110, dmg: 2, speed: 24, music: 'boss',
    w: 26, h: 10, hurt: { w: 32, h: 58 }, weight: 10, shadow: 14,
    light: { r: 56, color: '#82a8ad', intensity: 0.55, oy: -40 },
    phases: [0.5],
    introTime: 1.6, introAnim: 'drift',
    idleSprite: 'boss_hollin', idleAnim: 'drift',

    onStart(b) { initData(b); b.z = 4; },
    introUpdate(b) {
      const D = b.data;
      if (!D.introRung) {
        D.introRung = true;
        b.sfx('bell_big', { vol: 0.7, pitch: 0.85 });
        classes();
        b.world.add(new Ring(b.world, { x: b.x, y: b.y, r0: 10, speed: 90, max: 150, color: CYAN }));
      }
    },

    brain(b, dt) {
      const D = b.data;
      if (!D.ready) initData(b);
      D.clock += dt;
      for (let i = D.q.length - 1; i >= 0; i--) if (D.q[i].at <= D.clock) { const f = D.q[i].fn; D.q.splice(i, 1); f(); }
      D.callCool -= dt; D.barkCool -= dt;
      ambient(b, dt);
      switch (b.state) {
        case 'start':
          b.go('idle'); D.pause = 0.9;
          bark(b, "Late. You're late. Up the stair—"); D.barkCool = 12;
          break;
        case 'idle': stIdle(b, dt); break;
        case 'toll': stToll(b); break;
        case 'tendril': stTendril(b); break;
        case 'slam': stSlam(b, dt); break;
        case 'call': stCall(b); break;
        case 'crack': stCrack(b); break;
        case 'recover':
          setAnim(b, 'drift');
          if (b.st >= D.rec) { b.go('idle'); D.pause = D.cracked ? U.rand(0.5, 0.9) : U.rand(0.85, 1.3); }
          break;
        default: b.go('idle');
      }
    },

    onPhase(b, phase) {
      if (phase !== 2) return;
      const D = b.data;
      if (!D.ready) initData(b);
      D.cracked = true; D.callCool = 2.5;
      const bp = bellPos(b);
      b.sfx('bell_big', { vol: 1, pitch: 0.55 });
      b.sfx('break_wall', { vol: 0.6, pitch: 0.8 });
      AV.fx.flash('#b9d6d3', 0.18);
      AV.fx.burst(bp.x, bp.y, 18, { color: ['#a88a48', '#d4b96a', '#7a6230', '#537a86'], speed: 90, up: 40, g: 220, life: 0.8 });
      AV.fx.ghostly(bp.x, bp.y, 10);
      bark(b, 'The water— ring— RING—'); D.barkCool = 12;
      if (b.state === 'idle' || b.state === 'recover') b.go('crack');
      else { D.crackPending = true; setAnim(b, (b.anim || 'drift').replace(/_x$/, '')); }
    },

    // death: he stops ringing; one clean toll; he sinks
    deathTime: 4.6,
    onDeath(b) {
      const D = b.data;
      D.dz = b.z || 0; D.clean = false; D.sank = false;
      // Boss.die() empties combat.hits from inside combat.update's loop (the killing blow is resolved there);
      // with his rings/spikes alive the loop would step onto undefined entries. Pad it with inert, instantly
      // expiring entries so the rest of that loop has something harmless to walk over.
      const H = AV.combat.hits;
      if (H && H.length === 0) for (let i = 0; i < 128; i++) H.push({ shape: 'none', team: 'enemy', t: 0, life: 0, dmg: 0, hitSet: new Set() });
    },
    deathUpdate(b) {
      const D = b.data, t = b.deathT;
      b.z = (D.dz || 0) * Math.max(0, 1 - t / 1.2);
      if (b.light) b.light.intensity = t < 1.5 ? 0.25 : t < 1.9 ? 1.2 - (t - 1.5) * 1.5 : Math.max(0, 0.6 - (t - 1.9) * 0.25);
      if (t < 1.5 && Math.random() < 0.12) AV.fx.spawn({ x: b.x + U.rand(-14, 14), y: b.y - (b.z || 0) - U.rand(4, 16), vx: 0, vy: 8, g: 220, life: 0.35, color: TEAL, alpha: 0.8 });
      if (!D.clean && t >= 1.5) {
        D.clean = true;
        b.sfx('bell_big', { vol: 1, pitch: 1 });
        classes();
        b.world.add(new Ring(b.world, { x: b.x, y: b.y, r0: 12, speed: 110, max: 200, color: PALE }));
        AV.fx.flash('#e4f4ef', 0.2);
        AV.fx.ghostly(b.x, b.y - 46, 12);
      }
      if (t >= 2 && !D.sank) { D.sank = true; b.sfx('splash', { pitch: 0.5, vol: 0.8 }); }
      if (t > 2 && t < 4 && Math.random() < 0.3) AV.fx.splash(b.x + U.rand(-14, 14), b.y + U.rand(-2, 2));
      b.alpha = t > 4.1 ? Math.max(0, 1 - (t - 4.1) / 0.5) : 1;
    },

    // the bell-rope goes on up into the dark of the belfry above him
    draw(b, ctx, cam) {
      const x = Math.round(b.x - cam.x);
      const top = Math.round(b.y - cam.y - (b.z || 0)) - OY;
      const lim = Math.max(0, b.arena ? Math.round(b.arena.y - cam.y) - 24 : top - 80);
      if (top > lim) {
        const a0 = ctx.globalAlpha;
        ctx.globalAlpha = a0 * (b.alpha == null ? 1 : b.alpha);
        ctx.fillStyle = '#07060a'; ctx.fillRect(x - 2, lim, 4, top - lim);
        ctx.fillStyle = '#1f140f'; ctx.fillRect(x - 1, lim, 2, top - lim);
        ctx.fillStyle = '#3a261a';
        for (let y = lim + ((top - lim) % 3); y < top; y += 3) ctx.fillRect(x - 1, y, 1, 1);
        ctx.globalAlpha = a0;
      }
      return false;
    },
  };
})(window.AV);
