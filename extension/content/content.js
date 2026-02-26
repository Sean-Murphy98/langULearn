var pat = (globalThis.pat = globalThis.pat || {});

let config = { ...(pat.constants ? pat.constants.defaults : {}) };
let lastUrl = location.href;
let lastSurveyVideoId = "";

// Ensure observer is attached once captions are present.
function ensureCaptionObserver() {
  pat.captionObserver.start(() => config);
}

// Trigger survey when a video ends (once per video).
function attachVideoEndListener() {
  const video = document.querySelector("video");
  if (!video) return;
  if (video.dataset.patEndListener === "1") return;
  video.dataset.patEndListener = "1";

  video.addEventListener("ended", () => {
    const videoId = pat.helpers.getVideoId();
    if (!videoId || videoId === lastSurveyVideoId) return;
    lastSurveyVideoId = videoId;
    chrome.runtime.sendMessage({ type: "OPEN_SURVEY", videoId });
  });
}

// Reset per-video state.
function resetForNewVideo() {
  pat.captionTranslator.resetCache();
  lastSurveyVideoId = "";
}

// Detect SPA navigation changes on YouTube.
function watchUrlChanges() {
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      resetForNewVideo();
      pat.captionObserver.stop();
      ensureCaptionObserver();
      attachVideoEndListener();
    }
  }, 800);
}

// Re-ensure observers during ad playback or SPA swaps.
function watchPlayerChanges() {
  setInterval(() => {
    ensureCaptionObserver();
    attachVideoEndListener();
  }, 2000);
}

// Load config and start observers once.
pat.storage.getConfig().then((cfg) => {
  config = { ...config, ...cfg };
  ensureCaptionObserver();
  attachVideoEndListener();
  watchUrlChanges();
  watchPlayerChanges();
});

// Keep config in sync with popup changes.
pat.storage.onConfigChange((changes) => {
  const next = { ...config };
  Object.keys(changes).forEach((key) => {
    next[key] = changes[key].newValue;
  });
  config = next;
});

// Some videos load captions after initial DOM ready.
setTimeout(() => {
  pat.captionObserver.stop();
  ensureCaptionObserver();
  attachVideoEndListener();
}, 1500);
