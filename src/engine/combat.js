// ASHEN VOW — hitboxes, damage resolution, projectiles, telegraphs
(function (AV) {
  'use strict';
  const U = AV.util;

  let attackSeq = 1;
  const combat = AV.combat = {
    hits: [],          // active hitboxes (cleared as they expire)
    newAttackId: () => attackSeq++,
  };

  // A hitbox: { shape:'circle'|'arc'|'rect'|'ring', x,y, r, a (facing), spread (half-angle), w,h, r0 (ring inner),
  //   dmg, knock, team:'player'|'enemy', owner, id (attack id: each target is hit once per id), life, t, onHit(target) }
  combat.add = function (h) {
    const hit = Object.assign({ id: attackSeq++, life: 0.05, t: 0, knock: 90, team: 'enemy', dmg: 1, hitSet: new Set() }, h);
    combat.hits.push(hit);
    return hit;
  };

  function overlaps(h, e) {
    const b = e.hurtBox();
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    switch (h.shape) {
      case 'rect': return b.x < h.x + h.w && b.x + b.w > h.x && b.y < h.y + h.h && b.y + b.h > h.y;
      case 'circle': {
        const nx = U.clamp(h.x, b.x, b.x + b.w), ny = U.clamp(h.y, b.y, b.y + b.h);
        return (nx - h.x) ** 2 + (ny - h.y) ** 2 <= h.r * h.r;
      }
      case 'arc': {
        const nx = U.clamp(h.x, b.x, b.x + b.w), ny = U.clamp(h.y, b.y, b.y + b.h);
        const d = Math.hypot(nx - h.x, ny - h.y);
        if (d > h.r) return false;
        if (d < 6) return true;
        const ang = Math.atan2(cy - h.y, cx - h.x);
        return Math.abs(U.angleDiff(h.a, ang)) <= h.spread + Math.atan2(Math.max(b.w, b.h) / 2, Math.max(d, 1));
      }
      case 'ring': {
        // rings travel along the ground (drawn as ellipses): test the target's feet in ellipse space
        const d = Math.hypot(e.x - h.x, (e.y - h.y) / 0.62);
        const rad = Math.max(3, b.w / 2);
        return d + rad >= h.r0 && d - rad <= h.r;
      }
      default: return false;
    }
  }
  combat.overlaps = overlaps;

  combat.gen = 0;
  combat.update = function (dt, world) {
    const P = AV.game.player;
    const gen = combat.gen;
    for (let i = combat.hits.length - 1; i >= 0; i--) {
      if (combat.gen !== gen) break;        // cleared mid-loop (a boss died from this very blow)
      const h = combat.hits[i];
      if (!h) continue;
      h.t += dt;
      if (h.follow) { h.x = h.follow.x + (h.fx || 0); h.y = h.follow.y + (h.fy || 0); }
      if (h.grow) { h.r += h.grow * dt; if (h.r0 != null) h.r0 += h.grow * dt; }
      const targets = h.team === 'player' ? world.entities.filter((e) => e.hittable && e.team === 'enemy' && !e.dead && !e.gone)
        : (P && !P.dead ? [P] : []).concat(h.hitsAllies ? [] : []);
      if (h.team !== 'player' && h.hitsNeutral) targets.push(...world.entities.filter((e) => e.hittable && e.team === 'neutral' && !e.dead));
      for (const e of targets) {
        if (h.hitSet.has(e)) continue;
        if (!overlaps(h, e)) continue;
        h.hitSet.add(e);
        const landed = e.takeHit(h);
        if (combat.gen !== gen) break;
        if (landed && h.onHit) h.onHit(e);
        if (landed && h.once) { h.t = h.life; break; }
      }
      if (combat.gen !== gen) break;
      if (h.t >= h.life) { const k = combat.hits.indexOf(h); if (k >= 0) combat.hits.splice(k, 1); }
    }
  };
  combat.clear = () => { combat.hits.length = 0; combat.gen++; };

  // Debug draw of hitboxes (F1)
  combat.debugDraw = function (ctx, cam) {
    ctx.strokeStyle = '#ff3355';
    for (const h of combat.hits) {
      ctx.beginPath();
      if (h.shape === 'rect') ctx.rect(h.x - cam.x, h.y - cam.y, h.w, h.h);
      else if (h.shape === 'arc') { ctx.moveTo(h.x - cam.x, h.y - cam.y); ctx.arc(h.x - cam.x, h.y - cam.y, h.r, h.a - h.spread, h.a + h.spread); ctx.closePath(); }
      else { ctx.arc(h.x - cam.x, h.y - cam.y, h.r, 0, Math.PI * 2); if (h.r0) ctx.arc(h.x - cam.x, h.y - cam.y, h.r0, 0, Math.PI * 2); }
      ctx.stroke();
    }
  };

  // ---------------------------------------------------------------- projectile entity
  class Projectile extends AV.Entity {
    constructor(opts, world) {
      super(null, world);
      Object.assign(this, { x: opts.x, y: opts.y, z: opts.z != null ? opts.z : 10, team: opts.team || 'enemy', dmg: opts.dmg || 1,
        r: opts.r || 3, life: opts.life || 3, color: opts.color || '#f59a36', sprite: opts.sprite || null, anim: opts.anim || 'idle',
        glow: opts.glow !== false, knock: opts.knock != null ? opts.knock : 60, homing: opts.homing || 0, trail: opts.trail || 'ember',
        onExpire: opts.onExpire || null, pierceWalls: !!opts.pierceWalls, gravity: opts.gravity || 0, vz: opts.vz || 0, lands: !!opts.lands });
      const sp = opts.speed || 90;
      this.vx = Math.cos(opts.angle || 0) * sp; this.vy = Math.sin(opts.angle || 0) * sp;
      this.speed = sp;
      this.t = 0;
      this.hit = { id: AV.combat.newAttackId(), hitSet: new Set(), team: this.team, dmg: this.dmg, knock: this.knock, owner: opts.owner || null, projectile: true };
      if (this.glow) this.light = { r: opts.lightR || 28, color: this.color, intensity: 0.8, oy: 0 };
    }
    update(dt, world) {
      this.t += dt;
      this.animT += dt;
      if (this.homing && AV.game.player) {
        const P = AV.game.player;
        const want = Math.atan2(P.y - 8 - this.y, P.x - this.x);
        const cur = Math.atan2(this.vy, this.vx);
        const na = cur + U.clamp(U.angleDiff(cur, want), -this.homing * dt, this.homing * dt);
        this.vx = Math.cos(na) * this.speed; this.vy = Math.sin(na) * this.speed;
      }
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.gravity) {
        this.vz -= this.gravity * dt; this.z += this.vz * dt;
        if (this.z <= 0) { this.z = 0; return this.expire(world, true); }
      }
      if (this.trail === 'ember' && Math.random() < 0.5) AV.fx.spawn({ x: this.x, y: this.y - this.z, vx: U.rand(-8, 8), vy: U.rand(-8, 8), life: 0.35, color: U.pick(['#f59a36', '#e2621f', '#fccf63']), glow: true });
      if (this.trail === 'ghost' && Math.random() < 0.5) AV.fx.spawn({ x: this.x, y: this.y - this.z, vx: U.rand(-6, 6), vy: U.rand(-6, 6), life: 0.4, color: U.pick(['#b9d6d3', '#82a8ad']), glow: true });
      if (this.trail === 'wax' && Math.random() < 0.4) AV.fx.spawn({ x: this.x, y: this.y - this.z, vx: 0, vy: 10, life: 0.3, color: '#e6cc9c' });
      if (this.t > this.life) return this.expire(world, false);
      if (!this.pierceWalls && !this.lands) {
        const id = world.tileAtPx(this.x, this.y);
        if (id === null || (AV.tiles.isSolid(id) && id !== 'water' && id !== 'void' && id !== 'fence' && id !== 'railing' && id !== 'grave' && id !== 'pew' && id !== 'marker')) return this.expire(world, true);
      }
      // collision with targets
      if (!this.lands) {
        const targets = this.team === 'player' ? world.entities.filter((e) => e.hittable && e.team === 'enemy' && !e.dead) : [AV.game.player];
        for (const e of targets) {
          if (!e || e.dead) continue;
          const b = e.hurtBox();
          const nx = U.clamp(this.x, b.x, b.x + b.w), ny = U.clamp(this.y - this.z * 0.3, b.y, b.y + b.h);
          if ((nx - this.x) ** 2 + (ny - (this.y - this.z * 0.3)) ** 2 <= this.r * this.r) {
            this.hit.x = this.x - this.vx * 0.05; this.hit.y = this.y - this.vy * 0.05;
            if (e.takeHit(this.hit)) { return this.expire(world, true); }
            if (e.isPlayer && e.rolling) continue;
          }
        }
      }
    }
    expire(world, impact) {
      this.dead = true; this.gone = true;
      if (impact) AV.fx.burst(this.x, this.y - this.z, 6, { color: this.trail === 'ghost' ? ['#b9d6d3', '#e4f4ef'] : ['#f59a36', '#fccf63', '#e2621f'], speed: 40, life: 0.3, glow: true });
      if (this.onExpire) this.onExpire(this, world, impact);
    }
    draw(ctx, cam) {
      const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y - this.z);
      if (this.sprite) { AV.art.draw(ctx, this.sprite, this.anim, this.animT, x, y + 4, { flip: this.vx < 0 }); return; }
      ctx.fillStyle = this.color;
      ctx.fillRect(x - 2, y - 2, 4, 4);
      ctx.fillStyle = '#fff3c2';
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
    drawShadow(ctx, cam) {
      if (this.z < 2) return;
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#07060a';
      ctx.fillRect(Math.round(this.x - cam.x) - 2, Math.round(this.y - cam.y), 4, 2);
      ctx.globalAlpha = 1;
    }
    sortY() { return this.y + 2; }
  }
  combat.Projectile = Projectile;
  combat.shoot = function (world, opts) { return world.add(new Projectile(opts, world)); };

  // ---------------------------------------------------------------- telegraph decals (warning markers on the ground)
  class Telegraph extends AV.Entity {
    constructor(opts, world) {
      super(null, world);
      Object.assign(this, { x: opts.x, y: opts.y, shape: opts.shape || 'circle', r: opts.r || 16, w: opts.w || 0, h: opts.h || 0,
        a: opts.a || 0, len: opts.len || 0, width: opts.width || 10, life: opts.life || 0.6, t: 0, color: opts.color || '#e2621f' });
      this.flat = true;
    }
    update(dt) { this.t += dt; if (this.t >= this.life) this.gone = true; }
    draw(ctx, cam) {
      const k = this.t / this.life;
      const blink = 0.35 + 0.35 * Math.abs(Math.sin(this.t * 18));
      ctx.globalAlpha = blink * (0.5 + k * 0.5);
      ctx.strokeStyle = this.color;
      ctx.fillStyle = U.rgba(this.color, 0.18 + 0.2 * k);
      const x = this.x - cam.x, y = this.y - cam.y;
      ctx.beginPath();
      if (this.shape === 'circle') { ctx.ellipse(x, y, this.r, this.r * 0.6, 0, 0, Math.PI * 2); }
      else if (this.shape === 'line') {
        const c = Math.cos(this.a), s = Math.sin(this.a), px = -s * this.width / 2, py = c * this.width / 2;
        ctx.moveTo(x + px, y + py); ctx.lineTo(x + c * this.len + px, y + s * this.len + py);
        ctx.lineTo(x + c * this.len - px, y + s * this.len - py); ctx.lineTo(x - px, y - py); ctx.closePath();
      } else if (this.shape === 'rect') { ctx.rect(x, y, this.w, this.h); }
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  combat.Telegraph = Telegraph;
  combat.telegraph = function (world, opts) { return world.add(new Telegraph(opts, world)); };

  // Expanding shockwave ring (visual + hitbox)
  class Shockwave extends AV.Entity {
    constructor(opts, world) {
      super(null, world);
      Object.assign(this, { x: opts.x, y: opts.y, r: opts.r0 || 4, speed: opts.speed || 120, max: opts.max || 90, thick: opts.thick || 8,
        color: opts.color || '#cbc4c3', t: 0 });
      this.flat = true;
      this.hit = AV.combat.add({ shape: 'ring', x: this.x, y: this.y, r: this.r, r0: Math.max(0, this.r - this.thick), dmg: opts.dmg || 2,
        knock: opts.knock || 140, team: opts.team || 'enemy', life: this.max / this.speed, owner: opts.owner || null });
    }
    update(dt) {
      this.t += dt;
      this.r += this.speed * dt;
      this.hit.r = this.r; this.hit.r0 = Math.max(0, this.r - this.thick);
      if (this.r >= this.max) this.gone = true;
    }
    draw(ctx, cam) {
      const k = this.r / this.max;
      ctx.globalAlpha = 0.8 * (1 - k);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(Math.round(this.x - cam.x), Math.round(this.y - cam.y), this.r, this.r * 0.62, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
    }
  }
  combat.Shockwave = Shockwave;
  combat.shockwave = function (world, opts) { return world.add(new Shockwave(opts, world)); };
})(window.AV);
