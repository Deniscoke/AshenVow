// ASHEN VOW — Hallowhearth, the Upper City: people, words and records (builder: CITY, upper half).
// Queen Ysolde, the hound on Tallow Lane, the Seventh Gate, the house the hound kept.
// Hesk's barks (hesk_bark_*, hesk_wickward, hesk_gate, hesk_after) and Fenwick's fenwick_city are CAST's.
(function (AV) {
  'use strict';
  const D = AV.data;
  const PALE = '#b9d6d3';

  // ================================================================== items
  D.items.tag_tallow = {
    name: 'Tin Tag: Jennet Pike', kind: 'tag', icon: 'icon_tag',
    desc: 'JENNET PIKE — ROW 7, COT 9. Stamped and never worn; the cord is still in its shop coil. The Chandlers brought it to her door. The dog would not let them up the step.',
  };
  D.items.lore_c_kings_order = {
    name: 'The King\'s Order', kind: 'lore', icon: 'icon_scroll',
    desc: 'A royal order on heavy parchment. The seal is Aldemar\'s. The words are not.',
    read: [
      'BY THE KING. Whereas the Greying has passed the Wickward wall and is found within our own house; and whereas every day of delay is paid for by the living;',
      'It is ORDERED that the Wickward be sealed at the Last Vigil, and given to the fire, and the fire blessed, that the grey climb no further.',
      'The Warden of the Seventh Gate, having offered his own hand to the torch, shall see it done, so that no lesser man need carry it.',
      'Signed: ALDEMAR, R. Witnessed: ORMUND, Archchandler of the Wick.',
      'Below, a space left for a third name. A pen has been pressed into it hard enough to tear the parchment. Nothing was written.',
    ],
  };
  D.items.lore_c_bird_drawing = {
    name: 'A Child\'s Drawing', kind: 'lore', icon: 'icon_note',
    desc: 'A bird in candle-soot, drawn by someone small. It is mostly feet.',
    read: [
      'A bird, mostly feet. Under it, in careful capitals: THIS IS A CROW. HE COMES TO THE SILL. GRIP DOES NOT LIKE HIM.',
      'It is drawn on the back of a writ. On the other side: BY ORDER OF THE ARCHCHANDLERY. The child JENNET PIKE, being found grey,',
      '…is to be brought to the Wickward gate by the ninth bell, with a blanket and a cup.',
      'The paper was folded very small before anyone drew on it. As if somebody did not want to see that side of it again.',
    ],
  };
  D.items.lore_c_pike_note = {
    name: 'Ned\'s Letter', kind: 'lore', icon: 'icon_note',
    desc: 'Two notes on one scrap, in a child\'s hand, addressed to DA. The second is smaller than the first.',
    read: [
      'DA. We kept the door shut like you said. Grip is good. A Chandler came with a paper for Jen and Grip would not let him up the step.',
      'Jen says sorry she drew on the paper. Her hands are a bit grey but she says it is the soot. We are being good. When are you home. — NED',
      'Below, later, smaller: The sky is all ash now. Nobody comes down the lane. Grip brings us things. Jen sleeps a lot.',
      'Come home.',
    ],
  };

  // ================================================================== quest
  D.quests.hound = {
    title: 'What Guards the House on Tallow Lane', kind: 'side',
    stages: {
      1: 'A great ash-hound lies across a doorstep on Tallow Lane and lets no one near. It was somebody\'s dog, once.',
      2: 'The hound heard a whistle it knew and let you by. The house on Tallow Lane is open.',
      3: 'The hound is ash. The house on Tallow Lane is open. Nothing is keeping it now.',
      99: 'You found what the hound was keeping.',
    },
  };

  // ================================================================== speakers & npcs
  D.speakers.queen = { name: 'Queen Ysolde', portrait: 'queen', color: PALE, voice: 0.95 };
  D.speakers.hound = { name: 'The Hound', portrait: null, color: '#857c86', voice: 0.45 };

  D.npcs.queen = {
    name: 'Queen Ysolde', sprite: 'npc_queen', portrait: 'queen', solid: true, anim: 'idle',
    talk: [
      { if: 'c_queen_done', dialogue: 'c_queen_again' },
      { dialogue: 'c_queen' },
    ],
    barks: [
      { text: '…mind the benches…' },
      { text: '…forty places. Forty…' },
      { text: '…the carts come at dusk…' },
      { if: 'queen_forgave', text: '…Emeric. The spoons…' },
    ],
  };

  D.npcs.hound = {
    name: 'The Hound', sprite: 'enemy_hound_big', solid: true, anim: 'growl',
    talk: [
      { if: 'hound_calmed', dialogue: 'c_hound_calm' },
      { dialogue: 'c_hound' },
    ],
    barks: [
      { if: '!hound_calmed', text: '(a growl, low as a cart on cobbles)' },
      { if: 'hound_calmed', text: '(it watches the end of the lane)' },
    ],
  };

  // ================================================================== the road and the gate
  D.dialogue.c_gate_first = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'The Seventh Gate. Nineteen years of ash have banked against it like snow against a door.', next: 'b' },
      b: { who: 'narrator', text: 'High on the lintel, three sockets: a stag, a bell, a shield.', next: 'c' },
      c: { who: 'brand', text: ['…I kept this gate.', 'I knew every hinge on it by its voice. I knew which of the watch slept at their posts. I let them.'], next: 'd' },
      d: { branch: [{ if: 'has:hart_stone && has:bell_stone && has:shield_stone', next: 'e' }, { next: 'f' }] },
      e: { who: 'narrator', text: 'The Wardstones have gone heavy in your pack. Heavier than stones ought to be.' },
      f: { who: 'narrator', text: 'The doors do not so much as creak. The Queen shut them, and they are still listening to her.' },
    },
  };

  D.dialogue.c_dragmark = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'A long hollow in the ash, the length of a tall man, half filled in by the wind.', next: 'b' },
      b: { who: 'narrator', text: 'Two furrows lead away from it, south, down the whole length of the road. Someone small dragged something heavy a very long way.', next: 'c' },
      c: { who: 'brand', text: '…She never said.', next: 'd' },
      d: { branch: [{ if: 'deaths>=3', next: 'e' }, { next: null }] },
      e: { who: 'brand', text: 'She has swept me off her floor since. More than once. She has never once said.' },
    },
  };

  // ================================================================== the Upper City
  D.dialogue.c_city_first = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'Hallowhearth. The houses stand tall and narrow and every window is dark.', next: 'b' },
      b: { who: 'narrator', text: 'Down to the east, beyond the rooftops, the sky over the Wickward is the colour of the inside of a forge.' },
    },
  };

  D.dialogue.c_statue = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'A knight in bronze, shield raised. On the plinth: THE SHIELD OF GREYHARROW. The face under the helm is young and very sure of itself.', next: 'b' },
      b: { who: 'narrator', text: 'Someone has cut a word into the plinth below it with a chisel, deep and slow, over what must have been a long time: KINDLER.', next: 'c' },
      c: { who: 'brand', choices: [
        { text: '"…They got the nose wrong."', next: 'd' },
        { text: '"That one is right."', next: 'e' },
        { text: 'Say nothing.', next: null },
      ] },
      d: { who: 'brand', text: 'Odo always said so. He said they\'d given me a better one than my mother did.' },
      e: { who: 'narrator', text: 'You look at it a long while. Nobody has chiselled anything over the name. They did not need to.' },
    },
  };

  // ================================================================== the palace
  D.dialogue.c_palace_first = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'Every candle in the throne room is lit.', next: 'b' },
      b: { who: 'narrator', text: 'Somebody has been lighting them. For a long time, by the wax.' },
    },
  };

  // The Queen. Distant, then lucid in flashes. Always ends with the Wickward key.
  // c_qs counts the honest and the kind; c_q_hard marks a man who would do it again.
  D.dialogue.c_queen = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'A woman in a faded crown moves along the tables, setting down spoons, straightening what is already straight.', next: 'b' },
      b: { who: 'queen', text: ['Mind the benches. They\'re low. They\'re for small people.', 'The carts come at dusk. Aldemar has promised. …He has promised twice now.'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: '"Majesty."', next: 'c1' },
        { text: '"Who is the table for?"', next: 'c2' },
        { text: 'Leave her to it.', next: null },
      ] },
      c1: { who: 'queen', text: 'Is it dusk? It can\'t be dusk. The cups aren\'t out.', next: 'd' },
      c2: { who: 'queen', text: 'The Wickward children. The abbey has beds and the hills have air, and I have a table. It will do. It has to.', next: 'd' },
      d: { who: 'narrator', text: 'She comes to the end of the table where you stand, and looks up at the helm.', next: 'e' },
      e: { who: 'narrator', text: 'For a moment she is entirely there. The cold comes in at the edges of the room, the way it does when a door opens onto winter.', do: ['sfx:whisper'], next: 'f' },
      f: { who: 'queen', text: '…Warden.', do: ['set:brand_named'], next: 'g' },
      g: { who: 'queen', text: 'Emeric Brand. You have your helm on at my table.', next: 'h' },
      h: { who: 'brand', choices: [
        { text: '"Forgive me, Majesty."', next: 'h1' },
        { text: '"You remember me."', next: 'h2' },
        { text: 'Say nothing.', next: 'h3' },
      ] },
      h1: { who: 'queen', text: 'Not yet. Stand there. You stood, at the council. You can stand now.', next: 'k' },
      h2: { who: 'queen', text: 'There were four of us at that council. I am the only one who still comes to the table.', next: 'k' },
      h3: { who: 'queen', text: 'Still a wall. You were always a wall, Emeric. Until the one night you opened your mouth.', next: 'k' },
      k: { who: 'queen', text: 'They call it the King\'s order. Aldemar signed what was put in front of him. He always did.', next: 'l' },
      l: { branch: [{ if: 'knows_proposal', next: 'l2' }, { next: 'l1' }] },
      l1: { who: 'queen', text: 'I know who put it there.', next: 'm' },
      l2: { who: 'queen', text: 'You know who put it there. I can see that you know. I only want to hear whether you will say it.', next: 'm' },
      m: { who: 'brand', choices: [
        { text: '"I did."', next: 'm1', do: ['add:c_qs=1'] },
        { text: '"The King signed it."', next: 'm2' },
        { text: '"It was necessary."', next: 'm3', do: ['set:c_q_hard'] },
        { text: '…', next: 'm4' },
      ] },
      m1: { who: 'queen', text: 'Yes. You did. Nineteen years, and you are the first to say it in this room.', next: 'n1' },
      m2: { who: 'queen', text: 'He signed it. You wrote it. You carried it to him with the ink still wet, and you held the candle while he read.', next: 'n1' },
      m3: { who: 'queen', text: 'Necessary. That was Ormund\'s word. I never could decide which of you had it first.', next: 'n1' },
      m4: { who: 'queen', text: 'Then I will say it. I have had nineteen years to practise.', next: 'n1' },
      n1: { who: 'queen', text: 'Aldemar wanted to wait. Ormund wanted fire; Ormund always wants fire. I wanted carts. Forty carts, to the abbey and the hills.', next: 'n2' },
      n2: { who: 'queen', text: 'Then they found the grey in the palace laundry, two floors under my bed. And you stood up.', next: 'n3' },
      n3: { who: 'queen', text: '"Every day we wait, the grey climbs the wall." You said it very well. You had your hand on your sword, and you didn\'t know it.', next: 'n4' },
      n4: { who: 'queen', text: 'Then you said you would light it yourself, so that no other man would have to carry it. That was what won the room.', do: ['set:knows_proposal'], next: 'o' },
      o: { who: 'brand', choices: [
        { text: '"I remember."', next: 'o1' },
        { text: '"I thought it would save them."', next: 'o2' },
        { text: '"Don\'t."', next: 'o3' },
        { text: '"There was a letter. From the abbey."', next: 'o4', if: 'knows_letter' },
      ] },
      o1: { who: 'queen', text: 'Do you. I wondered how much of it you had kept.', next: 'p' },
      o2: { who: 'queen', text: 'It saved some. The ones outside the wall. That was the sum, and you did it very quickly.', next: 'p' },
      o3: { who: 'queen', text: 'No. You will hear it once, from someone who was in the room.', next: 'p' },
      o4: { who: 'brand', text: 'Anselm, at Lenten Mere. It came on the Vigil, before dark. I burned it.', do: ['add:c_qs=1', 'set:c_q_letter'], next: 'o5' },
      o5: { who: 'queen', text: '…Unread?', next: 'o6' },
      o6: { who: 'brand', choices: [
        { text: '"Unread."', next: 'o7' },
        { text: 'Say nothing.', next: 'o7' },
      ] },
      o7: { who: 'queen', text: 'Then you didn\'t know what you were doing. You made very sure you would never know.', next: 'p' },
      p: { who: 'narrator', text: 'The cold goes out of the room a little. She straightens a cup that does not need it.', next: 'q' },
      q: { who: 'queen', text: ['One thing, Warden, and then I will know what to do with you.', 'If it were that night again. Would you light it?'], next: 'r' },
      r: { who: 'brand', choices: [
        { text: '"No."', next: 'r1' },
        { text: '"I don\'t know."', next: 'r2', do: ['add:c_qs=1'] },
        { text: '"Yes."', next: 'r3', do: ['set:c_q_hard'] },
        { text: 'Say nothing.', next: 'r4' },
      ] },
      r1: { who: 'queen', text: 'No. It is easy to say no to a table with nobody at it.', next: 's' },
      r2: { who: 'queen', text: '…No. Neither do I. It ended the grey. It ended everything else. I have never been able to hate it cleanly.', next: 's' },
      r3: { who: 'queen', text: 'Then you are honest, at least. It isn\'t much. It is more than Ormund ever managed.', next: 's' },
      r4: { who: 'queen', text: 'Silence. Aldemar did that too, whenever it mattered.', next: 's' },
      s: { who: 'narrator', text: 'The crown dims. She is looking past you now, down the tables, toward the doors.', next: 't' },
      t: { who: 'queen', text: 'Nearly dusk. Help me with the spoons, or get out of the light.', next: 'u' },
      u: { who: 'brand', choices: [
        { text: 'Help her set the table.', next: 'u1', do: ['add:c_qs=1'], lock: 'hollow_stage>=2', lockText: '[His hands will not.]' },
        { text: 'Stand and watch.', next: 'u9' },
      ] },
      u1: { who: 'narrator', text: 'You set spoons. The benches come to your knee. She moves ahead of you and you follow her, the way a page follows.', next: 'u2' },
      u2: { who: 'narrator', text: 'At the head of the first table your hand stops over one card. It says WREN.', next: 'u3' },
      u3: { who: 'queen', text: 'That one is hers. Your girl. I put her name down myself.', next: 'u4' },
      u4: { who: 'brand', choices: [
        { text: '"…Thank you."', next: 'u5' },
        { text: 'Set the spoon down.', next: 'u6' },
        { text: '"She won\'t be coming."', next: 'u7' },
      ] },
      u5: { who: 'queen', text: 'Don\'t. I don\'t want thanks. I want the carts.', next: 'x' },
      u6: { who: 'narrator', text: 'You set it straight. Then straighter. She lets you.', next: 'x' },
      u7: { who: 'queen', text: 'None of them are coming. I set it anyway. What else are hands for?', next: 'x' },
      u9: { who: 'queen', text: 'Suit yourself. You always did.', next: 'x' },
      x: { who: 'narrator', text: 'She takes something from her sleeve, and holds it a long while before she lets it go.', next: 'x2' },
      x2: { who: 'queen', text: 'The Wickward gate. You will want it. …Of course you will. You always go back to it.', do: ['give:wickward_key'], next: 'y' },
      y: { branch: [{ if: 'c_qs>=2 && !c_q_hard', next: 'z1' }, { next: 'z2' }] },
      z1: { who: 'queen', text: ['Go on, then. …Emeric.', 'I forgive you. I did not think I would. It isn\'t a gift. I have only run out of room to keep it.'], do: ['set:queen_forgave'], next: 'end' },
      z2: { who: 'queen', text: 'Go on, then, Warden. Don\'t look for a place at this table. I did not set one for you.', next: 'end' },
      end: { who: 'narrator', text: 'When you look back, she is at the far end, setting a spoon at a place that already has one.', do: ['set:c_queen_done'] },
    },
  };

  D.dialogue.c_queen_again = {
    start: 'a',
    nodes: {
      a: { branch: [
        { if: 'knows_wren && !c_q_wren', next: 'w1' },
        { if: 'queen_forgave', next: 'f1' },
        { next: 'n1' },
      ] },
      f1: { who: 'queen', text: 'Mind the benches, Emeric. They\'re low.' },
      n1: { who: 'queen', text: 'The carts come at dusk. You needn\'t wait.' },
      w1: { who: 'narrator', text: 'She is setting the place marked WREN. Again.', next: 'w2' },
      w2: { who: 'brand', choices: [
        { text: '"She lived. Wren lived."', next: 'w3' },
        { text: 'Leave her to it.', next: null },
      ] },
      w3: { who: 'narrator', text: 'The spoon stops.', next: 'w4' },
      w4: { who: 'queen', text: '…Then set her place properly. The cup is crooked.', do: ['set:c_q_wren'], next: 'w5' },
      w5: { who: 'narrator', text: 'You straighten the cup. For a moment the Queen of Lanthorn is smiling. Then she is only setting spoons.' },
    },
  };

  // ================================================================== the hound on Tallow Lane
  D.dialogue.c_hound = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'c_hound_met', next: 'r' }, { next: 'a1' }] },
      a1: { who: 'narrator', text: 'A dog the size of a pony lies across a doorstep. Most of it is ash. Its ribs glow like the bars of a grate.', next: 'a2' },
      a2: { who: 'narrator', text: 'It has seen you. It gets up without any hurry, and puts itself between you and the door.', do: ['sfx:growl', 'set:c_hound_met', 'quest:hound=1'], next: 'a3' },
      a3: { who: 'narrator', text: 'It does not bark. The growl comes up through the cobbles and into your boots.', next: 'c' },
      r: { who: 'narrator', text: 'The hound is between you and the door. It has not moved. It is not going to.', do: ['sfx:growl'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: '"Easy. Easy, now."', next: 'e1', if: '!c_hound_easy' },
        { text: 'Blow Jory Pike\'s whistle.', next: 'w1', if: 'has:hound_whistle' },
        { text: 'Draw Vigil.', next: 'k1' },
        { text: 'Back away.', next: null },
      ] },
      e1: { who: 'narrator', text: 'It is not easy. It has not been easy for a long time.', do: ['set:c_hound_easy'], next: 'e2' },
      e2: { who: 'brand', text: '…No. I don\'t suppose it has.', next: 'c' },
      k1: { who: 'narrator', text: 'Its hackles lift. It knows what a drawn sword means. It was a soldier\'s dog.', next: 'k2' },
      k2: { who: 'brand', choices: [
        { text: 'Cut it down.', next: 'k3' },
        { text: 'Sheathe the blade.', next: 'k4' },
      ] },
      k3: { who: 'narrator', text: 'It comes at you the way it was taught to. Low, for the throat, without a sound.', do: ['sfx:roar', 'set:c_hound_fight'] },
      k4: { who: 'narrator', text: 'It watches the sword go back. It does not lie down.', next: 'c' },
      w1: { who: 'narrator', text: 'The whistle is shrill and ugly. It goes down Tallow Lane and comes back off the walls.', next: 'w2' },
      w2: { who: 'narrator', text: 'The hound stops. Its head turns. Not to you. Past you, to the end of the lane, where a man would be coming home.', next: 'w3' },
      w3: { who: 'narrator', text: 'It looks for a long time.', next: 'w4' },
      w4: { who: 'narrator', text: 'Then it steps off the doorstep, lies down beside it, puts its chin on its paws, and lets out a breath that is mostly ash.',
        do: ['anim:self:lie', 'set:hound_calmed', 'hollow:-1', 'quest:hound=2'], next: 'w5' },
      w5: { who: 'brand', choices: [
        { text: '"Good dog."', next: 'w6' },
        { text: '"He isn\'t coming. I\'m sorry."', next: 'w7' },
        { text: 'Say nothing.', next: null },
      ] },
      w6: { who: 'narrator', text: 'The tail moves, once, in the ash.' },
      w7: { who: 'narrator', text: 'The ears go flat. It does not get up. It goes on watching the end of the lane anyway.' },
    },
  };

  // run by the hound enemy's onDeath
  D.dialogue.c_hound_dead = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'It goes down the way it came at you: without a sound. The ash of it settles across the doorstep like a blanket.',
        do: ['set:hound_killed', 'hollow:+1', 'quest:hound=3'], next: 'b' },
      b: { who: 'narrator', text: 'The door behind it was never locked. Only kept.' },
    },
  };

  D.dialogue.c_hound_calm = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'q_hound>=99', next: 'b' }, { next: 'a1' }] },
      a1: { who: 'narrator', text: 'The hound lies beside the step with its chin on its paws. One ear follows you. The rest of it is watching the end of the lane.', next: 'c' },
      b: { who: 'narrator', text: 'The hound looks at you once, very carefully, as if it can smell the house on you. Then it goes back to watching the lane.', next: 'c' },
      c: { who: 'brand', choices: [
        { text: 'Scratch its ears.', next: 's1' },
        { text: 'Blow the whistle again.', next: 's2', if: 'has:hound_whistle' },
        { text: 'Leave it be.', next: null },
      ] },
      s1: { who: 'narrator', text: 'Ash comes away on your gauntlet in soft grey handfuls. It lets you.' },
      s2: { who: 'narrator', text: 'Its head comes up. It looks down the lane, and waits, and waits. Then it puts its head back down.', next: 's3' },
      s3: { who: 'brand', text: '…That was unkind. I won\'t again.' },
    },
  };

  // ================================================================== the house on Tallow Lane
  D.dialogue.c_tallow_first = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'One room, and a cold hearth, and the smell of old tallow. The bar that held the door lies on the floor in two pieces.', next: 'b' },
      b: { branch: [{ if: 'hound_killed', next: 'c' }, { next: null }] },
      c: { who: 'narrator', text: 'Outside, nothing is watching the lane any more.' },
    },
  };

  D.dialogue.c_shrouds = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'Two small shapes under blankets before the dead hearth, close together, the way children sleep when it is cold.', next: 'b' },
      b: { who: 'narrator', text: 'Somebody laid the blankets over them with great care, and not very well. The corners are dragged, and pierced through, as if by teeth.', next: 'c' },
      c: { branch: [{ if: 'has:hound_whistle', next: 'd' }, { next: 'e' }] },
      d: { who: 'brand', text: '…Jory. They kept the door shut. They did what you told them.' },
      e: { who: 'brand', text: '…' },
    },
  };
})(window.AV);
