var pat = (globalThis.pat = globalThis.pat || {});

// Shared configuration defaults and extension constants.
pat.constants = {
  defaults: {
    targetLang: "es",
    apiKey: "",
    translationEnabled: true,
    percent: 30,
    step: 5,
    minPercent: 10,
    maxPercent: 80
  },
  // Survey UI route for background to open.
  surveyPath: "ui/survey/survey.html",
  // Analytics UI route for background to open.
  analyticsPath: "ui/analytics/analytics.html",
  analyticsDefaults: {
    totalWatchSeconds: 0,
    languageWatchSeconds: {},
    survey: {
      total: 0,
      understood: 0,
      notUnderstood: 0
    },
    seenVideoIds: {},
    lastUpdatedAt: ""
  }
};

// Allow unit tests in Node without affecting extension runtime.
if (typeof module !== "undefined") {
  module.exports = pat.constants;
}
