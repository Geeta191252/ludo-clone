<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

$admin = requireAdmin();
$conn = getDBConnection();

$games = [];
$result = $conn->query("SELECT * FROM games ORDER BY id");

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $row['enabled'] = (bool)$row['enabled'];
        $row['min_bet'] = floatval($row['min_bet']);
        $row['max_bet'] = floatval($row['max_bet']);
        $row['house_edge'] = floatval($row['house_edge']);
        $row['multiplier'] = floatval($row['multiplier']);
        $games[] = $row;
    }
}

echo json_encode(['status' => true, 'games' => $games]);
$conn->close();
?>
