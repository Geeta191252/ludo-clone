<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

$admin = requireAdmin();
$conn = getDBConnection();

// Get stats
$stats = [
    'total_users' => 0,
    'total_deposits' => 0,
    'total_withdrawals' => 0,
    'active_games' => 5,
    'today_deposits' => 0,
    'today_withdrawals' => 0,
    'pending_withdrawals' => 0
];

// Total users
$result = $conn->query("SELECT COUNT(*) as count FROM users");
$stats['total_users'] = $result->fetch_assoc()['count'] ?? 0;

// Total deposits
$result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'DEPOSIT' AND status = 'SUCCESS'");
$stats['total_deposits'] = floatval($result->fetch_assoc()['total'] ?? 0);

// Total withdrawals
$result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'WITHDRAWAL' AND status = 'SUCCESS'");
$stats['total_withdrawals'] = floatval($result->fetch_assoc()['total'] ?? 0);

// Today's deposits
$result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'DEPOSIT' AND status = 'SUCCESS' AND DATE(created_at) = CURDATE()");
$stats['today_deposits'] = floatval($result->fetch_assoc()['total'] ?? 0);

// Today's withdrawals
$result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'WITHDRAWAL' AND status = 'SUCCESS' AND DATE(created_at) = CURDATE()");
$stats['today_withdrawals'] = floatval($result->fetch_assoc()['total'] ?? 0);

// Pending withdrawals
$result = $conn->query("SELECT COUNT(*) as count FROM transactions WHERE type = 'WITHDRAWAL' AND status = 'PENDING'");
$stats['pending_withdrawals'] = $result->fetch_assoc()['count'] ?? 0;

// Active games
$result = $conn->query("SELECT COUNT(*) as count FROM games WHERE enabled = 1");
if ($result) {
    $stats['active_games'] = $result->fetch_assoc()['count'] ?? 5;
}

// Recent transactions
$transactions = [];
$result = $conn->query("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10");
while ($row = $result->fetch_assoc()) {
    $transactions[] = $row;
}

echo json_encode([
    'status' => true,
    'stats' => $stats,
    'recent_transactions' => $transactions
]);

$conn->close();
?>
