DROP DATABASE IF EXISTS PanaderiaDB;
CREATE DATABASE IF NOT EXISTS PanaderiaDB;
USE PanaderiaDB;

CREATE TABLE IF NOT EXISTS Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'administrador') NOT NULL DEFAULT 'cliente',
    fondos DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (fondos BETWEEN 0 AND 999999999999)
);

CREATE TABLE IF NOT EXISTS Productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL CHECK (stock >= 0),
    imagen VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Facturas (
    id_factura INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Detalle_Factura (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_factura INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    FOREIGN KEY (id_factura) REFERENCES Facturas(id_factura) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Carrito (
    id_carrito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto) ON DELETE CASCADE
);

DELIMITER //
CREATE TRIGGER ActualizarStockDespuesDeCompra
AFTER INSERT ON Detalle_Factura
FOR EACH ROW
BEGIN
    UPDATE Productos
    SET stock = stock - NEW.cantidad
    WHERE id_producto = NEW.id_producto;
END;
//
DELIMITER //

DELIMITER //
CREATE TRIGGER VaciarCarritoDespuesDeCompra
AFTER INSERT ON Facturas
FOR EACH ROW
BEGIN
    DELETE FROM Carrito WHERE id_usuario = NEW.id_usuario;
END;
//
DELIMITER //

DELIMITER //
CREATE TRIGGER ValidarFondos
BEFORE UPDATE ON Usuarios
FOR EACH ROW
BEGIN
    IF NEW.fondos < 0 OR NEW.fondos > 999999999999 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Los fondos deben estar entre 0 y 999,999,999,999';
    END IF;
END;
//
DELIMITER ;
