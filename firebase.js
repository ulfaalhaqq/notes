// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBnrY7oq-CkzBU66ggiu2H3h-46L7VPePc",
  authDomain: "my-notes-app-7945c.firebaseapp.com",
  projectId: "my-notes-app-7945c",
  storageBucket: "my-notes-app-7945c.firebasestorage.app",
  messagingSenderId: "685630209243",
  appId: "1:685630209243:web:df25d7f2f91b390a2820fe"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, db, provider };