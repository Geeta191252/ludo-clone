<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

$admin = requireAdmin();
$conn = getDBConnection();

$site_settings = [];
$payment_settings = [];

// Get site settings
$result = $conn->query("SELECT setting_key, setting_value FROM settings WHERE setting_type = 'site'");
while ($row = $result->fetch_assoc()) {
    $value = $row['setting_value'];
    // Convert numeric strings
    if (is_numeric($value)) {
        $value = strpos($value, '.') !== false ? floatval($value) : intval($value);
    }
    // Convert boolean strings
    if ($value === 'true') $value = true;
    if ($value === 'false') $value = false;
    
    $site_settings[$row['setting_key']] = $value;
}

// Get payment settings (masked)
$result = $conn->query("SELECT setting_key, setting_value FROM settings WHERE setting_type = 'payment'");
while ($row = $result->fetch_assoc()) {
    $value = $row['setting_value'];
    // Mask API keys
    if (strpos($row['setting_key'], 'api_key') !== false && strlen($value) > 8) {
        $value = substr($value, 0, 4) . str_repeat('*', strlen($value) - 8) . substr($value, -4);
    }
    $payment_settings[$row['setting_key']] = $value;
}

echo json_encode([
    'status' => true,
    'site_settings' => $site_settings,
    'payment_settings' => $payment_settings
]);

$conn->close();
?>
