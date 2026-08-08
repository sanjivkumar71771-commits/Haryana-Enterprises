"""FreeJobAlert.com scraper — fetches latest vacancy notifications."""
import logging
import re
from datetime import datetime, timezone
from typing import List, Dict
import httpx
from bs4 import BeautifulSoup

log = logging.getLogger("scraper")

SOURCES = [
    ("latest", "https://www.freejobalert.com/latest-notifications/"),
    ("upcoming", "https://www.freejobalert.com/upcoming-sarkari-naukri/"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}


def _cat_from_title(title: str) -> str:
    t = title.lower()
    if any(k in t for k in ["ssc", "cgl", "chsl", "mts"]): return "ssc"
    if any(k in t for k in ["railway", "rrb", "ntpc"]): return "railway"
    if any(k in t for k in ["bank", "ibps", "sbi"]): return "bank"
    if any(k in t for k in ["police", "constable"]): return "police"
    if any(k in t for k in ["upsc"]): return "upsc"
    if any(k in t for k in ["army", "navy", "air force", "airforce"]): return "defence"
    if any(k in t for k in ["teacher", "tet", "ctet", "htet", "professor"]): return "teaching"
    if any(k in t for k in ["haryana", "hssc", "hpsc"]): return "haryana"
    if any(k in t for k in ["engineer", "psu", "ongc", "iocl", "hpcl", "gail"]): return "psu"
    return "other"


async def fetch_freejobalert() -> List[Dict]:
    results = []
    async with httpx.AsyncClient(headers=HEADERS, timeout=25.0, follow_redirects=True) as http:
        for src_type, url in SOURCES:
            try:
                r = await http.get(url)
                if r.status_code != 200:
                    log.warning(f"FreeJobAlert {src_type}: HTTP {r.status_code}")
                    continue
                soup = BeautifulSoup(r.text, "html.parser")
                # Look for tables (freejobalert lists in tables) OR list items
                for table in soup.find_all("table"):
                    for row in table.find_all("tr"):
                        cells = row.find_all("td")
                        if len(cells) < 2:
                            continue
                        link = row.find("a")
                        if not link:
                            continue
                        title = link.get_text(strip=True)
                        href = link.get("href", "")
                        if not title or len(title) < 8 or not href.startswith("http"):
                            continue
                        # Try to extract date-like text
                        row_text = row.get_text(" ", strip=True)
                        date_m = re.search(r"(\d{1,2}[-./ ][A-Za-z]{3,9}[-./ ]\d{2,4})", row_text)
                        last_date = date_m.group(1) if date_m else None
                        results.append({
                            "source": "freejobalert",
                            "source_type": src_type,
                            "title": title[:250],
                            "url": href,
                            "last_date_text": last_date,
                            "category": _cat_from_title(title),
                            "row_text": row_text[:400],
                            "fetched_at": datetime.now(timezone.utc),
                        })
                # Also try list items on the page
                for li in soup.select("ul li a"):
                    title = li.get_text(strip=True)
                    href = li.get("href", "")
                    if not title or len(title) < 12 or not href.startswith("http"):
                        continue
                    if "freejobalert" not in href and "sarkari" not in href.lower():
                        continue
                    results.append({
                        "source": "freejobalert",
                        "source_type": src_type,
                        "title": title[:250],
                        "url": href,
                        "last_date_text": None,
                        "category": _cat_from_title(title),
                        "row_text": title[:400],
                        "fetched_at": datetime.now(timezone.utc),
                    })
            except Exception as e:
                log.error(f"FreeJobAlert {src_type} error: {e}")

    # De-dupe by URL
    seen, out = set(), []
    for v in results:
        if v["url"] in seen: continue
        seen.add(v["url"])
        out.append(v)
    return out[:200]


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
            if res.upserted_id: added += 1
        except Exception as e:
            log.warning(f"upsert vacancy failed: {e}")
    log.info(f"Vacancies refresh: total={len(vacs)}, new={added}")
    return added
