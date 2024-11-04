const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();
const port = 3000;

// Configuración de multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads'); // Carpeta donde se guardarán los archivos subidos
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre del archivo
    }
});

const upload = multer({ storage: storage });

// Middleware para servir archivos estáticos
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conexión a la base de datos
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "$$I0h17eSi$$", // Reemplaza con tu contraseña
    database: "PanaderiaDB"
});

// Verificación de conexión a la base de datos
con.connect((err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err);
    } else {
        console.log("Conexión a la base de datos establecida.");
    }
});

// Ruta para la raíz
app.get("/", (req, res) => {
    res.send("¡Bienvenido a la Panadería!");
});

// Endpoint para agregar productos
app.post("/productos", upload.single('imagen'), (req, res) => {
    const { nombre, precio, stock } = req.body;
    console.log("Datos recibidos:", req.body); // Muestra los datos recibidos

    // Validaciones
    if (!nombre || isNaN(precio) || isNaN(stock)) {
        return res.status(400).json({ error: "Datos inválidos" });
    }

    // Convierte a número
    const precioNum = parseFloat(precio);
    const stockNum = parseInt(stock, 10);

    // Asegúrate de que las conversiones no sean NaN
    if (isNaN(precioNum) || isNaN(stockNum)) {
        return res.status(400).json({ error: "Precio o stock no son números válidos" });
    }

    const sql = "INSERT INTO Productos (nombre, precio, stock, imagen) VALUES (?, ?, ?, ?)";
    
    // Guarda la ruta de la imagen en la base de datos
    const imagen = req.file ? req.file.filename : null;

    con.query(sql, [nombre, precioNum, stockNum, imagen], (err) => {
        if (err) {
            console.error("Error en la consulta:", err.message);
            return res.status(500).json({ error: "Error al agregar producto: " + err.message });
        }
        res.json({ message: "Producto agregado" });
    });
});

// Endpoint para cargar productos
app.get("/productos", (req, res) => {
    const sql = "SELECT * FROM Productos";
    con.query(sql, (err, results) => {
        if (err) {
            console.error("Error al cargar productos:", err.message);
            return res.status(500).json({ error: "Error al cargar productos" });
        }
        res.json(results);
    });
});

// Puerto de escucha
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
