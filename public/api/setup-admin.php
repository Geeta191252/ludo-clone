<?php
header('Content-Type: text/html; charset=utf-8');

// Database credentials - Update these with your actual Hostinger credentials
$db_host = 'localhost';
$db_user = 'u867092456_gaming_db'; // Update this
$db_pass = 'YOUR_PASSWORD_HERE';   // Update this  
$db_name = 'u867092456_gaming_db'; // Update this

echo "<h2>Admin Setup Tool</h2>";

// Check if form submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $name = trim($_POST['name'] ?? 'Administrator');
    
    if (empty($username) || empty($password)) {
        echo "<p style='color:red'>Username and password required!</p>";
    } else {
        try {
            $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
            
            if ($conn->connect_error) {
                throw new Exception("Database connection failed: " . $conn->connect_error);
            }
            
            // Hash the password
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            
            // Delete existing admin if exists
            $conn->query("DELETE FROM admins WHERE username = '" . $conn->real_escape_string($username) . "'");
            
            // Insert new admin
            $stmt = $conn->prepare("INSERT INTO admins (username, password, name, status) VALUES (?, ?, ?, 'active')");
            $stmt->bind_param("sss", $username, $hashed_password, $name);
            
            if ($stmt->execute()) {
                echo "<p style='color:green; font-size: 20px;'>✅ Admin created successfully!</p>";
                echo "<p><strong>Username:</strong> " . htmlspecialchars($username) . "</p>";
                echo "<p><strong>Password:</strong> " . htmlspecialchars($password) . "</p>";
                echo "<p><a href='/admin'>Go to Admin Login</a></p>";
            } else {
                throw new Exception("Insert failed: " . $stmt->error);
            }
            
            $conn->close();
        } catch (Exception $e) {
            echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
        }
    }
}

// Test database connection
echo "<h3>Database Connection Test:</h3>";
try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        echo "<p style='color:red'>❌ Connection failed: " . $conn->connect_error . "</p>";
        echo "<p>Please update database credentials in this file!</p>";
    } else {
        echo "<p style='color:green'>✅ Database connected successfully!</p>";
        
        // Check if admins table exists
        $result = $conn->query("SHOW TABLES LIKE 'admins'");
        if ($result->num_rows > 0) {
            echo "<p style='color:green'>✅ admins table exists</p>";
            
            // Show existing admins
            $admins = $conn->query("SELECT id, username, name, status FROM admins");
            if ($admins->num_rows > 0) {
                echo "<h4>Existing Admins:</h4><ul>";
                while ($row = $admins->fetch_assoc()) {
                    echo "<li>" . htmlspecialchars($row['username']) . " - " . htmlspecialchars($row['name']) . " (" . $row['status'] . ")</li>";
                }
                echo "</ul>";
            }
        } else {
            echo "<p style='color:red'>❌ admins table not found!</p>";
        }
        $conn->close();
    }
} catch (Exception $e) {
    echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
}
?>

<h3>Create New Admin:</h3>
<form method="POST" style="max-width: 400px;">
    <p>
        <label>Username:</label><br>
        <input type="text" name="username" required style="width: 100%; padding: 8px;">
    </p>
    <p>
        <label>Password:</label><br>
        <input type="password" name="password" required style="width: 100%; padding: 8px;">
    </p>
    <p>
        <label>Name:</label><br>
        <input type="text" name="name" value="Administrator" style="width: 100%; padding: 8px;">
    </p>
    <button type="submit" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer;">
        Create Admin
    </button>
</form>

<p style="color: orange; margin-top: 20px;">⚠️ Delete this file after creating admin!</p>
