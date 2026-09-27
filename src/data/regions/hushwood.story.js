// ASHEN VOW — The Hushwood: people, words and records of the pale forest (builder: HUSHWOOD)
// Old Maud and her ring; Odeline and her washing; Hobb Reeve at the ford; the Moth-Wife and her jars;
// the hartlings; Cael the forester, who kept the stone; and Aubrenn, the Old Hart.
(function (AV) {
  'use strict';
  const D = AV.data;
  const GHOST = '#82a8ad';

  // ================================================================== records
  const MAUD_LETTERS = [
    '"Aldo. The physician\'s boy came. Says no physician is coming, the roads are shut."',
    '"I said my husband\'s gone to fetch one. He looked at me very kind. I didn\'t care for it."',
    '"Aldo. Coughed less today. Well — the same. I\'ve kept your supper. Don\'t think I\'m keeping it forever."',
    '"Aldo. They say the Wickward gates are shut. You\'ll have come round by the south road. You never had sense in your life. Have it this once."',
    '"Aldo. The sky\'s gone red over the city. I\'ve put the candle in the window. Don\'t laugh."',
    '"Aldo. It\'s snowing, and it isn\'t snow."',
    '"Aldo. I shan\'t write again. It\'s daft, writing to a man who\'s on the road home."',
    '"— M. Collier. Which is still my name, in case you\'ve forgot it."',
  ];
  const CAEL_JOURNAL = [
    '"Cael Dunnock, forester of the Hart, his book. The order came up from the Gate, sealed black: none out of the Wickward to pass the Hushwood."',
    '"They came at dusk. Nine carts, and people with no carts. A big man with his mother on his back. I read them the paper. I read it twice."',
    '"I did not shoot. Hamm did not shoot. We only stood in the ford till they turned round. That was worse."',
    '"Some went up to the old ice-house. I take bread when I can. The old stag goes to them at night. They are not afraid of him. Nor am I."',
    '"The sky over the city is red and does not stop being red. A rider from the Queen: the Hart\'s stone, to be carried home and kept. I have it."',
    '"The ice-house is quiet. I went in. I came out. I have bricked the door, and smoothed it, and said what names I knew."',
    '"The ash comes down, and the stag eats it off the graves. Every week there is less of him in his eyes. He does not know me now."',
    '"I cannot keep the stone and keep myself. I have given it to him. He keeps everything. He will keep that."',
    '"A name is a door. If he forgets his, someone must hold it open. The first forester gave it him. His name is Aubrenn."',
    'The rest is one word, again and again, down every page, until the pencil goes through the paper.',
  ];
  const COPYBOOK = [
    'MY NAME IS JENET REEVE. I AM NINE. I LIVE IN THE WICKWARD BUT NOT NOW.',
    'My da is Hobb Reeve. He is the strongest in our street. He carried Gran on his back all the way to the river.',
    'The forester said go back. Da said there is no back to go to. The forester cried. I did not know men did.',
    'Da has gone round the deep way to find a place to cross. He said count the days till I come. So I am counting.',
    'The big deer came in the night. Old Wat said do not be afraid, it is only looking. It was warm. It lay down by Benno.',
    'Nobody says it but I think Da is not coming. I am still counting. Keep your flame, Da. — J.',
  ];

  // ================================================================== items
  D.items.tag_edge = {
    name: 'Tin Tag: Odeline Farr', kind: 'tag', icon: 'icon_tag',
    desc: 'ODELINE FARR — ROW 9, COT 2. Laundress. Knotted on with a laundress\'s hitch, the kind that holds wet and comes loose with one pull. Nobody pulled.',
  };
  D.items.tag_moth = {
    name: 'Tin Tag: Maelis Vane', kind: 'tag', icon: 'icon_tag',
    desc: 'MAELIS VANE — ROW 7, COT 5. Herb-woman. The stamping is worn nearly smooth by a thumb. The tin is warm, though nothing she kept was ever quite warm enough.',
  };
  D.items.lore_h_maud_letters = {
    name: 'Letters to Aldo', kind: 'lore', icon: 'icon_note',
    desc: 'Letters from a biscuit tin, every one to Aldo, none of them sent. There was nowhere to send them.',
    read: MAUD_LETTERS, onRead: ['set:h_maud_name'],
  };
  D.items.lore_h_cael_journal = {
    name: 'A Forester\'s Journal', kind: 'lore', icon: 'icon_book',
    desc: 'Cael Dunnock\'s journal, swollen with damp. The last page is one word, written until the pencil went through.',
    read: CAEL_JOURNAL, onRead: ['set:h_knows_aubrenn'],
  };
  D.items.lore_h_copybook = {
    name: 'Jenet\'s Copybook', kind: 'lore', icon: 'icon_book',
    desc: 'A child\'s copybook, the pages gone soft as cloth. On the cover, in careful capitals: JENET REEVE, HER BOOK.',
    read: COPYBOOK, onRead: ['set:h_knows_hobb'],
  };

  // ================================================================== quests
  D.quests.maud = {
    title: 'A Ring in the Wrong Hands', kind: 'side',
    stages: {
      1: 'Old Maud\'s ghost keeps a candle in her window for Aldo, gone to the city for a physician. Someone dug up her grave and took her wedding ring. Rings that leave graves tend to turn up in peddlers\' packs.',
      2: 'Maud has her ring again. She is still waiting for Aldo. She might stop, if someone spoke her name.',
      99: 'The matter of Maud\'s ring is settled. The candle in her window burns, or it doesn\'t, according to what you chose.',
    },
  };
  D.quests.mothwife = {
    title: 'Little Lights', kind: 'side',
    stages: {
      1: 'In a hollow tree in the deep Hushwood, a woman with moths for hair keeps drifting flames in jars, to keep them warm. She eats one now and then. She wants the Old Hart\'s flame when you are done with him.',
      2: 'You told the Moth-Wife you believed her. She told you the Old Hart\'s name: Aubrenn.',
      3: 'The Old Hart is dead. The Moth-Wife will want to know what became of his flame.',
      99: 'The Moth-Wife\'s tag is in your pack. What was in her jars is on your conscience, one way or the other.',
    },
  };

  // ================================================================== speakers
  D.speakers.maud = { name: 'Old Maud', portrait: 'maud', color: '#cbc4c3', voice: 1.1 };
  D.speakers.mothwife = { name: 'The Moth-Wife', portrait: 'mothwife', color: '#e6cc9c', voice: 0.95 };
  D.speakers.h_hartling = { name: 'Hartling', color: '#ebe5dc', voice: 1.5 };
  D.speakers.h_odeline = {
    name: [{ if: 'has:tag_edge', name: 'Odeline' }, { name: 'Woman with Washing' }],
    portrait: 'ghost_woman', color: GHOST, voice: 1.15,
  };
  D.speakers.h_carrier = {
    name: [{ if: 'h_knows_hobb', name: 'Hobb Reeve' }, { name: 'The Carrier' }],
    portrait: 'ghost_man', color: GHOST, voice: 0.55,
  };

  // ================================================================== npcs
  D.npcs.maud = {
    name: 'Old Maud', sprite: 'npc_maud', portrait: 'maud', solid: true, anim: 'idle',
    talk: [
      { if: 'maud_kept', dialogue: 'h_maud_cold' },
      { if: 'maud_returned', dialogue: 'h_maud_rest' },
      { if: 'seen_h_maud_first', dialogue: 'h_maud' },
      { dialogue: 'h_maud_first' },
    ],
    barks: [
      { if: '!maud_kept', text: '…he\'ll be along…' },
      { if: '!maud_kept && !maud_returned', text: '…mind my floor…' },
      { if: 'maud_returned', text: '…there. Dressed…' },
      { if: 'maud_kept', text: '…' },
    ],
  };
  D.npcs.mothwife = {
    name: 'The Moth-Wife', sprite: 'npc_mothwife', portrait: 'mothwife', solid: true, anim: 'idle',
    talk: [
      { if: 'boss_hart && moth_trusted && !h_moth_gift', dialogue: 'h_moth_gift' },
      { if: 'h_moth_met', dialogue: 'h_moth' },
      { dialogue: 'h_moth_first' },
    ],
    barks: [
      { text: '…hush, hush, there…' },
      { text: '…who\'s cold? Nobody\'s cold…' },
      { text: '…only if you ask, love…' },
    ],
  };
  D.npcs.h_hartling = {
    name: 'Hartling', sprite: 'npc_hartling', solid: false, anim: 'idle',
    talk: [{ dialogue: 'h_hartling' }],
    barks: [
      { text: '(an ear flicks)' },
      { text: '…' },
      { if: 'hart_named', text: '(it grazes, unafraid)' },
    ],
  };
  D.npcs.h_odeline = {
    name: 'Woman with Washing', sprite: 'npc_ghost_woman', portrait: 'ghost_woman', solid: false, anim: 'idle',
    talk: [{ dialogue: 'h_odeline' }],
    barks: [{ text: '…Tuesday…' }, { text: '…mind the hem…' }],
  };
  D.npcs.h_carrier = {
    name: 'The Carrier', sprite: 'npc_ghost_man', portrait: 'ghost_man', solid: false, anim: 'idle',
    talk: [{ dialogue: 'h_carrier' }],
    barks: [{ text: '…other bank. Just the other bank…' }, { text: '…hold on, Mam…' }],
  };

  // ================================================================== arrival & places
  D.dialogue.h_edge_enter = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'The road goes in under the white trees, and the village light stays behind, as if it had been told not to follow.', next: 'b' },
      b: { who: 'narrator', text: 'Fog lies in the ferns. Somewhere ahead, something small and pale is watching you, and is not afraid.', next: 'c' },
      c: { who: 'brand', text: ['…The foresters used to say the Hushwood keeps what it\'s given.', 'They never said what it does with it.'] },
    },
  };

  D.dialogue.h_deep_enter = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'The trees here are older. Their bark is white as a knuckle, and the fog stands between them like people waiting to be let in.', next: 'b' },
      b: { who: 'narrator', text: 'On every third trunk someone has nailed a shed antler, tines up.', next: 'c' },
      c: { who: 'brand', text: ['Foresters of the Hart. They kept the barrow, and the old stag on it.', 'Their keeper carried his stone home, after. …Somewhere in here.'] },
    },
  };

  D.dialogue.h_maud_grave = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'gone_maud', next: 'rest' }, { next: 'dug' }] },
      dug: { who: 'narrator', text: 'A grave by the garden fence, under the lilies. The earth has been dug open and shovelled back badly, by someone in a hurry.', next: 'mark' },
      rest: { who: 'narrator', text: 'The grave by the fence. The earth has settled, the way earth does when nobody is digging at it any more.', next: 'mark' },
      mark: { who: 'narrator', text: 'The marker is a board, cut by someone who did not know her well: MAUD. WIFE OF ALDO THE COLLIER. HE\'LL BE ALONG.', do: ['set:h_maud_name'], next: 'after' },
      after: { branch: [{ if: 'has:maud_ring', next: 'ring' }, { next: null }] },
      ring: { who: 'narrator', text: 'The ring in your pack is no heavier than it was. It only feels that way.' },
    },
  };

  D.dialogue.h_lodge_order = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'h_order_torn', next: 'torn' }, { next: 'n1' }] },
      torn: { who: 'narrator', text: 'The nail where the notice hung. You tore it down. It did not help anyone, but it is down.' },
      n1: { who: 'narrator', text: 'A notice nailed to the lodge post, under a little roof of its own so the rain would not spoil it.', next: 'n2' },
      n2: { who: 'narrator', text: '"By order of the Crown, in time of pestilence: no person out of the Wickward shall pass the Hushwood. The foresters of the Hart shall hold the ford."', next: 'n3' },
      n3: { who: 'narrator', text: '"Given at the Seventh Gate." Under the words, in black wax, a seal you have pressed a thousand times. Your seal.', next: 'n4' },
      n4: { who: 'brand', text: ['I don\'t remember this one.', '…That was the trouble. There were so many of them.'], next: 'ch' },
      ch: { who: 'brand', choices: [
        { text: 'Tear it down.', next: 'tear' },
        { text: 'Leave it.', next: null },
      ] },
      tear: { who: 'narrator', text: 'It comes away in your hand, wax and all. The nail stays. So does the ford.', do: ['set:h_order_torn'] },
    },
  };

  D.dialogue.h_hollow_hum = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'From inside the great hollow tree comes a woman\'s voice, humming. Not a hymn. A kitchen song, the kind you hum over a pot.', next: 'b' },
      b: { who: 'narrator', text: 'Every few bars she stops and says something soft to somebody. "…There. There, now. Who\'s cold? Nobody\'s cold."' },
    },
  };

  // ================================================================== the hartlings
  D.dialogue.h_hartling_flee = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'A fawn stands in the ferns: ash-white, no bigger than a hound, a small flame burning between two stub antlers.', next: 'b' },
      b: { who: 'narrator', text: 'It looks at you for a long moment. Then it turns and trots north into the white trees. It stops. It looks back.', next: 'c' },
      c: { who: 'narrator', text: 'It is, quite plainly, waiting for you.' },
    },
  };

  D.dialogue.h_hartling_wall = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'The fawn trots up to the old enclosure wall and walks into it. Not through a gap. Into it.', next: 'b' },
      b: { who: 'narrator', text: 'The stones take it the way fog takes a lantern. A moment later its little flame shows on the other side.', next: 'c' },
      c: { who: 'brand', text: '…Of course it did.' },
    },
  };

  D.dialogue.h_hartling = {
    start: 'a',
    nodes: {
      a: { branch: [
        { if: "map=='hart_barrow' && h_hart_left", next: 'left' },
        { if: "map=='hart_barrow' && hart_named", next: 'graze' },
        { next: 'near' },
      ] },
      left: { who: 'narrator', text: 'The fawn stands under the Old Hart\'s flame, looking up at it. It does not look at you. It is waiting too.' },
      graze: { who: 'narrator', text: 'The fawn is grazing on the barrow, where the ash has been eaten away and the grass has come back, thin and green.', next: 'touch' },
      near: { who: 'narrator', text: 'The fawn lets you come close. The flame between its antlers leans toward you, curious, the way a candle leans to a draught.', next: 'touch' },
      touch: { who: 'narrator', text: 'You hold out a gauntlet. It sniffs the ash on it, sneezes, and presses its small warm head into your palm anyway.', next: 'warm' },
      warm: { who: 'narrator', text: 'For a moment the armor is not so heavy.', do: ['heal'] },
    },
  };

  // ================================================================== Cael's grave (the hidden glade)
  D.dialogue.h_cael_grave = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'h_cael_spoken', next: 'after' }, { next: 'g1' }] },
      after: { who: 'narrator', text: 'The grave in the glade. A fawn lies on it, its little flame nodding. It opens one eye at you, and closes it again.' },
      g1: { who: 'narrator', text: 'A grave in the glade, heaped by no spade. The earth is raked in long furrows, the way tines would rake it.', next: 'g2' },
      g2: { who: 'narrator', text: 'Two shed antlers stand at its head in place of a marker. There is no name. The moths sit on it as if it were warm.', next: 'g3' },
      g3: { branch: [{ if: 'has:lore_h_cael_journal', next: 'ch' }, { next: null }] },
      ch: { who: 'brand', choices: [
        { text: '"Go home, Cael Dunnock."', next: 's1' },
        { text: 'Leave him be.', next: null },
      ] },
      s1: { who: 'brand', text: 'Go home, Cael Dunnock. The dark is shorter than it looks.', next: 's2' },
      s2: { who: 'narrator', text: 'The moths lift off the grave all at once. Under them, a flame you had taken for moth-light rises, and thins, and goes out.',
        do: ['sfx:snuff', 'set:h_cael_spoken', 'hollow:-1'], next: 's3' },
      s3: { who: 'narrator', text: 'The fawn watches it go. Then it folds its legs and lies down on the grave, where the moths were.' },
    },
  };

  // ================================================================== Odeline, on the path
  D.dialogue.h_odeline = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'A woman walks east along the path with a bundle of washing on her hip. She walks and walks, and never gets past the next tree.', next: 'b' },
      b: { who: 'h_odeline', text: ['Can\'t stop. This is the forester\'s wife\'s. I said I\'d have it back to her Tuesday.', '…It\'s been a very long Tuesday.'], next: 'c' },
      c: { branch: [{ if: 'has:tag_edge', next: 'c2' }, { next: 'c1' }] },
      c1: { who: 'brand', choices: [
        { text: '"Put it down. Rest."', next: 'put' },
        { text: 'Leave her walking.', next: null },
      ] },
      c2: { who: 'brand', choices: [
        { text: '"Odeline Farr."', next: 'name' },
        { text: '"Put it down. Rest."', next: 'put' },
        { text: 'Leave her walking.', next: null },
      ] },
      put: { who: 'h_odeline', text: ['And have it go grey? It\'s white, this. Look at it.', 'It\'s the only white thing left.'], next: 'c' },
      name: { who: 'h_odeline', text: ['…', 'Somebody\'s said it right. Not Odie. Not "you there". Odeline.'], next: 'name2' },
      name2: { who: 'h_odeline', text: 'Will you take the washing? Only — it\'s clean. It ought to go to somebody.', next: 'name3' },
      name3: { who: 'brand', choices: [
        { text: '"Go home, Odeline Farr."', next: 'home' },
        { text: '"Not yet."', next: null },
      ] },
      home: { who: 'brand', text: 'Go home, Odeline Farr. The dark is shorter than it looks.', next: 'home2' },
      home2: { who: 'narrator', do: ['snuff:self', 'set:h_odeline_rested', 'hollow:-1'],
        text: 'She sets the bundle down in the fern, very carefully, the way you would set down something asleep. Then there is only the washing.' },
    },
  };

  // ================================================================== Hobb Reeve, at the ford
  D.dialogue.h_carrier = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'A big man stands at the edge of the ford with an old woman on his back. He steps into the water. He steps back out. He steps in.', next: 'b' },
      b: { who: 'h_carrier', text: ['Other bank. That\'s all. Just the other bank. She can\'t walk it, and there\'s no back to go to.', 'Forester\'s got a bow. Forester\'s got a paper. I\'ve got my mam.'], next: 'c' },
      c: { branch: [{ if: 'h_knows_hobb', next: 'c2' }, { next: 'c1' }] },
      c1: { who: 'brand', choices: [
        { text: '"The forester is dead."', next: 'fdead' },
        { text: '"Cross. No one will stop you."', next: 'cross' },
        { text: 'Leave.', next: null },
      ] },
      c2: { who: 'brand', choices: [
        { text: '"Hobb Reeve."', next: 'name' },
        { text: '"The forester is dead."', next: 'fdead' },
        { text: 'Leave.', next: null },
      ] },
      fdead: { who: 'h_carrier', text: ['Dead\'s no matter. He\'s still got the paper.', 'Paper outlasts everybody. You look like a man who\'s signed a few.'], next: 'c' },
      cross: { who: 'h_carrier', text: ['Can\'t. I tried round the deep way. The water took the both of us.', 'So I\'ll try here again. It\'s shallower here. It\'s always shallower here.'], next: 'c' },
      name: { who: 'h_carrier', text: '…Who\'s asking? Is it about the cart? I\'ll pay for the cart.', next: 'name2' },
      name2: { who: 'brand', choices: [
        { text: '"Jenet waited for you."', next: 'tam' },
        { text: '"Go home, Hobb Reeve."', next: 'home' },
      ] },
      tam: { who: 'h_carrier', text: ['…She counted? She would. She\'s got her letters. Better than me.', 'How long?'], next: 'tam2' },
      tam2: { who: 'brand', choices: [
        { text: '"Forty-one days."', next: 'tam41' },
        { text: '"Long enough."', next: 'tamlong' },
      ] },
      tam41: { who: 'h_carrier', text: '…Then I\'d best not keep her waiting forty-two.', next: 'home' },
      tamlong: { who: 'h_carrier', text: '…That\'s a kind way of putting it. I can tell it\'s kind.', next: 'home' },
      home: { who: 'brand', text: 'Go home, Hobb Reeve. The dark is shorter than it looks.', next: 'home2' },
      home2: { who: 'narrator', do: ['snuff:self', 'set:h_carrier_rested', 'hollow:-1'],
        text: 'He steps into the ford and does not step back. Halfway across, there is nobody in the water at all.' },
    },
  };

  // ================================================================== Old Maud
  // Nodes shared by every Maud conversation: the questions, the ring, and the rest.
  function maudNodes() {
    return {
      hub: { who: 'brand', choices: [
        { text: '"Where is Aldo?"', next: 'aldo' },
        { text: '"How long have you been waiting?"', next: 'wait' },
        { text: '"Maud. You\'re dead."', next: 'dead' },
        { text: 'Leave.', next: null },
      ] },
      aldo: { who: 'maud', text: ['Gone to the city for the physician. For my chest. Silly article. I told him it\'s only a cough.', 'He\'ll be home for the Vigil. I\'ve kept his supper.'], next: 'hub' },
      wait: { who: 'maud', text: ['Since this morning.', '…It\'s been a long morning.'], next: 'hub' },
      dead: { who: 'maud', text: ['I\'m poorly. There\'s a difference.', '…Don\'t say it again. The candle doesn\'t like it.'], next: 'hub' },

      notice: { who: 'maud', text: ['What\'s that? In your pack. I can smell it. Silver.', '…That\'s my ring. That\'s MY ring. Off my own hand.'],
        do: ['set:h_maud_name'], next: 'noticeq' },
      noticeq: { branch: [{ if: 'q_maud<1', next: 'noticeq1' }, { next: 'ringch' }] },
      noticeq1: { do: ['quest:maud=1'], next: 'ringch' },
      ringch: { who: 'brand', choices: [
        { text: 'Give it back.', next: 'ret' },
        { text: '"I paid good pennies for it."', next: 'keep1' },
        { text: 'Say nothing. Keep it.', next: 'keep2' },
      ] },
      ret: { who: 'narrator', do: ['take:maud_ring', 'set:maud_returned', 'unset:maud_kept', 'hollow:-1'],
        text: 'You hold it out. She does not take it so much as her hand remembers where it goes. Then it is on her finger, and always was.', next: 'ret2' },
      ret2: { who: 'maud', text: ['There. Now I\'m dressed.', 'Here. Take this. Aldo\'d want someone useful to have it.'], do: ['give:maud_thimble'], next: 'retq' },
      retq: { branch: [{ if: 'q_maud<2', next: 'retq2' }, { next: 'r0' }] },
      retq2: { do: ['quest:maud=2'], next: 'r0' },
      keep1: { who: 'maud', text: ['Paid.', '…Then you\'ve been robbed, and so have I, and only one of us is sorry.'], next: 'keepend' },
      keep2: { who: 'narrator', text: 'You say nothing. She looks at you for a long while.', next: 'keepend' },
      keepend: { who: 'narrator', do: ['set:maud_kept', 'quest:maud=99'],
        text: 'The candle on the sill leans away from you, and goes out. Old Maud turns her chair to the window.' },

      r0: { branch: [{ if: 'h_aldo_home', next: 'r0b' }, { next: 'r0a' }] },
      r0a: { who: 'maud', text: 'He\'ll be along. Aldo. He\'s only gone to the city.', next: 'rh' },
      r0b: { who: 'maud', text: ['Funny. The candle went all to one side just now.', 'Like somebody came in the door.'], next: 'rh' },
      rh: { who: 'brand', choices: [
        { text: '"Aldo got your lungwort."', if: 'h_knows_aldo && !h_told_maud_aldo', next: 'lung' },
        { text: '"Go home, Maud Collier."', if: 'h_maud_name', next: 'home' },
        { text: 'Leave her to her window.', next: null },
      ] },
      lung: { who: 'maud', text: ['…Did he.', 'Stupid man. It never takes.'], do: ['set:h_told_maud_aldo'], next: 'lung2' },
      lung2: { who: 'maud', text: '…Well. He\'ll have to catch me up, then.', next: 'rh' },
      home: { who: 'brand', text: 'Go home, Maud Collier. The dark is shorter than it looks.', next: 'home2' },
      home2: { who: 'maud', text: ['I am home. This is home.', '…Oh. You mean the other one.'], next: 'home3' },
      home3: { branch: [{ if: 'h_aldo_home || h_told_maud_aldo', next: 'home3a' }, { next: 'home3b' }] },
      home3a: { who: 'maud', text: 'Leave the candle. Not for him. He\'s gone on ahead — he always did walk too fast. For the house.', next: 'home4' },
      home3b: { who: 'maud', text: 'Leave the candle in the window. In case he comes the long way round.', next: 'home4' },
      home4: { who: 'narrator', do: ['snuff:self', 'set:h_maud_rested', 'quest:maud=99'],
        text: 'Her flame rises off the chair like a thread drawn out of a hem, and thins, and goes out.' },
    };
  }

  D.dialogue.h_maud_first = {
    start: 'a',
    nodes: Object.assign(maudNodes(), {
      a: { who: 'narrator', text: 'An old woman sits by the window in a chair that is not quite there, and neither is she. A candle burns on the sill.', next: 'b' },
      b: { who: 'maud', text: ['Aldo? You\'re late. You\'re—', '…No. You\'re too tall. He\'s not tall. He only thinks he is.'], next: 'c' },
      c: { who: 'maud', text: 'Wipe your feet. You\'re dropping ash all over my floor. …Everyone\'s dropping ash, these days. I don\'t know where it comes from.', next: 'd' },
      d: { branch: [{ if: 'has:maud_ring', next: 'notice' }, { next: 'e' }] },
      e: { who: 'maud', text: ['Somebody\'s had my ring. Off my own hand, while I was lying down. I felt it go. Cold as a well.',
        'You see a man with a silver ring, worn flat on one side, you tell him Maud Collier wants it back. And she\'s got a spade.'],
        do: ['set:h_maud_name', 'quest:maud=1'], next: 'hub' },
    }),
  };

  D.dialogue.h_maud = {
    start: 'a',
    nodes: Object.assign(maudNodes(), {
      a: { branch: [{ if: 'has:maud_ring', next: 'notice' }, { next: 'a1' }] },
      a1: { who: 'maud', text: 'Back again. You\'re still not Aldo. I\'d have noticed.', next: 'hub' },
    }),
  };

  D.dialogue.h_maud_rest = {
    start: 'r0',
    nodes: maudNodes(),
  };

  D.dialogue.h_maud_cold = {
    start: 'a',
    nodes: Object.assign(maudNodes(), {
      a: { who: 'narrator', text: 'The candle is out. Old Maud sits with her back to you, turning her finger where a ring should be.', next: 'b' },
      b: { branch: [{ if: 'has:maud_ring', next: 'ch' }, { next: null }] },
      ch: { who: 'brand', choices: [
        { text: 'Give the ring back.', next: 'ret' },
        { text: 'Leave.', next: null },
      ] },
    }),
  };

  // ================================================================== the Moth-Wife
  // Nodes shared by every Moth-Wife conversation.
  function mothNodes() {
    return {
      hub: { who: 'brand', choices: [
        { text: '"The jars."', next: 'jars' },
        { text: '"The stag on the barrow."', next: 'hart' },
        { text: '"Maelis."', if: 'h_moth_body && !h_moth_maelis', next: 'maelis' },
        { text: 'Leave.', next: 'bye' },
      ] },
      bye: { branch: [{ if: 'moth_trusted', next: 'bye1' }, { next: 'bye2' }] },
      bye1: { who: 'mothwife', text: 'Keep your flame, love. Keep it somewhere warm.' },
      bye2: { who: 'mothwife', text: ['Off you go, then. Take your cold with you.', '…I\'ve enough of my own.'] },

      // ---- the jars
      jars: { who: 'mothwife', text: ['Flames. Little ones. They come down with the ash, and nobody says their names, so they sit in the fern and go cold.', 'I bring them in. I keep them warm.'], next: 'jars2' },
      jars2: { who: 'mothwife', text: '…Mostly.', next: 'jarsch' },
      jarsch: { who: 'brand', choices: [
        { text: '"Mostly?"', next: 'mostly' },
        { text: '"Old Maud. By the road."', if: 'seen_h_maud_first && !h_aldo_home', next: 'maudc' },
        { text: '"Let them go."', next: 'letgo' },
        { text: 'Enough.', next: 'hub' },
      ] },
      maudc: { branch: [{ if: 'h_knows_aldo', next: 'mq6' }, { next: 'mq' }] },
      mostly: { branch: [{ if: 'h_moth_ate', next: 'mostly2' }, { next: 'eat' }] },
      mostly2: { who: 'mothwife', text: 'You saw. Don\'t make me say it twice. It\'s rude, making a woman say a thing twice.', next: 'trustch' },
      eat: { who: 'narrator', text: 'A jar on her knee has begun to whisper. She tilts her head to it, like a woman listening at a door.', next: 'eat2' },
      eat2: { who: 'mothwife', text: '…Yes, love. I know. All right.', next: 'eat3' },
      eat3: { who: 'narrator', do: ['set:h_moth_ate'],
        text: 'She lifts the lid and takes the flame the way a hen takes a moth. Her throat glows, briefly, a lantern shuttered. The moths in her hair settle.', next: 'eat4' },
      eat4: { who: 'mothwife', text: ['Don\'t look at me like that. It asked.', 'Only the ones who ask. Nineteen years cold in the fern and nobody coming. Some of them ask.'], next: 'eat5' },
      eat5: { who: 'mothwife', text: ['And I\'m hungry. That\'s true as well.', 'Both things are true. Most things are. Ask your armor.'], next: 'trustch' },
      trustch: { who: 'brand', choices: [
        { text: '"I believe you."', if: '!moth_trusted', next: 'trust' },
        { text: '"Let them go."', next: 'letgo' },
        { text: '[Draw Vigil.]', next: 'kill1' },
        { text: 'Say nothing.', next: 'hub' },
      ] },
      trust: { who: 'mothwife', do: ['set:moth_trusted'],
        text: ['…Well.', 'Nobody\'s said that to me since the Wickward. I\'d forgotten what it sounds like. It sounds like a door.'], next: 'trustq' },
      trustq: { branch: [{ if: 'q_mothwife<2', next: 'trustq2' }, { next: 'trust2' }] },
      trustq2: { do: ['quest:mothwife=2'], next: 'trust2' },
      trust2: { branch: [{ if: 'h_knows_aubrenn', next: 'trust2b' }, { next: 'trust2a' }] },
      trust2a: { who: 'mothwife', do: ['set:h_knows_aubrenn'],
        text: ['Here, then. Something for something.', 'The old stag on the barrow. His name is Aubrenn.'], next: 'trust3' },
      trust2b: { who: 'mothwife', text: 'You\'ve his name already. Aubrenn. I can see it sitting on you, like a moth.', next: 'trust3' },
      trust3: { branch: [{ if: 'boss_hart', next: 'trustgift' }, { next: 'trust4' }] },
      trust4: { who: 'mothwife', text: 'Say it to him at the end. He\'ll like that. Or he won\'t. But he\'ll hear it.', next: 'hub' },
      trustgift: { do: ['dialogue:h_moth_gift'] },
      letgo: { who: 'mothwife', text: ['Go where, love? Out into the fern? Nobody says their names.', 'They\'d gutter on the path like the rest. Cold, and then not even cold.'], next: 'letgo2' },
      letgo2: { who: 'mothwife', text: 'You say their names, and I\'ll open every jar I have. …Can you? No. Then they stay where it\'s warm.', next: 'letgoch' },
      letgoch: { who: 'brand', choices: [
        { text: '[Draw Vigil.]', next: 'kill1' },
        { text: 'Let it be.', next: 'hub' },
      ] },

      // ---- Maud's husband, in a jar
      mq: { who: 'mothwife', text: ['Maud. …Maud. Oh, I know the name.', 'A charcoal-burner came to my stall the week they shut the gates. Wanted lungwort for his wife\'s chest.'], next: 'mq2' },
      mq2: { who: 'mothwife', text: 'I told him it never takes. He bought it anyway. Talked about her the whole time. Maud\'s cough. Maud\'s temper. Maud.', next: 'mq3' },
      mq3: { who: 'mothwife', do: ['set:h_knows_aldo'],
        text: 'He came down with the ash, after. He only ever says the one word. I\'ve scratched it on his jar three times, so he knows I\'m listening.', next: 'mq4' },
      mq4: { who: 'brand', text: '…His name is Aldo.', next: 'mq5' },
      mq5: { who: 'mothwife', text: 'Is it? He never said. Only hers.', next: 'mqch' },
      mq6: { who: 'mothwife', text: 'Come about the collier again? He\'s still here. Still saying it.', next: 'mqch' },
      mqch: { who: 'brand', choices: [
        { text: '"Aldo Collier."', if: 'h_maud_name', next: 'ah' },
        { text: 'Not yet.', next: 'jarsch' },
      ] },
      ah: { who: 'brand', text: 'Go home, Aldo Collier. …She kept your supper.', next: 'ah2' },
      ah2: { who: 'narrator', do: ['sfx:snuff', 'set:h_aldo_home', 'hollow:-1'],
        text: 'On the shelf, one jar goes out. Not dark: empty. The glass ticks as it cools.', next: 'ah3' },
      ah3: { who: 'mothwife', text: ['…Oh.', 'Well. There goes the best listener I had.'], next: 'ah4' },
      ah4: { who: 'narrator', text: 'She wipes the jar with her sleeve and puts it at the back, by the roots, with the others that are empty.', next: 'hub' },

      // ---- the Old Hart
      hart: { who: 'mothwife', text: ['The old stag. He kept the barrow, before the ash. In winter he\'d lie down on the new graves so the dead weren\'t cold.', 'Now he eats the ash off them. There\'s less of him every year.'], next: 'hart2' },
      hart2: { branch: [{ if: 'boss_hart', next: 'done' }, { next: 'hartch' }] },
      hartch: { who: 'brand', choices: [
        { text: '"What was his name?"', if: '!h_knows_aubrenn', next: 'hname' },
        { text: '"Why do you want his flame?"', next: 'hwhy' },
        { text: 'Enough.', next: 'hub' },
      ] },
      hname: { who: 'mothwife', text: ['Names aren\'t for everybody who asks. I\'d have to like you first.', '…I don\'t, yet. Don\'t take it hard. I don\'t like most people. I like jars.'], next: 'hartch' },
      hwhy: { who: 'mothwife', text: ['Because you\'ll eat it, or you\'ll leave it hanging in the cold to gutter. I\'ve seen men like you.', 'I\'d put him on the top shelf. He\'d like the height.'], next: 'hartch' },
      done: { branch: [
        { if: 'hart_given', next: 'dGiven' },
        { if: 'hart_named', next: 'dNamed' },
        { if: 'hart_devoured', next: 'dDev' },
        { next: 'dLeft' },
      ] },
      dGiven: { who: 'mothwife', text: 'He\'s on the top shelf. He likes the height. Don\'t tell me he doesn\'t. I know.', next: 'hub' },
      dNamed: { who: 'mothwife', text: 'You said his name. I felt it from here. Every jar in the place sat up.', next: 'hub' },
      dDev: { who: 'mothwife', text: ['You ate him.', '…Well. I\'m not one to talk. I\'ll not forgive it, mind. I\'m not one to talk about that either.'], next: 'hub' },
      dLeft: { who: 'mothwife', text: 'You left him hanging up there in the fog. Still waiting to be called something. So are most of us.', next: 'hub' },

      // ---- her name
      maelis: { who: 'mothwife', text: ['…', 'Who told you that?'], next: 'maelis2' },
      maelis2: { who: 'narrator', text: 'The moths in her hair go still. Every one.', next: 'maelis3' },
      maelis3: { who: 'mothwife', do: ['set:h_moth_maelis'],
        text: ['Oh. You went in the back. I don\'t go in the back.', 'Don\'t say it here. Not yet. I\'ve jars to see to.'], next: 'maelis4' },
      maelis4: { who: 'mothwife', text: 'Say it at the end, with the others. If you\'ve the nerve. …If I have.', next: 'hub' },

      // ---- the sword
      kill1: { who: 'narrator', text: 'You draw Vigil. The moths in her hair lift, and settle, and lift.', next: 'kill2' },
      kill2: { who: 'mothwife', text: ['Ah.', '…Mind the jars, then. They\'ll want somewhere warm to go.'], next: 'killch' },
      killch: { who: 'brand', choices: [
        { text: '[Strike.]', next: 'kill3' },
        { text: 'Sheathe it.', next: 'sheathe' },
      ] },
      sheathe: { who: 'mothwife', text: 'Good. You\'d only have had to sweep up.', next: 'hub' },
      kill3: { who: 'narrator', do: ['kill:self'],
        text: 'She does not lift a hand. She goes to ash the way a moth goes to ash: all at once, and lighter than you thought.', next: 'kill4' },
      kill4: { who: 'narrator', do: ['set:moth_killed', 'sfx:break_wall', 'shake:3'],
        text: 'Then the jars burst. Every one. Glass rains from the roots, and the little flames spill out into the cold, looking for somewhere warm.', next: 'kill5' },
      kill5: { who: 'narrator', do: ['hollow:+3', 'give:moth_lantern', 'give:tag_moth', 'quest:mothwife=99'],
        text: 'In the ash where she sat: a horn lantern full of sleeping moths, and a tin tag on a snapped thread.' },
    };
  }

  D.dialogue.h_moth_first = {
    start: 'a',
    nodes: Object.assign(mothNodes(), {
      a: { who: 'narrator', do: ['set:h_moth_met'],
        text: 'The hollow smells of honey and hot tin. Jars glow on every shelf and root, and in each a small flame turns over in its sleep.', next: 'b' },
      b: { who: 'narrator', text: 'A woman sits among them. Her hair is ash-moths, slowly crawling; her veil is wings. She is breathing on a jar to warm it.', next: 'c' },
      c: { who: 'mothwife', text: ['Shut the— no. There\'s no door. Never mind.', 'Come in, then, and bring your cold in with you. Everyone does.'], next: 'd' },
      d: { who: 'mothwife', text: 'Oh, you\'re a big one. All that fire in you, and not a scrap of it warm.', next: 'e' },
      e: { branch: [{ if: 'boss_hart', next: 'f' }, { next: 'e1' }] },
      e1: { who: 'mothwife', text: ['You\'ve the look of a man come for a stone. The old stag has it, up on the barrow.',
        'When you\'ve done what you\'ll do — his flame. Don\'t eat it. Don\'t leave it in the cold. Bring it to me.'],
        do: ['quest:mothwife=1'], next: 'hub' },
      f: { who: 'mothwife', text: 'You\'ve been up the barrow already. It\'s on you like frost.', do: ['quest:mothwife=3'], next: 'done' },
    }),
  };

  D.dialogue.h_moth = {
    start: 'a',
    nodes: Object.assign(mothNodes(), {
      a: { branch: [{ if: 'moth_trusted', next: 'a1' }, { next: 'a2' }] },
      a1: { who: 'mothwife', text: 'Back. Good. Sit, if you can fold that much iron.', next: 'hub' },
      a2: { who: 'mothwife', text: 'Oh. It\'s the cold one.', next: 'hub' },
    }),
  };

  D.dialogue.h_moth_gift = {
    start: 'a',
    nodes: Object.assign(mothNodes(), {
      a: { who: 'narrator', text: 'She is waiting for you, with her hands folded in her lap as if something were in them.', next: 'b' },
      b: { branch: [
        { if: 'hart_given', next: 'dGiven' },
        { if: 'hart_named', next: 'dNamed' },
        { if: 'hart_devoured', next: 'dDev' },
        { next: 'dLeft' },
      ] },
      dGiven: { who: 'mothwife', text: 'He\'s on the top shelf. He likes the height. Don\'t tell me he doesn\'t. I know.', next: 'g1' },
      dNamed: { who: 'mothwife', text: 'You said his name. I felt it from here. Every jar in the place sat up.', next: 'g1' },
      dDev: { who: 'mothwife', text: ['You ate him.', '…Well. I\'m not one to talk. I promised myself you\'d have these whatever you did. I keep my word. It\'s all I keep that stays put.'], next: 'g1' },
      dLeft: { who: 'mothwife', text: 'You left him up there in the fog, waiting to be called something. Well. You\'ll go back or you won\'t.', next: 'g1' },
      g1: { who: 'mothwife', do: ['give:moth_lantern', 'give:tag_moth', 'set:h_moth_gift', 'quest:mothwife=99'],
        text: ['Here. The lantern. The moths in it are mine; be kind to them, they bruise.', 'And this. Mine as well. It was the woman\'s who was me, before.'], next: 'g2' },
      g2: { who: 'mothwife', text: ['Not here. Say it there, at the fire, with the others.', '…I\'ll know. I\'ll feel it from here.'] },
    }),
  };

  // ================================================================== the barrow
  D.dialogue.h_barrow_approach = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'The trees stop, as if they had agreed to. Beyond them the barrow rises, ringed with standing stones and antler-shrines.', next: 'b' },
      b: { who: 'narrator', text: 'On the mound, a stag bigger than a warhorse is eating ash off the graves. Candles burn in its antlers. Its hide is bark, split to the pale wood.', next: 'c' },
      c: { who: 'narrator', text: 'It raises its head. Every candle leans toward you at once, the way flames lean toward an open door.', next: 'd' },
      d: { branch: [{ if: 'h_knows_aubrenn', next: 'ch' }, { next: 'e' }] },
      ch: { who: 'brand', choices: [
        { text: '"Aubrenn."', next: 'n1' },
        { text: 'Draw Vigil.', next: 'e' },
      ] },
      n1: { who: 'narrator', text: 'The name goes into him like a stone into a well. You wait for it to land. Nothing comes back up. …Not yet.', next: 'e' },
      e: { who: 'brand', text: 'I\'ve come for the stone, old one. …I\'m sorry.' },
    },
  };

  // The choice over the Old Hart's flame, shared by the aftermath and by a later return to the barrow.
  function hartFlameNodes(extra) {
    const x = extra || [];
    return {
      fch: { who: 'brand', choices: [
        { text: '"Aubrenn."', if: 'h_knows_aubrenn', next: 'named' },
        { text: 'Give it to the Moth-Wife.', if: 'q_mothwife>=1 && !moth_killed', next: 'given' },
        { text: 'Devour it.', next: 'dev' },
        { text: x.length ? 'Not yet.' : 'Leave it.', next: 'left' },
      ] },
      named: { who: 'brand', text: 'Go home, Aubrenn. The dark is shorter than it looks.', next: 'named2' },
      named2: { who: 'narrator', do: ['sfx:snuff', 'set:hart_named', 'hollow:-2'].concat(x),
        text: 'The flame stoops, the way a stag stoops to drink. Then it goes up through the fog, and the fog lets it.', next: 'named3' },
      named3: { who: 'narrator', do: ['give:hart_tear'],
        text: 'Where it hung, a drop of amber lies in the grass with a single white hair inside it. Somewhere in the ferns, small hooves.', next: 'mq' },
      given: { who: 'narrator', text: 'You cup the flame in your gauntlets. It weighs less than a moth.', next: 'given2' },
      given2: { who: 'narrator', do: ['set:hart_given', 'set:moth_trusted'].concat(x),
        text: 'And moths come up from the south: a slow grey cloud of them. They settle on the flame until it is all wings, and carry it away.', next: 'given3' },
      given3: { who: 'brand', text: '…Keep him warm, then.', next: 'mq' },
      dev: { who: 'narrator', text: 'You open the cracks in the armor and draw breath. The flame comes to you like a hound called to heel. It trusts you.', next: 'dev2' },
      dev2: { who: 'narrator', do: ['set:hart_devoured', 'hollow:+3', 'give:stolen_ember'].concat(x),
        text: 'Then it is inside, and it is not warm. Your sword-arm is heavier. Somewhere in the fern, something small cries, high, like a fawn.', next: 'mq' },
      left: { branch: [{ if: 'h_hart_left', next: null }, { next: 'left2' }] },
      left2: { who: 'narrator', do: ['set:h_hart_left'],
        text: 'You leave it hanging over him. It does not seem to mind. It has waited longer, for less.', next: 'mq' },
      mq: { branch: [{ if: 'q_mothwife>=1 && q_mothwife<3 && !moth_killed', next: 'mq3' }, { next: null }] },
      mq3: { do: ['quest:mothwife=3'] },
    };
  }

  D.dialogue.h_hart_after = {
    start: 'a',
    nodes: Object.assign(hartFlameNodes(), {
      a: { who: 'narrator', text: 'The Old Hart kneels, as if to drink. Then he folds down onto the barrow and does not get up. The candles in his antlers go out one by one.', next: 'b' },
      b: { who: 'narrator', do: ['give:hart_stone'],
        text: 'Something cold and heavy rolls from the split bark of his chest: the Hart Wardstone. He kept it to the last.', next: 'c' },
      c: { who: 'narrator', text: 'Above him his flame remains: tall, white, patient. It does not rise. It is waiting to be called something.', next: 'fch' },
    }),
  };

  D.dialogue.h_hart_flame = {
    start: 'a',
    nodes: Object.assign(hartFlameNodes(['unset:h_hart_left']), {
      a: { who: 'narrator', text: 'The Old Hart\'s flame still hangs over the barrow, tall and white and patient. The fawns keep it company.', next: 'fch' },
    }),
  };

  D.dialogue.h_barrow_bones = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'boss_hart', next: 'after' }, { next: 'b1' }] },
      b1: { who: 'narrator', text: 'Bones, stacked against the barrow door. Not thrown: laid. The small ones on top, where they would not be crushed.', next: 'b2' },
      b2: { who: 'narrator', text: 'Something has been bringing the dead here one at a time and leaving them at the door. As if someone inside might open it.' },
      after: { who: 'narrator', text: ['Bones, laid against the barrow door, the small ones on top.', 'Nothing will bring any more of them now. You find you want to straighten the pile. You do.'] },
    },
  };
})(window.AV);
