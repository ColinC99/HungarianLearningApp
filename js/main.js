// Szókincs — Hungarian flashcards that hunt for your mistakes.

import { buildDeck, POS_LABEL } from './deck.js';
import * as S from './scheduler.js';
import { buildChoices } from './choices.js';
import { loadState, saveState, freshState, normalizeState, requestPersistence, backupBlob } from './store.js';
import { h, dayKey, fmtHours, fold, showEn } from './util.js';
import { checkTyped } from './check.js';
import { initSpeech, speak, speechSupported, hasHungarianVoice } from './speech.js';
import { ICON } from './icons.js';

const APP_VERSION = '1.1.0';

const deck = buildDeck();
if (deck.problems.length) console.warn('Deck problems:', deck.problems);

let state = loadState();
let ses = S.newSession('smart');
let persistAsked = false;

const root = document.getElementById('app');
const toastEl = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });

const TABS = [
  ['study', 'Study', ICON.cards],
  ['stats', 'Progress', ICON.chart],
  ['words', 'Words', ICON.book],
  ['settings', 'Settings', ICON.sliders],
];

const MODES = [
  ['smart', 'Smart mix'],
  ['mistakes', 'Mistakes'],
  ['words', 'Words'],
  ['grammar', 'Grammar'],
];

const ui = {
  tab: tabFromHash(),
  pick: null, // { card, reason }
  options: [], // multiple-choice options for the current card
  choice: -1, // index of the option you tapped
  answered: false,
  lastGrade: 0, // 0 missed, 1 got it, 2 too easy
  typed: '',
  result: null, // typed-answer check result
  undo: null, // snapshot of the last answer (for Undo, "Too easy" and "I guessed")
  enter: true,
  words: { q: '', filter: 'all', view: 'words', limit: 80, open: null, openSkill: null },
};

// ---------------------------------------------------------------- helpers

function tabFromHash() {
  const t = location.hash.replace('#', '');
  return TABS.some(([k]) => k === t) ? t : 'study';
}

const todayStats = () => state.days[dayKey()] || [0, 0, 0];
const isTyping = (card) => state.settings.answerMode === 'type' && !!card.answers;

function streak() {
  let n = 0;
  const d = new Date();
  if (!(state.days[dayKey(d)] || [0])[0]) d.setDate(d.getDate() - 1);
  while ((state.days[dayKey(d)] || [0])[0] > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

let toastTimer = 0;
function toast(msg, action) {
  toastEl.replaceChildren(h('span', {}, msg), action ? h('button', { class: 'toast-btn', onClick: action.fn }, action.label) : null);
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), action ? 10000 : 4000);
}

function speakBtn(text) {
  if (state.settings.speech === 'off' || !speechSupported()) return null;
  return h('button', {
    class: 'speak',
    type: 'button',
    'aria-label': 'Pronounce',
    html: ICON.speaker,
    onClick: (e) => {
      e.stopPropagation();
      speak(text);
    },
  });
}

function autoSpeak(text) {
  if (state.settings.speech === 'auto') speak(text);
}

function focusInput() {
  const el = document.getElementById('answer-input');
  if (el && !ui.answered) el.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- study logic

function nextCard() {
  ui.pick = S.choose(deck, state, ses, Date.now());
  ui.answered = false;
  ui.choice = -1;
  ui.lastGrade = 0;
  ui.typed = '';
  ui.result = null;
  ui.enter = true;
  ui.options = ui.pick && !isTyping(ui.pick.card) ? buildChoices(ui.pick.card, deck, state) : [];
  if (ui.pick && ui.pick.card.q.lang === 'hu') autoSpeak(ui.pick.card.q.text);
}

function snapshot(card) {
  const dk = dayKey();
  return {
    pick: ui.pick,
    prev: state.cards[card.id] ? { ...state.cards[card.id] } : null,
    day: state.days[dk] ? [...state.days[dk]] : null,
    dk,
    ses: structuredClone(ses),
    mix: state.mix[card.id] ? { ...state.mix[card.id] } : null,
  };
}

function restore(u) {
  const id = u.pick.card.id;
  if (u.prev) state.cards[id] = u.prev;
  else delete state.cards[id];
  if (u.day) state.days[u.dk] = u.day;
  else delete state.days[u.dk];
  const last = state.log[state.log.length - 1];
  if (last && last[1] === id) state.log.pop();
  if (u.mix) state.mix[id] = u.mix;
  else delete state.mix[id];
  ses = structuredClone(u.ses);
}

function apply(card, g, wrongOption) {
  const t = Date.now();
  const prev = state.cards[card.id];
  state.cards[card.id] = S.gradeCard(prev, g, t, card.prior, !isTyping(card));
  state.log.push([t, card.id, g, prev ? 0 : 1]);
  const dk = dayKey(t);
  const day = state.days[dk] ? [...state.days[dk]] : [0, 0, 0];
  day[0]++;
  if (g > 0) day[1]++;
  if (!prev) day[2]++;
  state.days[dk] = day;
  S.afterAnswer(ses, state, card, g, Math.random, ui.pick && ui.pick.reason ? ui.pick.reason.type : '');
  if (wrongOption) S.noteMixUp(ses, state, card, wrongOption);
  ui.lastGrade = g;
  if (!saveState(state)) toast('Could not save progress — is storage full?');
  return day;
}

/** Grade the current card right away (so nothing is lost if the app closes). */
function record(g, wrongOption) {
  const card = ui.pick.card;
  const before = S.levelProgress(deck, state.cards, state.levelFloor).open;
  ui.undo = snapshot(card);
  const day = apply(card, g, wrongOption);
  if (!persistAsked) {
    persistAsked = true;
    requestPersistence();
  }
  const after = S.levelProgress(deck, state.cards, state.levelFloor).open;
  const L = S.LEVELS.find((x) => x.level === after);
  if (after > before && L) toast(`Level ${after} · ${L.name} unlocked — harder words are on the way!`);
  else if (day[0] === Number(state.settings.goal)) toast(`Daily goal reached: ${day[0]} cards! Keep going if you like.`);
}

/** Change the grade of the answer just given ("Too easy", "I guessed", "I was right"). */
function amend(g) {
  const u = ui.undo;
  if (!u) return;
  restore(u);
  apply(u.pick.card, g, null);
}

function pickOption(i) {
  const o = ui.options[i];
  if (!ui.pick || !o) return;
  if (ui.answered) {
    if (o.lang === 'hu' && state.settings.speech !== 'off') speak(o.text); // tap an option afterwards to hear it
    return;
  }
  ui.choice = i;
  ui.answered = true;
  record(o.correct ? 1 : 0, o.correct ? null : o);
  if (ui.pick.card.a.lang === 'hu') autoSpeak(ui.pick.card.a.text);
  render();
}

function next() {
  if (!ui.answered) return;
  nextCard();
  render();
  focusInput();
}

function amendAndNext(g) {
  amend(g);
  next();
}

function undo() {
  const u = ui.undo;
  if (!u) return;
  restore(u);
  saveState(state);
  ui.pick = u.pick;
  ui.answered = false;
  ui.choice = -1;
  ui.result = null;
  ui.typed = '';
  ui.enter = false;
  ui.options = isTyping(u.pick.card) ? [] : buildChoices(u.pick.card, deck, state);
  ui.undo = null;
  render();
  focusInput();
}

function submitTyped() {
  if (!ui.pick || ui.answered) return;
  const res = checkTyped(ui.typed, ui.pick.card, deck);
  if (res.kind === 'empty') return giveUp();
  ui.result = res;
  ui.answered = true;
  record(res.ok ? 1 : 0, null);
  if (ui.pick.card.a.lang === 'hu') autoSpeak(ui.pick.card.a.text);
  render();
}

function giveUp() {
  if (!ui.pick || ui.answered) return;
  ui.result = { ok: false, kind: 'gaveup', typed: '' };
  ui.answered = true;
  record(0, null);
  render();
}

function setMode(k) {
  if (ses.mode === k) return;
  ses = S.newSession(k);
  ui.undo = null;
  nextCard();
  render();
  focusInput();
}

function insertChar(input, ch) {
  const s = input.selectionStart ?? input.value.length;
  const e = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, s) + ch + input.value.slice(e);
  input.setSelectionRange(s + 1, s + 1);
  ui.typed = input.value;
  input.focus();
}

// ---------------------------------------------------------------- study view

const REASONS = {
  new: ['new', 'New'],
  retry: ['warn', 'Try again'],
  confuse: ['info', 'Mix-up alert'],
  tough: ['bad', null],
  missed: ['warn', 'Missed last time'],
  stale: ['muted', null],
  fading: ['muted', 'Fading'],
  review: ['muted', 'Review'],
};

function reasonPill(reason) {
  if (!reason) return null;
  const [cls, label] = REASONS[reason.type] || REASONS.review;
  const text = reason.type === 'tough' ? `Missed ${reason.misses}×` : reason.type === 'stale' ? `Last seen ${reason.days} days ago` : label;
  return h('span', { class: `pill ${cls}` }, text);
}

function studyView() {
  if (!ui.pick) nextCard();
  const wrap = h('section', { class: 'study' }, modeBar());
  if (!ui.pick) {
    wrap.append(emptyView());
    return wrap;
  }
  const { card, reason } = ui.pick;
  const typing = isTyping(card);
  wrap.append(promptCard(card, reason));
  if (!typing) wrap.append(optionList());
  else if (!ui.answered) wrap.append(typeArea());
  if (ui.answered) wrap.append(detailsPanel(card, reason), nextBar(typing));
  return wrap;
}

function modeBar() {
  return h(
    'div',
    { class: 'modes' },
    MODES.map(([k, label]) => h('button', { class: `mode ${ses.mode === k ? 'on' : ''}`, onClick: () => setMode(k), 'aria-pressed': String(ses.mode === k) }, label)),
  );
}

function emptyView() {
  const msg =
    ses.mode === 'mistakes'
      ? ['No mistakes to drill yet.', 'Switch to Smart mix and go make some — that’s how this works.']
      : ['Nothing to show right now.', 'New material unlocks as you master what you’ve met. Try Smart mix or check Progress → Levels.'];
  return h('div', { class: 'empty card' }, h('h2', {}, msg[0]), h('p', {}, msg[1]));
}

function promptCard(card, reason) {
  const q = card.q;
  const el = h(
    'article',
    { class: `card prompt-card ${ui.enter ? 'enter' : ''}` },
    h('div', { class: 'card-top' }, h('span', { class: 'kind' }, card.label), reasonPill(reason)),
    h(
      'div',
      { class: 'prompt' },
      h('div', { class: `q-text ${q.text.length > 24 ? 'long' : ''}`, lang: q.lang }, q.text, q.lang === 'hu' ? speakBtn(q.text) : null),
      q.chips ? h('div', { class: 'chips' }, q.chips.map((c) => h('span', { class: 'chip' }, c))) : null,
      q.cue ? h('div', { class: 'q-cue' }, q.cue) : null,
      q.hint ? h('div', { class: 'q-hint' }, q.hint) : null,
    ),
  );
  ui.enter = false;
  return el;
}

function optionList() {
  return h(
    'div',
    { class: `options ${ui.answered ? 'done' : ''}` },
    ui.options.map((o, i) => {
      const st = !ui.answered ? '' : o.correct ? 'right' : i === ui.choice ? 'wrong' : 'other';
      const gloss = ui.answered && !o.correct ? (o.wrong ? `✗ ${o.why || 'incorrect'}` : o.gloss ? `= ${o.gloss}` : '') : '';
      const mark = !ui.answered ? String(i + 1) : o.correct ? h('span', { html: ICON.check }) : i === ui.choice ? h('span', { html: ICON.cross }) : String(i + 1);
      return h(
        'button',
        { class: `option ${st}`, type: 'button', onClick: () => pickOption(i) },
        h('span', { class: 'opt-key' }, mark),
        h(
          'span',
          { class: 'opt-body' },
          h('span', { class: 'opt-text', lang: o.lang }, o.text),
          gloss ? h('span', { class: `opt-gloss ${o.wrong ? 'is-wrong' : ''}`, lang: o.wrong ? null : o.glossLang }, gloss) : null,
        ),
      );
    }),
  );
}

function resultBanner(r) {
  const M = {
    exact: ['ok', 'Correct!'],
    accent: ['warn', `Almost — check the accents. You typed “${r.typed}”.`],
    typo: ['warn', `So close — one letter off. You typed “${r.typed}”.`],
    synonym: ['warn', `“${r.typed}” means ${r.other ? showEn(r.other.en) : 'something similar'} — not the word we wanted here.`],
    wrong: ['bad', `Not quite — you typed “${r.typed}”.`],
    gaveup: ['bad', 'No worries — getting it wrong is how it sticks.'],
  };
  const [cls, text] = M[r.kind] || M.wrong;
  return h('div', { class: `result ${cls}` }, text);
}

function detailsPanel(card, reason) {
  const a = card.a;
  const cs = state.cards[card.id];
  const looks = (card.word && card.word.lookalikes) || [];
  const fromCard = reason && reason.type === 'confuse' ? deck.byId.get(reason.from) : null;
  const ok = ui.lastGrade > 0;
  const right = ui.options.find((o) => o.correct);
  // In multiple choice the right answer is already highlighted; only repeat it if there's more to it.
  const showAnswer = ui.result || !right || right.text !== a.text;
  const firstTime = ui.undo && !ui.undo.prev;
  return h(
    'div',
    { class: `details ${ok ? 'ok' : 'bad'}` },
    ui.result ? resultBanner(ui.result) : h('div', { class: `verdict ${ok ? 'ok' : 'bad'}` }, ok ? '✓ Correct!' : '✗ Not quite'),
    showAnswer ? h('div', { class: `a-text ${a.text.length > 28 ? 'long' : ''}`, lang: a.lang }, a.text, a.lang === 'hu' ? speakBtn(a.text) : null) : null,
    !showAnswer && a.lang === 'hu' ? h('div', { class: 'a-say', lang: 'hu' }, a.text, speakBtn(a.text)) : null,
    ok && firstTime && !ui.result ? h('div', { class: 'tip' }, 'Knew it already? Tap “Too easy” — it skips the card for weeks and unlocks the next level sooner.') : null,
    a.sub ? h('div', { class: 'a-sub' }, a.sub) : null,
    a.note ? h('div', { class: 'a-note' }, a.note) : null,
    fromCard ? h('div', { class: 'a-looks' }, `Mix-up alert: you just had “${fromCard.word ? fromCard.word.hu : fromCard.q.text}”.`) : null,
    looks.length ? h('div', { class: 'a-looks' }, 'Don’t mix up with: ', looks.map((w, i) => [i ? ', ' : '', h('b', { lang: 'hu' }, w.hu), ` (${showEn(w.en).split(',')[0]})`])) : null,
    h('div', { class: 'a-meta' }, metaLine(card, cs)),
  );
}

function metaLine(card, cs) {
  const where = card.kind === 'vocab' ? `${card.topic} · level ${card.level}` : skillTitle(card.skill);
  if (!cs) return where;
  return `Seen ${cs.n}× · missed ${cs.w}× · memory ≈ ${fmtHours(cs.h)} · ${where}`;
}

const skillTitle = (id) => (deck.skillById.get(id) || {}).title || '';

function nextBar(typing) {
  const ok = ui.lastGrade > 0;
  const side = [];
  const mini = (label, g, title) => h('button', { class: 'btn ghost mini', title, onClick: () => amendAndNext(g) }, label);
  if (ok) {
    side.push(mini('Too easy', 2, 'I knew it well — skip it for weeks'));
    side.push(typing ? mini('Count wrong', 0, 'Count this answer as wrong') : mini('I guessed', 0, 'I didn’t really know it — count it as a miss'));
  } else if (typing && ui.result && ui.result.kind !== 'gaveup') {
    side.push(mini('I was right', 1, 'Count this answer as correct'));
  }
  return h(
    'div',
    { class: 'actions' },
    h(
      'div',
      { class: `next-row n${side.length}` },
      side,
      h('button', { class: `btn ${ok ? 'good' : 'primary'} next`, onClick: next }, 'Next →'),
    ),
  );
}

function typeArea() {
  const input = h('input', {
    class: 'type-input',
    id: 'answer-input',
    type: 'text',
    lang: 'hu',
    autocomplete: 'off',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    enterkeyhint: 'done',
    placeholder: 'Type it in Hungarian…',
    value: ui.typed,
    onInput: (e) => (ui.typed = e.target.value),
    onKeydown: (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitTyped();
      }
    },
  });
  const accents = h(
    'div',
    { class: 'accents' },
    [...'áéíóöőúüű'].map((ch) => h('button', { class: 'accent', type: 'button', tabindex: '-1', onPointerdown: (e) => e.preventDefault(), onClick: () => insertChar(input, ch) }, ch)),
  );
  return h(
    'div',
    { class: 'actions type-area' },
    accents,
    h('div', { class: 'type-row' }, input, h('button', { class: 'btn primary', onClick: submitTyped }, 'Check')),
    h('button', { class: 'link', onClick: giveUp }, 'I don’t know'),
  );
}

// ---------------------------------------------------------------- progress view

function masteryCounts(test) {
  const m = { new: 0, learning: 0, familiar: 0, strong: 0 };
  for (const c of deck.cards) if (test(c)) m[S.mastery(state.cards[c.id])]++;
  return m;
}

function stackBar(m) {
  const total = m.new + m.learning + m.familiar + m.strong || 1;
  const seg = (k) => h('span', { class: `seg ${k}`, style: { width: `${(100 * m[k]) / total}%` } });
  return h('div', { class: 'stack' }, seg('strong'), seg('familiar'), seg('learning'));
}

function masteryRow(title, m) {
  const met = m.learning + m.familiar + m.strong;
  return h(
    'div',
    { class: 'mrow' },
    h('div', { class: 'mrow-head' }, h('span', {}, title), h('span', { class: 'muted' }, `${met.toLocaleString()} / ${(met + m.new).toLocaleString()} met`)),
    stackBar(m),
    h(
      'div',
      { class: 'mrow-legend' },
      h('span', {}, h('i', { class: 'sw strong' }), `${m.strong} strong`),
      h('span', {}, h('i', { class: 'sw familiar' }), `${m.familiar} familiar`),
      h('span', {}, h('i', { class: 'sw learning' }), `${m.learning} learning`),
    ),
  );
}

function unlockLevel(n) {
  if (!confirm(`Unlock level ${n} now? Its words will start appearing even though the level before it isn’t mastered yet.`)) return;
  state.levelFloor = n;
  saveState(state);
  if (!ui.answered) ui.pick = null;
  render();
  toast(`Level ${n} unlocked.`);
}

function levelsPanel() {
  const { levels, open } = S.levelProgress(deck, state.cards, state.levelFloor);
  return h(
    'div',
    { class: 'panel' },
    h('h2', {}, 'Levels'),
    levels.map((L, k) => {
      const meta = S.LEVELS.find((x) => x.level === L.level) || { name: '', cefr: '' };
      const prev = levels[k - 1];
      const current = L.level === open;
      return h(
        'div',
        { class: `lvl-row ${L.unlocked ? '' : 'locked'}` },
        h(
          'div',
          { class: 'lvl-head' },
          h('span', { class: 'lvl-badge' }, String(L.level)),
          h('span', { class: 'lvl-name' }, meta.name, h('span', { class: 'muted' }, ` · ${meta.cefr}`)),
          L.unlocked ? h('span', { class: `lvl-state ${current ? 'current' : ''}` }, current ? 'Current' : 'Open') : h('span', { class: 'lvl-state', html: ICON.lock }),
        ),
        h('div', { class: 'gbar' }, h('span', { style: { width: `${(100 * L.mastered) / (L.total || 1)}%` } })),
        h(
          'div',
          { class: 'lvl-sub muted' },
          L.unlocked || !prev
            ? `${L.mastered.toLocaleString()} of ${L.total.toLocaleString()} words mastered · ${L.met.toLocaleString()} met`
            : `Opens when ${Math.ceil(S.GATE.share * prev.total)} level-${prev.level} words are mastered (now ${prev.mastered})`,
        ),
        !L.unlocked && prev && prev.unlocked ? h('button', { class: 'link small', onClick: () => unlockLevel(L.level) }, 'Unlock now anyway') : null,
      );
    }),
    h('p', { class: 'fine' }, `“Mastered” = you’d still remember it in 3 days. A level opens once ${Math.round(S.GATE.share * 100)}% of the level before it is mastered, so harder material arrives only as the basics stick.`),
  );
}

function statsView() {
  const [n, c, nw] = todayStats();
  const acc = n ? Math.round((100 * c) / n) : 0;
  const days = [];
  const d = new Date();
  d.setDate(d.getDate() - 13);
  for (let i = 0; i < 14; i++) {
    const k = dayKey(d);
    days.push({ k, label: 'SMTWTFS'[d.getDay()], v: state.days[k] || [0, 0, 0] });
    d.setDate(d.getDate() + 1);
  }
  const maxV = Math.max(10, ...days.map((x) => x.v[0]));
  const tough = deck.cards
    .map((card) => ({ card, cs: state.cards[card.id] }))
    .filter((x) => x.cs && x.cs.w > 0)
    .sort((a, b) => b.cs.d - a.cs.d || b.cs.w - a.cs.w)
    .slice(0, 12);
  const P = S.INTENSITY[state.settings.intensity] || S.INTENSITY.challenging;

  return h(
    'section',
    { class: 'stats' },
    h('h1', {}, 'Progress'),
    h('div', { class: 'tiles' }, tile(n, 'cards today'), tile(n ? `${acc}%` : '—', 'accuracy today'), tile(nw, 'new today'), tile(streak(), 'day streak')),
    levelsPanel(),
    h(
      'div',
      { class: 'panel' },
      h('h2', {}, 'Your memory'),
      masteryRow('Recognising words (HU → EN)', masteryCounts((x) => x.kind === 'vocab' && x.dir === 'hu2en')),
      masteryRow('Producing words (EN → HU)', masteryCounts((x) => x.kind === 'vocab' && x.dir === 'en2hu')),
      masteryRow('Grammar & conjugation', masteryCounts((x) => x.kind !== 'vocab')),
      h('p', { class: 'fine' }, 'Strong = you’d likely still remember it in 3 weeks. Familiar = at least a day. Learning = less than a day.'),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h2', {}, 'Last 14 days'),
      h(
        'div',
        { class: 'bars' },
        days.map((x) =>
          h(
            'div',
            { class: 'bar', title: `${x.k}: ${x.v[0]} cards, ${x.v[1]} right` },
            h(
              'div',
              { class: 'bar-col' },
              x.v[0]
                ? h('div', { class: 'bar-fill', style: { height: `${(100 * x.v[0]) / maxV}%` } }, h('div', { class: 'bar-ok', style: { height: `${(100 * x.v[1]) / x.v[0]}%` } }))
                : h('div', { class: 'bar-empty' }),
            ),
            h('span', { class: 'bar-l' }, x.label),
          ),
        ),
      ),
      h('div', { class: 'mrow-legend' }, h('span', {}, h('i', { class: 'sw ok' }), 'right'), h('span', {}, h('i', { class: 'sw miss' }), 'missed')),
    ),
    h(
      'div',
      { class: 'panel' },
      h('h2', {}, 'Your toughest cards'),
      tough.length
        ? h(
            'ul',
            { class: 'tough' },
            tough.map(({ card, cs }) =>
              h(
                'li',
                {},
                h('div', { class: 'tq' }, h('b', { lang: card.q.lang }, card.q.text), card.q.cue ? h('span', { class: 'muted' }, ` · ${card.q.cue}`) : null),
                h('div', { class: 'ta' }, card.a.text),
                h('span', { class: 'tm' }, `missed ${cs.w}/${cs.n}`),
              ),
            ),
          )
        : h('p', { class: 'muted' }, 'Nothing yet. Cards you miss will show up here — the Mistakes mode drills them.'),
    ),
    h(
      'details',
      { class: 'panel how' },
      h('summary', {}, 'How does it pick the next card?'),
      h('p', {}, 'Every card you have met carries a memory estimate: how long until you’d have a 50/50 chance of forgetting it. Each time, Szókincs scores all of them and picks — with a little randomness — the ones you are most likely to get wrong right now.'),
      h(
        'ul',
        {},
        h('li', {}, h('b', {}, 'Forgetting risk'), ' — the longer since you saw it compared to how strong the memory is, the riskier.'),
        h('li', {}, h('b', {}, 'Your mistake history'), ' — every miss raises a card’s difficulty (it only drops slowly), and difficulty multiplies the risk by up to ~2×.'),
        h('li', {}, h('b', {}, 'Time away'), ' — cards you haven’t seen in a long time get an extra pull back in.'),
        h('li', {}, h('b', {}, 'Tempting wrong answers'), ' — the options are look-alikes, the same verb in another tense, the same word with another ending, and answers you have picked by mistake before.'),
        h('li', {}, h('b', {}, 'Mix-up alerts'), ' — when you confuse two things (or answer one of a look-alike pair), the other one comes up soon so you have to tell them apart.'),
        h('li', {}, h('b', {}, 'Try again'), ' — anything you miss returns 3–6 cards later until you get it.'),
        h('li', {}, h('b', {}, 'Levels'), ' — harder words and grammar unlock only as the easier ones become mastered.'),
      ),
      h('p', {}, `New cards come faster when you’re acing things and slow down when you’re struggling, aiming for about ${Math.round(P.target * 100)}% accuracy on “${P.label}”. Change the intensity in Settings.`),
    ),
  );
}

const tile = (v, label) => h('div', { class: 'tile' }, h('div', { class: 'tile-v' }, String(v)), h('div', { class: 'tile-l' }, label));

// ---------------------------------------------------------------- words view

function wordStatus(w) {
  const a = state.cards[`${w.id}>en`];
  const b = state.cards[`${w.id}>hu`];
  if (!a && !b) return 'new';
  const m = Math.min(...[a, b].filter(Boolean).map((x) => x.h));
  return m < 24 ? 'learning' : m < 24 * 21 ? 'familiar' : 'strong';
}
const wordMisses = (w) => (state.cards[`${w.id}>en`]?.w || 0) + (state.cards[`${w.id}>hu`]?.w || 0);

const WORD_FILTERS = [
  ['all', 'All'],
  ['learning', 'Learning'],
  ['known', 'Known'],
  ['tough', 'Tough'],
  ['new', 'Not started'],
];

function filteredWords() {
  const W = ui.words;
  const q = fold(W.q.trim());
  return deck.words.filter((w) => {
    if (q && !fold(w.hu).includes(q) && !fold(w.en).includes(q) && !w.alts.some((x) => fold(x).includes(q))) return false;
    const st = wordStatus(w);
    switch (W.filter) {
      case 'learning':
        return st === 'learning';
      case 'known':
        return st === 'familiar' || st === 'strong';
      case 'tough':
        return wordMisses(w) >= 2;
      case 'new':
        return st === 'new';
      default:
        return true;
    }
  });
}

function wordDetail(w) {
  const rows = [
    ['HU → EN', state.cards[`${w.id}>en`]],
    ['EN → HU', state.cards[`${w.id}>hu`]],
  ];
  return h(
    'div',
    { class: 'wdetail' },
    w.form ? h('div', {}, h('span', { class: 'muted' }, 'Dictionary form: '), h('b', { lang: 'hu' }, w.form)) : null,
    w.alts.length ? h('div', {}, h('span', { class: 'muted' }, 'Also: '), w.alts.join(', ')) : null,
    w.note ? h('div', { class: 'a-note' }, w.note) : null,
    w.lookalikes ? h('div', {}, h('span', { class: 'muted' }, 'Look-alikes: '), w.lookalikes.map((x) => x.hu).join(', ')) : null,
    h('div', { class: 'muted' }, `${w.topic} · level ${w.level}`),
    h('div', { class: 'wstats' }, rows.map(([label, cs]) => h('div', {}, h('b', {}, label), ' ', cs ? `seen ${cs.n}× · missed ${cs.w}× · memory ≈ ${fmtHours(cs.h)}` : 'not started'))),
    speechSupported() && state.settings.speech !== 'off'
      ? h('button', { class: 'btn ghost small', onClick: (e) => (e.stopPropagation(), speak(w.hu)) }, h('span', { html: ICON.speaker }), 'Listen')
      : null,
  );
}

function wordList() {
  const W = ui.words;
  const list = filteredWords();
  const shown = list.slice(0, W.limit);
  return h(
    'div',
    { id: 'word-list' },
    h('div', { class: 'muted count' }, `${list.length.toLocaleString()} words`),
    h(
      'ul',
      { class: 'wlist' },
      shown.map((w) =>
        h(
          'li',
          {
            class: `wrow ${W.open === w.id ? 'open' : ''}`,
            onClick: () => {
              W.open = W.open === w.id ? null : w.id;
              refreshWordList();
            },
          },
          h(
            'div',
            { class: 'wline' },
            h('span', { class: `dot ${wordStatus(w)}` }),
            h('div', { class: 'wmain' }, h('div', { class: 'whu', lang: 'hu' }, w.hu), h('div', { class: 'wen' }, showEn(w.en))),
            h('span', { class: 'wpos' }, POS_LABEL[w.pos] || ''),
          ),
          W.open === w.id ? wordDetail(w) : null,
        ),
      ),
    ),
    list.length > shown.length
      ? h(
          'button',
          {
            class: 'btn ghost wide',
            onClick: () => {
              W.limit += 150;
              refreshWordList();
            },
          },
          `Show more (${(list.length - shown.length).toLocaleString()} left)`,
        )
      : null,
  );
}

function refreshWordList() {
  const el = document.getElementById('word-list');
  if (el) el.replaceWith(wordList());
}

function grammarList() {
  const W = ui.words;
  const { open: openLevel } = S.levelProgress(deck, state.cards, state.levelFloor);
  const skills = [...deck.skills].sort((a, b) => a.level - b.level || a.idx - b.idx);
  return h(
    'ul',
    { class: 'glist' },
    skills.map((s) => {
      const met = s.cards.filter((c) => state.cards[c.id]).length;
      const isOpen = W.openSkill === s.id;
      const needs = S.skillNeeds(s, deck, state.cards);
      const lockText = s.level > openLevel ? `Unlocks with level ${s.level}` : needs.length ? `Unlocks after: ${needs.map((n) => n.title).join(', ')}` : '';
      return h(
        'li',
        {
          class: `grow ${isOpen ? 'open' : ''} ${lockText ? 'locked' : ''}`,
          onClick: () => {
            W.openSkill = isOpen ? null : s.id;
            render();
          },
        },
        h(
          'div',
          { class: 'gline' },
          h('span', { class: 'lvl' }, `L${s.level}`),
          h('b', {}, s.title),
          lockText ? h('span', { class: 'lock', html: ICON.lock }) : null,
          h('span', { class: 'muted gcount' }, `${met}/${s.cards.length}`),
        ),
        h('div', { class: 'gbar' }, h('span', { style: { width: `${(100 * met) / (s.cards.length || 1)}%` } })),
        lockText ? h('div', { class: 'glock muted' }, lockText) : null,
        isOpen
          ? h(
              'div',
              { class: 'gdetail' },
              h('p', {}, s.info),
              h(
                'ul',
                { class: 'examples' },
                s.examples.slice(0, 10).map((e) => h('li', {}, h('span', { lang: 'hu' }, e.base), ' → ', h('b', { lang: 'hu' }, e.answer), h('span', { class: 'muted' }, `  ${e.cue}`))),
              ),
            )
          : null,
      );
    }),
  );
}

function wordsView() {
  const W = ui.words;
  const seg = h(
    'div',
    { class: 'seg-ctl' },
    [
      ['words', 'Words'],
      ['grammar', 'Grammar'],
    ].map(([k, label]) =>
      h(
        'button',
        {
          class: W.view === k ? 'on' : '',
          onClick: () => {
            W.view = k;
            render();
          },
        },
        label,
      ),
    ),
  );
  if (W.view === 'grammar') return h('section', { class: 'words' }, h('h1', {}, 'Words & grammar'), seg, grammarList());
  const search = h('input', {
    class: 'search',
    type: 'search',
    placeholder: 'Search Hungarian or English…',
    value: W.q,
    onInput: (e) => {
      W.q = e.target.value;
      W.limit = 80;
      refreshWordList();
    },
  });
  const chips = h(
    'div',
    { class: 'fchips' },
    WORD_FILTERS.map(([k, label]) =>
      h(
        'button',
        {
          class: `fchip ${W.filter === k ? 'on' : ''}`,
          onClick: () => {
            W.filter = k;
            W.limit = 80;
            render();
          },
        },
        label,
      ),
    ),
  );
  return h('section', { class: 'words' }, h('h1', {}, 'Words & grammar'), seg, h('div', { class: 'search-wrap' }, h('span', { class: 'search-icon', html: ICON.search }), search), chips, wordList());
}

// ---------------------------------------------------------------- settings view

const SETTINGS = [
  {
    key: 'answerMode',
    title: 'Answer style',
    options: [
      ['choice', 'Multiple choice'],
      ['type', 'Type answers'],
    ],
    help: 'Typing is the harder option: it’s used whenever the answer is Hungarian (English → Hungarian and grammar cards). Everything else stays multiple choice.',
  },
  {
    key: 'intensity',
    title: 'Intensity',
    options: [
      ['relaxed', 'Relaxed'],
      ['challenging', 'Challenging'],
      ['brutal', 'Brutal'],
    ],
    help: 'How hard it pushes: new cards keep arriving until your accuracy drops to about 80% / 70% / 60%.',
  },
  {
    key: 'mix',
    title: 'New cards',
    options: [
      ['words', 'Mostly words'],
      ['balanced', 'Balanced'],
      ['grammar', 'More grammar'],
    ],
    help: 'Share of new cards that are vocabulary vs. conjugation & suffix drills (85/15, 70/30, 45/55).',
  },
  {
    key: 'directions',
    title: 'Word directions',
    options: [
      ['both', 'Both'],
      ['hu2en', 'HU → EN'],
      ['en2hu', 'EN → HU'],
    ],
    help: 'With “Both”, English → Hungarian cards unlock once you can recognise a word.',
  },
  {
    key: 'goal',
    title: 'Daily goal',
    options: [
      [20, '20'],
      [50, '50'],
      [100, '100'],
      [200, '200'],
    ],
  },
  {
    key: 'speech',
    title: 'Pronunciation',
    options: [
      ['off', 'Off'],
      ['tap', 'Tap to hear'],
      ['auto', 'Auto-play'],
    ],
  },
  {
    key: 'theme',
    title: 'Theme',
    options: [
      ['system', 'System'],
      ['light', 'Light'],
      ['dark', 'Dark'],
    ],
  },
];

function setSetting(key, val) {
  state.settings[key] = val;
  saveState(state);
  if (['directions', 'mix', 'intensity', 'answerMode'].includes(key) && !ui.answered) ui.pick = null;
  render();
}

async function exportBackup(share) {
  const blob = backupBlob(state);
  const name = `szokincs-backup-${dayKey()}.json`;
  if (share) {
    const file = new File([blob], name, { type: 'text/plain' });
    try {
      await navigator.share({ files: [file], title: 'Szókincs backup' });
    } catch (e) {
      if (e && e.name !== 'AbortError') toast('Sharing failed — try “Save file” instead.');
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast('Backup saved (check your Downloads).');
}

function canShareFiles() {
  try {
    return !!(navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.json', { type: 'text/plain' })] }));
  } catch (e) {
    return false;
  }
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const s = normalizeState(JSON.parse(String(reader.result)));
      const n = Object.keys(s.cards).length;
      if (!confirm(`Replace your current progress with this backup (${n.toLocaleString()} cards met)?`)) return;
      state = s;
      saveState(state);
      ses = S.newSession(ses.mode);
      ui.pick = null;
      ui.undo = null;
      render();
      toast('Backup restored.');
    } catch (e) {
      alert(e.message || 'Could not read that file.');
    }
  };
  reader.readAsText(file);
}

function resetAll() {
  if (!confirm('Erase ALL progress on this phone? This cannot be undone.')) return;
  if (!confirm('Really? Consider saving a backup first.')) return;
  const settings = state.settings;
  state = freshState();
  state.settings = settings;
  saveState(state);
  ses = S.newSession('smart');
  ui.pick = null;
  ui.undo = null;
  render();
  toast('Progress reset.');
}

function settingsView() {
  const s = state.settings;
  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json,text/plain',
    class: 'hidden',
    onChange: (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) importBackup(f);
      e.target.value = '';
    },
  });
  const met = Object.keys(state.cards).length;
  const voiceLine = !speechSupported()
    ? 'Speech isn’t supported in this browser.'
    : hasHungarianVoice()
      ? 'Hungarian voice found ✓'
      : 'No Hungarian voice found yet. In the phone’s Settings, search “Text-to-speech”, choose Speech Services by Google, then ⚙ → Install voice data → Hungarian.';
  return h(
    'section',
    { class: 'settings' },
    h('h1', {}, 'Settings'),
    SETTINGS.map((o) =>
      h(
        'div',
        { class: 'setting' },
        h('div', { class: 'set-title' }, o.title),
        h('div', { class: 'seg-ctl' }, o.options.map(([v, label]) => h('button', { class: String(s[o.key]) === String(v) ? 'on' : '', onClick: () => setSetting(o.key, v) }, label))),
        o.help ? h('p', { class: 'fine' }, o.help) : null,
        o.key === 'speech' ? h('p', { class: 'fine' }, voiceLine) : null,
      ),
    ),
    h(
      'div',
      { class: 'setting' },
      h('div', { class: 'set-title' }, 'Backup'),
      h('p', { class: 'fine' }, 'Your progress lives only on this phone. Save a backup now and then (and before clearing Chrome’s data).'),
      h(
        'div',
        { class: 'btn-row' },
        h('button', { class: 'btn ghost', onClick: () => exportBackup(false) }, 'Save file'),
        canShareFiles() ? h('button', { class: 'btn ghost', onClick: () => exportBackup(true) }, 'Share…') : null,
        h('button', { class: 'btn ghost', onClick: () => fileInput.click() }, 'Restore'),
      ),
      fileInput,
    ),
    h(
      'div',
      { class: 'setting' },
      h('div', { class: 'set-title' }, 'About'),
      h(
        'p',
        { class: 'fine' },
        `Szókincs ${APP_VERSION} · ${deck.counts.words.toLocaleString()} words · ${deck.counts.grammarCards.toLocaleString()} grammar & conjugation cards · ${deck.counts.total.toLocaleString()} cards in total. You have met ${met.toLocaleString()} of them.`,
      ),
      h('button', { class: 'btn danger-ghost', onClick: resetAll }, 'Reset all progress'),
    ),
  );
}

// ---------------------------------------------------------------- shell

function topBar() {
  const [n] = todayStats();
  const goal = Number(state.settings.goal) || 50;
  const pct = Math.min(1, n / goal);
  const r = 9;
  const circ = 2 * Math.PI * r;
  const st = streak();
  return h(
    'header',
    { class: 'topbar' },
    h('div', { class: 'brand' }, h('span', { class: 'logo', html: ICON.logo }), h('span', {}, 'Szókincs')),
    h(
      'div',
      { class: 'top-right' },
      ui.undo && ui.tab === 'study'
        ? h('button', { class: 'icon-btn', 'aria-label': 'Undo last answer', title: 'Undo last answer', onClick: undo }, h('span', { html: ICON.undo }), h('span', { class: 'undo-l' }, 'Undo'))
        : null,
      st ? h('div', { class: 'streak', title: `${st}-day streak` }, h('span', { html: ICON.flame }), String(st)) : null,
      h(
        'div',
        { class: `goal ${pct >= 1 ? 'done' : ''}`, title: 'Today’s goal' },
        h('span', {
          html: `<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="${r}" fill="none" stroke="var(--line)" stroke-width="3.5"/><circle cx="12" cy="12" r="${r}" fill="none" stroke="var(--green)" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - pct)}" transform="rotate(-90 12 12)"/></svg>`,
        }),
        h('span', {}, `${n}/${goal}`),
      ),
    ),
  );
}

function tabBar() {
  return h(
    'nav',
    { class: 'tabs' },
    TABS.map(([k, label, icon]) => h('button', { class: `tab ${ui.tab === k ? 'on' : ''}`, onClick: () => go(k), 'aria-current': ui.tab === k ? 'page' : null }, h('span', { class: 'ti', html: icon }), h('span', {}, label))),
  );
}

function go(tab) {
  if (ui.tab === tab) return;
  location.hash = tab;
}

function applyTheme() {
  const t = state.settings.theme;
  const el = document.documentElement;
  if (t === 'light' || t === 'dark') el.setAttribute('data-theme', t);
  else el.removeAttribute('data-theme');
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#111714' : '#f6f3ee'));
}

let lastScroll = { tab: null };
function render() {
  const old = root.querySelector('.screen');
  const keep = old && lastScroll.tab === ui.tab ? old.scrollTop : 0;
  applyTheme();
  const view = { study: studyView, stats: statsView, words: wordsView, settings: settingsView }[ui.tab]();
  const screen = h('main', { class: `screen screen-${ui.tab}` }, view);
  root.replaceChildren(topBar(), screen, tabBar(), toastEl);
  screen.scrollTop = keep;
  lastScroll = { tab: ui.tab };
}

window.addEventListener('hashchange', () => {
  ui.tab = tabFromHash();
  render();
  focusInput();
});

matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => render());

document.addEventListener('keydown', (e) => {
  if (ui.tab !== 'study' || !ui.pick || e.target.closest('input, textarea, select')) return;
  if (!ui.answered && /^[1-4]$/.test(e.key) && ui.options.length) pickOption(Number(e.key) - 1);
  else if (ui.answered && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    next();
  }
});

// Coming back to the app after a while: re-pick if the card wasn't answered yet.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && ui.tab === 'study' && ui.pick && !ui.answered && !ui.typed) {
    nextCard();
    render();
  }
});

initSpeech(() => {
  if (ui.tab === 'settings') render();
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW registration failed', e));
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) toast('Szókincs was updated.', { label: 'Reload', fn: () => location.reload() });
  });
}

render();
focusInput();
