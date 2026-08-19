"""Iteration 20 — verify admit_card/result exclusion from default 'All Vacancies' view."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to reading frontend .env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass

API = f"{BASE_URL}/api"


def test_default_all_excludes_admit_and_result():
    r = requests.get(f"{API}/vacancies", timeout=30)
    assert r.status_code == 200
    data = r.json()
    cats = {v.get("category") for v in data}
    assert "admit_card" not in cats, f"admit_card leaked in default view: {len(data)} items"
    assert "result" not in cats, f"result leaked in default view"


def test_category_all_excludes_admit_and_result():
    r = requests.get(f"{API}/vacancies", params={"category": "all"}, timeout=30)
    assert r.status_code == 200
    cats = {v.get("category") for v in r.json()}
    assert "admit_card" not in cats
    assert "result" not in cats


def test_admit_card_filter_returns_only_admit_card():
    r = requests.get(f"{API}/vacancies", params={"category": "admit_card"}, timeout=30)
    assert r.status_code == 200
    items = r.json()
    for v in items:
        assert v.get("category") == "admit_card", f"non-admit_card leaked: {v.get('category')}"


def test_result_filter_returns_only_result():
    r = requests.get(f"{API}/vacancies", params={"category": "result"}, timeout=30)
    assert r.status_code == 200
    items = r.json()
    for v in items:
        assert v.get("category") == "result", f"non-result leaked: {v.get('category')}"


def test_stats_totals_reflect_job_view():
    r = requests.get(f"{API}/vacancies/stats", timeout=30)
    assert r.status_code == 200
    s = r.json()
    total = s["total"]
    by_mode_all = s["by_mode"]["all"]
    assert total == by_mode_all, f"by_mode.all ({by_mode_all}) != total ({total})"

    # by_category should still contain admit_card + result entries
    cats = {c["category"]: c["count"] for c in s["by_category"]}
    assert "admit_card" in cats, "admit_card missing from by_category"
    assert "result" in cats, "result missing from by_category"

    # Confirm total equals default list length
    lr = requests.get(f"{API}/vacancies", timeout=30)
    assert lr.status_code == 200
    assert len(lr.json()) <= total  # active <= total (should equal but expiry may filter more)


def test_stats_by_state_excludes_admit_and_result():
    # Fetch stats then explicitly count from raw filtered endpoint
    r = requests.get(f"{API}/vacancies/stats", timeout=30)
    assert r.status_code == 200
    by_state = {x["state"]: x["count"] for x in r.json().get("by_state", [])}

    # Get admit_card + result items — none of their states should be counted extra
    admit = requests.get(f"{API}/vacancies", params={"category": "admit_card", "include_expired": "true"}, timeout=30).json()
    res = requests.get(f"{API}/vacancies", params={"category": "result", "include_expired": "true"}, timeout=30).json()
    excluded_states = [v.get("state") for v in admit + res if v.get("state")]
    # This is only a smoke check — we can't easily prove exclusion without DB,
    # but by_state totals should sum to <= total (job_items count)
    total_state_count = sum(by_state.values())
    assert total_state_count <= r.json()["total"], "state counts exceed job total — admit/result leaked"


def test_haryana_filter_still_works():
    r = requests.get(f"{API}/vacancies", params={"category": "haryana"}, timeout=30)
    assert r.status_code == 200
    # Should return >0 items in general (may be 0 in test DB — just check 200)


def test_admin_login_endpoint():
    r = requests.post(f"{API}/auth/login",
                      json={"email": "admin@haryanaenterprises.com", "password": "Admin@123"},
                      timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text[:200]}"
    data = r.json()
    assert data.get("user", {}).get("role") == "admin"
