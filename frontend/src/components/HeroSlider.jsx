import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/context/I18nContext";
import { S } from "@/lib/strings";

const SLIDES = [
  {
    bg: "https://images.unsplash.com/photo-1655300256335-beef51a914fe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHw0fHxyb29mdG9wJTIwc29sYXIlMjBwYW5lbHMlMjBob21lfGVufDB8fHx8MTc4NTM4NzQzNHww&ixlib=rb-4.1.0&q=85",
    title: "hero.slide1_title",
    sub: "hero.slide1_sub",
    cta: "/solar/apply",
  },
  {
    bg: "https://images.unsplash.com/photo-1660330589257-813305a4a383?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwzfHxyb29mdG9wJTIwc29sYXIlMjBwYW5lbHMlMjBob21lfGVufDB8fHx8MTc4NTM4NzQzNHww&ixlib=rb-4.1.0&q=85",
    title: "hero.slide2_title",
    sub: "hero.slide2_sub",
    cta: "/solar/apply",
  },
  {
    bg: "https://images.unsplash.com/photo-1521791136064-7986c2920216?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwyfHxidXNpbmVzcyUyMGxvYW4lMjBwYXBlciUyMGhhbmRzaGFrZXxlbnwwfHx8fDE3ODUzODc0MzR8MA&ixlib=rb-4.1.0&q=85",
    title: "hero.slide3_title",
    sub: "hero.slide3_sub",
    cta: "/loan/apply",
  },
];

const resolve = (path, obj) => path.split(".").reduce((a, k) => a?.[k], obj);

const HeroSlider = () => {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);
  const slide = SLIDES[idx];
  return (
    <section className="relative overflow-hidden" data-testid="hero-slider">
      <div className="hero-slide" style={{ backgroundImage: `url(${slide.bg})` }}>
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 text-white">
          <div className="max-w-2xl" key={idx}>
            <div className="inline-block bg-orange-500 text-white text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded mb-4" data-aos="fade-right">
              {t({ hi: "सरकारी अनुमोदित", en: "Govt Approved" })}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4 drop-shadow" data-aos="fade-up">
              {t(resolve(slide.title, S))}
            </h1>
            <p className="text-lg opacity-95 mb-8 drop-shadow-sm" data-aos="fade-up" data-aos-delay="150">
              {t(resolve(slide.sub, S))}
            </p>
            <div className="flex flex-wrap gap-3" data-aos="fade-up" data-aos-delay="300">
              <Link to={slide.cta} className="btn-orange" data-testid={`hero-apply-btn-${idx}`}>
                <i className="fa-solid fa-file-signature"></i> {t(S.hero.apply_now)}
              </Link>
              <Link to="/services" className="btn-outline !border-white !text-white hover:!bg-white hover:!text-emerald-900" data-testid={`hero-know-btn-${idx}`}>
                {t(S.hero.know_more)} <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            data-testid={`hero-dot-${i}`}
            className={`h-2 rounded-full transition-all ${i === idx ? "bg-orange-400 w-8" : "bg-white/60 w-2"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
