// ASHEN VOW - UI sprites: panels, cursor, dividers, candles, cinder orb, key-cap, boss-bar ornaments, title flourish,
// the Open Hand emblem and small arrows. Dull old-gold and bone on near-black; fire is the only saturated colour.
(function (AV) {
  'use strict';
  const art = AV.art;

  // ------------------------------------------------------------------ shared helpers
  // A small diamond rivet (radius 2) with a black halo: used on panel corners and ornaments.
  function stud(g, cx, cy, core) {
    for (const [dx, dy] of [[0, -2], [-1, -1], [1, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2]]) g.px(cx + dx, cy + dy, '0');
    g.px(cx, cy - 1, 'M');
    g.px(cx - 1, cy, 'L');
    g.px(cx + 1, cy, 'K');
    g.px(cx, cy + 1, 'J');
    g.px(cx, cy, core || '8');
  }
  // Mirror columns [0, c) onto (c, 2c] around column c (odd-width symmetric ornaments inside even frames).
  function mirrorAbout(g, c) {
    for (let y = 0; y < g.h; y++) for (let x = 0; x < c; x++) {
      const v = g.get(x, y);
      if (v != null) g.px(2 * c - x, y, v);
    }
  }

  // ------------------------------------------------------------------ ui_panel (9-slice source, 8 px corners)
  // Edges are uniform along their length and the centre is flat, so the engine may stretch or tile them.
  art.sheet('ui_panel', {
    w: 24, h: 24, ox: 0, oy: 0,
    anims: {
      idle: {
        fps: 1, count: 1, draw(g) {
          g.rect(0, 0, 24, 24, '1');
          g.box(0, 0, 24, 24, '0');
          // outer line: old gold, lit from above
          g.line(1, 1, 22, 1, 'L'); g.line(1, 1, 1, 22, 'L');
          g.line(2, 22, 22, 22, 'K'); g.line(22, 2, 22, 22, 'K');
          g.box(2, 2, 20, 20, '0');
          // inner line: dull bone
          g.line(3, 3, 20, 3, '6'); g.line(3, 3, 3, 20, '6');
          g.line(4, 20, 20, 20, '4'); g.line(20, 4, 20, 20, '4');
          // inner shadow ring, then the body
          g.box(4, 4, 16, 16, '0');
          // square corner rivets over the crossing of both lines, each with a black collar
          const rivet = (x, y) => {
            g.rect(x - 1, y - 1, 5, 5, '0');
            g.stamp(x, y, ['MML', 'M9K', 'LKJ']);
          };
          rivet(1, 1); rivet(20, 1); rivet(1, 20); rivet(20, 20);
          // small gilt brackets in the inner corners
          g.stamp(5, 5, ['KJ', 'J.']);
          g.stamp(17, 5, ['JK', '.J']);
          g.stamp(5, 17, ['J.', 'KJ']);
          g.stamp(17, 17, ['.J', 'JK']);
          // keep the silhouette square
          g.px(0, 0, '0'); g.px(23, 0, '0'); g.px(0, 23, '0'); g.px(23, 23, '0');
        },
      },
    },
  });

  // ------------------------------------------------------------------ ui_panel_inner (highlighted row / inset)
  art.sheet('ui_panel_inner', {
    w: 24, h: 24, ox: 0, oy: 0,
    anims: {
      idle: {
        fps: 1, count: 1, draw(g) {
          g.rect(0, 0, 24, 24, '3');
          // brass hairline frame with clipped corners
          g.line(1, 0, 22, 0, 'J'); g.line(1, 23, 22, 23, 'K');
          g.line(0, 1, 0, 22, 'J'); g.line(23, 1, 23, 22, 'K');
          // sunken: shadow under the top/left edge, light along the bottom/right
          g.line(1, 1, 22, 1, '1'); g.line(1, 1, 1, 22, '1');
          g.line(1, 2, 22, 2, '2'); g.line(2, 2, 2, 21, '2');
          g.line(2, 22, 22, 22, '4'); g.line(22, 2, 22, 22, '4');
          // warm corner ticks
          g.px(1, 1, 'K'); g.px(22, 1, 'K'); g.px(1, 22, 'K'); g.px(22, 22, 'L');
        },
      },
    },
  });

  // ------------------------------------------------------------------ ui_cursor (7x9 flame, flickers)
  const CURSOR = [
    ['...l...',
      '...m...',
      '..mnm..',
      '..non..',
      '.mnpnm.',
      '.nopon.',
      'mnpqpnm',
      'lnpqpnl',
      '.lmnml.'],
    ['..l....',
      '..m....',
      '..nm...',
      '.mon...',
      '.nopm..',
      '.nopon.',
      'mopqpnm',
      'lnpqpnl',
      '.lmnml.'],
    ['....l..',
      '....m..',
      '...mn..',
      '...nom.',
      '..mpon.',
      '.nopon.',
      'mnpqpom',
      'lnpqpnl',
      '.lmnml.'],
  ];
  art.sheet('ui_cursor', { w: 7, h: 9, ox: 3, oy: 8, anims: { idle: { fps: 8, frames: [CURSOR[0], CURSOR[1], CURSOR[0], CURSOR[2]] } } });

  // ------------------------------------------------------------------ ui_divider (64x5 rule, flame in a cupped hand)
  art.sheet('ui_divider', {
    w: 64, h: 5, ox: 32, oy: 2,
    anims: {
      idle: {
        fps: 1, count: 1, draw(g) {
          // left half (cols 0..30); mirrored about col 31
          for (let x = 1; x <= 6; x += 2) g.px(x, 2, 'J');
          g.line(8, 2, 11, 2, 'J');
          g.line(12, 2, 20, 2, 'K');
          g.line(21, 2, 26, 2, 'L');
          // bead
          g.px(16, 1, 'K'); g.px(15, 2, 'L'); g.px(16, 2, 'M'); g.px(17, 2, 'L'); g.px(16, 3, 'J');
          // the rule dips into a cup
          g.px(27, 3, 'L'); g.px(28, 4, 'K'); g.px(29, 4, 'L'); g.px(30, 4, 'L');
          mirrorAbout(g, 31);
          g.px(31, 4, 'M');
          // flame held in the cup
          g.px(31, 0, 'n');
          g.px(30, 1, 'm'); g.px(31, 1, 'p'); g.px(32, 1, 'n');
          g.px(30, 2, 'n'); g.px(31, 2, 'q'); g.px(32, 2, 'o');
          g.px(30, 3, 'l'); g.px(31, 3, 'o'); g.px(32, 3, 'm');
        },
      },
    },
  });

  // ------------------------------------------------------------------ ui_candle (7x12 tallow candle: lit / unlit)
  // Tallow candle on an iron dish; the whole sprite gets a dark outline so it reads over pale ground.
  const CANDLE_BODY = [
    '.......',
    '.......',
    '.......',
    '.......',
    '.......',
    '..g99..',
    '.fg9ge.',
    '.fgge..',
    '..fgef.',
    '..fge..',
    '5667765',
    '.44432.',
  ];
  const FLAMES = [
    ['...n...', '..non..', '..opo..', '..pqp..', '...p...'],
    ['..n....', '..on...', '..opn..', '..pqp..', '...p...'],
    ['....n..', '...on..', '..npo..', '..pqp..', '...p...'],
  ];
  function candleLit(i) {
    return (g) => {
      g.stamp(0, 0, CANDLE_BODY);
      g.stamp(0, 0, FLAMES[i]);
      g.outline('0');
    };
  }
  art.sheet('ui_candle', {
    w: 7, h: 12, ox: 3, oy: 11,
    anims: {
      idle: { fps: 7, frames: [candleLit(0), candleLit(1), candleLit(0), candleLit(2)] },
      lit: { fps: 7, frames: [candleLit(0), candleLit(1), candleLit(0), candleLit(2)] },
      unlit: {
        fps: 1, count: 1, draw(g) {
          g.stamp(0, 0, CANDLE_BODY);
          // spent: cold grey tallow, a bent black wick
          g.replace('9', '7'); g.replace('g', '6'); g.replace('f', '5'); g.replace('e', '4');
          g.outline('0');
          g.px(3, 4, '4'); g.px(4, 3, '3');
        },
      },
    },
  });

  // ------------------------------------------------------------------ ui_cinder (15x15 curse-gauge orb)
  // 'full' uses the same rim as 'empty' so the engine can reveal it bottom-up over the empty orb.
  function cinderRim(g) {
    g.circle(7, 7, 7, '0');
    g.circle(7, 7, 6, '4');
    // rim light from above, shade below
    g.each((x, y, c) => {
      if (c !== '4') return undefined;
      const d = Math.hypot(x - 7, y - 7);
      if (d < 5.5) return undefined;
      if (y <= 4 && x <= 9) return '6';
      if (y <= 5) return '5';
      if (y >= 10) return '3';
      return undefined;
    });
    // four little brass clasps on the rim
    g.px(7, 1, 'L'); g.px(1, 7, 'K'); g.px(13, 7, 'K'); g.px(7, 13, 'J');
  }
  function cinderGlass(g) { g.circle(7, 7, 5, '2'); g.circle(7, 7, 4, '1'); g.circle(7, 8, 2, '0'); }
  art.sheet('ui_cinder', {
    w: 15, h: 15, ox: 7, oy: 7,
    anims: {
      idle: { fps: 1, frames: [(g) => cinderEmpty(g)] },
      empty: { fps: 1, frames: [(g) => cinderEmpty(g)] },
      full: { fps: 6, frames: [(g) => cinderFull(g, 0), (g) => cinderFull(g, 1), (g) => cinderFull(g, 2)] },
    },
  });
  function cinderEmpty(g) {
    cinderRim(g);
    cinderGlass(g);
    // settled ash in the bottom of the glass
    g.px(4, 10, '2'); g.px(5, 11, '3'); g.px(6, 11, '2'); g.px(7, 12, '2'); g.px(8, 11, '3'); g.px(9, 11, '2');
    g.px(10, 10, '2'); g.px(6, 12, '3'); g.px(8, 12, '2'); g.px(7, 11, '3');
    // cold glint
    g.px(4, 4, '5'); g.px(5, 3, '4'); g.px(4, 5, '3');
  }
  function cinderFull(g, f) {
    cinderRim(g);
    const ramp = ['l', 'm', 'n', 'o', 'p', 'q'];
    const R = g.rnd(11 + f * 7);
    for (let y = 2; y <= 12; y++) for (let x = 2; x <= 12; x++) {
      const d = Math.hypot(x - 7, y - 7);
      if (d > 5.5) continue;
      const hot = Math.hypot(x - 7, y - 8.2);
      const a = Math.atan2(y - 7, x - 7) + f * 2.1;
      const swirl = Math.sin(a * 3 + d * 1.3) * 0.6;
      let v = 5.2 - hot * 0.95 + swirl + (R() - 0.5) * 0.5;
      if (d > 4.6) v = Math.min(v, 1.2);
      g.px(x, y, ramp[Math.max(0, Math.min(5, Math.round(v)))]);
    }
    // bright glint on the glass
    g.px(4, 4, 'q'); g.px(5, 3, 'p'); g.px(4, 5, 'p');
  }

  // ------------------------------------------------------------------ ui_key (11x11 blank key-cap)
  // Face for a small-font glyph: x 1..9, y 1..7 (draw caps at key.y + 1, centred).
  art.sheet('ui_key', {
    w: 11, h: 11, ox: 0, oy: 0,
    anims: {
      idle: {
        fps: 1, count: 1, draw(g) {
          g.rect(1, 0, 9, 11, '0'); g.rect(0, 1, 11, 9, '0');
          g.rect(1, 1, 9, 7, '3');
          g.line(2, 1, 8, 1, '5');
          g.line(1, 2, 1, 7, '4');
          g.line(9, 2, 9, 7, '2');
          g.px(1, 1, '4'); g.px(9, 1, '4');
          g.line(1, 8, 9, 8, '1');
          g.line(2, 9, 8, 9, '2');
          g.px(1, 9, '1'); g.px(9, 9, '1');
        },
      },
    },
  });

  // ------------------------------------------------------------------ boss bar ornaments (16x10)
  // The left piece clasps the left end of the bar (its right edge meets the bar); the right piece is its mirror.
  // The bar itself is expected to sit on rows 3..6 of the ornament.
  function bossLeft(g) {
    // spear-point finial
    g.px(0, 4, 'K'); g.px(0, 5, 'J');
    g.line(1, 4, 5, 4, 'L'); g.line(1, 5, 5, 5, 'K');
    // diamond knot
    g.px(7, 1, 'L'); g.line(6, 2, 8, 2, 'L'); g.px(7, 2, 'M');
    g.line(5, 3, 9, 3, 'L'); g.px(7, 3, 'M');
    g.line(5, 4, 9, 4, 'L'); g.px(7, 4, '8');
    g.line(5, 5, 9, 5, 'K'); g.px(7, 5, 'L');
    g.line(5, 6, 9, 6, 'K');
    g.line(6, 7, 8, 7, 'J'); g.px(7, 8, 'J');
    // shaft into the clasp
    g.line(10, 4, 11, 4, 'L'); g.line(10, 5, 11, 5, 'K');
    // scroll curls above and below the shaft
    g.px(11, 2, 'K'); g.px(10, 1, 'J'); g.px(11, 3, 'K');
    g.px(11, 6, 'J'); g.px(11, 7, 'J'); g.px(10, 8, 'J');
    // clasp
    g.rect(12, 0, 3, 10, 'K');
    g.line(12, 0, 12, 9, 'L');
    g.line(13, 0, 14, 0, 'M');
    g.px(14, 9, 'J'); g.px(13, 9, 'J');
    g.px(13, 3, '0'); g.px(13, 6, '0');
    g.outline('0');
  }
  art.sheet('ui_boss_left', { w: 16, h: 10, ox: 15, oy: 5, anims: { idle: { fps: 1, count: 1, draw: bossLeft } } });
  art.sheet('ui_boss_right', {
    w: 16, h: 10, ox: 0, oy: 5,
    anims: { idle: { fps: 1, count: 1, draw(g) { bossLeft(g); g.flipX(); } } },
  });

  // ------------------------------------------------------------------ ui_title_flourish (120x14)
  art.sheet('ui_title_flourish', {
    w: 120, h: 14, ox: 60, oy: 0,
    anims: {
      idle: {
        fps: 1, count: 1, draw(g) {
          const C = 59; // centre column
          const Y = 8;  // the main rule
          // main rule, brightening toward the centre and dissolving into dots at the ends
          for (let x = 1; x <= 9; x += 2) g.px(x, Y, 'J');
          g.line(11, Y, 24, Y, 'J');
          g.line(25, Y, 40, Y, 'K');
          g.line(41, Y, 50, Y, 'L');
          // beads threaded on the rule
          const bead = (x) => { g.px(x, Y - 1, 'L'); g.px(x - 1, Y, 'L'); g.px(x, Y, 'M'); g.px(x + 1, Y, 'K'); g.px(x, Y + 1, 'J'); };
          bead(17);
          bead(36);
          // S-scroll: a volute rising from the rule, and a darker one hanging beneath it further out
          const VOLUTE = ['..LL.', '.L..L', 'L.M.L', 'L..K.', '.L...'];
          const UNDER = ['.K...', 'K..J.', 'K.L.J', '.K..J', '..JJ.'];
          g.stamp(42, Y - 5, VOLUTE);
          g.stampFlip(27, Y + 1, UNDER);
          // a short hairline under the rule between them
          g.line(31, Y + 2, 40, Y + 2, 'J');
          // the rule dips into a cup beneath the flame
          g.px(51, Y + 1, 'L'); g.px(52, Y + 2, 'L'); g.px(53, Y + 3, 'K');
          g.line(54, Y + 4, 58, Y + 4, 'L');
          g.px(52, Y, 'K'); g.px(52, Y - 1, 'J');
          mirrorAbout(g, C);
          g.px(C, Y + 4, 'M');
          g.px(C, Y + 5, 'K');
          // flame (odd width, centred on C)
          const FL = [
            '....n....',
            '....o....',
            '...nom...',
            '...opn...',
            '..mopom..',
            '..npqpn..',
            '..opqpo..',
            '..mpqpm..',
            '...nqn...',
            '...lol...',
            '....l....',
          ];
          g.stamp(C - 4, 0, FL);
        },
      },
    },
  });

  // ------------------------------------------------------------------ ui_hand (16x16 Open Hand sigil)
  art.sheet('ui_hand', {
    w: 16, h: 16, ox: 8, oy: 8,
    anims: {
      idle: {
        fps: 6, frames: [0, 1, 2, 1].map((f) => (g) => drawHand(g, f)),
      },
    },
  });
  // A cupped hand, palm up, seen from the side: the wrist comes in from the lower left, the thumb stands up,
  // the fingers curl up on the right (a crease marks them), and the flame hovers over the hollow of the palm.
  const HAND = [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.............8..',
    '..8.........898.',
    '..98........8968',
    '..98.......89687',
    '..998......89676',
    '...998....896766',
    '..99988888996766',
    '.99888888888766.',
    '9988887777666...',
    '9887766.........',
  ];
  const HAND_FLAMES = [
    ['........n.......',
      '........o.......',
      '.......nom......',
      '.......opn......',
      '......mopom.....',
      '......npqpn.....',
      '......opqpo.....',
      '......mpqpm.....',
      '.......nqn......',
      '.......lol......'],
    ['.........n......',
      '........no......',
      '.......nom......',
      '.......opn......',
      '......mopon.....',
      '......npqpn.....',
      '......opqpo.....',
      '......mpqpm.....',
      '.......nqn......',
      '.......lol......'],
    ['.......n........',
      '.......on.......',
      '.......mon......',
      '.......npo......',
      '......nopom.....',
      '......npqpn.....',
      '......opqpo.....',
      '......mpqpm.....',
      '.......nqn......',
      '.......lol......'],
  ];
  function drawHand(g, f) {
    g.stamp(0, 0, HAND);
    g.stamp(0, 0, HAND_FLAMES[f]);
    g.outline('0');
  }

  // ------------------------------------------------------------------ ui_arrow (5x7)
  const ARROW_R = ['M0...', 'MM0..', 'LMM0.', 'LLLM0', 'KLL0.', 'KK0..', 'K0...'];
  const ARROW_R_DIM = ['L0...', 'LL0..', 'KLL0.', 'KKKL0', 'JKK0.', 'JJ0..', 'J0...'];
  const ARROW_DOWN = ['.....', '.....', 'MMMLK', '.LLK.', '..K..', '.....', '.....'];
  const ARROW_UP = ['.....', '.....', '..M..', '.MLK.', 'LLKKJ', '.....', '.....'];
  const flipRows = (rows) => rows.map((r) => r.split('').reverse().join(''));
  art.sheet('ui_arrow', {
    w: 5, h: 7, ox: 2, oy: 3,
    anims: {
      idle: { fps: 2, frames: [ARROW_R, ARROW_R_DIM] },
      right: { fps: 1, frames: [ARROW_R] },
      left: { fps: 1, frames: [flipRows(ARROW_R)] },
      down: { fps: 1, frames: [ARROW_DOWN] },
      up: { fps: 1, frames: [ARROW_UP] },
    },
  });
})(typeof window !== 'undefined' ? window.AV : globalThis.AV);
