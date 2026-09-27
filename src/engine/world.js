// ASHEN VOW — a loaded map: baked tile layers, collision, entity slots with live presence, drawing
(function (AV) {
  'use strict';
  const U = AV.util;
  const T = AV.TILE;
  const S = AV.state;

  class World {
    constructor(id) {
      const def = AV.data.maps[id];
      if (!def) throw new Error('Unknown map ' + id);
      this.id = id;
      this.def = def;
      this.theme = def.theme || 'village';
      this.grid = AV.tiles.resolve(def);
      this.w = this.grid.w; this.h = this.grid.h;
      this.pw = this.w * T; this.ph = this.h * T;
      this.broken = new Set(S.d.broken[id] || []);
      this.entities = [];
      this.slots = [];
      this.arena = null;
      this.time = 0;
      // respawning enemies killed since the last rest/death persist across map visits
      const G = AV.game;
      if (G && G.killed) this.killed = G.killed[id] || (G.killed[id] = new Set());
      else this.killed = new Set();
      if (AV.headless) { this.layers = []; this.tall = []; this.staticLights = AV.tiles.lights(this.grid); }
      else this.bake();
      this.buildSlots();
    }

    // ---------------------------------------------------------------- tiles
    bake() {
      const r = AV.tiles.renderRGBA(this.grid, this.theme, this.broken, this.def.floorTile);
      this.layers = r.frames.map((buf) => {
        const cv = document.createElement('canvas');
        cv.width = r.W; cv.height = r.H;
        const c = cv.getContext('2d');
        const img = c.createImageData(r.W, r.H);
        img.data.set(buf);
        c.putImageData(img, 0, 0);
        return cv;
      });
      this.tall = [];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const k = y * this.w + x;
        if (this.broken.has(k)) continue;
        const g = AV.tiles.buildTall(this.grid, x, y, this.theme, this.broken);
        if (g) this.tall.push({ x: x * T + 8 - Math.floor(g.w / 2), y: y * T + T - g.h, base: y * T + T - 1, cv: AV.art.gridToCanvas(g), tx: x, ty: y });
      }
      this.staticLights = AV.tiles.lights(this.grid).filter((L) => !this.broken.has(Math.floor(L.y / T) * this.w + Math.floor(L.x / T)));
    }
    tileId(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return null;
      const k = ty * this.w + tx;
      if (this.broken.has(k)) return 'rubble';
      return this.grid.ids[k];
    }
    solidTile(tx, ty) {
      const id = this.tileId(tx, ty);
      if (id === null) return true;
      return AV.tiles.isSolid(id);
    }
    tileAtPx(x, y) { return this.tileId(Math.floor(x / T), Math.floor(y / T)); }

    breakWall(tx, ty) {
      const id = this.tileId(tx, ty);
      if (id !== 'wall_cracked') return false;
      const k = ty * this.w + tx;
      this.broken.add(k);
      const arr = S.d.broken[this.id] || (S.d.broken[this.id] = []);
      if (!arr.includes(k)) arr.push(k);
      // re-render this cell and its neighbours in every layer
      for (let f = 0; f < (AV.headless ? 0 : this.layers.length); f++) {
        const c = this.layers[f].getContext('2d');
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const x = tx + dx, y = ty + dy;
          if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
          const g = AV.tiles.buildCell(this.grid, x, y, this.theme, f, this.broken, this.def.floorTile);
          const img = c.createImageData(T, T);
          img.data.set(g.toRGBA());
          c.putImageData(img, x * T, y * T);
        }
      }
      const cx = tx * T + 8, cy = ty * T + 8;
      AV.fx.burst(cx, cy, 22, { color: ['#4a4250', '#655c69', '#857c86', '#332c38'], speed: 90, g: 180, life: 0.7, size: 2 });
      AV.fx.ash(cx, cy, 16);
      AV.fx.shake(4, 0.25);
      AV.audio.sfx('break_wall');
      return true;
    }

    // ---------------------------------------------------------------- collision
    rectHitsTiles(x0, y0, x1, y1) {
      const tx0 = Math.floor(x0 / T), ty0 = Math.floor(y0 / T);
      const tx1 = Math.floor((x1 - 0.001) / T), ty1 = Math.floor((y1 - 0.001) / T);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (this.solidTile(tx, ty)) return true;
      return false;
    }
    rectBlocked(x0, y0, x1, y1, self, opts) {
      if (this.rectHitsTiles(x0, y0, x1, y1)) return true;
      for (const e of this.entities) {
        if (e === self || !e.solid || e.dead || e.gone) continue;
        if (opts && opts.ignoreTeam && e.team === opts.ignoreTeam) continue;
        const r = e.solidRect();
        if (x0 < r.x + r.w && x1 > r.x && y0 < r.y + r.h && y1 > r.y) return true;
      }
      if (self && self.isPlayer && this.arena) {
        const a = this.arena;
        if (x0 < a.x || y0 < a.y || x1 > a.x + a.w || y1 > a.y + a.h) return true;
      }
      return false;
    }
    // Move an entity by dx,dy with axis separation, sliding and corner nudging
    move(e, dx, dy) {
      const hw = e.w / 2;
      const tryMove = (nx, ny) => !this.rectBlocked(nx - hw, ny - e.h, nx + hw, ny, e, e.moveOpts);
      let moved = false;
      if (dx) {
        if (tryMove(e.x + dx, e.y)) { e.x += dx; moved = true; }
        else if (!dy && e.isPlayer) {
          for (let n = 1; n <= 5; n++) {
            if (tryMove(e.x + dx, e.y - n) && tryMove(e.x, e.y - Math.min(n, 1))) { e.y -= Math.min(1, n); break; }
            if (tryMove(e.x + dx, e.y + n) && tryMove(e.x, e.y + Math.min(n, 1))) { e.y += Math.min(1, n); break; }
          }
          e.blockedX = true;
        } else e.blockedX = true;
      }
      if (dy) {
        if (tryMove(e.x, e.y + dy)) { e.y += dy; moved = true; }
        else if (!dx && e.isPlayer) {
          for (let n = 1; n <= 5; n++) {
            if (tryMove(e.x - n, e.y + dy) && tryMove(e.x - Math.min(n, 1), e.y)) { e.x -= Math.min(1, n); break; }
            if (tryMove(e.x + n, e.y + dy) && tryMove(e.x + Math.min(n, 1), e.y)) { e.x += Math.min(1, n); break; }
          }
          e.blockedY = true;
        } else e.blockedY = true;
      }
      return moved;
    }
    lineOfSight(x0, y0, x1, y1) {
      const d = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.ceil(d / 6);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const id = this.tileAtPx(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
        if (id && AV.tiles.isSolid(id) && id !== 'water' && id !== 'void' && id !== 'fence' && id !== 'railing' && id !== 'grave' && id !== 'marker' && id !== 'pew') return false;
      }
      return true;
    }

    // ---------------------------------------------------------------- entities & presence
    buildSlots() {
      (this.def.entities || []).forEach((d, i) => this.slots.push({ def: d, idx: i, ent: null }));
      this.refreshPresence(true);
    }
    slotKey(slot) { return slot.def.id || (this.id + '#' + slot.idx); }
    shouldExist(slot) {
      const d = slot.def;
      if (d.if && !S.test(d.if)) return false;
      if (d.type === 'npc' && S.get('gone_' + d.npc)) return false;
      if (d.type === 'item' && S.d.picked[d.id]) return false;
      if (d.type === 'enemy') {
        if (d.respawn === false && d.id && S.d.slain[d.id]) return false;
        if (this.killed.has(slot.idx)) return false;
        if (d.respawn === false && !d.id && S.d.slain[this.slotKey(slot)]) return false;
      }
      if (d.type === 'boss' && S.get(d.boss)) return false;
      return true;
    }
    refreshPresence(initial) {
      for (const slot of this.slots) {
        const should = this.shouldExist(slot);
        if (should && (!slot.ent || slot.ent.gone)) {
          const ent = AV.ents.create(slot.def, this, slot);
          if (ent) {
            slot.ent = ent;
            this.entities.push(ent);
            if (!initial && ent.fadeIn) ent.fadeIn();
          }
        } else if (!should && slot.ent && !slot.ent.gone && !slot.ent.dead) {
          if (slot.ent.fadeOut && !initial) slot.ent.fadeOut(); else slot.ent.gone = true;
          if (initial) slot.ent = null;
        }
      }
      S.dirty = false;
    }
    add(ent) { this.entities.push(ent); return ent; }
    findNpc(npcId) { return this.entities.find((e) => e.npcId === npcId && !e.gone && !e.dead); }
    respawnAll() { this.killed.clear(); }

    update(dt) {
      this.time += dt;
      // boss arena: a curtain of ash and embers hangs across any open edge of the arena
      if (this.arena) {
        const a = this.arena;
        for (let k = 0; k < 6; k++) {
          const side = Math.floor(Math.random() * 4);
          const x = side < 2 ? a.x + Math.random() * a.w : side === 2 ? a.x : a.x + a.w;
          const y = side >= 2 ? a.y + Math.random() * a.h : side === 0 ? a.y : a.y + a.h;
          const ox = side === 2 ? -9 : side === 3 ? 9 : 0, oy = side === 0 ? -9 : side === 1 ? 9 : 0;
          const inside = this.tileAtPx(x - ox * 0.5, y - oy * 0.5), outside = this.tileAtPx(x + ox, y + oy);
          if (!inside || !outside || AV.tiles.isSolid(inside) || AV.tiles.isSolid(outside)) continue;
          AV.fx.spawn({ x, y, vx: U.rand(-4, 4), vy: U.rand(-26, -12), life: U.rand(0.8, 1.4), size: 1,
            color: U.pick(['#f59a36', '#e2621f', '#857c86', '#a8a0a6']), glow: Math.random() < 0.4, alpha: 0.9 });
        }
      }
      for (let i = 0; i < this.entities.length; i++) {
        const e = this.entities[i];
        if (!e.gone && !e.dead) e.update(dt, this);
        else if (e.dead && e.updateDead) e.updateDead(dt, this);
      }
      for (let i = this.entities.length - 1; i >= 0; i--) {
        const e = this.entities[i];
        if (e.gone || (e.dead && e.removeWhenDead !== false && !e.updateDead)) {
          this.entities.splice(i, 1);
          const slot = this.slots.find((s) => s.ent === e);
          if (slot) slot.ent = null;
        }
      }
      if (S.dirty) this.refreshPresence(false);
    }

    // ---------------------------------------------------------------- drawing
    drawGround(ctx, cam) {
      const f = this.layers.length > 1 ? Math.floor(this.time * 4) % this.layers.length : 0;
      ctx.drawImage(this.layers[f], -Math.round(cam.x), -Math.round(cam.y));
    }
    drawSorted(ctx, cam) {
      const list = [];
      const x0 = cam.x - 64, x1 = cam.x + AV.W + 64, y0 = cam.y - 16, y1 = cam.y + AV.H + 96;
      for (const t of this.tall) {
        if (t.x > x1 || t.x + t.cv.width < x0 || t.base < y0 || t.y > y1) continue;
        list.push({ y: t.base, t });
      }
      for (const e of this.entities) {
        if (e.gone) continue;
        if (e.x < x0 - 64 || e.x > x1 + 64 || e.y < y0 - 32 || e.y > y1 + 64) continue;
        if (e.flat) continue;
        list.push({ y: e.sortY ? e.sortY() : e.y, e });
      }
      list.sort((a, b) => a.y - b.y);
      // shadows first
      for (const it of list) if (it.e && it.e.drawShadow) it.e.drawShadow(ctx, cam);
      for (const it of list) {
        if (it.t) ctx.drawImage(it.t.cv, Math.round(it.t.x - cam.x), Math.round(it.t.y - cam.y));
        else it.e.draw(ctx, cam);
      }
    }
    drawFlat(ctx, cam) {
      for (const e of this.entities) if (e.flat && !e.gone) e.draw(ctx, cam);
    }
    collectLights() {
      const out = this.staticLights.slice();
      for (const e of this.entities) if (!e.gone && e.light && e.lightOn !== false) {
        const L = e.light;
        out.push({ x: e.x + (L.ox || 0), y: e.y + (L.oy != null ? L.oy : -8), r: L.r || 48, color: L.color, intensity: (L.intensity != null ? L.intensity : 1) * (e.alpha != null ? e.alpha : 1), flicker: L.flicker || 0 });
      }
      return out;
    }
  }
  AV.World = World;
})(window.AV);
