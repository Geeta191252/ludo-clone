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
        'active_games' => 0,
        'today_deposits' => 0,
        'today_withdrawals' => 0,
        'pending_withdrawals' => 0
    ];

    // Check if users table exists and get count
    $tableCheck = $conn->query("SHOW TABLES LIKE 'users'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        $result = $conn->query("SELECT COUNT(*) as count FROM users");
        if ($result && $row = $result->fetch_assoc()) {
            $stats['total_users'] = (int)($row['count'] ?? 0);
        }
    }

    // Check if transactions table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'transactions'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        // Total deposits
        $result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'DEPOSIT' AND status = 'SUCCESS'");
        if ($result && $row = $result->fetch_assoc()) {
            $stats['total_deposits'] = floatval($row['total'] ?? 0);
        }

        // Total withdrawals
        $result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'WITHDRAWAL' AND status = 'SUCCESS'");
        if ($result && $row = $result->fetch_assoc()) {
            $stats['total_withdrawals'] = floatval($row['total'] ?? 0);
        }

        // Today's deposits
        $result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'DEPOSIT' AND status = 'SUCCESS' AND DATE(created_at) = CURDATE()");
        if ($result && $row = $result->fetch_assoc()) {
            $stats['today_deposits'] = floatval($row['total'] ?? 0);
        }

        // Today's withdrawals
        $result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'WITHDRAWAL' AND status = 'SUCCESS' AND DATE(created_at) = CURDATE()");
        if ($result && $row = $result->fetch_assoc()) {
            $stats['today_withdrawals'] = floatval($row['total'] ?? 0);
        }

        // Pending withdrawals
        $result = $conn->query("SELECT COUNT(*) as count FROM transactions WHERE type = 'WITHDRAWAL' AND status = 'PENDING'");
        if ($result && $row = $result->fetch_assoc()) {
            $stats['pending_withdrawals'] = (int)($row['count'] ?? 0);
        }
    }

    // Check if games table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'games'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        // Try with enabled column first, fallback to status
        $result = $conn->query("SELECT COUNT(*) as count FROM games WHERE enabled = 1");
        if (!$result) {
            $result = $conn->query("SELECT COUNT(*) as count FROM games WHERE status = 'active'");
        }
        if (!$result) {
            $result = $conn->query("SELECT COUNT(*) as count FROM games");
        }
        if ($result && $row = $result->fetch_assoc()) {
            $stats['active_games'] = (int)($row['count'] ?? 0);
        }
    }

    // Recent transactions with user mobile
    $transactions = [];
    $tableCheck = $conn->query("SHOW TABLES LIKE 'transactions'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        // Check if user_id column exists
        $result = $conn->query("SELECT t.*, COALESCE(u.mobile, t.mobile) as user_mobile FROM transactions t LEFT JOIN users u ON t.mobile = u.mobile ORDER BY t.created_at DESC LIMIT 10");
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $transactions[] = $row;
            }
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
