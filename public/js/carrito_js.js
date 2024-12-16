document.addEventListener('DOMContentLoaded', () => {
    const pagarBtn = document.querySelector('.btn__carrito.pagar');
    const modalWrapper = document.querySelector('.wrapper__modal');
    const confirmPagoBtn = document.querySelector('.btn__carrito.confirmarpago');
    const userId = obtenerCookie('userId');

    if (userId) {
        obtenerFondos(userId);
    } else {
        mostrarModalInicioSesion();
    }

    if (pagarBtn) {
        pagarBtn.addEventListener('click', () => {
            const fondosElement = document.querySelector('.fondos-restantes');
            if (fondosElement) {
                const fondos = parseFloat(fondosElement.textContent.replace('Fondos restantes: $', ''));
                if (fondos <= 0) {
                    alert('No tienes fondos suficientes.');
                    return;
                }
                modalWrapper.style.display = 'flex';
                const fondosModalElement = document.querySelector('.fondos-modal');
                if (fondosModalElement) {
                    fondosModalElement.textContent = `Fondos restantes: $${fondos.toFixed(2)}`;
                }
            }
        });
    }

    if (confirmPagoBtn) {
        confirmPagoBtn.addEventListener('click', () => {
            const fondosRestantesElement = document.querySelector('#fondosRestantes');
            if (fondosRestantesElement) {
                const fondosRestantes = parseFloat(fondosRestantesElement.textContent.replace('$', ''));

                if (fondosRestantes <= 0) {
                    alert('No tienes fondos suficientes.');
                    return;
                }

                realizarPago(userId, fondosRestantes).then(success => {
                    if (success) {
                        modalWrapper.style.display = 'none';
                        obtenerFondos(userId);
                    }
                });
            }
        });
    }

    if (modalWrapper) {
        modalWrapper.addEventListener('click', (e) => {
            if (e.target === modalWrapper) {
                modalWrapper.style.display = 'none';
            }
        });
    }

    obtenerProductosRelacionados();
});

function obtenerFondos(userId) {
    fetch(`/obtener-fondos/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.fondos !== undefined) {
                const fondosRestantes = parseFloat(data.fondos);

                const fondosRestantesElement = document.querySelector('#fondosRestantes');
                if (fondosRestantesElement) {
                    fondosRestantesElement.textContent = `$${fondosRestantes.toFixed(2)}`;
                }

                const fondosDisplayElement = document.querySelector('.fondos-restantes');
                if (fondosDisplayElement) {
                    fondosDisplayElement.textContent = `Fondos restantes: $${fondosRestantes.toFixed(2)}`;
                }
            } else {
                console.error('No se encontró la propiedad "fondos" en la respuesta');
            }
        })
        .catch(error => {
            console.error('Error al obtener los fondos:', error);
        });
}

function realizarPago(userId, fondosRestantes) {
    return fetch(`/realizar-pago/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fondosRestantes })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Pago realizado correctamente.');
            return true;
        } else {
            alert('Error al realizar el pago: ' + data.message);
            return false;
        }
    })
    .catch(error => {
        console.error('Error al procesar el pago:', error);
        return false;
    });
}

function obtenerCookie(nombre) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        const [key, value] = cookie.split('=');
        if (key === nombre) {
            return value;
        }
    }
    return null;
}

function mostrarModalInicioSesion() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'block';
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
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
                    document.cookie = `userId=${data.userId}; path=/`;
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
}

function obtenerProductosRelacionados() {
    fetch('/productos-relacionados', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(productos => {
        mostrarProductosRelacionados(productos);
    })
    .catch(error => {
        console.error("Error al obtener productos relacionados:", error);
    });
}

function mostrarProductosRelacionados(productos) {
    const carritoWrapper = document.querySelector('.carrito');

    if (carritoWrapper) {
        const botonCarrito = carritoWrapper.querySelector('.btn__carrito');
        carritoWrapper.innerHTML = '';
        carritoWrapper.appendChild(botonCarrito);

        productos.forEach(producto => {
            const divProducto = document.createElement('div');
            divProducto.classList.add('producto');
            divProducto.innerHTML = `
                <img src="${producto.imagen}" alt="${producto.nombre}" class="producto__img">
                <div class="producto__name">${producto.nombre}</div>
                <div class="producto__precio">$${producto.precio}</div>
                <div class="producto__cantidad">Cantidad: ${producto.cantidad}</div>
            `;
            carritoWrapper.appendChild(divProducto);
        });
    }
}
