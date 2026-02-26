importScripts(
  "../utils/constants.js",
  "../utils/helpers.js",
  "../utils/storage.js",
  "../utils/translate.js"
);

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
    adjustPercent(understood)
      .then((next) => sendResponse({ ok: true, percent: next }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (msg.type === "OPEN_SURVEY") {
    const url = chrome.runtime.getURL(pat.constants.surveyPath);
    chrome.tabs.create({ url }, () => sendResponse({ ok: true }));
    return true;
  }
});
