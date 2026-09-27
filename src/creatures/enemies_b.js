// ASHEN VOW — creatures of Lenten Mere, Greyharrow and Hallowhearth (art + behaviour)
// kinds: toller, novice, shieldbound, pikeman, unlit, chandler, greyfolk  (BIBLE §13)
(function (AV) {
  'use strict';
  const U = AV.util;
  const art = AV.art;

  // ================================================================ art toolkit
  const hash = (x, y, s) => U.hash2(x | 0, y | 0, s | 0) / 4294967296;
  // horizontal run of palette chars ('.' skips)
  function put(g, x, y, s) { for (let i = 0; i < s.length; i++) if (s[i] !== '.') g.px(x + i, y, s[i]); }
  // recolour inside a rectangle
  function recol(g, x0, y0, x1, y1, map) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const c = g.get(x, y);
      if (c != null && map[c] !== undefined) g.px(x, y, map[c]);
    }
  }
  // a shaded volume: dark base, mid body shifted toward the light (top-right), small highlight
  function ball(g, cx, cy, rx, ry, dark, mid, light) {
    g.ellipse(cx, cy, rx, ry, dark);
    if (mid) g.ellipse(cx + rx * 0.14, cy - ry * 0.14, rx * 0.78, ry * 0.78, mid);
    if (light) g.ellipse(cx + rx * 0.34, cy - ry * 0.4, Math.max(0.6, rx * 0.3), Math.max(0.6, ry * 0.26), light);
  }
  // thick line (w = 1..3)
  function bar(g, x0, y0, x1, y1, c, w) {
    g.line(x0, y0, x1, y1, c);
    if (w >= 2) g.line(x0 + 1, y0, x1 + 1, y1, c);
    if (w >= 3) g.line(x0, y0 + 1, x1, y1 + 1, c);
  }
  // copy of a grid
  function copy(g) { const n = art.grid(g.w, g.h); n.d = g.d.slice(); return n; }
  function paste(dst, src) { for (let i = 0; i < src.d.length; i++) dst.d[i] = src.d[i]; }
  // bounding box of filled pixels
  function bounds(g) {
    let x0 = g.w, y0 = g.h, x1 = -1, y1 = -1;
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (g.get(x, y) != null) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return { x0, y0, x1, y1 };
  }
  // squash the pixels above `base` toward it by factor k (1 = unchanged); keeps pixel order
  function squash(src, base, k, cx) {
    const out = art.grid(src.w, src.h);
    for (let y = src.h - 1; y >= 0; y--) for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c == null) continue;
      const ny = Math.round(base - (base - y) * k);
      const nx = cx == null ? x : Math.round(cx + (x - cx) * (1 + (1 - k) * 0.35));
      if (out.get(nx, ny) == null) out.px(nx, ny, c);
    }
    return out;
  }
  // Death dissolve: pixels come loose from the top down (noisy), a few drift as specks, the rest is a heap.
  //   k 0..1 progress. o = { seed, specks:[colours], heap:[dark, mid, light] | null, fall, drift, keepBelow }
  function dissolve(src, k, o) {
    const g = art.grid(src.w, src.h);
    const b = bounds(src);
    if (b.x1 < 0) return g;
    const span = Math.max(1, b.y1 - b.y0);
    const seed = o.seed || 7;
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      const c = src.get(x, y);
      if (c == null) continue;
      const top = 1 - (y - b.y0) / span;                         // 1 at the top, 0 at the feet
      const th = top * 0.62 + hash(x, y, seed) * 0.38;           // when this pixel lets go
      const kk = k * 1.25;
      if (o.keepBelow != null && y >= o.keepBelow) { g.px(x, y, c); continue; }
      if (th > 1 - kk) {
        // loose: a few become specks drifting down/aside
        if (hash(x, y, seed + 1) < (o.speckRate || 0.22)) {
          const t = (th - (1 - kk));
          const fx = x + Math.round((hash(x, y, seed + 2) - 0.5) * 6 * t * (o.drift || 1));
          const fy = y + Math.round(t * (o.fall != null ? o.fall : 10) * (0.5 + hash(x, y, seed + 3)));
          if (fy < src.h && t < 0.8) g.px(fx, Math.min(src.h - 1, fy), o.specks[(x + y) % o.specks.length]);
        }
        continue;
      }
      if (th > 1 - kk - 0.14 && o.edge) { g.px(x, y, o.edge[(x * 3 + y) % o.edge.length]); continue; }
      g.px(x, y, c);
    }
    return g;
  }
  // heap / puddle at the feet
  function heap(g, cx, cy, rx, ry, cols) {
    if (rx < 1) return;
    g.ellipse(cx, cy, rx, ry, cols[0]);
    if (cols[1]) g.ellipse(cx + 0.3, cy - Math.min(1, ry * 0.4), Math.max(0.5, rx - 1.5), Math.max(0.4, ry - 1), cols[1]);
    if (cols[2]) g.ellipse(cx + rx * 0.25, cy - ry * 0.5, Math.max(0.5, rx * 0.35), Math.max(0.3, ry * 0.3), cols[2]);
  }
  // water ripple ring (flat ellipse outline) — ry ~ rx * 0.4
  function ripple(g, cx, cy, rx, c, gapSeed) {
    const ry = Math.max(1, Math.round(rx * 0.4));
    for (let a = 0; a < 64; a++) {
      const t = (a / 64) * Math.PI * 2;
      const x = Math.round(cx + Math.cos(t) * rx), y = Math.round(cy + Math.sin(t) * ry);
      if (gapSeed != null && hash(a >> 3, 0, gapSeed) < 0.25) continue;
      g.px(x, y, c);
    }
  }
  // make a sheet from a frame builder: anims = { name: { fps, loop, frames: [fn(g) | poseObj] } }
  function sheet(id, w, h, ox, oy, anims) {
    const def = { w, h, ox, oy, anims: {} };
    for (const name in anims) {
      const a = anims[name];
      def.anims[name] = { fps: a.fps, loop: a.loop !== false, count: a.frames.length, draw: (g, i) => a.frames[i](g) };
    }
    art.sheet(id, def);
  }

  // ================================================================ behaviour toolkit
  const AL = AV.fx;
  const angDiff = (a, b) => Math.abs(U.angleDiff(a, b));
  // set an anim; restart it when it changes
  function anim(e, name) { if (e.anim !== name) { e.anim = name; e.animT = 0; } }
  const P = () => AV.game.player;
  function kill(ent) { if (ent && !ent.gone) ent.gone = true; }

  // ================================================================================================
  // DROWNED TOLLER — bloated drowned monk, a bronze bell in his opened chest (28×34)
  // ================================================================================================
  const TOLLER_BELL = [
    ['J', 'K', 'L', 'M'],          // dull bronze
    ['K', 'L', 'M', 'p'],          // warming
    ['L', 'o', 'p', 'q'],          // glowing
    ['o', 'p', 'q', 'q'],          // white-hot ring
  ];
  function tollerDraw(g, p) {
    const b = p.by || 0, lx = p.lean || 0, gl = p.glow || 0;
    const X = (x) => x + lx;
    // feet
    g.ellipse(9, 32, 2, 1, '2'); g.ellipse(18, 32, 2, 1, '2');
    // skirt of the sodden habit
    g.poly([[X(6), 21 + b], [X(22), 21 + b], [25, 31], [3, 31]], '3');
    g.poly([[X(9), 22 + b], [X(20), 22 + b], [22, 31], [7, 31]], '4');
    g.line(X(12), 24 + b, 11, 31, '3'); g.line(X(17), 24 + b, 18, 31, '3');
    for (let x = 4; x <= 24; x++) if (hash(x, 1, 3) < 0.45) g.px(x, 31, null);
    put(g, 19, 28, 'u'); put(g, 20, 29, 'u'); put(g, 8, 27, 'u');
    // pondweed caught in the hem
    put(g, 5, 30, 'B'); put(g, 6, 29, 'C'); put(g, 21, 30, 'BC'); put(g, 14, 30, 'B');
    // back arm (sleeve + hand)
    if (p.arms === 'up') { g.poly([[X(8), 13 + b], [X(11), 12 + b], [X(7), 3 + b], [X(4), 4 + b]], '2'); g.ellipse(X(5), 2 + b, 1.5, 1.5, 'N'); }
    else if (p.arms === 'spread') { g.poly([[X(8), 13 + b], [X(6), 12 + b], [X(1), 18 + b], [X(3), 21 + b]], '2'); g.ellipse(X(2), 21 + b, 1.5, 1.5, 'N'); }
    else if (p.arms === 'down') { g.poly([[X(9), 13 + b], [X(12), 13 + b], [X(20), 26], [X(16), 27]], '2'); }
    else { g.poly([[X(4), 14 + b], [X(8), 14 + b], [X(8), 23 + b], [X(3), 24 + b]], '2'); g.line(X(4), 16 + b, X(4), 22 + b, '3'); g.ellipse(X(5), 25 + b, 1.5, 1, 'N'); }
    // bloated body
    ball(g, X(14), 18 + b, 9, 8, '3', '4', '5');
    put(g, X(20), 12 + b, 'u'); put(g, X(21), 13 + b, 'u'); put(g, X(8), 21 + b, 'u');
    // cowl collar
    g.ellipse(X(14), 13 + b, 6, 2, '2'); put(g, X(10), 12 + b, '3333'); put(g, X(15), 12 + b, '444');
    // rope belt
    g.line(X(6), 23 + b, X(22), 24 + b, 'c'); g.px(X(20), 25 + b, 'd'); g.px(X(20), 26 + b, 'c');
    // the torn chest: grey drowned flesh around a hollow
    g.ellipse(X(15), 17 + b, 5, 5, 'N');
    g.ellipse(X(16), 16 + b, 4, 4, 'O');
    g.ellipse(X(15), 18 + b, 3, 4, gl ? (gl > 1 ? 'm' : 'l') : '1');
    g.ellipse(X(15), 19 + b, 2, 2, gl ? (gl > 2 ? 'n' : 'k') : 'k');
    // ribs
    put(g, X(11), 15 + b, '8'); put(g, X(11), 17 + b, '7'); put(g, X(11), 19 + b, '7');
    put(g, X(19), 15 + b, '9'); put(g, X(19), 17 + b, '8'); put(g, X(19), 19 + b, '8');
    put(g, X(12), 14 + b, '7'); put(g, X(18), 14 + b, '8');
    // the bell
    const bc = TOLLER_BELL[gl];
    const bx = X(15), by = 15 + b + (p.bellDy || 0);
    put(g, bx - 1, by, bc[1] + bc[1] + bc[0]);
    put(g, bx - 1, by + 1, bc[1] + bc[2] + bc[1]);
    put(g, bx - 2, by + 2, bc[0] + bc[1] + bc[2] + bc[3] + bc[1]);
    put(g, bx - 2, by + 3, bc[0] + bc[1] + bc[2] + bc[2] + bc[1]);
    put(g, bx - 3, by + 4, bc[0] + bc[0] + bc[1] + bc[2] + bc[2] + bc[1] + bc[0]);
    put(g, bx - 3, by + 5, bc[0] + bc[1] + bc[1] + bc[1] + bc[2] + bc[3] + bc[1]);
    g.px(bx, by + 6, gl > 1 ? 'q' : '1');
    // hood & bloated face
    ball(g, X(14), 7 + b, 6, 5.5, '2', '3', '4');
    g.ellipse(X(17), 8 + b, 3, 3.5, '1');                         // shadow inside the cowl
    g.ellipse(X(17), 9 + b, 2.5, 2.8, 'N');
    g.ellipse(X(18), 8 + b, 1.5, 1.8, 'O');
    g.px(X(19), 7 + b, 'w'); g.px(X(19), 10 + b, 'O');
    put(g, X(15), 3 + b, '4444'); put(g, X(19), 4 + b, '44'); put(g, X(20), 5 + b, '3'); // hood rim over the brow
    put(g, X(16), 8 + b, '2'); put(g, X(19), 8 + b, '2');         // sunken sockets
    g.px(X(16), 8 + b, 'x'); g.px(X(19), 8 + b, 'w');             // milky eyes
    if (p.mouth) { put(g, X(17), 10 + b, '11'); put(g, X(17), 11 + b, '1'); } else put(g, X(17), 11 + b, '21');
    put(g, X(11), 2 + b, '33'); put(g, X(10), 3 + b, '3');       // hood peak
    // front arm (wide sleeve + hand)
    if (p.arms === 'up') {
      g.poly([[X(18), 13 + b], [X(22), 12 + b], [X(26), 4 + b], [X(22), 3 + b]], '4');
      g.line(X(22), 11 + b, X(25), 5 + b, '5');
      g.ellipse(X(24), 2 + b, 2, 1.5, 'O'); g.px(X(25), 1 + b, 'w');
    } else if (p.arms === 'spread') {
      g.poly([[X(19), 13 + b], [X(22), 12 + b], [X(27), 18 + b], [X(24), 21 + b]], '4');
      g.line(X(22), 13 + b, X(26), 18 + b, '5');
      g.ellipse(X(26), 21 + b, 1.5, 1.5, 'O'); g.px(X(27), 20 + b, 'w');
    } else if (p.arms === 'down') {
      g.poly([[X(18), 13 + b], [X(22), 13 + b], [X(26), 27], [X(22), 28]], '4');
      g.line(X(22), 14 + b, X(25), 26, '5');
      g.ellipse(X(24), 29, 2.5, 1.5, 'O'); g.px(X(25), 28, 'w'); g.px(X(22), 30, 'N');
    } else {
      g.poly([[X(19), 13 + b], [X(22), 13 + b], [X(25), 24 + b], [X(20), 24 + b]], '4');
      g.line(X(22), 14 + b, X(24), 23 + b, '5'); put(g, X(20), 24 + b, '3333');
      g.ellipse(X(22), 26 + b, 1.5, 1, 'O'); g.px(X(23), 25 + b, 'w'); g.px(X(21), 27 + b, 'N');
    }
    g.outline('0');
    // drips (no outline)
    const d = p.drip || 0;
    const drips = [[5, 28], [22, 28], [13, 33], [3, 31], [24, 31]];
    drips.forEach((q, i) => { if ((i + d) % 3 === 0) g.px(q[0], q[1] + (d % 2), 'w'); });
    if (p.arms !== 'up' && p.arms !== 'spread' && d % 2 === 0) g.px(X(22), 29 + b, 'x');
  }
  const tp = (o) => (g) => tollerDraw(g, o);
  function tollerDie(i) {
    return (g) => {
      const base = art.grid(28, 34);
      tollerDraw(base, { by: Math.min(2, i), arms: 'hang', mouth: 1, glow: i < 2 ? 1 : 0 });
      const k = i / 6;
      const sq = squash(base, 32, 1 - k * 0.45, 14);
      const d = dissolve(sq, Math.max(0, k * 1.05 - 0.08), { seed: 31, specks: ['w', 'v', 'x', 'u'], edge: ['u', 'v', 'w'], fall: 12 });
      heap(g, 14, 32, 3 + i * 1.6, 1 + Math.min(2, i * 0.4), ['t', 'u', 'v']);
      if (i >= 2) ripple(g, 14, 32, 5 + i * 1.5, i > 4 ? 'u' : 'v', i);
      paste2(g, d);
      if (i >= 3) {
        // the bell drops into the puddle and stays
        const bx = 15, by = 26;
        put(g, bx - 1, by, 'KKJ'); put(g, bx - 2, by + 1, 'JKLMK'); put(g, bx - 2, by + 2, 'JKLLK');
        put(g, bx - 3, by + 3, 'JJKLLKJ'); put(g, bx - 3, by + 4, '0JKKKJ0');
        if (i === 3) { g.px(bx - 4, by + 1, 'x'); g.px(bx + 4, by, 'x'); }
      }
    };
  }
  // overlay (non-null pixels of src onto g)
  function paste2(g, src) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const c = src.get(x, y); if (c != null) g.px(x, y, c); } }

  sheet('enemy_toller', 28, 34, 14, 32, {
    idle: { fps: 3, frames: [tp({ by: 0, drip: 0 }), tp({ by: 1, drip: 1 }), tp({ by: 1, drip: 2 })] },
    walk: { fps: 5, frames: [tp({ by: 0, lean: 1, drip: 0 }), tp({ by: 1, lean: 1, drip: 1 }), tp({ by: 0, lean: 0, drip: 2 }), tp({ by: 1, lean: 0, drip: 3 })] },
    windup: { fps: 5, loop: false, frames: [tp({ by: 1, arms: 'spread', glow: 1, drip: 0 }), tp({ by: 0, arms: 'spread', glow: 2, drip: 1, mouth: 1 }), tp({ by: -1, arms: 'spread', glow: 2, drip: 2, mouth: 1, lean: -1 }), tp({ by: -1, arms: 'spread', glow: 3, drip: 3, mouth: 1, lean: -1 })] },
    attack: { fps: 10, loop: false, frames: [tp({ by: 1, arms: 'spread', glow: 3, mouth: 1, bellDy: -1 }), tp({ by: 0, arms: 'spread', glow: 3, mouth: 1, lean: 1 }), tp({ by: 1, arms: 'spread', glow: 2, mouth: 1 }), tp({ by: 1, arms: 'hang', glow: 1 })] },
    slam_windup: { fps: 6, loop: false, frames: [tp({ by: 0, arms: 'up', lean: -1, glow: 0 }), tp({ by: -1, arms: 'up', lean: -2, glow: 1, mouth: 1 })] },
    slam: { fps: 10, loop: false, frames: [tp({ by: 1, arms: 'down', lean: 2, mouth: 1, glow: 1 }), tp({ by: 2, arms: 'down', lean: 2, mouth: 1 }), tp({ by: 1, arms: 'down', lean: 1 })] },
    hurt: { fps: 10, loop: false, frames: [tp({ by: 1, lean: -2, mouth: 1, drip: 1 }), tp({ by: 1, lean: -1, drip: 2 })] },
    die: { fps: 8, loop: false, frames: [0, 1, 2, 3, 4, 5, 6].map(tollerDie) },
  });

  // ================================================================================================
  // DROWNED NOVICE — a child of the abbey, grey-handed, hiding under the shallows (20×28)
  // ================================================================================================
  const NOV_WL = 25;   // water line
  function noviceFigure(g, p) {
    const b = p.by || 0, lx = p.lean || 0, hs = p.hair || 0;
    const X = (x) => x + lx;
    // legs (knee-deep, mostly hidden by the water ring)
    g.rect(8, 22, 2, 4, '5'); g.rect(11, 22, 2, 4, '6');
    // habit
    g.poly([[X(7), 11 + b], [X(14), 11 + b], [16, 24], [5, 24]], '6');
    g.poly([[X(9), 12 + b], [X(14), 12 + b], [15, 23], [9, 23]], '7');
    g.line(X(13), 13 + b, 14, 22, '8');
    g.line(X(9), 15 + b, 8, 23, '5');
    put(g, 5, 24, 'v6v6v6v6v6v'); put(g, 7, 23, 'w'); put(g, 13, 23, 'w');
    // rope girdle
    put(g, X(7), 17 + b, 'dddddddd');
    // back arm
    if (p.arms === 'reach') { g.line(X(8), 13 + b, X(3), 9 + b, '5'); g.line(X(8), 14 + b, X(3), 10 + b, '5'); put(g, X(1), 8 + b, 'NN'); g.px(X(2), 7 + b, 'N'); }
    else if (p.arms === 'grab') { g.line(X(9), 13 + b, X(16), 13 + b, '5'); g.line(X(9), 14 + b, X(16), 14 + b, '5'); put(g, X(17), 13 + b, 'NN'); }
    else if (p.arms === 'up') { g.line(X(8), 13 + b, X(5), 6 + b, '5'); put(g, X(4), 4 + b, 'NN'); g.px(X(5), 5 + b, 'N'); }
    else { g.line(X(7), 13 + b, X(6), 19 + b, '5'); g.line(X(8), 13 + b, X(7), 19 + b, '5'); put(g, X(6), 20 + b, 'NN'); }
    // head: wet black hair plastered over a drowned face
    g.ellipse(X(11), 7 + b, 3.5, 4, '1');
    g.ellipse(X(12), 8 + b, 2.2, 2.6, 'w');
    g.ellipse(X(13), 7 + b, 1.2, 1.4, 'x');
    g.px(X(13), 7 + b, 'y'); g.px(X(11), 7 + b, '1');          // one eye through the hair, glinting
    put(g, X(12), 10 + b, '1');                                   // mouth
    put(g, X(9), 4 + b, '2s2'); g.px(X(12), 3 + b, 's'); g.px(X(10), 9 + b, 's');
    g.line(X(10), 5 + b, X(11), 10 + b, '1');                      // strands across the face
    g.line(X(8) - hs, 8 + b, X(8) - hs, 13 + b, '1'); g.line(X(9) - hs, 9 + b, X(9) - hs, 12 + b, '2');
    // front arm
    if (p.arms === 'reach') { g.line(X(13), 13 + b, X(17), 8 + b, '7'); g.line(X(13), 14 + b, X(17), 9 + b, '7'); put(g, X(18), 6 + b, 'O'); put(g, X(17), 6 + b, 'N'); put(g, X(19), 7 + b, 'O'); }
    else if (p.arms === 'grab') { g.line(X(13), 14 + b, X(18), 15 + b, '7'); g.line(X(13), 15 + b, X(18), 16 + b, '7'); put(g, X(19), 14 + b, 'O'); put(g, X(19), 16 + b, 'O'); g.px(X(18), 15 + b, 'N'); }
    else if (p.arms === 'up') { g.line(X(14), 13 + b, X(16), 6 + b, '7'); put(g, X(16), 4 + b, 'OO'); g.px(X(17), 5 + b, 'O'); }
    else { g.line(X(14), 13 + b, X(15), 19 + b, '7'); g.line(X(13), 13 + b, X(14), 19 + b, '7'); put(g, X(14), 20 + b, 'ON'); }
    g.outline('0');
  }
  function noviceDraw(g, p) {
    const rise = p.rise == null ? 1 : p.rise;
    const fig = art.grid(20, 28);
    noviceFigure(fig, p);
    const dy = Math.round((1 - rise) * 24);
    for (let y = 0; y < 28; y++) for (let x = 0; x < 20; x++) {
      const c = fig.get(x, y - dy);
      if (c == null) continue;
      if (y + (rise < 1 ? 0 : -1) >= NOV_WL) continue;
      g.px(x, y, c);
    }
    // water ring at the waterline
    const f = p.ring || 0;
    ripple(g, 10, NOV_WL, 5 + (f % 2), 'w', f + 3);
    if (f % 3 === 1) ripple(g, 10, NOV_WL, 8, 'v', f + 9);
    if (p.splash) {
      const s = p.splash, R = U.rng(40 + s * 7);
      for (let i = 0; i < 16 + s * 4; i++) {
        const x = Math.round(10 + (R() - 0.5) * (6 + s * 4)), y = Math.round(NOV_WL - R() * (6 + s * 5));
        g.px(x, y, R() < 0.5 ? 'x' : (R() < 0.5 ? 'y' : 'w'));
      }
    }
  }
  function noviceUnder(f) {
    return (g) => {
      // only ripples, and something dark beneath them
      g.ellipse(10, NOV_WL, 3, 1, 's'); g.px(8, NOV_WL, 't'); g.px(12, NOV_WL - 1, 't');
      ripple(g, 10, NOV_WL, 3 + f, 'w', f + 21);
      ripple(g, 10, NOV_WL, 6 + f, f === 2 ? 'u' : 'v', f + 31);
      if (f === 1) g.px(13, NOV_WL - 2, 'x');
      if (f === 2) { g.px(7, NOV_WL - 1, 'x'); g.px(7, NOV_WL - 3, 'w'); }
      if (f === 0) g.px(11, NOV_WL - 1, 'y');
    };
  }
  const np = (o) => (g) => noviceDraw(g, o);
  function noviceDie(i) {
    return (g) => {
      const base = art.grid(20, 28);
      noviceFigure(base, { by: Math.min(3, i), lean: i > 1 ? -1 : 0, arms: i > 1 ? 'up' : 'hang' });
      const k = i / 5;
      const cut = art.grid(20, 28);
      const sink = Math.round(k * 16);
      for (let y = 0; y < 28; y++) for (let x = 0; x < 20; x++) { const c = base.get(x, y - sink); if (c != null && y < NOV_WL) cut.px(x, y, c); }
      const d = dissolve(cut, k * 0.9, { seed: 55, specks: ['w', 'x', 'v'], edge: ['v', 'w'], fall: 6 });
      paste2(g, d);
      ripple(g, 10, NOV_WL, 5 + i * 1.2, i > 3 ? 'u' : 'w', i + 60);
      if (i >= 2) ripple(g, 10, NOV_WL, 3 + i * 0.5, 'v', i + 70);
      if (i === 1 || i === 2) for (let s = 0; s < 8; s++) g.px(6 + ((s * 5) % 9), NOV_WL - 2 - ((s * 3) % 6), s % 2 ? 'x' : 'y');
    };
  }
  sheet('enemy_novice', 20, 28, 10, 26, {
    idle: { fps: 3, frames: [np({ ring: 0 }), np({ by: 1, ring: 1, hair: 1 }), np({ ring: 2 })] },
    walk: { fps: 6, frames: [np({ lean: 1, ring: 0 }), np({ by: 1, lean: 1, ring: 1, hair: 1 }), np({ ring: 2 }), np({ by: 1, ring: 3, hair: 1 })] },
    submerged: { fps: 4, frames: [noviceUnder(0), noviceUnder(1), noviceUnder(2)] },
    emerge: { fps: 11, loop: false, frames: [np({ rise: 0.2, splash: 3, arms: 'up' }), np({ rise: 0.5, splash: 3, arms: 'up' }), np({ rise: 0.8, splash: 2, arms: 'up', hair: 1 }), np({ rise: 1, splash: 1, arms: 'reach', hair: 1 })] },
    windup: { fps: 8, loop: false, frames: [np({ by: 2, lean: -1, arms: 'reach', hair: 1, ring: 1 }), np({ by: 2, lean: -2, arms: 'reach', hair: 2, ring: 2 })] },
    attack: { fps: 10, loop: false, frames: [np({ by: 1, lean: 3, arms: 'grab', hair: 2, ring: 0, splash: 1 }), np({ by: 1, lean: 2, arms: 'grab', hair: 1, ring: 1 })] },
    sink: { fps: 10, loop: false, frames: [np({ rise: 0.85, arms: 'up', ring: 1 }), np({ rise: 0.55, arms: 'up', splash: 1, ring: 2 }), np({ rise: 0.25, splash: 2, ring: 0 }), noviceUnder(0)] },
    hurt: { fps: 10, loop: false, frames: [np({ by: 1, lean: -2, hair: 2, splash: 1 }), np({ by: 1, lean: -1, hair: 1 })] },
    die: { fps: 8, loop: false, frames: [0, 1, 2, 3, 4, 5].map(noviceDie) },
  });

  // ================================================================================================
  // SHIELDBOUND — a Greyharrow soldier fused to his tower shield (26×32)
  // ================================================================================================
  function shieldPlank(g, x, y, w, h) {
    // tower shield seen three-quarter: planks, iron rim, boss, a faded chevron
    g.rect(x, y + 1, w, h - 1, 'c');
    put(g, x + 1, y, 'c'.repeat(w - 2));
    for (let j = y + 1; j < y + h; j++) { g.px(x + 2, j, 'b'); g.px(x + 4, j, 'd'); if (w > 6) g.px(x + 5, j, 'b'); }
    g.line(x + w - 1, y + 1, x + w - 1, y + h - 1, 'd');
    g.line(x, y + 1, x, y + h - 1, '4'); g.line(x + w - 1, y + 2, x + w - 1, y + h - 2, '6');
    put(g, x + 1, y, '5'.repeat(w - 2)); put(g, x, y + h - 1, '4'.repeat(w));
    put(g, x, y + Math.round(h * 0.45), '5'.repeat(w));
    // faded chevron of the Harrow line
    const cy = y + Math.round(h * 0.2);
    for (let i = 0; i < Math.ceil(w / 2); i++) { g.px(x + i, cy + i, 'H'); g.px(x + w - 1 - i, cy + i, 'H'); g.px(x + i, cy + i + 1, 'G'); g.px(x + w - 1 - i, cy + i + 1, 'G'); }
    // boss & rivets
    const by = y + Math.round(h * 0.6);
    g.ellipse(x + w / 2, by, 1.5, 1.5, '5'); g.px(Math.round(x + w / 2 + 1), by - 1, '7');
    g.px(x + 1, y + 2, '6'); g.px(x + w - 2, y + 2, '7'); g.px(x + 1, y + h - 3, '6'); g.px(x + w - 2, y + h - 3, '6');
    // scorch
    g.px(x + 1, y + h - 5, '2'); g.px(x + 2, y + h - 4, '2'); g.px(x + w - 3, y + 6, 'b');
  }
  function shieldTilted(g, x, y) {
    // the shield dragged low and wide — its weight pulling him open
    g.poly([[x, y], [x + 6, y - 3], [x + 9, y + 13], [x + 3, y + 16]], 'c');
    g.line(x, y, x + 6, y - 3, '5'); g.line(x + 6, y - 3, x + 9, y + 13, '6'); g.line(x, y, x + 3, y + 16, '4'); g.line(x + 3, y + 16, x + 9, y + 13, '4');
    g.line(x + 2, y, x + 5, y + 14, 'b'); g.line(x + 4, y - 1, x + 7, y + 13, 'd');
    g.line(x + 1, y + 3, x + 7, y, 'H'); g.line(x + 1, y + 4, x + 7, y + 1, 'G');
    g.ellipse(x + 5, y + 8, 1.2, 1.2, '5'); g.px(x + 6, y + 7, '7');
  }
  function shieldboundDraw(g, p) {
    const b = p.by || 0, lx = p.lean || 0, st = p.step || 0;
    const X = (x) => x + lx;
    // legs
    const bk = st === 1 ? -1 : st === 3 ? 1 : 0, fr = -bk;
    const spread = p.brace ? 2 : 0;
    g.rect(7 + bk - spread, 23, 3, 6, '3'); g.rect(8 + bk - spread, 23, 1, 5, '4'); put(g, 6 + bk - spread, 29, '2222');
    g.rect(12 + fr + spread, 23, 3, 6, '4'); g.rect(13 + fr + spread, 23, 1, 5, '5'); put(g, 12 + fr + spread, 29, '2222');
    put(g, 12 + fr + spread, 25, 'd5d');
    // back arm
    if (!p.open) { g.line(X(6), 13 + b, X(5), 20 + b, '3'); g.line(X(7), 13 + b, X(6), 20 + b, '4'); put(g, X(5), 21 + b, '44'); }
    else { g.line(X(6), 13 + b, X(2), 17 + b, '3'); g.line(X(7), 14 + b, X(3), 18 + b, '4'); put(g, X(1), 18 + b, '44'); }
    // torso: rusted plate over mail
    g.rect(X(6), 12 + b, 9, 12, '4');
    g.rect(X(7), 12 + b, 7, 3, '5'); put(g, X(8), 12 + b, '666');
    for (let j = 15; j < 23; j++) for (let i = 6; i < 15; i++) if ((i + j) % 2 === 0) g.px(X(i), j + b, '3');
    put(g, X(6), 21 + b, 'cdcdcdcdc'); put(g, X(6), 22 + b, '2bcbcbcb2');
    put(g, X(12), 15 + b, 'c'); put(g, X(8), 18 + b, 'd'); put(g, X(13), 19 + b, 'K');
    if (p.open) {
      // exposed: an ember crack across the breastplate
      g.line(X(8), 14 + b, X(12), 19 + b, 'm'); g.line(X(9), 14 + b, X(12), 18 + b, 'o'); g.px(X(10), 16 + b, 'p'); g.px(X(11), 17 + b, 'q');
    }
    // helm (sallet with a long tail), ember slit
    const hy = 7 + b + (p.bow || 0);
    g.ellipse(X(10), hy, 4, 3.5, '4');
    g.ellipse(X(11), hy - 1, 3, 2.5, '5');
    put(g, X(10), hy - 3, '66'); g.px(X(12), hy - 2, '7');
    put(g, X(5), hy + 2, '4444'); put(g, X(4), hy + 3, '33');       // tail over the neck
    put(g, X(7), hy + 1, '3333333'); put(g, X(8), hy + 2, '222222');
    const eye = p.eye || 'o';
    put(g, X(10), hy + 1, eye === 'x' ? '11' : '1' + eye); put(g, X(12), hy + 1, eye === 'x' ? '11' : eye + (eye === 'o' ? 'p' : '1'));
    put(g, X(14), hy + 1, '3');
    // fused flesh where arm meets shield
    // shield (in front)
    if (p.open) shieldTilted(g, X(15), 16 + b);
    else {
      const sx = X(15) + (p.sx || 0), sy = 8 + b + (p.sy || 0);
      shieldPlank(g, sx, sy, 7, 22);
      g.px(sx - 1, sy + 9, 'N'); g.px(sx - 1, sy + 10, 'O'); g.px(sx - 2, sy + 10, 'N');
    }
    g.outline('0');
  }
  const sp = (o) => (g) => shieldboundDraw(g, o);
  function shieldboundDie(i) {
    return (g) => {
      const body = art.grid(26, 32);
      const k = i / 6;
      if (i < 2) { shieldboundDraw(body, { by: i * 2, lean: -i, eye: i ? 'l' : 'o', bow: i }); paste2(g, body); return; }
      // shield falls flat in front, the soldier kneels and comes apart
      const fig = art.grid(26, 32);
      shieldboundDraw(fig, { by: 3, lean: -1, open: true, eye: 'x', bow: 2 });
      // remove the tilted shield region, lay the shield down
      for (let y = 0; y < 32; y++) for (let x = 15; x < 26; x++) fig.px(x, y, null);
      fig.outline('0');
      const sq = squash(fig, 30, 1 - k * 0.5, 10);
      const d = dissolve(sq, Math.max(0, (k - 0.25) * 1.3), { seed: 77, specks: ['7', '6', '8', '5'], edge: ['6', '7'], fall: 8 });
      heap(g, 10, 30, 2 + i * 1.1, 1 + Math.min(2, i * 0.35), ['4', '6', '7']);
      paste2(g, d);
      const fl = art.grid(26, 32);
      fl.rect(12, 27, 13, 3, 'c'); put(fl, 12, 27, '5555555555555'); put(fl, 12, 29, '4444444444444');
      put(fl, 14, 28, 'bHHbdHHbd'); fl.px(19, 28, '6'); fl.outline('0');
      paste2(g, fl);
    };
  }
  sheet('enemy_shieldbound', 26, 32, 12, 30, {
    idle: { fps: 2, frames: [sp({}), sp({ by: 1 })] },
    walk: { fps: 5, frames: [sp({ step: 0 }), sp({ step: 1, by: 1 }), sp({ step: 2 }), sp({ step: 3, by: 1 })] },
    windup: { fps: 6, loop: false, frames: [sp({ by: 1, lean: -1, sx: -1, brace: true }), sp({ by: 2, lean: -2, sx: -2, sy: 1, brace: true, eye: 'p' })] },
    attack: { fps: 10, loop: false, frames: [sp({ by: 1, lean: 2, sx: 3, brace: true, eye: 'p' }), sp({ by: 1, lean: 3, sx: 3, brace: true })] },
    open: { fps: 4, frames: [sp({ by: 1, open: true, bow: 1, eye: 'l' }), sp({ by: 2, open: true, bow: 1, eye: 'l', lean: -1 })] },
    hurt: { fps: 10, loop: false, frames: [sp({ by: 1, lean: -2, sx: -1 }), sp({ by: 1, lean: -1 })] },
    die: { fps: 7, loop: false, frames: [0, 1, 2, 3, 4, 5, 6].map(shieldboundDie) },
  });

  // ================================================================================================
  // PIKE-HUSK — a Greyharrow pikeman grown into his pike (44×32). Pike endpoints s0→s1 are frame px.
  // ================================================================================================
  function pikeDraw(g, p) {
    const b = p.by || 0, lx = p.lean || 0, st = p.step || 0;
    const X = (x) => x + lx;
    const s0 = p.s0 || [0, 0], s1 = p.s1 || [0, 0];
    const at = (t) => [Math.round(s0[0] + (s1[0] - s0[0]) * t), Math.round(s0[1] + (s1[1] - s0[1]) * t)];
    // legs: wrapped puttees, boots
    const bk = st === 1 ? -2 : st === 3 ? 2 : 0;
    const cr = p.crouch ? 1 : 0;
    g.rect(9 + bk, 23 + cr, 3, 6 - cr, '3'); g.px(10 + bk, 25, '2'); put(g, 8 + bk, 29, '2221');
    g.rect(14 - bk, 23 + cr, 3, 6 - cr, '4'); g.px(15 - bk, 24 + cr, '5'); g.px(14 - bk, 26, '3'); put(g, 14 - bk, 29, '2222');
    // hands: on the shaft, or hanging empty
    const hb = p.nopike ? [X(8), 21 + b] : at(p.hb != null ? p.hb : 0.22);
    const hf = p.nopike ? [X(17), 21 + b] : at(p.hf != null ? p.hf : 0.46);
    // back arm
    bar(g, X(10), 15 + b, hb[0], hb[1], '3', 2);
    g.rect(hb[0] - 1, hb[1] - 1, 2, 2, 'N');
    // quilted gambeson with a strip of Harrow wine down the front
    g.rect(X(9), 13 + b, 8, 11, 'c');
    for (let j = 15; j < 23; j += 3) put(g, X(9), j + b, 'bbbbbbbb');
    g.rect(X(9), 13 + b, 2, 11, 'b');
    g.rect(X(13), 13 + b, 3, 10, 'G'); g.line(X(14), 14 + b, X(14), 21 + b, 'H');
    put(g, X(9), 22 + b, 'aaaaaaaa'); g.px(X(14), 22 + b, 'K');
    put(g, X(12), 13 + b, 'dd'); g.px(X(16), 15 + b, 'd'); g.px(X(10), 18 + b, '2'); g.px(X(15), 19 + b, '1');
    // gaunt husk face under a kettle hat
    g.rect(X(12), 11 + b, 3, 2, 'N');
    g.ellipse(X(14), 9 + b, 2.5, 2.5, 'N');
    g.px(X(15), 8 + b, 'O'); g.px(X(16), 10 + b, 'O');
    g.px(X(14), 9 + b, '2'); g.px(X(15), 9 + b, p.eye || 'o');
    put(g, X(14), 11 + b, '1N1');
    put(g, X(8), 7 + b, '55555555555'); put(g, X(9), 8 + b, '333');
    g.ellipse(X(13), 5 + b, 3.5, 2.5, '5'); put(g, X(13), 4 + b, '66'); g.px(X(15), 4 + b, '7'); put(g, X(10), 6 + b, '44');
    g.px(X(18), 7 + b, '6');
    if (!p.nopike) {
      // the pike: ash shaft, leaf blade, a rag of pennon
      g.line(s0[0], s0[1], s1[0], s1[1], 'c'); g.line(s0[0], s0[1] - 1, s1[0], s1[1] - 1, 'd');
      const ang = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]), cx = Math.cos(ang), cy = Math.sin(ang);
      const Q = (k, o) => [Math.round(s1[0] + cx * k - cy * o), Math.round(s1[1] + cy * k + cx * o)];
      const ln = (a, c, col) => g.line(a[0], a[1], c[0], c[1], col);
      ln(Q(0, 0), Q(0, -1), 'J');
      ln(Q(1, 0), Q(6, 0), '7'); ln(Q(1, -1), Q(4, -1), '8'); ln(Q(1, 1), Q(4, 1), '6');
      const tip = Q(6, 0); g.px(tip[0], tip[1], '9');
      const pn = at(0.84), fl = p.flag || 0;
      g.rect(pn[0] - 1 + fl, pn[1] + 1, 3, 2, 'H'); g.px(pn[0] + fl, pn[1] + 3, 'I'); g.px(pn[0] + 2 + fl, pn[1] + 3, 'G');
      // grey flesh grown over the shaft either side of the front hand
      const tf = p.hf != null ? p.hf : 0.46;
      [tf - 0.08, tf + 0.07, tf + 0.12].forEach((t, i) => { const q = at(t); g.px(q[0], q[1] + (i === 2 ? 0 : 1), 'N'); });
    }
    // front arm over the shaft
    bar(g, X(15), 15 + b, hf[0], hf[1], 'c', 2);
    g.rect(hf[0] - 1, hf[1] - 1, 2, 2, 'N'); g.px(hf[0], hf[1] - 1, 'O');
    g.outline('0');
    if (p.glint && !p.nopike) {
      const ang = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]);
      const tx = Math.round(s1[0] + Math.cos(ang) * 6), ty = Math.round(s1[1] + Math.sin(ang) * 6);
      g.px(tx, ty, 'q'); g.px(tx, ty - 1, 'p'); g.px(tx + 1, ty, 'p');
    }
  }
  const pk = (o) => (g) => pikeDraw(g, o);
  function pikeDie(i) {
    return (g) => {
      if (i < 2) { pikeDraw(g, { by: i, lean: -i, s0: [2 - i, 24 + i], s1: [32 - i * 3, 14 + i * 6], eye: i ? 'l' : 'o' }); return; }
      const k = i / 6;
      // the pike lies where it fell
      const pike = art.grid(44, 32);
      pike.line(4, 28, 36, 28, 'c'); pike.line(4, 27, 36, 27, 'd');
      put(pike, 37, 27, 'J7778'); put(pike, 37, 28, 'J6669'); put(pike, 26, 29, 'HH'); pike.px(27, 30, 'I');
      pike.outline('0');
      const fig = art.grid(44, 32);
      pikeDraw(fig, { by: 3, lean: -2, crouch: 1, nopike: true, eye: '1' });
      const sq = squash(fig, 29, 1 - k * 0.5, 13);
      const d = dissolve(sq, Math.max(0, (k - 0.2) * 1.3), { seed: 91, specks: ['7', '6', 'c', '5'], edge: ['6', '7'], fall: 8 });
      paste2(g, pike);
      heap(g, 12, 29, 2 + i * 1.1, 1 + Math.min(2, i * 0.35), ['4', '6', '7']);
      paste2(g, d);
    };
  }
  sheet('enemy_pikeman', 44, 32, 13, 30, {
    idle: { fps: 2, frames: [pk({ s0: [2, 23], s1: [33, 13] }), pk({ by: 1, s0: [2, 24], s1: [33, 14], flag: 1 })] },
    walk: { fps: 6, frames: [0, 1, 2, 3].map((i) => pk({ step: i, by: i % 2, s0: [2, 23 + (i % 2)], s1: [33, 13 + (i % 2)], flag: i % 2 })) },
    windup: { fps: 4, loop: false, frames: [pk({ by: 1, lean: -1, crouch: 1, s0: [0, 23], s1: [30, 16] }), pk({ by: 1, lean: -2, crouch: 1, s0: [-1, 22], s1: [28, 17], glint: 1, eye: 'p' })] },
    attack: { fps: 10, loop: false, frames: [pk({ lean: 2, step: 3, s0: [8, 19], s1: [38, 18], hb: 0.18, hf: 0.4, eye: 'p' }), pk({ lean: 2, step: 3, s0: [7, 19], s1: [37, 18], hb: 0.18, hf: 0.4, flag: 1 })] },
    recover: { fps: 3, loop: false, frames: [pk({ by: 1, lean: 1, s0: [6, 15], s1: [34, 26] }), pk({ by: 1, s0: [5, 16], s1: [32, 25], flag: 1 })] },
    hurt: { fps: 10, loop: false, frames: [pk({ by: 1, lean: -2, s0: [1, 25], s1: [31, 10], eye: 'p' }), pk({ by: 1, lean: -1, s0: [2, 24], s1: [32, 12] })] },
    die: { fps: 7, loop: false, frames: [0, 1, 2, 3, 4, 5, 6].map(pikeDie) },
  });

  // ================================================================================================
  // THE UNLIT — a hollow burning ghost, fire where the heart was (22×28, floats)
  // ================================================================================================
  function unlitDraw(g, p) {
    const b = p.by || 0, lx = p.lean || 0, f = p.fl || 0, fl = p.flare || 0;
    const X = (x) => x + lx;
    const sw = [0, 1, 0, -1][f % 4];
    // no legs: a tail of smoke
    g.poly([[X(7), 17 + b], [X(15), 17 + b], [X(13) + sw, 22 + b], [11 + sw * 2, 26], [X(9) + sw, 22 + b]], '2');
    g.line(X(10), 19 + b, 11 + sw * 2, 25, '3'); g.px(X(12), 21 + b, 'l');
    // back arm
    const arms = p.arms || 'hang';
    if (arms === 'spread') { bar(g, X(7), 10 + b, X(2), 6 + b, '2', 2); }
    else if (arms === 'reach') { bar(g, X(8), 11 + b, X(15), 12 + b, '2', 2); }
    else { bar(g, X(7), 10 + b, X(5), 16 + b, '2', 2); }
    // the husk in its charred shroud
    ball(g, X(11), 13 + b, 5, 6, '1', '2', '3');
    for (let x = 6; x <= 16; x++) if (hash(x, f, 9) < 0.5) g.px(X(x), 18 + b + (x % 2), '2');
    // the hollow, burning
    g.ellipse(X(12), 13 + b, 2.5, 3.5, 'k');
    g.ellipse(X(12), 14 + b, 1.8, 2.5, fl ? 'n' : 'l');
    g.ellipse(X(12), 14 + b, 1, 1.5, fl > 1 ? 'q' : fl ? 'p' : 'n');
    put(g, X(10), 12 + b, '3'); put(g, X(10), 14 + b, '3'); put(g, X(14), 12 + b, '4'); put(g, X(14), 14 + b, '4');
    g.px(X(8), 11 + b, 'l'); g.px(X(8), 12 + b, 'm'); g.px(X(15), 16 + b, 'l'); g.px(X(9), 16 + b, 'm'); g.px(X(16), 12 + b, 'l');
    // hooded skull
    ball(g, X(12), 6 + b, 3.5, 3.5, '1', '2', '3');
    g.ellipse(X(14), 7 + b, 2, 2, '1');
    g.px(X(13), 6 + b, fl ? 'q' : 'p'); g.px(X(15), 6 + b, 'q');
    if (p.mouth) put(g, X(14), 8 + b, 'nm'); else g.px(X(14), 9 + b, 'l');
    // front arm, fingertips smouldering
    let tip;
    if (arms === 'spread') { bar(g, X(15), 10 + b, X(20), 6 + b, '3', 2); tip = [X(21), 5 + b]; }
    else if (arms === 'reach') { bar(g, X(15), 10 + b, X(20), 10 + b, '3', 2); tip = [X(21), 10 + b]; }
    else { bar(g, X(15), 10 + b, X(17), 16 + b, '3', 2); tip = [X(17), 17 + b]; }
    g.outline('0');
    g.px(tip[0], tip[1], fl ? 'p' : 'n');
    if (arms === 'spread') { g.px(X(2), 5 + b, 'n'); g.px(X(1), 6 + b, 'm'); }
    else if (arms === 'reach') g.px(X(16), 12 + b, 'n');
    else g.px(X(5), 17 + b, 'm');
    // flames licking up from skull and shoulders (not outlined: they glow)
    const tongues = [[X(11), 2 + b, 3], [X(13), 1 + b, 4], [X(10), 4 + b, 2], [X(15), 3 + b, 2], [X(7), 8 + b, 2], [X(16), 8 + b, 2]];
    tongues.forEach((t, i) => {
      const hgt = Math.max(1, t[2] + fl + Math.round((hash(i, f, 17) - 0.5) * 2));
      for (let k = 0; k < hgt; k++) {
        const c = k === hgt - 1 ? (fl > 1 ? 'q' : 'p') : k === 0 ? 'm' : (k < hgt / 2 ? 'n' : 'o');
        g.px(t[0] + (k > 1 && (i + f) % 2 ? 1 : 0), t[1] - k, c);
      }
    });
  }
  const up = (o) => (g) => unlitDraw(g, o);
  function unlitDie(i) {
    return (g) => {
      const base = art.grid(22, 28);
      unlitDraw(base, { fl: i % 4, by: Math.min(2, i), lean: i > 1 ? -1 : 0, flare: i < 2 ? 1 : 0, mouth: 1 });
      const k = i / 6;
      const d = dissolve(base, k * 1.1, { seed: 13, specks: ['n', 'l', '4', '5', 'o'], edge: ['l', 'k', 'm'], fall: 14, speckRate: 0.3 });
      paste2(g, d);
      if (i >= 3) heap(g, 11, 26, 1 + i * 0.6, 1, ['3', '4', '5']);
      if (i >= 3 && i < 6) { g.px(11, 25, 'n'); g.px(12, 26, 'l'); }
    };
  }
  sheet('enemy_unlit', 22, 28, 11, 26, {
    idle: { fps: 7, frames: [0, 1, 2, 3].map((i) => up({ fl: i, by: i < 2 ? 0 : 1 })) },
    walk: { fps: 8, frames: [0, 1, 2, 3].map((i) => up({ fl: i, by: i < 2 ? 0 : 1, lean: 1 })) },
    windup: { fps: 6, loop: false, frames: [up({ fl: 0, arms: 'spread', flare: 1, lean: -1 }), up({ fl: 1, arms: 'spread', flare: 1, lean: -1, mouth: 1 }), up({ fl: 2, arms: 'spread', flare: 2, lean: -1, mouth: 1 })] },
    attack: { fps: 10, loop: false, frames: [up({ fl: 3, arms: 'reach', flare: 2, lean: 1, mouth: 1 }), up({ fl: 0, arms: 'reach', flare: 1, lean: 1, mouth: 1 }), up({ fl: 1, arms: 'hang', flare: 1 })] },
    hurt: { fps: 10, loop: false, frames: [up({ fl: 2, lean: -2, by: 1 }), up({ fl: 3, lean: -1, by: 1 })] },
    die: { fps: 8, loop: false, frames: [0, 1, 2, 3, 4, 5, 6].map(unlitDie) },
  });

  // ================================================================================================
  // GREY CHANDLER — Ormund's priest, half-melted, candle-crowned, a ladle of molten wax (22×34)
  // ================================================================================================
  function ladle(g, hand, bowl, spill) {
    g.line(hand[0], hand[1], bowl[0], bowl[1], 'b');
    g.ellipse(bowl[0], bowl[1], 2, 1.5, '4'); g.px(bowl[0] + 1, bowl[1] - 1, '5');
    g.px(bowl[0], bowl[1] - 1, 'o'); g.px(bowl[0] - 1, bowl[1] - 1, 'n');
    if (spill) { g.px(bowl[0] + 2, bowl[1] - 3, 'o'); g.px(bowl[0] + 1, bowl[1] - 4, 'p'); }
  }
  function chandlerDraw(g, p) {
    const F = 4;                                     // headroom for the raised ladle
    const b = (p.by || 0) + F, lx = p.lean || 0, f = p.fl || 0, st = p.step || 0;
    const X = (x) => x + lx;
    const hand = p.hand ? [p.hand[0], p.hand[1] + F] : [X(16), 20 + b], bowl = p.bowl ? [p.bowl[0], p.bowl[1] + F] : [X(19), 27 + b];
    if (p.behind) ladle(g, hand, bowl, false);
    // cassock, pale and grey, sagging with old wax
    g.poly([[X(7), 13 + b], [X(15), 13 + b], [18, 31 + F], [4, 31 + F]], '6');
    g.poly([[X(7), 13 + b], [X(10), 13 + b], [8, 31 + F], [4, 31 + F]], '5');
    for (let x = 4; x <= 18; x++) g.px(x + (st && x % 3 === 0 ? (st === 1 ? -1 : 1) : 0), 31 + F, hash(x, st, 5) < 0.35 ? '3' : '4');
    put(g, 6 + (st === 1 ? 1 : 0), 32 + F, '22'); put(g, 13 - (st === 1 ? 1 : 0), 32 + F, '22');
    g.line(X(8), 15 + b, 7, 19 + F, 'g'); g.px(7, 20 + F, 'f');
    g.line(X(14), 15 + b, 15, 24 + F, '9'); g.px(15, 25 + F, 'g'); g.px(6, 27 + F, 'g');
    // stole of the order and the Open Hand, in old gold
    g.line(X(10), 13 + b, 10, 30 + F, 'K'); g.line(X(11), 13 + b, 11, 30 + F, 'L');
    put(g, X(13), 17 + b, 'M.M'); put(g, X(13), 18 + b, 'MMM'); g.px(X(14), 16 + b, 'p');
    put(g, X(7), 22 + b, 'dd'); put(g, X(12), 22 + b, 'ddd');
    // back sleeve
    g.poly([[X(7), 14 + b], [X(9), 14 + b], [X(8), 22 + b], [X(5), 22 + b]], '5');
    g.px(X(6), 23 + b, 'f');
    // cowl, and in it a face gone to wax
    ball(g, X(12), 9 + b, 4, 4, '4', '5', '6');
    g.ellipse(X(14), 10 + b, 2, 2.8, '2');
    g.ellipse(X(14), 10 + b, 1.4, 2.2, 'g');
    g.px(X(13), 11 + b, 'f'); g.px(X(14), 12 + b, 'e'); g.line(X(14), 13 + b, X(14), 15 + b, 'g'); g.px(X(15), 16 + b, 'f');
    g.px(X(15), 9 + b, p.eye || 'n'); g.px(X(13), 9 + b, 'f');
    // candle crown
    const cand = [[X(10), 3 + F], [X(12), 2 + F], [X(14), 4 + F]];
    cand.forEach((c) => { g.rect(c[0], c[1] + b - F, 1, 7 + F - c[1], '9'); g.px(c[0], 6 + b, 'g'); });
    // front sleeve, dripping hand, the ladle
    bar(g, X(14), 14 + b, hand[0], hand[1], '6', 2);
    g.rect(hand[0] - 1, hand[1] - 1, 2, 2, 'f'); g.px(hand[0], hand[1] + 1, 'g');
    if (!p.behind) ladle(g, hand, bowl, p.spill);
    g.outline('0');
    // candle flames and the molten glow (unoutlined)
    cand.forEach((c, i) => {
      const cy = c[1] + b - F;
      if (p.out) { g.px(c[0], cy - 1, '5'); return; }
      const h2 = (i + f) % 3 === 0 ? 2 : 1;
      g.px(c[0], cy - 1, 'o');
      if (h2 > 1) g.px(c[0] + ((f + i) % 2), cy - 2, 'p');
    });
    g.px(bowl[0], bowl[1] - 1, p.hot ? 'q' : 'p');
    if (p.hot) { g.px(bowl[0] - 1, bowl[1] - 2, 'o'); g.px(bowl[0] + 1, bowl[1] - 2, 'p'); }
    if (p.spill) { g.px(bowl[0] + 3, bowl[1] - 4, 'p'); g.px(bowl[0] + 2, bowl[1] - 6, 'o'); }
  }
  const cp = (o) => (g) => chandlerDraw(g, o);
  function chandlerDie(i) {
    return (g) => {
      const base = art.grid(22, 38);
      chandlerDraw(base, { by: Math.min(2, i), lean: i > 0 ? -1 : 0, fl: i % 3, eye: i > 1 ? 'l' : 'n', out: i > 3 });
      const k = i / 6;
      const sq = squash(base, 35, 1 - k * 0.72, 11);
      const d = dissolve(sq, Math.max(0, (k - 0.3) * 1.2), { seed: 41, specks: ['g', '9', 'f'], edge: ['g', 'f'], fall: 5, drift: 0.6 });
      heap(g, 11, 35, 2 + i * 1.5, 1 + Math.min(2, i * 0.4), ['e', 'f', 'g']);
      paste2(g, d);
      if (i >= 4) { g.px(9 + i - 4, 34, '9'); g.px(14, 35, '9'); g.px(14, 34, i < 6 ? 'o' : '5'); }
    };
  }
  sheet('enemy_chandler', 22, 38, 11, 36, {
    idle: { fps: 4, frames: [cp({ fl: 0 }), cp({ fl: 1 }), cp({ fl: 2, by: 1 })] },
    walk: { fps: 5, frames: [cp({ fl: 0, step: 1 }), cp({ fl: 1, by: 1 }), cp({ fl: 2, step: 2 }), cp({ fl: 0, by: 1 })] },
    windup: { fps: 4, loop: false, frames: [
      cp({ fl: 1, hand: [15, 8], bowl: [17, -2], hot: 1 }),
      cp({ fl: 2, lean: -1, by: 1, hand: [13, 8], bowl: [5, -1], behind: true, hot: 1 }),
    ] },
    attack: { fps: 10, loop: false, frames: [
      cp({ fl: 0, lean: 1, hand: [18, 10], bowl: [20, 3], spill: 1 }),
      cp({ fl: 1, lean: 1, hand: [18, 13], bowl: [20, 8], spill: 1 }),
      cp({ fl: 2, hand: [17, 18], bowl: [20, 22] }),
    ] },
    hurt: { fps: 10, loop: false, frames: [cp({ fl: 1, lean: -2, by: 1, eye: 'p' }), cp({ fl: 2, lean: -1 })] },
    die: { fps: 7, loop: false, frames: [0, 1, 2, 3, 4, 5, 6].map(chandlerDie) },
  });

  // ================================================================================================
  // THE GREY — the burned of the Wickward, still wearing their tin tags (16×26)
  // ================================================================================================
  function greyDraw(g, p) {
    const b = p.by || 0, lx = p.lean || 0, st = p.step || 0, bow = p.bow || 0;
    const X = (x) => x + lx;
    const eye = p.hostile ? 'n' : 'x';
    if (p.sit) {
      // sitting in the ash, arms around the knees, head down
      g.ellipse(6, 20 + b, 3.5, 3, '4'); put(g, 3, 22, '3434343');
      g.rect(9, 17 + b, 3, 6 - b, 'N'); g.px(10, 17 + b, 'O'); put(g, 9, 23, '22'); put(g, 11, 23, '2');
      g.ellipse(7, 15 + b, 3, 3.5, '4'); g.px(6, 14 + b, '5'); g.px(8, 16 + b, '2');
      g.line(8, 15 + b, 11, 19 + b, 'N'); g.px(11, 20 + b, '2');
      g.ellipse(9, 11 + b, 2.5, 2.5, 'N'); g.px(10, 10 + b, 'O'); g.px(8, 10 + b, '2'); g.px(9, 12 + b, '1');
      g.px(8, 14 + b, '7');
      g.outline('0');
      g.px(10, 12 + b, eye);
      return;
    }
    // legs, thin and burned
    const bk = st === 1 ? -1 : st === 3 ? 1 : 0;
    g.rect(6 + bk, 18, 2, 6, 'N'); g.px(6 + bk, 21, '2'); put(g, 5 + bk, 23, '22');
    g.rect(9 - bk, 18, 2, 6, 'O'); g.px(10 - bk, 20, '1'); put(g, 9 - bk, 23, '22');
    // back arm
    const arms = p.arms || 'hang';
    if (arms === 'reach') { g.line(X(7), 11 + b, X(10), 4 + b, 'N'); put(g, X(10), 3 + b, '22'); }
    else if (arms === 'swipe') { g.line(X(8), 12 + b, X(13), 16 + b, 'N'); put(g, X(13), 17 + b, '22'); }
    else { g.line(X(6), 11 + b, X(5), 17 + b, 'N'); g.px(X(5), 18 + b, '2'); }
    // rags, scorched through
    g.poly([[X(5), 10 + b], [X(10), 10 + b], [12, 19], [4, 19]], '4');
    g.line(X(6), 11 + b, 5, 18, '3'); g.px(X(9), 12 + b, '5'); g.px(X(8), 14 + b, '5');
    for (let x = 4; x <= 12; x++) g.px(x, 19 + (hash(x, 3, 7) < 0.4 ? 1 : 0), hash(x, 1, 7) < 0.5 ? '3' : '4');
    g.px(X(7), 15 + b, '1'); g.px(X(8), 16 + b, '2'); g.px(10, 17, '1'); g.px(X(6), 13 + b, '2');
    g.px(X(10), 11 + b, 'N');
    // head, bowed forward
    const hx = X(10) + (bow > 1 ? 1 : 0), hy = 7 + b + bow;
    g.ellipse(hx, hy, 2.5, 2.5, 'N');
    g.px(hx + 1, hy - 1, 'O'); g.px(hx - 1, hy - 2, '2'); g.px(hx - 2, hy, '2'); g.px(hx + 1, hy + 2, '1');
    // the tin tag on its string
    g.px(X(9), 11 + b, '5'); g.px(X(10), 12 + b, '7');
    // front arm
    if (arms === 'reach') { g.line(X(10), 11 + b, X(14), 4 + b, 'O'); put(g, X(14), 3 + b, '22'); g.px(X(15), 4 + b, '2'); }
    else if (arms === 'swipe') { g.line(X(10), 11 + b, X(15), 14 + b, 'O'); put(g, X(15), 15 + b, '22'); g.px(X(14), 15 + b, '2'); }
    else { g.line(X(10), 11 + b, X(11), 17 + b, 'O'); g.px(X(11), 18 + b, '2'); }
    g.outline('0');
    g.px(hx + 2, hy, bow > 1 ? '2' : eye);
    g.px(X(10), 13 + b, '8');
  }
  const gp = (o) => (g) => greyDraw(g, o);
  function greyDie(i) {
    return (g) => {
      const base = art.grid(16, 26);
      greyDraw(base, { by: Math.min(2, i), lean: -1, bow: 1, hostile: i < 2 });
      const k = i / 5;
      const d = dissolve(base, k * 1.1, { seed: 23, specks: ['5', '6', '7'], edge: ['5', '6'], fall: 9 });
      heap(g, 8, 23, 1.5 + i * 1.1, 1 + Math.min(1.5, i * 0.3), ['3', '4', '5']);
      paste2(g, d);
      if (i >= 3) { g.px(9, 22, '8'); g.px(10, 22, '7'); }
    };
  }
  sheet('enemy_greyfolk', 16, 26, 8, 24, {
    idle: { fps: 2, frames: [gp({}), gp({ by: 1 })] },
    idle_h: { fps: 3, frames: [gp({ hostile: 1, lean: 1 }), gp({ hostile: 1, lean: 1, by: 1 })] },
    walk: { fps: 4, frames: [0, 1, 2, 3].map((i) => gp({ step: i, by: i % 2 })) },
    walk_h: { fps: 6, frames: [0, 1, 2, 3].map((i) => gp({ step: i, by: i % 2, lean: 1, hostile: 1 })) },
    sit: { fps: 1, frames: [gp({ sit: 1 }), gp({ sit: 1, by: 1 })] },
    face: { fps: 1, frames: [gp({ bow: 2, lean: 1 }), gp({ bow: 2, lean: 1, by: 1 })] },
    windup: { fps: 5, loop: false, frames: [gp({ hostile: 1, arms: 'reach', lean: -1 }), gp({ hostile: 1, arms: 'reach', lean: -1, by: -1 })] },
    attack: { fps: 10, loop: false, frames: [gp({ hostile: 1, arms: 'swipe', lean: 1 }), gp({ hostile: 1, arms: 'swipe', lean: 1, by: 1 })] },
    hurt: { fps: 10, loop: false, frames: [gp({ lean: -1, by: 1, bow: 1 }), gp({ by: 1 })] },
    die: { fps: 7, loop: false, frames: [0, 1, 2, 3, 4, 5].map(greyDie) },
  });

  // ================================================================================================
  // BEHAVIOUR — shared bits
  // ================================================================================================
  const dirX = (e) => (e.flip ? -1 : 1);
  const faceA = (e, a) => { e.flip = Math.cos(a) < 0; };
  const solidPx = (w, x, y) => { const id = w.tileAtPx(x, y); return !id || AV.tiles.isSolid(id); };
  // a free spot near (x, y) within r px, or null
  function freeSpot(w, x, y, rMin, rMax, test) {
    for (let i = 0; i < 12; i++) {
      const a = U.rand(0, Math.PI * 2), r = U.rand(rMin, rMax);
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.8;
      if (!solidPx(w, px, py) && !solidPx(w, px - 5, py - 3) && !solidPx(w, px + 5, py - 3) && (!test || test(px, py))) return { x: px, y: py };
    }
    return null;
  }
  function mutter(e, lines, color, chance) {
    if (Math.random() < (chance == null ? 1 : chance)) AV.fx.text(e.x, e.y - (e.hurtH || 20) - 10 - (e.z || 0), U.pick(lines), { color: color || '#857c86', life: 2.4, rise: 6 });
  }

  // ------------------------------------------------------------------------ DROWNED TOLLER
  // Slow. Close in, then a long, glowing wind-up and the bell tolls: a ring of force rolls outward (roll through it).
  // Too close and slow to toll? He brings both arms down into the water. Both leave him swaying, open.
  const TOLL_MAX = 88;
  function tollerLight(e, k) { if (e.light) { e.light.intensity = 0.3 + k * 0.9; e.light.r = 20 + k * 30; } }
  AV.data.enemies.toller = {
    name: 'Drowned Toller',
    sprite: 'enemy_toller',
    hp: 14, dmg: 2, speed: 15,
    w: 16, h: 8, hurt: { w: 20, h: 30 },
    weight: 3, poise: 2,
    aggro: 100, leash: 220,
    pennies: [4, 9], cinder: 12,
    shadow: 10,
    light: { r: 20, color: '#f59a36', intensity: 0.3, oy: -16 },
    init(e) { e.data.dripT = U.rand(0.2, 0.8); e.data.slamCool = 0; e.data.humT = U.rand(4, 9); },
    onAggro(e) { e.sfx('bell', { pitch: 0.55, vol: 0.25 }); },
    brain(e, dt) {
      const D = e.data;
      D.slamCool -= dt;
      D.dripT -= dt;
      if (D.dripT <= 0) {
        D.dripT = U.rand(0.25, 0.7);
        AV.fx.spawn({ x: e.x + U.rand(-9, 9), y: e.y - U.rand(2, 14), vx: 0, vy: 6, g: 60, life: 0.45, color: U.pick(['#82a8ad', '#537a86']), alpha: 0.8 });
      }
      switch (e.state) {
        case 'idle':
          anim(e, 'idle'); tollerLight(e, 0);
          if (!e.aggro) {
            // a muffled note from inside him now and then, heard only up close
            D.humT -= dt;
            if (D.humT <= 0) { D.humT = U.rand(7, 13); if (e.dist() < 110) e.sfx('bell', { pitch: 0.45, vol: 0.12 }); }
            break;
          }
          e.go('chase');
          break;
        case 'chase': {
          anim(e, 'walk'); tollerLight(e, 0);
          if (!e.aggro) { e.go('idle'); break; }
          const d = e.dist();
          if (e.cool <= 0 && d < 60) {
            D.move = 'toll'; e.faceTarget(); e.go('windup');
            e.telegraph({ shape: 'circle', x: e.x, y: e.y, r: TOLL_MAX * 0.8, life: 0.9, color: '#f59a36' });
            e.sfx('bell', { pitch: 0.6, vol: 0.3 });
            break;
          }
          if (D.slamCool <= 0 && d < 26) {
            D.move = 'slam'; e.faceTarget(); D.aim = e.angleTo(); e.go('windup');
            e.telegraph({ shape: 'circle', x: e.x + dirX(e) * 15, y: e.y + 1, r: 14, life: 0.6, color: '#a8a0a6' });
            break;
          }
          if (d > 18) e.chase(e.speed * (0.7 + 0.5 * Math.max(0, Math.sin(e.st * 3.4))), dt);
          else anim(e, 'idle');
          break;
        }
        case 'windup':
          if (D.move === 'slam') {
            anim(e, 'slam_windup');
            if (e.st >= 0.6) {
              e.go('attack'); anim(e, 'slam');
              const hx = e.x + dirX(e) * 15, hy = e.y + 1;
              e.hitbox({ shape: 'circle', x: hx, y: hy - 4, r: 14, life: 0.12, knock: 140 });
              AV.fx.splash(hx, hy); AV.fx.splash(hx + 4, hy - 2);
              AV.fx.shake(1.5, 0.12);
              e.sfx('slam', { vol: 0.5, pitch: 0.8 });
              D.slamCool = U.rand(2.2, 3.2);
            }
          } else {
            anim(e, 'windup');
            const k = Math.min(1, e.st / 0.9);
            tollerLight(e, k);
            if (Math.random() < k * 0.6) AV.fx.embers(e.x + dirX(e), e.y - 14, 1, { speed: 20, up: 15 });
            if (e.st >= 0.9) {
              e.go('attack'); anim(e, 'attack');
              e.shockwave({ x: e.x, y: e.y, r0: 6, speed: 100, max: TOLL_MAX, thick: 9, knock: 150, color: '#fccf63' });
              e.sfx('bell_big', { vol: 0.7 });
              AV.fx.shake(2, 0.2);
              AV.fx.burst(e.x + dirX(e), e.y - 14, 10, { color: ['#fccf63', '#f59a36', '#fff3c2'], speed: 50, life: 0.4, glow: true });
            }
          }
          break;
        case 'attack':
          if (D.move === 'slam') { anim(e, 'slam'); if (e.st >= 0.3) e.go('recover'); }
          else { anim(e, 'attack'); tollerLight(e, Math.max(0, 1 - e.st * 1.5)); if (e.st >= 0.45) e.go('recover'); }
          break;
        case 'recover': {
          // the bell rings on in him, he sways: punish window
          const long = D.move === 'slam' ? 0.75 : 1.15;
          anim(e, D.move === 'slam' && e.st < 0.5 ? 'slam' : 'idle');
          tollerLight(e, 0);
          if (e.st >= long) { e.cool = U.rand(1.3, 2.2); D.move = null; e.go('chase'); }
          break;
        }
        default: e.go('idle');
      }
    },
    onDeath(e) {
      e.sfx('bell', { pitch: 0.4, vol: 0.4 });
      AV.fx.splash(e.x, e.y); AV.fx.splash(e.x - 5, e.y + 1);
    },
  };

  // ------------------------------------------------------------------------ DROWNED NOVICE
  // Submerged: only ripples, cannot be struck. Glides close, erupts (splash marker), lunges along a marked line,
  // stands dripping for a moment (punish), then sinks and resurfaces somewhere else.
  const wetAt = (w, x, y) => { const id = w.tileAtPx(x, y); return id === 'shallow' || id === 'water'; };
  function novCanGo(e, x, y) { return !e.data.wet || wetAt(e.world, x, y); }
  function novGlide(e, a, sp, dt) {
    const nx = e.x + Math.cos(a) * sp * dt * 3, ny = e.y + Math.sin(a) * sp * dt * 3;
    if (!novCanGo(e, nx, ny)) return false;
    e.move(a, sp, dt);
    return true;
  }
  AV.data.enemies.novice = {
    name: 'Drowned Novice',
    sprite: 'enemy_novice',
    hp: 7, dmg: 2, speed: 32,
    w: 8, h: 6, hurt: { w: 10, h: 20 },
    weight: 0.8, poise: 0,
    aggro: 84, leash: 200,
    pennies: [1, 4], cinder: 7,
    shadow: 0,
    init(e) { e.hittable = false; e.state = 'under'; e.data.rippleT = 0; e.data.wanderT = U.rand(1, 3); },
    brain(e, dt) {
      const D = e.data;
      if (D.wet == null) D.wet = wetAt(e.world, e.x, e.y);
      switch (e.state) {
        case 'idle':
        case 'under': {
          if (e.state !== 'under') { e.state = 'under'; }
          anim(e, 'submerged');
          e.hittable = false;
          D.rippleT -= dt;
          if (D.rippleT <= 0) {
            D.rippleT = U.rand(0.4, 0.9);
            AV.fx.spawn({ x: e.x + U.rand(-4, 4), y: e.y - 1, vx: U.rand(-4, 4), vy: -2, life: 0.5, color: U.pick(['#82a8ad', '#b9d6d3']), alpha: 0.6 });
          }
          if (!e.aggro) {
            // drifting under the surface near where it drowned
            D.wanderT -= dt;
            if (D.wanderT <= 0) { D.wanderT = U.rand(2, 4.5); D.dest = freeSpot(e.world, e.home.x, e.home.y, 6, 30, (x, y) => novCanGo(e, x, y)); }
            if (D.dest && e.moveToward(D.dest.x, D.dest.y, 10, dt)) D.dest = null;
            break;
          }
          const d = e.dist();
          if (d < 30 && e.cool <= 0) { e.go('emerge'); D.fresh = true; break; }
          if (D.dest) {
            if (!novGlide(e, Math.atan2(D.dest.y - e.y, D.dest.x - e.x), e.speed * 1.2, dt) || U.dist(e.x, e.y, D.dest.x, D.dest.y) < 4) D.dest = null;
          } else if (d > 12) novGlide(e, e.angleTo(), e.speed, dt);
          break;
        }
        case 'emerge':
          anim(e, 'emerge');
          if (D.fresh) {
            D.fresh = false;
            e.hittable = true;
            e.faceTarget();
            e.telegraph({ shape: 'circle', x: e.x, y: e.y, r: 14, life: 0.4, color: '#b9d6d3' });
            e.sfx('splash', { pitch: 1.2, vol: 0.6 });
            AV.fx.splash(e.x, e.y); AV.fx.splash(e.x + 3, e.y - 2);
          }
          if (e.st >= 0.38) {
            e.go('windup');
            D.aim = e.angleTo(); faceA(e, D.aim);
            e.telegraph({ shape: 'line', x: e.x, y: e.y, a: D.aim, len: 42, width: 12, life: 0.34, color: '#b9d6d3' });
          }
          break;
        case 'windup':
          anim(e, 'windup');
          e.hittable = true;
          if (e.st < 0.12) { D.aim += U.angleDiff(D.aim, e.angleTo()) * 0.15; faceA(e, D.aim); }
          if (e.st >= 0.34) {
            e.go('attack');
            e.hitbox({ shape: 'circle', follow: e, fx: Math.cos(D.aim) * 8, fy: Math.sin(D.aim) * 5 - 6, x: e.x, y: e.y, r: 10, life: 0.22, knock: 120 });
            e.sfx('swing', { pitch: 1.35, vol: 0.5 });
            AV.fx.splash(e.x, e.y);
          }
          break;
        case 'attack':
          anim(e, 'attack');
          if (novCanGo(e, e.x + Math.cos(D.aim) * 6, e.y + Math.sin(D.aim) * 6)) e.move(D.aim, 150, dt);
          faceA(e, D.aim);
          if (e.st >= 0.22) e.go('recover');
          break;
        case 'recover':
          // up to the knees, dripping, reaching for nothing: the punish window
          e.hittable = true;
          anim(e, 'idle');
          if (e.st >= 0.8) { e.go('sink'); e.sfx('splash', { pitch: 0.8, vol: 0.4 }); }
          break;
        case 'sink':
          anim(e, 'sink');
          if (e.st >= 0.2) e.hittable = false;
          if (e.st >= 0.42) {
            const P = e.P;
            D.dest = P ? freeSpot(e.world, P.x, P.y, 40, 70, (x, y) => novCanGo(e, x, y)) : null;
            e.cool = U.rand(1.3, 2.3);
            e.go('under');
          }
          break;
        default: e.go('under');
      }
    },
    onDeath(e) { AV.fx.splash(e.x, e.y); AV.fx.ghostly(e.x, e.y - 10, 5); },
  };

  // ------------------------------------------------------------------------ SHIELDBOUND
  // The tower shield turns every blow that lands within ~70° of where he faces (he turns slowly).
  // Flank him — or wait for the bash: a marked dash, then the shield drags low and he stands open ~0.9 s.
  const SB_GUARD = 1.22;
  AV.data.enemies.shieldbound = {
    name: 'Shieldbound',
    sprite: 'enemy_shieldbound',
    hp: 12, dmg: 2, speed: 22,
    w: 12, h: 7, hurt: { w: 18, h: 26 },
    weight: 2.6, poise: 1,
    aggro: 92, leash: 230,
    pennies: [3, 7], cinder: 10,
    shadow: 9,
    init(e) { e.data.face = U.pick([0, Math.PI]); e.data.openT = 0; e.flip = Math.cos(e.data.face) < 0; },
    onHit(e, hit) {
      const D = e.data;
      if (e.state === 'open' || e.state === 'recover' || D.openT > 0) return true;
      const src = hit.projectile || !hit.owner ? { x: hit.x != null ? hit.x : e.x, y: hit.y != null ? hit.y : e.y } : hit.owner;
      const a = Math.atan2(src.y - e.y, src.x - e.x);
      if (angDiff(a, D.face) <= SB_GUARD) {
        // turned aside: and he answers soon
        e.cool = Math.min(e.cool, 0.3);
        e.aggro = true;
        return false;
      }
      return true;
    },
    brain(e, dt) {
      const D = e.data;
      switch (e.state) {
        case 'idle':
          anim(e, 'idle');
          e.flip = Math.cos(D.face) < 0;
          if (e.aggro) e.go('chase');
          break;
        case 'chase': {
          anim(e, 'walk');
          if (!e.aggro) { e.go('idle'); break; }
          const a = e.angleTo(), d = e.dist();
          D.face += U.clamp(U.angleDiff(D.face, a), -2.6 * dt, 2.6 * dt);
          if (e.cool <= 0 && d < 52) {
            D.face = D.aim = a;
            e.go('windup');
            e.telegraph({ shape: 'line', x: e.x, y: e.y, a: D.aim, len: 54, width: 16, life: 0.6, color: '#cbc4c3' });
            e.sfx('block', { pitch: 0.6, vol: 0.45 });
          } else if (d > 20) e.chase(e.speed, dt);
          else anim(e, 'idle');
          e.flip = Math.cos(D.face) < 0;
          break;
        }
        case 'windup':
          anim(e, 'windup');
          if (e.st < 0.25) { D.aim += U.clamp(U.angleDiff(D.aim, e.angleTo()), -1.5 * dt, 1.5 * dt); D.face = D.aim; }
          e.flip = Math.cos(D.face) < 0;
          if (e.st >= 0.6) {
            e.go('attack');
            e.hitbox({ shape: 'circle', follow: e, fx: Math.cos(D.aim) * 10, fy: Math.sin(D.aim) * 6 - 8, x: e.x, y: e.y, r: 12, life: 0.28, knock: 180 });
            e.sfx('whoosh', { pitch: 0.7, vol: 0.6 });
          }
          break;
        case 'attack': {
          anim(e, 'attack');
          const px = e.x, py = e.y;
          e.move(D.aim, 175, dt);
          e.flip = Math.cos(D.face) < 0;
          const stuck = U.dist(px, py, e.x, e.y) < 175 * dt * 0.3;
          if (e.st >= 0.28 || (stuck && e.st > 0.05)) {
            // the shield slams down and drags: he stands open
            D.openT = stuck ? 1.3 : 0.9;
            e.go('open');
            e.sfx('slam', { pitch: 1.3, vol: 0.45 });
            AV.fx.ash(e.x + dirX(e) * 12, e.y, 8, { speed: 40, up: 6 });
            if (stuck) AV.fx.shake(1.5, 0.12);
          }
          break;
        }
        case 'open':
          anim(e, 'open');
          D.openT -= dt;
          if (Math.random() < 0.15) AV.fx.embers(e.x + dirX(e) * 2, e.y - 16, 1, { speed: 12, up: 10 });
          if (D.openT <= 0) { D.openT = 0; e.go('recover'); }
          break;
        case 'recover':
          anim(e, 'idle');
          if (e.st >= 0.35) { D.face = e.angleTo(); e.cool = U.rand(1.0, 1.8); e.go('chase'); }
          break;
        default: e.go('idle');
      }
    },
    onDeath(e) { e.sfx('block', { pitch: 0.5, vol: 0.4 }); },
  };

  // ------------------------------------------------------------------------ PIKE-HUSK
  // Keeps his distance (backs off, sidesteps). Pulls the pike back along a marked line, then one long thrust.
  // The pike stays out a long moment afterwards: get inside it.
  const PIKE_REACH = 66;
  AV.data.enemies.pikeman = {
    name: 'Pike-Husk',
    sprite: 'enemy_pikeman',
    hp: 8, dmg: 2, speed: 26,
    w: 10, h: 6, hurt: { w: 12, h: 24 },
    weight: 1.2, poise: 0,
    aggro: 110, leash: 240,
    pennies: [2, 6], cinder: 9,
    shadow: 7,
    init(e) { e.data.side = U.pick([-1, 1]); e.data.sideT = U.rand(1, 2.5); },
    brain(e, dt) {
      const D = e.data;
      switch (e.state) {
        case 'idle':
          anim(e, 'idle');
          if (e.aggro) e.go('chase');
          break;
        case 'chase': {
          if (!e.aggro) { e.go('idle'); break; }
          const d = e.dist(), a = e.angleTo();
          D.sideT -= dt;
          if (D.sideT <= 0) { D.side *= -1; D.sideT = U.rand(1.2, 2.6); }
          const cornered = (e.blockedX || e.blockedY) && d < 30;
          if (e.cool <= 0 && ((d >= 28 && d <= 60 && e.canSee()) || cornered)) {
            D.aim = a; D.wind = cornered ? 0.45 : 0.62;
            faceA(e, a);
            e.go('windup');
            D.tel = e.telegraph({ shape: 'line', x: e.x, y: e.y, a: D.aim, len: PIKE_REACH, width: 8, life: D.wind + 0.05, color: '#e2621f' });
            break;
          }
          anim(e, 'walk');
          if (d < 36) e.move(a + Math.PI + D.side * 0.4, e.speed * 0.9, dt);          // give ground
          else if (d > 58) e.move(a + D.side * 0.3, e.speed, dt);                   // close in
          else e.move(a + D.side * Math.PI / 2, e.speed * 0.45, dt);                  // circle at pike's length
          faceA(e, a);
          break;
        }
        case 'windup':
          anim(e, 'windup');
          if (e.st < 0.2) {
            D.aim += U.angleDiff(D.aim, e.angleTo()) * 0.1;
            if (D.tel) D.tel.a = D.aim;
          }
          faceA(e, D.aim);
          if (e.st >= (D.wind || 0.62)) {
            e.go('attack');
            e.hitbox({ shape: 'arc', x: e.x, y: e.y - 8, r: PIKE_REACH, a: D.aim, spread: 0.13, life: 0.14, knock: 160 });
            e.sfx('swing', { pitch: 0.55, vol: 0.6 });
            AV.fx.sparks(e.x + Math.cos(D.aim) * 40, e.y - 8 + Math.sin(D.aim) * 40, 3, D.aim);
          }
          break;
        case 'attack':
          anim(e, 'attack');
          if (e.st < 0.12) e.move(D.aim, 70, dt);
          faceA(e, D.aim);
          if (e.st >= 0.3) e.go('recover');
          break;
        case 'recover':
          // the pike hangs out long and low; he hauls it back slowly
          anim(e, e.st < 0.5 ? 'recover' : 'idle');
          if (e.st >= 0.85) { e.cool = U.rand(0.9, 1.7); e.go('chase'); }
          break;
        default: e.go('idle');
      }
    },
  };

  // ------------------------------------------------------------------------ THE UNLIT
  // Floats at a distance and circles, spits slow ember bolts (flare + marked line). Too close, and it flares:
  // a ring of flame around itself after a marked beat. Hungry for warmth: it closes in on a Kindled knight.
  const UNLIT_WHISPERS = ['…warm…', '…so cold…', '…give it…', '…closer…'];
  AV.data.enemies.unlit = {
    name: 'the Unlit',
    sprite: 'enemy_unlit',
    hp: 6, dmg: 2, speed: 30,
    flying: true,
    w: 8, h: 6, hurt: { w: 12, h: 18 },
    weight: 0.7, poise: 0,
    aggro: 120, leash: 280,
    pennies: [1, 4], cinder: 8,
    shadow: 5,
    light: { r: 34, color: '#e2621f', intensity: 0.8, oy: -20, flicker: 0.2 },
    init(e) { e.z = 10; e.data.bob = U.rand(0, 6); e.data.orbit = U.pick([-1, 1]); e.data.orbitT = U.rand(2, 4); e.data.emberT = 0; e.data.driftA = U.rand(0, 6); },
    onAggro(e) { mutter(e, UNLIT_WHISPERS, '#e2621f', 0.6); },
    brain(e, dt) {
      const D = e.data, P = e.P;
      D.bob += dt;
      e.z = 10 + Math.sin(D.bob * 2.4) * 2;
      D.emberT -= dt;
      if (D.emberT <= 0) {
        D.emberT = U.rand(0.08, 0.2);
        AV.fx.spawn({ x: e.x + U.rand(-4, 4), y: e.y - e.z - U.rand(10, 20), vx: U.rand(-6, 6), vy: U.rand(-24, -12), life: U.rand(0.4, 0.8), color: U.pick(['#f59a36', '#e2621f', '#b8361a']), glow: true });
      }
      const hungry = P && P.kindled;
      switch (e.state) {
        case 'idle':
          anim(e, 'idle');
          D.driftA += dt * 0.7;
          e.moveToward(e.home.x + Math.cos(D.driftA) * 10, e.home.y + Math.sin(D.driftA * 1.3) * 6, 8, dt);
          if (e.aggro) e.go('chase');
          break;
        case 'chase': {
          if (!e.aggro) { e.go('idle'); break; }
          anim(e, 'walk');
          const d = e.dist(), a = e.angleTo();
          D.orbitT -= dt;
          if (D.orbitT <= 0) { D.orbit *= -1; D.orbitT = U.rand(2, 4); }
          if (e.cool <= 0 && d < 26) {
            D.move = 'flare'; e.go('windup');
            e.telegraph({ shape: 'circle', x: e.x, y: e.y, r: 22, life: 0.5, color: '#e2621f' });
            e.sfx('fire', { vol: 0.35, pitch: 1.3 });
            break;
          }
          if (e.cool <= 0 && d < 140 && e.canSee()) {
            D.move = 'bolt'; D.aim = a; faceA(e, a); e.go('windup');
            D.tel = e.telegraph({ shape: 'line', x: e.x, y: e.y, a: D.aim, len: 46, width: 6, life: 0.6, color: '#f59a36' });
            break;
          }
          const want = hungry ? 30 : 72;
          const radial = d > want + 10 ? 1 : d < want - 10 ? -1 : 0;
          const vx = Math.cos(a) * radial + Math.cos(a + D.orbit * Math.PI / 2) * 0.8;
          const vy = Math.sin(a) * radial + Math.sin(a + D.orbit * Math.PI / 2) * 0.8;
          e.move(Math.atan2(vy, vx), e.speed * (hungry ? 1.5 : 1), dt);
          if (e.blockedX || e.blockedY) D.orbit *= -1;
          faceA(e, a);
          break;
        }
        case 'windup':
          anim(e, 'windup');
          if (D.move === 'flare') {
            if (e.light) e.light.intensity = 0.8 + e.st * 1.4;
            if (e.st >= 0.5) {
              e.go('attack');
              e.hitbox({ shape: 'circle', x: e.x, y: e.y - 6, r: 22, life: 0.15, knock: 130 });
              AV.fx.embers(e.x, e.y - e.z - 12, 16, { speed: 70 });
              AV.fx.burst(e.x, e.y - 4, 12, { color: ['#fccf63', '#f59a36', '#e2621f'], speed: 60, up: 5, life: 0.35, glow: true });
              e.sfx('fire', { vol: 0.6, pitch: 0.8 });
            }
          } else {
            if (e.st < 0.25) { D.aim += U.angleDiff(D.aim, e.angleTo()) * 0.12; if (D.tel) D.tel.a = D.aim; }
            faceA(e, D.aim);
            if (Math.random() < 0.4) AV.fx.embers(e.x + dirX(e) * 2, e.y - e.z - 12, 1, { speed: 15 });
            if (e.st >= 0.6) {
              e.go('attack');
              e.shoot({ x: e.x + dirX(e) * 4, y: e.y, z: e.z + 12, angle: D.aim, speed: 72, r: 3, life: 3.2, color: '#f59a36', trail: 'ember', homing: 0.35, knock: 60, lightR: 22 });
              e.sfx('projectile', { vol: 0.5, pitch: 0.8 });
            }
          }
          break;
        case 'attack':
          anim(e, 'attack');
          if (e.st >= 0.3) e.go('recover');
          break;
        case 'recover':
          anim(e, 'idle');
          if (e.light) e.light.intensity = 0.8;
          e.move(e.angleTo() + Math.PI, 10, dt);
          faceA(e, e.angleTo());
          if (e.st >= (D.move === 'flare' ? 0.9 : 0.7)) { e.cool = U.rand(1.4, 2.4); e.go('chase'); }
          break;
        default: e.go('idle');
      }
    },
    onDeath(e) {
      AV.fx.embers(e.x, e.y - e.z - 12, 14, { speed: 50 });
      if (Math.random() < 0.5) AV.fx.text(e.x, e.y - 34, '…out…', { color: '#857c86', life: 1.8, rise: 8 });
    },
  };

  // ------------------------------------------------------------------------ GREY CHANDLER
  // Keeps well back and lobs molten wax: the landing spot is marked from the moment he raises the ladle.
  // It splashes, then burns as a pool for a few seconds. Walk up to him and he backs away, still praying.
  const CHANDLER_LINES = ['…mercy is warm…', '…hold still, child…', '…the Mother\'s own fire…', '…burn clean…'];
  class WaxPool extends AV.Entity {
    constructor(world, x, y, life) {
      super(null, world);
      this.x = x; this.y = y; this.life = life; this.t = 0; this.tickT = 0.55;
      this.flat = true;
      this.seed = U.randi(0, 999);
      this.light = { r: 26, color: '#f59a36', intensity: 0.7, oy: 0, flicker: 0.25 };
    }
    update(dt) {
      this.t += dt; this.tickT -= dt;
      const k = Math.max(0, 1 - this.t / this.life);
      this.light.intensity = 0.7 * Math.min(1, k * 2.5);
      if (this.tickT <= 0 && k > 0.08) {
        this.tickT = 0.7;
        AV.combat.add({ team: 'enemy', shape: 'circle', x: this.x, y: this.y - 2, r: 10, dmg: 1, knock: 40, life: 0.08, owner: this });
      }
      if (Math.random() < 0.3 * k) AV.fx.spawn({ x: this.x + U.rand(-8, 8), y: this.y + U.rand(-3, 3), vx: U.rand(-3, 3), vy: U.rand(-22, -10), life: U.rand(0.3, 0.6), color: U.pick(['#f59a36', '#fccf63', '#e2621f']), glow: true });
      if (this.t >= this.life) this.gone = true;
    }
    draw(ctx, cam) {
      const k = Math.max(0, 1 - this.t / this.life);
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
      const grow = Math.min(1, this.t * 6);
      ctx.globalAlpha = Math.min(1, k * 3);
      ctx.fillStyle = '#a3784a';
      ctx.beginPath(); ctx.ellipse(x, y, 11 * grow, 5 * grow, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e6cc9c';
      ctx.beginPath(); ctx.ellipse(x + 1, y - 1, 8 * grow, 3.4 * grow, 0, 0, Math.PI * 2); ctx.fill();
      // small flames along the pool
      const fl = Math.floor(this.t * 10);
      for (let i = 0; i < 5; i++) {
        const fx = x - 8 + i * 4 + ((this.seed + i) % 3) - 1, h = 2 + ((fl + i * 3 + this.seed) % 3);
        const fy = y - 1 + ((i * 7 + this.seed) % 3) - 1;
        ctx.fillStyle = '#e2621f'; ctx.fillRect(fx, fy - h, 1, h);
        ctx.fillStyle = '#fccf63'; ctx.fillRect(fx, fy - h - 1, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }
  function waxLand(world, x, y, owner) {
    AV.combat.add({ team: 'enemy', shape: 'circle', x, y: y - 3, r: 13, dmg: 2, knock: 100, life: 0.12, owner });
    world.add(new WaxPool(world, x, y, 3.4));
    AV.fx.burst(x, y - 2, 12, { color: ['#e6cc9c', '#c9a26e', '#f59a36', '#fccf63'], speed: 55, up: 30, g: 120, life: 0.45 });
    AV.audio.sfx('fire', { vol: 0.5, pitch: 1.1 });
  }
  AV.data.enemies.chandler = {
    name: 'Grey Chandler',
    sprite: 'enemy_chandler',
    hp: 9, dmg: 2, speed: 24,
    w: 10, h: 6, hurt: { w: 12, h: 26 },
    weight: 1.1, poise: 0,
    aggro: 120, leash: 240,
    pennies: [3, 7], cinder: 10,
    shadow: 7,
    light: { r: 30, color: '#fccf63', intensity: 0.6, oy: -34, flicker: 0.15 },
    init(e) { e.data.side = U.pick([-1, 1]); e.data.sideT = U.rand(1.5, 3); e.data.dripT = U.rand(0.3, 1); },
    onAggro(e) { mutter(e, CHANDLER_LINES, '#c9a26e', 0.7); },
    brain(e, dt) {
      const D = e.data;
      D.dripT -= dt;
      if (D.dripT <= 0) { D.dripT = U.rand(0.4, 1.1); AV.fx.spawn({ x: e.x + U.rand(-5, 5), y: e.y - U.rand(6, 20), vx: 0, vy: 4, g: 50, life: 0.5, color: U.pick(['#e6cc9c', '#c9a26e']) }); }
      switch (e.state) {
        case 'idle':
          anim(e, 'idle');
          if (e.aggro) e.go('chase');
          break;
        case 'chase': {
          if (!e.aggro) { e.go('idle'); break; }
          const d = e.dist(), a = e.angleTo();
          D.sideT -= dt;
          if (D.sideT <= 0) { D.side *= -1; D.sideT = U.rand(1.5, 3); }
          const cornered = (e.blockedX || e.blockedY) && d < 34;
          if (e.cool <= 0 && d >= 24 && d < 135 && e.canSee() || (cornered && e.cool <= 0.5)) {
            const P = e.P;
            D.tx = P.x; D.ty = P.y;
            faceA(e, a);
            e.go('windup');
            e.telegraph({ shape: 'circle', x: D.tx, y: D.ty, r: 13, life: 0.65 + 0.85, color: '#fccf63' });
            e.sfx('fire', { vol: 0.25, pitch: 1.5 });
            break;
          }
          anim(e, 'walk');
          if (d < 46) e.move(a + Math.PI + D.side * 0.5, e.speed * 1.1, dt);            // backs away from the blade
          else if (d > 100) e.move(a + D.side * 0.3, e.speed, dt);
          else e.move(a + D.side * Math.PI / 2, e.speed * 0.4, dt);
          faceA(e, a);
          if (Math.random() < dt * 0.05 && d < 110) mutter(e, CHANDLER_LINES, '#c9a26e');
          break;
        }
        case 'windup':
          anim(e, 'windup');
          faceA(e, Math.atan2(D.ty - e.y, D.tx - e.x));
          if (e.st >= 0.65) {
            e.go('attack');
            const dd = Math.max(4, U.dist(e.x, e.y, D.tx, D.ty));
            const T = U.clamp(0.55 + dd / 260, 0.6, 0.95), G = 300, z0 = 26;
            const vz = (0.5 * G * T * T - z0) / T;
            e.shoot({ x: e.x + dirX(e) * 5, y: e.y, z: z0, angle: Math.atan2(D.ty - e.y, D.tx - e.x), speed: dd / T,
              gravity: G, vz, lands: true, r: 3, life: T + 0.6, color: '#e6cc9c', trail: 'wax', lightR: 16,
              onExpire: (p, world) => waxLand(world, p.x, p.y, e) });
            e.sfx('whoosh', { vol: 0.4, pitch: 1.2 });
          }
          break;
        case 'attack':
          anim(e, 'attack');
          if (e.st >= 0.3) e.go('recover');
          break;
        case 'recover':
          anim(e, 'idle');
          if (e.st >= 0.75) { e.cool = U.rand(1.6, 2.6); e.go('chase'); }
          break;
        default: e.go('idle');
      }
    },
    onDeath(e) {
      AV.fx.burst(e.x, e.y - 8, 10, { color: ['#e6cc9c', '#c9a26e', '#a3784a'], speed: 35, up: 10, g: 80, life: 0.6 });
    },
  };

  // ------------------------------------------------------------------------ THE GREY
  // Passive. They wander, sit in the ash, stand with their foreheads to a wall. They do not attack —
  // unless struck (and striking one costs Brand something) or unless he comes near them burning.
  const GREY_MURMURS = ['…is it evening…', '…row nine… row nine…', '…I had a door…', '…who\'s there…', '…don\'t let it go out…', '…Mam?…'];
  const GREY_ROUSED = ['…the fire…', '…not again…', '…you…'];
  function greyWall(e) {
    const w = e.world;
    const opts = [];
    for (const dx of [-1, 1]) {
      for (let s = 8; s <= 72; s += 8) {
        if (solidPx(w, e.x + dx * s, e.y - 2)) { if (s > 10) opts.push({ x: e.x + dx * (s - 8), y: e.y, dir: dx }); break; }
      }
    }
    return opts.length ? U.pick(opts) : null;
  }
  function greyRouse(e, byStrike) {
    const D = e.data;
    if (D.hostile) return;
    D.hostile = true;
    e.passive = false; e.passiveTarget = false; e.aggro = true;
    e.speed = 22;
    if (!byStrike) mutter(e, GREY_ROUSED, '#e2621f');
    e.cool = byStrike ? 0.6 : 0.3;
    e.go('chase');
  }
  AV.data.enemies.greyfolk = {
    name: 'the Grey',
    sprite: 'enemy_greyfolk',
    hp: 5, dmg: 1, speed: 11,
    w: 8, h: 6, hurt: { w: 10, h: 20 },
    weight: 0.9, poise: 0,
    aggro: 80, leash: 200,
    pennies: [0, 2], cinder: 6,
    passive: true,
    shadow: 5,
    init(e) {
      e.passiveTarget = true;
      const D = e.data;
      D.mode = U.pick(['wander', 'sit', 'wall', 'wander']); D.modeT = U.rand(4, 10); D.murT = U.rand(4, 12);
      e.state = 'idle';
    },
    onHit(e, hit) {
      const D = e.data;
      if (!D.struck && hit.team === 'player') { D.struck = true; AV.state.addHollow(1); }
      greyRouse(e, true);
      return true;
    },
    brain(e, dt) {
      const D = e.data, P = e.P;
      if (!D.hostile) {
        if (P && P.kindled && e.dist() < 60) { greyRouse(e, false); return; }
        e.passiveTarget = true;
        // murmurs, only when he is close enough to hear
        D.murT -= dt;
        if (D.murT <= 0) { D.murT = U.rand(8, 16); if (e.dist() < 70) mutter(e, GREY_MURMURS, '#a8a0a6'); }
        D.modeT -= dt;
        if (D.modeT <= 0) {
          D.mode = U.pick(['wander', 'wander', 'sit', 'wall']); D.modeT = U.rand(6, 14);
          D.dest = null; D.wall = null; D.pauseT = 0;
        }
        if (D.mode === 'sit') { anim(e, 'sit'); return; }
        if (D.mode === 'wall') {
          if (!D.wall) { D.wall = greyWall(e); if (!D.wall) { D.mode = 'wander'; return; } }
          if (e.moveToward(D.wall.x, D.wall.y, e.speed, dt) || e.blockedX) { anim(e, 'face'); e.flip = D.wall.dir < 0; }
          else anim(e, 'walk');
          return;
        }
        // wander: shuffle a few steps, stand, shuffle again
        if (D.pauseT > 0) { D.pauseT -= dt; anim(e, 'idle'); return; }
        if (!D.dest) D.dest = freeSpot(e.world, e.home.x, e.home.y, 8, 40);
        if (!D.dest) { D.pauseT = U.rand(2, 4); return; }
        anim(e, 'walk');
        if (e.moveToward(D.dest.x, D.dest.y, e.speed, dt) || (e.blockedX && e.blockedY)) { D.dest = null; D.pauseT = U.rand(1.5, 4.5); }
        return;
      }
      // roused: slow, grasping
      switch (e.state) {
        case 'idle':
          anim(e, 'idle_h');
          if (e.aggro) e.go('chase');
          break;
        case 'chase': {
          anim(e, 'walk_h');
          if (!e.aggro) { e.go('idle'); break; }
          const d = e.dist();
          if (e.cool <= 0 && d < 22) {
            e.faceTarget(); D.aim = e.angleTo();
            e.go('windup');
            e.telegraph({ shape: 'circle', x: e.x + Math.cos(D.aim) * 12, y: e.y + Math.sin(D.aim) * 9, r: 11, life: 0.62, color: '#a8a0a6' });
            break;
          }
          if (d > 14) e.chase(e.speed, dt);
          break;
        }
        case 'windup':
          anim(e, 'windup');
          if (e.st >= 0.62) {
            e.go('attack');
            e.hitbox({ shape: 'arc', x: e.x, y: e.y - 8, r: 21, a: D.aim, spread: 0.85, life: 0.12, knock: 80 });
            e.sfx('swing', { pitch: 0.6, vol: 0.4 });
          }
          break;
        case 'attack':
          anim(e, 'attack');
          if (e.st >= 0.3) e.go('recover');
          break;
        case 'recover':
          anim(e, 'idle_h');
          if (e.st >= 0.9) { e.cool = U.rand(0.8, 1.5); e.go('chase'); }
          break;
        default: e.go('idle');
      }
    },
    onDeath(e) { AV.fx.ash(e.x, e.y - 10, 16, { speed: 30, up: 20 }); },
  };
})(window.AV);
