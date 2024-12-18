const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const cookieParser = require('cookie-parser');  // Importamos cookie-parser
const app = express();

app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '$$I0h17eSi$$',
    database: 'PanaderiaDB'
});

// Configuración de almacenamiento de multer (puedes configurarlo como desees)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // La carpeta donde se guardarán los archivos subidos
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Renombrar el archivo subido
    }
});


// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public'))); // Esta línea permite que se sirvan los archivos dentro de public

// Configurar Express para servir archivos estáticos desde la carpeta "public/html"
app.use(express.static(path.join(__dirname, 'public', 'html')));

// Ruta para servir el archivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});


const upload = multer({ storage: storage });

db.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        process.exit(1);
    }
    console.log('Conexión exitosa a la base de datos.');
});

// Usamos cookie-parser para acceder a las cookies
app.use(cookieParser());

// Configuración de sesiones
app.use(session({
    secret: 'tu_clave_secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.post('/add-product', upload.single('imagen'), (req, res) => {
    const { nombre, precio, stock, descripcion } = req.body;
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    const query = 'INSERT INTO Productos (nombre, precio, stock, imagen) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, precio, stock, imagen], (err, result) => {
        if (err) {
            console.error('Error al insertar producto:', err);
            return res.status(500).json({ message: 'Error al agregar el producto.' });
        }
        res.json({ success: true });
    });
});

app.post('/realizar-pago/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (!userId) {
        console.log('ID de usuario no válido.');
        return res.status(400).json({ success: false, message: 'ID de usuario no válido.' });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.log('Error al iniciar la transacción:', err);
            return res.status(500).json({ success: false, message: 'Error al iniciar la transacción.' });
        }

        try {
            console.log('Iniciando transacción...');

            db.query(
                `SELECT c.id_producto, c.cantidad, c.subtotal, p.stock
                 FROM Carrito c 
                 JOIN Productos p ON c.id_producto = p.id_producto
                 WHERE c.id_usuario = ?`,
                [userId],
                (err, carrito) => {
                    if (err) {
                        console.error('Error al obtener el carrito:', err);
                        return res.status(500).json({ success: false, message: 'Error al obtener el carrito.' });
                    }

                    if (carrito.length === 0) {
                        console.log('El carrito está vacío.');
                        throw new Error('El carrito está vacío.');
                    }

                    const totalCompra = carrito.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
                    console.log(`Total de la compra: ${totalCompra}`);

                    db.query(
                        'SELECT fondos FROM Usuarios WHERE id_usuario = ?',
                        [userId],
                        (err, usuario) => {
                            if (err) {
                                console.error('Error al verificar los fondos:', err);
                                return res.status(500).json({ success: false, message: 'Error al verificar los fondos.' });
                            }

                            if (usuario.length === 0) {
                                console.log('Usuario no encontrado.');
                                return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
                            }

                            const fondosActuales = usuario[0].fondos;

                            if (fondosActuales < totalCompra) {
                                console.log('Fondos insuficientes.');
                                return res.status(400).json({ success: false, message: 'Fondos insuficientes.' });
                            }

                            db.query(
                                'INSERT INTO Facturas (id_usuario, total) VALUES (?, ?)',
                                [userId, totalCompra],
                                (err, facturaResult) => {
                                    if (err) {
                                        console.error('Error al crear factura:', err);
                                        return res.status(500).json({ success: false, message: 'Error al crear factura.' });
                                    }

                                    const idFactura = facturaResult.insertId;

                                    carrito.forEach((item) => {
                                        if (item.stock < item.cantidad) {
                                            console.log(`Stock insuficiente para el producto con ID ${item.id_producto}.`);
                                            return res.status(400).json({ success: false, message: `Stock insuficiente para el producto con ID ${item.id_producto}.` });
                                        }

                                        db.query(
                                            `INSERT INTO Detalle_Factura (id_factura, id_producto, cantidad, subtotal) 
                                             VALUES (?, ?, ?, ?)`,
                                            [idFactura, item.id_producto, item.cantidad, item.subtotal],
                                            (err) => {
                                                if (err) {
                                                    console.error('Error al insertar detalles de factura:', err);
                                                    return res.status(500).json({ success: false, message: 'Error al insertar detalles de factura.' });
                                                }

                                                db.query(
                                                    `UPDATE Productos SET stock = stock - ? WHERE id_producto = ?`,
                                                    [item.cantidad, item.id_producto],
                                                    (err) => {
                                                        if (err) {
                                                            console.error('Error al actualizar stock de producto:', err);
                                                            return res.status(500).json({ success: false, message: 'Error al actualizar stock de producto.' });
                                                        }
                                                    }
                                                );
                                            }
                                        );
                                    });

                                    db.query('DELETE FROM Carrito WHERE id_usuario = ?', [userId], (err) => {
                                        if (err) {
                                            console.error('Error al vaciar el carrito:', err);
                                            return res.status(500).json({ success: false, message: 'Error al vaciar el carrito.' });
                                        }

                                        const nuevosFondos = fondosActuales - totalCompra;
                                        db.query(
                                            'UPDATE Usuarios SET fondos = ? WHERE id_usuario = ?',
                                            [nuevosFondos, userId],
                                            (err) => {
                                                if (err) {
                                                    console.error('Error al actualizar fondos:', err);
                                                    return res.status(500).json({ success: false, message: 'Error al actualizar fondos.' });
                                                }

                                                console.log('Confirmando transacción...');
                                                db.commit((err) => {
                                                    if (err) {
                                                        console.error('Error al confirmar la transacción:', err);
                                                        return res.status(500).json({ success: false, message: 'Error al confirmar la transacción.' });
                                                    }
                                                    res.json({ success: true, message: 'Pago realizado correctamente.' });
                                                });
                                            }
                                        );
                                    });
                                }
                            );
                        }
                    );
                }
            );
        } catch (error) {
            console.error('Error al procesar el pago:', error);
            db.rollback(() => {
                res.status(500).json({ success: false, message: 'Error al procesar el pago.' });
            });
        }
    });
});


app.get('/productos', (req, res) => {
    const query = 'SELECT * FROM Productos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            return res.status(500).json({ message: 'Error al obtener productos.' });
        }
        res.json(results);
    });
});

app.get('/productos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM Productos WHERE id_producto = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener producto:', err);
            return res.status(500).json({ message: 'Error al obtener producto.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.json(results[0]);
    });
});

app.post('/actualizar-producto/:id', upload.single('imagen'), (req, res) => {
    const { id } = req.params;
    const { nombre, precio, stock } = req.body;
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    let query = 'UPDATE Productos SET nombre = ?, precio = ?, stock = ?';
    const params = [nombre, precio, stock];

    if (imagen) {
        query += ', imagen = ?';
        params.push(imagen);
    }

    query += ' WHERE id_producto = ?';
    params.push(id);

    db.query(query, params, (err, result) => {
        if (err) {
            console.error('Error al actualizar producto:', err);
            return res.status(500).json({ message: 'Error al actualizar el producto.' });
        }
        res.json({ success: true });
    });
});

app.delete('/eliminar-producto/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Productos WHERE id_producto = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar producto:', err);
            return res.status(500).json({ message: 'Error al eliminar el producto.' });
        }
        res.json({ success: true });
    });
});

app.delete('/eliminar-del-carrito/:idProducto', (req, res) => {
    const userId = req.cookies.userId; // Obtener el ID del usuario desde las cookies
    const { idProducto } = req.params; // Obtener el ID del producto de los parámetros de la URL

    if (!userId) {
        return res.status(401).json({ success: false, message: "No autenticado" });
    }

    const query = `
        DELETE FROM Carrito
        WHERE id_usuario = ? AND id_producto = ?;
    `;

    db.query(query, [userId, idProducto], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error al eliminar el producto del carrito" });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Producto no encontrado en el carrito" });
        }

        res.json({ success: true, message: "Producto eliminado del carrito" });
    });
});

app.put('/actualizar-carrito/:idProducto', (req, res) => {
    const userId = req.cookies.userId; // Obtener el ID del usuario desde las cookies
    const { idProducto } = req.params; // Obtener el ID del producto de los parámetros de la URL
    const { cantidad } = req.body; // Obtener la cantidad del cuerpo de la petición

    if (!userId) {
        return res.status(401).json({ success: false, message: "No autenticado" });
    }

    if (cantidad < 1) {
        return res.status(400).json({ success: false, message: "La cantidad debe ser al menos 1" });
    }

    const query = `
        UPDATE Carrito
        SET cantidad = ?
        WHERE id_usuario = ? AND id_producto = ?;
    `;

    db.query(query, [cantidad, userId, idProducto], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error al actualizar el carrito" });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Producto no encontrado en el carrito" });
        }

        res.json({ success: true, message: "Carrito actualizado correctamente" });
    });
});



app.get('/catalogo', (req, res) => {
    const query = `
        SELECT id_producto, nombre, precio, stock, imagen 
        FROM Productos
        WHERE stock > 0;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error al obtener el catálogo" });
        }
        res.json(results);
    });
});


app.post('/iniciar-sesion', (req, res) => {
    const { correo, contraseña } = req.body;

    if (!correo || !contraseña) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    console.log('Correo recibido:', correo);

    const query = 'SELECT * FROM Usuarios WHERE correo = ?';
    db.query(query, [correo], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }

        if (results.length === 0) {
            console.log('No se encontró el correo en la base de datos');
            return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }

        const usuario = results[0];
        console.log('Usuario encontrado:', usuario);

        if (contraseña !== usuario.contraseña) {
            console.log('Contraseña incorrecta');
            return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }

        console.log('Inicio de sesión exitoso para el usuario:', usuario.id_usuario);

        // Enviar el userId en la respuesta, sin usar cookies
        // Redirigir según el rol del usuario
        if (usuario.rol === 'administrador') {
            return res.json({ success: true, userId: usuario.id_usuario, redirect: '/admin.html' });
        } else {
            return res.json({ success: true, userId: usuario.id_usuario, redirect: '/index.html' });
        }
    });
});



app.get('/obtener-fondos/:userId', (req, res) => {
    const userId = req.params.userId;

    const query = 'SELECT fondos FROM Usuarios WHERE id_usuario = ?';
    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Error al obtener los fondos: ', err);
            return res.status(500).json({ error: 'Error al obtener los fondos' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ fondos: result[0].fondos });
    });
});

app.post('/agregar-fondos/:userId', (req, res) => {
    const userId = req.params.userId;
    const { cantidad } = req.body;

    if (isNaN(cantidad) || cantidad <= 0) {
        return res.status(400).json({ error: 'Cantidad inválida' });
    }

    // Actualizar los fondos en la base de datos
    const query = 'UPDATE Usuarios SET fondos = fondos + ? WHERE id_usuario = ?';
    db.query(query, [cantidad, userId], (err, result) => {
        if (err) {
            console.error('Error al agregar fondos:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        // Obtener los nuevos fondos
        const queryFondos = 'SELECT fondos FROM Usuarios WHERE id_usuario = ?';
        db.query(queryFondos, [userId], (err, result) => {
            if (err) {
                console.error('Error al obtener fondos:', err);
                return res.status(500).json({ error: 'Error al obtener fondos' });
            }
            const nuevosFondos = result[0].fondos;
            res.json({ success: true, nuevosFondos });
        });
    });
});

app.get('/verificar-sesion', (req, res) => {
    if (req.session.id_usuario) {
        res.json({ autenticado: true });
    } else {
        res.json({ autenticado: false });
    }
});

app.post('/agregar-al-carrito', (req, res) => {
    const { productoId, userId } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const queryVerificar = 'SELECT * FROM Carrito WHERE id_usuario = ? AND id_producto = ?';
    db.query(queryVerificar, [userId, productoId], (err, results) => {
        if (err) {
            console.error('Error al verificar el carrito:', err);
            return res.status(500).json({ message: 'Error al verificar el carrito' });
        }

        if (results.length > 0) {
            const nuevaCantidad = results[0].cantidad + 1;

            const queryPrecio = 'SELECT precio FROM Productos WHERE id_producto = ?';
            db.query(queryPrecio, [productoId], (err, precioResult) => {
                if (err) {
                    console.error('Error al obtener el precio del producto:', err);
                    return res.status(500).json({ message: 'Error al obtener el precio del producto' });
                }

                const precio = precioResult[0].precio;
                const subtotal = precio * nuevaCantidad;

                const queryActualizar = 'UPDATE Carrito SET cantidad = ?, subtotal = ? WHERE id_usuario = ? AND id_producto = ?';
                db.query(queryActualizar, [nuevaCantidad, subtotal, userId, productoId], (err) => {
                    if (err) {
                        console.error('Error al actualizar el carrito:', err);
                        return res.status(500).json({ message: 'Error al actualizar el carrito' });
                    }
                    res.json({ success: true });
                });
            });
        } else {
            const queryPrecio = 'SELECT precio FROM Productos WHERE id_producto = ?';
            db.query(queryPrecio, [productoId], (err, precioResult) => {
                if (err) {
                    console.error('Error al obtener el precio del producto:', err);
                    return res.status(500).json({ message: 'Error al obtener el precio del producto' });
                }

                const precio = precioResult[0].precio;
                const subtotal = precio * 1;

                const queryAgregar = 'INSERT INTO Carrito (id_usuario, id_producto, cantidad, subtotal) VALUES (?, ?, ?, ?)';
                db.query(queryAgregar, [userId, productoId, 1, subtotal], (err) => {
                    if (err) {
                        console.error('Error al agregar al carrito:', err);
                        return res.status(500).json({ message: 'Error al agregar al carrito' });
                    }
                    res.json({ success: true });
                });
            });
        }
    });
});

app.get('/productos-relacionados', (req, res) => {
    const userId = req.cookies.userId;

    if (!userId) {
        return res.status(401).json({ message: "No autenticado" });
    }

    const query = `
        SELECT p.id_producto, p.nombre, p.precio, p.imagen, c.cantidad
        FROM Carrito c
        JOIN Productos p ON c.id_producto = p.id_producto
        WHERE c.id_usuario = ?;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Error al obtener productos" });
        }
        res.json(results);
    });
});

app.get('/api/usuarios/:id', (req, res) => {
    const userId = req.params.id;

    // Consulta para obtener los detalles del usuario
    const query = `
        SELECT id_usuario, nombre_usuario, correo, rol, fondos
        FROM Usuarios
        WHERE id_usuario = ?
    `;

    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Error al ejecutar la consulta del usuario:', err);
            return res.status(500).json({ message: 'Error en el servidor' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Obtener las facturas y detalles de factura para este usuario
        const facturasQuery = `
            SELECT f.id_factura, f.fecha, f.total, d.id_producto, d.cantidad, d.subtotal, p.nombre AS producto_nombre
            FROM Facturas f
            JOIN Detalle_Factura d ON f.id_factura = d.id_factura
            JOIN Productos p ON d.id_producto = p.id_producto
            WHERE f.id_usuario = ?
        `;

        db.query(facturasQuery, [userId], (err, facturas) => {
            if (err) {
                console.error('Error al obtener las facturas:', err);
                return res.status(500).json({ message: 'Error al cargar las facturas' });
            }

            // Estructurar las facturas correctamente
            const facturasEstructuradas = [];

            facturas.forEach(factura => {
                // Verificar si la factura ya ha sido agregada al arreglo de facturas
                let facturaExistente = facturasEstructuradas.find(f => f.id_factura === factura.id_factura);

                if (!facturaExistente) {
                    // Si la factura no existe, agregarla y crear el arreglo de productos
                    facturaExistente = {
                        id_factura: factura.id_factura,
                        fecha: factura.fecha,
                        total: factura.total,
                        productos: []
                    };
                    facturasEstructuradas.push(facturaExistente);
                }

                // Agregar el producto a la factura correspondiente
                facturaExistente.productos.push({
                    nombre: factura.producto_nombre,
                    cantidad: factura.cantidad,
                    subtotal: factura.subtotal
                });
            });

            // Agregar las facturas al objeto de usuario
            result[0].facturas = facturasEstructuradas;
            res.json(result[0]);
        });
    });
});


app.get('/api/carrito', (req, res) => {
    const id_usuario = req.session.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const query = `
        SELECT p.id_producto, p.nombre, p.precio, c.cantidad, c.subtotal, p.imagen
        FROM Carrito c
        JOIN Productos p ON c.id_producto = p.id_producto
        WHERE c.id_usuario = ?`;

    db.query(query, [id_usuario], (err, results) => {
        if (err) {
            console.error('Error al obtener los productos del carrito:', err);
            return res.status(500).json({ message: 'Error al obtener productos del carrito' });
        }
        res.json(results);
    });
});

app.post('/api/pagar', (req, res) => {
    const id_usuario = req.session.id_usuario;

    if (!id_usuario) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const queryTotal = 'SELECT SUM(subtotal) AS total FROM Carrito WHERE id_usuario = ?';
    db.query(queryTotal, [id_usuario], (err, result) => {
        if (err) {
            console.error('Error al obtener el total del carrito:', err);
            return res.status(500).json({ message: 'Error al procesar el pago' });
        }

        const total = result[0].total;
        const queryFactura = 'INSERT INTO Facturas (id_usuario, total) VALUES (?, ?)';
        db.query(queryFactura, [id_usuario, total], (err) => {
            if (err) {
                console.error('Error al crear la factura:', err);
                return res.status(500).json({ message: 'Error al procesar el pago' });
            }

            const queryEliminarCarrito = 'DELETE FROM Carrito WHERE id_usuario = ?';
            db.query(queryEliminarCarrito, [id_usuario], (err) => {
                if (err) {
                    console.error('Error al limpiar el carrito:', err);
                    return res.status(500).json({ message: 'Error al limpiar el carrito' });
                }
                res.json({ success: true, total });
            });
        });
    });
});

app.get('/api/facturas/:idFactura', (req, res) => {
    const { idFactura } = req.params;
    const query = 'SELECT * FROM Facturas WHERE id_factura = ?';

    db.query(query, [idFactura], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al obtener la factura' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Factura no encontrada' });
        }

        const factura = results[0];
        
        // Obtenemos los productos asociados a la factura desde Detalle_Factura y Productos
        const productosQuery = `
            SELECT p.nombre, df.cantidad, df.subtotal
            FROM Detalle_Factura df
            JOIN Productos p ON df.id_producto = p.id_producto
            WHERE df.id_factura = ?`;

        db.query(productosQuery, [idFactura], (err, productosResults) => {
            if (err) {
                return res.status(500).json({ message: 'Error al obtener los productos de la factura' });
            }

            const productos = productosResults.map(producto => ({
                nombre: producto.nombre,
                cantidad: producto.cantidad,
                subtotal: producto.subtotal
            }));

            res.json({
                id_factura: factura.id_factura,
                negocio: 'Desesperanza', // El valor estático de "Desesperanza"
                fecha: factura.fecha,
                total: factura.total,
                productos: productos // Productos relacionados con la factura
            });
        });
    });
});

app.get('/api/historial', (req, res) => {
    const query = 'SELECT * FROM Facturas';
    
    db.query(query, (err, facturas) => {
        if (err) {
            return res.status(500).json({ message: 'Error al obtener el historial de facturas' });
        }

        const historialConProductos = [];

        async.each(facturas, (factura, callback) => {
            const productosQuery = `
                SELECT p.nombre, df.cantidad, df.subtotal
                FROM Detalle_Factura df
                JOIN Productos p ON df.id_producto = p.id_producto
                WHERE df.id_factura = ?`;

            db.query(productosQuery, [factura.id_factura], (err, productos) => {
                if (err) return callback(err);

                historialConProductos.push({
                    id_factura: factura.id_factura,
                    fecha: factura.fecha,
                    total: factura.total,
                    productos: productos
                });

                callback();
            });
        }, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error al obtener productos del historial' });
            }

            res.json(historialConProductos);
        });
    });
});

// Suponiendo que tienes Express configurado para tu servidor

app.post('/login', async (req, res) => {
    const { correo, password } = req.body;

    // Verifica las credenciales en la base de datos
    const usuario = await verificarCredenciales(correo, password); // Asumiendo una función que verifica la base de datos

    if (usuario) {
        // Si las credenciales son correctas, devuelve el ID del usuario
        res.json({ success: true, userId: usuario.id_usuario });
    } else {
        // Si las credenciales son incorrectas, devuelve un error
        res.json({ success: false, message: 'Credenciales incorrectas' });
    }
});

// Ruta para registrar el usuario
app.post('/agregarUsuario', (req, res) => {
    const { nombre, gmail, telefono, password } = req.body;

    // Validación básica
    if (!nombre || !gmail || !telefono || !password) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Insertar en la base de datos
    const query = 'INSERT INTO Usuarios (nombre_usuario, correo, contraseña, rol) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, gmail, password, 'cliente'], (err, result) => {
        if (err) {
            console.error('Error al agregar usuario: ', err);
            return res.status(500).json({ message: 'Error al registrar usuario' });
        }

        // Crear la cookie de sesión
        res.cookie('session', result.insertId, { httpOnly: true, secure: false }); // 'secure: true' solo si usas HTTPS
        res.status(201).json({ message: 'Usuario registrado exitosamente', redirect: '/perfil.html' });
    });
});


async function verificarCredenciales(correo, password) {
    // Lógica para verificar las credenciales en la base de datos
    // Ejemplo con pseudocódigo:
    const result = await db.query('SELECT * FROM Usuarios WHERE correo = ? AND contraseña = ?', [correo, password]);
    return result[0];
}


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
