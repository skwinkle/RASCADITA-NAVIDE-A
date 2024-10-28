const express = require("express");
const mysql = require("mysql2");
const bodyParser = require('body-parser');
const path = require('path'); 


const app = express();


const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '$$I0h17eSi$$', 
    database: 'PanaderiaDB' 
});


con.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos: ', err);
        return;
    }
    console.log('Conexión a la base de datos establecida.');
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static('public'));


app.get('/iniciosesion', (req, res) => {
    res.sendFile(path.join(__dirname, 'iniciosesion.html'));
});


app.post('/agregarUsuario', (req, res) => {
    const { nombre, gmail, telefono, password } = req.body;

    console.log(`Intentando agregar: ${nombre}, ${gmail}, ${telefono}, ${password}`);

    con.query('INSERT INTO Clientes (nombre, correo, telefono, contraseña) VALUES (?, ?, ?, ?)', [nombre, gmail, telefono, password], (err) => {
        if (err) {
            console.log("Error al agregar el cliente: ", err);
            return res.status(500).send("Error al agregar el cliente");
        }
        return res.json({ message: `Cliente agregado: ${nombre}` });
    });
});


app.post('/iniciarUsuario', (req, res) => {
    const { gmail, password } = req.body;

    console.log(`Intentando iniciar sesión con: ${gmail}, ${password}`);

    con.query('SELECT * FROM Clientes WHERE correo = ? AND contraseña = ?', [gmail, password], (err, results) => {
        if (err) {
            console.log("Error al iniciar sesión: ", err);
            return res.status(500).send("Error en la consulta a la base de datos");
        }

        if (results.length > 0) {
            return res.send(`
                <script>
                    alert('Bienvenido');
                    window.location.href = 'productos.html';
                </script>
            `);
        } else {
            return res.send("<h1>Correo o contraseña incorrectos</h1>");
        }
    });
});


app.post('/editarUsuario', (req, res) => {
    const { ide, nombre, gmail, telefono } = req.body;

    con.query('UPDATE Clientes SET nombre = ?, correo = ?, telefono = ? WHERE id_cliente = ?', [nombre, gmail, telefono, ide], (err, result) => {
        if (err) {
            console.error('Error al editar el usuario:', err);
            return res.status(500).send('Error al editar el usuario');
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).send('Usuario no encontrado');
        }

        res.status(200).send('Usuario actualizado con éxito');
    });
});


app.post('/obtenerUsuario', (req, res) => {
    const { ide } = req.body;

    con.query('SELECT * FROM Clientes WHERE id_cliente = ?', [ide], (err, rows) => {
        if (err) {
            console.error('Error al obtener el usuario:', err);
            return res.status(500).send('Error en el servidor');
        }

        const usuario = rows[0]; 

        if (usuario) {
            res.status(200).json(usuario); 
        } else {
            res.status(404).send('Usuario no encontrado'); 
        }
    });
    
});


app.post('/borrarUsuario', (req, res) => {
    const { ideb } = req.body;

    con.query('DELETE FROM Clientes WHERE id_cliente = ?', [ideb], (err, result) => {
        if (err) {
            console.error('Error al borrar el usuario:', err);
            return res.status(500).send('Error al borrar el usuario');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Usuario no encontrado');
        }

        res.status(200).send('Usuario borrado con éxito');
    });
});

app.post('/editProductos', (req, res) => {
    const { id_producto, cantidad } = req.body;


    if (isNaN(cantidad) || cantidad < 0) {
        return res.status(400).send('La cantidad debe ser un número válido y mayor o igual a 0.');
    }


    con.query('SELECT * FROM Productos WHERE id_producto = ?', [id_producto], (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).send('Error en la consulta');
        }
        
        if (result.length === 0) {
            return res.status(404).send('Producto no encontrado');
        }


        con.query('UPDATE Productos SET stock = ? WHERE id_producto = ?', [cantidad, id_producto], (err, result) => {
            if (err) {
                console.error('Error al actualizar la cantidad del producto:', err);
                return res.status(500).send('Error al actualizar la cantidad del producto');
            }

            if (result.affectedRows === 0) {
                return res.status(404).send('Producto no encontrado');
            }

            res.status(200).send('Cantidad del producto actualizada con éxito');
        });
    });
});

app.get('/getCantidad/:id_producto', (req, res) => {
    const { id_producto } = req.params;

    con.query('SELECT stock FROM Productos WHERE id_producto = ?', [id_producto], (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).send('Error en la consulta');
        }

        if (result.length === 0) {
            return res.status(404).send('Producto no encontrado');
        }


        res.status(200).json({ cantidad: result[0].stock });
    });
});

app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});