<?php
// Error handling - catch all errors
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Custom error handler to return JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error in verify-otp.php: $errstr in $errfile on line $errline");
    http_response_code(200);
    echo json_encode(['status' => false, 'message' => 'Server error', 'debug' => $errstr]);
    exit;
});

// Exception handler
set_exception_handler(function($e) {
    error_log("PHP Exception in verify-otp.php: " . $e->getMessage());
    http_response_code(200);
    echo json_encode(['status' => false, 'message' => 'Server error', 'debug' => $e->getMessage()]);
    exit;
});

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

// Ensure otp_requests table has verified column
$tableCheck = $conn->query("SHOW TABLES LIKE 'otp_requests'");
if ($tableCheck && $tableCheck->num_rows > 0) {
    $colCheck = $conn->query("SHOW COLUMNS FROM otp_requests LIKE 'verified'");
    if (!$colCheck || $colCheck->num_rows === 0) {
        $conn->query("ALTER TABLE otp_requests ADD COLUMN verified TINYINT(1) DEFAULT 0");
    }
}

// Fetch latest OTP for this mobile (simple query for maximum compatibility)
$escapedMobile = $conn->real_escape_string($mobile);
$result = $conn->query("SELECT id, otp, IFNULL(verified, 0) as verified, (expires_at > NOW()) AS is_valid_time FROM otp_requests WHERE mobile = '$escapedMobile' ORDER BY id DESC LIMIT 1");

if (!$result) {
    error_log("verify-otp.php: OTP SELECT failed: " . $conn->error);
    echo json_encode(['status' => false, 'message' => 'Database error']);
    $conn->close();
    exit;
}

if ($result->num_rows === 0) {
    echo json_encode(['status' => false, 'message' => 'OTP not found. Please resend OTP']);
    $conn->close();
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

// Mark OTP as verified (simple query)
$otpId = intval($row['id']);
$conn->query("UPDATE otp_requests SET verified = 1 WHERE id = $otpId");

// Check if user exists using simple query (no prepared statements for max compatibility)
$userResult = $conn->query("SELECT id, mobile, name, wallet_balance FROM users WHERE mobile = '$escapedMobile' LIMIT 1");

// Try to add winning_balance if missing
$hasWinningBalance = false;
$colCheck = $conn->query("SHOW COLUMNS FROM users LIKE 'winning_balance'");
if ($colCheck && $colCheck->num_rows > 0) {
    $hasWinningBalance = true;
    $userResult = $conn->query("SELECT id, mobile, name, wallet_balance, winning_balance FROM users WHERE mobile = '$escapedMobile' LIMIT 1");
} else {
    // Add the column if it doesn't exist
    $conn->query("ALTER TABLE users ADD COLUMN winning_balance DECIMAL(10,2) DEFAULT 0");
    $hasWinningBalance = true;
    $userResult = $conn->query("SELECT id, mobile, name, wallet_balance, IFNULL(winning_balance, 0) as winning_balance FROM users WHERE mobile = '$escapedMobile' LIMIT 1");
}

if (!$userResult) {
    error_log("verify-otp.php: users SELECT failed: " . $conn->error);
    echo json_encode(['status' => false, 'message' => 'Database error', 'debug' => $conn->error]);
    $conn->close();
    exit;
}

if ($userResult && $userResult->num_rows > 0) {
    $userRow = $userResult->fetch_assoc();

    // Existing user - login
    $token = bin2hex(random_bytes(32));

    echo json_encode([
        'status' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => intval($userRow['id']),
            'mobile' => (string)$userRow['mobile'],
            'name' => (string)$userRow['name'],
            'wallet_balance' => floatval($userRow['wallet_balance'] ?? 0),
            'winning_balance' => floatval($userRow['winning_balance'] ?? 0)
        ],
        'token' => $token
    ]);

    $conn->close();
    exit;
}

// New user - register automatically using simple query
$defaultName = 'Player' . substr($mobile, -4);
$escapedName = $conn->real_escape_string($defaultName);

$insertResult = $conn->query("INSERT INTO users (mobile, name, password, wallet_balance, winning_balance) VALUES ('$escapedMobile', '$escapedName', '', 0, 0)");

if (!$insertResult) {
    // Try without winning_balance column
    $insertResult = $conn->query("INSERT INTO users (mobile, name, password, wallet_balance) VALUES ('$escapedMobile', '$escapedName', '', 0)");
}

if ($insertResult) {
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
    error_log("verify-otp.php: users INSERT failed: " . $conn->error);
    echo json_encode(['status' => false, 'message' => 'Failed to create account', 'debug' => $conn->error]);
}

$conn->close();
?>
