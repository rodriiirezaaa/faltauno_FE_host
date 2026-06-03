/* js/configuracion.js */

document.addEventListener('DOMContentLoaded', () => {
    // 1. CORTAFUEGOS: Comprobamos si el usuario está logueado
    const usuarioGuardado = localStorage.getItem('usuarioLogueado');
    const rolUsuario = localStorage.getItem('rol');

    if (!usuarioGuardado || rolUsuario === 'invitado') {
        sessionStorage.setItem('alertaRebote', 'Acceso denegado: Debes iniciar sesión para ver tu configuración.');
        window.location.replace('login.html');
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);

    const emailInput = document.getElementById('config-email');
    if (emailInput) {
        emailInput.value = usuario.email; // Ponemos su correo real
    }

    const navName = document.getElementById('nav-user-name');
    const navAvatar = document.getElementById('nav-avatar-char');
    if (navName) navName.innerText = usuario.nombre;
    if (navAvatar && usuario.nombre) navAvatar.innerText = usuario.nombre.charAt(0).toUpperCase();
});


function guardarConfiguracion() {
    const nuevaPass = document.getElementById('config-password').value;
    
    // Validación de la contraseña (si el usuario ha escrito algo)
    if (nuevaPass && nuevaPass.length < 6) {
        mostrarNotificacion('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }
    
    // Mostramos la notificación bonita de éxito
    mostrarNotificacion('Configuración guardada correctamente.', 'exito');
    
    // Limpiamos la casilla de la contraseña
    document.getElementById('config-password').value = '';
}