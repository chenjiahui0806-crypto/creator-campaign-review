# Creator Campaign Review — Technical Overview

This is the detailed, technical companion to the main [README.md](./README.md), which is written for a general audience. This document is for anyone who wants to see how the product is actually built: the reasoning behind the design, the data model, and the code.

A post-publish analytics tool that tells a sponsored-content creator which stage of their conversion funnel underperformed, why it likely happened, and what to change on the next piece.

This project originated from firsthand experience managing social media accounts and running brand deals. It exists to close a gap creators face today: there is no systematic way to analyze sponsored content performance after publishing, attribute the likely cause, and turn that into a concrete action for the next piece.

**Live demo:** https://chenjiahui0806-crypto.github.io/creator-campaign-review/prototypes/

## What this is

The product has five pages: a dashboard, a calendar, a content-entry form, and two versions of the review page (one polished static example, one that computes a live diagnosis from whatever data is in your browser). The calendar browses published pieces on their publish date, colored by how each one read against the creator's own baseline. Tapping a piece opens its review: a diagnosis of which funnel stage underperformed, the likely content-side or commercial-side reasons with evidence, an action checklist, and a post-publish validation panel that checks whether the advice actually worked once the next piece is entered.

Three design constraints run through the whole product:

- Absolute values are never compared across pieces at different stages, because they scale with reach and follower growth rather than with the piece itself.
- No industry-average benchmark is used for cross-account comparison. Every reading compares a creator only against their own history, and platforms (TikTok vs. RedNote) and boost status (organic vs. boosted) each hold their own separate baseline.
- A first piece with no history is still analyzable, and confidence is expressed in words (high / medium / low / none) rather than hidden behind a chart the user has to interpret.

## Repository structure

```
/prd            Product requirements document (13 sections)
/prototypes     Interactive HTML pages — dashboard, calendar, entry, and review pages, wired to a shared client-side engine
/skills         AI Skill and Framework architecture for the analysis engine
/sql            The engine's queries: schema, baseline calculation, deviation reading, R1-R7 rule evaluation, data validation
/verification   A script that generates synthetic data and checks the R1-R7 rules actually fire the way the spec describes
```

### /prd
`PRD.md` covers overview, goals and non-goals, user analysis, benchmarking, funnel definitions, metrics, attribution, functional modules M1–M9, dashboard specification, constraints, MVP success criteria, data model, platform metrics, and a walkthrough.

Key decisions: reading window at day 2 for rate metrics, 7 fixed attribution rules (R1–R7) so every conclusion traces to a rule with a measurable hit rate, confidence tiers (High ≥12 comparable pieces, Medium 8–11, Low 2–7, None <2), gross commercial figures at P0 with refund rate deferred to P1, and single-dimension audience analysis with purchase propensity expressed in words.

### /prototypes
- `index.html` — redirects into the dashboard, the live-demo entry point.
- `page0_dashboard.html` — aggregate stats (pieces tracked, total views, total GMV), an order-conversion trend chart, a strongest-pieces list, a recent-insights feed of whatever rules have fired, and a platform breakdown — all computed live from whatever data exists in the browser.
- `page1_calendar.html` — month and day calendar views, color-coded by order-conversion reading against baseline. The day view's prev/next arrows step through that month's pieces.
- `page2_detail.html` — a polished, fixed example review: diagnosis, action list, conversion funnel, stage deviation chart, commercial metrics, audience-vs-buyers comparison, opening retention curve, engagement stats, and a post-publish validation verdict. Kept static intentionally, as a reference for the intended full visual design.
- `page3_entry.html` — the M2 content-entry form. Required identifying fields up top, optional funnel/content/commercial/audience fields grouped below. Supports two ways in: filling the form by hand, or bulk-importing a CSV/Excel file through a flexible header-matching parser with an editable preview grid. Submitting actually writes to the browser's local storage and computes a real diagnosis.
- `page4_review.html` — the live counterpart to page2: reads a `piece` id from the URL, looks it up (seed data or anything entered through page3), and renders a real diagnosis computed by the shared engine, following the same visual layout as page2.
- `js/engine.js` — the shared client-side engine: local storage persistence, derived metrics, baseline percentile calculation, and the R1-R7 diagnosis logic. This is the browser-side implementation of the queries in `/sql`, and every page above calls into it rather than duplicating logic.

Fifteen seed pieces ship with the engine, covering both platforms (TikTok, RedNote), both boost statuses (organic, boosted), and all seven attribution rules firing at least once, so the product tells a complete story without requiring any manual data entry first.

### /sql
Six queries implementing the engine described in `/skills`: schema, comparable-set selection, baseline percentile calculation, stage deviation reading, R1-R7 rule evaluation, and pre-save data validation. See `sql/README.md` for how they chain together and which PRD section each one implements. `js/engine.js` is a faithful client-side port of this same logic, so the browser demo and the intended server-side implementation stay consistent.

### /verification
A script that generates synthetic baseline history and seven rule-testing pieces, then checks the R1-R7 attribution logic fires correctly against each one — 7/7 currently pass. See `verification/README.md` for details. This same logic was also used to catch and fix a real bug in the weak-stage tie-break rule in `js/engine.js`, where an upstream stage with zero deviation could incorrectly be selected as "weakest" over a genuinely underperforming downstream stage.

### /skills
`skill-framework.md` documents the analysis engine in three parts: the 10-step platform flow, the three Skill specifications (Data Validation, Locate & Attribute, Recommend & Validate), and the implementation spec (data model, funnel definitions, metric formulas, the R1–R7 rule table, confidence tiers).

The design principle: SQL and code handle every deterministic calculation. Skills only run at the three points that require judgment — validating whether data is trustworthy, attributing a weak stage to a likely cause, and generating and later validating a recommendation. Skill output is tightly bounded so it never decides for the user, only analyzes and suggests.

## Status

- PRD: final draft, 13 sections complete.
- Prototypes: five pages built and linked (dashboard, calendar, two review variants, entry with bulk import); backed by a real client-side engine, not just static mockups.
- Skill/Framework architecture: documented.
- SQL: schema and core queries written directly off the PRD's field definitions; `js/engine.js` is a working client-side port of the same logic.
- Verification: R1-R7 attribution logic tested against synthetic data, 7/7 rules firing as specified; the same test process caught a real bug in the production engine's tie-break logic, since fixed.

See `CHANGELOG.md` for version history and `Issues` for open questions and planned work.
