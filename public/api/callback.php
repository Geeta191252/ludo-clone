<?php
// Pay0.shop Webhook Callback Handler
require_once 'config.php';

// Get raw input
$raw_input = file_get_contents('php://input');

// Log all incoming requests for debugging
$log_data = date('Y-m-d H:i:s') . " - START CALLBACK\n";
$log_data .= "RAW: " . $raw_input . "\n";
file_put_contents('webhook_log.txt', $log_data, FILE_APPEND);

// Try to parse as JSON first
$json_data = json_decode($raw_input, true);

// If not JSON, try URL-encoded (query string format)
$url_data = [];
if (!$json_data) {
    parse_str($raw_input, $url_data);
}

// Get values from JSON, URL-encoded, POST, or GET
$status = $json_data['status'] ?? $url_data['status'] ?? $_POST['status'] ?? $_GET['status'] ?? '';
$order_id = $json_data['order_id'] ?? $url_data['order_id'] ?? $_POST['order_id'] ?? $_GET['order_id'] ?? '';
$amount = floatval($json_data['amount'] ?? $url_data['amount'] ?? $_POST['amount'] ?? $_GET['amount'] ?? 0);
$utr = $json_data['utr'] ?? $url_data['utr'] ?? $_POST['utr'] ?? $_GET['utr'] ?? '';

file_put_contents('webhook_log.txt', "Parsed - Status: $status, Order: $order_id, Amount: $amount, UTR: $utr\n", FILE_APPEND);

if (empty($order_id)) {
    file_put_contents('webhook_log.txt', "ERROR: Empty order_id\n", FILE_APPEND);
    echo 'Invalid order_id';
    exit;
}

$conn = getDBConnection();

// First get the transaction details
$stmt = $conn->prepare("SELECT * FROM transactions WHERE order_id = ?");
$stmt->bind_param("s", $order_id);
$stmt->execute();
$result = $stmt->get_result();
$transaction = $result->fetch_assoc();

if (!$transaction) {
    file_put_contents('webhook_log.txt', "ERROR: Transaction not found for order_id: $order_id\n", FILE_APPEND);
    echo 'Transaction not found';
    exit;
}

file_put_contents('webhook_log.txt', "Found transaction - Mobile: " . $transaction['mobile'] . ", Amount: " . $transaction['amount'] . ", Current Status: " . $transaction['status'] . "\n", FILE_APPEND);

$mobile = $transaction['mobile'];

if ($status === 'SUCCESS' || $status === 'success') {
    // Update transaction status
    $stmt = $conn->prepare("UPDATE transactions SET status = 'SUCCESS', utr = ?, updated_at = NOW() WHERE order_id = ? AND status = 'PENDING'");
    $stmt->bind_param("ss", $utr, $order_id);
    $stmt->execute();
    $affected = $stmt->affected_rows;
    
    file_put_contents('webhook_log.txt', "Transaction update affected rows: $affected\n", FILE_APPEND);
    
    // Only update wallet if transaction was actually updated (was pending)
    if ($affected > 0) {
        $tx_amount = $transaction['amount'];
        $stmt = $conn->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE mobile = ?");
        $stmt->bind_param("ds", $tx_amount, $mobile);
        $stmt->execute();
        $wallet_affected = $stmt->affected_rows;
        
        file_put_contents('webhook_log.txt', "Wallet update affected rows: $wallet_affected\n", FILE_APPEND);
        
        // If user doesn't exist, create new user
        if ($wallet_affected === 0) {
            $stmt = $conn->prepare("INSERT INTO users (mobile, wallet_balance, created_at) VALUES (?, ?, NOW())");
            $stmt->bind_param("sd", $mobile, $tx_amount);
            $stmt->execute();
            file_put_contents('webhook_log.txt', "Created new user with mobile: $mobile\n", FILE_APPEND);
        }
    } else {
        file_put_contents('webhook_log.txt', "Transaction already processed or not pending\n", FILE_APPEND);
    }
    
    file_put_contents('webhook_log.txt', "SUCCESS - END\n\n", FILE_APPEND);
    echo 'SUCCESS';
} else {
    // Update transaction as failed
    $stmt = $conn->prepare("UPDATE transactions SET status = 'FAILED', updated_at = NOW() WHERE order_id = ? AND status = 'PENDING'");
    $stmt->bind_param("s", $order_id);
    $stmt->execute();
    
    file_put_contents('webhook_log.txt', "FAILED - END\n\n", FILE_APPEND);
    echo 'FAILED';
}

$conn->close();
?>
