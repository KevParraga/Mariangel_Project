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

// Validar datos requeridos
$required = ['firstName', 'lastName', 'email', 'password', 'cedula', 'phone'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        sendJsonResponse(['error' => "El campo {$field} es requerido"], 400);
    }
}

$firstName = sanitize($data['firstName']);
$lastName = sanitize($data['lastName']);
$email = sanitize(strtolower($data['email']));
$password = $data['password'];
$cedula = sanitize($data['cedula']);
$phone = sanitize($data['phone']);
$profilePic = $data['profilePic'] ?? '';
$especialidad = sanitize($data['especialidad'] ?? '');
$bio = sanitize($data['bio'] ?? '');

// Validar formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJsonResponse(['error' => 'Correo electrónico inválido'], 400);
}

// Validar contraseña
if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/[0-9]/', $password) || !preg_match('/[@$!%*?&]/', $password)) {
    sendJsonResponse(['error' => 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo (@$!%*?&)'], 400);
}

$conn = getConnection();
ensureUsuariosTable($conn);

// Verificar si el email ya existe
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    sendJsonResponse(['error' => 'El correo electrónico ya está registrado'], 400);
}
$stmt->close();

// Hashear contraseña
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insertar usuario
$stmt = $conn->prepare("INSERT INTO usuarios (first_name, last_name, email, password, cedula, phone, profile_pic, especialidad, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssssssss", $firstName, $lastName, $email, $hashedPassword, $cedula, $phone, $profilePic, $especialidad, $bio);

if ($stmt->execute()) {
    sendJsonResponse([
        'success' => true,
        'message' => 'Registro completado exitosamente',
        'user_id' => $stmt->insert_id
    ], 201);
} else {
    sendJsonResponse(['error' => 'Error al registrar el usuario: ' . $conn->error], 500);
}

$stmt->close();
$conn->close();
?>