import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  deleteDoc,
} from "firebase/firestore";
import "./Psychologue.css";
import { useTranslation } from "react-i18next";
import { Timestamp } from "firebase/firestore";
import { SendHorizonal } from "lucide-react";

 

function Psychologue() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [psyId, setPsyId] = useState(null);
  const [localNotifications, setLocalNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const { t } = useTranslation();
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);  // Pour afficher/fermer la fenêtre modale
const [currentAppointment, setCurrentAppointment] = useState(null);  // Pour stocker les informations du rendez-vous sélectionné
const [appointmentDate, setAppointmentDate] = useState("");  // Pour gérer la date du rendez-vous à ajouter
const [appointmentTime, setAppointmentTime] = useState("");  // Pour gérer l'heure du rendez-vous à ajouter
console.log("Date:", appointmentDate); // devrait être au format YYYY-MM-DD
console.log("Time:", appointmentTime); // devrait être au format HH:mm
const normalizedTime = appointmentTime.length === 5 ? appointmentTime : `${appointmentTime}:00`;
const dateTimeString = `${appointmentDate}T${normalizedTime}`;
const dateTime = new Date(dateTimeString);
const getPatientName = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const email = userSnap.data().email;
      return email?.split("@")[0] || "patient inconnu";
    }
  } catch (error) {
    console.error("Erreur récupération nom patient :", error);
  }
  return "patient inconnu";
};



const handleAddAppointment = () => {
  setShowAppointmentModal(true);  // Afficher la fenêtre modale
  setCurrentAppointment(null);  // Réinitialiser le rendez-vous actuel (pour l'ajout)
  setAppointmentDate("");  // Réinitialiser la date
  setAppointmentTime("");  // Réinitialiser l'heure
};
const handleSaveAppointment = async () => {
  if (!appointmentDate || !appointmentTime) return;

  try {
    const normalizedTime = appointmentTime.length === 5 ? `${appointmentTime}:00` : appointmentTime;
    const dateTimeString = `${appointmentDate}T${normalizedTime}`;
    const dateTimeObj = new Date(dateTimeString);
    
    if (isNaN(dateTimeObj.getTime())) {
      throw new Error("Invalid date");
    }

    const formattedDate = dateTimeObj.toLocaleString("fr-FR", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const updatedAppointment = {
      userId: selectedPatientId,
      psychologueId: psyId,
      dateTime: dateTimeString,
      formattedDate,
      status: "pending"
    };

    if (currentAppointment) {
      // 🔁 Si on modifie un rendez-vous existant
      const appointmentRef = doc(db, "appointments", currentAppointment.id);
      await updateDoc(appointmentRef, updatedAppointment);
    } else {
      // ➕ Nouveau rendez-vous
      await addDoc(collection(db, "appointments"), updatedAppointment);
      handleNewAppointmentNotification(updatedAppointment);
    }

    await fetchAppointments(selectedPatientId);
    setShowAppointmentModal(false);
  } catch (error) {
    console.error("Error saving appointment:", error);
  }
};


const handleEditAppointment = (appointmentId) => {
  const appointmentToEdit = appointments.find(app => app.id === appointmentId);
  if (!appointmentToEdit) return;

  setCurrentAppointment(appointmentToEdit);
  setAppointmentDate(appointmentToEdit.dateTime.split("T")[0]);
  setAppointmentTime(appointmentToEdit.dateTime.split("T")[1].slice(0, 5));
  setShowAppointmentModal(true);
};


const handleDeleteAppointment = async (appointmentId) => {
  try {
    await deleteDoc(doc(db, "appointments", appointmentId));  // Supprimer le rendez-vous de la base de données
  } catch (err) {
    console.error("Erreur lors de la suppression du rendez-vous", err);
  }
};


  // 🔔 Afficher notification système + stocker localement
  async function handleNewAppointmentNotification(data) {
    const patientName = await getPatientName(data.userId);
    const formattedDate = data.formattedDate || new Date(data.dateTime).toLocaleString("fr-FR");
  
    const message = patientName 
      ? `Nouveau rendez-vous avec ${patientName} à ${formattedDate}` 
      : `Nouveau rendez-vous avec patient inconnu à ${formattedDate}`;
  
    setLocalNotifications(prev => [...prev, { id: data.id, message }]);
    showNotification("Nouveau Rendez-vous", message);
  }
  
  

  // 🔐 Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setPsyId(user.uid);
        if (Notification.permission !== "granted") {
          Notification.requestPermission();
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 🔔 Listener RDV : détecter nouveaux RDV
  useEffect(() => {
    if (!psyId) return;
  
    const appointmentsRef = collection(db, "appointments");
    const q = query(appointmentsRef, where("psychologueId", "==", psyId));
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const docData = change.doc.data();
        const appointmentId = change.doc.id;
  
        if (change.type === "added" && docData.notified !== true) {
          
  
          // Marquer comme "notifié" dans Firestore
          const docRef = doc(db, "appointments", appointmentId);
          await updateDoc(docRef, { notified: true });
        }
      });
    });
  
    return () => unsubscribe();
  }, [psyId]);
  

  // 🔃 Charger tous les chats du psy
  const fetchChats = async (currentPsyId) => {
    const chatsRef = collection(db, "chats");
    const snapshot = await getDocs(chatsRef);
    const chatList = [];

    for (const chatDoc of snapshot.docs) {
      const data = chatDoc.data();
      if (data.participants?.includes(currentPsyId)) {
        const patientId = data.participants.find(id => id !== currentPsyId);
        const userDoc = await getDoc(doc(db, "users", patientId));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const nameFromEmail = userData.email ? userData.email.split("@")[0] : "Utilisateur";

        const messagesRef = collection(db, "chats", chatDoc.id, "messages");
        const unreadMessagesSnap = await getDocs(messagesRef);
        const unreadCount = unreadMessagesSnap.docs.filter(msg =>
          msg.data().senderId === patientId && !msg.data().read
        ).length;

        chatList.push({
          chatId: chatDoc.id,
          patientId,
          unreadCount,
          name: nameFromEmail,
          ...userData
        });
      }
    }

    chatList.sort((a, b) => b.unreadCount - a.unreadCount || a.name.localeCompare(b.name));
    setPatients(chatList);
  };

  useEffect(() => {
    if (psyId) {
      fetchChats(psyId);
    }
  }, [psyId]);

  // 🟡 Sélectionner un patient
 const handleSelectPatient = async (patientId) => {
  setSelectedPatientId(patientId);
  const selectedChat = patients.find(p => p.patientId === patientId);
  if (!selectedChat?.chatId) return;

  const messagesRef = collection(db, "chats", selectedChat.chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "desc"), limit(10));
  const snap = await getDocs(q);

  const updatePromises = snap.docs.map(msgDoc => {
    const msg = msgDoc.data();
    if (msg.senderId === patientId && !msg.read) {
      return updateDoc(doc(db, "chats", selectedChat.chatId, "messages", msgDoc.id), {
        read: true
      });
    }
    return Promise.resolve();
  });

  await Promise.all(updatePromises);

  // ✅ Mise à jour locale du patient pour mettre unreadCount à 0
  setPatients(prev =>
    prev.map(p =>
      p.patientId === patientId ? { ...p, unreadCount: 0 } : p
    )
  );

  await fetchChats(psyId);
  await fetchAppointments(patientId);
};


  const fetchAppointments = async (patientId) => {
    try {
      const q = query(
        collection(db, "appointments"),
        where("psychologueId", "==", psyId),
        where("userId", "==", patientId),
        orderBy("dateTime", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => {
        const data = doc.data();
        const dateObj = new Date(data.dateTime);
        return { id: doc.id, ...data, date: dateObj };
      });
      setAppointments(list);
    } catch (err) {
      console.error("Erreur fetchAppointments:", err);
    }
  };

  // 🔃 Synchronisation temps réel des messages
  useEffect(() => {
    if (!selectedPatientId || !psyId) return;
    const selectedChat = patients.find(p => p.patientId === selectedPatientId);
    if (!selectedChat?.chatId) return;

    const q = query(collection(db, "chats", selectedChat.chatId, "messages"), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, snapshot => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedPatientId, patients, psyId]);

  // ✉️ Envoyer message
  const handleSend = async () => {
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || !psyId || !selectedPatientId) return;

    const selectedChat = patients.find(p => p.patientId === selectedPatientId);
    if (!selectedChat?.chatId) return;

    const msgRef = collection(db, "chats", selectedChat.chatId, "messages");

    await addDoc(msgRef, {
      text: trimmedMessage,
      senderId: psyId,
      timestamp: new Date(),
      read: false
    });

    setNewMessage("");
  };

  // 💾 Sauvegarder notes
  const handleSaveNotes = async () => {
    if (!selectedPatientId) return;
    try {
      await updateDoc(doc(db, "users", selectedPatientId), { notes });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des notes :", error);
    }
  };

  // 📝 Remplir notes à la sélection
  const selectedPatient = patients.find(p => p.patientId === selectedPatientId);
  useEffect(() => {
    if (selectedPatient) {
      setNotes(selectedPatient.notes || "");
    }
  }, [selectedPatient]);

  // 📅 Jours avec messages patient
  const getMessageDays = () => {
    const days = messages
      .filter(msg => msg.senderId === selectedPatientId)
      .map(msg => new Date(msg.timestamp?.toDate?.() || msg.timestamp))
      .map(date => date.toLocaleDateString("fr-FR"))
      .filter((v, i, arr) => arr.indexOf(v) === i);
    return days;
  };

  // 🔔 Notification système
  function showNotification(title, body) {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/appointment-icon.png",
      });
    }
  }

  return (
    <div className="psychologue-page">
      <div className="psychologue-container">
        {/* 🔔 Notification icon + panneau */}
      
       
        

        {/* 👥 Liste patients */}
        <div className="patient-list">
          <h3>{t("patients")}</h3>
          {patients.map(patient => (
            <div
              key={patient.patientId}
              className={`patient-item ${selectedPatientId === patient.patientId ? "selected" : ""}`}
              onClick={() => handleSelectPatient(patient.patientId)}
            >
              <div className="patient-name-row">
                <strong className="name">{patient.name}</strong>
                {patient.unreadCount > 0 && selectedPatientId !== patient.patientId && (
                  <span className="unread-badge">{patient.unreadCount}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 💬 Zone messages */}
        <div className="message-area">
          {selectedPatientId ? (
            <>
              <div className="messages">
                {messages.map(msg => (
                  <div key={msg.id} className={`msg ${msg.senderId === psyId ? "psy" : "patient"}`}>
                    {msg.text}
                  </div>
                ))}
              </div>
              <div className="input-box">
                <input
                  type="text"
                  value={newMessage}
                  placeholder={t("yourMessage")}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                />
<button
  onClick={handleSend}
  title={t("send_button")}
  className="send-button"
>
  <SendHorizonal size={20} />
</button>
              </div>
            </>
          ) : (
            <p className="no-patient">{t("selectPatient")}</p>
          )}
        </div>

        {/* 👤 Profil du patient */}
        {selectedPatient && (
          <div className="profile-panel">
            <h3>{t("profileOf", { name: selectedPatient.name })}</h3>
            <p><strong>{t("email")}:</strong> {selectedPatient.email || "N/A"}</p>
            <p><strong>{t("privateNotes")}:</strong></p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
            />
            <div className="message-days">
              <strong>{t("messageDays")}:</strong>
              <ul>
                {getMessageDays().map((day, index, arr) => (
                  <span key={index} style={{ color: index === arr.length - 1 ? "green" : "black" }}>
                    {day} {index === arr.length - 1 && t("last")}
                  </span>
                ))}
              </ul>
            </div>
            <button onClick={handleAddAppointment} className="ajoute">
  {t("addAppointment")}
</button>

          </div>
          

        )}
        {showAppointmentModal && (
  <div className="appointment-modal">
    <div className="modal-content">
      <button
        className="exit"
        onClick={() => setShowAppointmentModal(false)}
      >
        X
      </button>
      <h3 className="text">{currentAppointment ? "Modifier le Rendez-vous" : "Ajouter un Rendez-vous"}</h3>
      <div>
        <label>Date</label>
        <input
          type="date"
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
        />
      </div>
      <div>
        <label>Heure</label>
        <input
          type="time"
          value={appointmentTime}
          onChange={(e) => setAppointmentTime(e.target.value)}
        />
      </div>
      <button onClick={handleSaveAppointment} className="Add">
        {currentAppointment ? "Enregistrer les modifications" : "Ajouter le rendez-vous"}
      </button>
    </div>
  </div>
  
)}
<div className="appointments">
  <strong className="rendez-vous">{t("Rendez-vous")}:</strong>
  <ul>
  {appointments.length > 0 ? (
    appointments.map(app => {
      const dateObj = new Date(app.date);
      const isValidDate = !isNaN(dateObj.getTime());

      return (
        <li key={app.id}>
          {isValidDate
            ? dateObj.toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "Date invalide"}

          {/* Boutons pour modifier et supprimer */}
          <button onClick={() => handleEditAppointment(app.id)}>
            {t("edit")}
          </button>

          <button onClick={() => handleDeleteAppointment(app.id)}>
            {t("delete")}
          </button>
        </li>
      );
    })
  ) : (
    <li>{t("pas Rendez-vous")}</li>
  )}
</ul>

</div>

      </div>
    </div>
  );
} 

export default Psychologue;
