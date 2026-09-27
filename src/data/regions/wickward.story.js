// ASHEN VOW — Hallowhearth, the lower half: people, words and records of the Wickward, the infirmary and the Pyre
// (builder: CITY/WICKWARD). Local ids are prefixed w_. Contract ids: ormund, agna, tag_ward, tag_ghost, tag_bett,
// knows_wren, knows_proposal, brand_named, ormund_killed, ormund_left.
(function (AV) {
  'use strict';
  const D = AV.data;
  const GHOST = '#82a8ad';
  const PALE = '#b9d6d3';

  // ================================================================== items
  D.items.tag_ward = {
    name: 'Tin Tag: Hanne Lowe', kind: 'tag', icon: 'icon_tag',
    desc: 'HANNE LOWE — ROW 9, COT 1. Seamstress. Two children\'s tags hang from her cord. Both say LOWE. Neither says anything else.',
  };
  D.items.tag_ghost = {
    name: 'Tin Tag: Pell Hobb', kind: 'tag', icon: 'icon_tag',
    desc: 'PELL HOBB — ROW 2, COT 6. Lamplighter. He put out a hundred and six lamps, and then sat down under the last one.',
  };
  D.items.tag_bett = {
    name: 'Tin Tag: Bett Dunmore', kind: 'tag', icon: 'icon_tag',
    desc: 'BETT DUNMORE — ROW 4, COT 2. On the back, scratched with a knife point: H. The H is worn nearly smooth by a thumb.',
  };
  D.items.lore_w_lamps = {
    name: 'The Lamp Order', kind: 'lore', icon: 'icon_scroll',
    desc: 'An order to the lamplighter of the Wickward, dated the Eve of the Last Vigil.',
    read: [
      '\'To the lamplighter of the Wickward. At dusk on the Eve of the Vigil, every lamp in the district to be put out, and the oil drawn off to the Chandlers\' post.\'',
      '\'This by leave of the Archchandler, for the good of the district. Do not ask the Chandlers what it is for. They will be busy.\'',
      'On the back, in lamp-black, a list: Old Squint. The Widow. Hisser. Long Tom. Tanners\' One and Two. It goes on. A hundred and six names, for lamps.',
    ],
  };
  D.items.lore_w_sermon = {
    name: 'On the Mercy of Fire', kind: 'lore', icon: 'icon_book',
    desc: 'Sermon pages in the Archchandler\'s own hand. Wax has run over the corners and set there, like thumbs.',
    read: [
      '\'ON THE MERCY OF FIRE. The Candlemother does not snuff her children in anger. She gathers them. What is fire, but a gathering?\'',
      '\'Let no one say the Wickward was burned. Say it was gathered, all at once, by a hand that loved it enough to be quick.\'',
      '\'And let us remember the hand. The Warden came to the council with the words already in his mouth. I had only to bless them.\'',
      'In the margin: \'Preach Thursday. Omit the last line if the Queen attends.\'',
    ],
  };
  D.items.lore_w_count = {
    name: 'Count-Slate, Row Three', kind: 'lore', icon: 'icon_note',
    desc: 'A nurse\'s slate from the Wickward infirmary. The chalk has outlived the nurse, and the children.',
    read: [
      'ROW 3 — CHILDREN — 14 COTS. Below, a column of evenings. Dusk: 14. Dusk: 14. Dusk: 13, crossed out, 14 written over it.',
      'Dusk: 14. Dusk: 14. Dusk: 14. The same number, every night, in a hand that gets smaller.',
      'Last line: EVE OF THE VIGIL. DUSK: 14 TAGS. And under it, very small, in the same hand: Candlemother forgive me the count. — A.',
    ],
  };

  // ================================================================== speakers
  D.speakers.ormund = { name: 'Archchandler Ormund', portrait: 'ormund', color: '#c9a26e', voice: 0.78 };
  D.speakers.agna = { name: 'Nurse Agna', portrait: 'agna', color: PALE, voice: 1.0 };
  D.speakers.w_tamsin = {
    name: [{ if: 'w_tamsin_met', name: 'Tamsin' }, { name: 'Old Woman' }],
    portrait: 'ghost_woman', color: GHOST, voice: 1.05,
  };
  D.speakers.w_wat = {
    name: [{ if: 'w_wat_named', name: 'Wat' }, { name: 'The Carter' }],
    portrait: 'ghost_man', color: GHOST, voice: 0.5,
  };
  D.speakers.w_watch = { name: 'Watchman', portrait: 'ghost_soldier', color: GHOST, voice: 0.7 };
  D.speakers.w_kit = { name: 'Quiet Child', portrait: 'ghost_child', color: GHOST, voice: 1.5 };
  D.speakers.w_kit_inf = { name: 'Quiet Child', portrait: 'ghost_child', color: GHOST, voice: 1.5 };
  D.speakers.w_pell = {
    name: [{ if: 'w_pell_met', name: 'Pell' }, { name: 'Lamplighter' }],
    portrait: 'ghost_man', color: GHOST, voice: 0.9,
  };
  D.speakers.w_patient = { name: 'Old Patient', portrait: 'ghost_man', color: GHOST, voice: 0.65 };

  // ================================================================== npcs
  D.npcs.ormund = {
    name: 'Archchandler Ormund', sprite: 'npc_ormund', portrait: 'ormund', solid: true, anim: 'idle',
    talk: [
      { if: 'ormund_left', dialogue: 'w_ormund_left' },
      { dialogue: 'w_ormund' },
    ],
    barks: [
      { text: '…trim, and trim, and trim…' },
      { text: '…the Mother\'s mercy on the Wickward…' },
      { if: 'w_ormund_gloated', text: '…first in the litany: Brand…' },
    ],
  };
  D.npcs.agna = {
    name: 'Nurse Agna', sprite: 'npc_agna', portrait: 'agna', solid: false, anim: 'idle',
    talk: [
      { if: 'knows_wren', dialogue: 'w_agna_after' },
      { dialogue: 'w_agna' },
    ],
    barks: [
      { if: '!knows_wren', text: '…fourteen… fourteen…' },
      { if: '!knows_wren', text: '…don\'t touch the tags…' },
      { if: 'knows_wren', text: '…thirteen…' },
    ],
  };
  D.npcs.w_tamsin = {
    name: 'Old Woman', sprite: 'npc_ghost_woman', portrait: 'ghost_woman', solid: false, anim: 'idle',
    talk: [{ dialogue: 'w_tamsin' }],
    barks: [{ text: '…wipe your feet…' }, { text: '…that step won\'t sweep itself…' }],
  };
  D.npcs.w_wat = {
    name: 'The Carter', sprite: 'npc_ghost_man', portrait: 'ghost_man', solid: false, anim: 'idle',
    talk: [{ dialogue: 'w_wat' }],
    barks: [{ text: '…seven bolts…' }, { text: '…lift, damn you…' }],
  };
  D.npcs.w_watch = {
    name: 'Watchman', sprite: 'npc_ghost_soldier', portrait: 'ghost_soldier', solid: false, anim: 'idle',
    talk: [{ dialogue: 'w_watch' }],
    barks: [{ text: '…post secure…' }, { text: '…nobody out…' }],
  };
  D.npcs.w_kit = {
    name: 'Quiet Child', sprite: 'npc_ghost_child', portrait: 'ghost_child', solid: false, anim: 'idle',
    talk: [{ dialogue: 'w_kit' }],
    barks: [{ text: '…shh. Being good…' }, { text: '…she said next time…' }],
  };
  D.npcs.w_kit_inf = {
    name: 'Quiet Child', sprite: 'npc_ghost_child', portrait: 'ghost_child', solid: false, anim: 'idle',
    talk: [{ dialogue: 'w_kit_inf' }],
    barks: [{ text: '…she counted me…' }],
  };
  D.npcs.w_pell = {
    name: 'Lamplighter', sprite: 'npc_ghost_man', portrait: 'ghost_man', solid: false, anim: 'idle',
    talk: [
      { if: 'w_pell_told', dialogue: 'w_pell_after' },
      { dialogue: 'w_pell' },
    ],
    barks: [{ text: '…nearly… nearly…' }, { text: '…Old Squint\'s out again…' }],
  };
  D.npcs.w_patient = {
    name: 'Old Patient', sprite: 'npc_ghost_man', portrait: 'ghost_man', solid: false, anim: 'idle',
    barks: [{ text: '…is it the Vigil yet?…' }, { text: '…nurse. Nurse. Is it evening?…' }, { text: '…somebody\'s cooking…' }],
  };

  // ================================================================== dialogue
  const DLG = D.dialogue;

  // ---------------------------------------------------------------- arriving (trigger w_t_ch4 → then chapter:4)
  DLG.w_arrive = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: [
        'The stair goes down into the Wickward. Halfway, the ash changes colour. Up there it is grey. Down here it is black, and it is still warm.',
        'All over the district something rings, very lightly. Tin on tin. A wind-chime, if a wind-chime were made of names.',
      ], next: 'b' },
      b: { who: 'brand', text: ['…', 'Wick Lane is left at the well. I could walk it blind.'], next: 'c' },
      c: { who: 'brand', text: 'I did, once.', end: true },
    },
  };

  // ---------------------------------------------------------------- Tamsin: forgives
  DLG.w_tamsin = {
    start: 's',
    nodes: {
      s: { branch: [{ if: 'w_tamsin_met', next: 'again' }, { next: 'a' }] },
      a: { who: 'narrator', text: 'An old woman\'s ghost is sweeping the step of a house that isn\'t there any more. The broom goes through the ash without moving it.', next: 'b' },
      b: { who: 'w_tamsin', text: 'Wipe your feet. …Oh, don\'t look at me like that. It\'s habit. Nineteen years of habit.', next: 'c' },
      c: { who: 'w_tamsin', do: ['set:w_tamsin_met', 'set:brand_named'], text: [
        'I know that walk. Like the floor owes you money. Your father walked like that.',
        'Master Emeric Brand. The chandler\'s boy, who went for a soldier and came back a lord. Well. Came back.',
      ], next: 'm' },
      again: { who: 'w_tamsin', text: 'Still here? You\'re letting the cold in. …There isn\'t any cold. You\'re letting something in.', next: 'm' },
      m: { who: 'brand', choices: [
        { text: '"Do you know what I did?"', next: 'did' },
        { text: '"You lived across from us."', next: 'lane' },
        { text: '"I\'m sorry."', next: 'sorry', lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]' },
        { text: 'Leave her to her step.', next: null },
      ] },
      did: { who: 'w_tamsin', text: [
        'Course I know. I was here. I watched you light it from my window. Good arm. You always had a good arm.',
        'I was grey to the elbow, love. I had a week, maybe. You took six days off me.',
        'I\'ve had worse bargains. I married one.',
      ], next: 'did2' },
      did2: { who: 'w_tamsin', do: ['set:w_tamsin_forgave'], text: 'Doesn\'t mean you should have. Means I\'m too old and too dead to carry it for you. Put it down somewhere. Not on my step.', next: 'm' },
      lane: { who: 'w_tamsin', text: [
        'Across and two down. You used to carry the candles to the Chandlers\' post with both hands, like they were eggs.',
        'Proudest little thing on the lane. …Your father\'s shop is still there. What\'s left. Go and look, or don\'t. I\'m not your mother.',
      ], next: 'm' },
      sorry: { who: 'w_tamsin', do: ['set:w_tamsin_forgave'], text: [
        'I know you are. You\'ve a sorry face. Even under all that tin.',
        'There. I forgive you. Somebody on this lane ought to, and the rest of them are all stubborner than me.',
      ], next: 'sorry2' },
      sorry2: { who: 'narrator', text: 'She goes back to sweeping. She is humming. You knew the tune once. Your mother used to hum it wrong in the same place.', next: 'm' },
    },
  };

  // ---------------------------------------------------------------- Wat: refuses
  DLG.w_wat = {
    start: 's',
    nodes: {
      s: { branch: [{ if: 'w_wat_refused', next: 'again' }, { next: 'a' }] },
      a: { who: 'narrator', text: 'A big man\'s ghost is trying to lift the shaft of an overturned cart. His hands go through it. He tries again.', next: 'b' },
      b: { who: 'w_wat', text: 'Don\'t help. …Don\'t. You\'ve helped.', next: 'm' },
      m: { who: 'brand', choices: [
        { text: '"Who were you?"', next: 'who', if: '!w_wat_named' },
        { text: '"I\'m sorry."', next: 'sorry', lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]' },
        { text: '"Then hate me."', next: 'hate' },
        { text: 'Leave him to the cart.', next: null },
      ] },
      who: { who: 'w_wat', do: ['set:w_wat_named'], text: [
        'Wat. I drove the cart. Coal in, the dead out. After a while it was only the dead out.',
        'Then they shut the gate, and there was nowhere to drive.',
      ], next: 'm' },
      sorry: { who: 'w_wat', text: [
        'Are you.',
        'I had three. I wasn\'t grey. They walled me in for carrying the grey ones. I could still count, that night.',
        'I counted the bolts going across. Seven. Then I counted my three. Then I stopped counting.',
      ], next: 'sorry2' },
      sorry2: { who: 'brand', text: '…', next: 'sorry3' },
      sorry3: { who: 'w_wat', do: ['set:w_wat_refused'], text: 'No. You don\'t get that. Not from me.', end: true },
      hate: { who: 'w_wat', do: ['set:w_wat_refused'], text: [
        'I haven\'t enough left of me to hate you properly.',
        'That\'s the other thing you took.',
      ], end: true },
      again: { who: 'w_wat', text: 'Still no.', next: 'again2' },
      again2: { who: 'narrator', text: 'He goes back to the cart. Lift. Through. Lift.', end: true },
    },
  };

  // ---------------------------------------------------------------- the watchman: would have done the same
  DLG.w_watch = {
    start: 's',
    nodes: {
      s: { branch: [{ if: 'w_watch_asked', next: 'again' }, { next: 'a' }] },
      a: { who: 'narrator', text: 'A watchman\'s ghost stands at the grated postern with his halberd grounded, exactly as a watchman should. His eyes are on you, not the gate.', next: 'b' },
      b: { who: 'w_watch', text: 'Warden. Post\'s secure, sir. Nobody\'s got out.', next: 'b2' },
      b2: { who: 'w_watch', text: '…That was the order.', next: 'm' },
      m: { who: 'brand', choices: [
        { text: '"At ease."', next: 'ease' },
        { text: '"You were inside."', next: 'inside' },
        { text: '"Do you forgive me?"', next: 'forgive' },
        { text: 'Leave him his post.', next: null },
      ] },
      ease: { who: 'w_watch', text: 'Can\'t, sir. Nobody relieved me.', next: 'm' },
      inside: { who: 'w_watch', text: [
        'Gate wants holding from both sides, sir. Captain said it\'d be for a night.',
        'It was a night.',
      ], next: 'm' },
      forgive: { who: 'w_watch', text: [
        'Forgive you.',
        'Sir, I stood on this spot and thought it through, while the oil came down the gutters. I\'d plenty of time.',
        'I\'d have done it. If I\'d been you. I\'d have done the very same.',
      ], next: 'forgive2' },
      forgive2: { who: 'w_watch', do: ['set:w_watch_asked'], text: 'That\'s the part I can\'t get round, sir.', end: true },
      again: { who: 'w_watch', text: 'Post\'s secure, sir.', end: true },
    },
  };

  // ---------------------------------------------------------------- Kit: waiting for the drain lady
  DLG.w_kit = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'A small ghost sits by the grating at the foot of the infirmary wall, knees drawn up, being very good.', next: 'b' },
      b: { who: 'w_kit', text: 'Are you the drain lady? …No. You\'re too big. You wouldn\'t fit.', next: 'm' },
      m: { who: 'brand', choices: [
        { text: '"Who is the drain lady?"', next: 'lady' },
        { text: '"What are you waiting for?"', next: 'wait' },
        { text: '"She\'s inside. Counting."', next: 'go', if: 'knows_wren && !w_agna_home' },
        { text: 'Leave her be.', next: null },
      ] },
      lady: { who: 'w_kit', text: [
        'The nurse. She takes you down the drain to the cold place and you get better. She took lots. I\'m next.',
        'You have to be very quiet in the drain. I\'m practising.',
      ], next: 'm' },
      wait: { who: 'w_kit', text: ['Her. She said next time.', '…It\'s been a long next time.'], next: 'm' },
      go: { who: 'w_kit', text: 'Counting me?', next: 'go2' },
      go2: { who: 'brand', text: '…Yes.', next: 'go3' },
      go3: { who: 'w_kit', do: ['set:w_kit_went', 'hollow:-1'], text: 'I knew it. I knew she\'d count me. I was being ever so good.', end: true },
    },
  };
  DLG.w_kit_inf = {
    start: 'a',
    nodes: {
      a: { who: 'w_kit_inf', text: ['She counted me. I\'m thirteen.', '…I mean I\'m number thirteen. I\'m six.'], end: true },
    },
  };

  // ---------------------------------------------------------------- Pell: gives tag_ghost if Brand listens to the end
  DLG.w_pell = {
    start: 's',
    nodes: {
      s: { branch: [{ if: 'w_pell_met', next: 'back' }, { next: 'a' }] },
      a: { who: 'narrator', text: 'A thin ghost with a lighting-pole is reaching up to a lamp that has not been lit in nineteen years. He can\'t quite reach. You suspect he never could.', next: 'b' },
      b: { who: 'w_pell', text: 'Evening. Or it\'s always evening now, isn\'t it. Saves on oil.', next: 'c' },
      c: { who: 'w_pell', do: ['set:w_pell_met'], text: 'Pell. Lamplighter. Thirty-one years on these streets. Nobody ever asks the lamplighter anything. You\'d be amazed what he sees.', next: 'm1' },
      back: { who: 'w_pell', text: 'Oh, it\'s you. Where was I. …I\'ll start at the beginning. It\'s better from the beginning.', next: 'm1' },
      m1: { who: 'brand', choices: [
        { text: '"Go on."', next: 'e' },
        { text: '"Not now."', next: null },
      ] },
      e: { who: 'w_pell', text: [
        'A hundred and six lamps in the Wickward. I knew every one. Not proper names. Old Squint. The Widow. The one on Tanners\' Row that hissed at me.',
        'Lit them every dusk, put them out every dawn. You get to know a street that way. Who\'s up late. Who isn\'t, any more.',
      ], next: 'm2' },
      m2: { who: 'brand', choices: [
        { text: '"Go on."', next: 'g' },
        { text: '"I have to go."', next: null },
      ] },
      g: { who: 'w_pell', text: [
        'When the grey came, I kept lighting them. Chandlers said the sick liked a lamp. Can\'t remember their own names, but they know a lamp.',
        'Then the last night a Chandler comes round with a paper. Put them out, he says. All of them.',
      ], next: 'm3' },
      m3: { who: 'brand', choices: [
        { text: '"Why?"', next: 'i' },
        { text: '"I have to go."', next: null },
      ] },
      i: { who: 'w_pell', text: [
        'So the fire would show where to go. That\'s what he said. So it\'d be bright where it needed to be.',
        'I put out a hundred and six lamps. Took me till midnight. I did Old Squint last.',
        '…Then I sat down under him, and waited, and it got bright.',
      ], next: 'm4' },
      m4: { who: 'brand', choices: [
        { text: '…', next: 'k' },
        { text: '"I\'m sorry."', next: 'k', lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]' },
      ] },
      k: { who: 'w_pell', text: 'Thank you for listening. Nobody does, with lamplighters.', next: 'k2' },
      k2: { who: 'narrator', text: 'He fumbles at his collar with fingers that don\'t quite close, and finds a tin tag on a cord.', next: 'k3' },
      k3: { who: 'w_pell', do: ['give:tag_ghost', 'set:w_pell_told'], text: 'Here. Say it somewhere there\'s a bit of light. I\'d like that.', end: true },
    },
  };
  DLG.w_pell_after = {
    start: 'a',
    nodes: {
      a: { who: 'w_pell', text: ['Evening.', '…Old Squint\'s still out. I\'ll get to him.'], end: true },
    },
  };

  // ---------------------------------------------------------------- Archchandler Ormund, before the Pyre gate
  const ORMUND_KILL = {
    kill1: { who: 'narrator', text: 'He doesn\'t look up from the wicks. He only lifts his chin a little, to make it easier for you.', next: 'kill2' },
    kill2: { who: 'ormund', text: 'Ah. …Careful of the hem.', next: 'kill3' },
    kill3: { who: 'narrator', do: ['kill:self', 'set:ormund_killed', 'unset:ormund_left'], text: 'The wax takes a long time to stop moving. The candles don\'t notice. They lean toward the gate, the way they always have.', end: true },
  };
  DLG.w_ormund = {
    start: 's',
    nodes: Object.assign({
      s: { branch: [{ if: 'w_ormund_met', next: 'back' }, { next: 'a' }] },
      a: { who: 'narrator', do: ['set:w_ormund_met'], text: 'Before the Pyre gate, something kneels among a hundred candles, trimming wicks. It wore the Archchandler\'s white once. The wax has had most of it since.', next: 'b' },
      b: { who: 'ormund', text: ['Warden. You\'re late for the Vigil.', '…Nineteen years late. I kept it for you. Someone had to.'], next: 'm' },
      back: { who: 'ormund', text: 'Back again, Warden? I haven\'t finished. I never finish.', next: 'back2' },
      back2: { branch: [{ if: 'w_ormund_gloated', next: 'end_m' }, { next: 'm' }] },
      m: { who: 'brand', choices: [
        { text: '"Ormund."', next: 'name' },
        { text: '"What happened to you?"', next: 'wax' },
        { text: '"Open the gate."', next: 'gate' },
        { text: 'Walk away.', next: null },
      ] },
      name: { who: 'ormund', text: 'Archchandler Ormund, if you please. The wax hasn\'t taken the title. It\'s taken the knees, and the left hand, and my sense of smell. A mercy, down here.', next: 'turn' },
      wax: { who: 'ormund', text: ['Happened? I have been faithful. Faith pools, Warden. Kneel long enough by a holy fire and it sets.', 'Careful of the hem. I\'m mostly hem now.'], next: 'turn' },
      gate: { who: 'ormund', text: [
        'It isn\'t mine to open. It opens for those who know why they\'ve come.',
        'You don\'t. Not yet. You have the look of a man who thinks he does.',
      ], next: 'turn' },
      turn: { branch: [{ if: 'w_ormund_gloated', next: 'm' }, { next: 'g' }] },
      g: { who: 'ormund', do: ['set:knows_proposal', 'set:brand_named'], text: 'Up there they say it was the King\'s order, you know. I\'ve let them. Kings like to be given things.', next: 'h' },
      h: { who: 'ormund', text: [
        'But you and I were in the room, Ser Emeric Brand. Whose tongue was it?',
        '"Every day we wait, the grey climbs the wall." Such a good line. I\'ve used it in sermons. I always credit you.',
      ], next: 'i' },
      i: { who: 'ormund', text: [
        'And whose torch? I only blessed it. A blessing is a small thing, Warden. It\'s the hand that makes a thing holy.',
        'I say your name every night, in the litany. First. Before the King\'s. It\'s the least I can do. You did the most.',
      ], next: 'k' },
      k: { who: 'brand', do: ['set:w_ormund_gloated'], choices: [
        { text: '"It was mine. All of it."', next: 'l1' },
        { text: '"You blessed it."', next: 'l2' },
        { text: '…', next: 'l3' },
      ] },
      l1: { who: 'ormund', text: 'There. Doesn\'t that feel clean? Confession is like a good trim. The flame stands up straighter afterwards.', next: 'n' },
      l2: { who: 'ormund', text: 'I did. Beautifully. Nobody remembers the blessing, you know. They remember the torch.', next: 'n' },
      l3: { who: 'ormund', text: 'Quite right. Say nothing. That\'s how I knew you\'d make a fine Warden. You never argued with a thing you\'d already decided.', next: 'n' },
      n: { who: 'narrator', text: 'He goes back to his wicks. Trim. Trim. The candles lean toward the gate as if they were listening for something.', next: 'end_m' },
      end_m: { who: 'brand', choices: [
        { text: 'Draw Vigil.', next: 'kill1' },
        { text: 'Leave him to his candles.', next: 'left1' },
        { text: 'Not yet.', next: null },
      ] },
      left1: { who: 'brand', text: 'Tend it, then.', next: 'left2' },
      left2: { who: 'ormund', do: ['set:ormund_left'], text: 'Oh, I shall. I\'ll say your name tonight, Warden. First, as always.', end: true },
    }, ORMUND_KILL),
  };
  DLG.w_ormund_left = {
    start: 's',
    nodes: Object.assign({
      s: { branch: [{ if: 'knows_wren', next: 'b1' }, { next: 'b0' }] },
      b0: { who: 'ormund', text: 'Warden. Again. The Pyre doesn\'t need you. It has me.', next: 'm' },
      b1: { who: 'ormund', text: [
        'You\'ve been in the infirmary. You\'re standing like a man with a candle inside his coat.',
        'Careful. They go out, carried like that. Or they catch.',
      ], next: 'm' },
      m: { who: 'brand', choices: [
        { text: 'Draw Vigil.', next: 'kill1' },
        { text: 'Leave.', next: null },
      ] },
    }, ORMUND_KILL),
  };

  // ---------------------------------------------------------------- Cot 11 (trigger, infirmary)
  DLG.w_cot11 = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: [
        'Row Three. You counted these cots once, going in, with the roof coming down. You didn\'t need to count. You knew the way.',
        'Cot eleven is empty. It was empty then, too. Something small sits on the pillow, where the tag was.',
      ], next: 'b' },
      b: { who: 'brand', text: '…', end: true },
    },
  };

  // ---------------------------------------------------------------- Nurse Agna: what she did (knows_wren, chapter 5)
  DLG.w_agna = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'The nurse stands where nurses stand: at the end of the row, where she can see every cot at once. Her lips are moving.', next: 'b' },
      b: { who: 'agna', text: ['Row Three. Fourteen cots. Count at dusk…', '…fourteen.'], next: 'm' },
      m: { who: 'brand', choices: [
        { text: '"Cot eleven is empty."', next: 'd' },
        { text: '"Who are you?"', next: 'who' },
        { text: 'Leave her to her count.', next: null },
      ] },
      who: { who: 'agna', text: ['Nurse. …Agna. Nurse Agna. Row Three, the children.', 'Don\'t touch the tags. The tags are the count.'], next: 'm' },
      d: { who: 'agna', text: [
        'No. There\'s a tag on the pillow. A tag is a child. That\'s how the Chandlers count.',
        'Not faces. Tags. Nobody looks at the faces.',
      ], next: 'e' },
      e: { who: 'brand', text: 'There was a tag. I took it.', next: 'f' },
      f: { who: 'narrator', text: 'She looks at you properly for the first time. At the helm. At the scorched tin knotted to your wrist.', next: 'g' },
      g: { who: 'agna', text: [
        '…You. The Warden. You came to the gate every evening with your hands behind your back.',
        'Birds. You were hiding birds.',
      ], next: 'h' },
      h: { who: 'brand', text: '…Where is she.', next: 'j' },
      j: { who: 'agna', text: [
        'Gone down the drain. Nine nights before the Vigil — the last night I went. She would go first.',
        'She wasn\'t afraid of the dark. She said her da told her it was shorter than it looks.',
      ], next: 'k' },
      k: { who: 'agna', text: [
        'You kept coming. I told you she was asleep. Nine evenings I told you that, and took your birds, and sent them after her.',
        'I cut her tag off and left it on the pillow. Fourteen tags. The count held.',
        'Nobody comes looking for a tag.',
      ], next: 'l' },
      l: { who: 'narrator', text: 'W · · EN. You tied it to your wrist with the roof coming in. You were so sure.', next: 'l2' },
      l2: { who: 'brand', text: '…', next: 'm2' },
      m2: { who: 'agna', text: [
        'Down the drain, under the wall, out to the reeds. Brothers from Lenten Mere waiting with blankets. The cold place.',
        'The cold stops the grey climbing. It did, for her. It never gives back the hands. Never the hands.',
      ], next: 'n' },
      n: { who: 'agna', text: [
        'She wouldn\'t give them her name. Said it was her da\'s. So the sisters called her after a bird. A little brown one.',
        '…It\'s gone. I had it a moment ago. Things go, here.',
      ], next: 'p1' },
      p1: { who: 'brand', text: '…Grey. To the wrist.', next: 'p2' },
      p2: { who: 'narrator', text: 'A candle, held up to your visor in the crypt, like a question. The hand that held it.', next: 'p3' },
      p3: { who: 'brand', text: ['She pours my candles.', 'Every one. Since the bier.'], next: 'p4' },
      p4: { who: 'brand', text: ['There is a bird on every grave at the Rest.', 'Every grave without a name.'], next: 'p5' },
      p5: { who: 'brand', text: ['I carved them for her. She said they looked like turnips.', '…With opinions.'], next: 'p6' },
      p6: { who: 'brand', text: '…Linnet.', next: 'q' },
      q: { who: 'agna', text: [
        'Linnet. …Yes. That\'s the bird. That\'s it.',
        'Is she— no. Don\'t tell me. I\'ll only lose it again.',
      ], next: 'r' },
      r: { who: 'agna', text: [
        'She left the bird. I told her to take it. She said no, her da would need it more, because he\'d be sad.',
        'She was eight. She was very sure.',
      ], next: 's' },
      s: { branch: [{ if: 'has:wren_bird', next: 's2' }, { next: 's1' }] },
      s1: { who: 'narrator', do: ['give:wren_bird'], text: 'You take the bird from the pillow. It weighs nothing. It weighs exactly what it always did.', next: 't' },
      s2: { who: 'narrator', text: 'The bird is in your gauntlet. You don\'t remember closing your hand on it. You haven\'t opened it since.', next: 't' },
      t: { who: 'agna', do: ['set:knows_wren'], text: ['Row Three. Fourteen cots. Count at dusk…', '…thirteen.'], next: 't2' },
      t2: { who: 'agna', text: '…Oh. Thirteen. Well. That\'s all right, then.', next: 'u' },
      u: { who: 'brand', choices: [
        { text: '"Go home, Agna."', next: 'v' },
        { text: '"Keep your count."', next: 'w' },
      ] },
      v: { who: 'brand', text: 'Go home, Agna. The dark is shorter than it looks.', next: 'v2' },
      v2: { who: 'narrator', do: ['snuff:self', 'set:w_agna_home', 'hollow:-1'], text: 'Her flame goes up out of the row, and out. Thirteen cots, and one empty. It is very quiet.', next: 'fin' },
      w: { who: 'agna', text: 'I will. It\'s what I\'m for. …Thirteen.', next: 'fin' },
      fin: { do: ['chapter:5'], end: true },
    },
  };
  DLG.w_agna_after = {
    start: 'a',
    nodes: {
      a: { who: 'agna', text: 'Row Three. Fourteen cots… no. Count at dusk, thirteen. Thirteen, and one gone to the cold.', next: 'm' },
      m: { who: 'brand', choices: [
        { text: '"Go home, Agna."', next: 'v' },
        { text: 'Leave her to her count.', next: null },
      ] },
      v: { who: 'brand', text: 'Go home, Agna. The dark is shorter than it looks.', next: 'v2' },
      v2: { who: 'narrator', do: ['snuff:self', 'set:w_agna_home', 'hollow:-1'], text: 'Her flame goes up out of the row, and out. It is very quiet.', end: true },
    },
  };

  // ---------------------------------------------------------------- the Pyre: the approach (ends boss:boss_final)
  DLG.w_pyre_approach = {
    start: 's',
    nodes: {
      s: { branch: [{ if: 'w_pyre_seen', next: 'again' }, { next: 'a' }] },
      a: { who: 'narrator', text: [
        'The heart of the Wickward is a hole full of fire. It has burned for nineteen years on nothing but what it had that night.',
        'The fire is full of shapes. Hands. Faces. Something like a cot. Something like a gate, shutting.',
      ], next: 'b' },
      b: { who: 'narrator', text: 'Then it stands up. It wears a helm with a wick on it. It carries a torch the way you carried it: low, careful, in both hands.', next: 'c' },
      c: { who: 'brand', text: ['…', 'That\'s how I held it.'], next: 'go' },
      again: { who: 'narrator', text: 'The fire stands up again, wearing you.', next: 'go' },
      go: { do: ['set:w_pyre_seen', 'set:w_pyre_lit', 'boss:boss_final'], end: true },
    },
  };
})(window.AV);
