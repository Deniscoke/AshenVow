# ASHEN VOW — Creatures API (enemies & bosses)

Each creature file in `src/creatures/` contains BOTH the pixel art (`AV.art.sheet`, see API.md §1–§3) and the
behaviour definition. The engine code lives in `src/engine/enemy.js`, `src/engine/boss.js`, `src/engine/combat.js`,
`src/engine/player.js` — read them; do not edit them (report needed changes instead).

Test headlessly (no browser needed) with the real engine:

```
node tools/sim.js enemy <kind> [--verbose]   # spawns it in an arena: 8 s passive player, then the player attacks
node tools/sim.js boss <bossId>              # starts the fight, the player keeps attacking; checks death/flags/onDefeat
node tools/preview.js sheet enemy_<kind> 4   # look at the frames (Read the PNG)
node tools/check.js <kind>
```

The simulator FAILS a creature that never attacks, never hits a stationary player, can't be killed, or throws.

## Numbers (balance)

Player: 10 HP (up to 18), sword 2 dmg per hit (third combo hit ×1.6; up to ~6 late game), roll with i-frames
(0.02–0.30 s), 0.8 s invulnerability after being hit, speed 80 px/s, Kindle doubles damage for 8 s.
Enemy contact damage: early regions 1–2, late 2–3. Always **telegraph** attacks (wind-up pose, flash, ground marker)
— at least 0.35 s for normal enemies, 0.45–0.9 s for big boss moves — and leave a **punish window** after big attacks.
Nothing should feel cheap. Enemies must be readable against dark ground: outline them, give eyes/embers a bright accent.

## Enemy definition

```js
AV.data.enemies.pilgrim = {
  name: 'Ashen Pilgrim',
  sprite: 'enemy_pilgrim',        // anims: idle, walk, windup, attack, hurt, die (+ any custom)
  hp: 6, dmg: 2, speed: 26,       // speed in px/s
  w: 10, h: 6,                    // foot collision box
  hurt: { w: 12, h: 20 },         // hurt box above the feet
  weight: 1,                      // knockback divisor (heavier = pushed less)
  poise: 0,                       // extra hits absorbed before flinching (0 = flinches every hit)
  aggro: 90, leash: 240,          // wake-up radius, give-up distance from home (px)
  pennies: [2, 5], cinder: 8,     // drops
  flying: false, passive: false, shadow: 6,
  light: { r: 30, color: '#f59a36', intensity: 0.7, oy: -12 },   // optional
  init(e) {},                     // once on spawn
  brain(e, dt) {},                // AI, called each frame while alive, awake or not (check e.aggro), not stunned
  onHit(e, hit) {},               // return false to BLOCK (no damage; sparks + clang; player pushed back)
  onDeath(e, hit) {},
  draw(e, ctx, cam) {},           // optional custom draw; return true to skip the default sprite draw
  onAggro(e) {},
};
```
If `brain` is omitted, `AV.ai.melee(e, dt, {range, wind, rec})` runs (approach → wind-up → arc strike → recover).

### Instance helpers (`e`)
`e.x, e.y` feet position (px) · `e.vx, e.vy` knockback velocity · `e.state`, `e.st` (seconds in state), `e.go(name)` ·
`e.anim` (set the anim name each frame) · `e.animT` · `e.flip` · `e.z` (hover height) · `e.alpha` · `e.cool` (counts
down automatically) · `e.data` (your scratch object) · `e.aggro`, `e.home` · `e.hp`, `e.maxHp`, `e.hpFrac()` ·
`e.P` (player) · `e.dist()` · `e.angleTo()` · `e.faceTarget()` · `e.canSee()` · `e.move(angle, speed, dt)` ·
`e.moveToward(x, y, speed, dt)` · `e.chase(speed, dt)` · `e.stun(t)` · `e.knock(angle, force)` · `e.sfx(id, opts)` ·
`e.hitbox(opts)` · `e.shoot(opts)` · `e.telegraph(opts)` · `e.shockwave(opts)` · `e.spawn(kind, x, y)` · `e.world`

- `e.hitbox({shape:'arc', x, y, r, a, spread, dmg, knock, life})` — also `'circle'` (x,y,r), `'rect'` (x,y,w,h),
  `'ring'` (x,y,r,r0). Coordinates in world px. `follow: e, fx, fy` makes it track the creature. Each target is hit at
  most once per hitbox.
- `e.shoot({angle, speed, dmg, r, life, color, trail:'ember'|'ghost'|'wax'|null, sprite, homing, gravity, vz, z, lands,
  onExpire(p, world, impact)})` — projectile; `lands:true` + gravity = lobbed arc that expires on landing (use onExpire
  to leave a hazard, e.g. `e.shockwave` or a lingering `e.hitbox`).
- `e.telegraph({shape:'circle'|'line'|'rect', x, y, r, a, len, width, w, h, life, color})` — blinking ground warning.
- `e.shockwave({x, y, r0, speed, max, thick, dmg, knock, color})` — expanding ground ring (the player rolls through it).
- Effects: `AV.fx.shake(mag, t)`, `AV.fx.flash(color, t)`, `AV.fx.ash/embers/sparks/ghostly/splash(x, y, n, opts)`,
  `AV.fx.burst(x, y, n, {color:[..], speed, up, g, life, glow})`, `AV.fx.spawn({...particle})`,
  `AV.fx.text(x, y, text, {color, life})` (floating speech), `AV.fx.addLight(x, y, r, color, intensity)` (this frame).
- Sounds: see API.md §12 (`swing hit hit_heavy block slam roar growl bell bell_big whoosh projectile splash moth fire
  whisper` are useful).
- Flags: `AV.state.get('rollcall_broken')`, etc.

## Boss definition

```js
AV.data.bosses.boss_hart = {
  name: 'THE OLD HART, AUBRENN', title: 'Warden of the Hushwood graves',   // shown on the intro card / bar
  sprite: 'boss_hart', hp: 95, dmg: 2, speed: 40, music: 'boss',
  w: 28, h: 10, hurt: { w: 34, h: 38 }, weight: 10,
  phases: [0.5],                  // hp fractions where the phase increments (b.phase 1 → 2); onPhase(b, 2) is called
  introTime: 1.4, introAnim: 'idle', introUpdate(b, dt) {},
  idleSprite: 'boss_hart', idleAnim: 'rest',   // how the boss looks before the fight (null = invisible)
  onStart(b) {}, brain(b, dt) {}, onPhase(b, phase) {}, onHit(b, hit) {}, onDeath(b, hit) {},
  deathTime: 3.2, deathUpdate(b, dt) {},       // optional custom death sequence (default: flashing, ash, fade)
  draw(b, ctx, cam) {},                        // optional
};
```
The engine handles: the arena lock, intro card with the name, boss music, the health bar, slow-motion and flash on
death, clearing summons/projectiles, setting the flag named after the boss id, saving, and running the map's
`onDefeat` actions (the aftermath dialogue). Bosses are not knocked back. Bosses inherit all enemy helpers
(`b.hitbox`, `b.shoot`, `b.spawn` …). Use `b.state/b.st/b.go()` to build an attack-pattern state machine with a pause
between patterns; choose patterns by distance and phase; never repeat the same pattern 3 times in a row.
Use `b.data` for timers. The arena is `b.arena` ({x,y,w,h} in px) — keep movement inside it.
