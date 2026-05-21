<?php
function doRequest($url, $method = 'GET', $data = null, $cookieFile = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($data !== null) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    if ($cookieFile) {
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    }
    $res = curl_exec($ch);
    if ($res === false) {
        $err = curl_error($ch);
        curl_close($ch);
        throw new Exception($err);
    }
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => $res];
}

$base = 'http://localhost/Ecosistema%20academico';
$cookie = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'sess_test_admin.txt';
@unlink($cookie);

// Credenciales temporales impresas por set_admin.php
$email = 'mariangel.rodriguez@itjo.edu.ve';
$password = 'e276820d6164';

try {
    $login = doRequest($base . '/api_login.php', 'POST', ['email' => $email, 'password' => $password], $cookie);
    echo "LOGIN HTTP: {$login['code']}\n";
    echo "LOGIN BODY:\n" . $login['body'] . "\n\n";

    $getAll = doRequest($base . '/api_bienestar.php?all=1', 'GET', null, $cookie);
    echo "GET ALL HTTP: {$getAll['code']}\n";
    echo "GET ALL BODY:\n" . $getAll['body'] . "\n";
} catch (Exception $e) {
    echo 'ERROR: ' . $e->getMessage() . "\n";
}

?>
