#!/usr/bin/env node
// Render game art to PNG so builders can look at it.
//   node tools/preview.js sheet <id> [scale]
//   node tools/preview.js sheets [prefix] [scale]
//   node tools/preview.js portraits [scale]
//   node tools/preview.js icons [scale]
//   node tools/preview.js tiles <theme> [scale]
//   node tools/preview.js map <mapId> [scale]
'use strict';
const path = require('path');
const { ROOT, loadGame, Img, writePNG } = require('./lib');

const [, , mode, arg1, arg2] = process.argv;
const { AV, errors } = loadGame();
for (const e of errors) console.error(`LOAD ERROR in ${e.file}:\n${e.message}\n`);
const out = (name) => path.join(ROOT, 'preview', name + '.png');
const BG_A = [26, 23, 32], BG_B = [34, 29, 39];

function save(img, name, scale) {
  const file = out(name);
  writePNG(file, img.scaled(scale));
  console.log('wrote ' + path.relative(ROOT, file) + ` (${img.w * scale}x${img.h * scale})`);
}

function sheetImage(id) {
  const s = AV.art.buildSheet(id);
  if (!s) return null;
  const names = Object.keys(s.anims);
  let maxFrames = 1;
  for (const n of names) maxFrames = Math.max(maxFrames, s.anims[n].frames.length);
  const pad = 2;
  const cw = s.w + pad, ch = s.h + pad;
  const img = new Img(cw * maxFrames + pad, ch * names.length + pad);
  img.checker(BG_A, BG_B, 4);
  names.forEach((n, row) => {
    s.anims[n].frames.forEach((g, col) => {
      const x = pad + col * cw, y = pad + row * ch;
      img.blitGrid(g, x, y);
      img.setPx(x + s.ox, y + s.oy, 255, 0, 255, 160); // anchor
    });
  });
  return { img, names, s };
}

function run() {
  switch (mode) {
    case 'sheet': {
      const r = sheetImage(arg1);
      if (!r) { console.error('No sheet ' + arg1); process.exit(1); }
      r.names.forEach((n, i) => console.log(`row ${i}: ${n} (${r.s.anims[n].frames.length} frames @ ${r.s.anims[n].fps}fps${r.s.anims[n].loop ? '' : ', once'})`));
      save(r.img, 'sheet_' + arg1, +(arg2 || 4));
      break;
    }
    case 'sheets': {
      const prefix = arg1 && isNaN(+arg1) ? arg1 : '';
      const scale = +(prefix ? arg2 : arg1) || 2;
      const ids = Object.keys(AV.art.defs.sheet).filter((id) => id.startsWith(prefix)).sort();
      const parts = ids.map((id) => ({ id, r: sheetImage(id) })).filter((p) => p.r);
      const W = Math.max(64, ...parts.map((p) => p.r.img.w));
      const H = parts.reduce((a, p) => a + p.r.img.h + 3, 0) || 8;
      const img = new Img(W, H, [10, 8, 12]);
      let y = 0;
      for (const p of parts) { img.blitRGBA(p.r.img.d, p.r.img.w, p.r.img.h, 0, y); console.log(`y=${y}: ${p.id}`); y += p.r.img.h + 3; }
      save(img, 'sheets' + (prefix ? '_' + prefix : ''), scale);
      break;
    }
    case 'portraits':
    case 'icons': {
      const defs = mode === 'portraits' ? AV.art.defs.portrait : AV.art.defs.icon;
      const build = mode === 'portraits' ? AV.art.buildPortrait : AV.art.buildIcon;
      const ids = Object.keys(defs).sort();
      const items = [];
      for (const id of ids) { const p = build(id); p.frames.forEach((g, i) => items.push({ id, i, g })); }
      const cell = mode === 'portraits' ? 52 : 20;
      const cols = mode === 'portraits' ? 8 : 16;
      const img = new Img(cols * cell + 4, Math.ceil(items.length / cols) * cell + 4);
      img.checker(BG_A, BG_B, 4);
      items.forEach((it, k) => {
        img.blitGrid(it.g, 4 + (k % cols) * cell, 4 + Math.floor(k / cols) * cell);
      });
      items.forEach((it, k) => console.log(`#${k} (row ${Math.floor(k / cols)}, col ${k % cols}): ${it.id}${it.i ? ' [' + it.i + ']' : ''}`));
      save(img, mode, +(arg1 || (mode === 'portraits' ? 3 : 4)));
      break;
    }
    case 'tiles': {
      const theme = arg1 || 'village';
      const ids = Object.keys(AV.tiles.defs).sort();
      // Build a synthetic map: each tile id as a 3x2 block on a floor field, 6 blocks per row
      const per = 6, bw = 5, bh = 5;
      const rows = Math.ceil(ids.length / per);
      const W = per * bw, H = rows * bh;
      const grid = { w: W, h: H, ids: new Array(W * H).fill('floor') };
      ids.forEach((id, k) => {
        const bx = (k % per) * bw + 1, by = Math.floor(k / per) * bh + 1;
        for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) grid.ids[(by + j) * W + bx + i] = id;
      });
      const r = AV.tiles.renderRGBA(grid, theme, null);
      const img = new Img(r.W, r.H);
      img.blitRGBA(r.frames[0], r.W, r.H, 0, 0);
      // tall tiles
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const tg = AV.tiles.buildTall(grid, x, y, theme, null);
        if (tg) img.blitGrid(tg, x * 16 + 8 - Math.floor(tg.w / 2), y * 16 + 16 - tg.h);
      }
      ids.forEach((id, k) => console.log(`block ${k} (row ${Math.floor(k / per)}, col ${k % per}): ${id}${AV.tiles.defs[id].anim > 1 ? ' [anim ' + AV.tiles.defs[id].anim + ']' : ''}`));
      save(img, 'tiles_' + theme, +(arg2 || 2));
      break;
    }
    case 'map': {
      const map = AV.data.maps[arg1];
      if (!map) { console.error('No map ' + arg1 + '. Known: ' + Object.keys(AV.data.maps).join(', ')); process.exit(1); }
      const grid = AV.tiles.resolve(map);
      const r = AV.tiles.renderRGBA(grid, map.theme || 'village', null, map.floorTile);
      const img = new Img(r.W, r.H);
      img.blitRGBA(r.frames[0], r.W, r.H, 0, 0);
      const draws = [];
      for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) {
        const tg = AV.tiles.buildTall(grid, x, y, map.theme || 'village', null);
        if (tg) draws.push({ y: y * 16 + 16, fn: () => img.blitGrid(tg, x * 16 + 8 - Math.floor(tg.w / 2), y * 16 + 16 - tg.h) });
      }
      const sheetCache = {};
      const drawSprite = (id, anim, px, py, flip) => {
        if (!(id in sheetCache)) sheetCache[id] = AV.art.buildSheet(id);
        const s = sheetCache[id];
        if (!s) return false;
        const a = s.anims[anim] || s.anims.idle || s.anims[Object.keys(s.anims)[0]];
        if (!a) return false;
        const g = a.frames[0];
        img.blitGrid(g, Math.round(px - (flip ? s.w - s.ox : s.ox)), Math.round(py - s.oy), flip);
        return true;
      };
      const rects = [];
      for (const e of map.entities || []) {
        const px = e.x * 16 + 8, py = e.y * 16 + 14;
        switch (e.type) {
          case 'prop': case 'decal':
            draws.push({ y: e.type === 'decal' ? -1 : py, fn: () => drawSprite(e.sprite, e.anim || 'idle', px, py, e.flip) || img.rectFill(px - 3, py - 6, 6, 6, [255, 0, 255]) });
            break;
          case 'npc': {
            const n = AV.data.npcs[e.npc];
            draws.push({ y: py, fn: () => (n && drawSprite(n.sprite, n.anim || 'idle', px, py, e.dir === 'left')) || img.rectFill(px - 4, py - 16, 8, 16, [80, 200, 255]) });
            break;
          }
          case 'enemy':
            draws.push({ y: py, fn: () => drawSprite('enemy_' + e.kind, 'idle', px, py) || img.rectFill(px - 4, py - 10, 8, 10, [255, 60, 60]) });
            break;
          case 'boss':
            draws.push({ y: py, fn: () => drawSprite(e.boss, 'idle', px, py) || img.rectFill(px - 12, py - 24, 24, 24, [255, 0, 0]) });
            if (e.arena) rects.push([e.arena, [255, 40, 40]]);
            break;
          case 'shrine':
            draws.push({ y: py, fn: () => drawSprite('prop_shrine', 'lit', px, py) || img.rectFill(px - 3, py - 12, 6, 12, [255, 200, 80]) });
            break;
          case 'item': case 'corpse':
            draws.push({ y: py, fn: () => { if (e.sprite) drawSprite(e.sprite, 'idle', px, py); img.rectFill(px - 1, py - 4, 3, 3, [255, 240, 120]); } });
            break;
          case 'sign':
            draws.push({ y: py, fn: () => { if (e.sprite) drawSprite(e.sprite, 'idle', px, py); img.rectFill(px - 1, py - 8, 3, 3, [200, 200, 255]); } });
            break;
          case 'exit': rects.push([{ x: e.x, y: e.y, w: e.w || 1, h: e.h || 1 }, [60, 255, 255]]); break;
          case 'door': rects.push([{ x: e.x, y: e.y, w: 1, h: 1 }, [60, 255, 255]]);
            if (e.sprite) draws.push({ y: py, fn: () => drawSprite(e.sprite, 'idle', px, py) }); break;
          case 'barrier': rects.push([{ x: e.x, y: e.y, w: e.w || 1, h: e.h || 1 }, [255, 140, 0]]);
            if (e.sprite) draws.push({ y: e.y * 16 + (e.h || 1) * 16 - 2, fn: () => drawSprite(e.sprite, 'idle', (e.x + (e.w || 1) / 2) * 16, e.y * 16 + (e.h || 1) * 16 - 2) }); break;
          case 'trigger': rects.push([{ x: e.x, y: e.y, w: e.w || 1, h: e.h || 1 }, [255, 60, 255]]); break;
          case 'light': draws.push({ y: 99999, fn: () => img.rectOutline(px - 2, py - 8, 5, 5, [255, 220, 120]) }); break;
          default: break;
        }
      }
      draws.sort((a, b) => a.y - b.y).forEach((d) => d.fn());
      for (const [rc, col] of rects) img.rectOutline(rc.x * 16, rc.y * 16, rc.w * 16, rc.h * 16, col, 200);
      for (const k in map.spawns || {}) {
        const [sx, sy] = map.spawns[k];
        const px = sx * 16 + 8, py = sy * 16 + 8;
        for (let i = -3; i <= 3; i++) { img.setPx(px + i, py, 60, 255, 120); img.setPx(px, py + i, 60, 255, 120); }
        console.log(`spawn ${k} @ ${sx},${sy} (tile '${grid.ids[sy * grid.w + sx]}')`);
      }
      save(img, 'map_' + arg1, +(arg2 || 1));
      break;
    }
    default:
      console.log('usage: node tools/preview.js sheet <id> | sheets [prefix] | portraits | icons | tiles <theme> | map <mapId> [scale]');
  }
}
run();
