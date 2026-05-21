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

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    sendJsonResponse(['error' => 'Datos inválidos'], 400);
}

session_start();

$conn = getConnection();
ensureUsuariosTable($conn);

$first = isset($data['firstName']) ? sanitize($data['firstName']) : null;
$last = isset($data['lastName']) ? sanitize($data['lastName']) : null;
$esp = isset($data['especialidad']) ? sanitize($data['especialidad']) : null;
$bio = isset($data['bio']) ? sanitize($data['bio']) : null;

$userId = $_SESSION['user_id'] ?? null;
$email = isset($data['email']) ? sanitize(strtolower($data['email'])) : null;

if (!$userId && !$email) {
    sendJsonResponse(['error' => 'Usuario no identificado'], 401);
}

// Build update query dynamically
$fields = [];
$types = '';
$values = [];
if ($first !== null) { $fields[] = 'first_name = ?'; $types .= 's'; $values[] = $first; }
if ($last !== null) { $fields[] = 'last_name = ?'; $types .= 's'; $values[] = $last; }
if ($esp !== null) { $fields[] = 'especialidad = ?'; $types .= 's'; $values[] = $esp; }
if ($bio !== null) { $fields[] = 'bio = ?'; $types .= 's'; $values[] = $bio; }

if (count($fields) === 0) {
    sendJsonResponse(['error' => 'Nada para actualizar'], 400);
}

$sql = 'UPDATE usuarios SET ' . implode(', ', $fields) . ' WHERE ' . ($userId ? 'id = ?' : 'email = ?');
$types .= $userId ? 'i' : 's';
$values[] = $userId ? $userId : $email;

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$values);
if (!$stmt->execute()) {
    sendJsonResponse(['error' => 'Error al actualizar perfil: ' . $stmt->error], 500);
}

// Return updated user
$stmt->close();
$stmt2 = $conn->prepare('SELECT id, first_name, last_name, email, cedula, phone, especialidad, bio, profile_pic, cv_url FROM usuarios WHERE ' . ($userId ? 'id = ?' : 'email = ?'));
$param = $userId ? $userId : $email;
if ($userId) $stmt2->bind_param('i', $param); else $stmt2->bind_param('s', $param);
$stmt2->execute();
$res = $stmt2->get_result();
if ($res->num_rows === 0) {
    sendJsonResponse(['error' => 'Usuario no encontrado'], 404);
}
$user = $res->fetch_assoc();
$stmt2->close();
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

sendJsonResponse(['success' => true, 'user' => $normalizedUser]);

?>
