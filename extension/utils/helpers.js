var pat = (globalThis.pat = globalThis.pat || {});

// Clamp values to avoid invalid ranges.
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Extract the current YouTube video ID.
function getVideoId() {
  const url = new URL(location.href);
  return url.searchParams.get("v") || "";
}

// Stable hash for deterministic sampling.
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash) >>> 0;
}

// Decide whether a sentence should be translated based on percent.
function shouldTranslate(sentence, videoId, percent) {
  if (percent <= 0) return false;
  if (percent >= 100) return true;
  const h = hashString(`${videoId}::${sentence}`) % 100;
  return h < percent;
}

// Basic sentence splitter for caption lines.
function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

pat.helpers = {
  clamp,
  getVideoId,
  hashString,
  shouldTranslate,
  splitSentences
};

// Allow unit tests in Node without affecting extension runtime.
if (typeof module !== "undefined") {
  module.exports = pat.helpers;
}
