import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import JobAlertSubscribe from "@/components/JobAlertSubscribe";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { FaSearch, FaExternalLinkAlt, FaSync, FaCalendarAlt, FaBriefcase, FaClock, FaChevronRight, FaGraduationCap, FaBuilding, FaFileAlt, FaGlobe, FaShareAlt } from "react-icons/fa";
import ShareModal from "@/components/poster/ShareModal";

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
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [shareVac, setShareVac] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (qualification !== "all") params.set("qualification", qualification);
      if (mode !== "all") params.set("mode", mode);
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

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [category, qualification, mode]);

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
    // mode is now filtered server-side, only apply text search client-side
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(i =>
      i.title?.toLowerCase().includes(s) ||
      i.organization?.toLowerCase().includes(s) ||
      i.post_name?.toLowerCase().includes(s)
    );
  }, [items, q]);

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

      {/* Search + Filters */}
      <div className="glass p-4 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
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
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Object.entries(CAT_LABELS).map(([k, v]) => {
            const cnt = k === "all" ? stats?.total : stats?.by_category?.find(c => c.category === k)?.count;
            return (
              <button key={k} onClick={() => setCategory(k)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${category === k ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-white/[0.03] text-slate-400 border border-white/10 hover:text-white"}`}
                data-testid={`vac-cat-${k}`}>
                {lang === "hi" ? v.hi : v.en} {cnt !== undefined && `(${cnt})`}
              </button>
            );
          })}
        </div>

        {/* Application Mode Filter */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mr-1">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                mode === m.k
                  ? (m.k === "offline"
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30")
                  : "bg-white/[0.03] text-slate-400 border border-white/10 hover:text-white"
              }`}
              data-testid={`vac-mode-${m.k}`}
            >
              {lang === "hi" ? m.hi : m.en} ({modeCounts[m.k] || 0})
            </button>
          ))}
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
            const expired = days !== null && days < 0;
            return (
              <Link key={v.id || v.url + i} to={`/vacancies/${v.id}`}
                className={`glass p-4 hover:border-emerald-500/40 transition group block relative ${expired ? "opacity-60" : ""}`}
                data-testid={`vacancy-${i}`}>
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
                <div className="flex items-start justify-between gap-2 mb-2 pr-10">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="chip !text-[10px] uppercase">{CAT_LABELS[v.category]?.[lang] || v.category || "Job"}</span>
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
