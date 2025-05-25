import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  addDoc,
  updateDoc,
  doc,
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Patient.css";
import { useTranslation } from "react-i18next";

function Profile() {
  const [userEmail, setUserEmail] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMode, setUserMode] = useState("");

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      setUserEmail(user.email);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserMode(snap.data().mode);
    });
    return unsub;
  }, []);

  const handleViewHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(
        collection(db, "chatHistory"),
        where("user_id", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const historyData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHistory(historyData);
      setShowHistory(true);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique :", error);
    }
  };

  const handleDeleteHistory = async () => {
    const confirmDelete = window.confirm(t("confirmDeleteHistory"));
    if (!confirmDelete) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(collection(db, "chatHistory"), where("user_id", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      setHistory([]);
      setShowHistory(false);
      alert(t("historyDeleted"));
    } catch (error) {
      console.error("Erreur lors de la suppression de l'historique :", error);
      alert(t("historyDeleteError") || "Une erreur est survenue.");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(t("confirmDeleteAccount"));
    if (confirmDelete) {
      try {
        await auth.currentUser.delete();
        alert(t("accountDeleted"));
        navigate("/");
      } catch (error) {
        alert(t("accountDeleteError"));
      }
    }
  };

  const userName = userEmail ? userEmail.split("@")[0] : t("guest");

  const handleViewPosts = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(
        collection(db, "communityPosts"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (posts.length === 0) {
        alert("📭 Vous n'avez publié aucun contenu.");
      } else {
        setPosts(posts);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des publications :", err);
      alert("❌ Une erreur est survenue lors de la récupération des publications.");
    }
  };

  const rootClass = userMode === "psybot"
    ? "profile-layout psybot"
    : "profile-layout psychologue";

return (
  userMode === "psybot" && (
      <div className="profile-layout">

        {/* Bouton hamburger (visible seulement si sidebar est fermée) */}
        {!sidebarOpen && (
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
        )}

        <div className="profil-containereq">
          {/* Sidebar */}
          <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="sidebar-header">
              <h2>👤 {t("profileTitlee")}</h2>

              {/* Bouton de fermeture visible dans le menu */}
              <button className="close-bttn" onClick={() => setSidebarOpen(false)}>
                ✖
              </button>
            </div>

            <div className="sidebar-menu">
              <button onClick={handleViewPosts}> {t("viewPosts")}</button>
              <button onClick={handleViewHistory}>{t("viewHistory")}</button>
              <button onClick={handleDeleteHistory}> {t("deleteHistory")}</button>
              <button onClick={handleDeleteAccount}> {t("deleteAccount")}</button>
            </div>
          </aside>

          {/* Contenu principal */}
          <main className="profile-centere">
            <h1>👤 {t("profileTitle")}</h1>
            <p><strong>{t("name")}</strong>: {userName}</p>

            <label><strong>{t("language")}</strong>:</label>
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="en">🇬🇧 English</option>
              <option value="ar">🇩🇿 العربية</option>
            </select>
          </main>

          {/* Modale historique */}
          {showHistory && (
            <div className="modall-overlay">
              <div className="modall-contente">
                <button onClick={() => setShowHistory(false)}>✖</button>
                <h2>{t("historyTitle")}</h2>
                <ul className="history-listt">
                  {history.map((item, index) => (
                    <li key={index}>
                      <strong>🧠 {item.user_input}</strong><br />
                      🤖 {item.bot_response}<br />
                      {item.emotion && <>💬 {t("emotion")}: {item.emotion}</>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

  )
);



}

export default Profile;
