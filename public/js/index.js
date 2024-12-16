// Función para establecer una cookie
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000)); // Expira en "days" días
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
    console.log(`Cookie configurada: ${name}=${value}; ${expires}; path=/`);
}

document.addEventListener('DOMContentLoaded', () => {
    verificarSesion(); // Verifica si hay sesión activa al cargar la página

    const form = document.querySelector('form');
    const gmailInput = document.getElementById('correo');
    const passwordInput = document.getElementById('password');

    const validarFormulario = () => {
        const gmail = gmailInput.value.trim();
        const password = passwordInput.value.trim();

        if (gmail === '' || password === '') {
            alert('Por favor, completa todos los campos.');
            return false;
        }

        if (!/\S+@\S+\.\S+/.test(gmail)) {
            alert('El correo no tiene un formato válido.');
            return false;
        }

        if (password.length < 5 || password.length > 10) {
            alert('La contraseña debe tener entre 5 y 10 caracteres.');
            return false;
        }

        if (/\s/.test(password)) {
            alert('La contraseña no puede contener espacios.');
            return false;
        }

        return true;
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (validarFormulario()) {
            const email = gmailInput.value.trim();
            const password = passwordInput.value.trim();

            fetch('/iniciar-sesion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ correo: email, contraseña: password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Inicio de sesión exitoso.');
                    setCookie("session", "true", 30); // Configura la cookie de sesión
                    setCookie("userId", data.userId, 30); // Configura la cookie de ID de usuario

                    console.log("Cookies después de iniciar sesión:");
                    console.log(document.cookie); // Ver todas las cookies configuradas

                    window.location.href = data.redirect; // Redirige a la página correspondiente
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error al iniciar sesión:', error);
            });
        }
    });
});

// Función para verificar si existe una sesión activa
function verificarSesion() {
    const userIdCookie = getCookie("userId");

    // Si el ID de usuario está presente, ocultamos el modal
    if (userIdCookie) {
        console.log("Sesión activa, no se muestra el modal.");
        document.getElementById("modal").style.display = "none"; // Ocultar el modal si existe userId
    } else {
        console.log("No hay sesión activa, mostrando modal.");
        document.getElementById("modal").style.display = "block"; // Mostrar el modal si no hay sesión activa
    }
}

// Función para obtener una cookie por su nombre
function getCookie(name) {
    const decodedCookies = decodeURIComponent(document.cookie);
    const cookiesArray = decodedCookies.split(';');

    for (let i = 0; i < cookiesArray.length; i++) {
        let cookie = cookiesArray[i].trim();
        if (cookie.startsWith(name + "=")) {
            return cookie.substring(name.length + 1);
        }
    }
    return "";
}

// Función para obtener el catálogo
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

// Función para mostrar los productos
function mostrarProductos(productos) {
    const productosGrid = document.getElementById("productosGrid");
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
                </div>
            `;
            productosGrid.appendChild(divProducto);
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

// Función para cerrar el modal
function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) {
        modal.style.display = "none";
    }
}

obtenerCatalogo();
