import { useState, useRef, useEffect } from "react";
import "./Chat.css";
import { useTranslation } from "react-i18next";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const { t } = useTranslation();

  const API_URL = "https://psybot-backend-zcd4.onrender.com/chat/";

  // === GESTION DU MODE SOMBRE / CLAIR ===
  useEffect(() => {
    const mode = localStorage.getItem("theme") || "light"; // par défaut: light
    document.body.classList.remove("light-mode", "dark-mode");
    document.body.classList.add(`${mode}-mode`);
  }, []);

  const sendMessage = async () => {
    if (input.trim() === "" || loading) return;

    setLoading(true);
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: input }),
      });
      const data = await response.json();
      const botResponse = { text: data.response, sender: "bot" };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      setMessages((prev) => [...prev, { text: `❌ ${t("chat.error")}`, sender: "bot" }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">
      {messages.length === 0 && <h1 className="chat-title">{t("chat.title")}</h1>}

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className={`input-container ${messages.length > 0 ? "bottom" : "center"}`}>
        <input
          type="text"
          placeholder={t("chat.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="envoyer-button"
        >
          {loading ? "..." : t("chat.send")}
        </button>
      </div>
    </div>
  );
}

export default Chat;
