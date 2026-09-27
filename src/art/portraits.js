// ASHEN VOW — dialogue portraits (ART-PEOPLE)
// 48×48 busts, transparent ground, one hard key light from the left; the right side of every face falls into shadow.
// Living: dark outline. Ghosts: slate outline, ghost palette, bust dissolving at the bottom.
(function (AV) {
  'use strict';
  const art = AV.art;
  const W = 48, H = 48;

  // ================================================================ lighting toolkit
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bay = (x, y) => (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const LN = (() => { const x = -0.8, y = -0.38, z = 0.46, l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; })();

  function mask() { return new AV.Grid(W, H); }
  // Box-blurred coverage of a mask: a soft height field.
  function heights(m, r) {
    const a = new Float32Array(W * H), b = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) a[i] = m.d[i] != null ? 1 : 0;
    const n = 2 * r + 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < W) s += a[y * W + xx]; }
      b[y * W + x] = s / n;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < H) s += b[yy * W + x]; else if (yy >= H) s += b[(H - 1) * W + x]; }
      a[y * W + x] = s / n;
    }
    return a;
  }
  // Pick a ramp colour for value v in [0,1], dithering only near band edges.
  function pick(ramp, v, x, y, crisp) {
    v = clamp(v, 0, 0.999);
    const f = v * ramp.length - 0.5;
    let i = Math.floor(f);
    let fr = f - i;
    fr = clamp((fr - 0.5) * (crisp || 2.6) + 0.5, 0, 1);
    if (fr > bay(x, y)) i++;
    return ramp[clamp(i, 0, ramp.length - 1)];
  }
  // Light a masked region into g.
  function shade(g, m, ramp, o) {
    o = Object.assign({ r: 4, k: 2.4, amb: 0.08, grad: 0.3, bias: 0, fall: 0.35, fallY: 38, crisp: 2.6, pivot: 0.42 }, o || {});
    const h = heights(m, o.r);
    let x0 = W, x1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m.d[y * W + x] != null) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
    const span = Math.max(1, x1 - x0);
    const at = (x, y) => h[clamp(y, 0, H - 1) * W + clamp(x, 0, W - 1)];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (m.d[y * W + x] == null) continue;
      let nx = (at(x - 1, y) - at(x + 1, y)) * o.k, ny = (at(x, y - 1) - at(x, y + 1)) * o.k, nz = 1;
      const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
      const d = Math.max(0, nx * LN[0] + ny * LN[1] + nz * LN[2]);
      let v = o.amb + (1 - o.amb) * d;
      v -= o.grad * ((x - x0) / span - o.pivot);
      v += o.bias;
      if (y > o.fallY) v -= o.fall * (y - o.fallY) / 10;
      g.px(x, y, pick(ramp, v, x, y, o.crisp));
    }
  }
  // Shape helpers that draw into a fresh mask and shade it.
  function sEll(g, cx, cy, rx, ry, ramp, o) { const m = mask(); m.ellipse(cx, cy, rx, ry, 'x'); shade(g, m, ramp, o); return m; }
  function sPoly(g, p, ramp, o) { const m = mask(); m.poly(p, 'x'); shade(g, m, ramp, o); return m; }
  function sMask(g, fn, ramp, o) { const m = mask(); fn(m); shade(g, m, ramp, o); return m; }
  // Stamp small ASCII blocks through a colour map; '.' skips; unmapped chars are palette chars.
  function st(g, x, y, rows, map) {
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
      const ch = rows[j][i];
      if (ch === '.' || ch === ' ') continue;
      const c = map && map[ch] !== undefined ? map[ch] : ch;
      if (c === '_') g.px(x + i, y + j, null); else g.px(x + i, y + j, c);
    }
  }
  function pts(g, list) { for (const p of list) g.px(p[0], p[1], p[2]); }
  // Recolour pixels of one colour to another within a rectangle.
  function recol(g, x0, y0, x1, y1, map) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const c = g.get(x, y);
      if (c != null && map[c] !== undefined) g.px(x, y, map[c]);
    }
  }
  // Only paint where something is already painted (keeps detail inside silhouettes).
  function on(g, x, y, c) { if (g.get(x, y) != null) g.px(x, y, c); }
  function finishLiving(g) { g.outline('0'); }
  // Ghost bust: slate outline, dissolving from fy downward.
  const GR = ['s', 't', 'u', 'v', 'w', 'x', 'y'];
  function finishGhost(g, fy) {
    g.outline('t');
    for (let y = fy; y < H; y++) {
      const t = (y - fy) / (H - fy);
      for (let x = 0; x < W; x++) {
        const c = g.get(x, y);
        if (c == null) continue;
        const k = GR.indexOf(c);
        if (k >= 0) g.px(x, y, GR[Math.max(0, k - Math.round(t * 2.5))]);
        if (bay(x, y) < t * 1.2 - 0.15) g.px(x, y, null);
      }
    }
  }

  // ================================================================ face kit
  // Features as small blocks through a colour map. Map letters:
  //  L lid/lash  W sclera (lit)  w sclera (shadow)  I iris  G glint  S under-eye  s under-eye (shadow)
  //  B brow  H nose light  K crease/mouth  D deepest  T teeth  M mid
  const EYES = {
    open: ['.LLL', 'LWII', '.SSS'],
    tired: ['LLLL', '.LII', '..SS'],
    wide: ['.LL.', 'LWIW', '.WW.'],
    closed: ['....', 'LLLL', '.SS.'],
    happy: ['.LL.', 'L..L', '....'],
    down: ['LLLL', 'LLII', '.S..'],
    side: ['.LLL', 'LWWI', '.SSS'],
    stare: ['LLLL', 'WIIW', '.SS.'],
  };
  const BROWS = {
    flat: ['BBBB.', '.....'],
    angry: ['BB...', '..BBB'],
    sad: ['..BBB', 'BB...'],
    raised: ['.BBB.', 'B...B'],
    heavy: ['BBBBB', '.BBB.'],
  };
  const MOUTHS = {
    flat: ['.KKKKK.', '..HHH..'],
    frown: ['..KKK..', '.K...K.'],
    smile: ['K.....K', '.KKKKK.', '..HHH..'],
    grin: ['KKKKKKK', 'KTTTTTK', '.KDDDK.', '..KKK..'],
    open: ['..KKK..', '.KDDDK.', '.KDDDK.', '..KKK..'],
    tight: ['..KKKK.', '.K.....', '..HH...'],
    smirk: ['.....K.', '.KKKK..', '..HH...'],
    snarl: ['KKKKKKK', 'KTKTKTK', 'KDDDDDK', '.KKKKK.'],
    small: ['..KKK..', '...H...'],
  };
  const flipRows = (rows) => rows.map((r) => r.split('').reverse().join(''));
  const SHADOW_OF = { W: 'w', S: 's', H: 'M' };
  function feat(g, o) {
    const cx = o.cx || 24, ey = o.eyeY || 21, m = o.map;
    const mR = Object.assign({}, m);
    for (const k in SHADOW_OF) if (m[SHADOW_OF[k]] !== undefined) mR[k] = m[SHADOW_OF[k]];
    const el = EYES[o.eyes || 'open'], er = o.eyesR ? EYES[o.eyesR] : el;
    st(g, cx - 6, ey - 1, el, m);
    st(g, cx + 3, ey - 1, o.eyes === 'side' ? er : flipRows(er), mR);
    if (o.brows) {
      const b = BROWS[o.brows], by = ey - 4 + (o.browDy || 0);
      st(g, cx - 7, by, b, m);
      st(g, cx + 3, by, flipRows(b), mR);
    }
    if (o.nose !== false) st(g, cx - 1, ey + 2, o.noseRows || ['.H.', '.HK', '.HK', 'HMK', 'KDK'], m);
    if (o.mouth) st(g, cx - 3, o.mouthY || ey + 9, MOUTHS[o.mouth], m);
  }

  // ================================================================ ramps
  const SKIN = ['1', 'a', 'b', 'h', 'i', 'j'];
  const GREY_SKIN = ['1', '2', '3', 'N', 'O', '8'];
  const WOOL = ['1', '2', '3', '4', '5', '6', '7'];
  const ROBE_GB = ['1', '2', '3', '4', 'h', '5'];
  const LEATHER = ['a', 'b', 'c', 'd', 'e'];
  const HAIR_DK = ['0', '1', '2', '3', '4'];
  const IRON = ['0', '1', '2', '3', '4', '5', '6', '7'];
  const GHOST = ['s', 't', 'u', 'v', 'w', 'x', 'y'];
  const WAX = ['a', 'c', 'e', 'f', 'g', '9'];
  const WINE = ['0', 'F', 'G', 'H', 'I'];
  const OLIVE = ['z', 'A', 'B', 'C', 'D'];
  const BLACK = ['0', '1', '2', 'P', '3', 'R'];
  const EARTH = ['0', 'a', 'b', 'c', 'd'];
  const BRASS = ['a', 'J', 'K', 'L', 'M'];

  // ================================================================ LINNET
  // 0: dry, neutral — a grey hand holding her snuffer. 1: softer, grieving — the grey hand at her collar.
  function linnet(g, i) {
    const t = i === 1 ? 1 : 0; // grieving: head bowed a little
    // robe and the stained leather bib of her apron
    sPoly(g, [[2, 47], [5, 41], [12, 37], [20, 35], [28, 35], [36, 37], [43, 41], [46, 47]], ROBE_GB, { r: 5, grad: 0.35, fall: 0.5 });
    sPoly(g, [[18, 42], [30, 42], [31, 47], [17, 47]], LEATHER, { r: 2, grad: 0.3, bias: -0.12 });
    pts(g, [[20, 44, 'f'], [21, 45, 'g'], [27, 45, 'e'], [24, 47, 'e'], [19, 46, 'a'], [26, 43, 'b']]);
    // neck in the shadow of the jaw
    sPoly(g, [[20, 30], [28, 30], [28, 38], [20, 38]], SKIN, { r: 2, bias: -0.3 });
    // hood-scarf: wraps the head, drapes to the shoulders, knotted at the throat
    const hood = mask();
    hood.ellipse(24, 19, 14, 15, 'x');
    hood.poly([[10, 22], [38, 22], [41, 39], [31, 41], [24, 37], [17, 41], [7, 39]], 'x');
    shade(g, hood, WOOL, { r: 5, grad: 0.42, bias: 0.02 });
    // the opening of the hood: a dark rim, then her face
    const rim = mask(); rim.ellipse(24, 22 + t, 9.5, 11.5, 'x');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rim.get(x, y)) g.px(x, y, '1');
    const fm = mask(); fm.ellipse(24, 23 + t, 8.5, 10.5, 'x');
    shade(g, fm, SKIN, { r: 3, k: 2, grad: 0.5, bias: 0.16, pivot: 0.4, crisp: 3 });
    // dark hair, parted and pulled back under the scarf; loose strands at the temple
    st(g, 15, 11 + t, [
      '....11122222211....',
      '..1122233322222211.',
      '.12233.....2222211.',
      '1223........222211.',
      '122..........22211.',
      '12............2211.',
      '12.............211.',
      '1..............211.',
      '1...............11.',
      '................1..',
    ]);
    // brows, eyes (tired, heavy-lidded), a lean nose, a thin mouth
    const E = { L: '1', l: 'b', W: '7', w: 'h', I: '2', G: '8', S: 'h', s: 'b', B: '2', H: 'j', K: 'h', D: 'b' };
    if (i === 0) {
      st(g, 17, 17, [
        '.BBBB......BBB.',
        'B.............B',
        '...............',
        '.LLLL.....LLLL.',
        '.lWIIW...lwIIw.',
        '..SSS.....sss..',
      ], E);
      pts(g, [[20, 21, '8']]);
      st(g, 23, 23, ['.H.', '.HK', '.HK', '.HK', 'HjK', 'KhD'], E);
      st(g, 21, 30, ['.KKKKK.', '..jjj..'], E);
      pts(g, [[27, 30, 'b'], [21, 31, 'i']]);
    } else {
      st(g, 17, 18, [
        '...BBB...BBB...',
        '.BB.........BB.',
        '...............',
        '.LLLL.....LLLL.',
        '.lSIIS...lsIIs.',
        '..WSS.....sss..',
      ], E);
      pts(g, [[20, 22, '8'], [19, 23, '8']]);
      st(g, 23, 24, ['.H.', '.HK', '.HK', '.HK', 'HjK', 'KhD'], E);
      st(g, 21, 31, ['..KKK..', '.K...D.', '..jj...'], E);
    }
    // hollow under the cheekbone on the lit side
    pts(g, [[18, 27 + t, 'i'], [18, 28 + t, 'h'], [19, 29 + t, 'h']]);
    // the grey hand
    if (i === 0) {
      // a stub of her own tallow held up in a grey hand; its small light on her fingers
      st(g, 9, 26, [
        '...k...',
        '..lol..',
        '.kopok.',
        '.lpqpl.',
        '..opo..',
        '...1...',
        '..9gf..',
        '..9gf..',
        '..gfe..',
        '..gfe..',
      ]);
      st(g, 7, 36, [
        '..OOOO3..',
        '.O8OONN3.',
        'O8ONNNNN3',
        'OONN3NNN3',
        '.ONNNN33.',
        '..ONNN3..',
        '..NNN33..',
        '..NN333..',
        '.3NN33...',
        '.33333...',
        '.3333....',
        '.333.....',
      ]);
    } else {
      // raised to her collar, clutching the scarf at the throat
      sMask(g, (m) => { m.rect(18, 35, 11, 6, 'x'); m.rect(19, 41, 9, 7, 'x'); }, GREY_SKIN, { r: 2, grad: 0.5, bias: 0.15 });
      st(g, 18, 35, [
        '.OO.ON.NN.3',
        'O8N3ON3NN33',
        'ONN3NN3NN3N',
        'OONNNNNNNN3',
        '.ONNNNNNN33',
        '..ONNNNN33.',
      ]);
      // her rolled sleeve; above it the forearm is her own colour — the grey stops at the wrist
      sPoly(g, [[16, 47], [18, 44], [29, 44], [31, 47]], WOOL, { r: 2, bias: -0.05 });
      st(g, 19, 41, ['.NNNN33.', '.iiihhb.', '.hhhhbb.']);
    }
    finishLiving(g);
  }
  art.portrait('linnet', { w: W, h: H, count: 2, draw: linnet });

  // ================================================================ MOUND
  // A hill of packed grave-earth with two lantern lights in it. Lilies grow from his shoulder.
  function mound(g) {
    const body = mask();
    body.ellipse(24, 48, 25, 13, 'x'); body.ellipse(11, 33, 10, 11, 'x'); body.ellipse(37, 35, 10, 10, 'x');
    body.ellipse(24, 31, 13, 11, 'x');
    shade(g, body, ['0', 'a', 'b', '3', 'c', '4'], { r: 6, grad: 0.35, bias: 0.04, fall: 0.3 });
    // packed ash crusted on the upper surfaces, stones, clods
    const R = g.rnd(301);
    for (let y = 16; y < H; y++) for (let x = 0; x < W; x++) {
      const c = g.get(x, y); if (c == null) continue;
      const r = R();
      if (r < 0.16 && y < 40 && (c === 'c' || c === '4')) g.px(x, y, r < 0.06 ? '6' : '5');
      else if (r > 0.93) g.px(x, y, 'a');
      else if (r > 0.88 && c === 'b') g.px(x, y, 'c');
    }
    // the head: a heavier lump sunk between the shoulders, a hollow where a face was
    sEll(g, 24, 26, 10, 9, ['0', 'a', 'b', 'c', 'c', 'd'], { r: 4, grad: 0.4, bias: 0.05 });
    const hollow = mask(); hollow.ellipse(24, 28, 7, 4, 'x');
    shade(g, hollow, ['0', '0', '1', 'a'], { r: 2, grad: -0.3 });
    // brow ridge catching the light
    st(g, 15, 22, ['.dd.cc.', 'dccbbb.', '.bb....'], null);
    st(g, 28, 22, ['..cc.b.', '.bbbba.', '....aa.'], null);
    // lantern eyes and the warm spill around them
    st(g, 17, 26, [
      '.klk.',
      'lopol',
      'kpqpk',
      '.lnl.',
    ]);
    st(g, 26, 26, [
      '.klk.',
      'lopol',
      'kpqpk',
      '.lnl.',
    ]);
    pts(g, [[16, 28, 'k'], [22, 28, 'k'], [25, 28, 'k'], [31, 28, 'k'], [19, 31, 'k'], [28, 31, 'k']]);
    // roots tangled over him, hanging
    g.line(5, 34, 12, 40, 'c'); g.line(12, 40, 11, 47, 'b'); g.line(38, 30, 34, 38, 'c'); g.line(34, 38, 37, 46, 'b');
    g.line(20, 38, 28, 40, 'c'); g.line(15, 33, 18, 37, 'd'); pts(g, [[5, 34, 'd'], [38, 30, 'd'], [20, 38, 'd']]);
    // grave-lilies growing out of his left shoulder, nodding
    g.line(8, 24, 7, 17, 'B'); g.line(11, 24, 13, 16, 'C'); g.line(14, 25, 17, 20, 'B'); g.line(5, 26, 3, 20, 'A');
    const lily = (x, y, f) => st(g, x, y, f ? ['.9y.', '98y9', '.87.', '..C.'] : ['.y9.', '9y89', '.78.', '.C..']);
    lily(5, 13, 0); lily(11, 12, 1); lily(15, 17, 0); lily(1, 17, 1);
    pts(g, [[7, 20, 'D'], [12, 20, 'D'], [15, 22, 'C'], [6, 24, 'C'], [9, 23, 'D']]);
    finishLiving(g);
    // eyes burn through the outline
    pts(g, [[19, 28, 'q'], [28, 28, 'q']]);
  }
  art.portrait('mound', { w: W, h: H, count: 1, draw: mound });

  // ================================================================ POSY — the small ghost
  function posy(g) {
    sPoly(g, [[9, 47], [13, 40], [19, 37], [29, 37], [35, 40], [39, 47]], GHOST, { r: 4, grad: 0.45, bias: 0.05 });
    // nightdress collar, a ruffle
    st(g, 17, 36, ['.xyx.xyx.xyx.', 'wxwxwxwxwxwxw']);
    sPoly(g, [[21, 30], [27, 30], [27, 37], [21, 37]], GHOST, { r: 2, bias: -0.2 });
    // hair, then the round face
    sEll(g, 24, 20, 12, 12, ['s', 't', 'u', 'v', 'w'], { r: 5, grad: 0.4, bias: 0.05 });
    sEll(g, 24, 24, 9, 9.5, GHOST, { r: 4, grad: 0.4, bias: 0.2, crisp: 3 });
    // fringe, a small plait at each side
    st(g, 14, 12, [
      '....uvvwwwvvu.....',
      '..uvwwxwwwvvvuu...',
      '.uvwx..wwv.vvvuu..',
      'uvw.....v....vvut.',
      'uv............uut.',
    ]);
    st(g, 12, 25, ['vw', 'uv', 'vw', 'uv', '.t']); st(g, 34, 25, ['uv', 'tu', 'uv', 'tu', 't.']);
    // big dark eyes that do not quite see you; a small mouth
    feat(g, {
      map: { L: 't', W: 'u', w: 't', I: 's', G: 'y', S: 'w', s: 'v', B: 'v', H: 'y', M: 'w', K: 'u', D: 'v', T: 'y' },
      eyes: 'stare', brows: 'sad', browDy: 0, mouth: 'small', mouthY: 30, noseRows: ['.x.', 'xw.', '...'],
    });
    st(g, 18, 19, ['.uu.', 'uyst', 'usst', '.tt.']);
    st(g, 27, 19, ['.uu.', 'txsu', 'tssu', '.tt.']);
    // the loose string at her neck where the tag used to hang
    pts(g, [[23, 33, 'u'], [23, 34, 'u'], [24, 35, 'u'], [24, 36, 't'], [24, 37, 't'], [23, 38, 't'], [23, 39, 'u'], [24, 40, 'u']]);
    finishGhost(g, 38);
  }
  art.portrait('posy', { w: W, h: H, count: 1, draw: posy });

  // ================================================================ THE SNUFFER
  function snuffer(g) {
    // black vestments, a high stiff collar
    sPoly(g, [[1, 47], [4, 39], [13, 34], [35, 34], [44, 39], [47, 47]], BLACK, { r: 5, grad: 0.35, bias: 0.05 });
    for (let y = 36; y < H; y += 3) g.px(24, y, '5');
    // a high stiff collar and a neck as thin as a rod
    sPoly(g, [[18, 33], [30, 33], [32, 38], [16, 38]], ['2', '4', '6', '7', '8', '9'], { r: 2, grad: 0.6, bias: 0.05 });
    for (let y = 26; y <= 34; y++) { g.px(23, y, y % 4 ? '3' : '4'); g.px(24, y, '1'); }
    // the snuffer-cone, open end down: blackened iron, a finial
    const cone = mask();
    cone.poly([[23, 4], [25, 4], [28, 10], [32, 17], [36, 24], [37, 27], [11, 27], [12, 24], [16, 17], [20, 10]], 'x');
    shade(g, cone, IRON, { r: 3, k: 3, grad: 0.8, bias: -0.2, pivot: 0.3, crisp: 3.2 });
    sEll(g, 24, 3, 1.5, 1.5, IRON, { r: 1, grad: 0.8, bias: 0.1 });
    // the mouth of the cone: a lip of iron and the hollow inside, where a face ought to be
    const mouth = mask(); mouth.ellipse(24, 27, 13, 3, 'x');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mouth.get(x, y)) g.px(x, y, y <= 25 ? (x < 18 ? '5' : x < 27 ? '3' : '2') : '0');
    pts(g, [[11, 27, '6'], [12, 26, '6'], [12, 28, '4'], [13, 29, '3'], [36, 28, '1'], [23, 29, '1'], [24, 29, '1'], [23, 28, '2']]);
    // cold light down the left flank, soot, a pinprick glint
    for (let y = 8; y <= 26; y++) { const x = Math.round(22 - (y - 4) * 0.47); on(g, x, y, y % 5 === 0 ? '7' : '6'); on(g, x + 1, y, '4'); }
    pts(g, [[21, 9, '7'], [26, 15, '1'], [29, 19, '1'], [23, 17, '1'], [31, 22, '1'], [27, 22, '0']]);
    // a thread of smoke, as if something has just been put out
    pts(g, [[24, 1, '4'], [25, 0, '3'], [23, 2, '3']]);
    // a long pale hand raised, forefinger and thumb pinched together
    st(g, 2, 21, [
      '......7.....',
      '.....787....',
      '.....7.7....',
      '....87.6....',
      '....7..6....',
      '....7..6....',
      '...87.66....',
      '...7..6.....',
      '...7.66.....',
      '..8766......',
      '..87766.....',
      '.8787765....',
      '.87877765...',
      '.788777665..',
      '..7877665...',
      '..6776665...',
      '...77665....',
      '...67655....',
      '...22555....',
      '..222222....',
      '.2222222....',
      '22222222....',
      '2222222.....',
      '222222......',
      '22222.......',
      '2222........',
      '222.........',
    ]);
    finishLiving(g);
  }
  art.portrait('snuffer', { w: W, h: H, count: 1, draw: snuffer });

  // ================================================================ FENWICK — 0: grin, 1: afraid
  function fenwick(g, i) {
    // olive pilgrim's cloak, pack straps, his pack looming behind one shoulder
    sPoly(g, [[35, 20], [46, 22], [47, 40], [36, 40]], ['1', '2', '3', '4', '5'], { r: 3, bias: -0.1 });
    st(g, 37, 16, ['.lnnl.', 'lnmmnl', 'kmmllk', '.kllk.'], null);
    st(g, 41, 24, ['K.K.K', 'KKKKK', 'K.K.K', 'JJJJJ'], null);
    sPoly(g, [[2, 47], [5, 40], [13, 36], [35, 36], [43, 40], [46, 47]], OLIVE, { r: 5, grad: 0.35 });
    g.line(15, 37, 11, 47, 'c'); g.line(16, 37, 12, 47, 'b'); g.line(33, 37, 37, 47, 'b'); g.line(32, 37, 36, 47, 'a');
    sPoly(g, [[19, 32], [29, 32], [30, 38], [18, 38]], SKIN, { r: 2, bias: -0.2 });
    // round, well-fed face
    sEll(g, 24, 25, 10.5, 10.5, SKIN, { r: 4, grad: 0.4, bias: 0.2, crisp: 3 });
    // the wide-brimmed hat and its badges
    sPoly(g, [[15, 14], [17, 3], [31, 3], [33, 14]], LEATHER, { r: 3, grad: 0.45, bias: -0.08 });
    for (let x = 16; x <= 32; x++) { g.px(x, 11, 'a'); g.px(x, 12, 'b'); }
    sEll(g, 24, 15, 22, 3.5, ['a', 'b', 'c', 'd'], { r: 2, grad: 0.4, bias: 0.05 });
    st(g, 18, 6, ['.99.', '9889', '.98.'], null);
    st(g, 27, 7, ['ML', 'LK'], null); pts(g, [[23, 8, '7'], [22, 9, '6'], [24, 9, '6'], [23, 10, '5']]);
    // brim shadow across the brow
    for (let x = 15; x <= 33; x++) { const c = g.get(x, 19); if (c === 'i' || c === 'j') g.px(x, 19, 'h'); }
    const M = { L: 'a', W: '8', w: '7', I: '1', G: '9', S: 'h', s: 'b', B: 'b', H: 'j', M: 'i', K: 'a', D: 'H', T: '9' };
    if (i === 0) {
      feat(g, { map: M, eyes: 'happy', brows: 'raised', browDy: -1, mouth: 'grin', eyeY: 23, mouthY: 30 });
      pts(g, [[16, 27, 'I'], [17, 27, 'j'], [31, 27, 'H'], [17, 28, 'I']]);
    } else {
      feat(g, { map: M, eyes: 'wide', brows: 'sad', browDy: -1, mouth: 'open', eyeY: 23, mouthY: 30 });
      // cold sweat at the temple
      pts(g, [[33, 22, 'x'], [33, 23, 'w'], [32, 24, 'v']]);
    }
    finishLiving(g);
  }
  art.portrait('fenwick', { w: W, h: H, count: 2, draw: fenwick });

  // ================================================================ HESK — 0: gruff, 1: grieving
  function hesk(g, i) {
    // battered brigandine: wine cloth, brass rivets; a padded collar
    sPoly(g, [[1, 47], [4, 39], [13, 35], [35, 35], [44, 39], [47, 47]], WINE, { r: 5, grad: 0.35, bias: 0.05 });
    for (let y = 38; y < H; y += 3) for (let x = 3 + (y % 2) * 2; x < 46; x += 4) on(g, x, y, x < 22 ? 'L' : 'K');
    sPoly(g, [[16, 32], [32, 32], [34, 37], [14, 37]], LEATHER, { r: 2, bias: -0.05 });
    sPoly(g, [[20, 30], [28, 30], [28, 35], [20, 35]], SKIN, { r: 2, bias: -0.3 });
    // weathered face
    sEll(g, 24, 24, 9.5, 10.5, SKIN, { r: 3, grad: 0.45, bias: 0.18, crisp: 3 });
    // grey stubble over the jaw and lip
    const R = g.rnd(71);
    for (let y = 26; y <= 35; y++) for (let x = 14; x <= 34; x++) {
      const c = g.get(x, y); if (c == null || 'hij'.indexOf(c) < 0) continue;
      const dx = Math.abs(x - 24);
      if (y < 29 && dx < 5) continue;
      const r = R();
      if (r < 0.2) g.px(x, y, x < 25 ? (r < 0.07 ? '6' : 'h') : (r < 0.07 ? '4' : 'b'));
    }
    // grey hair tufts under the helm
    st(g, 14, 16, ['66', '65', '5.', '4.']); st(g, 33, 16, ['43', '32', '2.']);
    // dented kettle helm with a wide brim
    sMask(g, (m) => { m.ellipse(24, 12, 11, 9, 'x'); m.rect(0, 15, W, H, null); }, IRON, { r: 3, grad: 0.5, bias: 0.08 });
    sEll(g, 24, 15, 20, 3.5, IRON, { r: 2, grad: 0.5, bias: 0.05 });
    for (let x = 6; x <= 42; x++) if (g.get(x, 17)) g.px(x, 17, x < 20 ? '3' : '1');
    // the dent, a crease of light; rivets
    pts(g, [[27, 6, '2'], [28, 7, '2'], [29, 8, '3'], [26, 6, '6'], [27, 7, '5'], [16, 13, '7'], [20, 14, '6'], [28, 14, '3'], [32, 14, '2'], [18, 5, '6']]);
    // brim shadow over the eyes
    for (let x = 15; x <= 33; x++) { const c = g.get(x, 18); if (c && 'hij'.indexOf(c) >= 0) g.px(x, 18, x < 24 ? 'h' : 'b'); }
    const M = { L: 'a', W: '7', w: 'h', I: '1', G: '8', S: 'h', s: 'b', B: '3', H: 'j', M: 'i', K: 'a', D: 'b', T: '8' };
    // a nose broken twice
    const nose = ['.H.', '.HK', 'HK.', '.HK', 'HMK', 'KDK'];
    if (i === 0) feat(g, { map: M, eyes: 'open', brows: 'angry', mouth: 'frown', eyeY: 22, mouthY: 31, noseRows: nose });
    else {
      feat(g, { map: M, eyes: 'down', brows: 'sad', mouth: 'tight', eyeY: 22, mouthY: 31, noseRows: nose });
      pts(g, [[20, 23, '8'], [19, 25, 'x']]);
    }
    // a scar through the left brow
    pts(g, [[18, 17, 'j'], [19, 19, 'j'], [19, 20, 'i']]);
    finishLiving(g);
  }
  art.portrait('hesk', { w: W, h: H, count: 2, draw: hesk });

  // ================================================================ more toolkit
  function fill(g, m, c) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m.get(x, y) != null) g.px(x, y, c); }
  // Dithered speckle over painted pixels inside a box (stubble, scorch, soot).
  function speckle(g, x0, y0, x1, y1, seed, dens, fn) {
    const R = g.rnd(seed);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const c = g.get(x, y); if (c == null) continue;
      const r = R(); if (r < dens) { const n = fn(c, x, y, r); if (n !== undefined) g.px(x, y, n); }
    }
  }
  // Ghost feature colours: dark eyes, pale lids, a faint mouth.
  const GMAP = { L: 's', W: 'w', w: 'u', I: 's', G: 'y', S: 'v', s: 'u', B: 't', H: 'y', M: 'w', K: 't', D: 's', T: 'x' };
  const GHAIR = ['s', 't', 'u', 'v', 'w'];
  const GCLOTH = ['t', 'u', 'v', 'w', 'x'];
  // A plain ghost's shoulders and neck.
  function ghostBody(g, bias) {
    sPoly(g, [[2, 47], [5, 40], [14, 35], [34, 35], [43, 40], [46, 47]], GHOST, { r: 5, grad: 0.45, bias: bias || -0.08 });
    sPoly(g, [[20, 30], [28, 30], [28, 37], [20, 37]], GHOST, { r: 2, bias: -0.25 });
  }

  // ================================================================ OLD MAUD — ghost widow, waiting for Aldo
  function maud(g) {
    // a knitted shawl over a dark dress, crossed on the chest
    ghostBody(g, -0.1);
    for (let y = 39; y < H; y += 2) for (let x = 3 + (y % 4); x < 46; x += 4) on(g, x, y, x < 22 ? 'w' : 'u');
    g.line(11, 38, 25, 47, 'x'); g.line(12, 38, 26, 47, 'w'); g.line(37, 38, 24, 47, 't');
    // head-kerchief, sprigged, knotted under the chin
    const k = mask(); k.ellipse(24, 19, 12, 12.5, 'x'); k.poly([[12, 20], [36, 20], [34, 33], [24, 37], [14, 33]], 'x');
    shade(g, k, GCLOTH, { r: 5, grad: 0.5, bias: 0.02 });
    for (let y = 7; y < 37; y++) for (let x = 11; x < 38; x++) {
      const c = g.get(x, y); if (c && (x * 3 + y * 5) % 11 === 0) g.px(x, y, c === 'x' || c === 'w' ? 'y' : 'w');
    }
    const rim = mask(); rim.ellipse(24, 23.5, 8.5, 10, 'x'); fill(g, rim, 't');
    const fm = mask(); fm.ellipse(24, 24, 7.5, 9, 'x');
    shade(g, fm, GHOST, { r: 3, k: 2, grad: 0.5, bias: 0.2, crisp: 3 });
    st(g, 20, 33, ['.vwxw.', 'vwyxwv', '.uvwu.', '.t..t.', 't....t']);
    // old eyes turned to the door; a mouth pressed thin
    feat(g, { map: GMAP, eyes: 'side', brows: 'sad', mouth: 'flat', eyeY: 22, mouthY: 30, noseRows: ['.H.', '.HK', '.HK', 'HMK', 'KDK'] });
    // age: crow's feet, the folds beside the mouth, hollow cheeks, lines under the kerchief
    pts(g, [[16, 20, 'v'], [16, 23, 'v'], [32, 20, 'u'], [32, 23, 'u'], [19, 28, 'v'], [19, 29, 'v'], [20, 30, 'v'],
      [29, 28, 'u'], [29, 29, 'u'], [28, 30, 'u'], [18, 26, 'w'], [30, 26, 'v'], [20, 16, 'w'], [21, 16, 'w'], [22, 16, 'w'],
      [26, 16, 'v'], [27, 16, 'v'], [22, 32, 'v'], [26, 32, 'u']]);
    finishGhost(g, 40);
  }
  art.portrait('maud', { w: W, h: H, count: 1, draw: maud });

  // ================================================================ QUEEN YSOLDE — 0: distant, 1: lucid and terrible
  function queen(g, i) {
    const L = i === 1;
    // the gown: bare shoulders, a jewelled neckline, a pendant
    sPoly(g, [[3, 47], [7, 40], [15, 36], [33, 36], [41, 40], [45, 47]], GHOST, { r: 5, grad: 0.4, bias: 0.04 });
    sPoly(g, [[5, 47], [9, 42], [17, 40], [31, 40], [39, 42], [43, 47]], ['s', 't', 'u', 'v'], { r: 4, grad: 0.45, bias: 0.02 });
    for (let x = 9; x <= 39; x += 2) on(g, x, Math.round(40 + Math.abs(x - 24) * 0.14), x < 24 ? 'y' : 'w');
    st(g, 23, 41, ['.y.', 'yxw', '.v.']);
    sPoly(g, [[21, 29], [27, 29], [27, 37], [21, 37]], GHOST, { r: 2, bias: -0.2 });
    // long dark hair, loose to the shoulders; when she is lucid it lifts as if in a hot wind
    const hair = mask();
    hair.ellipse(24, 19, 11.5, 12.5, 'x');
    if (L) { hair.poly([[14, 14], [3, 22], [5, 42], [18, 36]], 'x'); hair.poly([[34, 14], [45, 22], [43, 42], [30, 36]], 'x'); }
    else { hair.poly([[14, 16], [11, 30], [12, 44], [19, 36]], 'x'); hair.poly([[34, 16], [37, 30], [36, 44], [29, 36]], 'x'); }
    shade(g, hair, ['s', 't', 'u', 'v'], { r: 4, grad: 0.45, bias: L ? 0.08 : 0 });
    for (let y = 14; y < H; y++) for (let x = 0; x < W; x++) {
      const c = g.get(x, y); if (!c || !hair.get(x, y)) continue;
      const sx = L ? x + Math.round((y - 14) * (x < 24 ? 0.35 : -0.35)) : x;
      if (sx % 3 === 0) g.px(x, y, c === 'v' ? 'u' : c === 'u' ? 't' : 's');
      else if (sx % 3 === 1 && c === 'u' && x < 24) g.px(x, y, 'v');
    }
    // a long face, fine-boned
    sEll(g, 24, 22, 7.5, 9.5, GHOST, { r: 3, grad: 0.45, bias: L ? 0.3 : 0.18, crisp: 3 });
    st(g, 16, 11, [
      '......tuuuut......',
      '....tuvvu.uuut....',
      '..tuvvu......uut..',
      '.tuv...........ut.',
      '.tu.............t.',
    ]);
    // the circlet: dull gold gone faint
    for (let x = 16; x <= 32; x++) on(g, x, 14, x < 22 ? 'L' : x < 28 ? 'K' : 'J');
    pts(g, [[18, 13, 'L'], [24, 12, 'M'], [24, 13, 'L'], [30, 13, 'K'], [24, 14, 'y']]);
    if (!L) {
      // she is looking at something that was here nineteen years ago
      feat(g, { map: GMAP, eyes: 'tired', brows: 'flat', mouth: 'small', eyeY: 21, mouthY: 29, noseRows: ['.H.', '.HK', '.HK', 'HMK', '.K.'] });
    } else {
      // she sees him, all at once
      const M = Object.assign({}, GMAP, { W: 's', w: 's', I: 'y', L: 's', S: 't', s: 's', B: 't' });
      feat(g, { map: M, eyes: 'stare', brows: 'angry', mouth: 'tight', eyeY: 21, mouthY: 29, noseRows: ['.H.', '.HK', '.HK', 'HMK', '.K.'] });
      // grief running down in dark lines
      pts(g, [[19, 23, 't'], [19, 24, 't'], [19, 25, 'u'], [18, 26, 'u'], [29, 23, 's'], [29, 24, 't'], [29, 25, 't'], [30, 26, 'u']]);
      pts(g, [[4, 20, 'w'], [44, 21, 'v'], [6, 15, 'v'], [42, 14, 'u']]);
    }
    finishGhost(g, 41);
  }
  art.portrait('queen', { w: W, h: H, count: 2, draw: queen });

  // ================================================================ ARCHCHANDLER ORMUND — half-melted into his own wax
  function ormund(g) {
    // wine vestments, a gold-worked stole
    sPoly(g, [[1, 47], [4, 38], [13, 34], [35, 34], [44, 38], [47, 47]], WINE, { r: 5, grad: 0.35, bias: 0.05 });
    sPoly(g, [[14, 35], [19, 35], [18, 47], [12, 47]], BRASS, { r: 2, grad: 0.4, bias: 0.05 });
    sPoly(g, [[29, 35], [34, 35], [36, 47], [30, 47]], BRASS, { r: 2, grad: 0.4, bias: -0.1 });
    st(g, 14, 39, ['.M.', 'MLM', '.M.', '.L.']); st(g, 31, 39, ['.L.', 'LKL', '.L.', '.K.']);
    // the heavy head, bald, jowls sunk onto the collar
    sEll(g, 24, 30, 10, 5, SKIN, { r: 3, grad: 0.5, bias: 0.0 });
    sEll(g, 24, 21, 10, 12, SKIN, { r: 4, grad: 0.5, bias: 0.14, crisp: 3 });
    g.line(17, 33, 31, 33, 'h');
    pts(g, [[18, 12, 'j'], [19, 11, 'j'], [20, 11, 'j'], [17, 13, 'j']]);
    // wax: cream, glossy, poured — a rivulet is a 2px run ending in a round bead
    const WX = ['d', 'e', 'f', 'g', '9'];
    const wx = mask();
    const run = (x, y0, y1, bead) => { wx.rect(x, y0, 2, y1 - y0, 'x'); if (bead) wx.ellipse(x + 0.5, y1, 1.5, 1.5, 'x'); };
    for (const [x, y] of [[15.5, 9], [20.5, 8], [26.5, 8]]) wx.ellipse(x, y, 2.5, 1, 'x');
    run(15, 9, 16, true); run(20, 8, 13, true); run(23, 9, 11, true);
    // it has run down over the right of his face and taken the eye
    wx.poly([[27, 9], [32, 10], [32, 18], [31, 25], [29, 28], [26, 24], [25, 15]], 'x');
    run(27, 26, 33, true); run(30, 24, 29, true);
    shade(g, wx, WX, { r: 2, k: 3, grad: 0.5, bias: 0.16, crisp: 3.2 });
    // shoulders heaped with it, running down the robe
    const ws = mask();
    ws.ellipse(9, 36, 9, 3, 'x'); ws.ellipse(39, 36, 9, 3, 'x');
    for (const [x, l] of [[3, 6], [8, 9], [13, 4], [35, 7], [40, 10], [44, 5]]) { ws.rect(x, 36, 2, l, 'x'); ws.ellipse(x + 0.5, 36 + l, 1.5, 1.2, 'x'); }
    shade(g, ws, WX, { r: 2, k: 3, grad: 0.5, bias: 0.14, crisp: 3.2 });
    // gloss on the wax
    pts(g, [[15, 12, '9'], [19, 12, '9'], [27, 12, '9'], [28, 15, 'g'], [4, 36, '9'], [5, 35, '9'], [8, 40, '9'], [35, 35, 'g'], [16, 18, '9']]);
    // wicks left in the wax like hair
    for (const [x, y, l] of [[17, 15, 3], [32, 20, 4], [31, 31, 3], [6, 38, 4], [42, 39, 4]]) g.line(x, y, x, y + l, '1');
    // candles stood on his crown, lit, each in its own puddle
    for (const [x, y, h] of [[15, 5, 4], [20, 2, 6], [26, 3, 5], [31, 6, 3]]) {
      g.rect(x, y, 2, h, 'g'); for (let j = 0; j < h; j++) g.px(x + 1, y + j, j ? 'e' : 'f');
      g.px(x, y - 1, '1');
      st(g, x - 1, y - 5, ['.n..', '.on.', 'npo.', '.qp.']);
    }
    // the eye he has left: heavy-lidded, looking down on you; a pious little smile
    const M = { L: 'a', W: '8', w: '7', I: '1', G: '9', S: 'h', s: 'b', B: 'b', H: 'j', M: 'i', K: 'a', D: 'H', T: '9' };
    st(g, 17, 20, ['BBBBB', '.....', 'LLLLL', '.LWII', '..SSS'], M);
    st(g, 23, 23, ['.H.', '.HK', '.HK', 'HMK', 'KDK'], M);
    st(g, 20, 30, ['K.....', '.KKKK.', '..HH..'], M);
    pts(g, [[18, 27, 'j'], [17, 28, 'i'], [22, 29, 'h']]);
    finishLiving(g);
  }
  art.portrait('ormund', { w: W, h: H, count: 1, draw: ormund });

  // ================================================================ NURSE AGNA — waning, kind, tired
  function agna(g) {
    ghostBody(g, -0.08);
    // apron bib and its straps
    sPoly(g, [[17, 39], [31, 39], [32, 47], [16, 47]], ['v', 'w', 'x', 'y'], { r: 2, grad: 0.4, bias: 0.05 });
    g.line(17, 39, 14, 36, 'x'); g.line(31, 39, 34, 36, 'w');
    // the coif and wimple: close linen framing the face, a band at the brow, folds at the throat
    const c = mask(); c.ellipse(24, 20, 11, 12, 'x'); c.poly([[13, 22], [35, 22], [34, 37], [24, 40], [14, 37]], 'x');
    shade(g, c, ['u', 'v', 'w', 'x', 'y'], { r: 4, grad: 0.45, bias: 0.08 });
    for (const y of [34, 36, 38]) for (let x = 17; x <= 31; x++) if (c.get(x, y) && Math.abs(x - 24) < 7 - (38 - y) / 2) g.px(x, y, x < 24 ? 'v' : 'u');
    const rim = mask(); rim.ellipse(24, 24, 8, 9.5, 'x'); fill(g, rim, 'u');
    const fm = mask(); fm.ellipse(24, 24.5, 7, 8.5, 'x');
    shade(g, fm, GHOST, { r: 3, k: 2, grad: 0.5, bias: 0.14, crisp: 3 });
    for (let x = 16; x <= 32; x++) { on(g, x, 15, x < 24 ? 'y' : 'w'); on(g, x, 16, 'v'); }
    // eyes lowered to the cot; a small tired mouth
    feat(g, { map: GMAP, eyes: 'down', brows: 'sad', mouth: 'small', eyeY: 22, mouthY: 30 });
    pts(g, [[18, 24, 'v'], [19, 25, 'v'], [30, 24, 'u'], [29, 25, 'u'], [20, 28, 'w'], [28, 28, 'v']]);
    finishGhost(g, 35);
  }
  art.portrait('agna', { w: W, h: H, count: 1, draw: agna });

  // ================================================================ SER ODO VARR — 0: in his burned, fused helm; 1: helm torn off
  const SCORCH = ['0', '1', '2', 'b', '3', '4', '5', '6'];
  function odoArmour(g) {
    // burned plate: pauldrons, breastplate, fused at the seams
    sPoly(g, [[1, 47], [3, 39], [11, 34], [37, 34], [45, 39], [47, 47]], SCORCH, { r: 5, grad: 0.5, bias: 0.04 });
    for (const y of [38, 41, 44]) { g.line(2, y, 13, y - 3, '2'); g.line(3, y + 1, 13, y - 2, '5'); g.line(35, y - 3, 46, y, '1'); }
    for (let y = 36; y < H; y++) on(g, 24, y, y % 3 ? '5' : '6');
    speckle(g, 0, 34, 47, 47, 311, 0.13, (c, x, y, r) => (r < 0.04 ? (x < 24 ? 'R' : 'Q') : r < 0.09 ? 'b' : 'a'));
    // ember still in the cracks
    pts(g, [[8, 43, 'l'], [9, 42, 'k'], [38, 40, 'k'], [39, 41, 'l'], [27, 45, 'k']]);
    // the shield welded to his arm, its boar scorched nearly black
    const sh = mask(); sh.poly([[1, 41], [13, 39], [15, 47], [2, 47]], 'x');
    shade(g, sh, ['F', 'G', 'H', 'I'], { r: 2, grad: 0.4, bias: -0.05 });
    g.line(1, 41, 13, 39, '6'); g.line(13, 39, 15, 47, '3');
    st(g, 5, 42, ['.aaa.', 'aaaaa', 'a.a.a'], null);
    speckle(g, 1, 39, 15, 47, 12, 0.18, () => 'a');
    // gorget
    sPoly(g, [[16, 31], [32, 31], [34, 36], [14, 36]], SCORCH, { r: 2, grad: 0.5, bias: 0.02 });
    g.line(16, 33, 32, 33, '2');
  }
  function odo(g, i) {
    odoArmour(g);
    if (i === 0) {
      // a flat-topped great helm, burned, fused to the gorget; the right eye-slit melted shut
      const hm = mask(); hm.poly([[14, 8], [18, 5], [30, 5], [34, 8], [35, 30], [31, 33], [17, 33], [13, 30]], 'x');
      shade(g, hm, SCORCH, { r: 3, k: 2.6, grad: 0.6, bias: 0.06, crisp: 3 });
      g.line(14, 10, 34, 10, '2'); g.line(15, 11, 23, 11, '6');
      for (let y = 11; y <= 32; y++) { on(g, 24, y, y < 17 ? '6' : '5'); on(g, 25, y, '2'); }
      // the open slit, and a man's eye in the dark of it
      g.rect(15, 17, 9, 2, '0'); g.line(15, 16, 23, 16, '6'); g.line(15, 19, 23, 19, '3');
      pts(g, [[19, 17, 'j'], [20, 17, '9'], [19, 18, 'h'], [20, 18, 'i']]);
      // the right slit: a seam of fused metal that ran and set
      st(g, 26, 16, [
        '.45654...',
        '4655543..',
        '.3444332.',
        '..32.3...',
        '..3..2...',
        '..2......',
      ]);
      // breaths, dents, heat-colour round the burn, rust
      for (const [x, y] of [[27, 24], [29, 24], [31, 24], [28, 26], [30, 26], [32, 26], [29, 28], [31, 28]]) { g.px(x, y, '0'); g.px(x, y + 1, '4'); }
      pts(g, [[17, 23, '2'], [18, 24, '6'], [16, 13, '7'], [20, 7, '7'], [29, 13, 'Q'], [31, 15, 'R'], [33, 18, 'Q'], [32, 21, 'R'],
        [30, 20, 'b'], [21, 28, 'c'], [18, 29, 'b'], [33, 12, 'b'], [16, 26, 'c']]);
      // metal that ran down onto the gorget and set in drips
      for (const [x, l] of [[18, 3], [22, 2], [29, 4], [33, 2]]) for (let j = 0; j < l; j++) g.px(x, 33 + j, j === l - 1 ? '2' : '4');
    } else {
      // the helm torn off: cropped grey hair burned away in patches
      sEll(g, 24, 15, 10, 7, ['1', '2', '3', '4', '5', '6'], { r: 3, grad: 0.5, bias: 0.05 });
      sEll(g, 24, 23, 9.5, 10.5, SKIN, { r: 3, grad: 0.5, bias: 0.12, crisp: 3 });
      for (let x = 16; x <= 32; x++) for (let y = 12; y <= 15; y++) if (g.get(x, y) && ((x * 7 + y * 3) % 5 === 0)) g.px(x, y, x < 24 ? '6' : '4');
      // the burn: raw across the right cheek and brow, shiny scar on the left jaw, the ear half gone
      const burn = (cx, cy, rx, ry, seed) => {
        const R = g.rnd(seed);
        for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
          const c = g.get(x, y); if (!c || 'hij'.indexOf(c) < 0) continue;
          const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d > 1) continue;
          const r = R();
          g.px(x, y, d < 0.35 ? (r < 0.5 ? 'H' : 'G') : r < 0.35 ? 'I' : r < 0.7 ? 'H' : c === 'j' ? 'I' : 'h');
        }
      };
      burn(30, 19, 5, 6, 3); burn(18, 30, 3, 2, 4); burn(26, 13, 4, 2, 5);
      // grey stubble on what is left of the jaw
      speckle(g, 15, 26, 33, 34, 88, 0.26, (c, x) => ('hijIHG'.indexOf(c) >= 0 && Math.abs(x - 24) > 2 ? (x < 24 ? '6' : '4') : undefined));
      pts(g, [[33, 21, 'G'], [34, 22, 'F'], [34, 20, 'H']]);
      const M = { L: '0', W: '8', w: '6', I: '1', G: '9', S: 'h', s: 'G', B: '3', H: 'j', M: 'i', K: 'a', D: 'F', T: '8' };
      feat(g, { map: M, eyes: 'stare', brows: 'angry', mouth: 'snarl', eyeY: 22, mouthY: 29 });
      // a scar down across the nose
      pts(g, [[21, 19, 'I'], [22, 20, 'I'], [23, 22, 'H'], [25, 24, 'I']]);
    }
    finishLiving(g);
  }
  art.portrait('odo', { w: W, h: H, count: 2, draw: odo });

  // ================================================================ BROTHER ANSELM — drowned prior, still writing
  function anselm(g) {
    ghostBody(g, -0.1);
    // the cowl down, heaped round his shoulders
    const cw = mask(); cw.ellipse(24, 37, 15, 5, 'x'); cw.ellipse(24, 34, 9, 3, null);
    shade(g, cw, GCLOTH, { r: 3, grad: 0.5, bias: 0.02 });
    g.line(12, 38, 18, 41, 'u'); g.line(30, 41, 36, 38, 't'); g.line(20, 41, 28, 41, 'u');
    // a round, mild head: the tonsure, wet hair plastered to it
    sEll(g, 24, 21, 9, 12, GHOST, { r: 3, grad: 0.5, bias: 0.16, crisp: 3 });
    // the ring of the tonsure, wet and plastered down, strands stuck to the brow
    for (let y = 12; y < 26; y++) for (let x = 13; x <= 35; x++) {
      const c = g.get(x, y); if (!c) continue;
      const side = Math.abs(x - 24) >= 7;
      if ((y >= 12 && y <= 15) || (side && y <= 24)) g.px(x, y, x < 22 ? ((x + y) % 3 ? 'v' : 'u') : (x + y) % 3 ? 'u' : 't');
    }
    for (const [x, l] of [[18, 3], [21, 2], [26, 3], [29, 2]]) for (let j = 0; j < l; j++) g.px(x, 16 + j, x < 24 ? 'u' : 't');
    pts(g, [[18, 19, 'y'], [26, 19, 'x']]);
    // gentle, tired eyes; the ghost of a smile
    feat(g, { map: GMAP, eyes: 'tired', brows: 'raised', browDy: 0, mouth: 'small', eyeY: 22, mouthY: 30 });
    pts(g, [[21, 31, 'v'], [27, 30, 'v'], [17, 24, 'w'], [31, 24, 'u']]);
    // the water still coming off him
    pts(g, [[16, 22, 'y'], [16, 23, 'x'], [32, 22, 'w'], [23, 34, 'y'], [24, 35, 'x'], [25, 34, 'w'], [14, 29, 'x'], [34, 28, 'w']]);
    // the quill, and the ink on his fingers
    // the quill: a long goose feather, the vane wide in the middle
    for (let j = 0; j <= 26; j++) {
      const y = 5 + j, x = 5 + Math.round(j * 0.27);
      g.px(x, y, 'y');
      if (j < 20) {
        const w = Math.round(Math.sin(Math.PI * (j + 1) / 21) * 3);
        for (let k = 1; k <= w; k++) g.px(x - k, y + (k > 1 ? 1 : 0), (j + k) % 3 ? 'x' : 'w');
        if (j > 1 && j < 18) g.px(x + 1, y, j % 2 ? 'w' : 'v');
      }
    }
    st(g, 9, 30, [
      '..vwwv...',
      '.vwxxwv..',
      'vwxwwwvu.',
      'uvwwwvvu.',
      '.svwwvuu.',
      '..ssvuu..',
      '...uuu...',
    ]);
    pts(g, [[13, 30, 's'], [12, 31, 's']]);
    finishGhost(g, 41);
  }
  art.portrait('anselm', { w: W, h: H, count: 1, draw: anselm });

  // ================================================================ THE MOTH-WIFE — ash-moths for hair, a veil of wings
  function mothwife(g) {
    // dark robes, a shawl of pinned wings
    sPoly(g, [[1, 47], [4, 39], [13, 35], [35, 35], [44, 39], [47, 47]], ['0', '1', 'P', 'Q', 'R'], { r: 5, grad: 0.4, bias: 0.02 });
    for (let y = 38; y < H; y += 4) for (let x = 4 + (y % 8); x < 44; x += 8) st(g, x, y, x < 24 ? ['5.5', '.4.'] : ['4.4', '.3.']);
    sPoly(g, [[20, 30], [28, 30], [28, 37], [20, 37]], ['1', 'h', 'i', 'j'], { r: 2, bias: -0.3 });
    // the hair: a great drowsing cloud of ash-moths
    const hm = mask(); hm.ellipse(24, 17, 17, 13, 'x'); hm.ellipse(12, 30, 7, 9, 'x'); hm.ellipse(36, 30, 7, 9, 'x');
    shade(g, hm, ['1', '2', '3', '4'], { r: 5, grad: 0.45 });
    // wings folded all over it, then the big ones lying open on top
    for (let y = 3; y < 40; y += 3) for (let x = 6 + ((y / 3) % 2) * 2; x < 43; x += 4) if (hm.get(x, y) && hm.get(x + 2, y + 1)) st(g, x, y, x < 22 ? ['56', '.5'] : ['34', '.3']);
    const MOTH = ['.66...66.', '6787.7876', '.6782876.', '..66.66..'];
    const lite = { 6: '7', 7: '8', 8: '9', 2: '2' }, dim = { 6: '4', 7: '5', 8: '6', 2: '1' };
    for (const [x, y] of [[9, 3], [19, 1], [29, 3], [36, 9], [4, 11], [12, 9], [26, 8], [38, 18], [3, 20], [39, 27], [5, 29], [37, 35], [6, 36]]) {
      st(g, x, y, MOTH, x + 4 < 24 ? lite : dim);
    }
    // the pale face
    sEll(g, 24, 25, 7.5, 9.5, ['1', 'h', 'i', 'j', '8'], { r: 3, grad: 0.5, bias: 0.16, crisp: 3 });
    // eyes gleaming through the veil, a small knowing mouth
    const M = { L: '1', W: '8', w: 'h', I: 'o', G: 'q', S: 'h', s: 'h', B: '2', H: '8', M: 'i', K: 'G', D: 'F', T: '9' };
    feat(g, { map: M, eyes: 'open', brows: 'flat', mouth: 'smirk', eyeY: 24, mouthY: 31 });
    pts(g, [[19, 24, 'p'], [28, 24, 'n'], [22, 32, 'H'], [23, 32, 'H']]);
    // the veil of wings, hung from the moths down over her brow and eyes
    for (let y = 15; y <= 25; y++) for (let x = 15; x <= 33; x++) {
      const c = g.get(x, y); if (!c || 'hij8'.indexOf(c) < 0 && y > 17) continue;
      if (bay(x, y) < 0.42 - (y - 15) * 0.02) g.px(x, y, x < 24 ? '7' : '5');
    }
    for (const x of [16, 20, 25, 29, 32]) { g.px(x, 26, '6'); g.px(x, 27, x < 24 ? '7' : '5'); }
    // a drifting flame kept warm in a jar, held up; its light on her jaw
    st(g, 3, 32, [
      '..bddb..',
      '.bdeedc.',
      '..1aa1..',
      '.wsssst.',
      'wssnssst',
      'wsnopsst',
      'wsopqnst',
      'wssppsst',
      'wsssssst',
      '.wttttt.',
    ]);
    st(g, 2, 42, ['.jiiii.', 'jiiiiih', '.hhhhh.']);
    pts(g, [[17, 30, 'o'], [17, 31, 'f'], [18, 32, 'o'], [19, 33, 'f']]);
    finishLiving(g);
    // moths that have wandered off
    st(g, 41, 3, ['7.7', '.3.']); st(g, 3, 8, ['8.8', '.3.']); st(g, 44, 17, ['6.6', '.2.']);
  }
  art.portrait('mothwife', { w: W, h: H, count: 1, draw: mothwife });

  // ================================================================ the generic dead
  function ghostMan(g) {
    ghostBody(g, -0.06);
    // a laced tunic
    g.line(20, 36, 24, 42, 't'); g.line(28, 36, 24, 42, 't');
    pts(g, [[22, 38, 'x'], [26, 38, 'w'], [23, 40, 'x'], [25, 40, 'w']]);
    // a square, plain face; ears; cropped hair
    sEll(g, 14, 23, 1.5, 3, GHOST, { r: 1, bias: 0.1 }); sEll(g, 34, 23, 1.5, 3, GHOST, { r: 1, bias: -0.2 });
    sMask(g, (m) => { m.ellipse(24, 23, 9.5, 10.5, 'x'); m.rect(16, 26, 17, 7, 'x'); }, GHOST, { r: 3, grad: 0.5, bias: 0.15, crisp: 3 });
    sMask(g, (m) => { m.ellipse(24, 16, 10.5, 7.5, 'x'); m.rect(0, 17, W, H, null); m.rect(14, 17, 2, 5, 'x'); m.rect(33, 17, 2, 5, 'x'); }, GHAIR, { r: 3, grad: 0.5, bias: 0.05 });
    speckle(g, 16, 29, 32, 34, 13, 0.18, (c, x) => (GHOST.indexOf(c) >= 3 ? (x < 24 ? 'v' : 'u') : undefined));
    feat(g, { map: GMAP, eyes: 'tired', brows: 'flat', mouth: 'flat', eyeY: 22, mouthY: 30 });
    finishGhost(g, 40);
  }
  art.portrait('ghost_man', { w: W, h: H, count: 1, draw: ghostMan });

  function ghostWoman(g) {
    ghostBody(g, -0.06);
    // square neckline
    sPoly(g, [[18, 36], [30, 36], [29, 41], [19, 41]], GHOST, { r: 2, bias: 0.05 });
    g.line(18, 41, 29, 41, 't');
    // hair parted and drawn back; a braid over the shoulder
    sEll(g, 24, 20, 11, 12, GHAIR, { r: 4, grad: 0.45, bias: 0.05 });
    sEll(g, 24, 23, 7.5, 9.5, GHOST, { r: 3, grad: 0.5, bias: 0.18, crisp: 3 });
    st(g, 16, 12, ['.....uvw.wvu.....', '...uvwv...vvvu...', '..uvv.......vvu..', '.uv...........vu.']);
    for (let k = 0; k < 6; k++) st(g, 13 - (k >> 1), 29 + k * 3, ['.uv.', 'tuvt', '.ts.']);
    pts(g, [[11, 47, 'v'], [12, 47, 'u']]);
    feat(g, { map: GMAP, eyes: 'down', brows: 'sad', mouth: 'small', eyeY: 22, mouthY: 30 });
    pts(g, [[18, 26, 'w'], [30, 26, 'v']]);
    finishGhost(g, 41);
  }
  art.portrait('ghost_woman', { w: W, h: H, count: 1, draw: ghostWoman });

  function ghostChild(g) {
    // narrow shoulders, a smock
    sPoly(g, [[7, 47], [11, 40], [18, 37], [30, 37], [37, 40], [41, 47]], GHOST, { r: 4, grad: 0.45, bias: -0.04 });
    sPoly(g, [[21, 32], [27, 32], [27, 38], [21, 38]], GHOST, { r: 2, bias: -0.25 });
    // the tin tag on its string
    g.line(21, 35, 24, 41, 'u'); g.line(27, 35, 24, 41, 'u');
    st(g, 21, 41, ['yxxxxxw', 'xvxvvxv', 'xxxxxwv', 'wwwwvvu']);
    // a big head, hair every which way
    sEll(g, 24, 23, 10.5, 11, GHOST, { r: 4, grad: 0.45, bias: 0.2, crisp: 3 });
    sMask(g, (m) => { m.ellipse(24, 16, 11.5, 8, 'x'); m.rect(0, 18, W, H, null); m.rect(13, 17, 3, 6, 'x'); m.rect(33, 17, 2, 5, 'x'); }, GHAIR, { r: 3, grad: 0.5, bias: 0.08 });
    st(g, 15, 5, ['..v....w......', '.vw...vw..uv..', 'vw...wv...vu.t', '.....v.....u..']);
    st(g, 18, 17, ['.vw..w.', 'v.....v']);
    feat(g, { map: GMAP, eyes: 'wide', brows: 'raised', browDy: -1, mouth: 'small', eyeY: 23, mouthY: 31, noseRows: ['.x.', 'xw.', '...'] });
    pts(g, [[17, 27, 'w'], [18, 28, 'w'], [30, 27, 'v'], [31, 28, 'v']]);
    finishGhost(g, 42);
  }
  art.portrait('ghost_child', { w: W, h: H, count: 1, draw: ghostChild });

  function ghostSoldier(g) {
    // quilted gambeson, a padded collar
    ghostBody(g, -0.04);
    for (let x = 4; x < 46; x += 3) for (let y = 38; y < H; y++) on(g, x, y, x < 24 ? 'v' : 't');
    sPoly(g, [[16, 32], [32, 32], [34, 37], [14, 37]], GCLOTH, { r: 2, grad: 0.5 });
    // the spear he still stands his watch with
    for (let y = 8; y < H; y++) { g.px(41, y, 'v'); g.px(42, y, 't'); }
    st(g, 39, 0, ['..y..', '.yx..', '.yxw.', 'yxwv.', 'yxwv.', '.xwu.', '.tut.', 'ttutt']);
    // face, stubble
    sEll(g, 24, 24, 9, 10, GHOST, { r: 3, grad: 0.5, bias: 0.16, crisp: 3 });
    speckle(g, 16, 27, 32, 34, 29, 0.28, (c, x) => (GHOST.indexOf(c) >= 3 ? (x < 24 ? 'v' : 'u') : undefined));
    // kettle helm with its wide brim, brim-shadow over the eyes
    sMask(g, (m) => { m.ellipse(24, 13, 11, 8.5, 'x'); m.rect(0, 16, W, H, null); }, GCLOTH, { r: 3, grad: 0.5, bias: 0.06 });
    sEll(g, 24, 16, 19, 3, GCLOTH, { r: 2, grad: 0.5, bias: 0.04 });
    for (let x = 6; x <= 42; x++) if (g.get(x, 18)) g.px(x, 18, x < 22 ? 'u' : 't');
    for (let x = 15; x <= 33; x++) { const c = g.get(x, 19); if (c && GHOST.indexOf(c) > 3) g.px(x, 19, 'v'); }
    pts(g, [[17, 12, 'y'], [16, 13, 'x'], [28, 8, 'u']]);
    feat(g, { map: GMAP, eyes: 'open', brows: 'heavy', mouth: 'flat', eyeY: 23, mouthY: 31 });
    finishGhost(g, 40);
  }
  art.portrait('ghost_soldier', { w: W, h: H, count: 1, draw: ghostSoldier });

  function ghostMonk(g) {
    ghostBody(g, -0.12);
    // a deep peaked cowl
    const hd = mask(); hd.poly([[24, 3], [35, 11], [39, 28], [37, 40], [11, 40], [9, 28], [13, 11]], 'x');
    shade(g, hd, GHAIR.concat(['x']), { r: 4, grad: 0.5, bias: 0.04 });
    g.line(24, 4, 17, 14, 'x'); g.line(13, 30, 16, 39, 'w'); g.line(35, 30, 33, 39, 't');
    // inside the hood: dark, the face only half given back by the light
    const op = mask(); op.ellipse(24, 25, 8, 10.5, 'x'); fill(g, op, 's');
    // the face given back only from the nose down; the eyes two faint points in the dark
    const fc = mask(); fc.ellipse(24, 28, 6, 7, 'x');
    shade(g, fc, ['s', 't', 'u', 'v', 'w'], { r: 3, grad: 0.6, bias: -0.08, crisp: 3 });
    for (let y = 20; y <= 26; y++) for (let x = 16; x <= 32; x++) if (fc.get(x, y) && bay(x, y) < (27 - y) / 6) g.px(x, y, 's');
    pts(g, [[21, 24, 'v'], [27, 24, 'u'], [24, 26, 'v'], [24, 27, 'w'], [25, 28, 't'], [22, 31, 't'], [23, 31, 't'], [24, 31, 't'], [25, 31, 's'], [23, 32, 'v']]);
    // a knotted cord at the breast
    g.line(20, 42, 28, 42, 'x'); pts(g, [[24, 43, 'w'], [24, 44, 'w'], [23, 45, 'x'], [25, 46, 'v']]);
    finishGhost(g, 41);
  }
  art.portrait('ghost_monk', { w: W, h: H, count: 1, draw: ghostMonk });
})(window.AV);
