// The "make me mess up" engine.
//
// Every card you have met keeps a small memory record:
//   n = times seen, c = correct, w = wrong (misses), s = current correct streak,
//   h = memory half-life in hours (how long until you'd have a 50/50 chance of forgetting),
//   d = difficulty 0..1 (rises every time you miss, falls slowly when you get it right),
//   t = last time seen (ms), f = first time seen (ms).
//
// The chance you still remember a card right now is   p = 2^(-elapsed / h).
// When choosing the next card, every card you've met gets a "danger" score:
//   (1 - p) * (0.6 + 0.8 * d)  -> how likely you are to get it WRONG right now, weighted up to
//                                 ~2.3× for cards you have a history of messing up
// + 0.15 * staleness           -> how long since you last saw it (log scale, maxes out at ~2 months)
// + 0.35 if a look-alike word was just shown ("mix-up alert")
// The app then picks (with a bit of randomness) among the most dangerous cards.
// Cards you just missed come back 3-6 cards later until you get them right.
// New cards are mixed in faster when you're doing well and slower when you're struggling,
// so you hover around the accuracy target of your chosen intensity.

import { clamp } from './util.js';

export const HOUR = 3600e3;
export const DAY = 24 * HOUR;
const MIN_H = 0.05; // 3 minutes
const MAX_H = 365 * 24; // 1 year

export const INTENSITY = {
  relaxed: { label: 'Relaxed', base: 0.2, target: 0.82, maxLoad: 15 },
  challenging: { label: 'Challenging', base: 0.3, target: 0.7, maxLoad: 25 },
  brutal: { label: 'Brutal', base: 0.42, target: 0.6, maxLoad: 40 },
};

/** Share of NEW cards that are vocabulary (the rest are grammar drills) */
export const MIX = { words: 0.85, balanced: 0.7, grammar: 0.45 };

const r3 = (x) => Math.round(x * 1000) / 1000;

export function recall(cs, now) {
  const dt = Math.max(0, now - cs.t) / HOUR;
  return Math.pow(2, -dt / cs.h);
}

/**
 * Update a card's memory after an answer.
 * g: 0 = missed, 1 = got it, 2 = easy.  cs = previous record (undefined for a new card).
 */
export function gradeCard(cs, g, now, prior = 0.3) {
  if (!cs) {
    // First meeting. Missing a brand-new card is expected; it just starts with a tiny half-life.
    const h = g === 0 ? MIN_H : g === 1 ? 24 : 21 * 24;
    const d = g === 0 ? Math.min(0.95, prior + 0.1) : g === 1 ? prior * 0.9 : prior * 0.6;
    return { n: 1, c: g > 0 ? 1 : 0, w: g === 0 ? 1 : 0, s: g > 0 ? 1 : 0, h, d: r3(d), t: now, f: now };
  }
  const p = recall(cs, now);
  const dtH = Math.max(0, now - cs.t) / HOUR;
  const out = { ...cs, n: cs.n + 1, t: now };
  // Updates happen on a log scale and are weighted by surprise. The app deliberately asks
  // risky cards, so a miss it saw coming (low p) only dents the memory a little, while
  // forgetting something you "should" have known (high p) cuts it hard.
  if (g === 0) {
    out.w = cs.w + 1;
    out.s = 0;
    out.d = r3(cs.d + (1 - cs.d) * 0.2 * (0.5 + p));
    const cut = Math.pow(2, -(2 * p + 0.2)); // ×0.87 (expected miss) … ×0.19 (shock miss)
    out.h = r3(clamp(Math.min(cs.h * cut, 24), MIN_H, MAX_H)); // anything you miss returns within ~a day
  } else {
    out.c = cs.c + 1;
    out.s = cs.s + 1;
    // Remembering something you were likely to forget strengthens it more (spacing effect).
    const ease = 1.25 - 0.5 * cs.d; // hard cards grow slower
    let dx = (0.5 + 1.6 * (1 - p)) * ease; // ×1.4 … ×4.6
    if (g === 2) dx += 1;
    out.h = r3(clamp(Math.max(cs.h, dtH * 0.5) * Math.pow(2, dx), MIN_H, MAX_H));
    out.d = r3(g === 2 ? cs.d * 0.75 : cs.d * 0.93);
  }
  return out;
}

export function mastery(cs) {
  if (!cs) return 'new';
  if (cs.h < 24) return 'learning';
  if (cs.h < 24 * 21) return 'familiar';
  return 'strong';
}

export function newSession(mode = 'smart') {
  return { mode, step: 0, recent: [], recentGroups: [], retry: [], boost: {}, misses: {} };
}

export function allowed(card, settings, mode) {
  if (mode === 'words' && card.kind !== 'vocab') return false;
  if (mode === 'grammar' && card.kind === 'vocab') return false;
  if (card.kind === 'vocab' && settings.directions !== 'both' && card.dir !== settings.directions) return false;
  return true;
}

export function recentAccuracy(log, n = 30) {
  const last = log.slice(-n);
  if (last.length < 6) return 0.8;
  let ok = 0;
  for (const e of last) if (e[2] > 0) ok++;
  return ok / last.length;
}

/** How many words you have met (Hungarian → English cards seen). */
export function wordsMet(deck, st) {
  let k = 0;
  for (const ids of Object.values(deck.wordIdsByLevel)) for (const id of ids) if (st[id + '>en']) k++;
  return k;
}

/** Which grammar level is unlocked: level L+1 opens once you've met 35% of level-L words. */
export function grammarLevel(deck, st) {
  let lvl = 1;
  for (let L = 1; L <= 3; L++) {
    const ids = deck.wordIdsByLevel[L] || [];
    let k = 0;
    for (const id of ids) if (st[id + '>en']) k++;
    if (ids.length && k / ids.length >= 0.35) lvl = L + 1;
    else break;
  }
  return lvl;
}

function newVocab(deck, st, settings, avoid) {
  for (const c of deck.vocabOrder) {
    if (st[c.id] || avoid.has(c.group)) continue;
    if (settings.directions !== 'both' && c.dir !== settings.directions) continue;
    // English -> Hungarian only after you can recognise the word (half-life of ~a day).
    if (c.sib && settings.directions === 'both') {
      const s = st[c.sib];
      if (!s || s.h < 20) continue;
    }
    return c;
  }
  return null;
}

function newGrammar(deck, st, mode, avoid) {
  const free = mode === 'grammar'; // grammar-only mode ignores word prerequisites
  if (!free && wordsMet(deck, st) < 25) return null; // learn some words before the drills start
  const maxLevel = free ? Math.max(2, grammarLevel(deck, st)) : grammarLevel(deck, st);
  const ranked = [];
  for (const s of deck.skills) {
    if (s.level > maxLevel) continue;
    let n = 0;
    for (const c of s.cards) if (st[c.id]) n++;
    if (n < s.cards.length) ranked.push({ s, n });
  }
  // Round-robin: the skill you've seen least goes first, so drills stay varied.
  ranked.sort((a, b) => a.n - b.n || a.s.level - b.s.level || a.s.idx - b.s.idx);
  for (const { s } of ranked) {
    for (const c of s.cards) {
      if (st[c.id] || avoid.has(c.group)) continue;
      if (c.req && !free) {
        const r = st[c.req];
        if (!r || r.c < 1) continue; // only drill words you've already met and got right once
      }
      return c;
    }
  }
  return null;
}

function nextNew(deck, state, mode, rand, avoid) {
  const st = state.cards;
  const settings = state.settings;
  if (mode === 'words') return newVocab(deck, st, settings, avoid);
  if (mode === 'grammar') return newGrammar(deck, st, mode, avoid);
  const vocabFirst = rand() < (MIX[settings.mix] ?? MIX.balanced);
  return vocabFirst
    ? newVocab(deck, st, settings, avoid) || newGrammar(deck, st, mode, avoid)
    : newGrammar(deck, st, mode, avoid) || newVocab(deck, st, settings, avoid);
}

function reasonFor(x, ses) {
  const { cs } = x;
  if (x.boosted) return { type: 'confuse', from: ses.boost[x.c.id].from };
  if (cs.w >= 2 && cs.w / cs.n >= 0.25) return { type: 'tough', misses: cs.w };
  if (cs.w > 0 && cs.s === 0) return { type: 'missed' };
  if (x.days >= 5) return { type: 'stale', days: Math.floor(x.days) };
  if (x.risk >= 0.5) return { type: 'fading' };
  return { type: 'review' };
}

/**
 * Choose the next card. Returns { card, reason } or null when nothing is available.
 * Mutates nothing; call afterAnswer() once the card has been graded.
 */
export function choose(deck, state, ses, now, rand = Math.random) {
  const st = state.cards;
  const settings = state.settings;
  const mode = ses.mode;
  const P = INTENSITY[settings.intensity] || INTENSITY.challenging;
  const ok = (c) => allowed(c, settings, mode);
  const last = ses.recent[ses.recent.length - 1];
  const lastGroup = ses.recentGroups[ses.recentGroups.length - 1];

  // 1. Something you just missed comes back a few cards later
  //    (but not straight after a card that just showed its answer).
  const due = ses.retry
    .filter((r) => r.due <= ses.step && r.id !== last && deck.byId.get(r.id)?.group !== lastGroup)
    .sort((a, b) => a.due - b.due);
  for (const r of due) {
    const c = deck.byId.get(r.id);
    if (c && st[c.id] && ok(c)) return { card: c, reason: { type: 'retry' } };
  }

  // 2. Score every card you've already met.
  let load = 0;
  const seen = [];
  for (const c of deck.cards) {
    const cs = st[c.id];
    if (!cs || !ok(c)) continue;
    if (cs.h < 24) load++;
    if (mode === 'mistakes' && !cs.w) continue;
    seen.push({ c, cs });
  }
  const cooldown = Math.max(1, Math.min(8, Math.floor(seen.length / 2)));
  const recentIds = new Set(ses.recent.slice(-cooldown));
  const recentGroups = new Set(ses.recentGroups.slice(-6));
  const all = [];
  for (const x of seen) {
    if (recentIds.has(x.c.id)) continue;
    if (x.c.group === lastGroup && seen.length > 2) continue; // never "kutya → dog" right after "dog → kutya"
    const risk = 1 - recall(x.cs, now);
    const days = (now - x.cs.t) / DAY;
    const stale = Math.min(1, Math.log1p(days) / Math.log1p(60));
    const b = ses.boost[x.c.id];
    const boosted = !!b && b.until > ses.step;
    let score = risk * (0.6 + 0.8 * x.cs.d) + 0.15 * stale + (boosted ? 0.35 : 0);
    if (recentGroups.has(x.c.group)) score *= 0.35; // don't ask "kutya" right after "dog"
    all.push({ ...x, risk, days, boosted, score });
  }
  // Skip cards that are basically guaranteed right (just reviewed and strong) unless that's all there is.
  let cands = mode === 'mistakes' ? all : all.filter((x) => x.risk >= 0.1 || x.boosted);
  if (cands.length < 3) cands = all;

  // 3. New card or review?
  let fresh = null;
  let pNew = 0;
  if (mode !== 'mistakes') {
    fresh = nextNew(deck, state, mode, rand, recentGroups);
    if (fresh) {
      if (!cands.length) pNew = 1;
      else {
        const acc = recentAccuracy(state.log);
        pNew = P.base * clamp(1 + 3 * (acc - P.target), 0.3, 2);
        if (load >= P.maxLoad) pNew *= 0.5; // too many shaky cards: consolidate first
        pNew = Math.max(pNew, 0.08); // …but never stop feeding you new material entirely
        const topRisk = cands.reduce((m, x) => Math.max(m, x.risk), 0);
        if (topRisk < 0.3) pNew = Math.max(pNew, 0.75); // reviews would be too easy: push new material
        if (cands.length < 4) pNew = Math.max(pNew, 0.8);
      }
    }
  }
  if (fresh && rand() < pNew) return { card: fresh, reason: { type: 'new' } };
  if (!cands.length) {
    if (fresh) return { card: fresh, reason: { type: 'new' } };
    // Tiny pool (e.g. Mistakes mode with one card): repeat rather than show nothing.
    const pool = seen.filter((x) => x.c.id !== last);
    const x = (pool.length ? pool : seen)[Math.floor(rand() * (pool.length || seen.length))];
    return x ? { card: x.c, reason: { type: 'review' } } : null;
  }

  // 4. Weighted pick among the most dangerous cards (softmax over the top 6).
  cands.sort((a, b) => b.score - a.score);
  const top = cands.slice(0, 6);
  const T = 0.06;
  const ws = top.map((x) => Math.exp((x.score - top[0].score) / T));
  let r = rand() * ws.reduce((a, b) => a + b, 0);
  let pick = top[0];
  for (let i = 0; i < top.length; i++) {
    r -= ws[i];
    if (r <= 0) {
      pick = top[i];
      break;
    }
  }
  return { card: pick.c, reason: reasonFor(pick, ses) };
}

/** Bookkeeping after a card is graded: retry queue, cooldowns, look-alike boosts. */
export function afterAnswer(ses, state, card, g, rand = Math.random, reasonType = '') {
  ses.step++;
  ses.recent.push(card.id);
  if (ses.recent.length > 40) ses.recent.shift();
  ses.recentGroups.push(card.group);
  if (ses.recentGroups.length > 40) ses.recentGroups.shift();
  ses.retry = ses.retry.filter((r) => r.id !== card.id);
  delete ses.boost[card.id];
  if (g === 0) {
    const n = (ses.misses[card.id] || 0) + 1;
    ses.misses[card.id] = n;
    if (n <= 3) ses.retry.push({ id: card.id, due: ses.step + 3 + Math.floor(rand() * 4) });
  }
  // Look-alikes you've met get pushed forward so you have to tell them apart.
  // (At most two, and a mix-up card doesn't trigger another chain of mix-ups.)
  if (reasonType === 'confuse') return;
  const met = (card.confuse || []).filter((id) => state.cards[id] && !ses.recent.slice(-4).includes(id));
  for (let k = 0; k < 2 && met.length; k++) {
    const [id] = met.splice(Math.floor(rand() * met.length), 1);
    ses.boost[id] = { until: ses.step + 8, from: card.id };
  }
}
