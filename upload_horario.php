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

session_start();

if (empty($_FILES['horario'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['horario'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Upload error']);
    exit;
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!in_array($mime, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato no permitido. Solo PDF o imagen (PNG, JPG, JPEG, WebP, GIF).']);
    exit;
}

$uploadsDir = __DIR__ . '/uploads';
if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);

$safeName = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($file['name']));
$target = $uploadsDir . '/horario-' . time() . '-' . $safeName;
if (!move_uploaded_file($file['tmp_name'], $target)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not move uploaded file']);
    exit;
}

$urlPath = 'uploads/' . basename($target);

$conn = getConnection();
ensureUsuariosTable($conn);

$miEmail = !empty($_SESSION['user_email']) ? strtolower(trim($_SESSION['user_email'])) : '';
$miRole = strtolower($_SESSION['user_role'] ?? '');
$targetEmail = !empty($_POST['email']) ? strtolower(trim($_POST['email'])) : $miEmail;

if (!$miEmail) {
    http_response_code(401);
    echo json_encode(['error' => 'No autenticado']);
    exit;
}

if ($targetEmail !== $miEmail && $miRole !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'No autorizado para subir horario de otro usuario']);
    exit;
}

$stmt = $conn->prepare('UPDATE usuarios SET horario_url = ? WHERE LOWER(email) = ?');
$stmt->bind_param('ss', $urlPath, $targetEmail);
$stmt->execute();
$stmt->close();

$conn->close();

echo json_encode(['success' => true, 'url' => $urlPath, 'mime' => $mime]);
exit;
?>
