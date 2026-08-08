import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { FaSearch, FaExternalLinkAlt, FaSync, FaCalendarAlt, FaBriefcase, FaClock, FaChevronRight } from "react-icons/fa";

const CAT_LABELS = {
  all: { hi: "सभी", en: "All" },
  ssc: { hi: "SSC", en: "SSC" },
  railway: { hi: "रेलवे", en: "Railway" },
  bank: { hi: "बैंक", en: "Bank" },
  police: { hi: "पुलिस", en: "Police" },
  upsc: { hi: "UPSC", en: "UPSC" },
  defence: { hi: "रक्षा", en: "Defence" },
  teaching: { hi: "शिक्षक", en: "Teacher" },
  haryana: { hi: "हरियाणा", en: "Haryana" },
  psu: { hi: "PSU", en: "PSU" },
  other: { hi: "अन्य", en: "Other" },
};

const Vacancies = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
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

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [category]);

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
    return items.filter(i => i.title?.toLowerCase().includes(s));
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

      {/* Search + Category filter */}
      <div className="glass p-4 mb-6 flex flex-col md:flex-row gap-3">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="input-icon-wrap flex-1">
          <FaSearch className="icon" />
          <input className="input" placeholder={lang === "hi" ? "खोजें… (SSC, railway, HSSC…)" : "Search… (SSC, railway, HSSC…)"}
            value={q} onChange={(e) => setQ(e.target.value)} data-testid="vacancies-search" />
        </form>
        <div className="flex gap-2 overflow-x-auto">
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
          {filtered.map((v, i) => (
            <a key={v.id || v.url + i} href={v.url} target="_blank" rel="noreferrer"
              className="glass p-4 hover:border-emerald-500/40 transition group block"
              data-testid={`vacancy-${i}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="chip !text-[10px] uppercase">{CAT_LABELS[v.category]?.[lang] || v.category || "Job"}</span>
                <FaExternalLinkAlt className="text-slate-500 group-hover:text-emerald-400 transition text-xs shrink-0 mt-1" />
              </div>
              <div className="font-semibold text-white text-sm mb-2 leading-snug line-clamp-3">{v.title}</div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                {v.last_date_text && <span><FaCalendarAlt className="inline mr-1 text-amber-400" /> {v.last_date_text}</span>}
                <span className="ml-auto text-emerald-400">{lang === "hi" ? "आवेदन करें" : "Apply"} <FaChevronRight className="inline text-[10px]" /></span>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="mt-8 text-xs text-slate-500 text-center">
        {lang === "hi" ? "स्रोत" : "Source"}: <a href="https://www.freejobalert.com" target="_blank" rel="noreferrer" className="link-mint">FreeJobAlert.com</a>
      </div>
    </div>
  );
};

export default Vacancies;
