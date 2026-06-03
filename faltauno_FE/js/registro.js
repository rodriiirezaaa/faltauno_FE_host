/* js/registro.js - Función registrarUsuario actualizada */

// Pilla los datos del formulario, comprueba que las contraseñas cuadran 
// y le mete un POST a Spring Boot para guardar el usuario nuevo.
async function registrarUsuario() {
    const nombre = document.getElementById('reg-nombre').value;
    const apellidos = document.getElementById('reg-apellidos').value; // Capturamos el nuevo campo
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-password-confirm').value;

    // Validación: El nombre y apellidos son obligatorios
    if (!nombre || !apellidos || !email || !password) {
        if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Por favor, rellena todos los campos', 'error');
        else alert('Rellena todos los campos');
        return;
    }

    if (password !== confirmPassword) {
        if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Las contraseñas no coinciden', 'error');
        else alert('Las contraseñas no coinciden');
        return;
    }

    // Objeto enviado a Java
    const nuevoUsuario = {
        nombre: nombre,
        apellidos: apellidos, 
        email: email,
        passwd: password,
        rol: "USER",
        medVal: 0
    };

    try {
        const response = await fetch('https://faltauno-be-host.onrender.com/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoUsuario)
        });

        if (response.ok) {
            mostrarNotificacion('¡Cuenta creada con éxito!', 'exito');
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        } else {
            mostrarNotificacion('Error al crear la cuenta', 'error');
        }
    } catch (error) {
        console.error("Error:", error);
    }
}