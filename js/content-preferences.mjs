// Device-only preferences. No regex supplied by a user is executed.
export const MUTED_KEY = 'cb_muted_words_v1';
export function normalizeMuted(value) {
  return [...new Set(String(value).normalize('NFKC').split(/\r?\n/).map(s => s.trim().toLocaleLowerCase()).filter(Boolean))].slice(0, 100);
}
export function readMuted(storage = globalThis.localStorage) {
  try { return normalizeMuted(storage.getItem(MUTED_KEY) || ''); } catch { return []; }
}
export function matchesMuted(text, words = readMuted()) {
  const normalized = String(text || '').normalize('NFKC').toLocaleLowerCase();
  return words.some(word => normalized.includes(word));
}
