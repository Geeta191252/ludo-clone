<?php
require_once 'config.php';
header('Content-Type: application/json');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        echo json_encode(['status' => false, 'message' => 'Username and password required']);
        exit;
    }
    
    $conn = getDBConnection();
    
    if (!$conn) {
        echo json_encode(['status' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    // Check if admin exists
    $stmt = $conn->prepare("SELECT id, username, password, name FROM admins WHERE username = ? AND status = 'active'");
    if (!$stmt) {
        echo json_encode(['status' => false, 'message' => 'Query prepare failed: ' . $conn->error]);
        exit;
    }
    
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        if (password_verify($password, $row['password'])) {
            // Generate token
            $token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
            
            // Check if admin_tokens table exists, if not create it
            $tableCheck = $conn->query("SHOW TABLES LIKE 'admin_tokens'");
            if ($tableCheck->num_rows == 0) {
                $conn->query("CREATE TABLE admin_tokens (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    admin_id INT NOT NULL,
                    token VARCHAR(255) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )");
            }
            
            // Save token
            $stmt = $conn->prepare("INSERT INTO admin_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)");
            if ($stmt) {
                $stmt->bind_param("iss", $row['id'], $token, $expires);
                $stmt->execute();
            }
            
            // Try to update last login (ignore if column doesn't exist)
            $conn->query("UPDATE admins SET last_login = NOW() WHERE id = " . intval($row['id']));
            
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
        echo json_encode(['status' => false, 'message' => 'Admin not found or inactive']);
    }
    
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['status' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
