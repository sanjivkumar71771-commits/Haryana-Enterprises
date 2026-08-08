import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import {
  FaArrowLeft, FaCalendarAlt, FaBuilding, FaGraduationCap, FaClock,
  FaFilePdf, FaExternalLinkAlt, FaRegClock, FaBriefcase, FaShareAlt, FaCheckCircle,
} from "react-icons/fa";
import { toast } from "sonner";

const KIND_META = {
  apply:        { hi: "ऑनलाइन आवेदन",   en: "Apply Online",       icon: FaCheckCircle,     cls: "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15", iconCls: "text-emerald-400" },
  notification: { hi: "अधिसूचना PDF",    en: "Notification PDF",   icon: FaFilePdf,         cls: "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15",     iconCls: "text-amber-400" },
  official:     { hi: "आधिकारिक वेबसाइट", en: "Official Website",  icon: FaExternalLinkAlt, cls: "bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/15",           iconCls: "text-sky-400" },
};

const daysRemaining = (txt) => {
  if (!txt) return null;
  const m = txt.match(/(\d{1,2})[-./ ](\d{1,2})[-./ ](\d{2,4})/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const yyyy = y.length === 2 ? `20${y}` : y;
  const dt = new Date(`${yyyy}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T23:59:59`);
  if (isNaN(dt.getTime())) return null;
  return Math.ceil((dt - new Date()) / (1000 * 60 * 60 * 24));
};

const VacancyDetail = () => {
  const { id } = useParams();
  const { lang } = useI18n();
  const [v, setV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/vacancies/${id}`)
      .then(({ data }) => alive && setV(data))
      .catch(() => alive && setError("not_found"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  const share = async () => {
    const shareData = {
      title: v?.title || "Government Vacancy",
      text: `${v?.post_name || v?.title} — ${v?.organization || ""}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(window.location.href); toast.success(lang === "hi" ? "लिंक कॉपी हुआ" : "Link copied"); }
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10" data-testid="vacancy-detail-loading">
        <div className="glass p-10 text-center text-slate-400">
          {lang === "hi" ? "विवरण लोड हो रहा है..." : "Loading vacancy details..."}
        </div>
      </div>
    );
  }

  if (error || !v) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10" data-testid="vacancy-detail-not-found">
        <Link to="/vacancies" className="link-mint inline-flex items-center gap-2 mb-4">
          <FaArrowLeft /> {lang === "hi" ? "सभी भर्तियाँ" : "All Vacancies"}
        </Link>
        <div className="glass p-10 text-center text-slate-400">
          <FaBriefcase className="text-4xl mx-auto mb-3 opacity-40" />
          {lang === "hi" ? "यह भर्ती नहीं मिली।" : "This vacancy was not found."}
        </div>
      </div>
    );
  }

  const days = daysRemaining(v.last_date_text);
  const urgent = days !== null && days >= 0 && days <= 3;
  const expired = days !== null && days < 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10" data-testid="vacancy-detail-page">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Link to="/vacancies" className="link-mint inline-flex items-center gap-2 text-sm" data-testid="back-to-vacancies">
          <FaArrowLeft /> {lang === "hi" ? "सभी भर्तियाँ" : "All Vacancies"}
        </Link>
        <button onClick={share} className="chip hover:!bg-emerald-500/10 hover:!text-emerald-300" data-testid="share-vacancy">
          <FaShareAlt className="inline mr-1" /> {lang === "hi" ? "शेयर" : "Share"}
        </button>
      </div>

      {/* Header card */}
      <div className="glass p-6 mb-6" data-testid="vacancy-detail-header">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="chip uppercase !text-[10px]">{v.category || "Job"}</span>
          {v.organization && (
            <span className="chip !bg-sky-500/10 !text-sky-300 !border-sky-500/30">
              <FaBuilding className="inline mr-1" />{v.organization}
            </span>
          )}
          {urgent && !expired && (
            <span className="chip !bg-red-500/15 !text-red-300 !border-red-500/40 animate-pulse">
              {lang === "hi" ? "अंतिम मौका" : "Last Chance"}
            </span>
          )}
          {expired && (
            <span className="chip !bg-slate-500/15 !text-slate-400 !border-slate-500/30">
              {lang === "hi" ? "समाप्त" : "Closed"}
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3" data-testid="vacancy-title">
          {v.heading || v.title}
        </h1>

        {v.description && (
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-4" data-testid="vacancy-description">
            {v.description}
          </p>
        )}

        {/* Quick facts grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {v.qualification && (
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10">
              <div className="text-[10px] uppercase text-slate-500 mb-1">{lang === "hi" ? "योग्यता" : "Qualification"}</div>
              <div className="text-xs text-white flex items-start gap-1.5"><FaGraduationCap className="text-emerald-400 mt-0.5 shrink-0" /><span>{v.qualification}</span></div>
            </div>
          )}
          {v.post_date_text && (
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10">
              <div className="text-[10px] uppercase text-slate-500 mb-1">{lang === "hi" ? "पोस्ट दिनांक" : "Post Date"}</div>
              <div className="text-xs text-white flex items-center gap-1.5"><FaRegClock className="text-sky-400" />{v.post_date_text}</div>
            </div>
          )}
          {v.last_date_text && (
            <div className={`p-3 rounded-lg border ${urgent ? "bg-red-500/10 border-red-500/30" : "bg-white/[0.03] border-white/10"}`}>
              <div className="text-[10px] uppercase text-slate-500 mb-1">{lang === "hi" ? "अंतिम तिथि" : "Last Date"}</div>
              <div className={`text-xs flex items-center gap-1.5 ${urgent ? "text-red-300 font-semibold" : "text-white"}`}>
                <FaCalendarAlt className="text-amber-400" />{v.last_date_text}
              </div>
              {days !== null && days >= 0 && !expired && (
                <div className={`text-[10px] mt-1 ${urgent ? "text-red-400" : "text-emerald-400"}`}>
                  {days === 0 ? (lang === "hi" ? "आज अंतिम दिन" : "Today is last day") : lang === "hi" ? `${days} दिन बाकी` : `${days} days left`}
                </div>
              )}
            </div>
          )}
          {v.organization && (
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10">
              <div className="text-[10px] uppercase text-slate-500 mb-1">{lang === "hi" ? "संगठन" : "Organization"}</div>
              <div className="text-xs text-white flex items-center gap-1.5"><FaBuilding className="text-sky-400" />{v.organization}</div>
            </div>
          )}
        </div>
      </div>

      {/* Important action links */}
      {Array.isArray(v.important_links) && v.important_links.length > 0 && (
        <div className="glass p-5 mb-6" data-testid="vacancy-links">
          <div className="section-eyebrow mb-3">{lang === "hi" ? "महत्वपूर्ण लिंक" : "Important Links"}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {v.important_links.map((l, i) => {
              const meta = KIND_META[l.kind] || KIND_META.official;
              const Icon = meta.icon;
              return (
                <a key={i} href={l.href} target="_blank" rel="noreferrer nofollow"
                  className={`p-3 rounded-lg border flex items-center gap-3 transition hover:scale-[1.01] ${meta.cls}`}
                  data-testid={`imp-link-${l.kind}-${i}`}>
                  <Icon className={`text-lg shrink-0 ${meta.iconCls}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs uppercase tracking-wide text-slate-400">{lang === "hi" ? meta.hi : meta.en}</div>
                    <div className="text-sm text-white truncate">{l.text}</div>
                  </div>
                  <FaExternalLinkAlt className="text-xs text-slate-500 shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Full article content */}
      {v.content_html ? (
        <div className="glass p-6 mb-6" data-testid="vacancy-content">
          <div className="section-eyebrow mb-3">{lang === "hi" ? "पूरा विवरण" : "Full Details"}</div>
          <div
            className="vacancy-article"
            dangerouslySetInnerHTML={{ __html: v.content_html }}
          />
        </div>
      ) : v.row_text ? (
        <div className="glass p-6 mb-6">
          <div className="section-eyebrow mb-3">{lang === "hi" ? "सारांश" : "Summary"}</div>
          <p className="text-sm text-slate-300 leading-relaxed">{v.row_text}</p>
        </div>
      ) : null}

      {/* Meta footer */}
      <div className="text-xs text-slate-500 text-center">
        {v.fetched_at && (
          <span><FaClock className="inline mr-1" /> {lang === "hi" ? "अंतिम अपडेट" : "Last updated"}: {new Date(v.fetched_at).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
};

export default VacancyDetail;
