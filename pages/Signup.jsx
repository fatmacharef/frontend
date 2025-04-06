import { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./signup.css"; // Fichier CSS pour le style

function Signup() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/chat");
    } catch (err) {
      setError(t("signupError"));
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/chat");
    } catch (err) {
      setError(t("loginError"));
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
      <h2 className="signup-title" dir="auto">
  {t("welcome")} <span className="highlight">PsyBot</span>
</h2>

        <p className="signup-subtitle">{t("uniqueExperience")}</p>

        {error && <p className="error-message">{error}</p>}

        <input
          type="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="signup-input"
        />

        <input
          type="password"
          placeholder={t("passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="signup-input"
        />

        <button onClick={handleSignup} className="signup-button">{t("signup.button")}</button>
        <button onClick={handleLogin} className="login-button">{t("login.button")}</button>
      </div>
    </div>
  );
}

export default Signup;
