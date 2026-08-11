import React, { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import Poster from "./Poster";
import { X, Download, Share2, Loader2, Upload, ImageOff } from "lucide-react";
import { SITE_NAME, SITE_BASE_URL } from "./config";

/*
  Self-contained Share popup. Drop it into ANY React app.
  Usage:
    const [open, setOpen] = useState(false);
    <button onClick={() => setOpen(true)}>Share Vacancy</button>
    {open && <ShareModal vacancy={vacancy} onClose={() => setOpen(false)} />}

  `vacancy` shape:
    { id, jobTitle, organization, totalPosts, qualification, lastDate,
      lastDateNote, jobType, location, selectionProcess, highlights: [] }
*/

const overlay = {
  position: "fixed", inset: 0, zIndex: 50, display: "flex",
  alignItems: "center", justifyContent: "center",
  background: "rgba(0,0,0,0.6)", padding: 16, overflowY: "auto",
};
const card = {
  position: "relative", width: "100%", maxWidth: 780,
  borderRadius: 16, background: "#fff", boxShadow: "0 20px 50px rgba(0,0,0,0.3)", margin: "32px 0",
  fontFamily: "'Poppins', sans-serif",
  color: "#0f172a",
};
const label = { display: "block", fontWeight: 600, color: "#12307a", marginBottom: 6, fontSize: 14 };
const input = {
  width: "100%", height: 48, borderRadius: 10, border: "1px solid #cbd5e1",
  padding: "0 14px", fontSize: 16, outline: "none", boxSizing: "border-box",
  background: "#ffffff", color: "#0f172a",
};
const btn = (bg) => ({
  height: 44, borderRadius: 10, border: "none", background: bg, color: "#fff",
  fontWeight: 700, fontSize: 15, padding: "0 16px", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
});

const ShareModal = ({ vacancy, onClose }) => {
  const [shopName, setShopName] = useState("");
  const [contact, setContact] = useState("");
  const [logo, setLogo] = useState(null);
  const [showPoster, setShowPoster] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const posterRef = useRef(null);

  const displayName = (shopName && shopName.trim()) || SITE_NAME;

  // Fit the 620px-wide poster into whatever preview area we have.
  // Constrain by both viewport width AND height so laptops (short screens)
  // and phones (narrow screens) both see a comfortably sized preview.
  useEffect(() => {
    if (!showPoster) return;
    const compute = () => {
      const availW = Math.min(window.innerWidth - 80, 720) - 32;
      const availH = window.innerHeight - 240; // leave room for header/actions
      const posterNaturalH = 900; // approximate; poster height is content-dependent
      const sW = availW / 620;
      const sH = availH / posterNaturalH;
      // Never upscale above 0.95 so we don't fill the whole modal on huge screens
      const s = Math.min(0.95, Math.max(0.35, Math.min(sW, sH)));
      setPreviewScale(Number(s.toFixed(3)));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [showPoster]);

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  // Wait for web fonts + one animation frame → then rasterize to PNG.
  // html-to-image embeds the fonts as data URIs into the exported SVG so text
  // never reflows between screen and download (fixes html2canvas timing bug).
  const capture = async () => {
    const node = posterRef.current;
    if (!node) return null;
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    } catch { /* fonts API missing → continue */ }
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)));
    return toPng(node, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: "#eef1f8",
      // Force capture at the poster's natural size regardless of preview scale
      width: 620,
      height: node.scrollHeight,
      style: { transform: "none", transformOrigin: "top left" },
    });
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `${displayName.replace(/\s+/g, "-")}-vacancy-poster.png`;
      link.href = dataUrl;
      link.click();
    } finally { setBusy(false); }
  };

  const handleWhatsApp = async () => {
    setBusy(true);
    try {
      const dataUrl = await capture();
      const url = `${SITE_BASE_URL}/vacancies/${vacancy.id}`;
      const text = encodeURIComponent(
        `*${displayName}*\n\n${vacancy.jobTitle} — ${vacancy.organization}\nTotal Posts: ${vacancy.totalPosts}\nLast Date: ${vacancy.lastDate}\n\nView full details: ${url}`
      );
      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `${displayName.replace(/\s+/g, "-")}-vacancy-poster.png`;
        link.href = dataUrl;
        link.click();
      }
      window.open(`https://wa.me/?text=${text}`, "_blank");
    } finally { setBusy(false); }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{ position: "absolute", right: 16, top: 16, zIndex: 10, border: "none", borderRadius: 999, background: "#f1f5f9", padding: 8, cursor: "pointer" }}
        >
          <X size={18} color="#475569" />
        </button>

        {!showPoster ? (
          <div style={{ padding: 32 }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: "#12307a", margin: 0 }}>Share This Vacancy</h3>
            <p style={{ marginTop: 6, fontSize: 14, color: "#64748b" }}>
              Enter your Shop / Center name — it appears on top of the poster. Leave blank to keep
              <b style={{ color: "#12307a" }}> {SITE_NAME}</b>.
            </p>

            <div style={{ marginTop: 22 }}>
              <label style={label}>Enter Your Shop / Center Name</label>
              <input autoFocus placeholder="e.g. Haryana Enterprises" value={shopName}
                onChange={(e) => setShopName(e.target.value)} style={input}
                onKeyDown={(e) => e.key === "Enter" && setShowPoster(true)} />
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={label}>Phone / WhatsApp Number (optional)</label>
              <input placeholder="e.g. +91 81687 62016" value={contact}
                onChange={(e) => setContact(e.target.value)} style={input} />
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={label}>Shop Logo (optional)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <label style={{ display: "flex", height: 64, width: 64, flexShrink: 0, cursor: "pointer", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 12, border: "2px dashed #cbd5e1", background: "#f8fafc" }}>
                  {logo ? <img src={logo} alt="logo" style={{ height: "100%", width: "100%", objectFit: "contain" }} />
                        : <Upload size={20} color="#94a3b8" />}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
                </label>
                <div style={{ fontSize: 14, color: "#64748b" }}>
                  {logo ? (
                    <button onClick={() => setLogo(null)} style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "none", color: "#ef4444", fontWeight: 600, cursor: "pointer" }}>
                      <ImageOff size={14} /> Remove logo
                    </button>
                  ) : "Upload your center logo to show it beside the name. Leave empty for the default HR badge."}
                </div>
              </div>
            </div>

            <button onClick={() => setShowPoster(true)} style={{ ...btn("#16a34a"), width: "100%", height: 48, marginTop: 24, fontSize: 16, justifyContent: "center" }}>
              Generate Poster & Share
            </button>
          </div>
        ) : (
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#12307a", margin: 0 }}>Your Poster is Ready</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowPoster(false)} style={{ ...btn("#fff"), color: "#334155", border: "1px solid #cbd5e1" }}>Edit</button>
                <button onClick={handleDownload} disabled={busy} style={btn("#12307a")}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download
                </button>
                <button onClick={handleWhatsApp} disabled={busy} style={btn("#25d366")}>
                  <Share2 size={16} /> WhatsApp
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", overflow: "hidden", borderRadius: 12, background: "#f1f5f9", padding: 16 }}>
              {/* Using CSS `zoom` shrinks BOTH visual size and layout box so tall posters
                  don't overflow the modal on mobile. html-to-image captures the ref which
                  is inside this wrapper — but we pass width:620 to force natural render. */}
              <div style={{ zoom: previewScale }}>
                <Poster ref={posterRef} shopName={shopName} vacancy={vacancy} logo={logo} contact={contact} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
