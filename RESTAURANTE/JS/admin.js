// JS/admin.js
import { auth, db } from './firebase.js';
import { 
    onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import { 
    collection, addDoc, query, where, onSnapshot, orderBy, 
    doc, getDoc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import { requireAdmin } from './auth.js';

// ==================== REFERENCIAS AL DOM ====================
const taskList = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const welcomeMsg = document.getElementById('welcome-msg');
const btnLogout = document.getElementById('btn-logout');
const menuList = document.getElementById('menu-list');
const menuForm = document.getElementById('menu-form');

// ==================== VERIFICAR ADMIN ====================
requireAdmin(async (user) => {
    // Cargar nombre del admin
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const nombre = userDoc.data().nombre || user.email;
            welcomeMsg.innerText = `👑 Panel de Administrador - ${nombre}`;
        }
    } catch (e) {
        console.error("Error al cargar nombre:", e);
    }

    // Cargar tareas y menú
    cargarTareas(user.uid);
    cargarMenu();
});

// ==================== GUARDAR NUEVA TAREA ====================
if (taskForm) {
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) return;

        const titulo = document.getElementById('task-title').value.trim();
        const fecha = document.getElementById('task-date').value;

        if (!titulo || !fecha) {
            alert("Por favor completa título y fecha");
            return;
        }

        try {
            await addDoc(collection(db, "tareas"), {
                userId: user.uid,
                titulo: titulo,
                fecha: fecha,
                completada: false,
                timestamp: new Date()
            });

            taskForm.reset();
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Error al guardar la tarea");
        }
    });
}

// ==================== GUARDAR NUEVO PLATILLO ====================
if (menuForm) {
    menuForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('menu-nombre').value.trim();
        const descripcion = document.getElementById('menu-descripcion').value.trim();
        const precio = document.getElementById('menu-precio').value;
        const categoria = document.getElementById('menu-categoria').value;
        const imagen = document.getElementById('menu-imagen').value.trim();

        if (!nombre || !descripcion || !precio || !categoria) {
            alert("Por favor completa todos los campos");
            return;
        }

        try {
            await addDoc(collection(db, "menu"), {
                nombre: nombre,
                descripcion: descripcion,
                precio: parseFloat(precio),
                categoria: categoria,
                imagen: imagen || "https://picsum.photos/id/201/400/250",
                createdAt: new Date()
            });

            menuForm.reset();
            alert("Platillo agregado exitosamente");
        } catch (error) {
            console.error("Error al guardar platillo:", error);
            alert("Error al guardar el platillo");
        }
    });
}

// ==================== CARGAR TAREAS EN TIEMPO REAL ====================
function cargarTareas(uid) {
    if (!taskList) return;

    const q = query(
        collection(db, "tareas"),
        where("userId", "==", uid),
        orderBy("timestamp", "desc")
    );

    onSnapshot(q, (snapshot) => {
        taskList.innerHTML = '';

        if (snapshot.empty) {
            taskList.innerHTML = `<p style="text-align:center; color:#666; padding:20px;">
                No hay tareas pendientes
            </p>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const tarea = docSnap.data();
            const id = docSnap.id;

            const taskEl = document.createElement('div');
            taskEl.className = `task-item ${tarea.completada ? 'completed' : ''}`;
            taskEl.dataset.id = id;

            taskEl.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${tarea.completada ? 'checked' : ''}>
                
                <div class="task-content">
                    <p class="task-title">${tarea.titulo}</p>
                    <p class="task-date">📅 ${new Date(tarea.fecha).toLocaleString('es-MX')}</p>
                </div>

                <div class="task-actions">
                    <button class="btn-edit" title="Editar">✏️</button>
                    <button class="btn-delete" title="Eliminar">🗑️</button>
                </div>
            `;

            const checkbox = taskEl.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleCompletada(id, checkbox.checked));

            taskEl.querySelector('.btn-edit').addEventListener('click', () => editarTarea(id, tarea));
            taskEl.querySelector('.btn-delete').addEventListener('click', () => eliminarTarea(id));

            taskList.appendChild(taskEl);
        });
    });
}

// ==================== CARGAR MENÚ EN TIEMPO REAL ====================
function cargarMenu() {
    if (!menuList) return;

    const q = query(
        collection(db, "menu"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        menuList.innerHTML = '';

        if (snapshot.empty) {
            menuList.innerHTML = `<p style="text-align:center; color:#666; padding:20px;">
                No hay platillos en el menú
            </p>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const platillo = docSnap.data();
            const id = docSnap.id;

            const menuEl = document.createElement('div');
            menuEl.className = 'menu-item';
            menuEl.dataset.id = id;

            menuEl.innerHTML = `
                <div class="menu-item-image">
                    <img src="${platillo.imagen}" alt="${platillo.nombre}" style="width:100px; height:100px; object-fit:cover; border-radius:8px;">
                </div>
                <div class="menu-item-content">
                    <h4>${platillo.nombre}</h4>
                    <p class="menu-descripcion">${platillo.descripcion}</p>
                    <p class="menu-categoria">🏷️ ${platillo.categoria}</p>
                    <p class="menu-precio">💰 $${platillo.precio}</p>
                </div>
                <div class="menu-item-actions">
                    <button class="btn-edit-menu" title="Editar">✏️</button>
                    <button class="btn-delete-menu" title="Eliminar">🗑️</button>
                </div>
            `;

            menuEl.querySelector('.btn-edit-menu').addEventListener('click', () => editarPlatillo(id, platillo));
            menuEl.querySelector('.btn-delete-menu').addEventListener('click', () => eliminarPlatillo(id));

            menuList.appendChild(menuEl);
        });
    });
}

// ==================== FUNCIONES DE TAREAS ====================
async function toggleCompletada(taskId, completada) {
    try {
        await updateDoc(doc(db, "tareas", taskId), { completada });
    } catch (e) {
        console.error("Error al actualizar:", e);
    }
}

async function eliminarTarea(taskId) {
    if (!confirm("¿Estás seguro de eliminar esta tarea?")) return;

    try {
        await deleteDoc(doc(db, "tareas", taskId));
    } catch (e) {
        console.error("Error al eliminar:", e);
        alert("No se pudo eliminar la tarea");
    }
}

async function editarTarea(taskId, tareaActual) {
    const nuevoTitulo = prompt("Editar título:", tareaActual.titulo);
    if (nuevoTitulo === null) return;

    const nuevaFecha = prompt("Editar fecha (YYYY-MM-DDTHH:mm):", tareaActual.fecha);
    if (nuevaFecha === null) return;

    try {
        await updateDoc(doc(db, "tareas", taskId), {
            titulo: nuevoTitulo.trim(),
            fecha: nuevaFecha
        });
    } catch (e) {
        console.error("Error al editar:", e);
        alert("No se pudo editar la tarea");
    }
}

// ==================== FUNCIONES DEL MENÚ ====================
async function eliminarPlatillo(menuId) {
    if (!confirm("¿Estás seguro de eliminar este platillo del menú?")) return;

    try {
        await deleteDoc(doc(db, "menu", menuId));
        alert("Platillo eliminado exitosamente");
    } catch (e) {
        console.error("Error al eliminar:", e);
        alert("No se pudo eliminar el platillo");
    }
}

async function editarPlatillo(menuId, platilloActual) {
    const nuevoNombre = prompt("Editar nombre:", platilloActual.nombre);
    if (nuevoNombre === null) return;

    const nuevaDescripcion = prompt("Editar descripción:", platilloActual.descripcion);
    if (nuevaDescripcion === null) return;

    const nuevoPrecio = prompt("Editar precio:", platilloActual.precio);
    if (nuevoPrecio === null) return;

    const nuevaCategoria = prompt("Editar categoría (entradas/principales/postres):", platilloActual.categoria);
    if (nuevaCategoria === null) return;

    try {
        await updateDoc(doc(db, "menu", menuId), {
            nombre: nuevoNombre.trim(),
            descripcion: nuevaDescripcion.trim(),
            precio: parseFloat(nuevoPrecio),
            categoria: nuevaCategoria.trim()
        });
        alert("Platillo actualizado exitosamente");
    } catch (e) {
        console.error("Error al editar:", e);
        alert("No se pudo editar el platillo");
    }
}

// ==================== CERRAR SESIÓN ====================
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = "login.html";
        }).catch(err => console.error(err));
    });
}