// ASHEN VOW — BOSS 4: SER ODO VARR, THE OSSUARY WARDEN (ossuary_heart). Art + behaviour.
// The mirror of the player: a telegraphed three-swing combo, shield bash, leaping slam, a roll, a brief guard.
// Phase 2 (50%): he tears off his helm and calls his company (roll-call flags decide who answers).
(function (AV) {
  'use strict';
  const U = AV.util;
  const S = AV.state;
  const PI = Math.PI;

  // ================================================================================ ART
  // Frame 52×52, feet at (22, 49). All pose numbers below are relative to the feet, x forward (he faces RIGHT).
  const FW = 52, FH = 52, CX = 22, GY = 49;

  const hsh = (x, y, s) => U.hash2(x | 0, y | 0, s | 0) / 4294967296;
  function put(g, x, y, s) { for (let i = 0; i < s.length; i++) if (s[i] !== '.') g.px(x + i, y, s[i]); }
  // square-brush line
  function thick(g, x0, y0, x1, y1, w, c) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    const o = (w - 1) / 2;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      g.rect(Math.round(x0 + (x1 - x0) * t - o), Math.round(y0 + (y1 - y0) * t - o), w, w, c);
    }
  }
  // line that only recolours pixels whose colour is in `only`
  function lineOn(g, x0, y0, x1, y1, c, only) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t);
      const cur = g.get(x, y);
      if (cur != null && only.indexOf(cur) >= 0) g.px(x, y, c);
    }
  }

  // ---------------------------------------------------------------- legs
  function legPts(p) {
    const c = p.crouch || 0, st = p.stance || 'stand', h = Math.round((p.lx || 0) * 0.4);
    let hipY = -12 + c, far, near;
    const L = (hip, knee, foot) => ({ hip, knee, foot });
    if (st === 'stand') {
      const s = p.step || 0;
      const ff = [-3, -1, 3, 1][s], nf = [3, 1, -3, -1][s];
      const fl = s === 3 ? -2 : 0, nl = s === 1 ? -2 : 0;
      far = L([h - 1, hipY], [(h - 1 + ff) / 2 + 1 + c * 0.6, (hipY + fl) / 2], [ff, fl]);
      near = L([h + 1, hipY], [(h + 1 + nf) / 2 + 1 + c * 0.6, (hipY + nl) / 2], [nf, nl]);
    } else if (st === 'wide') {
      const sp = 6 + Math.min(2, c * 0.4);
      far = L([h - 1, hipY], [h - 1 - sp / 2 + 1 + c * 0.3, hipY / 2], [-sp + h * 0.5, 0]);
      near = L([h + 1, hipY], [h + 1 + sp / 2 + 1 + c * 0.6, hipY / 2], [sp + h * 0.5, 0]);
    } else if (st === 'lunge') {
      hipY += 1;
      far = L([h - 1, hipY], [h - 5, hipY / 2 + 0.5], [-9 + h * 0.3, 0]);
      near = L([h + 1, hipY], [h + 7, Math.min(-4, hipY + 4)], [h + 8, 0]);
    } else if (st === 'tuck') {
      hipY = -14 + c;
      far = L([h - 1, hipY], [h + 3, hipY + 3], [h - 2, hipY + 9]);
      near = L([h + 1, hipY], [h + 5, hipY + 4], [h + 1, hipY + 10]);
    } else if (st === 'kneel') {
      hipY = -9 + c;
      far = L([h - 1, hipY], [h + 1, -1], [h - 6, -1]);
      near = L([h + 1, hipY], [h + 7, hipY + 1], [h + 7, 0]);
    } else { // sit
      hipY = -15;
      far = L([h - 3, hipY], [h + 4, hipY - 1], [h + 4, 0]);
      near = L([h - 2, hipY + 1], [h + 5, hipY], [h + 6, 0]);
    }
    return { hipY, far, near };
  }
  function legDraw(g, Lg, far) {
    const d = far ? '3' : '4', m = far ? '4' : '5', l = far ? '5' : '7';
    const hip = [CX + Lg.hip[0], GY + Lg.hip[1]], knee = [CX + Lg.knee[0], GY + Lg.knee[1]], foot = [CX + Lg.foot[0], GY + Lg.foot[1]];
    thick(g, hip[0], hip[1], knee[0], knee[1], 4, d);
    thick(g, knee[0], knee[1], foot[0], foot[1] - 1, 3, d);
    thick(g, hip[0] + 0.5, hip[1] - 0.5, knee[0] + 0.5, knee[1] - 0.5, 2, m);
    lineOn(g, knee[0] + 1, knee[1], foot[0] + 1, foot[1] - 2, m, d);
    // knee cop
    const kx = Math.round(knee[0]), ky = Math.round(knee[1]);
    g.rect(kx - 1, ky - 1, 3, 3, m); g.px(kx + 1, ky - 1, l); g.px(kx - 1, ky + 1, d);
    // sabaton
    const fx = Math.round(foot[0]), fy = Math.round(foot[1]);
    g.rect(fx - 2, fy - 1, 5, 2, d); put(g, fx - 1, fy - 1, m + m + m); g.px(fx + 2, fy - 1, l);
    if (!far) g.px(kx, ky + 3, 'b');
  }

  // ---------------------------------------------------------------- torso (ux, uy = waist, absolute)
  const CRACK = [[1, -9, 'l'], [1, -8, 'm'], [0, -7, 'n'], [0, -6, 'm'], [-1, -5, 'l'], [0, -4, 'k']];
  function torsoDraw(g, ux, uy) {
    g.poly([[ux - 5, uy], [ux - 6, uy - 6], [ux - 5, uy - 11], [ux + 4, uy - 11], [ux + 6, uy - 7], [ux + 5, uy - 3], [ux + 4, uy]], '5');
    for (let y = uy - 11; y <= uy; y++) for (let x = ux - 6; x <= ux + 6; x++) {
      if (g.get(x, y) !== '5') continue;
      const rx = x - ux, ry = y - uy;
      if (rx <= -4) g.px(x, y, '4');
      else if (rx <= -3 && ry > -8) g.px(x, y, '4');
      else if (rx >= 2 && ry <= -6 && ry >= -10) g.px(x, y, rx >= 4 ? '7' : '6');
      else if (hsh(rx, ry, 11) < 0.14) g.px(x, y, hsh(rx, ry, 12) < 0.5 ? 'b' : '3');
    }
    // the burned seam across the breastplate still glows
    for (const [x, y, c] of CRACK) g.px(ux + x, uy + y, c);
    // gorget
    put(g, ux - 3, uy - 12, '555566'); put(g, ux - 3, uy - 11, '444444');
    // belt, faulds
    put(g, ux - 5, uy, '1111111K11'); g.px(ux + 3, uy, 'L');
    put(g, ux - 5, uy + 1, '5565656566'); put(g, ux - 5, uy + 2, '4444444444');
    // the rag of a tabard (Harrow wine), burned short
    const len = [5, 4, 5, 3];
    for (let i = 0; i < 4; i++) for (let j = 0; j < len[i]; j++) g.px(ux + i, uy + 1 + j, j === len[i] - 1 ? 'b' : i === 0 ? 'H' : 'G');
    // near pauldron
    g.ellipse(ux, uy - 10, 4, 2.5, '5');
    g.ellipse(ux + 0.5, uy - 11, 3, 1.5, '6');
    g.px(ux + 2, uy - 12, '7'); g.px(ux + 1, uy - 12, '7'); g.px(ux - 3, uy - 9, '4'); g.px(ux - 2, uy - 9, 'b');
  }

  // ---------------------------------------------------------------- heads (x, y = bottom centre)
  function helmDraw(g, x, y) {
    x = Math.round(x); y = Math.round(y);
    g.rect(x - 4, y - 9, 9, 9, '5');
    put(g, x - 3, y - 10, '5555555');
    g.px(x - 4, y - 9, null);
    for (let j = 1; j < 9; j++) { g.px(x - 4, y - 9 + j, '4'); g.px(x - 3, y - 9 + j, j > 5 ? '4' : '5'); }
    put(g, x - 3, y - 10, '444');
    g.rect(x + 1, y - 9, 4, 3, '6'); put(g, x + 1, y - 10, '777'); g.px(x + 4, y - 8, '7');
    for (let j = 2; j < 9; j++) g.px(x + 2, y - 10 + j, j < 5 ? '7' : '6');   // the ridge down the face
    put(g, x, y - 5, '11111');                                                // visor slit
    g.px(x + 3, y - 3, '2'); g.px(x + 3, y - 2, '2'); g.px(x + 1, y - 2, '2'); // breaths
    g.px(x - 2, y - 7, 'b'); g.px(x - 1, y - 3, 'b'); g.px(x - 3, y - 2, '3'); g.px(x + 4, y - 1, 'b'); g.px(x, y - 8, 'c');
    put(g, x - 4, y - 1, '4444');
  }
  function bareHead(g, x, y) {
    x = Math.round(x); y = Math.round(y);
    g.ellipse(x + 0.5, y - 4.5, 3.8, 4.6, 'i');
    for (let yy = y - 10; yy <= y; yy++) for (let xx = x - 4; xx <= x + 5; xx++) {
      const c = g.get(xx, yy);
      if (c !== 'i') continue;
      const rx = xx - x, ry = yy - y;
      if (ry <= -7 || (rx <= -2 && ry <= -3)) g.px(xx, yy, hsh(xx, yy, 3) < 0.35 ? '7' : '6');   // cropped grey hair
      else if (rx <= -1) g.px(xx, yy, 'h');
      else if (rx >= 2 && ry <= -5) g.px(xx, yy, 'j');
    }
    g.px(x + 5, y - 5, 'i'); g.px(x + 5, y - 4, 'h');          // nose
    g.px(x + 3, y - 6, '1'); g.px(x + 2, y - 6, 'h');          // eye
    put(g, x + 2, y - 7, '55');                                // brow
    // the burn: across the scalp and down the far cheek
    g.px(x, y - 7, 'l'); g.px(x - 1, y - 7, 'H'); g.px(x - 2, y - 6, 'k'); g.px(x, y - 5, 'H'); g.px(x - 1, y - 4, 'l'); g.px(x, y - 3, 'H');
    g.px(x - 1, y - 5, 'j');                                   // the ear, what is left of it
    // grey stubble
    put(g, x + 1, y - 2, 'N6N'); put(g, x + 1, y - 1, '.NN'); g.px(x + 4, y - 3, 'h'); g.px(x + 3, y - 3, 'N');
  }

  // ---------------------------------------------------------------- the shield (heater, Harrow wine with a gold chevron)
  function shieldDraw(g, cx, cy, rot, sq, s, weld) {
    sq = sq || 1; s = s || 1; rot = rot || 0;
    const hw = 4.5 * sq * s, hh = 7.5 * s;
    const co = Math.cos(rot), si = Math.sin(rot);
    const inside = (u, v) => {
      if (v < -hh || v > hh) return false;
      const k = v <= hh * 0.1 ? 1 : 1 - (v - hh * 0.1) / (hh * 0.95);
      return Math.abs(u) <= hw * k + 0.2;
    };
    const R = Math.ceil(Math.max(hw, hh)) + 1;
    for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const u = dx * co + dy * si, v = -dx * si + dy * co;
      if (!inside(u, v)) continue;
      const edge = !inside(u - 1, v) || !inside(u + 1, v) || !inside(u, v - 1) || !inside(u, v + 1);
      let c;
      if (edge) c = v < -hh + 1.2 ? '7' : u > 0 ? '6' : '5';
      else {
        c = u > 0.6 && v < 0 ? 'H' : (u < -1.2 || v > hh * 0.5) ? 'F' : 'G';
        const ch = v - (-2.2 * s + Math.abs(u) * 0.95);
        if (ch >= 0 && ch < 1.7 && Math.abs(u) < hw - 1) c = ch < 0.8 ? 'M' : 'L';
        const n = hsh(Math.round(u * 2) + 40, Math.round(v * 2) + 40, 9);
        if (n < 0.13) c = 'b'; else if (n > 0.96) c = '2';
      }
      g.px(x, y, c);
    }
    if (weld) {
      // the seam where the arm was welded to the shield: still molten
      for (let v = -1; v <= 2; v++) {
        const u = -hw + 0.6;
        g.px(Math.round(cx + u * co - v * si), Math.round(cy + u * si + v * co), v % 2 ? 'n' : 'm');
      }
    }
  }

  // ---------------------------------------------------------------- broadsword (hx, hy = the fist on the grip)
  function swordDraw(g, hx, hy, a, clipY) {
    const ux = Math.cos(a), uy = Math.sin(a);
    let nx = -uy, ny = ux;
    if (ny < 0 || (Math.abs(ny) < 0.01 && nx < 0)) { nx = -nx; ny = -ny; }
    const P = (t, o) => [Math.round(hx + ux * t + nx * o), Math.round(hy + uy * t + ny * o)];
    const set = (q, c) => { if (clipY == null || q[1] <= clipY) g.px(q[0], q[1], c); };
    for (let t = 2; t <= 15.6; t += 0.35) {
      if (t < 14.2) set(P(t, 1), '6');
      set(P(t, 0), t > 14.3 ? '9' : '8');
    }
    set(P(5, 0), '9'); set(P(9, 1), '5');
    for (let o = -2.5; o <= 2.5; o += 0.5) set(P(1.3, o), Math.abs(o) > 2 ? 'L' : 'K');
    for (let t = -2; t <= 0.5; t += 0.5) set(P(t, 0), 'b');
    set(P(-3, 0), 'L');
  }
  function armDraw(g, sx, sy, hx, hy) {
    const dx = hx - sx, dy = hy - sy, d = Math.max(0.01, Math.hypot(dx, dy));
    const l = 6.2;
    let ex, ey;
    if (d >= 2 * l - 0.3) { ex = (sx + hx) / 2; ey = (sy + hy) / 2; }
    else {
      const off = Math.sqrt(l * l - (d / 2) * (d / 2));
      let px = -dy / d, py = dx / d;
      if (Math.abs(py) < 0.2 ? px < 0 : py < 0) { px = -px; py = -py; }   // the elbow hangs down (or forward)
      ex = (sx + hx) / 2 + px * off; ey = (sy + hy) / 2 + py * off;
    }
    thick(g, sx, sy, ex, ey, 3, '4');
    thick(g, ex, ey, hx, hy, 3, '4');
    thick(g, sx + 0.5, sy - 0.5, ex + 0.5, ey - 0.5, 1, '6');
    thick(g, ex, ey - 0.5, hx, hy - 0.5, 1, '5');
    g.rect(Math.round(ex) - 1, Math.round(ey) - 1, 2, 2, '6');
  }
  function gauntlet(g, hx, hy) {
    const x = Math.round(hx), y = Math.round(hy);
    g.rect(x - 1, y - 1, 3, 3, '5'); g.px(x, y - 1, '7'); g.px(x + 1, y - 1, '6'); g.px(x - 1, y + 1, '4');
  }

  // ---------------------------------------------------------------- the throne of stacked shields
  const SLABS = [[-3, -1, 9, 'c'], [-2, -4, 8, 'G'], [-4, -7, 8, 't'], [-2, -10, 7, 'B'], [-3, -13, 7, 'c']];
  const PILE = [[-11, -1, 7, 'c'], [2, -1, 7, 'G'], [-5, -3, 6, 't'], [-14, -3, 4, 'B'], [-2, -5, 5, 'c']];
  function slab(g, x, y, hw, col) {
    x = Math.round(x); y = Math.round(y); hw = Math.round(hw);
    for (let i = -hw + 1; i <= hw - 1; i++) { g.px(x + i, y - 1, i > 0 ? '6' : '5'); g.px(x + i, y + 1, '3'); }
    for (let i = -hw; i <= hw; i++) g.px(x + i, y, Math.abs(i) === hw ? '5' : col);
    g.px(x, y, '7'); g.px(x + 1, y - 1, '7');
    g.px(x - hw + 2 + ((x * 7) & 3), y, 'b');
  }
  function throne(g, k) {
    if (k < 2) {
      shieldDraw(g, CX - 8 - k * 3, GY - 22 + k * 6, -0.12 - k * 0.7, 1, 1.25);
      SLABS.forEach(([x, y, hw, c], i) => slab(g, CX + x - (k ? i * 1.4 : 0), GY + y + (k ? i * 0.6 : 0), hw, c));
    } else {
      shieldDraw(g, CX - 16, GY - 5, -1.25, 1, 1);
      PILE.forEach(([x, y, hw, c]) => slab(g, CX + x, GY + y, hw, c));
    }
  }

  // slash smear around the shoulder pivot (drawn after the outline, only into empty pixels)
  function smear(g, sx, sy, a0, a1) {
    const n = 26;
    for (let i = 0; i <= n; i++) {
      const k = i / n, t = a0 + (a1 - a0) * k;
      for (const [r, c] of [[19, '9'], [17.5, '8'], [16, '7']]) {
        if (k < 0.4 && r !== 16 && i % 2) continue;
        const x = Math.round(sx + Math.cos(t) * r), y = Math.round(sy + Math.sin(t) * r * 0.85);
        if (y > GY || g.get(x, y) != null) continue;
        g.px(x, y, c);
      }
    }
  }

  // ---------------------------------------------------------------- the whole knight
  function knight(g, p) {
    const lp = legPts(p);
    const lx = p.lx || 0;
    const ux = CX + lx, uy = GY + lp.hipY - 1 + (p.by || 0);
    const offY = (lp.hipY - 1 + (p.by || 0)) + 13;             // how far the upper body sits below the standing pose
    const R = (q) => (q.abs ? [CX + q.x, GY + q.y] : [CX + q.x + lx, GY + q.y + offY]);
    if (p.throne != null) throne(g, p.throne);
    const sh = p.shield;
    const shp = R(sh);
    const sw = p.sword;
    const hand = p.hand ? R(p.hand) : sw ? R(sw) : null;
    if (sh.back) shieldDraw(g, shp[0], shp[1], sh.rot, sh.sq, sh.s, false);
    if (sw && sw.back) swordDraw(g, hand[0], hand[1], sw.a, GY);
    legDraw(g, lp.far, true);
    thick(g, ux - 2, uy - 9, shp[0] - 3, shp[1] - 1, 3, '3');   // the shield arm, mostly hidden
    lineOn(g, ux - 2, uy - 10, shp[0] - 3, shp[1] - 2, '4', '3');
    legDraw(g, lp.near, false);
    torsoDraw(g, ux, uy);
    const bow = p.bow || 0;
    const hb = [ux + 1 + bow * 0.7, uy - 12 + Math.max(0, bow) * 0.8];
    const helm = p.helm || (p.bare ? 'none' : 'on');
    if (helm === 'on') helmDraw(g, hb[0], hb[1]);
    else { bareHead(g, hb[0], hb[1]); if (helm === 'lift') helmDraw(g, hb[0] - 1, hb[1] - 4); }
    if (!sh.back) shieldDraw(g, shp[0], shp[1], sh.rot, sh.sq, sh.s, true);
    if (p.planted != null) swordDraw(g, CX + p.planted, GY - 14, PI / 2, GY);
    const sx = ux + 0.5, sy = uy - 10;
    if (hand) armDraw(g, sx, sy, hand[0], hand[1]);
    if (sw && !sw.back) swordDraw(g, hand[0], hand[1], sw.a, GY);
    if (helm === 'held' && hand) helmDraw(g, hand[0] - 0.5, hand[1] + 2);
    if (hand) gauntlet(g, hand[0], hand[1]);
    if (helm === 'fly') helmDraw(g, CX + p.helmAt[0], GY + p.helmAt[1]);
    g.outline('0');
    // ---- light after the outline
    if (helm === 'on') {
      const e = p.eye || 'o';
      g.px(Math.round(hb[0]) + 2, Math.round(hb[1]) - 5, e);
      g.px(Math.round(hb[0]) + 3, Math.round(hb[1]) - 5, e === 'o' ? 'p' : e === 'p' ? 'q' : e);
    }
    if (p.glint) {
      const gx = Math.round(shp[0] + 3), gy = Math.round(shp[1] - 6);
      g.px(gx, gy, 'q'); g.px(gx - 1, gy, '9'); g.px(gx + 1, gy, '9'); g.px(gx, gy - 1, '9'); g.px(gx, gy + 1, '9');
    }
    if (p.smear) smear(g, sx, sy, p.smear[0], p.smear[1]);
  }

  // the roll: plate curled into a ball behind the shield
  function rollBall(g, i) {
    const cx = CX + 1, cy = GY - 8;
    g.ellipse(cx, cy, 8, 7.5, '4');
    g.ellipse(cx + 1, cy - 1, 6.5, 6, '5');
    g.ellipse(cx + 2.5, cy - 3, 3, 2.5, '6');
    g.px(cx + 3, cy - 5, '7');
    const a = i === 1 ? -0.9 : 1.6;
    // the tabard rag whipping round, the glowing seam
    g.px(cx - 3, cy + 2, 'G'); g.px(cx - 4, cy + 3, 'H'); g.px(cx - 2, cy + 1, 'm'); g.px(cx - 1, cy, 'n');
    swordDraw(g, cx - 3, cy + 4, i === 1 ? 0.15 : -0.1, GY);
    shieldDraw(g, cx + Math.cos(a) * 5.5, cy + Math.sin(a) * 5.5, a + PI / 2, 1, 0.95, true);
    g.outline('0');
  }

  // ---------------------------------------------------------------- poses
  const BASE = { shield: { x: 8, y: -18 }, sword: { x: 6, y: -13, a: 0.55 } };
  const HAS_BARE = {};
  function F(p, bare) { return (g) => knight(g, Object.assign({}, BASE, p, bare ? { bare: true } : {})); }
  function combatAnims(bare) {
    const f = (list) => list.map((p) => F(p, bare));
    const W1 = { stance: 'wide', crouch: 1, shield: { x: 7, y: -17 } };
    const W2 = { stance: 'wide', shield: { x: 5, y: -16 } };
    const W3 = { stance: 'wide', crouch: 2, lx: -1, shield: { x: 7, y: -18 } };
    const LG = { stance: 'lunge', crouch: 1, lx: 2, shield: { x: 4, y: -17 } };
    return {
      idle: { fps: 2, frames: f([{}, { by: 1 }]) },
      walk: { fps: 6, frames: f([0, 1, 2, 3].map((s) => ({ step: s, by: s % 2 }))) },
      // swing 1: drawn back low behind him, then a flat cut
      wind1: { fps: 6, loop: false, frames: f([
        Object.assign({}, W1, { lx: -2, sword: { x: -5, y: -19, a: PI + 0.55, back: true } }),
        Object.assign({}, W1, { lx: -3, eye: 'p', sword: { x: -6, y: -20, a: PI + 0.45, back: true } })]) },
      strike1: { fps: 10, loop: false, frames: f([
        Object.assign({}, LG, { sword: { x: 13, y: -17, a: 0.05 }, smear: [-1.3, 0.1] }),
        Object.assign({}, LG, { sword: { x: 12, y: -15, a: 0.35 } })]) },
      // swing 2: raised high in front, then a falling diagonal
      wind2: { fps: 6, loop: false, frames: f([
        Object.assign({}, W2, { sword: { x: 7, y: -27, a: -PI / 2 - 0.7 } }),
        Object.assign({}, W2, { eye: 'p', by: -1, sword: { x: 6, y: -28, a: -PI / 2 - 0.85 } })]) },
      strike2: { fps: 10, loop: false, frames: f([
        Object.assign({}, LG, { crouch: 2, shield: { x: 5, y: -17 }, sword: { x: 12, y: -12, a: 0.95 }, smear: [-1.9, 0.95] }),
        Object.assign({}, LG, { crouch: 2, shield: { x: 5, y: -17 }, sword: { x: 11, y: -11, a: 1.1 } })]) },
      // swing 3: over the head, both feet planted — the heavy chop
      wind3: { fps: 5, loop: false, frames: f([
        Object.assign({}, W3, { sword: { x: 0, y: -32, a: PI + 0.35, back: true } }),
        Object.assign({}, W3, { crouch: 3, lx: -2, eye: 'q', sword: { x: -1, y: -33, a: PI + 0.25, back: true } })]) },
      strike3: { fps: 10, loop: false, frames: f([
        { stance: 'lunge', crouch: 3, lx: 3, shield: { x: 4, y: -14 }, sword: { x: 13, y: -9, a: 0.8 }, smear: [-2.5, 0.8] },
        { stance: 'lunge', crouch: 4, lx: 3, shield: { x: 4, y: -14 }, sword: { x: 13, y: -9, a: 1.05 } }]) },
      rec: { fps: 2, frames: f([
        { stance: 'lunge', crouch: 2, lx: 2, bow: 1, shield: { x: 6, y: -11, rot: 0.5 }, sword: { x: 12, y: -10, a: 1.2 } },
        { stance: 'lunge', crouch: 2, lx: 2, bow: 1, by: 1, shield: { x: 6, y: -11, rot: 0.5 }, sword: { x: 12, y: -10, a: 1.2 } }]) },
      // shield bash
      bash_wind: { fps: 5, loop: false, frames: f([
        { stance: 'wide', crouch: 2, lx: -1, shield: { x: 9, y: -18 }, sword: { x: -3, y: -15, a: PI - 0.45, back: true } },
        { stance: 'wide', crouch: 3, lx: -2, eye: 'p', glint: true, shield: { x: 9, y: -18 }, sword: { x: -4, y: -15, a: PI - 0.4, back: true } }]) },
      bash: { fps: 8, frames: f([
        { stance: 'lunge', crouch: 1, lx: 4, shield: { x: 13, y: -17, sq: 0.75 }, sword: { x: -1, y: -14, a: PI - 0.3, back: true } },
        { stance: 'lunge', crouch: 2, lx: 5, shield: { x: 14, y: -16, sq: 0.75 }, sword: { x: 0, y: -14, a: PI - 0.25, back: true } }]) },
      bash_rec: { fps: 2, frames: f([
        { stance: 'wide', crouch: 1, lx: 1, bow: 1, eye: 'l', shield: { x: 10, y: -7, rot: 1.0 }, sword: { x: 3, y: -12, a: 1.3 } },
        { stance: 'wide', crouch: 1, lx: 1, bow: 1, by: 1, eye: 'l', shield: { x: 10, y: -7, rot: 1.0 }, sword: { x: 3, y: -12, a: 1.3 } }]) },
      // leaping slam
      leap_wind: { fps: 5, loop: false, frames: f([
        { stance: 'wide', crouch: 4, lx: -1, shield: { x: 7, y: -16 }, sword: { x: -2, y: -30, a: PI + 0.5, back: true } },
        { stance: 'wide', crouch: 5, lx: -2, eye: 'p', shield: { x: 7, y: -16 }, sword: { x: -3, y: -30, a: PI + 0.4, back: true } }]) },
      leap_air: { fps: 3, loop: false, frames: f([
        { stance: 'tuck', shield: { x: 8, y: -20 }, sword: { x: 1, y: -33, a: PI + 0.2, back: true } },
        { stance: 'tuck', eye: 'p', shield: { x: 8, y: -19 }, sword: { x: 4, y: -30, a: -PI / 2 - 0.6 } }]) },
      slam: { fps: 3, loop: false, frames: f([
        { stance: 'lunge', crouch: 4, lx: 3, shield: { x: 4, y: -12, rot: -0.3 }, sword: { x: 12, y: -12, a: 1.3 } },
        { stance: 'lunge', crouch: 4, lx: 3, by: 1, bow: 1, shield: { x: 4, y: -12, rot: -0.3 }, sword: { x: 12, y: -12, a: 1.3 } }]) },
      roll: { fps: 9, loop: false, frames: [
        F({ stance: 'wide', crouch: 5, lx: 4, bow: 2, shield: { x: 10, y: -14 }, sword: { x: 3, y: -12, a: 0.3 } }, bare),
        (g) => rollBall(g, 1), (g) => rollBall(g, 2),
        F({ stance: 'wide', crouch: 3, lx: 1, shield: { x: 8, y: -16 }, sword: { x: 5, y: -12, a: 0.5 } }, bare)] },
      // the guard: shield up over the face, sword tucked
      guard: { fps: 3, frames: f([
        { stance: 'wide', crouch: 2, shield: { x: 8, y: -23, rot: -0.15 }, sword: { x: 4, y: -13, a: 0.2 } },
        { stance: 'wide', crouch: 2, glint: true, shield: { x: 8, y: -23, rot: -0.15 }, sword: { x: 4, y: -13, a: 0.2 } }]) },
      hurt: { fps: 1, loop: false, frames: f([{ lx: -2, by: 1, bow: -1, shield: { x: 6, y: -16 }, sword: { x: 4, y: -12, a: 0.9 } }]) },
      call: { fps: 3, frames: f([
        { stance: 'wide', lx: -1, shield: { x: 6, y: -17 }, sword: { x: 5, y: -31, a: -PI / 2 - 0.45 } },
        { stance: 'wide', lx: -1, by: 1, shield: { x: 6, y: -17 }, sword: { x: 5, y: -30, a: -PI / 2 - 0.4 } }]) },
    };
  }

  const SIT = { stance: 'sit', bow: 2, throne: 0, planted: 12, sword: null, hand: { x: 12, y: -16, abs: true }, shield: { x: 3, y: -8, rot: 0.25, abs: true, back: true } };
  const anims = {
    // before the fight (also the NPC): seated on the stacked shields, head bowed, a hand on the planted sword
    sit: { fps: 1.2, frames: [F(Object.assign({}, SIT, { eye: 'l' })), F(Object.assign({}, SIT, { eye: 'm', by: 1 }))] },
    // intro: he stands; the stack gives way behind him
    rise: { fps: 4, loop: false, frames: [
      F(Object.assign({}, SIT, { eye: 'o' })),
      F(Object.assign({}, SIT, { bow: 0, eye: 'p' })),
      F({ stance: 'wide', crouch: 5, lx: 2, throne: 1, planted: 12, sword: null, hand: { x: 12, y: -16, abs: true }, shield: { x: 7, y: -15 } }),
      F({ stance: 'stand', crouch: 1, throne: 2, shield: { x: 7, y: -17 }, sword: { x: 10, y: -17, a: 1.45 } }),
      F({ throne: 2 })] },
    // the scattered stack, left on the floor as a decal once he is up
    shields: { fps: 1, frames: [(g) => { throne(g, 2); g.outline('0'); }] },
    // phase 2: the helm comes off
    unhelm: { fps: 5, loop: false, frames: [
      F({ planted: 11, sword: null, hand: { x: 4, y: -26 }, shield: { x: 7, y: -17 } }),
      F({ planted: 11, sword: null, hand: { x: 4, y: -30 }, helm: 'lift', lx: -1, bow: -1, shield: { x: 7, y: -17 } }),
      F({ planted: 11, sword: null, hand: { x: 1, y: -36 }, helm: 'held', lx: -1, shield: { x: 7, y: -17 } }),
      F({ planted: 11, sword: null, hand: { x: -8, y: -23 }, helm: 'fly', helmAt: [-18, -30], lx: -1, shield: { x: 7, y: -17 } }),
      F({ planted: 11, sword: null, hand: { x: 11, y: -16, abs: true }, helm: 'none', crouch: 1, shield: { x: 7, y: -17 } }),
      F({ helm: 'none' })] },
    // death: to one knee, the sword planted, head bowed
    die: { fps: 3, loop: false, frames: [
      F({ bare: true, lx: -2, by: 1, bow: -1, shield: { x: 6, y: -16 }, sword: { x: 4, y: -12, a: 0.9 } }),
      F({ bare: true, stance: 'wide', crouch: 4, bow: 1, shield: { x: 6, y: -12, rot: 0.4 }, sword: { x: 10, y: -12, a: 1.35 } }),
      F({ bare: true, stance: 'kneel', bow: 1, planted: 10, sword: null, hand: { x: 10, y: -16, abs: true }, shield: { x: 4, y: -6, rot: 0.35, abs: true } }),
      F({ bare: true, stance: 'kneel', bow: 2, by: 1, planted: 10, sword: null, hand: { x: 10, y: -16, abs: true }, shield: { x: 4, y: -6, rot: 0.35, abs: true } }),
      F({ bare: true, stance: 'kneel', bow: 3, by: 2, planted: 10, sword: null, hand: { x: 10, y: -16, abs: true }, shield: { x: 4, y: -6, rot: 0.35, abs: true } })] },
  };
  const helmed = combatAnims(false), bared = combatAnims(true);
  for (const k of Object.keys(helmed)) { anims[k] = helmed[k]; anims[k + '_b'] = bared[k]; HAS_BARE[k] = 1; }

  AV.art.sheet('boss_odo', { w: FW, h: FH, ox: CX, oy: GY, anims });

  // ================================================================================ BEHAVIOUR
  const OCHRE = '#d9a24e';
  const L_SHOULDER = 'Still drop your left shoulder, Em.';
  const BARKS = [L_SHOULDER, 'We held this line for a night and a day.', 'You held a torch as steady as you held a shield.'];
  const L_READ = 'Did you even read it?';
  const TELE = '#e2621f';

  // the three swings: reach/arc of the hitbox, wind-up (s), ground marker
  const SWING = [
    { wind: 0.52, r: 30, spread: 1.0, knock: 130, reach: 16, tr: 18 },
    { wind: 0.44, r: 30, spread: 1.0, knock: 130, reach: 16, tr: 18 },
    { wind: 0.68, r: 36, spread: 0.55, knock: 190, heavy: true },
  ];

  function A(b, n) { b.anim = b.data.bare && HAS_BARE[n] ? n + '_b' : n; }
  function faceA(b, a) { if (Math.abs(Math.cos(a)) > 0.12) b.flip = Math.cos(a) < 0; }
  function turn(cur, target, rate) { return cur + U.clamp(U.angleDiff(cur, target), -rate, rate); }
  function k(b) { return b.data.fast ? 0.8 : 1; }
  function box(b) {
    const a = b.arena;
    return a ? { x0: a.x + 12, x1: a.x + a.w - 12, y0: a.y + 18, y1: a.y + a.h - 6 } : null;
  }
  function keepIn(b) {
    const r = box(b);
    if (!r) return false;
    const x = U.clamp(b.x, r.x0, r.x1), y = U.clamp(b.y, r.y0, r.y1);
    const moved = x !== b.x || y !== b.y;
    b.x = x; b.y = y;
    return moved;
  }
  function free(b, x, y) {
    const r = box(b);
    if (r && (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1)) return false;
    return !b.world.rectHitsTiles(x - b.w / 2, y - b.h, x + b.w / 2, y);
  }

  // ---------------------------------------------------------------- speech (warm ochre, sparse)
  function say(b, text, delay) { b.data.lines.push({ t: delay || 0, text }); }
  function tickLines(b, dt) {
    const Q = b.data.lines;
    if (!Q.length) return false;
    Q[0].t -= dt;
    if (Q[0].t <= 0) {
      const l = Q.shift();
      AV.fx.text(b.x, b.y - 48, l.text, { color: OCHRE, life: 3.4, rise: 6 });
      b.data.barkT = Math.max(b.data.barkT, 7);
    }
    return true;
  }
  function tickBarks(b, dt) {
    const D = b.data;
    if (tickLines(b, dt)) return;
    if (b.state === 'unhelm' || b.state === 'call') return;
    D.barkT -= dt;
    if (D.barkT > 0) return;
    D.barkT = U.rand(9.5, 11.5);
    const pool = b.phase >= 2 ? [L_READ].concat(BARKS) : BARKS;
    let pick = pool.find((t) => !D.said[t]);
    if (!pick) pick = U.pick(pool.filter((t) => t !== D.lastBark));
    D.said[pick] = 1; D.lastBark = pick;
    say(b, pick, 0);
  }
  // his blade finds Brand: the old correction, once
  function landed(b) {
    return () => {
      const D = b.data;
      if (D.said[L_SHOULDER] || D.lines.length) return;
      D.said[L_SHOULDER] = 1; D.lastBark = L_SHOULDER; D.barkT = 10;
      say(b, L_SHOULDER, 0.6);
    };
  }

  // ---------------------------------------------------------------- the stack he sat on stays where it fell
  function dropThrone(b) {
    const D = b.data;
    if (D.throneDropped || !AV.ents || !AV.ents.create) return;
    D.throneDropped = true;
    const ent = AV.ents.create({ type: 'decal', x: (b.home.x - 8) / 16, y: (b.home.y - 14) / 16, sprite: 'boss_odo', anim: 'shields' }, b.world);
    if (ent) b.world.add(ent);
  }

  // ---------------------------------------------------------------- patterns
  function endPattern(b, pause) {
    const D = b.data;
    D.pause = pause != null ? pause : U.rand(0.55, 0.95) * (D.fast ? 0.7 : 1);
    b.go('watch');
  }
  function windSwing(b) {
    const D = b.data, s = SWING[D.ci];
    D.aim = b.angleTo(); faceA(b, D.aim);
    D.windT = s.wind * k(b);
    b.go('c_wind');
    if (s.heavy) b.telegraph({ shape: 'line', x: b.x, y: b.y, a: D.aim, len: s.r + 6, width: 22, life: D.windT, color: TELE });
    else b.telegraph({ shape: 'circle', x: b.x + Math.cos(D.aim) * s.reach, y: b.y + Math.sin(D.aim) * s.reach * 0.8, r: s.tr, life: D.windT, color: TELE });
    b.sfx('whoosh', { pitch: 0.45 + D.ci * 0.08, vol: 0.25 });
  }
  function startBash(b) {
    const D = b.data;
    D.aim = b.angleTo(); faceA(b, D.aim);
    D.windT = 0.62 * k(b);
    b.go('bash_wind');
    b.telegraph({ shape: 'line', x: b.x, y: b.y, a: D.aim, len: 100, width: 22, life: D.windT + 0.1, color: TELE });
    b.sfx('block', { pitch: 0.55, vol: 0.5 });
    AV.fx.sparks(b.x + (b.flip ? -9 : 9), b.y - 22, 5);
  }
  function startLeap(b) {
    const D = b.data;
    D.windT = 0.6 * k(b); D.airT = 0.72 * k(b); D.tgt = null;
    b.faceTarget();
    b.go('leap_wind');
    b.sfx('growl', { pitch: 0.6, vol: 0.35 });
  }
  function leapTarget(b) {
    const P = b.P;
    let tx = P.x, ty = P.y;
    const dd = U.dist(b.x, b.y, tx, ty);
    if (dd > 150) { tx = b.x + (tx - b.x) * 150 / dd; ty = b.y + (ty - b.y) * 150 / dd; }
    const r = box(b);
    if (r) { tx = U.clamp(tx, r.x0, r.x1); ty = U.clamp(ty, r.y0, r.y1); }
    for (let i = 0; i < 10 && !free(b, tx, ty); i++) { tx += (b.x - tx) * 0.25; ty += (b.y - ty) * 0.25; }
    if (!free(b, tx, ty)) { tx = b.x; ty = b.y; }
    return { x: tx, y: ty };
  }
  function land(b) {
    const D = b.data, x = D.tgt.x, y = D.tgt.y;
    b.x = x; b.y = y; b.z = 0; b.hittable = true;
    b.hitbox({ shape: 'circle', x, y: y - 4, r: 24, life: 0.1, knock: 200, onHit: landed(b) });
    b.shockwave({ x, y, r0: 10, speed: 115, max: 80, thick: 8, color: '#cbc4c3', knock: 150 });
    D.echoT = D.fast ? 0.32 : 0;
    AV.fx.shake(5, 0.35);
    AV.fx.ash(x, y - 2, 18, { speed: 90, up: 12 });
    AV.fx.embers(x + (b.flip ? -12 : 12), y - 2, 6);
    b.sfx('slam', { vol: 0.9 });
    D.recT = 1.1 * k(b);
    b.go('leap_land');
  }
  function startRoll(b, then) {
    const D = b.data, a0 = b.angleTo();
    const offs = U.pick([[PI * 0.75, -PI * 0.75, PI * 0.5, -PI * 0.5, PI], [-PI * 0.75, PI * 0.75, -PI * 0.5, PI * 0.5, PI]]);
    D.rollA = a0 + PI;
    for (const o of offs) {
      const a = a0 + o;
      if (free(b, b.x + Math.cos(a) * 70, b.y + Math.sin(a) * 70) && free(b, b.x + Math.cos(a) * 35, b.y + Math.sin(a) * 35)) { D.rollA = a; break; }
    }
    D.then = then || null;
    b.invuln = true;
    faceA(b, D.rollA);
    b.go('roll');
    b.sfx('roll', { pitch: 0.7, vol: 0.8 });
    AV.fx.ash(b.x, b.y, 6, { speed: 30, up: 4 });
  }
  function startGuard(b) {
    const D = b.data;
    D.face = b.angleTo(); faceA(b, D.face);
    D.guardT = 1.25 * (D.fast ? 0.85 : 1); D.guardHits = 0;
    b.go('guard');
    b.sfx('block', { pitch: 1.35, vol: 0.45 });
    AV.fx.sparks(b.x + (b.flip ? -9 : 9), b.y - 28, 4);
  }
  function begin(b, pat) {
    const D = b.data;
    switch (pat) {
      case 'combo': D.ci = 0; D.single = false; windSwing(b); break;
      case 'bash': startBash(b); break;
      case 'leap': startLeap(b); break;
      case 'roll': startRoll(b, U.pick(D.fast ? ['leap', 'bash', 'leap'] : ['leap', 'bash', null])); break;
      case 'guard': startGuard(b); break;
      default: b.go('approach');
    }
  }
  function choose(b) {
    const D = b.data, d = b.dist(), W = [];
    const add = (n, w) => { if (w > 0) W.push([n, w]); };
    if (d < 46) {
      add('combo', 3);
      add('guard', D.lastPat === 'guard' ? 0 : 1.1);
      add('bash', d > 24 ? 1 : 0);
      add('roll', D.closeT > 2.5 ? 2.2 : 0.35);
    } else if (d < 120) { add('bash', 2); add('leap', 1.8); add('approach', 2); }
    else { add('leap', 3); add('approach', 1.5); add('bash', d < 150 ? 0.8 : 0); }
    // never the same pattern three times running
    const h = D.hist;
    const banned = h.length >= 2 && h[h.length - 1] === h[h.length - 2] ? h[h.length - 1] : null;
    let list = W.filter((x) => x[0] !== banned);
    if (!list.length) list = W;
    let r = Math.random() * list.reduce((s, x) => s + x[1], 0), pick = list[0][0];
    for (const [n, w] of list) { r -= w; if (r <= 0) { pick = n; break; } }
    h.push(pick); if (h.length > 4) h.shift();
    D.lastPat = pick;
    begin(b, pick);
  }

  // ---------------------------------------------------------------- phase 2: the helm, the company
  function callCompany(b) {
    const D = b.data;
    const broken = S.get('rollcall_broken'), answered = S.get('rollcall_answered');
    b.go('call');
    D.spawned = false; D.spawnPts = [];
    if (answered && !broken) {
      D.callT = 1.7;
      say(b, '…They\'re gone.', 0.5);
      say(b, 'You let them go.', 1.6);
      say(b, '…Good.', 1.7);
      return;
    }
    const kinds = broken ? ['shieldbound', 'pikeman'] : ['shieldbound'];
    say(b, broken ? 'Greyharrow. …To me.' : 'Company. …To me.', 0);
    D.callT = 1.4;
    const sides = [-1, 1];
    kinds.forEach((kind, i) => {
      let x = b.x + sides[i] * 44, y = b.y + 14;
      const r = box(b);
      if (r) { x = U.clamp(x, r.x0, r.x1); y = U.clamp(y, r.y0, r.y1); }
      if (!free(b, x, y)) { x = b.x - sides[i] * 44; y = b.y - 10; if (r) { x = U.clamp(x, r.x0, r.x1); y = U.clamp(y, r.y0, r.y1); } }
      D.spawnPts.push({ kind, x, y });
      b.telegraph({ shape: 'circle', x, y, r: 11, life: 0.65, color: '#82a8ad' });
    });
  }

  AV.data.bosses.boss_odo = {
    name: 'SER ODO VARR', title: 'The Ossuary Warden',
    sprite: 'boss_odo', hp: 120, dmg: 2, speed: 44, music: 'boss',
    w: 14, h: 8, hurt: { w: 18, h: 32 }, weight: 10, shadow: 9,
    light: { r: 34, color: '#e2621f', intensity: 0.45, oy: -26 },
    phases: [0.5],
    introTime: 1.5, introAnim: 'rise',
    idleSprite: 'boss_odo', idleAnim: 'idle',
    deathTime: 5.2,

    init(b) {
      Object.assign(b.data, {
        bare: false, fast: false, lines: [], said: {}, lastBark: null, barkT: 7, hist: [], lastPat: null,
        hits: [], clock: 0, closeT: 0, pause: 0.5, ci: 0, single: false, wantUnhelm: false,
        retry: !!S.get('seen_g_odo_again'),
      });
    },
    onStart(b) { if (b.data.retry) dropThrone(b); },
    introUpdate(b) { if (b.data.retry) b.anim = b.introT > 0.6 ? 'guard' : 'idle'; },
    onPhase(b, phase) { if (phase >= 2) b.data.wantUnhelm = true; },

    onHit(b, hit) {
      const D = b.data;
      if (b.state === 'guard' && b.st > 0.1) {
        const src = hit.owner || { x: hit.x != null ? hit.x : b.x, y: hit.y != null ? hit.y : b.y };
        const a = Math.atan2(src.y - b.y, src.x - b.x);
        if (Math.abs(U.angleDiff(a, D.face)) <= 1.3) { D.guardHits++; return false; }
      }
      D.hits.push(D.clock);
      return true;
    },

    brain(b, dt) {
      const D = b.data;
      D.clock += dt;
      if (D.hits.length && D.clock - D.hits[0] > 1.6) D.hits = D.hits.filter((t) => D.clock - t <= 1.6);
      tickBarks(b, dt);
      if (D.wantUnhelm && !/^(leap_air|bash|roll|unhelm|call)$/.test(b.state)) {
        D.wantUnhelm = false;
        b.z = 0; b.hittable = true; b.invuln = true;
        b.go('unhelm');
        b.sfx('growl', { pitch: 0.5, vol: 0.5 });
      }
      const d = b.dist();
      switch (b.state) {
        case 'start':
          dropThrone(b);
          endPattern(b, 0.45);
          break;

        case 'watch': {
          b.faceTarget();
          if (d > 40) { b.chase(b.speed * 0.55, dt); A(b, 'walk'); }
          else if (d < 16) { b.move(b.angleTo() + PI, b.speed * 0.5, dt); A(b, 'walk'); }
          else A(b, 'idle');
          b.faceTarget();
          D.closeT = d < 46 ? D.closeT + dt : 0;
          if (D.hits.length >= 3) { D.hits.length = 0; startRoll(b, U.pick(['leap', null])); break; }
          if (b.st >= D.pause) choose(b);
          break;
        }
        case 'approach':
          A(b, 'walk');
          b.chase(b.speed, dt);
          if (D.hits.length >= 3) { D.hits.length = 0; startRoll(b, 'leap'); break; }
          if (d < 30) begin(b, 'combo');
          else if (b.st > 2.4) begin(b, d > 70 ? 'leap' : 'bash');
          break;

        // ---- the combo
        case 'c_wind':
          A(b, 'wind' + (D.ci + 1));
          faceA(b, D.aim);
          if (b.st >= D.windT) {
            const s = SWING[D.ci];
            b.go('c_strike');
            b.hitbox({ shape: 'arc', x: b.x, y: b.y - 8, r: s.r, a: D.aim, spread: s.spread, life: 0.14, knock: s.knock, onHit: landed(b) });
            b.sfx(s.heavy ? 'swing2' : 'swing', { pitch: s.heavy ? 0.6 : 0.8, vol: 0.7 });
            if (s.heavy) {
              const tx = b.x + Math.cos(D.aim) * 26, ty = b.y + Math.sin(D.aim) * 22;
              AV.fx.ash(tx, ty, 10, { speed: 50, up: 8 }); AV.fx.sparks(tx, ty - 2, 5);
              AV.fx.shake(2, 0.15); b.sfx('slam', { pitch: 1.3, vol: 0.4 });
            }
          }
          break;
        case 'c_strike':
          A(b, 'strike' + (D.ci + 1));
          if (b.st < 0.12) b.move(D.aim, 70, dt);
          faceA(b, D.aim);
          if (b.st >= 0.24) {
            if (D.ci < 2 && !D.single) { D.ci++; windSwing(b); }
            else { D.recT = (D.ci === 2 ? 1.0 : 0.75) * k(b); b.go('c_rec'); }
          }
          break;
        case 'c_rec':
          A(b, D.ci === 2 ? 'rec' : 'idle');
          if (b.st >= D.recT) endPattern(b);
          break;

        // ---- shield bash
        case 'bash_wind':
          A(b, 'bash_wind');
          faceA(b, D.aim);
          if (b.st >= D.windT) {
            b.go('bash');
            D.bhit = b.hitbox({ shape: 'circle', follow: b, fx: Math.cos(D.aim) * 12, fy: Math.sin(D.aim) * 8 - 10, x: b.x, y: b.y, r: 14, life: 0.38, knock: 230, onHit: landed(b) });
            b.sfx('whoosh', { pitch: 0.6, vol: 0.7 });
          }
          break;
        case 'bash': {
          A(b, 'bash');
          const px = b.x, py = b.y;
          b.move(D.aim, 245, dt);
          const clamped = keepIn(b);
          faceA(b, D.aim);
          if (Math.random() < 0.5) AV.fx.ash(b.x - Math.cos(D.aim) * 6, b.y, 1, { speed: 20, up: 4 });
          const stuck = b.st > 0.05 && U.dist(px, py, b.x, b.y) < 245 * dt * 0.3;
          if (b.st >= 0.38 || stuck || clamped) {
            if (D.bhit) D.bhit.t = D.bhit.life;
            D.recT = (stuck || clamped ? 1.25 : 0.9) * k(b);
            b.go('bash_rec');
            b.sfx('slam', { pitch: 1.2, vol: 0.5 });
            AV.fx.ash(b.x + Math.cos(D.aim) * 12, b.y, 8, { speed: 40, up: 6 });
            if (stuck || clamped) AV.fx.shake(2, 0.15);
          }
          break;
        }
        case 'bash_rec':
          A(b, 'bash_rec');
          if (b.st >= D.recT) endPattern(b);
          break;

        // ---- leaping slam
        case 'leap_wind':
          A(b, 'leap_wind');
          if (!D.tgt) b.faceTarget();
          if (!D.tgt && b.st >= 0.22 * k(b)) {
            D.tgt = leapTarget(b);
            b.telegraph({ shape: 'circle', x: D.tgt.x, y: D.tgt.y, r: 26, life: Math.max(0.2, D.windT - b.st) + D.airT, color: TELE });
          }
          if (b.st >= D.windT) {
            if (!D.tgt) D.tgt = leapTarget(b);
            D.from = { x: b.x, y: b.y };
            faceA(b, Math.atan2(D.tgt.y - b.y, D.tgt.x - b.x));
            b.go('leap_air');
            b.sfx('whoosh', { pitch: 0.5, vol: 0.8 });
            AV.fx.ash(b.x, b.y, 10, { speed: 50, up: 6 });
          }
          break;
        case 'leap_air': {
          A(b, 'leap_air');
          const t = Math.min(1, b.st / D.airT), e = t * t * (3 - 2 * t);
          b.x = D.from.x + (D.tgt.x - D.from.x) * e;
          b.y = D.from.y + (D.tgt.y - D.from.y) * e;
          b.z = Math.sin(PI * t) * 44;
          b.hittable = b.z < 14;
          if (t >= 1) land(b);
          break;
        }
        case 'leap_land':
          A(b, 'slam');
          if (D.echoT > 0) {
            D.echoT -= dt;
            if (D.echoT <= 0) { b.shockwave({ x: b.x, y: b.y, r0: 8, speed: 95, max: 66, thick: 7, color: '#e2621f', knock: 130 }); b.sfx('slam', { pitch: 1.4, vol: 0.4 }); }
          }
          if (b.st >= D.recT) endPattern(b);
          break;

        // ---- roll
        case 'roll':
          A(b, 'roll');
          b.move(D.rollA, 175, dt);
          faceA(b, D.rollA);
          if (b.st >= 0.42) {
            b.invuln = false;
            const then = D.then; D.then = null;
            if (then === 'leap') startLeap(b);
            else if (then === 'bash') startBash(b);
            else endPattern(b, U.rand(0.25, 0.45));
          }
          break;

        // ---- guard
        case 'guard':
          A(b, 'guard');
          D.face = turn(D.face, b.angleTo(), 2.0 * dt);
          faceA(b, D.face);
          if (b.st >= D.guardT) {
            if (D.guardHits > 0) { D.ci = 0; D.single = true; windSwing(b); }   // the riposte
            else endPattern(b);
          }
          break;

        // ---- phase 2
        case 'unhelm':
          A(b, 'unhelm');
          b.faceTarget();
          if (b.st >= 0.62 && !D.bare) {
            D.bare = true;
            b.sfx('block', { pitch: 0.5, vol: 0.6 });
            AV.fx.ash(b.x + (b.flip ? 16 : -16), b.y - 30, 8, { speed: 30, up: 8 });
            if (b.light) { b.light.r = 44; b.light.intensity = 0.6; }
          }
          if (b.st >= 1.25) {
            D.bare = true; D.fast = true;
            b.speed = 55;
            callCompany(b);
          }
          break;
        case 'call':
          A(b, D.spawnPts.length || b.st < 0.6 ? 'call' : 'idle');
          b.faceTarget();
          if (!D.spawned && b.st >= 0.6) {
            D.spawned = true;
            for (const s of D.spawnPts) {
              b.spawn(s.kind, s.x, s.y);
              AV.fx.ghostly(s.x, s.y - 10, 14);
            }
            if (D.spawnPts.length) b.sfx('whisper', { vol: 0.7 });
          }
          if (b.st >= D.callT) { b.invuln = false; endPattern(b, 0.4); }
          break;

        default:
          endPattern(b, 0.4);
      }
      if (b.state !== 'leap_air') keepIn(b);
    },

    onDeath(b) {
      const D = b.data;
      D.bare = true; D.lines.length = 0;
      b.z = 0; b.invuln = false;
      // Engine guard: Boss.die() empties AV.combat.hits while combat.update may still be walking that list
      // (the killing blow). Pad it with inert, already-expired boxes so the walk never reads a hole.
      for (let i = 0; i < 96; i++) AV.combat.add({ shape: 'circle', x: -1e5, y: -1e5, r: 0, dmg: 0, life: 0, team: 'enemy' });
    },
    // down on one knee, the sword planted; he goes out slowly
    deathUpdate(b, dt) {
      const D = b.data, t = b.deathT;
      if (t < 1.8 && Math.random() < 0.3) AV.fx.embers(b.x + U.rand(-6, 6), b.y - U.rand(6, 26), 1, { speed: 15, up: 12 });
      if (t > 0.68 && !D.knelt) {
        D.knelt = true;
        b.sfx('block', { pitch: 0.4, vol: 0.5 });
        AV.fx.ash(b.x + (b.flip ? -10 : 10), b.y, 10, { speed: 40, up: 6 });
        AV.fx.shake(1.5, 0.2);
      }
      if (t > 2.4) {
        b.alpha = Math.max(0, 1 - (t - 2.4) / 2.6);
        if (Math.random() < 0.5) AV.fx.ash(b.x + U.rand(-8, 8), b.y - U.rand(2, 30), 1, { speed: 12, up: 20, life: 1.6 });
      }
    },
  };
})(window.AV);
