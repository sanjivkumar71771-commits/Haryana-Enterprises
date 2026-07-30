import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { S } from "@/lib/strings";
import {
  FaPhone, FaEnvelope, FaWhatsapp, FaMapMarkerAlt, FaBars, FaTimes,
  FaSignOutAlt, FaSitemap, FaAssistiveListeningSystems, FaAdjust, FaHome, FaInfoCircle,
  FaCogs, FaSolarPanel, FaMoneyBillWave, FaImages, FaBullhorn, FaFileDownload,
  FaQuestionCircle, FaHeadset, FaTachometerAlt, FaSearch
} from "react-icons/fa";

const Header = () => {
  const { user, logout } = useAuth();
  const { lang, toggle, t } = useI18n();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  // Accessibility: font size + theme
  const [fontSize, setFontSize] = useState(localStorage.getItem("fontSize") || "normal");
  const [dark, setDark] = useState(localStorage.getItem("darkTheme") === "1");

  useEffect(() => {
    document.body.classList.remove("font-large", "font-small");
    if (fontSize === "large") document.body.classList.add("font-large");
    if (fontSize === "small") document.body.classList.add("font-small");
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", dark);
    localStorage.setItem("darkTheme", dark ? "1" : "0");
  }, [dark]);

  const links = [
    { to: "/", label: t(S.nav.home), icon: FaHome },
    { to: "/about", label: t(S.nav.about), icon: FaInfoCircle },
    { to: "/services", label: t(S.nav.services), icon: FaCogs },
    { to: "/solar/apply", label: t(S.nav.solar), icon: FaSolarPanel },
    { to: "/loan/apply", label: t(S.nav.loan), icon: FaMoneyBillWave },
    { to: "/gallery", label: t(S.nav.gallery), icon: FaImages },
    { to: "/notices", label: t(S.nav.notices), icon: FaBullhorn },
    { to: "/downloads", label: t(S.nav.downloads), icon: FaFileDownload },
    { to: "/faq", label: t(S.nav.faq), icon: FaQuestionCircle },
    { to: "/contact", label: t(S.nav.contact), icon: FaHeadset },
  ];

  const onLogout = async () => { await logout(); nav("/"); };

  return (
    <>
      {/* ─────────── Accessibility Strip ─────────── */}
      <div className="a11y-strip" data-testid="a11y-strip">
        <div className="max-w-7xl mx-auto px-4 py-1 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <a href="#main-content" className="hover:underline" data-testid="skip-content-link">Skip to main content</a>
            <span className="text-slate-400">|</span>
            <button className="flex items-center gap-1 hover:text-emerald-700" data-testid="screen-reader-btn"><FaAssistiveListeningSystems /> Screen Reader</button>
            <span className="text-slate-400">|</span>
            <Link to="/sitemap" className="flex items-center gap-1 hover:text-emerald-700" data-testid="sitemap-link"><FaSitemap /> Sitemap</Link>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600 hidden md:inline">Font Size:</span>
            <button className={`a11y-btn ${fontSize === "small" ? "active" : ""}`} onClick={() => setFontSize("small")} data-testid="font-small-btn" title="Small font" aria-label="Small font">A-</button>
            <button className={`a11y-btn ${fontSize === "normal" ? "active" : ""}`} onClick={() => setFontSize("normal")} data-testid="font-normal-btn" title="Normal font" aria-label="Normal font">A</button>
            <button className={`a11y-btn ${fontSize === "large" ? "active" : ""}`} onClick={() => setFontSize("large")} data-testid="font-large-btn" title="Large font" aria-label="Large font">A+</button>
            <span className="text-slate-400 mx-1">|</span>
            <button className="a11y-btn" onClick={() => setDark(v => !v)} data-testid="theme-toggle-btn" title="Toggle theme" aria-label="Toggle theme"><FaAdjust /></button>
            <span className="text-slate-400 mx-1">|</span>
            <button onClick={toggle} className="a11y-btn font-semibold" data-testid="lang-toggle-btn" title="Change language">
              {lang === "hi" ? "English" : "हिंदी"}
            </button>
            <span className="text-slate-400 mx-1 hidden md:inline">|</span>
            {user && user !== false ? (
              <>
                <Link to="/dashboard" className="a11y-btn hidden md:inline-flex" data-testid="topbar-dashboard-link"><FaTachometerAlt className="mr-1" /> {t(S.nav.dashboard)}</Link>
                <button onClick={onLogout} className="a11y-btn hidden md:inline-flex" data-testid="topbar-logout-btn"><FaSignOutAlt className="mr-1" /> {t(S.nav.logout)}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="a11y-btn" data-testid="topbar-login-link">{t(S.nav.login)}</Link>
                <Link to="/register" className="a11y-btn" data-testid="topbar-register-link">{t(S.nav.register)}</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─────────── Emblem / Logo Header ─────────── */}
      <div className="emblem-header" data-testid="emblem-header">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* National Emblem (Ashoka) */}
          <Link to="/" data-testid="brand-emblem-link" className="flex items-center gap-3 shrink-0">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/120px-Emblem_of_India.svg.png"
              alt="Emblem of Haryana"
              className="h-16 w-16 object-contain"
            />
            <div className="hidden sm:block">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Government Approved Partner</div>
              <div className="text-xl md:text-2xl font-bold text-emerald-800 leading-tight font-hindi">
                {lang === "hi" ? "हरियाणा एंटरप्राइजेज" : "Haryana Enterprises"}
              </div>
              <div className="text-xs text-slate-600 font-medium">
                {lang === "hi" ? "सोलर एवं वित्तीय सेवाएँ · कागदाना, सिरसा, हरियाणा" : "Solar & Financial Services · Kagdana, Sirsa, Haryana"}
              </div>
            </div>
          </Link>

          {/* Center info */}
          <div className="flex-1"></div>

          {/* Right side badges: contact + PM Surya Ghar promo */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wider">Toll Free / Helpline</div>
              <a href="tel:8167862016" className="text-lg font-bold text-emerald-800 flex items-center gap-1.5 justify-end">
                <FaPhone className="text-orange-600" /> 8167862016
              </a>
              <a href="https://wa.me/918168762016" target="_blank" rel="noreferrer" className="text-xs text-slate-600 flex items-center gap-1 justify-end hover:text-emerald-700">
                <FaWhatsapp className="text-green-600" /> 8168762016 (WhatsApp)
              </a>
            </div>
            <div className="w-24 h-16 rounded overflow-hidden border border-orange-300 shrink-0 shadow-sm">
              <div className="h-full bg-gradient-to-br from-orange-500 via-white to-green-600 flex items-center justify-center text-[10px] font-bold text-emerald-800 text-center p-1 leading-tight">
                PM SURYA<br />GHAR<br />YOJANA
              </div>
            </div>
          </div>

          {/* Mobile toggle */}
          <button className="lg:hidden text-2xl text-emerald-800 ml-auto" onClick={() => setOpen(v => !v)} data-testid="mobile-menu-toggle" aria-label="Toggle menu">
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Tricolor accent */}
      <div className="tricolor-strip">
        <div className="b1"></div><div className="b2"></div><div className="b3"></div>
      </div>

      {/* ─────────── Green Navigation Bar ─────────── */}
      <nav className="gov-nav sticky top-0 z-40 shadow-md" data-testid="main-nav">
        <div className="max-w-7xl mx-auto px-2 hidden lg:flex items-stretch justify-between">
          <div className="flex items-stretch">
            {links.map(l => {
              const Icon = l.icon;
              return (
                <NavLink key={l.to} to={l.to} end={l.to === "/"} className={({ isActive }) => `gov-nav-link ${isActive ? "active" : ""}`} data-testid={`nav-${l.to.replace(/\//g, "-") || "home"}`}>
                  <Icon className="text-xs opacity-90" /> {l.label}
                </NavLink>
              );
            })}
          </div>
          <div className="flex items-stretch">
            <a href="https://wa.me/918168762016" target="_blank" rel="noreferrer" className="gov-nav-link !border-r-0 bg-orange-600 hover:!bg-orange-700" data-testid="header-whatsapp-btn">
              <FaWhatsapp /> WhatsApp
            </a>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden bg-emerald-800 pb-2" data-testid="mobile-menu">
            <div className="max-w-7xl mx-auto px-2 flex flex-col">
              {links.map(l => {
                const Icon = l.icon;
                return (
                  <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-2 py-2 px-3 text-white text-sm border-b border-emerald-700 ${isActive ? "bg-emerald-700" : ""}`} data-testid={`mobile-nav-${l.to.replace(/\//g, "-") || "home"}`}>
                    <Icon /> {l.label}
                  </NavLink>
                );
              })}
              <a href="https://wa.me/918168762016" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-2.5 mt-2 mx-3 rounded bg-orange-500 text-white text-sm font-semibold" data-testid="mobile-whatsapp-btn">
                <FaWhatsapp /> WhatsApp: 8168762016
              </a>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Header;
