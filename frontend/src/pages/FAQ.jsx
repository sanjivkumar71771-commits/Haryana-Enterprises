import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { FaChevronDown, FaQuestionCircle } from "react-icons/fa";

const FAQ = () => {
  const { t, lang } = useI18n();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(0);
  useEffect(() => { api.get("/faqs").then(r => setItems(r.data)).catch(() => {}); }, []);
  return (
    <div className="max-w-4xl mx-auto px-4 py-12" data-testid="faq-page">
      <h1 className="section-title text-3xl">{t({ hi: "अक्सर पूछे जाने वाले प्रश्न", en: "Frequently Asked Questions" })}</h1>
      <div className="mt-8 space-y-3">
        {items.map((f, i) => (
          <div key={f.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden" data-testid={`faq-item-${i}`}>
            <button className="w-full flex items-center justify-between p-4 text-left font-semibold text-emerald-900 hover:bg-emerald-50/50 transition"
              onClick={() => setOpen(open === i ? -1 : i)} data-testid={`faq-toggle-${i}`}>
              <span className="flex items-center gap-2"><FaQuestionCircle className="text-orange-500" /> {lang === "hi" ? f.q_hi : f.q_en}</span>
              <FaChevronDown className={`transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <div className="px-4 pb-4 text-slate-700 leading-relaxed font-hindi">{lang === "hi" ? f.a_hi : f.a_en}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
