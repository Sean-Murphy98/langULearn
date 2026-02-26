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
  onConfigChange
};
