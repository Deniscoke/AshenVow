// ASHEN VOW — items (CAST). Every non-tag item from BIBLE §12, plus CAST curios (lore_cast_*).
(function (AV) {
  'use strict';
  const I = AV.data.items;

  // ------------------------------------------------------------------ keys / story
  I.wren_tag = {
    name: 'Scorched Tin Tag', kind: 'key', icon: 'icon_wren_tag',
    desc: [
      { if: 'knows_wren', text: 'WREN. ROW 3. COT 11. She was not in the cot. She was never in the cot.' },
      { text: "Tied to your wrist with a knot you don't remember making. Stamped with a name the fire has eaten: W · · EN. You don't want to take it off." }
    ]
  };

  I.gate_key = {
    name: 'Village Gate Key', kind: 'key', icon: 'icon_gate_key',
    desc: "Iron, heavy, still warm from Linnet's apron pocket. It opens the barred roads out of Saint Wendel's Rest: east to the Hushwood, west to Lenten Mere, south to Greyharrow. The bars were put up to keep the ash-walkers out. She has decided you are something else."
  };

  I.hart_stone = {
    name: 'The Hart Wardstone', kind: 'key', icon: 'icon_hart_stone',
    desc: "Pale green stone veined like a leaf and cut with a stag's head. The royal foresters carried it home to the Hushwood when the Queen sealed the Seventh Gate. It still smells of moss and old rain."
  };

  I.bell_stone = {
    name: 'The Bell Wardstone', kind: 'key', icon: 'icon_bell_stone',
    desc: 'Grey-blue stone shaped like a bell, and wet no matter how long you carry it. The monks took it home to Lenten Mere before the water came. Held to the ear it makes no sound at all, which is somehow worse.'
  };

  I.shield_stone = {
    name: 'The Shield Wardstone', kind: 'key', icon: 'icon_shield_stone',
    desc: 'Iron-dark stone cut like a kite shield and scored with the lines of the Harrow. The last knights of Greyharrow carried it south and stood guard over it until they forgot why. It is heavier than a stone that size has any right to be.'
  };

  I.abbey_key = {
    name: 'Belfry Key', kind: 'key', icon: 'icon_abbey_key',
    desc: "The belfry key of Lenten Mere Abbey: bronze gone green, as long as your hand. Someone threaded a strip of novice's cloth through the bow so it would never be lost in the water. It was lost in the water anyway."
  };

  I.ossuary_key = {
    name: 'Ossuary Key', kind: 'key', icon: 'icon_ossuary_key',
    desc: 'An iron key to the lower halls of the Greyharrow ossuary, strung on a bootlace. The Harrow company passed it hand to hand, a week each, so that no one man ever had to open that door alone.'
  };

  I.hound_whistle = {
    name: 'Bone Whistle', kind: 'key', icon: 'icon_hound_whistle',
    desc: 'Carved by Corporal Jory Pike for his children on Tallow Lane, so they could teach the dog to come home when called. It is shrill and ugly. Any dog in Lanthorn would know it.'
  };

  I.wickward_key = {
    name: 'Wickward Key', kind: 'key', icon: 'icon_wickward_key',
    desc: "The key to the Wickward gate, from the Queen's own hand. She held it a long while before she let it go. It is not heavy. It ought to be."
  };

  I.anselm_letter = {
    name: 'Water-stained Letter', kind: 'key', icon: 'icon_anselm_letter',
    desc: 'A copy in Prior Anselm\'s hand, written from memory by a man who has been writing it for nineteen years. The water has taken the edges. The middle is perfectly legible. You could have read it in the time it took to burn.',
    read: [
      'To Ser Emeric Brand, Warden of the Seventh Gate, by the hand of the runner Fenwick Moll. — Ser, forgive a stranger his bluntness; there is no time left for courtesy. I am told the council sits again tomorrow, and I am told what it will be asked to decide. I beg you: before anything is decided, read this to its end.',
      'We have found something at Lenten Mere. I will not call it a cure; I have been a fool before. Our springs rise very cold from under the hill. The sick we keep in them through the long cold nights stop greying. The grey stays in the hands. It does not climb. And they come back to themselves: their names, their prayers. We call it the Cold Rite. It is only water, and patience.',
      'Children have been brought to us through the drains, by the courage of a nurse I will not name in a letter. Of the thirteen who came, eleven know their own names again. It is slow. It is not certain. It does not answer for the old, or for those too far gone. But it is not nothing, Ser. I have sat up with it four nights running, and it is not nothing.',
      'So I ask you, who hold the gate: hold the fire. Whatever the Archchandler preaches of mercy, give us the autumn. Send us the sick by cart, by barge, on foot. Send them to Lenten Mere and let the water have its chance. We have beds for two hundred and floors for more, and the sisters do not sleep much in any case.',
      'One thing more, and then I must seal this. Among those who came to us is a child of your own house, who improves daily. This morning she asked me whether birds can swim. I told her some can. — Anselm, Prior of Lenten Mere. Written in haste; the bell is ringing for Vespers and the runner is at the door. Please. Before anything is lit.'
    ],
    onRead: ['set:knows_letter']
  };

  I.wickward_ledger = {
    name: 'The Wickward Ledger', kind: 'key', icon: 'icon_wickward_ledger',
    desc: "The Chandlers' own ledger of the Wickward, bound in oiled calf and stolen out of the Archchandler's scriptorium by a man who steals everything. Hundreds of names in a clerk's neat hand: row, cot, age, trade. It is the only thing Fenwick ever carried that he didn't sell.",
    read: [
      'ROW 1 · COT 4 — Wat Tanner, 51, fuller. Tagged. — COT 5 — Aldith Tanner, 49, his wife. Tagged. Asks for him at night though he is in the next cot. — COT 6 — Piers Ottery, 12, apprentice glazier. Tagged. Asks when he may go home.',
      'ROW 2 · COT 1 — Mercy Quill, 7. Tagged. Sings. — COT 2 — Jude Fairweather, age not known, no family given. Tagged. — COT 3 — Tomas Reed, 30, carter. Tagged. Carried water for Row 2 himself until the Tuesday. Then did not.',
      'ROW 3 · COT 8 — Cressy Wain, 3. Tagged; the tag is larger than her wrist. — COT 10 — Sister Ebba Collen, of our own order. Came in with the sick of her own asking. Tagged at her insistence. — COT 11 — Wren, 8, of the Warden\'s house. Tagged. Tag found on the pillow at morning count. Count holds.',
      'ROW 7 · COT 4 — Oswy Dunn, 60, rope-maker. — COT 5 — Hale Dunn, 58, rope-maker. Brothers. Will not be separated. Not separated. — COT 6 — Ide, a foundling, perhaps 5. No other name given. The nurses call her Duck. Entered as Ide.',
      'Four hundred and eleven names, all in the one hand. Entries for the Eve of the Last Vigil: none. The clerk\'s hand stops partway down the page — ROW 12 · COT 1 — and the rest of the book is empty, and very clean.'
    ]
  };

  I.wren_bird = {
    name: 'The First Bird', kind: 'key', icon: 'icon_wren_bird',
    desc: [
      { if: 'cast_heard_birds', text: 'A small wooden bird, whittled badly by a man with a sword-hand. The beak is too long. It looks like a turnip with opinions. You made it. You remember her laughing at it, and you remember laughing too.' },
      { text: 'A small wooden bird, whittled badly by a man with a sword-hand. The beak is too long; the wings are not the same size. You made it. You remember her laughing at it, and you remember laughing too.' }
    ]
  };

  // ------------------------------------------------------------------ relics
  I.maud_ring = {
    name: "Maud's Wedding Ring", kind: 'relic', icon: 'icon_maud_ring',
    desc: "A thin band of tarnished silver, worn flat on one side by fifty years of a spade handle. Fenwick says he found it. Fenwick says a great many things. Worn, it makes the sword-arm heavier, and surer. (Relic: +1 sword damage.)"
  };

  I.posy_ribbon = {
    name: "Posy's Ribbon", kind: 'relic', icon: 'icon_posy_ribbon',
    desc: 'A faded blue hair-ribbon, the kind a mother ties too tight on a feast day. Posy left it behind when she went home. It still smells faintly of soap. (Relic: stamina recovers faster.)'
  };

  I.maud_thimble = {
    name: "Maud's Thimble", kind: 'relic', icon: 'icon_maud_thimble',
    desc: "A brass thimble, dented by a lifetime of mending other people's hems. Maud pressed it into your palm and said Aldo would have wanted someone useful to have it. She did not say you were useful. (Relic: tallow heals more.)"
  };

  I.moth_lantern = {
    name: 'Moth-Lantern', kind: 'relic', icon: 'icon_moth_lantern',
    desc: 'A little lantern of horn scraped thin as paper. Ash-moths drowse inside it instead of a flame, and glow when they are content. Held up, it throws a wider light, and walls that are lying to you begin to shimmer. (Relic: larger light; hidden walls shimmer.)'
  };

  I.hart_tear = {
    name: "The Hart's Tear", kind: 'relic', icon: 'icon_hart_tear',
    desc: "A drop of amber sap from the Old Hart's eye, hardened around a single white hair. The foresters said Aubrenn wept once a year, for everyone buried under the Hushwood. (Relic: wounds close slowly when nothing is trying to kill you.)"
  };

  I.bell_shard = {
    name: 'Bell Shard', kind: 'relic', icon: 'icon_bell_shard',
    desc: 'A curved shard of the great bell of Lenten Mere, still faintly humming against your palm. Hollin rang it until the water filled his mouth. Carry it and you move like someone who heard the warning in time. (Relic: rolling costs less stamina.)'
  };

  I.odo_seal = {
    name: "Odo's Seal", kind: 'relic', icon: 'icon_odo_seal',
    desc: 'Ser Odo Varr\'s iron seal-ring: a boar over a broken spear. He pressed it into the wax of letters he never finished writing. He always did stand in front of you. (Relic: take less damage.)'
  };

  I.hesk_flask = {
    name: "Hesk's Flask", kind: 'relic', icon: 'icon_hesk_flask',
    desc: 'A dented tin flask with the watch-crest of the Seventh Gate nearly rubbed off. There is one mouthful left in it. He handed it over as if it cost him nothing. It did, and you both knew it. (Relic: the Cinder fills faster.)'
  };

  I.ashen_sigil = {
    name: 'Ashen Sigil', kind: 'relic', icon: 'icon_ashen_sigil',
    desc: 'A disc of fused ash stamped with the old badge of the Harrow company: a flame over a shield. The company buried one for every man they lost. This one has your name scratched on the back, in Odo\'s handwriting. (Relic: Kindle lasts longer.)'
  };

  // ------------------------------------------------------------------ upgrades
  I.oath_ribbon = {
    name: 'Oath-Ribbon', kind: 'upgrade', icon: 'icon_oath_ribbon',
    desc: "A strip of grey cloth knotted around a pilgrim's vow — let me come home — of the kind once tied to the saint's fountain. Hardly anyone did come home. Taken up, the old oath settles into the armor and holds it together a little better. (Max health +2.)"
  };

  I.stolen_ember = {
    name: 'Stolen Ember', kind: 'upgrade', icon: 'icon_stolen_ember',
    desc: 'A flame that had a name once, and was on its way home. You took it into the armor instead. It burns in the sword-arm now and makes every blow heavier. It has not stopped asking to leave. (Sword damage +1.)'
  };

  I.pilgrim_breath = {
    name: "Pilgrim's Breath", kind: 'upgrade', icon: 'icon_pilgrim_breath',
    desc: 'A small glass vial stoppered with wax, holding the last breath of someone who walked the royal road to be healed. Opening it is a small theft. The air inside tastes of cold mornings. (Max stamina +15.)'
  };

  I.tallow_stub = {
    name: 'Tallow Stub', kind: 'upgrade', icon: 'icon_tallow_stub',
    desc: "A thick stub of chandler's tallow, poured slow and trimmed with care. Somebody meant it for a vigil that never ended. It will not fix you. It will make the dark a little shorter. (Tallow charges +1.)"
  };

  I.grave_iron = {
    name: 'Grave-Iron', kind: 'upgrade', icon: 'icon_grave_iron',
    desc: 'A shard of black iron from a grave-railing, forged when people still fenced in their dead to keep them from wandering. Worked into the edge of Vigil, it bites deeper. (Sword damage +1.)'
  };

  // ------------------------------------------------------------------ CAST curios (Fenwick's pack)
  I.lore_cast_finger = {
    name: 'Finger of Saint Wendel', kind: 'lore', icon: 'icon_note',
    desc: "A small grey bone in a velvet pouch, sold with a certificate in Fenwick's own handwriting. It is almost certainly a chicken's. It is almost certainly not.",
    read: [
      'CERTIFICATE OF HOLINESS. This is to swear that the enclosed is the true and blessed Forefinger of Saint Wendel, Founder of the Rest and Patron of Pilgrims, which pointed the way south three hundred years ago and has pointed nowhere since.',
      'Recovered at great personal peril by the undersigned. Guaranteed proof against fire, flood and the Greying, or your pennies returned in full, subject to the undersigned being findable. — F. Moll, Dealer in the Sacred.'
    ]
  };

  I.lore_cast_ballad = {
    name: 'Broadsheet Ballad', kind: 'lore', icon: 'icon_scroll',
    desc: 'A street ballad printed in Hallowhearth the summer after the war with Carrow, a penny a sheet. Folded so many times it has gone soft as cloth. Someone has written across the bottom in charcoal.',
    read: [
      'THE SHIELD OF GREYHARROW. A new ballad, to be sung to the tune of The Miller Has Gone to Sea. — Oh, the Carrow men came up the hill, eight hundred men and more, and Brand and Varr stood on the line like a bar across a door.',
      'They held a night, they held a day, they held till the crows grew fat, and when the King said "Name your prize", Ser Emeric doffed his hat: "A roof," says he, "for my old mum down Wickward way, a bird for my girl to keep, and a pint for Odo, and a dry pair of feet."',
      'Beneath the last verse, in charcoal, in capitals pressed so hard they tore the paper: HE GOT HIS ROOF. HE BURNED IT.'
    ]
  };
})(window.AV);
