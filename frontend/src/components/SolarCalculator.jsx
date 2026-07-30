import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/context/I18nContext";
import { FaSolarPanel, FaCalculator, FaBolt, FaCoins, FaFileSignature, FaChevronRight, FaLeaf, FaClock } from "react-icons/fa";

const RUPEES_PER_UNIT = 8;                   // avg residential tariff in Haryana
const UNITS_PER_KW_PER_YEAR = 1500;          // ~4.1 units/day * 365
const COST_PER_KW = 70000;                   // ₹ per kW installed
const SQFT_PER_KW = 100;                     // roof space needed per kW

const subsidyFor = (kw) => {
  // PM Surya Ghar residential subsidy slabs
  if (kw <= 0) return 0;
  if (kw < 2) return 30000;
  if (kw < 3) return 60000;
  return 78000;
};

const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

const SolarCalculator = () => {
  const { lang } = useI18n();
  const [bill, setBill] = useState(3000);
  const [roof, setRoof] = useState(500);

  const result = useMemo(() => {
    const monthlyUnits = bill / RUPEES_PER_UNIT;
    const annualUnits = monthlyUnits * 12;
    const requiredKw = annualUnits / UNITS_PER_KW_PER_YEAR;
    const maxKwByRoof = roof / SQFT_PER_KW;
    let kw = Math.min(requiredKw, maxKwByRoof);
    kw = Math.max(1, Math.min(10, Math.round(kw * 10) / 10));

    const cost = kw * COST_PER_KW;
    const subsidy = subsidyFor(kw);
    const net = Math.max(0, cost - subsidy);
    const monthlySavings = bill;                              // full offset approx
    const yearlySavings = monthlySavings * 12;
    const paybackYears = net / yearlySavings;
    const co2ReductionKgYr = kw * 1200;                       // rough
    const lifetimeSavings = yearlySavings * 25 - net;

    return { kw, cost, subsidy, net, monthlySavings, yearlySavings, paybackYears, co2ReductionKgYr, lifetimeSavings };
  }, [bill, roof]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10" data-testid="solar-calculator-section">
      <div className="glass-strong p-6 md:p-10 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Inputs */}
          <div className="lg:col-span-2">
            <div className="section-eyebrow">Live Calculator</div>
            <h2 className="section-title !text-3xl mb-2">
              {lang === "hi" ? (<><span className="text-amber-400">सोलर बचत</span> कैलकुलेटर</>) : (<><span className="text-amber-400">Solar Savings</span> Calculator</>)}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {lang === "hi" ? "अपना बिजली बिल और छत का क्षेत्र डालें — तुरंत जानें कितनी बचत होगी।" : "Enter your bill and roof area — see instant savings."}
            </p>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">{lang === "hi" ? "मासिक बिजली बिल" : "Monthly Bill"}</label>
                  <span className="text-emerald-400 font-display font-bold">{inr(bill)}</span>
                </div>
                <input type="range" min="500" max="15000" step="100" value={bill} onChange={(e) => setBill(+e.target.value)}
                  className="w-full accent-emerald-500" data-testid="calc-bill-slider" />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>₹500</span><span>₹15,000</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">{lang === "hi" ? "छत का क्षेत्रफल" : "Roof Area"}</label>
                  <span className="text-emerald-400 font-display font-bold">{roof} sqft</span>
                </div>
                <input type="range" min="100" max="2000" step="50" value={roof} onChange={(e) => setRoof(+e.target.value)}
                  className="w-full accent-emerald-500" data-testid="calc-roof-slider" />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>100 sqft</span><span>2000 sqft</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="glass p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">{lang === "hi" ? "अनुशंसित" : "Recommended"}</div>
                  <div className="text-3xl font-display font-extrabold text-emerald-400 mt-1">{result.kw} kW</div>
                </div>
                <div className="glass p-3 text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">{lang === "hi" ? "पेबैक" : "Payback"}</div>
                  <div className="text-3xl font-display font-extrabold text-amber-400 mt-1">
                    {result.paybackYears.toFixed(1)}<span className="text-sm text-slate-400 ml-1">{lang === "hi" ? "वर्ष" : "yrs"}</span>
                  </div>
                </div>
              </div>

              <Link to={`/solar/apply?type=pm_surya_ghar`} className="btn-mint w-full" data-testid="calc-apply-btn">
                <FaFileSignature /> {lang === "hi" ? "अभी आवेदन करें" : "Apply Now"} <FaChevronRight />
              </Link>
            </div>
          </div>

          {/* Right: Breakdown */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MetricCard
                icon={FaCalculator}
                label={lang === "hi" ? "सिस्टम की कीमत" : "System Cost"}
                value={inr(result.cost)}
                tint="text-white"
                sub={lang === "hi" ? `${result.kw} kW × ₹70,000` : `${result.kw} kW × ₹70,000`}
              />
              <MetricCard
                icon={FaCoins}
                label={lang === "hi" ? "PM सूर्य घर सब्सिडी" : "PM Surya Ghar Subsidy"}
                value={"− " + inr(result.subsidy)}
                tint="text-amber-400"
                sub={lang === "hi" ? "केंद्र सरकार द्वारा" : "Central Government"}
              />
              <MetricCard
                icon={FaSolarPanel}
                label={lang === "hi" ? "आपका शुद्ध निवेश" : "Your Net Investment"}
                value={inr(result.net)}
                tint="text-emerald-400"
                highlight
                sub={lang === "hi" ? "सब्सिडी काटने के बाद" : "After subsidy"}
              />
              <MetricCard
                icon={FaBolt}
                label={lang === "hi" ? "मासिक बचत" : "Monthly Savings"}
                value={inr(result.monthlySavings)}
                tint="text-emerald-400"
                sub={`≈ ${inr(result.yearlySavings)}/${lang === "hi" ? "वर्ष" : "yr"}`}
              />
              <MetricCard
                icon={FaLeaf}
                label={lang === "hi" ? "CO₂ में कमी" : "CO₂ Offset"}
                value={`${Math.round(result.co2ReductionKgYr).toLocaleString("en-IN")} kg`}
                tint="text-emerald-300"
                sub={lang === "hi" ? "हर वर्ष" : "per year"}
              />
              <MetricCard
                icon={FaClock}
                label={lang === "hi" ? "25 वर्षों की कुल बचत" : "25-Year Lifetime Savings"}
                value={inr(result.lifetimeSavings)}
                tint="text-amber-300"
                sub={lang === "hi" ? "निवेश से 5-8x रिटर्न" : "5-8× your investment"}
                highlight
              />
            </div>

            <div className="mt-4 glass p-4 text-xs text-slate-400 leading-relaxed">
              <b className="text-emerald-400">*</b> {lang === "hi"
                ? "अनुमानित गणना: औसत ₹8/यूनिट, 1 kW = 1500 यूनिट/वर्ष, 1 kW लगभग 100 sqft, ₹70,000/kW। PM सूर्य घर योजना (3+ kW पर ₹78,000 सब्सिडी)।"
                : "Estimates: avg ₹8/unit, 1 kW ≈ 1500 units/yr, ~100 sqft/kW, ₹70,000/kW. PM Surya Ghar Yojana subsidy: up to ₹78,000 (for 3+ kW)."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const MetricCard = ({ icon: Icon, label, value, sub, tint, highlight }) => (
  <div className={`glass p-4 ${highlight ? "border-emerald-500/40 !bg-emerald-500/5" : ""}`} data-testid={`metric-${label}`}>
    <div className="flex items-center justify-between mb-1">
      <div className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</div>
      <Icon className={`${tint} opacity-70`} />
    </div>
    <div className={`font-display text-2xl font-bold ${tint}`}>{value}</div>
    {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
  </div>
);

export default SolarCalculator;
