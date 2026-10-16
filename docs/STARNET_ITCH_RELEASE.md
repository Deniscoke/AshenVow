# MASTER PROMPT — Ashen Vow → itch.io (pre Starnet)

> **Ako to spustiť:** do Starnetu vlož túto jednu vetu:
>
> `Prečítaj C:\Users\Admin\Desktop\THEGAME\docs\STARNET_ITCH_RELEASE.md a vykonaj ho krok po kroku. Pri každej BRÁNE sa zastav a čakaj na moje potvrdenie.`
>
> Všetko nižšie je prompt pre agenta.

---

## ROLA A CIEĽ

Si release agent hry **Ashen Vow** (dark-fantasy pixel-art akčné RPG, čistý JavaScript + Canvas). Tvoja úloha:

1. zostaviť a overiť webový build hry pre itch.io,
2. nahrať ho na itch.io stránku hry cez oficiálny nástroj **butler**,
3. vyplniť itch.io stránku (texty, embed nastavenia, tagy, obrázky) — **ale neuložiť ju**; uloží ju Commander,
4. pripraviť podklady (`release/PROMO_BRIEF.md` + screenshoty) pre výrobnú linku promo videí a YouTube shorts.

Commander (Denis) každý krok potvrdzuje. Pracuješ presne podľa tohto dokumentu; ak sa realita líši (chyba, iné tlačidlo na itch.io, iný výstup príkazu), **zastav sa a opýtaj sa** — nehádaj a neimprovizuj.

## PEVNÉ PRAVIDLÁ (platia vždy)

1. **Nemeň hru.** Súbory v `src/`, `assets/`, `tools/`, `index.html`, `package.json` iba čítaš. Zapisovať smieš len do `release/` (je v `.gitignore`).
2. **Žiadny git zápis.** Žiadne `git commit`, `push`, `reset`, `checkout`, `stash`. Čítať (`git status`, `git log`) môžeš.
3. **Kľúč od itch.io** existuje len ako Starnet service key s názvom **`Butler`** → v shelli je to premenná `BUTLER_API_KEY`, ktorú butler číta sám. Kľúč **nikdy** nevypisuj, nezapisuj do súboru, nevkladaj do príkazu ani do chatu. Ak chýba, zastav sa (pozri Krok 3).
4. **Heslá nikdy nezadávaš.** Ak prehliadač nie je prihlásený na itch.io, odovzdaj ho Commanderovi, nech sa prihlási sám.
5. **Nič nezverejňuj.** Viditeľnosť stránky ostáva **Draft**. Formulár na itch.io vyplníš, ale **tlačidlo Save neklikneš** — to urobí Commander na BRÁNE 3.
6. **Jedna vec naraz.** Po každom kroku stručne napíš, čo vyšlo (čísla, nie dojmy). Pri chybe ukáž presný výstup.

## FAKTY / KONFIGURÁCIA

| čo | hodnota |
|---|---|
| projekt | `C:\Users\Admin\Desktop\THEGAME` (git repo, vetva `main`) |
| build príkaz | `npm run build:itch` (Node.js ≥ 18) |
| výstup buildu | `dist\` (hra) a `release\ashen-vow-itch.zip` (pre itch.io) |
| lokálne spustenie buildu | `npm run serve:dist` → http://localhost:8081 |
| živá webová verzia | https://ashen-vow-ruddy.vercel.app |
| itch.io účet | `deniscoke` |
| itch.io stránka | https://deniscoke.itch.io/ahsen-vow (slug `ahsen-vow`, pozri BRÁNU 1) |
| butler cieľ | `deniscoke/<slug>:html5` |
| limity itch.io pre HTML | max 1 000 súborov v ZIP, max 500 MB, `index.html` v koreni ZIP |

---

## KROK 1 — Kontrola projektu

Spusti v `C:\Users\Admin\Desktop\THEGAME`:

```
node -v
git status --short
git log --oneline -1
npm test
```

Očakávané: Node v18 alebo novší; `git status --short` bez výstupu (čistý strom); `npm test` končí riadkami
`0 error(s), 0 warning(s)`, `PASSED: 250 checks passed, 0 failed` a `0 failure(s)`.
Ak test zlyhá, spusti ho ešte raz (simulácia je zriedka nestabilná). Ak zlyhá znova, **zastav sa** a ukáž výstup.

Zapamätaj si krátky hash commitu: `git rev-parse --short HEAD` → `<SHA>`. Verzia pre itch bude `0.9.0-beta.<SHA>`.

## KROK 2 — Build pre itch.io

```
npm run build:itch
```

Očakávaný výstup (čísla sa môžu mierne líšiť):

```
dist/ ready: 106 files, 23.5 MB (bundle game.xxxxxxxx.js 1.7 MB, 101 voice packs 21.8 MB, 1438 lines)
release/ashen-vow-itch.zip ready: 106 files, 22.3 MB (index.html at the root)
```

Over ZIP nezávisle (PowerShell):

```
Add-Type -AssemblyName System.IO.Compression.FileSystem
$z = [IO.Compression.ZipFile]::OpenRead("$PWD\release\ashen-vow-itch.zip")
"files: $($z.Entries.Count)"; "index.html at root: $([bool]($z.Entries | Where-Object FullName -eq 'index.html'))"
"backslashes in names: $([bool]($z.Entries | Where-Object FullName -like '*\*'))"; $z.Dispose()
```

Musí platiť: súborov < 1000, `index.html at root: True`, `backslashes in names: False`.

**Rýchly test hry:** spusti na pozadí `npm run serve:dist`, otvor http://localhost:8081, počkaj 3 s.
Musí sa ukázať titulná obrazovka „ASHEN VOW“ a konzola nesmie mať chyby. (Server nechaj bežať, treba ho v Kroku 5.)

## ⛔ BRÁNA 1 — Adresa stránky

Slug stránky je **`ahsen-vow`** (preklep: „ahsen“ namiesto „ashen“). Táto adresa pôjde do popisov všetkých shortov, takže treba rozhodnúť **teraz**, pred nahratím:

- **A) Opraviť na `ashen-vow` (odporúčané).** Commander na itch.io → Edit game → pole *Project URL* zmení na `ashen-vow` a uloží. Potom používaj slug `ashen-vow`.
- **B) Nechať `ahsen-vow`.**

Opýtaj sa Commandera, ktorú možnosť chce, a počkaj. Ďalej píšem `<slug>` = zvolený slug.

## KROK 3 — butler (oficiálny uploader itch.io)

1. Skontroluj `butler -V`. Ak príkaz neexistuje, nainštaluj butler **iba z oficiálneho zdroja itch.io**:
   ```
   $dir = "$env:LOCALAPPDATA\itch-butler"; New-Item -ItemType Directory -Force $dir | Out-Null
   Invoke-WebRequest "https://broth.itch.zone/butler/windows-amd64/LATEST/archive/default" -OutFile "$dir\butler.zip"
   Expand-Archive "$dir\butler.zip" -DestinationPath $dir -Force
   & "$dir\butler.exe" -V
   ```
   Ďalej volaj butler cez plnú cestu `"$env:LOCALAPPDATA\itch-butler\butler.exe"`, ak nie je v PATH.
2. Skontroluj, že premenná `BUTLER_API_KEY` existuje — **bez vypísania hodnoty**:
   `if ($env:BUTLER_API_KEY) { 'key: present' } else { 'key: MISSING' }`
   Ak chýba, **zastav sa** a povedz Commanderovi:
   *„Vytvor kľúč na https://itch.io/user/settings/api-keys (Generate new API key) a ulož ho v Starnete ako service key s názvom `Butler`, povolený pre tento beh.“*
3. Over prístup: `butler status deniscoke/<slug>` musí prejsť bez chyby autentifikácie (prázdny zoznam kanálov je v poriadku).

## ⛔ BRÁNA 2 — Nahratie

Ukáž Commanderovi presne tento príkaz a počkaj na „áno“:

```
butler push "release\ashen-vow-itch.zip" deniscoke/<slug>:html5 --userversion "0.9.0-beta.<SHA>"
```

Po potvrdení ho spusti. Potom opakuj `butler status deniscoke/<slug>:html5`, kým build nie je spracovaný
(stav prestane byť *processing*). Zapíš si číslo buildu a veľkosť.

## KROK 4 — Screenshoty a obrázok obálky

Zachytávaj z **lokálneho buildu** (http://localhost:8081), nie zo živej stránky ani z Commanderovho prehliadača.
Ladiace príkazy totiž resetujú uloženú hru v danom prehliadači.

- Okno, presnejšie viewport prehliadača, nastav na **1152 × 648**. Hra sa potom zobrazí presne v 3× mierke, s ostrými pixelmi a bez rozmazania.
- Prvý klik do hry spustí zvuk. Ladiace príkazy zadávaj do konzoly prehliadača.
- Pred každou scénou počkaj približne 2 s, kým sa scéna rozsvieti.
- Ukladaj do `release\itch-media\` ako PNG 1152 × 648:

| súbor | ako sa tam dostať |
|---|---|
| `01_title.png` | čerstvo načítaná stránka, počkaj ~4 s na titulnú obrazovku |
| `02_village.png` | `AV.debug.play('village')` — Saint Wendel's Rest, centrum hry |
| `03_dialogue.png` | `AV.debug.play('chandlery'); AV.dlg.start('linnet_hub')` — preklikávaj (Enter), kým nie je vidieť Linnetin portrét |
| `04_hushwood.png` | `AV.debug.play('hushwood_deep')` — les |
| `05_abbey.png` | `AV.debug.play('abbey_cloister')` — utopené opátstvo |
| `06_combat.png` | `AV.debug.play('greyharrow_field')` — prejdi k nepriateľom a zachyť útok (J = útok, medzerník = kotúľ) |
| `07_city.png` | `AV.debug.play('upper_city')` — Hallowhearth |

**Nefoť konce hry, záverečné titulky ani tajný koniec** (spoilery).
**Obálka** `cover_630x500.png`: z `01_title.png` alebo `02_village.png` vystrihni stred v pomere 630:500 a zmenši na 630 × 500 (najbližší sused, nie vyhladzovanie). Ak má výrobná linka vlastného dizajnéra obálok, použi jeho verziu, rozmer musí byť 630 × 500.

## KROK 5 — Vyplnenie stránky na itch.io (BEZ uloženia)

Otvor https://itch.io/dashboard → **Ashen Vow** → **Edit**. Ak nie si prihlásený, odovzdaj prehliadač Commanderovi (pravidlo 4).
Vyplň presne takto:

| pole | hodnota |
|---|---|
| Title | `Ashen Vow` |
| Project URL | `<slug>` (podľa BRÁNY 1) |
| Short description or tagline | `A knight who cannot die walks the kingdom he burned. A dark-fantasy pixel-art action RPG.` |
| Classification | Games |
| Kind of project | **HTML** |
| Release status | **In development** |
| Pricing | **No payments** (Commander to môže zmeniť na „$0 or donate“) |
| Uploads | pri súbore z kanála `html5` zaškrtni **„This file will be played in the browser“** |
| Embed options → Embed in page | áno |
| Viewport dimensions | **1152 × 648** |
| Mobile friendly | **áno**, Orientation: **Landscape** |
| Automatically start on page load | **nie** (prvý klik je potrebný na spustenie zvuku) |
| Fullscreen button | **áno** |
| Enable scrollbars | nie |
| SharedArrayBuffer support | nie |
| Description | text z časti **POPIS STRÁNKY** nižšie |
| Genre | **Role Playing** |
| Tags (max 10) | `pixel-art, dark-fantasy, action-rpg, story-rich, souls-like, atmospheric, multiple-endings, singleplayer, medieval, retro` |
| Community | **Comments** (spätná väzba z bety) |
| Visibility & access | **Draft** — nemeniť |
| Cover image | `release\itch-media\cover_630x500.png` |
| Screenshots | `02`–`07` z Kroku 4 (titulnú obrazovku nie) |
| Gameplay video or trailer | nechaj prázdne, doplní výrobná linka |

**AI disclosure.** Ak edit stránka obsahuje sekciu o obsahu generovanom AI, odpovedz pravdivo a znenie daj Commanderovi potvrdiť:
*„Yes: character voices are generated with ElevenLabs text-to-speech. Code, pixel art, music and story text were created with AI assistance (Claude) and directed and edited by the developer.“*

**Theme (voliteľné, Edit theme):** pozadie `#07060a`, text `#ebe5dc`, odkazy `#f59a36`.

### POPIS STRÁNKY (vlož ako Description)

```
You lit the fire that ended a kingdom. Now you cannot stay dead.

ASHEN VOW is a dark-fantasy, story-driven pixel-art action RPG. You are Ser Emeric Brand, the knight who started the
Kindling. Walk a broken land, learn what really happened on the night the city burned, and decide what redemption can
mean when nothing you did can be undone.

FEATURES
• 5 regions and 28 hand-built maps: a candlelit hub village, a hushed forest, a drowned abbey, an old battlefield and
  its ossuary, and the burning capital
• Tight melee combat: a 3-hit combo, invulnerable rolls, stamina, and the Kindle, a curse that doubles your strength
  at a price the game remembers
• Death is part of the story: you return to the last shrine, and something is taken each time
• 5 bosses and 13 enemy types
• 36 characters and about 2,500 lines of dialogue, with fully voiced character dialogue
• Choices are tracked silently. There is no morality meter. 5 endings, 1 of them hidden.
• Every sprite, tile, font, sound and note of music is generated in code at runtime

CONTROLS
Keyboard: WASD / arrows move · J or Z attack · Space roll · E interact · R heal · Q kindle · Tab inventory · Esc pause
Gamepad supported.
Phone or tablet: turn the device to landscape. Left side = move, buttons on the right = attack, roll, use and heal.

GOOD TO KNOW
• A first playthrough takes about an hour. Completionists will spend longer.
• Your progress saves in this browser (shrines and doorways). Clearing site data erases it.
• Headphones recommended.

BETA
This is an early public build. Found a bug, got stuck, or have a thought? Leave a comment below. Please mention your
device and browser. Every report helps.

Content: dark themes (death, fire, grief, disease). Stylised pixel violence, no gore.
Voices generated with ElevenLabs. Made with plain JavaScript and HTML5 Canvas.
```

## ⛔ BRÁNA 3 — Kontrola a uloženie (robí Commander)

**Neklikaj Save.** Zastav sa a pošli Commanderovi zhrnutie:

- verziu (`0.9.0-beta.<SHA>`), číslo buildu z butlera a veľkosť,
- zoznam všetkých vyplnených polí s hodnotami,
- nahrané obrázky (názvy súborov),
- čo sa nepodarilo alebo čo vyzeralo inak, než tento dokument opisuje.

Commander skontroluje stránku a **sám klikne Save** (viditeľnosť ostane Draft). Počkaj na jeho správu „uložené“.

## KROK 6 — Overenie po uložení

1. Otvor `https://deniscoke.itch.io/<slug>` (Draft vidí len prihlásený vlastník) → **Run game**.
2. Musí sa načítať titulná obrazovka. Klikni, spusti **New Game** (Enter), choď niekoľko krokov, otvor pauzu (Esc). V konzole nesmú byť chyby.
3. Zapni tlačidlo celej obrazovky. Hra sa musí prispôsobiť obrazovke bez orezania.
4. Zapíš výsledok. Test na mobile (Mobile friendly) urobí Commander na svojom telefóne.

Zverejnenie (**Visibility → Public**) robí výlučne Commander, keď bude spokojný.

## KROK 7 — Odovzdanie výrobnej linke (promo / YouTube shorts)

Vytvor `release\PROMO_BRIEF.md` s týmto obsahom (doplň skutočný odkaz a zoznam súborov):

```
# Ashen Vow - promo brief

LINK: https://deniscoke.itch.io/<slug>   (play free in the browser, desktop and phone)
LOGLINE: You lit the fire that ended a kingdom. Now you cannot stay dead.
GENRE: dark-fantasy pixel-art action RPG · ~1 h story · 5 endings (1 hidden) · voiced characters

HOOKS FOR SHORTS (first 1-2 s)
1. "You burned a kingdom. Now you can't die." Death, then respawn at a shrine.
2. "Every death takes something." Death screen to shrine.
3. "This curse doubles your strength... and the game remembers." Kindle activation in combat.
4. "No morality meter. The game just remembers." A dialogue choice with a portrait.
5. "Everything in this game is generated by code." Montage of regions.

VISUALS: captures in release/itch-media/ (1152x648, 3x pixel scale). Record new gameplay from
http://localhost:8081 (npm run serve:dist) with a 1152x648 viewport; debug scenes: AV.debug.play('<map>').
Maps: village, chandlery, hushwood_edge, hushwood_deep, mere_shore, abbey_cloister, greyharrow_field,
ossuary, royal_road, upper_city, wickward.
9:16 SHORTS: the game is 16:9. Put the 16:9 frame in the middle and fill the rest with a blurred, enlarged copy, or
crop to the knight. Always scale pixels by nearest neighbour (no blur on the pixel art).
PALETTE: background #07060a, ember orange #f59a36, parchment #ebe5dc.
CTA: "Play free in your browser - link in description."
HASHTAGS: #indiegame #pixelart #darkfantasy #rpg #gamedev #itchio

DO NOT SHOW: any ending, the credits, the Pyre finale, the hidden ending (spoilers).
RIGHTS: music and sound effects are generated by the game itself (own work). The character voices come from
ElevenLabs. Before using them in monetised videos, confirm that the ElevenLabs plan allows commercial use.
```

## ZÁVEREČNÁ SPRÁVA (pošli Commanderovi)

- ✅/❌ pre každý krok 1–7 (jedným riadkom, s číslami)
- odkaz na stránku, verzia, číslo buildu
- cesta k `release\PROMO_BRIEF.md` a `release\itch-media\`
- otvorené body (čo musí urobiť Commander: Save, Public, test na telefóne)
