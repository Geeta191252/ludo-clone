<?php
// Pay0.shop Configuration
define('PAY0_API_KEY', 'YOUR_PAY0_API_KEY_HERE'); // अपना API key यहाँ डालो
define('PAY0_API_URL', 'https://pay0.shop/api/create-order');
define('PAY0_STATUS_URL', 'https://pay0.shop/api/check-order-status');
define('SITE_URL', 'https://yoursite.com'); // अपनी site का URL यहाँ डालो

// Database Configuration (Hostinger MySQL)
define('DB_HOST', 'localhost');
define('DB_USER', 'your_db_username'); // Hostinger database username
define('DB_PASS', 'your_db_password'); // Hostinger database password
define('DB_NAME', 'your_db_name'); // Hostinger database name

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database Connection Function
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        die(json_encode(['status' => false, 'message' => 'Database connection failed']));
    }
    return $conn;
}
?>
