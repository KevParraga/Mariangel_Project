<?php
$conn = new mysqli('localhost', 'root', '', 'sistema de carga academica y bienestar');
if ($conn->connect_error) {
    echo 'ERR:' . $conn->connect_error;
    exit(1);
}
$email = 'mariangelmicha@gmail.com';
$stmt = $conn->prepare('SELECT id, email, password FROM usuarios WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    echo 'NOTFOUND';
} else {
    $row = $res->fetch_assoc();
    echo json_encode($row, JSON_PRETTY_PRINT);
}
$stmt->close();
$conn->close();
