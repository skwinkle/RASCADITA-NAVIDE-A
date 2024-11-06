const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();
const port = 3000;


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads'); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

app.use(express.static("public"));
app.use('/uploads', express.static('uploads')); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "n0m3l0",
    database: "PanaderiaDB"
});


con.connect((err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err);
    } else {
        console.log("Conexión a la base de datos establecida.");
    }
});


app.get("/", (req, res) => {
    res.send("¡Bienvenido a la Panadería!");
});


app.post("/productos", upload.single('imagen'), (req, res) => {
    const { nombre, precio, stock } = req.body;
    console.log("Datos recibidos:", req.body); 

    // Validaciones
    if (!nombre || isNaN(precio) || isNaN(stock)) {
        return res.status(400).json({ error: "Datos inválidos" });
    }


    const precioNum = parseFloat(precio);
    const stockNum = parseInt(stock, 10);


    if (isNaN(precioNum) || isNaN(stockNum)) {
        return res.status(400).json({ error: "Precio o stock no son números válidos" });
    }

    const sql = "INSERT INTO Productos (nombre, precio, stock, imagen) VALUES (?, ?, ?, ?)";
    

    const imagen = req.file ? req.file.filename : null;

    con.query(sql, [nombre, precioNum, stockNum, imagen], (err) => {
        if (err) {
            console.error("Error en la consulta:", err.message);
            return res.status(500).json({ error: "Error al agregar producto: " + err.message });
        }
        res.json({ message: "Producto agregado", imagen: `/uploads/${imagen}` });
    });
});

// Endpoint para cargar productosapp.get("/productos", (req, res) => {
    const sql = "SELECT * FROM Productos";
    con.query(sql, (err, results) => {
        if (err) {
            console.error("Error al cargar productos:", err.message);
            return res.status(500).json({ error: "Error al cargar productos" });
        }

        results = results.map(producto => ({
            ...producto,
            imagen: producto.imagen ? `/uploads/${producto.imagen}` : null
        }));
        res.json(results);
    });
});


app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
