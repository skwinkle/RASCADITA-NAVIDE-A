document.addEventListener('DOMContentLoaded', () => {
    const formEditar = document.getElementById('editarUsuarioForm');
    const formBorrar = document.getElementById('borrarUsuarioForm');
    const idInput = document.getElementById('ide');
    const nombreInput = document.getElementById('name');
    const gmailInput = document.getElementById('correo');
    const telefonoInput = document.getElementById('telefono');


    const limpiarNombre = (input) => {
        input.value = input.value.replace(/[^a-zA-Z\s]/g, '').trim();
    };


    const limpiarCorreo = (input) => {
        input.value = input.value.replace(/[^a-zA-Z0-9@._-]/g, '').trim(); 
    };


    const limpiarTelefono = (input) => {
        const soloNumeros = input.value.replace(/\D/g, ''); 
        let formato = '';


        for (let i = 0; i < soloNumeros.length; i++) {
            if (i > 0 && i % 2 === 0) {
                formato += '-'; 
            }
            formato += soloNumeros[i];
        }

        input.value = formato.slice(0, 14);
    };

    const validarFormulario = () => {
        const id = idInput.value.trim();
        const nombre = nombreInput.value.trim();
        const gmail = gmailInput.value.trim();
        const telefono = telefonoInput.value.trim();

        if (/e|pi/i.test(id)) {
            alert('El ID no puede contener la letra "e" o la secuencia "pi".');
            idInput.focus();
            return false;
        }


        if (nombre === '' || gmail === '' || telefono === '') {
            alert('Por favor, completa todos los campos (nombre, correo y teléfono).');
            return false; 
        }


        if (!/\S+@\S+\.\S+/.test(gmail)) {
            alert('El correo no tiene un formato válido.');
            gmailInput.focus();
            return false;
        }


        const telefonoFormatoCorrecto = /^(\d{2}-){4}\d{2}$/.test(telefono);
        if (!telefonoFormatoCorrecto) {
            alert('El teléfono debe estar en el formato xx-xx-xx-xx-xx.');
            telefonoInput.focus();
            return false;
        }

        return true; 
    };


    const obtenerDatosUsuario = async (id) => {
        if (id) {
            try {
                const response = await fetch('/obtenerUsuario', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ide: id }) 
                });

                if (response.ok) {
                    const usuario = await response.json();
                    nombreInput.value = usuario.nombre; 
                    gmailInput.value = usuario.correo; 
                    telefonoInput.value = usuario.telefono; 
                } else {
                    alert('Usuario no encontrado'); 
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al obtener los datos del usuario');
            }
        }
    };


    idInput.addEventListener('blur', () => {
        const id = idInput.value; 
        obtenerDatosUsuario(id); 
    });

    nombreInput.addEventListener('blur', () => {
        limpiarNombre(nombreInput);
    });

    gmailInput.addEventListener('blur', () => {
        limpiarCorreo(gmailInput);
    });

    telefonoInput.addEventListener('blur', () => {
        limpiarTelefono(telefonoInput);
    });


    formEditar.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        if (validarFormulario()) {
            try {
                const response = await fetch(formEditar.action, {
                    method: formEditar.method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ide: idInput.value,
                        nombre: nombreInput.value,
                        gmail: gmailInput.value,
                        telefono: telefonoInput.value
                    })
                });

                if (response.ok) {
                    alert('Datos del usuario actualizados con éxito');
                } else {
                    alert('Error al actualizar los datos del usuario');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al enviar la solicitud de edición');
            }
        }
    });


    formBorrar.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const ideb = document.getElementById('ideb').value; 
        if (ideb) {
            try {
                const response = await fetch(formBorrar.action, {
                    method: formBorrar.method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ideb }) 
                });

                if (response.ok) {
                    alert('Usuario borrado con éxito');
                } else {
                    const message = await response.text();
                    alert(message || 'Error al borrar el usuario');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al enviar la solicitud de borrado');
            }
        } else {
            alert('Por favor, ingresa un ID para borrar');
        }
    });
});
