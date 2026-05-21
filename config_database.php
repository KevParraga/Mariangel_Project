<?php
// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_USER', 'root');        // Cambia por tu usuario de MySQL
define('DB_PASS', '');            // Cambia por tu contraseña de MySQL
define('DB_NAME', 'sistema de carga academica y bienestar');

// Configuración de correo
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'tu_correo@gmail.com');  // Cambia por tu correo
define('SMTP_PASS', 'tu_contraseña_app');     // Cambia por tu contraseña de aplicación

// URL base del sitio
define('BASE_URL', 'http://localhost/Ecosistema academico/');  // Ajusta según tu configuración

// Conexión a la base de datos
function getConnection() {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            throw new Exception("Error de conexión: " . $conn->connect_error);
        }
        
        $conn->set_charset("utf8mb4");
        return $conn;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error de conexión a la base de datos']);
        exit;
    }
}

function ensureUsuariosTable(mysqli $conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `usuarios` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `first_name` VARCHAR(100) NOT NULL,
        `last_name` VARCHAR(100) NOT NULL,
        `email` VARCHAR(255) NOT NULL UNIQUE,
        `role` VARCHAR(20) NOT NULL DEFAULT 'user',
        `password` VARCHAR(255) NOT NULL,
        `cedula` VARCHAR(50) DEFAULT NULL,
        `phone` VARCHAR(50) DEFAULT NULL,
        `profile_pic` TEXT DEFAULT NULL,
        `especialidad` VARCHAR(100) DEFAULT NULL,
        `bio` TEXT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $conn->query($sql);
}

function ensureBienestarTable(mysqli $conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `bienestar_diario` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `usuario_id` INT UNSIGNED DEFAULT NULL,
        `email` VARCHAR(255) NOT NULL,
        `fecha` DATE NOT NULL,
        `score_emo` TINYINT UNSIGNED NOT NULL,
        `score_fis` TINYINT UNSIGNED NOT NULL,
        `nivel_carga` TINYINT UNSIGNED NOT NULL,
        `tipo` VARCHAR(50) NOT NULL,
        `observaciones` TEXT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY `unique_email_fecha` (`email`, `fecha`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $conn->query($sql);
}

function ensureEncuestaTable(mysqli $conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `encuesta` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `usuario_id` INT UNSIGNED DEFAULT NULL,
        `email` VARCHAR(255) NOT NULL,
        `cedula` VARCHAR(50) DEFAULT NULL,
        `fecha` DATE NOT NULL,
        `respuestas` JSON NOT NULL,
        `tips_emocionales` TEXT DEFAULT NULL,
        `tips_fisicos` TEXT DEFAULT NULL,
        `score_emo` TINYINT UNSIGNED NOT NULL,
        `score_fis` TINYINT UNSIGNED NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY `unique_email_fecha` (`email`, `fecha`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $conn->query($sql);
}

function ensureMateriasTable(mysqli $conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `materias` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `usuario_id` INT UNSIGNED DEFAULT NULL,
        `email` VARCHAR(255) NOT NULL,
        `cedula` VARCHAR(50) DEFAULT NULL,
        `nombre` VARCHAR(255) NOT NULL,
        `seccion` VARCHAR(100) DEFAULT NULL,
        `tipo` VARCHAR(100) DEFAULT NULL,
        `dia` VARCHAR(50) DEFAULT NULL,
        `hora_inicio` VARCHAR(30) DEFAULT NULL,
        `hora_fin` VARCHAR(30) DEFAULT NULL,
        `duracion` DECIMAL(4,1) DEFAULT 0.0,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `unique_materia_usuario` (`email`, `nombre`, `seccion`, `tipo`, `dia`, `hora_inicio`, `hora_fin`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $conn->query($sql);
}

// Función para enviar respuestas JSON
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Función para sanitizar datos
function sanitize($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
?>