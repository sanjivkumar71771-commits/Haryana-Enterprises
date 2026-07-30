import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import { FaSearch, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const StatusLookup = () => {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const [ref, setRef] = useState(params.get("ref") || "");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async (refNo) => {
    if (!refNo) return;
    setLoading(true); setErr(""); setResult(null);
    try {
      const { data } = await api.get(`/status/${refNo}`);
      setResult(data);
    } catch (e) {
      setErr(t({ hi: "आवेदन नहीं मिला। रेफ नंबर जांचें।", en: "Application not found. Please check the reference number." }));
    } finally { setLoading(false); }
  };

  useEffect(() => { if (params.get("ref")) search(params.get("ref")); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12" data-testid="status-page">
      <h1 className="section-title text-3xl">{t({ hi: "आवेदन स्थिति ट्रैक करें", en: "Track Application Status" })}</h1>
      <p className="text-slate-600 mt-3">{t({ hi: "अपना रेफ. नंबर डालें (जैसे SOL-XXXXXX या LOAN-XXXXXX)", en: "Enter your Ref. No. (e.g. SOL-XXXXXX or LOAN-XXXXXX)" })}</p>

      <form onSubmit={(e) => { e.preventDefault(); search(ref); }} className="flex gap-2 mt-6" data-testid="status-form">
        <input className="input flex-1" placeholder="SOL-XXXXXXXX" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} data-testid="status-ref-input" />
        <button disabled={loading} className="btn-primary" data-testid="status-search-btn"><FaSearch /> {loading ? "..." : t({ hi: "खोजें", en: "Search" })}</button>
      </form>

      {err && <div className="mt-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded flex items-center gap-2" data-testid="status-error"><FaTimesCircle /> {err}</div>}

      {result && (
        <div className="mt-6 bg-white border border-emerald-200 rounded-lg p-6" data-testid="status-result">
          <div className="flex items-center gap-3 mb-4">
            <FaCheckCircle className="text-emerald-600 text-2xl" />
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Reference</div>
              <div className="font-mono font-bold text-emerald-800 text-lg">{result.ref_no}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Name:</span> <b>{result.full_name}</b></div>
            <div><span className="text-slate-500">Status:</span> <span className="badge badge-submitted">{result.status}</span></div>
            <div><span className="text-slate-500">Phone:</span> {result.phone}</div>
            <div><span className="text-slate-500">City:</span> {result.city}</div>
            <div className="col-span-2"><span className="text-slate-500">Submitted:</span> {new Date(result.created_at).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusLookup;
