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
ensureBienestarTable($conn);
function obtenerRespuestaRecords(mysqli $conn, string $email) {
    $stmt = $conn->prepare('SELECT id, usuario_id, email, fecha, score_emo, score_fis, nivel_carga, tipo, observaciones, created_at FROM bienestar_diario WHERE email = ? ORDER BY fecha DESC, created_at DESC LIMIT 14');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $records = [];
    while ($row = $result->fetch_assoc()) {
        $records[] = [
            'id' => (int)$row['id'],
            'usuario_id' => $row['usuario_id'] !== null ? (int)$row['usuario_id'] : null,
            'email' => $row['email'],
            'fecha' => $row['fecha'],
            'score_emo' => (int)$row['score_emo'],
            'score_fis' => (int)$row['score_fis'],
            'nivel_carga' => (int)$row['nivel_carga'],
            'tipo' => $row['tipo'],
            'observaciones' => $row['observaciones'],
            'created_at' => $row['created_at']
        ];
    }
    $stmt->close();
    return $records;
}

function validarFecha($fecha) {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        return false;
    }
    [$year, $month, $day] = explode('-', $fecha);
    return checkdate((int)$month, (int)$day, (int)$year);
}

$userEmail = '';
if (!empty($_SESSION['user_email'])) {
    $userEmail = sanitize(strtolower($_SESSION['user_email']));
}
$userRole = $_SESSION['user_role'] ?? 'user';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $requestedEmail = null;
    if (!empty($_GET['email'])) {
        $requestedEmail = sanitize(strtolower($_GET['email']));
    }

    $sessionRole = $_SESSION['user_role'] ?? 'teacher';

    // Admin puede ver todos los registros si no se especifica email
    if ($sessionRole === 'admin' && !$requestedEmail) {
        $stmtAll = $conn->prepare('SELECT id, usuario_id, email, fecha, score_emo, score_fis, nivel_carga, tipo, observaciones, created_at FROM bienestar_diario ORDER BY fecha DESC, created_at DESC LIMIT 1000');
        $stmtAll->execute();
        $resAll = $stmtAll->get_result();
        $all = [];
        while ($r = $resAll->fetch_assoc()) {
            $all[] = [
                'id' => (int)$r['id'],
                'usuario_id' => $r['usuario_id'] !== null ? (int)$r['usuario_id'] : null,
                'email' => $r['email'],
                'fecha' => $r['fecha'],
                'score_emo' => (int)$r['score_emo'],
                'score_fis' => (int)$r['score_fis'],
                'nivel_carga' => (int)$r['nivel_carga'],
                'tipo' => $r['tipo'],
                'observaciones' => $r['observaciones'],
                'created_at' => $r['created_at']
            ];
        }
        $stmtAll->close();
        sendJsonResponse(['success' => true, 'records' => $all, 'todayRecord' => null]);
    }

    // Si no es admin, o se solicitó un email específico, validar permisos
    if ($requestedEmail && ($sessionRole !== 'admin') && $requestedEmail !== $userEmail) {
        sendJsonResponse(['error' => 'No autorizado para ver registros de otros usuarios'], 403);
    }

    $targetEmail = $requestedEmail ? $requestedEmail : $userEmail;
    if (!$targetEmail) {
        sendJsonResponse(['error' => 'Email requerido'], 400);
    }

    $requestedDate = null;
    if (!empty($_GET['date'])) {
        $requestedDate = sanitize($_GET['date']);
        if (!validarFecha($requestedDate)) {
            $requestedDate = null;
        }
    }
    $today = $requestedDate ?: date('Y-m-d');

    $records = obtenerRespuestaRecords($conn, $targetEmail);
    $todayRecord = null;
    foreach ($records as $record) {
        if ($record['fecha'] === $today) {
            $todayRecord = $record;
            break;
        }
    }

    sendJsonResponse([
        'success' => true,
        'records' => $records,
        'todayRecord' => $todayRecord
    ]);
}
// POST: crear un registro de bienestar
$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !is_array($data)) {
    sendJsonResponse(['error' => 'Datos inválidos'], 400);
}

if (!empty($data['email'])) {
    $userEmail = sanitize(strtolower($data['email']));
}

if (!$userEmail) {
    sendJsonResponse(['error' => 'Email requerido'], 400);
}

// Campos esperados
$scoreEmo = isset($data['scoreEmo']) ? intval($data['scoreEmo']) : null;
$scoreFis = isset($data['scoreFis']) ? intval($data['scoreFis']) : null;
$nivelCarga = isset($data['nivelCarga']) ? intval($data['nivelCarga']) : null;
$fecha = sanitize($data['fecha'] ?? '');
if (!validarFecha($fecha)) {
    $fecha = date('Y-m-d');
}
$tipo = sanitize($data['tipo'] ?? 'integral');
$observaciones = sanitize($data['observaciones'] ?? '');

if ($scoreEmo === null || $scoreFis === null || $nivelCarga === null) {
    sendJsonResponse(['error' => 'scoreEmo, scoreFis y nivelCarga son obligatorios'], 400);
}

if ($scoreEmo < 0 || $scoreEmo > 100 || $scoreFis < 0 || $scoreFis > 100 || $nivelCarga < 0 || $nivelCarga > 100) {
    sendJsonResponse(['error' => 'Los valores de bienestar deben estar entre 0 y 100'], 400);
}

// Permisos: si no es admin, solo puede crear para sí mismo
$userRole = $_SESSION['user_role'] ?? 'user';
if ($userRole !== 'admin') {
    $sessionEmail = $_SESSION['user_email'] ?? '';
    if ($sessionEmail && $sessionEmail !== $userEmail) {
        sendJsonResponse(['error' => 'No autorizado para crear registros en nombre de otro usuario'], 403);
    }
}

$stmt = $conn->prepare('SELECT id, created_at FROM bienestar_diario WHERE email = ? AND fecha = ?');
$stmt->bind_param('ss', $userEmail, $fecha);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows > 0) {
    $existing = $result->fetch_assoc();
    $stmt->close();
    $records = obtenerRespuestaRecords($conn, $userEmail);
    sendJsonResponse([
        'success' => false,
        'error' => 'Ya completaste el test de bienestar del día de hoy. Espera 24 horas para volver a realizarlo.',
        'todayRecord' => [
            'id' => (int)$existing['id'],
            'email' => $userEmail,
            'fecha' => $fecha,
            'created_at' => $existing['created_at']
        ],
        'records' => $records
    ], 409);
}

$userId = null;
$stmtUser = $conn->prepare('SELECT id FROM usuarios WHERE email = ?');
$stmtUser->bind_param('s', $userEmail);
$stmtUser->execute();
$resultUser = $stmtUser->get_result();
if ($resultUser->num_rows > 0) {
    $userRow = $resultUser->fetch_assoc();
    $userId = (int)$userRow['id'];
}
$stmtUser->close();

$stmt = $conn->prepare('INSERT INTO bienestar_diario (usuario_id, email, fecha, score_emo, score_fis, nivel_carga, tipo, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->bind_param('issiiiss', $userId, $userEmail, $fecha, $scoreEmo, $scoreFis, $nivelCarga, $tipo, $observaciones);
if (!$stmt->execute()) {
    sendJsonResponse(['error' => 'Error al guardar el bienestar: ' . $stmt->error], 500);
}

$stmt->close();
$records = obtenerRespuestaRecords($conn, $userEmail);
$todayRecord = null;
foreach ($records as $record) {
    if ($record['fecha'] === $fecha) {
        $todayRecord = $record;
        break;
    }
}

sendJsonResponse([
    'success' => true,
    'message' => 'Bienestar diario guardado correctamente',
    'todayRecord' => $todayRecord,
    'records' => $records
], 201);
