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

// Check if user exists (mysqlnd-safe + schema-safe)
$hasWinningBalance = true;
$userStmt = $conn->prepare("SELECT id, mobile, name, wallet_balance, winning_balance FROM users WHERE mobile = ? LIMIT 1");

if (!$userStmt) {
    // Fallback for DBs that don't have winning_balance column
    $hasWinningBalance = false;
    $userStmt = $conn->prepare("SELECT id, mobile, name, wallet_balance FROM users WHERE mobile = ? LIMIT 1");
}

if (!$userStmt) {
    error_log("verify-otp.php: users SELECT prepare failed: " . $conn->error);
    echo json_encode(['status' => false, 'message' => 'Server error - please try again later']);
    $conn->close();
    exit;
}

$userStmt->bind_param("s", $mobile);
$userStmt->execute();
$userStmt->store_result();

if ($userStmt->num_rows > 0) {
    if ($hasWinningBalance) {
        $userStmt->bind_result($userId, $userMobile, $userName, $walletBalance, $winningBalance);
    } else {
        $userStmt->bind_result($userId, $userMobile, $userName, $walletBalance);
        $winningBalance = 0;
    }

    $userStmt->fetch();

    // Existing user - login
    $token = bin2hex(random_bytes(32));

    echo json_encode([
        'status' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => intval($userId),
            'mobile' => (string)$userMobile,
            'name' => (string)$userName,
            'wallet_balance' => floatval($walletBalance ?? 0),
            'winning_balance' => floatval($winningBalance ?? 0)
        ],
        'token' => $token
    ]);

    $conn->close();
    exit;
}

// New user - register automatically (schema-safe)
$defaultName = 'Player' . substr($mobile, -4);

$insertStmt = $conn->prepare("INSERT INTO users (mobile, name, password, wallet_balance, winning_balance) VALUES (?, ?, '', 0, 0)");
if (!$insertStmt) {
    // Fallback for DBs that don't have winning_balance column
    $insertStmt = $conn->prepare("INSERT INTO users (mobile, name, password, wallet_balance) VALUES (?, ?, '', 0)");
}

if (!$insertStmt) {
    error_log("verify-otp.php: users INSERT prepare failed: " . $conn->error);
    echo json_encode(['status' => false, 'message' => 'Server error - please try again later']);
    $conn->close();
    exit;
}

$insertStmt->bind_param("ss", $mobile, $defaultName);

if ($insertStmt->execute()) {
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
    error_log("verify-otp.php: users INSERT execute failed: " . $conn->error);
    echo json_encode(['status' => false, 'message' => 'Failed to create account']);
}

$conn->close();
?>
