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

if (!$miEmail) {
    sendJsonResponse(['error' => 'No autenticado'], 401);
}

$esPsicologa = $miRole === 'psicologa';
$esDocente = in_array($miRole, ['user', 'teacher'], true);

if (!$esPsicologa && !$esDocente) {
    sendJsonResponse(['error' => 'No autorizado'], 403);
}

$conn = getConnection();
ensureUsuariosTable($conn);
ensureFichaEmocionalTable($conn);
ensureFichaSesionesTable($conn);

function obtenerFicha(mysqli $conn, string $email) {
    $stmt = $conn->prepare('SELECT * FROM ficha_emocional WHERE LOWER(profesor_email) = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $ficha = $res->num_rows > 0 ? $res->fetch_assoc() : null;
    $stmt->close();
    return $ficha;
}

function obtenerSesiones(mysqli $conn, string $email) {
    $stmt = $conn->prepare('SELECT id, fecha, motivo, notas, created_by_email, created_at FROM ficha_sesiones WHERE LOWER(profesor_email) = ? ORDER BY fecha DESC, id DESC LIMIT 50');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = [];
    while ($r = $res->fetch_assoc()) {
        $rows[] = [
            'id' => (int)$r['id'],
            'fecha' => $r['fecha'],
            'motivo' => $r['motivo'],
            'notas' => $r['notas'],
            'createdBy' => $r['created_by_email'],
            'createdAt' => $r['created_at']
        ];
    }
    $stmt->close();
    return $rows;
}

function obtenerProfesores(mysqli $conn) {
    $stmt = $conn->prepare("SELECT LOWER(email) AS email, first_name, last_name, especialidad, profile_pic FROM usuarios WHERE LOWER(role) IN ('user','teacher') ORDER BY first_name, last_name");
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = [];
    while ($r = $res->fetch_assoc()) {
        $rows[] = [
            'email' => $r['email'],
            'firstName' => $r['first_name'] ?? '',
            'lastName' => $r['last_name'] ?? '',
            'especialidad' => $r['especialidad'] ?? '',
            'profilePic' => $r['profile_pic'] ?? ''
        ];
    }
    $stmt->close();
    return $rows;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $listar = isset($_GET['listar']) && $_GET['listar'] === '1';
    if ($listar) {
        if (!$esPsicologa) sendJsonResponse(['error' => 'Solo la psicóloga puede listar fichas emocionales'], 403);
        $profesores = obtenerProfesores($conn);
        sendJsonResponse(['success' => true, 'profesores' => $profesores]);
    }

    $email = !empty($_GET['email']) ? strtolower(trim($_GET['email'])) : $miEmail;

    if ($esDocente && $email !== $miEmail) {
        sendJsonResponse(['error' => 'Solo podés ver tu propia ficha'], 403);
    }

    $ficha = obtenerFicha($conn, $email);
    $sesiones = obtenerSesiones($conn, $email);
    sendJsonResponse([
        'success' => true,
        'ficha' => $ficha,
        'sesiones' => $sesiones,
        'puedeEditar' => $esPsicologa
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$esPsicologa) sendJsonResponse(['error' => 'Solo la psicóloga puede editar fichas emocionales'], 403);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) sendJsonResponse(['error' => 'Datos inválidos'], 400);

    $accion = $input['accion'] ?? 'ficha';
    $email = !empty($input['profesorEmail']) ? strtolower(trim($input['profesorEmail'])) : '';
    if (!$email) sendJsonResponse(['error' => 'profesorEmail requerido'], 400);

    $stmtCheck = $conn->prepare("SELECT role FROM usuarios WHERE LOWER(email) = ?");
    $stmtCheck->bind_param('s', $email);
    $stmtCheck->execute();
    $resCheck = $stmtCheck->get_result();
    if ($resCheck->num_rows === 0) sendJsonResponse(['error' => 'Profesor no encontrado'], 404);
    $rolDest = strtolower($resCheck->fetch_assoc()['role'] ?? '');
    $stmtCheck->close();
    if (!in_array($rolDest, ['user', 'teacher'], true)) {
        sendJsonResponse(['error' => 'El destinatario no es un docente'], 400);
    }

    if ($accion === 'sesion') {
        $fecha = sanitize($input['fecha'] ?? date('Y-m-d'));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) $fecha = date('Y-m-d');
        $motivo = sanitize($input['motivo'] ?? '');
        $notas = isset($input['notas']) ? trim($input['notas']) : '';
        if (!$motivo && !$notas) sendJsonResponse(['error' => 'Motivo o notas son requeridos'], 400);

        $stmt = $conn->prepare('INSERT INTO ficha_sesiones (profesor_email, fecha, motivo, notas, created_by_email) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('sssss', $email, $fecha, $motivo, $notas, $miEmail);
        if (!$stmt->execute()) sendJsonResponse(['error' => 'Error al guardar sesión: ' . $stmt->error], 500);
        $stmt->close();

        sendJsonResponse(['success' => true, 'sesiones' => obtenerSesiones($conn, $email)]);
    }

    // accion === 'ficha': upsert
    $estadoEmocional = sanitize($input['estadoEmocional'] ?? '');
    $antecedentes = isset($input['antecedentes']) ? trim($input['antecedentes']) : '';
    $tipoTerapia = sanitize($input['tipoTerapia'] ?? '');
    $medicacion = isset($input['medicacionPsiquiatrica']) ? trim($input['medicacionPsiquiatrica']) : '';
    $factoresEstres = isset($input['factoresEstres']) ? trim($input['factoresEstres']) : '';
    $redApoyo = isset($input['redApoyo']) ? trim($input['redApoyo']) : '';
    $observaciones = isset($input['observaciones']) ? trim($input['observaciones']) : '';
    $ultimaSesion = sanitize($input['ultimaSesion'] ?? '');
    if ($ultimaSesion && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $ultimaSesion)) $ultimaSesion = null;
    if (!$ultimaSesion) $ultimaSesion = null;
    $proximaSesion = sanitize($input['proximaSesion'] ?? '');
    if ($proximaSesion && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $proximaSesion)) $proximaSesion = null;
    if (!$proximaSesion) $proximaSesion = null;

    $existente = obtenerFicha($conn, $email);
    if ($existente) {
        $stmt = $conn->prepare('UPDATE ficha_emocional SET estado_emocional=?, antecedentes=?, tipo_terapia=?, medicacion_psiquiatrica=?, factores_estres=?, red_apoyo=?, observaciones=?, ultima_sesion=?, proxima_sesion=?, updated_by_email=? WHERE LOWER(profesor_email)=?');
        $stmt->bind_param('sssssssssss', $estadoEmocional, $antecedentes, $tipoTerapia, $medicacion, $factoresEstres, $redApoyo, $observaciones, $ultimaSesion, $proximaSesion, $miEmail, $email);
    } else {
        $stmt = $conn->prepare('INSERT INTO ficha_emocional (profesor_email, estado_emocional, antecedentes, tipo_terapia, medicacion_psiquiatrica, factores_estres, red_apoyo, observaciones, ultima_sesion, proxima_sesion, updated_by_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('sssssssssss', $email, $estadoEmocional, $antecedentes, $tipoTerapia, $medicacion, $factoresEstres, $redApoyo, $observaciones, $ultimaSesion, $proximaSesion, $miEmail);
    }

    if (!$stmt->execute()) sendJsonResponse(['error' => 'Error al guardar ficha: ' . $stmt->error], 500);
    $stmt->close();

    sendJsonResponse([
        'success' => true,
        'ficha' => obtenerFicha($conn, $email),
        'sesiones' => obtenerSesiones($conn, $email)
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!$esPsicologa) sendJsonResponse(['error' => 'Solo la psicóloga puede eliminar sesiones'], 403);
    $input = json_decode(file_get_contents('php://input'), true);
    $sesionId = isset($input['id']) ? intval($input['id']) : 0;
    if (!$sesionId) sendJsonResponse(['error' => 'id requerido'], 400);

    $stmt = $conn->prepare('SELECT profesor_email FROM ficha_sesiones WHERE id = ?');
    $stmt->bind_param('i', $sesionId);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) sendJsonResponse(['error' => 'Sesión no encontrada'], 404);
    $email = strtolower($res->fetch_assoc()['profesor_email']);
    $stmt->close();

    $del = $conn->prepare('DELETE FROM ficha_sesiones WHERE id = ?');
    $del->bind_param('i', $sesionId);
    if (!$del->execute()) sendJsonResponse(['error' => 'Error al eliminar: ' . $del->error], 500);
    $del->close();

    sendJsonResponse(['success' => true, 'sesiones' => obtenerSesiones($conn, $email)]);
}

sendJsonResponse(['error' => 'Método no permitido'], 405);
