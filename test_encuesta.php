<?php
function doPost($url, $data) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data, JSON_UNESCAPED_UNICODE));
    $res = curl_exec($ch);
    if ($res === false) {
        echo 'CURL ERROR: ' . curl_error($ch) . "\n";
    } else {
        echo $res . "\n";
    }
    curl_close($ch);
}

$payload = [
    'email' => 'mariangel.rodriguez@itjo.edu.ve',
    'cedula' => '27598744',
    'respuestas' => [
        ['pregunta' => '¿Test?', 'tipo' => 'emo', 'respuesta' => 2]
    ],
    'tipsEmocionales' => 'Consejo 1',
    'tipsFisicos' => 'Consejo 2',
    'scoreEmo' => 2,
    'scoreFis' => 0
];

doPost('http://localhost/Ecosistema%20academico/api_encuesta.php', $payload);
