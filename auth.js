<<<<<<< HEAD
import { auth, provider } from "./firebase.js";
import { signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});

const btnGoogle = document.getElementById("btnGoogle");
const errorMsg = document.getElementById("errorMsg");

btnGoogle.addEventListener("click", async () => {
  try {
    btnGoogle.disabled = true;
    btnGoogle.innerText = "Memuat...";
    await signInWithPopup(auth, provider);
  } catch (error) {
    errorMsg.classList.remove("hidden");
    errorMsg.innerText = "Login gagal: " + error.message;
    btnGoogle.disabled = false;
    btnGoogle.innerText = "Masuk dengan Google";
  }
=======
import { auth, provider } from "./firebase.js";
import { signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});

const btnGoogle = document.getElementById("btnGoogle");
const errorMsg = document.getElementById("errorMsg");

btnGoogle.addEventListener("click", async () => {
  try {
    btnGoogle.disabled = true;
    btnGoogle.innerText = "Memuat...";
    await signInWithPopup(auth, provider);
  } catch (error) {
    errorMsg.classList.remove("hidden");
    errorMsg.innerText = "Login gagal: " + error.message;
    btnGoogle.disabled = false;
    btnGoogle.innerText = "Masuk dengan Google";
  }
>>>>>>> e0146532a6f3aca49367de7482306c1063972add
});