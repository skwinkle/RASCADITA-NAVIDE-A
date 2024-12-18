document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal");
    const cerrarSesionBtn = document.querySelector(".button__delete");
    const modificarDatosBtn = document.querySelector(".profile__btn");
    const modalEditar = document.querySelector(".wrapper__modal");
    const historial = document.querySelector(".wrapper__historial");
    const perfilNombre = document.querySelector(".profile__name");
    const perfilCorreo = document.querySelector(".profile__correo");
    const form = document.querySelector("form");
    const gmailInput = document.getElementById("correo");
    const passwordInput = document.getElementById("password");

    const cargarProductos = () => {
        fetch('/productos')
            .then(response => response.json())
            .then(data => {
                const selectProducto = document.getElementById("productoSelect");
                const selectProductoEliminar = document.getElementById("productoSelectEliminar");
                data.forEach(producto => {
                    const option = document.createElement("option");
                    option.value = producto.id_producto;
                    option.textContent = producto.nombre;
                    selectProducto.appendChild(option);
                    
                    const optionEliminar = document.createElement("option");
                    optionEliminar.value = producto.id_producto;
                    optionEliminar.textContent = producto.nombre;
                    selectProductoEliminar.appendChild(optionEliminar);
                });
            })
            .catch(error => console.error('Error al cargar productos:', error));
    };

    const cargarDatosProducto = () => {
        const productoId = document.getElementById("productoSelect").value;
        if (productoId) {
            fetch(`/productos/${productoId}`)
                .then(response => response.json())
                .then(producto => {
                    document.getElementById("nombreEdit").value = producto.nombre;
                    document.getElementById("precioEdit").value = producto.precio;
                    document.getElementById("stockEdit").value = producto.stock;
                })
                .catch(error => console.error('Error al cargar datos del producto:', error));
        }
    };

    const eliminarProducto = () => {
        const productoId = document.getElementById("productoSelectEliminar").value;
        if (productoId) {
            fetch(`/eliminar-producto/${productoId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('Producto eliminado con éxito');
                    cargarProductos();
                }
            })
            .catch(error => console.error('Error al eliminar el producto:', error));
        }
    };

    const crearProducto = (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        fetch('/productos', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Producto creado con éxito');
                cargarProductos();
            } else {
                alert('Error al crear el producto');
            }
        })
        .catch(error => console.error('Error al crear producto:', error));
    };

    const actualizarProducto = () => {
        const productoId = document.getElementById("productoSelect").value;
        const nombre = document.getElementById("nombreEdit").value;
        const precio = document.getElementById("precioEdit").value;
        const stock = document.getElementById("stockEdit").value;

        if (productoId && nombre && precio && stock) {
            fetch(`/productos/${productoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, precio, stock })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('Producto actualizado con éxito');
                    cargarProductos();
                }
            })
            .catch(error => console.error('Error al actualizar producto:', error));
        }
    };

    const mostrarHistorial = () => {
        fetch('/historial')
            .then(response => response.json())
            .then(data => {
                historial.innerHTML = '';
                data.forEach(pedido => {
                    const pedidoDiv = document.createElement("div");
                    pedidoDiv.classList.add("pedido");
                    const productos = pedido.productos.map(producto => producto.nombre).join(", ");
                    const fecha = new Date(pedido.fecha).toLocaleDateString("es-ES");

                    pedidoDiv.innerHTML = `
                        <p class="pedido__info pedido__usuario">${pedido.usuario}</p>
                        <p class="pedido__info pedido__fecha">${fecha}</p>
                        <p class="pedido__info pedido__productos">Productos: ${productos}</p>
                        <input type="button" value="VER TICKET" class="pedido__button" data-id-pedido="${pedido.id}">
                    `;
                    historial.appendChild(pedidoDiv);

                    const verTicketBtn = pedidoDiv.querySelector(".pedido__button");
                    verTicketBtn.addEventListener("click", (e) => {
                        const pedidoId = e.target.dataset.idPedido;
                        fetch(`/facturas/${pedidoId}`)
                            .then(response => response.json())
                            .then(ticket => {
                                const ticketVentana = window.open("", "Ticket", "width=600,height=400");
                                ticketVentana.document.write(`
                                    <h1>Ticket</h1>
                                    <p>Usuario: ${ticket.usuario}</p>
                                    <p>Fecha: ${new Date(ticket.fecha).toLocaleDateString("es-ES")}</p>
                                    <p>Productos: ${ticket.productos.map(producto => `${producto.nombre}`).join(", ")}</p>
                                    <p>Total: ${ticket.total}</p>
                                `);
                                ticketVentana.document.close();
                            })
                            .catch(error => console.error("Error al cargar el ticket:", error));
                    });
                });
            })
            .catch(error => console.error("Error al cargar el historial:", error));
    };

    cargarProductos();
    mostrarHistorial();

    document.getElementById("addProductForm").addEventListener("submit", crearProducto);
    
    document.getElementById("productoSelect").addEventListener("change", cargarDatosProducto);
    document.querySelector(".button_reg").addEventListener("click", actualizarProducto);

    document.querySelector(".button__delete").addEventListener("click", eliminarProducto);
});
