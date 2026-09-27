// ASHEN VOW — world tiles (ART-WORLD). Every tile id of API.md §4, drawn for every theme:
// village, hushwood, abbey, greyharrow, city, wickward, cave, interior, pyre.
// Ground textures are sampled in *world* pixels, so large areas never show the 16-px grid.
(function (AV) {
  'use strict';
  const U = AV.util;
  const S = 16;
  const PI = Math.PI;

  // ================================================================ colour helpers
  const RGB = {};
  function rgb(c) {
    let v = RGB[c];
    if (!v) v = RGB[c] = U.hexToRgb((c.charAt(0) === '#' ? c : AV.PALETTE[c]) || '#000000');
    return v;
  }
  function hx(n) { n = n < 0 ? 0 : n > 255 ? 255 : Math.round(n); return (n < 16 ? '0' : '') + n.toString(16); }
  const MIX = {};
  function mix(a, b, t) {
    t = Math.round(t * 32) / 32;
    if (t <= 0) return a;
    if (t >= 1) return b;
    const k = a + b + t;
    let v = MIX[k];
    if (v === undefined) {
      const A = rgb(a), B = rgb(b);
      v = MIX[k] = '#' + hx(A[0] + (B[0] - A[0]) * t) + hx(A[1] + (B[1] - A[1]) * t) + hx(A[2] + (B[2] - A[2]) * t);
    }
    return v;
  }
  const dim = (a, f) => mix(a, '#000000', 1 - f);
  // darken / tint whatever is already painted (the floor underlay) — soft shadows and glows
  function shadow(g, x, y, f) { const o = g.get(x, y); if (o) g.px(x, y, dim(o, f)); }
  function tint(g, x, y, col, t) { const o = g.get(x, y); if (o) g.px(x, y, mix(o, col, t)); }

  // ================================================================ noise
  const hf = (x, y, s) => U.hash2(x | 0, y | 0, s) / 4294967296;
  function vn(x, y, sc, s) {
    const fx = x / sc, fy = y / sc, x0 = Math.floor(fx), y0 = Math.floor(fy);
    let tx = fx - x0, ty = fy - y0;
    tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
    const a = hf(x0, y0, s), b = hf(x0 + 1, y0, s), c = hf(x0, y0 + 1, s), d = hf(x0 + 1, y0 + 1, s);
    const top = a + (b - a) * tx, bot = c + (d - c) * tx;
    return top + (bot - top) * ty;
  }
  const at = (R, i) => R[i < 0 ? 0 : i >= R.length ? R.length - 1 : i];
  const ri = (c, a, b) => a + Math.floor(c.rnd() * (b - a + 1));

  // ================================================================ theme palettes (one table)
  // ramps run dark → light. face = [mortar, dark, base, light, lip]; top = wall-top ramp.
  const TH = {};
  TH.village = {
    floor: 'dirt',
    ground: ['#2b2527', '#363032', '#413a3b', '#4d4546', '#5b5253'],
    speck: ['#5f5859', '#6b6465'],
    pebble: ['#6e6667', '#544c4d', '#2a2426'],
    grass: ['#2c2c26', '#383830', '#44443a', '#525045', '#605e50'],
    blade: ['#31312a', '#58563f', '#747056'],
    bladeDensity: 0.26,
    path: ['#40383a', '#4b4344', '#564d4d', '#625858', '#6e6463'],
    mud: ['#211a18', '#2c2320', '#372c28', '#433632', '#6a6563'],
    ash: ['#57515a', '#67616a', '#78727a', '#8a848b', '#9d979d'],
    flag: ['#2d2a2e', '#3a353b', '#454047', '#524c54', '#615a63'],
    cobble: ['#262124', '#393335', '#484143', '#574f51', '#686062'], gap: '#211c1f', gapAlt: '#5d5757',
    plank: ['#231b17', '#30251f', '#3d2f27', '#4a3a30', '#58463a'],
    burnt: ['#141011', '#1d1717', '#282020', '#352b2a', '#4d4543'],
    leaf: ['#5a4a3c', '#6e5c4a', '#826e5a', '#968270'],
    lichen: ['#4d5044', '#5d6052'],
    twig: '#3d3029',
    stone: { face: ['#221e23', '#3a353b', '#49434a', '#59525a', '#6f686e'], top: ['#17141a', '#1e1a20', '#262127'], style: 'block' },
    brick: { face: ['#2b2427', '#4a332e', '#593e37', '#6a4b42', '#7a5a4e'], alt: '#4e4648', top: ['#181416', '#1f191c', '#271f23'] },
    wood: { face: ['#1d1613', '#2e231d', '#3d2f26', '#4e3b30', '#5f4a3c'], top: ['#151010', '#1c1614', '#241c19'] },
    fence: ['#1c1614', '#2f2622', '#40352f', '#524640', '#665a52'],
    roof: ['#141519', '#1d2027', '#272b34', '#323742', '#414755'], roofSpeck: '#5f6066',
    cliff: ['#272021', '#342b2b', '#423737', '#514545', '#615453'],
    rock: ['#221e22', '#3a343a', '#4f484f', '#655e65', '#7d767c'],
    hs: ['#1a171b', '#433e45', '#57515a', '#6c666d', '#858087'],
    water: ['#0e151b', '#131c24', '#19252f', '#22323d', '#2e434f'], wlite: ['#57727a', '#8ba4a5'],
    bark: ['#0c0a0d', '#161216', '#201b20', '#2d262c', '#3f363d'],
    canopy: ['#2a2622', '#37312b', '#453d35', '#554b41', '#675b4f'],
    moss: null,
  };
  TH.hushwood = Object.assign({}, TH.village, {
    floor: 'moss',
    ground: ['#222721', '#2b322a', '#353d33', '#40493d', '#4d5749'],
    speck: ['#6a7163', '#8b907e'],
    pebble: ['#6b6e67', '#51544e', '#222721'],
    grass: ['#262e25', '#303a2f', '#3c473a', '#4a5747', '#5b6857'],
    blade: ['#2d372c', '#56644f', '#74806a'],
    bladeDensity: 0.07,
    path: ['#312a25', '#3c332d', '#473d35', '#53473e', '#605248'],
    mud: ['#1b1714', '#241e1a', '#2e2621', '#3a302a', '#5a5d58'],
    leaf: ['#8e8b7b', '#a8a492', '#c2beb0', '#dcd8ca'],
    lichen: ['#58644d', '#6b7860'],
    stone: { face: ['#1d201d', '#393e38', '#4a4f48', '#5c6259', '#747a6f'], top: ['#151815', '#1b1f1b', '#222722'], style: 'block' },
    fence: ['#1b1917', '#2d2a26', '#3e3a35', '#514c45', '#666057'],
    moss: ['#34422c', '#46553a', '#5a6a48'],
    roof: ['#141814', '#1c211c', '#262c25', '#313830', '#3f473d'], roofSpeck: '#56644c',
    cliff: ['#241c18', '#31261f', '#403228', '#4f3f33', '#604e40'],
    rock: ['#1d201d', '#323630', '#444941', '#585e54', '#71776b'],
    hs: ['#191c19', '#414640', '#565c54', '#6c7269', '#878c81'],
    water: ['#0d1513', '#121e1a', '#182822', '#21352d', '#2c453a'], wlite: ['#5d786a', '#91a898'],
    bark: ['#2c292b', '#7e7b72', '#a3a095', '#c2beb0', '#dcd8ca'],
    canopy: ['#353c35', '#454d44', '#586056', '#6d7569', '#868d7f'],
  });
  TH.abbey = Object.assign({}, TH.village, {
    floor: 'wetstone',
    ground: ['#1a2125', '#212b30', '#29353b', '#324047', '#3e4f56'],
    speck: ['#5f7f86', '#82a8ad'],
    pebble: ['#5a6b70', '#44545a', '#1a2125'],
    grass: ['#1e2922', '#26322a', '#2f3c33', '#394a3d', '#455848'],
    blade: ['#233026', '#4a5c4a', '#63765f'],
    bladeDensity: 0.12,
    path: ['#262c2e', '#303739', '#3a4244', '#454e50', '#525c5e'],
    mud: ['#161a19', '#1d2321', '#252c2a', '#2f3835', '#5a7278'],
    flag: ['#1c2327', '#242d32', '#2c373d', '#364349', '#435258'],
    cobble: ['#1b2226', '#29333a', '#334049', '#3f4e57', '#4d5e68'], gap: '#1c2a22', gapAlt: '#2e3d2a',
    plank: ['#1f1b19', '#29231f', '#332c26', '#3e352e', '#4a4037'],
    leaf: ['#2b3a2c', '#3a4a38', '#4c5c46', '#61705a'],
    lichen: ['#3c4c34', '#4d5d42'],
    stone: { face: ['#131b1f', '#28373e', '#32444b', '#3e525a', '#56707a'], top: ['#0f161a', '#141c20', '#1a2328'], style: 'ashlar' },
    moss: ['#2c3b28', '#3c4c34', '#4e603f'],
    fence: ['#171a1a', '#262b2b', '#353b3a', '#454c4a', '#58605d'],
    roof: ['#10161a', '#172027', '#1f2a32', '#28363f', '#35464f'], roofSpeck: '#3c4c34',
    cliff: ['#1d2225', '#283034', '#333d42', '#3f4a50', '#4d5a60'],
    rock: ['#172024', '#27333a', '#34424a', '#44545c', '#58696f'],
    hs: ['#141c20', '#34454c', '#43575f', '#566b72', '#6f858b'],
    water: ['#0a141b', '#0e1c25', '#132530', '#1a323e', '#244150'], wlite: ['#6f9aa0', '#b9d6d3'],
    bark: ['#1f1512', '#2e1f1a', '#402b22', '#52382c', '#62463a'],
    canopy: ['#0e150f', '#141e16', '#1b281d', '#243426', '#304232'],
  });
  TH.greyharrow = Object.assign({}, TH.village, {
    floor: 'mud',
    ground: ['#261e1b', '#302622', '#3a2f29', '#463830', '#54443a'],
    speck: ['#6b605a', '#857a72'],
    pebble: ['#645a55', '#4a413c', '#221a17'],
    grass: ['#2a281f', '#353327', '#413f31', '#4e4b3b', '#5c5946'],
    blade: ['#302e24', '#56533f', '#6e6a52'],
    bladeDensity: 0.07,
    path: ['#342a25', '#3f332d', '#4a3d35', '#56473e', '#635248'],
    mud: ['#1c1513', '#251c19', '#2f2420', '#3a2d28', '#5d5f63'],
    puddle: ['#2d3238', '#3f454c', '#6a7178'],
    leaf: ['#4a3b30', '#5b493c', '#6c5a4b', '#7d6b5b'],
    stone: { face: ['#1e1a1a', '#363031', '#453e3e', '#554d4c', '#6a6160'], top: ['#161313', '#1c1818', '#231e1e'], style: 'block' },
    wood: { face: ['#1a1614', '#2b2521', '#3a332e', '#4b433d', '#5e554e'], top: ['#131110', '#191614', '#201c19'] },
    fence: ['#1a1614', '#2b2521', '#3a332e', '#4b433d', '#5e554e'],
    roof: ['#171311', '#221c18', '#2d2520', '#393029', '#473c33'], roofSpeck: '#5c5450',
    cliff: ['#241c18', '#30251f', '#3d2f28', '#4b3a31', '#5a473c'],
    rock: ['#1e1a19', '#322c2a', '#433b38', '#554c49', '#6b615d'],
    hs: ['#1a1616', '#3f3838', '#534a4a', '#675e5d', '#7f7574'],
    water: ['#15130f', '#1b1813', '#221e18', '#2c2720', '#39322a'], wlite: ['#5c584e', '#827c6f'],
    bark: ['#0b090a', '#141011', '#1e1819', '#2a2223', '#3a3031'],
  });
  TH.city = Object.assign({}, TH.village, {
    floor: 'paving',
    ground: ['#38373c', '#434247', '#4e4d53', '#5a595f', '#68676c'],
    speck: ['#77767a', '#8f8e91'],
    pebble: ['#737277', '#58575c', '#302f34'],
    grass: ['#2e2f28', '#3a3b32', '#47473d', '#555549', '#646356'],
    blade: ['#35362d', '#5c5c4c', '#767562'],
    bladeDensity: 0.08,
    path: ['#3e3c3d', '#49474a', '#545255', '#605e61', '#6d6b6e'],
    flag: ['#36353a', '#414045', '#4c4b50', '#58575c', '#66656a'],
    cobble: ['#2c2b30', '#403f44', '#4d4c51', '#5b5a5f', '#6b6a6f'], gap: '#262529', gapAlt: '#6b6a6d',
    stone: { face: ['#2d2c32', '#48474d', '#56555b', '#64636a', '#7d7c82'], top: ['#1b1a1f', '#222127', '#2a292f'], style: 'ashlar' },
    brick: { face: ['#2a2527', '#4b2f2b', '#5a3832', '#69443c', '#78524a'], alt: '#4c4648', top: ['#181416', '#1f191c', '#271f23'] },
    fence: ['#1b1a1c', '#2c2a2d', '#3c393d', '#4e4b4f', '#636064'],
    roof: ['#13151b', '#1b1f27', '#242a34', '#2f3642', '#3c4452'], roofSpeck: '#63656b',
    rock: ['#26252a', '#3a393f', '#4b4a50', '#5e5d63', '#747379'],
    hs: ['#1e1d22', '#4b4a50', '#5e5d63', '#727177', '#8b8a8f'],
    bark: ['#231f21', '#342f31', '#463f42', '#595153', '#6d6467'],
  });
  TH.wickward = Object.assign({}, TH.village, {
    floor: 'char',
    ground: ['#1f1917', '#281f1c', '#322724', '#3e312c', '#4b3d37'],
    speck: ['#4a4442', '#5d5654'],
    ashc: ['#4a4442', '#5d5654', '#716a67'],
    pebble: ['#4b4240', '#342c2a', '#1a1413'],
    grass: ['#1e1816', '#27201c', '#302723', '#3b302a', '#473a33'],
    blade: ['#141011', '#3a302a', '#55493f'],
    bladeDensity: 0.1,
    path: ['#2e2927', '#3a3432', '#46403d', '#534c49', '#615955'],
    mud: ['#161110', '#1d1614', '#251c19', '#2f2420', '#4f3a32'],
    ash: ['#4d4746', '#5f5958', '#726b6a', '#86807e', '#9b9592'],
    flag: ['#211c1c', '#2a2424', '#342d2c', '#3f3736', '#4b4240'],
    cobble: ['#1c1717', '#2b2423', '#362e2c', '#423836', '#504543'], gap: '#141010', gapAlt: '#4a4442',
    plank: ['#140f0e', '#1d1614', '#271d1a', '#322622', '#3f302a'],
    burnt: ['#110d0d', '#191413', '#221b1a', '#2e2422', '#4a423f'],
    leaf: ['#1d1715', '#2e2522', '#4a403c', '#5f5450'],
    lichen: ['#3a3432', '#4a4442'],
    twig: '#120e0d',
    stone: { face: ['#161212', '#2d2625', '#39302f', '#463c3a', '#5b4e4b'], top: ['#100d0d', '#161212', '#1d1817'], style: 'block' },
    brick: { face: ['#1a1515', '#3a2622', '#46302a', '#523a32', '#5f463c'], alt: '#3a3434', top: ['#120f0f', '#181414', '#1f1919'] },
    wood: { face: ['#100c0b', '#1b1513', '#261d1a', '#322622', '#40312b'], top: ['#0d0a09', '#130f0e', '#1a1513'] },
    fence: ['#100c0b', '#1b1513', '#261d1a', '#322622', '#40312b'],
    roof: ['#0f0d0e', '#171415', '#201b1c', '#2a2324', '#362e2e'], roofSpeck: '#4a4442',
    cliff: ['#1c1614', '#261e1b', '#302622', '#3c302b', '#4a3b34'],
    rock: ['#171313', '#272120', '#352d2b', '#453b39', '#584c49'],
    hs: ['#171313', '#3a3231', '#4b4140', '#5d5250', '#72625f'],
    water: ['#0a090b', '#0f0d10', '#151216', '#1c181d', '#262027'], wlite: ['#5a2a1c', '#b8361a'],
    bark: ['#080607', '#110d0e', '#1b1516', '#261e1f', '#342a2a'],
  });
  TH.cave = Object.assign({}, TH.village, {
    floor: 'rock',
    ground: ['#1f1b22', '#28232b', '#322c35', '#3c3540', '#49414d'],
    speck: ['#5a6770', '#6f7c84'],
    pebble: ['#5c5461', '#443d48', '#1f1b22'],
    grass: ['#1f2220', '#282c27', '#323730', '#3d433a', '#4a5146'],
    blade: ['#252924', '#4f5a48', '#6b7862'],
    bladeDensity: 0,
    path: ['#2e2828', '#393232', '#433b3b', '#4f4646', '#5c5252'],
    mud: ['#18151a', '#1f1b21', '#27222a', '#302a33', '#4c5a66'],
    flag: ['#211d24', '#2a252d', '#332d37', '#3e3742', '#4b434f'],
    cobble: ['#1e1a21', '#2c2730', '#38323d', '#453e4a', '#544c59'], gap: '#151218', gapAlt: '#2f3a33',
    leaf: ['#3a3438', '#4a4247', '#5a5156', '#6a6166'],
    lichen: ['#4a5446', '#5d6a57'],
    stone: { face: ['#131015', '#28232c', '#332d38', '#403946', '#554d5c'], top: ['#0e0c10', '#131016', '#19151c'], style: 'rock' },
    fence: ['#1a1513', '#2b221e', '#3a2e28', '#4b3c34', '#5e4c42'],
    cliff: ['#131015', '#28232c', '#332d38', '#403946', '#554d5c'],
    rock: ['#1a171d', '#2c2730', '#3a343f', '#4b4451', '#615a68'],
    hs: ['#18151b', '#3a343f', '#4b4451', '#5d5663', '#746c7a'],
    water: ['#090e13', '#0d141b', '#121b24', '#18242f', '#223240'], wlite: ['#4f6f7c', '#82a8ad'],
  });
  TH.interior = Object.assign({}, TH.village, {
    floor: 'flags',
    ground: ['#29252c', '#332e36', '#3d3740', '#48424c', '#555058'],
    flag: ['#29252c', '#332e36', '#3d3740', '#48424c', '#555058'],
    plank: ['#241b17', '#30241e', '#3c2e26', '#49382e', '#574437'],
    path: ['#38333a', '#433d45', '#4e4750', '#5a525c', '#675e69'],
    grass: ['#232822', '#2c332b', '#363e34', '#414a3e', '#4e5849'],
    blade: ['#2d372c', '#4a5645', '#5e6b58'],
    bladeDensity: 0,
    stone: { face: ['#1f1a1f', '#3a3236', '#453c40', '#51474b', '#675c5f'], top: ['#141116', '#1a161c', '#211c23'], style: 'plaster' },
    wood: { face: ['#1a1310', '#2a1f19', '#382a21', '#47362b', '#584436'], top: ['#130e0c', '#1a1411', '#211915'] },
    fence: ['#1a1310', '#2a1f19', '#382a21', '#47362b', '#584436'],
    rock: ['#1f1b20', '#332d33', '#443d44', '#575057', '#6d666c'],
  });
  TH.pyre = Object.assign({}, TH.village, {
    floor: 'pyre',
    ground: ['#1c191b', '#242022', '#2d282b', '#383235', '#453e41'],
    ashc: ['#2e2a2b', '#353031', '#3d3738'],
    speck: ['#4a4344', '#5a5253'],
    pebble: ['#4a4447', '#332e31', '#161315'],
    grass: ['#1f1c1d', '#282425', '#322d2e', '#3d3738', '#4a4344'],
    blade: ['#1a1718', '#595253', '#736c6c'],
    bladeDensity: 0.07,
    path: ['#2e2a2b', '#363132', '#3f393a', '#484142', '#524b4c'],
    mud: ['#141213', '#1b1819', '#231f21', '#2d282a', '#4a3a36'],
    ash: ['#2f2a2b', '#373132', '#403a3b', '#4a4344', '#554d4e'],
    flag: ['#1a1719', '#221f21', '#2b272a', '#353033', '#423c3f'],
    cobble: ['#181517', '#252124', '#2f2a2e', '#3a3439', '#474045'], gap: '#5b5555', gapAlt: '#6e6868',
    plank: ['#120e0d', '#1a1513', '#231b18', '#2d2420', '#3a2e29'],
    burnt: ['#0f0d0d', '#171414', '#201c1b', '#2b2524', '#4a4442'],
    leaf: ['#3a3536', '#4a4546', '#5b5555', '#6e6868'],
    twig: '#0f0c0c',
    stone: { face: ['#0f0d10', '#231f23', '#2c272c', '#373137', '#4c454b'], top: ['#0c0a0d', '#110f12', '#171418'], style: 'ashlar' },
    brick: { face: ['#121010', '#2e201d', '#382722', '#432f29', '#503831'], alt: '#302b2c', top: ['#0e0c0c', '#141111', '#1a1616'] },
    wood: { face: ['#0d0a09', '#171211', '#201916', '#2a201c', '#362a24'], top: ['#0b0908', '#100d0c', '#161211'] },
    fence: ['#0d0a09', '#171211', '#201916', '#2a201c', '#362a24'],
    roof: ['#0d0c0e', '#141215', '#1c191c', '#252124', '#302b2f'], roofSpeck: '#655e5e',
    cliff: ['#131113', '#1f1b1e', '#2a2528', '#353033', '#433c40'],
    rock: ['#141214', '#221f22', '#2e2a2e', '#3b363b', '#4d474c'],
    hs: ['#141214', '#322d31', '#403a3f', '#4f494e', '#635c62'],
    water: ['#080708', '#0d0b0d', '#131012', '#1a1618', '#241e21'], wlite: ['#5a2a1c', '#e2621f'],
    bark: ['#070606', '#0f0c0d', '#181314', '#221b1c', '#2e2526'],
  });
  const th = (c) => TH[c.theme] || TH.village;

  const IRON = ['#0d0b0e', '#1c191e', '#2e2a31', '#48434b', '#625c65'];
  const RUST = ['#3a261a', '#5a3a24'];

  // ================================================================ neighbour helpers
  // wall family for the face/top decision (the tile *below*) — a wall above a doorway/window is a wall top
  const BELOW = { wall: 1, wall_brick: 1, wall_wood: 1, wall_cracked: 1, wall_false: 1, window: 1, doorway: 1, roof: 1 };
  // things that continue a wall sideways (no end-cap edge drawn between them)
  const SIDE = { wall: 1, wall_brick: 1, wall_wood: 1, wall_cracked: 1, wall_false: 1, window: 1, doorway: 1 };
  function matOf(c, id) {
    if (id === 'wall_brick') return 'brick';
    if (id === 'wall_wood') return 'wood';
    if (id === 'wall') return 'stone';
    const look = [[-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0]];
    for (let k = 0; k < look.length; k++) {
      const t = c.tile(look[k][0], look[k][1]);
      if (t === 'wall_brick') return 'brick';
      if (t === 'wall_wood') return 'wood';
      if (t === 'wall') return 'stone';
    }
    return 'stone';
  }
  function isFace(c) { const b = c.tile(0, 1); return !(b === null || BELOW[b]); }

  // organic edge mask against neighbours that are not `ok`: 0 outside, 1 rim, 2 inside
  function foreign(c, ok) {
    const L = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if ((dx || dy) && !ok(c.tile(dx, dy))) L.push(dx, dy);
    }
    return L;
  }
  function edist(L, i, j) {
    let m = 99;
    for (let k = 0; k < L.length; k += 2) {
      const dx = L[k], dy = L[k + 1];
      const ex = dx < 0 ? i + 0.5 : dx > 0 ? 15.5 - i : 0;
      const ey = dy < 0 ? j + 0.5 : dy > 0 ? 15.5 - j : 0;
      const d = dx && dy ? Math.sqrt(ex * ex + ey * ey) : ex + ey;
      if (d < m) m = d;
    }
    return m;
  }
  function edgeMask(c, id, also, w0, w1, seed) {
    const L = foreign(c, (t) => t === null || t === id || (also && also.indexOf(t) >= 0));
    const X = c.x * S, Y = c.y * S;
    const m = new Array(S * S);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      if (!L.length) { m[j * S + i] = 2; continue; }
      const d = edist(L, i, j), t = w0 + w1 * vn(X + i, Y + j, 3.2, seed);
      m[j * S + i] = d < t ? 0 : d < t + 1.2 ? 1 : 2;
    }
    return m;
  }

  // ================================================================ ground painters
  function field(g, c, R, o) {
    const X = c.x * S, Y = c.y * S, s = o.seed || 11, sc = o.scale || 7;
    const con = o.con == null ? 2.2 : o.con, gr = o.grain == null ? 0.8 : o.grain, mid = o.mid == null ? 2 : o.mid;
    const m = o.mask;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      if (m && !m[j * S + i]) continue;
      const wx = X + i, wy = Y + j;
      const n = vn(wx, wy, sc, s) * 0.65 + vn(wx, wy, sc * 3.3, s + 7) * 0.35;
      let v = mid + (n - 0.5) * con * 2 + (hf(wx, wy, s + 3) - 0.5) * gr;
      if (m && m[j * S + i] === 1) v -= o.rim == null ? 0.8 : o.rim;
      g.px(i, j, at(R, Math.round(v)));
    }
  }
  // rectangular flag/slab courses in world space
  function slabs(g, c, R, o) {
    const X = c.x * S, Y = c.y * S, s = o.seed || 21, hh = o.h || 8, jc = o.jc || 0;
    for (let j = 0; j < S; j++) {
      const wy = Y + j, row = Math.floor(wy / hh), ry = wy - row * hh;
      const w = o.w[U.hash2(row, 1, s) % o.w.length];
      const off = U.hash2(row, 2, s) % w;
      for (let i = 0; i < S; i++) {
        const wx = X + i, p = wx + off, col = Math.floor(p / w), rx = p - col * w;
        if (ry === hh - 1 || rx === w - 1) {
          const jcol = o.joint ? o.joint(wx, wy) : null;
          g.px(i, j, jcol || R[jc]);
          continue;
        }
        const tone = hf(col, row, s + 1);
        let idx = 2 + (tone < 0.25 ? -1 : tone > 0.8 ? 1 : 0);
        if (ry === 0 && o.bevel !== false) idx += 1;
        const gr = hf(wx, wy, s + 2);
        if (gr < 0.08) idx -= 1; else if (gr > 0.95) idx += 1;
        g.px(i, j, at(R, idx));
      }
    }
  }
  // soft drift of ash lying over whatever is painted
  function ashOver(g, c, A, thr, s) {
    const X = c.x * S, Y = c.y * S;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const wx = X + i, wy = Y + j;
      const n = vn(wx, wy, 9, s) * 0.7 + vn(wx, wy, 3, s + 1) * 0.3;
      if (n > thr + 0.07) g.px(i, j, n > thr + 0.17 ? A[2] : A[1]);
      else if (n > thr && ((wx + wy) & 1)) g.px(i, j, A[0]);
    }
  }

  // small features ------------------------------------------------
  function pebble(g, x, y, Pb, big) {
    if (!big) { g.px(x, y, Pb[0]); g.px(x + 1, y, Pb[1]); shadow(g, x, y + 1, 0.72); shadow(g, x + 1, y + 1, 0.72); return; }
    g.px(x, y, Pb[0]); g.px(x + 1, y, Pb[0]); g.px(x + 2, y, Pb[1]);
    g.px(x, y + 1, Pb[1]); g.px(x + 1, y + 1, Pb[1]); g.px(x + 2, y + 1, Pb[2]);
    for (let k = 0; k < 3; k++) shadow(g, x + k, y + 2, 0.7);
    shadow(g, x + 3, y + 1, 0.8);
  }
  function crackAt(g, c, x, y, len, col, hi) {
    const r = c.rnd, dx = r() < 0.5 ? -1 : 1, pts = [];
    for (let k = 0; k < len; k++) {
      if (x < 1 || x > 14 || y < 1 || y > 14) break;
      pts.push(x, y);
      const q = r();
      if (q < 0.5) x += dx; else if (q < 0.85) { x += dx; y += r() < 0.5 ? -1 : 1; } else y += r() < 0.5 ? -1 : 1;
    }
    for (let k = 0; k < pts.length; k += 2) g.px(pts[k], pts[k + 1], col);
    if (hi) for (let k = 0; k < pts.length; k += 2) if (g.get(pts[k], pts[k + 1] + 1) !== col) g.px(pts[k], pts[k + 1] + 1, hi);
  }
  function tuft(g, c, x, y, B) {
    const n = 3 + Math.floor(c.rnd() * 2);
    for (let k = 0; k < n; k++) {
      const bx = x + (k - (n >> 1)) * 1;
      const h = 2 + Math.floor(c.rnd() * 2) + (k === (n >> 1) ? 1 : 0);
      const lean = bx < x ? -1 : bx > x ? 1 : 0;
      for (let t = 0; t < h; t++) g.px(bx + (t === h - 1 && h > 2 ? lean : 0), y - t, t === 0 ? B[0] : t === h - 1 ? B[2] : B[1]);
    }
  }
  function patch(g, cx, cy, rx, ry, cols) {
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++)
      for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
        const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry, d = dx * dx + dy * dy;
        if (d > 1 || i < 0 || j < 0 || i > 15 || j > 15) continue;
        if (d > 0.55 && ((i + j) & 1)) continue;
        g.px(i, j, d < 0.3 ? cols[1] : cols[0]);
      }
  }
  function twig(g, c, x, y, col) {
    const len = 3 + ri(c, 0, 3), dx = c.rnd() < 0.5 ? -1 : 1, slope = c.rnd() < 0.5 ? 0 : 1;
    for (let k = 0; k < len; k++) { g.px(x + k * dx, y + ((k * slope) >> 1), col); shadow(g, x + k * dx, y + ((k * slope) >> 1) + 1, 0.8); }
    if (len > 4) g.px(x + 2 * dx, y - 1, col);
  }
  function leafAt(g, x, y, L, k) {
    const a = L[k % L.length], b = L[(k + 1) % L.length];
    if (k & 1) { g.px(x, y, a); g.px(x + 1, y, b); g.px(x + 1, y - 1, a); }
    else { g.px(x, y, a); g.px(x + 1, y + 1, b); g.px(x, y + 1, b); }
    shadow(g, x + 1, y + 2, 0.75);
  }
  function fern(g, c, x, y, B) {
    const dir = c.rnd() < 0.5 ? -1 : 1;
    for (let k = 0; k < 5; k++) {
      const px = x + ((k * dir) >> 1), py = y - k;
      g.px(px, py, B[1]);
      if (k > 0 && k < 4) { g.px(px - 1, py + (k & 1), B[k & 1 ? 2 : 1]); g.px(px + 1, py + (k & 1 ? 0 : 1), B[1]); }
    }
    g.px(x + ((4 * dir) >> 1) + dir, y - 5, B[2]);
  }
  function shroom(g, x, y) {
    g.px(x, y, '7'); g.px(x, y - 1, '9'); g.px(x - 1, y - 1, '8'); g.px(x + 1, y - 1, '7'); shadow(g, x + 1, y, 0.7);
  }
  function coal(g, x, y) { g.px(x, y, '1'); g.px(x + 1, y, '0'); g.px(x, y - 1, '3'); shadow(g, x + 1, y + 1, 0.7); }
  function puddle(g, c, P) {
    const cx = ri(c, 5, 10), cy = ri(c, 5, 11), rx = 2.5 + c.rnd() * 1.5, ry = 1.4 + c.rnd() * 0.6;
    const Pd = P.puddle || [P.water[2], P.water[3], P.wlite[0]];
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry, d = dx * dx + dy * dy;
      if (d <= 1) g.px(i, j, d > 0.6 ? Pd[1] : Pd[0]);
      else if (d < 1.5 && j > cy) shadow(g, i, j, 0.85);
    }
    g.px(Math.round(cx) - 1, Math.round(cy) - 1, Pd[2]); g.px(Math.round(cx), Math.round(cy) - 1, Pd[2]);
  }
  function rut(g, c, P) {
    const y = ri(c, 3, 12), G = P.ground;
    for (let i = 0; i < S; i++) {
      const yy = y + Math.round(vn(c.x * S + i, y, 6, 97) * 2 - 1);
      g.px(i, yy, G[0]); if (hf(i, yy, 3) < 0.7) g.px(i, yy - 1, G[3]);
    }
  }
  function prints(g, c, P) {
    const x = ri(c, 3, 10), y = ri(c, 3, 10), G = P.ground;
    for (let k = 0; k < 3; k++) {
      const px = x + k * 2, py = y + (k & 1) * 3;
      g.px(px, py, G[0]); g.px(px, py + 1, G[0]); g.px(px + 1, py + 1, G[1]);
    }
  }
  function sprinkle(g, c, P, d) {
    if (!d) return;
    const r = c.rnd, n = (k) => d[k] || 0;
    for (let k = 0; k < n('puddle'); k++) puddle(g, c, P);
    for (let k = 0; k < n('ruts'); k++) rut(g, c, P);
    for (let k = 0; k < n('patch'); k++) patch(g, ri(c, 4, 11), ri(c, 4, 11), 2.5 + r() * 2, 1.6 + r(), [P.ground[3], P.speck[0]]);
    for (let k = 0; k < n('lichen'); k++) patch(g, ri(c, 3, 12), ri(c, 3, 12), 1.6 + r() * 1.5, 1.2 + r(), P.lichen);
    for (let k = 0; k < n('cracks'); k++) crackAt(g, c, ri(c, 3, 12), ri(c, 3, 12), 5 + ri(c, 0, 4), P.ground[0], P.ground[3]);
    for (let k = 0; k < n('prints'); k++) prints(g, c, P);
    for (let k = 0; k < n('pebbles'); k++) pebble(g, ri(c, 1, 13), ri(c, 1, 12), P.pebble, false);
    for (let k = 0; k < n('big'); k++) pebble(g, ri(c, 2, 11), ri(c, 2, 11), P.pebble, true);
    for (let k = 0; k < n('tufts'); k++) tuft(g, c, ri(c, 3, 12), ri(c, 5, 13), P.blade);
    for (let k = 0; k < n('ferns'); k++) fern(g, c, ri(c, 4, 11), ri(c, 8, 13), P.blade);
    for (let k = 0; k < n('twig'); k++) twig(g, c, ri(c, 3, 10), ri(c, 3, 12), P.twig);
    for (let k = 0; k < n('splinter'); k++) twig(g, c, ri(c, 2, 11), ri(c, 2, 13), '#5e554e');
    for (let k = 0; k < n('leaves'); k++) leafAt(g, ri(c, 1, 13), ri(c, 2, 12), P.leaf, k + ri(c, 0, 3));
    for (let k = 0; k < n('shrooms'); k++) shroom(g, ri(c, 2, 13), ri(c, 3, 13));
    for (let k = 0; k < n('coal'); k++) coal(g, ri(c, 2, 12), ri(c, 2, 12));
    for (let k = 0; k < n('bone'); k++) { const x = ri(c, 3, 11), y = ri(c, 3, 12); g.px(x, y, '8'); g.px(x + 1, y, '7'); g.px(x + 2, y, '8'); shadow(g, x + 1, y + 1, 0.7); }
    for (let k = 0; k < n('rust'); k++) { const x = ri(c, 2, 12), y = ri(c, 2, 13); g.px(x, y, RUST[0]); g.px(x + 1, y, RUST[1]); g.px(x + 2, y + 1, RUST[0]); }
    for (let k = 0; k < n('specks'); k++) g.px(ri(c, 1, 14), ri(c, 1, 14), P.speck[k & 1]);
    for (let k = 0; k < n('embers'); k++) g.px(ri(c, 1, 14), ri(c, 1, 14), k % 3 === 2 ? 'm' : k & 1 ? 'k' : 'l');
    for (let k = 0; k < n('mineral'); k++) g.px(ri(c, 1, 14), ri(c, 1, 14), k & 1 ? '#6f8e96' : '#4f6670');
  }

  // floor styles -------------------------------------------------
  const DETAIL = {
    dirt: [{ pebbles: 2, specks: 3 }, { cracks: 1, specks: 2 }, { tufts: 1, specks: 2, pebbles: 1 }, { patch: 1, specks: 2 },
      { pebbles: 2, big: 1 }, { specks: 5 }, { tufts: 2, specks: 1 }, { twig: 1, pebbles: 1, specks: 2 }],
    moss: [{ leaves: 2, pebbles: 1 }, { ferns: 1, leaves: 1 }, { shrooms: 2 }, { lichen: 1, leaves: 1 },
      { pebbles: 2, specks: 2 }, { leaves: 3 }, { ferns: 1, specks: 2 }, { twig: 1, leaves: 1 }],
    wetstone: [{ specks: 2 }, { cracks: 1 }, { puddle: 1 }, { lichen: 1 }, { pebbles: 2 }, { specks: 3 }, { cracks: 1, lichen: 1 }, {}],
    mud: [{ ruts: 1 }, { puddle: 1 }, { prints: 1, splinter: 1 }, { tufts: 1, pebbles: 1 }, { rust: 1, pebbles: 1 },
      { ruts: 1, prints: 1 }, { bone: 1 }, { splinter: 2, specks: 2 }],
    paving: [{ specks: 3 }, { cracks: 1 }, { specks: 2, pebbles: 1 }, { tufts: 1 }, {}, { cracks: 1, specks: 1 }, { patch: 1 }, { specks: 4 }],
    char: [{ embers: 2, coal: 1 }, { cracks: 1, embers: 1 }, { coal: 2 }, { embers: 3 }, { pebbles: 2 }, { coal: 1, embers: 1 }, { cracks: 1 }, { twig: 1, embers: 2 }],
    rock: [{ pebbles: 2 }, { cracks: 1 }, { mineral: 2 }, { pebbles: 1, big: 1 }, { puddle: 1 }, { cracks: 1, pebbles: 1 }, { lichen: 1 }, { specks: 3 }],
    flags: [{ specks: 2 }, { cracks: 1 }, {}, { pebbles: 1 }, { specks: 3 }, { cracks: 1, specks: 1 }, {}, { pebbles: 2 }],
    pyre: [{ embers: 2 }, { coal: 1 }, { bone: 1 }, { embers: 1, coal: 1 }, { cracks: 1 }, { embers: 3 }, { coal: 2 }, {}],
  };
  function drawFloor(g, c) {
    const P = th(c), st = P.floor, d = DETAIL[st] || DETAIL.dirt;
    const X = c.x * S, Y = c.y * S;
    switch (st) {
      case 'moss':
        field(g, c, P.ground, { seed: 13, scale: 5, con: 2.5 });
        break;
      case 'wetstone':
        slabs(g, c, P.ground, {
          w: [6, 7, 9, 11], h: 6, seed: 17, bevel: false,
          joint: (wx, wy) => { const h = hf(wx, wy, 18); return h < 0.3 ? P.moss[0] : h < 0.4 ? P.moss[1] : null; },
        });
        for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) if (hf(X + i, Y + j, 19) < 0.025) g.px(i, j, '#4d6a71');
        break;
      case 'mud':
        field(g, c, P.ground, { seed: 19, scale: 6, con: 2.6, grain: 0.7 });
        break;
      case 'paving':
        slabs(g, c, P.ground, { w: [8, 10, 12, 16], h: 8, seed: 23, jc: 1,
          joint: (wx, wy) => (hf(wx, wy, 24) < 0.18 ? P.ground[0] : null) });
        break;
      case 'char':
        field(g, c, P.ground, { seed: 29, scale: 6, con: 2.4 });
        ashOver(g, c, P.ashc, 0.64, 31);
        break;
      case 'rock':
        field(g, c, P.ground, { seed: 37, scale: 5, con: 2.4 });
        break;
      case 'flags':
        slabs(g, c, P.ground, { w: [8, 10, 12], h: 8, seed: 41 });
        break;
      case 'pyre':
        slabs(g, c, P.ground, { w: [8, 12], h: 8, seed: 43 });
        ashOver(g, c, P.ashc, 0.5, 47);
        break;
      default:
        field(g, c, P.ground, { seed: 11, scale: 7 });
    }
    sprinkle(g, c, P, d[c.variant]);
  }

  // ---------------------------------------------------------------- grass
  function drawGrass(g, c) {
    const P = th(c), X = c.x * S, Y = c.y * S, B = P.blade, R = P.grass;
    const m = edgeMask(c, 'grass', ['lilies'], 0.3, 2.8, 61);
    if (c.theme === 'greyharrow') {
      // sparse grass: patches of turf on churned mud
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
        if (!m[j * S + i]) continue;
        const n = vn(X + i, Y + j, 4, 62);
        g.px(i, j, n > 0.45 ? at(R, Math.round(1.5 + (n - 0.45) * 5 + (hf(X + i, Y + j, 63) - 0.5))) : at(P.ground, Math.round(2 + (hf(X + i, Y + j, 64) - 0.5) * 1.2)));
      }
    } else if (c.theme === 'pyre') {
      field(g, c, P.ground, { seed: 43, scale: 6, mask: m });
    } else {
      field(g, c, R, { seed: 65, scale: 5, con: 1.3, grain: 0.5, mask: m, rim: 1, mid: 1.6 });
    }
    // blades — a dense world-coherent hatch; tufts lean with a slow "wind" field
    const dens = P.bladeDensity;
    for (let j = 1; j < S; j++) for (let i = 0; i < S; i++) {
      if (!m[j * S + i]) continue;
      const wx = X + i, wy = Y + j;
      let dd = m[j * S + i] === 1 ? dens * 0.5 : dens;
      if (c.theme === 'greyharrow' && vn(wx, wy, 4, 62) < 0.5) dd = 0;
      if (hf(wx, wy, 66) >= dd) continue;
      const h = 1 + Math.floor(hf(wx, wy, 67) * 3.2);
      const wind = vn(wx, wy, 11, 69), lean = wind < 0.4 ? -1 : wind > 0.6 ? 1 : 0;
      const tip = hf(wx, wy, 68) < 0.55 ? B[1] : B[2];
      for (let t = 0; t < h; t++) {
        const px = i + (t >= 2 ? lean : 0), py = j - t;
        if (px < 0 || px > 15 || py < 0) break;
        g.px(px, py, t === 0 && h > 1 ? B[0] : t === h - 1 ? tip : B[1]);
      }
    }
    const th0 = c.theme, v = c.variant;
    if (th0 === 'hushwood') {
      if (v % 3 === 0) fern(g, c, ri(c, 4, 11), ri(c, 9, 13), B);
      if (v === 2 || v === 5) leafAt(g, ri(c, 2, 12), ri(c, 2, 12), P.leaf, v);
    } else if (th0 === 'cave' || th0 === 'interior') {
      sprinkle(g, c, P, v & 1 ? { lichen: 1 } : { pebbles: 1 });
    } else if (th0 === 'wickward' || th0 === 'pyre') {
      sprinkle(g, c, P, v & 1 ? { embers: 1 } : { specks: 2 });
      if (th0 === 'pyre') ashOver(g, c, P.ashc, 0.62, 49);
    } else if (th0 === 'village' && v === 4) {
      patch(g, ri(c, 4, 11), ri(c, 4, 11), 2.2, 1.3, [P.ash[1], P.ash[2]]);
    } else if (th0 === 'abbey' && v === 6) {
      for (let k = 0; k < 3; k++) g.px(ri(c, 2, 13), ri(c, 2, 13), P.speck[k & 1]);
    }
  }

  // ---------------------------------------------------------------- path, mud, ash, burnt
  const PATHISH = ['doorway', 'stairs', 'cobble', 'flagstone', 'wood_floor', 'rug'];
  function drawPath(g, c) {
    const P = th(c), X = c.x * S, Y = c.y * S;
    const m = edgeMask(c, 'path', PATHISH, 0.2, 2.2, 71);
    field(g, c, P.path, { seed: 73, scale: 6, con: 1.1, grain: 0.5, mask: m, rim: 1.1 });
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      if (m[j * S + i] !== 2) continue;
      const h = hf(X + i, Y + j, 72);
      if (h < 0.035) g.px(i, j, P.path[4]); else if (h > 0.972) g.px(i, j, P.path[0]);
    }
    // faint wheel/foot ruts along the direction of travel
    const hz = c.tile(-1, 0) === 'path' || c.tile(1, 0) === 'path';
    const vt = c.tile(0, -1) === 'path' || c.tile(0, 1) === 'path';
    for (let k = 0; k < S; k++) {
      if (hz && !vt) for (const r0 of [5, 11]) { const j = r0 + (vn(X + k, r0, 5, 74) > 0.6 ? 1 : 0); if (m[j * S + k] === 2 && hf(X + k, j, 75) < 0.55) g.px(k, j, P.path[1]); }
      if (vt && !hz) for (const r0 of [5, 11]) { const i = r0 + (vn(r0, Y + k, 5, 76) > 0.6 ? 1 : 0); if (m[k * S + i] === 2 && hf(i, Y + k, 77) < 0.55) g.px(i, k, P.path[1]); }
    }
    const v = c.variant;
    if (v < 3) { const x = ri(c, 2, 12), y = ri(c, 2, 12); if (m[y * S + x] === 2) pebble(g, x, y, P.pebble, false); }
    if (c.theme === 'hushwood' && v > 4) leafAt(g, ri(c, 2, 12), ri(c, 2, 12), P.leaf, v);
    if ((c.theme === 'wickward' || c.theme === 'pyre') && v === 3) g.px(ri(c, 3, 12), ri(c, 3, 12), 'l');
  }
  function drawMud(g, c) {
    const P = th(c), X = c.x * S, Y = c.y * S, R = P.mud;
    const m = edgeMask(c, 'mud', ['shallow', 'water'], 0.3, 2.4, 81);
    field(g, c, R, { seed: 83, scale: 5, con: 2.0, grain: 0.6, mask: m, rim: -0.8, mid: 2.2 });
    // wet sheen: short pale glints on the high spots, darker slick in the hollows
    for (let j = 1; j < S; j++) for (let i = 0; i < S - 2; i++) {
      if (m[j * S + i] !== 2) continue;
      const wx = X + i, wy = Y + j, hgt = vn(wx, wy, 5, 83);
      if (hgt < 0.36 && hf(wx, wy, 85) < 0.5) g.px(i, j, R[1]);
      if (hf(wx >> 1, wy, 84) < 0.06 && hgt > 0.5) { g.px(i, j, R[4]); if (m[j * S + i + 1] === 2) g.px(i + 1, j, R[3]); }
    }
    if (c.variant === 1 || c.variant === 5) prints(g, c, { ground: [R[0], R[1]] });
    if (c.variant === 3) puddle(g, c, P);
  }
  function drawAsh(g, c) {
    const P = th(c), X = c.x * S, Y = c.y * S, A = P.ash;
    const m = edgeMask(c, 'ash', null, 0.2, 3.2, 91);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const k = m[j * S + i];
      if (!k) continue;
      const wx = X + i, wy = Y + j;
      if (k === 1 && ((wx + wy) & 1)) continue;
      const n = vn(wx, wy, 6, 92);
      let idx = Math.round(1.3 + (n - 0.5) * 2.6 + (hf(wx, wy, 93) - 0.5) * 0.6);
      // wind ripples: lit crest, shaded lee
      const rip = Math.sin(wx * 0.42 + wy * 1.25 + vn(wx, wy, 8, 94) * 6);
      if (rip > 0.9) idx += 1; else if (rip < -0.86) idx -= 1;
      if (k === 1) idx -= 1;
      g.px(i, j, at(A, idx));
    }
    if (c.variant === 2 || c.variant === 6) { const x = ri(c, 3, 12), y = ri(c, 3, 12); if (m[y * S + x] === 2) { g.px(x, y, '2'); g.px(x + 1, y, '3'); } }
    if ((c.theme === 'wickward' || c.theme === 'pyre') && (c.variant & 1)) { const x = ri(c, 2, 13), y = ri(c, 2, 13); if (m[y * S + x] === 2) g.px(x, y, 'l'); }
  }
  function drawBurnt(g, c) {
    const P = th(c), X = c.x * S, Y = c.y * S, Bn = P.burnt;
    const m = edgeMask(c, 'burnt', ['embers'], 0.2, 2.6, 101);
    const boards = c.theme === 'interior';
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const k = m[j * S + i];
      if (!k) continue;
      const wx = X + i, wy = Y + j;
      let idx;
      if (boards && (wy & 3) === 3) idx = 0;
      else {
        // charcoal "alligator" cells, with pale ash in the seams
        const n = vn(wx, wy * (boards ? 2.5 : 1), 3, 102);
        idx = Math.abs(n - 0.5) < 0.045 ? 4 : n > 0.62 ? 1 : 2;
        if (hf(wx, wy, 103) < 0.1) idx = 3;
      }
      if (k === 1) { g.px(i, j, mix(g.get(i, j) || Bn[2], Bn[1], 0.6)); continue; }
      g.px(i, j, Bn[idx]);
    }
    if (c.variant === 1 || c.variant === 4) { const x = ri(c, 3, 12), y = ri(c, 3, 12); if (m[y * S + x] === 2) g.px(x, y, 'k'); }
  }

  // ---------------------------------------------------------------- built floors
  // rounded setts: nearest-seed cells in world space (seeds jittered on a 5-px lattice)
  function drawCobble(g, c) {
    const P = th(c), R = P.cobble, X = c.x * S, Y = c.y * S, CS = 5;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const wx = X + i + 0.5, wy = Y + j + 0.5, gx = Math.floor(wx / CS), gy = Math.floor(wy / CS);
      let d1 = 1e9, d2 = 1e9, id = 0, sx = 0, sy = 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const cx = gx + ox, cy = gy + oy;
        const px = cx * CS + 1 + hf(cx, cy, 115) * (CS - 2), py = cy * CS + 1 + hf(cx, cy, 116) * (CS - 2);
        const dx = wx - px, dy = (wy - py) * 1.12, d = dx * dx + dy * dy;
        if (d < d1) { d2 = d1; d1 = d; id = U.hash2(cx, cy, 117); sx = px; sy = py; } else if (d < d2) d2 = d;
      }
      const edge = Math.sqrt(d2) - Math.sqrt(d1);
      if (edge < 0.9) { g.px(i, j, hf(wx, wy, 112) < 0.22 ? P.gapAlt : P.gap); continue; }
      const dx = wx - sx, dy = wy - sy;
      const tone = (id % 97) / 97;
      let idx = 2 + (tone < 0.28 ? -1 : tone > 0.8 ? 1 : 0);
      const light = -(dx * 0.6 + dy) / 2.6;
      if (light > 0.45) idx++; else if (light < -0.55 && edge < 2.2) idx--;
      if (hf(wx, wy, 114) < 0.05) idx--;
      g.px(i, j, at(R, idx));
    }
    if (c.variant === 3) g.px(ri(c, 2, 13), ri(c, 2, 13), P.speck[0]);
  }
  function drawFlagstone(g, c) {
    const P = th(c), F = P.flag;
    const moss = P.moss;
    slabs(g, c, F, {
      w: [8, 10, 12], h: 8, seed: 121,
      joint: moss ? (wx, wy) => (hf(wx, wy, 122) < 0.25 ? moss[0] : null)
        : (c.theme === 'pyre' || c.theme === 'wickward') ? (wx, wy) => (hf(wx, wy, 123) < 0.3 ? P.ashc[0] : null) : null,
    });
    const v = c.variant;
    if (v === 1 || v === 5) crackAt(g, c, ri(c, 3, 12), ri(c, 2, 13), 6, F[0], null);
    if (v === 3) for (let k = 0; k < 4; k++) g.px(ri(c, 1, 14), ri(c, 1, 14), F[4]);
    if (v === 6 && c.theme === 'abbey') puddle(g, c, P);
    if ((c.theme === 'pyre' || c.theme === 'wickward') && v === 2) g.px(ri(c, 2, 13), ri(c, 2, 13), 'l');
  }
  function drawPlanks(g, c) {
    const P = th(c), R = P.plank, X = c.x * S, Y = c.y * S;
    const charred = c.theme === 'wickward' || c.theme === 'pyre';
    for (let j = 0; j < S; j++) {
      const wy = Y + j, row = wy >> 2, ry = wy & 3;
      const L = [12, 16, 20][U.hash2(row, 1, 131) % 3], off = U.hash2(row, 2, 131) % L;
      for (let i = 0; i < S; i++) {
        const wx = X + i, p = wx + off, b = Math.floor(p / L), rx = p - b * L;
        if (ry === 3 || rx === L - 1) { g.px(i, j, R[0]); continue; }
        const tone = hf(b, row, 132);
        let idx = 2 + (tone < 0.3 ? -1 : tone > 0.75 ? 1 : 0);
        if (ry === 0) idx++;
        if (hf(p >> 2, row * 4 + ry, 133) < 0.14) idx--;
        if ((rx === 1 || rx === L - 3) && ry === 1) { g.px(i, j, '#57504f'); continue; }
        if (charred && vn(wx, wy, 4, 134) > 0.6) idx = Math.max(0, idx - 2);
        g.px(i, j, at(R, idx));
      }
    }
    if (c.variant === 5) crackAt(g, c, ri(c, 3, 12), ri(c, 3, 12), 4, R[0], null);
  }
  function drawRug(g, c) {
    const X = c.x * S, Y = c.y * S;
    const is = (dx, dy) => { const t = c.tile(dx, dy); return t === null || t === 'rug'; };
    const oL = !is(-1, 0), oR = !is(1, 0), oU = !is(0, -1), oD = !is(0, 1);
    const base = ['#2a0c14', '#3f1119', '#4c1422', '#5a1a28', '#6b2531'];
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const wx = X + i, wy = Y + j;
      // fringe at the open ends
      if ((oU && j === 0) || (oD && j === 15)) { if ((wx & 1) === 0) g.px(i, j, (wx & 2) ? '#8f7a5a' : '#a88f68'); continue; }
      const ex = Math.min(oL ? i : 99, oR ? 15 - i : 99), ey = Math.min(oU ? j - 1 : 99, oD ? 14 - j : 99), e = Math.min(ex, ey);
      let col;
      if (e === 0) col = base[0];
      else if (e === 1) col = hf(wx, wy, 141) < 0.2 ? '#6f5a35' : 'L';
      else if (e === 2) col = base[1];
      else {
        const d1 = ((wx + wy) & 7) === 0, d2 = ((wx - wy) & 7) === 0;
        col = d1 || d2 ? base[3] : base[2];
        if (((wx & 7) === 4) && ((wy & 7) === 4)) col = 'K';
      }
      const worn = vn(wx, wy, 5, 142);
      if (worn > 0.68) col = mix(col, '#5a4a4c', (worn - 0.68) * 2.5);
      if (hf(wx, wy, 143) < 0.05) col = dim(col, 0.8);
      g.px(i, j, col);
    }
  }
  function drawStairs(g, c) {
    const P = th(c), R = c.theme === 'interior' || c.theme === 'city' ? P.flag : P.stone.face.slice(1).concat([P.stone.face[4]]);
    const sL = c.tile(-1, 0) !== 'stairs' && c.tile(-1, 0) !== null, sR = c.tile(1, 0) !== 'stairs' && c.tile(1, 0) !== null;
    const X = c.x * S, Y = c.y * S;
    for (let j = 0; j < S; j++) {
      const r = j & 3, step = j >> 2;
      for (let i = 0; i < S; i++) {
        let col;
        if (r === 3) col = R[0];
        else if (r === 0) col = R[3];
        else col = R[2];
        if (r !== 3 && hf(X + i, Y + j, 151) < 0.08) col = R[1];
        if (r === 1 && i > 4 && i < 11 && hf(X + i, step, 152) < 0.4) col = mix(col, R[3], 0.3);
        col = dim(col, 0.78 + step * 0.07);
        g.px(i, j, col);
      }
    }
    const W = P.stone.face;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) g.px(i, j, dim(g.get(i, j), 0.8));
    if (sL) for (let j = 0; j < S; j++) { g.px(0, j, W[0]); g.px(1, j, (j & 3) === 0 ? W[3] : W[2]); g.px(2, j, dim(g.get(2, j), 0.7)); }
    if (sR) for (let j = 0; j < S; j++) { g.px(15, j, W[0]); g.px(14, j, (j & 3) === 0 ? W[2] : W[1]); g.px(13, j, dim(g.get(13, j), 0.8)); }
  }

  // ---------------------------------------------------------------- decor over floor
  function drawLeaves(g, c) {
    const P = th(c), L = P.leaf;
    // drifted into a loose heap toward one corner, thinning out
    const cx = 5 + (c.variant & 3) * 2, cy = 6 + (c.variant >> 1);
    const n = 12 + ri(c, 0, 5);
    for (let k = 0; k < n; k++) {
      const a = c.rnd() * PI * 2, d = Math.pow(c.rnd(), 0.7) * 7;
      const x = Math.round(cx + Math.cos(a) * d), y = Math.round(cy + Math.sin(a) * d * 0.8);
      if (x < 1 || x > 13 || y < 1 || y > 13) continue;
      const col = L[(k + c.variant) % L.length], dark = L[0];
      const o = k % 4;
      if (o === 0) { g.px(x, y, col); g.px(x + 1, y, col); g.px(x + 2, y, dark); g.px(x + 1, y - 1, col); }
      else if (o === 1) { g.px(x, y, col); g.px(x, y + 1, col); g.px(x + 1, y + 1, dark); }
      else if (o === 2) { g.px(x, y, col); g.px(x + 1, y + 1, col); g.px(x + 2, y + 1, col); g.px(x + 1, y, dark); }
      else { g.px(x, y, col); g.px(x + 1, y, dark); }
      shadow(g, x + 1, y + 2, 0.72);
    }
  }
  function drawLilies(g, c) {
    const Lf = ['#1d2419', '#2e3a27', '#43533a', '#5d6e4f'];
    const n = 3 + (c.variant % 3 === 0 ? 1 : 0);
    const spots = [[4, 12], [9, 13], [12, 10], [6, 8], [10, 6], [3, 5]];
    const start = c.variant % 3;
    for (let k = 0; k < n; k++) {
      const s = spots[(start + k * 2) % spots.length];
      const x = s[0] + ri(c, -1, 1), y = s[1] + ri(c, -1, 1);
      const h = 3 + ri(c, 0, 3);
      shadow(g, x + 1, y + 1, 0.7); shadow(g, x, y + 1, 0.75);
      // leaves (long, blade-like)
      g.px(x - 1, y, Lf[1]); g.px(x - 2, y - 1, Lf[2]); g.px(x + 1, y, Lf[1]); g.px(x + 2, y - 1, Lf[2]); g.px(x + 2, y - 2, Lf[3]);
      for (let t = 0; t < h; t++) g.px(x, y - t, t === 0 ? Lf[0] : Lf[2]);
      // nodding trumpet flower
      const fx = x + (k & 1 ? 1 : -1), fy = y - h;
      g.px(x, fy, Lf[2]);
      g.px(fx, fy, '9'); g.px(fx, fy + 1, 'x'); g.px(fx + (k & 1 ? 1 : -1), fy + 1, '9'); g.px(fx, fy + 2, '8');
      g.px(fx + (k & 1 ? 1 : -1), fy + 2, 'y'); g.px(fx - (k & 1 ? 1 : -1), fy + 1, '8');
      if (k === 0) g.px(fx, fy - 1, 'x');
    }
  }
  function drawBones(g, c) {
    const v = c.variant;
    const bone = (x0, y0, x1, y1) => {
      g.line(x0, y0 + 1, x1, y1 + 1, null);
      const pts = [];
      g.line(x0, y0, x1, y1, '8');
      for (let t = 0; t <= 1; t += 0.1) pts.push([Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t)]);
      pts.forEach((p) => shadow(g, p[0], p[1] + 1, 0.65));
      g.line(x0, y0, x1, y1, '8');
      g.px(x0, y0, '9'); g.px(x0, y0 - 1, '7'); g.px(x1, y1, '9'); g.px(x1 + 1, y1, '7');
    };
    const skull = (x, y) => {
      for (let i = 0; i < 5; i++) shadow(g, x + i, y + 4, 0.6);
      g.rect(x, y, 5, 3, '8'); g.rect(x + 1, y - 1, 3, 1, '9'); g.px(x + 1, y, '9');
      g.px(x + 1, y + 1, '1'); g.px(x + 3, y + 1, '1'); g.px(x + 2, y + 2, '6');
      g.rect(x + 1, y + 3, 3, 1, '7'); g.px(x + 4, y + 2, '6'); g.px(x + 4, y, '7');
    };
    const rib = (x, y) => { for (let k = 0; k < 3; k++) { g.px(x + k * 2, y, '7'); g.px(x + k * 2, y + 1, '8'); g.px(x + k * 2 + 1, y + 2, '7'); shadow(g, x + k * 2 + 1, y + 3, 0.7); } };
    if (v === 0 || v === 4) { skull(3, 5); bone(9, 11, 13, 9); }
    else if (v === 1 || v === 5) { bone(2, 12, 7, 10); bone(8, 5, 12, 7); g.px(4, 5, '7'); g.px(12, 12, '8'); }
    else if (v === 2 || v === 6) { rib(4, 5); bone(3, 12, 9, 13); skull(10, 9); }
    else { bone(3, 4, 6, 9); rib(8, 10); g.px(12, 4, '8'); g.px(13, 4, '7'); g.px(2, 13, '7'); }
  }
  function drawRubble(g, c) {
    const P = th(c), F = P.stone.face;
    const n = 5 + ri(c, 0, 3);
    for (let k = 0; k < n; k++) {
      const x = ri(c, 1, 12), y = ri(c, 3, 13), w = 2 + ri(c, 0, 2), h = 1 + ri(c, 0, 1);
      for (let i = 0; i <= w; i++) shadow(g, x + i, y + h + 1, 0.65);
      shadow(g, x + w + 1, y + h, 0.75);
      g.rect(x, y, w + 1, h + 1, F[2]);
      g.rect(x, y, w, 1, F[3]); g.px(x, y + h, F[1]); g.px(x + w, y + h, F[1]); g.px(x + w, y, F[2]);
      if (k === 0) g.px(x, y, F[4]);
    }
    for (let k = 0; k < 8; k++) g.px(ri(c, 0, 15), ri(c, 2, 15), k & 1 ? F[3] : F[1]);
    if (P.moss && c.variant > 4) g.px(ri(c, 3, 12), ri(c, 4, 12), P.moss[1]);
  }

  // ================================================================ walls (3/4 view)
  function mkLay() {
    const a = new Array(S).fill(null);
    for (let k = 0; k < arguments.length; k++) {
      const sp = arguments[k];
      for (let j = sp[0]; j <= sp[1]; j++) a[j] = { k, r: j - sp[0], h: sp[1] - sp[0] + 1 };
    }
    return a;
  }
  const LAY = {
    block: mkLay([1, 3], [5, 7], [9, 11], [13, 15]),
    ashlar: mkLay([1, 4], [6, 9], [11, 15]),
    brick: mkLay([1, 2], [4, 5], [7, 8], [10, 11], [13, 14]),
  };
  function coursed(g, c, F, lay, widths, s, fine) {
    const X = c.x * S, Y = c.y * S, jointCol = fine ? F[1] : F[0];
    for (let j = 0; j < S; j++) {
      const L = lay[j];
      if (!L) { for (let i = 0; i < S; i++) g.px(i, j, jointCol); continue; }
      const bw = widths[U.hash2(L.k, c.y, s) % widths.length];
      const off = U.hash2(L.k + 7, c.y, s) % bw;
      for (let i = 0; i < S; i++) {
        const p = X + i + off, b = Math.floor(p / bw), rx = p - b * bw;
        if (rx === bw - 1) { g.px(i, j, jointCol); continue; }
        const tone = hf(b, L.k + c.y * 11, s + 1);
        let idx = tone < 0.25 ? 1 : tone > 0.8 ? 3 : 2;
        if (L.r === 0) idx++;
        else if (L.r === L.h - 1 && L.h > 2) idx--;
        if (rx === bw - 2 && L.r > 0) idx--;
        const gr = hf(X + i, Y + j, s + 2);
        if (gr < 0.07) idx--; else if (gr > 0.97) idx++;
        g.px(i, j, at(F, Math.min(idx, 3)));
      }
    }
  }
  function brickFace(g, c, M) {
    const X = c.x * S, Y = c.y * S, F = M.face, lay = LAY.brick;
    const cols = [F[1], F[2], F[3]];
    for (let j = 0; j < S; j++) {
      const L = lay[j];
      for (let i = 0; i < S; i++) {
        if (!L) { g.px(i, j, hf(X + i, Y + j, 161) < 0.12 ? F[1] : F[0]); continue; }
        const off = ((L.k + c.y) & 1) * 3, p = X + i + off, b = Math.floor(p / 6), rx = p - b * 6;
        if (rx === 5) { g.px(i, j, F[0]); continue; }
        const tone = hf(b, L.k + c.y * 11, 162);
        let col;
        if (tone < 0.1) col = M.alt;
        else { let k = tone < 0.4 ? 0 : tone < 0.82 ? 1 : 2; if (L.r === 0 && k < 2) k++; col = cols[k]; }
        if ((rx === 0 || rx === 4) && hf(X + i, Y + j, 163) < 0.18) col = F[0];
        else if (hf(X + i, Y + j, 164) < 0.06) col = dim(col, 0.82);
        g.px(i, j, col);
      }
    }
  }
  function woodFace(g, c, M) {
    const X = c.x * S, Y = c.y * S, F = M.face;
    for (let j = 0; j < S; j++) {
      if (j === 0) { for (let i = 0; i < S; i++) g.px(i, j, F[1]); continue; }
      const k = Math.floor((j - 1) / 3), r = (j - 1) % 3;
      const L = 14 + (U.hash2(k, c.y, 171) % 3) * 4, off = U.hash2(k + 3, c.y, 171) % L;
      for (let i = 0; i < S; i++) {
        const p = X + i + off, b = Math.floor(p / L), rx = p - b * L;
        let idx = r === 0 ? 3 : r === 1 ? 2 : 1;
        if (hf(b, k + c.y * 7, 172) < 0.3 && idx > 1) idx--;
        if (rx === L - 1) idx = 0;
        if (hf(p >> 1, k * 3 + r, 173) < 0.1) idx = Math.max(0, idx - 1);
        g.px(i, j, F[idx]);
        if (rx === L - 3 && r === 1) g.px(i, j, '#6b6361');
      }
    }
  }
  function rockFace(g, c, M) {
    const X = c.x * S, Y = c.y * S, F = M.face;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const wx = X + i, wy = Y + j;
      const strata = vn(wx * 0.45, wy * 1.6, 4, 181), strataUp = vn(wx * 0.45, (wy - 1) * 1.6, 4, 181);
      let idx = 1 + Math.round(strata * 2.1 + (hf(wx, wy, 182) - 0.5) * 0.7);
      if (strata - strataUp > 0.09) idx = 3;
      if (Math.abs(vn(wx * 2.2, wy * 0.35, 5, 183) - 0.5) < 0.035) idx = 0;
      g.px(i, j, at(F, idx));
    }
  }
  function plasterFace(g, c, M, P) {
    const X = c.x * S, Y = c.y * S, F = M.face, W = P.wood.face, v = c.variant;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const wx = X + i, wy = Y + j;
      let col;
      if (j <= 10) {
        let idx = 2 + (vn(wx, wy, 5, 191) > 0.62 ? 1 : 0) - (hf(wx, wy, 192) < 0.08 ? 1 : 0);
        // water stains running down from the top
        const sl = vn(wx, 0, 3, 193);
        if (sl > 0.66 && j < (sl - 0.6) * 30) idx--;
        col = at(F, idx);
      } else if (j === 11) col = W[3];
      else if (j === 15) col = W[0];
      else {
        const b = (wx >> 2);
        col = (wx & 3) === 3 ? W[0] : (wx & 3) === 0 ? W[3] : W[2];
        if (hf(b, 0, 194) < 0.3 && (wx & 3) !== 3) col = W[1];
        if (j === 12) col = mix(col, W[0], 0.4);
      }
      g.px(i, j, col);
    }
    if (v === 5) { const x = ri(c, 4, 11); for (let j = 2; j < 10; j++) g.px(x + ((j * 3) % 5 === 0 ? 1 : 0) + (j > 6 ? 1 : 0), j, F[0]); }
    if (v === 6) {
      // plaster fallen away, bricks beneath
      const cx = ri(c, 5, 10), cy = 5;
      for (let j = 2; j < 10; j++) for (let i = 1; i < 15; i++) {
        const d = ((i + 0.5 - cx) / 4) ** 2 + ((j + 0.5 - cy) / 3) ** 2;
        if (d > 1) continue;
        const B = P.brick.face, rowb = j % 3, bx = (i + (Math.floor(j / 3) & 1) * 2) % 4;
        g.px(i, j, d > 0.8 ? F[0] : rowb === 2 || bx === 3 ? B[0] : B[1 + ((i + j) & 1)]);
      }
    }
    if (v === 2) { const cx = ri(c, 4, 11); patch(g, cx, 7, 3, 2.5, [F[1], dim(F[1], 0.9)]); }
  }
  // per-theme weathering of a wall face
  function wallDress(g, c, P, M, mat) {
    const X = c.x * S, Y = c.y * S, F = M.face, t = c.theme;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const wx = X + i, wy = Y + j, o = g.get(i, j), joint = o === F[0];
      const h = hf(wx, wy, 201);
      if (t === 'hushwood' || (t === 'abbey' && mat !== 'wood')) {
        const mo = vn(wx, wy, 4, 202) + (1 - j / 15) * 0.12 - (t === 'abbey' ? 0.06 : 0);
        if (mo > 0.66 && h < 0.8) g.px(i, j, P.moss[mo > 0.74 ? 1 : 0]);
        else if (joint && h < 0.3) g.px(i, j, P.moss[0]);
        if (t === 'abbey') {
          if (vn(wx, 0, 2, 203) > 0.7 && j < 12 && !joint) g.px(i, j, dim(g.get(i, j), 0.8));
          else if (h > 0.975 && !joint) g.px(i, j, '#62868c');
        }
      } else if (t === 'village') {
        if (h < 0.02 && !joint) g.px(i, j, P.lichen[0]);
      } else if (t === 'greyharrow') {
        if (j > 10 && h < (j - 10) * 0.1) g.px(i, j, P.ground[h < 0.1 ? 1 : 2]);
      } else if (t === 'wickward') {
        const streak = vn(wx, 0, 2, 204);
        const p = (j / 15) * 0.5 + (streak > 0.6 ? 0.35 : 0);
        if (h < p) g.px(i, j, dim(o, 0.55));
        if (joint && h > 0.985) g.px(i, j, 'k');
      } else if (t === 'pyre') {
        if (joint && h < 0.16) g.px(i, j, P.ashc[0]);
        if (joint && h > 0.975) g.px(i, j, 'l');
      } else if (t === 'city') {
        if (joint && h < 0.1) g.px(i, j, P.speck[0]);
      } else if (t === 'cave') {
        if (h > 0.985) g.px(i, j, '#4a5a66');
      }
    }
  }
  function faceEdges(g, c, P, M) {
    const F = M.face, Tp = M.top;
    const up = c.tile(0, -1), l = c.tile(-1, 0), r = c.tile(1, 0);
    const oL = l !== null && !SIDE[l], oR = r !== null && !SIDE[r];
    if (oL) for (let j = 0; j < S; j++) { g.px(0, j, F[0]); g.px(1, j, mix(g.get(1, j), F[4], 0.3)); }
    if (oR) for (let j = 0; j < S; j++) { g.px(15, j, F[0]); g.px(14, j, dim(g.get(14, j), 0.8)); }
    if (up === 'roof') {
      for (let i = 0; i < S; i++) { g.px(i, 0, '#0b090c'); g.px(i, 1, dim(g.get(i, 1), 0.5)); g.px(i, 2, dim(g.get(i, 2), 0.72)); }
      return;
    }
    let lip = 0;
    if (up !== null && !BELOW[up]) {
      // free-standing wall: its top surface shows above the face
      for (let i = 0; i < S; i++) { g.px(i, 0, F[2]); g.px(i, 1, Tp[2]); g.px(i, 2, Tp[1]); }
      if (oL) { g.px(0, 0, F[1]); g.px(0, 1, F[2]); g.px(0, 2, F[2]); }
      if (oR) { g.px(15, 0, F[1]); g.px(15, 1, F[1]); g.px(15, 2, F[1]); }
      lip = 3;
    }
    if (M.style === 'rock') {
      const X = c.x * S;
      for (let i = 0; i < S; i++) {
        const drop = Math.round(vn(X + i, c.y, 3, 205) * 2.4);
        for (let j = lip; j < lip + drop; j++) g.px(i, j, Tp[1]);
        g.px(i, lip + drop, F[4]);
      }
      return;
    }
    for (let i = oL ? 1 : 0; i < (oR ? 15 : 16); i++) g.px(i, lip, F[4]);
    if (c.theme === 'village' || c.theme === 'pyre' || c.theme === 'wickward') {
      const X = c.x * S;
      for (let i = 0; i < S; i++) if (hf(X + i, c.y, 206) < 0.3) g.px(i, lip, c.theme === 'pyre' ? '#7b7474' : '#8a8484');
    }
    if (P.moss && (c.theme === 'hushwood' || c.theme === 'abbey')) {
      const X = c.x * S;
      for (let i = 0; i < S; i++) {
        const h = hf(X + i, c.y, 207);
        if (h < 0.35) { g.px(i, lip, P.moss[1]); if (h < 0.12) g.px(i, lip + 1, P.moss[0]); }
      }
    }
  }
  function paintFace(g, c, P, mat) {
    const M = P[mat];
    if (mat === 'brick') brickFace(g, c, M);
    else if (mat === 'wood') woodFace(g, c, M);
    else if (M.style === 'rock') rockFace(g, c, M);
    else if (M.style === 'plaster') plasterFace(g, c, M, P);
    else coursed(g, c, M.face, LAY[M.style] || LAY.block, M.style === 'ashlar' ? [10, 13, 15] : [5, 6, 8], 211, c.theme === 'city');
    wallDress(g, c, P, M, mat);
    for (let j = 7; j < S; j++) {
      const f = j === 15 ? 0.62 : 1 - (j - 6) * 0.03;
      for (let i = 0; i < S; i++) { const o = g.get(i, j); if (o) g.px(i, j, dim(o, f)); }
    }
    faceEdges(g, c, P, M);
  }
  function paintTop(g, c, P, mat) {
    const M = P[mat], Tp = M.top, F = M.face, X = c.x * S, Y = c.y * S;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const wx = X + i, wy = Y + j, n = vn(wx, wy, 4, 221);
      let idx = n < 0.36 ? 0 : n > 0.66 ? 2 : 1;
      if (hf(wx, wy, 222) < 0.05) idx = 0;
      if (mat === 'wood' && (wy & 3) === 3) idx = 0;
      else if (mat !== 'wood' && M.style !== 'rock' && ((wy & 7) === 7 || (((wx + ((wy >> 3) & 1) * 4) & 7) === 7)) && hf(wx, wy, 223) < 0.7) idx = Math.max(0, idx - 1);
      g.px(i, j, Tp[idx]);
    }
    const open = (dx, dy) => { const t = c.tile(dx, dy); return t !== null && !SIDE[t]; };
    const oL = open(-1, 0), oR = open(1, 0), oU = open(0, -1), oD = open(0, 1);
    const rim = F[2], rim2 = mix(Tp[2], F[1], 0.5);
    if (oU) for (let i = 0; i < S; i++) { g.px(i, 1, rim2); g.px(i, 0, rim); }
    if (oD) for (let i = 0; i < S; i++) { g.px(i, 14, rim2); g.px(i, 15, rim); }
    if (oL) for (let j = 0; j < S; j++) { if (!(oU && j === 0) && !(oD && j === 15)) g.px(1, j, rim2); g.px(0, j, rim); }
    if (oR) for (let j = 0; j < S; j++) { if (!(oU && j === 0) && !(oD && j === 15)) g.px(14, j, rim2); g.px(15, j, rim); }
    if (!oU && !oL && open(-1, -1)) g.px(0, 0, rim);
    if (!oU && !oR && open(1, -1)) g.px(15, 0, rim);
    if (!oD && !oL && open(-1, 1)) g.px(0, 15, rim);
    if (!oD && !oR && open(1, 1)) g.px(15, 15, rim);
    if (c.theme === 'pyre' || c.theme === 'village') {
      for (let k = 0; k < 3; k++) { const x = ri(c, 2, 13), y = ri(c, 2, 13); g.px(x, y, mix(Tp[2], '#8a8484', 0.35)); }
    }
  }
  function drawWallMat(g, c, mat) {
    const P = th(c);
    if (isFace(c)) paintFace(g, c, P, mat); else paintTop(g, c, P, mat);
  }
  function drawCracked(g, c) {
    const P = th(c), mat = matOf(c, 'wall_cracked'), M = P[mat], F = M.face;
    const face = isFace(c);
    if (face) paintFace(g, c, P, mat); else paintTop(g, c, P, mat);
    const r = U.rng(U.hash2(c.x, c.y, 231));
    const core = '#060407', lit = face ? F[4] : F[2];
    const pts = [];
    if (face) {
      // a stair-step fissure that follows the mortar: down a vertical joint, along a bed joint, down again
      const lay = mat === 'brick' ? LAY.brick : mat === 'wood' ? null : (LAY[M.style] || LAY.block);
      let x = 5 + Math.floor(r() * 5);
      for (let y = 1; y <= 14; y++) {
        const bed = lay ? !lay[y] : (y % 4 === 0);
        if (bed) {
          const step = (r() < 0.5 ? -1 : 1) * (2 + Math.floor(r() * 2));
          const nx = Math.max(3, Math.min(12, x + step));
          for (let xx = Math.min(x, nx); xx <= Math.max(x, nx); xx++) pts.push(xx, y);
          x = nx;
        } else {
          pts.push(x, y);
          if (r() < 0.25) pts.push(x + (r() < 0.5 ? -1 : 1), y);
        }
      }
      // the stones on the far side of the fissure have sagged: shade them
      for (let k = 0; k < pts.length; k += 2) for (let d = 1; d <= 3; d++) {
        const q = g.get(pts[k] + d, pts[k + 1]);
        if (q && q !== core && q !== F[0]) g.px(pts[k] + d, pts[k + 1], dim(q, d === 1 ? 0.62 : 0.84));
      }
    } else {
      let x = 4 + Math.floor(r() * 3);
      for (let y = 2; y <= 13; y++) { pts.push(x, y); if (r() < 0.5) { x += 1; pts.push(x, y); } }
    }
    for (let k = 0; k < pts.length; k += 2) g.px(pts[k], pts[k + 1], core);
    for (let k = 0; k < pts.length; k += 2) {
      const lx = pts[k] - 1, ly = pts[k + 1] - 1;
      if (g.get(lx, pts[k + 1]) !== core) g.px(lx, pts[k + 1], lit);
      if (face && g.get(pts[k], ly) !== core && hf(pts[k], ly, 232) < 0.5) g.px(pts[k], ly, mix(g.get(pts[k], ly) || F[2], lit, 0.5));
    }
    if (face) {
      // chips knocked out of the arrises, grit at the foot
      const k0 = (Math.floor(pts.length / 4) * 2) & ~1;
      g.px(pts[k0] + 1, pts[k0 + 1] - 1, core); g.px(pts[k0] + 2, pts[k0 + 1] - 1, F[0]);
      g.px(3, 15, F[3]); g.px(4, 15, F[2]); g.px(11, 15, F[3]); g.px(12, 14, F[2]); g.px(8, 15, F[2]);
    }
  }

  // ---------------------------------------------------------------- window & doorway
  const GLASS = ['#2e140c', '#4a2112', '#6a3316', '#8c4c1e', '#b86f2a'];
  function drawWindow(g, c) {
    const P = th(c), mat = matOf(c, 'window'), M = P[mat], F = M.face;
    paintFace(g, c, P, mat);
    const t = c.theme;
    const frame = mat === 'wood' ? '#1a120e' : '#140f10';
    const glow = (i, j, cx, cy, rx, ry) => {
      const d = Math.hypot((i + 0.5 - cx) / rx, (j + 0.5 - cy) / ry);
      return d < 0.55 ? GLASS[4] : d < 0.9 ? GLASS[3] : d < 1.3 ? GLASS[2] : GLASS[1];
    };
    if (t === 'abbey' || t === 'pyre') {
      // pointed lancet with leading
      for (let j = 2; j <= 12; j++) for (let i = 4; i <= 11; i++) {
        const w = j === 2 ? 0 : j === 3 ? 1 : j === 4 ? 2 : 3;
        if (i < 7.5 - w - 0.5 || i > 7.5 + w + 0.5) continue;
        const edge = i === Math.ceil(7.5 - w - 0.5) || i === Math.floor(7.5 + w + 0.5) || j === 2 || j === 12;
        g.px(i, j, edge ? frame : ((i + j) & 3) === 0 || ((i - j) & 3) === 0 ? '#1e0e0a' : glow(i, j, 7.5, 10, 3, 5));
      }
      for (let i = 3; i <= 12; i++) { g.px(i, 13, F[4]); g.px(i, 14, dim(g.get(i, 14), 0.6)); }
      g.px(7, 1, F[3]); g.px(8, 1, F[3]); g.px(6, 2, F[3]); g.px(9, 2, F[3]);
      return;
    }
    const x0 = 4, x1 = 11, y0 = t === 'city' ? 2 : 3, y1 = t === 'city' ? 12 : 11;
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
      const edge = i === x0 || i === x1 || j === y0 || j === y1;
      let col = edge ? frame : glow(i, j, 7.5, y1 - 1, 3, 4);
      if (!edge && (i === 7 || j === Math.floor((y0 + y1) / 2))) col = '#241008';
      if (t === 'wickward' && !edge) col = ((i * 7 + j * 3) % 5 === 0) ? '#0b0707' : mix(col, 'l', 0.5);
      g.px(i, j, col);
    }
    if (c.variant & 1 && t !== 'wickward') for (let j = y0 + 1; j < y1; j++) g.px(x1 - 1, j, '#2a1014');
    // lintel & sill
    const lint = mat === 'wood' ? P.wood.face[3] : F[3];
    for (let i = x0 - 1; i <= x1 + 1; i++) { g.px(i, y0 - 1, lint); g.px(i, y1 + 1, F[4]); g.px(i, y1 + 2, dim(g.get(i, y1 + 2), 0.6)); }
    if (t === 'city') {
      const Wd = P.wood.face;
      for (let j = y0; j <= y1; j++) { g.px(2, j, j & 1 ? Wd[1] : Wd[2]); g.px(3, j, Wd[1]); g.px(12, j, Wd[1]); g.px(13, j, j & 1 ? Wd[1] : Wd[2]); }
    }
    if (t === 'wickward') { g.px(x0 + 1, y0 + 1, '#070506'); g.px(x1 - 1, y1 - 1, '#070506'); g.px(x0 + 2, y0 + 1, '#070506'); }
  }
  function drawDoorway(g, c) {
    const P = th(c), mat = matOf(c, 'doorway'), M = P[mat], F = M.face;
    const below = c.tile(0, 1);
    const faceMode = below !== null && !BELOW[below] && !c.solid(0, 1);
    if (faceMode) {
      paintFace(g, c, P, mat);
      const x0 = 3, x1 = 12, top = mat === 'wood' ? 2 : 3;
      for (let j = top; j < S; j++) for (let i = x0; i <= x1; i++) {
        if (mat !== 'wood') { if (j === top && (i < x0 + 2 || i > x1 - 2)) continue; if (j === top + 1 && (i === x0 || i === x1)) continue; }
        const f = (j - top) / (S - top);
        g.px(i, j, f < 0.5 ? '#050406' : f < 0.8 ? '#0c0a0e' : '#15121a');
      }
      if (mat === 'wood') {
        const W = P.wood.face;
        for (let j = 0; j < S; j++) { g.px(1, j, W[3]); g.px(2, j, W[2]); g.px(13, j, W[2]); g.px(14, j, W[1]); }
        for (let i = 1; i <= 14; i++) { g.px(i, 0, W[4]); g.px(i, 1, W[2]); }
      } else {
        for (let j = top + 2; j < S; j++) { g.px(x0 - 1, j, ((j >> 2) & 1) ? F[3] : F[2]); g.px(x1 + 1, j, ((j >> 2) & 1) ? F[2] : F[1]); }
        g.px(x0 - 1, top + 1, F[3]); g.px(x0, top, F[3]); g.px(x0 + 1, top - 1, F[3]);
        g.px(x1 + 1, top + 1, F[2]); g.px(x1, top, F[3]); g.px(x1 - 1, top - 1, F[3]);
        for (let i = x0 + 2; i <= x1 - 2; i++) g.px(i, top - 1, F[4]);
        g.px(7, top - 2, F[4]); g.px(8, top - 2, F[3]);
      }
      for (let i = x0; i <= x1; i++) g.px(i, 15, mix('#15121a', F[2], 0.35));
      return;
    }
    // gap in a wall seen from above (exits through a bottom or side wall)
    paintTop(g, c, P, mat);
    const horiz = !!(SIDE[c.tile(-1, 0)] || SIDE[c.tile(1, 0)]) || !(SIDE[c.tile(0, -1)] || SIDE[c.tile(0, 1)]);
    const Pf = th(c);
    const tmp = new AV.Grid(S, S);
    drawFloor(tmp, c);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const u = horiz ? i : j, v = horiz ? j : i;
      if (u < 3 || u > 12) continue;
      let f;
      if (horiz) { const outDown = below === null || c.solid(0, 1); f = outDown ? v / 15 : 1 - v / 15; }
      else { const outRight = c.tile(1, 0) === null || c.solid(1, 0); f = outRight ? v / 15 : 1 - v / 15; }
      g.px(i, j, dim(tmp.get(i, j) || Pf.ground[2], 0.95 - f * 0.75));
    }
    const rim = F[2];
    for (let k = 0; k < S; k++) {
      if (horiz) { g.px(2, k, rim); g.px(13, k, dim(rim, 0.7)); g.px(3, k, dim(g.get(3, k), 0.7)); }
      else { g.px(k, 2, rim); g.px(k, 13, dim(rim, 0.7)); g.px(k, 3, dim(g.get(k, 3), 0.7)); }
    }
  }
  function drawBars(g, c) {
    const I = IRON;
    const cont = (dx) => { const t = c.tile(dx, 0); return t === null || t === 'gate_bars' || !!SIDE[t]; };
    const l = cont(-1), r = cont(1);
    const xa = l ? 0 : 1, xb = r ? 15 : 14;
    for (let i = xa; i <= xb; i++) { shadow(g, i, 15, 0.6); shadow(g, i, 14, 0.8); }
    for (let i = xa; i <= xb; i++) {
      g.px(i, 2, I[3]); g.px(i, 3, I[1]);
      g.px(i, 8, I[2]);
      g.px(i, 12, I[3]); g.px(i, 13, I[1]);
    }
    for (let b = 0; b < 5; b++) {
      const x = 1 + b * 3;
      for (let j = 1; j <= 14; j++) { g.px(x, j, I[1]); g.px(x + 1, j, j === 1 ? I[1] : I[3]); }
      g.px(x, 0, I[2]); g.px(x + 1, 0, I[4]);
      if (hf(c.x * 5 + b, c.y, 241) < 0.5) { g.px(x + 1, 6 + (b & 3), RUST[1]); g.px(x, 10, RUST[0]); }
      shadow(g, x + 2, 14, 0.6);
    }
    if (!l) for (let j = 0; j < S; j++) { g.px(0, j, I[1]); g.px(1, j, I[3]); }
    if (!r) for (let j = 0; j < S; j++) { g.px(15, j, I[0]); g.px(14, j, I[2]); }
  }

  // ---------------------------------------------------------------- roof
  function drawRoof(g, c) {
    const P = th(c), R = P.roof, X = c.x * S, Y = c.y * S, t = c.theme;
    const same = (dx, dy) => { const q = c.tile(dx, dy); return q === null || q === 'roof'; };
    const up = same(0, -1), dn = same(0, 1), lf = same(-1, 0), rt = same(1, 0);
    for (let j = 0; j < S; j++) {
      const wy = Y + j, course = wy >> 2, r = wy & 3;
      const sw = t === 'greyharrow' ? 4 : 5, off = (course & 1) * 2 + (U.hash2(course, 1, 251) % 2);
      for (let i = 0; i < S; i++) {
        const wx = X + i, p = wx + off, b = Math.floor(p / sw), rx = p - b * sw;
        const tone = hf(b, course, 252);
        let idx;
        if (r === 0) idx = 0;
        else if (rx === sw - 1) idx = 1;
        else { idx = tone < 0.25 ? 1 : tone > 0.8 ? 3 : 2; if (r === 3) idx++; }
        let col = at(R, idx);
        if (tone > 0.965 && r > 0) col = r === 3 ? R[1] : '#0c0b0e';                      // a slipped slate
        if (hf(wx, wy, 253) < 0.03 && r > 0) col = P.roofSpeck;                            // ash, lichen
        if ((t === 'hushwood' || t === 'abbey') && vn(wx, wy, 5, 254) > 0.64 && r > 0) col = P.moss[r === 3 ? 1 : 0];
        if (t === 'wickward' && vn(wx, wy, 6, 255) > 0.7) col = hf(wx, wy, 256) < 0.1 ? 'k' : '#080607';
        g.px(i, j, col);
      }
    }
    if (!up) {
      for (let i = 0; i < S; i++) {
        const cap = ((X + i) & 3) === 3;
        g.px(i, 0, '#0b0a0d'); g.px(i, 1, cap ? R[2] : R[4]); g.px(i, 2, cap ? R[1] : R[3]); g.px(i, 3, '#0b0a0d');
      }
    }
    if (!dn) {
      for (let i = 0; i < S; i++) { g.px(i, 13, R[4]); g.px(i, 14, R[1]); g.px(i, 15, '#0a090b'); }
    }
    if (!lf) for (let j = 0; j < S; j++) { g.px(0, j, '#0a090b'); g.px(1, j, j === 15 ? '#0a090b' : R[4]); }
    if (!rt) for (let j = 0; j < S; j++) { g.px(15, j, '#0a090b'); g.px(14, j, j === 15 ? '#0a090b' : R[1]); }
  }

  // ---------------------------------------------------------------- cliff
  function drawCliff(g, c) {
    const P = th(c), C = P.cliff, X = c.x * S, Y = c.y * S, t = c.theme;
    const isC = (q) => q === null || q === 'cliff';
    const face = !isC(c.tile(0, 1));
    const oL = !isC(c.tile(-1, 0)), oR = !isC(c.tile(1, 0));
    if (face) {
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
        const wx = X + i, wy = Y + j;
        const band = vn(wx * 0.4, wy * 1.5, 4, 261);
        let idx = 1 + Math.round(band * 2.2 + (hf(wx, wy, 262) - 0.5) * 0.8);
        if (Math.abs(vn(wx * 2, wy * 0.3, 5, 263) - 0.5) < 0.04) idx = 0;
        let col = at(C, idx);
        if (t !== 'cave' && hf(wx >> 1, wy >> 1, 264) < 0.05) col = P.rock[3];
        g.px(i, j, col);
      }
      // roots dangling from the lip (forest & field)
      if (t === 'hushwood' || t === 'greyharrow' || t === 'village' || t === 'abbey') {
        for (let i = 1; i < 15; i++) {
          if (hf(X + i, Y, 265) < 0.16) { const len = 2 + Math.floor(hf(X + i, Y, 266) * 6); for (let j = 2; j < 2 + len; j++) g.px(i + ((j >> 2) & 1), j, C[0]); }
        }
      }
      for (let j = 7; j < S; j++) { const f = j === 15 ? 0.6 : 1 - (j - 6) * 0.035; for (let i = 0; i < S; i++) g.px(i, j, dim(g.get(i, j), f)); }
      // lip: overhanging turf (or bare rock edge)
      const turf = t === 'cave' || t === 'pyre' || t === 'wickward' || t === 'interior' || t === 'city' ? null : P.grass;
      for (let i = 0; i < S; i++) {
        if (turf) {
          g.px(i, 0, turf[3]); g.px(i, 1, turf[2]);
          const h = hf(X + i, Y, 267);
          if (h < 0.45) g.px(i, 2, turf[1]);
          if (h < 0.15) g.px(i, 3, turf[0]);
        } else { g.px(i, 0, C[4]); g.px(i, 1, C[3]); }
      }
      if (oL) for (let j = 0; j < S; j++) { g.px(0, j, C[0]); g.px(1, j, dim(g.get(1, j), 0.85)); }
      if (oR) for (let j = 0; j < S; j++) { g.px(15, j, C[0]); g.px(14, j, dim(g.get(14, j), 0.75)); }
      return;
    }
    // cliff top: raised ground (rock tops in caves)
    if (t === 'cave' || t === 'pyre') {
      paintTop(g, c, P, 'stone');
    } else {
      const tmp = new AV.Grid(S, S);
      drawFloor(tmp, c);
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) g.px(i, j, dim(tmp.get(i, j), 0.82));
      if (oL) for (let j = 0; j < S; j++) { g.px(0, j, C[0]); g.px(1, j, C[3]); }
      if (oR) for (let j = 0; j < S; j++) { g.px(15, j, C[0]); g.px(14, j, C[2]); }
      if (!isC(c.tile(0, -1))) for (let i = 0; i < S; i++) g.px(i, 0, dim(g.get(i, 0), 0.8));
    }
  }

  // ================================================================ water family
  function drawWater(g, c) {
    const P = th(c), W = P.water, Lt = P.wlite, X = c.x * S, Y = c.y * S, f = c.frame;
    const isW = (q) => q === null || q === 'water';
    const land = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (!dx && !dy) continue;
      const q = c.tile(dx, dy);
      if (!isW(q)) land.push(dx, dy, q === 'shallow' ? 3 : 0);
    }
    const upLand = !isW(c.tile(0, -1)) && c.tile(0, -1) !== 'shallow';
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const cx = i + 0.5, cy = j + 0.5;
      let d = 99;
      for (let k = 0; k < land.length; k += 3) {
        const rx = land[k] * S, ry = land[k + 1] * S;
        const ex = Math.max(rx - cx, 0, cx - (rx + S)), ey = Math.max(ry - cy, 0, cy - (ry + S));
        const dd = Math.sqrt(ex * ex + ey * ey) + land[k + 2];
        if (dd < d) d = dd;
      }
      const wx = X + i, wy = Y + j;
      const dj = d + (hf(wx, wy, 271) - 0.5) * 3 + (vn(wx, wy, 7, 272) - 0.5) * 6;
      let col = dj < 3 ? W[4] : dj < 8 ? W[3] : dj < 15 ? W[2] : dj < 24 ? W[1] : W[0];
      if (d < 1.1) {
        // wet dark margin against the bank, with lapping foam that comes and goes
        col = mix(W[0], P.ground[0], 0.4);
        if (((wx * 3 + wy + f * 2) & 7) === 0 || hf(wx, wy, 275) < 0.1) col = Lt[0];
      } else if (d < 2.2 && ((wx + wy * 2 + f) & 3) === 0 && hf(wx, wy, 276) < 0.35) col = mix(W[4], Lt[0], 0.5);
      g.px(i, j, col);
      // ripples: pale dashes that swell and fade in place (seamless 4-frame loop)
      if ((wy & 3) === 0 && d > 2.5) {
        const u = wx + (wy >> 2) * 5, seg = Math.floor(u / 9), rx = u - seg * 9;
        if (hf(seg, wy, 273) < 0.2) {
          const ph = (f + (U.hash2(seg, wy, 274) & 3)) & 3, half = [-1, 1, 2, 1][ph];
          if (Math.abs(rx - 4) <= half) g.px(i, j, half === 2 && rx === 4 ? Lt[1] : mix(col, Lt[0], half === 2 ? 0.85 : 0.6));
        }
      }
    }
    if (upLand) {
      const G = P.ground;
      for (let i = 0; i < S; i++) {
        const wx = X + i;
        g.px(i, 0, G[1]); g.px(i, 1, G[0]); g.px(i, 2, W[0]);
        if (((wx + f) % 5) < 2) g.px(i, 3, Lt[0]);
      }
    }
  }
  function drawShallow(g, c) {
    const P = th(c), W = P.water, Lt = P.wlite, X = c.x * S, Y = c.y * S, f = c.frame;
    const wet = (q) => q === null || q === 'shallow' || q === 'water';
    const L = foreign(c, wet);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const o = g.get(i, j) || P.ground[2], wx = X + i, wy = Y + j;
      let col = mix(dim(o, 0.8), W[3], 0.5);
      const rip = Math.sin(wx * 0.55 + Math.sin(wy * 0.7) * 1.4 + f * PI / 2 + wy * 0.9);
      if (rip > 0.9 && hf(wx >> 1, wy, 281) < 0.55) col = mix(col, Lt[0], 0.55);
      if (L.length) {
        const d = edist(L, i, j);
        if (d < 1) col = ((wx * 3 + wy + f * 2) & 7) === 0 ? mix(col, Lt[1], 0.6) : mix(col, P.ground[1], 0.35);
        else if (d < 2) col = mix(col, Lt[0], 0.12);
      }
      g.px(i, j, col);
    }
    const tw = (x, y) => { const ph = (f + (x & 3)) & 3; if (ph === 1) g.px(x, y, Lt[1]); else if (ph === 2) { g.px(x - 1, y, Lt[0]); g.px(x + 1, y, Lt[0]); } };
    tw(3 + (c.variant % 3) * 4, 5 + (c.variant >> 1));
    if (c.variant & 1) tw(10, 11);
  }
  function drawVoid(g, c) {
    const P = th(c), G = P.ground, X = c.x * S;
    const isV = (q) => q === null || q === 'void';
    g.rect(0, 0, S, S, '0');
    for (let k = 0; k < 3; k++) { const x = ri(c, 2, 13), y = ri(c, 6, 13); g.px(x, y, '#120e16'); }
    if (!isV(c.tile(0, -1))) {
      const rows = [G[3], G[1], G[0], '#161218', '#0e0b10', '#09070a', '#050406'];
      for (let j = 0; j < rows.length; j++) for (let i = 0; i < S; i++) {
        const col = rows[j];
        g.px(i, j, j > 0 && j < 5 && hf(X + i, j, 291) < 0.25 ? dim(col, 0.7) : col);
      }
    }
    if (!isV(c.tile(-1, 0))) for (let j = 0; j < S; j++) { g.px(0, j, G[1]); g.px(1, j, '#120e14'); }
    if (!isV(c.tile(1, 0))) for (let j = 0; j < S; j++) { g.px(15, j, G[1]); g.px(14, j, '#120e14'); }
    if (!isV(c.tile(0, 1))) for (let i = 0; i < S; i++) { g.px(i, 15, G[3]); g.px(i, 14, G[0]); }
  }
  function drawEmbers(g, c) {
    const P = th(c), Bn = P.burnt, X = c.x * S, Y = c.y * S, f = c.frame;
    const hot = ['k', 'l', 'm', 'n', 'o'];
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const wx = X + i, wy = Y + j;
      const n = vn(wx, wy, 5, 301), m2 = vn(wx, wy, 3, 302);
      let col = at(Bn, Math.round(1.6 + (m2 - 0.5) * 2 + (hf(wx, wy, 303) - 0.5)));
      const ridge = Math.abs(n - 0.5);
      const pulse = Math.sin(f * PI / 2 + vn(wx, wy, 9, 304) * 7) * 0.5 + 0.5;
      if (ridge < 0.03) col = hot[2 + Math.round(pulse * 2)];
      else if (ridge < 0.06) col = hot[Math.round(pulse * 1.4)];
      else if (ridge < 0.085 && pulse > 0.6) col = 'k';
      if (hf(wx, wy, 305) < 0.015) col = hot[(f + (wx & 3)) & 3];
      g.px(i, j, col);
    }
    // small tongues of flame that rise and vanish
    const r = U.rng(U.hash2(c.x, c.y, 306));
    for (let k = 0; k < 3; k++) {
      const x = 2 + Math.floor(r() * 12), y = 6 + Math.floor(r() * 9), ph = (f + k) & 3;
      if (ph === 0) continue;
      const h = ph === 2 ? 3 : ph === 1 ? 2 : 1;
      for (let t = 0; t < h; t++) g.px(x + (t === h - 1 && ph === 3 ? 1 : 0), y - t, t === 0 ? 'p' : t === h - 1 ? 'm' : 'o');
    }
  }

  // ================================================================ light-giving decor
  const CANDLE_SETS = [
    [[3, 12, 6], [7, 13, 4], [10, 11, 7]],
    [[4, 11, 5], [9, 12, 8], [12, 14, 3]],
    [[3, 13, 4], [6, 11, 7], [10, 12, 5], [12, 14, 3]],
    [[5, 12, 8], [9, 14, 4], [11, 11, 5]],
    [[2, 13, 3], [5, 12, 6], [9, 13, 5], [12, 11, 7]],
    [[4, 13, 7], [8, 11, 5], [11, 13, 3]],
    [[6, 12, 9], [3, 14, 3], [10, 13, 5]],
    [[3, 11, 5], [7, 14, 6], [11, 12, 4], [8, 10, 3]],
  ];
  const FLAMES = [
    ['.n.', '.o.', 'opo', '.q.'],
    ['..n', '.o.', '.po', '.q.'],
    ['n..', '.o.', 'op.', '.q.'],
  ];
  function drawCandles(g, c) {
    const set = CANDLE_SETS[c.variant].slice().sort((a, b) => a[1] - b[1]);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      let d = 99;
      for (const s of set) d = Math.min(d, Math.hypot(i - s[0], (j - (s[1] - s[2])) * 0.8));
      if (d < 7) tint(g, i, j, 'n', 0.16 * (1 - d / 7));
    }
    set.forEach((s, k) => {
      const x = s[0], by = s[1], h = s[2], top = by - h + 1;
      // wax pool
      g.px(x - 1, by + 1, '7'); g.px(x, by + 1, '8'); g.px(x + 1, by + 1, '8'); g.px(x + 2, by + 1, '6');
      shadow(g, x + 2, by, 0.6); shadow(g, x + 3, by + 1, 0.7);
      for (let y = top; y <= by; y++) { g.px(x, y, '9'); g.px(x + 1, y, y === by ? '6' : '8'); }
      g.px(x, top, 'g'); g.px(x + 1, top, '9');
      if (h > 4) { g.px(x - 1, top + 2, '8'); g.px(x - 1, top + 3, '7'); }
      if (h > 6) g.px(x + 2, top + 4, '7');
      g.px(x, top - 1, '1');
      const fl = FLAMES[(c.frame + k) % 3];
      for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) {
        const ch = fl[r][q];
        if (ch !== '.') g.px(x - 1 + q, top - 5 + r, ch);
      }
    });
  }
  function drawBrazier(g, c) {
    const f = c.frame, I = IRON;
    for (let i = 2; i <= 14; i++) for (let j = 13; j <= 15; j++) {
      const d = ((i + 0.5 - 8) / 6) ** 2 + ((j + 0.5 - 14.5) / 1.6) ** 2;
      if (d < 1) shadow(g, i, j, 0.55);
    }
    // legs
    g.line(5, 10, 3, 15, I[1]); g.line(4, 10, 2, 15, I[3]);
    g.line(10, 10, 12, 15, I[1]); g.line(11, 10, 13, 15, I[0]);
    g.line(8, 11, 8, 14, I[0]);
    g.px(2, 15, I[2]); g.px(13, 15, I[1]);
    // bowl
    const rows = [[2, 13], [3, 12], [4, 11], [5, 10]];
    rows.forEach((rw, k) => {
      for (let x = rw[0]; x <= rw[1]; x++) {
        let col = k === 0 ? I[4] : x - rw[0] < 2 ? I[3] : rw[1] - x < 2 ? I[0] : I[1];
        if (k === 1 && (x === 4 || x === 11)) col = 'J';
        g.px(x, 7 + k, col);
      }
    });
    g.px(2, 7, I[3]); g.px(13, 7, I[2]);
    // coals
    for (let x = 4; x <= 11; x++) g.px(x, 6, ((x + f) % 3) === 0 ? 'n' : ((x + f) & 1) ? 'l' : 'm');
    g.px(3, 6, 'k'); g.px(12, 6, 'k');
    // flame body
    const wob = [[0, 1, 0, -1], [1, 0, -1, 0], [0, -1, 0, 1], [-1, 0, 1, 0]];
    for (let x = 4; x <= 11; x++) {
      const h = Math.max(1, Math.round(6.2 - Math.abs(x - 7.5) * 1.15 + wob[f][x & 3] * 0.9));
      for (let t = 0; t < h; t++) {
        const y = 5 - t, rel = t / h;
        let col = rel > 0.78 ? 'm' : rel > 0.55 ? 'n' : rel > 0.3 ? 'o' : 'p';
        if (x >= 6 && x <= 9 && rel < 0.35) col = 'q';
        if (x === 4 || x === 11) col = rel > 0.5 ? 'l' : 'm';
        g.px(x + (t > 3 ? wob[(f + 1) & 3][x & 3] : 0), y, col);
      }
    }
    const sp = [[6, 0], [10, 1], [5, 1], [9, 0]];
    g.px(sp[f][0], sp[f][1] - (f & 1), 'p'); g.px(sp[(f + 2) & 3][0] + 1, 0, 'n');
  }

  // ================================================================ solid decor (16×16)
  function drawFence(g, c) {
    const P = th(c), W = P.fence;
    const is = (dx, dy) => c.tile(dx, dy) === 'fence';
    const l = is(-1, 0), r = is(1, 0), u = is(0, -1), d = is(0, 1);
    const broken = c.theme === 'greyharrow' && c.variant === 3;
    const horiz = l || r || !(u || d);
    if (horiz) {
      const xa = l ? 0 : 6, xb = r ? 15 : 9;
      for (const ry of [6, 10]) {
        if (broken && ry === 6) continue;
        for (let x = xa; x <= xb; x++) { g.px(x, ry, W[3]); g.px(x, ry + 1, W[1]); shadow(g, x, ry + 3, 0.72); }
      }
    }
    if (u || d) {
      const ya = u ? 0 : 4, yb = d ? 15 : 12;
      for (let y = ya; y <= yb; y++) { g.px(7, y, W[3]); g.px(8, y, W[1]); shadow(g, 9, y, 0.72); }
    }
    // post
    for (let y = 3; y <= 14; y++) { g.px(6, y, W[3]); g.px(7, y, W[2]); g.px(8, y, W[1]); }
    g.px(6, 2, W[4]); g.px(7, 2, W[3]); g.px(8, 2, W[2]);
    g.px(7, 4, W[0]); g.px(6, 9, W[2]);
    for (let x = 6; x <= 9; x++) shadow(g, x + 1, 15, 0.6);
  }
  function drawRailing(g, c) {
    const I = IRON;
    const is = (dx, dy) => c.tile(dx, dy) === 'railing';
    const l = is(-1, 0), r = is(1, 0), u = is(0, -1), d = is(0, 1);
    const horiz = l || r || !(u || d);
    if (horiz) {
      const xa = l ? 0 : 3, xb = r ? 15 : 12;
      for (let x = xa; x <= xb; x++) { g.px(x, 4, I[3]); g.px(x, 12, I[2]); shadow(g, x, 15, 0.7); }
      for (let x = xa; x <= xb; x++) {
        if (((c.x * S + x) % 3) !== 0) continue;
        for (let y = 3; y <= 13; y++) g.px(x, y, y === 3 ? I[3] : I[1]);
        g.px(x, 2, I[4]); g.px(x, 1, I[2]);
        shadow(g, x + 1, 14, 0.6);
      }
    }
    if (u || d) {
      const ya = u ? 0 : 3, yb = d ? 15 : 13;
      for (let y = ya; y <= yb; y++) { g.px(6, y, I[3]); g.px(9, y, I[2]); shadow(g, 10, y, 0.7); if (((c.y * S + y) % 3) === 0) { g.px(7, y, I[1]); g.px(8, y, I[1]); } }
    }
    // post with a finial
    for (let y = 2; y <= 14; y++) { g.px(7, y, I[3]); g.px(8, y, I[1]); }
    g.px(7, 1, I[4]); g.px(8, 1, I[2]); g.px(7, 0, I[3]);
    shadow(g, 9, 15, 0.6);
  }
  function drawPalisade(g, c) {
    const P = th(c), W = P.fence;
    const is = (dx, dy) => c.tile(dx, dy) === 'palisade';
    const l = is(-1, 0), r = is(1, 0), u = is(0, -1), d = is(0, 1);
    const stake = (x0, w, topY, splintered) => {
      for (let y = topY; y <= 15; y++) for (let x = x0; x < x0 + w; x++) {
        const k = x - x0;
        let col = k === 0 ? W[3] : k === w - 1 ? W[0] : k === 1 ? W[2] : W[1];
        if (hf(x + c.x * S, y, 311) < 0.1) col = W[0];
        g.px(x, y, col);
      }
      if (splintered) {
        for (let x = x0; x < x0 + w; x++) g.px(x, topY - ((x - x0) & 1), (x - x0) & 1 ? '#8a7a66' : W[4]);
      } else {
        const mid = x0 + (w >> 1);
        for (let t = 1; t <= 3; t++) for (let x = x0 + t - 1; x <= x0 + w - t; x++) g.px(x, topY - t, x < mid ? W[3] : W[1]);
        g.px(mid - (w & 1 ? 0 : 1), topY - 4, W[4]);
      }
      g.px(x0, 10, '#1a120e'); g.px(x0 + w - 1, 10, '#1a120e');
    };
    if ((u || d) && !(l || r)) {
      for (let y = 0; y < S; y++) shadow(g, 11, y, 0.7);
      stake(5, 6, 5, c.theme === 'greyharrow' && c.variant === 2);
      return;
    }
    for (let x = 0; x < S; x++) { shadow(g, x, 15, 0.6); }
    const tops = [4, 5, 3, 6];
    for (let k = 0; k < 3; k++) {
      const x0 = 1 + k * 5;
      const sp = (c.theme === 'greyharrow' || c.theme === 'wickward') && ((c.variant + k) % 5 === 0);
      stake(x0, 5, tops[(c.variant + k) & 3] + (sp ? 4 : 0), sp);
    }
    for (let x = l ? 0 : 1; x <= (r ? 15 : 15); x++) { g.px(x, 9, '#2a1d15'); g.px(x, 10, '#1a120e'); }
  }
  function headstone(g, c, P) {
    const H = P.hs, v = c.variant;
    const m = new AV.Grid(S, S);
    const K = '#010101';
    let x0 = 4, x1 = 11, y0 = 3, y1 = 11;
    if (v === 0 || v === 1 || v === 7) { m.rect(x0, y0 + 2, x1 - x0 + 1, y1 - y0 - 1, K); m.rect(x0 + 1, y0 + 1, x1 - x0 - 1, 1, K); m.rect(x0 + 2, y0, x1 - x0 - 3, 1, K); }
    else if (v === 2) { m.rect(x0, y0 + 3, 8, 6, K); for (let t = 0; t < 4; t++) m.rect(x0 + t, y0 + 3 - t, 8 - t * 2, 1, K); }
    else if (v === 3) { m.rect(6, 2, 4, 10, K); m.rect(3, 4, 10, 3, K); }
    else if (v === 4) { m.rect(x0, y0 + 4, 8, 5, K); m.px(x0, y0 + 3, K); m.px(x0 + 1, y0 + 2, K); m.px(x0 + 2, y0 + 3, K); m.px(x0 + 4, y0 + 3, K); m.px(x0 + 5, y0 + 2, K); m.px(x0 + 6, y0 + 3, K); m.px(x0 + 7, y0 + 3, K); }
    else if (v === 5) { for (let j = 0; j < 9; j++) m.rect(x0 + Math.floor(j / 3), y0 + 1 + j, 7, 1, K); }
    else { m.rect(3, y0 + 2, 10, 7, K); m.rect(4, y0 + 1, 8, 1, K); }
    // shade from a mask: lit top-left, dark right & bottom, outline
    const src = m.d.slice(), inM = (x, y) => x >= 0 && y >= 0 && x < S && y < S && src[y * S + x] === K;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      if (!inM(x, y)) continue;
      let col = H[2];
      if (!inM(x, y - 1)) col = H[4];
      else if (!inM(x - 1, y)) col = H[3];
      else if (!inM(x + 1, y) || !inM(x + 1, y - 1)) col = H[1];
      if (hf(x + c.x * 9, y + c.y * 9, 321) < 0.08) col = H[1];
      m.px(x, y, col);
    }
    // engraving
    if (v !== 3 && v !== 4) { m.px(6, 6, H[1]); m.px(7, 6, H[1]); m.px(8, 6, H[1]); m.px(9, 6, H[1]); m.px(7, 8, H[1]); m.px(8, 8, H[1]); }
    if (v === 3) { m.px(7, 5, H[1]); m.px(8, 5, H[1]); }
    if (v === 6) { m.px(7, 5, 'n'); m.px(7, 6, H[1]); m.px(6, 7, H[1]); m.px(8, 7, H[1]); }
    m.outline(H[0]);
    // moss / ash on the head
    if (P.moss) for (let x = 0; x < S; x++) for (let y = 0; y < S; y++) if (inM(x, y) && !inM(x, y - 1) && hf(x, y + c.x, 322) < 0.5) m.px(x, y, P.moss[1]);
    if (c.theme === 'village' || c.theme === 'pyre' || c.theme === 'wickward' || c.theme === 'greyharrow')
      for (let x = 0; x < S; x++) for (let y = 0; y < S; y++) if (inM(x, y) && !inM(x, y - 1) && hf(x, y + c.y, 323) < 0.35) m.px(x, y, '#8a8484');
    return m;
  }
  function drawGrave(g, c) {
    const P = th(c), G = P.ground;
    // settled earth mound in front of the stone
    for (let j = 10; j < S; j++) for (let i = 1; i < 15; i++) {
      const d = ((i + 0.5 - 8) / 6) ** 2 + ((j + 0.5 - 12.5) / 3) ** 2;
      if (d < 1) g.px(i, j, d > 0.7 ? at(P.path, 1) : hf(i + c.x * S, j, 331) < 0.2 ? at(P.path, 3) : at(P.path, 2));
      else if (d < 1.4 && j > 12) shadow(g, i, j, 0.8);
    }
    const m = headstone(g, c, P);
    for (let i = 3; i < 14; i++) shadow(g, i, 12, 0.6);
    g.blit(m, c.variant === 5 ? 1 : 0, 0);
    if (G && c.variant === 7) { g.px(7, 1, 'e'); g.px(8, 1, 'd'); g.px(9, 1, 'd'); g.px(8, 0, 'e'); g.px(9, 0, '0'); g.px(10, 1, 'f'); }
  }
  function drawMarker(g, c) {
    const P = th(c), W = c.theme === 'wickward' || c.theme === 'pyre' ? P.fence : ['#1f1814', '#382b23', '#4c3b2f', '#5f4b3d', '#75604e'];
    const v = c.variant;
    // mound
    for (let j = 11; j < S; j++) for (let i = 2; i < 14; i++) {
      const d = ((i + 0.5 - 8) / 5.5) ** 2 + ((j + 0.5 - 13) / 2.4) ** 2;
      if (d < 1) g.px(i, j, d > 0.65 ? at(P.path, 1) : at(P.path, 2 + (hf(i, j + c.x, 341) < 0.25 ? 1 : 0)));
    }
    const lean = v === 4 ? 1 : 0;
    const post = (y) => 7 + (lean && y < 6 ? 1 : 0);
    // shadow cast down-right onto the mound
    for (let y = 5; y <= 14; y++) { shadow(g, 9, y, 0.7); shadow(g, 10, y, 0.85); }
    for (let x = 5; x <= 12; x++) shadow(g, x + 1, 7, 0.8);
    // post (2 px, lit left)
    for (let y = 3; y <= 14; y++) { const x = post(y); g.px(x - 1, y, W[0]); g.px(x, y, W[3]); g.px(x + 1, y, W[2]); g.px(x + 2, y, W[0]); }
    g.px(post(2), 2, W[4]); g.px(post(2) + 1, 2, W[3]); g.px(post(2) - 1, 2, W[0]); g.px(post(2) + 2, 2, W[0]);
    // crossbar, lashed
    const cy = 5;
    for (let x = 3; x <= 12; x++) { const yy = cy + (lean && x > 8 ? -1 : 0); g.px(x, yy - 1, W[0]); g.px(x, yy, W[4]); g.px(x, yy + 1, W[2]); g.px(x, yy + 2, W[0]); }
    g.px(2, cy, W[0]); g.px(2, cy + 1, W[0]); g.px(13, cy - (lean ? 1 : 0), W[0]); g.px(13, cy + 1 - (lean ? 1 : 0), W[0]);
    g.px(7, cy, '#2a201a'); g.px(8, cy + 1, '#2a201a'); g.px(7, cy + 1, W[1]);
    // a strip of cloth on some
    if (v === 2 || v === 6) { g.px(11, cy + 2, 'H'); g.px(11, cy + 3, 'G'); g.px(12, cy + 4, 'H'); g.px(11, cy + 4, 'F'); }
    // the carved bird on the nameless ones: a lumpy little turnip of a thing
    if (v === 0 || v === 3 || v === 5) {
      const Bd = ['#3e3128', '#6b5846', '#8c775f', '#a8927a'];
      const onArm = v === 5;
      const bx = onArm ? 8 : post(0) - 2, by = onArm ? cy - 3 : 0;
      g.px(bx + 3, by, Bd[3]); g.px(bx + 4, by, '0');
      g.px(bx, by + 1, Bd[1]); g.px(bx + 1, by + 1, Bd[3]); g.px(bx + 2, by + 1, Bd[2]); g.px(bx + 3, by + 1, Bd[2]); g.px(bx + 4, by + 1, Bd[2]); g.px(bx + 5, by + 1, Bd[0]);
      g.px(bx + 1, by + 2, Bd[0]); g.px(bx + 2, by + 2, Bd[0]); g.px(bx + 3, by + 2, Bd[0]);
    }
  }
  function drawRock(g, c) {
    const P = th(c), R = P.rock, v = c.variant;
    const shapes = v < 5 ? [[7.5 + (v & 1), 8.5, 6.6 + (v % 3) * 0.4, 5.6]] : v === 7 ? [[8, 10, 7.2, 4]] : [[6, 9, 5.2, 4.8], [11.8, 11.5, 3.4, 3]];
    const r = U.rng(U.hash2(c.x, c.y, 351));
    shapes.forEach((sh, n) => {
      const cx = sh[0], cy = sh[1], rx = sh[2], ry = sh[3], ph = r() * 6, ph2 = r() * 6;
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
        const dx = (i + 0.5 - (cx + 1)) / rx, dy = (j + 0.5 - (cy + ry * 0.6)) / (ry * 0.55);
        if (dx * dx + dy * dy < 1) shadow(g, i, j, 0.6);
      }
      const rr = (a) => 1 + 0.12 * Math.sin(a * 3 + ph) + 0.08 * Math.sin(a * 5 + ph2);
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
        const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry, a = Math.atan2(dy, dx), d = Math.sqrt(dx * dx + dy * dy) / rr(a);
        if (d > 1.12) continue;
        if (d > 1) { if (dy > -0.3) g.px(i, j, R[0]); continue; }
        const light = -dx * 0.55 - dy * 0.9;
        let idx = Math.round(2 + light * 1.3 + (hf(i + c.x * S, j + c.y * S, 352) - 0.5) * 0.8);
        if (d > 0.85 && dy > 0) idx--;
        let col = at(R, idx);
        if (dy < -0.25 && P.moss && vn(i + c.x * S, j, 3, 353) > 0.5) col = P.moss[idx > 2 ? 2 : 1];
        if (dy < -0.4 && (c.theme === 'village' || c.theme === 'pyre' || c.theme === 'wickward') && hf(i, j + c.x, 354) < 0.4) col = '#7b7575';
        g.px(i, j, col);
      }
      if (n === 0) {
        const x = Math.round(cx) + 1;
        g.px(x, Math.round(cy) - 1, R[0]); g.px(x + 1, Math.round(cy), R[0]); g.px(x + 1, Math.round(cy) + 1, R[1]); g.px(x, Math.round(cy) - 2, R[4]);
      }
    });
  }
  function drawShrub(g, c) {
    const P = th(c), t = c.theme, r = U.rng(U.hash2(c.x, c.y, 361));
    for (let i = 2; i < 15; i++) for (let j = 12; j < S; j++) {
      const d = ((i + 0.5 - 8.5) / 6) ** 2 + ((j + 0.5 - 14) / 2) ** 2;
      if (d < 1) shadow(g, i, j, 0.62);
    }
    if (t === 'abbey' || t === 'hushwood' && c.variant > 4) {
      // dense dark bush (yew / box)
      const Cn = t === 'abbey' ? P.canopy : P.grass;
      blob(g, r, 8, 9, 6, Cn, 0.05);
      blob(g, r, 5.5, 10.5, 3.5, Cn, 0.1);
      blob(g, r, 11, 10, 3.5, Cn, 0.1);
      if (t === 'abbey' && c.variant & 1) { g.px(6, 7, 'H'); g.px(10, 9, 'I'); }
      return;
    }
    if (t === 'hushwood') {
      // a fern clump
      const B = P.blade;
      for (let k = 0; k < 7; k++) {
        const a = -PI / 2 + (k - 3) * 0.42 + (r() - 0.5) * 0.2, len = 6 + r() * 3;
        let x = 8, y = 14;
        for (let s = 0; s < len; s++) {
          x += Math.cos(a) * 1; y += Math.sin(a) * 1 + s * 0.09;
          g.px(Math.round(x), Math.round(y), s > len - 2 ? B[2] : B[1]);
          if (s > 1 && s & 1) { g.px(Math.round(x) - 1, Math.round(y) + 1, B[0]); g.px(Math.round(x) + 1, Math.round(y) + 1, B[2]); }
        }
      }
      return;
    }
    if (t === 'cave') {
      // pale cave fungus with a faint cold sheen
      const caps = [[5, 10, 2], [9, 8, 3], [12, 11, 2], [7, 12, 1]];
      caps.forEach((cp) => {
        const [x, y, w] = cp;
        for (let k = y + 1; k <= 14; k++) { g.px(x, k, '7'); g.px(x + 1, k, '6'); }
        for (let i = x - w; i <= x + w + 1; i++) { g.px(i, y, i === x - w ? '6' : '8'); g.px(i, y - 1, i > x - w && i < x + w + 1 ? '9' : '8'); }
        g.px(x - w, y + 1, 'w'); g.px(x + w + 1, y + 1, 'v'); g.px(x, y - 2, 'x');
      });
      return;
    }
    if (t === 'city') {
      // a dead clipped topiary ball in a stone pot
      const F = P.stone.face;
      g.rect(5, 12, 7, 3, F[2]); g.rect(5, 12, 7, 1, F[4]); g.rect(4, 11, 9, 1, F[3]); g.px(11, 13, F[1]); g.px(11, 14, F[1]);
      blob(g, r, 8.5, 6.5, 5, ['#221c18', '#302620', '#3f3229', '#4f4034', '#5f4e40'], 0.08);
      g.px(8, 11, '#2a201a'); g.px(9, 11, '#2a201a');
      return;
    }
    if (t === 'interior') {
      g.rect(5, 11, 6, 4, '#4a3024'); g.rect(5, 11, 6, 1, '#6a4a36'); g.rect(4, 10, 8, 1, '#7a5a42'); g.px(10, 12, '#35221a'); g.px(10, 13, '#35221a');
      g.rect(5, 10, 6, 1, '#1a1210');
      for (let k = 0; k < 6; k++) g.line(8, 10, 3 + k * 2, 2 + (k & 1) * 2, k & 1 ? '#5a4a3a' : '#3f3228');
      g.px(4, 3, '#6b5845'); g.px(12, 4, '#6b5845');
      return;
    }
    // dead thorny scrub (village, greyharrow, wickward, pyre): a dark tangled core, paler outer twigs
    const col = t === 'wickward' || t === 'pyre' ? ['#0c0909', '#221b1a', '#3a302e', '#4d4240'] : t === 'greyharrow' ? ['#1e1714', '#3a2e24', '#554434', '#6a5644'] : ['#1f1a19', '#3b322f', '#574b46', '#6e625b'];
    blob(g, r, 8.5, 10, 4.2, [col[0], col[0], col[1], col[1], col[2]], 0.35);
    const branch = (x, y, a, len, depth) => {
      const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len;
      g.line(x, y, x1, y1, depth > 2 ? col[1] : depth > 1 ? col[2] : col[3]);
      if (depth > 1) for (let k = 0; k < 2; k++) branch(x1, y1, a + (k ? 0.55 : -0.55) + (r() - 0.5) * 0.4, len * 0.62, depth - 1);
      else if (r() < 0.6) g.px(Math.round(x1) + (r() < 0.5 ? 1 : -1), Math.round(y1), col[3]);
    };
    for (let k = 0; k < 6; k++) branch(8.5 + (k - 2.5) * 0.7, 13.5, -PI / 2 + (k - 2.5) * 0.4 + (r() - 0.5) * 0.3, 4 + r() * 2.5, 3);
    g.rect(7, 12, 4, 3, col[0]); g.px(8, 11, col[1]); g.px(7, 12, col[1]);
    if (t !== 'wickward' && t !== 'pyre') for (let k = 0; k < 5; k++) {
      const x = 3 + Math.floor(r() * 11), y = 3 + Math.floor(r() * 8);
      if (g.get(x, y) === col[2] || g.get(x, y) === col[3]) g.px(x + 1, y, P.leaf[1 + (k % 3)]);
    }
    if (t === 'village' || t === 'pyre' || t === 'wickward') for (let k = 0; k < 4; k++) { const x = 3 + Math.floor(r() * 10), y = 3 + Math.floor(r() * 7); if (g.get(x, y) === col[1] || g.get(x, y) === col[2]) g.px(x, y - 1, '#7b7575'); }
    if (t === 'wickward' && c.variant & 1) g.px(8, 11, 'l');
    if (t === 'village' && c.variant === 2) { g.px(5, 6, '#6a2a2a'); g.px(11, 5, '#6a2a2a'); }
  }
  function drawPew(g, c) {
    const W = ['#170f0c', '#2a1c16', '#3a281e', '#4c3527', '#5e4432'];
    const l = c.tile(-1, 0) === 'pew', r = c.tile(1, 0) === 'pew';
    const xa = l ? 0 : 1, xb = r ? 15 : 14;
    for (let x = xa; x <= xb; x++) { shadow(g, x, 15, 0.55); shadow(g, x, 3, 0.8); }
    for (let x = xa; x <= xb; x++) {
      g.px(x, 4, W[4]); g.px(x, 5, W[3]); g.px(x, 6, W[2]);
      g.px(x, 7, W[1]);
      g.px(x, 8, W[4]); g.px(x, 9, W[3]);
      for (let y = 10; y <= 13; y++) g.px(x, y, y === 11 ? W[3] : ((c.x * S + x) % 8 === 0 ? W[0] : W[2]));
      g.px(x, 14, W[0]);
    }
    if (!l) { for (let y = 3; y <= 14; y++) { g.px(0, y, W[0]); g.px(1, y, y === 3 ? W[4] : W[3]); g.px(2, y, W[1]); } g.px(1, 2, W[3]); }
    if (!r) { for (let y = 3; y <= 14; y++) { g.px(15, y, W[0]); g.px(14, y, y === 3 ? W[3] : W[1]); g.px(13, y, W[2]); } g.px(14, 2, W[2]); }
  }

  // ================================================================ tall objects
  function disc(g, cx, cy, r, col) {
    if (r < 0.7) { g.px(Math.floor(cx), Math.floor(cy), col); return; }
    const r2 = r * r;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r2) g.px(x, y, col);
      }
  }
  function limb(g, x0, y0, x1, y1, w0, w1, col) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
    for (let k = 0; k <= n; k++) { const t = k / n; disc(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, (w0 + (w1 - w0) * t) / 2, col); }
  }
  function grow(g, rnd, x, y, ang, len, w, depth, col, o) {
    const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
    limb(g, x, y, x1, y1, w, Math.max(1, w * 0.72), col);
    if (o.tips) o.tips.push([x1, y1, depth]);
    if (depth <= 0) return;
    const kids = rnd() < (o.three || 0) ? 3 : 2;
    for (let k = 0; k < kids; k++) {
      const side = kids === 2 ? (k ? 1 : -1) : k - 1;
      let a = ang + side * (o.spread || 0.5) * (0.6 + rnd() * 0.8) + (rnd() - 0.5) * 0.3;
      if (o.up) a += (-PI / 2 - a) * o.up;
      if (o.bound) { const nx = x1 + Math.cos(a) * len * 0.7; if (nx < 2 || nx > 29) a = -PI / 2 + (a + PI / 2) * 0.4; }
      grow(g, rnd, x1, y1, a, len * (o.decay || 0.72) * (0.8 + rnd() * 0.4), w * 0.62, depth - 1, col, o);
    }
  }
  // recolour a silhouette: lit where open to the upper-left, shaded to the lower-right
  function relight(g, from, hi, base, lo) {
    const W = g.w, H = g.h, src = g.d.slice();
    const is = (x, y) => x >= 0 && y >= 0 && x < W && y < H && src[y * W + x] === from;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (src[y * W + x] !== from) continue;
      let col = base;
      if (!is(x - 1, y) || !is(x, y - 1)) col = hi;
      else if (!is(x + 1, y) || !is(x, y + 1)) col = lo;
      g.d[y * W + x] = col;
    }
  }
  function blob(g, rnd, cx, cy, r, R, holes) {
    const ph = rnd() * 6;
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy, a = Math.atan2(dy, dx);
        const rr = r * (0.86 + 0.14 * Math.sin(a * 4 + ph) + 0.08 * Math.sin(a * 7 + ph * 2));
        const d = Math.sqrt(dx * dx + dy * dy) / rr;
        if (d > 1) continue;
        if (d > 0.72 && rnd() < holes) continue;
        const light = (-dx * 0.7 - dy) / r;
        const idx = Math.round(2 + light * 1.1 + (rnd() - 0.5) * 0.9 - (d > 0.85 && dy > 0 ? 1 : 0));
        g.px(x, y, at(R, idx));
      }
  }
  function baseShadow(g, cx, y, rx) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) for (let k = 0; k < 2; k++) {
      const yy = y - k;
      if (g.get(x, yy)) continue;
      if (Math.abs(x + 0.5 - cx) / rx > (k ? 0.75 : 1)) continue;
      if (((x + yy) & 1) === 0) g.px(x, yy, '#050406');
    }
  }
  const K1 = '#010101', K2 = '#020202';

  const TREES = {};
  TREES.village = function (g, c, P) {
    const r = c.rnd, B = P.bark;
    const lean = (r() - 0.5) * 5, mx = 16 + lean * 0.4, tx = 16 + lean;
    limb(g, 16, 46, 9, 47.5, 3, 1, K1); limb(g, 16, 46, 23, 47.5, 3, 1, K1); limb(g, 15, 46, 12, 47.5, 3, 1, K1);
    limb(g, 16, 46, mx, 37, 7, 5.5, K1);
    limb(g, mx, 37, tx, 29, 5.5, 4.5, K1);
    const o = { spread: 0.55, decay: 0.7, three: 0.3, up: 0.1, bound: true };
    grow(g, r, tx, 30, -PI / 2 - 0.95 - r() * 0.3, 7 + r() * 2, 4, 3, K1, o);
    grow(g, r, tx, 30, -PI / 2 + 0.85 + r() * 0.3, 7 + r() * 2, 4, 3, K1, o);
    grow(g, r, tx, 29, -PI / 2 + (r() - 0.5) * 0.4, 7 + r() * 2, 3.5, 3, K1, o);
    relight(g, K1, B[4], B[2], B[0]);
    for (let y = 30; y < 46; y++) for (let x = 12; x < 21; x++) {
      const q = g.get(x, y);
      if (q === B[2] && hf(x, y + c.x, 401) < 0.22) g.px(x, y, (y & 3) === 0 ? B[1] : B[3]);
    }
    const kx = Math.round(mx), ky = 38 + (c.variant % 3);
    g.px(kx, ky, '0'); g.px(kx + 1, ky, '0'); g.px(kx, ky + 1, B[0]); g.px(kx - 1, ky, B[3]);
    if (c.variant & 1) g.flipX();
    baseShadow(g, 16, 47, 7);
  };
  TREES.hushwood = function (g, c, P) {
    const r = c.rnd, B = P.bark, Cn = P.canopy, v = c.variant;
    const blobs = [];
    const trunk = (bx, top, w, tipx) => {
      limb(g, bx, 47, tipx, top, w, Math.max(1.5, w - 1.5), K1);
      return [bx, tipx];
    };
    const tipx = 16 + (r() - 0.5) * 4;
    trunk(16, 5, 4.5, tipx);
    if (v % 3 === 1) trunk(19, 16, 2.6, 22 + r() * 3);
    // a few thin twigs up into the canopy
    const tw = { spread: 0.6, decay: 0.7, three: 0, up: 0.25, bound: true };
    grow(g, r, tipx - 0.5, 18, -PI / 2 - 0.9, 5, 1.6, 1, K1, tw);
    grow(g, r, tipx, 14, -PI / 2 + 0.8, 5, 1.6, 1, K1, tw);
    g.outline('#1c1a1c');
    relight(g, K1, B[4], B[3], B[2]);
    // bark: black lenticels and dark scars
    for (let y = 6; y < 47; y++) for (let x = 8; x < 26; x++) {
      const q = g.get(x, y);
      if ((q === B[3] || q === B[4]) && hf(x >> 1, y, 411) < 0.09) { g.px(x, y, B[0]); if (g.get(x + 1, y) === B[3]) g.px(x + 1, y, B[1]); }
    }
    for (let x = 12; x < 21; x++) for (let y = 41; y < 47; y++) { const q = g.get(x, y); if (q === B[3] || q === B[4]) { if (hf(x, y, 412) < 0.45) g.px(x, y, B[1]); } }
    // sparse grey canopy
    const spots = [[tipx - 6, 11, 4.5], [tipx + 5, 9, 4], [tipx - 1, 5, 4], [tipx + 7, 17, 3.2], [tipx - 8, 18, 3], [tipx + 1, 14, 3.4]];
    spots.forEach((s, k) => { if (k < 4 || r() < 0.7) blobs.push(s); });
    blobs.forEach((s) => blob(g, r, s[0], s[1], s[2], Cn, 0.45));
    // pale drifting leaves
    for (let k = 0; k < 6; k++) { const x = 4 + Math.floor(r() * 24), y = 2 + Math.floor(r() * 22); if (!g.get(x, y)) g.px(x, y, k & 1 ? 'T' : 'S'); }
    if (v & 1) g.flipX();
    baseShadow(g, 16, 47, 5);
  };
  TREES.abbey = function (g, c, P) {
    const r = c.rnd, B = P.bark, Cn = P.canopy;
    limb(g, 16, 47, 16, 36, 5, 4, K1);
    limb(g, 16, 47, 12, 47.5, 2, 1, K1); limb(g, 16, 47, 20, 47.5, 2, 1, K1);
    relight(g, K1, B[3], B[2], B[0]);
    const tiers = [[16, 34, 12], [15, 26, 11], [17, 18, 9.5], [16, 11, 7.5], [16, 5, 4.5]];
    tiers.forEach((t, k) => {
      blob(g, r, t[0] - 4, t[1] + 1, t[2] * 0.62, Cn, 0.04);
      blob(g, r, t[0] + 4, t[1] + 1, t[2] * 0.62, Cn, 0.04);
      blob(g, r, t[0], t[1], t[2] * 0.8, Cn, 0.03);
      if (k === 0) for (let x = 6; x < 27; x++) if (g.get(x, 41)) g.px(x, 42, g.get(x, 42) || null);
    });
    // deep pockets and a few red arils
    for (let k = 0; k < 7; k++) { const x = 7 + Math.floor(r() * 18), y = 6 + Math.floor(r() * 30); if (g.get(x, y)) { g.px(x, y, Cn[0]); g.px(x + 1, y, Cn[0]); } }
    if (c.variant & 1) for (let k = 0; k < 4; k++) { const x = 8 + Math.floor(r() * 16), y = 10 + Math.floor(r() * 24); if (g.get(x, y)) g.px(x, y, k & 1 ? 'H' : 'I'); }
    if (c.variant & 2) g.flipX();
    baseShadow(g, 16, 47, 8);
  };
  TREES.greyharrow = function (g, c, P) {
    const r = c.rnd, B = P.bark, v = c.variant;
    const stump = v >= 5;
    const top = stump ? 34 + Math.floor(r() * 4) : 12 + Math.floor(r() * 6);
    const tx = 16 + (r() - 0.5) * (stump ? 1 : 4);
    limb(g, 16, 46, 10, 47.5, 3, 1, K1); limb(g, 16, 46, 22, 47.5, 3, 1, K1);
    limb(g, 16, 46, tx, top, stump ? 8 : 6.5, stump ? 7 : 3.5, K1);
    if (!stump) {
      const o = { spread: 0.4, decay: 0.6, three: 0, up: 0.3, bound: true };
      const n = 2 + Math.floor(r() * 2);
      for (let k = 0; k < n; k++) {
        const y = top + 6 + k * 7 + Math.floor(r() * 3), side = (k & 1) ? 1 : -1;
        const sx = 16 + (tx - 16) * (46 - y) / (46 - top);
        grow(g, r, sx, y, -PI / 2 + side * (0.9 + r() * 0.4), 4 + r() * 3, 2.4, 1, K1, o);
      }
    }
    relight(g, K1, B[4], B[2], B[0]);
    // snapped, splintered crown with pale heartwood in the break
    const w = stump ? 7 : 3;
    for (let x = Math.round(tx - w / 2); x <= Math.round(tx + w / 2); x++) {
      const h = Math.floor(hf(x, c.y, 421) * (stump ? 3 : 5));
      for (let k = 1; k <= h; k++) g.px(x, top - k, k === h ? B[3] : B[1]);
      g.px(x, top, (x & 1) ? '#5a4a3c' : '#4a3b30');
    }
    // ash lying on every upward surface
    const src = g.d.slice();
    for (let y = 1; y < 48; y++) for (let x = 0; x < 32; x++) if (src[y * 32 + x] && !src[(y - 1) * 32 + x] && hf(x, y, 422) < 0.55) g.px(x, y, '#6c6464');
    if (v & 1) g.flipX();
    baseShadow(g, 16, 47, stump ? 7 : 6);
  };
  TREES.city = function (g, c, P) {
    const r = c.rnd, B = P.bark, F = P.stone.face;
    limb(g, 16, 45, 16 + (r() - 0.5) * 2, 22, 3.5, 3, K1);
    const tips = [];
    const o = { spread: 0.35, decay: 0.8, three: 0, up: 0.35, bound: true, tips };
    const n = 4 + (c.variant & 1);
    for (let k = 0; k < n; k++) {
      const a = -PI / 2 + (k - (n - 1) / 2) * 0.42;
      grow(g, r, 16, 23, a, 6 + r() * 3, 2.4, 0, K1, o);
    }
    relight(g, K1, B[4], B[2], B[0]);
    // pollard knuckles with thin whips
    tips.forEach((t) => {
      disc(g, t[0], t[1], 1.8, B[3]); g.px(Math.floor(t[0]) + 1, Math.floor(t[1]) + 1, B[1]);
      for (let k = 0; k < 3; k++) {
        const a = -PI / 2 + (k - 1) * 0.35 + (r() - 0.5) * 0.3, len = 3 + r() * 4;
        g.line(t[0], t[1] - 1, t[0] + Math.cos(a) * len, t[1] - 1 + Math.sin(a) * len, B[2]);
      }
    });
    // stone kerb ring around the root pit
    for (let x = 8; x <= 24; x++) for (let y = 42; y <= 47; y++) {
      const d = ((x + 0.5 - 16.5) / 8) ** 2 + ((y + 0.5 - 45) / 2.6) ** 2;
      if (d < 0.62) { if (!g.get(x, y)) g.px(x, y, '#1c1719'); }
      else if (d < 1) g.px(x, y, y < 45 ? F[4] : F[2]);
    }
    for (let x = 14; x <= 18; x++) g.px(x, 45, K1 === g.get(x, 45) ? B[1] : B[2]);
    limb(g, 16, 45, 16, 42, 3.5, 3.5, B[2]); g.px(15, 42, B[4]); g.px(17, 44, B[1]);
  };
  TREES.wickward = function (g, c, P) {
    const r = c.rnd, B = P.bark;
    const tx = 16 + (r() - 0.5) * 6;
    limb(g, 16, 46, 9, 47.5, 3, 1, K1); limb(g, 16, 46, 23, 47.5, 3, 1, K1);
    limb(g, 16, 46, tx, 24, 6, 3.5, K1);
    const o = { spread: 0.7, decay: 0.68, three: 0.2, up: 0.05, bound: true };
    grow(g, r, tx, 26, -PI / 2 - 0.8, 6 + r() * 3, 3, 2, K1, o);
    grow(g, r, tx, 25, -PI / 2 + 0.7, 7 + r() * 3, 3, 2, K1, o);
    if (r() < 0.6) grow(g, r, tx, 32, -PI / 2 + 1.2, 5, 2.4, 1, K1, o);
    relight(g, K1, B[4], B[2], B[0]);
    // the fire is still inside: glowing seams in the bark
    for (let y = 26; y < 46; y++) for (let x = 11; x < 22; x++) {
      if (g.get(x, y) === B[2] && Math.abs(vn(x * 2, y * 0.6, 3, 431) - 0.5) < 0.04) g.px(x, y, hf(x, y, 432) < 0.3 ? 'l' : 'k');
    }
    const src = g.d.slice();
    for (let y = 1; y < 48; y++) for (let x = 0; x < 32; x++) if (src[y * 32 + x] && !src[(y - 1) * 32 + x] && hf(x, y, 433) < 0.35) g.px(x, y, '#4a4442');
    if (c.variant & 1) g.flipX();
    baseShadow(g, 16, 47, 6);
  };
  TREES.pyre = function (g, c, P) {
    TREES.wickward(g, c, P);
    const src = g.d.slice();
    for (let y = 1; y < 48; y++) for (let x = 0; x < 32; x++) {
      if (src[y * 32 + x] && src[y * 32 + x] !== '#050406' && !src[(y - 1) * 32 + x]) { g.px(x, y, '#7b7474'); if (hf(x, y, 441) < 0.5) g.px(x, y - 1, '#655e5e'); }
    }
  };
  TREES.cave = function (g, c, P) {
    const r = c.rnd, R = P.rock, v = c.variant;
    const cone = (cx, base, h, w) => {
      for (let y = base - h; y <= base; y++) {
        const t = (y - (base - h)) / h, half = Math.max(0.5, w / 2 * Math.pow(t, 0.8));
        for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
          if (Math.abs(x + 0.5 - cx) > half) continue;
          const rel = (x + 0.5 - cx) / half;
          let idx = Math.round(2.4 - rel * 1.4);
          if (((y + Math.floor(hf(x, 0, 451) * 2)) % 5) === 0) idx--;
          g.px(x, y, at(R, idx));
        }
      }
      g.px(Math.floor(cx), base - h, R[4]);
    };
    const h = 26 + Math.floor(r() * 10);
    cone(16, 47, h, 13);
    if (v & 1) cone(v & 2 ? 8.5 : 23.5, 47, 9 + Math.floor(r() * 5), 6);
    if (v === 4) cone(11, 47, 14, 6);
    // wet sheen running down the lit side
    for (let y = 47 - h + 4; y < 46; y++) if (hf(y, 3, 452) < 0.5) g.px(14 - Math.floor((y - (47 - h)) / h * 4), y, '#5f7680');
    g.outline(R[0]);
    baseShadow(g, 16, 47, 8);
  };
  TREES.interior = function (g, c, P) {
    const r = c.rnd;
    const pot = ['#2e1c16', '#4a2e22', '#5e3b2c', '#704834', '#84583f'];
    // thin dead trunk and twigs
    limb(g, 16, 38, 15 + (r() - 0.5) * 3, 16, 2.2, 1.4, K1);
    const o = { spread: 0.55, decay: 0.7, three: 0.2, up: 0.2, bound: true };
    grow(g, r, 15.5, 22, -PI / 2 - 0.7, 6, 1.4, 2, K1, o);
    grow(g, r, 15.5, 19, -PI / 2 + 0.6, 6, 1.4, 2, K1, o);
    relight(g, K1, '#5a4a3c', '#3a2e26', '#231b16');
    for (let k = 0; k < 4; k++) { const x = 8 + Math.floor(r() * 16), y = 8 + Math.floor(r() * 16); if (g.get(x, y + 1)) g.px(x, y, '#6b5845'); }
    // pot
    for (let y = 37; y <= 46; y++) {
      const t = (y - 37) / 9, half = 5.5 - t * 1.6;
      for (let x = Math.floor(16 - half); x < Math.ceil(16 + half); x++) {
        const rel = (x + 0.5 - 16) / half;
        g.px(x, y, at(pot, Math.round(2.6 - rel * 1.6 - (y === 46 ? 1 : 0))));
      }
    }
    for (let x = 10; x <= 21; x++) { g.px(x, 36, pot[4]); g.px(x, 37, pot[3]); }
    g.px(10, 37, pot[2]); g.px(21, 37, pot[1]);
    for (let x = 12; x <= 19; x++) g.px(x, 38, '#1a1210');
    g.px(12, 41, pot[1]); g.px(13, 42, pot[1]); g.px(19, 40, pot[4]);
    baseShadow(g, 16, 47, 6);
    g.px(22, 47, '#6b5845'); g.px(23, 46, '#5a4a3a');
  };
  function drawTree(g, c) { (TREES[c.theme] || TREES.village)(g, c, th(c)); }

  function pillarRamp(P) { const F = P.stone.face; return [F[0], F[1], F[2], F[3], F[4]]; }
  function drawPillar(g, c) {
    const P = th(c), t = c.theme, v = c.variant;
    const R = t === 'interior' ? P.hs : pillarRamp(P);
    const broken = (t === 'hushwood' || t === 'greyharrow' || t === 'wickward' || t === 'abbey') && v >= 6;
    const top = broken ? 8 + (v & 1) * 4 : 0;
    const shade = [R[1], R[4], R[3], R[3], R[2], R[2], R[2], R[2], R[1], R[1], R[0]];
    if (t === 'cave') {
      for (let y = 0; y < 32; y++) {
        const half = 4.2 + Math.sin(y * 0.5 + v) * 1 + (y > 26 ? (y - 26) * 0.6 : 0) + (y < 4 ? (4 - y) * 0.6 : 0);
        for (let x = Math.floor(8 - half); x <= Math.ceil(8 + half); x++) {
          if (Math.abs(x + 0.5 - 8) > half) continue;
          const rel = (x + 0.5 - 8) / half;
          let idx = Math.round(2.2 - rel * 1.5);
          if (((y + (x >> 1)) % 6) === 0) idx--;
          g.px(x, y, at(P.rock, idx));
        }
      }
      g.outline(P.rock[0]);
      return;
    }
    // shaft
    for (let y = Math.max(top, 6); y <= 25; y++) for (let x = 3; x <= 12; x++) {
      let col = shade[x - 3];
      if (t === 'city' && (x === 5 || x === 8 || x === 11)) col = dim(col, 0.8);
      if (hf(x, y + c.x * 32, 461) < 0.06) col = dim(col, 0.85);
      if (y % 8 === 0 && t !== 'city') col = dim(col, 0.8);
      g.px(x, y, col);
    }
    // capital
    if (!broken) {
      for (let x = 1; x <= 14; x++) { g.px(x, 1, R[4]); g.px(x, 2, x < 4 ? R[3] : x > 12 ? R[1] : R[2]); g.px(x, 3, R[1]); }
      for (let x = 2; x <= 13; x++) { g.px(x, 4, x < 5 ? R[3] : R[2]); g.px(x, 5, R[1]); }
      for (let x = 1; x <= 14; x++) g.px(x, 0, R[3]);
    } else {
      for (let x = 3; x <= 12; x++) { const h = Math.floor(hf(x, v, 462) * 3); for (let k = 0; k < h; k++) g.px(x, top - k - 1, k === h - 1 ? R[4] : shade[x - 3]); g.px(x, top, R[4]); }
    }
    // base
    for (let x = 2; x <= 13; x++) { g.px(x, 26, R[4]); g.px(x, 27, x < 5 ? R[3] : R[2]); }
    for (let x = 1; x <= 14; x++) { g.px(x, 28, R[3]); g.px(x, 29, x < 4 ? R[3] : x > 12 ? R[1] : R[2]); g.px(x, 30, R[1]); }
    // weathering
    if (P.moss && t !== 'city') for (let y = 18; y <= 30; y++) for (let x = 1; x <= 14; x++) if (g.get(x, y) && hf(x, y + c.y, 463) < (y - 17) * 0.05) g.px(x, y, P.moss[hf(x, y, 464) < 0.5 ? 0 : 1]);
    if (t === 'wickward' || t === 'pyre') for (let y = 6; y <= 30; y++) for (let x = 1; x <= 14; x++) if (g.get(x, y) && hf(x, y, 465) < (y / 31) * 0.5) g.px(x, y, dim(g.get(x, y), 0.6));
    if (t === 'pyre') { g.px(9, 14, 'l'); g.px(9, 15, 'k'); g.px(10, 16, 'l'); }
    g.outline(R[0]);
    for (let x = 0; x <= 15; x++) if (!g.get(x, 31) && (x & 1)) g.px(x, 31, '#050406');
  }
  const BOOKS = ['#4c1422', '#5a2a24', '#22384a', '#365466', '#343f28', '#4d5a38', '#5a3a24', '#7d5634', '#4a4250', '#4a3a1c', '#7a6230', '#6b4a3c'];
  function drawShelf(g, c) {
    const W = ['#120d0b', '#221813', '#31231b', '#433024', '#553e2f'];
    const P = th(c), t = c.theme, v = c.variant;
    const charred = t === 'wickward' || t === 'pyre';
    // carcass
    g.rect(1, 2, 14, 29, W[0]);
    for (let y = 2; y <= 30; y++) { g.px(1, y, W[3]); g.px(2, y, W[2]); g.px(13, y, W[1]); g.px(14, y, W[0]); }
    for (let x = 1; x <= 14; x++) { g.px(x, 2, W[4]); g.px(x, 3, W[3]); g.px(x, 4, W[1]); g.px(x, 30, W[1]); g.px(x, 31, W[0]); }
    if (v >= 6) {
      // cupboard doors
      for (let y = 5; y <= 29; y++) for (let x = 3; x <= 12; x++) {
        const edge = x === 3 || x === 7 || x === 8 || x === 12 || y === 5 || y === 29 || y === 16;
        g.px(x, y, edge ? W[3] : (x === 4 || x === 9) ? W[2] : W[1]);
      }
      g.px(6, 17, 'L'); g.px(9, 17, 'L'); g.px(6, 18, 'K'); g.px(9, 18, 'K');
    } else {
      const shelves = [11, 19, 27];
      let yTop = 5;
      shelves.forEach((sy, k) => {
        for (let x = 3; x <= 12; x++) { g.px(x, sy, W[4]); g.px(x, sy + 1, W[2]); }
        // books or jars on this shelf
        let x = 3;
        const rr = U.rng(U.hash2(c.x * 3 + k, c.y, 471));
        while (x <= 12) {
          const w = rr() < 0.6 ? 1 : 2, h = Math.min(sy - yTop, 4 + Math.floor(rr() * 3));
          if (rr() < 0.14) { x += 1; continue; }
          if (t === 'abbey' && rr() < 0.3 && x <= 10) {
            // rolled scrolls
            g.px(x, sy - 1, 'g'); g.px(x + 1, sy - 1, 'f'); g.px(x, sy - 2, 'f'); g.px(x + 1, sy - 2, 'e'); x += 3; continue;
          }
          if (rr() < 0.12 && x <= 11) {
            // a jar
            g.px(x, sy - 1, '#5a6668'); g.px(x + 1, sy - 1, '#3e484b'); g.px(x, sy - 2, '#7a8688'); g.px(x + 1, sy - 2, '#4a5659'); g.px(x, sy - 3, '#2a2224'); x += 3; continue;
          }
          const col = BOOKS[Math.floor(rr() * BOOKS.length)];
          for (let dx = 0; dx < w && x + dx <= 12; dx++) for (let y = sy - h; y < sy; y++) g.px(x + dx, y, dx === 0 ? col : dim(col, 0.75));
          g.px(x, sy - h, mix(col, '#ebe5dc', 0.25));
          if (h > 4) g.px(x, sy - h + 2, dim(col, 0.6));
          x += w;
        }
        yTop = sy + 2;
      });
    }
    if (charred) for (let y = 2; y <= 31; y++) for (let x = 1; x <= 14; x++) { const q = g.get(x, y); if (q && vn(x, y, 3, 472 + c.x) > 0.55) g.px(x, y, dim(q, 0.45)); }
    if (P.moss && t === 'abbey') for (let x = 1; x <= 14; x++) if (hf(x, c.y, 473) < 0.4) g.px(x, 30, P.moss[0]);
    g.outline('#07060a');
    for (let x = 1; x <= 15; x++) if (((x + 1) & 1) && !g.get(x, 31)) g.px(x, 31, '#050406');
  }

  // ================================================================ definitions
  const def = (id, o) => AV.tiles.def(id, o);
  def('floor', { solid: false, opaque: true, draw: drawFloor });
  def('grass', { solid: false, draw: drawGrass });
  def('path', { solid: false, draw: drawPath });
  def('cobble', { solid: false, opaque: true, draw: drawCobble });
  def('wood_floor', { solid: false, opaque: true, draw: drawPlanks });
  def('flagstone', { solid: false, opaque: true, draw: drawFlagstone });
  def('shallow', { solid: false, anim: 4, fps: 3, draw: drawShallow });
  def('ash', { solid: false, draw: drawAsh });
  def('mud', { solid: false, draw: drawMud });
  def('bones', { solid: false, draw: drawBones });
  def('rubble', { solid: false, draw: drawRubble });
  def('rug', { solid: false, draw: drawRug });
  def('stairs', { solid: false, opaque: true, draw: drawStairs });
  def('burnt', { solid: false, draw: drawBurnt });
  def('lilies', { solid: false, draw: drawLilies });
  def('leaves', { solid: false, draw: drawLeaves });
  def('embers', { solid: false, opaque: true, anim: 4, fps: 5, light: { r: 36, color: '#e2621f', flicker: 0.3 }, draw: drawEmbers });
  def('candles', { solid: false, anim: 3, fps: 6, light: { r: 40, color: '#f59a36', flicker: 0.2 }, draw: drawCandles });
  def('wall', { solid: true, opaque: true, draw: (g, c) => drawWallMat(g, c, 'stone') });
  def('wall_brick', { solid: true, opaque: true, draw: (g, c) => drawWallMat(g, c, 'brick') });
  def('wall_wood', { solid: true, opaque: true, draw: (g, c) => drawWallMat(g, c, 'wood') });
  def('wall_cracked', { solid: true, opaque: true, draw: drawCracked });
  def('wall_false', { solid: false, opaque: true, draw: (g, c) => drawWallMat(g, c, matOf(c, 'wall_false')) });
  def('window', { solid: true, opaque: true, light: { r: 18, color: '#e2621f', flicker: 0.06 }, draw: drawWindow });
  def('roof', { solid: true, opaque: true, draw: drawRoof });
  def('cliff', { solid: true, opaque: true, draw: drawCliff });
  def('water', { solid: true, opaque: true, anim: 4, fps: 3, draw: drawWater });
  def('void', { solid: true, opaque: true, draw: drawVoid });
  def('doorway', { solid: false, opaque: true, draw: drawDoorway });
  def('gate_bars', { solid: true, draw: drawBars });
  def('tree', { solid: true, tall: { w: 32, h: 48 }, draw: drawTree });
  def('pillar', { solid: true, tall: { w: 16, h: 32 }, draw: drawPillar });
  def('shelf', { solid: true, tall: { w: 16, h: 32 }, draw: drawShelf });
  def('shrub', { solid: true, draw: drawShrub });
  def('rock', { solid: true, draw: drawRock });
  def('fence', { solid: true, draw: drawFence });
  def('railing', { solid: true, draw: drawRailing });
  def('palisade', { solid: true, draw: drawPalisade });
  def('grave', { solid: true, draw: drawGrave });
  def('marker', { solid: true, draw: drawMarker });
  def('pew', { solid: true, draw: drawPew });
  def('brazier', { solid: true, anim: 4, fps: 8, light: { r: 64, color: '#f59a36', flicker: 0.25 }, draw: drawBrazier });
})(window.AV);
