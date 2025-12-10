<?php
require_once 'config.php';
header('Content-Type: application/json');

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $conn = getDBConnection();
    
    if (!$conn) {
        echo json_encode(['status' => false, 'message' => 'Database connection failed']);
        exit;
    }

    // Check if kyc_documents table exists, if not create it
    $tableCheck = $conn->query("SHOW TABLES LIKE 'kyc_documents'");
    if ($tableCheck->num_rows == 0) {
        $conn->query("
            CREATE TABLE kyc_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                mobile VARCHAR(15) NOT NULL,
                doc_type VARCHAR(50) NOT NULL,
                name VARCHAR(100),
                email VARCHAR(100),
                doc_number VARCHAR(50),
                front_image TEXT,
                back_image TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
    }

    $mobile = $_POST['mobile'] ?? null;
    $doc_type = $_POST['doc_type'] ?? null;
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $doc_number = $_POST['doc_number'] ?? '';

    if (!$mobile || !$doc_type) {
        echo json_encode(['status' => false, 'message' => 'Mobile and document type are required']);
        exit;
    }

    // Get user_id from mobile
    $stmt = $conn->prepare("SELECT id FROM users WHERE mobile = ?");
    $stmt->bind_param("s", $mobile);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $user_id = $user ? $user['id'] : 0;

    // Handle file uploads - convert to base64
    $front_image = '';
    $back_image = '';

    if (isset($_FILES['front_image']) && $_FILES['front_image']['error'] === UPLOAD_ERR_OK) {
        $front_image = 'data:' . $_FILES['front_image']['type'] . ';base64,' . base64_encode(file_get_contents($_FILES['front_image']['tmp_name']));
    }

    if (isset($_FILES['back_image']) && $_FILES['back_image']['error'] === UPLOAD_ERR_OK) {
        $back_image = 'data:' . $_FILES['back_image']['type'] . ';base64,' . base64_encode(file_get_contents($_FILES['back_image']['tmp_name']));
    }

    // Check if KYC already exists for this user
    $checkStmt = $conn->prepare("SELECT id FROM kyc_documents WHERE mobile = ?");
    $checkStmt->bind_param("s", $mobile);
    $checkStmt->execute();
    $existing = $checkStmt->get_result()->fetch_assoc();

    if ($existing) {
        // Update existing
        $stmt = $conn->prepare("UPDATE kyc_documents SET doc_type = ?, name = ?, email = ?, doc_number = ?, front_image = ?, back_image = ?, status = 'pending' WHERE mobile = ?");
        $stmt->bind_param("sssssss", $doc_type, $name, $email, $doc_number, $front_image, $back_image, $mobile);
    } else {
        // Insert new
        $stmt = $conn->prepare("INSERT INTO kyc_documents (user_id, mobile, doc_type, name, email, doc_number, front_image, back_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isssssss", $user_id, $mobile, $doc_type, $name, $email, $doc_number, $front_image, $back_image);
    }

    if ($stmt->execute()) {
        // Update user's kyc_status
        $updateUser = $conn->prepare("UPDATE users SET kyc_status = 'pending' WHERE mobile = ?");
        $updateUser->bind_param("s", $mobile);
        $updateUser->execute();
        
        echo json_encode(['status' => true, 'message' => 'KYC documents uploaded successfully']);
    } else {
        echo json_encode(['status' => false, 'message' => 'Failed to upload documents']);
    }
    
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['status' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
