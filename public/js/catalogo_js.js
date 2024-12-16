function obtenerCatalogo() {
    fetch("/catalogo")
        .then(response => response.json())
        .then(data => {
            mostrarProductos(data);
        })
        .catch(error => {
            console.error("Error al obtener el catálogo:", error);
        });
}

function mostrarProductos(productos) {
    const catalogo = document.getElementById("catalogo");
    productos.forEach(producto => {
        const precio = parseFloat(producto.precio);
        if (!isNaN(precio)) {
            const precioFormateado = precio.toFixed(2);

            const divProducto = document.createElement("div");
            divProducto.classList.add("grid__item--producto");
            divProducto.innerHTML = `
                <img src="${producto.imagen}" alt="${producto.nombre}" class="grid__item--img">
                <div class="grid__item--content">
                    <div class="content--name">
                        ${producto.nombre} $${precioFormateado}
                    </div>
                    <button class="form__button agregarAlCarritoBtn" data-producto-id="${producto.id_producto}">Agregar al Carrito</button>
                </div>
            `;
            catalogo.appendChild(divProducto);
        } else {
            console.error(`El precio del producto ${producto.nombre} no es un número válido`);
        }
    });

    document.querySelectorAll(".agregarAlCarritoBtn").forEach(btn => {
        btn.addEventListener("click", function() {
            const productoId = btn.getAttribute("data-producto-id");
            agregarAlCarrito(productoId);
        });
    });
}

function agregarAlCarrito(productoId) {
    fetch('/verificar-sesion')
        .then(response => response.json())
        .then(data => {
            if (!data.autenticado) {
                mostrarModal();
            } else {
                fetch(`/productos/${productoId}`)
                    .then(response => response.json())
                    .then(producto => {
                        if (producto) {
                            const precio = producto.precio;
                            const cantidad = 1;
                            const subtotal = precio * cantidad;

                            fetch("/agregar-al-carrito", {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ productoId, cantidad, subtotal })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    console.log("Producto agregado al carrito");
                                } else {
                                    console.error("Error al agregar el producto al carrito");
                                }
                            })
                            .catch(error => {
                                console.error("Error al agregar el producto al carrito:", error);
                            });
                        } else {
                            console.error("Producto no encontrado");
                        }
                    })
                    .catch(error => {
                        console.error('Error al obtener el precio del producto:', error);
                    });
            }
        })
        .catch(error => {
            console.error('Error al verificar sesión:', error);
        });
}

function mostrarModal() {
    document.getElementById("loginModal").style.display = "block";
}

function cerrarModal() {
    document.getElementById("loginModal").style.display = "none";
}

document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const correo = document.getElementById("correoLogin").value;
    const contrasena = document.getElementById("contrasenaLogin").value;

    fetch('/iniciar-sesion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, contrasena })
    })
    .then(response => {
        if (response.ok) {
            cerrarModal();
            location.reload();
        } else {
            document.getElementById("errorMessage").style.display = "block";
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById("errorMessage").style.display = "block";
    });
});

obtenerCatalogo();
