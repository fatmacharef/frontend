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
  const { t } = useTranslation(); // Hook de traduction

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        navigate("/chat"); // Redirige directement si connecté
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="home-container" dir="auto">
      <h1>
        {t("home.welcome")} <span className="highlight">PsyBot</span>
      </h1>
      <p>{t("home.description")}</p>
      <button className="start-button" onClick={() => setShowModal(true)}>
        {t("home.start")}
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{t("home.modalTitle")}</h2>
            <p>{t("home.modalText")}</p>
            <div className="modal-buttons">
              <button onClick={() => navigate("/inscrire")} className="signupe-button">
                {t("home.signup")}
              </button>
              <button onClick={() => navigate("/login")} className="logine-button">
                {t("home.login")}
              </button>
            </div>
            <button onClick={() => setShowModal(false)} className="close-button">
              {t("home.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
