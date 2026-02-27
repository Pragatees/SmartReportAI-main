import React, { useState, useEffect, useRef } from "react";
import { FaInfoCircle, FaPaperPlane } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./sidebar";

const ChatbotAgent = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [domain, setDomain] = useState(() => localStorage.getItem("pdfDomain") || "");
  const [content, setContent] = useState(() => localStorage.getItem("pdfText") || "");
  const [insights] = useState(() => JSON.parse(localStorage.getItem("insights")) || []);
  const [suggestions] = useState(() => JSON.parse(localStorage.getItem("suggestions")) || []);
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem("chatMessages")) || []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatStarted, setChatStarted] = useState(() => localStorage.getItem("chatStarted") === "true");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleTheme = () => setTheme(t => (t === "light" ? "dark" : "light"));
  const toggleSidebar = () => setSidebarOpen(o => !o);

  // ==============================
  // START CHAT (Store Vector Data)
  // ==============================

  const handleStartChat = async () => {
    if (!content || !domain || !insights.length || !suggestions.length) {
      setError("Missing required data to initialize chat.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
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
          suggestions
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize vector database");
      }

      setChatStarted(true);
      localStorage.setItem("chatStarted", "true");

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ==============================
  // SEND MESSAGE
  // ==============================

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage = { text: input, sender: "user", timestamp };
    setMessages(prev => [...prev, userMessage]);

    const userInput = input;
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/query-vector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userInput,
          k: 5
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error("Invalid response format");
      }

      const botMessage = {
        text: data.response,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (err) {
      setError("Failed to get response from server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${theme === "light"
      ? "bg-gradient-to-br from-orange-50 to-emerald-50"
      : "bg-gradient-to-br from-gray-900 to-gray-800"
    }`}>

      <Sidebar
        theme={theme}
        toggleTheme={toggleTheme}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        handleClearData={() => {}}
        isLoading={isLoading}
      />

      <div className={`flex-1 ${sidebarOpen ? "ml-[280px]" : "ml-0"} p-8`}>

        <h1 className="text-3xl font-bold text-center gradient-text mb-6">
          Smart Report AI Chatbot
        </h1>

        {!chatStarted ? (
          <div className="text-center">
            <button
              onClick={handleStartChat}
              disabled={isLoading}
              className="px-6 py-3 gradient-button rounded-full"
            >
              {isLoading ? "Initializing..." : "Start Conversation"}
            </button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-[65vh] flex flex-col">

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <div key={index}
                  className={`max-w-[70%] p-4 rounded-2xl ${
                    msg.sender === "user"
                      ? "bg-orange-500 text-white ml-auto"
                      : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200 mr-auto"
                  }`}>
                  <div>{msg.text}</div>
                  <div className="text-xs mt-2 opacity-70 text-right">
                    {msg.timestamp}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your query..."
                className="flex-1 p-3 rounded-lg border"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="ml-3 p-3 gradient-button rounded-full"
              >
                <FaPaperPlane />
              </button>
            </form>

            {error && <p className="text-center text-red-500 p-2">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotAgent;