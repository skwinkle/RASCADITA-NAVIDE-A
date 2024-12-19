document.addEventListener('DOMContentLoaded', () => {
    const pagarBtn = document.querySelector('.btn__carrito.pagar');
    const modalWrapper = document.querySelector('.wrapper__modal');
    const confirmPagoBtn = document.querySelector('.btn__carrito.confirmarpago');
    const userId = localStorage.getItem('userId');
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

function obtenerProductosRelacionados() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.error('No se ha encontrado un userId en el localStorage');
        return;
    }

    fetch(`/productos-relacionados/${userId}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('No autorizado');
        }
        return response.json();
    })
    .then(productos => {
        mostrarProductosRelacionados(productos);
    })
    .catch(error => {
        console.error('Error al obtener productos relacionados:', error);
    });
}

function mostrarProductosRelacionados(productos) {
    const carritoWrapper = document.querySelector('.carrito');
    const pagarButton = document.querySelector('.btn__carrito.pagar');

    if (!carritoWrapper) return;

    carritoWrapper.innerHTML = '';
    carritoWrapper.appendChild(pagarButton);

    productos.forEach(producto => {
        const divProducto = document.createElement('div');
        divProducto.classList.add('carrito__producto');
        
        const precio = parseFloat(producto.precio);
        
        divProducto.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" class="carrito__producto--img">
            <div class="carrito__producto--content">
                <h2 class="producto--content Nombre">${producto.nombre}</h2>
                <p class="producto--content stock">Stock: ${producto.stock}</p>
                <h2 class="producto--content precio">$${isNaN(precio) ? '0.00' : precio.toFixed(2)}</h2>
            </div>
            <div class="carrito__producto--content2">
                <div class="carrito--buttons">
                    <button class="producto__btn producto--delete">-</button>
                    <input type="number" class="producto--cant" value="1" min="1" max="${producto.stock}">
                    <button class="producto__btn producto--add">+</button>
                </div>
                <button class="profile__btn form__button button__delete">Eliminar</button>
            </div>
        `;
        carritoWrapper.insertBefore(divProducto, pagarButton);
        agregarEventosProducto(divProducto, producto);
    });
}

function agregarEventosProducto(divProducto, producto) {
    const btnDelete = divProducto.querySelector('.producto--delete');
    const btnAdd = divProducto.querySelector('.producto--add');
    const inputCantidad = divProducto.querySelector('.producto--cant');
    const btnEliminar = divProducto.querySelector('.button__delete');

    btnDelete.addEventListener('click', () => {
        let cantidad = parseInt(inputCantidad.value);
        if (cantidad > 1) {
            inputCantidad.value = cantidad - 1;
        }
    });

    btnAdd.addEventListener('click', () => {
        let cantidad = parseInt(inputCantidad.value);
        if (cantidad < producto.stock) {
            inputCantidad.value = cantidad + 1;
        }
    });

    btnEliminar.addEventListener('click', () => {
        divProducto.remove();
    });
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
                    localStorage.setItem('userId', data.userId);
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
