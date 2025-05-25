import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, setDoc, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useTranslation } from "react-i18next";
import {  query, where, orderBy, onSnapshot } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";


import "./Forum.css";


function Forum() {
  const location = useLocation();
    const { t } = useTranslation();

  const navigate = useNavigate();
  const clinique = location.state?.clinique;

  const [cliniqueData, setCliniqueData] = useState(null);
  const [psychologues, setPsychologues] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPsy, setSelectedPsy] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [seancesRestantes, setSeancesRestantes] = useState(null);
  const [achatSeances, setAchatSeances] = useState(1);
  const [paiementEffectue, setPaiementEffectue] = useState(false);
  const [ccp, setCcp] = useState("");
  const [historique, setHistorique] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPsy, setChatPsy] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatEnabled, setChatEnabled] = useState(false);

  useEffect(() => {
    if (!clinique?.id) {
      navigate("/choixchat");
      return;
    }

    const fetchCliniqueData = async () => {
      try {
        const docRef = doc(db, "cliniques", clinique.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          navigate("/choixchat");
          return;
        }

        setCliniqueData({ id: docSnap.id, ...docSnap.data() });

        const psyRef = collection(docRef, "psychologues");
        const psySnap = await getDocs(psyRef);
        setPsychologues(psySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Erreur chargement clinique :", error);
        navigate("/choixchat");
      }
    };

    fetchCliniqueData();
  }, [clinique, navigate]);

  useEffect(() => {
    const fetchHistorique = async () => {
      const user = auth.currentUser;
      if (!user || !clinique?.id) return;

      try {
        const rdvsRef = collection(doc(db, "cliniques", clinique.id), "rdvs");
        const rdvsSnap = await getDocs(rdvsRef);
        const rdvs = rdvsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(rdv => rdv.utilisateur === user.uid);

        setHistorique(rdvs);
      } catch (error) {
        console.error("Erreur chargement historique :", error);
      }
    };

    fetchHistorique();
  }, [clinique]);

  const handleRdv = async (psy) => {
    const user = auth.currentUser;
    if (!user) return alert("Veuillez vous connecter.");

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      setSeancesRestantes(userSnap.exists() ? userSnap.data().seances || 0 : 0);
    } catch (error) {
      console.error("Erreur récupération séances :", error);
      setSeancesRestantes(0);
    }

    setSelectedPsy(psy);
    setSelectedDateTime("");
    setAchatSeances(1);
    setCcp("");
    setPaiementEffectue(false);
    setShowModal(true);
  };

  const confirmerRendezVous = async () => {
    const user = auth.currentUser;
    if (!user || !selectedDateTime) return alert("Connexion ou date invalide.");

    const dateObj = new Date(selectedDateTime);
    if (dateObj <= new Date()) return alert("Veuillez choisir une date future.");

    try {
      const userRef = doc(db, "users", user.uid);
      let nouvellesSeances = seancesRestantes;

      if (seancesRestantes > 0) {
        nouvellesSeances -= 1;
      } else {
        if (!paiementEffectue || !ccp || achatSeances <= 0) return alert("Paiement requis.");
        nouvellesSeances = achatSeances - 1;
      }

      await setDoc(userRef, { seances: nouvellesSeances }, { merge: true });

      const rdvData = {
        ccp: ccp || null,
        dateRdv: {
          annee: dateObj.getFullYear(),
          mois: dateObj.getMonth() + 1,
          jour: dateObj.getDate(),
          heure: dateObj.getHours(),
          minute: dateObj.getMinutes(),
        },
        psychologue: {
          id: selectedPsy.id,
          nom: selectedPsy.nom,
          specialite: selectedPsy.specialite,
        },
        utilisateur: user.uid,
        createdAt: new Date(),
        ...(paiementEffectue && achatSeances > 0 ? { nombreSeances: achatSeances } : {}),
        seancesRestantes: nouvellesSeances,
      };

      await addDoc(collection(doc(db, "cliniques", clinique.id), "rdvs"), rdvData);
      setSeancesRestantes(nouvellesSeances);
      setShowModal(false);
      alert("Rendez-vous confirmé !");
    } catch (error) {
      console.error("Erreur RDV :", error);
    }
  };

  const handleChat = async (psy) => {
    const user = auth.currentUser;
    if (!user || !clinique?.id) return;

    try {
      const rdvsRef = collection(doc(db, "cliniques", clinique.id), "rdvs");
      const rdvsSnap = await getDocs(rdvsRef);
      const now = new Date();

      const currentRdv = rdvsSnap.docs
        .map(doc => doc.data())
        .find(rdv =>
          rdv.utilisateur === user.uid &&
          rdv.psychologue.id === psy.id &&
          new Date(
            rdv.dateRdv.annee,
            rdv.dateRdv.mois - 1,
            rdv.dateRdv.jour,
            rdv.dateRdv.heure,
            rdv.dateRdv.minute
          ) <= now &&
          now - new Date(
            rdv.dateRdv.annee,
            rdv.dateRdv.mois - 1,
            rdv.dateRdv.jour,
            rdv.dateRdv.heure,
            rdv.dateRdv.minute
          ) <= 30 * 60 * 1000
        );

      setChatEnabled(!!currentRdv);
      setChatPsy(psy);
      setChatOpen(true);

      const messagesRef = collection(db, "messages", `${user.uid}_${psy.id}`, "messages");
      const messagesSnap = await getDocs(messagesRef);
      const msgs = messagesSnap.docs.map(doc => doc.data()).sort((a, b) => a.timestamp - b.timestamp);
      setMessages(msgs);
    } catch (error) {
      console.error("Erreur chargement chat :", error);
    }
  };
 useEffect(() => {
  const unsubscribeAuth = auth.onAuthStateChanged((user) => {
    if (user && chatPsy) {
      const q = query(
        collection(db, "messages"),
        where("userId", "==", user.uid),
        where("psyId", "==", chatPsy.id),
        orderBy("timestamp")
      );

      const unsubscribeMessages = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
      });

      return () => {
        unsubscribeMessages();
      };
    }
  });

  return () => unsubscribeAuth();
}, [chatPsy]);

const sendMessage = async () => {
  if (!newMessage.trim() || !chatPsy) return;

  const user = auth.currentUser;
  if (!user) return;

  const messageData = {
    sender: "user",
    content: newMessage.trim(),
    timestamp: serverTimestamp(),
    psyId: chatPsy.id,
    userId: user.uid,
  };

  try {
    await addDoc(collection(db, "messages"), messageData);
    setNewMessage("");
  } catch (error) {
    console.error("Erreur envoi message :", error);
  }
};

 

  const handlePsybot = () => {
    navigate("/chatbot", { state: { service: "psybot",clinique:clinique.id } });
  };

  if (!cliniqueData) return <div>Chargement...</div>;

  return (
    <div className="forum-container">
      {/* Gauche */}
      <div className="forum-left">
        <h3>{t("psychologue")}</h3>
        {psychologues.length === 0 ? (
          <p>{t("aucun")}</p>
        ) : (
          psychologues.map((psy) => (
            <div key={psy.id} className="psy-card">
              <h4>{psy.nom}</h4>
              <p><strong>{t("specialite")}</strong> {psy.specialite}</p>
              <p>{psy.cv}</p>
              <button onClick={() => handleRdv(psy)}>{t("prend Rendez-vous")}</button>
              <button onClick={() => handleChat(psy)}>{t("chate")}</button>
            </div>
          ))
        )}
      </div>

      {/* Centre */}
      <div className="forum-center">
        <h2>{cliniqueData.nom}</h2>
        <p><strong> {t("localisation")} :</strong> {cliniqueData.localisation}</p>
        <p><strong>{t("specialite")} </strong> {Array.isArray(cliniqueData.specialites) ? cliniqueData.specialites.join(", ") : cliniqueData.specialites}</p>

        <div className="psybot-section">
          <h3>{t("psybot")}</h3>
          <p>{t("des")}</p>
          <button onClick={handlePsybot}>{t("demar")}</button>
        </div>
      </div>

      {/* Droite */}
      <div className="forum-right">
        <h3> {t("historique")}</h3>
        <ul>
          {historique.length === 0 ? (
            <li>{t("aucunn")}</li>
          ) : (
            historique.map((item, idx) => (
              <li key={idx}>
                {item.dateRdv.jour}/{item.dateRdv.mois}/{item.dateRdv.annee} -{" "}
                {item.psychologue.nom} - {t("numberOfSessions")} : {item.seancesRestantes}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Modal RDV */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Prendre rendez-vous avec {selectedPsy.nom}</h3>
            <label>{t("selectDate")}:</label>
            <input type="datetime-local" value={selectedDateTime} onChange={(e) => setSelectedDateTime(e.target.value)} />
            {seancesRestantes === 0 && (
              <>
                <label>{t("numberOfSessions")}:</label>
                <input type="number" min="1" value={achatSeances} onChange={(e) => setAchatSeances(parseInt(e.target.value))} />
                <label>CCP :</label>
                <input type="text" value={ccp} onChange={(e) => setCcp(e.target.value)} />
                <label><input type="checkbox" checked={paiementEffectue} onChange={(e) => setPaiementEffectue(e.target.checked)} /> Paiement effectué</label>
              </>
            )}
            <button onClick={confirmerRendezVous}>{t("confirmAppointment")}</button>
            <button onClick={() => setShowModal(false)}>{t("Annuler")}</button>
          </div>
        </div>
      )}

      {/* Chat */}
      {chatOpen && (
  <div className="chat-overlay">
    <div className="chat-box">
      <h3>Chat avec {chatPsy?.nom}</h3>
      <div className="messages">
        {messages
          // On filtre pour ne garder que les messages de cette conversation
          .filter(msg => msg.psyId === chatPsy.id && msg.userId === auth.currentUser.uid)
          .map((msg, index) => (
            <div
              key={index}
              className={msg.sender === "user" ? "msg-sent" : "msg-received"}
            >
              {msg.content}
            </div>
          ))
        }
      </div>
      {chatEnabled ? (
        <div className="chat-input">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
          />
          <button onClick={sendMessage}>Envoyer</button>
        </div>
      ) : (
        <p className="chat-warning">{t("chatt")}</p>
      )}
      <button onClick={() => setChatOpen(false)}>{t("fermer")}</button>
    </div>
  </div>
)}

    </div>
  );
}

export default Forum;
