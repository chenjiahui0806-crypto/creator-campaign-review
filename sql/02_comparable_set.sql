-- Comparable set for a target piece.
-- Matches PRD section 3 (Benchmarking): same creator, same platform, same
-- boost status, published inside the last six months. Boosted and organic
-- pieces never share a baseline — impressions on a boosted piece weren't
-- earned by the content, so mixing them would distort every rate metric.

-- :target_content_id is the piece being reviewed; its creator/platform/
-- boost_status are looked up first, then used to find its comparable set.

WITH target AS (
  SELECT creator_id, platform, boost_status
  FROM content
  WHERE content_id = :target_content_id
)
SELECT c.*
FROM content c
JOIN target t
  ON c.creator_id   = t.creator_id
 AND c.platform     = t.platform
 AND c.boost_status = t.boost_status
WHERE c.published_at >= now() - INTERVAL '6 months'
  AND c.entry_status = 'complete'
  AND c.content_id != :target_content_id
ORDER BY c.published_at DESC;
