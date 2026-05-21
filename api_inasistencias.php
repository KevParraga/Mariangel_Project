<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
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
ensureUsuariosTable($conn);
ensureInasistenciasTable($conn);

$esAdmin = $miRole === 'admin';

function obtenerInasistencias(mysqli $conn, ?string $email = null): array {
    if ($email) {
        $stmt = $conn->prepare('SELECT i.id, i.profesor_email, i.fecha, i.motivo, i.registrada_por_email, i.created_at FROM inasistencias i WHERE LOWER(i.profesor_email) = ? ORDER BY i.fecha DESC, i.id DESC');
        $stmt->bind_param('s', $email);
    } else {
        $stmt = $conn->prepare('SELECT i.id, i.profesor_email, i.fecha, i.motivo, i.registrada_por_email, i.created_at FROM inasistencias i ORDER BY i.fecha DESC, i.id DESC LIMIT 1000');
    }
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = [];
    while ($r = $res->fetch_assoc()) {
        $rows[] = [
            'id' => (int)$r['id'],
            'profesorEmail' => $r['profesor_email'],
            'fecha' => $r['fecha'],
            'motivo' => $r['motivo'],
            'registradaPor' => $r['registrada_por_email'],
            'createdAt' => $r['created_at']
        ];
    }
    $stmt->close();
    return $rows;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $emailFiltro = !empty($_GET['email']) ? strtolower(trim($_GET['email'])) : '';
    if ($esAdmin) {
        $registros = obtenerInasistencias($conn, $emailFiltro ?: null);
    } else {
        $registros = obtenerInasistencias($conn, $miEmail);
    }
    sendJsonResponse(['success' => true, 'registros' => $registros]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) sendJsonResponse(['error' => 'Datos inválidos'], 400);

    $profesorEmail = !empty($input['profesorEmail']) ? strtolower(trim($input['profesorEmail'])) : $miEmail;
    $fecha = sanitize($input['fecha'] ?? '');
    $motivo = isset($input['motivo']) ? trim($input['motivo']) : '';

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) sendJsonResponse(['error' => 'Fecha inválida'], 400);
    if (!$motivo) sendJsonResponse(['error' => 'Motivo requerido'], 400);

    if (!$esAdmin && $profesorEmail !== $miEmail) {
        sendJsonResponse(['error' => 'No autorizado para registrar inasistencias de otros usuarios'], 403);
    }

    // Verificar que el profesor exista
    $stmtCheck = $conn->prepare("SELECT role FROM usuarios WHERE LOWER(email) = ?");
    $stmtCheck->bind_param('s', $profesorEmail);
    $stmtCheck->execute();
    $resCheck = $stmtCheck->get_result();
    if ($resCheck->num_rows === 0) sendJsonResponse(['error' => 'Profesor no encontrado'], 404);
    $rolDest = strtolower($resCheck->fetch_assoc()['role'] ?? '');
    $stmtCheck->close();
    if (!in_array($rolDest, ['user', 'teacher'], true)) {
        sendJsonResponse(['error' => 'El destinatario no es un docente'], 400);
    }

    $stmt = $conn->prepare('INSERT INTO inasistencias (profesor_email, fecha, motivo, registrada_por_email) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE motivo = VALUES(motivo), registrada_por_email = VALUES(registrada_por_email)');
    $stmt->bind_param('ssss', $profesorEmail, $fecha, $motivo, $miEmail);
    if (!$stmt->execute()) sendJsonResponse(['error' => 'Error al guardar: ' . $stmt->error], 500);
    $stmt->close();

    sendJsonResponse(['success' => true, 'registros' => obtenerInasistencias($conn, $esAdmin ? null : $miEmail)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!$esAdmin) sendJsonResponse(['error' => 'Solo el admin puede eliminar inasistencias'], 403);
    $input = json_decode(file_get_contents('php://input'), true);
    $id = isset($input['id']) ? intval($input['id']) : 0;
    if (!$id) sendJsonResponse(['error' => 'id requerido'], 400);

    $del = $conn->prepare('DELETE FROM inasistencias WHERE id = ?');
    $del->bind_param('i', $id);
    if (!$del->execute()) sendJsonResponse(['error' => 'Error al eliminar: ' . $del->error], 500);
    $del->close();
    sendJsonResponse(['success' => true, 'registros' => obtenerInasistencias($conn, null)]);
}

sendJsonResponse(['error' => 'Método no permitido'], 405);
