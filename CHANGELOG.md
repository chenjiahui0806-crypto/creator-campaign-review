# Changelog

All notable changes to this project are recorded here. Dates are when the change was made, not when it is pushed.

## [Unreleased]
- Real per-piece data source for the detail page, keyed on the `piece` identifier already passed from the calendar.
- Automated data ingestion (P1), to replace manual entry as the largest cost in the MVP.
- Run the SQL against a real database instead of validating it by inspection.

## v1.3 — SQL, verification, and entry page added
- Added `/sql`: schema plus five queries (comparable set, baseline percentiles, stage deviation, R1-R7 rule evaluation, pre-save data validation), each tied to a specific PRD section.
- Added `/verification`: synthetic baseline data and a script that checks all 7 attribution rules fire correctly — 7/7 passing.
- Added `prototypes/page3_entry.html`, the M2 content-entry form (static — doesn't persist data).
- Added a "New content entry" link from the calendar page to the entry form.
- Live demo link in README updated to the actual GitHub Pages URL.

## v1.2 — Calendar navigation refinements
- Moved the Month/Day toggle next to the "Publishing Calendar" title so its position is stable across both views.
- Day view's date picker replaced with prev/next arrows that step through the selected month's pieces, plus a position counter ("3 / 7 pieces this month").
- `index.html` now redirects straight into the calendar instead of showing an intermediate chooser page.

## v1.1 — Prototype navigation wired
- Calendar events on the month grid and the day view now link to the detail page, each carrying a `piece` query parameter.
- Detail page's "Back to calendar" is now a functional link instead of static text.
- Added `prototypes/index.html` as a live-demo entry point linking both pages.

## v1.0 — PRD finalized
- 13-section PRD complete: overview, goals and non-goals, user analysis, benchmarking, funnel definitions, metrics, attribution, functional modules M1–M9, dashboard specification, constraints, MVP success criteria, data model, platform metrics, walkthrough.
- Attribution rule set fixed at R1–R7 with rule IDs for hit-rate measurement.
- Confidence tiers set: High ≥12 pieces, Medium 8–11, Low 2–7, None <2.
- Reading window fixed at day 2 for rate metrics; refund rate deferred to P1.
- Skill/Framework architecture documented: three Skills (Data Validation, Locate & Attribute, Recommend & Validate) and the implementation spec.
