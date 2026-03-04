import React, { useState, useEffect } from "react";
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./sidebar";

// ────────────────────────────────────────────────
// Floating Particle
// ────────────────────────────────────────────────
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

// ────────────────────────────────────────────────
// Framer Motion Variants
// ────────────────────────────────────────────────
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

// ────────────────────────────────────────────────
// Severity config
// ────────────────────────────────────────────────
const severityConfig = {
  Low:      { color:"#10b981", bg:"rgba(16,185,129,0.1)",  border:"rgba(16,185,129,0.3)",  from:"#10b981", to:"#34d399" },
  Medium:   { color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.3)",  from:"#f59e0b", to:"#fbbf24" },
  High:     { color:"#f97316", bg:"rgba(249,115,22,0.1)",  border:"rgba(249,115,22,0.3)",  from:"#f97316", to:"#fb923c" },
  Critical: { color:"#ef4444", bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.3)",   from:"#ef4444", to:"#f87171" },
};

const overallLevelConfig = {
  Low:      { label:"Low Risk",      icon:<FaCheckCircle />,         color:"#10b981" },
  Medium:   { label:"Medium Risk",   icon:<FaInfoCircle />,          color:"#f59e0b" },
  High:     { label:"High Risk",     icon:<FaExclamationTriangle />, color:"#f97316" },
  Critical: { label:"Critical Risk", icon:<FaShieldAlt />,           color:"#ef4444" },
};

const accentPairs = [
  { from:"#f97316", to:"#fb923c" },
  { from:"#ef4444", to:"#f97316" },
  { from:"#f59e0b", to:"#f97316" },
  { from:"#10b981", to:"#34d399" },
  { from:"#f97316", to:"#10b981" },
  { from:"#0ea5e9", to:"#10b981" },
];

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────
const RiskDetectionAgent = () => {
  const [theme, setTheme]           = useState(() => localStorage.getItem("theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [domain, setDomain]         = useState(() => localStorage.getItem("pdfDomain") || "");
  const [content, setContent]       = useState(() => localStorage.getItem("pdfText") || "");
  const [riskResult, setRiskResult] = useState(() => {
    try { const s = localStorage.getItem("riskResult"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [particles]                 = useState(() => Array.from({ length:18 }, (_,i) => i));

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (riskResult) localStorage.setItem("riskResult", JSON.stringify(riskResult));
    else localStorage.removeItem("riskResult");
  }, [riskResult]);

  const toggleTheme   = () => setTheme(t => t === "light" ? "dark" : "light");
  const toggleSidebar = () => setSidebarOpen(o => !o);

  const handleClearData = async () => {
    setLoading(true); setError("");
    try {
      const tv = localStorage.getItem("theme");
      localStorage.clear();
      if (tv) localStorage.setItem("theme", tv);
      setDomain(""); setContent(""); setRiskResult(null);
      const resp = await fetch("http://localhost:8000/clear-vector-db", { method:"DELETE", headers:{ "Content-Type":"application/json" } });
      if (!resp.ok) throw new Error(`${resp.status}`);
      alert("All data cleared successfully!");
    } catch (err) {
      setError(err.message || "Failed to clear.");
    } finally { setLoading(false); }
  };

  const handleDetectRisk = async () => {
    if (!content.trim()) { setError("No document content found. Please upload a document first."); return; }
    if (!domain.trim())  { setError("No domain identified. Please run the Identifier Agent first."); return; }
    setLoading(true); setError(""); setRiskResult(null);
    try {
      const resp = await fetch("http://localhost:8000/detect-risk/", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ content, domain, language:"English" }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Failed to detect risks.");
      setRiskResult(data);
    } catch (err) {
      setError(err.message || "Failed to detect risks. Please try again.");
    } finally { setLoading(false); }
  };

  const isDark = theme === "dark";
  const overallCfg = riskResult ? (overallLevelConfig[riskResult.overall_risk_level] || overallLevelConfig.Low) : null;

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
        .risk-card { transition:box-shadow 0.3s ease,transform 0.3s ease; }
        .risk-card:hover { transform:translateY(-6px); box-shadow:0 0 0 1.5px rgba(249,115,22,0.2),0 16px 40px rgba(249,115,22,0.12); }
        @keyframes shimmer-bg { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .card-top-bar { background-size:200% 200%; animation:shimmer-bg 4s ease infinite; }
        @keyframes skeleton-pulse { 0%,100%{opacity:0.35} 50%{opacity:0.7} }
        .skeleton { animation:skeleton-pulse 1.6s ease-in-out infinite; }
        textarea::-webkit-scrollbar { width:5px; }
        textarea::-webkit-scrollbar-track { background:transparent; }
        textarea::-webkit-scrollbar-thumb { background:linear-gradient(180deg,#f97316,#10b981); border-radius:3px; }
      `}</style>

      {particles.map(i => <Particle key={i} theme={theme} />)}

      <Sidebar theme={theme} toggleTheme={toggleTheme} sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} handleClearData={handleClearData} isLoading={loading} />

      <div className={`flex-1 relative z-10 transition-all duration-300 ${sidebarOpen ? "ml-[280px]" : "ml-0"}`}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-14 py-10 lg:py-14">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {/* ── HERO ── */}
            <motion.header variants={itemVariants} className="mb-12 text-center relative">
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:520, height:200, borderRadius:"50%", border:isDark?"1px solid rgba(249,115,22,0.07)":"1px solid rgba(249,115,22,0.1)", pointerEvents:"none" }} />
              <div className="flex justify-center mb-6">
                <span className="glow-badge" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 22px", borderRadius:999, border:`1px solid ${isDark?"rgba(249,115,22,0.3)":"rgba(249,115,22,0.4)"}`, background:isDark?"rgba(249,115,22,0.08)":"rgba(249,115,22,0.06)", fontSize:"0.76rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"#f97316" }}>
                  <span className="pulse-dot" style={{ width:7, height:7, borderRadius:"50%", background:"#f97316", display:"inline-block" }} />
                  AI Risk Intelligence
                </span>
              </div>
              <h1 className="grad-text" style={{ fontSize:"clamp(2rem,5vw,3.6rem)", fontWeight:900, lineHeight:1.1, letterSpacing:"-1px", marginBottom:16 }}>
                Smart Report AI<br />
                <span style={{ fontSize:"0.58em", fontWeight:700, letterSpacing:"0.02em" }}>Risk Detection Agent</span>
              </h1>
              <div className="ornament-line max-w-[100px] mx-auto mb-5">
                <span style={{ fontSize:"1.1rem", color:"#f97316" }}>*</span>
              </div>
              <p style={{ fontSize:"1.05rem", lineHeight:1.7, fontWeight:400, maxWidth:580, margin:"0 auto", color:isDark?"#d1d5db":"#4b5563" }}>
                Detect potential risks in your document across legal, financial, operational, and other domains with AI-powered precision.
              </p>
            </motion.header>

            {/* ── DOMAIN BADGE ── */}
            <AnimatePresence>
              {domain && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="flex justify-center mb-10">
                  <div style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"10px 28px", borderRadius:999, border:`1.5px solid ${isDark?"rgba(249,115,22,0.3)":"rgba(249,115,22,0.35)"}`, background:isDark?"rgba(249,115,22,0.08)":"rgba(249,115,22,0.06)", backdropFilter:"blur(10px)" }}>
                    <FaShieldAlt style={{ color:"#f97316", fontSize:"1rem" }} />
                    <span style={{ fontSize:"0.88rem", fontWeight:600, color:isDark?"#fb923c":"#c2410c" }}>Domain:</span>
                    <span style={{ fontSize:"0.88rem", fontWeight:800, color:isDark?"#f1f5f9":"#1e293b" }}>{domain}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── CONTENT TEXTAREA ── */}
            <motion.div variants={itemVariants} className="mb-10">
              <div style={{ marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"0.78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.13em", color:isDark?"#6b7280":"#9ca3af" }}>Document Content</span>
                {content && <span style={{ fontSize:"0.76rem", fontWeight:500, color:isDark?"#6b7280":"#9ca3af" }}>{content.length.toLocaleString()} characters</span>}
              </div>
              <div style={{ borderRadius:16, padding:2, background:content?"linear-gradient(135deg,rgba(249,115,22,0.4),rgba(16,185,129,0.4))":isDark?"rgba(255,255,255,0.07)":"rgba(249,115,22,0.15)" }}>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste document text here, or upload a document via the Identifier Agent..."
                  rows={10}
                  style={{ width:"100%", borderRadius:14, padding:"20px 24px", border:"none", outline:"none", fontSize:"0.9rem", lineHeight:1.75, resize:"vertical", background:isDark?"rgba(10,14,25,0.96)":"rgba(255,255,255,0.93)", color:isDark?"#e2e8f0":"#1a202c", display:"block", minHeight:220, fontFamily:"'Times New Roman',Times,serif", transition:"background 0.3s" }}
                />
              </div>
            </motion.div>

            {/* ── DETECT RISK BUTTON ── */}
            <AnimatePresence>
              {content.trim().length > 40 && (
                <motion.div className="flex justify-center mb-14" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                  <motion.button
                    whileHover={{ scale:1.06, boxShadow:"0 12px 36px rgba(249,115,22,0.38)" }}
                    whileTap={{ scale:0.95 }}
                    onClick={handleDetectRisk}
                    disabled={loading}
                    className="grad-btn"
                    style={{ padding:"16px 52px", borderRadius:999, fontSize:"1rem", fontWeight:800, letterSpacing:"0.04em", display:"inline-flex", alignItems:"center", gap:12 }}
                  >
                    {loading ? (
                      <>
                        <div style={{ position:"relative", width:22, height:22 }}>
                          <motion.div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid rgba(255,255,255,0.3)", borderTopColor:"#fff" }} animate={{ rotate:360 }} transition={{ duration:0.9, repeat:Infinity, ease:"linear" }} />
                        </div>
                        Analyzing...
                      </>
                    ) : (
                      <><FaShieldAlt style={{ fontSize:"0.9rem" }} /> Detect Risks</>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── LOADING SPINNER ── */}
            <AnimatePresence>
              {loading && (
                <motion.div className="flex flex-col items-center mb-10 gap-4" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <div style={{ position:"relative", width:52, height:52 }}>
                    <motion.div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid transparent", borderTopColor:"#f97316", borderRightColor:"#10b981" }} animate={{ rotate:360 }} transition={{ duration:0.9, repeat:Infinity, ease:"linear" }} />
                    <motion.div style={{ position:"absolute", inset:7, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#10b981", borderRightColor:"#f97316" }} animate={{ rotate:-360 }} transition={{ duration:1.4, repeat:Infinity, ease:"linear" }} />
                  </div>
                  <p style={{ fontSize:"0.85rem", fontWeight:600, color:isDark?"#6b7280":"#9ca3af" }}>Scanning document for risks...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── ERROR ── */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="flex justify-center mb-10">
                  <div style={{ padding:"12px 28px", borderRadius:999, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", fontSize:"0.88rem", fontWeight:700, color:"#ef4444" }}>{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── RESULTS ── */}
            <AnimatePresence>
              {riskResult && !loading && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity:0 }}>

                  {/* Section header */}
                  <motion.div variants={itemVariants} className="text-center mb-10">
                    <h2 style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-0.4px", marginBottom:6, color:isDark?"#f1f5f9":"#1e293b" }}>Risk Analysis Report</h2>
                    <div className="ornament-line max-w-[110px] mx-auto">
                      <span style={{ fontSize:"0.9rem", color:"#10b981" }}>*</span>
                    </div>
                  </motion.div>

                  {/* Overall risk level banner */}
                  <motion.div variants={itemVariants} className="mb-10">
                    <div style={{ padding:2, borderRadius:20, background:`linear-gradient(135deg,${overallCfg.color}44,rgba(16,185,129,0.3))` }}>
                      <div style={{ borderRadius:18, padding:"28px 32px", background:isDark?"rgba(10,14,25,0.96)":"rgba(255,255,255,0.92)", backdropFilter:"blur(14px)", display:"flex", alignItems:"flex-start", gap:20, flexWrap:"wrap" }}>
                        {/* Icon badge */}
                        <div style={{ width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg,${overallCfg.color},${overallCfg.color}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", color:"#fff", flexShrink:0, boxShadow:`0 0 20px ${overallCfg.color}44` }}>
                          {overallCfg.icon}
                        </div>
                        <div style={{ flex:1, minWidth:200 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, flexWrap:"wrap" }}>
                            <p style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.13em", color:overallCfg.color }}>Overall Risk Level</p>
                            <span style={{ padding:"3px 14px", borderRadius:999, background:`${overallCfg.color}18`, border:`1px solid ${overallCfg.color}44`, fontSize:"0.76rem", fontWeight:800, color:overallCfg.color }}>{riskResult.overall_risk_level}</span>
                          </div>
                          <p style={{ fontSize:"0.95rem", lineHeight:1.75, fontWeight:400, color:isDark?"#cbd5e1":"#334155" }}>{riskResult.risk_summary}</p>
                        </div>
                        {/* Stats */}
                        <div style={{ display:"flex", gap:16, flexShrink:0, flexWrap:"wrap" }}>
                          {["Critical","High","Medium","Low"].map(sev => {
                            const count = riskResult.risks.filter(r => r.severity === sev).length;
                            const cfg = severityConfig[sev];
                            return count > 0 ? (
                              <div key={sev} style={{ textAlign:"center", padding:"10px 16px", borderRadius:12, background:cfg.bg, border:`1px solid ${cfg.border}` }}>
                                <p style={{ fontSize:"1.4rem", fontWeight:900, color:cfg.color, lineHeight:1 }}>{count}</p>
                                <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:cfg.color, marginTop:3 }}>{sev}</p>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Risk cards grid */}
                  {riskResult.risks.length > 0 ? (
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                      {riskResult.risks.map((risk, index) => {
                        const sev = severityConfig[risk.severity] || severityConfig.Low;
                        const accent = accentPairs[index % accentPairs.length];
                        const confidencePct = Math.round((risk.confidence_score || 0) * 100);
                        return (
                          <motion.div key={index} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay:index*0.07 }} className="risk-card"
                            style={{ borderRadius:20, border:`1.5px solid ${isDark?"rgba(255,255,255,0.08)":sev.border}`, background:isDark?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.82)", backdropFilter:"blur(14px)", overflow:"hidden", boxShadow:isDark?"0 4px 28px rgba(0,0,0,0.4)":`0 4px 24px ${sev.bg}`, position:"relative", minHeight:240 }}>

                            {/* Top bar */}
                            <div className="card-top-bar" style={{ height:5, width:"100%", background:`linear-gradient(135deg,${sev.from},${sev.to})` }} />

                            {/* Corner accents */}
                            <div className="corner-tl" style={{ position:"absolute", top:14, left:14, width:13, height:13, borderRadius:2 }} />
                            <div className="corner-br" style={{ position:"absolute", bottom:14, right:14, width:13, height:13, borderRadius:2 }} />

                            {/* Number badge */}
                            <div style={{ position:"absolute", top:18, right:18, width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${sev.from},${sev.to})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:900, color:"#fff" }}>
                              {String(index+1).padStart(2,"0")}
                            </div>

                            <div style={{ padding:"22px 26px 26px" }}>
                              {/* Severity + type row */}
                              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
                                <span style={{ padding:"3px 12px", borderRadius:999, background:sev.bg, border:`1px solid ${sev.border}`, fontSize:"0.68rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:sev.color }}>{risk.severity}</span>
                                <span style={{ padding:"3px 12px", borderRadius:999, background:isDark?"rgba(255,255,255,0.06)":"rgba(249,115,22,0.07)", border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(249,115,22,0.18)"}`, fontSize:"0.68rem", fontWeight:700, color:isDark?"#9ca3af":"#6b7280" }}>{risk.risk_type}</span>
                              </div>

                              {/* Divider */}
                              <div style={{ height:1, marginBottom:14, background:isDark?"rgba(255,255,255,0.06)":`${sev.border}` }} />

                              {/* Title */}
                              <h3 style={{ fontSize:"1rem", fontWeight:800, lineHeight:1.4, marginBottom:10, color:isDark?"#f1f5f9":"#1e293b" }}>{risk.risk_title}</h3>

                              {/* Description */}
                              <p style={{ fontSize:"0.87rem", lineHeight:1.72, fontWeight:400, marginBottom:14, color:isDark?"#94a3b8":"#475569" }}>{risk.description}</p>

                              {/* Impact */}
                              <div style={{ padding:"10px 14px", borderRadius:10, background:isDark?"rgba(249,115,22,0.06)":"rgba(249,115,22,0.05)", border:`1px solid ${isDark?"rgba(249,115,22,0.15)":"rgba(249,115,22,0.18)"}`, marginBottom:risk.ipc_reference?14:0 }}>
                                <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.11em", color:"#f97316", marginBottom:4 }}>Impact</p>
                                <p style={{ fontSize:"0.85rem", lineHeight:1.65, fontWeight:400, color:isDark?"#cbd5e1":"#334155" }}>{risk.impact}</p>
                              </div>

                              {/* IPC Reference */}
                              {risk.ipc_reference && (
                                <div style={{ padding:"10px 14px", borderRadius:10, background:isDark?"rgba(239,68,68,0.07)":"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.2)", marginTop:12 }}>
                                  <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.11em", color:"#ef4444", marginBottom:4 }}>IPC Reference</p>
                                  <p style={{ fontSize:"0.85rem", lineHeight:1.65, fontWeight:400, color:isDark?"#fca5a5":"#dc2626" }}>{risk.ipc_reference}</p>
                                </div>
                              )}

                              {/* Confidence bar */}
                              <div style={{ marginTop:16 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                                  <p style={{ fontSize:"0.67rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:isDark?"#4b5563":"#9ca3af" }}>Confidence</p>
                                  <p style={{ fontSize:"0.75rem", fontWeight:800, color:sev.color }}>{confidencePct}%</p>
                                </div>
                                <div style={{ height:5, borderRadius:999, background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)", overflow:"hidden" }}>
                                  <motion.div
                                    initial={{ width:0 }}
                                    animate={{ width:`${confidencePct}%` }}
                                    transition={{ duration:1, delay:index*0.1, ease:"easeOut" }}
                                    style={{ height:"100%", borderRadius:999, background:`linear-gradient(90deg,${sev.from},${sev.to})` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    /* No risks */
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center py-20">
                      <div style={{ width:72, height:72, borderRadius:"50%", margin:"0 auto 20px", background:isDark?"rgba(16,185,129,0.08)":"rgba(16,185,129,0.07)", border:`1.5px dashed ${isDark?"rgba(16,185,129,0.25)":"rgba(16,185,129,0.3)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", color:"#10b981" }}>
                        <FaCheckCircle />
                      </div>
                      <p style={{ fontSize:"1.15rem", fontWeight:700, marginBottom:8, color:isDark?"#d1d5db":"#374151" }}>No Significant Risks Found</p>
                      <p style={{ fontSize:"0.88rem", fontWeight:400, color:isDark?"#6b7280":"#9ca3af" }}>The document appears to be low risk based on the AI analysis.</p>
                    </motion.div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

            {/* ── EMPTY STATE ── */}
            {!riskResult && !loading && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:0.9 }} className="text-center py-24">
                <div style={{ width:72, height:72, borderRadius:"50%", margin:"0 auto 20px", background:isDark?"rgba(249,115,22,0.08)":"rgba(249,115,22,0.07)", border:`1.5px dashed ${isDark?"rgba(249,115,22,0.25)":"rgba(249,115,22,0.3)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", color:"#f97316" }}>
                  <FaShieldAlt />
                </div>
                <p style={{ fontSize:"1.15rem", fontWeight:700, marginBottom:8, color:isDark?"#d1d5db":"#374151" }}>Ready to Detect Risks</p>
                <p style={{ fontSize:"0.88rem", fontWeight:400, color:isDark?"#6b7280":"#9ca3af" }}>Paste document content above and click "Detect Risks" to begin analysis</p>
              </motion.div>
            )}

            {/* ── FOOTER ── */}
            <motion.footer initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1 }}
              style={{ marginTop:60, paddingTop:28, textAlign:"center", borderTop:`1px solid ${isDark?"rgba(255,255,255,0.07)":"rgba(249,115,22,0.15)"}` }}>
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

export default RiskDetectionAgent;