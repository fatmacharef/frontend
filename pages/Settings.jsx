import { useState, useEffect } from "react";
import "./Settings.css";
import { useTranslation } from "react-i18next";

function Settings() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [language, setLanguage] = useState(localStorage.getItem("language") || "fr");

  useEffect(() => {
    // Appliquer la classe "dark" ou "light" au body
    if (theme === "dark") {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem("language", language);
  }, [language, i18n]);

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleSave = () => {
    alert(t("settingsSaved"));
  };

  return (
    <div className="settings-container">
      <h1 className="settings-title">⚙️ {t("settings")}</h1>

      <div className="settings-section">
        <label htmlFor="theme">{t("theme")}:</label>
        <select id="theme" value={theme} onChange={handleThemeChange}>
          <option value="light">{t("light")}</option>
          <option value="dark">{t("dark")}</option>
        </select>
      </div>

      <div className="settings-section">
        <label htmlFor="language">{t("chooseLanguage")}:</label>
        <select id="language" value={language} onChange={handleLanguageChange}>
          <option value="fr">🇫🇷 Français</option>
          <option value="en">🇬🇧 English</option>
          <option value="ar">🇩🇿 العربية</option>
        </select>
      </div>

      <button onClick={handleSave} className="save-btn">
        💾 {t("save")}
      </button>
    </div>
  );
}

export default Settings;
