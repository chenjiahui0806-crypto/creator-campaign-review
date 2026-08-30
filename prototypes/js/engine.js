// Creator Campaign Review — client-side engine.
// This is the browser-side port of /sql: same field definitions, same
// baseline formula, same R1-R7 rule logic (verified against /verification's
// Python model). It exists so this GitHub Pages demo can genuinely react to
// new entries — there's still no real backend, so everything here lives in
// this browser's localStorage only, not a shared database.

const CCR = (() => {
  const STORAGE_KEY = 'ccr_user_pieces_v1';
  const HIDE_SEED_KEY = 'ccr_hide_seed_v1';
  const PLATFORM_FILTER_KEY = 'ccr_platform_filter_v1';

  // ---------------------------------------------------------------------
  // Seed history: the 7 pieces already shown on the July 2026 calendar
  // grid, given full funnel numbers so they can act as real comparable
  // history. Order-conversion rates match what the calendar/day-view
  // already displays. All numbers are fabricated demo data.
  // ---------------------------------------------------------------------
  const SEED_PIECES = [
    { id: 'nut-brand-office-snack-taste-test', platform: 'TikTok', product: 'Nut Brand', campaign: 'Office Snack Taste-Test',
      publishedAt: '2026-07-01T19:30', format: 'unboxing', boost: 'organic',
      impressions: 15000, views: 9500, storeVisits: 1300, clicks: 850, orders: 104,
      completion3s: 58, completionRate: 31, avgWatchTime: 11.2,
      gmv: 7072, unitPrice: 68, discount: 0,
      viewerFemale: 68, buyerFemale: 85 },
    { id: 'drink-brand-iced-tea-morning-ritual', platform: 'TikTok', product: 'Drink Brand', campaign: 'Iced Tea Morning Ritual',
      publishedAt: '2026-07-08T08:15', format: 'daily_share', boost: 'organic',
      impressions: 15500, views: 10000, storeVisits: 1500, clicks: 870, orders: 228,
      completion3s: 70, completionRate: 33, avgWatchTime: 13.6,
      gmv: 7980, unitPrice: 35, discount: 0,
      viewerFemale: 60, buyerFemale: 63 },
    { id: 'air-fryer-brand-3min-weeknight-dinner', platform: 'TikTok', product: 'Air Fryer Brand', campaign: '3-Min Weeknight Dinner',
      publishedAt: '2026-07-14T18:45', format: 'unboxing', boost: 'organic',
      impressions: 16000, views: 10500, storeVisits: 1700, clicks: 980, orders: 466,
      completion3s: 76, completionRate: 38, avgWatchTime: 15.2,
      gmv: 83880, unitPrice: 180, discount: 0,
      viewerFemale: 55, buyerFemale: 58 },
    { id: 'nut-brand-late-night-snack-list', platform: 'TikTok', product: 'Nut Brand', campaign: 'Late-Night Snack List',
      publishedAt: '2026-07-18T21:50', format: 'daily_share', boost: 'organic',
      impressions: 15200, views: 9700, storeVisits: 1450, clicks: 880, orders: 350,
      completion3s: 74, completionRate: 36, avgWatchTime: 14.5,
      gmv: 15750, unitPrice: 45, discount: 0,
      viewerFemale: 66, buyerFemale: 80 },
    { id: 'air-fryer-brand-one-pan-breakfast', platform: 'TikTok', product: 'Air Fryer Brand', campaign: 'One-Pan Breakfast',
      publishedAt: '2026-07-22T07:20', format: 'daily_share', boost: 'organic',
      impressions: 15800, views: 10200, storeVisits: 1600, clicks: 920, orders: 365,
      completion3s: 73, completionRate: 35, avgWatchTime: 14.0,
      gmv: 63875, unitPrice: 175, discount: 0,
      viewerFemale: 57, buyerFemale: 60 },
    { id: 'drink-brand-summer-sparkling-water', platform: 'TikTok', product: 'Drink Brand', campaign: 'Summer Sparkling Water',
      publishedAt: '2026-07-26T12:30', format: 'unboxing', boost: 'organic',
      impressions: 15400, views: 9900, storeVisits: 1550, clicks: 860, orders: 226,
      completion3s: 69, completionRate: 32, avgWatchTime: 13.4,
      gmv: 8588, unitPrice: 38, discount: 0,
      viewerFemale: 61, buyerFemale: 64 },
    { id: 'sheet-mask-brand-late-night-rescue-mask', platform: 'TikTok', product: 'Sheet-Mask Brand', campaign: 'Late-Night Rescue Mask',
      publishedAt: '2026-07-29T22:10', format: 'unboxing', boost: 'organic',
      impressions: 14800, views: 9600, storeVisits: 1350, clicks: 800, orders: 126,
      completion3s: 60, completionRate: 29, avgWatchTime: 10.8,
      gmv: 6930, unitPrice: 55, discount: 0,
      viewerFemale: 72, buyerFemale: 90 },

    // ---- expanded set: covers every R1-R7 rule, a boosted piece (separate
    // baseline from organic), and a second platform (RedNote) building its
    // own baseline from scratch. See /verification for how these were tuned.
    { id: 'nut-brand-snack-box-unboxing', platform: 'TikTok', product: 'Nut Brand', campaign: 'Snack Box Unboxing',
      publishedAt: '2026-07-04T18:00', format: 'unboxing', boost: 'organic',
      impressions: 15600, views: 10100, storeVisits: 1400, clicks: 855, orders: 225,
      completion3s: 72, completionRate: 19, avgWatchTime: 9.6,
      gmv: 9900, unitPrice: 44, discount: 0,
      viewerFemale: 64, buyerFemale: 71 },
    { id: 'air-fryer-brand-flash-sale-push', platform: 'TikTok', product: 'Air Fryer Brand', campaign: 'Flash Sale Push',
      publishedAt: '2026-07-06T20:00', format: 'unboxing', boost: 'boosted',
      impressions: 42000, views: 31000, storeVisits: 5200, clicks: 3100, orders: 780,
      completion3s: 69, completionRate: 31, avgWatchTime: 13.2,
      gmv: 140400, unitPrice: 180, discount: 15,
      viewerFemale: 56, buyerFemale: 59 },
    { id: 'drink-brand-cold-brew-review', platform: 'TikTok', product: 'Drink Brand', campaign: 'Cold Brew Review',
      publishedAt: '2026-07-10T09:30', format: 'daily_share', boost: 'organic',
      impressions: 15900, views: 10300, storeVisits: 1220, clicks: 705, orders: 170,
      completion3s: 70, completionRate: 33, avgWatchTime: 13.7,
      gmv: 7480, unitPrice: 44, discount: 0,
      viewerFemale: 59, buyerFemale: 61 },
    { id: 'skincare-brand-5-step-routine', platform: 'RedNote', product: 'Skincare Brand', campaign: '5-Step Routine',
      publishedAt: '2026-07-12T21:00', format: 'unboxing', boost: 'organic',
      impressions: 12800, views: 9200, storeVisits: 1350, clicks: 790, orders: 230,
      completion3s: 78, completionRate: 41, avgWatchTime: 16.5,
      gmv: 16560, unitPrice: 72, discount: 0,
      viewerFemale: 88, buyerFemale: 91 },
    { id: 'skincare-brand-nighttime-ritual', platform: 'RedNote', product: 'Skincare Brand', campaign: 'Nighttime Ritual',
      publishedAt: '2026-07-16T22:30', format: 'daily_share', boost: 'organic',
      impressions: 13100, views: 9500, storeVisits: 1400, clicks: 818, orders: 95,
      completion3s: 80, completionRate: 43, avgWatchTime: 17.0,
      gmv: 16760, unitPrice: 72, discount: 0,
      viewerFemale: 87, buyerFemale: 88 },
    { id: 'skincare-brand-glass-skin-tutorial', platform: 'RedNote', product: 'Skincare Brand', campaign: 'Glass Skin Tutorial',
      publishedAt: '2026-07-19T20:00', format: 'unboxing', boost: 'organic',
      impressions: 13000, views: 9350, storeVisits: 1370, clicks: 800, orders: 222,
      completion3s: 79, completionRate: 42, avgWatchTime: 16.8,
      gmv: 15990, unitPrice: 72, discount: 0,
      viewerFemale: 89, buyerFemale: 90 },
    { id: 'nut-brand-protein-bites-debut', platform: 'TikTok', product: 'Nut Brand', campaign: 'Protein Bites Debut',
      publishedAt: '2026-07-20T17:45', format: 'unboxing', boost: 'organic',
      impressions: 15700, views: 10200, storeVisits: 1500, clicks: 610, orders: 210,
      completion3s: 71, completionRate: 33, avgWatchTime: 13.9,
      gmv: 9240, unitPrice: 44, discount: 0,
      viewerFemale: 65, buyerFemale: 72 },
    { id: 'drink-brand-iced-latte-recipe', platform: 'TikTok', product: 'Drink Brand', campaign: 'Iced Latte Recipe',
      publishedAt: '2026-07-24T13:15', format: 'daily_share', boost: 'organic',
      impressions: 15850, views: 10250, storeVisits: 1510, clicks: 900, orders: 200,
      completion3s: 70, completionRate: 32, avgWatchTime: 13.5,
      gmv: 4200, unitPrice: 44, discount: 0,
      viewerFemale: 60, buyerFemale: 62 },
  ];

  // ---------------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------------
  function getUserPieces() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveUserPiece(piece) {
    const pieces = getUserPieces();
    pieces.push(piece);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pieces));
  }

  function getAllPieces() {
    return isSeedHidden() ? getUserPieces() : [...SEED_PIECES, ...getUserPieces()];
  }

  function isSeedHidden() {
    return localStorage.getItem(HIDE_SEED_KEY) === '1';
  }

  function setSeedHidden(hidden) {
    if (hidden) localStorage.setItem(HIDE_SEED_KEY, '1');
    else localStorage.removeItem(HIDE_SEED_KEY);
  }

  // ---------------------------------------------------------------------
  // Site-wide platform filter — persists across pages via localStorage.
  // 'all' means no filter (every platform shown); otherwise an exact
  // platform name like 'TikTok' or 'RedNote'. This exists because rates
  // and rankings should never mix platforms (each holds its own baseline),
  // while pure sums (views, GMV) are fine to add across platforms.
  // ---------------------------------------------------------------------
  function getPlatformFilter() {
    return localStorage.getItem(PLATFORM_FILTER_KEY) || 'all';
  }

  function setPlatformFilter(platform) {
    localStorage.setItem(PLATFORM_FILTER_KEY, platform);
  }

  function getAvailablePlatforms() {
    return [...new Set(getAllPieces().map(p => p.platform))].sort();
  }

  function getFilteredPieces() {
    const filter = getPlatformFilter();
    const all = getAllPieces();
    return filter === 'all' ? all : all.filter(p => p.platform === filter);
  }

  function getPieceById(id) {
    return getAllPieces().find(p => p.id === id) || null;
  }

  // ---------------------------------------------------------------------
  // Derived metrics — same formulas as /sql/03_baseline_percentiles.sql
  // and /sql/04_stage_deviation.sql
  // ---------------------------------------------------------------------
  function derive(p) {
    const storeVisitRate = p.impressions ? p.storeVisits / p.impressions : null;
    const clickRate = p.storeVisits ? p.clicks / p.storeVisits : null;
    const orderConversionRate = p.storeVisits ? p.orders / p.storeVisits : null;
    const arpu = p.views ? p.gmv / p.views : null;
    const gmvPerClick = p.clicks ? p.gmv / p.clicks : null;
    const aov = p.orders ? p.gmv / p.orders : null;
    const purchasePropensityFemale = p.viewerFemale ? p.buyerFemale / p.viewerFemale : null;
    const saveRate = p.views && p.saves != null ? p.saves / p.views : null;
    const commentRate = p.views && p.comments != null ? p.comments / p.views : null;
    return {
      ...p, storeVisitRate, clickRate, orderConversionRate, arpu, gmvPerClick, aov,
      purchasePropensityFemale, saveRate, commentRate,
      completion3sFrac: p.completion3s != null ? p.completion3s / 100 : null,
      completionRateFrac: p.completionRate != null ? p.completionRate / 100 : null,
    };
  }

  // ---------------------------------------------------------------------
  // Baseline — p25/p50/p75 across the comparable set (same creator +
  // platform + boost status, excluding the target piece itself), matching
  // /sql/03_baseline_percentiles.sql. Category/product is not part of the
  // comparable filter, per PRD section 3 ("creators are vertical... so
  // splitting by category produces one cell holding everything").
  // ---------------------------------------------------------------------
  function percentile(values, pct) {
    const s = [...values].sort((a, b) => a - b);
    const n = s.length;
    if (n === 0) return null;
    const k = (n - 1) * pct;
    const f = Math.floor(k), c = Math.min(f + 1, n - 1);
    if (f === c) return s[f];
    return s[f] + (s[c] - s[f]) * (k - f);
  }

  const METRICS = ['storeVisitRate', 'clickRate', 'orderConversionRate',
    'completion3sFrac', 'completionRateFrac', 'arpu', 'gmvPerClick', 'aov',
    'saveRate', 'commentRate'];

  function computeBaseline(targetPiece) {
    const comparable = getAllPieces()
      .filter(p => p.id !== targetPiece.id)
      .filter(p => p.platform === targetPiece.platform && p.boost === targetPiece.boost)
      .map(derive);

    const baseline = {};
    METRICS.forEach(m => {
      const vals = comparable.map(p => p[m]).filter(v => v != null && !isNaN(v));
      baseline[m] = {
        p25: percentile(vals, 0.25),
        p50: percentile(vals, 0.50),
        p75: percentile(vals, 0.75),
      };
    });
    return { baseline, sampleSize: comparable.length };
  }

  function confidenceLabel(n) {
    if (n >= 12) return 'high';
    if (n >= 8) return 'medium';
    if (n >= 2) return 'low';
    return 'none';
  }

  function reading(value, metric, baseline) {
    const b = baseline[metric];
    if (value == null || b.p25 == null) return null;
    if (value < b.p25) return 'below';
    if (value > b.p75) return 'above';
    return 'within';
  }

  // ---------------------------------------------------------------------
  // R1-R7 diagnosis — same logic as /verification/generate_and_verify.py
  // and /sql/05_rule_evaluation.sql
  // ---------------------------------------------------------------------
  function diagnose(pieceId) {
    const raw = getPieceById(pieceId);
    if (!raw) return null;
    const piece = derive(raw);
    const { baseline, sampleSize } = computeBaseline(piece);
    const confidence = confidenceLabel(sampleSize);

    const readings = {
      storeVisit: reading(piece.storeVisitRate, 'storeVisitRate', baseline),
      click: reading(piece.clickRate, 'clickRate', baseline),
      order: reading(piece.orderConversionRate, 'orderConversionRate', baseline),
      completion3s: reading(piece.completion3sFrac, 'completion3sFrac', baseline),
      completionRate: reading(piece.completionRateFrac, 'completionRateFrac', baseline),
      gmvPerClick: reading(piece.gmvPerClick, 'gmvPerClick', baseline),
      arpu: reading(piece.arpu, 'arpu', baseline),
    };

    function gap(metric) {
      const b = baseline[metric];
      const v = piece[metric];
      if (v == null || b.p25 == null || v >= b.p25) return 0;
      const spread = (b.p75 - b.p25) || 1e-9;
      return (b.p25 - v) / spread;
    }
    const gaps = { storeVisit: gap('storeVisitRate'), click: gap('clickRate'), order: gap('orderConversionRate') };

    let weakStage = null;
    const ordered = Object.entries(gaps).sort((a, b) => b[1] - a[1]);
    if (ordered[0][1] > 0) {
      weakStage = ordered[0][0];
      for (const [stage, g] of ordered.slice(1)) {
        if (g <= 0) continue; // not actually below baseline — not a real tie
        const order = ['storeVisit', 'click', 'order'];
        if (Math.abs(g - ordered[0][1]) < 0.15 && order.indexOf(stage) < order.indexOf(weakStage)) {
          weakStage = stage;
        }
      }
    }

    const fired = [];
    if (weakStage === 'storeVisit' && gaps.storeVisit > 0) {
      if (readings.completion3s === 'below') {
        fired.push({ rule: 'R1', stage: 'view', side: 'content',
          text: 'The opening did not hold viewers.', evidence: `3s completion ${(piece.completion3sFrac*100).toFixed(0)}% is below your usual range.` });
      } else if (readings.completionRate === 'below' && readings.completion3s === 'within') {
        fired.push({ rule: 'R2', stage: 'view', side: 'content',
          text: 'The piece lost viewers through the middle.', evidence: `Completion rate ${(piece.completionRateFrac*100).toFixed(0)}% is below your usual range, while the opening held fine.` });
      } else if (readings.completion3s === 'within' && readings.completionRate === 'within') {
        fired.push({ rule: 'R3', stage: 'store_visit', side: 'content',
          text: 'Attention was held but not converted into intent.', evidence: 'Store-visit rate is below your usual range even though retention and completion both read normal.' });
      }
    }
    if (weakStage === 'click' && gaps.click > 0 && readings.storeVisit === 'within') {
      fired.push({ rule: 'R4', stage: 'click', side: 'commercial',
        text: 'The product page or its pricing did not convert.', evidence: 'Click rate is below your usual range while store-visit rate reads normal.' });
    }
    if (weakStage === 'order' && gaps.order > 0) {
      if (readings.gmvPerClick === 'below') {
        fired.push({ rule: 'R5', stage: 'order', side: 'commercial',
          text: 'The offer did not convert the viewers who reached it.', evidence: `GMV per click $${piece.gmvPerClick.toFixed(1)} is below your usual range.` });
      } else if (readings.click === 'within' && readings.gmvPerClick === 'within') {
        fired.push({ rule: 'R6', stage: 'order', side: 'content',
          text: 'The piece did not carry enough reason to buy.', evidence: 'Order conversion is below your usual range while click rate and GMV per click both read normal.' });
      }
    }
    if (readings.order !== 'below' && readings.arpu === 'below') {
      fired.push({ rule: 'R7', stage: 'audience', side: 'content',
        text: 'The piece reached the wrong audience.', evidence: `ARPU $${piece.arpu.toFixed(2)} is below your usual range even though order conversion reads normal.` });
    }

    return { piece, baseline, sampleSize, confidence, weakStage, readings, fired };
  }

  function getPreviousPiece(piece) {
    const sameProduct = getAllPieces()
      .filter(p => p.id !== piece.id && p.product === piece.product)
      .filter(p => new Date(p.publishedAt) < new Date(piece.publishedAt))
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return sameProduct[0] || null;
  }

  return { getAllPieces, getUserPieces, saveUserPiece, getPieceById, getPreviousPiece,
    isSeedHidden, setSeedHidden, getPlatformFilter, setPlatformFilter, getAvailablePlatforms,
    getFilteredPieces, derive, computeBaseline, confidenceLabel, reading, diagnose };
})();
