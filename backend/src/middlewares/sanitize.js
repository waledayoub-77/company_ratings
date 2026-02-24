const xss = require('xss');

/**
 * XSS options — strip all HTML tags, keep plain text only.
 * This is appropriate for a JSON API that never renders HTML server-side.
 */
const xssOptions = {
  whiteList: {},        // no tags allowed
  stripIgnoreTag: true, // strip any tag not in whitelist
  stripIgnoreTagBody: ['script', 'style'], // strip content of <script> and <style> entirely
};

/**
 * Recursively sanitize a value:
 *  - strings → trimmed + HTML-stripped
 *  - arrays  → each element sanitized
 *  - objects → each value sanitized
 *  - other   → returned as-is (numbers, booleans, null, undefined)
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return xss(value.trim(), xssOptions);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
};

const sanitizeObject = (obj) => {
  const clean = {};
  for (const key of Object.keys(obj)) {
    clean[key] = sanitizeValue(obj[key]);
  }
  return clean;
};

/**
 * Express middleware: sanitizes req.body against XSS.
 * Apply after express.json() / express.urlencoded() in app.js.
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Utility: strip PostgREST filter-injection characters from a search string.
 * PostgREST .or() filters use dot-notation and commas for logic — injecting
 * those characters could alter the filter tree. Strip them from free-text inputs.
 *
 * Characters stripped: ( ) , \n \r and leading/trailing whitespace.
 */
const sanitizeSearch = (value) => {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/[(),\r\n]/g, '') // remove PostgREST special chars
    .substring(0, 100);        // cap length
};

module.exports = { sanitizeBody, sanitizeSearch };
