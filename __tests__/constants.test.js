const constants = require("../extension/utils/constants.js");

describe("constants", () => {
  test("defaults include required keys", () => {
    expect(constants.defaults).toMatchObject({
      targetLang: expect.any(String),
      apiKey: expect.any(String),
      percent: expect.any(Number),
      step: expect.any(Number),
      minPercent: expect.any(Number),
      maxPercent: expect.any(Number)
    });
  });

  test("surveyPath is defined", () => {
    expect(constants.surveyPath).toBe("ui/survey/survey.html");
  });
});
