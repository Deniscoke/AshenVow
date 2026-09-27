// ASHEN VOW — NPC sprite sheets (ART-PEOPLE)
// Living characters: dark outline (0). Ghosts: slate outline (t/u), ghost palette, dithered fading lower edges.
(function (AV) {
  'use strict';
  const art = AV.art;

  // ================================================================ toolkit
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bayer = (x, y) => (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

  // Mirror half-rows (w/2 chars each) into full symmetric rows of width w.
  function sym(half, w) {
    const hw = w / 2;
    return half.map((r) => {
      const s = (r + '.'.repeat(hw)).slice(0, hw);
      return s + s.split('').reverse().join('');
    });
  }
  // Horizontal run of pixels starting at x.
  function put(g, x, y, s) {
    for (let i = 0; i < s.length; i++) if (s[i] !== '.' && s[i] !== ' ') g.px(x + i, y + 0, s[i]);
  }
  // Clear then put (so '.' erases).
  function set(g, x, y, s) {
    for (let i = 0; i < s.length; i++) g.px(x + i, y, s[i] === '.' ? null : s[i]);
  }
  // Pixel list: [[x,y,c],...]
  function pts(g, list, dx, dy) {
    for (const p of list) g.px(p[0] + (dx || 0), p[1] + (dy || 0), p[2]);
  }
  // Move rows [yTop, yCut) down by dy (breathing / settling). Lower rows keep their pixels
  // where the moved rows are transparent.
  function sink(g, yTop, yCut, dy, x0, x1) {
    x0 = x0 == null ? 0 : x0; x1 = x1 == null ? g.w - 1 : x1;
    const buf = [];
    for (let y = yTop; y < yCut; y++) {
      const row = [];
      for (let x = x0; x <= x1; x++) row.push(g.get(x, y));
      buf.push(row);
    }
    for (let y = yTop; y < yTop + dy; y++) for (let x = x0; x <= x1; x++) g.px(x, y, null);
    for (let k = 0; k < buf.length; k++) {
      const ty = yTop + k + dy;
      for (let x = x0; x <= x1; x++) {
        const c = buf[k][x - x0];
        if (ty < yCut) g.px(x, ty, c);
        else if (c != null) g.px(x, ty, c);
      }
    }
  }
  // Shift a rectangular region by dx (sway), leaving the rest.
  function slide(g, y0, y1, dx) {
    for (let y = y0; y <= y1; y++) {
      const row = [];
      for (let x = 0; x < g.w; x++) row.push(g.get(x, y));
      for (let x = 0; x < g.w; x++) {
        const sx = x - dx;
        g.px(x, y, sx >= 0 && sx < g.w ? row[sx] : null);
      }
    }
  }
  // Ghost fade: rows y0..y1 lose pixels progressively (ordered dither), fully gone below y1.
  const GHOST_RAMP = ['s', 't', 'u', 'v', 'w', 'x', 'y'];
  function fade(g, y0, y1, phase) {
    phase = phase || 0;
    for (let y = y0; y < g.h; y++) {
      const t = y > y1 ? 2 : (y - y0) / Math.max(1, y1 - y0);
      for (let x = 0; x < g.w; x++) {
        const c = g.get(x, y);
        if (c == null) continue;
        if (t > 1) { g.px(x, y, null); continue; }
        const k = GHOST_RAMP.indexOf(c);
        if (k >= 0) g.px(x, y, GHOST_RAMP[Math.max(1, k - Math.round(t * 2.4))]);
        const th = 0.55 * bayer(x + phase, y) + 0.45 * hashf(x + phase * 3, y);
        if (th < t * 1.15 - 0.22) g.px(x, y, null);
      }
    }
  }
  function hashf(x, y) {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  // Give a ghost form: its left side catches the light, its right side falls into shade.
  const G_DARK = { y: 'x', x: 'w', w: 'v', v: 'u' }, G_LIGHT = { v: 'w', w: 'x', x: 'y' };
  function sideShade(g) {
    for (let y = 0; y < g.h; y++) {
      let l = -1, r = -1;
      for (let x = 0; x < g.w; x++) if (g.get(x, y) != null) { if (l < 0) l = x; r = x; }
      if (l < 0 || r - l < 3) continue;
      const span = r - l;
      for (let x = l; x <= r; x++) {
        const c = g.get(x, y);
        if (c == null) continue;
        const rel = (x - l) / span;
        if (rel > 0.68 && G_DARK[c]) g.px(x, y, G_DARK[c]);
        else if (rel < 0.16 && G_LIGHT[c]) g.px(x, y, G_LIGHT[c]);
      }
    }
  }
  // Translucent sheen: swap a colour for a darker one on a sparse checker within rows y0..y1.
  function veil(g, y0, y1, from, to, phase) {
    phase = phase || 0;
    for (let y = y0; y <= y1; y++) for (let x = 0; x < g.w; x++) {
      if (g.get(x, y) === from && ((x + y + phase) & 1) === 0 && ((y + phase) % 4 < 2)) g.px(x, y, to);
    }
  }
  // Recolour within an area only.
  function recol(g, x0, y0, x1, y1, map) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const c = g.get(x, y);
      if (c != null && map[c] !== undefined) g.px(x, y, map[c]);
    }
  }
  function living(g) { g.outline('0'); }
  function ghostly(g, fy0, fy1, phase) {
    g.outline('t');
    if (fy0 != null) fade(g, fy0, fy1, phase);
  }
  // Frame builder: draw(g, i) from a list of per-frame functions.
  function frames(list) {
    return { count: list.length, draw: (g, i) => list[i](g) };
  }
  // Shaded ellipse (light from upper-left-front). ramp: dark → light. jitter adds earthy grain.
  const LX = -0.55, LY = -0.65, LZ = 0.52;
  function orb(g, cx, cy, rx, ry, ramp, jitter, seed, amb) {
    const R = g.rnd(seed || 7);
    amb = amb == null ? 0.12 : amb;
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const nx = (x - cx) / (rx + 0.5), ny = (y - cy) / (ry + 0.5);
        const q = nx * nx + ny * ny;
        if (q > 1) { R(); continue; }
        const nz = Math.sqrt(1 - q);
        let v = amb + (1 - amb) * Math.max(0, nx * LX + ny * LY + nz * LZ);
        v += ((R() - 0.5) * (jitter || 0));
        const i = Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length)));
        g.px(x, y, ramp[i]);
      }
  }
  // Asymmetric row art: rows[i] = [x, 'str'] or [[x,'str'],[x,'str']] or null.
  function paint(g, rows, dx, dy) {
    rows.forEach((r, y) => {
      if (!r) return;
      const segs = Array.isArray(r[0]) ? r : [r];
      for (const sg of segs) put(g, sg[0] + (dx || 0), y + (dy || 0), sg[1]);
    });
  }
  // Thick stroke: a line of discs.
  function limb(g, x0, y0, x1, y1, r, c) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      g.circle(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, c);
    }
  }

  // ================================================================ LINNET — the Chandler
  // Grey hood-scarf, dark hair, grey wool robe, stained leather apron spattered with wax,
  // sleeves rolled; hands grey to the wrist; candle-snuffer and knife on the belt.
  const LIN_BODY = sym([
    '............',
    '............',
    '............',
    '..........66',
    '........6777',
    '.......67777',
    '.......67111',
    '.......611jj',
    '.......61jjj',
    '.......61j1j',
    '.......61jjj',
    '.......665ij',
    '.......66655',
    '......677654',
    '......566544',
    '........34cd',
    '........34cd',
    '........34cd',
    '........34cd',
    '........3aaa',
    '........34cd',
    '........34cd',
    '........44cd',
    '......3444cd',
    '......3444cd',
    '.....33444cd',
    '.....34444cd',
    '.....34444cc',
    '....33444444',
    '....23344444',
    '.........ab.',
    '............',
  ], 24);

  function linBase(g) {
    g.stamp(0, 0, LIN_BODY);
    // hair strand, light on the hood, cheek shade
    pts(g, [[15, 9, '1'], [8, 5, '7'], [9, 4, '7'], [14, 10, 'i']]);
    // apron: highlight down the middle, a few wax spatters and old stains
    recol(g, 10, 15, 13, 27, { c: 'd' });
    for (let y = 15; y <= 27; y++) if (y !== 19) { g.px(13, y, 'c'); if (y < 18 || y === 22) g.px(10, y, 'e'); }
    pts(g, [[11, 15, 'e'], [12, 16, 'g'], [11, 21, '9'], [11, 22, 'g'], [12, 25, 'b'], [13, 26, 'b'], [10, 27, 'c'], [11, 27, 'c'], [12, 27, 'c']]);
    // skirt folds
    pts(g, [[8, 26, '3'], [8, 27, '3'], [15, 26, '3'], [15, 27, '3'], [16, 28, '3']]);
    // belt buckle, knife (left hip), snuffer (right hip)
    pts(g, [[11, 19, 'K'], [9, 20, 'c'], [9, 21, '7'], [9, 22, '8'],
      [14, 20, '5'], [14, 21, '5'], [14, 22, '3'], [15, 22, '2'], [14, 23, '2'], [15, 23, '1']]);
  }
  const LIN_ARM = [[6, 15, '5'], [7, 15, '4'], [6, 16, '5'], [7, 16, '4'], [6, 17, '6'], [7, 17, '6'],
    [6, 18, 'i'], [7, 18, 'h'], [6, 19, 'i'], [7, 19, 'h'], [6, 20, 'O'], [7, 20, 'N'],
    [6, 21, 'O'], [7, 21, 'N'], [7, 22, 'N']];
  const SHADE = { 5: '4', 4: '3', 6: '5', i: 'h', O: 'N', j: 'i' };
  // Arms hanging, rolled sleeves, grey hands.
  function linArmsDown(g, lift) {
    pts(g, LIN_ARM);
    for (const p of LIN_ARM) g.px(23 - p[0], p[1] - (lift && p[1] >= 18 ? 1 : 0), SHADE[p[2]] || p[2]);
    if (lift) { g.px(16, 22, null); g.px(16, 21, 'N'); g.px(17, 21, 'O'); g.px(17, 20, 'O'); }
  }
  // Working pose: forearms forward, grey hands at the chest; k = knife stroke phase.
  function linArmsWork(g, k) {
    pts(g, [[6, 15, '5'], [7, 15, '4'], [6, 16, '5'], [7, 16, '4'], [7, 17, '6'],
      [17, 15, '4'], [16, 15, '3'], [17, 16, '4'], [16, 16, '3'], [16, 17, '5']]);
    // forearms (skin)
    pts(g, [[8, 18, 'i'], [9, 18, 'h'], [15, 18, 'h'], [14, 18, 'h']]);
    // the little bird in her left hand: pale wood, beak and tail
    pts(g, [[13, 16, 'f'], [14, 16, 'e'], [12, 16, 'd'], [13, 15, 'f'], [14, 15, 'e'], [15, 15, 'd'], [12, 17, 'e'], [13, 17, 'f']]);
    pts(g, [[14, 17, 'O'], [15, 17, 'N'], [13, 18, 'N'], [14, 18, 'N']]);
    // knife hand
    const K = [[0, 0], [1, 0], [1, 1], [0, 1]][k];
    const hx = 10 + K[0], hy = 17 + K[1];
    pts(g, [[hx, hy, 'O'], [hx + 1, hy, 'N'], [hx, hy + 1, 'N'], [hx + 1, hy + 1, 'N']]);
    g.px(hx + 1, hy - 1, '8'); if (k !== 2) g.px(hx + 2, hy - 1, '7');
  }

  art.sheet('npc_linnet', {
    w: 24, h: 32, ox: 12, oy: 30,
    anims: {
      idle: {
        fps: 2, ...frames([
          (g) => { linBase(g); linArmsDown(g); living(g); },
          (g) => { linBase(g); linArmsDown(g); sink(g, 3, 15, 1, 6, 17); living(g); },
          (g) => { linBase(g); linArmsDown(g); sink(g, 3, 15, 1, 6, 17); pts(g, [[19, 29, '3']]); living(g); },
          (g) => { linBase(g); linArmsDown(g); pts(g, [[19, 29, '3']]); living(g); },
        ]),
      },
      carve: {
        fps: 5, ...frames([0, 1, 2, 3].map((k) => (g) => {
          linBase(g);
          // head bowed over the work: eyes lowered
          pts(g, [[10, 9, 'j'], [13, 9, 'j'], [10, 10, 'h'], [13, 10, 'h']]);
          linArmsWork(g, k);
          if (k === 2) pts(g, [[12, 14, 'f']]);
          if (k === 3) pts(g, [[13, 13, 'g'], [16, 20, 'f']]);
          living(g);
        })),
      },
      talk: {
        fps: 5, ...frames([
          (g) => { linBase(g); linArmsDown(g); g.px(12, 11, 'h'); living(g); },
          (g) => { linBase(g); linArmsDown(g, true); pts(g, [[11, 11, 'h'], [12, 11, 'a']]); living(g); },
        ]),
      },
    },
  });

  // ================================================================ THE SNUFFER
  // Taller than doors, thin, courtly; long black vestments; long pale pinching fingers;
  // in place of a head, a blackened iron candle-snuffer cone on a slim neck.
  const SNUF_BODY = sym([
    '...........3',
    '...........2',
    '...........1',
    '...........2',
    '..........12',
    '..........12',
    '..........12',
    '.........112',
    '.........122',
    '........1122',
    '........2333',
    '...........1',
    '.........788',
    '.......12222',
    '......222222',
    '......2.21F1',
    '......2.21F1',
    '......2.21F1',
    '......2.21F1',
    '......2.21F1',
    '......2.21F1',
    '......2.21F1',
    '......2..2F1',
    '......2..2F1',
    '......2..2F1',
    '......2..2F1',
    '......2..2F1',
    '......3..2F1',
    '.........2F1',
    '.........2F1',
    '.........2F1',
    '.........2F1',
    '.........2F1',
    '........22F1',
    '........21F1',
    '........21F1',
    '.......221F1',
    '.......211F1',
    '.......211G1',
    '......221111',
    '......211111',
    '.....2211111',
    '....22111111',
    '............',
  ], 24);
  // Hands: long pale fingers. pose 0 = two fingers apart, 1 = pinched together, 2 = one finger curling.
  const SNUF_HANDS = [
    [[1, 0, '6'], [2, 0, '7'], [1, 1, '7'], [2, 1, '7'], [0, 2, '7'], [2, 2, '7'], [0, 3, '7'], [2, 3, '7'], [0, 4, '6'], [2, 4, '6'], [0, 5, '5']],
    [[1, 0, '6'], [2, 0, '7'], [1, 1, '7'], [2, 1, '7'], [1, 2, '7'], [2, 2, '6'], [1, 3, '7'], [2, 3, '6'], [1, 4, '8'], [1, 5, '6']],
    [[1, 0, '6'], [2, 0, '7'], [1, 1, '7'], [2, 1, '7'], [0, 2, '7'], [2, 2, '7'], [0, 3, '6'], [2, 3, '7'], [2, 4, '7'], [3, 5, '6']],
  ];
  function snufHand(g, x, y, flip, pose) {
    for (const p of SNUF_HANDS[pose]) g.px(flip ? x + 2 - p[0] : x + p[0], y + p[1], p[2]);
  }
  function snufBase(g, lh, rh) {
    g.stamp(0, 0, SNUF_BODY);
    // iron catches a thin cold light on its left flank; a pinprick glint; the finial
    pts(g, [[11, 0, '5'], [12, 0, '3'], [11, 1, '4'], [11, 3, '3'], [10, 4, '3'], [10, 5, '4'], [10, 6, '4'], [9, 7, '3'],
      [10, 7, '5'], [9, 8, '4'], [8, 9, '3'], [9, 9, '4'], [8, 10, '4'], [9, 10, '5'], [10, 10, '4'], [11, 10, '3'],
      [14, 10, '2'], [15, 10, '1'], [14, 9, '1'], [13, 8, '1'], [10, 5, '6']]);
    // buttons, fold lines, rim light on the left edges of the vestments
    for (let y = 15; y <= 36; y += 3) g.px(11, y, '4');
    for (let y = 15; y <= 27; y++) g.px(6, y, y % 4 === 0 ? '4' : '3');
    for (let y = 33; y <= 42; y++) g.px(y < 36 ? 8 : y < 39 ? 7 : y < 41 ? 6 : y < 42 ? 5 : 4, y, '3');
    for (let y = 30; y <= 41; y++) if (y % 3) g.px(15, y, '2');
    pts(g, [[13, 14, 'P'], [8, 14, '3'], [7, 13, '2'], [10, 39, 'G'], [13, 39, 'F']]);
    snufHand(g, 4, 28, false, lh);
    snufHand(g, 17, 28, true, rh);
  }

  art.sheet('npc_snuffer', {
    w: 24, h: 44, ox: 12, oy: 42,
    anims: {
      idle: {
        fps: 1.2, ...frames([
          (g) => { snufBase(g, 0, 0); living(g); },
          (g) => { snufBase(g, 1, 0); slide(g, 0, 11, 1); living(g); },
          (g) => { snufBase(g, 1, 2); slide(g, 0, 11, 1); living(g); },
          (g) => { snufBase(g, 0, 1); living(g); },
        ]),
      },
    },
  });

  // ================================================================ POSY — a small Waning ghost
  const POSY = sym([
    '........',
    '........',
    '........',
    '........',
    '......vv',
    '....vvww',
    '...vvwww',
    '...vwwyy',
    '...vwyyy',
    '...vwyty',
    '...vwyyy',
    '...vvxyy',
    '...vv.xx',
    '...v.wyy',
    '...wwxyy',
    '...wwxyx',
    '...wxxyx',
    '...yxxyx',
    '....wxyx',
    '....wxyx',
    '...wwxyx',
    '...wwxxx',
    '..wwwxxx',
    '........',
  ], 16);
  function posyFrame(g, i) {
    const dy = [0, -1, -2, -1][i];
    g.stamp(0, dy, POSY);
    // loose string at her neck where a tag used to hang
    pts(g, [[8, 13, 'u'], [8, 14, 'v'], [9, 15, 'u'], [9, 16, 'v']], 0, dy);
    // small hands, mouth, hair light
    pts(g, [[3, 17, 'y'], [12, 17, 'x'], [8, 11, 'x'], [6, 5, 'w'], [7, 4, 'w'], [5, 6, 'w'], [12, 9, 'x'], [11, 10, 'x']], 0, dy);
    veil(g, 14 + dy, 21 + dy, 'y', 'x', i);
    sideShade(g);
    ghostly(g, 16 + dy, 23 + dy, i);
  }
  art.sheet('npc_posy', {
    w: 16, h: 24, ox: 8, oy: 22,
    anims: { idle: { fps: 3, count: 4, draw: posyFrame } },
  });

  // ================================================================ MOUND — Tobin, once the sexton
  // A hunched heap of packed grave-earth and ash, taller than a man; lantern eyes, root-tangles,
  // grave-lilies on one shoulder, a huge spade.
  const EARTH = ['a', 'a', 'b', 'b', 'c', '4'];
  const EARTH_ASH = ['a', 'b', '3', 'c', '4', '5', '6'];
  function spade(g, gx, gy, bx, by) {
    // handle from grip (gx,gy) to blade throat (bx,by); blade continues 6px beyond.
    const dx = bx - gx, dy = by - gy, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L, px = -uy, py = ux;
    g.line(gx, gy, bx, by, 'd');
    g.line(gx + px, gy + py, bx + px, by + py, 'c');
    // T-grip
    g.line(gx - px * 2, gy - py * 2, gx + px * 2, gy + py * 2, 'e');
    // blade
    const q = [[bx - px * 2.5, by - py * 2.5], [bx + px * 2.5, by + py * 2.5],
      [bx + px * 2.5 + ux * 5, by + py * 2.5 + uy * 5], [bx + ux * 7, by + uy * 7], [bx - px * 2.5 + ux * 5, by - py * 2.5 + uy * 5]];
    g.poly(q, '5');
    g.line(q[0][0], q[0][1], q[4][0], q[4][1], '7');
    g.line(bx + ux, by + uy, bx + ux * 6, by + uy * 6, '6');
    g.line(q[1][0], q[1][1], q[2][0], q[2][1], '3');
  }
  function lilies(g, x, y) {
    pts(g, [[x + 1, y + 5, 'C'], [x + 1, y + 4, 'C'], [x + 1, y + 3, 'D'], [x + 3, y + 5, 'C'], [x + 3, y + 4, 'D'],
      [x + 4, y + 3, 'C'], [x - 1, y + 5, 'B'], [x - 1, y + 4, 'C'], [x - 2, y + 3, 'C']]);
    // three nodding pale trumpets
    pts(g, [[x, y + 1, '9'], [x + 1, y + 1, 'y'], [x + 1, y + 2, '8'], [x, y, '8'], [x + 2, y + 1, '9'],
      [x + 4, y + 1, '9'], [x + 5, y + 1, '8'], [x + 4, y + 2, 'y'], [x + 5, y, '9'],
      [x - 3, y + 2, '8'], [x - 2, y + 2, '9'], [x - 3, y + 1, '9'], [x - 2, y + 1, '7']]);
  }
  // o: { dy, eye, hands:[[lx,ly],[rx,ry]], spade:[gx,gy,bx,by] | null, rest:true }
  function moundFrame(g, o) {
    const dy = o.dy || 0;
    // legs: two sunk stumps with root-toes
    g.rect(8, 30, 6, 7, 'b'); g.rect(18, 30, 6, 7, 'b');
    g.rect(8, 30, 2, 7, 'c'); g.rect(18, 30, 2, 7, 'c'); g.rect(12, 32, 2, 5, 'a'); g.rect(22, 32, 2, 5, 'a');
    pts(g, [[7, 37, 'c'], [9, 37, 'b'], [12, 37, 'b'], [14, 37, 'a'], [17, 37, 'c'], [20, 37, 'b'], [24, 37, 'a']]);
    // torso and the great hunched back rising above the head
    orb(g, 16, 23 + dy, 10, 9, EARTH, 0.22, 11);
    orb(g, 16, 11 + dy, 8, 6, EARTH_ASH, 0.22, 16);
    orb(g, 9, 12 + dy, 6, 6, EARTH_ASH, 0.22, 12);
    orb(g, 23, 14 + dy, 6, 5, EARTH_ASH, 0.22, 13, 0.04);
    orb(g, 16, 19 + dy, 8, 5, EARTH, 0.2, 14);
    // arms: heavy, rooty, too long
    const [[lx, ly], [rx, ry]] = o.hands;
    limb(g, 7, 15 + dy, lx, ly, 2.3, 'b'); limb(g, 6, 15 + dy, lx - 1, ly, 1, 'c'); limb(g, 8, 17 + dy, lx + 1, ly, 0.6, 'a');
    limb(g, 25, 16 + dy, rx, ry, 2.3, 'b'); limb(g, 26, 16 + dy, rx + 1, ry, 1, 'a');
    // the head, sunk forward and low between the shoulders; a hollow where a face was
    orb(g, 16, 16 + dy, 4, 3.5, ['a', 'b', 'b', 'c', '4'], 0.12, 15);
    g.ellipse(16, 17 + dy, 3, 1, 'a');
    g.line(13, 15 + dy, 15, 14 + dy, 'c'); g.line(17, 14 + dy, 19, 15 + dy, 'b');
    // lantern eyes and their warm spill
    const e1 = o.eye ? 'q' : 'p';
    pts(g, [[14, 17 + dy, e1], [18, 17 + dy, e1], [15, 17 + dy, 'o'], [17, 17 + dy, 'n'],
      [14, 18 + dy, 'l'], [18, 18 + dy, 'l'], [13, 17 + dy, 'k'], [19, 17 + dy, 'k'], [16, 18 + dy, 'k']]);
    // packed ash on the upper surfaces, dark clods low down
    g.noise(4, 5 + dy, 24, 9, ['4', '5', '5', '6', '3'], 0.16, 21);
    g.noise(7, 20 + dy, 18, 12, ['a', 'a', '3'], 0.12, 22);
    // root tangles across the body
    g.line(9, 20 + dy, 12, 25 + dy, 'c'); g.line(12, 25 + dy, 11, 30 + dy, 'b');
    g.line(22, 20 + dy, 20, 24 + dy, 'c'); g.line(20, 24 + dy, 22, 29 + dy, 'b');
    g.line(14, 26 + dy, 18, 27 + dy, 'c');
    pts(g, [[9, 20 + dy, 'd'], [22, 20 + dy, 'd'], [15, 26 + dy, 'd'], [10, 22 + dy, 'd']]);
    // hands: root-fingers
    pts(g, [[lx - 1, ly + 2, 'c'], [lx, ly + 3, 'c'], [lx + 1, ly + 2, 'b'], [lx - 2, ly + 1, 'b'], [lx, ly + 4, 'b']]);
    pts(g, [[rx - 1, ry + 2, 'c'], [rx + 1, ry + 2, 'b'], [rx + 2, ry + 1, 'b']]);
    // dangling root tendrils
    pts(g, [[5, 25 + dy, 'b'], [5, 26 + dy, 'c'], [27, 27 + dy, 'b'], [27, 28 + dy, 'c'], [13, 31, 'b'], [20, 31, 'b'], [16, 32, 'a']]);
    // grave-lilies growing from the left shoulder
    lilies(g, 7, 1 + dy);
    if (o.spade) spade(g, ...o.spade);
    // ash sifting from him
    if (o.sift != null) g.px(o.sift[0], o.sift[1], '6');
    if (o.clods) pts(g, o.clods);
    living(g);
  }
  const MOUND_REST = (dy, eye, sift) => ({ dy, eye, sift, hands: [[5, 30], [27, 21 + dy]], spade: [28, 4, 28, 30] });
  art.sheet('npc_mound', {
    w: 32, h: 40, ox: 16, oy: 38,
    anims: {
      idle: {
        fps: 1.6, ...frames([
          (g) => moundFrame(g, MOUND_REST(0, false, [5, 30])),
          (g) => moundFrame(g, MOUND_REST(1, false, [5, 33])),
          (g) => moundFrame(g, MOUND_REST(1, true, [5, 36])),
          (g) => moundFrame(g, MOUND_REST(0, false, null)),
        ]),
      },
      dig: {
        fps: 5, ...frames([
          // lift the spade
          (g) => moundFrame(g, { dy: 0, hands: [[13, 17], [19, 13]], spade: [17, 5, 17, 20] }),
          // drive it in
          (g) => moundFrame(g, { dy: 1, hands: [[14, 24], [18, 18]], spade: [17, 14, 17, 30] }),
          // lean on it
          (g) => moundFrame(g, { dy: 2, hands: [[14, 26], [18, 20]], spade: [17, 16, 17, 32], clods: [[13, 37, 'b'], [21, 37, 'c']] }),
          // heave
          (g) => moundFrame(g, { dy: 1, hands: [[12, 22], [18, 19]], spade: [12, 14, 19, 26], clods: [[20, 28, 'b'], [21, 27, 'c'], [22, 28, 'b'], [21, 29, 'a']] }),
          // fling the earth aside
          (g) => moundFrame(g, { dy: 0, hands: [[14, 19], [21, 17]], spade: [11, 17, 23, 13], clods: [[29, 8, 'c'], [30, 11, 'b'], [27, 6, 'b'], [31, 7, 'a'], [28, 10, 'c']] }),
          // recover
          (g) => moundFrame(g, { dy: 0, eye: true, hands: [[12, 21], [20, 17]], spade: [15, 9, 18, 24], clods: [[29, 21, 'b'], [30, 26, 'c'], [28, 33, 'b'], [30, 36, 'b']] }),
        ]),
      },
    },
  });

  // ================================================================ FENWICK — pilgrim-peddler
  // Round cheerful face, wide-brimmed hat with pilgrim badges, an enormous pack of pots, relic boxes,
  // a birdcage and candles; a staff.
  const FEN_BODY = sym([
    '............',
    '............',
    '............',
    '............',
    '.........bbb',
    '........cbbb',
    '........cbbb',
    '........aaaa',
    '.....acbbbbb',
    '......aaaaaa',
    '........hiii',
    '.......ijjjj',
    '.......ij1jj',
    '.......ijjjj',
    '.......iijjj',
    '........iijj',
    '.......BCCeg',
    '......BCCCde',
    '......BCCCde',
    '......BCCCde',
    '......BCCbbb',
    '......BCCCde',
    '......BCCCde',
    '......BBCCdd',
    '.......BCCdd',
    '.......BBC33',
    '.........34.',
    '.........34.',
    '.........34.',
    '........abb.',
    '........aab.',
    '............',
  ], 24);
  function fenPack(g, k) {
    // sacking and the wooden frame, seen around his shoulders
    g.rect(4, 6, 16, 17, '4'); g.rect(12, 6, 8, 17, '3'); g.rect(4, 6, 16, 1, '5');
    g.rect(19, 4, 1, 20, 'c'); g.rect(4, 4, 16, 1, 'd'); g.rect(4, 4, 1, 3, 'd');
    // rolled blanket, tied, on the right
    g.rect(19, 9, 3, 6, 'H'); g.rect(19, 9, 3, 1, 'I'); g.rect(21, 10, 1, 5, 'G'); g.rect(19, 12, 3, 1, 'b');
    // relic box with a brass corner
    g.rect(16, 4, 4, 3, 'K'); g.rect(16, 4, 4, 1, 'L'); g.px(16, 4, 'M'); g.rect(19, 5, 1, 2, 'J');
    // birdcage with a small grey bird that hops
    pts(g, [[7, 0, 'K'], [6, 1, 'K'], [7, 1, 'L'], [8, 1, 'K'], [5, 2, 'K'], [9, 2, 'K'], [5, 3, 'K'], [7, 3, 'J'], [9, 3, 'K'],
      [5, 4, 'K'], [9, 4, 'K'], [5, 5, 'J'], [6, 5, 'J'], [7, 5, 'J'], [8, 5, 'J'], [9, 5, 'J']]);
    g.rect(6, 2, 3, 3, '1');
    if (k === 2) pts(g, [[6, 2, '7'], [7, 2, '8'], [8, 2, '3']]); else pts(g, [[6, 4, '7'], [7, 4, '8'], [7, 3, 'J'], [8, 4, '3']]);
    // a bundle of candles, a copper pot with its bail
    pts(g, [[11, 1, '9'], [12, 0, '8'], [13, 1, '9'], [11, 2, '9'], [12, 1, '9'], [13, 2, '8'], [11, 3, '8'], [12, 2, '9'],
      [13, 3, '8'], [12, 3, '8'], [11, 0, '1'], [12, -1, '1'], [13, 0, '1'], [11, 4, 'b'], [12, 4, 'b'], [13, 4, 'b']]);
    g.rect(14, 3, 4, 3, 'l'); g.rect(14, 3, 4, 1, 'n'); g.rect(17, 4, 1, 2, 'k'); g.px(14, 4, 'm');
    pts(g, [[14, 2, '5'], [15, 1, '5'], [16, 1, '5'], [17, 2, '5']]);
    g.px(10, 5, 'e'); g.px(9, 6, 'd');
  }
  function fenFrame(g, k) {
    const breath = k === 1 || k === 2;
    fenPack(g, k);
    g.stamp(0, 0, FEN_BODY);
    // hat: badges — a scallop shell, a gilt saint, a tin hand
    pts(g, [[9, 6, '9'], [10, 6, '8'], [12, 5, 'M'], [14, 6, '7'], [6, 8, 'L'], [17, 8, 'e'], [8, 5, 'e']]);
    // grin, cheeks
    pts(g, [[10, 14, 'h'], [11, 15, 'h'], [12, 15, 'h'], [13, 14, 'h'], [8, 13, 'j'], [15, 13, 'i'], [16, 12, 'h'], [16, 13, 'h'],
      [9, 11, 'h'], [14, 11, 'h'], [8, 14, 'I'], [15, 14, 'H'], [9, 13, 'j']]);
    // pack straps and belt pouch
    pts(g, [[8, 16, 'b'], [8, 17, 'b'], [15, 16, 'a'], [15, 17, 'a'], [14, 21, 'd'], [15, 21, 'd'], [14, 22, 'c'], [15, 22, 'c'],
      [11, 20, 'K']]);
    // cloak edge light
    for (let y = 17; y <= 24; y++) g.px(6, y, 'D');
    // staff in his right hand; a gourd hanging from it
    g.rect(2, 3, 1, 28, 'd'); g.rect(3, 4, 1, 26, 'c'); pts(g, [[2, 2, 'e'], [3, 2, 'd'], [2, 1, 'd']]);
    pts(g, [[1, 6, 'b'], [0, 7, 'e'], [1, 7, 'd'], [0, 8, 'd'], [1, 8, 'c'], [1, 9, 'c']]);
    pts(g, [[5, 18, 'C'], [4, 19, 'C'], [3, 19, 'j'], [4, 20, 'i'], [3, 20, 'i'], [2, 20, 'i'], [17, 22, 'i'], [17, 23, 'h']]);
    if (breath) sink(g, 0, 16, 1, 5, 21);
    living(g);
  }
  art.sheet('npc_fenwick', {
    w: 24, h: 32, ox: 12, oy: 30,
    anims: { idle: { fps: 2.5, count: 4, draw: fenFrame } },
  });

  // ================================================================ HESK — ex-watchman
  // 50s, stubble, battered brigandine over a faded city-watch tabard, dented kettle helm, halberd, flask.
  const HESK_FRONT = sym([
    '............',
    '............',
    '............',
    '..........56',
    '.........566',
    '.........566',
    '........4566',
    '.....4556666',
    '......344443',
    '........hhhh',
    '........ii1i',
    '........iiij',
    '........5i5h',
    '.........5i5',
    '........4545',
    '.....55GHHHH',
    '.....65GHHHH',
    '.....65GHHHH',
    '.....65GGHHH',
    '.....54GGGHH',
    '.....54GGGGG',
    '.....ii2bbbb',
    '.......tuuvv',
    '.......tuuvv',
    '.......tuuuv',
    '.......ttuuu',
  ], 24);
  const HESK_BACK = sym([
    '............',
    '............',
    '............',
    '..........56',
    '.........566',
    '.........566',
    '........4566',
    '.....4556666',
    '......344443',
    '........5555',
    '........5445',
    '........4hhh',
    '.........hhh',
    '........4444',
    '........4444',
    '.....55GGGGG',
    '.....65GHGGG',
    '.....65GGGGG',
    '.....65GGHGG',
    '.....54GGGGG',
    '.....54GGGGG',
    '.....ii2bbbb',
    '.......tuuuu',
    '.......tuuuu',
    '.......tuuuu',
    '.......ttuuu',
  ], 24);
  const HESK_SIDE = [
    null, null, null,
    [10, '5566'],
    [9, '566666'],
    [9, '566666'],
    [8, '45666666'],
    [6, '445566666665'],
    [7, '34444444443'],
    [9, '55hhhhh'],
    [9, '55iii1i'],
    [9, '5hiiiiij'],
    [10, '5i5i5h'],
    [10, '45i5i'],
    [10, '4545'],
    [8, '5GGGHHHG'],
    [8, 'GGGH65HG'],
    [8, 'GGGH65HG'],
    [8, 'GGGH65HG'],
    [8, 'GGGG54GG'],
    [8, 'GGGGiiGG'],
    [8, '2bbbiibb'],
    [9, 'tuuuuv'],
    [9, 'tuuuuv'],
    [9, 'tuuuuv'],
    [9, 'ttuuuu'],
  ];
  // Legs (rows 25..30). front: stand / left lifted / right lifted. side: together / apart.
  const HL = {
    stand: [[[9, '43'], [13, '34']], [[9, '43'], [13, '34']], [[9, '43'], [13, '34']], [[8, 'abb'], [13, 'bba']], [[8, 'abb'], [13, 'bba']], [[8, 'aab'], [13, 'baa']]],
    liftL: [[[9, '43'], [13, '34']], [[9, '43'], [13, '34']], [[8, 'abb'], [13, '34']], [[8, 'aab'], [13, 'bba']], [[13, 'bba']], [[13, 'baa']]],
    liftR: [[[9, '43'], [13, '34']], [[9, '43'], [13, '34']], [[9, '43'], [13, 'bba']], [[8, 'abb'], [13, 'baa']], [[8, 'abb']], [[8, 'aab']]],
    sideT: [[11, '34'], [11, '34'], [11, '34'], [11, '34'], [11, 'abbb'], [11, 'aabb']],
    sideA: [[[10, '3'], [13, '4']], [[10, '3'], [13, '4']], [[9, '3'], [14, '4']], [[9, '3'], [14, '4']], [[7, 'aab'], [14, 'abbb']], [[7, 'aa'], [14, 'aabb']]],
    sideB: [[[10, '4'], [13, '3']], [[10, '4'], [13, '3']], [[9, '4'], [14, '3']], [[9, '4'], [14, '3']], [[7, 'abb'], [14, 'aabb']], [[7, 'aa'], [14, 'aaab']]],
  };
  function heskLegs(g, set) { paint(g, [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null].concat(set)); }
  function heskFrontDetail(g, dy) {
    // rivets, battered plates, the dent, the flask, the belt
    pts(g, [[9, 16, 'L'], [14, 16, 'L'], [11, 18, 'L'], [12, 18, 'K'], [9, 20, 'K'], [14, 20, 'K'], [16, 17, 'F'], [16, 18, 'F'],
      [16, 19, 'F'], [16, 20, 'F'], [13, 4, '4'], [12, 5, '5'], [16, 7, '4'], [17, 8, '4'], [10, 9, 'a'], [13, 9, 'a'],
      [11, 21, 'L'], [15, 21, 'c'], [15, 22, 'K'], [16, 22, 'L'], [15, 23, 'K'], [16, 23, 'K'], [15, 24, 'J'], [16, 24, 'J'],
      [11, 23, 'v'], [12, 23, 'v'], [11, 24, 'u'], [8, 15, 'H']], 0, dy);
  }
  function heskBackDetail(g, dy) {
    pts(g, [[9, 16, 'L'], [14, 16, 'L'], [11, 18, 'L'], [12, 18, 'K'], [9, 20, 'K'], [14, 20, 'K'], [10, 4, '4'], [11, 5, '5'],
      [7, 7, '4'], [11, 21, 'b'], [7, 22, 'K'], [7, 23, 'J'], [16, 17, 'F'], [16, 18, 'F']], 0, dy);
  }
  function heskSideDetail(g, dy) {
    pts(g, [[9, 16, 'L'], [11, 18, 'L'], [9, 20, 'K'], [12, 4, '4'], [7, 7, '4'], [13, 9, 'a'], [8, 22, 'K'], [8, 23, 'K'],
      [8, 24, 'J'], [9, 21, 'L']], 0, dy);
  }
  // Polearm: grip (hx,hy), angle towards the head, reach to the head, butt length, blade side (+1/-1).
  function halberd(g, hx, hy, ang, fwd, back, side) {
    const ux = Math.cos(ang), uy = Math.sin(ang);
    const tx = hx + ux * fwd, ty = hy + uy * fwd, bx = hx - ux * back, by = hy - uy * back;
    g.line(bx, by, tx, ty, 'd');
    g.line(tx, ty, tx + ux * 3, ty + uy * 3, '7');
    const px = -uy * side, py = ux * side;
    const hx0 = tx - ux, hy0 = ty - uy;
    const A = [hx0 + px, hy0 + py], B = [hx0 + px * 4 + ux * 1.5, hy0 + py * 4 + uy * 1.5],
      C = [hx0 + px * 4 - ux * 4.5, hy0 + py * 4 - uy * 4.5], D = [hx0 + px - ux * 3, hy0 + py - uy * 3];
    g.poly([A, B, C, D], '6');
    g.line(B[0], B[1], C[0], C[1], '8');
    g.line(D[0], D[1], C[0], C[1], '4');
    g.line(hx0 - px, hy0 - py, hx0 - px * 2.5 - ux * 1.5, hy0 - py * 2.5 - uy * 1.5, '5');
    g.px(tx - ux * 5, ty - uy * 5, '5');
  }
  const UP = -Math.PI / 2;
  function heskFront(g, legs, dy, hal, br) {
    if (hal && hal.behind) halberd(g, ...hal.args);
    heskLegs(g, HL[legs]);
    g.stamp(0, dy, HESK_FRONT);
    heskFrontDetail(g, dy);
    if (hal && !hal.behind) halberd(g, ...hal.args);
    if (hal && hal.hands) pts(g, hal.hands);
    if (br) sink(g, 0, 15, 1, 5, 18);
    living(g);
  }
  function heskBack(g, legs, dy, hal, br) {
    if (hal && hal.behind) halberd(g, ...hal.args);
    heskLegs(g, HL[legs]);
    g.stamp(0, dy, HESK_BACK);
    heskBackDetail(g, dy);
    if (hal && !hal.behind) halberd(g, ...hal.args);
    if (hal && hal.hands) pts(g, hal.hands);
    if (br) sink(g, 0, 15, 1, 5, 18);
    living(g);
  }
  function heskSide(g, legs, dy, hal, armless, br) {
    if (hal && hal.behind) halberd(g, ...hal.args);
    heskLegs(g, HL[legs]);
    paint(g, HESK_SIDE, 0, dy);
    heskSideDetail(g, dy);
    if (armless) recol(g, 12, 16 + dy, 13, 21 + dy, { 6: 'G', 5: 'G', i: 'G' });
    if (hal && !hal.behind) halberd(g, ...hal.args);
    if (hal && hal.arm) limb(g, 12, 16 + dy, hal.arm[0], hal.arm[1], 0.8, '5');
    if (hal && hal.hands) pts(g, hal.hands);
    if (br) sink(g, 0, 15, 1, 5, 18);
    living(g);
  }
  // Idle / walking: the halberd stands upright in his right hand.
  const hFrontHold = (dy) => ({ args: [4, 20 + dy, UP, 18, 9, -1], hands: [[4, 20 + dy, 'i'], [5, 20 + dy, 'i'], [4, 21 + dy, 'h']] });
  const hBackHold = (dy) => ({ args: [19, 20 + dy, UP, 18, 9, 1], hands: [[19, 20 + dy, 'i'], [18, 20 + dy, 'h'], [19, 21 + dy, 'h']] });
  const hSideHold = (dy) => ({ args: [17, 19 + dy, UP, 17, 10, 1], arm: [16, 19 + dy], hands: [[16, 19 + dy, 'i'], [17, 19 + dy, 'i'], [17, 20 + dy, 'h']] });
  const hands = (x, y) => [[x, y, 'i'], [x + 1, y, 'i'], [x, y + 1, 'h'], [x + 1, y + 1, 'h']];

  art.sheet('npc_hesk', {
    w: 24, h: 32, ox: 12, oy: 30,
    anims: {
      idle: {
        fps: 2, ...frames([
          (g) => heskFront(g, 'stand', 0, hFrontHold(0)),
          (g) => heskFront(g, 'stand', 0, hFrontHold(0)),
          (g) => heskFront(g, 'stand', 0, hFrontHold(0), true),
          (g) => heskFront(g, 'stand', 0, hFrontHold(0), true),
        ]),
      },
      idle_up: { fps: 2, ...frames([(g) => heskBack(g, 'stand', 0, hBackHold(0)), (g) => heskBack(g, 'stand', 0, hBackHold(0), true)]) },
      idle_side: { fps: 2, ...frames([(g) => heskSide(g, 'sideT', 0, hSideHold(0), true), (g) => heskSide(g, 'sideT', 0, hSideHold(0), true, true)]) },
      walk_down: {
        fps: 7, ...frames([
          (g) => heskFront(g, 'stand', 0, hFrontHold(0)),
          (g) => heskFront(g, 'liftL', -1, hFrontHold(-1)),
          (g) => heskFront(g, 'stand', 0, hFrontHold(0)),
          (g) => heskFront(g, 'liftR', -1, hFrontHold(-1)),
        ]),
      },
      walk_up: {
        fps: 7, ...frames([
          (g) => heskBack(g, 'stand', 0, hBackHold(0)),
          (g) => heskBack(g, 'liftR', -1, hBackHold(-1)),
          (g) => heskBack(g, 'stand', 0, hBackHold(0)),
          (g) => heskBack(g, 'liftL', -1, hBackHold(-1)),
        ]),
      },
      walk_side: {
        fps: 7, ...frames([
          (g) => heskSide(g, 'sideA', 0, hSideHold(0), true),
          (g) => heskSide(g, 'sideT', -1, hSideHold(-1), true),
          (g) => heskSide(g, 'sideB', 0, hSideHold(0), true),
          (g) => heskSide(g, 'sideT', -1, hSideHold(-1), true),
        ]),
      },
      attack_side: {
        fps: 10, loop: false, ...frames([
          (g) => heskSide(g, 'sideA', 0, { behind: true, args: [9, 11, -2.4, 13, 7, -1], arm: [9, 12], hands: hands(8, 11) }, true),
          (g) => heskSide(g, 'sideA', -1, { args: [13, 9, -1.1, 12, 8, 1], arm: [13, 10], hands: hands(12, 9) }, true),
          (g) => heskSide(g, 'sideB', 1, { args: [15, 18, 0.62, 10, 9, 1], arm: [15, 18], hands: hands(14, 18) }, true),
          (g) => heskSide(g, 'sideT', 0, { args: [16, 18, -0.45, 9, 8, 1], arm: [15, 18], hands: hands(15, 18) }, true),
        ]),
      },
      attack_down: {
        fps: 10, loop: false, ...frames([
          (g) => heskFront(g, 'stand', 0, { behind: true, args: [12, 9, -1.75, 9, 13, -1], hands: hands(11, 9).concat([[9, 12, '5'], [14, 12, '5'], [10, 11, '5'], [13, 11, '5']]) }),
          (g) => heskFront(g, 'liftL', -1, { args: [15, 11, -0.35, 10, 10, 1], hands: hands(14, 11) }),
          (g) => heskFront(g, 'stand', 1, { args: [13, 20, 1.35, 9, 12, 1], hands: hands(12, 20) }),
          (g) => heskFront(g, 'stand', 0, { args: [13, 20, 1.15, 7, 12, 1], hands: hands(12, 20) }),
        ]),
      },
      attack_up: {
        fps: 10, loop: false, ...frames([
          (g) => heskBack(g, 'stand', 0, { args: [12, 12, 1.65, 11, 8, 1], hands: hands(11, 11) }),
          (g) => heskBack(g, 'liftR', -1, { behind: true, args: [13, 9, -1.95, 8, 12, 1], hands: hands(12, 9) }),
          (g) => heskBack(g, 'stand', -1, { behind: true, args: [12, 8, UP, 5, 14, 1], hands: hands(11, 8).concat([[9, 12, '5'], [14, 12, '5']]) }),
          (g) => heskBack(g, 'stand', 0, { behind: true, args: [12, 10, -1.35, 7, 12, 1], hands: hands(11, 10) }),
        ]),
      },
    },
  });

  // ================================================================ GHOSTS (the Waning)
  // No black outline: slate outline, v/w/x/y bodies, dithered fading lower edges.
  const FLOAT = [0, -1, -1, 0];
  // Draw a ghost figure: rows (full width), overlay fn(g, dy), fade rows, frame index.
  function ghostFig(g, rows, over, f0, f1, i, dy) {
    dy = dy == null ? FLOAT[i % 4] : dy;
    g.stamp(0, dy, rows);
    if (over) over(g, dy, i);
    sideShade(g);
    ghostly(g, f0 + dy, f1 + dy, i);
  }
  function ghostSheet(id, w, h, ox, oy, rows, over, f0, f1, extra) {
    const anims = {
      idle: { fps: 2.2, count: 4, draw: (g, i) => ghostFig(g, rows, over, f0, f1, i) },
    };
    Object.assign(anims, extra || {});
    art.sheet(id, { w, h, ox, oy, anims });
  }

  const GHOST_MAN = sym([
    '............',
    '............',
    '............',
    '............',
    '.........vvv',
    '........vvvv',
    '........vwxx',
    '........wxxx',
    '........wxux',
    '........wxxx',
    '........wwxx',
    '.........wxx',
    '..........ww',
    '.......vwxxx',
    '......vwwxxx',
    '......vw.wxx',
    '......vw.wxx',
    '......vw.wxx',
    '......vw.wxx',
    '......xx.vvv',
    '.........wxx',
    '.........wxx',
    '.........wxx',
    '.........ww.',
    '.........ww.',
    '.........wv.',
    '.........vv.',
    '........vvv.',
    '............',
    '............',
    '............',
    '............',
  ], 24);
  ghostSheet('npc_ghost_man', 24, 32, 12, 30, GHOST_MAN, (g, dy) => {
    pts(g, [[11, 11, 'w'], [12, 11, 'w'], [9, 5, 'w'], [10, 4, 'w'], [14, 6, 'v'], [15, 7, 'v'], [10, 15, 'y'], [11, 16, 'y'],
      [15, 20, 'v'], [16, 19, 'w']], 0, dy);
  }, 20, 28);

  const GHOST_WOMAN = sym([
    '............',
    '............',
    '............',
    '............',
    '..........vv',
    '........vvww',
    '.......vwwxx',
    '.......vwxxx',
    '.......vwxux',
    '.......vwxxx',
    '.......vwwxx',
    '........vwwx',
    '.......vvwww',
    '......vwwwxx',
    '......vw.wxx',
    '......vw.wxx',
    '......vw.wxx',
    '.......wwxxy',
    '........wwyy',
    '........vwxx',
    '........vwxx',
    '.......vwwxx',
    '.......vwwxx',
    '......vvwwxx',
    '......vwwwxx',
    '......vwwwwx',
    '.....vvwwwwx',
    '.....vwwwwww',
    '.....vwwwwww',
    '....vvwwwwww',
    '............',
    '............',
  ], 24);
  ghostSheet('npc_ghost_woman', 24, 32, 12, 30, GHOST_WOMAN, (g, dy) => {
    pts(g, [[11, 11, 'x'], [12, 11, 'w'], [9, 6, 'x'], [10, 5, 'x'], [13, 21, 'x'], [10, 23, 'v'], [14, 25, 'v']], 0, dy);
  }, 21, 29);

  const GHOST_CHILD = sym([
    '........',
    '........',
    '........',
    '........',
    '........',
    '.....vvv',
    '....vvvv',
    '....vxxx',
    '....vxux',
    '....xxxx',
    '.....wxx',
    '......ww',
    '....wwxx',
    '...vwwxx',
    '...vw.xx',
    '...vw.wx',
    '...xw.wx',
    '.....vwx',
    '.....wwx',
    '.....wwx',
    '.....w..',
    '.....v..',
    '.....v..',
    '........',
  ], 16);
  ghostSheet('npc_ghost_child', 16, 24, 8, 22, GHOST_CHILD, (g, dy) => {
    pts(g, [[4, 5, 'v'], [11, 5, 'v'], [3, 6, 'v'], [6, 5, 'w'], [8, 10, 'w'], [7, 13, 'y'], [9, 17, 'v']], 0, dy);
  }, 16, 22);

  const GHOST_SOLDIER = sym([
    '............',
    '............',
    '............',
    '..........vv',
    '.........vww',
    '.........vww',
    '.....uvvwwww',
    '......uuvvvv',
    '........vxxx',
    '........xxux',
    '........xxxx',
    '........vwxx',
    '.........wxx',
    '.......vwwxx',
    '......vwwxxx',
    '......vwxwxx',
    '......vwxwxx',
    '......vwxwxx',
    '......vwxwxx',
    '......xxvvvv',
    '........vwxx',
    '........vwxx',
    '........vwwx',
    '.........wx.',
    '.........wx.',
    '.........ww.',
    '.........vv.',
    '........vvv.',
    '............',
    '............',
    '............',
    '............',
  ], 24);
  ghostSheet('npc_ghost_soldier', 24, 32, 12, 30, GHOST_SOLDIER, (g, dy) => {
    // spear: leaf blade, shaft, his hand on it; a dent in the helm; a slash across the jack
    for (let y = 3; y <= 27; y++) g.px(4, y + dy, 'w');
    pts(g, [[4, 0, 'y'], [3, 1, 'x'], [4, 1, 'y'], [5, 1, 'x'], [4, 2, 'y'], [3, 3, 'v'], [5, 3, 'v'], [5, 19, 'y'], [6, 19, 'x'],
      [13, 4, 'v'], [12, 5, 'w'], [9, 16, 'u'], [10, 17, 'u'], [11, 18, 'u'], [10, 8, 'v'], [13, 8, 'v']], 0, dy);
  }, 20, 28);

  const GHOST_MONK = sym([
    '............',
    '............',
    '............',
    '..........vv',
    '........vvww',
    '.......vwwww',
    '.......vwttt',
    '.......vwtxx',
    '.......vwtux',
    '.......vwtxx',
    '.......vwwtx',
    '......vwwwww',
    '......vwwwxx',
    '......vwwxxx',
    '......vwwxxx',
    '.......vwwxx',
    '.......vwwww',
    '.......vvwwv',
    '........vxxx',
    '........vwxx',
    '........vwxx',
    '.......vwwxx',
    '.......vwwxx',
    '.......vwwwx',
    '......vvwwwx',
    '......vwwwww',
    '......vwwwww',
    '.....vvwwwww',
    '.....vvvvvvv',
    '............',
    '............',
    '............',
  ], 24);
  ghostSheet('npc_ghost_monk', 24, 32, 12, 30, GHOST_MONK, (g, dy) => {
    pts(g, [[9, 4, 'x'], [8, 5, 'x'], [11, 18, 'y'], [12, 18, 'x'], [12, 19, 'x'], [12, 20, 'w'], [11, 21, 'w'], [11, 16, 'v']], 0, dy);
  }, 20, 29);

  // ---------------------------------------------------------------- ANSELM — drowned prior, writing forever
  const ANSELM = sym([
    '............',
    '............',
    '............',
    '..........xy',
    '.........xyy',
    '........uvvv',
    '........vxxx',
    '........vxux',
    '........vxxx',
    '........wxxx',
    '.........wxx',
    '........vvww',
    '.......vwwww',
    '......vwwwxx',
    '......vw.wxx',
    '......vw.wxx',
    '......vw.wxx',
    '......vw.wxx',
    '......xx.vxx',
    '.........wxx',
    '........vwxx',
    '........vwwx',
    '.......vvwwx',
    '.......vwwww',
    '.......vwwww',
    '......vvwwww',
    '......vwwwww',
    '......vvvvvv',
    '............',
    '............',
    '............',
    '............',
  ], 24);
  // Drips: water still running off him. k = frame.
  function anselmDrips(g, dy, k) {
    const D = [[7, 21], [16, 21], [9, 27], [14, 27]];
    D.forEach(([x, y], n) => { const yy = y + ((k + n) % 4); g.px(x, yy + dy, n % 2 ? 'w' : 'x'); });
  }
  function anselmOver(g, dy, k, writing, stroke) {
    pts(g, [[10, 3, 'y'], [11, 4, 'y'], [13, 4, 'x'], [11, 10, 'w'], [12, 10, 'w'], [11, 18, 'x'], [12, 18, 'x'], [13, 19, 'v']], 0, dy);
    if (!writing) {
      // quill up in his right hand, the letter hanging from his left
      pts(g, [[6, 14, 'y'], [5, 15, 'y'], [6, 15, 'x'], [5, 16, 'x'], [6, 17, 'w'], [16, 16, 'y'], [17, 16, 'y'], [16, 17, 'y'],
        [17, 17, 'x'], [16, 18, 'x'], [17, 18, 'y'], [16, 19, 'y'], [17, 19, 'x'], [16, 20, 'x'], [17, 20, 'w']], 0, dy);
    } else {
      // bowed over the page held at his chest; the quill scratches
      pts(g, [[10, 7, 'x'], [13, 7, 'x'], [10, 8, 'u'], [13, 8, 'u']], 0, dy);
      recol(g, 6, 14 + dy, 7, 18 + dy, { x: 'w' });
      for (let y = 14; y <= 17; y++) for (let x = 11; x <= 16; x++) g.px(x, y + dy, (x + y) % 3 ? 'y' : 'x');
      pts(g, [[12, 15, 'v'], [13, 15, 'v'], [14, 15, 'v'], [12, 16, 'v'], [13, 16, 'v'], [15, 17, 'v'], [16, 14, 'x'], [17, 15, 'x'], [17, 16, 'w']], 0, dy);
      const Q = [[10, 15], [11, 16], [12, 15], [11, 14]][stroke];
      pts(g, [[8, 16, 'w'], [9, 16, 'x'], [Q[0], Q[1], 'y'], [Q[0] - 1, Q[1] - 1, 'y'], [Q[0] - 2, Q[1] - 2, 'x'], [Q[0] - 2, Q[1] - 3, 'x']], 0, dy);
    }
    anselmDrips(g, dy, k);
  }
  art.sheet('npc_anselm', {
    w: 24, h: 32, ox: 12, oy: 30,
    anims: {
      idle: { fps: 2.2, count: 4, draw: (g, i) => ghostFig(g, ANSELM, (gg, dy) => anselmOver(gg, dy, i, false), 20, 28, i) },
      write: { fps: 5, count: 4, draw: (g, i) => ghostFig(g, ANSELM, (gg, dy) => anselmOver(gg, dy, i, true, i), 20, 28, i, 0) },
    },
  });

  // ---------------------------------------------------------------- MAUD — old widow in a shawl
  const MAUD = sym([
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '..........vv',
    '........vvww',
    '.......vwwww',
    '.......vwxxx',
    '.......vwxux',
    '.......vwxxx',
    '.......vwxxw',
    '......vwwwwx',
    '.....vwwwwww',
    '.....vwwwxxx',
    '.....vvwwwxy',
    '......vvwwxx',
    '.......vwwxx',
    '.......vwwxx',
    '.......vwwwx',
    '......vvwwwx',
    '......vwwwwx',
    '......vwwwww',
    '.....vvwwwww',
    '.....vwwwwww',
    '.....vvvvvvv',
    '............',
    '............',
    '............',
    '............',
    '............',
  ], 24);
  ghostSheet('npc_maud', 24, 32, 12, 30, MAUD, (g, dy) => {
    // shawl fringe, wrinkles, a bare ring-finger on her clasped hands
    pts(g, [[5, 15, 'v'], [18, 15, 'v'], [4, 16, 'u'], [19, 16, 'u'], [9, 12, 'w'], [14, 12, 'w'], [10, 9, 'w'], [13, 9, 'w'],
      [10, 16, 'y'], [13, 16, 'x'], [12, 17, 'y'], [9, 8, 'x'], [10, 7, 'x'], [16, 19, 'v'], [8, 21, 'v']], 0, dy);
  }, 19, 27);

  // ---------------------------------------------------------------- AGNA — the nurse who carried Wren out
  const AGNA = sym([
    '............',
    '............',
    '............',
    '..........ww',
    '........wwww',
    '.......wwwxx',
    '.......wyyyy',
    '.......wyxxx',
    '.......wyxux',
    '.......wyxxx',
    '.......wyyxx',
    '.......wyyyy',
    '......wwyyyy',
    '......vwwwxx',
    '......vw.yyy',
    '......vw.yxx',
    '......vw.yxx',
    '......vw.yxx',
    '......xx.yxx',
    '........vyxx',
    '........vyxx',
    '.......vwyxx',
    '.......vwyxx',
    '.......vwyyx',
    '......vvwyyx',
    '......vwwwww',
    '......vwwwww',
    '.....vvvvvvv',
    '............',
    '............',
    '............',
    '............',
  ], 24);
  ghostSheet('npc_agna', 24, 32, 12, 30, AGNA, (g, dy) => {
    // veil falls behind the shoulders; apron strings; a tired mouth
    pts(g, [[6, 12, 'v'], [17, 12, 'v'], [6, 13, 'u'], [17, 13, 'u'], [11, 10, 'w'], [12, 10, 'w'], [8, 19, 'w'], [15, 19, 'w'],
      [9, 4, 'x'], [10, 3, 'x'], [12, 14, 'x'], [11, 21, 'x'], [13, 23, 'x']], 0, dy);
  }, 20, 28);

  // ---------------------------------------------------------------- QUEEN YSOLDE
  const QUEEN = sym([
    '............',
    '............',
    '............',
    '.........vvv',
    '........vvww',
    '........KLKL',
    '........vxxx',
    '........vxux',
    '........vxxx',
    '........vxxw',
    '........vvxx',
    '.......vvvww',
    '......vwwwxx',
    '......vwwxxy',
    '......vw.xxy',
    '......vw.wxy',
    '......vw.wxy',
    '.......wwxyy',
    '........wyyy',
    '........vwxx',
    '........vwxx',
    '.......vwwxx',
    '.......vwwxx',
    '......vvwwxx',
    '......vwwwxx',
    '.....vvwwwxx',
    '.....vwwwwxx',
    '....vvwwwwwx',
    '....vwwwwwwx',
    '...vvwwwwwww',
    '...vwwwwwwww',
    '..vvwwwwwwww',
    '..vvvvvvvvvv',
    '............',
    '............',
    '............',
  ], 24);
  function queenOver(g, dy, k, plate) {
    // tarnished circlet: the only warmth left in her
    pts(g, [[11, 4, 'K'], [12, 4, 'L'], [8, 5, 'J'], [15, 5, 'J'], [10, 7, 'u'], [13, 7, 'u'], [11, 9, 'w'], [12, 9, 'w'],
      [7, 12, 'u'], [16, 12, 'u'], [7, 13, 'v'], [16, 13, 'v'], [11, 20, 'x'], [12, 22, 'x'], [10, 26, 'x']], 0, dy);
    // the train sweeps behind her to one side
    pts(g, [[21, 29, 'v'], [21, 30, 'w'], [22, 30, 'v'], [21, 31, 'w'], [22, 31, 'w'], [23, 31, 'v'], [22, 32, 'v'], [23, 32, 'v']], 0, dy);
    if (plate == null) return;
    // serve: a plate carried and set down (plate = 0..3)
    recol(g, 8, 17 + dy, 15, 18 + dy, { y: 'x', w: 'w' });
    const P = [15, 17, 19, null][plate];
    if (plate === 1) sink(g, 3, 12, 1, 7, 16);
    if (P != null) {
      for (let x = 8; x <= 15; x++) g.px(x, P + dy, 'y');
      for (let x = 9; x <= 14; x++) g.px(x, P + 1 + dy, 'x');
      pts(g, [[10, P - 1, 'x'], [11, P - 1, 'x'], [12, P - 1, 'w'], [13, P - 1, 'x'], [8, P + 1, 'y'], [15, P + 1, 'y']], 0, dy);
    } else {
      pts(g, [[8, 19, 'y'], [9, 19, 'x'], [14, 19, 'x'], [15, 19, 'y']], 0, dy);
    }
  }
  // ================================================================ ARCHCHANDLER ORMUND — half-melted into wax
  const ROBE = ['F', 'F', 'G', 'G', 'H', 'I'];
  const WAX = ['e', 'f', 'f', 'g', 'g', '9'];
  const FLESH = ['h', 'i', 'i', 'j', 'j'];
  // A small candle: stick from (x, top) down h px; flame above, shaped by k.
  function candle(g, x, top, h, k) {
    for (let y = top; y < top + h; y++) g.px(x, y, y === top ? '9' : 'g');
    const F = [['q', 'p', 'o'], ['p', 'o', null], ['q', 'p', 'n'], ['p', 'n', null]][k % 4];
    g.px(x, top - 1, F[0]); g.px(x, top - 2, F[1]); if (F[2]) g.px(x, top - 3, F[2]);
  }
  function ormundFrame(g, k) {
    // the pooled base where he has run onto the floor
    g.ellipse(16, 37, 14, 2, 'f'); g.line(4, 36, 27, 36, 'g'); g.line(9, 35, 22, 35, 'g');
    // the bloated robed body sagging like a candle
    orb(g, 16, 33, 13, 5, ROBE, 0.08, 31);
    orb(g, 16, 28, 11, 9, ROBE, 0.08, 32);
    // gold trim of his stole, half drowned in wax
    for (let y = 22; y <= 35; y++) { g.px(12, y, y % 3 ? 'K' : 'L'); g.px(20, y, y % 3 ? 'J' : 'K'); }
    // arm and the crook
    limb(g, 8, 21, 6, 26, 1.6, 'G');
    for (let y = 10; y <= 37; y++) { g.px(3, y, 'L'); g.px(4, y, y % 4 ? 'K' : 'J'); }
    pts(g, [[3, 9, 'L'], [3, 8, 'L'], [4, 7, 'M'], [5, 6, 'M'], [6, 6, 'L'], [7, 7, 'L'], [8, 8, 'K'], [8, 9, 'K'], [7, 10, 'J']]);
    pts(g, [[4, 25, 'g'], [5, 25, 'g'], [6, 25, 'f'], [4, 26, 'f'], [5, 26, 'g'], [6, 26, 'e'], [5, 27, 'g'], [5, 28, 'f']]);
    // the wax mantle over his shoulders, running in long drips
    orb(g, 16, 21, 11, 5, WAX, 0.1, 33);
    const DR = [[7, 24, 4], [10, 25, 6], [14, 25, 3], [18, 25, 7], [22, 24, 5], [25, 23, 4]];
    DR.forEach(([x, y, len], n) => {
      const L = len + ((k + n) % 3);
      for (let j = 0; j < L; j++) { g.px(x, y + j, 'g'); g.px(x + 1, y + j, j < L - 1 ? 'f' : null); }
      g.px(x, y + L, '9'); g.px(x + 1, y + L - 1, 'g');
      if ((k + n) % 4 === 3) g.px(x, y + L + 2, '9');
    });
    // head: flesh sagging under a dome of wax
    orb(g, 16, 13, 6, 6, FLESH, 0.06, 34);
    orb(g, 16, 9, 6.5, 3.5, WAX, 0.08, 35);
    // wax runs down over his right eye; jowls sag into the mantle
    g.line(19, 9, 19, 14, 'g'); g.line(20, 10, 20, 13, 'f'); g.px(19, 15, '9'); g.line(21, 11, 21, 15, 'f');
    pts(g, [[12, 17, 'h'], [13, 18, 'h'], [20, 17, 'h'], [19, 18, 'h'], [16, 19, 'i']]);
    // the face: a heavy-lidded eye, the drooping one, a satisfied little smile
    pts(g, [[12, 12, 'h'], [13, 12, 'a'], [14, 12, 'h'], [13, 13, 'h'], [18, 14, 'a'], [17, 14, 'h'], [18, 15, 'h'],
      [16, 13, 'j'], [16, 14, 'h'], [14, 16, 'a'], [15, 16, 'a'], [16, 16, 'a'], [17, 16, 'a'], [13, 15, 'h'], [18, 15, 'h'],
      [15, 17, 'h'], [16, 17, 'h']]);
    // candles burning on his head and shoulders
    candle(g, 13, 5, 3, k); candle(g, 16, 3, 4, k + 1); candle(g, 19, 5, 3, k + 2);
    candle(g, 7, 17, 3, k + 3); candle(g, 9, 15, 3, k); candle(g, 23, 15, 3, k + 1); candle(g, 25, 17, 3, k + 2);
    candle(g, 11, 17, 2, k + 3);
    living(g);
  }
  art.sheet('npc_ormund', {
    w: 32, h: 40, ox: 16, oy: 38,
    anims: { idle: { fps: 4, count: 4, draw: ormundFrame } },
  });

  // ================================================================ THE MOTH-WIFE (Maelis)
  // Gaunt; hair a shifting mass of ash-grey moths; a veil of moth-wings; dark patched robes;
  // glowing jars on cords at her belt.
  function moth(g, x, y, open) {
    if (open) pts(g, [[x - 2, y, '8'], [x - 1, y, '7'], [x + 1, y, '7'], [x + 2, y, '6'], [x - 1, y + 1, '6'], [x + 1, y + 1, '5']]);
    else pts(g, [[x - 1, y, '7'], [x + 1, y, '6'], [x - 1, y - 1, '8'], [x + 1, y - 1, '7']]);
    g.px(x, y, '2'); g.px(x, y + 1, '3');
  }
  function mothwifeFrame(g, k) {
    // robes: narrow at the shoulder, falling long and ragged
    g.poly([[9, 14], [14, 14], [16, 17], [17, 24], [19, 33], [4, 33], [6, 24], [7, 17]], '2');
    for (let y = 18; y <= 33; y++) { g.px(11, y, y % 5 ? '3' : '2'); g.px(15, y, '1'); if (y > 22) g.px(8, y, '3'); }
    g.rect(6, 25, 2, 3, 'c'); g.rect(14, 19, 2, 3, 'B'); g.rect(9, 29, 3, 2, 'h'); g.rect(16, 28, 2, 2, '4');
    pts(g, [[6, 24, '5'], [7, 28, '5'], [14, 22, '5'], [12, 29, '5'], [5, 32, '3'], [7, 33, null], [10, 33, '3'], [13, 33, null], [17, 33, '3']]);
    // thin arms, gaunt hands
    g.line(7, 16, 5, 24, '3'); g.line(16, 16, 18, 23, '2');
    pts(g, [[5, 25, '7'], [4, 26, '7'], [5, 26, '6'], [4, 27, '6'], [18, 24, '6'], [19, 25, '6'], [18, 25, '7']]);
    // belt and three jars on cords, each holding a flame
    g.line(7, 20, 16, 20, 'b');
    const glowA = k % 2 ? 'x' : 'y', glowB = k % 2 ? 'p' : 'o', glowC = k % 2 ? 'w' : 'x';
    g.line(8, 21, 8, 22, 'b'); g.line(12, 21, 12, 23, 'b'); g.line(15, 21, 15, 22, 'b');
    pts(g, [[8, 23, 'c'], [9, 23, 'c'], [8, 24, glowA], [9, 24, 'w'], [8, 25, 'w'], [9, 25, 'v'],
      [12, 24, 'c'], [13, 24, 'c'], [12, 25, glowB], [13, 25, 'o'], [12, 26, 'o'], [13, 26, 'n'],
      [15, 23, 'c'], [16, 23, 'c'], [15, 24, glowC], [16, 24, 'w'], [15, 25, 'v'], [16, 25, 'u']]);
    // the thin neck and the gaunt face
    g.rect(11, 13, 2, 2, '7'); g.px(12, 14, '6');
    g.rect(9, 8, 6, 6, '8'); g.rect(13, 8, 2, 6, '7');
    pts(g, [[9, 12, '6'], [14, 12, '5'], [10, 13, '7'], [13, 13, '6'], [9, 13, null], [14, 13, null], [11, 12, 'G'], [12, 12, 'F'], [11, 11, '7']]);
    // the moth-hair
    g.ellipse(12, 6, 8, 6, '2'); g.ellipse(13, 3, 6, 3, '2'); g.ellipse(11, 5, 5, 3, '3');
    g.rect(9, 8, 6, 3, '8');
    // moths packed into the shape of hair: a few stir each frame
    const SP = [[9, 1], [15, 0], [18, 3], [5, 5], [12, 3], [16, 6], [7, 8], [4, 10], [19, 10], [11, 6], [6, 2]];
    SP.forEach(([x, y], n) => moth(g, x, y + (((n + k) % 5) === 0 ? -1 : 0), ((n * 3 + k) % 4) !== 0));
    // veil of moth-wings over her eyes: pale wings, two dark eye-spots
    pts(g, [[9, 8, '9'], [10, 8, '8'], [11, 8, '7'], [12, 8, '7'], [13, 8, '8'], [14, 8, '9'],
      [8, 9, '8'], [9, 9, '9'], [10, 9, '2'], [11, 9, '8'], [12, 9, '8'], [13, 9, '2'], [14, 9, '9'], [15, 9, '8'],
      [9, 10, '7'], [10, 10, '8'], [11, 10, '6'], [12, 10, '6'], [13, 10, '8'], [14, 10, '7'], [10, 11, '6'], [13, 11, '6']]);
    // moths loose in the air around her
    const drift = [[[2, 5], [21, 3]], [[3, 3], [20, 6]], [[4, 1], [21, 8]], [[2, 2], [19, 4]]][k];
    for (const [x, y] of drift) moth(g, x, y, (x + k) % 2 === 0);
    living(g);
    // the jars glow through
    g.px(8, 24, glowA); g.px(12, 25, glowB); g.px(15, 24, glowC);
  }
  art.sheet('npc_mothwife', {
    w: 24, h: 36, ox: 12, oy: 34,
    anims: { idle: { fps: 5, count: 4, draw: mothwifeFrame } },
  });

  // ================================================================ HARTLING — small ash-white fawn spirit
  // Side view, faces right. A candle-flame floats between its little antlers.
  function hartFrame(g, k, walk) {
    const bob = walk ? (k % 2 ? -1 : 0) : 0;
    // legs: far pair darker, near pair pale
    const LEGS = walk
      ? [[[6, 21], [10, 21], [11, 21], [15, 21]], [[8, 21], [9, 21], [13, 21], [14, 21]], [[10, 21], [6, 21], [15, 21], [11, 21]], [[9, 21], [8, 21], [14, 21], [13, 21]]][k]
      : [[7, 21], [9, 21], [13, 21], [15, 21]];
    const hips = [[8, 15 + bob], [9, 15 + bob], [13, 15 + bob], [14, 15 + bob]];
    [0, 2].forEach((n) => g.line(hips[n][0], hips[n][1], LEGS[n][0], LEGS[n][1], '7'));
    [1, 3].forEach((n) => g.line(hips[n][0], hips[n][1], LEGS[n][0], LEGS[n][1], 'S'));
    LEGS.forEach(([x, y]) => g.px(x, y, '5'));
    // body, neck, head
    orb(g, 11, 13 + bob, 4, 2, ['7', 'S', '8', 'T', '9'], 0, 51, 0.2);
    g.line(14, 11 + bob, 16, 9 + bob, 'T'); g.line(14, 12 + bob, 16, 10 + bob, '8');
    orb(g, 17, 8 + bob, 2, 1.5, ['S', '8', 'T', '9'], 0, 52, 0.3);
    pts(g, [[19, 8 + bob, 'T'], [19, 9 + bob, '8'], [20, 9 + bob, '4'], [17, 8 + bob, '1'], [18, 7 + bob, 'T']]);
    // fawn spots, tail tuft
    pts(g, [[9, 12 + bob, '9'], [11, 12 + bob, '9'], [8, 13 + bob, '9'], [6, 11 + bob, '9'], [6, 12 + bob, 'T']]);
    // big soft ears (one flicks) and tiny antlers
    if (!walk && k === 2) pts(g, [[14, 7 + bob, '8'], [13, 7 + bob, 'S'], [12, 8 + bob, '7']]);
    else pts(g, [[15, 6 + bob, '8'], [14, 5 + bob, 'S'], [14, 6 + bob, '7']]);
    pts(g, [[16, 6 + bob, 'T'], [16, 5 + bob, '9'], [18, 6 + bob, 'T'], [19, 5 + bob, '9'], [15, 4 + bob, 'T']]);
    g.outline('v');
    // a pale glow clings to it
    for (const [x, y] of [[4, 14], [21, 8], [11, 9], [6, 17], [16, 18]]) if (g.get(x, y + bob) == null) g.px(x, y + bob, (x + k) % 3 ? 'w' : 'x');
    // the floating candle-flame between the antlers
    const f = [['q', 'p', 'o'], ['p', 'o', 'n'], ['q', 'p', 'p'], ['p', 'o', null]][k];
    const fy = 2 + bob + (k === 1 ? 1 : 0);
    g.px(17, fy, f[0]); g.px(17, fy - 1, f[1]); if (f[2]) g.px(17, fy - 2, f[2]);
    g.px(16, fy, 'o'); g.px(18, fy, k % 2 ? 'n' : 'o');
  }
  art.sheet('npc_hartling', {
    w: 24, h: 24, ox: 12, oy: 22,
    anims: {
      idle: { fps: 3, count: 4, draw: (g, i) => hartFrame(g, i, false) },
      walk: { fps: 8, count: 4, draw: (g, i) => hartFrame(g, i, true) },
    },
  });

  art.sheet('npc_queen', {
    w: 24, h: 36, ox: 12, oy: 34,
    anims: {
      idle: { fps: 2, count: 4, draw: (g, i) => ghostFig(g, QUEEN, (gg, dy) => queenOver(gg, dy, i), 25, 34, i) },
      serve: { fps: 2.5, count: 4, draw: (g, i) => ghostFig(g, QUEEN, (gg, dy) => queenOver(gg, dy, i, i), 25, 34, i, 0) },
    },
  });
})(window.AV);
