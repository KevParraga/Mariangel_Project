<?php
$url = 'http://localhost/Ecosistema academico/api_login.php';
$data = [
    'email' => 'mariangelmicha@gmail.com',
    'password' => '27598744Micha*'
];
$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\n",
        'method' => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true,
    ]
];
$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
if ($result === false) {
    echo "REQUEST_FAILED\n";
    print_r($http_response_header);
} else {
    echo $result;
}
