// Multiple choice: the right answer plus three wrong options that are chosen to be tempting.
//  • words:    look-alike spellings (kés / kész / kis), the same part of speech and topic,
//              the word's known look-alikes, and anything you've confused with it before
//  • verbs:    the same verb in another person or tense (láttuk / láttunk / látjuk / láttátok)
//  • endings:  the same word with another ending (házban / házba / házból), wrong vowel harmony
//              (házben), forgetting to lengthen (szobaban), ignoring a stem change (lók)
//  • phrases:  hand-written wrong word orders and classic mistakes (Nem bemegyek.)
import { norm, shortEn, shuffle } from './util.js';

const ACC = { á: 'a', é: 'e', í: 'i', ó: 'o', ö: 'o', ő: 'o', ú: 'u', ü: 'u', ű: 'u' };
const plain = (ch) => ACC[ch] || ch;

// norm() runs regexes; the same strings are compared thousands of times, so remember the results.
const normCache = new Map();
function N(s) {
  let v = normCache.get(s);
  if (v === undefined) {
    v = norm(s);
    normCache.set(s, v);
  }
  return v;
}

let rowA = new Float32Array(64);
let rowB = new Float32Array(64);
/** Edit distance where accent-only differences are cheap (kerek / kerék look nearly identical). */
function dist(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  if (n + 1 > rowA.length) {
    rowA = new Float32Array(n + 1);
    rowB = new Float32Array(n + 1);
  }
  let prev = rowA;
  let cur = rowB;
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    const ai = a[i - 1];
    const pa = plain(ai);
    for (let j = 1; j <= n; j++) {
      const bj = b[j - 1];
      const sub = ai === bj ? 0 : pa === plain(bj) ? 0.35 : 1;
      const x = prev[j] + 1;
      const y = cur[j - 1] + 1;
      const z = prev[j - 1] + sub;
      cur[j] = x < y ? (x < z ? x : z) : y < z ? y : z;
    }
    const t = prev;
    prev = cur;
    cur = t;
  }
  return prev[n];
}

/** How alike two Hungarian strings look: ~0 (nothing alike) … 1.2 (identical). Shared beginnings count extra. */
export function similarity(a, b) {
  const A = N(a);
  const B = N(b);
  if (A === B) return 1.2;
  const L = Math.max(A.length, B.length) || 1;
  if (Math.abs(A.length - B.length) > Math.max(5, 0.7 * L)) return 0;
  let p = 0;
  while (p < A.length && p < B.length && plain(A[p]) === plain(B[p])) p++;
  return Math.max(0, 1 - dist(A, B) / L) + 0.25 * (p / L);
}

const FILLER = /\b(?:very|really|just|a|an|the|to|something|someone|of)\b/g;
/** The separate senses of an English gloss, simplified for comparison. */
export function senses(en) {
  return String(en)
    .toLowerCase()
    .split(';')
    .map((s) =>
      s
        .replace(/\([^)]*\)/g, ' ')
        .replace(FILLER, ' ')
        .replace(/[^a-z'\s/-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean);
}
/** True if two glosses share a sense — then they can't be used as each other's wrong answer. */
export function sameMeaning(a, b) {
  const A = new Set(senses(a));
  return senses(b).some((s) => A.has(s));
}

// ---------------------------------------------------------------- generated wrong forms

// Swapping an ending for its sibling gives a wrong-harmony or wrong-linking-vowel form.
const SWAPS = [
  ['ban', 'ben'],
  ['ból', 'ből'],
  ['ról', 'ről'],
  ['nál', 'nél'],
  ['tól', 'től'],
  ['val', 'vel'],
  ['nak', 'nek'],
  ['hoz', 'hez', 'höz'],
  ['ra', 're'],
  ['ba', 'be'],
  ['on', 'en', 'ön'],
  ['unk', 'ünk'],
  ['atok', 'etek', 'ötök'],
  ['juk', 'jük'],
  ['abb', 'ebb'],
  ['szor', 'szer', 'ször'],
  ['ás', 'és'],
  ['ság', 'ség'],
  ['ul', 'ül'],
  ['am', 'em', 'om', 'öm'],
  ['ad', 'ed', 'od', 'öd'],
];
const BACK_CASES = ['ban', 'ba', 'ból', 'on', 'ra', 'ról', 'nál', 'hoz', 'tól'];
const FRONT_CASES = ['ben', 'be', 'ből', 'en', 're', 'ről', 'nél', 'hez', 'től'];
const CASE_EN = {
  ban: 'in',
  ben: 'in',
  ba: 'into',
  be: 'into',
  ból: 'out of',
  ből: 'out of',
  on: 'on',
  en: 'on',
  ön: 'on',
  ra: 'onto',
  re: 'onto',
  ról: 'off; about',
  ről: 'off; about',
  nál: 'at; by',
  nél: 'at; by',
  hoz: 'to (towards)',
  hez: 'to (towards)',
  höz: 'to (towards)',
  tól: 'from',
  től: 'from',
};
const CASE_SKILLS = new Set(['in-ban', 'in-ba', 'in-bol', 'on-n', 'on-ra', 'on-rol', 'at-nal', 'at-hoz', 'at-tol']);

function endingOf(word, list) {
  let best = '';
  for (const e of list) if (e.length > best.length && word.endsWith(e) && word.length - e.length >= 2) best = e;
  return best;
}

function wrongForms(it) {
  const w = it.primary;
  if (/\s/.test(w)) return []; // phrases and sentences get hand-written wrong options instead
  const out = [];
  for (const g of SWAPS) {
    const e = endingOf(w, g);
    if (e) for (const x of g) if (x !== e) out.push({ text: w.slice(0, -e.length) + x, why: 'wrong ending' });
  }
  if (CASE_SKILLS.has(it.skill)) {
    const ce = endingOf(w, [...BACK_CASES, ...FRONT_CASES, 'ön', 'höz']);
    if (ce) {
      const stem = w.slice(0, -ce.length);
      for (const x of BACK_CASES.includes(ce) ? BACK_CASES : FRONT_CASES) {
        if (x !== ce) out.push({ text: stem + x, gloss: `-${x}: ${CASE_EN[x]}`, sibling: true });
      }
    }
  }
  const b = it.base;
  if (/[ae]$/.test(b) && w.length > b.length) {
    const long = b.slice(0, -1) + (b.endsWith('a') ? 'á' : 'é');
    if (w.startsWith(long)) out.push({ text: b + w.slice(long.length), why: 'the final -a/-e must lengthen' });
  }
  if (it.skill === 'plural' || it.skill === 'acc') {
    for (const x of it.skill === 'plural' ? ['k', 'ok', 'ek', 'ak'] : ['t', 'ot', 'et', 'at']) out.push({ text: b + x, why: 'wrong stem or linking vowel' });
  }
  return out;
}

// ---------------------------------------------------------------- candidate pools (cached per card)

function vocabPool(card, deck) {
  const w = card.word;
  const out = [];
  const phrase = (x) => x.pos === 'phr' || x.pos === 'int';
  for (const o of deck.words) {
    if (o === w || N(o.hu) === N(w.hu) || sameMeaning(o.en, w.en)) continue;
    let s = 3 * similarity(o.hu, w.hu);
    if (w.lookalikes && w.lookalikes.includes(o)) s += 4;
    if (o.pos === w.pos) s += 1.2;
    else if (phrase(o) !== phrase(w)) s -= 2;
    if (o.topic === w.topic) s += 0.6;
    s -= 0.2 * Math.abs(o.level - w.level);
    out.push(
      card.dir === 'hu2en'
        ? { text: shortEn(o.en), lang: 'en', gloss: o.hu, glossLang: 'hu', ref: `${o.id}>en`, s }
        : { text: o.hu, lang: 'hu', gloss: shortEn(o.en), glossLang: 'en', ref: `${o.id}>hu`, s },
    );
  }
  return out.sort((a, b) => b.s - a.s).slice(0, 40);
}

function grammarPool(card, deck) {
  const it = card.item;
  const produce = card.kind === 'conj';
  const mine = new Set(it.answers.map(norm));
  const cue = N(it.cue);
  const out = [];
  for (const o of deck.gItems) {
    if (o === it || o.answers.some((a) => mine.has(N(a))) || N(o.cue) === cue) continue;
    let s = 3 * similarity(o.primary, it.primary);
    if (o.base === it.base) s += 1.8;
    if (o.skill === it.skill) s += 0.5;
    out.push(
      produce
        ? { text: o.primary, lang: 'hu', gloss: o.cue, glossLang: 'en', ref: o.conjId, s }
        : { text: o.cue, lang: 'en', gloss: o.primary, glossLang: 'hu', ref: o.identId, s },
    );
  }
  if (produce) {
    const first = plain(N(it.primary)[0] || '');
    for (const c of deck.vCells) {
      for (const f of c.forms) {
        if (plain(N(f)[0] || '') !== first || mine.has(N(f))) continue; // verb forms only tempt if they start alike
        const sim = similarity(f, it.primary);
        if (sim >= 0.6) out.push({ text: f, lang: 'hu', gloss: c.en, glossLang: 'en', ref: c.conjId, s: 3 * sim - 0.3 });
      }
    }
    for (const x of it.wrong) out.push({ text: x, lang: 'hu', why: 'incorrect', wrong: true, s: 9 });
    for (const g of wrongForms(it)) {
      if (mine.has(N(g.text))) continue;
      out.push(
        g.sibling
          ? { text: g.text, lang: 'hu', gloss: g.gloss, glossLang: 'en', s: 1.5 + 2 * similarity(g.text, it.primary) }
          : { text: g.text, lang: 'hu', why: g.why, wrong: true, s: 2 + 2 * similarity(g.text, it.primary) },
      );
    }
  }
  return out.sort((a, b) => b.s - a.s).slice(0, 40);
}

function verbPool(card, deck) {
  const cells = deck.vCellsByVerb.get(card.verb) || [];
  const out = [];
  if (card.kind === 'conj') {
    const me = card.cell;
    const mine = new Set(card.answers);
    for (const c of cells) {
      if (c === me) continue;
      for (const f of c.forms) {
        if (mine.has(N(f))) continue;
        const s = 3 * similarity(f, me.forms[0]) + (c.par === me.par ? 0.6 : 0) + (c.i === me.i ? 0.4 : 0);
        out.push({ text: f, lang: 'hu', gloss: c.en, glossLang: 'en', ref: c.conjId, s });
      }
    }
  } else {
    const correct = new Set(card.readings.map((r) => N(r.en)));
    const form = N(card.form);
    for (const c of cells) {
      if (c.forms.some((f) => N(f) === form) || correct.has(N(c.en))) continue;
      const s = 3 * similarity(c.forms[0], card.form) + (card.readings.some((r) => r.par === c.par) ? 0.5 : 0);
      out.push({ text: c.en, lang: 'en', gloss: c.forms[0], glossLang: 'hu', ref: deck.byId.has(`r:${c.verb}:${c.forms[0]}`) ? `r:${c.verb}:${c.forms[0]}` : null, s });
    }
  }
  return out.sort((a, b) => b.s - a.s).slice(0, 40);
}

// ---------------------------------------------------------------- building the question

function rightOption(card, rand) {
  const base = { correct: true, gloss: '', ref: null };
  if (card.kind === 'vocab') {
    return card.dir === 'hu2en' ? { ...base, text: shortEn(card.word.en), lang: 'en' } : { ...base, text: card.word.hu, lang: 'hu' };
  }
  if (card.item) return card.kind === 'conj' ? { ...base, text: card.item.primary, lang: 'hu' } : { ...base, text: card.item.cue, lang: 'en' };
  if (card.kind === 'conj') return { ...base, text: card.cell.forms[0], lang: 'hu' };
  const r = card.readings[Math.floor(rand() * card.readings.length)];
  return { ...base, text: r.en, lang: 'en' };
}

/** Texts that would also be correct, so they can never appear as wrong options. */
function alsoCorrect(card) {
  if (card.kind === 'vocab') return card.dir === 'hu2en' ? [] : card.answers || [];
  if (card.item) return card.kind === 'conj' ? card.answers || [] : [card.item.cue];
  if (card.kind === 'conj') return card.answers || [];
  return card.readings.map((r) => r.en);
}

function pickWrong(cands, n, rand, blocked) {
  const out = [];
  const pool = cands.filter((c) => c.text && !blocked.has(N(c.text)));
  while (out.length < n && pool.length) {
    // Mostly the most confusable candidates, with enough randomness that options vary each time.
    const top = pool.slice(0, 10);
    const ws = top.map((c) => Math.exp((c.s - top[0].s) / 0.7));
    let r = rand() * ws.reduce((a, b) => a + b, 0);
    let k = 0;
    for (; k < top.length - 1; k++) {
      r -= ws[k];
      if (r <= 0) break;
    }
    const [c] = pool.splice(k, 1);
    const t = N(c.text);
    if (blocked.has(t)) continue;
    blocked.add(t);
    out.push({ ...c, correct: false });
  }
  return out;
}

function fallback(deck, n, lang, rand, blocked) {
  const out = [];
  for (let tries = 0; tries < 300 && out.length < n; tries++) {
    const w = deck.words[Math.floor(rand() * deck.words.length)];
    const text = lang === 'hu' ? w.hu : shortEn(w.en);
    const t = N(text);
    if (!t || blocked.has(t)) continue;
    blocked.add(t);
    out.push({ text, lang, gloss: lang === 'hu' ? shortEn(w.en) : w.hu, glossLang: lang === 'hu' ? 'en' : 'hu', correct: false, ref: null, s: 0 });
  }
  return out;
}

const cache = new Map();

/**
 * Four shuffled options for a card: [{ text, lang, correct, gloss?, why?, wrong?, ref? }].
 * `state.mix[cardId]` (texts you picked wrongly before) makes those options come back.
 */
export function buildChoices(card, deck, state, rand = Math.random) {
  let pool = cache.get(card.id);
  if (!pool) {
    pool = card.kind === 'vocab' ? vocabPool(card, deck) : card.item ? grammarPool(card, deck) : verbPool(card, deck);
    cache.set(card.id, pool);
  }
  const right = rightOption(card, rand);
  const blocked = new Set([N(right.text), ...alsoCorrect(card).map(norm)]);
  const mix = (state && state.mix && state.mix[card.id]) || {};
  const cands = pool.map((c) => (mix[N(c.text)] ? { ...c, s: c.s + 3 + mix[N(c.text)] } : c)).sort((a, b) => b.s - a.s);
  let wrong = pickWrong(cands, 3, rand, blocked);
  if (wrong.length < 3) wrong = wrong.concat(fallback(deck, 3 - wrong.length, right.lang, rand, blocked));
  return shuffle([right, ...wrong], rand);
}
