// ASHEN VOW — boss framework: arena lock, intro card, health bar, phases, death sequence, aftermath hand-off
(function (AV) {
  'use strict';
  const U = AV.util;
  const S = AV.state;

  class Boss extends AV.Enemy {
    constructor(marker, bdef) {
      super({ type: 'enemy', kind: marker.bossId, x: (marker.x - 8) / 16, y: (marker.y - 14) / 16 }, marker.world, null, bdef);
      this.isBoss = true;
      this.bossId = marker.bossId;
      this.marker = marker;
      this.bdef = bdef;
      this.name = bdef.name || 'Boss';
      this.sprite = bdef.sprite || this.bossId;
      this.weight = bdef.weight || 10;
      this.aggro = true;
      this.flip = marker.flip;
      this.phase = 1;
      this.introT = bdef.introTime != null ? bdef.introTime : 1.4;
      this.displayHp = this.hp;
      this.arena = marker.arena;
      this.invuln = false;
      this.go('intro');
    }
    update(dt, world) {
      this.displayHp = U.approach(this.displayHp, this.hp, this.maxHp * 0.6 * dt);
      if (this.introT > 0) {
        this.introT -= dt;
        this.animT += dt; this.st += dt;
        if (this.flashT > 0) this.flashT -= dt;
        this.anim = (this.bdef.introAnim) || 'idle';
        if (this.bdef.introUpdate) this.bdef.introUpdate(this, dt);
        if (this.introT <= 0) this.go('start');
        return;
      }
      // phase tracking helper
      const pf = this.bdef.phases || [];
      for (let i = 0; i < pf.length; i++) {
        if (this.phase === i + 1 && this.hpFrac() <= pf[i]) {
          this.phase = i + 2;
          if (this.bdef.onPhase) this.bdef.onPhase(this, this.phase);
          AV.fx.shake(5, 0.4);
          AV.audio.sfx('roar', { vol: 0.8 });
        }
      }
      super.update(dt, world);
    }
    takeHit(hit) {
      if (this.introT > 0) return false;
      return super.takeHit(hit);
    }
    die(hit) {
      if (this.dead) return;
      this.dead = true;
      this.hittable = false;
      this.deathT = 0;
      this.removeWhenDead = false;
      AV.combat.clear();
      // clear leftover hazards & summons
      for (const e of this.world.entities) {
        if (e !== this && (e.summoned || e instanceof AV.combat.Projectile || e instanceof AV.combat.Telegraph || e instanceof AV.combat.Shockwave)) {
          if (e.team === 'enemy' && e.hittable && e.die) { e.hp = 0; e.die({}); } else e.gone = true;
        }
      }
      AV.audio.sfx('boss_die');
      AV.audio.music(null, { fade: 2.5 });
      AV.game.slowmo = { t: 1.6, scale: 0.35 };
      AV.fx.flash('#fff3c2', 0.35);
      AV.fx.shake(7, 1.2);
      if (this.bdef.onDeath) this.bdef.onDeath(this, hit);
    }
    updateDead(dt) {
      this.deathT += dt;
      this.animT += dt;
      const dur = this.bdef.deathTime || 3.2;
      if (this.bdef.deathUpdate) this.bdef.deathUpdate(this, dt);
      else {
        if (Math.random() < 0.6) AV.fx.ash(this.x + U.rand(-this.hurtW / 2, this.hurtW / 2), this.y - U.rand(0, this.hurtH), 3, { speed: 60, up: 30 });
        if (Math.random() < 0.3) AV.fx.embers(this.x + U.rand(-this.hurtW / 2, this.hurtW / 2), this.y - U.rand(0, this.hurtH), 2);
        this.flashT = Math.floor(this.deathT * 8) % 2 === 0 && this.deathT < dur * 0.6 ? 0.05 : 0;
        if (this.deathT > dur * 0.55) this.alpha = Math.max(0, 1 - (this.deathT - dur * 0.55) / (dur * 0.45));
      }
      if (this.deathT >= dur && !this.finished) this.finish();
    }
    finish() {
      this.finished = true;
      this.gone = true;
      AV.fx.ash(this.x, this.y - this.hurtH / 2, 40, { speed: 110, r: 10 });
      AV.bosses.end(this, true);
    }
    draw(ctx, cam) {
      if (this.bdef.draw && this.bdef.draw(this, ctx, cam) === true) return;
      const anim = this.dead ? (AV.art.sheets[this.sprite] && AV.art.sheets[this.sprite].anims.die ? 'die' : 'hurt') : this.anim;
      const ok = AV.art.draw(ctx, this.sprite, anim, this.dead ? this.deathT : this.animT, this.x - cam.x, this.y - cam.y - (this.z || 0),
        { flip: this.flip, alpha: this.alpha, flash: this.flashT > 0 });
      if (!ok) {
        const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
        ctx.fillStyle = this.flashT > 0 ? '#fff3c2' : '#141118';
        ctx.fillRect(x - this.hurtW / 2, y - this.hurtH, this.hurtW, this.hurtH);
      }
    }
  }
  AV.Boss = Boss;

  AV.bosses = {
    active: null,
    begin(marker) {
      const bdef = AV.data.bosses[marker.bossId];
      const world = marker.world;
      if (!bdef) {
        AV.warnOnce('Boss not defined: ' + marker.bossId);
        return;
      }
      const b = new Boss(marker, bdef);
      world.add(b);
      world.arena = marker.arena;
      AV.bosses.active = b;
      AV.audio.sfx('boss_intro');
      AV.audio.music(bdef.music || 'boss', { fade: 0.6 });
      AV.ui.bossCard(b.name, bdef.title || '');
      AV.fx.shake(3, 0.6);
      if (bdef.onStart) bdef.onStart(b);
    },
    // called on victory (from Boss.finish) or when the player dies mid-fight (victory=false)
    end(b, victory) {
      const world = b ? b.world : AV.game.world;
      if (world) world.arena = null;
      AV.bosses.active = null;
      if (!victory) return;
      S.set(b.bossId, 1);
      if (b.marker) b.marker.gone = true;
      AV.game.save();
      const after = [];
      if (b.marker && b.marker.def.onDefeat) after.push(...b.marker.def.onDefeat);
      AV.game.after(1.0, () => {
        const m = world.def.music;
        AV.audio.music(m || null, { fade: 3 });
        if (after.length) AV.script.run(after, { self: b.marker });
      });
    },
    startById(id) {
      const w = AV.game.world;
      const m = w && w.entities.find((e) => e instanceof AV.ents.BossMarker && e.bossId === id && !e.started);
      if (m) m.start();
      else AV.warnOnce('boss:' + id + ' — no marker on this map');
    },
  };
})(window.AV);
