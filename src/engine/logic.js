// ASHEN VOW — condition expressions & action parsing (pure; shared by the game and the Node tools)
(function (AV) {
  'use strict';
  const L = AV.logic = AV.logic || {};

  // ---------------------------------------------------------------- tokenizer
  function tokenize(src) {
    const toks = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      const two = src.substr(i, 2);
      if (['&&', '||', '==', '!=', '<=', '>='].includes(two)) { toks.push({ t: 'op', v: two }); i += 2; continue; }
      if ('!<>()'.includes(ch)) { toks.push({ t: 'op', v: ch }); i++; continue; }
      if (ch === '=') { toks.push({ t: 'op', v: '==' }); i++; continue; } // tolerate single '='
      if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(src[i + 1] || ''))) {
        let j = i + 1;
        while (j < src.length && /[0-9.]/.test(src[j])) j++;
        toks.push({ t: 'num', v: parseFloat(src.slice(i, j)) }); i = j; continue;
      }
      if (ch === "'" || ch === '"') {
        let j = i + 1;
        while (j < src.length && src[j] !== ch) j++;
        toks.push({ t: 'str', v: src.slice(i + 1, j) }); i = j + 1; continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        let j = i + 1;
        while (j < src.length && /[A-Za-z0-9_:]/.test(src[j])) j++;
        toks.push({ t: 'id', v: src.slice(i, j) }); i = j; continue;
      }
      throw new Error(`Bad character '${ch}' in condition "${src}"`);
    }
    return toks;
  }

  // ---------------------------------------------------------------- parser → closure
  function parse(src) {
    const toks = tokenize(src);
    let p = 0;
    const peek = () => toks[p];
    const eat = (v) => { const t = toks[p]; if (!t || (v && t.v !== v)) throw new Error(`Expected '${v}' in "${src}"`); p++; return t; };
    const refs = new Set();

    function primary() {
      const t = peek();
      if (!t) throw new Error(`Unexpected end of condition "${src}"`);
      if (t.t === 'op' && t.v === '(') { eat('('); const e = orExpr(); eat(')'); return e; }
      if (t.t === 'num' || t.t === 'str') { p++; const v = t.v; return () => v; }
      if (t.t === 'id') {
        p++;
        const name = t.v;
        if (name === 'true') return () => 1;
        if (name === 'false') return () => 0;
        if (name.startsWith('has:')) { const item = name.slice(4); refs.add(name); return (S) => (S.has(item) ? 1 : 0); }
        refs.add(name);
        return (S) => S.get(name);
      }
      throw new Error(`Unexpected '${t.v}' in "${src}"`);
    }
    function unary() {
      const t = peek();
      if (t && t.t === 'op' && t.v === '!') { eat('!'); const e = unary(); return (S) => (truthy(e(S)) ? 0 : 1); }
      return cmp();
    }
    function cmp() {
      const a = primary();
      const t = peek();
      if (t && t.t === 'op' && ['==', '!=', '<', '<=', '>', '>='].includes(t.v)) {
        p++;
        const b = primary();
        switch (t.v) {
          case '==': return (S) => (loose(a(S)) === loose(b(S)) ? 1 : 0);
          case '!=': return (S) => (loose(a(S)) !== loose(b(S)) ? 1 : 0);
          case '<': return (S) => (num(a(S)) < num(b(S)) ? 1 : 0);
          case '<=': return (S) => (num(a(S)) <= num(b(S)) ? 1 : 0);
          case '>': return (S) => (num(a(S)) > num(b(S)) ? 1 : 0);
          case '>=': return (S) => (num(a(S)) >= num(b(S)) ? 1 : 0);
        }
      }
      return a;
    }
    function andExpr() {
      let e = unary();
      while (peek() && peek().v === '&&') { eat('&&'); const l = e, r = unary(); e = (S) => (truthy(l(S)) && truthy(r(S)) ? 1 : 0); }
      return e;
    }
    function orExpr() {
      let e = andExpr();
      while (peek() && peek().v === '||') { eat('||'); const l = e, r = andExpr(); e = (S) => (truthy(l(S)) || truthy(r(S)) ? 1 : 0); }
      return e;
    }
    const fn = orExpr();
    if (p < toks.length) throw new Error(`Trailing tokens in condition "${src}"`);
    fn.refs = refs;
    return fn;
  }
  function truthy(v) { return !!v && v !== '0'; }
  function num(v) { return typeof v === 'number' ? v : parseFloat(v) || 0; }
  function loose(v) { return typeof v === 'number' ? String(v) : v == null ? '0' : String(v); }

  const cache = {};
  L.compile = function (src) {
    if (src == null || src === '') return null;
    if (typeof src === 'function') return src;
    if (cache[src]) return cache[src];
    return (cache[src] = parse(String(src)));
  };
  // S must provide get(name) and has(itemId)
  L.test = function (cond, S) {
    if (cond == null || cond === '') return true;
    if (typeof cond === 'function') return !!cond(S);
    try { return truthy(L.compile(cond)(S)); }
    catch (e) { AV.warnOnce(e.message); return false; }
  };

  // ---------------------------------------------------------------- actions
  L.VERBS = ['set', 'unset', 'add', 'give', 'take', 'pennies', 'quest', 'chapter', 'hollow', 'heal', 'refill', 'card',
    'toast', 'sfx', 'music', 'shake', 'flash', 'fade', 'wait', 'remove', 'snuff', 'kill', 'anim', 'boss', 'ending',
    'companion', 'shop', 'teleport', 'unlock', 'dialogue', 'spawn', 'save', 'read', 'reveal'];
  L.parseAction = function (str) {
    if (typeof str === 'function') return { verb: 'fn', fn: str, args: [] };
    const s = String(str).trim();
    const i = s.indexOf(':');
    const verb = i < 0 ? s : s.slice(0, i);
    const rest = i < 0 ? '' : s.slice(i + 1);
    return { verb, rest, args: rest ? rest.split(':') : [] };
  };
})(typeof window !== 'undefined' ? window.AV : globalThis.AV);
