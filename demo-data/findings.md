# Findings from the demo data

This folder holds the demo dataset and the conclusions drawn from it. Every design choice below is stated as a conclusion the data supports, not as an assumption made in advance.

## Files

- `sample_content.csv` holds 18 historical pieces plus 1 target piece for one food creator on TikTok. The 18 historical pieces form the baseline. The target piece (T01) is the one being diagnosed.
- `time_window_data.csv` holds the same target piece measured at day 1, day 2, day 3, and day 7 after publishing. It is used to decide when the data is ready to read.

## Finding 1. The reading window is day 2, and the data is what decides it

The product reads a piece at day 2. This was not chosen because day 2 is convenient. It was chosen because the data shows day 2 is the earliest point at which the conversion rates have stopped moving.

The evidence is the day-over-day change in the order conversion rate for the target piece.

| Reading day | Order conversion rate | Change vs previous reading | Orders accumulated |
|---|---|---|---|
| Day 1 | 5.14% | first reading | 470 |
| Day 2 | 7.77% | +2.63 points | 1,305 |
| Day 3 | 7.93% | +0.17 points | 1,452 |
| Day 7 | 8.00% | +0.07 points | 1,541 |

Two things follow directly from these numbers.

- On day 1 the rate is still forming. It sits at 5.14%, more than 2.8 points below where it settles, because orders are still arriving and the denominator is thin. A conclusion drawn on day 1 would report an order problem far worse than the real one.
- By day 2 the rate has essentially settled. The jump from day 1 to day 2 is 2.63 points, but from day 2 onward each further day adds less than 0.2 points. Reading at day 2 captures a rate within 0.23 points of the final value.

The cost of waiting past day 2 is not accuracy. It is time. Waiting from day 2 to day 7 improves the reading by only 0.23 points, but it costs five days. Because this creator publishes a new piece every two to three days, a conclusion delivered on day 7 arrives after the next piece has already been decided. Day 2 is therefore the point where the rate is stable enough to trust and still early enough to act on.

This is why absolute totals such as GMV and order count are shown but never compared. At day 2 they are still climbing, from 1,305 orders to a final 1,541. Only the rates are stable enough to read, which is why every rule in the product rests on rates rather than totals.

## Finding 2. The baseline is personal, and the spread is wide enough to matter

The 18 historical pieces set the baseline for this creator. Reading them as a distribution rather than an average gives the following.

| Metric | p25 | p50 | p75 |
|---|---|---|---|
| Order conversion rate | 12.5% | 13.1% | 13.8% |
| First 3s completion | 70.0 | 71.5 | 73.8 |
| GMV per click | 5.50 | 5.70 | 5.87 |
| Unit price | 39.0 | 42.0 | 44.0 |

The spread is what makes the reading meaningful. A piece is called below normal only when it falls under the 25th percentile of this creator's own history, not under some external standard. This is why no industry average is used. The creator's own range already tells us what normal looks like for them.

## Finding 3. The target piece fails at the order stage, and the data separates content from offer

Reading the target piece against the baseline above produces a clean diagnosis.

| Stage or metric | Target | Baseline p50 | Reading |
|---|---|---|---|
| Store visit rate | 15.0% | ~14% | within normal |
| Click rate | 50.0% | ~48% | within normal |
| Order conversion rate | 8.0% | 13.1% | below normal |
| First 3s completion | 58 | 71.5 | below normal |
| GMV per click | 4.0 | 5.70 | below normal |
| Unit price | 68 | 42.0 | above normal |

The shape of these numbers is what carries the conclusion. Store visit and click both read normal, so the drop is not in getting people to the product page. The drop is at the order stage. Two signals then split the cause.

- On the content side, first 3s completion is below normal, so the opening did not hold the viewers who would otherwise have converted.
- On the commercial side, GMV per click is below normal while the unit price is above normal, so the viewers who did reach the page were worth less than usual, which points at the offer rather than the content.

Neither signal is asserted as the single cause. Both are reported with the evidence value and the baseline they are compared against, which is what lets the next piece test whether acting on them actually helped.
