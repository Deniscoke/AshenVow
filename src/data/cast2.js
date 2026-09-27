// ASHEN VOW — CAST, part two: Hesk the watchman (the Seventh Gate, the upper city, the Wickward stair, afterwards)
// and the choice at the Pyre. CAST-local ids are prefixed cast_ (speakers cast_voice_*, flags cast_hesk_*).
(function (AV) {
  'use strict';
  const SP = AV.data.speakers;
  const DLG = AV.data.dialogue;
  const GHOST = '#b9d6d3';

  // The voices of the dead at the Pyre: one chorus, three faces.
  SP.cast_voice_woman = { name: 'The Thousand', portrait: 'ghost_woman', color: GHOST, voice: 1.0 };
  SP.cast_voice_man = { name: 'The Thousand', portrait: 'ghost_man', color: GHOST, voice: 0.68 };
  SP.cast_voice_child = { name: 'The Thousand', portrait: 'ghost_child', color: GHOST, voice: 1.45 };

  const ALL_STONES = 'has:hart_stone && has:bell_stone && has:shield_stone';
  const SECRET = 'told_linnet && (tags>=8 || has:wickward_ledger) && hollow<=20';

  // ================================================================== Hesk at the Seventh Gate (royal_road)
  DLG.hesk_gate = {
    start: 'a',
    nodes: {
      a: { branch: [
        { if: ALL_STONES, next: 'j0' },
        { if: 'has:hart_stone || has:bell_stone', next: 'w2' },
        { next: 'w1' }
      ] },
      w1: { who: 'hesk', text: [
        `Gate's still shut. I've been watching it. It's very good at being shut.`,
        `Hart, Bell and Shield. You've the Shield. That leaves two, by my count. I'm good at counting. It's fetching I'm bad at.`
      ], next: 'w3' },
      w2: { who: 'hesk', text: [
        `Two. Two's nearly three. My sergeant used to say that about my wages.`,
        `Go on. I'll mind the gate. Minding gates is the one thing I was ever any good at.`
      ], next: 'w3' },
      w3: { who: 'narrator', text: 'He settles back against the gate-pier and uncorks his flask. He does not drink. He only checks that it is there, and corks it again.', end: true },

      j0: { who: 'narrator', text: 'Hesk is sitting on a milestone with his halberd across his knees. He watches you the whole way up the road and does not get up until you are close.', next: 'j1' },
      j1: { who: 'hesk', text: [
        'Took your time.',
        `…All three. Mother's wick. I had money on nobody ever doing that. With myself. I've lost.`
      ], next: 'j2' },
      j2: { who: 'hesk', text: [
        `The Queen's lot sealed it with those stones and a lot of singing. The singing was worse.`,
        'I was up top for that. Last thing I did as a watchman, before I walked off the wall and kept walking.'
      ], next: 'j3' },
      j3: { who: 'brand', choices: [
        { text: `"Why are you here, Hesk?"`, next: 'j3a' },
        { text: `"Go home."`, next: 'j3b' },
        { text: `"You'll slow me down."`, next: 'j3c' },
        { text: `"Walk with me."`, next: 'j3d' }
      ] },
      j3a: { who: 'hesk', text: [
        `Eleven years I stood this gate. I'd like to see the other side of it, now it doesn't matter.`,
        `And I'm not letting a man with no face through it on his own. Looks bad for the watch.`
      ], next: 'j4' },
      j3b: { who: 'hesk', text: [
        `This is home. Near enough. Nearest I've got.`,
        `I'm coming. I wasn't asking. I was telling you slowly, so you'd keep up.`
      ], next: 'j4' },
      j3c: { who: 'hesk', text: [
        `I'll slow everything down. It's a gift. Bett said I could slow down a funeral.`,
        'Coming anyway.'
      ], next: 'j4' },
      j3d: { who: 'hesk', text: [
        '…Right.',
        `Well. Nobody's said that to me in a while. Don't say it twice. I'll get ideas.`
      ], next: 'j4' },
      j4: { who: 'narrator', text: 'He gets up off the milestone in three stages, with commentary, and falls in a step behind your left shoulder, where a watchman walks.', next: 'j5' },
      j5: { who: 'hesk', text: `Go on, then. Put them in. I'll hold the halberd and look like I know what's happening.`, next: 'j6' },
      j6: { do: ['companion:hesk', 'set:hesk_following', 'quest:hesk=1'], end: true }
    }
  };

  // ================================================================== Hesk while following (upper city)
  // First talk outside: what the watch saw. Afterwards: short lines, different once he knows.
  DLG.hesk_city = {
    start: 'a',
    nodes: {
      a: { branch: [
        { if: "!cast_hesk_story && map=='upper_city'", next: 's0' },
        { if: '!cast_hesk_story', next: 'in0' },
        { if: 'hesk_told', next: 'rt' },
        { next: 'rp' }
      ] },
      in0: { who: 'hesk', text: [
        `Not in here. Ask me outside.`,
        `There's a thing I want to show you, and it isn't indoors.`
      ], end: true },

      // ---- what the watch saw
      s0: { who: 'narrator', text: 'Hesk stops. Below the street\'s edge the Wickward wall runs long and black, and he is looking at one particular stretch of it.', next: 's1' },
      s1: { who: 'hesk', text: [
        'That bit. By the chimney stack.',
        'That was my stretch. Eleven years. I knew every stone on it by its first name.'
      ], next: 's2' },
      s2: { who: 'hesk', text: [
        'I was on it that night. The Last Vigil.',
        'Everybody says the Warden lit it and walked off up the hill to his supper.'
      ], next: 's3' },
      s3: { who: 'hesk', text: [
        `He didn't.`,
        'He lit it. I watched him. Then he dropped the torch and went in after it. Straight through his own gate.'
      ], next: 's4' },
      s4: { who: 'hesk', text: 'Screaming. One name, over and over. Like you could shout somebody out of a fire.', next: 's5' },
      s5: { who: 'brand', choices: [
        { text: `"What name?"`, next: 's5a' },
        { text: `"You're sure it was him."`, next: 's5b' },
        { text: `"He should have stayed in it."`, next: 's5c' },
        { text: '…', next: 's5d' }
      ] },
      s5a: { who: 'hesk', text: [
        `Couldn't hear it. A fire that size is loud. You'd not think it, but it roars.`,
        `Short name. Went up at the end. I've spent nineteen years trying to hear it better.`
      ], next: 's6' },
      s5b: { who: 'hesk', text: [
        `I'm sure of two things in this life. That, and that I want a drink.`,
        'Tall man. Helm with a spike on top, like a candle wick.'
      ], next: 's5b2' },
      s5b2: { who: 'narrator', text: 'He does not look at your helm. He is very careful not to look at your helm.', next: 's6' },
      s5c: { who: 'hesk', text: [
        'Maybe.',
        `He mostly did, didn't he. Mostly stayed in it.`
      ], next: 's5c2' },
      s5c2: { who: 'narrator', text: 'He looks at you then, properly, for the first time since the gate. Then away.', next: 's6' },
      s5d: { who: 'narrator', text: 'You say nothing. Hesk nods, as though you had.', next: 's6' },
      s6: { who: 'hesk', text: [
        `Bett was in there. My wife. Row— I never knew the row. They didn't tell husbands the row.`,
        'I stood on the wall and watched. That was all. I watched.'
      ], next: 's7' },
      s7: { who: 'hesk', text: `Never told anybody that. Nobody asked what the watch saw. They asked what the watch did, and the answer was nothing.`, next: 's8' },
      s8: { who: 'brand', choices: [
        { text: `"That was me, Hesk."`, do: ['set:hesk_told', 'set:cast_hesk_story'], next: 't0' },
        { text: `"The name was Wren."`, do: ['set:hesk_told', 'set:cast_hesk_story', 'set:cast_said_wren'], next: 'tw',
          lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]' },
        { text: `"I'm sorry about Bett."`, do: ['set:cast_hesk_story'], next: 'n1' },
        { text: 'Walk on.', do: ['set:cast_hesk_story'], next: 'n2' }
      ] },
      n1: { who: 'hesk', text: [
        `Yes, well. So's everybody.`,
        `There's a lot of sorry lying about up here. Nobody ever sweeps it.`
      ], end: true },
      n2: { who: 'hesk', text: `Right. Walking. Good. Walking I can do.`, end: true },

      // ---- told
      tw: { who: 'hesk', text: ['…Wren.', `That's it. That's the shape of it. Wren.`], next: 'tw2' },
      tw2: { who: 'narrator', text: 'He says it the way you say a word you have been trying to remember for years: with no pleasure at all. Then he understands how you know it.', next: 't1' },
      t0: { who: 'narrator', text: 'Hesk does not move. The ash comes down on both of you.', next: 't1' },
      t1: { who: 'hesk', text: [
        'I know.',
        'I knew at the gate. I knew at Greyharrow. Helm like a candle. Course I knew.'
      ], next: 't2' },
      t2: { who: 'hesk', text: [
        `Nineteen years I've drunk at that knight. Not to him. At him. Every night, one mouthful, at him.`,
        'And here you are. Stood there like weather.'
      ], next: 't3' },
      t3: { who: 'narrator', do: ['shake:1'], text: 'He takes the flask off his belt and drinks. Not a mouthful. He drinks for a long time, with his eyes shut, while the ash settles on his shoulders.', next: 't4' },
      t4: { branch: [{ if: 'cast_said_wren', next: 't6' }, { next: 't5' }] },
      t5: { who: 'hesk', text: `The name. What was it. You owe me a bloody sight more than that, but you owe me that.`, next: 't5c' },
      t5c: { who: 'brand', choices: [
        { text: `"Wren. My daughter."`, do: ['set:cast_said_wren'], next: 't5a' },
        { text: `"I don't remember."`, next: 't5b' }
      ] },
      t5a: { who: 'hesk', text: '…Your girl.', next: 't6' },
      t5b: { who: 'hesk', text: [`Liar.`, `…Suit yourself. It's yours.`], next: 't8' },
      t6: { who: 'hesk', text: [
        'You went in for yours.',
        'Bett was right there under me. Forty feet. I had her name in my mouth the whole night, and I never once said it out loud.'
      ], next: 't7' },
      t7: { who: 'hesk', text: `You lit the whole bloody Wickward, and you still went in after yours. I didn't. I'm trying to work out which of us is worse.`, next: 't8' },
      t8: { who: 'narrator', text: ['Then he does something you do not expect.', 'He straightens, the way a watchman straightens when an officer comes up the wall-stair, and salutes you. Badly.'], next: 't9' },
      t9: { who: 'hesk', text: 'Warden.', next: 't10' },
      t10: { who: 'narrator', text: 'Then he spits on the cobbles between your feet.', next: 't11' },
      t11: { who: 'hesk', text: [
        `There. That's both of those done.`,
        `Walk on. I'm still coming. Don't ask me why. I'd have to think about it, and I gave that up years ago.`
      ], end: true },

      // ---- afterwards, told
      rt: { branch: [
        { if: "map=='palace'", next: 'rt_p' },
        { if: 'cast_hesk_n>=2', next: 'rt3' },
        { if: 'cast_hesk_n==1', next: 'rt2' },
        { next: 'rt1' }
      ] },
      rt_p: { who: 'hesk', text: `Keep your voice down in here. Not for them. For me.`, end: true },
      rt1: { who: 'hesk', do: ['add:cast_hesk_n=1'], text: `Still hate you. I check, every so often. …Yes. Still there.`, end: true },
      rt2: { who: 'hesk', do: ['add:cast_hesk_n=1'], text: `Bett would've liked you. She liked anything that was trouble. She married me.`, end: true },
      rt3: { who: 'hesk', do: ['set:cast_hesk_n=0'], text: [`I'll walk with you. That's not forgiving. That's just walking.`, `Don't mix them up. I haven't.`], end: true },

      // ---- afterwards, not told
      rp: { branch: [
        { if: "map=='palace'", next: 'rp_p' },
        { if: 'cast_hesk_n>=2', next: 'rp3' },
        { if: 'cast_hesk_n==1', next: 'rp2' },
        { next: 'rp1' }
      ] },
      rp_p: { who: 'hesk', text: `All this gold and not a chair you'd want to sit in. That's royalty for you.`, end: true },
      rp1: { who: 'hesk', do: ['add:cast_hesk_n=1'], text: `Keep up, Ser. …No. You're ahead. Keep back, then. You know what I mean.`, end: true },
      rp2: { who: 'hesk', do: ['add:cast_hesk_n=1'], text: `Knees are going. Bett said they'd go first. She said most things would go before my mouth.`, end: true },
      rp3: { who: 'hesk', do: ['set:cast_hesk_n=0'], text: `Don't mind me. I talk to fill the gaps. There's a lot of gaps up here.`, end: true }
    }
  };

  // ================================================================== Hesk at the Wickward gate (trigger)
  DLG.hesk_wickward = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', text: 'At the head of the Wickward stair Hesk stops. Not slows. Stops, the way a cart stops against a wall.', next: 'b' },
      b: { who: 'hesk', text: ['No.', '…No. This is me. This is as far as I go.'], next: 'c' },
      c: { who: 'brand', choices: [
        { text: `"Come with me."`, next: 'c1' },
        { text: `"I understand."`, next: 'c2' },
        { text: `"Wait for me here."`, next: 'c3' },
        { text: '…', next: 'c4' }
      ] },
      c1: { who: 'hesk', text: `I've seen it once. Once'll do me.`, next: 'd' },
      c2: { branch: [{ if: 'hesk_told', next: 'c2t' }, { next: 'c2p' }] },
      c2t: { who: 'hesk', text: `You would. You're about the only one who would.`, next: 'd' },
      c2p: { who: 'hesk', text: `Good. I'd explain it badly, and then I'd have to sit down.`, next: 'd' },
      c3: { who: 'hesk', text: `I'll be here. I'm good at gates. Ask anyone.`, next: 'd' },
      c4: { who: 'narrator', text: 'Neither of you says anything. Below, the tags hanging in the burned doorways knock together in the wind and say it for you.', next: 'd' },
      d: { who: 'hesk', text: [
        `Bett's down there. What's left. Which is nothing, I expect, but it's her nothing.`,
        `I watched it burn from up here. I'm not going to go and walk about in it.`
      ], next: 'e' },
      e: { who: 'narrator', text: 'He unhooks the flask from his belt and weighs it in his hand. It sloshes, very faintly.', next: 'f' },
      f: { branch: [{ if: 'hesk_told', next: 'f_t' }, { next: 'f_p' }] },
      f_t: { who: 'hesk', do: ['give:hesk_flask'], text: [
        `One mouthful left. I drank the rest at you, back there.`,
        `Take it. You can't drink it, I know. Hold it, then. It's good for holding.`
      ], next: 'g_t' },
      f_p: { who: 'hesk', do: ['give:hesk_flask'], text: [
        `One mouthful left. I've been saving it. Never knew what for.`,
        `Take it. You can't drink it, I know. Hold it, then. It's good for holding.`
      ], next: 'g_p' },
      g_t: { who: 'hesk', text: [
        `If you find her tag down there — you won't, but if you do. Bett Dunmore.`,
        `Don't bring it back to me. I mean it.`
      ], next: 'h_t' },
      h_t: { who: 'hesk', text: `Go on, Warden. Go in after it. You're good at that.`, next: 'z' },
      g_p: { who: 'hesk', text: [
        `If there's tags down there… my wife was Bett Dunmore.`,
        `Just so somebody's heard it said who wasn't me.`
      ], next: 'h_p' },
      h_p: { who: 'hesk', text: `Keep your flame, Ser. Or whatever it is you've got in there instead.`, next: 'z' },
      z: { do: ['companion:none', 'unset:hesk_following', 'set:hesk_left', 'quest:hesk=2'], end: true }
    }
  };

  // ================================================================== Hesk afterwards (upper city, by the Wickward gate)
  DLG.hesk_after = {
    start: 'a',
    nodes: {
      a: { branch: [
        { if: 'has:tag_bett && !bett_returned', next: 'b0' },
        { if: 'bett_returned', next: 'r0' },
        { if: 'hesk_told && knows_wren && cast_said_wren && !cast_hesk_wren', next: 'w0' },
        { if: 'hesk_told', next: 't0' },
        { next: 'p0' }
      ] },

      // ---- Bett's tag
      b0: { who: 'hesk', text: `You're back up. Good. I'd have had to explain to somebody how I lost a knight.`, next: 'b1' },
      b1: { who: 'brand', choices: [
        { text: `Hold out Bett's tag.`, next: 'b2' },
        { text: `"Keep watching the gate."`, next: 'b_no' }
      ] },
      b_no: { who: 'hesk', text: 'Always do.', end: true },
      b2: { who: 'narrator', text: 'You hold it out on your palm. Tin, scorched along one edge. BETT DUNMORE, and her row, and her cot. Hesk does not take it.', next: 'b3' },
      b3: { who: 'narrator', text: 'Then he does. He holds it a long time, turning it with his thumb, the way you turn a coin you meant to spend and could not.', next: 'b4' },
      b4: { who: 'hesk', text: [
        'So that was her row.',
        `Eleven years on that wall and I never knew. I'd have picked the wrong one. I'd have waved at the wrong row, every night.`
      ], next: 'b5' },
      b5: { who: 'narrator', text: 'He puts it back in your gauntlet and closes your fingers over it, with both of his hands round yours.', next: 'b6' },
      b6: { who: 'hesk', text: [
        `No. You keep it. You're going where she is. I'm not.`,
        'You say it. When you get there.'
      ], next: 'b7' },
      b7: { who: 'hesk', do: ['set:bett_returned', 'quest:hesk=99'], text: `Properly, mind. Loud. Like a complaint. She'd want it said like a complaint.`, next: 'b8' },
      b8: { branch: [{ if: 'hesk_told', next: 'b9' }, { next: null }] },
      b9: { who: 'narrator', text: 'He looks at you a moment longer. He does not spit, this time.', end: true },

      r0: { who: 'hesk', text: [
        `Still here. Watching the gate. Old habit, and a bad one, and mine.`,
        `Like a complaint, mind. Don't you forget.`
      ], end: true },

      // ---- his girl
      w0: { who: 'hesk', do: ['set:cast_hesk_wren'], text: [
        `You went down. You came back up. That's more than most.`,
        '…Your girl. Wren. Was she there?'
      ], next: 'w1' },
      w1: { who: 'brand', choices: [
        { text: `"She wasn't in the cot. She got out."`, next: 'w2' },
        { text: `"No."`, next: 'w3' }
      ] },
      w2: { who: 'narrator', text: 'Hesk looks at you for a long moment.', next: 'w2b' },
      w2b: { who: 'hesk', text: ['Got out.', `…Good. That's good.`, `That's bloody unfair, is what that is.`, '…Good.'], end: true },
      w3: { who: 'hesk', text: [`No. …No, well. I didn't think so.`, 'Sorry, Warden.'], end: true },

      t0: { who: 'hesk', text: [
        'Still hate you. Checked this morning.',
        `…Still here, too. Make of that what you like. I've stopped trying.`
      ], end: true },
      p0: { who: 'hesk', text: [
        `You came back up. Most don't. Most don't go down, to be fair.`,
        `Go on. I'll watch the gate. It's what I'm for.`
      ], end: true }
    }
  };

  // ================================================================== Hesk's walking lines (CITY triggers)
  DLG.hesk_bark_gate = {
    start: 'a',
    nodes: {
      a: { who: 'hesk', text: [
        'Watch-house. That one, no roof. I had a stool in there with my name cut in the seat.',
        `Hope somebody burned it. I'd hate to think of it sat there all this time, waiting for my backside.`
      ], end: true }
    }
  };
  DLG.hesk_bark_palace = {
    start: 'a',
    nodes: {
      a: { who: 'hesk', text: [
        'Never been in. Watchmen went round the back, for the bread.',
        `She came down to the wall that last week, the Queen. Asked how many were still inside. We didn't know. She wrote that down.`
      ], end: true }
    }
  };
  DLG.hesk_bark_tallow = {
    start: 'a',
    nodes: {
      a: { who: 'hesk', text: 'Tallow Lane. Candlemakers. The whole street smelled of mutton fat and prayers.', next: 'b' },
      b: { branch: [{ if: '!hound_calmed && !hound_killed', next: 'c' }, { next: null }] },
      c: { who: 'hesk', text: `Something big's breathing behind one of these doors. I'm not going to mention it if you're not.`, end: true }
    }
  };

  // ================================================================== THE PYRE — the choice
  DLG.pyre_choice = {
    start: 'a',
    nodes: {
      a: { who: 'narrator', do: ['shake:3'], text: ['The Thousand does not fall.', 'It kneels. Faces in the fire, row on row, bow to you all at once. All very patient.'], next: 'b' },
      b: { who: 'narrator', text: `Hands lie open in the ash. Nothing reaches for you now. They wait the way the dead on a Chandler's shelf wait: without much hope, and without hurry.`, next: 'c' },
      c: { branch: [{ if: 'moth_trusted', next: 'c1' }, { next: 'd' }] },
      c1: { who: 'narrator', text: `At the fire's edge stands a row of glass jars, set down with great care. The small flames inside all lean toward you.`, next: 'd' },
      d: { who: 'cast_voice_woman', text: '{i}…Is it him?{/}', next: 'e' },
      e: { who: 'cast_voice_man', text: `{i}It's him. That's the helm. I'd know that helm in the dark.{/}`, next: 'f' },
      f: { who: 'cast_voice_child', text: '{i}Is he going to do it again?{/}', next: 'g' },
      g: { who: 'snuffer', text: [
        'Good evening, Warden.',
        'Kneeling, if you please. And to you, of all people. I have seen most things. I had not seen that.'
      ], next: 'h' },
      h: { who: 'snuffer', text: [
        'They will let you do whatever you like with it. They have no say. They never did.',
        '…Or shall I?'
      ], next: 'i' },
      i: { who: 'brand', choices: [
        { text: `"Not yet."`, next: 'i1' },
        { text: `"Yes."`, next: 'q' }
      ] },
      i1: { who: 'snuffer', text: 'Of course. I shall be just here. I am always just here.', next: 'k0' },
      k0: { who: 'narrator', text: 'The fire. The kneeling dead. The Snuffer, long hands folded, waiting as he has always waited.', next: 'k' },
      // Four choices fit: the secret ending takes the Snuffer's place (he has already made his offer at 'h').
      k: { branch: [{ if: SECRET, next: 'kS' }, { next: 'kN' }] },
      kS: { who: 'brand', choices: [
        { text: 'Walk into the fire.', next: 'ln' },
        { text: 'Take the fire.', next: 'ec' },
        { text: 'Take up the walk.', next: 'lv' },
        { text: 'Speak their names. Then ask them.', next: 'wd' }
      ] },
      kN: { who: 'brand', choices: [
        { text: 'Walk into the fire.', next: 'ln' },
        { text: 'Take the fire.', next: 'ec' },
        { text: 'Take up the walk.', next: 'lv' },
        { text: 'Turn to the Snuffer.', next: 'sn' }
      ] },

      // ---- the Snuffer (THE QUIET)
      sn: { who: 'snuffer', text: 'You looked at me, Warden. …Shall I?', next: 'sn1' },
      sn1: { who: 'brand', choices: [
        { text: `"Yes."`, next: 'q' },
        { text: `"No. Not yet."`, next: 'k0' }
      ] },
      q: { who: 'snuffer', text: [
        'You are quite certain? I only pinch, you understand. I do not speak.',
        'Nobody will say your name. There will be nobody there to say it.'
      ], next: 'q1' },
      q1: { who: 'brand', choices: [
        { text: `"Yes."`, next: 'q2' },
        { text: `"No. Not yet."`, next: 'k0' }
      ] },
      q2: { who: 'brand', text: 'Let someone better come for them.', next: 'q3' },
      q3: { who: 'snuffer', text: 'As you wish. …Goodnight, Warden.', next: 'q4' },
      q4: { do: ['sfx:snuff', 'wait:0.6', 'ending:quiet'], end: true },

      // ---- THE LAST NAME
      ln: { who: 'brand', text: `Stand aside, old man. I'm expected.`, next: 'ln1' },
      ln1: { who: 'snuffer', text: 'Mind the step, Warden.', next: 'ln2' },
      ln2: { do: ['sfx:fire', 'wait:0.6', 'ending:last_name'], end: true },

      // ---- THE EMBER CROWN
      ec: { who: 'brand', text: 'It was necessary. I would light it again.', next: 'ec1' },
      ec1: { who: 'narrator', text: 'The Snuffer says nothing at all. It is the first time you have known him to have nothing to say.', next: 'ec2' },
      ec2: { do: ['sfx:kindle', 'wait:0.6', 'ending:ember_crown'], end: true },

      // ---- THE LONG VIGIL
      lv: { who: 'brand', text: 'I swore to every one of them. I am not done.', next: 'lv1' },
      lv1: { who: 'snuffer', text: ['No. I rather thought not.', 'Go on, then. I shall walk behind you, at a courteous distance.'], next: 'lv2' },
      lv2: { do: ['wait:0.4', 'ending:long_vigil'], end: true },

      // ---- THE WEIGHT OF DAYS (secret)
      wd: { who: 'brand', text: 'I chose for you once. I will not do it again.', next: 'wd1' },
      wd1: { branch: [{ if: 'tags>=2', next: 'wd_t' }, { if: 'tags==1', next: 'wd_t1' }, { next: 'wd_l' }] },
      wd_t: { who: 'narrator', text: 'So you say their names. The tags first: {$tags} of them, the tin gone soft in the heat. Each one whole. Each one slowly.', next: 'wd_l' },
      wd_t1: { who: 'narrator', text: 'So you say their names. The one tag first, the tin gone soft in the heat. You say it whole, and slowly.', next: 'wd_l' },
      wd_l: { branch: [{ if: 'has:wickward_ledger', next: 'wd_l1' }, { next: 'wd_b' }] },
      wd_l1: { who: 'narrator', text: `Then the ledger. Four hundred and eleven names in a clerk's neat hand. Row, cot, age, trade. It takes the rest of the night. Nobody hurries you.`, next: 'wd_b' },
      wd_b: { branch: [{ if: 'bett_returned', next: 'wd_b1' }, { next: 'wd_ask' }] },
      wd_b1: { who: 'narrator', text: `You say Bett Dunmore's name like a complaint, as you were told. Somewhere in the fire, somebody laughs.`, next: 'wd_ask' },
      wd_ask: { who: 'brand', text: ['That is all of you I have.', '…What would you have me do?'], next: 'wd_v1' },
      wd_v1: { who: 'narrator', text: 'For a long time, nothing. Then the fire answers, the way a crowd answers: not all at once, and not in agreement.', next: 'wd_v2' },
      wd_v2: { who: 'cast_voice_woman', text: ['{i}No.{/}', '{i}I had my hand on the gate when you dropped the bar. I felt it go down. No. Not tonight. Not in a hundred years.{/}'], next: 'wd_v3' },
      wd_v3: { who: 'cast_voice_man', text: `{i}I forgive you. Don't make much of it. I was grey to the eyes by then. The fire was quicker.{/}`, next: 'wd_v4' },
      wd_v4: { who: 'cast_voice_child', text: '{i}Did Wren get out? She said her da was coming.{/}', next: 'wd_v5' },
      wd_v5: { who: 'brand', choices: [
        { text: `"She got out."`, next: 'wd_v6a' },
        { text: `"He came. He was late."`, next: 'wd_v6b' }
      ] },
      wd_v6a: { who: 'cast_voice_child', text: '{i}Oh. …Good.{/}', next: 'wd_v7' },
      wd_v6b: { who: 'cast_voice_child', text: '{i}She said he would be. She said he was always late for supper.{/}', next: 'wd_v7' },
      wd_v7: { who: 'narrator', text: 'Then all of them together, the way ash turns in the air: all at once.', next: 'wd_v8' },
      wd_v8: { who: 'cast_voice_woman', text: `{i}No. You don't get to lie down.{/}`, next: 'wd_v9' },
      wd_v9: { who: 'cast_voice_man', text: `{i}Dying's easy. We'd know.{/}`, next: 'wd_v10' },
      wd_v10: { who: 'cast_voice_child', text: `{i}You have to do the long part. All of it. We didn't get to.{/}`, next: 'wd_v11' },
      wd_v11: { who: 'narrator', do: ['shake:2'], text: 'Then hands. Hundreds of them, inside the plate, gentle as nurses. They take hold of the ash in you, and they begin to pull.', next: 'wd_end' },
      wd_end: { do: ['wait:0.6', 'ending:weight_of_days'], end: true }
    }
  };
})(window.AV);
