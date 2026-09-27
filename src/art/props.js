// ASHEN VOW — props (owner: ART-PROPS). Every prop sheet listed in docs/API.md §5.
// Anchor for every sheet: ox = w/2, oy = h-2 — the bottom-centre of the footprint; the last row is
// left free for the outline / contact shadow. Dark outlines, restrained stone/wood/iron bodies; fire and
// ghost-light are the only saturated accents.
(function (AV) {
  'use strict';
  const art = AV.art;
  const U = AV.util;
  const TAU = Math.PI * 2;
  // temporary mask colours (always recoloured before a frame is finished)
  const M1 = '#ff00ff', M2 = '#00ff00', M3 = '#00ffff', M4 = '#ffff00';

  // ================================================================ sheet + drawing toolkit
  function prop(id, w, h, anims) { art.sheet(id, { w, h, ox: w >> 1, oy: h - 2, anims }); }
  const still = (fn) => ({ fps: 1, count: 1, draw: (g) => fn(g, 0) });
  const anim = (count, fps, fn) => ({ fps, count, draw: fn });

  const hl = (g, x0, x1, y, c) => { for (let x = x0; x <= x1; x++) g.px(x, y, c); };
  const vl = (g, x, y0, y1, c) => { for (let y = y0; y <= y1; y++) g.px(x, y, c); };
  const pick = (ramp, v) => ramp[U.clamp(Math.floor(v * ramp.length), 0, ramp.length - 1)];
  const wrap = (v, n) => ((v % n) + n) % n;

  // Draw fn on a fresh grid, outline it (unless oc === false) and blit it over g: per-object outlines.
  function layer(g, fn, oc) {
    const t = art.grid(g.w, g.h);
    fn(t);
    if (oc !== false) t.outline(oc || '0');
    g.blit(t, 0, 0);
    return t;
  }
  // Recolour already-drawn pixels at random (texture). `only` restricts to some existing colours.
  function speck(g, x, y, w, h, chars, dens, seed, only) {
    const r = U.rng(seed);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const v = r(), k = r();
      const cur = g.get(x + i, y + j);
      if (cur == null || v >= dens) continue;
      if (only && only.indexOf(cur) < 0) continue;
      g.px(x + i, y + j, chars[Math.floor(k * chars.length)]);
    }
  }
  // Ash / dust on every upward-facing pixel (pixel above is empty).
  function dust(g, x0, y0, x1, y1, chars, prob, seed, only) {
    const r = U.rng(seed);
    for (let y = y1; y >= y0; y--) for (let x = x0; x <= x1; x++) {
      const c = g.get(x, y);
      if (c == null || g.get(x, y - 1) != null) continue;
      if (only && only.indexOf(c) < 0) continue;
      if (r() < prob) g.px(x, y, chars[Math.floor(r() * chars.length)]);
    }
  }
  // Shade `mask` pixels in a box as a vertical cylinder lit from the upper left.
  function cylV(g, x0, y0, x1, y1, mask, ramp, peak) {
    peak = peak == null ? 0.3 : peak;
    for (let y = y0; y <= y1; y++) {
      let L = -1, R = -1;
      for (let x = x0; x <= x1; x++) if (g.get(x, y) === mask) { if (L < 0) L = x; R = x; }
      if (L < 0) continue;
      const span = Math.max(1, R - L);
      for (let x = L; x <= R; x++) {
        if (g.get(x, y) !== mask) continue;
        const t = (x - L) / span;
        const l = t < peak ? 0.7 + 0.3 * (t / peak) : 1 - (t - peak) / (1 - peak);
        g.px(x, y, pick(ramp, l * 0.999));
      }
    }
  }
  // Shade `mask` pixels as a horizontal cylinder lit from above.
  function cylH(g, x0, y0, x1, y1, mask, ramp, peak) {
    peak = peak == null ? 0.25 : peak;
    for (let x = x0; x <= x1; x++) {
      let T = -1, B = -1;
      for (let y = y0; y <= y1; y++) if (g.get(x, y) === mask) { if (T < 0) T = y; B = y; }
      if (T < 0) continue;
      const span = Math.max(1, B - T);
      for (let y = T; y <= B; y++) {
        if (g.get(x, y) !== mask) continue;
        const t = (y - T) / span;
        const l = t < peak ? 0.75 + 0.25 * (t / peak) : 1 - (t - peak) / (1 - peak);
        g.px(x, y, pick(ramp, l * 0.999));
      }
    }
  }
  // Shaded ellipsoid (pixel-index centre), light from the upper left front.
  // With a mask, every mask pixel in the grid is shaded (normals clamped outside the ellipse).
  function orb(g, cx, cy, rx, ry, ramp, mask) {
    const y0 = mask ? 0 : Math.floor(cy - ry - 1), y1 = mask ? g.h - 1 : Math.ceil(cy + ry + 1);
    const x0 = mask ? 0 : Math.floor(cx - rx - 1), x1 = mask ? g.w - 1 : Math.ceil(cx + rx + 1);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const nx = (x - cx) / (rx + 0.5), ny = (y - cy) / (ry + 0.5);
        let d = nx * nx + ny * ny;
        if (mask) { if (g.get(x, y) !== mask) continue; d = Math.min(d, 0.999); }
        else if (d > 1) continue;
        const nz = Math.sqrt(1 - d);
        const l = (-0.45 * nx - 0.6 * ny + 0.65 * nz + 0.55) / 1.75;
        g.px(x, y, pick(ramp, U.clamp(l, 0, 0.999)));
      }
  }
  // Stone courses: per-block fill variation + mortar joints, painted over existing pixels.
  function masonry(g, x0, y0, x1, y1, o) {
    const bh = o.bh || 4, bw = o.bw || 8, seed = o.seed || 1;
    for (let y = y0; y <= y1; y++) {
      const row = Math.floor((y - y0) / bh), ry = (y - y0) % bh;
      const off = (row & 1) * (bw >> 1) + (U.hash2(row, 7, seed) % 3);
      for (let x = x0; x <= x1; x++) {
        const cur = g.get(x, y);
        if (cur == null || (o.only && o.only.indexOf(cur) < 0)) continue;
        const bx = x - x0 + off, col = Math.floor(bx / bw), rx = bx - col * bw;
        let c = o.fills ? o.fills[U.hash2(col, row, seed) % o.fills.length] : cur;
        if (ry === bh - 1 || rx === 0) c = o.mortar || '3';
        else if (ry === 0 && o.hi) c = o.hi;
        g.px(x, y, c);
      }
    }
  }
  // Two-centred (pointed) arch test. sy = springing line, a = half span, r = arc radius (> a).
  function inArch(x, y, cx, sy, a, r) {
    if (Math.abs(x - cx) > a) return false;
    if (y >= sy) return true;
    const off = r - a;
    const ccx = x < cx ? cx + off : cx - off;
    return (x - ccx) * (x - ccx) + (y - sy) * (y - sy) <= r * r;
  }
  // Thick line built from discs.
  function thick(g, x0, y0, x1, y1, r, c) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      if (r <= 0.5) g.px(Math.round(x), Math.round(y), c);
      else g.circle(Math.round(x), Math.round(y), r - 0.5, c);
    }
  }
  function stampMap(g, x, y, rows, map) {
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
      const ch = rows[j][i];
      if (ch === '.' || ch === ' ') continue;
      g.px(x + i, y + j, map && map[ch] ? map[ch] : ch);
    }
  }

  // ---------------------------------------------------------------- ramps (dark → light)
  const STONE = ['2', '3', '4', '5', '6', '7'];
  const IRON = ['1', '2', '3', '4', '5'];
  const WOOD = ['a', 'b', 'c', 'd', 'e'];
  const GREYWOOD = ['2', 'b', 'c', 'd', '6'];
  const BRONZE = ['a', 'J', 'K', 'L', 'M'];
  const BONE = ['5', '6', '7', '8', '9'];
  const SOOTBONE = ['3', '4', '5', '6', '7'];
  const BARK = ['5', '6', '7', 'S', 'T'];
  const LINEN = ['5', '6', '7', '8', '9'];
  const EARTH = ['a', 'b', 'c', 'd'];
  const GHOST = ['t', 'v', 'w', 'x', 'y'];
  const WINE = ['F', 'G', 'H', 'I'];
  const STEEL = ['3', '4', '5', '6', '7'];

  // ---------------------------------------------------------------- fire
  // Procedural flame: an upward-scrolling periodic noise field inside a teardrop envelope.
  // (cx = centre in pixel coordinates, by = base row, n frames loop seamlessly.)
  function fire(g, cx, by, w, h, f, n, o) {
    o = o || {};
    const seed = o.seed || 0;
    const sp = o.speed || Math.max(1, Math.round(h / 5));
    const P = n * sp;
    const half = w / 2;
    const rough = o.rough != null ? o.rough : 0.55;
    const cool = o.cool || 0;
    for (let yy = 0; yy <= h + 3; yy++) {
      const t = yy / h;
      const wf = Math.max(0.04, Math.pow(Math.max(0, 1 - t), 0.75));
      const Y = yy - f * sp;
      for (let x = Math.floor(cx - half - 1); x <= Math.ceil(cx + half + 1); x++) {
        const dx = Math.abs(x - cx) / half;
        const nz = 0.55 * Math.sin(TAU * Y / P + x * 0.9 + seed)
          + 0.30 * Math.sin(TAU * 2 * Y / P - x * 1.45 + seed * 2.3)
          + 0.15 * Math.sin(TAU * 3 * Y / P + x * 2.7 + seed * 0.7);
        const body = 1 - dx / wf;
        const v = body + nz * rough * (0.25 + t) - t * 0.25;
        if (v < 0.15) continue;
        if (o.clip && !o.clip(x, by - yy)) continue;
        const heat = v * (1 - t * 0.7) - cool;
        const c = heat > 0.78 ? 'q' : heat > 0.6 ? 'p' : heat > 0.42 ? 'o' : heat > 0.26 ? 'n' : 'm';
        g.px(x, by - yy, c);
      }
    }
  }
  // Rising sparks; loop over n frames.
  function sparks(g, cx, by, w, h, f, n, count, seed) {
    const r = U.rng(seed);
    for (let i = 0; i < count; i++) {
      const x0 = cx + (r() - 0.5) * w, ph = r();
      const k = wrap(f / n + ph, 1);
      const x = Math.round(x0 + Math.sin(k * TAU + i) * 1.2);
      const y = Math.round(by - k * h);
      g.px(x, y, k < 0.35 ? 'p' : k < 0.7 ? 'o' : 'm');
    }
  }
  // Candle flames. (x, y) = wick pixel; the flame rises from y-1.
  const FLAME_S = [
    [[0, -1, 'q'], [0, -2, 'p'], [0, -3, 'o']],
    [[0, -1, 'q'], [0, -2, 'p'], [0, -3, 'p'], [0, -4, 'n']],
    [[0, -1, 'q'], [0, -2, 'p'], [1, -3, 'o']],
    [[0, -1, 'q'], [0, -2, 'q'], [0, -3, 'p'], [-1, -4, 'o']],
  ];
  function flame(g, x, y, f) { for (const [dx, dy, c] of FLAME_S[wrap(f, 4)]) g.px(x + dx, y + dy, c); }
  const FLAME_M = [
    ['.n.', '.o.', 'opo', 'oqo', '.q.'],
    ['.o.', '.p.', 'opn', 'pqo', '.q.'],
    ['n..', '.o.', 'op.', 'oqp', '.q.'],
    ['..o', '.o.', '.po', 'pqo', '.q.'],
  ];
  function flameM(g, x, y, f) { const rows = FLAME_M[wrap(f, 4)]; g.stamp(x - 1, y - rows.length, rows); }
  // Tallow candle body; returns the wick position.
  function candle(g, x, base, h, w) {
    w = w || 2;
    const top = base - h + 1;
    const cols = w === 1 ? ['g'] : w === 2 ? ['9', 'f'] : ['9', 'g', 'f'];
    for (let y = top; y <= base; y++) for (let i = 0; i < w; i++) g.px(x + i, y, cols[i]);
    if (w > 1) g.px(x + w - 1, top, 'g');
    return [x + ((w - 1) >> 1), top - 1];
  }
  function wick(g, p, lit, f, big) {
    g.px(p[0], p[1], lit ? 'l' : '2');
    if (lit) (big ? flameM : flame)(g, p[0], p[1], f);
  }

  // Ghost-light jar. x0 = left column of the glass, by = bottom row. Pulses over 4 frames.
  function jar(g, x0, by, w, h, f, ph, glow) {
    const top = by - h + 1;
    layer(g, (t) => {
      for (let y = top + 2; y <= by; y++) for (let x = x0; x < x0 + w; x++) {
        const corner = (y === by || y === top + 2) && (x === x0 || x === x0 + w - 1);
        if (!corner) t.px(x, y, 'u');
      }
      hl(t, x0 + 1, x0 + w - 2, top + 1, '4');
      hl(t, x0 + 1, x0 + w - 2, top, 'd');
      if (w > 3) t.px(x0 + 1, top, 'e');
    });
    const cx = x0 + (w - 1) / 2, cy = top + 2 + (by - top - 2) * 0.55;
    const pulse = glow ? [1, 0.82, 0.62, 0.82][wrap(f + ph, 4)] : 0;
    for (let y = top + 2; y <= by; y++) for (let x = x0; x < x0 + w; x++) {
      if (g.get(x, y) !== 'u') continue;
      const edge = x === x0 || x === x0 + w - 1 || y === by;
      if (!glow) { g.px(x, y, edge ? 't' : 'r'); continue; }
      const d = Math.hypot((x - cx) / (w / 2 + 0.5), (y - cy) / ((by - top) / 2 + 0.5));
      const v = pulse * (1.05 - d) - (edge ? 0.25 : 0);
      g.px(x, y, v > 0.62 ? 'y' : v > 0.42 ? 'x' : v > 0.22 ? 'w' : v > 0.05 ? 'v' : 't');
    }
    if (glow) {
      const fx = Math.round(cx) + [0, 0, 1, 0][wrap(f + ph, 4)] * (w > 4 ? 1 : 0);
      g.px(fx, Math.round(cy), 'y');
      if (pulse > 0.8 && h > 6) g.px(fx, Math.round(cy) - 1, 'y');
    }
    g.px(x0 + 1, top + 3, glow ? '9' : '5');
  }

  // Shrouded body lying left→right (head at x0). len = total length.
  function shrouded(t, x0, y0, len, ht) {
    // side profile of a body under linen: head, neck, chest, folded hands, legs, upturned feet
    const P = [[0, 0.45], [0.04, 0.8], [0.1, 0.92], [0.16, 0.78], [0.2, 0.6], [0.26, 0.86], [0.36, 0.98], [0.48, 0.84],
      [0.56, 0.86], [0.66, 0.66], [0.84, 0.52], [0.9, 0.62], [0.95, 0.9], [1, 0.5]];
    const prof = (u) => { for (let i = 1; i < P.length; i++) if (u <= P[i][0]) { const a = P[i - 1], b = P[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); } return 0.5; };
    for (let x = x0; x < x0 + len; x++) {
      const u = (x - x0 + 0.5) / len;
      const top = Math.round(y0 + ht * (1 - prof(u)));
      const bot = y0 + ht - (u < 0.05 || u > 0.96 ? 1 : 0);
      vl(t, x, top, bot, M1);
    }
    cylH(t, x0, y0 - 1, x0 + len, y0 + ht, M1, LINEN, 0.2);
    // cords at neck, waist and ankles
    for (const k of [0.2, 0.52, 0.86]) {
      const x = Math.round(x0 + len * k);
      for (let y = 0; y < t.h; y++) if (LINEN.indexOf(t.get(x, y)) >= 0) t.px(x, y, t.get(x, y - 1) == null ? 'e' : 'd');
    }
    // folds of the cloth
    for (let x = x0 + 5; x < x0 + len - 2; x += 3) {
      const y = y0 + ht - 1 - ((x * 5) % 2);
      if (LINEN.indexOf(t.get(x, y)) >= 0) t.px(x, y, '5');
    }
  }

  // ================================================================ SMALL SYMBOLS
  // prop_bird 8×8 — the crude carved bird. A turnip with opinions.
  const BIRD = [
    '........',
    '...fgf..',
    '.e.ff0f.',
    '.eeffffc',
    '..deffe.',
    '..cdde..',
    '...cc...',
    '....c...',
  ];
  function drawBird(g, x, y) { layer(g, (t) => t.stamp(x, y, BIRD)); }
  prop('prop_bird', 8, 8, { idle: still((g) => drawBird(g, 0, 0)) });

  // prop_grave_fresh 16×16 — a fresh mound with one bird on top
  prop('prop_grave_fresh', 16, 16, {
    idle: still((g) => {
      layer(g, (t) => {
        t.ellipse(7.5, 11.5, 6.5, 2.5, M1);
        t.ellipse(7.5, 10.5, 5, 2, M1);
        orb(t, 7, 9, 8, 5, ['a', 'a', 'b', 'b', 'c', 'd'], M1);
        speck(t, 1, 7, 14, 8, ['a', 'b', 'c'], 0.2, 41);
        t.px(3, 12, '5'); t.px(11, 13, '6'); t.px(10, 9, '5'); t.px(5, 10, '6');
      });
      drawBird(g, 4, 2);
    }),
  });

  // prop_glint 8×8 — pickup sparkle
  const GLINT = [
    ['........', '........', '........', '....p...', '........', '........', '........', '........'],
    ['........', '........', '....o...', '...oqo..', '....o...', '........', '........', '........'],
    ['....o...', '....p...', '..p.p.p.', 'opqqqpo.', '..p.p.p.', '....p...', '....o...', '........'],
    ['........', '....o...', '....p...', '..opqpo.', '....p...', '....o...', '........', '........'],
  ];
  prop('prop_glint', 8, 8, { idle: { fps: 8, frames: GLINT } });

  // prop_hand_mark 16×16 — the Open Hand, painted: cupped hand, flame above. Faded red-brown. (decal)
  const HAND_MARK = [
    '.......X........',
    '......XX........',
    '......XXX.......',
    '.....XXXX.......',
    '.....XX.XX......',
    '.....XX.XX......',
    '......XXX.......',
    '................',
    '.X.........X.X.X',
    '.XX........X.X.X',
    '..XX.......XXXXX',
    '..XXXXXXXXXXXXX.',
    '...XXXXXXXXXXX..',
    '.....XXXXXXX....',
    '......X...X.....',
    '......X.........',
  ];
  prop('prop_hand_mark', 16, 16, {
    idle: still((g) => {
      const r = U.rng(907);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        if (HAND_MARK[y][x] !== 'X') continue;
        const v = r();
        if (v < 0.07) continue;                       // flaked away
        g.px(x, y, v < 0.55 ? 'H' : v < 0.8 ? 'l' : v < 0.93 ? 'G' : 'c');
      }
    }),
  });

  // ================================================================ LIGHTS
  // prop_candles 16×16
  function drawCandles(g, f, lit) {
    const C = [[3, 12, 5, 2], [6, 11, 8, 2], [9, 12, 4, 2], [12, 13, 3, 1], [5, 14, 2, 2]];
    const wk = [];
    layer(g, (t) => {
      t.ellipse(7.5, 13, 6, 1, 'e');
      hl(t, 3, 12, 13, 'f'); hl(t, 5, 10, 12, 'f');
      for (const [x, b, h, w] of C) {
        wk.push(candle(t, x, b, h, w));
        vl(t, x + w - 1, b - h + 2, b, w > 1 ? 'e' : 'f');
      }
      t.px(2, 12, 'g'); t.px(8, 9, '9'); t.px(11, 13, 'g'); t.px(4, 10, 'g');
    });
    wk.forEach((p, i) => wick(g, p, lit, f + i * 3));
  }
  prop('prop_candles', 16, 16, {
    idle: anim(4, 7, (g, i) => drawCandles(g, i, true)),
    unlit: still((g) => drawCandles(g, 0, false)),
  });

  // prop_candelabra 16×32 — standing iron candelabrum
  function drawCandelabra(g, f, lit) {
    const wk = [];
    layer(g, (t) => {
      t.line(7, 25, 3, 29, '3'); t.line(8, 25, 12, 29, '3');
      hl(t, 2, 4, 29, '4'); hl(t, 11, 13, 29, '3');
      vl(t, 7, 9, 26, '4'); vl(t, 8, 9, 26, '2');
      hl(t, 6, 9, 24, '4'); hl(t, 6, 9, 25, '2'); t.px(6, 24, '5');
      hl(t, 6, 9, 17, '4'); hl(t, 6, 9, 18, '2'); t.px(6, 17, '5');
      t.line(6, 17, 4, 16, '3'); t.line(4, 16, 3, 14, '3');
      t.line(9, 17, 11, 16, '3'); t.line(11, 16, 12, 14, '3');
      hl(t, 1, 5, 13, '4'); hl(t, 2, 4, 14, '2'); t.px(1, 13, '5');
      hl(t, 10, 14, 13, '4'); hl(t, 11, 13, 14, '2'); t.px(10, 13, '5');
      hl(t, 5, 10, 9, '4'); hl(t, 6, 9, 10, '2'); t.px(5, 9, '5');
      wk.push(candle(t, 2, 12, 5, 2), candle(t, 7, 8, 4, 2), candle(t, 12, 12, 5, 2));
      t.px(1, 14, 'g'); t.px(14, 15, 'g'); t.px(10, 10, 'g'); t.px(4, 15, 'f');
    });
    wk.forEach((p, i) => wick(g, p, lit, f + i * 2));
  }
  prop('prop_candelabra', 16, 32, {
    idle: anim(4, 7, (g, i) => drawCandelabra(g, i, true)),
    unlit: still((g) => drawCandelabra(g, 0, false)),
  });

  // prop_brazier 16×24 — iron fire-bowl on three legs
  function drawBrazier(g, f, lit) {
    layer(g, (t) => {
      t.line(4, 15, 2, 21, '3'); t.line(11, 15, 13, 21, '3');
      vl(t, 7, 16, 21, '3'); vl(t, 8, 16, 21, '2');
      hl(t, 1, 3, 21, '3'); hl(t, 12, 14, 21, '3'); hl(t, 6, 9, 21, '3');
      t.poly([[1, 11], [14, 11], [12, 16], [3, 16]], M1);
      cylV(t, 0, 11, 15, 16, M1, IRON);
      hl(t, 2, 13, 14, '2'); t.px(4, 14, '5'); t.px(8, 14, '4'); t.px(11, 14, '4');
      t.ellipse(7.5, 11, 6.5, 1.5, '4');
      hl(t, 2, 6, 10, '5');
      t.ellipse(7.5, 11, 5, 0.8, lit ? 'k' : '2');
      if (lit) speck(t, 2, 10, 12, 3, ['l', 'm', 'l', 'n'], 0.5, 17, 'k');
      else speck(t, 2, 10, 12, 3, ['3', '5', '6'], 0.5, 17, '2');
    });
    if (lit) {
      fire(g, 7.5, 10, 10, 10, f, 4, { seed: 2.1 });
      sparks(g, 7.5, 6, 8, 7, f, 4, 3, 91);
    }
  }
  prop('prop_brazier', 16, 24, {
    idle: anim(4, 8, (g, i) => drawBrazier(g, i, true)),
    unlit: still((g) => drawBrazier(g, 0, false)),
  });

  // prop_campfire 16×16 — ring of stones, crossed logs
  function drawCampfire(g, f, lit) {
    const cx = 7.5, cy = 12;
    const stones = [];
    for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + 0.2; stones.push([cx + Math.cos(a) * 6, cy + Math.sin(a) * 2.2]); }
    const back = stones.filter((s) => s[1] <= cy), front = stones.filter((s) => s[1] > cy);
    layer(g, (t) => {
      for (const [x, y] of back) orb(t, x, y, 1.3, 1, STONE.slice(1));
      if (!lit) { t.ellipse(7.5, 11.5, 4, 1.5, '5'); speck(t, 3, 10, 10, 4, ['6', '4', '7'], 0.45, 5); }
      t.line(3, 13, 12, 10, 'c'); t.line(3, 12, 12, 9, 'd');
      t.line(4, 9, 11, 12, 'b'); t.line(4, 10, 11, 13, 'c');
      t.px(3, 12, 'a'); t.px(12, 9, lit ? 'l' : 'a'); t.px(4, 9, lit ? 'l' : 'a'); t.px(11, 13, 'a');
      if (lit) { t.px(7, 11, 'm'); t.px(8, 11, 'l'); }
      else t.px(8, 11, 'l');
    });
    if (lit) {
      fire(g, 7.5, 11, 7, 10, f, 4, { seed: 5.3 });
      sparks(g, 7.5, 4, 6, 5, f, 4, 2, 77);
    }
    layer(g, (t) => { for (const [x, y] of front) orb(t, x, y, 1.3, 1, STONE.slice(1)); });
  }
  prop('prop_campfire', 16, 16, {
    idle: anim(4, 8, (g, i) => drawCampfire(g, i, true)),
    unlit: still((g) => drawCampfire(g, 0, false)),
  });

  // prop_hearth 32×32 — fireplace with a tallow pot (Linnet's chandlery)
  function hearthInside(x, y) {
    if (x < 8 || x > 23 || y < 13 || y > 27) return false;
    if (y === 13 && (x <= 9 || x >= 22)) return false;
    if (y === 14 && (x === 8 || x === 23)) return false;
    return true;
  }
  function drawHearth(g, f, lit) {
    layer(g, (t) => {
      t.rect(2, 0, 28, 28, '4');
      masonry(t, 2, 0, 29, 27, { bh: 4, bw: 7, fills: ['4', '4', '5', '3', '4'], mortar: '2', hi: '5', seed: 11 });
      for (let y = 0; y <= 27; y++) { if (t.get(29, y) !== '2') t.px(29, y, '3'); t.px(28, y, t.get(28, y) === '5' ? '4' : t.get(28, y)); }
      t.rect(1, 7, 30, 3, 'c'); hl(t, 1, 30, 7, 'e'); hl(t, 1, 30, 9, 'b');
      speck(t, 1, 8, 30, 1, ['d', 'b'], 0.3, 3);
      hl(t, 3, 5, 10, 'b'); hl(t, 26, 28, 10, 'b'); t.px(4, 11, 'b'); t.px(27, 11, 'b');
      for (let y = 12; y <= 27; y++) for (let x = 7; x <= 24; x++)
        if (!hearthInside(x, y) && hearthInside(x + 1, y) || !hearthInside(x, y) && hearthInside(x - 1, y) || (!hearthInside(x, y) && hearthInside(x, y + 1))) t.px(x, y, '5');
      for (let y = 13; y <= 27; y++) for (let x = 8; x <= 23; x++) if (hearthInside(x, y)) t.px(x, y, y < 17 ? '0' : '1');
      for (let y = 18; y <= 26; y += 4) for (let x = 9; x <= 22; x++) if (hearthInside(x, y)) t.px(x, y, '2');
      hl(t, 9, 22, 26, '3'); hl(t, 9, 22, 27, '5'); speck(t, 9, 26, 14, 2, ['6', '4', '3'], 0.5, 8);
      t.rect(3, 28, 26, 3, '4'); hl(t, 3, 28, 28, '6'); hl(t, 3, 28, 30, '3');
      speck(t, 3, 28, 26, 1, ['5', '7'], 0.25, 12);
    });
    if (lit) fire(g, 15.5, 25, 12, 12, f, 4, { seed: 3.3, clip: hearthInside });
    layer(g, (t) => {
      t.line(11, 26, 20, 24, 'c'); t.line(11, 25, 20, 23, 'd');
      t.line(12, 23, 21, 26, 'b'); t.line(12, 24, 21, 27, 'c');
      t.px(11, 26, 'a'); t.px(21, 27, 'a');
      if (lit) { t.px(15, 25, 'm'); t.px(17, 24, 'n'); t.px(19, 25, 'l'); t.px(13, 26, 'l'); }
    }, '1');
    // chain + pot of tallow
    for (let y = 13; y <= 16; y++) g.px(15 + (y & 1), y, '3');
    layer(g, (t) => {
      orb(t, 15.5, 19.5, 3.5, 2.5, IRON);
      hl(t, 12, 19, 17, '4'); hl(t, 13, 18, 17, 'g'); t.px(14, 17, '9');
      t.px(11, 18, '3'); t.px(20, 18, '3');
    });
    // mantel: two candles, a jar, a block of tallow
    const wk = [];
    layer(g, (t) => {
      wk.push(candle(t, 4, 6, 4, 2), candle(t, 26, 6, 3, 2));
      t.rect(18, 4, 4, 3, 'u'); hl(t, 18, 21, 3, '4'); t.px(18, 4, 'w'); vl(t, 21, 4, 6, 't');
      t.rect(9, 5, 4, 2, 'g'); hl(t, 9, 12, 5, '9'); t.px(12, 6, 'f');
    });
    wk.forEach((p, i) => wick(g, p, lit, f + i * 2));
  }
  prop('prop_hearth', 32, 32, {
    idle: anim(4, 8, (g, i) => drawHearth(g, i, true)),
    unlit: still((g) => drawHearth(g, 0, false)),
  });

  // prop_lamp_post 16×32 — iron post with a glass lantern
  function drawLamp(g, f, lit) {
    layer(g, (t) => {
      t.rect(5, 27, 6, 3, '3'); hl(t, 5, 10, 27, '4'); hl(t, 6, 9, 26, '3'); t.px(5, 27, '5');
      vl(t, 7, 11, 26, '4'); vl(t, 8, 11, 26, '2');
      hl(t, 6, 9, 18, '4'); hl(t, 6, 9, 19, '2');
      hl(t, 6, 9, 11, '3'); hl(t, 5, 10, 10, '4'); t.px(5, 10, '5');
      // lantern cage
      t.rect(5, 3, 6, 7, '2');
      t.poly([[4, 3], [11, 3], [7.5, 0]], '3'); hl(t, 5, 7, 2, '4'); t.px(7, 0, '4');
      hl(t, 4, 11, 3, '4');
      vl(t, 5, 4, 9, '3'); vl(t, 10, 4, 9, '2'); vl(t, 7, 4, 9, '3'); vl(t, 8, 4, 9, '2');
      for (let y = 4; y <= 8; y++) for (const x of [6, 9]) t.px(x, y, lit ? (y === 4 ? 'p' : y >= 7 ? 'n' : 'o') : (y === 5 ? 'u' : 't'));
      if (!lit) { t.px(9, 7, 's'); t.px(6, 8, 's'); }
    });
    if (lit) {
      const k = [0, 1, 0, 2][wrap(f, 4)];
      g.px(6, 6, k === 1 ? 'q' : 'p'); g.px(9, 6, k === 2 ? 'q' : 'p');
      g.px(6, 5, k === 2 ? 'o' : 'p'); g.px(9, 5, k === 1 ? 'o' : 'p');
    }
  }
  prop('prop_lamp_post', 16, 32, {
    idle: anim(4, 6, (g, i) => drawLamp(g, i, true)),
    unlit: still((g) => drawLamp(g, 0, false)),
  });

  // prop_shrine 16×32 — the resting place. An iron Open Hand cupping candle stubs on a stone foot.
  function drawShrine(g, f, lit) {
    layer(g, (t) => {
      // stone foot
      t.rect(3, 27, 10, 4, '4'); hl(t, 3, 12, 27, '6'); hl(t, 3, 12, 28, '5'); t.px(12, 28, '4');
      hl(t, 3, 12, 30, '3'); vl(t, 12, 29, 30, '3');
      speck(t, 3, 27, 10, 1, ['7', '8'], 0.3, 21);
      // stem, knop, flared foot
      hl(t, 5, 10, 26, '3'); hl(t, 6, 9, 25, '3'); t.px(5, 26, '4');
      vl(t, 7, 15, 24, '4'); vl(t, 8, 15, 24, '2');
      hl(t, 6, 9, 20, '4'); hl(t, 6, 9, 21, '2'); t.px(6, 20, '5');
      // the iron hand: the sign of the faith, cupped around its flame
      for (let j = 0; j < SHRINE_HAND.length; j++) for (let i = 0; i < 16; i++) if (SHRINE_HAND[j][i] === 'X') t.px(i, 9 + j, M1);
      for (let y = 9; y <= 16; y++) for (let x = 0; x < 16; x++) {
        if (t.get(x, y) !== M1) continue;
        const up = t.get(x, y - 1), dn = t.get(x, y + 1);
        t.px(x, y, up == null ? (lit && x > 3 && x < 12 ? 'e' : '5') : dn == null ? '2' : (y <= 12 ? '4' : '3'));
      }
      hl(t, 5, 8, 12, lit ? 'l' : '2'); t.px(12, 12, '3'); t.px(11, 13, '3');
    });
    const wk = [];
    layer(g, (t) => {
      wk.push(candle(t, 6, 11, 6, 2)); t.px(5, 11, 'g'); t.px(8, 11, 'f'); t.px(8, 10, 'g');
      if (!lit) { t.px(6, 7, 'S'); t.px(7, 6, 'T'); }
      t.px(5, 12, 'g'); t.px(8, 12, 'f');
    });
    wk.forEach((p, i) => wick(g, p, lit, f + [0, 1, 2][i], i === 0));
  }
  const SHRINE_HAND = [
    '..X......X.X.X..',
    '..XX.....X.X.X..',
    '...XX....XXXXX..',
    '...XXXXXXXXXXX..',
    '....XXXXXXXXX...',
    '.....XXXXXXX....',
    '......XXXX......',
    '.......XX.......',
  ];
  prop('prop_shrine', 16, 32, {
    idle: still((g) => drawShrine(g, 0, false)),
    unlit: still((g) => drawShrine(g, 0, false)),
    lit: anim(3, 6, (g, i) => drawShrine(g, i, true)),
  });

  // prop_altar 32×24 — stone altar, wine runner with the Open Hand, two brass candlesticks
  function drawAltar(g, f, lit) {
    layer(g, (t) => {
      t.rect(2, 8, 28, 4, '6'); hl(t, 2, 29, 8, '7'); hl(t, 2, 29, 11, '5');
      t.rect(3, 12, 26, 8, M1); cylV(t, 3, 12, 28, 19, M1, ['3', '4', '4', '5', '5'], 0.2);
      for (const x of [9, 22]) vl(t, x, 12, 19, '3');
      t.rect(1, 20, 30, 3, '4'); hl(t, 1, 30, 20, '5'); hl(t, 1, 30, 22, '3');
      speck(t, 2, 12, 28, 10, ['3', '5'], 0.08, 5);
      dust(t, 1, 8, 30, 20, ['7', '8'], 0.2, 9);
      // runner
      t.rect(11, 8, 10, 4, 'G'); hl(t, 11, 20, 8, 'H');
      t.rect(11, 12, 10, 6, M2); cylV(t, 11, 12, 20, 17, M2, WINE, 0.25);
      hl(t, 11, 20, 18, 'K'); for (let x = 11; x <= 20; x += 2) t.px(x, 19, 'J');
      vl(t, 11, 9, 18, 'J'); vl(t, 20, 9, 18, 'J');
      // embroidered Open Hand, worn
      t.px(15, 12, 'L'); t.px(16, 12, 'L'); t.px(15, 11, 'K');
      t.px(13, 14, 'K'); t.px(18, 14, 'K'); hl(t, 14, 17, 15, 'L'); t.px(13, 13, 'J'); t.px(18, 13, 'J');
      // closed book on the runner
      t.rect(13, 7, 6, 2, 'H'); hl(t, 13, 18, 9, 'g'); t.px(13, 7, 'I'); hl(t, 14, 18, 6, 'G');
    });
    const wk = [];
    for (const x of [5, 25]) layer(g, (t) => {
      hl(t, x - 1, x + 2, 10, 'J'); hl(t, x - 1, x + 2, 9, 'K'); t.px(x - 1, 9, 'M');
      vl(t, x, 7, 8, 'L'); vl(t, x + 1, 7, 8, 'J');
      wk.push(candle(t, x, 6, 3, 2));
    });
    wk.forEach((p, i) => wick(g, p, lit, f + i * 2));
  }
  prop('prop_altar', 32, 24, {
    idle: anim(4, 7, (g, i) => drawAltar(g, i, true)),
    unlit: still((g) => drawAltar(g, 0, false)),
  });

  // ================================================================ THE DEAD
  // prop_bier 32×24 — stone bier; `body` carries a shrouded corpse
  function drawBier(g, body) {
    layer(g, (t) => {
      t.rect(2, 8, 28, 5, '6'); hl(t, 2, 29, 8, '7'); hl(t, 2, 29, 12, '5');
      speck(t, 3, 9, 26, 3, ['5', '7'], 0.12, 31);
      t.rect(2, 13, 28, 6, M1); cylV(t, 2, 13, 29, 18, M1, ['3', '4', '4', '5', '5'], 0.2);
      t.box(4, 14, 24, 4, '3');
      for (let x = 7; x <= 25; x += 6) { t.px(x, 15, '5'); t.px(x, 16, '5'); t.px(x - 1, 16, '3'); t.px(x + 1, 16, '3'); t.px(x, 14, '6'); }
      t.rect(5, 19, 22, 2, '3'); hl(t, 5, 26, 19, '4');
      t.rect(3, 21, 26, 2, '4'); hl(t, 3, 28, 21, '5'); t.px(28, 22, '3');
      speck(t, 2, 13, 28, 9, ['C', 'B'], 0.03, 7);
      t.line(20, 13, 22, 16, '3'); t.px(23, 17, '3');
    });
    if (body) layer(g, (t) => shrouded(t, 4, 3, 24, 8));
  }
  prop('prop_bier', 32, 24, {
    idle: still((g) => drawBier(g, false)),
    body: still((g) => drawBier(g, true)),
  });

  // prop_shroud 24×12 — a shrouded body on the floor
  prop('prop_shroud', 24, 12, {
    idle: still((g) => layer(g, (t) => { shrouded(t, 1, 2, 22, 8); dust(t, 0, 0, 23, 11, ['6'], 0.15, 3); })),
  });

  // prop_ash_pile 16×10 — what is left of someone
  prop('prop_ash_pile', 16, 10, {
    idle: still((g) => layer(g, (t) => {
      t.ellipse(7.5, 7, 7, 1.6, M1);
      t.ellipse(6.5, 5.5, 4.5, 2.2, M1);
      t.ellipse(10, 6.5, 3, 1.5, M1);
      orb(t, 7, 4.5, 8, 4.5, ['4', '5', '6', '7', '8'], M1);
      speck(t, 0, 2, 16, 8, ['3', '4', '8', '6'], 0.2, 55);
      t.px(9, 7, 'l'); t.px(4, 7, '2'); t.px(11, 5, '9');
    }, '1')),
  });

  // Lying corpses 24×16. Grey, still, respectful.
  function corpseKnight(g) {
    layer(g, (t) => {
      // legs (far & near), sabatons pointing up
      t.rect(14, 6, 7, 3, M1); cylH(t, 14, 6, 20, 8, M1, STEEL);
      t.rect(14, 10, 7, 3, M2); cylH(t, 14, 10, 20, 12, M2, STEEL);
      t.rect(20, 4, 2, 4, '6'); t.px(20, 4, '7'); t.px(21, 7, '4');
      t.rect(20, 8, 2, 5, '5'); t.px(20, 8, '7'); t.px(21, 12, '4');
      vl(t, 17, 6, 8, '4'); vl(t, 17, 10, 12, '4');
      // arms along the sides
      t.rect(8, 4, 6, 2, '5'); hl(t, 8, 13, 4, '6');
      t.rect(8, 12, 6, 2, '5'); hl(t, 8, 13, 12, '6');
      // breastplate + torn grey tabard
      t.ellipse(10.5, 8.5, 4, 3.5, M3); orb(t, 10, 7.5, 4.5, 4.5, STEEL, M3);
      t.rect(11, 7, 4, 4, '4'); hl(t, 11, 14, 7, '5'); t.px(15, 8, '4'); t.px(15, 10, '3');
      // great helm, face up, eye-slit
      t.rect(2, 5, 6, 7, M4); t.px(2, 5, null); t.px(2, 11, null);
      cylH(t, 2, 5, 7, 11, M4, STEEL);
      hl(t, 3, 6, 8, '1'); t.px(4, 10, '3'); t.px(6, 10, '3'); t.px(7, 7, '3');
      // sword laid along the body, hands folded on the hilt
      hl(t, 9, 22, 9, '7'); hl(t, 12, 22, 10, '5'); t.px(23, 9, '6');
      vl(t, 8, 6, 12, 'K'); t.px(8, 6, 'L');
      t.px(7, 9, 'J'); t.px(6, 9, 'K');
      t.rect(9, 8, 2, 3, 'N'); t.px(9, 8, 'O');
      speck(t, 2, 4, 21, 10, ['8', '7'], 0.05, 61);
    });
  }
  function corpsePilgrim(g) {
    layer(g, (t) => {
      // staff lying beside
      t.line(1, 14, 23, 12, 'c'); t.px(1, 14, 'd');
      // robe
      t.ellipse(13, 8.5, 8.5, 4, M1); t.rect(15, 5, 6, 8, M1);
      orb(t, 12, 7, 10, 5.5, ['3', '4', '5', '6'], M1);
      for (let x = 12; x <= 20; x += 3) vl(t, x, 7, 11, '4');
      vl(t, 11, 5, 12, '6'); t.px(11, 13, 'e'); t.px(11, 14, 'd');
      // feet (bare, grey)
      t.rect(21, 5, 2, 2, 'N'); t.rect(21, 10, 2, 2, 'N'); t.px(22, 5, 'O'); t.px(22, 10, 'O');
      // hood and grey face
      t.ellipse(4.5, 8.5, 3.5, 3.5, '5'); t.px(1, 8, '4'); hl(t, 3, 6, 5, '6');
      t.ellipse(4.5, 8.5, 1.7, 2, 'N'); t.px(4, 8, '3'); t.px(4, 10, '3'); t.px(5, 7, 'O');
      // clasped hands, pilgrim scallop
      t.rect(8, 8, 2, 2, 'N'); t.px(8, 8, 'O');
      t.px(9, 5, '8'); t.px(10, 5, '9');
      speck(t, 2, 4, 20, 9, ['7', '8'], 0.04, 71);
    });
  }
  function corpseSoldier(g) {
    layer(g, (t) => {
      // legs in hose, boots toes-up
      t.ellipse(16.5, 7.5, 3.5, 1.5, M2); t.ellipse(16.5, 11, 3.5, 1.5, M2);
      cylH(t, 12, 5, 21, 13, M2, ['a', 'b', 'c', 'c']);
      t.rect(20, 5, 2, 4, 'a'); t.px(20, 5, 'd'); t.px(21, 5, 'c'); t.rect(20, 9, 2, 4, 'a'); t.px(20, 9, 'd'); t.px(21, 9, 'c');
      // quilted jacket
      t.ellipse(10, 9, 4.5, 4, M1); cylH(t, 5, 4, 15, 13, M1, ['B', 'C', 'C', 'D']);
      for (let x = 7; x <= 13; x++) for (let y = 6; y <= 12; y++) if ((x + y) % 3 === 0 && t.get(x, y) != null) t.px(x, y, 'B');
      vl(t, 13, 6, 12, 'c'); t.px(13, 9, 'K');
      // an arm fallen across, grey hand
      t.line(8, 12, 12, 13, 'C'); t.px(13, 13, 'N');
      // kettle hat, face beneath it
      t.ellipse(4, 9, 3.5, 4, '4'); t.ring(4, 9, 3.5, '5'); t.px(1, 7, '6'); t.px(2, 6, '6');
      t.ellipse(4.5, 9, 1.6, 2.2, 'N'); t.px(4, 8, '3'); t.px(4, 10, '3'); t.px(5, 8, 'O');
      speck(t, 1, 4, 21, 10, ['7', '6'], 0.04, 81);
    });
    layer(g, (t) => { t.line(1, 14, 21, 12, 'c'); t.px(22, 12, '6'); t.px(23, 11, '7'); t.px(22, 11, '5'); });
  }
  function corpseMonk(g) {
    layer(g, (t) => {
      // habit
      t.ellipse(12.5, 8.5, 8.5, 4.2, M1); t.rect(15, 5, 6, 8, M1);
      orb(t, 12, 7, 10, 5.5, ['1', '2', '3', '4'], M1);
      t.rect(8, 6, 6, 5, '3'); hl(t, 8, 13, 6, '4');        // scapular
      for (let x = 15; x <= 20; x += 3) vl(t, x, 7, 11, '2');
      // rope cincture with knotted tail
      vl(t, 14, 5, 12, '7'); t.px(15, 12, '6'); t.px(16, 13, '7'); t.px(17, 13, '6');
      // sandals
      t.rect(21, 5, 2, 2, 'd'); t.rect(21, 10, 2, 2, 'd'); t.px(22, 5, 'N'); t.px(22, 10, 'N');
      // tonsured head, grey face
      t.ellipse(4.5, 8.5, 3, 3.3, 'N');
      vl(t, 1, 7, 10, '5'); t.px(2, 6, '5'); t.px(2, 11, '5'); t.px(3, 5, '5');
      t.px(2, 8, 'O'); t.px(5, 8, '3'); t.px(5, 10, '3'); t.px(4, 9, 'O');
      // folded hands
      t.rect(9, 8, 2, 2, 'N'); t.px(9, 8, 'O');
      t.px(11, 10, '6'); t.px(12, 11, '6');
      speck(t, 2, 4, 20, 10, ['u', 't'], 0.05, 91, '1234');
    });
  }
  prop('prop_corpse_knight', 24, 16, { idle: still(corpseKnight) });
  prop('prop_corpse_pilgrim', 24, 16, { idle: still(corpsePilgrim) });
  prop('prop_corpse_soldier', 24, 16, { idle: still(corpseSoldier) });
  prop('prop_corpse_monk', 24, 16, { idle: still(corpseMonk) });

  // prop_bone_pile 24×16
  function bone(t, x0, y0, x1, y1) {
    t.line(x0, y0, x1, y1, '8');
    t.px(x0, y0 - 1, '9'); t.px(x0 - 1, y0, '8'); t.px(x1, y1 + 1, '7'); t.px(x1 + 1, y1, '7');
  }
  function skull(t, cx, cy, ramp) {
    orb(t, cx, cy, 2.2, 1.9, ramp || BONE);
    t.px(Math.round(cx) - 1, Math.round(cy), '1'); t.px(Math.round(cx) + 1, Math.round(cy), '1');
    t.px(Math.round(cx), Math.round(cy) + 2, (ramp || BONE)[1]);
    t.px(Math.round(cx) - 1, Math.round(cy) + 2, (ramp || BONE)[2]); t.px(Math.round(cx) + 1, Math.round(cy) + 2, (ramp || BONE)[2]);
  }
  prop('prop_bone_pile', 24, 16, {
    idle: still((g) => {
      layer(g, (t) => {
        t.ellipse(11.5, 11.5, 10, 2.8, M1); t.ellipse(11, 9.5, 6, 3.5, M1);
        orb(t, 11, 8, 11, 6, ['4', '5', '6', '6', '7'], M1);
        speck(t, 1, 5, 22, 10, ['5', '7', '4'], 0.35, 13);
      }, '1');
      layer(g, (t) => { bone(t, 3, 12, 10, 9); bone(t, 13, 8, 20, 12); bone(t, 8, 7, 12, 12); });
      layer(g, (t) => { skull(t, 11, 6.5); skull(t, 5, 10.5); skull(t, 17, 10); });
      layer(g, (t) => { bone(t, 14, 13, 19, 13); t.px(7, 13, '8'); t.px(8, 13, '9'); });
    }),
  });

  // prop_skull_niche 16×16 — a wall niche holding a skull and a spent stub
  prop('prop_skull_niche', 16, 16, {
    idle: still((g) => {
      layer(g, (t) => {
        t.rect(1, 1, 14, 14, '4');
        masonry(t, 1, 1, 14, 14, { bh: 5, bw: 7, fills: ['4', '5', '4', '3'], mortar: '2', hi: '5', seed: 3 });
        for (let y = 3; y <= 13; y++) for (let x = 4; x <= 11; x++)
          if (inArch(x, y, 7.5, 7, 4, 5.5)) t.px(x, y, y < 8 ? '0' : '1');
        hl(t, 4, 11, 13, '3'); hl(t, 3, 12, 14, '6');
      });
      layer(g, (t) => { skull(t, 7, 10, BONE); t.px(7, 8, '9'); });
      layer(g, (t) => { candle(t, 10, 12, 2, 1); t.px(10, 10, '2'); t.px(9, 12, 'g'); }, '1');
    }),
  });

  // ================================================================ STATUES & STONE
  // Saint Wendel — hooded pilgrim chandler holding up a lantern. Weathered.
  function pedestal(t, x0, y0, w, h, seed) {
    t.rect(x0, y0, w, 2, '6'); hl(t, x0, x0 + w - 1, y0 + 1, '7');
    t.rect(x0 + 1, y0 + 2, w - 2, h - 4, M4); cylV(t, x0 + 1, y0 + 2, x0 + w - 2, y0 + h - 3, M4, ['3', '4', '5', '5'], 0.2);
    t.rect(x0, y0 + h - 2, w, 2, '4'); hl(t, x0, x0 + w - 1, y0 + h - 2, '5');
    const px0 = x0 + (w >> 1) - 4;
    t.rect(px0, y0 + 3, 8, 3, '3'); for (let x = px0 + 1; x <= px0 + 6; x += 2) t.px(x, y0 + 4, '4');
    speck(t, x0, y0, w, h, ['D', 'C', 'E'], 0.03, seed);
    speck(t, x0, y0, w, 2, ['8', '9'], 0.3, seed + 1);
  }
  function drawSaint(g, f, lit) {
    layer(g, (t) => pedestal(t, 3, 31, 18, 8, 19));
    layer(g, (t) => {
      // staff
      vl(t, 4, 3, 31, '5'); t.px(4, 2, '6'); t.px(5, 1, '6'); t.px(6, 2, '5');
      // robe, cape, hood
      t.poly([[6, 16], [17, 16], [19, 30], [5, 30]], M1);
      t.poly([[7, 13], [16, 13], [18, 18], [5, 18]], M1);
      t.ellipse(11.5, 9.5, 3.5, 4, M1); t.poly([[8, 8], [10, 3], [13, 6]], M1);
      cylV(t, 0, 3, 23, 30, M1, ['3', '4', '5', '6', '7'], 0.3);
      // the face in the shadow of the hood
      t.ellipse(12.5, 10.5, 1.2, 1.8, '2'); t.px(13, 10, '4'); t.px(12, 12, '3');
      // left sleeve to the staff
      t.line(8, 15, 5, 18, '5'); t.line(9, 15, 6, 19, '4'); t.rect(4, 18, 2, 2, '6');
      // girdle and folds
      hl(t, 7, 16, 20, '3'); t.px(11, 21, '3'); t.px(11, 22, '4');
      for (let y = 22; y <= 29; y++) { t.px(9, y, '4'); if (y > 24) t.px(14, y, '3'); }
      hl(t, 6, 18, 30, '4');
    });
    layer(g, (t) => {
      // right arm raised, bell sleeve falling from the elbow
      t.poly([[14, 13], [17, 14], [20, 9], [18, 8], [15, 11]], M2);
      t.poly([[16, 13], [18, 12], [18, 16]], M2);
      for (let y = 0; y < 40; y++) for (let x = 0; x < 24; x++) if (t.get(x, y) === M2) t.px(x, y, t.get(x - 1, y) == null ? '6' : t.get(x + 1, y) == null ? '3' : '4');
      t.rect(18, 7, 2, 2, '6');
      // the lantern
      t.px(19, 0, '4'); t.poly([[17, 2], [21, 2], [19, 0]], '5'); hl(t, 17, 21, 2, '6');
      t.rect(17, 3, 5, 3, '5'); vl(t, 17, 3, 5, '6'); vl(t, 21, 3, 5, '3');
      t.rect(18, 3, 3, 3, '2'); hl(t, 17, 21, 6, '4');
    });
    g.line(8, 24, 10, 27, '3'); g.px(15, 18, '3');
    speck(g, 4, 20, 16, 11, ['D', 'C', 'E'], 0.03, 29, '3456');
    dust(g, 2, 0, 22, 30, ['8', '9', '7'], 0.45, 37, '4567');
    if (lit) {
      const k = wrap(f, 3);
      g.px(19, 5, 'o'); g.px(19, 4, k === 0 ? 'q' : 'p'); g.px(18, 4, k === 1 ? 'o' : 'n'); g.px(20, 4, k === 2 ? 'o' : 'n');
      g.px(19, 3, k === 2 ? 'o' : 'n'); g.px(18, 5, 'n'); g.px(20, 5, 'm');
    }
  }
  prop('prop_statue_saint', 24, 40, {
    idle: still((g) => drawSaint(g, 0, false)),
    lit: anim(3, 5, (g, i) => drawSaint(g, i, true)),
  });

  // prop_statue_knight 24×44 — stone knight, hands on the pommel of a sword planted point-down
  prop('prop_statue_knight', 24, 44, {
    idle: still((g) => {
      layer(g, (t) => pedestal(t, 3, 35, 18, 8, 51));
      layer(g, (t) => {
        // legs & sabatons
        t.rect(8, 27, 3, 8, M1); t.rect(13, 27, 3, 8, M1);
        t.rect(7, 33, 4, 2, M1); t.rect(13, 33, 4, 2, M1);
        // surcoat, gorget, shoulders, helm
        t.poly([[7, 15], [16, 15], [18, 29], [5, 29]], M1);
        t.rect(9, 11, 6, 5, M1);
        t.ellipse(6.5, 15, 2.5, 2.2, M1); t.ellipse(16.5, 15, 2.5, 2.2, M1);
        t.rect(9, 3, 6, 9, M1); t.px(9, 3, null); t.px(14, 3, null); hl(t, 10, 13, 2, M1);
        // arms down to the hilt
        t.poly([[5, 16], [7, 16], [10, 21], [9, 22]], M1); t.poly([[16, 16], [18, 16], [14, 22], [13, 21]], M1);
        cylV(t, 0, 2, 23, 34, M1, ['3', '4', '5', '6', '7'], 0.28);
        // helm: eye-slit, breaths, crest ridge
        hl(t, 9, 14, 7, '1'); t.px(11, 9, '3'); t.px(12, 9, '3'); t.px(11, 10, '3'); t.px(12, 10, '3');
        vl(t, 11, 2, 6, '6'); hl(t, 9, 14, 12, '4'); hl(t, 9, 14, 11, '3');
        // belt and surcoat folds
        hl(t, 7, 16, 24, '4'); for (let y = 25; y <= 28; y++) { t.px(9, y, '4'); t.px(14, y, '3'); }
        // the sword
        vl(t, 11, 23, 34, '6'); vl(t, 12, 23, 34, '4'); t.px(11, 35, '5');
        hl(t, 7, 16, 22, '5'); hl(t, 7, 16, 23, '3'); t.px(7, 22, '6');
        t.rect(10, 19, 4, 3, '6'); hl(t, 10, 13, 21, '4'); t.px(11, 18, '5'); t.px(12, 18, '5'); t.px(11, 17, '6');
        // weather: a broken pauldron edge, cracks, lichen, ash
        t.px(4, 14, null); t.px(4, 15, null); t.px(5, 13, null);
        t.line(15, 25, 16, 29, '3'); t.px(8, 9, '3');
        speck(t, 5, 22, 14, 13, ['D', 'C', 'E'], 0.03, 57, '3456');
        dust(t, 0, 0, 23, 34, ['8', '9', '7'], 0.45, 59, '4567');
      });
    }),
  });

  // prop_well 32×32 — the village well (a way down, for those who will jump)
  prop('prop_well', 32, 32, {
    idle: still((g) => {
      layer(g, (t) => {
        // gable roof on two posts
        t.poly([[2, 6], [29, 6], [26, 2], [5, 2]], '3');
        hl(t, 5, 26, 2, '5'); hl(t, 3, 28, 6, '2');
        for (let x = 6; x <= 26; x += 3) vl(t, x, 3, 5, '2');
        speck(t, 3, 3, 26, 3, ['4', '2'], 0.2, 5);
        dust(t, 2, 0, 29, 6, ['6', '7'], 0.6, 7);
        vl(t, 5, 7, 16, 'd'); vl(t, 6, 7, 16, 'b'); vl(t, 25, 7, 16, 'd'); vl(t, 26, 7, 16, 'b');
        // winch
        hl(t, 5, 26, 8, 'c'); hl(t, 7, 24, 9, 'b');
        t.rect(12, 7, 8, 4, 'e'); for (let x = 12; x <= 19; x += 2) vl(t, x, 7, 10, 'f'); hl(t, 12, 19, 10, 'd');
        t.px(27, 8, '3'); t.px(28, 9, '3'); t.px(28, 10, '4');
      });
      layer(g, (t) => {
        // stone drum
        for (let x = 4; x <= 27; x++) {
          const dx = (x - 15.5) / 12;
          const yb = Math.round(16 + 4 * Math.sqrt(Math.max(0, 1 - dx * dx)));
          for (let y = 16; y <= yb + 8; y++) t.px(x, y, M1);
        }
        cylV(t, 3, 16, 28, 29, M1, ['3', '4', '5', '5', '6'], 0.3);
        for (let x = 4; x <= 27; x++) {
          const dx = (x - 15.5) / 12;
          const yb = 16 + 4 * Math.sqrt(Math.max(0, 1 - dx * dx));
          for (const k of [3, 6]) t.px(x, Math.round(yb + k), '2');
        }
        for (let x = 6; x <= 26; x += 4) for (let r = 0; r < 3; r++) {
          const dx = (x + (r & 1) * 2 - 15.5) / 12;
          const yb = 16 + 4 * Math.sqrt(Math.max(0, 1 - dx * dx));
          const xx = x + (r & 1) * 2;
          for (let k = r * 3 + 1; k <= r * 3 + 2; k++) if (t.get(xx, Math.round(yb + k)) != null) t.px(xx, Math.round(yb + k), '2');
        }
        // rim and the dark mouth
        t.ellipse(15.5, 16, 12, 4, '6');
        hl(t, 6, 14, 12, '7'); t.px(4, 15, '7'); t.px(5, 14, '7');
        t.ellipse(15.5, 16, 9, 2.4, '0');
        hl(t, 9, 22, 14, '3'); hl(t, 8, 23, 15, '2');
        speck(t, 3, 12, 26, 9, ['7', '8'], 0.12, 9, '6');
        speck(t, 3, 17, 26, 12, ['C', 'B'], 0.04, 11, '345');
      });
      // rope and bucket hanging over the mouth
      vl(g, 15, 11, 12, 'f'); vl(g, 16, 11, 12, 'e');
      layer(g, (t) => { t.rect(14, 13, 4, 3, 'c'); hl(t, 14, 17, 13, 'd'); hl(t, 14, 17, 14, '3'); t.px(14, 15, 'd'); }, '1');
    }),
  });

  // prop_fountain 48×40 — the saint's dry fountain, choked with drifted ash
  // the small Saint on the fountain: hooded, lantern raised (9×15 pixel stamp)
  const MINI_SAINT = [
    '.......434.',
    '.......4124',
    '...5...4334',
    '..565...5..',
    '..6655.5...',
    '.66225.5...',
    '.662354....',
    '6665544....',
    '.665543....',
    '.6655433...',
    '.66554433..',
    '666554433..',
    '666554433..',
    '666554433..',
    '44444433...',
  ];
  prop('prop_fountain', 48, 40, {
    idle: still((g) => {
      const cx = 23.5, cy = 26, rx = 22, ry = 8;
      layer(g, (t) => {
        // front wall of the basin
        for (let x = 1; x <= 46; x++) {
          const dx = (x - cx) / (rx + 0.5);
          if (Math.abs(dx) > 1) continue;
          const yb = Math.round(cy + ry * Math.sqrt(1 - dx * dx));
          for (let y = cy; y <= yb + 4; y++) t.px(x, y, M1);
        }
        cylV(t, 0, cy, 47, 38, M1, ['3', '4', '5', '5', '6'], 0.3);
        for (let x = 4; x <= 44; x += 6) {
          const dx = (x - cx) / (rx + 0.5);
          const yb = Math.round(cy + ry * Math.sqrt(Math.max(0, 1 - dx * dx)));
          vl(t, x, yb + 1, yb + 4, '3');
        }
        // rim, inner wall, dry floor
        t.ellipse(cx, cy, rx, ry, '6');
        t.ellipse(cx, cy, rx - 3, ry - 2.3, '5');
        t.ellipse(cx, cy + 1, rx - 3.5, ry - 3, '2');
        for (let x = 0; x < 48; x++) for (let y = 16; y < 37; y++) {
          const c = t.get(x, y);
          if (c === '6' && t.get(x, y - 1) == null) t.px(x, y, '7');
          if (c === '6' && t.get(x, y + 1) === '5' && y < cy) t.px(x, y, '7');
          if (c === '5' && y > cy + 2 && t.get(x, y - 1) === '2') t.px(x, y, '4');
        }
        // old waterline, broken lip, cracks
        for (let x = 6; x <= 41; x++) for (let y = 18; y < 26; y++) if (t.get(x, y) === '2' && t.get(x, y - 1) === '5') { t.px(x, y, 'N'); break; }
        t.px(36, 32, '4'); t.px(37, 32, '3'); t.px(38, 32, '4'); t.px(37, 31, '2');
        t.line(12, 31, 13, 35, '3'); t.line(31, 32, 32, 36, '3'); t.px(9, 22, '4');
        // ash drifted against the far wall and round the column
        for (const [ax, ay, arx, ary] of [[15, 22, 6, 1.5], [33, 22.5, 7, 1.6], [23.5, 29, 8, 1.8], [10, 27, 3.5, 1.2], [37, 27.5, 4, 1.2]]) {
          t.ellipse(ax, ay, arx, ary, '5'); t.ellipse(ax - 0.5, ay - 0.5, arx - 1.5, ary - 0.6, '6');
        }
        speck(t, 3, 19, 42, 12, ['7', '6', '4'], 0.1, 71, '56');
        speck(t, 1, 17, 46, 22, ['C', 'D'], 0.015, 77, '456');
      });
      layer(g, (t) => {
        // column and upper bowl
        t.rect(21, 16, 6, 12, M1); cylV(t, 20, 16, 27, 27, M1, ['3', '4', '5', '6', '6'], 0.3);
        hl(t, 20, 27, 26, '5'); hl(t, 20, 27, 27, '4');
        t.poly([[16, 14], [31, 14], [27, 18], [20, 18]], M2); cylV(t, 15, 14, 32, 18, M2, ['3', '4', '5', '6'], 0.3);
        t.ellipse(23.5, 13.5, 8, 1.8, '6'); t.ellipse(23.5, 13.5, 6.2, 1, '5'); hl(t, 19, 28, 13, '6');
        hl(t, 17, 30, 12, '7');
        stampMap(t, 19, 0, MINI_SAINT);
        dust(t, 14, 0, 33, 14, ['8', '7'], 0.5, 83, '56');
      });
    }),
  });

  // prop_rubble 32×16
  prop('prop_rubble', 32, 16, {
    idle: still((g) => {
      layer(g, (t) => { t.ellipse(15.5, 12, 14, 2.5, '4'); speck(t, 1, 9, 30, 6, ['3', '5', '6'], 0.5, 3); }, '1');
      const stones = [[8, 10, 4, 3], [16, 8, 5, 4], [23, 11, 3.5, 2.5], [12, 12, 3, 2], [4, 12, 2.5, 2], [20, 12, 2.5, 2], [27, 12, 2, 1.5]];
      layer(g, (t) => { t.line(3, 5, 17, 12, 'c'); t.line(3, 6, 17, 13, 'b'); t.px(3, 5, 'a'); t.px(2, 5, 'a'); });
      for (const [x, y, rx, ry] of stones) layer(g, (t) => {
        orb(t, x, y, rx, ry, STONE);
        t.px(Math.round(x - rx * 0.4), Math.round(y - ry * 0.5), '7');
        if (rx > 3) t.line(Math.round(x - 1), Math.round(y - ry + 1), Math.round(x + 1), Math.round(y + 1), '3');
      });
      speck(g, 0, 4, 32, 12, ['7'], 0.03, 9, '456');
    }),
  });

  // ================================================================ BELLS & WATER
  // bell half-width at u (0 = crown, 1 = lip), as a fraction of the lip radius
  const BELL_PROFILE = [[0, 0.3], [0.04, 0.48], [0.1, 0.55], [0.45, 0.6], [0.65, 0.68], [0.8, 0.8], [0.92, 0.94], [1, 1]];
  function bellR(u) {
    for (let i = 1; i < BELL_PROFILE.length; i++) if (u <= BELL_PROFILE[i][0]) {
      const a = BELL_PROFILE[i - 1], b = BELL_PROFILE[i];
      return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]);
    }
    return 1;
  }
  const OLD_BRONZE = ['a', 'J', 'J', 'K', 'K', 'L'];
  // green-grey patina running down from where the rain sat
  function verdigris(t, x0, y0, x1, y1, seed) {
    const r = U.rng(seed);
    for (let k = 0; k < 14; k++) {
      let x = Math.round(x0 + r() * (x1 - x0)), y = Math.round(y0 + r() * (y1 - y0) * 0.6);
      const len = 2 + Math.floor(r() * 6);
      for (let i = 0; i < len; i++, y++) {
        if (OLD_BRONZE.indexOf(t.get(x, y)) < 0) break;
        t.px(x, y, i === 0 ? 'C' : r() < 0.5 ? 'u' : 'B');
        if (r() < 0.2) x += r() < 0.5 ? -1 : 1;
      }
    }
  }
  // prop_bell_great 48×48 — the great bell in its frame, cracked
  prop('prop_bell_great', 48, 48, {
    idle: still((g) => {
      layer(g, (t) => {
        // frame
        t.rect(2, 3, 4, 43, M2); t.rect(42, 3, 4, 43, M2);
        cylV(t, 1, 3, 6, 45, M2, WOOD, 0.3); cylV(t, 41, 3, 46, 45, M2, WOOD, 0.3);
        t.rect(1, 2, 46, 5, 'c'); hl(t, 1, 46, 2, 'e'); hl(t, 1, 46, 3, 'd'); hl(t, 1, 46, 6, 'b');
        thick(t, 6, 7, 11, 3, 1, 'c'); thick(t, 41, 7, 36, 3, 1, 'c');
        t.rect(0, 43, 9, 3, 'c'); t.rect(39, 43, 9, 3, 'c'); hl(t, 0, 8, 43, 'd'); hl(t, 39, 47, 43, 'd');
        thick(t, 6, 38, 1, 43, 1, 'b'); thick(t, 41, 38, 46, 43, 1, 'b');
        speck(t, 0, 2, 48, 44, ['b', 'a'], 0.08, 5, 'cde');
        dust(t, 0, 0, 47, 45, ['6', '7'], 0.5, 7);
      });
      layer(g, (t) => {
        // yoke straps, crown, body
        t.rect(20, 7, 2, 3, '2'); t.rect(26, 7, 2, 3, '2'); t.rect(22, 6, 4, 3, '3');
        const top = 9, bot = 40, R = 16;
        for (let y = top; y <= bot; y++) { const r = R * bellR((y - top) / (bot - top)); hl(t, Math.round(23.5 - r), Math.round(23.5 + r), y, M1); }
        cylV(t, 0, 9, 47, 40, M1, OLD_BRONZE, 0.3);
        // raised bands and a line of worn letters
        for (const y of [13, 31, 36]) for (let x = 0; x < 48; x++) {
          const c = t.get(x, y);
          if (OLD_BRONZE.indexOf(c) < 0) continue;
          t.px(x, y - 1, c === 'a' ? 'a' : 'L'); t.px(x, y, c === 'a' ? 'a' : 'a');
        }
        for (let x = 16; x <= 31; x++) if (x % 3 !== 0) t.px(x, 17, (x * 5) % 7 < 3 ? 'J' : 'a');
        // verdigris runs
        verdigris(t, 8, 14, 40, 39, 311);
        // mouth
        t.ellipse(23.5, 40, 15.5, 1.2, '1'); hl(t, 9, 38, 41, 'J');
        // clapper
        vl(t, 23, 38, 41, '2'); t.circle(23.5, 43, 1.5, '3'); t.px(23, 42, '4');
        // the crack, and the chip it took from the lip
        t.line(17, 41, 18, 36, '0'); t.line(18, 36, 16, 31, '0'); t.line(16, 31, 18, 25, '0'); t.px(17, 23, '0'); t.px(19, 34, '0');
        t.px(19, 36, 'a'); t.px(17, 33, 'a'); t.px(15, 31, 'a'); t.px(17, 27, 'a'); t.px(16, 36, 'M'); t.px(15, 33, 'M'); t.px(19, 28, 'M'); t.px(18, 24, 'L');
        t.px(17, 41, null); t.px(18, 41, null); t.px(18, 40, null); t.px(16, 41, null);
        dust(t, 6, 8, 41, 40, ['6', '7'], 0.3, 15);
      });
    }),
  });

  // prop_bell_fallen 32×28 — a bell on its side, mouth toward us, cracked
  prop('prop_bell_fallen', 32, 28, {
    idle: still((g) => {
      layer(g, (t) => { t.ellipse(15.5, 24, 14, 2.5, '3'); speck(t, 1, 21, 30, 6, ['4', '2', '5'], 0.5, 3); }, '1');
      layer(g, (t) => {
        const cy = 13, xl = 4, xc = 27, R = 11;
        for (let x = xl; x <= xc; x++) { const r = R * bellR((xc - x) / (xc - xl)); vl(t, x, Math.round(cy - r), Math.round(cy + r), M1); }
        t.rect(28, 10, 2, 7, M1);
        cylH(t, 0, 0, 31, 27, M1, OLD_BRONZE, 0.3);
        for (const x of [8, 21]) for (let y = 0; y < 28; y++) if (OLD_BRONZE.indexOf(t.get(x, y)) >= 0) { t.px(x, y, 'a'); t.px(x + 1, y, t.get(x + 1, y) === 'a' ? 'a' : 'L'); }
        // the mouth: dark hollow and the clapper lying in it
        t.ellipse(4.5, 13, 2.2, 10.5, '1'); t.ellipse(5, 13, 1.2, 8.5, '0');
        t.px(4, 17, '3'); t.px(5, 18, '4'); t.px(5, 17, '3');
        vl(t, 3, 3, 23, 'K'); t.px(3, 2, 'J'); t.px(3, 24, 'J'); vl(t, 3, 5, 9, 'L');
        // crack
        t.line(5, 20, 9, 18, '0'); t.line(9, 18, 12, 20, '0'); t.line(12, 20, 16, 17, '0');
        t.px(10, 19, 'a'); t.px(13, 19, 'a');
        verdigris(t, 6, 3, 27, 24, 313);
        dust(t, 3, 0, 30, 26, ['6', '7'], 0.45, 23);
      });
      layer(g, (t) => { orb(t, 8, 25, 2.5, 1.5, STONE); orb(t, 22, 25.5, 3, 1.5, STONE); orb(t, 27, 24.5, 1.5, 1, STONE); });
    }),
  });

  // prop_bell_rope 8×48 — a bell rope with its woollen sally, swaying
  prop('prop_bell_rope', 8, 48, {
    idle: anim(4, 2, (g, f) => {
      const sway = [0, 1, 0, -1][f];
      const xAt = (y) => 3 + Math.round(sway * Math.pow(y / 46, 1.5));
      for (let y = 0; y <= 46; y++) {
        const x = xAt(y);
        if (y >= 28 && y <= 36) {
          const c = ((y - 28) >> 1) % 3 === 0 ? 'H' : ((y - 28) >> 1) % 3 === 1 ? '9' : 'u';
          const c2 = c === 'H' ? 'G' : c === '9' ? '7' : 't';
          g.px(x - 1, y, '0'); g.px(x, y, c); g.px(x + 1, y, c2); g.px(x + 2, y, '0');
          if (y === 28 || y === 36) { g.px(x - 1, y, '0'); hl(g, x, x + 1, y, y === 28 ? '0' : c2); }
        } else {
          g.px(x - 1, y, '0'); g.px(x, y, (y & 1) ? 'e' : 'f'); g.px(x + 1, y, (y & 1) ? 'c' : 'd'); g.px(x + 2, y, '0');
        }
      }
      const xe = xAt(46);
      hl(g, xe - 1, xe + 2, 46, '0'); g.px(xe, 47, 'd'); g.px(xe + 1, 47, 'c');
    }),
  });

  // prop_bath 48×32 — the cold spring bath of the Cold Rite; pale water, still
  prop('prop_bath', 48, 32, {
    idle: anim(4, 3, (g, f) => {
      layer(g, (t) => {
        t.rect(1, 5, 46, 15, '6');
        t.rect(1, 20, 46, 10, M1); cylV(t, 1, 20, 46, 29, M1, ['3', '4', '5', '5', '6'], 0.25);
        masonry(t, 1, 20, 46, 29, { bh: 5, bw: 9, mortar: '3', seed: 5, only: '3456' });
        hl(t, 1, 46, 19, '7'); hl(t, 1, 46, 20, '5');
        hl(t, 1, 46, 5, '7'); vl(t, 1, 5, 19, '7');
        // water
        t.rect(5, 8, 38, 11, 'w');
        hl(t, 5, 42, 8, 'u'); hl(t, 5, 42, 9, 'v'); vl(t, 5, 9, 18, 'v'); vl(t, 42, 9, 18, 'v');
        for (let y = 10; y <= 18; y++) for (let x = 6; x <= 41; x++) if (((x * 3 + y * 7) % 11) === 0) t.px(x, y, 'x');
        // spout in the back rim: a carved hand
        t.rect(21, 3, 6, 4, '5'); hl(t, 21, 26, 3, '6'); t.px(23, 6, '2'); t.px(24, 6, '2');
        speck(t, 1, 5, 46, 15, ['5', '7'], 0.12, 9, '6');
        speck(t, 1, 5, 46, 25, ['B', 'C'], 0.05, 11, '4567');
        for (let x = 5; x <= 42; x++) if (x % 4 === 1) t.px(x, 19, 'C');
      });
      // slow light on the water
      const o = f * 4;
      for (const [x, y, n] of [[8, 11, 5], [22, 14, 7], [33, 10, 4], [14, 17, 4], [36, 16, 5]]) {
        const xx = 6 + wrap(x + o - 6, 36);
        for (let i = 0; i < n; i++) if (xx + i <= 41) g.px(xx + i, y, i === 0 || i === n - 1 ? 'x' : 'y');
      }
      g.px(23, 7, 'x'); g.px(24, 8, f & 1 ? 'y' : 'x');
    }),
  });

  // prop_sluice_wheel 32×32 — the handwheel that drowned Lenten Mere
  prop('prop_sluice_wheel', 32, 32, {
    idle: still((g) => {
      layer(g, (t) => {
        t.rect(5, 21, 22, 9, M1); cylV(t, 5, 21, 26, 29, M1, ['3', '4', '4', '5', '5'], 0.2);
        masonry(t, 5, 21, 26, 29, { bh: 4, bw: 7, mortar: '3', seed: 3, only: '345' });
        t.rect(4, 19, 24, 2, '6'); hl(t, 4, 27, 19, '7');
        t.rect(14, 17, 4, 3, '3'); hl(t, 14, 17, 17, '4');
        speck(t, 5, 21, 22, 9, ['u', 't'], 0.06, 5, '34');
        for (let y = 22; y <= 29; y++) if (y % 3 !== 0) t.px(19, y, 'u');
      });
      layer(g, (t) => {
        t.ring(15.5, 9.5, 8.5, '3'); t.ring(15.5, 9.5, 7.5, '2');
        for (let k = 0; k < 6; k++) {
          const a = k / 6 * TAU + 0.3;
          t.line(15.5 + Math.cos(a) * 1.5, 9.5 + Math.sin(a) * 1.5, 15.5 + Math.cos(a) * 7.5, 9.5 + Math.sin(a) * 7.5, '3');
        }
        t.circle(15.5, 9.5, 2, '4'); t.px(15, 9, '5'); t.px(16, 10, '2');
        for (let k = 0; k < 12; k++) {
          const a = k / 12 * TAU;
          t.px(Math.round(15.5 + Math.cos(a) * 9.5), Math.round(9.5 + Math.sin(a) * 9.5), '3');
        }
        for (let x = 0; x < 32; x++) for (let y = 0; y < 20; y++) {
          const c = t.get(x, y);
          if (c === '3' && (x - 15.5) + (y - 9.5) < -4 && ((x + y) % 3 === 0)) t.px(x, y, '5');
        }
        speck(t, 6, 0, 20, 20, ['c', 'l', 'd'], 0.12, 7, '23');
        vl(t, 15, 18, 19, '4'); vl(t, 16, 18, 19, '2');
      });
      for (let y = 12; y <= 22; y++) g.px(27, y, y & 1 ? '4' : '3');
      g.px(27, 11, '2'); g.px(26, 23, '3');
    }),
  });

  // ================================================================ FURNITURE
  // prop_barrel 16×20
  prop('prop_barrel', 16, 20, {
    idle: still((g) => layer(g, (t) => {
      for (let y = 4; y <= 18; y++) {
        const u = (y - 11) / 7;
        const r = 5.5 + 1 * (1 - u * u);
        hl(t, Math.round(7.5 - r), Math.round(7.5 + r), y, M1);
      }
      cylV(t, 0, 4, 15, 18, M1, WOOD, 0.3);
      for (let x = 2; x <= 13; x += 3) for (let y = 5; y <= 17; y++) if (t.get(x, y) != null) t.px(x, y, t.get(x, y) === 'e' ? 'd' : 'b');
      for (const y of [6, 11, 16]) for (let x = 0; x < 16; x++) if (t.get(x, y) != null) { t.px(x, y, x < 5 ? '4' : x < 11 ? '3' : '2'); }
      for (const y of [6, 11, 16]) t.px(3, y, '5');
      t.ellipse(7.5, 4, 5.5, 1.6, 'd'); hl(t, 3, 12, 3, 'e'); hl(t, 4, 11, 5, 'c');
      t.ellipse(7.5, 4, 6.5, 2, null);
      for (let x = 1; x <= 14; x++) for (let y = 1; y <= 7; y++) {
        const dx = (x - 7.5) / 7, dy = (y - 4) / 2.5;
        const d = dx * dx + dy * dy;
        if (d <= 1 && d > 0.62) t.px(x, y, y < 4 ? '4' : '3');
        else if (d <= 0.62) t.px(x, y, ((x + 1) % 3 === 0) ? 'c' : (y < 4 ? 'e' : 'd'));
      }
      dust(t, 0, 0, 15, 8, ['6', '7'], 0.3, 3);
    })),
  });

  // prop_crate 16×16
  prop('prop_crate', 16, 16, {
    idle: still((g) => layer(g, (t) => {
      t.rect(1, 2, 14, 4, 'e'); hl(t, 1, 14, 2, 'f');
      for (let y = 3; y <= 5; y += 2) hl(t, 2, 13, y, 'd');
      t.rect(1, 6, 14, 9, 'd');
      t.box(1, 6, 14, 9, 'c');
      for (let y = 8; y <= 12; y += 2) hl(t, 2, 13, y, 'c');
      t.line(2, 13, 13, 7, 'e'); t.line(2, 14, 13, 8, 'c');
      vl(t, 14, 6, 14, 'b'); hl(t, 1, 14, 14, 'b');
      for (const [x, y] of [[2, 7], [13, 7], [2, 13], [13, 13]]) t.px(x, y, '3');
      speck(t, 1, 2, 14, 13, ['5', 'c'], 0.05, 5);
      dust(t, 0, 0, 15, 6, ['6', '7'], 0.3, 7);
    })),
  });

  // prop_cart 32×24 — an abandoned handcart, one wheel, sacks under a tarp
  prop('prop_cart', 32, 24, {
    idle: still((g) => {
      layer(g, (t) => {
        t.line(22, 13, 31, 20, 'c'); t.line(22, 14, 30, 21, 'b');
        t.line(20, 11, 29, 17, 'd');
      });
      layer(g, (t) => {
        t.rect(2, 8, 22, 5, 'd'); for (let y = 9; y <= 12; y += 2) hl(t, 2, 23, y, 'c');
        t.rect(2, 13, 22, 3, 'c'); hl(t, 2, 23, 13, 'e'); hl(t, 2, 23, 15, 'b');
        hl(t, 10, 13, 10, 'a'); hl(t, 10, 13, 11, 'a');
        for (const x of [3, 12, 22]) { vl(t, x, 4, 13, 'c'); t.px(x, 4, 'e'); }
        hl(t, 3, 22, 5, 'c'); hl(t, 3, 22, 4, 'd');
        speck(t, 2, 4, 22, 12, ['5', '6'], 0.08, 3, 'cde');
      });
      layer(g, (t) => {
        orb(t, 8, 6, 4, 3, ['4', '5', '6', '7']); orb(t, 15, 7, 3.5, 2.5, ['4', '5', '6', '7']);
        t.poly([[13, 3], [22, 5], [21, 10], [12, 9]], 'C'); hl(t, 14, 21, 4, 'D'); t.px(21, 10, 'B'); t.px(18, 9, 'B'); t.px(13, 8, 'B');
        t.px(8, 3, '5'); t.px(9, 4, 'd');
      });
      layer(g, (t) => {
        t.ring(9.5, 17, 5, 'b'); t.ring(9.5, 17, 4, 'c'); t.ring(9.5, 17, 5.6, '3');
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; t.line(9.5, 17, 9.5 + Math.cos(a) * 4, 17 + Math.sin(a) * 4, 'd'); }
        t.circle(9.5, 17, 1, '3'); t.px(9, 16, '5');
        for (let x = 4; x <= 7; x++) t.px(x, 13, 'e');
      });
      dust(g, 0, 0, 31, 23, ['6', '7'], 0.35, 5);
    }),
  });

  // prop_bookshelf 32×32
  prop('prop_bookshelf', 32, 32, {
    idle: still((g) => layer(g, (t) => {
      t.rect(1, 1, 30, 30, 'c'); hl(t, 1, 30, 1, 'e'); hl(t, 1, 30, 2, 'd');
      t.rect(3, 4, 26, 24, 'a');
      for (const y of [11, 19, 27]) { hl(t, 2, 29, y, 'd'); hl(t, 2, 29, y + 1, 'b'); }
      vl(t, 1, 1, 30, 'd'); vl(t, 30, 1, 30, 'b'); vl(t, 2, 3, 28, 'b'); vl(t, 29, 3, 28, 'b');
      const cols = ['H', 'G', 'c', 'J', 'u', 'C', '5', 'd', 'K', 't', 'F'];
      const r = U.rng(1234);
      for (const [top, base] of [[4, 10], [12, 18], [20, 26]]) {
        let x = 3;
        while (x < 28) {
          if (r() < 0.12) { x += 2; continue; }
          const bw = r() < 0.6 ? 2 : 1, bh = 3 + Math.floor(r() * 4), c = cols[Math.floor(r() * cols.length)];
          if (x + bw > 29) break;
          const lean = r() < 0.1 && bw === 2;
          for (let i = 0; i < bw; i++) for (let y = base - bh + 1; y <= base; y++) t.px(x + i + (lean && y < base - 2 ? 1 : 0), y, c);
          t.px(x, base - bh + 1, c === '5' ? '6' : 'g');
          if (bh > 4) t.px(x, base - 1, 'L');
          x += bw + (r() < 0.2 ? 1 : 0);
        }
      }
      // a skull and a stub on the middle shelf, cobweb in the corner
      skull(t, 25, 16.5); t.px(25, 18, '6');
      t.line(3, 4, 7, 4, '7'); t.line(3, 5, 5, 7, '7'); t.px(6, 5, '6'); t.px(4, 6, '6');
      dust(t, 0, 0, 31, 31, ['6', '7'], 0.3, 5);
    })),
  });

  // prop_desk 32×24 — a scribe's slanted desk: an unfinished letter, ink, a quill
  prop('prop_desk', 32, 24, {
    idle: still((g) => {
      layer(g, (t) => {
        t.rect(3, 15, 2, 7, 'c'); t.rect(27, 15, 2, 7, 'b'); hl(t, 4, 27, 19, 'b');
        t.rect(2, 12, 28, 3, 'c'); hl(t, 2, 29, 12, 'd'); hl(t, 2, 29, 14, 'b');
        t.poly([[2, 6], [29, 6], [30, 11], [1, 11]], 'd');
        for (let y = 7; y <= 10; y += 2) hl(t, 2, 29, y, 'e');
        hl(t, 1, 30, 11, 'c'); hl(t, 2, 29, 6, 'e');
      });
      layer(g, (t) => {
        t.poly([[5, 7], [12, 6], [13, 10], [6, 11]], '9'); hl(t, 6, 11, 8, '6'); hl(t, 7, 11, 9, '7');
        t.rect(15, 6, 8, 5, '9'); vl(t, 19, 6, 10, '6'); hl(t, 15, 18, 10, '8');
        for (const y of [7, 9]) { hl(t, 16, 18, y, '7'); hl(t, 20, 22, y, '7'); }
      }, '1');
      layer(g, (t) => { t.rect(25, 5, 3, 3, '1'); hl(t, 25, 27, 5, '3'); t.px(25, 6, '4'); });
      g.line(26, 4, 29, 0, '9'); g.px(28, 0, '8'); g.px(29, 1, '8');
      g.px(8, 9, 'H'); g.px(9, 9, 'G');
    }),
  });

  // prop_cot 16×24 — infirmary cot, head at the top; `body` = a small shrouded body
  function drawCot(g, body) {
    layer(g, (t) => {
      t.rect(1, 2, 14, 19, 'c');
      vl(t, 1, 2, 22, 'd'); vl(t, 14, 2, 22, 'b'); vl(t, 2, 3, 20, 'c'); vl(t, 13, 3, 20, 'b');
      hl(t, 1, 14, 2, 'e'); hl(t, 1, 14, 3, 'c'); hl(t, 1, 14, 20, 'd'); hl(t, 1, 14, 21, 'b');
      vl(t, 1, 21, 22, 'b'); vl(t, 14, 21, 22, 'a');
      t.rect(3, 4, 10, 16, 'e'); speck(t, 3, 4, 10, 16, ['f', 'd'], 0.25, 3);
      t.rect(4, 4, 8, 3, '8'); hl(t, 4, 11, 4, '9'); hl(t, 4, 11, 6, '7');
      if (!body) {
        t.rect(3, 10, 10, 10, '5'); hl(t, 3, 12, 10, '6'); hl(t, 3, 12, 11, '7');
        for (let y = 13; y <= 19; y += 3) hl(t, 4, 11, y, '4');
        t.px(5, 12, '4'); t.px(9, 15, '6'); t.px(12, 17, '4');
        t.px(6, 5, '7'); t.px(9, 5, '7');
      }
    });
    if (body) layer(g, (t) => {
      t.ellipse(7.5, 6, 2.5, 2, M1);
      t.ellipse(7.5, 12, 3.5, 5, M1);
      t.ellipse(7.5, 16.5, 2.5, 2.5, M1);
      orb(t, 6.5, 9, 5, 9, LINEN, M1);
      hl(t, 5, 10, 8, 'd'); hl(t, 4, 11, 13, 'd'); hl(t, 5, 10, 17, 'd');
      t.px(6, 11, '6'); t.px(9, 15, '6');
    });
  }
  prop('prop_cot', 16, 24, {
    idle: still((g) => drawCot(g, false)),
    body: still((g) => drawCot(g, true)),
  });

  // prop_bed 24×32
  prop('prop_bed', 24, 32, {
    idle: still((g) => layer(g, (t) => {
      for (let x = 1; x <= 22; x++) { const top = 2 + Math.round(Math.abs(x - 11.5) / 4); vl(t, x, top, 8, 'c'); t.px(x, top, 'e'); }
      vl(t, 1, 2, 30, 'd'); vl(t, 22, 2, 30, 'b'); t.px(1, 1, 'e'); t.px(22, 1, 'd');
      hl(t, 3, 20, 6, 'b'); t.px(11, 4, 'b'); t.px(12, 4, 'b');
      t.rect(2, 9, 20, 18, '8');
      t.rect(4, 9, 16, 4, '9'); hl(t, 4, 19, 12, '7'); t.px(4, 9, '8'); t.px(19, 9, '8');
      t.rect(2, 14, 20, 13, M1); cylV(t, 2, 14, 21, 26, M1, WINE, 0.35);
      hl(t, 2, 21, 14, '9'); hl(t, 2, 21, 15, '8');
      for (let y = 18; y <= 25; y += 3) for (let x = 3; x <= 20; x += 4) t.px(x + (y & 1), y, 'F');
      t.rect(1, 26, 22, 4, 'c'); hl(t, 1, 22, 26, 'e'); hl(t, 1, 22, 27, 'd'); hl(t, 1, 22, 29, 'b');
      t.px(1, 30, 'b'); t.px(22, 30, 'a');
      dust(t, 0, 0, 23, 31, ['6', '7'], 0.25, 5);
      speck(t, 2, 9, 20, 18, ['6', '7'], 0.05, 7);
    })),
  });

  // prop_table_feast 64×32 — a long table set for children who never came; everything gone to dust
  prop('prop_table_feast', 64, 32, {
    idle: still((g) => {
      layer(g, (t) => {
        for (const x of [5, 30, 57]) { t.rect(x, 22, 2, 8, 'b'); t.px(x, 22, 'c'); }
        t.rect(2, 9, 60, 10, '7');
        hl(t, 2, 61, 9, '8');
        speck(t, 2, 9, 60, 10, ['8', '6'], 0.12, 3);
        for (let x = 2; x <= 61; x++) {
          const drop = 23 + ((x % 8) < 4 ? 0 : 1) - ((x % 8) === 0 ? 1 : 0);
          for (let y = 19; y <= drop; y++) t.px(x, y, y === 19 ? '8' : (x % 8 === 6 ? '5' : '6'));
        }
        for (let x = 6; x <= 58; x += 8) vl(t, x, 20, 22, '5');
        // a wine stain, long dry
        t.ellipse(44, 14, 3, 1.2, 'G'); t.px(47, 14, 'H'); vl(t, 46, 19, 21, 'G');
      });
      // plates, small cups, one tipped goblet
      const plates = [[8, 11], [17, 11], [26, 11], [39, 11], [48, 11], [56, 11], [11, 16], [21, 16], [42, 16], [52, 16]];
      for (const [x, y] of plates) layer(g, (t) => {
        t.ellipse(x, y, 2.5, 1, '8'); t.px(x - 1, y, '9'); t.px(x, y, '6'); t.px(x + 1, y, '7');
      }, '3');
      for (const [x, y] of [[12, 10], [22, 10], [44, 10], [52, 10], [15, 15], [47, 15]]) layer(g, (t) => {
        vl(t, x, y - 2, y, 'K'); t.px(x, y - 3, 'L'); t.px(x + 1, y - 3, 'J'); t.px(x - 1, y, 'J'); t.px(x + 1, y, 'J');
      }, '1');
      layer(g, (t) => { hl(t, 36, 38, 15, 'K'); t.px(39, 15, 'L'); t.px(39, 14, 'J'); t.px(36, 16, 'J'); }, '1');
      // a platter with a grey loaf, a bowl of shrivelled fruit
      layer(g, (t) => {
        t.ellipse(31.5, 15, 5, 1.5, 'K'); orb(t, 31, 13.5, 3.5, 2, ['c', 'd', '6', '7']);
        t.ellipse(18, 13, 2.5, 1.2, '6'); t.px(17, 12, 'C'); t.px(19, 12, 'b'); t.px(18, 11, 'D');
      }, '1');
      // candelabrum with dead candles, and the cobwebs that have claimed it
      layer(g, (t) => {
        t.rect(30, 10, 3, 1, '3'); vl(t, 31, 4, 9, '4'); vl(t, 32, 4, 9, '2');
        hl(t, 27, 36, 5, '3'); vl(t, 27, 3, 5, '3'); vl(t, 36, 3, 5, '3');
        candle(t, 27, 2, 2, 1); candle(t, 31, 3, 3, 2); candle(t, 36, 2, 2, 1);
      });
      g.px(27, 0, '2'); g.px(31, 0, '2'); g.px(36, 0, '2');
      g.line(36, 3, 44, 9, '7'); g.line(38, 4, 41, 9, '6'); g.line(27, 3, 22, 8, '7'); g.px(24, 5, '6'); g.px(40, 6, '6');
      dust(g, 2, 0, 61, 30, ['6', '7', '8'], 0.3, 9);
    }),
  });

  // prop_throne 32×40 — the empty throne of Lanthorn
  prop('prop_throne', 32, 40, {
    idle: still((g) => {
      layer(g, (t) => {
        t.rect(1, 33, 30, 2, '6'); hl(t, 1, 30, 33, '7');
        t.rect(1, 35, 30, 4, M1); cylV(t, 1, 35, 30, 38, M1, ['3', '4', '5', '5'], 0.2);
        masonry(t, 1, 35, 30, 38, { bh: 4, bw: 8, mortar: '3', seed: 4, only: '345' });
        speck(t, 1, 33, 30, 2, ['8', '5'], 0.25, 3);
      });
      layer(g, (t) => {
        // high back with three spires
        t.rect(8, 6, 16, 22, 'b');
        t.poly([[8, 6], [10, 6], [9, 0]], 'b'); t.poly([[22, 6], [24, 6], [23, 0]], 'b'); t.poly([[14, 5], [18, 5], [16, -1]], 'b');
        t.poly([[10, 6], [14, 6], [12, 3]], 'b'); t.poly([[18, 6], [22, 6], [20, 3]], 'b');
        vl(t, 8, 1, 27, 'c'); vl(t, 23, 1, 27, 'a');
        // faded upholstery with a gilt lantern
        t.rect(10, 8, 12, 15, M1); cylV(t, 10, 8, 21, 22, M1, WINE, 0.3);
        t.box(10, 8, 12, 15, 'K'); t.px(10, 8, 'L');
        hl(t, 15, 16, 11, 'L'); t.rect(15, 12, 2, 3, 'K'); t.px(15, 12, 'M'); hl(t, 14, 17, 15, 'J');
        t.px(9, 1, 'L'); t.px(23, 1, 'K'); t.px(16, 0, 'M'); t.px(12, 4, 'K'); t.px(20, 4, 'K');
        // arms and seat
        t.rect(4, 18, 5, 12, 'c'); t.rect(23, 18, 5, 12, 'b');
        hl(t, 4, 8, 18, 'd'); hl(t, 23, 27, 18, 'c'); t.rect(4, 16, 3, 3, 'd'); t.rect(25, 16, 3, 3, 'c');
        t.px(4, 16, 'L'); t.px(25, 16, 'K');
        t.rect(9, 22, 14, 4, 'H'); hl(t, 9, 22, 22, 'I'); hl(t, 9, 22, 25, 'G');
        t.rect(9, 26, 14, 6, 'c'); hl(t, 9, 22, 26, 'd'); vl(t, 22, 26, 31, 'b');
        for (let x = 11; x <= 20; x += 3) t.px(x, 29, 'b');
        speck(t, 4, 0, 24, 32, ['a', 'd'], 0.06, 7, 'bc');
        dust(t, 0, 0, 31, 32, ['6', '7', '8'], 0.55, 9);
        speck(t, 9, 22, 14, 3, ['7', '6'], 0.25, 11, 'HIG');
      });
    }),
  });

  // prop_banner 16×32 — a standard of Lanthorn (a gold lantern on wine), torn
  prop('prop_banner', 16, 32, {
    idle: still((g) => {
      layer(g, (t) => {
        hl(t, 5, 10, 30, '3'); t.line(7, 27, 5, 30, '3'); t.line(8, 27, 10, 30, '3');
        vl(t, 7, 1, 29, 'c'); vl(t, 8, 1, 29, 'b');
        t.px(7, 0, 'L'); t.px(8, 0, 'K');
        hl(t, 2, 13, 3, 'c'); t.px(2, 3, 'L'); t.px(13, 3, 'K');
      });
      layer(g, (t) => {
        for (let y = 4; y <= 24; y++) for (let x = 3; x <= 12; x++) {
          if (y > 19 && x >= 6 && x <= 9 && y - 19 > Math.abs(x - 7.5) * 1.6 - 1) continue;
          if (y === 24 && (x === 3 || x === 12)) continue;
          t.px(x, y, M1);
        }
        t.px(4, 23, null); t.px(4, 24, null); t.px(11, 16, null); t.px(12, 17, null); t.px(12, 18, null);
        cylV(t, 3, 4, 12, 24, M1, WINE, 0.3);
        hl(t, 3, 12, 4, 'H');
        // lantern emblem
        t.px(7, 7, 'L'); t.px(8, 7, 'K'); hl(t, 6, 9, 8, 'L');
        t.rect(6, 9, 4, 4, 'K'); vl(t, 6, 9, 12, 'L'); t.px(7, 10, 'M'); t.px(8, 10, 'L'); t.px(7, 11, 'L');
        hl(t, 6, 9, 13, 'J');
        for (let y = 6; y <= 22; y += 4) { t.px(3, y, 'G'); t.px(12, y + 1, 'F'); }
      });
    }),
  });

  // prop_weapon_rack 32×24
  prop('prop_weapon_rack', 32, 24, {
    idle: still((g) => {
      layer(g, (t) => {
        vl(t, 2, 6, 22, 'd'); vl(t, 3, 6, 22, 'b'); vl(t, 28, 6, 22, 'c'); vl(t, 29, 6, 22, 'b');
        hl(t, 1, 30, 6, 'd'); hl(t, 1, 30, 7, 'b'); hl(t, 2, 29, 17, 'c'); hl(t, 2, 29, 18, 'b');
        hl(t, 0, 5, 22, 'c'); hl(t, 26, 31, 22, 'c');
      });
      layer(g, (t) => {
        for (const x of [6, 10, 22]) {
          vl(t, x, 3, 21, 'c'); t.px(x, 21, 'b');
          t.px(x, 0, '6'); t.px(x - 1, 1, '5'); t.px(x, 1, '7'); t.px(x + 1, 1, '4'); t.px(x, 2, '5');
        }
        vl(t, 14, 4, 16, '7'); vl(t, 15, 4, 16, '5'); hl(t, 12, 17, 17, '4'); t.rect(14, 18, 2, 3, 'b'); t.px(14, 21, 'K');
        vl(t, 18, 2, 21, 'b');
        t.poly([[19, 2], [22, 3], [22, 7], [19, 6]], '5'); t.px(21, 3, '6'); t.px(17, 3, '4'); t.px(18, 1, '5');
        t.circle(25.5, 13.5, 3.5, 'c'); t.circle(25.5, 13.5, 2.5, 'd'); t.circle(25.5, 13.5, 1, '4'); t.px(24, 12, 'e');
        speck(t, 0, 0, 32, 22, ['c', 'l'], 0.1, 5, '4567');
      });
    }),
  });

  // prop_loom 24×24 — an upright loom with a half-woven cloth, threads snapped
  prop('prop_loom', 24, 24, {
    idle: still((g) => {
      layer(g, (t) => {
        vl(t, 2, 1, 22, 'd'); vl(t, 3, 1, 22, 'b'); vl(t, 20, 1, 22, 'c'); vl(t, 21, 1, 22, 'b');
        t.rect(1, 1, 22, 2, 'd'); hl(t, 1, 22, 1, 'e');
        t.rect(1, 16, 22, 2, 'c'); hl(t, 1, 22, 16, 'd');
        hl(t, 0, 5, 22, 'c'); hl(t, 18, 23, 22, 'c');
        for (let x = 4; x <= 19; x++) for (let y = 3; y <= 15; y++) {
          if (y < 9) { if ((x & 1) === 0 && !(x === 12 && y > 5)) t.px(x, y, '7'); }
          else t.px(x, y, ((x + y) & 1) ? 'H' : ((y % 4 === 1) ? 'g' : 'G'));
        }
        hl(t, 4, 19, 9, 'f'); t.px(12, 6, '7'); t.px(13, 7, '6');
        t.rect(8, 8, 6, 1, 'e'); t.px(7, 8, 'd'); t.px(14, 8, 'd');
        speck(t, 4, 9, 16, 7, ['6', '7'], 0.12, 5);
      });
    }),
  });

  // prop_signpost 16×24
  prop('prop_signpost', 16, 24, {
    idle: still((g) => {
      layer(g, (t) => { vl(t, 7, 2, 22, 'd'); vl(t, 8, 2, 22, 'b'); t.px(7, 1, 'e'); t.px(8, 1, 'c'); t.ellipse(7.5, 22, 3, 1, 'b'); });
      layer(g, (t) => {
        t.poly([[2, 4], [12, 4], [14, 6], [12, 8], [2, 8]], 'd'); hl(t, 2, 12, 4, 'e'); hl(t, 2, 12, 8, 'c');
        hl(t, 4, 6, 6, 'b'); hl(t, 8, 11, 6, 'b');
        t.poly([[3, 11], [13, 11], [13, 15], [3, 15], [1, 13]], 'c'); hl(t, 3, 13, 11, 'd'); hl(t, 3, 13, 15, 'b');
        hl(t, 5, 7, 13, 'a'); hl(t, 9, 11, 13, 'a');
        speck(t, 1, 4, 14, 12, ['5', '6'], 0.08, 3, 'cde');
        dust(t, 0, 0, 15, 16, ['6', '7'], 0.5, 5);
      });
    }),
  });

  // prop_door_wood 16×24 — plank door in a stone frame; `open` shows the dark within
  function drawDoor(g, open) {
    layer(g, (t) => {
      t.rect(0, 0, 16, 23, '4');
      masonry(t, 0, 0, 15, 22, { bh: 4, bw: 6, fills: ['4', '5', '4'], mortar: '3', hi: '5', seed: 9 });
      for (let y = 3; y <= 22; y++) for (let x = 2; x <= 13; x++) {
        if (y === 3 && (x < 4 || x > 11)) continue;
        if (y === 4 && (x < 3 || x > 12)) continue;
        t.px(x, y, M1);
      }
      if (!open) {
        for (let y = 3; y <= 22; y++) for (let x = 2; x <= 13; x++) if (t.get(x, y) === M1) {
          const k = (x - 2) % 4;
          t.px(x, y, k === 0 ? 'b' : k === 1 ? 'd' : 'c');
        }
        for (const y of [7, 17]) { hl(t, 2, 13, y, '2'); hl(t, 2, 13, y - 1, '3'); t.px(3, y, '5'); t.px(7, y, '4'); t.px(11, y, '4'); }
        t.ring(10.5, 12.5, 1.2, '4'); t.px(10, 11, '5');
        speck(t, 2, 3, 12, 20, ['a', '5'], 0.05, 3, 'cd');
      } else {
        for (let y = 3; y <= 22; y++) for (let x = 2; x <= 13; x++) if (t.get(x, y) === M1) t.px(x, y, y < 8 ? '0' : '1');
        for (let y = 4; y <= 22; y++) { t.px(2, y, 'c'); t.px(3, y, y % 5 === 2 ? '2' : 'b'); }
        hl(t, 4, 13, 22, '2');
      }
      hl(t, 1, 14, 22, '3');
    });
  }
  prop('prop_door_wood', 16, 24, {
    idle: still((g) => drawDoor(g, false)),
    open: still((g) => drawDoor(g, true)),
  });

  // prop_gate_bars 48×32 — iron road gate between stone posts; `open` swings the leaves back
  function drawGateBars(g, open) {
    layer(g, (t) => {
      for (const x0 of [0, 42]) {
        t.rect(x0, 4, 6, 27, M1); cylV(t, x0, 4, x0 + 5, 30, M1, ['3', '4', '5', '5', '6'], 0.3);
        masonry(t, x0, 4, x0 + 5, 30, { bh: 5, bw: 6, mortar: '3', seed: x0 + 1, only: '3456' });
        t.rect(x0 - 1 < 0 ? 0 : x0 - 1, 2, x0 === 0 ? 7 : 7, 2, '6'); hl(t, Math.max(0, x0 - 1), Math.min(47, x0 + 6), 2, '7');
        t.poly([[x0 + 1, 2], [x0 + 4, 2], [x0 + 2.5, 0]], '5');
      }
      speck(t, 0, 0, 48, 31, ['C', 'D'], 0.04, 7, '456');
      dust(t, 0, 0, 47, 31, ['7', '8'], 0.5, 9);
    });
    if (!open) {
      for (let x = 7; x <= 40; x += 4) {
        vl(g, x, 5, 30, '4'); vl(g, x + 1, 5, 30, '2'); g.px(x, 30, '1');
        g.px(x, 4, '5'); g.px(x + 1, 4, '3'); g.px(x, 3, '5');
      }
      for (const y of [8, 25]) { hl(g, 6, 41, y, '3'); hl(g, 6, 41, y + 1, '1'); for (let x = 7; x <= 40; x += 4) g.px(x, y, '5'); }
      vl(g, 23, 4, 30, '0');
      g.rect(21, 14, 5, 5, 'K'); hl(g, 21, 25, 14, 'L'); g.px(21, 14, 'M'); vl(g, 25, 14, 18, 'J'); g.px(23, 16, '1'); g.px(23, 17, '1');
      g.ring(23, 12, 1.5, '4'); g.px(22, 12, '5');
      for (let x = 17; x <= 29; x += 2) g.px(x, 15 + (x % 4 === 1 ? 0 : 1), '4');
    } else {
      for (const side of [0, 1]) {
        for (let k = 0; k < 4; k++) {
          const x = side ? 41 - k * 2 : 6 + k * 2;
          const top = 5 + k, bot = 30 - Math.floor(k / 2);
          vl(g, x, top, bot, k & 1 ? '2' : '3'); g.px(x, top - 1, '4');
        }
        const xa = side ? 41 : 6, xb = side ? 35 : 12;
        g.line(xa, 8, xb, 11, '3'); g.line(xa, 25, xb, 26, '3');
      }
    }
  }
  prop('prop_gate_bars', 48, 32, {
    idle: still((g) => drawGateBars(g, false)),
    open: still((g) => drawGateBars(g, true)),
  });

  // ================================================================ COUNTRY & FIELD
  // prop_spade 16×24 — Mound's spade left in the earth
  prop('prop_spade', 16, 24, {
    idle: still((g) => {
      layer(g, (t) => { t.ellipse(7.5, 20, 6, 2.5, M1); orb(t, 7, 19, 7, 3.5, EARTH, M1); speck(t, 1, 17, 14, 6, ['b', 'd'], 0.25, 3); });
      layer(g, (t) => {
        t.poly([[5, 13], [10, 12], [10, 18], [6, 19]], '5'); t.line(5, 13, 10, 12, '7'); vl(t, 6, 14, 18, '6'); vl(t, 9, 13, 17, '4');
        t.px(8, 17, 'c'); t.px(7, 16, 'd');
        t.line(7, 12, 5, 3, 'd'); t.line(8, 12, 6, 3, 'c');
        hl(t, 3, 7, 2, 'e'); t.px(3, 3, 'd'); t.px(7, 3, 'c'); hl(t, 3, 7, 1, 'd');
      });
      g.px(4, 16, 'b'); g.px(11, 18, 'd');
    }),
  });

  // prop_lilies 16×16 — grave-lilies, pale as candle-wax
  prop('prop_lilies', 16, 16, {
    idle: still((g) => {
      layer(g, (t) => {
        t.line(3, 14, 5, 7, 'B'); t.line(12, 14, 10, 8, 'B'); t.line(7, 14, 6, 9, 'C'); t.line(9, 14, 11, 12, 'C');
        t.line(2, 14, 1, 10, 'C'); t.line(13, 14, 14, 11, 'B'); t.line(6, 14, 7, 5, 'C'); t.line(10, 14, 9, 4, 'B');
        hl(t, 2, 13, 14, 'A');
      }, '1');
      for (const [x, y, flip] of [[5, 5, 0], [9, 3, 1], [11, 7, 1], [2, 8, 0], [7, 8, 1]]) layer(g, (t) => {
        const d = flip ? 1 : -1;
        t.px(x, y, 'T'); t.px(x + d, y, '9'); t.px(x, y + 1, '9'); t.px(x + d, y + 1, 'T'); t.px(x - d, y + 1, '8');
        t.px(x, y + 2, 'S'); t.px(x + d, y + 2, '8'); t.px(x + 2 * d, y + 2, '7');
        t.px(x - d, y - 1, 'C');
      }, '1');
      g.px(5, 7, 'x'); g.px(9, 5, 'x');
    }),
  });

  // prop_stag_skull 24×16 — antlers of a Hushwood shrine; `lit` has candles burning on the tines
  function drawStag(g, f, lit) {
    const wk = [];
    layer(g, (t) => {
      const ant = (s) => {
        const X = (x) => (s < 0 ? x : 23 - x);
        t.line(X(9), 6, X(6), 4, '8'); t.line(X(6), 4, X(1), 4, '8'); t.line(X(8), 7, X(5), 5, '7');
        t.line(X(3), 4, X(2), 1, '8'); t.line(X(6), 4, X(6), 1, '9'); t.line(X(4), 4, X(3), 7, '7');
        t.px(X(1), 3, '9');
      };
      ant(-1); ant(1);
      t.ellipse(11.5, 7.5, 3, 2.5, M1);
      t.poly([[9, 9], [14, 9], [13, 14], [10, 14]], M1);
      orb(t, 11, 8, 4, 5, BONE, M1);
      t.px(10, 8, '1'); t.px(13, 8, '1'); t.px(9, 8, '2'); t.px(14, 8, '3');
      t.px(11, 12, '2'); t.px(12, 12, '2'); hl(t, 11, 12, 14, '6');
      wk.push(candle(t, 6, 2, 2, 1), candle(t, 17, 2, 2, 1), candle(t, 2, 1, 1, 1));
      t.px(6, 3, 'g'); t.px(17, 3, 'f');
      speck(t, 0, 0, 24, 16, ['6'], 0.06, 3, '89');
    });
    wk.forEach((p, i) => { if (p[1] >= 0) wick(g, p, lit, f + i); });
  }
  prop('prop_stag_skull', 24, 16, {
    idle: still((g) => drawStag(g, 0, false)),
    lit: anim(4, 7, (g, i) => drawStag(g, i, true)),
  });

  // prop_toy_horse 12×10 — a child's wheeled horse, red paint almost gone
  prop('prop_toy_horse', 12, 10, {
    idle: still((g) => {
      layer(g, (t) => {
        hl(t, 1, 9, 7, 'c'); t.px(1, 7, 'd');
        t.rect(2, 3, 6, 3, 'd'); hl(t, 2, 7, 3, 'e'); hl(t, 3, 6, 5, 'c');
        t.rect(7, 1, 2, 3, 'd'); t.rect(8, 1, 2, 2, 'e'); t.px(9, 2, 'c'); t.px(8, 1, 'f');
        t.px(1, 3, 'b'); t.px(0, 4, 'b');
        vl(t, 3, 6, 6, 'c'); vl(t, 6, 6, 6, 'c');
        t.px(4, 3, 'H'); t.px(5, 3, 'I'); t.px(5, 4, 'H'); t.px(7, 0, 'b');
      });
      g.px(3, 8, '2'); g.px(7, 8, '2'); g.px(3, 9, '1'); g.px(7, 9, '1'); g.px(9, 2, '0');
    }),
  });

  // prop_drum 16×16 — the company drum of Greyharrow
  prop('prop_drum', 16, 16, {
    idle: still((g) => {
      layer(g, (t) => {
        t.rect(2, 5, 12, 9, M1); t.ellipse(7.5, 13, 6, 1.2, M1);
        cylV(t, 1, 5, 14, 14, M1, WINE, 0.3);
        for (const y of [5, 6]) hl(t, 2, 13, y, y === 5 ? 'e' : 'd');
        for (let x = 2; x <= 13; x++) { const yb = 12 + (Math.abs(x - 7.5) < 4 ? 1 : 0); t.px(x, yb, 'd'); t.px(x, yb + 1, 'c'); }
        for (let x = 2; x <= 13; x++) { const k = (x - 2) % 4; t.px(x, 7 + (k < 2 ? k * 2 : (4 - k) * 2), 'g'); }
        t.ellipse(7.5, 5, 6, 1.5, 'g'); hl(t, 4, 11, 4, '9'); t.px(7, 5, 'f'); t.px(10, 5, 'f');
        t.px(6, 9, 'L'); t.px(9, 9, 'K');
      });
      layer(g, (t) => { t.line(4, 2, 11, 6, 'e'); t.line(4, 6, 11, 2, 'd'); t.px(4, 2, 'f'); t.px(11, 2, 'c'); }, '1');
    }),
  });

  // prop_pikes 24×32 — pikes left standing in the mud
  prop('prop_pikes', 24, 32, {
    idle: still((g) => {
      layer(g, (t) => { t.ellipse(11.5, 28, 10, 2.5, M1); orb(t, 11, 27, 11, 4, ['a', 'b', 'c', 'b'], M1); speck(t, 1, 25, 22, 6, ['a', '3'], 0.2, 3); t.px(6, 28, 'u'); t.px(7, 28, 't'); });
      const P = [[7, 28, 2, 3], [11, 29, 12, 1], [15, 28, 20, 5], [18, 29, 23, 12]];
      P.forEach(([x0, y0, x1, y1], i) => layer(g, (t) => {
        t.line(x0, y0, x1, y1 + 3, i & 1 ? 'c' : 'd');
        const dx = x1 - x0, dy = y1 + 3 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        for (let k = 0; k <= 3; k++) t.px(Math.round(x1 - ux * (3 - k)), Math.round(y1 + 3 - uy * (3 - k) - 3 * 0), k < 2 ? '5' : '6');
        t.px(x1, y1, '7'); t.px(Math.round(x1 + ux * -1 + 1), Math.round(y1 + 1), '4');
        speck(t, 0, 0, 24, 32, ['c', 'l'], 0.3, 11 + i, '567');
      }));
      layer(g, (t) => {
        t.poly([[13, 3], [18, 5], [14, 7], [16, 9], [13, 9]], 'G'); t.px(14, 4, 'H'); t.px(15, 5, 'H'); t.px(13, 8, 'F');
      }, '1');
      layer(g, (t) => { orb(t, 5, 27, 2.5, 1.8, STEEL); hl(t, 3, 7, 28, '3'); t.px(4, 26, '7'); });
    }),
  });

  // prop_barricade 48×24 — carts, planks, barrels and stakes heaped across a road
  prop('prop_barricade', 48, 24, {
    idle: still((g) => {
      layer(g, (t) => { t.line(3, 20, 14, 4, 'c'); t.line(4, 20, 15, 4, 'b'); t.line(33, 3, 44, 19, 'c'); t.line(34, 3, 45, 19, 'd'); t.line(22, 2, 26, 20, 'b'); });
      layer(g, (t) => {
        // overturned cart bed, a wheel in the air
        t.poly([[8, 10], [30, 7], [32, 17], [10, 20]], 'c');
        for (let k = 0; k < 5; k++) t.line(8 + k * 0.2, 10 + k * 2.2, 30 + k * 0.4, 7 + k * 2.2, k & 1 ? 'd' : 'b');
        t.ring(20, 6, 4, 'b'); t.ring(20, 6, 3, 'd');
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; t.line(20, 6, 20 + Math.cos(a) * 3, 6 + Math.sin(a) * 3, 'c'); }
        t.px(20, 6, '3');
      });
      layer(g, (t) => { orb(t, 37, 14, 4, 5, WOOD); for (const y of [11, 16]) hl(t, 33, 41, y, '3'); t.ellipse(37, 9.5, 3, 1, 'd'); });
      layer(g, (t) => { t.rect(1, 13, 9, 8, 'd'); t.box(1, 13, 9, 8, 'c'); t.line(2, 19, 8, 14, 'e'); hl(t, 1, 9, 13, 'e'); });
      layer(g, (t) => {
        for (const [x, y, dx] of [[14, 21, -4], [22, 21, 0], [30, 21, 3], [41, 21, 5]]) { t.line(x, y, x + dx, y - 6, 'd'); t.px(x + dx, y - 6, 'e'); }
        orb(t, 26, 19, 4, 2.5, ['4', '5', '6', '7']);
      });
      speck(g, 0, 0, 48, 24, ['5', '6'], 0.06, 5, 'bcde');
      speck(g, 0, 0, 48, 24, ['a'], 0.05, 7, 'cd');
      dust(g, 0, 0, 47, 23, ['6', '7', '8'], 0.45, 9);
    }),
  });

  // prop_tent 40×32 — Hesk's patched tent
  prop('prop_tent', 40, 32, {
    idle: still((g) => {
      for (const [x0, y0, x1, y1] of [[20, 3, 1, 29], [20, 3, 38, 29]]) g.line(x0, y0, x1, y1, '5');
      layer(g, (t) => {
        t.poly([[20, 3], [35, 26], [37, 29], [3, 29], [5, 26]], M1);
        cylV(t, 2, 3, 38, 29, M1, ['4', '5', '6', '7', '7'], 0.35);
        // patches, stitching
        t.rect(8, 20, 5, 4, 'd'); t.box(8, 20, 5, 4, 'c'); t.rect(27, 15, 4, 5, 'C'); t.box(27, 15, 4, 5, 'B');
        t.rect(14, 9, 3, 3, 'H'); t.px(14, 9, 'I');
        for (let y = 21; y <= 23; y++) t.px(13, y, '2');
        for (let y = 7; y <= 27; y += 3) { t.px(20 - Math.floor((y - 3) * 0.64) + 1, y, '4'); t.px(20 + Math.floor((y - 3) * 0.64) - 1, y, '4'); }
        // the open flap
        t.poly([[20, 10], [26, 29], [15, 29]], '1'); t.poly([[20, 12], [24, 29], [17, 29]], '0');
        t.poly([[20, 10], [15, 29], [11, 29], [17, 17]], '7'); t.line(20, 10, 13, 29, '6'); t.px(15, 20, 'e'); t.px(16, 20, 'd');
        // bedroll inside, a bottle at the door
        t.rect(19, 25, 5, 3, 'C'); hl(t, 19, 23, 25, 'D');
        vl(t, 27, 25, 28, 'B'); t.px(27, 24, 'b'); t.px(26, 27, 'A');
        vl(t, 20, 0, 3, 'c'); t.px(20, 0, 'd');
        dust(t, 0, 0, 39, 30, ['8', '7'], 0.4, 3);
        speck(t, 2, 3, 36, 27, ['5', '4'], 0.05, 5, '67');
      });
      for (const x of [1, 38]) { g.px(x, 29, 'c'); g.px(x, 30, 'b'); }
      g.px(8, 30, '6'); g.px(31, 30, '6');
    }),
  });

  // prop_crow 12×10 — peck / look / fly
  const CROW = {
    stand: [
      '............', '......P11...', '.....1116145', '...P21111...', '.1P211111...', '11112111....',
      '...1111.....', '............', '............', '............'],
    look: [
      '......P1....', '.....1116...', '.....11114..', '...P21111...', '.1P211111...', '11112111....',
      '...1111.....', '............', '............', '............'],
    lookBack: [
      '............', '....611P....', '...54111....', '...P21111...', '.1P211111...', '11112111....',
      '...1111.....', '............', '............', '............'],
    peck: [
      '............', '1...........', '11P11.......', '.12P1111....', '..121111....', '...1111161..',
      '.......1145.', '........4...', '............', '............'],
  };
  function drawCrow(g, rows, legs) {
    layer(g, (t) => stampMap(t, 0, 0, rows, CROW_INK));
    for (const [x, y] of legs) { g.px(x, y, '4'); g.px(x, y + 1, '4'); }
    g.px(legs[0][0] + 1, legs[0][1] + 1, '3'); g.px(legs[1][0] + 1, legs[1][1] + 1, '3');
  }
  const CROW_LEGS = [[4, 7], [6, 7]];
  const CROW_INK = { '1': '2', '2': '3', 'P': 'R', '4': '5', '5': '6', '6': '8' };
  function crowFly(g, i) {
    layer(g, (t) => {
      stampMap(t, 0, 0, ['............', '............', '............', '.......1614.', '.1P2111111..', '11..2111....',
        '............', '............', '............', '............'], CROW_INK);
      if (i === 0) { t.poly([[4, 4], [8, 4], [5, 0], [3, 1]], '2'); t.px(4, 1, 'R'); t.px(5, 2, '3'); }
      else if (i === 1) { hl(t, 2, 8, 3, '2'); hl(t, 1, 5, 2, '2'); t.px(3, 2, 'R'); }
      else { t.poly([[4, 5], [8, 5], [6, 8], [3, 8]], '2'); t.px(4, 7, 'R'); }
    });
  }
  prop('prop_crow', 12, 10, {
    idle: {
      fps: 3,
      frames: [0, 0, 0, 1, 1, 0, 2, 2, 2, 3, 2, 2, 0, 0].map((k) => (g) => {
        if (k === 0) drawCrow(g, CROW.stand, CROW_LEGS);
        else if (k === 1) drawCrow(g, CROW.look, CROW_LEGS);
        else if (k === 2) drawCrow(g, CROW.peck, [[4, 7], [6, 7]]);
        else drawCrow(g, CROW.lookBack, CROW_LEGS);
      }),
    },
    peck: { fps: 4, frames: [(g) => drawCrow(g, CROW.stand, CROW_LEGS), (g) => drawCrow(g, CROW.peck, CROW_LEGS), (g) => drawCrow(g, CROW.peck, CROW_LEGS)] },
    look: { fps: 2, frames: [(g) => drawCrow(g, CROW.look, CROW_LEGS), (g) => drawCrow(g, CROW.stand, CROW_LEGS), (g) => drawCrow(g, CROW.lookBack, CROW_LEGS), (g) => drawCrow(g, CROW.stand, CROW_LEGS)] },
    fly: anim(3, 10, crowFly),
  });

  // ================================================================ HUSHWOOD & WICKWARD
  // prop_jar 8×12 — a drifting flame kept warm in a jar
  prop('prop_jar', 8, 12, {
    idle: anim(4, 4, (g, i) => jar(g, 1, 10, 6, 9, i, 0, true)),
    dark: still((g) => jar(g, 1, 10, 6, 9, 0, 0, false)),
  });

  // prop_jar_shelf 32×32 — the Moth-Wife's shelf of kept flames
  prop('prop_jar_shelf', 32, 32, {
    idle: anim(4, 4, (g, f) => {
      layer(g, (t) => {
        vl(t, 2, 1, 30, 'c'); vl(t, 3, 1, 30, 'b'); vl(t, 28, 1, 30, 'b'); vl(t, 29, 1, 30, 'a');
        for (const y of [1, 14, 27]) { hl(t, 1, 30, y, 'd'); hl(t, 1, 30, y + 1, 'b'); }
        t.px(1, 30, 'b'); t.px(30, 30, 'a');
        speck(t, 1, 1, 30, 30, ['5', 'a'], 0.06, 3, 'bcd');
      });
      jar(g, 5, 13, 5, 8, f, 0, true); jar(g, 12, 13, 4, 6, f, 2, true); jar(g, 18, 13, 6, 10, f, 1, true); jar(g, 25, 13, 3, 5, f, 3, false);
      jar(g, 5, 26, 4, 7, f, 3, true); jar(g, 11, 26, 6, 9, f, 1, true); jar(g, 19, 26, 4, 6, f, 0, false); jar(g, 24, 26, 3, 7, f, 2, true);
      g.line(3, 2, 7, 2, '7'); g.line(3, 3, 5, 6, '7'); g.px(5, 3, '6');
      const mx = [21, 22, 21, 20][f], my = [16, 17, 18, 17][f];
      g.px(mx, my, 'T'); g.px(mx + 1, my, f & 1 ? '8' : '9');
    }),
  });

  // prop_tag_chimes 16×24 — tin name-tags hung from a burnt post, swaying
  prop('prop_tag_chimes', 16, 24, {
    idle: anim(4, 3, (g, f) => {
      layer(g, (t) => {
        vl(t, 7, 3, 22, '2'); vl(t, 8, 3, 22, '1'); t.px(7, 10, 'k'); t.px(7, 16, '3');
        hl(t, 1, 14, 3, '2'); hl(t, 1, 14, 2, '3'); t.px(1, 2, '4'); t.px(14, 3, '1');
        t.ellipse(7.5, 22, 3, 1, '3'); t.px(6, 22, '5');
      });
      const tags = [[2, 4], [5, 7], [10, 5], [13, 8], [4, 3], [11, 2]];
      tags.forEach(([x, len], i) => {
        const sw = Math.round(Math.sin((f / 4) * TAU + i * 1.7) * (len > 4 ? 1 : 0.6));
        const ex = x + sw, ey = 3 + len;
        g.line(x, 4, ex, ey, '4');
        g.px(ex, ey + 1, '8'); g.px(ex + 1, ey + 1, '7');
        g.px(ex, ey + 2, '7'); g.px(ex + 1, ey + 2, '6');
        g.px(ex, ey + 3, '6'); g.px(ex + 1, ey + 3, '5');
        if ((f + i) % 4 === 0) g.px(ex, ey + 1, '9');
      });
    }),
  });

  // prop_hollow_tree 64×80 — the Moth-Wife's vast pale tree: a door in its roots, jars in its arms
  let TREE = null;
  function treeBase() {
    if (TREE) return TREE;
    const g = art.grid(64, 80);
    const r = U.rng(4242);
    const t = art.grid(64, 80);
    const branch = (x, y, a, len, w, depth) => {
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      const mx = (x + ex) / 2 + Math.cos(a + 1.57) * (r() - 0.5) * len * 0.3, my = (y + ey) / 2 + Math.sin(a + 1.57) * (r() - 0.5) * len * 0.3;
      thick(t, x, y, mx, my, w, M1); thick(t, mx, my, ex, ey, Math.max(0.5, w * 0.8), M1);
      if (depth <= 0 || len < 3) return;
      const n = depth > 2 ? 2 : (r() < 0.5 ? 2 : 3);
      for (let k = 0; k < n; k++) {
        const na = a + (k - (n - 1) / 2) * (0.55 + r() * 0.3) - 0.08;
        const clamped = Math.max(-Math.PI + 0.25, Math.min(-0.25, na));
        branch(ex, ey, clamped, len * (0.62 + r() * 0.15), Math.max(0.5, w * 0.62), depth - 1);
      }
    };
    branch(28, 38, -2.35, 14, 3, 4);
    branch(35, 38, -0.8, 14, 3, 4);
    branch(31.5, 36, -1.62, 11, 2.5, 3);
    branch(24, 44, -2.8, 9, 2, 3);
    branch(40, 46, -0.35, 9, 2, 2);
    // trunk
    t.poly([[21, 36], [42, 36], [44, 50], [48, 62], [55, 72], [60, 76], [4, 76], [9, 72], [16, 62], [19, 50]], M1);
    for (const [x0, x1, y1] of [[14, 1, 78], [19, 7, 78], [44, 57, 78], [49, 63, 78], [30, 22, 78], [36, 44, 78]]) thick(t, x0, 68, x1, y1, 2.2, M1);
    // shade: trunk as a cylinder, branches lit on top
    cylV(t, 0, 36, 63, 78, M1, BARK, 0.32);
    for (let y = 0; y < 38; y++) for (let x = 0; x < 64; x++) {
      if (t.get(x, y) !== M1) continue;
      const up = t.get(x, y - 1), dn = t.get(x, y + 1);
      t.px(x, y, up == null ? 'T' : dn == null ? '6' : 'S');
    }
    t.replace(M1, 'S');
    // bark fissures
    for (const x0 of [22, 27, 33, 38, 43, 16, 50]) {
      let x = x0;
      for (let y = 38; y <= 75; y++) {
        if (r() < 0.25) x += r() < 0.5 ? -1 : 1;
        if (t.get(x, y) != null) t.px(x, y, (t.get(x, y) === 'T' || t.get(x, y) === 'S') ? '6' : '5');
      }
    }
    // knots
    t.ellipse(24, 47, 1.5, 2.5, '1'); t.px(23, 44, '7'); t.ellipse(40, 42, 1, 1.5, '1');
    // the doorway in the roots
    for (let y = 56; y <= 78; y++) for (let x = 22; x <= 41; x++) {
      if (inArch(x, y, 31.5, 66, 7, 10)) t.px(x, y, y < 64 ? '0' : '1');
      else if (inArch(x, y, 31.5, 66, 9, 12) && t.get(x, y) != null) t.px(x, y, 'T');
    }
    for (let x = 26; x <= 37; x++) { t.px(x, 77, x % 3 ? 't' : 's'); if (x > 27 && x < 36) t.px(x, 76, 's'); }
    t.px(30, 74, 'v'); t.px(31, 74, 'w'); t.px(31, 73, 'v');
    for (let x = 23; x <= 40; x++) t.px(x, 78, 'S');
    speck(t, 0, 36, 64, 44, ['7', '6', 'T'], 0.06, 17, 'S');
    t.outline('0');
    g.blit(t, 0, 0);
    // ferns & ash at the foot
    for (const [x, s] of [[3, 1], [12, -1], [53, 1], [60, -1]]) { g.line(x, 78, x + s * 2, 74, 'C'); g.line(x, 78, x - s, 75, 'D'); }
    // jar hanging points: lowest branch pixel above y 34 at each chosen x
    const hangs = [];
    for (const x of [7, 16, 26, 40, 49, 57]) {
      let hy = -1;
      for (let y = 34; y >= 4; y--) { const c = g.get(x, y); if (c != null && c !== '0') { hy = y; break; } }
      if (hy >= 0) hangs.push([x, hy + 2, 3 + ((x * 7) % 5)]);
    }
    TREE = { g, hangs };
    return TREE;
  }
  prop('prop_hollow_tree', 64, 80, {
    idle: anim(6, 5, (g, f) => {
      const T = treeBase();
      g.blit(T.g, 0, 0);
      T.hangs.forEach(([x, y, len], i) => {
        vl(g, x, y - 1, y + len - 1, '4');
        const glowF = Math.floor(f * 4 / 6);
        jar(g, x - 1, y + len + 4, 3 + (i & 1), 5 + (i % 3 === 0 ? 1 : 0), glowF, i, true);
      });
      // moths circling the jars
      T.hangs.slice(0, 5).forEach(([x, y, len], i) => {
        const a = (f / 6) * TAU * (i & 1 ? 1 : -1) + i * 1.9;
        const mx = Math.round(x + Math.cos(a) * (4 + (i % 2))), my = Math.round(y + len + 1 + Math.sin(a) * 3);
        g.px(mx, my, 'T'); g.px(mx + ((f + i) & 1 ? 1 : -1), my - ((f + i) & 1), '8');
      });
    }),
  });

  // ================================================================ THE SEVENTH GATE
  const SIGIL = {
    hart: ['X.....X', 'X.X.X.X', '.XX.XX.', '..X.X..', '..XXX..', '..XXX..', '...X...'],
    bell: ['...X...', '..XXX..', '..XXX..', '.XXXXX.', '.XXXXX.', 'XXXXXXX', '...X...'],
    shield: ['XXXXXXX', 'XXX.XXX', 'XXX.XXX', 'X.....X', '.XX.XX.', '..X.X..', '...X...'],
  };
  const GATE_ORDER = ['hart', 'bell', 'shield'];
  const GATE_SOCKETS = [[35.5, 37], [47.5, 37], [59.5, 37]];
  function gateSocket(g, cx, cy, kind, set, f) {
    for (let y = cy - 7; y <= cy + 7; y++) for (let x = Math.floor(cx - 7); x <= Math.ceil(cx + 7); x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= 5.5 && d > 4.4) g.px(x, y, (x - cx) + (y - cy) < 0 ? '7' : '4');
      else if (d <= 4.4) g.px(x, y, set ? 'w' : '1');
      else if (set && d <= 6.6 && ((x + y + f) & 1)) g.px(x, y, f % 2 ? 'v' : 'u');
    }
    if (set) {
      for (let y = cy - 4; y <= cy + 4; y++) for (let x = Math.floor(cx - 4); x <= Math.ceil(cx + 4); x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= 4.4 && d > 3.4) g.px(x, y, (x - cx) + (y - cy) < 0 ? 'x' : 'v');
      }
    }
    const rows = SIGIL[kind];
    const sx = Math.round(cx - 3), sy = cy - 3;
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) {
      if (rows[j][i] !== 'X') continue;
      g.px(sx + i, sy + j, set ? (((f + i + j) % 4) === 0 ? 'x' : 'y') : '3');
    }
  }
  let GATE = null;
  function gateBase() {
    if (GATE) return GATE;
    const W = 96, H = 80, cx = 47.5;
    const g = art.grid(W, H);
    layer(g, (t) => {
      // curtain wall + parapet
      t.rect(18, 8, 60, 71, '4');
      masonry(t, 18, 8, 77, 78, { bh: 5, bw: 9, fills: ['3', '4', '4', '4', '5'], mortar: '2', hi: '5', seed: 71 });
      for (let x = 18; x <= 77; x++) { t.px(x, 8, '6'); t.px(x, 9, '5'); }
      for (let x = 20; x <= 75; x += 8) t.rect(x, 4, 5, 4, '4'), hl(t, x, x + 4, 4, '6');
      // piers
      for (const x0 of [1, 76]) {
        t.rect(x0, 6, 19, 73, '4');
        masonry(t, x0, 6, x0 + 18, 78, { bh: 6, bw: 10, fills: ['3', '4', '4', '5', '3'], mortar: '2', hi: '5', seed: x0 + 3 });
        t.rect(x0 - (x0 === 1 ? 1 : 0), 3, 20, 4, '5'); hl(t, Math.max(0, x0 - 1), Math.min(95, x0 + 19), 3, '6');
        for (const mx of [0, 7, 14]) { t.rect(x0 + mx, 0, 5, 3, '4'); hl(t, x0 + mx, x0 + mx + 4, 0, '6'); }
        t.rect(x0 - (x0 === 1 ? 1 : 0), 62, 20, 3, '6'); hl(t, Math.max(0, x0 - 1), Math.min(95, x0 + 19), 62, '7'); hl(t, Math.max(0, x0 - 1), Math.min(95, x0 + 19), 64, '4');
        const sx = x0 + 9;
        for (const [a, b] of [[16, 25], [42, 49]]) { vl(t, sx, a, b, '0'); vl(t, sx - 1, a + 1, b, '2'); vl(t, sx + 1, a + 1, b, '3'); }
        // shade the right-hand faces
        for (let y = 6; y <= 78; y++) { const xr = x0 + 18; if (t.get(xr, y) !== '2') t.px(xr, y, '3'); }
      }
      // outer arch moulding (voussoirs) and jambs
      for (let y = 8; y <= 78; y++) for (let x = 20; x <= 75; x++) {
        const outer = inArch(x, y, cx, 40, 24, 29), inner = inArch(x, y, cx, 40, 18, 23);
        if (outer && !inner) {
          const ang = Math.atan2(y - 40, x - cx);
          const seg = Math.floor((ang + Math.PI) / (Math.PI / 12));
          let c = seg % 2 ? '5' : '6';
          if (y >= 40) c = (Math.floor((y - 40) / 6) + (x < cx ? 0 : 1)) % 2 ? '5' : '6';
          const inner2 = inArch(x, y, cx, 40, 19, 24);
          if (inner2) c = '3';
          t.px(x, y, c);
        }
      }
      for (let y = 8; y <= 78; y++) for (let x = 20; x <= 75; x++) {
        if (!inArch(x, y, cx, 40, 24, 29)) continue;
        const ang = Math.atan2(y - 40, x - cx);
        const f2 = ((ang + Math.PI) / (Math.PI / 12)) % 1;
        if (y < 40 && f2 < 0.09 && !inArch(x, y, cx, 40, 18, 23)) t.px(x, y, '3');
        if (y >= 40 && (y - 40) % 6 === 5 && !inArch(x, y, cx, 40, 18, 23)) t.px(x, y, '3');
      }
      // keystone with VII
      t.rect(44, 10, 8, 8, '6'); hl(t, 44, 51, 10, '7'); vl(t, 51, 10, 17, '4'); hl(t, 44, 51, 17, '4');
      stampMap(t, 45, 12, ['X.X.X.X', 'X.X.X.X', '.X..X.X', '.X..X.X'], { X: '3' });
      // tympanum: the Open Hand, carved
      for (let y = 17; y <= 30; y++) for (let x = 29; x <= 66; x++) if (inArch(x, y, cx, 40, 18, 23)) t.px(x, y, '4');
      speck(t, 29, 17, 38, 14, ['3', '5'], 0.12, 5, '4');
      const HAND = ['......X......', '.....XX......', '.....XXX.....', '....XX.XX....', '.....XXX.....', '.............',
        'X...........X', 'XX..X.X.X..XX', '.XXXXXXXXXXX.', '..XXXXXXXXX..', '....XXXXX....'];
      for (let j = 0; j < HAND.length; j++) for (let i = 0; i < 13; i++) if (HAND[j][i] === 'X') {
        t.px(41 + i, 19 + j, '6'); if (HAND[j + 1] == null || HAND[j + 1][i] !== 'X') t.px(41 + i, 20 + j, '3');
      }
      // lintel
      t.rect(26, 31, 44, 13, '5');
      masonry(t, 26, 31, 69, 43, { bh: 13, bw: 11, fills: ['5', '5', '6'], mortar: '3', seed: 9 });
      hl(t, 26, 69, 31, '6'); hl(t, 26, 69, 43, '3'); hl(t, 26, 69, 42, '4');
      // jamb shadow inside the opening
      for (let y = 44; y <= 78; y++) { t.px(29, y, '2'); t.px(66, y, '2'); }
      // soot above the arch
      speck(t, 22, 8, 52, 24, ['2', '3'], 0.1, 13, '456');
      speck(t, 26, 31, 44, 4, ['3', '4'], 0.2, 15);
    });
    // banners on the piers
    for (const x0 of [5, 80]) layer(g, (t) => {
      hl(t, x0 - 1, x0 + 11, 11, 'c');
      for (let y = 12; y <= 36; y++) for (let x = x0; x <= x0 + 10; x++) {
        const tear = y > 30 && ((x * 7 + y * 3) % 5 < 2 || y - 30 > 3 + ((x * 13) % 4));
        if (!tear) t.px(x, y, M1);
      }
      t.px(x0 + 2, 35, null); t.px(x0 + 8, 20, null); t.px(x0 + 9, 21, null);
      cylV(t, x0, 12, x0 + 10, 36, M1, WINE, 0.3);
      const e = x0 + 4;
      t.px(e + 1, 15, 'L'); hl(t, e, e + 2, 16, 'K'); t.rect(e, 17, 3, 4, 'K'); vl(t, e, 17, 20, 'L'); t.px(e + 1, 18, 'M'); hl(t, e, e + 2, 21, 'J');
    });
    GATE = g;
    return g;
  }
  function drawGate(g, filled, open, f) {
    g.blit(gateBase(), 0, 0);
    if (!open) {
      // the two doors
      layer(g, (t) => {
        for (let y = 44; y <= 78; y++) for (let x = 30; x <= 65; x++) {
          const k = (x - 30) % 4;
          t.px(x, y, k === 0 ? 'a' : k === 1 ? 'c' : 'b');
        }
        vl(t, 47, 44, 78, '0'); vl(t, 48, 44, 78, '1');
        hl(t, 30, 65, 44, '0'); hl(t, 30, 65, 45, '1');
        for (const y of [49, 59, 69, 75]) {
          hl(t, 30, 65, y, '2'); hl(t, 30, 65, y - 1, '4'); hl(t, 30, 65, y + 1, '1');
          for (let x = 32; x <= 64; x += 4) t.px(x, y, '5');
          t.px(47, y, '0'); t.px(48, y, '0');
        }
        for (const cxr of [44, 51]) { t.ring(cxr, 63, 2, '4'); t.px(cxr - 1, 62, '5'); t.px(cxr, 60, '3'); }
        speck(t, 30, 46, 36, 32, ['a', '3'], 0.04, 21, 'bc');
      }, false);
    } else {
      // beyond: Hallowhearth burning low under an ember sky
      for (let y = 44; y <= 78; y++) for (let x = 30; x <= 65; x++) {
        const t2 = (y - 44) / 34;
        let c = t2 < 0.25 ? 'k' : t2 < 0.5 ? 'l' : t2 < 0.62 ? 'm' : t2 < 0.7 ? 'n' : '1';
        if (t2 >= 0.62 && t2 < 0.7 && ((x + f) % 5 === 0)) c = 'o';
        g.px(x, y, c);
      }
      const roof = [60, 58, 58, 55, 55, 55, 57, 60, 59, 52, 52, 54, 56, 58, 58, 61, 57, 57, 50, 49, 50, 56, 59, 59, 56, 54, 54, 58, 60, 60, 57, 55, 58, 60, 61, 61];
      for (let x = 30; x <= 65; x++) for (let y = roof[x - 30]; y <= 67; y++) g.px(x, y, y < 62 ? 'F' : 'k');
      g.px(49, 47, 'F'); g.px(49, 48, 'F'); g.px(48, 49, 'F');
      for (let x = 30; x <= 65; x++) if ((x * 7) % 4 === 0) g.px(x, 68, 'n');
      for (let y = 69; y <= 78; y++) for (let x = 30; x <= 65; x++) if (((x * 13 + y * 7) % 9) === 0) g.px(x, y, 'k');
      sparks(g, 47.5, 72, 30, 28, f, 4, 9, 404);
      // the doors, swung back into the dark
      for (const side of [0, 1]) for (let x = 0; x < 6; x++) {
        const X = side ? 65 - x : 30 + x;
        for (let y = 44 + x; y <= 78; y++) g.px(X, y, (x === 5 ? '0' : x % 2 ? 'a' : 'b'));
        for (const yb of [49, 59, 69, 75]) g.px(X, yb + x, '2');
      }
      hl(g, 30, 65, 44, '0');
    }
    // ash drifted against the gate
    layer(g, (t) => {
      for (let x = 22; x <= 73; x++) {
        const hgt = 2 + Math.round(1.5 * Math.sin(x * 0.35) + (Math.abs(x - 47.5) > 14 ? 2 : 0) + ((x * 7) % 3 === 0 ? 1 : 0));
        for (let y = 78 - hgt; y <= 78; y++) t.px(x, y, y === 78 - hgt ? '8' : '7');
      }
      for (let x = 1; x <= 94; x++) if (x < 22 || x > 73) { const hgt = 1 + ((x * 5) % 3); for (let y = 78 - hgt; y <= 78; y++) t.px(x, y, y === 78 - hgt ? '7' : '6'); }
      speck(t, 0, 70, 96, 9, ['6', '5', '9'], 0.2, 31);
    }, false);
    hl(g, 0, 95, 79, '1');
    // the three sockets across the lintel
    GATE_ORDER.forEach((k, i) => gateSocket(g, GATE_SOCKETS[i][0], GATE_SOCKETS[i][1], k, filled.indexOf(k) >= 0, f));
  }
  const gateAnim = (filled, open) => anim(4, 4, (g, i) => drawGate(g, filled, open, i));
  prop('prop_gate_seventh', 96, 80, {
    idle: gateAnim([], false),
    closed0: gateAnim([], false),
    closed1: gateAnim(['hart'], false),
    closed2: gateAnim(['hart', 'bell'], false),
    closed3: gateAnim(['hart', 'bell', 'shield'], false),
    // exact combinations, for a gate that shows precisely which Wardstones are held
    hart: gateAnim(['hart'], false),
    bell: gateAnim(['bell'], false),
    shield: gateAnim(['shield'], false),
    hart_bell: gateAnim(['hart', 'bell'], false),
    hart_shield: gateAnim(['hart', 'shield'], false),
    bell_shield: gateAnim(['bell', 'shield'], false),
    open: gateAnim(['hart', 'bell', 'shield'], true),
  });

  // ================================================================ THE UNENDING PYRE
  let PYRE = null;
  function pyreHeap() {
    if (PYRE) return PYRE;
    const g = art.grid(96, 96);
    const r = U.rng(1919);
    const embers = [];
    // the mound
    layer(g, (t) => {
      t.poly([[1, 94], [6, 88], [14, 81], [24, 74], [34, 67], [42, 63], [53, 63], [61, 67], [71, 74], [81, 81], [89, 88], [94, 94]], '1');
      speck(t, 1, 62, 94, 33, ['2', '0', '3'], 0.35, 3);
    });
    // white-hot core
    for (let y = 60; y <= 86; y++) for (let x = 30; x <= 65; x++) {
      const d = Math.hypot((x - 47.5) / 12, (y - 74) / 8);
      if (d > 1) continue;
      g.px(x, y, d < 0.35 ? 'q' : d < 0.6 ? 'p' : d < 0.82 ? 'o' : 'n');
    }
    // debris: beams, doors, cots, a wheel, bones — heaped back to front
    const beam = (x0, y0, x1, y1, w) => layer(g, (t) => {
      thick(t, x0, y0, x1, y1, w, '2');
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let i = 0; i <= n; i++) {
        const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
        t.px(x, y - Math.floor(w) + 1, '3');
        if (r() < 0.28) { t.px(x, y, 'l'); embers.push([x, y]); }
      }
    });
    const door = (pts, mark) => layer(g, (t) => {
      t.poly(pts, 'b');
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      for (let x = Math.min(...xs); x <= Math.max(...xs); x += 3) for (let y = Math.min(...ys); y <= Math.max(...ys); y++) if (t.get(x, y) === 'b') t.px(x, y, 'a');
      speck(t, Math.min(...xs), Math.min(...ys), 30, 30, ['2', '1'], 0.25, pts[0][0]);
      if (mark) { const [mx, my] = mark; t.px(mx, my, 'H'); t.px(mx + 1, my - 1, 'G'); t.px(mx - 1, my + 1, 'G'); t.px(mx + 1, my + 1, 'G'); t.px(mx, my + 2, 'G'); t.px(mx + 2, my + 1, 'G'); }
    });
    const cot = (x, y, w, h, lean) => layer(g, (t) => {
      for (let i = 0; i < w; i++) { t.px(x + i, y + Math.round(i * lean), '3'); t.px(x + i, y + h + Math.round(i * lean), '2'); }
      vl(t, x, y, y + h + 3, '3'); vl(t, x + w - 1, y + Math.round((w - 1) * lean), y + h + Math.round((w - 1) * lean) + 3, '2');
      for (let i = 2; i < w - 1; i += 3) vl(t, x + i, y + Math.round(i * lean) + 1, y + h + Math.round(i * lean) - 1, '1');
    });
    beam(26, 66, 44, 58, 1.5); beam(52, 57, 70, 67, 1.5); beam(40, 60, 46, 80, 1.2);
    door([[12, 80], [24, 75], [27, 86], [15, 91]], [20, 81]);
    cot(62, 72, 14, 4, -0.25);
    beam(18, 78, 50, 68, 2); beam(46, 66, 80, 82, 2);
    beam(33, 86, 62, 62, 1.5);
    layer(g, (t) => { t.ring(17, 86, 5, '3'); t.ring(17, 86, 4, '2'); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; t.line(17, 86, 17 + Math.cos(a) * 4, 86 + Math.sin(a) * 4, '2'); } });
    door([[66, 80], [78, 82], [76, 92], [64, 89]], null);
    beam(52, 90, 70, 74, 1.5); beam(26, 92, 36, 76, 1.5);
    cot(34, 84, 12, 3, 0.2);
    // the dead of the Wickward, among it all
    for (const [x, y] of [[40, 90], [55, 86], [29, 82], [72, 88], [9, 92], [85, 91], [47, 70], [60, 80]]) layer(g, (t) => skull(t, x, y, y < 82 ? ['n', 'o', 'p', 'q', 'q'] : SOOTBONE));
    for (const [x0, y0, x1, y1] of [[44, 92, 50, 90], [60, 92, 66, 89], [22, 90, 26, 93], [78, 90, 82, 93], [12, 93, 17, 92]]) layer(g, (t) => { t.line(x0, y0, x1, y1, '6'); t.px(x0, y0, '7'); t.px(x1, y1, '7'); });
    // warm rim-light on whatever faces the core
    for (let y = 56; y < 96; y++) for (let x = 0; x < 96; x++) {
      const c = g.get(x, y);
      if (c == null || 'qpon'.indexOf(c) >= 0) continue;
      const d = Math.hypot((x - 47.5) / 16, (y - 74) / 11);
      if (d < 1 && (c === '2' || c === '3' || c === '1' || c === 'a' || c === 'b')) g.px(x, y, d < 0.75 ? 'm' : 'l');
      else if (d < 1.3 && (c === '3' || c === '2') && r() < 0.5) g.px(x, y, 'k');
    }
    // ash settling on the outer slopes
    dust(g, 0, 60, 95, 95, ['4', '5', '6'], 0.45, 77, '0123ab');
    PYRE = { g, embers };
    return PYRE;
  }
  // a face in the ash, drifting up through the flames: grey dither with glowing eyes and mouth
  function ashFace(g, cx, cy, a, big) {
    const rx = big ? 4 : 3, ry = big ? 5 : 4;
    for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
      const d = Math.hypot((x - cx) / (rx + 0.3), (y - cy) / (ry + 0.3));
      if (d > 1) continue;
      const c = g.get(x, y);
      if (c == null || 'qponm'.indexOf(c) < 0) continue;
      const eye = (y === cy - 1 || (big && y === cy - 2)) && (Math.abs(x - cx) === (big ? 2 : 1) || (big && Math.abs(x - cx) === 1 && y === cy - 1 && false));
      const mouth = Math.abs(x - cx) <= (big ? 1 : 0) && (y === cy + 2 || (big && y === cy + 3));
      if (eye || mouth) { g.px(x, y, 'q'); continue; }
      const dither = ((x * 3 + y * 5) % 4) / 4;
      if (dither < a * (1.1 - d * 0.5)) g.px(x, y, d > 0.8 ? '4' : (y < cy ? '6' : '5'));
    }
  }
  function drawPyre(g, f) {
    const N = 8;
    fire(g, 47.5, 70, 50, 68, f, N, { seed: 1.7, speed: 4, rough: 0.75 });
    fire(g, 28, 76, 22, 36, f, N, { seed: 4.1, speed: 3, rough: 0.7 });
    fire(g, 67, 76, 22, 40, f, N, { seed: 2.9, speed: 3, rough: 0.7 });
    fire(g, 47.5, 74, 30, 44, f, N, { seed: 6.2, speed: 4, rough: 0.5 });
    // faces that almost are faces
    for (const [x0, ph, big] of [[46, 0, true], [37, 0.4, false], [58, 0.7, false]]) {
      const k = wrap(f / N + ph, 1);
      const a = Math.sin(k * Math.PI);
      if (a < 0.2) continue;
      ashFace(g, Math.round(x0 + Math.sin(k * TAU) * 2), Math.round(58 - k * 40), a, big);
    }
    const P = pyreHeap();
    g.blit(P.g, 0, 0);
    P.embers.forEach(([x, y], i) => { const k = (i * 3 + f) % 6; g.px(x, y, k === 0 ? 'o' : k < 3 ? 'm' : 'l'); });
    sparks(g, 47.5, 64, 60, 64, f, N, 22, 777);
    // ash flecks drifting above the flames
    const r = U.rng(99);
    for (let i = 0; i < 10; i++) {
      const x0 = 20 + r() * 56, ph = r();
      const k = wrap(f / N + ph, 1);
      const y = Math.round(30 - k * 30), x = Math.round(x0 + Math.sin(k * TAU * 2 + i) * 2);
      if (g.get(x, y) == null) g.px(x, y, k < 0.5 ? '5' : '4');
    }
  }
  prop('prop_pyre', 96, 96, { idle: anim(8, 8, drawPyre) });
})(typeof window !== 'undefined' ? window.AV : globalThis.AV);
