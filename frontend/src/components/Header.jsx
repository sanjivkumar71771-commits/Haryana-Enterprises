import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { S } from "@/lib/strings";
import {
  FaSolarPanel, FaMoneyBillWave, FaBars, FaTimes,
  FaTachometerAlt, FaFileDownload, FaHeadset, FaHome, FaInfoCircle,
  FaCogs, FaImages, FaBullhorn, FaQuestionCircle, FaChevronDown,
  FaAdjust, FaLanguage, FaSignOutAlt
} from "react-icons/fa";

const Header = () => {
  const { user, logout } = useAuth();
  const { lang, toggle, t } = useI18n();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const [fontSize, setFontSize] = useState(localStorage.getItem("fontSize") || "normal");
  const [light, setLight] = useState(localStorage.getItem("lightTheme") === "1");

  useEffect(() => {
    document.body.classList.remove("font-large", "font-small");
    if (fontSize === "large") document.body.classList.add("font-large");
    if (fontSize === "small") document.body.classList.add("font-small");
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.body.classList.toggle("light-theme", light);
    localStorage.setItem("lightTheme", light ? "1" : "0");
  }, [light]);

  const primaryLinks = [
    { to: "/", label: t(S.nav.home), icon: FaHome },
    { to: "/solar/apply", label: t(S.nav.solar), icon: FaSolarPanel },
    { to: "/loan/apply", label: t(S.nav.loan), icon: FaMoneyBillWave },
    { to: "/downloads", label: t(S.nav.downloads), icon: FaFileDownload },
  ];
  const moreLinks = [
    { to: "/about", label: t(S.nav.about), icon: FaInfoCircle },
    { to: "/services", label: t(S.nav.services), icon: FaCogs },
    { to: "/gallery", label: t(S.nav.gallery), icon: FaImages },
    { to: "/notices", label: t(S.nav.notices), icon: FaBullhorn },
    { to: "/faq", label: t(S.nav.faq), icon: FaQuestionCircle },
    { to: "/contact", label: t(S.nav.contact), icon: FaHeadset },
  ];

  const onLogout = async () => { await logout(); nav("/"); };

  return (
    <>
      {/* ─────────── Top Strip ─────────── */}
      <div className="top-strip" data-testid="top-strip">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 shrink-0" data-testid="brand-link">
            <div className="brand-emblem">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/120px-Emblem_of_India.svg.png"
                alt="Emblem" className="w-9 h-9 object-contain" style={{ filter: "brightness(1.3)" }} />
            </div>
            <div className="leading-tight">
              <div className="font-display text-xl font-extrabold text-white tracking-tight">
                {lang === "hi" ? "हरियाणा एंटरप्राइजेज" : "Haryana Enterprises"}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 tracking-[0.2em] uppercase mt-0.5">
                Solar · Subsidy · Loan · Installation
              </div>
            </div>
          </Link>

          {/* Right controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="status-pill" data-testid="status-pill">
              <span className="status-dot"></span>
              System Status: All Systems Operational
            </div>

            {/* Font size */}
            <div className="a11y-group" data-testid="font-size-group">
              <button className={`a11y-btn ${fontSize === "small" ? "active" : ""}`} onClick={() => setFontSize("small")} data-testid="font-small-btn" aria-label="Small">A-</button>
              <button className={`a11y-btn ${fontSize === "normal" ? "active" : ""}`} onClick={() => setFontSize("normal")} data-testid="font-normal-btn" aria-label="Normal">A</button>
              <button className={`a11y-btn ${fontSize === "large" ? "active" : ""}`} onClick={() => setFontSize("large")} data-testid="font-large-btn" aria-label="Large">A+</button>
            </div>

            <button className="a11y-btn" onClick={toggle} data-testid="lang-toggle-btn" title="Language" aria-label="Language">
              <FaLanguage className="mr-1" /> {lang === "hi" ? "EN" : "हिं"}
            </button>
            <button className="a11y-btn" onClick={() => setLight(v => !v)} data-testid="theme-toggle-btn" title="Theme" aria-label="Theme">
              <FaAdjust />
            </button>

            <button className="lg:hidden a11y-btn" onClick={() => setOpen(v => !v)} data-testid="mobile-menu-toggle" aria-label="Menu">
              {open ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      {/* ─────────── Sub Nav ─────────── */}
      <nav className="subnav sticky top-0 z-40 hidden lg:block" data-testid="main-nav">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2">
          {primaryLinks.map(l => {
            const Icon = l.icon;
            return (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} className={({ isActive }) => `subnav-link ${isActive ? "active" : ""}`} data-testid={`nav-${l.to.replace(/\//g, "-") || "home"}`}>
                <Icon /> {l.label}
              </NavLink>
            );
          })}

          {/* More dropdown */}
          <div className="relative">
            <button className="subnav-link" onClick={() => setMoreOpen(v => !v)} onBlur={() => setTimeout(() => setMoreOpen(false), 150)} data-testid="nav-more">
              <FaBars /> More <FaChevronDown className={`text-xs transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full mt-1 glass-strong p-2 min-w-[220px] z-50" data-testid="nav-more-menu">
                {moreLinks.map(l => {
                  const Icon = l.icon;
                  return (
                    <NavLink key={l.to} to={l.to} onClick={() => setMoreOpen(false)} className={({ isActive }) => `subnav-link !w-full ${isActive ? "active" : ""}`} data-testid={`nav-more-${l.to.replace(/\//g, "-")}`}>
                      <Icon /> {l.label}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex-1"></div>

          {user && user !== false ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `subnav-link ${isActive ? "active" : ""}`} data-testid="nav-dashboard">
                <FaTachometerAlt /> {t(S.nav.dashboard)}
              </NavLink>
              <button onClick={onLogout} className="btn-ghost text-sm" data-testid="topbar-logout-btn">
                <FaSignOutAlt /> {t(S.nav.logout)}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn-ghost text-sm" data-testid="topbar-login-link">{t(S.nav.login)}</NavLink>
              <NavLink to="/register" className="btn-mint text-sm !py-2 !px-4" data-testid="topbar-register-link">{t(S.nav.register)}</NavLink>
            </>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden glass-strong mx-4 mt-2 p-3" data-testid="mobile-menu">
          {[...primaryLinks, ...moreLinks].map(l => {
            const Icon = l.icon;
            return (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setOpen(false)} className={({ isActive }) => `subnav-link !w-full ${isActive ? "active" : ""}`} data-testid={`mobile-nav-${l.to.replace(/\//g, "-") || "home"}`}>
                <Icon /> {l.label}
              </NavLink>
            );
          })}
          <div className="border-t border-white/10 my-2 pt-2 flex gap-2">
            {user && user !== false ? (
              <>
                <NavLink to="/dashboard" onClick={() => setOpen(false)} className="btn-ghost text-sm flex-1"><FaTachometerAlt /> {t(S.nav.dashboard)}</NavLink>
                <button onClick={() => { onLogout(); setOpen(false); }} className="btn-ghost text-sm flex-1"><FaSignOutAlt /> {t(S.nav.logout)}</button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setOpen(false)} className="btn-ghost text-sm flex-1">{t(S.nav.login)}</NavLink>
                <NavLink to="/register" onClick={() => setOpen(false)} className="btn-mint text-sm flex-1">{t(S.nav.register)}</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
