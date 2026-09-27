// ASHEN VOW — Saint Wendel's Rest: story (speakers, NPCs, dialogue, tags, quest `posy`).
// Builder: VILLAGE. Maps live in village.maps.js.
// Local flags (all v_-prefixed): v_mound_named v_mound_dug v_mound_n v_mound_k1 v_mound_k2 v_mound_d1 v_mound_d2
//   v_posy_k v_posy_spoken v_pf_* v_ringer_met v_ringer_spoken v_ringer_home v_knows_joss v_amsel_told
//   v_amsel_spoken v_amsel_home v_knows_dray v_thirsty_met v_thirsty_spoken v_thirsty_home v_heard_far
//   v_dropped v_grate_opened. Contract flags set here: posy_named, posy_lied (see BIBLE §11).
(function (AV) {
  'use strict';
  const D = AV.data;
  const SP = D.speakers;
  const NPC = D.npcs;
  const DLG = D.dialogue;
  const IT = D.items;
  const Q = D.quests;

  const STAGE2_LOCK = 'hollow_stage>=2';
  const NO_WORDS = '[He cannot find the words.]';

  // ================================================================== speakers
  SP.mound = { name: 'Mound', portrait: 'mound', color: '#a3784a', voice: 0.4 };
  SP.posy = {
    name: [{ if: 'posy_named || v_posy_spoken', name: 'Posy' }, { name: 'Small Ghost' }],
    portrait: 'posy', color: '#b9d6d3', voice: 1.55
  };
  SP.v_thirsty = {
    name: [{ if: 'v_thirsty_spoken', name: 'Abel Marsh' }, { name: 'A Thirsty Man' }],
    portrait: 'ghost_man', color: '#82a8ad', voice: 0.86
  };
  SP.v_ringer = {
    name: [{ if: 'v_ringer_spoken', name: 'Joss Orle' }, { name: 'The Ringer' }],
    portrait: 'ghost_monk', color: '#a8a0a6', voice: 0.66
  };
  SP.v_amsel = {
    name: [{ if: 'v_amsel_spoken', name: 'Amsel Dray' }, { if: 'v_amsel_told', name: 'Amsel' }, { name: 'A Woman at a Door' }],
    portrait: 'ghost_woman', color: '#e4f4ef', voice: 1.12
  };

  // ================================================================== NPCs
  NPC.mound = {
    name: 'Mound', sprite: 'npc_mound', portrait: 'mound', solid: true, anim: 'dig',
    talk: [
      { if: '!seen_v_mound_first', dialogue: 'v_mound_first' },
      { if: 'posy_named && !seen_v_mound_posy', dialogue: 'v_mound_posy' },
      { if: 'boss_procession && !seen_v_mound_quiet', dialogue: 'v_mound_quiet' },
      { dialogue: 'v_mound' }
    ],
    barks: [
      { if: 'kindles>0', text: '…warm…' },
      { if: 'kindles==0', text: '…dig…' },
      { if: 'kindles==0 && !boss_procession', text: '…singing again…' }
    ]
  };

  NPC.posy = {
    name: 'Small Ghost', sprite: 'npc_posy', portrait: 'posy', solid: false, anim: 'idle',
    talk: [
      { if: 'posy_lied', dialogue: 'v_posy_lied' },
      { if: 'has:tag_posy && seen_v_posy_first', dialogue: 'v_posy_tag' },
      { if: 'seen_v_posy_first', dialogue: 'v_posy' },
      { dialogue: 'v_posy_first' }
    ],
    barks: [
      { if: 'posy_lied', text: '…is it first bell yet?' },
      { if: '!posy_lied', text: '…thirty-eight… thirty-nine…' },
      { if: '!posy_lied && kindles>0', text: 'Don\'t go bright. Please.' }
    ]
  };

  NPC.v_thirsty = {
    name: 'A Thirsty Man', sprite: 'npc_ghost_man', portrait: 'ghost_man', solid: false, anim: 'idle',
    talk: [
      { if: 'has:tag_well', dialogue: 'v_thirsty_name' },
      { dialogue: 'v_thirsty' }
    ],
    barks: [{ text: 'Is it running yet?' }]
  };

  NPC.v_ringer = {
    name: 'The Ringer', sprite: 'npc_ghost_monk', portrait: 'ghost_monk', solid: false, anim: 'idle',
    talk: [
      { if: 'v_knows_joss', dialogue: 'v_ringer_name' },
      { dialogue: 'v_ringer' }
    ],
    barks: [{ text: 'Pull. …And let it come back.' }]
  };

  NPC.v_amsel = {
    name: 'A Woman at a Door', sprite: 'npc_ghost_woman', portrait: 'ghost_woman', solid: false, anim: 'idle',
    talk: [
      { if: 'v_knows_dray', dialogue: 'v_amsel_name' },
      { dialogue: 'v_amsel' }
    ],
    barks: [{ text: 'Amsel. …Amsel.' }, { text: 'He\'s late. He\'s always late.' }]
  };

  // ================================================================== items
  IT.tag_posy = {
    name: 'Tin Tag: Posy Vell', kind: 'tag', icon: 'icon_tag',
    desc: [
      { if: 'posy_named', text: 'POSY VELL — ROW 3, COT 12. She never went north to lie in it. The edge is dented all along one side by small teeth. She went home. Tins stay.' },
      { text: 'POSY VELL — ROW 3, COT 12. Tied double on a green string. One edge is dented all along by small teeth, the way a child chews a thing when told to hush.' }
    ]
  };
  IT.tag_well = {
    name: 'Tin Tag: Abel Marsh', kind: 'tag', icon: 'icon_tag',
    desc: [
      { if: 'v_thirsty_home', text: 'ABEL MARSH — ROW 6, COT 24. On the back, scratched with a nail: OWE DICKON 3. He went home. Whether he went owing, nobody will ever know.' },
      { text: 'ABEL MARSH — ROW 6, COT 24. On the back, scratched with a nail in careful capitals: OWE DICKON 3. Whatever else he forgot, he meant to keep that.' }
    ]
  };

  // ================================================================== quest
  Q.posy = {
    title: 'A Name for Posy', kind: 'side',
    stages: {
      1: 'A small ghost by the dry fountain has forgotten her name. She counts bells. She will not go near the house with the Hand on its door.',
      3: 'Behind the chimney in the house with the Hand, where it was warm: a small heap of ash, and a tin tag on a green string.',
      5: 'You told her that her mother is coming back at first bell. She has started counting again, from one. The tag is still in your pack.',
      99: 'Posy Vell went home. A bell rang once.'
    }
  };

  // ================================================================== shared node builders
  // Mound digs the charnel way open: both ends of the tunnel (village + well cave).
  function digNodes(next) {
    return {
      dig: { who: 'narrator', text: 'Mound shoulders the spade and goes to the hill, slowly, the way weather goes.', next: 'dig2' },
      dig2: {
        who: 'narrator',
        do: ['fade:out', 'sfx:break_wall', 'shake:3', 'wait:0.8', 'sfx:break_wall', 'shake:2', 'wait:0.6',
          'set:v_mound_dug', 'unlock:v_tunnel_top', 'unlock:v_tunnel_low', 'fade:in'],
        text: 'When the ash settles, the old charnel way stands open in the hill, and Mound is standing in it up to his lantern-eyes.',
        next: 'dig3'
      },
      dig3: { who: 'mound', text: ['…Mind your head.', '…Mind them.'], next: next || null }
    };
  }

  // Speaking Posy's name. `p` prefixes node ids so the rite can live in several dialogues.
  function posyRite(p) {
    const n = {};
    n[p + 'R'] = { who: 'brand', do: ['set:v_posy_spoken'], text: 'Posy Vell.', next: p + 'R1' };
    n[p + 'R1'] = { who: 'posy', text: ['…Posy.', 'Posy. That\'s it. That\'s what she said. All the time, before the mouse.'], next: p + 'R2' };
    n[p + 'R2'] = { who: 'brand', text: 'Go home, Posy Vell. The dark is shorter than it looks.', next: p + 'R3' };
    n[p + 'R3'] = { who: 'posy', text: '…Is it?', next: p + 'R4' };
    n[p + 'R4'] = { who: 'brand', choices: [
      { text: '"Yes."', next: p + 'R5' },
      { text: '"I\'ve never been all the way."', next: p + 'R6' }
    ] };
    n[p + 'R5'] = { who: 'posy', text: '…All right.', next: p + 'R7' };
    n[p + 'R6'] = { who: 'posy', text: '…Then I\'ll go first. I\'ll tell you.', next: p + 'R7' };
    n[p + 'R7'] = { branch: [{ if: '!v_ringer_home', next: p + 'R8a' }, { next: p + 'R8b' }] };
    n[p + 'R8a'] = { who: 'narrator', do: ['sfx:bell'], text: 'By the chapel wall, the old ringer\'s hands close on a rope that isn\'t there. He pulls.', next: p + 'R9' };
    n[p + 'R8b'] = { who: 'narrator', do: ['sfx:bell'], text: 'Somewhere, a bell rings once. There is no one in the tower.', next: p + 'R9' };
    n[p + 'R9'] = { who: 'posy', text: '…That\'s one.', next: p + 'R10' };
    n[p + 'R10'] = { do: ['snuff:self'], next: p + 'R11' };
    n[p + 'R11'] = {
      who: 'narrator',
      do: ['set:posy_named', 'hollow:-1', 'give:posy_ribbon', 'quest:posy=99'],
      text: 'On the lip of the fountain, where she sat: a blue ribbon, tied in a bow too tight for anybody\'s hair.',
      end: true
    };
    return n;
  }

  // ================================================================== MOUND
  DLG.v_mound_first = {
    start: 'a',
    nodes: Object.assign({
      a: { who: 'narrator', text: [
        'Something the size of a haycart is digging among the graves. Grey earth, packed hard. A spade as long as a man.',
        'It stops. It turns. Deep in the heap, where eyes would be, two lantern-lights come round to look at him.'
      ], next: 'b' },
      b: { who: 'mound', text: ['…', '…Dead?'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: '"Not yet."', next: 'c1' },
        { text: '"I don\'t know."', next: 'c2' },
        { text: 'Put a hand to Vigil.', next: 'c3' }
      ] },
      c1: { who: 'mound', text: ['…Not yet.', '…Later, then. …I\'ll keep a place.'], next: 'd' },
      c2: { who: 'mound', text: ['…Me neither.', '…Dig anyway.'], next: 'd' },
      c3: { who: 'narrator', text: 'Mound does not back away. He does not come closer, either. He simply goes on being very large.', next: 'c4' },
      c4: { who: 'mound', text: '…Hole\'s not for you. …Hole\'s for the new one. …Came down in the ash.', next: 'd' },
      d: { who: 'brand', choices: [
        { text: '"What are you?"', if: '!v_mound_named', next: 'e' },
        { text: '"Who are the graves for?"', if: '!v_mf_graves', next: 'f' },
        { text: 'Leave him to it.', next: 'z' }
      ] },
      e: { who: 'mound', do: ['set:v_mound_named'], text: ['…Tobin.', '…Was. …Sexton.', '…Still sexton. …Nobody said stop.'], next: 'd' },
      f: { who: 'mound', do: ['set:v_mf_graves'], text: [
        '…Old ones, I know. …Hodge. Ada, from the mill. Weller, who liked nobody.',
        '…New ones come down with the ash. …Don\'t know them. …Bird. …Bird. …Bird.'
      ], next: 'g' },
      g: { who: 'brand', choices: [
        { text: '"Why the birds?"', next: 'h' },
        { text: 'Leave him to it.', next: 'z' }
      ] },
      h: { who: 'mound', text: ['…Sister makes them.', '…For the ones with no names. …So they have something.'], next: 'd' },
      z: { branch: [{ if: '!boss_procession', next: 'z1' }, { next: 'z2' }] },
      z1: { who: 'mound', text: ['…Chapel\'s singing. …Your name, I think.', '…Go, if you want. …I\'ll dig after.'], end: true },
      z2: { who: 'mound', text: '…Dig.', end: true }
    }, {})
  };

  DLG.v_mound = {
    start: 'a',
    nodes: Object.assign({
      a: { branch: [
        { if: 'kindles>=8 && !v_mound_k2', next: 'k2' },
        { if: 'kindles>0 && !v_mound_k1', next: 'k1' },
        { if: 'deaths>=6 && !v_mound_d2', next: 'd2' },
        { if: 'deaths>=1 && !v_mound_d1', next: 'd1' },
        { if: 'kindles>0', next: 'k0' },
        { next: 'a0' }
      ] },
      a0: { who: 'mound', text: '…', next: 'menu' },
      k0: { who: 'narrator', text: 'The heap of him shivers as Brand comes near. A little earth slides off. …Warm, says Mound. Too warm.', next: 'menu' },
      k1: { who: 'narrator', do: ['set:v_mound_k1'], text: 'As Brand comes near, the heap of Mound shivers. Earth slides off him in small, soft patters.', next: 'k1b' },
      k1b: { who: 'mound', text: ['…Warm.', '…You\'re warm. …Inside.', '…Crowded, in there.'], next: 'menu' },
      k2: { who: 'narrator', do: ['set:v_mound_k2', 'set:v_mound_k1'], text: 'Mound shivers so hard that a lily falls from his shoulder. He picks it up. It takes a long time.', next: 'k2b' },
      k2b: { who: 'mound', text: ['…They cry.', '…In you. …When you burn.', '…Didn\'t know if you could hear. …Thought I\'d say.'], next: 'menu' },
      d1: { who: 'mound', do: ['set:v_mound_d1'], text: ['…You fell. …Down the lane. …All to ash.', '…Brought the spade.', '…You got up.', '…Hole\'s still there. …If you want it.'], next: 'menu' },
      d2: { who: 'mound', do: ['set:v_mound_d2', 'set:v_mound_d1'], text: ['…You keep falling.', '…Keep getting up.', '…Stopped bringing the spade.'], next: 'menu' },

      menu: { who: 'brand', choices: [
        { text: '"Who lies here?"', next: 'g' },
        { text: '"You like the lilies."', next: 'l' },
        { text: '"The fallen tunnel, by the hill."', if: '!v_mound_dug', next: 't' },
        { text: 'Leave him to it.', next: 'z' }
      ] },

      g: { branch: [{ if: 'v_mound_n>=2', next: 'g3' }, { if: 'v_mound_n==1', next: 'g2' }, { next: 'g1' }] },
      g1: { who: 'mound', do: ['add:v_mound_n=1'], text: [
        '…Hodge. Thatcher. Fell off the chapel roof. …Laughing, they said.',
        '…Ada Brisk. Mill. …Sang flat. …Everybody let her.',
        '…Those. …Bird. …Bird. …Bird.'
      ], next: 'g4' },
      g2: { who: 'mound', do: ['add:v_mound_n=1'], text: [
        '…Old Weller. Liked nobody. …We all came to his burying. …To be sure.',
        '…Dunnock twins. One hole. …They\'d have wanted.',
        '…Mab. Ringer\'s Mab. …Good stone. He cut it.'
      ], next: 'g4' },
      g3: { who: 'mound', do: ['set:v_mound_n=0'], text: [
        '…Carrow soldier. Had a badge. …Sister said, still counts.',
        '…Little Wat. Six. Coughed. …Before the grey, that.',
        '…Ordinary dying. …Used to be ordinary.'
      ], next: 'g4' },
      g4: { branch: [{ if: '!posy_named', next: 'g5' }, { next: 'g6' }] },
      g5: { who: 'mound', text: '…Small one, in the square. …No hole. …Can\'t dig for no name. …Board needs a name.', next: 'g7' },
      g6: { who: 'mound', text: '…Posy. …New. …I did the letters.', next: 'g7' },
      g7: { who: 'brand', choices: [
        { text: '"And the birds?"', next: 'h' },
        { text: 'Leave him to it.', next: 'z' }
      ] },
      h: { who: 'mound', text: ['…Sister makes them.', '…For the ones with no names. …So they have something.'], next: 'h2' },
      h2: { who: 'brand', choices: [
        { text: '"Sister?"', next: 'h3' },
        { text: 'Nod.', next: 'z' }
      ] },
      h3: { who: 'mound', text: ['…Chandler. …Little Sister. …Carves.', '…Badly.', '…Don\'t tell her.'], next: 'z' },

      l: { who: 'narrator', text: 'Mound lifts one great clod of a hand. On it, very carefully, lies a single grave-lily, pale as a candle.', next: 'l1' },
      l1: { who: 'mound', text: ['…Grow in the ash. …Only thing that does.', '…Pretty.'], next: 'l2' },
      l2: { who: 'brand', choices: [
        { text: '"They are."', next: 'l3' },
        { text: '"They grow on graves."', next: 'l4' }
      ] },
      l3: { who: 'narrator', text: 'The lantern-lights in the heap go soft, the way a lamp does when somebody turns it down for the night.', next: 'z' },
      l4: { who: 'mound', text: '…Something has to.', next: 'z' },

      t: { branch: [{ if: 'boss_procession', next: 't2' }, { next: 't1' }] },
      t1: { who: 'mound', text: [
        '…Charnel way. …Mine. …Fell in, the ash year.',
        '…Not while it sings. …Earth listens, when it sings. …Would come down on you.',
        '…When it\'s quiet.'
      ], next: 'z' },
      t2: { who: 'mound', text: ['…Charnel way. …Mine. …Fell in, the ash year.', '…It\'s quiet now. …I can dig.'], next: 't3' },
      t3: { who: 'brand', choices: [
        { text: '"Dig it open."', next: 'dig' },
        { text: '"Not now."', next: 'z' }
      ] },

      z: { who: 'mound', text: '…Dig.', end: true }
    }, digNodes(null))
  };

  DLG.v_mound_quiet = {
    start: 'a',
    nodes: Object.assign({
      a: { who: 'mound', text: ['…Quiet.', '…Chapel\'s quiet. …First time. …Long time.'], next: 'b' },
      b: { who: 'mound', text: ['…You did that.', '…They were loud. …Now they\'re in you.', '…Quiet, in there?'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: '"No."', next: 'd' },
        { text: '"…"', next: 'd2' }
      ] },
      d: { who: 'mound', text: '…No.', next: 'e' },
      d2: { who: 'mound', text: '…No. …Thought not.', next: 'e' },
      e: { who: 'mound', text: ['…The old way. …Down to the saint.', '…Fell in. …I can dig it now.'], next: 'f' },
      f: { who: 'brand', choices: [
        { text: '"Dig it open."', if: '!v_mound_dug', next: 'dig' },
        { text: '"Not now."', next: 'g' }
      ] },
      g: { who: 'mound', text: '…When you want.', end: true }
    }, digNodes(null))
  };

  DLG.v_mound_posy = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'There is a new grave at the end of Mound\'s row, and fresh earth all down the front of him.', next: 'b' },
      b: { who: 'mound', text: [
        '…Small one. …Went home.',
        '…Dug her a hole. …Nothing to put in it. …Dug it anyway.',
        '…Asked Sister the letters. …P. …O. …S. …Y.'
      ], next: 'c' },
      c: { who: 'mound', text: '…Is it right?', next: 'd' },
      d: { who: 'brand', choices: [
        { text: '"It\'s right."', next: 'e' },
        { text: '"It\'s right. Thank you, Tobin."', if: 'v_mound_named', next: 'f' }
      ] },
      e: { who: 'mound', text: ['…Good.', '…Put a lily on. …She\'d want a lily.'], end: true },
      f: { who: 'narrator', text: 'Mound is quiet for a long time. Nobody has called him that in years.', next: 'f2' },
      f2: { who: 'mound', text: '…Put a lily on. …She\'d want a lily.', end: true }
    }
  };

  // ================================================================== POSY
  DLG.v_posy_first = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'A small ghost sits against the dry fountain with her knees drawn up, moving her lips. Counting.', next: 'b' },
      b: { who: 'posy', text: ['…thirty-seven. Thirty-eight. Thirty-n—', 'Stop. Stop there. Don\'t come any closer. You\'re on fire.'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: '"I\'ll stay here."', next: 'c1' },
        { text: '"It\'s only embers."', next: 'c2' },
        { text: 'Step back.', next: 'c3' }
      ] },
      c1: { who: 'posy', text: '…Good. You can stand there. That\'s allowed.', next: 'd' },
      c2: { who: 'posy', text: 'That\'s how it starts.', next: 'd' },
      c3: { who: 'narrator', text: 'He steps back. Ash smokes off his shoulders and drifts away over the square.', next: 'c4' },
      c4: { who: 'posy', text: '…Thank you.', next: 'd' },
      d: { who: 'posy', text: 'Does it hurt? Being on fire?', next: 'e' },
      e: { who: 'brand', choices: [
        { text: '"Yes."', next: 'e1' },
        { text: '"No."', next: 'e2' },
        { text: '"I\'ve stopped noticing."', next: 'e3' }
      ] },
      e1: { who: 'posy', text: ['Oh.', '…Sorry.'], next: 'f' },
      e2: { who: 'posy', text: 'You\'re lying. Your fire went small. Mam\'s face did that when she lied.', next: 'f' },
      e3: { who: 'posy', text: '…That\'s worse, I think.', next: 'f' },
      f: { who: 'posy', text: 'Now I\'ve lost my place. I was nearly on thirty-nine.', next: 'g' },
      g: { who: 'brand', choices: [
        { text: '"What are you counting?"', if: '!v_pf_count', next: 'h' },
        { text: '"What\'s your name?"', if: '!v_pf_name', next: 'i' },
        { text: '"Where is your mother?"', if: 'v_pf_name && !v_pf_mam', next: 'j' },
        { text: '"Go back to your counting."', next: 'z' }
      ] },
      h: { who: 'posy', do: ['set:v_pf_count'], text: [
        'Bells. The bell man rings one when somebody goes home.',
        'I count them. So I\'ll know when it\'s mine.',
        '…He doesn\'t ring much now. I count anyway. In case.'
      ], next: 'g' },
      i: { who: 'posy', do: ['set:v_pf_name'], text: [
        '…',
        'I had one. It was short. Mam said it all the time.',
        'Then she stopped saying it. She said I had to be a mouse.'
      ], next: 'iq' },
      iq: { branch: [{ if: 'q_posy<1', next: 'iq1' }, { next: 'g' }] },
      iq1: { do: ['quest:posy=1'], next: 'g' },
      j: { who: 'posy', do: ['set:v_pf_mam'], text: [
        'She went with the candle-men. At first bell.',
        'She said stay in the warm place and don\'t come out for anybody. …I came out a bit.',
        'I\'m not allowed in the house now. The one with the hand on the door. Not for anybody.'
      ], next: 'g' },
      z: { who: 'posy', text: 'One. Two. …No. Thirty-nine. Forty…', end: true }
    }
  };

  DLG.v_posy = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'kindles>0 && !v_posy_k', next: 'k' }, { next: 'b' }] },
      k: { who: 'posy', do: ['set:v_posy_k'], text: ['You went all bright before. Out in the lane. I saw.', '…Don\'t do that near me. Please.'], next: 'c' },
      b: { who: 'posy', text: '…fifty-one. Fifty-two. …Oh. It\'s you. Stay there.', next: 'c' },
      c: { who: 'brand', choices: [
        { text: '"Still counting?"', next: 'h' },
        { text: '"Your mother."', next: 'j' },
        { text: '"The house with the hand."', next: 'm' },
        { text: 'Leave her to it.', next: 'z' }
      ] },
      h: { who: 'posy', text: ['Somebody goes home, the bell man rings. I\'m waiting for mine.', 'I\'ll know it. I\'ll just know.'], next: 'c' },
      j: { who: 'posy', text: ['She went at first bell. With the candle-men. North, where the sky went red after.', 'She said be a mouse. So I\'m being one.'], next: 'jq' },
      jq: { branch: [{ if: 'q_posy<1', next: 'jq1' }, { next: 'c' }] },
      jq1: { do: ['quest:posy=1'], next: 'c' },
      m: { who: 'posy', text: [
        'The candle-men painted it. So everybody would know about Mam.',
        'She scrubbed and scrubbed. It wouldn\'t come off.',
        'I\'m not allowed in. …You can, I suppose. You\'re already on fire.'
      ], next: 'c' },
      z: { who: 'posy', text: '…fifty-three.', end: true }
    }
  };

  DLG.v_posy_tag = {
    start: 'a',
    nodes: Object.assign({
      a: { who: 'narrator', text: 'The small ghost has stopped counting. She is looking at his hand. At the tin in it.', next: 'b' },
      b: { who: 'posy', text: ['You went in the house.', '…I\'m not allowed.', 'Was I there?'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: '"Yes. Behind the chimney."', next: 'c1' },
        { text: '"…"', next: 'c2' }
      ] },
      c1: { who: 'posy', text: ['Where it\'s warm.', 'Mam said be a mouse. I was. I was ever so quiet. Nobody came.'], next: 'd' },
      c2: { who: 'posy', text: ['…Behind the chimney. Where it\'s warm.', 'Mam said be a mouse. I was. I was ever so quiet. Nobody came.'], next: 'd' },
      d: { who: 'posy', text: '…Did it hurt?', next: 'e' },
      e: { who: 'brand', choices: [
        { text: '"No. You were asleep."', lock: STAGE2_LOCK, lockText: NO_WORDS, next: 'e1' },
        { text: '"I don\'t know."', next: 'e2' },
        { text: '"Yes. I think it did."', next: 'e3' },
        { text: '"Nothing happened. Your mam\'s coming back."', next: 'e4' }
      ] },
      e1: { who: 'posy', text: ['…Asleep.', 'That\'s all right, then.'], next: 'f' },
      e2: { who: 'posy', text: ['…Oh.', 'You don\'t know lots of things. For a big man.'], next: 'f' },
      e3: { who: 'posy', text: ['…I thought so.', 'I remember cold. And my hands going grey. Then I don\'t remember.'], next: 'f' },
      e4: { who: 'posy', text: ['…She is?', '…At first bell?'], next: 'L1' },
      L1: { who: 'brand', choices: [
        { text: '"At first bell."', next: 'L2' },
        { text: '"…No. I\'m sorry. She isn\'t."', next: 'L3' }
      ] },
      L2: { who: 'posy', do: ['set:posy_lied', 'quest:posy=5'], text: ['Then I have to count properly. From the start.', 'One…'], next: 'L2b' },
      L2b: { who: 'narrator', text: 'She starts again from one. She sounds happy.', end: true },
      L3: { who: 'posy', text: ['…', 'Your fire went small. Mam\'s face did that too.'], next: 'f' },
      f: { who: 'posy', text: 'Is it on the tin? My name?', next: 'g' },
      g: { who: 'brand', choices: [
        { text: '"Posy Vell."', next: 'tR' },
        { text: '"Not yet."', next: 'n' }
      ] },
      n: { who: 'posy', text: ['…All right.', 'I\'ll count some more. Don\'t be long.'], end: true }
    }, posyRite('t'))
  };

  DLG.v_posy_lied = {
    start: 'a',
    nodes: Object.assign({
      a: { who: 'posy', text: '…ninety. Ninety-one. …Is it first bell yet?', next: 'b' },
      b: { who: 'brand', choices: [
        { text: '"Soon."', next: 'c' },
        { text: '"Posy."', next: 'd' },
        { text: 'Leave her counting.', next: null }
      ] },
      c: { who: 'posy', text: 'Soon. …Ninety-two.', end: true },
      d: { who: 'posy', text: '…What did you say?', next: 'e' },
      e: { who: 'brand', choices: [
        { text: '"Your name. It\'s Posy Vell."', next: 'f' },
        { text: '"Nothing. Keep counting."', next: 'c' }
      ] },
      f: { who: 'posy', text: '…You said Mam was coming.', next: 'g' },
      g: { who: 'brand', choices: [
        { text: '"I lied."', next: 'h' },
        { text: '"…"', next: 'h2' }
      ] },
      h: { who: 'posy', text: ['…Your fire went small, when you said it. Like Mam\'s face.', 'It\'s all right. Grown-ups do.'], next: 'i' },
      h2: { who: 'posy', text: ['…You did, didn\'t you. Your fire\'s gone small.', 'It\'s all right. Grown-ups do.'], next: 'i' },
      i: { who: 'posy', text: 'Say it again, big man. Properly.', next: 'lR' }
    }, posyRite('l'))
  };

  // ================================================================== THE THIRSTY MAN (Abel Marsh, tag_well)
  DLG.v_thirsty = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: '!v_thirsty_met', next: 'a1' }, { next: 'a2' }] },
      a1: { who: 'narrator', do: ['set:v_thirsty_met'], text: 'A grey man\'s ghost kneels at the dry fountain, holding a tin cup under the saint\'s spout. Waiting.', next: 'a2' },
      a2: { who: 'v_thirsty', text: 'Is it running yet?', next: 'b' },
      b: { who: 'brand', choices: [
        { text: '"The fountain is dry."', next: 'c' },
        { text: '"Who are you?"', next: 'd' },
        { text: '"Where did you come from?"', next: 'e' },
        { text: 'Leave him waiting.', next: 'z' }
      ] },
      c: { branch: [{ if: 'visited_well_cave', next: 'c2' }, { next: 'c1' }] },
      c1: { who: 'v_thirsty', text: ['It\'ll come. Saint\'s water. Never stops.', 'That\'s what they said, in the Ward. Get to the Rest. Saint\'s water. Never stops.'], next: 'b' },
      c2: { who: 'brand', text: 'It went down. There\'s a spring, under the well.', next: 'c3' },
      c3: { who: 'v_thirsty', text: ['…Down.', 'I think I knew that. I think I went down after it.', 'Cold, down there. …I don\'t like to think about down there.'], next: 'b' },
      d: { who: 'v_thirsty', text: ['Thirsty.', '…That\'s most of what\'s left. Thirsty, and a smell of rope.'], next: 'b' },
      e: { who: 'v_thirsty', text: [
        'The Ward. Out through the drains, with the nurse and her little ones. Don\'t ask what was in the drains.',
        'One little one kept asking for her da. Nurse said he\'d come. …People say that.'
      ], next: 'e2' },
      e2: { who: 'v_thirsty', text: 'Nurse said go west, to the monks. A cold cure. I said, what\'s a cold cure when it\'s at home. …I came here.', next: 'b' },
      z: { who: 'v_thirsty', text: 'If you see it running. …Shout.', end: true }
    }
  };

  DLG.v_thirsty_name = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: '!v_thirsty_met', next: 'a1' }, { next: 'a2' }] },
      a1: { who: 'narrator', do: ['set:v_thirsty_met'], text: 'A grey man\'s ghost kneels at the dry fountain, holding a tin cup under the saint\'s spout. Waiting.', next: 'a2' },
      a2: { who: 'v_thirsty', text: 'Is it running yet?', next: 'a3' },
      a3: { who: 'narrator', text: 'The tin tag from the cave is in Brand\'s hand. He does not remember taking it out.', next: 'b' },
      b: { who: 'brand', choices: [
        { text: '"Abel Marsh."', next: 'c' },
        { text: 'Put the tag away.', next: 'z' }
      ] },
      c: { who: 'brand', do: ['set:v_thirsty_spoken'], text: 'Abel Marsh. Row six, cot twenty-four.', next: 'd' },
      d: { who: 'v_thirsty', text: ['…Abel.', 'Abel Marsh. Ropewalk, Tanner\'s Lane. I owe Dickon three pennies.', '…Did I ever pay him?'], next: 'e' },
      e: { who: 'brand', choices: [
        { text: '"I don\'t know."', next: 'f' },
        { text: '"You paid him."', next: 'g' }
      ] },
      f: { who: 'v_thirsty', text: '…Then he\'ll have to come and ask. Serve him right.', next: 'h' },
      g: { who: 'v_thirsty', text: '…Good. Good. I\'d not like to go owing.', next: 'h' },
      h: { who: 'v_thirsty', text: 'All this way for the water. …It was never the water, was it.', next: 'i' },
      i: { who: 'brand', choices: [{ text: '"Go home, Abel Marsh."', next: 'j' }] },
      j: { who: 'brand', text: 'Go home, Abel Marsh. The dark is shorter than it looks.', next: 'k' },
      k: { do: ['snuff:self'], next: 'l' },
      l: { who: 'narrator', do: ['set:v_thirsty_home', 'hollow:-1'], text: 'The tin cup stays on the lip of the fountain. For once it is full: of ash.', end: true },
      z: { who: 'v_thirsty', text: 'If you see it running. …Shout.', end: true }
    }
  };

  // ================================================================== THE RINGER (Joss Orle)
  DLG.v_ringer = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: '!v_ringer_met', next: 'a1' }, { next: 'a2' }] },
      a1: { who: 'narrator', do: ['set:v_ringer_met'], text: 'An old man\'s ghost stands at the chapel wall, arms up, hands closed on nothing. Now and then he pulls, and rises onto his toes.', next: 'a2' },
      a2: { who: 'v_ringer', text: 'Pull. …And let it come back up. Never fight the rope. Rope always wins.', next: 'b' },
      b: { who: 'brand', choices: [
        { text: '"Who are you?"', next: 'c' },
        { text: '"What\'s your name?"', next: 'd' },
        { text: '"The chapel."', next: 'e' },
        { text: 'Leave him to his rope.', next: null }
      ] },
      c: { who: 'v_ringer', text: [
        'Ringer. Ringer of the Rest, forty year.',
        'Chandler says a name, I ring one after. So the Mother hears it over the ash.',
        'There\'s a little one in the square counts my bells. …I\'ve not the heart to tell her I stopped.'
      ], next: 'b' },
      d: { who: 'v_ringer', text: [
        '…Nobody used it but her. Everybody else said Ringer.',
        'I put a good stone on her. Cut it myself. Signed it, even. …Mab would want it signed.'
      ], next: 'b' },
      e: { branch: [{ if: 'boss_procession', next: 'e2' }, { next: 'e1' }] },
      e1: { who: 'v_ringer', text: ['They\'re ringing in there. No bell. Just mouths.', 'Your name, sounds like. …Can\'t ring a name without a bell in it. I\'ve told them.'], next: 'b' },
      e2: { who: 'v_ringer', text: ['Quiet in there now.', '…Some of them I\'d have rung for. If anybody had said.'], next: 'b' }
    }
  };

  DLG.v_ringer_name = {
    start: 'a',
    nodes: {
      a: { who: 'v_ringer', text: 'Pull. …And let it come back up.', next: 'b' },
      b: { who: 'brand', choices: [
        { text: '"Joss Orle."', next: 'c' },
        { text: 'Leave him to his rope.', next: null }
      ] },
      c: { who: 'brand', do: ['set:v_ringer_spoken'], text: 'Joss Orle.', next: 'd' },
      d: { who: 'v_ringer', text: ['…', 'Joss. …Mab said it like it was a bit funny.', 'It was a bit funny.'], next: 'e' },
      e: { who: 'v_ringer', text: 'Forty year, ringing folk home. Never once thought who\'d ring for me.', next: 'f' },
      f: { who: 'brand', choices: [{ text: '"Go home, Joss Orle."', next: 'g' }] },
      g: { who: 'brand', text: 'Go home, Joss Orle. The dark is shorter than it looks.', next: 'h' },
      h: { who: 'v_ringer', text: '…Listen to you. Talking like a Chandler.', next: 'i' },
      i: { who: 'brand', choices: [
        { text: '"My father was one."', next: 'j' },
        { text: '"…"', next: 'k' }
      ] },
      j: { who: 'v_ringer', text: 'Was he. …Then he\'d want a bell after it.', next: 'l' },
      k: { who: 'v_ringer', text: 'Well. Somebody has to.', next: 'l' },
      l: { do: ['snuff:self'], next: 'm' },
      m: { who: 'narrator', do: ['sfx:bell', 'set:v_ringer_home', 'hollow:-1'], text: 'Faint, from nowhere at all, a bell. Once.', end: true }
    }
  };

  DLG.v_mab_grave = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', do: ['set:v_knows_joss'], text: [
        'A good stone, better than its neighbours, cut deep and square by somebody who took his time:',
        'MAB ORLE. I RANG YOU HOME, OLD GIRL. I WON\'T BE LONG. — JOSS'
      ], next: 'b' },
      b: { branch: [{ if: '!v_ringer_home', next: 'c' }] },
      c: { who: 'narrator', text: 'A few steps off, at the chapel wall, the old ringer goes on pulling at nothing.', end: true }
    }
  };

  // ================================================================== AMSEL (Amsel Dray)
  const AMSEL_INTRO = 'A woman\'s ghost stands at a shut door with a covered dish on her hip, the way you stand when your hands are full and the latch is stiff.';

  DLG.v_amsel = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: '!v_amsel_told', next: 'i1' }, { next: 'r1' }] },
      i1: { who: 'narrator', text: AMSEL_INTRO, next: 'i2' },
      i2: { who: 'v_amsel', text: 'Oh, good. Get the latch for me, would you? My hands go through it.', next: 'i3' },
      i3: { who: 'brand', choices: [
        { text: 'Lift the latch.', next: 'i4' },
        { text: '"Who are you?"', next: 'n' }
      ] },
      i4: { who: 'narrator', text: 'The door swings in on a black room full of ash. She does not go in.', next: 'i5' },
      i5: { who: 'v_amsel', text: '…Not yet. Not till he\'s home. I\'ll not sit in there on my own like a widow.', next: 'n' },
      n: { who: 'v_amsel', do: ['set:v_amsel_told'], text: [
        'Amsel.',
        'That\'s the front of it. The back half went, years back. I say the front over, so it\'ll stay.',
        'Amsel. Amsel.'
      ], next: 'm' },
      r1: { who: 'v_amsel', text: 'Amsel. Amsel. …Oh, it\'s you. Still not home, is he.', next: 'm' },
      m: { who: 'brand', choices: [
        { text: '"Who are you waiting for?"', next: 'w' },
        { text: '"What\'s in the dish?"', next: 'd' },
        { text: '"The back half of your name?"', next: 'o' },
        { text: 'Leave her at the door.', next: 'z' }
      ] },
      w: { who: 'v_amsel', text: ['Himself. He\'s late. He\'s always late.', 'He\'s a carter. Stops to talk to horses. Horses are most of who he talks to.'], next: 'm' },
      d: { who: 'v_amsel', text: ['Supper.', '…It\'s gone cold. It\'s been cold a good while, I think. I don\'t like to lift the cloth.'], next: 'm' },
      o: { who: 'v_amsel', text: [
        'Went with the rest of it. We were wed in the chapel. Merriot wrote it in his big book.',
        'He wrote down everything, that man. Everything but what mattered.'
      ], next: 'm' },
      z: { who: 'v_amsel', text: 'Mind the step. It isn\'t there any more.', end: true }
    }
  };

  DLG.v_amsel_name = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: '!v_amsel_told', next: 'a0' }, { next: 'a1' }] },
      a0: { who: 'narrator', text: AMSEL_INTRO, next: 'a0b' },
      a0b: { who: 'v_amsel', do: ['set:v_amsel_told'], text: ['Oh, good. Get the latch for me, would you? My hands go through it.', 'Amsel. …That\'s the front of me. The back half went, years back.'], next: 'b' },
      a1: { who: 'v_amsel', text: 'Amsel. Amsel. …Did you see him on the road? Big man. Talks to horses.', next: 'b' },
      b: { who: 'brand', choices: [
        { text: '"Amsel Dray."', next: 'c' },
        { text: 'Leave her at the door.', next: 'z' }
      ] },
      c: { who: 'brand', do: ['set:v_amsel_spoken'], text: 'Amsel Dray.', next: 'd' },
      d: { who: 'v_amsel', text: ['…', 'Dray. Oh. Oh, that\'s it. That\'s Tam\'s. He gave it me and I went and lost it.'], next: 'e' },
      e: { who: 'v_amsel', text: 'You\'d have said. If you\'d seen him on the road. …Wouldn\'t you.', next: 'f' },
      f: { who: 'brand', choices: [
        { text: '"I didn\'t see him."', next: 'g' },
        { text: '"…"', next: 'g2' }
      ] },
      g: { who: 'v_amsel', text: ['No.', '…No. I think he went on ahead. I think I knew.'], next: 'h' },
      g2: { who: 'v_amsel', text: '…No. I think he went on ahead. I think I knew.', next: 'h' },
      h: { who: 'v_amsel', text: 'Say it again, then. All of it. I\'d like to hear it said right, the once.', next: 'i' },
      i: { who: 'brand', choices: [{ text: '"Go home, Amsel Dray."', next: 'j' }] },
      j: { who: 'brand', text: 'Go home, Amsel Dray. The dark is shorter than it looks.', next: 'k' },
      k: { who: 'v_amsel', text: '…Leave the dish. Somebody might want it.', next: 'l' },
      l: { do: ['snuff:self'], next: 'n' },
      n: { who: 'narrator', do: ['set:v_amsel_home', 'hollow:-1'], text: 'On the step, a covered dish. Under the cloth, only ash, laid out neatly, as if for two.', end: true },
      z: { who: 'v_amsel', text: 'Mind the step. It isn\'t there any more.', end: true }
    }
  };

  // ================================================================== THE CHAPEL: whispers, entry, register
  DLG.v_whisper_far = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', do: ['set:v_heard_far'], text: 'The wind turns. Under it, from the chapel, very low, many voices:', next: 'b' },
      b: { who: 'narrator', text: '{i}…Brand…{/}', end: true }
    }
  };

  DLG.v_whisper_near = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', do: ['set:v_heard_far'], text: 'Behind the chapel door, voices. Dozens. One word, over and over, the way you say a prayer you stopped hearing years ago.', next: 'b' },
      b: { who: 'narrator', text: '{i}…Brand… Brand… Brand…{/}', next: 'c' },
      c: { who: 'brand', text: '…Nineteen years. And they still know it.', end: true }
    }
  };

  DLG.v_chapel_in = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: [
        'Pews, ash, and the smell of old wax. The broken windows throw what colour is left in the world across the nave.',
        'At the far end, by the altar, something too big for the chapel is kneeling. It is made of people.'
      ], next: 'b' },
      b: { who: 'narrator', text: '{i}…Brand… …Brand… …Brand…{/}', next: 'c' },
      c: { who: 'brand', choices: [
        { text: '"I\'m here."', next: 'd' },
        { text: 'Draw Vigil.', next: 'e' },
        { text: '"…"', next: 'f' }
      ] },
      d: { who: 'narrator', text: 'The chanting stops. Then, all at once, like a congregation at the end of a prayer, it stands.', end: true },
      e: { who: 'narrator', text: 'Vigil leaves the scabbard with a sound like a held breath let go. The chanting does not stop.', end: true },
      f: { who: 'narrator', text: 'He says nothing. They say it for him.', end: true }
    }
  };

  DLG.v_register = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'boss_procession', next: 'a2' }, { next: 'a1' }] },
      a1: { who: 'narrator', text: 'The Rest\'s register, chained to the altar, big as a doorstep. The pages stir, though there is no wind.', next: 'b' },
      a2: { who: 'narrator', text: 'The Rest\'s register, chained to the altar, big as a doorstep. Fine ash has settled in the gutter of the book. He does not brush it out.', next: 'b' },
      b: { who: 'brand', choices: [
        { text: 'The weddings.', next: 'w' },
        { text: 'The last pages.', next: 'p' },
        { text: 'The Vigil.', next: 'v' },
        { text: 'Close it.', next: null }
      ] },
      w: { who: 'narrator', do: ['set:v_knows_dray', 'set:v_knows_joss'], text: [
        'Merriot\'s hand, round and patient, year on year. Wed at this altar: Joss Orle, ringer, and Mab Tull.',
        'Wed at this altar: Tam Dray, carter, and Amsel of the mill. The groom could not write. He has drawn a cart. It is a good cart.'
      ], next: 'b' },
      p: { who: 'narrator', text: [
        'The hand grows smaller toward the end. BY THE ARCHCHANDLER\'S ORDER, TAGGED AND TAKEN NORTH:',
        'Hild Vell, weaver\'s widow. Grey to the elbow. Taken at first bell.',
        'VELL, the child. Tagged. Not found. The mother swears she ran into the Hushwood.'
      ], next: 'b' },
      v: { who: 'narrator', text: [
        'THE LAST VIGIL. Forty-one pilgrims keep it in this chapel, for the Wickward.',
        'Midnight. The sky is red in the north. They will not stop praying.',
        'No names taken. I did not think to take them. Mother forgive me, I did not think.'
      ], next: 'b' }
    }
  };

  // ================================================================== THE WELL, the drop, the bolt
  DLG.v_well = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'visited_well_cave', next: 'a2' }, { next: 'a1' }] },
      a1: { who: 'narrator', text: [
        'The saint\'s well. The windlass is gone, and the rope with it.',
        'Cold air breathes up out of the dark. It smells of stone and, very faintly, of water.'
      ], next: 'b' },
      a2: { who: 'narrator', text: 'The saint\'s well. Cold air breathes up out of it. He knows where it goes now.', next: 'b' },
      b: { who: 'brand', choices: [
        { text: 'Drop a penny.', if: 'pennies>0', next: 'c' },
        { text: 'Climb in.', next: 'd' },
        { text: 'Leave.', next: null }
      ] },
      c: { who: 'narrator', do: ['pennies:-1'], text: 'He lets a penny go, and counts. At nine, far down, a small bright sound. Water.', next: 'b' },
      d: { who: 'narrator', text: 'No rope. No rungs. Only the drop, and whatever is at the bottom of it.', next: 'e' },
      e: { who: 'brand', choices: [
        { text: 'Let go.', next: 'f' },
        { text: 'Not today.', next: null }
      ] },
      // The fall is chained as its own dialogue (which replaces this one) so that no open dialogue is left
      // waiting on the teleport task when the map change clears the script runner.
      f: { do: ['set:v_dropped', 'dialogue:v_well_fall', 'sfx:whoosh', 'teleport:well_cave:well'], end: true }
    }
  };

  DLG.v_well_fall = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: [
        'He climbs onto the lip of the well, and lets go.',
        'He falls for longer than a well should last. Long enough to think about it.'
      ], end: true }
    }
  };

  DLG.v_landing = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'Ash, and old bones, which break his fall and are past minding.', next: 'b' },
      b: { who: 'narrator', text: 'Somewhere below, water is moving. It is the first cold thing he has felt since the crypt.', end: true }
    }
  };

  DLG.v_bolt = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'v_grate_opened', next: 'o' }, { next: 'b' }] },
      o: { who: 'narrator', text: 'The bolt is drawn. The grate hangs open on reeds and grey light.', end: true },
      b: { who: 'narrator', text: 'Low on the grate\'s frame, a bolt as thick as a thumb, rusted into its keeper. It was shot from this side.', next: 'c' },
      c: { who: 'brand', choices: [
        { text: 'Draw the bolt.', next: 'd' },
        { text: 'Leave it.', next: null }
      ] },
      d: { who: 'narrator', do: ['set:v_grate_opened', 'unlock:v_grate'],
        text: 'He sets his gauntlet to it. The rust screams, then gives all at once, and the grate sags outward onto reeds and grey light.', end: true }
    }
  };
})(window.AV);
