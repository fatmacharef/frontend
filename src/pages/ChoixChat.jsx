import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // adapte le chemin si nécessaire
import { doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // pour récupérer l'utilisateur connecté

import "./ChoixChat.css";

function ChoixChat() {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [cliniques, setCliniques] = useState([]);
  const navigate = useNavigate();

  // 🔽 Charger les cliniques depuis Firestore
  useEffect(() => {
    const fetchCliniques = async () => {
      const querySnapshot = await getDocs(collection(db, "cliniques"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCliniques(data);
    };
    fetchCliniques();
  }, []);

  const handleCliniqueSelect = async (clinique) => {
    setModalOpen(false);
    const auth = getAuth();
    const user = auth.currentUser;
  
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userDocRef, {
          cliniqueId: clinique.id,
          cliniqueNom: clinique.nom // (optionnel pour affichage futur)
        });
        navigate("/forum", { state: { clinique } });
      } catch (error) {
        console.error("Erreur en enregistrant la clinique :", error);
        alert("Erreur lors de l'enregistrement de la clinique.");
      }
    } else {
      alert("Utilisateur non connecté !");
    }
  };
  

  return (
    <div className="choixchat-page">
      <div className="choixchat-container">
        <h2 className="choixchat-title">{t("choix.titre")}</h2>

        <div className="choixchat-images">
          {/* PsyBot */}
<div
  className="choixchat-link"
  onClick={async () => {
    const user = getAuth().currentUser;
    if (user) await updateDoc(doc(db, "users", user.uid), { mode: "psybot" });
    navigate("/chat");
  }}
>            <div className="choixchat-img-container">
    <img src="../psybot.png" alt={t("choix.avecModel")} className="choixchat-img" />
    <div className="choixchat-description">
      {t("description.psybot")}
    </div>
  </div>
          </div>

          {/* Psychologue */}
<div
  className="choixchat-link"
  onClick={async () => {
    const user = getAuth().currentUser;
    if (user) await updateDoc(doc(db, "users", user.uid), { mode: "psychologue" });
    navigate("/profile");
  }}
>            <div className="choixchat-img-container">
              <img src="../psychologue.png" alt={t("choix.avecPsy")} className="choixchat-img" />
                                <div className="choixchat-description">{t("description.psychologue")}</div>

            </div>

          </div>

          {/* Clinique */}
          <div className="choixchat-link" onClick={() => setModalOpen(true)}>
            <div className="choixchat-img-container">
              <img src="../clinique.png" alt="Clinique" className="choixchat-img" />
                                <div className="choixchat-description">{t("description.clinique")}</div>

            </div>

          </div>
        </div>
      </div>

      {/* Modal Clinique */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{t("choisiser")}</h3>
            <ul className="clinique-list">
              {cliniques.map((clinique) => (
                <li key={clinique.id} onClick={() => handleCliniqueSelect(clinique)}>
                  <strong>{clinique.nom}</strong> – {clinique.localisation}<br />
                  <em>{t("specialite")}</em> {clinique.specialites.join(", ")}<br />
                  ⭐ {clinique.note}/5
                </li>
              ))}
            </ul>
            <button className="annuler" onClick={() => setModalOpen(false)}>{t("fermer")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChoixChat;
