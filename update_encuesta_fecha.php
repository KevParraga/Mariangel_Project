<?php
require_once __DIR__ . '/config_database.php';

if (php_sapi_name() !== 'cli') {
    echo "Use via CLI: php update_encuesta_fecha.php id YYYY-MM-DD\n";
    exit(1);
}

$id = isset($argv[1]) ? intval($argv[1]) : 0;
$newFecha = $argv[2] ?? '';
if (!$id || !$newFecha) {
    echo "Usage: php update_encuesta_fecha.php id YYYY-MM-DD\n";
    exit(1);
}

$conn = getConnection();
$stmt = $conn->prepare('UPDATE encuesta SET fecha = ? WHERE id = ?');
$stmt->bind_param('si', $newFecha, $id);
if (!$stmt->execute()) {
    echo "Error updating: " . $stmt->error . "\n";
    exit(1);
}
echo "Updated id=$id to fecha=$newFecha\n";
$stmt->close();
$conn->close();
