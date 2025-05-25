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
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { useTranslation } from "react-i18next";
import { getDoc } from "firebase/firestore";


function Profile() {
  const [userEmail, setUserEmail] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [psychologues, setPsychologues] = useState([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedPsyId, setSelectedPsyId] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [ccpNumber, setCcpNumber] = useState("");
  const [remainingSessions, setRemainingSessions] = useState(0); // Nouveau état pour suivre le nombre de séances restantes
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const sessionPrice = 500; // en DA
  const totalPrice = sessionCount * sessionPrice;
  const [appointments, setAppointments] = useState([]);
  const [posts, setPosts] = useState([]);
const [isModalOpen, setIsModalOpen] = useState(false);
const [isRightMenuOpen, setIsRightMenuOpen] = useState(false);
const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
const [activeSection, setActiveSection] = useState("profile"); // default center content
const [isMenuOpen, setIsMenuOpen] = useState(false); // toggle menu



const [userMode, setUserMode] = useState("");   // nouveau
const rootClass = userMode === "psybot"
  ? "profile-layout psybot"      // thème bot
  : "profile-layout psychologue";// thème existant (inchangé)
useEffect(() => {
  const unsub = auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    setUserEmail(user.email);

    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) setUserMode(snap.data().mode);   // "psybot" | "psychologue"
  });
  return unsub;
}, []);

 
  
  
  const handleLiveChat = async () => {
    const user = auth.currentUser;
    if (!user) return;
  
    try {
      const now = new Date();
      const appointmentsRef = collection(db, "appointments");
      const q = query(
        appointmentsRef,
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
      const isNow = (dateStr) => {
        const appointmentDate = new Date(dateStr);
        const timeDiff = Math.abs(now - appointmentDate);
        return timeDiff < 30 * 60 * 1000; // 30 minutes de marge
      };
  
      const validAppointment = appointments.find(app => isNow(app.dateTime));
  
      if (validAppointment) {
        navigate("/livechat");
      } else {
        alert("⏰ Vous n'avez pas de séance actuellement.");
      }
    } catch (err) {
      console.error("Erreur lors de la vérification des rendez-vous :", err);
      alert("❌ Une erreur est survenue lors de la vérification.");
    }
  };
  

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const fetchAppointments = async () => {
      const user = auth.currentUser;
      if (!user) return;
  
      try {
        // Récupérer les rendez-vous de l'utilisateur
        const q = query(
          collection(db, "appointments"),
          where("userId", "==", user.uid),
          orderBy("dateTime", "desc")
        );
        const snapshot = await getDocs(q);
        const appointments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
        // Extraire les IDs des psychologues à partir des rendez-vous
        const psychologueIds = appointments.map(appt => appt.psychologueId);
  
        // Récupérer TOUS les utilisateurs de rôle "psycho"
        const psychologuesQuery = query(
          collection(db, "users"),
          where("role", "==", "psycho")
        );
        const psychologuesSnapshot = await getDocs(psychologuesQuery);
  
        // Créer un dictionnaire {id: email}
        const psychologuesMap = {};
        psychologuesSnapshot.docs.forEach(doc => {
          if (psychologueIds.includes(doc.id)) {
            psychologuesMap[doc.id] = doc.data().email;
          }
        });
  
        // Ajouter le nom du psychologue à chaque rendez-vous
        const appointmentsWithPsychologueName = appointments.map(appt => {
          const email = psychologuesMap[appt.psychologueId];
          return {
            ...appt,
            psychologueName: email ? email.split('@')[0] : "Inconnu",
          };
        });
  
        setAppointments(appointmentsWithPsychologueName);
      } catch (error) {
        console.error("Erreur récupération rendez-vous :", error);
      }
    };
  
    fetchAppointments();
  }, [userEmail]);
  
  

  useEffect(() => {
    const fetchPsychologues = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "psycho"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPsychologues(list);
      } catch (error) {
        console.error("Erreur chargement psychologues :", error);
      }
    };
    fetchPsychologues();
  }, []);

  const handleConfirmAppointment = async () => {
    const user = auth.currentUser;
    if (!user || !selectedPsyId || !selectedDateTime) return;

    if (remainingSessions <= 0) {
      alert("❌ Vous n’avez plus de séances disponibles. Veuillez effectuer un paiement.");
      return;
    }
    

    const selectedDate = new Date(selectedDateTime);
    const day = selectedDate.getDay();
    const hour = selectedDate.getHours();

    if (day === 5 || day === 6 || hour < 8 || hour >= 23) {
      alert("⛔ Le psychologue travaille du Dimanche au Jeudi entre 08:00 et 18:00.");
      return;
    }

    try {
      await addDoc(collection(db, "appointments"), {
        userId: user.uid,
        psychologueId: selectedPsyId,
        dateTime: selectedDateTime,
        sessionCount,
        ccpNumber,
      });
      

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        selectedPsychologueId: selectedPsyId,
        appointmentDateTime: selectedDateTime,
      });

      setRemainingSessions(remainingSessions - 1); // Décrémenter le nombre de séances restantes
      alert("✅ Rendez-vous confirmé !");
      setShowAppointmentModal(false);
      setSelectedPsyId(null);
      setSelectedDateTime("");
      setSessionCount(1);
    } catch (err) {
      console.error("Erreur prise de rendez-vous :", err);
      alert("❌ Une erreur est survenue.");
    }
  };

  const handlePayment = () => {
    if (!ccpNumber.trim()) {
      alert("❗ Veuillez entrer un numéro CCP.");
      return;
    }

    setIsPaymentDone(true);
    setRemainingSessions(sessionCount); // Une fois le paiement effectué, le nombre de séances est égal au nombre de sessions choisies
    alert("✅ Paiement accepté ! Vous pouvez maintenant prendre vos rendez-vous.");
  };

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
        setPosts(posts); // Mettre à jour les posts dans l'état
        setIsModalOpen(true); // Ouvrir la fenêtre modale
      }
    } catch (err) {
      console.error("Erreur lors du chargement des publications :", err);
      alert("❌ Une erreur est survenue lors de la récupération des publications.");
    }
  };
  
  
  
  

  return (
 <div className={rootClass}>
  <div className="profile-layoute">
    
    {/* MENU BURGER */}
   

    {/* MENU LATERAL DROIT */}
    {/* BOUTON BURGER */}
{!isMenuOpen && (
  <button className="burger-button" onClick={() => setIsMenuOpen(true)}>
    ≡
  </button>
)}

{/* MENU LATERAL DROIT */}
<aside className={`sidebars-menus ${isMenuOpen ? "open" : ""}`}>
  <span className="close-buttonn" onClick={() => setIsMenuOpen(false)}>✖</span>

  <button onClick={() => setActiveSection("profile")}>👤 {t("Mon Profil")}</button>

  {userMode === "psychologue" && (
    <>
      <button onClick={() => setActiveSection("posts")}>{t("viewPosts")}</button>
      <button onClick={() => setActiveSection("appointments")}>{t("Rendez-vous")}</button>
      <button onClick={() => setShowAppointmentModal(true)}>{t("prend Rendez-vous")}</button>
      <button onClick={handleLiveChat}>{t("goToLiveChat")}</button>
    </>
  )}

  <button onClick={handleDeleteAccount}>{t("deleteAccount")}</button>
</aside>


    {/* CONTENU CENTRAL */}
    <main className="profile-centers">
      {activeSection === "profile" && (
        <>
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

          {/* Paiement */}
          {userMode === "psychologue" && (
            <div className="payment-section">
              <label>{t("numberOfSessions")}</label>
              <select
                value={sessionCount}
                onChange={(e) => setSessionCount(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <p><strong>{t("totalPrice")}:</strong> {totalPrice} DA</p>

              <label>{t("CCP")}</label>
              <input
                type="text"
                value={ccpNumber}
                onChange={(e) => setCcpNumber(e.target.value)}
                placeholder="Ex: 12345678"
              />
              <button onClick={handlePayment}>💳 {t("payNow")}</button>
            </div>
          )}
        </>
      )}

      {/* Section Historique */}
      {activeSection === "history" && userMode === "psybot" && (
        <div className="history-list">
          <h2>{t("historyTitle")}</h2>
          <ul>
            {history.map((item, index) => (
              <li key={index}>
                <strong>🧠 {item.user_input}</strong><br />
                🤖 {item.bot_response}<br />
                {item.emotion && <>💬 {t("emotion")}: {item.emotion}</>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section Publications */}
      {activeSection === "posts" && userMode === "psychologue" && (
        <div className="post-list">
          <h2>📝 Vos publications</h2>
          {posts.length === 0 ? (
            <p>Aucune publication trouvée.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="post-item">
                <p><strong>🧍 Vous :</strong> {post.user_input || "—"}</p>
                <p><strong>🤖 Bot :</strong> {post.bot_response || <em>Aucune réponse</em>}</p>
                <p><small>📅 {post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : "Date inconnue"}</small></p>
                <hr />
              </div>
            ))
          )}
        </div>
      )}

      {/* Section Rendez-vous */}
      {activeSection === "appointments" && userMode === "psychologue" && (
        <div className="appointments-list">
          <h2>{t("Rendez-vous")}</h2>
          {appointments.length > 0 ? (
            <ul>
              {appointments.map((appt) => (
                <li key={appt.id}>
                  🕒 <strong>{new Date(appt.dateTime).toLocaleString()}</strong><br />
                  👤 {t("Psychologue")}: {appt.psychologueName}<br />
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("noAppointments")}</p>
          )}
        </div>
      )}

      {/* Modal pour choisir psychologue */}
      {showAppointmentModal && (
        <div className="modall-overlay">
          <div className="modall-contentes">
            <button onClick={() => setShowAppointmentModal(false)}>✖</button>
            <h2>{t("choosePsychologist")}</h2>
            <div className="psy-list">
              {psychologues.map((psy) => (
                <div key={psy.id} className="psy-card">
                  <p>{psy.email}</p>
                  <button onClick={() => setSelectedPsyId(psy.id)}>✅ {t("select")}</button>
                </div>
              ))}
            </div>

            {selectedPsyId && (
              <>
                <label>{t("selectDate")}</label>
                <input
                  type="datetime-local"
                  value={selectedDateTime}
                  onChange={(e) => setSelectedDateTime(e.target.value)}
                />
                <p><strong>{t("remainingSessions")}:</strong> {remainingSessions}</p>
                <p><strong>{t("totalPrice")}:</strong> {totalPrice} DA</p>
                <button onClick={handleConfirmAppointment}> {t("confirmAppointment")}</button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  </div>
</div>

  );
}

export default Profile;
