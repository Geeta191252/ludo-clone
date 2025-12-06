<?php
require_once 'config.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$order_id = $input['order_id'] ?? $_GET['order_id'] ?? '';

if (empty($order_id)) {
    echo json_encode(['status' => false, 'message' => 'Order ID required']);
    exit;
}

// Check status from Pay0.shop API
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

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);

if ($result && $result['status'] === true) {
    echo json_encode([
        'status' => true,
        'txnStatus' => $result['result']['txnStatus'],
        'amount' => $result['result']['amount'],
        'order_id' => $result['result']['orderId']
    ]);
} else {
    echo json_encode([
        'status' => false,
        'message' => $result['message'] ?? 'Status check failed'
    ]);
}
?>
