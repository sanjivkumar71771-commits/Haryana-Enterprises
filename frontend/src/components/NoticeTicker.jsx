import React, { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { FaBullhorn } from "react-icons/fa";

const NoticeTicker = () => {
  const { lang } = useI18n();
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/notices").then(r => setItems(r.data)).catch(() => setItems([]));
  }, []);
  if (!items.length) return null;
  return (
    <div className="notice-bar" data-testid="notice-ticker">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 py-2">
        <span className="flex items-center gap-2 bg-orange-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold shrink-0">
          <FaBullhorn /> {lang === "hi" ? "सूचना" : "Notice"}
        </span>
        <Marquee pauseOnHover gradient={false} speed={45} className="text-sm">
          {items.map((n, i) => (
            <span key={n.id || i} className="ticker-item font-hindi">
              {lang === "hi" ? n.title_hi : n.title_en}
            </span>
          ))}
        </Marquee>
      </div>
    </div>
  );
};

export default NoticeTicker;
