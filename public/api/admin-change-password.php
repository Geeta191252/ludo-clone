<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

$admin = requireAdmin();
$input = json_decode(file_get_contents('php://input'), true);

$current_password = $input['current_password'] ?? '';
$new_password = $input['new_password'] ?? '';

if (empty($current_password) || empty($new_password)) {
    echo json_encode(['status' => false, 'message' => 'All fields required']);
    exit;
}

if (strlen($new_password) < 6) {
    echo json_encode(['status' => false, 'message' => 'Password must be at least 6 characters']);
    exit;
}

$conn = getDBConnection();

// Verify current password
$stmt = $conn->prepare("SELECT password FROM admins WHERE id = ?");
$stmt->bind_param("i", $admin['id']);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!password_verify($current_password, $row['password'])) {
    echo json_encode(['status' => false, 'message' => 'Current password is incorrect']);
    exit;
}

// Update password
$new_hash = password_hash($new_password, PASSWORD_DEFAULT);
$stmt = $conn->prepare("UPDATE admins SET password = ? WHERE id = ?");
$stmt->bind_param("si", $new_hash, $admin['id']);
$stmt->execute();

// Invalidate all tokens
$stmt = $conn->prepare("DELETE FROM admin_tokens WHERE admin_id = ?");
$stmt->bind_param("i", $admin['id']);
$stmt->execute();

echo json_encode(['status' => true, 'message' => 'Password changed successfully']);
$conn->close();
?>
