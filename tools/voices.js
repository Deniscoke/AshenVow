#!/usr/bin/env node
// Generate voiced dialogue with ElevenLabs.  The API key is read from the environment (or a local .env file,
// which is git-ignored) and is NEVER written into the game or the repository — only the finished .mp3 files are.
//
//   node tools/voices.js --dry                 count characters per speaker, no requests
//   node tools/voices.js                       voice everything not yet generated (resumable)
//   node tools/voices.js --only linnet,brand   only these speakers
//   node tools/voices.js --skip mound          leave a speaker silent
//   node tools/voices.js --model eleven_flash_v2_5   cheaper model (default eleven_multilingual_v2)
//   node tools/voices.js --limit 20            stop after N new lines (try a sample first)
//   node tools/voices.js --prune               delete files for lines that are no longer voiced (cut text, narration)
//
// Narration (who: 'narrator' or no speaker) is deliberately never voiced — only characters speak aloud.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ROOT, loadGame } = require('./lib');

const argv = process.argv.slice(2);
const flag = (n) => argv.includes('--' + n);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d; };
const DRY = flag('dry');
const PRUNE = flag('prune');
const ONLY = opt('only', '') ? opt('only').split(',') : null;
const SKIP = opt('skip', '') ? opt('skip').split(',') : [];
const MODEL = opt('model', 'eleven_multilingual_v2');
const LIMIT = +opt('limit', 0) || Infinity;
const CONCURRENCY = +opt('concurrency', 3);

// ElevenLabs default voices (usable with any account). Tuned per character.
const VOICES = {
  brand: { id: 'N2lVS1w4EtoT3dr4eOWO', stability: 0.45, style: 0.35 },      // Callum — husky, haunted
  linnet: { id: 'pFZP5JQG7iQjIQuC4Bku', stability: 0.5, style: 0.3 },       // Lily — dry, raspy
  snuffer: { id: 'onwK4e9ZLuTAKqWW03F9', stability: 0.7, style: 0.2 },      // Daniel — courtly, patient
  fenwick: { id: 'IKne3meq5aSn9XLyUdCD', stability: 0.35, style: 0.5 },     // Charlie — chatty peddler
  hesk: { id: 'pqHfZKP75CvOlQylNhV4', stability: 0.4, style: 0.45 },        // Bill — gruff old watchman
  mound: { id: 'nPczCjzI2devNBz1zQrb', stability: 0.75, style: 0.1 },       // Brian — slow, deep
  odo: { id: 'CwhRBWXzGAHq8TQ4Fs17', stability: 0.35, style: 0.5 },         // Roger — soldier, bitter
  anselm: { id: 'bIHbv24MWmeRgasZH58o', stability: 0.55, style: 0.25 },     // Will — gentle scholar
  mothwife: { id: 'XB0fDUnXU5powFXDhCwa', stability: 0.4, style: 0.55 },    // Charlotte — uncanny, sweet
  maud: { id: 'XrExE9yKIg1WjnnlVkGX', stability: 0.6, style: 0.2 },         // Matilda
  queen: { id: 'EXAVITQu4vr4xnSDxMaL', stability: 0.6, style: 0.35 },       // Sarah — faded, regal
  ormund: { id: 'cjVigY5qzO86Huf0OWal', stability: 0.45, style: 0.5 },      // Eric — sanctimonious
  agna: { id: 'FGY2WhTYpPnrIDTdsKH5', stability: 0.55, style: 0.25 },       // Laura
  posy: { id: 'cgSgspJ2msm6clMCkdW9', stability: 0.45, style: 0.4 },        // Jessica — childlike
  ghost_man: { id: 'iP95p4xoKVk53GoZ742B', stability: 0.55, style: 0.3 },   // Chris
  ghost_woman: { id: '9BWtsMINqrJLrRacOk9x', stability: 0.55, style: 0.3 }, // Aria
  ghost_child: { id: 'cgSgspJ2msm6clMCkdW9', stability: 0.5, style: 0.35 },
  ghost_soldier: { id: 'nPczCjzI2devNBz1zQrb', stability: 0.5, style: 0.35 }, // Brian (deep)
  ghost_monk: { id: 'SAz9YHcvj6GT2YYXdXww', stability: 0.6, style: 0.2 },   // River
};

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  const envf = path.join(ROOT, '.env');
  if (fs.existsSync(envf)) {
    const m = fs.readFileSync(envf, 'utf8').match(/^ELEVENLABS_API_KEY\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^['"]|['"]$/g, '');
  }
  return null;
}

const { AV } = loadGame({ headless: true });
const strip = (t) => (AV.font ? AV.font.strip(t) : t.replace(/\{[a-z/]\}/g, ''));

function voiceFor(who) {
  if (!who || who === 'narrator' || who === '__page') return null;
  if (VOICES[who]) return who;
  const sp = AV.data.speakers[who];
  const p = sp && sp.portrait;
  if (p && VOICES[p]) return p;                 // region ghosts borrow the generic ghost voices
  if (p && /^ghost/.test(p)) return 'ghost_man';
  return null;
}

// Collect every voiced page of every dialogue (narration and live-number pages are left out)
const voiced = [];
for (const [did, d] of Object.entries(AV.data.dialogue)) {
  for (const [nid, n] of Object.entries(d.nodes || {})) {
    const pages = n.text == null ? [] : [].concat(n.text);
    pages.forEach((t, i) => {
      if (typeof t !== 'string' || /\{\$/.test(t)) return;   // pages with live numbers stay unvoiced
      const text = strip(t).replace(/\s+/g, ' ').trim();
      if (!text || /^[….\s]+$/.test(text)) return;          // silences stay silent
      const who = n.who || 'narrator';
      const v = voiceFor(who);
      if (!v) return;
      voiced.push({ key: `${did}|${nid}|${i}`, who, voice: v, text });
    });
  }
}
const voicedKeys = new Set(voiced.map((l) => l.key));
const lines = voiced.filter((l) => !(ONLY && !ONLY.includes(l.who) && !ONLY.includes(l.voice))
  && !SKIP.includes(l.who) && !SKIP.includes(l.voice));

const OUT = path.join(ROOT, 'assets', 'voice');
const INDEX = path.join(OUT, 'index.json');
const index = fs.existsSync(INDEX) ? JSON.parse(fs.readFileSync(INDEX, 'utf8')) : {};
const hash = (l) => crypto.createHash('sha1').update(l.voice + '|' + MODEL + '|' + l.text).digest('hex').slice(0, 10);
const fileFor = (l) => l.key.replace(/[^a-z0-9_]+/gi, '_') + '.mp3';

const todo = lines.filter((l) => !(index[l.key] && index[l.key].hash === hash(l) && fs.existsSync(path.join(OUT, index[l.key].file))));
const stale = Object.keys(index).filter((k) => !voicedKeys.has(k));

const chars = {};
for (const l of lines) chars[l.who] = (chars[l.who] || 0) + l.text.length;
const todoChars = todo.reduce((n, l) => n + l.text.length, 0);
console.log(`lines ${lines.length}, to generate ${todo.length} (${todoChars} characters, model ${MODEL}), stale ${stale.length}`);
if (DRY) {
  console.log(Object.entries(chars).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  '));
  process.exit(0);
}

if (PRUNE) {
  for (const k of stale) {
    const f = path.join(OUT, index[k].file);
    if (fs.existsSync(f)) fs.unlinkSync(f);
    delete index[k];
  }
  console.log(`pruned ${stale.length} lines that are no longer voiced`);
}
if (!todo.length) { writeManifest(); console.log('nothing to generate'); process.exit(0); }

const KEY = apiKey();
if (!KEY) { console.error('Set ELEVENLABS_API_KEY in the environment or in a .env file (never commit it).'); process.exit(1); }

function writeManifest() {
  const map = {};
  for (const [k, v] of Object.entries(index)) if (voicedKeys.has(k)) map[k] = 'assets/voice/' + v.file;
  fs.writeFileSync(INDEX, JSON.stringify(index, null, 0));
  fs.writeFileSync(path.join(OUT, 'manifest.js'),
    '// Generated by tools/voices.js - maps dialogue pages to voice files.\nwindow.AV_VOICE = ' + JSON.stringify(map) + ';\n');
}

async function tts(l) {
  const v = VOICES[l.voice];
  const body = {
    text: l.text, model_id: MODEL,
    voice_settings: { stability: v.stability, similarity_boost: 0.8, style: v.style, use_speaker_boost: true },
  };
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.id}?output_format=mp3_22050_32`, {
      method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(body),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const txt = await res.text();
    if (res.status === 401 || res.status === 403 || /quota|credits/i.test(txt)) throw new Error(`${res.status}: ${txt.slice(0, 300)}`);
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));   // 429 / 5xx: back off and retry
  }
  throw new Error('gave up after retries');
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let done = 0, failed = 0, stop = false;
  const queue = todo.slice(0, LIMIT);
  async function worker() {
    while (queue.length && !stop) {
      const l = queue.shift();
      try {
        const mp3 = await tts(l);
        const file = fileFor(l);
        fs.writeFileSync(path.join(OUT, file), mp3);
        index[l.key] = { file, hash: hash(l), who: l.who };
        done++;
        if (done % 10 === 0) { writeManifest(); console.log(`  ${done}/${queue.length + done} …`); }
      } catch (e) {
        failed++;
        console.error(`  ${l.key}: ${e.message}`);
        if (/^40[13]|quota|credits/i.test(e.message)) stop = true;
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  writeManifest();
  console.log(`done: ${done} generated, ${failed} failed${stop ? ' (stopped: key permission or quota)' : ''}`);
  process.exit(failed && !done ? 1 : 0);
})();
