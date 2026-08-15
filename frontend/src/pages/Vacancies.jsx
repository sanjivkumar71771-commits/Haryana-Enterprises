import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import JobAlertSubscribe from "@/components/JobAlertSubscribe";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { FaSearch, FaExternalLinkAlt, FaSync, FaCalendarAlt, FaBriefcase, FaClock, FaChevronRight, FaGraduationCap, FaBuilding, FaFileAlt, FaGlobe, FaShareAlt, FaBookmark, FaRegBookmark, FaMapMarkerAlt } from "react-icons/fa";
import ShareModal from "@/components/poster/ShareModal";
import SEO from "@/components/SEO";

const extractPostsFromText = (str) =>
  str && String(str).match(/(\d[\d,]*)\s*(post|vacan|seat)/i)?.[1];

const toPosterVacancy = (v) => {
  const s = v.structured || {};
  const highlights = [];
  if (v.post_name) highlights.push(`Post: ${v.post_name}`);
  if (v.qualification) highlights.push(v.qualification);
  if (s.application_fee) highlights.push(`Fee: ${s.application_fee}`);
  if (s.salary) highlights.push(`Salary: ${s.salary}`);
  highlights.push("For More Details Read Official Notification");
  const totalPosts =
    (s.total_posts && String(s.total_posts).match(/\d[\d,]*/)?.[0]) ||
    extractPostsFromText(v.post_name) ||
    extractPostsFromText(v.title) ||
    s.total_posts ||
    "As per notification";
  return {
    id: v.id,
    jobTitle: v.post_name || v.title || "Government Vacancy",
    organization: v.organization || v.title || "—",
    totalPosts,
    qualification: v.qualification || "As per notification",
    lastDate: v.last_date_text || s.apply_end || "As per notification",
    lastDateNote: "",
    jobType: v.application_mode === "offline" ? "Offline Form Job"
           : v.application_mode === "online" ? "Online Form Job"
           : "Government Job",
    location: s.location || "As per notification",
    selectionProcess: s.selection_process || "As per official notification",
    highlights: highlights.slice(0, 5),
  };
};

const CAT_LABELS = {
  all: { hi: "सभी", en: "All" },
  admit_card: { hi: "एडमिट कार्ड", en: "Admit Card" },
  result: { hi: "रिज़ल्ट", en: "Result" },
  ssc: { hi: "SSC", en: "SSC" },
  railway: { hi: "रेलवे", en: "Railway" },
  bank: { hi: "बैंक", en: "Bank" },
  police: { hi: "पुलिस", en: "Police" },
  upsc: { hi: "UPSC", en: "UPSC" },
  defence: { hi: "रक्षा", en: "Defence" },
  teaching: { hi: "शिक्षक", en: "Teacher" },
  medical: { hi: "मेडिकल", en: "Medical" },
  psu: { hi: "PSU", en: "PSU" },
  haryana: { hi: "हरियाणा", en: "Haryana" },
  other: { hi: "अन्य", en: "Other" },
};

const QUALIFICATIONS = [
  { key: "all", hi: "सभी योग्यता", en: "All Qualifications" },
  { key: "10th", hi: "10वीं", en: "10th" },
  { key: "12th", hi: "12वीं", en: "12th" },
  { key: "iti", hi: "ITI", en: "ITI" },
  { key: "diploma", hi: "डिप्लोमा", en: "Diploma" },
  { key: "graduate", hi: "स्नातक", en: "Graduate" },
  { key: "engineer", hi: "इंजीनियरिंग", en: "B.Tech/B.E" },
  { key: "post", hi: "पोस्ट ग्रेजुएट", en: "Post Graduate" },
];

const STATES = [
  { key: "all",              hi: "सभी राज्य",         en: "All States" },
  { key: "haryana",          hi: "हरियाणा",          en: "Haryana" },
  { key: "delhi",            hi: "दिल्ली",           en: "Delhi" },
  { key: "punjab",           hi: "पंजाब",            en: "Punjab" },
  { key: "rajasthan",        hi: "राजस्थान",         en: "Rajasthan" },
  { key: "chandigarh",       hi: "चंडीगढ़",          en: "Chandigarh" },
  { key: "himachal-pradesh", hi: "हिमाचल प्रदेश",     en: "Himachal Pradesh" },
  { key: "uttarakhand",      hi: "उत्तराखंड",        en: "Uttarakhand" },
  { key: "uttar-pradesh",    hi: "उत्तर प्रदेश",      en: "Uttar Pradesh" },
  { key: "madhya-pradesh",   hi: "मध्य प्रदेश",       en: "Madhya Pradesh" },
  { key: "bihar",            hi: "बिहार",            en: "Bihar" },
  { key: "jharkhand",        hi: "झारखंड",          en: "Jharkhand" },
  { key: "gujarat",          hi: "गुजरात",          en: "Gujarat" },
  { key: "maharashtra",      hi: "महाराष्ट्र",       en: "Maharashtra" },
  { key: "karnataka",        hi: "कर्नाटक",         en: "Karnataka" },
  { key: "tamil-nadu",       hi: "तमिलनाडु",        en: "Tamil Nadu" },
  { key: "kerala",           hi: "केरल",            en: "Kerala" },
  { key: "andhra-pradesh",   hi: "आंध्र प्रदेश",      en: "Andhra Pradesh" },
  { key: "telangana",        hi: "तेलंगाना",         en: "Telangana" },
  { key: "west-bengal",      hi: "पश्चिम बंगाल",      en: "West Bengal" },
  { key: "odisha",           hi: "ओडिशा",           en: "Odisha" },
  { key: "chhattisgarh",     hi: "छत्तीसगढ़",        en: "Chhattisgarh" },
  { key: "assam",            hi: "असम",             en: "Assam" },
  { key: "jammu-kashmir",    hi: "जम्मू-कश्मीर",     en: "Jammu & Kashmir" },
];

// Local bookmarks (saved vacancies) — stored in localStorage under this key.
const BOOKMARK_KEY = "he_saved_vacancies_v1";
const readBookmarks = () => {
  try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]"); }
  catch { return []; }
};
const writeBookmarks = (ids) => {
  try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify(ids)); } catch {}
};

// Compute days remaining from a "dd-mm-yyyy" style string
const daysRemaining = (txt) => {
  if (!txt) return null;
  const m = txt.match(/(\d{1,2})[-./ ](\d{1,2})[-./ ](\d{2,4})/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const yyyy = y.length === 2 ? `20${y}` : y;
  const dt = new Date(`${yyyy}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T23:59:59`);
  if (isNaN(dt.getTime())) return null;
  const diff = Math.ceil((dt - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

const Vacancies = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [category, setCategory] = useState("all");
  const [qualification, setQualification] = useState("all");
  const [mode, setMode] = useState("all"); // all | online | offline
  const [state, setState] = useState("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => readBookmarks());
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [shareVac, setShareVac] = useState(null);

  const toggleBookmark = (id) => {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      writeBookmarks(next);
      const isSaved = next.includes(id);
      toast.success(isSaved
        ? (lang === "hi" ? "भर्ती सहेजी गई" : "Vacancy saved")
        : (lang === "hi" ? "बुकमार्क हटाया गया" : "Bookmark removed"));
      return next;
    });
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (qualification !== "all") params.set("qualification", qualification);
      if (mode !== "all") params.set("mode", mode);
      if (state !== "all") params.set("state", state);
      if (q) params.set("q", q);
      const [r1, r2] = await Promise.all([
        api.get(`/vacancies?${params.toString()}`),
        api.get(`/vacancies/stats`),
      ]);
      setItems(r1.data);
      setStats(r2.data);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [category, qualification, mode, state]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const { data } = await api.post("/admin/vacancies/refresh");
      toast.success(`${lang === "hi" ? "अपडेट हो गया" : "Refreshed"}: +${data.new_added} new · ${data.total} total`);
      await load();
    } catch (e) {
      toast.error(e.response?.status === 403 ? "Admin only" : "Refresh failed");
    } finally { setRefreshing(false); }
  };

  const filtered = useMemo(() => {
    // Dedupe by URL to guarantee no duplicate cards even if the DB has near-duplicates
    const seen = new Set();
    const list = [];
    for (const it of items) {
      const key = it.url || it.id;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(it);
    }
    // mode is filtered server-side, only apply text search + saved-only client-side
    let base = list;
    if (savedOnly) {
      base = base.filter(i => bookmarks.includes(i.id));
    }
    if (!q) return base;
    const s = q.toLowerCase();
    return base.filter(i =>
      i.title?.toLowerCase().includes(s) ||
      i.organization?.toLowerCase().includes(s) ||
      i.post_name?.toLowerCase().includes(s)
    );
  }, [items, q, savedOnly, bookmarks]);

  // Mode counts come from DB stats (full dataset) — matches category counter above.
  const modeCounts = useMemo(() => {
    const all = stats?.total ?? 0;
    const online = stats?.by_mode?.online ?? 0;
    const offline = stats?.by_mode?.offline ?? 0;
    const other = Math.max(0, all - online - offline);
    return { all, online, offline, other };
  }, [stats]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" data-testid="vacancies-page">
      <SEO
        title={lang === "hi" ? "ताज़ा सरकारी भर्तियाँ · Job Alerts" : "Latest Government Vacancies · Job Alerts"}
        description={lang === "hi"
          ? "ताज़ा सरकारी भर्तियों की सूची — पात्रता, अंतिम तिथि, आवेदन शुल्क और वेतन। SSC, Railway, Bank, UPSC, Defence, Teaching. छात्रों के लिए मुफ्त Job Alerts।"
          : "Latest government job vacancies — eligibility, last date, application fee & salary. SSC, Railway, Bank, UPSC, Defence, Teaching. Free job alerts for students."}
        path="/vacancies"
      />
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="section-eyebrow">Live Jobs Feed</div>
          <h1 className="section-title !text-3xl md:!text-4xl">
            {lang === "hi" ? (<>ताज़ा <span className="text-amber-400">सरकारी भर्तियाँ</span></>) : (<>Latest <span className="text-amber-400">Government Vacancies</span></>)}
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            {lang === "hi" ? "हर 6 घंटे में automatic update।" : "Auto-updated every 6 hours."}
            {stats?.last_updated && (
              <span className="ml-2 text-emerald-400"><FaClock className="inline mr-1" /> {new Date(stats.last_updated).toLocaleString()}</span>
            )}
          </p>
        </div>
        {user && user.role === "admin" && (
          <button onClick={refresh} disabled={refreshing} className="btn-mint" data-testid="vacancies-refresh-btn">
            <FaSync className={refreshing ? "animate-spin" : ""} /> {lang === "hi" ? "अभी अपडेट करें" : "Refresh Now"}
          </button>
        )}
      </div>

      {/* Job Alert Subscription (Free) */}
      <JobAlertSubscribe />

      {/* Search + Filters — premium panel with subtle gradient border */}
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-emerald-500/30 via-transparent to-amber-500/20 mb-6" data-testid="vacancies-filter-panel">
        <div className="glass-strong rounded-2xl p-5 space-y-4 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-amber-500/8 blur-3xl pointer-events-none"></div>
          <div className="relative flex flex-col md:flex-row gap-3">
            <form onSubmit={(e) => { e.preventDefault(); load(); }} className="input-icon-wrap flex-1">
              <FaSearch className="icon" />
              <input className="input" placeholder={lang === "hi" ? "खोजें… (SSC, PNB, teacher…)" : "Search… (SSC, PNB, teacher…)"}
                value={q} onChange={(e) => setQ(e.target.value)} data-testid="vacancies-search" />
            </form>
            <select
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="input md:w-56"
              data-testid="vacancies-qualification-filter"
            >
              {QUALIFICATIONS.map(qOpt => (
                <option key={qOpt.key} value={qOpt.key}>{lang === "hi" ? qOpt.hi : qOpt.en}</option>
              ))}
            </select>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="input md:w-56"
              data-testid="vacancies-state-filter"
              aria-label={lang === "hi" ? "राज्य चुनें" : "Select State"}
            >
              {STATES.map(s => {
                const cnt = s.key === "all"
                  ? undefined
                  : stats?.by_state?.find(x => x.state === s.key)?.count;
                return (
                  <option key={s.key} value={s.key}>
                    {lang === "hi" ? s.hi : s.en}
                    {typeof cnt === "number" ? ` (${cnt})` : ""}
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              onClick={() => setSavedOnly(v => !v)}
              data-testid="vacancies-saved-only-toggle"
              className={`vac-mode-chip px-3 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                savedOnly
                  ? "is-active-amber bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40"
                  : ""
              }`}
              title={lang === "hi" ? "सहेजी गई भर्तियाँ दिखाएँ" : "Show saved vacancies"}
            >
              <FaBookmark className="inline mr-1 text-[10px]" />
              {lang === "hi" ? "सहेजी गईं" : "Saved"} ({bookmarks.length})
            </button>
          </div>

          {/* Attractive category chips — color-coded gradient pills with icon dots */}
          <div className="relative flex gap-2 overflow-x-auto pb-1" data-testid="vacancies-cat-row">
            {Object.entries(CAT_LABELS).map(([k, v]) => {
              const cnt = k === "all" ? stats?.total : stats?.by_category?.find(c => c.category === k)?.count;
              const isActive = category === k;
              // Color tokens per category — distinct so they're scannable
              const palette = {
                all:        { on: "from-emerald-500 to-teal-500", dot: "bg-emerald-400" },
                admit_card: { on: "from-sky-500 to-cyan-500",     dot: "bg-sky-400" },
                result:     { on: "from-violet-500 to-fuchsia-500", dot: "bg-violet-400" },
                ssc:        { on: "from-indigo-500 to-blue-500",  dot: "bg-indigo-400" },
                railway:    { on: "from-orange-500 to-amber-500", dot: "bg-orange-400" },
                bank:       { on: "from-emerald-500 to-green-500", dot: "bg-emerald-400" },
                police:     { on: "from-blue-600 to-indigo-600",  dot: "bg-blue-400" },
                upsc:       { on: "from-rose-500 to-pink-500",    dot: "bg-rose-400" },
                defence:    { on: "from-slate-600 to-slate-700",  dot: "bg-slate-300" },
                teaching:   { on: "from-purple-500 to-fuchsia-500", dot: "bg-purple-400" },
                medical:    { on: "from-red-500 to-rose-500",     dot: "bg-red-400" },
                psu:        { on: "from-yellow-500 to-orange-500", dot: "bg-yellow-400" },
                haryana:    { on: "from-amber-500 to-yellow-500", dot: "bg-amber-400" },
                other:      { on: "from-slate-500 to-slate-600",  dot: "bg-slate-400" },
              }[k] || { on: "from-slate-500 to-slate-600", dot: "bg-slate-400" };
              return (
                <button key={k} onClick={() => setCategory(k)}
                  className={`vac-cat-chip shrink-0 group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? `is-active bg-gradient-to-r ${palette.on} text-white border-white/30 shadow-lg shadow-emerald-500/20 scale-105`
                      : "hover:scale-[1.03]"
                  }`}
                  data-testid={`vac-cat-${k}`}>
                  <span className={`vac-cat-dot w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : palette.dot} ${isActive ? "" : "group-hover:scale-125"} transition-transform`}></span>
                  {lang === "hi" ? v.hi : v.en}
                  {cnt !== undefined && (
                    <span className={`vac-cat-count ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? "bg-white/25 text-white" : ""
                    }`}>{cnt}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Application Mode Filter */}
          <div className="vac-mode-sep relative flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
            <span className="vac-mode-label text-[10px] uppercase tracking-widest text-slate-500 font-semibold mr-1">
              {lang === "hi" ? "आवेदन प्रकार" : "Application Mode"}:
            </span>
            {[
              { k: "all", hi: "सभी", en: "All" },
              { k: "online", hi: "ऑनलाइन फॉर्म", en: "Online Form" },
              { k: "offline", hi: "ऑफलाइन फॉर्म", en: "Offline Form" },
              { k: "other", hi: "अन्य", en: "Other" },
            ].map(m => (
              <button
                key={m.k}
                onClick={() => setMode(m.k)}
                className={`vac-mode-chip px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  mode === m.k
                    ? (m.k === "offline"
                        ? "is-active-amber bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40"
                        : "is-active-emerald bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30")
                    : ""
                }`}
                data-testid={`vac-mode-${m.k}`}
              >
                {lang === "hi" ? m.hi : m.en} ({modeCounts[m.k] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vacancy list */}
      {loading ? (
        <div className="glass p-10 text-center text-slate-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="glass p-10 text-center text-slate-500">
          <FaBriefcase className="text-4xl mx-auto mb-3 opacity-40" />
          {lang === "hi" ? "कोई भर्ती नहीं मिली।" : "No vacancies found."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="vacancies-list">
          {filtered.map((v, i) => {
            const days = daysRemaining(v.last_date_text);
            const urgent = days !== null && days >= 0 && days <= 3;
            const expired = (v.is_expired === true) || (days !== null && days < 0);
            return (
              <Link key={v.id || v.url + i} to={`/vacancies/${v.id}`}
                className={`glass p-4 hover:border-emerald-500/40 transition group block relative ${expired ? "opacity-60" : ""} ${urgent ? "ring-2 ring-red-500/40" : ""}`}
                data-testid={`vacancy-${i}`}>
                {/* URGENT / EXPIRED banner — bright, top strip so it's the first thing users notice */}
                {expired && (
                  <div className="absolute -top-2 left-3 z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700 text-slate-200 text-[10px] font-bold uppercase tracking-widest shadow" data-testid={`vacancy-expired-${i}`}>
                    <FaClock className="text-[10px]" /> {lang === "hi" ? "समाप्त" : "Expired"}
                  </div>
                )}
                {urgent && !expired && (
                  <div className="absolute -top-2 left-3 z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-lg shadow-red-500/40 animate-pulse" data-testid={`vacancy-urgent-${i}`}>
                    <FaClock className="text-[10px]" />
                    {days === 0
                      ? (lang === "hi" ? "आज अंतिम दिन!" : "LAST DAY!")
                      : (lang === "hi" ? `केवल ${days} दिन बाकी` : `Only ${days} day${days === 1 ? "" : "s"} left`)}
                  </div>
                )}
                {/* Share Poster floating button — pill style so users understand it's a poster share */}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareVac(toPosterVacancy(v)); }}
                  className="absolute top-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/30 z-10 transition-transform hover:scale-105 border border-emerald-300/40"
                  data-testid={`vacancy-share-${i}`}
                  title={lang === "hi" ? "पोस्टर बनाएँ और शेयर करें" : "Generate poster & share"}
                  aria-label="Share vacancy poster"
                >
                  <FaShareAlt className="text-[10px]" />
                  <span className="tracking-wide">{lang === "hi" ? "पोस्टर" : "POSTER"}</span>
                </button>
                {/* Save / bookmark toggle — sits just under the share pill so it's still thumb-friendly */}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark(v.id); }}
                  className={`absolute top-10 right-2 inline-flex items-center justify-center w-7 h-7 rounded-full z-10 transition-all border shadow ${
                    bookmarks.includes(v.id)
                      ? "bg-amber-500 text-white border-amber-300 hover:bg-amber-600"
                      : "bg-white/90 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-600"
                  }`}
                  data-testid={`vacancy-save-${i}`}
                  aria-pressed={bookmarks.includes(v.id)}
                  title={bookmarks.includes(v.id)
                    ? (lang === "hi" ? "बुकमार्क हटाएँ" : "Remove bookmark")
                    : (lang === "hi" ? "बाद के लिए सहेजें" : "Save for later")}
                >
                  {bookmarks.includes(v.id) ? <FaBookmark className="text-[11px]" /> : <FaRegBookmark className="text-[11px]" />}
                </button>
                <div className="flex items-start justify-between gap-2 mb-2 pr-10">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="chip !text-[10px] uppercase">{CAT_LABELS[v.category]?.[lang] || v.category || "Job"}</span>
                    {v.state && (
                      <span className="chip !text-[10px] !bg-fuchsia-500/10 !text-fuchsia-700 !border-fuchsia-500/30" data-testid={`vacancy-state-${i}`}>
                        <FaMapMarkerAlt className="inline mr-1 text-[9px]" />
                        {STATES.find(s => s.key === v.state)?.[lang] || v.state}
                      </span>
                    )}
                    {v.organization && (
                      <span className="chip !text-[10px] !bg-sky-500/10 !text-sky-300 !border-sky-500/30">
                        <FaBuilding className="inline mr-1 text-[9px]" />{v.organization}
                      </span>
                    )}
                    {v.application_mode === "offline" && (
                      <span className="chip !text-[10px] !bg-amber-500/15 !text-amber-300 !border-amber-500/40" data-testid={`vacancy-mode-offline-${i}`}>
                        <FaFileAlt className="inline mr-1 text-[9px]" /> {lang === "hi" ? "ऑफलाइन फॉर्म" : "Offline Form"}
                      </span>
                    )}
                    {v.application_mode === "online" && (
                      <span className="chip !text-[10px] !bg-emerald-500/10 !text-emerald-300 !border-emerald-500/30" data-testid={`vacancy-mode-online-${i}`}>
                        <FaGlobe className="inline mr-1 text-[9px]" /> {lang === "hi" ? "ऑनलाइन फॉर्म" : "Online Form"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="font-semibold text-white text-sm mb-2 leading-snug line-clamp-3">
                  {v.post_name || v.title}
                </div>
                {v.qualification && (
                  <div className="text-[11px] text-slate-400 mb-2 line-clamp-1">
                    <FaGraduationCap className="inline mr-1 text-emerald-400" />{v.qualification}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  {v.last_date_text && (
                    <span className={urgent ? "text-red-400 font-semibold" : expired ? "text-slate-600 line-through" : ""}>
                      <FaCalendarAlt className="inline mr-1 text-amber-400" /> {v.last_date_text}
                      {days !== null && days >= 0 && !expired && (
                        <span className={`ml-1 ${urgent ? "text-red-400" : "text-emerald-400"}`}>
                          ({days === 0 ? (lang === "hi" ? "आज" : "today") : lang === "hi" ? `${days} दिन बाकी` : `${days}d left`})
                        </span>
                      )}
                      {expired && <span className="ml-1">({lang === "hi" ? "समाप्त" : "closed"})</span>}
                    </span>
                  )}
                  <span className="ml-auto text-emerald-400">{lang === "hi" ? "विवरण देखें" : "View Details"} <FaChevronRight className="inline text-[10px]" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {shareVac && (
        <ShareModal vacancy={shareVac} onClose={() => setShareVac(null)} />
      )}
    </div>
  );
};

export default Vacancies;
