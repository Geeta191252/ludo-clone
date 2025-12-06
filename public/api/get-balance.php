<?php
require_once 'config.php';
header('Content-Type: application/json');

$mobile = $_GET['mobile'] ?? '';

if (empty($mobile)) {
    echo json_encode(['status' => false, 'message' => 'Mobile number required']);
    exit;
}

$conn = getDBConnection();

$stmt = $conn->prepare("SELECT wallet_balance, winning_balance FROM users WHERE mobile = ?");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        'status' => true,
        'wallet_balance' => floatval($row['wallet_balance']),
        'winning_balance' => floatval($row['winning_balance'] ?? 0)
    ]);
} else {
    echo json_encode([
        'status' => true,
        'wallet_balance' => 0,
        'winning_balance' => 0
    ]);
}

$conn->close();
?>
