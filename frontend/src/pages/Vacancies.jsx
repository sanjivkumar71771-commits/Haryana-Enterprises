import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import JobAlertSubscribe from "@/components/JobAlertSubscribe";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { FaSearch, FaExternalLinkAlt, FaSync, FaCalendarAlt, FaBriefcase, FaClock, FaChevronRight, FaGraduationCap, FaBuilding } from "react-icons/fa";

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
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (qualification !== "all") params.set("qualification", qualification);
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

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [category, qualification]);

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
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(i =>
      i.title?.toLowerCase().includes(s) ||
      i.organization?.toLowerCase().includes(s) ||
      i.post_name?.toLowerCase().includes(s)
    );
  }, [items, q]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" data-testid="vacancies-page">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="section-eyebrow">Live Jobs Feed</div>
          <h1 className="section-title !text-3xl md:!text-4xl">
            {lang === "hi" ? (<>ताज़ा <span className="text-amber-400">सरकारी भर्तियाँ</span></>) : (<>Latest <span className="text-amber-400">Government Vacancies</span></>)}
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            {lang === "hi" ? "FreeJobAlert.com से हर 6 घंटे में automatic update।" : "Auto-updated every 6 hours from FreeJobAlert.com."}
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
                className={`glass p-4 hover:border-emerald-500/40 transition group block ${expired ? "opacity-60" : ""}`}
                data-testid={`vacancy-${i}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="chip !text-[10px] uppercase">{CAT_LABELS[v.category]?.[lang] || v.category || "Job"}</span>
                    {v.organization && (
                      <span className="chip !text-[10px] !bg-sky-500/10 !text-sky-300 !border-sky-500/30">
                        <FaBuilding className="inline mr-1 text-[9px]" />{v.organization}
                      </span>
                    )}
                  </div>
                  <FaChevronRight className="text-slate-500 group-hover:text-emerald-400 transition text-xs shrink-0 mt-1" />
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

      <div className="mt-8 text-xs text-slate-500 text-center">
        {lang === "hi" ? "स्रोत" : "Source"}: <a href="https://www.freejobalert.com" target="_blank" rel="noreferrer" className="link-mint">FreeJobAlert.com</a>
      </div>
    </div>
  );
};

export default Vacancies;
