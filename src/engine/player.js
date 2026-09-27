// ASHEN VOW — the player: Ser Emeric Brand. Movement, combo sword, roll, tallow, Kindle, damage, death.
(function (AV) {
  'use strict';
  const U = AV.util;
  const S = AV.state;
  const I = AV.input;

  const SPEED = 80, ACCEL = 1200, FRICTION = 1500;
  const SWINGS = [
    { wind: 0.07, active: 0.09, rec: 0.2, mult: 1.0, r: 25, spread: 1.0, lunge: 70, cost: 13 },
    { wind: 0.06, active: 0.09, rec: 0.2, mult: 1.0, r: 25, spread: 1.05, lunge: 70, cost: 13 },
    { wind: 0.13, active: 0.11, rec: 0.32, mult: 1.6, r: 29, spread: 1.15, lunge: 110, cost: 16 },
  ];
  const ROLL = { dur: 0.36, speed: 185, iStart: 0.02, iEnd: 0.3, cost: 20 };
  const HEAL = { dur: 0.85, at: 0.45, amount: 5 };
  const KINDLE_DUR = 8;

  const DIRS = ['side', 'down', 'side', 'up'];
  function dir4(angle) {
    const a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const i = Math.round(a / (Math.PI / 2)) % 4; // 0 right, 1 down, 2 left, 3 up
    return { name: DIRS[i], flip: i === 2 };
  }

  class Player extends AV.Entity {
    constructor(world) {
      super(null, world);
      this.isPlayer = true;
      this.team = 'player';
      this.hittable = true;
      this.sprite = 'player';
      this.w = 10; this.h = 6;
      this.aim = Math.PI / 2;           // facing angle
      this.face = { name: 'down', flip: false };
      this.state = 'idle';
      this.stateT = 0;
      this.sta = S.maxSta();
      this.staDelay = 0;
      this.iframes = 0;
      this.combo = 0; this.comboWindow = 0;
      this.buffer = null; this.bufferT = 0;
      this.stepAcc = 0;
      this.ashT = 0;
      this.kindleT = 0;
      this.hazardT = 0;
      this.lastHitT = 99;
      this.hidden = false;
      this.cutscene = false;
    }
    get hp() { return S.d.hp; }
    set hp(v) { S.d.hp = U.clamp(v, 0, S.maxHp()); }
    hurtBox() { return { x: this.x - 6, y: this.y - 22, w: 12, h: 20 }; }
    footRect() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    get rolling() { return this.state === 'roll' && this.stateT >= ROLL.iStart && this.stateT <= ROLL.iEnd; }
    get kindled() { return this.kindleT > 0; }
    setState(s) { this.state = s; this.stateT = 0; this.animT = 0; }
    frozen() { return this.cutscene || this.hidden || AV.game.isBusy(); }

    placeAt(x, y, dir) {
      this.x = x; this.y = y; this.vx = 0; this.vy = 0;
      if (dir) {
        const a = { down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 }[dir];
        if (a != null) { this.aim = a; this.face = dir4(a); }
      }
    }

    // ---------------------------------------------------------------- stamina
    spend(n) {
      if (this.kindled) return true;
      if (this.sta <= 0) return false;
      this.sta -= n;
      this.staDelay = 0.5;
      return true;
    }

    // ---------------------------------------------------------------- update
    update(dt, world) {
      this.stateT += dt;
      this.animT += dt;
      this.lastHitT += dt;
      if (this.flashT > 0) this.flashT -= dt;
      if (this.iframes > 0) this.iframes -= dt;
      if (this.comboWindow > 0) { this.comboWindow -= dt; if (this.comboWindow <= 0) this.combo = 0; }
      if (this.bufferT > 0) { this.bufferT -= dt; if (this.bufferT <= 0) this.buffer = null; }

      // stamina regen
      const maxSta = S.maxSta();
      if (this.staDelay > 0) this.staDelay -= dt;
      else if (this.state !== 'roll') this.sta = Math.min(maxSta, this.sta + 44 * (S.relicOn('posy_ribbon') ? 1.3 : 1) * dt);
      if (this.kindled) this.sta = maxSta;

      // kindle timer
      if (this.kindleT > 0) {
        this.kindleT -= dt;
        if (Math.random() < 0.7) AV.fx.embers(this.x + U.rand(-5, 5), this.y - U.rand(4, 22), 1, { speed: 20 });
        if (this.kindleT <= 0) { AV.audio.sfx('kindle_end'); AV.fx.ash(this.x, this.y - 12, 10); }
      }
      // passive regen (Hart's Tear) out of combat
      if (S.relicOn('hart_tear') && this.lastHitT > 6 && this.hp < S.maxHp() && this.state !== 'dead') {
        this.regenAcc = (this.regenAcc || 0) + dt;
        if (this.regenAcc > 3) { this.regenAcc = 0; this.hp += 1; AV.fx.ghostly(this.x, this.y - 14, 3); }
      }

      if (this.state === 'dead') { this.updateDead(dt); return; }
      if (this.hidden) return;

      const busy = this.frozen();
      const ax = busy ? { x: 0, y: 0 } : I.axis();
      if (!busy) this.readButtons();

      switch (this.state) {
        case 'idle': case 'move': this.updateMove(dt, world, ax); break;
        case 'attack': this.updateAttack(dt, world, ax); break;
        case 'roll': this.updateRoll(dt, world); break;
        case 'hurt': this.updateHurt(dt, world); break;
        case 'heal': this.updateHeal(dt, world, ax); break;
        case 'kneel': this.vx = this.vy = 0; if (this.stateT > (this.kneelFor || 1)) this.setState('idle'); break;
        default: this.setState('idle');
      }

      // hazards (burning ground)
      const tile = world.tileAtPx(this.x, this.y - 2);
      if (tile === 'embers' && this.state !== 'roll') {
        this.hazardT -= dt;
        if (this.hazardT <= 0) { this.hazardT = 0.8; this.takeHit({ dmg: 1, x: this.x, y: this.y + 1, knock: 0, team: 'enemy', hazard: true }); }
      } else this.hazardT = 0.2;

      // ash shedding — the curse, visible
      this.ashT -= dt;
      const stage = S.hollowStage();
      if (this.ashT <= 0) {
        this.ashT = [0.34, 0.2, 0.11][stage] * (Math.hypot(this.vx, this.vy) > 20 ? 0.6 : 1);
        AV.fx.spawn({ x: this.x + U.rand(-5, 5), y: this.y - U.rand(8, 24), vx: U.rand(-6, 6) - this.vx * 0.1, vy: U.rand(-4, 6), g: 10,
          life: U.rand(0.8, 1.6), color: U.pick(stage === 2 ? ['#cbc4c3', '#b9d6d3', '#a8a0a6'] : ['#a8a0a6', '#857c86', '#cbc4c3']), alpha: 0.8 });
      }
    }

    readButtons() {
      if (I.pressed('attack')) { this.buffer = 'attack'; this.bufferT = 0.22; }
      if (I.pressed('dodge')) { this.buffer = 'dodge'; this.bufferT = 0.18; }
      if (I.pressed('heal')) { this.buffer = 'heal'; this.bufferT = 0.15; }
      if (I.pressed('kindle')) this.tryKindle();
      if (I.pressed('interact') && (this.state === 'idle' || this.state === 'move')) {
        const t = AV.game.interactTarget;
        if (t) { I.consume('interact'); this.vx = this.vy = 0; this.faceToward(t.x, t.y); t.interact(this); }
      }
    }
    faceToward(x, y) { this.aim = Math.atan2(y - this.y, x - this.x); this.face = dir4(this.aim); }

    tryBuffered(canAttack = true) {
      if (!this.buffer) return false;
      const b = this.buffer;
      if (b === 'dodge') { if (this.startRoll()) { this.buffer = null; return true; } }
      if (b === 'attack' && canAttack) { if (this.startAttack()) { this.buffer = null; return true; } }
      if (b === 'heal') { if (this.startHeal()) { this.buffer = null; return true; } }
      return false;
    }

    updateMove(dt, world, ax) {
      if (this.tryBuffered()) return;
      const mag = Math.hypot(ax.x, ax.y);
      let speed = SPEED * (this.kindled ? 1.18 : 1);
      const tile = world.tileAtPx(this.x, this.y - 2);
      if (tile === 'shallow' || tile === 'mud') speed *= 0.72;
      const tx = ax.x * speed, ty = ax.y * speed;
      if (mag > 0.1) {
        this.vx = U.approach(this.vx, tx, ACCEL * dt);
        this.vy = U.approach(this.vy, ty, ACCEL * dt);
        this.aim = Math.atan2(ax.y, ax.x);
        this.face = dir4(this.aim);
        if (this.state !== 'move') { this.state = 'move'; }
      } else {
        this.vx = U.approach(this.vx, 0, FRICTION * dt);
        this.vy = U.approach(this.vy, 0, FRICTION * dt);
        if (this.state !== 'idle' && Math.hypot(this.vx, this.vy) < 5) this.state = 'idle';
      }
      this.moveBy(dt, world);
    }
    moveBy(dt, world) {
      const dx = this.vx * dt, dy = this.vy * dt;
      const ox = this.x, oy = this.y;
      this.blockedX = this.blockedY = false;
      world.move(this, dx, dy);
      const moved = Math.hypot(this.x - ox, this.y - oy);
      if (this.blockedX) this.vx *= 0.5;
      if (this.blockedY) this.vy *= 0.5;
      // footsteps
      this.stepAcc += moved;
      if (this.stepAcc > 15 && (this.state === 'move')) {
        this.stepAcc = 0;
        const tile = world.tileAtPx(this.x, this.y - 2);
        if (tile === 'shallow') { AV.audio.sfx('step_water', { vol: 0.5 }); AV.fx.splash(this.x, this.y); }
        else AV.audio.sfx(['grass', 'mud', 'ash', 'leaves', 'lilies', 'rug'].includes(tile) ? 'step_soft' : 'step', { vol: 0.45, pitch: U.rand(0.9, 1.1) });
        if (tile === 'ash' || tile === 'burnt') AV.fx.ash(this.x, this.y, 2, { speed: 10, up: 4 });
      }
    }

    // ---------------------------------------------------------------- attack
    startAttack() {
      if (this.sta <= 0 && !this.kindled) return false;
      const step = this.comboWindow > 0 ? (this.combo % 3) : 0;
      const sw = SWINGS[step];
      this.spend(sw.cost);
      this.combo = step + 1;
      this.swing = sw;
      this.swingStep = step;
      this.swingHit = null;
      this.swingWall = false;
      // aim: current stick direction if held, else facing; snapped to 8 directions
      const ax = I.axis();
      let a = Math.hypot(ax.x, ax.y) > 0.3 ? Math.atan2(ax.y, ax.x) : this.aim;
      a = Math.round(a / (Math.PI / 4)) * (Math.PI / 4);
      // soft auto-aim toward the nearest enemy in front
      const tgt = this.nearestEnemy(44, a, 0.9);
      if (tgt) a = Math.atan2(tgt.y - 8 - (this.y - 10), tgt.x - this.x);
      this.aim = a;
      this.face = dir4(a);
      this.setState('attack');
      this.vx = Math.cos(a) * 20; this.vy = Math.sin(a) * 20;
      return true;
    }
    nearestEnemy(range, angle, spread) {
      let best = null, bd = range;
      for (const e of this.world.entities) {
        if (e.team !== 'enemy' || e.dead || !e.hittable || e.passiveTarget) continue;
        const d = U.dist(this.x, this.y, e.x, e.y);
        if (d > bd) continue;
        if (Math.abs(U.angleDiff(angle, Math.atan2(e.y - this.y, e.x - this.x))) > spread) continue;
        best = e; bd = d;
      }
      return best;
    }
    updateAttack(dt, world, ax) {
      const sw = this.swing, t = this.stateT;
      const activeStart = sw.wind, activeEnd = sw.wind + sw.active;
      if (t < activeStart) {
        this.vx = U.approach(this.vx, 0, 600 * dt); this.vy = U.approach(this.vy, 0, 600 * dt);
      } else if (!this.swingHit) {
        // swing begins: lunge + hitbox
        this.vx = Math.cos(this.aim) * sw.lunge; this.vy = Math.sin(this.aim) * sw.lunge;
        AV.audio.sfx(this.swingStep === 2 ? 'swing2' : 'swing', { pitch: U.rand(0.92, 1.08) });
        const dmg = S.swordDmg() * sw.mult * (this.kindled ? 2 : 1);
        this.swingHit = AV.combat.add({
          shape: 'arc', x: this.x, y: this.y - 10, r: sw.r + (this.kindled ? 6 : 0), a: this.aim, spread: sw.spread,
          dmg, knock: this.swingStep === 2 ? 190 : 120, team: 'player', owner: this, life: sw.active, follow: this, fx: 0, fy: -10,
          heavy: this.swingStep === 2, kindled: this.kindled,
          onHit: (e) => this.onLandHit(e),
        });
        if (this.kindled) {
          // a wave of fire rolls off the blade
          AV.combat.shoot(world, { x: this.x + Math.cos(this.aim) * 12, y: this.y - 4 + Math.sin(this.aim) * 10, z: 6, angle: this.aim,
            speed: 170, dmg: S.swordDmg() * 0.8, r: 7, life: 0.32, team: 'player', color: '#f59a36', trail: 'ember', owner: this, pierceWalls: false });
        }
      }
      if (t >= activeStart && t < activeEnd) {
        this.vx = U.approach(this.vx, 0, 500 * dt); this.vy = U.approach(this.vy, 0, 500 * dt);
        this.checkWalls(world);
      } else if (t >= activeEnd) {
        this.vx = U.approach(this.vx, 0, 900 * dt); this.vy = U.approach(this.vy, 0, 900 * dt);
        // cancel windows
        if (t > activeEnd + 0.06 && this.buffer === 'dodge') { this.tryBuffered(false); return; }
        if (t > activeEnd + sw.rec * 0.45 && this.buffer === 'attack' && this.swingStep < 2) { this.comboWindow = 0.3; this.tryBuffered(); return; }
      }
      this.moveBy(dt, world);
      if (t >= activeEnd + sw.rec) {
        this.comboWindow = this.swingStep < 2 ? 0.28 : 0;
        if (this.swingStep >= 2) this.combo = 0;
        this.setState('idle');
        this.tryBuffered();
      }
    }
    checkWalls(world) {
      if (this.swingWall) return;
      for (let k = -1; k <= 1; k++) {
        const a = this.aim + k * this.swing.spread * 0.6;
        const px = this.x + Math.cos(a) * 16, py = this.y - 6 + Math.sin(a) * 14;
        const tx = Math.floor(px / 16), ty = Math.floor(py / 16);
        const id = world.tileId(tx, ty);
        if (id === 'wall_cracked') { world.breakWall(tx, ty); this.swingWall = true; return; }
        if (id && AV.tiles.isSolid(id) && k === 0 && !['water', 'void', 'grave', 'marker', 'pew', 'fence', 'railing'].includes(id)) {
          AV.fx.sparks(px, py, 5, a + Math.PI);
          AV.audio.sfx('block', { vol: 0.35, pitch: 1.3 });
          this.swingWall = true;
          return;
        }
      }
    }
    onLandHit(e) {
      AV.game.hitstop = Math.max(AV.game.hitstop, this.swingStep === 2 ? 0.075 : 0.05);
      AV.fx.shake(this.swingStep === 2 ? 3 : 2, 0.12);
      if (S.get('cinder_unlocked') && !this.kindled) this.addCinder(e.boss ? 3 : 5);
    }
    addCinder(n) {
      if (!S.get('cinder_unlocked')) return;
      const k = S.relicOn('hesk_flask') ? 1.35 : 1;
      const was = S.d.cinder;
      S.d.cinder = Math.min(100, S.d.cinder + n * k);
      if (was < 100 && S.d.cinder >= 100) { AV.audio.sfx('fire', { vol: 0.5 }); AV.game.toastOnce('kindle_ready', 'The Cinder burns full. [' + I.label('kindle') + '] to Kindle.'); }
    }

    // ---------------------------------------------------------------- roll
    startRoll() {
      if (this.sta <= 0 && !this.kindled) return false;
      this.spend(ROLL.cost * (S.relicOn('bell_shard') ? 0.7 : 1));
      const ax = I.axis();
      const a = Math.hypot(ax.x, ax.y) > 0.25 ? Math.atan2(ax.y, ax.x) : this.aim;
      this.rollAngle = a;
      this.aim = a; this.face = dir4(a);
      this.setState('roll');
      AV.audio.sfx('roll');
      AV.fx.ash(this.x, this.y, 5, { speed: 30, up: 5 });
      return true;
    }
    updateRoll(dt, world) {
      const k = this.stateT / ROLL.dur;
      const sp = ROLL.speed * (1 - U.easeIn(k) * 0.7);
      this.vx = Math.cos(this.rollAngle) * sp; this.vy = Math.sin(this.rollAngle) * sp;
      this.moveBy(dt, world);
      if (this.stateT >= ROLL.dur) {
        this.setState('idle');
        this.vx *= 0.3; this.vy *= 0.3;
        this.tryBuffered();
      }
    }

    // ---------------------------------------------------------------- heal (tallow)
    startHeal() {
      if (S.d.tallow <= 0) { AV.game.toastOnce('no_tallow', 'No tallow left. Rest at a shrine.'); return false; }
      if (this.hp >= S.maxHp()) return false;
      this.setState('heal');
      this.healed = false;
      return true;
    }
    updateHeal(dt, world, ax) {
      this.vx = U.approach(this.vx, ax.x * SPEED * 0.3, ACCEL * dt);
      this.vy = U.approach(this.vy, ax.y * SPEED * 0.3, ACCEL * dt);
      this.moveBy(dt, world);
      if (!this.healed && this.stateT >= HEAL.at) {
        this.healed = true;
        S.d.tallow--;
        const amt = HEAL.amount * (S.relicOn('maud_thimble') ? 1.4 : 1);
        this.hp = this.hp + Math.round(amt);
        AV.audio.sfx('heal');
        AV.fx.burst(this.x, this.y - 14, 14, { color: ['#fccf63', '#fff3c2', '#f59a36'], speed: 30, up: 30, g: -20, life: 0.9, glow: true });
        AV.fx.addLight(this.x, this.y - 12, 60, '#fccf63', 1);
      }
      if (this.stateT >= HEAL.dur) this.setState('idle');
    }

    // ---------------------------------------------------------------- kindle (the curse as power)
    tryKindle() {
      if (!S.get('cinder_unlocked')) return;
      if (S.d.cinder < 100 || this.kindled || this.state === 'dead') {
        if (S.d.cinder < 100 && !this.kindled) AV.audio.sfx('ui_back', { vol: 0.3 });
        return;
      }
      S.d.cinder = 0;
      this.kindleT = KINDLE_DUR * (S.relicOn('ashen_sigil') ? 1.5 : 1);
      S.d.kindles++;
      S.addHollow(1);
      AV.audio.sfx('kindle');
      AV.fx.flash('#e2621f', 0.2);
      AV.fx.shake(4, 0.3);
      AV.fx.embers(this.x, this.y - 12, 30, { speed: 90 });
      AV.combat.add({ shape: 'circle', x: this.x, y: this.y - 8, r: 30, dmg: S.swordDmg(), knock: 220, team: 'player', owner: this, life: 0.1 });
      // the dead inside whisper
      const lines = AV.data.strings.kindleWhispers || ['…'];
      const idx = Math.min(lines.length - 1, Math.floor((S.d.kindles - 1) * 0.7 + Math.random() * 3));
      AV.fx.text(this.x, this.y - 34, lines[Math.max(0, idx)], { color: '#b9d6d3', life: 3, rise: 14 });
      AV.audio.sfx('whisper', { vol: 0.5 });
    }

    // ---------------------------------------------------------------- damage & death
    takeHit(hit) {
      if (this.state === 'dead' || this.hidden) return false;
      if (AV.game.debugGod) return false;
      if (this.iframes > 0 || this.rolling) return false;
      if (AV.game.isBusy() && !hit.hazard) return false;
      let dmg = hit.dmg * (S.relicOn('odo_seal') ? 0.8 : 1);
      dmg = Math.max(1, Math.round(dmg * 2) / 2);
      this.hp = this.hp - dmg;
      this.lastHitT = 0;
      this.flashT = 0.12;
      this.iframes = hit.hazard ? 0.4 : 0.8;
      AV.fx.hurtVignette();
      AV.fx.shake(hit.hazard ? 1 : 4, 0.25);
      AV.game.hitstop = Math.max(AV.game.hitstop, hit.hazard ? 0 : 0.07);
      AV.audio.sfx('hurt');
      AV.fx.ash(this.x, this.y - 12, 12, { speed: 70 });
      if (S.get('cinder_unlocked') && !this.kindled) this.addCinder(7);
      if (this.hp <= 0) { this.die(); return true; }
      if (!hit.hazard) {
        const a = Math.atan2(this.y - (hit.y != null ? hit.y : this.y), this.x - (hit.x != null ? hit.x : this.x));
        const kb = (hit.knock != null ? hit.knock : 100) * 0.9;
        this.vx = Math.cos(a) * kb; this.vy = Math.sin(a) * kb;
        if (this.state !== 'heal' || true) { this.setState('hurt'); }
      }
      return true;
    }
    updateHurt(dt, world) {
      this.vx = U.approach(this.vx, 0, 700 * dt); this.vy = U.approach(this.vy, 0, 700 * dt);
      this.moveBy(dt, world);
      if (this.stateT > 0.26) { this.setState('idle'); this.tryBuffered(); }
    }
    die() {
      this.setState('dead');
      this.vx = this.vy = 0;
      this.kindleT = 0;
      AV.audio.sfx('death');
      AV.fx.shake(6, 0.5);
      AV.fx.flash('#a8a0a6', 0.25);
      AV.game.hitstop = 0.15;
      AV.game.onPlayerDying();
    }
    updateDead(dt) {
      if (this.stateT < 1.2 && Math.random() < 0.5) AV.fx.ash(this.x + U.rand(-6, 6), this.y - U.rand(0, 16), 2, { speed: 30, up: 20 });
      if (this.stateT > 1.9 && !this.deathReported) { this.deathReported = true; AV.game.onPlayerDeath(); }
    }
    kneel(t = 1.2) { this.setState('kneel'); this.kneelFor = t; }

    // ---------------------------------------------------------------- drawing
    animName() {
      const d = this.face.name;
      switch (this.state) {
        case 'move': return 'walk_' + d;
        case 'attack': return 'attack_' + d;
        case 'roll': return 'roll_' + d;
        case 'hurt': return 'hurt';
        case 'heal': return 'heal';
        case 'dead': return 'die';
        case 'kneel': return 'kneel';
        default: return 'idle_' + d;
      }
    }
    shadowSize() { return this.hidden ? 0 : 6; }
    draw(ctx, cam) {
      if (this.hidden) return;
      const x = this.x - cam.x, y = this.y - cam.y;
      const anim = this.animName();
      let t = this.animT;
      if (this.state === 'attack') {
        // map attack timing onto the 4 frames: wind-up, swing, impact, recover
        const sw = this.swing, st = this.stateT;
        const f = st < sw.wind ? 0 : st < sw.wind + sw.active * 0.5 ? 1 : st < sw.wind + sw.active + 0.05 ? 2 : 3;
        t = f / (AV.art.anim('player', anim) ? AV.art.anim('player', anim).fps : 10);
      }
      const blink = this.iframes > 0 && this.state !== 'roll' && this.state !== 'dead' && Math.floor(this.iframes * 20) % 2 === 0;
      const flip = this.face.flip;
      AV.art.draw(ctx, 'player', anim, t, x, y, { flip, alpha: blink ? 0.45 : 1, flash: this.flashT > 0 });
      if (this.kindled) {
        ctx.globalCompositeOperation = 'lighter';
        AV.art.draw(ctx, 'player', anim, t, x, y, { flip, flash: true, flashColor: '#e2621f', alpha: 0.28 + 0.14 * Math.sin(AV.game.time * 18) });
        ctx.globalCompositeOperation = 'source-over';
      }
      if (this.state === 'attack') this.drawSlash(ctx, cam);
    }
    drawSlash(ctx, cam) {
      const sw = this.swing, st = this.stateT;
      const t0 = sw.wind, t1 = sw.wind + sw.active + 0.06;
      if (st < t0 || st > t1) return;
      const k = (st - t0) / (t1 - t0);
      const cx = Math.round(this.x - cam.x), cy = Math.round(this.y - 10 - cam.y);
      const r1 = sw.r + (this.kindled ? 6 : 0), r0 = r1 - (this.swingStep === 2 ? 7 : 5);
      // the arc sweeps across the spread, trailing
      const dirSign = this.swingStep === 1 ? -1 : 1;
      const head = this.aim + dirSign * sw.spread * (U.easeOut(Math.min(1, k * 1.6)) * 2 - 1);
      const tail = head - dirSign * sw.spread * 1.3 * (1 - k * 0.6);
      const a0 = Math.min(head, tail), a1 = Math.max(head, tail);
      const col = this.kindled ? ['#fff3c2', '#fccf63', '#f59a36', '#e2621f'] : ['#ebe5dc', '#cbc4c3', '#a8a0a6', '#655c69'];
      const alpha = 1 - k * 0.8;
      for (let py = -r1 - 1; py <= r1 + 1; py++) for (let px = -r1 - 1; px <= r1 + 1; px++) {
        const d = Math.hypot(px, py / 0.8);
        if (d < r0 || d > r1) continue;
        const a = Math.atan2(py, px);
        let rel = U.angleDiff(a0, a);
        if (rel < 0 || rel > a1 - a0) continue;
        const along = rel / Math.max(0.001, a1 - a0);
        const band = (d - r0) / (r1 - r0);
        const ci = Math.min(3, Math.floor((1 - (dirSign > 0 ? along : 1 - along)) * 2 + (1 - band) * 2));
        ctx.globalAlpha = alpha * (0.35 + 0.65 * (dirSign > 0 ? along : 1 - along));
        ctx.fillStyle = col[ci];
        ctx.fillRect(cx + px, cy + py, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    lightInfo() {
      const stage = S.hollowStage();
      const base = 52 + (S.relicOn('moth_lantern') ? 18 : 0);
      if (this.kindled) return { r: base + 40, color: '#f59a36', intensity: 1.2, flicker: 0.25, glow: 0.22 };
      return { r: base, color: stage === 2 ? '#b9d6d3' : '#f59a36', intensity: 0.85, flicker: 0.08, glow: 0.08 };
    }
  }
  AV.Player = Player;
})(window.AV);
