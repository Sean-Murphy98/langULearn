const helpers = require("../extension/utils/helpers.js");

describe("helpers", () => {
  test("clamp bounds values", () => {
    expect(helpers.clamp(5, 0, 10)).toBe(5);
    expect(helpers.clamp(-2, 0, 10)).toBe(0);
    expect(helpers.clamp(20, 0, 10)).toBe(10);
  });

  test("splitSentences splits on punctuation", () => {
    const input = "Hello world. How are you? Great!";
    expect(helpers.splitSentences(input)).toEqual([
      "Hello world.",
      "How are you?",
      "Great!"
    ]);
  });

  test("hashString is deterministic", () => {
    const first = helpers.hashString("abc");
    const second = helpers.hashString("abc");
    expect(first).toBe(second);
  });

  test("shouldTranslate respects percent extremes", () => {
    expect(helpers.shouldTranslate("hello", "vid", 0)).toBe(false);
    expect(helpers.shouldTranslate("hello", "vid", 100)).toBe(true);
  });

  test("shouldTranslate is stable per input", () => {
    const a = helpers.shouldTranslate("hello", "vid", 30);
    const b = helpers.shouldTranslate("hello", "vid", 30);
    expect(a).toBe(b);
  });
});
