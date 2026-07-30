import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { FaFileDownload, FaFilePdf } from "react-icons/fa";

const Downloads = () => {
  const { t, lang } = useI18n();
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/downloads").then(r => setItems(r.data)).catch(() => {}); }, []);
  return (
    <div className="max-w-5xl mx-auto px-4 py-12" data-testid="downloads-page">
      <h1 className="section-title text-3xl">{t({ hi: "डाउनलोड करें", en: "Downloads" })}</h1>
      <p className="text-slate-600 mt-3">{t({ hi: "फॉर्म्स, ब्रोशर व गाइडलाइन डाउनलोड करें।", en: "Download forms, brochures and guidelines." })}</p>
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {items.map((d, i) => (
          <a key={d.id} href={d.url} className="bg-white border border-slate-200 rounded-lg p-5 flex items-center gap-4 hover:shadow-md hover:border-emerald-500 transition" data-testid={`download-item-${i}`}>
            <FaFilePdf className="text-red-500 text-4xl shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-emerald-900">{lang === "hi" ? d.title_hi : d.title_en}</div>
              <div className="text-sm text-slate-500">{d.size}</div>
            </div>
            <FaFileDownload className="text-orange-600 text-xl" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default Downloads;
