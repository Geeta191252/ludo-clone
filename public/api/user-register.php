<?php
// CORS Headers - MUST be first
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';
$data = json_decode(file_get_contents('php://input'), true);

$mobile = $data['mobile'] ?? '';
$name = $data['name'] ?? 'Player';
$password = $data['password'] ?? '';

// Validation
if (empty($mobile) || strlen($mobile) !== 10) {
    echo json_encode(['status' => false, 'message' => 'Valid 10-digit mobile number required']);
    exit;
}

if (empty($password) || strlen($password) < 4) {
    echo json_encode(['status' => false, 'message' => 'Password must be at least 4 characters']);
    exit;
}

$conn = getDBConnection();

// Check if user already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE mobile = ?");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(['status' => false, 'message' => 'Mobile number already registered']);
    $conn->close();
    exit;
}

// Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insert new user
$stmt = $conn->prepare("INSERT INTO users (mobile, name, password, wallet_balance, winning_balance) VALUES (?, ?, ?, 0, 0)");
$stmt->bind_param("sss", $mobile, $name, $hashedPassword);

if ($stmt->execute()) {
    $userId = $conn->insert_id;
    
    // Generate simple token
    $token = bin2hex(random_bytes(32));
    
    echo json_encode([
        'status' => true,
        'message' => 'Registration successful',
        'user' => [
            'id' => $userId,
            'mobile' => $mobile,
            'name' => $name,
            'wallet_balance' => 0,
            'winning_balance' => 0
        ],
        'token' => $token
    ]);
} else {
    echo json_encode(['status' => false, 'message' => 'Registration failed']);
}

$conn->close();
?>
