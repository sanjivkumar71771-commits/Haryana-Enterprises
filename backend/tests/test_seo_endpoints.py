"""Backend SEO endpoints tests: robots.txt, sitemap.xml, google verification file, static robots.txt."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://rooftop-solar-jobs.preview.emergentagent.com").rstrip("/")


class TestSEOEndpoints:
    def test_api_robots_txt(self):
        r = requests.get(f"{BASE_URL}/api/robots.txt", timeout=15)
        assert r.status_code == 200
        assert "text/plain" in r.headers.get("content-type", "").lower()
        assert "User-agent: *" in r.text
        assert "Sitemap:" in r.text

    def test_api_sitemap_xml(self):
        r = requests.get(f"{BASE_URL}/api/sitemap.xml", timeout=20)
        assert r.status_code == 200
        assert "application/xml" in r.headers.get("content-type", "").lower()
        assert "<?xml version" in r.text
        urls = re.findall(r"<url>", r.text)
        assert len(urls) >= 100, f"expected >=100 <url> entries, got {len(urls)}"
        assert "<loc>https://hrdigitalservices.in/</loc>" in r.text
        assert re.search(r"<loc>https://hrdigitalservices\.in/vacancies/[^<]+</loc>", r.text)

    def test_google_verification_file(self):
        r = requests.get(f"{BASE_URL}/googlefc5dc2adef5e4a7e.html", timeout=15)
        assert r.status_code == 200
        assert r.text.startswith("google-site-verification: googlefc5dc2adef5e4a7e.html")

    def test_static_robots_txt(self):
        r = requests.get(f"{BASE_URL}/robots.txt", timeout=15)
        assert r.status_code == 200

    def test_enquiry_post_valid(self):
        payload = {
            "full_name": "TEST_SEO",
            "mobile": "9999999999",
            "email": "test_seo@example.com",
            "service": "Solar Consultation",
            "message": "SEO regression"
        }
        r = requests.post(f"{BASE_URL}/api/enquiry", json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True
