<?php
// Script para actualizar contraseñas de usuarios existentes en la tabla `usuarios`.
// Ejecuta este archivo desde el navegador o desde CLI una vez, y luego elimínalo si no lo necesitas más.

require_once __DIR__ . '/config/database.php';

$updates = [
    'mariangelmicha@gmail.com' => '27598744Micha*',
    'bcabril21@gmail.com' => '30429541Caracas*',
];

$conn = getConnection();
ensureUsuariosTable($conn);

header('Content-Type: application/json');

$results = [];
foreach ($updates as $email => $newPassword) {
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare('UPDATE usuarios SET password = ? WHERE email = ?');
    if (!$stmt) {
        $results[$email] = ['success' => false, 'error' => 'Error en la preparación de la consulta: ' . $conn->error];
        continue;
    }

    $stmt->bind_param('ss', $hashedPassword, $email);
    if ($stmt->execute()) {
        $results[$email] = ['success' => true, 'affected_rows' => $stmt->affected_rows];
    } else {
        $results[$email] = ['success' => false, 'error' => $stmt->error];
    }
    $stmt->close();
}

$conn->close();

echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT);
