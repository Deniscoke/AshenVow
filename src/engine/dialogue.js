// ASHEN VOW — action scripts and the dialogue system (typewriter, portraits, choices, conditions, flags)
(function (AV) {
  'use strict';
  const U = AV.util;
  const S = AV.state;
  const I = AV.input;

  // ================================================================ action execution
  function findTarget(name, ctx) {
    if (name === 'self' || !name) return ctx && ctx.self;
    const w = AV.game.world;
    return w ? w.findNpc(name) : null;
  }

  // Executes one action. Returns a "waiter" function (dt) => done, or null for instant actions.
  function exec(str, ctx) {
    const a = AV.logic.parseAction(str);
    if (a.verb === 'fn') { const r = a.fn(ctx); return typeof r === 'function' ? r : null; }
    const [x0, x1, x2] = a.args;
    const G = AV.game;
    switch (a.verb) {
      case 'set': {
        const [k, v] = a.rest.split('=');
        let val = v === undefined ? 1 : v.trim();
        if (typeof val === 'string') { val = val.replace(/^['"]|['"]$/g, ''); if (/^-?\d+(\.\d+)?$/.test(val)) val = +val; }
        S.set(k.trim(), val);
        return null;
      }
      case 'unset': S.unset(a.rest.trim()); return null;
      case 'add': { const [k, v] = a.rest.split('='); S.add(k.trim(), +v || 0); return null; }
      case 'give': { const [id, n] = a.rest.split('*'); G.receiveItem(id.trim(), n ? +n : 1); return null; }
      case 'take': {
        const [id, n] = a.rest.split('*');
        S.take(id.trim(), n ? +n : 1);
        const it = AV.data.items[id.trim()];
        if (it) G.toast('Gave: ' + it.name);
        return null;
      }
      case 'pennies': { const n = parseInt(a.rest, 10) || 0; S.addPennies(n); if (n) G.toast((n > 0 ? '+' : '') + n + ' eye-pennies'); return null; }
      case 'quest': {
        const [id, st] = a.rest.split('=');
        const qid = id.trim(), stage = +st;
        const prev = S.quest(qid, stage);
        const q = AV.data.quests[qid];
        if (q && prev !== stage && qid !== 'main') {
          AV.audio.sfx('quest');
          G.toast(stage === 99 ? 'Completed: ' + q.title : (prev ? 'Journal: ' : 'New: ') + q.title, 'quest');
        }
        return null;
      }
      case 'chapter': {
        const n = +a.rest;
        S.quest('main', n);
        if (n >= 1 && n <= 5) AV.ui.chapterCard(n);
        G.save();
        return null;
      }
      case 'hollow': S.addHollow(parseInt(a.rest, 10) || 0); return null;
      case 'heal': S.d.hp = S.maxHp(); return null;
      case 'refill': S.d.tallow = S.tallowMax(); return null;
      case 'card': { const [t, sub] = a.rest.split('|'); AV.ui.card(t, sub || ''); return null; }
      case 'toast': G.toast(a.rest); return null;
      case 'sfx': AV.audio.sfx(x0); return null;
      case 'music': AV.audio.music(x0 === 'stop' ? null : x0, { fade: 1.5 }); G.musicOverride = x0 === 'stop' ? '__none' : x0; return null;
      case 'shake': AV.fx.shake(+x0 || 4, 0.4); return null;
      case 'flash': AV.fx.flash(a.rest || '#fff3c2', 0.25); return null;
      case 'fade': {
        const out = x0 !== 'in';
        G.fadeTo(out ? 1 : 0, 0.7);
        let t = 0;
        return (dt) => (t += dt) >= 0.75;
      }
      case 'wait': { let t = 0; const d = +x0 || 1; return (dt) => (t += dt) >= d; }
      case 'remove': {
        const ent = findTarget(x0, ctx);
        const npcId = ent && ent.npcId ? ent.npcId : (x0 !== 'self' ? x0 : null);
        if (npcId) S.set('gone_' + npcId, 1);
        if (ent && ent.fadeOut) ent.fadeOut(0.8);
        return null;
      }
      case 'snuff': case 'kill': {
        const ent = findTarget(x0, ctx);
        if (!ent) { if (x0 && x0 !== 'self') S.set('gone_' + x0, 1); return null; }
        let done = false;
        if (a.verb === 'snuff') AV.ents.snuff(ent, () => { done = true; });
        else AV.ents.kill(ent, () => { done = true; });
        return () => done;
      }
      case 'anim': {
        const ent = findTarget(x0, ctx);
        if (ent) { ent.anim = x1; ent.animT = 0; ent.baseAnim = x1; }
        return null;
      }
      case 'boss': AV.bosses.startById(x0); return null;
      case 'ending': if (ctx) ctx.__halt = true; G.startEnding(x0); return null;
      case 'companion': G.setCompanion(x0 === 'none' ? null : x0); return null;
      case 'shop': { AV.ui.openShop(x0); return () => !AV.ui.menu; }
      case 'teleport': {
        let done = false;
        G.transition(x0, x1, { onDone: () => { done = true; } });
        return () => done;
      }
      case 'unlock': {
        const w = G.world;
        const b = w && w.entities.find((e) => e instanceof AV.ents.Barrier && e.def.id === x0);
        if (b && !b.isOpen) b.open(false); else S.set('open_' + x0, 1);
        return null;
      }
      case 'dialogue': {
        const waiter = AV.dlg.start(x0, ctx);
        return waiter;
      }
      case 'spawn': {
        const w = G.world;
        if (!w) return null;
        const e = AV.createEnemy({ type: 'enemy', kind: x0, x: +x1, y: +x2, respawn: false }, w, null);
        if (e) { e.aggro = true; e.summoned = true; w.add(e); e.fadeIn(0.5); AV.fx.ash(e.x, e.y - 8, 14); }
        return null;
      }
      case 'save': G.save(); return null;
      case 'reveal': if (G.revealPlayer) G.revealPlayer(); return null;
      case 'read': {
        const it = AV.data.items[x0];
        if (!it || !it.read) return null;
        let done = false;
        AV.dlg.startPages(it.name, [].concat(it.read), { onEnd: () => { done = true; }, actions: it.onRead, parchment: true });
        return () => done;
      }
      default:
        AV.warnOnce('Unknown action: ' + str);
        return null;
    }
  }

  // ================================================================ script runner
  class Task {
    constructor(actions, ctx, onDone) {
      this.actions = [].concat(actions || []);
      this.i = 0; this.ctx = ctx || {}; this.waiter = null; this.done = false; this.onDone = onDone;
    }
    step(dt) {
      if (this.waiter) {
        if (!this.waiter(dt)) return;
        this.waiter = null;
      }
      while (this.i < this.actions.length) {
        if (this.ctx.__halt) { this.i = this.actions.length; break; }
        const act = this.actions[this.i++];
        try { this.waiter = exec(act, this.ctx); }
        catch (e) { console.error('[AV] action failed: ' + act, e); this.waiter = null; }
        if (this.waiter) { if (this.waiter(0)) { this.waiter = null; continue; } return; }
      }
      this.done = true;
      if (this.onDone) this.onDone();
    }
  }
  AV.script = {
    tasks: [],
    get blocking() { return this.tasks.some((t) => !t.done && t.blocking !== false); },
    run(actions, ctx, onDone) {
      const t = new Task(actions, ctx, onDone);
      t.step(0);
      if (!t.done) this.tasks.push(t);
      return t;
    },
    update(dt) {
      for (const t of this.tasks.slice()) if (!t.done) t.step(dt);
      this.tasks = this.tasks.filter((t) => !t.done);
    },
    clear() { this.tasks = []; },
  };
  AV.runActions = (list, ctx) => AV.script.run(list, ctx);

  // ================================================================ dialogue
  const BOX = { x: 6, y: AV.H - 66, w: AV.W - 12, h: 62 };
  const TEXT_X = 62, TEXT_W = BOX.w - TEXT_X - 10, LINE_H = 10, MAX_LINES = 4;

  class Session {
    constructor(id, def, ctx, opts) {
      this.id = id; this.def = def; this.ctx = ctx || {}; this.opts = opts || {};
      this.node = null; this.pages = []; this.page = 0; this.shown = 0; this.lines = [];
      this.choices = null; this.cursor = 0; this.task = null; this.ended = false;
      this.who = null; this.blipAcc = 0; this.pauseT = 0; this.openT = 0;
    }
  }

  const dlg = AV.dlg = {
    active: null,
    stack: [],
    get busy() { return !!dlg.active; },

    start(id, ctx) {
      const def = AV.data.dialogue[id];
      if (!def) { AV.warnOnce('Missing dialogue ' + id); return null; }
      S.set('seen_' + id, 1);
      const s = new Session(id, def, ctx);
      // chained from inside another dialogue: replace it
      if (dlg.active) dlg.finish(dlg.active, true);
      dlg.active = s;
      AV.audio.sfx('ui_open', { vol: 0.5 });
      dlg.enter(s, def.start || 'start');
      return () => s.ended;
    },
    startNpc(ent) {
      const nd = ent.nd || AV.data.npcs[ent.npcId];
      if (!nd || !nd.talk) return;
      const pick = nd.talk.find((t) => !t.if || S.test(t.if));
      if (!pick) return;
      if (ent.faceToward && AV.game.player) ent.faceToward(AV.game.player.x);
      if (pick.dialogue) dlg.start(pick.dialogue, { self: ent });
      else if (pick.text) dlg.startPages(AV.speakerName(ent.npcId), [].concat(pick.text), { speaker: ent.npcId });
    },
    startPages(title, pages, opts = {}) {
      const nodes = { p: { who: opts.speaker || '__page', text: pages.length ? pages : ['…'], do: null } };
      const def = { start: 'p', nodes, title, parchment: opts.parchment };
      const s = new Session('__pages', def, opts.ctx || {}, opts);
      if (dlg.active) dlg.finish(dlg.active, true);
      dlg.active = s;
      AV.audio.sfx('ui_open', { vol: 0.4 });
      if (opts.actions) AV.script.run(opts.actions, {});
      dlg.enter(s, 'p');
      return () => s.ended;
    },

    enter(s, nid) {
      if (s.ended) return;
      if (nid == null) return dlg.finish(s);
      const node = s.def.nodes[nid];
      if (!node) { AV.warnOnce(`Dialogue ${s.id}: missing node ${nid}`); return dlg.finish(s); }
      s.node = node; s.nodeId = nid;
      s.choices = null;
      if (node.branch) {
        const b = node.branch.find((x) => !x.if || S.test(x.if));
        return dlg.enter(s, b ? b.next : null);
      }
      const show = () => {
        if (s.ended || dlg.active !== s) return;
        const texts = node.text == null ? [] : [].concat(node.text);
        if (texts.length) {
          s.pages = texts.map((t) => AV.subst(t));
          s.page = 0;
          s.who = node.who || null;
          s.face = node.face;
          dlg.layoutPage(s);
        } else if (node.choices) {
          dlg.openChoices(s);
        } else if (node.end) dlg.finish(s);
        else dlg.enter(s, node.next);
      };
      if (node.do && node.do.length) {
        let task = null;
        task = AV.script.run(node.do, s.ctx, () => { if (s.task === task) s.task = null; show(); });
        if (!task.done) s.task = task;
      } else show();
    },
    layoutPage(s) {
      const text = s.pages[s.page];
      const width = s.who === '__page' || s.who === 'narrator' || !dlg.portraitFor(s.who) ? BOX.w - 24 : TEXT_W;
      s.lines = AV.font ? AV.font.wrap(text, width, 'small') : [text];
      if (s.lines.length > MAX_LINES + 1) AV.warnOnce(`Dialogue ${s.id} page too long (${s.lines.length} lines)`);
      s.total = s.lines.reduce((n, l) => n + (AV.font ? AV.font.strip(l).length : l.length), 0);
      s.shown = 0; s.pauseT = 0; s.openT = 0;
      if (AV.voice) AV.voice.page(s);
    },
    openChoices(s) {
      const node = s.node;
      s.choices = node.choices.filter((c) => !c.if || S.test(c.if)).map((c) => ({ c, locked: !!(c.lock && S.test(c.lock)) }));
      if (!s.choices.length) { s.choices = null; return dlg.enter(s, node.next); }
      s.cursor = s.choices.findIndex((c) => !c.locked);
      if (s.cursor < 0) s.cursor = 0;
      s.choiceT = 0;
    },
    choose(s, idx) {
      const ch = s.choices[idx];
      if (!ch || ch.locked) { AV.audio.sfx('locked', { vol: 0.5 }); return; }
      AV.audio.sfx('ui_select');
      s.choices = null;
      const c = ch.c;
      const go = () => { if (c.end) dlg.finish(s); else dlg.enter(s, c.next); };
      if (c.do && c.do.length) {
        let task = null;
        task = AV.script.run(c.do, s.ctx, () => { if (s.task === task) s.task = null; go(); });
        if (!task.done) s.task = task;
      } else go();
    },
    finish(s, replaced) {
      if (s.ended) return;
      s.ended = true;
      if (AV.voice) AV.voice.stop();
      if (dlg.active === s) dlg.active = null;
      if (s.opts && s.opts.onEnd) s.opts.onEnd();
      I.consumeAll();
      if (!replaced) AV.game.onDialogueEnd();
    },
    portraitFor(who) {
      if (!who || who === 'narrator' || who === '__page') return null;
      const sp = AV.data.speakers[who];
      if (who === 'brand') return 'brand';
      return sp && sp.portrait && AV.art.portraits[sp.portrait] ? sp.portrait : null;
    },

    update(dt) {
      const s = dlg.active;
      if (!s) return;
      s.openT += dt;
      if (s.task && !s.task.done) return;       // node actions running
      if (s.choices) {
        s.choiceT = (s.choiceT || 0) + dt;
        const dir = I.menuDir(dt);
        if (dir === 'up' || dir === 'down') {
          const n = s.choices.length;
          s.cursor = (s.cursor + (dir === 'down' ? 1 : -1) + n) % n;
          AV.audio.sfx('ui_move', { vol: 0.5 });
        }
        if (s.choiceT > 0.15 && I.pressed('confirm')) dlg.choose(s, s.cursor);
        return;
      }
      if (!s.pages.length) return;
      const speed = [28, 48, 90][AV.settings.textSpeed != null ? AV.settings.textSpeed : 1] * (I.down('confirm') && s.openT > 0.3 ? 2.2 : 1);
      if (s.shown < s.total) {
        if (s.pauseT > 0) s.pauseT -= dt;
        else {
          const before = Math.floor(s.shown);
          s.shown = Math.min(s.total, s.shown + speed * dt);
          const after = Math.floor(s.shown);
          if (after > before) {
            const plain = s.lines.map((l) => AV.font.strip(l)).join('');
            const ch = plain[after - 1];
            if (ch && /[.!?…]/.test(ch) && plain[after] === ' ') s.pauseT = 0.16;
            else if (ch === ',' || ch === ';' || ch === '—') s.pauseT = 0.06;
            s.blipAcc += after - before;
            if (s.blipAcc >= 2 && /\w/.test(ch || '') && !(AV.voice && AV.voice.playing)) {
              s.blipAcc = 0;
              const sp = AV.data.speakers[s.who];
              AV.audio.text(sp && sp.voice ? sp.voice : s.who === 'brand' ? 0.6 : 1);
            }
          }
        }
        if (I.pressed('confirm') && s.openT > 0.12) s.shown = s.total;
        return;
      }
      if (I.pressed('confirm') || (I.pressed('cancel') && s.id === '__pages')) {
        AV.audio.sfx('text', { vol: 0.3 });
        if (s.page < s.pages.length - 1) { s.page++; dlg.layoutPage(s); return; }
        const node = s.node;
        if (node.choices) dlg.openChoices(s);
        else if (node.end || !node.next) dlg.finish(s);
        else dlg.enter(s, node.next);
      }
    },

    draw(ctx) {
      const s = dlg.active;
      if (!s || (s.task && !s.task.done && !s.pages.length)) return;
      const hasText = s.pages.length > 0;
      const who = s.who;
      const portrait = dlg.portraitFor(who);
      const parchment = s.def.parchment || (who === '__page');
      const openK = Math.min(1, s.openT / 0.12);
      if (hasText) {
        const y = BOX.y + Math.round((1 - openK) * 6);
        AV.ui.panel(ctx, BOX.x, y, BOX.w, BOX.h, parchment ? 'parchment' : 'dark');
        let tx = BOX.x + 12;
        if (portrait) {
          let face = s.face;
          if (who === 'brand' && face == null) face = S.hollowStage();
          ctx.fillStyle = '#07060a';
          ctx.fillRect(BOX.x + 6, y + 6, 50, 50);
          AV.art.drawPortrait(ctx, portrait, face || 0, BOX.x + 7, y + 7);
          ctx.strokeStyle = '#4a3a1c'; ctx.lineWidth = 1;
          ctx.strokeRect(BOX.x + 6.5, y + 6.5, 49, 49);
          tx = BOX.x + TEXT_X;
        }
        // name tab
        let name = '';
        if (who === '__page') name = s.def.title || '';
        else if (who && who !== 'narrator') name = AV.speakerName(who);
        if (name) {
          const sp = AV.data.speakers[who];
          const nw = AV.font.measure(name) + 12;
          AV.ui.panel(ctx, BOX.x + (portrait ? TEXT_X - 6 : 6), y - 11, nw, 14, 'tab');
          AV.font.draw(ctx, name, BOX.x + (portrait ? TEXT_X : 12), y - 8, (sp && sp.color) || (who === '__page' ? '#e6cc9c' : '#f59a36'));
        }
        const base = who === 'narrator' ? '#a8a0a6' : parchment ? '#e6cc9c' : '#ebe5dc';
        let remaining = Math.floor(s.shown);
        const lines = s.lines;
        const ty0 = y + 8 + (lines.length < 4 ? Math.floor((4 - lines.length) * 2) : 0);
        for (let i = 0; i < lines.length; i++) {
          const plainLen = AV.font.strip(lines[i]).length;
          const n = Math.max(0, Math.min(plainLen, remaining));
          remaining -= plainLen;
          if (n <= 0 && i > 0) break;
          AV.font.drawRich(ctx, lines[i], tx, ty0 + i * LINE_H + (who === 'narrator' ? 0 : 0), { color: base, maxChars: n, shadow: '#07060a' });
        }
        // advance indicator
        if (s.shown >= s.total && !s.choices) {
          const bob = Math.floor(AV.game.time * 3) % 2;
          AV.ui.cursor(ctx, BOX.x + BOX.w - 12, BOX.y + BOX.h - 12 + bob, 'down');
        }
      }
      if (s.choices) dlg.drawChoices(ctx, s, hasText);
    },
    drawChoices(ctx, s, hasText) {
      const rows = s.choices.map((ch) => (ch.locked && ch.c.lockText ? ch.c.lockText : AV.subst(ch.c.text)));
      const w = Math.min(AV.W - 40, Math.max(120, ...rows.map((r) => AV.font.measure(r) + 26)));
      const h = rows.length * 12 + 10;
      const x = AV.W - w - 10;
      const y = (hasText ? BOX.y - 6 : AV.H - 12) - h;
      AV.ui.panel(ctx, x, y, w, h, 'dark');
      rows.forEach((r, i) => {
        const ry = y + 6 + i * 12;
        const sel = i === s.cursor;
        const ch = s.choices[i];
        if (sel) { ctx.fillStyle = 'rgba(245,154,54,0.10)'; ctx.fillRect(x + 3, ry - 2, w - 6, 12); AV.ui.cursor(ctx, x + 7, ry + 1); }
        const col = ch.locked ? '#4a4250' : sel ? '#fccf63' : '#cbc4c3';
        AV.font.drawRich(ctx, r, x + 17, ry, { color: col, shadow: '#07060a' });
        if (ch.locked && !ch.c.lockText) { ctx.fillStyle = '#4a4250'; ctx.fillRect(x + 16, ry + 4, AV.font.measure(r) + 2, 1); }
      });
    },
  };
})(window.AV);
