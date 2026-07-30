import React, { useState } from "react";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { FaMapMarkerAlt, FaPhone, FaWhatsapp, FaEnvelope, FaClock } from "react-icons/fa";

const Contact = () => {
  const { t } = useI18n();
  const [f, setF] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setF(v => ({ ...v, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", f);
      toast.success(t({ hi: "संदेश भेज दिया गया!", en: "Message sent!" }));
      setF({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast.error("Failed to send");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12" data-testid="contact-page">
      <h1 className="section-title text-3xl">{t({ hi: "हमसे संपर्क करें", en: "Contact Us" })}</h1>
      <p className="text-slate-600 mt-3">{t({ hi: "किसी भी जानकारी के लिए कॉल, व्हाट्सएप या संदेश भेजें।", en: "For any information, call, WhatsApp or send us a message." })}</p>

      <div className="grid md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-1 space-y-4">
          {[
            { icon: FaMapMarkerAlt, title: t({ hi: "पता", en: "Address" }), val: "200 Mtr From Bus Stand, Begu–Bhadra Road, Kagdana, Sirsa, Haryana" },
            { icon: FaPhone, title: t({ hi: "फ़ोन", en: "Phone" }), val: "8167862016", href: "tel:8167862016" },
            { icon: FaWhatsapp, title: "WhatsApp", val: "8168762016", href: "https://wa.me/918168762016" },
            { icon: FaEnvelope, title: "Email", val: "haryanaenterpriseskagdana@gmail.com", href: "mailto:haryanaenterpriseskagdana@gmail.com" },
            { icon: FaClock, title: t({ hi: "समय", en: "Hours" }), val: "Mon-Sat: 9:00 AM - 7:00 PM" },
          ].map((c, i) => {
            const Icon = c.icon;
            const content = (
              <div className="bg-white p-4 border border-slate-200 rounded-lg flex items-start gap-3 hover:shadow-md transition" data-testid={`contact-info-${i}`}>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><Icon /></div>
                <div>
                  <div className="text-sm font-semibold text-emerald-900">{c.title}</div>
                  <div className="text-sm text-slate-600 break-all">{c.val}</div>
                </div>
              </div>
            );
            return c.href ? <a key={i} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{content}</a> : <div key={i}>{content}</div>;
          })}
        </div>

        <form onSubmit={submit} className="md:col-span-2 bg-white p-6 md:p-8 rounded-lg border border-slate-200 shadow-sm space-y-4" data-testid="contact-form">
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">{t({ hi: "नाम", en: "Name" })} *</label><input required className="input" value={f.name} onChange={set("name")} data-testid="contact-name-input" /></div>
            <div><label className="label">Email *</label><input required type="email" className="input" value={f.email} onChange={set("email")} data-testid="contact-email-input" /></div>
            <div><label className="label">{t({ hi: "मोबाइल", en: "Phone" })}</label><input className="input" value={f.phone} onChange={set("phone")} data-testid="contact-phone-input" /></div>
            <div><label className="label">{t({ hi: "विषय", en: "Subject" })} *</label><input required className="input" value={f.subject} onChange={set("subject")} data-testid="contact-subject-input" /></div>
          </div>
          <div><label className="label">{t({ hi: "संदेश", en: "Message" })} *</label><textarea required rows="5" className="input" value={f.message} onChange={set("message")} data-testid="contact-message-input" /></div>
          <button disabled={loading} className="btn-primary" data-testid="contact-submit-btn">{loading ? "..." : <><i className="fa-solid fa-paper-plane"></i> {t({ hi: "संदेश भेजें", en: "Send Message" })}</>}</button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
