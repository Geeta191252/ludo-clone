<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

try {
    $admin = requireAdmin();
    $conn = getDBConnection();
    
    if (!$conn) {
        echo json_encode(['status' => false, 'message' => 'Database connection failed', 'users' => []]);
        exit;
    }

    $users = [];
    
    // Check if users table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'users'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        // Check if kyc_status column exists
        $kycColumnCheck = $conn->query("SHOW COLUMNS FROM users LIKE 'kyc_status'");
        $hasKycColumn = $kycColumnCheck && $kycColumnCheck->num_rows > 0;
        
        if ($hasKycColumn) {
            $result = $conn->query("SELECT id, mobile, COALESCE(player_name, name) as player_name, wallet_balance, winning_balance, COALESCE(status, 'active') as status, COALESCE(kyc_status, 'pending') as kyc_status, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at FROM users ORDER BY id DESC");
        } else {
            $result = $conn->query("SELECT id, mobile, COALESCE(player_name, name) as player_name, wallet_balance, winning_balance, COALESCE(status, 'active') as status, 'pending' as kyc_status, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at FROM users ORDER BY id DESC");
        }
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $row['wallet_balance'] = floatval($row['wallet_balance']);
                $row['winning_balance'] = floatval($row['winning_balance'] ?? 0);
                $users[] = $row;
            }
        }
    }

    echo json_encode(['status' => true, 'users' => $users]);
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['status' => false, 'message' => 'Error: ' . $e->getMessage(), 'users' => []]);
}
?>
