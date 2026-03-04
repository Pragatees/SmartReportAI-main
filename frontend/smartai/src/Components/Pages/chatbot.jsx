import React, { useState, useEffect, useRef } from "react";
import { FaInfoCircle, FaPaperPlane } from "react-icons/fa";
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
// Typing indicator dots
// ────────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 2px" }}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "linear-gradient(135deg, #f97316, #10b981)",
        }}
        animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.9, delay: i * 0.18, repeat: Infinity, ease: "easeInOut" }}
      />
    ))}
  </div>
);

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
const msgVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 160, damping: 18 } },
};

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────
const ChatbotAgent = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [domain, setDomain] = useState(() => localStorage.getItem("pdfDomain") || "");
  const [content, setContent] = useState(() => localStorage.getItem("pdfText") || "");
  const [insights] = useState(() => {
    try { return JSON.parse(localStorage.getItem("insights")) || []; } catch { return []; }
  });
  const [suggestions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("suggestions")) || []; } catch { return []; }
  });
  const [riskResult] = useState(() => {
    try { return JSON.parse(localStorage.getItem("riskResult")) || null; } catch { return null; }
  });
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem("chatMessages")) || []; } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatStarted, setChatStarted] = useState(
    () => localStorage.getItem("chatStarted") === "true"
  );
  const [particles] = useState(() => Array.from({ length: 18 }, (_, i) => i));
  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const toggleSidebar = () => setSidebarOpen((o) => !o);

  // ── START CHAT ──
  const handleStartChat = async () => {
    if (!content || !domain || !insights.length || !suggestions.length) {
      setError("Missing required data to initialize chat.");
      return;
    }
    setIsLoading(true);
    setError("");
try {
  const normalizedRisk = {
    risks: Array.isArray(riskResult?.risks) ? riskResult.risks : [],
    overall_risk_level: riskResult?.overall_risk_level ?? "Low",
    risk_summary:
      riskResult?.risk_summary ??
      "No significant risks identified in the document."
  };

  const response = await fetch("http://localhost:8000/store-vector", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: content,
      domain_result: { domain },
      insights_result: {
        detailed_insights: insights,
        domain_summary: ""
      },
      suggestions,
      risk_result: normalizedRisk  // ✅ ALWAYS SENT
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to initialize vector database");
  }

  setChatStarted(true);
  localStorage.setItem("chatStarted", "true");

}
    
    catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── SEND MESSAGE ──
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMessage = { text: input, sender: "user", timestamp };
    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:8000/query-vector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userInput, k: 5 }),
      });
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const data = await response.json();
      if (!data.response) throw new Error("Invalid response format");
      const botMessage = {
        text: data.response,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setError("Failed to get response from server.");
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === "dark";

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

        @keyframes glow-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(249,115,22,0); }
        }
        .glow-badge { animation: glow-ring 2.2s ease-in-out infinite; }

        /* Chat scroll */
        .chat-scroll::-webkit-scrollbar { width: 5px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #f97316, #10b981);
          border-radius: 3px;
        }

        /* Input focus */
        .chat-input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(249,115,22,0.3);
        }

        /* Message bubble hover */
        .msg-bubble { transition: transform 0.2s ease; }
        .msg-bubble:hover { transform: scale(1.01); }

        @keyframes shimmer-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
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
        handleClearData={() => {}}
        isLoading={isLoading}
      />

      {/* Main */}
      <div
        className={`flex-1 relative z-10 transition-all duration-300 ${
          sidebarOpen ? "ml-[280px]" : "ml-0"
        }`}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-14 py-10 lg:py-14">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {/* ── HERO ── */}
            <motion.header variants={itemVariants} className="mb-10 text-center relative">
              {/* Decorative ring */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: 520, height: 200, borderRadius: "50%",
                border: isDark ? "1px solid rgba(249,115,22,0.07)" : "1px solid rgba(249,115,22,0.1)",
                pointerEvents: "none",
              }} />

              {/* Badge */}
              <div className="flex justify-center mb-6">
                <span className="glow-badge" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "6px 22px", borderRadius: 999,
                  border: `1px solid ${isDark ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.4)"}`,
                  background: isDark ? "rgba(249,115,22,0.08)" : "rgba(249,115,22,0.06)",
                  fontSize: "0.76rem", letterSpacing: "0.14em",
                  textTransform: "uppercase", color: "#f97316",
                }}>
                  <span className="pulse-dot" style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#f97316", display: "inline-block",
                  }} />
                  AI Conversational Intelligence
                </span>
              </div>

              <h1 className="grad-text" style={{
                fontSize: "clamp(2rem, 5vw, 3.6rem)",
                fontWeight: 900, lineHeight: 1.1,
                letterSpacing: "-1px", marginBottom: 16,
              }}>
                Smart Report AI
                <br />
                <span style={{ fontSize: "0.58em", fontWeight: 700, letterSpacing: "0.02em" }}>
                  Chatbot Agent
                </span>
              </h1>

              <div className="ornament-line max-w-[100px] mx-auto mb-5">
                <span style={{ fontSize: "1.1rem", color: "#f97316" }}>✦</span>
              </div>

              <p style={{
                fontSize: "1.05rem", lineHeight: 1.7,
                fontWeight: 400, maxWidth: 560, margin: "0 auto",
              }} className={isDark ? "text-gray-300" : "text-gray-600"}>
                Ask questions about your document. The AI will answer using your
                extracted content, insights, and suggestions.
              </p>
            </motion.header>

            {/* ── DOMAIN BADGE ── */}
            <AnimatePresence>
              {domain && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center mb-8"
                >
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    padding: "10px 28px", borderRadius: 999,
                    border: `1.5px solid ${isDark ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.35)"}`,
                    background: isDark ? "rgba(249,115,22,0.08)" : "rgba(249,115,22,0.06)",
                    backdropFilter: "blur(10px)",
                  }}>
                    <FaInfoCircle style={{ color: "#f97316", fontSize: "1rem" }} />
                    <span style={{ fontSize: "0.88rem", fontWeight: 600 }}
                      className={isDark ? "text-orange-300" : "text-orange-700"}>
                      Domain:
                    </span>
                    <span style={{ fontSize: "0.88rem", fontWeight: 800 }}
                      className={isDark ? "text-gray-100" : "text-gray-800"}>
                      {domain}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── PRE-CHAT / START STATE ── */}
            {!chatStarted ? (
              <motion.div variants={itemVariants} className="text-center py-12">
                {/* Decorative card */}
                <div style={{
                  maxWidth: 480, margin: "0 auto 36px",
                  padding: "36px 32px", borderRadius: 20,
                  border: `1.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(249,115,22,0.15)"}`,
                  background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(14px)",
                  boxShadow: isDark ? "0 4px 28px rgba(0,0,0,0.35)" : "0 4px 24px rgba(249,115,22,0.08)",
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Top bar */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    height: 4,
                    background: "linear-gradient(135deg, #f97316, #10b981)",
                  }} />

                  <div style={{
                    width: 72, height: 72, borderRadius: "50%",
                    margin: "0 auto 20px",
                    background: isDark ? "rgba(249,115,22,0.1)" : "rgba(249,115,22,0.08)",
                    border: `1.5px dashed ${isDark ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.35)"}`,
                    display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "2rem",
                  }}>
                    💬
                  </div>

                  <h3 style={{
                    fontSize: "1.15rem", fontWeight: 800,
                    marginBottom: 8,
                  }} className={isDark ? "text-gray-100" : "text-gray-800"}>
                    Ready to Chat
                  </h3>
                  <p style={{
                    fontSize: "0.88rem", lineHeight: 1.7,
                    fontWeight: 400, marginBottom: 28,
                  }} className={isDark ? "text-gray-400" : "text-gray-500"}>
                    Initialize the AI with your document data to begin
                    an intelligent conversation about your content.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.06, boxShadow: "0 12px 36px rgba(249,115,22,0.38)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartChat}
                    disabled={isLoading}
                    className="grad-btn"
                    style={{
                      padding: "14px 44px", borderRadius: 999,
                      fontSize: "0.96rem", fontWeight: 800,
                      letterSpacing: "0.04em",
                      display: "inline-flex", alignItems: "center", gap: 10,
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div style={{ position: "relative", width: 20, height: 20 }}>
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
                        Initializing...
                      </>
                    ) : (
                      <>✦ Start Conversation</>
                    )}
                  </motion.button>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        display: "inline-flex", padding: "12px 28px",
                        borderRadius: 999, fontSize: "0.88rem",
                        fontWeight: 700, color: "#ef4444",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.3)",
                      }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* ── CHAT WINDOW ── */
              <motion.div
                variants={itemVariants}
                style={{
                  borderRadius: 20, overflow: "hidden",
                  border: `1.5px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(249,115,22,0.15)"}`,
                  background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.78)",
                  backdropFilter: "blur(16px)",
                  boxShadow: isDark
                    ? "0 8px 40px rgba(0,0,0,0.45)"
                    : "0 8px 40px rgba(249,115,22,0.1)",
                  display: "flex", flexDirection: "column",
                  height: "70vh",
                  position: "relative",
                }}
              >
                {/* Chat header bar */}
                <div style={{
                  padding: "16px 24px",
                  borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(249,115,22,0.12)"}`,
                  background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
                  display: "flex", alignItems: "center", gap: 12,
                  position: "relative",
                }}>
                  {/* Top shimmer bar */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    height: 3,
                    background: "linear-gradient(135deg, #f97316, #10b981)",
                  }} />

                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "linear-gradient(135deg, #f97316, #10b981)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", color: "#fff", fontWeight: 800,
                    flexShrink: 0,
                  }}>
                    AI
                  </div>

                  <div>
                    <p style={{
                      fontSize: "0.9rem", fontWeight: 800,
                      lineHeight: 1.2,
                    }} className={isDark ? "text-gray-100" : "text-gray-800"}>
                      Smart Report AI
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#10b981", display: "inline-block",
                        animation: "pulse-dot 1.6s ease-in-out infinite",
                      }} />
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 600, color: "#10b981",
                        letterSpacing: "0.04em",
                      }}>
                        Online · Ready to answer
                      </span>
                    </div>
                  </div>

                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 700,
                      padding: "4px 12px", borderRadius: 999,
                      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(249,115,22,0.08)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(249,115,22,0.2)"}`,
                      color: isDark ? "#d1d5db" : "#6b7280",
                    }}>
                      {messages.length} message{messages.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Messages area */}
                <div
                  className="chat-scroll"
                  style={{
                    flex: 1, overflowY: "auto",
                    padding: "24px 28px",
                    display: "flex", flexDirection: "column", gap: 16,
                  }}
                >
                  {/* Welcome message */}
                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        textAlign: "center", padding: "32px 24px",
                      }}
                    >
                      <div style={{
                        fontSize: "2.4rem", marginBottom: 12,
                        lineHeight: 1,
                      }}>
                        ✦
                      </div>
                      <p style={{
                        fontSize: "0.9rem", fontWeight: 600,
                        marginBottom: 6,
                      }} className={isDark ? "text-gray-300" : "text-gray-700"}>
                        Conversation initialized!
                      </p>
                      <p style={{
                        fontSize: "0.82rem", fontWeight: 400,
                        maxWidth: 380, margin: "0 auto",
                      }} className={isDark ? "text-gray-500" : "text-gray-400"}>
                        Ask anything about your document — insights, summaries,
                        specific details, or recommendations.
                      </p>
                    </motion.div>
                  )}

                  {/* Message bubbles */}
                  <AnimatePresence initial={false}>
                    {messages.map((msg, index) => {
                      const isUser = msg.sender === "user";
                      return (
                        <motion.div
                          key={index}
                          variants={msgVariants}
                          initial="hidden"
                          animate="visible"
                          style={{
                            display: "flex",
                            justifyContent: isUser ? "flex-end" : "flex-start",
                            alignItems: "flex-end",
                            gap: 10,
                          }}
                        >
                          {/* Bot avatar */}
                          {!isUser && (
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%",
                              background: "linear-gradient(135deg, #f97316, #10b981)",
                              display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: "0.64rem",
                              color: "#fff", fontWeight: 900, flexShrink: 0,
                              marginBottom: 2,
                            }}>
                              AI
                            </div>
                          )}

                          <div style={{
                            maxWidth: "72%",
                            display: "flex", flexDirection: "column",
                            alignItems: isUser ? "flex-end" : "flex-start",
                            gap: 4,
                          }}>
                            <div
                              className="msg-bubble"
                              style={{
                                padding: "14px 18px",
                                borderRadius: isUser
                                  ? "20px 20px 4px 20px"
                                  : "20px 20px 20px 4px",
                                background: isUser
                                  ? "linear-gradient(135deg, #f97316, #fb923c)"
                                  : isDark
                                  ? "rgba(255,255,255,0.07)"
                                  : "rgba(255,255,255,0.92)",
                                border: isUser
                                  ? "none"
                                  : `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(249,115,22,0.12)"}`,
                                boxShadow: isUser
                                  ? "0 4px 16px rgba(249,115,22,0.3)"
                                  : isDark
                                  ? "0 4px 16px rgba(0,0,0,0.25)"
                                  : "0 4px 16px rgba(0,0,0,0.06)",
                                color: isUser
                                  ? "#fff"
                                  : isDark ? "#e2e8f0" : "#1a202c",
                                fontSize: "0.9rem",
                                lineHeight: 1.7,
                                fontWeight: 400,
                              }}
                            >
                              {msg.text}
                            </div>
                            <span style={{
                              fontSize: "0.68rem", fontWeight: 500,
                              color: isDark ? "#4b5563" : "#9ca3af",
                              paddingLeft: isUser ? 0 : 4,
                              paddingRight: isUser ? 4 : 0,
                            }}>
                              {msg.timestamp}
                            </span>
                          </div>

                          {/* User avatar */}
                          {isUser && (
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%",
                              background: isDark
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(249,115,22,0.15)",
                              border: `1.5px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(249,115,22,0.3)"}`,
                              display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: "0.7rem",
                              color: "#f97316", fontWeight: 900, flexShrink: 0,
                              marginBottom: 2,
                            }}>
                              U
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        style={{
                          display: "flex", alignItems: "flex-end", gap: 10,
                        }}
                      >
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: "linear-gradient(135deg, #f97316, #10b981)",
                          display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: "0.64rem",
                          color: "#fff", fontWeight: 900, flexShrink: 0,
                        }}>
                          AI
                        </div>
                        <div style={{
                          padding: "12px 18px",
                          borderRadius: "20px 20px 20px 4px",
                          background: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.92)",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(249,115,22,0.12)"}`,
                          boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.25)" : "0 4px 16px rgba(0,0,0,0.06)",
                        }}>
                          <TypingDots />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* Error bar */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        margin: "0 16px",
                        padding: "10px 20px",
                        borderRadius: 999,
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        fontSize: "0.82rem", fontWeight: 700,
                        color: "#ef4444", textAlign: "center",
                      }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── INPUT BAR ── */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    padding: "16px 20px",
                    borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(249,115,22,0.12)"}`,
                    background: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.5)",
                    display: "flex", alignItems: "center", gap: 12,
                  }}
                >
                  {/* Input wrapper with gradient border */}
                  <div style={{
                    flex: 1, borderRadius: 999, padding: 2,
                    background: input.trim()
                      ? "linear-gradient(135deg, rgba(249,115,22,0.5), rgba(16,185,129,0.5))"
                      : isDark ? "rgba(255,255,255,0.08)" : "rgba(249,115,22,0.15)",
                  }}>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask a question about your document..."
                      disabled={isLoading}
                      className="chat-input"
                      style={{
                        width: "100%", borderRadius: 999,
                        padding: "12px 22px",
                        border: "none", outline: "none",
                        fontSize: "0.9rem", fontWeight: 400,
                        background: isDark ? "rgba(10,14,25,0.96)" : "rgba(255,255,255,0.95)",
                        color: isDark ? "#e2e8f0" : "#1a202c",
                        display: "block",
                        fontFamily: "'Times New Roman', Times, serif",
                      }}
                    />
                  </div>

                  {/* Send button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    whileHover={
                      !isLoading && input.trim()
                        ? { scale: 1.1, boxShadow: "0 8px 24px rgba(249,115,22,0.4)" }
                        : {}
                    }
                    whileTap={!isLoading && input.trim() ? { scale: 0.92 } : {}}
                    className="grad-btn"
                    style={{
                      width: 48, height: 48, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: "1rem",
                    }}
                  >
                    {isLoading ? (
                      <motion.div
                        style={{
                          width: 18, height: 18, borderRadius: "50%",
                          border: "2.5px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff",
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <FaPaperPlane style={{ fontSize: "0.85rem" }} />
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ── FOOTER ── */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                marginTop: 40, paddingTop: 28, textAlign: "center",
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
                {" "}| &copy; {new Date().getFullYear()} xAI
              </p>
            </motion.footer>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotAgent;