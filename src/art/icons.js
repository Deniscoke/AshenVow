// ASHEN VOW — 16×16 item & UI icons (ART-PEOPLE)
// Chunky silhouettes, a dark outline, light from the upper left, one accent colour each: built to read on a dark panel.
(function (AV) {
  'use strict';
  const art = AV.art;
  const N = 16;
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bay = (x, y) => (BAY[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function icon(id, draw) { art.icon(id, { w: N, h: N, draw: (g) => draw(g) }); }

  // ================================================================ toolkit
  // Ramp colour for v in [0,1], ordered dithering only near band edges.
  function pick(ramp, v, x, y) {
    v = clamp(v, 0, 0.999);
    const f = v * ramp.length - 0.5;
    let i = Math.floor(f);
    const fr = clamp((f - i - 0.5) * 2.4 + 0.5, 0, 1);
    if (fr > bay(x, y)) i++;
    return ramp[clamp(i, 0, ramp.length - 1)];
  }
  // Stamp rows through an optional colour map; '.' skips.
  function st(g, x, y, rows, map) {
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
      const ch = rows[j][i];
      if (ch === '.' || ch === ' ') continue;
      g.px(x + i, y + j, map && map[ch] !== undefined ? map[ch] : ch);
    }
  }
  function pts(g, list) { for (const p of list) g.px(p[0], p[1], p[2]); }
  function mask() { return new AV.Grid(N, N); }
  // Shade a mask: planar light from the upper left, bright rim on the lit edges, dark rim on the far edges.
  function shape(g, m, ramp, o) {
    o = Object.assign({ base: 0.6, gx: 0.4, gy: 0.3, rim: 0.22, bias: 0 }, o || {});
    let x0 = N, y0 = N, x1 = 0, y1 = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m.get(x, y) != null) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0);
    const inM = (x, y) => m.get(x, y) != null;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!inM(x, y)) continue;
      let v = o.base + o.bias - o.gx * ((x - x0) / w - 0.5) - o.gy * ((y - y0) / h - 0.5);
      if (!inM(x - 1, y) || !inM(x, y - 1)) v += o.rim;
      if (!inM(x + 1, y) || !inM(x, y + 1)) v -= o.rim;
      g.px(x, y, pick(ramp, v, x, y));
    }
    return m;
  }
  // A lit dome (discs, drops, bulbs).
  function orb(g, cx, cy, rx, ry, ramp, bias) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const nx = (x - cx) / (rx + 0.5), ny = (y - cy) / (ry + 0.5);
      if (nx * nx + ny * ny > 1) continue;
      const lx = nx + 0.45, ly = ny + 0.55;
      g.px(x, y, pick(ramp, 1 - Math.sqrt(lx * lx + ly * ly) / 1.6 + (bias || 0), x, y));
    }
  }
  // Carved sigil: 'X' cells cut dark, a lit lip on the lower-right edge of the cut.
  function carve(g, x, y, rows, dark, lip) {
    const cut = (i, j) => rows[j] !== undefined && rows[j][i] === 'X';
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
      if (cut(i, j)) g.px(x + i, y + j, dark);
      else if ((cut(i - 1, j) || cut(i, j - 1)) && g.get(x + i, y + j) != null) g.px(x + i, y + j, lip);
    }
  }
  // Faint dithered glow in the empty pixels of a ring around a centre (drawn after the outline).
  function halo(g, cx, cy, r0, r1, near, far) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (g.get(x, y) != null) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d < r0 || d > r1) continue;
      const t = (d - r0) / Math.max(0.01, r1 - r0);
      if (bay(x, y) < 0.62 - t * 0.45) g.px(x, y, t < 0.45 ? near : far);
    }
  }
  const out = (g) => g.outline('0');

  // ================================================================ ramps
  const IRON = ['1', '2', '3', '4', '5', '6', '7'];
  const TIN = ['4', '5', '6', '7', '8', '9'];
  const BRASS = ['J', 'K', 'L', 'M'];
  const GOLD = ['J', 'K', 'L', 'M', 'g'];
  const WOOD = ['b', 'c', 'd', 'e', 'f'];
  const CALF = ['a', 'b', 'c', 'd', 'e'];
  const PARCH = ['e', 'f', 'g', '9'];
  const TALLOW = ['e', 'f', 'g', '9'];
  const BONE = ['6', '7', '8', '9'];
  const AMBER = ['k', 'l', 'n', 'o', 'p', 'q'];
  const TEAL = ['t', 'u', 'v', 'w', 'x'];
  const CLOTH = ['3', '4', '5', '6', '7', '8'];
  const ASH = ['2', '3', '4', '5', '6'];

  // ================================================================ tin tags
  // A stamped tin rectangle on a looped cord; the cord runs through the punched hole.
  const TAG = [
    '..e..d........',
    '..e..d........',
    '...ed.........',
    '...ed.........',
    '..8ed8888888..',
    '.89ed77777776.',
    '.872755755756.',
    '.877887887886.',
    '.877557555756.',
    '.777788788776.',
    '.766666666665.',
    '..5555555554..',
  ];
  icon('icon_tag', (g) => { st(g, 1, 2, TAG); out(g); });

  // The scorched tag: W · · EN — the middle of the name burned out; a live coal of rust at the edge of the scorch.
  icon('icon_wren_tag', (g) => {
    st(g, 1, 2, TAG, { e: 'c', d: 'b' });
    pts(g, [[3, 1, 'c'], [4, 1, 'b'], [3, 2, 'd'], [6, 2, 'c'], [5, 2, 'b']]);
    for (let y = 6; y <= 13; y++) for (let x = 2; x <= 13; x++) {
      const c = g.get(x, y);
      if (c == null || '456789'.indexOf(c) < 0) continue;
      const d = Math.hypot((x - 8) * 0.95, (y - 9) * 1.25);
      if (d < 1.6) g.px(x, y, bay(x, y) < 0.5 ? '1' : '2');
      else if (d < 2.6) g.px(x, y, bay(x, y) < 0.45 ? 'a' : 'b');
      else if (d < 3.4 && bay(x, y) < 0.5) g.px(x, y, c === '9' || c === '8' ? '6' : 'c');
    }
    // soot creeping to the far end, and the heat still in it
    pts(g, [[12, 11, '3'], [13, 10, '4'], [13, 12, '3'], [12, 12, '4'], [10, 7, 'l'], [6, 10, 'k'], [10, 11, 'n'], [9, 11, 'l']]);
    out(g);
  });

  // ================================================================ coin
  // Eye-penny: dull brass, worn rim, a stamped eye.
  icon('icon_penny', (g) => {
    const cx = 7.5, cy = 8, R = 4.9;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
      if (d > R + 0.3) continue;
      const lit = dx + dy;
      if (d > R - 1) g.px(x, y, lit < -1.5 ? 'M' : lit > 2.5 ? 'J' : pick(['J', 'K', 'L'], 0.62 - lit * 0.07, x, y));
      else g.px(x, y, pick(['J', 'K', 'L'], 0.5 - lit * 0.06, x, y));
    }
    // the stamp: an almond eye, pressed in (shadow above, catch-light below)
    st(g, 5, 6, [
      '.JJJ.',
      'J.J.J',
      '.JJJ.',
    ]);
    pts(g, [[6, 7, 'K'], [8, 7, 'K'], [6, 9, 'L'], [7, 9, 'L'], [8, 9, 'L'], [10, 8, 'L'], [7, 7, 'J']]);
    out(g);
  });

  // ================================================================ candles
  // Tallow: the healing candle, lit.
  icon('icon_tallow', (g) => {
    st(g, 3, 0, [
      '....m.....',
      '...nm.....',
      '...on.....',
      '..noqn....',
      '..opqo....',
      '...pqo....',
      '....1.....',
    ]);
    const m = mask();
    m.rect(5, 7, 6, 8, 'x');
    shape(g, m, TALLOW, { base: 0.62, gx: 0.7, gy: 0.1, rim: 0.12 });
    // the melt-pool and a drip down the lit side, the puddle at its foot
    pts(g, [[6, 7, '9'], [7, 7, 'g'], [8, 7, 'g'], [9, 7, 'f'], [7, 6, 'l'],
      [4, 9, 'g'], [4, 10, '9'], [4, 11, 'g'], [11, 12, 'e'], [11, 13, 'e']]);
    g.rect(4, 15, 8, 1, 'e'); g.px(4, 15, 'f'); g.px(5, 15, 'g');
    out(g);
  });

  // Tallow stub: fat, short, unlit; a thread of smoke from a pinched wick.
  icon('icon_tallow_stub', (g) => {
    const m = mask();
    m.rect(3, 7, 10, 7, 'x'); m.rect(4, 6, 8, 1, 'x');
    shape(g, m, TALLOW, { base: 0.58, gx: 0.6, gy: 0.2, rim: 0.14 });
    // a cupped top, the wick, drips over the rim
    st(g, 4, 6, ['99gggggf', '9fffeeee']);
    pts(g, [[3, 8, '9'], [3, 9, 'g'], [3, 10, 'g'], [6, 8, 'g'], [6, 9, 'g'], [10, 8, 'e'], [12, 9, 'e'], [12, 10, 'e']]);
    pts(g, [[7, 6, '1'], [7, 5, '2'], [8, 4, 'l'], [8, 3, '5'], [7, 2, '6'], [7, 1, '5'], [8, 0, '4']]);
    g.rect(2, 14, 12, 1, 'e'); pts(g, [[2, 14, 'f'], [3, 14, 'g'], [13, 14, 'd']]);
    out(g);
  });

  // ================================================================ keys
  // Gate key: iron, heavy, a working key with a square bit.
  icon('icon_gate_key', (g) => {
    st(g, 1, 4, [
      '.5665.........',
      '5766545.......',
      '67..4376666665',
      '56..3234444443',
      '4543323...5443',
      '.3322.....4.43',
      '..........3.32',
    ]);
    pts(g, [[2, 5, '8'], [8, 6, '7']]);
    out(g);
    // still warm from her apron pocket
    pts(g, [[11, 10, 'l']]);
  });

  // Abbey key: long, bronze gone green, a strip of novice's cloth through the bow.
  icon('icon_abbey_key', (g) => {
    st(g, 3, 1, [
      '..DEEC....',
      '.DE..C87..',
      '.EC..J98..',
      '.DCCJJ87..',
      '..CKJ..87.',
      '...DJ...76',
      '...EJ..7.6',
      '...DJ..6..',
      '...Dv.....',
      '...EJ.....',
      '...DJKJ...',
      '...DJ.J...',
      '...vJKJ...',
      '...CJ.....',
    ]);
    out(g);
  });

  // Ossuary key: iron, a skull for a bow, strung on a bootlace.
  icon('icon_ossuary_key', (g) => {
    st(g, 5, 1, [
      'd....c',
      '.d..c.',
      '..dc..',
      '.8997.',
      '899987',
      '819916',
      '718816',
      '.7226.',
      '.7676.',
      '..64..',
      '..64..',
      '..6443',
      '..54.2',
      '..3322',
    ]);
    out(g);
  });

  // Wickward key: the Queen's — slender gold, a crowned bow, a red silk tassel.
  icon('icon_wickward_key', (g) => {
    const m = mask();
    m.circle(4, 5, 3, 'x'); m.px(4, 1, 'x'); m.px(2, 2, 'x'); m.px(6, 2, 'x');
    shape(g, m, GOLD, { base: 0.62, rim: 0.2 });
    g.px(4, 5, null); g.px(4, 4, null);
    for (let i = 0; i <= 6; i++) { g.px(7 + i, 7 + i, i < 3 ? 'M' : 'L'); g.px(7 + i + 1, 7 + i, 'K'); }
    pts(g, [[11, 13, 'L'], [10, 14, 'K'], [12, 14, 'J'], [13, 12, 'K'], [14, 11, 'J'], [7, 8, 'J']]);
    // tassel
    st(g, 1, 8, [
      '.IH.',
      'IIHG',
      'IHG.',
      'IHGG',
      'H.G.',
    ]);
    out(g);
  });

  // ================================================================ wardstones
  // Pale stone discs cut with a sigil; each keeps a faint glow of its own colour.
  function wardstone(g, ramp, sigil, cutDark, cutLip, glowNear, glowFar, bias) {
    orb(g, 7.5, 7.5, 5, 5, ramp, bias || 0);
    // a worn bevel on the rim
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (g.get(x, y) != null && d > 4.6 && x + y > 16 && bay(x, y) < 0.6) g.px(x, y, ramp[0]);
    }
    carve(g, 4, 4, sigil, cutDark, cutLip);
    out(g);
    halo(g, 7.5, 7.5, 6.9, 8.4, glowNear, glowFar);
  }
  const STAG = [
    'X.....X',
    'XX...XX',
    '.XX.XX.',
    '..XXX..',
    '.XXXXX.',
    '..XXX..',
    '...X...',
  ];
  const BELL = [
    '...X...',
    '..XXX..',
    '.XXXXX.',
    '.XXXXX.',
    '.XXXXX.',
    'XXXXXXX',
    '...X...',
  ];
  const SHIELD = [
    'XXXXXXX',
    'X.XXX.X',
    'XXXXXXX',
    'X.XXX.X',
    '.XXXXX.',
    '..X.X..',
    '...X...',
  ];
  icon('icon_hart_stone', (g) => wardstone(g, ['C', 'D', 'E', 'S', 'T', '9'], STAG, 'B', 'T', 'E', 'D'));
  icon('icon_bell_stone', (g) => wardstone(g, ['u', '6', '7', 'w', '8', 'x'], BELL, 't', 'x', 'w', 'v'));
  icon('icon_shield_stone', (g) => wardstone(g, ['4', '5', '6', '7', '8', '9'], SHIELD, '2', '8', 'o', 'l', -0.08));

  // ================================================================ small relics & keepsakes
  // Bone whistle: a carved tube, a finger-hole, a cord.
  icon('icon_hound_whistle', (g) => {
    // a fat bone tube, mouth up and to the right
    const R = (u, v) => [7.5 + (u + v) * 0.7071, 7.5 + (v - u) * 0.7071];
    const m = mask();
    m.poly([R(-4.2, -1.9), R(4, -1.9), R(5.6, -0.4), R(5, 1.9), R(-4.2, 1.9)], 'x');
    shape(g, m, BONE, { base: 0.6, gx: 0.3, gy: 0.3, rim: 0.25 });
    // the window of the whistle, the mouth's dark bore, bands of carving
    const P = (u, v, c) => { const p = R(u, v); g.px(Math.round(p[0]), Math.round(p[1]), c); };
    P(2, -0.3, '1'); P(2.7, -0.3, '2'); P(2, 0.6, '3');
    P(5, 0.2, '3'); P(-1.5, -1.2, '6'); P(-1.5, -0.3, '6'); P(-1.5, 0.6, '6'); P(-2.3, -1.2, '6'); P(-2.3, 0.6, '6');
    // the cord threaded through the far end
    pts(g, [[3, 12, 'd'], [2, 13, 'd'], [1, 13, 'c'], [1, 12, 'c'], [1, 11, 'c'], [2, 10, 'd'], [2, 14, 'c'], [3, 14, 'b']]);
    out(g);
  });

  // Maud's ring: a thin band of tarnished silver, worn flat on one side.
  icon('icon_maud_ring', (g) => {
    const m = mask();
    m.ellipse(7.5, 8.5, 5, 4, 'x');
    const hole = mask(); hole.ellipse(7.5, 8, 3, 2, 'x');
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (hole.get(x, y) != null) m.px(x, y, null);
    for (let x = 11; x <= 13; x++) m.px(x, 12, null);
    shape(g, m, ['3', '4', '5', '6', '7', '8', '9'], { base: 0.58, gx: 0.3, gy: -0.1, rim: 0.25 });
    // the inner (far) wall of the band in shadow, tarnish, a single glint
    for (let x = 4; x <= 11; x++) if (g.get(x, 5) != null) g.px(x, 5, x < 7 ? '5' : '4');
    pts(g, [[11, 11, '4'], [12, 10, '4'], [9, 12, '5'], [4, 11, '7'], [3, 8, '8'], [5, 12, '8'], [6, 12, '9']]);
    out(g);
    pts(g, [[3, 3, 'y'], [3, 2, 'x'], [2, 3, 'x'], [4, 3, 'x'], [3, 4, 'x']]);
  });

  // Posy's ribbon: a faded blue feast-day bow.
  icon('icon_posy_ribbon', (g) => {
    const m = mask();
    m.ellipse(4, 5, 3, 2.5, 'x'); m.ellipse(11, 5, 3, 2.5, 'x');
    m.poly([[6, 7], [8, 7], [4, 13], [1, 12]], 'x');
    m.poly([[8, 7], [10, 7], [14, 12], [11, 13]], 'x');
    shape(g, m, TEAL, { base: 0.6, rim: 0.2 });
    // the loops' openings, the knot, notched tails
    pts(g, [[4, 5, 't'], [3, 5, 't'], [11, 5, 't'], [12, 5, 't'], [4, 4, 'u'], [11, 4, 'u']]);
    st(g, 6, 5, ['.xw.', 'xwvu', '.vu.']);
    pts(g, [[2, 13, null], [3, 12, 'u'], [12, 13, null], [13, 12, 't']]);
    out(g);
  });

  // Maud's thimble: dented brass, pricked all over.
  icon('icon_maud_thimble', (g) => {
    const m = mask();
    m.ellipse(7.5, 5, 3.5, 3, 'x');
    m.poly([[4, 5], [11, 5], [12, 12], [3, 12]], 'x');
    m.rect(3, 12, 10, 2, 'x');
    shape(g, m, BRASS, { base: 0.55, gx: 0.8, gy: 0.1, rim: 0.2 });
    for (let y = 3; y <= 10; y++) for (let x = 3; x <= 12; x++) {
      const c = g.get(x, y);
      if (c && (x + y * 2) % 3 === 0 && (x + y) % 2 === 0) g.px(x, y, c === 'M' ? 'L' : c === 'L' ? 'K' : 'J');
    }
    // the rim band, and the dent
    for (let x = 3; x <= 12; x++) { g.px(x, 12, x < 6 ? 'M' : x < 10 ? 'L' : 'K'); g.px(x, 13, x < 7 ? 'K' : 'J'); }
    pts(g, [[9, 7, 'J'], [10, 7, 'J'], [9, 8, 'J'], [10, 8, 'K'], [11, 8, 'M'], [10, 9, 'L']]);
    out(g);
  });

  // Moth-lantern: horn panes scraped thin, ash-moths glowing inside instead of a flame.
  icon('icon_moth_lantern', (g) => {
    st(g, 1, 1, [
      '.....4554.....',
      '....4....3....',
      '.....4..3.....',
      '....356543....',
      '...36665443...',
      '...4wwvvvu3...',
      '...5ywyvvu2...',
      '...5wxwvvu2...',
      '...4vvvyvy2...',
      '...4vuvvxv2...',
      '...4uuuuuu2...',
      '...35554432...',
      '....333322....',
    ]);
    out(g);
  });

  // The Hart's tear: a drop of amber around one white hair.
  icon('icon_hart_tear', (g) => {
    const m = mask();
    m.ellipse(7.5, 9.5, 4, 4, 'x');
    m.poly([[7.5, 1], [11.2, 8], [3.8, 8]], 'x');
    shape(g, m, AMBER, { base: 0.5, gx: 0.5, gy: 0.2, rim: 0.2 });
    // light pools low inside the amber; a hard glint high on the lit side
    pts(g, [[8, 11, 'p'], [9, 11, 'o'], [8, 12, 'o'], [9, 10, 'p'], [5, 7, 'q'], [5, 8, 'p'], [6, 5, 'p']]);
    // the hair
    pts(g, [[6, 6, '9'], [7, 7, '9'], [7, 8, '9'], [8, 9, '9'], [8, 10, '9'], [9, 11, '8']]);
    out(g);
  });

  // Bell shard: a curved piece of the great bell, still humming.
  icon('icon_bell_shard', (g) => {
    // a piece of the bell's wall: a jagged break along the top, the thick flared lip along the bottom
    const m = mask();
    m.poly([[2, 7], [4, 3], [6, 5], [8, 1], [10, 4], [11, 3], [12, 8], [13, 12], [1, 12]], 'x');
    m.rect(1, 11, 13, 3, 'x');
    shape(g, m, BRASS, { base: 0.56, gx: 0.45, gy: 0.2, rim: 0.2 });
    // the fresh break is bright metal; the lip is a raised band with a groove above it
    pts(g, [[4, 3, 'M'], [5, 4, 'M'], [8, 1, 'M'], [9, 2, 'M'], [3, 4, 'M'], [11, 3, 'L'], [7, 2, 'M']]);
    for (let x = 1; x <= 13; x++) { g.px(x, 10, x < 11 ? 'J' : 'a'); g.px(x, 11, x < 5 ? 'M' : x < 10 ? 'L' : 'K'); }
    pts(g, [[5, 7, 'K'], [6, 8, 'K'], [9, 6, 'K']]);
    out(g);
    // it still hums
    pts(g, [[14, 3, 'w'], [15, 4, 'v'], [15, 5, 'w'], [14, 6, 'v'], [15, 9, 'w'], [15, 10, 'v']]);
  });

  // Odo's seal-ring: iron, a boar over a broken spear, a blot of red wax.
  icon('icon_odo_seal', (g) => {
    // the wax he never finished with, the boar pressed into it
    const w = mask(); w.ellipse(11, 12.5, 3.5, 2.5, 'x'); w.px(14, 10, 'x'); w.px(8, 14, 'x');
    shape(g, w, ['F', 'G', 'H', 'I'], { base: 0.55, rim: 0.2 });
    pts(g, [[10, 12, 'F'], [11, 12, 'F'], [12, 12, 'G'], [10, 13, 'G'], [12, 13, 'I']]);
    // the band, standing
    const b = mask(); b.circle(7, 9.5, 4.5, 'x');
    const bh = mask(); bh.circle(7, 9.5, 2.3, 'x');
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (bh.get(x, y) != null) b.px(x, y, null);
    shape(g, b, IRON, { base: 0.55, rim: 0.22 });
    // the flat bezel on top, cut with the boar
    const z = mask(); z.ellipse(7, 3.5, 5, 2.6, 'x');
    shape(g, z, IRON, { base: 0.74, gy: 0.4, rim: 0.2 });
    for (let x = 3; x <= 11; x++) if (z.get(x, 6) != null) g.px(x, 6, x < 6 ? '4' : '2');
    pts(g, [[2, 5, '3'], [12, 5, '2']]);
    carve(g, 4, 2, [
      '..XXXX.',
      'XXXXXXX',
      '.X..X..',
    ], '1', '7');
    out(g);
  });

  // Hesk's flask: dented tin, the watch-crest nearly rubbed off, a brass cap.
  icon('icon_hesk_flask', (g) => {
    // a flat hip-flask, wider than it is tall, shoulders rounded
    const m = mask();
    m.rect(2, 6, 12, 7, 'x'); m.rect(3, 5, 10, 9, 'x'); m.rect(4, 4, 8, 1, 'x');
    m.rect(6, 3, 4, 1, 'x');
    shape(g, m, ['3', '4', '5', '6', '7', '8'], { base: 0.56, gx: 0.55, gy: 0.2, rim: 0.2 });
    // brass cap on a short neck
    const c = mask(); c.rect(5, 0, 6, 3, 'x'); c.px(5, 0, null); c.px(10, 0, null);
    shape(g, c, BRASS, { base: 0.6, rim: 0.2 });
    // the dent (dark cup, lit far rim)
    pts(g, [[10, 10, '3'], [11, 10, '4'], [10, 11, '4'], [11, 11, '7'], [9, 11, '4'], [10, 12, '6']]);
    // the rubbed-off watch-crest
    st(g, 5, 7, ['7.7.7', '.555.', '..5..'], null);
    out(g);
  });

  // Ashen sigil: a disc of fused ash, stamped with a flame over a shield.
  icon('icon_ashen_sigil', (g) => {
    orb(g, 7.5, 7.5, 5.5, 5.5, ASH, 0.02);
    g.noise(2, 2, 12, 12, ['6', '2'], 0.08, 17);
    const R = mask(); R.circle(7.5, 7.5, 6, 'x');
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (R.get(x, y) == null) g.px(x, y, null);
    // the shield, raised out of the ash, a stamped groove round it
    const s = mask();
    st(s, 5, 7, ['XXXXXX', 'XXXXXX', 'XXXXXX', '.XXXX.', '..XX..']);
    for (let y = 6; y <= 13; y++) for (let x = 4; x <= 11; x++) {
      if (s.get(x, y) != null || g.get(x, y) == null) continue;
      if (s.get(x - 1, y) || s.get(x + 1, y) || s.get(x, y - 1) || s.get(x, y + 1)) g.px(x, y, '1');
    }
    shape(g, s, ['3', '4', '5', '6', '7'], { base: 0.62, rim: 0.25 });
    pts(g, [[7, 8, '4'], [8, 8, '4'], [7, 9, '4'], [8, 9, '4'], [7, 10, '4']]);
    // the flame, still glowing in the stamp
    st(g, 6, 2, [
      '..n.',
      '.no.',
      'lnpo',
      'lopn',
      '.ml.',
    ]);
    out(g);
  });

  // Oath-ribbon: grey cloth knotted round a folded vow.
  icon('icon_oath_ribbon', (g) => {
    // the vow: a little rolled paper
    const v = mask(); v.rect(1, 3, 14, 4, 'x');
    shape(g, v, PARCH, { base: 0.6, gx: 0.2, gy: 0.9, rim: 0.12 });
    pts(g, [[1, 4, 'd'], [1, 5, 'e'], [14, 4, 'c'], [14, 5, 'd'], [3, 5, 'f'], [12, 4, 'f']]);
    // grey cloth knotted round its middle, the tails hanging loose
    const m = mask();
    m.rect(6, 2, 4, 6, 'x');
    m.poly([[6, 7], [8, 7], [6, 12], [3, 14]], 'x');
    m.poly([[8, 7], [10, 7], [12, 12], [10, 13]], 'x');
    shape(g, m, CLOTH, { base: 0.6, rim: 0.2 });
    // the knot's folds; frayed ends
    pts(g, [[7, 4, '8'], [8, 4, '7'], [7, 5, '6'], [9, 5, '4'], [8, 6, '4'], [6, 3, '7'], [9, 2, '5']]);
    pts(g, [[3, 14, null], [4, 14, '4'], [2, 14, null], [10, 13, null], [11, 13, '4'], [12, 13, '3']]);
    out(g);
  });

  // Stolen ember: a flame that had a name once — a cold ghost-light at its heart.
  icon('icon_stolen_ember', (g) => {
    st(g, 1, 1, [
      '.......l......',
      '......lm......',
      '......mn.l....',
      '.....lnm.m....',
      '....lmnnmn....',
      '....mnoonm....',
      '...lnopponl...',
      '...mopqqpnm...',
      '..lnpqyxqonl..',
      '..mopqxwqpnm..',
      '..lnopqqponl..',
      '...lnoppoml...',
      '....lmnnml....',
      '.....kllk.....',
    ]);
    out(g);
  });

  // Pilgrim's breath: a small stoppered vial of cold morning air.
  icon('icon_pilgrim_breath', (g) => {
    const m = mask();
    m.ellipse(7.5, 10, 4, 3.8, 'x'); m.rect(6, 3, 4, 5, 'x');
    shape(g, m, ['s', 't', 'u', 'v'], { base: 0.45, rim: 0.1 });
    // glass edges catching the light
    for (let y = 3; y <= 13; y++) for (let x = 2; x <= 13; x++) {
      if (m.get(x, y) == null) continue;
      if (m.get(x - 1, y) == null) g.px(x, y, y < 9 ? 'x' : 'w');
      else if (m.get(x + 1, y) == null) g.px(x, y, 'u');
    }
    // the breath inside: a curl of pale mist
    pts(g, [[6, 9, 'x'], [7, 8, 'y'], [8, 8, 'x'], [9, 9, 'w'], [9, 10, 'x'], [8, 11, 'y'], [7, 11, 'x'], [6, 11, 'w'], [5, 10, 'v'], [10, 12, 'v'], [7, 10, 'w']]);
    // wax stopper
    const s = mask(); s.rect(5, 1, 6, 3, 'x'); s.px(5, 1, null); s.px(10, 1, null);
    shape(g, s, TALLOW, { base: 0.55, rim: 0.2 });
    pts(g, [[5, 4, 'f'], [10, 5, 'e']]);
    out(g);
  });

  // Grave-iron: the spear-finial of a grave-railing, snapped off; rust in the break.
  icon('icon_grave_iron', (g) => {
    const m = mask();
    const R = (u, v) => [7.5 + (u + v) * 0.7071, 7.5 + (v - u) * 0.7071];
    m.poly([R(0, -7.2), R(2.7, -3), R(1, -1.6), R(-1, -1.6), R(-2.7, -3)], 'x');
    m.poly([R(-2, -1.8), R(2, -1.8), R(2, 0), R(-2, 0)], 'x');
    m.poly([R(-1.1, 0), R(1.1, 0), R(1.1, 5), R(0.4, 6.4), R(-0.3, 5.3), R(-1.1, 6.2)], 'x');
    shape(g, m, IRON, { base: 0.45, gx: 0.4, gy: 0.4, rim: 0.3 });
    // a bright edge down the blade; rust in the break
    for (let i = 0; i < 5; i++) g.px(9 + i, 5 - i, i < 2 ? '6' : '7');
    const p = R(0, 5.4), q = R(-0.6, 4.6);
    pts(g, [[Math.round(p[0]), Math.round(p[1]), 'd'], [Math.round(q[0]), Math.round(q[1]), 'c']]);
    out(g);
  });

  // ================================================================ books & papers
  // Anselm's letter: folded, the edges taken by water, a red seal.
  icon('icon_anselm_letter', (g) => {
    const m = mask();
    m.rect(1, 3, 14, 10, 'x');
    shape(g, m, PARCH, { base: 0.62, rim: 0.12 });
    // the flap
    for (let i = 0; i <= 6; i++) { g.px(1 + i, 3 + Math.floor(i * 0.72), 'f'); g.px(14 - i, 3 + Math.floor(i * 0.72), 'e'); }
    // water-stains eating the edges
    const W = [[1, 12, null], [1, 11, 'e'], [2, 12, 'e'], [14, 3, null], [13, 3, 'e'], [14, 4, 'e'], [14, 12, null], [13, 12, 'd'],
      [14, 11, 'd'], [12, 12, 'e'], [1, 3, 'f'], [5, 12, 'e'], [6, 12, 'f'], [10, 12, 'e'], [1, 7, 'f'], [14, 8, 'e']];
    pts(g, W);
    // the seal
    st(g, 6, 7, ['.IH.', 'IIHG', 'HHGG', '.GG.']);
    pts(g, [[7, 8, 'g']]);
    out(g);
  });

  // The Wickward ledger: fat, bound in oiled calf, strapped shut, a brass buckle.
  icon('icon_wickward_ledger', (g) => {
    // a tall, fat book: the page block shows at the fore-edge and the foot
    const p = mask(); p.rect(4, 2, 10, 13, 'x');
    shape(g, p, PARCH, { base: 0.55, rim: 0.1 });
    for (let y = 2; y <= 14; y++) { g.px(12, y, y % 2 ? 'f' : 'g'); g.px(13, y, y % 2 ? 'e' : 'f'); }
    for (let x = 4; x <= 13; x++) g.px(x, 14, x % 2 ? 'e' : 'f');
    const c = mask(); c.rect(2, 1, 10, 13, 'x');
    shape(g, c, CALF, { base: 0.6, gx: 0.3, rim: 0.18 });
    // the rounded spine, banded
    for (let y = 1; y <= 13; y++) { g.px(2, y, 'b'); g.px(3, y, y % 4 === 2 ? 'e' : 'c'); }
    // a clerk's paper label on the cover
    const l = mask(); l.rect(5, 3, 5, 3, 'x');
    shape(g, l, PARCH, { base: 0.7, rim: 0.1 });
    pts(g, [[6, 4, 'c'], [7, 4, 'c'], [8, 4, 'c']]);
    // the strap round the fore-edge, the brass buckle
    for (let x = 9; x <= 13; x++) { g.px(x, 9, 'b'); g.px(x, 10, 'a'); }
    st(g, 7, 8, ['MLK', 'L.J', 'KJJ', '.J.'], null);
    g.px(8, 9, 'b');
    out(g);
  });

  // Book: wine cloth, a gilt frame, pages showing at the fore-edge.
  icon('icon_book', (g) => {
    st(g, 1, 1, [
      '.GIIIIIIIIH...',
      '.FIHHHHHHHHg..',
      '.KIKKKKKKKHg..',
      '.FIKHHHHHKHf..',
      '.FIKHHMHHKHg..',
      '.FIKHMLKHKHf..',
      '.FIKHHKHHKHg..',
      '.KIKHHHHHKHf..',
      '.FIKKKKKKKHg..',
      '.FIHHHHHHHHf..',
      '.FGGGGGGGGGg..',
      '..gfgfgfgfgf..',
    ]);
    out(g);
  });

  // Scroll: a sheet between two rolls, tied with a red cord.
  icon('icon_scroll', (g) => {
    const s = mask(); s.rect(3, 3, 10, 9, 'x');
    shape(g, s, PARCH, { base: 0.66, gx: 0.3, gy: 0.2, rim: 0.1 });
    for (let y = 5; y <= 10; y += 2) for (let x = 5; x <= (y === 9 ? 8 : 10); x++) g.px(x, y, x % 3 === 1 ? 'f' : 'd');
    const top = mask(); top.rect(1, 1, 14, 3, 'x');
    shape(g, top, PARCH, { base: 0.55, gx: 0.2, gy: 0.9, rim: 0.2 });
    const bot = mask(); bot.rect(1, 11, 14, 3, 'x');
    shape(g, bot, PARCH, { base: 0.5, gx: 0.2, gy: 0.9, rim: 0.2 });
    pts(g, [[1, 2, 'd'], [14, 2, 'c'], [1, 12, 'd'], [14, 12, 'c']]);
    // cord
    pts(g, [[11, 12, 'I'], [11, 13, 'H'], [12, 14, 'H'], [10, 14, 'I'], [11, 11, 'I']]);
    out(g);
  });

  // Note: a torn scrap, a folded corner, a few lines in a hurried hand.
  icon('icon_note', (g) => {
    const m = mask();
    m.poly([[2, 2], [10, 2], [13, 5], [13, 13], [11, 12], [8, 13], [5, 12], [2, 13]], 'x');
    shape(g, m, PARCH, { base: 0.62, rim: 0.12 });
    // dog-ear
    st(g, 10, 2, ['e..', 'fe.', 'ffe'], null);
    for (let x = 11; x <= 13; x++) if (x - 10 <= 3) g.px(x, 1 + (x - 10), null);
    // hurried lines
    for (let x = 4; x <= 9; x++) g.px(x, 5, x === 7 ? 'e' : 'c');
    for (let x = 4; x <= 11; x++) g.px(x, 7, x === 9 ? 'e' : 'c');
    for (let x = 4; x <= 10; x++) g.px(x, 9, x % 4 === 2 ? 'e' : 'c');
    for (let x = 4; x <= 7; x++) g.px(x, 11, 'c');
    pts(g, [[10, 11, 'b'], [11, 10, 'c']]);
    out(g);
  });

  // ================================================================ the first bird
  // Whittled badly by a sword-hand: a turnip with opinions. Beak too long, wings not the same size.
  icon('icon_wren_bird', (g) => {
    orb(g, 7, 9.5, 5, 4.5, WOOD, 0.05);
    orb(g, 8, 4.5, 2.8, 2.8, WOOD, 0.1);
    // the stub of a tail, the long beak
    pts(g, [[1, 12, 'd'], [2, 12, 'c'], [1, 13, 'c'], [0, 13, 'b']]);
    for (let x = 11; x <= 14; x++) { g.px(x, 4, x < 13 ? 'e' : 'd'); if (x < 13) g.px(x, 5, 'c'); }
    // the eye, knife facets, the wings (one big, one small)
    pts(g, [[9, 4, '1'], [9, 3, 'f']]);
    pts(g, [[4, 9, 'c'], [5, 10, 'c'], [6, 11, 'c'], [7, 11, 'b'], [8, 10, 'c'], [5, 8, 'e'], [6, 9, 'e'], [7, 10, 'd']]);
    pts(g, [[10, 9, 'c'], [11, 10, 'b'], [10, 10, 'd']]);
    pts(g, [[4, 13, 'b'], [9, 14, 'b'], [6, 7, 'c'], [10, 7, 'c']]);
    out(g);
  });
})(window.AV);
