// ASHEN VOW — core namespace & utilities
(function (root) {
  'use strict';
  const AV = root.AV || (root.AV = {});

  AV.VERSION = '1.0.0';
  AV.W = 384;          // internal resolution
  AV.H = 216;
  AV.TILE = 16;

  // Registries (never reassign these — only add keys)
  AV.data = AV.data || {};
  const regs = ['maps', 'npcs', 'speakers', 'dialogue', 'items', 'quests', 'shops', 'endings', 'strings',
    'enemies', 'bosses'];
  for (const r of regs) AV.data[r] = AV.data[r] || {};

  // ---------- math helpers ----------
  const U = AV.util = {};
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.dist = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);
  U.angle = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
  U.sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
  U.approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));
  U.easeOut = (t) => 1 - (1 - t) * (1 - t);
  U.easeIn = (t) => t * t;
  U.easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  U.rectsOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  U.angleDiff = (a, b) => {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };

  // Deterministic PRNG (mulberry32)
  U.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.hash2 = (x, y, s = 0) => {
    let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0);
  };
  U.hashStr = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  // Shared runtime random (non-deterministic is fine for FX)
  U.rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Colour helpers
  U.hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.rgba = (hex, a) => {
    const [r, g, b] = U.hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };

  // ---------- tiny event bus ----------
  const listeners = {};
  AV.on = (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); };
  AV.emit = (ev, ...args) => { (listeners[ev] || []).forEach((fn) => fn(...args)); };

  // ---------- silent audio stub (replaced by src/engine/audio.js; the game must run without sound) ----------
  if (!AV.audio) {
    const noop = () => {};
    AV.audio = { ready: false, init: noop, sfx: noop, music: noop, ambience: noop, setVolumes: noop, text: noop, update: noop };
  }

  // ---------- logging ----------
  AV.warnOnce = (() => {
    const seen = new Set();
    return (msg) => { if (!seen.has(msg)) { seen.add(msg); console.warn('[AV]', msg); } };
  })();
})(typeof window !== 'undefined' ? window : globalThis);
