// ASHEN VOW — Greyharrow: the old battlefield, the ossuary in the hill, its heart, and the company tomb (builder: GREYHARROW)
(function (AV) {
  'use strict';
  const M = AV.data.maps;

  const WARM = '#f59a36';
  const FIRE = '#e2621f';
  const CANDLE = '#fccf63';
  const COLD = '#82a8ad';
  const PALE = '#b9d6d3';

  const crow = (x, y, anim) => ({ type: 'prop', x, y, sprite: 'prop_crow', anim: anim || 'idle', solid: false });
  const pikes = (x, y, flip) => ({ type: 'prop', x, y, sprite: 'prop_pikes', solid: true, flip: !!flip });
  const niche = (x, y) => ({ type: 'prop', x, y, sprite: 'prop_skull_niche', solid: false });
  const bones = (x, y) => ({ type: 'prop', x, y, sprite: 'prop_bone_pile', solid: false });

  // ------------------------------------------------------------------ the field
  M.greyharrow_field = {
    name: 'Greyharrow Field',
    region: 'greyharrow',
    theme: 'greyharrow',
    music: 'greyharrow',
    weather: ['ash'],
    ambient: 0.5,
    ambientColor: '#0d0b10',
    indoor: false,
    tiles: [
      "TtTTTTTT:::TTTTTTTTTTTcccccccccccccccccccccccccccccccccccccccccc",
      "TTTTTTTa:::..,,.a.m.TTcccccccccccccccccccccccccccccccccccccccccc",
      "TTTTTTT,:::PPPPPPPPP,tcccccccccccccccccccccccccccccccccccccccccc",
      "TtTTTTT,,::P.aa.a..P,,cccccccccccccccccccccccccccccccccccccccccc",
      "TTt,T..,,:,Pa......,.,cccccccccccccccccccccccccccccccccccccccccc",
      "TT,,...,.:,,a....a..,,cccccccccccccccccccccccccccccccccccccccccc",
      "Tt.m,,m.,::....x....,,,,Pmm.cccccccccccccccccccccccccccccccccccc",
      "TT,.,.,,.:,:..xxx...,,,aPmm.ccccccccccccccccccccccccccccc#D#cccc",
      "TT,,..,.,:.....xa..,Rmm,Pmm,m,a,ccccc##########ccccccccc##C##ccc",
      "Ttt,,.,,.:m,.a.a...,m.,.Pbm.,,.,ccccc##########ccccc,,.R,..r,RmT",
      "TT,,m,.,.:,.t,..,.,PP.,,Pmm..,,.ccccc####DD####ccccc,,t.,r..t,.T",
      "TT,..,,.,:,,.,,,a..,,..,Pmm.,a,b,,,,.!.|.::.|.!,..,.,m,,,,m,.,RT",
      "TttR..aa,:.,a,,m..,,a,,,Pmm,.%,.,::m::mm:::.bb,,,.,,,t.,b.,..,,T",
      "TTt,,,.,.:...,,.,b.a,,.,Pmm,+a+.,:::::::m...bb,.a,..,.,.,,,.,m.T",
      "TTt....,,:a,,,.a...a.,,,Pmm.,,b,.::,.bbb....bb,b,,,,...bmaR.,,,T",
      "Tt.a,...,:...,,.,.,a,m..Pmb,+.+..:m,.a.,.m,.bb,,,..,m..,,m,.,..T",
      "TT,..PPP,:,,...,..,P,,.,Pmm,..m%,::,,,.,bb,b,,.b,b..a,...,a,.,tT",
      "TTtm.,m..:,,a.a,..a,,...Pmm,+.+,.mma,a,,a..b.,,x,,,,.....,,,.,,T",
      "Tt..,.,..:,.ba,.,.,.,,,,Pmm,,,.,amm.,bm,m.,m.,xxx..,,,..,.,..,,T",
      "TT....a,.:,,,a.,..,,,,.,Pmb.+,+,bmm.m,,a,.,,,,.x.,.b...PP.,,a,,T",
      "TTm.,,,b.:,a.,,rrr.,,R,aPmmb.%b..:m,P,m,aa,,,...,.,,bb,,,a,.,,,T",
      "Tt...,,a,:,,.,rrxrr,.m.,Pmm,+,+.,::.a,,.,ab,.ab,..m,mab,.a,.,,,T",
      "TT.,t.b.,:,b.,rx-xr.m,.,Pmm.,b.,am:,..,,b.b,R,,,b.,,,.,,..,m,R,T",
      "TT,,....,:.,,,rrxrra,,,.Pmm..,..b:m,,.,..m,,.a,,,m,,..b,m,,.,,,T",
      "Ttm,,,.,,:,m,,,rrr,,..,,PPPPPPPPPmmPPPPPPPPPPPPPPPmmPPPPPPPPPPPT",
      "TT,,.,,b.:,.,.,.,..,,,,.Pmmmbmmmb:bmmmmmmmbmmmmmmmmmmmmmbbmmmmmT",
      "TT,..a,,,:,,.,,,.,m.a,,,Pmmmmmmmm:mmbmmmmmmbmmrrrmmmmbmbmmmmmbmT",
      "Ttm,,,,,,:,.,mma.....,t.Pmm......::a,...,,..,rxxxr.m.maa,a..,m,T",
      "TTt,,,.,.:b,b,,,,,,.,...Pmb,a,.b,::,,,.,.m,brxxxxxr,aaa.b,rrr.,T",
      "TT,,.,x..:,a.,,a,b..,,.,Pmm,,.m,.::aPPrrra.arxx-xxrb.,,marrxrr,T",
      "Tt,,.xxx,:,,,.aPPP,.a,,,Pmb,,,,,.::.,rxxxr.,rxxxxxra,PPb.rxxxr.T",
      "TTtm.ax,,:,.,,,,.,...,,,Pbm..b..,mmbrxxxxxr.,rxxxr.,a...,rrxrr,T",
      "TT.,m,,,,:..m,.,,,,,m,,mPmm,..,..:m,rxx-xxrmm,rrr.,.m.b,,.rrra.T",
      "Tt.R..b,,:,,.,.,,.,.a,,,Pmm.PP..a::,rxxxxxra.a,a,,,,,b,rrra.a,,T",
      "TT,,..,,,:,,t,..,,.m..,,Pmm,,,b,.::b,rxxxr.,,,,.b.ma.rrxxxrr..RT",
      "TT,,.,,..:,,.aa,,m,.a,..Pmm.a.,..::,.,rrr,.aPPPb.aa..rxxxxxr,.,T",
      "Ttmm.,.,.:,,,..,.,.ba,.rPmm,,,.a.::.m,,.,,,b,,..a,,brxxx-xxxr..T",
      "TT.,PP,..:,,a,,,,,,,,,,,r....,.m.:m,,,b,a.,a..b.a,..rxx---xxr..T",
      "TT..,b,m.::::::::::::::::::::m:m:::a.a...,,,,,a,,,,mrxxx-xxxrm,T",
      "Tt,.m,...:a:::::::::::::::::m:m::b,b.,,.rrr,,,,,aR.,,rxxxxxr,,.T",
      "TT,,,,..,.ba,...,,,...m...r,m,.,..b,.,arxxxra,mt.,,,,rrxxxrr.,,T",
      "TTt.ma.t..,,.,,m,,m,,,,rP,,m.rrR,.,...rxxxxxr.a.,,,rrr.rrr,.Pm,T",
      "Tt,,--..,,,m..R,..,..,.,P..brrxrra,..,rxx-xxr.,.m.rrxrr,a,,,,,.T",
      "TT..,---,,..,,,.m,,.,...P,,,rxxxr,m,a,rxxxxxr..a.,rxxxr.,,aaa..T",
      "TTt,,t,t,,,.tttttta,Rtt,Pt,trrxrrt.,,a,rxxxra.mta.rrxtr,taabt,.T",
      "Ttt,tmt,,tt,ttt.t.mtt,,,Pt,..rrt,,a,Rtt.rtrtt..t,,ttrr.m,,.t,t,T",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    ],
    spawns: {
      north: [9, 2, 'down'],
      ossuary_door: [41, 12, 'down'],
      crypt: [58, 10, 'down'],
    },
    entities: [
      // ---- ways out
      { type: 'exit', x: 8, y: 0, w: 3, h: 1, to: 'village', spawn: 'south' },
      { type: 'exit', x: 41, y: 10, w: 2, h: 1, to: 'ossuary', spawn: 'entrance' },
      { type: 'exit', x: 58, y: 7, w: 1, h: 1, to: 'greyharrow_crypt', spawn: 'entrance' },
      { type: 'trigger', id: 'g_t_field', x: 7, y: 4, w: 5, h: 2, dialogue: 'g_field_enter' },
      { type: 'trigger', id: 'g_t_line', x: 24, y: 37, w: 3, h: 4, dialogue: 'g_line_memory' },

      // ---- the road in
      { type: 'sign', x: 11, y: 1, sprite: 'prop_signpost', title: 'Signpost', text: [
        'GREYHARROW. Under it, a newer board: THE FIELD IS CLOSED BY ORDER. Under that, in charcoal: WHOSE.',
      ] },
      crow(12, 12, 'peck'), crow(7, 9, 'look'),
      { type: 'light', x: 9, y: 19, r: 36, color: WARM, intensity: 0.35, flicker: 0.2 },

      // ---- Hesk's camp, in the lee of the hill
      { type: 'prop', x: 15, y: 4, sprite: 'prop_tent', solid: true },
      { type: 'prop', x: 15, y: 7, sprite: 'prop_campfire', solid: true, light: { r: 76, color: WARM, flicker: 0.22 } },
      { type: 'emitter', x: 15, y: 6.4, kind: 'smoke' },
      { type: 'shrine', x: 17, y: 7, id: 'shrine_greyharrow', name: "Hesk's Fire" },
      { type: 'npc', x: 13, y: 7, npc: 'hesk', dir: 'right', if: '!hesk_waits' },
      { type: 'prop', x: 18, y: 4, sprite: 'prop_barrel', solid: true },
      { type: 'prop', x: 12.5, y: 9, sprite: 'prop_crate', solid: true },
      { type: 'prop', x: 17, y: 9, sprite: 'prop_weapon_rack', solid: true },
      { type: 'sign', x: 19, y: 4, sprite: null, title: 'A Plank', text: [
        "Painted on a plank at the gap in the stakes: HESK'S. NO KNIGHTS.",
        'Added underneath, on a worse night: NO ANYBODY.',
      ] },

      // ---- the west side: the long way round
      { type: 'corpse', id: 'g_pilgrim', x: 5, y: 28, sprite: 'prop_corpse_pilgrim', item: 'pilgrim_breath', text: [
        'A pilgrim woman kneels on the highest ground this side of the stakes, facing the hill. She came a long way to look at it. Then she stayed.',
        'Among the prayer-knots at her belt, a little wax-stoppered vial. Whatever she was saving it for, she never opened it.',
      ] },
      { type: 'enemy', x: 5, y: 22, kind: 'hound' },
      { type: 'enemy', x: 7, y: 23, kind: 'hound' },
      { type: 'enemy', x: 6, y: 25, kind: 'hound' },
      pikes(19, 26), pikes(6, 33, true), pikes(18, 36),
      crow(15, 29, 'peck'), crow(21, 19),
      { type: 'item', id: 'g_ribbon', x: 22, y: 30, item: 'oath_ribbon',
        text: 'Knotted round a stake of the Harrow line: a strip of grey cloth, bleached almost white. Somebody\'s promise to come home. You take it up.' },

      // ---- the Harrow line (stakes and trench, north to south)
      { type: 'corpse', id: 'g_jory', x: 26, y: 31, sprite: 'prop_corpse_soldier', item: 'hound_whistle', do: ['give:lore_g_pike_note'], text: [
        'A corporal of the Harrow sits in the trench with his back to the stakes, as if he only sat down to rest his feet. The crows have been polite about him.',
        'His fist is closed round a bone whistle, carved small and badly and with love. Inside his coat, a letter folded to the size of a thumb. Never sent.',
      ] },
      crow(25, 29, 'look'), crow(26, 12, 'peck'),

      // ---- no-man's land (south of the Carrow stakes)
      { type: 'enemy', x: 36, y: 34, kind: 'shieldbound' },
      { type: 'enemy', x: 44, y: 38, kind: 'pikeman' },
      { type: 'enemy', x: 50, y: 32, kind: 'pikeman' },
      { type: 'enemy', x: 57, y: 43, kind: 'shieldbound' },
      { type: 'enemy', x: 46, y: 41, kind: 'hound' },
      { type: 'enemy', x: 48, y: 42, kind: 'hound' },
      { type: 'enemy', x: 45, y: 43, kind: 'hound' },
      pikes(31, 30), pikes(53, 34, true), pikes(42, 27),
      { type: 'corpse', id: 'g_carrow_knight', x: 40, y: 37, sprite: 'prop_corpse_knight', do: ['pennies:+45'], text: [
        'A knight of Carrow, by the black and yellow on what is left of his surcoat. He got further across the field than anyone else on his side.',
        'Someone closed his eyes with pennies, a long time ago. Carrow pennies. They spend the same.',
      ] },
      { type: 'corpse', id: 'g_shieldman', x: 58, y: 42, sprite: 'prop_corpse_soldier', item: 'lore_g_song', text: [
        'A shieldman of the Harrow, face down, his shield across his back like a tortoise.',
        'Inside the shield, scratched with a knife-point over many nights, the words of a song. Somebody has corrected the spelling, in a different hand.',
      ] },
      crow(43, 27, 'peck'), crow(38, 31), crow(60, 26, 'look'), crow(40, 44, 'peck'), crow(27, 34),
      { type: 'emitter', x: 39, y: 32, kind: 'smoke' },
      { type: 'emitter', x: 56, y: 37, kind: 'smoke' },
      { type: 'emitter', x: 47, y: 29, kind: 'ash' },
      { type: 'emitter', x: 30, y: 40, kind: 'ash' },

      // ---- the Carrow stakes; ash drifts against their north face
      { type: 'corpse', id: 'g_marlow_ash', x: 45, y: 23, sprite: 'prop_ash_pile', item: 'tag_field', text: [
        'Ash has drifted against the north face of the Carrow stakes the way snow drifts against a fence. The wind comes from the city. It always does, now.',
        'Caught on a splinter at the heart of the drift: a tin tag on a scorched cord. Of all the stakes in Lanthorn, it snagged on these.',
      ] },

      // ---- before the hill: the company graves, the ossuary door
      { type: 'sign', x: 31, y: 14, sprite: null, title: 'Grave-markers', text: [
        'Names cut into the markers with a knife-point: ASKE. COLLEY. DUNSTAN. PELL. After the fourth, the markers are blank.',
        'Somebody ran out of names. Or out of knife.',
      ] },
      { type: 'prop', x: 28, y: 17.4, sprite: 'prop_bird', solid: false },
      { type: 'prop', x: 30, y: 21.4, sprite: 'prop_bird', solid: false },
      { type: 'light', x: 29, y: 17, r: 52, color: COLD, intensity: 0.35, flicker: 0.05 },
      { type: 'npc', x: 32, y: 18, npc: 'snuffer', dir: 'left', if: '!sn_greyharrow' },
      { type: 'corpse', id: 'g_pikeman_stand', x: 35, y: 18, sprite: 'prop_corpse_soldier', do: ['pennies:+20'], text: [
        'A pikeman who died leaning on his pike, which is the only reason he is still upright. The ash has settled on his shoulders like epaulettes.',
        'There are pennies in his boot. A soldier\'s bank.',
      ] },
      { type: 'enemy', x: 38, y: 16, kind: 'shieldbound' },
      { type: 'enemy', x: 46, y: 15, kind: 'pikeman' },
      { type: 'enemy', x: 55, y: 13, kind: 'pikeman' },
      pikes(37, 21, true), pikes(49, 16),
      crow(30, 22), crow(36, 14, 'look'), crow(48, 13, 'peck'),
      { type: 'sign', x: 38, y: 12, sprite: null, title: 'Over the Door', text: [
        'Cut deep over the door: HERE THE HARROW LIES DOWN.',
        'Scratched beneath it, much later, and not nearly as deep: STILL HOLDING.',
      ] },
      { type: 'prop', x: 40, y: 10, sprite: 'prop_banner', solid: false },
      { type: 'prop', x: 43, y: 10, sprite: 'prop_banner', solid: false },
      bones(36, 13), bones(47, 12),
      { type: 'emitter', x: 37, y: 10.6, kind: 'embers' },
      { type: 'emitter', x: 46, y: 10.6, kind: 'embers' },

      // ---- the bricked door in the east shoulder of the hill (secret)
      { type: 'sign', x: 56, y: 9, sprite: null, title: 'Bricked Door', text: [
        'A doorway in the hill, bricked up in a hurry by someone who had never bricked anything. The mortar is mostly mud.',
        "Chalked across the bricks: a flame over a shield. A soldier's mark. It would not take much to knock it through.",
      ] },
      crow(58, 11, 'look'), crow(60, 9.5),
      { type: 'light', x: 58, y: 9, r: 30, color: PALE, intensity: 0.3, flicker: 0.05 },
      { type: 'emitter', x: 52, y: 18, kind: 'ash' },

      // ---- on the hill: old stakes the crows use for a lookout
      { type: 'prop', x: 34, y: 4, sprite: 'prop_pikes', solid: false },
      { type: 'prop', x: 47, y: 3, sprite: 'prop_pikes', solid: false, flip: true },
      { type: 'prop', x: 57, y: 4, sprite: 'prop_pikes', solid: false },
      { type: 'prop', x: 27, y: 2, sprite: 'prop_banner', solid: false },
      crow(40, 5, 'look'), crow(52, 3, 'peck'), crow(30, 1),
      { type: 'emitter', x: 42, y: 4, kind: 'ash' },
    ],
  };

  // ------------------------------------------------------------------ the ossuary
  M.ossuary = {
    name: 'The Ossuary',
    region: 'greyharrow',
    theme: 'cave',
    music: 'greyharrow',
    weather: 'none',
    ambient: 0.7,
    ambientColor: '#08070b',
    indoor: true,
    tiles: [
      "############################################",
      "############################################",
      "############################################",
      "#####################DD#####################",
      "####################b..b####################",
      "####################....###########.......##",
      "####################....###########.......##",
      "####################....###########.IIIII.##",
      "####################....###########.IbbbI.##",
      "###....b....########....###########.IbbbI.##",
      "###...b.....!======bbbbbb======!=##.II.II.##",
      "###....b.b..=====================##.......##",
      "###....####==|================|==##.......##",
      "###.b....b.========================.......##",
      "###........========================.......##",
      "###....####==|================|==###..######",
      "###..b.....======================###..######",
      "###.b......======================#......b.##",
      "###........==|================|==#b.......##",
      "###b...####======================#........##",
      "###....####======================#........##",
      "###.b..####=!==================!=#b....b..##",
      "###b...#############....##########.....b..##",
      "###....#############....##########..b.b..b##",
      "###....#############....##########......bb##",
      "###...b#########.!........!.######.b.b....##",
      "###....#########........b...######...b....##",
      "###..bb..........b...b..b.b.......b.......##",
      "###.....b....b...........bb...............##",
      "###b.....b.bb..bb...b....b..........b...b.##",
      "################.b....b.....################",
      "################.......b...b################",
      "#####################..#####################",
      "#####################DD#####################",
    ],
    spawns: {
      entrance: [21, 31, 'up'],
      heart_door: [21, 5, 'down'],
    },
    entities: [
      // ---- ways out
      { type: 'exit', x: 21, y: 33, w: 2, h: 1, to: 'greyharrow_field', spawn: 'ossuary_door' },
      { type: 'exit', x: 21, y: 3, w: 2, h: 1, to: 'ossuary_heart', spawn: 'door', lock: 'ossuary_key',
        lockedText: 'An iron door, cold enough to hurt through a gauntlet. The keyhole is worn bright. Behind it, someone is counting under his breath.' },
      { type: 'trigger', id: 'g_t_ossuary_in', x: 19, y: 28, w: 6, h: 2, dialogue: 'g_ossuary_enter' },

      // ---- the entrance hall
      niche(17, 24), niche(19, 24), niche(24, 24), niche(26, 24),
      bones(18, 30), bones(26, 30),
      { type: 'light', x: 21.5, y: 29, r: 44, color: WARM, intensity: 0.4, flicker: 0.15 },

      // ---- the roll-call chamber
      { type: 'trigger', id: 'g_t_rollcall', x: 20, y: 20, w: 4, h: 2, if: '!rollcall_answered && !rollcall_broken && !seen_g_rollcall', dialogue: 'g_rollcall' },
      { type: 'prop', x: 21.5, y: 12.5, sprite: 'prop_drum', solid: true, if: '!rollcall_broken' },
      { type: 'prop', x: 21.5, y: 12.5, sprite: 'prop_rubble', solid: false, if: 'rollcall_broken' },
      { type: 'sign', x: 21.5, y: 12.5, sprite: null, if: 'rollcall_answered', title: 'The Drum', text: [
        'The company drum. Someone has laid the sticks across the head, neatly, the way you would at the end of a day\'s march.',
      ] },
      { type: 'sign', x: 21.5, y: 12.5, sprite: null, if: 'rollcall_broken', title: 'The Drum', text: [
        'The drumhead hangs in two flaps. The sticks are nowhere. The bones along the walls look, somehow, further away than they did.',
      ] },
      { type: 'npc', x: 19.5, y: 12.5, npc: 'g_sergeant', dir: 'down', if: '!rollcall_answered && !rollcall_broken' },
      { type: 'npc', x: 18.5, y: 16, npc: 'g_soldier', dir: 'up', if: '!rollcall_answered && !rollcall_broken' },
      { type: 'npc', x: 20, y: 16, npc: 'g_soldier', dir: 'up', if: '!rollcall_answered && !rollcall_broken' },
      { type: 'npc', x: 23, y: 16, npc: 'g_soldier', dir: 'up', if: '!rollcall_answered && !rollcall_broken' },
      { type: 'npc', x: 24.5, y: 16, npc: 'g_soldier', dir: 'up', if: '!rollcall_answered && !rollcall_broken' },
      { type: 'npc', x: 18.5, y: 18, npc: 'g_soldier', dir: 'up', if: '!rollcall_answered && !rollcall_broken' },
      { type: 'npc', x: 20, y: 18, npc: 'g_soldier', dir: 'up', if: '!rollcall_answered && !rollcall_broken' },
      { type: 'npc', x: 21.5, y: 18, npc: 'g_soldier', dir: 'up', if: '!rollcall_answered && !rollcall_broken' },
      { type: 'npc', x: 23, y: 18, npc: 'g_soldier', dir: 'up', if: '!rollcall_answered && !rollcall_broken' },
      { type: 'npc', x: 24.5, y: 18, npc: 'g_soldier', dir: 'up', if: '!rollcall_answered && !rollcall_broken' },
      { type: 'light', x: 21.5, y: 16, r: 90, color: COLD, intensity: 0.55, flicker: 0.06, if: '!rollcall_answered && !rollcall_broken' },
      { type: 'emitter', x: 21.5, y: 15, kind: 'motes', if: '!rollcall_answered && !rollcall_broken' },
      niche(14, 9), niche(16, 9), niche(27, 9), niche(29, 9),
      { type: 'prop', x: 17.5, y: 9, sprite: 'prop_banner', solid: false },
      { type: 'prop', x: 25.5, y: 9, sprite: 'prop_banner', solid: false },

      // ---- the passage to the heart
      { type: 'light', x: 21.5, y: 6, r: 40, color: FIRE, intensity: 0.45, flicker: 0.2 },
      { type: 'emitter', x: 21.5, y: 4.5, kind: 'embers' },

      // ---- west galleries of bone
      { type: 'corpse', id: 'g_keyman', x: 4, y: 9, sprite: 'prop_corpse_soldier', item: 'ossuary_key', text: [
        'A soldier sits against the bones at the far end of the gallery, keeping watch on nothing. A bootlace round his neck, and on it an iron key.',
        'It was his week to hold it. It has been his week for a long time.',
      ] },
      { type: 'enemy', x: 5, y: 18, kind: 'pikeman' },
      { type: 'enemy', x: 4, y: 24, kind: 'shieldbound' },
      { type: 'enemy', x: 9, y: 28, kind: 'pikeman' },
      bones(4, 28), bones(14, 29), bones(9, 9.5), bones(5, 15),
      niche(9, 26), niche(11, 26), niche(13, 26), niche(8, 12), niche(8, 19),
      { type: 'light', x: 4.5, y: 20, r: 48, color: COLD, intensity: 0.4, flicker: 0.05 },
      { type: 'light', x: 5, y: 10, r: 40, color: WARM, intensity: 0.35, flicker: 0.2 },
      { type: 'emitter', x: 5, y: 12, kind: 'drips' },

      // ---- east wing: the quartermaster, the officers' rail
      { type: 'prop', x: 38.5, y: 19, sprite: 'prop_desk', solid: true },
      { type: 'prop', x: 36, y: 19, sprite: 'prop_candles', solid: false, light: { r: 44, color: CANDLE, flicker: 0.2 } },
      { type: 'item', id: 'g_roll', x: 38, y: 21, item: 'lore_g_fallen',
        text: 'Open on the quartermaster\'s desk: the company roll. The last pages are one name, written over and over.' },
      { type: 'item', id: 'g_grave_iron', x: 38, y: 8, item: 'grave_iron',
        text: 'Inside the officers\' rail, among bones laid out with more care than the rest: a length of black grave-iron, prised loose by someone who meant to come back for it.' },
      { type: 'enemy', x: 37, y: 25, kind: 'shieldbound' },
      { type: 'enemy', x: 39, y: 12, kind: 'pikeman' },
      bones(35, 28), bones(40, 18), bones(40, 13),
      niche(39, 16), niche(40, 16),
      { type: 'light', x: 38, y: 8.5, r: 46, color: COLD, intensity: 0.45, flicker: 0.05 },
      { type: 'light', x: 38, y: 26, r: 40, color: WARM, intensity: 0.3, flicker: 0.2 },
    ],
  };

  // ------------------------------------------------------------------ the heart of the hill (Ser Odo)
  M.ossuary_heart = {
    name: 'The Heart of the Hill',
    region: 'greyharrow',
    theme: 'cave',
    music: 'greyharrow',
    weather: 'none',
    ambient: 0.72,
    ambientColor: '#0a0709',
    indoor: true,
    tiles: [
      "############################",
      "############################",
      "#..........ba..............#",
      "#.!..bb.a.bbbbbbbb......a!.#",
      "#......a.bbbbbbbbb........b#",
      "#.....b...bbbbbbbb......a..#",
      "#.....|...bbbbbbbb...|....b#",
      "#...........b....ab......a.#",
      "#............a..b......b...#",
      "#.a.b.........b....b....b..#",
      "#.b...........b...a..a..b..#",
      "#.b........b..a...a........#",
      "#.....bb.........b.b...abb.#",
      "#.......baa.............b..#",
      "#.....|.a.....b......|....b#",
      "#.b..b...b.................#",
      "#....b..........aab......a.#",
      "#a..........b....a..aa.b.a.#",
      "#.!..a.b.b............ba.!.#",
      "#.a.b.bb..b.........b..b...#",
      "############....############",
      "############....############",
      "############....############",
      "#############DD#############",
    ],
    spawns: {
      door: [13, 21, 'up'],
    },
    onEnter: ['unset:g_odo_armed'],
    entities: [
      { type: 'exit', x: 13, y: 23, w: 2, h: 1, to: 'ossuary', spawn: 'heart_door' },
      { type: 'trigger', id: 'g_t_heart', x: 9, y: 16, w: 10, h: 2, if: '!odo_fight', dialogue: 'g_heart_enter' },
      // after a death mid-fight he is waiting on his feet; stepping in starts it again
      { type: 'trigger', id: 'g_t_odo_again', x: 9, y: 16, w: 10, h: 2, once: false, if: 'odo_fight && !boss_odo && !g_odo_armed', dialogue: 'g_odo_again' },

      { type: 'boss', x: 13.5, y: 6, boss: 'boss_odo', startOn: 'manual', hidden: true, if: '!boss_odo',
        arena: { x: 1, y: 2, w: 26, h: 18 }, onDefeat: ['dialogue:g_odo_after'] },
      { type: 'npc', x: 13.5, y: 6, npc: 'odo', dir: 'down', if: '!odo_fight' },

      { type: 'prop', x: 5, y: 1, sprite: 'prop_banner', solid: false },
      { type: 'prop', x: 22, y: 1, sprite: 'prop_banner', solid: false },
      { type: 'prop', x: 9.5, y: 2.6, sprite: 'prop_weapon_rack', solid: false },
      { type: 'prop', x: 17.5, y: 2.6, sprite: 'prop_weapon_rack', solid: false, flip: true },
      bones(3, 10), bones(24, 11), bones(8, 17), bones(19, 17),
      { type: 'light', x: 13.5, y: 8, r: 72, color: WARM, intensity: 0.45, flicker: 0.14 },
      { type: 'light', x: 6, y: 10, r: 56, color: COLD, intensity: 0.3, flicker: 0.05 },
      { type: 'light', x: 21, y: 10, r: 56, color: COLD, intensity: 0.3, flicker: 0.05 },
      { type: 'emitter', x: 13.5, y: 4, kind: 'ash' },

      // ---- after
      { type: 'prop', x: 13.5, y: 6.2, sprite: 'prop_corpse_knight', solid: false, if: 'boss_odo' },
      { type: 'light', x: 13.5, y: 7, r: 40, color: CANDLE, intensity: 0.9, flicker: 0.12, if: 'odo_left && !odo_named' },
      { type: 'emitter', x: 13.5, y: 7, kind: 'motes', if: 'odo_left && !odo_named' },
      { type: 'sign', x: 13.5, y: 7.5, sprite: null, if: 'odo_left && !odo_named', dialogue: 'g_odo_flame' },
    ],
  };

  // ------------------------------------------------------------------ the company tomb (secret)
  M.greyharrow_crypt = {
    name: 'Tomb of the Harrow Company',
    region: 'greyharrow',
    theme: 'interior',
    music: 'cave',
    weather: 'none',
    ambient: 0.7,
    ambientColor: '#0b0909',
    indoor: true,
    tiles: [
      "########################",
      "########################",
      "########################",
      "##|==================|##",
      "##=*======uuuu======*=##",
      "##=========uu=========##",
      "##=========uu=====r===##",
      "##=========uu=========##",
      "##==g=g=g==uu==g=g=g==##",
      "##=========uu=========##",
      "##=========uu=========##",
      "##==g=g=g==uu==g=g=g==##",
      "##=*=======uu=======*=##",
      "##===r=====uu=========##",
      "##########====##########",
      "##########====##########",
      "##########====##########",
      "###########DD###########",
    ],
    spawns: {
      entrance: [11, 15, 'up'],
    },
    entities: [
      { type: 'exit', x: 11, y: 17, w: 2, h: 1, to: 'greyharrow_field', spawn: 'crypt' },
      { type: 'trigger', id: 'g_t_crypt', x: 10, y: 13, w: 4, h: 2, dialogue: 'g_crypt_enter' },

      // the altar, and the niche with your name on it
      { type: 'prop', x: 11.5, y: 3.6, sprite: 'prop_altar', solid: true },
      { type: 'prop', x: 9.5, y: 3.8, sprite: 'prop_candelabra', solid: true, light: { r: 50, color: CANDLE, flicker: 0.18 } },
      { type: 'prop', x: 13.5, y: 3.8, sprite: 'prop_candelabra', solid: true, light: { r: 50, color: CANDLE, flicker: 0.18 } },
      { type: 'item', id: 'g_sigil', x: 11.5, y: 5, item: 'ashen_sigil',
        text: 'On the altar, in a niche of its own, a disc of fused ash stamped with the Harrow badge. On the back, freshly scratched: EM.' },
      { type: 'sign', x: 11.5, y: 3.6, sprite: null, dialogue: 'g_crypt_altar' },

      // the knighting shield on the west wall
      { type: 'prop', x: 6, y: 2.9, sprite: 'prop_banner', solid: false },
      { type: 'item', id: 'g_knight_shield', x: 6, y: 4, item: 'lore_g_shield',
        text: 'Hung on two iron pegs beneath the company banner: a kite shield with the paint worn to the wood. You know its weight before you lift it.' },

      // the drummer's place, east wall
      { type: 'corpse', id: 'g_drummer_ash', x: 20, y: 6, sprite: 'prop_ash_pile', item: 'tag_crypt', text: [
        'In the last niche on the east wall, the one the company kept for their drummer, a small heap of ash has come to rest. It came a long way to get here.',
        'In the ash, a tin tag. Beside it, two drumsticks, crossed.',
      ] },
      { type: 'prop', x: 20, y: 5, sprite: 'prop_drum', solid: false },

      // the slabs
      { type: 'sign', x: 4, y: 8, sprite: null, title: 'Tomb-slab', text: [
        'ASKE, T. — PIKE. HE COMPLAINED ABOUT THE FOOD, AND THEN HE ATE YOURS.',
      ] },
      { type: 'sign', x: 8, y: 11, sprite: null, title: 'Tomb-slab', text: [
        'COLLEY, J. — SHIELD. OWES PELL A SHILLING. PELL SAYS SO. PELL IS ALSO HERE, SO THEY CAN ARGUE IT OUT.',
      ] },
      { type: 'sign', x: 15, y: 8, sprite: null, title: 'Tomb-slab', text: [
        'BARROW, M. — SERGEANT. HE CALLED THE ROLL FOR NINE YEARS AND NEVER ONCE GOT ANYBODY\'S NAME WRONG.',
      ] },
      { type: 'sign', x: 19, y: 11, sprite: null, title: 'Tomb-slab', text: [
        'This slab is uncut. Chalked on it, in the same hand as the chalk on the door outside: RESERVED. O.V.',
        'Under it, smaller: AND ONE FOR EM, IF HE EVER STOPS BEING AN IDIOT.',
      ] },
      niche(4, 2), niche(8, 2), niche(15, 2), niche(19, 2),
      { type: 'emitter', x: 11.5, y: 7, kind: 'motes' },
      { type: 'light', x: 11.5, y: 9, r: 60, color: WARM, intensity: 0.35, flicker: 0.1 },
    ],
  };
})(window.AV);
