var pat = (globalThis.pat = globalThis.pat || {});

// Read full config with defaults applied.
function getConfig() {
  const defaults = pat.constants && pat.constants.defaults ? pat.constants.defaults : {};
  return new Promise((resolve) => {
    chrome.storage.local.get(defaults, (cfg) => resolve(cfg));
  });
}

// Persist a partial config update.
function setConfig(cfg) {
  return new Promise((resolve) => {
    chrome.storage.local.set(cfg, () => resolve());
  });
}

// Read analytics state with defaults applied.
function getAnalytics() {
  const defaults =
    pat.constants && pat.constants.analyticsDefaults
      ? pat.constants.analyticsDefaults
      : {};
  return new Promise((resolve) => {
    chrome.storage.local.get({ analytics: defaults }, (data) => {
      resolve(data.analytics || defaults);
    });
  });
}

// Persist analytics state.
function setAnalytics(analytics) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ analytics }, () => resolve());
  });
}

// Read cached quiz word pairs.
function getQuizWordPairs() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ quizWordPairs: [] }, (data) => {
      resolve(Array.isArray(data.quizWordPairs) ? data.quizWordPairs : []);
    });
  });
}

// Add recent quiz word pairs with dedupe and a small rolling limit.
function addQuizWordPairs(pairs) {
  const nextPairs = Array.isArray(pairs) ? pairs : [];
  if (!nextPairs.length) return Promise.resolve([]);

  return new Promise((resolve) => {
    chrome.storage.local.get({ quizWordPairs: [] }, (data) => {
      const existing = Array.isArray(data.quizWordPairs) ? data.quizWordPairs : [];
      const merged = [...existing];
      const indexByKey = new Map();

      merged.forEach((pair, idx) => {
        if (!pair || !pair.source || !pair.target) return;
        indexByKey.set(`${pair.source.toLowerCase()}::${pair.target.toLowerCase()}`, idx);
      });

      nextPairs.forEach((pair) => {
        if (!pair || !pair.source || !pair.target) return;
        const source = String(pair.source).trim();
        const target = String(pair.target).trim();
        if (!source || !target) return;
        const item = {
          source,
          target,
          updatedAt: new Date().toISOString()
        };
        const key = `${source.toLowerCase()}::${target.toLowerCase()}`;
        if (indexByKey.has(key)) {
          merged[indexByKey.get(key)] = item;
          return;
        }
        indexByKey.set(key, merged.length);
        merged.push(item);
      });

      const trimmed = merged.slice(-60);
      chrome.storage.local.set({ quizWordPairs: trimmed }, () => resolve(trimmed));
    });
  });
}

// Clear cached quiz word pairs after a quiz is shown/completed.
function clearQuizWordPairs() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ quizWordPairs: [] }, () => resolve());
  });
}

// Listen for config changes in chrome.storage.local.
function onConfigChange(handler) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    handler(changes);
  });
}

pat.storage = {
  getConfig,
  setConfig,
  getAnalytics,
  setAnalytics,
  getQuizWordPairs,
  addQuizWordPairs,
  clearQuizWordPairs,
  onConfigChange
};
