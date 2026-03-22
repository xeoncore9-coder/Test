const store = require('./store');

// Simple Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
  const matrix = [];
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  for (let i = 0; i <= bLen; i++) matrix[i] = [i];
  for (let j = 0; j <= aLen; j++) matrix[0][j] = j;

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[bLen][aLen];
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
  return Math.round((1 - dist / maxLen) * 100);
}

function findMatches(sourceText, minMatch = 50, maxResults = 5) {
  const matches = [];

  for (const entry of store.tm) {
    const score = similarity(sourceText, entry.source);
    if (score >= minMatch) {
      matches.push({ ...entry, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, maxResults);
}

function addEntry(source, target, sourceLang, targetLang) {
  // Check for existing exact match and update
  const existing = store.tm.find(
    (e) => e.source === source && e.sourceLang === sourceLang && e.targetLang === targetLang
  );

  if (existing) {
    existing.target = target;
    existing.updatedAt = new Date().toISOString();
  } else {
    store.tm.push({
      source,
      target,
      sourceLang,
      targetLang,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  store.saveTM();
}

module.exports = { findMatches, addEntry, similarity };
