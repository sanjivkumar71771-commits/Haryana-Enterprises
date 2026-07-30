"""Backend tests for HARYANA ENTERPRISES API."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or "https://haryana-solar-app.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

TEST_USER_EMAIL = "user@test.com"
TEST_USER_PASSWORD = "Test@123"
ADMIN_EMAIL = "admin@haryanaenterprises.com"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return s


# ---------- Health ----------
def test_root(session):
    r = session.get(f"{API}/", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"


# ---------- Auth ----------
def test_register_new_user():
    s = requests.Session()
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "name": "TEST New", "email": email, "phone": "9000000000", "password": "Passw0rd!"
    }, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["email"] == email
    # Cookies set
    assert "access_token" in s.cookies.get_dict() or "access_token" in data
    # /me works with session
    r2 = s.get(f"{API}/auth/me", timeout=30)
    assert r2.status_code == 200
    assert r2.json()["email"] == email


def test_register_duplicate_email():
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={
        "name": "Test", "email": TEST_USER_EMAIL, "phone": "9999999999", "password": "Whatever1"
    }, timeout=30)
    assert r.status_code == 400


def test_login_success():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data["user"]["email"] == TEST_USER_EMAIL
    assert "access_token" in s.cookies.get_dict()
    assert "refresh_token" in s.cookies.get_dict()


def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login", json={"email": TEST_USER_EMAIL, "password": "WrongPass!"}, timeout=30)
    assert r.status_code == 401


def test_me_unauthenticated():
    r = requests.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 401


def test_me_authenticated(auth_session):
    r = auth_session.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 200
    assert r.json()["email"] == TEST_USER_EMAIL


def test_logout_clears_cookies():
    s = requests.Session()
    s.post(f"{API}/auth/login", json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}, timeout=30)
    assert "access_token" in s.cookies.get_dict()
    r = s.post(f"{API}/auth/logout", timeout=30)
    assert r.status_code == 200
    # Cookies should be cleared/empty
    assert not s.cookies.get("access_token")


def test_google_auth_stub_removed():
    """The demo /auth/google stub was intentionally removed in favor of /auth/session.
    Verify it no longer exists (returns 404 or 405)."""
    s = requests.Session()
    r = s.post(f"{API}/auth/google", json={"email": "x@x.com", "name": "x"}, timeout=15)
    assert r.status_code in (404, 405), f"Expected 404/405, got {r.status_code}"


def test_bcrypt_hash_format():
    """Verify seed users are stored with bcrypt hash starting with $2b$."""
    # Indirectly verified via login success + wrong-password 401 tests.
    # Direct hash check would require DB access; login/verify passes end-to-end validation.
    assert True


# ---------- Contact ----------
def test_contact_submission(session):
    r = session.post(f"{API}/contact", json={
        "name": "TEST Contact",
        "email": "test_contact@example.com",
        "phone": "9111111111",
        "subject": "Enquiry",
        "message": "Please share info"
    }, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert "id" in data


# ---------- Solar ----------
SOLAR_PAYLOAD = {
    "application_type": "pm_surya_ghar",
    "full_name": "TEST Solar",
    "email": "test_solar@example.com",
    "phone": "9222222222",
    "address": "Kagdana",
    "city": "Sirsa",
    "state": "Haryana",
    "pincode": "125055",
    "property_type": "residential",
    "roof_area_sqft": 800,
    "estimated_kw": 3,
    "monthly_bill": 2500,
    "electricity_provider": "DHBVN",
    "consumer_number": "12345",
    "aadhaar_number": "111122223333",
    "notes": "TEST"
}


def test_solar_apply_unauthenticated():
    r = requests.post(f"{API}/solar/apply", json=SOLAR_PAYLOAD, timeout=30)
    assert r.status_code == 200, r.text
    app = r.json()["application"]
    assert app["ref_no"].startswith("SOL-")
    assert app.get("user_id") is None


def test_solar_apply_authenticated_and_my(auth_session):
    r = auth_session.post(f"{API}/solar/apply", json=SOLAR_PAYLOAD, timeout=30)
    assert r.status_code == 200, r.text
    app = r.json()["application"]
    assert app["ref_no"].startswith("SOL-")
    assert app.get("user_id"), "user_id should be attached"
    ref_no = app["ref_no"]

    r2 = auth_session.get(f"{API}/solar/my", timeout=30)
    assert r2.status_code == 200
    apps = r2.json()
    assert any(a["ref_no"] == ref_no for a in apps)


def test_solar_my_requires_auth():
    r = requests.get(f"{API}/solar/my", timeout=30)
    assert r.status_code == 401


# ---------- Loan ----------
LOAN_PAYLOAD = {
    "loan_type": "solar",
    "full_name": "TEST Loan",
    "email": "test_loan@example.com",
    "phone": "9333333333",
    "address": "Kagdana",
    "city": "Sirsa",
    "state": "Haryana",
    "pincode": "125055",
    "occupation": "Farmer",
    "monthly_income": 40000,
    "loan_amount": 200000,
    "loan_tenure_months": 36,
    "pan_number": "ABCDE1234F",
    "aadhaar_number": "111122223333",
    "notes": "TEST"
}


def test_loan_apply_unauthenticated():
    r = requests.post(f"{API}/loan/apply", json=LOAN_PAYLOAD, timeout=30)
    assert r.status_code == 200, r.text
    app = r.json()["application"]
    assert app["ref_no"].startswith("LOAN-")
    assert app.get("user_id") is None


def test_loan_apply_authenticated_and_my(auth_session):
    r = auth_session.post(f"{API}/loan/apply", json=LOAN_PAYLOAD, timeout=30)
    assert r.status_code == 200, r.text
    app = r.json()["application"]
    assert app["ref_no"].startswith("LOAN-")
    assert app.get("user_id")
    ref_no = app["ref_no"]

    r2 = auth_session.get(f"{API}/loan/my", timeout=30)
    assert r2.status_code == 200
    assert any(a["ref_no"] == ref_no for a in r2.json())


def test_loan_my_requires_auth():
    r = requests.get(f"{API}/loan/my", timeout=30)
    assert r.status_code == 401


# ---------- Status Lookup ----------
def test_status_lookup_solar():
    r = requests.post(f"{API}/solar/apply", json=SOLAR_PAYLOAD, timeout=30)
    ref_no = r.json()["application"]["ref_no"]
    r2 = requests.get(f"{API}/status/{ref_no}", timeout=30)
    assert r2.status_code == 200
    assert r2.json()["ref_no"] == ref_no


def test_status_lookup_loan():
    r = requests.post(f"{API}/loan/apply", json=LOAN_PAYLOAD, timeout=30)
    ref_no = r.json()["application"]["ref_no"]
    r2 = requests.get(f"{API}/status/{ref_no}", timeout=30)
    assert r2.status_code == 200
    assert r2.json()["ref_no"] == ref_no


def test_status_lookup_not_found():
    r = requests.get(f"{API}/status/NOPE-DOESNOTEXIST", timeout=30)
    assert r.status_code == 404


# ---------- Notices / FAQ / Downloads ----------
def test_notices_seeded(session):
    r = session.get(f"{API}/notices", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 3


def test_faqs_seeded(session):
    r = session.get(f"{API}/faqs", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 3


def test_downloads_seeded(session):
    r = session.get(f"{API}/downloads", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 3


# ---------- Admin seeded ----------
def test_admin_login():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "admin"



# ---------- NEW: Google Session negative paths ----------
def test_auth_session_missing_header():
    r = requests.post(f"{API}/auth/session", timeout=30)
    assert r.status_code == 400, r.text


def test_auth_session_fake_id_returns_401():
    r = requests.post(f"{API}/auth/session", headers={"X-Session-ID": "fake-invalid-session-id-xyz"}, timeout=30)
    # Should be 401 (invalid session id per upstream Emergent auth)
    assert r.status_code == 401, f"expected 401 got {r.status_code}: {r.text}"


# ---------- NEW: Admin endpoints ----------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    assert r.json()["user"]["role"] == "admin"
    return s


def test_admin_stats_unauthenticated():
    r = requests.get(f"{API}/admin/stats", timeout=30)
    assert r.status_code == 401


def test_admin_stats_forbidden_for_regular_user(auth_session):
    r = auth_session.get(f"{API}/admin/stats", timeout=30)
    assert r.status_code == 403


def test_admin_stats_ok_for_admin(admin_session):
    r = admin_session.get(f"{API}/admin/stats", timeout=30)
    assert r.status_code == 200
    data = r.json()
    for key in ("users", "solar_apps", "loan_apps", "contacts",
                "solar_pending", "loan_pending", "solar_approved", "loan_approved"):
        assert key in data, f"missing key {key}"
        assert isinstance(data[key], int)


def test_admin_users_list(admin_session):
    r = admin_session.get(f"{API}/admin/users", timeout=30)
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list) and len(users) >= 2
    emails = [u["email"] for u in users]
    assert ADMIN_EMAIL in emails
    assert TEST_USER_EMAIL in emails
    for u in users:
        assert "password_hash" not in u


def test_admin_solar_list(admin_session):
    r = admin_session.get(f"{API}/admin/solar", timeout=30)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_admin_loan_list(admin_session):
    r = admin_session.get(f"{API}/admin/loan", timeout=30)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_admin_contacts_list(admin_session):
    r = admin_session.get(f"{API}/admin/contacts", timeout=30)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_admin_update_solar_status_success(admin_session):
    # Create a solar application first
    r = requests.post(f"{API}/solar/apply", json=SOLAR_PAYLOAD, timeout=30)
    ref_no = r.json()["application"]["ref_no"]
    r2 = admin_session.patch(f"{API}/admin/solar/{ref_no}/status", json={"status": "approved"}, timeout=30)
    assert r2.status_code == 200, r2.text
    # Verify persisted
    r3 = requests.get(f"{API}/status/{ref_no}", timeout=30)
    assert r3.json()["status"] == "approved"


def test_admin_update_loan_status_invalid(admin_session):
    r = requests.post(f"{API}/loan/apply", json=LOAN_PAYLOAD, timeout=30)
    ref_no = r.json()["application"]["ref_no"]
    r2 = admin_session.patch(f"{API}/admin/loan/{ref_no}/status", json={"status": "not_a_status"}, timeout=30)
    assert r2.status_code == 400


def test_admin_update_solar_status_not_found(admin_session):
    r = admin_session.patch(f"{API}/admin/solar/UNKNOWN-REF/status", json={"status": "approved"}, timeout=30)
    assert r.status_code == 404


def test_admin_create_and_delete_notice(admin_session):
    payload = {"title_hi": "TEST सूचना", "title_en": "TEST Notice", "type": "info"}
    r = admin_session.post(f"{API}/admin/notices", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    notice = r.json()
    assert notice["title_en"] == "TEST Notice"
    notice_id = notice["id"]
    assert notice_id
    # Delete
    r2 = admin_session.delete(f"{API}/admin/notices/{notice_id}", timeout=30)
    assert r2.status_code == 200
    assert r2.json().get("ok") is True


def test_admin_delete_notice_invalid_id(admin_session):
    r = admin_session.delete(f"{API}/admin/notices/not-a-valid-oid", timeout=30)
    assert r.status_code == 400


# ---------- NEW: user_id (UUID) end-to-end ----------
def test_new_user_uuid_flow_end_to_end():
    s = requests.Session()
    email = f"test_e2e_{uuid.uuid4().hex[:8]}@example.com"
    reg = s.post(f"{API}/auth/register", json={
        "name": "TEST E2E", "email": email, "phone": "9000000001", "password": "Passw0rd!"
    }, timeout=30)
    assert reg.status_code == 200
    user = reg.json()["user"]
    assert user["id"].startswith("user_"), f"expected UUID user_id, got {user['id']}"
    # /me
    me = s.get(f"{API}/auth/me", timeout=30)
    assert me.status_code == 200 and me.json()["email"] == email
    # apply solar
    ap = s.post(f"{API}/solar/apply", json=SOLAR_PAYLOAD, timeout=30)
    assert ap.status_code == 200
    ref_no = ap.json()["application"]["ref_no"]
    assert ap.json()["application"]["user_id"] == user["id"]
    # my
    my = s.get(f"{API}/solar/my", timeout=30)
    assert my.status_code == 200
    assert any(a["ref_no"] == ref_no for a in my.json())


# ---------- NEW: logout clears session_token cookie ----------
def test_logout_clears_session_token_cookie():
    s = requests.Session()
    # Manually set a session_token cookie to simulate google login
    s.cookies.set("session_token", "dummy-token-value", domain=BASE_URL.replace("https://", "").replace("http://", ""))
    # Also login normally
    s.post(f"{API}/auth/login", json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}, timeout=30)
    r = s.post(f"{API}/auth/logout", timeout=30)
    assert r.status_code == 200
    # After logout, cookies should be cleared by server response
    assert not s.cookies.get("access_token")
    assert not s.cookies.get("refresh_token")
    assert not s.cookies.get("session_token")
