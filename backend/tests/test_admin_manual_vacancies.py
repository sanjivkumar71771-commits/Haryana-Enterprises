"""Backend tests for Manual Vacancy CRUD (Phase-2 admin panel)."""
import os
import pytest
import requests
from pathlib import Path

def _load_env():
    envf = Path("/app/frontend/.env")
    if envf.exists():
        for ln in envf.read_text().splitlines():
            if ln.startswith("REACT_APP_BACKEND_URL="):
                return ln.split("=", 1)[1].strip()
    return os.environ.get("REACT_APP_BACKEND_URL", "")

BASE_URL = _load_env().rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@haryanaenterprises.com"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def created_ids():
    return []


class TestManualVacancyAuth:
    def test_post_no_auth_401(self):
        r = requests.post(f"{API}/admin/vacancies", json={"title": "x"})
        assert r.status_code in (401, 403)

    def test_get_no_auth_401(self):
        r = requests.get(f"{API}/admin/vacancies")
        assert r.status_code in (401, 403)

    def test_delete_no_auth_401(self):
        r = requests.delete(f"{API}/admin/vacancies/000000000000000000000000")
        assert r.status_code in (401, 403)


class TestManualVacancyCRUD:
    def test_create(self, admin_headers, created_ids):
        payload = {
            "title": "TEST_Manual QA Post",
            "organization": "HE Test",
            "category": "other",
            "application_mode": "offline",
            "state": "haryana",
            "last_date_text": "30 Nov 2026",
            "apply_url": "https://example.com",
            "description": "Line A\nLine B",
        }
        r = requests.post(f"{API}/admin/vacancies", json=payload, headers=admin_headers)
        assert r.status_code in (200, 201), r.text
        d = r.json()
        assert d.get("id")
        assert d["url"].startswith("internal://manual/")
        assert d["source"] == "manual"
        assert "<p>Line A</p><p>Line B</p>" in d["content_html"]
        assert d["last_date_text"] == "30 Nov 2026"
        created_ids.append(d["id"])

    def test_list_contains_and_sorted(self, admin_headers, created_ids):
        r = requests.get(f"{API}/admin/vacancies", headers=admin_headers)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        assert created_ids[0] in [x["id"] for x in rows]
        # sorted desc by created_at
        cas = [x.get("created_at") for x in rows if x.get("created_at")]
        assert cas == sorted(cas, reverse=True)

    def test_update(self, admin_headers, created_ids):
        vid = created_ids[0]
        # fetch existing url
        rlist = requests.get(f"{API}/admin/vacancies", headers=admin_headers).json()
        orig = next(x for x in rlist if x["id"] == vid)
        orig_url = orig["url"]

        r = requests.put(
            f"{API}/admin/vacancies/{vid}",
            json={"title": "TEST_Manual QA Post UPDATED", "state": "haryana", "category": "other"},
            headers=admin_headers,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["title"] == "TEST_Manual QA Post UPDATED"
        assert d["url"] == orig_url

    def test_guardrail_edit_scraped(self, admin_headers):
        # find a non-manual vacancy id
        r = requests.get(f"{API}/vacancies?limit=50")
        assert r.status_code == 200
        items = r.json().get("items") if isinstance(r.json(), dict) else r.json()
        scraped = None
        for v in items:
            if v.get("source") != "manual":
                scraped = v
                break
        if not scraped:
            pytest.skip("No scraped vacancy in DB to test guardrail")
        sid = scraped["id"]
        r = requests.put(
            f"{API}/admin/vacancies/{sid}",
            json={"title": "should not work"},
            headers=admin_headers,
        )
        assert r.status_code == 400
        assert "manual" in r.text.lower()

        r = requests.delete(f"{API}/admin/vacancies/{sid}", headers=admin_headers)
        assert r.status_code == 400
        assert "manual" in r.text.lower()

    def test_public_visibility(self, created_ids):
        vid = created_ids[0]
        r = requests.get(f"{API}/vacancies?state=haryana&limit=200")
        assert r.status_code == 200
        payload = r.json()
        items = payload.get("items") if isinstance(payload, dict) else payload
        ids = [x["id"] for x in items]
        assert vid in ids, f"Manual vacancy {vid} not in public feed"
        manual = next(x for x in items if x["id"] == vid)
        assert manual["source"] == "manual"

        # detail endpoint
        r = requests.get(f"{API}/vacancies/{vid}")
        assert r.status_code == 200
        d = r.json()
        assert d["source"] == "manual"
        assert d.get("detail_fetched_at")

    def test_scraper_refresh_preserves_manual(self, admin_headers, created_ids):
        vid = created_ids[0]
        r = requests.post(f"{API}/admin/vacancies/refresh", headers=admin_headers, timeout=180)
        # tolerate long-running; if timeout skip
        assert r.status_code in (200, 201), r.text
        r2 = requests.get(f"{API}/vacancies/{vid}")
        assert r2.status_code == 200
        assert r2.json()["source"] == "manual"

    def test_delete(self, admin_headers, created_ids):
        vid = created_ids[0]
        r = requests.delete(f"{API}/admin/vacancies/{vid}", headers=admin_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        assert body.get("id") == vid

        rlist = requests.get(f"{API}/admin/vacancies", headers=admin_headers).json()
        assert vid not in [x["id"] for x in rlist]

        rdet = requests.get(f"{API}/vacancies/{vid}")
        assert rdet.status_code == 404
