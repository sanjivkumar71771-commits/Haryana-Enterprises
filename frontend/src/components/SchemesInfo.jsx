import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/context/I18nContext";
import {
  FaSolarPanel, FaMoneyBillWave, FaBolt, FaLeaf, FaHome, FaCheckCircle,
  FaFileSignature, FaHandshake, FaCogs, FaSearch, FaChevronRight, FaPercent,
  FaCalendarAlt, FaReceipt, FaShieldAlt, FaBullhorn,
} from "react-icons/fa";

const SUBSIDY_TIERS = [
  { kw: "1 kW", amt: "₹30,000", tone: "emerald" },
  { kw: "2 kW", amt: "₹60,000", tone: "sky" },
  { kw: "3 kW", amt: "₹78,000", tone: "amber" },
  { kw: "3 kW+", amt: lang => (lang === "hi" ? "अधिकतम ₹78,000 CFA" : "Max ₹78,000 CFA"), tone: "violet" },
];

const TONE = {
  emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  sky:     "bg-sky-500/10 border-sky-500/30 text-sky-300",
  amber:   "bg-amber-500/10 border-amber-500/30 text-amber-300",
  violet:  "bg-violet-500/10 border-violet-500/30 text-violet-300",
};

const PROCESS_STEPS_HI = [
  "Online Registration", "आवेदन (Application)", "Vendor Selection",
  "Solar Installation", "DISCOM Inspection / Metering", "Subsidy / CFA",
];
const PROCESS_STEPS_EN = [
  "Online Registration", "Application", "Vendor Selection",
  "Solar Installation", "DISCOM Inspection / Metering", "Subsidy / CFA",
];

const SOLAR_BENEFITS = [
  { icon: FaBolt,    hi: "बिजली बिल में कमी", en: "Reduced electricity bills" },
  { icon: FaHome,    hi: "घर पर अपनी सौर बिजली का उत्पादन", en: "Generate your own solar power at home" },
  { icon: FaLeaf,    hi: "स्वच्छ एवं पर्यावरण-अनुकूल ऊर्जा", en: "Clean & eco-friendly energy" },
  { icon: FaHandshake, hi: "सरकारी योजना के तहत वित्तीय सहायता", en: "Financial aid under Govt. scheme" },
  { icon: FaShieldAlt, hi: "अधिकृत Vendor के माध्यम से Solar Installation", en: "Installation via authorised vendor" },
];

const LOAN_FEATURES = [
  { icon: FaCheckCircle, hi: "5–7 दिनों में मंज़ूरी", en: "Approval in 5–7 days" },
  { icon: FaFileSignature, hi: "न्यूनतम कागज़ी कार्रवाई", en: "Minimal documentation" },
  { icon: FaBullhorn, hi: "पूर्व-भुगतान पर कोई शुल्क नहीं", en: "Zero pre-payment charges" },
  { icon: FaShieldAlt, hi: "पारदर्शी शर्तें, कोई छुपा शुल्क नहीं", en: "Transparent terms, no hidden fees" },
];

const SchemesInfo = () => {
  const { lang } = useI18n();
  const hi = lang === "hi";
  const process = hi ? PROCESS_STEPS_HI : PROCESS_STEPS_EN;

  return (
    <section className="max-w-7xl mx-auto px-4 py-14" data-testid="schemes-info-section">
      <div className="mb-8">
        <div className="section-eyebrow">Government Schemes · Finance</div>
        <h2 className="section-title">
          {hi ? <>योजनाएँ जो <span className="text-amber-400">आपके पैसे बचाएँ</span></> : <>Schemes that <span className="text-amber-400">save you money</span></>}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─────── SOLAR: PM Surya Ghar ─────── */}
        <div className="glass p-6 md:p-7 relative overflow-hidden" data-testid="solar-info-card">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center text-xl">
                <FaSolarPanel />
              </div>
              <div>
                <div className="text-[10px] uppercase text-amber-400 font-semibold tracking-widest">
                  {hi ? "केंद्र सरकार की योजना" : "Central Govt. Scheme"}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white">
                  ☀️ PM Surya Ghar: Muft Bijli Yojana
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-5">
              {hi
                ? "भारत सरकार की योजना के तहत पात्र घरेलू उपभोक्ता अपने घर पर Rooftop Solar लगाकर सरकारी CFA/सब्सिडी का लाभ ले सकते हैं।"
                : "Under the Govt. of India scheme, eligible households can install Rooftop Solar and claim CFA / subsidy benefits."}
            </p>

            {/* Subsidy tiers */}
            <div className="mb-5">
              <div className="text-xs uppercase font-semibold text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                <span className="text-amber-400">💰</span> {hi ? "सब्सिडी" : "Subsidy"}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SUBSIDY_TIERS.map((t, i) => (
                  <div key={i} className={`px-3 py-2.5 rounded-lg border ${TONE[t.tone]} flex items-center justify-between`} data-testid={`subsidy-tier-${i}`}>
                    <div className="text-xs font-semibold">{t.kw} Solar</div>
                    <div className="text-sm font-bold">{typeof t.amt === "function" ? t.amt(lang) : `${t.amt} ${hi ? "तक" : "up to"}`}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-5">
              <div className="text-xs uppercase font-semibold text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                <span className="text-amber-400">⚡</span> {hi ? "मुख्य लाभ" : "Key Benefits"}
              </div>
              <ul className="space-y-1.5">
                {SOLAR_BENEFITS.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <Icon className="text-emerald-400 mt-0.5 shrink-0 text-[13px]" />
                      <span>{hi ? b.hi : b.en}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Process flow */}
            <div className="mb-5">
              <div className="text-xs uppercase font-semibold text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                <span className="text-amber-400">📋</span> {hi ? "आवेदन प्रक्रिया" : "Application Process"}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {process.map((step, i) => (
                  <React.Fragment key={i}>
                    <span className="px-2.5 py-1.5 rounded-md bg-white/[0.04] border border-white/10 text-[11px] text-slate-200 font-medium">
                      <span className="text-emerald-400 mr-1">{i + 1}.</span>{step}
                    </span>
                    {i < process.length - 1 && <FaChevronRight className="text-slate-600 text-[10px]" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/20 text-[11px] text-amber-200/90 mb-5">
              <b>{hi ? "नोट: " : "Note: "}</b>
              {hi
                ? "Subsidy पात्रता, सिस्टम क्षमता और योजना के वर्तमान नियमों के अनुसार लागू होती है।"
                : "Subsidy is applicable based on eligibility, system capacity and current scheme rules."}
            </div>

            {/* Apply CTA */}
            <Link to="/solar/apply?type=pm_surya_ghar" className="btn-mint w-full md:w-auto justify-center" data-testid="solar-apply-cta">
              <FaSolarPanel /> {hi ? "अभी सोलर के लिए आवेदन करें" : "Apply for Solar Now"} <FaChevronRight className="text-xs" />
            </Link>
          </div>
        </div>

        {/* ─────── LOAN Details ─────── */}
        <div className="glass p-6 md:p-7 relative overflow-hidden" data-testid="loan-info-card">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xl">
                <FaMoneyBillWave />
              </div>
              <div>
                <div className="text-[10px] uppercase text-emerald-400 font-semibold tracking-widest">
                  {hi ? "आसान वित्त" : "Easy Finance"}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white">
                  💳 {hi ? "सोलर / व्यावसायिक लोन" : "Solar / Business Loan"}
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-5">
              {hi
                ? "कम ब्याज दर, लम्बी अवधि और शून्य प्रोसेसिंग शुल्क के साथ आसान EMI पर लोन प्राप्त करें।"
                : "Get an easy EMI loan with low interest, long tenure and zero processing fees."}
            </p>

            {/* Key stat trio */}
            <div className="grid grid-cols-3 gap-2 mb-5" data-testid="loan-key-stats">
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center">
                <FaPercent className="text-emerald-400 mx-auto mb-1 text-xs" />
                <div className="text-[10px] uppercase text-slate-400 tracking-widest">
                  {hi ? "ब्याज दर" : "Interest Rate"}
                </div>
                <div className="text-xl font-extrabold text-emerald-300 mt-0.5">5.75%</div>
              </div>
              <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/10 text-center">
                <FaCalendarAlt className="text-sky-400 mx-auto mb-1 text-xs" />
                <div className="text-[10px] uppercase text-slate-400 tracking-widest">
                  {hi ? "अवधि" : "Tenure"}
                </div>
                <div className="text-xl font-extrabold text-sky-300 mt-0.5">
                  10 {hi ? "वर्ष" : "Years"}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center">
                <FaReceipt className="text-amber-400 mx-auto mb-1 text-xs" />
                <div className="text-[10px] uppercase text-slate-400 tracking-widest">
                  {hi ? "प्रोसेसिंग" : "Processing"}
                </div>
                <div className="text-xl font-extrabold text-amber-300 mt-0.5">0.0%</div>
              </div>
            </div>

            {/* Features */}
            <div className="mb-5">
              <div className="text-xs uppercase font-semibold text-slate-400 tracking-widest mb-2 flex items-center gap-2">
                <span className="text-emerald-400">✨</span> {hi ? "क्यों चुनें?" : "Why choose us?"}
              </div>
              <ul className="space-y-1.5">
                {LOAN_FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <Icon className="text-emerald-400 mt-0.5 shrink-0 text-[13px]" />
                      <span>{hi ? f.hi : f.en}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Sample EMI note */}
            <div className="p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 text-[11px] text-emerald-200/90 mb-5">
              <b>{hi ? "उदाहरण: " : "Example: "}</b>
              {hi
                ? "₹2 लाख लोन, 10 वर्ष अवधि पर मासिक EMI ≈ ₹2,196 (5.75% ब्याज)।"
                : "₹2 lakh loan for 10 years ≈ ₹2,196/month EMI (at 5.75%)."}
            </div>

            {/* Apply CTA */}
            <div className="flex flex-wrap gap-2">
              <Link to="/loan/apply?type=solar" className="btn-mint" data-testid="loan-apply-solar-cta">
                <FaMoneyBillWave /> {hi ? "सोलर लोन के लिए आवेदन" : "Apply for Solar Loan"} <FaChevronRight className="text-xs" />
              </Link>
              <Link to="/loan/apply?type=business" className="btn-outline-mint" data-testid="loan-apply-business-cta">
                {hi ? "व्यावसायिक लोन" : "Business Loan"} <FaChevronRight className="text-xs" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SchemesInfo;
