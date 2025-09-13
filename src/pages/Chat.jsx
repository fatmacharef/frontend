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
  const [anonymous, setAnonymous] = useState(false); // ✅ État pour publier anonymement
  const chatEndRef = useRef(null);
  const { t } = useTranslation();
  const [selectedSteps, setSelectedSteps] = useState(null);
  const [published, setPublished] = useState(false);


const API_URL = "https://fatmata-psybot-backende.hf.space/chat/";

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
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: input }),
      });

      const data = await response.json();
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

      try {
        const auth = getAuth();
        const user = auth.currentUser;

        await addDoc(collection(db, "chatHistory"), {
          user_id: anonymous ? "anonyme" : user ? user.uid : "anonyme", // ✅ Ici on vérifie l’état
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
          updated[tempIndex] = {
            text: `❌ ${t("chat.error")}`,
            sender: "bot",
          };
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
  { label: "Intentient", key: 1 },
  { label: "Recherche", key: 2 },
  { label: "Émotion", key: 3 },
  { label: "Message fix", key: 4 },
  { label: "GPT", key: 5 },
];

// Fonction pour déterminer si un step est actif selon responseType
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
      

      <>
      {msg.sender === "bot" ? (
  <>
    <div className="bot-message-container">
      {/* 🧠 Icône à gauche */}
      <img
        src={msg.responseType === "gpt" ? "/gpt.png" : "/recherche.png"}
        alt="icon"
        className="icon-image"
        style={{ width: "30px", height: "30px" }}
      />

      {/* ⚪⚪🟢 Étapes au centre */}
      <div className="step-bubbles">
  {steps.map((step, i) => (
    <div
      key={i}
      className={`step-bubble ${isStepActive(msg.responseType, step.key) ? "active" : ""}`}
    ></div>
  ))}
</div>


      {/* 👁 Bouton détail étapes */}
      {msg.steps?.length > 0 && (
        <button
          className="steps-toggle"
          onClick={() => setSelectedSteps(msg)}
        >
          {t("chat.showSteps")}
        </button>
      )}

      {/* 📨 Bouton publier (affiché une seule fois) */}
      {!published &&
        
        msg.responseType === "gpt" && (
          <button
            className="publish-button"
            onClick={async () => {
              const auth = getAuth();
              const user = auth.currentUser;
              const userMessage = messages.findLast((m) => m.sender === "user");

              try {
                await addDoc(collection(db, "communityPosts"), {
                  user_id: "anonyme",
                  userId: currentUserId, // 🔴 ajoute cette ligne

                  user_input: userMessage.text,
                  bot_response: msg.text,
                  timestamp: new Date(),
                });
                alert("✅ Publié dans le fil communautaire !");
                setPublished(true);
              } catch (err) {
                console.error("Erreur publication :", err);
                alert("❌ Erreur lors de la publication");
              }
            }}
          >
            {t("chat.publishAnonymous")}
          </button>
        )}
    </div>

    {/* Réponse texte en dessous */}
    <div className="bot-response-text">{msg.text}</div>
  </>
) : (
  <span>{msg.text}</span>
)}

      </>
    </div>
  ))}

  


  <div ref={chatEndRef} />



        {selectedSteps && (
          <div className="steps-modal">
            <div className="steps-modal-header">
              <h3>{t("detail")}</h3>
              <button onClick={() => setSelectedSteps(null)}>✖</button>
            </div>
            <div className="steps-modal-body">
              {[
                { label: "Intention", active: true },
                { label: "Recherche", active: selectedSteps.responseType === "recherche" },
                { label: "Émotion", active: selectedSteps.responseType === "non acceptable" || selectedSteps.responseType === "gpt" },
                { label: "Message fix", active: selectedSteps.responseType === "non acceptable" },
                { label: "GPT", active: selectedSteps.responseType === "gpt" },
              ].map((step, i) => (
                <div
                  key={i}
                  className={`step-item ${step.active ? "step-done" : "step-pending"}`}
                >
                  {step.active ? "✔" : "•"} {step.label}
                </div>
              ))}
              <div className="steps-raw">
                <h4>{t("detaill")}</h4>
                <ul>
                  {selectedSteps.steps?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div> 
        )}
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
        
        <button onClick={sendMessage}disabled={loading}
          className="envoyer-button">
                  <SendHorizonal size={20} title={t("send_button")} />
                  </button>
      </div>

      
    </div>
  );
}

export default Chat;


