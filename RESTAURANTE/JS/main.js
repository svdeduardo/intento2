// Puedes agregar más funciones aquí
document.addEventListener("DOMContentLoaded", () => {
  console.log("Masala Palace - Sistema cargado correctamente 🪔");
});
// JS/auth.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";   // ← Usamos tu firebase.js

// Inicializar login / registro
export function initAuth() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const errorMsg = document.getElementById('auth-error');

  tabLogin.addEventListener('click', () => {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  });

  tabRegister.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
  });

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "reservaciones.html";
    } catch (err) {
      errorMsg.textContent = "❌ " + err.message;
    }
  });

  // Registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, "users", userCredential.user.uid), {
        nombre: nombre,
        email: email,
        role: "customer",
        createdAt: new Date()
      });

      alert("✅ ¡Registro exitoso! Bienvenido a Masala Palace");
      window.location.href = "reservaciones.html";
    } catch (err) {
      errorMsg.textContent = "❌ " + err.message;
    }
  });
}

// Proteger páginas (para reservaciones.html)
export function requireAuth(callback) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(user);
    } else {
      alert("Debes iniciar sesión o registrarte para reservar");
      window.location.href = "index.html";
    }
  });
}

window.initAuth = initAuth;