<?php
require_once 'config.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

$mobile = $data['mobile'] ?? '';
$password = $data['password'] ?? '';

// Validation
if (empty($mobile) || strlen($mobile) !== 10) {
    echo json_encode(['status' => false, 'message' => 'Valid 10-digit mobile number required']);
    exit;
}

if (empty($password)) {
    echo json_encode(['status' => false, 'message' => 'Password required']);
    exit;
}

$conn = getDBConnection();

// Get user
$stmt = $conn->prepare("SELECT id, mobile, name, password, wallet_balance, winning_balance FROM users WHERE mobile = ?");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    // Verify password
    if (password_verify($password, $row['password'])) {
        // Generate token
        $token = bin2hex(random_bytes(32));
        
        echo json_encode([
            'status' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $row['id'],
                'mobile' => $row['mobile'],
                'name' => $row['name'],
                'wallet_balance' => floatval($row['wallet_balance']),
                'winning_balance' => floatval($row['winning_balance'])
            ],
            'token' => $token
        ]);
    } else {
        echo json_encode(['status' => false, 'message' => 'Invalid password']);
    }
} else {
    echo json_encode(['status' => false, 'message' => 'Mobile number not registered']);
}

$conn->close();
?>
