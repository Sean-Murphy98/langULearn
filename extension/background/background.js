importScripts(
  "../utils/constants.js",
  "../utils/helpers.js",
  "../utils/storage.js",
  "../utils/translate.js"
);

async function updateAnalytics(mutator) {
  const current = await pat.storage.getAnalytics();
  const next = mutator({
    ...current,
    languageWatchSeconds: { ...(current.languageWatchSeconds || {}) },
    survey: {
      ...(pat.constants.analyticsDefaults.survey || {}),
      ...(current.survey || {})
    },
    seenVideoIds: { ...(current.seenVideoIds || {}) }
  });
  next.lastUpdatedAt = new Date().toISOString();
  await pat.storage.setAnalytics(next);
  return next;
}

async function adjustPercent(understood) {
  const cfg = await pat.storage.getConfig();
  const delta = understood ? -cfg.step : cfg.step;
  const next = pat.helpers.clamp(
    cfg.percent + delta,
    cfg.minPercent,
    cfg.maxPercent
  );
  await pat.storage.setConfig({ percent: next });
  return next;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || !msg.type) return;

  if (msg.type === "TRANSLATE") {
    const { text, targetLang } = msg;
    pat.translate
      .translateText(text, targetLang)
      .then((translated) => sendResponse({ ok: true, translated }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (msg.type === "SURVEY_RESULT") {
    const understood = Boolean(msg.understood);
    Promise.all([
      adjustPercent(understood),
      updateAnalytics((analytics) => {
        analytics.survey.total += 1;
        if (understood) analytics.survey.understood += 1;
        else analytics.survey.notUnderstood += 1;
        return analytics;
      })
    ])
      .then(([next]) => sendResponse({ ok: true, percent: next }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (msg.type === "OPEN_SURVEY") {
    const url = chrome.runtime.getURL(pat.constants.surveyPath);
    chrome.tabs.create({ url }, () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "OPEN_ANALYTICS") {
    const url = chrome.runtime.getURL(pat.constants.analyticsPath);
    chrome.tabs.create({ url }, () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "ANALYTICS_WATCH_TICK") {
    const seconds = pat.helpers.clamp(Number(msg.seconds) || 0, 0, 300);
    const targetLang = String(msg.targetLang || "").trim() || "unknown";
    const videoId = String(msg.videoId || "").trim();
    if (!seconds) {
      sendResponse({ ok: true });
      return;
    }

    updateAnalytics((analytics) => {
      analytics.totalWatchSeconds += seconds;
      analytics.languageWatchSeconds[targetLang] =
        (analytics.languageWatchSeconds[targetLang] || 0) + seconds;
      if (videoId) {
        analytics.seenVideoIds[videoId] = true;
      }
      return analytics;
    })
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});
