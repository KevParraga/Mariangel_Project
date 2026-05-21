<?php
require_once __DIR__ . '/config/database.php';
$conn = getConnection();
$res = $conn->query('SHOW CREATE TABLE encuesta');
if ($res) {
    $row = $res->fetch_assoc();
    echo $row['Create Table'];
} else {
    echo 'ERROR: ' . $conn->error;
}
