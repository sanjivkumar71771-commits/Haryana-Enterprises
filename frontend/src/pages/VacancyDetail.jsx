import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import {
  FaArrowLeft, FaCalendarAlt, FaBuilding, FaGraduationCap, FaClock,
  FaFilePdf, FaExternalLinkAlt, FaRegClock, FaBriefcase, FaShareAlt, FaCheckCircle,
  FaUsers, FaRupeeSign, FaMoneyBillWave, FaListUl, FaMapMarkerAlt, FaUserCheck,
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
      </div>

      {/* Hero stat cards — the "at-a-glance" facts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" data-testid="vacancy-stats">
        {/* Total posts — hero */}
        <div className="stat-card stat-emerald md:col-span-1">
          <div className="stat-icon"><FaUsers /></div>
          <div className="stat-label">{lang === "hi" ? "कुल पद" : "Total Posts"}</div>
          <div className="stat-value">{v.structured?.total_posts_num ?? v.structured?.total_posts ?? "—"}</div>
        </div>
        {/* Apply start */}
        <div className="stat-card stat-sky">
          <div className="stat-icon"><FaRegClock /></div>
          <div className="stat-label">{lang === "hi" ? "आवेदन शुरू" : "Apply Start"}</div>
          <div className="stat-value stat-value-sm">
            {v.structured?.apply_start || v.post_date_text || "—"}
          </div>
        </div>
        {/* Last date */}
        <div className={`stat-card ${urgent ? "stat-red-glow" : "stat-amber"}`}>
          <div className="stat-icon"><FaCalendarAlt /></div>
          <div className="stat-label">{lang === "hi" ? "अंतिम तिथि" : "Last Date"}</div>
          <div className="stat-value stat-value-sm">
            {v.structured?.apply_end || v.last_date_text || "—"}
          </div>
          {days !== null && days >= 0 && !expired && (
            <div className={`stat-sub ${urgent ? "text-red-200" : "text-amber-200"}`}>
              {days === 0 ? (lang === "hi" ? "आज अंतिम" : "Today") : lang === "hi" ? `${days} दिन बाकी` : `${days}d left`}
            </div>
          )}
          {expired && <div className="stat-sub text-slate-400">{lang === "hi" ? "समाप्त" : "Closed"}</div>}
        </div>
        {/* Application Fee */}
        <div className="stat-card stat-violet">
          <div className="stat-icon"><FaRupeeSign /></div>
          <div className="stat-label">{lang === "hi" ? "आवेदन शुल्क" : "Application Fee"}</div>
          <div className="stat-value stat-value-xs">
            {v.structured?.application_fee ? v.structured.application_fee.split(" · ")[0] : "—"}
          </div>
          {v.structured?.application_fee?.includes(" · ") && (
            <div className="stat-sub">{lang === "hi" ? "और वर्ग" : "+ more"}</div>
          )}
        </div>
      </div>

      {/* Secondary details grid */}
      {(v.structured?.salary || v.structured?.age_limit || v.qualification || v.structured?.selection || v.structured?.job_location) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6" data-testid="vacancy-secondary">
          {v.structured?.salary && (
            <div className="detail-row">
              <div className="detail-icon bg-emerald-500/10 text-emerald-400"><FaMoneyBillWave /></div>
              <div className="flex-1 min-w-0">
                <div className="detail-label">{lang === "hi" ? "वेतन / पे स्केल" : "Salary / Pay Scale"}</div>
                <div className="detail-val">{v.structured.salary}</div>
              </div>
            </div>
          )}
          {v.qualification && (
            <div className="detail-row">
              <div className="detail-icon bg-sky-500/10 text-sky-400"><FaGraduationCap /></div>
              <div className="flex-1 min-w-0">
                <div className="detail-label">{lang === "hi" ? "शैक्षणिक योग्यता" : "Qualification"}</div>
                <div className="detail-val">{v.qualification}</div>
              </div>
            </div>
          )}
          {v.structured?.age_limit && (
            <div className="detail-row">
              <div className="detail-icon bg-amber-500/10 text-amber-400"><FaUserCheck /></div>
              <div className="flex-1 min-w-0">
                <div className="detail-label">{lang === "hi" ? "आयु सीमा" : "Age Limit"}</div>
                <div className="detail-val">{v.structured.age_limit}</div>
              </div>
            </div>
          )}
          {v.structured?.selection && (
            <div className="detail-row">
              <div className="detail-icon bg-violet-500/10 text-violet-400"><FaListUl /></div>
              <div className="flex-1 min-w-0">
                <div className="detail-label">{lang === "hi" ? "चयन प्रक्रिया" : "Selection Process"}</div>
                <div className="detail-val">{v.structured.selection}</div>
              </div>
            </div>
          )}
          {v.structured?.job_location && (
            <div className="detail-row">
              <div className="detail-icon bg-pink-500/10 text-pink-400"><FaMapMarkerAlt /></div>
              <div className="flex-1 min-w-0">
                <div className="detail-label">{lang === "hi" ? "नौकरी स्थान" : "Job Location"}</div>
                <div className="detail-val">{v.structured.job_location}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Application fee full breakdown (if multi-tier) */}
      {v.structured?.application_fee?.includes(" · ") && (
        <div className="glass p-5 mb-6" data-testid="fee-breakdown">
          <div className="section-eyebrow mb-2 flex items-center gap-2">
            <FaRupeeSign className="text-emerald-400" />{lang === "hi" ? "श्रेणीवार शुल्क" : "Fee Breakdown"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {v.structured.application_fee.split(" · ").map((f, i) => (
              <div key={i} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-slate-200 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span><span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
