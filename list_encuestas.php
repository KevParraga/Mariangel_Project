<?php
require_once __DIR__ . '/config_database.php';

if (php_sapi_name() !== 'cli') {
    echo "Use via CLI: php list_encuestas.php user@example.com\n";
    exit(1);
}

$email = $argv[1] ?? '';
if (!$email) {
    echo "Usage: php list_encuestas.php email\n";
    exit(1);
}

$conn = getConnection();
$stmt = $conn->prepare('SELECT id, fecha, score_emo, score_fis, tips_emocionales, tips_fisicos, created_at FROM encuesta WHERE email = ? ORDER BY fecha DESC, created_at DESC');
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
$rows = [];
while ($r = $res->fetch_assoc()) {
    $rows[] = $r;
}
$stmt->close();
$conn->close();

echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
