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

$resp = ['success' => false];

if (empty($_FILES['profile_pic'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['profile_pic'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Upload error']);
    exit;
}

$uploadsDir = __DIR__ . '/uploads';
if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);

$safeName = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($file['name']));
$target = $uploadsDir . '/' . time() . '-' . $safeName;
if (!move_uploaded_file($file['tmp_name'], $target)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not move uploaded file']);
    exit;
}

$urlPath = 'uploads/' . basename($target);

// Update DB if session user exists, otherwise accept optional email param
$conn = getConnection();
ensureUsuariosTable($conn);
$userId = $_SESSION['user_id'] ?? null;
$email = $_POST['email'] ?? null;
if ($userId) {
    $stmt = $conn->prepare('UPDATE usuarios SET profile_pic = ? WHERE id = ?');
    $stmt->bind_param('si', $urlPath, $userId);
    $stmt->execute();
    $stmt->close();
} elseif ($email) {
    $stmt = $conn->prepare('UPDATE usuarios SET profile_pic = ? WHERE email = ?');
    $stmt->bind_param('ss', $urlPath, $email);
    $stmt->execute();
    $stmt->close();
}

$conn->close();

echo json_encode(['success' => true, 'url' => $urlPath]);
exit;

?>
