import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { S } from "@/lib/strings";
import { FaPhone, FaEnvelope, FaWhatsapp, FaMapMarkerAlt, FaSolarPanel, FaBars, FaTimes, FaUserCircle, FaSignOutAlt, FaLanguage } from "react-icons/fa";

const Header = () => {
  const { user, logout } = useAuth();
  const { lang, toggle, t } = useI18n();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t(S.nav.home) },
    { to: "/about", label: t(S.nav.about) },
    { to: "/services", label: t(S.nav.services) },
    { to: "/solar/apply", label: t(S.nav.solar) },
    { to: "/loan/apply", label: t(S.nav.loan) },
    { to: "/gallery", label: t(S.nav.gallery) },
    { to: "/notices", label: t(S.nav.notices) },
    { to: "/downloads", label: t(S.nav.downloads) },
    { to: "/faq", label: t(S.nav.faq) },
    { to: "/contact", label: t(S.nav.contact) },
  ];

  const onLogout = async () => { await logout(); nav("/"); };

  return (
    <>
      {/* Top Info Bar */}
      <div className="topbar text-sm" data-testid="top-info-bar">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5"><FaMapMarkerAlt className="text-orange-300" /> Kagdana, Sirsa, Haryana</span>
            <span className="hidden sm:flex items-center gap-1.5"><FaPhone className="text-orange-300" /> <a href="tel:8167862016" className="hover:text-orange-200">8167862016</a></span>
            <span className="hidden md:flex items-center gap-1.5"><FaEnvelope className="text-orange-300" /> haryanaenterpriseskagdana@gmail.com</span>
          </div>
          <div className="flex items-center gap-3">
            <button data-testid="lang-toggle-btn" onClick={toggle} className="flex items-center gap-1 hover:text-orange-200 transition">
              <FaLanguage /> <span className="uppercase font-semibold">{lang === "hi" ? "English" : "हिंदी"}</span>
            </button>
            {user && user !== false ? (
              <>
                <Link to="/dashboard" data-testid="topbar-dashboard-link" className="hover:text-orange-200">{t(S.nav.dashboard)}</Link>
                <button data-testid="topbar-logout-btn" onClick={onLogout} className="hover:text-orange-200 flex items-center gap-1"><FaSignOutAlt /> {t(S.nav.logout)}</button>
              </>
            ) : (
              <>
                <Link data-testid="topbar-login-link" to="/login" className="hover:text-orange-200">{t(S.nav.login)}</Link>
                <span>|</span>
                <Link data-testid="topbar-register-link" to="/register" className="hover:text-orange-200">{t(S.nav.register)}</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tri-band accent */}
      <div className="tri-band" />

      {/* Main navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" data-testid="brand-logo-link">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center text-white shadow-md">
              <FaSolarPanel className="text-xl" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-bold text-emerald-900">{t(S.brand)}</div>
              <div className="text-xs text-slate-500 hidden sm:block">{t(S.tagline)}</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-5">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} data-testid={`nav-${l.to.replace(/\//g, "-") || "home"}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <a href="https://wa.me/918168762016" target="_blank" rel="noreferrer" className="btn-orange text-sm" data-testid="header-whatsapp-btn">
              <FaWhatsapp /> 8168762016
            </a>
          </div>

          <button className="lg:hidden text-2xl text-emerald-900" onClick={() => setOpen(v => !v)} data-testid="mobile-menu-toggle" aria-label="Toggle menu">
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setOpen(false)} className={({ isActive }) => `py-2 px-2 rounded ${isActive ? "bg-green-50 text-emerald-800 font-semibold" : "text-slate-700 hover:bg-slate-50"}`} data-testid={`mobile-nav-${l.to.replace(/\//g, "-") || "home"}`}>
                  {l.label}
                </NavLink>
              ))}
              <a href="https://wa.me/918168762016" target="_blank" rel="noreferrer" className="btn-orange text-sm mt-2 justify-center" data-testid="mobile-whatsapp-btn">
                <FaWhatsapp /> WhatsApp: 8168762016
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
