var pat = (globalThis.pat = globalThis.pat || {});

// Shared configuration defaults and extension constants.
pat.constants = {
  defaults: {
    targetLang: "es",
    apiKey: "",
    percent: 30,
    step: 5,
    minPercent: 10,
    maxPercent: 80
  },
  // Survey UI route for background to open.
  surveyPath: "ui/survey/survey.html"
};

// Allow unit tests in Node without affecting extension runtime.
if (typeof module !== "undefined") {
  module.exports = pat.constants;
}
