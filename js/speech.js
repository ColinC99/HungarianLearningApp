// Hungarian text-to-speech using the phone's built-in voice (Google TTS has Hungarian).

let huVoice = null;
let listeners = [];

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  huVoice = voices.find((v) => /^hu([-_]|$)/i.test(v.lang)) || null;
  listeners.forEach((fn) => fn());
}

export function initSpeech(onChange) {
  if (!('speechSynthesis' in window)) return;
  if (onChange) listeners.push(onChange);
  pickVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export const speechSupported = () => 'speechSynthesis' in window;
export const hasHungarianVoice = () => !!huVoice;

export function speak(text) {
  if (!speechSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/\s*\/\s*/g, ', '));
  u.lang = 'hu-HU';
  if (huVoice) u.voice = huVoice;
  u.rate = 0.9;
  synth.speak(u);
}
