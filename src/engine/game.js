// ASHEN VOW — main loop, scenes (title / play / ending / credits), transitions, death & rest, companion, boot
(function (AV) {
  'use strict';
  const U = AV.util;
  const S = AV.state;
  const I = AV.input;
  const W = AV.W, H = AV.H, T = AV.TILE;

  const REGION_TITLES = {
    village: "Saint Wendel's Rest", hushwood: 'The Hushwood', abbey: 'Lenten Mere', greyharrow: 'Greyharrow', city: 'Hallowhearth',
  };

  const G = AV.game = {
    scene: 'boot',
    time: 0,
    world: null,
    player: null,
    companion: null,
    cam: { x: 0, y: 0 },
    hitstop: 0,
    slowmo: null,
    fade: { v: 1, target: 0, speed: 1.5 },
    transitioning: false,
    interactTarget: null,
    killed: {},
    tasks: [],
    timers: [],
    deathScreen: null,
    ending: null,
    credits: null,
    title: null,
    debug: false,
    debugGod: false,
    toastKeys: new Set(),
  };

  // ================================================================ helpers used across the engine
  G.isBusy = () => !!(AV.dlg.active || AV.script.blocking || AV.ui.menu || G.transitioning || G.deathScreen);
  G.canTransition = () => !G.transitioning && !AV.dlg.active && !AV.bosses.active && G.player && !G.player.dead;
  G.toast = (text, kind) => AV.ui.toast(text, kind);
  G.toastOnce = (key, text) => { if (G.toastKeys.has(key)) return; G.toastKeys.add(key); AV.ui.toast(text); };
  G.addTask = (tick, done) => { G.tasks.push({ tick, done }); };
  G.after = (t, fn) => { G.timers.push({ t, fn }); };
  G.fadeTo = (v, time = 0.5) => { G.fade.target = v; G.fade.speed = 1 / Math.max(0.05, time); };

  G.receiveItem = function (id, n = 1, text) {
    const it = AV.data.items[id];
    S.give(id, n);
    if (!it) return;
    const kind = it.kind;
    if (kind === 'tag') {
      AV.audio.sfx('whisper', { vol: 0.6 });
      AV.ui.toast('{i}A name:{/} ' + it.name.replace(/^Tin Tag:\s*/i, ''), 'item');
    } else if (kind === 'upgrade') {
      AV.audio.sfx('key_item');
      const eff = { oath_ribbon: 'Your oath holds more. (Max health up)', pilgrim_breath: 'Your breath comes deeper. (Stamina up)',
        tallow_stub: 'More tallow to burn. (Tallow up)', grave_iron: 'Vigil bites deeper. (Blade up)', stolen_ember: 'Something new burns in the blade. (Blade up)' }[id];
      AV.ui.toast(it.name + (eff ? ' — ' + eff : ''), 'item');
    } else {
      AV.audio.sfx(kind === 'key' || kind === 'relic' ? 'key_item' : 'pickup');
      AV.ui.toast('Received: ' + it.name + (n > 1 ? ' x' + n : ''), 'item');
    }
    if (text) AV.dlg.startPages('', [text], {});
  };

  // ================================================================ canvas & loop
  let view, vctx, buf, bctx;
  function resize() {
    const s = Math.max(1, Math.min(window.innerWidth / W, window.innerHeight / H));
    // touch screens: fill the display; desktops: crisp integer scaling when there is room
    const scale = (AV.touch && AV.touch.enabled) || s < 2 ? s : Math.floor(s);
    view.style.width = Math.round(W * scale) + 'px';
    view.style.height = Math.round(H * scale) + 'px';
  }
  G.toggleFullscreen = function () {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } catch (e) { /* ignore */ }
  };

  let last = 0, acc = 0, lastRaf = 0;
  const STEP = 1 / 60;
  // requestAnimationFrame drives the game; a slow timer keeps it alive where rAF is throttled (hidden embeds)
  function rafLoop(now) {
    lastRaf = performance.now();
    frame(now);
    requestAnimationFrame(rafLoop);
  }
  function startLoop() {
    requestAnimationFrame(rafLoop);
    setInterval(() => { if (performance.now() - lastRaf > 250) frame(performance.now()); }, 33);
  }
  function frame(now) {
    const t0 = performance.now();
    if (!last) last = now;
    let dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 4) {
      try { update(STEP); } catch (e) { reportError(e); }
      acc -= STEP; steps++;
    }
    if (steps >= 4) acc = 0;
    try { render(dt); } catch (e) { reportError(e); }
    // frame cost (update + render) in ms, smoothed — readable as AV.game.perf
    const cost = performance.now() - t0;
    G.perf = G.perf ? G.perf * 0.95 + cost * 0.05 : cost;
  }
  let errShown = 0;
  function reportError(e) {
    console.error(e);
    if (errShown++ < 3 && G.debug) AV.ui.toast('Error: ' + e.message);
  }

  // ================================================================ update
  function update(dt) {
    I.update();
    if (AV.touch) AV.touch.update(dt);
    G.time += dt;
    AV.fx.lights.length = 0;
    AV.audio.update && AV.audio.update(dt);
    // fade
    const f = G.fade;
    if (f.v !== f.target) f.v = U.approach(f.v, f.target, f.speed * dt);
    for (let i = G.timers.length - 1; i >= 0; i--) { const t = G.timers[i]; t.t -= dt; if (t.t <= 0) { G.timers.splice(i, 1); t.fn(); } }
    for (let i = G.tasks.length - 1; i >= 0; i--) { const t = G.tasks[i]; if (t.tick(dt)) { G.tasks.splice(i, 1); t.done && t.done(); } }

    if (AV.touch && AV.touch.portrait) return;   // waiting for the phone to be turned sideways
    switch (G.scene) {
      case 'title': updateTitle(dt); break;
      case 'play': updatePlay(dt); break;
      case 'ending': updateEnding(dt); break;
      case 'credits': updateCredits(dt); break;
      default: break;
    }
  }

  function updatePlay(dt) {
    const P = G.player;
    const world = G.world;
    S.d.playTime += dt;
    // dynamic lights are rebuilt every step (cleared in update()); the knight's own ember glow first
    if (P && !P.hidden) { const L = P.lightInfo(); AV.fx.addLight(P.x, P.y - 12, L.r, L.color, L.intensity, L.flicker, L.glow); }
    if (AV.ui.menu) { AV.ui.update(dt); return; }
    if (G.slowmo) { G.slowmo.t -= dt; dt *= G.slowmo.scale; if (G.slowmo.t <= 0) G.slowmo = null; }
    AV.script.update(dt);
    if (AV.dlg.active) {
      AV.dlg.update(dt);
      // gentle world life continues behind dialogue (no enemies, no player control)
      for (const e of world.entities) if (e.team !== 'enemy' && !(e instanceof AV.combat.Projectile) && !e.gone) { if (e === P) P.update(dt, world); else if (!e.dead) e.update(dt, world); }
      AV.fx.update(dt, G.cam);
      updateCamera(dt);
      return;
    }
    if (G.deathScreen) {
      G.deathScreen.t += dt;
      const ds = G.deathScreen;
      if (!ds.leaving && ((ds.t > 1.6 && I.pressed('confirm')) || ds.t > 4.2)) { ds.leaving = true; respawn(); }
      world.update(dt);
      AV.fx.update(dt, G.cam);
      return;
    }
    if (!G.isBusy()) {
      if (I.pressed('pause')) { AV.ui.openPause(); return; }
      if (I.pressed('inventory')) { AV.ui.openInventory(0); return; }
    }
    // intro: the knight lies on the bier until the Chandler has had her say
    if (P.hidden && S.get('intro_done')) revealPlayer();

    if (G.hitstop > 0) { G.hitstop -= dt; AV.fx.update(dt * 0.25, G.cam); updateCamera(dt); return; }
    world.update(dt);
    AV.combat.update(dt, world);
    AV.fx.update(dt, G.cam);
    updateCamera(dt);
    G.interactTarget = G.isBusy() || P.state === 'dead' || P.hidden ? null : findInteract(P, world);
  }

  function findInteract(P, world) {
    const fx = P.x + Math.cos(P.aim) * 8, fy = P.y - 4 + Math.sin(P.aim) * 6;
    let best = null, bd = 22;
    for (const e of world.entities) {
      if (e === P || e.gone || !e.interactable || !e.interactable()) continue;
      const ip = e.interactPoint ? e.interactPoint() : { x: e.x, y: e.y };
      let d = Math.min(U.dist(fx, fy, ip.x, ip.y), U.dist(P.x, P.y - 4, ip.x, ip.y) + 4);
      if (e.rect) {
        const r = e.rect;
        const nx = U.clamp(P.x, r.x, r.x + r.w), ny = U.clamp(P.y - 3, r.y, r.y + r.h);
        d = Math.min(d, U.dist(P.x, P.y - 3, nx, ny) + 2);
      }
      if (e.isCompanion) {
        // the companion walks at your heel: only offer to talk when you turn and face him
        const facing = Math.abs(U.angleDiff(P.aim, Math.atan2(e.y - P.y, e.x - P.x))) < 0.9;
        if (!facing || P.state === 'move') continue;
        d += 6;
      }
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  function updateCamera(dt) {
    const P = G.player, w = G.world;
    if (!P || !w) return;
    const look = P.state === 'move' ? 14 : 6;
    let tx = P.x + Math.cos(P.aim) * look - W / 2;
    let ty = P.y - 12 + Math.sin(P.aim) * look * 0.7 - H / 2;
    const b = AV.bosses.active;
    if (b && (!b.dead || b.deathT < 2.5)) {
      // frame both fighters: the bigger the boss and the farther away, the more the camera leans toward it
      const bx = b.x, by = b.y - Math.min(40, b.hurtH * 0.5);
      const far = U.clamp(U.dist(P.x, P.y, bx, by) / 160, 0, 1);
      const k2 = 0.3 + 0.25 * far;
      tx = U.lerp(tx, (P.x + bx) / 2 - W / 2, k2 * 2 > 1 ? 1 : k2 * 1.6);
      ty = U.lerp(ty, (P.y - 12 + by) / 2 - H / 2, k2 * 2 > 1 ? 1 : k2 * 1.6);
    }
    const k = Math.min(1, dt * 7);
    G.cam.x += (tx - G.cam.x) * k;
    G.cam.y += (ty - G.cam.y) * k;
    clampCam();
  }
  function clampCam() {
    const w = G.world;
    if (w.pw <= W) G.cam.x = (w.pw - W) / 2; else G.cam.x = U.clamp(G.cam.x, 0, w.pw - W);
    if (w.ph <= H) G.cam.y = (w.ph - H) / 2; else G.cam.y = U.clamp(G.cam.y, 0, w.ph - H);
  }
  function snapCam() {
    const P = G.player;
    G.cam.x = P.x - W / 2; G.cam.y = P.y - 12 - H / 2;
    clampCam();
  }

  // ================================================================ render
  function render(dt) {
    bctx.imageSmoothingEnabled = false;
    bctx.fillStyle = '#07060a';
    bctx.fillRect(0, 0, W, H);
    switch (G.scene) {
      case 'title': renderTitle(bctx, dt); break;
      case 'play': renderPlay(bctx, dt); break;
      case 'ending': renderEnding(bctx, dt); break;
      case 'credits': renderCredits(bctx, dt); break;
      default:
        if (AV.font) AV.font.draw(bctx, '…', W / 2, H / 2, '#655c69', { align: 'center' });
    }
    if (AV.touch) AV.touch.draw(bctx);
    vctx.imageSmoothingEnabled = false;
    vctx.drawImage(buf, 0, 0);
  }

  function renderPlay(ctx, dt) {
    const world = G.world, P = G.player;
    if (!world) return;
    const sh = AV.fx.shakeOffset();
    const cam = { x: Math.round(G.cam.x) + sh.x, y: Math.round(G.cam.y) + sh.y };
    world.drawGround(ctx, cam);
    world.drawFlat(ctx, cam);
    world.drawSorted(ctx, cam);
    AV.fx.drawParts(ctx, cam, false);
    // lighting
    const def = world.def;
    let amb = def.ambient != null ? def.ambient : 0.55;
    AV.fx.drawLighting(ctx, cam, amb, def.ambientColor || '#0c0a14', world.collectLights(), G.time);
    AV.fx.drawGlowParts(ctx, cam);
    const wea = AV.fx.weather;
    if (wea.includes('fog')) AV.fx.drawFog(ctx, cam, 1);
    AV.fx.drawParts(ctx, cam, true);
    AV.fx.drawTexts(ctx, cam);
    if (G.debug && G.showHitboxes) AV.combat.debugDraw(ctx, cam);
    AV.fx.drawVignette(ctx, 1);
    if (G.debug) drawDebug(ctx, cam);
    // UI
    if (!AV.dlg.active && !G.deathScreen) AV.ui.drawPrompt(ctx, G.interactTarget, cam);
    AV.ui.drawHUD(ctx, dt);
    AV.ui.drawToasts(ctx, dt);
    // fade sits over the world but below dialogue so words can be read in darkness
    if (G.fade.v > 0) { ctx.globalAlpha = G.fade.v; ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    if (G.deathScreen) drawDeathScreen(ctx);
    AV.dlg.draw(ctx);
    AV.ui.drawCards(ctx, dt);
    AV.ui.drawMenu(ctx);
  }

  function drawDebug(ctx, cam) {
    const P = G.player;
    const lines = [`${G.world.id}  tile ${Math.floor(P.x / T)},${Math.floor(P.y / T)}  hollow ${S.d.hollow}  deaths ${S.d.deaths}`,
      `ents ${G.world.entities.length} parts ${AV.fx.parts.length} god ${G.debugGod ? 'on' : 'off'}`];
    lines.forEach((l, i) => AV.font.draw(ctx, l, 4, H - 22 + i * 9, '#82a8ad'));
  }

  // ================================================================ world loading & transitions
  function spawnPoint(mapId, spawnName) {
    const def = AV.data.maps[mapId];
    const sp = def && def.spawns && def.spawns[spawnName];
    if (sp) return { x: sp[0] * T + 8, y: sp[1] * T + 14, dir: sp[2] || 'down' };
    const first = def && def.spawns && Object.values(def.spawns)[0];
    AV.warnOnce(`Spawn ${mapId}:${spawnName} missing`);
    return first ? { x: first[0] * T + 8, y: first[1] * T + 14, dir: first[2] || 'down' } : { x: 64, y: 64, dir: 'down' };
  }

  G.enterMap = function (mapId, pos) {
    AV.combat.clear();
    AV.fx.clearTransient();
    // scripts are NOT cleared here: a dialogue may teleport and then carry on in the new place
    const prevRegion = G.world ? G.world.def.region : null;
    const firstVisit = !S.get('visited_' + mapId);
    const world = new AV.World(mapId);
    G.world = world;
    const P = G.player;
    P.world = world;
    P.placeAt(pos.x, pos.y, pos.dir);
    P.state = P.state === 'dead' ? 'idle' : P.state === 'attack' || P.state === 'roll' || P.state === 'hurt' ? 'idle' : P.state;
    world.add(P);
    if (G.companion) {
      const c = G.makeCompanion(G.companionId);
      c.x = P.x - Math.cos(P.aim) * 14; c.y = P.y - Math.sin(P.aim) * 10;
      world.add(c);
      G.companion = c;
      // the placed NPC of the same person must not stand there twice
      const twin = world.entities.find((e) => e !== c && e.npcId === G.companionId && !e.isCompanion);
      if (twin) twin.gone = true;
    }
    S.d.map = mapId;
    S.set('visited_' + mapId, 1);
    AV.fx.setWeather(world.def.weather || 'none');
    if (!AV.bosses.active) {
      const m = G.musicOverride && G.musicOverride !== '__none' ? G.musicOverride : world.def.music;
      G.musicOverride = null;
      AV.audio.music(m || null, { fade: 2 });
    }
    snapCam();
    const region = world.def.region;
    if (region !== prevRegion && region && (firstVisit || !S.d.seenRegions[region] || prevRegion)) {
      AV.ui.areaCard(REGION_TITLES[region] || world.def.name, REGION_TITLES[region] && world.def.name !== REGION_TITLES[region] ? world.def.name : '');
      S.d.seenRegions[region] = 1;
    } else if (firstVisit && world.def.name) {
      AV.ui.areaCard(world.def.name, '');
    }
    if (world.def.onEnter) AV.script.run(world.def.onEnter, {});
  };

  G.transition = function (mapId, spawnName, opts = {}) {
    if (G.transitioning) return;
    if (!AV.data.maps[mapId]) { AV.warnOnce('transition to unknown map ' + mapId); opts.onDone && opts.onDone(); return; }
    G.transitioning = true;
    if (opts.door) AV.audio.sfx('door', { vol: 0.6 });
    G.fadeTo(1, 0.22);
    G.after(0.25, () => {
      const pos = opts.pos || spawnPoint(mapId, spawnName);
      G.enterMap(mapId, pos);
      G.save();
      G.after(0.05, () => {
        G.fadeTo(0, 0.35);
        G.after(0.2, () => { G.transitioning = false; opts.onDone && opts.onDone(); });
      });
    });
  };

  // ================================================================ shrines, rest, travel
  function shrinePos(mapId, shrineId) {
    const def = AV.data.maps[mapId];
    const e = def && (def.entities || []).find((x) => x.type === 'shrine' && x.id === shrineId);
    if (!e) return null;
    // stand in front of the shrine (first free tile below/left/right)
    const grid = AV.tiles.resolve(def);
    const free = (tx, ty) => tx >= 0 && ty >= 0 && tx < grid.w && ty < grid.h && !AV.tiles.isSolid(grid.ids[ty * grid.w + tx]);
    for (const [dx, dy] of [[0, 1], [1, 1], [-1, 1], [1, 0], [-1, 0], [0, 2], [0, -1]]) {
      if (free(Math.floor(e.x) + dx, Math.floor(e.y) + dy)) return { x: (e.x + dx) * T + 8, y: (e.y + dy) * T + 14, dir: dy < 0 ? 'down' : 'up' };
    }
    return { x: e.x * T + 8, y: (e.y + 1) * T + 14, dir: 'up' };
  }
  G.useShrine = function (shrine) {
    if (!S.isLit(shrine.shrineId)) {
      S.light(shrine.shrineId);
      shrine.updateLit();
      AV.audio.sfx('shrine');
      AV.fx.embers(shrine.x, shrine.y - 20, 26, { speed: 40 });
      AV.fx.flash('#f59a36', 0.2);
      G.player.kneel(1.0);
      AV.ui.toast('{e}' + shrine.name + '{/} — the candles take.', 'item');
      S.d.spawn = { map: G.world.id, shrine: shrine.shrineId };
      G.rest(shrine, true);
      return;
    }
    AV.ui.openShrine(shrine);
  };
  G.rest = function (shrine, silent) {
    const P = G.player;
    P.kneel(1.3);
    S.d.hp = S.maxHp();
    S.d.tallow = S.tallowMax();
    P.sta = S.maxSta();
    S.d.spawn = { map: G.world.id, shrine: shrine.shrineId };
    G.killed = {};
    G.world.killed = G.killed[G.world.id] = new Set();
    S.dirty = true;
    G.world.refreshPresence(false);
    AV.audio.sfx('rest');
    AV.fx.burst(P.x, P.y - 10, 18, { color: ['#fccf63', '#f59a36', '#fff3c2'], speed: 25, up: 30, g: -25, life: 1.3, glow: true });
    if (!silent) {
      const lines = AV.data.strings.shrineLines;
      const pick = Array.isArray(lines) ? lines.filter((l) => typeof l === 'string' || !l.if || S.test(l.if)) : [];
      if (pick.length) { const l = U.pick(pick); AV.fx.text(P.x, P.y - 34, typeof l === 'string' ? l : l.text, { color: '#e6cc9c', life: 3.4 }); }
    }
    G.save();
  };
  G.travelToShrine = function (s) {
    const pos = shrinePos(s.map, s.id);
    S.d.spawn = { map: s.map, shrine: s.id };
    G.transition(s.map, null, { pos: pos || undefined });
  };

  // ================================================================ death & respawn
  G.onPlayerDying = function () {
    AV.dlg.active = null;
  };
  G.onPlayerDeath = function () {
    S.d.deaths++;
    S.addHollow(1);
    const lines = (AV.data.strings.deathLines || []).filter((l) => typeof l === 'string' || !l.if || S.test(l.if));
    const l = lines.length ? U.pick(lines) : '';
    G.deathScreen = { t: 0, line: typeof l === 'string' ? l : l.text };
    AV.audio.music(null, { fade: 1.5 });
  };
  function respawn() {
    G.fadeTo(1, 0.6);
    G.after(0.7, () => {
      if (AV.bosses.active) AV.bosses.end(AV.bosses.active, false);
      AV.script.clear();
      AV.dlg.active = null;
      G.deathScreen = null;
      G.killed = {};
      S.d.hp = S.maxHp();
      S.d.tallow = S.tallowMax();
      S.d.cinder = 0;
      const P = G.player;
      P.state = 'idle'; P.dead = false; P.deathReported = false; P.iframes = 1.5; P.kindleT = 0; P.sta = S.maxSta();
      const sp = S.d.spawn || { map: 'crypt', spawn: 'start' };
      const pos = sp.shrine ? shrinePos(sp.map, sp.shrine) : spawnPoint(sp.map, sp.spawn || 'start');
      G.enterMap(sp.map, pos || spawnPoint(sp.map, 'start'));
      P.kneel(1.4);
      AV.audio.sfx('respawn');
      AV.fx.ash(P.x, P.y - 10, 30, { speed: 20, up: 0, g: 0 });
      G.save();
      G.fadeTo(0, 1.2);
    });
  }
  function drawDeathScreen(ctx) {
    const ds = G.deathScreen;
    const k = U.clamp(ds.t / 1.2, 0, 1);
    ctx.fillStyle = `rgba(7,6,10,${0.75 * k})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = k;
    AV.font.draw(ctx, 'NOT YET', W / 2, H / 2 - 20, '#cbc4c3', { font: 'large', align: 'center', scale: 2 });
    ctx.globalAlpha = U.clamp((ds.t - 1) / 1, 0, 1);
    if (ds.line) AV.font.wrap(ds.line, 280).forEach((l, i) => AV.font.draw(ctx, l, W / 2, H / 2 + 16 + i * 10, '#857c86', { align: 'center' }));
    ctx.globalAlpha = 1;
  }

  // ================================================================ companion (Hesk)
  G.makeCompanion = function (npcId) {
    const c = new AV.ents.Npc({ type: 'npc', npc: npcId, x: 0, y: 0 }, G.world);
    c.isCompanion = true;
    c.solid = false;
    c.cool = 1;
    c.barkCool = U.rand(20, 35);
    c.nd = Object.assign({}, c.nd, { barks: null });
    const baseUpdate = c.update.bind(c);
    c.update = function (dt, world) {
      this.animT += dt;
      if (this.flashT > 0) this.flashT -= dt;
      const P = G.player;
      if (!P) return;
      if (AV.dlg.active || G.isBusy()) { this.anim = this.anim.startsWith('attack') ? 'idle' : this.anim; return; }
      const d = U.dist(this.x, this.y, P.x, P.y);
      if (d > 220) { this.x = P.x - Math.cos(P.aim) * 14; this.y = P.y - Math.sin(P.aim) * 8; }
      this.cool -= dt;
      // fight
      if (this.attackT > 0) {
        this.attackT -= dt;
        if (this.attackT <= 0.18 && !this.swung) {
          this.swung = true;
          AV.combat.add({ shape: 'arc', x: this.x, y: this.y - 10, r: 30, a: this.attackA, spread: 1.0, dmg: 2, knock: 150, team: 'player', owner: this, life: 0.1 });
          AV.audio.sfx('swing', { pitch: 0.8, vol: 0.6 });
        }
        if (this.attackT <= 0) this.anim = 'idle';
        return;
      }
      let foe = null, fd = 40;
      for (const e of world.entities) {
        if (e.team !== 'enemy' || e.dead || !e.hittable || e.passive || e.passiveTarget) continue;
        const dd = U.dist(this.x, this.y, e.x, e.y);
        if (dd < fd) { fd = dd; foe = e; }
      }
      if (foe && this.cool <= 0) {
        this.attackA = Math.atan2(foe.y - this.y, foe.x - this.x);
        const dn = Math.abs(Math.cos(this.attackA)) > 0.6 ? 'side' : Math.sin(this.attackA) > 0 ? 'down' : 'up';
        this.anim = 'attack_' + dn; this.animT = 0; this.flip = Math.cos(this.attackA) < 0;
        this.attackT = 0.45; this.swung = false; this.cool = 1.1;
        return;
      }
      // follow
      const tx = P.x - Math.cos(P.aim) * 18, ty = P.y - Math.sin(P.aim) * 12;
      const dd = U.dist(this.x, this.y, tx, ty);
      if (dd > 8) {
        const sp = (dd > 60 ? 115 : 78) * dt;
        const a = Math.atan2(ty - this.y, tx - this.x);
        if (!world.move(this, Math.cos(a) * sp, Math.sin(a) * sp) && dd > 90) { this.x = tx; this.y = ty; }
        const dn = Math.abs(Math.cos(a)) > 0.6 ? 'side' : Math.sin(a) > 0 ? 'down' : 'up';
        this.anim = 'walk_' + dn; this.flip = Math.cos(a) < 0;
      } else if (!this.anim.startsWith('idle')) this.anim = 'idle';
      // barks
      this.barkCool -= dt;
      if (this.barkCool <= 0) {
        this.barkCool = U.rand(28, 50);
        const barks = (AV.data.strings.heskBarks || []).filter((b) => typeof b === 'string' || !b.if || S.test(b.if));
        if (barks.length) { const b = U.pick(barks); AV.fx.text(this.x, this.y - 36, typeof b === 'string' ? b : b.text, { color: '#cbc4c3', life: 3.4 }); }
      }
    };
    c.w = 8;
    return c;
  };
  G.setCompanion = function (npcId) {
    const w = G.world;
    if (G.companion) { G.companion.gone = true; G.companion = null; }
    G.companionId = npcId;
    S.d.companion = npcId || null;
    if (!npcId || !w) return;
    const placed = w.findNpc(npcId);
    const c = G.makeCompanion(npcId);
    if (placed) { c.x = placed.x; c.y = placed.y; placed.gone = true; }
    else { c.x = G.player.x - 14; c.y = G.player.y; }
    G.companion = c;
    w.add(c);
  };

  // ================================================================ dialogue / menu callbacks
  G.onDialogueEnd = function () {
    if (G.fade.v > 0.5 && G.fade.target > 0.5 && !G.transitioning && G.scene === 'play' && !AV.script.blocking) G.fadeTo(0, 0.8);
    S.dirty = true;
  };
  G.onMenuClosed = function () { I.consumeAll(); };

  function revealPlayer() {
    const P = G.player;
    if (!P || !P.hidden) return;
    P.hidden = false;
    S.set('brand_risen', 1);
    P.kneel(1.2);
    AV.fx.ash(P.x, P.y - 10, 30, { speed: 30, up: 10 });
    AV.fx.embers(P.x, P.y - 14, 8);
    AV.audio.sfx('respawn', { vol: 0.7 });
  }

  G.revealPlayer = revealPlayer;

  // ================================================================ saving
  G.save = function () {
    if (G.scene !== 'play' || !G.player || !G.world) return;
    if (G.player.dead) return;
    S.d.map = G.world.id;
    S.d.pos = { x: G.player.x, y: G.player.y };
    S.d.companion = G.companionId || null;
    AV.save.write(S.d);
  };

  // ================================================================ new game / continue / quit
  function startPlay() {
    G.scene = 'play';
    G.killed = {};
    G.player = new AV.Player(null);
    G.companion = null; G.companionId = null;
    G.deathScreen = null;
    G.transitioning = false;
    G.hitstop = 0; G.slowmo = null;
    G.toastKeys = new Set();
    AV.ui.cards = []; AV.ui.toasts = []; AV.ui.menu = null;
    AV.dlg.active = null;
    AV.script.clear();
  }
  G.newGame = function () {
    AV.save.clear();
    S.reset();
    startPlay();
    G.fade.v = 1; G.fadeTo(1, 0.1);
    G.player.hidden = true;
    const pos = spawnPoint('crypt', 'start');
    G.enterMap('crypt', pos);
    AV.ui.cards = [];                  // the opening begins in darkness, without a place name
    // the intro always runs from the engine; consume any map trigger that would run it again
    const crypt = AV.data.maps.crypt;
    (crypt.entities || []).forEach((e) => { if (e.type === 'trigger' && e.dialogue === 'intro') S.d.picked['trig:' + (e.id || 'crypt#' + (e.x + ',' + e.y))] = 1; });
    G.world.entities.forEach((e) => { if (e instanceof AV.ents.Trigger && e.def.dialogue === 'intro') e.fired = true; });
    G.after(1.2, () => {
      if (AV.data.dialogue.intro) AV.script.run(['dialogue:intro'], {});
      else { S.set('intro_done', 1); G.fadeTo(0, 1); }
    });
    G.save();
  };
  G.continueGame = function () {
    const d = AV.save.read();
    if (!d) return G.newGame();
    S.load(d);
    startPlay();
    G.fade.v = 1; G.fadeTo(0, 1.2);
    let pos = null;
    if (d.pos && AV.data.maps[d.map]) pos = { x: d.pos.x, y: d.pos.y, dir: 'down' };
    const mapId = AV.data.maps[d.map] ? d.map : 'crypt';
    G.enterMap(mapId, pos || spawnPoint(mapId, 'start'));
    if (!S.get('intro_done')) {
      G.player.hidden = true;
      G.after(1.0, () => AV.data.dialogue.intro && AV.script.run(['dialogue:intro'], {}));
    }
    if (d.companion) G.setCompanion(d.companion);
    AV.ui.areaCard((REGION_TITLES[G.world.def.region] || G.world.def.name), G.world.def.name);
  };
  G.quitToTitle = function () {
    G.save();
    AV.ui.closeAll();
    G.fadeTo(1, 0.4);
    G.after(0.45, () => { AV.fx.setWeather('none'); AV.bosses.active = null; openTitle(); });
  };

  // ================================================================ title scene
  const titleParts = [];
  function openTitle() {
    G.scene = 'title';
    G.world = null;
    AV.dlg.active = null;
    AV.script.clear();
    AV.ui.menu = null;
    G.fadeTo(0, 1.2);
    AV.audio.music('title', { fade: 2 });
    AV.audio.ambience(['wind']);
    const hasSave = AV.save.exists();
    G.title = { t: 0, pressed: !!G.title && G.title.pressed, menu: null };
    const items = [];
    if (hasSave) items.push({ label: 'Continue', action: () => { AV.ui.menu = null; G.fadeTo(1, 0.5); G.after(0.55, () => G.continueGame()); } });
    items.push({ label: 'New Game', action: () => {
      const go = () => { AV.ui.menu = null; G.fadeTo(1, 0.6); AV.audio.music(null, { fade: 1.5 }); G.after(0.7, () => G.newGame()); };
      if (hasSave) AV.ui.confirm('Begin again? Your journey will be lost.', go); else go();
    } });
    items.push({ label: 'Settings', action: () => AV.ui.openSettings() });
    items.push({ label: 'Credits', action: () => { AV.ui.menu = null; openCredits(true); } });
    G.title.menu = new AV.ui.ListMenu({ items, w: 112, x: 26, y: 104, noDim: true, onCancel: () => {} });
  }
  function updateTitle(dt) {
    const t = G.title;
    t.t += dt;
    if (Math.random() < 0.6) titleParts.push({ x: U.rand(-20, W), y: -4, vx: U.rand(-4, 6), vy: U.rand(8, 18), s: Math.random() < 0.2 ? 2 : 1, c: U.pick(['#857c86', '#a8a0a6', '#cbc4c3']), a: U.rand(0.3, 0.8) });
    if (Math.random() < 0.25) titleParts.push({ x: W / 2 + U.rand(-60, 60), y: H + 2, vx: U.rand(-6, 6), vy: U.rand(-26, -12), s: 1, c: U.pick(['#f59a36', '#fccf63', '#e2621f']), a: 1, ember: true });
    for (let i = titleParts.length - 1; i >= 0; i--) {
      const p = titleParts[i];
      p.x += (p.vx + Math.sin(t.t + i) * 3) * dt; p.y += p.vy * dt;
      if (p.y > H + 5 || p.y < -8) titleParts.splice(i, 1);
    }
    if (!t.pressed) {
      if (t.t > 0.6 && I.anyPressed()) { t.pressed = true; I.consumeAll(); AV.audio.init(); AV.audio.music('title', { fade: 2 }); AV.audio.sfx('bell', { vol: 0.5 }); }
      return;
    }
    if (AV.ui.menu) AV.ui.update(dt);
    else if (t.menu) t.menu.update(dt);
  }
  function renderTitle(ctx) {
    const t = G.title;
    // sky & pyre glow
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#07060a'); g.addColorStop(0.6, '#120d14'); g.addColorStop(1, '#2a0c14');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const fl = 1 + Math.sin(t.t * 7) * 0.04 + Math.sin(t.t * 13) * 0.03;
    const rg = ctx.createRadialGradient(W / 2, H + 10, 8, W / 2, H + 10, 210 * fl);
    rg.addColorStop(0, 'rgba(252,207,99,0.85)'); rg.addColorStop(0.18, 'rgba(245,154,54,0.6)'); rg.addColorStop(0.45, 'rgba(184,54,26,0.28)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    // distant city silhouette
    ctx.fillStyle = '#0b080d';
    const R = U.rng(77);
    for (let x = 0; x < W; x += 6) {
      const h = 18 + R() * 26 + (Math.abs(x - W / 2) < 60 ? 22 : 0);
      ctx.fillRect(x, H - 52 - h, 6, h + 60);
      if (R() < 0.12) ctx.fillRect(x + 2, H - 52 - h - 12, 2, 12);
    }
    // knight
    AV.art.draw(ctx, 'title_knight', 'idle', t.t, W / 2, H - 6, {});
    // ash
    for (const p of titleParts) { ctx.globalAlpha = p.a; ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
    ctx.globalAlpha = 1;
    AV.fx.drawVignette(ctx, 1);
    // logo
    const la = U.clamp((t.t - 0.3) / 1.5, 0, 1);
    ctx.globalAlpha = la;
    AV.font.draw(ctx, 'ASHEN VOW', W / 2, 22, '#ebe5dc', { font: 'large', align: 'center', scale: 2 });
    if (!AV.art.draw(ctx, 'ui_title_flourish', 'idle', t.t, W / 2, 53, {})) AV.ui.divider(ctx, W / 2, 56, 150);
    AV.font.draw(ctx, AV.data.strings.tagline || 'What the ash remembers.', W / 2, 69, '#857c86', { align: 'center' });
    ctx.globalAlpha = 1;
    if (!t.pressed) {
      if (t.t > 1.2) { ctx.globalAlpha = 0.45 + 0.4 * Math.sin(t.t * 2.2); AV.font.draw(ctx, 'press any key', W / 2, 92, '#cbc4c3', { align: 'center' }); ctx.globalAlpha = 1; }
    } else if (t.menu && !AV.ui.menu) t.menu.draw(ctx);
    const meta = AV.save.meta();
    const ends = meta.endings ? Object.keys(meta.endings).length : 0;
    if (ends) AV.font.draw(ctx, 'Endings witnessed: ' + ends + ' / 5', W - 6, H - 11, '#4a4250', { align: 'right' });
    AV.font.draw(ctx, 'v' + AV.VERSION, 6, H - 11, '#332c38');
    AV.ui.drawMenu(ctx);
    if (G.fade.v > 0) { ctx.globalAlpha = G.fade.v; ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ================================================================ ending scene
  G.startEnding = function (id) {
    const def = AV.data.endings[id];
    AV.script.clear();
    AV.dlg.active = null;
    AV.ui.menu = null;
    if (!def) { AV.warnOnce('Missing ending ' + id); return; }
    S.d.endings[id] = 1;
    G.transitioning = true;          // freeze the world while the screen goes dark
    AV.save.markEnding(id);
    AV.save.write(S.d);
    const slides = (def.slides || []).filter((s) => !s.if || S.test(s.if)).map((s) => [].concat(s.text || []).map((l) => AV.subst(l)));
    G.fadeTo(1, 1.5);
    AV.audio.music(null, { fade: 2 });
    G.after(1.8, () => {
      G.scene = 'ending';
      G.ending = { id, def, slides, idx: 0, t: 0, phase: 'slides' };
      AV.fx.setWeather('none');
      AV.audio.music(def.music || 'ending', { fade: 3 });
      G.fadeTo(0, 1.5);
    });
  };
  function updateEnding(dt) {
    const e = G.ending;
    e.t += dt;
    if (e.phase === 'slides') {
      const lines = e.slides[e.idx] || [];
      const full = 1.2 + lines.length * 0.9;
      if ((e.t > 1.0 && I.pressed('confirm')) || e.t > full + 5.5) {
        e.idx++; e.t = 0;
        if (e.idx >= e.slides.length) { e.phase = 'title'; e.t = 0; }
      }
    } else if (e.phase === 'title') {
      if ((e.t > 2 && I.pressed('confirm')) || e.t > 6.5) {
        G.fadeTo(1, 1.2);
        e.phase = 'out';
        G.after(1.3, () => openCredits(false));
      }
    }
    if (Math.random() < 0.5) titleParts.push({ x: U.rand(-20, W), y: -4, vx: U.rand(-4, 6), vy: U.rand(8, 16), s: 1, c: U.pick(['#655c69', '#857c86']), a: U.rand(0.2, 0.5) });
    for (let i = titleParts.length - 1; i >= 0; i--) { const p = titleParts[i]; p.x += p.vx * dt; p.y += p.vy * dt; if (p.y > H + 5 || p.y < -8) titleParts.splice(i, 1); }
  }
  function renderEnding(ctx) {
    const e = G.ending;
    ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H);
    const warm = e.id === 'weight_of_days' || e.id === 'last_name';
    if (warm || e.id === 'ember_crown') {
      const rg = ctx.createRadialGradient(W / 2, H + 30, 5, W / 2, H + 30, 200);
      rg.addColorStop(0, e.id === 'ember_crown' ? 'rgba(184,54,26,0.35)' : 'rgba(245,154,54,0.18)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    }
    for (const p of titleParts) { ctx.globalAlpha = p.a; ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
    ctx.globalAlpha = 1;
    if (e.phase === 'slides') {
      const lines = e.slides[e.idx] || [];
      const wrapped = [];
      lines.forEach((l) => { AV.font.wrap(l, 300).forEach((w) => wrapped.push({ w, src: l })); wrapped.push(null); });
      if (wrapped.length) wrapped.pop();
      const total = wrapped.length * 11;
      let y = Math.round(H / 2 - total / 2);
      let li = -1, prevSrc = null;
      for (const row of wrapped) {
        if (!row) { y += 6; continue; }
        if (row.src !== prevSrc) { li++; prevSrc = row.src; }
        const a = U.clamp((e.t - 0.4 - li * 0.9) / 0.8, 0, 1);
        ctx.globalAlpha = a;
        AV.font.drawRich(ctx, row.w, Math.round(W / 2 - AV.font.measure(row.w) / 2), y, { color: '#cbc4c3', shadow: '#07060a' });
        y += 11;
      }
      ctx.globalAlpha = 1;
    } else {
      const a = U.clamp(e.t / 1.5, 0, 1);
      ctx.globalAlpha = a;
      AV.font.draw(ctx, e.def.title || '', W / 2, H / 2 - 10, '#ebe5dc', { font: 'large', align: 'center' });
      AV.ui.divider(ctx, W / 2, H / 2 + 8, 100);
      ctx.globalAlpha = 1;
    }
    if (G.fade.v > 0) { ctx.globalAlpha = G.fade.v; ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ================================================================ credits scene
  function openCredits(fromTitle) {
    G.scene = 'credits';
    G.credits = { t: 0, fromTitle };
    AV.audio.music('credits', { fade: 2 });
    G.fadeTo(0, 1);
  }
  function updateCredits(dt) {
    const c = G.credits;
    c.t += dt;
    const lines = AV.data.strings.credits || ['ASHEN VOW'];
    const end = lines.length * 14 + H + 40;
    if ((c.t > 1 && I.pressed('cancel')) || c.t * 18 > end || (c.fromTitle && c.t > 1 && I.pressed('confirm'))) {
      if (!c.leaving) { c.leaving = true; G.fadeTo(1, 1); G.after(1.05, () => openTitle()); }
    }
  }
  function renderCredits(ctx) {
    const c = G.credits;
    ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H);
    const lines = AV.data.strings.credits || ['ASHEN VOW'];
    let y = H + 10 - c.t * 18;
    lines.forEach((l, i) => {
      const txt = typeof l === 'string' ? l : l.text;
      const big = i === 0;
      if (y > -20 && y < H + 20) AV.font.draw(ctx, txt, W / 2, Math.round(y), big ? '#ebe5dc' : /^[A-Z ,'—-]+$/.test(txt) && txt.length < 30 ? '#f59a36' : '#a8a0a6', { font: big ? 'large' : 'small', align: 'center' });
      y += big ? 24 : 14;
    });
    if (G.fade.v > 0) { ctx.globalAlpha = G.fade.v; ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ================================================================ debug helpers (use from the console)
  AV.debug = {
    tp(map, spawn) { G.transition(map, spawn || Object.keys(AV.data.maps[map].spawns)[0]); },
    set(f, v = 1) { S.set(f, v); },
    give(id, n = 1) { G.receiveItem(id, n); },
    god(on = true) { G.debugGod = on; },
    state() { return JSON.parse(JSON.stringify(S.d)); },
    stones() { ['hart_stone', 'bell_stone', 'shield_stone'].forEach((s) => S.give(s)); },
    kill() { G.world.entities.filter((e) => e.team === 'enemy' && !e.dead && e.hittable).forEach((e) => { e.hp = 0; e.die({}); }); },
    boss() { const b = AV.bosses.active; if (b) { b.hp = 1; } },
    cinder() { S.set('cinder_unlocked', 1); S.d.cinder = 100; },
    // jump straight into any map with a fresh state (for testing)
    play(mapId, spawn, keepState) {
      if (!keepState) { S.reset(); S.set('intro_done', 1); }
      startPlay();
      G.fade.v = 0; G.fadeTo(0, 0.1);
      const def = AV.data.maps[mapId];
      G.enterMap(mapId, spawnPoint(mapId, spawn || Object.keys(def.spawns)[0]));
    },
    lab(kinds) {
      const rows = [];
      for (let y = 0; y < 24; y++) {
        let r = '';
        for (let x = 0; x < 40; x++) {
          const edge = x === 0 || y === 0 || x === 39 || y === 23;
          r += edge ? '#' : (y === 6 && x > 4 && x < 12) ? 'B' : (y === 12 && x > 20 && x < 26) ? '~' : (x === 30 && y > 3 && y < 9) ? 'C' : (y > 16 && x < 8) ? '-' : (x + y) % 11 === 0 ? ',' : '.';
        }
        rows.push(r);
      }
      AV.data.maps.__lab = { name: 'The Lab', region: 'village', theme: 'village', music: 'village', weather: 'ash', ambient: 0.45,
        tiles: rows, spawns: { start: [10, 12, 'down'] },
        entities: [{ type: 'light', x: 10, y: 10, r: 90 }, { type: 'shrine', x: 14, y: 9, id: 'shrine_lab', name: 'Lab Shrine' }]
          .concat((kinds || ['pilgrim', 'hound', 'censer']).map((k, i) => ({ type: 'enemy', kind: k, x: 20 + i * 3, y: 16 }))) };
      this.play('__lab');
    },
  };

  // ================================================================ boot
  AV.boot = function () {
    view = document.getElementById('game');
    view.width = W; view.height = H;
    vctx = view.getContext('2d');
    buf = document.createElement('canvas'); buf.width = W; buf.height = H;
    bctx = buf.getContext('2d');
    window.addEventListener('resize', resize);
    resize();
    G.debug = /[?&]debug/.test(location.search);
    AV.settings.load();
    I.attach(view);
    if (AV.touch) { AV.touch.attach(view); window.addEventListener('touchstart', () => setTimeout(resize, 50), { once: true }); }
    window.addEventListener('orientationchange', () => setTimeout(resize, 200));
    // bake all art (lazy definitions → canvases)
    try { AV.art.bakeAll(); } catch (e) { console.error('[AV] art bake failed', e); }
    if (G.debug) {
      window.addEventListener('keydown', (e) => {
        if (e.code === 'F2') { G.debugGod = !G.debugGod; AV.ui.toast('God mode ' + (G.debugGod ? 'on' : 'off')); }
        if (e.code === 'F3') { G.showHitboxes = !G.showHitboxes; }
      });
    }
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
    if (window.AV_LOAD_ERRORS && window.AV_LOAD_ERRORS.length) console.warn('[AV] missing files:', window.AV_LOAD_ERRORS);
    openTitle();
    G.fade.v = 1;
    startLoop();
  };
})(window.AV);
