document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const modal = document.getElementById('modal');
    const userId = localStorage.getItem('userId'); // Obtener el ID desde localStorage

    // Console log para ver el ID del usuario
    console.log('userId desde localStorage:', userId);

    if (userId) {
        ocultarModal(); // Si existe el userId, ocultamos el modal de inicio de sesión
    } else {
        mostrarModalInicioSesion(); // Si no hay userId, mostramos el modal de inicio de sesión
    }

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const correo = document.getElementById('correo').value.trim();
            const password = document.getElementById('password').value.trim();

            if (validarFormulario(correo, password)) {
                iniciarSesion(correo, password); // Intentar iniciar sesión
            }
        });
    }

    obtenerCatalogo(); // Obtener los productos en el catálogo
});

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        const [key, value] = cookie.split('=');
        if (key === name) {
            return value;
        }
    }
    return null;
}

function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Strict`;
}

function validarFormulario(correo, password) {
    if (!correo || !password) {
        alert('Por favor, completa todos los campos.');
        return false;
    }

    if (!/\S+@\S+\.\S+/.test(correo)) {
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
}

function iniciarSesion(correo, password) {
    fetch('/iniciar-sesion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, contraseña: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Inicio de sesión exitoso.');
            localStorage.setItem('userId', data.userId);  // Guardar el userId en localStorage
            ocultarModal();  // Ocultar el modal de inicio de sesión
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error al iniciar sesión:', error);
    });
}

function ocultarModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function mostrarModalInicioSesion() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function obtenerCatalogo() {
    fetch('/catalogo')
        .then(response => response.json())
        .then(productos => {
            mostrarProductos(productos);
        })
        .catch(error => {
            console.error('Error al obtener el catálogo:', error);
        });
}

function mostrarProductos(productos) {
    const productosGrid = document.getElementById('productosGrid');
    if (productosGrid) {
        productosGrid.innerHTML = '';
        productos.forEach(producto => {
            const precio = parseFloat(producto.precio);
            if (!isNaN(precio)) {
                const divProducto = document.createElement('div');
                divProducto.classList.add('grid__item--producto');
                divProducto.innerHTML = `
                    <img src="${producto.imagen}" alt="${producto.nombre}" class="grid__item--img">
                    <div class="grid__item--content">
                        <div class="content--name">
                            ${producto.nombre} $${precio.toFixed(2)}
                        </div>
                    </div>
                `;
                productosGrid.appendChild(divProducto);
            } else {
                console.error(`El precio del producto ${producto.nombre} no es un número válido`);
            }
        });
    }
}
