const defaults = {
  targetLang: "es",
  percent: 30,
  step: 5,
  minPercent: 10,
  maxPercent: 80
};

let config = { ...defaults };
let captionObserver = null;
let lastUrl = location.href;
let translationCache = new Map();
let overlayEl = null;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getVideoId() {
  const url = new URL(location.href);
  return url.searchParams.get("v") || "";
}

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash) >>> 0;
}

function shouldTranslate(sentence, videoId, percent) {
  if (percent <= 0) return false;
  if (percent >= 100) return true;
  const h = hashString(`${videoId}::${sentence}`) % 100;
  return h < percent;
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function translateSentence(sentence) {
  if (!sentence) return Promise.resolve(sentence);
  const cached = translationCache.get(sentence);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "TRANSLATE", text: sentence, targetLang: config.targetLang },
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

async function processCaptionSpan(span, videoId) {
  const original = span.textContent || "";
  if (!original.trim()) return;
  if (span.dataset.patProcessed === original) return;

  // Mark original so we can avoid reprocessing the same caption
  span.dataset.patOriginal = original;

  const sentences = splitSentences(original);
  if (!sentences.length) return;

  const translatedParts = await Promise.all(
    sentences.map(async (s) => {
      if (!shouldTranslate(s, videoId, config.percent)) return s;
      return translateSentence(s);
    })
  );
  console.log(`Original caption: "${original}" => Translated parts:`, translatedParts);
  span.textContent = translatedParts.join(" ");
  console.log(`Translated caption: "${original}" => "${span.textContent}"`);
  // Mark the translated text to avoid reprocessing our own mutation
  span.dataset.patProcessed = span.textContent;
}

function startCaptionObserver() {
  if (captionObserver) return;

  const container = document.body;
  captionObserver = new MutationObserver(() => {
    const spans = document.querySelectorAll(".ytp-caption-segment");
    if (!spans.length) return;
    const videoId = getVideoId();
    spans.forEach((span) => processCaptionSpan(span, videoId));
  });

  captionObserver.observe(container, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function stopCaptionObserver() {
  if (captionObserver) {
    captionObserver.disconnect();
    captionObserver = null;
  }
}

function renderSurvey() {
  if (overlayEl) return;

  overlayEl = document.createElement("div");
  overlayEl.style.cssText = `
    position: fixed;
    right: 24px;
    bottom: 24px;
    background: rgba(20, 20, 20, 0.95);
    color: #fff;
    padding: 14px 16px;
    border-radius: 12px;
    z-index: 999999;
    max-width: 320px;
    font-family: Arial, sans-serif;
  `;

  overlayEl.innerHTML = `
    <div style="font-size:14px; margin-bottom:10px;">
      Did you fully understand the entire video?
    </div>
    <div style="display:flex; gap:8px;">
      <button data-answer="yes" style="flex:1; padding:6px 8px;">Yes</button>
      <button data-answer="no" style="flex:1; padding:6px 8px;">No</button>
    </div>
  `;

  overlayEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-answer]");
    if (!btn) return;
    const answer = btn.dataset.answer;
    adjustPercent(answer === "yes");
    overlayEl.remove();
    overlayEl = null;
  });

  document.body.appendChild(overlayEl);
}

function adjustPercent(understood) {
  const delta = understood ? -config.step : config.step;
  const next = clamp(config.percent + delta, config.minPercent, config.maxPercent);
  config.percent = next;
  chrome.storage.local.set({ percent: next });
}

function attachVideoEndListener() {
  const video = document.querySelector("video");
  if (!video) return;
  if (video.dataset.patEndListener === "1") return;
  video.dataset.patEndListener = "1";

  video.addEventListener("ended", () => {
    renderSurvey();
  });
}

function resetForNewVideo() {
  translationCache = new Map();
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
}

function watchUrlChanges() {
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      resetForNewVideo();
      attachVideoEndListener();
    }
  }, 800);
}

chrome.storage.local.get(defaults, (cfg) => {
  config = { ...defaults, ...cfg };
  startCaptionObserver();
  attachVideoEndListener();
  watchUrlChanges();
});

chrome.storage.onChanged.addListener((changes) => {
  const next = { ...config };
  Object.keys(changes).forEach((key) => {
    next[key] = changes[key].newValue;
  });
  config = next;
});

// Some videos take time to load video element and captions.
setTimeout(() => {
  startCaptionObserver();
  attachVideoEndListener();
}, 1500);
