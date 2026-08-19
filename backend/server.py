"""HARYANA ENTERPRISES - FastAPI backend."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
import re
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Body, UploadFile, File, Form
from fastapi.responses import FileResponse, PlainTextResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from starlette.middleware.cors import CORSMiddleware
from bson import ObjectId

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    set_auth_cookies,
    clear_auth_cookies,
    get_current_user,
    require_admin,
)
from emails import send_email, send_email_async, render_confirmation, render_reset
from csc_services import CSC_CATEGORIES, all_service_ids, find_service
from scrapers import fetch_freejobalert, refresh_vacancies_into_db, fetch_article_detail, backfill_application_mode, is_expired, parse_last_date, state_from_text, _cat_from_title
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# MongoDB
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Haryana Enterprises API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
log = logging.getLogger("haryana")

EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


# ─────────── Models ───────────
class RegisterIn(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    phone: str
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ContactIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str


class EnquiryIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    mobile: str = Field(min_length=7, max_length=15)
    email: EmailStr
    service: str = Field(min_length=2, max_length=80)
    message: str = Field(min_length=5, max_length=1500)


class SolarApplicationIn(BaseModel):
    application_type: str
    full_name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    state: str = "Haryana"
    pincode: str
    property_type: str
    roof_area_sqft: Optional[float] = None
    estimated_kw: Optional[float] = None
    monthly_bill: Optional[float] = None
    electricity_provider: Optional[str] = None
    consumer_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    notes: Optional[str] = None


class LoanApplicationIn(BaseModel):
    loan_type: str
    full_name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    state: str = "Haryana"
    pincode: str
    occupation: str
    monthly_income: float
    loan_amount: float
    loan_tenure_months: int
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    notes: Optional[str] = None


class StatusUpdateIn(BaseModel):
    status: str


class NoticeIn(BaseModel):
    title_hi: str
    title_en: str
    type: str = "info"


class CSCRequestIn(BaseModel):
    service_id: str
    full_name: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    aadhaar_number: Optional[str] = None
    remarks: Optional[str] = None
    custom_service: Optional[str] = None  # for 'other_custom'


class IrrigationApplicationIn(BaseModel):
    scheme_type: str  # 'diggi' | 'sprinkler' | 'drip' | 'poplar' | 'other'
    full_name: str
    email: EmailStr
    phone: str
    village: str
    tehsil: Optional[str] = None
    district: str = "Sirsa"
    state: str = "Haryana"
    pincode: Optional[str] = None
    land_area_acre: Optional[float] = None
    khasra_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    crops: Optional[str] = None
    water_source: Optional[str] = None  # 'canal' | 'tubewell' | 'borewell' | 'other'
    category: Optional[str] = None      # 'general' | 'sc' | 'st' | 'obc' | 'small' | 'marginal'
    notes: Optional[str] = None


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    password: str = Field(min_length=6)


# ─────────── Uploads dir ───────────
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_MIME = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_MB = 8


# ─────────── Helpers ───────────
def user_public(u: dict) -> dict:
    return {
        "id": u.get("user_id") or str(u.get("_id") or u.get("id", "")),
        "user_id": u.get("user_id") or str(u.get("_id") or ""),
        "name": u.get("name"),
        "email": u.get("email"),
        "phone": u.get("phone"),
        "role": u.get("role", "user"),
        "picture": u.get("picture"),
        "auth_provider": u.get("auth_provider", "email"),
        "created_at": u.get("created_at").isoformat() if isinstance(u.get("created_at"), datetime) else u.get("created_at"),
    }


def doc_public(a: dict) -> dict:
    a = dict(a)
    a["id"] = str(a.pop("_id", a.get("id", "")))
    for k, v in list(a.items()):
        if isinstance(v, datetime):
            a[k] = v.isoformat()
    return a


# ─────────── Root ───────────
@api.get("/")
async def root():
    return {"message": "Haryana Enterprises API", "status": "ok"}


# ─────────── Auth: register/login/logout/me ───────────
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "name": payload.name,
        "email": email,
        "phone": payload.phone,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "auth_provider": "email",
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(doc)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"user": user_public(doc), "access_token": access}


@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # Ensure user_id exists
    user_id = user.get("user_id") or str(user["_id"])
    if not user.get("user_id"):
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"user_id": user_id}})
        user["user_id"] = user_id
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"user": user_public(user), "access_token": access}


@api.post("/auth/session")
async def create_google_session(request: Request, response: Response):
    """Exchange Emergent Auth session_id (from URL fragment) for a session_token cookie."""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="X-Session-ID header required")

    async with httpx.AsyncClient(timeout=15.0) as http:
        try:
            r = await http.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": session_id})
        except Exception as e:
            log.error(f"Emergent auth call failed: {e}")
            raise HTTPException(status_code=502, detail="Auth provider unreachable")
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session id")
    data = r.json()

    email = (data.get("email") or "").lower()
    name = data.get("name") or "User"
    picture = data.get("picture") or ""
    session_token = data.get("session_token")
    if not email or not session_token:
        raise HTTPException(status_code=502, detail="Malformed auth provider response")

    # Upsert user
    existing = await db.users.find_one({"email": email})
    if existing:
        user_id = existing.get("user_id") or str(existing["_id"])
        await db.users.update_one(
            {"_id": existing["_id"]},
            {"$set": {"user_id": user_id, "name": name, "picture": picture, "auth_provider": "google"}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": "user",
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc),
        })

    # Save session
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    })

    response.set_cookie(
        "session_token", session_token,
        httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 3600, path="/",
    )

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": user_public(user)}


@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    # Also delete session record if any
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user_public(user)


# ─────────── Password reset ───────────
@api.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordIn, request: Request):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    # Do not leak whether email exists — always return ok.
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token,
            "user_id": user.get("user_id") or str(user["_id"]),
            "email": email,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": False,
            "created_at": datetime.now(timezone.utc),
        })
        # Build reset link using frontend origin
        origin = request.headers.get("origin") or os.environ.get("FRONTEND_URL", "")
        reset_link = f"{origin.rstrip('/')}/reset-password?token={token}"
        subject, html = render_reset(user.get("name", "there"), reset_link)
        send_email(email, subject, html)
        log.info(f"Password reset requested for {email}. Link: {reset_link}")
    return {"ok": True, "message": "If the email exists, a reset link has been sent."}


@api.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordIn):
    doc = await db.password_reset_tokens.find_one({"token": payload.token})
    if not doc or doc.get("used"):
        raise HTTPException(status_code=400, detail="Invalid or already used token")
    exp = doc["expires_at"]
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")

    # Update password
    new_hash = hash_password(payload.password)
    user_id = doc["user_id"]
    result = await db.users.update_one({"user_id": user_id}, {"$set": {"password_hash": new_hash}})
    if result.matched_count == 0:
        # Fallback by email
        await db.users.update_one({"email": doc["email"]}, {"$set": {"password_hash": new_hash}})

    await db.password_reset_tokens.update_one({"_id": doc["_id"]}, {"$set": {"used": True}})
    return {"ok": True, "message": "Password updated. You can now sign in."}


# ─────────── Contact ───────────
@api.post("/contact")
async def create_contact(payload: ContactIn):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    res = await db.contacts.insert_one(doc)
    log.info(f"Contact submitted: {payload.email} - {payload.subject}")
    return {"id": str(res.inserted_id), "ok": True}


# ─────────── SEO: dynamic vacancy sitemap (referenced by /sitemap.xml sitemap index at site root) ───────────
SITE_URL = os.environ.get("PUBLIC_SITE_URL", "https://hrdigitalservices.in").rstrip("/")


@api.get("/sitemap-vacancies.xml", response_class=Response)
async def sitemap_vacancies_xml():
    urls = []
    today = datetime.now(timezone.utc).date().isoformat()
    try:
        async for v in db.vacancies.find(
            {}, {"_id": 1, "fetched_at": 1}, sort=[("fetched_at", -1)]
        ).limit(500):
            fetched = v.get("fetched_at")
            lastmod = fetched.date().isoformat() if fetched else today
            urls.append(
                f"  <url><loc>{SITE_URL}/vacancies/{str(v['_id'])}</loc>"
                f"<lastmod>{lastmod}</lastmod>"
                f"<changefreq>weekly</changefreq>"
                f"<priority>0.7</priority></url>"
            )
    except Exception as e:
        log.warning(f"sitemap vacancies query failed: {e}")

    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )
    return Response(content=body, media_type="application/xml")


# Legacy endpoint kept for backwards-compatibility: redirect to the site-root sitemap.
@api.get("/sitemap.xml", response_class=Response)
async def legacy_sitemap_redirect():
    return Response(
        content=f'<?xml version="1.0" encoding="UTF-8"?>\n'
                f'<!-- Sitemap moved to site root -->\n'
                f'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                f'  <sitemap><loc>{SITE_URL}/sitemap.xml</loc></sitemap>\n'
                f'</sitemapindex>\n',
        media_type="application/xml",
    )


@api.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt_legacy():
    """Legacy alias — the canonical robots.txt is served statically at the site root."""
    return (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /api/\n"
        f"Sitemap: {SITE_URL}/sitemap.xml\n"
    )


# ─────────── Customer Enquiry (public, minimal fields) ───────────
@api.post("/enquiry")
async def create_enquiry(payload: EnquiryIn):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    doc["ref_no"] = f"ENQ-{uuid.uuid4().hex[:8].upper()}"
    res = await db.enquiries.insert_one(doc)
    log.info(f"Enquiry submitted: {payload.email} - {payload.service} ({doc['ref_no']})")
    return {"id": str(res.inserted_id), "ref_no": doc["ref_no"], "ok": True}


# ─────────── Solar / Loan Applications ───────────
async def _optional_user(request: Request):
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


@api.post("/solar/apply")
@api.post("/loan/apply")
async def _deprecated_solar_loan_apply():
    raise HTTPException(
        status_code=410,
        detail="This application endpoint has been discontinued. Please use the customer enquiry form at /api/enquiry (Name, Mobile, Email, Service, Message only). We no longer collect Aadhaar, PAN or bank details.",
    )


@api.get("/solar/my")
async def my_solar_apps(user=Depends(get_current_user)):
    apps = await db.solar_applications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    return [doc_public(a) for a in apps]


@api.get("/loan/my")
async def my_loan_apps(user=Depends(get_current_user)):
    apps = await db.loan_applications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    return [doc_public(a) for a in apps]


# ─────────── File uploads ───────────
@api.post("/uploads")
async def upload_file(
    file: UploadFile = File(...),
    kind: str = Form("misc"),
    ref_no: Optional[str] = Form(None),
    user=Depends(get_current_user),
):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail=f"Only PDF/JPEG/PNG/WebP allowed. Got {file.content_type}")
    body = await file.read()
    if len(body) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_UPLOAD_MB} MB.")

    ext = {"application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[file.content_type]
    fname = f"{uuid.uuid4().hex}.{ext}"
    fpath = UPLOAD_DIR / fname
    fpath.write_bytes(body)

    meta = {
        "id": fname,
        "user_id": user["id"],
        "original_name": file.filename,
        "mime": file.content_type,
        "size": len(body),
        "kind": kind,
        "ref_no": ref_no,
        "url": f"/api/uploads/{fname}",
        "created_at": datetime.now(timezone.utc),
    }
    await db.uploads.insert_one(meta)

    # If ref_no is attached, push URL into the application's documents array
    if ref_no:
        upd = {"$push": {"documents": {"kind": kind, "url": meta["url"], "original_name": file.filename, "size": len(body)}}}
        r1 = await db.solar_applications.update_one({"ref_no": ref_no, "user_id": user["id"]}, upd)
        if r1.matched_count == 0:
            await db.loan_applications.update_one({"ref_no": ref_no, "user_id": user["id"]}, upd)

    meta.pop("_id", None)
    meta["created_at"] = meta["created_at"].isoformat()
    return meta


@api.get("/uploads/{fname}")
async def get_upload(fname: str):
    # Basic path traversal guard
    if "/" in fname or "\\" in fname or ".." in fname:
        raise HTTPException(status_code=400, detail="Invalid filename")
    fpath = UPLOAD_DIR / fname
    if not fpath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(fpath)


# ─────────── Public Status ───────────
@api.get("/status/{ref_no}")
async def status_lookup(ref_no: str):
    for coll in ("solar_applications", "loan_applications"):
        doc = await db[coll].find_one({"ref_no": ref_no})
        if doc:
            return doc_public(doc)
    raise HTTPException(status_code=404, detail="Application not found")


# ─────────── Public Content ───────────
@api.get("/notices")
async def get_notices():
    notices = await db.notices.find({}).sort("created_at", -1).to_list(50)
    return [doc_public(n) for n in notices]


@api.get("/faqs")
async def get_faqs():
    items = await db.faqs.find({}).to_list(200)
    return [doc_public(i) for i in items]


@api.get("/downloads")
async def get_downloads():
    items = await db.downloads.find({}).to_list(200)
    return [doc_public(i) for i in items]


# ─────────── Vacancies (FreeJobAlert scraper) ───────────
def _annotate_and_filter_vacancy_expired(items: list, include_expired: bool = False) -> list:
    """Compute `is_expired` for each vacancy on the fly and (optionally) filter them out."""
    out = []
    for v in items:
        v["is_expired"] = is_expired(v.get("last_date_text"))
        if v["is_expired"] and not include_expired:
            continue
        out.append(v)
    return out


@api.get("/vacancies")
async def list_vacancies(
    category: Optional[str] = None,
    q: Optional[str] = None,
    qualification: Optional[str] = None,
    mode: Optional[str] = None,
    state: Optional[str] = None,
    include_expired: bool = False,
    only_expired: bool = False,
    limit: int = 500,
):
    query = {}
    # Haryana is a "cross-cutting" view: include any vacancy tagged as haryana
    # OR any vacancy whose title/organization mentions Haryana / HSSC / HPSC etc.
    haryana_rx = r"\b(haryana|hssc|hpsc|hbse|hkrn|hprb|panchkula|chandigarh)\b"
    if category == "haryana":
        query["$or"] = [
            {"category": "haryana"},
            {"title": {"$regex": haryana_rx, "$options": "i"}},
            {"organization": {"$regex": haryana_rx, "$options": "i"}},
            {"post_name": {"$regex": haryana_rx, "$options": "i"}},
            {"row_text": {"$regex": haryana_rx, "$options": "i"}},
        ]
    elif category and category != "all":
        query["category"] = category
    # Hide admit_card / result listings unless the user explicitly selected
    # those categories. This applies to the default "All" view AND every
    # other category (including haryana / state filters) so admit-card items
    # never leak into a normal job-browsing session.
    if category not in ("admit_card", "result"):
        existing = query.get("category")
        if isinstance(existing, dict):
            existing["$nin"] = list(set(existing.get("$nin", []) + ["admit_card", "result"]))
        elif isinstance(existing, str):
            # Concrete category chosen (e.g. bank/ssc) — no need to exclude,
            # that category is already narrower than admit_card/result.
            pass
        else:
            query["category"] = {"$nin": ["admit_card", "result"]}
    if state and state != "all":
        query["state"] = state
    if qualification and qualification != "all":
        query["qualification"] = {"$regex": qualification, "$options": "i"}
    if mode == "other":
        query["$and"] = query.get("$and", []) + [{
            "$or": [{"application_mode": None}, {"application_mode": {"$exists": False}}]
        }]
    elif mode and mode in ("online", "offline"):
        query["application_mode"] = mode
    if q:
        text_or = [
            {"title": {"$regex": q, "$options": "i"}},
            {"organization": {"$regex": q, "$options": "i"}},
            {"post_name": {"$regex": q, "$options": "i"}},
            {"row_text": {"$regex": q, "$options": "i"}},
        ]
        # Preserve existing $or (haryana) by moving both into $and
        if "$or" in query:
            query.setdefault("$and", []).append({"$or": query.pop("$or")})
            query["$and"].append({"$or": text_or})
        else:
            query["$or"] = text_or
    # When user explicitly wants expired items OR wants to include them,
    # we need to scan more docs because they tend to be older (sort=fetched_at desc)
    effective_limit = 1000 if (only_expired or include_expired) else min(limit, 1000)
    items = await db.vacancies.find(query).sort("fetched_at", -1).to_list(effective_limit)
    public = [doc_public(v) for v in items]
    for v in public:
        v["is_expired"] = is_expired(v.get("last_date_text"))
    if only_expired:
        return [v for v in public if v["is_expired"]]
    if not include_expired:
        return [v for v in public if not v["is_expired"]]
    return public


@api.get("/vacancies/stats")
async def vacancies_stats():
    # We compute expiry client-side on the "last_date_text" field, so aggregate manually
    all_items = await db.vacancies.find({}, {
        "category": 1, "application_mode": 1, "last_date_text": 1, "fetched_at": 1,
        "title": 1, "organization": 1, "post_name": 1, "row_text": 1, "state": 1,
    }).to_list(2000)

    total_including_expired = len(all_items)
    active_items = [v for v in all_items if not is_expired(v.get("last_date_text"))]
    expired_count = total_including_expired - len(active_items)
    # "All Vacancies" view excludes admit_card and result — they have their own
    # dedicated buttons/pages. This keeps the top-level counts aligned with what
    # a student sees when they land on /vacancies with no category selected.
    job_items = [v for v in active_items if v.get("category") not in ("admit_card", "result")]
    total = len(job_items)

    by_cat_counts: dict = {}
    for v in active_items:
        c = v.get("category") or "other"
        by_cat_counts[c] = by_cat_counts.get(c, 0) + 1

    # Haryana is a cross-cutting view — include vacancies from any category whose
    # title/organization mentions Haryana / HSSC / HPSC etc. (matches list_vacancies)
    haryana_re = re.compile(r"\b(haryana|hssc|hpsc|hbse|hkrn|hprb|panchkula|chandigarh)\b", re.I)
    haryana_count = 0
    for v in active_items:
        blob = " ".join([str(v.get(k) or "") for k in ("title", "organization", "post_name", "row_text")])
        if v.get("category") == "haryana" or haryana_re.search(blob):
            haryana_count += 1
    by_cat_counts["haryana"] = haryana_count

    by_cat = [{"category": c, "count": n} for c, n in by_cat_counts.items()]

    online_count = sum(1 for v in job_items if v.get("application_mode") == "online")
    offline_count = sum(1 for v in job_items if v.get("application_mode") == "offline")
    other_count = sum(1 for v in job_items if not v.get("application_mode"))
    by_mode = {"all": total, "online": online_count, "offline": offline_count, "other": other_count}

    # State counts (canonical slug -> count) — exclude admit_card/result too so
    # the state dropdown matches the "All Vacancies" view semantics.
    by_state_counts: dict = {}
    for v in job_items:
        s = v.get("state")
        if s:
            by_state_counts[s] = by_state_counts.get(s, 0) + 1
    by_state = [{"state": s, "count": n} for s, n in sorted(by_state_counts.items(), key=lambda x: -x[1])]

    latest = await db.vacancies.find({}, sort=[("fetched_at", -1)], limit=1).to_list(1)
    last_updated = latest[0]["fetched_at"].isoformat() if latest and latest[0].get("fetched_at") else None
    return {
        "total": total,
        "total_including_expired": total_including_expired,
        "expired": expired_count,
        "by_category": by_cat,
        "by_mode": by_mode,
        "by_state": by_state,
        "last_updated": last_updated,
    }


@api.get("/vacancies/{vac_id}")
async def get_vacancy_detail(vac_id: str):
    try:
        oid = ObjectId(vac_id)
    except Exception:
        raise HTTPException(400, "Invalid id")
    v = await db.vacancies.find_one({"_id": oid})
    if not v:
        raise HTTPException(404, "Vacancy not found")
    # Lazy-scrape article detail on first view, then cache for 24h.
    # Also cache failed attempts for 1h to avoid re-hitting a slow/blocked upstream on every view.
    now_utc = datetime.now(timezone.utc)
    prev_fetched = v.get("detail_fetched_at")
    if prev_fetched and prev_fetched.tzinfo is None:
        prev_fetched = prev_fetched.replace(tzinfo=timezone.utc)
    prev_attempt = v.get("detail_attempted_at")
    if prev_attempt and prev_attempt.tzinfo is None:
        prev_attempt = prev_attempt.replace(tzinfo=timezone.utc)

    has_content = bool(v.get("content_html"))
    stale = prev_fetched and (now_utc - prev_fetched).total_seconds() > 86400
    recently_attempted = prev_attempt and (now_utc - prev_attempt).total_seconds() < 3600
    needs_detail = (not has_content or stale) and not recently_attempted

    if needs_detail and v.get("url") and v.get("source") != "manual":
        detail = await fetch_article_detail(v["url"])
        if detail:
            await db.vacancies.update_one({"_id": oid}, {"$set": detail})
            v.update(detail)
        else:
            # Negative-cache: mark attempted so we do not re-scrape for 1 hour
            await db.vacancies.update_one({"_id": oid}, {"$set": {"detail_attempted_at": now_utc}})
    return doc_public(v)


@api.post("/admin/vacancies/refresh")
async def admin_refresh_vacancies(_=Depends(require_admin)):
    before_urls = set([v["url"] async for v in db.vacancies.find({}, {"url": 1})])
    added = await refresh_vacancies_into_db(db)
    total = await db.vacancies.count_documents({})
    # Fan-out notifications for newly-added vacancies
    if added > 0:
        new_docs = await db.vacancies.find({"url": {"$nin": list(before_urls)}}).to_list(added * 2)
        if new_docs:
            await _notify_subscribers_of_new_vacancies(new_docs)
    return {"ok": True, "new_added": added, "total": total}


# ─────────── Admin: Manual Vacancy CRUD ───────────
# Manually-authored vacancies live in the same `vacancies` collection but carry
# `source: "manual"` and a synthetic `url: "internal://manual/{uuid}"` so they
# never collide with (or get overwritten by) the FreeJobAlert scraper's upserts.

class ManualVacancyIn(BaseModel):
    title: str = Field(..., min_length=3, max_length=250)
    organization: Optional[str] = Field(None, max_length=180)
    post_name: Optional[str] = Field(None, max_length=250)
    qualification: Optional[str] = Field(None, max_length=180)
    category: Optional[str] = Field(None, max_length=40)     # e.g. bank, ssc, teaching, haryana
    application_mode: Optional[str] = Field(None, pattern="^(online|offline)?$")
    state: Optional[str] = Field(None, max_length=40)        # canonical slug (e.g. haryana, delhi)
    last_date_text: Optional[str] = Field(None, max_length=80)
    apply_url: Optional[str] = Field(None, max_length=500)   # external "Apply Now" link
    description: Optional[str] = Field(None, max_length=20000)  # simple HTML / markdown-ish text


def _manual_doc(payload: ManualVacancyIn, existing_url: Optional[str] = None) -> dict:
    now = datetime.now(timezone.utc)
    url = existing_url or f"internal://manual/{uuid.uuid4().hex}"
    # Description is rendered by the frontend detail page via `content_html`; wrap
    # plain text in <p> so the reader gets sensible spacing.
    desc = (payload.description or "").strip()
    if desc and "<" not in desc:
        desc = "".join(f"<p>{line}</p>" for line in desc.split("\n") if line.strip())
    doc = {
        "url": url,
        "source": "manual",
        "source_type": "manual",
        "title": payload.title.strip()[:250],
        "organization": (payload.organization or "").strip()[:180] or None,
        "post_name": (payload.post_name or payload.title).strip()[:250],
        "qualification": (payload.qualification or "").strip()[:180] or None,
        "category": (payload.category or "other").strip().lower()[:40],
        "application_mode": payload.application_mode or None,
        "state": (payload.state or "").strip().lower()[:40] or None,
        "last_date_text": (payload.last_date_text or "").strip()[:80] or None,
        "apply_url": (payload.apply_url or "").strip()[:500] or None,
        "content_html": desc or None,
        "detail_fetched_at": now,   # marks detail as "fresh" — no lazy scrape needed
        "row_text": f"{payload.title} {payload.organization or ''}",
        "fetched_at": now,
        "structured": {
            "post_name": (payload.post_name or payload.title).strip()[:250],
            "qualification": (payload.qualification or "").strip()[:180] or None,
            "last_date_text": (payload.last_date_text or "").strip()[:80] or None,
            "description": desc or None,
        },
    }
    return doc


@api.get("/admin/vacancies")
async def admin_list_manual_vacancies(_=Depends(require_admin)):
    """List manual (admin-authored) vacancies only. Sorted newest first."""
    rows = await db.vacancies.find({"source": "manual"}).sort("created_at", -1).to_list(500)
    return [doc_public(r) for r in rows]


@api.post("/admin/vacancies")
async def admin_create_manual_vacancy(payload: ManualVacancyIn, _=Depends(require_admin)):
    doc = _manual_doc(payload)
    doc["created_at"] = datetime.now(timezone.utc)
    res = await db.vacancies.insert_one(doc)
    doc["_id"] = res.inserted_id
    return doc_public(doc)


@api.put("/admin/vacancies/{vac_id}")
async def admin_update_manual_vacancy(vac_id: str, payload: ManualVacancyIn, _=Depends(require_admin)):
    try:
        oid = ObjectId(vac_id)
    except Exception:
        raise HTTPException(400, "Invalid id")
    existing = await db.vacancies.find_one({"_id": oid})
    if not existing:
        raise HTTPException(404, "Vacancy not found")
    if existing.get("source") != "manual":
        raise HTTPException(400, "Only manual vacancies can be edited from the admin panel")
    new_doc = _manual_doc(payload, existing_url=existing["url"])
    await db.vacancies.update_one({"_id": oid}, {"$set": new_doc})
    updated = await db.vacancies.find_one({"_id": oid})
    return doc_public(updated)


@api.delete("/admin/vacancies/{vac_id}")
async def admin_delete_manual_vacancy(vac_id: str, _=Depends(require_admin)):
    try:
        oid = ObjectId(vac_id)
    except Exception:
        raise HTTPException(400, "Invalid id")
    existing = await db.vacancies.find_one({"_id": oid}, {"source": 1})
    if not existing:
        raise HTTPException(404, "Vacancy not found")
    if existing.get("source") != "manual":
        raise HTTPException(400, "Only manual vacancies can be deleted from the admin panel")
    await db.vacancies.delete_one({"_id": oid})
    return {"ok": True, "id": vac_id}


# ─────────── Vacancy Alert Subscriptions ───────────
class SubscribeIn(BaseModel):
    email: EmailStr
    categories: List[str] = []      # e.g. ["bank", "ssc"]
    qualifications: List[str] = []  # e.g. ["graduate", "12th"]
    keyword: Optional[str] = None


@api.post("/vacancy-alerts/subscribe")
async def vacancy_alerts_subscribe(payload: SubscribeIn):
    if not payload.categories and not payload.qualifications and not payload.keyword:
        raise HTTPException(400, "Select at least one category, qualification or a keyword")
    doc = {
        "email": payload.email.lower(),
        "categories": [c.lower() for c in payload.categories][:12],
        "qualifications": [q.lower() for q in payload.qualifications][:8],
        "keyword": (payload.keyword or "").strip()[:80] or None,
        "unsubscribe_token": secrets.token_urlsafe(16),
        "created_at": datetime.now(timezone.utc),
        "verified": True,  # skip double opt-in for now
        "active": True,
        "last_notified_at": None,
    }
    res = await db.vacancy_subscriptions.update_one(
        {"email": doc["email"]},
        {"$set": {k: v for k, v in doc.items() if k not in ("created_at",)},
         "$setOnInsert": {"created_at": doc["created_at"]}},
        upsert=True,
    )
    # Confirmation email via existing (mocked in dev) sender
    try:
        subject = "You're subscribed to Haryana Enterprises job alerts"
        body_html = (
            f"<h3>Alerts activated ✔</h3>"
            f"<p>You'll be notified about new government vacancies matching:</p>"
            f"<ul>"
            f"<li><b>Categories:</b> {', '.join(doc['categories']) or 'Any'}</li>"
            f"<li><b>Qualifications:</b> {', '.join(doc['qualifications']) or 'Any'}</li>"
            f"<li><b>Keyword:</b> {doc['keyword'] or '—'}</li>"
            f"</ul>"
            f"<p>Unsubscribe anytime: <code>{doc['unsubscribe_token']}</code></p>"
        )
        await send_email_async(payload.email, subject, body_html)
    except Exception as e:
        log.warning(f"subscribe email send failed: {e}")
    return {"ok": True, "created": res.upserted_id is not None, "unsubscribe_token": doc["unsubscribe_token"]}


@api.get("/vacancy-alerts/status")
async def vacancy_alerts_status(email: EmailStr):
    sub = await db.vacancy_subscriptions.find_one({"email": email.lower()})
    if not sub:
        return {"subscribed": False}
    return {
        "subscribed": bool(sub.get("active", True)),
        "categories": sub.get("categories", []),
        "qualifications": sub.get("qualifications", []),
        "keyword": sub.get("keyword"),
    }


@api.post("/vacancy-alerts/unsubscribe")
async def vacancy_alerts_unsubscribe(token: str = Body(..., embed=True)):
    res = await db.vacancy_subscriptions.update_one({"unsubscribe_token": token}, {"$set": {"active": False}})
    if res.matched_count == 0:
        raise HTTPException(404, "Invalid unsubscribe token")
    return {"ok": True}


def _vacancy_matches_sub(v: dict, sub: dict) -> bool:
    cats = sub.get("categories") or []
    quals = sub.get("qualifications") or []
    kw = (sub.get("keyword") or "").lower().strip()
    if cats and v.get("category") not in cats:
        return False
    if quals:
        qtext = (v.get("qualification") or "").lower()
        if not any(q in qtext for q in quals):
            return False
    if kw:
        blob = f"{v.get('title','')} {v.get('post_name','')} {v.get('organization','')} {v.get('qualification','')}".lower()
        if kw not in blob:
            return False
    return True


async def _notify_subscribers_of_new_vacancies(new_vacancies: list[dict]):
    subs = await db.vacancy_subscriptions.find({"active": True}).to_list(2000)
    if not subs:
        return
    frontend_base = os.environ.get("FRONTEND_URL", "").rstrip("/")
    sent = 0
    for sub in subs:
        matched = [v for v in new_vacancies if _vacancy_matches_sub(v, sub)]
        if not matched:
            continue
        items_html = "".join(
            f'<li style="margin:8px 0"><b>{(m.get("post_name") or m.get("title") or "Vacancy")}</b> '
            f'— {m.get("organization","")} · Last: {m.get("last_date_text","N/A")} '
            f'<br/><a href="{frontend_base}/vacancies/{str(m["_id"])}">View details</a></li>'
            for m in matched[:15]
        )
        body = (
            f'<h3>{len(matched)} new job(s) match your alert</h3>'
            f'<ul>{items_html}</ul>'
            f'<p style="font-size:11px;color:#888">Unsubscribe token: <code>{sub.get("unsubscribe_token","")}</code></p>'
        )
        try:
            await send_email_async(sub["email"], f"[Job Alert] {len(matched)} new vacancies for you", body)
            await db.vacancy_subscriptions.update_one(
                {"_id": sub["_id"]},
                {"$set": {"last_notified_at": datetime.now(timezone.utc)}}
            )
            sent += 1
        except Exception as e:
            log.warning(f"notify {sub.get('email')} failed: {e}")
    log.info(f"[alerts] Notified {sent}/{len(subs)} subscribers about {len(new_vacancies)} new vacancies")


# ─────────── CSC Services ───────────
@api.get("/csc/services")
async def csc_services_list():
    return CSC_CATEGORIES


@api.post("/csc/apply")
@api.post("/irrigation/apply")
async def _deprecated_csc_irrigation_apply():
    raise HTTPException(
        status_code=410,
        detail="This application endpoint has been discontinued. Please use the customer enquiry form at /api/enquiry (Name, Mobile, Email, Service, Message only). We no longer collect Aadhaar, PAN or bank details.",
    )


@api.get("/csc/my")
async def csc_my(user=Depends(get_current_user)):
    apps = await db.csc_requests.find({"user_id": user["id"]}).sort("created_at", -1).to_list(500)
    return [doc_public(a) for a in apps]


@api.get("/admin/csc")
async def admin_csc(_=Depends(require_admin)):
    apps = await db.csc_requests.find({}).sort("created_at", -1).to_list(1000)
    return [doc_public(a) for a in apps]


@api.patch("/admin/csc/{ref_no}/status")
async def admin_update_csc_status(ref_no: str, payload: StatusUpdateIn, _=Depends(require_admin)):
    if payload.status not in ("submitted", "under_review", "approved", "rejected", "completed"):
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.csc_requests.update_one({"ref_no": ref_no}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ─────────── Micro Irrigation / Farm services ───────────
IRRIGATION_SCHEMES = {
    "diggi":     {"hi": "डिग्गी (फार्म पॉण्ड)",        "en": "Diggi (Farm Pond)",              "subsidy": "70% – 85%"},
    "sprinkler": {"hi": "फव्वारा सिंचाई प्रणाली",       "en": "Sprinkler Irrigation System",   "subsidy": "Up to 85%"},
    "drip":      {"hi": "ड्रिप सिंचाई",                "en": "Drip Irrigation",                "subsidy": "Up to 85%"},
    "poplar":    {"hi": "सफेदा (Poplar) बागवानी",     "en": "Poplar (Safeda) Plantation",     "subsidy": "P23, P288 varieties"},
    "other":     {"hi": "अन्य कृषि योजना",             "en": "Other Farm Scheme",              "subsidy": "As applicable"},
}


@api.get("/irrigation/schemes")
async def irrigation_schemes():
    return IRRIGATION_SCHEMES


@api.post("/irrigation/apply")
async def _deprecated_irrigation_apply():
    raise HTTPException(
        status_code=410,
        detail="This application endpoint has been discontinued. Please use the customer enquiry form at /api/enquiry (Name, Mobile, Email, Service, Message only). We no longer collect Aadhaar, PAN or bank details.",
    )


@api.get("/irrigation/my")
async def irrigation_my(user=Depends(get_current_user)):
    apps = await db.irrigation_applications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(500)
    return [doc_public(a) for a in apps]


@api.get("/admin/irrigation")
async def admin_irrigation(_=Depends(require_admin)):
    apps = await db.irrigation_applications.find({}).sort("created_at", -1).to_list(1000)
    return [doc_public(a) for a in apps]


@api.patch("/admin/irrigation/{ref_no}/status")
async def admin_update_irrigation_status(ref_no: str, payload: StatusUpdateIn, _=Depends(require_admin)):
    if payload.status not in ("submitted", "under_review", "approved", "rejected", "completed"):
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.irrigation_applications.update_one({"ref_no": ref_no}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ─────────── ADMIN ROUTES ───────────
@api.get("/admin/stats")
async def admin_stats(_=Depends(require_admin)):
    return {
        "users": await db.users.count_documents({}),
        "solar_apps": await db.solar_applications.count_documents({}),
        "loan_apps": await db.loan_applications.count_documents({}),
        "csc_requests": await db.csc_requests.count_documents({}),
        "contacts": await db.contacts.count_documents({}),
        "solar_pending": await db.solar_applications.count_documents({"status": "submitted"}),
        "loan_pending": await db.loan_applications.count_documents({"status": "submitted"}),
        "csc_pending": await db.csc_requests.count_documents({"status": "submitted"}),
        "solar_approved": await db.solar_applications.count_documents({"status": "approved"}),
        "loan_approved": await db.loan_applications.count_documents({"status": "approved"}),
    }


@api.get("/admin/analytics")
async def admin_analytics(_=Depends(require_admin)):
    """Aggregate analytics for dashboard charts."""
    now = datetime.now(timezone.utc)
    days = [(now - timedelta(days=i)).date() for i in range(29, -1, -1)]

    async def by_day(coll_name):
        buckets = {d.isoformat(): 0 for d in days}
        cur = db[coll_name].find({"created_at": {"$gte": now - timedelta(days=30)}})
        async for doc in cur:
            ca = doc.get("created_at")
            if isinstance(ca, str):
                try: ca = datetime.fromisoformat(ca)
                except Exception: continue
            if not ca: continue
            key = ca.date().isoformat()
            if key in buckets:
                buckets[key] += 1
        return [{"date": k, "count": v} for k, v in buckets.items()]

    async def by_status(coll_name):
        pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
        return [{"status": r["_id"] or "unknown", "count": r["count"]} async for r in db[coll_name].aggregate(pipeline)]

    async def by_type(coll_name, field):
        pipeline = [{"$group": {"_id": f"${field}", "count": {"$sum": 1}}}]
        return [{"type": r["_id"] or "unknown", "count": r["count"]} async for r in db[coll_name].aggregate(pipeline)]

    async def loan_amount_stats():
        pipeline = [{"$group": {"_id": None, "total": {"$sum": "$loan_amount"}, "avg": {"$avg": "$loan_amount"}, "max": {"$max": "$loan_amount"}}}]
        async for r in db.loan_applications.aggregate(pipeline):
            return {"total": r.get("total") or 0, "avg": r.get("avg") or 0, "max": r.get("max") or 0}
        return {"total": 0, "avg": 0, "max": 0}

    return {
        "solar_by_day": await by_day("solar_applications"),
        "loan_by_day": await by_day("loan_applications"),
        "user_by_day": await by_day("users"),
        "solar_by_status": await by_status("solar_applications"),
        "loan_by_status": await by_status("loan_applications"),
        "solar_by_type": await by_type("solar_applications", "application_type"),
        "loan_by_type": await by_type("loan_applications", "loan_type"),
        "loan_amount": await loan_amount_stats(),
    }



@api.get("/admin/users")
async def admin_users(_=Depends(require_admin)):
    users = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).to_list(500)
    return [user_public(u) for u in users]


@api.get("/admin/solar")
async def admin_solar(_=Depends(require_admin)):
    apps = await db.solar_applications.find({}).sort("created_at", -1).to_list(500)
    return [doc_public(a) for a in apps]


@api.get("/admin/loan")
async def admin_loan(_=Depends(require_admin)):
    apps = await db.loan_applications.find({}).sort("created_at", -1).to_list(500)
    return [doc_public(a) for a in apps]


@api.get("/admin/contacts")
async def admin_contacts(_=Depends(require_admin)):
    items = await db.contacts.find({}).sort("created_at", -1).to_list(500)
    return [doc_public(c) for c in items]


@api.patch("/admin/solar/{ref_no}/status")
async def admin_update_solar_status(ref_no: str, payload: StatusUpdateIn, _=Depends(require_admin)):
    if payload.status not in ("submitted", "under_review", "approved", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.solar_applications.update_one({"ref_no": ref_no}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@api.patch("/admin/loan/{ref_no}/status")
async def admin_update_loan_status(ref_no: str, payload: StatusUpdateIn, _=Depends(require_admin)):
    if payload.status not in ("submitted", "under_review", "approved", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.loan_applications.update_one({"ref_no": ref_no}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@api.post("/admin/notices")
async def admin_create_notice(payload: NoticeIn, _=Depends(require_admin)):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    res = await db.notices.insert_one(doc)
    doc["_id"] = res.inserted_id
    return doc_public(doc)


@api.delete("/admin/notices/{notice_id}")
async def admin_delete_notice(notice_id: str, _=Depends(require_admin)):
    try:
        oid = ObjectId(notice_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    await db.notices.delete_one({"_id": oid})
    return {"ok": True}


# ─────────── Site Content (SEO + editable front-page copy) ───────────
# Stored in the `site_content` collection as { key, value, updated_at } where
# `value` is a free-form dict so the admin can attach any shape (SEO fields,
# hero copy, contact info, etc.) without new migrations.

class SiteContentIn(BaseModel):
    """Public payload for PUT /api/site-content/{key}."""
    value: Dict[str, Any] = Field(default_factory=dict)


# Sensible defaults so a fresh install / production without seeded content still
# renders the site correctly. Admin edits merge into these.
DEFAULT_SITE_CONTENT: Dict[str, Dict[str, Any]] = {
    "seo:home": {
        "title": "Haryana Enterprises — Govt Approved Rooftop Solar Vendor & Job Vacancies",
        "description": "Haryana Enterprises: govt-approved rooftop solar vendor. Also India ki latest sarkari naukri, admit card, result — Hindi/English, mobile-friendly.",
        "keywords": "haryana enterprises, rooftop solar vendor, sarkari naukri, admit card, result, latest jobs, hindi jobs, offline form filing",
    },
    "seo:vacancies": {
        "title": "Latest Sarkari Naukri 2026 — Haryana Enterprises",
        "description": "Explore latest govt jobs, admit cards & results — filter by state, category and application mode. Updated every 6 hours.",
        "keywords": "sarkari naukri, latest govt jobs 2026, admit card, exam result, haryana jobs, delhi jobs, punjab jobs",
    },
    "seo:services": {
        "title": "Solar Services — Haryana Enterprises",
        "description": "Govt-approved rooftop solar installation, financing guidance, and CSC-related services in Haryana and neighbouring states.",
        "keywords": "rooftop solar installation, haryana solar vendor, solar financing, csc services",
    },
    "seo:about": {
        "title": "About Us — Haryana Enterprises",
        "description": "Learn about Haryana Enterprises — a private, govt-approved rooftop solar vendor helping households and businesses go solar.",
        "keywords": "haryana enterprises about, solar vendor haryana",
    },
    "seo:contact": {
        "title": "Contact — Haryana Enterprises",
        "description": "Reach out for rooftop solar quotes, offline form assistance, and job-vacancy queries.",
        "keywords": "haryana enterprises contact, rooftop solar quote",
    },
    "content:hero": {
        "heading_hi": "हरियाणा एंटरप्राइजेज",
        "heading_en": "Haryana Enterprises",
        "tagline_hi": "सरकार-अनुमोदित रूफटॉप सोलर वेंडर — घर और व्यवसाय दोनों के लिए",
        "tagline_en": "Govt-Approved Rooftop Solar Vendor — for Homes & Businesses",
        "cta_hi": "मुफ्त कोटेशन पाएँ",
        "cta_en": "Get a Free Quote",
    },
    "content:about": {
        "text_hi": "Haryana Enterprises एक निजी, सरकार-अनुमोदित रूफटॉप सोलर वेंडर है। हम घरों और व्यवसायों के लिए सोलर पैनल इंस्टॉलेशन, फ़ाइनेंसिंग गाइडेंस और ऑफ़लाइन फ़ॉर्म भरने की सुविधा प्रदान करते हैं।",
        "text_en": "Haryana Enterprises is a private, government-approved rooftop solar vendor. We provide solar installation, financing guidance and offline form-filing assistance for households and small businesses.",
    },
    "content:contact": {
        "phone": "+91-9812345678",
        "whatsapp": "+919812345678",
        "email": "info@hrdigitalservices.in",
        "address_hi": "मुख्य बाज़ार, हरियाणा",
        "address_en": "Main Market, Haryana",
    },
}


def _merged_content(key: str, stored):
    """Merge admin-stored value over the default (partial edits stay safe)."""
    base = dict(DEFAULT_SITE_CONTENT.get(key, {}))
    if stored:
        base.update(stored)
    return base


@api.get("/site-content")
async def get_all_site_content():
    """Public — returns every content key merged with defaults. Cached by client."""
    rows = await db.site_content.find({}).to_list(200)
    by_key = {r["key"]: r.get("value", {}) for r in rows}
    out = {k: _merged_content(k, by_key.get(k)) for k in DEFAULT_SITE_CONTENT}
    return {"content": out, "keys": list(DEFAULT_SITE_CONTENT.keys())}


@api.get("/site-content/{key}")
async def get_site_content(key: str):
    if key not in DEFAULT_SITE_CONTENT:
        raise HTTPException(status_code=404, detail="Unknown content key")
    row = await db.site_content.find_one({"key": key})
    return {"key": key, "value": _merged_content(key, (row or {}).get("value"))}


@api.put("/site-content/{key}")
async def put_site_content(key: str, payload: SiteContentIn, _=Depends(require_admin)):
    if key not in DEFAULT_SITE_CONTENT:
        raise HTTPException(status_code=400, detail="Unknown content key")
    # Only accept known fields for this key so an admin typo doesn't inject garbage
    allowed = set(DEFAULT_SITE_CONTENT[key].keys())
    clean = {k: v for k, v in (payload.value or {}).items() if k in allowed}
    now = datetime.now(timezone.utc)
    await db.site_content.update_one(
        {"key": key},
        {"$set": {"value": clean, "updated_at": now}, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    return {"key": key, "value": _merged_content(key, clean), "updated_at": now.isoformat()}



# ─────────── Include router + CORS ───────────
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ─────────── Startup: indexes + seed ───────────
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id")
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("expires_at")
    await db.solar_applications.create_index("ref_no", unique=True)
    await db.loan_applications.create_index("ref_no", unique=True)
    await db.csc_requests.create_index("ref_no", unique=True)
    await db.csc_requests.create_index("user_id")
    await db.irrigation_applications.create_index("ref_no", unique=True)
    await db.irrigation_applications.create_index("user_id")
    await db.vacancies.create_index("url", unique=True)
    await db.vacancies.create_index("category")
    await db.vacancies.create_index("fetched_at")
    await db.vacancies.create_index("state")
    await db.password_reset_tokens.create_index("token", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.uploads.create_index("user_id")

    # Backfill user_id on legacy users
    async for u in db.users.find({"user_id": {"$exists": False}}):
        await db.users.update_one({"_id": u["_id"]}, {"$set": {"user_id": str(u["_id"])}})

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@haryanaenterprises.com").lower()
    admin_pass = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        admin_uid = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": admin_uid,
            "name": "Admin",
            "email": admin_email,
            "phone": "8167862016",
            "password_hash": hash_password(admin_pass),
            "role": "admin",
            "auth_provider": "email",
            "created_at": datetime.now(timezone.utc),
        })
        log.info(f"Seeded admin: {admin_email}")
    else:
        # Only ensure admin role; do NOT overwrite password on every restart —
        # that would silently reset a password an admin intentionally changed.
        if existing.get("role") != "admin":
            await db.users.update_one({"email": admin_email}, {"$set": {"role": "admin"}})

    # Seed test user
    test_email = "user@test.com"
    if not await db.users.find_one({"email": test_email}):
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "name": "Test User",
            "email": test_email,
            "phone": "9999999999",
            "password_hash": hash_password("Test@123"),
            "role": "user",
            "auth_provider": "email",
            "created_at": datetime.now(timezone.utc),
        })

    # Seed notices (informational only - no fake portal claims)
    if await db.notices.count_documents({}) == 0:
        await db.notices.insert_many([
            {"title_hi": "रूफटॉप सोलर के लिए मुफ्त परामर्श उपलब्ध",
             "title_en": "Free rooftop solar consultation available",
             "type": "info", "created_at": datetime.now(timezone.utc)},
            {"title_hi": "साइट असेसमेंट के लिए संपर्क करें · 8168762016",
             "title_en": "Contact for site assessment · 8168762016",
             "type": "info", "created_at": datetime.now(timezone.utc)},
            {"title_hi": "सरकारी सोलर योजनाओं की सामान्य जानकारी के लिए पूछताछ करें",
             "title_en": "Enquire for general information on government solar schemes",
             "type": "update", "created_at": datetime.now(timezone.utc)},
            {"title_hi": "हरियाणा एंटरप्राइजेज कागदाना (सिरसा) में सेवा उपलब्ध",
             "title_en": "Haryana Enterprises services available in Kagdana (Sirsa)",
             "type": "info", "created_at": datetime.now(timezone.utc)},
            {"title_hi": "छात्रों के लिए ताज़ा भर्तियाँ · Vacancies पेज पर देखें",
             "title_en": "Latest job alerts for students · check Vacancies page",
             "type": "important", "created_at": datetime.now(timezone.utc)},
        ])

    # Seed FAQs (informational only, no fake portal claims)
    if await db.faqs.count_documents({}) == 0:
        await db.faqs.insert_many([
            {"q_hi": "क्या हरियाणा एंटरप्राइजेज एक सरकारी पोर्टल है?",
             "q_en": "Is Haryana Enterprises a government portal?",
             "a_hi": "नहीं। हरियाणा एंटरप्राइजेज एक निजी संस्था है जो सरकार अनुमोदित रूफटॉप सोलर वेंडर के रूप में परामर्श, साइट सर्वे और इंस्टॉलेशन सहायता प्रदान करती है। यह कोई सरकारी पोर्टल नहीं है।",
             "a_en": "No. Haryana Enterprises is a private business that acts as a Govt-approved rooftop solar vendor providing consultation, site survey and installation assistance. It is not a government portal."},
            {"q_hi": "रूफटॉप सोलर पर सरकारी योजनाओं की जानकारी कहाँ से मिलेगी?",
             "q_en": "Where can I find information about government schemes for rooftop solar?",
             "a_hi": "सरकारी योजनाओं की सामान्य जानकारी हम आपको प्रदान कर सकते हैं। कृपया वर्तमान पात्रता, सब्सिडी नियम और आवेदन प्रक्रिया के लिए pmsuryaghar.gov.in और mnre.gov.in जैसी आधिकारिक साइटों पर सत्यापन करें।",
             "a_en": "We can share general information about Government schemes. Please verify current eligibility, subsidy rules and application procedures on official sites like pmsuryaghar.gov.in and mnre.gov.in."},
            {"q_hi": "क्या आप ऋण मंज़ूरी की गारंटी देते हैं?",
             "q_en": "Do you guarantee loan approval?",
             "a_hi": "नहीं। वित्तीय सुविधा की उपलब्धता, ब्याज दर, पात्रता एवं शर्तें संबंधित ऋणदाता की वर्तमान नीति और अनुमोदन के अधीन हैं। हम केवल सामान्य जानकारी प्रदान करते हैं।",
             "a_en": "No. Financing availability, interest rates, eligibility and terms are subject to the respective lender's current policies and approval. We only provide general information."},
            {"q_hi": "पूछताछ करते समय कौन-सी जानकारी माँगी जाती है?",
             "q_en": "What information do you ask for during an enquiry?",
             "a_hi": "केवल पूरा नाम, मोबाइल नंबर, ईमेल, रुचि की सेवा और संदेश। हम कभी भी आधार, PAN, बैंक विवरण, OTP या पासवर्ड नहीं माँगते।",
             "a_en": "Only Full Name, Mobile, Email, Service of interest and Message. We never ask for Aadhaar, PAN, bank details, OTP or passwords."},
            {"q_hi": "क्या सोलर पैनल पर वारंटी मिलती है?",
             "q_en": "Is warranty offered on solar panels?",
             "a_hi": "आमतौर पर पैनलों पर निर्माता की 25 वर्ष तक की परफॉर्मेंस वारंटी और इनवर्टर पर 5–10 वर्ष की वारंटी उपलब्ध होती है (निर्माता की शर्तों के अनुसार)।",
             "a_en": "Panels typically come with a manufacturer's up-to-25-year performance warranty; inverters usually carry a 5–10-year warranty (subject to manufacturer terms)."},
            {"q_hi": "क्या पूछताछ के लिए कोई शुल्क है?",
             "q_en": "Is there any fee for enquiry?",
             "a_hi": "नहीं। पूछताछ और प्रारंभिक परामर्श निःशुल्क है। हम कोई एडवांस भुगतान नहीं लेते।",
             "a_en": "No. Enquiry and initial consultation are free. We do not take any advance payment."},
        ])

    # Seed downloads (informational only, no fake gov application forms)
    if await db.downloads.count_documents({}) == 0:
        await db.downloads.insert_many([
            {"title_hi": "रूफटॉप सोलर ब्रोशर (Haryana Enterprises)",
             "title_en": "Rooftop Solar Brochure (Haryana Enterprises)",
             "size": "PDF · 1.2 MB", "url": "#"},
            {"title_hi": "साइट सर्वे चेकलिस्ट",
             "title_en": "Site Survey Checklist",
             "size": "PDF · 180 KB", "url": "#"},
            {"title_hi": "सोलर सिस्टम रखरखाव गाइड",
             "title_en": "Solar System Maintenance Guide",
             "size": "PDF · 340 KB", "url": "#"},
            {"title_hi": "सरकारी योजना संदर्भ लिंक (केवल सामान्य जानकारी)",
             "title_en": "Government Scheme Reference Links (General Information Only)",
             "size": "Info · verify at pmsuryaghar.gov.in", "url": "https://pmsuryaghar.gov.in"},
        ])

    # Backfill `state` field on ALL vacancy docs (idempotent — corrects false
    # positives when the state regex is updated between releases).
    try:
        tagged = 0
        async for d in db.vacancies.find(
            {}, {"title": 1, "organization": 1, "post_name": 1, "row_text": 1, "state": 1, "category": 1, "source": 1}
        ):
            # Skip manual (admin-authored) rows — admin's state/category is authoritative
            if d.get("source") == "manual":
                continue
            st = state_from_text(
                d.get("title", ""), d.get("organization", ""),
                d.get("post_name", ""), d.get("row_text", "")
            )
            updates = {}
            if d.get("state") != st:
                updates["state"] = st
            # Category backfill — downgrade stale admit_card/result docs whose
            # current title no longer matches those categories (e.g. legacy
            # "Syllabus" articles that leaked in from earlier scraper versions).
            stored_cat = d.get("category")
            if stored_cat in ("admit_card", "result"):
                derived_cat = _cat_from_title(d.get("title", ""))
                if derived_cat != stored_cat:
                    updates["category"] = derived_cat
            if updates:
                await db.vacancies.update_one({"_id": d["_id"]}, {"$set": updates})
                tagged += 1
        if tagged:
            log.info(f"[vacancy-backfill] retagged {tagged} vacancies (state/category)")
    except Exception as e:
        log.warning(f"vacancy backfill failed: {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()


# ─────────── Background scheduler (FreeJobAlert every 6 hrs) ───────────
_scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")


@app.on_event("startup")
async def start_scheduler():
    async def _job():
        try:
            before_urls = set([v["url"] async for v in db.vacancies.find({}, {"url": 1})])
            n = await refresh_vacancies_into_db(db)
            # Always backfill so historical rows also get application_mode populated
            await backfill_application_mode(db)
            log.info(f"[scheduler] Vacancies refreshed. new={n}")
            if n > 0:
                new_docs = await db.vacancies.find({"url": {"$nin": list(before_urls)}}).to_list(n * 2)
                if new_docs:
                    await _notify_subscribers_of_new_vacancies(new_docs)
        except Exception as e:
            log.warning(f"[scheduler] Vacancy refresh failed: {e}")

    _scheduler.add_job(_job, "interval", hours=6, next_run_time=datetime.now(timezone.utc))
    _scheduler.start()
    log.info("Scheduler started (vacancies every 6h)")


@app.on_event("shutdown")
async def stop_scheduler():
    try: _scheduler.shutdown(wait=False)
    except Exception: pass
