// ASHEN VOW — global strings (CAST): death lines, kindle whispers, chapter cards, credits, shrine lines, Hesk's barks.
(function (AV) {
  'use strict';
  const S = AV.data.strings;

  S.tagline = 'What the ash remembers.';

  // Shown small under the big NOT YET. Ordered most specific first; the early ones are keyed to exact death counts
  // so that each of the first deaths reads differently, the later ones to how far gone he is and where he is.
  S.deathLines = [
    { if: 'deaths==1', text: 'The ash gathers itself. It remembers the shape of a knight.' },
    { if: 'deaths==2', text: 'You were not allowed to stay down. You were never allowed.' },
    { if: 'deaths==3', text: 'Somewhere, a candle gutters and does not go out.' },
    { if: 'deaths==4', text: 'I will not lie down until every one of them is laid to rest.' },
    { if: 'deaths==5', text: 'The dark was shorter than it looked. It always is, for you.' },
    { if: 'deaths==6 && chapter<=1', text: 'The Chandler will have to sweep you up again.' },
    { if: 'deaths==6', text: 'Five, six. The dead keep better count than the living.' },
    { if: 'deaths==7', text: 'Something in the armor sighs, as if it had hoped.' },
    { if: 'deaths==8', text: 'You have done this before. You will do it again.' },
    { if: 'hollow_stage>=2 && deaths>=9 && chapter>=4', text: 'The fire is close now. It is very glad to see you.' },
    { if: 'hollow_stage>=2 && deaths>=9', text: 'You re-form. You are not certain all of you came back.' },
    { if: 'hollow_stage==1 && deaths>=9', text: 'It is getting easier to come back. That should frighten you more than it does.' },
    { if: 'deaths>=20', text: '{$deaths} times. There is a groove worn in the world where you keep falling.' },
    { if: 'chapter>=4', text: 'The Wickward is patient. It has had nineteen years of practice.' },
    { if: 'chapter==3', text: 'Hallowhearth does not bury its dead. It never learned how.' },
    { if: 'chapter==2', text: 'Not yet. Not until every one of them.' },
    { text: 'The vow does not care how tired you are.' }
  ];

  // Faint text that drifts up while Brand Kindles. Ordered from the first Kindle to the last: warm, then wrong.
  S.kindleWhispers = [
    '…warm…',
    '…it\'s warm…',
    '…light…',
    '…oh, that\'s nice…',
    '…closer…',
    '…is it morning?…',
    '…who\'s there?…',
    '…row nine, cot two…',
    '…I had a name…',
    '…Mam, the door\'s hot…',
    '…not again…',
    '…Da?…',
    '…you said you\'d come at supper…',
    '…it\'s him…',
    '…please, not again…',
    '…we can hear you breathing…',
    '…why is it you who gets to be warm…',
    '…say it. say it. say it…'
  ];

  S.chapters = {
    1: { title: 'I', name: 'ASH ON THE BIER' },
    2: { title: 'II', name: 'THE THREE STONES' },
    3: { title: 'III', name: 'THE SEVENTH GATE' },
    4: { title: 'IV', name: 'THE WICKWARD' },
    5: { title: 'V', name: 'WHAT THE ASH REMEMBERS' }
  };

  // Shown (one at random, if its condition holds) when Brand rests at a shrine.
  S.shrineLines = [
    { text: 'You sit. The armor does not need to. You sit anyway.' },
    { text: 'The candle takes. For a moment, the ash stops sifting from your seams.' },
    { text: 'Somewhere a bell. Or the memory of one.' },
    { if: 'chapter<=1', text: 'Tallow smoke, and the smell of cut pine. Someone keeps this place.' },
    { if: 'chapter>=2 && chapter<=3', text: 'The flame leans toward you, the way flames do toward an open door.' },
    { if: 'chapter>=4', text: 'Even here the ash falls. Even here it is still warm.' },
    { if: 'hollow_stage>=2', text: 'You watch the flame for a long time. You cannot remember what it is for.' },
    { if: 'deaths>=10', text: 'The stone knows the weight of you by now.' }
  ];

  // One-liners Hesk mutters while he follows Brand (companion barks).
  S.heskBarks = [
    { if: "map=='royal_road'", text: 'Eleven years I stood that gate. Never once liked it.' },
    { if: "map=='upper_city'", text: 'Mind the cobbles. They\'re loose. So am I.' },
    { if: "map=='upper_city'", text: 'Used to be a bakery there. You could smell it from the wall.' },
    { if: "map=='palace'", text: 'Wipe your feet. …Habit. Sorry.' },
    { if: "map=='tallow_house'", text: 'Children lived here. You can always tell. Marks on the doorframe.' },
    { if: 'hollow_stage>=2', text: 'You\'ve gone quiet. Quieter. Didn\'t think you had it in you.' },
    { if: 'deaths>=5', text: 'Saw you fall apart back there. Don\'t do that where I can see it.' },
    { text: 'If anything jumps out, I\'m right behind you. Well behind you.' },
    { text: 'My knees are older than this city, and they\'re complaining louder.' },
    { text: 'Bett used to say I walked like a man carrying soup.' }
  ];

  S.credits = [
    'ASHEN VOW',
    'What the ash remembers.',
    '',
    'Design — Claude',
    'Story & Writing — Claude',
    'Code — Claude',
    'Pixel Art — Claude',
    'Sound & Music — Claude',
    '',
    'Ser Emeric Brand, who lit it',
    'Linnet, who poured the tallow',
    'Hesk, who watched from the wall',
    'Fenwick, who carried the letter',
    'The Snuffer, who is always there',
    '',
    'and the Wickward,',
    'row by row, cot by cot',
    '',
    'Keep your flame.',
    '',
    'For everyone whose name was not spoken.'
  ];
})(window.AV);
