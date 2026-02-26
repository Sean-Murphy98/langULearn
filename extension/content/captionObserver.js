var pat = (globalThis.pat = globalThis.pat || {});

let captionObserver = null;
let pendingObserver = null;
let captionContainer = null;

// Watch YouTube caption container for mutations.
function start(getConfig) {
  const container = document.querySelector(".ytp-caption-window-container");
  if (!container) {
    if (pendingObserver) return;
    // Retry attachment when YouTube's SPA DOM inserts the caption container.
    pendingObserver = new MutationObserver(() => {
      const next = document.querySelector(".ytp-caption-window-container");
      if (!next) return;
      pendingObserver.disconnect();
      pendingObserver = null;
      start(getConfig);
    });
    const root = document.body || document.documentElement;
    if (root) {
      pendingObserver.observe(root, { childList: true, subtree: true });
    }
    return;
  }

  if (captionObserver && captionContainer === container) return;
  if (captionObserver) {
    stop();
  }
  captionContainer = container;

  captionObserver = new MutationObserver(() => {
    const spans = document.querySelectorAll(".ytp-caption-segment");
    if (!spans.length) return;
    const videoId = pat.helpers.getVideoId();
    const config = getConfig();
    spans.forEach((span) => pat.captionTranslator.processCaptionSpan(span, videoId, config));
  });

  captionObserver.observe(container, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// Stop observing captions.
function stop() {
  if (!captionObserver) return;
  captionObserver.disconnect();
  captionObserver = null;
  captionContainer = null;
  if (pendingObserver) {
    pendingObserver.disconnect();
    pendingObserver = null;
  }
}

pat.captionObserver = {
  start,
  stop
};
