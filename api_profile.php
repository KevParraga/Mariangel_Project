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

$conn = getConnection();
ensureUsuariosTable($conn);

$userId = $_SESSION['user_id'] ?? null;
$email = isset($_SESSION['user_email']) ? sanitize(strtolower($_SESSION['user_email'])) : null;

if (!$userId && !$email) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Usuario no autenticado']);
    exit;
}

$sql = 'SELECT id, first_name, last_name, email, cedula, phone, especialidad, bio, profile_pic, cv_url FROM usuarios WHERE ' . ($userId ? 'id = ?' : 'email = ?');
$stmt = $conn->prepare($sql);
if ($userId) {
    $stmt->bind_param('i', $userId);
} else {
    $stmt->bind_param('s', $email);
}
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Usuario no encontrado']);
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();
$conn->close();

$normalizedUser = [
    'id' => $user['id'],
    'firstName' => $user['first_name'] ?? '',
    'lastName' => $user['last_name'] ?? '',
    'email' => $user['email'] ?? '',
    'cedula' => $user['cedula'] ?? '',
    'phone' => $user['phone'] ?? '',
    'especialidad' => $user['especialidad'] ?? '',
    'bio' => $user['bio'] ?? '',
    'profilePic' => $user['profile_pic'] ?? '',
    'cvUrl' => $user['cv_url'] ?? null
];

http_response_code(200);
echo json_encode(['success' => true, 'user' => $normalizedUser]);
exit;
