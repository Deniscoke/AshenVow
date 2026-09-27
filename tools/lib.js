// Shared helpers for the Node tools: sandbox loader, RGBA image, PNG writer. Zero dependencies.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');

function makeContext() {
  const noop = () => {};
  const ctx = {
    console, Math, JSON, Date, Array, Object, String, Number, Boolean, Map, Set, WeakMap, Promise, Symbol, Error,
    RegExp, parseInt, parseFloat, isNaN, isFinite, Uint8Array, Uint8ClampedArray, Float32Array, Int16Array,
    Uint16Array, Int32Array, Float64Array, ArrayBuffer, Infinity, NaN,
    setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop,
    requestAnimationFrame: noop,
    performance: { now: () => Date.now() },
    navigator: { getGamepads: () => [] },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    addEventListener: noop, removeEventListener: noop,
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  return ctx;
}

// Load every file listed in src/files.js. Returns { AV, errors, missing, files }.
function loadGame(opts = {}) {
  const ctx = makeContext();
  if (opts.headless) ctx.AV = { headless: true };
  const manifest = fs.readFileSync(path.join(ROOT, 'src/files.js'), 'utf8');
  vm.runInContext(manifest, ctx, { filename: 'src/files.js' });
  const files = ctx.AV_FILES.slice();
  const errors = [];
  const missing = [];
  for (const rel of files) {
    if (opts.skip && opts.skip(rel)) continue;
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) { missing.push(rel); continue; }
    const code = fs.readFileSync(abs, 'utf8');
    try {
      vm.runInContext(code, ctx, { filename: rel });
    } catch (e) {
      errors.push({ file: rel, message: e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n') : String(e) });
    }
  }
  return { AV: ctx.AV, ctx, errors, missing, files };
}

// ---------------------------------------------------------------- RGBA image
class Img {
  constructor(w, h, bg) {
    this.w = w; this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
    if (bg) this.fill(bg);
  }
  fill(rgb) { for (let i = 0; i < this.w * this.h; i++) { this.d.set([rgb[0], rgb[1], rgb[2], 255], i * 4); } }
  checker(a, b, size = 8) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = ((Math.floor(x / size) + Math.floor(y / size)) % 2) ? a : b;
      this.d.set([c[0], c[1], c[2], 255], (y * this.w + x) * 4);
    }
  }
  setPx(x, y, r, g, b, a = 255) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    if (a >= 255) { this.d[i] = r; this.d[i + 1] = g; this.d[i + 2] = b; this.d[i + 3] = 255; return; }
    const t = a / 255;
    this.d[i] = this.d[i] * (1 - t) + r * t; this.d[i + 1] = this.d[i + 1] * (1 - t) + g * t;
    this.d[i + 2] = this.d[i + 2] * (1 - t) + b * t; this.d[i + 3] = 255;
  }
  blitRGBA(rgba, w, h, x, y, flip) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const si = (j * w + (flip ? w - 1 - i : i)) * 4;
      if (rgba[si + 3] === 0) continue;
      this.setPx(x + i, y + j, rgba[si], rgba[si + 1], rgba[si + 2], rgba[si + 3]);
    }
  }
  blitGrid(grid, x, y, flip) { this.blitRGBA(grid.toRGBA(), grid.w, grid.h, x, y, flip); }
  rectOutline(x, y, w, h, rgb, a = 255) {
    for (let i = 0; i < w; i++) { this.setPx(x + i, y, ...rgb, a); this.setPx(x + i, y + h - 1, ...rgb, a); }
    for (let j = 0; j < h; j++) { this.setPx(x, y + j, ...rgb, a); this.setPx(x + w - 1, y + j, ...rgb, a); }
  }
  rectFill(x, y, w, h, rgb, a = 255) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.setPx(x + i, y + j, ...rgb, a);
  }
  scaled(n) {
    if (n === 1) return this;
    const o = new Img(this.w * n, this.h * n);
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
      const si = (Math.floor(y / n) * this.w + Math.floor(x / n)) * 4;
      o.d.set(this.d.subarray(si, si + 4), (y * o.w + x) * 4);
    }
    return o;
  }
}

// ---------------------------------------------------------------- PNG
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePNG(file, img) {
  const raw = Buffer.alloc((img.w * 4 + 1) * img.h);
  for (let y = 0; y < img.h; y++) {
    raw[y * (img.w * 4 + 1)] = 0;
    Buffer.from(img.d.buffer, img.d.byteOffset + y * img.w * 4, img.w * 4).copy(raw, y * (img.w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.w, 0); ihdr.writeUInt32BE(img.h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, png);
}

module.exports = { ROOT, loadGame, Img, writePNG };
