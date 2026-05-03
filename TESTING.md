# ElectIQ Testing Documentation

## Overview
ElectIQ includes 70+ automated tests covering sanitization,
translations, config validation, calendar URL generation,
quiz logic, Firebase integration, accessibility,
security, performance, and mobile compatibility.

## Running Tests
Open the live app and append ?debug=true to the URL:
https://electiq-a66b3.web.app/?debug=true

A test results panel appears at the bottom of the screen
showing pass/fail for all test cases.

## Test Categories

| Category | Count | What is Tested |
|----------|-------|----------------|
| Sanitization | 10 | XSS, special chars, edge cases |
| Translations | 10 | 8 languages, required keys, no empty values |
| Config | 5 | Required keys, no undefined values |
| Calendar | 5 | URL generation, encoding, params |
| Quiz | 8 | Questions, options, answers, badges |
| Demo Q&A | 5 | Array structure, NOTA question |
| Firebase | 5 | Analytics, Firestore, tracking functions |
| Accessibility | 8 | ARIA, skip link, tabindex, buttons |
| Security | 5 | CSP, no eval, no inline keys |
| Mobile | 3 | Viewport meta, touch targets |
| Navigation | 3 | Nav element, logo, structure |
| Language Detection | 5 | State to language mapping |
| i18n | 3 | Translation function, STATE_LANG |
| Misc | 5 | Canvas, encyclopedia, EVM |

## Security Notes
- No API keys stored in repository
- Keys injected at deploy time
- All inputs pass through sanitize()
- CSP headers configured in firebase.json
- Domain restrictions on all API keys
