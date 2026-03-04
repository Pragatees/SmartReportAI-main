import React, { useState, useEffect } from "react";
import {
  FaFilePdf,
  FaCopy,
  FaTimes,
  FaUpload,
  FaCheckCircle,
  FaInfoCircle,
  FaSearch,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./sidebar";

// Brain SVG
const Brain = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 4.5C8.5 4.5 6 7 6 10.5C6 12.5 7 14 8 15.5C9 17 9.5 18.5 9.5 20C9.5 21 9 22 7.5 22M12 4.5C15.5 4.5 18 7 18 10.5C18 12.5 17 14 16 15.5C15 17 14.5 18.5 14.5 20C14.5 21 15 22 16.5 22M12 4.5V2M4 12H2M12 20V22M20 12H22M12 9V15M8.5 9H9.5C10.6 9 11.5 9.9 11.5 11V11.5C11.5 12.6 12.4 13.5 13.5 13.5H14.5C15.6 13.5 16.5 12.6 16.5 11.5V11C16.5 9.9 17.4 9 18.5 9H19.5"
      stroke="url(#brainGradient)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="brainGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f97316" />
        <stop offset="1" stopColor="#10b981" />
      </linearGradient>
    </defs>
  </svg>
);

// Floating particle component
const Particle = ({ theme }) => {
  const size = Math.random() * 6 + 2;
  const x = Math.random() * 100;
  const duration = Math.random() * 12 + 8;
  const delay = Math.random() * 5;
  const color = theme === "light"
    ? Math.random() > 0.5 ? "rgba(249,115,22,0.25)" : "rgba(16,185,129,0.25)"
    : Math.random() > 0.5 ? "rgba(249,115,22,0.15)" : "rgba(16,185,129,0.15)";
  return (
    <motion.div
      style={{
        position: "fixed",
        left: `${x}%`,
        bottom: "-20px",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        pointerEvents: "none",
        zIndex: 0,
      }}
      animate={{ y: [0, -window.innerHeight - 40], opacity: [0, 1, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    />
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 14 } },
};
const buttonVariants = {
  hover: { scale: 1.06, boxShadow: "0px 8px 24px rgba(249,115,22,0.35)" },
  tap: { scale: 0.94 },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 110, damping: 16 } },
};

const instructions = [
  { icon: <FaUpload />, text: "Upload or drag a PDF, Word, or image file into the designated area.", step: "01" },
  { icon: <FaFilePdf />, text: "Wait for Smart Report AI to extract the text automatically.", step: "02" },
  { icon: <FaSearch />, text: "Click 'Find Domain' to identify the document's domain.", step: "03" },
  { icon: <FaCopy />, text: "Copy the extracted text or clear it to start over.", step: "04" },
];

const PdfTextExtractor = () => {
  const [pdfText, setPdfText] = useState(() => localStorage.getItem("pdfText") || "");
  const [domain, setDomain] = useState(() => localStorage.getItem("pdfDomain") || null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [success, setSuccess] = useState(false);
  const [domainLoading, setDomainLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [particles] = useState(() => Array.from({ length: 18 }, (_, i) => i));

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    if (pdfText) {
      localStorage.setItem("pdfText", pdfText);
    } else {
      localStorage.removeItem("pdfText");
    }
  }, [pdfText]);

  useEffect(() => {
    if (domain) {
      localStorage.setItem("pdfDomain", domain);
    } else {
      localStorage.removeItem("pdfDomain");
    }
  }, [domain]);

  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleClearData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const themeValue = localStorage.getItem("theme");
      localStorage.clear();
      if (themeValue) localStorage.setItem("theme", themeValue);
      setPdfText("");
      setDomain(null);
      setSuccess(false);
      setFileInfo(null);
      document.getElementById("file-upload").value = "";

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
      setIsLoading(false);
    }
  };

  const extractTextFromFile = async (file) => {
    setIsLoading(true);
    setSuccess(false);
    setDomain(null);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("http://localhost:8000/ocr/extract-text", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to extract text from file");
      setPdfText(data.text);
      setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(2) + " KB" });
      setSuccess(true);
    } catch (err) {
      console.error("Failed to extract text:", err);
      setError(err.message || "Failed to extract text from file. Please try again.");
      setPdfText("");
      setFileInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const validTypes = [
      "application/pdf", "image/png", "image/jpeg", "image/jpg",
      "image/tif", "image/tiff", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (file && validTypes.includes(file.type)) {
      await extractTextFromFile(file);
    } else {
      setError("Please upload a valid file (PDF, PNG, JPG, JPEG, TIF, TIFF, DOC, DOCX).");
      setPdfText(""); setFileInfo(null); setDomain(null);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    const validTypes = [
      "application/pdf", "image/png", "image/jpeg", "image/jpg",
      "image/tif", "image/tiff", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (file && validTypes.includes(file.type)) {
      await extractTextFromFile(file);
    } else {
      setError("Please drop a valid file (PDF, PNG, JPG, JPEG, TIF, TIFF, DOC, DOCX).");
      setPdfText(""); setFileInfo(null); setDomain(null);
    }
  };

  const handleDragOver = (event) => { event.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleClear = () => {
    setPdfText(""); setError(""); setSuccess(false);
    setFileInfo(null); setDomain(null);
    localStorage.removeItem("pdfText");
    localStorage.removeItem("pdfDomain");
    document.getElementById("file-upload").value = "";
  };

  const handleCopy = () => {
    if (pdfText) {
      navigator.clipboard.writeText(pdfText);
      alert("Text copied to clipboard!");
    }
  };

  const handleFindDomain = async () => {
    if (pdfText) {
      setDomainLoading(true);
      setError("");
      try {
        const response = await fetch("http://localhost:8000/identify-domain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: pdfText }),
        });
        if (!response.ok) throw new Error("Failed to fetch domain from server");
        const data = await response.json();
        setDomain(data.domain);
      } catch (err) {
        console.error("Failed to identify domain:", err);
        setError("Failed to identify domain. Please try again.");
        setDomain(null);
      } finally {
        setDomainLoading(false);
      }
    }
  };

  const isDark = theme === "dark";

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className={`min-h-screen transition-colors duration-500 flex ${
        isDark
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800"
          : "bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50"
      }`}
    >
      {/* === GLOBAL STYLES === */}
      <style>{`
        * { font-family: 'Times New Roman', Times, serif !important; font-style: normal !important; }

        /* Gradient text */
        .grad-text {
          background: linear-gradient(135deg, #f97316 0%, #fb923c 40%, #10b981 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* Gradient button */
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
          box-shadow: 0 8px 30px rgba(249,115,22,0.4);
        }
        .grad-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Ornamental divider */
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

        /* Step card glow */
        .step-card:hover {
          box-shadow: 0 0 0 1.5px #f9731640, 0 12px 40px rgba(249,115,22,0.15);
        }

        /* Upload zone shimmer */
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-border {
          background: linear-gradient(90deg, #f97316, #10b981, #f97316);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          padding: 2px;
          border-radius: 16px;
        }

        /* Pulse dot */
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        .pulse-dot {
          animation: pulse-dot 1.5s ease-in-out infinite;
        }

        /* Scroll bar */
        textarea::-webkit-scrollbar { width: 6px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #f97316, #10b981);
          border-radius: 3px;
        }

        /* Corner decoration */
        .corner-tl { border-top: 2px solid #f97316; border-left: 2px solid #f97316; }
        .corner-br { border-bottom: 2px solid #10b981; border-right: 2px solid #10b981; }

        /* Glow ring for domain badge */
        @keyframes glow-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
        }
        .glow-ring { animation: glow-ring 2s ease-in-out infinite; }

        /* Number badge */
        .step-num {
          background: linear-gradient(135deg, #f97316, #10b981);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-size: 2.8rem;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -2px;
        }
      `}</style>

      {/* Floating Particles */}
      {particles.map((i) => (
        <Particle key={i} theme={theme} />
      ))}

      {/* Sidebar Component */}
      <Sidebar
        theme={theme}
        toggleTheme={toggleTheme}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        handleClearData={handleClearData}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 relative z-10 ${sidebarOpen ? "ml-[280px]" : "ml-0"}`}
      >

        {/* ── HERO SECTION ── */}
        <motion.section
          className="py-16 px-4 sm:px-8 lg:px-16 text-center relative overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Decorative rings */}
          <div
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 600, height: 600,
              borderRadius: "50%",
              border: isDark ? "1px solid rgba(249,115,22,0.08)" : "1px solid rgba(249,115,22,0.12)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400, height: 400,
              borderRadius: "50%",
              border: isDark ? "1px solid rgba(16,185,129,0.08)" : "1px solid rgba(16,185,129,0.12)",
              pointerEvents: "none",
            }}
          />

          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 20px",
                border: `1px solid ${isDark ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.4)"}`,
                borderRadius: 999,
                background: isDark ? "rgba(249,115,22,0.08)" : "rgba(249,115,22,0.06)",
                fontSize: "0.78rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#f97316",
              }}
            >
              <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", display: "inline-block" }} />
              AI-Powered Document Intelligence
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            variants={itemVariants}
            style={{ fontSize: "clamp(2rem, 5vw, 3.8rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 20 }}
            className="grad-text"
          >
            Smart Report AI
            <br />
            <span style={{ fontSize: "0.6em", fontWeight: 700, letterSpacing: "0.02em" }}>
              Identifier Agent
            </span>
          </motion.h1>

          {/* Ornamental line */}
          <motion.div variants={itemVariants} className="ornament-line max-w-xs mx-auto mb-6">
            <span style={{ fontSize: "1.2rem", color: "#f97316" }}>✦</span>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}
            style={{ fontWeight: 400 }}
          >
            Extract text from PDFs, Word documents, or images and identify the document's
            domain with our AI-powered Identifier Agent. Upload or drag-and-drop your file to get started.
          </motion.p>

          <motion.a
            href="/"
            variants={itemVariants}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 32px rgba(249,115,22,0.35)" }}
            whileTap={{ scale: 0.96 }}
            className="grad-btn"
            style={{
              marginTop: 28, display: "inline-block",
              padding: "14px 36px", borderRadius: 999,
              fontSize: "0.95rem", fontWeight: 700,
              letterSpacing: "0.04em", textDecoration: "none",
            }}
          >
            Learn More About Smart Report AI
          </motion.a>
        </motion.section>

        {/* ── BODY ── */}
        <section className="px-4 sm:px-8 lg:px-16 pb-16">

          {/* ── HOW TO USE ── */}
          <motion.div
            className="mb-14"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="text-center mb-10">
              <h2
                style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}
                className={isDark ? "text-gray-100" : "text-gray-800"}
              >
                How to Use
              </h2>
              <div className="ornament-line max-w-[120px] mx-auto">
                <span style={{ fontSize: "0.85rem", color: "#10b981" }}>✦</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {instructions.map((step, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="step-card"
                  style={{
                    padding: "28px 24px",
                    borderRadius: 16,
                    background: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(255,255,255,0.7)",
                    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(249,115,22,0.12)",
                    backdropFilter: "blur(12px)",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "default",
                    transition: "box-shadow 0.3s ease",
                  }}
                >
                  {/* Corner accent */}
                  <div className="corner-tl" style={{ position: "absolute", top: 10, left: 10, width: 16, height: 16, borderRadius: 2 }} />
                  <div className="corner-br" style={{ position: "absolute", bottom: 10, right: 10, width: 16, height: 16, borderRadius: 2 }} />

                  <div className="step-num">{step.step}</div>
                  <div
                    style={{
                      fontSize: "1.4rem", marginBottom: 12, marginTop: 4,
                      color: index % 2 === 0 ? "#f97316" : "#10b981",
                    }}
                  >
                    {step.icon}
                  </div>
                  <p
                    style={{ fontSize: "0.88rem", lineHeight: 1.65, fontWeight: 400 }}
                    className={isDark ? "text-gray-300" : "text-gray-600"}
                  >
                    {step.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── FILE UPLOAD ZONE ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 90 }}
            className="mb-10"
          >
            <div className={isDragging ? "shimmer-border" : ""} style={{ borderRadius: 16 }}>
              <motion.div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                animate={{
                  borderColor: isDragging
                    ? "#f97316"
                    : isDark ? "rgba(255,255,255,0.1)" : "rgba(249,115,22,0.25)",
                  scale: isDragging ? 1.015 : 1,
                }}
                transition={{ type: "spring", stiffness: 150 }}
                style={{
                  padding: "48px 32px",
                  borderRadius: 14,
                  border: `2px dashed ${isDragging ? "#f97316" : isDark ? "rgba(255,255,255,0.12)" : "rgba(249,115,22,0.28)"}`,
                  background: isDragging
                    ? isDark ? "rgba(249,115,22,0.08)" : "rgba(249,115,22,0.05)"
                    : isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(14px)",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                {/* Upload icon */}
                <motion.div
                  animate={{ y: isDragging ? -8 : 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  style={{
                    width: 64, height: 64, borderRadius: "50%", margin: "0 auto 20px",
                    background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(16,185,129,0.15))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.8rem", color: "#f97316",
                  }}
                >
                  <FaUpload />
                </motion.div>

                <label
                  htmlFor="file-upload"
                  style={{ display: "block", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8, cursor: "pointer" }}
                  className={isDark ? "text-gray-200" : "text-gray-700"}
                >
                  Upload or Drop your File Here
                </label>
                <p style={{ fontSize: "0.82rem", marginBottom: 20, fontWeight: 400 }}
                   className={isDark ? "text-gray-500" : "text-gray-400"}>
                  PDF · PNG · JPG · TIFF · DOC · DOCX
                </p>

                <input
                  id="file-upload"
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg,image/tif,image/tiff,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  style={{ display: "none" }}
                />

                <label htmlFor="file-upload">
                  <motion.span
                    whileHover={{ scale: 1.06, boxShadow: "0 8px 24px rgba(249,115,22,0.35)" }}
                    whileTap={{ scale: 0.95 }}
                    className="grad-btn"
                    style={{
                      display: "inline-block", padding: "12px 32px",
                      borderRadius: 999, fontSize: "0.9rem", fontWeight: 700,
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.5 : 1,
                      letterSpacing: "0.03em",
                    }}
                  >
                    <FaUpload style={{ display: "inline", marginRight: 8, fontSize: "0.85rem" }} />
                    Choose File
                  </motion.span>
                </label>

                <AnimatePresence>
                  {isDragging && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      style={{ marginTop: 16, fontSize: "0.9rem", fontWeight: 700, color: "#f97316" }}
                    >
                      ✦ Release to Upload ✦
                    </motion.p>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {fileInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        marginTop: 20, display: "inline-flex", gap: 24,
                        padding: "10px 24px", borderRadius: 999,
                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(249,115,22,0.07)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(249,115,22,0.2)"}`,
                      }}
                    >
                      <span style={{ fontSize: "0.82rem", fontWeight: 600 }} className={isDark ? "text-gray-300" : "text-gray-600"}>
                        <strong>File:</strong> {fileInfo.name}
                      </span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600 }} className={isDark ? "text-gray-300" : "text-gray-600"}>
                        <strong>Size:</strong> {fileInfo.size}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>

          {/* ── LOADING SPINNER ── */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                className="flex flex-col items-center mb-8 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ position: "relative", width: 52, height: 52 }}>
                  <motion.div
                    style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      border: "3px solid transparent",
                      borderTopColor: "#f97316",
                      borderRightColor: "#10b981",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    style={{
                      position: "absolute", inset: 6, borderRadius: "50%",
                      border: "2px solid transparent",
                      borderTopColor: "#10b981",
                      borderRightColor: "#f97316",
                    }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600 }} className={isDark ? "text-gray-400" : "text-gray-500"}>
                  Extracting text...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SUCCESS MESSAGE ── */}
          <AnimatePresence>
            {success && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "12px 28px", borderRadius: 999, marginBottom: 24,
                  width: "fit-content", margin: "0 auto 24px",
                  background: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
              >
                <FaCheckCircle style={{ color: "#10b981", fontSize: "1rem" }} />
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#10b981" }}>
                  Text extracted successfully!
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── ERROR MESSAGE ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "12px 28px", borderRadius: 999, marginBottom: 24,
                  width: "fit-content", margin: "0 auto 24px",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#ef4444" }}>
                  {error}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FIND DOMAIN BUTTON ── */}
          <AnimatePresence>
            {success && !isLoading && (
              <motion.div
                className="flex justify-center mb-8"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleFindDomain}
                  disabled={domainLoading}
                  className="grad-btn"
                  style={{
                    padding: "14px 40px", borderRadius: 999,
                    fontSize: "0.95rem", fontWeight: 700,
                    letterSpacing: "0.04em",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <FaSearch style={{ fontSize: "0.9rem" }} />
                  Find Domain
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── DOMAIN LOADING ── */}
          <AnimatePresence>
            {domainLoading && (
              <motion.div
                className="flex flex-col items-center mb-8 gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ position: "relative", width: 40, height: 40 }}>
                  <motion.div
                    style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      border: "3px solid transparent",
                      borderTopColor: "#10b981", borderRightColor: "#f97316",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <p style={{ fontSize: "0.83rem", fontWeight: 600 }} className={isDark ? "text-gray-400" : "text-gray-500"}>
                  Identifying domain...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── DOMAIN RESULT ── */}
          <AnimatePresence>
            {domain && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                className="glow-ring"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
                  padding: "20px 36px", borderRadius: 16, marginBottom: 28,
                  background: isDark
                    ? "rgba(16,185,129,0.08)"
                    : "rgba(16,185,129,0.06)",
                  border: "1.5px solid rgba(16,185,129,0.35)",
                  backdropFilter: "blur(12px)",
                  width: "fit-content",
                  margin: "0 auto 28px",
                }}
              >
                <FaInfoCircle style={{ fontSize: "1.3rem", color: "#10b981" }} />
                <div>
                  <p style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#10b981", marginBottom: 2 }}>
                    Identified Domain
                  </p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 800, color: isDark ? "#e2e8f0" : "#1a202c" }}>
                    {domain}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TEXT OUTPUT ── */}
          <motion.div
            className="relative mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 90 }}
          >
            {/* Label */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span
                style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}
                className={isDark ? "text-gray-400" : "text-gray-500"}
              >
                Extracted Text
              </span>
              <AnimatePresence>
                {pdfText && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    style={{ display: "flex", gap: 8 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCopy}
                      title="Copy extracted text"
                      style={{
                        padding: "8px 16px", borderRadius: 999, fontSize: "0.8rem",
                        fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(249,115,22,0.08)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(249,115,22,0.2)"}`,
                        cursor: "pointer",
                        color: isDark ? "#d1d5db" : "#4b5563",
                      }}
                    >
                      <FaCopy style={{ fontSize: "0.78rem" }} /> Copy
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClear}
                      title="Clear text"
                      style={{
                        padding: "8px 16px", borderRadius: 999, fontSize: "0.8rem",
                        fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
                        background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.07)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        cursor: "pointer", color: "#ef4444",
                      }}
                    >
                      <FaTimes style={{ fontSize: "0.78rem" }} /> Clear
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              style={{
                borderRadius: 16, padding: 2,
                background: pdfText
                  ? "linear-gradient(135deg, rgba(249,115,22,0.3), rgba(16,185,129,0.3))"
                  : isDark ? "rgba(255,255,255,0.06)" : "rgba(249,115,22,0.12)",
              }}
            >
              <textarea
                value={pdfText}
                readOnly
                rows={12}
                placeholder="Extracted text will appear here..."
                style={{
                  width: "100%", borderRadius: 14,
                  padding: "20px 24px",
                  fontSize: "0.9rem", lineHeight: 1.75,
                  resize: "none", outline: "none", border: "none",
                  background: isDark ? "rgba(17,24,39,0.95)" : "rgba(255,255,255,0.92)",
                  color: isDark ? "#e2e8f0" : "#1a202c",
                  backdropFilter: "blur(10px)",
                  transition: "background 0.3s",
                  fontFamily: "'Times New Roman', Times, serif",
                  display: "block",
                }}
              />
            </div>
          </motion.div>

          {/* ── FOOTER ── */}
          <motion.div
            style={{
              padding: "28px 0 8px",
              textAlign: "center",
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(249,115,22,0.15)"}`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="ornament-line max-w-xs mx-auto mb-4">
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

        </section>
      </div>
    </div>
  );
};

export default PdfTextExtractor;