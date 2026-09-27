// ASHEN VOW — enemy base class, helper API for creature brains, default brains, death & drops
(function (AV) {
  'use strict';
  const U = AV.util;
  const S = AV.state;

  // Fallback definition used if a creature file has not defined a kind
  const FALLBACK = { name: 'Ashen Thing', hp: 6, dmg: 2, speed: 30, aggro: 90, pennies: [2, 4] };

  class Enemy extends AV.Entity {
    constructor(def, world, slot, kindDef) {
      super(def, world);
      this.kind = def ? def.kind : 'unknown';
      this.slot = slot;
      this.edef = kindDef || AV.data.enemies[this.kind] || FALLBACK;
      const d = this.edef;
      this.team = 'enemy';
      this.hittable = true;
      this.sprite = d.sprite || ('enemy_' + this.kind);
      this.maxHp = this.hpMax = d.hp || 6;
      this.hp = this.maxHp;
      this.dmg = d.dmg || 1;
      this.speed = d.speed || 30;
      this.w = d.w || 10; this.h = d.h || 6;
      this.hurtW = (d.hurt && d.hurt.w) || 14; this.hurtH = (d.hurt && d.hurt.h) || 20;
      this.weight = d.weight || 1;
      this.solid = false;
      this.home = { x: this.x, y: this.y };
      this.state = 'idle'; this.st = U.rand(0, 0.5);
      this.stunT = 0;
      this.aggro = false;
      this.passive = !!d.passive;
      this.flying = !!d.flying;
      this.cool = U.rand(0.3, 1.2);
      this.data = {};
      this.poiseHits = 0;
      if (d.light) this.light = Object.assign({}, d.light);
      this.anim = 'idle';
      if (d.init) d.init(this);
    }
    get P() { return AV.game.player; }
    hurtBox() { return { x: this.x - this.hurtW / 2, y: this.y - this.hurtH - (this.z || 0) * 0.5, w: this.hurtW, h: this.hurtH }; }
    hpFrac() { return this.hp / this.maxHp; }
    dist() { const P = this.P; return P ? U.dist(this.x, this.y, P.x, P.y) : 9999; }
    angleTo() { const P = this.P; return P ? Math.atan2(P.y - this.y, P.x - this.x) : 0; }
    go(state) { this.state = state; this.st = 0; this.animT = 0; }
    faceTarget() { const P = this.P; if (P) this.flip = P.x < this.x; }
    canSee() { const P = this.P; return P && this.world.lineOfSight(this.x, this.y - 8, P.x, P.y - 8); }
    move(angle, speed, dt) {
      const dx = Math.cos(angle) * speed * dt, dy = Math.sin(angle) * speed * dt;
      if (Math.abs(dx) > 0.01) this.flip = dx < 0;
      this.blockedX = this.blockedY = false;
      if (this.flying) {
        const nx = this.x + dx, ny = this.y + dy;
        if (!this.world.rectHitsTiles(nx - this.w / 2, ny - this.h, nx + this.w / 2, ny) || this.ghostly) { this.x = nx; this.y = ny; return true; }
        return false;
      }
      return this.world.move(this, dx, dy);
    }
    moveToward(x, y, speed, dt) {
      const d = U.dist(this.x, this.y, x, y);
      if (d < 1) return true;
      this.move(Math.atan2(y - this.y, x - this.x), Math.min(speed, d / dt), dt);
      return d < 3;
    }
    chase(speed, dt) {
      const P = this.P;
      if (!P) return;
      let a = this.angleTo();
      // steer around blockage
      if (this.blockedX || this.blockedY) a += (this.data.steer || (this.data.steer = U.pick([-1, 1]))) * 0.9;
      this.move(a, speed, dt);
    }
    hitbox(opts) { return AV.combat.add(Object.assign({ team: 'enemy', owner: this, dmg: this.dmg, knock: 110 }, opts)); }
    shoot(opts) { return AV.combat.shoot(this.world, Object.assign({ team: 'enemy', owner: this, dmg: this.dmg }, opts)); }
    telegraph(opts) { return AV.combat.telegraph(this.world, opts); }
    shockwave(opts) { return AV.combat.shockwave(this.world, Object.assign({ team: 'enemy', owner: this, dmg: this.dmg }, opts)); }
    sfx(id, opts) { AV.audio.sfx(id, opts); }
    spawn(kind, x, y, extra) {
      const e = AV.createEnemy(Object.assign({ type: 'enemy', kind, x: (x - 8) / 16, y: (y - 14) / 16, respawn: false, summoned: true }, extra || {}), this.world, null);
      if (e) { e.aggro = true; e.summoned = true; this.world.add(e); e.fadeIn(0.4); }
      return e;
    }
    stun(t) { this.stunT = Math.max(this.stunT, t); }
    knock(angle, force) { this.vx = Math.cos(angle) * force; this.vy = Math.sin(angle) * force; }

    update(dt, world) {
      super.update(dt);
      this.st += dt;
      if (this.cool > 0) this.cool -= dt;
      const P = this.P;
      if (!P) return;
      // knockback slide
      if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
        const px = this.x, py = this.y;
        if (this.flying) { this.x += this.vx * dt; this.y += this.vy * dt; if (world.rectHitsTiles(this.x - this.w / 2, this.y - this.h, this.x + this.w / 2, this.y) && !this.ghostly) { this.x = px; this.y = py; } }
        else world.move(this, this.vx * dt, this.vy * dt);
        const k = Math.max(0, 1 - 9 * dt);
        this.vx *= k; this.vy *= k;
      }
      if (this.stunT > 0) { this.stunT -= dt; this.anim = AV.art.anim(this.sprite, 'hurt') ? 'hurt' : 'idle'; return; }
      if (P.dead || P.hidden) { this.anim = 'idle'; return; }
      // wake up
      if (!this.aggro && !this.passive) {
        const d = this.dist();
        if (d < (this.edef.aggro || 90) && (d < 40 || this.canSee())) { this.aggro = true; this.onAggro(); }
      }
      if (this.edef.brain) this.edef.brain(this, dt);
      else AV.ai.melee(this, dt);
      // separation from other enemies
      if (!this.flying && !this.isBoss) {
        for (const o of world.entities) {
          if (o === this || o.team !== 'enemy' || o.dead || o.isBoss || o.flying) continue;
          const dx = this.x - o.x, dy = this.y - o.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > 0 && d2 < 100) { const d = Math.sqrt(d2); world.move(this, dx / d * 20 * dt, dy / d * 20 * dt); }
        }
      }
      // leash
      if (!this.isBoss && this.aggro && U.dist(this.x, this.y, this.home.x, this.home.y) > (this.edef.leash || 260) && this.dist() > 140) {
        this.aggro = false; this.returning = true;
      }
      if (this.returning && !this.aggro) {
        if (this.moveToward(this.home.x, this.home.y, this.speed, dt)) this.returning = false;
        this.anim = 'walk';
      }
    }
    onAggro() { if (this.edef.onAggro) this.edef.onAggro(this); }

    takeHit(hit) {
      if (this.dead || this.invuln) return false;
      if (this.edef.onHit && this.edef.onHit(this, hit) === false) {
        // blocked
        AV.fx.sparks((this.x + (hit.x || this.x)) / 2, this.y - 12, 8);
        AV.audio.sfx('block');
        if (hit.owner && hit.owner.isPlayer && !hit.projectile) {
          const a = Math.atan2(hit.owner.y - this.y, hit.owner.x - this.x);
          hit.owner.vx = Math.cos(a) * 110; hit.owner.vy = Math.sin(a) * 110;
        }
        return false;
      }
      this.hp -= hit.dmg;
      this.flashT = 0.1;
      this.aggro = true;
      const a = hit.owner ? Math.atan2(this.y - hit.owner.y, this.x - hit.owner.x) : Math.atan2(this.y - (hit.y || this.y), this.x - (hit.x || this.x));
      const force = (hit.knock || 100) / this.weight;
      if (!this.isBoss) this.knock(a, force);
      const poise = this.edef.poise || 0;
      this.poiseHits++;
      if (!this.isBoss && this.poiseHits > poise) { this.stun(hit.heavy ? 0.35 : 0.18); this.poiseHits = 0; this.go(this.state === 'attack' || this.state === 'windup' ? 'recover' : this.state); }
      AV.audio.sfx(hit.heavy ? 'hit_heavy' : 'hit', { pitch: U.rand(0.9, 1.1) });
      const hx = this.x, hy = this.y - this.hurtH / 2;
      AV.fx.ash(hx, hy, 8, { speed: 70, angle: a, spread: 0.9 });
      if (hit.kindled) AV.fx.embers(hx, hy, 8, { speed: 60 });
      AV.fx.sparks(hx - Math.cos(a) * 4, hy, 4, a);
      if (this.hp <= 0) this.die(hit);
      return true;
    }

    die(hit) {
      this.dead = true;
      this.deathT = 0;
      this.hittable = false;
      this.removeWhenDead = false;
      AV.audio.sfx('enemy_die');
      AV.fx.ash(this.x, this.y - this.hurtH / 2, 22, { speed: 80, r: 6 });
      AV.fx.embers(this.x, this.y - this.hurtH / 2, 6);
      const d = this.edef;
      // pennies & cinder
      if (!this.summoned || d.dropsWhenSummoned) {
        const pr = d.pennies || [1, 3];
        const n = U.randi(pr[0], pr[1]);
        if (n > 0) {
          S.addPennies(n);
          AV.fx.text(this.x, this.y - this.hurtH - 4, '+' + n, { color: '#d4b96a', life: 1.2, rise: 10 });
          AV.audio.sfx('penny', { vol: 0.5 });
        }
      }
      if (this.P && S.get('cinder_unlocked')) {
        this.P.addCinder(d.cinder != null ? d.cinder : 8);
        // the ash of the slain streams into the armor
        for (let i = 0; i < 10; i++) {
          AV.fx.spawn({ x: this.x + U.rand(-6, 6), y: this.y - U.rand(4, 18), vx: U.rand(-30, 30), vy: U.rand(-40, -10), life: 0.9,
            color: U.pick(['#a8a0a6', '#cbc4c3', '#f59a36']), seek: this.P, glow: Math.random() < 0.3 });
        }
      }
      // persistence
      if (this.slot && this.def) {
        if (this.def.respawn === false) S.d.slain[this.def.id || this.world.slotKey(this.slot)] = 1;
        else this.world.killed.add(this.slot.idx);
      }
      if (d.onDeath) d.onDeath(this, hit);
      if (this.def && this.def.onDeath) AV.script.run(this.def.onDeath, { self: this });
    }
    updateDead(dt) {
      this.deathT += dt;
      this.animT += dt;
      const has = AV.art.anim(this.sprite, 'die') && AV.art.sheets[this.sprite] && AV.art.sheets[this.sprite].anims.die;
      const dur = has ? Math.max(0.5, has.frames.length / has.fps + 0.25) : 0.55;
      if (!has) this.alpha = Math.max(0, 1 - this.deathT / dur);
      else if (this.deathT > dur - 0.3) this.alpha = Math.max(0, (dur - this.deathT) / 0.3);
      if (this.deathT < 0.4 && Math.random() < 0.5) AV.fx.ash(this.x, this.y - U.rand(2, this.hurtH), 2, { speed: 25, up: 15 });
      if (this.deathT >= dur) this.gone = true;
    }
    shadowSize() { return this.edef.shadow != null ? this.edef.shadow : Math.max(4, this.w * 0.5); }
    draw(ctx, cam) {
      if (this.edef.draw && this.edef.draw(this, ctx, cam) === true) return;
      const anim = this.dead ? (AV.art.sheets[this.sprite] && AV.art.sheets[this.sprite].anims.die ? 'die' : 'hurt') : this.anim;
      const t = this.dead ? this.deathT : this.animT;
      const ok = AV.art.draw(ctx, this.sprite, anim, t, this.x - cam.x, this.y - cam.y - (this.z || 0), { flip: this.flip, alpha: this.alpha, flash: this.flashT > 0 || (this.dead && this.deathT < 0.08) });
      if (!ok) {
        // fallback silhouette so a missing sheet never leaves an empty square
        const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.flashT > 0 ? '#fff3c2' : '#221d27';
        ctx.fillRect(x - 5, y - 18, 10, 18);
        ctx.fillStyle = '#e2621f';
        ctx.fillRect(x - 3, y - 15, 2, 1); ctx.fillRect(x + 1, y - 15, 2, 1);
        ctx.globalAlpha = 1;
      }
    }
  }
  AV.Enemy = Enemy;

  AV.createEnemy = function (def, world, slot) {
    const kd = AV.data.enemies[def.kind];
    if (!kd) AV.warnOnce('Enemy kind not defined: ' + def.kind);
    const Cls = (kd && kd.cls) || Enemy;
    return new Cls(def, world, slot, kd);
  };

  // Particles with `seek` fly into their target (used for ash streaming into Brand)
  const baseUpdate = AV.fx.update;
  AV.fx.update = function (dt, cam) {
    for (const p of AV.fx.parts) {
      if (!p.seek) continue;
      const tx = p.seek.x, ty = p.seek.y - 12;
      const a = Math.atan2(ty - p.y, tx - p.x);
      const pull = 420 * Math.min(1, p.t * 2);
      p.vx += Math.cos(a) * pull * dt; p.vy += Math.sin(a) * pull * dt;
      p.vx *= 0.92; p.vy *= 0.92;
      if (Math.hypot(tx - p.x, ty - p.y) < 5) p.t = p.life;
    }
    baseUpdate(dt, cam);
  };

  // ---------------------------------------------------------------- default brains
  AV.ai = {
    // Generic melee: approach, telegraph, strike, recover
    melee(e, dt, o = {}) {
      const range = o.range || e.edef.range || 20;
      const wind = o.wind || e.edef.wind || 0.45;
      const rec = o.rec || e.edef.rec || 0.6;
      switch (e.state) {
        case 'idle':
          e.anim = 'idle';
          if (e.aggro) e.go('chase');
          break;
        case 'chase':
          e.anim = 'walk';
          if (e.dist() < range + 4 && e.cool <= 0) { e.faceTarget(); e.go('windup'); e.aimA = e.angleTo(); break; }
          if (e.dist() > range) e.chase(e.speed, dt);
          if (!e.aggro) e.go('idle');
          break;
        case 'windup':
          e.anim = AV.art.anim(e.sprite, 'windup') ? 'windup' : 'idle';
          if (e.st === 0 || e.st < dt) { /* first frame */ }
          if (e.st >= wind) {
            e.go('attack');
            e.hitbox({ shape: 'arc', x: e.x, y: e.y - 8, r: range + 8, a: e.aimA, spread: 0.9, life: 0.12, knock: 120 });
            e.sfx('swing', { pitch: 0.7, vol: 0.6 });
          }
          break;
        case 'attack':
          e.anim = AV.art.anim(e.sprite, 'attack') ? 'attack' : 'idle';
          if (e.st >= 0.2) e.go('recover');
          break;
        case 'recover':
          e.anim = 'idle';
          if (e.st >= rec) { e.cool = U.rand(0.2, 0.8); e.go('chase'); }
          break;
        default: e.go('idle');
      }
    },
  };
})(window.AV);
