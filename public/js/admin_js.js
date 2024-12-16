// Escuchar el evento submit del formulario
const form = document.getElementById("loginForm");

form.addEventListener("submit", function (event) {
    event.preventDefault(); // Evita que se envíe el formulario de forma predeterminada

    // Obtener los valores del formulario
    const correo = document.getElementById("correo").value.trim();
    const contraseña = document.getElementById("password").value;

    // Validar campos
    if (!validarCorreo(correo)) {
        alert("El correo no es válido. Asegúrate de que tenga un formato correcto.");
        return;
    }

    if (!validarContraseña(contraseña)) {
        alert("La contraseña no cumple con los requisitos: entre 5 y 10 caracteres, sin espacios dobles ni caracteres inválidos.");
        return;
    }

    // Preparar datos para enviar al servidor
    fetch('/iniciar-sesion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, contraseña }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.redirect) {
            // Redirigir según el rol del usuario
            window.location.href = data.redirect;
        } else {
            // Mostrar mensaje de error del servidor
            alert(data.message || 'Error al iniciar sesión.');
        }
    })
    .catch(error => {
        console.error('Error al realizar la solicitud:', error);
        alert('Ocurrió un error al conectar con el servidor.');
    });
});

// Función para validar el formato del correo electrónico
function validarCorreo(correo) {
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Formato estándar de correo
    return correoRegex.test(correo);
}

// Función para validar la contraseña
function validarContraseña(contraseña) {
    if (contraseña.length < 5 || contraseña.length > 10) {
        return false; // Longitud no permitida
    }

    if (/\s{2,}/.test(contraseña)) {
        return false; // No permite espacios dobles
    }

    if (/['";=]/.test(contraseña)) {
        return false; // Evita caracteres que puedan ser usados para inyecciones SQL
    }

    return true;
}

// Mensajes adicionales para guiar al usuario sobre errores comunes
document.addEventListener("DOMContentLoaded", () => {
    form.addEventListener("input", (event) => {
        const target = event.target;

        if (target.id === "correo") {
            if (!validarCorreo(target.value)) {
                target.setCustomValidity("Introduce un correo válido, como usuario@ejemplo.com");
            } else {
                target.setCustomValidity("");
            }
        }

        if (target.id === "password") {
            if (!validarContraseña(target.value)) {
                target.setCustomValidity("La contraseña debe tener entre 5 y 10 caracteres, sin espacios dobles ni caracteres inválidos.");
            } else {
                target.setCustomValidity("");
            }
        }
    });
});
