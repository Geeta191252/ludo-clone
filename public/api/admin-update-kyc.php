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

    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = $data['user_id'] ?? null;
    $kyc_status = $data['kyc_status'] ?? 'accepted';

    if (!$user_id) {
        echo json_encode(['status' => false, 'message' => 'User ID is required']);
        exit;
    }

    // Check if kyc_status column exists, if not add it
    $columnCheck = $conn->query("SHOW COLUMNS FROM users LIKE 'kyc_status'");
    if ($columnCheck->num_rows == 0) {
        $conn->query("ALTER TABLE users ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'pending'");
    }

    // Update KYC status
    $stmt = $conn->prepare("UPDATE users SET kyc_status = ? WHERE id = ?");
    $stmt->bind_param("si", $kyc_status, $user_id);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => true, 'message' => 'KYC status updated successfully']);
    } else {
        echo json_encode(['status' => false, 'message' => 'Failed to update KYC status']);
    }
    
    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['status' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
