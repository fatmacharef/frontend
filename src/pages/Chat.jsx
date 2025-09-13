import { useState, useRef, useEffect } from "react";
import "./Chat.css";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // 👉 Met l'URL de ton Hugging Face Space ici
  const API_URL = "https://fatmata-psybot-backende.hf.space/run/predict";

 const sendMessage = async () => {
  if (input.trim() === "" || loading) return;

  setLoading(true);
  const userMessage = { text: input, sender: "user" };
  setMessages((prev) => [...prev, userMessage]);
  setInput("");

  const loadingMsg = { text: "...", sender: "bot", temp: true };
  setMessages((prev) => [...prev, loadingMsg]);

  try {
    const response = await fetch("https://fatmata-psybot-backende.hf.space/run/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [input] }),   // ✅ format attendu par Gradio
    });

    const result = await response.json();
    const data = result.data[0]; // ✅ Gradio renvoie dans data[0]

    const botMessage = {
      text: data.response,
      sender: "bot",
      responseType: data.response_type,
      steps: data.steps || []
    };

    setMessages((prev) => {
      const updated = [...prev];
      const tempIndex = updated.findIndex((msg) => msg.temp);
      if (tempIndex !== -1) updated[tempIndex] = botMessage;
      return updated;
    });

    // ✅ Sauvegarde Firebase
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      await addDoc(collection(db, "chatHistory"), {
        user_id: anonymous ? "anonyme" : user ? user.uid : "anonyme",
        user_input: input,
        bot_response: data.response,
        query_type: data.response_type,
        emotion: data.emotions || null,
        steps: data.steps || [],
        timestamp: new Date(),
      });
    } catch (firebaseError) {
      console.error("Erreur Firebase :", firebaseError);
    }

  } catch (error) {
    console.error("Erreur fetch backend :", error);
    setMessages((prev) => {
      const updated = [...prev];
      const tempIndex = updated.findIndex((msg) => msg.temp);
      if (tempIndex !== -1) {
        updated[tempIndex] = { text: `❌ ${t("chat.error")}`, sender: "bot" };
      }
      return updated;
    });
  } finally {
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
            className={`message ${
              msg.sender === "user" ? "user-message" : "bot-message"
            }`}
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

