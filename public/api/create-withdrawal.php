<?php
require_once 'config.php';

// CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$mobile = $input['mobile'] ?? '';
$amount = floatval($input['amount'] ?? 0);
$upi_id = $input['upi_id'] ?? '';

if (empty($mobile) || $amount <= 0 || empty($upi_id)) {
    echo json_encode(['status' => false, 'message' => 'Invalid request']);
    exit;
}

$conn = getDBConnection();

// Check user balance
$stmt = $conn->prepare("SELECT winning_balance FROM users WHERE mobile = ?");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    echo json_encode(['status' => false, 'message' => 'User not found']);
    $conn->close();
    exit;
}

if ($user['winning_balance'] < $amount) {
    echo json_encode(['status' => false, 'message' => 'Insufficient balance']);
    $conn->close();
    exit;
}

// Generate order ID
$order_id = 'WD' . time() . rand(1000, 9999);

// Start transaction
$conn->begin_transaction();

try {
    // Deduct from winning balance
    $stmt = $conn->prepare("UPDATE users SET winning_balance = winning_balance - ? WHERE mobile = ?");
    $stmt->bind_param("ds", $amount, $mobile);
    $stmt->execute();
    
    // Create withdrawal transaction
    $stmt = $conn->prepare("INSERT INTO transactions (order_id, mobile, amount, type, status, upi_id) VALUES (?, ?, ?, 'WITHDRAWAL', 'PENDING', ?)");
    $stmt->bind_param("ssds", $order_id, $mobile, $amount, $upi_id);
    $stmt->execute();
    
    $conn->commit();
    
    // Get updated balance
    $stmt = $conn->prepare("SELECT wallet_balance, winning_balance FROM users WHERE mobile = ?");
    $stmt->bind_param("s", $mobile);
    $stmt->execute();
    $result = $stmt->get_result();
    $updated = $result->fetch_assoc();
    
    echo json_encode([
        'status' => true,
        'message' => 'Withdrawal request submitted',
        'order_id' => $order_id,
        'wallet_balance' => floatval($updated['wallet_balance']),
        'winning_balance' => floatval($updated['winning_balance'])
    ]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['status' => false, 'message' => 'Failed to process withdrawal']);
}

$conn->close();
?>
