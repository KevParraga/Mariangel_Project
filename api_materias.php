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

$conn = getConnection();
ensureUsuariosTable($conn);
ensureMateriasTable($conn);

function parseTime12(string $timeString) {
    $timeString = trim($timeString);
    if (preg_match('/^(\d{1,2}:\d{2})\s*(AM|PM)$/i', $timeString, $matches)) {
        $parts = explode(':', $matches[1]);
        $hour = intval($parts[0]);
        $minute = intval($parts[1]);
        $period = strtoupper($matches[2]);
        if ($period === 'AM' && $hour === 12) {
            $hour = 0;
        }
        if ($period === 'PM' && $hour !== 12) {
            $hour += 12;
        }
        return $hour * 60 + $minute;
    }
    return null;
}

function obtenerMateriasRecords(mysqli $conn, string $email) {
    $stmt = $conn->prepare('SELECT id, usuario_id, email, cedula, nombre, seccion, tipo, dia, hora_inicio, hora_fin, duracion, created_at, updated_at FROM materias WHERE email = ? ORDER BY dia, hora_inicio');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $records = [];
    while ($row = $result->fetch_assoc()) {
        $records[] = [
            'id' => (int)$row['id'],
            'usuario_id' => $row['usuario_id'] !== null ? (int)$row['usuario_id'] : null,
            'email' => $row['email'],
            'cedula' => $row['cedula'],
            'nombre' => $row['nombre'],
            'seccion' => $row['seccion'],
            'tipo' => $row['tipo'],
            'dia' => $row['dia'],
            'hora_inicio' => $row['hora_inicio'],
            'hora_fin' => $row['hora_fin'],
            'duracion' => floatval($row['duracion']),
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
    }
    $stmt->close();
    return $records;
}

$sessionEmail = !empty($_SESSION['user_email']) ? sanitize(strtolower($_SESSION['user_email'])) : '';
$sessionRole = $_SESSION['user_role'] ?? 'user';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $requestedEmail = !empty($_GET['email']) ? sanitize(strtolower($_GET['email'])) : '';
    if ($requestedEmail) {
        if ($sessionRole !== 'admin' && $requestedEmail !== $sessionEmail) {
            sendJsonResponse(['error' => 'No autorizado para ver materias de otro usuario'], 403);
        }
        $email = $requestedEmail;
    } else {
        if ($sessionRole === 'admin') {
            $stmt = $conn->prepare('SELECT id, usuario_id, email, cedula, nombre, seccion, tipo, dia, hora_inicio, hora_fin, duracion, created_at, updated_at FROM materias ORDER BY email, dia, hora_inicio');
            $stmt->execute();
            $result = $stmt->get_result();
            $records = [];
            while ($row = $result->fetch_assoc()) {
                $records[] = [
                    'id' => (int)$row['id'],
                    'usuario_id' => $row['usuario_id'] !== null ? (int)$row['usuario_id'] : null,
                    'email' => $row['email'],
                    'cedula' => $row['cedula'],
                    'nombre' => $row['nombre'],
                    'seccion' => $row['seccion'],
                    'tipo' => $row['tipo'],
                    'dia' => $row['dia'],
                    'hora_inicio' => $row['hora_inicio'],
                    'hora_fin' => $row['hora_fin'],
                    'duracion' => floatval($row['duracion']),
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at']
                ];
            }
            $stmt->close();
            sendJsonResponse(['success' => true, 'records' => $records]);
        }
        if (!$sessionEmail) {
            sendJsonResponse(['error' => 'Email de sesión requerido'], 400);
        }
        $email = $sessionEmail;
    }

    $records = obtenerMateriasRecords($conn, $email);
    sendJsonResponse(['success' => true, 'records' => $records]);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    sendJsonResponse(['error' => 'Datos inválidos'], 400);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $requestedEmail = !empty($input['email']) ? sanitize(strtolower($input['email'])) : $sessionEmail;
    if (!$requestedEmail) {
        sendJsonResponse(['error' => 'Email requerido'], 400);
    }
    if ($sessionRole !== 'admin' && $requestedEmail !== $sessionEmail) {
        sendJsonResponse(['error' => 'No autorizado para guardar materias de otro usuario'], 403);
    }

    $nombre = sanitize($input['nombre'] ?? '');
    $seccion = sanitize($input['seccion'] ?? '');
    $tipo = sanitize($input['tipo'] ?? '');
    $dia = sanitize($input['dia'] ?? '');
    $horaInicio = sanitize($input['horaInicio'] ?? '');
    $horaFin = sanitize($input['horaFin'] ?? '');

    if (!$nombre || !$seccion || !$tipo || !$dia || !$horaInicio || !$horaFin) {
        sendJsonResponse(['error' => 'Todos los campos de materia son obligatorios'], 400);
    }

    $inicioMinutos = parseTime12($horaInicio);
    $finMinutos = parseTime12($horaFin);
    if ($inicioMinutos === null || $finMinutos === null) {
        sendJsonResponse(['error' => 'Formato de hora inválido, use HH:MM AM/PM'], 400);
    }
    if ($finMinutos <= $inicioMinutos) {
        sendJsonResponse(['error' => 'La hora de fin debe ser posterior a la hora de inicio'], 400);
    }

    $duracion = round(($finMinutos - $inicioMinutos) / 60, 1);
    if ($duracion <= 0 || $duracion > 10) {
        sendJsonResponse(['error' => 'Duración de materia inválida'], 400);
    }

    $userId = null;
    $stmtUser = $conn->prepare('SELECT id FROM usuarios WHERE email = ?');
    $stmtUser->bind_param('s', $requestedEmail);
    $stmtUser->execute();
    $resultUser = $stmtUser->get_result();
    if ($resultUser->num_rows > 0) {
        $userRow = $resultUser->fetch_assoc();
        $userId = (int)$userRow['id'];
    }
    $stmtUser->close();

    $materiaId = isset($input['id']) ? intval($input['id']) : 0;
    if ($materiaId > 0) {
        $stmt = $conn->prepare('SELECT id, email FROM materias WHERE id = ?');
        $stmt->bind_param('i', $materiaId);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            sendJsonResponse(['error' => 'Materia no encontrada'], 404);
        }
        $row = $result->fetch_assoc();
        $stmt->close();

        if ($sessionRole !== 'admin' && strtolower($row['email']) !== $sessionEmail) {
            sendJsonResponse(['error' => 'No autorizado para modificar esta materia'], 403);
        }

        $update = $conn->prepare('UPDATE materias SET usuario_id = ?, email = ?, cedula = ?, nombre = ?, seccion = ?, tipo = ?, dia = ?, hora_inicio = ?, hora_fin = ?, duracion = ? WHERE id = ?');
        $cedula = sanitize($input['cedula'] ?? '');
        $update->bind_param('isssssssdii', $userId, $requestedEmail, $cedula, $nombre, $seccion, $tipo, $dia, $horaInicio, $horaFin, $duracion, $materiaId);
        if (!$update->execute()) {
            sendJsonResponse(['error' => 'Error al actualizar materia: ' . $update->error], 500);
        }
        $update->close();
    } else {
        $insert = $conn->prepare('INSERT INTO materias (usuario_id, email, cedula, nombre, seccion, tipo, dia, hora_inicio, hora_fin, duracion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $cedula = sanitize($input['cedula'] ?? '');
        $insert->bind_param('issssssssd', $userId, $requestedEmail, $cedula, $nombre, $seccion, $tipo, $dia, $horaInicio, $horaFin, $duracion);
        if (!$insert->execute()) {
            sendJsonResponse(['error' => 'Error al guardar materia: ' . $insert->error], 500);
        }
        $insert->close();
    }

    $records = obtenerMateriasRecords($conn, $requestedEmail);
    sendJsonResponse(['success' => true, 'message' => 'Materia guardada correctamente', 'records' => $records], 201);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $materiaId = isset($input['id']) ? intval($input['id']) : 0;
    if (!$materiaId) {
        sendJsonResponse(['error' => 'ID de materia requerido'], 400);
    }

    $stmt = $conn->prepare('SELECT id, email FROM materias WHERE id = ?');
    $stmt->bind_param('i', $materiaId);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        sendJsonResponse(['error' => 'Materia no encontrada'], 404);
    }
    $row = $result->fetch_assoc();
    $stmt->close();

    if ($sessionRole !== 'admin' && strtolower($row['email']) !== $sessionEmail) {
        sendJsonResponse(['error' => 'No autorizado para eliminar esta materia'], 403);
    }

    $delete = $conn->prepare('DELETE FROM materias WHERE id = ?');
    $delete->bind_param('i', $materiaId);
    if (!$delete->execute()) {
        sendJsonResponse(['error' => 'Error al eliminar materia: ' . $delete->error], 500);
    }
    $delete->close();

    $requestedEmail = strtolower($row['email']);
    $records = obtenerMateriasRecords($conn, $requestedEmail);
    sendJsonResponse(['success' => true, 'message' => 'Materia eliminada correctamente', 'records' => $records]);
}

sendJsonResponse(['error' => 'Método no permitido'], 405);
