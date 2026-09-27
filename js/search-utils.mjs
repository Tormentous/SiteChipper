export function searchWords(value) {
 return [...new Set((String(value||'').normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(word=>word.length>=2).map(word=>word.slice(0,48)))].slice(0,100);
}
export function searchTokens(value) { return searchWords(value); }
