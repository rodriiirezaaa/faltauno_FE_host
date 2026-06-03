/* js/global.js */

/**
 * Inicializador (1): Configura datos visuales de la cabecera (inicial y nombre)
 * leyendo los datos logueados, y añade control de clics para cerrar los menús del header.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. HEADER DINÁMICO (Nombre e Inicial)
    // ==========================================
    const userNameDisplay = document.querySelector('.user-profile-btn span');
    const userAvatarDisplay = document.querySelector('.user-avatar');
    
    // Leemos los datos reales que guardó el login.js desde el Backend
    const savedName = localStorage.getItem('userName'); 
    const savedRol = localStorage.getItem('rol');

    if (savedName && userNameDisplay && userAvatarDisplay) {
        userNameDisplay.textContent = savedName; // Pone tu nombre real (ej: Rodrigo)
        userAvatarDisplay.textContent = savedName.charAt(0).toUpperCase(); // Saca la inicial (ej: R)
    } else if (savedRol === 'invitado') {
        if (userNameDisplay) userNameDisplay.textContent = 'Invitado';
        if (userAvatarDisplay) userAvatarDisplay.textContent = 'I';
    }


    // ==========================================
    // 2. CERRAR MENÚ DESPLEGABLE AL HACER CLIC FUERA
    // ==========================================
    window.addEventListener('click', (e) => {
        const menu = document.getElementById('userMenu');
        const profileBtn = document.querySelector('.user-profile-btn');

        // Si el menú existe, está abierto, y el usuario hace clic fuera del botón y del propio menú...
        if (menu && menu.style.display === 'block') {
            if (profileBtn && !profileBtn.contains(e.target) && !menu.contains(e.target)) {
                menu.style.display = 'none';
            }
        }
    });
});


/**
 * Alterna el estado de visibilidad (mostrar / ocultar) del menú de perfil del usuario.
 */
function toggleMenu() {
    const menu = document.getElementById('userMenu');
    if (!menu) return;

    // Alternamos entre mostrar y ocultar el menú
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
}


/**
 * Sistema global de notificaciones. Muestra una burbuja temporal en la esquina.
 * Controla animaciones y se autodestruye tras unos segundos.
 * @param {string} mensaje - El texto a notificar.
 * @param {string} tipo - 'exito', 'error', o 'info' (determina el color).
 */
function mostrarNotificacion(mensaje, tipo = 'exito') {
    // Buscamos si ya existe el contenedor de alertas, si no, lo creamos dinámicamente
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        
        // Estilos base para el contenedor
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '99999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }

    // Creamos la burbuja de la notificación
    const notif = document.createElement('div');
    notif.className = `notification ${tipo}`;
    notif.innerText = mensaje;

    // Estilos de diseño de la burbuja
    notif.style.padding = '15px 25px';
    notif.style.borderRadius = '8px';
    notif.style.color = 'white';
    notif.style.fontWeight = 'bold';
    notif.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    notif.style.transition = 'all 0.3s ease';
    notif.style.opacity = '0';
    notif.style.transform = 'translateY(20px)';

    // Color según el tipo de mensaje
    if (tipo === 'exito') {
        notif.style.backgroundColor = '#2ecc71'; // Verde Falta Uno
    } else if (tipo === 'error') {
        notif.style.backgroundColor = '#e74c3c'; // Rojo Alerta
    } else {
        notif.style.backgroundColor = '#3498db'; // Azul info
    }

    container.appendChild(notif);

    // Animación de entrada 
    setTimeout(() => {
        notif.style.opacity = '1';
        notif.style.transform = 'translateY(0)';
    }, 10);

    // Animación de salida
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            notif.remove();
        }, 300);
    }, 3500);
}
// Comprobador de rebotes de seguridad
document.addEventListener('DOMContentLoaded', () => {
    const mensajeRebote = sessionStorage.getItem('alertaRebote');
    
    if (mensajeRebote) {
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion(mensajeRebote, 'error');
        } else {
            alert(mensajeRebote); // Fallback por si la función no ha cargado
        }
        sessionStorage.removeItem('alertaRebote');
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // 1. Automatización del Nombre y Avatar
    const userStr = localStorage.getItem('usuarioLogueado');
    const rol = localStorage.getItem('rol');
    
    // Buscamos los elementos del header
    const nombreElements = document.querySelectorAll('.user-profile-btn span:not(.dropdown-menu span)');
    const avatarElements = document.querySelectorAll('.user-avatar');

    if (userStr && rol !== 'invitado') {
        const user = JSON.parse(userStr);
        const nombreReal = user.nombre || 'Usuario';
        const inicial = nombreReal.charAt(0).toUpperCase();

        nombreElements.forEach(el => { if(el.id !== 'nav-avatar-char') el.textContent = nombreReal; });
        avatarElements.forEach(el => el.textContent = inicial);
    } else {
        nombreElements.forEach(el => { if(el.id !== 'nav-avatar-char') el.textContent = 'Invitado'; });
        avatarElements.forEach(el => el.textContent = '?');
    }
});