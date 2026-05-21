<?php
require_once __DIR__ . '/config_database.php';

if (php_sapi_name() !== 'cli') {
    echo "Use via CLI: php delete_encuesta_today.php user@example.com\n";
    exit(1);
}

$email = $argv[1] ?? '';
if (!$email) {
    echo "Usage: php delete_encuesta_today.php email\n";
    exit(1);
}

$conn = getConnection();
$fecha = date('Y-m-d');

// Count existing
$stmt = $conn->prepare('SELECT COUNT(*) AS c FROM encuesta WHERE email = ? AND fecha = ?');
$stmt->bind_param('ss', $email, $fecha);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
echo "Before delete: " . ($row['c'] ?? 0) . " records for $email on $fecha\n";
$stmt->close();

$stmt = $conn->prepare('DELETE FROM encuesta WHERE email = ? AND fecha = ?');
$stmt->bind_param('ss', $email, $fecha);
$stmt->execute();
$deleted = $stmt->affected_rows;
$stmt->close();

echo "Deleted: $deleted\n";

$conn->close();

echo "Done.\n";
