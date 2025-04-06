import { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./inscrire.css";
import { useTranslation } from "react-i18next";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/chat");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title" dir="auto">
          {t("signup.welcome")} <span className="highlight">PsyBot</span>
        </h2>
        <p className="signup-subtitle">{t("signup.subtitle")}</p>
        {error && <p className="error-message">{error}</p>}

        <input
          type="email"
          placeholder={t("signup.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="signup-input"
        />
        <input
          type="password"
          placeholder={t("signup.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="signup-input"
        />

        <button onClick={handleSignup} className="inscriree-button">
          {t("signup.button")}
        </button>
      </div>
    </div>
  );
}

export default Signup;
