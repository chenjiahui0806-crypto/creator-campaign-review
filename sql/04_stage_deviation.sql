-- Stage deviation: reads the target piece's rate metrics against its own
-- baseline and labels each as below / within / above (PRD section 6, step
-- two: "below normal when it falls below the 25th percentile, within
-- normal between the 25th and 75th, and above normal above the 75th").
--
-- Impressions, views, gmv, and order counts are deliberately excluded —
-- they're absolute values that scale with reach and follower growth, not
-- with the piece itself, so the PRD (section 3, "Absolute values are not
-- compared") keeps them out of every deviation read.

WITH target AS (
  SELECT
    content_id, creator_id, platform, boost_status,
    store_visits::NUMERIC / NULLIF(impressions, 0)   AS store_visit_rate,
    clicks::NUMERIC       / NULLIF(store_visits, 0)  AS click_rate,
    orders::NUMERIC        / NULLIF(store_visits, 0)  AS order_conversion_rate,
    completion_3s,
    completion_rate,
    gmv / NULLIF(views, 0)   AS arpu,
    gmv / NULLIF(clicks, 0)  AS gmv_per_click
  FROM content
  WHERE content_id = :target_content_id
),
metrics AS (
  SELECT 'store_visit_rate' AS metric_name, store_visit_rate AS value FROM target
  UNION ALL SELECT 'click_rate', click_rate FROM target
  UNION ALL SELECT 'order_conversion_rate', order_conversion_rate FROM target
  UNION ALL SELECT 'completion_3s', completion_3s FROM target
  UNION ALL SELECT 'completion_rate', completion_rate FROM target
  UNION ALL SELECT 'arpu', arpu FROM target
  UNION ALL SELECT 'gmv_per_click', gmv_per_click FROM target
)
SELECT
  m.metric_name,
  m.value,
  b.p25, b.p50, b.p75, b.sample_size,
  CASE
    WHEN m.value IS NULL OR b.p25 IS NULL THEN NULL         -- missing field or no baseline yet
    WHEN m.value < b.p25 THEN 'below'
    WHEN m.value > b.p75 THEN 'above'
    ELSE 'within'
  END AS reading,
  -- normalized gap below p25, used by 05_rule_evaluation.sql to pick the
  -- single weakest stage when more than one reads below normal
  CASE
    WHEN m.value IS NULL OR b.p25 IS NULL OR m.value >= b.p25 THEN 0
    ELSE (b.p25 - m.value) / NULLIF(b.p75 - b.p25, 0)
  END AS below_p25_gap
FROM metrics m
JOIN target t ON true
JOIN baseline b
  ON b.creator_id   = t.creator_id
 AND b.platform     = t.platform
 AND b.boost_status = t.boost_status
 AND b.metric_name  = m.metric_name;
