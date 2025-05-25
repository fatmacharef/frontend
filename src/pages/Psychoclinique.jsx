import React, { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./Psychoclinique.css";
import { deleteDoc, updateDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";


const PsychologueClinique = () => {
  const [psyInfo, setPsyInfo] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [rdvs, setRdvs] = useState([]);
  const [nomClinique, setNomClinique] = useState("");
  const { t } = useTranslation();



  // Récupérer les infos du psy connecté
  useEffect(() => {
    const fetchPsychologueData = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const idPsychologue = currentUser.uid;

  try {
    // 1. Lire le document user pour connaître idClinique
    const userRef  = doc(db, "users", idPsychologue);
    const userSnap = await getDoc(userRef);
    const idClinique = userSnap.data()?.idClinique;
    if (!idClinique) return;

    // 2. Lire le psychologue dans cliniques/{idClinique}/psychologues/{idPsychologue}
    const psyRef  = doc(db, "cliniques", idClinique, "psychologues", idPsychologue);
    const psySnap = await getDoc(psyRef);
    if (psySnap.exists()) setPsyInfo(psySnap.data());

    // 3. Lire le nom de la clinique (cliniques/{idClinique})
    const cliniqueRef  = doc(db, "cliniques", idClinique);
    const cliniqueSnap = await getDoc(cliniqueRef);
    if (cliniqueSnap.exists()) {
      setNomClinique(cliniqueSnap.data().nom || "");
    }
  } catch (err) {
    console.error("Erreur chargement psy/clinique :", err);
  }
};


    fetchPsychologueData();
  }, []);

  // Charger les patients depuis les messages
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return;
      const psyId = currentUser.uid;

      const loadPatients = async () => {
        try {
          const q = query(collection(db, "messages"), where("psyId", "==", psyId));
          const snap = await getDocs(q);
          const userIds = new Set();

          snap.forEach((doc) => userIds.add(doc.data().userId));

          const temp = [];
          for (let id of userIds) {
            const userRef = doc(db, "users", id);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const email = userSnap.data().email || "";
              const name = email.split("@")[0]; // nom à partir de l'email
              temp.push({ id, name });
            }
          }
          setPatients(temp);
        } catch (error) {
          console.error("Erreur chargement patients :", error);
        }
      };

      loadPatients();
    });

    return () => unsubscribe();
  }, []);

  // Charger les messages d’un patient sélectionné, triés par timestamp ascendant (plus ancien d'abord)
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedPatient) {
        setMessages([]);
        return;
      }
      try {
        const q = query(
          collection(db, "messages"),
          where("psyId", "==", auth.currentUser.uid),
          where("userId", "==", selectedPatient.id)
        );
        const snap = await getDocs(q);
        const fetchedMessages = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            // Assure que les messages sans timestamp sont affichés à la fin
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return a.timestamp.seconds - b.timestamp.seconds;
          });
        setMessages(fetchedMessages);
      } catch (error) {
        console.error("Erreur messages patient :", error);
      }
    };

    fetchMessages();
  }, [selectedPatient]);

  // Envoyer un message au patient sélectionné
  const handleSend = async () => {
    if (!reply.trim() || !selectedPatient) return;

    try {
      // Créer le message dans la base
      await addDoc(collection(db, "messages"), {
        content: reply,
        psyId: auth.currentUser.uid,
        userId: selectedPatient.id,
        timestamp: serverTimestamp(),
        sender: "psy"
      });

      // Vider le champ de texte
      setReply("");

      // Pour afficher le message immédiatement, on utilise la date actuelle comme timestamp temporaire
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9), // id temporaire
          content: reply,
          sender: "psy",
          timestamp: { seconds: Date.now() / 1000 }
        }
      ]);
    } catch (error) {
      console.error("Erreur envoi message :", error);
    }
  };
  useEffect(() => {
  const fetchRdvs = async () => {
    const currentUser = auth.currentUser;
    if (!selectedPatient || !psyInfo || !currentUser) {
      setRdvs([]);
      return;
    }

    try {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      const idClinique = (await getDoc(doc(db, "users", currentUser.uid))).data()?.idClinique;

      const q = query(
        collection(db, "cliniques", idClinique, "rdvs"),
        where("psychologue.id", "==", currentUser.uid),
        where("utilisateur", "==", selectedPatient.id)
      );

      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setRdvs(fetched);
    } catch (error) {
      console.error("Erreur récupération des RDVs :", error);
    }
  };

  fetchRdvs();
}, [selectedPatient, psyInfo]);
// 1) Supprimer le RDV
const handleSupprimer = async (rdvId) => {
  if (!window.confirm("Voulez‑vous vraiment supprimer ce rendez‑vous ?")) return;

  try {
    const currentUser = auth.currentUser;
    if (!currentUser || !psyInfo) return;

    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    const idClinique = userSnap.data()?.idClinique;

    const rdvRef = doc(db, "cliniques", idClinique, "rdvs", rdvId);
    await deleteDoc(rdvRef);

    // Retire le RDV de l’état local
    setRdvs((prev) => prev.filter((r) => r.id !== rdvId));
    alert("Rendez‑vous supprimé.");
  } catch (err) {
    console.error("Erreur suppression RDV :", err);
    alert("Échec de la suppression.");
  }
};

// 2) Modifier la date/heure du RDV
const handleModifier = async (rdv) => {
  // === Exemple rapide via prompt ===
  // Demande une nouvelle date sous forme 'YYYY-MM-DD HH:mm'
  const input = prompt(
    "Nouvelle date (format 2025-05-30 14:30) :",
    `${rdv.dateRdv.annee}-${String(rdv.dateRdv.mois).padStart(2, "0")}-${String(
      rdv.dateRdv.jour
    ).padStart(2, "0")} ${String(rdv.dateRdv.heure).padStart(2, "0")}:${String(
      rdv.dateRdv.minute
    ).padStart(2, "0")}`
  );
  if (!input) return;

  const match = input.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/
  );
  if (!match) {
    alert("Format invalide.");
    return;
  }

  const [, annee, mois, jour, heure, minute] = match.map(Number);

  try {
    const currentUser = auth.currentUser;
    if (!currentUser || !psyInfo) return;

    const idClinique = (await getDoc(doc(db, "users", currentUser.uid))).data()
      ?.idClinique;
    const rdvRef = doc(db, "cliniques", idClinique, "rdvs", rdv.id);

    await updateDoc(rdvRef, {
      dateRdv: { annee, mois, jour, heure, minute },
    });

    // Mets à jour l’état local
    setRdvs((prev) =>
      prev.map((r) =>
        r.id === rdv.id
          ? { ...r, dateRdv: { annee, mois, jour, heure, minute } }
          : r
      )
    );
    alert("Rendez‑vous mis à jour.");
  } catch (err) {
    console.error("Erreur modification RDV :", err);
    alert("Échec de la modification.");
  }
};



  return (
  <div className="main-container">
    {/* Liste des patients */}
    <div className="left-panel">
      <h2>{t("patients")}</h2>
      <ul className="patient-list">
        {patients.map((patient) => (
          <span
            key={patient.id}
            className={`patient-item ${
              selectedPatient?.id === patient.id ? "active" : ""
            }`}
            onClick={() => setSelectedPatient(patient)}
          >
            {patient.name || t("noName")}
          </span>
        ))}
      </ul>
    </div>

    {/* Centre : Info psy + RDVs */}
    <div className="center-panel">
      <div className="psychologist-info card">
        {psyInfo ? (
          <>
            {nomClinique && (
              <h2 className="clinique-name">
                {t("clinicTitle")}: {nomClinique}
              </h2>
            )}
            <h1>{psyInfo.nom}</h1>
            <p>
              <strong>{t("speciality")}:</strong> {psyInfo.specialite}
            </p> 
            <p>{psyInfo.cv}</p>
          </>
        ) : (
          <p>{t("loadingPsy")}</p>
        )}
      </div>

      <div className="rdvs-section card">
        <h3>{t("rdvWith", { name: selectedPatient?.name || "" })}</h3>

        <div className="rdvs-scroll">
          <ul className="rdvs-list">
            {rdvs.length === 0 && <p>{t("noRdv")}</p>}
            {rdvs
              .sort(
                (a, b) =>
                  a.dateRdv.annee -
                    b.dateRdv.annee ||
                  a.dateRdv.mois -
                    b.dateRdv.mois ||
                  a.dateRdv.jour -
                    b.dateRdv.jour ||
                  a.dateRdv.heure -
                    b.dateRdv.heure ||
                  a.dateRdv.minute - b.dateRdv.minute
              )
              .map((rdv) => (
                <li key={rdv.id} className="rdv-item">
                  <div>
                    <strong>{t("date")}:</strong>{" "}
                    {`${rdv.dateRdv.jour}/${rdv.dateRdv.mois}/${rdv.dateRdv.annee}`}
                    &nbsp;|&nbsp;
                    <strong>{t("time")}:</strong>{" "}
                    {`${String(rdv.dateRdv.heure).padStart(2, "0")}:${String(
                      rdv.dateRdv.minute
                    ).padStart(2, "0")}`}
                  </div>
                  <div className="rdv-buttons">
                    <button onClick={() => handleModifier(rdv)}>
                      {t("modify")}
                    </button>
                    <button
                      className="danger"
                      onClick={() => handleSupprimer(rdv.id)}
                    >
                      {t("delete")}
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>

    {/* Droite : Messages */}
    <div className="right-panel">
      {selectedPatient ? (
        <div className="messages-section">
          <h2>{t("messagesWith", { name: selectedPatient.name })}</h2>

          <div className="messages-container">
            <ul>
              {messages.map((msg) => (
                <li
                  key={msg.id}
                  className={`message-item ${
                    msg.sender === "psy" ? "from-psy" : "from-patient"
                  }`}
                >
                  {msg.content}
                </li>
              ))}
            </ul>
          </div>

          <div className="input-section">
            <textarea
              placeholder={t("replyPlaceholder")}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <button className="btne-orange" onClick={handleSend}>
              {t("send")}
            </button>
          </div>
        </div>
      ) : (
        <p>{t("selectPatient")}</p>
      )}
    </div>
  </div>
);

};

export default PsychologueClinique;
