<?php
// Verify Payment Status from Pay0 API
require_once 'config.php';
header('Content-Type: application/json');

// Check admin auth
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    echo json_encode(['status' => false, 'message' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$order_id = trim($input['order_id'] ?? '');

if (empty($order_id)) {
    echo json_encode(['status' => false, 'message' => 'Order ID required']);
    exit;
}

try {
    $conn = getDBConnection();
    
    // Get transaction
    $stmt = $conn->prepare("SELECT * FROM transactions WHERE order_id = ? AND status = 'PENDING' LIMIT 1");
    $stmt->bind_param("s", $order_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $transaction = $result->fetch_assoc();
    
    if (!$transaction) {
        echo json_encode(['status' => false, 'message' => 'Pending transaction not found']);
        exit;
    }
    
    // Check status from Pay0 API
    $post_data = [
        'user_token' => PAY0_API_KEY,
        'order_id' => $order_id
    ];
    
    $ch = curl_init(PAY0_STATUS_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo json_encode(['status' => false, 'message' => 'API error: ' . $error]);
        exit;
    }
    
    $api_result = json_decode($response, true);
    
    if (!$api_result) {
        echo json_encode(['status' => false, 'message' => 'Invalid API response', 'raw' => $response]);
        exit;
    }
    
    // Check if payment is successful
    $payment_status = strtoupper($api_result['status'] ?? $api_result['result']['status'] ?? '');
    $utr = $api_result['utr'] ?? $api_result['result']['utr'] ?? '';
    
    if ($payment_status === 'SUCCESS' || $payment_status === 'COMPLETED') {
        // Update transaction to SUCCESS
        $stmt2 = $conn->prepare("UPDATE transactions SET status = 'SUCCESS', utr = ? WHERE order_id = ? AND status = 'PENDING'");
        $stmt2->bind_param("ss", $utr, $order_id);
        $stmt2->execute();
        
        if ($stmt2->affected_rows > 0) {
            // Add balance to user
            $mobile = $transaction['mobile'];
            $amount = floatval($transaction['amount']);
            
            $stmt3 = $conn->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE mobile = ?");
            $stmt3->bind_param("ds", $amount, $mobile);
            $stmt3->execute();
            
            if ($stmt3->affected_rows === 0) {
                // Create user if doesn't exist
                $stmt4 = $conn->prepare("INSERT INTO users (mobile, wallet_balance, created_at) VALUES (?, ?, NOW())");
                $stmt4->bind_param("sd", $mobile, $amount);
                $stmt4->execute();
            }
            
            echo json_encode([
                'status' => true, 
                'message' => 'Payment verified & balance added!',
                'payment_status' => 'SUCCESS',
                'amount' => $amount
            ]);
        } else {
            echo json_encode(['status' => false, 'message' => 'Already processed']);
        }
    } else {
        echo json_encode([
            'status' => true, 
            'message' => 'Payment not completed yet',
            'payment_status' => $payment_status,
            'api_response' => $api_result
        ]);
    }
    
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode(['status' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
