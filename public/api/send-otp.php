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
$mobile = preg_replace('/\D/', '', trim($mobileRaw));

// Validation
if (empty($mobile) || strlen($mobile) !== 10) {
    echo json_encode(['status' => false, 'message' => 'Valid 10-digit mobile number required']);
    exit;
}

$conn = getDBConnection();

// Generate 6-digit OTP
$otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

// Check if otp_requests table exists, create if not
$tableCheck = $conn->query("SHOW TABLES LIKE 'otp_requests'");
if ($tableCheck->num_rows === 0) {
    $createTable = "CREATE TABLE otp_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mobile VARCHAR(15) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        verified TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mobile (mobile),
        INDEX idx_expires (expires_at)
    )";
    $conn->query($createTable);
} else {
    // Ensure verified column exists
    $colCheck = $conn->query("SHOW COLUMNS FROM otp_requests LIKE 'verified'");
    if (!$colCheck || $colCheck->num_rows === 0) {
        $conn->query("ALTER TABLE otp_requests ADD COLUMN verified TINYINT(1) DEFAULT 0");
    }
}

// Delete old OTPs for this mobile (simple query, no prepared stmt needed)
$conn->query("DELETE FROM otp_requests WHERE mobile = '" . $conn->real_escape_string($mobile) . "'");

// Insert new OTP (expires_at based on DB time to avoid timezone mismatch)
$insertSql = "INSERT INTO otp_requests (mobile, otp, expires_at, verified) VALUES ('" . $conn->real_escape_string($mobile) . "', '" . $conn->real_escape_string($otp) . "', DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)";
$insertResult = $conn->query($insertSql);

if ($insertResult) {
    // Renflair SMS Gateway Integration - Correct API
    $apiKey = '29c4a0e4ef7d1969a94a5f4aadd20690';
    
    // Correct Renflair SMS API URL (GET request with query params)
    $smsApiUrl = "https://sms.renflair.in/V1.php?API=" . urlencode($apiKey) . "&PHONE=" . urlencode($mobile) . "&OTP=" . urlencode($otp);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $smsApiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $smsResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    // Log for debugging
    error_log("Renflair SMS Response: $smsResponse, HTTP Code: $httpCode, Error: $curlError");
    
    if ($httpCode === 200 && $smsResponse) {
        echo json_encode([
            'status' => true,
            'message' => 'OTP sent successfully to your mobile'
        ]);
    } else {
        // SMS failed but OTP is saved, return success with OTP for testing
        echo json_encode([
            'status' => true,
            'message' => 'OTP generated',
            'otp' => $otp, // Remove in production after SMS works
            'debug' => $smsResponse // Remove in production
        ]);
    }
} else {
    echo json_encode(['status' => false, 'message' => 'Failed to generate OTP']);
}

$conn->close();
?>
