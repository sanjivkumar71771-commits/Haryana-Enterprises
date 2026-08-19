"""Tests for /api/site-content endpoints (admin Phase 1: SEO + Front-page)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

EXPECTED_KEYS = {
    "seo:home", "seo:vacancies", "seo:services", "seo:about", "seo:contact",
    "content:hero", "content:about", "content:contact",
}


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={
        "email": "admin@haryanaenterprises.com",
        "password": "Admin@123",
    })
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in login response: {data}"
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ─── Public GETs ───

def test_get_all_site_content():
    r = requests.get(f"{API}/site-content")
    assert r.status_code == 200
    body = r.json()
    assert "content" in body and "keys" in body
    keys = set(body["keys"])
    assert EXPECTED_KEYS.issubset(keys), f"Missing keys: {EXPECTED_KEYS - keys}"
    for k in EXPECTED_KEYS:
        v = body["content"].get(k)
        assert isinstance(v, dict) and len(v) > 0, f"Empty value for {k}"


def test_get_seo_home():
    r = requests.get(f"{API}/site-content/seo:home")
    assert r.status_code == 200
    body = r.json()
    assert body["key"] == "seo:home"
    v = body["value"]
    for f in ("title", "description", "keywords"):
        assert f in v and v[f], f"seo:home missing/empty field {f}"


def test_get_unknown_key_returns_404():
    r = requests.get(f"{API}/site-content/unknown:key")
    assert r.status_code == 404


# ─── Auth on PUT ───

def test_put_without_auth_returns_401():
    r = requests.put(f"{API}/site-content/seo:home", json={"value": {"title": "x"}})
    assert r.status_code in (401, 403), f"expected 401/403 got {r.status_code}"


def test_put_unknown_key_returns_400(admin_headers):
    r = requests.put(f"{API}/site-content/unknown:key",
                     json={"value": {"foo": "bar"}}, headers=admin_headers)
    assert r.status_code == 400


# ─── Full update + persistence + cleanup ───

def test_put_seo_home_persists_and_cleanup(admin_headers):
    # snapshot current title (may be default or previously-set)
    orig = requests.get(f"{API}/site-content/seo:home").json()["value"]

    new_title = "ADMIN TEST TITLE"
    r = requests.put(f"{API}/site-content/seo:home",
                     json={"value": {"title": new_title,
                                     "description": orig["description"],
                                     "keywords": orig["keywords"]}},
                     headers=admin_headers)
    assert r.status_code == 200, r.text

    # verify persistence via GET
    g = requests.get(f"{API}/site-content/seo:home").json()
    assert g["value"]["title"] == new_title

    # cleanup: reset to defaults
    r = requests.put(f"{API}/site-content/seo:home",
                     json={"value": {}}, headers=admin_headers)
    assert r.status_code == 200
    reset = requests.get(f"{API}/site-content/seo:home").json()["value"]
    # After reset, defaults kick in
    assert reset["title"].startswith("Haryana Enterprises")


def test_put_drops_unknown_fields(admin_headers):
    r = requests.put(f"{API}/site-content/seo:home",
                     json={"value": {"title": "T1", "garbage_field": "xxx"}},
                     headers=admin_headers)
    assert r.status_code == 200
    v = r.json()["value"]
    assert v.get("title") == "T1"
    assert "garbage_field" not in v
    # cleanup
    requests.put(f"{API}/site-content/seo:home", json={"value": {}}, headers=admin_headers)


# ─── Regression sanity ───

def test_vacancies_stats_still_200():
    r = requests.get(f"{API}/vacancies/stats")
    assert r.status_code == 200


def test_enquiry_post_still_works():
    r = requests.post(f"{API}/enquiry", json={
        "full_name": "TEST regression",
        "mobile": "9999999999",
        "email": "test@example.com",
        "service": "solar",
        "message": "iteration18 site-content regression",
    })
    assert r.status_code in (200, 201), r.text
