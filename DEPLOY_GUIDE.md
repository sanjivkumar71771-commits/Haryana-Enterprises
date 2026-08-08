# 🚀 Cloud Deployment Guide — Haryana Enterprises

## तीन options — जो पसंद आए, वो choose करें

| Option | Cost | Difficulty | Best For |
|---|---|---|---|
| **Railway** ⭐ | $5/mo (~₹420) | ⭐ Easiest | **Recommended** |
| **Render** | Free / $7/mo | ⭐ Easy | Free tier available |
| **DigitalOcean App** | $6/mo | ⭐⭐ Medium | Full control |

MongoDB के लिए **MongoDB Atlas** का free tier (M0, 512MB) use करें — हमेशा free।

---

## 🎯 Step 1: Code को GitHub पर Save करें (सभी options के लिए common)

1. Emergent chat के top-right corner पर **"Save to GitHub"** button दबाएँ
2. एक नया GitHub repo बनेगा — नाम जैसे `haryana-enterprises`
3. Repo URL note कर लें: `https://github.com/<your-username>/haryana-enterprises`

---

## 🎯 Step 2: MongoDB Atlas (Free) Setup

1. https://cloud.mongodb.com पर account बनाएँ
2. **Create → M0 (Free) cluster** → Region: Mumbai
3. Database Access में एक user बनाएँ (username + password note करें)
4. Network Access में **0.0.0.0/0** allow करें (सब IPs)
5. Connect → Drivers → Python → **connection string** copy करें
   जैसे: `mongodb+srv://user:pass@cluster0.abc.mongodb.net/?retryWrites=true`

---

## 🎯 Step 3-A: Railway पर Deploy (Recommended)

### 3.1 Sign up
1. https://railway.app पर जाएँ → **Login with GitHub**
2. New Project → **Deploy from GitHub repo** → अपनी `haryana-enterprises` repo चुनें

### 3.2 Backend service
Railway auto-detect करेगा। अगर नहीं करता:
- **Root Directory:** `backend`
- **Start command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`

**Environment Variables जोड़ें** (Settings → Variables):
```
MONGO_URL=<आपका MongoDB Atlas connection string>
DB_NAME=haryana_enterprises
JWT_SECRET=<कोई random 64-char string generate करें>
ADMIN_EMAIL=admin@haryanaenterprises.com
ADMIN_PASSWORD=Admin@123
FRONTEND_URL=<आपके frontend का Railway URL — Step 3.3 के बाद fill करें>
CORS_ORIGINS=*
```

Deploy → 2-3 minute में backend live हो जाएगा। URL note करें: `https://your-backend.up.railway.app`

### 3.3 Frontend service
Same repo, **New Service** → same repo:
- **Root Directory:** `frontend`
- **Build:** `yarn install && yarn build`
- **Start:** `npx serve -s build -l $PORT`

**Environment Variables:**
```
REACT_APP_BACKEND_URL=<Step 3.2 का backend URL>
```

Deploy → Frontend URL मिलेगा: `https://your-frontend.up.railway.app`

### 3.4 Backend में FRONTEND_URL update करें (Step 3.2 पर वापस जाएँ)
Backend Variables में `FRONTEND_URL` अब set करें और backend redeploy करें।

**Done!** ✅ Auto-updater (हर 6 घंटे में vacancy scraper) अब 24×7 चलेगा।

---

## 🎯 Step 3-B: Render पर Deploy (Alternative)

1. https://render.com → Signup with GitHub
2. **New Web Service** → GitHub repo select
3. **Backend:**
   - Root: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - Environment variables जैसे Railway में ऊपर बताए हैं
4. **Frontend (Static Site):**
   - Root: `frontend`
   - Build: `yarn install && yarn build`
   - Publish directory: `build`
   - Env: `REACT_APP_BACKEND_URL=<backend URL>`

Render का **free tier** है लेकिन 15 minute inactivity पर sleep हो जाता है। Paid ($7/mo) से हमेशा awake।

---

## 🎯 Step 4: Custom Domain (Optional)

1. GoDaddy / Namecheap / BigRock से **haryanaenterprises.com** खरीदें (~₹800/year)
2. Railway → Settings → Custom Domain → domain add करें
3. Railway देगा एक CNAME record — इसे GoDaddy DNS में add करें
4. 15-30 minute में SSL certificate auto-provision हो जाएगा

---

## ✅ Deploy के बाद Verify

- Site खोलें → homepage load हो
- Admin login (`admin@haryanaenterprises.com` / `Admin@123`) → `/admin` → Analytics tab charts दिखें
- `/vacancies` page → 200+ vacancies दिखनी चाहिए
- Backend logs check करें — `[scheduler] Vacancies refreshed. new=X` message हर 6 घंटे में
- Contact form submit करें → backend logs में email preview दिखे

---

## 💡 Tips

- **Auto-updater** (vacancy scraper) cloud पर automatically चलता रहेगा — कोई manual कुछ नहीं करना
- अगर scraper block हो जाए (rate limit), Admin panel में `/vacancies` page → "Refresh Now" button दबाकर manual trigger कर सकते हैं
- MongoDB Atlas 512MB में लगभग 50,000+ vacancies + 10,000+ users आराम से आ जाएंगे
- Site down हो जाए तो Railway में एक click में redeploy

---

## 🆘 मदद चाहिए हो तो

- Railway docs: https://docs.railway.app
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- मुझे chat में बताइए error का screenshot — मैं तुरंत solve करूँगा

**कुल Time:** ~1.5 – 2 घंटे  ·  **Monthly cost:** ~₹420 (Railway) + ₹0 (MongoDB) = **~₹420/mo**
Custom domain: +₹65/mo (₹800/year)
