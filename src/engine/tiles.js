// ASHEN VOW — tile registry, legend and map tile-layer rendering (environment-agnostic core)
(function (AV) {
  'use strict';
  const U = AV.util;
  const T = AV.TILE;

  const tiles = AV.tiles = AV.tiles || {};
  tiles.defs = tiles.defs || {};

  tiles.legend = {
    '.': 'floor', ',': 'grass', ':': 'path', ';': 'cobble', '_': 'wood_floor', '=': 'flagstone', '-': 'shallow',
    'a': 'ash', 'm': 'mud', 'b': 'bones', 'r': 'rubble', 'u': 'rug', 's': 'stairs', 'x': 'burnt', '%': 'lilies',
    "'": 'leaves', 'L': 'embers', '*': 'candles',
    '#': 'wall', 'B': 'wall_brick', 'W': 'wall_wood', 'w': 'window', '^': 'roof', 'c': 'cliff', '~': 'water',
    'T': 'tree', 't': 'shrub', 'R': 'rock', 'F': 'fence', 'I': 'railing', 'P': 'palisade', 'g': 'grave',
    '+': 'marker', '|': 'pillar', 'p': 'pew', 'k': 'shelf', 'X': 'void', '!': 'brazier', 'C': 'wall_cracked',
    'H': 'wall_false', 'D': 'doorway', 'G': 'gate_bars',
  };

  // Solidity defaults (used if the art file omits `solid`)
  const SOLID_DEFAULT = new Set(['wall', 'wall_brick', 'wall_wood', 'window', 'roof', 'cliff', 'water', 'tree',
    'shrub', 'rock', 'fence', 'railing', 'palisade', 'grave', 'marker', 'pillar', 'pew', 'shelf', 'void', 'brazier',
    'wall_cracked', 'gate_bars']);

  tiles.def = function (id, def) { tiles.defs[id] = def; };

  tiles.isSolid = function (id) {
    const d = tiles.defs[id];
    if (d && d.solid != null) return !!d.solid;
    return SOLID_DEFAULT.has(id);
  };
  tiles.isWater = (id) => id === 'water' || id === 'shallow';
  tiles.isHazard = (id) => id === 'embers';

  // Resolve a map's rows into a tile-id matrix
  tiles.resolve = function (map) {
    const rows = map.tiles || [];
    const h = rows.length;
    let w = 0;
    for (const r of rows) w = Math.max(w, r.length);
    const legend = Object.assign({}, tiles.legend, map.legend || {});
    const ids = new Array(w * h);
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < w; x++) {
        const ch = x < row.length ? row[x] : '.';
        let id = legend[ch];
        if (!id) { AV.warnOnce(`Map uses unknown tile char '${ch}'`); id = 'floor'; }
        ids[y * w + x] = id;
      }
    }
    return { w, h, ids };
  };

  function makeCtx(grid, x, y, theme, frame, broken) {
    const w = grid.w, h = grid.h;
    const idAt = (xx, yy) => {
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) return null;
      const k = yy * w + xx;
      if (broken && broken.has(k)) return 'rubble';
      return grid.ids[k];
    };
    const self = idAt(x, y);
    const variant = U.hash2(x, y, 7) % 8;
    let seed = U.hash2(x, y, 99) || 1;
    return {
      theme, variant, frame, x, y,
      tile: (dx, dy) => idAt(x + dx, y + dy),
      same: (dx, dy) => { const t = idAt(x + dx, y + dy); return t === null ? true : t === self; },
      solid: (dx, dy) => { const t = idAt(x + dx, y + dy); return t === null ? true : tiles.isSolid(t); },
      rnd: U.rng(seed),
    };
  }

  // Build the 16×16 ground-layer grid for a cell (floor underlay + tile), or null if not drawable
  tiles.buildCell = function (grid, x, y, theme, frame, broken, floorId) {
    const k = y * grid.w + x;
    const id = broken && broken.has(k) ? 'rubble' : grid.ids[k];
    const def = tiles.defs[id];
    const g = new AV.Grid(T, T);
    const under = (def && def.under) || floorId || 'floor';
    const needUnder = !def || !def.opaque || def.tall;
    if (needUnder && under !== id) {
      const ud = tiles.defs[under];
      if (ud && ud.draw) { try { ud.draw(g, makeCtx(grid, x, y, theme, frame, broken)); } catch (e) { /* ignore */ } }
    }
    if (def && def.draw && !def.tall) {
      try { def.draw(g, makeCtx(grid, x, y, theme, frame, broken)); }
      catch (e) { AV.warnOnce(`Tile '${id}' draw failed: ${e.message}`); }
    } else if (!def) {
      AV.warnOnce(`Missing tile def '${id}'`);
      g.rect(0, 0, T, T, id && tiles.isSolid(id) ? '3' : '2');
    }
    return g;
  };

  tiles.buildTall = function (grid, x, y, theme, broken) {
    const id = grid.ids[y * grid.w + x];
    const def = tiles.defs[id];
    if (!def || !def.tall) return null;
    const g = new AV.Grid(def.tall.w, def.tall.h);
    try { def.draw(g, makeCtx(grid, x, y, theme, 0, broken)); }
    catch (e) { AV.warnOnce(`Tall tile '${id}' draw failed: ${e.message}`); }
    return g;
  };

  // Number of animation frames the map's ground layer needs
  tiles.frameCount = function (grid) {
    let n = 1;
    const seen = new Set(grid.ids);
    for (const id of seen) {
      const d = tiles.defs[id];
      if (d && d.anim > 1) n = Math.max(n, d.anim);
    }
    return Math.min(n, 4);
  };

  // Render the full ground layer into RGBA buffers, one per animation frame.
  tiles.renderRGBA = function (grid, theme, broken, floorId) {
    const W = grid.w * T, H = grid.h * T;
    const frames = tiles.frameCount(grid);
    const base = new Uint8ClampedArray(W * H * 4);
    const animCells = [];
    const blit = (buf, g, cx, cy) => {
      const rgba = g.toRGBA();
      for (let j = 0; j < T; j++) {
        const dst = ((cy * T + j) * W + cx * T) * 4;
        buf.set(rgba.subarray(j * T * 4, (j + 1) * T * 4), dst);
      }
    };
    for (let y = 0; y < grid.h; y++)
      for (let x = 0; x < grid.w; x++) {
        const id = grid.ids[y * grid.w + x];
        const d = tiles.defs[id];
        if (d && d.anim > 1) animCells.push([x, y]);
        blit(base, tiles.buildCell(grid, x, y, theme, 0, broken, floorId), x, y);
      }
    const out = [base];
    for (let f = 1; f < frames; f++) {
      const buf = new Uint8ClampedArray(base);
      for (const [x, y] of animCells) {
        const d = tiles.defs[grid.ids[y * grid.w + x]];
        blit(buf, tiles.buildCell(grid, x, y, theme, f % d.anim, broken, floorId), x, y);
      }
      out.push(buf);
    }
    return { W, H, frames: out };
  };

  // Lights emitted by tiles
  tiles.lights = function (grid) {
    const out = [];
    for (let y = 0; y < grid.h; y++)
      for (let x = 0; x < grid.w; x++) {
        const d = tiles.defs[grid.ids[y * grid.w + x]];
        if (d && d.light) out.push(Object.assign({ x: x * T + 8, y: y * T + 8 }, d.light));
      }
    return out;
  };
})(typeof window !== 'undefined' ? window.AV : globalThis.AV);
