<?php
require_once __DIR__ . '/config/database.php';
$conn = getConnection();
$date = date('Ymd_His');
$old = 'encuesta';
$backup = $old . '_backup_' . $date;
$new = $old . '_new_' . $date;

echo "Starting migration at " . date('c') . "\n";
// Check table exists
$res = $conn->query("SHOW TABLES LIKE '$old'");
if (!$res || $res->num_rows === 0) {
    echo "Table $old not found, aborting.\n";
    exit(1);
}

// 1) Create backup
echo "Creating backup table $backup...\n";
if (!$conn->query("CREATE TABLE `$backup` AS SELECT * FROM `$old`")) {
    echo "Failed to create backup: " . $conn->error . "\n";
    exit(1);
}

// 2) Create new clean table schema
echo "Creating new table $new...\n";
$create = "CREATE TABLE IF NOT EXISTS `$new` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT UNSIGNED DEFAULT NULL,
  `email` VARCHAR(255) NOT NULL,
  `cedula` VARCHAR(50) DEFAULT NULL,
  `fecha` DATE NOT NULL,
  `respuestas` JSON NOT NULL,
  `tips_emocionales` TEXT DEFAULT NULL,
  `tips_fisicos` TEXT DEFAULT NULL,
  `score_emo` TINYINT UNSIGNED DEFAULT NULL,
  `score_fis` TINYINT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
if (!$conn->query($create)) {
    echo "Failed to create new table: " . $conn->error . "\n";
    exit(1);
}

// 3) Copy data from old to new (map columns if exist)
echo "Copying data from $old to $new...\n";
// Build select list with safe defaults
$cols = ['usuario_id', 'email', 'cedula', 'fecha', 'respuestas', 'tips_emocionales', 'tips_fisicos', 'score_emo', 'score_fis'];
$selects = [];
foreach ($cols as $c) {
    $r = $conn->query("SHOW COLUMNS FROM `$old` LIKE '$c'");
    if ($r && $r->num_rows > 0) {
        $selects[] = "`$c`";
    } else {
        // provide NULL or reasonable default
        if ($c === 'respuestas') $selects[] = "JSON_OBJECT() AS `respuestas" . "`";
        else $selects[] = "NULL AS `$c`";
    }
}
$selectSql = implode(', ', $selects);
$insertSql = "INSERT INTO `$new` (usuario_id, email, cedula, fecha, respuestas, tips_emocionales, tips_fisicos, score_emo, score_fis, created_at) SELECT $selectSql, NOW() FROM `$old`";
// Only copy if new table is empty
$countNew = $conn->query("SELECT COUNT(*) AS c FROM `$new`")->fetch_assoc()['c'];
if ($countNew == 0) {
    if (!$conn->query($insertSql)) {
        echo "Failed to copy data: " . $conn->error . "\n";
        exit(1);
    }
} else {
    echo "New table $new already has $countNew rows, skipping copy.\n";
}


// 4) Rename old table and promote new table to 'encuesta'
$renamedOld = $old . '_old_' . $date;
echo "Renaming $old to $renamedOld and $new to $old...\n";
if (!$conn->query("RENAME TABLE `$old` TO `$renamedOld`, `$new` TO `$old`")) {
    echo "Failed to rename tables: " . $conn->error . "\n";
    exit(1);
}

// 5) Verify counts
$origCount = $conn->query("SELECT COUNT(*) AS c FROM `$renamedOld`")->fetch_assoc()['c'];
$newCount = $conn->query("SELECT COUNT(*) AS c FROM `$old`")->fetch_assoc()['c'];

echo "Migration complete. Original rows: $origCount, New rows: $newCount\n";
echo "Backup kept as: $backup and original renamed to: $renamedOld\n";

$conn->close();
?>