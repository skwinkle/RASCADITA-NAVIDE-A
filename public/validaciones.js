document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const nombreInput = document.getElementById('name');
    const gmailInput = document.getElementById('correo');
    const telefonoInput = document.getElementById('telefono');
    const passwordInput = document.getElementById('contra');

    const limpiarNombre = (input) => {
        input.value = input.value.replace(/[^a-zA-Z\s]/g, '').trim();
    };

    const limpiarCorreo = (input) => {
        input.value = input.value.replace(/[^a-zA-Z0-9@.]/g, '').trim();
    };

    const limpiarTelefono = (input) => {
        const soloNumeros = input.value.replace(/\D/g, '');
        const formato = soloNumeros.slice(0, 10).replace(/(\d{2})(?=\d)/g, '$1-').replace(/-$/, '');
        input.value = formato;
    };


    const validarFormulario = () => {
        const nombre = nombreInput.value.trim();
        const gmail = gmailInput.value.trim();
        const telefono = telefonoInput.value.trim();
        const password = passwordInput.value.trim();

        if (nombre === '' || gmail === '' || telefono === '' || password === '') {
            alert('Por favor, completa todos los campos.');
            return false; 
        }

        // Verificar que el correo no sea solo un dominio
        if (/^@.+\..+$/.test(gmail)) {
            alert('El correo no puede ser solo un dominio.');
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


    nombreInput.addEventListener('blur', () => {
        limpiarNombre(nombreInput);
    });

    gmailInput.addEventListener('blur', () => {
        limpiarCorreo(gmailInput);
    });

    telefonoInput.addEventListener('blur', () => {
        limpiarTelefono(telefonoInput);
    });

    passwordInput.addEventListener('blur', () => {
        passwordInput.value = passwordInput.value.replace(/\s/g, '');
    });


    form.addEventListener('submit', async (event) => {
        event.preventDefault();


        if (validarFormulario()) {
            const formData = new FormData(form);
            const data = new URLSearchParams(formData);

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: data,
                });

                if (response.ok) {
                    const result = await response.json();
                    alert(result.message); 
                    form.reset(); 
                } else {
                    alert("Error al agregar el cliente.");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Hubo un error al enviar el formulario.");
            }
        }
    });
});
