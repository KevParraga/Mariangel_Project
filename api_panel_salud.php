<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config/database.php';
session_start();

$role = strtolower($_SESSION['user_role'] ?? '');
if (!in_array($role, ['enfermera', 'psicologa'], true)) {
    sendJsonResponse(['error' => 'No autorizado'], 403);
}

$conn = getConnection();
ensureUsuariosTable($conn);
ensureEncuestaTable($conn);

$vista = $role === 'enfermera' ? 'fisica' : 'mental';

$sql = "SELECT
            e.id, e.email, e.fecha, e.created_at,
            e.score_emo, e.score_fis,
            e.tips_emocionales, e.tips_fisicos,
            u.first_name, u.last_name, u.especialidad, u.profile_pic
        FROM encuesta e
        LEFT JOIN usuarios u ON LOWER(u.email) = LOWER(e.email)
        ORDER BY e.fecha DESC, e.created_at DESC";

$result = $conn->query($sql);
$records = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $base = [
            'id' => (int)$row['id'],
            'email' => $row['email'],
            'fecha' => $row['fecha'],
            'created_at' => $row['created_at'],
            'firstName' => $row['first_name'] ?? '',
            'lastName' => $row['last_name'] ?? '',
            'especialidad' => $row['especialidad'] ?? '',
            'profilePic' => $row['profile_pic'] ?? ''
        ];
        if ($vista === 'fisica') {
            $base['scoreFis'] = (int)$row['score_fis'];
            $base['tipsFisicos'] = $row['tips_fisicos'] ?? '';
        } else {
            $base['scoreEmo'] = (int)$row['score_emo'];
            $base['tipsEmocionales'] = $row['tips_emocionales'] ?? '';
        }
        $records[] = $base;
    }
}

sendJsonResponse([
    'success' => true,
    'vista' => $vista,
    'role' => $role,
    'records' => $records
]);
