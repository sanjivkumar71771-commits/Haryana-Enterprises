"""Tests for the 3 code-review MEDIUM fixes + 1 LOW fix.

Fix #1: Negative cache on vacancy detail scrape failure
Fix #2: HTML sanitization in _clean_article_html
Fix #3: Non-blocking send_email_async
Fix #4: Admin password no longer overwritten on startup
"""
import os
import time
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "haryana_enterprises")
_mc = MongoClient(MONGO_URL)
_db = _mc[DB_NAME]


# ─────────── Fix #2: HTML Sanitization (direct unit test) ───────────
def test_clean_article_html_strips_event_handlers_and_bad_hrefs():
    from bs4 import BeautifulSoup
    from backend.scrapers import _clean_article_html

    malicious = """
    <div class="entry-content">
      <p>Legit content here about a job.</p>
      <a href="javascript:alert(1)">js-link</a>
      <a href="data:text/html,<script>alert(1)</script>">data-link</a>
      <a href="vbscript:msgbox(1)">vb-link</a>
      <a href="file:///etc/passwd">file-link</a>
      <a href="https://example.com/apply" onclick="alert(2)">Apply Now</a>
      <img src="javascript:alert(3)" />
      <img src="https://example.com/x.png" onerror="alert(4)" />
      <div onclick="evil()">Hover me</div>
      <a href="mailto:hr@example.com">Email HR</a>
      <a href="tel:+911234567890">Call</a>
    </div>
    """
    soup = BeautifulSoup(malicious, "html.parser")
    article = soup.select_one(".entry-content")
    out = _clean_article_html(article).lower()

    # Bad schemes must be removed entirely
    assert "javascript:" not in out, f"javascript: leaked: {out}"
    assert "vbscript:" not in out
    assert "file:///" not in out
    # data: URI must be gone
    assert "data:text/html" not in out
    # Inline event handlers must all be gone
    assert "onclick" not in out
    assert "onerror" not in out
    assert "onload" not in out
    # Safe schemes preserved
    assert "mailto:hr@example.com" in out
    assert "tel:+911234567890" in out
    assert "https://example.com/apply" in out


# ─────────── Fix #3: Non-blocking subscribe (returns quickly) ───────────
def test_subscribe_returns_quickly_even_with_bad_smtp():
    """Subscribe should return in <2s in DEV mode (no SMTP configured — logs only)."""
    email = f"perf-{uuid.uuid4().hex[:8]}@example.com"
    t0 = time.time()
    r = requests.post(f"{API}/vacancy-alerts/subscribe", json={
        "email": email, "categories": ["bank"], "qualifications": [], "keyword": None,
    }, timeout=10)
    elapsed = time.time() - t0
    assert r.status_code == 200, r.text
    assert elapsed < 2.0, f"subscribe should return quickly (dev mode), took {elapsed:.2f}s"


def test_send_email_async_exists():
    from backend.emails import send_email_async
    import inspect
    assert inspect.iscoroutinefunction(send_email_async)


# ─────────── Fix #4: Admin password not overwritten ───────────
def test_admin_password_not_overwritten_on_startup():
    """Simulate an admin changing their password via DB, verify backend does NOT revert it.

    Since we cannot restart the backend from here, we instead verify the seed code path:
    it only creates the admin if missing and never $sets password_hash on existing admin.
    Cross-check: the login endpoint still accepts Admin@123 (as seeded).
    """
    r = requests.post(f"{API}/auth/login",
                      json={"email": "admin@haryanaenterprises.com", "password": "Admin@123"},
                      timeout=15)
    assert r.status_code == 200

    # Read seed logic and assert it does NOT force-update password_hash
    with open("/app/backend/server.py", "r") as f:
        code = f.read()
    # After "else:" branch of admin seed, the code must not $set password_hash
    # Isolate seed block
    idx = code.find('Seeded admin')
    # Look at the ~40 lines after admin seed
    snippet = code[idx: idx + 1500] if idx > 0 else ""
    assert "password_hash" not in snippet, "seed_admin still overwrites password_hash on existing admin!"


def test_admin_password_change_persists_across_reads():
    """Directly update admin password_hash, login with new password, then restore.
    This proves the password stored in DB is what auth uses (no override on request path).
    """
    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

    admin_email = "admin@haryanaenterprises.com"
    original_hash_doc = _db.users.find_one({"email": admin_email})
    assert original_hash_doc, "admin user missing"
    original_hash = original_hash_doc["password_hash"]

    new_password = "TempTest@999"
    new_hash = pwd.hash(new_password)
    try:
        _db.users.update_one({"email": admin_email}, {"$set": {"password_hash": new_hash}})
        # Should login with new password now
        r = requests.post(f"{API}/auth/login",
                          json={"email": admin_email, "password": new_password}, timeout=15)
        assert r.status_code == 200, f"expected login with new pw to succeed: {r.text}"
        # Old password should not work
        r2 = requests.post(f"{API}/auth/login",
                           json={"email": admin_email, "password": "Admin@123"}, timeout=15)
        assert r2.status_code == 401, "old pw must not work after DB update"
    finally:
        # Restore original hash so future tests keep working
        _db.users.update_one({"email": admin_email}, {"$set": {"password_hash": original_hash}})
        # Verify restoration worked
        r3 = requests.post(f"{API}/auth/login",
                           json={"email": admin_email, "password": "Admin@123"}, timeout=15)
        assert r3.status_code == 200, "restoration failed — Admin@123 no longer works!"


# ─────────── Fix #1: Negative cache on failed detail scrape ───────────
def test_vacancy_detail_negative_cache_on_failed_scrape():
    """Seed a vacancy with an unreachable URL, hit detail twice, ensure 2nd call is fast (<3s)
    because the first call sets detail_attempted_at and enforces 1h negative cache."""
    # Insert a stub vacancy with a bad URL (unreachable / will fail)
    from bson import ObjectId
    from datetime import datetime, timezone
    vid = ObjectId()
    _db.vacancies.insert_one({
        "_id": vid,
        "title": "TEST negative cache",
        "url": "http://127.0.0.1:1/definitely-unreachable-path",
        "organization": "TEST",
        "post_name": "TEST",
        "category": "other",
        "qualification": "",
        "fetched_at": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc),
    })
    try:
        # 1st call: scrape will fail (connection refused to port 1), sets detail_attempted_at
        t0 = time.time()
        r1 = requests.get(f"{API}/vacancies/{str(vid)}", timeout=60)
        elapsed1 = time.time() - t0
        assert r1.status_code == 200

        # Verify detail_attempted_at was persisted
        doc = _db.vacancies.find_one({"_id": vid})
        assert doc.get("detail_attempted_at") is not None, \
            "detail_attempted_at must be set on scrape failure"

        # 2nd call within 1h: MUST NOT re-scrape → should return fast
        t1 = time.time()
        r2 = requests.get(f"{API}/vacancies/{str(vid)}", timeout=15)
        elapsed2 = time.time() - t1
        assert r2.status_code == 200
        assert elapsed2 < 3.0, f"2nd call should hit negative cache (<3s), took {elapsed2:.2f}s (1st was {elapsed1:.2f}s)"
    finally:
        _db.vacancies.delete_one({"_id": vid})
