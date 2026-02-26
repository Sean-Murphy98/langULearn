const els = {
  refresh: document.getElementById("refresh"),
  currentPercent: document.getElementById("currentPercent"),
  videosWatched: document.getElementById("videosWatched"),
  timeWatched: document.getElementById("timeWatched"),
  surveyAccuracy: document.getElementById("surveyAccuracy"),
  languageBreakdown: document.getElementById("languageBreakdown"),
  languageEmpty: document.getElementById("languageEmpty"),
  surveyTotal: document.getElementById("surveyTotal"),
  surveyYes: document.getElementById("surveyYes"),
  surveyNo: document.getElementById("surveyNo"),
  lastUpdated: document.getElementById("lastUpdated")
};

function formatDuration(totalSeconds) {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function setLanguageBreakdown(languageWatchSeconds) {
  const entries = Object.entries(languageWatchSeconds || {}).sort((a, b) => b[1] - a[1]);
  els.languageBreakdown.innerHTML = "";
  els.languageEmpty.hidden = entries.length > 0;

  entries.slice(0, 8).forEach(([lang, seconds]) => {
    const li = document.createElement("li");
    li.textContent = `${lang}: ${formatDuration(seconds)}`;
    els.languageBreakdown.appendChild(li);
  });
}

async function render() {
  const [cfg, analytics] = await Promise.all([
    pat.storage.getConfig(),
    pat.storage.getAnalytics()
  ]);

  const survey = analytics.survey || { total: 0, understood: 0, notUnderstood: 0 };
  const videoCount = Object.keys(analytics.seenVideoIds || {}).length;
  const accuracy = survey.total ? Math.round((survey.understood / survey.total) * 100) : 0;

  els.currentPercent.textContent = `${cfg.percent}%`;
  els.videosWatched.textContent = String(videoCount);
  els.timeWatched.textContent = formatDuration(analytics.totalWatchSeconds || 0);
  els.surveyAccuracy.textContent = survey.total ? `${accuracy}%` : "No data";
  els.surveyTotal.textContent = String(survey.total || 0);
  els.surveyYes.textContent = String(survey.understood || 0);
  els.surveyNo.textContent = String(survey.notUnderstood || 0);
  setLanguageBreakdown(analytics.languageWatchSeconds);

  els.lastUpdated.textContent = analytics.lastUpdatedAt
    ? `Last updated: ${new Date(analytics.lastUpdatedAt).toLocaleString()}`
    : "Last updated: never";
}

els.refresh.addEventListener("click", render);
render();
