import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/context/I18nContext";
import { S } from "@/lib/strings";
import { FaPhone, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa";

const Footer = () => {
  const { t, lang } = useI18n();
  return (
    <footer className="footer mt-10" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-start gap-3 mb-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/120px-Emblem_of_India.svg.png" alt="Emblem" className="w-14 h-14 object-contain bg-white/10 p-1 rounded" />
            <div>
              <div className="text-white font-bold text-base">{t(S.brand)}</div>
              <div className="text-xs opacity-80 mt-1">{t(S.tagline)}</div>
            </div>
          </div>
          <p className="text-xs opacity-85 mt-2 leading-relaxed">
            {t({
              hi: "PM सूर्य घर, रूफटॉप सोलर व लोन सेवाओं के लिए सिरसा का विश्वसनीय भागीदार। MNRE अनुमोदित।",
              en: "Sirsa's trusted partner for PM Surya Ghar, Rooftop Solar and loan services. MNRE-approved.",
            })}
          </p>
        </div>

        <div>
          <h4>{t({ hi: "त्वरित लिंक्स", en: "Quick Links" })}</h4>
          <ul className="space-y-1.5 text-sm mt-3">
            <li><Link to="/about">» {t(S.nav.about)}</Link></li>
            <li><Link to="/services">» {t(S.nav.services)}</Link></li>
            <li><Link to="/solar/apply">» {t(S.nav.solar)}</Link></li>
            <li><Link to="/loan/apply">» {t(S.nav.loan)}</Link></li>
            <li><Link to="/status">» {t({ hi: "स्टेटस ट्रैक करें", en: "Track Status" })}</Link></li>
          </ul>
        </div>

        <div>
          <h4>{t({ hi: "संसाधन", en: "Resources" })}</h4>
          <ul className="space-y-1.5 text-sm mt-3">
            <li><Link to="/notices">» {t(S.nav.notices)}</Link></li>
            <li><Link to="/downloads">» {t(S.nav.downloads)}</Link></li>
            <li><Link to="/gallery">» {t(S.nav.gallery)}</Link></li>
            <li><Link to="/faq">» {t(S.nav.faq)}</Link></li>
            <li><a href="https://mnre.gov.in" target="_blank" rel="noreferrer">» MNRE Portal</a></li>
            <li><a href="https://pmsuryaghar.gov.in" target="_blank" rel="noreferrer">» PM Surya Ghar</a></li>
          </ul>
        </div>

        <div>
          <h4>{t({ hi: "संपर्क करें", en: "Contact Us" })}</h4>
          <ul className="space-y-2 text-sm mt-3">
            <li className="flex items-start gap-2"><FaMapMarkerAlt className="mt-1 text-orange-400 shrink-0" /> <span>200 Mtr From Bus Stand, Begu–Bhadra Road, Kagdana, Sirsa, Haryana</span></li>
            <li className="flex items-center gap-2"><FaPhone className="text-orange-400" /> <a href="tel:8167862016">8167862016</a></li>
            <li className="flex items-center gap-2"><FaWhatsapp className="text-orange-400" /> <a href="https://wa.me/918168762016" target="_blank" rel="noreferrer">8168762016</a></li>
            <li className="flex items-start gap-2"><FaEnvelope className="mt-1 text-orange-400 shrink-0" /> <a href="mailto:haryanaenterpriseskagdana@gmail.com" className="break-all">haryanaenterpriseskagdana@gmail.com</a></li>
          </ul>
          <div className="flex items-center gap-3 mt-4 text-lg">
            <a href="#" aria-label="Facebook" className="hover:!text-orange-400"><FaFacebook /></a>
            <a href="#" aria-label="Twitter/X" className="hover:!text-orange-400"><FaTwitter /></a>
            <a href="#" aria-label="Instagram" className="hover:!text-orange-400"><FaInstagram /></a>
            <a href="#" aria-label="YouTube" className="hover:!text-orange-400"><FaYoutube /></a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-3 text-xs opacity-90 flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} {t(S.brand)}. {t({ hi: "सर्वाधिकार सुरक्षित।", en: "All rights reserved." })}</span>
          <span>{t({ hi: "इस साइट के सामग्री का स्वामित्व हरियाणा एंटरप्राइजेज के पास है।", en: "Content owned by Haryana Enterprises." })}</span>
        </div>
      </div>

      {/* Tricolor bottom */}
      <div className="tricolor-strip">
        <div className="b1"></div><div className="b2"></div><div className="b3"></div>
      </div>
    </footer>
  );
};

export default Footer;
