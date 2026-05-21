<?php
// Script para promover un usuario a administrador.
// Uso: CLI: php set_admin.php correo@ejemplo.com
//       Web:  set_admin.php?email=correo@ejemplo.com

require_once __DIR__ . '/config/database.php';

$email = null;
if (PHP_SAPI === 'cli') {
    global $argv;
    $email = $argv[1] ?? null;
} else {
    $email = $_GET['email'] ?? null;
}

if (!$email) {
    echo "Email requerido. Uso: php set_admin.php correo@ejemplo.com\n";
    exit(1);
}

$email = trim(strtolower($email));
$conn = getConnection();
ensureUsuariosTable($conn);

// Asegurar columna role
$colCheck = $conn->query("SHOW COLUMNS FROM `usuarios` LIKE 'role'");
if ($colCheck === false || $colCheck->num_rows === 0) {
    $conn->query("ALTER TABLE `usuarios` ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'user'");
}

$stmt = $conn->prepare('SELECT id, email, role FROM usuarios WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    // Crear usuario mínimo
    $parts = explode('@', $email);
    $namePart = $parts[0];
    $namePieces = explode('.', $namePart);
    $first = ucfirst($namePieces[0] ?? 'Admin');
    $last = ucfirst($namePieces[1] ?? '');
    $randomPass = bin2hex(random_bytes(6));
    $hashed = password_hash($randomPass, PASSWORD_DEFAULT);

    $ins = $conn->prepare('INSERT INTO usuarios (first_name, last_name, email, password) VALUES (?, ?, ?, ?)');
    $ins->bind_param('ssss', $first, $last, $email, $hashed);
    if ($ins->execute()) {
        echo "Usuario creado: $email (contraseña temporal: $randomPass)\n";
        $ins->close();
    } else {
        echo "Error al crear usuario: " . $ins->error . "\n";
        exit(1);
    }
    // reconsultar
    $stmt = $conn->prepare('SELECT id, email, role FROM usuarios WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
}

$row = $res->fetch_assoc();
$stmt->close();

if ($row['role'] === 'admin') {
    echo "El usuario ya es administrador: $email\n";
    exit(0);
}

$upd = $conn->prepare('UPDATE usuarios SET role = ? WHERE email = ?');
$newRole = 'admin';
$upd->bind_param('ss', $newRole, $email);
if ($upd->execute()) {
    echo "Promovido a admin: $email\n";
} else {
    echo "Error al promover: " . $upd->error . "\n";
}
$upd->close();
$conn->close();

?>
