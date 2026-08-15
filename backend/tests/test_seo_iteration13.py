"""SEO iteration 13 tests: sitemap at site root, robots.txt update, legacy endpoints."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


class TestSitemapRoot:
    def test_root_sitemap_index(self):
        r = requests.get(f"{BASE_URL}/sitemap.xml", timeout=15)
        assert r.status_code == 200
        ct = r.headers.get("content-type", "").lower()
        assert "xml" in ct, f"content-type={ct}"
        body = r.text
        assert "<sitemapindex" in body
        assert "/sitemap-pages.xml" in body
        assert "/api/sitemap-vacancies.xml" in body

    def test_root_sitemap_pages(self):
        r = requests.get(f"{BASE_URL}/sitemap-pages.xml", timeout=15)
        assert r.status_code == 200
        body = r.text
        assert "<urlset" in body
        for path in ["/", "/services", "/vacancies", "/enquiry", "/about", "/contact", "/faq", "/notices", "/downloads"]:
            # ensure loc exists with that path suffix
            assert f"hrdigitalservices.in{path}<" in body or f"hrdigitalservices.in{path}\n" in body or f"hrdigitalservices.in{path} " in body or f">{'https://hrdigitalservices.in' + path}<" in body, f"missing {path}"
        # count urls
        assert body.count("<url>") == 9

    def test_sitemap_vacancies_dynamic(self):
        r = requests.get(f"{BASE_URL}/api/sitemap-vacancies.xml", timeout=30)
        assert r.status_code == 200
        body = r.text
        assert "<urlset" in body
        count = body.count("<url>")
        assert count >= 100, f"only {count} vacancy urls"
        assert "/vacancies/" in body

    def test_root_robots(self):
        r = requests.get(f"{BASE_URL}/robots.txt", timeout=15)
        assert r.status_code == 200
        assert "Sitemap: https://hrdigitalservices.in/sitemap.xml" in r.text

    def test_google_verification_file(self):
        r = requests.get(f"{BASE_URL}/googlefc5dc2adef5e4a7e.html", timeout=15)
        assert r.status_code == 200


class TestLegacyEndpoints:
    def test_legacy_sitemap(self):
        r = requests.get(f"{BASE_URL}/api/sitemap.xml", timeout=15)
        assert r.status_code == 200
        assert "xml" in r.headers.get("content-type", "").lower()

    def test_legacy_robots(self):
        r = requests.get(f"{BASE_URL}/api/robots.txt", timeout=15)
        assert r.status_code == 200
        assert "Sitemap:" in r.text


class TestEnquiryRegression:
    def test_enquiry_post(self):
        payload = {
            "full_name": "TEST_seo13",
            "email": "test_seo13@example.com",
            "mobile": "9999999999",
            "service": "solar",
            "message": "regression test",
        }
        r = requests.post(f"{BASE_URL}/api/enquiry", json=payload, timeout=15)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        assert data.get("ok") is True
        assert str(data.get("ref_no", "")).startswith("ENQ-")
