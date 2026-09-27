// ASHEN VOW — HUD, panels, cards, toasts, prompts and all menus (pause, inventory, journal, settings, shrine, shop)
(function (AV) {
  'use strict';
  const U = AV.util;
  const S = AV.state;
  const I = AV.input;
  const W = AV.W, H = AV.H;

  const COL = {
    text: '#ebe5dc', dim: '#857c86', faint: '#4a4250', ember: '#f59a36', gold: '#d4b96a', blood: '#a8363c',
    parchment: '#e6cc9c', ghost: '#b9d6d3', sel: '#fccf63',
  };

  const ui = AV.ui = {
    menu: null,
    cards: [],
    toasts: [],
    shownOnce: new Set(),
    hpGhost: null,
    COL,
  };

  // ================================================================ primitives
  ui.panel = function (ctx, x, y, w, h, style = 'dark') {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const sheet = AV.art.sheets[style === 'inner' ? 'ui_panel_inner' : 'ui_panel'];
    if (style === 'parchment') {
      ctx.fillStyle = 'rgba(20,14,10,0.95)'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#7a6230'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
      ctx.fillStyle = '#3a261a'; ctx.fillRect(x + 2, y + 2, w - 4, 1); ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
      ctx.fillStyle = '#a88a48'; ctx.fillRect(x, y, 2, 2); ctx.fillRect(x + w - 2, y, 2, 2); ctx.fillRect(x, y + h - 2, 2, 2); ctx.fillRect(x + w - 2, y + h - 2, 2, 2);
      return;
    }
    if (style === 'tab') {
      ctx.fillStyle = 'rgba(7,6,10,0.96)'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#4a3a1c'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
      return;
    }
    if (sheet && sheet.anims.idle && w >= 16 && h >= 16) {
      const src = sheet.anims.idle.frames[0];
      const c = 8, sw = src.width, sh = src.height;
      // 9-slice
      ctx.drawImage(src, 0, 0, c, c, x, y, c, c);
      ctx.drawImage(src, sw - c, 0, c, c, x + w - c, y, c, c);
      ctx.drawImage(src, 0, sh - c, c, c, x, y + h - c, c, c);
      ctx.drawImage(src, sw - c, sh - c, c, c, x + w - c, y + h - c, c, c);
      ctx.drawImage(src, c, 0, sw - 2 * c, c, x + c, y, w - 2 * c, c);
      ctx.drawImage(src, c, sh - c, sw - 2 * c, c, x + c, y + h - c, w - 2 * c, c);
      ctx.drawImage(src, 0, c, c, sh - 2 * c, x, y + c, c, h - 2 * c);
      ctx.drawImage(src, sw - c, c, c, sh - 2 * c, x + w - c, y + c, c, h - 2 * c);
      ctx.drawImage(src, c, c, sw - 2 * c, sh - 2 * c, x + c, y + c, w - 2 * c, h - 2 * c);
      return;
    }
    ctx.fillStyle = style === 'inner' ? 'rgba(34,29,39,0.95)' : 'rgba(9,7,12,0.94)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#4a3a1c';
    ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
    ctx.fillStyle = '#221d27';
    ctx.fillRect(x + 2, y + 2, w - 4, 1); ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
    ctx.fillStyle = '#a88a48';
    ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x + w - 2, y + 1, 1, 1); ctx.fillRect(x + 1, y + h - 2, 1, 1); ctx.fillRect(x + w - 2, y + h - 2, 1, 1);
  };
  ui.cursor = function (ctx, x, y, dir) {
    if (dir === 'down') {
      ctx.fillStyle = COL.ember;
      ctx.fillRect(x, y, 5, 1); ctx.fillRect(x + 1, y + 1, 3, 1); ctx.fillRect(x + 2, y + 2, 1, 1);
      return;
    }
    if (!AV.art.draw(ctx, 'ui_cursor', 'idle', AV.game.time, x + 3, y + 8, {})) {
      ctx.fillStyle = COL.ember; ctx.fillRect(x, y + 2, 2, 5); ctx.fillStyle = COL.sel; ctx.fillRect(x + 2, y + 3, 2, 3);
    }
  };
  ui.divider = function (ctx, cx, y, w = 64) {
    if (AV.art.draw(ctx, 'ui_divider', 'idle', 0, cx, y + 4, {})) return;
    ctx.fillStyle = '#4a3a1c'; ctx.fillRect(Math.round(cx - w / 2), y + 2, w, 1);
    ctx.fillStyle = COL.ember; ctx.fillRect(Math.round(cx) - 1, y + 1, 3, 3);
  };
  ui.keycap = function (ctx, x, y, label) {
    const w = Math.max(9, AV.font.measure(label) + 5);
    ctx.fillStyle = '#141118'; ctx.fillRect(x, y, w, 9);
    ctx.fillStyle = '#655c69'; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, 9); ctx.fillRect(x + w - 1, y, 1, 9);
    ctx.fillStyle = '#332c38'; ctx.fillRect(x, y + 8, w, 1);
    AV.font.draw(ctx, label, x + 3, y + 1, COL.text, { shadow: null });
    return w;
  };
  ui.dim = function (ctx, a = 0.6) { ctx.fillStyle = `rgba(4,3,6,${a})`; ctx.fillRect(0, 0, W, H); };

  // ================================================================ cards & toasts
  ui.card = function (title, sub, opts = {}) {
    ui.cards.push({ title, sub, t: 0, life: opts.life || 4, kind: opts.kind || 'card' });
  };
  ui.chapterCard = function (n) {
    const ch = (AV.data.strings.chapters || {})[n] || { title: String(n), name: '' };
    AV.audio.sfx('chapter');
    ui.cards = ui.cards.filter((c) => c.kind !== 'area');
    ui.cards.push({ title: ch.title, sub: ch.name, t: 0, life: 5, kind: 'chapter' });
  };
  ui.areaCard = function (name, sub) {
    ui.cards = ui.cards.filter((c) => c.kind !== 'area');
    ui.cards.push({ title: name, sub: sub || '', t: 0, life: 3.4, kind: 'area' });
  };
  ui.bossCard = function (name, sub) { ui.cards.push({ title: name, sub, t: 0, life: 3.2, kind: 'boss' }); };
  ui.toast = function (text, kind) {
    ui.toasts.push({ text, kind: kind || 'info', t: 0, life: 3.6 });
    if (ui.toasts.length > 4) ui.toasts.shift();
  };

  // ================================================================ HUD
  let hpGhost = 10;
  ui.drawHUD = function (ctx, dt) {
    const P = AV.game.player;
    if (!P || AV.game.scene !== 'play' || P.hidden) return;
    const maxHp = S.maxHp(), hp = S.d.hp;
    hpGhost = hpGhost > hp ? Math.max(hp, hpGhost - dt * maxHp * 0.5) : hp;
    const cinderOn = !!S.get('cinder_unlocked');
    const x0 = cinderOn ? 28 : 8, y0 = 8;
    // health
    const hw = 56 + (maxHp - 10) * 4;
    ui.barFrame(ctx, x0, y0, hw, 6);
    ctx.fillStyle = '#2a0c14'; ctx.fillRect(x0 + 1, y0 + 1, hw - 2, 4);
    ctx.fillStyle = '#cbc4c3'; ctx.fillRect(x0 + 1, y0 + 1, Math.round((hw - 2) * hpGhost / maxHp), 4);
    const hpw = Math.round((hw - 2) * hp / maxHp);
    ctx.fillStyle = '#7a2230'; ctx.fillRect(x0 + 1, y0 + 1, hpw, 4);
    ctx.fillStyle = '#a8363c'; ctx.fillRect(x0 + 1, y0 + 1, hpw, 2);
    if (hp / maxHp < 0.3 && Math.floor(AV.game.time * 3) % 2 === 0) { ctx.fillStyle = 'rgba(255,120,120,0.25)'; ctx.fillRect(x0 + 1, y0 + 1, hpw, 4); }
    // stamina
    const maxSta = S.maxSta();
    const sw = 44 + (maxSta - 60) * 0.6;
    ui.barFrame(ctx, x0, y0 + 8, sw, 4);
    ctx.fillStyle = '#141118'; ctx.fillRect(x0 + 1, y0 + 9, sw - 2, 2);
    const sta = Math.max(0, P.sta);
    ctx.fillStyle = P.sta <= 0 ? '#655c69' : P.kindled ? '#fccf63' : '#cbc4c3';
    ctx.fillRect(x0 + 1, y0 + 9, Math.round((sw - 2) * sta / maxSta), 2);
    // tallow candles
    const tMax = S.tallowMax();
    for (let i = 0; i < tMax; i++) {
      const lit = i < S.d.tallow;
      const cx = x0 + i * 8, cy = y0 + 14;
      if (!AV.art.draw(ctx, 'ui_candle', lit ? 'lit' : 'unlit', AV.game.time + i * 0.3, cx + 3, cy + 11, {})) {
        ctx.fillStyle = lit ? '#e6cc9c' : '#4a4250'; ctx.fillRect(cx + 1, cy + 4, 4, 7);
        if (lit) { ctx.fillStyle = '#f59a36'; ctx.fillRect(cx + 2, cy + 1, 2, 3); }
      }
    }
    // cinder orb
    if (cinderOn) ui.drawCinder(ctx, 7, 7, P);
    // pennies (top right)
    const pt = String(S.d.pennies);
    const pw = AV.font.measure(pt);
    if (!AV.art.drawIcon(ctx, 'icon_penny', W - pw - 26, 4)) { ctx.fillStyle = '#a88a48'; ctx.fillRect(W - pw - 20, 9, 5, 5); }
    AV.font.draw(ctx, pt, W - pw - 8, 8, COL.gold);
    // boss bar
    const b = AV.bosses.active;
    if (b && !b.finished) ui.drawBossBar(ctx, b);
  };
  ui.barFrame = function (ctx, x, y, w, h) {
    ctx.fillStyle = '#07060a'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#4a3a1c'; ctx.fillRect(x - 1, y - 1, w + 2, 1); ctx.fillRect(x - 1, y + h, w + 2, 1);
    ctx.fillStyle = '#7a6230'; ctx.fillRect(x - 1, y - 1, 1, h + 2); ctx.fillRect(x + w, y - 1, 1, h + 2);
  };
  ui.drawCinder = function (ctx, x, y, P) {
    const full = S.d.cinder >= 100;
    const k = P.kindled ? 1 : S.d.cinder / 100;
    const cx = x + 8, cy = y + 8, r = 7;
    ctx.fillStyle = '#07060a';
    ctx.beginPath(); ctx.arc(cx, cy, r + 1, 0, Math.PI * 2); ctx.fill();
    // fill level (pixel scanlines)
    for (let yy = -r; yy <= r; yy++) {
      const half = Math.floor(Math.sqrt(r * r - yy * yy));
      const level = (r - yy) / (2 * r);
      if (level <= k) {
        ctx.fillStyle = P.kindled ? (Math.random() < 0.5 ? '#fccf63' : '#f59a36') : level > k - 0.12 ? '#f59a36' : '#b8361a';
        ctx.fillRect(cx - half, cy + yy, half * 2 + 1, 1);
      } else { ctx.fillStyle = '#221d27'; ctx.fillRect(cx - half, cy + yy, half * 2 + 1, 1); }
    }
    AV.art.draw(ctx, 'ui_cinder', full || P.kindled ? 'full' : 'empty', AV.game.time, cx, cy, {});
    if (full || P.kindled) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.25 + 0.2 * Math.sin(AV.game.time * 6);
      ctx.fillStyle = '#f59a36';
      ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    if (P.kindled) {
      const frac = P.kindleT / (8 * (S.relicOn('ashen_sigil') ? 1.5 : 1));
      ctx.strokeStyle = '#fff3c2'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, r + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke();
    }
  };
  ui.drawBossBar = function (ctx, b) {
    const w = 220, x = Math.round((W - w) / 2), y = H - 16;
    const intro = b.introT > 0 ? 1 - b.introT / 1.4 : 1;
    ctx.globalAlpha = U.clamp(intro * 1.5, 0, 1);
    AV.font.draw(ctx, b.name, W / 2, y - 11, '#cbc4c3', { align: 'center' });
    ui.barFrame(ctx, x, y, w, 4);
    ctx.fillStyle = '#141118'; ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = '#cbc4c3'; ctx.fillRect(x, y, Math.round(w * Math.max(0, b.displayHp) / b.maxHp), 4);
    ctx.fillStyle = '#7a2230'; ctx.fillRect(x, y, Math.round(w * Math.max(0, b.hp) / b.maxHp), 4);
    ctx.fillStyle = '#a8363c'; ctx.fillRect(x, y, Math.round(w * Math.max(0, b.hp) / b.maxHp), 1);
    AV.art.draw(ctx, 'ui_boss_left', 'idle', 0, x - 2, y + 2, {});
    AV.art.draw(ctx, 'ui_boss_right', 'idle', 0, x + w + 1, y + 2, {});
    ctx.globalAlpha = 1;
  };

  ui.drawPrompt = function (ctx, target, cam) {
    if (!target || AV.dlg.active || ui.menu) return;
    const label = I.label('interact');
    const text = target.interactLabel ? target.interactLabel() : 'Use';
    const tw = AV.font.measure(text);
    const kw = Math.max(9, AV.font.measure(label) + 5);
    const w = kw + tw + 8;
    const px = Math.round((target.interactPoint ? target.interactPoint().x : target.x) - cam.x - w / 2);
    const py = Math.round((target.promptY ? target.promptY() : target.y - 30) - cam.y - 12 + Math.sin(AV.game.time * 3));
    ctx.fillStyle = 'rgba(7,6,10,0.8)'; ctx.fillRect(px - 2, py - 2, w + 4, 13);
    ui.keycap(ctx, px, py, label);
    AV.font.draw(ctx, text, px + kw + 4, py + 1, COL.text);
  };

  ui.drawCards = function (ctx, dt) {
    for (const c of ui.cards) c.t += dt;
    ui.cards = ui.cards.filter((c) => c.t < c.life);
    for (const c of ui.cards) {
      const k = c.t / c.life;
      const a = k < 0.15 ? k / 0.15 : k > 0.75 ? (1 - k) / 0.25 : 1;
      ctx.globalAlpha = a;
      if (c.kind === 'chapter') {
        ctx.fillStyle = `rgba(4,3,6,${0.55 * a})`; ctx.fillRect(0, 70, W, 64);
        AV.font.draw(ctx, c.title, W / 2, 80, COL.ember, { font: 'large', align: 'center' });
        ui.divider(ctx, W / 2, 98, 90);
        AV.font.draw(ctx, c.sub, W / 2, 108, COL.text, { font: 'large', align: 'center' });
      } else if (c.kind === 'area') {
        AV.font.draw(ctx, c.title, W / 2, 30, COL.text, { font: 'large', align: 'center' });
        ui.divider(ctx, W / 2, 47, 70);
        if (c.sub) AV.font.draw(ctx, c.sub, W / 2, 58, COL.dim, { align: 'center', shadow: '#07060a' });
      } else if (c.kind === 'boss') {
        AV.font.draw(ctx, c.title, W / 2, 60, '#e4d8c8', { font: 'large', align: 'center' });
        if (c.sub) AV.font.draw(ctx, c.sub, W / 2, 78, COL.dim, { align: 'center' });
      } else {
        ctx.fillStyle = `rgba(4,3,6,${0.5 * a})`; ctx.fillRect(0, 76, W, 44);
        AV.font.draw(ctx, c.title, W / 2, 84, COL.text, { font: 'large', align: 'center' });
        if (c.sub) AV.font.draw(ctx, c.sub, W / 2, 104, COL.dim, { align: 'center' });
      }
      ctx.globalAlpha = 1;
    }
  };
  ui.drawToasts = function (ctx, dt) {
    for (const t of ui.toasts) t.t += dt;
    ui.toasts = ui.toasts.filter((t) => t.t < t.life);
    let y = 32;
    for (const t of ui.toasts) {
      const k = t.t / t.life;
      const a = k < 0.08 ? k / 0.08 : k > 0.8 ? (1 - k) / 0.2 : 1;
      const lines = AV.font.wrap(t.text, 250);
      const w = Math.max(...lines.map((l) => AV.font.measure(l))) + 16;
      const h = lines.length * 10 + 6;
      const x = Math.round((W - w) / 2);
      ctx.globalAlpha = a;
      ui.panel(ctx, x, y, w, h, t.kind === 'quest' ? 'parchment' : 'dark');
      lines.forEach((l, i) => AV.font.drawRich(ctx, l, W / 2 - (w - 16) / 2, y + 4 + i * 10, { color: t.kind === 'quest' ? COL.parchment : t.kind === 'item' ? COL.sel : COL.text }));
      ctx.globalAlpha = 1;
      y += h + 3;
    }
  };

  // ================================================================ menu framework
  class ListMenu {
    constructor(opts) {
      Object.assign(this, { items: [], cursor: 0, t: 0, title: '', parent: null, w: 150, onCancel: null }, opts);
    }
    visible() { return this.items.filter((i) => !i.if || i.if()); }
    update(dt) {
      this.t += dt;
      const items = this.visible();
      const dir = I.menuDir(dt);
      if (dir === 'up' || dir === 'down') {
        this.cursor = (this.cursor + (dir === 'down' ? 1 : -1) + items.length) % items.length;
        AV.audio.sfx('ui_move', { vol: 0.5 });
      }
      const it = items[this.cursor];
      if ((dir === 'left' || dir === 'right') && it && it.adjust) { it.adjust(dir === 'right' ? 1 : -1); AV.audio.sfx('ui_move', { vol: 0.5 }); }
      if (this.t > 0.12 && I.pressed('confirm') && it) {
        if (it.disabled && it.disabled()) { AV.audio.sfx('locked', { vol: 0.5 }); return; }
        AV.audio.sfx('ui_select'); it.action && it.action();
      } else if (this.t > 0.12 && (I.pressed('cancel') || (this.pauseCloses && I.pressed('pause')))) {
        AV.audio.sfx('ui_back');
        if (this.onCancel) this.onCancel(); else ui.back();
      }
    }
    draw(ctx) {
      const items = this.visible();
      const h = items.length * 13 + (this.title ? 26 : 10);
      const x = this.x != null ? this.x : Math.round((W - this.w) / 2), y = this.y != null ? this.y : Math.round((H - h) / 2);
      ui.panel(ctx, x, y, this.w, h);
      let yy = y + 7;
      if (this.title) {
        AV.font.draw(ctx, this.title, x + this.w / 2, yy, COL.ember, { align: 'center' });
        ui.divider(ctx, x + this.w / 2, yy + 10, this.w - 30);
        yy += 20;
      }
      items.forEach((it, i) => {
        const sel = i === this.cursor;
        const dis = it.disabled && it.disabled();
        if (sel) { ctx.fillStyle = 'rgba(245,154,54,0.08)'; ctx.fillRect(x + 4, yy - 2, this.w - 8, 12); ui.cursor(ctx, x + 8, yy + 1); }
        const label = typeof it.label === 'function' ? it.label() : it.label;
        AV.font.draw(ctx, label, x + 18, yy, dis ? COL.faint : sel ? COL.sel : COL.text);
        if (it.value) { const v = it.value(); AV.font.draw(ctx, v, x + this.w - 10, yy, sel ? COL.sel : COL.dim, { align: 'right' }); }
        yy += 13;
      });
      if (this.footer) AV.font.draw(ctx, this.footer, W / 2, y + h + 4, COL.dim, { align: 'center' });
    }
  }
  ui.ListMenu = ListMenu;

  ui.open = function (m) { m.parent = ui.menu; ui.menu = m; AV.audio.sfx('ui_open', { vol: 0.5 }); I.consumeAll(); };
  ui.back = function () { ui.menu = ui.menu ? ui.menu.parent : null; I.consumeAll(); if (!ui.menu && AV.game.onMenuClosed) AV.game.onMenuClosed(); };
  ui.closeAll = function () { ui.menu = null; I.consumeAll(); if (AV.game.onMenuClosed) AV.game.onMenuClosed(); };

  ui.update = function (dt) { if (ui.menu) ui.menu.update(dt); };
  ui.drawMenu = function (ctx) {
    if (!ui.menu) return;
    if (!ui.menu.noDim) ui.dim(ctx, 0.55);
    const chain = [];
    for (let m = ui.menu; m; m = m.parent) chain.unshift(m);
    // draw only the top menu (and underlying if it asks)
    if (ui.menu.drawParent && ui.menu.parent) ui.menu.parent.draw(ctx);
    ui.menu.draw(ctx);
  };

  ui.confirm = function (text, yes, no) {
    const m = new ListMenu({
      title: text, w: Math.max(150, AV.font.measure(text) + 30),
      items: [
        { label: 'Yes', action: () => { ui.back(); yes && yes(); } },
        { label: 'No', action: () => { ui.back(); no && no(); } },
      ],
    });
    m.cursor = 1;
    ui.open(m);
  };

  // ================================================================ settings
  ui.openSettings = function () {
    const st = AV.settings;
    const pct = (v) => Math.round(v * 100) + '%';
    const vol = (key) => ({
      label: { master: 'Master volume', music: 'Music', sfx: 'Sound', voice: 'Voices' }[key],
      value: () => '< ' + pct(st[key]) + ' >',
      adjust: (d) => { st[key] = U.clamp(Math.round((st[key] + d * 0.1) * 10) / 10, 0, 1); st.save(); },
      action: () => { st[key] = st[key] >= 1 ? 0 : U.clamp(st[key] + 0.1, 0, 1); st.save(); },
    });
    ui.open(new ListMenu({
      title: 'SETTINGS', w: 210,
      items: [
        vol('master'), vol('music'), vol('sfx'), vol('voice'),
        { label: 'Screen shake', value: () => (st.shake ? 'On' : 'Off'), action: () => { st.shake = !st.shake; st.save(); }, adjust: () => { st.shake = !st.shake; st.save(); } },
        { label: 'Text speed', value: () => ['Slow', 'Normal', 'Fast'][st.textSpeed], action: () => { st.textSpeed = (st.textSpeed + 1) % 3; st.save(); },
          adjust: (d) => { st.textSpeed = U.clamp(st.textSpeed + d, 0, 2); st.save(); } },
        { label: 'Fullscreen', value: () => (document.fullscreenElement ? 'On' : 'Off'), action: () => AV.game.toggleFullscreen() },
        { label: 'Controls', action: () => ui.openControls() },
        { label: 'Back', action: () => ui.back() },
      ],
    }));
  };
  ui.openControls = function () {
    const rows = [
      ['Move', 'WASD / Arrows', 'Left stick / D-pad'], ['Attack', 'J / Z / Left click', 'X'], ['Roll', 'Space / K', 'B'],
      ['Interact', 'E / Enter', 'A'], ['Tallow (heal)', 'R', 'Y'], ['Kindle', 'Q', 'RB / LB'], ['Inventory', 'Tab / I', 'Select'],
      ['Pause', 'Esc / P', 'Start'],
    ];
    ui.open({
      t: 0, parent: null,
      update(dt) { this.t += dt; if (this.t > 0.15 && (I.pressed('cancel') || I.pressed('confirm'))) { AV.audio.sfx('ui_back'); ui.back(); } },
      draw(ctx) {
        const w = 300, h = rows.length * 12 + 40, x = (W - w) / 2, y = (H - h) / 2;
        ui.panel(ctx, x, y, w, h);
        AV.font.draw(ctx, 'CONTROLS', W / 2, y + 7, COL.ember, { align: 'center' });
        ui.divider(ctx, W / 2, y + 17, w - 40);
        AV.font.draw(ctx, 'Keyboard', x + 110, y + 26, COL.dim); AV.font.draw(ctx, 'Gamepad', x + 220, y + 26, COL.dim);
        rows.forEach((r, i) => {
          const yy = y + 38 + i * 12;
          AV.font.draw(ctx, r[0], x + 12, yy, COL.text); AV.font.draw(ctx, r[1], x + 110, yy, COL.parchment); AV.font.draw(ctx, r[2], x + 220, yy, COL.parchment);
        });
      },
    });
  };

  // ================================================================ pause
  ui.openPause = function () {
    AV.audio.sfx('ui_open');
    ui.open(new ListMenu({
      title: 'PAUSED', w: 160, pauseCloses: true,
      items: [
        { label: 'Resume', action: () => ui.closeAll() },
        { label: 'Inventory', action: () => ui.openInventory() },
        { label: 'Journal', action: () => ui.openJournal() },
        { label: 'Settings', action: () => ui.openSettings() },
        { label: 'Quit to title', action: () => ui.confirm('Return to the title? Progress since your last rest is kept.', () => AV.game.quitToTitle()) },
      ],
      onCancel: () => ui.closeAll(),
    }));
  };

  // ================================================================ inventory
  function itemRows(tab) {
    if (tab === 0) return S.itemsOfKind('relic');
    if (tab === 1) return Object.keys(S.d.items).filter((id) => S.d.items[id] > 0 && AV.data.items[id] && ['key', 'lore', 'consumable'].includes(AV.data.items[id].kind)
      && !(AV.data.items[id].kind === 'key' && S.relicOn(id)));
    return S.itemsOfKind('tag');
  }
  ui.openInventory = function (tab = 0) {
    const menu = {
      tab, cursor: 0, t: 0, scroll: 0,
      update(dt) {
        this.t += dt;
        const rows = itemRows(this.tab);
        const dir = I.menuDir(dt);
        if (dir === 'left' || dir === 'right') { this.tab = (this.tab + (dir === 'right' ? 1 : -1) + 3) % 3; this.cursor = 0; this.scroll = 0; AV.audio.sfx('ui_move', { vol: 0.5 }); }
        if ((dir === 'up' || dir === 'down') && rows.length) { this.cursor = (this.cursor + (dir === 'down' ? 1 : -1) + rows.length) % rows.length; AV.audio.sfx('ui_move', { vol: 0.5 }); }
        this.cursor = Math.min(this.cursor, Math.max(0, rows.length - 1));
        if (this.cursor < this.scroll) this.scroll = this.cursor;
        if (this.cursor >= this.scroll + 10) this.scroll = this.cursor - 9;
        const id = rows[this.cursor];
        if (this.t > 0.12 && I.pressed('confirm') && id) {
          const it = AV.data.items[id];
          if (it.kind === 'relic' || id === 'maud_ring') {
            const r = S.toggleRelic(id);
            if (r === null) { AV.audio.sfx('locked'); ui.toast('You can carry the weight of only ' + S.relicSlots + ' relics.'); }
            else AV.audio.sfx(r ? 'key_item' : 'ui_back', { vol: 0.6 });
          } else if (it.read) {
            AV.audio.sfx('ui_select');
            ui.closeAll();
            AV.dlg.startPages(it.name, [].concat(it.read), { actions: it.onRead, parchment: true });
          }
        }
        if (this.t > 0.12 && (I.pressed('cancel') || I.pressed('inventory'))) { AV.audio.sfx('ui_back'); S.d.newTags = 0; this.parent ? ui.back() : ui.closeAll(); }
      },
      draw(ctx) {
        const x = 16, y = 14, w = W - 32, h = H - 28;
        ui.panel(ctx, x, y, w, h);
        const tabs = ['RELICS', 'ITEMS', 'NAMES'];
        tabs.forEach((t, i) => {
          const tx = x + 16 + i * 70;
          const sel = i === this.tab;
          AV.font.draw(ctx, t, tx, y + 7, sel ? COL.ember : COL.dim);
          if (sel) { ctx.fillStyle = COL.ember; ctx.fillRect(tx, y + 16, AV.font.measure(t), 1); }
        });
        AV.font.draw(ctx, '< ' + I.label('left') + '  ' + I.label('right') + ' >', x + w - 12, y + 7, COL.faint, { align: 'right' });
        ctx.fillStyle = '#221d27'; ctx.fillRect(x + 8, y + 20, w - 16, 1);
        const rows = itemRows(this.tab);
        const listX = x + 10, listY = y + 26, listW = 136;
        if (this.tab === 0) {
          AV.font.draw(ctx, 'Carried: ' + S.d.relics.length + ' / ' + S.relicSlots, listX, y + h - 14, COL.dim);
        }
        if (this.tab === 2) {
          AV.font.draw(ctx, 'Names carried: ' + rows.length, listX, y + h - 14, COL.ghost);
        }
        if (!rows.length) {
          const empty = ['You carry no relics.', 'Nothing of note.', 'You carry no names. Not yet.'][this.tab];
          AV.font.draw(ctx, empty, listX + 4, listY + 4, COL.faint);
        }
        rows.slice(this.scroll, this.scroll + 10).forEach((id, i0) => {
          const i = i0 + this.scroll;
          const it = AV.data.items[id];
          const yy = listY + i0 * 15;
          const sel = i === this.cursor;
          if (sel) { ctx.fillStyle = 'rgba(245,154,54,0.1)'; ctx.fillRect(listX - 2, yy - 2, listW, 15); }
          if (!AV.art.drawIcon(ctx, it.icon, listX, yy - 2)) { ctx.fillStyle = '#4a4250'; ctx.fillRect(listX + 3, yy + 1, 8, 8); }
          let name = it.name;
          if (this.tab === 2) name = name.replace(/^Tin Tag:\s*/i, '');
          const n = S.count(id);
          AV.font.draw(ctx, name.length > 22 ? name.slice(0, 21) + '…' : name, listX + 19, yy + 2, S.relicOn(id) ? COL.ember : sel ? COL.sel : COL.text);
          if (n > 1) AV.font.draw(ctx, 'x' + n, listX + listW - 6, yy + 2, COL.dim, { align: 'right' });
        });
        // detail pane
        const dx = x + 160, dw = w - 172;
        ctx.fillStyle = '#141118'; ctx.fillRect(dx - 6, y + 24, 1, h - 34);
        const id = rows[this.cursor];
        if (id) {
          const it = AV.data.items[id];
          ctx.fillStyle = '#07060a'; ctx.fillRect(dx, y + 26, 34, 34);
          ctx.save(); ctx.translate(dx + 1, y + 27); ctx.scale(2, 2); AV.art.drawIcon(ctx, it.icon, 0, 0); ctx.restore();
          AV.font.draw(ctx, it.name, dx + 40, y + 30, COL.parchment);
          const kind = { relic: 'Relic', key: 'Keepsake', lore: 'Writing', tag: 'A name', upgrade: 'Upgrade', consumable: 'Consumable' }[it.kind] || '';
          AV.font.draw(ctx, kind + (S.relicOn(id) ? ' — carried' : ''), dx + 40, y + 41, S.relicOn(id) ? COL.ember : COL.dim);
          const lines = AV.font.wrap(AV.subst(AV.itemText(id)), dw - 6);
          lines.slice(0, 11).forEach((l, i) => AV.font.drawRich(ctx, l, dx, y + 66 + i * 10, { color: COL.text }));
          const hint = it.kind === 'relic' || id === 'maud_ring' ? (S.relicOn(id) ? 'Set aside' : 'Carry') : it.read ? 'Read' : '';
          if (hint) { const kw = ui.keycap(ctx, dx, y + h - 30, I.label('confirm')); AV.font.draw(ctx, hint, dx + kw + 4, y + h - 29, COL.dim); }
        }
        // stats line
        const stats = `Health ${S.maxHp()}   Stamina ${S.maxSta()}   Tallow ${S.tallowMax()}   Blade ${S.swordDmg()}`;
        AV.font.draw(ctx, stats, x + w - 12, y + h - 14, COL.faint, { align: 'right' });
      },
    };
    ui.open(menu);
  };

  // ================================================================ journal
  ui.openJournal = function () {
    const list = () => {
      const q = Object.keys(S.d.quests).filter((id) => AV.data.quests[id] && S.d.quests[id] > 0);
      const main = q.filter((id) => id === 'main');
      const active = q.filter((id) => id !== 'main' && S.d.quests[id] !== 99);
      const done = q.filter((id) => id !== 'main' && S.d.quests[id] === 99);
      return main.concat(active, done);
    };
    ui.open({
      cursor: 0, t: 0,
      update(dt) {
        this.t += dt;
        const l = list();
        const dir = I.menuDir(dt);
        if ((dir === 'up' || dir === 'down') && l.length) { this.cursor = (this.cursor + (dir === 'down' ? 1 : -1) + l.length) % l.length; AV.audio.sfx('ui_move', { vol: 0.5 }); }
        if (this.t > 0.12 && (I.pressed('cancel') || I.pressed('confirm'))) { AV.audio.sfx('ui_back'); ui.back(); }
      },
      draw(ctx) {
        const x = 16, y = 14, w = W - 32, h = H - 28;
        ui.panel(ctx, x, y, w, h, 'parchment');
        AV.font.draw(ctx, 'JOURNAL', x + 14, y + 8, COL.ember);
        const l = list();
        if (!l.length) AV.font.draw(ctx, 'Nothing written yet.', x + 14, y + 26, COL.dim);
        l.forEach((id, i) => {
          const q = AV.data.quests[id];
          const st = S.d.quests[id];
          const yy = y + 24 + i * 12;
          const sel = i === this.cursor;
          if (sel) { ctx.fillStyle = 'rgba(245,154,54,0.1)'; ctx.fillRect(x + 8, yy - 2, 128, 12); }
          let title = q.title;
          if (id === 'main') { const ch = (AV.data.strings.chapters || {})[st]; if (ch) title = ch.title + ' — ' + ch.name; }
          AV.font.draw(ctx, title.length > 24 ? title.slice(0, 23) + '…' : title, x + 12, yy, st === 99 ? COL.faint : sel ? COL.sel : COL.parchment);
        });
        const id = l[this.cursor];
        if (id) {
          const q = AV.data.quests[id];
          const st = S.d.quests[id];
          const dx = x + 150, dw = w - 164;
          AV.font.draw(ctx, q.title, dx, y + 24, COL.parchment);
          const txt = (q.stages && (q.stages[st] || q.stages[String(st)])) || '';
          AV.font.wrap(AV.subst(txt), dw).slice(0, 14).forEach((line, i) => AV.font.drawRich(ctx, line, dx, y + 40 + i * 10, { color: st === 99 ? COL.dim : '#d8c8a8' }));
        }
      },
    });
  };

  // ================================================================ shrine
  ui.allShrines = function () {
    const out = [];
    for (const mid in AV.data.maps) {
      for (const e of AV.data.maps[mid].entities || []) {
        if (e.type === 'shrine') out.push({ id: e.id, name: e.name || 'Shrine', map: mid, x: e.x, y: e.y, region: AV.data.maps[mid].name });
      }
    }
    return out;
  };
  ui.openShrine = function (shrine) {
    const travel = () => {
      const lit = ui.allShrines().filter((s) => S.isLit(s.id) && s.id !== shrine.shrineId);
      ui.open(new ListMenu({
        title: 'TRAVEL', w: 230,
        items: lit.map((s) => ({ label: s.name, value: () => '', action: () => { ui.closeAll(); AV.game.travelToShrine(s); } }))
          .concat([{ label: 'Back', action: () => ui.back() }]),
      }));
    };
    ui.open(new ListMenu({
      title: shrine.name.toUpperCase(), w: 180,
      items: [
        { label: 'Rest', action: () => { ui.closeAll(); AV.game.rest(shrine); } },
        { label: 'Travel', disabled: () => ui.allShrines().filter((s) => S.isLit(s.id)).length < 2, action: () => travel() },
        { label: 'Leave', action: () => ui.closeAll() },
      ],
      onCancel: () => ui.closeAll(),
    }));
  };

  // ================================================================ shop
  ui.openShop = function (id) {
    const shop = AV.data.shops[id];
    if (!shop) { AV.warnOnce('Missing shop ' + id); return; }
    const stock = S.d.shop[id] || (S.d.shop[id] = {});
    const rows = () => shop.items.map((it, i) => Object.assign({ i }, it)).filter((it) => (!it.if || S.test(it.if)));
    ui.open({
      cursor: 0, t: 0,
      update(dt) {
        this.t += dt;
        const r = rows();
        const n = r.length + 1;
        const dir = I.menuDir(dt);
        if (dir === 'up' || dir === 'down') { this.cursor = (this.cursor + (dir === 'down' ? 1 : -1) + n) % n; AV.audio.sfx('ui_move', { vol: 0.5 }); }
        if (this.t > 0.12 && I.pressed('confirm')) {
          if (this.cursor >= r.length) { AV.audio.sfx('ui_back'); ui.back(); return; }
          const it = r[this.cursor];
          const sold = (stock[it.i] || 0) >= (it.stock || 1);
          if (sold) { AV.audio.sfx('locked'); return; }
          if (S.d.pennies < it.price) { AV.audio.sfx('locked'); ui.toast('Not enough eye-pennies.'); return; }
          S.d.pennies -= it.price;
          stock[it.i] = (stock[it.i] || 0) + 1;
          AV.audio.sfx('penny');
          AV.game.receiveItem(it.item, 1);
        }
        if (this.t > 0.12 && I.pressed('cancel')) { AV.audio.sfx('ui_back'); ui.back(); }
      },
      draw(ctx) {
        const x = 40, y = 24, w = W - 80, h = H - 48;
        ui.panel(ctx, x, y, w, h);
        AV.font.draw(ctx, (shop.name || 'Wares').toUpperCase(), x + 12, y + 8, COL.ember);
        const pt = String(S.d.pennies);
        AV.art.drawIcon(ctx, 'icon_penny', x + w - AV.font.measure(pt) - 30, y + 4);
        AV.font.draw(ctx, pt, x + w - 12, y + 8, COL.gold, { align: 'right' });
        ui.divider(ctx, W / 2, y + 18, w - 30);
        const r = rows();
        r.forEach((it, k) => {
          const def = AV.data.items[it.item] || { name: it.item };
          const yy = y + 28 + k * 16;
          const sel = k === this.cursor;
          const sold = (stock[it.i] || 0) >= (it.stock || 1);
          if (sel) { ctx.fillStyle = 'rgba(245,154,54,0.1)'; ctx.fillRect(x + 6, yy - 3, w - 12, 15); }
          AV.art.drawIcon(ctx, def.icon, x + 10, yy - 3);
          AV.font.draw(ctx, def.name, x + 30, yy + 1, sold ? COL.faint : sel ? COL.sel : COL.text);
          AV.font.draw(ctx, sold ? 'sold' : String(it.price), x + w - 14, yy + 1, sold ? COL.faint : S.d.pennies >= it.price ? COL.gold : COL.blood, { align: 'right' });
        });
        const by = y + 28 + r.length * 16;
        if (this.cursor === r.length) { ctx.fillStyle = 'rgba(245,154,54,0.1)'; ctx.fillRect(x + 6, by - 3, w - 12, 15); }
        AV.font.draw(ctx, 'Leave', x + 30, by + 1, this.cursor === r.length ? COL.sel : COL.dim);
        const cur = r[this.cursor];
        if (cur) {
          const lines = AV.font.wrap(AV.itemText(cur.item), w - 24);
          ctx.fillStyle = '#141118'; ctx.fillRect(x + 8, y + h - 52, w - 16, 1);
          lines.slice(0, 4).forEach((l, i) => AV.font.drawRich(ctx, l, x + 12, y + h - 46 + i * 10, { color: COL.dim }));
        }
      },
    });
  };
})(window.AV);
