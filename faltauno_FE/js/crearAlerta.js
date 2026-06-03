/* js/crearAlerta.js */

let mapa; 
let idCanchaSeleccionada = null; 

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
    cargarCanchas();
});

// Monta el mapa. 
function inicializarMapa() {
    const contenedorMapa = document.getElementById('map');
    
    if (!contenedorMapa) {
        console.error("No se encontró el mapa en el HTML.");
        return;
    }

    // Inicializamos el mapa centrado
    mapa = L.map('map').setView([42.3367, -7.8641], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapa);

    //Obligamos al mapa a recalcular su tamaño para que no salga gris
    setTimeout(function() {
        mapa.invalidateSize();
    }, 200);
}

// Trae las pistas al mapa, pinta chinchetas y se guarda el ID de la que pinches en la variable global.
function cargarCanchas() {
    fetch('https://faltauno-be-host.onrender.com/api/pistas')
    .then(res => res.json())
    .then(pistas => {
        pistas.forEach(pista => {
            if (mapa && pista.latitud && pista.longitud) {
                const marcador = L.marker([pista.latitud, pista.longitud]).addTo(mapa);
                
                marcador.bindPopup(`<b>${pista.nombre}</b><br>Deporte: ${pista.deporte}`);
                
                // Al hacer clic en la chincheta
                marcador.on('click', () => {
                    idCanchaSeleccionada = pista.id;
                    
                    // CORRECCIÓN: Usamos el ID correcto del HTML actual ("cancha-nombre")
                    const texto = document.getElementById('cancha-nombre');
                    if (texto) {
                        texto.innerText = pista.nombre;
                        texto.style.color = '#ff6b00'; // Naranja corporativo
                    }
                });
            }
        });
    })
    .catch(err => console.error("Error al cargar las canchas:", err));
}

// Pilla lo que haya en el formulario, monta el JSON de la nueva pachanga y tira el POST.
function publicarAlerta(e) {
    if(e) e.preventDefault();

    const deporte = document.querySelector('input[name="deporte"]:checked')?.value || 'Fútbol';
    const fechaHora = document.getElementById('fecha-hora')?.value; // Corregido ID a fecha-hora
    const numJugadores = document.getElementById('num-jugadores')?.value || 1;
    const edadMin = document.getElementById('edad-min')?.value || 16;
    const edadMax = document.getElementById('edad-max')?.value || 99;
    const info = document.getElementById('info-extra')?.value || ''; 

    if (!fechaHora) {
        if(typeof mostrarNotificacion === 'function') mostrarNotificacion('Por favor, selecciona la fecha y la hora', 'error');
        else alert('Selecciona fecha y hora');
        return;
    }
    
    if (!idCanchaSeleccionada) {
        if(typeof mostrarNotificacion === 'function') mostrarNotificacion('Selecciona una cancha en el mapa', 'error');
        else alert('Selecciona una cancha en el mapa');
        return;
    }

    const idUsuarioReal = localStorage.getItem('userId') || 1;

    const nuevaAlerta = {
        deporte: deporte,
        fechaHora: fechaHora,
        numJugadores: parseInt(numJugadores),
        jugadoresFaltantes: parseInt(numJugadores), 
        rangoEdadMin: parseInt(edadMin),
        rangoEdadMax: parseInt(edadMax),
        informacionAdicional: info,
        pista: { id: idCanchaSeleccionada }, 
        usuario: { id: parseInt(idUsuarioReal) }, 
        estado: "ACTIVA" 
    };

    fetch('https://faltauno-be-host.onrender.com/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaAlerta)
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al guardar en BD");
        
        if(typeof mostrarNotificacion === 'function') mostrarNotificacion('¡Alerta creada con éxito!', 'exito');
        else alert('Alerta creada!');
        
        setTimeout(() => { window.location.href = 'feed.html'; }, 1500);
    })
    .catch(err => {
        console.error(err);
        if(typeof mostrarNotificacion === 'function') mostrarNotificacion('Error al crear la alerta', 'error');
    });
}