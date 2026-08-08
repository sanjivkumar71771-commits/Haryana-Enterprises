"""Tests for FreeJobAlert vacancy scraper + subscription APIs (Iteration 5)."""
import os
import uuid
import time
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://haryana-solar-app.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@haryanaenterprises.com"
ADMIN_PASSWORD = "Admin@123"
USER_EMAIL = "user@test.com"
USER_PASSWORD = "Test@123"


@pytest.fixture(scope="module")
def admin_sess():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def user_sess():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return s


# ---------- Listing / filters ----------
def test_vacancies_list_returns_real_titles():
    r = requests.get(f"{API}/vacancies?limit=20", timeout=30)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list) and len(items) > 0
    # No "Get Details" placeholder in title
    for v in items:
        title = (v.get("title") or "").strip()
        assert title, f"empty title: {v}"
        assert title.lower() != "get details"
        assert "organization" in v
        assert "post_name" in v
        assert "category" in v


def test_vacancies_filter_category_bank():
    r = requests.get(f"{API}/vacancies?category=bank&limit=50", timeout=30)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    for v in items:
        assert v.get("category") == "bank", f"non-bank leaked: {v.get('category')}"


def test_vacancies_filter_qualification():
    r = requests.get(f"{API}/vacancies?qualification=graduate&limit=50", timeout=30)
    assert r.status_code == 200
    items = r.json()
    for v in items:
        assert "graduate" in (v.get("qualification") or "").lower()


def test_vacancies_search_query():
    r = requests.get(f"{API}/vacancies?q=recruitment&limit=10", timeout=30)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------- Stats ----------
def test_vacancies_stats():
    r = requests.get(f"{API}/vacancies/stats", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "total" in data and data["total"] > 0
    assert isinstance(data["by_category"], list) and len(data["by_category"]) > 0
    assert "last_updated" in data


# ---------- Detail ----------
def test_vacancy_detail_invalid_id():
    r = requests.get(f"{API}/vacancies/not-an-oid", timeout=30)
    assert r.status_code == 400


def test_vacancy_detail_valid_but_missing():
    r = requests.get(f"{API}/vacancies/507f1f77bcf86cd799439011", timeout=30)
    assert r.status_code == 404


def test_vacancy_detail_full_structure():
    lst = requests.get(f"{API}/vacancies?limit=1", timeout=30).json()
    assert lst, "list empty"
    vid = lst[0]["id"]
    # First call may take a while (lazy scrape); allow generous timeout
    r = requests.get(f"{API}/vacancies/{vid}", timeout=60)
    assert r.status_code == 200
    v = r.json()
    # Structured fields
    assert v.get("heading") or v.get("title")
    # content_html and important_links are populated after detail scrape
    assert "content_html" in v
    # important_links may be a list of {kind, text, href}
    if v.get("important_links"):
        for lk in v["important_links"]:
            assert "href" in lk and "kind" in lk

    # 2nd call should be much faster (cached)
    t0 = time.time()
    r2 = requests.get(f"{API}/vacancies/{vid}", timeout=30)
    elapsed = time.time() - t0
    assert r2.status_code == 200
    assert elapsed < 5.0, f"cached call too slow: {elapsed:.2f}s"


# ---------- Admin refresh ----------
def test_admin_refresh_requires_admin(user_sess):
    r = user_sess.post(f"{API}/admin/vacancies/refresh", timeout=90)
    assert r.status_code == 403


def test_admin_refresh_unauthenticated():
    r = requests.post(f"{API}/admin/vacancies/refresh", timeout=30)
    assert r.status_code == 401


def test_admin_refresh_ok(admin_sess):
    r = admin_sess.post(f"{API}/admin/vacancies/refresh", timeout=180)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    assert "new_added" in data
    assert "total" in data


# ---------- Subscription CRUD ----------
@pytest.fixture(scope="module")
def sub_email():
    return f"test-{uuid.uuid4().hex[:8]}-{int(time.time())}@example.com"


def test_subscribe_requires_at_least_one_criteria():
    r = requests.post(f"{API}/vacancy-alerts/subscribe", json={
        "email": f"noop-{uuid.uuid4().hex[:6]}@example.com",
        "categories": [], "qualifications": [], "keyword": None,
    }, timeout=30)
    assert r.status_code == 400


def test_subscribe_success(sub_email):
    r = requests.post(f"{API}/vacancy-alerts/subscribe", json={
        "email": sub_email, "categories": ["bank"], "qualifications": ["graduate"], "keyword": "clerk",
    }, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    assert data.get("unsubscribe_token")


def test_subscribe_duplicate_upserts(sub_email):
    r = requests.post(f"{API}/vacancy-alerts/subscribe", json={
        "email": sub_email, "categories": ["ssc"], "qualifications": ["12th"], "keyword": "peon",
    }, timeout=30)
    assert r.status_code == 200
    # Check status reflects new prefs
    st = requests.get(f"{API}/vacancy-alerts/status", params={"email": sub_email}, timeout=30)
    assert st.status_code == 200
    body = st.json()
    assert body.get("subscribed") is True
    assert "ssc" in body.get("categories", [])
    assert body.get("keyword") == "peon"


def test_status_unknown_email():
    r = requests.get(f"{API}/vacancy-alerts/status",
                     params={"email": f"never-{uuid.uuid4().hex[:8]}@example.com"}, timeout=30)
    assert r.status_code == 200
    assert r.json().get("subscribed") is False


def test_unsubscribe_success_then_status_inactive(sub_email):
    # subscribe fresh
    email = f"unsub-{uuid.uuid4().hex[:8]}@example.com"
    sub = requests.post(f"{API}/vacancy-alerts/subscribe", json={
        "email": email, "categories": ["bank"], "qualifications": [], "keyword": None,
    }, timeout=30)
    token = sub.json()["unsubscribe_token"]

    r = requests.post(f"{API}/vacancy-alerts/unsubscribe", json={"token": token}, timeout=30)
    assert r.status_code == 200
    assert r.json().get("ok") is True

    st = requests.get(f"{API}/vacancy-alerts/status", params={"email": email}, timeout=30).json()
    assert st.get("subscribed") is False


def test_unsubscribe_invalid_token():
    r = requests.post(f"{API}/vacancy-alerts/unsubscribe",
                      json={"token": "totally-invalid-token"}, timeout=30)
    assert r.status_code == 404


# ---------- Email log-mode confirmation for subscribe ----------
def test_subscribe_triggers_email_log():
    email = f"maillog-{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/vacancy-alerts/subscribe", json={
        "email": email, "categories": ["bank"], "qualifications": [], "keyword": None,
    }, timeout=30)
    assert r.status_code == 200
    time.sleep(1.0)
    found = False
    for p in ("/var/log/supervisor/backend.out.log", "/var/log/supervisor/backend.err.log"):
        try:
            with open(p, "r", errors="ignore") as f:
                if email in f.read():
                    found = True
                    break
        except FileNotFoundError:
            continue
    assert found, f"subscribe email log entry not found for {email}"
