// ASHEN VOW — pixel-art grid, master palette, sprite registry (environment-agnostic; baking needs a DOM)
(function (AV) {
  'use strict';
  const U = AV.util;

  const PALETTE = {
    '0': '#07060a', '1': '#141118', '2': '#221d27', '3': '#332c38', '4': '#4a4250', '5': '#655c69',
    '6': '#857c86', '7': '#a8a0a6', '8': '#cbc4c3', '9': '#ebe5dc',
    'a': '#1f140f', 'b': '#3a261a', 'c': '#5a3a24', 'd': '#7d5634', 'e': '#a3784a', 'f': '#c9a26e', 'g': '#e6cc9c',
    'h': '#6b4a3c', 'i': '#9c705a', 'j': '#c8987a',
    'k': '#3d0f0a', 'l': '#7a1c10', 'm': '#b8361a', 'n': '#e2621f', 'o': '#f59a36', 'p': '#fccf63', 'q': '#fff3c2',
    'r': '#0c1219', 's': '#152331', 't': '#22384a', 'u': '#365466', 'v': '#537a86', 'w': '#82a8ad', 'x': '#b9d6d3',
    'y': '#e4f4ef',
    'z': '#141a12', 'A': '#222b1c', 'B': '#343f28', 'C': '#4d5a38', 'D': '#6f7a4e', 'E': '#97a070',
    'F': '#2a0c14', 'G': '#4c1422', 'H': '#7a2230', 'I': '#a8363c',
    'J': '#4a3a1c', 'K': '#7a6230', 'L': '#a88a48', 'M': '#d4b96a',
    'N': '#6e7472', 'O': '#9aa09c',
    'P': '#1c1426', 'Q': '#2e2240', 'R': '#4a3a60',
    'S': '#c2beb0', 'T': '#dcd8ca',
  };
  AV.PALETTE = PALETTE;

  const rgbCache = {};
  function colorRGB(c) {
    if (c == null || c === '.' || c === ' ') return null;
    if (rgbCache[c]) return rgbCache[c];
    let hex = PALETTE[c];
    if (!hex) {
      if (typeof c === 'string' && c[0] === '#') hex = c;
      else { AV.warnOnce('Unknown palette colour: ' + c); hex = '#ff00ff'; }
    }
    return (rgbCache[c] = U.hexToRgb(hex));
  }
  AV.colorRGB = colorRGB;
  AV.color = (c) => (PALETTE[c] || c);

  // ---------------------------------------------------------------- Grid
  class Grid {
    constructor(w, h) {
      this.w = w | 0; this.h = h | 0;
      this.d = new Array(this.w * this.h).fill(null);
    }
    _norm(c) { return c == null || c === '.' || c === ' ' ? null : c; }
    px(x, y, c) {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
      this.d[y * this.w + x] = this._norm(c);
      return this;
    }
    get(x, y) {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
      return this.d[y * this.w + x];
    }
    rect(x, y, w, h, c) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
      return this;
    }
    box(x, y, w, h, c) {
      for (let i = 0; i < w; i++) { this.px(x + i, y, c); this.px(x + i, y + h - 1, c); }
      for (let j = 0; j < h; j++) { this.px(x, y + j, c); this.px(x + w - 1, y + j, c); }
      return this;
    }
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (let guard = 0; guard < 4096; guard++) {
        this.px(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
      return this;
    }
    circle(cx, cy, r, c) {
      const r2 = (r + 0.5) * (r + 0.5);
      for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
        for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++)
          if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r2) this.px(x, y, c);
      return this;
    }
    ring(cx, cy, r, c) {
      const outer = (r + 0.5) * (r + 0.5), inner = (r - 0.5) * (r - 0.5);
      for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
        for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
          const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
          if (d <= outer && d >= inner) this.px(x, y, c);
        }
      return this;
    }
    ellipse(cx, cy, rx, ry, c) {
      if (rx <= 0 || ry <= 0) return this.px(cx, cy, c);
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const nx = (x - cx) / (rx + 0.5), ny = (y - cy) / (ry + 0.5);
          if (nx * nx + ny * ny <= 1) this.px(x, y, c);
        }
      return this;
    }
    poly(pts, c) {
      if (!pts || pts.length < 3) return this;
      let minY = Infinity, maxY = -Infinity;
      for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
      for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
        const xs = [];
        const sy = y + 0.5;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) {
            xs.push(a[0] + ((sy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
          }
        }
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2)
          for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.px(x, y, c);
      }
      // edges, so thin polys still show
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        this.line(a[0], a[1], b[0], b[1], c);
      }
      return this;
    }
    stamp(x, y, rows) {
      for (let j = 0; j < rows.length; j++) {
        const row = rows[j];
        for (let i = 0; i < row.length; i++) {
          const ch = row[i];
          if (ch !== '.' && ch !== ' ') this.px(x + i, y + j, ch);
        }
      }
      return this;
    }
    stampFlip(x, y, rows) {
      for (let j = 0; j < rows.length; j++) {
        const row = rows[j];
        for (let i = 0; i < row.length; i++) {
          const ch = row[row.length - 1 - i];
          if (ch !== '.' && ch !== ' ') this.px(x + i, y + j, ch);
        }
      }
      return this;
    }
    outline(c = '0', diagonal = false) {
      const add = [];
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          if (this.d[y * this.w + x] != null) continue;
          let near = this.get(x - 1, y) != null || this.get(x + 1, y) != null ||
            this.get(x, y - 1) != null || this.get(x, y + 1) != null;
          if (!near && diagonal)
            near = this.get(x - 1, y - 1) != null || this.get(x + 1, y - 1) != null ||
              this.get(x - 1, y + 1) != null || this.get(x + 1, y + 1) != null;
          if (near) add.push(x, y);
        }
      for (let i = 0; i < add.length; i += 2) this.px(add[i], add[i + 1], c);
      return this;
    }
    replace(from, to) {
      for (let i = 0; i < this.d.length; i++) if (this.d[i] === from) this.d[i] = this._norm(to);
      return this;
    }
    each(fn) {
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const r = fn(x, y, this.d[y * this.w + x]);
          if (r !== undefined) this.d[y * this.w + x] = this._norm(r);
        }
      return this;
    }
    noise(x, y, w, h, chars, density = 0.1, seed = 1) {
      const R = U.rng(seed);
      const list = Array.isArray(chars) ? chars : String(chars).split('');
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
        if (R() < density) this.px(x + i, y + j, list[Math.floor(R() * list.length)]);
      return this;
    }
    dither(x, y, w, h, c) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
        if (((x + i) + (y + j)) % 2 === 0) this.px(x + i, y + j, c);
      return this;
    }
    mirrorX() {
      const half = Math.floor(this.w / 2);
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < half; x++) this.d[y * this.w + (this.w - 1 - x)] = this.d[y * this.w + x];
      return this;
    }
    flipX() {
      for (let y = 0; y < this.h; y++) {
        const row = this.d.slice(y * this.w, (y + 1) * this.w).reverse();
        for (let x = 0; x < this.w; x++) this.d[y * this.w + x] = row[x];
      }
      return this;
    }
    shift(dx, dy) {
      const nd = new Array(this.w * this.h).fill(null);
      for (let y = 0; y < this.h; y++)
        for (let x = 0; x < this.w; x++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < this.w && ny < this.h) nd[ny * this.w + nx] = this.d[y * this.w + x];
        }
      this.d = nd;
      return this;
    }
    blit(src, x, y) {
      for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) {
        const c = src.d[j * src.w + i];
        if (c != null) this.px(x + i, y + j, c);
      }
      return this;
    }
    clone() { const g = new Grid(this.w, this.h); g.d = this.d.slice(); return g; }
    rnd(seed) { return U.rng(seed); }
    toRows() {
      const rows = [];
      for (let y = 0; y < this.h; y++) {
        let s = '';
        for (let x = 0; x < this.w; x++) { const c = this.d[y * this.w + x]; s += c == null ? '.' : (c.length === 1 ? c : '?'); }
        rows.push(s);
      }
      return rows;
    }
    toRGBA() {
      const out = new Uint8ClampedArray(this.w * this.h * 4);
      for (let i = 0; i < this.d.length; i++) {
        const rgb = colorRGB(this.d[i]);
        if (!rgb) continue;
        out[i * 4] = rgb[0]; out[i * 4 + 1] = rgb[1]; out[i * 4 + 2] = rgb[2]; out[i * 4 + 3] = 255;
      }
      return out;
    }
  }
  AV.Grid = Grid;

  function gridFromRows(w, h, rows) {
    const g = new Grid(w, h);
    if (rows) g.stamp(0, 0, rows);
    return g;
  }

  // ---------------------------------------------------------------- registry
  const art = AV.art = AV.art || {};
  art.defs = art.defs || { sheet: {}, portrait: {}, icon: {} };
  art.grid = (w, h) => new Grid(w, h);

  art.sheet = (id, def) => { art.defs.sheet[id] = def; };
  art.portrait = (id, def) => { art.defs.portrait[id] = def; };
  art.icon = (id, def) => { art.defs.icon[id] = def; };

  // Build grids from a definition (lazy; used by baking and by the Node preview tool)
  function buildFrames(w, h, spec, label) {
    const frames = [];
    try {
      if (spec.frames) {
        for (const f of spec.frames) {
          if (typeof f === 'function') { const g = new Grid(w, h); f(g); frames.push(g); }
          else frames.push(gridFromRows(w, h, f));
        }
      } else if (spec.draw) {
        const n = spec.count || 1;
        for (let i = 0; i < n; i++) { const g = new Grid(w, h); spec.draw(g, i); frames.push(g); }
      } else if (spec.rows) {
        frames.push(gridFromRows(w, h, spec.rows));
      }
    } catch (err) {
      console.error('[AV art] failed building ' + label + ': ' + err.message);
      const g = new Grid(w, h); g.rect(0, 0, w, h, 'I'); frames.push(g);
    }
    if (!frames.length) { const g = new Grid(w, h); frames.push(g); }
    return frames;
  }

  art.buildSheet = function (id) {
    const def = art.defs.sheet[id];
    if (!def) return null;
    const w = def.w || 16, h = def.h || 16;
    const out = { id, w, h, ox: def.ox != null ? def.ox : Math.floor(w / 2), oy: def.oy != null ? def.oy : h - 1, anims: {} };
    for (const name in def.anims) {
      const spec = def.anims[name];
      out.anims[name] = {
        fps: spec.fps || 6,
        loop: spec.loop !== false,
        frames: buildFrames(w, h, spec, id + '.' + name),
      };
    }
    return out;
  };
  art.buildPortrait = function (id) {
    const def = art.defs.portrait[id];
    if (!def) return null;
    return { id, w: def.w || 48, h: def.h || 48, frames: buildFrames(def.w || 48, def.h || 48, def, 'portrait ' + id) };
  };
  art.buildIcon = function (id) {
    const def = art.defs.icon[id];
    if (!def) return null;
    return { id, w: def.w || 16, h: def.h || 16, frames: buildFrames(def.w || 16, def.h || 16, def, 'icon ' + id) };
  };

  // ---------------------------------------------------------------- baking (browser)
  art.sheets = {};
  art.portraits = {};
  art.icons = {};

  function gridToCanvas(g, tint) {
    const cv = document.createElement('canvas');
    cv.width = g.w; cv.height = g.h;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(g.w, g.h);
    const rgba = g.toRGBA();
    if (tint) {
      const t = U.hexToRgb(tint);
      for (let i = 0; i < rgba.length; i += 4) if (rgba[i + 3]) { rgba[i] = t[0]; rgba[i + 1] = t[1]; rgba[i + 2] = t[2]; }
    }
    img.data.set(rgba);
    ctx.putImageData(img, 0, 0);
    return cv;
  }
  art.gridToCanvas = gridToCanvas;

  art.bakeAll = function () {
    for (const id in art.defs.sheet) art.bakeSheet(id);
    for (const id in art.defs.portrait) {
      const p = art.buildPortrait(id);
      art.portraits[id] = { w: p.w, h: p.h, frames: p.frames.map((g) => gridToCanvas(g)) };
    }
    for (const id in art.defs.icon) {
      const p = art.buildIcon(id);
      art.icons[id] = { w: p.w, h: p.h, frames: p.frames.map((g) => gridToCanvas(g)) };
    }
  };
  art.bakeSheet = function (id) {
    const s = art.buildSheet(id);
    if (!s) return null;
    const baked = { id, w: s.w, h: s.h, ox: s.ox, oy: s.oy, anims: {} };
    for (const name in s.anims) {
      const a = s.anims[name];
      baked.anims[name] = {
        fps: a.fps, loop: a.loop,
        frames: a.frames.map((g) => gridToCanvas(g)),
        flash: null,          // built lazily
        grids: a.frames,
      };
    }
    art.sheets[id] = baked;
    return baked;
  };

  art.has = (id) => !!(art.sheets[id] || art.defs.sheet[id]);

  // Resolve an anim with graceful fallback (walk_side → walk → idle_side → idle → first)
  art.anim = function (id, name) {
    const s = art.sheets[id];
    if (!s) return null;
    if (s.anims[name]) return s.anims[name];
    const base = name.split('_')[0];
    const dir = name.split('_')[1];
    return s.anims[base] || (dir && s.anims['idle_' + dir]) || s.anims.idle || s.anims[Object.keys(s.anims)[0]];
  };
  art.frameIndex = function (a, t) {
    if (!a) return 0;
    const n = a.frames.length;
    const f = Math.floor(t * a.fps);
    return a.loop ? ((f % n) + n) % n : Math.min(f, n - 1);
  };
  art.animDone = function (id, name, t) {
    const a = art.anim(id, name);
    if (!a) return true;
    return !a.loop && t * a.fps >= a.frames.length;
  };

  // draw(ctx, id, anim, t, x, y, opts) — x,y = anchor position (feet) in screen pixels
  art.draw = function (ctx, id, anim, t, x, y, opts) {
    const s = art.sheets[id];
    if (!s) { AV.warnOnce('Missing sprite sheet: ' + id); return false; }
    const a = art.anim(id, anim);
    if (!a) return false;
    const fi = opts && opts.frame != null ? Math.min(opts.frame, a.frames.length - 1) : art.frameIndex(a, t);
    let cv = a.frames[fi];
    if (opts && opts.flash) {
      const col = opts.flashColor || '#fff3c2';
      if (!a.flashes) a.flashes = {};
      if (!a.flashes[col]) a.flashes[col] = a.grids.map((g) => gridToCanvas(g, col));
      cv = a.flashes[col][fi];
    }
    const flip = opts && opts.flip;
    const dx = Math.round(x - (flip ? s.w - s.ox : s.ox));
    const dy = Math.round(y - s.oy);
    const alpha = opts && opts.alpha != null ? opts.alpha : 1;
    if (alpha <= 0) return true;
    const prevA = ctx.globalAlpha;
    if (alpha !== 1) ctx.globalAlpha = prevA * alpha;
    if (flip) {
      ctx.save();
      ctx.translate(dx + s.w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(cv, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(cv, dx, dy);
    }
    if (alpha !== 1) ctx.globalAlpha = prevA;
    return true;
  };

  art.drawPortrait = function (ctx, id, frame, x, y) {
    const p = art.portraits[id];
    if (!p) return false;
    const cv = p.frames[U.clamp(frame | 0, 0, p.frames.length - 1)];
    ctx.drawImage(cv, Math.round(x), Math.round(y));
    return true;
  };
  art.drawIcon = function (ctx, id, x, y) {
    const p = art.icons[id];
    if (!p) return false;
    ctx.drawImage(p.frames[0], Math.round(x), Math.round(y));
    return true;
  };
})(typeof window !== 'undefined' ? window.AV : globalThis.AV);
