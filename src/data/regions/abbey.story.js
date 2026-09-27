// ASHEN VOW — Lenten Mere: people, words and records of the drowned abbey (builder: ABBEY)
(function (AV) {
  'use strict';
  const D = AV.data;
  const GHOST = '#82a8ad';
  const PALE = '#b9d6d3';

  // ================================================================== records (shared by lecterns and inventory)
  const NOVICE_ROLL = [
    '\'Received through the lower drain, by the charity of Nurse Agna of the Wickward infirmary, these children, in the autumn. Mother forgive us the manner of it.\'',
    '\'Tobias — eleven, of the Wickward. Grey to the shoulder. Three nights in the cold. On the fourth morning he asked for his mother by name. Thanks be.\'',
    '\'Maudie — six. Grey to the throat. Did not wake from the first night. Buried by the east wall. We never learned the rest of her name.\'',
    '\'Davy — nine, of the Wickward. Keeps his tin tag in his fist through the cold and will not give it up. Agna says let him.\'',
    '\'Four more tonight. Agna says she cannot come again. She would not say why. She wept, which she does not.\'',
    '\'Linnet — a child of eight, of the Wickward. The cold took the grey from her face but not her hands. She will not give her old name.\'',
  ];
  const REGISTER = [
    '\'Hollin, Abbot. Rings the great bell himself on feast-days, and will not be told it is beneath him.\'',
    '\'Anselm, Prior, keeper of books. Wystan, keeper of the sluices, who has given the dam-chains names and will tell you them.\'',
    '\'Colm, sacristan. Aelred, master of novices. Osric, porter, who watches the road and is wrong about every rider.\'',
    'Below, in a different ink, a column of small crosses. The hand that made them was not steady.',
  ];
  const COLD_RITE = [
    '\'ON THE COLD. The grey climbs. It begins in the fingers and climbs toward the heart and the head, and when it reaches the head, the name goes.\'',
    '\'In the spring-water of the undercroft, which never warms, the climbing stops. Given nights enough, it turns back.\'',
    '\'It does not leave. It falls back down the arms and settles where the blood is slowest. The hands stay grey. I have seen no exception.\'',
    '\'Therefore let no one fear a grey hand. It is not a sick hand. It is the mark of one who went into the cold and came back with their name.\'',
    '\'The immersion is cruel. Children bear it better than men. I do not know why. I think they are less afraid of forgetting. — A.\'',
  ];
  const SLUICE_LOG = [
    '\'Mere at the fourth mark. Both gates shut and chained at our wheel. Greased the pawls. — W.\'',
    '\'A Chandlers\' runner at dusk, with letters for the Prior. The same boy who took the Prior\'s letter to the city. I knew the fox on his satchel.\'',
    '\'He asked how the dam gates are worked, and could the outer house raise them without our wheel. I said one patient man could.\'',
    '\'Candlemother forgive me. I was proud of it.\'',
    '\'Midnight. Woke to the chains singing. Our wheel is chained at shut, as I left it. The sound is from the outer house on the dam. There is a lantern there.\'',
    '\'Water at the low door. Father Hollin is ringing. I am going to the dormitory stair.\'',
    '\'If this is found: it was not us, and it was not the Mere. It was one man with a lantern and a fox on his satchel. And I told him how.\'',
  ];

  // ================================================================== items
  D.items.tag_bath = {
    name: 'Tin Tag: Davy Tull', kind: 'tag', icon: 'icon_tag',
    desc: 'DAVY TULL — ROW 3, COT 7. A child\'s tag. The cord was cut through once, cleanly, and tied again with a bootlace.',
  };
  D.items.tag_shore = {
    name: 'Tin Tag: Nell Sayer', kind: 'tag', icon: 'icon_tag',
    desc: 'NELL SAYER — ROW 5, COT 14. Washerwoman. Scrubbed bright by someone who scrubbed things for a living, and tied on with a strip of blanket.',
  };
  D.items.lore_a_novice_roll = {
    name: 'Leaves of the Novice Roll', kind: 'lore', icon: 'icon_book',
    desc: 'The autumn pages of Lenten Mere\'s roll of novices, in the Prior\'s hand. The children who came up through the drain.',
    read: NOVICE_ROLL,
  };
  D.items.lore_a_register = {
    name: 'Register of Brothers', kind: 'lore', icon: 'icon_book',
    desc: 'The brothers of Lenten Mere and their offices, kept by someone fond of them.',
    read: REGISTER, onRead: ['set:a_hollin_known', 'set:a_knows_osric'],
  };
  D.items.lore_a_cold_rite = {
    name: 'On the Cold', kind: 'lore', icon: 'icon_scroll',
    desc: 'Prior Anselm\'s pages on the Cold Rite, soft as cloth from being read. They say what a grey hand means.',
    read: COLD_RITE,
  };
  D.items.lore_a_sluice_log = {
    name: 'Pages of the Sluice Log', kind: 'lore', icon: 'icon_note',
    desc: 'The last pages of Brother Wystan\'s sluice log. In the margin of the final entry, small and shaking, someone has drawn a fox.',
    read: SLUICE_LOG, onRead: ['set:knows_sluice'],
  };

  // ================================================================== quest
  D.quests.anselm = {
    title: 'The Letter That Keeps Being Written', kind: 'side',
    stages: {
      1: 'In the drowned scriptorium of Lenten Mere, Prior Anselm is still writing to the Warden of the Seventh Gate. He wants to know if his first letter arrived. If anyone came.',
      99: 'You gave Prior Anselm his answer. The rain still falls on his desk, either way.',
    },
  };

  // ================================================================== speakers
  D.speakers.anselm = { name: 'Brother Anselm', portrait: 'anselm', color: PALE, voice: 0.9 };
  D.speakers.hollin = {
    name: [{ if: 'a_hollin_known', name: 'Abbot Hollin' }, { name: 'The Drowned Abbot' }],
    portrait: 'ghost_monk', color: GHOST, voice: 0.45,
  };
  D.speakers.a_osric = {
    name: [{ if: 'a_knows_osric', name: 'Brother Osric' }, { name: 'Drowned Porter' }],
    portrait: 'ghost_monk', color: GHOST, voice: 0.85,
  };
  D.speakers.a_wife = { name: 'Drowned Woman', portrait: 'ghost_woman', color: GHOST, voice: 1.1 };
  D.speakers.a_brother_bell = { name: 'Drowned Brother', portrait: 'ghost_monk', color: GHOST, voice: 0.8 };
  D.speakers.a_brother_count = { name: 'Drowned Brother', portrait: 'ghost_monk', color: GHOST, voice: 0.95 };
  D.speakers.a_brother_flood = { name: 'Drowned Brother', portrait: 'ghost_monk', color: GHOST, voice: 0.75 };
  D.speakers.a_brother_copy = {
    name: [{ if: 'seen_a_register', name: 'Brother Aelred' }, { name: 'Novice-Master' }],
    portrait: 'ghost_monk', color: GHOST, voice: 0.7,
  };
  D.speakers.a_davy = {
    name: [{ if: 'has:tag_bath', name: 'Davy' }, { name: 'Small Ghost' }],
    portrait: 'ghost_child', color: GHOST, voice: 1.45,
  };

  // ================================================================== npcs
  D.npcs.anselm = {
    name: 'Brother Anselm', sprite: 'npc_anselm', portrait: 'anselm', solid: true, anim: 'idle',
    talk: [
      { if: 'anselm_lie', dialogue: 'a_anselm_content' },
      { if: 'seen_a_anselm_first', dialogue: 'a_anselm_again' },
      { dialogue: 'a_anselm_first' },
    ],
    barks: [
      { if: '!anselm_lie', text: '…stay your hand, Warden…' },
      { if: '!anselm_lie', text: '…no. No. Begin again…' },
      { if: 'anselm_lie', text: '…which saved many…' },
    ],
  };
  D.npcs.a_osric = {
    name: 'Drowned Porter', sprite: 'npc_ghost_monk', portrait: 'ghost_monk', solid: false, anim: 'idle',
    talk: [{ dialogue: 'a_osric' }],
    barks: [{ text: '…a lantern on the road…' }, { text: '…is that the rider?…' }],
  };
  D.npcs.a_wife = {
    name: 'Drowned Woman', sprite: 'npc_ghost_woman', portrait: 'ghost_woman', solid: false, anim: 'idle',
    talk: [{ dialogue: 'a_wife' }],
    barks: [{ text: '…hear it? Under the water…' }, { text: '…leave the cow, Tam…' }],
  };
  D.npcs.a_brother_bell = {
    name: 'Drowned Brother', sprite: 'npc_ghost_monk', portrait: 'ghost_monk', solid: false, anim: 'idle',
    talk: [{ dialogue: 'a_brother_bell' }],
    barks: [{ text: '…why is he ringing?…' }, { text: '…Father, open the door…' }],
  };
  D.npcs.a_brother_count = {
    name: 'Drowned Brother', sprite: 'npc_ghost_monk', portrait: 'ghost_monk', solid: false, anim: 'idle',
    talk: [{ dialogue: 'a_brother_count' }],
    barks: [{ text: '…ten… eleven… twelve…' }, { text: '…count them again…' }],
  };
  D.npcs.a_brother_flood = {
    name: 'Drowned Brother', sprite: 'npc_ghost_monk', portrait: 'ghost_monk', solid: false, anim: 'idle',
    talk: [{ dialogue: 'a_brother_flood' }],
    barks: [{ text: '…get the cots up…' }, { text: '…it\'s on the stair…' }],
  };
  D.npcs.a_brother_copy = {
    name: 'Novice-Master', sprite: 'npc_ghost_monk', portrait: 'ghost_monk', solid: false, anim: 'idle',
    talk: [{ dialogue: 'a_brother_copy' }],
    barks: [{ text: '…slowly, child. Slowly…' }, { text: '…received through the lower drain…' }],
  };
  D.npcs.a_davy = {
    name: 'Small Ghost', sprite: 'npc_ghost_child', portrait: 'ghost_child', solid: false, anim: 'idle',
    talk: [{ dialogue: 'a_davy' }],
    barks: [{ text: '…forty-one… forty-two…' }, { text: '…Sister says a hundred…' }],
  };

  // ================================================================== small helpers for the lecterns
  // A lectern reads its record page by page, then hands over a copy the first time.
  function lectern(intro, pages, itemId, takeLine, extra) {
    const nodes = {};
    const ids = pages.map((_, i) => 'p' + i);
    nodes.a = { who: 'narrator', text: intro, next: ids[0], do: extra && extra.introDo };
    pages.forEach((p, i) => {
      nodes[ids[i]] = { who: 'narrator', text: p, next: i + 1 < pages.length ? ids[i + 1] : 'after' };
    });
    nodes.after = { branch: (extra && extra.after) || [{ next: 'take' }] };
    if (extra && extra.nodes) Object.assign(nodes, extra.nodes);
    nodes.take = { branch: [{ if: '!has:' + itemId, next: 'give' }, { next: null }] };
    nodes.give = { who: 'narrator', text: takeLine, do: ['give:' + itemId].concat((extra && extra.giveDo) || []) };
    return { start: 'a', nodes };
  }

  // ================================================================== arrival
  D.dialogue.a_mere_first = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'The road runs down into the water and does not stop.', next: 'b' },
      b: { who: 'narrator', text: 'Under the grey skin of the mere lies a village: roof-ridges, a lane, the top of a churchyard wall. A spire stands out of the lake like a finger raised for quiet.', next: 'c' },
      c: { who: 'narrator', text: 'Far out along a causeway, the abbey. Half of it stands in the lake up to its windows.', next: 'd' },
      d: { who: 'brand', text: ['…There was a fair here, at Lent. A mere the size of a duck-pond, and meadows, and a goose-race.', 'Odo lost a month\'s pay on a goose.'], next: 'e' },
      e: { who: 'narrator', text: 'Somewhere under your feet, very deep, a bell rings once.', do: ['sfx:bell'] },
    },
  };

  D.dialogue.a_cloister_first = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'The cloister garth has become a pond. Dead herbs stand in it up to their necks, and the Candlemother stands in the middle with her hands full of rain.' },
    },
  };

  // ================================================================== Brother Osric, the porter
  D.dialogue.a_osric = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'A drowned monk stands at the head of the causeway, holding a lantern up to the road. The lantern is full of water.', next: 'b' },
      b: { who: 'a_osric', text: ['Is that the rider? From the city? …No. You\'re walking. The rider will have a horse. The Warden\'s riders always have horses.', 'The Prior\'s waiting on an answer. I\'m to watch the road and run and tell him. I\'m good at watching. I\'m always wrong about riders, but I\'m good at watching.'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: '"Osric."', if: 'a_knows_osric', next: 'r1' },
        { text: '"An answer to what?"', next: 'e' },
        { text: '"No rider is coming."', next: 'f' },
        { text: 'Leave.', next: null },
      ] },
      e: { who: 'a_osric', text: ['To the Prior\'s letter. It went to the Warden of the Seventh Gate with a Chandlers\' runner. Fox on his satchel. Quick lad. Didn\'t stop for soup.', 'That was the autumn. It\'s— what is it now? It\'s still autumn, isn\'t it. It\'s always nearly autumn.'], next: 'c' },
      f: { who: 'a_osric', text: ['…', 'Then I\'ll watch a little longer. In case.'] },
      r1: { who: 'brand', text: 'Osric. Porter of Lenten Mere.', next: 'r2' },
      r2: { who: 'a_osric', text: ['…Osric. Yes. I had a name, didn\'t I. I had a little room by the gate with a stool in it.', 'You tell the Prior, then. That nobody\'s coming. He\'d rather hear it from someone with a horse, but—', 'I\'m so tired of being wrong about riders.'], next: 'r3' },
      r3: { who: 'brand', text: 'Go home, Osric. The dark is shorter than it looks.', next: 'r4' },
      r4: { who: 'narrator', text: 'He lowers the lantern at last.', do: ['set:a_osric_rest', 'hollow:-1', 'snuff:self'] },
    },
  };

  // ================================================================== the drowned woman on the shore
  D.dialogue.a_wife = {
    start: 'a',
    nodes: {
      a: { who: 'a_wife', text: ['Hear it? Under the water. The church bell still goes when the wind\'s from the north. Tam says it\'s the current. Tam says a lot of things.', 'He went back for the cow. I said leave the cow, Tam. I said it twice.'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: '"Where is Tam now?"', next: 't' },
        { text: '"How did the water come?"', next: 'w' },
        { text: '"Someone opened the sluices. On purpose."', if: 'knows_sluice', next: 'k' },
        { text: 'Leave.', next: null },
      ] },
      t: { who: 'a_wife', text: ['Still gone for it, I suppose. It was a good cow.', '…It was a very good cow.'], next: 'c' },
      w: { who: 'a_wife', text: ['Quiet. That\'s what nobody tells you. You\'d think a flood would roar. It came up the lane like a cat and it was in the hearth before the dog barked.', 'There was a Chandlers\' lad through at dusk, wet to the knee. I gave him broth. He asked did the brothers keep boats.', 'Why would he want to know that?'], next: 'c' },
      k: { who: 'a_wife', text: ['…On purpose.', 'Who\'d do that to a cow?'], next: 'k2' },
      k2: { who: 'narrator', text: 'She laughs once, the way people do when the other thing is worse. Then she turns back to the water and listens for the bell.' },
    },
  };

  // ================================================================== the brothers
  D.dialogue.a_brother_bell = {
    start: 'a',
    nodes: {
      a: { who: 'a_brother_bell', text: 'Father Hollin\'s ringing. Listen. It isn\'t Vigil, it isn\'t Compline, it isn\'t anything. Why is he ringing?', do: ['set:a_hollin_known'], next: 'b' },
      b: { who: 'brand', choices: [
        { text: '"He\'s warning you. The water."', next: 'w' },
        { text: '"Why is the tower door locked?"', next: 'k' },
        { text: 'Leave.', next: null },
      ] },
      w: { who: 'a_brother_bell', text: ['The water. …Yes. It\'s in the garth. It\'s over the herbs.', 'Father, open the door. Father. It\'s up to the ropes in there.'] },
      k: { who: 'a_brother_bell', text: ['He barred it. I heard the bolt go. He said nobody\'s to follow him in, and he gave the key to Colm.', 'Colm\'s gone down for the sick. They\'re in the cold baths and they can\'t walk. Colm went down.'], next: 'b' },
    },
  };

  D.dialogue.a_brother_count = {
    start: 'a',
    nodes: {
      a: { who: 'a_brother_count', text: ['…ten, eleven, twelve. Twelve. Brother, I make it twelve, there\'s thirteen on the roll—', 'Davy. Davy\'s in the cold tonight. Colm\'s gone down for him. Twelve, then. Twelve and Davy.', 'Up. Up, all of you, to the high dormitory. Don\'t run on the stair. Don\'t— no. Run. Run.'], next: 'b' },
      b: { who: 'brand', choices: [
        { text: '"Whose children are they?"', next: 'w' },
        { text: '"Did they get out?"', next: 'g' },
        { text: 'Leave.', next: null },
      ] },
      w: { who: 'a_brother_count', text: ['The Wickward\'s. Agna brought them up through the lower drain. Nobody\'s to know. Not the Chandlers, not the city. They count, in the city. They count everything.', 'Count them again.'], next: 'b' },
      g: { who: 'a_brother_count', text: ['Out? There isn\'t an out. There\'s up. Up is what we have.', 'Count them again. …One. Two.'] },
    },
  };

  D.dialogue.a_brother_flood = {
    start: 'a',
    nodes: {
      a: { who: 'a_brother_flood', text: ['It\'s on the stair. It\'s coming down the— no. Up. It\'s coming up.', 'Get the cots up! Colm, leave the big ones, take the ones you can carry— Colm!', '…It\'s so cold. It was always cold down here. That was the point of it.'] },
    },
  };

  D.dialogue.a_brother_copy = {
    start: 'a',
    nodes: {
      a: { who: 'a_brother_copy', text: ['\'…received through the lower drain, by the charity of—\' Slowly. Slowly, child. Letters are a kind of prayer. You don\'t gabble a prayer.', 'Your hand\'s shaking. Grey hands shake; it\'s the cold still in them. It passes. Hold the pen like a bird, not like a knife.'], next: 'b' },
      b: { who: 'brand', choices: [
        { text: '"Who are you teaching?"', next: 't' },
        { text: '"Why are their hands grey?"', next: 'g' },
        { text: 'Leave.', next: null },
      ] },
      t: { who: 'a_brother_copy', text: ['The new ones. From the drain. One of them won\'t give her old name, so the sisters have found her another.', 'A small brown bird that sings in the gorse. I told her it was a good name for a girl who never stops talking.'], next: 'b' },
      g: { who: 'a_brother_copy', text: ['The cold. The Prior\'s cold. It chases the grey back down out of the head, where the names are kept, and it pools in the hands and stays.', 'A grey hand isn\'t a sick hand, child. It\'s a hand that came back. Don\'t let anyone tell you different.'], next: 'b' },
    },
  };

  // ================================================================== Davy, in the cold bath
  D.dialogue.a_davy = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'a_davy_seen', next: 'b' }, { next: 'a0' }] },
      a0: { who: 'narrator', text: 'A small ghost sits in the cold bath with the water to his chin, hugging his knees. His hands are grey. The rest of him is the colour of the water.', do: ['set:a_davy_seen'], next: 'b' },
      b: { who: 'a_davy', text: ['…fifty-six, fifty-seven… Sister says count to a hundred and then you can come out. I keep losing my place.', 'Brother Colm\'s coming. He said. He said count, and I\'d hear him on the stair.'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: '"Davy Tull."', if: 'has:tag_bath', next: 'r1' },
        { text: '"Keep counting."', next: 'k' },
        { text: 'Leave.', next: null },
      ] },
      k: { who: 'a_davy', text: '…fifty-eight. Fifty-nine. Fifty… fifty-something.' },
      r1: { who: 'brand', text: 'Davy Tull. Row three, cot seven.', next: 'r2' },
      r2: { who: 'a_davy', text: ['…That\'s on my tag. I kept it. Nurse Agna said I could, so long as I didn\'t tell.', 'Is it a hundred yet?'], next: 'r3' },
      r3: { who: 'brand', choices: [
        { text: '"It\'s a hundred. You can come out."', next: 'r4' },
        { text: '…', next: 'r6' },
      ] },
      r4: { who: 'a_davy', text: 'Oh. Good. It\'s ever so cold.', next: 'r5' },
      r5: { who: 'brand', text: 'Go home, Davy Tull. The dark is shorter than it looks.', do: ['set:a_davy_rest', 'hollow:-1', 'snuff:self'] },
      r6: { who: 'a_davy', text: '…Sixty. Sixty-one.' },
    },
  };

  // ================================================================== Prior Anselm
  // The question at the heart of it, shared by the first meeting and every return.
  function anselmQuestion() {
    return {
      q: { who: 'brand', choices: [
        { text: '"It reached him. He burned it unread."', next: 't1' },
        { text: '"It reached him. It saved many."', next: 'l1', lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]' },
        { text: '"I can\'t say."', next: 'e1' },
      ] },
      // -- the truth
      t1: { who: 'anselm', text: '…Unread.', next: 't2' },
      t2: { who: 'narrator', text: 'The pen stops. For the first time, the water on the page lies still.', next: 't3' },
      t3: { who: 'anselm', text: ['But the seal. He\'d have known the seal. He\'d have known it was us, that we meant to ask him to—', 'Is that why? Because he knew what it would ask?'], next: 't4' },
      t4: { who: 'brand', choices: [
        { text: '"Yes. He knew what it would ask."', next: 't5' },
        { text: '"I am the Warden."', next: 'c1' },
        { text: '…', next: 't5' },
      ] },
      t5: { who: 'anselm', text: ['…Then there was nothing wrong with the letter.', 'Nineteen years. There was nothing wrong with the letter.'], next: 't6' },
      t6: { who: 'anselm', text: 'I think I should like to stop now. Would you say the words? The Chandlers\' words. My mother called me Anselm Fairweather. No one has said it in fifty years.', next: 'rite' },
      c1: { who: 'brand', text: ['I am the Warden.', '…I saw the abbey seal. I knew what it would ask me. I put it in the brazier.'], do: ['set:brand_named', 'set:a_anselm_confessed'], next: 'c2' },
      c2: { who: 'narrator', text: 'For a long moment there is only the rain, and the water moving in the room.', next: 'c3' },
      c3: { who: 'anselm', text: ['…You came, then.', 'Late. But you came. I always said the roads were slow.'], next: 'c4' },
      c4: { who: 'anselm', text: ['There was a line in it meant for you alone. I kept it in every copy. Read it, or don\'t. I\'ve no more say in it.', 'I think I should like to stop now. Would you say the words for me? Anselm Fairweather. My mother\'s name for me. No one has said it in fifty years.'], next: 'rite' },
      rite: { who: 'brand', text: 'Go home, Anselm Fairweather. The dark is shorter than it looks.', next: 'rite2' },
      rite2: { who: 'narrator', text: 'He signs the letter. He blots it, carefully, though there is nothing to blot. Then he is only a candle-flame above a wet desk.', do: ['set:anselm_truth', 'hollow:-1', 'quest:anselm=99'], next: 'rite3' },
      rite3: { who: 'narrator', text: 'Then not even that.', do: ['snuff:self'] },
      // -- the kind lie
      l1: { who: 'anselm', text: '…Many.', next: 'l2' },
      l2: { who: 'narrator', text: 'Something in his shoulders lets go, as if a hand has been lifted off them.', next: 'l3' },
      l3: { who: 'anselm', text: ['Many. Oh— thank the Mother. Then it was worth the ink.', 'Then I must write again, to thank him. That one will be harder. Thanks are harder than pleas, have you noticed? Everyone knows how to beg.', 'Go on, go on. I\'ve work.'], do: ['set:anselm_lie', 'quest:anselm=99'], next: 'l4' },
      l4: { who: 'narrator', text: 'He bends to a fresh page. The water takes the words as fast as he makes them. He does not seem to mind.' },
      // -- no answer
      e1: { who: 'anselm', text: ['No. No, of course— how would you. Forgive me.', 'Then I\'ll keep at it. Come back when you\'ve been to the Gate, and tell me. I\'ll have a better one ready by then.'] },
    };
  }

  D.dialogue.a_anselm_first = {
    start: 'a',
    nodes: Object.assign({
      a: { who: 'narrator', text: 'A monk sits at a slanted desk with the mere up to his knees, writing. His pen is dry. The words come anyway, pale, and the water lifts them off the page.', next: 'b' },
      b: { who: 'anselm', text: ['\'…and so I beg you, Warden, stay your hand one month, one week—\' No. No, begging makes him stubborn. Everyone says so. Begin again.', 'Oh— forgive me. The novices knock, as a rule. Is it still raining? It\'s always raining when I look up.'], next: 'd' },
      d: { who: 'brand', choices: [
        { text: '"What are you writing?"', next: 'w1' },
        { text: '"Who are you?"', if: '!a_met_anselm', next: 'f1' },
        { text: '"You\'re sitting in water."', if: '!a_anselm_water', next: 'g1' },
        { text: 'Leave.', next: 'bye' },
      ] },
      f1: { who: 'anselm', text: ['Anselm. Prior of Lenten Mere, for my sins, which are mostly pride of handwriting.', 'Abbot Hollin keeps the bell and the brothers. I keep the books. And the cold, lately. The cold is… the cold is working.'], do: ['set:a_met_anselm', 'set:a_hollin_known'], next: 'd' },
      g1: { who: 'anselm', text: ['Am I? …So I am. The sluices must be weeping again. Brother Wystan will fret.', 'No matter. The letter\'s the thing.'], do: ['set:a_anselm_water'], next: 'w1' },
      w1: { who: 'anselm', text: ['A letter to the Warden of the Seventh Gate. They mean to burn the Wickward. You\'ll have heard. Everyone\'s heard.', 'I\'m asking him to wait. Only to wait. To send the sick to us instead, to the cold. We have beds. We have a great deal of cold.'], next: 'w3' },
      w3: { who: 'anselm', text: ['I sent the first in the autumn, by a Chandlers\' runner. An earnest boy, fox on his satchel. He swore he\'d put it in the Warden\'s own hand.', 'No one came. No answer. So I thought— perhaps it was badly put. Too long. Too proud. I\'ve been improving it.', 'I\'ve been improving it for some time.'], next: 'w5' },
      w5: { who: 'anselm', text: 'You\'ve the look of a man who knows the city road. Here— the best copy. If you pass the Seventh Gate, put it in his hand.', do: ['give:anselm_letter', 'quest:anselm=1'], next: 'w6' },
      w6: { who: 'narrator', text: 'He presses a page on you. It is wet through. The hand is careful, and every word has held.', next: 'w7' },
      w7: { who: 'anselm', text: 'But you\'ve come from that way. Tell me. Did the first one reach him? Did the Warden come?', next: 'q' },
      bye: { who: 'anselm', text: 'Of course. You\'ve things to do. Mind the third step, it\'s— well. It\'s under the water now, I suppose.' },
    }, anselmQuestion()),
  };

  D.dialogue.a_anselm_again = {
    start: 'a',
    nodes: Object.assign({
      a: { branch: [{ if: '!has:anselm_letter', next: 'g0' }, { next: 'g1' }] },
      g0: { who: 'anselm', text: ['\'…stay your hand, Warden, a little while—\' Oh. It\'s you. You\'ll want a copy for the road. Here. The best one.'], do: ['give:anselm_letter', 'quest:anselm=1'], next: 'g2' },
      g1: { who: 'anselm', text: '\'…stay your hand, Warden, a little while—\' Oh. It\'s you.', next: 'g2' },
      g2: { who: 'anselm', text: 'Have you been to the Gate? Did the first letter reach him? Did he come?', next: 'q' },
    }, anselmQuestion()),
  };

  D.dialogue.a_anselm_content = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'a_anselm_content1', next: 'm' }, { next: 'f' }] },
      f: { who: 'anselm', text: ['\'…and I thank you, Warden, for your mercy, which saved—\' How many did you say? Many. \'…which saved many.\'', 'It\'s nearly right. It\'s very nearly right.'], do: ['set:a_anselm_content1'] },
      m: { who: 'anselm', text: ['\'…which saved many, whose names I enclose—\' Oh. But I haven\'t their names. You never said their names.', 'No matter. I\'ll leave a space. I\'ll leave a great deal of space.'] },
    },
  };

  // ================================================================== lecterns
  D.dialogue.a_novice_roll = lectern(
    'A roll of novices lies open on the lectern, its pages swollen with damp. The newest entries are in the Prior\'s hand.',
    NOVICE_ROLL, 'lore_a_novice_roll',
    'You lift the loose autumn leaves from the roll and keep them. The rest of the book stays where it is.',
    {
      after: [{ if: 'linnet_named', next: 'brand' }, { next: 'take' }],
      nodes: { brand: { who: 'brand', text: '…Linnet.', next: 'take' } },
    });

  D.dialogue.a_register = lectern(
    'The abbey\'s register of brothers, each man\'s office in the margin. Someone kept it in a neat, fussy hand, with small jokes in it.',
    REGISTER, 'lore_a_register',
    'You take the register. The brothers come with you, office by office, jokes and all.',
    { introDo: ['set:a_hollin_known', 'set:a_knows_osric'] });

  D.dialogue.a_cold_rite = lectern(
    'Pinned under a stone on the lectern by the baths, pages in the Prior\'s hand. They have been read so often the corners have gone soft as cloth.',
    COLD_RITE, 'lore_a_cold_rite',
    'You take the pages. The stone that held them down is so cold it burns.');

  D.dialogue.a_sluice_log = lectern(
    'A ledger lies open on the keeper\'s desk, fat with damp. The last pages are in a hand that starts out neat and stops being neat.',
    SLUICE_LOG, 'lore_a_sluice_log',
    'You tear the last pages free and keep them. Someone should.',
    {
      after: [{ next: 'fox' }],
      nodes: { fox: { who: 'narrator', text: 'In the margin beside the last entry, small and shaking, someone has drawn a fox.', do: ['set:knows_sluice'], next: 'take' } },
    });

  // ================================================================== the belfry
  D.dialogue.a_belfry_lintel = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'Cut into the lintel over the tower door: THE BELL IS CALLED MERCY. RING HER FOR THE DEAD, OR FOR THE LIVING IN DANGER, AND FOR NOTHING ELSE.', next: 'b' },
      b: { who: 'narrator', text: 'And under it, smaller and newer: BY ORDER OF HOLLIN, ABBOT, WHO WILL RING HER HIMSELF, THANK YOU.', do: ['set:a_hollin_known'] },
    },
  };

  D.dialogue.a_belfry_enter = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'The ringing chamber is flooded to the shin. The bell-ropes hang slack into the water. High above, the bell-frame is empty.', next: 'b' },
      b: { who: 'narrator', text: 'The ringing is coming from the water. It has been ringing since you reached the shore. You only now notice you have been hearing it.' },
    },
  };

  D.dialogue.a_hollin_after = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'The bell in his ribs splits from lip to crown. For the first time in nineteen years, the tower is quiet.', next: 'b' },
      b: { who: 'narrator', text: 'Almost quiet. Where the abbot sank, a flame hangs over the water, still ringing: a small, tinny sound, like a spoon against a cup.', next: 'c' },
      c: { who: 'hollin', text: '…are they up… Colm… are they all up the stair…', next: 'd' },
      d: { who: 'brand', choices: [
        { text: '"Hollin."', if: 'a_hollin_known', next: 'n1' },
        { text: 'Draw the flame into the armor.', next: 'v1' },
        { text: 'Leave it ringing.', next: 'l1' },
      ] },
      n1: { who: 'brand', text: 'Hollin. Abbot of Lenten Mere. …You rang. They heard you.', next: 'n2' },
      n2: { who: 'hollin', text: '…heard…', next: 'n3' },
      n3: { who: 'brand', text: 'Go home, Hollin. The dark is shorter than it looks.', next: 'n4' },
      n4: { who: 'narrator', text: 'The ringing slows, and stops between one stroke and the next, the way a man stops when someone has finally told him he may.', do: ['set:hollin_named', 'hollow:-2'], next: 'n5' },
      n5: { who: 'narrator', text: 'Where it hung, a curl of bronze from the bell\'s lip floats on the water, which bronze should not do. It is warm in your hand.', do: ['give:bell_shard'], next: 'stone' },
      v1: { who: 'narrator', text: 'You open the cracked pauldron, and the flame goes in ringing.', next: 'v2' },
      v2: { who: 'narrator', text: 'It rings inside you for a long time. Then it stops. Your sword-arm is heavier, and surer, and something in you keeps asking about a stair.', do: ['set:hollin_devoured', 'hollow:+3', 'give:stolen_ember'], next: 'stone' },
      l1: { who: 'narrator', text: 'You leave him to his warning. The small bell goes on over the water, telling a drowned abbey to wake.', do: ['set:a_hollin_left'], next: 'stone' },
      stone: { who: 'narrator', text: 'In the split bronze, where his heart was, sits a grey stone the size of a fist, cut with the sign of a bell. The Bell Wardstone.', do: ['give:bell_stone'] },
    },
  };

  D.dialogue.a_hollin_flame = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'Over the water, the abbot\'s small flame is still ringing. …are they up… are they all up…', next: 'b' },
      b: { who: 'brand', choices: [
        { text: '"Hollin."', if: 'a_hollin_known', next: 'n1' },
        { text: 'Leave it ringing.', next: null },
      ] },
      n1: { who: 'brand', text: ['Hollin. Abbot of Lenten Mere. They heard you.', 'Go home. The dark is shorter than it looks.'], next: 'n2' },
      n2: { who: 'narrator', text: 'The ringing stops between one stroke and the next. On the water, where it hung, floats a curl of warm bronze.', do: ['set:hollin_named', 'unset:a_hollin_left', 'hollow:-2', 'give:bell_shard'] },
    },
  };
})(window.AV);
