// ASHEN VOW — particles, lighting, weather, screen shake, flashes, floating text
(function (AV) {
  'use strict';
  const U = AV.util;
  const W = AV.W, H = AV.H;

  const fx = AV.fx = {
    parts: [],
    texts: [],
    lights: [],      // dynamic lights registered this frame
    shakeT: 0, shakeMag: 0,
    flashT: 0, flashMax: 0, flashColor: '#fff3c2',
    vignetteRed: 0,
    weather: [],
    fogT: 0,
  };
  const MAX_PARTS = 900;

  // ---------------------------------------------------------------- particles
  fx.spawn = function (p) {
    if (fx.parts.length >= MAX_PARTS) fx.parts.shift();
    const q = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, life: 1, t: 0, size: 1, color: '#a8a0a6', g: 0, drag: 0,
      alpha: 1, fade: true, glow: false, screen: false, z: 0, vz: 0 }, p);
    fx.parts.push(q);
    return q;
  };
  fx.burst = function (x, y, n, opt = {}) {
    for (let i = 0; i < n; i++) {
      const a = opt.angle != null ? opt.angle + U.rand(-(opt.spread || Math.PI), opt.spread || Math.PI) : U.rand(Math.PI * 2);
      const sp = U.rand(opt.speedMin || 20, opt.speed || 60);
      fx.spawn({
        x: x + U.rand(-(opt.r || 2), opt.r || 2), y: y + U.rand(-(opt.r || 2), opt.r || 2),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opt.up || 0),
        life: U.rand(opt.lifeMin || 0.3, opt.life || 0.8), size: opt.size || (Math.random() < 0.3 ? 2 : 1),
        color: Array.isArray(opt.color) ? U.pick(opt.color) : (opt.color || '#a8a0a6'),
        g: opt.g || 0, drag: opt.drag != null ? opt.drag : 2, glow: !!opt.glow,
      });
    }
  };
  fx.ash = (x, y, n = 10, opt = {}) => fx.burst(x, y, n, Object.assign({ color: ['#a8a0a6', '#857c86', '#cbc4c3', '#655c69'], speed: 50, up: 10, g: -8, life: 1.1 }, opt));
  fx.embers = (x, y, n = 8, opt = {}) => fx.burst(x, y, n, Object.assign({ color: ['#f59a36', '#e2621f', '#fccf63'], speed: 45, up: 25, g: -30, life: 0.9, glow: true }, opt));
  fx.sparks = (x, y, n = 6, angle) => fx.burst(x, y, n, { color: ['#fff3c2', '#fccf63', '#cbc4c3'], speed: 110, speedMin: 50, angle, spread: angle != null ? 0.8 : Math.PI, life: 0.25, lifeMin: 0.1, drag: 6, glow: true });
  fx.ghostly = (x, y, n = 8) => fx.burst(x, y, n, { color: ['#b9d6d3', '#e4f4ef', '#82a8ad'], speed: 25, up: 20, g: -20, life: 1.4, glow: true });
  fx.splash = (x, y) => fx.burst(x, y, 6, { color: ['#82a8ad', '#b9d6d3', '#537a86'], speed: 40, up: 30, g: 140, life: 0.4, drag: 1 });

  // ---------------------------------------------------------------- floating text
  fx.text = function (x, y, text, opt = {}) {
    fx.texts.push({ x, y, text, t: 0, life: opt.life || 2.2, color: opt.color || '#cbc4c3', rise: opt.rise != null ? opt.rise : 10,
      screen: !!opt.screen, font: opt.font || 'small', align: 'center' });
  };

  // ---------------------------------------------------------------- shake & flash
  fx.shake = function (mag = 3, t = 0.25) {
    if (AV.settings && AV.settings.shake === false) mag *= 0.25;
    if (mag >= fx.shakeMag * (fx.shakeT > 0 ? 1 : 0)) { fx.shakeMag = mag; }
    fx.shakeT = Math.max(fx.shakeT, t);
  };
  fx.flash = function (color = '#fff3c2', t = 0.15) { fx.flashColor = color; fx.flashT = t; fx.flashMax = t; };
  fx.hurtVignette = () => { fx.vignetteRed = 0.6; };
  fx.shakeOffset = function () {
    if (fx.shakeT <= 0) return { x: 0, y: 0 };
    const m = fx.shakeMag * Math.min(1, fx.shakeT / 0.2);
    return { x: Math.round(U.rand(-m, m)), y: Math.round(U.rand(-m, m)) };
  };

  // ---------------------------------------------------------------- weather
  fx.setWeather = function (w) {
    fx.weather = !w || w === 'none' ? [] : Array.isArray(w) ? w.slice() : [w];
    fx.parts = fx.parts.filter((p) => !p.weather);
    const amb = [];
    if (fx.weather.includes('rain')) amb.push('rain');
    if (fx.weather.includes('ash') || fx.weather.includes('fog')) amb.push('wind');
    if (fx.weather.includes('embers')) amb.push('fire');
    if (AV.audio && AV.audio.ambience) AV.audio.ambience(amb);
  };

  function weatherTick(dt, cam) {
    const w = fx.weather;
    if (!w.length) return;
    const count = (k) => fx.parts.reduce((n, p) => n + (p.weather === k ? 1 : 0), 0);
    if (w.includes('ash')) {
      const n = count('ash');
      for (let i = n; i < 70; i++) {
        fx.spawn({ weather: 'ash', x: cam.x + U.rand(-20, W + 20), y: cam.y + U.rand(-20, H), vx: U.rand(-6, 4), vy: U.rand(6, 14),
          life: U.rand(5, 9), t: U.rand(0, 3), size: Math.random() < 0.25 ? 2 : 1, color: U.pick(['#857c86', '#a8a0a6', '#cbc4c3']),
          alpha: U.rand(0.35, 0.8), sway: U.rand(0, 6) });
      }
    }
    if (w.includes('embers')) {
      const n = count('embers');
      for (let i = n; i < 40; i++) {
        fx.spawn({ weather: 'embers', x: cam.x + U.rand(-10, W + 10), y: cam.y + U.rand(0, H + 30), vx: U.rand(-5, 8), vy: U.rand(-18, -8),
          life: U.rand(3, 6), t: U.rand(0, 2), size: 1, color: U.pick(['#f59a36', '#e2621f', '#fccf63']), alpha: U.rand(0.5, 1), glow: true, sway: U.rand(2, 8) });
      }
    }
    if (w.includes('rain')) {
      const n = count('rain');
      for (let i = n; i < 110; i++) {
        fx.spawn({ weather: 'rain', screen: true, x: U.rand(-40, W + 20), y: U.rand(-H, 0), vx: 35, vy: U.rand(220, 290),
          life: U.rand(0.8, 1.4), size: 1, color: '#82a8ad', alpha: U.rand(0.25, 0.5), streak: true });
      }
    }
    if (w.includes('fog') || w.includes('motes')) {
      const n = count('motes');
      for (let i = n; i < 18; i++) {
        fx.spawn({ weather: 'motes', x: cam.x + U.rand(0, W), y: cam.y + U.rand(0, H), vx: U.rand(-4, 4), vy: U.rand(-4, 2),
          life: U.rand(4, 8), size: 1, color: U.pick(['#b9d6d3', '#e4f4ef', '#97a070']), alpha: 0.7, glow: true, sway: U.rand(3, 9), pulse: true });
      }
    }
  }

  // ---------------------------------------------------------------- update
  fx.update = function (dt, cam) {
    fx.shakeT = Math.max(0, fx.shakeT - dt);
    fx.flashT = Math.max(0, fx.flashT - dt);
    fx.vignetteRed = Math.max(0, fx.vignetteRed - dt * 1.4);
    fx.fogT += dt;
    if (cam) weatherTick(dt, cam);
    for (let i = fx.parts.length - 1; i >= 0; i--) {
      const p = fx.parts[i];
      p.t += dt;
      if (p.t >= p.life) { fx.parts.splice(i, 1); continue; }
      if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; }
      p.vy += p.g * dt;
      p.x += (p.vx + (p.sway ? Math.sin(p.t * 1.7 + p.sway) * p.sway : 0)) * dt;
      p.y += p.vy * dt;
      if (p.weather === 'rain' && p.screen && p.y > H * U.rand(0.3, 1)) {
        // splash & recycle
        if (Math.random() < 0.3) fx.spawn({ weather: 'rainsplash', screen: true, x: p.x, y: p.y, vx: 0, vy: 0, life: 0.12, size: 1, color: '#b9d6d3', alpha: 0.5 });
        fx.parts.splice(i, 1);
      }
    }
    for (let i = fx.texts.length - 1; i >= 0; i--) {
      const t = fx.texts[i];
      t.t += dt;
      if (t.t >= t.life) fx.texts.splice(i, 1);
    }
  };

  fx.clearTransient = function () { fx.parts = fx.parts.filter((p) => p.weather && p.weather !== 'rainsplash'); fx.texts = []; };

  // ---------------------------------------------------------------- draw particles (world + screen)
  fx.drawParts = function (ctx, cam, screenPass) {
    for (const p of fx.parts) {
      if (!!p.screen !== !!screenPass) continue;
      const k = p.t / p.life;
      let a = p.alpha * (p.fade ? (k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.6) / 0.4)) : 1);
      if (p.pulse) a *= 0.5 + 0.5 * Math.sin(p.t * 3 + p.x);
      if (a <= 0.02) continue;
      const x = Math.round(p.screen ? p.x : p.x - cam.x), y = Math.round(p.screen ? p.y : p.y - cam.y - p.z);
      if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.streak) ctx.fillRect(x, y, 1, 4);
      else ctx.fillRect(x, y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  };
  fx.drawGlowParts = function (ctx, cam) {
    // additive halo for glowing particles
    ctx.globalCompositeOperation = 'lighter';
    for (const p of fx.parts) {
      if (!p.glow || p.screen) continue;
      const k = p.t / p.life;
      const a = p.alpha * (1 - k) * 0.35;
      if (a <= 0.02) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - cam.x) - 1, Math.round(p.y - cam.y - p.z) - 1, 3, 3);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  fx.drawTexts = function (ctx, cam) {
    if (!AV.font) return;
    for (const t of fx.texts) {
      const k = t.t / t.life;
      const a = k < 0.12 ? k / 0.12 : k > 0.75 ? (1 - k) / 0.25 : 1;
      const x = t.screen ? t.x : t.x - cam.x, y = (t.screen ? t.y : t.y - cam.y) - t.rise * k;
      AV.font.draw(ctx, t.text, Math.round(x), Math.round(y), t.color, { align: 'center', alpha: a, shadow: '#07060a' });
    }
  };

  // ---------------------------------------------------------------- lighting
  const LS = 2; // light buffer downscale (chunky pixel light)
  let lightCv = null, lightCtx = null, glowCv = null, glowCtx = null;
  function ensureLight() {
    if (lightCv) return;
    lightCv = document.createElement('canvas'); lightCv.width = W / LS; lightCv.height = H / LS;
    lightCtx = lightCv.getContext('2d');
    glowCv = document.createElement('canvas'); glowCv.width = W / LS; glowCv.height = H / LS;
    glowCtx = glowCv.getContext('2d');
  }
  fx.addLight = function (x, y, r, color = '#f59a36', intensity = 1, flicker = 0, glow) {
    fx.lights.push({ x, y, r, color, intensity, flicker, glow });
  };
  fx.drawLighting = function (ctx, cam, ambient, ambientColor, staticLights, time) {
    ensureLight();
    const lc = lightCtx, gc = glowCtx;
    lc.globalCompositeOperation = 'source-over';
    lc.clearRect(0, 0, lightCv.width, lightCv.height);
    lc.fillStyle = U.rgba(ambientColor || '#0c0a14', U.clamp(ambient, 0, 0.97));
    lc.fillRect(0, 0, lightCv.width, lightCv.height);
    gc.clearRect(0, 0, glowCv.width, glowCv.height);
    const all = staticLights ? staticLights.concat(fx.lights) : fx.lights;
    lc.globalCompositeOperation = 'destination-out';
    gc.globalCompositeOperation = 'lighter';
    for (const L of all) {
      const sx = (L.x - cam.x) / LS, sy = (L.y - cam.y) / LS;
      let r = (L.r || 48) / LS;
      if (L.flicker) r *= 1 + (Math.sin(time * 13 + L.x * 0.7) * 0.5 + Math.sin(time * 7.3 + L.y) * 0.5) * L.flicker * 0.5;
      if (sx < -r || sy < -r || sx > lightCv.width + r || sy > lightCv.height + r) continue;
      const it = U.clamp(L.intensity != null ? L.intensity : 1, 0, 1.5);
      const g1 = lc.createRadialGradient(sx, sy, 0, sx, sy, r);
      g1.addColorStop(0, `rgba(0,0,0,${Math.min(1, it)})`);
      g1.addColorStop(0.55, `rgba(0,0,0,${Math.min(1, it) * 0.55})`);
      g1.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = g1;
      lc.fillRect(sx - r, sy - r, r * 2, r * 2);
      if (L.color) {
        const [cr, cg, cb] = U.hexToRgb(L.color);
        const g2 = gc.createRadialGradient(sx, sy, 0, sx, sy, r * 0.9);
        g2.addColorStop(0, `rgba(${cr},${cg},${cb},${(L.glow != null ? L.glow : 0.2) * it})`);
        g2.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        gc.fillStyle = g2;
        gc.fillRect(sx - r, sy - r, r * 2, r * 2);
      }
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(lightCv, 0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glowCv, 0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  };

  // ---------------------------------------------------------------- fog & vignette overlays (screen space)
  let fogCv = null;
  function buildFog() {
    fogCv = document.createElement('canvas');
    fogCv.width = 256; fogCv.height = 128;
    const c = fogCv.getContext('2d');
    const img = c.createImageData(256, 128);
    const R = U.rng(1234);
    // value noise, tileable
    const gw = 16, gh = 8, grid = [];
    for (let i = 0; i < gw * gh; i++) grid.push(R());
    const at = (x, y) => grid[((y % gh) + gh) % gh * gw + ((x % gw) + gw) % gw];
    for (let y = 0; y < 128; y++) for (let x = 0; x < 256; x++) {
      const fx0 = x / 16, fy0 = y / 16;
      const x0 = Math.floor(fx0), y0 = Math.floor(fy0);
      const tx = U.easeInOut(fx0 - x0), ty = U.easeInOut(fy0 - y0);
      const v = U.lerp(U.lerp(at(x0, y0), at(x0 + 1, y0), tx), U.lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), tx), ty);
      const i = (y * 256 + x) * 4;
      img.data[i] = 185; img.data[i + 1] = 196; img.data[i + 2] = 196;
      img.data[i + 3] = Math.max(0, (v - 0.45) * 2) * 150;
    }
    c.putImageData(img, 0, 0);
  }
  fx.drawFog = function (ctx, cam, strength = 1) {
    if (!fogCv) buildFog();
    const t = fx.fogT;
    ctx.globalAlpha = 0.35 * strength;
    for (let layer = 0; layer < 2; layer++) {
      const sp = layer ? 9 : 5, par = layer ? 0.6 : 0.3;
      const ox = -(((cam.x * par + t * sp) % 256) + 256) % 256;
      const oy = -(((cam.y * par + layer * 40) % 128) + 128) % 128;
      for (let y = oy; y < H; y += 128) for (let x = ox; x < W; x += 256) ctx.drawImage(fogCv, Math.round(x), Math.round(y));
      ctx.globalAlpha = 0.22 * strength;
    }
    ctx.globalAlpha = 1;
  };

  let vigCv = null;
  fx.drawVignette = function (ctx, strength = 1) {
    if (!vigCv) {
      vigCv = document.createElement('canvas'); vigCv.width = W; vigCv.height = H;
      const c = vigCv.getContext('2d');
      const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(4,3,6,0.75)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = strength;
    ctx.drawImage(vigCv, 0, 0);
    ctx.globalAlpha = 1;
    if (fx.vignetteRed > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.6);
      g.addColorStop(0, 'rgba(120,20,30,0)');
      g.addColorStop(1, `rgba(120,20,30,${0.55 * fx.vignetteRed})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (fx.flashT > 0) {
      ctx.globalAlpha = (fx.flashT / fx.flashMax) * 0.6;
      ctx.fillStyle = fx.flashColor; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  };
})(window.AV);
