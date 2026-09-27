# ASHEN VOW — Cross-builder coordination (who defines what, and the ids that connect them)

Read this after BIBLE.md and API.md. When a row says "X defines, Y references", Y must use the id exactly and X must
create it. `node tools/check.js` reports any id that is referenced but missing.

## Ownership of characters (NPC def + speaker + dialogue)

| npc | owner | notes |
|---|---|---|
| linnet, snuffer, fenwick, hesk | CAST (`src/data/cast.js`) | NPC defs + speakers + all their dialogue, except `g_hesk` (GREYHARROW) |
| brand (speaker only), narrator | CAST | `AV.data.speakers.brand` name is conditional (see below) |
| mound, posy (+ village ghosts) | VILLAGE | |
| mothwife, maud (+ hartlings, forest ghosts) | HUSHWOOD | |
| anselm (+ abbey ghosts) | ABBEY | |
| odo (NPC before the fight, sprite `boss_odo`), roll-call ghosts | GREYHARROW | |
| queen, ormund, agna, hound (sprite `enemy_hound_big`), Wickward ghosts | CITY | |

`AV.data.speakers.brand.name` (CAST): `[{if:"brand_named || name_given=='brand'", name:'Brand'}, {if:"name_given=='emeric'", name:'Emeric'}, {name:'The Knight'}]`.
Any builder may `set:brand_named` when someone recognises him (Odo, Fenwick, the Queen, Ormund).

## Placement contract (region builders place CAST's characters)

| where (map) | builder places | presence `if` | talk resolves to (CAST unless noted) |
|---|---|---|---|
| `crypt` | linnet, near the bier | `!intro_done` | (the intro runs from a trigger; see below) |
| `chandlery` | linnet | `intro_done` | `linnet_*` (CAST decides) |
| `village` (square, near the dry fountain) | fenwick | `!fenwick_left && !fenwick_killed` | `fenwick_shop` / `fenwick_confront` |
| `village` (edge of the graveyard or a rooftop-level ledge; visible, a little apart) | snuffer | `!sn_village` | `snuffer_village` |
| `hushwood_deep` | snuffer | `!sn_hushwood` | `snuffer_hushwood` |
| `abbey_cloister` | snuffer | `!sn_abbey` | `snuffer_abbey` |
| `greyharrow_field` | snuffer | `!sn_greyharrow` | `snuffer_greyharrow` |
| `greyharrow_field` (camp) | hesk | `!hesk_waits` | `g_hesk` (**GREYHARROW writes it**; it must `set:hesk_waits` after Odo is dead and Hesk decides to meet Brand at the Seventh Gate) |
| `royal_road` (beside the Seventh Gate) | hesk | `hesk_waits && !hesk_following && !hesk_left` | `hesk_gate` (joins: `companion:hesk`, `set:hesk_following`) |
| `upper_city` (near the Wickward gate) | hesk | `hesk_left` | `hesk_after` |
| `upper_city` | fenwick | `fenwick_left && !fenwick_killed` | `fenwick_city` (gives `wickward_ledger` once) |
| `wickward` | snuffer | `!sn_wickward` | `snuffer_wickward` ("Nobody cursed you. You *promised*.") |
| `pyre` | snuffer | `boss_final` | — (he speaks inside `pyre_choice`) |

The snuffer NPC def (CAST) chooses dialogue by `map`, e.g. `{ if:"map=='hushwood_deep'", dialogue:'snuffer_hushwood' }`.
Each `snuffer_<place>` dialogue must `set:sn_<place>` at its end so he is gone when the player looks again.
Every snuffer dialogue offers the end: "Shall I?" → "Yes." → a confirmation → `ending:quiet`.

## Triggers & hand-offs

| event | who builds the trigger | what it runs | who writes the dialogue |
|---|---|---|---|
| New game (player spawns at `crypt:start`) | VILLAGE: trigger `v_intro` covering the start spawn, `dialogue:'intro'` | intro scene; ends with `set:intro_done`, `chapter:1` | CAST `intro` |
| Approaching the chapel before Boss 1 | VILLAGE: trigger(s) with a short whisper dialogue ("…Brand…") | | VILLAGE |
| Boss 1 defeated | VILLAGE: boss entity `onDefeat:['dialogue:procession_after']` | ash pours into him; `set:cinder_unlocked` | CAST `procession_after` |
| Linnet gives the gate key | — | `linnet_after_procession`: `give:gate_key`, `chapter:2` | CAST |
| Barred roads east/west/south | VILLAGE: `barrier` with `lock:'gate_key'` | | |
| Hart defeated | HUSHWOOD: `onDefeat:['dialogue:h_hart_after']` | name / give to Moth-Wife / devour / leave; always `give:hart_stone` | HUSHWOOD |
| Hollin defeated | ABBEY: `onDefeat:['dialogue:a_hollin_after']` | name / devour / leave; always `give:bell_stone` | ABBEY |
| Odo | GREYHARROW: boss `startOn:'manual'`; NPC odo (`if:'!odo_fight'`) talk → `g_odo_intro` ends with `set:odo_fight`, `boss:boss_odo`; `onDefeat:['dialogue:g_odo_after']` | always `give:shield_stone` | GREYHARROW |
| Sluice log found (abbey undercroft) | ABBEY: `corpse`/`sign` with `do:['set:knows_sluice']` | enables `fenwick_confront` | CAST |
| Seventh Gate | CITY: `barrier` `c_seventh_gate`, `lockIf:'!(has:hart_stone && has:bell_stone && has:shield_stone)'`; gate prop anim by stones held; trigger just inside → `chapter:3` | | CITY |
| Hesk barks while following | CITY: triggers `if:'hesk_following'` → `hesk_bark_gate` (entering upper_city), `hesk_bark_palace` (palace doors), `hesk_bark_tallow` (Tallow Lane) | | CAST |
| Hesk stops at the Wickward | CITY: trigger at the Wickward gate `if:'hesk_following'` → `dialogue:'hesk_wickward'` (ends `companion:none`, `unset:hesk_following`, `set:hesk_left`) | | CAST |
| Entering the Wickward | CITY: trigger → `chapter:4` | | CITY |
| Queen | CITY: `c_queen` … `set:knows_proposal`, `set:brand_named`, `give:wickward_key`, optional `set:queen_forgave` | | CITY |
| Cot 11 | CITY: Agna → `set:knows_wren`, `chapter:5`, `give:wren_bird` | Pyre gate barrier `c_pyre_gate` `lockIf:'!knows_wren'` | CITY |
| Final boss | CITY: trigger at the pyre entry → `w_pyre_approach` ending `boss:boss_final` (boss `startOn:'manual'`), `onDefeat:['dialogue:pyre_choice']` | the choice → `ending:*` | CITY writes approach; CAST writes `pyre_choice` |
| Grate shortcut well_cave ↔ mere_shore | VILLAGE: bolt in the well cave → `set:v_grate_opened`; ABBEY: `barrier` `a_grate` on the shore side `lockIf:'!v_grate_opened'` in front of the exit to `well_cave:mere` | | |
| Hound whistle | GREYHARROW: corpse of Corporal Jory Pike gives `hound_whistle` (+ his unsent note to his children on Tallow Lane) | CITY's hound dialogue uses `has:hound_whistle` | |

## Flags that cross builders (set by → read by)

`intro_done` (CAST → VILLAGE) · `cinder_unlocked` (CAST/engine) · `linnet_named` (CAST) · `name_given` (CAST) ·
`brand_named` (anyone) · `sn_village|sn_hushwood|sn_abbey|sn_greyharrow|sn_wickward` (CAST → regions) ·
`fenwick_left|fenwick_killed|fenwick_spared|fenwick_confessed` (CAST → VILLAGE, CITY) · `knows_sluice` (ABBEY → CAST) ·
`knows_letter` (CAST item onRead / CAST Fenwick) · `anselm_truth|anselm_lie` (ABBEY → CAST endings) ·
`posy_named|posy_lied` (VILLAGE → CAST endings) · `maud_returned|maud_kept` (HUSHWOOD → CAST shop/endings) ·
`moth_trusted|moth_killed` (HUSHWOOD → CAST endings) · `hart_named|hart_given|hart_devoured` (HUSHWOOD) ·
`hollin_named|hollin_devoured` (ABBEY) · `odo_named|odo_devoured|odo_left` (GREYHARROW → CAST endings) ·
`rollcall_answered|rollcall_broken` (GREYHARROW → boss code) · `hesk_waits` (GREYHARROW → CITY/CAST) ·
`hesk_following|hesk_left|hesk_told` (CAST → CITY) · `knows_proposal` (CITY/GREYHARROW) ·
`queen_forgave` (CITY → CAST endings) · `ormund_killed|ormund_left` (CITY → CAST endings) ·
`hound_calmed|hound_killed` (CITY → CAST endings) · `knows_wren` (CITY → CAST) · `told_linnet` (CAST).

## Items: who defines each

- **CAST** (`src/data/items.js`): every non-tag item in BIBLE §12, including `wren_tag`, `stolen_ember`, `anselm_letter`
  (the full letter text in `read`, `onRead:['set:knows_letter']`), `wickward_ledger` (readable excerpt), `hesk_flask`.
- **Region builders** define their own `tag_*` items (kind `tag`, icon `icon_tag`) in their story file, and may define
  extra lore items with their prefix: `lore_v_*`, `lore_h_*`, `lore_a_*`, `lore_g_*`, `lore_c_*` (kind `lore`, icon
  `icon_book` / `icon_scroll` / `icon_note`).
- **Placement** of contract items: see BIBLE §12 (which builder places which upgrade/tag).

## Quests

`main` (CAST) · `fenwick` (CAST, optional) · `hesk` (CAST, optional) · `posy` (VILLAGE) · `maud`, `mothwife`
(HUSHWOOD) · `anselm` (ABBEY) · `rollcall` (GREYHARROW) · `hound` (CITY). Stage 99 = completed.

## Id prefixes for anything you invent

VILLAGE `v_` · HUSHWOOD `h_` · ABBEY `a_` · GREYHARROW `g_` · CITY `c_` · CAST: no prefix needed for the ids listed
here; otherwise `cast_`. Applies to dialogue ids, entity ids, local flags, local items, local quests.
