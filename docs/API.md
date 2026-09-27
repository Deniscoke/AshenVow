# ASHEN VOW — Data & Art API (contract for all builders)

Plain JavaScript, **classic scripts** (no modules, no build step). Every file is an IIFE that only *adds* keys to the
global namespace `AV`. **Never reassign a registry** (`AV.data.items = {...}` is forbidden; `AV.data.items.foo = {...}`
is correct). Files load in the order listed in `src/files.js`. Art `draw` functions run lazily at bake time, so they
may call helpers defined later in the same file.

```js
(function (AV) {
  'use strict';
  // ... add things ...
})(window.AV);
```

Internal resolution **384×216**, tiles **16×16 px**. Game runs at 60 fps.

Tools (Node 20+, zero dependencies):

| command | purpose |
|---|---|
| `node tools/check.js` | loads every file in `src/files.js` in a sandbox, reports syntax/runtime errors and cross-reference problems (unknown sprites, items, dialogue ids, spawns, flags). **Run it before you finish.** |
| `node tools/preview.js sheet <id>` | renders all frames of a sprite sheet to `preview/sheet_<id>.png` (scaled 4×) |
| `node tools/preview.js sheets` | contact sheet of every sprite sheet |
| `node tools/preview.js portraits` / `icons` | all portraits / icons |
| `node tools/preview.js tiles <theme>` | every tile type drawn in that theme, with neighbour variations |
| `node tools/preview.js map <mapId>` | the whole map rendered (tiles, props, NPC/enemy sprites, exits/triggers outlined) → `preview/map_<id>.png` |

You can open the PNGs with your image-viewing Read tool. **Look at your work and iterate.**

---

## 1. Master palette (use these characters in sprite rows and in `g.*` drawing calls)

All art shares one restrained palette. `.` is transparent. You may also pass raw `'#rrggbb'` strings to grid drawing
calls, but prefer palette characters for consistency.

| char | hex | use | | char | hex | use |
|---|---|---|---|---|---|---|
| `0` | #07060a | outline black | | `k` | #3d0f0a | deep ember |
| `1` | #141118 | darkest | | `l` | #7a1c10 | ember red |
| `2` | #221d27 | very dark | | `m` | #b8361a | fire red |
| `3` | #332c38 | dark grey | | `n` | #e2621f | fire orange |
| `4` | #4a4250 | grey | | `o` | #f59a36 | amber |
| `5` | #655c69 | mid grey | | `p` | #fccf63 | flame yellow |
| `6` | #857c86 | light grey | | `q` | #fff3c2 | flame white |
| `7` | #a8a0a6 | pale grey | | `r` | #0c1219 | night black-blue |
| `8` | #cbc4c3 | pale | | `s` | #152331 | night blue |
| `9` | #ebe5dc | bone white | | `t` | #22384a | deep slate |
| `a` | #1f140f | darkest brown | | `u` | #365466 | slate |
| `b` | #3a261a | dark brown | | `v` | #537a86 | cold teal |
| `c` | #5a3a24 | brown | | `w` | #82a8ad | pale teal |
| `d` | #7d5634 | leather | | `x` | #b9d6d3 | ghost pale |
| `e` | #a3784a | tan | | `y` | #e4f4ef | ghost white |
| `f` | #c9a26e | light tan | | `z` | #141a12 | darkest moss |
| `g` | #e6cc9c | parchment | | `A` | #222b1c | dark moss |
| `h` | #6b4a3c | skin shadow | | `B` | #343f28 | moss |
| `i` | #9c705a | skin | | `C` | #4d5a38 | olive |
| `j` | #c8987a | skin light | | `D` | #6f7a4e | pale olive |
| `F` | #2a0c14 | dark wine | | `E` | #97a070 | lichen |
| `G` | #4c1422 | wine | | `J` | #4a3a1c | dark brass |
| `H` | #7a2230 | blood | | `K` | #7a6230 | brass |
| `I` | #a8363c | red | | `L` | #a88a48 | old gold |
| `N` | #6e7472 | grey skin (Greying) | | `M` | #d4b96a | gold highlight |
| `O` | #9aa09c | grey skin light | | `P` | #1c1426 | night purple |
| `S` | #c2beb0 | pale bark | | `Q` | #2e2240 | dusk purple |
| `T` | #dcd8ca | pale bark light | | `R` | #4a3a60 | twilight |

Style rules: dark outlines (`0`/`1`) on characters and props so they read against dark ground; restrained, desaturated
bodies; saturated colour reserved for **fire** (`k`–`q`), **ghosts** (`v`–`y`), and **blood/wine** accents.
Light comes from above-front; shade the lower/back side. Keep silhouettes chunky and readable.

## 2. Pixel grid API (`g`)

Procedural art gets a grid `g` of the frame size. Coordinates are integers, origin top-left.

```
g.w, g.h
g.px(x, y, c)                 set one pixel (c = palette char or '#hex'; '.'/null = clear)
g.get(x, y)                   -> char|hex|null
g.rect(x, y, w, h, c)         filled rectangle
g.box(x, y, w, h, c)          rectangle outline
g.line(x0, y0, x1, y1, c)     Bresenham line
g.circle(cx, cy, r, c)        filled circle            g.ring(cx, cy, r, c)   circle outline
g.ellipse(cx, cy, rx, ry, c)  filled ellipse
g.poly([[x,y],...], c)        filled polygon
g.stamp(x, y, rows)           stamp string rows ('.' = skip)
g.stampFlip(x, y, rows)       stamp mirrored horizontally
g.outline(c = '0', diagonal = false)   add an outline in empty pixels around all filled pixels
g.replace(from, to)           recolour
g.each((x, y, c) => newC)     per-pixel transform (return undefined to keep)
g.noise(x, y, w, h, chars, density, seed)   sprinkle random pixels (deterministic by seed)
g.dither(x, y, w, h, c)       checkerboard dither of colour c over the area
g.mirrorX()                   copy the left half onto the right half, mirrored
g.flipX()                     mirror the whole grid
g.shift(dx, dy)               move content
g.rnd(seed)                   -> deterministic PRNG function () => [0,1)
```

## 3. Sprite sheets, portraits, icons

```js
AV.art.sheet('npc_linnet', {
  w: 24, h: 32,          // frame size
  ox: 12, oy: 30,        // anchor = the character's feet inside the frame
  anims: {
    idle: { fps: 3, frames: [ ROWS, ROWS ] },                 // ROWS = array of h strings of w chars
    walk: { fps: 8, count: 4, draw(g, i) { /* frame i */ } }, // or procedural
    talk: { fps: 6, loop: true, count: 2, draw(g, i) { ... } }
  }
});
AV.art.portrait('linnet', { w: 48, h: 48, count: 2, draw(g, i) { ... } });   // i = expression / stage
AV.art.icon('icon_tallow', { rows: [ ...16 strings of 16 chars... ] });     // or draw(g)
```

- Every sheet needs at least an `idle` anim. `loop` defaults to true; one-shot anims (`die`, `attack_*`) set `loop:false`.
- **Side-facing anims face RIGHT.** The engine mirrors for left.
- The engine derives white hit-flash frames automatically.
- Portraits are **48×48**, shown left of the dialogue box on a dark ground; paint a full bust (head + shoulders) with
  a dark-transparent background (leave corners transparent or very dark).
- Icons are **16×16**.

### 3.1 Player sheet `player` (frame 24×32, anchor 12,30)
Required anims: `idle_down idle_up idle_side walk_down walk_up walk_side attack_down attack_up attack_side roll_down
roll_up roll_side hurt heal die kneel`. Attack anims: 4 frames, `loop:false` (0 wind-up, 1 swing, 2 impact,
3 recover). Roll: 4 frames, `loop:false`. `die`: 7 frames, `loop:false`, ends as an ash heap. `heal`: 3 frames
(raise candle), `kneel`: 1–2 frames. The sword must be clearly visible in attack frames. The engine draws the
slash arc and all fire effects itself.

### 3.2 Portrait `brand` — `count: 3` (hollow stage 0 ember visor-glow, 1 more cracks, 2 cold pale glow).

## 4. Tiles

The legend maps characters in map rows to tile ids. Maps may add/override chars with `legend: {'Q':'tree'}`.

| char | tile id | solid | notes |
|---|---|---|---|
| `.` | `floor` | | the theme's default ground |
| `,` | `grass` | | ashen grass / ferns (theme) |
| `:` | `path` | | trodden dirt path |
| `;` | `cobble` | | cobblestones |
| `_` | `wood_floor` | | planks |
| `=` | `flagstone` | | interior stone flags |
| `-` | `shallow` | | shallow water, animated, slows |
| `a` | `ash` | | ash drift |
| `m` | `mud` | | mud |
| `b` | `bones` | | scattered bones (decor) |
| `r` | `rubble` | | rubble (decor) |
| `u` | `rug` | | worn red carpet |
| `s` | `stairs` | | stairs |
| `x` | `burnt` | | charred ground/boards |
| `%` | `lilies` | | grave-lilies (pale flowers) |
| `'` | `leaves` | | fallen pale leaves |
| `L` | `embers` | | burning ground, **hurts** (1 dmg / 0.8 s), animated, emits light |
| `*` | `candles` | | floor candles, animated, emits light |
| `#` | `wall` | ✔ | theme stone wall — auto *face* when the tile below is not wall, *top* otherwise |
| `B` | `wall_brick` | ✔ | building wall (auto face/top) |
| `W` | `wall_wood` | ✔ | timber wall (auto face/top) |
| `w` | `window` | ✔ | wall face with a dim window |
| `^` | `roof` | ✔ | slate roof (auto edges) |
| `c` | `cliff` | ✔ | earth/rock cliff (auto face) |
| `~` | `water` | ✔ | deep water, animated, auto shoreline |
| `T` | `tree` | ✔ | tall tree (32×48 graphic, trunk on the tile; theme-specific species) |
| `t` | `shrub` | ✔ | dead shrub |
| `R` | `rock` | ✔ | boulder |
| `F` | `fence` | ✔ | wooden fence (auto connects) |
| `I` | `railing` | ✔ | iron railing (auto connects) |
| `P` | `palisade` | ✔ | sharpened stakes |
| `g` | `grave` | ✔ | headstone |
| `+` | `marker` | ✔ | wooden grave marker |
| `|` | `pillar` | ✔ | stone pillar (tall 16×32) |
| `p` | `pew` | ✔ | church pew |
| `k` | `shelf` | ✔ | bookshelf / cupboard (tall 16×32) |
| `X` | `void` | ✔ | pit / black nothing |
| `!` | `brazier` | ✔ | lit brazier, animated, emits light |
| `C` | `wall_cracked` | ✔ | theme wall with cracks; **breaks when struck** (becomes floor, saved) |
| `H` | `wall_false` | | looks like wall; walkable; shimmers when the player has `moth_lantern` |
| `D` | `doorway` | | a dark opening in a wall face (use under exits/doors) |
| `G` | `gate_bars` | ✔ | iron bars |

Themes: `village`, `hushwood`, `abbey`, `greyharrow`, `city`, `wickward`, `cave`, `interior`, `pyre`.

Tile definitions (ART-WORLD builder only):
```js
AV.tiles.def('wall', {
  solid: true,
  anim: 1, fps: 0,                  // frames for animated tiles (water 4, embers 4, candles 3)
  light: null,                      // e.g. { r: 40, color: '#f59a36', flicker: 0.15 }
  tall: null,                       // e.g. { w: 32, h: 48 } → drawn y-sorted, bottom-centre on the tile's bottom-centre
  draw(g, c) { ... }                // g is 16×16 (or tall.w×tall.h)
});
// c = { theme, variant (0..7, stable per cell), frame, x, y,
//       same(dx,dy) -> neighbour has the same tile id (out of bounds counts as same),
//       tile(dx,dy) -> neighbour tile id, solid(dx,dy) -> neighbour solid, rnd() -> PRNG seeded per cell }
```

## 5. Props (sprite ids that map builders may place)

Each is a sheet with at least `idle`. Sizes are guidance (w×h). Anchor = bottom-centre of the object's footprint.

`prop_bier` 32×24 (anims `idle` empty, `body` shrouded) · `prop_shroud` 24×12 · `prop_candles` 16×16 (flicker) ·
`prop_candelabra` 16×32 · `prop_brazier` 16×24 · `prop_altar` 32×24 · `prop_shrine` 16×32 (`unlit`, `lit`) ·
`prop_statue_saint` 24×40 · `prop_statue_knight` 24×44 · `prop_well` 32×32 · `prop_fountain` 48×40 ·
`prop_cart` 32×24 · `prop_barrel` 16×20 · `prop_crate` 16×16 · `prop_grave_fresh` 16×16 (with a wooden bird) ·
`prop_bird` 8×8 · `prop_spade` 16×24 · `prop_bell_fallen` 32×28 · `prop_bell_great` 48×48 · `prop_bookshelf` 32×32 ·
`prop_desk` 32×24 · `prop_cot` 16×24 (`idle` empty, `body`) · `prop_bed` 24×32 · `prop_table_feast` 64×32 ·
`prop_throne` 32×40 · `prop_banner` 16×32 · `prop_weapon_rack` 32×24 · `prop_bone_pile` 24×16 ·
`prop_skull_niche` 16×16 · `prop_tent` 40×32 · `prop_campfire` 16×16 · `prop_jar_shelf` 32×32 · `prop_jar` 8×12 ·
`prop_hollow_tree` 64×80 · `prop_stag_skull` 24×16 · `prop_signpost` 16×24 · `prop_gate_seventh` 96×80
(`closed0` `closed1` `closed2` `closed3` = sockets filled, `open`) · `prop_pyre` 96×96 · `prop_lamp_post` 16×32
(`idle` lit, `unlit`) · `prop_corpse_knight` `prop_corpse_pilgrim` `prop_corpse_soldier` `prop_corpse_monk` 24×16 ·
`prop_tag_chimes` 16×24 · `prop_sluice_wheel` 32×32 · `prop_bath` 48×32 · `prop_bell_rope` 8×48 ·
`prop_toy_horse` 12×10 · `prop_ash_pile` 16×10 · `prop_lilies` 16×16 · `prop_gate_bars` 48×32 (`idle` closed, `open`) ·
`prop_door_wood` 16×24 (`idle` closed, `open`) · `prop_barricade` 48×24 · `prop_drum` 16×16 · `prop_pikes` 24×32 ·
`prop_crow` 12×10 · `prop_hand_mark` 16×16 · `prop_rubble` 32×16 · `prop_hearth` 32×32 · `prop_loom` 24×24 ·
`prop_glint` 8×8 (sparkle used by the engine for pickups)

## 6. Maps

One file per region: `src/data/regions/<region>.maps.js`.

```js
AV.data.maps.village = {
  name: "Saint Wendel's Rest",  // shown when entering
  region: 'village',            // village | hushwood | abbey | greyharrow | city
  theme: 'village',             // tile art theme (see §4)
  music: 'village',             // music id (see §12)
  weather: 'ash',               // 'ash' | 'rain' | 'fog' | 'embers' | 'none' | array e.g. ['fog','ash']
  ambient: 0.6,                 // darkness 0..1 (interiors ~0.75, exteriors ~0.5–0.65, wickward 0.7)
  ambientColor: '#0c0a14',      // darkness tint
  indoor: false,
  legend: { },                  // optional per-map char overrides
  tiles: [                      // equal-length rows
    "##########",
    "#........#",
  ],
  spawns: { chandlery_door: [12, 20, 'down'], north: [24, 1, 'down'] },   // [tileX, tileY, facing]
  entities: [ ... ],
  onEnter: null                 // optional: array of actions run every time the map is entered
};
```

Coordinates are **tile units**. A point entity at `x, y` stands on that tile: its anchor (feet / bottom-centre of a
prop) is placed at pixel `(x*16+8, y*16+14)` (fractions allowed: `x: 10.5`). A 32-px-wide prop therefore overlaps
half a tile on each side; a 40-px-tall statue rises about 2½ tiles above its own tile. Solid props block only their
footprint (roughly their width × the bottom 8–10 px). Rect entities (`exit`, `trigger`, `barrier`) use `x, y, w, h` in whole tiles.
Map edges are solid unless an exit is placed there. Put spawn points 1–2 tiles *inside* the map from the exit
that leads back, so the player doesn't immediately re-trigger it.

### 6.1 Entity types (common optional fields: `id`, `if` (presence condition))

```js
{ type:'exit',   x,y,w,h, to:'village', spawn:'east', lock:'gate_key', lockIf:'expr', lockedText:'Barred from the other side.' }
{ type:'door',   x,y, to:'chapel', spawn:'door', sprite:'prop_door_wood', lock?, lockIf?, lockedText? }   // 1×1, touch to enter
{ type:'barrier',x,y,w,h, id:'east_gate', sprite:'prop_gate_bars', lock:'gate_key' | lockIf:'expr',
                 lockedText:'…', openText:'…' }        // solid until opened (interact with key / condition true). Saved.
{ type:'npc',    x,y, npc:'linnet', dir:'down', wander:0 }
{ type:'sign',   x,y, sprite:'prop_signpost'|null, title:'Inscription', text:['page one','page two'] }  // or dialogue:'id'
{ type:'item',   x,y, id:'v_ribbon1', item:'oath_ribbon', count:1, text:'Optional line shown on pickup.' }
{ type:'corpse', x,y, id:'v_corpse1', sprite:'prop_corpse_pilgrim', text:['…'], item:'tag_well' }       // read + loot once
{ type:'prop',   x,y, sprite:'prop_candles', anim:'idle', solid:false, flip:false,
                 light:{ r:48, color:'#f59a36', flicker:0.15 } }
{ type:'light',  x,y, r:60, color:'#f59a36', intensity:1, flicker:0.1 }
{ type:'shrine', x,y, id:'shrine_chandlery', name:'Chandlery Altar' }
{ type:'enemy',  x,y, kind:'pilgrim', id?, respawn:true }
{ type:'boss',   x,y, boss:'boss_procession', arena:{x,y,w,h}, if:'!boss_procession' }   // fight starts when the player enters the arena rect
{ type:'trigger',x,y,w,h, id:'v_t1', once:true, if:'expr', dialogue:'id', do:['actions'] }
{ type:'emitter',x,y, kind:'smoke'|'embers'|'drips'|'motes'|'moths'|'ash'|'steam' }
{ type:'decal',  x,y, sprite:'prop_hand_mark' }    // drawn flat on the ground layer, never blocks
```

- `id` is required for anything persistent (`item`, `corpse`, `barrier`, `trigger` with `once`). Make ids globally
  unique by prefixing with your region letter: `v_`, `h_`, `a_`, `g_`, `c_`.
- NPC entities pick their dialogue from the NPC definition (§7). Use `if` on the entity to control presence
  (e.g. `if:'!posy_named'`).
- Every map needs enough light: place candles/braziers/lamps/`light` entities. Darkness is part of the look, but
  the player must always see the ground near them (the player also carries a faint light).

## 7. NPCs & speakers

```js
AV.data.npcs.mound = {
  name: 'Mound', sprite: 'npc_mound', portrait: 'mound', solid: true,
  talk: [                                   // first entry whose `if` passes is used on interact
    { if: 'boss_procession', dialogue: 'mound_after' },
    { dialogue: 'mound_first' }
  ],
  barks: [ { if:'!seen_mound_first', text:'…dig…' } ],   // optional floating one-liners when the player is near
  anim: 'idle'
};
AV.data.speakers.mound = { name: 'Mound', portrait: 'mound', color: '#a3784a', voice: 0.55 };
// name may be conditional: name: [ { if:'linnet_named', name:'Linnet' }, { name:'The Chandler' } ]
// voice: pitch multiplier for the text blip (0.4 deep … 1.6 high). color: name colour.
```

## 8. Dialogue

```js
AV.data.dialogue.mound_first = {
  start: 'a',
  nodes: {
    a: { who: 'narrator', text: 'Something the size of a haycart is digging.', next: 'b' },
    b: { who: 'mound', text: ['…', 'Dig. …Dig.'], next: 'c' },
    c: { who: 'brand', choices: [
          { text: '"What are you?"', next: 'd' },
          { text: '"Who are the graves for?"', next: 'e', if: '!seen_mound_graves' },
          { text: '"I\'m sorry."', next: 'f', lock: 'hollow_stage>=2', lockText: '[He cannot find the words.]' },
          { text: 'Leave.', next: null }
       ]},
    d: { who: 'mound', text: 'Tobin. …Was.', do: ['set:v_mound_named'], next: 'c' },
    e: { branch: [ { if: 'deaths>=3', next: 'e2' }, { next: 'e1' } ] },
    ...
  }
};
```

Node fields: `who` (speaker id | `'narrator'` | `'brand'`), `text` (string or array → one box per string),
`face` (portrait frame index, optional), `do` (actions run on entering the node), `next` (node id; missing/null → end),
`choices` (`{text, next, if, lock, lockText, do}`; `if` false → hidden; `lock` true → shown greyed, unselectable),
`branch` (`[{if, next}]`, evaluated immediately; node has no text), `end: true`.

Text markup: `{e}`ember highlight`{/}`, `{g}`grey`{/}`, `{i}`ghostly cyan`{/}`, `{r}`blood red`{/}`.
Variables: `{$deaths}`, `{$tags}`, `{$pennies}`. Line breaks happen automatically; use short pages (≤ 3 lines,
roughly 150 characters per page). Choices ≤ 4 per node, each ≤ 48 characters.

The engine sets `seen_<dialogueId>` when a dialogue starts.

## 9. Conditions (strings)

Identifiers read flags/variables (unset = 0). Operators `! && || == != < <= > >= ( )`, numbers, 'strings'.

- Flags: any name, e.g. `boss_procession`, `knows_wren`, `name_given=='brand'`.
- `has:item_id` — inventory contains the item.
- Derived variables: `map` (current map id), `deaths`, `hollow`, `hollow_stage` (0/1/2), `tags` (tin tags held), `pennies`, `kindles`,
  `chapter` (main quest stage), `q_<questId>` (a quest's stage), `visited_<mapId>`, `seen_<dialogueId>`,
  `open_<barrierId>`, `gone_<npcId>`.

## 10. Actions (strings)

```
set:flag            set:flag=value (number or 'string')        unset:flag        add:var=n (n may be negative)
give:item           give:item*3        take:item        take:item*2        pennies:+50        pennies:-50
quest:id=stage      (stage 99 = completed; shows a toast)       chapter:n   (sets main quest stage + chapter card)
hollow:+2           hollow:-1          heal                refill      (tallow charges)
card:Title|Subtitle          toast:Text           sfx:id          music:id          music:stop
shake:4             flash:#fff3c2      fade:out            fade:in           wait:1.5
remove:self         remove:<npcId>     (persistently removes the NPC — sets gone_<npcId>)
snuff:self          snuff:<npcId>      (plays the snuffing: a flame rises and goes out; then removes)
kill:self           kill:<npcId>       (Brand cuts them down; ash burst; removes)
anim:self:<anim>    anim:<npcId>:<anim>
boss:<bossId>       ending:<endingId>  companion:hesk     companion:none      shop:<shopId>
teleport:<map>:<spawn>               unlock:<barrierId>   dialogue:<dialogueId>   (chain)
spawn:<enemyKind>:<tileX>:<tileY>    save                  read:<itemId>   (show an item's text)
```

## 11. Items, quests, shops, endings, strings

```js
AV.data.items.oath_ribbon = { name:'Oath-Ribbon', kind:'upgrade', icon:'icon_oath_ribbon',
  desc:'…' };                         // desc may be [{if:'knows_wren', text:'…'}, {text:'…'}]
AV.data.items.anselm_letter = { name:'Water-stained Letter', kind:'key', icon:'icon_anselm_letter',
  desc:'…', read:['page 1','page 2'], onRead:['set:knows_letter'] };
AV.data.items.tag_edge = { name:'Tin Tag: Odeline Farr', kind:'tag', icon:'icon_tag',
  desc:'ODELINE FARR — ROW 9, COT 2. Laundress. …' };

AV.data.quests.posy = { title:'A Name for Posy', kind:'side',   // or 'main'
  stages: { 1:'…', 2:'…', 99:'…' } };

AV.data.shops.fenwick = { name:"Fenwick's Pack", items:[ { item:'tallow_stub', price:120, stock:1 },
  { item:'maud_ring', price:150, stock:1, if:'!maud_returned' } ] };

AV.data.endings.last_name = { title:'THE LAST NAME', music:'ending',
  slides:[ { text:['line','line'] }, { if:'told_linnet', text:['…'] } ] };

AV.data.strings.deathLines = [ { if:'deaths<=1', text:'…' }, { text:'…' } ];   // shown under NOT YET
AV.data.strings.kindleWhispers = [ '…not again…', '…it\'s warm…' ];
AV.data.strings.chapters = { 1:{ title:'I', name:'ASH ON THE BIER' }, ... };
AV.data.strings.credits = [ 'line', ... ];
```

## 12. Audio ids

SFX: `swing swing2 hit hit_heavy block hurt roll step step_soft step_water heal kindle kindle_end death respawn
enemy_die pickup key_item shrine rest door locked ui_move ui_select ui_back ui_open text boss_intro boss_die bell
bell_big whoosh projectile slam roar growl moth splash snuff whisper quest chapter break_wall penny fire`.

Music: `title village hushwood abbey greyharrow city wickward pyre cave boss boss_final ending credits`.
Ambience (driven by weather): `wind rain fire`.

## 12b. Engine behaviours you can rely on (addendum)

- **Live presence.** Entities with an `if` are re-evaluated whenever flags change (e.g. right after a dialogue ends).
  An NPC whose condition becomes false fades out; one whose condition becomes true fades in. Use this for
  "he is gone when you look again" moments and for swapping an NPC for an enemy.
- **Derived variable `map`** = current map id, e.g. `map=='hushwood_deep'` (useful for one NPC appearing in several places).
- `enemy` entities accept `respawn:false` (never comes back once killed) and `onDeath:['actions']`.
  Enemy kind `hound_big` exists (the Tallow Lane hound) in addition to §13 of the bible.
- `boss` entities accept `onDefeat:['actions']` (e.g. `['dialogue:h_hart_after']`) and `startOn:'arena'` (default:
  fight starts when the player steps into the arena rect) or `startOn:'manual'` (only a `boss:<id>` action starts it —
  use for bosses that talk first). When a boss dies the engine sets the flag named after the boss id
  (`boss_procession`, `boss_hart`, `boss_hollin`, `boss_odo`, `boss_final`) before running `onDefeat`.
- `prop` `anim` may be conditional: `anim:[{ if:'open_c_seventh_gate', anim:'open' }, { anim:'closed0' }]`.
- `item` and `corpse` entities accept `do:['actions']`, run once when looted.
- `trigger` entities accept `dialogue` and/or `do`; `once` defaults to true.
- **Devouring** a keeper's flame: give the upgrade item `stolen_ember` (+1 sword damage) and `hollow:+3`.
- A **tag** item's icon is always `icon_tag`.
- Upgrade items (`oath_ribbon`, `pilgrim_breath`, `tallow_stub`, `grave_iron`, `stolen_ember`) apply their effect the
  moment they are given or picked up.
- Speaking a ghost's name and releasing it: `snuff:self` (plays the rite; the ghost's flame rises and goes out).
- The player cannot die during dialogue; enemies freeze while a dialogue or menu is open.

## 13. File ownership

Only write the files you own. If you need something outside your files, note it in your final report instead.

| builder | files |
|---|---|
| ART-KNIGHT | `src/art/knight.js` (player sheet, `brand` portrait, `title_knight` 64×96 key art), `src/art/icons.js` (all icons) |
| ART-PEOPLE | `src/art/people.js` (npc sheets), `src/art/portraits.js` |
| ART-WORLD | `src/art/tiles.js` |
| ART-PROPS | `src/art/props.js` |
| ART-UI | `src/engine/font.js`, `src/art/ui.js` |
| AUDIO | `src/engine/audio.js` |
| CAST | `src/data/items.js`, `src/data/cast.js`, `src/data/endings.js`, `src/data/strings.js` |
| VILLAGE / HUSHWOOD / ABBEY / GREYHARROW / CITY | `src/data/regions/<region>.maps.js`, `src/data/regions/<region>.story.js` |
| ENGINE (lead) | `src/engine/*` except font.js & audio.js, `index.html`, `tools/*` |
