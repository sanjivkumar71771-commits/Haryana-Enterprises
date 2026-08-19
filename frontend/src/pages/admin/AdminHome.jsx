import React from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaEdit, FaChevronRight, FaBriefcase } from "react-icons/fa";

const Card = ({ to, icon: Icon, title, desc, testid }) => (
  <Link
    to={to}
    className="group block rounded-2xl bg-white border border-slate-200 p-5 hover:border-emerald-400 hover:shadow-lg transition-all"
    data-testid={testid}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center">
        <Icon />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <FaChevronRight className="ml-auto text-slate-300 group-hover:text-emerald-600 transition-colors" />
    </div>
    <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
  </Link>
);

const AdminHome = () => {
  return (
    <div data-testid="admin-home">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back 👋</h1>
      <p className="text-sm text-slate-600 mb-8">
        Manage what your visitors see. Changes go live instantly — no redeploy needed.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <Card
          to="/admin/vacancies"
          icon={FaBriefcase}
          title="Manual Vacancies"
          desc="Post your own job vacancies that appear alongside the auto-scraped feed. Auto-refresh never overwrites them."
          testid="admin-card-vacancies"
        />
        <Card
          to="/admin/seo"
          icon={FaSearch}
          title="Site SEO"
          desc="Edit each page's title, meta description and keywords to improve Google ranking."
          testid="admin-card-seo"
        />
        <Card
          to="/admin/content"
          icon={FaEdit}
          title="Front-page Text"
          desc="Update the homepage hero heading, tagline, about blurb and contact info shown in the footer."
          testid="admin-card-content"
        />
      </div>
      <div className="mt-10 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 max-w-3xl">
        <strong>Coming soon:</strong> Announcement banners, offer posters and image uploads.
      </div>
    </div>
  );
};

export default AdminHome;
