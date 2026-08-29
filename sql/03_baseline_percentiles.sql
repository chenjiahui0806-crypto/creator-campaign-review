-- Baseline engine: p25/p50/p75 per metric across the comparable set.
-- Matches PRD section 3 (the baseline is a distribution, not an average)
-- and skill-framework.md's upstream engine step 3 ("对可比集每个指标重算
-- p25/p50/p75，覆盖写入 Baseline").
--
-- Run this whenever a piece is added, edited, or reaches complete status
-- (per the Baseline entity's "触发更新" rule). Derived rate metrics
-- (store_visit_rate, click_rate, order_conversion_rate, arpu, gmv_per_click,
-- aov) are computed inline here rather than stored on content, matching
-- "派生字段：不存储，查询时现算" in the data model.

WITH comparable AS (
  SELECT *
  FROM content
  WHERE creator_id   = :creator_id
    AND platform     = :platform
    AND boost_status = :boost_status
    AND published_at >= now() - INTERVAL '6 months'
    AND entry_status  = 'complete'
),
derived AS (
  SELECT
    content_id,
    store_visits::NUMERIC / NULLIF(impressions, 0)  AS store_visit_rate,
    clicks::NUMERIC       / NULLIF(store_visits, 0) AS click_rate,
    orders::NUMERIC        / NULLIF(store_visits, 0) AS order_conversion_rate,
    completion_3s,
    completion_rate,
    avg_watch_time,
    gmv / NULLIF(views, 0)   AS arpu,
    gmv / NULLIF(clicks, 0)  AS gmv_per_click,
    gmv / NULLIF(orders, 0)  AS aov
  FROM comparable
),
-- unpivot into (metric_name, value) pairs so one percentile_cont pass covers
-- every metric instead of writing nine near-identical SELECTs
unpivoted AS (
  SELECT 'store_visit_rate' AS metric_name, store_visit_rate AS value FROM derived
  UNION ALL SELECT 'click_rate', click_rate FROM derived
  UNION ALL SELECT 'order_conversion_rate', order_conversion_rate FROM derived
  UNION ALL SELECT 'completion_3s', completion_3s FROM derived
  UNION ALL SELECT 'completion_rate', completion_rate FROM derived
  UNION ALL SELECT 'avg_watch_time', avg_watch_time FROM derived
  UNION ALL SELECT 'arpu', arpu FROM derived
  UNION ALL SELECT 'gmv_per_click', gmv_per_click FROM derived
  UNION ALL SELECT 'aov', aov FROM derived
),
computed AS (
  SELECT
    metric_name,
    percentile_cont(0.25) WITHIN GROUP (ORDER BY value) AS p25,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY value) AS p50,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75,
    COUNT(value) AS sample_size
  FROM unpivoted
  WHERE value IS NOT NULL
  GROUP BY metric_name
)
INSERT INTO baseline (creator_id, platform, boost_status, metric_name, p25, p50, p75, sample_size, computed_at)
SELECT :creator_id, :platform, :boost_status, metric_name, p25, p50, p75, sample_size, now()
FROM computed
ON CONFLICT (creator_id, platform, boost_status, metric_name)
DO UPDATE SET
  p25 = EXCLUDED.p25,
  p50 = EXCLUDED.p50,
  p75 = EXCLUDED.p75,
  sample_size = EXCLUDED.sample_size,
  computed_at = EXCLUDED.computed_at;
