# 🚂 Railway Deployment — Zero se 24/7 Live

**Time**: ~30 mins · **Cost**: Free trial ($5 credit ≈ 500 hours) · **Result**: App 24/7 live + scraper cron chalta rahe

---

## ✅ PART 1: Pre-requisites (5 mins)

### 1.1 GitHub account
- Agar nahi hai → https://github.com/signup pe free account bana lo
- Verify your email

### 1.2 Code ko GitHub pe push karo
- **Emergent chat ke top-right corner me "Save to GitHub" button dabao**
- Ek naya private/public repo ban jayega (naam jaise `haryana-enterprises`)
- Repo URL copy kar lo: `https://github.com/<aapka-username>/haryana-enterprises`

### 1.3 Railway account
- https://railway.app pe jao → **Sign in with GitHub** click karo
- GitHub authorize karo
- Railway aapko $5 free credit dega (~500 hours of usage)

### 1.4 MongoDB Atlas (Free — Zaroori!)
Railway MongoDB provide nahi karta, isliye Atlas ka free tier use karenge:
1. https://cloud.mongodb.com pe jao → Sign up (Google/email)
2. **"Build a Database"** → **M0 (FREE)** → Region: **Mumbai (ap-south-1)**
3. Cluster name: `haryana-cluster` → Create (2-3 min lagenge)
4. **Database Access** (left sidebar) → Add New Database User
   - Username: `haryana`
   - Password: strong password generate karo → **copy karke save karo** 🔒
   - Role: Read and write to any database
5. **Network Access** → Add IP Address → **Allow Access from Anywhere (0.0.0.0/0)** ✔
6. **Database** → Connect → **Drivers** → Python → connection string copy karo:
   ```
   mongodb+srv://haryana:<password>@haryana-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   `<password>` ko actual password se replace karo. Ye string save rakho.

---

## ✅ PART 2: Railway par Deploy (10 mins)

### 2.1 New Project
1. https://railway.app/new click karo
2. **"Deploy from GitHub repo"** select karo
3. `haryana-enterprises` repo choose karo (agar nahi dikh raha → **Configure GitHub App** karke access do)
4. Railway automatic detect karega ki 2 services hain: `backend` + `frontend`

### 2.2 Backend Service Setup
Railway apne aap ek service create karega. Us par click karke:

**Settings → Root Directory**: `backend`
**Settings → Build Command**: `pip install -r requirements.txt`
**Settings → Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

**Variables tab me add karo** (Add Variable button):
```
MONGO_URL=mongodb+srv://haryana:<password>@haryana-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=haryana_enterprises
CORS_ORIGINS=*
JWT_SECRET=<koi 32-char random string, jaise: kX9mNv2pQ8rT4wY6zA1bC3dE5fG7hJ0i>
JWT_ALG=HS256
FRONTEND_URL=https://<jab-frontend-deploy-ho-jaye-toh-add-karenge>
```

**Deploy** button dabao. 3-5 min me deploy ho jayega.

Deploy hone ke baad **Settings → Domains → Generate Domain** click karo. 
URL milega jaise: `https://haryana-backend-production.up.railway.app`
Isko note kar lo (backend URL).

**Test**: Browser me `<backend-url>/api/` khol ke check karo — `{"message":"Haryana Enterprises API","status":"ok"}` aana chahiye.

### 2.3 Frontend Service Setup
Left sidebar → **+ New** → **GitHub Repo** → same repo select karo → naya service ban jayega.

**Settings → Root Directory**: `frontend`
**Settings → Build Command**: `yarn install && yarn build`
**Settings → Start Command**: `npx serve -s build -l $PORT`

**Variables tab me add karo**:
```
REACT_APP_BACKEND_URL=https://haryana-backend-production.up.railway.app
```
(Actual backend URL jo Step 2.2 me mila tha)

**Deploy** → 5-8 min lagenge (React build slow hota hai).

Deploy hone ke baad **Settings → Domains → Generate Domain** click karo. 
Frontend URL milega jaise: `https://haryana-enterprises-production.up.railway.app`

### 2.4 CORS Fix (important)
Backend service pe wapas jao → Variables → `CORS_ORIGINS` ko update karo:
```
CORS_ORIGINS=https://haryana-enterprises-production.up.railway.app
```
Aur `FRONTEND_URL` bhi wahi rakho. Redeploy apne aap ho jayega.

---

## ✅ PART 3: Verify Everything Works (5 mins)

1. Frontend URL browser me kholo
2. **/vacancies** page pe jao — 250+ jobs load hone chahiye
3. Admin login karo: `admin@haryanaenterprises.com` / `Admin@123`
4. Admin panel me ek solar application ka status change karke test karo
5. Job alert subscription form fill karke check karo
6. Wait 6 hours (ya admin panel se "Refresh Now" click karo) — scraper ka log dekho:
   - Railway backend service → **Deployments → View Logs** → dekho `[scheduler] Vacancies refreshed. new=X`

---

## 🎯 Custom Domain (Optional)

Agar aapke paas domain hai (jaise `haryanaenterprises.in`):
- Railway → Frontend service → Settings → Domains → **Add Custom Domain**
- Railway ek CNAME record deta hai
- Aap apne DNS provider (GoDaddy/Namecheap/etc) pe ye CNAME add karo
- 10-20 min me SSL auto-issue ho jayega

---

## 💰 Cost Estimate

| Service | Free Tier | Paid |
|---|---|---|
| Railway (Hobby plan) | $5 credit/month | ~$5-10/month for both services combined |
| MongoDB Atlas M0 | 512MB free forever | — |
| Custom domain | — | ₹800-1200/year (aap ki domain company) |

**Total for 24/7**: ~₹450-850/month after free credit exhausted.

---

## 🔧 Common Issues

### "Application error" on frontend
→ REACT_APP_BACKEND_URL glat hai. Railway → frontend variables check karo, redeploy karo.

### CORS error in console
→ Backend ka CORS_ORIGINS me exact frontend URL daalo (trailing slash ke bina).

### "MongoServerError: bad auth"
→ Atlas password me special characters hain (`@`, `:`, `/`) → URL-encode karo ya password change kar do simple only-alphanumeric.

### Scraper nahi chal raha
→ Backend logs check karo (Railway → service → Deployments → View Logs). Search karo `Scheduler started`. Agar `next_run_time` puraana hai to service restart karo (Settings → Restart).

### Free credit khatam ho gaya
→ Railway → Settings → **Add Payment Method** → $5/month Hobby plan → 24/7 chalta rahega.

---

## 📞 Stuck? Ye batao mujhe:
- Kis step pe atak gaye
- Exact error message (screenshot ho to best)
- Railway deployment logs

Main aapko yahan se help kar dunga next step!

---

**Ready to start?** Part 1.2 (GitHub push) se shuru karo — jab GitHub pe repo push ho jaye, mujhe URL bhejo taaki main aage guide karun.
