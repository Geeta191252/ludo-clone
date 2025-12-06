<?php
require_once 'config.php';

function verifyAdminToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
        return false;
    }
    
    $token = substr($authHeader, 7);
    $conn = getDBConnection();
    
    $stmt = $conn->prepare("
        SELECT a.id, a.username, a.name 
        FROM admin_tokens t 
        JOIN admins a ON t.admin_id = a.id 
        WHERE t.token = ? AND t.expires_at > NOW() AND a.status = 'active'
    ");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $conn->close();
        return $row;
    }
    
    $conn->close();
    return false;
}

function requireAdmin() {
    $admin = verifyAdminToken();
    if (!$admin) {
        http_response_code(401);
        echo json_encode(['status' => false, 'message' => 'Unauthorized']);
        exit;
    }
    return $admin;
}
?>
