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

    const setCookie = (name, value, days) => {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    };

    const getCookie = (name) => {
        const decodedCookies = decodeURIComponent(document.cookie);
        const cookiesArray = decodedCookies.split(';');
        for (let i = 0; i < cookiesArray.length; i++) {
            let cookie = cookiesArray[i].trim();
            if (cookie.startsWith(name + "=")) {
                return cookie.substring(name.length + 1);
            }
        }
        return "";
    };

    const verificarSesion = () => {
        // Ya no mostramos el modal aquí
        const sessionCookie = getCookie("session");
        const userIdCookie = getCookie("userId");

        if (!sessionCookie || !userIdCookie) {
            console.log("No hay sesión activa");
        }
    };

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

    form.addEventListener("submit", (event) => {
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
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error en la respuesta del servidor");
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert("Inicio de sesión exitoso.");
                    setCookie("session", "true", 30);
                    setCookie("userId", data.userId, 30);
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

    const mostrarPerfil = (idUsuario) => {
        fetch(`/api/usuarios/${idUsuario}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("No se pudo cargar la información del usuario.");
                }
                return response.json();
            })
            .then((data) => {
                if (data.nombre_usuario && data.correo) {
                    perfilNombre.textContent = `Nombre: ${data.nombre_usuario}`;
                    perfilCorreo.textContent = `Correo: ${data.correo}`;
                } else {
                    perfilNombre.textContent = 'Nombre: No disponible';
                    perfilCorreo.textContent = 'Correo: No disponible';
                }

                historial.innerHTML = "";

                data.facturas.forEach((factura) => {
                    const pedidoDiv = document.createElement("div");
                    pedidoDiv.classList.add("pedido");

                    const productos = factura.productos.map(producto => producto.nombre).join(", ");
                    const fecha = new Date(factura.fecha).toLocaleDateString("es-ES");

                    pedidoDiv.innerHTML = `
                        <p class="pedido__info pedido__usuario">${data.nombre_usuario}</p>
                        <p class="pedido__info pedido__fecha">${fecha}</p>
                        <p class="pedido__info pedido__productos">Productos: ${productos}</p>
                        <input type="button" value="VER TICKET" class="pedido__button" data-id-factura="${factura.id_factura}">
                    `;

                    historial.appendChild(pedidoDiv);
                });

                document.querySelectorAll(".pedido__button").forEach((btn) => {
                    btn.addEventListener("click", (e) => {
                        const idFactura = e.target.dataset.idFactura;
                        fetch(`/api/facturas/${idFactura}`)
                            .then((response) => {
                                if (!response.ok) {
                                    throw new Error("No se pudo cargar el ticket.");
                                }
                                return response.json();
                            })
                            .then((ticket) => {
                                if (!ticket || !ticket.negocio) {
                                    console.error("Ticket no válido o incompleto", ticket);
                                    return;
                                }

                                const ticketVentana = window.open("", "Ticket", "width=600,height=400");
                                ticketVentana.document.write(`
                                    <h1>Ticket</h1>
                                    <p>Nombre del negocio: ${ticket.negocio}</p>
                                    <p>Fecha de la Compra: ${new Date(ticket.fecha).toLocaleDateString("es-ES")}</p>
                                    <p>Productos Comprados: ${ticket.productos.map(producto => `${producto.nombre}`).join(", ")}</p>
                                    <p>Total a pagar: ${ticket.total}</p>
                                    <p>Número de Venta: ${ticket.id_factura}</p>
                                `);
                                ticketVentana.document.close();
                            })
                            .catch((error) => {
                                console.error("Error al cargar el ticket:", error);
                            });
                    });
                });
            })
            .catch((error) => {
                console.error("Error al cargar el perfil del usuario:", error);
            });
    };

    const cerrarSesion = () => {
        document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        location.reload();
    };

    cerrarSesionBtn.addEventListener("click", cerrarSesion);

    // Mostrar el modal solo cuando se haga clic en "Modificar datos"
    modificarDatosBtn.addEventListener("click", () => {
        if (modal) {
            modal.style.display = "block";
        }
    });

    // No mostrar el modal al cargar la página, solo si el usuario hace clic en el botón
    const idUsuario = getCookie("userId");
    if (idUsuario) {
        mostrarPerfil(idUsuario);
        ocultarModalInicioSesion();
    }

    const closeModal = document.querySelector("#closeModal");
    if (closeModal) {
        closeModal.addEventListener("click", () => {
            if (modal) modal.style.display = "none";
        });
    }

    const modalOverlay = document.querySelector(".modal-overlay");
    if (modalOverlay) {
        modalOverlay.addEventListener("click", () => {
            if (modal) modal.style.display = "none";
            modalOverlay.style.display = "none";
        });
    }
});
