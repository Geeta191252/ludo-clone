<?php
require_once 'config.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(['status' => false, 'message' => 'Username and password required']);
    exit;
}

$conn = getDBConnection();

$stmt = $conn->prepare("SELECT id, username, password, name FROM admins WHERE username = ? AND status = 'active'");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    if (password_verify($password, $row['password'])) {
        // Generate token
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        // Save token
        $stmt = $conn->prepare("INSERT INTO admin_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $row['id'], $token, $expires);
        $stmt->execute();
        
        // Update last login
        $stmt = $conn->prepare("UPDATE admins SET last_login = NOW() WHERE id = ?");
        $stmt->bind_param("i", $row['id']);
        $stmt->execute();
        
        echo json_encode([
            'status' => true,
            'token' => $token,
            'admin' => [
                'id' => $row['id'],
                'username' => $row['username'],
                'name' => $row['name']
            ]
        ]);
    } else {
        echo json_encode(['status' => false, 'message' => 'Invalid password']);
    }
} else {
    echo json_encode(['status' => false, 'message' => 'Admin not found']);
}

$conn->close();
?>
