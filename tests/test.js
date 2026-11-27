// Self-test: data validation, multiple-choice quality, a 30-day simulated learner, and a UI smoke test.
import { buildDeck, parseVocab, parseGrammar, POS_LABEL } from '../js/deck.js';
import * as S from '../js/scheduler.js';
import { buildChoices } from '../js/choices.js';
import { checkTyped } from '../js/check.js';
import { norm, showEn } from '../js/util.js';
import V1 from '../data/vocab-1.js';
import V2 from '../data/vocab-2.js';
import V3 from '../data/vocab-3.js';
import V4 from '../data/vocab-4.js';
import V5 from '../data/vocab-5.js';
import V6 from '../data/vocab-6.js';
import GRAMMAR from '../data/grammar.js';
import { VERBS } from '../data/verbs.js';

const out = { errors: [], warnings: [], info: {} };
const err = (m) => out.errors.push(m);
const warn = (m) => out.warnings.push(m);

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- data validation
const t0 = performance.now();
const deck = buildDeck();
out.info.buildMs = Math.round(performance.now() - t0);
out.info.counts = deck.counts;
deck.problems.forEach((p) => err(`deck: ${p}`));

const BAD_CHARS = /[õûôũÕÛÔŨ]/; // common wrong substitutes for ő / ű
const HU_OK = /^[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ\s.,!?…'’\-–/()]+$/;
const ALL_TEXT = [V1, V2, V3, V4, V5, V6, GRAMMAR, JSON.stringify(VERBS)].join('\n');
ALL_TEXT.split('\n').forEach((l) => {
  if (BAD_CHARS.test(l)) err(`wrong accent character (õ/û instead of ő/ű) on data line: ${l.trim()}`);
});

const words = [V1, V2, V3, V4, V5, V6].flatMap((t, k) => parseVocab(t, `v${k + 1}`));
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
out.info.wordsPerLevel = Object.fromEntries(Object.entries(deck.wordIdsByLevel).map(([L, ids]) => [L, ids.length]));

// grammar
const skills = parseGrammar(GRAMMAR);
for (const s of skills) {
  if (!s.title || !s.info) err(`grammar skill ${s.id} needs a title and explanation`);
  if (!s.items.length) err(`grammar skill ${s.id} has no items`);
  const cues = new Map();
  for (const it of s.items) {
    if (it.nf < 3 || !it.base || !it.cue || !it.answer) err(`grammar ${s.id} line ${it.line}: needs base | cue | answer`);
    if (it.nf > 5) err(`grammar ${s.id} line ${it.line}: too many | separators`);
    if (!HU_OK.test(it.answer)) err(`grammar ${s.id} line ${it.line}: odd characters in "${it.answer}"`);
    const answers = it.answer.split('/').map((x) => norm(x));
    for (const w of it.wrong) if (answers.includes(norm(w))) err(`grammar ${s.id} line ${it.line}: wrong option "${w}" equals the answer`);
    if (it.wrong.length && it.wrong.length < 3) warn(`grammar ${s.id} line ${it.line}: only ${it.wrong.length} hand-written wrong options`);
    const k = `${it.base}|${it.cue}`;
    if (cues.has(k)) err(`grammar ${s.id}: same base+cue twice: ${k}`);
    cues.set(k, 1);
  }
}
out.info.skills = deck.skills.map((s) => `${s.id} L${s.level}${s.after.length ? ` after ${s.after.join('+')}` : ''}: ${s.cards.length}`);

// verbs: forms must look Hungarian
for (const v of VERBS) {
  for (const k of ['pres', 'def', 'past', 'pdef', 'cond', 'cdef', 'imp', 'idef', 'lak', 'subj', 'kell', 'pcond']) {
    if (!v[k]) continue;
    for (const f of v[k].split(/[,/]/).map((x) => x.trim())) if (!/^[a-záéíóöőúüű]+( [a-záéíóöőúüű]+)*$/.test(f)) err(`verb ${v.inf}.${k}: odd form "${f}"`);
  }
}

// every card renders something sensible
for (const c of deck.cards) {
  if (!c.q || !c.q.text) err(`card ${c.id} has no prompt`);
  if (!c.a || !c.a.text) err(`card ${c.id} has no answer`);
  if (c.answers && !c.answers.length) err(`card ${c.id} has an empty answer list`);
  if (c.req && !deck.byId.has(c.req)) err(`card ${c.id} requires missing ${c.req}`);
  for (const x of c.confuse || []) if (!deck.byId.has(x)) err(`card ${c.id} confuses with missing ${x}`);
  if (!c.level || c.level > 6) err(`card ${c.id} has odd level ${c.level}`);
}

// answer checker (typing mode)
const sample = deck.byId.get('w:menni|v>hu');
for (const [typed, ok] of [
  ['menni', true],
  ['Menni!', true],
  ['megy', true],
  ['meny', false],
  ['menny', false],
]) {
  const r = checkTyped(typed, sample, deck);
  if (r.ok !== ok) err(`checkTyped("${typed}") expected ok=${ok}, got ${JSON.stringify(r)}`);
}
if (checkTyped('kerek', deck.byId.get('w:kerék|n>hu'), deck).kind !== 'accent') err('accent slip not detected');
const postp = deck.cards.find((c) => c.id === 'g:post:a ház előtt>p');
if (!postp || !checkTyped('ház előtt', postp, deck).ok) err('article-less answer "ház előtt" should be accepted');

// ---------------------------------------------------------------- multiple choice quality
{
  const rand = mulberry32(42);
  const pickN = (arr, n) => {
    const a = [...arr];
    const outA = [];
    while (outA.length < n && a.length) outA.push(a.splice(Math.floor(rand() * a.length), 1)[0]);
    return outA;
  };
  const vocab = deck.cards.filter((c) => c.kind === 'vocab');
  const gram = deck.cards.filter((c) => c.item);
  const verb = deck.cards.filter((c) => c.kind !== 'vocab' && !c.item);
  const sampleCards = [...pickN(vocab, 400), ...pickN(gram, 350), ...pickN(verb, 350)];
  const st = { mix: {} };
  let fallbacks = 0;
  const t1 = performance.now();
  for (const c of sampleCards) {
    const opts = buildChoices(c, deck, st, rand);
    if (opts.length !== 4) err(`choices for ${c.id}: expected 4 options, got ${opts.length}`);
    if (opts.filter((o) => o.correct).length !== 1) err(`choices for ${c.id}: expected exactly one correct option`);
    const texts = opts.map((o) => norm(o.text));
    if (new Set(texts).size !== texts.length) err(`choices for ${c.id}: duplicate options ${texts.join(' | ')}`);
    if (opts.some((o) => !o.text)) err(`choices for ${c.id}: empty option`);
    for (const o of opts) {
      if (o.correct) continue;
      if (c.answers && c.answers.includes(norm(o.text))) err(`choices for ${c.id}: wrong option "${o.text}" is an accepted answer`);
      if (c.readings && c.readings.some((r) => norm(r.en) === norm(o.text))) err(`choices for ${c.id}: wrong option "${o.text}" is a correct reading`);
      if (o.s === 0) fallbacks++;
    }
  }
  out.info.choiceMsPerCard = +((performance.now() - t1) / sampleCards.length).toFixed(2);
  out.info.choiceFallbacks = fallbacks;
  // Print a few questions of each kind for a human to eyeball.
  const show = (c) => {
    const opts = buildChoices(c, deck, st, rand);
    const q = c.q.cue ? `${c.q.text} → ${c.q.cue}` : c.q.text;
    return `[${c.label}] ${q}  ::  ${opts.map((o) => (o.correct ? `*${o.text}*` : o.text)).join('  |  ')}`;
  };
  const ids = [
    'w:kés|n>en',
    'w:menni|v>hu',
    'w:kérni|v>hu',
    'w:hozni|v>en',
    'w:Hogy vagy?|phr>hu',
    'w:tegnap|adv>hu',
    'w:Ausztria|n>hu',
    'w:Kutya baja.|phr>en',
    'g:in-ban:szobában>p',
    'g:in-ban:házban>r',
    'g:plural:lovak>p',
    'g:acc:vizet>p',
    'g:on-n:egyetemen>p',
    'g:order:Nem megyek be.>p',
    'g:clock:fél három>p',
    'g:pers:nekem>p',
    'g:pref:bemegy>p',
    'c:látni:pdef:3',
    'c:menni:past:5',
    'r:menni:mentek',
    'c:szeretni:cond:0',
    'c:menni:kell:0',
    'c:menni:pcond:0',
  ];
  out.info.choiceSamples = ids.map((id) => (deck.byId.get(id) ? show(deck.byId.get(id)) : `(missing ${id})`));
  for (const c of pickN(sampleCards, 12)) out.info.choiceSamples.push(show(c));
}

// ---------------------------------------------------------------- memory model unit checks
{
  const now = Date.UTC(2026, 0, 1);
  let cs = S.gradeCard(undefined, 0, now, 0.3);
  if (!(cs.h < 0.1 && cs.w === 1)) err('first miss should give a tiny half-life');
  cs = S.gradeCard(cs, 1, now + 2 * 60e3, 0.3);
  if (!(cs.h > 0.05)) err('a correct retry should grow the half-life');
  const strong = S.gradeCard(undefined, 2, now, 0.3);
  if (strong.h !== 21 * 24) err('Too easy on a new card should give 3 weeks');
  if (S.gradeCard(undefined, 1, now, 0.3, true).h >= S.gradeCard(undefined, 1, now, 0.3, false).h) err('a first multiple-choice hit (maybe a guess) should count less than a typed one');
  const later = S.gradeCard(strong, 1, now + 30 * S.DAY, 0.3);
  if (!(later.h > strong.h)) err('remembering after a long gap should strengthen the card');
  const lapse = S.gradeCard(later, 0, now + 31 * S.DAY, 0.3);
  if (!(lapse.h <= 24 && lapse.d > later.d)) err('a lapse should bring the card back within a day and raise difficulty');
  const base = { n: 3, c: 2, w: 1, s: 1, h: 10, d: 0.3, t: now, f: now };
  if (!(S.gradeCard(base, 0, now + 40 * S.HOUR, 0.3).h > S.gradeCard(base, 0, now + 1 * S.HOUR, 0.3).h)) err('expected misses should cost less than surprising misses');
}

// ---------------------------------------------------------------- level gating checks
{
  const st = {};
  if (S.levelProgress(deck, st).open !== 1) err('a new learner should start with only level 1 open');
  const l1 = deck.wordIdsByLevel[1];
  for (const id of l1.slice(0, Math.ceil(l1.length * 0.45))) st[id + '>en'] = { n: 3, c: 3, w: 0, s: 3, h: 200, d: 0.2, t: Date.now(), f: Date.now() };
  if (S.levelProgress(deck, st).open !== 2) err('mastering 45% of level 1 should open level 2');
  const lockedSkill = deck.skillById.get('v-pdef');
  if (!S.skillNeeds(lockedSkill, deck, st).length) err('past-definite should wait for past and definite to be partly mastered');
  if (S.levelProgress(deck, {}, 3).open !== 3) err('unlocking level 3 by hand should open it');
}

// ---------------------------------------------------------------- 30-day simulation
function simulate({ days = 30, perSession = 40, intensity = 'challenging', mix = 'balanced', seed = 7, label = '', tooEasy = 0.5 } = {}) {
  const rand = mulberry32(seed);
  const START = Date.UTC(2026, 10, 1, 6);
  const state = { v: 1, cards: {}, log: [], days: {}, mix: {}, settings: { answerMode: 'choice', intensity, mix, directions: 'both', goal: 50 } };
  // Hidden "true" memory of the simulated learner (knows lots of level 1, little of level 4+).
  const truth = new Map();
  for (const c of deck.cards) {
    const lv = { 1: 0.6, 2: 0.3, 3: 0.1, 4: 0.05, 5: 0.02, 6: 0.01 }[c.level] || 0.02;
    const f = (c.dir === 'en2hu' ? 0.7 : 1) * (c.kind === 'vocab' ? 1 : 0.5);
    if (rand() < lv * f) truth.set(c.id, { h: 24 * (5 + rand() * 60), t: START - rand() * 5 * S.DAY });
  }
  // Exponential forgetting; seeing the answer after a miss relearns it; hard recalls strengthen more.
  // Multiple choice: a forgotten card can still be guessed right 1 time in 4.
  const answer = (card, now) => {
    const s = truth.get(card.id);
    const p = s ? Math.pow(2, -(now - s.t) / S.HOUR / s.h) : 0.02;
    const ok = rand() < p + (1 - p) * 0.25;
    if (!s) truth.set(card.id, { h: 0.5, t: now });
    else {
      s.h = ok ? Math.max(s.h, (now - s.t) / S.HOUR) * (2.5 + 4 * (1 - p)) : Math.max(0.5, s.h * 0.7);
      s.t = now;
    }
    if (!ok) return 0;
    if (p > 0.9 && rand() < tooEasy) return 2; // "Too easy"
    if (p < 0.2 && rand() < 0.5) return 0; // honest "I guessed"
    return 1;
  };
  const daily = [];
  const reasons = {};
  let immediateRepeats = 0;
  let sameGroupAdjacent = 0;
  let chooseMs = 0;
  let picks = 0;
  const newByLevel = {};
  for (let d = 0; d < days; d++) {
    const day = { n: 0, ok: 0, newV: 0, newG: 0, newEn2hu: 0 };
    for (const at of [8, 20]) {
      let now = START + d * S.DAY + at * S.HOUR;
      const ses = S.newSession('smart');
      let prev = null;
      for (let k = 0; k < perSession; k++) {
        const t1 = performance.now();
        const pick = S.choose(deck, state, ses, now, rand);
        chooseMs += performance.now() - t1;
        picks++;
        if (!pick) break;
        const c = pick.card;
        if (prev && prev.id === c.id) immediateRepeats++;
        if (prev && prev.group === c.group) sameGroupAdjacent++;
        reasons[pick.reason.type] = (reasons[pick.reason.type] || 0) + 1;
        const g = answer(c, now);
        const old = state.cards[c.id];
        if (!old) {
          if (c.kind === 'vocab') day.newV++;
          else day.newG++;
          if (c.dir === 'en2hu') day.newEn2hu++;
          newByLevel[c.level] = (newByLevel[c.level] || 0) + 1;
        }
        state.cards[c.id] = S.gradeCard(old, g, now, c.prior, true);
        state.log.push([now, c.id, g, old ? 0 : 1]);
        S.afterAnswer(ses, state, c, g, rand, pick.reason.type);
        day.n++;
        if (g > 0) day.ok++;
        prev = c;
        now += 7000 + rand() * 9000;
      }
    }
    day.acc = Math.round((100 * day.ok) / Math.max(1, day.n));
    day.open = S.levelProgress(deck, state.cards).open;
    daily.push(day);
  }
  const later = daily.slice(5);
  const mast = { learning: 0, familiar: 0, strong: 0 };
  for (const cs of Object.values(state.cards)) mast[S.mastery(cs)]++;
  return {
    settings: label || `${intensity}/${mix}`,
    summary: {
      avgAccuracyAfterDay5: Math.round(later.reduce((a, x) => a + x.acc, 0) / later.length),
      avgNewPerDay: +(daily.reduce((a, x) => a + x.newV + x.newG, 0) / daily.length).toFixed(1),
      grammarShareOfNew: Math.round((100 * daily.reduce((a, x) => a + x.newG, 0)) / Math.max(1, daily.reduce((a, x) => a + x.newV + x.newG, 0))),
      openLevelByDay: daily.map((x) => x.open).join(''),
      newByLevel,
    },
    daily: daily.filter((_, i) => [0, 1, 2, 4, 9, 14, 19, 24, 29].includes(i)).map((x) => `acc ${x.acc}% · new ${x.newV}w+${x.newG}g (en→hu ${x.newEn2hu}) · open L${x.open}`),
    totals: { met: Object.keys(state.cards).length, mastery: mast },
    reasons,
    immediateRepeats,
    sameGroupAdjacent,
    avgChooseMs: +(chooseMs / picks).toFixed(2),
  };
}

const sims = [
  simulate(),
  simulate({ intensity: 'brutal', seed: 11 }),
  simulate({ intensity: 'relaxed', mix: 'words', seed: 3 }),
  simulate({ days: 60, perSession: 60, seed: 5, label: 'challenging, 120/day for 60 days' }),
  simulate({ days: 30, perSession: 40, seed: 9, tooEasy: 0.9, label: 'A2 learner who taps Too easy for known words' }),
];
out.info.simulations = sims;
for (const s of sims) {
  if (s.immediateRepeats > 0) err(`${s.settings}: the same card was shown twice in a row ${s.immediateRepeats}×`);
  if (s.avgChooseMs > 25) warn(`${s.settings}: choosing a card is slow (${s.avgChooseMs} ms)`);
}

// Mistakes mode only shows missed cards; it must not crash on an empty history.
{
  const st = { v: 1, cards: {}, log: [], days: {}, mix: {}, settings: { intensity: 'challenging', mix: 'balanced', directions: 'both' } };
  if (S.choose(deck, st, S.newSession('mistakes'), Date.now()) !== null) err('Mistakes mode with no history should return nothing');
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
  ui.steps.push(`first card: ${$('.q-text').textContent} [${$('.kind').textContent}] options: ${$$('.option .opt-text').map((x) => x.textContent).join(' | ')}`);
  if (!/Hungarian → English/.test($('.kind').textContent)) err('UI: a new user should start with a word card');
  let wrongShown = 0;
  for (let i = 0; i < 60; i++) {
    const opts = $$('.option');
    if (opts.length !== 4) {
      err(`UI: expected 4 options, got ${opts.length} on round ${i}`);
      break;
    }
    opts[i % 4].click();
    await sleep(3);
    if (!$('.details')) err(`UI: no answer panel after answering on round ${i}`);
    if ($$('.option.right').length !== 1) err(`UI: exactly one option should be marked right (round ${i})`);
    if ($('.option.wrong')) wrongShown++;
    const links = $$('.next-row .mini');
    if (i % 9 === 4 && links.length) links[0].click(); // "Too easy"
    else if (i % 9 === 7 && links.length > 1) links[1].click(); // "I guessed"
    else $('.actions .next').click();
    await sleep(3);
  }
  ui.steps.push(`60 answers done (${wrongShown} wrong picks shown) · top bar: ${$('.goal').textContent}`);
  // Undo brings the last card back unanswered.
  const beforeUndo = $('.q-text').textContent;
  $$('.option')[0].click();
  await sleep(3);
  $('.actions .next').click();
  await sleep(3);
  $('.icon-btn').click();
  await sleep(3);
  if ($('.details') || $$('.option').length !== 4) err('UI: undo should show the previous card again, unanswered');
  if ($('.q-text').textContent !== beforeUndo) err(`UI: undo showed "${$('.q-text').textContent}" instead of "${beforeUndo}"`);
  for (const [i, sel] of [
    [1, '.lvl-row'],
    [2, '.wlist'],
    [3, '.settings'],
  ]) {
    $$('.tab')[i].click();
    await sleep(30);
    if (!$(sel)) err(`UI: tab ${i} did not show ${sel}`);
  }
  $$('.tab')[1].click();
  await sleep(20);
  ui.steps.push(`levels: ${$$('.lvl-row').map((x) => x.querySelector('.lvl-state')?.textContent || 'locked').join(', ')}`);
  $$('.tab')[2].click();
  await sleep(20);
  $$('.seg-ctl button')[1].click();
  await sleep(20);
  ui.steps.push(`grammar topics: ${$$('.grow').length}, locked: ${$$('.grow.locked').length}`);
  // typing mode
  $$('.tab')[3].click();
  await sleep(30);
  $$('.setting')[0].querySelectorAll('button')[1].click();
  await sleep(20);
  $$('.tab')[0].click();
  await sleep(30);
  let typedOnce = false;
  for (let i = 0; i < 30; i++) {
    const input = $('#answer-input');
    if (input) {
      input.value = 'xyz';
      input.dispatchEvent(new w.Event('input'));
      $('.type-row .btn').click();
      await sleep(3);
      if (!$('.result')) err('UI: typed answer gave no result banner');
      typedOnce = true;
    } else {
      $$('.option')[0].click();
      await sleep(3);
    }
    $('.actions .next').click();
    await sleep(3);
  }
  if (!typedOnce) warn('UI: never got a typeable card in 30 tries');
  for (const m of [1, 2, 3, 0]) {
    $$('.mode')[m].click();
    await sleep(10);
  }
  ui.steps.push(`modes ok, card: ${$('.q-text') ? $('.q-text').textContent : '(empty view)'}`);
  const saved = JSON.parse(w.localStorage.getItem('szokincs:v1'));
  ui.steps.push(`saved state: ${Object.keys(saved.cards).length} cards met, ${saved.log.length} log entries, ${Object.keys(saved.mix).length} cards with remembered mix-ups`);
  if (ui.pageErrors.length) ui.pageErrors.forEach((e) => err(`UI page error: ${e}`));
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
  try {
    const man = await (await fetch('../manifest.webmanifest')).json();
    for (const ic of man.icons) if (!(await fetch(`../${ic.src}`)).ok) err(`manifest icon missing: ${ic.src}`);
    ui.steps.push(`manifest ok: ${man.name}, ${man.icons.length} icons`);
  } catch (e) {
    err(`manifest check failed: ${e}`);
  }
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
