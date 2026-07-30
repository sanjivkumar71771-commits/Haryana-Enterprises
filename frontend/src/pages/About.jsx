import React from "react";
import { useI18n } from "@/context/I18nContext";

const About = () => {
  const { t, lang } = useI18n();
  return (
    <div className="max-w-7xl mx-auto px-4 py-12" data-testid="about-page">
      <div className="section-eyebrow">About</div>
      <h1 className="section-title !text-3xl">{t({ hi: "हमारे बारे में", en: "About Us" })}</h1>
      <div className="grid md:grid-cols-2 gap-8 mt-8 items-center">
        <div>
          <img src="https://images.unsplash.com/photo-1609252509027-3928a66302fd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwyfHxydXJhbCUyMGluZGlhJTIwZmFybWVyJTIwd29ya2luZ3xlbnwwfHx8fDE3ODUzODc0NDV8MA&ixlib=rb-4.1.0&q=85" alt="Rural India" className="rounded-2xl w-full border border-white/10" />
        </div>
        <div className="glass p-6 space-y-3 text-slate-300 leading-relaxed text-sm">
          <p className="font-display font-semibold text-emerald-400 text-lg">
            {t({ hi: "हरियाणा एंटरप्राइजेज – कागदाना, सिरसा", en: "Haryana Enterprises – Kagdana, Sirsa" })}
          </p>
          <p>{t({ hi: "हम सिरसा जिले की एक विश्वसनीय संस्था हैं जो PM सूर्य घर, रूफटॉप सोलर, KUSUM योजना और वित्तीय सेवाओं में विशेषज्ञता रखती है।", en: "We are a trusted organisation in Sirsa district specialising in PM Surya Ghar, Rooftop Solar, KUSUM scheme and financial services." })}</p>
          <p>{t({ hi: "हमारा उद्देश्य हर घर तक सस्ती व स्वच्छ ऊर्जा पहुँचाना और आसान वित्तीय सहायता देना है।", en: "Our mission is to bring affordable clean energy to every home and to provide easy financial support." })}</p>
          <ul className="mt-3 space-y-1.5">
            {[
              { hi: "MNRE अनुमोदित सोलर पार्टनर", en: "MNRE-approved solar partner" },
              { hi: "500+ सफल इंस्टॉलेशन", en: "500+ successful installations" },
              { hi: "5+ वर्षों का अनुभव", en: "5+ years of experience" },
              { hi: "5–7 दिनों में लोन मंज़ूरी", en: "Loan approval in 5-7 days" },
            ].map((b, i) => (
              <li key={i} className="flex items-center gap-2 text-slate-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {lang === "hi" ? b.hi : b.en}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;
