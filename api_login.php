<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Método no permitido'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['email']) || empty($data['password'])) {
    sendJsonResponse(['error' => 'Email y contraseña son requeridos'], 400);
}

$email = sanitize(strtolower($data['email']));
$password = $data['password'];

$conn = getConnection();
ensureUsuariosTable($conn);

$stmt = $conn->prepare("SELECT id, first_name, last_name, email, password, cedula, phone, especialidad, bio, profile_pic, cv_url, horario_url, role FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    sendJsonResponse(['error' => 'Credenciales incorrectas'], 401);
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password'])) {
    sendJsonResponse(['error' => 'Credenciales incorrectas'], 401);
}

// Eliminar contraseña antes de enviar
unset($user['password']);

// Normalizar nombres de campo al formato camelCase esperado por el frontend
$normalizedUser = [
    'id' => $user['id'],
    'firstName' => $user['first_name'] ?? $user['firstName'] ?? '',
    'lastName' => $user['last_name'] ?? $user['lastName'] ?? '',
    'email' => $user['email'] ?? '',
    'cedula' => $user['cedula'] ?? '',
    'phone' => $user['phone'] ?? '',
    'especialidad' => $user['especialidad'] ?? '',
    'bio' => $user['bio'] ?? '',
    'profilePic' => $user['profile_pic'] ?? $user['profilePic'] ?? '',
    'cvUrl' => $user['cv_url'] ?? null,
    'cvName' => $user['cv_url'] ? basename($user['cv_url']) : null,
    'horarioUrl' => $user['horario_url'] ?? null,
    'role' => $user['role'] ?? 'user'
];

// Iniciar sesión
session_start();
$_SESSION['user_id'] = $normalizedUser['id'];
$_SESSION['user_email'] = $normalizedUser['email'];
$_SESSION['user_cedula'] = $user['cedula'] ?? '';
$_SESSION['user_role'] = $user['role'] ?? 'teacher';
$_SESSION['user_first_name'] = $normalizedUser['firstName'];
$_SESSION['user_last_name'] = $normalizedUser['lastName'];

sendJsonResponse([
    'success' => true,
    'message' => 'Inicio de sesión exitoso',
    'user' => $normalizedUser
]);

$stmt->close();
$conn->close();
?>