/* js/admin.js */

// ==========================================
// 0. SEGURIDAD: CORTAFUEGOS INSTANTÁNEO (EFECTO REBOTE)
// ==========================================
const usuarioGuardado = localStorage.getItem('usuarioLogueado');
let esAdmin = false;

if (!usuarioGuardado) {
    window.location.replace('login.html');
} else {
    const usuario = JSON.parse(usuarioGuardado);
    
    if (usuario.rol && usuario.rol.toUpperCase() === 'ADMIN') {
        esAdmin = true; // Tiene pase VIP, puede continuar cargando la página
    } else {
        sessionStorage.setItem('alertaRebote', 'Acceso Denegado: Esta zona es exclusiva para administradores.');
        window.location.replace('inicio.html');
    }
}

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let usuariosApp = []; 
let usuarioSeleccionadoParaBan = null;

// ==========================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    if (!esAdmin) return;

    cargarUsuariosReales();   // Carga los usuarios de la BD
    cargarPistasPendientes(); // Carga las pistas de la BD
});

// ==========================================
// 1. CARGA DE USUARIOS REALES DESDE MYSQL
// ==========================================
function cargarUsuariosReales() {
    fetch('https://faltauno-be-host.onrender.com/api/usuarios')
    .then(res => res.json())
    .then(usuarios => {
        usuariosApp = usuarios;
        renderizarUsuarios();
        actualizarEstadisticasAdmin(); 
    })
    .catch(err => {
        console.error("Error al cargar usuarios de MySQL:", err);
        mostrarNotificacion("Error al conectar con la base de datos.", "error");
    });
}

// ==========================================
// 2. ACTUALIZACIÓN DE ESTADÍSTICAS (PANEL IZQUIERDO)
// ==========================================
function actualizarEstadisticasAdmin() {
    // Contamos los usuarios que NO están baneados
    let activos = usuariosApp.filter(u => u.estado !== 'BANEADO').length;

    const statUsuarios = document.getElementById('stat-usuarios');
    if (statUsuarios) statUsuarios.innerText = activos;
    
    // Las alertas totales por ahora las dejamos fijas o simuladas hasta tener su endpoint general
    const statAlertas = document.getElementById('stat-alertas'); 
    if (statAlertas) statAlertas.innerText = '3'; 
}


// ==========================================
// 3. LÓGICA DE USUARIOS Y MODERACIÓN (PANEL DERECHO)
// ==========================================
function renderizarUsuarios(filtroTexto = "") {
    const contenedor = document.getElementById('admin-user-list');
    if (!contenedor) return;

    contenedor.innerHTML = "";
    
    // Filtrado en vivo por nombre o email
    const usuariosFiltrados = usuariosApp.filter(u => 
        u.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) || 
        u.email.toLowerCase().includes(filtroTexto.toLowerCase())
    );

    if(usuariosFiltrados.length === 0) {
        contenedor.innerHTML = `<div style="padding: 15px; text-align: center; color: #888;">No se encontraron usuarios.</div>`;
        return;
    }

    usuariosFiltrados.forEach(usuario => {
        const row = document.createElement('div');
        row.className = 'admin-user-row';
        
        // Comprobamos el estado (BANEADO o ACTIVO)
        const estaBaneado = usuario.estado === 'BANEADO';
        const badgeClass = estaBaneado ? 'badge-banned' : 'badge-active';
        const textoEstado = estaBaneado ? 'Baneado' : 'Activo';
        const inicial = usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : '?';

        // Ocultamos tu propio usuario para que no te puedas auto-banear por error
        const idUsuarioLogueado = localStorage.getItem('userId');
        if (usuario.id == idUsuarioLogueado) return; 

        let botonHtml = !estaBaneado 
            ? `<button class="btn-action-small btn-sancionar" onclick="prepararBan(${usuario.id}, '${usuario.nombre}')">Sancionar</button>`
            : `<button class="btn-action-small btn-perdonar" onclick="levantarBan(${usuario.id})">Desbanear</button>`;

        row.innerHTML = `
            <div class="admin-user-info">
                <div class="admin-avatar-mini" style="background-color: #3498db;">${inicial}</div>
                <div class="admin-user-details">
                    <h4>${usuario.nombre}</h4>
                    <p>${usuario.email}</p>
                    <span class="badge-status ${badgeClass}">${textoEstado}</span>
                </div>
            </div>
            <div>
                ${botonHtml}
            </div>
        `;
        contenedor.appendChild(row);
    });
}

// Le pega un fetch a Spring Boot, se trae el array de todos los users y los manda pintar.
// Va creando el HTML de la lista de usuarios. Les pone un badge rojo o verde si están baneados.
function filtrarUsuarios() {
    const texto = document.getElementById('admin-search-user').value;
    renderizarUsuarios(texto);
}

function prepararBan(id, nombre) {
    usuarioSeleccionadoParaBan = id;
    const targetName = document.getElementById('ban-target-name');
    if (targetName) targetName.innerText = nombre;
    
    const banPanel = document.getElementById('ban-panel');
    if (banPanel) {
        banPanel.style.display = 'block';
        banPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function cancelarBan() {
    usuarioSeleccionadoParaBan = null;
    const banPanel = document.getElementById('ban-panel');
    if (banPanel) banPanel.style.display = 'none';
    
    const banDate = document.getElementById('ban-date');
    const banReason = document.getElementById('ban-reason');
    if (banDate) banDate.value = '';
    if (banReason) banReason.value = '';
}

// Manda un PUT al back para banear  a un usuario 
function ejecutarBan() {
    const fecha = document.getElementById('ban-date')?.value;
    const motivo = document.getElementById('ban-reason')?.value;

    if(!fecha || !motivo) {
        mostrarNotificacion("Debes indicar la fecha límite y el motivo de la sanción.", "error");
        return;
    }

    fetch(`https://faltauno-be-host.onrender.com/api/usuarios/${usuarioSeleccionadoParaBan}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: "BANEADO" })
    })
    .then(res => {
        if (!res.ok) throw new Error("Error en el servidor");
        mostrarNotificacion("El usuario ha sido baneado de la plataforma.", "exito");
        cancelarBan();
        cargarUsuariosReales(); // Recargamos la lista actualizada desde MySQL
    })
    .catch(err => {
        console.error(err);
        mostrarNotificacion("No se pudo banear al usuario.", "error");
    });
}

// Manda el PUT al back para devolverle el acceso  a un usuario.
function levantarBan(id) {
    fetch(`https://faltauno-be-host.onrender.com/api/usuarios/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: "ACTIVO" }) // Restauramos estado
    })
    .then(res => {
        if (!res.ok) throw new Error("Error en el servidor");
        mostrarNotificacion("Se ha restaurado el acceso al usuario.", "exito");
        cargarUsuariosReales(); // Recargamos la lista actualizada desde MySQL
    })
    .catch(err => {
        console.error(err);
        mostrarNotificacion("No se pudo desbanear al usuario.", "error");
    });
}


// ==========================================
// 4. LÓGICA DINÁMICA DE PISTAS (COLA DE REVISIÓN)
// ==========================================
function cargarPistasPendientes() {
    const contenedor = document.getElementById('admin-pistas-list');
    if (!contenedor) return;

    fetch('https://faltauno-be-host.onrender.com/api/pistas/pendientes')
    .then(res => res.json())
    .then(pendientes => {
        // Actualizamos el contador visual del panel izquierdo
        const statPistas = document.getElementById('stat-pistas');
        if (statPistas) statPistas.innerText = pendientes.length;

        if (pendientes.length === 0) {
            contenedor.innerHTML = `
                <div style="text-align:center; padding:50px 20px; color:#888; background:#f9fbf9; border-radius:8px;">
                    <span style="font-size:3em;">🎉</span><br>
                    <b style="color:var(--text-main); font-size:1.2em;">¡Todo al día!</b><br>
                    Has revisado todas las canchas pendientes.
                </div>`;
            return;
        }

        contenedor.innerHTML = ''; 
        const pista = pendientes[0]; 

        const card = document.createElement('div');
        card.className = 'single-review-card';
        card.id = `pista-pendiente-${pista.id}`;

        card.innerHTML = `
            <div style="padding: 10px 15px; background: #f4f7f6; font-size: 0.85em; font-weight: bold; border-bottom: 1px solid #e1e8ed; display:flex; justify-content: space-between;">
                <span>REVISIÓN EN COLA</span>
                <span>Quedan: ${pendientes.length}</span>
            </div>
            <div id="mapa-admin-${pista.id}" style="height: 250px; z-index: 1; border-bottom: 1px solid #e1e8ed;"></div>
            <div class="court-details" style="padding: 15px;">
                <h4 style="margin: 0 0 8px 0; font-size: 1.2em;">${pista.nombre}</h4>
                <p style="margin: 0 0 5px 0; color: #666;"><b>Deporte:</b> ${pista.deporte}</p>
                <p style="margin: 0 0 5px 0; color: #666;"><b>Estado:</b> ${pista.estadoConservacion}</p>
            </div>
            <div class="court-actions" style="display: flex; gap: 10px; padding: 0 15px 15px 15px;">
                <button class="btn btn-approve" style="flex:1;" onclick="gestionarPistaDinamica(${pista.id}, 'ACTIVA')">Aprobar</button>
                <button class="btn btn-reject" style="flex:1;" onclick="gestionarPistaDinamica(${pista.id}, 'INACTIVA')">Rechazar</button>
            </div>
        `;
        contenedor.appendChild(card);

        // Renderizar mini mapa Leaflet
        setTimeout(() => {
            const mapAdmin = L.map(`mapa-admin-${pista.id}`, { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([pista.latitud, pista.longitud], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapAdmin);
            L.marker([pista.latitud, pista.longitud]).addTo(mapAdmin); 
        }, 50);
    })
    .catch(err => console.error("Error cargando pistas pendientes:", err));
}

// Se trae del back las canchas en estado PENDIENTE. 
// Coge solo la primera del array y le monta la tarjeta con el minimapa para evaluarla.
// Actualiza la pista en base de datos. Si le das a Aprobar manda ACTIVA, si no INACTIVA.
function gestionarPistaDinamica(id, nuevoEstado) {
    fetch(`https://faltauno-be-host.onrender.com/api/pistas/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
    })
    .then(res => {
        if(res.ok) {
            mostrarNotificacion(nuevoEstado === 'ACTIVA' ? 'Cancha aprobada con éxito.' : 'Cancha rechazada y descartada.', nuevoEstado === 'ACTIVA' ? 'exito' : 'error');
            const divPista = document.getElementById(`pista-pendiente-${id}`);
            if (divPista) {
                divPista.style.transition = 'all 0.3s ease'; 
                divPista.style.opacity = '0'; 
                divPista.style.transform = 'translateX(50px)';
                setTimeout(() => { cargarPistasPendientes(); }, 300); 
            }
        } else {
            mostrarNotificacion("Error en el servidor al intentar actualizar el estado de la pista.", "error");
        }
    })
    .catch(err => {
        console.error("Error al gestionar la pista:", err);
        mostrarNotificacion("No se pudo conectar con el servidor.", "error");
    });
}