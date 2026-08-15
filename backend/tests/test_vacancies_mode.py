"""Tests for vacancies mode filter + counter consistency fix."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://rooftop-solar-jobs.preview.emergentagent.com").rstrip("/")


def test_stats_by_mode_shape():
    r = requests.get(f"{BASE_URL}/api/vacancies/stats", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "total" in data and "by_mode" in data
    bm = data["by_mode"]
    assert set(bm.keys()) >= {"all", "online", "offline"}
    assert bm["all"] == data["total"]
    print(f"stats: total={data['total']} online={bm['online']} offline={bm['offline']}")


def test_vacancies_default_returns_all():
    stats = requests.get(f"{BASE_URL}/api/vacancies/stats", timeout=30).json()
    r = requests.get(f"{BASE_URL}/api/vacancies", timeout=60)
    assert r.status_code == 200
    items = r.json()
    print(f"vacancies default len={len(items)} vs stats.total={stats['total']}")
    assert len(items) == stats["total"], f"Expected {stats['total']} items, got {len(items)}"
    assert len(items) > 100, "Default limit should be > 100 now"


def test_vacancies_mode_offline():
    stats = requests.get(f"{BASE_URL}/api/vacancies/stats", timeout=30).json()
    r = requests.get(f"{BASE_URL}/api/vacancies?mode=offline", timeout=60)
    assert r.status_code == 200
    items = r.json()
    assert len(items) == stats["by_mode"]["offline"]
    for it in items:
        assert it.get("application_mode") == "offline"


def test_vacancies_mode_online():
    stats = requests.get(f"{BASE_URL}/api/vacancies/stats", timeout=30).json()
    r = requests.get(f"{BASE_URL}/api/vacancies?mode=online", timeout=60)
    assert r.status_code == 200
    items = r.json()
    assert len(items) == stats["by_mode"]["online"]
    for it in items:
        assert it.get("application_mode") == "online"


# Light regression spot checks
def test_solar_apply_gone():
    r = requests.post(f"{BASE_URL}/api/solar/apply", json={"name": "x"}, timeout=15)
    assert r.status_code == 410


def test_enquiry_ok():
    r = requests.post(f"{BASE_URL}/api/enquiry", json={
        "full_name": "TEST User", "mobile": "9999999999", "email": "test@example.com",
        "service": "Irrigation", "message": "Test enquiry message"
    }, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert str(data.get("ref_no", "")).startswith("ENQ-")
