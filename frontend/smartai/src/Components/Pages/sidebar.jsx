import React from "react";
import { FaHome, FaLightbulb, FaRobot, FaComments, FaFilePdf, FaTrash, FaSun, FaMoon, FaBars, FaBullseye , FaExclamationTriangle } from "react-icons/fa";
import { motion } from "framer-motion";

// Brain SVG
const Brain = ({ className }) => (
  <motion.svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ rotate: 0, scale: 1 }}
    whileHover={{ rotate: 5, scale: 1.12 }}
    transition={{ type: "spring", stiffness: 200, damping: 10 }}
  >
    <path
      d="M12 4.5C8.5 4.5 6 7 6 10.5C6 12.5 7 14 8 15.5C9 17 9.5 18.5 9.5 20C9.5 21 9 22 7.5 22M12 4.5C15.5 4.5 18 7 18 10.5C18 12.5 17 14 16 15.5C15 17 14.5 18.5 14.5 20M12 4.5V2M4 12H2M12 20V22M20 12H22"
      stroke="url(#brainGradientSidebar)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="brainGradientSidebar" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f97316" />
        <stop offset="1" stopColor="#10b981" />
      </linearGradient>
    </defs>
  </motion.svg>
);

const navItems = [
  { icon: <FaHome />,     text: "Identifier Agent", path: "/home",    step: "01" },
  { icon: <FaLightbulb />,text: "Insightor Agent",  path: "/insight", step: "02" },
  { icon: <FaExclamationTriangle />,    text: "Risk Dectection Agent",    path: "/risk", step: "03" },
  { icon: <FaRobot />,    text: "Suggestor Agent",    path: "/suggest", step: "04" },
  { icon: <FaComments />, text: "AI Chatbot agent",          path: "/bot",     step: "05" },
  { icon: <FaBullseye />, text: "Goal Achieving Agent",             path: "/goal",    step: "06" },
  { icon: <FaFilePdf />,  text: "Final Report",     path: "/report",  step: "07" },
];

const Sidebar = ({ theme, toggleTheme, sidebarOpen, toggleSidebar, handleClearData, isLoading }) => {
  const currentPath = window.location.pathname;
  const isDark = theme === "dark";

  return (
    <>
      <style>{`
        * { font-family: 'Times New Roman', Times, serif !important; font-style: normal !important; }

        .sb-grad-text {
          background: linear-gradient(135deg, #f97316, #10b981);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* Active nav item */
        .sb-nav-active {
          background: linear-gradient(90deg, rgba(249,115,22,0.18), rgba(16,185,129,0.12));
          border-left: 3px solid #f97316;
        }

        /* Nav hover */
        .sb-nav-item {
          transition: all 0.22s ease;
          border-left: 3px solid transparent;
          position: relative;
          overflow: hidden;
        }
        .sb-nav-item::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(249,115,22,0.09), rgba(16,185,129,0.07));
          opacity: 0;
          transition: opacity 0.22s ease;
        }
        .sb-nav-item:hover::before { opacity: 1; }
        .sb-nav-item:hover {
          border-left-color: rgba(249,115,22,0.5);
          transform: translateX(4px);
        }

        /* Glow on action buttons */
        .sb-action-btn {
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .sb-action-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(249,115,22,0.12), rgba(16,185,129,0.1));
          opacity: 0;
          transition: opacity 0.25s ease;
          border-radius: inherit;
        }
        .sb-action-btn:hover::after { opacity: 1; }
        .sb-action-btn:hover { box-shadow: 0 0 18px rgba(249,115,22,0.25), 0 0 18px rgba(16,185,129,0.15); }

        /* Ornament pulse dot */
        @keyframes pulse-dot-sb {
          0%,100%{ transform:scale(1); opacity:1; }
          50%{ transform:scale(1.5); opacity:0.6; }
        }
        .sb-pulse { animation: pulse-dot-sb 1.8s ease-in-out infinite; }

        /* Shimmer top bar */
        @keyframes shimmer-sb {
          0%{ background-position:0% 50%; }
          50%{ background-position:100% 50%; }
          100%{ background-position:0% 50%; }
        }
        .sb-shimmer-bar {
          background: linear-gradient(90deg, #f97316, #10b981, #f97316);
          background-size: 200% 200%;
          animation: shimmer-sb 3s ease infinite;
        }

        /* Scrollbar */
        .sb-scroll::-webkit-scrollbar { width: 4px; }
        .sb-scroll::-webkit-scrollbar-track { background: transparent; }
        .sb-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #f97316, #10b981);
          border-radius: 2px;
        }

        /* Toggle button */
        @keyframes spin-bars {
          0%{ transform: rotate(0deg); }
          100%{ transform: rotate(180deg); }
        }

        /* Step badge */
        .sb-step-badge {
          background: linear-gradient(135deg, #f97316, #10b981);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>

      {/* ── SIDEBAR PANEL ── */}
      <div
        style={{
          position: "fixed", top: 0, left: 0,
          height: "100%", zIndex: 40,
          width: sidebarOpen ? "280px" : "0px",
          transition: "width 0.3s ease",
          overflow: "hidden",
          boxShadow: sidebarOpen
            ? isDark ? "4px 0 32px rgba(0,0,0,0.5)" : "4px 0 32px rgba(249,115,22,0.1)"
            : "none",
          background: isDark
            ? "rgba(10,14,25,0.97)"
            : "rgba(255,255,255,0.96)",
          borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(249,115,22,0.15)"}`,
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "280px" }}>

          {/* Top shimmer bar */}
          <div className="sb-shimmer-bar" style={{ height: 3, flexShrink: 0 }} />

          {/* ── HEADER ── */}
          <div style={{
            padding: "28px 24px 22px",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(249,115,22,0.12)"}`,
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            {/* Logo circle */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              style={{
                width: 68, height: 68,
                borderRadius: "50%",
                background: isDark ? "rgba(249,115,22,0.1)" : "rgba(249,115,22,0.07)",
                border: `1.5px solid ${isDark ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.25)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
                boxShadow: "0 0 20px rgba(249,115,22,0.12)",
              }}
            >
              <Brain style={{ width: 36, height: 36 }} />
            </motion.div>

            {/* Brand name */}
            <motion.h2
              className="sb-grad-text"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.18 }}
              style={{ fontSize: "1.18rem", fontWeight: 900, letterSpacing: "-0.3px", marginBottom: 6, textAlign: "center" }}
            >
              Smart Report AI
            </motion.h2>

            {/* Online badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 14px", borderRadius: 999,
              border: `1px solid ${isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.3)"}`,
              background: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)",
              fontSize: "0.68rem", letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#10b981",
            }}>
              <span className="sb-pulse" style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              All Systems Active
            </div>
          </div>

          {/* ── NAV LABEL ── */}
          <div style={{ padding: "18px 24px 10px" }}>
            <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: isDark ? "#4b5563" : "#9ca3af" }}>
              Navigation
            </p>
          </div>

          {/* ── NAV ITEMS ── */}
          <ul className="sb-scroll" style={{ flex: 1, padding: "0 12px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {navItems.map((item, idx) => {
              const isActive = currentPath === item.path;
              return (
                <li key={idx}>
                  <a
                    href={item.path}
                    style={{ textDecoration: "none" }}
                  >
                    <motion.div
                      className={`sb-nav-item ${isActive ? "sb-nav-active" : ""}`}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: "flex", alignItems: "center",
                        padding: "11px 14px", borderRadius: 10,
                        gap: 12, cursor: "pointer",
                        borderLeftColor: isActive ? "#f97316" : "transparent",
                        background: isActive
                          ? isDark ? "rgba(249,115,22,0.1)" : "rgba(249,115,22,0.07)"
                          : "transparent",
                      }}
                    >
                      {/* Icon */}
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{
                          width: 34, height: 34, borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.95rem", flexShrink: 0,
                          background: isActive
                            ? "linear-gradient(135deg, #f97316, #10b981)"
                            : isDark ? "rgba(255,255,255,0.06)" : "rgba(249,115,22,0.08)",
                          color: isActive ? "#fff" : isDark ? "#9ca3af" : "#6b7280",
                          boxShadow: isActive ? "0 4px 12px rgba(249,115,22,0.3)" : "none",
                        }}
                      >
                        {item.icon}
                      </motion.div>

                      {/* Label */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: "0.88rem", fontWeight: isActive ? 800 : 600,
                          color: isActive
                            ? isDark ? "#fb923c" : "#ea580c"
                            : isDark ? "#d1d5db" : "#374151",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {item.text}
                        </p>
                      </div>

                      {/* Step badge */}
                      <span className="sb-step-badge" style={{ fontSize: "0.65rem", fontWeight: 900, flexShrink: 0 }}>
                        {item.step}
                      </span>

                      {/* Active indicator dot */}
                      {isActive && (
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#f97316", flexShrink: 0,
                          boxShadow: "0 0 6px rgba(249,115,22,0.6)",
                        }} />
                      )}
                    </motion.div>
                  </a>
                </li>
              );
            })}
          </ul>

          {/* ── DIVIDER ── */}
          <div style={{
            margin: "0 16px",
            height: 1,
            background: `linear-gradient(90deg, transparent, ${isDark ? "rgba(255,255,255,0.08)" : "rgba(249,115,22,0.15)"}, transparent)`,
          }} />

          {/* ── ACTION BUTTONS ── */}
          <div style={{ padding: "16px 12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Clear Data */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleClearData}
              disabled={isLoading}
              className="sb-action-btn"
              style={{
                width: "100%", padding: "11px 16px",
                borderRadius: 10, border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.2)"}`,
                background: isDark ? "rgba(239,68,68,0.07)" : "rgba(239,68,68,0.05)",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.5 : 1,
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "rgba(239,68,68,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <FaTrash style={{ fontSize: "0.8rem", color: "#ef4444" }} />
              </div>
              <span style={{ fontSize: "0.86rem", fontWeight: 700, color: isDark ? "#fca5a5" : "#dc2626" }}>
                Clear All Data
              </span>
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={toggleTheme}
              className="sb-action-btn"
              style={{
                width: "100%", padding: "11px 16px",
                borderRadius: 10,
                border: `1px solid ${isDark ? "rgba(249,115,22,0.2)" : "rgba(249,115,22,0.2)"}`,
                background: isDark ? "rgba(249,115,22,0.06)" : "rgba(249,115,22,0.05)",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(16,185,129,0.15))",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {isDark
                  ? <FaSun style={{ fontSize: "0.85rem", color: "#fb923c" }} />
                  : <FaMoon style={{ fontSize: "0.85rem", color: "#f97316" }} />
                }
              </div>
              <span style={{ fontSize: "0.86rem", fontWeight: 700, color: isDark ? "#fb923c" : "#ea580c" }}>
                {isDark ? "Light Mode" : "Dark Mode"}
              </span>

              {/* Toggle pill */}
              <div style={{
                marginLeft: "auto",
                width: 36, height: 20, borderRadius: 999,
                background: isDark ? "rgba(249,115,22,0.25)" : "rgba(0,0,0,0.1)",
                position: "relative", flexShrink: 0,
                border: `1px solid ${isDark ? "rgba(249,115,22,0.4)" : "rgba(0,0,0,0.1)"}`,
              }}>
                <div style={{
                  position: "absolute", top: 2,
                  left: isDark ? "calc(100% - 18px)" : 2,
                  width: 14, height: 14, borderRadius: "50%",
                  background: isDark ? "#f97316" : "#9ca3af",
                  transition: "left 0.25s ease",
                  boxShadow: isDark ? "0 0 6px rgba(249,115,22,0.5)" : "none",
                }} />
              </div>
            </motion.button>
          </div>

          {/* ── BOTTOM ORNAMENT ── */}
          <div style={{
            padding: "0 24px 16px",
            textAlign: "center",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(249,115,22,0.1)"}`,
            paddingTop: 12,
          }}>
            <p style={{ fontSize: "0.66rem", fontWeight: 500, letterSpacing: "0.07em", color: isDark ? "#374151" : "#d1d5db" }}>
              &copy; {new Date().getFullYear()} xAI
            </p>
          </div>

        </div>
      </div>

      {/* ── TOGGLE BUTTON ── */}
      <motion.button
        onClick={toggleSidebar}
        whileHover={{ scale: 1.1, rotate: sidebarOpen ? 90 : -90 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: "fixed", top: 16, zIndex: 50,
          left: sidebarOpen ? "288px" : "16px",
          transition: "left 0.3s ease",
          width: 40, height: 40, borderRadius: "50%",
          border: `1.5px solid ${isDark ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.3)"}`,
          background: isDark
            ? "rgba(10,14,25,0.95)"
            : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          boxShadow: isDark
            ? "0 4px 16px rgba(0,0,0,0.4)"
            : "0 4px 16px rgba(249,115,22,0.15)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#f97316",
        }}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <FaBars style={{ fontSize: "0.85rem" }} />
      </motion.button>
    </>
  );
};

export default Sidebar;