<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

$admin = requireAdmin();
$input = json_decode(file_get_contents('php://input'), true);

$user_id = intval($input['user_id'] ?? 0);
$amount = floatval($input['amount'] ?? 0);
$type = $input['type'] ?? '';

if ($user_id <= 0 || $amount <= 0 || !in_array($type, ['add', 'subtract'])) {
    echo json_encode(['status' => false, 'message' => 'Invalid parameters']);
    exit;
}

$conn = getDBConnection();

// Check user exists
$stmt = $conn->prepare("SELECT wallet_balance FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if (!$row = $result->fetch_assoc()) {
    echo json_encode(['status' => false, 'message' => 'User not found']);
    exit;
}

$current_balance = floatval($row['wallet_balance']);

if ($type === 'subtract' && $amount > $current_balance) {
    echo json_encode(['status' => false, 'message' => 'Insufficient balance']);
    exit;
}

// Update balance
if ($type === 'add') {
    $stmt = $conn->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?");
} else {
    $stmt = $conn->prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?");
}
$stmt->bind_param("di", $amount, $user_id);
$stmt->execute();

// Log the action
$action = $type === 'add' ? 'ADMIN_ADD' : 'ADMIN_SUBTRACT';
$stmt = $conn->prepare("INSERT INTO admin_logs (admin_id, action, details, created_at) VALUES (?, ?, ?, NOW())");
$details = json_encode(['user_id' => $user_id, 'amount' => $amount, 'type' => $type]);
$stmt->bind_param("iss", $admin['id'], $action, $details);
$stmt->execute();

echo json_encode(['status' => true, 'message' => 'Balance updated successfully']);
$conn->close();
?>
