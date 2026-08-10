"""Backend tests for iteration 6:
- Enquiry validation (helpful error) & success
- Deprecated endpoints return 410
- Vacancies auto-update + application_mode filter data
"""
import os
import requests
import pytest

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ── Enquiry ────────────────────────────────────────────────
class TestEnquiry:
    def test_enquiry_success_irrigation(self, s):
        payload = {
            "full_name": "Test User",
            "mobile": "9876543210",
            "email": "test@example.com",
            "service": "Irrigation / Farm Consultation",
            "message": "Need info about drip irrigation for 2 acres",
        }
        r = s.post(f"{API}/enquiry", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True
        assert d.get("ref_no", "").startswith("ENQ-")
        assert len(d["ref_no"]) == 12  # ENQ- + 8 hex

    def test_enquiry_short_mobile_returns_422_with_field(self, s):
        r = s.post(f"{API}/enquiry", json={
            "full_name": "Test User",
            "mobile": "7",
            "email": "test@example.com",
            "service": "Solar Consultation",
            "message": "Hello, need info about solar",
        })
        assert r.status_code == 422, r.text
        d = r.json()
        # Detail must be an array of validation errors including 'mobile'
        assert isinstance(d.get("detail"), list)
        blob = str(d["detail"]).lower()
        assert "mobile" in blob
        assert "at least 7" in blob or "min_length" in blob or "string_too_short" in blob

    def test_enquiry_short_message_422(self, s):
        r = s.post(f"{API}/enquiry", json={
            "full_name": "Test User",
            "mobile": "9876543210",
            "email": "test@example.com",
            "service": "Solar Consultation",
            "message": "hi",
        })
        assert r.status_code == 422
        assert "message" in str(r.json()).lower()


# ── Deprecated endpoints ───────────────────────────────────
class TestDeprecated:
    @pytest.mark.parametrize("path", [
        "/solar/apply", "/loan/apply", "/csc/apply", "/irrigation/apply",
    ])
    def test_deprecated_410(self, s, path):
        r = s.post(f"{API}{path}", json={"foo": "bar"})
        assert r.status_code == 410, f"{path} returned {r.status_code}"


# ── Vacancies ──────────────────────────────────────────────
class TestVacancies:
    def test_stats_has_last_updated(self, s):
        r = s.get(f"{API}/vacancies/stats")
        assert r.status_code == 200
        d = r.json()
        assert d.get("total", 0) > 0
        assert d.get("last_updated")

    def test_list_returns_data(self, s):
        r = s.get(f"{API}/vacancies?limit=300")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) > 0
        # Ensure no MongoDB _id leaks
        for it in items[:5]:
            assert "_id" not in it
            assert "id" in it

    def test_offline_application_mode_present(self, s):
        r = s.get(f"{API}/vacancies?limit=300")
        items = r.json()
        offline = [i for i in items if (i.get("application_mode") or "").lower() == "offline"]
        online = [i for i in items if (i.get("application_mode") or "").lower() == "online"]
        assert len(offline) >= 1, f"No offline vacancies found. modes seen: {set((i.get('application_mode') or 'None') for i in items)}"
        # sanity: online may also exist
        print(f"offline={len(offline)}, online={len(online)}, total={len(items)}")
