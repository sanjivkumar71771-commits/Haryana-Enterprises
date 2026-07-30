import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaSolarPanel, FaMoneyBillWave, FaFilePdf, FaUserCircle, FaFileAlt, FaPlusCircle } from "react-icons/fa";

const badgeCls = (s) => {
  const m = { submitted: "badge-submitted", under_review: "badge-review", approved: "badge-approved", rejected: "badge-rejected" };
  return `badge ${m[s] || "badge-submitted"}`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [solar, setSolar] = useState([]);
  const [loan, setLoan] = useState([]);
  const [tab, setTab] = useState("solar");

  useEffect(() => {
    api.get("/solar/my").then(r => setSolar(r.data)).catch(() => {});
    api.get("/loan/my").then(r => setLoan(r.data)).catch(() => {});
  }, []);

  const downloadPdf = (app, kind) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(19, 136, 8);
    doc.text("HARYANA ENTERPRISES", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text("Kagdana, Sirsa, Haryana | 8167862016 | haryanaenterpriseskagdana@gmail.com", 14, 24);
    doc.setDrawColor(19, 136, 8);
    doc.line(14, 27, 196, 27);
    doc.setFontSize(14);
    doc.setTextColor(30);
    doc.text(`${kind === "solar" ? "Solar" : "Loan"} Application - ${app.ref_no}`, 14, 36);

    const rows = Object.entries(app)
      .filter(([k]) => !["_id", "id", "user_id"].includes(k))
      .map(([k, v]) => [k.replace(/_/g, " ").toUpperCase(), String(v ?? "-")]);
    autoTable(doc, {
      startY: 42,
      head: [["Field", "Value"]],
      body: rows,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [19, 136, 8], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    const y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("This is a system-generated acknowledgement. Our team will contact you within 24 hours.", 14, y);
    doc.save(`${app.ref_no}.pdf`);
  };

  const stats = [
    { icon: FaSolarPanel, label: t({ hi: "सोलर आवेदन", en: "Solar Applications" }), val: solar.length, color: "bg-emerald-100 text-emerald-700" },
    { icon: FaMoneyBillWave, label: t({ hi: "लोन आवेदन", en: "Loan Applications" }), val: loan.length, color: "bg-orange-100 text-orange-700" },
    { icon: FaFileAlt, label: t({ hi: "कुल आवेदन", en: "Total Applications" }), val: solar.length + loan.length, color: "bg-blue-100 text-blue-700" },
    { icon: FaUserCircle, label: t({ hi: "प्रोफ़ाइल", en: "Profile" }), val: (user && user.name) || "-", color: "bg-purple-100 text-purple-700", isText: true },
  ];

  const data = tab === "solar" ? solar : loan;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" data-testid="dashboard-page">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="section-title text-3xl">{t({ hi: "मेरा डैशबोर्ड", en: "My Dashboard" })}</h1>
          <p className="text-slate-600 mt-2">{t({ hi: "नमस्ते", en: "Welcome" })}, <b>{user?.name}</b>! {t({ hi: "यहाँ आपके सभी आवेदनों की स्थिति देखें।", en: "View all your application statuses here." })}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/solar/apply" className="btn-primary" data-testid="new-solar-btn"><FaPlusCircle /> {t({ hi: "नया सोलर आवेदन", en: "New Solar" })}</Link>
          <Link to="/loan/apply" className="btn-orange" data-testid="new-loan-btn"><FaPlusCircle /> {t({ hi: "नया लोन आवेदन", en: "New Loan" })}</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-5 flex items-start gap-4" data-testid={`stat-card-${i}`}>
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.color}`}><Icon /></div>
              <div>
                <div className="text-2xl font-bold text-emerald-900">{s.val}</div>
                <div className="text-sm text-slate-600">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex gap-2 border-b border-slate-200 mb-4">
          <button className={`px-4 py-2 font-semibold ${tab === "solar" ? "text-emerald-800 border-b-2 border-emerald-600" : "text-slate-500"}`} onClick={() => setTab("solar")} data-testid="tab-solar">
            <FaSolarPanel className="inline mr-1" /> {t({ hi: "सोलर आवेदन", en: "Solar" })} ({solar.length})
          </button>
          <button className={`px-4 py-2 font-semibold ${tab === "loan" ? "text-emerald-800 border-b-2 border-emerald-600" : "text-slate-500"}`} onClick={() => setTab("loan")} data-testid="tab-loan">
            <FaMoneyBillWave className="inline mr-1" /> {t({ hi: "लोन आवेदन", en: "Loan" })} ({loan.length})
          </button>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-12 text-slate-500" data-testid="empty-state">
            <FaFileAlt className="mx-auto text-4xl text-slate-300 mb-3" />
            <p>{t({ hi: "अभी तक कोई आवेदन नहीं है।", en: "No applications yet." })}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ref No</th>
                  <th>{t({ hi: "प्रकार", en: "Type" })}</th>
                  <th>{t({ hi: "नाम", en: "Name" })}</th>
                  <th>{t({ hi: "स्थिति", en: "Status" })}</th>
                  <th>{t({ hi: "तिथि", en: "Date" })}</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {data.map(a => (
                  <tr key={a.id} data-testid={`app-row-${a.ref_no}`}>
                    <td className="font-mono font-semibold text-emerald-800">{a.ref_no}</td>
                    <td>{tab === "solar" ? a.application_type : a.loan_type}</td>
                    <td>{a.full_name}</td>
                    <td><span className={badgeCls(a.status)}>{a.status}</span></td>
                    <td className="text-sm text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => downloadPdf(a, tab)} className="text-red-600 hover:text-red-700" data-testid={`pdf-btn-${a.ref_no}`} title="Download PDF">
                        <FaFilePdf className="text-xl" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
