<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

$admin = requireAdmin();
$conn = getDBConnection();

$users = [];
$result = $conn->query("SELECT id, mobile, player_name, wallet_balance, winning_balance, status, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at FROM users ORDER BY id DESC");

while ($row = $result->fetch_assoc()) {
    $row['wallet_balance'] = floatval($row['wallet_balance']);
    $row['winning_balance'] = floatval($row['winning_balance'] ?? 0);
    $users[] = $row;
}

echo json_encode(['status' => true, 'users' => $users]);
$conn->close();
?>
