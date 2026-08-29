-- Creator Campaign Review — schema
-- Matches PRD section 11 (Data Model) and skill-framework.md Part 3.
-- Written for PostgreSQL (percentile_cont, used in 03_baseline_percentiles.sql,
-- is a Postgres/standard-SQL window function; adjust for other engines).

CREATE TABLE product (
  product_id            TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  category              TEXT,
  current_price         NUMERIC(10,2),
  current_rating        NUMERIC(3,2),
  current_review_count  INTEGER
);

CREATE TABLE content (
  content_id            TEXT PRIMARY KEY,
  creator_id            TEXT NOT NULL,

  -- identifying fields: required, a piece cannot be saved without these five
  platform              TEXT NOT NULL CHECK (platform IN ('TikTok', 'RedNote', 'Other')),
  product_id            TEXT NOT NULL REFERENCES product(product_id),
  published_at          TIMESTAMPTZ NOT NULL,
  content_format        TEXT NOT NULL CHECK (content_format IN ('unboxing', 'daily_share')),
  boost_status          TEXT NOT NULL CHECK (boost_status IN ('organic', 'boosted')),

  -- funnel fields: optional, missing a field disables only the rules that depend on it
  impressions           INTEGER,
  views                 INTEGER,
  store_visits          INTEGER,
  clicks                INTEGER,
  orders                INTEGER,

  -- content fields: optional
  completion_3s         NUMERIC(5,4),
  completion_5s         NUMERIC(5,4),
  completion_10s        NUMERIC(5,4),
  avg_watch_time        NUMERIC(6,2),
  completion_rate       NUMERIC(5,4),
  saves                 INTEGER,
  shares                INTEGER,
  comments               INTEGER,

  -- commercial fields: optional, gross only at P0 (refund data deferred to P1)
  gmv                   NUMERIC(12,2),
  unit_price            NUMERIC(10,2),
  discount              NUMERIC(5,4),

  -- audience fields: optional, single dimension only (gender), P0
  viewer_female_share   NUMERIC(5,4),
  buyer_female_share    NUMERIC(5,4),

  -- snapshot: written once at entry time, never updated in place
  product_rating_snapshot NUMERIC(3,2),

  -- metadata
  reading_age_days      INTEGER GENERATED ALWAYS AS (
                           EXTRACT(DAY FROM now() - published_at)::INTEGER
                         ) STORED,
  entry_status          TEXT NOT NULL DEFAULT 'incomplete'
                           CHECK (entry_status IN ('complete', 'incomplete')),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- funnel monotonicity: same audience narrows at each stage, so a downstream
  -- count can never exceed its upstream count. Violating this is a data_error
  -- per Skill 1 (see 06_funnel_validation.sql for the full pre-save check).
  CONSTRAINT funnel_monotonic CHECK (
    (store_visits IS NULL OR impressions IS NULL OR store_visits <= impressions) AND
    (clicks IS NULL OR store_visits IS NULL OR clicks <= store_visits) AND
    (orders IS NULL OR clicks IS NULL OR orders <= clicks)
  )
);

CREATE INDEX idx_content_baseline_lookup
  ON content (creator_id, platform, boost_status, published_at);

-- Baseline is derived, not entered — recomputed whenever a piece is added,
-- edited, or reaches complete status (see 03_baseline_percentiles.sql).
CREATE TABLE baseline (
  creator_id     TEXT NOT NULL,
  platform       TEXT NOT NULL,
  boost_status   TEXT NOT NULL,
  metric_name    TEXT NOT NULL,
  p25            NUMERIC(12,4),
  p50            NUMERIC(12,4),
  p75            NUMERIC(12,4),
  sample_size    INTEGER NOT NULL,
  computed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (creator_id, platform, boost_status, metric_name)
);

-- Review is one diagnosis of one piece, produced against the baseline
-- current at the time. Rule identifiers + checked steps + validation
-- outcome are what make the rule set measurable (PRD section 6).
CREATE TABLE review (
  review_id         TEXT PRIMARY KEY,
  content_id        TEXT NOT NULL REFERENCES content(content_id),
  weak_stage        TEXT NOT NULL CHECK (weak_stage IN ('store_visit', 'click', 'order', 'audience')),
  fired_rule_ids    TEXT[] NOT NULL,        -- e.g. {'R1','R7'}
  confidence        TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low', 'none')),
  recommendations   JSONB NOT NULL,
  checked_steps     JSONB,                  -- filled in as the user ticks the action list
  validation_result JSONB,                  -- filled in once the next piece is entered
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
