<?php
require 'config/database.php';
$conn = getConnection();
$email = 'mariangelmicha@gmail.com';
date_default_timezone_set('America/Bogota');
$date = '2026-05-20';
$stmt = $conn->prepare('SELECT * FROM bienestar_diario WHERE email=? ORDER BY fecha DESC, created_at DESC LIMIT 20');
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    echo "NO_RECORDS\n";
}
while ($row = $res->fetch_assoc()) {
    echo json_encode($row) . "\n";
}
$stmt->close();
$conn->close();
