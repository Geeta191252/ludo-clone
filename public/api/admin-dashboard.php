<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

try {
    $admin = requireAdmin();
    $conn = getDBConnection();
    
    if (!$conn) {
        echo json_encode(['status' => false, 'message' => 'Database connection failed']);
        exit;
    }

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
    if ($result) {
        $stats['total_users'] = (int)($result->fetch_assoc()['count'] ?? 0);
    }

    // Total deposits
    $result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'DEPOSIT' AND status = 'SUCCESS'");
    if ($result) {
        $stats['total_deposits'] = floatval($result->fetch_assoc()['total'] ?? 0);
    }

    // Total withdrawals
    $result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'WITHDRAWAL' AND status = 'SUCCESS'");
    if ($result) {
        $stats['total_withdrawals'] = floatval($result->fetch_assoc()['total'] ?? 0);
    }

    // Today's deposits
    $result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'DEPOSIT' AND status = 'SUCCESS' AND DATE(created_at) = CURDATE()");
    if ($result) {
        $stats['today_deposits'] = floatval($result->fetch_assoc()['total'] ?? 0);
    }

    // Today's withdrawals
    $result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'WITHDRAWAL' AND status = 'SUCCESS' AND DATE(created_at) = CURDATE()");
    if ($result) {
        $stats['today_withdrawals'] = floatval($result->fetch_assoc()['total'] ?? 0);
    }

    // Pending withdrawals
    $result = $conn->query("SELECT COUNT(*) as count FROM transactions WHERE type = 'WITHDRAWAL' AND status = 'PENDING'");
    if ($result) {
        $stats['pending_withdrawals'] = (int)($result->fetch_assoc()['count'] ?? 0);
    }

    // Active games
    $result = $conn->query("SELECT COUNT(*) as count FROM games WHERE enabled = 1");
    if ($result) {
        $stats['active_games'] = (int)($result->fetch_assoc()['count'] ?? 5);
    }

    // Recent transactions with user mobile
    $transactions = [];
    $result = $conn->query("SELECT t.*, u.mobile FROM transactions t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC LIMIT 10");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $transactions[] = $row;
        }
    }

    echo json_encode([
        'status' => true,
        'stats' => $stats,
        'recent_transactions' => $transactions
    ]);

    $conn->close();
} catch (Exception $e) {
    echo json_encode(['status' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
