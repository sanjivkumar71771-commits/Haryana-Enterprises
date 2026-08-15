"""Compliance rebrand tests: enquiry endpoint, notices/faqs content."""
import os
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "https://rooftop-solar-jobs.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- /api/enquiry ----------
class TestEnquiry:
    def test_valid_submission_returns_ref_no(self, s):
        payload = {
            "full_name": "TEST Rebrand User",
            "mobile": "9876543210",
            "email": "TEST_rebrand@example.com",
            "service": "Solar Consultation",
            "message": "Please share details about 3 kW rooftop solar system.",
        }
        r = s.post(f"{BASE_URL}/api/enquiry", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert "id" in data and isinstance(data["id"], str) and len(data["id"]) > 0
        assert "ref_no" in data
        assert data["ref_no"].startswith("ENQ-")
        assert len(data["ref_no"]) == 12  # ENQ- + 8 hex chars

    def test_missing_email_returns_422(self, s):
        payload = {
            "full_name": "TEST NoEmail",
            "mobile": "9876543210",
            "service": "Solar Consultation",
            "message": "Missing email field",
        }
        r = s.post(f"{BASE_URL}/api/enquiry", json=payload)
        assert r.status_code == 422

    def test_invalid_email_returns_422(self, s):
        payload = {
            "full_name": "TEST",
            "mobile": "9876543210",
            "email": "not-an-email",
            "service": "Solar Consultation",
            "message": "Bad email test",
        }
        r = s.post(f"{BASE_URL}/api/enquiry", json=payload)
        assert r.status_code == 422

    def test_short_message_returns_422(self, s):
        payload = {
            "full_name": "TEST",
            "mobile": "9876543210",
            "email": "TEST_short@example.com",
            "service": "Solar Consultation",
            "message": "hi",
        }
        r = s.post(f"{BASE_URL}/api/enquiry", json=payload)
        assert r.status_code == 422


# ---------- /api/notices compliance ----------
class TestNoticesCompliance:
    def test_notices_no_forbidden_claims(self, s):
        r = s.get(f"{BASE_URL}/api/notices")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        combined = " ".join(
            (n.get("title_en", "") + " " + n.get("title_hi", "")).lower() for n in data
        )
        # Forbidden compliance claims
        for phrase in ["applications open", "40% subsidy", "up to 40", "interest rate", "guaranteed"]:
            assert phrase not in combined, f"Forbidden phrase '{phrase}' found in notices"


# ---------- /api/faqs compliance ----------
class TestFAQsCompliance:
    def test_faqs_contain_private_business_disclaimer(self, s):
        r = s.get(f"{BASE_URL}/api/faqs")
        assert r.status_code == 200
        faqs = r.json()
        assert isinstance(faqs, list) and len(faqs) > 0
        blob = " ".join(
            (f.get("q_en", "") + " " + f.get("a_en", "")).lower() for f in faqs
        )
        assert "private business" in blob or "not a government portal" in blob

    def test_faqs_contain_no_loan_guarantee(self, s):
        r = s.get(f"{BASE_URL}/api/faqs")
        faqs = r.json()
        blob = " ".join((f.get("a_en", "")).lower() for f in faqs)
        # Assert we DO NOT guarantee loan approval
        assert "do not guarantee" in blob or "not guarantee" in blob or "subject to" in blob

    def test_faqs_never_ask_aadhaar_pan(self, s):
        r = s.get(f"{BASE_URL}/api/faqs")
        faqs = r.json()
        blob = " ".join((f.get("a_en", "")).lower() for f in faqs)
        assert "aadhaar" in blob and "pan" in blob
        assert "never ask" in blob or "do not ask" in blob
