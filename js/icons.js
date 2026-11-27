// Inline SVG icons (24×24, drawn with currentColor).
const svg = (body, width = 2) =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICON = {
  cards: svg('<rect x="3" y="7" width="13" height="14" rx="2.5"/><path d="M8 3.5h10.5A2.5 2.5 0 0 1 21 6v11"/>'),
  chart: svg('<path d="M3 21h18"/><rect x="5" y="11" width="3" height="7" rx="1"/><rect x="10.5" y="6" width="3" height="12" rx="1"/><rect x="16" y="13" width="3" height="5" rx="1"/>'),
  book: svg('<path d="M2 4.5h6a4 4 0 0 1 4 4V21a3 3 0 0 0-3-3H2z"/><path d="M22 4.5h-6a4 4 0 0 0-4 4V21a3 3 0 0 1 3-3h7z"/>'),
  sliders: svg('<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'),
  speaker: svg('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'),
  undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  flame: svg('<path d="M12 22c4 0 7-2.9 7-7 0-3.2-2-5.6-3.6-7.2-.4 1.9-1.4 3-2.9 3.4C13 8 12 5 9.3 2.5 9.4 6.6 5 9 5 14.8 5 19 8 22 12 22z"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>', 3),
  cross: svg('<path d="M18 6 6 18M6 6l12 12"/>', 3),
  lock: svg('<rect x="4.5" y="11" width="15" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>'),
  logo:
    '<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><rect x="7" y="4" width="20" height="24" rx="4" fill="#2e7d5b" transform="rotate(8 17 16)"/><rect x="4" y="5" width="20" height="24" rx="4" fill="#fffdf8" stroke="#1c2421" stroke-width="1.6" transform="rotate(-6 14 17)"/><text x="14" y="23.5" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="17" fill="#c63d4b" transform="rotate(-6 14 17)">ő</text></svg>',
};
