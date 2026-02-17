const GOOGLE_TRANSLATE_URL =
  "https://translation.googleapis.com/language/translate/v2";

function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ apiKey: "" }, (cfg) => {
      resolve(cfg.apiKey || "");
    });
  });
}

async function translateText(text, targetLang) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("Missing Google Translate API key.");
  }

  const body = {
    q: text,
    target: targetLang,
    format: "text"
  };

  const res = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Translate failed: ${res.status} ${msg}`);
  }

  const data = await res.json();
  const translated =
    data &&
    data.data &&
    Array.isArray(data.data.translations) &&
    data.data.translations[0] &&
    data.data.translations[0].translatedText;
  return translated || "";
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "TRANSLATE") return;

  const { text, targetLang } = msg;
  translateText(text, targetLang)
    .then((translated) => sendResponse({ ok: true, translated }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));

  return true; // async response
});
