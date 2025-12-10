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
    // TODO: Integrate with SMS gateway to send actual OTP
    // For now, we'll return success and log the OTP (remove in production)
    
    // Example SMS API integration (uncomment and configure):
    // $smsApiUrl = "https://your-sms-api.com/send";
    // $smsData = [
    //     'mobile' => $mobile,
    //     'message' => "Your Rajasthan Ludo OTP is: $otp. Valid for 10 minutes."
    // ];
    // $ch = curl_init($smsApiUrl);
    // curl_setopt($ch, CURLOPT_POST, true);
    // curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($smsData));
    // curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    // $smsResponse = curl_exec($ch);
    // curl_close($ch);
    
    // Log OTP for development (REMOVE IN PRODUCTION)
    error_log("OTP for $mobile: $otp");
    
    echo json_encode([
        'status' => true,
        'message' => 'OTP sent successfully',
        // Remove 'otp' in production - only for testing
        'otp' => $otp
    ]);
} else {
    echo json_encode(['status' => false, 'message' => 'Failed to generate OTP']);
}

$conn->close();
?>
