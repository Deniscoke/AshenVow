// ASHEN VOW - bitmap fonts.
//   'small' : variable-width book face for dialogue and UI (cap 6 px, x-height 4, descenders 2, line 9 px)
//   'large' : high-contrast roman display capitals for titles, chapter cards and boss names (cap 11 px, line 16 px)
// Glyphs are string bitmaps parsed at load (no DOM needed). Canvas atlases are baked lazily, one per font+colour.
(function (AV) {
  'use strict';

  const MARKUP = { e: '#f59a36', g: '#857c86', i: '#b9d6d3', r: '#a8363c', w: '#ebe5dc' };
  const BASE = '#ebe5dc';
  const SHADOW = '#07060a';
  const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

  // ------------------------------------------------------------------ glyph sheets
  // Each block: [chars, row0, row1, ...]. Glyphs within a row are separated by one space; '#' = ink, '.' = empty.
  // Rows missing at the bottom of a block are blank.

  // small: rows 0-5 cap height (baseline under row 5), rows 2-5 x-height, rows 6-7 descenders, row 8 leading.
  const SMALL = {
    h: 8, line: 9, spacing: 1, space: 2, cap: 6, baseline: 6, fallback: '?',
    alias: { '\t': ' ', '\u00a0': ' ', '\u2009': ' ', '\u2010': '-', '\u2011': '-', '\u2012': '\u2013', '\u2015': '\u2014',
      '\u2212': '-', '\u00ab': '<', '\u00bb': '>', '\u201a': ',', '\u201e': '\u201d', '\u00b4': '\u2019', '\u2032': "'", '\u2033': '"' },
    sheet: [
      ['ABCDEFGHIJKLM',
        '..#.. ###. .##. ###. #### #### .##. #..# ### .### #..# #... #...#',
        '.#.#. #..# #..# #..# #... #... #..# #..# .#. ...# #.#. #... ##.##',
        '#...# ###. #... #..# ###. ###. #... #### .#. ...# ##.. #... #.#.#',
        '##### #..# #... #..# #... #... #.## #..# .#. ...# #.#. #... #...#',
        '#...# #..# #..# #..# #... #... #..# #..# .#. #..# #..# #... #...#',
        '#...# ###. .##. ###. #### #... .### #..# ### .##. #..# #### #...#'],
      ['NOPQRSTUVWXYZ',
        '#...# .##. ###. .##. ###. .##. ##### #..# #...# #...# #...# #...# ####',
        '##..# #..# #..# #..# #..# #..# ..#.. #..# #...# #...# .#.#. #...# ...#',
        '#.#.# #..# #..# #..# #..# .#.. ..#.. #..# #...# #.#.# ..#.. .#.#. ..#.',
        '#..## #..# ###. #..# ###. ..#. ..#.. #..# .#.#. #.#.# ..#.. ..#.. .#..',
        '#...# #..# #... #.#. #.#. #..# ..#.. #..# .#.#. #.#.# .#.#. ..#.. #...',
        '#...# .##. #... .#.# #..# .##. ..#.. .##. ..#.. .#.#. #...# ..#.. ####'],
      ['abcdefghijklm',
        '.... #... ... ...# .... .## .... #... #. .# #.. #. .....',
        '.... #... ... ...# .... #.. .... #... .. .. #.. #. .....',
        '.### ###. .## .### .##. ### .### ###. #. .# #.# #. ##.#.',
        '#..# #..# #.. #..# #### #.. #..# #..# #. .# ##. #. #.#.#',
        '#..# #..# #.. #..# #... #.. #..# #..# #. .# #.# #. #.#.#',
        '.### ###. .## .### .### #.. .### #..# .# .# #.# .# #.#.#',
        '.... .... ... .... .... ... ...# .... .. .# ... .. .....',
        '.... .... ... .... .... ... .##. .... .. #. ... .. .....'],
      ['nopqrstuvwxyz',
        '.... .... .... .... ... .... ... .... ... ..... .... .... ....',
        '.... .... .... .... ... .... #.. .... ... ..... .... .... ....',
        '###. .##. ###. .### #.# .### ### #..# #.# #...# #..# #..# ####',
        '#..# #..# #..# #..# ##. ##.. #.. #..# #.# #.#.# .##. #..# ..#.',
        '#..# #..# #..# #..# #.. ..## #.. #..# #.# #.#.# .##. #..# .#..',
        '#..# .##. ###. .### #.. ###. .## .### .#. .#.#. #..# .### ####',
        '.... .... #... ...# ... .... ... .... ... ..... .... ...# ....',
        '.... .... #... ...# ... .... ... .... ... ..... .... .##. ....'],
      ['0123456789',
        '.##. .#. .##. ###. ..## #### .##. #### .##. .##.',
        '#..# ##. #..# ...# .#.# #... #... ...# #..# #..#',
        '#..# .#. ...# .##. #..# ###. ###. ..#. .##. #..#',
        '#..# .#. ..#. ...# #### ...# #..# ..#. #..# .###',
        '#..# .#. .#.. ...# ...# ...# #..# .#.. #..# ...#',
        '.##. ### #### ###. ...# ###. .##. .#.. .##. .##.'],
      ['.,:;!?\'"-\u2013\u2014\u2026\u00b7',
        '. . . . # .##. # #.# ... .... ....... ..... .',
        '. . . . # #..# # #.# ... .... ....... ..... .',
        '. . # # # ..#. . ... ... .... ....... ..... .',
        '. . . . # .#.. . ... ### #### ####### ..... #',
        '. . . . . .... . ... ... .... ....... ..... .',
        '# # # # # .#.. . ... ... .... ....... #.#.# .',
        '. # . # . .... . ... ... .... ....... ..... .'],
      ['\u2018\u2019\u201c\u201d()[]/\\|_',
        '.# ## .#..# ##.## .# #. ## ## ..# #.. # ....',
        '#. .# #..#. .#..# #. .# #. .# ..# #.. # ....',
        '## #. ##.## #..#. #. .# #. .# .#. .#. # ....',
        '.. .. ..... ..... #. .# #. .# .#. .#. # ....',
        '.. .. ..... ..... #. .# #. .# #.. ..# # ....',
        '.. .. ..... ..... #. .# #. .# #.. ..# # ....',
        '.. .. ..... ..... .# #. ## ## ... ... # ####'],
      ['+=<>*#%&@$^`~{}',
        '... ... ... ... #.# ..... #..# .##.. .###. .#. .#. #. .... .## ##.',
        '... ... ..# #.. .#. .#.#. ...# #..#. #...# ### #.# .# .... .#. .#.',
        '.#. ### .#. .#. #.# ##### ..#. .##.. #.### #.. ... .. .#.# .#. .#.',
        '### ... #.. ..# ... .#.#. .#.. #.#.# #.#.# ### ... .. #.#. #.. ..#',
        '.#. ### .#. .#. ... ##### #... #..#. #.##. ..# ... .. .... .#. .#.',
        '... ... ..# #.. ... .#.#. #..# .##.# #.... ### ... .. .... .#. .#.',
        '... ... ... ... ... ..... .... ..... .###. .#. ... .. .... .## ##.'],
      ['\u00d7\u2022\u2190\u2191\u2192\u2193\u00e9\u00e8\u00ea',
        '... .. ..... ..#.. ..... ..#.. ..#. .#.. .##.',
        '... .. ..#.. .###. ..#.. ..#.. .... .... ....',
        '#.# .. .#... #.#.# ...#. ..#.. .##. .##. .##.',
        '.#. ## ##### ..#.. ##### #.#.# #### #### ####',
        '#.# ## .#... ..#.. ...#. .###. #... #... #...',
        '... .. ..#.. ..#.. ..#.. ..#.. .### .### .###'],
    ],
  };

  // large: rows 0-10 cap height (baseline under row 10), rows 11-12 tails (Q , ;), line 16 px.
  const LARGE = {
    h: 13, line: 16, spacing: 1, space: 5, cap: 11, baseline: 11, fallback: '?', upper: true,
    alias: { '\t': ' ', '\u00a0': ' ', '\u2010': '-', '\u2011': '-', '\u2012': '\u2013', '\u2015': '\u2014', '\u2212': '-',
      '\u00ab': '\u201c', '\u00bb': '\u201d', '\u201a': ',', '\u201e': '\u201c', '`': '\u2018', '\u00b4': '\u2019', '|': 'I', '[': '(', ']': ')',
      '{': '(', '}': ')', '\\': '/', '_': '-', '\u00d7': 'X', '\u2022': '\u00b7' },
    sheet: [
      ['ABCDE',
        '.....#..... ######... ...#####. ######.... #########',
        '.....##.... .##...#.. .##....## .##...##.. .##.....#',
        '....###.... .##...##. ##......# .##....##. .##......',
        '....#.##... .##...##. ##....... .##.....## .##......',
        '...#..##... .##..##.. ##....... .##.....## .##...#..',
        '...#...##.. .######.. ##....... .##.....## .######..',
        '..#....##.. .##....#. ##....... .##.....## .##...#..',
        '..#######.. .##....## ##....... .##.....## .##......',
        '.#......##. .##....## ##......# .##....##. .##......',
        '.#......##. .##...##. .##....## .##...##.. .##.....#',
        '###....#### #######.. ...#####. ######.... #########'],
      ['FGHIJ',
        '######### ...#####.. ####...#### #### ..####',
        '.##.....# .##....##. .##.....##. .##. ...##.',
        '.##...... ##......#. .##.....##. .##. ...##.',
        '.##...... ##........ .##.....##. .##. ...##.',
        '.##...#.. ##........ .##.....##. .##. ...##.',
        '.######.. ##....#### .#########. .##. ...##.',
        '.##...#.. ##.....##. .##.....##. .##. ...##.',
        '.##...... ##.....##. .##.....##. .##. ...##.',
        '.##...... ##.....##. .##.....##. .##. ...##.',
        '.##...... .##....##. .##.....##. .##. #..##.',
        '####..... ...#####.. ####...#### #### .###..'],
      ['KLMN',
        '####..#### ####..... ###.....#### ###.....###',
        '.##.....#. .##...... .##.....###. .##......#.',
        '.##....#.. .##...... .###....###. .###.....#.',
        '.##...#... .##...... .###....###. .#.##....#.',
        '.##..#.... .##...... .#.##..#.##. .#..##...#.',
        '.####..... .##...... .#.##..#.##. .#...##..#.',
        '.##.##.... .##...... .#..##.#.##. .#....##.#.',
        '.##..##... .##...... .#..###..##. .#.....###.',
        '.##...##.. .##...... .#...##..##. .#......##.',
        '.##....##. .##.....# .#...##..##. .#.......#.',
        '####..#### ######### ###.....#### ###......#.'],
      ['OPQR',
        '...#####... #######.. ...#####... #######...',
        '.##.....##. .##....#. .##.....##. .##....#..',
        '##.......## .##....## ##.......## .##....##.',
        '##.......## .##....## ##.......## .##....##.',
        '##.......## .##....## ##.......## .##....##.',
        '##.......## .##...##. ##.......## .##...##..',
        '##.......## .#####... ##.......## .#####....',
        '##.......## .##...... ##.......## .##.##....',
        '##.......## .##...... ##.......## .##..##...',
        '.##.....##. .##...... .##.....##. .##...##..',
        '...#####... ####..... ...#####... ####...###',
        '........... ......... ......##... ..........',
        '........... ......... .......#### ..........'],
      ['STUV',
        '..####.# ########## ####...### ####....###',
        '.##...## #...##...# .##.....#. .##......#.',
        '##.....# ....##.... .##.....#. .##......#.',
        '##...... ....##.... .##.....#. ..##....#..',
        '.###.... ....##.... .##.....#. ..##....#..',
        '..####.. ....##.... .##.....#. ...##..#...',
        '....###. ....##.... .##.....#. ...##..#...',
        '......## ....##.... .##.....#. ....##.#...',
        '#.....## ....##.... .##.....#. ....###....',
        '##...##. ....##.... ..##...#.. .....##....',
        '#.####.. ...####... ...####... .....#.....'],
      ['WXYZ',
        '####..####...### ####...###. ####...### #########',
        '.##....###....#. .##.....#.. .##.....#. #.....##.',
        '.##....###....#. ..##...#... ..##...#.. .....##..',
        '..##...#.##...#. ..##...#... ...##.#... .....##..',
        '..##..#..##..#.. ...##.#.... ....###... ....##...',
        '..##..#..##..#.. ....##..... ....##.... ...##....',
        '...##.#...##.#.. ....###.... ....##.... ..##.....',
        '...###....###... ...#..##... ....##.... ..##.....',
        '....##.....##... ..#....##.. ....##.... .##......',
        '....##.....##... ..#....##.. ....##.... ##......#',
        '....#......#.... ###...####. ...####... #########'],
      ['01234',
        '..####.. ..##.. ..####.. .#####.. .....##..',
        '.##..##. ####.. .##..##. ##...##. ....###..',
        '##....## ..##.. ##....## ......## ...#.##..',
        '##....## ..##.. ......## ......## ..#..##..',
        '##....## ..##.. .....##. .....##. .#...##..',
        '##....## ..##.. ....##.. ...###.. #....##..',
        '##....## ..##.. ...##... .....##. #########',
        '##....## ..##.. ..##.... ......## .....##..',
        '##....## ..##.. .##....# ......## .....##..',
        '.##..##. ..##.. ##.....# ##...##. .....##..',
        '..####.. ###### ######## .#####.. ....####.'],
      ['56789',
        '######## ...####. ######## ..####.. ..####..',
        '##...... ..##.... #.....## .##..##. .##..##.',
        '##...... .##..... .....##. ##....## ##....##',
        '##...... ##...... .....##. ##....## ##....##',
        '######.. ##.###.. ....##.. .##..##. ##....##',
        '.....##. ###..##. ....##.. ..####.. .##..###',
        '......## ##....## ...##... .##..##. ..###.##',
        '......## ##....## ...##... ##....## ......##',
        '......## ##....## ..##.... ##....## .....##.',
        '##...##. .##..##. ..##.... .##..##. ....##..',
        '.#####.. ..####.. ..##.... ..####.. .####...'],
      ['.,:;!?',
        '.. .. .. .. ## .#####.',
        '.. .. .. .. ## ##...##',
        '.. .. .. .. ## ##...##',
        '.. .. ## ## ## .....##',
        '.. .. ## ## ## ....##.',
        '.. .. .. .. ## ...##..',
        '.. .. .. .. ## ...##..',
        '.. .. .. .. .. .......',
        '.. .. .. .. .. .......',
        '## ## ## ## ## ...##..',
        '## ## ## ## ## ...##..',
        '.. .# .. .# .. .......',
        '.. #. .. #. .. .......'],
      ['\'\u2019\u2018"\u201c\u201d',
        '## ## .# ##.## .#..# ##.##',
        '## ## #. ##.## #..#. ##.##',
        '.# .# ## .#..# ##.## .#..#',
        '#. #. ## #..#. ##.## #..#.'],
      ['-\u2013\u2014\u2026\u00b7()/',
        '..... ....... ........... ........ .. ...# #... .....#',
        '..... ....... ........... ........ .. ..#. .#.. .....#',
        '..... ....... ........... ........ .. .##. .##. ....#.',
        '..... ....... ........... ........ .. ##.. ..## ....#.',
        '..... ....... ........... ........ ## ##.. ..## ...#..',
        '##### ####### ########### ........ ## ##.. ..## ...#..',
        '..... ....... ........... ........ .. ##.. ..## ..#...',
        '..... ....... ........... ........ .. ##.. ..## ..#...',
        '..... ....... ........... ........ .. ##.. ..## .#....',
        '..... ....... ........... ##.##.## .. .##. .##. .#....',
        '..... ....... ........... ##.##.## .. ..#. .#.. #.....',
        '..... ....... ........... ........ .. ...# #... ......'],
    ],
  };

  // ------------------------------------------------------------------ parsing (pure, runs in Node too)
  function buildFont(id, spec) {
    const F = {
      id, h: spec.h, line: spec.line, spacing: spec.spacing, cap: spec.cap, baseline: spec.baseline,
      upper: !!spec.upper, alias: spec.alias || {}, glyphs: Object.create(null), resolved: Object.create(null),
      list: [], atlasW: 1, mask: undefined,
    };
    for (const block of spec.sheet) {
      const chars = block[0];
      const rows = block.slice(1).map((r) => r.split(' '));
      for (let k = 0; k < chars.length; k++) {
        const ch = chars[k];
        const w = rows[0][k] ? rows[0][k].length : 0;
        const bits = [];
        for (let y = 0; y < rows.length && y < F.h; y++) {
          const seg = rows[y][k] || '';
          if (seg.length !== w && AV.warnOnce) AV.warnOnce(`font ${id}: glyph '${ch}' row ${y} is ${seg.length} wide, expected ${w}`);
          for (let x = 0; x < w; x++) if (seg[x] === '#') bits.push(x, y);
        }
        const g = { ch, w, bits, ax: 0 };
        F.glyphs[ch] = g;
        F.list.push(g);
      }
    }
    F.glyphs[' '] = { ch: ' ', w: spec.space, bits: [], ax: 0 };
    let ax = 0;
    for (const g of F.list) { g.ax = ax; ax += g.w + 1; }
    F.atlasW = Math.max(1, ax);
    F.fallbackGlyph = F.glyphs[spec.fallback];
    return F;
  }

  const FONTS = { small: buildFont('small', SMALL), large: buildFont('large', LARGE) };
  const fontOf = (name) => FONTS[name] || FONTS.small;

  function glyphOf(F, ch) {
    let g = F.glyphs[ch];
    if (g) return g;
    g = F.resolved[ch];
    if (g) return g;
    const a = F.alias[ch];
    if (a != null) g = F.glyphs[a];
    if (!g && F.upper) g = F.glyphs[ch.toUpperCase()];
    if (!g && ch.normalize) {
      const base = ch.normalize('NFD')[0];
      g = F.glyphs[base] || (F.upper ? F.glyphs[base.toUpperCase()] : null);
    }
    if (!g) g = /\s/.test(ch) ? F.glyphs[' '] : F.fallbackGlyph;
    F.resolved[ch] = g;
    return g;
  }

  // ------------------------------------------------------------------ markup
  // Recognised tags: {e} {g} {i} {r} {w} {/} and {#rgb}/{#rrggbb}. Anything else in braces is literal text.
  let tagColor = null;
  function tagLen(text, i) {
    if (text.charCodeAt(i) !== 123) return 0;
    const j = text.indexOf('}', i + 1);
    if (j < 0 || j - i > 8) return 0;
    const body = text.slice(i + 1, j);
    if (body === '/') { tagColor = null; return j - i + 1; }
    if (MARKUP[body] || HEX_RE.test(body)) { tagColor = body; return j - i + 1; }
    return 0;
  }
  const resolveColor = (c, base) => (c == null ? base : (MARKUP[c] || c));

  function strip(text) {
    text = text == null ? '' : String(text);
    if (text.indexOf('{') < 0) return text;
    let out = '';
    for (let i = 0; i < text.length;) {
      const n = tagLen(text, i);
      if (n) { i += n; continue; }
      out += text[i++];
    }
    return out;
  }

  function visibleBetween(text, a, b) {
    let n = 0;
    for (let i = a; i < b;) {
      const t = tagLen(text, i);
      if (t) { i += t; continue; }
      n++; i++;
    }
    return n;
  }

  // ------------------------------------------------------------------ line breaking
  // Returns [{ s, e, c, w }]: slice [s, e) of the source text, colour tag active at s, width in font px.
  // Soft breaks drop the spaces they break on; hard breaks ('\n') keep leading spaces of the next line.
  function breakLines(text, maxW, F) {
    const out = [];
    const n = text.length;
    const sp = F.spacing;
    const spaceAdv = F.glyphs[' '].w + sp;
    let i = 0, color = null;
    let ls = 0, lc = null, pen = 0, le = 0, any = false, pend = 0;
    const flush = () => out.push({ s: ls, e: any ? le : ls, c: lc, w: any ? Math.max(0, pen - sp) : 0 });
    while (i < n) {
      const ch = text[i];
      if (ch === '\n') {
        flush();
        i++; ls = i; lc = color; pen = 0; le = i; any = false; pend = 0;
        continue;
      }
      if (ch === ' ') { pend += spaceAdv; i++; continue; }
      const ws = i, wc = color;
      let j = i, wAdv = 0, col = color;
      while (j < n && text[j] !== ' ' && text[j] !== '\n') {
        tagColor = col;
        const t = tagLen(text, j);
        if (t) { col = tagColor; j += t; continue; }
        const g = glyphOf(F, text[j]);
        wAdv += g.w + sp;
        j++;
      }
      if (maxW > 0 && any && pen + pend + wAdv - sp > maxW) {
        flush();
        ls = ws; lc = wc; pen = 0; pend = 0; any = false;
      }
      if (maxW > 0 && pen + pend + wAdv - sp > maxW) {
        // A single word wider than the line: break it between characters.
        pen += pend; pend = 0;
        let k = ws; col = wc;
        while (k < j) {
          tagColor = col;
          const t = tagLen(text, k);
          if (t) { col = tagColor; k += t; continue; }
          const a = glyphOf(F, text[k]).w + sp;
          if (pen > 0 && pen + a - sp > maxW) {
            any = true; le = k; flush();
            ls = k; lc = col; pen = 0;
          }
          pen += a; k++;
        }
      } else {
        pen += pend + wAdv; pend = 0;
      }
      le = j; any = true; color = col; i = j;
    }
    flush();
    return out;
  }

  // ------------------------------------------------------------------ layout (cached)
  const layoutCache = new Map();
  function layout(text, F, maxW, align) {
    text = text == null ? '' : String(text);
    const key = F.id + '\u0001' + maxW + '\u0001' + align + '\u0001' + text;
    let L = layoutCache.get(key);
    if (L) return L;
    const lines = breakLines(text, maxW, F);
    const items = [];
    let vis = 0, pos = 0, wmax = 0, minX = 0;
    for (let li = 0; li < lines.length; li++) {
      const ln = lines[li];
      vis += visibleBetween(text, pos, ln.s);
      let x = align === 'center' ? -Math.floor(ln.w / 2) : align === 'right' ? -ln.w : 0;
      if (x < minX) minX = x;
      const y = li * F.line;
      let col = ln.c;
      for (let i = ln.s; i < ln.e;) {
        tagColor = col;
        const t = tagLen(text, i);
        if (t) { col = tagColor; i += t; continue; }
        const g = glyphOf(F, text[i]);
        if (g.bits.length) items.push({ g, x, y, c: col, n: vis });
        x += g.w + F.spacing;
        vis++; i++;
      }
      pos = ln.e;
      if (ln.w > wmax) wmax = ln.w;
    }
    vis += visibleBetween(text, pos, text.length);
    L = { items, w: wmax, h: lines.length * F.line, lines: lines.length, total: vis, minX };
    if (layoutCache.size > 400) layoutCache.delete(layoutCache.keys().next().value);
    layoutCache.set(key, L);
    return L;
  }

  // ------------------------------------------------------------------ canvas atlases (browser only, lazy)
  function makeCanvas(w, h) {
    if (typeof document !== 'undefined' && document.createElement) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      return c;
    }
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    return null;
  }
  function maskOf(F) {
    if (F.mask !== undefined) return F.mask;
    const cv = makeCanvas(F.atlasW, F.h);
    if (!cv) return (F.mask = null);
    const cx = cv.getContext('2d');
    const img = cx.createImageData(F.atlasW, F.h);
    for (const g of F.list) {
      for (let k = 0; k < g.bits.length; k += 2) {
        const p = (g.bits[k + 1] * F.atlasW + g.ax + g.bits[k]) * 4;
        img.data[p] = 255; img.data[p + 1] = 255; img.data[p + 2] = 255; img.data[p + 3] = 255;
      }
    }
    cx.putImageData(img, 0, 0);
    return (F.mask = cv);
  }
  const atlases = new Map();
  function atlasOf(F, color) {
    const key = F.id + '|' + color;
    let cv = atlases.get(key);
    if (cv) return cv;
    const m = maskOf(F);
    if (!m) return null;
    cv = makeCanvas(F.atlasW, F.h);
    const cx = cv.getContext('2d');
    cx.drawImage(m, 0, 0);
    cx.globalCompositeOperation = 'source-in';
    cx.fillStyle = (AV.PALETTE && AV.PALETTE[color]) || color;
    cx.fillRect(0, 0, F.atlasW, F.h);
    if (atlases.size >= 96) atlases.delete(atlases.keys().next().value);
    atlases.set(key, cv);
    return cv;
  }

  const OUTLINE = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

  function render(ctx, text, x, y, opts, baseColor) {
    const F = fontOf(opts.font);
    const s = Math.max(1, Math.floor(opts.scale || 1));
    const maxW = opts.maxWidth ? Math.floor(opts.maxWidth / s) : 0;
    const L = layout(text, F, maxW, opts.align || 'left');
    const width = L.w * s;
    if (!ctx || !L.items.length) return width;
    const alpha = opts.alpha == null ? 1 : opts.alpha;
    if (alpha <= 0) return width;
    const max = opts.maxChars == null ? Infinity : opts.maxChars;
    const X = Math.round(x), Y = Math.round(y);
    const gh = F.h, dh = gh * s;
    const prevA = ctx.globalAlpha, prevS = ctx.imageSmoothingEnabled;
    if (alpha !== 1) ctx.globalAlpha = prevA * alpha;
    ctx.imageSmoothingEnabled = false;
    const items = L.items;
    const pass = (color, ox, oy) => {
      const cv = atlasOf(F, color);
      if (!cv) return;
      for (let k = 0; k < items.length; k++) {
        const it = items[k];
        if (it.n >= max) break;
        const g = it.g;
        ctx.drawImage(cv, g.ax, 0, g.w, gh, X + ox + it.x * s, Y + oy + it.y * s, g.w * s, dh);
      }
    };
    if (opts.outline) for (const o of OUTLINE) pass(opts.outline, o[0] * s, o[1] * s);
    const shadow = opts.shadow === undefined ? SHADOW : opts.shadow;
    if (shadow) pass(shadow, s, s);
    let lastC, cv = null;
    for (let k = 0; k < items.length; k++) {
      const it = items[k];
      if (it.n >= max) break;
      const c = resolveColor(it.c, baseColor);
      if (c !== lastC) { lastC = c; cv = atlasOf(F, c); }
      if (!cv) break;
      const g = it.g;
      ctx.drawImage(cv, g.ax, 0, g.w, gh, X + it.x * s, Y + it.y * s, g.w * s, dh);
    }
    ctx.globalAlpha = prevA;
    ctx.imageSmoothingEnabled = prevS;
    return width;
  }

  // ------------------------------------------------------------------ public API
  const font = AV.font = AV.font || {};
  font.COLORS = MARKUP;
  font.fonts = FONTS;

  // draw(ctx, text, x, y, color, opts) -> width. Markup in text is honoured; color is the base colour.
  font.draw = function (ctx, text, x, y, color, opts) {
    opts = opts || {};
    return render(ctx, text, x, y, opts, color || opts.color || BASE);
  };

  // drawRich(ctx, text, x, y, opts) -> width. opts: color, font, maxChars, shadow, alpha, scale, align,
  // maxWidth (wrap inside the call; maxChars then counts every character of strip(text), '\n' and break spaces included),
  // outline (colour: 1px outline all round, drawn under the shadow).
  font.drawRich = function (ctx, text, x, y, opts) {
    opts = opts || {};
    return render(ctx, text, x, y, opts, opts.color || BASE);
  };

  // measure(text, font, scale) -> width in px of the widest line (markup ignored, no shadow).
  font.measure = function (text, name, scale) {
    const s = Math.max(1, Math.floor(scale || 1));
    return layout(text, fontOf(name), 0, 'left').w * s;
  };

  font.lineHeight = (name) => fontOf(name).line;
  font.capHeight = (name) => fontOf(name).cap;       // small 6, large 11: ink rows above the baseline
  font.baseline = (name) => fontOf(name).baseline;   // y offset of the baseline from the draw position

  // wrap(text, maxWidth, font) -> lines. Tags never count toward width; an open colour is re-opened on the next line.
  font.wrap = function (text, maxWidth, name) {
    text = text == null ? '' : String(text);
    const F = fontOf(name);
    return breakLines(text, maxWidth > 0 ? Math.floor(maxWidth) : 0, F)
      .map((ln) => (ln.c ? '{' + ln.c + '}' : '') + text.slice(ln.s, ln.e));
  };

  font.strip = strip;
  // Number of characters a typewriter reveals for text (== strip(text).length).
  font.count = (text) => strip(text).length;
  // Height in px of text laid out at maxWidth (0 = only hard breaks).
  font.height = function (text, maxWidth, name, scale) {
    const s = Math.max(1, Math.floor(scale || 1));
    return layout(text, fontOf(name), maxWidth ? Math.floor(maxWidth / s) : 0, 'left').h * s;
  };

  // rasterize(text, opts) -> { w, h, px } : pure-JS rendering (no DOM) into an array of '#rrggbb' | null,
  // using exactly the same layout as drawRich. Used by the Node preview tools; handy for grid-based effects.
  font.rasterize = function (text, opts) {
    opts = opts || {};
    const F = fontOf(opts.font);
    const maxW = opts.maxWidth || 0;
    const L = layout(text, F, maxW, opts.align || 'left');
    const shadow = opts.shadow === undefined ? SHADOW : opts.shadow;
    const pad = opts.outline ? 1 : 0;
    const w = Math.max(1, L.w + pad * 2 + (shadow ? 1 : 0));
    const h = Math.max(1, L.h + pad * 2);
    const px = new Array(w * h).fill(null);
    const max = opts.maxChars == null ? Infinity : opts.maxChars;
    const base = (AV.PALETTE && AV.PALETTE[opts.color]) || opts.color || BASE;
    const ox = pad - L.minX, oy = pad;
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = c; };
    const pass = (colorOf, dx, dy) => {
      for (const it of L.items) {
        if (it.n >= max) break;
        const c = colorOf(it);
        const b = it.g.bits;
        for (let k = 0; k < b.length; k += 2) put(ox + it.x + b[k] + dx, oy + it.y + b[k + 1] + dy, c);
      }
    };
    if (opts.outline) for (const o of OUTLINE) pass(() => opts.outline, o[0], o[1]);
    if (shadow) pass(() => shadow, 1, 1);
    pass((it) => resolveColor(it.c, base), 0, 0);
    return { w, h, px };
  };
})(typeof window !== 'undefined' ? window.AV : globalThis.AV);
