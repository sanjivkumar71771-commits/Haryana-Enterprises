"""HARYANA ENTERPRISES - FastAPI backend."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List

import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Body
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
    if isinstance(a.get("created_at"), datetime):
        a["created_at"] = a["created_at"].isoformat()
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


# ─────────── Contact ───────────
@api.post("/contact")
async def create_contact(payload: ContactIn):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    res = await db.contacts.insert_one(doc)
    log.info(f"Contact submitted: {payload.email} - {payload.subject}")
    return {"id": str(res.inserted_id), "ok": True}


# ─────────── Solar / Loan Applications ───────────
async def _optional_user(request: Request):
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


@api.post("/solar/apply")
async def solar_apply(payload: SolarApplicationIn, request: Request):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    doc["status"] = "submitted"
    doc["ref_no"] = f"SOL-{uuid.uuid4().hex[:8].upper()}"
    u = await _optional_user(request)
    doc["user_id"] = u["id"] if u else None
    res = await db.solar_applications.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return {"application": doc_public(doc)}


@api.get("/solar/my")
async def my_solar_apps(user=Depends(get_current_user)):
    apps = await db.solar_applications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    return [doc_public(a) for a in apps]


@api.post("/loan/apply")
async def loan_apply(payload: LoanApplicationIn, request: Request):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    doc["status"] = "submitted"
    doc["ref_no"] = f"LOAN-{uuid.uuid4().hex[:8].upper()}"
    u = await _optional_user(request)
    doc["user_id"] = u["id"] if u else None
    res = await db.loan_applications.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return {"application": doc_public(doc)}


@api.get("/loan/my")
async def my_loan_apps(user=Depends(get_current_user)):
    apps = await db.loan_applications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    return [doc_public(a) for a in apps]


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


# ─────────── ADMIN ROUTES ───────────
@api.get("/admin/stats")
async def admin_stats(_=Depends(require_admin)):
    return {
        "users": await db.users.count_documents({}),
        "solar_apps": await db.solar_applications.count_documents({}),
        "loan_apps": await db.loan_applications.count_documents({}),
        "contacts": await db.contacts.count_documents({}),
        "solar_pending": await db.solar_applications.count_documents({"status": "submitted"}),
        "loan_pending": await db.loan_applications.count_documents({"status": "submitted"}),
        "solar_approved": await db.solar_applications.count_documents({"status": "approved"}),
        "loan_approved": await db.loan_applications.count_documents({"status": "approved"}),
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


# ─────────── Include router + CORS ───────────
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get("FRONTEND_URL", "*")],
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
        if not verify_password(admin_pass, existing["password_hash"]):
            await db.users.update_one(
                {"email": admin_email},
                {"$set": {"password_hash": hash_password(admin_pass)}},
            )
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

    # Seed notices
    if await db.notices.count_documents({}) == 0:
        await db.notices.insert_many([
            {"title_hi": "PM सूर्य घर योजना के लिए आवेदन शुरू - सब्सिडी ₹78,000 तक",
             "title_en": "PM Surya Ghar Yojana applications open - Subsidy up to ₹78,000",
             "type": "important", "created_at": datetime.now(timezone.utc)},
            {"title_hi": "रूफटॉप सोलर पर 40% तक की सब्सिडी उपलब्ध",
             "title_en": "Up to 40% subsidy available on Rooftop Solar",
             "type": "update", "created_at": datetime.now(timezone.utc)},
            {"title_hi": "सोलर लोन 7.5% ब्याज दर पर उपलब्ध",
             "title_en": "Solar loans available at 7.5% interest rate",
             "type": "update", "created_at": datetime.now(timezone.utc)},
            {"title_hi": "किसानों के लिए विशेष KUSUM योजना",
             "title_en": "Special KUSUM scheme for farmers",
             "type": "important", "created_at": datetime.now(timezone.utc)},
            {"title_hi": "हरियाणा एंटरप्राइजेज कागदाना (सिरसा) में सेवा उपलब्ध",
             "title_en": "Haryana Enterprises services available in Kagdana (Sirsa)",
             "type": "info", "created_at": datetime.now(timezone.utc)},
        ])

    # Seed FAQs
    if await db.faqs.count_documents({}) == 0:
        await db.faqs.insert_many([
            {"q_hi": "PM सूर्य घर योजना क्या है?",
             "q_en": "What is the PM Surya Ghar Yojana?",
             "a_hi": "यह एक केंद्र सरकार की योजना है जिसमें रूफटॉप सोलर पैनल लगाने पर ₹78,000 तक की सब्सिडी मिलती है और मुफ्त बिजली प्राप्त कर सकते हैं।",
             "a_en": "It is a central government scheme providing subsidy up to ₹78,000 for installing rooftop solar panels, enabling free electricity."},
            {"q_hi": "3 kW सोलर सिस्टम की कीमत क्या है?",
             "q_en": "What is the cost of a 3 kW solar system?",
             "a_hi": "3 kW सोलर सिस्टम की अनुमानित लागत ₹1.8 – 2.2 लाख होती है, जिस पर सरकारी सब्सिडी के बाद ₹1 लाख तक की बचत होती है।",
             "a_en": "Approx cost is ₹1.8–2.2 lakh; after government subsidy you can save up to ₹1 lakh."},
            {"q_hi": "लोन कितने समय में मंजूर होता है?",
             "q_en": "How long does loan approval take?",
             "a_hi": "दस्तावेज़ पूरे होने पर आमतौर पर 5–7 कार्य दिवसों में लोन मंजूर हो जाता है।",
             "a_en": "With complete documents, loan approval usually happens within 5–7 working days."},
            {"q_hi": "किन दस्तावेज़ों की आवश्यकता है?",
             "q_en": "Which documents are required?",
             "a_hi": "आधार कार्ड, पैन कार्ड, बिजली बिल, बैंक स्टेटमेंट, आय प्रमाण, और संपत्ति के दस्तावेज़।",
             "a_en": "Aadhaar, PAN, electricity bill, bank statement, income proof, and property documents."},
            {"q_hi": "क्या सोलर पैनल पर वारंटी मिलती है?",
             "q_en": "Is warranty offered on solar panels?",
             "a_hi": "हाँ, पैनलों पर 25 वर्ष तक की परफॉर्मेंस वारंटी और इनवर्टर पर 5–10 वर्ष की वारंटी मिलती है।",
             "a_en": "Yes, panels come with up to 25-year performance warranty and inverters have 5–10 year warranty."},
        ])

    # Seed downloads
    if await db.downloads.count_documents({}) == 0:
        await db.downloads.insert_many([
            {"title_hi": "PM सूर्य घर आवेदन फॉर्म", "title_en": "PM Surya Ghar Application Form",
             "size": "PDF · 250 KB", "url": "#"},
            {"title_hi": "सोलर सब्सिडी गाइडलाइन", "title_en": "Solar Subsidy Guidelines",
             "size": "PDF · 480 KB", "url": "#"},
            {"title_hi": "लोन आवेदन चेकलिस्ट", "title_en": "Loan Application Checklist",
             "size": "PDF · 180 KB", "url": "#"},
            {"title_hi": "रूफटॉप सोलर ब्रोशर", "title_en": "Rooftop Solar Brochure",
             "size": "PDF · 1.2 MB", "url": "#"},
        ])


@app.on_event("shutdown")
async def shutdown():
    client.close()
