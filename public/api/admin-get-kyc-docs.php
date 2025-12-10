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

    $user_id = $_GET['user_id'] ?? null;

    if (!$user_id) {
        echo json_encode(['status' => false, 'message' => 'User ID is required']);
        exit;
    }

    // Check if table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'kyc_documents'");
    if ($tableCheck->num_rows == 0) {
        echo json_encode(['status' => false, 'message' => 'No KYC documents found']);
        exit;
    }

    // Get user mobile first
    $userStmt = $conn->prepare("SELECT mobile FROM users WHERE id = ?");
    $userStmt->bind_param("i", $user_id);
    $userStmt->execute();
    $userResult = $userStmt->get_result();
    $user = $userResult->fetch_assoc();
    
    if (!$user) {
        echo json_encode(['status' => false, 'message' => 'User not found']);
        exit;
    }

    // Get KYC documents
    $stmt = $conn->prepare("SELECT * FROM kyc_documents WHERE mobile = ? ORDER BY created_at DESC LIMIT 1");
    $stmt->bind_param("s", $user['mobile']);
    $stmt->execute();
    $result = $stmt->get_result();
    $kyc = $result->fetch_assoc();

    if ($kyc) {
        echo json_encode(['status' => true, 'kyc' => $kyc]);
    } else {
        echo json_encode(['status' => false, 'message' => 'No KYC documents found for this user']);
    }
    
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['status' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
