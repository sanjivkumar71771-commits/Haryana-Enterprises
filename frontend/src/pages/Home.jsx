import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeroSlider from "@/components/HeroSlider";
import NoticeTicker from "@/components/NoticeTicker";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { S } from "@/lib/strings";
import {
  FaFileSignature, FaHome, FaSearchLocation, FaCogs, FaMoneyCheckAlt, FaTasks, FaFileDownload, FaHeadset,
  FaBullhorn, FaPhone, FaUsersCog, FaChevronRight, FaLink, FaSolarPanel, FaBolt, FaAward,
  FaCalendarAlt, FaFilePdf, FaImages
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
  { name: "राजेश कुमार", place: "Sirsa", text_hi: "PM सूर्य घर योजना के तहत 3kW सिस्टम मिला। बिजली बिल शून्य हो गया है!", text_en: "Got a 3kW system under PM Surya Ghar scheme. Electricity bill is now zero!" },
  { name: "सुनीता देवी", place: "Kagdana", text_hi: "लोन प्रक्रिया बहुत आसान थी। मात्र 5 दिन में मंज़ूरी मिल गयी।", text_en: "The loan process was very smooth. Got approval in just 5 days." },
  { name: "Vikram Singh", place: "Bhadra Road", text_hi: "प्रोफेशनल टीम और बेहतरीन सर्विस। पूरी तरह संतुष्ट हूँ।", text_en: "Professional team and excellent service. Completely satisfied." },
];

const partners = [
  { name: "MNRE", src: "https://mnre.gov.in/img/logo/logo.png" },
  { name: "PM Surya Ghar", src: "https://pmsuryaghar.gov.in/assets/images/logo.png" },
  { name: "Digital India", src: "https://cdnbbsr.s3waas.gov.in/s3194cf6c2de8e00c05fcf16c498adc7bf/uploads/bfi_thumb/2019052265-qnwxelnvme62ylaoiiujk5b2ccd96e1k1qd6gwgjc8.png" },
  { name: "MyGov", src: "https://cdnbbsr.s3waas.gov.in/s3194cf6c2de8e00c05fcf16c498adc7bf/uploads/bfi_thumb/2019041050-qnwxebbnj7rxevpp6wdnapwzt3s7tpwicb6u6uvv8o.png" },
  { name: "India.gov.in", src: "https://cdnbbsr.s3waas.gov.in/s3194cf6c2de8e00c05fcf16c498adc7bf/uploads/bfi_thumb/2019052222-qnwxekq1fk4smzc1o0fwznjlqyhvyoxtplpozmhxig.png" },
  { name: "PM India", src: "https://cdnbbsr.s3waas.gov.in/s3194cf6c2de8e00c05fcf16c498adc7bf/uploads/bfi_thumb/2019032217-qnwxdsivqj26yoh08o93wunrxecvjrtvlq54lbnqp4.png" },
];

const Home = () => {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState("orders");
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    api.get("/notices").then(r => setNotices(r.data)).catch(() => {});
  }, []);

  const orders = [
    { d_hi: "PM सूर्य घर योजना में सब्सिडी ₹78,000 तक बढ़ी", d_en: "PM Surya Ghar subsidy increased up to ₹78,000", date: "15 Jan, 2026" },
    { d_hi: "किसानों के लिए KUSUM योजना के आवेदन प्रारंभ", d_en: "KUSUM scheme applications open for farmers", date: "10 Jan, 2026" },
    { d_hi: "सोलर पैनल पर 25 वर्ष की परफॉर्मेंस वारंटी", d_en: "25-year performance warranty on solar panels", date: "05 Jan, 2026" },
    { d_hi: "बिज़नेस लोन पर विशेष 7.5% ब्याज दर की घोषणा", d_en: "Special 7.5% interest rate on business loans announced", date: "01 Jan, 2026" },
    { d_hi: "रूफटॉप सोलर के लिए DHBVN अनुमोदन प्रक्रिया आसान", d_en: "DHBVN approval simplified for rooftop solar", date: "28 Dec, 2025" },
  ];

  const helplines = [
    { label_hi: "PM सूर्य घर हेल्पलाइन", label_en: "PM Surya Ghar Helpline", val: "1800-180-3333" },
    { label_hi: "MNRE टोल फ्री", label_en: "MNRE Toll Free", val: "1800-180-3333" },
    { label_hi: "बिजली शिकायत DHBVN", label_en: "DHBVN Electricity Complaint", val: "1912" },
    { label_hi: "हरियाणा एंटरप्राइजेज", label_en: "Haryana Enterprises", val: "8167862016" },
    { label_hi: "WhatsApp सहायता", label_en: "WhatsApp Support", val: "8168762016" },
  ];

  const news = [
    { hi: "PM सूर्य घर योजना: लक्ष्य 1 करोड़ घर तक पहुँचा", en: "PM Surya Ghar Scheme: Target of 1 crore homes reached", date: "20 Jan, 2026" },
    { hi: "सोलर लोन की मंज़ूरी अब मात्र 5 दिनों में", en: "Solar loan approval now in just 5 days", date: "18 Jan, 2026" },
    { hi: "हरियाणा में सोलर पंपों पर 75% सब्सिडी", en: "75% subsidy on solar pumps in Haryana", date: "12 Jan, 2026" },
  ];

  const quickLinks = [
    { hi: "PM सूर्य घर पोर्टल", en: "PM Surya Ghar Portal", url: "https://pmsuryaghar.gov.in", external: true },
    { hi: "MNRE अधिकारिक साइट", en: "MNRE Official Site", url: "https://mnre.gov.in", external: true },
    { hi: "DHBVN", en: "DHBVN (Dakshin Haryana Bijli)", url: "https://dhbvn.org.in", external: true },
    { hi: "UHBVN", en: "UHBVN (Uttar Haryana Bijli)", url: "https://uhbvn.org.in", external: true },
    { hi: "Digital India", en: "Digital India", url: "https://digitalindia.gov.in", external: true },
    { hi: "MyGov पोर्टल", en: "MyGov Portal", url: "https://mygov.in", external: true },
    { hi: "हरियाणा सरकार", en: "Government of Haryana", url: "https://haryana.gov.in", external: true },
    { hi: "आवेदन स्थिति", en: "Application Status", url: "/status", external: false },
  ];

  return (
    <div id="main-content" data-testid="home-page">
      <HeroSlider />
      <NoticeTicker />

      {/* ────── Main content grid: (left 2/3) + (right sidebar) ────── */}
      <section className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Services grid */}
          <div className="gov-panel" data-testid="quick-services-panel">
            <div className="gov-panel-header">
              <FaCogs /> {t(S.services.title)}
            </div>
            <div className="gov-panel-body">
              <p className="text-sm text-slate-600 mb-4">{t(S.services.sub)}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {services.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Link key={s.key} to={s.to} className="svc-card" data-testid={`quick-service-${s.key}`}>
                      <div className="svc-icon"><Icon /></div>
                      <div className="text-sm font-semibold text-emerald-900 leading-tight">{t(S.services[s.key])}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="gov-panel" data-testid="about-brief-panel">
            <div className="gov-panel-header"><FaAward /> {lang === "hi" ? "हमारे बारे में" : "About Us"}</div>
            <div className="gov-panel-body">
              <div className="grid md:grid-cols-3 gap-4">
                <img src="https://images.unsplash.com/photo-1609252509027-3928a66302fd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwyfHxydXJhbCUyMGluZGlhJTIwZmFybWVyJTIwd29ya2luZ3xlbnwwfHx8fDE3ODUzODc0NDV8MA&ixlib=rb-4.1.0&q=85" alt="rural" className="rounded w-full h-32 md:h-full object-cover" />
                <div className="md:col-span-2 text-sm text-slate-700 leading-relaxed">
                  <p>
                    <b className="text-emerald-800">{t(S.brand)}</b> {lang === "hi"
                      ? "सिरसा जिले में स्थित एक विश्वसनीय संस्था है जो PM सूर्य घर मुफ्त बिजली योजना, रूफटॉप सोलर स्थापना, KUSUM योजना, और वित्तीय सेवाओं में विशेषज्ञ है।"
                      : "is a trusted organisation in Sirsa district specialising in PM Surya Ghar Free Electricity Scheme, Rooftop Solar installation, KUSUM scheme, and financial services."}
                  </p>
                  <ul className="mt-3 gov-list -mx-4">
                    <li>{lang === "hi" ? "MNRE अनुमोदित सोलर वेंडर" : "MNRE-approved solar vendor"}</li>
                    <li>{lang === "hi" ? "500+ सफल सोलर इंस्टॉलेशन" : "500+ successful solar installations"}</li>
                    <li>{lang === "hi" ? "₹2 करोड़+ की सब्सिडी दिलवाई" : "₹2 crore+ subsidy facilitated"}</li>
                    <li>{lang === "hi" ? "अधिकृत लोन पार्टनर, 7.5% ब्याज दर से" : "Authorised loan partner from 7.5% interest"}</li>
                  </ul>
                  <Link to="/about" className="btn-gov mt-3" data-testid="about-read-more"><FaChevronRight /> {lang === "hi" ? "और पढ़ें" : "Read More"}</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed section: Latest Orders / Helpline / News */}
          <div className="gov-panel" data-testid="tabbed-info-panel">
            <div className="gov-tabs" role="tablist">
              <div className={`gov-tab ${tab === "orders" ? "active" : ""}`} onClick={() => setTab("orders")} data-testid="tab-orders">
                <FaFilePdf className="inline mr-1" /> {lang === "hi" ? "ताज़ा आदेश / अपडेट" : "Latest Updates"}
              </div>
              <div className={`gov-tab ${tab === "helpline" ? "active" : ""}`} onClick={() => setTab("helpline")} data-testid="tab-helpline">
                <FaPhone className="inline mr-1" /> {lang === "hi" ? "हेल्पलाइन" : "Helpline"}
              </div>
              <div className={`gov-tab ${tab === "news" ? "active" : ""}`} onClick={() => setTab("news")} data-testid="tab-news">
                <FaBullhorn className="inline mr-1" /> {lang === "hi" ? "समाचार" : "News/Press"}
              </div>
            </div>
            <div className="p-2">
              {tab === "orders" && (
                <ul className="gov-list" data-testid="orders-list">
                  {orders.map((o, i) => (
                    <li key={i} className="flex items-start justify-between gap-3">
                      <a href="#" className="flex-1">{lang === "hi" ? o.d_hi : o.d_en}</a>
                      <span className="text-xs text-slate-500 whitespace-nowrap"><FaCalendarAlt className="inline mr-1 text-orange-500" />{o.date}</span>
                    </li>
                  ))}
                </ul>
              )}
              {tab === "helpline" && (
                <ul className="gov-list" data-testid="helpline-list">
                  {helplines.map((h, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span>{lang === "hi" ? h.label_hi : h.label_en}</span>
                      <a href={`tel:${h.val}`} className="text-emerald-700 font-bold font-mono"><FaPhone className="inline mr-1 text-orange-500" />{h.val}</a>
                    </li>
                  ))}
                </ul>
              )}
              {tab === "news" && (
                <ul className="gov-list" data-testid="news-list">
                  {news.map((n, i) => (
                    <li key={i} className="flex items-start justify-between gap-3">
                      <a href="#" className="flex-1">{lang === "hi" ? n.hi : n.en}</a>
                      <span className="text-xs text-slate-500 whitespace-nowrap">{n.date}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white rounded p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center" data-testid="stats-strip">
            {[
              { n: "500+", l_hi: "इंस्टॉलेशन", l_en: "Installations" },
              { n: "₹2 Cr+", l_hi: "सब्सिडी दिलवाई", l_en: "Subsidy Given" },
              { n: "7.5%", l_hi: "से लोन दर", l_en: "Loan Rate From" },
              { n: "5+", l_hi: "वर्षों का अनुभव", l_en: "Years Experience" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-2xl md:text-3xl font-extrabold text-orange-300">{s.n}</div>
                <div className="text-xs md:text-sm opacity-90 mt-1">{lang === "hi" ? s.l_hi : s.l_en}</div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="gov-panel" data-testid="testimonials-panel">
            <div className="gov-panel-header"><FaUsersCog /> {lang === "hi" ? "ग्राहकों की प्रतिक्रिया" : "Customer Testimonials"}</div>
            <div className="gov-panel-body grid md:grid-cols-3 gap-4">
              {testimonials.map((tm, i) => (
                <div key={i} className="border border-slate-200 rounded p-3 bg-slate-50" data-testid={`testimonial-${i}`}>
                  <div className="text-orange-500 mb-1">{"★★★★★"}</div>
                  <p className="text-xs text-slate-700 italic mb-2 font-hindi">"{lang === "hi" ? tm.text_hi : tm.text_en}"</p>
                  <div className="flex items-center gap-2 border-t border-slate-200 pt-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">{tm.name[0]}</div>
                    <div className="text-xs">
                      <div className="font-semibold text-emerald-900">{tm.name}</div>
                      <div className="text-slate-500">{tm.place}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-6" data-testid="right-sidebar">
          {/* Notice Board */}
          <div className="gov-panel">
            <div className="gov-panel-header"><FaBullhorn className="text-red-600" /> {lang === "hi" ? "सूचना बोर्ड" : "Notice Board"}</div>
            <div className="p-0 max-h-64 overflow-y-auto">
              <ul className="gov-list" data-testid="notice-board-list">
                {notices.slice(0, 6).map((n, i) => (
                  <li key={n.id || i}>
                    <div className="flex items-start gap-2">
                      {n.type === "important" && <span className="new-badge shrink-0 mt-1">NEW</span>}
                      <span className="font-hindi">{lang === "hi" ? n.title_hi : n.title_en}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Links */}
          <div className="gov-panel">
            <div className="gov-panel-header"><FaLink /> {lang === "hi" ? "उपयोगी लिंक" : "Quick Links"}</div>
            <ul className="quick-links" data-testid="quick-links-list">
              {quickLinks.map((q, i) => (
                <li key={i}>
                  {q.external ? (
                    <a href={q.url} target="_blank" rel="noreferrer">{lang === "hi" ? q.hi : q.en}</a>
                  ) : (
                    <Link to={q.url}>{lang === "hi" ? q.hi : q.en}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Downloads mini */}
          <div className="gov-panel">
            <div className="gov-panel-header"><FaFileDownload /> {lang === "hi" ? "डाउनलोड करें" : "Downloads"}</div>
            <ul className="gov-list" data-testid="sidebar-downloads-list">
              {[
                { hi: "PM सूर्य घर आवेदन फॉर्म", en: "PM Surya Ghar Application Form" },
                { hi: "सोलर सब्सिडी गाइडलाइन", en: "Solar Subsidy Guidelines" },
                { hi: "लोन आवेदन चेकलिस्ट", en: "Loan Application Checklist" },
                { hi: "रूफटॉप सोलर ब्रोशर", en: "Rooftop Solar Brochure" },
              ].map((d, i) => (
                <li key={i}><Link to="/downloads">{lang === "hi" ? d.hi : d.en} <FaFilePdf className="inline text-red-500 ml-1" /></Link></li>
              ))}
            </ul>
            <div className="p-2 border-t border-slate-200">
              <Link to="/downloads" className="btn-gov-orange w-full justify-center text-xs" data-testid="view-all-downloads-btn">
                <FaFileDownload /> {lang === "hi" ? "सभी डाउनलोड देखें" : "View All Downloads"}
              </Link>
            </div>
          </div>

          {/* Contact card */}
          <div className="gov-panel bg-gradient-to-br from-orange-50 to-white">
            <div className="gov-panel-header"><FaHeadset /> {lang === "hi" ? "मुफ्त परामर्श" : "Free Consultation"}</div>
            <div className="p-4 text-center">
              <div className="text-xs text-slate-500 mb-2">{lang === "hi" ? "अभी कॉल करें, हमारी टीम आपकी सहायता करेगी" : "Call now, our team will assist you"}</div>
              <a href="tel:8167862016" className="text-2xl font-extrabold text-emerald-800 block mb-1">
                <FaPhone className="inline text-orange-600 mr-1 text-lg" /> 8167862016
              </a>
              <a href="https://wa.me/918168762016" target="_blank" rel="noreferrer" className="btn-gov-orange w-full justify-center mt-2 text-sm" data-testid="sidebar-whatsapp-btn">
                {lang === "hi" ? "WhatsApp पर संदेश करें" : "Message on WhatsApp"}
              </a>
            </div>
          </div>
        </aside>
      </section>

      {/* Photo Gallery preview */}
      <section className="max-w-7xl mx-auto px-4 pb-8" data-testid="gallery-preview-section">
        <div className="gov-panel">
          <div className="gov-panel-header flex items-center justify-between !flex">
            <span className="flex items-center gap-2"><FaImages /> {lang === "hi" ? "फ़ोटो गैलरी" : "Photo Gallery"}</span>
            <Link to="/gallery" className="text-xs text-emerald-700 hover:text-orange-600 normal-case tracking-normal" data-testid="view-all-gallery-btn">
              {lang === "hi" ? "सभी देखें »" : "View All »"}
            </Link>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "https://images.unsplash.com/photo-1655300256335-beef51a914fe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHw0fHxyb29mdG9wJTIwc29sYXIlMjBwYW5lbHMlMjBob21lfGVufDB8fHx8MTc4NTM4NzQzNHww&ixlib=rb-4.1.0&q=85",
              "https://images.unsplash.com/photo-1660330589257-813305a4a383?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwzfHxyb29mdG9wJTIwc29sYXIlMjBwYW5lbHMlMjBob21lfGVufDB8fHx8MTc4NTM4NzQzNHww&ixlib=rb-4.1.0&q=85",
              "https://images.unsplash.com/photo-1521791136064-7986c2920216?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwyfHxidXNpbmVzcyUyMGxvYW4lMjBwYXBlciUyMGhhbmRzaGFrZXxlbnwwfHx8fDE3ODUzODc0MzR8MA&ixlib=rb-4.1.0&q=85",
              "https://images.unsplash.com/photo-1609252509027-3928a66302fd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwyfHxydXJhbCUyMGluZGlhJTIwZmFybWVyJTIwd29ya2luZ3xlbnwwfHx8fDE3ODUzODc0NDV8MA&ixlib=rb-4.1.0&q=85",
            ].map((src, i) => (
              <div key={i} className="aspect-video rounded overflow-hidden border border-slate-200 group cursor-pointer" data-testid={`gallery-preview-${i}`}>
                <img src={src} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner logos strip */}
      <div className="partner-strip" data-testid="partner-strip">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-around gap-8">
          {partners.map((p, i) => (
            <img key={i} src={p.src} alt={p.name} title={p.name} className="partner-logo" data-testid={`partner-${i}`} onError={(e) => { e.target.style.display = "none"; }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
