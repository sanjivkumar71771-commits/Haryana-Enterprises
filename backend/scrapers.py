"""FreeJobAlert.com scraper — fetches latest vacancy notifications.

Table structure on freejobalert.com "latest-notifications" & "upcoming-sarkari-naukri":
  td0: Post Date
  td1: Organization (e.g., PNB, UPSC, SSC)
  td2: Post Name / vacancy count (e.g., "Local Bank Officer – 545 Posts")
  td3: Qualification
  td4: Advt No
  td5: Last Date
  td6: "Get Details" anchor -> article URL

We combine td1 + td2 into a meaningful title and use td6's href as the URL.
"""
import logging
import re
from datetime import datetime, timezone
from typing import List, Dict
import httpx
from bs4 import BeautifulSoup

log = logging.getLogger("scraper")

SOURCES = [
    ("latest", "https://www.freejobalert.com/latest-notifications/"),
    ("sarkari", "https://www.freejobalert.com/sarkari-naukri/"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}

# Text that is NOT a valid job title (buttons/labels)
JUNK_TITLES = {"get details", "click here", "apply online", "apply", "details",
               "notification", "read more", "view more", "more", "view details"}


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _cat_from_title(title: str) -> str:
    t = title.lower()
    if any(k in t for k in ["ssc", "cgl", "chsl", "mts"]): return "ssc"
    if any(k in t for k in ["railway", "rrb", "ntpc"]): return "railway"
    if any(k in t for k in ["bank", "ibps", "sbi", "pnb", "iob", "nabfins", "rbi"]): return "bank"
    if any(k in t for k in ["police", "constable"]): return "police"
    if any(k in t for k in ["upsc", "ias", "ips"]): return "upsc"
    if any(k in t for k in ["army", "navy", "air force", "airforce", "defence", "bsf", "crpf", "cisf"]): return "defence"
    if any(k in t for k in ["teacher", "tet", "ctet", "htet", "professor", "kvs", "nvs"]): return "teaching"
    if any(k in t for k in ["haryana", "hssc", "hpsc"]): return "haryana"
    if any(k in t for k in ["engineer", "psu", "ongc", "iocl", "hpcl", "gail", "bhel", "ntpc"]): return "psu"
    if any(k in t for k in ["nurse", "doctor", "medical", "aiims", "esic", "hospital"]): return "medical"
    return "other"


def _parse_row(cells) -> Dict | None:
    """Parse a single <tr> whose cells match freejobalert's 7-column layout."""
    if len(cells) < 6:
        return None

    texts = [_clean(c.get_text(" ", strip=True)) for c in cells]

    # Find the "Get Details" anchor (usually last cell). Fallback to any anchor in the row.
    href = None
    for c in reversed(cells):
        a = c.find("a", href=True)
        if a and a["href"].startswith("http"):
            href = a["href"]
            break
    if not href:
        return None

    # Heuristic mapping for the 7-column freejobalert table.
    # texts[0] = post date, [1] = org, [2] = post name, [3] = qualification, [5] = last date
    post_date = texts[0] if len(texts) > 0 else ""
    org = texts[1] if len(texts) > 1 else ""
    post_name = texts[2] if len(texts) > 2 else ""
    qualification = texts[3] if len(texts) > 3 else ""
    last_date_text = texts[5] if len(texts) > 5 else ""

    # Guard: sometimes a row has fewer cells (headers etc.)
    if not org and not post_name:
        return None

    if org.lower() in JUNK_TITLES:
        org = ""
    if post_name.lower() in JUNK_TITLES:
        post_name = ""

    # Build title
    if org and post_name:
        title = f"{org} — {post_name}"
    else:
        title = org or post_name

    if not title or title.lower() in JUNK_TITLES or len(title) < 3:
        return None

    return {
        "title": title[:250],
        "url": href,
        "organization": org[:120],
        "post_name": post_name[:200],
        "qualification": qualification[:200],
        "post_date_text": post_date[:40],
        "last_date_text": last_date_text[:40] or None,
        "category": _cat_from_title(title),
        "row_text": " | ".join([t for t in texts if t])[:500],
    }


async def fetch_freejobalert() -> List[Dict]:
    results: List[Dict] = []
    now = datetime.now(timezone.utc)
    async with httpx.AsyncClient(headers=HEADERS, timeout=25.0, follow_redirects=True) as http:
        for src_type, url in SOURCES:
            try:
                r = await http.get(url)
                if r.status_code != 200:
                    log.warning(f"FreeJobAlert {src_type}: HTTP {r.status_code}")
                    continue
                soup = BeautifulSoup(r.text, "html.parser")
                for table in soup.find_all("table"):
                    for row in table.find_all("tr"):
                        cells = row.find_all("td")
                        if len(cells) < 6:
                            continue
                        parsed = _parse_row(cells)
                        if not parsed:
                            continue
                        parsed.update({
                            "source": "freejobalert",
                            "source_type": src_type,
                            "fetched_at": now,
                        })
                        results.append(parsed)
            except Exception as e:
                log.error(f"FreeJobAlert {src_type} error: {e}")

    # De-dupe by URL (keep first occurrence — "latest" is scraped before "upcoming")
    seen, out = set(), []
    for v in results:
        if v["url"] in seen:
            continue
        seen.add(v["url"])
        out.append(v)
    return out[:250]


async def refresh_vacancies_into_db(db) -> int:
    vacs = await fetch_freejobalert()
    if not vacs:
        return 0
    added = 0
    for v in vacs:
        try:
            res = await db.vacancies.update_one(
                {"url": v["url"]},
                {"$set": v, "$setOnInsert": {"created_at": datetime.now(timezone.utc)}},
                upsert=True,
            )
            if res.upserted_id:
                added += 1
        except Exception as e:
            log.warning(f"upsert vacancy failed: {e}")
    log.info(f"Vacancies refresh: total={len(vacs)}, new={added}")
    return added


# ─────────── Article Detail Scraper ───────────
UNWANTED_TEXT_MARKERS = (
    "register for job alerts", "download mobile app", "join now", "join our telegram",
    "follow us on", "subscribe", "also read", "related jobs", "you may also like",
)


def _is_junk_link(text: str, href: str) -> bool:
    t = (text or "").strip().lower()
    h = (href or "").lower()
    if not h:
        return True
    if "freejobalert.com/register" in h or "user.freejobalert.com" in h:
        return True
    if "t.me/" in h or "telegram" in h:
        return True
    if "whatsapp" in h or "facebook.com" in h or "twitter.com" in h or "instagram" in h:
        return True
    if t in ("join now", "subscribe", "register", "follow us", "download app"):
        return True
    return False


def _extract_important_links(article) -> list[dict]:
    """Pull out the key action links (Apply Online, Notification PDF, Official Website)."""
    picked = []
    seen = set()
    for a in article.find_all("a", href=True):
        text = _clean(a.get_text(" ", strip=True))
        href = a["href"]
        if _is_junk_link(text, href):
            continue
        # Prefer PDFs, apply links, official portals; skip internal freejobalert article links
        low_text = text.lower()
        low_href = href.lower()
        if "freejobalert.com/articles" in low_href:
            continue
        if "freejobalert.com" in low_href and not low_href.endswith(".pdf"):
            continue
        kind = None
        if low_href.endswith(".pdf") or "notification" in low_text or "advertisement" in low_text:
            kind = "notification"
        elif "apply" in low_text or "apply" in low_href or "registration" in low_text:
            kind = "apply"
        elif "official" in low_text or "website" in low_text:
            kind = "official"
        if not kind:
            continue
        key = (kind, href)
        if key in seen:
            continue
        seen.add(key)
        picked.append({"kind": kind, "text": text[:120] or kind.title(), "href": href})
    # Order: apply > notification > official
    order = {"apply": 0, "notification": 1, "official": 2}
    picked.sort(key=lambda x: order.get(x["kind"], 9))
    return picked[:12]


def _clean_article_html(article) -> str:
    """Strip ads, self-promo, inline event handlers, javascript: hrefs and internal freejobalert nav."""
    # Remove obviously unwanted tags
    for tag in article.find_all(["script", "style", "iframe", "noscript", "form", "button", "object", "embed", "svg"]):
        tag.decompose()
    # Remove ad / share / related containers by class hints
    for el in article.find_all(True):
        cls = " ".join(el.get("class") or []).lower()
        idv = (el.get("id") or "").lower()
        if any(x in cls or x in idv for x in
               ["ads", "adsbygoogle", "share", "related", "newsletter", "telegram",
                "subscribe", "author", "post-tags", "sidebar", "sociable", "yarpp"]):
            el.decompose()
    # Remove paragraphs with self-promo copy
    for p in article.find_all(["p", "div"]):
        txt = p.get_text(" ", strip=True).lower()
        if any(m in txt for m in UNWANTED_TEXT_MARKERS) and len(txt) < 400:
            p.decompose()
    # Strip inline event handler attrs (onclick, onerror, onload, etc.) on ALL elements
    for el in article.find_all(True):
        for attr in list(el.attrs.keys()):
            if attr.lower().startswith("on"):
                del el.attrs[attr]
    # Strip freejobalert internal links (unwrap anchor, keep text)
    for a in article.find_all("a", href=True):
        href = (a.get("href") or "").strip()
        low_href = href.lower()
        # Block javascript:, data:, vbscript: URIs — potential XSS vectors
        if low_href.startswith(("javascript:", "data:", "vbscript:", "file:")):
            a.decompose()
            continue
        if _is_junk_link(a.get_text(strip=True), href):
            a.decompose()
            continue
        if "freejobalert.com" in low_href and not low_href.endswith(".pdf"):
            a.unwrap()
            continue
        # Only allow http(s) hrefs — anything else is suspicious
        if not low_href.startswith(("http://", "https://", "mailto:", "tel:")):
            a.unwrap()
            continue
        # Open remaining external links in new tab
        a["target"] = "_blank"
        a["rel"] = "noreferrer noopener nofollow"
        a["class"] = (a.get("class") or []) + ["ext-link"]
    # Strip javascript: from image src too
    for img in article.find_all("img", src=True):
        src = (img.get("src") or "").strip().lower()
        if src.startswith(("javascript:", "data:", "vbscript:")):
            img.decompose()
    # Remove empty tags left behind
    for el in article.find_all(True):
        if not el.get_text(strip=True) and not el.find("img"):
            el.decompose()
    return str(article)


async def fetch_article_detail(url: str) -> Dict | None:
    """Scrape the freejobalert article page and return cleaned content."""
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=25.0, follow_redirects=True) as http:
            r = await http.get(url)
            if r.status_code != 200:
                log.warning(f"article {url} -> HTTP {r.status_code}")
                return None
            soup = BeautifulSoup(r.text, "html.parser")
            article = (soup.select_one(".entry-content") or
                       soup.select_one("article") or
                       soup.select_one(".post-content"))
            if not article:
                return None
            heading_el = soup.find("h1")
            heading = _clean(heading_el.get_text()) if heading_el else ""
            # Grab description (first 2-3 paragraphs of raw text)
            paragraphs = [_clean(p.get_text(" ", strip=True)) for p in article.find_all("p")]
            paragraphs = [p for p in paragraphs
                          if p and len(p) > 40 and
                          not any(m in p.lower() for m in UNWANTED_TEXT_MARKERS)]
            description = " ".join(paragraphs[:3])[:1200]
            important_links = _extract_important_links(article)
            structured = _extract_structured_facts(article)
            content_html = _clean_article_html(article)
            return {
                "heading": heading[:250],
                "description": description,
                "important_links": important_links,
                "structured": structured,
                "content_html": content_html[:60000],
                "detail_fetched_at": datetime.now(timezone.utc),
            }
    except Exception as e:
        log.error(f"article scrape error {url}: {e}")
        return None


# ─────────── Structured Fact Extraction ───────────
FACT_LABELS = {
    "total_posts": [
        r"total\s+vacancies?", r"total\s+posts?", r"no\.?\s*of\s+vacancies?",
        r"no\.?\s*of\s+posts?", r"number\s+of\s+posts?", r"vacancy\s+details?",
    ],
    "apply_start": [
        r"(?:registration|application|apply(?:ing)?)\s+(?:opening|start(?:ing)?|commencement)\s+date",
        r"opening\s+date\s+for\s+online\s+registration",
        r"starting\s+date",
    ],
    "apply_end": [
        r"(?:registration|application|apply(?:ing)?)\s+(?:closing|last|end(?:ing)?)\s+date",
        r"closing\s+date\s+for\s+online\s+registration",
        r"last\s+date\s+(?:to\s+apply|of\s+application|for\s+apply(?:ing)?)",
        r"last\s+date",
    ],
    "salary": [
        r"pay\s+scale", r"salary(?:\s+and\s+perquisites)?", r"pay\s+level",
        r"monthly\s+salary", r"remuneration", r"basic\s+pay",
    ],
    "age_limit": [
        r"age\s+limit", r"age\s+criteria", r"age\s+eligibility",
        r"minimum\s+and\s+maximum\s+age",
    ],
    "selection": [
        r"selection\s+process", r"mode\s+of\s+selection", r"selection\s+procedure",
    ],
    "job_location": [
        r"job\s+location", r"place\s+of\s+posting", r"work\s+location",
    ],
}


def _find_value_after(lines: list[str], idx: int, prefer_numeric: bool = False, max_len: int = 200) -> str | None:
    """Return the first non-empty short line after idx that looks like a value.

    If prefer_numeric is True, prefer lines that contain digits/currency markers
    (falls back to first non-empty if none found in window).
    """
    window = []
    for j in range(idx + 1, min(idx + 6, len(lines))):
        cand = lines[j].strip()
        if not cand:
            continue
        window.append(cand)
    if not window:
        return None
    if prefer_numeric:
        for cand in window:
            if re.search(r"\d", cand) or "₹" in cand or "rs" in cand.lower():
                return cand[:max_len]
    return window[0][:max_len]


def _extract_structured_facts(article) -> dict:
    """Pull key labelled facts (total_posts, dates, fee, salary, age)."""
    text = article.get_text("\n", strip=True)
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    out: dict = {}

    NUMERIC_FIELDS = {"total_posts", "apply_start", "apply_end", "salary", "age_limit"}

    for key, patterns in FACT_LABELS.items():
        for i, line in enumerate(lines):
            low = line.lower()
            if len(low) > 80:
                continue
            if any(re.search(p, low) for p in patterns):
                val = _find_value_after(lines, i, prefer_numeric=key in NUMERIC_FIELDS)
                if val and val.lower() != line.lower():
                    out[key] = val[:200]
                    break

    # Total posts numeric extraction
    if "total_posts" in out:
        m = re.search(r"(\d[\d,]*)", out["total_posts"])
        if m:
            out["total_posts_num"] = int(m.group(1).replace(",", ""))

    # Application fee — grab up to 6 lines after the "Application Fee" heading and pick fee amounts
    fee_lines = []
    fee_hits = 0
    capture = False
    for line in lines:
        low = line.lower()
        if not capture and re.search(r"application\s+fee|examination\s+fee|fee\s+details?", low) and len(low) < 80:
            capture = True
            continue
        if capture:
            # stop at next section heading
            if fee_hits > 10 or re.search(r"(selection\s+process|age\s+limit|educational\s+qualification|how\s+to\s+apply|important\s+dates|salary)", low):
                break
            # Skip pure column labels
            if low in ("category", "fee amount", "fee amount (per candidate)", "amount", "gender"):
                fee_hits += 1
                continue
            # Take reasonably short informative lines
            if len(line) < 120 and (
                "rs" in low or "₹" in line or "/-" in line or "no fee" in low or "nil" in low or
                re.search(r"\b(general|obc|sc|st|ews|female|male|pwd|physical)\b", low)
            ):
                fee_lines.append(line)
            fee_hits += 1
    if fee_lines:
        out["application_fee"] = " · ".join(fee_lines[:6])[:400]

    return out
