// ASHEN VOW — Hallowhearth, the Upper City: maps (royal_road, upper_city, tallow_house, palace).
// Builder: CITY (upper half). The Wickward, its infirmary and the Pyre live in wickward.maps.js.
// Story, NPCs, items and dialogue for these maps live in city.story.js.
(function (AV) {
  'use strict';
  const M = AV.data.maps;

  // light presets
  const WARM = '#f59a36';
  const CANDLE = '#fccf63';
  const COLD = '#b9d6d3';
  const PYRE = '#e2621f';
  const lamp = (x, y) => ({ type: 'prop', x, y, sprite: 'prop_lamp_post', solid: true, light: { r: 56, color: WARM, flicker: 0.12 } });
  const deadLamp = (x, y) => ({ type: 'prop', x, y, sprite: 'prop_lamp_post', anim: 'unlit', solid: true });
  const candles = (x, y, r) => ({ type: 'prop', x, y, sprite: 'prop_candles', solid: false, light: { r: r || 34, color: CANDLE, flicker: 0.22 } });
  const candelabra = (x, y, r) => ({ type: 'prop', x, y, sprite: 'prop_candelabra', solid: true, light: { r: r || 44, color: CANDLE, flicker: 0.16 } });
  const prop = (sprite, x, y, extra) => Object.assign({ type: 'prop', x, y, sprite, solid: false }, extra || {});
  const solidProp = (sprite, x, y, extra) => Object.assign({ type: 'prop', x, y, sprite, solid: true }, extra || {});
  const bird = (x, y) => ({ type: 'prop', x, y: y - 0.35, sprite: 'prop_bird', solid: false });
  const enemy = (kind, x, y) => ({ type: 'enemy', kind, x, y, respawn: true });

  // The Seventh Gate shows exactly which Wardstones Brand carries, and stands open once opened.
  const GATE_ANIM = [
    { if: 'open_c_seventh_gate', anim: 'open' },
    { if: 'has:hart_stone && has:bell_stone && has:shield_stone', anim: 'closed3' },
    { if: 'has:hart_stone && has:bell_stone', anim: 'hart_bell' },
    { if: 'has:hart_stone && has:shield_stone', anim: 'hart_shield' },
    { if: 'has:bell_stone && has:shield_stone', anim: 'bell_shield' },
    { if: 'has:hart_stone', anim: 'hart' },
    { if: 'has:bell_stone', anim: 'bell' },
    { if: 'has:shield_stone', anim: 'shield' },
    { anim: 'closed0' },
  ];

  // ================================================================== ROYAL ROAD (shrine_road)
  // Ash dunes climbing north in three terraces to the Seventh Gate.
  M.royal_road = {
    name: 'The Royal Road',
    region: 'city',
    theme: 'city',
    music: 'city',
    weather: ['embers', 'ash'],
    ambient: 0.6,
    ambientColor: '#140c0c',
    indoor: false,
    tiles: [
      "##################################",
      "################;;################",
      "################;;################",
      "################;;################",
      "################;;################",
      "################;;################",
      "aaaaa.....;;;;;;;;;;;;;;....aaaaaa",
      "aaaa!.....;;;;;;;;;;;;;;.....!aaaa",
      "aaaaa.....;;;;;;;;;;;;;;....aaaaaa",
      "Raaaaa....;;;;;;;;;;;;;;....aaaaaR",
      "RRaaaaaa..rr;;;;;;;;;;rr..aaaaaaRR",
      "ccccccccccccccsssssscccccccccccccc",
      "ccccccccccccccsssssscccccccccccccc",
      "aaaaaaaaaaaaa:::::::aaaaaaaaaaaaaa",
      "aaRa,,aaaaaaa:::::::aaabaaaaaRa,aa",
      "aRRaaaggaaaaaa::::::aaaaaaaaaaaaaa",
      "aaaaa+a+aaaaaa:::::aaaaaaaaaaaaaaa",
      "aaaaaaaaaaaa::::::aaaaaaaatttaaaaa",
      "aaTa,aaaaaa::::::aaaa,,aaaaarraaaa",
      "aaaaaaaaaa::::::aaaaaaaaaaaaRaaaaa",
      "aaaaaaaaaa:::::aaaaaaaaaaaaRRaaaaa",
      "aaaaaaaaaaa:::::aaaaaaaaaaaaaaaaaa",
      "a,aaTaaaaaaa:::::aaaaaaabaaaa,,aaa",
      "aaaaaaaaaaaaa:::::aaaaaaaaaaaTaaaa",
      "aaRRaaaaaaaaaa:::::aaaaaaaaaaaaaaa",
      "cccccccccccccccssscccccccccccccccc",
      "cccccccccccccccssscccccccccccccccc",
      "aaaaaaaaaaaaaa:::::aaaaaaaaaaaaaaa",
      "aaaaaaaaaaaaa:::::aaaaaaaaaaaRaaaa",
      "aaaTa,,aaaaaa::::aaaaaaaarraaaaaaa",
      "aaaaaaaaaaaa::::aaaaaaaaaaaaaaaaaa",
      "aaaaaaaaaaa::::aaaaaaaaaaaaaaaaaaa",
      "aaaaaaaaaaa:::::aaaaaaagg+aaaaaaaa",
      "RRaaaaaaaaaa:::::aaaaaaa+g+aaaaaaa",
      "RRRaaaaaaaaaa:::::aaaaaaaaaaaaaaaa",
      "aaaaaaaaaaaaaa:::::aaaaaaaaaaaaaaa",
      "aaaaaaaaaaaaaaa:::::aaaaaaaaaaaaaa",
      "aaaaTa,aaaaaaaaa:::::aaaabaaaa,aaa",
      "aaaaaaaaaaaaaaaa::::aaaaaaaatttaaa",
      "aaaaaaaaaaaaaaa:::::aaaaaaaaaaaaaa",
      "aaaaaaaaaaaaaa:::::aaaaaaaaaaaaaaa",
      "aaaa,aRaaaaaaa::::aaaaaa,,aaaaaaaa",
      "aaaaaaaaaaaaaa:::::aaaaaaaaaaaaaaa",
      "aaaaaaaaaaaaaaa::::aaaaaaaaaRaaaaa",
      "aaTa,aaaarraaaa::::aaaaaaaaaa,aaaa",
      "aaaaaaaaaaaaaaa::::aaaaaaaaaaaaaaa",
      "RRaaaaaaaaaaaaa::::aaaaaaaaaaaaaRR",
      "RRRaaaaaaaaaaaa::::aaaaaaaaaaaaRRR",
      "RRRRaaaaaaaaaaa::::aaaaaaaaaaaRRRR",
      "RRRRRaaaaaaaaaa::::aaaaaaaaaaRRRRR",
    ],
    spawns: {
      south: [16, 47, 'up'],
      gate: [16, 7, 'down'],
    },
    entities: [
      // ---- exits
      { type: 'exit', x: 15, y: 49, w: 4, h: 1, to: 'village', spawn: 'north' },
      { type: 'exit', x: 16, y: 1, w: 2, h: 2, to: 'upper_city', spawn: 'gate' },

      // ---- the Seventh Gate
      prop('prop_gate_seventh', 16.5, 5, { anim: GATE_ANIM, light: { r: 30, color: COLD, flicker: 0.05 } }),
      { type: 'barrier', id: 'c_seventh_gate', x: 16, y: 4, w: 2, h: 2, sprite: null,
        lockIf: '!(has:hart_stone && has:bell_stone && has:shield_stone)',
        lockedText: 'Three sockets are cut into the lintel: a stag, a bell, a shield. The gate will not answer to less than all three.',
        openText: 'You lift the Wardstones to their sockets. Stag. Bell. Shield. Somewhere inside the wall, something nineteen years asleep turns over.',
        do: ['shake:5', 'sfx:slam', 'flash:#fff3c2'] },
      { type: 'trigger', id: 'c_t_gate_first', x: 12, y: 9, w: 10, h: 2, dialogue: 'c_gate_first' },
      // Hesk, waiting as he said he would
      { type: 'npc', x: 13, y: 7, npc: 'hesk', dir: 'right', if: 'hesk_waits && !hesk_following && !hesk_left' },
      // the last of the gate watch, still at their posts
      { type: 'corpse', id: 'c_road_watch1', x: 11, y: 8, sprite: 'prop_corpse_knight', text: [
        'One of the gate watch, fused to the paving where he fell. His spear is still pointed at the gate. Not away from it. At it.',
        'Whatever came out, he meant to stop it. A few eye-pennies in his belt-purse, gone green.',
      ], do: ['pennies:+25'] },
      { type: 'corpse', id: 'c_road_watch2', x: 22, y: 9, sprite: 'prop_corpse_knight', text: [
        'Another of the watch, sitting against nothing with his helm in his lap, as if he had taken it off to hear something better.',
      ] },
      prop('prop_banner', 12.5, 5.6), prop('prop_banner', 20.5, 5.6),
      { type: 'sign', x: 23, y: 6, sprite: null, title: 'The Gatehouse Wall', text: [
        'A bronze plate on the wall: THE SEVENTH GATE. KEPT BY THE WARDEN, FOR THE KING, AGAINST ALL COMERS.',
        'Beneath it, newer, bolted on crooked: SEALED BY ORDER OF THE QUEEN. LET NONE OPEN IT BUT THE THREE.',
      ] },
      lamp(10, 9), lamp(23, 9),
      { type: 'emitter', x: 4, y: 7, kind: 'embers' }, { type: 'emitter', x: 29, y: 7, kind: 'embers' },
      { type: 'emitter', x: 16.5, y: 3, kind: 'ash' },

      // ---- the middle terrace: the wayside shrine and the pilgrims' graves
      { type: 'shrine', x: 9, y: 19, id: 'shrine_road', name: 'Wayside Shrine' },
      solidProp('prop_statue_saint', 7, 18),
      candles(8, 19.6, 30), candles(10.2, 19.6, 30),
      { type: 'sign', x: 7, y: 19, sprite: null, title: 'Wayside Saint', text: [
        'Saint Wendel with his staff and his lamp, worn smooth by pilgrims\' hands. The ash lies thick on his shoulders.',
        'Not in his lamp. Someone has scraped it out, and put a candle-stub in, and lit it.',
      ] },
      bird(6, 15), bird(7, 15), bird(5, 16), bird(7, 16),
      { type: 'sign', x: 6.5, y: 16.5, sprite: null, title: 'Roadside Graves', text: [
        'Pilgrims who died within sight of the gate. No names. On each grave a crude wooden bird.',
        'She came this far, then. Further than the Rest. Further than anyone thought to.',
      ] },
      { type: 'corpse', id: 'c_road_pilgrim1', x: 21, y: 28, sprite: 'prop_corpse_pilgrim', text: [
        'A pilgrim face-down in the ash, one hand stretched uphill. His staff is ten paces further on, as if he had thrown it ahead of him.',
        'Under him, a purse. The eye-pennies in it were meant for someone else\'s eyes.',
      ], do: ['pennies:+30'] },
      { type: 'corpse', id: 'c_road_pilgrim2', x: 10, y: 36, sprite: 'prop_corpse_pilgrim', text: [
        'This one was walking the other way. South, away from the gate. The ash caught her anyway.',
      ] },
      solidProp('prop_cart', 24, 35, { flip: true }),
      { type: 'sign', x: 24, y: 36, sprite: null, title: 'Overturned Cart', text: [
        'A cart on its side, the load long gone. Painted on the tailboard, flaking: ALMS FOR THE WICKWARD — BY THE QUEEN\'S CHARITY.',
      ] },
      bird(23.5, 32), bird(25, 33),
      prop('prop_ash_pile', 12, 23), prop('prop_ash_pile', 22, 17), prop('prop_bone_pile', 26, 29),
      prop('prop_crow', 26.5, 32.4),

      // ---- the lower terrace: where she found him
      { type: 'sign', x: 13, y: 41, sprite: null, dialogue: 'c_dragmark' },
      solidProp('prop_signpost', 19, 45),
      { type: 'sign', x: 19, y: 46, sprite: null, title: 'Signpost', text: [
        'HALLOWHEARTH — THE SEVENTH GATE, one arm says, pointing uphill into the ash.',
        'The other arm, for the Rest, has been broken off for kindling. Only the bracket is left.',
      ] },
      { type: 'emitter', x: 9, y: 30, kind: 'ash' }, { type: 'emitter', x: 24, y: 40, kind: 'ash' },
      { type: 'emitter', x: 17, y: 20, kind: 'ash' },
      { type: 'light', x: 16.5, y: 44, r: 50, color: COLD, intensity: 0.4 },
      { type: 'light', x: 16.5, y: 30, r: 50, color: COLD, intensity: 0.35 },
      { type: 'light', x: 16, y: 13, r: 60, color: WARM, intensity: 0.4, flicker: 0.1 },

      // ---- the road is not empty
      enemy('pilgrim', 17, 38), enemy('pilgrim', 13, 30), enemy('pilgrim', 19, 21), enemy('pilgrim', 15, 15),
      enemy('hound', 25, 21), enemy('hound', 27, 22), enemy('hound', 7, 42),
    ],
  };

  // ================================================================== UPPER CITY (shrine_city)
  // Tall ruined houses, the palace to the north, Tallow Lane to the west, the burned quarter and the
  // Wickward gate below to the south-east.
  M.upper_city = {
    name: 'Hallowhearth',
    region: 'city',
    theme: 'city',
    music: 'city',
    weather: ['embers', 'ash'],
    ambient: 0.62,
    ambientColor: '#140a0c',
    indoor: false,
    tiles: [
      "^^^^^^^^^^##^^^^^^^^^^^^^^^^^^^^^^##^^^^^^^^^^",
      "^^^^^^^^^^##^^^^^^^^^^^^^^^^^^^^^^##^^^^^^^^^^",
      "^^^^^^^^^^##^^^^^^^^^^^^^^^^^^^^^^##^^^^^^^^^^",
      "^^^^^^^^^^##^^^^^^^^^^^^^^^^^^^^^^##^^^^^^^^^^",
      "^^^^^^^^^^##^^^^^^^^^^^^^^^^^^^^^^##^^^^^^^^^^",
      "BwBBwBBwBB##^^^^^^^^^^^^^^^^^^^^^^##BBwBBwBBwB",
      ".r..a...r.##^^^^^^^^^^^^^^^^^^^^^^##..a.r..a..",
      ";;;;;;;;;;##BBwBBwBBwBDDBwBBwBBwBB##;;;;;;;;;;",
      "r.;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;.r",
      ".;;;;;;;;;;;|;;;;;;;;;;;;;;;;;;;;|;;;;;;;;;;;.",
      ".;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;.",
      ".;;;;;;;;;;;|;;;;;;;;;;;;;;;;;;;;|;;;;;;;;;;;.",
      "^^^^^^^^^^^^^^^^^^^I;;;;;;IIIIIIIIIIIIIIIIIIII",
      "^^^^^^^^^^^^^^^^^^^.;;;;;;.x.r..#####..a.x.r..",
      "BwBBwDBwBBwBBwBBwBB.;;;;;;.x..r.#rrr#..x..a.x.",
      ";;;a;;;;;;;;a;;;;;;;;;;;;;..a..x#rxr#.x..r..a.",
      ";;;;;;a;;;;;;;;;a;;;;;;;;;.x....#.#.#...x.....",
      ";a;;;;;;;;a;;;;;;;;;;;;;;;..r.x........r...x..",
      "^^^^^^^^^^^^^^^^^^..;;;;;;x..a..^^^^^^..x..r..",
      "^^^^^^^^^^^^^^^^^^..;;;;;;...x..^^^^^^...a...x",
      "^^^^^^^^^^^^^^^^^^..;;;;;;.r....BwBBwB.x....r.",
      "BwBBwBBwBBwBBwBBwB..;;;;;;..x.a......r..x.....",
      ".;;;;;;;;;;;;;;;;;;.;;;;;;.....x..r...a..x..r.",
      ".;;;;;;;;;;;;;;;;;;.;;;;;;..a......x.....r....",
      "t;;;;;;;;;;;;;;;;;;.;;;;;;x...r.....a..x....x.",
      ".;;;;;;;;;;;;;;;;;;;;;;;;;...x....x.....a.....",
      ".;;;;;;;;;;;;;;;;;;;;;;;;;.r....a.....r...x...",
      ".;;;;;;;;;;;;;;;;;;;;;;;;;......x..a.....x..r.",
      "t;;;;;;;;;;;;;;;;;;.;;;;;;..x.......r.....a...",
      ".;;;;;;;;;;;;;;;;;;.;;;;;;cccccccccssssccccccc",
      ".;;;;;;;;;;;;;;;;;;.;;;;;;cccccccccssssccccccc",
      "...;;;;;;;;;;;;;;...;;;;;;I.x..a...::::..x....",
      "^^^^^^^^^^^^^^^^^^..;;;;;;I.r..x...::::...r...",
      "^^^^^^^^^^^^^^^^^^..;;;;;;I.....a..::::.x.....",
      "^^^^^^^^^^^^^^^^^^..;;;;;;I.x......::::....a.x",
      "BwBBwBBwBBwBBwBBwB..;;;;;;I....x...::::.r.....",
      "..................r.;;;;;;I.r......;;;;....x..",
      "#####################;;;;###########;;;#######",
      "#####################;;;;###########;;;#######",
      "#####################;;;;###########;;;#######",
    ],
    spawns: {
      gate: [22, 36, 'up'],
      tallow_door: [5, 16, 'down'],
      palace_door: [22, 9, 'down'],
      wickward: [37, 35, 'up'],
    },
    entities: [
      // ---- exits
      { type: 'exit', x: 21, y: 39, w: 4, h: 1, to: 'royal_road', spawn: 'gate' },
      { type: 'exit', x: 22, y: 7, w: 2, h: 1, to: 'palace', spawn: 'door' },
      { type: 'door', x: 5, y: 14, to: 'tallow_house', spawn: 'door',
        lockIf: '!(hound_calmed || hound_killed)',
        lockedText: 'The hound is between you and the door. It is not going to move for asking.' },
      { type: 'barrier', id: 'c_wickward_gate', x: 36, y: 37, w: 3, h: 1, sprite: 'prop_gate_bars', lock: 'wickward_key',
        lockedText: 'Iron bars, a chain as thick as a wrist, and a lock with the royal seal on it. Beyond, the sky is the colour of a forge.',
        openText: 'The Queen\'s key turns as if it has been waiting to. The chain comes down in a long iron breath.' },
      { type: 'exit', x: 36, y: 39, w: 3, h: 1, to: 'wickward', spawn: 'upper' },

      // ---- story triggers
      { type: 'trigger', id: 'c_t_ch3', x: 21, y: 35, w: 4, h: 2, dialogue: 'c_city_first', do: ['chapter:3'] },
      { type: 'trigger', id: 'c_t_hesk_gate', x: 20, y: 31, w: 6, h: 1, if: 'hesk_following', dialogue: 'hesk_bark_gate' },
      { type: 'trigger', id: 'c_t_hesk_palace', x: 20, y: 12, w: 6, h: 1, if: 'hesk_following', dialogue: 'hesk_bark_palace' },
      { type: 'trigger', id: 'c_t_hesk_tallow', x: 17, y: 15, w: 2, h: 3, if: 'hesk_following', dialogue: 'hesk_bark_tallow' },
      // Hesk goes no further than the Wickward gate — once there is a key to open it
      { type: 'trigger', id: 'c_t_hesk_wickward', x: 35, y: 31, w: 4, h: 2, if: 'hesk_following && has:wickward_key', dialogue: 'hesk_wickward' },

      // ---- people
      { type: 'npc', x: 33, y: 34, npc: 'hesk', dir: 'right', if: 'hesk_left' },
      { type: 'npc', x: 16, y: 25, npc: 'fenwick', dir: 'left', if: 'fenwick_left && !fenwick_killed' },
      // the hound on Tallow Lane: growling across the step, lying beside it once calmed, or fighting
      { type: 'npc', x: 5, y: 15, npc: 'hound', dir: 'right', anim: 'growl', if: '!c_hound_fight && !hound_calmed && !hound_killed' },
      { type: 'npc', x: 7, y: 15, npc: 'hound', dir: 'left', anim: 'lie', if: 'hound_calmed' },
      { type: 'enemy', kind: 'hound_big', x: 5, y: 16, respawn: false, id: 'c_hound', if: 'c_hound_fight && !hound_killed',
        onDeath: ['dialogue:c_hound_dead'] },

      // ---- the palace courtyard
      prop('prop_banner', 16, 7.2), prop('prop_banner', 29, 7.2),
      solidProp('prop_brazier', 18, 8, { light: { r: 64, color: WARM, flicker: 0.2 } }),
      solidProp('prop_brazier', 27, 8, { light: { r: 64, color: WARM, flicker: 0.2 } }),
      { type: 'emitter', x: 18, y: 7.6, kind: 'embers' }, { type: 'emitter', x: 27, y: 7.6, kind: 'embers' },
      solidProp('prop_statue_knight', 14, 10), solidProp('prop_statue_knight', 31, 10, { flip: true }),
      { type: 'sign', x: 22.5, y: 8, sprite: null, title: 'The Palace Doors', text: [
        'A proclamation nailed to the palace door, most of it gone to weather. What is left says: …AND THE CARTS SHALL ASSEMBLE AT DUSK…',
        'Someone has nailed a second sheet over the first. It has fallen away. Only the nail is left, and a torn corner with a seal of wax.',
      ] },
      solidProp('prop_cart', 4, 9), solidProp('prop_cart', 41, 9, { flip: true }),
      { type: 'sign', x: 4, y: 10, sprite: null, title: 'Empty Cart', text: [
        'A cart without a horse, shafts resting in the ash. In the bed: a folded blanket, a child\'s cup, a straw doll.',
        'There are others along the street, all empty, all pointed south. Somebody ordered a great many carts.',
      ] },
      prop('prop_crate', 7, 8), prop('prop_barrel', 38, 8), prop('prop_barrel', 43, 10),
      lamp(2, 7), lamp(43, 7),

      // ---- the avenue
      lamp(20, 14), lamp(25, 14), lamp(20, 22), deadLamp(25, 22), lamp(20, 30), lamp(25, 30),
      prop('prop_rubble', 23, 18), prop('prop_ash_pile', 21, 27), prop('prop_ash_pile', 24, 34),
      { type: 'light', x: 22.5, y: 36, r: 60, color: COLD, intensity: 0.4 },

      // ---- Tallow Lane
      solidProp('prop_signpost', 15, 15),
      { type: 'sign', x: 15, y: 16, sprite: null, title: 'Tallow Lane', text: [
        'TALLOW LANE, the sign says. Under it, cut into the post with a small knife by someone who had to reach up to do it: GRIP LIVES HERE. MIND.',
      ] },
      prop('prop_barrel', 9, 15), prop('prop_crate', 10, 15), prop('prop_rubble', 13, 17),
      candles(3, 15, 26),
      { type: 'light', x: 5, y: 15, r: 40, color: PYRE, intensity: 0.5, flicker: 0.15 },
      { type: 'emitter', x: 5, y: 15, kind: 'ash' },

      // ---- the shrine square and the Warden's statue
      { type: 'shrine', x: 9, y: 27, id: 'shrine_city', name: 'The Warden\'s Square' },
      solidProp('prop_statue_knight', 9, 24),
      { type: 'sign', x: 9, y: 25, sprite: null, dialogue: 'c_statue' },
      candles(7.5, 27.6, 30), candles(10.5, 27.6, 30),
      lamp(3, 23), lamp(16, 23), deadLamp(3, 30), lamp(16, 30),
      prop('prop_fountain', 13, 29, { solid: true }),
      { type: 'sign', x: 13, y: 30, sprite: null, title: 'Dry Fountain', text: [
        'A fountain full of ash to the lip. Coins show through it here and there, thrown in for wishes nobody remembers.',
      ], do: [] },
      prop('prop_crate', 18, 33), prop('prop_barrel', 17, 36),

      // ---- the burned quarter, and the way down to the Wickward
      { type: 'corpse', id: 'c_city_knight', x: 40, y: 16, sprite: 'prop_corpse_knight', item: 'grave_iron', text: [
        'A knight of the city watch, burned where he stood. He had been running toward the Wickward, not away. His sword has fused into a bar of black iron.',
        'It comes loose from his hand at last. It is very heavy, and it is still warm.',
      ] },
      prop('prop_rubble', 34, 14), prop('prop_rubble', 43, 20), prop('prop_ash_pile', 30, 24), prop('prop_ash_pile', 38, 26),
      prop('prop_bone_pile', 44, 27),
      { type: 'emitter', x: 35, y: 15, kind: 'smoke' }, { type: 'emitter', x: 42, y: 23, kind: 'smoke' },
      { type: 'emitter', x: 30, y: 20, kind: 'embers' }, { type: 'emitter', x: 40, y: 28, kind: 'embers' },
      { type: 'light', x: 35, y: 15, r: 50, color: PYRE, intensity: 0.45, flicker: 0.2 },
      { type: 'light', x: 40, y: 24, r: 60, color: PYRE, intensity: 0.45, flicker: 0.2 },
      { type: 'light', x: 30, y: 27, r: 50, color: PYRE, intensity: 0.4, flicker: 0.2 },
      // the Wickward gate: tags hung like wind-chimes, and the hand on every stone
      prop('prop_tag_chimes', 34, 36), prop('prop_tag_chimes', 40, 36),
      { type: 'decal', x: 35, y: 36, sprite: 'prop_hand_mark' }, { type: 'decal', x: 39, y: 36, sprite: 'prop_hand_mark' },
      { type: 'decal', x: 37, y: 33, sprite: 'prop_hand_mark' },
      { type: 'sign', x: 34, y: 35, sprite: null, title: 'Notice', text: [
        'A notice nailed to the post, run by nineteen years of weather: THE WICKWARD IS CLOSED BY ORDER. NONE SHALL PASS OUT. ALMS AT THE NINTH BELL.',
        'Under it, scratched with a nail, very small: WE ARE STILL HERE',
      ] },
      { type: 'light', x: 37, y: 37, r: 80, color: PYRE, intensity: 0.7, flicker: 0.25 },
      { type: 'emitter', x: 37, y: 38, kind: 'embers' },

      // ---- what walks here now
      enemy('chandler', 15, 10), enemy('chandler', 30, 10),
      enemy('pikeman', 22, 26), enemy('pikeman', 23, 19), enemy('pikeman', 38, 33),
      enemy('unlit', 32, 17), enemy('unlit', 40, 22), enemy('unlit', 30, 26),
      enemy('chandler', 5, 30),
    ],
  };

  // ================================================================== TALLOW HOUSE
  M.tallow_house = {
    name: 'The House on Tallow Lane',
    region: 'city',
    theme: 'interior',
    music: 'city',
    weather: 'none',
    ambient: 0.76,
    ambientColor: '#0c0a10',
    indoor: true,
    floorTile: 'wood_floor',
    tiles: [
      "################",
      "######w##w######",
      "#k____________k#",
      "#______________#",
      "#______________#",
      "#______________#",
      "#_____uuuu_____#",
      "#_____uuuu_____#",
      "#______________#",
      "#______________#",
      "#######D########",
    ],
    spawns: {
      door: [7, 9, 'up'],
    },
    entities: [
      { type: 'exit', x: 7, y: 10, w: 1, h: 1, to: 'upper_city', spawn: 'tallow_door' },
      { type: 'trigger', id: 'c_t_tallow', x: 6, y: 8, w: 3, h: 2, dialogue: 'c_tallow_first' },
      // the cold hearth, and what lies in front of it
      solidProp('prop_hearth', 4.5, 2),
      { type: 'sign', x: 4.5, y: 3, sprite: null, title: 'Hearth', text: [
        'The hearth has been cold a long time. Beside it, a tallow-pan, scraped clean with a spoon.',
      ] },
      prop('prop_shroud', 3.5, 4.6), prop('prop_shroud', 5.6, 4.6),
      { type: 'sign', x: 4.5, y: 5, sprite: null, dialogue: 'c_shrouds' },
      // the children's things
      solidProp('prop_bed', 12, 3),
      { type: 'sign', x: 12, y: 4, sprite: null, title: 'Bed', text: [
        'A bed for two. The blankets are gone from it. You know where.',
      ] },
      { type: 'item', id: 'c_tag_tallow', x: 13.3, y: 4, item: 'tag_tallow',
        text: 'Tied to the bedpost with a child\'s bow. A tin tag, stamped and never worn.', do: ['quest:hound=99'] },
      { type: 'item', id: 'c_bird_drawing', x: 8, y: 2.4, item: 'lore_c_bird_drawing',
        text: 'Pinned under the window, where the light was best.' },
      solidProp('prop_desk', 11, 7),
      { type: 'item', id: 'c_pike_note', x: 11, y: 8, item: 'lore_c_pike_note',
        text: 'Folded on the table, weighted with a spoon, addressed in capitals: DA.' },
      prop('prop_toy_horse', 7.5, 6.8), prop('prop_toy_horse', 3, 8.6, { flip: true }),
      solidProp('prop_barrel', 2, 8), solidProp('prop_crate', 14, 8.2),
      { type: 'sign', x: 8.4, y: 9, sprite: null, title: 'By the Door', text: [
        'A dog\'s bowl by the door, licked so clean the glaze is gone.',
        'Low on the door, on the inside, a child has drawn a line in soot and written GRIP beside it. It is about the height of a dog\'s head.',
      ] },
      // light: the Pyre's glow through the windows, and grey daylight through the broken roof
      { type: 'light', x: 6, y: 2, r: 40, color: PYRE, intensity: 0.5, flicker: 0.2 },
      { type: 'light', x: 9, y: 2, r: 40, color: PYRE, intensity: 0.5, flicker: 0.2 },
      { type: 'light', x: 8, y: 5, r: 90, color: COLD, intensity: 0.5 },
      { type: 'emitter', x: 8, y: 4, kind: 'ash' },
    ],
  };

  // ================================================================== PALACE (throne room + royal chapel)
  M.palace = {
    name: 'The Palace of Lanthorn',
    region: 'city',
    theme: 'interior',
    music: 'city',
    weather: 'none',
    ambient: 0.7,
    ambientColor: '#100a12',
    indoor: true,
    tiles: [
      "####################################",
      "####w#####w#####w#####w###w####w####",
      "#=======================#==========#",
      "#=======================#=*======*=#",
      "#========sssssss========#==========#",
      "#==========uuu==========#=ppp==ppp=#",
      "#==|=======uuu========|=#==========#",
      "#==========uuu==========#=ppp==ppp=#",
      "#==========uuu==========#==========#",
      "#==========uuu==========#=ppp==ppp=#",
      "#==|=======uuu========|=#==========#",
      "#==========uuu==========#=ppp==ppp=#",
      "#==========uuu=====================#",
      "#==========uuu=====================#",
      "#==|=======uuu========|=#==========#",
      "#==========uuu==========############",
      "#==========uuu==========############",
      "#==========uuu==========############",
      "#==|=======uuu========|=############",
      "#==========uuu==========############",
      "#*=========uuu=========*############",
      "#==========uuu==========############",
      "#==========uuu==========############",
      "############D#######################",
    ],
    spawns: {
      door: [12, 21, 'up'],
    },
    entities: [
      { type: 'exit', x: 12, y: 23, w: 1, h: 1, to: 'upper_city', spawn: 'palace_door' },
      { type: 'trigger', id: 'c_t_palace', x: 10, y: 20, w: 5, h: 3, dialogue: 'c_palace_first' },

      // ---- the throne
      solidProp('prop_throne', 12, 3),
      { type: 'sign', x: 12, y: 3.2, sprite: null, title: 'The Throne of Lanthorn', text: [
        'The crown is on the seat, upside down and full of ash, as though someone set it there to go and answer a door.',
        'Nobody has sat here since. Nobody has quite dared to move the crown.',
      ] },
      { type: 'item', id: 'c_kings_order', x: 13.4, y: 4, item: 'lore_c_kings_order',
        text: 'On the throne steps, trodden on by many feet. Nobody ever picked it up.' },
      candelabra(9, 3, 50), candelabra(15, 3, 50),
      prop('prop_banner', 5, 2), prop('prop_banner', 19, 2), prop('prop_banner', 8, 2), prop('prop_banner', 16, 2),

      // ---- the Queen's feast: four tables, forty places
      solidProp('prop_table_feast', 12, 8), solidProp('prop_table_feast', 12, 11),
      solidProp('prop_table_feast', 12, 14), solidProp('prop_table_feast', 12, 17),
      { type: 'sign', x: 12, y: 18.2, sprite: null, title: 'The Feast', text: [
        'Forty places, set for children. At each a small cup, a spoon, and a card in the same careful hand.',
        'DAVY TULL. MAUDIE. TOBIAS. NELL SAYER\'S BOY. ANNOT AND HER SISTER. JENNET PIKE. The cards go on, table after table.',
        'At the head of the first table, nearest the throne, one card is written more carefully than the rest. It says WREN.',
      ] },
      candles(10, 9.4, 30), candles(14, 12.4, 30), candles(10, 15.4, 30), candles(14, 18.4, 30),
      { type: 'npc', x: 9, y: 11, npc: 'queen', dir: 'right' },

      // ---- the hall
      { type: 'light', x: 12, y: 12, r: 110, color: COLD, intensity: 0.35 },
      { type: 'light', x: 4, y: 2, r: 36, color: COLD, intensity: 0.5 },
      { type: 'light', x: 20, y: 2, r: 36, color: COLD, intensity: 0.5 },
      candelabra(2, 12), candelabra(22, 8), candelabra(2, 17), candelabra(22, 16),
      prop('prop_ash_pile', 4, 19), prop('prop_ash_pile', 20, 21), prop('prop_rubble', 21, 13),
      { type: 'emitter', x: 12, y: 6, kind: 'motes' },

      // ---- the royal chapel
      solidProp('prop_altar', 29.5, 2.6),
      candelabra(27, 2.6), candelabra(32, 2.6),
      { type: 'item', id: 'c_chapel_tallow', x: 29.5, y: 3.4, item: 'tallow_stub',
        text: 'A stub of good tallow left on the altar, as an offering. The Candlemother will not miss it.' },
      solidProp('prop_statue_saint', 26, 4),
      { type: 'sign', x: 26, y: 5, sprite: null, title: 'The Candlemother', text: [
        'The Candlemother, her hands cupped around nothing. Somebody has put a candle-stub in them. It has burned all the way down into her palms.',
      ] },
      candelabra(34, 4),
      { type: 'sign', x: 34, y: 5, sprite: null, title: 'The Archchandler\'s Chair', text: [
        'A tall chair beside the altar, carved all over with open hands. The cushion is scorched through in the shape of a man who sat very still in it.',
        'The Archchandler\'s chair. He is not in it. Wherever he went, he went down, toward the fire.',
      ] },
      { type: 'light', x: 29.5, y: 8, r: 70, color: CANDLE, intensity: 0.4, flicker: 0.1 },
      enemy('chandler', 29, 12),
    ],
  };
})(window.AV);
