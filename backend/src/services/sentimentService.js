// ─────────────────────────────────────────────────────────────────────────────
// sentimentService.js
// Branch: ratehub.4
//
// Analyzes review text and classifies it as:
//   positive     → normal review
//   neutral      → normal review
//   negative     → auto-report created
//   very_negative → auto-report + user flagged for admin suspension review
//
// Uses the 'sentiment' npm package (AFINN-165 word list, no API key needed).
// The package returns a `comparative` score = total score / word count,
// which normalises short vs long texts.
//
// Thresholds (tuned for workplace reviews):
//   comparative >= 0.05          → positive
//   -0.05 < comparative < 0.05   → neutral
//   -0.10 <= comparative < -0.05 → negative
//   comparative < -0.10          → very_negative
// ─────────────────────────────────────────────────────────────────────────────

const Sentiment = require('sentiment');

const analyzer = new Sentiment();

// Thresholds
const POSITIVE_THRESHOLD      =  0.05;
const NEGATIVE_THRESHOLD      = -0.05;
const VERY_NEGATIVE_THRESHOLD = -0.10;

/**
 * Analyze text and return sentiment classification.
 *
 * @param {string} text — the review content to analyze
 * @returns {{
 *   label: 'positive'|'neutral'|'negative'|'very_negative',
 *   score: number,          — raw AFINN score (sum of matched words)
 *   comparative: number,    — normalized score (score / word count)
 *   tokens: string[],       — all words found
 *   positive: string[],     — positive words matched
 *   negative: string[],     — negative words matched
 * }}
 */
function analyzeText(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { label: 'neutral', score: 0, comparative: 0, tokens: [], positive: [], negative: [] };
  }

  const result = analyzer.analyze(text);

  let label;
  if (result.comparative >= POSITIVE_THRESHOLD) {
    label = 'positive';
  } else if (result.comparative >= NEGATIVE_THRESHOLD) {
    label = 'neutral';
  } else if (result.comparative >= VERY_NEGATIVE_THRESHOLD) {
    label = 'negative';
  } else {
    label = 'very_negative';
  }

  return {
    label,
    score:       result.score,
    comparative: result.comparative,
    tokens:      result.tokens,
    positive:    result.positive,
    negative:    result.negative,
  };
}

/**
 * Should this review trigger an auto-report?
 * true for 'negative' and 'very_negative'
 */
function shouldAutoReport(label) {
  return label === 'negative' || label === 'very_negative';
}

/**
 * Should this review trigger a pending suspension flag on the author?
 * true only for 'very_negative'
 */
function shouldFlagForSuspension(label) {
  return label === 'very_negative';
}

module.exports = { analyzeText, shouldAutoReport, shouldFlagForSuspension };
