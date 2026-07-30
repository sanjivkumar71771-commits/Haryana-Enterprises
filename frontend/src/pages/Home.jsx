import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { S } from "@/lib/strings";
import api from "@/lib/api";
import { toast } from "sonner";
import Marquee from "react-fast-marquee";
import SolarCalculator from "@/components/SolarCalculator";
import {
  FaSolarPanel, FaMoneyBillWave, FaFileSignature, FaSearchLocation, FaTools,
  FaTasks, FaCheckCircle, FaChevronRight, FaChevronDown, FaEnvelope, FaLock,
  FaShieldAlt, FaEye, FaEyeSlash, FaBullhorn, FaAndroid, FaApple, FaFingerprint,
  FaBolt, FaHome, FaAward, FaHeadset, FaFileDownload, FaImages, FaStar,
  FaSun, FaBoxes, FaMoneyCheckAlt, FaHandshake
} from "react-icons/fa";

const flowSteps = [
  { icon: FaSearchLocation, hi: "पूछताछ", en: "Enquiry" },
  { icon: FaHome, hi: "साइट सर्वे", en: "Site Survey" },
  { icon: FaFileSignature, hi: "सब्सिडी", en: "Subsidy Apply" },
  { icon: FaTools, hi: "इंस्टॉलेशन", en: "Installation" },
  { icon: FaShieldAlt, hi: "टेस्टिंग", en: "Testing" },
  { icon: FaHandshake, hi: "हैंडओवर", en: "Handover" },
  { icon: FaSun, hi: "बचत", en: "Savings" },
];

const services = [
  { icon: FaSolarPanel, hi: "PM सूर्य घर योजना", en: "PM Surya Ghar Scheme", desc_hi: "मुफ्त बिजली + ₹78,000 सब्सिडी", desc_en: "Free electricity + ₹78,000 subsidy", to: "/solar/apply?type=pm_surya_ghar", accent: "emerald" },
  { icon: FaHome, hi: "रूफटॉप सोलर", en: "Rooftop Solar", desc_hi: "1–10 kW आवासीय व व्यावसायिक", desc_en: "1–10 kW residential & commercial", to: "/solar/apply?type=rooftop", accent: "amber" },
  { icon: FaMoneyBillWave, hi: "सोलर / बिज़नेस लोन", en: "Solar / Business Loan", desc_hi: "7.5% ब्याज से · 5–7 दिन मंज़ूरी", desc_en: "From 7.5% · Approved in 5–7 days", to: "/loan/apply", accent: "emerald" },
  { icon: FaTasks, hi: "स्टेटस ट्रैकिंग", en: "Status Tracking", desc_hi: "अपने आवेदन की स्थिति देखें", desc_en: "Track your application status", to: "/status", accent: "amber" },
];

const HeroSignIn = () => {
  const { t, lang } = useI18n();
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaCode] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
  const [loading, setLoading] = useState(false);

  if (user && user !== false) {
    return (
      <div className="signin-card" data-testid="hero-welcome-card">
        <span className="signin-pill">Welcome</span>
        <div className="signin-badge"><FaCheckCircle /></div>
        <h3 className="font-display text-2xl font-bold text-white mb-1">
          {lang === "hi" ? `नमस्ते, ${user.name}!` : `Hello, ${user.name}!`}
        </h3>
        <p className="text-sm text-slate-400 mb-5">{lang === "hi" ? "अपने डैशबोर्ड पर जाकर आवेदन देखें।" : "Head over to your dashboard to see all applications."}</p>
        <Link to="/dashboard" className="btn-mint w-full" data-testid="hero-goto-dashboard-btn">
          {lang === "hi" ? "मेरा डैशबोर्ड" : "My Dashboard"} <FaChevronRight />
        </Link>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Link to="/solar/apply" className="btn-outline-mint text-xs !py-2" data-testid="hero-new-solar-btn">
            <FaSolarPanel /> {lang === "hi" ? "नया सोलर" : "New Solar"}
          </Link>
          <Link to="/loan/apply" className="btn-outline-mint text-xs !py-2" data-testid="hero-new-loan-btn">
            <FaMoneyBillWave /> {lang === "hi" ? "नया लोन" : "New Loan"}
          </Link>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (captcha.toUpperCase() !== captchaCode) {
      toast.error(lang === "hi" ? "कैप्चा गलत है" : "Captcha does not match");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success(lang === "hi" ? "स्वागत है!" : "Welcome!");
      nav("/dashboard");
    } catch (err) {
      const d = err.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="signin-card" data-testid="hero-signin-card">
      <div className="flex items-center justify-between mb-2">
        <span className="signin-pill">Sign In</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Portal Access</span>
      </div>
      <div className="signin-badge"><FaShieldAlt /></div>
      <h3 className="font-display text-2xl font-bold text-white mb-1">
        {lang === "hi" ? "आपका स्वागत है!" : "Welcome back!"}
      </h3>
      <p className="text-xs text-slate-400 mb-5">
        {lang === "hi" ? "आवेदन देखने के लिए साइन इन करें।" : "Sign in to track your applications."}
      </p>

      <div className="space-y-3">
        <div>
          <label className="label">{lang === "hi" ? "ईमेल" : "Email"}</label>
          <div className="input-icon-wrap">
            <FaEnvelope className="icon" />
            <input required type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="hero-login-email" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label mb-0">{lang === "hi" ? "पासवर्ड" : "Password"}</label>
            <Link to="/login" className="text-xs link-mint">{lang === "hi" ? "भूल गए?" : "Forgot?"}</Link>
          </div>
          <div className="input-icon-wrap mt-1.5">
            <FaLock className="icon" />
            <input required type={showPw ? "text" : "password"} className="input pr-10" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="hero-login-password" />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400" data-testid="hero-toggle-pw">
              {showPw ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">{lang === "hi" ? "सुरक्षा जाँच" : "Security check"}</label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center justify-center px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 font-mono font-bold text-emerald-300 tracking-[0.5em] text-lg select-none" data-testid="captcha-code">
              {captchaCode.split("").join(" ")}
            </div>
            <input required maxLength={6} className="input flex-1 uppercase" placeholder="Enter code" value={captcha} onChange={(e) => setCaptcha(e.target.value.toUpperCase())} data-testid="hero-captcha-input" />
          </div>
        </div>
      </div>

      <button disabled={loading} type="submit" className="btn-mint w-full mt-5" data-testid="hero-signin-submit">
        <FaLock /> {loading ? "..." : lang === "hi" ? "साइन इन" : "Sign in"}
      </button>

      <p className="text-[11px] text-slate-500 text-center mt-3 flex items-center justify-center gap-1">
        <FaShieldAlt className="text-emerald-500" /> {lang === "hi" ? "एन्क्रिप्टेड सत्र · सुरक्षित पोर्टल" : "Encrypted credentials protect this session"}
      </p>
      <p className="text-xs text-center text-slate-400 mt-4">
        {lang === "hi" ? "नए यूज़र?" : "New user?"} <Link to="/register" className="link-mint font-semibold" data-testid="hero-goto-register">{lang === "hi" ? "रजिस्टर करें" : "Create account"}</Link>
      </p>
    </form>
  );
};

const NewsMarquee = () => {
  const { lang } = useI18n();
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/notices").then(r => setItems(r.data)).catch(() => {}); }, []);
  if (!items.length) return null;
  return (
    <div className="news-strip" data-testid="notice-ticker">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
        <span className="news-tag"><FaBullhorn /> {lang === "hi" ? "ताज़ा अपडेट" : "Latest Updates"}</span>
        <div className="flex-1 overflow-hidden">
          <Marquee pauseOnHover gradient={false} speed={45}>
            {items.map((n, i) => (
              <span key={n.id || i} className="news-item font-hindi">
                {lang === "hi" ? n.title_hi : n.title_en}
                {n.type === "important" && <span className="new-badge">NEW</span>}
                <span className="mx-4 text-emerald-500/40">•</span>
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const { t, lang } = useI18n();
  const heroBg = "https://images.unsplash.com/photo-1655300256335-beef51a914fe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHw0fHxyb29mdG9wJTIwc29sYXIlMjBwYW5lbHMlMjBob21lfGVufDB8fHx8MTc4NTM4NzQzNHww&ixlib=rb-4.1.0&q=85";

  return (
    <div id="main-content" data-testid="home-page">
      {/* ─────────── HERO ─────────── */}
      <section className="hero-wrap" data-testid="hero-section">
        <div className="hero-bg" style={{ backgroundImage: `url(${heroBg})` }}></div>
        <div className="hero-overlay"></div>
        <div className="hero-vignette"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: title + flow */}
          <div className="lg:col-span-8 flex flex-col justify-center">
            <span className="category-pill mb-4" data-testid="hero-category-pill">
              {lang === "hi" ? "सोलर एवं वित्त सेवा पोर्टल" : "Solar & Finance Services Portal"}
            </span>
            <h1 className="hero-title mb-4">
              {lang === "hi" ? (<>
                <span className="accent">सोलर</span> से <span className="accent">बचत</span> तक, आसानी से
              </>) : (<>
                <span className="accent">Solar</span> to <span className="accent">savings</span>, effortlessly
              </>)}
            </h1>
            <p className="text-lg text-slate-300/90 max-w-2xl mb-8">
              {lang === "hi"
                ? "एक ही मंच पर PM सूर्य घर पंजीकरण, रूफटॉप सोलर, सब्सिडी दावा, और लोन आवेदन — सिरसा के लिए बना।"
                : "One digital platform for PM Surya Ghar registration, Rooftop Solar, subsidy claim & loan applications — built for Sirsa."}
            </p>

            {/* Flow */}
            <div className="flow-panel" data-testid="flow-panel">
              <div className="flow-panel-label">{lang === "hi" ? "प्रक्रिया प्रवाह" : "Service Flow"}</div>
              <div className="flow-steps">
                {flowSteps.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <React.Fragment key={i}>
                      <div className="flow-step" data-testid={`flow-step-${i}`}>
                        <div className="flow-step-icon"><Icon /></div>
                        <span>{lang === "hi" ? s.hi : s.en}</span>
                      </div>
                      {i < flowSteps.length - 1 && <FaChevronRight className="flow-arrow" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* App cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
              <Link to="/solar/apply" className="app-card" data-testid="app-card-solar">
                <div className="app-card-icon"><FaSolarPanel /></div>
                <div>
                  <div className="app-card-title">{lang === "hi" ? "सोलर आवेदन" : "Solar Application"}</div>
                  <div className="app-card-sub">{lang === "hi" ? "अभी आवेदन करें" : "Apply now"}</div>
                </div>
              </Link>
              <Link to="/loan/apply" className="app-card" data-testid="app-card-loan">
                <div className="app-card-icon"><FaMoneyBillWave /></div>
                <div>
                  <div className="app-card-title">{lang === "hi" ? "लोन आवेदन" : "Loan Application"}</div>
                  <div className="app-card-sub">{lang === "hi" ? "7.5% से" : "From 7.5%"}</div>
                </div>
              </Link>
              <Link to="/status" className="app-card" data-testid="app-card-status">
                <div className="app-card-icon"><FaFingerprint /></div>
                <div>
                  <div className="app-card-title">{lang === "hi" ? "स्टेटस ट्रैक" : "Track Status"}</div>
                  <div className="app-card-sub">{lang === "hi" ? "रेफ नंबर से" : "By Ref No."}</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Right: signin card */}
          <div className="lg:col-span-4 flex items-center justify-center">
            <div className="w-full max-w-md">
              <HeroSignIn />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── News marquee ─────────── */}
      <div className="mt-10">
        <NewsMarquee />
      </div>

      {/* ─────────── Solar Savings Calculator ─────────── */}
      <SolarCalculator />

      {/* ─────────── Services ─────────── */}
      <section className="max-w-7xl mx-auto px-4 py-14" data-testid="services-section">
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="section-eyebrow">Core Services</div>
            <h2 className="section-title">{lang === "hi" ? "हमारी मुख्य सेवाएँ" : "Our Core Services"}</h2>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm">
              {lang === "hi" ? "सरकारी योजनाओं और वित्तीय समाधानों का सम्पूर्ण पैकेज।" : "A complete package of government schemes and financial solutions."}
            </p>
          </div>
          <Link to="/services" className="btn-outline-mint text-sm" data-testid="view-all-services-btn">
            {lang === "hi" ? "सभी सेवाएँ" : "View all"} <FaChevronRight />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <Link key={i} to={s.to} className="svc-card" data-aos="fade-up" data-aos-delay={i * 80} data-testid={`svc-card-${i}`}>
                <div className="svc-icon"><Icon /></div>
                <div className="font-display font-semibold text-lg text-white mb-1">{lang === "hi" ? s.hi : s.en}</div>
                <div className="text-xs text-slate-400 mb-3">{lang === "hi" ? s.desc_hi : s.desc_en}</div>
                <div className="text-emerald-400 text-xs font-semibold inline-flex items-center gap-1">
                  {lang === "hi" ? "अभी शुरू करें" : "Get started"} <FaChevronRight className="text-[10px]" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─────────── Stats + Impact ─────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-14" data-testid="stats-section">
        <div className="glass p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "500+", l_hi: "इंस्टॉलेशन", l_en: "Installations" },
            { n: "₹2 Cr+", l_hi: "सब्सिडी दिलवाई", l_en: "Subsidy Given" },
            { n: "7.5%", l_hi: "से लोन दर", l_en: "Loan Rate From" },
            { n: "5+", l_hi: "वर्षों का अनुभव", l_en: "Years of Experience" },
          ].map((s, i) => (
            <div key={i} data-testid={`stat-${i}`}>
              <div className="font-display text-4xl md:text-5xl font-extrabold text-amber-400">{s.n}</div>
              <div className="text-xs md:text-sm text-slate-400 mt-1.5 uppercase tracking-widest">{lang === "hi" ? s.l_hi : s.l_en}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── Why + Testimonials ─────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-14 grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="why-testimonials-section">
        {/* Why */}
        <div className="lg:col-span-1">
          <div className="section-eyebrow">Why Us</div>
          <h2 className="section-title mb-4">{lang === "hi" ? "हमें क्यों चुनें?" : "Why choose us?"}</h2>
          <div className="space-y-3">
            {[
              { icon: FaAward, hi: "MNRE अनुमोदित पार्टनर", en: "MNRE-approved partner" },
              { icon: FaBolt, hi: "5–7 दिनों में लोन मंज़ूरी", en: "Loan approval in 5–7 days" },
              { icon: FaShieldAlt, hi: "25 वर्ष पैनल वारंटी", en: "25-year panel warranty" },
              { icon: FaHeadset, hi: "समर्पित लोकल सपोर्ट", en: "Dedicated local support" },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="glass p-4 flex items-start gap-3" data-testid={`why-${i}`}>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0"><Icon /></div>
                  <div>
                    <div className="font-semibold text-white text-sm">{lang === "hi" ? c.hi : c.en}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div className="lg:col-span-2">
          <div className="section-eyebrow">Voices from customers</div>
          <h2 className="section-title mb-4">{lang === "hi" ? "ग्राहकों की प्रतिक्रिया" : "What customers say"}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { n: "राजेश कुमार", p: "Sirsa", hi: "PM सूर्य घर योजना के तहत 3kW सिस्टम मिला। बिजली बिल शून्य हो गया है!", en: "Got a 3kW system under PM Surya Ghar scheme. Electricity bill is now zero!" },
              { n: "सुनीता देवी", p: "Kagdana", hi: "लोन प्रक्रिया बहुत आसान थी। मात्र 5 दिन में मंज़ूरी मिल गयी।", en: "Loan process was smooth. Approved in just 5 days." },
              { n: "Vikram Singh", p: "Bhadra Road", hi: "प्रोफेशनल टीम और बेहतरीन सर्विस। पूरी तरह संतुष्ट हूँ।", en: "Professional team and excellent service. Completely satisfied." },
              { n: "Aarti Sharma", p: "Sirsa Rural", hi: "KUSUM योजना में सोलर पंप मिला। खेत की सिंचाई अब मुफ्त!", en: "Got a solar pump under KUSUM. Farm irrigation is now free!" },
            ].map((tm, i) => (
              <div key={i} className="glass p-5" data-testid={`testimonial-${i}`}>
                <div className="flex text-amber-400 text-sm mb-2">
                  {[...Array(5)].map((_, s) => <FaStar key={s} />)}
                </div>
                <p className="text-sm text-slate-300 italic mb-3 font-hindi">"{lang === "hi" ? tm.hi : tm.en}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center font-bold text-slate-900 text-sm">{tm.n[0]}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">{tm.n}</div>
                    <div className="text-xs text-slate-500">{tm.p}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── CTA ─────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-14" data-testid="cta-section">
        <div className="glass-strong p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="category-pill mb-3" data-testid="cta-pill">Free consultation</span>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
                {lang === "hi" ? (<><span className="text-amber-400">अभी</span> सोलर पर स्विच करें, हर महीने बचाएँ</>) : (<>Switch to <span className="text-amber-400">Solar</span> now — save every month</>)}
              </h3>
              <p className="text-slate-400 max-w-xl">{lang === "hi" ? "हमारी टीम आपकी छत का मुफ्त सर्वे करेगी और सब्सिडी बाद की सटीक कीमत बताएगी।" : "Our team will do a free rooftop survey and share the exact price after subsidy."}</p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link to="/solar/apply" className="btn-mint" data-testid="cta-apply-btn">
                <FaFileSignature /> {lang === "hi" ? "अभी आवेदन करें" : "Apply Now"}
              </Link>
              <a href="tel:8167862016" className="btn-amber" data-testid="cta-call-btn">
                <FaHeadset /> Call 8167862016
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
