# SQL

These queries implement the "code executes, Skill only judges" split described in `/skills/skill-framework.md` Part 3. Every number here — baselines, deviations, which rule fires — is produced by SQL, not by a Skill. The three Skills (Data Validation, Locate & Attribute, Recommend & Validate) only run once these queries have already produced a verdict, and only to interpret or explain it in language, never to compute it.

Written for PostgreSQL (`percentile_cont`, array/JSONB columns). Not executed against a live database — there's no backend behind this prototype yet — but every query here was written directly off the PRD's field definitions and metric formulas so it accurately reflects the intended implementation, and the R1-R7 logic in `05_rule_evaluation.sql` was verified against the Python model in `/verification` before being ported to SQL.

| File | Purpose | PRD reference |
|---|---|---|
| `01_schema.sql` | Table definitions for Content, Product, Baseline, Review | Section 11, Data Model |
| `02_comparable_set.sql` | Finds a piece's comparable history (same creator, platform, boost status, 6-month window) | Section 3, Benchmarking |
| `03_baseline_percentiles.sql` | Computes p25/p50/p75 per metric across the comparable set | Section 3; skill-framework.md upstream engine step 3 |
| `04_stage_deviation.sql` | Reads a piece's rates against its baseline, labels below/within/above | Section 6, step two |
| `05_rule_evaluation.sql` | Locates the weakest funnel stage and fires the matching R1-R7 rules | Section 6, step three; skill-framework.md rule table |
| `06_funnel_validation.sql` | Pre-save check: funnel monotonicity, reading age, field completeness | Skill 1, Data Validation |

## Order of execution

A piece moves through these roughly in file order: `06` validates it on entry, `02` + `03` keep its creator's baseline current, `04` reads the new piece against that baseline once it's usable, and `05` turns those readings into the diagnosis a Skill will explain in words.
