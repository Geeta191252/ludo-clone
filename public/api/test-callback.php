<?php
// Test file to verify callback URL is working
header('Content-Type: text/plain');

// Log this test request
$log_data = date('Y-m-d H:i:s') . " - TEST REQUEST - IP: " . $_SERVER['REMOTE_ADDR'] . "\n";
file_put_contents('webhook_log.txt', $log_data, FILE_APPEND);

echo "Callback URL is working!\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n";
echo "Log file created successfully.";
?>
