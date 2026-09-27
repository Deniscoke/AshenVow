// ASHEN VOW — world entities: props, NPCs, signs, pickups, corpses, shrines, exits, doors, barriers, triggers, lights
(function (AV) {
  'use strict';
  const U = AV.util;
  const T = AV.TILE;
  const S = AV.state;

  const anchor = (d) => ({ x: d.x * T + 8, y: d.y * T + 14 });

  // ---------------------------------------------------------------- base
  class Entity {
    constructor(def, world) {
      this.def = def || {};
      this.world = world;
      const a = def && def.x != null ? anchor(def) : { x: 0, y: 0 };
      this.x = a.x; this.y = a.y;
      this.vx = 0; this.vy = 0;
      this.w = 10; this.h = 6;
      this.solid = false;
      this.team = 'neutral';
      this.sprite = null; this.anim = 'idle'; this.animT = U.rand(0, 3); this.flip = false;
      this.alpha = 1; this.fadeDir = 0;
      this.light = null;
      this.gone = false; this.dead = false;
      this.flashT = 0;
      this.z = 0;
    }
    solidRect() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    footRect() { return this.solidRect(); }
    fadeIn(t = 0.6) { this.alpha = 0; this.fadeDir = 1 / t; }
    fadeOut(t = 0.8) { this.fadeDir = -1 / t; this.solid = false; this.fading = true; }
    update(dt) {
      this.animT += dt;
      if (this.flashT > 0) this.flashT -= dt;
      if (this.fadeDir) {
        this.alpha = U.clamp(this.alpha + this.fadeDir * dt, 0, 1);
        if (this.alpha >= 1 && this.fadeDir > 0) this.fadeDir = 0;
        if (this.alpha <= 0 && this.fadeDir < 0) { this.gone = true; this.fadeDir = 0; }
      }
    }
    drawSprite(ctx, cam, anim, opts = {}) {
      if (!this.sprite) return;
      AV.art.draw(ctx, this.sprite, anim || this.anim, this.animT, this.x - cam.x, this.y - cam.y - (this.z || 0),
        Object.assign({ flip: this.flip, alpha: this.alpha, flash: this.flashT > 0 }, opts));
    }
    draw(ctx, cam) { this.drawSprite(ctx, cam); }
    shadowSize() { return 0; }
    drawShadow(ctx, cam) {
      const s = this.shadowSize();
      if (!s || this.alpha < 0.3) return;
      ctx.globalAlpha = 0.35 * this.alpha;
      ctx.fillStyle = '#07060a';
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
      ctx.beginPath();
      ctx.ellipse(x, y, s, Math.max(1.5, s * 0.4), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    interactable() { return false; }
    interactPoint() { return { x: this.x, y: this.y - 4 }; }
    promptY() { const s = AV.art.sheets[this.sprite]; return this.y - (s ? s.oy : 20) - 4; }
  }
  AV.Entity = Entity;

  function spriteSize(id) {
    const s = AV.art.sheets[id];
    return s ? { w: s.w, h: s.h, ox: s.ox, oy: s.oy } : { w: 16, h: 16, ox: 8, oy: 15 };
  }
  function resolveAnim(anim) {
    if (Array.isArray(anim)) {
      for (const a of anim) if (!a.if || S.test(a.if)) return a.anim;
      return 'idle';
    }
    return anim || 'idle';
  }

  // ---------------------------------------------------------------- prop / decal / light / emitter
  class Prop extends Entity {
    constructor(def, world) {
      super(def, world);
      this.sprite = def.sprite;
      this.animSpec = def.anim;
      this.anim = resolveAnim(def.anim);
      this.flip = !!def.flip;
      const sz = spriteSize(def.sprite);
      this.solid = !!def.solid;
      this.w = def.fw || Math.max(8, Math.round(sz.w * 0.8));
      this.h = def.fh || Math.min(10, Math.max(4, Math.round(sz.h * 0.3)));
      if (def.light) this.light = Object.assign({ oy: -Math.round(sz.oy * 0.6) }, def.light);
      this.flat = def.type === 'decal';
    }
    update(dt) {
      super.update(dt);
      if (Array.isArray(this.animSpec)) {
        this.animCheck = (this.animCheck || 0) - dt;
        if (this.animCheck <= 0) { this.animCheck = 0.15; this.anim = resolveAnim(this.animSpec); }
      }
    }
    shadowSize() { return this.flat || !this.solid ? 0 : 0; }
  }
  class LightEnt extends Entity {
    constructor(def, world) {
      super(def, world);
      this.light = { r: def.r || 60, color: def.color || '#f59a36', intensity: def.intensity != null ? def.intensity : 1, flicker: def.flicker || 0, oy: -6 };
    }
    draw() {}
  }
  class Emitter extends Entity {
    constructor(def, world) { super(def, world); this.kind = def.kind || 'smoke'; this.acc = 0; }
    update(dt) {
      this.acc += dt;
      const cam = AV.game.cam;
      if (Math.abs(this.x - (cam.x + AV.W / 2)) > AV.W || Math.abs(this.y - (cam.y + AV.H / 2)) > AV.H) return;
      const rate = { smoke: 0.18, embers: 0.12, drips: 0.7, motes: 0.5, moths: 0.8, ash: 0.15, steam: 0.2 }[this.kind] || 0.3;
      while (this.acc > rate) {
        this.acc -= rate;
        const x = this.x + U.rand(-6, 6), y = this.y - 6;
        switch (this.kind) {
          case 'smoke': AV.fx.spawn({ x, y, vx: U.rand(-3, 3), vy: U.rand(-14, -8), life: 2.4, size: 2, color: U.pick(['#332c38', '#4a4250']), alpha: 0.5, sway: 4 }); break;
          case 'steam': AV.fx.spawn({ x, y, vx: U.rand(-3, 3), vy: U.rand(-16, -10), life: 1.8, size: 2, color: '#cbc4c3', alpha: 0.3, sway: 3 }); break;
          case 'embers': AV.fx.spawn({ x, y, vx: U.rand(-6, 6), vy: U.rand(-30, -15), life: 1.5, size: 1, color: U.pick(['#f59a36', '#fccf63', '#e2621f']), glow: true, sway: 5 }); break;
          case 'drips': AV.fx.spawn({ x, y: this.y - 40, vx: 0, vy: 20, g: 260, life: 0.5, size: 1, color: '#82a8ad', alpha: 0.8 }); break;
          case 'motes': AV.fx.spawn({ x: this.x + U.rand(-24, 24), y: this.y - U.rand(0, 24), vx: U.rand(-3, 3), vy: U.rand(-4, 1), life: 4, size: 1, color: U.pick(['#b9d6d3', '#e4f4ef', '#fccf63']), glow: true, pulse: true, sway: 6 }); break;
          case 'moths': AV.fx.spawn({ x: this.x + U.rand(-10, 10), y: this.y - U.rand(4, 20), vx: U.rand(-20, 20), vy: U.rand(-20, 10), drag: 0.5, life: 2.5, size: 1, color: U.pick(['#cbc4c3', '#ebe5dc']), sway: 14 }); break;
          case 'ash': AV.fx.spawn({ x: this.x + U.rand(-20, 20), y: this.y - 50, vx: U.rand(-4, 4), vy: U.rand(8, 14), life: 5, size: 1, color: '#a8a0a6', alpha: 0.7, sway: 4 }); break;
          default: break;
        }
      }
    }
    draw() {}
  }

  // ---------------------------------------------------------------- NPC
  class Npc extends Entity {
    constructor(def, world) {
      super(def, world);
      const nd = AV.data.npcs[def.npc] || {};
      this.npcId = def.npc;
      this.nd = nd;
      this.sprite = nd.sprite || 'npc_ghost_man';
      this.anim = def.anim || nd.anim || 'idle';
      this.baseAnim = this.anim;
      this.solid = nd.solid !== false && def.solid !== false;
      const sz = spriteSize(this.sprite);
      this.w = Math.min(20, Math.max(10, Math.round(sz.w * 0.5)));
      this.h = 6;
      this.flip = def.dir === 'left';
      this.homeX = this.x; this.homeY = this.y;
      this.wander = def.wander || nd.wander || 0;
      this.wanderT = U.rand(1, 3);
      this.barkT = 0;
      this.ghost = /ghost|posy|anselm|maud|queen|agna/.test(this.sprite);
      if (nd.light) this.light = nd.light;
      else if (this.ghost) this.light = { r: 30, color: '#82a8ad', intensity: 0.6, oy: -12 };
    }
    shadowSize() { return this.ghost ? 0 : Math.max(4, this.w * 0.45); }
    interactable() { return this.alpha > 0.6 && !this.fading && !!(this.nd.talk && this.nd.talk.length); }
    interactLabel() { return 'Talk'; }
    interact() { AV.dlg.startNpc(this); }
    update(dt, world) {
      super.update(dt);
      const P = AV.game.player;
      if (this.ghost) this.z = Math.sin(this.animT * 2) * 1.5 + 1;
      if (this.wander && !AV.dlg.active) {
        this.wanderT -= dt;
        if (this.wanderT <= 0) {
          this.wanderT = U.rand(2, 5);
          const a = U.rand(Math.PI * 2);
          this.tx = U.clamp(this.homeX + Math.cos(a) * this.wander * T, 8, world.pw - 8);
          this.ty = U.clamp(this.homeY + Math.sin(a) * this.wander * T, 8, world.ph - 8);
        }
        if (this.tx != null) {
          const d = U.dist(this.x, this.y, this.tx, this.ty);
          if (d > 2) {
            const sp = 14 * dt;
            const moved = world.move(this, (this.tx - this.x) / d * sp, (this.ty - this.y) / d * sp);
            this.flip = this.tx < this.x;
            if (!moved) this.tx = null;
          } else this.tx = null;
        }
      }
      // barks
      if (P && this.nd.barks && this.barkT <= 0 && !AV.dlg.active) {
        const d = U.dist(P.x, P.y, this.x, this.y);
        if (d < 60) {
          const opts = this.nd.barks.filter((b) => !b.if || S.test(b.if));
          if (opts.length) {
            const b = U.pick(opts);
            const s = spriteSize(this.sprite);
            AV.fx.text(this.x, this.y - s.oy - 6, AV.subst(b.text), { color: this.ghost ? '#b9d6d3' : '#cbc4c3', life: 3.2, rise: 6 });
            this.barkT = U.rand(9, 16);
          }
        }
      }
      if (this.barkT > 0) this.barkT -= dt;
    }
    faceToward(x) { this.flip = x < this.x - 2; }
  }

  // ---------------------------------------------------------------- readable sign
  class Sign extends Entity {
    constructor(def, world) {
      super(def, world);
      this.sprite = def.sprite || null;
      this.solid = !!(def.sprite && def.solid !== false);
      if (this.sprite) { const sz = spriteSize(this.sprite); this.w = Math.round(sz.w * 0.6); this.h = 5; }
    }
    interactable() { return true; }
    interactLabel() { return 'Read'; }
    interact() {
      if (this.def.dialogue) AV.dlg.start(this.def.dialogue, { self: this });
      else AV.dlg.startPages(this.def.title || '', [].concat(this.def.text || []), { actions: this.def.do });
    }
    draw(ctx, cam) { if (this.sprite) this.drawSprite(ctx, cam); }
    promptY() { return this.sprite ? super.promptY() : this.y - 14; }
  }

  // ---------------------------------------------------------------- pickups
  class ItemPickup extends Entity {
    constructor(def, world) {
      super(def, world);
      this.sprite = def.sprite || null;
      this.item = def.item;
      this.bob = U.rand(0, 6);
      this.light = { r: 22, color: '#fccf63', intensity: 0.5, oy: -6, flicker: 0.2 };
    }
    interactable() { return !this.taken; }
    interactLabel() { return 'Take'; }
    interact() {
      if (this.taken) return;
      this.taken = true;
      S.d.picked[this.def.id] = 1;
      const n = this.def.count || 1;
      AV.game.receiveItem(this.item, n, this.def.text);
      if (this.def.do) AV.script.run(this.def.do, { self: this });
      AV.fx.sparks(this.x, this.y - 6, 10);
      this.gone = true;
    }
    draw(ctx, cam) {
      const x = this.x - cam.x, y = this.y - cam.y;
      if (this.sprite) this.drawSprite(ctx, cam);
      else {
        const it = AV.data.items[this.item];
        const bob = Math.round(Math.sin(this.animT * 2.4 + this.bob) * 1.5);
        if (it && AV.art.icons[it.icon]) {
          ctx.globalAlpha = 0.9;
          AV.art.drawIcon(ctx, it.icon, x - 8, y - 18 + bob);
          ctx.globalAlpha = 1;
        }
      }
      AV.art.draw(ctx, 'prop_glint', 'idle', this.animT, x, y - 4, {});
    }
    promptY() { return this.y - 22; }
  }
  class Corpse extends Entity {
    constructor(def, world) {
      super(def, world);
      this.sprite = def.sprite || 'prop_corpse_pilgrim';
      const sz = spriteSize(this.sprite);
      this.w = Math.round(sz.w * 0.7); this.h = 6;
      this.solid = false;
    }
    looted() { return !!S.d.picked[this.def.id]; }
    interactable() { return true; }
    interactLabel() { return this.def.item && !this.looted() ? 'Search' : 'Look'; }
    interact() {
      const first = !this.looted();
      const pages = [].concat(this.def.text || []);
      AV.dlg.startPages(this.def.title || '', pages, {
        onEnd: () => {
          if (first) {
            S.d.picked[this.def.id] = 1;
            if (this.def.item) AV.game.receiveItem(this.def.item, this.def.count || 1);
            if (this.def.do) AV.script.run(this.def.do, { self: this });
          }
        },
      });
    }
    draw(ctx, cam) {
      this.drawSprite(ctx, cam);
      if (this.def.item && !this.looted()) AV.art.draw(ctx, 'prop_glint', 'idle', this.animT, this.x - cam.x, this.y - cam.y - 6, {});
    }
  }

  // ---------------------------------------------------------------- shrine
  class Shrine extends Entity {
    constructor(def, world) {
      super(def, world);
      this.sprite = 'prop_shrine';
      this.shrineId = def.id;
      this.name = def.name || 'Candle Shrine';
      this.solid = true; this.w = 12; this.h = 6;
      this.updateLit();
    }
    updateLit() {
      this.lit = S.isLit(this.shrineId);
      this.anim = this.lit ? 'lit' : 'unlit';
      this.light = this.lit ? { r: 70, color: '#f59a36', intensity: 1, flicker: 0.12, oy: -18 } : { r: 26, color: '#857c86', intensity: 0.5, oy: -12 };
    }
    interactable() { return true; }
    interactLabel() { return this.lit ? 'Rest' : 'Light'; }
    interact() { AV.game.useShrine(this); }
    shadowSize() { return 5; }
  }

  // ---------------------------------------------------------------- exits / doors / barriers / triggers
  function rectOf(def, whole) {
    return { x: def.x * T, y: def.y * T, w: (def.w || 1) * T, h: (def.h || 1) * T };
  }
  class Exit extends Entity {
    constructor(def, world) {
      super(def, world);
      this.rect = rectOf(def);
      this.x = this.rect.x + this.rect.w / 2; this.y = this.rect.y + this.rect.h;
      this.sprite = def.sprite || null;
      this.isDoor = def.type === 'door';
      this.msgT = 0;
      if (this.isDoor && this.sprite) this.x = def.x * T + 8, this.y = def.y * T + 16;
    }
    locked() {
      if (this.def.lock && !S.has(this.def.lock)) return true;
      if (this.def.lockIf && S.test(this.def.lockIf)) return true;
      return false;
    }
    get solid() { return this.locked(); }
    set solid(v) { /* derived */ }
    solidRect() { return this.rect; }
    update(dt) {
      super.update(dt);
      if (this.msgT > 0) this.msgT -= dt;
      const P = AV.game.player;
      if (!P || P.dead || AV.game.transitioning) return;
      const f = P.footRect();
      const r = this.rect;
      const pad = this.locked() ? 2 : 0;
      const touching = f.x < r.x + r.w + pad && f.x + f.w > r.x - pad && f.y < r.y + r.h + pad && f.y + f.h > r.y - pad;
      // an exit the player is standing in when the map loads stays disarmed until they step off it (no ping-pong)
      if (this.armed === undefined) this.armed = !touching;
      if (!touching) { this.wasTouching = false; this.armed = true; return; }
      if (!this.armed) return;
      if (this.locked()) {
        if (!this.wasTouching && this.msgT <= 0) {
          AV.game.toast(this.def.lockedText || 'It will not open.');
          AV.audio.sfx('locked');
          this.msgT = 2.5;
        }
        this.wasTouching = true;
        return;
      }
      if (!AV.game.canTransition()) return;
      AV.game.transition(this.def.to, this.def.spawn, { door: this.isDoor });
    }
    draw(ctx, cam) {
      if (this.sprite) AV.art.draw(ctx, this.sprite, this.locked() ? 'idle' : (AV.art.anim(this.sprite, 'open') && !this.isDoor ? 'open' : 'idle'), this.animT, this.x - cam.x, this.y - cam.y - 2, {});
    }
    sortY() { return this.y - 1; }
  }

  class Barrier extends Entity {
    constructor(def, world) {
      super(def, world);
      this.rect = rectOf(def);
      this.x = this.rect.x + this.rect.w / 2; this.y = this.rect.y + this.rect.h - 2;
      this.sprite = def.sprite || null;
      this.flagName = 'open_' + def.id;
      this.opening = 0;
      this.isOpen = !!S.get(this.flagName);
      this.anim = this.isOpen ? 'open' : 'idle';
    }
    get solid() { return !this.isOpen; }
    set solid(v) { /* derived */ }
    solidRect() { return this.rect; }
    canOpen() {
      if (this.def.lock && !S.has(this.def.lock)) return false;
      if (this.def.lockIf && S.test(this.def.lockIf)) return false;
      return true;
    }
    interactable() { return !this.isOpen; }
    interactLabel() { return this.canOpen() ? 'Open' : 'Examine'; }
    interactPoint() { return { x: this.x, y: this.rect.y + this.rect.h / 2 }; }
    promptY() { return this.rect.y - 4; }
    interact() {
      if (this.isOpen) return;
      if (!this.canOpen()) {
        AV.dlg.startPages('', [this.def.lockedText || 'It will not move.'], {});
        AV.audio.sfx('locked');
        return;
      }
      this.open(true);
    }
    open(withText) {
      this.isOpen = true;
      S.set(this.flagName, 1);
      AV.audio.sfx('door');
      AV.fx.shake(2, 0.2);
      AV.fx.ash(this.x, this.y - 8, 14, { r: this.rect.w / 2 });
      if (AV.art.anim(this.sprite, 'open') && this.sprite && AV.art.sheets[this.sprite] && AV.art.sheets[this.sprite].anims.open) this.anim = 'open';
      else this.fadeOut(0.6), this.keepSlot = true;
      if (withText && this.def.openText) AV.dlg.startPages('', [this.def.openText], {});
      if (this.def.do) AV.script.run(this.def.do, { self: this });
    }
    update(dt) {
      super.update(dt);
      if (this.gone) this.gone = false, this.hidden = true;
      // opened elsewhere (a script's set:/unlock: while this map was loaded)
      if (!this.isOpen && S.get(this.flagName)) {
        this.isOpen = true;
        const s = this.sprite && AV.art.sheets[this.sprite];
        if (s && s.anims.open) this.anim = 'open'; else this.fadeOut(0.5);
      }
    }
    draw(ctx, cam) {
      if (!this.sprite || this.hidden) return;
      if (this.def.vertical) {
        // a gate across a north–south gap: the same art, turned on its side about the rect's centre
        const s = AV.art.sheets[this.sprite];
        if (!s) return;
        const cx = Math.round(this.rect.x + this.rect.w / 2 - cam.x), cy = Math.round(this.rect.y + this.rect.h / 2 - cam.y);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 2);
        AV.art.draw(ctx, this.sprite, this.anim, this.animT, -s.w / 2 + s.ox, -s.h / 2 + s.oy, { alpha: this.alpha });
        ctx.restore();
        return;
      }
      AV.art.draw(ctx, this.sprite, this.anim, this.animT, this.x - cam.x, this.y - cam.y, { alpha: this.alpha });
    }
    sortY() { return this.def.vertical ? this.rect.y + this.rect.h : this.y; }
  }

  class Trigger extends Entity {
    constructor(def, world) {
      super(def, world);
      this.rect = rectOf(def);
      this.x = this.rect.x + this.rect.w / 2; this.y = this.rect.y + this.rect.h / 2;
      this.key = 'trig:' + (def.id || world.id + '#' + (def.x + ',' + def.y));
      this.fired = def.once !== false && !!S.d.picked[this.key];
      this.inside = false;
    }
    update(dt) {
      if (this.fired) return;
      const P = AV.game.player;
      if (!P || P.dead || AV.dlg.active || AV.script.blocking || AV.game.transitioning) return;
      const f = P.footRect(), r = this.rect;
      const inside = f.x < r.x + r.w && f.x + f.w > r.x && f.y < r.y + r.h && f.y + f.h > r.y;
      if (inside && !this.inside) {
        if (!this.def.if || S.test(this.def.if)) {
          if (this.def.once !== false) { this.fired = true; S.d.picked[this.key] = 1; }
          const acts = [];
          if (this.def.do) acts.push(...this.def.do);
          if (this.def.dialogue) acts.unshift('dialogue:' + this.def.dialogue);
          AV.script.run(acts, { self: this });
        }
      }
      this.inside = inside;
    }
    draw() {}
  }

  // Boss marker: waits for the player to enter the arena (or a boss:<id> action)
  class BossMarker extends Entity {
    constructor(def, world) {
      super(def, world);
      this.bossId = def.boss;
      this.arena = def.arena ? rectOf(def.arena) : null;
      const bd = AV.data.bosses[this.bossId];
      this.sprite = bd && bd.idleSprite !== undefined ? bd.idleSprite : (bd && bd.sprite) || null;
      this.idleAnim = (bd && bd.idleAnim) || 'idle';
      this.flip = !!def.flip;
      this.started = false;
    }
    update(dt) {
      super.update(dt);
      if (this.started) return;
      if ((this.def.startOn || 'arena') !== 'arena') return;
      const P = AV.game.player;
      if (!P || !this.arena || AV.dlg.active || AV.game.transitioning) return;
      const f = P.footRect(), r = this.arena;
      if (f.x > r.x + 8 && f.x + f.w < r.x + r.w - 8 && f.y > r.y + 8 && f.y + f.h < r.y + r.h - 8) this.start();
    }
    start() {
      if (this.started) return;
      this.started = true;
      AV.bosses.begin(this);
    }
    draw(ctx, cam) {
      if (this.started || !this.sprite || this.def.hidden) return;
      AV.art.draw(ctx, this.sprite, this.idleAnim, this.animT, this.x - cam.x, this.y - cam.y, { flip: this.flip });
    }
  }

  // ---------------------------------------------------------------- factory
  AV.ents = {
    Entity, Prop, Npc, Sign, ItemPickup, Corpse, Shrine, Exit, Barrier, Trigger, BossMarker,
    create(def, world, slot) {
      switch (def.type) {
        case 'prop': case 'decal': return new Prop(def, world);
        case 'light': return new LightEnt(def, world);
        case 'emitter': return new Emitter(def, world);
        case 'npc': return new Npc(def, world);
        case 'sign': return new Sign(def, world);
        case 'item': return new ItemPickup(def, world);
        case 'corpse': return new Corpse(def, world);
        case 'shrine': return new Shrine(def, world);
        case 'exit': case 'door': return new Exit(def, world);
        case 'barrier': return new Barrier(def, world);
        case 'trigger': return new Trigger(def, world);
        case 'enemy': return AV.createEnemy ? AV.createEnemy(def, world, slot) : null;
        case 'boss': return new BossMarker(def, world);
        default: AV.warnOnce('Unknown entity type ' + def.type); return null;
      }
    },
    // Rites performed by dialogue actions ------------------------------------------------
    snuff(ent, done) {
      if (!ent) { done && done(); return; }
      const x = ent.x, y = ent.y - 14;
      AV.audio.sfx('snuff');
      let t = 0;
      const flame = { x, y, r: 40, color: '#fccf63', intensity: 1.2 };
      const tick = (dt) => {
        t += dt;
        ent.flashT = 0.05;
        ent.alpha = Math.max(0, 1 - t / 1.2);
        flame.y -= dt * 18;
        flame.intensity = Math.max(0, 1.2 - t * 0.7);
        AV.fx.addLight(flame.x, flame.y, flame.r, flame.color, flame.intensity);
        if (Math.random() < 0.6) AV.fx.spawn({ x: flame.x + U.rand(-2, 2), y: flame.y, vx: U.rand(-4, 4), vy: -20, life: 0.8, color: U.pick(['#fccf63', '#fff3c2', '#b9d6d3']), glow: true });
        if (t > 1.6) {
          ent.gone = true;
          if (ent.npcId) S.set('gone_' + ent.npcId, 1);
          AV.fx.ghostly(x, flame.y, 12);
          return true;
        }
        return false;
      };
      AV.game.addTask(tick, done);
    },
    kill(ent, done) {
      if (!ent) { done && done(); return; }
      AV.audio.sfx('hit_heavy');
      AV.fx.shake(5, 0.3);
      AV.fx.flash('#fff3c2', 0.12);
      AV.game.hitstop = 0.12;
      let t = 0;
      const tick = (dt) => {
        t += dt;
        ent.flashT = t < 0.3 ? 0.05 : 0;
        if (t > 0.25) ent.alpha = Math.max(0, 1 - (t - 0.25) / 0.6);
        if (t > 0.25 && t < 0.5) AV.fx.ash(ent.x, ent.y - 10, 4, { speed: 60 });
        if (t > 0.9) {
          ent.gone = true;
          if (ent.npcId) S.set('gone_' + ent.npcId, 1);
          AV.fx.ash(ent.x, ent.y - 8, 24, { speed: 70 });
          return true;
        }
        return false;
      };
      AV.game.addTask(tick, done);
    },
  };
})(window.AV);
