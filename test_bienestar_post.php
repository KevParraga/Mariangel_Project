<?php
$data = [
    'email' => 'mariangelmicha@gmail.com',
    'scoreEmo' => 18,
    'scoreFis' => 15,
    'nivelCarga' => 80
];
$options = [
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode($data),
        'ignore_errors' => true,
    ],
];
$context = stream_context_create($options);
echo file_get_contents('http://localhost/Ecosistema%20academico/api_bienestar.php', false, $context);
