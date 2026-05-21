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

$esEnfermera = $miRole === 'enfermera';
$esDocente = in_array($miRole, ['user', 'teacher'], true);
$esAdmin = $miRole === 'admin';

if (!$esEnfermera && !$esDocente && !$esAdmin) {
    sendJsonResponse(['error' => 'No autorizado'], 403);
}

$conn = getConnection();
ensureUsuariosTable($conn);
ensureFichaMedicaTable($conn);
ensureFichaVisitasTable($conn);

function obtenerFicha(mysqli $conn, string $email) {
    $stmt = $conn->prepare('SELECT * FROM ficha_medica WHERE LOWER(profesor_email) = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $ficha = $res->num_rows > 0 ? $res->fetch_assoc() : null;
    $stmt->close();
    return $ficha;
}

function obtenerVisitas(mysqli $conn, string $email) {
    $stmt = $conn->prepare('SELECT id, fecha, motivo, notas, created_by_email, created_at FROM ficha_visitas WHERE LOWER(profesor_email) = ? ORDER BY fecha DESC, id DESC LIMIT 50');
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
        if (!$esEnfermera && !$esAdmin) sendJsonResponse(['error' => 'Sin permisos para listar fichas'], 403);
        $profesores = obtenerProfesores($conn);
        sendJsonResponse(['success' => true, 'profesores' => $profesores]);
    }

    $email = !empty($_GET['email']) ? strtolower(trim($_GET['email'])) : $miEmail;

    if ($esDocente && $email !== $miEmail) {
        sendJsonResponse(['error' => 'Solo podés ver tu propia ficha'], 403);
    }

    $ficha = obtenerFicha($conn, $email);
    $visitas = obtenerVisitas($conn, $email);
    sendJsonResponse([
        'success' => true,
        'ficha' => $ficha,
        'visitas' => $visitas,
        'puedeEditar' => $esEnfermera,
        'soloLectura' => $esAdmin
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$esEnfermera) sendJsonResponse(['error' => 'Solo la enfermera puede editar fichas médicas'], 403);

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

    if ($accion === 'visita') {
        $fecha = sanitize($input['fecha'] ?? date('Y-m-d'));
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) $fecha = date('Y-m-d');
        $motivo = sanitize($input['motivo'] ?? '');
        $notas = isset($input['notas']) ? trim($input['notas']) : '';
        if (!$motivo && !$notas) sendJsonResponse(['error' => 'Motivo o notas son requeridos'], 400);

        $stmt = $conn->prepare('INSERT INTO ficha_visitas (profesor_email, fecha, motivo, notas, created_by_email) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('sssss', $email, $fecha, $motivo, $notas, $miEmail);
        if (!$stmt->execute()) sendJsonResponse(['error' => 'Error al guardar visita: ' . $stmt->error], 500);
        $stmt->close();

        sendJsonResponse(['success' => true, 'visitas' => obtenerVisitas($conn, $email)]);
    }

    // accion === 'ficha': upsert
    $tipoSangre = sanitize($input['tipoSangre'] ?? '');
    $alergias = isset($input['alergias']) ? trim($input['alergias']) : '';
    $enfermedades = isset($input['enfermedadesCronicas']) ? trim($input['enfermedadesCronicas']) : '';
    $medicacion = isset($input['medicacionActual']) ? trim($input['medicacionActual']) : '';
    $peso = isset($input['peso']) && $input['peso'] !== '' ? floatval($input['peso']) : null;
    $altura = isset($input['altura']) && $input['altura'] !== '' ? floatval($input['altura']) : null;
    $presion = sanitize($input['presionArterial'] ?? '');
    $fc = isset($input['frecuenciaCardiaca']) && $input['frecuenciaCardiaca'] !== '' ? intval($input['frecuenciaCardiaca']) : null;
    $contactoNombre = sanitize($input['contactoNombre'] ?? '');
    $contactoTel = sanitize($input['contactoTelefono'] ?? '');
    $contactoRel = sanitize($input['contactoRelacion'] ?? '');
    $observaciones = isset($input['observaciones']) ? trim($input['observaciones']) : '';
    $ultimaConsulta = sanitize($input['ultimaConsulta'] ?? '');
    if ($ultimaConsulta && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $ultimaConsulta)) $ultimaConsulta = null;
    if (!$ultimaConsulta) $ultimaConsulta = null;

    if ($peso !== null && ($peso < 20 || $peso > 300)) sendJsonResponse(['error' => 'Peso fuera de rango (20-300 kg)'], 400);
    if ($altura !== null && ($altura < 0.5 || $altura > 2.5)) sendJsonResponse(['error' => 'Altura fuera de rango (0.5-2.5 m)'], 400);
    if ($fc !== null && ($fc < 30 || $fc > 220)) sendJsonResponse(['error' => 'Frecuencia cardíaca fuera de rango (30-220)'], 400);
    if ($presion && !preg_match('/^\d{2,3}\/\d{2,3}$/', $presion)) sendJsonResponse(['error' => 'Presión arterial debe tener formato XXX/XX'], 400);

    $existente = obtenerFicha($conn, $email);
    if ($existente) {
        $stmt = $conn->prepare('UPDATE ficha_medica SET tipo_sangre=?, alergias=?, enfermedades_cronicas=?, medicacion_actual=?, peso=?, altura=?, presion_arterial=?, frecuencia_cardiaca=?, contacto_nombre=?, contacto_telefono=?, contacto_relacion=?, observaciones=?, ultima_consulta=?, updated_by_email=? WHERE LOWER(profesor_email)=?');
        $stmt->bind_param('ssssddsisssssss', $tipoSangre, $alergias, $enfermedades, $medicacion, $peso, $altura, $presion, $fc, $contactoNombre, $contactoTel, $contactoRel, $observaciones, $ultimaConsulta, $miEmail, $email);
    } else {
        $stmt = $conn->prepare('INSERT INTO ficha_medica (profesor_email, tipo_sangre, alergias, enfermedades_cronicas, medicacion_actual, peso, altura, presion_arterial, frecuencia_cardiaca, contacto_nombre, contacto_telefono, contacto_relacion, observaciones, ultima_consulta, updated_by_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('sssssddsissssss', $email, $tipoSangre, $alergias, $enfermedades, $medicacion, $peso, $altura, $presion, $fc, $contactoNombre, $contactoTel, $contactoRel, $observaciones, $ultimaConsulta, $miEmail);
    }

    if (!$stmt->execute()) sendJsonResponse(['error' => 'Error al guardar ficha: ' . $stmt->error], 500);
    $stmt->close();

    sendJsonResponse([
        'success' => true,
        'ficha' => obtenerFicha($conn, $email),
        'visitas' => obtenerVisitas($conn, $email)
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!$esEnfermera) sendJsonResponse(['error' => 'Solo la enfermera puede eliminar visitas'], 403);
    $input = json_decode(file_get_contents('php://input'), true);
    $visitaId = isset($input['id']) ? intval($input['id']) : 0;
    if (!$visitaId) sendJsonResponse(['error' => 'id requerido'], 400);

    $stmt = $conn->prepare('SELECT profesor_email FROM ficha_visitas WHERE id = ?');
    $stmt->bind_param('i', $visitaId);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) sendJsonResponse(['error' => 'Visita no encontrada'], 404);
    $email = strtolower($res->fetch_assoc()['profesor_email']);
    $stmt->close();

    $del = $conn->prepare('DELETE FROM ficha_visitas WHERE id = ?');
    $del->bind_param('i', $visitaId);
    if (!$del->execute()) sendJsonResponse(['error' => 'Error al eliminar: ' . $del->error], 500);
    $del->close();

    sendJsonResponse(['success' => true, 'visitas' => obtenerVisitas($conn, $email)]);
}

sendJsonResponse(['error' => 'Método no permitido'], 405);
