import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { FaUserPlus } from "react-icons/fa";

const Register = () => {
  const { register } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setF(v => ({ ...v, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(f);
      toast.success(t({ hi: "खाता बन गया!", en: "Account created!" }));
      nav("/dashboard");
    } catch (err) {
      const d = err.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16" data-testid="register-page">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 inline-flex items-center justify-center mb-3 text-2xl"><FaUserPlus /></div>
          <h1 className="text-2xl font-bold text-emerald-900">{t({ hi: "नया खाता बनाएँ", en: "Create Account" })}</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">{t({ hi: "पूरा नाम", en: "Full Name" })} *</label>
            <input required className="input" value={f.name} onChange={set("name")} data-testid="reg-name-input" /></div>
          <div><label className="label">Email *</label>
            <input required type="email" className="input" value={f.email} onChange={set("email")} data-testid="reg-email-input" /></div>
          <div><label className="label">{t({ hi: "मोबाइल", en: "Mobile" })} *</label>
            <input required className="input" value={f.phone} onChange={set("phone")} data-testid="reg-phone-input" /></div>
          <div><label className="label">Password (min 6) *</label>
            <input required minLength={6} type="password" className="input" value={f.password} onChange={set("password")} data-testid="reg-password-input" /></div>
          <button disabled={loading} className="btn-primary w-full justify-center" data-testid="reg-submit-btn">
            {loading ? "..." : t({ hi: "रजिस्टर करें", en: "Register" })}
          </button>
        </form>
        <p className="text-sm text-center mt-6 text-slate-600">
          {t({ hi: "पहले से खाता है?", en: "Already have an account?" })} <Link to="/login" className="text-emerald-700 font-semibold" data-testid="link-to-login">{t({ hi: "लॉगिन करें", en: "Login" })}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
