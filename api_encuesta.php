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

$conn = getConnection();
ensureUsuariosTable($conn);
ensureEncuestaTable($conn);
// ensureEncuestaTable crea el esquema estándar si falta

$userEmail = !empty($_SESSION['user_email']) ? sanitize(strtolower($_SESSION['user_email'])) : null;
$userCedula = $_SESSION['user_cedula'] ?? null;
$userRole = $_SESSION['user_role'] ?? 'user';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $requestedEmail = !empty($_GET['email']) ? sanitize(strtolower($_GET['email'])) : null;
    if ($requestedEmail && $userRole !== 'admin' && $requestedEmail !== $userEmail) {
        sendJsonResponse(['error' => 'No autorizado para ver registros de otros usuarios'], 403);
    }

    $targetEmail = $requestedEmail ?: $userEmail;
    if (!$targetEmail) {
        sendJsonResponse(['error' => 'Email requerido'], 400);
    }

    if ($userRole === 'admin' && !$requestedEmail) {
        $stmt = $conn->prepare('SELECT * FROM encuesta ORDER BY fecha DESC, created_at DESC');
        $stmt->execute();
        $result = $stmt->get_result();
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $row['respuestas'] = json_decode($row['respuestas'], true);
            $rows[] = $row;
        }
        $stmt->close();
        sendJsonResponse(['success' => true, 'records' => $rows]);
    }

    $stmt = $conn->prepare('SELECT * FROM encuesta WHERE email = ? ORDER BY fecha DESC, created_at DESC');
    $stmt->bind_param('s', $targetEmail);
    $stmt->execute();
    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $row['respuestas'] = json_decode($row['respuestas'], true);
        $rows[] = $row;
    }
    $stmt->close();
    sendJsonResponse(['success' => true, 'records' => $rows]);
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !is_array($data)) {
    sendJsonResponse(['error' => 'Datos inválidos'], 400);
}

$email = !empty($data['email']) ? sanitize(strtolower($data['email'])) : $userEmail;
$cedula = !empty($data['cedula']) ? sanitize($data['cedula']) : $userCedula;
$respuestas = $data['respuestas'] ?? null;
$tipsEmocionales = $data['tipsEmocionales'] ?? '';
$tipsFisicos = $data['tipsFisicos'] ?? '';
$scoreEmo = isset($data['scoreEmo']) ? intval($data['scoreEmo']) : null;
$scoreFis = isset($data['scoreFis']) ? intval($data['scoreFis']) : null;

if (!$email) {
    sendJsonResponse(['error' => 'Email requerido'], 400);
}

if (!is_array($respuestas) || count($respuestas) === 0) {
    sendJsonResponse(['error' => 'Respuestas de la encuesta son requeridas'], 400);
}

if ($userRole !== 'admin' && $userEmail && $email !== $userEmail) {
    sendJsonResponse(['error' => 'No autorizado para guardar encuestas de otro usuario'], 403);
}

if ($scoreEmo === null || $scoreFis === null) {
    sendJsonResponse(['error' => 'scoreEmo y scoreFis son requeridos'], 400);
}

$fecha = date('Y-m-d');
$stmt = $conn->prepare('SELECT id FROM encuesta WHERE email = ? AND fecha = ?');
$stmt->bind_param('ss', $email, $fecha);
$stmt->execute();
$existing = $stmt->get_result();
if ($existing->num_rows > 0) {
    $stmt->close();
    sendJsonResponse(['success' => false, 'error' => 'Ya existe una encuesta para este usuario en el día de hoy'], 409);
}
$stmt->close();

$usuarioId = null;
$stmtUser = $conn->prepare('SELECT id, cedula FROM usuarios WHERE email = ?');
$stmtUser->bind_param('s', $email);
$stmtUser->execute();
$resultUser = $stmtUser->get_result();
if ($resultUser->num_rows > 0) {
    $userRow = $resultUser->fetch_assoc();
    $usuarioId = (int)$userRow['id'];
    if (empty($cedula) && !empty($userRow['cedula'])) {
        $cedula = $userRow['cedula'];
    }
}
$stmtUser->close();

$respuestasJson = json_encode($respuestas, JSON_UNESCAPED_UNICODE);
// Insertar y obtener el id autonumérico (`enc_id`) creado por la alteración anterior
$stmt = $conn->prepare('INSERT INTO encuesta (usuario_id, email, cedula, fecha, respuestas, tips_emocionales, tips_fisicos, score_emo, score_fis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->bind_param('issssssii', $usuarioId, $email, $cedula, $fecha, $respuestasJson, $tipsEmocionales, $tipsFisicos, $scoreEmo, $scoreFis);
if (!$stmt->execute()) {
    sendJsonResponse(['error' => 'Error al guardar la encuesta: ' . $stmt->error], 500);
}

$stmt->close();
$id = $conn->insert_id;

sendJsonResponse(['success' => true, 'message' => 'Encuesta guardada correctamente', 'id' => $id]);
