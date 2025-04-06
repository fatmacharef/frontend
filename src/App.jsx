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

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light"); // ← AJOUT : état du thème

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
      </Routes>
    </Router>
  );
}

export default App;
