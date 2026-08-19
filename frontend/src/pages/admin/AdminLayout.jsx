import React from "react";
import { Outlet, Link, NavLink, useNavigate, Navigate } from "react-router-dom";
import { FaCog, FaSearch, FaEdit, FaSignOutAlt, FaHome, FaExternalLinkAlt, FaBriefcase } from "react-icons/fa";
import { getAdminToken, clearAdminToken } from "./adminAuth";

const AdminLayout = () => {
  const nav = useNavigate();
  if (!getAdminToken()) return <Navigate to="/admin/login" replace />;

  const logout = () => {
    clearAdminToken();
    nav("/admin/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-emerald-600 text-white"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50" data-testid="admin-layout">
      <aside className="md:w-60 md:min-h-screen border-r border-slate-200 bg-white p-4 flex md:flex-col gap-4 md:gap-6">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white grid place-items-center">
            <FaCog />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Admin Panel</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Haryana Enterprises</div>
          </div>
        </Link>
        <nav className="flex md:flex-col gap-1 flex-1" data-testid="admin-nav">
          <NavLink to="/admin/vacancies" className={linkClass} data-testid="admin-nav-vacancies">
            <FaBriefcase /> Manual Vacancies
          </NavLink>
          <NavLink to="/admin/seo" className={linkClass} data-testid="admin-nav-seo">
            <FaSearch /> Site SEO
          </NavLink>
          <NavLink to="/admin/content" className={linkClass} data-testid="admin-nav-content">
            <FaEdit /> Front-page Text
          </NavLink>
        </nav>
        <div className="md:mt-auto flex flex-col gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            data-testid="admin-view-site"
          >
            <FaHome /> View Site <FaExternalLinkAlt className="text-[9px]" />
          </a>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50"
            data-testid="admin-logout"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
