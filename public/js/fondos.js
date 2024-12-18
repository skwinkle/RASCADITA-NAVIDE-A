document.addEventListener('DOMContentLoaded', () => {
    let userId = localStorage.getItem('userId');
    
    console.log('User ID desde localStorage:', userId);
    
    if (!userId) {
        mostrarModalInicioSesion();
    } else {
        obtenerFondos(userId);
    }

    const form = document.querySelector('.form__fondos');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const fondosInput = document.getElementById('fondos');
        const fondos = parseFloat(fondosInput.value);
        if (isNaN(fondos) || fondos <= 0) {
            alert('Por favor ingresa una cantidad válida de fondos.');
            return;
        }
        agregarFondos(userId, fondos);
    });
});

function obtenerFondos(userId) {
    fetch(`/obtener-fondos/${userId}`)
        .then(response => response.json())
        .then(data => {
            let fondosRestantes = data.fondos;
            fondosRestantes = parseFloat(fondosRestantes);
            if (!isNaN(fondosRestantes)) {
                document.querySelector('.textmiado').textContent = `Fondos Restantes: $${fondosRestantes.toFixed(2)}`;
            } else {
                alert('Hubo un problema al obtener los fondos.');
            }
        })
        .catch(error => {
            console.error('Error al obtener los fondos:', error);
        });
}

function agregarFondos(userId, cantidad) {
    fetch(`/agregar-fondos/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cantidad: cantidad })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                let nuevosFondos = data.nuevosFondos;
                nuevosFondos = parseFloat(nuevosFondos);
                if (!isNaN(nuevosFondos)) {
                    document.querySelector('.textmiado').textContent = `Fondos Restantes: $${nuevosFondos.toFixed(2)}`;
                    alert('Fondos agregados correctamente');
                } else {
                    alert('Hubo un problema al agregar los fondos');
                }
            } else {
                alert('Hubo un problema al agregar los fondos');
            }
        })
        .catch(error => {
            console.error('Error al agregar fondos:', error);
        });
}

function mostrarModalInicioSesion() {
    const modal = document.getElementById('modal');
    modal.style.display = 'block';

    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const correo = document.getElementById('correo').value;
        const password = document.getElementById('password').value;
        
        fetch('/iniciar-sesion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ correo, password })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    localStorage.setItem('userId', data.userId); // Guarda el userId en localStorage
                    modal.style.display = 'none';
                    obtenerFondos(data.userId);
                } else {
                    alert('Credenciales incorrectas');
                }
            })
            .catch(error => {
                console.error('Error al iniciar sesión:', error);
            });
    });
}
