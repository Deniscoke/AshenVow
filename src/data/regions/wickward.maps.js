// ASHEN VOW — Hallowhearth, the lower half: the Wickward, the infirmary (Row 3, Cot 11) and the Pyre (builder: CITY/WICKWARD)
// Contract: BIBLE §7.5. The upper half (royal_road, upper_city, tallow_house, palace) lives in city.maps.js.
(function (AV) {
  'use strict';
  const M = AV.data.maps;

  const WARM = '#f59a36';
  const CANDLE = '#fccf63';
  const EMBER = '#b8361a';
  const DEEP_EMBER = '#7a1c10';
  const FIRE = '#e2621f';
  const COLD = '#82a8ad';
  const PALE = '#cbc4c3';

  // every door in the Wickward carries the Open Hand
  const HAND_DOORS = [[5, 6], [14, 6], [42, 6], [50, 6], [9, 13], [42, 12], [50, 12], [33, 13], [6, 29], [15, 29], [43, 29], [50, 29]];

  // ------------------------------------------------------------------ the Wickward
  M.wickward = {
    name: 'The Wickward',
    region: 'city',
    theme: 'wickward',
    music: 'wickward',
    weather: ['embers', 'ash'],
    ambient: 0.7,
    ambientColor: '#120608',
    indoor: false,
    tiles: [
      "##########################ssss##########################",
      "##########################ssss##########################",
      "#x^^^^^^^x^^^^^^^^x;;;;;;;;;;;;;;;;;;rx^^^^^^^a^^^^^^^x#",
      "#x^^^^^^^x^^^^^^^^x;;;;;;;;;;;;;;;;;;x.^^^^^^^.^^^^^^^x#",
      "#.^^^^^^^x^^^^^^^^x;;;;;;;;;;;;;;;;;;x.^^^^^^^x^^^^^^^x#",
      "#a^^^^^^^x^^^^^^^^b;;;;;;;;;;;;;;;;;;rx^^^^^^^x^^^^^^^x#",
      "#xBBwDwBBxBwBBDBwBx;;;;;;;;;;;;;;;;;;x.BwBDBwBxBBwDwBBx#",
      "#.xxxa....xxxxxbxxb;;;;;;;;;;;;;;;;;;rxa.xxx.axxa.xxxxa#",
      "#x^^^^^^^^^^^^^^^^xxxxxx.x;;;;xrxxxxrxrx.x..xa.bax.xaxr#",
      "#x^^^^^^^^^^^^^^^^x.BrrxrB;;;;BBBBBBBBx^^^^^^^x^^^^^^^x#",
      "#.^^^^^^^^^^^^^^^^xxrrrrrr;;;;BxrxxxxBx^^^^^^^x^^^^^^^.#",
      "#x^^^^^^^^^^^^^^^^.xrrxrrr;;;;B=xxxxrBr^^^^^^^x^^^^^^^x#",
      "#x^^^^^^^^^^^^^^^^xxrxrrxr;;;;BxxxxrxBxBwBDBwBrBBwDwBBx#",
      "#xBGwBwBBDBBwBBwBBxrxxxxr.;;;;BBBDBBBBb.xxx.xx.axxbxxxa#",
      "#xxxx.brx.xxx..xxxxxxxxxxx;;;;xb.x..rr.xxxbxxxxxxbxxxxx#",
      "#;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;#",
      "#ax.xxaxx.xxxxxxxxxxxaxx.b;;;;xrrxxxxxxxx.xbxx.xx.xxbxx#",
      "#xxxxx.rxxxxb.xxxxb.xa.xxa;;;;x.rxxbxxxxxxxxxxxxr.xx.xx#",
      "#xxx.xa.x.x.xb.xxLxxr..xxx;;;;axxxrxxxxxxbxrx.axxx.xx.a#",
      "#xx.bbaxxrxxxaxraxrxxbaxxx;;;;x.ba.xaxbxxxxaxxxxxxx.xxb#",
      "#;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;#",
      "#b.xx.x.xx.xxr.xxxxx.x.xxx;;;;xb.xb..axx.xxx.ab...xbx.x#",
      "Gxxbrxxxx.xbx.rx.brx.axaxr;;;;x.b.xxxx.xxx...Lxx.bxxx..#",
      "Gbx..x..xxrxaxaxarbxx.x.xx;;;;.xxx.xxbxxxx.xbaa.xbbxxxx#",
      "#xrxaxxa.xxLbxa.xaarrxa.ax;;;;xxxLLx.xxbx.bxxarx.x.axxr#",
      "#xrxxx.xxxxxxx..xxxxb..rxa;;;;xxb.rxxx.xxx.xxxxxxx.xx.x#",
      "#xx^^^^^^^xa^^^^^^^..x.bbx;;;;xrxxxx.xxx^^^^^^^x^^^^^^x#",
      "#x.^^^^^^^xx^^^^^^^a..x.xx;;;;xxxaxx.abx^^^^^^^x^^^^^^x#",
      "#xx^^^^^^^xx^^^^^^^b.xxxxx;;;;xxrx.bxrxx^^^^^^^x^^^^^^x#",
      "#xxBwBDBwBx.BBwDwBBbxxxaxx;;;;bxxx.xxxbaBwBDBwBxBwDBwBx#",
      "#xxxxxabxxxbxbaxbab;;;;;;;;;;;;;;;;;.xxxr.xr.xaxxxx.xax#",
      "#BBBBBBBxaxaxaxxx.x;;;;;;;;;;;;;;;;;..axxxxxx.bxxxxarxx#",
      "#xxxxxxBrxx.xx.xrxx;;;;*;;;;;;;;;;;;.a..xbr.x.xab..xrrx#",
      "#xxxxxxCxbx.ba.arax;;;*;;;;;;;;;;;;;xxL.xrxxx.xarxxxx..#",
      "#xxxxxxBx.xaxxxx..b;;*;*;;;;;;;;;;;;.b.xxaxxaxxxxxxxxx.#",
      "##########################...###########################",
      "##########################...###########################",
      "#########################LxxxL##########################",
      "#########################LxxxL##########################",
      "##########################xxx###########################",
    ],
    spawns: {
      upper: [27.5, 3, 'down'],
      infirmary_door: [9, 15, 'down'],
      pyre: [27, 37, 'up'],
    },
    entities: [
      // ---- ways in and out
      { type: 'exit', x: 26, y: 0, w: 4, h: 1, to: 'upper_city', spawn: 'wickward' },
      { type: 'door', x: 9, y: 13, to: 'wickward_infirmary', spawn: 'door' },
      { type: 'barrier', id: 'c_pyre_gate', x: 26, y: 35, w: 3, h: 2, sprite: 'prop_gate_bars', lockIf: '!knows_wren',
        lockedText: 'The Pyre gate. The bars are hot enough to feel through the gauntlet. There is no lock. It simply will not move for you. Not yet.',
        openText: 'This time the bars give under your hand, as if they had only been waiting for you to know why you had come.' },
      { type: 'exit', x: 26, y: 39, w: 3, h: 1, to: 'pyre', spawn: 'entry' },

      // ---- first steps down: chapter IV
      { type: 'trigger', id: 'w_t_ch4', x: 24, y: 2, w: 8, h: 3, if: 'chapter<4', dialogue: 'w_arrive', do: ['chapter:4'] },
      { type: 'light', x: 27.5, y: 1.5, r: 70, color: PALE, intensity: 0.45, flicker: 0.05 },

      // ---- the Chandlers' post: shrine, the notice, the lamp order
      { type: 'shrine', x: 32, y: 4, id: 'shrine_wickward', name: "The Chandlers' Post" },
      { type: 'sign', x: 21, y: 3, sprite: 'prop_signpost', title: 'Notice', text: [
        'NOTICE. By order of His Majesty, on the Eve of the Last Vigil the Wickward gate shall be shut at dusk, and not opened.',
        'The Chandlers will attend the district. Let every soul within keep to the house the Hand is painted on. Keep your flame.',
        'Someone has scratched a line under "by order of His Majesty". Only a line. Whoever did it could not think of the word.',
      ] },
      { type: 'item', id: 'w_lore_lamps', x: 35, y: 6, item: 'lore_w_lamps', text: 'A paper, pinned under a stone on the step of the post. Still legible. Paper keeps, down here, better than people.' },
      { type: 'prop', x: 19, y: 5, sprite: 'prop_tag_chimes' },
      { type: 'prop', x: 36, y: 3, sprite: 'prop_tag_chimes' },
      { type: 'sign', x: 36, y: 4, sprite: null, title: 'Tag-Chimes', text: [
        'Tin tags on cords, hung from a burned beam. Hundreds of them. When the hot air moves, they ring against each other.',
        'Someone hung them here after. So the names would be said, even if only by the wind. The wind does not pronounce them well.',
      ] },
      { type: 'emitter', x: 5, y: 4, kind: 'smoke' },
      { type: 'emitter', x: 50, y: 4, kind: 'smoke' },

      // ---- the doors (every one of them marked)
      ...HAND_DOORS.map(([x, y]) => ({ type: 'decal', x, y, sprite: 'prop_hand_mark' })),
      { type: 'sign', x: 5, y: 6, sprite: null, title: 'A Door', text: [
        'Nailed shut from outside. The Open Hand is painted across the boards, and under it, in chalk, in a steady hand: WE ARE STILL IN HERE.',
      ] },
      { type: 'sign', x: 14, y: 6, sprite: null, title: 'A Door', text: [
        'Chalk on the lintel, in a child\'s letters, very neat: MAM SAYS WE ARE NOT TO OPEN IT FOR ANYONE.',
        'They didn\'t.',
      ] },
      { type: 'sign', x: 50, y: 6, sprite: null, title: 'A Door', text: [
        'This door stands open. Inside, a table laid for four. Four bowls, four spoons, a loaf gone to charcoal. Someone was expecting to eat.',
      ] },
      { type: 'sign', x: 42, y: 12, sprite: null, title: 'A Door', text: [
        'The Hand is painted here twice: once in the Chandlers\' red, and once beside it, smaller, reaching up to hold the first.',
      ] },
      { type: 'sign', x: 6, y: 29, sprite: null, title: 'A Door', text: [
        'Scratched into the doorpost, a tally. Twenty-two marks. Days, perhaps. Then nothing, and then, lower down and very shaky, one more.',
      ] },
      { type: 'sign', x: 15, y: 29, sprite: null, title: 'A Door', text: [
        'On this door the Hand has been painted over with something darker, so that only the flame shows. Someone did not want to be counted.',
      ] },

      // ---- the infirmary and the drain
      { type: 'sign', x: 12, y: 14, sprite: null, title: 'Over the Door', text: [
        'Carved in the lintel, under the soot: INFIRMARY OF THE WICKWARD. ROWS ONE TO NINE. VISITORS AT THE GATE ONLY.',
      ] },
      { type: 'npc', x: 3, y: 14, npc: 'w_kit', dir: 'right', if: '!w_kit_went' },
      { type: 'prop', x: 18, y: 14, sprite: 'prop_tag_chimes' },

      // ---- Wick Lane: the well, Tamsin's step, the chandlery
      { type: 'prop', x: 28, y: 8, sprite: 'prop_well', solid: true },
      { type: 'sign', x: 29, y: 7, sprite: null, title: 'The Well', text: [
        'The well at the top of Wick Lane. Left here. You don\'t need to look for the turning. Your feet already have.',
      ] },
      { type: 'npc', x: 22, y: 13, npc: 'w_tamsin', dir: 'down' },
      { type: 'emitter', x: 22, y: 11, kind: 'smoke' },
      { type: 'sign', x: 32, y: 14, sprite: null, title: 'The Hook', text: [
        'Over the doorway, an iron hook where a sign hung. The sign has burned away. You know what it said.',
        'You swung on this hook when you were six, and it held, and your father said a thing about it that you have never repeated.',
      ] },
      { type: 'item', id: 'w_tallow', x: 33, y: 11, item: 'tallow_stub',
        text: 'A tallow stub, still in its tin mould. Your father\'s mould. The dent in the rim is where you dropped it, aged seven. He did not speak to you for a day.' },
      { type: 'light', x: 33.5, y: 11, r: 38, color: CANDLE, intensity: 0.6, flicker: 0.2 },

      // ---- the main street, the lamplighter, the fallen tag
      { type: 'prop', x: 37, y: 17, sprite: 'prop_lamp_post', anim: 'unlit', solid: true },
      { type: 'npc', x: 38, y: 18, npc: 'w_pell', dir: 'left' },
      { type: 'prop', x: 34, y: 16, sprite: 'prop_tag_chimes' },
      { type: 'item', id: 'w_tag_ward', x: 35, y: 17, item: 'tag_ward', text: 'One tag has fallen from the chimes. The cord burned through. Two smaller tags are still knotted to it.' },
      { type: 'prop', x: 11, y: 21, sprite: 'prop_tag_chimes' },
      { type: 'prop', x: 47, y: 16, sprite: 'prop_tag_chimes' },
      { type: 'prop', x: 8, y: 24, sprite: 'prop_tag_chimes' },
      { type: 'light', x: 12, y: 17, r: 52, color: DEEP_EMBER, intensity: 0.8, flicker: 0.2 },
      { type: 'light', x: 27.5, y: 20, r: 48, color: DEEP_EMBER, intensity: 0.6, flicker: 0.2 },
      { type: 'emitter', x: 27, y: 20, kind: 'ash' },

      // ---- the Snuffer, waiting where the tanners were
      { type: 'npc', x: 47, y: 14, npc: 'snuffer', dir: 'left', if: '!sn_wickward' },

      // ---- Tanners' Row: the carter, the wall, Bett
      { type: 'prop', x: 43, y: 18, sprite: 'prop_cart', solid: true, flip: true },
      { type: 'npc', x: 45, y: 18, npc: 'w_wat', dir: 'left' },
      { type: 'light', x: 44, y: 14, r: 50, color: DEEP_EMBER, intensity: 0.8, flicker: 0.2 },
      { type: 'emitter', x: 45, y: 23, kind: 'smoke' },
      { type: 'prop', x: 54, y: 22, sprite: 'prop_tag_chimes' },
      { type: 'corpse', id: 'w_bett', x: 53, y: 23, sprite: 'prop_corpse_pilgrim', item: 'tag_bett', text: [
        'A woman sits at the foot of the district wall, facing up, toward the watch-walk. As close as the wall would let her get.',
        'A length of string hangs down the wall from above. At the bottom it is knotted round a crust, gone to charcoal. Someone up there used to lower her bread.',
        'Her tag is in her lap, where she could read it. BETT DUNMORE. On the back, scratched with a knife point: H.',
      ] },

      // ---- the postern the watch held from inside
      { type: 'npc', x: 2, y: 22, npc: 'w_watch', dir: 'right' },
      { type: 'light', x: 1.5, y: 22.5, r: 36, color: COLD, intensity: 0.5 },

      // ---- the south: ruins, the grave-iron yard, the Chandler with the oil
      { type: 'item', id: 'w_grave_iron', x: 3, y: 33, item: 'grave_iron',
        text: 'A coffin-nail of grave-iron as long as your hand. They stopped making coffins in the Wickward some while before they stopped making nails.' },
      { type: 'light', x: 3, y: 33, r: 34, color: EMBER, intensity: 0.5, flicker: 0.2 },
      { type: 'light', x: 8, y: 31, r: 48, color: DEEP_EMBER, intensity: 0.7, flicker: 0.2 },
      { type: 'light', x: 20, y: 26, r: 48, color: DEEP_EMBER, intensity: 0.7, flicker: 0.2 },
      { type: 'light', x: 46, y: 32, r: 52, color: DEEP_EMBER, intensity: 0.8, flicker: 0.2 },
      { type: 'emitter', x: 33.5, y: 24, kind: 'embers' },
      { type: 'emitter', x: 50, y: 27, kind: 'smoke' },
      { type: 'emitter', x: 13, y: 27, kind: 'smoke' },
      { type: 'prop', x: 17, y: 30, sprite: 'prop_tag_chimes' },
      { type: 'prop', x: 40, y: 31, sprite: 'prop_tag_chimes' },
      { type: 'prop', x: 36, y: 22, sprite: 'prop_ash_pile' },
      { type: 'prop', x: 10, y: 17, sprite: 'prop_ash_pile' },
      { type: 'prop', x: 51, y: 33, sprite: 'prop_rubble' },
      { type: 'prop', x: 22, y: 21, sprite: 'prop_toy_horse' },
      { type: 'corpse', id: 'w_oilman', x: 30, y: 32, sprite: 'prop_corpse_pilgrim', text: [
        'A Chandler in grey, face down in the gutter before the Pyre gate, an oil-jar still hooked on one finger.',
        'He was pouring when it caught. The fire did not wait for him to finish. His purse is full of eye-pennies he never had time to spend.',
      ], do: ['pennies:+80'] },

      // ---- the Pyre gate and the man who tends it
      { type: 'prop', x: 24, y: 31, sprite: 'prop_brazier', solid: true, light: { r: 56, color: WARM, flicker: 0.15 } },
      { type: 'prop', x: 31, y: 31, sprite: 'prop_brazier', solid: true, light: { r: 56, color: WARM, flicker: 0.15 } },
      { type: 'prop', x: 22, y: 34, sprite: 'prop_candles', light: { r: 40, color: CANDLE, flicker: 0.2 } },
      { type: 'prop', x: 25, y: 33, sprite: 'prop_candles', light: { r: 34, color: CANDLE, flicker: 0.2 } },
      { type: 'prop', x: 20, y: 32, sprite: 'prop_candelabra' },
      { type: 'npc', x: 24, y: 34, npc: 'ormund', dir: 'right', if: '!ormund_killed' },
      { type: 'trigger', id: 'w_t_ormund', x: 22, y: 30, w: 10, h: 2, if: '!ormund_killed && !ormund_left && !w_ormund_met', dialogue: 'w_ormund' },
      { type: 'item', id: 'w_lore_sermon', x: 21, y: 33, item: 'lore_w_sermon', text: 'Loose pages, weighted down with a candle-end so the heat would not lift them.' },
      { type: 'sign', x: 29, y: 34, sprite: null, title: 'The Pyre Gate', text: [
        'Beyond the bars the ash is falling upward. The light comes through in bands, like a door left open onto a room where someone is still awake.',
      ] },
      { type: 'light', x: 27.5, y: 36, r: 110, color: FIRE, intensity: 1.1, flicker: 0.2 },
      { type: 'light', x: 27.5, y: 38.5, r: 80, color: WARM, intensity: 1, flicker: 0.25 },
      { type: 'emitter', x: 27, y: 37, kind: 'embers' },

      // ---- the burned (passive) and the Unlit (not)
      { type: 'enemy', x: 24, y: 21, kind: 'greyfolk' },
      { type: 'enemy', x: 31, y: 19, kind: 'greyfolk' },
      { type: 'enemy', x: 12, y: 18, kind: 'greyfolk' },
      { type: 'enemy', x: 40, y: 23, kind: 'greyfolk' },
      { type: 'enemy', x: 29, y: 27, kind: 'greyfolk' },
      { type: 'enemy', x: 47, y: 33, kind: 'greyfolk' },
      { type: 'enemy', x: 14, y: 32, kind: 'greyfolk' },
      { type: 'enemy', x: 5, y: 7, kind: 'greyfolk' },
      { type: 'enemy', x: 44, y: 31, kind: 'unlit' },
      { type: 'enemy', x: 20, y: 27, kind: 'unlit' },
      { type: 'enemy', x: 36, y: 28, kind: 'unlit' },
    ],
  };

  // ------------------------------------------------------------------ the infirmary: Row 3, Cot 11
  // Rows of fourteen cots (7 either side of the aisle). Cot numbers run left to right: cot n sits at COT_X[n-1].
  const COT_X = [2, 4, 6, 8, 10, 12, 14, 17, 19, 21, 23, 25, 27, 29];
  const ROW_Y = [4, 8, 12, 16];
  const cots = [];
  ROW_Y.forEach((y, r) => COT_X.forEach((x, i) => {
    const row = r + 1, cot = i + 1;
    if (row === 4 && x >= 25) return;                    // the nurses' station stands here
    if (row === 3 && cot === 11) return;                 // Cot 11 is placed on its own, empty
    const empty = (row * 7 + cot * 3) % 5 === 0;         // a few were empty before the fire, too
    cots.push({ type: 'decal', x, y, sprite: 'prop_cot', anim: empty ? 'idle' : 'body' });
  }));

  M.wickward_infirmary = {
    name: 'The Wickward Infirmary',
    region: 'city',
    theme: 'wickward',
    music: 'wickward',
    weather: 'none',
    ambient: 0.72,
    ambientColor: '#0a0a12',
    indoor: true,
    tiles: [
      "################################",
      "####w######w########w######w####",
      "#ax===x=========x===xxa====arrG#",
      "#==x=x=ax=x===xx=x==a=xx=====rr#",
      "#x===x==xx=x======x====xx=====r#",
      "#xx=x=xaxx===xx===xx====x======#",
      "#===x==axxxxxxxx=xx=xxxx=x=x===#",
      "#a==x==x==x==x===x=====a=====x=#",
      "#==x==x==xx=xx======x=xx===x=xx#",
      "#=====xxxxxax==x=xa==xx=x=x=x==#",
      "#==xx======x=x=====x==x=x==xxxx#",
      "#=====x=====x=x==x==a===x=x====#",
      "#=====xx====x==xxx===x===x===xx#",
      "#ax=x=xx==x==x====x=======x=xx=#",
      "#xxxx======xx===x==x=====xx=x==#",
      "#===xx===a==xx===x=x=x=========#",
      "#x======x====x=x=xxx==x=====x=a#",
      "#r===x=========x=x=x===x==x====#",
      "#rr=xx=====xx======x=x=x==x=xxx#",
      "###############DD###############",
    ],
    spawns: { door: [15.5, 17, 'up'] },
    entities: [
      { type: 'exit', x: 15, y: 19, w: 2, h: 1, to: 'wickward', spawn: 'infirmary_door' },

      // ---- the rows
      ...cots,
      { type: 'decal', x: 23, y: 12, sprite: 'prop_cot', anim: 'idle' },
      { type: 'item', id: 'w_bird', x: 23, y: 11.1, item: 'wren_bird', sprite: 'prop_bird', if: '!has:wren_bird',
        text: 'A wooden bird on the pillow of Cot 11, scorched down one side. The beak is too long. The wings don\'t match. You made it.' },
      { type: 'trigger', id: 'w_t_cot11', x: 18, y: 9, w: 12, h: 6, dialogue: 'w_cot11' },
      { type: 'sign', x: 1, y: 4, sprite: null, title: 'Row Board', text: ['ROW 1 — THE OLD. Painted on the post in square letters. Fourteen chalk marks under it, most of them crossed through.'] },
      { type: 'sign', x: 1, y: 8, sprite: null, title: 'Row Board', text: ['ROW 2 — MEN. The chalk marks under it have been rubbed out and redone so often the post is white.'] },
      { type: 'sign', x: 1, y: 12, sprite: null, title: 'Row Board', text: [
        'ROW 3 — CHILDREN. Fourteen chalk marks, in a nurse\'s neat hand. None of them crossed out.',
        'Under the marks, smaller: BE GOOD. BE QUIET. THE DARK IS SHORTER THAN IT LOOKS.',
      ] },
      { type: 'sign', x: 1, y: 16, sprite: null, title: 'Row Board', text: ['ROW 4 — WOMEN. Someone has drawn a flower beside each chalk mark. The flowers are better than the marks.'] },
      { type: 'prop', x: 1, y: 11, sprite: 'prop_candelabra', light: { r: 44, color: CANDLE, flicker: 0.15 } },

      // ---- the nurse, and whoever comes to be counted
      { type: 'npc', x: 30, y: 12, npc: 'agna', dir: 'left', if: '!w_agna_home' },
      { type: 'npc', x: 30, y: 14, npc: 'w_kit_inf', dir: 'left', if: 'w_kit_went' },
      { type: 'npc', x: 4, y: 5, npc: 'w_patient', dir: 'right' },
      { type: 'prop', x: 30, y: 10, sprite: 'prop_candles', light: { r: 46, color: CANDLE, flicker: 0.18 } },
      { type: 'prop', x: 30, y: 16, sprite: 'prop_candles', light: { r: 36, color: CANDLE, flicker: 0.18 } },

      // ---- the nurses' station
      { type: 'prop', x: 28.5, y: 17, sprite: 'prop_desk', solid: true },
      { type: 'item', id: 'w_lore_count', x: 26, y: 17, item: 'lore_w_count', text: 'A child\'s writing-slate, used for grown-up sums. It has not been wiped since.' },
      { type: 'light', x: 27, y: 17, r: 40, color: WARM, intensity: 0.6, flicker: 0.2 },

      // ---- the drain in the corner, where the roof came in
      { type: 'sign', x: 29, y: 4, sprite: null, title: 'The Drain', text: [
        'In the corner, where the roof came in, a drain grate. Two of its bars are bent apart. Wide enough for someone small.',
        'Or for someone carrying someone small, if they went in feet first and did not mind the dark.',
      ] },
      { type: 'light', x: 29, y: 3, r: 60, color: COLD, intensity: 0.55 },
      { type: 'emitter', x: 29, y: 3, kind: 'ash' },
      { type: 'light', x: 15.5, y: 17.5, r: 44, color: PALE, intensity: 0.4 },
      { type: 'light', x: 8, y: 9, r: 50, color: COLD, intensity: 0.35 },
    ],
  };

  // ------------------------------------------------------------------ the Unending Pyre (final arena)
  M.pyre = {
    name: 'The Unending Pyre',
    region: 'city',
    theme: 'pyre',
    music: 'pyre',
    weather: ['embers', 'ash'],
    ambient: 0.5,
    ambientColor: '#1a0806',
    indoor: false,
    onEnter: ['unset:w_pyre_lit'],
    tiles: [
      "##############################",
      "##############################",
      "#a.b.bxxx.ax.a.x..axxx...a...#",
      "#.x.........axx.bxxxa..x..x..#",
      "#xxxxxx....a...xxxx..abx.x.x.#",
      "#xbx.xx.xLxa.xxaxa.xLxb.a.xx.#",
      "#x.ax.x...L.xxxxxbxLbx..x..xa#",
      "#...xax.a.xLL.x.bLL.axx.....x#",
      "#...x.xxx..x..a..x.......b..x#",
      "#bx.xa..xx..a.a..x...b.x.x..b#",
      "#xxx...x..xxx..axxx...xx..x..#",
      "#xaaa....bxb.x.xxa....x...bxx#",
      "#x....xxxx.a..xxxa.a...xx.x..#",
      "#.x.xxa...xbxx..xx.x..xx....x#",
      "#x..bxxx.xx.xx.x.x..a.x.x..xx#",
      "#a..xx.x.x......bx.x..xx.xa.x#",
      "#.xxb.xx..xaxxaxxx...ax..x.x.#",
      "#xx.x..x.a.b..x...x.....xa.xx#",
      "#.xa.b.x.x.xxxaax.xbaxxxxxxxx#",
      "#....a.xax..a.xax..x.xxx..xx.#",
      "#x.x.b..a.x.xx.xx.x..axb...xx#",
      "#.x.xaxaxx...a..xxaxx.x..xxa.#",
      "#############xxxx#############",
      "##############xx##############",
    ],
    spawns: { entry: [14.5, 20, 'up'] },
    entities: [
      { type: 'exit', x: 14, y: 23, w: 2, h: 1, to: 'wickward', spawn: 'pyre' },

      // ---- the fire itself
      { type: 'prop', x: 14.5, y: 6, sprite: 'prop_pyre', solid: true },
      { type: 'light', x: 14.5, y: 4, r: 190, color: WARM, intensity: 1.3, flicker: 0.2 },
      { type: 'light', x: 14.5, y: 8, r: 90, color: FIRE, intensity: 1, flicker: 0.25 },
      { type: 'emitter', x: 14.5, y: 5, kind: 'embers' },
      { type: 'emitter', x: 11, y: 6, kind: 'smoke' },
      { type: 'emitter', x: 18, y: 6, kind: 'smoke' },

      // ---- what the fire kept
      { type: 'prop', x: 3, y: 4, sprite: 'prop_tag_chimes' },
      { type: 'prop', x: 26, y: 4, sprite: 'prop_tag_chimes' },
      { type: 'prop', x: 2, y: 13, sprite: 'prop_tag_chimes' },
      { type: 'prop', x: 27, y: 14, sprite: 'prop_tag_chimes' },
      { type: 'prop', x: 5, y: 9, sprite: 'prop_ash_pile' },
      { type: 'prop', x: 23, y: 10, sprite: 'prop_ash_pile' },
      { type: 'prop', x: 7, y: 17, sprite: 'prop_ash_pile' },
      { type: 'prop', x: 22, y: 18, sprite: 'prop_ash_pile' },
      { type: 'prop', x: 4, y: 20, sprite: 'prop_corpse_pilgrim' },
      { type: 'prop', x: 25, y: 20, sprite: 'prop_corpse_pilgrim', flip: true },
      { type: 'prop', x: 8, y: 3, sprite: 'prop_bone_pile' },
      { type: 'prop', x: 21, y: 3, sprite: 'prop_bone_pile' },
      { type: 'light', x: 4, y: 19, r: 50, color: EMBER, intensity: 0.6, flicker: 0.2 },
      { type: 'light', x: 25, y: 19, r: 50, color: EMBER, intensity: 0.6, flicker: 0.2 },
      { type: 'light', x: 14.5, y: 21, r: 56, color: DEEP_EMBER, intensity: 0.7, flicker: 0.2 },

      // ---- the approach, then the fire stands up (re-arms after a death: onEnter unsets w_pyre_lit)
      { type: 'trigger', id: 'w_t_pyre', once: false, x: 1, y: 17, w: 28, h: 2, if: '!boss_final && !w_pyre_lit', dialogue: 'w_pyre_approach' },
      { type: 'boss', x: 14.5, y: 9, boss: 'boss_final', startOn: 'manual', if: '!boss_final',
        arena: { x: 1, y: 2, w: 28, h: 20 }, onDefeat: ['dialogue:pyre_choice'] },

      // ---- after: he is always there
      { type: 'npc', x: 20, y: 8, npc: 'snuffer', dir: 'left', if: 'boss_final' },
    ],
  };
})(window.AV);
