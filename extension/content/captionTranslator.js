var pat = (globalThis.pat = globalThis.pat || {});

let translationCache = new Map();
let budgetByVideoId = new Map();

// Translate with per-session caching to avoid repeat API calls.
function translateSentence(sentence, targetLang) {
  if (!sentence) return Promise.resolve(sentence);
  const cached = translationCache.get(sentence);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "TRANSLATE", text: sentence, targetLang },
      (resp) => {
        if (resp && resp.ok && resp.translated) {
          translationCache.set(sentence, resp.translated);
          resolve(resp.translated);
        } else {
          resolve(sentence);
        }
      }
    );
  });
}

// Smooth selection by maintaining a rolling translation budget per video.
function shouldTranslateWithBudget(videoId, percent) {
  const increment = percent / 100;
  const current = budgetByVideoId.get(videoId) || 0;
  const next = current + increment;
  if (next >= 1) {
    budgetByVideoId.set(videoId, next - 1);
    return true;
  }
  budgetByVideoId.set(videoId, next);
  return false;
}

// Translate selected sentences in a caption span.
async function processCaptionSpan(span, videoId, config) {
  const original = span.textContent || "";
  if (!original.trim()) return;
  if (span.dataset.patProcessed === original) return;

  span.dataset.patOriginal = original;

  const sentences = pat.helpers.splitSentences(original);
  if (!sentences.length) return;

  const translatedParts = await Promise.all(
    sentences.map(async (s) => {
      if (!shouldTranslateWithBudget(videoId, config.percent)) return s;
      return translateSentence(s, config.targetLang);
    })
  );
  span.textContent = translatedParts.join(" ");
  span.dataset.patProcessed = span.textContent;
}

// Clear translation cache on video change.
function resetCache() {
  translationCache = new Map();
  budgetByVideoId = new Map();
}

pat.captionTranslator = {
  processCaptionSpan,
  resetCache
};
