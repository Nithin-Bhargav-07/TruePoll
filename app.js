const DEBUG = false;
const MAX_QNA_QUESTIONS = 10;
const APP_CONFIG = typeof CONFIG === "object" ? CONFIG : { GEMINI_API_KEY: "", MAPS_API_KEY: "", CALENDAR_API_KEY: "", MAX_QNA_QUESTIONS: 10 };
if (!APP_CONFIG.MAX_QNA_QUESTIONS) APP_CONFIG.MAX_QNA_QUESTIONS = 10;

const STATE_LANG = {
  "Tamil Nadu": "ta",
  Karnataka: "kn",
  Kerala: "ml",
  "Andhra Pradesh": "te",
  Telangana: "te",
  "West Bengal": "bn",
  Maharashtra: "mr",
  "Uttar Pradesh": "hi",
  Bihar: "hi",
  Rajasthan: "hi",
  "Madhya Pradesh": "hi",
  Delhi: "hi"
};

const langNames = { en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", kn: "Kannada", ml: "Malayalam", bn: "Bengali", mr: "Marathi" };

const MILESTONES = [
  { title: "Voter Registration Deadline", date: "2026-10-15", status: "Upcoming" },
  { title: "Mail-in Ballots Sent", date: "2026-10-20", status: "Upcoming" },
  { title: "Early Voting Period", date: "2026-10-25", status: "Active" },
  { title: "Election Day", date: "2026-11-03", status: "Upcoming" }
];

const DEMO_QA = [
  { q: "How do I register to vote?", a: "Visit voters.eci.gov.in or use Voter Helpline app. Fill Form 6 with Aadhaar, age proof and address proof. Processing usually takes 2-4 weeks." },
  { q: "What ID do I need at the polling booth?", a: "Voter ID is preferred, but ECI accepts 12 alternate photo IDs including Aadhaar, DL, PAN and Passport." },
  { q: "What is NOTA and how do I use it?", a: "NOTA means None of the Above. It is the last option on EVM. Your vote is counted officially but does not change winner rule." },
  { q: "What is the silence period?", a: "Campaigning must stop 48 hours before polling. This gives voters quiet time to decide." },
  { q: "How does EVM work? Is it safe?", a: "EVM is standalone and not connected to internet or Bluetooth. VVPAT provides paper trail verification." },
  { q: "Can I vote if I lost my Voter ID?", a: "Yes. Use any approved alternate photo ID if your name is on electoral roll." },
  { q: "What is VVPAT?", a: "VVPAT shows candidate slip for 7 seconds then drops it in sealed box." },
  { q: "How do I find my polling booth?", a: "Check voters.eci.gov.in with EPIC or call 1950 voter helpline." },
  { q: "What are my rights if I face problems at the booth?", a: "If blocked, ask for Form 49A where applicable and call 1950 immediately." },
  { q: "What is the difference between Lok Sabha and Vidhan Sabha?", a: "Lok Sabha elects MPs for central government. Vidhan Sabha elects MLAs for state government." }
];

const QUIZ_QUESTIONS = [
  { q: "How many seats are in the Lok Sabha?", options: ["250", "543", "790", "545"], correct: 1, explanation: "India has 543 elected Lok Sabha seats." },
  { q: "What does NOTA stand for?", options: ["No Other Than Accepted", "None of the Above", "National Official Tally Act", "Not Open to Amendment"], correct: 1, explanation: "NOTA allows formal rejection of all listed candidates." },
  { q: "What is the minimum voting age in India?", options: ["16", "21", "18", "25"], correct: 2, explanation: "Voting age is 18 after 61st Constitutional Amendment." },
  { q: "For how many seconds is the VVPAT slip visible?", options: ["3 seconds", "5 seconds", "10 seconds", "7 seconds"], correct: 3, explanation: "Slip is visible for exactly 7 seconds." },
  { q: "What is the helpline number for voter assistance?", options: ["112", "1950", "100", "1800"], correct: 1, explanation: "1950 is ECI voter helpline." },
  { q: "How many alternative IDs does ECI accept instead of Voter ID?", options: ["5", "8", "12", "3"], correct: 2, explanation: "ECI allows 12 alternative photo IDs." },
  { q: "What does EVM stand for?", options: ["Electronic Vote Machine", "Electoral Voting Mechanism", "Electronic Voting Machine", "Election Verification Method"], correct: 2, explanation: "EVM means Electronic Voting Machine." },
  { q: "How many hours before polling must campaign silence begin?", options: ["24 hours", "72 hours", "12 hours", "48 hours"], correct: 3, explanation: "Silence period starts 48 hours before polling." },
  { q: "Which Article established the Election Commission?", options: ["Article 312", "Article 324", "Article 356", "Article 280"], correct: 1, explanation: "Article 324 establishes ECI mandate." },
  { q: "What is the form number for new voter registration?", options: ["Form 8", "Form 12D", "Form 49A", "Form 6"], correct: 3, explanation: "Form 6 is for new voter registration." }
];

let currentLang = sessionStorage.getItem("lang") || "en";
let currentStep = 1;
let selectedPlace = null;
let qnaCount = 0;
let currentQuizIndex = 0;
let quizScore = 0;
let quizOrder = [...QUIZ_QUESTIONS.keys()];
let votingTab = 0;

/**
 * @description Applies saved theme from localStorage.
 * @returns {void} No return value.
 */
function initializeTheme() {
  try {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
    document.documentElement.classList.remove("preload-light");
  } catch (e) {
    document.documentElement.classList.remove("preload-light");
  }
}

/**
 * @description Toggles between light and dark theme.
 * @returns {void} No return value.
 */
function toggleTheme() {
  const isLight = document.body.classList.toggle("light-theme");
  try {
    localStorage.setItem("theme", isLight ? "light" : "dark");
  } catch (e) {}
}

/**
 * @description Shows one SPA view and hides other major views.
 * @param {string} targetId - Target view element ID.
 * @returns {void} No return value.
 */
function showView(targetId) {
  const viewIds = ["hero", "main-content", "scroll-stack", "quiz-section", "evm-section", "learn-section"];
  const normalizedTarget = targetId === "scroll-stack" ? "stack-section" : targetId;
  viewIds.forEach((id) => {
    const normalizedId = id === "scroll-stack" ? "stack-section" : id;
    const el = document.getElementById(normalizedId);
    if (!el) return;
    el.hidden = true;
    el.style.display = "none";
  });
  const mainContent = document.getElementById("main-content");
  if (mainContent) {
    mainContent.hidden = false;
    mainContent.style.display = "";
  }
  const majorSections = ["hero", "stack-section", "wizard-section", "quiz-section", "evm-section", "learn-section"];
  majorSections.forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;
    section.hidden = true;
    section.style.display = "none";
  });
  const targetEl = document.getElementById(normalizedTarget);
  if (targetEl) {
    targetEl.hidden = false;
    targetEl.style.display = "";
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.showView = showView;

/**
 * @description Starts wizard from a given step.
 * @param {number} step - Step to start from.
 * @returns {void} No return value.
 */
function startWizard(step) {
  showView("wizard-section");
  goToStep(step);
}

/**
 * @description Sanitizes user input to prevent XSS attacks
 * @param {string} str - Raw user input string
 * @returns {string} Sanitized string safe for DOM insertion
 */
function sanitize(str) {
  return String(str).replace(/[<>"'&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "&": "&amp;" }[c]));
}

/**
 * @description Creates debounced wrapper.
 * @param {Function} fn - Callback function.
 * @param {number} wait - Delay in milliseconds.
 * @returns {Function} Debounced function.
 */
function debounce(fn, wait = 300) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * @description Applies translations to all data-i18n elements
 * @param {string} lang - Language code (en, hi, ta, te, kn, ml, bn, mr)
 * @returns {void}
 */
function applyTranslations(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) el.placeholder = t[key];
  });
  const fontMap = {
    hi: "'Noto Sans Devanagari', sans-serif",
    mr: "'Noto Sans Devanagari', sans-serif",
    ta: "'Noto Sans Tamil', sans-serif",
    te: "'Noto Sans Telugu', sans-serif",
    kn: "'Noto Sans Kannada', sans-serif",
    ml: "'Noto Sans Malayalam', sans-serif",
    bn: "'Noto Sans Bengali', sans-serif",
    en: "'DM Sans', sans-serif"
  };
  document.body.style.fontFamily = fontMap[lang] || fontMap.en;
  document.documentElement.lang = lang;
  sessionStorage.setItem("lang", lang);
  currentLang = lang;
}

/**
 * @description Generates calendar template URL.
 * @param {string} title - Event title.
 * @param {string} date - ISO date.
 * @param {string} description - Event description.
 * @returns {string} Google calendar template URL.
 */
function generateCalendarURL(title, date, description) {
  const d = new Date(date).toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, 15) + "Z";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${d}/${d}&details=${encodeURIComponent(description)}`;
}

/**
 * @description Opens Google Calendar with pre-filled event details
 * @param {string} title - Event title
 * @param {string} date - Event date in ISO format
 * @param {string} description - Event description
 * @returns {void} Opens calendar URL in new tab
 */
function addToCalendar(title, date, description) {
  window.open(generateCalendarURL(title, date, description), "_blank");
}

/**
 * @description Dynamically loads Google Maps JavaScript API
 * @returns {void} Appends Maps script tag to document head
 */
function loadMapsAPI() {
  if (!APP_CONFIG.MAPS_API_KEY || APP_CONFIG.MAPS_API_KEY.includes("YOUR_")) return;
  window.initMapAutocomplete = function initMapAutocomplete() {
    initializeAutocomplete();
  };
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${APP_CONFIG.MAPS_API_KEY}&libraries=places&loading=async&callback=initMapAutocomplete`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

/**
 * @description Initializes address autocomplete.
 * @returns {void} No return value.
 */
function initializeAutocomplete() {
  const input = document.getElementById("location-input");
  if (!input || !window.google) return;
  const host = document.getElementById("location-autocomplete-host");
  if (!host || !google.maps?.places?.PlaceAutocompleteElement) {
    return;
  }
  host.innerHTML = "";
  const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
    componentRestrictions: { country: ["in"] },
    requestedLanguage: "en"
  });
  placeAutocomplete.id = "place-autocomplete";
  placeAutocomplete.setAttribute("aria-label", "Search location");
  host.appendChild(placeAutocomplete);
  const handlePlaceEvent = async (event) => {
    try {
      const prediction = event?.placePrediction || event?.detail?.placePrediction;
      if (!prediction) return;
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ["addressComponents", "displayName", "formattedAddress", "location"]
      });
      const adaptedPlace = {
        name: place.displayName || "",
        formatted_address: place.formattedAddress || "",
        geometry: { location: place.location || null },
        address_components: (place.addressComponents || []).map((c) => ({
          long_name: c.longText || c.long_name || "",
          short_name: c.shortText || c.short_name || "",
          types: c.types || []
        }))
      };
      if (input) input.value = adaptedPlace.formatted_address || adaptedPlace.name || "";
      handleLocationSelected(adaptedPlace);
    } catch (error) {
      if (DEBUG) {
        return;
      }
    }
  };
  placeAutocomplete.addEventListener("gmp-placeselect", handlePlaceEvent);
  placeAutocomplete.addEventListener("gmp-select", handlePlaceEvent);
}

/**
 * @description Handles selected place and language inference.
 * @param {object} place - Google place object.
 * @returns {void} No return value.
 */
function handleLocationSelected(place) {
  selectedPlace = place;
  const stateComp = (place.address_components || []).find((c) => c.types.includes("administrative_area_level_1"));
  const state = stateComp ? stateComp.long_name : "";
  if (STATE_LANG[state]) setLanguage(STATE_LANG[state]);
  const mapWrap = document.getElementById("mini-map");
  if (mapWrap && place.geometry && window.google) {
    mapWrap.style.display = "block";
    const map = new google.maps.Map(mapWrap, { center: place.geometry.location, zoom: 14, disableDefaultUI: true });
    new google.maps.Marker({ map, position: place.geometry.location });
  }
}

/**
 * @description Changes active language.
 * @param {string} lang - Language code.
 * @returns {void} No return value.
 */
function setLanguage(lang) {
  applyTranslations(lang);
  document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
  if (window.trackLanguage) window.trackLanguage(lang);
}

/**
 * @description Scrolls to top and renders target wizard step.
 * @param {number} step - Target step index.
 * @returns {void} No return value.
 */
function goToStep(step) {
  window.scrollTo({ top: 0, behavior: "smooth" });
  currentStep = Math.max(1, Math.min(5, step));
  renderStep(currentStep);
}

/**
 * @description Renders wizard progress pills.
 * @returns {void} No return value.
 */
function renderWizardProgress() {
  const progress = document.getElementById("wizard-progress");
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const steps = [t.step1, t.step2, t.step3, t.step4, t.step5];
  progress.innerHTML = `<div class="step-row">${steps
    .map((s, i) => {
      const idx = i + 1;
      const cls = idx < currentStep ? "done" : idx === currentStep ? "active" : "";
      const current = idx === currentStep ? `aria-current="step"` : "";
      return `<button class="step-pill ${cls}" ${current} data-step="${idx}">${idx} ${sanitize(s)}</button>`;
    })
    .join("")}</div>`;
  progress.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => goToStep(Number(b.dataset.step))));
}

/**
 * @description Renders the specified wizard step and scrolls to top
 * @param {number} step - Step number (1-5)
 * @returns {void}
 */
function renderStep(step) {
  const card = document.getElementById("wizard-card");
  if (!card) return;
  card.classList.add("fade-out");
  setTimeout(() => {
    card.classList.remove("fade-out");
    card.classList.add("fade-in");
    card.scrollTop = 0;
    card.innerHTML = renderStepMarkup(step);
    wireStepEvents(step);
    renderWizardProgress();
    applyTranslations(currentLang);
    if (window.trackStep) window.trackStep('step_' + currentStep);
  }, 150);
}

/**
 * @description Returns HTML for each wizard step.
 * @param {number} step - Step number.
 * @returns {string} HTML markup.
 */
function renderStepMarkup(step) {
  if (step === 1) {
    return `
      <h2 data-i18n="whereTitle">Where are you?</h2>
      <p data-i18n="whereSub">Enter your address to find your electoral district</p>
      <label for="location-input" class="sr-only">Location</label>
      <input id="location-input" data-i18n-placeholder="locationPlaceholder" placeholder="Start typing your address..." />
      <div id="location-autocomplete-host" style="margin-top:12px;"></div>
      <div id="mini-map" style="display:none;height:200px;margin-top:12px;border-radius:12px;"></div>
      <div class="wizard-nav">
        <span></span>
        <span class="hint" data-i18n="pressEnter">Press Enter to continue</span>
        <button class="btn btn-primary" id="next-step">Next: Upcoming Elections</button>
      </div>`;
  }
  if (step === 2) {
    return `
      <h2 data-i18n="timelineTitle">What election is coming?</h2>
      <p data-i18n="timelineSub">Key dates for your upcoming election</p>
      ${MILESTONES.map((m, i) => `<div class="panel-card" style="animation-delay:${i * 80}ms"><strong>${m.title}</strong><div>${m.date} · ${m.status}</div><button class="btn btn-secondary add-cal" data-title="${sanitize(m.title)}" data-date="${m.date}" data-desc="${sanitize(m.title)}" data-i18n="addCalendar">Add to Calendar</button></div>`).join("")}
      <div class="wizard-nav">
        <button class="btn btn-secondary" id="prev-step" data-i18n="back">Back</button>
        <span class="hint" data-i18n="pressEnter">Press Enter to continue</span>
        <button class="btn btn-primary" id="next-step" data-i18n="next">Next</button>
      </div>`;
  }
  if (step === 3) {
    return `
      <h2 data-i18n="registerTitle">Are you registered?</h2>
      <p data-i18n="registerSub">All requirements below are legally mandatory</p>
      <div class="ring-wrap"><svg viewBox="0 0 36 36" width="170" role="progressbar" aria-valuemin="0" aria-valuemax="4" aria-valuenow="0"><path d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32" stroke="#1e2537" stroke-width="3" fill="none"></path><path id="ring-progress" d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32" stroke="#ef4444" stroke-width="3" fill="none" stroke-dasharray="100" stroke-dashoffset="100" style="transition:stroke-dashoffset 600ms ease;"></path><text class="ring-text" x="18" y="20" text-anchor="middle"><tspan id="ring-label">0 of 4 requirements met</tspan></text></svg></div>
      <div id="req-list">
        ${[1, 2, 3, 4].map((n) => `<label class="req-card" id="req-card-${n}"><input type="checkbox" id="req-${n}" /> <strong data-i18n="req${n}Title"></strong> <span class="badge req-badge" data-i18n="required">REQUIRED</span><p data-i18n="req${n}Why"></p></label>`).join("")}
      </div>
      <div id="req-feedback"></div>
      <div class="wizard-nav">
        <button class="btn btn-secondary" id="prev-step" data-i18n="back">Back</button>
        <span class="hint" data-i18n="pressEnter">Press Enter to continue</span>
        <button class="btn btn-primary" id="next-step" data-i18n="next">Next</button>
      </div>`;
  }
  if (step === 4) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const tabs = [t.arrive, t.checkIn, t.vote, t.submit];
    return `
      <h2 data-i18n="votingTitle">Voting Day Guide</h2>
      <p data-i18n="votingSub">What will happen at your polling booth</p>
      <div class="tabs">${tabs.map((tab, i) => `<button class="tab-btn ${i === votingTab ? "active" : ""}" data-tab="${i}" aria-selected="${i === votingTab}">${sanitize(tab)}</button>`).join("")}</div>
      <div id="tab-content">${renderVotingTab(votingTab)}</div>
      <div class="panel-card"><h3 data-i18n="pollingStation">Your Polling Station</h3><p>${selectedPlace?.formatted_address || "Station details appear here after location selection."}</p><div><button class="btn btn-secondary" id="get-directions" data-i18n="getDirections">Get Directions</button> <button class="btn btn-secondary" id="toggle-wait" data-i18n="checkWait">Check Wait Times</button></div><div id="wait-panel" style="display:none"><p>Morning: 25 min avg</p><p>Midday: 10 min avg</p><p>Evening: 20 min avg</p></div><hr/><p><span data-i18n="pollsOpen">Polls open 7:00 AM - 6:00 PM</span> | <span data-i18n="wheelchair">Wheelchair accessible</span></p></div>
      <div class="wizard-nav"><button class="btn btn-secondary" id="prev-step" data-i18n="back">Back</button><span class="hint" data-i18n="pressEnter">Press Enter to continue</span><button class="btn btn-primary" id="next-step" data-i18n="next">Next</button></div>`;
  }
  return `
    <h2 data-i18n="afterTitle">After You Vote</h2>
    <p data-i18n="afterSub">Your ballot is cast. What happens next?</p>
    <div class="tab-panel"><div class="panel-card"><h3 data-i18n="pollsClose">Polls Close</h3></div><div class="panel-card"><h3 data-i18n="ballotsCounted">Ballots Counted</h3></div><div class="panel-card"><h3 data-i18n="resultsAnnounced">Results Announced</h3></div></div>
    <div class="impact-cards"><div class="panel-card"><strong>2004:</strong> Congress won by 1.8% vote share</div><div class="panel-card"><strong>2014:</strong> BJP won exactly 272 seats</div><div class="panel-card"><strong>2019:</strong> NDA won 303/543 with 37.4% vote share</div></div>
    <button class="btn btn-primary" id="download-card" data-i18n="shareCard">Download I Voted Card</button>
    <button class="btn btn-secondary" id="ask-electiq" data-i18n="chatTitle">Ask ElectIQ</button>
    <div class="wizard-nav"><button class="btn btn-secondary" id="prev-step" data-i18n="back">Back</button><span class="hint" data-i18n="pressEnter">Press Enter to continue</span><button class="btn btn-primary" data-target="hero">Finish</button></div>`;
}

/**
 * @description Renders voting tab content.
 * @param {number} tab - Active tab index.
 * @returns {string} Tab HTML.
 */
function renderVotingTab(tab) {
  const blocks = [
    ["Valid photo ID, voter slip if available, verify roll name.", "Morning 25 min, Midday 10 min, Evening 20 min."],
    ["Officer checks roll, ink mark, signature/thumbprint, receive slip.", "If issue arises, call 1950 and request written reason."],
    ["Press EVM button, verify VVPAT 7 seconds, NOTA available.", "Your vote is secret and no cameras in booth."],
    ["Exit route, collect sticker if offered, keep record context.", "EVM sealed, strong room, counting rounds, declaration."]
  ];
  return `<div class="tab-panel"><div class="panel-card"><h4>Checklist</h4><p>${blocks[tab][0]}</p></div><div class="panel-card"><h4>Guide</h4><p>${blocks[tab][1]}</p></div></div>`;
}

/**
 * @description Wires events per step.
 * @param {number} step - Active step.
 * @returns {void} No return value.
 */
function wireStepEvents(step) {
  const nextBtn = document.getElementById("next-step");
  const prevBtn = document.getElementById("prev-step");
  if (prevBtn) prevBtn.addEventListener("click", () => goToStep(step - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => {
    if (step === 3 && !validateRequirements()) return;
    goToStep(step + 1);
  });
  document.addEventListener("keydown", onEnterContinue, { once: true });
  if (step === 1) initializeAutocomplete();
  if (step === 2) document.querySelectorAll(".add-cal").forEach((b) => b.addEventListener("click", () => addToCalendar(b.dataset.title, b.dataset.date, b.dataset.desc)));
  if (step === 3) wireRequirementChecks();
  if (step === 4) wireVotingDayEvents();
  if (step === 5) {
    const d = document.getElementById("download-card");
    const a = document.getElementById("ask-electiq");
    if (d) d.addEventListener("click", generateVotedCard);
    if (a) a.addEventListener("click", toggleDrawer);
  }
}

/**
 * @description Handles enter key progression.
 * @param {KeyboardEvent} e - Key event.
 * @returns {void} No return value.
 */
function onEnterContinue(e) {
  if (e.key === "Enter") {
    const nextBtn = document.getElementById("next-step");
    if (nextBtn) nextBtn.click();
  }
}

/**
 * @description Adds interactions for eligibility cards.
 * @returns {void} No return value.
 */
function wireRequirementChecks() {
  [1, 2, 3, 4].forEach((n) => {
    const cb = document.getElementById(`req-${n}`);
    if (cb) cb.addEventListener("change", updateReqUI);
  });
  updateReqUI();
}

/**
 * @description Updates requirement ring and card state.
 * @returns {void} No return value.
 */
function updateReqUI() {
  const checks = [1, 2, 3, 4].map((n) => Boolean(document.getElementById(`req-${n}`)?.checked));
  const done = checks.filter(Boolean).length;
  const pct = (done / 4) * 100;
  const ring = document.getElementById("ring-progress");
  const lbl = document.getElementById("ring-label");
  if (ring) {
    ring.style.strokeDashoffset = String(100 - pct);
    ring.style.stroke = done === 4 ? "#a3e635" : done > 0 ? "#f59e0b" : "#ef4444";
  }
  if (lbl) lbl.textContent = `${done} of 4 requirements met`;
  [1, 2, 3, 4].forEach((n, i) => document.getElementById(`req-card-${n}`)?.classList.toggle("checked", checks[i]));
  const nextBtn = document.getElementById("next-step");
  if (nextBtn) nextBtn.disabled = done !== 4;
}

/**
 * @description Validates all requirements before moving ahead.
 * @returns {boolean} True when all checked.
 */
function validateRequirements() {
  const done = [1, 2, 3, 4].every((n) => document.getElementById(`req-${n}`)?.checked);
  const feedback = document.getElementById("req-feedback");
  if (!done && feedback) {
    feedback.innerHTML = `<div class="error-banner" data-i18n="confirmReq">${(TRANSLATIONS[currentLang] || TRANSLATIONS.en).confirmReq}</div>`;
    return false;
  }
  if (feedback) feedback.innerHTML = `<div class="success-banner">Great! Verify at voters.eci.gov.in</div><button class="btn btn-secondary" onclick="window.open('https://voters.eci.gov.in','_blank')">${(TRANSLATIONS[currentLang] || TRANSLATIONS.en).checkReg}</button>`;
  return true;
}

/**
 * @description Wires tab and panel events in step 4.
 * @returns {void} No return value.
 */
function wireVotingDayEvents() {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.addEventListener("click", () => {
    votingTab = Number(btn.dataset.tab);
    renderStep(4);
  }));
  document.getElementById("toggle-wait")?.addEventListener("click", () => {
    const p = document.getElementById("wait-panel");
    if (p) p.style.display = p.style.display === "none" ? "block" : "none";
  });
  document.getElementById("get-directions")?.addEventListener("click", () => {
    const dest = encodeURIComponent(selectedPlace?.formatted_address || "Election Commission of India, New Delhi");
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank");
  });
}

/**
 * @description Generates and downloads an I Voted canvas image
 * @returns {void} Downloads PNG file to user device
 */
function generateVotedCard() {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  const lang = sessionStorage.getItem("lang") || "en";
  ctx.fillStyle = "#0A0E1A";
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.strokeStyle = "rgba(255,255,255,0.02)";
  ctx.lineWidth = 1;
  for (let x = 0; x < 1080; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1080); ctx.stroke(); }
  for (let y = 0; y < 1080; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke(); }
  const inkGrad = ctx.createRadialGradient(320, 520, 0, 320, 520, 200);
  inkGrad.addColorStop(0, "rgba(37,99,235,0.9)"); inkGrad.addColorStop(0.4, "rgba(37,99,235,0.6)"); inkGrad.addColorStop(1, "rgba(37,99,235,0.0)");
  ctx.fillStyle = inkGrad; ctx.beginPath(); ctx.ellipse(320, 520, 160, 200, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 2;
  for (let i = 0; i < 10; i += 1) { ctx.beginPath(); ctx.ellipse(320, 520, 30 + i * 14, 40 + i * 17, -0.2, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = "#A3E635"; ctx.beginPath(); ctx.ellipse(320, 340, 25, 32, 0, 0, Math.PI * 2); ctx.fill();
  const dotGlow = ctx.createRadialGradient(320, 340, 0, 320, 340, 80);
  dotGlow.addColorStop(0, "rgba(163,230,53,0.5)"); dotGlow.addColorStop(1, "rgba(163,230,53,0)");
  ctx.fillStyle = dotGlow; ctx.beginPath(); ctx.arc(320, 340, 80, 0, Math.PI * 2); ctx.fill();
  const VOTED_TEXT = {
    en: ["I", "Voted", "Today!"], hi: ["मैंने", "आज", "मतदान किया!"], ta: ["நான்", "இன்று", "வாக்களித்தேன்!"], te: ["నేను", "ఈరోజు", "ఓటు వేశాను!"],
    kn: ["ನಾನು", "ಇಂದು", "ಮತ ಹಾಕಿದೆ!"], ml: ["ഞാൻ", "ഇന്ന്", "വോട്ട് ചെയ്തു!"], bn: ["আমি", "আজ", "ভোট দিয়েছি!"], mr: ["मी", "आज", "मतदान केले!"]
  };
  const VOTED_FONT = {
    en: "bold 90px Syne, sans-serif", hi: "bold 76px Noto Sans Devanagari, sans-serif", mr: "bold 76px Noto Sans Devanagari, sans-serif", ta: "bold 72px Noto Sans Tamil, sans-serif",
    te: "bold 72px Noto Sans Telugu, sans-serif", kn: "bold 68px Noto Sans Kannada, sans-serif", ml: "bold 68px Noto Sans Malayalam, sans-serif", bn: "bold 72px Noto Sans Bengali, sans-serif"
  };
  const lines = VOTED_TEXT[lang] || VOTED_TEXT.en;
  ctx.fillStyle = "#FFFFFF"; ctx.font = VOTED_FONT[lang] || VOTED_FONT.en; ctx.textAlign = "left";
  ctx.fillText(lines[0], 560, 380); ctx.fillText(lines[1], 560, 490); ctx.fillText(lines[2], 560, 600);
  ctx.fillStyle = "#A3E635"; ctx.fillRect(560, 628, 300, 5);
  const LOCALE_MAP = { en: "en-IN", hi: "hi-IN", ta: "ta-IN", te: "te-IN", kn: "kn-IN", ml: "ml-IN", bn: "bn-IN", mr: "mr-IN" };
  ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "26px DM Mono, monospace"; ctx.fillText(new Date().toLocaleDateString(LOCALE_MAP[lang] || "en-IN", { day: "numeric", month: "long", year: "numeric" }), 560, 680);
  ctx.fillStyle = "rgba(163,230,53,0.8)"; ctx.font = "24px DM Mono, monospace"; ctx.textAlign = "center"; ctx.fillText("ElectIQ · Civic Intelligence", 540, 980);
  const link = document.createElement("a");
  link.download = "i-voted-electiq.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/**
 * @description Renders EVM simulator section.
 * @returns {void} No return value.
 */
function renderEvm() {
  const root = document.getElementById("evm-root");
  if (!root) return;
  root.innerHTML = `<div class="tab-panel"><div class="panel-card"><h3>ELECTION COMMISSION OF INDIA</h3><p id="evm-status">Ready to Vote</p><p><span style="color:#a3e635">●</span> Ballot Unit Connected</p></div><div class="panel-card"><h3>Balloting Unit</h3>${["Candidate A", "Candidate B", "Candidate C", "Candidate D", "NOTA"].map((c, i) => `<button class="btn btn-secondary evm-btn" data-cand="${i + 1}" style="width:100%;margin-bottom:8px">${i + 1}. ${c}</button>`).join("")}</div></div><div class="panel-card"><h3>VVPAT</h3><div id="vvpat-slip">Awaiting vote</div><div id="vvpat-count"></div><button class="btn btn-secondary" id="evm-reset">Reset Demo</button></div>`;
  root.querySelectorAll(".evm-btn").forEach((btn) => btn.addEventListener("click", () => triggerVote(btn.textContent)));
  root.querySelector("#evm-reset")?.addEventListener("click", renderEvm);
}

/**
 * @description Triggers mock vote and VVPAT countdown.
 * @param {string} candidateLabel - Selected candidate label.
 * @returns {void} No return value.
 */
function triggerVote(candidateLabel) {
  document.getElementById("evm-status").textContent = "Vote Recorded";
  const slip = document.getElementById("vvpat-slip");
  const count = document.getElementById("vvpat-count");
  if (!slip || !count) return;
  slip.textContent = candidateLabel;
  let sec = 7;
  count.textContent = String(sec);
  const timer = setInterval(() => {
    sec -= 1;
    count.textContent = String(sec);
    if (sec <= 0) {
      clearInterval(timer);
      slip.textContent = "Vote Secured";
      count.textContent = "Your vote has been recorded successfully.";
    }
  }, 1000);
}

/**
 * @description Renders encyclopedia interface.
 * @returns {void} No return value.
 */
function renderEncyclopedia() {
  const topics = window.ENCYCLOPEDIA_TOPICS || [];
  const root = document.getElementById("encyclopedia-root");
  if (!root) return;
  root.innerHTML = `<label for="enc-search" class="sr-only">Search topics</label><input id="enc-search" data-i18n-placeholder="encyclopediaSearch" placeholder="Search topics..." /><div id="enc-count"></div><div id="enc-list"></div>`;
  const renderList = (q = "") => {
    const needle = sanitize(q).toLowerCase();
    const filtered = topics.filter((t) => t.title.toLowerCase().includes(needle) || t.body.toLowerCase().includes(needle));
    root.querySelector("#enc-count").textContent = `Showing ${filtered.length} of ${topics.length} topics`;
    root.querySelector("#enc-list").innerHTML = filtered.map((t) => `<details class="panel-card"><summary>${sanitize(t.title)}</summary><p>${sanitize(t.body)}</p></details>`).join("");
  };
  renderList();
  root.querySelector("#enc-search").addEventListener("input", debounce((e) => renderList(e.target.value), 300));
}

/**
 * @description Renders quiz UI.
 * @returns {void} No return value.
 */
function renderQuiz() {
  const root = document.getElementById("quiz-root");
  if (!root) return;
  const i = quizOrder[currentQuizIndex];
  const q = QUIZ_QUESTIONS[i];
  if (!q) return renderQuizResult();
  root.innerHTML = `<p>${currentQuizIndex + 1} / 10</p><h3>${sanitize(q.q)}</h3>${q.options.map((op, idx) => `<button class="btn btn-secondary quiz-opt" data-idx="${idx}" style="display:block;width:100%;margin:8px 0">${String.fromCharCode(65 + idx)}) ${sanitize(op)}</button>`).join("")}<div id="quiz-feedback"></div>`;
  root.querySelectorAll(".quiz-opt").forEach((b) => b.addEventListener("click", () => {
    const chosen = Number(b.dataset.idx);
    const ok = chosen === q.correct;
    if (ok) quizScore += 1;
    root.querySelector("#quiz-feedback").innerHTML = `<p>${ok ? "Correct" : "Incorrect"}: ${sanitize(q.explanation)}</p><button class="btn btn-primary" id="quiz-next">${(TRANSLATIONS[currentLang] || TRANSLATIONS.en).quizNext}</button>`;
    root.querySelector("#quiz-next").addEventListener("click", () => {
      currentQuizIndex += 1;
      renderQuiz();
    });
  }));
}

/**
 * @description Renders quiz result card.
 * @returns {void} No return value.
 */
function renderQuizResult() {
  const root = document.getElementById("quiz-root");
  if (!root) return;
  const pct = Math.round((quizScore / 10) * 100);
  const finalScore = quizScore;
  if (window.trackQuiz) window.trackQuiz(finalScore);
  const badge = quizScore <= 3 ? "Democracy Learner" : quizScore <= 6 ? "Informed Voter" : quizScore <= 8 ? "Civic Champion" : "Election Expert";
  root.innerHTML = `<div class="quiz-results" aria-live="polite"><h3>${quizScore} / 10</h3><p>${pct}%</p><h4>${badge}</h4><button class="btn btn-primary" id="quiz-retry">Try Again</button> <button class="btn btn-secondary" data-target="encyclopedia-section">Learn More</button></div>`;
  root.querySelector("#quiz-retry").addEventListener("click", () => {
    quizScore = 0;
    currentQuizIndex = 0;
    quizOrder = shuffle([...QUIZ_QUESTIONS.keys()]);
    renderQuiz();
  });

  if (window.saveQuizScore) {
    window.saveQuizScore(
      finalScore,
      sessionStorage.getItem('lang') || 'en'
    );
  }

  window.getTopScores && window.getTopScores().then(scores => {
    if (scores.length > 0) {
      const lb = document.createElement('div');
      lb.className = 'leaderboard';
      lb.innerHTML = '<h4 style="color:var(--color-accent);font-family:DM Mono,monospace;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Community Scores</h4>' +
        scores.map((s, i) =>
          '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--color-border);font-family:DM Mono,monospace;font-size:13px;">' +
          '<span>' + (i+1) + '. ' + s.language.toUpperCase() + '</span>' +
          '<span style="color:var(--color-accent)">' + s.score + '/10</span>' +
          '</div>'
        ).join('');
      const resultsEl = document.querySelector('.quiz-results, [class*="quiz-result"], [class*="result"]');
      if (resultsEl) resultsEl.appendChild(lb);
    }
  });
}

/**
 * @description Shuffles array in-place clone.
 * @param {Array} arr - Array to shuffle.
 * @returns {Array} Shuffled array.
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * @description Toggles QnA drawer visibility.
 * @returns {void} No return value.
 */
function toggleDrawer() {
  const drawer = document.getElementById("qna-drawer");
  drawer.classList.toggle("open");
  drawer.setAttribute("aria-hidden", String(!drawer.classList.contains("open")));
}

/**
 * @description Builds QnA drawer UI.
 * @returns {void} No return value.
 */
function renderDrawer() {
  const drawer = document.getElementById("qna-drawer");
  const contentRoot = document.getElementById("qna-drawer-content");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatClose = document.getElementById("chat-close");
  if (!drawer) return;
  if (!contentRoot) return;
  if (!chatInput || !chatSend || !chatClose) return;
  const hasKey = APP_CONFIG.GEMINI_API_KEY && APP_CONFIG.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE" && APP_CONFIG.GEMINI_API_KEY.length > 10;
  contentRoot.innerHTML = `<h3>ElectIQ Assistant</h3><p>${langNames[currentLang]}</p>${hasKey ? "" : "<div class='panel-card'>Demo Mode — Add Gemini API key for live answers</div>"}<div id="chat-log"></div><div id="suggestions"></div><p>${qnaCount}/${MAX_QNA_QUESTIONS} questions</p>`;
  const suggestions = shuffle([...DEMO_QA]).slice(0, 4);
  drawer.querySelector("#suggestions").innerHTML = suggestions.map((s) => `<button class="btn btn-secondary q-chip" style="width:100%;margin-top:6px">${sanitize(s.q)}</button>`).join("");
  drawer.querySelectorAll(".q-chip").forEach((chip, i) => chip.addEventListener("click", () => askQuestion(suggestions[i].q, hasKey)));
  chatSend.onclick = () => askQuestion(chatInput.value, hasKey);
  chatClose.onclick = toggleDrawer;
  chatInput.onkeydown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      askQuestion(chatInput.value, hasKey);
    }
  };
  applyTranslations(currentLang);
}

/**
 * @description Appends chat bubble in drawer.
 * @param {string} role - Message role.
 * @param {string} text - Chat message.
 * @returns {void} No return value.
 */
function addChat(role, text) {
  const log = document.getElementById("chat-log");
  if (!log) return;
  const div = document.createElement("div");
  div.className = "panel-card";
  div.style.margin = "8px 0";
  div.style.background = role === "user" ? "#2563eb" : "#1f2937";
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

/**
 * @description Fetches response from Gemini API with fallback
 * @param {string} userMessage - Sanitized user question
 * @param {string} lang - Current language code for response language
 * @returns {Promise<string>} AI response text or fallback message
 */
async function askQuestion(raw, hasKey) {
  if (qnaCount >= MAX_QNA_QUESTIONS) {
    addChat("assistant", "Session limit reached. Please refresh to ask more.");
    return;
  }
  const q = sanitize(raw || "");
  if (!q.trim()) return;
  addChat("user", q);
  qnaCount += 1;
  if (!hasKey) {
    const match = DEMO_QA.find((d) => d.q.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(d.q.toLowerCase().slice(0, 10)));
    addChat("assistant", (match || DEMO_QA[0]).a);
    return;
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const prompt = `You are ElectIQ, an expert on Indian election processes. Answer ONLY questions about Indian elections, ECI rules, voter registration, EVMs, NOTA, constituencies, and civic voting rights. Never discuss political parties by name, candidates, or give political opinions. Be factual, concise, and encouraging to voters. Always respond in ${langNames[currentLang]}. Keep responses under 150 words.\nQuestion: ${q}`;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${APP_CONFIG.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error("Service unavailable");
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "I am having trouble connecting. Please try again in a moment, or choose from suggested questions.";
    addChat("assistant", sanitize(text));
  } catch (e) {
    addChat("assistant", "I am having trouble connecting. Please try again in a moment, or choose from the suggested questions below.");
    addChat("assistant", DEMO_QA[0].a);
  }
}

/**
 * @description Initializes Three.js particle background.
 * @returns {void} No return value.
 */
function initParticles() {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.THREE) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.position.z = 140;
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const colors = [];
  for (let i = 0; i < 800; i += 1) {
    vertices.push((Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300);
    const blue = new THREE.Color("rgba(37,99,235,0.6)");
    const lime = new THREE.Color("rgba(163,230,53,0.3)");
    const c = Math.random() > 0.5 ? blue : lime;
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 1.4, vertexColors: true }));
  scene.add(points);
  const lineGeo = new THREE.BufferGeometry();
  const lineMat = new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.09 });
  const line = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(line);
  const animate = () => {
    points.rotation.y += 0.0008;
    points.rotation.x += 0.0003;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

window.ENCYCLOPEDIA_TOPICS = [
  { category: "Basics", title: "What is a General Election?", body: "India holds Lok Sabha elections every 5 years to elect 543 MPs. Majority mark is 272 seats." },
  { category: "Basics", title: "Who can vote in India?", body: "Indian citizen aged 18+ with name in electoral roll can vote subject to legal qualification." },
  { category: "Registration", title: "How to register as a voter (Form 6)", body: "Use voters.eci.gov.in or Voter Helpline app. Submit Form 6 with address and age proof." },
  { category: "At the Booth", title: "What is VVPAT?", body: "VVPAT shows candidate slip for exactly 7 seconds and drops into sealed box." },
  { category: "Election Types", title: "Lok Sabha Elections", body: "Held every 5 years for 543 constituencies to elect MPs for central government." },
  { category: "Election Types", title: "Vidhan Sabha Elections", body: "State assembly elections elect MLAs, generally every 5 years." },
  { category: "Myths vs Facts", title: "MYTH: EVMs can be hacked remotely", body: "EVMs are standalone devices with no network interface, internet or Bluetooth." },
  { category: "Results & Counting", title: "How are votes counted after election day?", body: "EVMs move to strong rooms and are counted round-wise under observer supervision." },
  { category: "ECI & Governance", title: "What is the Election Commission of India (ECI)?", body: "Constitutional authority under Article 324 that conducts elections." },
  { category: "At the Booth", title: "What is NOTA?", body: "NOTA is None of the Above option on EVM and is counted officially." }
];

/**
 * @description Initializes all app modules on load.
 * @returns {void} No return value.
 */
function initApp() {
  initializeTheme();
  setLanguage(currentLang);
  renderDrawer();
  renderEvm();
  renderEncyclopedia();
  renderQuiz();
  renderStep(1);
  loadMapsAPI();
  document.getElementById("qna-fab")?.addEventListener("click", toggleDrawer);
  document.getElementById("btn-close-qna")?.addEventListener("click", toggleDrawer);
  document.getElementById("btn-first-time")?.addEventListener("click", () => {
    showView("main-content");
    startWizard(1);
  });
  document.getElementById("btnStartWizard")?.addEventListener("click", () => {
    showView("main-content");
    startWizard(1);
  });
  document.getElementById("btn-specific")?.addEventListener("click", toggleDrawer);
  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
  document.getElementById("menu-toggle")?.addEventListener("click", () => document.getElementById("main-nav").classList.toggle("open"));
  document.querySelectorAll(".lang-btn").forEach((btn) => btn.addEventListener("click", () => setLanguage(btn.dataset.lang)));
  document.querySelectorAll(".stat-number").forEach((el) => animateNumber(el, Number(el.dataset.target)));
  setupStackAnimations();
  showView("hero");
}

/**
 * @description Animates numeric stat from zero.
 * @param {HTMLElement} el - Target element.
 * @param {number} target - Target number.
 * @returns {void} No return value.
 */
function animateNumber(el, target) {
  const duration = 1200;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration);
    el.textContent = String(Math.floor(target * p));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/**
 * @description Configures sticky card and section observers.
 * @returns {void} No return value.
 */
function setupStackAnimations() {
  const cards = [...document.querySelectorAll(".stack-card")];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("in-view", entry.isIntersecting);
      if (entry.isIntersecting) {
        cards.forEach((c) => c.classList.toggle("dimmed", Number(c.dataset.card) < Number(entry.target.dataset.card)));
      }
    });
  }, { threshold: 0.4 });
  cards.forEach((c) => io.observe(c));
}

document.addEventListener("DOMContentLoaded", initApp);
