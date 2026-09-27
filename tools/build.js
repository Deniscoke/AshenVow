#!/usr/bin/env node
// Copy the playable game into dist/ (what Vercel / itch.io serve). No transpiling: the game is plain JS.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist');

fs.rmSync(OUT, { recursive: true, force: true });
for (const p of ['index.html', 'manifest.webmanifest', 'src', 'assets']) {
  fs.cpSync(path.join(ROOT, p), path.join(OUT, p), { recursive: true });
}
let n = 0;
(function count(d) { for (const f of fs.readdirSync(d)) { const q = path.join(d, f); if (fs.statSync(q).isDirectory()) count(q); else n++; } })(OUT);
console.log(`dist/ ready (${n} files)`);
