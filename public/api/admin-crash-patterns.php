<?php
// Admin Crash Pattern Management API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

$conn = getDBConnection();

if (!$conn) {
    echo json_encode(['status' => false, 'message' => 'Database connection failed']);
    exit();
}

// Verify admin token
function verifyAdminToken($conn) {
    $headers = getallheaders();
    $authHeader = '';
    if ($headers) {
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $authHeader = $value;
                break;
            }
        }
    }
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        return false;
    }
    
    $token = substr($authHeader, 7);
    if (empty($token) || $token === 'null' || $token === 'undefined') {
        return false;
    }
    
    $stmt = $conn->prepare("SELECT * FROM admin_tokens WHERE token = ? AND expires_at > NOW()");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    return $stmt->get_result()->num_rows > 0;
}

if (!verifyAdminToken($conn)) {
    echo json_encode(['status' => false, 'message' => 'Unauthorized']);
    exit();
}

// Create crash_patterns table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS crash_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crash_value DECIMAL(10,2) NOT NULL,
    position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_patterns':
        $result = $conn->query("SELECT * FROM crash_patterns ORDER BY position ASC");
        $patterns = [];
        while ($row = $result->fetch_assoc()) {
            $patterns[] = [
                'id' => (int)$row['id'],
                'value' => (float)$row['crash_value'],
                'position' => (int)$row['position']
            ];
        }
        echo json_encode(['status' => true, 'patterns' => $patterns, 'count' => count($patterns)]);
        break;

    case 'add_pattern':
        $input = json_decode(file_get_contents('php://input'), true);
        $value = (float)($input['value'] ?? 0);
        
        if ($value < 1.01) {
            echo json_encode(['status' => false, 'message' => 'Value must be at least 1.01']);
            break;
        }
        
        // Get next position
        $result = $conn->query("SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM crash_patterns");
        $nextPos = $result->fetch_assoc()['next_pos'];
        
        $stmt = $conn->prepare("INSERT INTO crash_patterns (crash_value, position) VALUES (?, ?)");
        $stmt->bind_param("di", $value, $nextPos);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => true, 'message' => "Pattern {$value}x added", 'id' => $conn->insert_id]);
        } else {
            echo json_encode(['status' => false, 'message' => 'Failed to add pattern']);
        }
        break;

    case 'add_multiple':
        $input = json_decode(file_get_contents('php://input'), true);
        $values = $input['values'] ?? [];
        
        if (empty($values)) {
            echo json_encode(['status' => false, 'message' => 'No values provided']);
            break;
        }
        
        // Get next position
        $result = $conn->query("SELECT COALESCE(MAX(position), 0) as max_pos FROM crash_patterns");
        $nextPos = $result->fetch_assoc()['max_pos'] + 1;
        
        $added = 0;
        $stmt = $conn->prepare("INSERT INTO crash_patterns (crash_value, position) VALUES (?, ?)");
        
        foreach ($values as $value) {
            $value = (float)$value;
            if ($value >= 1.01) {
                $stmt->bind_param("di", $value, $nextPos);
                if ($stmt->execute()) {
                    $added++;
                    $nextPos++;
                }
            }
        }
        
        echo json_encode(['status' => true, 'message' => "{$added} patterns added", 'added' => $added]);
        break;

    case 'delete_pattern':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = (int)($input['id'] ?? 0);
        
        if ($id <= 0) {
            echo json_encode(['status' => false, 'message' => 'Invalid pattern ID']);
            break;
        }
        
        $stmt = $conn->prepare("DELETE FROM crash_patterns WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            // Reorder positions
            $conn->query("SET @pos = 0; UPDATE crash_patterns SET position = (@pos := @pos + 1) ORDER BY position ASC");
            echo json_encode(['status' => true, 'message' => 'Pattern deleted']);
        } else {
            echo json_encode(['status' => false, 'message' => 'Pattern not found']);
        }
        break;

    case 'clear_all':
        $conn->query("DELETE FROM crash_patterns");
        echo json_encode(['status' => true, 'message' => 'All patterns cleared']);
        break;

    case 'reorder':
        $input = json_decode(file_get_contents('php://input'), true);
        $ids = $input['ids'] ?? [];
        
        if (empty($ids)) {
            echo json_encode(['status' => false, 'message' => 'No IDs provided']);
            break;
        }
        
        $stmt = $conn->prepare("UPDATE crash_patterns SET position = ? WHERE id = ?");
        $pos = 1;
        foreach ($ids as $id) {
            $stmt->bind_param("ii", $pos, $id);
            $stmt->execute();
            $pos++;
        }
        
        echo json_encode(['status' => true, 'message' => 'Patterns reordered']);
        break;

    default:
        echo json_encode(['status' => false, 'message' => 'Invalid action']);
}

$conn->close();
?>
