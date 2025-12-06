<?php
// Pay0.shop Webhook Callback Handler - Fixed Version
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once 'config.php';

function logMsg($msg) {
    file_put_contents('webhook_log.txt', date('Y-m-d H:i:s') . " - " . $msg . "\n", FILE_APPEND);
}

// Get raw input
$raw_input = file_get_contents('php://input');
logMsg("START CALLBACK");
logMsg("RAW: " . $raw_input);

// Parse data - try JSON first, then URL-encoded
$data = json_decode($raw_input, true);
if (!$data) {
    parse_str($raw_input, $data);
}

// Extract values
$status = trim($data['status'] ?? $_POST['status'] ?? $_GET['status'] ?? '');
$order_id = trim($data['order_id'] ?? $_POST['order_id'] ?? $_GET['order_id'] ?? '');
$utr = trim($data['utr'] ?? $_POST['utr'] ?? $_GET['utr'] ?? '');

logMsg("Parsed - Status: $status, Order: $order_id, UTR: $utr");

if (empty($order_id)) {
    logMsg("ERROR: Empty order_id");
    die('Invalid order_id');
}

try {
    $conn = getDBConnection();
    logMsg("DB Connected");
    
    // Get transaction using simple query with escaping
    $order_id_escaped = $conn->real_escape_string($order_id);
    $sql = "SELECT * FROM transactions WHERE order_id = '$order_id_escaped' LIMIT 1";
    $result = $conn->query($sql);
    
    if (!$result) {
        logMsg("ERROR: Query failed - " . $conn->error);
        die('Query error');
    }
    
    $transaction = $result->fetch_assoc();
    $result->free();
    
    if (!$transaction) {
        logMsg("ERROR: Transaction not found");
        die('Transaction not found');
    }
    
    $mobile = $transaction['mobile'];
    $tx_amount = floatval($transaction['amount']);
    $current_status = $transaction['status'];
    
    logMsg("Found - Mobile: $mobile, Amount: $tx_amount, Status: $current_status");
    
    // Check if already processed
    if ($current_status !== 'PENDING') {
        logMsg("Already processed, skipping");
        die('Already processed');
    }
    
    // Check status
    if (strtoupper($status) === 'SUCCESS') {
        logMsg("Processing SUCCESS");
        
        // Update transaction to SUCCESS
        $utr_escaped = $conn->real_escape_string($utr);
        $update_tx = "UPDATE transactions SET status = 'SUCCESS', utr = '$utr_escaped', updated_at = NOW() WHERE order_id = '$order_id_escaped' AND status = 'PENDING'";
        
        logMsg("Running TX update: $update_tx");
        
        if (!$conn->query($update_tx)) {
            logMsg("ERROR: TX update failed - " . $conn->error);
            die('TX update error');
        }
        
        $tx_affected = $conn->affected_rows;
        logMsg("TX updated, affected: $tx_affected");
        
        if ($tx_affected > 0) {
            // Update wallet balance
            $mobile_escaped = $conn->real_escape_string($mobile);
            $update_wallet = "UPDATE users SET wallet_balance = wallet_balance + $tx_amount WHERE mobile = '$mobile_escaped'";
            
            logMsg("Running wallet update: $update_wallet");
            
            if (!$conn->query($update_wallet)) {
                logMsg("ERROR: Wallet update failed - " . $conn->error);
                die('Wallet error');
            }
            
            $wallet_affected = $conn->affected_rows;
            logMsg("Wallet updated, affected: $wallet_affected");
            
            // If user doesn't exist, create
            if ($wallet_affected === 0) {
                $insert_user = "INSERT INTO users (mobile, wallet_balance, created_at) VALUES ('$mobile_escaped', $tx_amount, NOW())";
                logMsg("Creating new user: $insert_user");
                $conn->query($insert_user);
                logMsg("User created");
            }
        }
        
        logMsg("SUCCESS COMPLETE");
        echo 'SUCCESS';
        
    } else {
        logMsg("Processing FAILED status");
        
        $update_fail = "UPDATE transactions SET status = 'FAILED', updated_at = NOW() WHERE order_id = '$order_id_escaped' AND status = 'PENDING'";
        $conn->query($update_fail);
        
        logMsg("FAILED COMPLETE");
        echo 'FAILED';
    }
    
    $conn->close();
    
} catch (Exception $e) {
    logMsg("EXCEPTION: " . $e->getMessage());
    die('Error: ' . $e->getMessage());
}
?>
