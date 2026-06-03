/* js/perfil.js */

/**
 * Inicializador principal: pinta datos del perfil privado y estadísticas personales.
 */
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosPersonales(); 
    cargarEstadisticasYActividad(); // Ahora llama a MySQL
    renderizarSolicitudesCanchas(); 
});

/**
 * Lee la información del usuario del "sessionState" (localStorage) 
 * para pintar campos base como el nombre, la inicial y la ciudad.
 */
function cargarDatosPersonales() {
    const usuarioGuardado = localStorage.getItem('usuarioLogueado');

    if (!usuarioGuardado) {
        window.location.replace('login.html');
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);

    const avatarEl = document.getElementById('perfil-avatar');
    if (avatarEl && usuario.nombre) {
        avatarEl.innerText = usuario.nombre.charAt(0).toUpperCase();
    }

    const nombreEl = document.getElementById('perfil-nombre');
    if (nombreEl) {
        nombreEl.value = `${usuario.nombre} ${usuario.apellidos || ''}`.trim();
    }

    const ciudadEl = document.getElementById('perfil-ciudad');
    if (ciudadEl) {
        ciudadEl.value = usuario.ciudad || '';
    }

    const rolEl = document.getElementById('perfil-rol');
    if (rolEl) {
        rolEl.value = (usuario.rol === 'ADMIN') ? 'Administrador 🛡️' : 'Jugador Oficial ⚽';
    }

    const estrellasEl = document.getElementById('perfil-estrellas');
    if (estrellasEl) {
        const nota = usuario.medVal || 0; 
        let estrellasHTML = '';
        
        for (let i = 1; i <= 5; i++) {
            if (i <= nota) {
                estrellasHTML += '★ '; 
            } else {
                estrellasHTML += '<span class="star-empty">★</span> '; 
            }
        }
        estrellasHTML += `<span style="font-size: 0.8em; color: #333; margin-left: 10px;">(${nota}/5)</span>`;
        estrellasEl.innerHTML = estrellasHTML.trim();
    }
}

/**
 * Realiza una consulta con ID propio a mysql. Extrae estadisticas (Partidos jugados,
 * canchas, etc.) calculando sus porcentajes, y además dibuja el feed listado de tu actividad reciente.
 */
function cargarEstadisticasYActividad() {
    const usuarioGuardado = localStorage.getItem('usuarioLogueado');
    if (!usuarioGuardado) return;
    const usuario = JSON.parse(usuarioGuardado);

    fetch(`https://faltauno-be-host.onrender.com/api/usuarios/${usuario.id}/estadisticas`)
    .then(res => {
        if (!res.ok) throw new Error("No se pudieron obtener las estadísticas");
        return res.json();
    })
    .then(stats => {
        const maxPartidos = 100;
        const maxAlertas = 50;
        const maxPistas = 20;

        const elemPartidos = document.getElementById('stat-partidos');
        const barPartidos = document.getElementById('bar-partidos');
        if (elemPartidos) elemPartidos.innerText = `Partidos jugados (${stats.partidosJugados})`;
        if (barPartidos) barPartidos.style.width = `${Math.min((stats.partidosJugados / maxPartidos) * 100, 100)}%`;

        const elemAlertas = document.getElementById('stat-alertas');
        const barAlertas = document.getElementById('bar-alertas');
        if (elemAlertas) elemAlertas.innerText = `Alertas Enviadas (${stats.alertasEnviadas})`;
        if (barAlertas) barAlertas.style.width = `${Math.min((stats.alertasEnviadas / maxAlertas) * 100, 100)}%`;

        const elemPistas = document.getElementById('stat-pistas');
        const barPistas = document.getElementById('bar-pistas');
        if (elemPistas) elemPistas.innerText = `Pistas descubiertas (${stats.pistasDescubiertas})`;
        if (barPistas) barPistas.style.width = `${Math.min((stats.pistasDescubiertas / maxPistas) * 100, 100)}%`;

        const listaActividad = document.getElementById('lista-actividad');
        if (listaActividad && stats.actividadReciente) {
            listaActividad.innerHTML = ''; 
            stats.actividadReciente.forEach(act => {
                const li = document.createElement('li');
                li.innerText = act;
                listaActividad.appendChild(li);
            });
        }
    })
    .catch(err => {
        console.error(err);
        const listaActividad = document.getElementById('lista-actividad');
        if (listaActividad) {
            listaActividad.innerHTML = `<li>⚠️ No se pudo conectar con MySQL para cargar tu actividad.</li>`;
        }
    });
}

/**
 * Repasa las solicitudes de pista que ha propuesto el usuario 
 * y las dibuja como filas  de tabla asignando una etiquetaç
 */
function renderizarSolicitudesCanchas() {
    const tablaCuerpo = document.getElementById('requests-table-body');
    if (!tablaCuerpo) return;

    // Solo leemos las solicitudes que el usuario ha creado realmente (guardadas en memoria temporal)
    const misSolicitudes = JSON.parse(localStorage.getItem('misSolicitudes')) || [];

    tablaCuerpo.innerHTML = '';

   
    if (misSolicitudes.length === 0) {
        tablaCuerpo.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; color:#888; padding: 20px;">
                    Aún no has propuesto ninguna cancha. 
                </td>
            </tr>`;
        return;
    }

    misSolicitudes.forEach(solicitud => {
        const fila = document.createElement('tr');
        
        let claseBadge = 'status-pending';
        if (solicitud.estado === 'Aprobada' || solicitud.estado === 'ACTIVA') claseBadge = 'status-approved';
        if (solicitud.estado === 'Rechazada' || solicitud.estado === 'INACTIVA') claseBadge = 'status-rejected';

        fila.innerHTML = `
            <td>${solicitud.nombre}</td>
            <td>${solicitud.fecha || new Date().toLocaleDateString('es-ES')}</td>
            <td>${solicitud.deporte}</td>
            <td><span class="status-badge ${claseBadge}">${solicitud.estado || 'Pendiente'}</span></td>
        `;
        
        tablaCuerpo.appendChild(fila);
    });
}