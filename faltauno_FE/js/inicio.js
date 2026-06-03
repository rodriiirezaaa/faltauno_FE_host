/* js/inicio.js */

let map;
let marcadoresCapa; 
let todasLasPistas = []; 
let todasLasAlertas = []; // Añadido para guardar las pachangas

const iconoAzul = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const iconoNaranja = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Cuando carga el DOM, arrancamos el mapa y le ponemos la oreja al selector de filtros.
document.addEventListener('DOMContentLoaded', () => {
    inicializarMapaInicio();
    
    const selectFiltro = document.getElementById('filtro-estado');
    if(selectFiltro) {
        selectFiltro.addEventListener('change', aplicarFiltroCalidad);
    }
});

// Monta el mapa de Leaflet, hace un fetch de pistas y pachangas, y las pinta. 
// Si el backend de Java está frito, te avisa por pantalla para que no te vuelvas loco.
async function inicializarMapaInicio() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    map = L.map('map').setView([42.3358, -7.8639], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    marcadoresCapa = L.layerGroup().addTo(map);

    const listaCanchas = document.getElementById('lista-canchas');
    if (listaCanchas) {
        listaCanchas.innerHTML = '<div style="padding:20px; text-align:center; color:#888;">Cargando mapa de canchas...</div>';
    }

    try {
        // 1. Pedimos las pistas (Si esto falla, detenemos todo porque sin pistas no hay mapa)
        const resPistas = await fetch('https://faltauno-be-host.onrender.com/api/pistas');
        if (!resPistas.ok) throw new Error("Error conectando con Java al cargar pistas");
        todasLasPistas = await resPistas.json();

        // 2. Pedimos las alertas (Envuelto en su propio try-catch para que NO rompa el mapa si falla)
        let alertasData = [];
        try {
            const resAlertas = await fetch('https://faltauno-be-host.onrender.com/api/alertas');
            if (resAlertas.ok) {
                alertasData = await resAlertas.json();
            } else {
                console.warn("⚠️ Aviso: El servidor Java devolvió error 500 en las alertas. Revisa la consola de Spring Boot.");
            }
        } catch (errAlertas) {
            console.warn("⚠️ Aviso: No se pudo conectar con el endpoint de alertas.");
        }
        
        // Filtramos las alertas que están activas (tienen hueco y no han caducado)
        const ahora = new Date();
        todasLasAlertas = alertasData.filter(a => {
            const faltantes = a.jugadoresFaltantes ?? a.jugadores_faltantes ?? a.numJugadores ?? 0;
            const fecha = new Date(a.fechaHora || a.fechaCreacion || a.fecha_creacion);
            return faltantes > 0 && fecha >= ahora;
        });
        
        // Ejecutamos el filtro por primera vez
        aplicarFiltroCalidad();

    } catch (error) {
        console.error("Error crítico cargando el mapa:", error);
        if (listaCanchas) {
            listaCanchas.innerHTML = `<div style="padding:20px; text-align:center; color:#e74c3c; font-weight:bold;">Error de conexión. ¿Está encendido el servidor?</div>`;
        }
    }
}

// Borra los pines viejos y pone los nuevos según lo que elijas en el filtro.
// Pone pines naranjas si hay pachanga y azules si la pista está muerta.
function aplicarFiltroCalidad() {
    const select = document.getElementById('filtro-estado');
    const calidadSeleccionada = select ? select.value.toUpperCase() : "TODAS";
    const listaCanchas = document.getElementById('lista-canchas');
    
    if (marcadoresCapa) marcadoresCapa.clearLayers();
    if (listaCanchas) listaCanchas.innerHTML = '';

    const pistasFiltradas = todasLasPistas.filter(pista => {
        if (calidadSeleccionada === "TODAS" || calidadSeleccionada === "") return true;
        return pista.estadoConservacion && pista.estadoConservacion.toUpperCase() === calidadSeleccionada;
    });

    if (pistasFiltradas.length === 0) {
        if (listaCanchas) listaCanchas.innerHTML = '<div style="padding:20px; text-align:center; color:#888;">No hay canchas con este estado de conservación.</div>';
        return;
    }

    // Extraemos la lista de IDs de las pistas que tienen una alerta viva
    const idsPistasConAlerta = todasLasAlertas.map(a => a.pista?.id || a.pista_id);

    pistasFiltradas.forEach(pista => {
        const tieneAlerta = idsPistasConAlerta.includes(pista.id);
        const miIcono = tieneAlerta ? iconoNaranja : iconoAzul;

        // PIN EN EL MAPA (Azul o Naranja)
        const marker = L.marker([pista.latitud, pista.longitud], { icon: miIcono });
        
        let popupHTML = `
            <div style="text-align:center; padding:5px; min-width: 160px;">
                <h3 style="margin:0 0 10px 0; color:var(--text-main);">${pista.nombre}</h3>
                ${tieneAlerta ? '<span style="display:block; margin-bottom:10px; color:#ff6b00; font-weight:bold; font-size:1.1em;">Pachanga Activa!</span>' : ''}
                <p style="margin:0 0 5px 0; font-size: 0.9em;"><b>Deporte:</b> ${pista.deporte}</p>
                <p style="margin:0 0 15px 0; font-size: 0.9em;"><b>Estado:</b> ${pista.estadoConservacion}</p>
                <button style="background:var(--primary-orange, #ff6b00); color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; width:100%; font-weight:bold;" onclick="window.location.href='${tieneAlerta ? 'feed.html' : 'crearAlerta.html?canchaId=' + pista.id}'">${tieneAlerta ? 'VER EN TABLÓN' : 'CREAR ALERTA AQUÍ'}</button>
            </div>
        `;
        marker.bindPopup(popupHTML);
        marcadoresCapa.addLayer(marker);

        // ELEMENTO EN LA LISTA LATERAL
        if (listaCanchas) {
            const divCancha = document.createElement('div');
            divCancha.className = 'cancha-item';
            
            // Si hay alerta, etiqueta Naranja, si no, Verde
            const etiquetaEstado = tieneAlerta 
                ? `<span style="color:#ff6b00; font-weight:bold; font-size:0.9em; background: #fff5ed; padding: 4px 8px; border-radius: 12px; border: 1px solid #ff6b00;">🔥 ¡Pachanga!</span>`
                : `<span style="color:#2ecc71; font-weight:bold; font-size:0.9em; background: #e8f5e9; padding: 4px 8px; border-radius: 12px;">Libre</span>`;

            divCancha.innerHTML = `
                <div>
                    <span style="display:block; font-weight:bold; color:var(--text-main);">${pista.nombre}</span>
                    <span style="font-size:0.8em; color:var(--text-muted);">${pista.deporte}</span>
                </div>
                ${etiquetaEstado}
            `;
            
            divCancha.onclick = () => {
                map.setView([pista.latitud, pista.longitud], 16);
                marker.openPopup();
            };
            
            listaCanchas.appendChild(divCancha);
        }
    });
}