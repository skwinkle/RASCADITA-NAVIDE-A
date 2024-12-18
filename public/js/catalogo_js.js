document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("loginModal");
    const cerrarSesionBtn = document.querySelector(".button__delete");
    const modificarDatosBtn = document.querySelector(".profile__btn");
    const form = document.querySelector("form");
    const gmailInput = document.getElementById("correoLogin");
    const passwordInput = document.getElementById("contrasenaLogin");

    const getUserId = () => {
        const userId = localStorage.getItem("userId");
        console.log("userId desde localStorage:", userId);
        return userId;
    };

    const verificarSesion = () => {
        const userId = getUserId();

        if (userId) {
            ocultarModalInicioSesion();
            mostrarCatalogo();
        } else {
            mostrarModalInicioSesion();
        }
    };

    const validarFormulario = () => {
        const gmail = gmailInput?.value.trim();
        const password = passwordInput?.value.trim();

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

    form?.addEventListener("submit", (event) => {
        event.preventDefault();

        if (validarFormulario()) {
            const email = gmailInput.value.trim();
            const password = passwordInput.value.trim();

            fetch("/iniciar-sesion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ correo: email, contraseña: password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Inicio de sesión exitoso.");
                    localStorage.setItem("userId", data.userId);
                    location.reload();
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error("Error al iniciar sesión:", error);
            });
        }
    });

    const mostrarModalInicioSesion = () => {
        if (modal) modal.style.display = "block";
    };

    const ocultarModalInicioSesion = () => {
        if (modal) modal.style.display = "none";
    };

    const mostrarCatalogo = () => {
        fetch("/catalogo")
            .then(response => response.json())
            .then(productos => {
                const catalogo = document.getElementById("catalogo");
                if (catalogo) {
                    catalogo.innerHTML = ''; // Limpiar el catálogo
    
                    productos.forEach(producto => {
                        // Validar que el producto tenga stock mayor a 0
                        if (producto.stock > 0) {
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
                                        <button class="form__button agregarAlCarritoBtn" data-producto-id="${producto.id_producto}">
                                            Agregar al Carrito
                                        </button>
                                    </div>
                                `;
                                catalogo.appendChild(divProducto);
                            } else {
                                console.error(`El precio del producto ${producto.nombre} no es un número válido`);
                            }
                        }
                    });
    
                    // Manejar eventos para los botones "Agregar al Carrito"
                    const agregarAlCarritoBtns = document.querySelectorAll(".agregarAlCarritoBtn");
                    agregarAlCarritoBtns.forEach(btn => {
                        btn.addEventListener("click", (event) => {
                            const productoId = event.target.getAttribute("data-producto-id");
                            const userId = getUserId();
    
                            if (!userId) {
                                alert("Debes iniciar sesión para agregar productos al carrito.");
                                mostrarModalInicioSesion();
                                return;
                            }
    
                            fetch("/agregar-al-carrito", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ productoId, userId })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert("Producto agregado al carrito.");
                                } else {
                                    alert(data.message);
                                }
                            })
                            .catch(error => {
                                console.error("Error al agregar al carrito:", error);
                            });
                        });
                    });
                }
            })
            .catch(error => {
                console.error("Error al cargar el catálogo:", error);
            });
    };
    

    cerrarSesionBtn?.addEventListener("click", () => {
        localStorage.removeItem("userId");
        location.reload();
    });

    modificarDatosBtn?.addEventListener("click", () => {
        if (modal) {
            modal.style.display = "block";
        }
    });

    const idUsuario = getUserId();
    if (idUsuario) {
        mostrarCatalogo();
        ocultarModalInicioSesion();
    }

    const closeModal = document.querySelector("#closeModal");
    closeModal?.addEventListener("click", () => {
        if (modal) modal.style.display = "none";
    });

    const modalOverlay = document.querySelector(".modal-overlay");
    modalOverlay?.addEventListener("click", () => {
        if (modal) modal.style.display = "none";
        modalOverlay.style.display = "none";
    });

    verificarSesion();
});
