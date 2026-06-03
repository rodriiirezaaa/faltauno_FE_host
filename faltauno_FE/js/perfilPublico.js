/* js/perfilPublico.js */

document.addEventListener('DOMContentLoaded', () => {
    cargarPerfilOrganizador();
    activarEstrellas(); 
});

// Lee del localstorage,lo busca en la API y pinta sus datos y su nota.
// Se encarga de pintar las estrellas al pasar el ratón y de hacer el POST 
// al back para votar. Te guarda un chivato en localStorage para que no votes repetidas veces al mismo.
function cargarPerfilOrganizador() {
    const idPerfil = localStorage.getItem('perfilAVer');
    
    if (!idPerfil) {
        window.location.replace('feed.html');
        return;
    }

    fetch('https://faltauno-be-host.onrender.com/api/usuarios')
        .then(res => res.json())
        .then(usuarios => {
            const usuario = usuarios.find(u => u.id == idPerfil);
            
            if (!usuario) {
                mostrarNotificacion("El usuario organizador ya no existe.", "error");
                setTimeout(() => window.location.href = 'feed.html', 2000);
                return;
            }

            const nombreEl = document.getElementById('perfil-publico-nombre');
            if (nombreEl) nombreEl.innerText = usuario.nombre;
            
            const avatarEl = document.getElementById('perfil-publico-avatar');
            if (avatarEl) avatarEl.innerText = usuario.nombre.charAt(0).toUpperCase();

            const ciudadEl = document.getElementById('perfil-publico-ciudad');
            if (ciudadEl) ciudadEl.innerText = usuario.ciudad || 'Ciudad no especificada';

            const estrellasEl = document.getElementById('perfil-publico-estrellas');
            if (estrellasEl) {
                const nota = usuario.medVal || 0;
                let htmlEstrellas = '';
                for(let i = 1; i <= 5; i++) {
                    if (i <= nota) {
                        htmlEstrellas += '<span style="color: #f1c40f; font-size: 1.2em;">★</span> ';
                    } else {
                        htmlEstrellas += '<span style="color: #ccc; font-size: 1.2em;">★</span> ';
                    }
                }
                
                // Le añadimos el número con 1 decimal por si tiene un "4.5"
                htmlEstrellas += `<span style="font-size: 0.8em; color: #666; margin-left: 10px;">(${nota.toFixed(1)}/5)</span>`;
                estrellasEl.innerHTML = htmlEstrellas;
            }
        })
        .catch(err => {
            console.error("Error al cargar el perfil público:", err);
            mostrarNotificacion("Error al conectar con la base de datos.", "error");
        });
}

// ==========================================
// LÓGICA DE VALORACIÓN A MYSQL
// ==========================================

function activarEstrellas() {
    const estrellas = document.querySelectorAll('.interactive-stars .star');
    const idPerfil = localStorage.getItem('perfilAVer');
    const idAutor = localStorage.getItem('userId');
    
    // Cortafuegos por si entra alguien sin loguearse
    if (!idAutor) return;

    if (localStorage.getItem(`valorado_por_${idAutor}_a_${idPerfil}`)) {
        document.querySelector('.interactive-stars').style.opacity = '0.5';
        document.querySelector('.rating-title').innerText = "Ya has valorado a este jugador";
        return; 
    }

    estrellas.forEach((estrella, index) => {
        estrella.addEventListener('mouseover', () => {
            estrellas.forEach((e, i) => {
                e.style.color = i <= index ? '#f1c40f' : '#ccc';
            });
        });

        estrella.addEventListener('mouseout', () => {
            estrellas.forEach(e => e.style.color = '#ccc');
        });

        estrella.addEventListener('click', () => {
            const nota = index + 1;
            
            fetch(`https://faltauno-be-host.onrender.com/api/usuarios/${idPerfil}/valorar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    idAutor: parseInt(idAutor), 
                    estrellas: nota 
                })
            })
            .then(res => {
                if (!res.ok) throw new Error("Error al guardar la valoración");
                
                estrellas.forEach((e, i) => {
                    e.style.color = i <= index ? '#f1c40f' : '#ccc';
                    e.replaceWith(e.cloneNode(true)); 
                }); 

                localStorage.setItem(`valorado_por_${idAutor}_a_${idPerfil}`, 'true');
                
                document.querySelector('.rating-title').innerText = "¡Gracias por tu valoración!";
                document.querySelector('.rating-title').style.color = "#2ecc71";
                
                if (typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion(`Has valorado a este organizador con ${nota} estrellas.`, 'exito');
                }
            })
            .catch(err => {
                if (typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion("Error al conectar con la base de datos.", "error");
                }
            });
        });
    });
}