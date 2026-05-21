<?php
require_once __DIR__ . '/config_database.php';

if (php_sapi_name() !== 'cli') {
    echo "Use via CLI: php insert_encuesta_cli.php user@example.com\n";
    exit(1);
}

$email = $argv[1] ?? '';
if (!$email) {
    echo "Usage: php insert_encuesta_cli.php email\n";
    exit(1);
}

$conn = getConnection();
$fecha = date('Y-m-d');
$respuestas = json_encode(['emo' => [3,3,3], 'fis' => [3,3,3]], JSON_UNESCAPED_UNICODE);
$tipsEm = "Practica 5 minutos de respiración diafragmática antes de iniciar la clase.\nEstablece una hora límite inamovible para revisar actividades.\nComenta tu carga de actividades con la coordinación académica.";
$tipsFis = "Realiza estiramientos obligatorios de cuello y hombros cada 45 minutos.\nAjusta la altura de tu pantalla al nivel de tus ojos.\nConsidera alternar periodos de pie y sentado durante explicaciones largas.";
$scoreEmo = 9;
$scoreFis = 9;

$stmt = $conn->prepare('INSERT INTO encuesta (usuario_id, email, cedula, fecha, respuestas, tips_emocionales, tips_fisicos, score_emo, score_fis) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
$usuarioId = null;
$cedula = null;
$stmt->bind_param('issssssii', $usuarioId, $email, $cedula, $fecha, $respuestas, $tipsEm, $tipsFis, $scoreEmo, $scoreFis);
if (!$stmt->execute()) {
    echo "Error inserting: " . $stmt->error . "\n";
    exit(1);
}
$id = $conn->insert_id;
echo "Inserted encuesta id=$id for $email on $fecha\n";
$stmt->close();
$conn->close();
