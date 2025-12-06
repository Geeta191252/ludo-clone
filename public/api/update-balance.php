<?php
require_once 'config.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$mobile = $input['mobile'] ?? '';
$amount = floatval($input['amount'] ?? 0);
$type = $input['type'] ?? ''; // 'deduct' for game bet, 'add' for win

if (empty($mobile)) {
    echo json_encode(['status' => false, 'message' => 'Mobile number required']);
    exit;
}

if ($amount <= 0) {
    echo json_encode(['status' => false, 'message' => 'Invalid amount']);
    exit;
}

if (!in_array($type, ['deduct', 'add'])) {
    echo json_encode(['status' => false, 'message' => 'Invalid type']);
    exit;
}

$conn = getDBConnection();

// Get current balance
$stmt = $conn->prepare("SELECT wallet_balance, winning_balance FROM users WHERE mobile = ?");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$result = $stmt->get_result();

if (!$row = $result->fetch_assoc()) {
    echo json_encode(['status' => false, 'message' => 'User not found']);
    $conn->close();
    exit;
}

$wallet_balance = floatval($row['wallet_balance']);
$winning_balance = floatval($row['winning_balance'] ?? 0);

if ($type === 'deduct') {
    // First deduct from wallet_balance
    if ($wallet_balance >= $amount) {
        $stmt = $conn->prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE mobile = ?");
        $stmt->bind_param("ds", $amount, $mobile);
        $stmt->execute();
    } else if (($wallet_balance + $winning_balance) >= $amount) {
        // Use wallet first, then winning
        $from_wallet = $wallet_balance;
        $from_winning = $amount - $wallet_balance;
        $stmt = $conn->prepare("UPDATE users SET wallet_balance = 0, winning_balance = winning_balance - ? WHERE mobile = ?");
        $stmt->bind_param("ds", $from_winning, $mobile);
        $stmt->execute();
    } else {
        echo json_encode(['status' => false, 'message' => 'Insufficient balance']);
        $conn->close();
        exit;
    }
} else if ($type === 'add') {
    // Add winnings to winning_balance
    $stmt = $conn->prepare("UPDATE users SET winning_balance = winning_balance + ? WHERE mobile = ?");
    $stmt->bind_param("ds", $amount, $mobile);
    $stmt->execute();
}

// Get updated balance
$stmt = $conn->prepare("SELECT wallet_balance, winning_balance FROM users WHERE mobile = ?");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

echo json_encode([
    'status' => true,
    'message' => 'Balance updated',
    'wallet_balance' => floatval($row['wallet_balance']),
    'winning_balance' => floatval($row['winning_balance'] ?? 0)
]);

$conn->close();
?>
