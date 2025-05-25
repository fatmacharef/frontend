import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./Home.css";
import { useTranslation } from "react-i18next";

function Home() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        navigate("/chat");
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="home-container" >
      <div className="home-content">
        <div className="home-text">
          <h1>
            {t("home.welcome")} <span className="highlightee">PsyBot</span>
          </h1>
          <p>{t("home.description")}</p>
          <button className="starte-button" onClick={() => setShowModal(true)}>
            {t("home.start")}
          </button>
        </div>

        <div className="home-image">
          <img src="/home.png" alt="PsyBot illustration" />
        </div>
      </div>

      {showModal && (
        <div className="modale-overlay">
          <div className="modale-contentd">
            <h2>
              {t("home.welcome")} <span className="highlightee">PsyBot</span>
            </h2>
            <p>{t("home.modalText")}</p>
            <div className="modalee-buttons">
              <button onClick={() => navigate("/inscrire")} className="signupee-button">
                {t("home.signup")}
              </button>
              <button onClick={() => navigate("/login")} className="loginee-buttons">
                {t("home.login")}
              </button>
            </div>
            <button onClick={() => setShowModal(false)} className="closee-button">
              {t("home.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
