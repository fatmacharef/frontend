import { useState } from "react";
import { auth, db } from "../firebase";  // Importer Firebase
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";  // Pour écrire dans Firestore
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./inscrire.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignup = async () => {
    try {
      console.log("Début de l'inscription");

      // Créer un utilisateur dans Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;  // Récupère l'utilisateur créé
      console.log("Utilisateur créé", user);

      // Vérifie si l'utilisateur a un UID avant de l'ajouter à Firestore
      if (!user.uid) {
        throw new Error("UID manquant pour l'utilisateur");
      }

      // Ajouter l'utilisateur dans Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        email: user.email,
        role: "user",  // Exemple de champ supplémentaire
        createdAt: new Date(),
      });
      console.log("Utilisateur ajouté à Firestore");
 
      // Rediriger vers le chat après une inscription réussie
      navigate("/choixchat");
    } catch (err) {
      console.error("Erreur d'inscription : ", err.message);
      setError(err.message);
    }
  };

  return (
    <div className="signupe-container">
      <div className="signupe-card">
        <h2 className="signupe-title" dir="auto">
          {t("signup.welcome")} <span className="highlightee">PsyBot</span>
        </h2>
        <p className="signupe-subtitle">{t("signup.subtitle")}</p>
        {error && <p className="error-message">{error}</p>}

        <input
          type="email"
          placeholder={t("signup.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="signupe-input"
        />
        <input
          type="password"
          placeholder={t("signup.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="signupe-input"
        />

        <button onClick={handleSignup} className="signupe-buttonn">
          {t("signup.button")}
        </button>
      </div>
    </div>
  );
}
 
export default Signup;
