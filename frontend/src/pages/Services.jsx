import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/context/I18nContext";
import { S } from "@/lib/strings";
import { FaSolarPanel, FaMoneyBillWave, FaHandshake, FaFileSignature, FaBolt, FaHome, FaTractor, FaIndustry } from "react-icons/fa";

const cards = [
  { icon: FaFileSignature, hi: "PM सूर्य घर योजना", en: "PM Surya Ghar Scheme", desc_hi: "मुफ्त बिजली योजना में रजिस्ट्रेशन।", desc_en: "Register for the Free Electricity Scheme.", to: "/solar/apply?type=pm_surya_ghar" },
  { icon: FaHome, hi: "रूफटॉप सोलर (आवासीय)", en: "Rooftop Solar (Residential)", desc_hi: "घरों के लिए 1-10 kW सिस्टम।", desc_en: "1-10 kW systems for homes.", to: "/solar/apply?type=rooftop" },
  { icon: FaIndustry, hi: "व्यावसायिक सोलर", en: "Commercial Solar", desc_hi: "दुकानों, फैक्ट्रियों के लिए।", desc_en: "For shops & factories.", to: "/solar/apply?type=rooftop" },
  { icon: FaTractor, hi: "KUSUM (कृषि)", en: "KUSUM (Agri)", desc_hi: "किसानों के लिए सोलर पंप।", desc_en: "Solar pumps for farmers.", to: "/contact" },
  { icon: FaBolt, hi: "सोलर इंस्टॉलेशन", en: "Solar Installation", desc_hi: "प्रमाणित इंजीनियरों द्वारा।", desc_en: "By certified engineers.", to: "/solar/apply?type=installation" },
  { icon: FaMoneyBillWave, hi: "सोलर लोन", en: "Solar Loan", desc_hi: "7.5% ब्याज दर से।", desc_en: "From 7.5% interest rate.", to: "/loan/apply?type=solar" },
  { icon: FaHandshake, hi: "बिज़नेस लोन", en: "Business Loan", desc_hi: "व्यापार विस्तार के लिए।", desc_en: "For business expansion.", to: "/loan/apply?type=business" },
  { icon: FaSolarPanel, hi: "सब्सिडी परामर्श", en: "Subsidy Consulting", desc_hi: "सभी सब्सिडी की पूरी जानकारी।", desc_en: "Complete info on subsidies.", to: "/contact" },
];

const Services = () => {
  const { t, lang } = useI18n();
  return (
    <div className="max-w-7xl mx-auto px-4 py-12" data-testid="services-page">
      <h1 className="section-title text-3xl">{t(S.services.title)}</h1>
      <p className="text-slate-600 mt-3">{t(S.services.sub)}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link key={i} to={c.to} className="service-card" data-testid={`service-card-${i}`}>
              <div className="icon-circle"><Icon /></div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-1">{lang === "hi" ? c.hi : c.en}</h3>
              <p className="text-sm text-slate-600">{lang === "hi" ? c.desc_hi : c.desc_en}</p>
              <div className="mt-3 text-orange-600 text-sm font-semibold">{t(S.common.apply)} <i className="fa-solid fa-arrow-right"></i></div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Services;
