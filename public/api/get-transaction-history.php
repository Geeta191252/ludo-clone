<?php
require_once 'config.php';
header('Content-Type: application/json');

$mobile = $_GET['mobile'] ?? '';
$type = $_GET['type'] ?? ''; // deposit, game, penalty, bonus, withdrawal

if (empty($mobile)) {
    echo json_encode(['status' => false, 'message' => 'Mobile number required']);
    exit;
}

$conn = getDBConnection();

$transactions = [];

if ($type === 'deposit') {
    // Get deposit transactions
    $stmt = $conn->prepare("SELECT order_id, amount, status, utr, created_at FROM transactions WHERE mobile = ? AND type = 'deposit' ORDER BY created_at DESC LIMIT 50");
    $stmt->bind_param("s", $mobile);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $transactions[] = [
            'id' => $row['order_id'],
            'amount' => floatval($row['amount']),
            'status' => $row['status'],
            'utr' => $row['utr'] ?? '',
            'date' => date('M d g:i A', strtotime($row['created_at'])),
            'type' => 'Deposit'
        ];
    }
} elseif ($type === 'withdrawal') {
    // Get withdrawal transactions
    $stmt = $conn->prepare("SELECT order_id, amount, status, upi_id, created_at FROM transactions WHERE mobile = ? AND type = 'withdrawal' ORDER BY created_at DESC LIMIT 50");
    $stmt->bind_param("s", $mobile);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $transactions[] = [
            'id' => $row['order_id'],
            'amount' => floatval($row['amount']),
            'status' => strtolower($row['status']) === 'success' ? 'approved' : strtolower($row['status']),
            'payment' => $row['upi_id'] ?? 'ACCOUNT',
            'date' => date('M d g:i A', strtotime($row['created_at'])),
            'type' => 'Withdrawal'
        ];
    }
} elseif ($type === 'game') {
    // Get game transactions
    $stmt = $conn->prepare("SELECT order_id, amount, status, created_at FROM transactions WHERE mobile = ? AND type = 'game' ORDER BY created_at DESC LIMIT 50");
    $stmt->bind_param("s", $mobile);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $transactions[] = [
            'id' => $row['order_id'],
            'amount' => floatval($row['amount']),
            'status' => $row['status'],
            'date' => date('M d g:i A', strtotime($row['created_at'])),
            'type' => 'Game'
        ];
    }
} elseif ($type === 'penalty') {
    // Get penalty transactions
    $stmt = $conn->prepare("SELECT order_id, amount, status, created_at FROM transactions WHERE mobile = ? AND type = 'penalty' ORDER BY created_at DESC LIMIT 50");
    $stmt->bind_param("s", $mobile);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $transactions[] = [
            'id' => $row['order_id'],
            'amount' => floatval($row['amount']),
            'status' => $row['status'],
            'date' => date('M d g:i A', strtotime($row['created_at'])),
            'type' => 'Penalty'
        ];
    }
} elseif ($type === 'bonus') {
    // Get bonus transactions
    $stmt = $conn->prepare("SELECT order_id, amount, status, created_at FROM transactions WHERE mobile = ? AND type = 'bonus' ORDER BY created_at DESC LIMIT 50");
    $stmt->bind_param("s", $mobile);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $transactions[] = [
            'id' => $row['order_id'],
            'amount' => floatval($row['amount']),
            'status' => $row['status'],
            'date' => date('M d g:i A', strtotime($row['created_at'])),
            'type' => 'Bonus'
        ];
    }
}

echo json_encode([
    'status' => true,
    'transactions' => $transactions
]);

$conn->close();
?>
