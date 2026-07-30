import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { FaFileDownload, FaFilePdf } from "react-icons/fa";

const Downloads = () => {
  const { lang } = useI18n();
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/downloads").then(r => setItems(r.data)).catch(() => {}); }, []);
  return (
    <div className="max-w-5xl mx-auto px-4 py-12" data-testid="downloads-page">
      <div className="section-eyebrow">Downloads</div>
      <h1 className="section-title !text-3xl">{lang === "hi" ? "डाउनलोड करें" : "Downloads"}</h1>
      <p className="text-slate-400 mt-2 text-sm">{lang === "hi" ? "फॉर्म्स, ब्रोशर व गाइडलाइन डाउनलोड करें।" : "Download forms, brochures and guidelines."}</p>
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {items.map((d, i) => (
          <a key={d.id} href={d.url} className="glass p-5 flex items-center gap-4 hover:border-emerald-500/40 transition" data-testid={`download-item-${i}`}>
            <FaFilePdf className="text-red-400 text-4xl shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-white">{lang === "hi" ? d.title_hi : d.title_en}</div>
              <div className="text-xs text-slate-400 mt-1">{d.size}</div>
            </div>
            <FaFileDownload className="text-emerald-400 text-xl" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default Downloads;
