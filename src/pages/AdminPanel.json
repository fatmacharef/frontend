import React, { useState } from "react";
import "./AdminPanel.css";
import { useEffect } from "react";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { db } from '../firebase'; // ton config Firebase
import { query } from "firebase/firestore";
import {  where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";







export default function AdminDashboard() {
  const emotionColors = {
    neutral  : '#350cc9',
    autre: '#ec09b4',
    joy: '#24c7b1',
    love: '#7a7a15',
    anger: '#dbb96f',
    gratitude:'#20d820',
    curiosity :'#df0909',
    approval :'#b80707',
    disapproval :'#564c81',
    sadness:'#4caf52',
    admiration:'#d80505'
  };
  

  const { t } = useTranslation();

  const payments = [
    { id: 1, user: "User One", amount: 100, date: "2025-05-01" },
    { id: 2, user: "User Two", amount: 150, date: "2025-05-10" },
  ];

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
   const [patientsRatio, setPatientsRatio] = useState({ psychologue: 0, psybot: 0 });
   /*emotion*/
     const [emotionStats, setEmotionStats] = useState({});

  useEffect(() => {
    const fetchEmotionStats = async () => {
      try {
        const clinicsSnap = await getDocs(collection(db, 'cliniques'));
        const emotionCount = {};

        for (const clinicDoc of clinicsSnap.docs) {
          const chatRef = collection(db, `cliniques/${clinicDoc.id}/chat`);
          const chatSnap = await getDocs(chatRef);

          for (const chatDoc of chatSnap.docs) {
            const emotion = chatDoc.data().emotion;
            if (typeof emotion === 'string' && emotion.trim() !== '') {
  emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
}

           

          }
        }

        const totalEmotions = Object.values(emotionCount).reduce((a, b) => a + b, 0);

        if (totalEmotions > 0) {
          const emotionRatios = {};
          for (const [emotion, count] of Object.entries(emotionCount)) {
            emotionRatios[emotion] = Math.round((count / totalEmotions) * 100);
          }

          setEmotionStats(emotionRatios);
          console.log("📈 Stats émotionnelles :", emotionRatios);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des émotions :", error);
      }
    };

    fetchEmotionStats();
  }, []);


   /*patient psybot_psychologue*/
useEffect(() => {
  const auth = getAuth();

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.warn("🚫 Aucun utilisateur connecté");
      return;
    }

    const db = getFirestore();
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const cliniqueId = userDoc.data()?.clinique_id;
      if (!cliniqueId) return;

      const rdvsSnap = await getDocs(collection(db, "cliniques", cliniqueId, "rdvs"));
      const chatSnap = await getDocs(collection(db, "cliniques", cliniqueId, "chat"));

      const psychologueUsers = new Set();
      const psybotUsers = new Set();

      for (const rdv of rdvsSnap.docs) {
        const userId = rdv.data().utilisateur;
        if (userId) psychologueUsers.add(userId);
      }

      for (const chat of chatSnap.docs) {
        const chatUserId = chat.data().user_id;
        if (chatUserId) psybotUsers.add(chatUserId);
      }

      const onlyPsybot = new Set([...psybotUsers].filter(u => !psychologueUsers.has(u)));
      const onlyPsychologue = new Set([...psychologueUsers].filter(u => !psybotUsers.has(u)));
      const both = new Set([...psybotUsers].filter(u => psychologueUsers.has(u)));

      const total = onlyPsybot.size + onlyPsychologue.size + both.size;

      if (total > 0) {
        const ratios = {
          onlyPsychologue: Math.round((onlyPsychologue.size / total) * 100),
          onlyPsybot: Math.round((onlyPsybot.size / total) * 100),
          both: Math.round((both.size / total) * 100),
        };

        setPatientsRatio(ratios);
        console.log("📊 Ratios patients mis à jour:", ratios);
      } else {
        console.warn("Aucun utilisateur trouvé dans les deux collections.");
      }

    } catch (error) {
      console.error("❌ Erreur dans le fetch des données :", error);
    }
  });
  

  return () => unsubscribe();
}, []);
const auth = getAuth();
const user = auth.currentUser;

 const [data, setData] = useState([]);
      const [cliniqueId, setCliniqueId] = useState(null);
useEffect(() => {
  const auth = getAuth();

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.log("❌ Aucun utilisateur connecté (onAuthStateChanged)");
      return;
    }

    console.log("✅ Utilisateur connecté :", user.uid);

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.log("❌ Document utilisateur introuvable");
        return;
      }

      const id = userDoc.data()?.clinique_id;
      console.log("🏥 ID Clinique récupéré :", id);
      setCliniqueId(id);

      const psyRef = collection(db, `cliniques/${id}/psychologues`);
      const rdvsRef = collection(db, `cliniques/${id}/rdvs`);

      const psySnap = await getDocs(psyRef);
      const rdvSnap = await getDocs(rdvsRef);

      console.log("📄 Psychologues trouvés :", psySnap.docs.length);
      console.log("📄 RDVs trouvés :", rdvSnap.docs.length);

      const rdvs = rdvSnap.docs.map(doc => doc.data());

      const result = await Promise.all(
        psySnap.docs.map((doc) => {
          const idPsychologue = doc.id;
          const nom = doc.data().nom;

          const patientsSet = new Set(
            rdvs
              .filter(r => r.psychologue?.id === idPsychologue)
              .map(r => r.utilisateur)
          );

          console.log(`👤 Psy ${nom} a ${patientsSet.size} patients uniques`);

          return {
            name: nom,
            pct: patientsSet.size
          };
        })
      );

      setData(result);
    } catch (error) {
      console.error("❌ Erreur :", error);
    }
  });

  return () => unsubscribe(); // nettoyage
}, []);
/* reponse type */



  const [responseTypes, setResponseTypes] = useState([]);


  // 1. useEffect pour récupérer le cliniqueId de l'utilisateur connecté
  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("🚫 Aucun utilisateur connecté");
        setCliniqueId(null);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const cid = userDoc.data()?.clinique_id;
        if (!cid) {
          console.warn("Aucun clinique_id trouvé pour cet utilisateur");
          setCliniqueId(null);
          return;
        }
        setCliniqueId(cid);
        console.log("Clinique ID récupéré :", cid);
      } catch (error) {
        console.error("Erreur lors de la récupération du clinique_id:", error);
        setCliniqueId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. useEffect pour fetch les données de chat une fois que cliniqueId est défini
  useEffect(() => {
    if (!cliniqueId) return;

    const fetchData = async () => {
      const db = getFirestore();
      const counts = {
        "Fixed Message": 0,
        "GPT Response": 0,
        "Step 2: Search": 0,
      };
      let total = 0;

      try {
        console.log("Fetching chat data for clinique:", cliniqueId);
        const chatQuery = query(collection(db, "cliniques", cliniqueId, "chat"));
        const snapshot = await getDocs(chatQuery);
        console.log("Number of chat documents:", snapshot.size);

        snapshot.forEach((doc, index) => {
          const data = doc.data();
          const steps = data.steps || [];
          console.log(`Doc #${index + 1} steps:`, steps);

          steps.forEach((s, i) => {
            console.log(`Step ${i}:`, s, " | Type:", typeof s);
          });

          if (steps.some((s) => typeof s === "string" && s.includes("Emotion inacceptable détectée"))) {
            counts["Fixed Message"]++;
          }
          if (steps.some((s) => typeof s === "string" && s.includes("Réponse générée avec GPT"))) {
            counts["GPT Response"]++;
          }
          if (steps.some((s) => typeof s === "string" && s.includes("Recherche externe via DuckDuckGo"))) {
            counts["Step 2: Search"]++;
          }

          total++;
        });

        console.log("Final counts:", counts, "Total chats:", total);

        const result = Object.entries(counts).map(([label, count]) => ({
          label,
          pct: total ? Math.round((count / total) * 100) : 0,
        }));

        console.log("Result to set:", result);
        setResponseTypes(result);
      } catch (error) {
        console.error("Error while fetching data:", error);
      }
    };

    fetchData();
  }, [cliniqueId]);
  const [users, setUsers] = useState([]);
useEffect(() => {
  const auth = getAuth();
  const db = getFirestore();

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.warn("🚫 Aucun utilisateur connecté");
      return;
    }

    console.log("✅ Utilisateur connecté :", user.uid);

    try {
      // ✅ Accès direct au document users/{user.uid}
      const userDocSnap = await getDoc(doc(db, "users", user.uid));

      if (!userDocSnap.exists()) {
        console.warn("❌ Aucun document trouvé pour cet utilisateur !");
        return;
      }

      const currentUserData = userDocSnap.data();
      console.log("📄 currentUserData:", currentUserData);

      const cliniqueId = currentUserData?.clinique_id;

      if (!cliniqueId) {
        console.warn("❌ clinique_id non trouvé dans le document utilisateur.");
        return;
      }

      console.log("🏥 clinique_id trouvé :", cliniqueId);

      // 🔍 Étape 2 : Rechercher tous les utilisateurs avec ce même id de clinique
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("role", "==", "user"),
        where("cliniqueId", "==", cliniqueId)
      );

      const snapshot = await getDocs(q);
      console.log("📦 Nombre d'utilisateurs trouvés :", snapshot.size);

      const userList = snapshot.docs.map(doc => {
        const data = doc.data();
        const email = data.email || "";
        const name = email.split("@")[0]; // Nom avant le @
        return {
          id: doc.id,
          name: name,
          email: email,
        };
      });

      setUsers(userList);
      console.log("👥 Utilisateurs trouvés :", userList);

    } catch (err) {
      console.error("❌ Erreur lors de la récupération des utilisateurs :", err);
    }
  });

  return () => unsubscribe();
}, []);
const [psychologists, setPsychologists] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("🚫 Aucun utilisateur connecté");
        return;
      }

      console.log("✅ Utilisateur connecté :", user.uid);

      try {
        // 🔍 Étape 1 : Récupérer le document utilisateur
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          console.warn("❌ Document utilisateur introuvable.");
          return;
        }

        const userData = userDocSnap.data();
        const cliniqueId = userData?.clinique_id;

        if (!cliniqueId) {
          console.warn("❌ Aucun clinique_id trouvé.");
          return;
        }

        console.log("🏥 clinique_id trouvé :", cliniqueId);

        // 🔍 Étape 2 : Récupérer les psychologues de la clinique
        const psychologuesRef = collection(db, "cliniques", cliniqueId, "psychologues");
        const snapshot = await getDocs(psychologuesRef);

        if (snapshot.empty) {
          console.warn("⚠️ Aucun psychologue trouvé dans cette clinique.");
          return;
        }

        const list = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.nom || "Nom inconnu",
          };
        });

        setPsychologists(list);
        console.log("🧠 Psychologues récupérés :", list);

      } catch (err) {
        console.error("❌ Erreur lors de la récupération des psychologues :", err);
      }
    });

    return () => unsubscribe();
  }, []);
  /* deconnexion */
  const handleLogout = () => {
  const auth = getAuth();
  signOut(auth)
    .then(() => { 
      console.log("✅ Déconnexion réussie");
      // Redirige vers la page de login si tu en as une
      window.location.href = "/login";
    })
    .catch((error) => {
      console.error("❌ Erreur de déconnexion :", error);
    });
};










  const DashboardContent = () => (
      <div className="dashboard-grid">

    <>
   <section className="carde">
          <h2>{t("nombrePatients")}</h2>
  
  <div className="bar-graphe" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '10px', height: '220px' }}>
    {data.map((p, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Nombre de patients au-dessus */}
        <span style={{ marginBottom: '6px', fontWeight: 'bold', color: '#4B2E2E' }}>{p.pct}</span>

        {/* La barre */}
        <div
          style={{
            height: `${Math.min(p.pct * 10, 200)}px`,
            backgroundColor: '#3379d3',
            width: '30px',
            borderRadius: '4px',
            color:'#4B2E2E'
          }}
          title={`${p.name} – ${p.pct} patients`}
        />

        {/* Nom sous la barre */}
        <span style={{ marginTop: '6px', width: '60px', textAlign: 'center', fontSize: '12px', wordBreak: 'break-word' }}>
          {p.name}
        </span>
      </div>
    ))}
  </div>
</section>

    <section className="carde">
  <h2>{t("patients")}</h2>
  <div
    className="donut"
    style={{
      background: `conic-gradient(
        var(--color-psychologist) 0 ${patientsRatio.onlyPsychologue}%,
        var(--color-psybot) ${patientsRatio.onlyPsychologue}% ${patientsRatio.onlyPsychologue + patientsRatio.onlyPsybot}%,
        var(--color-both) ${patientsRatio.onlyPsychologue + patientsRatio.onlyPsybot}% 100%
      )`,
    }}
  >
    
  </div>
  <div className="legend">
    <div className="color-psychologist" /> <span> {patientsRatio.onlyPsychologue}%Psychologue seul</span>
    <div className="color-psybot" /> <span>{patientsRatio.onlyPsybot}%Psybot seul</span>
    <div className="color-both"/> <span>{patientsRatio.both}%Les deux</span>
  </div>
</section>



    <section className="carde">
          <h2>{t("emotions")}</h2>
  <div className="bar-chart">
    {Object.entries(emotionStats)
      .sort(([, a], [, b]) => b - a) // Trie décroissant
      .map(([emotion, pct]) => (
        <div key={emotion} className="bar-row">
          <span className="label">{emotion}</span>
          <div className="bar-container">
            <div
              className="bar"
              style={{
                width: `${pct}%`,
                backgroundColor: emotionColors[emotion] || 'gray'
              }}
            />
            <span className="percent">{pct}%</span>
          </div>
        </div>
      ))}
  </div>
</section>



     <section className="carde">
          <h2>{t("responseTypes")}</h2>
      {responseTypes.map((r) => (
        <div className="response-row" key={r.label}>
          <label>{r.label}</label>
          <div className="bar">
            <span style={{ width: `${r.pct}%` }} />
          </div>
          <span>{r.pct}%</span>
        </div>
      ))}
    </section>
    </>
     </div>
  );
  /*  type  */
  

  const UsersListContent = () => (
    <section className="card">
      <h2>{t("listes")}</h2>
      <ul>
        {users.map((u) => (
          <span key={u.id}>
            {u.name} — {u.email}
          </span>
        ))}
      </ul>
    </section>
  );

  const PsychologistsListContent = () => (
   <section className="card">
      <h2>{t("liste")}</h2>
      <ul>
        {psychologists.map((p, i) => (
          <span key={i}>{p.name}</span>
        ))}
      </ul>
    </section>
  );

  const PaymentDetailsContent = () => (
    <section className="card">
      <h2>Détails des paiements</h2>
      <table>
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Montant</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((pay) => (
            <tr key={pay.id}>
              <td>{pay.user}</td>
              <td>{pay.amount} €</td>
              <td>{pay.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );


  return (
    <div className="admin-wrapper">
      {/* Top bar */}
      <header className="top-bar">
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          &#9776;
        </button>
        <h1 className="clinic-title">CLINIC NAME</h1>
        <button className="add-btn">{t("addpsycho")}</button>
      </header>

      {/* Drawer */}
      <nav className={`drawer ${menuOpen ? "open" : ""}`}>
        <ul>
          <li
            className={activeSection === "dashboard" ? "active" : ""}
            onClick={() => setActiveSection("dashboard")}
          >
            {t("dashbou")}
          </li>
          <li
            className={activeSection === "users" ? "active" : ""}
            onClick={() => setActiveSection("users")}
          >
           {t("listes")}
          </li>
          <li
            className={activeSection === "psychologists" ? "active" : ""}
            onClick={() => setActiveSection("psychologists")}
          >
            {t("liste")}
          </li>
          <li
            className={activeSection === "payments" ? "active" : ""}
            onClick={() => setActiveSection("payments")}
          >
{t("paie")}          </li>
          <li onClick={handleLogout} className="menu-item logout">
   {t("deconn")}
</li>

        </ul>
      </nav>

      {/* Main content */}
      <main className={`cards ${menuOpen ? "menu-open" : ""}`}>
        {activeSection === "dashboard" && <DashboardContent />}
        {activeSection === "users" && <UsersListContent />}
        {activeSection === "psychologists" && <PsychologistsListContent />}
        {activeSection === "payments" && <PaymentDetailsContent />}
      </main>
    </div>
  );
}
