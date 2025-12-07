<?php
// CORS headers - MUST be first before any other code
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';
require_once 'admin-auth.php';

$admin = requireAdmin();
$input = json_decode(file_get_contents('php://input'), true);

$transaction_id = intval($input['transaction_id'] ?? 0);
$status = $input['status'] ?? '';

if ($transaction_id <= 0 || !in_array($status, ['SUCCESS', 'FAILED'])) {
    echo json_encode(['status' => false, 'message' => 'Invalid parameters']);
    exit;
}

$conn = getDBConnection();

// Get transaction details
$stmt = $conn->prepare("SELECT * FROM transactions WHERE id = ? AND status = 'PENDING'");
$stmt->bind_param("i", $transaction_id);
$stmt->execute();
$result = $stmt->get_result();

if (!$tx = $result->fetch_assoc()) {
    echo json_encode(['status' => false, 'message' => 'Transaction not found or already processed']);
    exit;
}

// Update transaction status
$stmt = $conn->prepare("UPDATE transactions SET status = ?, updated_at = NOW() WHERE id = ?");
$stmt->bind_param("si", $status, $transaction_id);
$stmt->execute();

// If deposit approved, add to wallet balance
if ($tx['type'] === 'DEPOSIT' && $status === 'SUCCESS') {
    $stmt = $conn->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE mobile = ?");
    $stmt->bind_param("ds", $tx['amount'], $tx['mobile']);
    $stmt->execute();
}

// For WITHDRAWAL: balance was already deducted when request was made
// If SUCCESS - nothing to do, balance already deducted
// If FAILED - refund the balance
if ($tx['type'] === 'WITHDRAWAL' && $status === 'FAILED') {
    $stmt = $conn->prepare("UPDATE users SET winning_balance = winning_balance + ? WHERE mobile = ?");
    $stmt->bind_param("ds", $tx['amount'], $tx['mobile']);
    $stmt->execute();
}

echo json_encode(['status' => true, 'message' => 'Transaction updated']);
$conn->close();
?>
