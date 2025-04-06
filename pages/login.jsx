import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
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
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/chat");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title" dir="auto">
          {t("login.welcome")} <span className="highlight">PsyBot</span>
        </h2>
        <p className="signup-subtitle">{t("login.subtitle")}</p>
        {error && <p className="error-message">{error}</p>}

        <input
          type="email"
          placeholder={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="signup-input"
        />
        <input
          type="password"
          placeholder={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="signup-input"
        />

        <button onClick={handleLogin} className="inscriree-button">
          {t("login.button")}
        </button>
      </div>
    </div>
  );
}

export default Login;
