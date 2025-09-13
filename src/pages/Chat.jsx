import React, { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 👉 URL de ton backend FastAPI
  const API_URL = "https://fatmata-psybot-backende.hf.space/chat/";

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Ajouter le message utilisateur
    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const result = await response.json();

      // Ajouter la réponse du bot
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: result.response || "❌ Pas de réponse" },
      ]);
    } catch (error) {
      console.error("Erreur API :", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Erreur de connexion au backend" },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  return (
    <div style={{ width: "400px", margin: "0 auto", fontFamily: "Arial" }}>
      <h2 style={{ textAlign: "center" }}>💬 PsyBot</h2>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          height: "350px",
          overflowY: "auto",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.sender === "user" ? "right" : "left",
              margin: "8px 0",
            }}
          >
            <b>{msg.sender === "user" ? "Moi" : "PsyBot"}:</b>{" "}
            <span>{msg.text}</span>
          </div>
        ))}
        {loading && <div>⏳ PsyBot écrit...</div>}
      </div>

      <div style={{ marginTop: "10px", display: "flex" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Écris ton message..."
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            marginLeft: "8px",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#4CAF50",
            color: "white",
            cursor: "pointer",
          }}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
