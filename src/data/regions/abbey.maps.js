// ASHEN VOW — Lenten Mere: the drowned village, the causeway and the half-sunken abbey (builder: ABBEY)
(function (AV) {
  'use strict';
  const M = AV.data.maps;

  const WARM = '#f59a36';
  const CANDLE = '#fccf63';
  const COLD = '#82a8ad';
  const DEEP = '#537a86';

  // ------------------------------------------------------------------ the shore
  M.mere_shore = {
    name: 'Lenten Mere',
    region: 'abbey',
    theme: 'abbey',
    music: 'abbey',
    weather: 'rain',
    ambient: 0.58,
    ambientColor: '#0a0f18',
    indoor: false,
    tiles: [
      "################cccccccccccccccccccccccccccccccccccccccccccc",
      "################ccccccccccccccccccccccccccccDDDccccccccccccc",
      "#####wDDDw######ccccccccccccccccccccccccccccDDDccccccccccccc",
      "~~~=!=====!=~~~~~~~~~~~~~~~~~~~~~~~~mmmm,m,,:::,mm,,m,m,,,TT",
      "~~~=========~~~~~~~~~~~~~~~~~~~~~~~~-m,,,,,,,:,,,,BBBBBB,,TT",
      "~~~~~~===~~~~~~~~~~~~~~~~~~~~~~~~~~Rm,^^^^^,,:,,,,Br...B,,TT",
      "~~~~~~===~~~^^^~~~~~~~~~~~~~~~~~~~-,,,^^^^^,,:,,,,B..r.B,,TT",
      "~~~~~R===~~~^^^~~~~~~~~~~^^^^^~~~~~,,,^^^^^,,:,,,,B.r..B,t,T",
      "~~~~~~===-~~~~~~~~~~~~~~~^^^^^~~~~~-,,BWBWB,,:,,,,BBCBwB,,TT",
      "~~~~~~===~~~~~~~~~~~~~~~~^^^^^~~~~~-m,mmmmm,,:,,,,rr,,,,,,,T",
      "~~~~~~---~~~~~~~~~~~~~~~~~~~~~~~~~~~-,:::::::::::::::::::,TT",
      "~~~~~~---~~~~~~~~^^^^^~~~~~~~~~~~FFF-m,,,,,,,,,,::,,,,,,,,TT",
      "~R~~~~===~~~~~~~~^^^^^~~~~~~~~~~~~~~~~,,,,,,,,,,::,,,,,,,,TT",
      "~~~~~~===R~~~~~~~^^^^^~~~~~~~~~~~~~~~~m,,,,,,,,,::,,,,,,,,TT",
      "~~~~~-===~~~~~~~~~~~~~~~~~~~~^^^^~~~~,,,mm,,,,,,::,,,,,,,,TT",
      "~~~~-~===~~~~~~~~~~~~~~~~~~~~^^^^~~~-m,,,mm,,,,,::,,,,,,,,TT",
      "~~~~,,===,~~~~~~~~~~~~~~R~~~~~~~~~~-,,,,,,,,,,,,::,,,,mm,,TT",
      "~~~,,,===,,~-~~~~~~~~~~~~~~~~~~~~~~-,,,,,,,,,,,,::,,,,,m,t,T",
      "~~R,,,===,,t~~~R~~~~~~~~~~-~~~~~R~~,,,,mm,,,,,,,::,,,,,,,,TT",
      "~-,,,,=============---======--======,,,,,,,,,,,,::,,,,,,,,,T",
      "~-,,,,,,,==========---======--======::::::::::::::::::::::::",
      "~~m,,,,,,==========---======--======::::::::::::::::::::::::",
      "~~~R,,,,,,t~~-~~~~~~~~--~R~~~~~~~-~,,,,,,,,,,,,,,,,,,,,,,,TT",
      "~~~~~,,,,~~~~~~~~~~~~~--~~FFFF~~~~~-m,%,,,^^^^^^,,,,,,,,,t,T",
      "~~~~~~~~~~~~~^^^^~~~~~--~~~~~~~~~~~~-,,,,,^^^^^^,,,,,,,,,,TT",
      "~~~~~~~~~~~~~^^^^~~~-=====~~^^^^^~~~~-%%,,^^^^^^,,,,,,,,,,,T",
      "~~~~~~~~~~~~~~~~~~~~==|===~~^^^^^~~~~-m,,,BwBBwB,,,,,,,,,tTT",
      "~~~~~~~~~~~~~~~~~~~~=====-~~~~~~~~~~~~-m,:..::,,,,,,,,,,,t,T",
      "~~~R~~~~~~~~~~~~~~^^^^^^^^^^~~~~~________,,,,,,,,FFF,FFFF,TT",
      "~~~~~~~~~~~~~~~~~~^^^^^^^^^^~~~~~________,,,,,,,,F%,,%,,F,TT",
      "~~~~~~~~~~~^^^^^~~^^^^^^^^^^~~~~~~~~~~~-m,,,mm,,,F,,,,%,F,TT",
      "~~~~~~~~~~~^^^^^~~~~~~~~~~~^^^^^~~~~~~~~-,,,,m,,,F+,,,,+F,,T",
      "~~~~~~~~~~~^^^^^~~~~~~~~~~~^^^^^~~~~~~~~~-m,,,,,,F,%,,,%FtTT",
      "~~~~~~~~~~~~~~~~~FFFFF~~~~~^^^^^~~~~~~~~~~~m,,,,,FFFFFFFF,TT",
      "~~~~~~~R~~~~~~~~~~~~~~~~+~~~~~~~~~~~~~~~~~~-m,,,,,,,,,,,,,TT",
      "~~~~~~~~~~~~~~~~~~~~~~+~~~~~~~~~~~~~~~R~~~~~-,,,,,,,,,,,,,TT",
      "~~~~~~~~~~~~~~~~~~~~+~~~~~~~~~~~~~~~~~~~~~~~~-m,,,,,,,,,,,TT",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~t,tttt,,,,,,,T",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,TTTT,TTTTTT",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~TTTTTTTTTTT",
    ],
    spawns: {
      east: [57, 20, 'left'],
      abbey: [7, 4, 'down'],
      cave: [45, 4, 'down'],
    },
    entities: [
      // ---- ways out
      { type: 'exit', x: 59, y: 20, w: 1, h: 2, to: 'village', spawn: 'west' },
      { type: 'exit', x: 6, y: 2, w: 3, h: 1, to: 'abbey_cloister', spawn: 'gate' },
      { type: 'exit', x: 44, y: 1, w: 3, h: 1, to: 'well_cave', spawn: 'mere' },
      { type: 'barrier', id: 'a_grate', x: 44, y: 2, w: 3, h: 1, sprite: 'prop_gate_bars', lockIf: '!v_grate_opened',
        lockedText: 'A drain-grate across the culvert mouth. The bolt is on the far side, where the dark runs back under the hill. From here there is nothing to lift.',
        openText: 'The bolt was drawn from within. The grate swings in on hinges that scream like gulls.' },
      { type: 'trigger', id: 'a_t_grate', x: 44, y: 3, w: 3, h: 2, if: 'v_grate_opened && !open_a_grate', do: ['unlock:a_grate'] },
      { type: 'trigger', id: 'a_t_mere', x: 50, y: 18, w: 1, h: 5, dialogue: 'a_mere_first' },

      // ---- the road, the lamps
      { type: 'prop', x: 38, y: 19, sprite: 'prop_lamp_post', solid: true, light: { r: 60, color: WARM, flicker: 0.12 } },
      { type: 'prop', x: 53, y: 19, sprite: 'prop_lamp_post', solid: true, light: { r: 56, color: WARM, flicker: 0.12 } },
      { type: 'prop', x: 47, y: 11, sprite: 'prop_lamp_post', solid: true, light: { r: 56, color: WARM, flicker: 0.14 } },
      { type: 'prop', x: 41, y: 26, sprite: 'prop_lamp_post', solid: true, light: { r: 52, color: WARM, flicker: 0.14 } },
      { type: 'sign', x: 37, y: 22, sprite: 'prop_signpost', title: 'Parish Notice', text: [
        'LENTEN STAITHE. By leave of the Prior, the sick of this parish may come to the abbey gate at dusk.',
        'Bring a blanket. Bring your name, if you still have it. The brothers will ask you for it.',
      ] },
      { type: 'npc', x: 37, y: 19, npc: 'a_osric', dir: 'right', if: '!a_osric_rest' },

      // ---- the upper village: what the water left
      { type: 'sign', x: 40, y: 9, sprite: null, title: 'Chalk on a Door', text: [
        'Chalked on the door in a careful hand: GONE UP TO THE REST. BACK FOR THE HARVEST.',
      ] },
      { type: 'prop', x: 43, y: 9, sprite: 'prop_barrel', solid: true },
      { type: 'prop', x: 55, y: 12, sprite: 'prop_cart', solid: true },
      { type: 'decal', x: 52, y: 8, sprite: 'prop_hand_mark' },
      { type: 'corpse', id: 'a_oldman', x: 52, y: 6, sprite: 'prop_corpse_pilgrim', text: [
        'An old man slumped against a dead hearth, one blanket over his knees and another folded beside him, ready.',
        'Bring a blanket, the notice said. Someone bricked up his door from the outside before he could go, and painted the Hand across the new bricks.',
        'Under the folded blanket, a little stack of eye-pennies he had put by for himself. Nobody came to use them.',
      ], do: ['pennies:+60'] },
      { type: 'enemy', x: 43, y: 13, kind: 'censer' },
      { type: 'enemy', x: 53, y: 14, kind: 'censer' },

      // ---- the ferry-house, the jetty, the graves
      { type: 'decal', x: 45, y: 26, sprite: 'prop_hand_mark' },
      { type: 'sign', x: 45, y: 27, sprite: null, title: 'Ferry-House', text: [
        'The Open Hand is painted on the ferry-house door. Under it, scratched with a nail: WASHERWOMAN FROM THE CITY. KEEPS TO HERSELF. PAYS IN COPPER.',
      ] },
      { type: 'prop', x: 37, y: 27, sprite: 'prop_barrel', solid: true },
      { type: 'corpse', id: 'a_nell', x: 34, y: 28, sprite: 'prop_corpse_pilgrim', item: 'tag_shore', text: [
        'A woman lies at the end of the jetty with her face toward the abbey. She is grey to the jaw, further than the cold ever brought anyone back from.',
        'A tin tag is tied to her wrist with a strip of blanket. Her other hand still holds a child\'s mitten, knitted very small.',
        'From here you can see the high windows of the abbey. She was watching one of them.',
      ] },
      { type: 'emitter', x: 33, y: 29, kind: 'motes' },
      { type: 'npc', x: 37, y: 24, npc: 'a_wife', dir: 'left' },
      { type: 'sign', x: 52, y: 27, sprite: null, title: 'A Board', text: [
        'Nailed to the fence: THESE CAME UP OUT OF THE MERE. WE DID NOT KNOW THEIR NAMES. — THE SISTERS',
        'Someone has since set a small wooden bird on every grave. The birds are newer than the board.',
      ] },
      { type: 'prop', x: 51, y: 30, sprite: 'prop_grave_fresh', solid: true },
      { type: 'prop', x: 53, y: 30, sprite: 'prop_grave_fresh', solid: true },
      { type: 'prop', x: 52, y: 32, sprite: 'prop_grave_fresh', solid: true },
      { type: 'prop', x: 54, y: 32, sprite: 'prop_grave_fresh', solid: true },
      { type: 'prop', x: 53, y: 31, sprite: 'prop_candles', solid: false, light: { r: 40, color: CANDLE, flicker: 0.2 } },

      // ---- the causeway
      { type: 'prop', x: 4, y: 19, sprite: 'prop_statue_saint', solid: true },
      { type: 'prop', x: 10, y: 17, sprite: 'prop_lamp_post', solid: true, light: { r: 60, color: WARM, flicker: 0.12 } },
      { type: 'enemy', x: 7, y: 6, kind: 'toller' },
      { type: 'enemy', x: 7, y: 10, kind: 'novice' },
      { type: 'enemy', x: 6, y: 21, kind: 'toller' },
      { type: 'enemy', x: 4, y: 17, kind: 'censer' },
      { type: 'enemy', x: 20, y: 20, kind: 'novice' },
      { type: 'enemy', x: 28, y: 21, kind: 'novice' },

      // ---- the drowned church of Saint Ide, reached through the shallows
      { type: 'enemy', x: 22, y: 23, kind: 'novice' },
      { type: 'sign', x: 24, y: 26, sprite: null, title: "Saint Ide's", text: [
        "The spire of Saint Ide's, drowned to the belfry louvres. The weathercock still turns when the wind asks it to.",
        'When the wind comes round from the north, something far under your feet answers. A bell, very deep, a long way down.',
      ] },
      { type: 'prop', x: 21, y: 25, sprite: 'prop_bird', solid: false },
      { type: 'prop', x: 23, y: 25, sprite: 'prop_candles', solid: false, light: { r: 36, color: CANDLE, flicker: 0.2 } },
      { type: 'light', x: 22, y: 26, r: 48, color: COLD, intensity: 0.6, flicker: 0.05 },
      { type: 'item', id: 'a_breath', x: 21, y: 27, item: 'pilgrim_breath',
        text: 'Under the drowned spire, where a century of pilgrims\' prayers went up, something warm is still breathing out.' },
      { type: 'emitter', x: 22, y: 24, kind: 'motes' },

      // ---- the gate landing
      { type: 'light', x: 7, y: 3, r: 56, color: WARM, intensity: 0.8, flicker: 0.1 },

      // ---- mist on the water
      { type: 'emitter', x: 15, y: 27, kind: 'steam' },
      { type: 'emitter', x: 30, y: 12, kind: 'steam' },
      { type: 'emitter', x: 9, y: 33, kind: 'steam' },
      { type: 'emitter', x: 33, y: 24, kind: 'steam' },
      { type: 'emitter', x: 14, y: 9, kind: 'steam' },
    ],
  };

  // ------------------------------------------------------------------ the cloister
  M.abbey_cloister = {
    name: 'Lenten Mere Abbey',
    region: 'abbey',
    theme: 'abbey',
    music: 'abbey',
    weather: 'rain',
    ambient: 0.62,
    ambientColor: '#0a0e16',
    indoor: false,
    tiles: [
      "############################################",
      "############################################",
      "############################==##############",
      "############################==##############",
      "#############w##w##w###w##w#C#w#############",
      "####w##D#w##===-====rrr=========############",
      "##====-=====-========r==========############",
      "##==============================#ww#D#ww####",
      "##==m=======-=============================##",
      "##==--====================================##",
      "##===-==|==|==|==|==|==|==|==|==|==|======##",
      "##=-=====,,%--------------------,%,=======##",
      "##=======,t----------------------t,-====r=##",
      "##======|--------~~~~~~~~~~--------|======##",
      "##III====--------~~~====~~~--------=======##",
      "##ss-====--------~~~====~~~--------=======##",
      "##ss====|--------~~~====~~~---=----|======##",
      "##ss=====----==--~~~~--~~~~--=-----=======##",
      "##III====--------~~~~--~~~~--------=======##",
      "##===m==|--------~~~~--~~~~--------|======##",
      "##=======--------------------------===--==##",
      "##=======-,------------------------=======##",
      "##=======%,,-------------------,,%,=======##",
      "##======|=-|==|==|==|==|==|==|==|==|==m===##",
      "##=============-=============m========rRss##",
      "##======m=============================rrRs##",
      "##=r==-=======m===========---=======m=.rrR##",
      "##-===========r========================rr=##",
      "##=================!===!==================##",
      "####################===#####################",
      "####################===#####################",
      "####################===#####################",
      "####################===#####################",
      "####################===#####################",
    ],
    spawns: {
      gate: [21, 31, 'up'],
      scriptorium_door: [36, 9, 'down'],
      belfry_door: [7, 7, 'down'],
      undercroft_stairs: [4, 16, 'right'],
    },
    entities: [
      // ---- ways out
      { type: 'exit', x: 20, y: 33, w: 3, h: 1, to: 'mere_shore', spawn: 'abbey' },
      { type: 'door', x: 36, y: 7, to: 'abbey_scriptorium', spawn: 'door', sprite: 'prop_door_wood' },
      { type: 'door', x: 7, y: 5, to: 'abbey_belfry', spawn: 'door', sprite: 'prop_door_wood', lock: 'abbey_key',
        lockedText: 'Locked, and barred from within. Through the keyhole: dark water, and the slow sound of a bell.' },
      { type: 'exit', x: 2, y: 15, w: 1, h: 3, to: 'abbey_undercroft', spawn: 'stairs' },
      { type: 'trigger', id: 'a_t_cloister', x: 20, y: 29, w: 3, h: 2, dialogue: 'a_cloister_first' },

      // ---- the shrine by the gate
      { type: 'shrine', x: 17, y: 26, id: 'shrine_abbey', name: 'Cloister Walk' },
      { type: 'prop', x: 25, y: 27, sprite: 'prop_crate', solid: true },
      { type: 'prop', x: 41, y: 28, sprite: 'prop_barrel', solid: true },
      { type: 'prop', x: 3, y: 28, sprite: 'prop_crate', solid: true },

      // ---- the belfry door
      { type: 'prop', x: 5, y: 6, sprite: 'prop_candles', solid: false, light: { r: 40, color: CANDLE, flicker: 0.2 } },
      { type: 'prop', x: 9, y: 6, sprite: 'prop_candles', solid: false, light: { r: 40, color: CANDLE, flicker: 0.2 } },
      { type: 'sign', x: 8, y: 6, sprite: null, dialogue: 'a_belfry_lintel' },

      // ---- the church, and the anchoress in its wall
      { type: 'prop', x: 13, y: 5, sprite: 'prop_banner', solid: false },
      { type: 'prop', x: 26, y: 5, sprite: 'prop_banner', solid: false },
      { type: 'prop', x: 21, y: 5, sprite: 'prop_rubble', solid: true },
      { type: 'sign', x: 21, y: 6, sprite: null, title: 'Church Door', text: [
        'The church door is buried under fallen masonry. Cut into the lintel, just visible above the stones: THE DARK IS SHORTER THAN IT LOOKS.',
      ] },
      { type: 'corpse', id: 'a_anchoress', x: 29, y: 2, sprite: 'prop_corpse_monk', item: 'oath_ribbon', text: [
        'A cell no bigger than a grave, walled up from outside at the anchoress\'s own asking. A squint-hole looks toward where the altar was.',
        'She kept a ribbon, and tied a knot in it for every year of her vow. There are forty-one knots. The last is only half tied.',
      ] },

      // ---- the garth
      { type: 'prop', x: 21, y: 15, sprite: 'prop_statue_saint', solid: true },
      { type: 'sign', x: 21, y: 16, sprite: null, title: 'The Plinth', text: [
        'THE CANDLEMOTHER, WHO KNOWS EVERY FLAME BY NAME.',
        'Scratched into the plinth beneath, small and low, at a novice\'s height: THEN WHY MUST WE SAY THEM?',
      ] },
      { type: 'light', x: 22, y: 14, r: 56, color: COLD, intensity: 0.7, flicker: 0.05 },
      { type: 'npc', x: 23, y: 15, npc: 'snuffer', dir: 'down', if: '!sn_abbey' },
      { type: 'npc', x: 12, y: 12, npc: 'a_brother_bell', dir: 'up' },
      { type: 'prop', x: 14, y: 20, sprite: 'prop_bell_fallen', solid: true },
      { type: 'corpse', id: 'a_garth_monk', x: 29, y: 17, sprite: 'prop_corpse_monk', text: [
        'A brother lies face down in the garth, where the herbs were. His sandals are still laced.',
        'In his hand, a novice\'s slate: thirteen strokes of chalk. The last has been rubbed out, and drawn again, and rubbed out.',
      ] },
      { type: 'enemy', x: 13, y: 14, kind: 'novice' },
      { type: 'enemy', x: 31, y: 13, kind: 'novice' },
      { type: 'enemy', x: 27, y: 21, kind: 'novice' },
      { type: 'emitter', x: 22, y: 12, kind: 'steam' },
      { type: 'emitter', x: 12, y: 18, kind: 'steam' },
      { type: 'emitter', x: 21, y: 14, kind: 'motes' },

      // ---- the walks
      { type: 'enemy', x: 15, y: 7, kind: 'toller' },
      { type: 'enemy', x: 28, y: 8, kind: 'censer' },
      { type: 'enemy', x: 39, y: 17, kind: 'toller' },
      { type: 'enemy', x: 4, y: 23, kind: 'censer' },
      { type: 'light', x: 4, y: 11, r: 52, color: WARM, intensity: 0.8, flicker: 0.12 },
      { type: 'light', x: 39, y: 12, r: 52, color: WARM, intensity: 0.8, flicker: 0.12 },
      { type: 'light', x: 30, y: 6, r: 48, color: WARM, intensity: 0.7, flicker: 0.12 },
      { type: 'light', x: 11, y: 26, r: 52, color: WARM, intensity: 0.8, flicker: 0.12 },
      { type: 'light', x: 3, y: 16, r: 44, color: COLD, intensity: 0.7, flicker: 0.04 },
      { type: 'prop', x: 35, y: 8, sprite: 'prop_candles', solid: false, light: { r: 40, color: CANDLE, flicker: 0.2 } },

      // ---- the dormitory stair
      { type: 'npc', x: 37, y: 26, npc: 'a_brother_count', dir: 'up' },
      { type: 'sign', x: 38, y: 26, sprite: null, title: 'The Dormitory Stair', text: [
        'The dormitory stair climbs five steps and stops against fallen stone. Far above, a door stands open onto nothing, and the rain goes in.',
      ] },
      { type: 'corpse', id: 'a_wystan', x: 40, y: 27, sprite: 'prop_corpse_monk', text: [
        'A monk in a leather apron lies at the foot of the dormitory stair, half under the fallen stone. His hands are black with old grease.',
        'He is braced against the stones as if he had been holding them up. Whatever came down, he was under it, and the children were above it.',
      ] },
    ],
  };

  // ------------------------------------------------------------------ the scriptorium
  M.abbey_scriptorium = {
    name: 'The Scriptorium',
    region: 'abbey',
    theme: 'abbey',
    music: 'abbey',
    weather: 'none',
    ambient: 0.74,
    ambientColor: '#0b0d14',
    indoor: true,
    tiles: [
      "##############################",
      "##############################",
      "##w###w####w####w####w###w####",
      "##kkkk==-----------===kkkk#==#",
      "##====-=-----------=======#==#",
      "##======--=--------=-=====H==#",
      "##kkkkk=-=---------=kkkkk=#==#",
      "##=====-----==--=--=======#==#",
      "##========================####",
      "##kkkkk======uu=====kkkkk=####",
      "##===========uu====r======####",
      "##===========uu===========####",
      "##kkkkk======uu=====kkkkk=####",
      "##=====r=====uu===========####",
      "##===========uu=========-=####",
      "##=-=====r===uu===========####",
      "#############==###############",
      "#############DD###############",
    ],
    spawns: {
      door: [13, 15, 'up'],
    },
    entities: [
      { type: 'exit', x: 13, y: 17, w: 2, h: 1, to: 'abbey_cloister', spawn: 'scriptorium_door' },
      { type: 'prop', x: 11, y: 15, sprite: 'prop_candles', solid: false, light: { r: 40, color: CANDLE, flicker: 0.2 } },
      { type: 'prop', x: 16, y: 15, sprite: 'prop_candles', solid: false, light: { r: 40, color: CANDLE, flicker: 0.2 } },

      // ---- the Prior at his desk
      { type: 'prop', x: 13.5, y: 4, sprite: 'prop_desk', solid: true },
      { type: 'npc', x: 15, y: 4, npc: 'anselm', dir: 'left', if: '!anselm_truth' },
      { type: 'sign', x: 15, y: 4, sprite: null, if: 'anselm_truth', title: 'The Finished Letter', text: [
        'The letter on the desk is finished at last. It is signed, and blotted, though there was nothing to blot.',
        'The last line reads: I NO LONGER ASK YOU TO COME. ONLY REMEMBER THAT WE ASKED. — ANSELM, PRIOR, LENTEN MERE.',
      ] },
      { type: 'prop', x: 11, y: 3, sprite: 'prop_candelabra', solid: true, light: { r: 56, color: CANDLE, flicker: 0.15 } },
      { type: 'prop', x: 17, y: 3, sprite: 'prop_candelabra', solid: true, light: { r: 56, color: CANDLE, flicker: 0.15 } },
      { type: 'light', x: 14, y: 5, r: 36, color: COLD, intensity: 0.5, flicker: 0.05 },

      // ---- the records
      { type: 'sign', x: 4, y: 4, sprite: 'prop_desk', dialogue: 'a_novice_roll' },
      { type: 'prop', x: 6, y: 5, sprite: 'prop_candles', solid: false, light: { r: 36, color: CANDLE, flicker: 0.2 } },
      { type: 'sign', x: 23, y: 4, sprite: 'prop_desk', dialogue: 'a_register' },
      { type: 'prop', x: 21, y: 5, sprite: 'prop_candles', solid: false, light: { r: 36, color: CANDLE, flicker: 0.2 } },

      // ---- the copying desks
      { type: 'prop', x: 10.5, y: 10, sprite: 'prop_desk', solid: true },
      { type: 'npc', x: 9, y: 10, npc: 'a_brother_copy', dir: 'right' },
      { type: 'prop', x: 12, y: 11, sprite: 'prop_candles', solid: false, light: { r: 36, color: CANDLE, flicker: 0.2 } },
      { type: 'prop', x: 17.5, y: 13, sprite: 'prop_desk', solid: true },
      { type: 'prop', x: 16, y: 12, sprite: 'prop_candles', solid: false, light: { r: 36, color: CANDLE, flicker: 0.2 } },

      // ---- drafts on the floor
      { type: 'sign', x: 8, y: 7, sprite: null, title: 'A Draft', text: [
        'A draft, balled up and flattened out again: \'Warden — forgive the boldness of a stranger —\' The rest is water.',
      ] },
      { type: 'sign', x: 20, y: 8, sprite: null, title: 'A Draft', text: [
        '\'Ser Emeric. I have a thing to tell you that you will not want to hear, and a thing that you will —\' Struck through, hard enough to tear.',
      ] },
      { type: 'sign', x: 16, y: 14, sprite: null, title: 'A Draft', text: [
        '\'To the Warden of the Seventh Gate, from the Prior of Lenten Mere, in haste, in hope —\' Only that, over and over, all the way down the page.',
      ] },

      // ---- the Prior's cell, behind the stacks
      { type: 'prop', x: 28, y: 4, sprite: 'prop_cot', solid: true },
      { type: 'sign', x: 27, y: 6, sprite: null, title: 'Letters', text: [
        'Letters. Hundreds of them, stacked to the ceiling. The ink of the oldest has faded to nothing. The newest are still wet.',
        'Every one of them begins: Warden —',
      ] },
      { type: 'corpse', id: 'a_alms', x: 28, y: 7, sprite: 'prop_crate', text: [
        'The Prior\'s alms box, pushed under his cot. Eye-pennies, for the ferry, for the sick, for the dead.',
        'He never spent any. He was keeping them for when the Warden\'s answer came.',
      ], do: ['pennies:+80'] },

      // ---- shelf-dwellers
      { type: 'enemy', x: 4, y: 14, kind: 'toller' },
      { type: 'enemy', x: 23, y: 11, kind: 'censer' },

      { type: 'emitter', x: 10, y: 5, kind: 'drips' },
      { type: 'emitter', x: 17, y: 6, kind: 'drips' },
      { type: 'emitter', x: 6, y: 8, kind: 'drips' },
      { type: 'emitter', x: 21, y: 7, kind: 'drips' },
      { type: 'emitter', x: 13, y: 12, kind: 'drips' },
    ],
  };

  // ------------------------------------------------------------------ the undercroft
  M.abbey_undercroft = {
    name: 'The Undercroft',
    region: 'abbey',
    theme: 'abbey',
    music: 'abbey',
    weather: 'none',
    ambient: 0.72,
    ambientColor: '#080c14',
    indoor: true,
    tiles: [
      "##############################",
      "####ss###-------G#############",
      "####ss###=--=---G#############",
      "##w#ss#w##w#C#w##w####w##w####",
      "##==================#========#",
      "##==================#======-=#",
      "##=====-============#========#",
      "##==================#========#",
      "##===========*======#========#",
      "##=======-=======-==#========#",
      "##---=============-=#--======#",
      "##=====|=====|======#========#",
      "##==================####D#####",
      "##==-=======-====-===========#",
      "##=====-=====*=====-=========#",
      "##-----==-----------==-------#",
      "##---=---------=--------==---#",
      "##-----|-----|-----|-----|---#",
      "##~~-----------------------~~#",
      "##~~~----=-----------=----~~~#",
      "##############################",
      "##############################",
    ],
    spawns: {
      stairs: [4, 3, 'down'],
    },
    entities: [
      { type: 'exit', x: 4, y: 1, w: 2, h: 1, to: 'abbey_cloister', spawn: 'undercroft_stairs' },
      { type: 'light', x: 5, y: 5, r: 48, color: WARM, intensity: 0.7, flicker: 0.12 },
      { type: 'npc', x: 7, y: 5, npc: 'a_brother_flood', dir: 'down' },

      // ---- the sick ward
      { type: 'prop', x: 2, y: 5, sprite: 'prop_cot', anim: 'body', solid: true },
      { type: 'prop', x: 2, y: 7, sprite: 'prop_cot', solid: true },
      { type: 'prop', x: 2, y: 9, sprite: 'prop_cot', anim: 'body', solid: true },
      { type: 'prop', x: 2, y: 11, sprite: 'prop_cot', solid: true },
      { type: 'prop', x: 2, y: 13, sprite: 'prop_cot', anim: 'body', solid: true },
      { type: 'prop', x: 2, y: 15, sprite: 'prop_cot', solid: true },
      { type: 'corpse', id: 'a_colm', x: 3, y: 11, sprite: 'prop_corpse_monk', item: 'abbey_key', do: ['set:a_hollin_known'], text: [
        'A monk lies across an empty cot, his arms still under the shape of someone he was trying to lift.',
        'An iron key hangs from his belt, stamped with a bell. Knotted through the bow, a strip of vellum: COLM — KEEP IT. DO NOT OPEN THE TOWER UNTIL THE WATER IS DOWN. H.',
      ] },
      { type: 'light', x: 3, y: 9, r: 40, color: CANDLE, intensity: 0.6, flicker: 0.2 },

      // ---- the cold baths
      { type: 'sign', x: 9, y: 4, sprite: null, title: 'Chalk on the Wall', text: [
        'Chalked on the wall by the baths: NIGHTS IN THE COLD.',
        'TOBIAS III. MAUDIE I. NED III. SAL IIIIII. DAVY IIIII — and one more stroke, only half drawn.',
      ] },
      { type: 'sign', x: 13, y: 5, sprite: 'prop_desk', dialogue: 'a_cold_rite' },
      { type: 'prop', x: 10, y: 8, sprite: 'prop_bath', solid: true },
      { type: 'prop', x: 16, y: 8, sprite: 'prop_bath', solid: true },
      { type: 'prop', x: 10, y: 14, sprite: 'prop_bath', solid: true },
      { type: 'prop', x: 16, y: 14, sprite: 'prop_bath', solid: false },
      { type: 'npc', x: 16, y: 14, npc: 'a_davy', dir: 'down', if: '!a_davy_rest' },
      { type: 'item', id: 'a_tag_bath', x: 17, y: 14, item: 'tag_bath',
        text: 'At the bottom of the cold bath, a tin tag on a bootlace. The water is so cold it aches through the gauntlet.' },
      { type: 'sign', x: 16, y: 15, sprite: null, title: 'The Rim', text: [
        'Cut into the rim of the bath at a child\'s height: COUNT TO A HUNDRED. THEN COUNT AGAIN.',
      ] },
      { type: 'light', x: 13, y: 11, r: 60, color: COLD, intensity: 0.6, flicker: 0.04 },
      { type: 'emitter', x: 10, y: 8, kind: 'steam' },
      { type: 'emitter', x: 16, y: 14, kind: 'steam' },

      // ---- the springs
      { type: 'light', x: 3, y: 18, r: 44, color: COLD, intensity: 0.7, flicker: 0.05 },
      { type: 'light', x: 27, y: 18, r: 44, color: COLD, intensity: 0.7, flicker: 0.05 },
      { type: 'emitter', x: 3, y: 18, kind: 'steam' },
      { type: 'emitter', x: 27, y: 18, kind: 'steam' },

      // ---- the sluice room
      { type: 'prop', x: 24, y: 6, sprite: 'prop_sluice_wheel', solid: true },
      { type: 'sign', x: 22, y: 6, sprite: null, title: 'The Wheel', text: [
        'The great sluice wheel is chained at SHUT. The chain is whole. The padlock has rusted closed.',
        'Whatever raised the dam gates that night, it was not this.',
      ] },
      { type: 'sign', x: 27, y: 9, sprite: 'prop_desk', dialogue: 'a_sluice_log' },
      { type: 'light', x: 26, y: 8, r: 44, color: CANDLE, intensity: 0.8, flicker: 0.18 },
      { type: 'light', x: 24, y: 4, r: 36, color: DEEP, intensity: 0.5, flicker: 0.03 },

      // ---- the lower drain, behind the cracked stone
      { type: 'sign', x: 9, y: 2, sprite: null, title: 'Chalk in the Drain', text: [
        'Chalked low on the drain wall, where a small hand could reach: a row of strokes, and the letter A.',
        'Beyond the grate the drain runs on toward the mere. Too narrow for a man. Not too narrow for a child.',
      ] },
      { type: 'item', id: 'a_stub', x: 10, y: 1, item: 'tallow_stub',
        text: 'A stub of tallow wedged in a crack of the drain, where someone once lit the way for small feet. There is a little left.' },
      { type: 'prop', x: 14, y: 2, sprite: 'prop_toy_horse', solid: false },
      { type: 'light', x: 15, y: 1, r: 28, color: DEEP, intensity: 0.5, flicker: 0.03 },

      // ---- what lives in the cold now
      { type: 'enemy', x: 9, y: 16, kind: 'novice' },
      { type: 'enemy', x: 22, y: 15, kind: 'novice' },
      { type: 'enemy', x: 15, y: 18, kind: 'toller' },
      { type: 'enemy', x: 25, y: 14, kind: 'censer' },

      { type: 'emitter', x: 8, y: 7, kind: 'drips' },
      { type: 'emitter', x: 18, y: 12, kind: 'drips' },
      { type: 'emitter', x: 12, y: 16, kind: 'drips' },
    ],
  };

  // ------------------------------------------------------------------ the belfry (boss)
  M.abbey_belfry = {
    name: 'The Belfry',
    region: 'abbey',
    theme: 'abbey',
    music: 'abbey',
    weather: 'rain',
    ambient: 0.7,
    ambientColor: '#0a0d16',
    indoor: true,
    tiles: [
      "############################",
      "############################",
      "##w###w####w####w####w###w##",
      "##!=====rr========rr=====!##",
      "##========================##",
      "##===|==------------==|===##",
      "##====--============--====##",
      "##===--==============--===##",
      "##==--================--==##",
      "##==-==================-==##",
      "##==-==================-==##",
      "##==--================--==##",
      "##===--==============--===##",
      "##====--============--====##",
      "##===|==------------==|===##",
      "##========================##",
      "##=r====================r=##",
      "##======*==========*======##",
      "##=====r====rr====r=======##",
      "#############==#############",
      "#############==#############",
      "#############DD#############",
    ],
    spawns: {
      door: [13, 19, 'up'],
    },
    entities: [
      { type: 'exit', x: 13, y: 21, w: 2, h: 1, to: 'abbey_cloister', spawn: 'belfry_door' },
      { type: 'trigger', id: 'a_t_belfry', x: 12, y: 17, w: 4, h: 3, if: '!boss_hollin', dialogue: 'a_belfry_enter' },
      { type: 'boss', x: 13.5, y: 8, boss: 'boss_hollin', arena: { x: 2, y: 3, w: 24, h: 14 }, if: '!boss_hollin',
        onDefeat: ['dialogue:a_hollin_after'] },

      { type: 'prop', x: 8, y: 6, sprite: 'prop_bell_rope', solid: false },
      { type: 'prop', x: 19, y: 6, sprite: 'prop_bell_rope', solid: false },
      { type: 'light', x: 6, y: 10, r: 64, color: COLD, intensity: 0.5, flicker: 0.05 },
      { type: 'light', x: 21, y: 10, r: 64, color: COLD, intensity: 0.5, flicker: 0.05 },
      { type: 'light', x: 13.5, y: 15, r: 56, color: WARM, intensity: 0.6, flicker: 0.12 },

      // ---- after
      { type: 'prop', x: 13.5, y: 9, sprite: 'prop_bell_fallen', solid: true, if: 'boss_hollin' },
      { type: 'light', x: 13.5, y: 11, r: 40, color: COLD, intensity: 0.9, flicker: 0.1, if: 'a_hollin_left && !hollin_named' },
      { type: 'emitter', x: 13.5, y: 11, kind: 'motes', if: 'a_hollin_left && !hollin_named' },
      { type: 'sign', x: 13, y: 11, sprite: null, if: 'a_hollin_left && !hollin_named', dialogue: 'a_hollin_flame' },

      { type: 'emitter', x: 7, y: 6, kind: 'drips' },
      { type: 'emitter', x: 20, y: 12, kind: 'drips' },
    ],
  };
})(window.AV);
