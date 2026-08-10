import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import {
  FaUser, FaPhone, FaEnvelope, FaCommentDots, FaHeadset,
  FaCheckCircle, FaShieldAlt, FaWhatsapp, FaClock, FaMapMarkerAlt
} from "react-icons/fa";

const SERVICES = [
  { hi: "सोलर परामर्श (Solar Consultation)", en: "Solar Consultation" },
  { hi: "साइट सर्वे (Site Assessment)", en: "Site Assessment" },
  { hi: "सोलर सिस्टम प्लानिंग", en: "Solar System Planning" },
  { hi: "इंस्टॉलेशन सहायता", en: "Installation Assistance" },
  { hi: "सोलर योजना जानकारी", en: "Solar Scheme Information" },
  { hi: "आफ्टर-सेल्स सहायता", en: "After-Sales Support" },
  { hi: "अन्य", en: "Other" },
];

const Enquiry = () => {
  const { lang } = useI18n();
  const hi = lang === "hi";
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [f, setF] = useState({
    full_name: "",
    mobile: "",
    email: "",
    service: params.get("service") || (hi ? "सोलर परामर्श (Solar Consultation)" : "Solar Consultation"),
    message: "",
  });

  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[0-9+\-\s]{7,15}$/.test(f.mobile)) {
      toast.error(hi ? "कृपया वैध मोबाइल नंबर दर्ज करें" : "Please enter a valid mobile number");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/enquiry", f);
      setDone(data.ref_no);
      toast.success(hi ? `पूछताछ प्राप्त हुई! रेफ नं: ${data.ref_no}` : `Enquiry received! Ref: ${data.ref_no}`);
    } catch (err) {
      const d = err.response?.data?.detail;
      toast.error(typeof d === "string" ? d : (hi ? "जमा नहीं हुआ" : "Submission failed"));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16" data-testid="enquiry-success-page">
        <div className="glass-strong p-8 md:p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-3xl mb-4">
            <FaCheckCircle />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-2" data-testid="enquiry-thanks-title">
            {hi ? "धन्यवाद!" : "Thank you!"}
          </h1>
          <p className="text-slate-400 mb-4">
            {hi
              ? "हमें आपकी पूछताछ मिल गई है। हमारी टीम 24 घंटे में आपसे संपर्क करेगी।"
              : "We've received your enquiry. Our team will contact you within 24 hours."}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-emerald-300 font-mono" data-testid="enquiry-ref-no">
            {hi ? "रेफ नं" : "Ref No."}: <b>{done}</b>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="tel:8168762016" className="btn-mint" data-testid="enquiry-call-btn">
              <FaHeadset /> {hi ? "कॉल करें" : "Call Us"}
            </a>
            <a href="https://wa.me/918168762016" target="_blank" rel="noreferrer" className="btn-outline-mint" data-testid="enquiry-whatsapp-btn">
              <FaWhatsapp /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10" data-testid="enquiry-page">
      <div className="mb-6">
        <div className="section-eyebrow">Customer Enquiry</div>
        <h1 className="section-title !text-3xl" data-testid="enquiry-title">
          {hi ? "सोलर पूछताछ" : "Solar Enquiry"}
        </h1>
        <p className="text-slate-400 mt-2 text-sm max-w-2xl">
          {hi
            ? "रूफटॉप सोलर परामर्श, साइट सर्वे या इंस्टॉलेशन जानकारी के लिए यह फॉर्म भरें। हमारी टीम आपसे संपर्क करेगी।"
            : "Fill this form for rooftop solar consultation, site assessment or installation information. Our team will get in touch with you."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={submit} className="glass p-6 md:p-8 space-y-5 lg:col-span-2" data-testid="enquiry-form">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">{hi ? "पूरा नाम" : "Full Name"} *</label>
              <div className="input-icon-wrap">
                <FaUser className="icon" />
                <input required className="input" placeholder={hi ? "आपका पूरा नाम" : "Your full name"} value={f.full_name} onChange={set("full_name")} data-testid="enquiry-name-input" />
              </div>
            </div>
            <div>
              <label className="label">{hi ? "मोबाइल नंबर" : "Mobile Number"} *</label>
              <div className="input-icon-wrap">
                <FaPhone className="icon" />
                <input required className="input" placeholder="98xxxxxxxx" value={f.mobile} onChange={set("mobile")} data-testid="enquiry-mobile-input" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="label">{hi ? "ईमेल पता" : "Email Address"} *</label>
              <div className="input-icon-wrap">
                <FaEnvelope className="icon" />
                <input required type="email" className="input" placeholder="you@example.com" value={f.email} onChange={set("email")} data-testid="enquiry-email-input" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="label">{hi ? "आप किस सेवा में रुचि रखते हैं?" : "Service Interested In"} *</label>
              <select required className="input" value={f.service} onChange={set("service")} data-testid="enquiry-service-select">
                {SERVICES.map((s, i) => (
                  <option key={i} value={hi ? s.hi : s.en}>{hi ? s.hi : s.en}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">{hi ? "आपका संदेश" : "Message"} *</label>
              <div className="input-icon-wrap">
                <FaCommentDots className="icon !top-4" />
                <textarea required rows="4" className="input" placeholder={hi ? "अपनी आवश्यकता संक्षेप में लिखें (जैसे: 3 kW रूफटॉप सोलर की जानकारी चाहिए)" : "Briefly describe your requirement (e.g., need information about 3 kW rooftop solar)"} value={f.message} onChange={set("message")} data-testid="enquiry-message-input" />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 text-[11px] text-emerald-200/90 flex items-start gap-2" data-testid="enquiry-privacy-note">
            <FaShieldAlt className="text-emerald-400 mt-0.5 shrink-0" />
            <div>
              {hi
                ? "हम कभी भी आधार, PAN, बैंक विवरण, OTP या पासवर्ड नहीं माँगते। आपकी जानकारी केवल आपसे संपर्क के लिए उपयोग होगी।"
                : "We never ask for Aadhaar, PAN, bank details, OTP or passwords. Your information will only be used to contact you back."}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-white/5 flex-wrap">
            <button type="submit" disabled={loading} className="btn-mint" data-testid="enquiry-submit-btn">
              {loading ? "..." : <><FaHeadset /> {hi ? "पूछताछ भेजें" : "Send Enquiry"}</>}
            </button>
            <span className="text-xs text-slate-400">{hi ? "सबमिट करने के बाद रेफ. नंबर मिलेगा।" : "You'll receive a reference number after submission."}</span>
          </div>
        </form>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="glass p-5" data-testid="enquiry-side-contact">
            <div className="text-xs uppercase text-emerald-400 font-semibold tracking-widest mb-3">
              {hi ? "सीधा संपर्क" : "Direct Contact"}
            </div>
            <div className="space-y-3 text-sm">
              <a href="tel:8168762016" className="flex items-center gap-3 text-slate-300 hover:text-emerald-400">
                <span className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center"><FaPhone /></span>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest">{hi ? "फोन" : "Phone"}</div>
                  <div className="font-semibold">8168762016</div>
                </div>
              </a>
              <a href="https://wa.me/918168762016" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-emerald-400">
                <span className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center"><FaWhatsapp /></span>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest">WhatsApp</div>
                  <div className="font-semibold">8168762016</div>
                </div>
              </a>
              <a href="mailto:haryanaenterpriseskagdana@gmail.com" className="flex items-center gap-3 text-slate-300 hover:text-emerald-400">
                <span className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center"><FaEnvelope /></span>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest">Email</div>
                  <div className="font-semibold text-xs break-all">haryanaenterpriseskagdana@gmail.com</div>
                </div>
              </a>
            </div>
          </div>

          <div className="glass p-5" data-testid="enquiry-side-hours">
            <div className="text-xs uppercase text-emerald-400 font-semibold tracking-widest mb-3">
              {hi ? "कार्यालय समय" : "Office Hours"}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center"><FaClock /></span>
              <div>{hi ? "सोम–शनि · सुबह 9 – शाम 7" : "Mon–Sat · 9:00 AM – 7:00 PM"}</div>
            </div>
          </div>

          <div className="glass p-5" data-testid="enquiry-side-address">
            <div className="text-xs uppercase text-emerald-400 font-semibold tracking-widest mb-3">
              {hi ? "पता" : "Office Address"}
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-300">
              <span className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0"><FaMapMarkerAlt /></span>
              <div>200 Mtr From Bus Stand, Begu–Bhadra Road, Kagdana, Sirsa, Haryana</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Enquiry;
