// Checking typed answers (typing mode). Accents count: "kerek" (round) is not "kerék" (wheel).

import { norm, fold } from './util.js';

function lev(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return m || n;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

const STOP = new Set(['to', 'a', 'an', 'the', 'be', 'of', 'it', 'for', 'something', 'someone', 'sth', 'up', 'out', 'in', 'on', 'very', 'get', 'have']);
function enTokens(en) {
  return new Set(
    String(en)
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .split(/[^a-z']+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}
function overlaps(a, b) {
  const A = enTokens(a);
  for (const w of enTokens(b)) if (A.has(w)) return true;
  return false;
}

/**
 * Compare what was typed against the card's accepted answers.
 * Returns { ok, kind } where kind is exact | accent | typo | synonym | wrong | empty.
 */
export function checkTyped(input, card, deck) {
  const typed = norm(input);
  if (!typed) return { ok: false, kind: 'empty', typed };
  const answers = card.answers || [];
  if (answers.includes(typed)) return { ok: true, kind: 'exact', typed };
  const tf = fold(typed);
  if (answers.some((a) => fold(a) === tf)) return { ok: false, kind: 'accent', typed };
  if (typed.length >= 5 && answers.some((a) => lev(a, typed) === 1)) return { ok: false, kind: 'typo', typed };
  if (card.kind === 'vocab' && card.word && deck.huIndex) {
    const others = deck.huIndex.get(typed) || [];
    const other = others.find((w) => w.id !== card.word.id && overlaps(w.en, card.word.en));
    if (other) return { ok: false, kind: 'synonym', typed, other };
  }
  return { ok: false, kind: 'wrong', typed };
}
