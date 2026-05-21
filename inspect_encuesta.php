<?php
require_once __DIR__ . '/config/database.php';
$conn = getConnection();
$res = $conn->query("SHOW TABLES LIKE 'encuesta'");
if ($res === false) { echo "SHOW TABLES error\n"; exit(1);} 
if ($res->num_rows === 0) { echo "TABLE_NOT_FOUND\n"; exit(0);} 
echo "TABLE_EXISTS\n"; 
$desc = $conn->query("DESCRIBE encuesta");
while ($row = $desc->fetch_assoc()) {
    echo $row['Field'] . "\t" . $row['Type'] . "\n";
}
$desc->close();
$conn->close();
