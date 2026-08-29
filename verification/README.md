# Verification

`generate_and_verify.py` tests whether the R1-R7 attribution rules and the baseline percentile logic actually behave the way `/skills/skill-framework.md` and the PRD describe, before that logic gets ported into `/sql`.

## What it does

1. Generates 20 synthetic historical pieces for one fictional TikTok creator (organic, one product), matching the PRD's Content entity fields exactly. All numbers are fabricated for testing — nothing here is scraped or real platform data.
2. Computes the p25/p50/p75 baseline across that history, same formula as `sql/03_baseline_percentiles.sql`.
3. Builds 7 target pieces, each engineered to sit on one side of a specific rule's threshold, so it should trigger exactly one rule.
4. Runs the same weak-stage-location + rule-firing logic described in PRD section 6 and the rule table in `skill-framework.md`, and checks each target piece fired the rule it was built to test.

## Result

7/7 target pieces triggered their intended rule. Full run saved in `output.txt`.

One thing worth flagging: the R1/R2/R3 target pieces also fire R7 as a side effect, because dragging down store_visit or click volume lowers total GMV while views stay constant, which pulls ARPU below baseline too. This matches the spec — Skill 2 describes R7 as an *additive* check ("下单转化正常而ARPU偏低时，追加人群分支评估"), not exclusive to a single weak stage — so seeing it fire alongside R1/R2/R3 is correct behavior, not a bug.

## Files

- `generate_and_verify.py` — the script itself
- `baseline_history.json` / `.csv` — the 20 synthetic historical pieces
- `target_pieces.json` — the 7 rule-testing pieces
- `baseline_summary.json` — the computed p25/p50/p75 baseline
- `output.txt` — a saved run of the script

## Running it

```
python3 generate_and_verify.py
```

No dependencies beyond the Python standard library.
