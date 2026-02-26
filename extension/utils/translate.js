var pat = (globalThis.pat = globalThis.pat || {});

const GOOGLE_TRANSLATE_URL =
  "https://translation.googleapis.com/language/translate/v2";

// Resolve API key from local storage.
async function getApiKey() {
  const cfg = await pat.storage.getConfig();
  return cfg.apiKey || "";
}

// Call Google Translate API v2 for a single text.
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

pat.translate = {
  translateText
};
