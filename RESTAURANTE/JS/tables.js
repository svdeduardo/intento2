// JS/tables.js
import { collection, onSnapshot, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { db } from "./firebase.js";   // ← AÑADIR

export function loadTables() {
  const tablesRef = collection(db, "tables");

  onSnapshot(tablesRef, (snapshot) => {
    const container = document.getElementById("tablesGrid");
    container.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const table = docSnap.data();
      const statusClass = table.status === "free" ? "table-free" : "table-occupied";
      const statusText = table.status === "free" ? "🟢 Libre" : "🔴 Ocupada";

      container.innerHTML += `
        <div class="col-lg-3 col-md-4 col-6 mb-4">
          <div class="card table-card ${statusClass} h-100 text-center" onclick="toggleTable('${docSnap.id}')">
            <div class="card-body">
              <h3>Mesa ${docSnap.id}</h3>
              <p class="fs-5 fw-bold">${statusText}</p>
              <small>${table.capacity || 4} personas</small>
            </div>
          </div>
        </div>`;
    });
  });
}

export async function toggleTable(tableId) {
  const tableRef = doc(db, "tables", tableId);
  const tableSnap = await getDoc(tableRef);
  if (!tableSnap.exists()) return;
  
  const newStatus = tableSnap.data().status === "free" ? "occupied" : "free";
  await updateDoc(tableRef, { status: newStatus });
}

window.loadTables = loadTables;
window.toggleTable = toggleTable;