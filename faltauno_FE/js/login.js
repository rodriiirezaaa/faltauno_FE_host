/* js/login.js */

// ==========================================
// 1. AL CARGAR LA PÁGINA (Efecto Rebote)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Comprobamos si el usuario viene expulsado de otra página
    const mensajeRebote = sessionStorage.getItem('alertaRebote');
    
    if (mensajeRebote) {
        // Mostramos tu notificación bonita
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion(mensajeRebote, 'error');
        } else {
            alert(mensajeRebote); 
        }
        // Borramos el mensaje de la memoria
        sessionStorage.removeItem('alertaRebote');
    }
});

// ==========================================
// 2. FUNCIONES DE LOS BOTONES (Globales)
// ==========================================

// Le pega al endpoint de login en el backend. 
// Si el mail y la pass coinciden, guarda el user en localStorage y te mete p'adentro.
async function iniciarSesion() {
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;

    if (!emailInput || !passwordInput) {
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('Por favor, rellena ambos campos', 'error');
        }
        return;
    }

    try {
        // Llamada al endpoint de Spring Boot que creamos antes
        const response = await fetch('https://faltauno-be-host.onrender.com/api/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: emailInput, 
                passwd: passwordInput 
            })
        });

        if (response.ok) {
            const usuario = await response.json();
            
            // Guardamos los datos en la memoria del navegador
            localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
            localStorage.setItem('rol', usuario.rol || 'USER');
            
            // Redirigimos al mapa principal
            window.location.replace('inicio.html');
        } else {
            // Si el servidor devuelve 401 (Error de credenciales)
            const errorMsg = await response.text();
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion(errorMsg || 'Credenciales incorrectas', 'error');
            }
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('Error de conexión con el servidor', 'error');
        }
    }
}

// Limpia el storage, te acredita el rol de invitado 
function entrarComoInvitado() {
    localStorage.setItem('rol', 'invitado');
    localStorage.removeItem('usuarioLogueado');
    window.location.replace('inicio.html');
}