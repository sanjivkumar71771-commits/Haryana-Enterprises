import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/context/I18nContext";
import { S } from "@/lib/strings";
import { FaPhone, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaSolarPanel, FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="footer mt-16" data-testid="site-footer">
      <div className="tri-band" />
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-green-500 to-orange-400 flex items-center justify-center text-white">
              <FaSolarPanel />
            </div>
            <div>
              <div className="text-white font-bold text-lg">{t(S.brand)}</div>
              <div className="text-xs opacity-80">{t(S.tagline)}</div>
            </div>
          </div>
          <p className="text-sm opacity-80">
            {t({
              hi: "PM सूर्य घर, रूफटॉप सोलर व लोन सेवाओं के लिए विश्वसनीय भागीदार।",
              en: "Trusted partner for PM Surya Ghar, Rooftop Solar and loan services.",
            })}
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">{t({ hi: "त्वरित लिंक्स", en: "Quick Links" })}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about">{t(S.nav.about)}</Link></li>
            <li><Link to="/services">{t(S.nav.services)}</Link></li>
            <li><Link to="/solar/apply">{t(S.nav.solar)}</Link></li>
            <li><Link to="/loan/apply">{t(S.nav.loan)}</Link></li>
            <li><Link to="/faq">{t(S.nav.faq)}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">{t({ hi: "संसाधन", en: "Resources" })}</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/notices">{t(S.nav.notices)}</Link></li>
            <li><Link to="/downloads">{t(S.nav.downloads)}</Link></li>
            <li><Link to="/gallery">{t(S.nav.gallery)}</Link></li>
            <li><Link to="/status">{t({ hi: "स्टेटस ट्रैक करें", en: "Track Status" })}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">{t({ hi: "संपर्क करें", en: "Contact Us" })}</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2"><FaMapMarkerAlt className="mt-1 text-orange-300" /> 200 Mtr From Bus Stand, Begu–Bhadra Road, Kagdana, Sirsa, Haryana</li>
            <li className="flex items-center gap-2"><FaPhone className="text-orange-300" /> <a href="tel:8167862016">8167862016</a></li>
            <li className="flex items-center gap-2"><FaWhatsapp className="text-orange-300" /> <a href="https://wa.me/918168762016" target="_blank" rel="noreferrer">8168762016</a></li>
            <li className="flex items-center gap-2"><FaEnvelope className="text-orange-300" /> haryanaenterpriseskagdana@gmail.com</li>
          </ul>
          <div className="flex items-center gap-3 mt-4 text-lg">
            <a href="#" aria-label="Facebook"><FaFacebook /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="YouTube"><FaYoutube /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs opacity-80 flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} {t(S.brand)}. {t({ hi: "सर्वाधिकार सुरक्षित।", en: "All rights reserved." })}</span>
          <span>{t({ hi: "आपका विश्वसनीय ऊर्जा एवं वित्त भागीदार।", en: "Your trusted energy & finance partner." })}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
