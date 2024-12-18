document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const gmailInput = document.getElementById('correo');
    const passwordInput = document.getElementById('password');

    const verificarSesion = () => {
        const userId = localStorage.getItem("userId");  // Obtener userId desde localStorage
        
        console.log("userId:", userId);  // Muestra el userId en consola

        if (userId) {
            console.log("Redirigiendo a perfil...");
            window.location.href = "perfil.html";  // Redirige al perfil si hay userId
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
                if (data.success) {
                    // Si la respuesta es exitosa, guardamos el userId en localStorage
                    localStorage.setItem("userId", data.userId);
                    // Redirigimos a perfil
                    window.location.href = "perfil.html";
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

    verificarSesion();  // Verifica si ya hay sesión activa al cargar la página
});
