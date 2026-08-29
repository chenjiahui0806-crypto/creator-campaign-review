# Creator Campaign Review

A post-publish analytics tool that tells a sponsored-content creator which stage of their conversion funnel underperformed, why it likely happened, and what to change on the next piece.

This project originated from firsthand experience managing social media accounts and running brand deals. It exists to close a gap creators face today: there is no systematic way to analyze sponsored content performance after publishing, attribute the likely cause, and turn that into a concrete action for the next piece.

**Live demo:** replace this line with your GitHub Pages link once Pages is enabled, e.g. `https://<your-username>.github.io/creator-campaign-review/prototypes/`

## What this is

The product is two pages. The calendar browses published pieces on their publish date, colored by how each one read against the creator's own baseline. Tapping a piece opens its review: a diagnosis of which funnel stage underperformed, the likely content-side or commercial-side reasons with evidence, an action checklist, and a post-publish validation panel that checks whether the advice actually worked once the next piece is entered.

Three design constraints run through the whole product:

- Absolute values are never compared across pieces at different stages, because they scale with reach and follower growth rather than with the piece itself.
- No industry-average benchmark is used for cross-account comparison. Every reading compares a creator only against their own history.
- A first piece with no history is still analyzable, and confidence is expressed in words (high / medium / low / none) rather than hidden behind a chart the user has to interpret.

## Repository structure

```
/prd          Product requirements document (13 sections)
/prototypes   Interactive HTML prototypes — calendar and detail pages, wired to navigate between each other
/skills       AI Skill and Framework architecture for the analysis engine
```

### /prd
`PRD.md` covers overview, goals and non-goals, user analysis, benchmarking, funnel definitions, metrics, attribution, functional modules M1–M9, dashboard specification, constraints, MVP success criteria, data model, platform metrics, and a walkthrough.

Key decisions: reading window at day 2 for rate metrics, 7 fixed attribution rules (R1–R7) so every conclusion traces to a rule with a measurable hit rate, confidence tiers (High ≥12 comparable pieces, Medium 8–11, Low 2–7, None <2), gross commercial figures at P0 with refund rate deferred to P1, and single-dimension audience analysis with purchase propensity expressed in words.

### /prototypes
- `index.html` — entry point for the live demo, links to both pages below.
- `page1_calendar.html` — month and day calendar views, color-coded by order-conversion reading against baseline.
- `page2_detail.html` — diagnosis at the top, action list, conversion funnel with per-stage definitions, stage deviation chart, commercial metrics, audience-vs-buyers comparison, opening retention curve, engagement stats, and post-publish validation verdict.

Clicking a piece on the calendar navigates to its detail page. The detail page's content is currently a fixed example dataset; the navigation already carries a `piece` identifier through the URL, so wiring in a real per-piece data source is a drop-in change rather than a redesign.

### /skills
`skill-framework.md` documents the analysis engine in three parts: the 10-step platform flow, the three Skill specifications (Data Validation, Locate & Attribute, Recommend & Validate), and the implementation spec (data model, funnel definitions, metric formulas, the R1–R7 rule table, confidence tiers).

The design principle: SQL and code handle every deterministic calculation. Skills only run at the three points that require judgment — validating whether data is trustworthy, attributing a weak stage to a likely cause, and generating and later validating a recommendation. Skill output is tightly bounded so it never decides for the user, only analyzes and suggests.

## Status

- PRD: final draft, 13 sections complete.
- Prototypes: two pages built and linked; content is a static example dataset pending a real backend.
- Skill/Framework architecture: documented, not yet implemented.

See `CHANGELOG.md` for version history and `Issues` for open questions and planned work.
