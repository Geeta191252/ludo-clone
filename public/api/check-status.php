<?php
// Auto-verify payment from Pay0 API and update balance
require_once 'config.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$order_id = trim($input['order_id'] ?? $_GET['order_id'] ?? '');

if (empty($order_id)) {
    echo json_encode(['status' => false, 'message' => 'Order ID required']);
    exit;
}

try {
    $conn = getDBConnection();
    
    // First check if transaction exists in our database
    $stmt = $conn->prepare("SELECT * FROM transactions WHERE order_id = ? LIMIT 1");
    $stmt->bind_param("s", $order_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $transaction = $result->fetch_assoc();
    
    if (!$transaction) {
        echo json_encode(['status' => false, 'message' => 'Transaction not found']);
        exit;
    }
    
    // If already processed, return current status
    if ($transaction['status'] === 'SUCCESS') {
        echo json_encode([
            'status' => true,
            'txnStatus' => 'SUCCESS',
            'amount' => $transaction['amount'],
            'order_id' => $order_id,
            'message' => 'Payment already processed'
        ]);
        exit;
    }
    
    if ($transaction['status'] === 'FAILED') {
        echo json_encode([
            'status' => true,
            'txnStatus' => 'FAILED',
            'amount' => $transaction['amount'],
            'order_id' => $order_id,
            'message' => 'Payment failed'
        ]);
        exit;
    }
    
    // If PENDING, check from Pay0 API
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
        echo json_encode(['status' => false, 'message' => 'API error: ' . $error, 'txnStatus' => 'PENDING']);
        exit;
    }
    
    $api_result = json_decode($response, true);
    
    if (!$api_result || $api_result['status'] !== true) {
        // API call failed, return pending
        echo json_encode([
            'status' => true,
            'txnStatus' => 'PENDING',
            'amount' => $transaction['amount'],
            'order_id' => $order_id
        ]);
        exit;
    }
    
    $pay0_status = strtoupper($api_result['result']['txnStatus'] ?? '');
    $utr = $api_result['result']['utr'] ?? '';
    $amount = floatval($transaction['amount']);
    $mobile = $transaction['mobile'];
    
    // If Pay0 says SUCCESS, update our database and add balance
    if ($pay0_status === 'SUCCESS' || $pay0_status === 'COMPLETED') {
        
        // Update transaction to SUCCESS
        $stmt2 = $conn->prepare("UPDATE transactions SET status = 'SUCCESS', utr = ? WHERE order_id = ? AND status = 'PENDING'");
        $stmt2->bind_param("ss", $utr, $order_id);
        $stmt2->execute();
        
        if ($stmt2->affected_rows > 0) {
            // Add balance to user wallet
            $stmt3 = $conn->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE mobile = ?");
            $stmt3->bind_param("ds", $amount, $mobile);
            $stmt3->execute();
            
            if ($stmt3->affected_rows === 0) {
                // User doesn't exist, create new user
                $stmt4 = $conn->prepare("INSERT INTO users (mobile, wallet_balance, created_at) VALUES (?, ?, NOW())");
                $stmt4->bind_param("sd", $mobile, $amount);
                $stmt4->execute();
            }
            
            echo json_encode([
                'status' => true,
                'txnStatus' => 'SUCCESS',
                'amount' => $amount,
                'order_id' => $order_id,
                'message' => 'Payment successful! Balance added.'
            ]);
        } else {
            // Already processed by another request
            echo json_encode([
                'status' => true,
                'txnStatus' => 'SUCCESS',
                'amount' => $amount,
                'order_id' => $order_id,
                'message' => 'Payment already processed'
            ]);
        }
        
    } elseif ($pay0_status === 'FAILED' || $pay0_status === 'EXPIRED') {
        
        // Update transaction to FAILED
        $stmt2 = $conn->prepare("UPDATE transactions SET status = 'FAILED' WHERE order_id = ? AND status = 'PENDING'");
        $stmt2->bind_param("s", $order_id);
        $stmt2->execute();
        
        echo json_encode([
            'status' => true,
            'txnStatus' => 'FAILED',
            'amount' => $amount,
            'order_id' => $order_id,
            'message' => 'Payment failed or expired'
        ]);
        
    } else {
        // Still pending
        echo json_encode([
            'status' => true,
            'txnStatus' => 'PENDING',
            'amount' => $amount,
            'order_id' => $order_id
        ]);
    }
    
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode(['status' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
