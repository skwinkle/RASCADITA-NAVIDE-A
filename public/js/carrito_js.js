document.addEventListener('DOMContentLoaded', () => {
    const carritoWrapper = document.querySelector('.carrito');
    const pagarBtn = document.querySelector('.btn__carrito.pagar');
    const modalWrapper = document.querySelector('.wrapper__modal');
    const userId = localStorage.getItem('userId');

    if (userId) {
        obtenerFondos(userId);
        obtenerProductosRelacionados();
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
                realizarPago(userId);
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
});

function obtenerFondos(userId) {
    fetch(`/obtener-fondos/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.fondos !== undefined) {
                const fondosElement = document.querySelector('.fondos-restantes');
                if (fondosElement) {
                    fondosElement.textContent = `Fondos restantes: $${data.fondos.toFixed(2)}`;
                }
            }
        })
        .catch(error => {
            console.error('Error al obtener fondos:', error);
        });
}

function obtenerProductosRelacionados() {
    fetch('/productos-relacionados')
        .then(response => response.json())
        .then(productos => {
            mostrarProductosRelacionados(productos);
        })
        .catch(error => {
            console.error('Error al obtener los productos relacionados:', error);
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
    const deleteBtn = divProducto.querySelector('.producto--delete');
    const addBtn = divProducto.querySelector('.producto--add');
    const cantInput = divProducto.querySelector('.producto--cant');
    const eliminarBtn = divProducto.querySelector('.button__delete');

    deleteBtn.addEventListener('click', () => {
        let cantidadActual = parseInt(cantInput.value);
        if (cantidadActual > 1) {
            cantInput.value = cantidadActual - 1;
            actualizarCarrito(producto.id_producto, cantInput.value);
        }
    });

    addBtn.addEventListener('click', () => {
        let cantidadActual = parseInt(cantInput.value);
        if (cantidadActual < producto.stock) {
            cantInput.value = cantidadActual + 1;
            actualizarCarrito(producto.id_producto, cantInput.value);
        }
    });

    cantInput.addEventListener('change', () => {
        let cantidadActual = parseInt(cantInput.value);
        if (cantidadActual < 1) {
            cantInput.value = 1;
        } else if (cantidadActual > producto.stock) {
            cantInput.value = producto.stock;
        }
        actualizarCarrito(producto.id_producto, cantInput.value);
    });

    eliminarBtn.addEventListener('click', () => {
        if (confirm(`¿Deseas eliminar "${producto.nombre}" del carrito?`)) {
            eliminarProductoDelCarrito(producto.id_producto);
            divProducto.remove();
        }
    });
}

function actualizarCarrito(idProducto, cantidad) {
    fetch(`/actualizar-carrito/${idProducto}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad })
    })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert('Error al actualizar el carrito');
            }
        })
        .catch(error => {
            console.error('Error al actualizar el carrito:', error);
        });
}

function eliminarProductoDelCarrito(idProducto) {
    fetch(`/eliminar-del-carrito/${idProducto}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert('Error al eliminar el producto del carrito');
            }
        })
        .catch(error => {
            console.error('Error al eliminar producto:', error);
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
                headers: { 'Content-Type': 'application/json' },
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

function realizarPago(userId) {
    fetch(`/realizar-pago/${userId}`, {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Pago realizado correctamente');
            // Redirigir a otra página o limpiar el carrito
        } else {
            alert('Error al procesar el pago');
        }
    })
    .catch(error => {
        console.error('Error al realizar el pago:', error);
    });
}
