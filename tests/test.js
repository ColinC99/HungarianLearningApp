// Self-test: data validation, a 30-day simulated learner, and a UI smoke test.
import { buildDeck, parseVocab, parseGrammar, POS_LABEL } from '../js/deck.js';
import * as S from '../js/scheduler.js';
import { checkTyped } from '../js/check.js';
import { norm, showEn } from '../js/util.js';
import V1 from '../data/vocab-1.js';
import V2 from '../data/vocab-2.js';
import V3 from '../data/vocab-3.js';
import V4 from '../data/vocab-4.js';
import GRAMMAR from '../data/grammar.js';
import { VERBS } from '../data/verbs.js';

const out = { errors: [], warnings: [], info: {} };
const err = (m) => out.errors.push(m);
const warn = (m) => out.warnings.push(m);

// ---------------------------------------------------------------- data validation
const t0 = performance.now();
const deck = buildDeck();
out.info.buildMs = Math.round(performance.now() - t0);
out.info.counts = deck.counts;
deck.problems.forEach((p) => err(`deck: ${p}`));

const BAD_CHARS = /[õûôũÕÛÔŨ]/; // common wrong substitutes for ő / ű
const HU_OK = /^[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ\s.,!?…'’\-–/()]+$/;
const ALL_TEXT = [V1, V2, V3, V4, GRAMMAR, JSON.stringify(VERBS)].join('\n');
ALL_TEXT.split('\n').forEach((l, i) => {
  if (BAD_CHARS.test(l)) err(`wrong accent character (õ/û instead of ő/ű) on data line: ${l.trim()}`);
});

const words = [...parseVocab(V1, 'v1'), ...parseVocab(V2, 'v2'), ...parseVocab(V3, 'v3'), ...parseVocab(V4, 'v4')];
const NON_INF_VERBS = new Set(['nincs', 'sincs']);
for (const w of words) {
  if (w.nf < 3) err(`${w.src}: needs at least 3 fields: ${w.hu}`);
  if (!POS_LABEL[w.pos]) err(`${w.src}: unknown part of speech "${w.pos}" for ${w.hu}`);
  if (!w.en) err(`${w.src}: missing English for ${w.hu}`);
  if (!HU_OK.test(w.hu)) err(`${w.src}: odd characters in Hungarian "${w.hu}"`);
  if (w.hu.includes('(')) err(`${w.src}: parentheses in a non-verb headword "${w.hu}" (put extra info in the note)`);
  if (w.pos === 'v' && !NON_INF_VERBS.has(w.hu)) {
    if (!/ni$/.test(w.hu)) err(`${w.src}: verb should be an infinitive ending in -ni: ${w.hu}`);
    if (!w.form) err(`${w.src}: verb missing (3rd-person form): ${w.hu}`);
  }
}
// Same Hungarian + same part of speech twice = duplicate card id
const seenIds = new Map();
for (const w of words) {
  const id = `${w.hu}|${w.pos}`;
  if (seenIds.has(id)) err(`duplicate word ${id} (${seenIds.get(id)} and ${w.src})`);
  else seenIds.set(id, w.src);
}
// English prompts that are identical for different words make EN→HU cards ambiguous
const byEn = new Map();
for (const w of words) {
  const k = showEn(w.en).toLowerCase();
  if (!byEn.has(k)) byEn.set(k, []);
  byEn.get(k).push(`${w.hu} (${w.src})`);
}
for (const [k, list] of byEn) if (list.length > 1) err(`same English prompt "${k}" for: ${list.join(', ')}`);

// grammar
const skills = parseGrammar(GRAMMAR);
for (const s of skills) {
  if (!s.title || !s.info) err(`grammar skill ${s.id} needs a title and explanation`);
  if (!s.items.length) err(`grammar skill ${s.id} has no items`);
  const cues = new Map();
  for (const it of s.items) {
    if (it.nf < 3 || !it.base || !it.cue || !it.answer) err(`grammar ${s.id} line ${it.line}: needs base | cue | answer`);
    if (it.nf > 4) err(`grammar ${s.id} line ${it.line}: too many | separators`);
    if (!HU_OK.test(it.answer)) err(`grammar ${s.id} line ${it.line}: odd characters in "${it.answer}"`);
    const k = `${it.base}|${it.cue}`;
    if (cues.has(k)) err(`grammar ${s.id}: same base+cue twice: ${k}`);
    cues.set(k, 1);
  }
}
out.info.skills = deck.skills.map((s) => `${s.id} L${s.level}: ${s.cards.length}`);

// verbs: every infinitive must be in the vocabulary; forms must look Hungarian
for (const v of VERBS) {
  for (const k of ['pres', 'def', 'past', 'pdef', 'cond', 'cdef', 'imp', 'idef', 'lak']) {
    if (!v[k]) continue;
    for (const f of v[k].split(/[,/]/).map((x) => x.trim())) if (!/^[a-záéíóöőúüű]+$/.test(f)) err(`verb ${v.inf}.${k}: odd form "${f}"`);
  }
}

// every card renders something sensible
for (const c of deck.cards) {
  if (!c.q || !c.q.text) err(`card ${c.id} has no prompt`);
  if (!c.a || !c.a.text) err(`card ${c.id} has no answer`);
  if (c.answers && !c.answers.length) err(`card ${c.id} has an empty answer list`);
  if (c.req && !deck.byId.has(c.req)) err(`card ${c.id} requires missing ${c.req}`);
  for (const x of c.confuse || []) if (!deck.byId.has(x)) err(`card ${c.id} confuses with missing ${x}`);
}

// answer checker
const sample = deck.byId.get('w:menni|v>hu');
const checks = [
  ['menni', true],
  ['Menni!', true],
  ['megy', true],
  ['meny', false],
  ['menny', false],
];
for (const [typed, ok] of checks) {
  const r = checkTyped(typed, sample, deck);
  if (r.ok !== ok) err(`checkTyped("${typed}") expected ok=${ok}, got ${JSON.stringify(r)}`);
}
const acc = checkTyped('kerek', deck.byId.get('w:kerék|n>hu'), deck);
if (acc.kind !== 'accent') err(`accent slip not detected: ${JSON.stringify(acc)}`);
const syn = checkTyped('szép', deck.byId.get('w:gyönyörű|adj>hu'), deck);
if (syn.kind !== 'synonym') warn(`synonym not detected for szép vs gyönyörű: ${JSON.stringify(syn)}`);
const postp = deck.cards.find((c) => c.id === 'g:post:a ház előtt>p');
if (!postp || !checkTyped('ház előtt', postp, deck).ok) err('article-less answer "ház előtt" should be accepted');

// ---------------------------------------------------------------- memory model unit checks
{
  const now = Date.UTC(2026, 0, 1);
  let cs = S.gradeCard(undefined, 0, now, 0.3);
  if (!(cs.h < 0.1 && cs.w === 1)) err('first miss should give a tiny half-life');
  cs = S.gradeCard(cs, 1, now + 2 * 60e3, 0.3);
  if (!(cs.h > 0.05)) err('a correct retry should grow the half-life');
  let strong = S.gradeCard(undefined, 2, now, 0.3);
  if (strong.h !== 21 * 24) err('Easy on a new card should give 3 weeks');
  const later = S.gradeCard(strong, 1, now + 30 * S.DAY, 0.3);
  if (!(later.h > strong.h)) err('remembering after a long gap should strengthen the card');
  const lapse = S.gradeCard(later, 0, now + 31 * S.DAY, 0.3);
  if (!(lapse.h <= 24 && lapse.d > later.d)) err('a lapse should bring the card back within a day and raise difficulty');
  // A miss the model expected (low p) should hurt much less than a "shock" miss (high p).
  const base = { n: 3, c: 2, w: 1, s: 1, h: 10, d: 0.3, t: now, f: now };
  const expected = S.gradeCard(base, 0, now + 40 * S.HOUR, 0.3);
  const shock = S.gradeCard(base, 0, now + 1 * S.HOUR, 0.3);
  if (!(expected.h > shock.h)) err('expected misses should cost less than surprising misses');
}

// ---------------------------------------------------------------- 30-day simulation
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simulate({ days = 30, perSession = 40, intensity = 'challenging', mix = 'balanced', seed = 7 } = {}) {
  const rand = mulberry32(seed);
  const START = Date.UTC(2026, 10, 1, 6);
  const state = { v: 1, cards: {}, log: [], days: {}, settings: { answerMode: 'flip', intensity, mix, directions: 'both', goal: 50 } };
  // Hidden "true" memory of the simulated learner (knows lots of level 1, little of level 4).
  const truth = new Map();
  for (const c of deck.cards) {
    const lv = { 1: 0.6, 2: 0.3, 3: 0.1, 4: 0.05 }[c.level] || 0.05;
    const f = (c.dir === 'en2hu' ? 0.7 : 1) * (c.kind === 'vocab' ? 1 : 0.5);
    if (rand() < lv * f) truth.set(c.id, { h: 24 * (5 + rand() * 60), t: START - rand() * 5 * S.DAY });
  }
  // Learner model: exponential forgetting; seeing the answer after a miss relearns it (with savings);
  // a successful hard recall strengthens memory more than an easy one.
  const answer = (card, now) => {
    const s = truth.get(card.id);
    const p = s ? Math.pow(2, -(now - s.t) / S.HOUR / s.h) : 0.03;
    const ok = rand() < p;
    if (!s) truth.set(card.id, { h: 0.5, t: now });
    else {
      s.h = ok ? Math.max(s.h, (now - s.t) / S.HOUR) * (2.5 + 4 * (1 - p)) : Math.max(0.5, s.h * 0.7);
      s.t = now;
    }
    return ok ? (p > 0.95 && rand() < 0.5 ? 2 : 1) : 0;
  };
  const daily = [];
  const reasons = {};
  let immediateRepeats = 0;
  let sameGroupAdjacent = 0;
  let chooseMs = 0;
  let picks = 0;
  let maxSameCardPerSession = 0;
  for (let d = 0; d < days; d++) {
    const day = { n: 0, ok: 0, newV: 0, newG: 0, newEn2hu: 0 };
    for (const at of [8, 20]) {
      let now = START + d * S.DAY + at * S.HOUR;
      const ses = S.newSession('smart');
      let prev = null;
      const counts = {};
      for (let k = 0; k < perSession; k++) {
        const t1 = performance.now();
        const pick = S.choose(deck, state, ses, now, rand);
        chooseMs += performance.now() - t1;
        picks++;
        if (!pick) break;
        const c = pick.card;
        if (prev && prev.id === c.id) immediateRepeats++;
        if (prev && prev.group === c.group) sameGroupAdjacent++;
        counts[c.id] = (counts[c.id] || 0) + 1;
        maxSameCardPerSession = Math.max(maxSameCardPerSession, counts[c.id]);
        reasons[pick.reason.type] = (reasons[pick.reason.type] || 0) + 1;
        const g = answer(c, now);
        const old = state.cards[c.id];
        if (!old) {
          if (c.kind === 'vocab') day.newV++;
          else day.newG++;
          if (c.dir === 'en2hu') day.newEn2hu++;
        }
        state.cards[c.id] = S.gradeCard(old, g, now, c.prior);
        state.log.push([now, c.id, g, old ? 0 : 1]);
        S.afterAnswer(ses, state, c, g, rand, pick.reason.type);
        day.n++;
        if (g > 0) day.ok++;
        prev = c;
        now += 7000 + rand() * 9000;
      }
    }
    day.acc = Math.round((100 * day.ok) / Math.max(1, day.n));
    daily.push(day);
  }
  const met = Object.keys(state.cards).length;
  const mast = { learning: 0, familiar: 0, strong: 0 };
  for (const cs of Object.values(state.cards)) mast[S.mastery(cs)]++;
  const later = daily.slice(5);
  return {
    settings: `${intensity}/${mix}`,
    summary: {
      avgAccuracyAfterDay5: Math.round(later.reduce((a, x) => a + x.acc, 0) / later.length),
      avgNewPerDay: +(daily.reduce((a, x) => a + x.newV + x.newG, 0) / daily.length).toFixed(1),
      grammarShareOfNew: Math.round((100 * daily.reduce((a, x) => a + x.newG, 0)) / Math.max(1, daily.reduce((a, x) => a + x.newV + x.newG, 0))),
    },
    daily: daily.filter((_, i) => [0, 1, 2, 4, 9, 14, 19, 24, 29].includes(i)).map((x, i) => `acc ${x.acc}% · new ${x.newV}w+${x.newG}g (en→hu ${x.newEn2hu})`),
    totals: { met, mastery: mast, grammarLevel: S.grammarLevel(deck, state.cards) },
    reasons,
    immediateRepeats,
    sameGroupAdjacent,
    maxSameCardPerSession,
    avgChooseMs: +(chooseMs / picks).toFixed(2),
  };
}

const sims = [simulate(), simulate({ intensity: 'brutal', seed: 11 }), simulate({ intensity: 'relaxed', mix: 'words', seed: 3 })];
out.info.simulations = sims;
for (const s of sims) {
  if (s.immediateRepeats > 0) err(`${s.settings}: the same card was shown twice in a row ${s.immediateRepeats}×`);
  if (s.avgChooseMs > 20) warn(`${s.settings}: choosing a card is slow (${s.avgChooseMs} ms)`);
}

// Mistakes mode only shows missed cards; it must not crash on an empty history.
{
  const st = { v: 1, cards: {}, log: [], days: {}, settings: { intensity: 'challenging', mix: 'balanced', directions: 'both' } };
  const p = S.choose(deck, st, S.newSession('mistakes'), Date.now());
  if (p !== null) err('Mistakes mode with no history should return nothing');
  const g = S.choose(deck, st, S.newSession('grammar'), Date.now());
  if (!g || g.card.kind === 'vocab') err('Grammar mode from scratch should offer a grammar card');
}

// ---------------------------------------------------------------- UI smoke test (real app in an iframe)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function uiTest() {
  const frame = document.getElementById('app');
  const ui = { steps: [], pageErrors: [] };
  localStorage.clear();
  frame.src = '../index.html';
  await new Promise((r) => (frame.onload = r));
  const w = frame.contentWindow;
  w.addEventListener('error', (e) => ui.pageErrors.push(String(e.message)));
  w.addEventListener('unhandledrejection', (e) => ui.pageErrors.push(String(e.reason)));
  const $ = (sel) => w.document.querySelector(sel);
  const $$ = (sel) => [...w.document.querySelectorAll(sel)];
  for (let i = 0; i < 40 && !$('.card'); i++) await sleep(50);
  if (!$('.card')) {
    err('UI: no card rendered');
    return ui;
  }
  ui.steps.push(`first card: ${$('.q-text').textContent} [${$('.kind').textContent}]`);
  if (!/Hungarian → English/.test($('.kind').textContent)) err('UI: a new user should start with a word card');
  const grades = ['.btn.good', '.btn.missed', '.btn.easy', '.btn.good', '.btn.missed'];
  for (let i = 0; i < 40; i++) {
    $('.btn.primary.big').click();
    await sleep(5);
    if (!$('.answer')) err(`UI: answer did not appear on round ${i}`);
    $(grades[i % grades.length]).click();
    await sleep(5);
  }
  ui.steps.push(`after 40 answers, card: ${$('.q-text').textContent} · pill: ${$('.pill') ? $('.pill').textContent : '-'}`);
  ui.steps.push(`top bar: ${$('.goal').textContent}`);
  const undo = $('.icon-btn');
  if (!undo) err('UI: undo button missing');
  else {
    undo.click();
    await sleep(5);
    if (!$('.answer')) err('UI: undo should show the previous card revealed');
    $('.btn.good').click();
    await sleep(5);
  }
  for (const [i, sel] of [
    [1, '.stats'],
    [2, '.wlist'],
    [3, '.settings'],
  ]) {
    $$('.tab')[i].click();
    await sleep(30);
    if (!$(sel)) err(`UI: tab ${i} did not show ${sel}`);
  }
  // words: search
  $$('.tab')[2].click();
  await sleep(30);
  const search = $('.search');
  search.value = 'kutya';
  search.dispatchEvent(new w.Event('input'));
  await sleep(10);
  ui.steps.push(`search "kutya": ${$('.count').textContent}`);
  $('.wrow').click();
  await sleep(10);
  if (!$('.wdetail')) err('UI: word row did not expand');
  $$('.seg-ctl button')[1].click();
  await sleep(20);
  if (!$('.glist')) err('UI: grammar list missing');
  // typing mode
  $$('.tab')[3].click();
  await sleep(30);
  const typeBtn = $$('.setting')[0].querySelectorAll('button')[1];
  typeBtn.click();
  await sleep(20);
  $$('.tab')[0].click();
  await sleep(30);
  let typedOnce = false;
  for (let i = 0; i < 25; i++) {
    const input = $('#answer-input');
    if (input) {
      input.value = 'xyz';
      input.dispatchEvent(new w.Event('input'));
      $('.type-row .btn').click();
      await sleep(5);
      if (!$('.result')) err('UI: typed answer gave no result banner');
      typedOnce = true;
      $('.actions .btn').click();
    } else {
      $('.btn.primary.big').click();
      await sleep(5);
      $('.btn.good').click();
    }
    await sleep(5);
  }
  if (!typedOnce) warn('UI: never got a typeable card in 25 tries');
  // modes
  for (const m of [1, 2, 3, 0]) {
    $$('.mode')[m].click();
    await sleep(10);
  }
  ui.steps.push(`modes ok, card: ${$('.q-text') ? $('.q-text').textContent : '(empty view)'}`);
  const saved = JSON.parse(w.localStorage.getItem('szokincs:v1'));
  ui.steps.push(`saved state: ${Object.keys(saved.cards).length} cards met, ${saved.log.length} log entries`);
  // Offline support: the service worker must install and cache every asset it lists.
  try {
    const reg = await Promise.race([w.navigator.serviceWorker.ready, sleep(8000).then(() => null)]);
    if (!reg) err('service worker never became ready');
    else {
      const swText = await (await fetch('../sw.js')).text();
      const listed = (swText.match(/'\.\/[^']*'/g) || []).length;
      const keys = await w.caches.keys();
      const mine = keys.find((k) => k.startsWith('szokincs-'));
      const cached = mine ? (await (await w.caches.open(mine)).keys()).length : 0;
      ui.steps.push(`service worker ready; cache ${mine} holds ${cached} files (sw.js lists ${listed})`);
      if (cached < listed) err(`offline cache incomplete: ${cached}/${listed}`);
    }
  } catch (e) {
    err(`service worker check failed: ${e}`);
  }
  // Install manifest: parses, and every icon exists.
  try {
    const man = await (await fetch('../manifest.webmanifest')).json();
    for (const ic of man.icons) {
      const r = await fetch(`../${ic.src}`);
      if (!r.ok) err(`manifest icon missing: ${ic.src}`);
    }
    if (!man.icons.some((i) => i.purpose === 'maskable')) err('manifest needs a maskable icon for Android');
    ui.steps.push(`manifest ok: ${man.name}, ${man.icons.length} icons, display=${man.display}`);
  } catch (e) {
    err(`manifest check failed: ${e}`);
  }
  if (ui.pageErrors.length) ui.pageErrors.forEach((e) => err(`UI page error: ${e}`));
  return ui;
}

try {
  out.info.ui = await uiTest();
} catch (e) {
  err(`UI test crashed: ${e && e.stack ? e.stack : e}`);
}

out.ok = out.errors.length === 0;
document.getElementById('out').textContent = JSON.stringify(out, null, 1);
document.title = out.ok ? 'PASS' : 'FAIL';
