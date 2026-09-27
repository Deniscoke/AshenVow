// ASHEN VOW — the main cast (CAST): speakers, NPCs, main & cast quests, Fenwick's shop, and every dialogue for
// Linnet, the Snuffer, Fenwick and Hesk, plus the opening, the Procession aftermath and the choice at the Pyre.
// CAST-local flags are prefixed cast_ (see COORDINATION.md).
(function (AV) {
  'use strict';
  const SP = AV.data.speakers;
  const NPC = AV.data.npcs;
  const Q = AV.data.quests;
  const DLG = AV.data.dialogue;

  // ================================================================== speakers
  SP.brand = {
    name: [
      { if: "brand_named || name_given=='brand'", name: 'Brand' },
      { if: "name_given=='emeric'", name: 'Emeric' },
      { name: 'The Knight' }
    ],
    portrait: 'brand', color: '#f59a36', voice: 0.55
  };
  SP.linnet = {
    name: [{ if: 'linnet_named', name: 'Linnet' }, { name: 'The Chandler' }],
    portrait: 'linnet', color: '#e6cc9c', voice: 1.08
  };
  SP.snuffer = { name: 'The Snuffer', portrait: 'snuffer', color: '#a8a0a6', voice: 0.42 };
  SP.fenwick = { name: 'Fenwick', portrait: 'fenwick', color: '#d4b96a', voice: 1.3 };
  SP.hesk = { name: 'Hesk', portrait: 'hesk', color: '#c8987a', voice: 0.72 };

  // ================================================================== NPCs
  NPC.linnet = {
    name: 'Linnet', sprite: 'npc_linnet', portrait: 'linnet', solid: true, anim: 'idle',
    talk: [
      { if: 'told_linnet && !seen_linnet_turned', dialogue: 'linnet_turned' },
      { if: 'told_linnet', dialogue: 'linnet_told' },
      { if: 'knows_wren', dialogue: 'linnet_wren' },
      { if: 'boss_procession && !seen_linnet_after_procession', dialogue: 'linnet_after_procession' },
      { dialogue: 'linnet_hub' }
    ],
    barks: [
      { if: 'told_linnet', text: '…' },
      { if: 'chapter<=1', text: 'Mind the third step.' },
      { text: 'Hush now, Row Nine.' }
    ]
  };

  NPC.snuffer = {
    name: 'The Snuffer', sprite: 'npc_snuffer', portrait: 'snuffer', solid: true, anim: 'idle',
    talk: [
      { if: "map=='hushwood_deep'", dialogue: 'snuffer_hushwood' },
      { if: "map=='abbey_cloister'", dialogue: 'snuffer_abbey' },
      { if: "map=='greyharrow_field'", dialogue: 'snuffer_greyharrow' },
      { if: "map=='wickward'", dialogue: 'snuffer_wickward' },
      { if: "map=='pyre'", dialogue: 'snuffer_pyre' },
      { dialogue: 'snuffer_village' }
    ],
    barks: [{ if: "map!='pyre'", text: 'Good evening.' }]
  };

  NPC.fenwick = {
    name: 'Fenwick', sprite: 'npc_fenwick', portrait: 'fenwick', solid: true, anim: 'idle',
    talk: [
      { if: "map=='upper_city'", dialogue: 'fenwick_city' },
      { if: 'knows_sluice', dialogue: 'fenwick_confront' },
      { dialogue: 'fenwick_shop' }
    ],
    barks: [
      { if: "map=='upper_city'", text: 'Still open. If anybody asks.' },
      { if: '!knows_sluice', text: 'Relics! Remedies! Reasonable!' }
    ]
  };

  NPC.hesk = {
    name: 'Hesk', sprite: 'npc_hesk', portrait: 'hesk', solid: true, anim: 'idle',
    talk: [
      { if: "map=='greyharrow_field'", dialogue: 'g_hesk' },
      { if: 'hesk_left', dialogue: 'hesk_after' },
      { if: 'hesk_following', dialogue: 'hesk_city' },
      { dialogue: 'hesk_gate' }
    ],
    barks: [
      { if: 'hesk_left', text: 'Watching the gate. Old habit.' },
      { if: "hesk_waits && !hesk_following && !hesk_left", text: 'Took your time.' }
    ]
  };

  // ================================================================== quests
  Q.main = {
    title: 'The Ashen Vow', kind: 'main',
    stages: {
      1: 'Something in the chapel is calling a name. Yours.',
      2: 'The Seventh Gate is sealed by three Wardstones: the Hart, the Bell, the Shield. Their keepers went home to the Hushwood, Lenten Mere and Greyharrow.',
      3: 'The gate is open. Hallowhearth is waiting. So is whatever is left of the Queen.',
      4: 'Row 3. Cot 11. You have always known where you would have to go.',
      5: 'The Pyre is open to you now.',
      99: "It is finished. Or it isn't."
    }
  };
  Q.fenwick = {
    title: "The Peddler's Pack", kind: 'side',
    stages: {
      1: 'A peddler in Saint Wendel\'s Rest knew your helm before you said a word. He would rather you did not ask how.',
      2: 'Fenwick carried Prior Anselm\'s letter to the Seventh Gate. Fenwick opened the sluices at Lenten Mere. You let him walk away, north, toward the city.',
      99: 'Whatever Fenwick Moll owed, he has paid what he is going to pay.'
    }
  };
  Q.hesk = {
    title: 'The Watchman', kind: 'side',
    stages: {
      1: 'Hesk stood the wall of the Seventh Gate the night of the Kindling. He is walking with you as far as he can stand to.',
      2: 'Hesk would not go down into the Wickward. His wife, Bett Dunmore, burned there. Her tag may still be with her, somewhere down in the Wickward.',
      99: "Bett Dunmore's name will be spoken. Say it properly. Say it like a complaint."
    }
  };

  // ================================================================== shop
  AV.data.shops.fenwick = {
    name: "Fenwick's Pack",
    items: [
      { item: 'tallow_stub', price: 150, stock: 1 },
      { item: 'maud_ring', price: 220, stock: 1, if: '!maud_returned' },
      { item: 'lore_cast_ballad', price: 60, stock: 1 },
      { item: 'lore_cast_finger', price: 40, stock: 1 }
    ]
  };

  // ================================================================== THE OPENING
  DLG.intro = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: ['…', `"Say it."`], next: 'b' },
      b: { who: 'narrator', text: [`"Come on. I've done this four hundred times. You only have to say it."`, `"Say your name, and I can let you go."`], next: 'c' },
      c: { who: 'narrator', text: 'You try. There is ash where your mouth should be.', next: 'd' },
      d: { who: 'narrator', text: [`"…Nothing. Of course nothing. Why would tonight be different."`, `"Go home, then. Whoever you are. The dark is shorter than it looks."`], next: 'e' },
      e: { who: 'narrator', do: ['sfx:snuff'], text: ['A small sound. A flame pinched out between finger and thumb.', 'And then nothing.', 'And then something.'], next: 'f' },
      f: { who: 'narrator', do: ['fade:in', 'wait:0.8'], text: ['A crypt. Candle-stubs in niches. Shrouded shapes on stone shelves, row on row, all very patient.', `And over the bier, a young woman in Chandler's grey, a long brass snuffer raised in one hand.`], next: 'g' },
      g: { who: 'narrator', do: ['reveal', 'shake:3', 'sfx:hit_heavy'], text: 'You sit up. Ash pours off you like water off a dog.', next: 'h' },
      h: { who: 'narrator', do: ['sfx:block'], text: 'She drops the snuffer.', next: 'i' },
      i: { who: 'linnet', text: ['…', 'No.', `No, no. You're dead. You came in on the ash cart. I checked. I checked twice. I held a feather to your—`, `…You haven't got a face. Where would I even hold the feather.`], next: 'j' },
      j: { who: 'brand', choices: [
        { text: `"Where is this?"`, next: 'j1' },
        { text: `"You dropped your snuffer."`, next: 'j2' },
        { text: `"Stand back."`, next: 'j3' },
        { text: '…', next: 'j4' }
      ] },
      j1: { who: 'linnet', text: `Saint Wendel's Rest. My crypt. That's my bier you're sitting on, and my good shroud you're getting ash all over.`, next: 'k' },
      j2: { who: 'linnet', text: [`I'm aware.`, `…I'm going to leave it there. In case.`], next: 'k' },
      j3: { who: 'linnet', text: `I am standing back. Look at me. I'm practically in the next village.`, next: 'k' },
      j4: { who: 'linnet', text: 'Oh, good. The quiet sort. The quiet ones are always fine.', next: 'k' },
      k: { who: 'linnet', text: ['Right. …Right.', `The rite didn't take. The rite always takes. It takes on pilgrims. It takes on babies. It took on a goat once, which we don't discuss.`], next: 'l' },
      l: { who: 'linnet', text: [`It only needs a name. That's all it has ever needed.`, 'So. What do they call you?'], next: 'm' },
      m: { who: 'brand', choices: [
        { text: `"Brand."`, do: ['set:name_given=brand'], next: 'n_brand' },
        { text: `"Emeric."`, do: ['set:name_given=emeric'], next: 'n_emeric' },
        { text: `"They don't. Not anymore."`, do: ['set:name_given=none'], next: 'n_none' }
      ] },
      n_brand: { who: 'linnet', text: ['Brand.', 'Like the one who lit it.', `…Well. It's a common enough word.`], next: 'o' },
      n_emeric: { who: 'linnet', text: [`Emeric. That's an old knight's name. Nobody's named a baby Emeric since before the ash.`, `It'll do.`], next: 'o' },
      n_none: { who: 'linnet', text: ['Not anymore.', `That's the saddest thing anyone's said to me this week, and I spend my weeks with the dead.`, 'Fine. Keep it. They all keep it, down here.'], next: 'p' },
      o: { who: 'narrator', text: 'She picks the snuffer up off the floor. She lights a fresh candle from the stub in the niche and holds it up to your visor, like a question.', next: 'o_br' },
      o_br: { branch: [{ if: "name_given=='emeric'", next: 'o_em' }, { next: 'o_b' }] },
      o_b: { who: 'linnet', do: ['sfx:snuff'], text: 'Go home, Brand. The dark is shorter than it looks.', next: 'o3' },
      o_em: { who: 'linnet', do: ['sfx:snuff'], text: 'Go home, Emeric. The dark is shorter than it looks.', next: 'o3' },
      o3: { who: 'narrator', text: 'She pinches the flame out. The smoke goes up in a thin grey thread. You stay exactly where you are.', next: 'o4' },
      o4: { who: 'linnet', text: ['…Huh.', `So it isn't the name.`, `It's you.`], next: 'p' },
      p: { who: 'narrator', text: 'Her eyes go to your left wrist. To the scorched tin tag knotted there.', next: 'q' },
      q: { who: 'linnet', text: [`That's a Wickward tag. Row and cot. They stamped them for the sick, so the names wouldn't get lost when the people did.`, `W… something, something… E, N. The fire's had the middle.`, 'Warren? Wendel? Half the dead in this crypt are Wendels. Pilgrims name everything after the saint.'], next: 'r' },
      r: { who: 'brand', choices: [
        { text: `"It isn't mine."`, next: 'r1' },
        { text: `"Don't touch it."`, next: 'r2' },
        { text: `"It's all I have."`, next: 'r3' },
        { text: 'Close your hand over it.', next: 'r4' }
      ] },
      r1: { who: 'linnet', text: `No. It wouldn't fit you. It would fit a child.`, next: 'r5' },
      r5: { who: 'narrator', text: 'She looks at it a moment longer than she needs to.', next: 's' },
      r2: { who: 'linnet', text: `I wasn't going to. I've touched enough of those to last me.`, next: 's' },
      r3: { who: 'linnet', text: ['…Then keep it on.', 'Most of mine come in with less.'], next: 's' },
      r4: { who: 'narrator', text: 'You close your gauntlet over the tag. She looks away first.', next: 's' },
      s: { who: 'brand', choices: [
        { text: `"And you are?"`, next: 's1' },
        { text: `"You're young, for a Chandler."`, next: 's2' }
      ] },
      s1: { who: 'linnet', do: ['set:linnet_named'], text: `Linnet. Chandler of Saint Wendel's Rest, since there's nobody else to be.`, next: 't' },
      s2: { who: 'linnet', do: ['set:linnet_named'], text: [`And you're very lively, for a corpse. We've all had a surprising evening.`, `Linnet. Chandler of the Rest, since there's nobody else to be.`], next: 't' },
      t: { who: 'linnet', text: [`Now. I need that bier. There's a woman from the road who's been waiting two days, and she, at least, is polite about being dead.`, `Up the stairs. Out. Mind the third step, it's loose.`], next: 'u' },
      u: { who: 'linnet', text: [`And if you're going out—`, `Whatever's in the chapel has been saying the same word all week. Tonight it's louder.`], next: 'v' },
      v: { who: 'brand', choices: [
        { text: `"What word?"`, next: 'v1' },
        { text: `"I'll see to it."`, next: 'v2' },
        { text: `"That is not my concern."`, next: 'v3' }
      ] },
      v1: { who: 'linnet', text: [`I don't go near enough to hear. I'm a Chandler, not a fool.`, `…It sounds like a name. It sounds like it's waiting for somebody to answer to it.`], next: 'w' },
      v2: { who: 'linnet', text: [`You'll "see to it". You've been alive for four minutes.`, `…Fine. See to it. Try not to come back in pieces. I've only the one bier.`], next: 'w' },
      v3: { who: 'linnet', text: `No? It gets louder every night. I think it's going to be somebody's concern quite soon.`, next: 'w' },
      w: { who: 'narrator', do: ['refill', 'sfx:pickup'], text: 'She takes something from her apron and presses it into your gauntlet: a bundle of short, fat candles, still soft from the mould.', next: 'x' },
      x: { who: 'linnet', text: [`Tallow. I pour it myself. Light one when you're hurt.`, `It won't fix you. It'll make the dark shorter.`], next: 'y' },
      y: { who: 'narrator', do: ['set:intro_done', 'chapter:1'], text: `She picks up her snuffer and goes up the stairs ahead of you. She doesn't look back. Then, at the top, she does.`, end: true }
    }
  };

  // ================================================================== Boss 1 aftermath
  DLG.procession_after = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', do: ['shake:4'], text: 'The Procession comes apart. Not like a body. Like a held breath let go.', next: 'b' },
      b: { who: 'narrator', do: ['sfx:kindle', 'flash:#f59a36', 'shake:6'], text: 'Its ash does not fall. It turns in the air all at once, the way a flock turns, and pours into the seams of your armor.', next: 'c' },
      c: { who: 'narrator', text: ['It is warm. It is so warm.', 'For a moment you hear them: a hundred pilgrims, each one finishing a prayer.', 'Then they are quiet, and you are heavier, and the cracks in your plate glow like coals.'], next: 'd' },
      d: { who: 'brand', text: ['…', 'They knew my name.'], next: 'e' },
      e: { who: 'narrator', do: ['set:cinder_unlocked', 'toast:The ash is inside the armor now. When the Cinder burns full, press Q to Kindle.'], text: 'At the chapel door, a candle flame, and someone holding it. Then only the door.', end: true }
    }
  };

  // ================================================================== Linnet: after the Procession (gate key, Chapter II)
  DLG.linnet_after_procession = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'Linnet is sitting on the chandlery bench with her hands in her lap. By candlelight the grey of them looks darker. She has been waiting.', next: 'b' },
      b: { who: 'linnet', text: [`I followed you. To the door. I wasn't going to go in, I'm not a—`, '…', 'It went into you. The ash. It went into you.'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: `"I know."`, next: 'c1' },
        { text: `"It knew my name."`, next: 'c2' },
        { text: `"Did it frighten you?"`, next: 'c3' },
        { text: `"It was nothing."`, next: 'c4' }
      ] },
      c1: { who: 'linnet', text: 'You know. Good. One of us should.', next: 'd' },
      c2: { who: 'linnet', text: [`It's been saying it all week. Like a bell with one note.`, `I told myself it was the wind. It's easier to snuff people when the wind isn't saying things.`], next: 'c2b' },
      c2b: { branch: [{ if: "name_given!='brand'", next: 'c2c' }, { next: 'd' }] },
      c2c: { who: 'linnet', do: ['set:brand_named'], text: ['Brand.', 'You told me something else, in the crypt.', `…I suppose I'd have lied too.`], next: 'd' },
      c3: { who: 'linnet', text: ['Yes.', '…Not the ash. The way you stood there and let it.'], next: 'd' },
      c4: { who: 'linnet', text: `Nothing. Right. I've tended nothing for nine years; I know what it looks like, and that wasn't it.`, next: 'd' },
      d: { who: 'linnet', text: [`The pilgrims in that chapel. I sang over them every week for a year. They never went.`, `They went into you instead. I don't know if that's better.`], next: 'e' },
      e: { who: 'narrator', do: ['give:gate_key'], text: 'She holds out a key. Iron, heavy, warm from her apron.', next: 'f' },
      f: { who: 'linnet', text: [`The village gate. East to the Hushwood, west to the Mere, south to Greyharrow. I barred the roads myself, the winter the dead started walking them.`, `You're going to the city. I've seen that look. Well. That helm.`], next: 'g' },
      g: { who: 'linnet', text: [`The Seventh Gate is sealed with three Wardstones. The Hart, the Bell, the Shield. Their keepers took them home, after.`, `The foresters to the Hushwood. The monks to Lenten Mere. The last Harrow knights to Greyharrow. Nobody's heard from any of them since.`], next: 'h' },
      h: { who: 'brand', choices: [
        { text: `"Why help me?"`, next: 'h1' },
        { text: `"I'll bring back what I find."`, next: 'h2' },
        { text: `"Stay behind your bars."`, next: 'h3' }
      ] },
      h1: { who: 'linnet', text: [`Because you're the only thing I've ever seen walk out of that chapel.`, `And because you can't die, apparently, which is more than I can say for anybody else I could ask.`], next: 'i' },
      h2: { who: 'linnet', text: [`Bring back names. Tags, like yours. Anything with a name on it. I'll write them down.`, 'Somebody ought to be saying them.'], next: 'i' },
      h3: { who: 'linnet', text: `I've got the bars. I've got the dead. I've got a knight who won't lie down. I'm very well defended.`, next: 'i' },
      i: { who: 'linnet', do: ['chapter:2'], text: ['Keep your flame.', '…Whatever you are.'], end: true }
    }
  };

  // ================================================================== Linnet: the chandlery, Chapters I–IV
  // One reaction line per visit (highest priority first), then a topic menu that follows the main quest.
  DLG.linnet_hub = {
    start: 'a',
    nodes: {
      a: { branch: [
        { if: 'linnet_heard_lit && !cast_l_litafter', next: 'r_lit' },
        { if: 'fenwick_confessed && !cast_l_fen', next: 'r_fen' },
        { if: 'hollow_stage>=2 && !cast_l_voice', next: 'r_voice' },
        { if: 'deaths>=1 && !cast_l_ash', next: 'r_ash' },
        { if: 'deaths>=12 && !cast_l_ash12', next: 'r_ash12' },
        { if: 'tags>=12 && !cast_l_tag12', next: 'r_tag12' },
        { if: 'tags>=8 && !cast_l_tag8', next: 'r_tag8' },
        { if: 'tags>=4 && !cast_l_tag4', next: 'r_tag4' },
        { if: 'tags>=1 && !cast_l_tag1', next: 'r_tag1' },
        { if: 'chapter>=3 && !cast_l_gate', next: 'r_gate' },
        { next: 'g' }
      ] },

      // ---- greetings
      g: { branch: [{ if: 'chapter<=1', next: 'g1' }, { if: 'chapter==2', next: 'g2' }, { if: 'chapter==3', next: 'g3' }, { next: 'g4' }] },
      g1: { who: 'linnet', text: `You again. The chapel's still saying it, if you were wondering. I was rather hoping you'd make it stop.`, next: 'menu' },
      g2: { who: 'linnet', text: `Still walking, then. Good. Don't stand on the mat; you shed.`, next: 'menu' },
      g3: { who: 'linnet', text: `You came back down the north road. People don't, as a rule. …Mind the moulds. They're still soft.`, next: 'menu' },
      g4: { who: 'linnet', text: ['…', `Sit, if you're staying. You look like a man who's been standing up for a very long time.`], next: 'menu' },

      // ---- reactions (each once)
      r_lit: { who: 'linnet', do: ['set:cast_l_litafter'], text: ['You came back.', `I wasn't sure you would. I wasn't sure I wanted you to. The tallow's on the shelf regardless. It doesn't care who you are.`], next: 'menu' },
      r_fen: { who: 'linnet', do: ['set:cast_l_fen'], text: [`Fenwick was here. He stood where you're standing, with his hat in his hands, and told me about the sluices.`, `I was at the abbey that night. Eight years old. The bell woke us. Somebody carried me up the stair to the high dormitory, above the water.`], next: 'r_fen2' },
      r_fen2: { who: 'narrator', text: 'She puts the ladle down, very carefully, as if it might break.', next: 'r_fen3' },
      r_fen3: { who: 'linnet', text: ['He wept. I didn\'t.', '…I\'ll do that later.'], next: 'r_fen4' },
      r_fen4: { who: 'brand', choices: [
        { text: `"I sent him."`, next: 'r_fen5' },
        { text: '…', next: 'r_fen6' }
      ] },
      r_fen5: { who: 'linnet', text: `I know. He said. …I haven't decided yet whether to thank you.`, next: 'menu' },
      r_fen6: { who: 'linnet', text: `Yes. That's about all there is to say, isn't it.`, next: 'menu' },
      r_voice: { who: 'linnet', do: ['set:cast_l_voice'], text: ['Your voice is different today.', `Further off. Like you're talking up at me from the bottom of the well.`], next: 'r_voice2' },
      r_voice2: { who: 'narrator', text: 'She looks at your visor for a long moment. The glow in the slit is paler than it was. Colder.', next: 'r_voice3' },
      r_voice3: { who: 'linnet', text: `Light a candle. Humour me. …I don't care if it helps. Light one anyway.`, next: 'menu' },
      r_ash: { who: 'linnet', do: ['set:cast_l_ash'], text: ['You were a pile of ash on my floor this morning.', `I swept you into a corner and you got up and walked out. You didn't even say thank you for the sweeping.`], next: 'r_ash2' },
      r_ash2: { who: 'brand', choices: [
        { text: `"Thank you for the sweeping."`, next: 'r_ash3' },
        { text: `"Did it frighten you?"`, next: 'r_ash4' },
        { text: '…', next: 'r_ash5' }
      ] },
      r_ash3: { who: 'linnet', text: `You're welcome. Don't make a habit of it. I've only the one broom.`, next: 'menu' },
      r_ash4: { who: 'linnet', text: [`I sweep ash for a living. It's never got up before.`, `…Yes. For about the time it takes to boil a kettle. Then I boiled a kettle.`], next: 'menu' },
      r_ash5: { who: 'linnet', text: 'The quiet sort again. Fine. The corner\'s yours, whenever you need it.', next: 'menu' },
      r_ash12: { who: 'linnet', do: ['set:cast_l_ash12'], text: [`That's {$deaths} times, by my count. I've started keeping a tally for you, on the wall, next to the tallow order.`, 'The tallow order is winning. Barely.'], next: 'menu' },
      r_tag1: { who: 'narrator', do: ['set:cast_l_tag1'], text: 'She sees the tin at your belt before you say anything, and holds out her hand for it.', next: 'r_tag1b' },
      r_tag1b: { who: 'linnet', text: [`Tags. You brought me tags.`, `I'll copy them into the ledger tonight, in the good ink, and you can have them back. They're yours to carry. I only keep the list.`], next: 'menu' },
      r_tag4: { who: 'linnet', do: ['set:cast_l_tag4', 'set:cast_l_tag1'], text: `{$tags} names now. I read them out last night, down in the crypt. It isn't the rite. It isn't nothing, either.`, next: 'menu' },
      r_tag8: { who: 'linnet', do: ['set:cast_l_tag8', 'set:cast_l_tag4', 'set:cast_l_tag1'], text: [`{$tags}. I had to start a new page.`, `I've never had to start a new page. …I'm being stupid about it. Ignore me.`], next: 'menu' },
      r_tag12: { who: 'linnet', do: ['set:cast_l_tag12', 'set:cast_l_tag8', 'set:cast_l_tag4', 'set:cast_l_tag1'], text: [`{$tags} names. I've read them so often I know their rows by heart. Row nine's all laundresses. Did you know that?`, `If you ever find where the rest are kept, all of them, don't tell me. I'd never sleep again.`], next: 'menu' },
      r_gate: { who: 'linnet', do: ['set:cast_l_gate'], text: [`The ash fell different last night. Heavier. Warm. Mound says the Seventh Gate's open.`, `Mound says a lot of things. He's usually right, which is the annoying part.`], next: 'menu' },

      // ---- the menu, by chapter
      menu: { branch: [{ if: 'chapter<=1', next: 'm1' }, { if: 'chapter==2', next: 'm2' }, { next: 'm3' }] },
      m1: { who: 'brand', choices: [
        { text: `"The chapel."`, next: 'chapel' },
        { text: `"Tell me about yourself."`, next: 'her' },
        { text: `"About the fire."`, next: 'fire' },
        { text: 'Leave.', next: 'bye' }
      ] },
      m2: { who: 'brand', choices: [
        { text: `"The Wardstones."`, next: 'stones' },
        { text: `"Tell me about yourself."`, next: 'her' },
        { text: `"About the fire."`, next: 'fire' },
        { text: 'Leave.', next: 'bye' }
      ] },
      m3: { who: 'brand', choices: [
        { text: `"Hallowhearth."`, next: 'city' },
        { text: `"Tell me about yourself."`, next: 'her' },
        { text: `"About the fire."`, next: 'fire' },
        { text: 'Leave.', next: 'bye' }
      ] },
      bye: { branch: [{ if: 'linnet_heard_lit', next: 'bye3' }, { if: 'hollow_stage>=2', next: 'bye2' }, { next: 'bye1' }] },
      bye1: { who: 'linnet', text: 'Keep your flame.', end: true },
      bye2: { who: 'linnet', text: 'Keep your flame. …Whatever there is left of it.', end: true },
      bye3: { who: 'narrator', text: 'She nods, once, without looking up. It is not a farewell. It is not a dismissal, either.', end: true },

      // ---- Chapter I: the chapel
      chapel: { who: 'linnet', text: [`It was a pilgrims' chapel. Then the ash came, and the pilgrims came in out of it, and prayed, and didn't stop.`, `They're still in there. All together now. I sing over them through the keyhole on Sundays.`], next: 'chapel2' },
      chapel2: { who: 'brand', choices: [
        { text: `"Why is it calling my name?"`, next: 'chapel3' },
        { text: `"Can they be put to rest?"`, next: 'chapel4' },
        { text: `"Something else."`, next: 'menu' }
      ] },
      chapel3: { who: 'linnet', text: [`Is it yours?`, `…Mound says the ash remembers. Who it was. What was done to it.`, `I'd rather think it's calling everybody, and you're the only fool who answers.`], next: 'chapel2' },
      chapel4: { who: 'linnet', text: [`Not by me. I'd need every name, and they came in off the road with nothing but the prayer.`, `Maybe by you. You're big enough to be a rite on your own.`], next: 'chapel2' },

      // ---- Chapter II: the Wardstones
      stones: { branch: [{ if: 'has:hart_stone && has:bell_stone && has:shield_stone', next: 'st_all' }, { next: 'st' }] },
      st: { who: 'linnet', text: 'Three keepers, three stones, three roads out of my gate. Which?', next: 'st2' },
      st2: { who: 'brand', choices: [
        { text: `"The Hart."`, if: '!has:hart_stone', next: 'st_h' },
        { text: `"The Bell."`, if: '!has:bell_stone', next: 'st_b' },
        { text: `"The Shield."`, if: '!has:shield_stone', next: 'st_s' },
        { text: `"Something else."`, next: 'menu' }
      ] },
      st_h: { who: 'linnet', text: [`East. The Hushwood foresters. Royal men; they kept the Hart for the Queen, and the barrows for the dead.`, `There's an old stag walks the barrow now. Pilgrims come out of that wood talking about it the way you'd talk about an Archchandler.`], next: 'st2' },
      st_b: { who: 'linnet', text: [`West. Lenten Mere. The abbey's under the water, mostly. The sisters who raised me came out of there.`, `Some nights you can hear the bell from the west road. Nobody's ringing it. Somebody is.`], next: 'st2' },
      st_s: { who: 'linnet', text: [`South. Greyharrow. The last Harrow knights. Ser Odo Varr kept the Shield; he held the line with the Warden, in the song.`, `Before the Warden was the man everybody means.`], next: 'st2' },
      st_all: { who: 'linnet', text: [`All three. You've actually got all three.`, `…Then go on. The gate's north. Don't make me say keep your flame again; I'll start to mean it.`], next: 'menu' },

      // ---- Chapters III–IV: the city
      city: { branch: [{ if: 'chapter>=4', next: 'cy4' }, { next: 'cy3' }] },
      cy3: { who: 'linnet', text: [`Hallowhearth. I've never been. The sisters wouldn't take the north road. They'd walk a day out of their way round it.`, `Is it still beautiful? It was supposed to be beautiful. …Don't answer that.`], next: 'menu' },
      cy4: { who: 'linnet', text: [`You've been down in the Wickward.`, `You smell of it. Not the ash; the ash smells of everything. Lye. You smell of lye.`, `…I know that smell. I don't know from where.`], next: 'menu' },

      // ---- about her
      her: { who: 'brand', choices: [
        { text: `"The wooden birds."`, next: 'birds' },
        { text: `"Your hands."`, next: 'hands' },
        { text: `"Your ledger."`, next: 'ledger' },
        { text: `"Something else."`, next: 'menu' }
      ] },
      birds: { who: 'linnet', do: ['set:cast_heard_birds'], text: [`The birds? I put one on every grave that hasn't got a name. So they've got something.`, `My da carved them for me. He was bad at it. Every bird looked like a turnip with opinions.`], next: 'birds2' },
      birds2: { who: 'brand', choices: [
        { text: `"Where is he now?"`, next: 'b_da' },
        { text: `"You carve them yourself?"`, next: 'b_carve' },
        { text: `"Something else."`, next: 'her' }
      ] },
      b_da: { who: 'linnet', text: [`Dead. The fire. He was a soldier on the wall, and the sisters say he tried to stop it.`, `I had the grey by then. I don't remember much. His hands. The birds. A laugh that went on longer than the joke.`], next: 'birds2' },
      b_carve: { who: 'linnet', text: [`Every one. Three hundred and some. I stopped counting when I realised they were all bad ones.`, `I think it runs in families.`], next: 'birds2' },
      hands: { branch: [{ if: 'knows_letter || has:lore_a_cold_rite', next: 'h_rite' }, { next: 'h1' }] },
      h1: { who: 'linnet', text: [`Grey since I was small. It stopped at the wrist. It doesn't spread and it doesn't hurt.`, `It doesn't wash off, either. I was very thorough about finding that out.`], next: 'h1b' },
      h1b: { who: 'brand', choices: [
        { text: `"You had the Greying."`, next: 'h2' },
        { text: `"Something else."`, next: 'her' }
      ] },
      h2: { who: 'linnet', text: [`Had. Nobody's greyed since the fire; everybody knows that.`, `The ones who already had it kept a little. Like a keepsake. I'd have preferred a spoon.`], next: 'her' },
      h_rite: { who: 'linnet', text: 'Grey since I was small. It stopped at the wrist, and it\'s stayed stopped.', next: 'h_rite2' },
      h_rite2: { who: 'brand', choices: [
        { text: `"The Cold Rite."`, next: 'h_rite3' },
        { text: `"Something else."`, next: 'her' }
      ] },
      h_rite3: { who: 'narrator', text: 'She looks up sharply.', next: 'h_rite4' },
      h_rite4: { who: 'linnet', text: [`Where did you hear that?`, `…The sisters called it that. An hour in the springs at dawn, an hour at dusk, a whole year. I screamed through the first month.`, `The Prior sat on the steps and talked to me so I'd stop. I asked him every day if birds could swim. He always said some can.`], next: 'her' },
      ledger: { branch: [{ if: 'tags>=1', next: 'l_tags' }, { next: 'l1' }] },
      l1: { who: 'linnet', text: [`Every name I've snuffed, and every one I couldn't. The couldn'ts are at the back. The back is thicker.`, `Bring me names, if you find them. Tags. Anything. Somebody ought to be saying them.`], next: 'l_ch' },
      l_tags: { who: 'linnet', text: [`Every name I've snuffed, and every one I couldn't. The couldn'ts are at the back.`, `Yours are in there now. {$tags} of them, in the good ink. I read them to the crypt at night.`], next: 'l_ch' },
      l_ch: { who: 'brand', choices: [
        { text: `"Is there a name you haven't got?"`, next: 'l_miss' },
        { text: `"Something else."`, next: 'her' }
      ] },
      l_miss: { who: 'linnet', text: [`…My da's.`, `The grey had it before the sisters had me. Four hundred names in that book, and not his.`, `So I put a bird down for him too. On nothing. Nobody was buried from that night.`], next: 'her' },

      // ---- about the fire
      fire: { who: 'brand', choices: [
        { text: `"The Wickward."`, next: 'wk' },
        { text: `"The one who lit it."`, next: 'bw' },
        { text: `"I lit it."`, if: '(knows_letter || knows_proposal) && !linnet_heard_lit && !knows_wren', next: 'lit1' },
        { text: `"Something else."`, next: 'menu' }
      ] },
      wk: { branch: [{ if: 'chapter>=3', next: 'wk2' }, { next: 'wk1' }] },
      wk1: { who: 'linnet', text: [`The poor quarter under the Seventh Gate. When the Greying came they walled the sick in, and then they lit it.`, `I had the grey, as a girl. By law, that's the Wickward. I don't remember it. The sisters say that's a mercy.`], next: 'fire' },
      wk2: { who: 'linnet', text: [`I've been trying to remember it. Since you went north.`, `A man came to the gate every evening. He pushed something through the bars for me. A bird, every time. Terrible birds.`, `Then a nurse carried me through the dark, in water to her chest. That's all. That's the whole of it.`], next: 'fire' },
      bw: { branch: [{ if: 'linnet_heard_lit', next: 'bw_lit' }, { next: 'bw1' }] },
      bw1: { who: 'linnet', text: [`The Warden of the Seventh Gate. The Shield of Greyharrow, they called him, after the war.`, `Every tavern in Lanthorn sang about him. After the fire, same taverns, they spat.`], next: 'bw_nm' },
      bw_nm: { branch: [{ if: "name_given=='brand'", next: 'bw_nm2' }, { next: 'bw_ch' }] },
      bw_nm2: { who: 'linnet', text: `You've got his name, near enough. I did notice. I decided it was a common enough word.`, next: 'bw_ch' },
      bw_ch: { who: 'brand', choices: [
        { text: `"Do you hate him?"`, next: 'bw_h' },
        { text: `"Who says he lit it?"`, next: 'bw_t' },
        { text: `"Something else."`, next: 'fire' }
      ] },
      bw_h: { who: 'linnet', text: [`Hate?`, `I say names over candles. That's my whole trade. His, I'd never say. Let him gutter out there in the ash with the rest.`, `…That's not hate. That's bookkeeping.`], next: 'bw_ch' },
      bw_t: { who: 'linnet', text: [`Nobody has to say. Everybody knows. The King signed it, the Warden lit it, the Archchandler blessed the oil.`, `My da was on the wall that night, trying to stop it. That's what the sisters say. That's what I've decided.`], next: 'bw_ch' },
      bw_lit: { who: 'linnet', text: [`You tell me. You were there.`, `…No. Don't. I don't want to hear it twice.`], next: 'fire' },

      // ---- "I lit it." (a stranger's confession; she does not know who he is to her)
      lit1: { who: 'brand', text: 'I lit it.', next: 'lit2' },
      lit2: { who: 'narrator', text: `She doesn't stop at once. She finishes the candle she's pouring. She sets the ladle down.`, next: 'lit3' },
      lit3: { who: 'linnet', text: '…What?', next: 'lit4' },
      lit4: { who: 'brand', choices: [
        { text: `"The Kindling. It was my torch."`, next: 'lit5' },
        { text: `"It was my idea. Not the King's."`, if: 'knows_proposal', next: 'lit5p' },
        { text: `"The abbey wrote to me. I burned it."`, if: 'knows_letter', next: 'lit5l' }
      ] },
      lit5: { who: 'brand', text: 'The Wickward. The night of the Last Vigil. I sealed the gate, and I lit it with my own hand.', next: 'lit6' },
      lit5p: { who: 'brand', text: 'I stood in front of the King and asked for it. He only signed. Then I lit it with my own hand.', next: 'lit6' },
      lit5l: { who: 'brand', text: `The Prior of Lenten Mere begged a delay. I knew the seal. I burned it unread. Then I lit the Wickward.`, next: 'lit6' },
      lit6: { branch: [{ if: "name_given=='brand' || brand_named", next: 'lit7b' }, { next: 'lit7' }] },
      lit7b: { who: 'linnet', text: ['Brand.', `Like the one who lit it. …I made a joke. In the crypt, over you, I made a joke about it.`], next: 'lit8' },
      lit7: { who: 'linnet', text: ['The Warden.', `I dragged the Warden off the royal road on my own cart and gave him my good shroud.`], next: 'lit8' },
      lit8: { who: 'linnet', text: ['I was in there.', `I had the grey. I was eight. They took me out through the drains before the Vigil, so I missed it. Your fire.`, `Nobody else in my row did.`], next: 'lit9' },
      lit9: { who: 'brand', choices: [
        { text: `"I'm sorry."`, lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]', next: 'lit10s' },
        { text: `"You should know who you took in."`, next: 'lit10k' },
        { text: '…', next: 'lit10q' }
      ] },
      lit10s: { who: 'linnet', text: `Sorry. …Yes. I expect you are. I expect it's very heavy.`, next: 'lit11' },
      lit10k: { who: 'linnet', text: 'Should I. Should I really.', next: 'lit11' },
      lit10q: { who: 'narrator', text: 'You say nothing. It does not help. It does not make anything worse, either. There is nowhere worse for it to go.', next: 'lit11' },
      lit11: { who: 'linnet', text: [`I'm not writing you down. Not yet. I don't know which page you'd go on.`, 'Get out of my chandlery.'], next: 'lit12' },
      lit12: { who: 'narrator', text: 'You are at the door when she speaks again, without turning round.', next: 'lit13' },
      lit13: { who: 'linnet', do: ['set:linnet_heard_lit'], text: `The tallow will be on the shelf tomorrow. I don't know why. It just will.`, end: true }
    }
  };

  // ================================================================== Linnet: after Cot 11 (the hardest conversation)
  DLG.linnet_wren = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: '!cast_wren_seen', next: 'first' }, { next: 'again' }] },
      first: { who: 'narrator', do: ['set:cast_wren_seen'], text: `Linnet is at the long table, pouring tallow into the moulds. She doesn't hear you come in.`, next: 'first2' },
      first2: { who: 'narrator', text: [`The grey on her hands stops at the wrist, in a clean line, like a tide mark.`, `You have seen that grey before. On a smaller hand. Through the bars of a gate.`], next: 'first3' },
      first3: { who: 'linnet', text: [`Oh. It's you.`, `You're standing like somebody's died. Somebody's always died. Sit, or don't. Only don't loom. Tallow sets badly if it's loomed at.`], next: 'menu' },
      again: { branch: [{ if: 'cast_wren_quiet', next: 'again2' }, { next: 'again1' }] },
      again1: { who: 'linnet', text: `You're doing it again. The standing.`, next: 'menu' },
      again2: { who: 'linnet', text: [`Back. And still with the thing you won't say.`, `It's all right. I've a crypt full of people who never got round to it.`], next: 'menu' },

      menu: { who: 'brand', choices: [
        { text: `"Wren."`, lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]', next: 'w1' },
        { text: 'Tell her what you did.', next: 'p1' },
        { text: `"Tell me about your father."`, if: '!cast_wren_da', lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]', next: 'da1' },
        { text: 'Say nothing.', next: 'q1' }
      ] },

      // ---- her father (she does not know she is describing him to his face)
      da1: { who: 'linnet', do: ['set:cast_wren_da'], text: [`My da? Why?`, `…He came to the Wickward gate every evening. Rain or not. He'd push a bird through the bars and wait while I laughed at it.`], next: 'da2' },
      da2: { who: 'linnet', text: [`He made the beaks too long. I told him. He said that was how you could tell they were singing.`, `The sisters say he died on the wall, trying to stop it. I've decided to believe them.`], next: 'da3' },
      da3: { who: 'narrator', text: 'She wipes her hands on her apron. The grey does not come off. She knows it won\'t. She does it anyway.', next: 'menu' },

      // ---- saying nothing
      q1: { who: 'narrator', do: ['set:cast_wren_quiet'], text: 'You say nothing. She pours. The moulds fill one by one and go pale as they cool.', next: 'q2' },
      q2: { who: 'linnet', text: `…Whatever it is, it'll keep. Most things keep, down here.`, next: 'q3' },
      q3: { who: 'brand', choices: [
        { text: 'Talk of other things.', next: 'q4' },
        { text: 'Leave.', next: 'q5' }
      ] },
      q4: { do: ['dialogue:linnet_hub'], end: true },
      q5: { who: 'linnet', text: 'Keep your flame.', end: true },

      // ---- the tender way in
      w1: { who: 'brand', text: 'Wren.', next: 'w2' },
      w2: { who: 'narrator', text: 'The ladle stops over the mould. Tallow runs off its lip, onto the table, onto her hand. She doesn\'t move her hand.', next: 'w3' },
      w3: { who: 'linnet', text: [`…Nobody's called me that since the abbey.`, `The sisters said it was a sick-house name. They gave me a clean one.`], next: 'w4' },
      w4: { who: 'brand', text: [`Row 3. Cot 11. The tag on my wrist is yours. I've worn it since the night of the fire.`, `…I carved the birds. I made the beaks too long.`], next: 'core' },

      // ---- the plain way in (always open)
      p1: { who: 'brand', text: [`I'm Emeric Brand. Warden of the Seventh Gate. I lit the Wickward.`, `The tag on my wrist says Wren. Row 3, Cot 11. It's yours. I'm your father.`], next: 'core' },

      // ---- what she hears
      core: { who: 'narrator', text: '…', next: 'core2' },
      core2: { who: 'narrator', text: `She sets the ladle down. She looks at the tag. She looks at your gauntlet, the size of it, the way it holds the tag as if it could break.`, next: 'core3' },
      core3: { branch: [{ if: 'linnet_heard_lit', next: 'core_lit' }, { next: 'core_new' }] },
      core_lit: { who: 'linnet', text: [`You told me. You stood there and told me you lit it.`, `And I thought: well. There's a stranger with a heavy conscience. I gave the stranger candles.`], next: 'core4' },
      core_new: { who: 'linnet', text: ['Brand.', `…The one who lit it. And you let me say the rite over you. In my crypt. In my good shroud.`], next: 'core4' },
      core4: { who: 'linnet', do: ['set:told_linnet', 'hollow:-2'], text: [`Da.`, `…No. I can't. I can't put that word where you are.`], next: 'core5' },
      core5: { who: 'linnet', text: `Did you come in? That night. For me.`, next: 'core6' },
      core6: { who: 'brand', choices: [
        { text: `"I went in. You weren't there."`, next: 'in1' },
        { text: `"…Yes."`, lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]', next: 'in1' },
        { text: '…', next: 'in2' }
      ] },
      in1: { who: 'linnet', text: [`No. I was forty miles off, in a cold bath, asking a Prior if birds could swim.`, `You walked into a fire for an empty cot.`], next: 'more' },
      in2: { who: 'linnet', text: `Don't. Don't be quiet at me. I'll hear it as whatever I want, and I don't know what I want.`, next: 'more' },

      // ---- the rest of it (only what he knows)
      more: { who: 'brand', choices: [
        { text: `"The Prior wrote to me. I burned it."`, if: 'knows_letter', next: 'm_l' },
        { text: `"The fire was my idea. Not the King's."`, if: 'knows_proposal', next: 'm_p' },
        { text: 'Stop there.', next: 'end1' }
      ] },
      m_l: { who: 'brand', do: ['set:cast_told_letter'], text: `A letter came from Lenten Mere, before the Vigil. I knew the seal. I put it in the brazier without breaking the wax.`, next: 'm_l2' },
      m_l2: { who: 'linnet', text: [`The Prior wrote to you.`, `…He'd have written about me. He wrote about everything. He wrote to the Candlemother about the weather.`], next: 'more2' },
      m_p: { who: 'brand', do: ['set:cast_told_prop'], text: `The council didn't order it. I asked for it. I said every day we waited, the grey climbed the wall.`, next: 'm_p2' },
      m_p2: { who: 'linnet', text: `The grey had climbed. I was already over the wall. …You just didn't know.`, next: 'more2' },
      more2: { who: 'brand', choices: [
        { text: `"The Prior wrote to me. I burned it."`, if: 'knows_letter && !cast_told_letter', next: 'm_l' },
        { text: `"The fire was my idea. Not the King's."`, if: 'knows_proposal && !cast_told_prop', next: 'm_p' },
        { text: `That's all of it.`, next: 'end1' }
      ] },

      // ---- no absolution
      end1: { who: 'narrator', text: 'She turns back to the table. The tallow in the moulds has set crooked, skinned and wrinkled where it cooled while nobody watched it.', next: 'end2' },
      end2: { who: 'linnet', text: [`It's spoiled. I'll have to melt it down.`, `…I'll have to melt all of it down.`], next: 'end3' },
      end3: { who: 'narrator', text: [`She scrapes the spoiled candles back into the pot, one at a time, and does not look at you.`, `Then she opens the ledger. She holds the pen over the page for a long time. She does not write anything.`], end: true }
    }
  };

  // ================================================================== Linnet: the first time after
  DLG.linnet_turned = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: `She's at the table. The pot of spoiled tallow is gone. New candles are cooling in the moulds. She doesn't look up.`, next: 'b' },
      b: { who: 'linnet', text: ['…', `Your candles are on the shelf.`], next: 'c' },
      c: { who: 'brand', choices: [
        { text: `"Linnet—"`, next: 'd1' },
        { text: `"Wren—"`, lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]', next: 'd2' },
        { text: 'Take the candles.', next: 'd3' }
      ] },
      d1: { who: 'linnet', text: 'Not yet.', end: true },
      d2: { who: 'linnet', text: [`Don't.`, `…Not yet. I don't know what comes after not yet. I'll tell you when I do.`], end: true },
      d3: { who: 'narrator', do: ['refill', 'sfx:pickup'], text: 'You take them. They are still warm. She has wrapped them in a clean cloth, the way you would for someone going a long way.', end: true }
    }
  };

  // ================================================================== Linnet: after (repeatable)
  DLG.linnet_told = {
    start: 'a',
    nodes: {
      a: { branch: [
        { if: '!cast_lt_mother', next: 't1' },
        { if: '!cast_lt_birds', next: 't2' },
        { if: 'chapter>=5 && !boss_final && !cast_lt_pyre', next: 't3' },
        { next: 't4' }
      ] },
      t1: { who: 'linnet', text: [`…What was my mother's name.`, `I've been trying all night. There's a shape where it goes. Nothing in it.`], next: 't1b' },
      t1b: { who: 'brand', choices: [
        { text: `"Ilsabet. She wove."`, next: 't1c' },
        { text: `"Ilsabet. You have her hands."`, lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]', next: 't1c' }
      ] },
      t1c: { who: 'narrator', do: ['set:cast_lt_mother'], text: 'She opens the ledger to the front, where the snuffed names go, and writes it out slowly, in the good ink.', next: 't1d' },
      t1d: { who: 'linnet', text: 'Ilsabet. …There. She\'s in.', end: true },
      t2: { who: 'linnet', text: `Did I like them? The birds. Before.`, next: 't2b' },
      t2b: { who: 'brand', choices: [
        { text: `"You laughed at every one."`, next: 't2c' },
        { text: `"You named them all."`, next: 't2d' },
        { text: '…', next: 't2e' }
      ] },
      t2c: { who: 'linnet', do: ['set:cast_lt_birds'], text: [`…Good.`, `I still do. Laugh at them. I didn't know if that was allowed.`], end: true },
      t2d: { who: 'linnet', do: ['set:cast_lt_birds'], text: [`Did I.`, `…Then I've been naming the wrong things my whole life. Or the right ones. I'll think about it.`], end: true },
      t2e: { who: 'linnet', do: ['set:cast_lt_birds'], text: `You don't know. Or you can't say. …I'll pick one, then. I liked them.`, end: true },
      t3: { who: 'linnet', do: ['set:cast_lt_pyre'], text: [`You're going to the Pyre.`, `If you don't come back, nobody's going to know your name to say it. Except me.`, `…And I don't know if I can.`], end: true },
      t4: { branch: [{ if: 'hollow_stage>=2', next: 't4b' }, { next: 't4a' }] },
      t4a: { who: 'narrator', text: 'She looks up when you come in. It is more than yesterday. She goes back to her pouring.', end: true },
      t4b: { who: 'linnet', text: [`Your voice has gone thin.`, `…Light a candle. Please.`], end: true }
    }
  };

  // ================================================================== The Snuffer
  // Every visit ends with "Shall I?". "Not yet." sets sn_<place> (he is gone when you look again);
  // "Yes." asks once more, then ending:quiet.
  function snufferOffer(place, notYet, confirmText) {
    const flag = 'set:sn_' + place;
    return {
      offer: { who: 'snuffer', text: 'Shall I?', next: 'offer2' },
      offer2: { who: 'brand', choices: [
        { text: `"Not yet."`, next: 'notyet' },
        { text: `"Yes."`, next: 'yes1' }
      ] },
      notyet: { who: 'snuffer', text: notYet, next: 'gone' },
      gone: { who: 'narrator', do: [flag], text: 'When you look again, he is not there. A thin grey thread of smoke goes up where he stood, as from a candle just put out.', end: true },
      yes1: { who: 'snuffer', text: confirmText, next: 'yes2' },
      yes2: { who: 'brand', choices: [
        { text: `"Yes. Do it."`, next: 'quiet1' },
        { text: `"No. …Not yet."`, next: 'notyet' }
      ] },
      quiet1: { who: 'snuffer', do: [flag], text: ['Then hold still, if you would.', 'It does not hurt. I am told it is rather like being put to bed by someone who knows how.'], next: 'quiet2' },
      quiet2: { who: 'narrator', do: ['sfx:snuff'], text: 'Long iron fingers close, very gently, around something inside the helm.', next: 'quiet3' },
      quiet3: { do: ['ending:quiet'], end: true }
    };
  }

  DLG.snuffer_village = {
    start: 'a',
    nodes: Object.assign({
      a: { who: 'narrator', text: 'A tall figure stands apart from the graves in long black vestments. Where its head should be is an iron snuffer-cone, black at the lip.', next: 'b' },
      b: { who: 'snuffer', text: ['Good evening.', 'Forgive me. I did not mean to startle you. You have had a startling sort of evening already.'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: `"What are you?"`, next: 'd1' },
        { text: `"You were watching me."`, next: 'd2' },
        { text: `"Stand aside."`, next: 'd3' }
      ] },
      d1: { who: 'snuffer', text: ['A servant. The Candlemother\'s, if we must have names, and I am afraid we usually must.', 'When a flame will not go home, I am sent to see it out. Most people think I am a story for children. I find that restful.'], next: 'e' },
      d2: { who: 'snuffer', text: ['I was. I have been waiting for you for nineteen years, and I thought I might as well wait somewhere with candles.', 'The young Chandler keeps very good candles.'], next: 'e' },
      d3: { who: 'snuffer', text: 'Of course.', next: 'd3b' },
      d3b: { who: 'narrator', text: 'He does not move. It is not insolence. It is only that he was never in your way.', next: 'e' },
      e: { who: 'snuffer', text: ['I have come about your flame, Warden. It has overstayed, and I am the one who tidies.', 'Not by force. I have never once taken what was not offered. I only ask.'], next: 'offer' }
    }, snufferOffer('village',
      ['Not yet. Yes. That is what they generally say.', 'I shall be about. I am always about. Good evening, Warden.'],
      ['You are certain.', 'There is no hurry. There has never been any hurry. The dark is exactly as long as it was.']))
  };

  DLG.snuffer_hushwood = {
    start: 'a',
    nodes: Object.assign({
      a: { who: 'narrator', text: 'Between the white trees, the Snuffer is sitting on a stone beside a grey little glimmer that was once someone. He rises when he sees you.', next: 'b' },
      b: { who: 'snuffer', text: ['Warden. Forgive me; I was keeping someone company.', 'She does not remember her name. Neither do I. So we sit.'], next: 'b2' },
      b2: { branch: [{ if: 'deaths>=1', next: 'b3' }, { next: 'c' }] },
      b3: { who: 'snuffer', text: ['You have lain down {$deaths} times since the crypt. Each time I came.', 'Each time you had got up before I arrived. It is most unusual. I have started walking faster.'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: `"Why not take her?"`, next: 'd1' },
        { text: `"The Hart. What is it?"`, if: '!boss_hart', next: 'd2' },
        { text: `"Is it lonely, your work?"`, next: 'd3' }
      ] },
      d1: { who: 'snuffer', text: ['I need a name, as your Chandler does. Without one I can only keep them company.', 'There are a great many in this wood. It is something, the company. I tell myself so.'], next: 'e' },
      d2: { who: 'snuffer', text: ['Aubrenn. A keeper of graves, before it was a keeper of anything else.', 'Be courteous to it, if you can manage. Few have been, lately.'], next: 'e' },
      d3: { who: 'snuffer', text: ['Lonely? No. I am with everyone at the end. That is a great many people to have met.', '…It is only that none of them stay to talk.'], next: 'e' },
      e: { who: 'snuffer', text: 'You, of course, have stayed a very long time. I should not want you to think I minded.', next: 'offer' }
    }, snufferOffer('hushwood',
      ['As you like. The wood will keep. Mind the fog; it has been known to follow people home.', 'Good evening, Warden.'],
      ['Here? Among the ferns? It is a kind place for it.', 'But I would be failing in courtesy if I did not ask twice. Are you sure?']))
  };

  DLG.snuffer_abbey = {
    start: 'a',
    nodes: Object.assign({
      a: { who: 'narrator', text: 'The Snuffer stands in the cloister rain without getting wet. He is looking toward the belfry as if listening for something.', next: 'b' },
      b: { who: 'snuffer', text: ['Warden. You have found the wet end of the kingdom.', 'I was here the night the water came. I was very busy.'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: `"You remember them?"`, next: 'd1' },
        { text: `"The bell."`, if: '!boss_hollin', next: 'd2' },
        { text: `"Water and fire. Which is worse?"`, next: 'd3' }
      ] },
      d1: { who: 'snuffer', text: ['Every one. It is the only thing I am permitted to keep.', 'Not everyone who came to this abbey drowned, Warden. I did not come for all of them.'], next: 'd1b' },
      d1b: { who: 'snuffer', text: 'I mention it only because I think you will want to have heard it, later.', next: 'e' },
      d2: { who: 'snuffer', text: ['Father Hollin. He is still ringing it. He thinks there is still somebody to warn.', 'I have tried to tell him. He cannot hear me over the bell.'], next: 'e' },
      d3: { who: 'snuffer', text: ['You would think one would undo the other. It never does.', 'I have held the hands of both. They say the same things, at the end. They ask for their mothers.'], next: 'e' },
      e: { who: 'snuffer', text: 'You are shivering, Warden. Or the armor is. It is difficult to tell with you.', next: 'offer' }
    }, snufferOffer('abbey',
      ['No. I did not think so. There is something in this place you have not finished reading.', 'Good evening.'],
      ['Here, in the rain, with the bell going?', 'I shall do it if you ask. I would only have you be sure. Are you?']))
  };

  DLG.snuffer_greyharrow = {
    start: 'a',
    nodes: Object.assign({
      a: { who: 'narrator', text: 'Among the pikes on the old line, the Snuffer stands with his hands folded, looking out over the field like a man at a room he once lived in.', next: 'b' },
      b: { who: 'snuffer', text: ['Warden. I thought you might come this way.', 'I stood on this ground the night you held it. Not beside you. Behind. Young men seldom look behind.'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: `"You were at Greyharrow?"`, next: 'd1' },
        { text: `"Odo."`, if: '!boss_odo', next: 'd2' },
        { text: `"What was I like?"`, next: 'd3' }
      ] },
      d1: { who: 'snuffer', text: ['I was. I took three hundred and eleven before dawn. Some of them were Carrow men. They were very polite about it.', 'You did not see me. You were busy being a song.'], next: 'e' },
      d2: { who: 'snuffer', text: ['Ser Odo is below, in the hill. He has been waiting as long as you have, in his fashion.', 'He was always the more patient of you. It surprised everyone.'], next: 'e' },
      d3: { who: 'snuffer', text: ['Funny. You were very funny that night. You told a joke about a Carrow goat that I will not repeat.', 'Ser Odo laughed until he wept, and then he only wept. I remember that as well.'], next: 'e' },
      e: { who: 'snuffer', text: 'You were not always this, Warden. I know it. I was there for all of it.', next: 'offer' }
    }, snufferOffer('greyharrow',
      ['Of course. There is a brother down there who has not had his say.', 'Good evening, Warden. Stand the line a little longer.'],
      ['On this field? It would have a kind of shape to it.', 'I only ask once more because I am required to, and because I would like to. Are you sure?']))
  };

  DLG.snuffer_wickward = {
    start: 'a',
    nodes: Object.assign({
      a: { who: 'narrator', text: 'In the Wickward the tags chime in the hot wind. The Snuffer is standing under them, very still, as if this were a church.', next: 'b' },
      b: { who: 'snuffer', text: ['Good evening, Warden. You found your way home.', 'I beg your pardon. That was unkind. I meant only that you were born four streets from here.'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: `"Who cursed me?"`, next: 'd1' },
        { text: `"Why won't I die?"`, next: 'd1' },
        { text: `"You were here. That night."`, next: 'd2' }
      ] },
      d1: { who: 'snuffer', text: ['Ah. Is that what you have been carrying about? That somebody did this to you?', 'Nobody cursed you, Warden.'], next: 'f' },
      d2: { who: 'snuffer', text: 'I was. I am always there.', next: 'd2b' },
      d2b: { who: 'snuffer', text: 'And since you are asking what happened to you, I shall tell you, though you will not like it. Nobody cursed you, Warden.', next: 'f' },
      f: { who: 'snuffer', text: ['You promised.', 'I was there. I am always there. I was at your elbow in Row 3, waiting to take you, and you would not be taken.'], next: 'g' },
      g: { who: 'snuffer', text: ['You closed your fist on a child\'s tag and said: {e}I will not lie down until every one of them is laid to rest.{/}', 'And the fire heard you. And so did I.'], next: 'h' },
      h: { who: 'brand', choices: [
        { text: `"Then break it."`, next: 'h1' },
        { text: `"I don't remember saying it."`, next: 'h2' },
        { text: '…', next: 'h3' }
      ] },
      h1: { who: 'snuffer', text: ['I cannot. It is not mine. A promise belongs to the one who made it.', 'I have only ever been able to ask. I shall ask now, if you like.'], next: 'offer' },
      h2: { who: 'snuffer', text: ['No. You were rather on fire at the time.', 'It was the most astonishing rudeness I have met in all my years of office. I have thought well of you ever since.'], next: 'h4' },
      h3: { who: 'snuffer', text: 'Yes. It is a great deal to be told in a street.', next: 'h4' },
      h4: { who: 'snuffer', text: 'A vow is a kind of name, Warden. You gave yourself one. It is yours to put down, whenever you are ready. I only hold the snuffer.', next: 'offer' }
    }, snufferOffer('wickward',
      ['No. Not here, of all places. I understand.', 'Row 3 is that way, Warden. You have always known where you would have to go.'],
      ['Here? With every one of them listening?', 'I would not think less of you. I only want you to be sure. Are you?']))
  };

  DLG.snuffer_pyre = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'The thing the ash remembers kneels in the fire, waiting. Beside it, as if he had been there all along, the Snuffer.', next: 'b' },
      b: { who: 'snuffer', text: ['It is waiting for you, Warden. So am I. We are both very patient.', 'I have never been asked to wait for anyone so long. I have not minded.'], next: 'c' },
      c: { who: 'snuffer', text: 'I should still ask. It would be discourteous not to, and it is the last time I shall. Shall I?', next: 'd' },
      d: { who: 'brand', choices: [
        { text: `"Not yet."`, next: 'e1' },
        { text: `"Yes."`, next: 'y1' }
      ] },
      e1: { who: 'snuffer', text: ['No. Of course. There is something left to decide.', 'Decide it, then. I shall be here. I am always here.'], next: 'e2' },
      e2: { do: ['dialogue:pyre_choice'], end: true },
      y1: { who: 'snuffer', text: ['Now? With it kneeling there, and the fire still going?', 'Nothing will be settled, Warden. The ash will still fall. Are you certain?'], next: 'y2' },
      y2: { who: 'brand', choices: [
        { text: `"Yes. Do it."`, next: 'y3' },
        { text: `"No. …Let me choose."`, next: 'e1' }
      ] },
      y3: { who: 'snuffer', text: 'Then hold still. You have done a great deal of standing, Warden. You may stop now.', next: 'y4' },
      y4: { who: 'narrator', do: ['sfx:snuff'], text: 'Long iron fingers close, very gently, around something inside the helm.', next: 'y5' },
      y5: { do: ['ending:quiet'], end: true }
    }
  };

  // ================================================================== Fenwick
  DLG.fenwick_shop = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: 'q_fenwick<1', next: 'first' }, { if: 'knows_letter && !cast_fen_runner', next: 'run0' }, { next: 'again' }] },
      first: { who: 'narrator', do: ['quest:fenwick=1'], text: 'A small man in a pilgrim\'s coat, under a pack three times his size, hung with bells and bones and bottles. He sees you and goes very still.', next: 'first2' },
      first2: { who: 'fenwick', text: [`Well! Well, well, well. Look at you. Tall, aren't you. Taller than I rememb— than I'd have imagined.`, `Up and about, too. Linnet's got a knack. Usually they stay where she puts them.`], next: 'first3' },
      first3: { who: 'fenwick', text: [`That helm. Lovely work. Old work. You don't see a wick on a helm anymore. Only ever the one, that I heard of.`, `…Heard of. In songs. Relics! Remedies! Reasonable! Fenwick, at your service, ser, whoever you are.`], next: 'menu' },
      again: { branch: [{ if: 'chapter>=2 && !cast_fen_g2', next: 'again2' }, { next: 'again1' }] },
      again1: { who: 'fenwick', text: `My favourite customer! My only customer, but I'd say it anyway. What'll it be?`, next: 'menu' },
      again2: { who: 'fenwick', do: ['set:cast_fen_g2'], text: [`You're off out the gate, I hear. East, west, south. All the nice places.`, `Take a candle. Take two. I'd come with you, but I've a very delicate constitution. It's mostly cowardice.`], next: 'menu' },
      run0: { who: 'fenwick', text: `There he is. You've a look about you. Well — a helm about you. Same thing. What'll it be?`, next: 'menu' },
      menu: { who: 'brand', choices: [
        { text: `"Show me your pack."`, next: 'shop' },
        { text: `"Do you know me?"`, if: '!cast_fen_know', next: 'know' },
        { text: `"Fenwick Moll. The runner."`, if: 'knows_letter && !cast_fen_runner', next: 'run1' },
        { text: 'Leave.', next: 'bye' }
      ] },
      shop: { who: 'fenwick', do: ['shop:fenwick'], text: `Everything blessed, most things genuine, nothing refunded. Mind the finger; it's holy.`, end: true },
      know: { who: 'fenwick', do: ['set:cast_fen_know'], text: [`Know you? Ser, I've walked every road in Lanthorn twice. I know everybody. That's not the same as knowing anybody.`, `Besides, you've not got a face. I'd be a fool to swear to a man with no face. I'm many things. Mostly not a fool.`], next: 'know2' },
      know2: { who: 'narrator', text: 'He laughs. His hands keep moving, straightening bottles that were straight already.', next: 'menu' },
      run1: { who: 'narrator', do: ['set:cast_fen_runner'], text: 'The bells on his pack stop jingling.', next: 'run2' },
      run2: { who: 'fenwick', text: [`Moll? No. Well. There's lots of Molls. Common as mud, Molls. You can't throw a boot in Hallowhearth without hitting one.`, `…Couldn't. When there was a Hallowhearth to throw boots in.`], next: 'run3' },
      run3: { who: 'fenwick', text: `Runner. Yes. I ran for the Chandlers, as a boy. Legs like a deer. Carried all sorts. You don't read what you carry. That's the job.`, next: 'menu' },
      bye: { who: 'fenwick', text: `Mind how you go! Or don't. You seem to come back regardless.`, end: true }
    }
  };

  DLG.fenwick_confront = {
    start: 'a',
    nodes: {
      a: { who: 'fenwick', text: `There he is! My favourite customer. Something for the road? I've a tallow stub that's practically a candle.`, next: 'b' },
      b: { who: 'brand', choices: [
        { text: `"Lenten Mere. The sluices."`, next: 'c' },
        { text: `"A fox on a satchel."`, next: 'c' },
        { text: `"Show me your pack."`, next: 'shop' }
      ] },
      shop: { who: 'fenwick', do: ['shop:fenwick'], text: `Something in your voice, ser. Nothing in your hands. Here. Look at the nice things.`, end: true },
      c: { who: 'narrator', text: 'Fenwick looks at you for a long moment. Then he sets his pack down, very gently, as if there were something asleep in it.', next: 'd' },
      d: { who: 'fenwick', text: [`…Ah.`, `You found Brother Wystan's log. Of course you did. Monks write everything down. It's a sickness.`], next: 'e' },
      e: { who: 'fenwick', text: [`I opened them. The Archchandler's seal on the order, my hands on the wheel. Three turns. I counted.`, `I heard the bell the whole way up the hill. I hear it now, some nights, when I'm nowhere near water.`], next: 'f' },
      f: { who: 'brand', choices: [
        { text: `"Why?"`, next: 'f1' },
        { text: `"There were children in that abbey."`, next: 'f2' },
        { text: '…', next: 'f3' }
      ] },
      f1: { who: 'fenwick', text: [`Because Ormund said the Cold Rite was heresy, and heresy was catching.`, `And because he paid. Both of those. Pick whichever makes you feel better about me. Neither does, for me.`], next: 'g' },
      f2: { who: 'fenwick', text: `I know. I carried their letters. I knew their names. That was the worst of it: I knew the names.`, next: 'g' },
      f3: { who: 'fenwick', text: `Say something. Go on. You're very good at silence, I'll grant you. You always were.`, next: 'g' },
      g: { who: 'fenwick', text: [`And since we're emptying our pockets, Warden—`, `Yes. Warden. I knew the helm the day Linnet's cart came through. There was only ever the one with a wick on it.`], next: 'h' },
      h: { who: 'fenwick', do: ['set:knows_letter', 'set:brand_named'], text: [`I carried the Prior's letter to the Seventh Gate. Rode two horses lame. I put it in your hand myself.`, `You looked at the seal. You put it in the brazier. You didn't even break the wax.`], next: 'i' },
      i: { who: 'fenwick', text: [`I never read it. Runners don't. I've wondered every night since what was in it.`, `You burned a letter, I turned a wheel. Neither of us lit the— …well. One of us lit the fire.`], next: 'j' },
      j: { who: 'narrator', text: 'He does not run. His hands are shaking so badly the bells on his pack have started up again, very softly.', next: 'k' },
      k: { who: 'brand', choices: [
        { text: 'Draw Vigil.', next: 'kill1' },
        { text: `"Go. Get out of my sight."`, next: 'spare1' },
        { text: `"Go to the chandlery. Tell her."`, next: 'tell1' }
      ] },
      kill1: { who: 'fenwick', text: [`Yes. …Yes, all right. That's fair. That's fair.`, `Only, not the pack. Somebody should have the pack.`], next: 'kill2' },
      kill2: { who: 'narrator', do: ['kill:self', 'set:fenwick_killed', 'hollow:+2', 'quest:fenwick=99'], text: 'It is very quick. The bells ring for a long while after, and then they stop.', end: true },
      spare1: { who: 'fenwick', text: [`Just— go? That's all?`, `…You were always hard to read, Warden. I'm going. North, I think. Nobody's left up there to look at me.`], next: 'spare2' },
      spare2: { who: 'narrator', do: ['set:fenwick_spared', 'set:fenwick_left', 'quest:fenwick=2'], text: 'He shoulders the pack and goes, fast, not looking back. The bells go with him up the north road until you cannot hear them.', end: true },
      tell1: { who: 'fenwick', text: [`Tell— Linnet? Why Linnet? What's she to do with—`, `…Her hands. Oh, Mother's wick. Her hands. She was at the abbey. She was in it.`], next: 'tell2' },
      tell2: { who: 'fenwick', text: `I'll go. I'll tell her. I don't know what she'll do. …I think I'd rather you'd drawn the sword.`, next: 'tell3' },
      tell3: { who: 'narrator', do: ['set:fenwick_confessed', 'set:fenwick_left', 'quest:fenwick=2'], text: 'He leaves the pack where it is and walks toward the chandlery with his hat in his hands, like a boy with a broken window.', end: true }
    }
  };

  DLG.fenwick_city = {
    start: 'a',
    nodes: {
      a: { branch: [{ if: '!cast_fen_ledger', next: 'first' }, { next: 'again' }] },
      first: { who: 'narrator', text: 'Fenwick has set his pack down on the steps of a burned house. He has not laid anything out. He jumps when you come near.', next: 'first2' },
      first2: { who: 'fenwick', text: `Oh. It's you. Of course it's you. Who else comes up here. Nobody alive, and the rest don't buy.`, next: 'first3' },
      first3: { branch: [{ if: 'fenwick_confessed', next: 'conf' }, { next: 'spar' }] },
      conf: { who: 'fenwick', text: [`I told her. Stood in her chandlery and said all of it, and then I cried like a wet dog.`, `She let me finish. She gave me a candle for the road. She didn't say a word. I'd have paid for a word. I'd have paid for a slap.`], next: 'led' },
      spar: { who: 'fenwick', text: [`You let me walk. I've been working out why for forty miles and I haven't got there.`, `Mercy's a bad trade, Warden. You're out a peddler, and you've nothing to show for it.`, `…Well. Not nothing.`], next: 'led' },
      led: { who: 'narrator', text: 'He digs in the very bottom of the pack and brings out a book bound in oiled calf, and holds it a moment too long.', next: 'led2' },
      led2: { who: 'fenwick', text: [`The Chandlers' ledger of the Wickward. Every row, every cot, every name. I lifted it from Ormund's own shelf, the week after.`, `I meant to sell it. Nineteen years I've meant to sell it. Take it. You've more use for names than I have.`], next: 'led3' },
      led3: { who: 'narrator', do: ['give:wickward_ledger', 'set:cast_fen_ledger', 'quest:fenwick=99'], text: 'It is heavier than it looks. Most of it is names.', next: 'menu' },
      again: { branch: [{ if: 'hollow_stage>=2', next: 'again2' }, { next: 'again1' }] },
      again1: { who: 'fenwick', text: [`Still open. If anybody asks. Nobody asks.`, `The Unlit come up the lane at night and sniff at the door. I tell them we're closed. They seem to accept it.`], next: 'menu' },
      again2: { who: 'fenwick', text: `You're… worse, aren't you. The light in there's gone thin. Don't look at me like that. I've no face to look back with either, most days.`, next: 'menu' },
      menu: { who: 'brand', choices: [
        { text: `"Show me your pack."`, next: 'shop' },
        { text: `"Why steal the ledger?"`, if: 'cast_fen_ledger && !cast_fen_why', next: 'why' },
        { text: `"Why come up here?"`, if: '!cast_fen_here', next: 'here' },
        { text: 'Leave.', next: 'bye' }
      ] },
      why: { who: 'fenwick', do: ['set:cast_fen_why'], text: [`Because it was the only thing in that scriptorium Ormund wanted kept. That was reason enough.`, `…And because somebody should know who was in there. It oughtn't to have been me.`], next: 'menu' },
      here: { who: 'fenwick', do: ['set:cast_fen_here'], text: [`Where else? The Rest has her in it. The Mere has the water in it.`, `Up here it's only the dead, and the dead don't look at you. Mostly.`], next: 'menu' },
      shop: { who: 'fenwick', do: ['shop:fenwick'], text: `Buy something. It helps me pretend.`, end: true },
      bye: { who: 'fenwick', text: `Keep your flame, Warden. Somebody should.`, end: true }
    }
  };
})(window.AV);
