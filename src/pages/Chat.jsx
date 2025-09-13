import { useState, useRef, useEffect } from "react";
import "./Chat.css";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Met ton URL Hugging Face Space ici
  const API_URL = "https://fatmata-psybot-backende.hf.space/chat/";

  const sendMessage = async () => {
    if (input.trim() === "" || loading) return;

    // Ajouter le message utilisateur dans l'affichage
    setMessages(prev => [...prev, { sender: "user", text: input }]);
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Réponse backend :", data);

      const botText = data.response || "⚠️ Pas de réponse du bot";

      setMessages(prev => [...prev, { sender: "bot", text: botText }]);

    } catch (error) {
      console.error("Erreur fetch backend :", error);
      setMessages(prev => [...prev, { sender: "bot", text: "⚠️ Erreur de connexion au backend" }]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-box">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.sender === "user" ? "user-message" : "bot-message"}`}
          >
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="input-box">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écris ton message..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? "…" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}

export default Chat;
