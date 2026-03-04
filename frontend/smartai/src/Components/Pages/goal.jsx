import React, { useState, useEffect } from "react";
import { FaBullseye, FaCheckCircle, FaTimes, FaInfoCircle, FaSpinner } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
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
  visible:{ opacity:1, transition:{ staggerChildren:0.13, delayChildren:0.2 } },
};
const itemVariants = {
  hidden:{ opacity:0, y:24 },
  visible:{ opacity:1, y:0, transition:{ type:"spring", stiffness:120, damping:16 } },
};
const cardVariants = {
  hidden:{ opacity:0, y:28, scale:0.97 },
  visible:{ opacity:1, y:0, scale:1, transition:{ type:"spring", stiffness:110, damping:15 } },
};

const instructions = [
  { icon:<FaBullseye />, text:"Enter your specific goal in the input field below.", step:"01" },
  { icon:<FaCheckCircle />, text:"Ensure extracted PDF text is available in local storage.", step:"02" },
  { icon:<FaInfoCircle />, text:"Click 'Specify Goal' to generate an actionable plan.", step:"03" },
];

const timelineAccents = [
  { from:"#f97316", to:"#fb923c" },
  { from:"#10b981", to:"#34d399" },
  { from:"#f97316", to:"#10b981" },
];

const GoalSpecifyAgent = () => {
  const [goal, setGoal] = useState(() => localStorage.getItem("goal") || "");
  const [pdfText, setPdfText] = useState(() => localStorage.getItem("pdfText") || "");
  const [response, setResponse] = useState(() => {
    try { const s = localStorage.getItem("response"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [error, setError] = useState(() => localStorage.getItem("error") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [particles] = useState(() => Array.from({ length:18 }, (_,i) => i));

  useEffect(() => { localStorage.setItem("theme", theme); document.documentElement.className = theme; }, [theme]);
  useEffect(() => { localStorage.setItem("goal", goal); }, [goal]);
  useEffect(() => { if(response) localStorage.setItem("response", JSON.stringify(response)); else localStorage.removeItem("response"); }, [response]);
  useEffect(() => { localStorage.setItem("error", error); }, [error]);
  useEffect(() => { setPdfText(localStorage.getItem("pdfText") || ""); }, []);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");
  const toggleSidebar = () => setSidebarOpen(o => !o);

  const handleClear = () => {
    setGoal(""); setResponse(null); setError("");
    localStorage.removeItem("goal"); localStorage.removeItem("response"); localStorage.removeItem("error");
  };

  const handleSpecifyGoal = async () => {
    if (!goal.trim()) { setError("Please enter a goal."); return; }
    if (!pdfText.trim()) { setError("No PDF text found. Please upload a document first."); return; }
    setIsLoading(true); setError(""); setResponse(null);
    try {
      const apiResponse = await fetch("http://localhost:8000/specify-goal", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ goal, pdf_content:pdfText }),
      });
      const data = await apiResponse.json();
      if (!apiResponse.ok) { setError(data.detail || "Failed to specify goal."); return; }
      if (data === "Not domain matched") { setError("The provided goal does not match the domain of the uploaded document."); return; }
      if (!data.procedure || !data.approach || !Array.isArray(data.steps) || data.steps.length < 3 || data.steps.length > 5) {
        setError("Invalid response format from the server."); return;
      }
      setResponse(data);
    } catch(err) {
      setError("Failed to specify goal. Please check your connection and try again.");
    } finally { setIsLoading(false); }
  };

  const isDark = theme === "dark";

  return (
    <div
      style={{ fontFamily:"'Times New Roman', Times, serif" }}
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
        .step-card { transition:box-shadow 0.3s ease,transform 0.3s ease; }
        .step-card:hover { box-shadow:0 0 0 1.5px rgba(249,115,22,0.25),0 12px 40px rgba(249,115,22,0.12); transform:translateY(-5px); }
        @keyframes shimmer-bg { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .card-top-bar { background-size:200% 200%; animation:shimmer-bg 4s ease infinite; }
        .goal-input:focus { outline:none; box-shadow:0 0 0 2px rgba(249,115,22,0.3); }
        .timeline-connector { position:absolute; left:19px; top:0; bottom:0; width:2px; background:linear-gradient(180deg,#f97316,#10b981); opacity:0.2; }
      `}</style>

      {particles.map(i => <Particle key={i} theme={theme} />)}

      <Sidebar
        theme={theme} toggleTheme={toggleTheme}
        sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar}
        handleClearData={() => {
          setGoal(""); setResponse(null); setError("");
          localStorage.removeItem("pdfText"); localStorage.removeItem("goal");
          localStorage.removeItem("response"); localStorage.removeItem("error");
        }}
        isLoading={isLoading}
      />

      <div className={`flex-1 relative z-10 transition-all duration-300 ${sidebarOpen ? "ml-[280px]" : "ml-0"}`}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-14 py-10 lg:py-14">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">

            {/* HERO */}
            <motion.header variants={itemVariants} className="mb-12 text-center relative">
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:520, height:200, borderRadius:"50%", border:isDark?"1px solid rgba(249,115,22,0.07)":"1px solid rgba(249,115,22,0.1)", pointerEvents:"none" }} />
              <div className="flex justify-center mb-6">
                <span className="glow-badge" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 22px", borderRadius:999, border:`1px solid ${isDark?"rgba(249,115,22,0.3)":"rgba(249,115,22,0.4)"}`, background:isDark?"rgba(249,115,22,0.08)":"rgba(249,115,22,0.06)", fontSize:"0.76rem", letterSpacing:"0.14em", textTransform:"uppercase", color:"#f97316" }}>
                  <span className="pulse-dot" style={{ width:7, height:7, borderRadius:"50%", background:"#f97316", display:"inline-block" }} />
                  AI Goal Planning Intelligence
                </span>
              </div>
              <h1 className="grad-text" style={{ fontSize:"clamp(2rem,5vw,3.6rem)", fontWeight:900, lineHeight:1.1, letterSpacing:"-1px", marginBottom:16 }}>
                Smart Report AI<br />
                <span style={{ fontSize:"0.58em", fontWeight:700, letterSpacing:"0.02em" }}>Goal Specification Agent</span>
              </h1>
              <div className="ornament-line max-w-[100px] mx-auto mb-5">
                <span style={{ fontSize:"1.1rem", color:"#f97316" }}>&#10022;</span>
              </div>
              <p style={{ fontSize:"1.05rem", lineHeight:1.7, fontWeight:400, maxWidth:580, margin:"0 auto" }} className={isDark?"text-gray-300":"text-gray-600"}>
                Specify your goal and leverage our AI to generate a clear, actionable plan based on your uploaded document's content.
              </p>
            </motion.header>

            {/* HOW TO USE */}
            <motion.div variants={itemVariants} className="mb-14">
              <div className="text-center mb-10">
                <h2 style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-0.4px", marginBottom:6 }} className={isDark?"text-gray-100":"text-gray-800"}>How to Specify Your Goal</h2>
                <div className="ornament-line max-w-[120px] mx-auto">
                  <span style={{ fontSize:"0.9rem", color:"#10b981" }}>&#10022;</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {instructions.map((step, index) => {
                  const accent = timelineAccents[index];
                  return (
                    <motion.div key={index} variants={cardVariants} whileHover={{ y:-6, scale:1.03 }} transition={{ type:"spring", stiffness:200 }} className="step-card"
                      style={{ padding:"28px 24px", borderRadius:16, background:isDark?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.72)", border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(249,115,22,0.13)"}`, backdropFilter:"blur(12px)", position:"relative", overflow:"hidden", boxShadow:isDark?"0 4px 24px rgba(0,0,0,0.35)":"0 4px 20px rgba(249,115,22,0.07)" }}>
                      <div className="card-top-bar" style={{ position:"absolute", top:0, left:0, right:0, height:4, background:`linear-gradient(135deg,${accent.from},${accent.to})` }} />
                      <div className="corner-tl" style={{ position:"absolute", top:14, left:14, width:13, height:13, borderRadius:2 }} />
                      <div className="corner-br" style={{ position:"absolute", bottom:14, right:14, width:13, height:13, borderRadius:2 }} />
                      <div style={{ background:`linear-gradient(135deg,${accent.from},${accent.to})`, WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent", fontSize:"2.6rem", fontWeight:900, lineHeight:1, letterSpacing:"-2px", marginBottom:8 }}>{step.step}</div>
                      <div style={{ fontSize:"1.4rem", marginBottom:12, color:index%2===0?"#f97316":"#10b981" }}>{step.icon}</div>
                      <p style={{ fontSize:"0.88rem", lineHeight:1.65, fontWeight:400 }} className={isDark?"text-gray-300":"text-gray-600"}>{step.text}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* GOAL INPUT */}
            <motion.div variants={itemVariants} className="mb-12">
              <div style={{ marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"0.78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.13em" }} className={isDark?"text-gray-400":"text-gray-500"}>Your Goal</span>
                {goal && <span style={{ fontSize:"0.76rem", fontWeight:500 }} className={isDark?"text-gray-500":"text-gray-400"}>{goal.length} characters</span>}
              </div>
              <div style={{ borderRadius:16, padding:2, background:goal?"linear-gradient(135deg,rgba(249,115,22,0.45),rgba(16,185,129,0.45))":isDark?"rgba(255,255,255,0.07)":"rgba(249,115,22,0.15)" }}>
                <div style={{ borderRadius:14, position:"relative", background:isDark?"rgba(10,14,25,0.97)":"rgba(255,255,255,0.95)", display:"flex", alignItems:"center" }}>
                  <input
                    id="goal-input" type="text" value={goal}
                    onChange={e => setGoal(e.target.value)}
                    placeholder="E.g., Develop a risk mitigation plan for the project..."
                    disabled={isLoading}
                    className="goal-input"
                    onKeyDown={e => { if(e.key==="Enter") handleSpecifyGoal(); }}
                    style={{ flex:1, borderRadius:14, padding:"18px 24px", border:"none", outline:"none", fontSize:"0.95rem", fontWeight:400, background:"transparent", color:isDark?"#e2e8f0":"#1a202c", fontFamily:"'Times New Roman',Times,serif" }}
                  />
                  <AnimatePresence>
                    {goal && (
                      <motion.button initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }} whileHover={{ scale:1.15 }} whileTap={{ scale:0.9 }} onClick={handleClear}
                        style={{ marginRight:16, padding:"6px 10px", borderRadius:999, cursor:"pointer", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444", display:"flex", alignItems:"center", gap:5, fontSize:"0.76rem", fontWeight:700, flexShrink:0 }}>
                        <FaTimes style={{ fontSize:"0.7rem" }} /> Clear
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div style={{ marginTop:20, display:"flex", justifyContent:"center" }}>
                <motion.button
                  whileHover={{ scale:1.06, boxShadow:"0 12px 36px rgba(249,115,22,0.38)" }}
                  whileTap={{ scale:0.95 }}
                  onClick={handleSpecifyGoal} disabled={isLoading}
                  className="grad-btn"
                  style={{ padding:"15px 48px", borderRadius:999, fontSize:"0.97rem", fontWeight:800, letterSpacing:"0.04em", display:"inline-flex", alignItems:"center", gap:10 }}
                >
                  {isLoading ? (
                    <>
                      <div style={{ position:"relative", width:20, height:20 }}>
                        <motion.div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid rgba(255,255,255,0.3)", borderTopColor:"#fff" }} animate={{ rotate:360 }} transition={{ duration:0.9, repeat:Infinity, ease:"linear" }} />
                      </div>
                      Processing...
                    </>
                  ) : (
                    <><FaBullseye style={{ fontSize:"0.9rem" }} /> &#10022; Specify Goal</>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* LOADING */}
            <AnimatePresence>
              {isLoading && (
                <motion.div className="flex flex-col items-center mb-10 gap-4" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                  <div style={{ position:"relative", width:52, height:52 }}>
                    <motion.div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid transparent", borderTopColor:"#f97316", borderRightColor:"#10b981" }} animate={{ rotate:360 }} transition={{ duration:0.9, repeat:Infinity, ease:"linear" }} />
                    <motion.div style={{ position:"absolute", inset:7, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#10b981", borderRightColor:"#f97316" }} animate={{ rotate:-360 }} transition={{ duration:1.4, repeat:Infinity, ease:"linear" }} />
                  </div>
                  <p style={{ fontSize:"0.85rem", fontWeight:600 }} className={isDark?"text-gray-400":"text-gray-500"}>Generating your plan...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ERROR */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="flex justify-center mb-10">
                  <div style={{ padding:"12px 28px", borderRadius:999, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", fontSize:"0.88rem", fontWeight:700, color:"#ef4444" }}>{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* RESPONSE TIMELINE */}
            <AnimatePresence>
              {response && response.procedure && response.approach && Array.isArray(response.steps) && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity:0 }} className="mb-14">
                  <div className="text-center mb-10">
                    <h2 style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-0.4px", marginBottom:6 }} className={isDark?"text-gray-100":"text-gray-800"}>Goal Specification Plan</h2>
                    <div className="ornament-line max-w-[120px] mx-auto">
                      <span style={{ fontSize:"0.9rem", color:"#10b981" }}>&#10022;</span>
                    </div>
                  </div>
                  <div style={{ padding:2, borderRadius:20, background:"linear-gradient(135deg,rgba(249,115,22,0.28),rgba(16,185,129,0.28))" }}>
                    <div style={{ borderRadius:18, padding:"36px 40px", background:isDark?"rgba(10,14,25,0.97)":"rgba(255,255,255,0.92)", backdropFilter:"blur(14px)", position:"relative" }}>
                      <div className="timeline-connector" />

                      {/* Procedure */}
                      <motion.div variants={itemVariants} style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:36 }}>
                        <div style={{ flexShrink:0, width:40, height:40, borderRadius:"50%", zIndex:1, background:"linear-gradient(135deg,#f97316,#fb923c)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 0 4px rgba(249,115,22,0.15)", fontSize:"0.78rem", fontWeight:900, color:"#fff" }}>01</div>
                        <div style={{ flex:1, padding:"18px 22px", borderRadius:14, background:isDark?"rgba(249,115,22,0.06)":"rgba(249,115,22,0.05)", border:`1px solid ${isDark?"rgba(249,115,22,0.18)":"rgba(249,115,22,0.15)"}` }}>
                          <p style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.13em", color:"#f97316", marginBottom:8 }}>Procedure</p>
                          <p style={{ fontSize:"0.93rem", lineHeight:1.75, fontWeight:400 }} className={isDark?"text-gray-300":"text-gray-700"}>{response.procedure}</p>
                        </div>
                      </motion.div>

                      {/* Approach */}
                      <motion.div variants={itemVariants} style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:36 }}>
                        <div style={{ flexShrink:0, width:40, height:40, borderRadius:"50%", zIndex:1, background:"linear-gradient(135deg,#10b981,#34d399)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 0 4px rgba(16,185,129,0.15)", fontSize:"0.78rem", fontWeight:900, color:"#fff" }}>02</div>
                        <div style={{ flex:1, padding:"18px 22px", borderRadius:14, background:isDark?"rgba(16,185,129,0.06)":"rgba(16,185,129,0.05)", border:`1px solid ${isDark?"rgba(16,185,129,0.18)":"rgba(16,185,129,0.15)"}` }}>
                          <p style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.13em", color:"#10b981", marginBottom:8 }}>Approach</p>
                          <p style={{ fontSize:"0.93rem", lineHeight:1.75, fontWeight:400 }} className={isDark?"text-gray-300":"text-gray-700"}>{response.approach}</p>
                        </div>
                      </motion.div>

                      {/* Steps */}
                      <motion.div variants={itemVariants} style={{ display:"flex", alignItems:"flex-start", gap:20 }}>
                        <div style={{ flexShrink:0, width:40, height:40, borderRadius:"50%", zIndex:1, background:"linear-gradient(135deg,#f97316,#10b981)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 0 4px rgba(249,115,22,0.12)", fontSize:"0.78rem", fontWeight:900, color:"#fff" }}>03</div>
                        <div style={{ flex:1, padding:"18px 22px", borderRadius:14, background:isDark?"rgba(255,255,255,0.04)":"rgba(249,115,22,0.03)", border:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(249,115,22,0.12)"}` }}>
                          <p style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.13em", color:"#f97316", marginBottom:14 }}>Action Steps</p>
                          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                            {response.steps.map((step, index) => (
                              <motion.div key={index}
                                initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                                transition={{ delay:index*0.08, type:"spring", stiffness:140 }}
                                style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 16px", borderRadius:10, background:isDark?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.7)", border:`1px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(249,115,22,0.1)"}` }}
                              >
                                <div style={{ flexShrink:0, width:24, height:24, borderRadius:"50%", background:"linear-gradient(135deg,#f97316,#10b981)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.65rem", fontWeight:900, color:"#fff", marginTop:1 }}>{index+1}</div>
                                <p style={{ fontSize:"0.9rem", lineHeight:1.65, fontWeight:400 }} className={isDark?"text-gray-300":"text-gray-700"}>{step}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FOOTER */}
            <motion.footer initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1 }}
              style={{ marginTop:48, paddingTop:28, textAlign:"center", borderTop:`1px solid ${isDark?"rgba(255,255,255,0.07)":"rgba(249,115,22,0.15)"}` }}>
              <div className="ornament-line max-w-xs mx-auto" style={{ marginBottom:14 }}>
                <span style={{ fontSize:"0.9rem", color:"#f97316" }}>&#10022;</span>
              </div>
              <p style={{ fontSize:"0.8rem", fontWeight:500, letterSpacing:"0.06em" }} className={isDark?"text-gray-500":"text-gray-400"}>
                Powered by <span className="grad-text" style={{ fontWeight:800 }}>Smart Report AI</span> | &copy; {new Date().getFullYear()} xAI
              </p>
            </motion.footer>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GoalSpecifyAgent;