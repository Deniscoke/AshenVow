// ASHEN VOW — ordered script manifest. Shared by index.html (browser loader) and tools/*.js (Node).
(function (root) {
  'use strict';
  const FILES = [
    // engine foundation
    'src/engine/core.js',
    'src/engine/pixelart.js',
    'src/engine/tiles.js',
    'src/engine/logic.js',
    'src/engine/font.js',
    'src/engine/audio.js',
    'src/engine/input.js',
    'src/engine/touch.js',
    // art
    'src/art/ui.js',
    'src/art/tiles.js',
    'src/art/knight.js',
    'src/art/icons.js',
    'src/art/people.js',
    'src/art/portraits.js',
    'src/art/props.js',
    // engine runtime
    'src/engine/state.js',
    'src/engine/fx.js',
    'src/engine/world.js',
    'src/engine/entities.js',
    'src/engine/combat.js',
    'src/engine/player.js',
    'src/engine/enemy.js',
    'src/engine/boss.js',
    'src/engine/voice.js',
    'src/engine/dialogue.js',
    'src/engine/ui.js',
    'src/engine/save.js',
    // data
    'src/data/items.js',
    'src/data/strings.js',
    'assets/voice/manifest.js',
    'src/data/cast.js',
    'src/data/cast2.js',
    'src/data/endings.js',
    'src/data/regions/village.maps.js',
    'src/data/regions/village.story.js',
    'src/data/regions/hushwood.maps.js',
    'src/data/regions/hushwood.story.js',
    'src/data/regions/abbey.maps.js',
    'src/data/regions/abbey.story.js',
    'src/data/regions/greyharrow.maps.js',
    'src/data/regions/greyharrow.story.js',
    'src/data/regions/city.maps.js',
    'src/data/regions/city.story.js',
    'src/data/regions/wickward.maps.js',
    'src/data/regions/wickward.story.js',
    // creatures (art + behaviour)
    'src/creatures/enemies_a.js',
    'src/creatures/enemies_b.js',
    'src/creatures/boss_procession.js',
    'src/creatures/boss_hart.js',
    'src/creatures/boss_hollin.js',
    'src/creatures/boss_odo.js',
    'src/creatures/boss_final.js',
    // boot
    'src/engine/game.js',
  ];
  root.AV_FILES = FILES;

  if (typeof document !== 'undefined' && document.currentScript && document.currentScript.dataset.autoload) {
    // Load sequentially, preserving order; a missing file is reported but does not stop the boot.
    root.AV_LOAD_ERRORS = [];
    let i = 0;
    const next = () => {
      if (i >= FILES.length) { if (root.AV && root.AV.boot) root.AV.boot(); return; }
      const src = FILES[i++];
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = next;
      s.onerror = () => { root.AV_LOAD_ERRORS.push(src); console.error('[AV] failed to load ' + src); next(); };
      document.head.appendChild(s);
    };
    next();
  }
})(typeof window !== 'undefined' ? window : globalThis);
