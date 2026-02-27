const defaults = pat.constants.defaults;

const els = {
  targetLang: document.getElementById("targetLang"),
  langStatus: document.getElementById("langStatus"),
  apiKey: document.getElementById("apiKey"),
  toggleApiKey: document.getElementById("toggleApiKey"),
  testKey: document.getElementById("testKey"),
  testStatus: document.getElementById("testStatus"),
  translationEnabled: document.getElementById("translationEnabled"),
  percent: document.getElementById("percent"),
  percentValue: document.getElementById("percentValue"),
  step: document.getElementById("step"),
  minPercent: document.getElementById("minPercent"),
  maxPercent: document.getElementById("maxPercent"),
  save: document.getElementById("save"),
  reset: document.getElementById("reset"),
  openAnalytics: document.getElementById("openAnalytics"),
  status: document.getElementById("status")
};

function syncTranslationControls() {
  const enabled = Boolean(els.translationEnabled.checked);
  els.percent.disabled = !enabled;
  els.step.disabled = !enabled;
  els.minPercent.disabled = !enabled;
  els.maxPercent.disabled = !enabled;
}

function syncPercentBounds() {
  const minVal = pat.helpers.clamp(Number(els.minPercent.value), 0, 100);
  const maxVal = pat.helpers.clamp(Number(els.maxPercent.value), 0, 100);
  els.percent.min = String(minVal);
  els.percent.max = String(maxVal);

  const percentVal = pat.helpers.clamp(Number(els.percent.value), minVal, maxVal);
  if (Number(els.percent.value) !== percentVal) {
    els.percent.value = String(percentVal);
  }
  els.percentValue.textContent = `${els.percent.value}%`;
}

function syncMinMaxBounds() {
  const minVal = pat.helpers.clamp(Number(els.minPercent.value), 0, 100);
  const maxVal = pat.helpers.clamp(Number(els.maxPercent.value), 0, 100);

  els.minPercent.min = "0";
  els.minPercent.max = String(maxVal);
  els.maxPercent.min = String(minVal);
  els.maxPercent.max = "100";

  if (Number(els.minPercent.value) !== minVal) {
    els.minPercent.value = String(minVal);
  }
  if (Number(els.maxPercent.value) !== maxVal) {
    els.maxPercent.value = String(maxVal);
  }
}

function normalizeMinMaxInputs() {
  const minVal = pat.helpers.clamp(Number(els.minPercent.value), 0, 100);
  const maxVal = pat.helpers.clamp(Number(els.maxPercent.value), 0, 100);
  const nextMin = Math.min(minVal, maxVal);
  const nextMax = Math.max(minVal, maxVal);
  els.minPercent.value = String(nextMin);
  els.maxPercent.value = String(nextMax);
  syncMinMaxBounds();
  syncPercentBounds();
}

function load() {
  pat.storage.getConfig().then((cfg) => {
    els.targetLang.value = cfg.targetLang;
    els.apiKey.value = cfg.apiKey;
    els.translationEnabled.checked = cfg.translationEnabled !== false;
    els.percent.value = cfg.percent;
    els.step.value = cfg.step;
    els.minPercent.value = cfg.minPercent;
    els.maxPercent.value = cfg.maxPercent;
    els.percentValue.textContent = `${cfg.percent}%`;
    syncTranslationControls();
    syncMinMaxBounds();
    syncPercentBounds();
    loadLanguages(cfg.apiKey, cfg.targetLang);
  });
}

function save() {
  const percent = pat.helpers.clamp(Number(els.percent.value), 0, 100);
  const minPercent = pat.helpers.clamp(Number(els.minPercent.value), 0, 100);
  const maxPercent = pat.helpers.clamp(Number(els.maxPercent.value), 0, 100);
  const step = pat.helpers.clamp(Number(els.step.value), 1, 20);

  const cfg = {
    targetLang: els.targetLang.value.trim() || defaults.targetLang,
    apiKey: els.apiKey.value.trim(),
    translationEnabled: Boolean(els.translationEnabled.checked),
    percent,
    step,
    minPercent: Math.min(minPercent, maxPercent),
    maxPercent: Math.max(minPercent, maxPercent)
  };

  pat.storage.setConfig(cfg).then(() => {
    els.status.textContent = "Saved.";
    setTimeout(() => (els.status.textContent = ""), 1200);
  });

  if (!cfg.translationEnabled){
    chrome.action.setBadgeText({text: "off"})
  }
  else{
    chrome.action.setBadgeText({text: ""})
  }
}

els.percent.addEventListener("input", () => {
  els.percentValue.textContent = `${els.percent.value}%`;
});

els.toggleApiKey.addEventListener("click", () => {
  const isPassword = els.apiKey.type === "password";
  els.apiKey.type = isPassword ? "text" : "password";
  els.toggleApiKey.textContent = isPassword ? "Hide" : "Show";
});

els.minPercent.addEventListener("input", normalizeMinMaxInputs);
els.maxPercent.addEventListener("input", normalizeMinMaxInputs);
els.translationEnabled.addEventListener("change", syncTranslationControls);

els.save.addEventListener("click", save);
els.reset.addEventListener("click", () => {
  pat.storage.setConfig(defaults).then(load);
});
els.openAnalytics.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "OPEN_ANALYTICS" });
});

async function testApiKey() {
  const key = els.apiKey.value.trim();
  if (!key) {
    els.testStatus.textContent = "Enter an API key first.";
    return;
  }

  els.testStatus.textContent = "Testing...";
  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: "Hello", target: "es", format: "text" })
      }
    );

    if (!res.ok) {
      const msg = await res.text();
      els.testStatus.textContent = `Failed: ${res.status} ${msg}`;
      return;
    }

    const data = await res.json();
    const translated =
      data &&
      data.data &&
      Array.isArray(data.data.translations) &&
      data.data.translations[0] &&
      data.data.translations[0].translatedText;

    if (translated) {
      els.testStatus.textContent = "Success: key is valid.";
      loadLanguages(key, els.targetLang.value);
    } else {
      els.testStatus.textContent = "Unexpected response; check API setup.";
    }
  } catch (err) {
    els.testStatus.textContent = `Error: ${String(err)}`;
  }
}

els.testKey.addEventListener("click", testApiKey);

async function loadLanguages(apiKey, selected) {
  els.langStatus.textContent = "";
  els.targetLang.innerHTML = "";

  if (!apiKey) {
    els.langStatus.textContent = "Enter an API key to load languages.";
    const opt = document.createElement("option");
    opt.value = defaults.targetLang;
    opt.textContent = defaults.targetLang;
    els.targetLang.appendChild(opt);
    els.targetLang.value = selected || defaults.targetLang;
    return;
  }

  els.langStatus.textContent = "Loading languages...";
  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2/languages?target=en&key=${encodeURIComponent(
        apiKey
      )}`
    );
    if (!res.ok) {
      const msg = await res.text();
      els.langStatus.textContent = `Failed to load: ${res.status} ${msg}`;
      return;
    }
    const data = await res.json();
    const langs = data && data.data && data.data.languages;
    if (!Array.isArray(langs) || !langs.length) {
      els.langStatus.textContent = "No languages returned.";
      return;
    }

    langs.forEach((lang) => {
      const opt = document.createElement("option");
      opt.value = lang.language;
      opt.textContent = `${lang.name} (${lang.language})`;
      els.targetLang.appendChild(opt);
    });

    els.targetLang.value = selected || defaults.targetLang;
    els.langStatus.textContent = "";
  } catch (err) {
    els.langStatus.textContent = `Error: ${String(err)}`;
  }
}

load();
