// ASHEN VOW — the five endings (CAST). Slides are filtered by `if` when the ending starts; {$var} is substituted.
(function (AV) {
  'use strict';
  const E = AV.data.endings;

  // ================================================================== THE QUIET — the Snuffer's offer, any time
  E.quiet = {
    title: 'THE QUIET', music: 'ending',
    slides: [
      { text: ['Two long fingers. A small, courteous sound.', 'The Snuffer bows to what is left, as he bows to everyone.'] },
      { text: ['Nobody says a name. There is nobody there to say it.', 'The flame does not go home. It only goes out. There is a difference, and the Snuffer is the only one who minds.'] },
      { text: ['In the morning the ash is still falling.', 'It falls on Hallowhearth and the Hushwood, on the Mere and the long field at Greyharrow, the way it always has.'] },
      { text: ["A week later the ash cart brings a suit of black armor into Saint Wendel's Rest.", "The ash cart brings everything to Saint Wendel's Rest, sooner or later."] },
      { text: ['Linnet knows the helm. She has swept it off her floor before.', 'It is empty. She checks twice anyway. She holds a feather where the face should be.'] },
      { text: ['Knotted where a wrist would be: a scorched tin tag.', 'W · · EN.'] },
      { if: 'told_linnet', text: ['She knows whose tag it is. She knows whose wrist.', 'She sits with it on the crypt floor until the candles gutter, and for a while she does not light new ones.'] },
      { if: '!told_linnet', text: ['Warren, she decides. Or Wendel. Half the dead in her crypt are Wendels.', 'She does not think the other thing. She has had a great deal of practice at not thinking it.'] },
      { if: "name_given=='none' && !told_linnet", text: ['She never had his name from him. He kept it, the way they all keep it, down there.'] },
      { if: "name_given!='none' || told_linnet", text: ['She said his name over him once, and it did nothing.', 'It was never the name. It was him.'] },
      { if: '!posy_named', text: ['In the village square a small ghost counts the bells, and loses count in the same place, every time.'] },
      { text: ['Mound digs the grave, slow and careful. He names every grave he knows.', 'This one he calls Knight. Then, after a long while: Tall.'] },
      { text: ['Linnet carves a bird for it. The beak is too long and the wings do not match.', 'It looks like a turnip with opinions. Hers always do. Her da\'s did too.'] },
      { text: ['The ash keeps falling.'] }
    ]
  };

  // ================================================================== THE LAST NAME — "Walk into the fire."
  E.last_name = {
    title: 'THE LAST NAME', music: 'ending',
    slides: [
      { text: ['He walks into the fire the way he walked into it once before: without being asked, and too late.', 'Inside, it is not hot. It is only loud, and full of people.'] },
      { if: 'tags==0 && !has:wickward_ledger', text: ['He carries no names to give them. He never went looking.', 'So he gives them the only thing he has, and knows it is not the same.'] },
      { if: 'tags==1', text: ['He speaks the one name he carries, off a tin tag gone soft in the heat.', 'One is not many. It is one.'] },
      { if: 'tags>=2', text: ['He speaks the names he carries, one by one, off tin tags gone soft in the heat.', '{$tags} names. He says every one of them whole.'] },
      { if: 'has:wickward_ledger && tags>=1', text: ["Then the ledger: four hundred and eleven more, in a clerk's neat hand.", 'Row, cot, age, trade. The fire is quiet while he reads. It has waited nineteen years. It can wait a night.'] },
      { if: 'has:wickward_ledger && tags==0', text: ["He has the ledger: four hundred and eleven names in a clerk's neat hand.", 'Row, cot, age, trade. The fire is quiet while he reads. It has waited nineteen years. It can wait a night.'] },
      { if: 'bett_returned', text: ["He says Bett Dunmore's name like a complaint, the way he was told to.", 'Somewhere in the roar, somebody laughs.'] },
      { if: 'knows_wren', text: ['He comes to the tag on his own wrist. WREN. ROW 3. COT 11.', 'He does not say it. That flame is lit somewhere to the south, pouring tallow. It is not his to send home.'] },
      { text: ['Last, he gives it his own. Small, and old, and stubborn.', 'It is enough. It was only ever him the fire was waiting for.'] },
      { text: ['The Pyre goes out. Nineteen years, and it goes out like any candle.', 'Nobody speaks his name. There is nobody left in the Wickward to speak it.', 'So he does not go home. He only goes out.'] },
      { text: ['In the morning the sky over Lanthorn is the wrong colour.', 'It takes people most of the day to remember the word for it.'] },
      { if: 'told_linnet', text: ['When the ash stops, Linnet walks north. It takes her four days.', 'In the cold black heart of the Wickward she finds a helm with a wick on top, and nothing in it.', 'It is far too late to send him anywhere. She says his name anyway, the whole of it. Then the other word, the one she could not put where he was.'] },
      { if: '!told_linnet', text: ["At Saint Wendel's Rest, Linnet stands in the lane with her grey hands held out, palms up, waiting for the ash to start again.", 'It does not. She never learns why.'] },
      { if: 'hesk_left && hesk_told', text: ['At the head of the Wickward stair, Hesk sees the glow go out below.', 'He drinks the last of something. Not at the Warden, this time. To him. Just the once. Nobody is watching.'] },
      { if: 'hesk_left && !hesk_told', text: ['At the head of the Wickward stair, an old watchman sees the glow go out below, and takes off his hat, and does not know why.'] },
      { if: 'moth_trusted', text: ['The flames the Moth-Wife kept warm in her jars went into the fire with him.', 'She let them. They asked.'] },
      { text: ['Mound stops digging. There is nothing new to dig for.', 'He sits down among his graves, a heap of earth with two lanterns in it, and seems content.'] },
      { text: ['The world is one flame darker.', 'It is lighter than it has been in nineteen years.'] }
    ]
  };

  // ================================================================== THE EMBER CROWN — "Take the fire."
  E.ember_crown = {
    title: 'THE EMBER CROWN', music: 'ending',
    slides: [
      { text: ['He opens his arms, and the Pyre comes to him.', 'The way the Procession came to him in the chapel. The way it always wanted to.'] },
      { text: ['It is warm. It is so warm.', 'A thousand voices, each one finishing a sentence. Then none.'] },
      { text: ['The fire does not go out. It goes in.', 'His cracks close over it like a fist over a coal.'] },
      { text: ["He climbs the hill to the palace. Aldemar's throne is empty. He does not sit in it the way Aldemar did.", 'Nobody signs anything. Nobody needs to.'] },
      { text: ['The ash falls where he wills it now.', 'Thick on the roads, to keep them closed. Soft on the graves. Lanthorn is quiet, and orderly, and warm.'] },
      { if: '!ormund_killed', text: ['Archchandler Ormund, half wax and half wick, is the first to kneel.', "He calls it the Candlemother's mercy. He always would have."] },
      { if: 'ormund_killed', text: ['There is no Archchandler left to bless it.', 'He finds he does not need one. He never did.'] },
      { if: 'queen_forgave', text: ["The Queen's ghost still sets her table for the Wickward children.", 'Whatever she forgave him, it was not this. She does not look up when he passes.'] },
      { if: '!queen_forgave', text: ["The Queen's ghost still sets her table for children who never come.", 'She does not look up when he passes. She never forgave him. Now she need not think about it again.'] },
      { if: 'hound_calmed', text: ['On Tallow Lane a great grey hound lies across a doorway and will not let him by.', 'He lets it be. It is the only thing in Hallowhearth that does not kneel.'] },
      { if: 'moth_trusted', text: ['In the Hushwood, the Moth-Wife opens her jars one by one and lets the little flames go, before he can think to ask for them.'] },
      { if: 'moth_killed', text: ['In the Hushwood, the Unlit drift between the white trees, and come when he calls.', 'They were always going to be his.'] },
      { if: 'told_linnet', text: ['Linnet hears in the spring. She packs her ledger and her snuffer and shuts the chandlery door.', 'She mourned one father in that fire. She will not stay and watch the other one wear it.'] },
      { if: '!told_linnet', text: ["At Saint Wendel's Rest the ash comes down thicker now, and warm, like breath.", 'One spring morning Linnet packs her ledger and her snuffer, shuts the chandlery door, and walks south until the ash stops.'] },
      { text: ['She leaves the birds on the graves. Nobody carves new ones.'] },
      { if: 'hollow_stage>=2', text: ['The visor burns white now, and cold. There is not much behind it that remembers why.'] },
      { if: 'hollow_stage<2', text: ['Some nights he unknots the tin tag from his wrist and looks at it for a long time.', 'Then he ties it back on, with a knot he remembers making.'] },
      { text: ['Lanthorn does not die. It is not allowed to.', 'It goes on, grey and warm and quiet, under a warden who is never tired.'] },
      { text: ['It was necessary. He would light it again.', 'He tells himself so every night. Every night it is a little easier. That is the worst of it.'] }
    ]
  };

  // ================================================================== THE LONG VIGIL — "Take up the walk."
  E.long_vigil = {
    title: 'THE LONG VIGIL', music: 'ending',
    slides: [
      { text: ['He does not go into the fire. He does not take it.', 'He bows to it, the way a Chandler bows to a bier, and turns, and climbs back up through the Wickward.'] },
      { text: ['At the gate the Snuffer falls into step, a courteous distance behind.', '"A long walk, Warden."', '"Yes."', '"I shall see you at the end of it."', '"Not yet."'] },
      { text: ['He walks. The Hushwood, the Mere, the long field at Greyharrow.', 'Every village that still has a door to knock on, and a good many that do not.'] },
      { text: ['He asks for names. A grandmother. A lamplighter. A laundress. A girl who sang.', 'He writes nothing down. He does not need to.'] },
      { text: ['Once a year, on the night of the Last Vigil, he stands at the edge of the Pyre and says them.', 'Each year it burns lower by less than a hair.'] },
      { text: ['It is slow. It is not certain. It is not nothing.'] },
      { if: 'rollcall_answered', text: ['At Greyharrow he stops at the ossuary door and calls the roll.', 'Nobody answers. That is how he knows they are home.'] },
      { if: 'odo_named', text: ['Nobody calls him Em any more.', 'He did not know, until it stopped, how much he had wanted someone to.'] },
      { if: 'fenwick_spared || fenwick_confessed', text: ['For some years a peddler walks with him, selling nothing, carrying a ledger.', 'Then the peddler is old, and then he is a name too. The knight says it properly.'] },
      { if: 'hollow_stage>=2', text: ['Some years he forgets his own name.', 'He never once forgets theirs.'] },
      { if: 'told_linnet', text: ["Once a year he stops at the gate of Saint Wendel's Rest and does not come in.", 'Linnet brings out the names she has gathered. They do not talk much. It is more than either of them expected.'] },
      { if: 'told_linnet', text: ['Long after, he stands at a grave with a bad wooden bird on it and says her name.', 'Both of them.'] },
      { if: '!told_linnet', text: ["Once a year he passes Saint Wendel's Rest on the far side of the road.", 'A Chandler with grey hands watches him go by. Neither of them stops. Both of them look.'] },
      { text: ['Travellers on the roads of Lanthorn speak of a tall grey knight, ash sifting from him like flour, who asks very politely for your grandmother\'s name.', 'Tell him. He will say it back to you properly.'] },
      { text: ['The Pyre burns a little lower every hundred years.', 'It has not gone out. Not yet.'] }
    ]
  };

  // ================================================================== THE WEIGHT OF DAYS — secret: "Speak their names. Then ask them."
  E.weight_of_days = {
    title: 'THE WEIGHT OF DAYS', music: 'ending',
    slides: [
      { text: ['They take their ash back.', 'Out of the seams, out of the cracks, out of the long dark inside the plate. It goes out of him like a tide.'] },
      { text: ['The armor comes apart in the street and is only armor. Inside it there is a man.', 'Fifty years old, grey at the temples, burned to the elbows. He has never been fifty before.', 'It is very cold. He had forgotten cold.'] },
      { text: ['Every name has been spoken. There is nothing left for the fire to hold.', 'The Pyre goes out quietly, the way people do when they are finally allowed.'] },
      { text: ['Some of them forgave him. Some never will. They went home all the same.', 'He asked them. It was the one thing nobody had done.'] },
      { text: ['The ash stops.', 'At dawn the sky over the Wickward is not grey. He sits in the cold black street and watches all of it.'] },
      { if: 'anselm_truth', text: ['At Lenten Mere the water is going down. In the scriptorium, nobody is writing.', 'The letter is finished. It always was. He only had to read it.'] },
      { if: 'maud_returned', text: ["In the Hushwood, Maud's door stands open. There is nobody behind it, waiting."] },
      { if: 'bett_returned', text: ['In the upper city, Hesk wakes in the night quite sure that somebody has just told him off.', 'He lies there grinning at the dark.'] },
      { text: ['He walks south. It takes him eleven days.', 'His feet bleed. He is pleased about it, a little, in a way he could not explain to anyone.'] },
      { if: 'fenwick_spared || fenwick_confessed', text: ['On the royal road a peddler sells him a pair of boots and does not know him without the helm.', "It is a fair price. It may be the first fair price of the peddler's life."] },
      { if: 'fenwick_killed', text: ['Somewhere on the road he says "Fenwick Moll" out loud, properly, to nobody.', 'It is not enough. It is not meant to be.'] },
      { text: ["Saint Wendel's Rest. The dry fountain, the graves, the birds.", 'Mound looks up from his digging, lifts his spade to him, and goes on digging. Mound knows everybody.'] },
      { text: ['Linnet is at the gate.', 'She has been at the gate every evening for a week, which she will deny.'] },
      { text: ['She has a speech. She has had a week to write it and nineteen years to mean it.', 'She looks at his face, and his burned hands, and does not use a word of it.'] },
      { text: ['"Come in, then. The dark was longer than it looked."'] }
    ]
  };
})(window.AV);
