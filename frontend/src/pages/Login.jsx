import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { FaLock, FaEnvelope, FaGoogle } from "react-icons/fa";

const Login = () => {
  const { login, googleLogin } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t({ hi: "स्वागत है!", en: "Welcome!" }));
      nav(loc.state?.from || "/dashboard");
    } catch (err) {
      const d = err.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const demoGoogle = async () => {
    // Demo Google login (in real app, integrate Google Sign-In SDK)
    setLoading(true);
    try {
      await googleLogin({
        email: "user@test.com",
        name: "Test User",
        picture: "",
        google_id: "demo-google-id-123",
      });
      toast.success(t({ hi: "गूगल से लॉगिन सफल!", en: "Google login successful!" }));
      nav("/dashboard");
    } catch (err) {
      toast.error("Google login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16" data-testid="login-page">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center mb-3 text-2xl"><FaLock /></div>
          <h1 className="text-2xl font-bold text-emerald-900">{t({ hi: "लॉगिन करें", en: "Sign In" })}</h1>
          <p className="text-sm text-slate-500 mt-1">{t({ hi: "अपने खाते में लॉगिन करें", en: "Log in to your account" })}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label"><FaEnvelope className="inline mr-1" /> Email</label>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email-input" />
          </div>
          <div>
            <label className="label"><FaLock className="inline mr-1" /> Password</label>
            <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password-input" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center" data-testid="login-submit-btn">
            {loading ? "..." : t({ hi: "लॉगिन करें", en: "Sign In" })}
          </button>
        </form>
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-500">OR</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <button onClick={demoGoogle} className="w-full flex items-center justify-center gap-2 border border-slate-300 py-2.5 rounded font-semibold text-slate-700 hover:bg-slate-50 transition" data-testid="google-login-btn">
          <FaGoogle className="text-red-500" /> {t({ hi: "Google से लॉगिन (डेमो)", en: "Continue with Google (Demo)" })}
        </button>
        <p className="text-sm text-center mt-6 text-slate-600">
          {t({ hi: "खाता नहीं है?", en: "No account?" })} <Link to="/register" className="text-emerald-700 font-semibold" data-testid="link-to-register">{t({ hi: "रजिस्टर करें", en: "Register" })}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
