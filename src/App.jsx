import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Inscrire from "./pages/inscrire";
import Login from "./pages/login";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import SignUp from "./pages/Signup";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import LiveChat from "./pages/LiveChat"; // Ajuste le chemin si besoin
import ChoixChat from "./pages/ChoixChat";
import Psychologue from "./pages/Psychologue"; // 👈 Import du composant
import CommunityFeed from "./pages/CommunityFeed"; // ajuste le chemin si nécessaire
import Forum from "./pages/Forum"; // ajuste le chemin si nécessaire
import Chatbot from "./pages/Chatbot"; // ajuste le chemin si nécessaire
import Psychoclinique from "./pages/Psychoclinique"; // ajuste le chemin si nécessaire
import Patient from "./pages/Patient"; // ajuste le chemin si nécessaire




function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light"); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Mettre à jour la classe thème sur <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <Router>
      <Navbar user={user} /> {/* Pas besoin de passer le thème ici sauf si tu veux un bouton direct */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/chat" element={user ? <Chat /> : <Home />} />
        <Route path="/settings" element={<Settings theme={theme} setTheme={setTheme} />} /> {/* ← On passe le thème ici */}
        <Route path="/login" element={<Login />} />
        <Route path="/inscrire" element={<Inscrire />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/community" element={<CommunityFeed />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/psychoclinique" element={<Psychoclinique />} />
        <Route path="/patient" element={<Patient />} />






        <Route path="/livechat" element={user ? <LiveChat user={user} /> : <Home />} />
        <Route path="/choixchat" element={user ? <ChoixChat /> : <Home />} />
        <Route path="/psychologue" element={<Psychologue />} /> {/* ✅ Route ajoutée */}





      </Routes>
    </Router>
  );
}

export default App;
