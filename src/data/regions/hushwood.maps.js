// ASHEN VOW — The Hushwood: maps (builder: HUSHWOOD)
// The pale forest east of Saint Wendel's Rest. Refugees from the Wickward fled through here the week before the
// Kindling; their belongings still lie along the path. Maud's cottage stands at the edge; the Moth-Wife keeps her jars
// in a hollow tree in the deep wood; the Old Hart, Aubrenn, waits on his barrow to the north.
(function (AV) {
  'use strict';
  const M = AV.data.maps;

  // light presets
  const MOTH = '#b9d6d3';     // cold moth-light
  const PALE = '#e4f4ef';
  const WARM = '#f59a36';
  const CANDLE = '#fccf63';
  const jarAnim = [{ if: 'moth_killed', anim: 'dark' }, { anim: 'idle' }];

  // ------------------------------------------------------------------ hushwood_edge
  M.hushwood_edge = {
    name: 'The Hushwood',
    region: 'hushwood',
    theme: 'hushwood',
    music: 'hushwood',
    weather: ['fog', 'ash'],
    ambient: 0.6,
    ambientColor: '#0c1219',
    indoor: false,
    tiles: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTRRTTTTTTTTTTTTTTTT#####TTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTt^^^^^^^^TTTTTTTT,'''',t#...#tTTTTTTTTTTTTTTTTTTTTTT",
      "TTTtt^^^^^^^^tt,tTTt,,xaxx,,#...#TTTTTTTTTTTTTTTTTTTTTTT",
      "TTT,,^^^^^^^^,,,,,t,,xxRRxa,##C##RTTTTTTTTTTTTTTTTTTTTTT",
      "TTTF,^^^^^^^^,,,F,T,,axRRxx,,,,,,TTTTTTTTTTTTTTTTTTTTTTT",
      "TR,F,WwWWDWwW,,,F,TR,,xxax'''',,RTTTTTTTTTTTTTTTTTTTTTTT",
      "TT,F,,,,,:,,,,,,F.Ttt,,':'''''.tTTTTTTTTTTTTTTTTTTTTTTTT",
      "TT,F%%,,,:,,,g,,F',tRt,:'ttttRtTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TT,F%%%,,:,,mmm,F''tTT:'tttTttTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TT,F,%,,,:,,,m,,F'RTT':'tTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTRF,,,,,:,,,,,,F'TTT::tTTttTTTTTtTTTTTTTTTTTTRT,'''TTTT",
      "TTTFFFFFF:FFFFFFFtTTT:'TTt'a''''''''RTTTTTTTTT'.,,''TTT,",
      "TTTTtTt'':,,,,ttTtTTT:'Tt'',:::::::'''TTTTTTT'::::::''::",
      "TTTTTTTttRtRttTTTTTtT:,''':::,,,,,:::'.....''::.,,''''::",
      "TRTTTTTtTtTTttTTTT,,,::::::,,,,,tt,'::.::::::'R,,,,'ttt,",
      ",,TT,,,,,:.''',,,a,::::::,a,,,,,TtR'''::::,,'tt,,,,,TtTt",
      "::::::::::::::::::::..:,,,,,',,tTTt''',,,a,,ttTt,,,RTTTt",
      "::::::::::::'''''.....:.tttRttRtTTTt'',,,,,ttTTTtRttTTTT",
      ",,,........'tR''tRttt.:,tTTtTRtTTTTtttt,RtttTTTTTTTTTTTT",
      "ttttRtRtttttTTttTttTt.:,TTTTTTTTTTTTttTttttTTTTTTTTTTTTT",
      "RttTTTtRTtTTTTttTTTTT.:tTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTT,:,tTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTT,:,TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T~~~~~~~~~~~~~TTTTTTt,--~~~~~~~~~~TTTTTTT~~~~~~~~~~~~~~T",
      "T~~~~~~~~~~~~~~~~~~~~~--~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~T",
      "TttttttttRttt~~~~ttttR-,,'ttttttttttt~~~~ttttttRtRttttRT",
      "TTTttRtRtTTR,,,,ttR''':',''''a''tTtTTttRtTTttTRTtTtTtRTT",
      "TTTTTTTTTTT.,,,,,T'''':'''''''''a'RTTTTtTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTT.,,a,,,,..'''''',,,''''TTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTt,,,,,,,,,,''''',,,,'''tTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTRtttt,,,,,'''''',,,,''tTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTttTtRt,'''''''',,,,tRtTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTtRtRtRtttttttRTtTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTttTttttttRTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    ],
    spawns: {
      west: [2, 19, 'right'],
      maud_door: [9, 10, 'down'],
      east: [53, 15, 'left'],
    },
    entities: [
      // ---- ways out
      { type: 'exit', x: 0, y: 18, w: 1, h: 4, to: 'village', spawn: 'east' },
      { type: 'exit', x: 55, y: 14, w: 1, h: 4, to: 'hushwood_deep', spawn: 'west' },
      { type: 'door', x: 9, y: 8, to: 'maud_cottage', spawn: 'door', sprite: 'prop_door_wood' },
      { type: 'trigger', x: 1, y: 18, w: 2, h: 4, id: 'h_t_edge_enter', dialogue: 'h_edge_enter' },

      // ---- the road in: a little grave with a bird, the last of the village light
      { type: 'sign', x: 6, y: 21, sprite: 'prop_grave_fresh', title: '', text: [
        'A little grave by the road. On it sits a wooden bird, badly carved: lumpy, one wing bigger than the other.',
        'Someone walked out this far from the village to leave it.',
        'You know how hard it is to carve a bird. You were never any good at it either.',
      ] },
      { type: 'light', x: 2, y: 19, r: 44, color: WARM, intensity: 0.45, flicker: 0.1 },
      { type: 'emitter', x: 7, y: 19, kind: 'ash' },

      // ---- Maud's cottage and garden
      { type: 'light', x: 6, y: 9, r: 40, color: CANDLE, intensity: 0.8, flicker: 0.15, if: '!maud_kept' },
      { type: 'light', x: 11, y: 9, r: 40, color: CANDLE, intensity: 0.8, flicker: 0.15, if: '!maud_kept' },
      { type: 'light', x: 9, y: 12, r: 36, color: MOTH, intensity: 0.35 },
      { type: 'sign', x: 13, y: 10, dialogue: 'h_maud_grave' },
      { type: 'prop', x: 5, y: 12, sprite: 'prop_lilies' },
      { type: 'prop', x: 14, y: 12, sprite: 'prop_spade', flip: true },

      // ---- Aldo's charcoal clearing (north) and the store behind the cracked wall
      { type: 'sign', x: 23, y: 8, title: '', text: [
        'A charcoal clamp, long cold, slumped into grey. A spade stands in it where somebody left it to go and do something else.',
        'Beside it, a stack of cut wood: split, seasoned, and never burned.',
      ] },
      { type: 'prop', x: 25, y: 7, sprite: 'prop_spade' },
      { type: 'prop', x: 26, y: 5, sprite: 'prop_crate', solid: true },
      { type: 'prop', x: 27, y: 6, sprite: 'prop_crate', solid: true },
      { type: 'prop', x: 20, y: 6, sprite: 'prop_barrel', solid: true },
      { type: 'light', x: 25, y: 8, r: 40, color: MOTH, intensity: 0.5 },
      { type: 'item', x: 30, y: 4, id: 'h_edge_breath', item: 'pilgrim_breath',
        text: 'Wrapped in a charcoal-burner\'s sacking, behind the bricked-up wall: a pilgrim\'s breath-stone, the kind the devout carry up hills.' },
      { type: 'light', x: 30, y: 5, r: 26, color: CANDLE, intensity: 0.4 },

      // ---- the refugees' path: what people dropped and did not come back for
      { type: 'light', x: 19, y: 18, r: 50, color: MOTH, intensity: 0.6, flicker: 0.2 },
      { type: 'emitter', x: 19, y: 18, kind: 'motes' },
      { type: 'prop', x: 24, y: 16, sprite: 'prop_ash_pile' },
      { type: 'prop', x: 26, y: 14, sprite: 'prop_crate' },
      { type: 'sign', x: 29, y: 18, sprite: 'prop_cart', title: '', text: [
        'A handcart on its side, spilling pots and bedding and a birdcage with its door open.',
        'A length of grey thread is knotted to the handle — the kind the Chandlers used for tin tags. The tag is gone.',
      ] },
      { type: 'prop', x: 30, y: 17, sprite: 'prop_crate' },
      { type: 'prop', x: 31, y: 15, sprite: 'prop_toy_horse' },
      { type: 'sign', x: 33, y: 16, title: '', text: ['A child\'s shoe, laced, in the middle of the path. Just the one.'] },
      { type: 'light', x: 28, y: 16, r: 56, color: MOTH, intensity: 0.65, flicker: 0.2 },
      { type: 'emitter', x: 28, y: 16, kind: 'motes' },
      { type: 'prop', x: 37, y: 16, sprite: 'prop_ash_pile' },

      // ---- Odeline: her body, her tag, her ghost still walking east
      { type: 'corpse', x: 40, y: 19, id: 'h_c_odeline', sprite: 'prop_corpse_pilgrim', item: 'tag_edge', text: [
        'A woman — what the ash has left of one — curled around a bundle as if it were a child.',
        'It is washing. Only washing. She carried it all this way.',
        'A tin tag is knotted at her wrist.',
      ] },
      { type: 'prop', x: 42, y: 19, sprite: 'prop_shroud' },
      { type: 'npc', x: 41, y: 16, npc: 'h_odeline', dir: 'right' },
      { type: 'light', x: 39, y: 17, r: 56, color: MOTH, intensity: 0.6, flicker: 0.2 },
      { type: 'emitter', x: 39, y: 17, kind: 'moths' },

      // ---- deeper: white trees close in, hartlings watch from the fern
      { type: 'light', x: 49, y: 15, r: 50, color: MOTH, intensity: 0.6, flicker: 0.2 },
      { type: 'emitter', x: 49, y: 15, kind: 'motes' },
      { type: 'light', x: 53, y: 16, r: 40, color: PALE, intensity: 0.45 },
      { type: 'npc', x: 51, y: 18, npc: 'h_hartling', if: '!h_hl_e' },
      { type: 'npc', x: 50, y: 13, npc: 'h_hartling', dir: 'left', if: '!h_hl_e' },
      { type: 'trigger', x: 44, y: 13, w: 3, h: 7, id: 'h_t_hl_e', do: ['set:h_hl_e'] },

      // ---- south: the ford, the antler shrine, the hounds
      { type: 'emitter', x: 22, y: 27, kind: 'motes' },
      { type: 'light', x: 22, y: 27, r: 40, color: MOTH, intensity: 0.45 },
      { type: 'light', x: 25, y: 31, r: 50, color: MOTH, intensity: 0.5, flicker: 0.15 },
      { type: 'emitter', x: 25, y: 31, kind: 'motes' },
      { type: 'sign', x: 13, y: 29, sprite: 'prop_stag_skull', anim: 'lit', title: '', text: [
        'An antler shrine: shed antlers nailed to a post, candle-stubs pressed into the moss beneath.',
        'The candles are lit. You do not see who lit them.',
      ] },
      { type: 'prop', x: 14, y: 29, sprite: 'prop_candles' },
      { type: 'light', x: 13, y: 29, r: 52, color: CANDLE, intensity: 0.85, flicker: 0.2 },
      { type: 'corpse', x: 12, y: 31, id: 'h_c_edge_forester', sprite: 'prop_corpse_soldier', text: [
        'A forester, sat against the shrine post with his bow across his knees. Rabbit snares in one pocket.',
        'In the other, a purse of pennies he never got round to spending.',
      ], do: ['pennies:+35'] },
      { type: 'npc', x: 15, y: 31, npc: 'h_hartling', dir: 'left', if: '!h_hl_s' },
      { type: 'trigger', x: 16, y: 28, w: 3, h: 6, id: 'h_t_hl_s', do: ['set:h_hl_s'] },

      // ---- enemies
      { type: 'enemy', x: 20, y: 31, kind: 'hound' },
      { type: 'enemy', x: 27, y: 30, kind: 'hound' },
      { type: 'enemy', x: 28, y: 33, kind: 'hound' },
      { type: 'enemy', x: 36, y: 19, kind: 'briar' },
      { type: 'enemy', x: 44, y: 18, kind: 'briar' },
      { type: 'enemy', x: 48, y: 16, kind: 'moth' },
      { type: 'enemy', x: 49, y: 13, kind: 'moth' },
      { type: 'enemy', x: 47, y: 18, kind: 'moth' },
    ],
  };

  // ------------------------------------------------------------------ maud_cottage
  M.maud_cottage = {
    name: 'Old Maud\'s Cottage',
    region: 'hushwood',
    theme: 'interior',
    music: 'hushwood',
    weather: 'none',
    ambient: 0.76,
    ambientColor: '#0c0a14',
    indoor: true,
    tiles: [
      "##################",
      "####w##w##########",
      "#________kk#___###",
      "#__________H___###",
      "#__________#___###",
      "#__________#######",
      "#________________#",
      "#________________#",
      "#________________#",
      "#________________#",
      "########D#########",
      "##################",
    ],
    spawns: { door: [8, 8, 'up'] },
    entities: [
      { type: 'exit', x: 8, y: 10, w: 1, h: 1, to: 'hushwood_edge', spawn: 'maud_door' },

      { type: 'prop', x: 2, y: 2, sprite: 'prop_hearth', anim: 'unlit', solid: true },
      { type: 'prop', x: 4, y: 2, sprite: 'prop_candles', anim: [{ if: 'maud_kept', anim: 'unlit' }, { anim: 'idle' }] },
      { type: 'light', x: 4, y: 2, r: 70, color: CANDLE, intensity: 1, flicker: 0.12, if: '!maud_kept' },
      { type: 'light', x: 7, y: 2, r: 34, color: MOTH, intensity: 0.45 },
      { type: 'light', x: 8, y: 7, r: 60, color: WARM, intensity: 0.25 },

      { type: 'npc', x: 5, y: 3, npc: 'maud', dir: 'left' },
      { type: 'sign', x: 5, y: 3, title: '', if: 'gone_maud', text: [
        'The chair by the window is empty. The lamp is still lit.',
        'You leave it burning.',
      ] },

      { type: 'sign', x: 6, y: 7, sprite: 'prop_desk', title: '', text: [
        'Two bowls on the table, two spoons. One bowl has been set out for a very long time; there is ash in it, fine as flour.',
        'The other has been wiped clean, and set out again, and wiped clean.',
      ] },
      { type: 'sign', x: 15, y: 8, sprite: 'prop_bed', title: '', text: [
        'The bed is made. One side has not been slept in for nineteen years.',
        'Neither has the other.',
      ] },
      { type: 'sign', x: 10, y: 9, title: '', text: ['A man\'s brown coat on a peg by the door. It has been brushed. Recently.'] },
      { type: 'prop', x: 16, y: 6, sprite: 'prop_barrel', solid: true },
      { type: 'prop', x: 1, y: 9, sprite: 'prop_crate', solid: true },

      // the pantry behind the loose boards
      { type: 'item', x: 12, y: 2, id: 'h_maud_letters', item: 'lore_h_maud_letters',
        text: 'Behind the loose boards, in a biscuit tin: letters, all to the same man, none of them sent.' },
      { type: 'corpse', x: 14, y: 4, id: 'h_c_maud_tin', sprite: 'prop_crate', text: [
        'A tin of coins, counted into little stacks and tied with thread.',
        'A paper on top, in the same hand as the letters: FOR THE PHYSICIAN IF THE LUNGWORT DON\'T TAKE.',
      ], do: ['pennies:+40'] },
      { type: 'light', x: 13, y: 3, r: 24, color: CANDLE, intensity: 0.3 },
    ],
  };

  // ------------------------------------------------------------------ hushwood_deep
  M.hushwood_deep = {
    name: 'The Deep Hushwood',
    region: 'hushwood',
    theme: 'hushwood',
    music: 'hushwood',
    weather: ['fog', 'ash'],
    ambient: 0.62,
    ambientColor: '#0c1219',
    indoor: false,
    tiles: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT,:,TTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT.:.TTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt,:,TTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt,:,TTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTT,,,a,,TTTTTTTTTTTTTTTTTTTTT,:,TTRTTTTTTTTTTTTTTTTTTTTT",
      "TTTTT,,,+,,,,TTTTTTTTTTTTTTTTTTTT,::t,,'TTTTTTTTTTTTTTTTTTTT",
      "TTTT,,,a,,,,,TTTTTTTTTTTTTTTTTTTTt,:,,%''TTTTTTTTTTTTTTTTTTT",
      "TTTTa,%,,,,,,TTTTTTTTTTTTTTTTTTTTt':,''''TTTTTTTTTTTTTTTTTTT",
      "TTTT........tTTTTTTTTTTTTTTTTTTTTa'::a'''TTTTTTTTTTTTTTTTTTT",
      "TTTTR......ttTTTTTTTTTTTTTTTTTTT'%'':'tRtTTTTTTTTTTTTTTTTTTT",
      "TT######H####TTTTTTTTTTTTTTTTTTt''',:,ttTTTTTTTTTTTTTTTTTTT~",
      "TTTTTRtt.tTTTTTTTTTTTTTTTTTTTTTTt',,:,TTTTTTTTTTTTTTTTTTTT~~",
      "TTTTTTTT.,TTTTTTTTTTTTTTTTTTTTTTtt,::,TTTTTTTTTTTTTTTTTTT~~~",
      "TTTTTTTt,,TTTTTTTTTTTTTTTTTTTTTtTt,::,TTTTTTTTTTTTTTTTT~~~~R",
      "TTTTTTTTt,'TTTTTTTTTTTTTTTtT.....T,:,tTTTTTTTTTTTTTTTT~~~~tt",
      "TTTTTTTTT''RTTTTTTTTTTTTTT........,:.tTTTTTTTTTTTTTTT~~~tttT",
      "TTTTTTTTT''tTTTTTTTTTTTt''........:,.TTTTTTTTTTTTTTT~~~RTTTT",
      "TTTTTTTT''tTTTTTTTTTTTTT'........::,.RTTTTTTTTTTTTT~~~tTTTTT",
      "TTTTTTTT''tTTTTTTTTTTTT,.........:....TTTTTTTTTTTT~~~tTTTTTT",
      "TTTTTT..''TTTTTTTTTTTTT,...............TTTTTTTTTTT~~ttTTTTTT",
      "TTTT....'''RTTTTTTTTTT',..::.....::...tTTTTTTTTTT~~tTTTTTTTT",
      "TTT......'''TTTTTRTT''':::.........:::..TTTTTTTT~~RtTTTTTTTT",
      ",,,,,,,...''TtTTT,'%::::.......,,%,,,::::.''TTT--ttTTTTTTTTT",
      "::::::::::.'''...::::'''t.'''',,,,Rtt,,..:::''---tTTTTTTTTTT",
      ",:,,',,::::::::::::'''tRTttt'',,ttttTtttt.''::--'tTTTTTTTTTT",
      "t,,t''R,...''',:,,'atttTTttTttRtTTTTTttTTttt'---':t,:'TtTTTT",
      "ttttttttRtRtRtt:,ttttRTTTTTTTRtTTTTTTTTTTtRTR--,,WWW_WwWtTTT",
      "TtTTTRTtTRtttTT,,TttTTTTTTTTTTTTTTTTTTTTTTTTt~~t,_______%TTT",
      "TTTTTTTTTTTTTTT,:tT'TRTTTTTTTTTTTTTTTTTTTTTT~~t,,_r_____'TTT",
      "TTTTTTTTTTTTTTT,:,,'''''tTTTTTTTTTTTTTTTTTTT~~R,,____r__''TT",
      "TTTTTTTTTTTTTTT,:,,,'''''tTTTTTTTTTTTTTTTTT~~~,,'WWW__WW''TT",
      "TTTTTTTTTTTTTT,:'',,,,'''TTTTTTTTTTTTTTTTTT~~tt''''''''%''TT",
      "TTTTTTTTTTTTTT,:'',,,,'''TTTTTTTTTTTTTTTTT~~~Tt'''''''''''TT",
      "TTTTTTTTTTTTT,:'tt,,,,'ttTTTTTTTTTTTTTTTTT~~tTTt'''''''ttRTT",
      "TTTTTTTTTTTTT,:'tTtRtttRTTTTTTTTTTTTTTTTTT~~TTTTttRttttTRTTT",
      "TTTTTTTTTTTTTtt,TTTTTTtTTTTTTTTTTTTTTTTTT~~RTTTTTTtTRTtTTTTT",
      "TTTTTTTTT,#####,,TTTTTTTTTTTTTTTTTTTTTTTT~~tTTTTTTTTTTTTTTTT",
      "TTTTTTTT,,##s##,,TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTTTTTTTTTT",
      "TTTTTTTT',##C##,,TTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTTTTTTTTTT",
      "TTTTTTTT'',,,,,,tTTTTTTTTTTTTTTTTTTTTTTT~~tTTTTTTTTTTTTTTTTT",
      "TTTTTTTTt',,,,,tRTTTTTTTTTTTTTTTTTTTTTTT~~tTTTTTTTTTTTTTTTTT",
      "TTTTTTTTttRttRtTTTTTTTTTTTTTTTTTTTTTTTTT~~TTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTttTtTTTTTTTTTTTTTTTTTTTTTTTTT~~TTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT~~TTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT~~TTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT~~~TTTTTTTTTTTTTTTTTT",
    ],
    spawns: {
      west: [2, 23, 'right'],
      moth_door: [30, 17, 'down'],
      barrow: [34, 2, 'down'],
      cave: [12, 39, 'down'],
    },
    entities: [
      // ---- ways out
      { type: 'exit', x: 0, y: 22, w: 1, h: 3, to: 'hushwood_edge', spawn: 'east' },
      { type: 'exit', x: 33, y: 0, w: 3, h: 1, to: 'hart_barrow', spawn: 'south' },
      { type: 'exit', x: 12, y: 37, w: 1, h: 1, to: 'hushwood_cave', spawn: 'entrance' },
      { type: 'trigger', x: 1, y: 22, w: 2, h: 3, id: 'h_t_deep_enter', dialogue: 'h_deep_enter' },

      // ---- the shrine by the way in
      { type: 'shrine', x: 6, y: 19, id: 'shrine_hushwood', name: 'Antler Shrine' },
      { type: 'prop', x: 5, y: 20, sprite: 'prop_stag_skull', anim: 'lit' },
      { type: 'prop', x: 4, y: 21, sprite: 'prop_candles' },
      { type: 'light', x: 11, y: 23, r: 50, color: MOTH, intensity: 0.55, flicker: 0.2 },
      { type: 'emitter', x: 11, y: 23, kind: 'motes' },
      { type: 'prop', x: 18, y: 22, sprite: 'prop_shroud' },
      { type: 'prop', x: 15, y: 23, sprite: 'prop_ash_pile' },
      { type: 'light', x: 21, y: 21, r: 50, color: MOTH, intensity: 0.55, flicker: 0.2 },

      // ---- the hartlings lead the way to the hidden grave
      { type: 'npc', x: 9, y: 17, npc: 'h_hartling', if: '!h_hl1' },
      { type: 'trigger', x: 5, y: 18, w: 6, h: 3, id: 'h_t_hl1', dialogue: 'h_hartling_flee', do: ['set:h_hl1'] },
      { type: 'npc', x: 9, y: 13, npc: 'h_hartling', dir: 'left', if: 'h_hl1 && !h_hl2' },
      { type: 'trigger', x: 7, y: 14, w: 5, h: 2, id: 'h_t_hl2', if: 'h_hl1', do: ['set:h_hl2'] },
      { type: 'npc', x: 8, y: 11, npc: 'h_hartling', if: 'h_hl2 && !h_hl3' },
      { type: 'trigger', x: 7, y: 12, w: 3, h: 1, id: 'h_t_hl3', if: 'h_hl2', dialogue: 'h_hartling_wall', do: ['set:h_hl3'] },
      { type: 'light', x: 9, y: 15, r: 30, color: MOTH, intensity: 0.4 },

      // ---- the hidden glade: Cael's grave
      { type: 'npc', x: 7, y: 6, npc: 'h_hartling', if: 'h_hl3' },
      { type: 'sign', x: 8, y: 5, dialogue: 'h_cael_grave' },
      { type: 'item', x: 8, y: 6, id: 'h_cael_journal', item: 'lore_h_cael_journal',
        text: 'An oilcloth bundle on the grave: a forester\'s journal, swollen with damp. The last page is one word, written over and over until the pencil went through: AUBRENN.',
        do: ['set:h_knows_aubrenn'] },
      { type: 'prop', x: 6, y: 5, sprite: 'prop_stag_skull' },
      { type: 'prop', x: 10, y: 5, sprite: 'prop_stag_skull', flip: true },
      { type: 'prop', x: 10, y: 7, sprite: 'prop_lilies' },
      { type: 'light', x: 8, y: 7, r: 56, color: PALE, intensity: 0.6, flicker: 0.15 },
      { type: 'emitter', x: 8, y: 7, kind: 'moths' },

      // ---- the Moth-Wife's clearing and the great hollow tree
      { type: 'prop', x: 30, y: 14, sprite: 'prop_hollow_tree', solid: true },
      { type: 'door', x: 30, y: 15, to: 'moth_hollow', spawn: 'door' },
      { type: 'light', x: 30, y: 15, r: 48, color: CANDLE, intensity: 0.7, flicker: 0.2, if: '!moth_killed' },
      { type: 'light', x: 30, y: 12, r: 70, color: MOTH, intensity: 0.55, flicker: 0.25, if: '!moth_killed' },
      { type: 'light', x: 30, y: 15, r: 26, color: '#857c86', intensity: 0.5, if: 'moth_killed' },
      { type: 'trigger', x: 27, y: 17, w: 7, h: 3, id: 'h_t_hum', if: '!h_moth_met && !moth_killed', dialogue: 'h_hollow_hum' },
      { type: 'prop', x: 26, y: 16, sprite: 'prop_jar', anim: jarAnim },
      { type: 'light', x: 26, y: 16, r: 22, color: PALE, intensity: 0.6, flicker: 0.3, if: '!moth_killed' },
      { type: 'prop', x: 33, y: 16, sprite: 'prop_jar', anim: jarAnim },
      { type: 'light', x: 33, y: 16, r: 22, color: PALE, intensity: 0.6, flicker: 0.3, if: '!moth_killed' },
      { type: 'prop', x: 24, y: 19, sprite: 'prop_jar', anim: jarAnim },
      { type: 'light', x: 24, y: 19, r: 22, color: MOTH, intensity: 0.6, flicker: 0.3, if: '!moth_killed' },
      { type: 'prop', x: 37, y: 19, sprite: 'prop_jar', anim: jarAnim },
      { type: 'light', x: 37, y: 19, r: 22, color: MOTH, intensity: 0.6, flicker: 0.3, if: '!moth_killed' },
      { type: 'prop', x: 28, y: 19, sprite: 'prop_lilies' },
      { type: 'prop', x: 33, y: 20, sprite: 'prop_lilies' },
      { type: 'emitter', x: 30, y: 18, kind: 'moths' },
      { type: 'emitter', x: 30, y: 20, kind: 'motes' },
      // her jars broke; what was in them went looking for somewhere warm
      { type: 'enemy', x: 26, y: 20, kind: 'unlit', if: 'moth_killed' },
      { type: 'enemy', x: 35, y: 18, kind: 'unlit', if: 'moth_killed' },
      { type: 'enemy', x: 31, y: 22, kind: 'unlit', if: 'moth_killed' },

      // ---- the avenue north to the barrow: antler shrines, penitents rooted beside them
      { type: 'prop', x: 37, y: 10, sprite: 'prop_stag_skull', anim: 'lit' },
      { type: 'prop', x: 37, y: 11, sprite: 'prop_candles' },
      { type: 'light', x: 37, y: 10, r: 50, color: CANDLE, intensity: 0.8, flicker: 0.2 },
      { type: 'prop', x: 33, y: 5, sprite: 'prop_stag_skull', anim: 'lit' },
      { type: 'prop', x: 34, y: 6, sprite: 'prop_candles' },
      { type: 'light', x: 33, y: 5, r: 50, color: CANDLE, intensity: 0.8, flicker: 0.2 },
      { type: 'light', x: 34, y: 1, r: 44, color: PALE, intensity: 0.5 },
      { type: 'light', x: 35, y: 14, r: 40, color: MOTH, intensity: 0.45 },
      { type: 'npc', x: 39, y: 6, npc: 'snuffer', dir: 'left', if: '!sn_hushwood' },
      { type: 'light', x: 39, y: 6, r: 30, color: '#857c86', intensity: 0.4, if: '!sn_hushwood' },

      // ---- the ford where the forester turned them back
      { type: 'npc', x: 47, y: 24, npc: 'h_carrier', dir: 'left' },
      { type: 'light', x: 46, y: 23, r: 44, color: MOTH, intensity: 0.5, flicker: 0.15 },
      { type: 'emitter', x: 46, y: 24, kind: 'motes' },

      // ---- the foresters' lodge
      { type: 'sign', x: 53, y: 25, sprite: 'prop_signpost', dialogue: 'h_lodge_order' },
      { type: 'corpse', x: 54, y: 28, id: 'h_c_lodge_forester', sprite: 'prop_corpse_soldier', text: [
        'A forester in a green coat gone grey, lying across the lodge floor. His quiver is full. He did not shoot.',
        'The kennel door hangs open. Whatever lives in the lodge now, he knew its name once.',
      ], do: ['pennies:+40'] },
      { type: 'prop', x: 50, y: 27, sprite: 'prop_barrel', solid: true },
      { type: 'prop', x: 55, y: 27, sprite: 'prop_crate', solid: true },
      { type: 'light', x: 52, y: 28, r: 44, color: MOTH, intensity: 0.4 },

      // ---- south: moth-wood and the bricked-up ice-house
      { type: 'light', x: 20, y: 31, r: 50, color: MOTH, intensity: 0.5, flicker: 0.2 },
      { type: 'emitter', x: 20, y: 31, kind: 'motes' },
      { type: 'sign', x: 13, y: 39, title: '', text: [
        'The foresters\' ice-house, dug into the hillside. The door has been bricked up from the outside — carefully, the mortar smoothed with a thumb.',
        'Someone sealed it the way you would close a tomb.',
      ] },
      { type: 'light', x: 12, y: 39, r: 36, color: MOTH, intensity: 0.4 },

      // ---- enemies
      { type: 'enemy', x: 33, y: 9, kind: 'briar' },
      { type: 'enemy', x: 37, y: 13, kind: 'briar' },
      { type: 'enemy', x: 33, y: 3, kind: 'briar' },
      { type: 'enemy', x: 50, y: 28, kind: 'hound' },
      { type: 'enemy', x: 52, y: 31, kind: 'hound' },
      { type: 'enemy', x: 55, y: 32, kind: 'hound' },
      { type: 'enemy', x: 21, y: 30, kind: 'moth' },
      { type: 'enemy', x: 19, y: 32, kind: 'moth' },
      { type: 'enemy', x: 22, y: 29, kind: 'moth' },
      { type: 'enemy', x: 13, y: 33, kind: 'hound' },
      { type: 'enemy', x: 18, y: 33, kind: 'hound' },
    ],
  };

  // ------------------------------------------------------------------ moth_hollow
  M.moth_hollow = {
    name: 'The Hollow Tree',
    region: 'hushwood',
    theme: 'hushwood',
    music: 'hushwood',
    weather: 'none',
    ambient: 0.76,
    ambientColor: '#0c0a14',
    indoor: true,
    tiles: [
      "##########################",
      "##########################",
      "##########......##########",
      "########..........########",
      "#######............#######",
      "#...###..............#####",
      "#...##................####",
      "#...H.................####",
      "#...##................####",
      "######................####",
      "#######..............#####",
      "########............######",
      "##########........########",
      "############..############",
      "############DD############",
      "##########################",
    ],
    spawns: { door: [12, 12, 'up'] },
    entities: [
      { type: 'exit', x: 12, y: 14, w: 2, h: 1, to: 'hushwood_deep', spawn: 'moth_door' },

      { type: 'npc', x: 13, y: 5, npc: 'mothwife' },
      { type: 'emitter', x: 13, y: 4, kind: 'moths', if: '!moth_killed' },
      { type: 'light', x: 13, y: 7, r: 90, color: MOTH, intensity: 0.55, flicker: 0.12, if: '!moth_killed' },

      // shelves of jars
      { type: 'sign', x: 11, y: 2, sprite: 'prop_jar_shelf', title: '', if: '!moth_killed', text: [
        'Jars of every kind: pickling jars, apothecary jars, a jam-pot with a paper lid. In each, a small flame drifts in its sleep.',
        'Every jar has a name scratched into the glass with a fingernail. Some are only a word. TALL ONE. BELL-RINGER\'S GIRL. MAUD. MAUD. MAUD.',
      ] },
      { type: 'sign', x: 11, y: 2, sprite: 'prop_jar_shelf', title: '', if: 'moth_killed', text: [
        'Every jar on the shelf is cracked and dark. The names are still scratched into the glass. There is nothing left to read them to.',
      ] },
      { type: 'prop', x: 14, y: 2, sprite: 'prop_jar_shelf', solid: true },
      { type: 'prop', x: 9, y: 3, sprite: 'prop_jar_shelf', solid: true },
      { type: 'prop', x: 17, y: 3, sprite: 'prop_jar_shelf', solid: true },
      { type: 'light', x: 11, y: 2, r: 34, color: PALE, intensity: 0.7, flicker: 0.3, if: '!moth_killed' },
      { type: 'light', x: 14, y: 2, r: 34, color: MOTH, intensity: 0.7, flicker: 0.3, if: '!moth_killed' },
      { type: 'light', x: 9, y: 3, r: 30, color: CANDLE, intensity: 0.55, flicker: 0.3, if: '!moth_killed' },
      { type: 'light', x: 17, y: 3, r: 30, color: PALE, intensity: 0.6, flicker: 0.3, if: '!moth_killed' },

      // jars on the floor
      { type: 'prop', x: 7, y: 6, sprite: 'prop_jar', anim: jarAnim },
      { type: 'prop', x: 8, y: 9, sprite: 'prop_jar', anim: jarAnim },
      { type: 'prop', x: 19, y: 6, sprite: 'prop_jar', anim: jarAnim },
      { type: 'prop', x: 20, y: 8, sprite: 'prop_jar', anim: jarAnim },
      { type: 'prop', x: 16, y: 11, sprite: 'prop_jar', anim: jarAnim },
      { type: 'prop', x: 10, y: 11, sprite: 'prop_jar', anim: jarAnim },
      { type: 'prop', x: 18, y: 10, sprite: 'prop_jar', anim: jarAnim },
      { type: 'light', x: 7, y: 6, r: 22, color: PALE, intensity: 0.55, flicker: 0.3, if: '!moth_killed' },
      { type: 'light', x: 8, y: 9, r: 22, color: MOTH, intensity: 0.55, flicker: 0.3, if: '!moth_killed' },
      { type: 'light', x: 19, y: 6, r: 22, color: CANDLE, intensity: 0.5, flicker: 0.3, if: '!moth_killed' },
      { type: 'light', x: 20, y: 8, r: 22, color: PALE, intensity: 0.55, flicker: 0.3, if: '!moth_killed' },
      { type: 'light', x: 16, y: 11, r: 22, color: MOTH, intensity: 0.55, flicker: 0.3, if: '!moth_killed' },
      { type: 'light', x: 10, y: 11, r: 22, color: PALE, intensity: 0.55, flicker: 0.3, if: '!moth_killed' },
      { type: 'light', x: 18, y: 10, r: 22, color: MOTH, intensity: 0.5, flicker: 0.3, if: '!moth_killed' },

      // after: ash where she sat
      { type: 'prop', x: 13, y: 5, sprite: 'prop_ash_pile', if: 'moth_killed' },
      { type: 'prop', x: 9, y: 7, sprite: 'prop_ash_pile', if: 'moth_killed' },
      { type: 'prop', x: 17, y: 9, sprite: 'prop_ash_pile', if: 'moth_killed' },
      { type: 'sign', x: 13, y: 6, title: '', if: 'moth_killed', text: [
        'Broken glass, and ash, and the smell of hot tin. Every jar in the hollow is empty.',
        'Nobody lives here now. Not even the moths.',
      ] },
      { type: 'light', x: 13, y: 9, r: 50, color: '#857c86', intensity: 0.4, if: 'moth_killed' },
      { type: 'light', x: 12, y: 12, r: 40, color: MOTH, intensity: 0.35 },

      // the root cellar behind the heartwood
      { type: 'corpse', x: 2, y: 7, id: 'h_c_maelis', sprite: 'prop_corpse_pilgrim', text: [
        'A small woman, long dead, curled among the roots. Her arms are grey to the elbow. Moths have made a nest of her hair.',
        'She holds an empty jar to her chest the way you would hold a cup of something warm.',
        'Scratched on the glass, very small: MAELIS. A thread is tied round her wrist, snapped. Whatever hung from it is gone.',
      ], do: ['set:h_moth_body'] },
      { type: 'sign', x: 2, y: 5, title: '', text: [
        'Twenty-one jars, empty and clean, lined up along the roots.',
        'Each has a name scratched into the glass — and each name has been scratched out again, carefully, the way you would close someone\'s eyes.',
      ] },
      { type: 'prop', x: 1, y: 5, sprite: 'prop_jar', anim: 'dark' },
      { type: 'prop', x: 3, y: 5, sprite: 'prop_jar', anim: 'dark' },
      { type: 'prop', x: 1, y: 8, sprite: 'prop_jar', anim: 'dark' },
      { type: 'prop', x: 3, y: 8, sprite: 'prop_jar', anim: 'dark' },
      { type: 'light', x: 2, y: 6, r: 26, color: MOTH, intensity: 0.35 },
    ],
  };

  // ------------------------------------------------------------------ hart_barrow
  M.hart_barrow = {
    name: 'The Hart Barrow',
    region: 'hushwood',
    theme: 'hushwood',
    music: 'hushwood',
    weather: ['fog', 'ash'],
    ambient: 0.58,
    ambientColor: '#0c1219',
    indoor: false,
    tiles: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTcccc===ccccTTTTTTTTT",
      "TTTTTTTTTccccc===cccccTTTTTTTT",
      "TTTTTTTTTcccccc#C#ccccccTTTTTT",
      "TTTTTTT,,bb,bb,,,,bb'''tTTtRTT",
      "TT''''|b,,,,,,,,,,,,'''|'',,tT",
      "TT''''%%,,,,,,,,,,,,,,,'',,,tT",
      "TT''''',,,,,,,,,,,,b,,,,,,,,TT",
      "Tt'''''''%,,,,,,,,,,,%,,,,,,RT",
      "Tt'|'''',%,,,,,,%,,,,%%,,,|,TT",
      "TT'''',,,,,,,,,,,,,,,,b,,,b,TT",
      "TT,''',,,,,,,,,,,'''''',,,,,TT",
      "TT,'',,,,,,,,,,,'''''''',,,'TT",
      "TT,,,,,,,,,,,,,,''''''',,b,'TT",
      "Tt,,b,,,,,,,,,,,''''''''%'''TT",
      "Tt,|,,,,,,,,,,,,''''''%%%%|'TT",
      "TT,,,,,,,,,,,,,,''''''''''''tT",
      "TT,,,,,,,,%%%%,,'''''''''',%TT",
      "TT,%,,,,,%%%%%,,,,,,,,,''',%RT",
      "TR,,,,|,,,%%%%,,,,,,,,,|',,%TT",
      "TT,,,,,,,',,,,,,,,,,,,,'',,,TT",
      "TTttttt,,,,,,,,,,,,,,ttRtRttTT",
      "TTttTtTRRRR|,,,,,,|ttttTTtRtTT",
      "TTTTTTTRTtTR,,::,btTRTTTTTTTTT",
      "TTTTTTTTTTTTt,::,tTTTTTTTTTTTT",
      "TTTTTTTTTTTTt,::,RTTTTTTTTTTTT",
    ],
    spawns: { south: [14, 23, 'up'] },
    entities: [
      { type: 'exit', x: 13, y: 25, w: 4, h: 1, to: 'hushwood_deep', spawn: 'barrow' },
      { type: 'trigger', x: 12, y: 22, w: 6, h: 1, id: 'h_t_barrow', if: '!boss_hart', dialogue: 'h_barrow_approach' },
      { type: 'boss', x: 14.5, y: 9, boss: 'boss_hart', arena: { x: 2, y: 4, w: 26, h: 18 }, if: '!boss_hart',
        onDefeat: ['dialogue:h_hart_after'] },

      // antler shrines between the standing stones
      { type: 'prop', x: 8, y: 5, sprite: 'prop_stag_skull', anim: 'lit' },
      { type: 'prop', x: 22, y: 5, sprite: 'prop_stag_skull', anim: 'lit', flip: true },
      { type: 'prop', x: 4, y: 9, sprite: 'prop_stag_skull', anim: 'lit' },
      { type: 'prop', x: 25, y: 9, sprite: 'prop_stag_skull', anim: 'lit', flip: true },
      { type: 'prop', x: 4, y: 15, sprite: 'prop_stag_skull', anim: 'lit' },
      { type: 'prop', x: 25, y: 15, sprite: 'prop_stag_skull', anim: 'lit', flip: true },
      { type: 'prop', x: 7, y: 19, sprite: 'prop_candles' },
      { type: 'prop', x: 22, y: 19, sprite: 'prop_candles' },
      { type: 'light', x: 8, y: 5, r: 48, color: CANDLE, intensity: 0.75, flicker: 0.2 },
      { type: 'light', x: 22, y: 5, r: 48, color: CANDLE, intensity: 0.75, flicker: 0.2 },
      { type: 'light', x: 4, y: 9, r: 44, color: CANDLE, intensity: 0.7, flicker: 0.2 },
      { type: 'light', x: 25, y: 9, r: 44, color: CANDLE, intensity: 0.7, flicker: 0.2 },
      { type: 'light', x: 4, y: 15, r: 44, color: CANDLE, intensity: 0.7, flicker: 0.2 },
      { type: 'light', x: 25, y: 15, r: 44, color: CANDLE, intensity: 0.7, flicker: 0.2 },
      { type: 'light', x: 7, y: 19, r: 44, color: CANDLE, intensity: 0.7, flicker: 0.2 },
      { type: 'light', x: 22, y: 19, r: 44, color: CANDLE, intensity: 0.7, flicker: 0.2 },
      { type: 'light', x: 14, y: 12, r: 110, color: PALE, intensity: 0.35 },
      { type: 'light', x: 14, y: 23, r: 40, color: MOTH, intensity: 0.45 },
      { type: 'emitter', x: 14, y: 8, kind: 'motes' },

      // the Old Hart's flame, if Brand left it hanging
      { type: 'light', x: 14.5, y: 10, r: 96, color: PALE, intensity: 1, flicker: 0.1, if: 'h_hart_left' },
      { type: 'emitter', x: 14.5, y: 10, kind: 'motes', if: 'h_hart_left' },
      { type: 'sign', x: 14.5, y: 10, dialogue: 'h_hart_flame', if: 'h_hart_left' },
      { type: 'npc', x: 12, y: 11, npc: 'h_hartling', if: 'h_hart_left' },
      { type: 'npc', x: 17, y: 12, npc: 'h_hartling', dir: 'left', if: 'h_hart_left' },
      // after his name is spoken, the hartlings come back to graze
      { type: 'npc', x: 8, y: 12, npc: 'h_hartling', if: 'hart_named', wander: 2 },
      { type: 'npc', x: 20, y: 14, npc: 'h_hartling', dir: 'left', if: 'hart_named', wander: 2 },
      { type: 'npc', x: 13, y: 17, npc: 'h_hartling', if: 'hart_named', wander: 2 },

      // the barrow's sealed door, and what lies behind it
      { type: 'sign', x: 14, y: 1, title: '', text: [
        'A slab in the barrow wall, carved with names: foresters of the Hart, keepers of the barrow, one under another for longer than Lanthorn has had kings.',
        'The last line is newer than the rest, cut shallow, as if in a hurry: CAEL, WHO KEPT THE STONE.',
        'Below it, the slab is blank.',
      ] },
      { type: 'sign', x: 15, y: 2, sprite: 'prop_bone_pile', solid: false, dialogue: 'h_barrow_bones' },
      { type: 'light', x: 15, y: 2, r: 30, color: CANDLE, intensity: 0.4 },
    ],
  };

  // ------------------------------------------------------------------ hushwood_cave
  M.hushwood_cave = {
    name: 'The Wintering Cave',
    region: 'hushwood',
    theme: 'cave',
    music: 'cave',
    weather: 'none',
    ambient: 0.7,
    ambientColor: '#07060a',
    indoor: true,
    tiles: [
      "####################################",
      "####################################",
      "####################################",
      "####################################",
      "####################################",
      "####################.---.#####....##",
      "###################.-~~~-....#....##",
      "#################...--~--....C....##",
      "################.....---.....#...###",
      "################.......b.....#######",
      "################.............#######",
      "###############r.............#######",
      "#############b.r.#.........r.#######",
      "######....##...r####....############",
      "#####..r......#########.r###########",
      "####..........#########.r###########",
      "###.....r.b....#######......########",
      "###............######........#######",
      "###...r........######........#######",
      "###..b........########.b....########",
      "####.........#######################",
      "####.....###########################",
      "####...#############################",
      "####...#############################",
      "#####s##############################",
      "#####s##############################",
    ],
    spawns: { entrance: [5, 22, 'up'] },
    entities: [
      { type: 'exit', x: 5, y: 25, w: 1, h: 1, to: 'hushwood_deep', spawn: 'cave' },
      { type: 'light', x: 5, y: 22, r: 44, color: MOTH, intensity: 0.4 },

      // the refugees' last camp
      { type: 'prop', x: 4, y: 17, sprite: 'prop_shroud' },
      { type: 'prop', x: 6, y: 19, sprite: 'prop_shroud' },
      { type: 'prop', x: 10, y: 18, sprite: 'prop_shroud' },
      { type: 'prop', x: 9, y: 16, sprite: 'prop_ash_pile' },
      { type: 'prop', x: 11, y: 19, sprite: 'prop_jar', anim: 'dark' },
      { type: 'corpse', x: 7, y: 17, id: 'h_c_cave_three', sprite: 'prop_corpse_pilgrim', text: [
        'Three of them under one blanket, the smallest in the middle.',
        'They look as though they went to sleep warm.',
      ] },
      { type: 'corpse', x: 12, y: 15, id: 'h_c_cave_wat', sprite: 'prop_corpse_pilgrim', text: [
        'An old man with a cane across his lap, and a purse of pennies he was saving for something.',
        'Pressed into the moss beside him, very faint: the print of a great cloven hoof.',
      ], do: ['pennies:+30'] },
      { type: 'item', x: 5, y: 15, id: 'h_copybook', item: 'lore_h_copybook',
        text: 'A child\'s copybook, the pages gone soft as cloth. The letters are large and careful.' },
      { type: 'sign', x: 7, y: 13, title: '', text: [
        'Scratched into the rock: tally marks in fives. Forty-one days.',
        'Then the marks go on without being counted — just lines, one after another, all the way down to the floor.',
      ] },
      { type: 'light', x: 6, y: 16, r: 56, color: MOTH, intensity: 0.5, flicker: 0.15 },
      { type: 'emitter', x: 9, y: 14, kind: 'drips' },

      // the passage and the den with the pool
      { type: 'light', x: 13, y: 12, r: 40, color: MOTH, intensity: 0.45 },
      { type: 'light', x: 21, y: 8, r: 64, color: MOTH, intensity: 0.55, flicker: 0.1 },
      { type: 'emitter', x: 21, y: 5, kind: 'drips' },
      { type: 'emitter', x: 22, y: 7, kind: 'motes' },
      { type: 'light', x: 26, y: 11, r: 40, color: MOTH, intensity: 0.4 },
      { type: 'prop', x: 25, y: 12, sprite: 'prop_bone_pile' },

      // the side pocket: names at a child's height
      { type: 'sign', x: 22, y: 16, title: '', text: [
        'Names scratched low on the wall, at a child\'s height: JENET. OLD WAT. BENNO. THE TWINS.',
        'Beside each one, someone taller has scratched a small flame.',
      ] },
      { type: 'corpse', x: 26, y: 17, id: 'h_c_cave_fare', sprite: 'prop_corpse_pilgrim', text: [
        'A woman sitting against the wall with a knotted cloth in her lap: coins, counted out exactly.',
        'A fare, you think, to somewhere that stopped taking passengers.',
      ], do: ['pennies:+45'] },
      { type: 'light', x: 24, y: 17, r: 48, color: MOTH, intensity: 0.45, flicker: 0.15 },

      // behind the cracked wall: a knight of the Seventh Gate
      { type: 'corpse', x: 32, y: 6, id: 'h_c_cave_knight', sprite: 'prop_corpse_knight', item: 'oath_ribbon', text: [
        'A knight of the Seventh Gate, in the grey tabard of your own command, sitting with his back to the rock and his sword across his knees, facing the way in.',
        'Knotted round the hilt: an oath-ribbon, tied twice.',
        'Scratched into the stone beside him, in a soldier\'s capitals: SWORE TO THE WARDEN. SWORE TO THEM. KEPT ONE.',
      ] },
      { type: 'light', x: 31, y: 7, r: 40, color: CANDLE, intensity: 0.5, flicker: 0.2 },
      { type: 'emitter', x: 31, y: 6, kind: 'motes' },

      // ---- enemies
      { type: 'enemy', x: 18, y: 11, kind: 'briar' },
      { type: 'enemy', x: 19, y: 9, kind: 'hound' },
      { type: 'enemy', x: 26, y: 10, kind: 'hound' },
      { type: 'enemy', x: 24, y: 18, kind: 'moth' },
      { type: 'enemy', x: 27, y: 18, kind: 'moth' },
    ],
  };
})(window.AV);
