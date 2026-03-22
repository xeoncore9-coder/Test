const { v4: uuidv4 } = require('uuid');

// Sentence boundary detection - handles common abbreviations and edge cases
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'ave', 'blvd',
  'dept', 'est', 'fig', 'govt', 'inc', 'ltd', 'corp', 'vs', 'etc',
  'approx', 'apt', 'assn', 'assoc', 'bros', 'co', 'ed', 'eg', 'ie',
  'no', 'vol', 'rev', 'gen', 'sgt', 'cpl', 'pvt', 'capt', 'lt', 'col',
]);

function segmentText(text) {
  if (!text || !text.trim()) return [];

  const segments = [];
  // Split by sentence-ending punctuation followed by whitespace + uppercase, or by newlines
  const rawSegments = splitIntoSentences(text);

  for (const raw of rawSegments) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    segments.push({
      id: uuidv4(),
      source: trimmed,
      target: '',
      status: 'draft', // draft | translated | confirmed
      locked: false,
      comment: '',
    });
  }

  return segments;
}

function splitIntoSentences(text) {
  const sentences = [];
  let current = '';

  // First split by double newlines (paragraph boundaries)
  const paragraphs = text.split(/\n\s*\n/);

  for (const paragraph of paragraphs) {
    const lines = paragraph.split(/\n/);
    const joined = lines.join(' ');

    // Split sentences within paragraph
    const chars = [...joined];
    current = '';

    for (let i = 0; i < chars.length; i++) {
      current += chars[i];

      if ('.!?'.includes(chars[i])) {
        // Check for ellipsis
        if (chars[i] === '.' && chars[i + 1] === '.' && chars[i + 2] === '.') {
          continue;
        }

        // Check for abbreviation
        const wordBefore = getWordBefore(current.slice(0, -1));
        if (wordBefore && ABBREVIATIONS.has(wordBefore.toLowerCase())) {
          continue;
        }

        // Check for decimal numbers
        if (chars[i] === '.' && chars[i + 1] && /\d/.test(chars[i + 1])) {
          continue;
        }

        // Handle closing quotes/brackets after punctuation
        while (chars[i + 1] && '"\')]}»"\''.includes(chars[i + 1])) {
          i++;
          current += chars[i];
        }

        // If next char is whitespace followed by uppercase or end of text, split
        const next = chars[i + 1];
        const nextNext = chars[i + 2];
        if (!next || (next && /\s/.test(next) && (!nextNext || /[A-Z\u00C0-\u024F"'(\[«"]/.test(nextNext)))) {
          sentences.push(current.trim());
          current = '';
          if (next && /\s/.test(next)) i++; // skip the whitespace
        }
      }
    }

    if (current.trim()) {
      sentences.push(current.trim());
      current = '';
    }
  }

  return sentences;
}

function getWordBefore(text) {
  const match = text.match(/(\w+)$/);
  return match ? match[1] : null;
}

module.exports = { segmentText };
