import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { SendHorizonal } from "lucide-react";
import "./LiveChat.css";
import { useTranslation } from "react-i18next";


const LiveChat = () => {
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const { t } = useTranslation();


  // 🔐 Authentification Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.exists() ? userDocSnap.data() : {};
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            ...userData,
          });
        } catch (error) {
          console.error("Erreur de récupération des données utilisateur :", error);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const selectedPsychologueId = user?.selectedPsychologueId;

  // 🎧 Écouter les messages en temps réel
  const listenToMessages = (chatId) => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef);

    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const sorted = msgs.sort(
        (a, b) => a.timestamp?.seconds - b.timestamp?.seconds
      );

      setMessages(sorted);
    });
  };

  // 📦 Chargement du chat (existence ou création)
  useEffect(() => {
    if (!user || !selectedPsychologueId) return;

    const loadChat = async () => {
      try {
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "array-contains", user.uid));
        const querySnapshot = await getDocs(q);

        let existingChat = null;

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data.participants.includes(user.uid) &&
            data.participants.includes(selectedPsychologueId)
          ) {
            existingChat = { id: docSnap.id, ...data };
          }
        });

        if (existingChat) {
          setChatId(existingChat.id);
          listenToMessages(existingChat.id);
        } else {
          const newChatRef = doc(collection(db, "chats"));
          await setDoc(newChatRef, {
            participants: [user.uid, selectedPsychologueId],
            createdAt: serverTimestamp(),
          });
          setChatId(newChatRef.id);
          listenToMessages(newChatRef.id);
        }
      } catch (err) {
        console.error("Erreur lors du chargement du chat :", err);
      }
    };

    loadChat();
  }, [user, selectedPsychologueId]);

  // ✉️ Envoi du message
  const handleSend = async () => {
    if (!newMessage.trim() || !chatId || !user) return;

    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: user.uid,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
    }
  };

  // 🔃 Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="livechat-page">
      <div className="livechat-container">
      <div className="livechat-header">{t("chat_title")}</div>


        <div className="livechat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.senderId === user?.uid ? "user" : "psychologue"}`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="livechat-input">
          <input
            type="text"
            placeholder={t("input_placeholder")}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend}>
          <SendHorizonal size={20} title={t("send_button")} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;
 
