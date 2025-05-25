import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { getDoc, doc } from "firebase/firestore";
import "./login.css";
import { useTranslation } from "react-i18next";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();
 
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userId = user.uid;

      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        // 🔁 Redirection selon rôle
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "psycho") {
          navigate("/psychologue");
        } else if (role === "user") {
          navigate("/choixchat");
        } else if (role === "psychoclinique") {
          navigate("/psychoclinique");
        }else {
          setError("Rôle inconnu. Contactez l’administrateur.");
        }
      } else {
        setError("Utilisateur non trouvé dans Firestore.");
      }
    } catch (err) {
      setError("Erreur lors de la connexion : " + err.message);
    }
  };

  return (
    <div className="signups-container">
      <div className="signups-card">
        <h2 className="signups-title" dir="auto">
          {t("login.welcome")} <span className="highlightee">PsyBot</span>
        </h2>
        <p className="signups-subtitle">{t("login.subtitle")}</p>
        {error && <p className="error-message">{error}</p>}

        <input
          type="email"
          placeholder={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="signups-input"
        />
        <input
          type="password"
          placeholder={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="signups-input"
        />

        <button onClick={handleLogin} className="inscrirees-buttonn">
          {t("login.button")}
        </button>
      </div>
    </div>
  );
}

export default Login;
