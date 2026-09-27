// ASHEN VOW — Greyharrow: the field, the roll of the Harrow company, Hesk's fire and Ser Odo Varr (builder: GREYHARROW)
(function (AV) {
  'use strict';
  const D = AV.data;
  const GHOST = '#82a8ad';

  // ================================================================== records
  const ROLL = [
    '\'THE HARROW COMPANY. Mustered at Greyharrow under Ser Odo Varr. Stood to: one hundred and forty. Stood down: thirty-one.\'',
    '\'Aske, T. — in the night. Colley, J., Dunstan, R. — at first light, in the gap. Pell, W. Quennell, A. — cannot find him. Keep looking.\'',
    '\'Marlow, H. — pensioned. Knee. Says he will be back for the next one. There is not going to be a next one, Hob.\'',
    '\'Varr, O. — gone south with the Shield, to hold it until told otherwise. Nobody has told him otherwise.\'',
    'The last pages are one line, over and over, in a hand that gets steadier as it goes: \'Brand, E. — absent.\' \'Brand, E. — absent.\'',
    'At the very bottom, smaller, as if the writer did not want the others to see: \'Keep his place.\'',
  ];
  const CHARTER = [
    '\'Be it known that Emeric Brand, chandler\'s son, of the Wickward in Hallowhearth, held the Harrow line at Greyharrow a night and a day, and did not give it up.\'',
    '\'Rise, Ser Emeric, Shield of Greyharrow. Keep the line. Keep faith.\' — Aldemar, King. The signature is very large. The seal is very small.',
    'On the back, in a soldier\'s hand: \'Took this off the gatehouse wall the night of the gate. Keeping it till he wants it back. He will. — O.\'',
  ];
  const SONG = [
    '\'Oh, the Harrow is long, and the Harrow is grey, / and Carrow come up it by night and by day.\'',
    '\'We\'ll hold it, says Odo, and Brand says the same, / and the crows on the stakes laughed and called it a game.\'',
    '\'Now Brand\'s got a gate, and a hat with a wick, / and Odo\'s got medals, and one leg that\'s quick.\'',
    'There is one more verse. It has been scratched out, hard, many times, by someone who knew it by heart. One word survives: GATE.',
  ];
  const PIKE_NOTE = [
    '\'To my two, at the house with the blue door, Tallow Lane. Your da is well. The food is bad. There is a man in our company who snores like a sow in a bucket.\'',
    '\'Here is the whistle I promised. Three short and one long, and the dog comes home. Do not let him eat it. He will try.\'',
    '\'If the sergeant sends this and not me, then mind your mother, and keep the dog off the bed. I love you both more than all the stars. Even the ugly ones.\'',
    '\'— Jory. Corporal. (Your mother will tell you that is not very important. She is right.)\'',
  ];

  // ================================================================== items
  D.items.tag_field = {
    name: 'Tin Tag: Hob Marlow', kind: 'tag', icon: 'icon_tag',
    desc: 'HOB MARLOW — ROW 6, COT 20. Pikeman of the Harrow, pensioned off with a bad knee and a good story. The ash carried him back to the line he held.',
  };
  D.items.tag_crypt = {
    name: 'Tin Tag: Pip Ashcombe', kind: 'tag', icon: 'icon_tag',
    desc: 'PIP ASHCOMBE — ROW 2, COT 5. Drummer to the Harrow company at fourteen. Twenty-one when the grey took him, and they still called him the boy.',
  };
  D.items.lore_g_fallen = {
    name: 'The Harrow Roll', kind: 'lore', icon: 'icon_book',
    desc: 'The company roll of the Harrow, kept by Sergeant Barrow and afterwards by whoever could still write. Brown with handling.',
    read: ROLL,
  };
  D.items.lore_g_shield = {
    name: 'The Knighting Charter', kind: 'lore', icon: 'icon_scroll',
    desc: 'Folded small behind the grip of your old shield, where someone put it to keep it safe. The shield stayed on its pegs. It had waited long enough to be left a little longer.',
    read: CHARTER,
  };
  D.items.lore_g_song = {
    name: 'The Harrow Song', kind: 'lore', icon: 'icon_note',
    desc: 'Copied off the inside of a dead man\'s shield. A marching song. Nobody who marched to it is marching now.',
    read: SONG,
  };
  D.items.lore_g_pike_note = {
    name: 'An Unsent Letter', kind: 'lore', icon: 'icon_note',
    desc: 'Folded to the size of a thumb and carried in a corporal\'s coat. Addressed to Tallow Lane, the house with the blue door. It never went.',
    read: PIKE_NOTE,
  };

  // ================================================================== quest
  D.quests.rollcall = {
    title: 'The Roll of the Harrow', kind: 'side',
    stages: {
      1: 'In the ossuary at Greyharrow, the dead of the Harrow company still stand to for the roll. They have been stuck on one name for nineteen years. Yours.',
      99: 'The roll of the Harrow company will not be called again.',
    },
  };

  // ================================================================== speakers
  D.speakers.odo = { name: 'Ser Odo', portrait: 'odo', color: '#a88a48', voice: 0.6 };
  D.speakers.g_sergeant = { name: 'Sergeant Barrow', portrait: 'ghost_soldier', color: GHOST, voice: 0.5 };
  D.speakers.g_ranks = { name: 'The Ranks', portrait: 'ghost_soldier', color: GHOST, voice: 0.8 };
  D.speakers.g_soldier = { name: 'Harrow Pikeman', portrait: 'ghost_soldier', color: GHOST, voice: 0.95 };

  // ================================================================== npcs
  D.npcs.odo = {
    name: 'Ser Odo', sprite: 'boss_odo', portrait: 'odo', solid: true, anim: 'sit',
    light: { r: 44, color: '#f59a36', intensity: 0.55, flicker: 0.15, oy: -14 },
    talk: [{ dialogue: 'g_odo_intro' }],
    barks: [{ text: '…sixty-one. Sixty-two…' }, { text: '…one short. Again.' }, { text: '…Harrow holds…' }],
  };
  D.npcs.g_sergeant = {
    name: 'Sergeant Barrow', sprite: 'npc_ghost_soldier', portrait: 'ghost_soldier', solid: false, anim: 'idle',
    talk: [
      { if: 'seen_g_rollcall', dialogue: 'g_rollcall_again' },
      { dialogue: 'g_rollcall' },
    ],
    barks: [{ text: '…Brand, E.!…' }, { text: '…stand to…' }],
  };
  D.npcs.g_soldier = {
    name: 'Harrow Pikeman', sprite: 'npc_ghost_soldier', portrait: 'ghost_soldier', solid: false, anim: 'idle',
    talk: [{ dialogue: 'g_soldier' }],
    barks: [{ text: '…here…' }, { text: '…eyes front…' }, { text: '…hold the gap…' }],
  };

  // ================================================================== the field
  D.dialogue.g_field_enter = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'Greyharrow Field. The grass never came back after the battle. The crows did.', next: 'b' },
      b: { who: 'narrator', text: 'The wind comes flat across the stakes, the way it did then, smelling of wet iron.', next: 'c' },
      c: { who: 'brand', text: '…A night and a day.' },
    },
  };

  D.dialogue.g_line_memory = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'A gap in the stakes, just wide enough for two men with shields. The stakes were new, the last time you stood in it.', next: 'b' },
      b: { who: 'narrator', text: 'Someone stood here beside you and laughed through a whole night of arrows. You never asked him why.' },
    },
  };

  // ================================================================== Hesk (first meeting, re-talks, farewell)
  D.dialogue.g_hesk = {
    start: 'st',
    nodes: {
      st: { branch: [
        { if: 'boss_odo && g_hesk_met', next: 'af1' },
        { if: 'boss_odo', next: 'fa1' },
        { if: 'g_hesk_met', next: 'ag' },
        { next: 'f1' },
      ] },

      // ---- first meeting
      f1: { who: 'narrator', text: 'A man sits by the fire with a halberd across his knees and a bottle in the crook of his arm, like a baby he is tired of holding.', do: ['set:g_hesk_met'], next: 'f2' },
      f2: { who: 'hesk', text: "That's close enough. Or closer. I can't stop you, can I. Look at the size of you.", next: 'f3' },
      f3: { who: 'hesk', text: ["That's a Warden's helm. Seventh Gate pattern.", "…Lot of dead men's kit walking about, these days. I don't ask whose. Sit, if you're sitting."], next: 'hub' },

      hub: { branch: [{ if: 'g_hk_who && !g_hk_wall', next: 'hubB' }, { next: 'hubA' }] },
      hubA: { who: 'brand', choices: [
        { text: '"Who are you?"', if: '!g_hk_who', next: 'w1' },
        { text: '"Why camp here, of all places?"', if: '!g_hk_why', next: 'y1' },
        { text: '"What\'s in the hill?"', if: '!g_hk_hill', next: 'k1' },
        { text: 'Leave.', next: 'bye' },
      ] },
      hubB: { who: 'brand', choices: [
        { text: '"You stood the wall. That night."', next: 'l1' },
        { text: '"Why camp here, of all places?"', if: '!g_hk_why', next: 'y1' },
        { text: '"What\'s in the hill?"', if: '!g_hk_hill', next: 'k1' },
        { text: 'Leave.', next: 'bye' },
      ] },

      w1: { who: 'hesk', text: "Hesk. Hesketh, if you're my mother, and you're not. You're uglier, and she's dead.", next: 'w2' },
      w2: { who: 'hesk', text: 'Watchman. Was. Eleven years on the wall of the Seventh Gate. Then one night I climbed down off it and kept walking.', do: ['set:g_hk_who'], next: 'w3' },
      w3: { who: 'brand', choices: [
        { text: '"A deserter."', next: 'w4' },
        { text: '"The night of the Kindling."', next: 'l1' },
      ] },
      w4: { who: 'hesk', text: "Deserted what? Show me the army. I'll go back and say sorry to it.", next: 'hub' },

      l1: { who: 'hesk', text: '…', next: 'l2' },
      l2: { who: 'hesk', text: "I stood it. That's all standing is. You don't do anything. You stand there, and it happens underneath you.", next: 'l3' },
      l3: { who: 'hesk', text: "My wife was on the other side. Bett. She'd a cough, that's all. A cough, and a grey thumb she kept in her apron.", next: 'l4' },
      l4: { who: 'hesk', text: "That's enough of that.", do: ['set:g_hk_wall'], next: 'l5' },
      l5: { who: 'brand', choices: [
        { text: '"I\'m sorry."', next: 'l6', lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]' },
        { text: '"What did you see, from the wall?"', next: 'l7' },
        { text: 'Say nothing.', next: 'l8' },
      ] },
      l6: { who: 'hesk', text: "Everybody's sorry. Sorry's cheap. I'd have taken cheap, that night.", next: 'hub' },
      l7: { who: 'hesk', text: ['Fire. What do you think I saw.', '…Other things. Not tonight. Maybe not ever. Ask me somewhere with a roof on it.'], next: 'hub' },
      l8: { who: 'narrator', text: "He doesn't look at you. It seems to be meant as a kindness.", next: 'hub' },

      y1: { who: 'hesk', text: "Nobody comes here. That's the first reason. Good reason.", next: 'y2' },
      y2: { who: 'hesk', text: ["Second reason's in the hill. Ser Odo Varr. Only man on the gate that night who tried to open it instead of shut it.", 'They put him down for it.'], next: 'y3' },
      y3: { who: 'hesk', text: "Somebody ought to sit up with him. I'm somebody. Just about.", do: ['set:g_hk_why'], next: 'y4' },
      y4: { who: 'brand', choices: [
        { text: '"…Odo."', next: 'y5' },
        { text: '"Did you know him?"', next: 'y6' },
      ] },
      y5: { who: 'hesk', text: "You knew him? …Then you know he'd hate this. Me, pickled, on his doorstep. Good. Serves him right.", next: 'hub' },
      y6: { who: 'hesk', text: "To nod to. He'd nod back. More than most knights managed. I liked him for it.", next: 'hub' },

      k1: { who: 'hesk', text: 'The ossuary. Where they stacked the Harrow dead, after. Thousands of them. Neat as firewood.', next: 'k2' },
      k2: { who: 'hesk', text: "There's a door at the bottom. He sits behind it, counting. On a still night you can hear him from here.", next: 'k3' },
      k3: { who: 'hesk', text: "Door's locked. The company passed the key round, a week each. Whoever's week it was is still down there with it. West side.", next: 'k4' },
      k4: { who: 'hesk', text: "Don't go down there for whatever it is you're after. Go down for him. Or don't go.", do: ['set:g_hk_hill'], next: 'hub' },

      bye: { branch: [{ if: 'g_hk_bye', next: 'bye2' }, { next: 'bye1' }] },
      bye1: { who: 'hesk', text: "Mind the crows. They remember faces.", do: ['set:g_hk_bye'] },
      bye2: { branch: [{ if: 'deaths>=3', next: 'bye3' }, { next: 'bye4' }] },
      bye3: { who: 'hesk', text: "Try not to fall apart. I've seen you do it. It's not dignified." },
      bye4: { who: 'hesk', text: 'Mind yourself.' },

      // ---- re-talks, before the hill goes quiet
      ag: { branch: [
        { if: 'rollcall_answered && !g_hk_drum', next: 'dr1' },
        { if: 'rollcall_broken && !g_hk_drum', next: 'dr2' },
        { if: 'g_hesk_n==0', next: 'a0' },
        { if: 'g_hesk_n==1', next: 'a1' },
        { if: 'g_hesk_n==2', next: 'a2' },
        { if: 'deaths>=5', next: 'a4' },
        { next: 'a3' },
      ] },
      dr1: { who: 'hesk', text: ['The drum stopped, down in the hill. First time in years.', "…Don't tell me. I'd only have to think about it."], do: ['set:g_hk_drum'], next: 'hub' },
      dr2: { who: 'hesk', text: ['Heard something break, in the hill. Then shouting. Old shouting. Parade-ground.', "Whatever you did, don't tell me. I was having a quiet evening."], do: ['set:g_hk_drum'], next: 'hub' },
      a0: { who: 'hesk', text: 'Back. Everybody comes back to a fire. Moths and fools.', do: ['add:g_hesk_n=1'], next: 'hub' },
      a1: { who: 'hesk', text: 'Crows live thirty years, did you know? Some of these were here for the battle. Look at them. Smug.', do: ['add:g_hesk_n=1'], next: 'hub' },
      a2: { who: 'hesk', text: "I used to sing, on the wall. Bett said I sounded like a gate that wanted oil. …She wasn't wrong.", do: ['add:g_hesk_n=1'], next: 'hub' },
      a3: { who: 'hesk', text: "Still here. So's the field. So's he.", next: 'hub' },
      a4: { who: 'hesk', text: "You look worse every time you come back. I didn't think that was possible. Credit to you.", next: 'hub' },

      // ---- first meeting, when Odo is already at rest
      fa1: { who: 'narrator', text: 'A man sits by the fire with a halberd across his knees, watching the hill as though it owes him money.', do: ['set:g_hesk_met'], next: 'fa2' },
      fa2: { who: 'hesk', text: 'It stopped. The counting. I could hear it at night, when the wind was right. Tonight it stopped.', next: 'fa3' },
      fa3: { who: 'hesk', text: "That'd be you, I expect. Big lad. Wick on your head. Warden's pattern, that helm.", next: 'fa4' },
      fa4: { who: 'brand', choices: [
        { text: '"Who are you?"', next: 'fw' },
        { text: '"Who was counting?"', next: 'fo' },
      ] },
      fw: { who: 'hesk', text: ['Hesk. Watchman, once. Seventh Gate.', 'My wife was on the wrong side of it, the night of the fire. So I stopped watching.'], do: ['set:g_hk_who', 'set:g_hk_wall'], next: 'af3' },
      fo: { who: 'hesk', text: ['Ser Odo Varr. Only man that night who tried to open the gate instead of shut it.', "I've been sitting up with him. Somebody had to."], do: ['set:g_hk_why'], next: 'af3' },

      // ---- after Odo: Hesk goes north
      af1: { who: 'narrator', text: 'Hesk is on his feet. The bottle is corked. For him, this appears to be a great deal.', next: 'af2' },
      af2: { who: 'hesk', text: "It's gone quiet down there. First time in… well. You'd know better than me what you did.", next: 'af3' },
      af3: { branch: [{ if: 'odo_named', next: 'an' }, { if: 'odo_devoured', next: 'ad' }, { next: 'al' }] },
      an: { who: 'hesk', text: "You said his name? Out loud, the proper way? …Good. Somebody should have, years back. Should've been me.", next: 'go' },
      ad: { who: 'hesk', text: ["You're giving off heat like a forge. Stand downwind of me.", "…I don't want to know. I'll drink to him anyway."], next: 'go' },
      al: { who: 'hesk', text: "You left him down there? …Maybe that's right. He always did like his company better than anyone's.", next: 'go' },
      go: { who: 'hesk', text: 'Well. Nothing keeping me now.', next: 'go2' },
      go2: { who: 'brand', choices: [
        { text: '"Where will you go?"', next: 'go3' },
        { text: '"Come north with me."', next: 'go4' },
      ] },
      go3: { who: 'hesk', text: 'North. Everybody with a sword and no sense ends up going north.', next: 'go5' },
      go4: { who: 'hesk', text: ["With you? I've seen what happens to people who walk with you. Look at the hill.", "…Still. North's north."], next: 'go5' },
      go5: { who: 'hesk', text: "You'll be for the Seventh Gate, I expect. Knights always are. Big door. Good for standing in front of.", next: 'go6' },
      go6: { who: 'hesk', text: "I'll meet you there. Somebody ought to see it opened who saw it shut.", do: ['set:hesk_waits'], next: 'go7' },
      go7: { who: 'narrator', text: 'He kicks ash over the fire, out of habit. It goes on burning underneath. Everything does, now.' },
    },
  };

  // ================================================================== the ossuary & the roll call
  D.dialogue.g_ossuary_enter = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'Bones, stacked to the roof in courses, like a wall someone was proud of. Long bones laid lengthways. Skulls in the gaps, all facing out.', next: 'b' },
      b: { who: 'narrator', text: 'Deeper in the hill, a drum is beating. Slowly. Like something that has waited a long time, and can wait longer.' },
    },
  };

  // the three ways a roll call can end, shared by the first call and every call after
  function rollcallEnd() {
    return {
      choice: { who: 'brand', choices: [
        { text: '"Here."', next: 'h1' },
        { text: 'Put your fist through the drum.', next: 'x1' },
        { text: 'Say nothing.', next: 'n1' },
      ] },
      h1: { who: 'brand', text: 'Here.', next: 'h2' },
      h2: { who: 'narrator', text: 'The word goes down the ranks like a dropped coin rolling. Somebody at the back lets out a breath he has held for nineteen years.', next: 'h3' },
      h3: { who: 'g_sergeant', text: '…Late on parade, sir.', next: 'h4' },
      h4: { who: 'g_sergeant', text: 'Colley, J.! …Ah, sod it. You all know who you are. Company — stand down.', next: 'h5' },
      h5: { who: 'narrator', text: 'They do not march off. They just stop standing, one by one, and settle into the bones like men sitting down at the end of a long day.',
        do: ['set:rollcall_answered', 'hollow:-1', 'quest:rollcall=99'], next: 'h6' },
      h6: { who: 'narrator', text: 'The drum gives one last soft beat, the kind you would give a friend on the shoulder.' },

      x1: { who: 'brand', text: 'Enough.', next: 'x2' },
      x2: { who: 'narrator', text: 'The drumhead splits under your fist with a sound like a rib going.', do: ['sfx:break_wall', 'shake:4'], next: 'x3' },
      x3: { who: 'g_sergeant', text: '…Harrow! Harrow, stand to! Hold the gap!', next: 'x4' },
      x4: { who: 'narrator', text: 'The ranks lower their pikes toward the gap in the front rank. Toward you. They were always going to hold it against somebody.',
        do: ['set:rollcall_broken', 'hollow:+1', 'quest:rollcall=99',
          'spawn:shieldbound:20:15', 'spawn:pikeman:23:15', 'spawn:shieldbound:18:18', 'spawn:pikeman:25:18'] },

      n1: { who: 'g_sergeant', text: '…Mark him absent.', next: 'n2' },
      n2: { who: 'g_ranks', text: 'Absent.', next: 'n3' },
      n3: { who: 'narrator', text: 'The drum takes up its beat again. Somewhere in the grey ranks, somebody starts again from A.' },
    };
  }

  D.dialogue.g_rollcall = {
    start: 'a',
    nodes: Object.assign({
      a: { who: 'narrator', text: 'The drum begins before you see it. One beat. Another. There is no hand on the sticks.', do: ['quest:rollcall=1'], next: 'b' },
      b: { who: 'narrator', text: 'Grey shapes stand up out of the bones and shuffle into ranks. Pikemen. Shieldmen. Boys with no chins. The front rank has a gap in it, one man wide.', next: 'c' },
      c: { who: 'g_sergeant', text: 'Harrow company! Stand to, you idle heap of bones!', next: 'd' },
      d: { who: 'g_sergeant', text: 'Aske, T.!', next: 'e' },
      e: { who: 'g_ranks', text: 'Here.', next: 'f' },
      f: { who: 'g_sergeant', text: 'Barrow, M.! …Here. Obviously.', next: 'g' },
      g: { who: 'g_sergeant', text: 'Brand, E.!', next: 'h' },
      h: { who: 'narrator', text: 'The drum stops. Every head in the ranks turns, slowly, toward the gap in the front rank. Then toward you.', next: 'i' },
      i: { who: 'g_sergeant', text: 'Brand, E.!', next: 'j' },
      j: { who: 'g_sergeant', text: '…Nineteen years, this. Nineteen years, and we have not got past B.', next: 'choice' },
    }, rollcallEnd()),
  };

  D.dialogue.g_rollcall_again = {
    start: 'a',
    nodes: Object.assign({
      a: { who: 'g_sergeant', text: 'Brand, E.!', next: 'b' },
      b: { who: 'narrator', text: 'The gap in the front rank is still there. It has been kept very carefully.', next: 'choice' },
    }, rollcallEnd()),
  };

  D.dialogue.g_soldier = {
    start: 'st',
    nodes: {
      st: { branch: [
        { if: 'g_sold_n==0', next: 's0' },
        { if: 'g_sold_n==1', next: 's1' },
        { if: 'g_sold_n==2', next: 's2' },
        { next: 's3' },
      ] },
      s0: { who: 'g_soldier', text: ["Eyes front. Sarge sees you talking, it's latrines.", "…Do the dead dig latrines? Don't tell him I asked."], do: ['add:g_sold_n=1'] },
      s1: { who: 'g_soldier', text: "They made you a knight, after. Didn't they. …Knew it. Colley owes me a shilling.", do: ['add:g_sold_n=1'] },
      s2: { who: 'g_soldier', text: "We held. Didn't we? Tell me we held.", do: ['add:g_sold_n=1'], next: 's2c' },
      s2c: { who: 'brand', choices: [
        { text: '"We held."', next: 's2a' },
        { text: 'Say nothing.', next: null },
      ] },
      s2a: { who: 'g_soldier', text: "…Good. Good. That's all right, then." },
      s3: { who: 'narrator', text: 'He is answering a name that was called a long time ago. …here… here…' },
    },
  };

  // ================================================================== the heart of the hill: Ser Odo Varr
  D.dialogue.g_heart_enter = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'The heart of the hill is a round chamber roofed with shields, thousands of them, nailed rim to rim like the scales of something very large.', next: 'b' },
      b: { who: 'narrator', text: 'At the far end, on a heap of bent iron and bone, a knight sits with his elbows on his knees. He is counting under his breath.', next: 'c' },
      c: { who: 'odo', text: '…ninety-eight. Ninety-nine. …Somebody is walking on my floor.' },
    },
  };

  D.dialogue.g_odo_intro = {
    start: 'a',
    nodes: {
      a: { who: 'odo', text: "Another one come for the stone? Sit down. I'll get to you. I'm counting.", next: 'b' },
      b: { who: 'brand', choices: [
        { text: '"Counting what?"', next: 'c1' },
        { text: '"Odo."', next: 'c3' },
        { text: '"Stand up."', next: 'c2' },
      ] },
      c1: { who: 'odo', text: "The company. Every night. I get to the end and there's one short, so I go back to the start.", next: 'd' },
      c2: { who: 'odo', text: "In a minute. It's been a long time since anyone told me to do anything. Let me enjoy it.", next: 'd' },
      c3: { who: 'odo', text: '…', next: 'd' },
      d: { who: 'narrator', text: 'He lifts his head. His visor has run like wax and set again; light leaks out through the cracks. It finds your helm, and stays there.', next: 'e' },
      e: { who: 'odo', text: '…Oh, no. No, no, no. I know that walk.', next: 'f' },
      f: { who: 'odo', text: 'Em.', do: ['set:brand_named'], next: 'g' },
      g: { who: 'odo', text: 'They put a wick on your head and you went and lit it. Course you did. You never could leave a candle alone.', next: 'h' },
      h: { who: 'brand', choices: [
        { text: '"I don\'t know you."', next: 'h1' },
        { text: '"It\'s me, Odo."', next: 'h2' },
        { text: '"I missed you."', next: 'h3', lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]' },
        { text: '"Give me the stone."', next: 'h4' },
      ] },
      h1: { who: 'odo', text: 'Liar. You never could do that either. You go all still, like a heron with a secret.', next: 'k' },
      h2: { who: 'odo', text: "I know it's you. I'm not blind. I'm dead. There's a difference, they tell me.", next: 'k' },
      h3: { who: 'odo', text: "…Don't. Don't you dare go first. I've had nineteen years to decide what I'd say first, and it wasn't that.", next: 'k' },
      h4: { who: 'odo', text: 'Straight to business. You always were better at the war than the peace, Em.', next: 'k' },
      k: { who: 'odo', text: 'Remember the Harrow? A night and a day, and you making jokes the whole time. Terrible ones. Horse jokes.', next: 'l' },
      l: { who: 'odo', text: "I laughed so I wouldn't wet myself. You thought I laughed because you were funny. I let you think it. That's brotherhood.", next: 'm' },
      m: { who: 'brand', choices: [
        { text: '"Everyone laughed at the horse one."', next: 'm1' },
        { text: 'Say nothing.', next: 'n' },
      ] },
      m1: { who: 'odo', text: 'The horse laughed at the horse one. …All right. It was a good one.', next: 'n' },
      n: { who: 'odo', text: 'Then the King gave you a gate, and I came along to keep you out of trouble. You see how that went.', next: 'o' },
      o: { who: 'odo', text: "Last Vigil. I was in the gatehouse when a runner came up the stair. Chandlers' boy. A letter sealed with a little bell.", next: 'p' },
      p: { who: 'odo', text: "You held it over the brazier. You didn't even break the wax.", next: 'q' },
      q: { who: 'odo', text: 'That night the order came down. Seal it. Hold it. Let nothing out. And I said no. First time in my life, I said no to you.', next: 'r' },
      r: { who: 'odo', text: 'I had the bar halfway up. Halfway. And you put me in the mud with your pommel. Just here.', next: 's' },
      s: { who: 'narrator', text: 'He touches the side of his helm. The iron is dented inward there, and has been for a very long time.', next: 't' },
      t: { who: 'odo', text: ["Nineteen years down here to wonder what was in that letter. So I'll ask.", 'Did you even read it, Em?'], next: 'u' },
      u: { who: 'brand', choices: [
        { text: '"No."', next: 'u1' },
        { text: '"It would have changed nothing."', next: 'u2' },
        { text: '"I don\'t remember."', next: 'u3' },
        { text: '"I\'m sorry, Odo."', next: 'u4', lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]' },
      ] },
      u1: { who: 'odo', text: "…No. Course not. You'd already decided. You always had, by the time anyone asked you.", next: 'v' },
      u2: { who: 'odo', text: "You don't know that. That's the whole of it, isn't it? You don't know. You made very sure you'd never know.", next: 'v' },
      u3: { who: 'odo', text: 'Convenient. I remember. Nothing to do down here but remember.', next: 'v' },
      u4: { who: 'odo', text: "I know you are. It's coming off you like smoke. Doesn't change what I'm for.", next: 'v' },
      v: { who: 'odo', text: "The Shield's in here with me. They gave it me to hold. So I'm holding.", next: 'w' },
      w: { who: 'narrator', text: 'He stands. It takes a long time. Iron grinds on iron. The shield on his arm is not strapped there any more. It grew.', next: 'x' },
      x: { who: 'odo', text: 'Come on, then, Em. Take it. Like you took the gate.', do: ['set:g_odo_armed', 'set:odo_fight', 'boss:boss_odo'] },
    },
  };

  // after a death mid-fight: he is on his feet and waiting when you come back in
  D.dialogue.g_odo_again = {
    start: 'st',
    nodes: {
      st: { branch: [{ if: 'g_odo_n==0', next: 'a0' }, { if: 'g_odo_n==1', next: 'a1' }, { next: 'a2' }] },
      a0: { who: 'odo', text: "Back again. Good. I wasn't finished.", next: 'go' },
      a1: { who: 'odo', text: 'You come back like a bad penny, Em. A bad penny with a sword.', next: 'go' },
      a2: { who: 'odo', text: '…Again? All right. All right, Em. Again.', next: 'go' },
      go: { who: 'narrator', text: 'He lifts the shield that is his arm.', do: ['add:g_odo_n=1', 'set:g_odo_armed', 'boss:boss_odo'] },
    },
  };

  D.dialogue.g_odo_after = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'He goes down on one knee, the way he did in the mud at the gate. This time he stays there.', next: 'b' },
      b: { who: 'odo', text: "Harrow held, Em. …Tell them it held. They like to hear it.", next: 'c' },
      c: { who: 'odo', text: "The King's order. That's what they called it, after. Everyone. The King's order.", next: 'd' },
      d: { who: 'odo', text: ['I stood the council door that day. Doors are thin.', '"Every day we wait, the grey climbs the wall." …Whose voice was that, Em?'], do: ['set:knows_proposal'], next: 'e' },
      e: { who: 'brand', choices: [
        { text: '"Mine."', next: 'e1' },
        { text: 'Say nothing.', next: 'e2' },
      ] },
      e1: { who: 'odo', text: '…Yes. I know. I only wanted to hear you say it once.', next: 'f' },
      e2: { who: 'odo', text: "That's all right. I knew anyway. I only wanted to hear you say it.", next: 'f' },
      f: { who: 'narrator', text: 'His helm tips forward. The light in him comes out through the cracks, slow as breath, and gathers over the heap of shields: a small flame, burning low.', next: 'g' },
      g: { who: 'brand', choices: [
        { text: '"Odo Varr."', next: 'n1' },
        { text: 'Draw the flame into the armor.', next: 'v1' },
        { text: 'Leave him with his company.', next: 'l1' },
      ] },
      n1: { who: 'brand', text: ['Odo Varr. Ser Odo, of the Harrow line. …My brother.', 'Go home, Odo. The dark is shorter than it looks.'], next: 'n2' },
      n2: { who: 'odo', text: '…Heh. You always did have to get the last word.', next: 'n3' },
      n3: { who: 'narrator', text: "The flame leans toward you once, the way a man leans in to clap your shoulder. Then it goes out.", do: ['sfx:snuff', 'set:odo_named', 'hollow:-2'], next: 'n4' },
      n4: { who: 'narrator', text: 'Where it burned, on the rim of a shield, lies an iron seal-ring: a boar over a broken spear. Still warm.', do: ['give:odo_seal'], next: 'stone' },
      v1: { who: 'narrator', text: 'You open the cracked pauldron. He does not fight it. That is the worst part.', next: 'v2' },
      v2: { who: 'narrator', text: 'The flame goes in, and for a moment you hear him laughing at something you said on the Harrow, long ago. Then only the fire.',
        do: ['set:odo_devoured', 'hollow:+3', 'give:stolen_ember'], next: 'stone' },
      l1: { who: 'narrator', text: 'You leave him with them. The small flame settles over the heap of shields, where the company can see it.', do: ['set:odo_left'], next: 'stone' },
      stone: { who: 'narrator', text: 'In the hollow of the fused shield, where his heart would be, sits a stone cut like a kite shield and scored with the lines of the Harrow.', do: ['give:shield_stone'], next: 'stone2' },
      stone2: { who: 'narrator', text: 'The Shield Wardstone. He held it until he was told otherwise.' },
    },
  };

  D.dialogue.g_odo_flame = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: "Over the heap of shields, Odo's flame is still burning, low and patient. It flares a little when you come near. It always did.", next: 'b' },
      b: { who: 'brand', choices: [
        { text: '"Odo Varr."', next: 'n1' },
        { text: 'Leave him with his company.', next: null },
      ] },
      n1: { who: 'brand', text: ['Odo Varr. Ser Odo, of the Harrow line. My brother.', 'Go home, Odo. The dark is shorter than it looks.'], next: 'n2' },
      n2: { who: 'narrator', text: 'The flame leans toward you once. Then it goes out, and on the shield where it burned lies an iron seal-ring, still warm.',
        do: ['sfx:snuff', 'set:odo_named', 'unset:odo_left', 'hollow:-2', 'give:odo_seal'] },
    },
  };

  // ================================================================== the company tomb
  D.dialogue.g_crypt_enter = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'A tomb cut into the hill, and kept. The floor is swept. The candles are new, or new enough. Someone has been coming here.', next: 'b' },
      b: { who: 'narrator', text: 'On every wall, the Harrow badge, over and over: a flame above a shield.' },
    },
  };

  D.dialogue.g_crypt_altar = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'Cut into the altar-stone: FOR THE HARROW, WHO HELD. Beneath it, a list of names too long to read by candlelight.', next: 'b' },
      b: { branch: [{ if: 'has:ashen_sigil', next: 'c2' }, { next: 'c1' }] },
      c1: { who: 'narrator', text: 'In front of the list, a disc of fused ash sits on its own, where a man kneeling to pray would see it first.' },
      c2: { who: 'narrator', text: 'Where the sigil lay, the dust keeps the shape of a small circle, and of nothing else.' },
    },
  };
})(window.AV);
