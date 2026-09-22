/* Creator Campaign Review — analysis engine
 *
 * Pure, deterministic computation. Given the same data it always returns the
 * same diagnosis. The engine does the math; it does not do judgment. It:
 *   1. builds a personalized baseline (percentiles) from comparable history,
 *   2. reads each metric on the target piece as below / within / above normal,
 *   3. locates the largest negative deviation stage,
 *   4. fires the fixed rules R1-R7 whose conditions hold,
 *   5. returns a structured diagnosis with evidence values and confidence.
 *
 * No industry averages are used. A piece is judged only against the creator's
 * own comparable history.
 */

const Engine = (function () {

  // ---- percentile helpers -------------------------------------------------
  function percentile(sortedVals, p) {
    if (sortedVals.length === 0) return null;
    const k = (sortedVals.length - 1) * p;
    const f = Math.floor(k), c = Math.ceil(k);
    if (f === c) return sortedVals[f];
    return sortedVals[f] + (sortedVals[c] - sortedVals[f]) * (k - f);
  }
  function dist(vals) {
    const s = vals.slice().sort((a, b) => a - b);
    return { p25: percentile(s, 0.25), p50: percentile(s, 0.5), p75: percentile(s, 0.75), n: s.length };
  }

  // ---- derived metrics for one piece -------------------------------------
  function derive(r) {
    return {
      store_visit_rate: r.store_visits / r.impressions,
      click_rate:       r.clicks / r.store_visits,
      order_rate:       r.orders / r.store_visits,   // orders / store_visits
      arpu:             r.gmv / r.views,
      gmv_per_click:    r.gmv / r.clicks,
      aov:             r.orders ? r.gmv / r.orders : 0,
      completion_3s:    r.completion_3s,
      completion_rate:  r.completion_rate,
      avg_watch_time:   r.avg_watch_time,
      unit_price:       r.unit_price,
      viewer_female_pct: r.viewer_female_pct,
      buyer_female_pct:  r.buyer_female_pct,
    };
  }

  // ---- baseline from comparable history ----------------------------------
  // Comparable = same boost status as target (and, in a real build, same
  // platform and last 6 months). Here history is already scoped to one creator.
  function buildBaseline(history, target) {
    const comparable = history.filter(h => h.boost_status === target.boost_status);
    const d = comparable.map(derive);
    const metrics = ['store_visit_rate','click_rate','order_rate','arpu','gmv_per_click',
                     'completion_3s','completion_rate','unit_price'];
    const baseline = { n: comparable.length };
    metrics.forEach(m => { baseline[m] = dist(d.map(x => x[m])); });
    return baseline;
  }

  // ---- reading: below / within / above -----------------------------------
  function read(value, band) {
    if (!band || band.p25 == null) return 'none';
    if (value < band.p25) return 'below';
    if (value > band.p75) return 'above';
    return 'within';
  }

  // ---- confidence from sample size ---------------------------------------
  function confidence(n, activeLimitation) {
    let label;
    if (n >= 12) label = 'high';
    else if (n >= 8) label = 'medium';
    else if (n >= 2) label = 'low';
    else label = 'none';
    if (activeLimitation && (label === 'high')) label = 'medium'; // cap
    return label;
  }

  // ---- the fixed rule set R1-R7 ------------------------------------------
  // Each rule: stage, side, human factor, and the condition on readings.
  function fireRules(t, rd) {
    // rd = readings object: rd.metric -> 'below'|'within'|'above'
    const fired = [];
    const add = (id, stage, side, factor, evidence) =>
      fired.push({ id, stage, side, factor, evidence });

    if (rd.completion_3s === 'below')
      add('R1','view','content','The opening did not hold viewers',
          `first 3s completion ${t.completion_3s} vs baseline`);

    if (rd.completion_rate === 'below' && rd.completion_3s === 'within')
      add('R2','view','content','Viewers were lost through the middle',
          `completion rate ${t.completion_rate}% vs baseline`);

    if (rd.store_visit_rate === 'below' && rd.completion_3s === 'within' && rd.completion_rate === 'within')
      add('R3','store_visit','content','Attention was held but not turned into intent',
          `store visit rate ${(t.store_visit_rate*100).toFixed(1)}% vs baseline`);

    if (rd.click_rate === 'below' && rd.store_visit_rate === 'within')
      add('R4','click','commercial','The product page or price did not convert',
          `click rate ${(t.click_rate*100).toFixed(1)}% vs baseline`);

    if (rd.gmv_per_click === 'below')
      add('R5','order','commercial','The offer did not convert the viewers who reached it',
          `GMV per click ${t.gmv_per_click.toFixed(1)} vs baseline` +
          (rd.unit_price === 'above' ? `, unit price ${t.unit_price} above your usual` : ''));

    if (rd.order_rate === 'below' && rd.click_rate === 'within' && rd.gmv_per_click === 'within')
      add('R6','order','content','The piece did not carry enough reason to buy',
          `order conversion ${(t.order_rate*100).toFixed(1)}% vs baseline`);

    if (rd.arpu === 'below' && rd.order_rate === 'within')
      add('R7','audience','content','The piece reached the wrong audience',
          `ARPU below baseline while order conversion normal`);

    return fired;
  }

  // ---- locate the weak stage (largest negative deviation) ----------------
  function locateWeakStage(t, b) {
    // deviation as fraction below p50, only for stages that read below p25
    const stages = [
      { stage:'store_visit', val:t.store_visit_rate, band:b.store_visit_rate },
      { stage:'click',       val:t.click_rate,       band:b.click_rate },
      { stage:'order',       val:t.order_rate,       band:b.order_rate },
    ];
    let worst = null;
    stages.forEach(s => {
      if (!s.band || s.band.p50 == null) return;
      const dev = (s.val - s.band.p50) / s.band.p50; // negative = below median
      if (dev < 0 && (worst === null || dev < worst.dev)) worst = { ...s, dev };
    });
    return worst;
  }

  // ---- main entry ---------------------------------------------------------
  function analyze(history, target) {
    const baseline = buildBaseline(history, target);
    const t = derive(target);

    const readings = {
      store_visit_rate: read(t.store_visit_rate, baseline.store_visit_rate),
      click_rate:       read(t.click_rate,       baseline.click_rate),
      order_rate:       read(t.order_rate,        baseline.order_rate),
      arpu:             read(t.arpu,              baseline.arpu),
      gmv_per_click:    read(t.gmv_per_click,     baseline.gmv_per_click),
      completion_3s:    read(t.completion_3s,     baseline.completion_3s),
      completion_rate:  read(t.completion_rate,   baseline.completion_rate),
      unit_price:       read(t.unit_price,        baseline.unit_price),
    };

    const weak = locateWeakStage(t, baseline);
    const fired = fireRules(t, readings);
    const activeLimitation = (target.boost_status === 'boosted');
    const conf = confidence(baseline.n, activeLimitation);

    // deviation of the order stage vs baseline p50, for the headline badge
    const orderDev = baseline.order_rate && baseline.order_rate.p50
      ? Math.round((t.order_rate - baseline.order_rate.p50) / baseline.order_rate.p50 * 100)
      : null;

    return {
      baseline, target: t, readings, weak,
      rules: fired,
      contentSide: fired.filter(f => f.side === 'content'),
      commercialSide: fired.filter(f => f.side === 'commercial'),
      confidence: conf,
      sampleSize: baseline.n,
      boosted: target.boost_status === 'boosted',
      orderDeviationPct: orderDev,
    };
  }

  return { analyze, buildBaseline, derive, dist, percentile };
})();

if (typeof module !== 'undefined') module.exports = Engine;
