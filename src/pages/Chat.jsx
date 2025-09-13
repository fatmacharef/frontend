import React, { useState } from "react";
import axios from "axios";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);

    try {
      // 🚀 Envoie vers ton backend Hugging Face
      const res = await axios.post(
        "https://fatmata-psybot-backende.hf.space/chat/",
        { text: message }
      );

      const botResponse = res.data.response;

      setChatHistory([
        ...chatHistory,
        { role: "user", text: message },
        { role: "bot", text: botResponse },
      ]);
      setMessage("");
    } catch (err) {
      console.error("Erreur API:", err);
      setChatHistory([
        ...chatHistory,
        { role: "user", text: message },
        { role: "bot", text: "⚠️ Erreur : impossible de contacter le serveur." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">💬 PsyBot Chat</h1>

      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-4">
        <div className="h-80 overflow-y-auto border p-2 mb-4 rounded">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`mb-2 ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <span
                className={`inline-block px-3 py-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {msg.text}
              </span>
            </div>
          ))}
          {loading && (
            <div className="text-gray-500 italic">Le bot écrit...</div>
          )}
        </div>

        <div className="flex">
          <input
            type="text"
            className="flex-1 border p-2 rounded-l"
            placeholder="Écris ton message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
            disabled={loading}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
