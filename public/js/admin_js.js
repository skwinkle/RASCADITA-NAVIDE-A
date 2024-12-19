function cargarProductos() {
    fetch('/productos')
        .then((response) => response.json())
        .then((productos) => {
            const selectEditar = document.getElementById('productoSelect');
            const selectEliminar = document.getElementById('productoSelectEliminar');

            selectEditar.innerHTML = '<option value="" disabled selected>Seleccione un producto</option>';
            selectEliminar.innerHTML = '<option value="" disabled selected>Seleccione un producto</option>';

            productos.forEach((producto) => {
                const option = document.createElement('option');
                option.value = producto.id_producto;
                option.textContent = producto.nombre;
                selectEditar.appendChild(option.cloneNode(true));
                selectEliminar.appendChild(option);
            });
        })
        .catch((error) => console.error(error));
}

function cargarDatosProducto() {
    const productoId = document.getElementById('productoSelect').value;

    if (!productoId) return;

    fetch(`/productos/${productoId}`)
        .then((response) => response.json())
        .then((producto) => {
            if (producto) {
                document.getElementById('id_producto_add').value = producto.id_producto;
                document.getElementById('nombreEdit').value = producto.nombre;
                document.getElementById('precioEdit').value = producto.precio;
                document.getElementById('stockEdit').value = producto.stock;
            }
        })
        .catch((error) => console.error(error));
}

function agregarProducto() {
    const form = document.getElementById('addProductForm');
    const formData = new FormData(form);

    fetch('/add-product', {
        method: 'POST',
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert('Producto creado correctamente.');
                cargarProductos();
                form.reset();
            } else {
                alert('Error al crear el producto.');
            }
        })
        .catch((error) => console.error(error));
}

function actualizarProducto() {
    const id = document.getElementById('id_producto_add').value;
    const nombre = document.getElementById('nombreEdit').value;
    const precio = document.getElementById('precioEdit').value;
    const stock = document.getElementById('stockEdit').value;
    const imagen = document.getElementById('imagenEdit').files[0];

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('precio', precio);
    formData.append('stock', stock);
    if (imagen) {
        formData.append('imagen', imagen);
    }

    fetch(`/actualizar-producto/${id}`, {
        method: 'POST',
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert('Producto editado correctamente.');
                cargarProductos();
            } else {
                alert('Error al editar el producto.');
            }
        })
        .catch((error) => console.error(error));
}

function eliminarProducto() {
    const productoId = document.getElementById('productoSelectEliminar').value;

    if (!productoId) {
        alert('Seleccione un producto para eliminar.');
        return;
    }

    fetch(`/eliminar-producto/${productoId}`, {
        method: 'DELETE',
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert('Producto eliminado correctamente.');
                cargarProductos();
            } else {
                alert('Error al eliminar el producto.');
            }
        })
        .catch((error) => console.error(error));
}

document.getElementById('addProductForm').addEventListener('submit', (e) => {
    e.preventDefault();
    agregarProducto();
});

document.getElementById('productoSelect').addEventListener('change', cargarDatosProducto);

document.addEventListener('DOMContentLoaded', cargarProductos);
