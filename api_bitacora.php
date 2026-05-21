<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config/database.php';
session_start();

$miEmail = !empty($_SESSION['user_email']) ? strtolower(trim($_SESSION['user_email'])) : '';
$miRole = strtolower($_SESSION['user_role'] ?? '');
if (!$miEmail) sendJsonResponse(['error' => 'No autenticado'], 401);

$conn = getConnection();
ensureBitacoraActividadesTable($conn);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) sendJsonResponse(['error' => 'Datos inválidos'], 400);

    // Soporte batch: si viene "registros" como array, se insertan todos
    if (isset($input['registros']) && is_array($input['registros'])) {
        $insertados = 0;
        foreach ($input['registros'] as $r) {
            $desc = isset($r['descripcion']) ? trim($r['descripcion']) : '';
            if (!$desc) continue;
            if (mb_strlen($desc) > 1000) $desc = mb_substr($desc, 0, 1000);
            $fechaCustom = isset($r['fecha']) ? trim($r['fecha']) : '';
            if ($fechaCustom && preg_match('/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/', $fechaCustom)) {
                $stmt = $conn->prepare('INSERT INTO bitacora_actividades (usuario_email, descripcion, created_at) VALUES (?, ?, ?)');
                $stmt->bind_param('sss', $miEmail, $desc, $fechaCustom);
            } else {
                $stmt = $conn->prepare('INSERT INTO bitacora_actividades (usuario_email, descripcion) VALUES (?, ?)');
                $stmt->bind_param('ss', $miEmail, $desc);
            }
            if ($stmt->execute()) $insertados++;
            $stmt->close();
        }
        sendJsonResponse(['success' => true, 'insertados' => $insertados]);
    }

    $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : '';
    if (!$descripcion) sendJsonResponse(['error' => 'Descripción requerida'], 400);
    if (mb_strlen($descripcion) > 1000) $descripcion = mb_substr($descripcion, 0, 1000);

    $stmt = $conn->prepare('INSERT INTO bitacora_actividades (usuario_email, descripcion) VALUES (?, ?)');
    $stmt->bind_param('ss', $miEmail, $descripcion);
    if (!$stmt->execute()) sendJsonResponse(['error' => 'Error al guardar: ' . $stmt->error], 500);
    $stmt->close();
    sendJsonResponse(['success' => true]);
}

// GET: admin puede ver todos o filtrar por email; profesor solo ve los suyos
$emailFiltro = !empty($_GET['email']) ? strtolower(trim($_GET['email'])) : '';

if ($miRole === 'admin') {
    if ($emailFiltro) {
        $stmt = $conn->prepare('SELECT id, usuario_email, descripcion, created_at FROM bitacora_actividades WHERE LOWER(usuario_email) = ? ORDER BY created_at DESC LIMIT 500');
        $stmt->bind_param('s', $emailFiltro);
    } else {
        $stmt = $conn->prepare('SELECT id, usuario_email, descripcion, created_at FROM bitacora_actividades ORDER BY created_at DESC LIMIT 500');
    }
} else {
    $stmt = $conn->prepare('SELECT id, usuario_email, descripcion, created_at FROM bitacora_actividades WHERE LOWER(usuario_email) = ? ORDER BY created_at DESC LIMIT 500');
    $stmt->bind_param('s', $miEmail);
}

$stmt->execute();
$res = $stmt->get_result();
$rows = [];
while ($r = $res->fetch_assoc()) {
    $rows[] = [
        'id' => (int)$r['id'],
        'usuarioEmail' => $r['usuario_email'],
        'descripcion' => $r['descripcion'],
        'createdAt' => $r['created_at']
    ];
}
$stmt->close();
sendJsonResponse(['success' => true, 'registros' => $rows]);
