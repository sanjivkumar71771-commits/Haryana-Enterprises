"""Iter 14 – Result scraper fix, state filter, and regressions."""
import os
import re
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

RESULT_RX = re.compile(r"result|cut[- ]?off|merit list|answer key|score card|final selection", re.I)
ADMIT_RX = re.compile(r"admit card|hall ticket|call letter|interview letter|e-admit", re.I)
HIMACHAL_RX = re.compile(r"\b(himachal|hppsc|hpssc|hpsssb)\b", re.I)

KNOWN_STATES = {"haryana", "delhi", "punjab", "rajasthan", "uttar-pradesh",
                "himachal-pradesh", "karnataka", "odisha", "jammu-kashmir"}


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ── (1) Result scraper fix ───────────────────────────────────────────────
def test_result_category_returns_items(s):
    r = s.get(f"{API}/vacancies", params={"category": "result"}, timeout=45)
    assert r.status_code == 200
    items = r.json()
    assert len(items) > 0, "Expected >0 result-category items"
    for v in items:
        assert v.get("category") == "result", f"Non-result leaked: {v.get('category')} / {v.get('title')}"
        title = v.get("title", "")
        assert RESULT_RX.search(title), f"Title lacks result keyword: {title!r}"


def test_stats_by_category_has_result(s):
    r = s.get(f"{API}/vacancies/stats", timeout=30)
    assert r.status_code == 200
    d = r.json()
    cats = {c["category"]: c["count"] for c in d["by_category"]}
    assert "result" in cats, f"'result' missing from by_category. Keys: {list(cats.keys())}"
    assert cats["result"] > 0


# ── (2) Admit card scraper regression ────────────────────────────────────
def test_admit_card_scraper_healthy(s):
    r = s.get(f"{API}/vacancies", params={"category": "admit_card"}, timeout=45)
    assert r.status_code == 200
    items = r.json()
    assert len(items) > 0
    for v in items:
        assert v.get("category") == "admit_card"
        assert ADMIT_RX.search(v.get("title", "")), f"Title lacks admit-card keyword: {v.get('title')!r}"

    stats = s.get(f"{API}/vacancies/stats", timeout=30).json()
    cats = {c["category"]: c["count"] for c in stats["by_category"]}
    assert cats.get("admit_card") == len(items), \
        f"stats admit_card count {cats.get('admit_card')} != list length {len(items)}"


# ── (3) State filter ─────────────────────────────────────────────────────
def test_stats_has_by_state_sorted_desc(s):
    r = s.get(f"{API}/vacancies/stats", timeout=30)
    d = r.json()
    assert "by_state" in d, "stats missing by_state"
    bs = d["by_state"]
    assert isinstance(bs, list) and len(bs) > 0
    counts = [x["count"] for x in bs]
    assert counts == sorted(counts, reverse=True), "by_state not sorted desc"
    slugs = {x["state"] for x in bs}
    assert slugs & KNOWN_STATES, f"No known state slugs found in {slugs}"


def test_state_filter_delhi(s):
    r = s.get(f"{API}/vacancies", params={"state": "delhi"}, timeout=30)
    assert r.status_code == 200
    items = r.json()
    if len(items) == 0:
        pytest.skip("No delhi items in DB currently")
    for v in items:
        assert v.get("state") == "delhi", f"Non-delhi leaked: {v.get('state')} / {v.get('title')}"


def test_state_filter_punjab_no_himachal_leak(s):
    r = s.get(f"{API}/vacancies", params={"state": "punjab"}, timeout=30)
    assert r.status_code == 200
    items = r.json()
    if len(items) == 0:
        pytest.skip("No punjab items in DB currently")
    for v in items:
        assert v.get("state") == "punjab"
        blob = " ".join(str(v.get(k) or "") for k in ("title", "organization", "row_text"))
        assert not HIMACHAL_RX.search(blob) or "punjab" in blob.lower(), \
            f"Himachal item leaked into punjab: {v.get('title')}"


def test_every_item_has_state_field(s):
    r = s.get(f"{API}/vacancies", timeout=30)
    items = r.json()
    for v in items[:100]:
        assert "state" in v, f"item missing 'state' key: {v.get('title')}"


# ── (4) Regressions from iter13 ──────────────────────────────────────────
def test_default_excludes_expired(s):
    r = s.get(f"{API}/vacancies", timeout=30)
    for v in r.json():
        assert v.get("is_expired") is False


def test_mode_other_returns_null_mode(s):
    r = s.get(f"{API}/vacancies", params={"mode": "other"}, timeout=30)
    assert r.status_code == 200
    for v in r.json():
        assert not v.get("application_mode")


def test_category_haryana_still_broader(s):
    r = s.get(f"{API}/vacancies", params={"category": "haryana"}, timeout=30)
    assert r.status_code == 200
    HRX = re.compile(r"\b(haryana|hssc|hpsc|hbse|hkrn|hprb|panchkula|chandigarh)\b", re.I)
    for v in r.json():
        blob = " ".join(str(v.get(k) or "") for k in ("title", "organization", "post_name", "row_text"))
        assert v.get("category") == "haryana" or HRX.search(blob)
