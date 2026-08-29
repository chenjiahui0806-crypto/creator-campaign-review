import json, random, statistics, csv
random.seed(42)

# ---------------------------------------------------------------------------
# PART 1: Synthetic comparable history (baseline set)
# One creator, "Nut Brand" style food/snack account, TikTok, organic pieces
# only, published inside a 6-month window. 20 comparable pieces, matching
# the PRD's "20 to 25 comparable pieces inside the six-month window" figure.
# All numbers are fabricated for testing purposes, not real platform data.
# ---------------------------------------------------------------------------

FORMATS = ["unboxing", "daily_share"]

def gen_piece(idx, month):
    fmt = random.choices(FORMATS, weights=[0.65, 0.35])[0]
    impressions = random.randint(9000, 24000)
    view_rate = random.uniform(0.55, 0.72)
    views = int(impressions * view_rate)

    store_visit_rate = random.gauss(0.19, 0.035)
    store_visit_rate = max(0.06, min(store_visit_rate, 0.34))
    store_visits = int(views * store_visit_rate)

    click_rate = random.gauss(0.55, 0.09)
    click_rate = max(0.25, min(click_rate, 0.85))
    clicks = int(store_visits * click_rate)

    order_conv = random.gauss(0.20, 0.045)
    order_conv = max(0.05, min(order_conv, 0.36))
    orders = int(clicks * order_conv / click_rate) if click_rate > 0 else 0
    # order_conversion_rate is defined as orders / store_visits in the PRD,
    # so re-derive orders directly off store_visits to keep that definition exact.
    orders = int(store_visits * order_conv)
    orders = min(orders, clicks)  # can't exceed clicks (funnel monotonicity)

    completion_3s = max(0.35, min(random.gauss(0.71, 0.08), 0.95))
    completion_rate = max(0.10, min(random.gauss(0.34, 0.07), 0.60))
    avg_watch_time = max(4.0, round(random.gauss(14.0, 2.2), 1))

    unit_price = round(random.gauss(42, 6), 1)
    unit_price = max(18, unit_price)
    gmv = round(orders * unit_price * random.uniform(0.9, 1.15), 1)

    viewer_female = round(random.uniform(0.55, 0.72), 2)
    buyer_female = round(min(0.95, viewer_female + random.uniform(0.02, 0.18)), 2)

    return {
        "content_id": f"hist-{idx:03d}",
        "platform": "TikTok",
        "product_id": "nut-brand-mix",
        "published_at": f"2026-{month:02d}-{random.randint(1,28):02d}",
        "content_format": fmt,
        "boost_status": "organic",
        "impressions": impressions,
        "views": views,
        "store_visits": store_visits,
        "clicks": clicks,
        "orders": orders,
        "completion_3s": round(completion_3s, 3),
        "completion_rate": round(completion_rate, 3),
        "avg_watch_time": avg_watch_time,
        "gmv": gmv,
        "unit_price": unit_price,
        "viewer_female_share": viewer_female,
        "buyer_female_share": buyer_female,
    }

history = [gen_piece(i, month=(i % 6) + 2) for i in range(1, 21)]  # months 2-7, 20 pieces

# ---------------------------------------------------------------------------
# Derived metrics (computed at query time per the PRD, never stored)
# ---------------------------------------------------------------------------
def derive(p):
    d = dict(p)
    d["store_visit_rate"] = p["store_visits"] / p["impressions"] if p["impressions"] else 0
    d["click_rate"] = p["clicks"] / p["store_visits"] if p["store_visits"] else 0
    d["order_conversion_rate"] = p["orders"] / p["store_visits"] if p["store_visits"] else 0
    d["arpu"] = p["gmv"] / p["views"] if p["views"] else 0
    d["gmv_per_click"] = p["gmv"] / p["clicks"] if p["clicks"] else 0
    d["aov"] = p["gmv"] / p["orders"] if p["orders"] else 0
    d["purchase_propensity_female"] = (
        p["buyer_female_share"] / p["viewer_female_share"] if p["viewer_female_share"] else 0
    )
    return d

history = [derive(p) for p in history]

# ---------------------------------------------------------------------------
# PART 2: Baseline engine — p25/p50/p75 per metric across the comparable set
# ---------------------------------------------------------------------------
METRICS = [
    "store_visit_rate", "click_rate", "order_conversion_rate",
    "completion_3s", "completion_rate", "avg_watch_time",
    "arpu", "gmv_per_click", "aov",
]

def percentile(values, pct):
    s = sorted(values)
    n = len(s)
    if n == 0:
        return None
    k = (n - 1) * pct
    f, c = int(k), min(int(k) + 1, n - 1)
    if f == c:
        return s[f]
    return s[f] + (s[c] - s[f]) * (k - f)

baseline = {}
for m in METRICS:
    vals = [p[m] for p in history]
    baseline[m] = {
        "p25": percentile(vals, 0.25),
        "p50": percentile(vals, 0.50),
        "p75": percentile(vals, 0.75),
    }

sample_size = len(history)

def confidence_label(n):
    if n >= 12: return "high"
    if n >= 8: return "medium"
    if n >= 2: return "low"
    return "none"

base_confidence = confidence_label(sample_size)

print("=" * 70)
print(f"BASELINE — {sample_size} comparable organic TikTok pieces, confidence: {base_confidence}")
print("=" * 70)
for m in METRICS:
    b = baseline[m]
    print(f"  {m:24s}  p25={b['p25']:.4f}  p50={b['p50']:.4f}  p75={b['p75']:.4f}")

# ---------------------------------------------------------------------------
# PART 3: Target pieces engineered to each trigger a specific rule
# ---------------------------------------------------------------------------
def reading(value, m):
    b = baseline[m]
    if value < b["p25"]: return "below"
    if value > b["p75"]: return "above"
    return "within"

def make_target(name, impressions, views, store_visits, clicks, orders,
                 completion_3s, completion_rate, avg_watch_time, gmv, unit_price,
                 viewer_female_share=0.62, buyer_female_share=0.70):
    p = {
        "content_id": name, "platform": "TikTok", "product_id": "nut-brand-mix",
        "boost_status": "organic",
        "impressions": impressions, "views": views, "store_visits": store_visits,
        "clicks": clicks, "orders": orders,
        "completion_3s": completion_3s, "completion_rate": completion_rate,
        "avg_watch_time": avg_watch_time, "gmv": gmv, "unit_price": unit_price,
        "viewer_female_share": viewer_female_share, "buyer_female_share": buyer_female_share,
    }
    return derive(p)

targets = [
    # R1: view-stage weak explained by poor 3s retention. Store_visit_rate is
    # the weakest funnel stage, and completion_3s reads below normal.
    make_target("target-R1-weak-hook", 15000, 9500, 1350, 850, 260,
                completion_3s=0.52, completion_rate=0.33, avg_watch_time=13.8,
                gmv=11500, unit_price=42),

    # R2: store_visit weak, but completion_3s is fine while completion_rate
    # (mid-video retention) reads below normal — viewers held the opening but
    # drifted before the CTA.
    make_target("target-R2-midroll-drop", 15000, 9800, 1400, 900, 270,
                completion_3s=0.73, completion_rate=0.19, avg_watch_time=9.5,
                gmv=12000, unit_price=42),

    # R3: store_visit weak but retention AND completion both read normal —
    # attention was held, something else (not captured by these signals)
    # kept people from tapping the product tag.
    make_target("target-R3-attention-not-intent", 15000, 9900, 1200, 780, 240,
                completion_3s=0.72, completion_rate=0.35, avg_watch_time=14.2,
                gmv=10200, unit_price=42),

    # R4: click-stage weak while store_visit_rate reads normal — people
    # reached the product page but the page/pricing didn't convert them
    # into a click.
    make_target("target-R4-page-drop", 15000, 9800, 1920, 800, 380,
                completion_3s=0.71, completion_rate=0.34, avg_watch_time=14.0,
                gmv=15960, unit_price=42),

    # R5: order-stage weak, GMV per click below normal — offer/price issue.
    make_target("target-R5-offer-weak", 15000, 9800, 2900, 1650, 260,
                completion_3s=0.70, completion_rate=0.33, avg_watch_time=13.9,
                gmv=6800, unit_price=68),

    # R6: order-stage weak but click_rate and gmv_per_click both read
    # normal — the piece itself did not give enough reason to buy.
    make_target("target-R6-weak-cta", 15000, 9800, 2900, 1650, 220,
                completion_3s=0.70, completion_rate=0.33, avg_watch_time=13.9,
                gmv=25000, unit_price=42),

    # R7: order_conversion reads NORMAL but ARPU reads below normal —
    # audience mismatch, reached the wrong crowd even though those who
    # got there converted fine.
    make_target("target-R7-wrong-audience", 22000, 15800, 3000, 1700, 610,
                completion_3s=0.71, completion_rate=0.34, avg_watch_time=14.1,
                gmv=9200, unit_price=42),
]

STAGE_ORDER = ["store_visit", "click", "order"]
STAGE_METRIC = {
    "store_visit": "store_visit_rate",
    "click": "click_rate",
    "order": "order_conversion_rate",
}

def locate_weak_stage():
    def below_p25_gap(m, value):
        b = baseline[m]
        # normalize the gap by p75-p25 so stages on different scales compare fairly
        spread = (b["p75"] - b["p25"]) or 1e-9
        return max(0.0, (b["p25"] - value) / spread)
    return below_p25_gap

def diagnose(piece):
    gap_fn = locate_weak_stage()
    gaps = {stage: gap_fn(STAGE_METRIC[stage], piece[STAGE_METRIC[stage]]) for stage in STAGE_ORDER}
    # pick stage with the largest gap; if two adjacent stages are within a
    # small margin of each other, prefer the earlier stage (upstream first)
    ordered = sorted(gaps.items(), key=lambda kv: -kv[1])
    weak_stage, weak_gap = ordered[0]
    for stage, gap in ordered[1:]:
        if abs(gap - weak_gap) < 0.15 and STAGE_ORDER.index(stage) < STAGE_ORDER.index(weak_stage):
            weak_stage = stage
    fired = []

    r3s = reading(piece["completion_3s"], "completion_3s")
    rcomp = reading(piece["completion_rate"], "completion_rate")
    rsv = reading(piece["store_visit_rate"], "store_visit_rate")
    rclick = reading(piece["click_rate"], "click_rate")
    rorder = reading(piece["order_conversion_rate"], "order_conversion_rate")
    rgpc = reading(piece["gmv_per_click"], "gmv_per_click")
    rarpu = reading(piece["arpu"], "arpu")

    if weak_stage == "store_visit" and gaps["store_visit"] > 0:
        if r3s == "below":
            fired.append(("R1", "view", "content", f"completion_3s={piece['completion_3s']:.2f} below baseline p25={baseline['completion_3s']['p25']:.2f}"))
        elif rcomp == "below" and r3s == "within":
            fired.append(("R2", "view", "content", f"completion_rate={piece['completion_rate']:.2f} below baseline p25={baseline['completion_rate']['p25']:.2f}, completion_3s within"))
        elif r3s == "within" and rcomp == "within":
            fired.append(("R3", "store_visit", "content", f"store_visit_rate={piece['store_visit_rate']:.2f} below baseline p25={baseline['store_visit_rate']['p25']:.2f}, retention and completion both within"))

    if weak_stage == "click" and gaps["click"] > 0 and rsv == "within":
        fired.append(("R4", "click", "commercial", f"click_rate={piece['click_rate']:.2f} below baseline p25={baseline['click_rate']['p25']:.2f}, store_visit_rate within"))

    if weak_stage == "order" and gaps["order"] > 0:
        if rgpc == "below":
            fired.append(("R5", "order", "commercial", f"gmv_per_click={piece['gmv_per_click']:.2f} below baseline p25={baseline['gmv_per_click']['p25']:.2f}"))
        elif rclick == "within" and rgpc == "within":
            fired.append(("R6", "order", "content", f"order_conversion_rate={piece['order_conversion_rate']:.2f} below baseline p25={baseline['order_conversion_rate']['p25']:.2f}, click_rate and gmv_per_click both within"))

    # R7 is additive: fires whenever order_conversion reads normal but ARPU reads below,
    # regardless of which stage step one picked as weakest.
    if rorder != "below" and rarpu == "below":
        fired.append(("R7", "audience", "content", f"arpu={piece['arpu']:.2f} below baseline p25={baseline['arpu']['p25']:.2f}, order_conversion_rate within/above"))

    return weak_stage, gaps, fired

print()
print("=" * 70)
print("RULE VERIFICATION — one target piece per rule")
print("=" * 70)
results = []
for t in targets:
    stage, gaps, fired = diagnose(t)
    rule_ids = [f[0] for f in fired]
    expected_rule = t["content_id"].split("-")[1]  # e.g. "R1"
    passed = expected_rule in rule_ids
    results.append((t["content_id"], expected_rule, rule_ids, passed))
    print(f"\n{t['content_id']}  (expected {expected_rule})")
    print(f"  funnel: store_visit_rate={t['store_visit_rate']:.3f} ({reading(t['store_visit_rate'],'store_visit_rate')}), "
          f"click_rate={t['click_rate']:.3f} ({reading(t['click_rate'],'click_rate')}), "
          f"order_conversion_rate={t['order_conversion_rate']:.3f} ({reading(t['order_conversion_rate'],'order_conversion_rate')})")
    print(f"  weak stage located: {stage}  (gaps: " + ", ".join(f"{k}={v:.2f}" for k,v in gaps.items()) + ")")
    if fired:
        for rid, stg, side, evidence in fired:
            print(f"  -> FIRED {rid} [{stg}/{side}]: {evidence}")
    else:
        print("  -> no rule fired")
    print(f"  PASS: {passed}")

print()
print("=" * 70)
print("SUMMARY")
print("=" * 70)
for cid, expected, got, passed in results:
    status = "PASS" if passed else "FAIL"
    print(f"  [{status}] {cid}: expected {expected}, fired {got}")

n_pass = sum(1 for r in results if r[3])
print(f"\n{n_pass}/{len(results)} target pieces triggered their intended rule.")

# ---------------------------------------------------------------------------
# Export the history dataset in both CSV and JSON, matching the PRD Content
# entity fields, for the person to inspect or import elsewhere.
# ---------------------------------------------------------------------------
with open("/home/claude/rules_test/baseline_history.json", "w") as f:
    json.dump(history, f, indent=2)

with open("/home/claude/rules_test/baseline_history.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(history[0].keys()))
    writer.writeheader()
    writer.writerows(history)

with open("/home/claude/rules_test/target_pieces.json", "w") as f:
    json.dump(targets, f, indent=2)

with open("/home/claude/rules_test/baseline_summary.json", "w") as f:
    json.dump({"sample_size": sample_size, "confidence": base_confidence, "baseline": baseline}, f, indent=2)

print("\nFiles written: baseline_history.json/csv, target_pieces.json, baseline_summary.json")
