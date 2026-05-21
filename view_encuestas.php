<?php
require_once __DIR__ . '/config/database.php';
$conn = getConnection();
// Obtener columnas existentes
$colsRes = $conn->query("SHOW COLUMNS FROM encuesta");
$cols = [];
while ($c = $colsRes->fetch_assoc()) { $cols[] = $c['Field']; }

// Construir SELECT dinámico con columnas existentes
$select = implode(', ', array_map(function($c){ return "`$c`"; }, $cols));
$orderBy = in_array('created_at', $cols) ? 'created_at DESC' : (in_array('enc_id', $cols) ? 'enc_id DESC' : "idencuesta DESC");
$res = $conn->query("SELECT $select FROM encuesta ORDER BY $orderBy LIMIT 50");
$rows = [];
if ($res) {
    while ($r = $res->fetch_assoc()) {
        if (isset($r['respuestas'])) {
            $r['respuestas'] = json_decode($r['respuestas'], true);
        }
        $rows[] = $r;
    }
}
header('Content-Type: application/json');
echo json_encode(['count' => count($rows), 'columns' => $cols, 'rows' => $rows], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
$conn->close();
