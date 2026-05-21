<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config/database.php';
session_start();

$miRole = strtolower($_SESSION['user_role'] ?? '');
if ($miRole !== 'admin') sendJsonResponse(['error' => 'No autorizado'], 403);

$conn = getConnection();
ensureUsuariosTable($conn);

$stmt = $conn->prepare("SELECT LOWER(email) AS email, first_name, last_name, cedula, phone, especialidad, profile_pic, horario_url, role FROM usuarios WHERE LOWER(role) IN ('user','teacher') ORDER BY first_name, last_name");
$stmt->execute();
$res = $stmt->get_result();
$rows = [];
while ($r = $res->fetch_assoc()) {
    $rows[] = [
        'email' => $r['email'],
        'firstName' => $r['first_name'] ?? '',
        'lastName' => $r['last_name'] ?? '',
        'cedula' => $r['cedula'] ?? '',
        'phone' => $r['phone'] ?? '',
        'especialidad' => $r['especialidad'] ?? '',
        'profilePic' => $r['profile_pic'] ?? '',
        'horarioUrl' => $r['horario_url'] ?? '',
        'role' => strtolower($r['role'] ?? '')
    ];
}
$stmt->close();
sendJsonResponse(['success' => true, 'profesores' => $rows]);
