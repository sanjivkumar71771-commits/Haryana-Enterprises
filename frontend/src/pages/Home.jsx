import React from "react";
import { Link } from "react-router-dom";
import HeroSlider from "@/components/HeroSlider";
import NoticeTicker from "@/components/NoticeTicker";
import { useI18n } from "@/context/I18nContext";
import { S } from "@/lib/strings";
import {
  FaSolarPanel, FaFileSignature, FaMoneyCheckAlt, FaSearchLocation,
  FaCogs, FaFileDownload, FaTasks, FaHeadset, FaStar, FaCheckCircle, FaBolt, FaHome
} from "react-icons/fa";

const services = [
  { icon: FaFileSignature, key: "surya", to: "/solar/apply?type=pm_surya_ghar" },
  { icon: FaHome, key: "rooftop", to: "/solar/apply?type=rooftop" },
  { icon: FaSearchLocation, key: "subsidy", to: "/services" },
  { icon: FaCogs, key: "install", to: "/solar/apply?type=installation" },
  { icon: FaMoneyCheckAlt, key: "loan_app", to: "/loan/apply" },
  { icon: FaTasks, key: "status", to: "/status" },
  { icon: FaFileDownload, key: "docs", to: "/downloads" },
  { icon: FaHeadset, key: "contact_us", to: "/contact" },
];

const testimonials = [
  {
    name: "राजेश कुमार",
    place: "Sirsa",
    text_hi: "PM सूर्य घर योजना के तहत 3kW सिस्टम मिला। बिजली बिल शून्य हो गया है!",
    text_en: "Got a 3kW system under PM Surya Ghar scheme. Electricity bill is now zero!",
  },
  {
    name: "सुनीता देवी",
    place: "Kagdana",
    text_hi: "लोन प्रक्रिया बहुत आसान थी। मात्र 5 दिन में मंज़ूरी मिल गयी।",
    text_en: "The loan process was very smooth. Got approval in just 5 days.",
  },
  {
    name: "Vikram Singh",
    place: "Bhadra Road",
    text_hi: "प्रोफेशनल टीम और बेहतरीन सर्विस। पूरी तरह संतुष्ट हूँ।",
    text_en: "Professional team and excellent service. Completely satisfied.",
  },
];

const Home = () => {
  const { t, lang } = useI18n();
  return (
    <div data-testid="home-page">
      <HeroSlider />
      <NoticeTicker />

      {/* Quick Services */}
      <section className="py-14 bg-white" data-testid="quick-services-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10" data-aos="fade-up">
            <h2 className="section-title">{t(S.services.title)}</h2>
            <p className="text-slate-600 mt-3 max-w-2xl">{t(S.services.sub)}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <Link key={s.key} to={s.to} className="service-card group" data-aos="fade-up" data-aos-delay={i * 60} data-testid={`quick-service-${s.key}`}>
                  <div className="icon-circle"><Icon /></div>
                  <h3 className="text-lg font-semibold text-emerald-900 mb-1">{t(S.services[s.key])}</h3>
                  <p className="text-sm text-slate-600 mb-3">{t(S.services[`${s.key}_desc`])}</p>
                  <span className="text-orange-600 font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t(S.common.read_more)} <i className="fa-solid fa-arrow-right"></i>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="py-10 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white" data-testid="stats-strip">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "500+", l_hi: "इंस्टॉलेशन पूरे", l_en: "Installations Completed" },
            { n: "₹2 Cr+", l_hi: "सब्सिडी दिलवाई", l_en: "Subsidy Facilitated" },
            { n: "7.5%", l_hi: "लोन ब्याज दर से", l_en: "Loan Interest From" },
            { n: "5+", l_hi: "वर्षों का अनुभव", l_en: "Years of Experience" },
          ].map((s, i) => (
            <div key={i} data-aos="zoom-in" data-aos-delay={i * 80}>
              <div className="text-3xl md:text-4xl font-extrabold text-orange-300">{s.n}</div>
              <div className="text-sm opacity-90 mt-1">{lang === "hi" ? s.l_hi : s.l_en}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Updates */}
      <section className="py-14" data-testid="latest-updates-section">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2" data-aos="fade-right">
            <h2 className="section-title">{t(S.common.latest_updates)}</h2>
            <div className="mt-6 space-y-3">
              {[
                { d: "15 Jan", hi: "PM सूर्य घर योजना में सब्सिडी ₹78,000 तक बढ़ी", en: "PM Surya Ghar subsidy increased up to ₹78,000" },
                { d: "10 Jan", hi: "किसानों के लिए KUSUM योजना के आवेदन प्रारंभ", en: "KUSUM scheme applications open for farmers" },
                { d: "05 Jan", hi: "सोलर पैनल पर 25 वर्ष की परफॉर्मेंस वारंटी", en: "25-year performance warranty on solar panels" },
                { d: "01 Jan", hi: "बिज़नेस लोन पर विशेष 7.5% ब्याज दर", en: "Special 7.5% interest rate on business loans" },
              ].map((u, i) => (
                <div key={i} className="flex gap-4 p-4 border border-slate-200 rounded-lg hover:border-emerald-500 hover:shadow-md transition bg-white">
                  <div className="shrink-0 w-16 h-16 rounded bg-emerald-50 text-emerald-800 flex flex-col items-center justify-center font-bold">
                    <span className="text-lg">{u.d.split(" ")[0]}</span>
                    <span className="text-xs">{u.d.split(" ")[1]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-emerald-900">{lang === "hi" ? u.hi : u.en}</div>
                    <div className="text-xs text-slate-500 mt-1"><FaBolt className="inline text-orange-500" /> {t(S.common.important)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Download forms */}
          <div data-aos="fade-left">
            <h2 className="section-title">{t(S.common.downloadForms)}</h2>
            <div className="mt-6 bg-white border border-slate-200 rounded-lg divide-y">
              {[
                { hi: "PM सूर्य घर आवेदन फॉर्म", en: "PM Surya Ghar Application Form", s: "PDF · 250 KB" },
                { hi: "सोलर सब्सिडी गाइडलाइन", en: "Solar Subsidy Guidelines", s: "PDF · 480 KB" },
                { hi: "लोन आवेदन चेकलिस्ट", en: "Loan Application Checklist", s: "PDF · 180 KB" },
                { hi: "रूफटॉप सोलर ब्रोशर", en: "Rooftop Solar Brochure", s: "PDF · 1.2 MB" },
              ].map((d, i) => (
                <Link to="/downloads" key={i} className="flex items-center justify-between px-4 py-3 hover:bg-emerald-50 transition" data-testid={`home-download-${i}`}>
                  <div>
                    <div className="text-sm font-semibold text-emerald-900">{lang === "hi" ? d.hi : d.en}</div>
                    <div className="text-xs text-slate-500">{d.s}</div>
                  </div>
                  <FaFileDownload className="text-orange-600 text-xl" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="py-14 bg-emerald-50/60" data-testid="why-choose-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10 max-w-2xl" data-aos="fade-up">
            <h2 className="section-title">{t({ hi: "हमें क्यों चुनें?", en: "Why Choose Us?" })}</h2>
            <p className="text-slate-600 mt-3">{t({ hi: "अनुभव, विश्वास और सरकारी अनुमोदित सेवाओं का संगम।", en: "Experience, trust and government-approved services." })}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: FaCheckCircle, hi: "सरकार-अनुमोदित", en: "Govt-Approved", desc_hi: "MNRE पंजीकृत वेंडर और अधिकृत लोन पार्टनर।", desc_en: "MNRE-registered vendor and authorised loan partner." },
              { icon: FaSolarPanel, hi: "गुणवत्तापूर्ण उपकरण", en: "Quality Equipment", desc_hi: "Tier-1 पैनल और 25 वर्ष की वारंटी।", desc_en: "Tier-1 panels with 25-year warranty." },
              { icon: FaHeadset, hi: "24x7 सहायता", en: "24x7 Support", desc_hi: "समर्पित ग्राहक सहायता टीम।", desc_en: "Dedicated customer support team." },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-6" data-aos="zoom-in" data-aos-delay={i * 100}>
                  <div className="icon-circle text-orange-600"><Icon /></div>
                  <h3 className="font-semibold text-emerald-900 text-lg mb-1">{lang === "hi" ? c.hi : c.en}</h3>
                  <p className="text-sm text-slate-600">{lang === "hi" ? c.desc_hi : c.desc_en}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10" data-aos="fade-up">
            <h2 className="section-title">{t(S.common.testimonials)}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((tm, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-6" data-aos="fade-up" data-aos-delay={i * 80} data-testid={`testimonial-${i}`}>
                <div className="flex text-orange-500 mb-3">
                  {[...Array(5)].map((_, s) => <FaStar key={s} />)}
                </div>
                <p className="text-slate-700 italic mb-4 font-hindi">"{lang === "hi" ? tm.text_hi : tm.text_en}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">{tm.name[0]}</div>
                  <div>
                    <div className="font-semibold text-emerald-900">{tm.name}</div>
                    <div className="text-xs text-slate-500">{tm.place}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gradient-to-r from-orange-600 to-orange-500 text-white" data-testid="cta-section">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">{t({ hi: "अभी सोलर पर स्विच करें और बचाएँ हर महीने!", en: "Switch to Solar Now and Save Every Month!" })}</h3>
            <p className="opacity-95 mt-1">{t({ hi: "मुफ्त परामर्श के लिए कॉल करें – 8167862016", en: "Call for free consultation – 8167862016" })}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/solar/apply" className="bg-white text-orange-700 font-semibold px-5 py-2.5 rounded hover:bg-orange-50 transition" data-testid="cta-apply-btn">
              {t(S.hero.apply_now)}
            </Link>
            <a href="tel:8167862016" className="border border-white/70 px-5 py-2.5 rounded hover:bg-white/10 transition" data-testid="cta-call-btn">
              <i className="fa-solid fa-phone"></i> Call Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
