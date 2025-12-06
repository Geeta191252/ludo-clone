<?php
require_once 'config.php';
header('Content-Type: application/json');

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['status' => false, 'message' => 'Invalid request']);
    exit;
}

$amount = floatval($input['amount'] ?? 0);
$mobile = $input['mobile'] ?? '';
$name = $input['name'] ?? 'Customer';

// Validation
if ($amount < 10) {
    echo json_encode(['status' => false, 'message' => 'Minimum amount is ₹10']);
    exit;
}

if (empty($mobile) || strlen($mobile) < 10) {
    echo json_encode(['status' => false, 'message' => 'Valid mobile number required']);
    exit;
}

// Generate unique order ID
$order_id = 'ORD' . time() . rand(1000, 9999);

// Create order with Pay0.shop
$post_data = [
    'customer_mobile' => $mobile,
    'customer_name' => $name,
    'user_token' => PAY0_API_KEY,
    'amount' => $amount,
    'order_id' => $order_id,
    'redirect_url' => SITE_URL . '/payment-success.html?order_id=' . $order_id,
    'callback_url' => SITE_URL . '/api/callback.php',
    'remark1' => 'wallet_recharge',
    'remark2' => $mobile
];

$ch = curl_init(PAY0_API_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded'
]);

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo json_encode(['status' => false, 'message' => 'Payment gateway error: ' . $error]);
    exit;
}

$result = json_decode($response, true);

if ($result && $result['status'] === true) {
    // Save pending transaction to database
    $conn = getDBConnection();
    $stmt = $conn->prepare("INSERT INTO transactions (order_id, mobile, amount, status, created_at) VALUES (?, ?, ?, 'PENDING', NOW())");
    $stmt->bind_param("ssd", $order_id, $mobile, $amount);
    $stmt->execute();
    $conn->close();
    
    echo json_encode([
        'status' => true,
        'message' => 'Order created',
        'payment_url' => $result['result']['payment_url'],
        'order_id' => $order_id
    ]);
} else {
    echo json_encode([
        'status' => false,
        'message' => $result['message'] ?? 'Failed to create order'
    ]);
}
?>
