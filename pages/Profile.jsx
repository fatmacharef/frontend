import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { useTranslation } from "react-i18next";

function Profile() {
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      }
    });

    return () => unsubscribe();
  }, []);

  const userName = userEmail ? userEmail.split("@")[0] : t("guest");

  const handleViewHistory = () => {
    alert(t("viewHistoryAlert"));
  };

  const handleDeleteHistory = () => {
    const confirmDelete = window.confirm(t("confirmDeleteHistory"));
    if (confirmDelete) {
      alert(t("historyDeleted"));
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(t("confirmDeleteAccount"));
    if (confirmDelete) {
      try {
        await auth.currentUser.delete();
        alert(t("accountDeleted"));
        navigate("/");
      } catch (error) {
        alert(t("accountDeleteError"));
      }
    }
  };

  return (
    <div className="profile-container">
      <h1 className="profile-title">👤 {t("profileTitle")}</h1>

      <div className="profile-section">
        <p><strong>{t("name")}:</strong> {userName}</p>

        <label htmlFor="language"><strong>{t("language")}:</strong></label>
        <select
          id="language"
          value={i18n.language}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
        >
          <option value="fr">🇫🇷 Français</option>
          <option value="en">🇬🇧 English</option>
          <option value="ar">🇩🇿 العربية</option>
        </select>
      </div>

      <div className="profile-buttons">
        <button className="action-btn" onClick={handleViewHistory}>
          🔁 {t("viewHistory")}
        </button>
        <button className="delete-btn" onClick={handleDeleteHistory}>
          🗑️ {t("deleteHistory")}
        </button>
        <button className="delete-account-btn" onClick={handleDeleteAccount}>
          🔒 {t("deleteAccount")}
        </button>
      </div>
    </div>
  );
}

export default Profile;
