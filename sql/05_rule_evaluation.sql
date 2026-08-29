-- R1-R7 attribution: locates the weakest of the three funnel stages
-- (store_visit, click, order), then fires the rules mapped to that stage.
-- R7 is additive and evaluated independently of which stage step one picks
-- (skill-framework.md, Skill 2: "下单转化正常而ARPU偏低时，追加人群分支
-- 评估人群与商品匹配度").
--
-- Rule table (skill-framework.md Part 3):
--   R1  view          content     completion_3s below
--   R2  view          content     completion_rate below AND completion_3s within
--   R3  store_visit   content     store_visit_rate below AND retention/completion both within
--   R4  click         commercial  click_rate below AND store_visit_rate within
--   R5  order         commercial  gmv_per_click below
--   R6  order          content     order_conversion below AND click_rate/gmv_per_click both within
--   R7  audience       content     arpu below AND order_conversion within/above
--
-- Assumes 04_stage_deviation.sql's output is materialized as a temp table
-- or CTE named `deviation` with columns (metric_name, value, reading,
-- below_p25_gap) for the target piece — inline below as `deviation` for
-- a single self-contained query.

WITH deviation AS (
  -- paste the query from 04_stage_deviation.sql here, or reference it as a
  -- view/materialized CTE in application code; shown inline for clarity
  SELECT * FROM stage_deviation_for(:target_content_id)  -- app-side function wrapping 04
),
readings AS (
  SELECT
    MAX(CASE WHEN metric_name = 'store_visit_rate' THEN reading END)      AS store_visit_reading,
    MAX(CASE WHEN metric_name = 'store_visit_rate' THEN below_p25_gap END) AS store_visit_gap,
    MAX(CASE WHEN metric_name = 'click_rate' THEN reading END)            AS click_reading,
    MAX(CASE WHEN metric_name = 'click_rate' THEN below_p25_gap END)      AS click_gap,
    MAX(CASE WHEN metric_name = 'order_conversion_rate' THEN reading END) AS order_reading,
    MAX(CASE WHEN metric_name = 'order_conversion_rate' THEN below_p25_gap END) AS order_gap,
    MAX(CASE WHEN metric_name = 'completion_3s' THEN reading END)         AS completion_3s_reading,
    MAX(CASE WHEN metric_name = 'completion_rate' THEN reading END)       AS completion_rate_reading,
    MAX(CASE WHEN metric_name = 'gmv_per_click' THEN reading END)         AS gmv_per_click_reading,
    MAX(CASE WHEN metric_name = 'arpu' THEN reading END)                  AS arpu_reading
  FROM deviation
),
-- Step one: locate the weakest of the three funnel stages. If two adjacent
-- stages sit within a small margin of each other, the earlier stage wins
-- (an upstream problem propagates downstream — explaining the downstream
-- stage first would misattribute it). "Adjacent" and "small margin" are
-- implemented here as a 0.15-normalized-gap tolerance; see the /verification
-- folder for the equivalent Python logic this was tested against.
weakest AS (
  SELECT
    CASE
      WHEN store_visit_gap >= GREATEST(click_gap, order_gap) THEN 'store_visit'
      WHEN click_gap >= order_gap
           AND NOT (store_visit_gap > 0 AND (click_gap - store_visit_gap) < 0.15) THEN 'click'
      WHEN order_gap > 0
           AND NOT (click_gap > 0 AND (order_gap - click_gap) < 0.15)
           AND NOT (store_visit_gap > 0 AND (order_gap - store_visit_gap) < 0.15) THEN 'order'
      WHEN store_visit_gap > 0 THEN 'store_visit'
      WHEN click_gap > 0 THEN 'click'
      WHEN order_gap > 0 THEN 'order'
      ELSE NULL
    END AS weak_stage
  FROM readings
)
SELECT rule_id, stage, side, evidence
FROM (
  -- R1
  SELECT 'R1' AS rule_id, 'view' AS stage, 'content' AS side,
         'completion_3s below baseline p25' AS evidence
  FROM readings, weakest
  WHERE weak_stage = 'store_visit' AND completion_3s_reading = 'below'

  UNION ALL
  -- R2
  SELECT 'R2', 'view', 'content', 'completion_rate below, completion_3s within'
  FROM readings, weakest
  WHERE weak_stage = 'store_visit'
    AND completion_rate_reading = 'below'
    AND completion_3s_reading = 'within'

  UNION ALL
  -- R3
  SELECT 'R3', 'store_visit', 'content', 'store_visit_rate below, retention and completion both within'
  FROM readings, weakest
  WHERE weak_stage = 'store_visit'
    AND completion_3s_reading = 'within'
    AND completion_rate_reading = 'within'

  UNION ALL
  -- R4
  SELECT 'R4', 'click', 'commercial', 'click_rate below, store_visit_rate within'
  FROM readings, weakest
  WHERE weak_stage = 'click' AND store_visit_reading = 'within'

  UNION ALL
  -- R5
  SELECT 'R5', 'order', 'commercial', 'gmv_per_click below baseline p25'
  FROM readings, weakest
  WHERE weak_stage = 'order' AND gmv_per_click_reading = 'below'

  UNION ALL
  -- R6
  SELECT 'R6', 'order', 'content', 'order_conversion below, click_rate and gmv_per_click both within'
  FROM readings, weakest
  WHERE weak_stage = 'order'
    AND click_reading = 'within'
    AND gmv_per_click_reading = 'within'

  UNION ALL
  -- R7 (additive — independent of weak_stage)
  SELECT 'R7', 'audience', 'content', 'arpu below baseline p25, order_conversion within or above'
  FROM readings
  WHERE order_reading != 'below' AND arpu_reading = 'below'
) fired
ORDER BY rule_id;
