import { useState, useRef, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "./Chat.css";
import { useTranslation } from "react-i18next";
import { SendHorizonal } from "lucide-react";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const chatEndRef = useRef(null);
  const { t } = useTranslation();
  const [selectedSteps, setSelectedSteps] = useState(null);
  const [published, setPublished] = useState(false);

  // ✅ URL correcte pour Hugging Face Space
  const API_URL = "https://fatmata-psybot-backende.hf.space/run/predict";

  useEffect(() => {
    const mode = localStorage.getItem("theme") || "light";
    document.body.classList.remove("light-mode", "dark-mode");
    document.body.classList.add(`${mode}-mode`);
  }, []);

  const sendMessage = async () => {
    if (input.trim() === "" || loading) return;

    setLoading(true);
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const loadingMsg = { text: "...", sender: "bot", temp: true };
    setMessages((prev) => [...prev, loadingMsg]);

    try {
     const response = await fetch("https://fatmata-psybot-backende.hf.space/api/predict/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ data: [userMessage] }),
});

      const result = await response.json();
      console.log("Réponse brute backend:", result);

      // ✅ Hugging Face Gradio renvoie { data: ["texte"] }
      const botMessage = {
        text: result.data?.[0] || "Erreur : pas de réponse",
        sender: "bot",
        responseType: "gpt", // tu peux ajuster si besoin
        steps: [],
      };

      setMessages((prev) => {
        const updated = [...prev];
        const tempIndex = updated.findIndex((msg) => msg.temp);
        if (tempIndex !== -1) updated[tempIndex] = botMessage;
        return updated;
      });

      // 🔹 Enregistrement dans Firebase
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        await addDoc(collection(db, "chatHistory"), {
          user_id: anonymous ? "anonyme" : user ? user.uid : "anonyme",
          user_input: input,
          bot_response: botMessage.text,
          query_type: botMessage.responseType,
          steps: botMessage.steps,
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

  const steps = [
    { label: "Intention", key: 1 },
    { label: "Recherche", key: 2 },
    { label: "Émotion", key: 3 },
    { label: "Message fix", key: 4 },
    { label: "GPT", key: 5 },
  ];

  const isStepActive = (responseType, stepKey) => {
    if (responseType === "recherche") return stepKey === 1 || stepKey === 2;
    if (responseType === "non acceptable") return stepKey >= 1 && stepKey <= 4;
    if (responseType === "gpt") return stepKey === 1 || stepKey === 3 || stepKey === 5;
    return false;
  };

  return (
    <div className="chat-container">
      {messages.length === 0 && <h1 className="chat-title">{t("chat.title")}</h1>}

      <div className="chatt-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.sender === "bot" ? (
              <>
                <div className="bot-message-container">
                  <img
                    src={msg.responseType === "gpt" ? "/gpt.png" : "/recherche.png"}
                    alt="icon"
                    className="icon-image"
                    style={{ width: "30px", height: "30px" }}
                  />
                  <div className="step-bubbles">
                    {steps.map((step, i) => (
                      <div
                        key={i}
                        className={`step-bubble ${
                          isStepActive(msg.responseType, step.key) ? "active" : ""
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="bot-response-text">{msg.text}</div>
              </>
            ) : (
              <span>{msg.text}</span>
            )}
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      <div className={`inpput-container ${messages.length > 0 ? "bottom" : "center"}`}>
        <input
          type="text"
          placeholder={t("chat.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading} className="envoyer-button">
          <SendHorizonal size={20} title={t("send_button")} />
        </button>
      </div>
    </div>
  );
}

export default Chat;

