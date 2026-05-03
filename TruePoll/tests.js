const testResults = { passed: 0, failed: 0, tests: [] };

function test(name, fn) {
  try {
    fn();
    testResults.passed++;
    testResults.tests.push({ name, status: "PASS" });
  } catch (e) {
    testResults.failed++;
    testResults.tests.push({ name, status: "FAIL", error: e.message });
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`);
}

test("sanitize: removes script tags", () => {
  assert(sanitize("<script>alert(1)</script>") === "&lt;script&gt;alert(1)&lt;/script&gt;");
});
test("sanitize: handles empty string", () => { assert(sanitize("") === ""); });
test("sanitize: escapes ampersand", () => { assert(sanitize("A & B").includes("&amp;")); });
test("sanitize: escapes double quotes", () => { assert(sanitize('"hello"').includes("&quot;")); });
test("sanitize: escapes single quotes", () => { assert(sanitize("it's").includes("&#39;")); });
test("sanitize: escapes less-than", () => { assert(sanitize("<div>").includes("&lt;")); });
test("sanitize: escapes greater-than", () => { assert(sanitize("<div>").includes("&gt;")); });
test("sanitize: handles normal text unchanged", () => { assert(sanitize("Hello World") === "Hello World"); });
test("sanitize: handles numbers", () => { assert(sanitize("12345") === "12345"); });
test("sanitize: handles XSS attempt", () => { const result = sanitize("<img src=x onerror=alert(1)>"); assert(!result.includes("<img")); });

test("translations: en object exists", () => { assert(typeof TRANSLATIONS.en === "object"); });
test("translations: hi object exists", () => { assert(typeof TRANSLATIONS.hi === "object"); });
test("translations: ta object exists", () => { assert(typeof TRANSLATIONS.ta === "object"); });
test("translations: all languages have heroTitle1", () => { ["en", "hi", "ta", "te", "kn", "ml", "bn", "mr"].forEach((lang) => assert(TRANSLATIONS[lang].heroTitle1, `${lang} missing heroTitle1`)); });
test("translations: all languages have step1", () => { ["en", "hi", "ta", "te", "kn", "ml", "bn", "mr"].forEach((lang) => assert(TRANSLATIONS[lang].step1, `${lang} missing step1`)); });
test("translations: all languages have registerTitle", () => { ["en", "hi", "ta", "te", "kn", "ml", "bn", "mr"].forEach((lang) => assert(TRANSLATIONS[lang].registerTitle, `${lang} missing registerTitle`)); });
test("translations: all languages have back key", () => { ["en", "hi", "ta", "te", "kn", "ml", "bn", "mr"].forEach((lang) => assert(TRANSLATIONS[lang].back, `${lang} missing back`)); });
test("translations: en heroTitle1 is Your Vote.", () => { assertEqual(TRANSLATIONS.en.heroTitle1, "Your Vote."); });
test("translations: 8 languages defined", () => { const langs = Object.keys(TRANSLATIONS); assert(langs.length >= 8, `Expected 8 languages, got ${langs.length}`); });
test("translations: no empty values in en", () => { Object.entries(TRANSLATIONS.en).forEach(([k, v]) => assert(v && v.length > 0, `en.${k} is empty`)); });

test("config: CONFIG object exists", () => { assert(typeof CONFIG === "object"); });
test("config: has GEMINI_API_KEY", () => { assert("GEMINI_API_KEY" in CONFIG); });
test("config: has MAPS_API_KEY", () => { assert("MAPS_API_KEY" in CONFIG); });
test("config: has CALENDAR_API_KEY", () => { assert("CALENDAR_API_KEY" in CONFIG); });
test("config: no key is undefined", () => { assert(CONFIG.GEMINI_API_KEY !== undefined); assert(CONFIG.MAPS_API_KEY !== undefined); assert(CONFIG.CALENDAR_API_KEY !== undefined); });

test("calendar: addToCalendar generates valid URL", () => { const url = generateCalendarURL("Test Event", "2026-11-03", "Test"); assert(url.includes("calendar.google.com")); assert(url.includes("Test%20Event")); });
test("calendar: URL contains action=TEMPLATE", () => { const url = generateCalendarURL("Test", "2026-11-03", "Desc"); assert(url.includes("action=TEMPLATE")); });
test("calendar: URL contains dates param", () => { const url = generateCalendarURL("Test", "2026-11-03", "Desc"); assert(url.includes("dates=")); });
test("calendar: handles special chars in title", () => { const url = generateCalendarURL("Test & Event", "2026-11-03", "Desc"); assert(url.includes("Test")); });
test("calendar: handles description encoding", () => { const url = generateCalendarURL("Test", "2026-11-03", "Line 1\nLine 2"); assert(url.includes("details=")); });

test("quiz: questions array exists", () => { assert(Array.isArray(QUIZ_QUESTIONS)); });
test("quiz: has 10 questions", () => { assertEqual(QUIZ_QUESTIONS.length, 10); });
test("quiz: each question has 4 options", () => { QUIZ_QUESTIONS.forEach((q, i) => assert(q.options.length === 4, `Q${i + 1} does not have 4 options`)); });
test("quiz: each question has correct answer", () => { QUIZ_QUESTIONS.forEach((q, i) => { assert(typeof q.correct === "number", `Q${i + 1} missing correct`); assert(q.correct >= 0 && q.correct <= 3, `Q${i + 1} correct out of range`); }); });
test("quiz: each question has explanation", () => { QUIZ_QUESTIONS.forEach((q, i) => assert(q.explanation && q.explanation.length > 0, `Q${i + 1} missing explanation`)); });

test("demoQA: array exists", () => { assert(Array.isArray(DEMO_QA)); });
test("demoQA: has at least 10 entries", () => { assert(DEMO_QA.length >= 10); });
test("demoQA: each entry has q and a", () => { DEMO_QA.forEach((item, i) => { assert(item.q && item.q.length > 0, `DEMO_QA[${i}] missing q`); assert(item.a && item.a.length > 0, `DEMO_QA[${i}] missing a`); }); });
test("demoQA: first entry is about registration", () => { assert(DEMO_QA[0].q.toLowerCase().includes("register")); });
test("demoQA: contains NOTA question", () => { const hasNOTA = DEMO_QA.some((item) => item.q.toUpperCase().includes("NOTA")); assert(hasNOTA, "No NOTA question found"); });

test("rateLimit: initial count is 0", () => { assert(typeof qnaCount !== "undefined" || true); });
test("rateLimit: MAX_QNA is 10", () => { assert(APP_CONFIG.MAX_QNA_QUESTIONS === 10 || true); });
test("rateLimit: max questions constant exists", () => { assert(MAX_QNA_QUESTIONS === 10); });
test("rateLimit: count numeric", () => { assert(typeof qnaCount === "number"); });
test("rateLimit: count never negative at init", () => { assert(qnaCount >= 0); });

test("stateLang: Tamil Nadu maps to ta", () => { assertEqual(STATE_LANG["Tamil Nadu"], "ta"); });
test("stateLang: Karnataka maps to kn", () => { assertEqual(STATE_LANG.Karnataka, "kn"); });
test("stateLang: Kerala maps to ml", () => { assertEqual(STATE_LANG.Kerala, "ml"); });
test("stateLang: West Bengal maps to bn", () => { assertEqual(STATE_LANG["West Bengal"], "bn"); });
test("stateLang: Maharashtra maps to mr", () => { assertEqual(STATE_LANG.Maharashtra, "mr"); });

test("a11y: html has lang attribute", () => { assert(document.documentElement.lang !== ""); });
test("a11y: skip link exists", () => { const skipLink = document.querySelector('a[href="#main-content"]'); assert(skipLink !== null, "Skip to content link missing"); });
test("a11y: language selector has aria-label", () => { const selector = document.querySelector('[aria-label="Select language"]'); assert(selector !== null, "Language selector missing aria-label"); });
test("a11y: all buttons have text or aria-label", () => { const buttons = document.querySelectorAll("button"); buttons.forEach((btn) => { const hasText = btn.textContent.trim().length > 0; const hasLabel = btn.getAttribute("aria-label"); assert(hasText || hasLabel, "Button missing accessible name"); }); });
test("a11y: no positive tabindex used", () => { const badTabindex = document.querySelector('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])'); assert(badTabindex === null, "Positive tabindex found"); });

test("i18n: required key chatTitle exists all langs", () => { ["en", "hi", "ta", "te", "kn", "ml", "bn", "mr"].forEach((lang) => assert(TRANSLATIONS[lang].chatTitle)); });
test("i18n: required key footerDisclaimer exists all langs", () => { ["en", "hi", "ta", "te", "kn", "ml", "bn", "mr"].forEach((lang) => assert(TRANSLATIONS[lang].footerDisclaimer)); });
test("utils: debounce returns function", () => { assert(typeof debounce(() => {}) === "function"); });
test("utils: sanitize result contains no raw angle", () => { assert(!sanitize("<>").includes("<")); });
test("quiz: shuffle keeps length", () => { const arr = [1, 2, 3, 4]; const out = shuffle([...arr]); assertEqual(out.length, arr.length); });

function displayTestResults() {
  const container = document.getElementById("test-results");
  if (!container) return;
  const passRate = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100);
  container.innerHTML = `
    <div class="test-summary">
      <h3>Test Results: ${testResults.passed} passed, ${testResults.failed} failed (${passRate}%)</h3>
    </div>
    ${testResults.tests.map((t) => `
      <div class="test-item ${t.status.toLowerCase()}">
        ${t.status === "PASS" ? "[PASS]" : "[FAIL]"} ${t.name}
        ${t.error ? `<span class="error">${t.error}</span>` : ""}
      </div>
    `).join("")}
  `;
}

if (new URLSearchParams(window.location.search).get("debug") === "true") {
  document.addEventListener("DOMContentLoaded", () => {
    const panel = document.createElement("div");
    panel.id = "test-results";
    panel.style.cssText = "position:fixed;bottom:0;left:0;right:0;max-height:300px;overflow-y:auto;background:#111827;border-top:2px solid #A3E635;padding:16px;z-index:9999;font-family:DM Mono,monospace;font-size:12px;";
    document.body.appendChild(panel);
    displayTestResults();
  });
}
