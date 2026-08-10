"""Backend tests for vacancy application_mode counts & filters."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://haryana-enterprises.preview.emergentagent.com").rstrip("/")


def _get(path):
    r = requests.get(f"{BASE_URL}{path}", timeout=30)
    assert r.status_code == 200, f"{path} -> {r.status_code}: {r.text[:200]}"
    return r.json()


def test_stats_by_mode_invariant():
    stats = _get("/api/vacancies/stats")
    total = stats["total"]
    by_mode = stats.get("by_mode", {})
    online = by_mode.get("online", 0)
    offline = by_mode.get("offline", 0)
    other = total - online - offline
    print(f"total={total} online={online} offline={offline} other={other}")
    assert online + offline + other == total
    # Sanity: after fix online should be significantly higher than 70
    assert online >= 150, f"Expected online >= 150 after backfill, got {online}"
    assert offline >= 40, f"Expected offline >= 40 after backfill, got {offline}"


def test_mode_online_filter_matches_stats():
    stats = _get("/api/vacancies/stats")
    expected = stats["by_mode"]["online"]
    items = _get("/api/vacancies?mode=online&limit=1000")
    assert isinstance(items, list)
    assert all(it.get("application_mode") == "online" for it in items)
    assert len(items) == expected, f"online items={len(items)} vs stats={expected}"


def test_mode_offline_filter_matches_stats():
    stats = _get("/api/vacancies/stats")
    expected = stats["by_mode"]["offline"]
    items = _get("/api/vacancies?mode=offline&limit=1000")
    assert all(it.get("application_mode") == "offline" for it in items)
    assert len(items) == expected, f"offline items={len(items)} vs stats={expected}"


def test_mode_other_filter_matches_stats():
    stats = _get("/api/vacancies/stats")
    total = stats["total"]
    expected = total - stats["by_mode"]["online"] - stats["by_mode"]["offline"]
    items = _get("/api/vacancies?mode=other&limit=1000")
    assert all(not it.get("application_mode") for it in items)
    assert len(items) == expected, f"other items={len(items)} vs expected={expected}"


# Regression: enquiry POST and solar/apply POST (410 gone)
def test_enquiry_post_valid():
    payload = {
        "full_name": "TEST User",
        "email": "test@example.com",
        "mobile": "9999999999",
        "service": "Solar Consultation",
        "message": "Test enquiry — please contact",
    }
    r = requests.post(f"{BASE_URL}/api/enquiry", json=payload, timeout=30)
    assert r.status_code in (200, 201), f"{r.status_code}: {r.text[:200]}"


def test_solar_apply_gone():
    r = requests.post(f"{BASE_URL}/api/solar/apply", json={}, timeout=30)
    assert r.status_code == 410, f"expected 410, got {r.status_code}"
