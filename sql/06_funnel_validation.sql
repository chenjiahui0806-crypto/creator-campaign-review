-- Data validation (Skill 1's job): before a piece is allowed into analysis,
-- check funnel monotonicity, reading age, and whether enough fields are
-- present to be usable. This is the code-side half of Skill 1 — the rule
-- boundaries are dead checks; only the judgment of what to do with a
-- borderline result belongs to the Skill itself (skill-framework.md,
-- Skill 1 Limitation: "只判断数据可否使用，是否查看由用户决定").

WITH target AS (
  SELECT * FROM content WHERE content_id = :target_content_id
),
checks AS (
  SELECT
    content_id,

    -- funnel monotonicity: same audience narrows at each stage, so a
    -- downstream count above its upstream count is a logical impossibility,
    -- not just an outlier
    (store_visits IS NOT NULL AND impressions IS NOT NULL AND store_visits > impressions)
      OR (clicks IS NOT NULL AND store_visits IS NOT NULL AND clicks > store_visits)
      OR (orders IS NOT NULL AND clicks IS NOT NULL AND orders > clicks)
      AS funnel_inverted,

    -- reading age: retention/completion finalize within 24h, conversion
    -- rates stabilize enough to read around day two (PRD section 2)
    EXTRACT(DAY FROM now() - published_at) AS reading_age_days,

    -- required identifying fields present (should always be true if the
    -- row exists, since these are NOT NULL in the schema, but re-checked
    -- here in case this runs against a staging/import table before insert)
    (platform IS NOT NULL AND product_id IS NOT NULL AND published_at IS NOT NULL
     AND content_format IS NOT NULL AND boost_status IS NOT NULL) AS identifying_complete,

    -- enough optional fields present to be worth analyzing at all
    (impressions IS NOT NULL AND views IS NOT NULL AND store_visits IS NOT NULL
     AND clicks IS NOT NULL AND orders IS NOT NULL) AS funnel_complete

  FROM target
)
SELECT
  content_id,
  CASE
    WHEN funnel_inverted THEN 'data_error'
    WHEN NOT identifying_complete THEN 'data_error'
    WHEN reading_age_days < 2 THEN 'incomplete'   -- too fresh, rates haven't stabilized
    WHEN NOT funnel_complete THEN 'incomplete'
    ELSE 'usable'
  END AS validation_verdict,
  funnel_inverted,
  reading_age_days,
  identifying_complete,
  funnel_complete
FROM checks;
