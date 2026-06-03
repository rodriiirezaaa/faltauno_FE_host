/* js/feed.js */

// Nada más cargar la pantalla, le damos al fetch para traer las alertas al vuelo.
document.addEventListener('DOMContentLoaded', () => {
    cargarAlertas();
});

// Se trae todas las pachangas, limpia las que están caducadas o llenas 
// y se pone a pintar el HTML las tarjetas con un forEach.
function cargarAlertas() {
    let idUsuarioLogueado = localStorage.getItem('userId');
    if (!idUsuarioLogueado && localStorage.getItem('usuarioLogueado')) {
        const userObj = JSON.parse(localStorage.getItem('usuarioLogueado'));
        idUsuarioLogueado = userObj.id;
        localStorage.setItem('userId', idUsuarioLogueado);
    }

    fetch('https://faltauno-be-host.onrender.com/api/alertas')
        .then(response => response.json())
        .then(alertas => {
            const contenedor = document.getElementById('feed-container');
            
            const ahora = new Date();
            
            const alertasVivas = alertas.filter(alerta => {
                const faltantes = alerta.jugadoresFaltantes ?? alerta.jugadores_faltantes ?? alerta.numJugadores ?? 0;
                
                if (faltantes <= 0) return false;

                const fechaPartidoStr = alerta.fechaHora || alerta.fecha_hora || alerta.fechaCreacion || alerta.fecha_creacion;
                if (fechaPartidoStr) {
                    const fechaPartido = new Date(fechaPartidoStr);
                    if (fechaPartido < ahora) return false;
                }

                return true;
            });

            if (alertasVivas.length === 0) {
                contenedor.innerHTML = `
                    <div class="empty-state">
                        <h2>La pista está vacía...</h2>
                        <p>Nadie ha organizado una pachanga todavía o todas están completas/caducadas. ¡Sé el primero en lanzar una alerta!</p>
                        <button class="btn-create-empty" onclick="window.location.href='crearAlerta.html'">Crear Alerta</button>
                    </div>`;
                return;
            }
            
            contenedor.innerHTML = '';
            
            alertasVivas.forEach(alerta => {
                const card = document.createElement('div');
                card.className = 'match-ticket';
                
                const edadMin = alerta.rangoEdadMin || alerta.rango_edad_min || '16';
                const edadMax = alerta.rangoEdadMax || alerta.rango_edad_max || '99';
                const estrellas = alerta.usuario?.medVal || alerta.usuario?.med_val || "0";
                const faltantes = alerta.jugadoresFaltantes ?? alerta.jugadores_faltantes ?? alerta.numJugadores ?? 1;
                const deporte = alerta.pista?.deporte || 'Deporte';
                
                // Extraemos la información adicional de forma segura
                const infoExtra = alerta.informacionAdicional || alerta.informacion_adicional || '';
                
                const claseDeporte = deporte.toLowerCase().includes('fútbol') || deporte.toLowerCase().includes('futbol') ? 'sport-futbol' :
                                     deporte.toLowerCase().includes('basket') || deporte.toLowerCase().includes('baloncesto') ? 'sport-basket' :
                                     deporte.toLowerCase().includes('voley') ? 'sport-voley' : 'sport-default';

                const yaUnido = localStorage.getItem(`unido_user_${idUsuarioLogueado}_alerta_${alerta.id}`);
                
                const fechaParseada = new Date(alerta.fechaHora || alerta.fecha_hora || alerta.fechaCreacion || alerta.fecha_creacion || new Date());
                const opcionesFecha = { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' };
                const fechaBonita = fechaParseada.toLocaleDateString('es-ES', opcionesFecha);
                
                let btnClase = "btn-apuntarse";
                let btnTexto = "¡Saltar a la pista!";
                let btnDisabled = "";
                
                if (yaUnido) {
                    btnClase = "btn-apuntarse success";
                    btnTexto = "¡Apuntado! ✓";
                    btnDisabled = "disabled";
                }

                // Generamos el bloque HTML para la información extra (solo si existe)
                let infoExtraHTML = '';
                if (infoExtra.trim() !== '') {
                    infoExtraHTML = `
                        <div class="detail-row" style="margin-top: 5px; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
                            <span class="detail-icon-text">Notas:</span>
                            <span class="detail-text" style="font-style: italic; color: #64748b;">"${infoExtra}"</span>
                        </div>
                    `;
                }

                card.innerHTML = `
                    <div class="ticket-header ${claseDeporte}">
                        <span class="sport-badge">${deporte.toUpperCase()}</span>
                        <span class="date-badge">${fechaBonita}</span>
                    </div>
                    
                    <div class="ticket-body">
                        <div class="missing-players-wrapper">
                            <span class="missing-label">SE BUSCAN</span>
                            <h3 class="missing-number ${faltantes === 1 ? 'critical' : ''}">${faltantes} <span>jugadores</span></h3>
                        </div>
                        
                        <div class="match-details">
                            <div class="detail-row">
                                <span class="detail-icon-text">Lugar:</span>
                                <span class="detail-text"><strong>${alerta.pista?.nombre || 'Cancha no especificada'}</strong></span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-icon-text">Edades:</span>
                                <span class="detail-text">${edadMin} - ${edadMax} años</span>
                            </div>
                            ${infoExtraHTML}
                        </div>

                        <div class="host-section" onclick="verPerfilPublico(${alerta.usuario?.id})">
                            <div class="host-avatar">${alerta.usuario?.nombre ? alerta.usuario.nombre.charAt(0).toUpperCase() : '?'}</div>
                            <div class="host-info">
                                <span class="host-label">Organizador</span>
                                <span class="host-name">${alerta.usuario?.nombre || 'Usuario'} <span class="host-stars">Valoración: ${estrellas}/5</span></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ticket-footer">
                        <button class="${btnClase}" id="btn-unirse-${alerta.id}" ${btnDisabled}>${btnTexto}</button>
                    </div>
                `;
                
                contenedor.appendChild(card);

                const btnUnirse = document.getElementById(`btn-unirse-${alerta.id}`);
                if (btnUnirse && !yaUnido) {
                    btnUnirse.addEventListener('click', function() {
                        intentarApuntarse(this, alerta.id);
                    });
                }
            });
        })
        .catch(error => {
            console.error("Error al cargar las alertas:", error);
            if(typeof mostrarNotificacion === 'function') mostrarNotificacion('Error conectando con el servidor', 'error');
        });
}

// Te guarda en la recámara a quién vas a ver y te redirige a su perfil para cotillear.
function verPerfilPublico(idUsuario) {
    localStorage.setItem('perfilAVer', idUsuario);
    window.location.href = 'perfilPublico.html';
}

// Pega un PUT a Spring Boot para sumarte al partido. Si te deja, te cambia la pinta 
// del botón a verde para que sepas que estás dentro y baja el número de plazas.
function intentarApuntarse(botonHTML, idAlerta) {
    const rolUsuario = localStorage.getItem('rol');
    let idUsuarioLogueado = localStorage.getItem('userId');

    if (!idUsuarioLogueado && localStorage.getItem('usuarioLogueado')) {
        const userObj = JSON.parse(localStorage.getItem('usuarioLogueado'));
        idUsuarioLogueado = userObj.id;
        localStorage.setItem('userId', idUsuarioLogueado);
    }
    
    if (rolUsuario === 'invitado' || !rolUsuario || !idUsuarioLogueado) {
        sessionStorage.setItem('alertaRebote', 'Para saltar a la cancha necesitas iniciar sesión.');
        window.location.href = 'login.html';
        return; 
    }

   fetch(`https://faltauno-be-host.onrender.com/api/alertas/${idAlerta}/unirse`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: parseInt(idUsuarioLogueado) }) 
    })
    .then(res => {
        if (!res.ok) throw new Error("El partido está lleno o hubo un error");
        return res.json();
    })
    .then(alertaActualizada => {
        if(typeof mostrarNotificacion === 'function') mostrarNotificacion('¡Te has unido al partido con éxito!', 'exito');
        else alert('Te has unido al partido!');
        
        localStorage.setItem(`unido_user_${idUsuarioLogueado}_alerta_${idAlerta}`, 'true');

        botonHTML.innerText = "¡Apuntado! ✓";
        botonHTML.className = "btn-apuntarse success"; 
        botonHTML.disabled = true; 
        
        const ticketBody = botonHTML.closest('.match-ticket').querySelector('.missing-number');
        if (ticketBody) {
            ticketBody.innerHTML = `${alertaActualizada.jugadoresFaltantes} <span>jugadores</span>`;
        }
        
        if (alertaActualizada.jugadoresFaltantes <= 0) {
            setTimeout(() => { window.location.reload(); }, 2000);
        }
    })
    .catch(err => {
        if(typeof mostrarNotificacion === 'function') mostrarNotificacion('No se pudo unir (quizás ya no quedan plazas)', 'error');
        else alert('No se pudo unir al partido');
    });
}