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
        `horario_url` TEXT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $conn->query($sql);

    $check = $conn->query("SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'horario_url'");
    if ($check && ($row = $check->fetch_assoc()) && (int)$row['c'] === 0) {
        $conn->query("ALTER TABLE `usuarios` ADD COLUMN `horario_url` TEXT DEFAULT NULL");
    }
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
    $tableExists = $conn->query("SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materias'");
    $hasTable = $tableExists && ($r = $tableExists->fetch_assoc()) && (int)$r['c'] > 0;

    if ($hasTable) {
        $colCheck = $conn->query("SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'materias' AND COLUMN_NAME = 'usuario_id'");
        $hasUsuarioId = $colCheck && ($r2 = $colCheck->fetch_assoc()) && (int)$r2['c'] > 0;
        if (!$hasUsuarioId) {
            $conn->query("DROP TABLE `materias`");
        }
    }

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

function ensureFichaMedicaTable(mysqli $conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `ficha_medica` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `profesor_email` VARCHAR(255) NOT NULL UNIQUE,
        `tipo_sangre` VARCHAR(5) DEFAULT NULL,
        `alergias` TEXT DEFAULT NULL,
        `enfermedades_cronicas` TEXT DEFAULT NULL,
        `medicacion_actual` TEXT DEFAULT NULL,
        `peso` DECIMAL(5,2) DEFAULT NULL,
        `altura` DECIMAL(4,2) DEFAULT NULL,
        `presion_arterial` VARCHAR(20) DEFAULT NULL,
        `frecuencia_cardiaca` INT DEFAULT NULL,
        `contacto_nombre` VARCHAR(150) DEFAULT NULL,
        `contacto_telefono` VARCHAR(50) DEFAULT NULL,
        `contacto_relacion` VARCHAR(50) DEFAULT NULL,
        `observaciones` TEXT DEFAULT NULL,
        `ultima_consulta` DATE DEFAULT NULL,
        `updated_by_email` VARCHAR(255) DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $conn->query($sql);
}

function ensureFichaVisitasTable(mysqli $conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `ficha_visitas` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `profesor_email` VARCHAR(255) NOT NULL,
        `fecha` DATE NOT NULL,
        `motivo` VARCHAR(255) DEFAULT NULL,
        `notas` TEXT DEFAULT NULL,
        `created_by_email` VARCHAR(255) DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX `idx_profesor` (`profesor_email`, `fecha`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $conn->query($sql);
}

function ensureBitacoraActividadesTable(mysqli $conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `bitacora_actividades` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `usuario_email` VARCHAR(255) NOT NULL,
        `descripcion` TEXT NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX `idx_email_fecha` (`usuario_email`, `created_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $conn->query($sql);
}

function ensureInasistenciasTable(mysqli $conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `inasistencias` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `profesor_email` VARCHAR(255) NOT NULL,
        `fecha` DATE NOT NULL,
        `motivo` TEXT DEFAULT NULL,
        `registrada_por_email` VARCHAR(255) DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY `unique_inasistencia` (`profesor_email`, `fecha`),
        INDEX `idx_profesor` (`profesor_email`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $conn->query($sql);
}

function ensureFichaEmocionalTable(mysqli $conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `ficha_emocional` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `profesor_email` VARCHAR(255) NOT NULL UNIQUE,
        `estado_emocional` VARCHAR(100) DEFAULT NULL,
        `antecedentes` TEXT DEFAULT NULL,
        `tipo_terapia` VARCHAR(150) DEFAULT NULL,
        `medicacion_psiquiatrica` TEXT DEFAULT NULL,
        `factores_estres` TEXT DEFAULT NULL,
        `red_apoyo` TEXT DEFAULT NULL,
        `observaciones` TEXT DEFAULT NULL,
        `ultima_sesion` DATE DEFAULT NULL,
        `proxima_sesion` DATE DEFAULT NULL,
        `updated_by_email` VARCHAR(255) DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $conn->query($sql);
}

function ensureFichaSesionesTable(mysqli $conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `ficha_sesiones` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `profesor_email` VARCHAR(255) NOT NULL,
        `fecha` DATE NOT NULL,
        `motivo` VARCHAR(255) DEFAULT NULL,
        `notas` TEXT DEFAULT NULL,
        `created_by_email` VARCHAR(255) DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX `idx_profesor_sesion` (`profesor_email`, `fecha`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $conn->query($sql);
}

function ensureMensajesTable(mysqli $conn) {
    $sql = "CREATE TABLE IF NOT EXISTS `mensajes` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `remitente_email` VARCHAR(255) NOT NULL,
        `destinatario_email` VARCHAR(255) NOT NULL,
        `contenido` TEXT NOT NULL,
        `fecha` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `leido` TINYINT(1) NOT NULL DEFAULT 0,
        INDEX `idx_remitente` (`remitente_email`),
        INDEX `idx_destinatario` (`destinatario_email`),
        INDEX `idx_conv` (`remitente_email`, `destinatario_email`, `fecha`)
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