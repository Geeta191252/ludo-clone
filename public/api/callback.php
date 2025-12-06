<?php
// Pay0.shop Webhook Callback Handler
require_once 'config.php';

// Log all incoming requests for debugging
$log_data = date('Y-m-d H:i:s') . ' - ' . json_encode($_POST) . ' - ' . json_encode($_GET) . "\n";
file_put_contents('webhook_log.txt', $log_data, FILE_APPEND);

// Allow both GET and POST
$status = $_POST['status'] ?? $_GET['status'] ?? '';
$order_id = $_POST['order_id'] ?? $_GET['order_id'] ?? '';
$amount = floatval($_POST['amount'] ?? $_GET['amount'] ?? 0);
$utr = $_POST['utr'] ?? $_GET['utr'] ?? '';

if (empty($order_id)) {
    echo 'Invalid order_id';
    exit;
}

$conn = getDBConnection();

// First get the transaction details to find the mobile number
$stmt = $conn->prepare("SELECT * FROM transactions WHERE order_id = ?");
$stmt->bind_param("s", $order_id);
$stmt->execute();
$result = $stmt->get_result();
$transaction = $result->fetch_assoc();

if (!$transaction) {
    echo 'Transaction not found';
    exit;
}

$mobile = $transaction['mobile'];

if ($status === 'SUCCESS' || $status === 'success') {
    // Update transaction status
    $stmt = $conn->prepare("UPDATE transactions SET status = 'SUCCESS', utr = ?, updated_at = NOW() WHERE order_id = ? AND status = 'PENDING'");
    $stmt->bind_param("ss", $utr, $order_id);
    $stmt->execute();
    
    // Only update wallet if transaction was actually updated (was pending)
    if ($stmt->affected_rows > 0) {
        // Update user wallet balance
        $tx_amount = $transaction['amount'];
        $stmt = $conn->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE mobile = ?");
        $stmt->bind_param("ds", $tx_amount, $mobile);
        $stmt->execute();
        
        // If user doesn't exist, create new user
        if ($stmt->affected_rows === 0) {
            $stmt = $conn->prepare("INSERT INTO users (mobile, wallet_balance, created_at) VALUES (?, ?, NOW())");
            $stmt->bind_param("sd", $mobile, $tx_amount);
            $stmt->execute();
        }
    }
    
    echo 'SUCCESS';
} else {
    // Update transaction as failed
    $stmt = $conn->prepare("UPDATE transactions SET status = 'FAILED', updated_at = NOW() WHERE order_id = ? AND status = 'PENDING'");
    $stmt->bind_param("s", $order_id);
    $stmt->execute();
    
    echo 'FAILED';
}

$conn->close();
?>
