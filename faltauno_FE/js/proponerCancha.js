/* js/proponerCancha.js */

let mapa;
let marcadorTemporal = null; 
let latSeleccionada = null;
let lngSeleccionada = null;

// ==========================================
// 0. SEGURIDAD: CORTAFUEGOS PARA INVITADOS
// ==========================================
const rolUsuario = localStorage.getItem('rol');
if (!rolUsuario || rolUsuario === 'invitado') {
    sessionStorage.setItem('alertaRebote', 'Acceso denegado: Debes iniciar sesión para usar esta función.');
    window.location.replace('login.html');
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarMapa();
});

// Arranca Leaflet y prepara el evento del clic para sacar las coordenadas.
// Recoge los datos de los inputs y hace el POST al backend mandando la pista como PENDIENTE.
function inicializarMapa() {

    const contenedorMapa = document.getElementById('map');
    if (!contenedorMapa) {
        console.error("No se encontró el contenedor del mapa en el HTML.");
        return;
    }

    mapa = L.map('map').setView([42.3367, -7.8641], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapa);

    setTimeout(() => { mapa.invalidateSize(); }, 100);
    setTimeout(() => { mapa.invalidateSize(); }, 600);

    // Evento al hacer clic en el mapa
    mapa.on('click', function(e) {
        latSeleccionada = e.latlng.lat;
        lngSeleccionada = e.latlng.lng;

        // Movemos o creamos la chincheta
        if (marcadorTemporal) {
            marcadorTemporal.setLatLng(e.latlng);
        } else {
            marcadorTemporal = L.marker(e.latlng).addTo(mapa);
        }

        const textoAviso = document.getElementById('coordenadas-texto');
        if (textoAviso) {
            textoAviso.innerText = `${latSeleccionada.toFixed(5)}, ${lngSeleccionada.toFixed(5)}`;
            textoAviso.style.color = "#10b981"; // Verde neón para confirmar
        }
    });
}


function enviarSolicitud(e) {
    if (e) e.preventDefault();

    if (!latSeleccionada || !lngSeleccionada) {
        if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Por favor, haz clic en el mapa para marcar la ubicación.', 'error');
        else alert('Por favor, haz clic en el mapa para marcar la ubicación.');
        return;
    }

    //Recogemos los datos usando los IDs del panel derecho
    const nombre = document.getElementById('nombre-cancha')?.value;
    const deporte = document.getElementById('deporte-cancha')?.value;
    const conservacion = document.getElementById('estado-cancha')?.value;

    if (!nombre || !deporte || !conservacion) {
        if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Por favor, rellena todos los campos del formulario.', 'error');
        else alert('Por favor, rellena todos los campos obligatorios.');
        return;
    }

    const nuevaPista = {
        nombre: nombre,
        deporte: deporte,
        latitud: latSeleccionada,
        longitud: lngSeleccionada,
        estadoConservacion: conservacion,
        estado: "PENDIENTE" // Lo mandamos como PENDIENTE a la base de datos
    };

    fetch('https://faltauno-be-host.onrender.com/api/pistas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaPista)
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al enviar la pista");
        return res.json();
    })
    .then(data => {
        if (typeof mostrarNotificacion === 'function') mostrarNotificacion('¡Cancha propuesta con éxito! Un administrador la revisará.', 'exito');
        else alert('¡Cancha propuesta con éxito!');
        
        setTimeout(() => { window.location.href = 'inicio.html'; }, 2000);
    })
    .catch(err => {
        console.error(err);
        if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Hubo un error al enviar tu propuesta.', 'error');
        else alert('Hubo un error al enviar tu propuesta.');
    });
}