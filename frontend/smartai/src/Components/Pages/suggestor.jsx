import React, { useState, useEffect } from "react";
import { FaInfoCircle, FaCopy } from "react-icons/fa";
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
  const color =
    theme === "dark"
      ? Math.random() > 0.5
        ? "rgba(249,115,22,0.12)"
        : "rgba(16,185,129,0.12)"
      : Math.random() > 0.5
      ? "rgba(249,115,22,0.2)"
      : "rgba(16,185,129,0.2)";
  return (
    <motion.div
      style={{
        position: "fixed",
        left: `${x}%`,
        bottom: -20,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        pointerEvents: "none",
        zIndex: 0,
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
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

// Accent color pairs cycling across cards
const accentPairs = [
  { from: "#f97316", to: "#fb923c" },
  { from: "#10b981", to: "#34d399" },
  { from: "#f97316", to: "#10b981" },
  { from: "#0ea5e9", to: "#10b981" },
  { from: "#f59e0b", to: "#f97316" },
  { from: "#10b981", to: "#0ea5e9" },
];

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────
const SuggestorAgent = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [insights, setInsights] = useState(() => {
    try {
      const stored = localStorage.getItem("insights");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [suggestions, setSuggestions] = useState(() => {
    try {
      const stored = localStorage.getItem("suggestions");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [error, setError] = useState("");
  const [domain, setDomain] = useState(() => localStorage.getItem("pdfDomain") || "");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [riskResult, setRiskResult] = useState(() => {
    try { const s = localStorage.getItem("riskResult"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [particles] = useState(() => Array.from({ length: 18 }, (_, i) => i));

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (Array.isArray(insights) && insights.length > 0) {
      localStorage.setItem("insights", JSON.stringify(insights));
    } else {
      localStorage.removeItem("insights");
    }
  }, [insights]);

  useEffect(() => {
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      localStorage.setItem("suggestions", JSON.stringify(suggestions));
    } else {
      localStorage.removeItem("suggestions");
    }
  }, [suggestions]);

  useEffect(() => {
    if (riskResult) {
      localStorage.setItem("riskResult", JSON.stringify(riskResult));
    } else {
      localStorage.removeItem("riskResult");
    }
  }, [riskResult]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const toggleSidebar = () => setSidebarOpen((o) => !o);

  const handleClearData = async () => {
    setSuggestionLoading(true);
    setError("");
    try {
      const themeValue = localStorage.getItem("theme");
      localStorage.clear();
      if (themeValue) localStorage.setItem("theme", themeValue);
      setInsights([]);
      setSuggestions([]);
      setRiskResult(null);
      setDomain("");
      const response = await fetch("http://localhost:8000/clear-vector-db", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to clear vector database: ${response.status} - ${errText || "Unknown error"}`);
      }
      const data = await response.json();
      console.log(data.message);
      alert("All data, including vector database, cleared successfully!");
    } catch (err) {
      setError(err.message || "Failed to clear vector database.");
      console.error("Error clearing vector database:", err.message);
    } finally {
      setSuggestionLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    if (!insights || insights.length === 0) {
      setError("No insights available to generate suggestions.");
      return;
    }
    setSuggestionLoading(true);
    setError("");
    try {
      // Read latest riskResult from localStorage
      let latestRisk = riskResult;
      try {
        const storedRisk = localStorage.getItem("riskResult");
        if (storedRisk) {
          const parsed = JSON.parse(storedRisk);
          // If state is empty, fallback to stored value
          if (!latestRisk || !latestRisk.risks) {
            latestRisk = parsed;
            setRiskResult(parsed);
          }
        }
      } catch (err) {
        console.error("Invalid risk JSON in localStorage:", err);
      }

      const hasRisks =
        latestRisk &&
        Array.isArray(latestRisk.risks) &&
        latestRisk.risks.length > 0;

      const payload = {
        insights,
        ...(hasRisks && {
          risks: latestRisk.risks,
          overall_risk_level: latestRisk.overall_risk_level ?? "Low",
          risk_summary: latestRisk.risk_summary ?? "",
        }),
      };

      const res = await fetch("http://localhost:8000/generate-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText || "Unknown error"}`);
      }

      const data = await res.json();
      if (!data.suggestions || !Array.isArray(data.suggestions)) {
        throw new Error("Invalid suggestions format received from server.");
      }
      setSuggestions(data.suggestions);
      if (data.risk_result) {
        setRiskResult(data.risk_result);
        localStorage.setItem("riskResult", JSON.stringify(data.risk_result));
      }
    } catch (err) {
      setError(err.message || "Failed to generate suggestions.");
      setSuggestions([]);
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleCopy = (suggestion, index) => {
    navigator.clipboard.writeText(suggestion);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isDark = theme === "dark";

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className={`min-h-screen transition-colors duration-500 flex ${
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
        .ornament-line::before,
        .ornament-line::after {
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

        @keyframes glow-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(249,115,22,0); }
        }
        .glow-badge { animation: glow-ring 2.2s ease-in-out infinite; }

        .corner-tl { border-top: 2px solid #f97316; border-left: 2px solid #f97316; }
        .corner-br { border-bottom: 2px solid #10b981; border-right: 2px solid #10b981; }

        .suggestion-card {
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .suggestion-card:hover {
          transform: translateY(-6px);
        }
        .suggestion-card:hover .copy-reveal {
          opacity: 1 !important;
        }

        @keyframes shimmer-bg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .card-top-bar {
          background-size: 200% 200%;
          animation: shimmer-bg 4s ease infinite;
        }

        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.7; }
        }
        .skeleton { animation: skeleton-pulse 1.6s ease-in-out infinite; }

        .copied-badge {
          background: linear-gradient(135deg, #10b981, #34d399);
          color: #fff;
          border-radius: 999px;
          padding: 3px 12px;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
      `}</style>

      {/* Floating Particles */}
      {particles.map((i) => (
        <Particle key={i} theme={theme} />
      ))}

      {/* Sidebar */}
      <Sidebar
        theme={theme}
        toggleTheme={toggleTheme}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        handleClearData={handleClearData}
        isLoading={suggestionLoading}
      />

      {/* Main Content */}
      <div
        className={`flex-1 relative z-10 transition-all duration-300 ${
          sidebarOpen ? "ml-[280px]" : "ml-0"
        }`}
      >
        <motion.section
          className="max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-14 py-10 lg:py-14"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── HERO ── */}
          <motion.header variants={itemVariants} className="mb-12 text-center relative">
            {/* Decorative ring */}
            <div
              style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: 520, height: 200, borderRadius: "50%",
                border: isDark
                  ? "1px solid rgba(249,115,22,0.07)"
                  : "1px solid rgba(249,115,22,0.1)",
                pointerEvents: "none",
              }}
            />

            {/* Status badge */}
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
                <span
                  className="pulse-dot"
                  style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#f97316", display: "inline-block",
                  }}
                />
                AI-Powered Suggestions
              </span>
            </div>

            <h1
              className="grad-text"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.6rem)",
                fontWeight: 900, lineHeight: 1.1,
                letterSpacing: "-1px", marginBottom: 16,
              }}
            >
              Smart Report AI
              <br />
              <span style={{ fontSize: "0.58em", fontWeight: 700, letterSpacing: "0.02em" }}>
                Suggestor Agent
              </span>
            </h1>

            <div className="ornament-line max-w-[100px] mx-auto mb-5">
              <span style={{ fontSize: "1.1rem", color: "#f97316" }}>✦</span>
            </div>

            <p
              style={{
                fontSize: "1.05rem", lineHeight: 1.7,
                fontWeight: 400, maxWidth: 560, margin: "0 auto",
              }}
              className={isDark ? "text-gray-300" : "text-gray-600"}
            >
              Generate AI-powered suggestions based on your document insights.
              Click below to get started.
            </p>
          </motion.header>

          {/* ── DOMAIN BADGE ── */}
          <AnimatePresence>
            {domain ? (
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
                  <span
                    style={{ fontSize: "0.88rem", fontWeight: 600 }}
                    className={isDark ? "text-orange-300" : "text-orange-700"}
                  >
                    Domain:
                  </span>
                  <span
                    style={{ fontSize: "0.88rem", fontWeight: 800 }}
                    className={isDark ? "text-gray-100" : "text-gray-800"}
                  >
                    {domain}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-center mb-10"
              >
                <div
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 22px", borderRadius: 999,
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                    fontSize: "0.84rem", fontWeight: 500,
                    color: isDark ? "#6b7280" : "#9ca3af",
                  }}
                >
                  No domain identified yet
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── GET SUGGESTIONS BUTTON ── */}
          <motion.div variants={itemVariants} className="flex justify-center mb-14">
            <motion.button
              onClick={fetchSuggestions}
              disabled={suggestionLoading || !insights.length}
              whileHover={
                !suggestionLoading && insights.length
                  ? { scale: 1.06, boxShadow: "0 12px 36px rgba(249,115,22,0.38)" }
                  : {}
              }
              whileTap={!suggestionLoading && insights.length ? { scale: 0.95 } : {}}
              className="grad-btn"
              style={{
                padding: "16px 52px",
                borderRadius: 999,
                fontSize: "1rem",
                fontWeight: 800,
                letterSpacing: "0.04em",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {suggestionLoading ? (
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
                  Generating...
                </>
              ) : (
                <>✦ Get Suggestions</>
              )}
            </motion.button>
          </motion.div>

          {/* ── ERROR ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-center mb-10"
              >
                <div
                  style={{
                    padding: "12px 28px", borderRadius: 999,
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    fontSize: "0.88rem", fontWeight: 700, color: "#ef4444",
                  }}
                >
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SUGGESTIONS GRID ── */}
          {suggestions.length > 0 ? (
            <>
              {/* Section label */}
              <motion.div variants={itemVariants} className="text-center mb-10">
                <h2
                  style={{
                    fontSize: "1.5rem", fontWeight: 800,
                    letterSpacing: "-0.4px", marginBottom: 6,
                  }}
                  className={isDark ? "text-gray-100" : "text-gray-800"}
                >
                  Generated Suggestions
                </h2>
                <div className="ornament-line max-w-[110px] mx-auto">
                  <span style={{ fontSize: "0.9rem", color: "#10b981" }}>✦</span>
                </div>
                <p
                  style={{ fontSize: "0.83rem", marginTop: 8, fontWeight: 500 }}
                  className={isDark ? "text-gray-500" : "text-gray-400"}
                >
                  {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""} generated · hover to copy
                </p>
              </motion.div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((suggestion, index) => {
                  const accent = accentPairs[index % accentPairs.length];
                  return (
                    <motion.div
                      key={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.07 }}
                      className="suggestion-card"
                      style={{
                        borderRadius: 20,
                        border: `1.5px solid ${
                          isDark ? "rgba(255,255,255,0.08)" : "rgba(16,185,129,0.2)"
                        }`,
                        background: isDark
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(255,255,255,0.82)",
                        backdropFilter: "blur(14px)",
                        overflow: "hidden",
                        boxShadow: isDark
                          ? "0 4px 28px rgba(0,0,0,0.4)"
                          : "0 4px 24px rgba(16,185,129,0.1)",
                        position: "relative",
                        minHeight: 200,
                      }}
                    >
                      {/* Top shimmer bar */}
                      <div
                        className="card-top-bar"
                        style={{
                          height: 5,
                          width: "100%",
                          background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                        }}
                      />

                      {/* Corner accents */}
                      <div
                        className="corner-tl"
                        style={{
                          position: "absolute", top: 14, left: 14,
                          width: 14, height: 14, borderRadius: 2,
                        }}
                      />
                      <div
                        className="corner-br"
                        style={{
                          position: "absolute", bottom: 14, right: 14,
                          width: 14, height: 14, borderRadius: 2,
                        }}
                      />

                      {/* Number badge */}
                      <div
                        style={{
                          position: "absolute", top: 18, right: 18,
                          width: 32, height: 32, borderRadius: "50%",
                          background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.72rem", fontWeight: 900, color: "#fff",
                        }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      {/* Card body */}
                      <div style={{ padding: "22px 26px 28px" }}>
                        {/* Title row */}
                        <div
                          style={{
                            display: "flex", alignItems: "center",
                            justifyContent: "space-between", marginBottom: 14,
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "0.76rem", fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.13em",
                              color: accent.from,
                            }}
                          >
                            Suggestion {String(index + 1).padStart(2, "0")}
                          </h3>

                          {/* Copy button — revealed on hover */}
                          <motion.button
                            className="copy-reveal"
                            onClick={() => handleCopy(suggestion, index)}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                              opacity: 0,
                              padding: "6px 10px", borderRadius: 999,
                              background: isDark
                                ? "rgba(255,255,255,0.07)"
                                : `rgba(${accent.from === "#f97316" ? "249,115,22" : "16,185,129"},0.1)`,
                              border: `1px solid ${
                                isDark ? "rgba(255,255,255,0.1)" : `${accent.from}33`
                              }`,
                              cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 6,
                              fontSize: "0.76rem", fontWeight: 700,
                              color: isDark ? "#d1d5db" : accent.from,
                              transition: "opacity 0.25s ease",
                            }}
                          >
                            <FaCopy style={{ fontSize: "0.72rem" }} />
                            Copy
                          </motion.button>
                        </div>

                        {/* Divider */}
                        <div
                          style={{
                            height: 1, marginBottom: 16,
                            background: isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(16,185,129,0.12)",
                          }}
                        />

                        {/* Suggestion text */}
                        <p
                          style={{
                            fontSize: "0.94rem", lineHeight: 1.8, fontWeight: 400,
                          }}
                          className={isDark ? "text-gray-300" : "text-gray-700"}
                        >
                          {suggestion}
                        </p>
                      </div>

                      {/* Copied toast */}
                      <AnimatePresence>
                        {copiedIndex === index && (
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            style={{
                              position: "absolute", bottom: 16, right: 16,
                            }}
                          >
                            <span className="copied-badge">✓ Copied!</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : suggestionLoading ? (
            /* ── SKELETON ── */
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{
                    height: 220, borderRadius: 20,
                    background: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(16,185,129,0.06)",
                    border: `1px solid ${
                      isDark ? "rgba(255,255,255,0.05)" : "rgba(16,185,129,0.1)"
                    }`,
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
              <div
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  margin: "0 auto 20px",
                  background: isDark
                    ? "rgba(16,185,129,0.08)"
                    : "rgba(16,185,129,0.07)",
                  border: `1.5px dashed ${
                    isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.3)"
                  }`,
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "1.8rem",
                  color: "#10b981",
                }}
              >
                ✦
              </div>
              <p
                style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 8 }}
                className={isDark ? "text-gray-300" : "text-gray-700"}
              >
                Ready to Generate
              </p>
              <p
                style={{ fontSize: "0.88rem", fontWeight: 400 }}
                className={isDark ? "text-gray-500" : "text-gray-400"}
              >
                Click "✦ Get Suggestions" above to generate AI-powered recommendations
              </p>
            </motion.div>
          )}

          {/* ── FOOTER ── */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
              marginTop: 64, paddingTop: 28, textAlign: "center",
              borderTop: `1px solid ${
                isDark ? "rgba(255,255,255,0.07)" : "rgba(249,115,22,0.15)"
              }`,
            }}
          >
            <div className="ornament-line max-w-xs mx-auto" style={{ marginBottom: 14 }}>
              <span style={{ fontSize: "0.9rem", color: "#f97316" }}>✦</span>
            </div>
            <p
              style={{ fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.06em" }}
              className={isDark ? "text-gray-500" : "text-gray-400"}
            >
              Powered by{" "}
              <span className="grad-text" style={{ fontWeight: 800 }}>
                Smart Report AI
              </span>{" "}
              | &copy; {new Date().getFullYear()} xAI
            </p>
          </motion.footer>
        </motion.section>
      </div>
    </div>
  );
};

export default SuggestorAgent;