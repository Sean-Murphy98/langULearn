var pat = (globalThis.pat = globalThis.pat || {});

let config = { ...(pat.constants ? pat.constants.defaults : {}) };
let lastUrl = location.href;
let lastSurveyVideoId = "";
let watchTickerId = null;
let pendingWatchSeconds = 0;

function stopWatchTicker() {
  if (!watchTickerId) return;
  clearInterval(watchTickerId);
  watchTickerId = null;
}

function flushWatchTime() {
  if (!pendingWatchSeconds) return;
  const videoId = pat.helpers.getVideoId();
  chrome.runtime.sendMessage({
    type: "ANALYTICS_WATCH_TICK",
    seconds: pendingWatchSeconds,
    videoId,
    targetLang: config.targetLang
  });
  pendingWatchSeconds = 0;
}

function attachWatchTimeTracker() {
  const video = document.querySelector("video");
  if (!video) return;
  if (video.dataset.patWatchTracker === "1") return;
  video.dataset.patWatchTracker = "1";

  const startTicker = () => {
    if (watchTickerId) return;
    watchTickerId = setInterval(() => {
      if (video.paused || video.ended || video.readyState < 2) return;
      pendingWatchSeconds += 5;
      if (pendingWatchSeconds >= 15) {
        flushWatchTime();
      }
    }, 5000);
  };

  const stopTicker = () => {
    stopWatchTicker();
    flushWatchTime();
  };

  video.addEventListener("play", startTicker);
  video.addEventListener("pause", stopTicker);
  video.addEventListener("ended", () => {
    stopTicker();
  });

  if (!video.paused && !video.ended) {
    startTicker();
  }
}

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
  stopWatchTicker();
  flushWatchTime();
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
      attachWatchTimeTracker();
    }
  }, 800);
}

// Re-ensure observers during ad playback or SPA swaps.
function watchPlayerChanges() {
  setInterval(() => {
    ensureCaptionObserver();
    attachVideoEndListener();
    attachWatchTimeTracker();
  }, 2000);
}

// Load config and start observers once.
pat.storage.getConfig().then((cfg) => {
  config = { ...config, ...cfg };
  ensureCaptionObserver();
  attachVideoEndListener();
  attachWatchTimeTracker();
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
  attachWatchTimeTracker();
}, 1500);

window.addEventListener("beforeunload", flushWatchTime);
