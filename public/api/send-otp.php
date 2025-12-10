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

// Validation
if (empty($mobile) || strlen($mobile) !== 10) {
    echo json_encode(['status' => false, 'message' => 'Valid 10-digit mobile number required']);
    exit;
}

$conn = getDBConnection();

// Generate 6-digit OTP
$otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
$expires_at = date('Y-m-d H:i:s', strtotime('+10 minutes'));

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
}

// Delete old OTPs for this mobile
$stmt = $conn->prepare("DELETE FROM otp_requests WHERE mobile = ?");
$stmt->bind_param("s", $mobile);
$stmt->execute();

// Insert new OTP
$stmt = $conn->prepare("INSERT INTO otp_requests (mobile, otp, expires_at) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $mobile, $otp, $expires_at);

if ($stmt->execute()) {
    // Renflair SMS Gateway Integration
    $apiKey = '29c4a0e4ef7d1969a94a5f4aadd20690';
    $message = "Your Rajasthan Ludo OTP is: $otp. Valid for 10 minutes. Do not share with anyone.";
    
    // Renflair SMS API URL
    $smsApiUrl = "https://renflair.in/API/sms-api.php";
    
    $postData = [
        'apikey' => $apiKey,
        'mobile' => $mobile,
        'msg' => $message
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $smsApiUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $smsResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    // Log for debugging
    error_log("SMS API Response: $smsResponse, HTTP Code: $httpCode, Error: $curlError");
    
    if ($smsResponse && strpos(strtolower($smsResponse), 'success') !== false) {
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
