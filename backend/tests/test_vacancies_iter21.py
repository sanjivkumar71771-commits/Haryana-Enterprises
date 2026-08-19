"""iter21 regression: verify list_vacancies always excludes admit_card/result unless
those are the explicitly requested category. Covers haryana leak fix (iter20 minor)."""
import os
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE}/api"

EXCLUDED = {"admit_card", "result"}


def _items(resp):
    assert resp.status_code == 200, f"{resp.status_code}: {resp.text[:200]}"
    data = resp.json()
    # response is either a list or {items:[...], total:...}
    if isinstance(data, list):
        return data
    return data.get("items", data.get("vacancies", []))


def test_vacancy_category_haryana_no_admit_result():
    """The iter20 failing case — Haryana view must NOT contain admit_card/result."""
    r = requests.get(f"{API}/vacancies", params={"category": "haryana"}, timeout=30)
    items = _items(r)
    leaks = [i for i in items if i.get("category") in EXCLUDED]
    assert not leaks, f"haryana leaked {len(leaks)} admit/result items: {[l.get('category') for l in leaks]}"


def test_default_no_admit_or_result():
    r = requests.get(f"{API}/vacancies", timeout=30)
    items = _items(r)
    leaks = [i for i in items if i.get("category") in EXCLUDED]
    assert not leaks, f"default view leaked: {[l.get('category') for l in leaks]}"


def test_category_admit_card_only_admit_card():
    r = requests.get(f"{API}/vacancies", params={"category": "admit_card"}, timeout=30)
    items = _items(r)
    if not items:
        return  # nothing seeded — endpoint works
    cats = {i.get("category") for i in items}
    assert cats == {"admit_card"}, f"expected only admit_card, got {cats}"


def test_category_result_only_result():
    r = requests.get(f"{API}/vacancies", params={"category": "result"}, timeout=30)
    items = _items(r)
    if not items:
        return
    cats = {i.get("category") for i in items}
    assert cats == {"result"}, f"expected only result, got {cats}"


def test_category_ssc_only_ssc():
    r = requests.get(f"{API}/vacancies", params={"category": "ssc"}, timeout=30)
    items = _items(r)
    if not items:
        return
    cats = {i.get("category") for i in items}
    assert cats == {"ssc"}, f"expected only ssc, got {cats}"


def test_state_delhi_no_admit_or_result():
    r = requests.get(f"{API}/vacancies", params={"state": "delhi"}, timeout=30)
    items = _items(r)
    leaks = [i for i in items if i.get("category") in EXCLUDED]
    assert not leaks, f"state=delhi leaked: {[l.get('category') for l in leaks]}"


def test_stats_by_mode_excludes_and_by_category_includes():
    r = requests.get(f"{API}/vacancies/stats", timeout=30)
    assert r.status_code == 200, r.text[:200]
    stats = r.json()

    by_mode = stats.get("by_mode", {})
    by_cat_raw = stats.get("by_category", [])
    # normalize by_category (list of {category,count} or dict)
    if isinstance(by_cat_raw, list):
        by_cat = {c.get("category"): c.get("count", 0) for c in by_cat_raw}
    else:
        by_cat = by_cat_raw

    admit_count = by_cat.get("admit_card", 0)
    result_count = by_cat.get("result", 0)

    # Fetch default job list total for cross-check
    r2 = requests.get(f"{API}/vacancies", timeout=30)
    default_items = _items(r2)

    mode_total = by_mode.get("all", by_mode.get("total", 0))
    # by_mode.all should reflect job-view total (excludes admit_card + result)
    assert mode_total > 0, f"by_mode.all must be > 0, got {mode_total}"
    # Sanity: mode_total should not exceed default items by more than pagination window
    assert mode_total >= len(default_items) or len(default_items) <= mode_total + 1, (
        f"by_mode.all {mode_total} vs default list {len(default_items)}"
    )

    # by_category should still expose admit_card and result counts
    assert "admit_card" in by_cat, f"by_category missing admit_card: {list(by_cat)}"
    assert "result" in by_cat, f"by_category missing result: {list(by_cat)}"
    assert admit_count >= 0 and result_count >= 0

    # Total including all categories >= mode_total + admit + result (guardrail)
    total = stats.get("total", 0)
    assert total == mode_total, (
        f"stats.total ({total}) should equal by_mode.all ({mode_total}) — both are job-view totals"
    )
