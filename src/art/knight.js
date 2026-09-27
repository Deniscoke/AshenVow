// ASHEN VOW — Ser Emeric Brand: player sheet, portrait, title key art (ART-KNIGHT)
(function (AV) {
  'use strict';
  const art = AV.art;
  const W = 24, H = 32;
  const PI = Math.PI;
  const R = Math.round;

  // ------------------------------------------------------------------ layer helpers
  const newG = () => art.grid(W, H);
  // blit src over dst; optional rim colour drawn on dst pixels bordering src (separation line)
  function over(dst, src, rim, sides) {
    const S = sides || 'lrtb';
    if (rim) {
      for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
        if (src.get(x, y) == null) continue;
        const nb = [];
        if (S.includes('l')) nb.push([x - 1, y]);
        if (S.includes('r')) nb.push([x + 1, y]);
        if (S.includes('t')) nb.push([x, y - 1]);
        if (S.includes('b')) nb.push([x, y + 1]);
        for (const [nx, ny] of nb) if (src.get(nx, ny) == null && dst.get(nx, ny) != null) dst.px(nx, ny, rim);
      }
    }
    dst.blit(src, 0, 0);
    return dst;
  }
  const darken = (rows) => rows.map((s) => s.replace(/6/g, '5').replace(/7/g, '6'));

  // thick limb from (x0,y0) to (x1,y1): colour c, highlight column hi, shadow column sh
  function limb(g, x0, y0, x1, y1, c, hi, sh) {
    const dx = x1 - x0, dy = y1 - y0;
    const ox = Math.abs(dy) >= Math.abs(dx) ? 1 : 0, oy = ox ? 0 : 1;
    g.line(x0 + ox, y0 + oy, x1 + ox, y1 + oy, sh || c);
    g.line(x0, y0, x1, y1, c);
    if (hi) g.line(x0 - ox, y0 - oy, x1 - ox, y1 - oy, hi);
  }
  // armoured fist (2x2)
  function fist(g, x, y, lit) {
    g.rect(x - 1, y - 1, 2, 2, lit ? '4' : '3');
    g.px(x - 1, y - 1, lit ? '6' : '4');
  }

  // ------------------------------------------------------------------ Vigil, the notched greatsword
  // (hx,hy) = hand on the grip, ang = direction the blade points, len = blade length in px
  function sword(g, hx, hy, ang, len, opt) {
    opt = opt || {};
    const dx = Math.cos(ang), dy = Math.sin(ang);
    // second blade column: toward the light (up or left)
    let ox, oy;
    if (Math.abs(dx) > Math.abs(dy)) { ox = 0; oy = -1; } else { ox = -1; oy = 0; }
    // grip + pommel
    g.line(R(hx - dx * 2), R(hy - dy * 2), R(hx), R(hy), 'a');
    g.px(R(hx - dx * 1), R(hy - dy * 1), 'b');
    g.px(R(hx - dx * 3), R(hy - dy * 3), '5');
    // blade
    const gx = hx + dx * 1.5, gy = hy + dy * 1.5;
    const x0 = R(gx + dx), y0 = R(gy + dy);
    const x1 = R(gx + dx * len), y1 = R(gy + dy * len);
    const pts = [];
    {
      let ax = x0, ay = y0;
      const ddx = Math.abs(x1 - ax), ddy = -Math.abs(y1 - ay);
      const sx = ax < x1 ? 1 : -1, sy = ay < y1 ? 1 : -1;
      let err = ddx + ddy;
      for (let k = 0; k < 64; k++) {
        pts.push([ax, ay]);
        if (ax === x1 && ay === y1) break;
        const e2 = 2 * err;
        if (e2 >= ddy) { err += ddy; ax += sx; }
        if (e2 <= ddx) { err += ddx; ay += sy; }
      }
    }
    const n = pts.length;
    const notches = opt.notches || [R(n * 0.45), R(n * 0.72)];
    pts.forEach(([x, y], i) => {
      if (i < n - 1 && !notches.includes(i)) g.px(x + ox, y + oy, opt.edge || '8');
    });
    pts.forEach(([x, y], i) => g.px(x, y, i === n - 1 ? '8' : (opt.main || '6')));
    if (opt.glow) pts.forEach(([x, y], i) => { if (i % 3 === 1) g.px(x, y, 'o'); });
    // crossguard (dark iron)
    const nx = -dy, ny = dx;
    g.line(R(gx - nx * 2.4), R(gy - ny * 2.4), R(gx + nx * 2.4), R(gy + ny * 2.4), '3');
    g.px(R(gx - nx * 2.4), R(gy - ny * 2.4), '5');
    g.px(R(gx), R(gy), '4');
  }

  // tallow candle held up (for heal)
  function candle(g, x, y, big) {
    g.line(x, y, x, y + 2, 'g'); g.px(x, y + 2, 'f');
    g.px(x, y - 1, big ? 'q' : 'p');
    g.px(x, y - 2, big ? 'p' : 'o');
    if (big) g.px(x, y - 3, 'o');
  }

  // ------------------------------------------------------------------ DOWN (facing the viewer)
  const HELM_D = [
    '.4566654.',
    '467777653',
    '355553442',
    '3564n4542',
    '3563p3442',
    '3564o4432',
    '3454n4332',
    '.3443432.',
  ];
  const HELM_U = [ // back of the helm (a small crack glows on the right)
    '.4566654.',
    '467777653',
    '356665442',
    '356654k32',
    '35665l432',
    '356544l32',
    '345544332',
    '.3443432.',
  ];
  const PAUL_CRACK = [ // his right shoulder: cracked, ember inside
    '.565.',
    '5767l',
    '46n53',
    '3o442',
    '.l32.',
  ];
  const PAUL_WHOLE = [
    '.565.',
    '46754',
    '45643',
    '34532',
    '.343.',
  ];
  const CHEST_D = [ // x9..15, y13..24 : breastplate edges + tabard (Open Hand) + belt + torn skirt
    '3355532',
    '466l653',
    '4646463',
    '3644452',
    '.36665.',
    '.36655.',
    '.bcKcb.',
    '.66655.',
    '567655.',
    '.66565.',
    '.56.54.',
    '..5..4.',
  ];
  const CHEST_U = [ // back: the tabard hangs long, the Open Hand between the shoulders
    '3345432',
    '4677763',
    '467l763',
    '4646463',
    '.64446.',
    '.67765.',
    '.bcbcb.',
    '.67665.',
    '5676655',
    '.66566.',
    '.66.65.',
    '.56.55.',
    '.5...5.',
  ];
  const LEG_D = [
    '3443',
    '3543',
    '3543',
    '2442',
    '4654',
    '3764',
    '2442',
    '3542',
    '3542',
    '35543',
    '23332',
  ];
  const LEG_U = [
    '3443',
    '3543',
    '3543',
    '2442',
    '3443',
    '3442',
    '2552',
    '3542',
    '3442',
    '34443',
    '23332',
  ];

  // front/back legs. lift = rows removed (foot raised), kneel = knee on ground
  function legFB(g, rows0, x, lift, mirror, dark) {
    let r = rows0.slice();
    if (lift > 0) r = r.slice(0, 7 - lift).concat(r.slice(7));
    if (dark) r = darken(r);
    const y = 20;
    if (mirror) g.stampFlip(x, y, r.map((s) => (s.length === 4 ? s + '.' : s)));
    else g.stamp(x - 1, y, r.map((s) => (s.length === 4 ? '.' + s : s)));
  }
  // kneeling leg seen from the front: thigh down to a knee on the ground
  function legKneel(g, x, y, mirror) {
    const r = ['3443', '3543', '3543', '2442', '4654', '3764', '23332'];
    if (mirror) g.stampFlip(x, y, darken(r).map((s) => (s.length === 4 ? s + '.' : s)));
    else g.stamp(x - 1, y, r.map((s) => (s.length === 4 ? '.' + s : s)));
  }

  // P: b (body drop), liftL/liftR, handR/handL [x,y], sword [hx,hy,ang,len,opt,'behind'], wick, visor,
  //    legs:'kneel', twoHand (left arm reaches the sword hand), candle
  function drawFB(P, back) {
    const g = newG();
    const b = P.b || 0;
    const hb = P.hb || 0; // extra helm drop (slump)
    // legs
    const lg = newG();
    if (P.legs === 'kneel') {
      legKneel(lg, 8, 20 + b, false);
      const r = newG(); legFB(r, back ? LEG_U : LEG_D, 13, 0, true, true); over(lg, r);
    } else if (P.legs === 'knees') {
      legKneel(lg, 8, 20 + b, false);
      const r = newG(); legKneel(r, 13, 20 + b, true); over(lg, r);
    } else {
      legFB(lg, back ? LEG_U : LEG_D, 8, P.liftL || 0, false, !!back && false);
      const r = newG(); legFB(r, back ? LEG_U : LEG_D, 13, P.liftR || 0, true, true); over(lg, r);
    }
    over(g, lg);
    // sword layer
    const sw = newG();
    if (P.sword) sword(sw, P.sword[0], P.sword[1], P.sword[2], P.sword[3], P.sword[4]);
    const swBehind = P.sword && P.sword[5] === 'behind';
    if (swBehind) over(g, sw);
    // chest + tabard
    g.stamp(9, 13 + b, back ? CHEST_U : CHEST_D);
    // arms. front view: screen-left = his right (sword arm). back view: screen-right = his right.
    const hr = P.handR || (back ? [18, 20 + b] : [6, 20 + b]);
    const hl = P.handL || (back ? [6, 20 + b] : [18, 20 + b]);
    const shR = back ? [16, 15 + b] : [7, 15 + b];
    const shL = back ? [7, 15 + b] : [16, 15 + b];
    const armA = newG(), armB = newG();
    // arm on the screen-left side is lit, the other in shade
    const leftHand = back ? hl : hr, rightHand = back ? hr : hl;
    const leftSh = back ? shL : shR, rightSh = back ? shR : shL;
    limb(armA, leftSh[0], leftSh[1], leftHand[0], leftHand[1] - 1, '4', '5', '3');
    armA.px(leftSh[0], leftSh[1] + 2, '6');
    fist(armA, leftHand[0], leftHand[1], true);
    limb(armB, rightSh[0] + 1, rightSh[1], rightHand[0], rightHand[1] - 1, '3', '4', '2');
    armB.px(rightSh[0] + 1, rightSh[1] + 2, '5');
    fist(armB, rightHand[0] + 1, rightHand[1], false);
    if (P.armsFront) { g.stamp(5, 12 + b, back ? PAUL_WHOLE : PAUL_CRACK); g.stamp(15, 12 + b, darken(back ? PAUL_CRACK : PAUL_WHOLE)); }
    over(g, armA, '2', 'r');
    over(g, armB, '2', 'l');
    // scorched tin tag on his left wrist
    const tagHand = back ? [hl[0] - 1, hl[1]] : [hl[0] + 1, hl[1]];
    if (!P.noTag) { g.px(tagHand[0], tagHand[1] + 1, '7'); g.px(tagHand[0], tagHand[1] + 2, '8'); }
    if (!P.armsFront) {
      g.stamp(5, 12 + b, back ? PAUL_WHOLE : PAUL_CRACK);
      g.stamp(15, 12 + b, darken(back ? PAUL_CRACK : PAUL_WHOLE));
    }
    // helm + wick
    g.stamp(8, 5 + b + hb, back ? HELM_U : HELM_D);
    if (!back && P.visor) { for (let y = 8; y <= 11; y++) g.px(12, y + b + hb, P.visor[y - 8]); }
    g.px(12, 1 + b + hb, P.wick || 'l'); g.line(12, 2 + b + hb, 12, 4 + b + hb, '2');
    if (P.candle) candle(g, P.candle[0], P.candle[1], P.candle[2]);
    if (!swBehind) over(g, sw);
    if (P.post) P.post(g);
    g.outline('0');
    if (P.ash) for (const [x, y, c] of P.ash) g.px(x, y, c || '7');
    return g;
  }
  const drawDown = (P) => drawFB(P, false);
  const drawUp = (P) => drawFB(P, true);

  // ------------------------------------------------------------------ SIDE (facing right)
  const HELM_S = [ // x8..16, y5..12
    '.4566654.',
    '467777654',
    '356666543',
    '34665442n',
    '34655432p',
    '34555222o',
    '33444322n',
    '..333322.',
  ];
  const PAUL_S = [ // x7..12, y12..17 (near shoulder, cracked)
    '..465.',
    '.46764',
    '4676l4',
    '466n43',
    '35o432',
    '.l332.',
  ];
  const TORSO_S = [ // full-width rows y13..24: plate, belt, tabard front and back
    '............43566.......',
    '............435765......',
    '............335765......',
    '............235665......',
    '............23565.......',
    '........233323565.......',
    '........bbcbbbKba.......',
    '.......5533332665.......',
    '.......56......55.......',
    '.......55......65.......',
    '.......45......6........',
    '........4......5........',
  ];
  // leg stamps (near-leg colours), hip at column 4, rows y21..y30
  const LEGS = {
    stand: [
      '....453....',
      '....453....',
      '....453....',
      '....464....',
      '....3664...',
      '....353....',
      '....453....',
      '....453....',
      '....4564...',
      '...233332..',
    ],
    fwd: [
      '....453....',
      '....3453...',
      '.....4553..',
      '.....3464..',
      '......3664.',
      '......353..',
      '......453..',
      '......453..',
      '......4564.',
      '.....233332',
    ],
    back: [
      '....453....',
      '...4531....',
      '...453.....',
      '..3464.....',
      '..3664.....',
      '..353......',
      '.353.......',
      '.453.......',
      '4564.......',
      '3332.......',
    ],
    lift: [
      '....453....',
      '....4553...',
      '.....3464..',
      '.....33664.',
      '....3533...',
      '....453....',
      '...4564....',
      '..233332...',
      '...........',
      '...........',
    ],
    crouch: [ // deep bend, foot flat (use legY 3)
      '....4553...',
      '.....3464..',
      '.....33664.',
      '....3533...',
      '....453....',
      '....4564...',
      '...233332..',
      '...........',
      '...........',
      '...........',
    ],
  };
  const FARMAP = { '7': '4', '6': '4', '5': '3', '4': '3', '3': '2', '2': '1' };
  function legS(g, pose, hipX, y, far) {
    const rows = LEGS[pose].map((r) => (far ? r.replace(/[234567]/g, (c) => FARMAP[c]) : r));
    g.stamp(hipX - 4, y, rows);
  }
  // near (sword) arm: shoulder -> elbow (3 wide) -> fist (2 wide forearm)
  function armS(g, sh, el, hand) {
    const dy = el[1] - sh[1], dx = el[0] - sh[0];
    const n = Math.max(Math.abs(dy), Math.abs(dx), 1);
    for (let i = 0; i <= n; i++) {
      const x = R(sh[0] + dx * i / n), y = R(sh[1] + dy * i / n);
      g.px(x - 1, y, '4'); g.px(x, y, '5'); g.px(x + 1, y, '3');
    }
    g.px(el[0], el[1], '6');
    limb(g, el[0], el[1], hand[0], hand[1] - 1, '4', '5', '3');
    fist(g, hand[0], hand[1], true);
    g.px(hand[0], hand[1], '4');
  }
  // P: b, lean, legN/legF pose names, hipN/hipF x, legY, hand [x,y], elbow, hand2 (far hand), sword [...], wick, hb, helmX
  function drawSide(P) {
    const g = newG();
    const b = P.b || 0, L = P.lean || 0;
    const ly = 21 + (P.legY || 0);
    // far arm (behind everything)
    const hand2 = P.hand2 || [9 + L, 21 + b];
    const fa = newG();
    limb(fa, 10 + L, 16 + b, hand2[0], hand2[1] - 1, '2', '3', '1');
    fist(fa, hand2[0], hand2[1], false);
    over(g, fa);
    // far leg
    const lf = newG(); legS(lf, P.legF || 'stand', (P.hipF || 9), ly, true); over(g, lf);
    const sw = newG();
    if (P.sword) sword(sw, P.sword[0], P.sword[1], P.sword[2], P.sword[3], P.sword[4]);
    const swBehind = P.sword && P.sword[5] === 'behind';
    const swOver = P.sword && P.sword[5] === 'over';
    if (swBehind) over(g, sw);
    // torso + tabard
    const t = newG(); t.stamp(L, b, ['', '', '', '', '', '', '', '', '', '', '', '', ''].concat(TORSO_S)); over(g, t);
    // near leg
    const ln = newG(); legS(ln, P.legN || 'stand', (P.hipN || 13), ly, false); over(g, ln, '1', 'lr');
    if (!swBehind && !swOver) over(g, sw);
    // helm + wick
    const hx = L + (P.helmX || 0), hy = b + (P.hb || 0);
    g.stamp(8 + hx, 5 + hy, HELM_S);
    g.px(12 + hx, 1 + hy, P.wick || 'l'); g.line(12 + hx, 2 + hy, 12 + hx, 4 + hy, '2');
    // near arm
    const na = newG();
    armS(na, [10 + L, 17 + b], P.elbow || [10 + L, 19 + b], P.hand || [14 + L, 21 + b]);
    over(g, na, '2');
    // cracked pauldron over the arm root
    g.stamp(7 + L, 12 + b, PAUL_S);
    if (swOver) over(g, sw);
    if (P.post) P.post(g);
    g.outline('0');
    // light leaking from the visor slit
    if (!P.noLeak) g.px(17 + hx, 9 + hy, 'l');
    if (P.ash) for (const [x, y, c] of P.ash) g.px(x, y, c || '7');
    return g;
  }

  // ------------------------------------------------------------------ ROLL (armoured tuck)
  // plated ball: dark core, lit upper-left, plate bands curving across it
  function ballBase(g, cx, cy, dir, phase) {
    g.ellipse(cx, cy, 7, 6, '3');
    g.ellipse(cx - 1, cy - 1, 6, 5, '4');
    g.ellipse(cx - 2, cy - 3, 3, 1, '5');
    g.px(cx - 3, cy - 4, '6'); g.px(cx - 2, cy - 4, '6'); g.px(cx - 4, cy - 3, '6');
    const inside = (x, y) => g.get(x, y) != null;
    for (let k = -1; k <= 1; k++) {
      const o = k * 4 + phase;
      if (dir === 'h') {
        for (let x = cx - 7; x <= cx + 7; x++) {
          const t = (x - cx) / 7, y = cy + o - R(t * t * 2);
          if (inside(x, y) && inside(x, y + 1)) { g.px(x, y, '2'); if (inside(x, y - 1)) g.px(x, y - 1, g.get(x, y - 1) === '3' ? '4' : '5'); }
        }
      } else {
        for (let y = cy - 6; y <= cy + 6; y++) {
          const t = (y - cy) / 6, x = cx + o - R(t * t * 2);
          if (inside(x, y) && inside(x + 1, y)) { g.px(x, y, '2'); if (inside(x - 1, y)) g.px(x - 1, y, g.get(x - 1, y) === '3' ? '4' : '5'); }
        }
      }
    }
  }
  // crown of the helm seen from above, spike pointing along (sx,sy)
  function helmCrown(g, cx, cy, sx, sy, glow) {
    g.circle(cx, cy, 3, '4');
    g.circle(cx - 1, cy - 1, 2, '6');
    g.px(cx - 1, cy - 2, '7'); g.px(cx - 2, cy - 1, '7');
    g.px(cx + 2, cy + 2, '3'); g.px(cx + 3, cy + 1, '3'); g.px(cx + 1, cy + 3, '3');
    if (glow) { g.px(cx - sx * 3, cy - sy * 3, glow); }
    for (let i = 4; i <= 5; i++) g.px(cx + sx * i, cy + sy * i, '2');
    g.px(cx + sx * 6, cy + sy * 6, 'l');
  }
  function sabaton(g, x, y, up) { // foot seen end-on: sole or toe
    g.rect(x, y, 3, 2, '3'); g.px(x, y, up ? '5' : '4'); g.px(x + 1, y, up ? '4' : '5'); g.px(x + 2, y + 1, '2');
  }
  function tabardStrip(g, x, y, h) { // back of the tabard with the Open Hand
    g.rect(x, y, 5, h, '6'); g.line(x, y, x, y + h - 1, '7'); g.line(x + 4, y, x + 4, y + h - 1, '5');
    g.px(x + 2, y + 1, 'l'); g.px(x + 1, y + 2, '4'); g.px(x + 3, y + 2, '4'); g.line(x + 1, y + 3, x + 3, y + 3, '4');
    g.px(x + 1, y + h - 1, null); g.px(x + 3, y + h - 1, null);
  }
  function rollFrame(fn) {
    return (g) => { const t = newG(); fn(t); t.outline('0'); g.blit(t, 0, 0); };
  }
  const ROLL_DOWN_1 = rollFrame((t) => { // head tucked toward the viewer, back and pauldrons above
    const s = newG(); sword(s, 17, 19, -PI * 0.22, 6, { notches: [] }); over(t, s);
    ballBase(t, 12, 23, 'h', 1);
    tabardStrip(t, 10, 17, 5);
    t.stamp(4, 19, PAUL_CRACK); t.stamp(15, 19, darken(PAUL_WHOLE));
    helmCrown(t, 12, 25, 0, 1, 'n');
  });
  const ROLL_DOWN_2 = rollFrame((t) => { // rolled over: back to the sky, feet over the top
    ballBase(t, 12, 24, 'h', 3);
    tabardStrip(t, 10, 20, 7);
    sabaton(t, 7, 17, true); sabaton(t, 14, 17, true);
    t.stamp(4, 23, darken(PAUL_CRACK)); t.stamp(15, 23, darken(PAUL_WHOLE));
    const s = newG(); sword(s, 5, 25, PI * 0.9, 5, { notches: [] }); over(t, s);
  });
  const ROLL_UP_1 = rollFrame((t) => { // back to the viewer, head dipped away: only the wick shows
    const s = newG(); sword(s, 18, 19, -PI * 0.3, 7, { notches: [] }); over(t, s);
    ballBase(t, 12, 24, 'h', 0);
    t.line(12, 14, 12, 16, '2'); t.px(12, 13, 'l');
    t.ellipse(12, 18, 3, 1, '5'); t.px(11, 17, '7');
    tabardStrip(t, 10, 20, 7);
    t.stamp(4, 19, PAUL_WHOLE); t.stamp(15, 19, darken(PAUL_CRACK));
  });
  const ROLL_UP_2 = rollFrame((t) => { // over the shoulders: soles toward the viewer
    ballBase(t, 12, 23, 'h', 2);
    tabardStrip(t, 10, 18, 6);
    sabaton(t, 8, 27, false); sabaton(t, 13, 27, false);
    t.stamp(4, 18, PAUL_WHOLE); t.stamp(15, 18, darken(PAUL_CRACK));
    const s = newG(); sword(s, 18, 25, PI * 0.1, 5, { notches: [] }); over(t, s);
  });
  const ROLL_SIDE_1 = rollFrame((t) => { // tucking forward: helm low at the front, sword trailing
    const s = newG(); sword(s, 13, 18, PI * 1.08, 9, { notches: [] }); over(t, s);
    ballBase(t, 11, 24, 'v', 0);
    t.stamp(8, 17, ['.5665.', '567776', '46l654']);
    const h = newG();
    h.stamp(14, 22, ['.4565.', '466774', '45665n', '34554p', '.3443n']);
    h.line(20, 24, 21, 25, '2'); h.px(22, 26, 'l');
    over(t, h, '2');
    t.stamp(8, 19, PAUL_S.slice(1));
  });
  const ROLL_SIDE_2 = rollFrame((t) => { // upside down: feet over the top, helm under
    ballBase(t, 12, 24, 'v', 2);
    sabaton(t, 9, 17, true); sabaton(t, 13, 16, true);
    t.stamp(14, 24, ['.4565.', '4677l4', '466n43', '35o432']);
    t.stamp(6, 21, ['.66.', '6776', '5665', '.55.']);
    const s = newG(); sword(s, 7, 28, PI * 0.02, 8, { notches: [] }); over(t, s);
  });

  // ------------------------------------------------------------------ DEATH heap pieces
  function ashMound(g, cx, cy, rx, ry, seed) {
    g.ellipse(cx, cy, rx, ry, '5');
    g.ellipse(cx - 1, cy - 1, rx - 2, ry - 1, '6');
    g.ellipse(cx - 2, cy - 2, Math.max(1, rx - 5), Math.max(1, ry - 2), '7');
    const rnd = art.grid(1, 1).rnd(seed);
    for (let i = 0; i < rx * ry; i++) {
      const x = R(cx + (rnd() * 2 - 1) * rx), y = R(cy + (rnd() * 2 - 1) * ry);
      const nx = (x - cx) / (rx + 0.5), ny = (y - cy) / (ry + 0.5);
      if (nx * nx + ny * ny < 0.8) g.px(x, y, '678'[Math.floor(rnd() * 3)]);
    }
  }
  function lyingHelm(g, x, y, glow) { // helm fallen on its side, wick pointing left
    g.stamp(x, y, [
      '.45665.',
      '4677765',
      '45' + (glow || '3').repeat(3) + '54',
      '3444443',
      '.33332.',
    ]);
    g.line(x - 3, y + 2, x - 1, y + 2, '2');
    g.px(x - 4, y + 2, glow === 'l' || glow === 'k' ? 'k' : 'l');
  }

  // ------------------------------------------------------------------ poses
  const frame = (fn, P) => (g) => { g.blit(fn(P), 0, 0); };
  const anims = {};

  // ash sifting at the seams (drawn after the outline, always on the body)
  const ASH_D = [[[6, 17, '8'], [14, 20, '7']], [[18, 17, '7'], [10, 21, '8']], [[7, 19, '8'], [15, 25, '7']], [[17, 19, '7'], [9, 26, '8']]];
  const ASH_U = [[[18, 17, '8'], [10, 20, '7']], [[6, 17, '7'], [14, 21, '8']], [[17, 19, '8'], [9, 25, '7']], [[7, 19, '7'], [15, 26, '8']]];
  const ASH_S = [[[9, 18, '8'], [12, 20, '7']], [[13, 17, '7'], [12, 26, '8']], [[8, 20, '8'], [13, 21, '7']], [[10, 19, '7'], [13, 27, '8']]];

  // --- DOWN
  const SWD = (b) => [6, 20 + b, PI * 0.62, 10];
  anims.idle_down = { fps: 3, frames: [0, 1, 2, 3].map((i) => frame(drawDown, {
    b: i >= 2 ? 1 : 0, sword: SWD(i >= 2 ? 1 : 0), wick: i % 2 ? 'k' : 'l', ash: ASH_D[i],
  })) };
  anims.walk_down = { fps: 8, frames: [
    frame(drawDown, { liftR: 2, handL: [18, 19], sword: SWD(0) }),
    frame(drawDown, { b: 1, sword: SWD(1) }),
    frame(drawDown, { liftL: 2, handL: [18, 21], sword: [6, 19, PI * 0.6, 10] }),
    frame(drawDown, { b: 1, sword: SWD(1) }),
  ] };
  anims.attack_down = { fps: 14, loop: false, frames: [
    frame(drawDown, { b: 1, handR: [7, 12], handL: [9, 13], sword: [7, 12, -PI * 0.64, 10, null, 'behind'], liftL: 1 }),
    frame(drawDown, { handR: [9, 18], handL: [11, 18], sword: [9, 18, PI * 0.76, 10], liftR: 1 }),
    frame(drawDown, { b: 1, handR: [14, 21], handL: [15, 20], sword: [14, 21, PI * 0.24, 9] }),
    frame(drawDown, { b: 1, handR: [15, 21], handL: [16, 21], sword: [15, 21, PI * 0.38, 9] }),
  ] };

  // --- UP
  const SWU = (b) => [18, 20 + b, PI * 0.38, 10];
  anims.idle_up = { fps: 3, frames: [0, 1, 2, 3].map((i) => frame(drawUp, {
    b: i >= 2 ? 1 : 0, sword: SWU(i >= 2 ? 1 : 0), wick: i % 2 ? 'k' : 'l', ash: ASH_U[i],
  })) };
  anims.walk_up = { fps: 8, frames: [
    frame(drawUp, { liftR: 2, handL: [6, 21], sword: SWU(0) }),
    frame(drawUp, { b: 1, sword: SWU(1) }),
    frame(drawUp, { liftL: 2, handL: [6, 19], sword: [18, 19, PI * 0.4, 10] }),
    frame(drawUp, { b: 1, sword: SWU(1) }),
  ] };
  anims.attack_up = { fps: 14, loop: false, frames: [
    frame(drawUp, { b: 1, handR: [18, 17], handL: [16, 18], sword: [18, 17, PI * 0.08, 8], liftR: 1 }),
    frame(drawUp, { handR: [16, 11], handL: [14, 12], sword: [16, 11, -PI * 0.28, 10, null, 'behind'] }),
    frame(drawUp, { handR: [11, 10], handL: [13, 11], sword: [11, 10, -PI * 0.7, 10, null, 'behind'] }),
    frame(drawUp, { b: 1, handR: [7, 16], handL: [9, 16], sword: [7, 16, PI * 0.88, 7], liftL: 1 }),
  ] };

  // --- SIDE
  const SWS = (b) => [14, 21 + b, PI * 0.3, 10];
  anims.idle_side = { fps: 3, frames: [0, 1, 2, 3].map((i) => frame(drawSide, {
    b: i >= 2 ? 1 : 0, sword: SWS(i >= 2 ? 1 : 0), hand: [14, 21 + (i >= 2 ? 1 : 0)], wick: i % 2 ? 'k' : 'l',
    ash: ASH_S[i],
  })) };
  const WALK_S = [
    { legN: 'fwd', legF: 'back', b: 1, hand2: [8, 21] },
    { legN: 'stand', legF: 'lift', b: 0, hand2: [10, 21] },
    { legN: 'back', legF: 'fwd', b: 1, hand2: [12, 21] },
    { legN: 'lift', legF: 'stand', b: 0, hand2: [10, 21] },
  ];
  anims.walk_side = { fps: 8, frames: WALK_S.map((w, i) => frame(drawSide, Object.assign({
    sword: [14, 21 + w.b, PI * (i % 2 ? 0.3 : 0.27), 10], hand: [14, 21 + w.b],
  }, w))) };
  anims.attack_side = { fps: 14, loop: false, frames: [
    frame(drawSide, { b: 1, lean: -1, hand: [8, 12], elbow: [8, 16], hand2: [9, 13], sword: [8, 12, -PI * 0.85, 10, null, 'behind'],
      legN: 'back', legF: 'fwd' }),
    frame(drawSide, { lean: 0, hand: [13, 10], elbow: [12, 14], hand2: [13, 11], sword: [13, 10, -PI * 0.36, 9, null, 'over'],
      legN: 'stand', legF: 'back' }),
    frame(drawSide, { b: 2, lean: 1, hand: [17, 18], elbow: [14, 17], hand2: [16, 18], sword: [17, 18, PI * 0.18, 7, null, 'over'],
      legN: 'fwd', legF: 'back' }),
    frame(drawSide, { b: 1, lean: 1, hand: [16, 20], elbow: [12, 19], hand2: [15, 20], sword: [16, 20, PI * 0.36, 9],
      legN: 'fwd', legF: 'back' }),
  ] };

  // --- ROLL (crouch, tuck, over, rise)
  anims.roll_down = { fps: 12, loop: false, frames: [
    frame(drawDown, { b: 3, hb: 1, legs: 'knees', handR: [6, 23], handL: [18, 23], sword: [6, 23, PI * 0.8, 8] }),
    ROLL_DOWN_1,
    ROLL_DOWN_2,
    frame(drawDown, { b: 3, legs: 'knees', handR: [6, 23], handL: [18, 23], sword: [6, 23, PI * 0.7, 9] }),
  ] };
  anims.roll_up = { fps: 12, loop: false, frames: [
    frame(drawUp, { b: 3, hb: 1, legs: 'knees', handR: [18, 23], handL: [6, 23], sword: [18, 23, PI * 0.2, 8] }),
    ROLL_UP_1,
    ROLL_UP_2,
    frame(drawUp, { b: 3, legs: 'knees', handR: [18, 23], handL: [6, 23], sword: [18, 23, PI * 0.3, 9] }),
  ] };
  anims.roll_side = { fps: 12, loop: false, frames: [
    frame(drawSide, { b: 3, lean: 2, helmX: 1, hb: 1, hand: [17, 23], elbow: [13, 21], hand2: [15, 23], sword: [17, 23, PI * 0.08, 6],
      legN: 'crouch', legF: 'crouch', legY: 3, hipN: 13 }),
    ROLL_SIDE_1,
    ROLL_SIDE_2,
    frame(drawSide, { b: 3, lean: 1, hb: 1, hand: [16, 23], elbow: [12, 21], hand2: [14, 23], sword: [16, 23, PI * 0.18, 8],
      legN: 'crouch', legF: 'back', legY: 3 }),
  ] };

  // --- HURT / HEAL / KNEEL (front view)
  anims.hurt = { fps: 10, loop: false, frames: [
    frame(drawDown, { b: 0, hb: -1, handR: [4, 17], handL: [20, 17], sword: [4, 17, PI * 0.75, 9], visor: 'qqpo', liftR: 1 }),
    frame(drawDown, { b: 1, handR: [5, 19], handL: [19, 19], sword: [5, 19, PI * 0.68, 10], visor: 'npon' }),
  ] };
  anims.heal = { fps: 6, loop: false, frames: [
    frame(drawDown, { sword: SWD(0), handL: [17, 20], candle: [18, 17, false] }),
    frame(drawDown, { sword: SWD(0), handL: [17, 16], candle: [17, 13, false] }),
    frame(drawDown, { sword: SWD(0), handL: [16, 13], candle: [16, 9, true], visor: 'oppo' }),
  ] };
  anims.kneel = { fps: 2, frames: [
    frame(drawDown, { b: 4, hb: 1, legs: 'kneel', handR: [12, 21], handL: [13, 21], sword: [12, 20, PI / 2, 8] }),
    frame(drawDown, { b: 4, hb: 2, legs: 'kneel', handR: [12, 21], handL: [13, 21], sword: [12, 20, PI / 2, 8], wick: 'k', visor: 'lnnl' }),
  ] };

  // --- DIE: to the knees, head falls forward, the plate caves into grey ash; the helm is left on the heap
  const heapFrame = (fn) => (g) => { const t = newG(); fn(t); t.outline('0'); g.blit(t, 0, 0); };
  function helmFront(g, x, y, visor, wick) {
    g.stamp(x, y, HELM_D);
    for (let i = 0; i < 4; i++) g.px(x + 4, y + 3 + i, visor[i]);
    g.line(x + 4, y - 3, x + 4, y - 1, '2'); g.px(x + 4, y - 4, wick || 'k');
  }
  const LEG_PIECE = ['3443', '4654', '3764', '23332'];
  anims.die = { fps: 7, loop: false, frames: [
    frame(drawDown, { b: 1, hb: 1, handR: [5, 21], handL: [18, 21], sword: [5, 21, PI * 0.72, 10], visor: 'qppn' }),
    frame(drawDown, { b: 5, legs: 'knees', handR: [6, 25], handL: [18, 25], sword: [3, 29, PI * 0.97, 9], visor: 'nool' }),
    frame(drawDown, { b: 6, hb: 2, legs: 'knees', handR: [7, 27], handL: [17, 27], sword: [3, 29, PI * 0.99, 9], visor: 'lnnl', wick: 'k' }),
    frame(drawDown, { b: 7, hb: 5, legs: 'knees', handR: [6, 28], handL: [18, 28], sword: [3, 29, PI * 0.99, 9], visor: 'klnk', wick: 'k' }),
    heapFrame((t) => { // the plate gives way; the ember inside flares through every seam
      const s = newG(); sword(s, 3, 29, PI, 9); over(t, s);
      ashMound(t, 12, 28, 8, 2, 3);
      t.stamp(5, 26, LEG_PIECE); t.stamp(15, 26, darken(LEG_PIECE));
      tabardStrip(t, 10, 21, 6);
      t.stamp(3, 21, ['.565.', '5767o', '46p53', '3o442', '.l32.']);
      t.stamp(16, 22, darken(PAUL_WHOLE));
      helmFront(t, 8, 16, 'nppn', 'l');
      t.px(9, 24, 'o'); t.px(15, 25, 'p'); t.px(14, 26, 'n'); t.px(10, 27, 'o');
    }),
    heapFrame((t) => { // caving in: ash pours out of the empty plate and buries it
      const s = newG(); sword(s, 3, 29, PI, 10); over(t, s);
      t.stamp(3, 24, ['.565.', '4767l', '36n53']);
      t.stamp(16, 25, ['3443', '4654', '.33.']);
      helmFront(t, 8, 18, 'lnnl', 'k');
      ashMound(t, 12, 28, 9, 3, 7);
      t.px(8, 27, 'o'); t.px(15, 28, 'n'); t.px(18, 28, 'l');
    }),
    heapFrame((t) => { // the heap: the helm stands in grey ash, one ember still breathing inside it
      const s = newG(); sword(s, 3, 30, PI, 10); over(t, s);
      t.stamp(3, 25, ['.565.', '4767k', '.3l3.']);
      t.stamp(17, 27, ['3443', '.33.']);
      helmFront(t, 8, 19, 'kllk', '2');
      ashMound(t, 12, 28, 10, 3, 11);
      t.px(15, 27, 'o'); t.px(16, 27, 'l'); t.px(15, 28, 'l');
    }),
  ] };

  art.sheet('player', { w: W, h: H, ox: 12, oy: 30, anims });
  // ------------------------------------------------------------------ PORTRAIT 'brand' (48x48)
  // stage 0: ember in the visor, few cracks. 1: more cracks burning, ash in the seams.
  // 2: the visor gone cold and pale, the plate greyer, cracks dead — something has left him.
  // Key light hard from the right; the far side of the helm falls into shadow where the cracks burn.
  function shadeDome(g, cx, cy, rx, ry, tones, lx, clip) {
    // tones: dark..light; lx: light direction x (+1 = from the right)
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x - cx) / (rx + 0.5), ny = (y - cy) / (ry + 0.5);
        const d = nx * nx + ny * ny;
        if (d > 1 || (clip && !clip(x, y))) continue;
        const nz = Math.sqrt(1 - d);
        const v = Math.max(0, nx * lx * 0.85 - ny * 0.45 + nz * 0.25);
        g.px(x, y, tones[Math.min(tones.length - 1, Math.floor(v * tones.length))]);
      }
  }
  function crackPath(g, pts, core, edge) {
    for (let i = 0; i + 1 < pts.length; i++) g.line(pts[i][0] + 1, pts[i][1], pts[i + 1][0] + 1, pts[i + 1][1], edge);
    for (let i = 0; i + 1 < pts.length; i++) g.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], core);
  }
  // helm silhouette rows: [y, left, right]
  const PH_ROWS = (() => {
    const r = [];
    const span = { 7: [18, 28], 8: [15, 31], 9: [13, 33], 10: [12, 34], 31: [12, 34], 32: [13, 33], 33: [15, 31] };
    for (let y = 7; y <= 33; y++) r.push([y].concat(span[y] || [11, 35]));
    return r;
  })();
  const RIDGE = 24;

  function portraitBrand(g, stage) {
    const cold = stage === 2;
    // plate tones (stage 2: greyer, flatter — the life gone out of the steel)
    const SIDE = cold ? ['3', '3', '4'] : ['1', '2', '3'];
    const FRONT = cold ? ['4', '5', '5', '6', '7'] : ['3', '4', '5', '6', '7'];
    const DOME_DARK = cold ? ['3', '3', '4', '5', '6'] : ['1', '2', '3', '4', '6'];
    const DOME_LIT = cold ? ['4', '4', '5', '6', '7'] : ['2', '3', '4', '5', '7'];
    // ---- shoulders
    shadeDome(g, 41, 45, 10, 8, DOME_LIT, 1);                    // far pauldron (his left), in the light
    for (let y = 35; y < 48; y++) for (let x = 15; x <= 33; x++) g.px(x, y, x > 28 ? SIDE[2] : SIDE[1]);
    // tabard over the chest, torn at the neck, the Open Hand faint on it
    const TAB = cold ? ['5', '6', '7'] : ['4', '5', '6'];
    for (let y = 39; y < 48; y++) for (let x = 18; x <= 30; x++) {
      const t = x < 21 ? 0 : x < 27 ? 1 : 2;
      g.px(x, y, (x === 22 || x === 26) && y > 41 ? TAB[Math.max(0, t - 1)] : TAB[t]);
    }
    [19, 20, 23, 27, 28].forEach((x) => g.px(x, 39, null));
    // the Open Hand: a flame over a cupped palm
    g.px(24, 40, cold ? TAB[0] : 'n'); g.px(24, 41, cold ? TAB[0] : 'l'); g.px(23, 42, cold ? TAB[0] : 'k'); g.px(24, 42, cold ? TAB[0] : 'l');
    g.px(21, 42, SIDE[1]); g.px(27, 42, SIDE[1]);
    g.line(21, 43, 22, 44, SIDE[1]); g.line(27, 43, 26, 44, SIDE[1]); g.line(22, 45, 26, 45, SIDE[1]); g.line(23, 44, 25, 44, TAB[0]);
    // gorget lames under the chin
    g.line(16, 34, 32, 34, '1'); g.line(17, 35, 31, 35, SIDE[2]); g.px(31, 35, FRONT[3]);
    g.line(17, 36, 31, 36, '1'); g.line(18, 37, 30, 37, SIDE[1]); g.px(30, 37, FRONT[2]);
    // near pauldron (his right): big, in shadow, cracked open with light inside
    shadeDome(g, 7, 45, 13, 10, DOME_DARK, 1);
    for (let x = 0; x <= 19; x++) {
      const y = R(39 + Math.pow((x - 7) / 13, 2) * 7);
      if (g.get(x, y) != null && g.get(x, y + 1) != null) { g.px(x, y, '1'); g.px(x, y + 1, x > 10 ? DOME_DARK[3] : DOME_DARK[2]); }
    }
    if (!cold) {
      crackPath(g, [[17, 37], [14, 40], [15, 42], [11, 45], [12, 47]], stage ? 'o' : 'n', 'l');
      g.px(14, 41, 'p'); g.px(13, 43, stage ? 'q' : 'p'); g.px(12, 44, 'o');
      if (stage === 1) { crackPath(g, [[3, 40], [6, 43], [5, 46], [7, 47]], 'n', 'l'); g.px(6, 44, 'o'); }
    } else {
      crackPath(g, [[17, 37], [14, 40], [15, 42], [11, 45], [12, 47]], '2', '3');
    }

    // ---- the helm
    for (const [y, l, r] of PH_ROWS) {
      for (let x = l; x <= r; x++) {
        let c;
        if (x < RIDGE) c = x === l ? SIDE[1] : x > RIDGE - 3 ? SIDE[2] : SIDE[x < l + 4 ? 0 : 1];
        else if (x === RIDGE) c = FRONT[3];
        else { const t = (x - RIDGE) / (r - RIDGE); c = t > 0.85 ? FRONT[4] : t > 0.6 ? FRONT[3] : t > 0.3 ? FRONT[2] : FRONT[1]; }
        g.px(x, y, c);
      }
    }
    // rounded crown: dark on the far side, lit on the right
    for (let y = 7; y <= 11; y++) for (let x = 12; x <= 34; x++) {
      if (g.get(x, y) == null) continue;
      const nx = (x - 23) / 12;
      g.px(x, y, nx > 0.55 ? FRONT[4] : nx > 0.15 ? FRONT[3] : nx > -0.3 ? FRONT[2] : SIDE[2]);
    }
    g.line(13, 11, 34, 11, SIDE[0]);
    g.line(14, 12, 33, 12, SIDE[1]); for (let x = RIDGE; x <= 33; x++) g.px(x, 12, FRONT[2]);
    // brow band with rivets
    for (let x = 11; x <= 35; x++) { g.px(x, 15, x < RIDGE ? SIDE[2] : FRONT[3]); g.px(x, 16, '1'); }
    g.px(35, 15, FRONT[4]); g.px(34, 15, FRONT[4]);
    for (const x of [14, 19, 28, 33]) g.px(x, 15, x < RIDGE ? SIDE[2] === '3' ? '5' : '4' : FRONT[4]);
    // visor slit in the middle of the face plate
    const SX = 29;
    const SLIT = cold ? ['w', 'x', 'y', 'y', 'y', 'x', 'x', 'w', 'w', 'v'] : stage === 1 ? ['n', 'o', 'p', 'q', 'q', 'p', 'o', 'o', 'n', 'm'] : ['n', 'o', 'p', 'p', 'q', 'p', 'o', 'o', 'n', 'l'];
    const BLEED = cold ? ['u', 'v'] : ['l', 'm'];
    for (let i = 0; i < 12; i++) {
      const y = 18 + i, c = SLIT[Math.floor(i * SLIT.length / 12)];
      g.px(SX, y, c); g.px(SX + 1, y, i > 1 && i < 10 ? c : '1');
      g.px(SX - 1, y, '0'); g.px(SX + 2, y, '1');
      if (i > 3 && i < 9) g.px(SX - 2, y, BLEED[0]);
      if (i > 1 && i < 10) g.px(SX + 3, y, i > 3 && i < 8 ? BLEED[1] : BLEED[0]);
    }
    g.px(SX, 17, '1'); g.px(SX + 1, 17, '1');
    // breathing holes, lower ridge
    for (const [x, y] of [[34, 25], [33, 26], [34, 27], [33, 28], [34, 29]]) g.px(x, y, '1');
    for (let y = 30; y <= 33; y++) { g.px(SX, y, FRONT[3]); g.px(SX - 1, y, SIDE[1]); }
    // cracks burning in the shadowed side of the helm
    if (!cold) {
      crackPath(g, [[15, 9], [17, 12], [16, 14]], 'l', 'k');
      crackPath(g, [[16, 17], [18, 20], [17, 23], [19, 26]], stage ? 'o' : 'n', 'l');
      g.px(18, 21, stage ? 'p' : 'o');
      if (stage === 1) {
        crackPath(g, [[13, 25], [15, 27], [14, 30]], 'n', 'l'); g.px(15, 28, 'o');
        crackPath(g, [[27, 8], [26, 11]], 'n', 'k');
        crackPath(g, [[21, 29], [22, 32]], 'o', 'l');
      }
    } else {
      crackPath(g, [[16, 17], [18, 20], [17, 23], [19, 26]], '2', '3');
      crackPath(g, [[13, 25], [15, 27], [14, 30]], '2', '3');
    }
    // the wick-spike: blackened, bent at the tip like a snuffed wick
    g.rect(22, 5, 3, 2, '2'); g.px(24, 5, '3');
    g.line(23, 2, 23, 4, '1'); g.px(24, 3, '2'); g.px(24, 2, '2');
    g.px(24, 1, '1'); g.px(25, 0, cold ? '4' : stage ? 'n' : 'l');
    g.outline('0');
    // rim light on the right-hand edges
    for (const [y, , r] of PH_ROWS) if (y > 9 && y < 32) g.px(r, y, cold ? '8' : '7');
    // ash
    const ash = [[4, 38], [9, 36], [37, 39], [44, 42], [20, 40], [12, 19], [31, 13], [26, 38], [7, 42], [40, 38], [17, 29], [35, 30]];
    const n = stage === 0 ? 3 : stage === 1 ? 7 : 12;
    ash.slice(0, n).forEach(([x, y], i) => { const c = g.get(x, y); if (c != null && c !== '0') g.px(x, y, i % 2 ? '7' : '8'); });
    const drift = stage === 0 ? [[40, 10]] : stage === 1 ? [[40, 10], [7, 22], [43, 26]] : [[40, 10], [7, 22], [43, 26], [5, 8], [38, 20], [9, 30]];
    drift.forEach(([x, y], i) => g.px(x, y, i % 2 ? '6' : '7'));
  }
  art.portrait('brand', { w: 48, h: 48, count: 3, draw: portraitBrand });

  // ------------------------------------------------------------------ TITLE KEY ART 'title_knight' (64x96)
  // Three-quarter front, head bowed, both hands on Vigil's pommel, the blade planted before him.
  // Backlit by the Pyre: a dark figure with a burning rim, ember in the visor and the cracks.
  function thick(g, x0, y0, x1, y1, w, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) g.circle(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, w / 2 - 0.5, c);
  }
  function titleKnight(g, f) {
    const CR = [['n', 'o', 'p'], ['o', 'p', 'q'], ['n', 'o', 'p'], ['m', 'n', 'o']][f];
    const T = art.grid(64, 96); // everything that gets the rim light
    // ---- legs: his right planted forward, his left set back
    const lg = art.grid(64, 96);
    thick(lg, 38, 58, 41, 74, 8, '2'); thick(lg, 41, 74, 42, 87, 6, '2');
    lg.poly([[37, 92], [38, 87], [45, 87], [48, 90], [47, 92]], '2'); lg.line(39, 88, 45, 88, '3');
    lg.ellipse(41, 75, 3, 2, '3'); lg.px(42, 74, '4');
    thick(lg, 42, 77, 43, 86, 1, '3');
    const ln = art.grid(64, 96);
    thick(ln, 28, 58, 23, 76, 9, '2'); thick(ln, 23, 76, 22, 89, 7, '2');
    thick(ln, 26, 60, 21, 74, 2, '3'); thick(ln, 20, 79, 20, 88, 2, '3'); thick(ln, 22, 79, 22, 88, 1, '4');
    ln.ellipse(23, 77, 4, 3, '3'); ln.ellipse(22, 76, 2, 1, '5'); ln.px(21, 75, '6');
    ln.poly([[16, 94], [15, 92], [18, 89], [26, 89], [27, 94]], '2'); ln.line(17, 90, 25, 90, '4'); ln.line(15, 93, 27, 93, '1'); ln.px(18, 90, '5');
    over(lg, ln, '1');
    over(T, lg);
    // ---- the tabard: long, torn, stirring at the hem
    const hem = [[0, 1, 0, -1, 1], [1, 0, -1, 0, 0], [0, -1, 0, 1, -1], [-1, 0, 1, 0, 0]][f];
    const tab = art.grid(64, 96);
    tab.poly([[27, 33], [39, 33], [41, 56], [44 + hem[4], 79 + hem[1]], [39, 84 + hem[2]], [36, 80], [33, 85 + hem[0]], [30, 80], [26, 84 + hem[3]], [22 - hem[4], 79 + hem[2]], [25, 56]], '4');
    tab.line(29, 58, 26, 81, '3'); tab.line(37, 58, 40, 80, '3'); tab.line(24, 60, 23, 78, '3');
    tab.line(30, 58, 28, 80, '5'); tab.line(38, 60, 41, 78, '5'); tab.line(27, 34, 27, 54, '5');
    // torn strips hanging below the hem, lifting on the draught
    tab.line(24 - hem[4], 80, 23 - hem[4] + hem[1], 86, '3'); tab.line(41, 81, 42 + hem[3], 87, '3');
    // the Open Hand, faint on the chest
    tab.px(33, 37, 'l'); tab.px(33, 38, CR[0] === 'm' ? 'l' : 'm'); tab.px(32, 39, 'k');
    tab.px(30, 39, '3'); tab.px(36, 39, '3'); tab.line(30, 40, 31, 41, '3'); tab.line(36, 40, 35, 41, '3'); tab.line(31, 42, 35, 42, '3');
    // breastplate edges at the sides of the tabard
    const bp = art.grid(64, 96);
    bp.poly([[24, 33], [42, 33], [44, 45], [41, 56], [25, 56], [22, 45]], '2');
    bp.line(24, 44, 26, 55, '3'); bp.line(42, 44, 40, 55, '3');
    over(T, bp); over(T, tab);
    // ---- belt
    T.rect(25, 55, 17, 3, 'a'); T.line(25, 55, 41, 55, 'b'); T.rect(32, 55, 3, 3, 'J'); T.px(32, 55, 'K');
    // ---- arms: elbows out, both gauntlets on the pommel
    const arms = art.grid(64, 96);
    thick(arms, 19, 42, 17, 58, 7, '2'); thick(arms, 17, 58, 28, 52, 6, '2');
    thick(arms, 47, 42, 49, 57, 6, '2'); thick(arms, 49, 57, 38, 52, 5, '2');
    thick(arms, 17, 45, 15, 56, 2, '3'); thick(arms, 19, 60, 27, 55, 2, '3');
    thick(arms, 49, 45, 50, 55, 1, '3'); thick(arms, 47, 59, 40, 54, 1, '3');
    arms.line(20, 56, 26, 52, '4'); arms.line(46, 55, 40, 52, '3');
    arms.ellipse(17, 58, 3, 3, '3'); arms.px(16, 57, '5'); arms.px(17, 56, '4');
    arms.ellipse(49, 57, 3, 2, '3'); arms.px(49, 56, '4');
    // scorched tin tag knotted to his left wrist
    arms.px(41, 55, '7'); arms.px(41, 56, '8'); arms.px(42, 56, '5'); arms.px(42, 55, '4');
    over(T, arms, '1');
    // ---- pauldrons (his right cracked open, screen-left)
    const pl = art.grid(64, 96);
    pl.ellipse(22, 37, 8, 7, '2'); pl.ellipse(21, 35, 6, 4, '3'); pl.ellipse(20, 34, 3, 2, '4'); pl.px(18, 33, '5'); pl.px(19, 32, '6');
    for (const [y, x0, x1] of [[42, 15, 29], [45, 16, 27]]) { pl.line(x0, y, x1, y, '1'); pl.line(x0 + 1, y + 1, x1 - 1, y + 1, '3'); }
    pl.line(17, 47, 26, 47, '2');
    pl.line(27, 31, 24, 35, 'l'); pl.line(24, 35, 25, 38, 'l'); pl.line(25, 38, 21, 42, 'l'); pl.line(21, 42, 22, 46, 'l');
    pl.line(26, 31, 23, 35, CR[0]); pl.line(23, 35, 24, 38, CR[1]); pl.line(24, 38, 20, 42, CR[1]); pl.line(20, 42, 21, 46, CR[0]);
    pl.px(24, 37, CR[2]); pl.px(22, 40, CR[2]);
    over(T, pl, '1');
    const pr = art.grid(64, 96);
    pr.ellipse(44, 37, 7, 6, '2'); pr.ellipse(45, 35, 5, 3, '3'); pr.ellipse(46, 34, 3, 1, '4'); pr.px(47, 33, '5');
    for (const [y, x0, x1] of [[41, 38, 50], [44, 39, 49]]) { pr.line(x0, y, x1, y, '1'); pr.line(x0 + 1, y + 1, x1 - 1, y + 1, '3'); }
    over(T, pr, '1');
    // ---- gorget and helm, bowed a little, turned toward his right hand
    const hm = art.grid(64, 96);
    hm.rect(27, 29, 13, 5, '2'); hm.line(27, 31, 39, 31, '1'); hm.line(28, 32, 38, 32, '3');
    for (let y = 12; y <= 30; y++) {
      const l = y < 14 ? 26 - (y - 12) : y > 27 ? 24 + (y - 27) : 24;
      const r = y < 14 ? 40 + (y - 12) : y > 27 ? 42 - (y - 27) : 42;
      for (let x = l; x <= r; x++) hm.px(x, y, x < 29 ? '2' : x < 33 ? '3' : x === 33 ? '5' : x < 39 ? '4' : '3');
    }
    hm.ellipse(33, 12, 8, 3, '3'); hm.ellipse(34, 11, 6, 2, '4'); hm.line(31, 10, 37, 10, '5'); hm.px(35, 10, '6');
    hm.line(25, 15, 41, 15, '1'); hm.line(25, 16, 41, 16, '3'); [27, 31, 38].forEach((x) => hm.px(x, 16, '5'));
    const VS = [['n', 'o', 'p', 'q', 'p', 'o', 'n'], ['o', 'p', 'q', 'q', 'q', 'p', 'o'], ['n', 'o', 'p', 'p', 'p', 'o', 'n'], ['n', 'o', 'p', 'q', 'p', 'o', 'm']][f];
    for (let i = 0; i < 10; i++) {
      const y = 18 + i;
      hm.px(34, y, VS[Math.floor(i * VS.length / 10)]); hm.px(35, y, i > 1 && i < 8 ? VS[2] : '1');
      hm.px(33, y, '0'); hm.px(36, y, i > 2 && i < 8 ? 'l' : '1');
    }
    hm.px(32, 22, 'k'); hm.px(32, 23, 'k'); hm.px(37, 22, 'k'); hm.px(37, 23, 'k');
    for (const [x, y] of [[39, 23], [40, 25], [39, 27]]) hm.px(x, y, '1');
    hm.line(27, 19, 29, 22, 'l'); hm.line(29, 22, 28, 25, 'l'); hm.px(28, 23, CR[0]); hm.px(29, 21, CR[0]);
    hm.line(34, 28, 34, 30, '4');
    over(T, hm, '1');
    // ---- rim light from the fire behind (outer silhouette only, flickering)
    const ext = new Uint8Array(64 * 96);
    const stack = [[0, 0]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= 64 || y >= 96 || ext[y * 64 + x] || T.get(x, y) != null) continue;
      ext[y * 64 + x] = 1;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    for (let y = 0; y < 96; y++) for (let x = 0; x < 64; x++) if (!ext[y * 64 + x] && T.get(x, y) == null) T.px(x, y, '1');
    const out = (x, y) => x < 0 || y < 0 || x >= 64 || y >= 96 || ext[y * 64 + x] === 1;
    const rim = [];
    for (let y = 0; y < 96; y++) for (let x = 0; x < 64; x++) {
      const c = T.get(x, y);
      if (c == null || 'lmnopqk'.includes(c)) continue;
      const L = out(x - 1, y), Rr = out(x + 1, y), U = out(x, y - 1);
      const k = (x * 7 + y * 3 + f * 5) % 11;
      if (U && y < 48) rim.push([x, y, k < 2 ? 'o' : 'n']);
      else if ((L || Rr) && y < 50) rim.push([x, y, k < 1 ? 'n' : 'm']);
      else if (L || Rr) rim.push([x, y, y < 66 ? 'm' : 'l']);
      else if (U) rim.push([x, y, 'l']);
    }
    for (const [x, y, c] of rim) T.px(x, y, c);
    g.blit(T, 0, 0);
    // ---- the wick-spike (blackened, never lit by the rim)
    g.rect(32, 7, 3, 2, '2'); g.line(33, 2, 33, 6, '1'); g.px(34, 3, '2'); g.px(34, 2, '1'); g.px(35, 1, ['l', 'm', 'l', 'k'][f]);
    // ---- Vigil: a long notched blade driven into the ground
    const sw = art.grid(64, 96);
    for (let y = 60; y <= 93; y++) {
      const half = y < 84 ? 2 : y < 89 ? 1 : 0;
      for (let x = 33 - half; x <= 33 + half; x++) {
        let c = x === 33 - half ? '8' : x === 33 + half ? '5' : '7';
        if (half === 2 && x === 33 && y > 62 && y < 82) c = '5';
        sw.px(x, y, c);
      }
    }
    for (const [x, y] of [[31, 68], [31, 69], [35, 74], [31, 79], [35, 64]]) sw.px(x, y, null);
    sw.px(34, 88, '6'); sw.px(33, 93, '6');
    sw.px(32, 61 + [0, 1, 0, 2][f], 'o'); sw.px(34, 65, 'l');
    // crossguard: a heavy dark bar with ball finials
    sw.rect(22, 58, 23, 2, '2'); sw.line(22, 57, 44, 57, '4'); sw.line(23, 57, 43, 57, '3'); sw.line(25, 57, 30, 57, '5');
    sw.circle(21, 58, 1, '3'); sw.px(20, 57, '5'); sw.circle(45, 58, 1, '2'); sw.px(45, 57, '4');
    sw.rect(31, 57, 5, 4, '3'); sw.px(32, 58, '6'); sw.px(33, 59, 'l');
    sw.rect(32, 55, 3, 3, 'a');
    // pommel and the two gauntlets gripping beneath it
    sw.stamp(24, 44, [
      '........365........',
      '.......37763.......',
      '.......36652.......',
      '....2333aba3332....',
      '...245554b455542...',
      '...2344431344432...',
      '...2111112111112...',
      '...2344432344432...',
      '...2111112111112...',
      '...2344432344432...',
      '....23332.23332....',
      '.....222...222.....',
    ]);
    over(g, sw, '1');
    g.outline('0');
    // ---- ash lifting off the shoulders, and a few sparks, drifting on the heat
    const ASH = [[14, 30, 0], [20, 28, 1], [25, 29, 2], [43, 29, 3], [48, 30, 1], [52, 32, 2], [11, 34, 3], [38, 27, 0]];
    for (const [x0, y0, ph] of ASH) {
      const t = (f + ph) % 4, x = x0 + t * 2 + (ph % 2), y = y0 - t * 5 - 2;
      if (y >= 0 && g.get(x, y) == null) g.px(x, y, t < 2 ? '8' : t < 3 ? '7' : '6');
    }
    [[18, 24], [47, 22]].forEach(([x0, y0], i) => {
      const t = (f + i * 2) % 4, x = x0 + t, y = y0 - t * 6;
      if (y >= 0 && g.get(x, y) == null) g.px(x, y, t < 2 ? 'o' : 'n');
    });
  }
  art.sheet('title_knight', { w: 64, h: 96, ox: 32, oy: 95, anims: {
    idle: { fps: 3, count: 4, draw: titleKnight },
  } });

})(window.AV);
