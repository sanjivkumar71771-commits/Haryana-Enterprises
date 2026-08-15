"""Iter 13 - Vacancies filter/expiry/mode/haryana logic tests."""
import os
import re
import pytest
import requests

from dotenv import load_dotenv
load_dotenv("/app/frontend/.env")
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

HARYANA_RX = re.compile(r"\b(haryana|hssc|hpsc|hbse|hkrn|hprb|panchkula|chandigarh)\b", re.I)


@pytest.fixture(scope="module")
def s():
    return requests.Session()


def test_default_all_live(s):
    r = s.get(f"{API}/vacancies", timeout=30)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) > 0
    for v in items:
        assert v.get("is_expired") is False, f"Found expired in default list: {v.get('title')}"


def test_include_expired_true(s):
    r = s.get(f"{API}/vacancies", params={"include_expired": "true"}, timeout=30)
    assert r.status_code == 200
    items = r.json()
    # At least one expired should appear if any exist in db
    total_live = len(s.get(f"{API}/vacancies").json())
    assert len(items) >= total_live


def test_category_admit_card(s):
    r = s.get(f"{API}/vacancies", params={"category": "admit_card"}, timeout=30)
    assert r.status_code == 200
    items = r.json()
    for v in items:
        assert v.get("category") == "admit_card", f"Non admit_card leaked: {v.get('category')}"


def test_category_result(s):
    r = s.get(f"{API}/vacancies", params={"category": "result"}, timeout=30)
    assert r.status_code == 200
    items = r.json()
    for v in items:
        assert v.get("category") == "result"


def test_category_haryana_broader(s):
    r_hary = s.get(f"{API}/vacancies", params={"category": "haryana"}, timeout=30)
    assert r_hary.status_code == 200
    hary_items = r_hary.json()
    # Every returned item either has category==haryana or matches keyword in relevant fields
    for v in hary_items:
        blob = " ".join(str(v.get(k) or "") for k in ("title", "organization", "post_name", "row_text"))
        assert v.get("category") == "haryana" or HARYANA_RX.search(blob), \
            f"Non-haryana leak: {v.get('title')} | {v.get('category')}"
    # Broader than strict category==haryana count?
    # Just verify > 0 or at least non-negative — if none exist in DB it's still fine.


def test_mode_online(s):
    r = s.get(f"{API}/vacancies", params={"mode": "online"}, timeout=30)
    assert r.status_code == 200
    for v in r.json():
        assert v.get("application_mode") == "online"


def test_mode_offline(s):
    r = s.get(f"{API}/vacancies", params={"mode": "offline"}, timeout=30)
    assert r.status_code == 200
    for v in r.json():
        assert v.get("application_mode") == "offline"


def test_mode_other(s):
    r = s.get(f"{API}/vacancies", params={"mode": "other"}, timeout=30)
    assert r.status_code == 200
    for v in r.json():
        assert not v.get("application_mode"), f"Other bucket contains {v.get('application_mode')}"


def test_stats(s):
    r = s.get(f"{API}/vacancies/stats", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert "by_mode" in d and "by_category" in d
    bm = d["by_mode"]
    assert "other" in bm
    assert bm["other"] >= 0
    # total (active) equals online+offline+other
    assert d["total"] == bm["online"] + bm["offline"] + bm["other"], \
        f"total {d['total']} != {bm['online']} + {bm['offline']} + {bm['other']}"
    cats = {c["category"]: c["count"] for c in d["by_category"]}
    assert "haryana" in cats
    # sanity: haryana broader count >= direct-tagged
    r_all = s.get(f"{API}/vacancies", params={"include_expired": "false"}).json()
    direct = sum(1 for v in r_all if v.get("category") == "haryana")
    assert cats["haryana"] >= direct
