const defaults = {
  targetLang: "es",
  percent: 30,
  step: 5,
  minPercent: 10,
  maxPercent: 80
};

const els = {
  targetLang: document.getElementById("targetLang"),
  percent: document.getElementById("percent"),
  percentValue: document.getElementById("percentValue"),
  step: document.getElementById("step"),
  minPercent: document.getElementById("minPercent"),
  maxPercent: document.getElementById("maxPercent"),
  save: document.getElementById("save"),
  reset: document.getElementById("reset"),
  status: document.getElementById("status")
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function load() {
  chrome.storage.local.get(defaults, (cfg) => {
    els.targetLang.value = cfg.targetLang;
    els.percent.value = cfg.percent;
    els.step.value = cfg.step;
    els.minPercent.value = cfg.minPercent;
    els.maxPercent.value = cfg.maxPercent;
    els.percentValue.textContent = `${cfg.percent}%`;
  });
}

function save() {
  const percent = clamp(Number(els.percent.value), 0, 100);
  const minPercent = clamp(Number(els.minPercent.value), 0, 100);
  const maxPercent = clamp(Number(els.maxPercent.value), 0, 100);
  const step = clamp(Number(els.step.value), 1, 20);

  const cfg = {
    targetLang: els.targetLang.value.trim() || defaults.targetLang,
    percent,
    step,
    minPercent: Math.min(minPercent, maxPercent),
    maxPercent: Math.max(minPercent, maxPercent)
  };

  chrome.storage.local.set(cfg, () => {
    els.status.textContent = "Saved.";
    setTimeout(() => (els.status.textContent = ""), 1200);
  });
}

els.percent.addEventListener("input", () => {
  els.percentValue.textContent = `${els.percent.value}%`;
});

els.save.addEventListener("click", save);
els.reset.addEventListener("click", () => {
  chrome.storage.local.set(defaults, load);
});

load();
