<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

$admin = requireAdmin();
$conn = getDBConnection();

$transactions = [];
$result = $conn->query("SELECT id, order_id, mobile, amount, type, status, utr, upi_id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at FROM transactions ORDER BY id DESC LIMIT 500");

while ($row = $result->fetch_assoc()) {
    $row['amount'] = floatval($row['amount']);
    $transactions[] = $row;
}

echo json_encode(['status' => true, 'transactions' => $transactions]);
$conn->close();
?>
