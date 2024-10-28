document.addEventListener("DOMContentLoaded", function() {
    const cantidadInput = document.getElementById("cantidad");
    const idProductoInput = document.getElementById("id_producto");

    cantidadInput.setAttribute('readonly', true); 


    cantidadInput.addEventListener("blur", function(event) {
        const input = event.target;
        const invalidCharacters = /[^\d]/; 


        input.value = input.value.replace(invalidCharacters, "");


        const value = Number(input.value); 
        if (isNaN(value) || value < 0) {
            alert("Por favor, ingrese solo números válidos y positivos.");
            input.value = ""; 
        }
    });


    const obtenerCantidadProducto = (productoId) => {
        return fetch(`/getCantidad/${productoId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al obtener la cantidad');
                }
                return response.json();
            })
            .then(data => {
                return data.cantidad;
            });
    };

    document.getElementById('producto').addEventListener('change', function() {
        const productoId = this.value; 

        if (productoId) {

            obtenerCantidadProducto(productoId)
                .then(cantidad => {

                    cantidadInput.value = cantidad;
                    cantidadInput.removeAttribute('readonly'); 

                    idProductoInput.value = productoId;
                })
                .catch(error => {
                    console.error(error);
                    alert('No se pudo obtener la cantidad del producto.');
                });
        } else {
            cantidadInput.value = ''; 
            cantidadInput.setAttribute('readonly', true); 
            idProductoInput.value = ''; 
        }
    });
});
