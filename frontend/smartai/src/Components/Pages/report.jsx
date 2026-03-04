import React, { useState, useEffect } from "react";
import { FaFilePdf, FaDownload } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import Sidebar from "./sidebar";

const Particle = ({ theme }) => {
  const size = Math.random() * 6 + 2;
  const x = Math.random() * 100;
  const duration = Math.random() * 14 + 8;
  const delay = Math.random() * 6;
  const color = theme === "dark"
    ? Math.random() > 0.5 ? "rgba(249,115,22,0.12)" : "rgba(16,185,129,0.12)"
    : Math.random() > 0.5 ? "rgba(249,115,22,0.2)" : "rgba(16,185,129,0.2)";
  return (
    <motion.div
      style={{ position:"fixed", left:`${x}%`, bottom:-20, width:size, height:size, borderRadius:"50%", background:color, pointerEvents:"none", zIndex:0 }}
      animate={{ y:[0,-(window.innerHeight+40)], opacity:[0,1,0] }}
      transition={{ duration, delay, repeat:Infinity, ease:"linear" }}
    />
  );
};

const containerVariants = {
  hidden:{ opacity:0 },
  visible:{ opacity:1, transition:{ staggerChildren:0.12, delayChildren:0.2 } },
};
const itemVariants = {
  hidden:{ opacity:0, y:24 },
  visible:{ opacity:1, y:0, transition:{ type:"spring", stiffness:120, damping:16 } },
};
const cardVariants = {
  hidden:{ opacity:0, y:28, scale:0.97 },
  visible:{ opacity:1, y:0, scale:1, transition:{ type:"spring", stiffness:110, damping:15 } },
};

const accentPairs = [
  { from:"#f97316", to:"#fb923c" },
  { from:"#10b981", to:"#34d399" },
  { from:"#f97316", to:"#10b981" },
  { from:"#0ea5e9", to:"#10b981" },
  { from:"#f59e0b", to:"#f97316" },
  { from:"#10b981", to:"#0ea5e9" },
];

const SectionHeader = ({ label, isDark, accentColor, count }) => (
  <div style={{ marginBottom:24 }}>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
      <h2 style={{ fontSize:"1.4rem", fontWeight:800, letterSpacing:"-0.4px", color:isDark?"#f1f5f9":"#1e293b" }}>{label}</h2>
      {count !== undefined && count > 0 && (
        <span style={{ fontSize:"0.74rem", fontWeight:700, padding:"4px 14px", borderRadius:999,
          background:isDark?"rgba(255,255,255,0.06)":"rgba(249,115,22,0.08)",
          border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(249,115,22,0.2)"}`,
          color:isDark?"#d1d5db":"#6b7280" }}>
          {count} item{count !== 1 ? "s" : ""}
        </span>
      )}
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${accentColor},transparent)` }} />
      <span style={{ fontSize:"0.75rem", color:accentColor }}>*</span>
    </div>
  </div>
);

const EmptyState = ({ isDark, text }) => (
  <div style={{ textAlign:"center", padding:"36px 24px" }}>
    <div style={{ width:52, height:52, borderRadius:"50%", margin:"0 auto 14px",
      background:isDark?"rgba(249,115,22,0.07)":"rgba(249,115,22,0.06)",
      border:`1.5px dashed ${isDark?"rgba(249,115,22,0.22)":"rgba(249,115,22,0.28)"}`,
      display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", color:"#f97316" }}>*</div>
    <p style={{ fontSize:"0.88rem", fontWeight:600, color:isDark?"#6b7280":"#9ca3af" }}>{text}</p>
  </div>
);

const FinalReport = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pdfText, setPdfText] = useState(() => localStorage.getItem("pdfText") || "");
  const [pdfDomain, setPdfDomain] = useState(() => localStorage.getItem("pdfDomain") || "");
  const [summary, setSummary] = useState(() => localStorage.getItem("pdfSummary") || "");
  const [insights, setInsights] = useState(() => {
    try { const s = localStorage.getItem("insights"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [suggestions, setSuggestions] = useState(() => {
    try { const s = localStorage.getItem("suggestions"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [particles] = useState(() => Array.from({ length:18 }, (_,i) => i));

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");
  const toggleSidebar = () => setSidebarOpen(o => !o);

  const handleClearData = async () => {
    setLoading(true); setError("");
    try {
      const tv = localStorage.getItem("theme");
      localStorage.clear();
      if (tv) localStorage.setItem("theme", tv);
      setPdfText(""); setPdfDomain(""); setSummary(""); setInsights([]); setSuggestions([]);
      const resp = await fetch("http://localhost:8000/clear-vector-db", { method:"DELETE", headers:{ "Content-Type":"application/json" } });
      if (!resp.ok) { const e = await resp.text(); throw new Error(`${resp.status} - ${e}`); }
      const d = await resp.json();
      console.log(d.message);
      alert("All data cleared successfully!");
    } catch (err) {
      setError(err.message || "Failed to clear.");
    } finally { setLoading(false); }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    const pH = doc.internal.pageSize.height;
    const chk = (n=14) => { if (y+n > pH-20) { doc.addPage(); y=20; } };

    doc.setFont("helvetica","bold"); doc.setFontSize(18);
    doc.text("Smart Report AI - Final Report", 20, y); y += 12;
    doc.setDrawColor(249,115,22); doc.setLineWidth(0.6); doc.line(20,y,190,y); y += 10;

    if (pdfDomain) {
      chk(); doc.setFont("helvetica","bold"); doc.setFontSize(12);
      doc.text("Identified Domain:", 20, y); y += 7;
      doc.setFont("helvetica","normal"); doc.setFontSize(10);
      doc.text(pdfDomain, 20, y); y += 12;
    }
    if (summary) {
      chk(); doc.setFont("helvetica","bold"); doc.setFontSize(12);
      doc.text("Domain Summary:", 20, y); y += 7;
      doc.setFont("helvetica","normal"); doc.setFontSize(10);
      const ss = doc.splitTextToSize(summary, 170);
      ss.forEach(l => { chk(); doc.text(l,20,y); y+=5; }); y+=8;
    }
    if (pdfText) {
      chk(); doc.setFont("helvetica","bold"); doc.setFontSize(12);
      doc.text("Extracted Text:", 20, y); y += 7;
      doc.setFont("helvetica","normal"); doc.setFontSize(9);
      const st = doc.splitTextToSize(pdfText, 170);
      st.forEach(l => { chk(); doc.text(l,20,y); y+=4.5; }); y+=8;
    }
    if (insights.length > 0) {
      chk(); doc.setFont("helvetica","bold"); doc.setFontSize(12);
      doc.text("Insights:", 20, y); y += 8;
      insights.forEach((ins, i) => {
        chk(); doc.setFont("helvetica","bold"); doc.setFontSize(10);
        doc.text(`${i+1}. ${ins.title}`, 20, y); y += 6;
        doc.setFont("helvetica","normal"); doc.setFontSize(9);
        const sd = doc.splitTextToSize(ins.description, 165);
        sd.forEach(l => { chk(); doc.text(l,25,y); y+=4.5; });
        if (ins.supporting_data?.length > 0) {
          ins.supporting_data.forEach(item => {
            const si = doc.splitTextToSize("- "+item, 160);
            si.forEach(l => { chk(); doc.text(l,28,y); y+=4.5; });
          });
        }
        y += 6;
      });
    }
    if (suggestions.length > 0) {
      chk(); doc.setFont("helvetica","bold"); doc.setFontSize(12);
      doc.text("Suggestions:", 20, y); y += 8;
      doc.setFont("helvetica","normal"); doc.setFontSize(9);
      suggestions.forEach((s,i) => {
        const ss2 = doc.splitTextToSize(`${i+1}. ${s}`, 170);
        ss2.forEach(l => { chk(); doc.text(l,20,y); y+=4.5; }); y+=4;
      });
    }
    chk(); y+=8;
    doc.setFont("helvetica","normal"); doc.setFontSize(8);
    doc.text(`Generated by Smart Report AI | (c) ${new Date().getFullYear()} xAI`, 20, y);
    doc.save("SmartReportAI_Final_Report.pdf");
  };

  const isDark = theme === "dark";

  return (
    <div
      style={{ fontFamily:"'Times New Roman',Times,serif" }}
      className={`min-h-screen transition-colors duration-500 flex ${isDark ? "bg-gradient-to-br from-gray-950 via-gray-900 to-slate-950" : "bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50"}`}
    >
      <style>{`
        * { font-family:'Times New Roman',Times,serif !important; font-style:normal !important; }
        .grad-text { background:linear-gradient(135deg,#f97316 0%,#fb923c 40%,#10b981 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .grad-btn { background:linear-gradient(135deg,#f97316,#10b981); color:#fff; border:none; cursor:pointer; transition:all 0.3s ease; }
        .grad-btn:hover { background:linear-gradient(135deg,#ea580c,#059669); box-shadow:0 10px 32px rgba(249,115,22,0.38); }
        .grad-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .ornament-line { display:flex; align-items:center; gap:12px; }
        .ornament-line::before,.ornament-line::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,transparent,#f97316,transparent); }
        @keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.6} }
        .pulse-dot { animation:pulse-dot 1.6s ease-in-out infinite; }
        @keyframes glow-ring { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,0.3)} 50%{box-shadow:0 0 0 8px rgba(249,115,22,0)} }
        .glow-badge { animation:glow-ring 2.2s ease-in-out infinite; }
        .corner-tl { border-top:2px solid #f97316; border-left:2px solid #f97316; }
        .corner-br { border-bottom:2px solid #10b981; border-right:2px solid #10b981; }
        .insight-card { transition:box-shadow 0.3s ease,transform 0.3s ease; }
        .insight-card:hover { transform:translateY(-6px); box-shadow:0 0 0 1.5px rgba(249,115,22,0.2),0 16px 40px rgba(249,115,22,0.12); }
        @keyframes shimmer-bg { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .card-top-bar { background-size:200% 200%; animation:shimmer-bg 4s ease infinite; }
        textarea::-webkit-scrollbar { width:5px; }
        textarea::-webkit-scrollbar-track { background:transparent; }
        textarea::-webkit-scrollbar-thumb { background:linear-gradient(180deg,#f97316,#10b981); border-radius:3px; }
      `}</style>

      {particles.map(i => <Particle key={i} theme={theme} />)}

      <Sidebar theme={theme} toggleTheme={toggleTheme} sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} handleClearData={handleClearData} isLoading={loading} />

      <div className={`flex-1 relative z-10 transition-all duration-300 ${sidebarOpen ? "ml-[280px]" : "ml-0"}`}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-14 py-10 lg:py-14">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {/* HERO */}
            <motion.header variants={itemVariants} className="mb-12 text-center relative">
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:520, height:200, borderRadius:"50%", border:isDark?"1px solid rgba(249,115,22,0.07)":"1px solid rgba(249,115,22,0.1)", pointerEvents:"none" }} />
              <div className="flex justify-center mb-6">
                <span className="glow-badge" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 22px", borderRadius:999, border:`1px solid ${isDark?"rgba(249,115,22,0.3)":"rgba(249,115,22,0.4)"}`, background:isDark?"rgba(249,115,22,0.08)":"rgba(249,115,22,0.06)", fontSize:"0.76rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"#f97316" }}>
                  <span className="pulse-dot" style={{ width:7, height:7, borderRadius:"50%", background:"#f97316", display:"inline-block" }} />
                  Full Document Intelligence Report
                </span>
              </div>
              <h1 className="grad-text" style={{ fontSize:"clamp(2rem,5vw,3.6rem)", fontWeight:900, lineHeight:1.1, letterSpacing:"-1px", marginBottom:16 }}>
                Smart Report AI<br />
                <span style={{ fontSize:"0.58em", fontWeight:700, letterSpacing:"0.02em" }}>Final Report</span>
              </h1>
              <div className="ornament-line max-w-[100px] mx-auto mb-5">
                <span style={{ fontSize:"1.1rem", color:"#f97316" }}>*</span>
              </div>
              <p style={{ fontSize:"1.05rem", lineHeight:1.7, fontWeight:400, maxWidth:580, margin:"0 auto", color:isDark?"#d1d5db":"#4b5563" }}>
                Review all extracted data, domain insights, summary, and suggestions. Download the complete report as a PDF.
              </p>
            </motion.header>

            {/* ERROR */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="flex justify-center mb-8">
                  <div style={{ padding:"12px 28px", borderRadius:999, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", fontSize:"0.88rem", fontWeight:700, color:"#ef4444" }}>{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* DOWNLOAD BUTTON */}
            <motion.div variants={itemVariants} className="flex justify-center mb-14">
              <motion.button onClick={handleDownloadPDF} disabled={loading}
                whileHover={{ scale:1.06, boxShadow:"0 12px 36px rgba(249,115,22,0.38)" }}
                whileTap={{ scale:0.95 }}
                className="grad-btn"
                style={{ padding:"16px 52px", borderRadius:999, fontSize:"1rem", fontWeight:800, letterSpacing:"0.04em", display:"inline-flex", alignItems:"center", gap:12 }}>
                <FaDownload style={{ fontSize:"0.95rem" }} />
                Download Report as PDF
              </motion.button>
            </motion.div>

            {/* DOMAIN */}
            <motion.div variants={itemVariants} className="mb-12">
              <SectionHeader label="Identified Domain" isDark={isDark} accentColor="#f97316" />
              {pdfDomain ? (
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"14px 36px", borderRadius:999, border:`1.5px solid ${isDark?"rgba(249,115,22,0.3)":"rgba(249,115,22,0.35)"}`, background:isDark?"rgba(249,115,22,0.08)":"rgba(249,115,22,0.06)", backdropFilter:"blur(10px)" }}>
                    <FaFilePdf style={{ color:"#f97316", fontSize:"1.2rem" }} />
                    <span style={{ fontSize:"0.9rem", fontWeight:600, color:isDark?"#fb923c":"#c2410c" }}>Domain:</span>
                    <span style={{ fontSize:"0.9rem", fontWeight:800, color:isDark?"#f1f5f9":"#1e293b" }}>{pdfDomain}</span>
                  </div>
                </div>
              ) : <EmptyState isDark={isDark} text="No domain identified." />}
            </motion.div>

            {/* SUMMARY */}
            <motion.div variants={itemVariants} className="mb-12">
              <SectionHeader label="Domain Summary" isDark={isDark} accentColor="#10b981" />
              {summary ? (
                <div style={{ padding:2, borderRadius:18, background:"linear-gradient(135deg,rgba(249,115,22,0.28),rgba(16,185,129,0.28))" }}>
                  <div style={{ borderRadius:16, padding:"28px 32px", background:isDark?"rgba(10,14,25,0.96)":"rgba(255,255,255,0.92)", backdropFilter:"blur(12px)" }}>
                    <p style={{ fontSize:"0.96rem", lineHeight:1.85, fontWeight:400, color:isDark?"#cbd5e1":"#334155" }}>{summary}</p>
                  </div>
                </div>
              ) : <EmptyState isDark={isDark} text="No summary available." />}
            </motion.div>

            {/* EXTRACTED TEXT */}
            <motion.div variants={itemVariants} className="mb-12">
              <SectionHeader label="Extracted Text" isDark={isDark} accentColor="#f97316" />
              {pdfText ? (
                <div style={{ borderRadius:16, padding:2, background:"linear-gradient(135deg,rgba(249,115,22,0.3),rgba(16,185,129,0.3))" }}>
                  <textarea value={pdfText} readOnly rows={9}
                    style={{ width:"100%", borderRadius:14, padding:"20px 24px", border:"none", outline:"none", fontSize:"0.9rem", lineHeight:1.75, resize:"none", background:isDark?"rgba(10,14,25,0.96)":"rgba(255,255,255,0.93)", color:isDark?"#e2e8f0":"#1a202c", display:"block", fontFamily:"'Times New Roman',Times,serif" }} />
                </div>
              ) : <EmptyState isDark={isDark} text="No extracted text available." />}
            </motion.div>

            {/* INSIGHTS */}
            <motion.div variants={itemVariants} className="mb-12">
              <SectionHeader label="Insights" isDark={isDark} accentColor="#10b981" count={insights.length} />
              {insights.length > 0 ? (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {insights.map((insight, index) => {
                    const accent = accentPairs[index % accentPairs.length];
                    return (
                      <motion.div key={index} variants={cardVariants} initial="hidden" animate="visible"
                        transition={{ delay:index*0.06 }} className="insight-card"
                        style={{ borderRadius:20, border:`1.5px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(249,115,22,0.13)"}`, background:isDark?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.8)", backdropFilter:"blur(14px)", overflow:"hidden", boxShadow:isDark?"0 4px 28px rgba(0,0,0,0.4)":"0 4px 24px rgba(249,115,22,0.08)", position:"relative", minHeight:180 }}>
                        <div className="card-top-bar" style={{ height:5, width:"100%", background:`linear-gradient(135deg,${accent.from},${accent.to})` }} />
                        <div className="corner-tl" style={{ position:"absolute", top:14, left:14, width:13, height:13, borderRadius:2 }} />
                        <div className="corner-br" style={{ position:"absolute", bottom:14, right:14, width:13, height:13, borderRadius:2 }} />
                        <div style={{ position:"absolute", top:18, right:18, width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${accent.from},${accent.to})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:900, color:"#fff" }}>
                          {String(index+1).padStart(2,"0")}
                        </div>
                        <div style={{ padding:"22px 26px 26px" }}>
                          <p style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.13em", color:accent.from, marginBottom:8 }}>Insight {String(index+1).padStart(2,"0")}</p>
                          <div style={{ height:1, marginBottom:14, background:isDark?"rgba(255,255,255,0.06)":"rgba(249,115,22,0.1)" }} />
                          <h3 style={{ fontSize:"1rem", fontWeight:800, lineHeight:1.4, marginBottom:10, color:isDark?"#f1f5f9":"#1e293b" }}>{insight.title}</h3>
                          <p style={{ fontSize:"0.88rem", lineHeight:1.72, fontWeight:400, marginBottom:insight.supporting_data?.length>0?14:0, color:isDark?"#94a3b8":"#475569" }}>{insight.description}</p>
                          {insight.supporting_data?.length > 0 && (
                            <div style={{ paddingTop:12, borderTop:`1px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(249,115,22,0.1)"}` }}>
                              <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#10b981", marginBottom:10 }}>Supporting Evidence</p>
                              <ul style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                {insight.supporting_data.map((item, i) => (
                                  <li key={i} style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                                    <span style={{ flexShrink:0, marginTop:5, width:6, height:6, borderRadius:"50%", background:`linear-gradient(135deg,${accent.from},${accent.to})`, display:"inline-block" }} />
                                    <span style={{ fontSize:"0.84rem", lineHeight:1.62, fontWeight:400, color:isDark?"#94a3b8":"#64748b" }}>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : <EmptyState isDark={isDark} text="No insights available." />}
            </motion.div>

            {/* SUGGESTIONS */}
            <motion.div variants={itemVariants} className="mb-14">
              <SectionHeader label="Suggestions" isDark={isDark} accentColor="#f97316" count={suggestions.length} />
              {suggestions.length > 0 ? (
                <div style={{ padding:2, borderRadius:20, background:"linear-gradient(135deg,rgba(249,115,22,0.28),rgba(16,185,129,0.28))" }}>
                  <div style={{ borderRadius:18, padding:"32px 36px", background:isDark?"rgba(10,14,25,0.96)":"rgba(255,255,255,0.92)", backdropFilter:"blur(14px)" }}>
                    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                      {suggestions.map((suggestion, index) => {
                        const accent = accentPairs[index % accentPairs.length];
                        return (
                          <motion.div key={index}
                            initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                            transition={{ delay:index*0.07, type:"spring", stiffness:140 }}
                            style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"14px 18px", borderRadius:12, background:isDark?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.7)", border:`1px solid ${isDark?"rgba(255,255,255,0.07)":"rgba(249,115,22,0.1)"}` }}>
                            <div style={{ flexShrink:0, width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${accent.from},${accent.to})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:900, color:"#fff", marginTop:1 }}>
                              {String(index+1).padStart(2,"0")}
                            </div>
                            <p style={{ fontSize:"0.93rem", lineHeight:1.75, fontWeight:400, color:isDark?"#cbd5e1":"#334155" }}>{suggestion}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : <EmptyState isDark={isDark} text="No suggestions available." />}
            </motion.div>

            {/* FOOTER */}
            <motion.footer initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1 }}
              style={{ marginTop:24, paddingTop:28, textAlign:"center", borderTop:`1px solid ${isDark?"rgba(255,255,255,0.07)":"rgba(249,115,22,0.15)"}` }}>
              <div className="ornament-line max-w-xs mx-auto" style={{ marginBottom:14 }}>
                <span style={{ fontSize:"0.9rem", color:"#f97316" }}>*</span>
              </div>
              <p style={{ fontSize:"0.8rem", fontWeight:500, letterSpacing:"0.06em", color:isDark?"#6b7280":"#9ca3af" }}>
                Powered by <span className="grad-text" style={{ fontWeight:800 }}>Smart Report AI</span> | &copy; {new Date().getFullYear()} xAI
              </p>
            </motion.footer>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FinalReport;