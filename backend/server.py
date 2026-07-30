"""HARYANA ENTERPRISES - FastAPI backend."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
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
)

# MongoDB
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Haryana Enterprises API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
log = logging.getLogger("haryana")


# ---------- Models ----------
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
    application_type: str  # 'pm_surya_ghar' | 'rooftop' | 'installation'
    full_name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    state: str = "Haryana"
    pincode: str
    property_type: str  # 'residential' | 'commercial'
    roof_area_sqft: Optional[float] = None
    estimated_kw: Optional[float] = None
    monthly_bill: Optional[float] = None
    electricity_provider: Optional[str] = None
    consumer_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    notes: Optional[str] = None


class LoanApplicationIn(BaseModel):
    loan_type: str  # 'solar' | 'business' | 'personal' | 'home'
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


class GoogleAuthIn(BaseModel):
    email: EmailStr
    name: str
    picture: Optional[str] = None
    google_id: str


# ---------- Helpers ----------
def user_public(u: dict) -> dict:
    return {
        "id": str(u.get("_id") or u.get("id")),
        "name": u.get("name"),
        "email": u.get("email"),
        "phone": u.get("phone"),
        "role": u.get("role", "user"),
        "picture": u.get("picture"),
        "auth_provider": u.get("auth_provider", "email"),
    }


def application_public(a: dict) -> dict:
    a = dict(a)
    a["id"] = str(a.pop("_id", a.get("id", "")))
    if isinstance(a.get("created_at"), datetime):
        a["created_at"] = a["created_at"].isoformat()
    return a


# ---------- Root ----------
@api.get("/")
async def root():
    return {"message": "Haryana Enterprises API", "status": "ok"}


# ---------- Auth ----------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "name": payload.name,
        "email": email,
        "phone": payload.phone,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "auth_provider": "email",
        "created_at": datetime.now(timezone.utc),
    }
    res = await db.users.insert_one(doc)
    user_id = str(res.inserted_id)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    doc["_id"] = user_id
    return {"user": user_public(doc), "access_token": access}


@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"user": user_public(user), "access_token": access}


@api.post("/auth/google")
async def google_auth(payload: GoogleAuthIn, response: Response):
    """Simple Google auth stub - accepts profile from client Google Sign-In.
    In production, verify id_token with Google. Here we trust posted profile for demo.
    """
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        doc = {
            "name": payload.name,
            "email": email,
            "picture": payload.picture,
            "google_id": payload.google_id,
            "role": "user",
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc),
        }
        res = await db.users.insert_one(doc)
        user_id = str(res.inserted_id)
        doc["_id"] = user_id
        user = doc
    else:
        user_id = str(user["_id"])
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"picture": payload.picture, "google_id": payload.google_id, "auth_provider": "google"}},
        )
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"user": user_public(user), "access_token": access}


@api.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user_public(user)


# ---------- Contact ----------
@api.post("/contact")
async def create_contact(payload: ContactIn):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    res = await db.contacts.insert_one(doc)
    log.info(f"Contact submitted: {payload.email} - {payload.subject}")
    return {"id": str(res.inserted_id), "ok": True}


# ---------- Solar Applications ----------
@api.post("/solar/apply")
async def solar_apply(payload: SolarApplicationIn, request: Request):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    doc["status"] = "submitted"
    doc["ref_no"] = f"SOL-{uuid.uuid4().hex[:8].upper()}"

    # Attach user id if logged in (optional)
    try:
        user = await get_current_user(request)
        doc["user_id"] = user["id"]
    except HTTPException:
        doc["user_id"] = None

    res = await db.solar_applications.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return {"application": application_public(doc)}


@api.get("/solar/my")
async def my_solar_apps(user=Depends(get_current_user)):
    apps = await db.solar_applications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    return [application_public(a) for a in apps]


# ---------- Loan Applications ----------
@api.post("/loan/apply")
async def loan_apply(payload: LoanApplicationIn, request: Request):
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    doc["status"] = "submitted"
    doc["ref_no"] = f"LOAN-{uuid.uuid4().hex[:8].upper()}"

    try:
        user = await get_current_user(request)
        doc["user_id"] = user["id"]
    except HTTPException:
        doc["user_id"] = None

    res = await db.loan_applications.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return {"application": application_public(doc)}


@api.get("/loan/my")
async def my_loan_apps(user=Depends(get_current_user)):
    apps = await db.loan_applications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    return [application_public(a) for a in apps]


# ---------- Status Lookup (public via ref_no) ----------
@api.get("/status/{ref_no}")
async def status_lookup(ref_no: str):
    for coll in ("solar_applications", "loan_applications"):
        doc = await db[coll].find_one({"ref_no": ref_no})
        if doc:
            return application_public(doc)
    raise HTTPException(status_code=404, detail="Application not found")


# ---------- Notices, FAQ, Downloads (static seed data) ----------
@api.get("/notices")
async def get_notices():
    notices = await db.notices.find({}).sort("created_at", -1).to_list(50)
    return [application_public(n) for n in notices]


@api.get("/faqs")
async def get_faqs():
    items = await db.faqs.find({}).to_list(200)
    return [application_public(i) for i in items]


@api.get("/downloads")
async def get_downloads():
    items = await db.downloads.find({}).to_list(200)
    return [application_public(i) for i in items]


# ---------- Include router ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get("FRONTEND_URL", "*")],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ---------- Startup: indexes + seed ----------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.solar_applications.create_index("ref_no", unique=True)
    await db.loan_applications.create_index("ref_no", unique=True)

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@haryanaenterprises.com").lower()
    admin_pass = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
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
        # Keep admin password in sync with env
        if not verify_password(admin_pass, existing["password_hash"]):
            await db.users.update_one(
                {"email": admin_email},
                {"$set": {"password_hash": hash_password(admin_pass)}},
            )

    # Seed test user
    test_email = "user@test.com"
    if not await db.users.find_one({"email": test_email}):
        await db.users.insert_one({
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
