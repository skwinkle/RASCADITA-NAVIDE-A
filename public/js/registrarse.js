document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const nombre = document.getElementById('name').value;
        const gmail = document.getElementById('correo').value;
        const telefono = document.getElementById('telefono').value;
        const password = document.getElementById('contra').value;

        // Validaciones adicionales aquí si es necesario

        fetch('/agregarUsuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre, gmail, telefono, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.redirect) {
                // Redirigir a perfil.html si el registro fue exitoso
                window.location.href = data.redirect;
            } else {
                // Mostrar error si algo falla
                alert(data.message || 'Error al registrar usuario');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un problema al registrar al usuario');
        });
    });
});
