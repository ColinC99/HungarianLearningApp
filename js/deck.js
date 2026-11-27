// Builds every card from the word lists, grammar lists and verb tables in /data.

import V1 from '../data/vocab-1.js';
import V2 from '../data/vocab-2.js';
import V3 from '../data/vocab-3.js';
import V4 from '../data/vocab-4.js';
import V5 from '../data/vocab-5.js';
import V6 from '../data/vocab-6.js';
import GRAMMAR from '../data/grammar.js';
import { VERBS, PARADIGMS, VERB_SKILLS } from '../data/verbs.js';
import CONFUSABLES from '../data/confusables.js';
import { norm, hash01, showEn, cap, stripLiteral, literalOf } from './util.js';

export const POS_LABEL = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  pron: 'pronoun',
  num: 'number',
  conj: 'conjunction',
  post: 'postposition',
  part: 'particle',
  int: 'interjection',
  phr: 'phrase',
  q: 'question word',
  mod: 'modal',
};

const SUBJ = ['I', 'you', 'he/she', 'we', 'you all', 'they'];

const splitAlts = (s) =>
  String(s)
    .split('/')
    .map((x) => x.trim())
    .filter(Boolean);

function push(map, key, val) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(val);
}

/** Accepted typed answers. "a ház előtt" also accepts "ház előtt". */
function answersFor(list) {
  const out = new Set();
  for (const a of list) {
    const n = norm(a);
    if (!n) continue;
    out.add(n);
    const m = /^(a|az) (.+)$/.exec(n);
    if (m) out.add(m[2]);
  }
  return [...out];
}

/**
 * Vocabulary format, one word per line:   hungarian | english | part-of-speech | note
 *   "@2 Food & drink" starts a section (level 2, topic "Food & drink").
 *   Verbs: "infinitive (3rd-person dictionary form)", e.g. "menni (megy)".
 *   Alternatives: "hova/hová". English alternatives are separated by ";".
 */
export function parseVocab(text, source = '') {
  const out = [];
  let level = 1;
  let topic = 'General';
  String(text)
    .split(/\r?\n/)
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line.startsWith('//')) return;
      if (line.startsWith('@')) {
        const m = /^@(\d)\s*(.*)$/.exec(line);
        if (m) {
          level = +m[1];
          topic = m[2].trim() || topic;
        }
        return;
      }
      const f = line.split('|').map((s) => s.trim());
      let head = f[0];
      let form = '';
      const pos = f[2] || '';
      const m = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(head);
      if (m && pos === 'v') {
        head = m[1].trim();
        form = m[2].trim();
      }
      const alts = splitAlts(head);
      out.push({ hu: alts[0], alts: alts.slice(1), form, en: f[1] || '', pos, note: f[3] || '', level, topic, src: `${source}:${i + 1}`, nf: f.length });
    });
  return out;
}

/**
 * Grammar format:
 *   "#skill-id L2 after=a,b | Title | Explanation"  starts a skill (after = prerequisite skills).
 *   "base | english cue | answer | note | wrong / wrong / wrong"  makes two cards: produce the
 *   form, and recognise it. The optional last field holds hand-written wrong options.
 *   "base#pos" picks a specific word. Prefix a line with ">" for produce-only or "<" for recognise-only.
 */
export function parseGrammar(text) {
  const skills = [];
  let cur = null;
  String(text)
    .split(/\r?\n/)
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line.startsWith('//')) return;
      if (line.startsWith('#')) {
        const [head, title = '', info = ''] = line
          .slice(1)
          .split('|')
          .map((s) => s.trim());
        const toks = head.split(/\s+/);
        let level = 1;
        let after = [];
        for (const t of toks.slice(1)) {
          if (/^L\d$/.test(t)) level = Number(t.slice(1));
          else if (t.startsWith('after=')) after = t.slice(6).split(',').filter(Boolean);
        }
        cur = { id: toks[0], level, after, title, info, items: [] };
        skills.push(cur);
        return;
      }
      if (!cur) return;
      let l = line;
      let only = null;
      if (l.startsWith('>')) {
        only = 'p';
        l = l.slice(1).trim();
      } else if (l.startsWith('<')) {
        only = 'r';
        l = l.slice(1).trim();
      }
      const f = l.split('|').map((s) => s.trim());
      const [base, pos = ''] = f[0].split('#');
      cur.items.push({ base, pos, cue: f[1] || '', answer: f[2] || '', note: f[3] || '', wrong: f[4] ? splitAlts(f[4]) : [], only, line: i + 1, nf: f.length });
    });
  return skills;
}

function verbEnglish(v, par, i) {
  const E = v.e || {};
  if (E.x && E.x[par]) return E.x[par][i];
  const [base, s3, past, pp = ''] = v.en.split('|');
  const d = (E.d || `${base} it|${s3} it|${past} it`).split('|');
  const [dbase, ds3, dpast] = d;
  const dpp = d[3] || (pp ? `${pp} it` : '');
  const cond = E.c || `would ${base}`;
  const dcond = E.cd || `would ${dbase}`;
  const ib = E.i || base;
  const sb = E.s || base;
  switch (par) {
    case 'pres':
      return `${SUBJ[i]} ${i === 2 ? s3 : base}`;
    case 'def':
      return `${SUBJ[i]} ${i === 2 ? ds3 : dbase}`;
    case 'past':
      return `${SUBJ[i]} ${past}`;
    case 'pdef':
      return `${SUBJ[i]} ${dpast}`;
    case 'cond':
      return `${SUBJ[i]} ${cond}`;
    case 'cdef':
      return `${SUBJ[i]} ${dcond}`;
    case 'imp':
      return [`${cap(ib)}!`, `${cap(ib)}! (formal)`, `Let's ${ib}!`, `${cap(ib)}! (to several people)`][i];
    case 'idef':
      return E.id || `${cap(dbase)}!`;
    case 'lak':
      return E.l || `I ${base} you`;
    case 'subj':
      return [`Should I ${sb}?`, `He/she should ${sb}`, `They should ${sb}`][i];
    case 'kell':
      return `${SUBJ[i]} ${i === 2 ? 'has' : 'have'} to ${E.k || base}`;
    case 'pcond':
      return `${SUBJ[i]} ${E.pc || `would have ${pp}`}`;
    case 'pcdef':
      return `${SUBJ[i]} ${E.pcd || `would have ${dpp}`}`;
    default:
      return '';
  }
}

/** "would have": the past form + volna (mentem → mentem volna). */
const withVolna = (cells) =>
  cells
    .split(',')
    .map((c) =>
      splitAlts(c)
        .map((f) => `${f} volna`)
        .join('/'),
    )
    .join(', ');

export function buildDeck() {
  const cards = [];
  const byId = new Map();
  const problems = [];
  const add = (c) => {
    if (byId.has(c.id)) {
      problems.push(`Duplicate card id: ${c.id}`);
      return null;
    }
    byId.set(c.id, c);
    cards.push(c);
    return c;
  };

  // ---------------- vocabulary ----------------
  const words = [V1, V2, V3, V4, V5, V6].flatMap((t, k) => parseVocab(t, `vocab-${k + 1}`));
  const huIndex = new Map(); // normalised Hungarian -> [words]
  const wordById = new Map();
  for (const w of words) {
    w.id = `w:${w.hu}|${w.pos}`;
    wordById.set(w.id, w);
    for (const k of [w.hu, ...w.alts]) push(huIndex, norm(k), w);
    if (w.pos === 'v' && w.form) push(huIndex, norm(w.form), w);
  }
  for (const w of words) w.ambiguous = (huIndex.get(norm(w.hu)) || []).some((o) => o !== w && o.hu === w.hu);

  // Order: by level; inside a level the topics are interleaved so new words come from all over.
  const wordIdsByLevel = {};
  const byLevel = new Map();
  for (const w of words) push(byLevel, w.level, w);
  const ordered = [];
  for (const L of [...byLevel.keys()].sort((a, b) => a - b)) {
    const list = byLevel.get(L);
    const topics = new Map();
    for (const w of list) push(topics, w.topic, w);
    for (const tl of topics.values()) tl.forEach((w, i) => (w.key = (i + hash01(w.id)) / tl.length));
    list.sort((a, b) => a.key - b.key);
    ordered.push(...list);
    wordIdsByLevel[L] = list.map((w) => w.id);
  }

  const vocabOrder = [];
  for (const w of ordered) {
    const posL = POS_LABEL[w.pos] || w.pos;
    const sub = [w.pos === 'v' && w.form ? `(ő) ${w.form}` : '', w.alts.length ? `also: ${w.alts.join(', ')}` : '']
      .filter(Boolean)
      .join(' · ');
    const prior = 0.22 + 0.03 * (w.level - 1);
    const a = add({
      id: `${w.id}>en`,
      kind: 'vocab',
      dir: 'hu2en',
      group: w.id,
      level: w.level,
      topic: w.topic,
      word: w,
      label: 'Hungarian → English',
      q: { text: w.hu, lang: 'hu', hint: w.ambiguous ? posL : '' },
      a: { text: showEn(w.en), lang: 'en', sub, note: w.note },
      answers: null,
      prior,
    });
    const b = add({
      id: `${w.id}>hu`,
      kind: 'vocab',
      dir: 'en2hu',
      group: w.id,
      level: w.level,
      topic: w.topic,
      word: w,
      label: 'English → Hungarian',
      q: { text: showEn(stripLiteral(w.en)), lang: 'en', hint: posL },
      a: { text: w.hu, lang: 'hu', sub: [sub, literalOf(w.en)].filter(Boolean).join(' · '), note: w.note },
      answers: answersFor([w.hu, ...w.alts, ...(w.pos === 'v' && w.form ? [w.form] : [])]),
      sib: `${w.id}>en`,
      prior: prior + 0.1,
    });
    if (a) vocabOrder.push(a);
    if (b) vocabOrder.push(b);
  }

  const reqFor = (base, pos = '') => {
    const w = (huIndex.get(norm(base)) || []).filter((x) => !pos || x.pos === pos)[0];
    return w ? `${w.id}>en` : null;
  };

  // ---------------- grammar drills ----------------
  const skills = [];
  const gItems = [];
  for (const sk of parseGrammar(GRAMMAR)) {
    const skill = { id: sk.id, level: sk.level, after: sk.after, title: sk.title, info: sk.info, cards: [], examples: [], verb: false };
    for (const it of sk.items) {
      const answers = splitAlts(it.answer);
      const primary = answers[0];
      const group = `g:${sk.id}:${primary}`;
      const req = reqFor(it.base, it.pos);
      if (it.pos && !req) problems.push(`Grammar ${sk.id}: no word "${it.base}" with part of speech ${it.pos}`);
      const prior = 0.3 + 0.03 * (sk.level - 1);
      // Prefix verbs explain themselves: "bemegy" -> "be- + megy".
      const prefixed = primary.length > it.base.length && primary.endsWith(it.base) ? `${primary.slice(0, -it.base.length)}- + ${it.base}` : '';
      const breakdown = it.note || prefixed || `${it.base} → ${primary}`;
      const item = {
        base: it.base,
        cue: it.cue,
        answers,
        primary,
        skill: sk.id,
        wrong: it.wrong,
        conjId: it.only !== 'r' ? `${group}>p` : null,
        identId: it.only !== 'p' ? `${group}>r` : null,
      };
      gItems.push(item);
      if (it.only !== 'p') {
        const c = add({
          id: `${group}>r`,
          kind: 'ident',
          group,
          level: sk.level,
          skill: sk.id,
          item,
          label: 'What does it mean?',
          q: { text: primary, lang: 'hu', hint: '' },
          a: { text: it.cue, lang: 'en', sub: breakdown, note: `${sk.title}. ${sk.info}` },
          answers: null,
          req,
          prior: prior - 0.05,
        });
        if (c) skill.cards.push(c);
      }
      if (it.only !== 'r') {
        const c = add({
          id: `${group}>p`,
          kind: 'conj',
          group,
          level: sk.level,
          skill: sk.id,
          item,
          label: 'Make the form',
          q: { text: it.base, lang: 'hu', cue: it.cue },
          a: { text: answers.join(' / '), lang: 'hu', sub: it.note || prefixed, note: `${sk.title}. ${sk.info}` },
          answers: answersFor(answers),
          req,
          prior,
        });
        if (c) skill.cards.push(c);
      }
      skill.examples.push({ base: it.base, cue: it.cue, answer: answers.join(' / ') });
    }
    skills.push(skill);
  }

  // ---------------- verb tables ----------------
  const vskill = new Map();
  for (const s of VERB_SKILLS) {
    const skill = { ...s, after: s.after || [], cards: [], examples: [], verb: true };
    vskill.set(s.id, skill);
    skills.push(skill);
  }
  const vCells = [];
  const vCellsByVerb = new Map();
  const readCards = [];
  VERBS.forEach((v0, rank) => {
    const v = { ...v0 };
    const pp = v.en.split('|')[3];
    const E = v.e || {};
    const hasPc = !!(pp || E.pc || (E.x && E.x.pcond));
    if (!v.pcond && v.past && hasPc) v.pcond = withVolna(v.past);
    if (!v.pcdef && v.pdef && (pp || E.pcd || (E.x && E.x.pcdef))) v.pcdef = withVolna(v.pdef);
    const req = reqFor(v.inf);
    if (!req) problems.push(`Verb table ${v.inf} has no matching vocabulary word`);
    const enBase = v.en.split('|')[0];
    const readings = new Map();
    for (const [par, P] of Object.entries(PARADIGMS)) {
      if (!v[par]) continue;
      const cells = v[par].split(',').map((s) => s.trim());
      if (cells.length !== P.persons.length) problems.push(`${v.inf}.${par}: expected ${P.persons.length} forms, got ${cells.length}`);
      cells.forEach((cellText, i) => {
        const forms = splitAlts(cellText);
        const person = P.persons[i];
        const en = verbEnglish(v, par, i);
        const id = `c:${v.inf}:${par}:${i}`;
        const cell = { verb: v.inf, par, i, forms, en, conjId: id };
        vCells.push(cell);
        push(vCellsByVerb, v.inf, cell);
        const c = add({
          id,
          kind: 'conj',
          group: `c:${v.inf}:${par}`,
          level: P.level,
          skill: P.skill,
          verb: v.inf,
          cell,
          label: 'Conjugate',
          q: { text: v.inf, lang: 'hu', chips: [person, P.title], cue: en },
          a: { text: forms.join(' / '), lang: 'hu', sub: `${v.inf} · ${person} · ${P.title}`, note: v.note || '' },
          answers: answersFor(forms),
          req,
          prior: 0.32 + 0.03 * (P.level - 1),
        });
        if (c) vskill.get(P.skill).cards.push(c);
        if (i === 0 || i === 2) vskill.get(P.skill).examples.push({ base: v.inf, cue: en, answer: forms.join(' / ') });
        const f0 = forms[0];
        if (f0 !== v.s3 && f0 !== v.inf) {
          if (!readings.has(f0)) readings.set(f0, []);
          readings.get(f0).push({ par, i, en, person, title: P.title, level: P.level });
        }
      });
    }
    for (const [form, rs] of readings) {
      readCards.push({
        sort: [Math.min(...rs.map((r) => r.level)), rank],
        card: {
          id: `r:${v.inf}:${form}`,
          kind: 'ident',
          group: `c:${v.inf}:${rs[0].par}`,
          level: Math.max(2, Math.min(...rs.map((r) => r.level))),
          skill: 'v-read',
          verb: v.inf,
          form,
          readings: rs,
          label: 'What does it mean?',
          q: { text: form, lang: 'hu', hint: '' },
          a: {
            text: rs.map((r) => r.en).join(' / '),
            lang: 'en',
            sub: rs.map((r) => `${r.person} · ${r.title}`).join('  /  '),
            note: `${v.inf} = to ${enBase}${rs.length > 1 ? ' — same form, more than one meaning!' : ''}${v.note ? ` · ${v.note}` : ''}`,
          },
          answers: null,
          req,
          prior: 0.28,
        },
      });
    }
  });
  readCards.sort((a, b) => a.sort[0] - b.sort[0] || a.sort[1] - b.sort[1]);
  for (const { card } of readCards) {
    const c = add(card);
    if (c) vskill.get('v-read').cards.push(c);
  }
  skills.forEach((s, i) => (s.idx = i));
  const skillById = new Map(skills.map((s) => [s.id, s]));
  for (const s of skills) for (const a of s.after) if (!skillById.has(a)) problems.push(`Skill ${s.id} needs unknown skill ${a}`);

  // ---------------- look-alikes ----------------
  for (const groupList of CONFUSABLES) {
    const ws = [];
    for (const key of groupList) {
      const [hu, pos] = key.split('|');
      const cand = (huIndex.get(norm(hu)) || []).filter((w) => !pos || w.pos === pos);
      if (!cand.length) problems.push(`Look-alike not found in vocabulary: ${key}`);
      else ws.push(cand[0]);
    }
    for (const w of ws) {
      const others = ws.filter((o) => o !== w);
      w.lookalikes = [...new Set([...(w.lookalikes || []), ...others])];
      for (const dir of ['en', 'hu']) {
        const c = byId.get(`${w.id}>${dir}`);
        if (c) c.confuse = [...new Set([...(c.confuse || []), ...others.map((o) => `${o.id}>${dir}`)])];
      }
    }
  }

  return {
    cards,
    byId,
    words,
    wordById,
    huIndex,
    skills,
    skillById,
    gItems,
    vCells,
    vCellsByVerb,
    vocabOrder,
    wordIdsByLevel,
    problems,
    counts: {
      words: words.length,
      vocabCards: vocabOrder.length,
      grammarCards: cards.length - vocabOrder.length,
      total: cards.length,
    },
  };
}
