# Creator Campaign Review — Product Requirements Document

## 0. Overview

Creator Campaign Review is a post-publish analytics tool that tells a sponsored-content creator which stage of their conversion funnel underperformed, why it likely happened, and what to change on the next piece.

The document rests on three assumptions that shape everything below.

- The product is an external analysis layer, which means it has no platform-side access and cannot run controlled experiments such as A/B tests.
- Every conclusion is correlational, which means the product does not establish causation and does not claim to.
- Data at P0 is entered manually by the user, which means automated ingestion is a P1 goal and is treated as a delivery risk rather than an assumption.

The product depends on the platform exposing funnel counts, content metrics, commercial values, and audience and buyer profiles to the creator, and where a platform withholds any of these, the rules depending on it do not run. It depends on the creator having at least eight prior comparable pieces for a reliable baseline, and below this, readings are indicative only. At P0 it depends on the creator entering data manually, since it has no platform-side access.

## 1. Goals and Non-Goals

The product pursues three goals.

- It identifies which stage of the conversion path underperformed, relative to the creator's own comparable history.
- It returns a fixed set of candidate reasons for that stage, drawn from a defined framework rather than generated freely.
- It converts each review into one concrete direction for the next piece, and checks that direction once the next piece is published.

The product deliberately excludes four things.

- It does not compare a creator against other creators or against category averages.
- It does not compare performance across platforms.
- It does not analyze the video content itself, because it reads structured signals only.
- It does not predict whether a piece will succeed before publication.

## 2. User Analysis

This section establishes the parameters that govern every subsequent design decision. The constraints here determine the reading window, the baseline size, the benchmarking approach, and the boundary of the MVP.

The user is a creator who already runs sponsored campaigns and sells products through their content, sitting between complete beginners and top-tier accounts.

### Quantified assumptions

Each assumption carries a consequence, and the consequence is where the design follows from.

- **The user produces roughly 40 to 50 campaign pieces a year.** Inside the six-month baseline window, this leaves 20 to 25 comparable pieces, which is the most consequential number in this document. It is the reason the baseline cannot be split into fine layers, because dividing 20 to 25 pieces across several dimensions produces cells of two or three, which cannot support a judgment about whether a piece is above or below normal.
- **The user publishes a new piece every two to three days.** This means the user decides what to make next within days of publishing the last piece, so a conclusion delivered on day seven arrives after that decision has been made. This is why the primary reading age is day two, and why metrics that require longer windows are excluded from the MVP rather than delaying the conclusion until they settle.
- **The user is vertical by category.** A food creator takes snack, beverage, and kitchenware campaigns and does not take consumer electronics or beauty, so category is close to constant for a given creator. This is why category organizes the content library but does not select the baseline.
- **The user works across two or three platforms but concentrates on one.** This is why platform selection is user-driven rather than automatic, and why each selected platform holds an independent baseline.

### Workflow

The product inserts itself into the sequence below, and the timing of each step is what constrains the design.

- The user accepts a campaign, agreeing a product, a price, and a content format with the brand.
- The user produces and publishes the piece.
- Within twenty-four hours, retention and completion metrics have stabilized and do not accumulate further.
- Around day two, conversion rates have stabilized enough to read, and impressions have largely accumulated.
- Around day two to three, the user decides what to make next, and this is the decision the product exists to serve.
- Around day seven, gross merchandise value and order volume finish accumulating.
- Around day thirty, refunds settle.

The product must deliver its conclusion at the point where the user decides what to make next. The later windows fall after that decision, which is why the MVP reads at day two and treats those windows as out of scope.

### Data availability

What the user can obtain from platform dashboards determines what the product can compute.

The following are available to the user, and the product relies on them.

- The funnel counts are available, meaning impressions, views, store visits, clicks, and orders.
- The content metrics are available, meaning first-seconds completion, average watch time, completion rate, and engagement.
- The commercial values are available, meaning gross merchandise value, order count, unit price, and discount.
- The product's standing is available, meaning its rating and review count.
- The audience profile is available, meaning the gender, age, and region distribution of viewers.
- The buyer profile is available, meaning the same distributions for purchasers.

Because both the audience profile and the buyer profile are available, the product can compute revenue per segment along a single dimension, and it can compute purchase propensity, which is buyer share divided by audience share.

The following are not available, and the product does not attempt to work around them.

- Crossed segments are not available, meaning the intersection of two dimensions such as women aged twenty-five to thirty-four. Dashboards report each dimension independently, and crossed data exists only in advertising-side tools that require an advertiser account and a segment defined before the campaign runs. This product serves creators reviewing organic content after publication, so audience analysis is limited to single dimensions.
- User-level purchase paths are not available, so the product cannot determine which viewers a given order came from and cannot construct its own attribution.
- Platform attribution logic is not available, so the product accepts the platform's attribution and does not override it.

### Capability and willingness

- **The user is comfortable with metrics but is not an analyst.** They read platform dashboards routinely and understand impressions, completion, and conversion, but they do not compute distributions or reason about sample size. This is why the product states conclusions rather than presenting data for interpretation, and expresses confidence in words rather than intervals.
- **Manual entry is the largest cost the MVP imposes.** The user must transcribe roughly fifteen fields per piece from their platform dashboard, which makes this the most likely point of abandonment. This is why first-entry completion is a pass condition in the success criteria, and why automated ingestion is the first item in P1.

### Out of scope

- **Creators below the baseline threshold are out of scope.** A creator with fewer than eight prior pieces receives low-confidence readings on every review, so serving them means either withholding the core output or delivering conclusions the data does not support.
- **Top-tier creators are out of scope.** They generally have agency support performing this analysis already, so the need is met.

## 3. Benchmarking

Every judgment compares a piece against the creator's own history on the same platform. No industry standard or peer comparison is used, because follower composition, price points, and content style differ enough between creators that an external standard would carry no information.

### The baseline

- Comparable pieces are the creator's own pieces on the same platform, matching the target's boost status and published inside the last six months.
- Boosted and organic pieces never share a baseline, because impressions on a boosted piece were not earned by the content.
- The window is six months, because audience composition and platform distribution shift over longer spans.
- The baseline is a distribution rather than an average. Every metric carries its 25th, 50th, and 75th percentile, and a piece is read by its position in that distribution.

### Why the baseline is not layered

Category looks like the natural layer, but it does not work for this user, because creators are vertical and their campaigns stay inside one broad category, so splitting by category produces one cell holding everything. Content format does separate the funnel, since an unboxing leads with the selling point while a daily share carries it in the middle, but splitting the baseline by format would halve an already thin sample. The product therefore keeps the whole history as one baseline and handles format distortion by two other means.

- Most diagnosis reads shape rather than level. The primary question is not whether a rate is high or low, but where the funnel breaks relative to itself. When store visit and click both read normally and order does not, the drop sits at the order stage, and that relationship holds regardless of format, because it compares stages against each other inside the same piece. This is why shape-based diagnosis is the default path.
- Where an absolute level is needed, format is corrected rather than separated. The two rules that read retention against an absolute baseline apply a format coefficient, which is the median of that metric across the creator's pieces in that format divided by the median across all pieces. A piece is normalized by that coefficient before comparison. The coefficient is computed only where the format holds five or more pieces; below that, the full baseline is used and the reading is marked as not adjusted for format.

### Absolute values are not compared

Impressions, views, gross merchandise value, and order counts are displayed but are never compared against the baseline and never used as evidence for a factor. These figures scale with follower count and paid promotion, both of which change over the six-month window and neither of which the piece controls. A creator who grew from thirty thousand to one hundred thousand followers would see every recent piece read as far above baseline, which would reflect the account rather than the content. All rules therefore rest on rates and snapshots, which stay stable against follower growth because their numerator and denominator move together.

### Confidence

- The label is high where twelve or more comparable pieces exist.
- The label is medium where eight to eleven comparable pieces exist.
- The label is low where two to seven comparable pieces exist, and the reading indicates a direction only while the interface states how many more pieces are needed.
- The label is none where fewer than two comparable pieces exist, and metrics are shown without comparison while no factor is raised.

Any active limitation, meaning a boost mismatch, a non-standard reading age, or a format sample below five where a format-sensitive rule applies, caps the label at medium regardless of baseline size.

## 4. Funnel Stage Definitions

Every stage is counted on the selected platform only. Where the platform's own definition differs, the platform's definition governs, and the difference is recorded as a data-quality note on the piece.

- An impression is counted when the piece was rendered in a viewer's feed, and it is counted per view session rather than per unique viewer.
- A view is counted when the piece was watched past the platform's view threshold, and a render with no playback is not counted. This is the denominator for ARPU.
- A store visit is counted when the viewer tapped the product tag and the product page finished loading, and a tap where the page failed to load is not counted.
- A click is counted when the viewer tapped add to cart or buy now inside the product page and the next step rendered, and a tap that does not advance is not counted. Repeated taps by one viewer inside one session count as a single click.
- An order is counted when an order was submitted and paid, and orders that were submitted but left unpaid are not counted.
- A refund is counted when a paid order was refunded or returned inside the refund window. Refunds are a P1 metric, because refund rate is not available at the day-two reading age.

Reading times are governed by how each metric accumulates.

- Retention, completion, and engagement are read at day two and are final at day two, because they do not accumulate further.
- Conversion rates are read at day two, by which point they have stabilized enough to compare.
- Impressions, gross merchandise value, and order counts are displayed at day two but are not used as evidence, because they are still accumulating and are excluded from comparison.

## 5. Metrics

Every metric is displayed as its absolute value together with its deviation from the baseline, except where the metric is excluded from comparison, in which case the absolute value is shown alone.

### Funnel metrics
- The store visit rate is store visits divided by impressions.
- The click rate is successful clicks divided by store visits.
- The order conversion rate is paid orders divided by store visits.

### Commercial metrics
- Gross merchandise value is the value attributed to the piece, displayed but not compared, because it accumulates over time and scales with reach.
- ARPU is gross merchandise value divided by views, and it separates a piece that reached many people from a piece that reached the right people, because a piece with high impressions and low ARPU was shown to an audience that does not buy.
- GMV per click is gross merchandise value divided by clicks, and read together with ARPU it separates a content-side problem from a commercial-side problem, because low ARPU with normal GMV per click points at the content while low ARPU with low GMV per click points at the offer.
- Average order value is gross merchandise value divided by orders.
- Unit price and discount describe the offer, and a unit price well above the creator's usual band is a candidate reason for a weak order stage.

Refund rate and net values, meaning net GMV and net orders, are P1, because refund data is not available at the day-two reading age. At P0 all commercial figures are gross, and a piece with high gross value and a high eventual refund rate will be overstated until refund metrics arrive.

### Content metrics
- First-seconds completion is the share of viewers still watching at three, five, and ten seconds, and it reads directly on whether the opening holds attention.
- Average watch time is how long viewers watch on average.
- The completion rate is the share of viewers who watch the piece through to the end.
- The engagement rate is saves, shares, and comments divided by views.

### Audience metrics
- The audience profile is the gender split of viewers, and the buyer profile is the gender split of purchasers.
- Purchase propensity is buyer share divided by audience share for a given segment, where a group buying above its share of the audience signals where the piece converts best. Age and region follow at P1 using the same method.
- Segment ARPU is the revenue attributed to a segment divided by that segment's viewers, computed for gender at P0.
- Where a piece has fewer than fifty orders, the buyer profile is unstable, so all audience metrics on that piece are marked low confidence.

Every metric is read on one platform against that creator's own comparable history. Whether a metric reads high, within, or low is determined by the spread of that creator's own history, and no absolute industry standard is applied, because applying one would reintroduce the false pain the product exists to remove.

## 6. Attribution

Attribution runs in three steps, each corresponding to a functional module. The rule set is fixed, meaning the stages are fixed, the factors under each stage are fixed, and the evidence that raises each factor is fixed, while only the values vary. A fixed rule set is what makes the system measurable, because every conclusion traces to a rule, every rule accumulates a hit rate against the validation result, and rules that do not hold can be retired.

### Step one, Funnel Analysis locates the stage
- Each stage conversion rate is compared against the creator's baseline for that stage, and the stage carrying the largest negative deviation is selected.
- Where two adjacent stages deviate within five percentage points of each other, the earlier stage is selected, because an upstream problem propagates downstream and explaining the downstream stage first would misattribute it.
- Where every stage reads within normal range, the largest positive deviation is reported instead, using the same structure.

### Step two, History Analysis measures the deviation
The metrics belonging to the selected stage are compared against the creator's own baseline. A metric reads below normal when it falls below the 25th percentile, within normal between the 25th and 75th, and above normal above the 75th.

### Step three, Recommendation names the factor
The selected stage maps to a fixed set of factors, and each factor is raised only when its evidence reads below normal.

- Rule R1 applies at the view stage on the content side, raising that the opening did not hold viewers when first-three-second completion reads below normal.
- Rule R2 applies at the view stage on the content side, raising that the piece lost viewers through the middle when completion rate reads below normal while first-three-second completion reads normal.
- Rule R3 applies at the store visit stage on the content side, raising that attention was held but not converted into intent when store visit rate reads below normal while retention and completion both read normal.
- Rule R4 applies at the click stage on the commercial side, raising that the product page or its pricing did not convert when click rate reads below normal while store visit rate reads normal.
- Rule R5 applies at the order stage on the commercial side, raising that the offer did not convert the viewers who reached it when GMV per click reads below normal.
- Rule R6 applies at the order stage on the content side, raising that the piece did not carry enough reason to buy when order conversion reads below normal while click rate and GMV per click both read normal.
- Rule R7 applies at the audience stage on the content side, raising that the piece reached the wrong audience when ARPU reads below normal while order conversion reads normal.

Impressions are excluded from attribution, because impression volume is driven by follower count, paid promotion, and platform distribution, none of which the piece controls and none of which the product can separate. The figure is displayed, but no conclusion is drawn from it.

### Content side and commercial side
The split governs what the user does next. The content side, comprising rules R1, R2, R3, R6, and R7, concerns the piece itself, and these are the creator's to fix. The commercial side, comprising rules R4 and R5, concerns the offer behind the piece, and these may mean the campaign was not worth taking, because no amount of content work would have changed the result.

### How the diagnosis judges itself
The point of a fixed rule set is that the system can measure whether its own conclusions hold, rather than only producing them.

- Every conclusion records the rule that produced it, so a diagnosis is never free text but one of the seven rules firing, tagged with its identifier.
- Every rule is checked against the next piece. When the user applies a step and publishes again, the validation module reads whether the stage that rule flagged actually improved, and that outcome is attributed back to the rule.
- Each rule accumulates a hit rate. A rule that flags a stage which improves after the user acts is confirmed, while a rule whose flagged stage does not improve is producing a plausible story rather than a real signal.
- Rules that fall below a hit-rate threshold are revised or retired, so the framework improves with use rather than staying fixed.
- The verdict is only valid when the user applied the step, because a stage that improves without the corresponding step being applied cannot be credited to the advice. This is why the checked-off steps are the data source, not an optional interaction.

### Output requirements
Every conclusion states the factor, the evidence metric with its value and the baseline value it is compared against, and the confidence label. A conclusion that omits its supporting values is not shown. For a creator's first piece on a platform no comparison is available, so metrics are shown without deviation and no factor is raised, and comparison begins from the second piece.

### Rules governing conclusions
- The system names at most two factors per stage, ranked by how far the evidence sits below the 25th percentile.
- Every factor cites its evidence, and a factor without supporting evidence is not shown.
- Where a stage is selected but no factor's evidence reads below normal, the system states that the stage is below baseline and that no measured signal accounts for it, rather than naming a factor to fill the gap.
- No conclusion asserts causation, and no conclusion attributes an outcome to a single factor.
- Every conclusion carries a confidence label, and where the baseline is thin the limitation is stated in the conclusion itself.

## 7. Functional Modules

Each module states its input, its rules, its output, and its edge cases, and a module is not deliverable until all four are satisfied. The modules marked P0 are required for the MVP.

### M1, Platform selection, P0
- The input is the user's selection of one or more platforms from a fixed list.
- The rules are that each selected platform holds a separate baseline, that selection is changeable at any time, and that deselecting a platform hides its content without deleting it.
- The output is the active platform set, which drives every downstream module.
- The edge cases are that selecting no platform blocks entry with a prompt to select one, and that a platform with no content shows an empty state rather than an error.

### M2, Content entry, P0
- The input is the set of fields defined in the data model, covering identifying, funnel, content, commercial, and audience fields, entered manually at P0.
- The rules are that content format and boost status are required while all other fields are optional, and that a missing optional field disables only the rules depending on it rather than blocking the piece.
- The output is a stored piece, available for review and eligible for future baselines.
- The edge cases are that the system rejects any entry where a downstream stage exceeds an upstream stage, and that a piece entered before its reading age is stored but marked incomplete and excluded from baselines until complete.

### M3, Content library, P0
- The input is all stored pieces for the active platform.
- The rules are that pieces are organized as category, then product, then content, and that category organizes the library without selecting the baseline.
- The output is the hierarchical content set, showing each piece's order conversion rate and its deviation.
- The edge case is that a piece whose category is unset is filed under uncategorized and remains fully analyzable.

### M4, Content browsing, P0
- The input is a view choice of calendar or list, together with a month, day, and year selection in calendar view or a date range in list view.
- The rules are that the calendar places each piece on its publication date at month or day granularity, that the list groups pieces by category and supports date-range filtering, and that selecting a piece in either view loads its review.
- The output in calendar view is pieces placed on their publication date, each carrying the product, the campaign, the publish time, and a color showing its order-conversion reading against baseline. The output in day view is the selected day's piece together with its action list. The output in list view is the grouped, filterable set.
- The edge cases are that a day holding more than one piece stacks them, that a range holding no pieces shows an empty state, and that a piece still inside its reading window appears with an in-progress marker and is not diagnosed.

### M5, Baseline engine, P0
- The input is the target piece and all stored pieces for the same creator and platform.
- The rules are those defined in the Benchmarking section, covering comparability, boost separation, the six-month window, and the format coefficient for the two format-sensitive rules.
- The output is the comparable set, its size, and the 25th, 50th, and 75th percentile for every metric.
- The edge cases are that fewer than eight comparable pieces produces a low-confidence baseline, that fewer than two produces no baseline and a review of raw figures without diagnosis, and that a creator whose content is heavily one format carries a visibly thin baseline in the other format.

### M6, Diagnosis, P0
- The input is the deviation profile across stages and the fixed rule set.
- The rules are that the stage with the largest negative deviation is selected, that its mapped rules are evaluated and those below threshold are raised and ranked, and that at most two factors are returned split into content side and commercial side.
- The output is the weak stage, the ranked factors with their evidence values, one direction for the next piece, and the confidence label with any active limitation.
- The rules further require that diagnosis renders first in the review, above every chart, as the largest zone on the screen.
- The edge cases are that where no baseline exists the diagnosis states how many more pieces are needed, and that where every stage reads normal the largest positive deviation is reported instead.

### M7, Commercial analysis, P0
- The input is gross merchandise value, orders, views, clicks, unit price, and discount, together with the baseline.
- The rules are that all rate metrics are compared against the baseline while absolute values are displayed without comparison, and that all figures are gross at P0.
- The output is ARPU, GMV per click, average order value, and unit price, each rate carrying its deviation.
- The edge case is that refund-based metrics and net values are deferred to P1.

### M8, Audience analysis, P0
- The input is the viewer gender split, the buyer gender split, views, and gross merchandise value.
- The rules are that purchase propensity is buyer share divided by audience share, and that segment analysis covers gender at P0.
- The output is purchase propensity and segment ARPU per gender, each with its reading.
- The edge cases are that fewer than fifty orders marks all audience metrics on the piece low confidence, and that a missing buyer split disables this module for the piece without affecting others.

### M9, Post-publish validation, P0
- The input is the flagged stages from a prior review, the steps the user checked off on that prior piece, and the next piece in the same context once entered.
- The rules are that the system reads the next piece against the steps the user checked off on the previous piece, so that improvement can be attributed to advice the user actually applied. A stage that improved without the corresponding step being applied is not evidence that the advice was correct.
- The output is the relative change in each flagged stage between the two pieces, together with a verdict on whether the applied advice helped, which feeds the rule's hit rate.
- The edge cases are that a validation lapses and is marked unresolved if no next piece arrives within sixty days, and that a step the user did not apply produces no verdict and stays on the list.

### P1 and P2 modules
The P1 modules follow the MVP: automated data ingestion, sequenced first because manual entry is the largest constraint on adoption; Content and Product Analysis, meaning analysis grouped across a product's pieces and across a category's pieces; age and region added to audience analysis; refund and net-value metrics; product review monitoring; and comment sentiment analysis. The P2 modules are top content analysis, posting time recommendation, trend detection within a category, and a weekly report.

## 8. Dashboard Specification

The product is two pages. The calendar page browses published pieces, and the detail page reviews one piece. Every zone below states what it takes in and what it puts out.

### Calendar page
- **View and date selector.** Input is a view choice of month or day and a month, day, and year from dropdowns, where the day dropdown appears only in day view. Output is the set of pieces scoped to the chosen month or day.
- **Month grid.** Input is the pieces published in the selected month, each with its product, campaign, publish time, and order-conversion reading. Output is each piece placed on its publication date, carrying product, campaign, and publish time, with a left border colored green, red, or grey by its order-conversion reading against baseline. Selecting a piece opens its detail page.
- **Day view.** Input is the selected day's piece and its diagnosis. Output is the piece's summary and its action list, where each recommended step carries a checkbox the user ticks as they apply it. This action list is identical to the one on the detail page.

### Detail page
The detail page is ordered so that the answer comes first and the evidence follows.

- **Header.** Input is the piece's identifying fields and confidence label. Output is the piece name, platform, format, publish time, data-recording time, boost status, the time window the figures cover, and the confidence label.
- **Diagnosis.** Input is the output of the diagnosis module. Output is the weak stage as the largest element on the page, the content-side and commercial-side factors each citing their evidence value against baseline, and the one direction for the next piece. It renders first, above every chart.
- **Action list.** Input is the recommended steps from the diagnosis. Output is each step as a checkbox the user ticks as they apply it, since what is checked here is read by the validation zone on the following piece.
- **Conversion funnel.** Input is the piece's funnel counts and the baseline rates. Output is each stage from impression through to order, showing the absolute count for reference, a one-line definition of the stage, and the rate with its reading against baseline. Absolute counts are marked as shown rather than compared, and impressions are marked as boosted where applicable.
- **Stage deviation chart.** Input is each stage's deviation from baseline. Output is a diverging bar chart centered on the baseline, where the largest negative bar is the diagnosed stage.
- **Commercial panel.** Input is the piece's commercial rates and the baseline, plus the viewer and buyer profiles. Output is ARPU, GMV per click, average order value, and unit price each with its reading, gross GMV and orders marked as shown, and the viewer-versus-buyer comparison with purchase propensity expressed in words.
- **Engagement panel.** Input is the piece's interaction metrics and the baseline. Output is each metric with its raw value and a colored deviation-from-baseline figure, so that metrics in different units read on one common scale.
- **Opening retention.** Input is first-seconds completion for the piece and for the baseline. Output is a line chart of the piece against the baseline curve, with the gap at three seconds marked.
- **Post-publish validation.** Input is the flagged stages from the previous piece, the steps the user checked off there, and this piece. Output is the change in each flagged stage between the two pieces, and a verdict on whether the steps the user applied helped.

### Color system
Color carries one meaning throughout. Blue marks the piece under review, grey the baseline, green a reading above normal, red below normal, and neutral grey within normal. Low-confidence readings are labeled in text, not color. No metric is colored green or red unless it has been compared against a baseline.

## 9. Constraints and Limitations

These constraints appear in the product wherever they affect a reading, not only in this section.

- A boosted piece receives impressions its content did not earn, so impression readings on boosted pieces are excluded from comparison and no conclusion about reach is offered.
- The product cannot run experiments, so no conclusion can isolate a single factor, which is why attribution names candidates rather than causes.
- The product sees only what the platform shows the creator, so it does not see the platform's own attribution and cannot verify the platform's counting method.
- At the day-two reading age, gross merchandise value and order counts are incomplete and refunds have not settled, so all commercial figures at P0 are gross, and a piece with high gross value and a high eventual refund rate will be overstated until refund metrics arrive at P1.
- Where a baseline holds fewer than eight comparable pieces, the reading is indicative only and is labeled as such.
- Crossed segment data is not available to creators, because it sits in advertising-side tools that require an advertiser account and a segment defined before the campaign runs, so audience analysis is limited to single dimensions.
- Multiple pieces for one product may share attribution, because the platform generally credits the last piece clicked, so conversion readings can be distorted where a creator runs several pieces for the same product in a short window.
- At P0 all data is entered by the user, which limits both volume and accuracy, and automated ingestion at P1 is the main path to relieving this.

## 10. MVP Success Criteria

The hypothesis under test is that creators will act on a diagnosis of which stage underperformed, and will adjust the next piece accordingly. Everything else the product does exists to serve this, because if creators read the diagnosis and do not act on it, the product is an analytics dashboard, and the market already has those.

The test runs for eight weeks, which covers roughly eight to twelve pieces per creator, and it recruits twenty creators who already run campaigns and have published at least eight pieces in the last six months, because a creator without a baseline cannot experience the product's core output.

The test passes if all three of the following hold.
- The recommendation adoption rate is above forty percent, meaning that of the diagnoses delivered, at least forty percent are followed on the next piece as confirmed through the action list.
- The month-two retention is above sixty percent, meaning that of creators who complete at least one validation loop, more than sixty percent continue into the second month.
- The first-entry completion is above fifty percent, meaning that more than half of new users complete a full first data entry, because below this the cost of manual entry prevents the product from reaching anyone.

The test fails if any one of the following holds.
- The adoption rate is below twenty percent, meaning creators read the diagnosis and do not act.
- The first-entry completion is below fifty percent, meaning the cost of entry exceeds the value of the output, which moves automated ingestion ahead of everything else.
- The rule hit rate is below fifty percent across the rule set, meaning fewer than half of applied recommendations show improvement in the flagged stage, so the rule set needs rebuilding.

If adoption lands between twenty and forty percent, the result is inconclusive, and the response is to examine the hit rate for each rule, retire the rules that fail, and rerun, because every conclusion records its rule identifier and the failing rules can be isolated.

## 11. Data Model

The product holds four entities, and this section defines what each holds, which fields are required, and how they relate, without specifying storage.

The entities relate as follows. A creator has many pieces of content across one or more platforms. A product has many pieces of content and belongs to one category. A piece of content belongs to one creator, one product, and one platform. A baseline is derived rather than entered, and it is the distribution of a creator's content on one platform. A review is one diagnosis of one piece of content, produced against the baseline current at the time.

### Content
Content is the central entity, with one record per published piece.
- The identifying fields are required: the platform, the product, the publication date and time, the content format, and the boost status. A piece cannot be saved without them.
- The funnel fields record the count at each stage: impressions, views, store visits, clicks, and orders.
- The content fields record first-seconds completion, average watch time, completion rate, and engagement.
- The commercial fields record gross merchandise value, unit price, and discount.
- The audience fields record the viewer gender split and the buyer gender split.
- The derived fields are computed rather than entered: the stage conversion rates, ARPU, GMV per click, average order value, and purchase propensity.
- The metadata records the reading age and the entry status.

The funnel, content, commercial, and audience fields are individually optional, and a missing field disables only the rules that depend on it, while only the identifying fields are mandatory.

### Product
Product holds one record per product a creator has run a campaign for, recording its name, category, rating, and review count. The rating and review count are stored as snapshots at the time of the content's entry rather than updated in place, because they describe the product's standing when the audience saw the piece.

### Baseline
Baseline is derived and held per creator and per platform, recording the set of comparable pieces, the 25th, 50th, and 75th percentile for each metric, and the sample size that sets the confidence label. It is recomputed whenever a piece is added, edited, or reaches complete status.

### Review
Review holds one record per diagnosis, recording the piece reviewed, the stage identified as weak, the rules that fired by identifier, the confidence label, the recommendation issued, the steps the user checked off, and the validation outcome on the following piece. The rule identifiers together with the checked steps and the validation outcome are what make the rule set measurable.

## 12. Platform Metrics

The content metrics describe the user's content. The metrics below describe whether the platform is working, organized into four layers so the relationship stays clear: inputs drive outputs, outputs move toward the north star, and guardrails limit what the platform may do in pursuing it.

### North star
The north star is the number of users who act on a recommendation and complete a validation on the following piece. It can only rise when a user finds a conclusion credible enough to act on, produces the next piece accordingly, and returns to see whether the flagged stage improved.

### Core output metrics
- The recommendation adoption rate is the share of recommendations a user acts on in the following piece.
- The weekly review retention is the share of users who return to review at least one new piece in a given week.
- The validation completion rate is the share of applied recommendations that receive a post-publish comparison.

### Key input metrics
- Platform selection completion is the share of new users who select at least one platform.
- First data entry completion is the share of new users who enter a complete first piece, expected to be the largest drop-off point.
- First report generation is the share of new users who reach a completed diagnosis.
- Categories reaching sufficient sample size is the number of contexts in which a user has enough history for a reliable baseline.
- Expanded evidence rate is the share of conclusions for which a user opens the supporting evidence.

### Guardrail metrics
- The share of conclusions delivered at high confidence must not be inflated on thin samples.
- The rate at which conclusions are overturned by the following piece must stay visible even when adoption looks healthy.
- The share of low-sample readings labeled as indicative enforces that the platform helps users avoid mistakes rather than promise a repeatable hit.

## 13. Walkthrough

A snack campaign was published on July 1 and its data was recorded on July 3. The user opens the calendar, finds the piece on its publish date, and opens its review.

The diagnosis loads first. It reports that the order stage carries the largest negative deviation, and it names two factors. On the content side, first-three-second completion reads below normal, so the opening may not have held the viewers who would otherwise have converted. On the commercial side, GMV per click reads below normal, so the viewers who reached the product page were worth less than they usually are, which points at the offer rather than the content. The confidence label reads medium, based on nine comparable pieces. Because the piece was boosted, impressions are set aside and not judged.

The action list repeats the steps as checkboxes: rework the opening, bring the product mention forward, skew the format toward the audience that buys, and weigh whether the product is worth taking again at this price. The evidence below confirms the reading, with the stage deviation chart showing order and ARPU below the line while earlier stages sit within normal, and the retention curve showing this piece falling away faster than the baseline.

When the next snack piece is entered, the system reads it against the steps the user checked off on this one. First-three-second completion rose from 58 percent to 71 percent and order conversion rose from 8.0 percent to 11.5 percent, and because the user had checked off reworking the opening, that recommendation is recorded as helpful and weighted more heavily going forward.
