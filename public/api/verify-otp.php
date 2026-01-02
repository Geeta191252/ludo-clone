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

$mobileRaw = $data['mobile'] ?? '';
$otpRaw = $data['otp'] ?? '';

$mobile = preg_replace('/\D/', '', trim($mobileRaw));
$otp = preg_replace('/\D/', '', trim($otpRaw));

// Validation
if (empty($mobile) || strlen($mobile) !== 10) {
    echo json_encode(['status' => false, 'message' => 'Valid 10-digit mobile number required']);
    exit;
}

if (empty($otp) || strlen($otp) !== 6) {
    echo json_encode(['status' => false, 'message' => 'Valid 6-digit OTP required']);
    exit;
}

$conn = getDBConnection();

// Fetch latest OTP for this mobile (uses DB time for expiry check)
$stmt = $conn->prepare("SELECT id, otp, verified, (expires_at > NOW()) AS is_valid_time FROM otp_requests WHERE mobile = ? ORDER BY id DESC LIMIT 1");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['status' => false, 'message' => 'OTP not found. Please resend OTP']);
    exit;
}

$row = $result->fetch_assoc();

if (intval($row['verified']) === 1) {
    echo json_encode(['status' => false, 'message' => 'OTP already used. Please resend OTP']);
    exit;
}

if (intval($row['is_valid_time']) !== 1) {
    echo json_encode(['status' => false, 'message' => 'OTP expired. Please resend OTP']);
    exit;
}

if (trim((string)$row['otp']) !== $otp) {
    echo json_encode(['status' => false, 'message' => 'Invalid OTP']);
    exit;
}

// Mark OTP as verified
$otpId = intval($row['id']);
$stmt = $conn->prepare("UPDATE otp_requests SET verified = 1 WHERE id = ?");
$stmt->bind_param("i", $otpId);
$stmt->execute();

// Check if user exists
$stmt = $conn->prepare("SELECT id, mobile, name, wallet_balance, winning_balance FROM users WHERE mobile = ?");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$userResult = $stmt->get_result();

if ($userResult->num_rows > 0) {
    // Existing user - login
    $user = $userResult->fetch_assoc();
    $token = bin2hex(random_bytes(32));
    
    echo json_encode([
        'status' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'mobile' => $user['mobile'],
            'name' => $user['name'],
            'wallet_balance' => floatval($user['wallet_balance']),
            'winning_balance' => floatval($user['winning_balance'] ?? 0)
        ],
        'token' => $token
    ]);
} else {
    // New user - register automatically
    $defaultName = 'Player' . substr($mobile, -4);
    
    $stmt = $conn->prepare("INSERT INTO users (mobile, name, password, wallet_balance, winning_balance) VALUES (?, ?, '', 0, 0)");
    $stmt->bind_param("ss", $mobile, $defaultName);
    
    if ($stmt->execute()) {
        $userId = $conn->insert_id;
        $token = bin2hex(random_bytes(32));
        
        echo json_encode([
            'status' => true,
            'message' => 'Registration successful',
            'user' => [
                'id' => $userId,
                'mobile' => $mobile,
                'name' => $defaultName,
                'wallet_balance' => 0,
                'winning_balance' => 0
            ],
            'token' => $token
        ]);
    } else {
        echo json_encode(['status' => false, 'message' => 'Failed to create account']);
    }
}

$conn->close();
?>
