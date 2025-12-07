<?php
// Load config first (it sets headers)
require_once 'config.php';
require_once 'admin-auth.php';

// Set JSON content type
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

try {
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
    if (!$stmt) {
        echo json_encode(['status' => false, 'message' => 'DB prepare error: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("i", $transaction_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if (!$tx = $result->fetch_assoc()) {
        echo json_encode(['status' => false, 'message' => 'Transaction not found or already processed']);
        $conn->close();
        exit;
    }
    
    // Update transaction status
    $stmt = $conn->prepare("UPDATE transactions SET status = ? WHERE id = ?");
    if (!$stmt) {
        echo json_encode(['status' => false, 'message' => 'DB prepare error: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("si", $status, $transaction_id);
    $stmt->execute();
    
    // If deposit approved, add to wallet balance
    if ($tx['type'] === 'DEPOSIT' && $status === 'SUCCESS') {
        $stmt = $conn->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE mobile = ?");
        if ($stmt) {
            $stmt->bind_param("ds", $tx['amount'], $tx['mobile']);
            $stmt->execute();
        }
    }
    
    // For WITHDRAWAL: balance was already deducted when request was made
    // If FAILED - refund the balance
    if ($tx['type'] === 'WITHDRAWAL' && $status === 'FAILED') {
        $stmt = $conn->prepare("UPDATE users SET winning_balance = winning_balance + ? WHERE mobile = ?");
        if ($stmt) {
            $stmt->bind_param("ds", $tx['amount'], $tx['mobile']);
            $stmt->execute();
        }
    }
    
    echo json_encode(['status' => true, 'message' => 'Transaction updated successfully']);
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode(['status' => false, 'message' => 'Server exception: ' . $e->getMessage()]);
}
?>
