// JS/auth.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

// ============================================================
// SESIÓN PERSISTENTE
// ============================================================

/**
 * Verifica sesión activa. 
 * onLogged(user)   → se ejecuta si HAY sesión
 * onGuest()        → se ejecuta si NO hay sesión
 */
export function checkSession(onLogged, onGuest) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (typeof onLogged === 'function') onLogged(user);
    } else {
      if (typeof onGuest === 'function') onGuest();
    }
  });
}

/**
 * Protege una página: si no hay sesión redirige al login.
 * Llama esto al inicio de reservaciones.js / admin.js.
 */
export function requireAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      callback(user);
    } else {
      sessionStorage.setItem('redirectAfterLogin', window.location.href);
      alert("Debes iniciar sesión para hacer una reservación.");
      window.location.href = "login.html";
    }
  });
}

/**
 * Protege página de administrador: solo usuarios con role="admin"
 */
export async function requireAdmin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', window.location.href);
      alert("Debes iniciar sesión como administrador.");
      window.location.href = "login.html";
      return;
    }

    // Verificar rol del usuario
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "admin") {
        callback(user);
      } else {
        alert("Acceso denegado. Solo administradores pueden entrar aquí.");
        window.location.href = "index.html";
      }
    } catch (error) {
      console.error("Error al verificar rol:", error);
      window.location.href = "index.html";
    }
  });
}

// ============================================================
// LOGIN / REGISTER (para login.html)
// ============================================================
export function initAuth() {
  const loginForm     = document.getElementById('login-form');
  const registerForm  = document.getElementById('register-form');
  const tabLogin      = document.getElementById('tab-login');
  const tabRegister   = document.getElementById('tab-register');
  const errorMsg      = document.getElementById('auth-error');

  // ── Tabs ──────────────────────────────────────────────────
  tabLogin?.addEventListener('click', () => {
    loginForm.style.display    = 'block';
    registerForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    errorMsg.textContent = '';
  });

  tabRegister?.addEventListener('click', () => {
    loginForm.style.display    = 'none';
    registerForm.style.display = 'block';
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    errorMsg.textContent = '';
  });

  // ── Login con email/password ───────────────────────────────
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verificar rol después del login
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        const userRole = userDoc.data().role;
        if (userRole === "admin") {
          window.location.href = "dashboard.html";
        } else {
          redirectAfterLogin();
        }
      } else {
        redirectAfterLogin();
      }
    } catch (err) {
      errorMsg.textContent = "❌ " + friendlyError(err.code);
    }
  });

  // ── Registro ──────────────────────────────────────────────
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre   = document.getElementById('reg-nombre').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        nombre,
        email,
        role: "customer", // Por defecto todos son clientes
        createdAt: new Date()
      });

      redirectAfterLogin();
    } catch (err) {
      errorMsg.textContent = "❌ " + friendlyError(err.code);
    }
  });

  // ── Google ────────────────────────────────────────────────
  document.getElementById('google-btn')?.addEventListener('click', async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          nombre: result.user.displayName || result.user.email,
          email: result.user.email,
          role: "customer",
          createdAt: new Date()
        });
      }
      
      const userDoc = await getDoc(userRef);
      if (userDoc.exists() && userDoc.data().role === "admin") {
        window.location.href = "dashboard.html";
      } else {
        redirectAfterLogin();
      }
    } catch (err) {
      errorMsg.textContent = "❌ " + friendlyError(err.code);
    }
  });

  // ── GitHub ────────────────────────────────────────────────
  document.getElementById('github-btn')?.addEventListener('click', async () => {
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          nombre: result.user.displayName || result.user.email,
          email: result.user.email,
          role: "customer",
          createdAt: new Date()
        }, { merge: true });
      }
      
      const userDoc = await getDoc(userRef);
      if (userDoc.exists() && userDoc.data().role === "admin") {
        window.location.href = "dashboard.html";
      } else {
        redirectAfterLogin();
      }
    } catch (err) {
      errorMsg.textContent = "❌ " + friendlyError(err.code);
    }
  });

  // ── Twitter / X ───────────────────────────────────────────
  document.getElementById('twitter-btn')?.addEventListener('click', async () => {
    try {
      const provider = new TwitterAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          nombre: result.user.displayName || "Usuario",
          email: result.user.email || "",
          role: "customer",
          createdAt: new Date()
        }, { merge: true });
      }
      
      const userDoc = await getDoc(userRef);
      if (userDoc.exists() && userDoc.data().role === "admin") {
        window.location.href = "dashboard.html";
      } else {
        redirectAfterLogin();
      }
    } catch (err) {
      errorMsg.textContent = "❌ " + friendlyError(err.code);
    }
  });

  // ── Si ya está logueado, redirigir según rol ────────────────
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "admin") {
        if (window.location.pathname.includes("login.html") || window.location.pathname.includes("reservaciones.html")) {
          window.location.href = "dashboard.html";
        }
      } else if (window.location.pathname.includes("dashboard.html")) {
        window.location.href = "reservaciones.html";
      } else {
        redirectAfterLogin();
      }
    }
  });
}

// ============================================================
// CERRAR SESIÓN (global)
// ============================================================
export async function logout() {
  await signOut(auth);
  window.location.href = "index.html";
}

// ============================================================
// HELPERS INTERNOS
// ============================================================
function redirectAfterLogin() {
  const destino = sessionStorage.getItem('redirectAfterLogin') || "reservaciones.html";
  sessionStorage.removeItem('redirectAfterLogin');
  window.location.href = destino;
}

function friendlyError(code) {
  const errors = {
    'auth/user-not-found':       'No existe una cuenta con ese correo.',
    'auth/wrong-password':       'Contraseña incorrecta.',
    'auth/email-already-in-use': 'Ese correo ya está registrado.',
    'auth/weak-password':        'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-email':        'El correo no es válido.',
    'auth/popup-closed-by-user': 'Cerraste la ventana antes de completar el login.',
  };
  return errors[code] || 'Error inesperado. Intenta de nuevo.';
}

// Exponer globalmente para onclick en HTML
window.initAuth = initAuth;
window.logout   = logout;