import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";  // Importer le service Auth
import { getFirestore } from "firebase/firestore";  // Importer le service Firestore

// Remplace ces valeurs par celles de ta console Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCHz2fGE_aNlzeMBTdSsIjQWsA3L5EfaCE",
  authDomain: "psybot-c245b.firebaseapp.com",
  projectId: "psybot-c245b",
  storageBucket: "psybot-c245b.appspot.com",  // Correct storageBucket
  messagingSenderId: "997228712769",
  appId: "1:997228712769:web:c9bc480eb38b65869047c0",
  measurementId: "G-CKC2YMTZMY"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);  // Authentification
const db = getFirestore(app);  // Firestore (si nécessaire)

export { auth, db };  // Exporter auth et db pour utilisation dans d'autres composants
