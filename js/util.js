// Small shared helpers: DOM building, text normalisation, formatting.

/** Create a DOM element: h('div', { class: 'x', onClick: fn }, 'text', child, [more]) */
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false || kid === '') continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** Local calendar day key, e.g. 2026-11-27 */
export function dayKey(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Strip accents + lowercase: "Őszi" -> "oszi" (for search and accent-slip detection) */
export function fold(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Normalise an answer for comparison: lowercase, no punctuation, single spaces. Keeps accents. */
export function norm(s) {
  return String(s)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,!?¿¡;:"'’‘“”„«»…()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Stable 32-bit hash of a string (FNV-1a) */
export function hash32(str) {
  let x = 2166136261;
  for (let i = 0; i < str.length; i++) {
    x ^= str.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return x >>> 0;
}
export const hash01 = (s) => hash32(s) / 4294967296;

/** Human-friendly duration from hours */
export function fmtHours(hrs) {
  if (hrs < 1) return `${Math.max(1, Math.round(hrs * 60))} min`;
  if (hrs < 24) return `${Math.round(hrs)} h`;
  const d = hrs / 24;
  if (d < 14) {
    const r = Math.round(d);
    return `${r} day${r === 1 ? '' : 's'}`;
  }
  if (d < 60) return `${Math.round(d / 7)} weeks`;
  if (d < 365) return `${Math.round(d / 30)} months`;
  return `${(d / 365).toFixed(1)} years`;
}

/** "a; b; c" -> "a, b, c" for display */
export const showEn = (en) => String(en).split(';').map((s) => s.trim()).filter(Boolean).join(', ');

export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
