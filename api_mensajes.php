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

if (!$miEmail) {
    sendJsonResponse(['error' => 'No autenticado'], 401);
}

$rolesProfesional = ['enfermera', 'psicologa'];
$rolesDocente = ['user', 'teacher'];

function esCompatible(string $miRole, string $otroRole, array $rolesProfesional, array $rolesDocente): bool {
    if (in_array($miRole, $rolesProfesional, true)) return in_array($otroRole, $rolesDocente, true);
    if (in_array($miRole, $rolesDocente, true)) return in_array($otroRole, $rolesProfesional, true);
    return false;
}

$conn = getConnection();
ensureUsuariosTable($conn);
ensureMensajesTable($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $con = !empty($_GET['con']) ? strtolower(trim($_GET['con'])) : '';

    if ($con) {
        $stmtRole = $conn->prepare('SELECT role FROM usuarios WHERE LOWER(email) = ?');
        $stmtRole->bind_param('s', $con);
        $stmtRole->execute();
        $resRole = $stmtRole->get_result();
        if ($resRole->num_rows === 0) {
            sendJsonResponse(['error' => 'Contacto no encontrado'], 404);
        }
        $otroRole = strtolower($resRole->fetch_assoc()['role'] ?? 'user');
        $stmtRole->close();

        if (!esCompatible($miRole, $otroRole, $rolesProfesional, $rolesDocente)) {
            sendJsonResponse(['error' => 'No autorizado para chatear con este usuario'], 403);
        }

        $stmt = $conn->prepare(
            'SELECT id, remitente_email, destinatario_email, contenido, fecha, leido
             FROM mensajes
             WHERE (LOWER(remitente_email) = ? AND LOWER(destinatario_email) = ?)
                OR (LOWER(remitente_email) = ? AND LOWER(destinatario_email) = ?)
             ORDER BY fecha ASC, id ASC'
        );
        $stmt->bind_param('ssss', $miEmail, $con, $con, $miEmail);
        $stmt->execute();
        $res = $stmt->get_result();
        $mensajes = [];
        while ($row = $res->fetch_assoc()) {
            $mensajes[] = [
                'id' => (int)$row['id'],
                'remitente' => $row['remitente_email'],
                'destinatario' => $row['destinatario_email'],
                'contenido' => $row['contenido'],
                'fecha' => $row['fecha'],
                'leido' => (int)$row['leido'] === 1,
                'esPropio' => strtolower($row['remitente_email']) === $miEmail
            ];
        }
        $stmt->close();

        $upd = $conn->prepare('UPDATE mensajes SET leido = 1 WHERE LOWER(destinatario_email) = ? AND LOWER(remitente_email) = ? AND leido = 0');
        $upd->bind_param('ss', $miEmail, $con);
        $upd->execute();
        $upd->close();

        sendJsonResponse(['success' => true, 'mensajes' => $mensajes]);
    }

    $stmtContactos = $conn->prepare(
        "SELECT
            CASE WHEN LOWER(m.remitente_email) = ? THEN LOWER(m.destinatario_email)
                 ELSE LOWER(m.remitente_email) END AS contacto_email,
            MAX(m.fecha) AS ultimo_fecha,
            SUM(CASE WHEN LOWER(m.destinatario_email) = ? AND m.leido = 0 THEN 1 ELSE 0 END) AS no_leidos
         FROM mensajes m
         WHERE LOWER(m.remitente_email) = ? OR LOWER(m.destinatario_email) = ?
         GROUP BY contacto_email
         ORDER BY ultimo_fecha DESC"
    );
    $stmtContactos->bind_param('ssss', $miEmail, $miEmail, $miEmail, $miEmail);
    $stmtContactos->execute();
    $resCt = $stmtContactos->get_result();
    $contactos = [];
    $contactoEmails = [];
    while ($row = $resCt->fetch_assoc()) {
        $contactoEmails[] = $row['contacto_email'];
        $contactos[$row['contacto_email']] = [
            'email' => $row['contacto_email'],
            'ultimoFecha' => $row['ultimo_fecha'],
            'noLeidos' => (int)$row['no_leidos']
        ];
    }
    $stmtContactos->close();

    if (!empty($contactoEmails)) {
        $placeholders = implode(',', array_fill(0, count($contactoEmails), '?'));
        $types = str_repeat('s', count($contactoEmails));
        $sqlInfo = "SELECT LOWER(email) AS email, first_name, last_name, role, especialidad, profile_pic FROM usuarios WHERE LOWER(email) IN ($placeholders)";
        $stmtInfo = $conn->prepare($sqlInfo);
        $stmtInfo->bind_param($types, ...$contactoEmails);
        $stmtInfo->execute();
        $resInfo = $stmtInfo->get_result();
        while ($row = $resInfo->fetch_assoc()) {
            $em = $row['email'];
            if (isset($contactos[$em])) {
                $contactos[$em]['firstName'] = $row['first_name'] ?? '';
                $contactos[$em]['lastName'] = $row['last_name'] ?? '';
                $contactos[$em]['role'] = strtolower($row['role'] ?? 'user');
                $contactos[$em]['especialidad'] = $row['especialidad'] ?? '';
                $contactos[$em]['profilePic'] = $row['profile_pic'] ?? '';
            }
        }
        $stmtInfo->close();
    }

    $contactos = array_values(array_filter($contactos, function ($c) use ($miRole, $rolesProfesional, $rolesDocente) {
        return isset($c['role']) && esCompatible($miRole, $c['role'], $rolesProfesional, $rolesDocente);
    }));

    $rolesObjetivo = in_array($miRole, $rolesProfesional, true) ? $rolesDocente : $rolesProfesional;
    $placeholdersRol = implode(',', array_fill(0, count($rolesObjetivo), '?'));
    $typesRol = str_repeat('s', count($rolesObjetivo));
    $sqlDisp = "SELECT LOWER(email) AS email, first_name, last_name, role, especialidad, profile_pic FROM usuarios WHERE LOWER(role) IN ($placeholdersRol) AND LOWER(email) <> ? ORDER BY first_name, last_name";
    $stmtDisp = $conn->prepare($sqlDisp);
    $args = array_merge($rolesObjetivo, [$miEmail]);
    $stmtDisp->bind_param($typesRol . 's', ...$args);
    $stmtDisp->execute();
    $resDisp = $stmtDisp->get_result();
    $disponibles = [];
    $yaEnContactos = array_map(function ($c) { return $c['email']; }, $contactos);
    while ($row = $resDisp->fetch_assoc()) {
        if (in_array($row['email'], $yaEnContactos, true)) continue;
        $disponibles[] = [
            'email' => $row['email'],
            'firstName' => $row['first_name'] ?? '',
            'lastName' => $row['last_name'] ?? '',
            'role' => strtolower($row['role'] ?? ''),
            'especialidad' => $row['especialidad'] ?? '',
            'profilePic' => $row['profile_pic'] ?? ''
        ];
    }
    $stmtDisp->close();

    $totalNoLeidos = array_sum(array_map(function ($c) { return $c['noLeidos']; }, $contactos));

    sendJsonResponse([
        'success' => true,
        'miEmail' => $miEmail,
        'miRole' => $miRole,
        'contactos' => $contactos,
        'disponibles' => $disponibles,
        'totalNoLeidos' => $totalNoLeidos
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        sendJsonResponse(['error' => 'Datos inválidos'], 400);
    }
    $destinatario = !empty($input['destinatario']) ? strtolower(trim($input['destinatario'])) : '';
    $contenido = isset($input['contenido']) ? trim($input['contenido']) : '';

    if (!$destinatario || $contenido === '') {
        sendJsonResponse(['error' => 'Destinatario y contenido son obligatorios'], 400);
    }
    if (mb_strlen($contenido) > 2000) {
        sendJsonResponse(['error' => 'El mensaje supera el máximo de 2000 caracteres'], 400);
    }

    $stmtRole = $conn->prepare('SELECT role FROM usuarios WHERE LOWER(email) = ?');
    $stmtRole->bind_param('s', $destinatario);
    $stmtRole->execute();
    $resRole = $stmtRole->get_result();
    if ($resRole->num_rows === 0) {
        sendJsonResponse(['error' => 'Destinatario no encontrado'], 404);
    }
    $otroRole = strtolower($resRole->fetch_assoc()['role'] ?? 'user');
    $stmtRole->close();

    if (!esCompatible($miRole, $otroRole, $rolesProfesional, $rolesDocente)) {
        sendJsonResponse(['error' => 'No autorizado para chatear con este usuario'], 403);
    }

    $stmt = $conn->prepare('INSERT INTO mensajes (remitente_email, destinatario_email, contenido) VALUES (?, ?, ?)');
    $stmt->bind_param('sss', $miEmail, $destinatario, $contenido);
    if (!$stmt->execute()) {
        sendJsonResponse(['error' => 'Error al enviar el mensaje: ' . $stmt->error], 500);
    }
    $id = $stmt->insert_id;
    $stmt->close();

    sendJsonResponse([
        'success' => true,
        'mensaje' => [
            'id' => (int)$id,
            'remitente' => $miEmail,
            'destinatario' => $destinatario,
            'contenido' => $contenido,
            'esPropio' => true,
            'leido' => false
        ]
    ], 201);
}

sendJsonResponse(['error' => 'Método no permitido'], 405);
