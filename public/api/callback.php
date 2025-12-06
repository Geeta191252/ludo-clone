<?php
// Pay0.shop Webhook Callback Handler
require_once 'config.php';

// Log all incoming requests for debugging
$log_data = date('Y-m-d H:i:s') . ' - ' . json_encode($_POST) . "\n";
file_put_contents('webhook_log.txt', $log_data, FILE_APPEND);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Only POST requests allowed';
    exit;
}

// Get webhook data
$status = $_POST['status'] ?? '';
$order_id = $_POST['order_id'] ?? '';
$amount = floatval($_POST['amount'] ?? 0);
$customer_mobile = $_POST['customer_mobile'] ?? '';
$utr = $_POST['utr'] ?? '';

if (empty($order_id)) {
    echo 'Invalid order_id';
    exit;
}

$conn = getDBConnection();

if ($status === 'SUCCESS') {
    // Update transaction status
    $stmt = $conn->prepare("UPDATE transactions SET status = 'SUCCESS', utr = ?, updated_at = NOW() WHERE order_id = ?");
    $stmt->bind_param("ss", $utr, $order_id);
    $stmt->execute();
    
    // Update user wallet balance
    $stmt = $conn->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE mobile = ?");
    $stmt->bind_param("ds", $amount, $customer_mobile);
    $stmt->execute();
    
    // If user doesn't exist, create new user
    if ($stmt->affected_rows === 0) {
        $stmt = $conn->prepare("INSERT INTO users (mobile, wallet_balance, created_at) VALUES (?, ?, NOW())");
        $stmt->bind_param("sd", $customer_mobile, $amount);
        $stmt->execute();
    }
    
    echo 'SUCCESS';
} else {
    // Update transaction as failed
    $stmt = $conn->prepare("UPDATE transactions SET status = 'FAILED', updated_at = NOW() WHERE order_id = ?");
    $stmt->bind_param("s", $order_id);
    $stmt->execute();
    
    echo 'FAILED';
}

$conn->close();
?>
