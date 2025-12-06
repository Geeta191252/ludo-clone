<?php
/**
 * ==========================================
 *   HOSTINGER CONFIGURATION FILE
 *   इस file को Hostinger पर edit करो
 * ==========================================
 */

// ============================================
// 🔑 PAY0.SHOP API SETTINGS
// Pay0.shop dashboard से API key लो
// ============================================
define('PAY0_API_KEY', 'YOUR_PAY0_API_KEY_HERE');  // <-- यहाँ Pay0 API key डालो
define('PAY0_API_URL', 'https://pay0.shop/api/create-order');
define('PAY0_STATUS_URL', 'https://pay0.shop/api/check-order-status');

// ============================================
// 🌐 SITE URL
// अपनी website का URL डालो (बिना trailing slash)
// Example: https://mygaming.com
// ============================================
define('SITE_URL', 'https://yoursite.com');  // <-- यहाँ अपना domain डालो

// ============================================
// 🗄️ DATABASE SETTINGS (HOSTINGER MYSQL)
// Hostinger > Databases > MySQL से details लो
// ============================================
define('DB_HOST', 'localhost');              // <-- Usually 'localhost' ही रहने दो
define('DB_USER', 'your_db_username');       // <-- Hostinger database username
define('DB_PASS', 'your_db_password');       // <-- Hostinger database password  
define('DB_NAME', 'your_db_name');           // <-- Hostinger database name

// ============================================
// ⚙️ SYSTEM SETTINGS (इन्हें मत छुओ)
// ============================================

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
    $conn->set_charset('utf8mb4');
    return $conn;
}
?>
