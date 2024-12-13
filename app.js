const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');
const app = express();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '$$I0h17eSi$$',
    database: 'PanaderiaDB'
});

connection.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos: ' + err.stack);
        return;
    }
    console.log('Conexión a la base de datos establecida.');
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.post('/add-product', upload.single('imagen'), (req, res) => {
    const { nombre, descripcion, precio, stock } = req.body;
    const imagen = req.file ? req.file.filename : '';
    if (!nombre || !precio || !stock || !imagen) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }
    const query = 'INSERT INTO Productos (nombre, precio, stock, imagen) VALUES (?, ?, ?, ?)';
    connection.query(query, [nombre, precio, stock, imagen], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Hubo un error al crear el producto.' });
        }
        res.status(201).json({ message: 'Producto creado con éxito.' });
    });
});

app.get('/productos', (req, res) => {
    const query = 'SELECT * FROM Productos';
    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Hubo un error al obtener los productos.' });
        }
        res.status(200).json(results);
    });
});

app.get('/productos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM Productos WHERE id_producto = ?';
    connection.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Hubo un error al obtener el producto.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.status(200).json(results[0]);
    });
});

app.post('/actualizar-producto/:id', upload.single('imagen'), (req, res) => {
    const { id } = req.params;
    const { nombre, precio, stock } = req.body;
    const imagen = req.file ? req.file.filename : '';
    const query = 'UPDATE Productos SET nombre = ?, precio = ?, stock = ?, imagen = ? WHERE id_producto = ?';
    connection.query(query, [nombre, precio, stock, imagen, id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Hubo un error al actualizar el producto.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.status(200).json({ message: 'Producto actualizado con éxito.' });
    });
});

app.delete('/eliminar-producto/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Productos WHERE id_producto = ?';
    connection.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Hubo un error al eliminar el producto.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.status(200).json({ success: true });
    });
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
