// Agregar Producto (Formulario Agregar)
document.getElementById('addProductForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData(this);

    try {
        const response = await fetch('/add-product', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert('Producto agregado con éxito!');
            document.getElementById('addProductForm').reset();
            await actualizarProductos(); // Actualiza los productos en el select
        } else {
            alert('Error al agregar el producto: ' + result.message);
        }
    } catch (error) {
        alert('Error en la solicitud: ' + error.message);
    }
});

// Cargar y actualizar los productos en el select
async function actualizarProductos() {
  const select = document.getElementById('productoSelect');
  select.innerHTML = '';  // Limpiar las opciones existentes
  const defaultOption = document.createElement('option');
  defaultOption.text = "Seleccione un producto";
  select.appendChild(defaultOption);

  try {
      const response = await fetch('/productos');
      const productos = await response.json();
      
      productos.forEach(producto => {
          const option = document.createElement('option');
          option.value = producto.id_producto;
          option.textContent = producto.nombre;
          select.appendChild(option);
      });
  } catch (error) {
      alert('Error al cargar productos: ' + error.message);
  }
}

// Cargar datos del producto seleccionado (Edición)
function cargarDatosProducto() {
    const productoId = document.getElementById('productoSelect').value;
    console.log(productoId); // Verifica el id del producto

    if (productoId) {
        fetch(`/productos/${productoId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la solicitud. Código de respuesta: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                document.getElementById('nombreEdit').value = data.nombre;
                document.getElementById('precioEdit').value = data.precio;
                document.getElementById('stockEdit').value = data.stock;
                document.getElementById('id_producto').value = data.id_producto;
            })
            .catch(error => alert('Error al cargar el producto: ' + error.message));
    }
}

// Guardar cambios en el producto (con alerta en lugar de redirección)
const guardarButton = document.querySelector('.button_reg');
guardarButton.addEventListener('click', async function(event) {
    event.preventDefault();

    const productoId = document.getElementById('id_producto').value;
    const nombre = document.getElementById('nombreEdit').value;
    const precio = document.getElementById('precioEdit').value;
    const stock = document.getElementById('stockEdit').value;
    const imagen = document.getElementById('imagenEdit').files[0];

    console.log('Producto ID:', productoId); // Verifica que el producto ID sea correcto

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('precio', precio);
    formData.append('stock', stock);
    formData.append('id_producto', productoId);

    if (imagen) formData.append('imagen', imagen);

    try {
        const response = await fetch(`/actualizar-producto/${productoId}`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        console.log(result); // Verifica la respuesta del servidor

        if (response.ok) {
            alert('Producto actualizado con éxito!');
            await actualizarProductos(); // Actualizar lista de productos
        } else {
            alert('Error al actualizar el producto: ' + result.message);
        }
    } catch (error) {
        alert('Error en la solicitud: ' + error.message);
    }
});

// Eliminar Producto
function eliminarProducto() {
    const productoId = document.getElementById('id_producto').value;

    if (!productoId) {
        alert('Por favor, selecciona un producto primero.');
        return;
    }

    if (confirm('¿Estás seguro de eliminar este producto?')) {
        fetch(`/eliminar-producto/${productoId}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Producto eliminado exitosamente.');
                    actualizarProductos(); // Actualizar productos después de eliminar
                } else {
                    alert('Error al eliminar el producto: ' + data.message);
                }
            })
            .catch(error => alert('Error en la eliminación: ' + error.message));
    }
}

// Inicializar los productos cuando se carga la página
window.addEventListener('load', actualizarProductos);

// Función para mostrar mensaje de carga de imagen
function mostrarMensajeCarga() {
    const mensaje = document.getElementById("uploadSuccess");
    mensaje.style.display = "block";
}

// Cargar Producto por ID (verificación)
function cargarProducto(id) {
    fetch(`/productos/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la solicitud. Código de respuesta: ' + response.status);
        }
        return response.json();
      })
      .then(producto => {
        console.log('Producto cargado:', producto);
        // Aquí puedes usar los datos del producto, por ejemplo, mostrarlos en el DOM
      })
      .catch(error => {
        console.error('Error al cargar el producto:', error);
      });
}
