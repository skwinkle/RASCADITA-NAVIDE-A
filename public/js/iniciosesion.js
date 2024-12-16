document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const gmailInput = document.getElementById('correo');
    const passwordInput = document.getElementById('password');

    const getCookie = (name) => {
        const decodedCookies = decodeURIComponent(document.cookie);
        const cookiesArray = decodedCookies.split(';');
        for (let cookie of cookiesArray) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + "=")) {
                return cookie.substring(name.length + 1);
            }
        }
        return "";
    };

    const verificarSesion = () => {
        const sessionCookie = getCookie("session");
        const userIdCookie = getCookie("userId");
    
        console.log("Cookies: ", document.cookie);  // Muestra todas las cookies
        console.log("sessionCookie: ", sessionCookie);  // Muestra el valor de la cookie 'session'
    
        if (sessionCookie) {
            console.log("Redirigiendo a perfil...");
            window.location.href = "perfil.html";
        }
    };

    const validarFormulario = () => {
        const gmail = gmailInput.value.trim();
        const password = passwordInput.value.trim();

        if (gmail === '' || password === '') {
            alert('Por favor, completa todos los campos.');
            return false;
        }

        if (!/\S+@\S+\.\S+/.test(gmail)) {
            alert('El correo no tiene un formato válido.');
            return false;
        }

        if (password.length < 5 || password.length > 10) {
            alert('La contraseña debe tener entre 5 y 10 caracteres.');
            return false;
        }

        if (/\s/.test(password)) {
            alert('La contraseña no puede contener espacios.');
            return false;
        }

        return true;
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (validarFormulario()) {
            const correo = gmailInput.value;
            const contraseña = passwordInput.value;

            fetch('/iniciar-sesion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ correo, contraseña })
            })
            .then(response => response.json())
            .then(data => {
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    alert(data.message || 'Error al iniciar sesión');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Ocurrió un error al iniciar sesión');
            });
        }
    });

    verificarSesion();
});
