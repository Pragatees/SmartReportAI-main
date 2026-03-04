import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./sidebar";
import { FaInfoCircle, FaChevronDown, FaChevronUp } from "react-icons/fa";

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
function safeLocalStorageGet(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch {
    return fallback;
  }
}

function safeLocalStorageGetJSON(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

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
      style={{
        position: "fixed", left: `${x}%`, bottom: -20,
        width: size, height: size, borderRadius: "50%",
        background: color, pointerEvents: "none", zIndex: 0,
      }}
      animate={{ y: [0, -(window.innerHeight + 40)], opacity: [0, 1, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    />
  );
};

// ────────────────────────────────────────────────
// Framer Motion Variants
// ────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 16 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
};
const insightVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto", transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.25 } },
};

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────
export default function InsightAgentWithSidebar() {
  const [theme, setTheme] = useState(() => safeLocalStorageGet("theme", "light"));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [domain, setDomain] = useState(() => safeLocalStorageGet("pdfDomain", ""));
  const [content, setContent] = useState(() => safeLocalStorageGet("pdfText", ""));
  const [summary, setSummary] = useState(() => safeLocalStorageGet("pdfSummary", ""));
  const [insights, setInsights] = useState(() => safeLocalStorageGetJSON("insights", []));
  const [expanded, setExpanded] = useState(() => safeLocalStorageGetJSON("expandedInsights", {}));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [particles] = useState(() => Array.from({ length: 18 }, (_, i) => i));

  useEffect(() => {
    try {
      document.documentElement.className = theme;
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem("pdfDomain", domain);
      localStorage.setItem("pdfText", content);
      localStorage.setItem("pdfSummary", summary);
      if (insights.length > 0) localStorage.setItem("insights", JSON.stringify(insights));
      else localStorage.removeItem("insights");
      if (Object.keys(expanded).length > 0) localStorage.setItem("expandedInsights", JSON.stringify(expanded));
      else localStorage.removeItem("expandedInsights");
    } catch (err) {
      console.warn("localStorage save failed:", err);
    }
  }, [domain, content, summary, insights, expanded]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const toggleSidebar = () => setSidebarOpen((o) => !o);
  const toggleInsight = (index) => setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));

  const handleClearData = async () => {
    setLoading(true);
    setError("");
    try {
      const savedTheme = safeLocalStorageGet("theme", "light");
      localStorage.removeItem("pdfDomain");
      localStorage.removeItem("pdfText");
      localStorage.removeItem("pdfSummary");
      localStorage.removeItem("insights");
      localStorage.removeItem("expandedInsights");
      localStorage.setItem("theme", savedTheme);
      setDomain(""); setContent(""); setSummary(""); setInsights([]); setExpanded({});
      await fetch("http://localhost:8000/clear-vector-db", { method: "DELETE" });
    } catch (err) {
      console.error("Clear failed:", err);
      setError("Failed to clear data completely");
    } finally {
      setLoading(false);
    }
  };

  const handleGetInsights = async () => {
    if (!domain.trim() || !content.trim()) { setError("Please provide both domain and content"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("http://localhost:8000/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, content, language: "English" }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setInsights(data.detailed_insights || []);
      setSummary(data.domain_summary || "");
      setExpanded({});
    } catch (err) {
      console.error("Generate insights failed:", err);
      setError("Failed to generate insights. Please try again.");
      setInsights([]); setSummary("");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  // Card accent colors cycling
  const accentPairs = [
    { from: "#f97316", to: "#fb923c" },
    { from: "#10b981", to: "#34d399" },
    { from: "#f97316", to: "#10b981" },
    { from: "#0ea5e9", to: "#10b981" },
    { from: "#f59e0b", to: "#f97316" },
    { from: "#10b981", to: "#0ea5e9" },
  ];

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className={`min-h-screen flex transition-colors duration-500 ${
        isDark
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-slate-950"
          : "bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50"
      }`}
    >
      {/* ── GLOBAL STYLES ── */}
      <style>{`
        * { font-family: 'Times New Roman', Times, serif !important; font-style: normal !important; }

        .grad-text {
          background: linear-gradient(135deg, #f97316 0%, #fb923c 40%, #10b981 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .grad-btn {
          background: linear-gradient(135deg, #f97316, #10b981);
          color: #fff;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Times New Roman', Times, serif !important;
        }
        .grad-btn:hover {
          background: linear-gradient(135deg, #ea580c, #059669);
          box-shadow: 0 10px 32px rgba(249,115,22,0.38);
        }
        .grad-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ornament-line {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ornament-line::before, .ornament-line::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #f97316, transparent);
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        .pulse-dot { animation: pulse-dot 1.6s ease-in-out infinite; }

        .insight-card {
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .insight-card:hover {
          transform: translateY(-6px);
        }

        @keyframes glow-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(249,115,22,0); }
        }
        .glow-badge { animation: glow-ring 2.2s ease-in-out infinite; }

        .corner-tl { border-top: 2px solid #f97316; border-left: 2px solid #f97316; }
        .corner-br { border-bottom: 2px solid #10b981; border-right: 2px solid #10b981; }

        textarea::-webkit-scrollbar { width: 6px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #f97316, #10b981);
          border-radius: 3px;
        }

        @keyframes shimmer-bg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .card-top-bar {
          background: linear-gradient(135deg, var(--bar-from), var(--bar-to));
          background-size: 200% 200%;
          animation: shimmer-bg 4s ease infinite;
        }

        .skeleton-pulse {
          animation: skeleton 1.6s ease-in-out infinite;
        }
        @keyframes skeleton {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Floating Particles */}
      {particles.map((i) => <Particle key={i} theme={theme} />)}

      {/* Sidebar */}
      <Sidebar
        theme={theme}
        toggleTheme={toggleTheme}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        handleClearData={handleClearData}
        isLoading={loading}
      />

      {/* Main */}
      <main
        className={`flex-1 relative z-10 transition-all duration-300 ${sidebarOpen ? "md:ml-[280px]" : "md:ml-0"}`}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-14 py-10 lg:py-14">
          <motion.section variants={containerVariants} initial="hidden" animate="visible">

            {/* ── HERO ── */}
            <motion.header variants={itemVariants} className="mb-12 text-center relative">
              {/* Decorative rings */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: 520, height: 200,
                borderRadius: "50%",
                border: isDark ? "1px solid rgba(249,115,22,0.07)" : "1px solid rgba(249,115,22,0.1)",
                pointerEvents: "none",
              }} />

              {/* Badge */}
              <div className="flex justify-center mb-6">
                <span
                  className="glow-badge"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "6px 22px", borderRadius: 999,
                    border: `1px solid ${isDark ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.4)"}`,
                    background: isDark ? "rgba(249,115,22,0.08)" : "rgba(249,115,22,0.06)",
                    fontSize: "0.76rem", letterSpacing: "0.14em",
                    textTransform: "uppercase", color: "#f97316",
                  }}
                >
                  <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", display: "inline-block" }} />
                  AI Document Intelligence
                </span>
              </div>

              <h1
                className="grad-text"
                style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 16 }}
              >
                Insight Agent
              </h1>

              <div className="ornament-line max-w-[100px] mx-auto mb-5">
                <span style={{ fontSize: "1.1rem", color: "#f97316" }}>✦</span>
              </div>

              <p
                style={{ fontSize: "1.05rem", lineHeight: 1.7, fontWeight: 400, maxWidth: 580, margin: "0 auto" }}
                className={isDark ? "text-gray-300" : "text-gray-600"}
              >
                Extract meaningful, structured insights from documents with precision and clarity.
              </p>
            </motion.header>

            {/* ── DOMAIN BADGE ── */}
            <AnimatePresence>
              {domain && (
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  className="flex justify-center mb-10"
                >
                  <div
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 10,
                      padding: "10px 28px", borderRadius: 999,
                      border: `1.5px solid ${isDark ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.35)"}`,
                      background: isDark ? "rgba(249,115,22,0.08)" : "rgba(249,115,22,0.06)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <FaInfoCircle style={{ color: "#f97316", fontSize: "1rem" }} />
                    <span style={{ fontSize: "0.88rem", fontWeight: 600 }} className={isDark ? "text-orange-300" : "text-orange-700"}>
                      Domain:
                    </span>
                    <span style={{ fontSize: "0.88rem", fontWeight: 800 }} className={isDark ? "text-gray-100" : "text-gray-800"}>
                      {domain}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── TEXTAREA ── */}
            <motion.div variants={itemVariants} className="mb-10">
              <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em" }}
                  className={isDark ? "text-gray-400" : "text-gray-500"}
                >
                  Document Content
                </span>
                {content && (
                  <span style={{ fontSize: "0.76rem", fontWeight: 500 }} className={isDark ? "text-gray-500" : "text-gray-400"}>
                    {content.length.toLocaleString()} characters
                  </span>
                )}
              </div>

              {/* Gradient border wrapper */}
              <div style={{
                borderRadius: 16, padding: 2,
                background: content
                  ? "linear-gradient(135deg, rgba(249,115,22,0.4), rgba(16,185,129,0.4))"
                  : isDark ? "rgba(255,255,255,0.07)" : "rgba(249,115,22,0.15)",
              }}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste document text, report content, article body..."
                  rows={11}
                  style={{
                    width: "100%", borderRadius: 14,
                    padding: "22px 26px",
                    fontSize: "0.92rem", lineHeight: 1.8,
                    resize: "vertical", outline: "none", border: "none",
                    background: isDark ? "rgba(10,14,25,0.96)" : "rgba(255,255,255,0.93)",
                    color: isDark ? "#e2e8f0" : "#1a202c",
                    backdropFilter: "blur(12px)",
                    display: "block",
                    minHeight: 240,
                    fontFamily: "'Times New Roman', Times, serif",
                    transition: "background 0.3s",
                  }}
                />
              </div>
            </motion.div>

            {/* ── GENERATE BUTTON ── */}
            <AnimatePresence>
              {domain.trim() && content.trim().length > 40 && (
                <motion.div
                  className="flex justify-center mb-14"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.06, boxShadow: "0 12px 36px rgba(249,115,22,0.38)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGetInsights}
                    disabled={loading}
                    className="grad-btn"
                    style={{
                      padding: "16px 48px", borderRadius: 999,
                      fontSize: "1rem", fontWeight: 800,
                      letterSpacing: "0.04em",
                      display: "flex", alignItems: "center", gap: 12,
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{ position: "relative", width: 22, height: 22 }}>
                          <motion.div
                            style={{
                              position: "absolute", inset: 0, borderRadius: "50%",
                              border: "3px solid rgba(255,255,255,0.3)",
                              borderTopColor: "#fff",
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                        Analyzing...
                      </>
                    ) : (
                      <>✦ Generate Deep Insights</>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── ERROR ── */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: "flex", justifyContent: "center", marginBottom: 28,
                  }}
                >
                  <div style={{
                    padding: "12px 28px", borderRadius: 999,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                    fontSize: "0.88rem", fontWeight: 700, color: "#ef4444",
                  }}>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── INSIGHTS GRID ── */}
            {insights.length > 0 ? (
              <>
                {/* Section label */}
                <motion.div variants={itemVariants} className="text-center mb-10">
                  <h2
                    style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 6 }}
                    className={isDark ? "text-gray-100" : "text-gray-800"}
                  >
                    Generated Insights
                  </h2>
                  <div className="ornament-line max-w-[110px] mx-auto">
                    <span style={{ fontSize: "0.9rem", color: "#10b981" }}>✦</span>
                  </div>
                  <p style={{ fontSize: "0.83rem", marginTop: 8, fontWeight: 500 }}
                     className={isDark ? "text-gray-500" : "text-gray-400"}>
                    {insights.length} insight{insights.length !== 1 ? "s" : ""} found · click any card to expand
                  </p>
                </motion.div>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {insights.map((insight, index) => {
                    const accent = accentPairs[index % accentPairs.length];
                    const isOpen = expanded[index];
                    return (
                      <motion.div
                        key={index}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.06 }}
                        className="insight-card"
                        style={{
                          borderRadius: 20,
                          border: `1.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(249,115,22,0.14)"}`,
                          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.78)",
                          backdropFilter: "blur(14px)",
                          overflow: "hidden",
                          boxShadow: isDark
                            ? "0 4px 24px rgba(0,0,0,0.4)"
                            : "0 4px 24px rgba(249,115,22,0.08)",
                          position: "relative",
                          minHeight: 200,
                        }}
                      >
                        {/* Top gradient bar */}
                        <div
                          className="card-top-bar"
                          style={{
                            "--bar-from": accent.from,
                            "--bar-to": accent.to,
                            height: 5,
                            width: "100%",
                          } }
                        />

                        {/* Corner accents */}
                        <div className="corner-tl" style={{ position: "absolute", top: 14, left: 14, width: 14, height: 14, borderRadius: 2 }} />
                        <div className="corner-br" style={{ position: "absolute", bottom: 14, right: 14, width: 14, height: 14, borderRadius: 2 }} />

                        {/* Index badge */}
                        <div style={{
                          position: "absolute", top: 18, right: 18,
                          width: 32, height: 32, borderRadius: "50%",
                          background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.72rem", fontWeight: 900, color: "#fff",
                        }}>
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        {/* Header */}
                        <div
                          onClick={() => toggleInsight(index)}
                          style={{
                            padding: "24px 26px 20px",
                            cursor: "pointer",
                            display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "1.08rem", fontWeight: 800, lineHeight: 1.45,
                              flex: 1, paddingRight: 8,
                            }}
                            className={isDark ? "text-gray-100" : "text-gray-800"}
                          >
                            {insight.title}
                          </h3>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            style={{
                              flexShrink: 0, marginTop: 3,
                              width: 28, height: 28, borderRadius: "50%",
                              background: isDark ? "rgba(255,255,255,0.07)" : "rgba(249,115,22,0.09)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#f97316",
                            }}
                          >
                            <FaChevronDown style={{ fontSize: "0.72rem" }} />
                          </motion.div>
                        </div>

                        {/* Divider */}
                        <div style={{
                          height: 1, margin: "0 26px",
                          background: isDark ? "rgba(255,255,255,0.06)" : "rgba(249,115,22,0.1)",
                        }} />

                        {/* Short preview when collapsed */}
                        {!isOpen && insight.description && (
                          <p
                            style={{
                              padding: "16px 26px 22px",
                              fontSize: "0.88rem", lineHeight: 1.7, fontWeight: 400,
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                            className={isDark ? "text-gray-400" : "text-gray-500"}
                          >
                            {insight.description}
                          </p>
                        )}

                        {/* Expanded content */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              variants={insightVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              style={{ overflow: "hidden" }}
                            >
                              <div style={{ padding: "20px 26px 28px" }}>
                                <p
                                  style={{ fontSize: "0.92rem", lineHeight: 1.8, marginBottom: 20, fontWeight: 400 }}
                                  className={isDark ? "text-gray-300" : "text-gray-700"}
                                >
                                  {insight.description}
                                </p>

                                {insight.supporting_data?.length > 0 && (
                                  <div style={{
                                    paddingTop: 18,
                                    borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(249,115,22,0.12)"}`,
                                  }}>
                                    <p style={{
                                      fontSize: "0.72rem", fontWeight: 700,
                                      textTransform: "uppercase", letterSpacing: "0.13em",
                                      marginBottom: 14, color: "#10b981",
                                    }}>
                                      Supporting Evidence
                                    </p>
                                    <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                      {insight.supporting_data.map((item, i) => (
                                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                          <span style={{
                                            flexShrink: 0, marginTop: 4,
                                            width: 7, height: 7, borderRadius: "50%",
                                            background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                                            display: "inline-block",
                                          }} />
                                          <span
                                            style={{ fontSize: "0.87rem", lineHeight: 1.65, fontWeight: 400 }}
                                            className={isDark ? "text-gray-400" : "text-gray-600"}
                                          >
                                            {item}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            ) : loading ? (
              /* ── SKELETON ── */
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton-pulse"
                    style={{
                      height: 260, borderRadius: 20,
                      background: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(249,115,22,0.06)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(249,115,22,0.1)"}`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              /* ── EMPTY STATE ── */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <div style={{
                  width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
                  background: isDark ? "rgba(249,115,22,0.08)" : "rgba(249,115,22,0.07)",
                  border: `1.5px dashed ${isDark ? "rgba(249,115,22,0.25)" : "rgba(249,115,22,0.3)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.8rem",
                }}>
                  ✦
                </div>
                <p style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 8 }}
                   className={isDark ? "text-gray-300" : "text-gray-700"}>
                  Ready to Analyze
                </p>
                <p style={{ fontSize: "0.88rem", fontWeight: 400 }}
                   className={isDark ? "text-gray-500" : "text-gray-400"}>
                  Paste document content above and click "Generate Deep Insights"
                </p>
              </motion.div>
            )}

            {/* ── SUMMARY ── */}
            <AnimatePresence>
              {summary && (
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  style={{ marginTop: 48 }}
                >
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <h3
                      style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 6 }}
                      className={isDark ? "text-gray-100" : "text-gray-800"}
                    >
                      Domain Summary
                    </h3>
                    <div className="ornament-line max-w-[100px] mx-auto">
                      <span style={{ fontSize: "0.9rem", color: "#f97316" }}>✦</span>
                    </div>
                  </div>

                  <div style={{
                    padding: 2,
                    borderRadius: 18,
                    background: "linear-gradient(135deg, rgba(249,115,22,0.3), rgba(16,185,129,0.3))",
                  }}>
                    <div style={{
                      padding: "28px 32px", borderRadius: 16,
                      background: isDark ? "rgba(10,14,25,0.96)" : "rgba(255,255,255,0.92)",
                      backdropFilter: "blur(12px)",
                    }}>
                      <p
                        style={{ fontSize: "0.96rem", lineHeight: 1.85, fontWeight: 400 }}
                        className={isDark ? "text-gray-300" : "text-gray-700"}
                      >
                        {summary}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── FOOTER ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                marginTop: 60, paddingTop: 28, textAlign: "center",
                borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(249,115,22,0.15)"}`,
              }}
            >
              <div className="ornament-line max-w-xs mx-auto" style={{ marginBottom: 14 }}>
                <span style={{ fontSize: "0.9rem", color: "#f97316" }}>✦</span>
              </div>
              <p style={{ fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.06em" }}
                 className={isDark ? "text-gray-500" : "text-gray-400"}>
                Powered by{" "}
                <span className="grad-text" style={{ fontWeight: 800 }}>Smart Report AI</span>
                {" "}|{" "}
                &copy; {new Date().getFullYear()} xAI
              </p>
            </motion.div>

          </motion.section>
        </div>
      </main>
    </div>
  );
}