import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { FaBullhorn } from "react-icons/fa";

const Notices = () => {
  const { t, lang } = useI18n();
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/notices").then(r => setItems(r.data)).catch(() => {}); }, []);
  return (
    <div className="max-w-5xl mx-auto px-4 py-12" data-testid="notices-page">
      <h1 className="section-title text-3xl">{t({ hi: "सूचना बोर्ड", en: "Notice Board" })}</h1>
      <div className="mt-8 space-y-3">
        {items.map((n, i) => (
          <div key={n.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-4 hover:shadow-md transition" data-testid={`notice-item-${i}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${n.type === "important" ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-700"}`}>
              <FaBullhorn />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-emerald-900 font-hindi">{lang === "hi" ? n.title_hi : n.title_en}</div>
              <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{n.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notices;
