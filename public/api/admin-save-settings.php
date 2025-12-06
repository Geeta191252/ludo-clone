<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

$admin = requireAdmin();
$input = json_decode(file_get_contents('php://input'), true);

$type = $input['type'] ?? '';
$settings = $input['settings'] ?? [];

if (empty($type) || empty($settings) || !in_array($type, ['site', 'payment'])) {
    echo json_encode(['status' => false, 'message' => 'Invalid parameters']);
    exit;
}

$conn = getDBConnection();

foreach ($settings as $key => $value) {
    // Skip masked values (don't update if user didn't change)
    if (is_string($value) && strpos($value, '****') !== false) {
        continue;
    }
    
    // Convert booleans to string
    if (is_bool($value)) {
        $value = $value ? 'true' : 'false';
    }
    
    $stmt = $conn->prepare("
        INSERT INTO settings (setting_type, setting_key, setting_value) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    ");
    $strValue = strval($value);
    $stmt->bind_param("sss", $type, $key, $strValue);
    $stmt->execute();
}

// Log the action
$stmt = $conn->prepare("INSERT INTO admin_logs (admin_id, action, details, created_at) VALUES (?, 'UPDATE_SETTINGS', ?, NOW())");
$details = json_encode(['type' => $type]);
$stmt->bind_param("is", $admin['id'], $details);
$stmt->execute();

echo json_encode(['status' => true, 'message' => 'Settings saved successfully']);
$conn->close();
?>
