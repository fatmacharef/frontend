import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import './i18n';  // Assurez-vous que i18n est bien configuré

// Ecouter les changements de langue via i18next
import i18n from "i18next";

// Appliquer la direction correcte en fonction de la langue active
i18n.on('languageChanged', (lng) => {
  // Modifier la direction du texte en fonction de la langue
  if (lng === "ar") {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.lang = "ar";
  } else {
    document.documentElement.setAttribute("dir", "ltr");
    document.documentElement.lang = "en";  // Ou "fr" selon la langue
  }
});

// Appliquer la direction initiale au chargement de la page
if (i18n.language === "ar") {
  document.documentElement.setAttribute("dir", "rtl");
  document.documentElement.lang = "ar";
} else {
  document.documentElement.setAttribute("dir", "ltr");
  document.documentElement.lang = "en";  // Ou "fr" selon la langue
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

