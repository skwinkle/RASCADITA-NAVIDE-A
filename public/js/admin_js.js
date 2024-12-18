document.addEventListener('DOMContentLoaded', () => {
    const productosContainer = document.getElementById('productos-container');
    const historialContainer = document.getElementById('historial-container');

    const obtenerProductos = () => {
        fetch('/productos')
            .then(res => res.json())
            .then(productos => {
                productosContainer.innerHTML = '';
                productos.forEach(producto => {
                    const productoElement = document.createElement('div');
                    productoElement.classList.add('producto');
                    productoElement.innerHTML = `
                        <h3>${producto.nombre}</h3>
                        <p>Precio: $${producto.precio}</p>
                        <p>Stock: ${producto.stock}</p>
                        <button class="eliminar-producto" data-id="${producto.id_producto}">Eliminar</button>
                        <button class="editar-producto" data-id="${producto.id_producto}">Editar</button>
                    `;
                    productosContainer.appendChild(productoElement);
                });
            })
            .catch(err => console.error('Error al obtener productos:', err));
    };

    const obtenerHistorial = () => {
        fetch('/api/historial')
            .then(res => res.json())
            .then(historial => {
                historialContainer.innerHTML = '';
                historial.forEach(factura => {
                    const facturaElement = document.createElement('div');
                    facturaElement.classList.add('factura');
                    facturaElement.innerHTML = `
                        <h3>Factura ID: ${factura.id_factura}</h3>
                        <p>Fecha: ${factura.fecha}</p>
                        <p>Total: $${factura.total}</p>
                        <h4>Productos:</h4>
                        <ul>
                            ${factura.productos.map(producto => `
                                <li>${producto.nombre} - Cantidad: ${producto.cantidad} - Subtotal: $${producto.subtotal}</li>
                            `).join('')}
                        </ul>
                    `;
                    historialContainer.appendChild(facturaElement);
                });
            })
            .catch(err => console.error('Error al obtener historial:', err));
    };

    const eliminarProducto = (id) => {
        fetch(`/eliminar-producto/${id}`, {
            method: 'DELETE'
        })
            .then(res => res.json())
            .then(() => {
                obtenerProductos();
            })
            .catch(err => console.error('Error al eliminar producto:', err));
    };

    const editarProducto = (id) => {
        const nombre = prompt('Nuevo nombre del producto');
        const precio = prompt('Nuevo precio del producto');
        const stock = prompt('Nuevo stock del producto');
        const imagen = prompt('Nueva imagen del producto (opcional)');

        if (nombre && precio && stock) {
            fetch(`/actualizar-producto/${id}`, {
                method: 'POST',
                body: JSON.stringify({
                    nombre,
                    precio,
                    stock,
                    imagen
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(res => res.json())
                .then(() => {
                    obtenerProductos();
                })
                .catch(err => console.error('Error al editar producto:', err));
        }
    };

    productosContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('eliminar-producto')) {
            const id = e.target.getAttribute('data-id');
            eliminarProducto(id);
        } else if (e.target.classList.contains('editar-producto')) {
            const id = e.target.getAttribute('data-id');
            editarProducto(id);
        }
    });

    obtenerProductos();
    obtenerHistorial();
});
