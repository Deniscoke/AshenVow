// ASHEN VOW — creatures of the village, the road and the Hushwood (ENEMIES-A)
// Kinds: pilgrim, censer, hound, hound_big (the Tallow Lane hound, also an NPC sheet), moth, briar.
// Each creature: its sprite sheet (procedural pixel art, faces RIGHT) + its behaviour definition.
(function (AV) {
  'use strict';
  const art = AV.art;
  const U = AV.util;

  // ================================================================ pixel toolkit
  const hashf = (x, y, s) => (U.hash2(x | 0, y | 0, s | 0) % 10007) / 10007;
  // Horizontal run of pixels ('.' = skip)
  function put(g, x, y, s) { for (let i = 0; i < s.length; i++) if (s[i] !== '.') g.px(x + i, y, s[i]); }
  // Pixel list [[x,y,c],...]
  function pts(g, list, dx, dy) { for (const p of list) g.px(p[0] + (dx || 0), p[1] + (dy || 0), p[2]); }
  // Point along an angle
  const along = (x, y, a, d) => [Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d)];
  // Light the front (right) / top edge and shade the back (left) / bottom edge of every pixel in the ramp.
  // ramp: dark → light chars. Pixels touching empty space on the right/top get +1, left/bottom get -1.
  function rim(g, ramp, x0, y0, x1, y1) {
    x0 = x0 || 0; y0 = y0 || 0; x1 = x1 == null ? g.w - 1 : x1; y1 = y1 == null ? g.h - 1 : y1;
    const out = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const c = g.get(x, y);
      const k = c == null ? -1 : ramp.indexOf(c);
      if (k < 0) continue;
      let d = 0;
      if (g.get(x + 1, y) == null || g.get(x, y - 1) == null) d++;
      if (g.get(x - 1, y) == null || g.get(x, y + 1) == null) d--;
      if (d) out.push(x, y, ramp[U.clamp(k + d, 0, ramp.length - 1)]);
    }
    for (let i = 0; i < out.length; i += 3) g.px(out[i], out[i + 1], out[i + 2]);
  }
  // Crumble: consume a sprite from the top down with noise; the consuming front glows (embers) or greys (ash).
  // k in 0..1. front: chars used at the consuming edge.
  function crumble(g, k, seed, front) {
    let top = g.h, bot = 0;
    g.each((x, y, c) => { if (c != null) { top = Math.min(top, y); bot = Math.max(bot, y); } });
    if (top > bot) return;
    const span = Math.max(1, bot - top);
    g.each((x, y, c) => {
      if (c == null) return undefined;
      const v = (y - top) / span * 0.62 + hashf(x, y, seed) * 0.38;
      if (v < k - 0.06) return null;
      if (v < k + 0.02) return front[Math.floor(hashf(x + 7, y, seed) * front.length)];
      return undefined;
    });
  }
  // Mound of ash on the ground centred at cx, bottom row by
  function ashHeap(g, cx, by, w, h, seed, embers) {
    for (let j = 0; j < h; j++) {
      const hw = Math.round((w / 2) * Math.sqrt(1 - (j / h) * (j / h)));
      for (let i = -hw; i <= hw; i++) {
        const r = hashf(cx + i, by - j, seed);
        const c = j === 0 ? (r < 0.5 ? '4' : '5') : r < 0.3 ? '5' : r < 0.7 ? '6' : r < 0.9 ? '7' : '8';
        g.px(cx + i, by - j, c);
      }
    }
    if (embers) for (let n = 0; n < embers; n++) {
      const i = Math.round((hashf(n, 3, seed) - 0.5) * w * 0.7), j = Math.floor(hashf(n, 9, seed) * Math.max(1, h - 1));
      g.px(cx + i, by - j, n % 3 === 0 ? 'p' : n % 2 ? 'o' : 'n');
    }
  }
  // Sparse drifting flecks above a point (for crumbling frames)
  function flecks(g, cx, cy, n, spread, seed, chars) {
    for (let i = 0; i < n; i++) {
      const x = Math.round(cx + (hashf(i, 1, seed) - 0.5) * spread * 2), y = Math.round(cy - hashf(i, 2, seed) * spread);
      if (g.get(x, y) == null) g.px(x, y, chars[i % chars.length]);
    }
  }

  // ================================================================ shared behaviour helpers
  // Tangential + radial steering: orbit the player at radius `rad`, direction `dir` (+1/-1)
  function orbit(e, dt, rad, dir, speed) {
    const P = e.P;
    const a = Math.atan2(e.y - P.y, e.x - P.x);
    const d = e.dist();
    const radial = U.clamp((rad - d) / 20, -1, 1);          // + = move away
    const tx = -Math.sin(a) * dir, ty = Math.cos(a) * dir;
    const vx = tx * 0.8 + Math.cos(a) * radial, vy = ty * 0.8 + Math.sin(a) * radial;
    e.move(Math.atan2(vy, vx), speed, dt);
    if (e.blockedX || e.blockedY) e.data.orbitDir = -dir;   // bumped into a wall: turn around
  }
  // How many other members of the same kind are committed to an attack right now (packs take turns)
  function packBusy(e) {
    let n = 0;
    for (const o of e.world.entities) {
      if (o === e || o.kind !== e.kind || o.dead || o.gone) continue;
      if (o.state === 'windup' || o.state === 'attack') n++;
    }
    return n;
  }

  // =================================================================================================
  // ASHEN PILGRIM — a pilgrim who died mid-prayer; the prayer never finished, so neither did they.
  // =================================================================================================
  // Sheet 32x32, anchor (12,30). Hunched in grey robes & mantle, deep hood hiding all but an ember eye
  // and grey moving lips; a tall pilgrim staff with a wine-red rag knotted below the knob.

  // p: { by (bob), lean (upper body, + forward), step (-1..1), kneel (0/1), bow (head drop), mouth (0/1), eye }
  function pilgrimBody(g, p) {
    const kn = p.kneel || 0;
    const by = Math.round((p.by || 0) + kn * 5);
    const L = p.lean || 0;
    const s = Math.round((p.step || 0) * 1.5);
    // feet peeking under the hem
    if (!kn) {
      put(g, 6 - s, 29, '222'); put(g, 5 - s, 30, '1111');
      put(g, 14 + s, 29, '2222'); put(g, 14 + s, 30, '11111');
    }
    // skirt of the robe (flares back and forward)
    if (!kn) g.poly([[5, 17 + by], [15 + L, 17 + by], [17 + s, 23], [19 + s, 29], [3 - s, 29], [4, 23]], '4');
    else g.poly([[5, 17 + by], [15 + L, 17 + by], [18, 24], [21, 29], [2, 29], [3, 25]], '4');
    // hunched back under the mantle
    g.ellipse(9 + L, 15 + by, 5, 5, '5');
    // hood, pushed forward and down by the hunch
    const hx = 14 + L + (p.bowX || 0), hy = 11 + by + (p.bow || 0);
    g.ellipse(hx, hy, 4, 4, '5');
    g.line(hx - 4, hy - 1, hx - 2, hy - 5, '5');            // the hood's peak falls back over the hump
    g.px(hx - 3, hy - 4, '5'); g.px(hx - 5, hy, '5');
    rim(g, '2345');
    rim(g, '2345');
    // fabric: vertical robe folds, darker lower hem, mantle's ragged edge casting a shadow
    for (let x = 0; x < g.w; x++) {
      let low = -1;
      for (let y = 12 + by; y < 22 + by; y++) { const c = g.get(x, y); if (c != null && x < hx - 1) low = y; }
      void low;
    }
    for (let y = 26; y <= 29; y++) for (let x = 0; x < g.w; x++) { const c = g.get(x, y); if (c === '4' || c === '5') g.px(x, y, y >= 28 ? '2' : '3'); }
    const f = s;
    if (!kn) {
      g.line(8 + f, 21 + by, 7 + f, 27, '3'); g.line(12 + f, 22 + by, 12 + f, 27, '3'); g.line(15 + f, 24, 16 + f, 27, '3');
      g.px(9 + f, 24, '5'); g.px(13 + f, 24, '5');
    } else {
      g.line(7, 25, 6, 27, '3'); g.line(12, 25, 14, 27, '3'); g.line(17, 26, 18, 27, '3');
    }
    // mantle hem: ragged, lighter above, shadow below
    for (let x = 4 + L; x <= 14 + L; x++) {
      const yy = 19 + by + (hashf(x, 1, 7) < 0.4 ? 1 : 0);
      if (g.get(x, yy) != null) { g.px(x, yy, '3'); if (g.get(x, yy - 1) != null) g.px(x, yy - 1, '5'); }
    }
    // rope belt peeks below the mantle at the front, with its knot hanging
    for (let x = 12 + L; x <= 16 + L; x++) if (g.get(x, 20 + by) != null) g.px(x, 20 + by, (x % 2) ? 'c' : 'd');
    g.px(15 + L, 21 + by, 'd'); g.px(15 + L, 22 + by, 'c'); g.px(16 + L, 23 + by, 'd');
    // mantle highlight along the hump
    g.px(7 + L, 11 + by, '6'); g.px(8 + L, 11 + by, '6'); g.px(6 + L, 12 + by, '6');
    // hood: lit rim on top/front; the deep opening; the face sunk inside
    put(g, hx - 2, hy - 4, '666'); g.px(hx + 1, hy - 3, '6'); g.px(hx + 2, hy - 3, '6'); g.px(hx + 3, hy - 2, '6');
    put(g, hx + 1, hy - 1, '1112'); put(g, hx, hy, '1112'); put(g, hx, hy + 1, '112N'); put(g, hx + 1, hy + 2, '1NN');
    put(g, hx + 1, hy + 3, '2N');
    g.px(hx + 4, hy - 1, '6'); g.px(hx + 4, hy, '5');              // the hood's front lip
    g.px(hx + 2, hy, p.eye || 'o');                                  // the ember eye
    g.px(hx + 3, hy + 1, 'O');                                       // cheekbone catching the light
    g.px(hx + 3, hy + 2, p.mouth ? '0' : 'h');                       // the lips, still moving
    if (p.mouth) g.px(hx + 2, hy + 3, 'N');
  }
  function pilgrimStaff(g, hx, hy, a, up, down) {
    const [tx, ty] = along(hx, hy, a, up), [bx, by] = along(hx, hy, a + Math.PI, down);
    g.line(bx, by, tx, ty, 'd');
    const n = Math.max(1, Math.abs(tx - bx), Math.abs(ty - by));
    for (let i = 2; i <= n; i += 4) g.px(Math.round(bx + (tx - bx) * i / n), Math.round(by + (ty - by) * i / n), 'c');
    // knob, and a rag knotted under it
    const [kx, ky] = along(hx, hy, a, up + 1);
    g.px(kx, ky, 'e'); g.px(tx, ty, 'e');
    const [wx, wy] = along(hx, hy, a, up - 3), [w2x, w2y] = along(hx, hy, a, up - 2);
    g.px(wx, wy, 'H'); g.px(w2x, w2y, 'G');
    g.px(wx + 1, wy + 1, 'G'); g.px(wx + 1, wy + 2, 'H');
  }
  // wide drooping sleeve from shoulder (sx,sy) to the hand (hx,hy)
  function pilgrimArm(g, sx, sy, hx, hy) {
    g.line(sx, sy, hx - 1, hy - 1, '5');
    g.line(sx, sy + 1, hx - 1, hy, '4');
    g.line(sx - 1, sy + 2, hx - 2, hy + 1, '4');
    g.line(sx - 1, sy + 3, hx - 2, hy + 2, '3');
    g.px(hx, hy, 'O'); g.px(hx, hy + 1, 'N'); g.px(hx - 1, hy, 'N');
  }
  function pilgrim(g, p) {
    pilgrimBody(g, p);
    const kn = p.kneel || 0;
    const by = Math.round((p.by || 0) + kn * 5), L = p.lean || 0;
    const sx = 12 + L, sy = 14 + by;
    if (p.staff !== false) {
      const h = p.hand || [20, 18 + by];
      pilgrimStaff(g, h[0], h[1], p.staffA != null ? p.staffA : -Math.PI / 2, p.up || 15, p.down || 12);
      if (p.both) pilgrimArm(g, sx - 3, sy, h[0] - 2, h[1] + 1);
      pilgrimArm(g, sx, sy, h[0], h[1]);
    } else if (p.pray) {
      // hands folded in prayer under the bowed hood
      g.line(sx, sy, sx + 3, sy + 3, '5'); g.line(sx - 1, sy + 1, sx + 2, sy + 4, '4');
      g.px(sx + 4, sy + 2, 'O'); g.px(sx + 4, sy + 3, 'N'); g.px(sx + 3, sy + 3, 'N');
    }
    if (p.lyingStaff) {
      g.line(p.lyingStaff[0], 30, p.lyingStaff[1], 30, 'd');
      g.px(p.lyingStaff[1], 30, 'e'); g.px(p.lyingStaff[1] - 3, 30, 'H');
    }
    g.outline('0');
    if (p.post) p.post(g);
  }

  art.sheet('enemy_pilgrim', {
    w: 32, h: 32, ox: 12, oy: 30,
    anims: {
      idle: { fps: 3, count: 4, draw(g, i) {
        pilgrim(g, { by: i === 1 || i === 2 ? 1 : 0, mouth: i % 2 });
      } },
      walk: { fps: 5, count: 4, draw(g, i) {
        // a shamble: drag, lurch, drag, lurch — the staff planted, then swung forward
        pilgrim(g, { by: [0, 1, 0, 2][i], step: [-1, 0, 1, 0][i], lean: [0, 1, 0, 2][i], mouth: i % 2,
          hand: [20 + [0, 1, 1, 2][i], 18 + [0, 1, 0, 2][i]], staffA: -Math.PI / 2 + [0.12, 0, -0.12, 0.05][i] });
      } },
      windup: { fps: 6, loop: false, count: 3, draw(g, i) {
        // the telegraph: raises the staff high behind its head with both hands, leaning back
        pilgrim(g, { by: i ? -1 : 0, lean: [-1, -2, -2][i], mouth: 1, both: true,
          hand: [[18, 9], [16, 5], [15, 4]][i], staffA: [-2.4, -2.75, -2.85][i], up: 14, down: 4,
          eye: i === 2 ? 'p' : 'o' });
      } },
      attack: { fps: 12, loop: false, count: 3, draw(g, i) {
        // the smash: the staff comes over and down, the knob strikes the ground in front
        const cfg = [
          { hand: [20, 10], staffA: -0.45, up: 12, down: 4, lean: 1 },
          { hand: [20, 17], staffA: 0.95, up: 14, down: 4, lean: 2 },
          { hand: [20, 18], staffA: 1.0, up: 13, down: 4, lean: 2, by: 1 },
        ][i];
        pilgrim(g, Object.assign({ both: true, mouth: 1 }, cfg, {
          post: i ? (gg) => {   // impact dust thrown up round the knob
            const dx = 28;
            pts(gg, [[dx - 3, 30, '6'], [dx + 2, 30, '6'], [dx - 4, 29, '7'], [dx + 3, 28, '7'], [dx + 1, 26, '8'], [dx - 2, 27, '6'],
              [dx + 3, 25, i === 1 ? '8' : '.'], [dx - 4, 26, i === 1 ? '7' : '.']]);
          } : null }));
      } },
      hurt: { fps: 8, loop: false, count: 2, draw(g, i) {
        pilgrim(g, { lean: -2 + i, by: i ? 0 : -1, mouth: 1, eye: 'p', hand: [19, 17], staffA: -Math.PI / 2 - 0.3 + i * 0.12 });
      } },
      die: { fps: 8, loop: false, count: 7, draw(g, i) {
        // drops to its knees, finishes the prayer at last, and is ash
        if (i === 0) { pilgrim(g, { lean: -2, by: -1, mouth: 1, eye: 'p', hand: [19, 17], staffA: -Math.PI / 2 - 0.4 }); return; }
        if (i === 1) { pilgrim(g, { kneel: 1, lean: 0, mouth: 1, hand: [20, 22], staffA: -Math.PI / 2 + 0.55, up: 13, down: 7 }); return; }
        pilgrim(g, { kneel: 1, lean: 1, bow: 1, bowX: 1, staff: false, pray: true, mouth: 0, eye: i > 2 ? 'n' : 'o', lyingStaff: [17, 30] });
        if (i >= 3) {
          crumble(g, [0, 0, 0, 0.3, 0.58, 0.84, 1.1][i], 11, ['o', 'n', '7', '8', '6']);
          ashHeap(g, 11, 30, [0, 0, 0, 9, 12, 14, 14][i], [0, 0, 0, 2, 3, 4, 3][i], 5, i < 6 ? 3 : 1);
          flecks(g, 11, 22 - i, 3 + i, 5, i, ['7', '8', '6']);
          g.line(18, 30, 30, 30, 'd'); g.px(30, 30, 'e'); g.px(27, 30, 'H');
        }
      } },
    },
  });

  const PRAYERS = ['…keep my flame…', '…Mother, the wick…', '…go home… go home…', '…by the Wick, by the…',
    '…hear me, hear…', '…before the dark…'];
  function strikePilgrim(e) {
    const D = e.data;
    e.go('attack');
    e.hitbox({ shape: 'arc', x: e.x, y: e.y - 6, r: 30, a: D.aim, spread: 0.7, life: 0.12, knock: 140 });
    e.sfx('slam', { vol: 0.45, pitch: U.rand(1.15, 1.3) });
    const ix = e.x + Math.cos(D.aim) * 18, iy = e.y + Math.sin(D.aim) * 14;
    AV.fx.ash(ix, iy, 10, { speed: 45, up: 12 });
    AV.fx.shake(1.5, 0.1);
  }
  AV.data.enemies.pilgrim = {
    name: 'Ashen Pilgrim',
    sprite: 'enemy_pilgrim',
    hp: 7, dmg: 2, speed: 22,
    w: 10, h: 6, hurt: { w: 12, h: 22 },
    weight: 1.1, poise: 0,
    aggro: 88, leash: 220,
    pennies: [2, 5], cinder: 8,
    shadow: 6,
    init(e) { e.data.prayT = U.rand(3, 9); e.data.moteT = U.rand(0.3, 1); },
    brain(e, dt) {
      const D = e.data;
      // the prayer that never ends: grey motes rise from the moving lips
      D.moteT -= dt;
      if (D.moteT <= 0) {
        D.moteT = e.aggro ? U.rand(0.5, 1.1) : U.rand(0.8, 1.6);
        AV.fx.spawn({ x: e.x + (e.flip ? -5 : 5), y: e.y - 19, vx: U.rand(-3, 3) + (e.flip ? -2 : 2), vy: U.rand(-9, -5),
          life: U.rand(1.2, 2), color: U.pick(['#857c86', '#a8a0a6', '#cbc4c3']), alpha: 0.6, sway: 3 });
      }
      if (!e.aggro) {
        // murmured fragments, heard only up close
        D.prayT -= dt;
        if (D.prayT <= 0 && e.dist() < 100) {
          D.prayT = U.rand(9, 16);
          AV.fx.text(e.x, e.y - 34, U.pick(PRAYERS), { color: '#857c86', life: 2.6, rise: 6 });
        }
      }
      switch (e.state) {
        case 'idle':
          e.anim = 'idle';
          if (e.aggro) e.go('chase');
          break;
        case 'chase': {
          e.anim = 'walk';
          if (!e.aggro) { e.go('idle'); break; }
          const d = e.dist();
          if (d < 34 && e.cool <= 0) {
            e.faceTarget();
            D.aim = e.angleTo();
            // a short lurching step before the blow if the target is a pace too far
            D.lurch = d > 22 ? Math.min(12, d - 18) : 0;
            const reach = 17 + D.lurch;
            e.telegraph({ shape: 'circle', x: e.x + Math.cos(D.aim) * reach, y: e.y + Math.sin(D.aim) * reach * 0.8,
              r: 13, life: 0.55, color: '#a8a0a6' });
            e.go('windup');
            break;
          }
          // lurching gait: speed pulses with the shamble
          e.chase(e.speed * (0.55 + 0.75 * Math.max(0, Math.sin(e.st * 5.2))), dt);
          break;
        }
        case 'windup':
          e.anim = 'windup';
          if (e.st < 0.2) D.aim += U.angleDiff(D.aim, e.angleTo()) * 0.08;
          if (e.st >= 0.5) { if (D.lurch > 0) e.go('lurch'); else strikePilgrim(e); }
          break;
        case 'lurch':
          e.anim = 'windup';
          e.move(D.aim, 80, dt);
          e.flip = Math.cos(D.aim) < 0;
          if (e.st >= D.lurch / 80) strikePilgrim(e);
          break;
        case 'attack':
          e.anim = 'attack';
          if (e.st >= 0.28) e.go('recover');
          break;
        case 'recover':
          // the knob is stuck in the ground for a moment: the punish window
          e.anim = e.st < 0.45 ? 'attack' : 'idle';
          if (e.st >= 0.8) { e.cool = U.rand(0.5, 1.3); e.go('chase'); }
          break;
        default: e.go('idle');
      }
    },
  };

  // Outline only inside a region (for pieces drawn after a crumble, so the ash flecks stay soft)
  function outlineIn(g, x0, y0, x1, y1, c) {
    const out = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (g.get(x, y) != null) continue;
      if (g.get(x + 1, y) != null || g.get(x - 1, y) != null || g.get(x, y + 1) != null || g.get(x, y - 1) != null) out.push(x, y);
    }
    for (let i = 0; i < out.length; i += 2) g.px(out[i], out[i + 1], c || '0');
  }

  // =================================================================================================
  // CENSER-BEARER — an acolyte who has kept the censer lit since the fire, and will not set it down.
  // =================================================================================================
  // Sheet 56x48, anchor (28,41). Dusk-purple cassock, pale lace surplice, wine stole, tonsured grey head, ember eye.
  // In the spin the censer whirls round the body on the ellipse CEN (hip height); the brain uses the same numbers,
  // so what you see swinging is exactly what hits you.
  const CEN = { x: 28, y: 31, rx: 23, ry: 12, fps: 14 };
  const ACO_HEAD = ['..3OO..', '.3OOON.', '32NNN3N', '22hNN@N', '.2NNN4O', '..NNN4h', '...NN..'];

  function censerAt(g, x, y, lit) {
    x = Math.round(x); y = Math.round(y);
    const f = Array.isArray(lit) ? lit : lit === 2 ? ['o', 'q', 'p'] : lit ? ['n', 'p', 'o'] : ['2', '3', '2'];
    put(g, x - 2, y - 3, '..L..');
    put(g, x - 2, y - 2, '.JLM.');
    put(g, x - 2, y - 1, 'JKLMK');
    put(g, x - 2, y, 'J' + f[0] + f[1] + f[2] + 'J');
    put(g, x - 2, y + 1, '.K' + f[0] + 'K.');
    put(g, x - 2, y + 2, '..J..');
  }
  function chain(g, x0, y0, x1, y1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) g.px(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), i % 2 ? 'K' : '5');
  }
  function smoke(g, x, y, i, n) {
    for (let k = 0; k < n; k++) {
      const sx = Math.round(x + Math.sin((i + k) * 1.3) * 1.6), sy = Math.round(y - 5 - k * 2);
      if (g.get(sx, sy) == null) g.px(sx, sy, k < 2 ? '6' : '5');
      if (k % 2 && g.get(sx + 1, sy + 1) == null) g.px(sx + 1, sy + 1, '5');
    }
  }
  // wide pale sleeve from the shoulder to the hand; returns the hand pixel
  function acoArm(g, sx, sy, hx, hy) {
    g.line(sx, sy, hx, hy, '8');
    g.line(sx, sy + 1, hx, hy + 1, '7');
    g.line(sx - 1, sy + 1, hx - 1, hy + 1, '7');
    g.line(sx - 1, sy + 2, hx - 1, hy + 2, '6');
    const [ex, ey] = along(hx, hy, Math.atan2(hy - sy, hx - sx), 1.6);
    g.px(ex, ey, 'O'); g.px(ex, ey + 1, 'N');
    return [ex, ey];
  }
  // p: { by, lean, step, flare, kneel, head:[dx,dy], eye, hand:[x,y], phi (pendulum angle) | cen:[x,y], sag:[x,y],
  //      lit, behind (censer passes behind the body), arm2:[x,y] (other hand), noCenser, post(g, censerPos) }
  function acolyte(g, p) {
    const by = Math.round(p.by || 0), L = Math.round(p.lean || 0), s = Math.round((p.step || 0) * 1.5);
    const kn = p.kneel ? 6 : 0, fl = p.flare || 0;
    const top = 20 + by + kn;
    const hd = p.head || [0, 0];
    const hx = 29 + L + hd[0], hy = top - 5 + hd[1];
    const sx = 29 + L, sy = top + 1;
    let cpos = [0, 0];
    const censerArm = () => {
      const hand = p.hand || [36, 26 + by];
      const h = acoArm(g, sx, sy, hand[0], hand[1]);
      if (p.noCenser) return;
      let c = p.cen;
      if (p.phi != null) c = [h[0] + Math.sin(p.phi) * 7, h[1] + 1 + Math.cos(p.phi) * 7 + 3];
      if (p.sag) { chain(g, h[0], h[1] + 1, p.sag[0], p.sag[1]); chain(g, p.sag[0], p.sag[1], c[0], c[1] - 3); }
      else chain(g, h[0], h[1] + 1, c[0], c[1] - 3);
      censerAt(g, c[0], c[1], p.lit == null ? 1 : p.lit);
      cpos = [Math.round(c[0]), Math.round(c[1])];
    };
    const otherArm = () => { if (p.arm2) acoArm(g, sx - 3, sy, p.arm2[0], p.arm2[1]); };
    if (p.behind) censerArm(); else otherArm();
    // feet
    if (!kn) {
      put(g, 24 - s, 40, '222'); put(g, 23 - s, 41, '1111');
      put(g, 30 + s, 40, '2222'); put(g, 30 + s, 41, '11111');
    }
    // cassock
    if (!kn) g.poly([[24, top + 2], [33 + L, top + 2], [35 + fl + s, 34], [37 + fl, 40], [20 - fl, 40], [22 - fl, 34]], 'Q');
    else g.poly([[24, top + 2], [33 + L, top + 2], [37, 37], [38, 41], [19, 41], [21, 37]], 'Q');
    rim(g, 'PQR', 16, top, 44, 41);
    const hemY = kn ? 41 : 40;
    for (let y = top + 10; y < hemY; y++) {
      const f1 = 25 - Math.round((y - top - 10) * 0.25), f2 = 30 + s + Math.round((y - top - 10) * 0.2);
      if (g.get(f1, y) === 'Q') g.px(f1, y, 'P');
      if (g.get(f2, y) === 'Q') { g.px(f2, y, 'P'); if (g.get(f2 + 1, y) === 'Q') g.px(f2 + 1, y, 'R'); }
    }
    for (let x = 16; x < 42; x++) { const c = g.get(x, hemY); if (c === 'Q' || c === 'R') g.px(x, hemY, 'P'); }
    // the lace surplice over the shoulders
    const sb = top + 9;
    g.poly([[24 + L, top], [33 + L, top], [35 + fl + Math.max(0, L), sb], [22 - fl, sb]], '7');
    rim(g, '5678', 18, top - 1, 42, sb);
    for (let x = 18; x < 42; x++) {
      const c = g.get(x, sb);
      if (c && '5678'.includes(c)) { g.px(x, sb, x % 2 ? '8' : '6'); if (x % 2 === 0 && g.get(x, sb + 1) != null) g.px(x, sb + 1, '7'); }
    }
    g.line(27 + L, top + 3, 26, sb - 1, '6');
    // wine stole with a gold fringe
    for (let y = top; y <= sb + 4; y++) { g.px(31 + L, y, 'G'); g.px(32 + L, y, y === top ? 'G' : 'H'); }
    g.px(31 + L, sb + 5, 'M'); g.px(32 + L, sb + 5, 'L');
    // tonsured head, ash streak under the ember eye
    ACO_HEAD.forEach((row, j) => put(g, hx - 3, hy - 3 + j, row.replace('@', p.eye || 'o')));
    put(g, hx - 1, hy + 4, '787');
    if (p.behind) otherArm(); else censerArm();
    g.outline('0');
    if (p.post) p.post(g, cpos);
  }

  art.sheet('enemy_censer', {
    w: 56, h: 48, ox: 28, oy: 41,
    anims: {
      idle: { fps: 4, count: 4, draw(g, i) {
        const by = i === 1 || i === 2 ? 1 : 0;
        acolyte(g, { by, phi: [0.28, 0.08, -0.22, -0.02][i], hand: [35, 26 + by], post: (gg, c) => smoke(gg, c[0], c[1], i, 4) });
      } },
      walk: { fps: 6, count: 4, draw(g, i) {
        const by = [0, 1, 0, 1][i];
        acolyte(g, { by, step: [-1, 0, 1, 0][i], phi: [0.5, 0.1, -0.4, -0.05][i], hand: [35, 26 + by],
          post: (gg, c) => smoke(gg, c[0], c[1], i, 3) });
      } },
      windup: { fps: 10, count: 4, draw(g, i) {
        // the telegraph: the censer goes up on its chain and whirls overhead; the coals turn white
        const ps = i * Math.PI / 2 + 0.4;
        acolyte(g, { by: -1, lean: -1, eye: i >= 2 ? 'p' : 'o', hand: [25, 8], lit: 2,
          cen: [26 + Math.cos(ps) * 10, 5 + Math.sin(ps) * 2],
          post: (gg) => {
            for (let k = 1; k <= 5; k++) {
              const a = ps - k * 0.38, x = Math.round(26 + Math.cos(a) * 10), y = Math.round(5 + Math.sin(a) * 2);
              if (gg.get(x, y) == null) gg.px(x, y, ['p', 'o', 'n', '7', '5'][k - 1]);
            }
          } });
      } },
      attack: { fps: CEN.fps, count: 8, draw(g, i) {
        // the spin: two full turns of burning brass round the body
        const th = i * Math.PI / 4;
        acolyte(g, { flare: 2, eye: 'p', lit: 2, behind: Math.sin(th) < -0.1,
          hand: [29 + Math.cos(th) * 8, 23 + Math.sin(th) * 4], cen: [CEN.x + Math.cos(th) * CEN.rx, CEN.y + Math.sin(th) * CEN.ry],
          arm2: [29 - Math.cos(th) * 6, 24 - Math.sin(th) * 2],
          post: (gg) => {
            for (let k = 1; k <= 7; k++) {
              const a = th - k * 0.2, x = Math.round(CEN.x + Math.cos(a) * CEN.rx), y = Math.round(CEN.y + Math.sin(a) * CEN.ry);
              if (gg.get(x, y) == null) gg.px(x, y, ['p', 'o', 'n', 'm', 'l', '6', '5'][k - 1]);
            }
          } });
      } },
      dizzy: { fps: 4, count: 2, draw(g, i) {
        // after the spin: bent double, the censer dragging in the dirt
        acolyte(g, { by: 1, lean: 2, head: [1, 1 + i], eye: 'n', hand: [35, 31], sag: [39, 40], cen: [43, 38], lit: ['n', 'o', 'l'],
          post: (gg, c) => smoke(gg, c[0], c[1], i * 2, 6) });
      } },
      hurt: { fps: 8, loop: false, count: 2, draw(g, i) {
        acolyte(g, { by: i ? 0 : -1, lean: -2 + i, head: [-1, -1 + i], eye: 'p', phi: [0.9, 0.5][i], hand: [34, 26] });
      } },
      die: { fps: 8, loop: false, count: 7, draw(g, i) {
        // the censer drops; the acolyte kneels to it and goes to ash; the coals outlast the hand that kept them
        if (i === 0) { acolyte(g, { by: -1, lean: -2, head: [-1, -1], eye: 'p', phi: 1.1, hand: [34, 25] }); return; }
        if (i <= 2) { acolyte(g, { kneel: 1, head: [1, i], eye: i === 1 ? 'o' : 'n', hand: [34, 34], sag: [38, 41], cen: [43, 39], lit: 1 }); return; }
        acolyte(g, { kneel: 1, head: [1, 2], eye: 'n', hand: [34, 34], noCenser: true });
        crumble(g, [0, 0, 0, 0.3, 0.58, 0.84, 1.1][i], 23, ['o', 'n', '7', '8', '6']);
        ashHeap(g, 28, 41, [0, 0, 0, 10, 13, 15, 15][i], [0, 0, 0, 2, 3, 4, 3][i], 9, i < 6 ? 3 : 1);
        flecks(g, 28, 30 - i, 3 + i, 6, i, ['7', '8', '6']);
        censerAt(g, 43, 39, [null, null, null, ['n', 'o', 'n'], ['l', 'n', 'l'], ['k', 'l', 'k'], ['2', 'k', '2']][i]);
        outlineIn(g, 39, 34, 47, 43);
      } },
    },
  });

  const SPIN_T = 16 / CEN.fps;           // two full turns
  // Where the whirling censer is (world px), matching the 'attack' frames (mirrored when facing left)
  function censerPos(e, t) {
    const th = ((t * CEN.fps) % 8) * Math.PI / 4;
    const c = Math.cos(th) * (e.flip ? -1 : 1), s = Math.sin(th);
    return [e.x + c * CEN.rx, e.y - (41 - CEN.y) + s * CEN.ry, c, s];
  }
  function startCenserSpin(e) {
    const D = e.data;
    e.faceTarget();
    const a = e.angleTo(), d = e.dist();
    D.adv = U.clamp(d - 16, 0, 56);                   // it closes the distance while it spins
    D.tx = e.x + Math.cos(a) * D.adv; D.ty = e.y + Math.sin(a) * D.adv;
    e.telegraph({ shape: 'circle', x: e.x, y: e.y, r: 34, life: 0.95, color: '#e2621f' });
    if (D.adv > 10) e.telegraph({ shape: 'circle', x: D.tx, y: D.ty, r: 34, life: 0.7 + SPIN_T, color: '#e2621f' });
    D.whirlT = 0;
    e.go('windup');
  }
  AV.data.enemies.censer = {
    name: 'Censer-Bearer',
    sprite: 'enemy_censer',
    hp: 10, dmg: 2, speed: 34,
    w: 10, h: 6, hurt: { w: 13, h: 24 },
    weight: 1.3, poise: 1,
    aggro: 100, leash: 240,
    pennies: [3, 6], cinder: 10,
    shadow: 7,
    light: { r: 36, color: '#f59a36', intensity: 0.75, oy: -10 },
    init(e) { e.data.orbitDir = U.pick([-1, 1]); e.data.smokeT = 0; e.data.whirlT = 0; },
    brain(e, dt) {
      const D = e.data;
      // the censer never goes out: smoke curls off it wherever it is
      D.smokeT -= dt;
      if (D.smokeT <= 0) {
        D.smokeT = U.rand(0.12, 0.3);
        let sx = e.x + (e.flip ? -8 : 8), sy = e.y - 10;
        if (e.state === 'attack') { const c = censerPos(e, e.st); sx = c[0]; sy = c[1] - 4; }
        else if (e.state === 'windup') { sx = e.x + (e.flip ? -2 : 2); sy = e.y - 40; }
        AV.fx.spawn({ x: sx, y: sy, vx: U.rand(-4, 4), vy: U.rand(-14, -8), life: U.rand(1, 1.8),
          color: U.pick(['#655c69', '#857c86', '#a8a0a6']), alpha: 0.5, sway: 4 });
      }
      switch (e.state) {
        case 'idle':
          e.anim = 'idle';
          if (e.aggro) e.go('chase');
          break;
        case 'chase': {
          e.anim = 'walk';
          if (!e.aggro) { e.go('idle'); break; }
          const d = e.dist();
          if (e.cool <= 0 && d < 80 && packBusy(e) === 0 && e.canSee()) { startCenserSpin(e); break; }
          // keeps to mid range, circling, the censer swinging
          if (d > 72) e.chase(e.speed, dt);
          else if (d < 36) e.move(e.angleTo() + Math.PI, e.speed * 0.9, dt);
          else orbit(e, dt, 54, D.orbitDir, e.speed * 0.75);
          e.faceTarget();
          if (e.st > 2.5) { e.st = 0; if (Math.random() < 0.5) D.orbitDir = -D.orbitDir; }
          break;
        }
        case 'windup':
          e.anim = 'windup';
          e.faceTarget();
          D.whirlT -= dt;
          if (D.whirlT <= 0) { D.whirlT = 0.24 - e.st * 0.12; e.sfx('whoosh', { vol: 0.25 + e.st * 0.3, pitch: 0.8 + e.st * 0.6 }); }
          if (e.st >= 0.7) {
            e.go('attack');
            D.flip = e.flip;
            D.set = new Set(); D.id = AV.combat.newAttackId();
            e.sfx('fire', { vol: 0.5 });
          }
          break;
        case 'attack': {
          e.anim = 'attack';
          e.moveToward(D.tx, D.ty, 52, dt);
          e.flip = D.flip;
          const [cx, cy, c, s] = censerPos(e, e.st);
          const mx = e.x + c * CEN.rx * 0.5, my = e.y - (41 - CEN.y) + s * CEN.ry * 0.5;
          // the censer and the chain; one shared hit-set, so the whole spin can only land once
          e.hitbox({ shape: 'circle', x: cx, y: cy, r: 8, life: 0.02, knock: 150, hitSet: D.set, id: D.id });
          e.hitbox({ shape: 'circle', x: mx, y: my, r: 6, life: 0.02, knock: 120, hitSet: D.set, id: D.id });
          if (Math.random() < 0.6) AV.fx.spawn({ x: cx, y: cy, vx: U.rand(-10, 10), vy: U.rand(-16, -4), life: 0.4,
            color: U.pick(['#f59a36', '#fccf63', '#e2621f']), glow: true });
          AV.fx.addLight(cx, cy, 22, '#f59a36', 0.6);
          if (Math.floor(e.st * CEN.fps / 4) !== Math.floor((e.st - dt) * CEN.fps / 4)) e.sfx('whoosh', { vol: 0.5, pitch: 1.1 });
          if (e.st >= SPIN_T) {
            e.go('recover');
            AV.fx.ash(e.x + (e.flip ? -14 : 14), e.y, 8, { speed: 30, up: 10 });
            e.sfx('slam', { vol: 0.25, pitch: 1.6 });
          }
          break;
        }
        case 'recover':
          // dizzy, the censer dragging in the dirt: the punish window
          e.anim = 'dizzy';
          if (e.st >= 1.05) { e.cool = U.rand(1.2, 2.2); e.go('chase'); }
          break;
        default: e.go('idle');
      }
    },
  };

  // =================================================================================================
  // CINDERHOUND & THE HOUND OF TALLOW LANE — dogs the ash got into. The ribs show; something burns between them.
  // =================================================================================================
  // One dog rig for both. Poses are authored at k=1 with the paws on y=0 (up is negative), tail root near x=0,
  // facing right; dog(g, k, ox, oy, pose) maps them into the frame (X = ox + x*k, Y = oy + y*k).
  // pose: { H hip, S shoulder, Hd head, nf/ff/nb/fb legs (point lists; near/far, front/back), tail, chest (rib-cage
  //         depth), tilt (head angle, - = up), jaw 0..2, ears 'prick'|'flat'|'drop', glow 0..5, eye, tongue,
  //         hackles, collar, post(g, T) }
  function dog(g, k, ox, oy, p) {
    const X = (x) => ox + x * k, Y = (y) => oy + y * k;
    const T = (q) => [X(q[0]), Y(q[1])];
    const H = p.H, S = p.S, Hd = p.Hd, tilt = p.tilt || 0, big = k > 1.2, hs = big ? 1.22 : 1;
    const el = (x, y, rx, ry, c) => g.ellipse(X(x), Y(y), rx * k, ry * k, c);
    const poly = (pts, c) => g.poly(pts.map(T), c);
    const dot = (q, c) => { const [x, y] = T(q); g.px(Math.round(x), Math.round(y), c); };
    const thick = (a, b, w, c) => {
      const [x0, y0] = T(a), [x1, y1] = T(b);
      const hor = Math.abs(x1 - x0) > Math.abs(y1 - y0);
      for (let o = 0; o < w; o++) {
        const d = o - Math.floor((w - 1) / 2);
        if (hor) g.line(x0, y0 + d, x1, y1 + d, c); else g.line(x0 + d, y0, x1 + d, y1, c);
      }
    };
    const limb = (pts, c) => {
      if (!pts) return;
      const w = big ? 3 : 2;
      for (let i = 0; i + 1 < pts.length; i++) thick(pts[i], pts[i + 1], i === 0 ? w + 1 : w, c);
      const [px, py] = T(pts[pts.length - 1]);
      g.line(px - (big ? 1 : 0), py, px + (big ? 2 : 1), py, c);
    };
    // far side
    limb(p.fb, '2'); limb(p.ff, '2');
    if (p.tail) for (let i = 0; i + 1 < p.tail.length; i++) thick(p.tail[i], p.tail[i + 1], i === 0 && big ? 2 : 1, '3');
    // body masses: haunch, rib cage, the tucked belly between, the neck
    const ch = p.chest || (big ? 4.3 : 3.7);
    el(H[0] + 1, H[1] + 1.4, big ? 4 : 3.4, big ? 3.5 : 3, '3');
    el(S[0] - 2, S[1] + 1.8, big ? 5 : 4.4, ch, '3');
    poly([[H[0], H[1] - 2.3], [S[0] - 1, S[1] - 2.3], [S[0], S[1] + ch - 0.8], [H[0] + 5, H[1] + (big ? 3 : 2.4)], [H[0] + 2, H[1] + (big ? 4 : 3.2)]], '3');
    poly([[S[0] - 3, S[1] - 2.3], [Hd[0] - 2, Hd[1] - 2], [Hd[0] + 1, Hd[1] + 2], [S[0] + (big ? 2.5 : 2), S[1] + (big ? 3 : 2.4)]], '3');
    // head: skull, muzzle and jaw rotate about the hinge of the jaw
    el(Hd[0], Hd[1], 2.8 * hs, 2.5 * hs, '3');
    const ja = [0, 0.42, 0.85][p.jaw || 0];
    const R = (q, a) => {
      const dx = (q[0] - 0.5) * hs, dy = (q[1] - 0.8) * hs, c = Math.cos(a), s = Math.sin(a);
      return [Hd[0] + 0.5 + dx * c - dy * s, Hd[1] + 0.8 + dx * s + dy * c];
    };
    if (ja) poly([R([0.6, 0.9], tilt), R([5.4, 0.9], tilt), R([4.6, 0.9], tilt + ja)], 'k');
    poly([[0.2, -1.8], [5.6, -0.5], [5.6, 0.9], [0.2, 0.9]].map((q) => R(q, tilt)), '3');
    poly([[0.4, 0.9], [4.6, 0.9], [4.3, big ? 2.2 : 1.9], [0.4, big ? 2.8 : 2.3]].map((q) => R(q, tilt + ja)), '3');
    const ears = p.ears || 'prick';
    if (ears === 'prick') poly([[Hd[0] - 2, Hd[1] - 1.2], [Hd[0] - 2.6, Hd[1] - 5], [Hd[0] + 0.2, Hd[1] - 2]], '3');
    else if (ears === 'flat') poly([[Hd[0] - 1.5, Hd[1] - 1.8], [Hd[0] - 5, Hd[1] - 2.8], [Hd[0] - 1, Hd[1] - 0.6]], '3');
    // hackles along the spine; a shaggy underside on the big one
    if (p.hackles || big) {
      const xa = Math.round(X(H[0] - 2)), xb = Math.round(X(S[0] + 1));
      for (let x = xa; x <= xb; x++) {
        let ty = -1, byy = -1;
        for (let y = 0; y < g.h; y++) if (g.get(x, y) === '3') { if (ty < 0) ty = y; byy = y; }
        if (ty < 0) continue;
        if (p.hackles && x % 2 === 0) { g.px(x, ty - 1, '3'); if (hashf(x, 2, 9) < 0.6) g.px(x, ty - 2, '3'); }
        if (big && hashf(x, byy, 5) < 0.55) g.px(x, byy + 1, '3');
      }
    }
    // near side
    limb(p.nb, '3'); limb(p.nf, '3');
    if (ears === 'drop') poly([[Hd[0] - 1.6, Hd[1] - 1.8], [Hd[0] - 0.2, Hd[1] - 2], [Hd[0] - 0.1, Hd[1] + 1.8], [Hd[0] - 1.4, Hd[1] + 2.8], [Hd[0] - 2.2, Hd[1] + 1]], '2');
    rim(g, '12345');
    g.each((x, y, c) => (c === '3' ? (hashf(x, y, 31) < 0.12 ? '2' : hashf(x, y, 37) < 0.08 ? '4' : undefined) : undefined));
    // the ribs, and what burns between them
    const G = [['k', 'k'], ['k', 'l'], ['l', 'm'], ['m', 'n'], ['n', 'o'], ['o', 'p']][p.glow == null ? 3 : p.glow];
    const nr = big ? 4 : 3;
    for (let j = 0; j < nr; j++) {
      const rx = S[0] - 5.2 + j * (big ? 1.45 : 1.9);
      for (let t = 0.12; t <= 0.95; t += 0.1) {
        const x = Math.round(X(rx + 0.8 - t * 1.2)), y = Math.round(Y(S[1] - 0.6 + t * ch * 1.05));
        const c = g.get(x, y);
        if (c && '12345'.includes(c)) g.px(x, y, t > 0.25 && t < 0.75 ? G[1] : G[0]);
      }
    }
    // eye (the big one's sits low under a heavy brow), nose, teeth, the glowing throat
    const [ex0, ey0] = T([Hd[0] + 1 * hs, Hd[1] - 0.7 * hs]);
    const ex = Math.round(ex0), ey = Math.round(ey0);
    g.px(ex, ey, p.eye || 'p');
    if (big) { g.px(ex - 1, ey, p.eye === '2' ? '2' : 'n'); g.px(ex - 1, ey - 1, '2'); g.px(ex, ey - 1, '2'); g.px(ex + 1, ey - 1, '4'); }
    dot(R([5.5, -0.3], tilt), '1');
    if (ja) {
      dot(R([4.8, 1.1], tilt), '9'); dot(R([2.8, 1.1], tilt), '9');
      dot(R([4.0, 0.7], tilt + ja), '9');
      dot(R([1.6, 1.0], tilt + ja * 0.5), ja > 0.5 ? 'o' : 'n');
      if (p.tongue) { const t0 = R([3.4, 2.2], tilt + ja); dot(t0, 'I'); dot([t0[0] + 0.3, t0[1] + 1 / k], 'H'); }
    }
    // the collar someone buckled on it, and the brass tag with a name nobody calls any more
    if (p.collar) {
      const nx = S[0] + (Hd[0] - S[0]) * 0.4, ny = S[1] + (Hd[1] - S[1]) * 0.4;
      const na = Math.atan2(Hd[1] - S[1], Hd[0] - S[0]) + Math.PI / 2;
      for (let t = -3; t <= 3; t += 0.3) {
        const [x, y] = T([nx + Math.cos(na) * t, ny + Math.sin(na) * t]);
        const rx = Math.round(x), ry = Math.round(y);
        if (g.get(rx, ry) != null) { g.px(rx, ry, t < -1.8 ? 'e' : 'd'); if (g.get(rx + 1, ry) != null) g.px(rx + 1, ry, 'c'); }
      }
      const [tx, ty] = T([nx + Math.cos(na) * 3.1, ny + Math.sin(na) * 3.1]);
      g.px(Math.round(tx), Math.round(ty), 'L'); g.px(Math.round(tx), Math.round(ty) + 1, 'M'); g.px(Math.round(tx) - 1, Math.round(ty) + 1, 'K');
    }
    g.outline('0');
    if (p.post) p.post(g, T);
  }

  function tailOf(H, kind) {
    const x = H[0], y = H[1];
    if (kind === 'up') return [[x - 1.5, y - 1], [x - 4, y - 3], [x - 6, y - 4.5]];
    if (kind === 'back') return [[x - 1.5, y - 1], [x - 5, y - 1], [x - 8.5, y]];
    if (kind === 'curl') return [[x - 1.5, y], [x - 3.5, y + 2], [x - 2.5, y + 4.5], [x, y + 5]];
    return [[x - 1.5, y - 1], [x - 4, y + 1], [x - 5, y + 4], [x - 5.5, y + 6.5]];
  }
  function legsStand(H, S) {
    return {
      nf: [[S[0], S[1] + 3], [S[0] + 0.5, -4], [S[0] + 1, 0]],
      ff: [[S[0] - 2.5, S[1] + 3], [S[0] - 2, -4], [S[0] - 2.5, 0]],
      nb: [[H[0] + 1, H[1] + 2], [H[0] + 3.5, -5.5], [H[0] + 1, -3], [H[0] + 1.5, 0]],
      fb: [[H[0] - 1.5, H[1] + 2], [H[0] + 1, -5.5], [H[0] - 1.5, -3], [H[0] - 1, 0]],
    };
  }
  function legsRun(H, S, i) {
    const f = S[0], fy = S[1] + 3, h = H[0], hy = H[1] + 2;
    return [
      { nf: [[f, fy], [f + 4, -5], [f + 7, -2]], ff: [[f - 2, fy], [f + 2, -4], [f + 5, -1]],
        nb: [[h + 1, hy], [h - 3, -6], [h - 6, -2]], fb: [[h - 1, hy], [h - 4, -5], [h - 7, -3]] },
      { nf: [[f, fy], [f, -4], [f + 1, 0]], ff: [[f - 2, fy], [f - 3, -4], [f - 5, -1]],
        nb: [[h + 1, hy], [h + 3, -6], [h + 5, -2]], fb: [[h - 1, hy], [h + 1, -5], [h + 3, -2]] },
      { nf: [[f, fy], [f - 2, -4], [f - 4, -1]], ff: [[f - 2, fy], [f - 4, -4], [f - 6, -2]],
        nb: [[h + 1, hy], [h + 5, -5], [h + 8, -1]], fb: [[h - 1, hy], [h + 4, -5], [h + 7, -2]] },
      { nf: [[f, fy], [f + 3, -5], [f + 5, -3]], ff: [[f - 2, fy], [f + 1, -5], [f + 3, -3]],
        nb: [[h + 1, hy], [h + 2, -5], [h + 1, 0]], fb: [[h - 1, hy], [h - 2, -5], [h - 3, 0]] },
    ][i];
  }
  function legsWalk(H, S, i) {
    const f = S[0], fy = S[1] + 3, h = H[0], hy = H[1] + 2;
    const a = [1, 0, -1, 0][i], lf = i === 1 ? -1.2 : 0, lb = i === 3 ? -1.2 : 0;
    return {
      nf: [[f, fy], [f + 1 + a * 1.5, -4], [f + 1 + a * 2.5, lf]],
      ff: [[f - 2.5, fy], [f - 2 - a * 1.5, -4], [f - 2.5 - a * 2.5, lb]],
      nb: [[h + 1, hy], [h + 3.5 - a, -5.5], [h + 1 - a * 2, -3], [h + 1.5 - a * 2.5, lb]],
      fb: [[h - 1.5, hy], [h + 1 + a, -5.5], [h - 1.5 + a * 2, -3], [h - 1 + a * 2.5, lf]],
    };
  }
  function standPose(b, extra) {
    const H = [6, -11 + b], S = [16, -11 + b], Hd = [21, -15 + b];
    return Object.assign({ H, S, Hd, tail: tailOf(H) }, legsStand(H, S), extra || {});
  }
  function crouchPose(i, extra) {
    const H = [6 + i * 0.3, -10], S = [16, -7.5], Hd = [21, -9.5];
    return Object.assign({ H, S, Hd, tail: tailOf(H, 'up'), ears: 'flat', jaw: 1, hackles: true,
      nf: [[S[0], S[1] + 3], [S[0] + 2.5, -2.5], [S[0] + 3.5, 0]], ff: [[S[0] - 2, S[1] + 3], [S[0] + 0.5, -2.5], [S[0] + 1.5, 0]],
      nb: [[H[0] + 1, H[1] + 2], [H[0] + 4.5, -4.5], [H[0] + 1, -2], [H[0] + 2, 0]],
      fb: [[H[0] - 1.5, H[1] + 2], [H[0] + 2, -4.5], [H[0] - 1.5, -2], [H[0] - 0.5, 0]] }, extra || {});
  }
  function pouncePose(i, extra) {
    const dy = i, H = [5, -13 + dy], S = [17, -14 + dy], Hd = [23, -15 + dy];
    return Object.assign({ H, S, Hd, tail: tailOf(H, 'back'), ears: 'flat', jaw: i ? 0 : 2, glow: 5, chest: 4,
      nf: [[S[0], S[1] + 3], [S[0] + 4, -8 + dy], [S[0] + 7, -6 + dy]], ff: [[S[0] - 2, S[1] + 3], [S[0] + 2, -7 + dy], [S[0] + 5, -6 + dy]],
      nb: [[H[0] + 1, H[1] + 2], [H[0] - 3, -8 + dy], [H[0] - 7, -6 + dy]], fb: [[H[0] - 1, H[1] + 2], [H[0] - 5, -9 + dy], [H[0] - 8, -8 + dy]] }, extra || {});
  }
  function liePose(extra) {
    const H = [6, -5], S = [16, -5.5], Hd = [21.5, -5.2];
    return Object.assign({ H, S, Hd, chest: 3.4, tail: tailOf(H, 'curl'),
      nf: [[S[0], S[1] + 2], [S[0] + 3.5, -1], [S[0] + 9.5, -0.3]],
      ff: [[S[0] - 1.5, S[1] + 2], [S[0] + 2, -1.2], [S[0] + 8, -0.8]],
      nb: [[H[0] + 1, H[1] + 1], [H[0] + 4.5, -2.5], [H[0] + 2, -0.3], [H[0] + 4, 0]], fb: null }, extra || {});
  }

  // ---- Cinderhound: sheet 36x26, anchor (16,24)
  const hd = (g, p) => dog(g, 1, 5, 24, p);
  art.sheet('enemy_hound', {
    w: 36, h: 26, ox: 16, oy: 24,
    anims: {
      idle: { fps: 4, count: 4, draw(g, i) {
        hd(g, standPose(i === 2 ? 0.4 : 0, { glow: [2, 3, 4, 3][i], chest: [3.6, 3.8, 4, 3.8][i] }));
      } },
      walk: { fps: 12, count: 4, draw(g, i) {
        const b = [-1, 0, 0.5, 0][i];
        const H = [6, -11 + b], S = [16, -11.5 + b], Hd = [22, -13.5 + b];
        hd(g, Object.assign({ H, S, Hd, tail: tailOf(H, 'back'), glow: 3, ears: 'flat' }, legsRun(H, S, i)));
      } },
      windup: { fps: 12, count: 2, draw(g, i) {   // the crouch: head low, haunches cocked, the ribs flare
        hd(g, crouchPose(i, { glow: 4 + i, eye: 'q' }));
      } },
      attack: { fps: 10, loop: false, count: 2, draw(g, i) { hd(g, pouncePose(i)); } },
      pant: { fps: 6, count: 4, draw(g, i) {
        const b = [0, 0.5, 1, 0.5][i];
        hd(g, standPose(b, { Hd: [21, -13.5 + b], jaw: 1, tongue: true, glow: [2, 3, 3, 2][i], chest: [3.5, 3.9, 4.2, 3.9][i] }));
      } },
      hurt: { fps: 8, loop: false, count: 2, draw(g, i) {
        hd(g, standPose(-1 + i, { Hd: [19.5, -17 + i], tilt: -0.35, jaw: 1, ears: 'flat', eye: 'q', glow: 5 }));
      } },
      die: { fps: 8, loop: false, count: 6, draw(g, i) {
        if (i === 0) { hd(g, standPose(-1, { Hd: [19.5, -17], tilt: -0.35, jaw: 1, ears: 'flat', eye: 'q', glow: 5 })); return; }
        // down on its belly; the fire between the ribs goes out; ash
        hd(g, liePose({ glow: [0, 3, 2, 1, 0, 0][i], eye: i > 1 ? '2' : 'n', ears: 'flat' }));
        if (i >= 2) {
          crumble(g, [0, 0, 0.3, 0.6, 0.85, 1.1][i], 17, ['n', 'l', '6', '5', '7']);
          ashHeap(g, 17, 24, [0, 0, 10, 14, 16, 16][i], [0, 0, 2, 3, 3, 2][i], 13, i < 5 ? 3 : 1);
          flecks(g, 17, 18 - i, 2 + i, 6, i + 4, ['6', '7', '5']);
        }
      } },
    },
  });

  AV.data.enemies.hound = {
    name: 'Cinderhound',
    sprite: 'enemy_hound',
    hp: 5, dmg: 1, speed: 72,
    w: 12, h: 6, hurt: { w: 18, h: 13 },
    weight: 0.8, poise: 0,
    aggro: 110, leash: 280,
    pennies: [1, 3], cinder: 6,
    shadow: 8,
    light: { r: 18, color: '#e2621f', intensity: 0.45, oy: -8 },
    init(e) { e.data.orbitDir = U.pick([-1, 1]); e.data.rad = U.rand(40, 54); },
    onAggro(e) { e.sfx('growl', { pitch: 1.35, vol: 0.5 }); },
    brain(e, dt) {
      const D = e.data;
      if (e.state !== 'attack') e.z = Math.max(0, (e.z || 0) - 40 * dt);
      switch (e.state) {
        case 'idle':
          e.anim = 'idle';
          if (e.aggro) e.go('chase');
          break;
        case 'chase': {
          e.anim = 'walk';
          if (!e.aggro) { e.go('idle'); break; }
          const d = e.dist();
          // circles; the pack takes turns
          if (d > D.rad + 24) e.chase(e.speed, dt);
          else orbit(e, dt, D.rad, D.orbitDir, e.speed * 0.85);
          if (e.cool <= 0 && d < 76 && d > 16 && packBusy(e) === 0 && e.canSee()) {
            e.faceTarget();
            D.aim = e.angleTo();
            D.len = U.clamp(d + 14, 40, 78);
            e.telegraph({ shape: 'line', x: e.x, y: e.y - 2, a: D.aim, len: D.len + 6, width: 10, life: 0.62, color: '#e2621f' });
            e.sfx('growl', { pitch: 1.5, vol: 0.55 });
            e.go('windup');
            break;
          }
          if (e.st > 3) { e.st = 0; if (Math.random() < 0.4) D.orbitDir = -D.orbitDir; }
          break;
        }
        case 'windup':
          // the crouch: 0.4 s, committed to the line it showed
          e.anim = 'windup';
          e.flip = Math.cos(D.aim) < 0;
          if (e.st >= 0.4) {
            e.go('attack');
            D.dur = D.len / 250;
            e.hitbox({ shape: 'circle', follow: e, fx: Math.cos(D.aim) * 6, fy: -5, r: 9, life: D.dur, knock: 110 });
            e.sfx('whoosh', { vol: 0.4, pitch: 1.3 });
          }
          break;
        case 'attack':
          // the pounce
          e.anim = 'attack';
          e.move(D.aim, 250, dt);
          e.flip = Math.cos(D.aim) < 0;
          e.z = Math.sin(U.clamp(e.st / D.dur, 0, 1) * Math.PI) * 5;
          if (e.st >= D.dur) { e.z = 0; AV.fx.ash(e.x, e.y, 6, { speed: 35, up: 8 }); e.go('recover'); }
          break;
        case 'recover':
          // it pants, sides heaving: the punish window
          e.anim = e.st < 0.12 ? 'attack' : 'pant';
          if (e.st >= 0.85) { e.cool = U.rand(0.8, 1.8); D.orbitDir = U.pick([-1, 1]); e.go('chase'); }
          break;
        default: e.go('idle');
      }
    },
  };

  // ---- The hound of Tallow Lane: sheet 56x44, anchor (24,41). Huge, heavy, drop-eared, collared; the fire in it
  // has burned low. Also used as an NPC (anims 'lie' and 'growl').
  const bh = (g, p) => dog(g, 1.6, 6, 41, Object.assign({ ears: 'drop', collar: true }, p));
  art.sheet('enemy_hound_big', {
    w: 56, h: 44, ox: 24, oy: 41,
    anims: {
      idle: { fps: 3, count: 4, draw(g, i) {
        const b = [0, 0.3, 0.5, 0.3][i];
        bh(g, standPose(b, { Hd: [21, -14 + b], glow: [1, 2, 2, 1][i], chest: [4.3, 4.5, 4.6, 4.5][i] }));
      } },
      walk: { fps: 6, count: 4, draw(g, i) {
        const b = [0, -0.4, 0, -0.4][i];
        const H = [6, -11 + b], S = [16, -11 + b];
        bh(g, Object.assign({ H, S, Hd: [21.5, -13.5 + b], tail: tailOf(H), glow: 2 }, legsWalk(H, S, i)));
      } },
      lie: { fps: 2, count: 4, draw(g, i) {
        // head on its paws by the door. On the third breath it opens an eye.
        bh(g, liePose({ glow: 1, chest: [3.4, 3.6, 3.6, 3.4][i], eye: i === 2 ? 'o' : '2' }));
      } },
      growl: { fps: 8, count: 2, draw(g, i) {
        const H = [6 + i * 0.25, -11], S = [16, -9.5];
        bh(g, Object.assign({ H, S, Hd: [21, -10.5], tail: tailOf(H, 'up'), ears: 'flat', jaw: 1, hackles: true, glow: 3 + i, eye: 'p' },
          legsStand(H, S), { nf: [[S[0], S[1] + 3], [S[0] + 1.5, -3.5], [S[0] + 2.5, 0]], ff: [[S[0] - 2.5, S[1] + 3], [S[0] - 0.5, -3.5], [S[0], 0]] }));
      } },
      windup: { fps: 10, count: 2, draw(g, i) { bh(g, crouchPose(i, { glow: 4 + i, eye: 'p' })); } },
      attack: { fps: 10, loop: false, count: 2, draw(g, i) { bh(g, pouncePose(i)); } },
      bite: { fps: 12, loop: false, count: 3, draw(g, i) {
        const S = [16 + [0, 1.5, 1.5][i], -11 + [-0.5, 0.5, 0.5][i]], H = [6, -11];
        bh(g, Object.assign({ H, S, tail: tailOf(H, 'up'), ears: 'flat', hackles: true, glow: 4, eye: 'p',
          Hd: [[19.5, -16], [24, -11], [24, -11]][i], tilt: [-0.3, 0.25, 0.2][i], jaw: [2, 2, 0][i],
          post: i === 2 ? (gg, T) => { const [x, y] = T([29.5, -12]); gg.px(Math.round(x) + 1, Math.round(y), 'q'); gg.px(Math.round(x) + 2, Math.round(y) - 2, 'p'); gg.px(Math.round(x) + 2, Math.round(y) + 2, 'p'); } : null },
          legsStand(H, S)));
      } },
      rear: { fps: 6, count: 2, draw(g, i) {
        // the howl's wind-up: braced, head going up, the ribs lighting one by one
        const H = [6, -11], S = [16, -12.5];
        bh(g, Object.assign({ H, S, Hd: [18.5, -17.5 - i * 0.5], tilt: -0.8 - i * 0.2, jaw: 1, glow: 3 + i, eye: 'p', tail: tailOf(H, 'up') },
          legsStand(H, S), { nf: [[S[0], S[1] + 3], [S[0] + 2, -4], [S[0] + 3.5, 0]] }));
      } },
      howl: { fps: 8, count: 2, draw(g, i) {
        const H = [6, -11], S = [16, -12.5];
        bh(g, Object.assign({ H, S, Hd: [18.2, -18.5 + i * 0.3], tilt: -1.2, jaw: 2, glow: 5, eye: '2', tail: tailOf(H, 'up') },
          legsStand(H, S), { nf: [[S[0], S[1] + 3], [S[0] + 2, -4], [S[0] + 3.5, 0]] }));
      } },
      pant: { fps: 5, count: 4, draw(g, i) {
        const b = [0, 0.4, 0.8, 0.4][i];
        bh(g, standPose(b, { Hd: [21, -13 + b], jaw: 1, tongue: true, glow: [1, 2, 2, 1][i], chest: [4.2, 4.6, 4.8, 4.6][i] }));
      } },
      hurt: { fps: 8, loop: false, count: 2, draw(g, i) {
        bh(g, standPose(-1 + i, { Hd: [19.5, -17 + i], tilt: -0.35, jaw: 1, ears: 'flat', eye: 'p', glow: 4 }));
      } },
      die: { fps: 7, loop: false, count: 7, draw(g, i) {
        // it lies down the way it lay by the door, closes its eyes, and is ash. The collar stays.
        if (i === 0) { bh(g, standPose(-1, { Hd: [19.5, -17], tilt: -0.35, jaw: 1, ears: 'flat', eye: 'p', glow: 4 })); return; }
        bh(g, liePose({ glow: [0, 2, 1, 0, 0, 0, 0][i], eye: i === 1 ? 'o' : '2' }));
        if (i >= 3) {
          crumble(g, [0, 0, 0, 0.3, 0.58, 0.84, 1.1][i], 29, ['n', 'l', '6', '5', '7']);
          ashHeap(g, 26, 41, [0, 0, 0, 18, 24, 27, 27][i], [0, 0, 0, 3, 4, 5, 4][i], 21, i < 6 ? 4 : 2);
          flecks(g, 26, 30 - i, 3 + i, 10, i + 9, ['6', '7', '5']);
          const cy = 41 - [0, 0, 0, 3, 4, 5, 4][i];
          put(g, 32, cy, 'cddc'); put(g, 31, cy + 1, 'c'); put(g, 36, cy + 1, 'c'); put(g, 33, cy + 1, 'LM');
          outlineIn(g, 30, cy - 1, 38, cy + 2);
        }
      } },
    },
  });

  function biteMark(e, life) {
    const D = e.data;
    e.telegraph({ shape: 'circle', x: e.x + Math.cos(D.aim) * 24, y: e.y + Math.sin(D.aim) * 18, r: 16, life, color: '#e2621f' });
  }
  function bigHoundAttack(e, d) {
    const D = e.data;
    let pick = d < 42 ? 'bite' : d < 115 ? 'pounce' : null;
    if (!pick) return;
    if (D.crowd >= 3 || (d < 60 && Math.random() < 0.22)) pick = 'howl';
    if (D.last[0] === pick && D.last[1] === pick) {
      pick = pick === 'bite' ? (d < 60 ? 'howl' : 'pounce') : pick === 'howl' ? (d < 42 ? 'bite' : 'pounce') : (d < 60 ? 'bite' : 'howl');
    }
    D.last = [pick, D.last[0]];
    D.move = pick;
    D.aim = e.angleTo();
    e.faceTarget();
    if (pick === 'pounce') {
      D.len = U.clamp(d + 20, 50, 120);
      e.telegraph({ shape: 'line', x: e.x, y: e.y - 3, a: D.aim, len: D.len + 10, width: 20, life: 0.9, color: '#e2621f' });
      e.sfx('growl', { pitch: 0.75, vol: 0.8 });
    } else if (pick === 'bite') {
      D.snap = 0;
      biteMark(e, 0.42);
      e.sfx('growl', { pitch: 0.9, vol: 0.7 });
    } else {
      D.crowd = 0;
      e.telegraph({ shape: 'circle', x: e.x, y: e.y, r: 84, life: 0.9, color: '#cbc4c3' });
      e.telegraph({ shape: 'circle', x: e.x, y: e.y, r: 30, life: 0.75, color: '#cbc4c3' });
      e.sfx('growl', { pitch: 0.55, vol: 0.9 });
    }
    e.go('windup');
  }
  AV.data.enemies.hound_big = {
    name: 'The Hound of Tallow Lane',
    sprite: 'enemy_hound_big',
    hp: 40, dmg: 3, speed: 50,
    w: 22, h: 8, hurt: { w: 30, h: 24 },
    weight: 4, poise: 2,
    aggro: 120, leash: 320,
    pennies: [0, 0], cinder: 40,
    shadow: 15,
    light: { r: 26, color: '#e2621f', intensity: 0.45, oy: -14 },
    init(e) { const D = e.data; D.last = []; D.crowd = 0; D.orbitDir = U.pick([-1, 1]); D.move = 'pounce'; },
    onAggro(e) { e.sfx('growl', { pitch: 0.6, vol: 0.9 }); },
    onHit(e) { e.data.crowd++; },
    brain(e, dt) {
      const D = e.data;
      if (e.state !== 'attack') e.z = Math.max(0, (e.z || 0) - 60 * dt);
      switch (e.state) {
        case 'idle':
          // it warns before it wakes
          e.anim = e.dist() < 150 ? 'growl' : 'idle';
          if (e.aggro) e.go('stalk');
          break;
        case 'stalk': {
          if (!e.aggro) { e.go('idle'); break; }
          const d = e.dist();
          e.anim = 'walk';
          if (d > 64) e.chase(e.speed, dt);
          else orbit(e, dt, 50, D.orbitDir, e.speed * 0.6);
          e.faceTarget();
          if (e.cool <= 0 && e.canSee()) bigHoundAttack(e, d);
          if (e.st > 3) { e.st = 0; D.orbitDir = -D.orbitDir; }
          break;
        }
        case 'windup':
          e.flip = Math.cos(D.aim) < 0;
          if (D.move === 'pounce') {
            e.anim = 'windup';
            if (e.st >= 0.55) {
              D.dur = D.len / 250;
              e.hitbox({ shape: 'circle', follow: e, fx: Math.cos(D.aim) * 12, fy: -10, r: 14, life: D.dur, knock: 190 });
              e.sfx('roar', { pitch: 1.4, vol: 0.5 });
              e.go('attack');
            }
          } else if (D.move === 'bite') {
            e.anim = 'growl';
            if (e.st >= (D.snap ? 0.36 : 0.42)) {
              const heavy = D.snap === 2;
              e.hitbox({ shape: 'arc', x: e.x, y: e.y - 8, r: heavy ? 34 : 30, a: D.aim, spread: 0.55, life: 0.1,
                knock: heavy ? 220 : 120, dmg: heavy ? e.dmg : 2 });
              e.sfx('growl', { pitch: 1.2, vol: 0.6 }); e.sfx('swing', { pitch: 0.6, vol: 0.5 });
              e.knock(D.aim, heavy ? 120 : 70);
              e.go('attack');
            }
          } else {
            e.anim = 'rear';
            if (e.st >= 0.75) {
              e.shockwave({ x: e.x, y: e.y, r0: 8, speed: 150, max: 88, thick: 12, dmg: 2, knock: 280, color: '#cbc4c3' });
              AV.fx.shake(3, 0.35);
              e.sfx('roar', { pitch: 0.7, vol: 0.9 });
              AV.fx.ash(e.x, e.y - 20, 20, { speed: 90, r: 10 });
              e.go('attack');
            }
          }
          break;
        case 'attack':
          if (D.move === 'pounce') {
            e.anim = 'attack';
            e.move(D.aim, 250, dt);
            e.flip = Math.cos(D.aim) < 0;
            e.z = Math.sin(U.clamp(e.st / D.dur, 0, 1) * Math.PI) * 8;
            if (e.st >= D.dur) {
              e.z = 0; AV.fx.ash(e.x, e.y, 14, { speed: 50, up: 12 }); AV.fx.shake(2, 0.12); e.sfx('slam', { vol: 0.4, pitch: 0.9 });
              D.restT = 0.8; e.go('rest');
            }
          } else if (D.move === 'bite') {
            e.anim = 'bite';
            if (e.st >= 0.22) {
              D.snap++;
              if (D.snap < 3 && e.dist() < 70) {
                D.aim += U.angleDiff(D.aim, e.angleTo()) * 0.5;
                biteMark(e, 0.36);
                e.go('windup');
              } else { D.restT = 0.9; e.go('rest'); }
            }
          } else {
            // still howling, head up: the long punish window
            e.anim = 'howl';
            if (e.st >= 0.9) { D.restT = 0.5; e.go('rest'); }
          }
          break;
        case 'rest':
          e.anim = 'pant';
          if (e.st >= D.restT) { e.cool = U.rand(0.5, 1.2); e.go('stalk'); }
          break;
        case 'recover':
          e.anim = 'pant';
          if (e.st >= 0.4) { e.cool = Math.max(e.cool, 0.3); e.go('stalk'); }
          break;
        default: e.go('idle');
      }
    },
  };

  // =================================================================================================
  // TALLOW MOTH — pale as candle-fat, big as a hand, and it has smelled your flame.
  // =================================================================================================
  // Sheet 20x18, anchor (10,12) (it flies: the engine lifts it by e.z). Seen from above, wings spread, head up.
  // p: { sp (wing span 0..1), sweep (wings swept back for the dive), eye, glow, torn, drop }
  function moth(g, p) {
    const cx = 10, cy = 8, sp = p.sp == null ? 1 : p.sp, sw = p.sweep || 0;
    for (const s of [-1, 1]) {
      const W = (x, y) => [cx + s * (0.6 + x * sp), cy + y + sw * x * 0.5];
      g.poly([W(0, 1), W(5.5, 2.5 + sw), W(5.5, 6.5 + sw), W(1.5, 5)], 'g');                            // hind wing
      g.poly([W(0, -2), W(7.5, -5 + sw * 2), W(9, -1.5 + sw * 2), W(6, 2.5 + sw), W(0, 1.5)], '8');     // fore wing
    }
    rim(g, '6789');
    for (const s of [-1, 1]) {
      const W = (x, y) => [Math.round(cx + s * (0.6 + x * sp)), Math.round(cy + y + sw * x * 0.5)];
      if (sp > 0.45) {
        g.line(...W(0.4, -2), ...W(7.2, -4.8 + sw * 2), '9');                   // leading edge
        g.line(...W(2.6, -3.2 + sw), ...W(3.4, 1.6 + sw), 'f');                 // a tallow-coloured band
        const [ex, ey] = W(5.4, -1.6 + sw * 1.5);                               // the eye-spot
        g.px(ex, ey, 'e'); g.px(ex + s, ey, 'c');
        const [hx, hy] = W(3.8, 4.2 + sw);
        g.px(hx, hy, 'f');
      } else {
        const [ux, uy] = W(3, -2.5 + sw);
        g.px(ux, uy, '7');
      }
    }
    // furred body: collar, thorax, banded abdomen; ember-bright eyes; feathered antennae
    g.ellipse(cx, 10.5, 1, 2.5, '6');
    g.px(cx, 10, '5'); g.px(cx, 12, '5');
    g.ellipse(cx, 6.5, 1.2, 2, '7');
    put(g, cx - 1, 5, '898');
    put(g, cx - 1, 3, '777'); put(g, cx - 1, 4, '777');
    const eye = p.eye || 'o';
    g.px(cx - 1, 3, eye); g.px(cx + 1, 3, eye);
    if (p.glow) { g.px(cx, 7, 'p'); g.px(cx, 6, 'o'); }
    g.line(cx - 1, 2, cx - 3, 0, '6'); g.px(cx - 3, 1, '6');
    g.line(cx + 1, 2, cx + 3, 0, '6'); g.px(cx + 3, 1, '6');
    if (p.torn) g.each((x, y, c) => (c && c !== '0' && Math.abs(x - cx) > 3 && hashf(x, y, p.torn) < 0.22 ? null : undefined));
    g.outline('1');
    if (p.drop) g.shift(0, p.drop);
  }
  art.sheet('enemy_moth', {
    w: 20, h: 18, ox: 10, oy: 12,
    anims: {
      idle: { fps: 12, count: 4, draw(g, i) { moth(g, { sp: [1, 0.6, 0.25, 0.6][i] }); } },
      walk: { fps: 18, count: 4, draw(g, i) { moth(g, { sp: [1, 0.6, 0.25, 0.6][i], glow: 1 }); } },          // frantic
      windup: { fps: 16, count: 2, draw(g, i) { moth(g, { sp: [0.3, 0.45][i], eye: 'p', glow: 1 }); } },    // wings up, quivering
      attack: { fps: 10, loop: false, count: 2, draw(g, i) { moth(g, { sp: [0.75, 0.65][i], sweep: [1.2, 1.6][i], eye: 'p', glow: 1 }); } },
      hurt: { fps: 10, loop: false, count: 2, draw(g, i) { moth(g, { sp: [0.9, 0.5][i], eye: 'q', torn: 3 }); } },
      die: { fps: 8, loop: false, count: 6, draw(g, i) {
        // the wings fold, it drops, and it is only dust
        moth(g, { sp: [0.8, 0.5, 0.35, 0.3, 0.3, 0.3][i], eye: i > 1 ? '5' : 'n', torn: 5 + i, drop: Math.min(4, i) });
        if (i >= 2) {
          crumble(g, [0, 0, 0.3, 0.55, 0.8, 1.1][i], 41, ['9', 'g', '8', '7']);
          flecks(g, 10, 14 - i, 3 + i, 5, i + 21, ['g', '8', '9']);
        }
      } },
    },
  });

  AV.data.enemies.moth = {
    name: 'Tallow Moth',
    sprite: 'enemy_moth',
    hp: 2, dmg: 1, speed: 46,
    w: 8, h: 6, hurt: { w: 14, h: 16 },
    weight: 0.5, poise: 0,
    aggro: 100, leash: 260,
    pennies: [0, 1], cinder: 3,
    flying: true, shadow: 4,
    light: { r: 16, color: '#fff3c2', intensity: 0.3, oy: -16 },
    init(e) {
      const D = e.data;
      e.z = 12; D.ph = U.rand(0, 6.3); D.orbitDir = U.pick([-1, 1]); D.jitT = 0; D.jitA = 0; D.wander = U.rand(0, 6.3);
    },
    onAggro(e) { e.sfx('moth', { vol: 0.4 }); },
    brain(e, dt) {
      const D = e.data, P = e.P;
      const warm = !!(P && P.kindled);
      const fr = warm ? 1.6 : 1;                          // frantic when Brand burns
      if (!e.aggro && warm && e.dist() < 220) { e.aggro = true; e.onAggro(); }
      D.ph += dt * 7 * fr;
      if (e.state !== 'attack' && e.state !== 'windup') e.z = U.approach(e.z || 0, 12 + Math.sin(D.ph) * 3, 30 * dt);
      D.jitT -= dt;
      if (D.jitT <= 0) { D.jitT = U.rand(0.15, 0.4) / fr; D.jitA = U.rand(-1.3, 1.3); if (Math.random() < 0.15) D.orbitDir = -D.orbitDir; }
      if (Math.random() < 0.04 * fr) AV.fx.spawn({ x: e.x + U.rand(-4, 4), y: e.y - e.z - 6, vx: U.rand(-5, 5), vy: U.rand(2, 8), life: 0.8,
        color: U.pick(['#e6cc9c', '#ebe5dc', '#cbc4c3']), alpha: 0.6 });   // wing-dust
      switch (e.state) {
        case 'idle': {
          e.anim = 'idle';
          // aimless flutter about its perch
          D.wander += D.jitA * dt * 3;
          const away = U.dist(e.x, e.y, e.home.x, e.home.y) > 24;
          e.move(away ? Math.atan2(e.home.y - e.y, e.home.x - e.x) + D.jitA * 0.5 : D.wander, 16, dt);
          if (e.aggro) e.go('chase');
          break;
        }
        case 'chase': {
          e.anim = warm ? 'walk' : 'idle';
          if (!e.aggro) { e.go('idle'); break; }
          const d = e.dist();
          // erratic orbit: tangent + radial pull + a jitter that changes every few tenths of a second
          const rad = warm ? 24 : 38;
          const a = Math.atan2(e.y - P.y, e.x - P.x);
          const radial = U.clamp((rad - d) / 16, -1, 1);
          const tx = -Math.sin(a) * D.orbitDir, ty = Math.cos(a) * D.orbitDir;
          const head = Math.atan2(ty * 0.9 + Math.sin(a) * radial, tx * 0.9 + Math.cos(a) * radial) + D.jitA * 0.6;
          e.move(head, e.speed * fr * (0.7 + 0.5 * Math.abs(Math.sin(D.ph * 0.5))), dt);
          if (e.cool <= 0 && d < (warm ? 80 : 62) && d > 14) {
            D.aim = e.angleTo();
            D.len = U.clamp(d + 18, 30, 96);
            D.wind = warm ? 0.36 : 0.46;
            e.telegraph({ shape: 'line', x: e.x, y: e.y, a: D.aim, len: D.len, width: 8, life: D.wind + 0.15, color: '#e6cc9c' });
            e.sfx('moth', { vol: 0.5, pitch: warm ? 1.3 : 1 });
            e.go('windup');
          }
          break;
        }
        case 'windup':
          // hangs in the air, wings up, quivering: then the dive along the line it showed
          e.anim = 'windup';
          e.z = U.approach(e.z || 0, 19, 30 * dt);
          e.move(U.rand(0, Math.PI * 2), 8, dt);
          if (e.st >= D.wind) {
            D.dur = D.len / (warm ? 180 : 150);
            e.hitbox({ shape: 'circle', follow: e, fx: 0, fy: -6, r: 7, life: D.dur, knock: 60 });
            e.go('attack');
          }
          break;
        case 'attack':
          e.anim = 'attack';
          e.move(D.aim, warm ? 180 : 150, dt);
          e.z = 19 - Math.sin(U.clamp(e.st / D.dur, 0, 1) * Math.PI) * 14;
          if (e.st >= D.dur) e.go('recover');
          break;
        case 'recover':
          // flutters up and off to the side: easy to swat if you are quick
          e.anim = 'idle';
          e.move(D.aim + D.orbitDir * 1.3, e.speed * fr, dt);
          if (e.st >= 0.6 / fr) { e.cool = U.rand(1.0, 2.0) / fr; e.go('chase'); }
          break;
        default: e.go('idle');
      }
    },
  };

  // =================================================================================================
  // BRIAR PENITENT — knelt to do penance in the wood and was answered. The briars came up through the robe.
  // =================================================================================================
  // Sheet 40x44, anchor (20,41). Kneeling, bowed, rooted: sackcloth turning to bark below the waist, roots across the
  // ground, bramble wound through the body and out of the back, a crown of thorns, one pale eye behind lank hair.
  // Also holds 'spike': the root-spike that erupts along the telegraphed line (drawn by BriarSpike).
  const BR_ROOTS = [[16, 38, 3, 41], [17, 40, 8, 43], [20, 40, 19, 43], [23, 40, 32, 43], [25, 38, 37, 40], [24, 36, 33, 35], [16, 36, 7, 35]];
  const BR_THORNS = [[15, 20, 11, 17], [14, 25, 10, 24], [14, 30, 10, 32], [19, 17, 18, 13], [15, 35, 11, 37]];
  const BR_VINES = [[12, 38, 28, 33], [13, 32, 27, 28], [14, 27, 27, 22], [15, 22, 24, 18]];
  function brRoots(g, lit) {
    for (const [x0, y0, x1, y1] of BR_ROOTS) {
      g.line(x0, y0, x1, y1, 'c');
      g.line(x0, y0 + 1, Math.round((x0 * 2 + x1) / 3), Math.round((y0 * 2 + y1) / 3) + 1, 'b');
      if (lit) { const t = hashf(x0, y1, lit); g.px(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), 'T'); }
    }
  }
  function tendril(g, pts) {
    let n = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const m = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let j = 0; j <= m; j++, n++) {
        const x = Math.round(x0 + (x1 - x0) * j / m), y = Math.round(y0 + (y1 - y0) * j / m);
        g.px(x, y, 'B'); if (i === 0) g.px(x, y + 1, 'A');
        if (n % 3 === 2) g.px(x, y + (n % 6 === 2 ? -1 : 1), 'S');
      }
    }
  }
  function brArm(g, sx, sy, hx, hy, bare) {
    const a = Math.atan2(hy - sy, hx - sx), len = Math.hypot(hx - sx, hy - sy);
    const [mx, my] = along(sx, sy, a, Math.max(1, len - bare));
    g.line(sx, sy, mx, my, '5'); g.line(sx - 1, sy + 1, mx - 1, my + 1, '3');
    if (bare) g.line(mx, my, hx, hy, 'N');
    g.px(hx, hy, 'O'); g.px(hx + 1, hy, 'N');
  }
  // p: { bow (-1 head back .. 3 slumped), by (breath), sway, arms 'hang'|'up'|'ground'|'cross', hands:[x,y], lash 0..3,
  //      eye, lit (roots stir), post(g) }
  function penitent(g, p) {
    const bw = p.bow || 0, by = Math.round(p.by || 0), sw = Math.round(p.sway || 0);
    const tx = sw + bw, ty = by + bw * 2;                 // how far the upper body has moved
    brRoots(g, p.lit);
    // the lower robe, grown into the earth
    g.poly([[15, 27 + by], [25, 27 + by], [28, 33], [32, 38], [31, 41], [11, 41], [13, 34]], '4');
    // hunched torso: the hump of the back is the highest point; the cowl bunched over it
    g.poly([[13 + sw, 22 + by + bw], [15 + tx, 15 + by + bw * 2], [20 + tx, 13 + by + bw * 2], [25 + tx + bw, 16 + by + bw * 3],
      [27 + sw + bw, 22 + ty], [26, 29 + by], [14, 29 + by]], '4');
    g.ellipse(19 + sw + bw * 1.5, 16 + by + bw * 2.5, 5, 2.5, '5');
    // the head hangs lower than the hump, bowed forward
    const hx = Math.round(28 + sw + bw * 2), hy = Math.round(18 + by + bw * 2.5);
    g.ellipse(hx, hy, 3, 3, 'N');
    rim(g, '2345');
    for (let y = hy - 1; y <= hy + 2; y++) for (let x = hx + 1; x <= hx + 3; x++) if (g.get(x, y) === 'N') g.px(x, y, 'O');
    // below the waist the sackcloth has gone to bark
    g.each((x, y, c) => (y >= 31 + hashf(x, 0, 3) * 4 ? { 2: 'a', 3: 'b', 4: 'c', 5: 'd' }[c] : undefined));
    for (let y = 22 + ty; y <= 30; y++) { if (g.get(18 + sw, y) === '4') g.px(18 + sw, y, '3'); if (g.get(22 + sw, y) === '4') g.px(22 + sw, y, '3'); }
    // bramble wound through the body
    for (const [x0, y0, x1, y1] of BR_VINES) {
      const ox = y0 < 30 ? tx : 0, oy = y0 < 30 ? ty : 0;
      const m = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let j = 0; j <= m; j++) {
        const x = Math.round(x0 + ox + (x1 - x0) * j / m), y = Math.round(y0 + oy + (y1 - y0) * j / m);
        const c = g.get(x, y);
        if (c == null || c === 'N') { if (j === m || j === 0) g.px(x, y, 'S'); continue; }
        g.px(x, y, 'A'); if (g.get(x, y - 1) != null && g.get(x, y - 1) !== 'N') g.px(x, y - 1, 'B');
        if (j % 5 === 2) g.px(x, y + 1, 'S');
      }
    }
    // thorns driven out through the back, blood at the wound
    for (const [x0, y0, x1, y1] of BR_THORNS) {
      const ox = y0 < 30 ? tx : 0, oy = y0 < 30 ? ty : 0;
      g.line(x0 + ox, y0 + oy, x1 + ox, y1 + oy, 'S'); g.px(x1 + ox, y1 + oy, 'T'); g.px(x0 + ox, y0 + oy, 'H');
    }
    // crown of thorns, lank hair, the one pale eye
    pts(g, [[-3, -1, 'B'], [-2, -2, 'A'], [-1, -3, 'B'], [0, -3, 'A'], [1, -3, 'B'], [2, -2, 'A'], [3, -1, 'B'],
      [-3, -2, 'S'], [-1, -4, 'T'], [1, -4, 'S'], [3, -3, 'T'], [0, -2, '2'], [-1, -2, '2']], hx, hy);
    g.line(hx + 1, hy - 1, hx + 1, hy + 3, '2'); g.line(hx + 3, hy - 1, hx + 3, hy + 2, '2'); g.px(hx - 1, hy + 1, '2');
    g.px(hx + 2, hy + 1, p.eye || 'x'); g.px(hx + 2, hy + 2, 'h');
    // arms
    const sx = 24 + tx, sy = 19 + ty;
    const arms = p.arms || 'hang';
    if (arms === 'hang') {
      brArm(g, sx - 3, sy, 28 + sw, 29 + by, 0); brArm(g, sx, sy, 29 + sw, 28 + by, 0);
      g.line(29 + sw, 30 + by, 31, 40, 'A'); g.px(31, 34, 'S'); g.px(30, 37, 'S');       // wrists bound to the earth
      g.px(28 + sw, 29 + by, 'A'); g.px(30 + sw, 29 + by, 'B');
    } else if (arms === 'cross') {
      brArm(g, sx - 4, sy, 27 + tx, 22 + ty, 0); brArm(g, sx, sy, 28 + tx, 24 + ty, 0);
    } else {
      const h = p.hands;
      brArm(g, sx - 3, sy, h[0] - 1, h[1] + 1, arms === 'up' ? 4 : 2);
      brArm(g, sx, sy, h[0], h[1], arms === 'up' ? 4 : 2);
    }
    // whips of bramble (the thorn sweep)
    const L = p.lash || 0;
    if (L === 1) {
      tendril(g, [[15, 22], [10, 16], [11, 10], [14, 8]]); tendril(g, [[25, 22], [31, 16], [31, 10], [28, 8]]);
      tendril(g, [[14, 32], [7, 29], [5, 24]]); tendril(g, [[26, 32], [33, 29], [35, 25]]);
    } else if (L === 2) {
      tendril(g, [[14, 28], [7, 30], [1, 33]]); tendril(g, [[26, 28], [33, 30], [39, 32]]);
      tendril(g, [[15, 34], [7, 38], [1, 40]]); tendril(g, [[25, 34], [33, 38], [39, 40]]);
      tendril(g, [[14, 24], [7, 23], [2, 25]]); tendril(g, [[26, 23], [33, 22], [38, 24]]);
    } else if (L === 3) {
      tendril(g, [[14, 28], [9, 30], [6, 33]]); tendril(g, [[26, 28], [31, 30], [34, 33]]);
      tendril(g, [[15, 34], [10, 37]]); tendril(g, [[25, 34], [30, 37]]);
    }
    g.outline('0');
    if (p.post) p.post(g);
  }
  // A thorned root-stake h px tall bursting from a mound of earth (base at 20,41)
  function brSpike(g, h, tilt, dirt) {
    const bx = 20, by = 41;
    for (let j = 0; j < h; j++) {
      const w = Math.max(0, Math.round((1 - j / h) * 2.2));
      const x = Math.round(bx + tilt * j / h);
      for (let dx = -w; dx <= w; dx++) g.px(x + dx, by - j, dx < 0 ? 'b' : dx > 0 ? 'd' : 'c');
      if (j > 1 && j % 3 === 0) g.px(x + (j % 6 === 0 ? w + 1 : -w - 1), by - j, 'S');
    }
    if (h > 0) g.px(Math.round(bx + tilt), by - h, 'T');
    put(g, bx - 4, by, 'abccccbba'); put(g, bx - 3, by - 1, h ? 'b...cb' : 'bc0cb');
    g.outline('0');
    if (dirt) pts(g, [[bx - 6, by - 3, 'c'], [bx + 5, by - 5, 'b'], [bx - 4, by - 7, 'b'], [bx + 7, by - 2, 'c'], [bx + 2, by - 9, 'c']]);
  }
  art.sheet('enemy_briar', {
    w: 40, h: 44, ox: 20, oy: 41,
    anims: {
      idle: { fps: 3, count: 4, draw(g, i) { penitent(g, { by: [0, 0, 1, 1][i], sway: [0, 0, 0, 1][i] }); } },
      walk: { fps: 3, count: 4, draw(g, i) { penitent(g, { by: [0, 0, 1, 1][i], sway: [0, 0, 0, 1][i] }); } },
      windup: { fps: 6, loop: false, count: 3, draw(g, i) {
        // the telegraph: it lifts its clasped hands to heaven; the roots stir
        penitent(g, { bow: [0, -0.5, -1][i], arms: 'up', hands: [[27, 20], [26, 10], [24, 5]][i], eye: i ? 'y' : 'x', lit: 7 + i });
      } },
      attack: { fps: 10, loop: false, count: 2, draw(g, i) {
        // and drives them into the earth
        penitent(g, { bow: [1.5, 2][i], arms: 'ground', hands: [[31, 36], [33, 40]][i], eye: 'y', lit: 3,
          post: i ? (gg) => pts(gg, [[30, 37, 'c'], [36, 38, 'b'], [31, 35, 'b'], [37, 36, 'c'], [34, 34, 'c']]) : null });
      } },
      coil: { fps: 8, count: 2, draw(g, i) { penitent(g, { arms: 'cross', lash: 1, bow: -0.5, sway: i ? 1 : 0, eye: 'y' }); } },
      sweep: { fps: 12, loop: false, count: 3, draw(g, i) { penitent(g, { arms: 'cross', lash: [2, 2, 3][i], eye: 'y', sway: [0, 1, 0][i] }); } },
      hurt: { fps: 8, loop: false, count: 2, draw(g, i) { penitent(g, { bow: -1 + i, sway: -1, eye: 'y' }); } },
      die: { fps: 7, loop: false, count: 7, draw(g, i) {
        // the briars pull tight, it slumps, and the penitent part of it is ash. The roots stay.
        if (i === 0) { penitent(g, { bow: -1, sway: -1, eye: 'y' }); return; }
        penitent(g, { bow: 2.5, by: 1, eye: i < 3 ? 'w' : '5' });
        if (i >= 3) {
          crumble(g, [0, 0, 0, 0.3, 0.58, 0.84, 1.1][i], 53, ['7', '6', 'S', '5']);
          brRoots(g, 0);
          ashHeap(g, 20, 41, [0, 0, 0, 12, 15, 17, 17][i], [0, 0, 0, 3, 4, 4, 3][i], 17, 0);
          flecks(g, 20, 28 - i, 3 + i, 7, i + 31, ['7', '6', 'S']);
          outlineIn(g, 0, 33, 39, 43);
        }
      } },
      spike: { fps: 10, loop: false, count: 7, draw(g, i) {
        const f = [[0, 0, 0], [6, 0.5, 1], [14, 1, 1], [14, 1, 0], [12, 1.3, 0], [7, 1, 0], [2, 0.5, 0]][i];
        brSpike(g, f[0], f[1], f[2]);
      } },
    },
  });

  // The erupting root-spike: a short-lived world entity; it strikes once, a tenth of a second after it breaks ground.
  class BriarSpike extends AV.Entity {
    constructor(world, x, y, owner, set) {
      super(null, world);
      this.x = x; this.y = y; this.owner = owner; this.set = set;
      this.sprite = 'enemy_briar'; this.anim = 'spike'; this.animT = 0; this.t = 0; this.struck = false;
      this.flip = Math.random() < 0.5;
    }
    update(dt) {
      this.t += dt; this.animT = this.t;
      if (!this.struck && this.t >= 0.1) {
        this.struck = true;
        if (this.owner && !this.owner.dead) {
          AV.combat.add({ shape: 'ring', x: this.x, y: this.y, r: 7, r0: 0, dmg: this.owner.dmg, knock: 130, team: 'enemy',
            owner: this.owner, life: 0.15, hitSet: this.set });
        }
        AV.fx.burst(this.x, this.y - 2, 5, { color: ['#3a261a', '#5a3a24', '#7d5634'], speed: 40, up: 30, g: 120, life: 0.5 });
      }
      if (this.t >= 0.7) this.gone = true;
    }
    draw(ctx, cam) { AV.art.draw(ctx, this.sprite, 'spike', this.t, this.x - cam.x, this.y - cam.y, { flip: this.flip }); }
  }

  const BRIAR_WORDS = ['…not yet…', '…deeper…', '…I asked for this…', '…it holds…', '…let it hold…'];
  AV.data.enemies.briar = {
    name: 'Briar Penitent',
    sprite: 'enemy_briar',
    hp: 12, dmg: 2, speed: 0,
    w: 14, h: 8, hurt: { w: 16, h: 28 },
    weight: 99, poise: 2,
    aggro: 118, leash: 9999,
    pennies: [2, 5], cinder: 10,
    shadow: 10,
    init(e) { e.data.mutterT = U.rand(2, 6); e.data.sweepCool = 0; e.data.rest = 0.6; },
    brain(e, dt) {
      const D = e.data;
      if (D.x0 == null) { D.x0 = e.x; D.y0 = e.y; }
      e.x = D.x0; e.y = D.y0; e.vx = e.vy = 0;             // rooted: nothing moves it
      if (D.sweepCool > 0) D.sweepCool -= dt;
      switch (e.state) {
        case 'idle':
          e.anim = 'idle';
          if (e.aggro) { e.go('watch'); break; }
          D.mutterT -= dt;
          if (D.mutterT <= 0 && e.dist() < 90) {
            D.mutterT = U.rand(8, 14);
            AV.fx.text(e.x, e.y - 40, U.pick(BRIAR_WORDS), { color: '#6f7a4e', life: 2.6, rise: 6 });
          }
          break;
        case 'watch': {
          e.anim = 'idle';
          if (!e.aggro) { e.go('idle'); break; }
          e.faceTarget();
          const d = e.dist();
          D.rest = 0.6;
          if (d < 30 && D.sweepCool <= 0) {
            // too close: a short sweep of thorns all round it
            D.move = 'sweep';
            e.telegraph({ shape: 'circle', x: e.x, y: e.y, r: 30, life: 0.45, color: '#97a070' });
            e.sfx('whisper', { vol: 0.5, pitch: 0.8 });
            e.go('windup');
          } else if (e.cool <= 0 && d < 125 && e.canSee()) {
            // a line toward you; the roots come up along it, near to far
            D.move = 'spikes';
            D.aim = e.angleTo();
            D.len = U.clamp(d + 26, 40, 132);
            e.telegraph({ shape: 'line', x: e.x, y: e.y, a: D.aim, len: D.len, width: 14, life: 0.95, color: '#e2621f' });
            e.sfx('whisper', { vol: 0.6, pitch: 0.6 });
            e.go('windup');
          }
          break;
        }
        case 'windup':
          if (D.move === 'sweep') {
            e.anim = 'coil';
            if (e.st >= 0.45) {
              e.hitbox({ shape: 'ring', x: e.x, y: e.y, r: 30, r0: 0, life: 0.14, knock: 170 });
              e.sfx('swing', { pitch: 0.5, vol: 0.7 });
              AV.fx.burst(e.x, e.y - 10, 10, { color: ['#343f28', '#4d5a38', '#c2beb0'], speed: 90, life: 0.35 });
              e.go('attack');
            }
          } else {
            e.anim = 'windup';
            if (Math.random() < 0.5) {
              const r = U.rand(12, D.len);
              AV.fx.spawn({ x: e.x + Math.cos(D.aim) * r, y: e.y + Math.sin(D.aim) * r, vx: U.rand(-6, 6), vy: U.rand(-18, -8), life: 0.4,
                color: U.pick(['#3a261a', '#5a3a24', '#7d5634']) });
            }
            if (e.st >= 0.7) {
              D.k = 0; D.set = new Set(); D.n = Math.floor((D.len - 12) / 11) + 1;
              AV.fx.shake(1.5, 0.15);
              e.sfx('slam', { vol: 0.5, pitch: 0.7 });
              e.go('attack');
            }
          }
          break;
        case 'attack':
          if (D.move === 'sweep') {
            e.anim = 'sweep';
            if (e.st >= 0.35) { D.sweepCool = 1.6; D.rest = 0.5; e.go('recover'); }
          } else {
            e.anim = 'attack';
            while (D.k < D.n && e.st >= D.k * 0.045) {
              const r = 16 + D.k * 11, x = e.x + Math.cos(D.aim) * r, y = e.y + Math.sin(D.aim) * r;
              const id = e.world.tileAtPx(x, y);
              if (id == null || AV.tiles.isSolid(id)) { D.n = D.k; break; }      // walls stop the roots
              e.world.add(new BriarSpike(e.world, x, y, e, D.set));
              if (D.k === 0) e.sfx('break_wall', { vol: 0.3, pitch: 1.4 });
              D.k++;
            }
            if (D.k >= D.n && e.st >= D.n * 0.045 + 0.25) { D.rest = 1.0; e.go('recover'); }
          }
          break;
        case 'recover':
          // hands still in the earth, thorns drawn back: the punish window
          e.anim = D.move === 'spikes' && e.st < 0.6 ? 'attack' : 'idle';
          if (e.st >= D.rest) { e.cool = U.rand(1.3, 2.3); e.go('watch'); }
          break;
        default: e.go('idle');
      }
    },
  };
})(window.AV);
