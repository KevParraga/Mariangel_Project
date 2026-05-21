<?php
function doPostStream($url, $data) {
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'ignore_errors' => true
        ]
    ];
    $context = stream_context_create($opts);
    $res = file_get_contents($url, false, $context);
    if ($res === false) {
        echo "ERROR: no response\n";
    } else {
        echo $res . "\n";
    }
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

doPostStream('http://localhost/Ecosistema%20academico/api_encuesta.php', $payload);
