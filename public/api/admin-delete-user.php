<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

$admin = requireAdmin();
$input = json_decode(file_get_contents('php://input'), true);

$user_id = intval($input['user_id'] ?? 0);

if ($user_id <= 0) {
    echo json_encode(['status' => false, 'message' => 'Invalid user ID']);
    exit;
}

$conn = getDBConnection();

// Delete user
$stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    // Log the action
    $stmt = $conn->prepare("INSERT INTO admin_logs (admin_id, action, details, created_at) VALUES (?, 'DELETE_USER', ?, NOW())");
    $details = json_encode(['user_id' => $user_id]);
    $stmt->bind_param("is", $admin['id'], $details);
    $stmt->execute();
    
    echo json_encode(['status' => true, 'message' => 'User deleted successfully']);
} else {
    echo json_encode(['status' => false, 'message' => 'User not found']);
}

$conn->close();
?>
