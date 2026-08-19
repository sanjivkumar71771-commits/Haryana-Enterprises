"""CORS whitelist tests for backend API."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to local (should not happen in this env)
    BASE_URL = "http://localhost:8001"

ALLOWED = [
    "https://hrdigitalservices.in",
    "https://www.hrdigitalservices.in",
    "https://haryana-solar-app.emergent.host",
    "https://rooftop-solar-jobs.preview.emergentagent.com",
]
DISALLOWED = [
    "https://evil.example.com",
    "http://localhost:9999",
    "https://malicious.attacker.io",
]


@pytest.mark.parametrize("origin", ALLOWED)
def test_preflight_allowed_origin_vacancies(origin):
    r = requests.options(
        f"{BASE_URL}/api/vacancies",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
        timeout=15,
    )
    assert r.status_code in (200, 204), f"Preflight status {r.status_code} for {origin}"
    aco = r.headers.get("access-control-allow-origin")
    assert aco == origin, f"Expected ACAO={origin}, got {aco}"


@pytest.mark.parametrize("origin", DISALLOWED)
def test_preflight_disallowed_origin_vacancies(origin):
    r = requests.options(
        f"{BASE_URL}/api/vacancies",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
        timeout=15,
    )
    aco = r.headers.get("access-control-allow-origin")
    # Must NOT echo evil origin and must NOT be wildcard
    assert aco != origin, f"Evil origin {origin} was allowed!"
    assert aco != "*", "Wildcard ACAO returned - security regression"


def test_get_vacancies_no_origin():
    r = requests.get(f"{BASE_URL}/api/vacancies", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)


@pytest.mark.parametrize("origin", ALLOWED)
def test_get_vacancies_with_allowed_origin(origin):
    r = requests.get(
        f"{BASE_URL}/api/vacancies",
        headers={"Origin": origin},
        timeout=15,
    )
    assert r.status_code == 200
    aco = r.headers.get("access-control-allow-origin")
    assert aco == origin
    assert isinstance(r.json(), list)


def test_get_vacancies_stats_allowed_origin():
    origin = ALLOWED[0]
    r = requests.get(
        f"{BASE_URL}/api/vacancies/stats",
        headers={"Origin": origin},
        timeout=15,
    )
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == origin


def test_post_enquiry_allowed_origin():
    origin = ALLOWED[0]
    payload = {
        "full_name": "TEST_CORS User",
        "email": "test_cors@example.com",
        "mobile": "9999999999",
        "service": "Solar Rooftop",
        "message": "CORS regression test",
    }
    # Preflight
    pre = requests.options(
        f"{BASE_URL}/api/enquiry",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
        timeout=15,
    )
    assert pre.status_code in (200, 204)
    assert pre.headers.get("access-control-allow-origin") == origin

    # Actual POST
    r = requests.post(
        f"{BASE_URL}/api/enquiry",
        json=payload,
        headers={"Origin": origin, "Content-Type": "application/json"},
        timeout=15,
    )
    assert r.status_code in (200, 201), f"Enquiry POST failed: {r.status_code} {r.text}"
    assert r.headers.get("access-control-allow-origin") == origin


def test_disallowed_origin_get_does_not_get_acao():
    origin = "https://evil.example.com"
    r = requests.get(
        f"{BASE_URL}/api/vacancies",
        headers={"Origin": origin},
        timeout=15,
    )
    # Endpoint still returns data server-to-server, but CORS header must not echo evil origin
    aco = r.headers.get("access-control-allow-origin")
    assert aco != origin
    assert aco != "*"
