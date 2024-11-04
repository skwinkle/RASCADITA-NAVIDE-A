document.addEventListener('DOMContentLoaded', () => {
    const formProducto = document.getElementById('formProducto');
    const nombreProductoInput = document.getElementById('nombreProducto');
    const productosGrid = document.getElementById('productosGrid');

    const limpiarNombreProducto = (input) => {
        input.value = input.value.replace(/[^a-zA-Z\s]/g, '').trim();
    };

    nombreProductoInput.addEventListener('blur', () => {
        limpiarNombreProducto(nombreProductoInput);
    });

    formProducto.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(formProducto);

        try {
            const response = await fetch(formProducto.action, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                formProducto.reset();
                await loadProducts(); // Carga los productos después de agregar uno nuevo
            } else {
                const errorResponse = await response.json();
                alert("Error al agregar el producto: " + errorResponse.message);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Hubo un error al enviar el formulario: " + error.message);
        }
    });

    async function loadProducts() {
        try {
            const response = await fetch('/productos'); // Asegúrate de que este endpoint devuelva la lista de productos
            if (!response.ok) throw new Error('Error al cargar productos.');

            const products = await response.json();

            productosGrid.innerHTML = ''; // Limpia la grid actual

            products.forEach(product => {
                const productItem = document.createElement('div');
                productItem.classList.add('productos__griditem');
                productItem.innerHTML = `
                    <div class="productos__img">
                        <img src="${product.imagen}" alt="${product.nombre}">
                    </div>
                    <div class="productos__wrapertext">
                        <p class="productos__name">${product.nombre}</p>
                        <p class="productos__precio">$${product.precio}</p>
                    </div>
                `;
                productosGrid.appendChild(productItem);
            });
        } catch (error) {
            console.error("Error al cargar productos:", error);
            alert("No se pudieron cargar los productos.");
        }
    }

    // Cargar productos al cargar la página
    loadProducts();
});
