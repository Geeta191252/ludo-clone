<?php
require_once 'config.php';
header('Content-Type: application/json');

try {
    $mobile = $_GET['mobile'] ?? null;

    if (!$mobile) {
        echo json_encode(['status' => false, 'message' => 'Mobile number is required']);
        exit;
    }

    $conn = getDBConnection();
    
    if (!$conn) {
        echo json_encode(['status' => false, 'message' => 'Database connection failed']);
        exit;
    }

    // Check if kyc_status column exists
    $columnCheck = $conn->query("SHOW COLUMNS FROM users LIKE 'kyc_status'");
    if ($columnCheck->num_rows == 0) {
        echo json_encode(['status' => true, 'kyc_status' => 'pending']);
        $conn->close();
        exit;
    }

    $stmt = $conn->prepare("SELECT kyc_status FROM users WHERE mobile = ?");
    $stmt->bind_param("s", $mobile);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        echo json_encode(['status' => true, 'kyc_status' => $row['kyc_status'] ?? 'pending']);
    } else {
        echo json_encode(['status' => false, 'message' => 'User not found']);
    }
    
    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['status' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
