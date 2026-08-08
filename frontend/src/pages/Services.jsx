import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/context/I18nContext";
import { S } from "@/lib/strings";
import { FaSolarPanel, FaMoneyBillWave, FaHandshake, FaFileSignature, FaBolt, FaHome, FaTractor, FaIndustry, FaChevronRight } from "react-icons/fa";

const cards = [
  { icon: FaFileSignature, hi: "PM सूर्य घर योजना", en: "PM Surya Ghar Scheme", desc_hi: "मुफ्त बिजली योजना में रजिस्ट्रेशन।", desc_en: "Register for the Free Electricity Scheme.", to: "/solar/apply?type=pm_surya_ghar" },
  { icon: FaHome, hi: "रूफटॉप सोलर (आवासीय)", en: "Rooftop Solar (Residential)", desc_hi: "घरों के लिए 1-10 kW सिस्टम।", desc_en: "1-10 kW systems for homes.", to: "/solar/apply?type=rooftop" },
  { icon: FaIndustry, hi: "व्यावसायिक सोलर", en: "Commercial Solar", desc_hi: "दुकानों, फैक्ट्रियों के लिए।", desc_en: "For shops & factories.", to: "/solar/apply?type=rooftop" },
  { icon: FaTractor, hi: "KUSUM (कृषि)", en: "KUSUM (Agri)", desc_hi: "किसानों के लिए सोलर पंप।", desc_en: "Solar pumps for farmers.", to: "/contact" },
  { icon: FaBolt, hi: "सोलर इंस्टॉलेशन", en: "Solar Installation", desc_hi: "प्रमाणित इंजीनियरों द्वारा।", desc_en: "By certified engineers.", to: "/solar/apply?type=installation" },
  { icon: FaMoneyBillWave, hi: "सोलर लोन", en: "Solar Loan", desc_hi: "5.75% ब्याज · 10 वर्ष तक · 0% प्रोसेसिंग।", desc_en: "5.75% · Up to 10 yrs · 0% processing.", to: "/loan/apply?type=solar" },
  { icon: FaHandshake, hi: "बिज़नेस लोन", en: "Business Loan", desc_hi: "व्यापार विस्तार के लिए।", desc_en: "For business expansion.", to: "/loan/apply?type=business" },
  { icon: FaSolarPanel, hi: "सब्सिडी परामर्श", en: "Subsidy Consulting", desc_hi: "सभी सब्सिडी की पूरी जानकारी।", desc_en: "Complete info on subsidies.", to: "/contact" },
];

const Services = () => {
  const { t, lang } = useI18n();
  return (
    <div className="max-w-7xl mx-auto px-4 py-12" data-testid="services-page">
      <div className="section-eyebrow">Services</div>
      <h1 className="section-title !text-3xl">{t(S.services.title)}</h1>
      <p className="text-slate-400 mt-2 text-sm max-w-2xl">{t(S.services.sub)}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link key={i} to={c.to} className="svc-card" data-testid={`service-card-${i}`}>
              <div className="svc-icon"><Icon /></div>
              <div className="font-display font-semibold text-white text-lg mb-1">{lang === "hi" ? c.hi : c.en}</div>
              <div className="text-xs text-slate-400 mb-3">{lang === "hi" ? c.desc_hi : c.desc_en}</div>
              <div className="text-emerald-400 text-xs font-semibold inline-flex items-center gap-1">
                {lang === "hi" ? "अभी शुरू करें" : "Get started"} <FaChevronRight className="text-[10px]" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Services;
