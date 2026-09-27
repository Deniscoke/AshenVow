// ASHEN VOW — persistent game state: flags, inventory, relics, quests, derived stats and the hidden hollow
(function (AV) {
  'use strict';
  const U = AV.util;

  const BASE = { hp: 10, sta: 60, tallow: 3, dmg: 2 };
  const RELIC_SLOTS = 3;

  function fresh() {
    return {
      version: 1,
      flags: {},
      items: { wren_tag: 1 },
      relics: [],
      quests: {},
      pennies: 0,
      deaths: 0,
      hollow: 0,
      kindles: 0,
      hp: BASE.hp,
      tallow: BASE.tallow,
      cinder: 0,
      map: 'crypt',
      pos: null,                 // {x, y} in pixels (continue position)
      spawn: { map: 'crypt', spawn: 'start' },   // respawn point (last shrine)
      lit: [],                   // lit shrine ids
      picked: {},                // looted pickup/corpse ids
      broken: {},                // mapId -> [cell indices]
      slain: {},                 // non-respawning enemy ids
      shop: {},                  // shopId -> {index: sold}
      seenRegions: {},
      endings: {},               // endings reached in this save
      playTime: 0,
      newTags: 0,
    };
  }

  const S = AV.state = {
    d: fresh(),
    dirty: false,               // presence refresh needed
    reset() { this.d = fresh(); this.dirty = true; },
    load(obj) { this.d = Object.assign(fresh(), obj); this.dirty = true; },

    // ---------- flags / variables
    get(name) {
      const d = this.d;
      switch (name) {
        case 'map': return AV.game && AV.game.world ? AV.game.world.id : d.map;
        case 'deaths': return d.deaths;
        case 'hollow': return d.hollow;
        case 'hollow_stage': return this.hollowStage();
        case 'tags': return this.tagCount();
        case 'pennies': return d.pennies;
        case 'kindles': return d.kindles;
        case 'chapter': return d.quests.main || 0;
        default: break;
      }
      if (name.startsWith('q_')) return d.quests[name.slice(2)] || 0;
      const v = d.flags[name];
      return v === undefined ? 0 : v;
    },
    set(name, value = 1) {
      if (name === 'hollow') { d_hollow(this, value); return; }
      if (this.d.flags[name] === value) return;
      this.d.flags[name] = value;
      this.dirty = true;
    },
    unset(name) { if (name in this.d.flags) { delete this.d.flags[name]; this.dirty = true; } },
    add(name, n) {
      if (name === 'pennies') return this.addPennies(n);
      if (name === 'hollow') return this.addHollow(n);
      const v = (+this.get(name) || 0) + n;
      this.set(name, v);
    },
    flag(name) { return !!this.d.flags[name]; },
    test(cond) { return AV.logic.test(cond, this); },

    // ---------- items
    has(id) { return (this.d.items[id] || 0) > 0; },
    count(id) { return this.d.items[id] || 0; },
    give(id, n = 1) {
      const def = AV.data.items[id];
      if (!def) AV.warnOnce('give: unknown item ' + id);
      this.d.items[id] = (this.d.items[id] || 0) + n;
      if (def && def.kind === 'tag') this.d.newTags = (this.d.newTags || 0) + n;
      if (def && def.kind === 'upgrade') this.applyUpgrade(id, n);
      this.dirty = true;
    },
    take(id, n = 1) {
      if (!this.d.items[id]) return;
      this.d.items[id] = Math.max(0, this.d.items[id] - n);
      if (!this.d.items[id]) { delete this.d.items[id]; this.d.relics = this.d.relics.filter((r) => r !== id); }
      this.dirty = true;
    },
    itemsOfKind(kind) {
      return Object.keys(this.d.items).filter((id) => this.d.items[id] > 0 && AV.data.items[id] && AV.data.items[id].kind === kind);
    },
    tagCount() { return this.itemsOfKind('tag').length; },
    addPennies(n) { this.d.pennies = Math.max(0, this.d.pennies + n); },

    // ---------- relics
    relicOn(id) { return this.d.relics.includes(id); },
    toggleRelic(id) {
      const r = this.d.relics;
      if (r.includes(id)) { this.d.relics = r.filter((x) => x !== id); return false; }
      if (r.length >= RELIC_SLOTS) return null;
      r.push(id);
      return true;
    },
    relicSlots: RELIC_SLOTS,

    // ---------- derived stats
    maxHp() { return BASE.hp + 2 * this.count('oath_ribbon'); },
    maxSta() { return BASE.sta + 15 * this.count('pilgrim_breath'); },
    tallowMax() { return BASE.tallow + this.count('tallow_stub'); },
    swordDmg() {
      return BASE.dmg + this.count('grave_iron') + this.count('stolen_ember') + (this.relicOn('maud_ring') ? 1 : 0);
    },
    applyUpgrade(id, n) {
      if (id === 'oath_ribbon') this.d.hp = Math.min(this.maxHp(), this.d.hp + 2 * n);
      if (id === 'tallow_stub') this.d.tallow = Math.min(this.tallowMax(), this.d.tallow + n);
    },

    // ---------- hollow (hidden)
    addHollow(n) { this.d.hollow = Math.max(0, this.d.hollow + n); this.dirty = true; },
    hollowStage() { const h = this.d.hollow; return h >= 16 ? 2 : h >= 8 ? 1 : 0; },

    // ---------- quests
    quest(id, stage) {
      const prev = this.d.quests[id] || 0;
      this.d.quests[id] = stage;
      this.dirty = true;
      return prev;
    },

    // ---------- shrines
    light(id) { if (!this.d.lit.includes(id)) { this.d.lit.push(id); return true; } return false; },
    isLit(id) { return this.d.lit.includes(id); },
  };
  function d_hollow(s, v) { s.d.hollow = Math.max(0, +v || 0); s.dirty = true; }

  // Settings live separately from the save
  const SETTINGS_KEY = 'ashenvow.settings';
  AV.settings = {
    master: 0.8, music: 0.7, sfx: 0.85, voice: 1, shake: true, textSpeed: 1, // 0 slow, 1 normal, 2 fast
    load() {
      try { Object.assign(this, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) { /* ignore */ }
      this.apply();
    },
    save() {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ master: this.master, music: this.music, sfx: this.sfx, voice: this.voice, shake: this.shake, textSpeed: this.textSpeed }));
      } catch (e) { /* ignore */ }
      this.apply();
    },
    apply() { if (AV.audio && AV.audio.setVolumes) AV.audio.setVolumes({ master: this.master, music: this.music, sfx: this.sfx }); },
  };

  AV.itemText = function (id) {
    const it = AV.data.items[id];
    if (!it) return '';
    if (Array.isArray(it.desc)) {
      for (const d of it.desc) if (!d.if || S.test(d.if)) return d.text;
      return '';
    }
    return it.desc || '';
  };
  AV.speakerName = function (id) {
    const sp = AV.data.speakers[id];
    if (!sp) return id === 'narrator' ? '' : id;
    if (Array.isArray(sp.name)) {
      for (const n of sp.name) if (!n.if || S.test(n.if)) return n.name;
      return '';
    }
    return sp.name || '';
  };
  AV.subst = function (text) {
    return String(text).replace(/\{\$(\w+)\}/g, (m, v) => String(S.get(v)));
  };
  AV.util.clampHp = () => { S.d.hp = U.clamp(S.d.hp, 0, S.maxHp()); };
})(window.AV);
