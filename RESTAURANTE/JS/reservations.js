// JS/reservations.js
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { db } from "./firebase.js";
import { requireAuth } from "./auth.js";

// ============================================================
// PROTEGER LA PÁGINA: si no hay sesión → login
// ============================================================
requireAuth((user) => {
  console.log("✅ Sesión activa:", user.email);
  // Opcional: mostrar nombre del usuario en la página
  const bienvenida = document.getElementById('user-welcome');
  if (bienvenida) bienvenida.textContent = `Hola, ${user.displayName || user.email}`;
});

// ============================================================
// GUARDAR RESERVACIÓN (solo si hay sesión)
// ============================================================
export async function saveReservation(data) {
  const { auth } = await import("./firebase.js");
  const { getAuth } = await import("https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js");

  // Doble verificación de seguridad antes de guardar
  const currentUser = getAuth().currentUser;
  if (!currentUser) {
    alert("Tu sesión expiró. Por favor inicia sesión de nuevo.");
    window.location.href = "login.html";
    return;
  }

  try {
    await addDoc(collection(db, "reservations"), {
      ...data,
      userId: currentUser.uid,        // ← asociar reservación al usuario
      userEmail: currentUser.email,
      status: "confirmed",
      timestamp: serverTimestamp()
    });
    alert("✅ ¡Reservación confirmada! Te esperamos en Masala Palace.");
    document.getElementById("reservationForm").reset();
  } catch (error) {
    console.error(error);
    alert("Error al guardar la reservación. Intenta de nuevo.");
  }
}

window.saveReservation = saveReservation;
