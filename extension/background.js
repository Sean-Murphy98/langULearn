const LIBRE_TRANSLATE_URL = "https://libretranslate.de/translate";

async function translateText(text, targetLang) {
  const body = {
    q: text,
    source: "auto",
    target: targetLang,
    format: "text"
  };

  const res = await fetch(LIBRE_TRANSLATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Translate failed: ${res.status} ${msg}`);
  }

  const data = await res.json();
  return data.translatedText || "";
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "TRANSLATE") return;

  const { text, targetLang } = msg;
  translateText(text, targetLang)
    .then((translated) => sendResponse({ ok: true, translated }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));

  return true; // async response
});
