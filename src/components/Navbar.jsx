import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Ajout de useNavigate
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import "./Navbar.css";
import { useTranslation } from "react-i18next";

function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate(); // Initialisation

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Utilisateur déconnecté");
      setMenuOpen(false);
      navigate("/"); // Redirection vers l'accueil
      window.scrollTo(0, 0); // Optionnel : remonter en haut de la page
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  const getInitial = (email) => (email ? email.charAt(0).toUpperCase() : "U");

  const getColorFromEmail = (email) => {
    if (!email) return "#cccccc";
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 70%, 70%)`;
  };

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <nav className="navbar">
      <h2 className="logo">PsyBot</h2>

      {location.pathname !== "/chat" &&
        location.pathname !== "/inscrire" &&
        location.pathname !== "/signup" &&
        location.pathname !== "/" &&
        location.pathname !== "/login" && (
          <div className="nav-links">
            <Link to="/chat">{t("navbar.chat")}</Link>
          </div>
        )}

      <div className="user-section">
        {user ? (
          <div className="profile-menu">
            <div className="profile-wrapper" onClick={() => setMenuOpen(!menuOpen)}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profil" className="profile-pic" />
              ) : (
                <div
                  className="profile-placeholder"
                  style={{ backgroundColor: getColorFromEmail(user.email) }}
                >
                  {getInitial(user.email)}
                </div>
              )}
            </div>

            {menuOpen && (
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item">
                  {t("navbar.profile")}
                </Link>
                <Link to="/settings" className="dropdown-item">
                  {t("navbar.settings")}
                </Link>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  {t("navbar.logout")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/signup" className="login-btn">
            {t("navbar.login")}
          </Link>
        )}

        {/* Sélecteur de langue */}
        {location.pathname !== "/home" && location.pathname !== "/chat" &&
          location.pathname !== "/profile" &&
          location.pathname !== "/settings" && (
            <div className="language-selector">
              <select onChange={handleLanguageChange} value={i18n.language}>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          )}
      </div>
    </nav>
  );
}

export default Navbar;
