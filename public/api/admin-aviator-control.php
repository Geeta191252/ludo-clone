<?php
// Admin Aviator Control Panel API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

$authResult = verifyAdminTokenWithDebug($conn);
if (!$authResult['valid']) {
    echo json_encode(['status' => false, 'message' => 'Unauthorized', 'debug' => $authResult['reason']]);
    exit();
}

function verifyAdminTokenWithDebug($conn) {
    $headers = getallheaders();
    
    // Handle case-insensitive header lookup
    $authHeader = '';
    if ($headers) {
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $authHeader = $value;
                break;
            }
        }
    }
    
    if (empty($authHeader)) {
        return ['valid' => false, 'reason' => 'No authorization header'];
    }
    
    if (strpos($authHeader, 'Bearer ') !== 0) {
        return ['valid' => false, 'reason' => 'Invalid bearer format'];
    }
    
    $token = substr($authHeader, 7);
    
    if (empty($token) || $token === 'null' || $token === 'undefined') {
        return ['valid' => false, 'reason' => 'Empty or invalid token'];
    }
    
    $stmt = $conn->prepare("SELECT * FROM admin_tokens WHERE token = ? AND expires_at > NOW()");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        return ['valid' => true, 'reason' => 'Token valid'];
    }
    
    return ['valid' => false, 'reason' => 'Token not found or expired'];
}

$action = $_GET['action'] ?? '';

// Ensure admin control columns exist
$conn->query("ALTER TABLE game_state ADD COLUMN IF NOT EXISTS admin_control TINYINT DEFAULT 0");
$conn->query("ALTER TABLE game_state ADD COLUMN IF NOT EXISTS target_crash DECIMAL(10,2) DEFAULT NULL");

switch ($action) {
    case 'get_state':
        $stmt = $conn->prepare("SELECT * FROM game_state WHERE game_type = 'aviator'");
        $stmt->execute();
        $state = $stmt->get_result()->fetch_assoc();
        
        if ($state) {
            $state['history'] = json_decode($state['history'] ?? '[]');
            echo json_encode(['status' => true, 'state' => $state]);
        } else {
            echo json_encode(['status' => false, 'message' => 'Game state not found']);
        }
        break;

    case 'crash_now':
        // Get current state
        $stmt = $conn->prepare("SELECT * FROM game_state WHERE game_type = 'aviator'");
        $stmt->execute();
        $state = $stmt->get_result()->fetch_assoc();
        
        if (!$state || $state['phase'] !== 'flying') {
            echo json_encode(['status' => false, 'message' => 'Plane is not flying']);
            break;
        }
        
        $multiplier = (float)$state['multiplier'];
        $history = json_decode($state['history'] ?? '[]', true);
        $crashPoint = round($multiplier, 2);
        
        array_unshift($history, $crashPoint);
        $history = array_slice($history, 0, 20);
        $historyJson = json_encode($history);
        
        $currentMs = round(microtime(true) * 1000);
        $stmt = $conn->prepare("UPDATE game_state SET phase = 'crashed', timer = 0, multiplier = ?, crash_point = ?, history = ?, last_tick_ms = ? WHERE game_type = 'aviator'");
        $stmt->bind_param("ddsi", $multiplier, $crashPoint, $historyJson, $currentMs);
        $stmt->execute();
        
        echo json_encode(['status' => true, 'message' => 'Plane crashed', 'crash_point' => $crashPoint]);
        break;

    case 'set_target_crash':
        $input = json_decode(file_get_contents('php://input'), true);
        $target = (float)($input['target'] ?? 0);
        
        if ($target < 1.01) {
            echo json_encode(['status' => false, 'message' => 'Target must be at least 1.01']);
            break;
        }
        
        $stmt = $conn->prepare("UPDATE game_state SET target_crash = ?, admin_control = 1 WHERE game_type = 'aviator'");
        $stmt->bind_param("d", $target);
        $stmt->execute();
        
        echo json_encode(['status' => true, 'message' => "Target set to {$target}x"]);
        break;

    case 'toggle_auto':
        $input = json_decode(file_get_contents('php://input'), true);
        $auto = $input['auto'] ? 1 : 0;
        $adminControl = $auto ? 0 : 1;
        
        $stmt = $conn->prepare("UPDATE game_state SET admin_control = ?, target_crash = NULL WHERE game_type = 'aviator'");
        $stmt->bind_param("i", $adminControl);
        $stmt->execute();
        
        echo json_encode(['status' => true, 'message' => $auto ? 'Auto mode enabled' : 'Manual control enabled']);
        break;

    case 'start_round':
        $currentMs = round(microtime(true) * 1000);
        $stmt = $conn->prepare("UPDATE game_state SET phase = 'flying', timer = 0, multiplier = 1.00, plane_x = 10, plane_y = 80, last_tick_ms = ? WHERE game_type = 'aviator'");
        $stmt->bind_param("i", $currentMs);
        $stmt->execute();
        
        echo json_encode(['status' => true, 'message' => 'Round started']);
        break;

    case 'reset_game':
        $stmt = $conn->prepare("SELECT round_number FROM game_state WHERE game_type = 'aviator'");
        $stmt->execute();
        $state = $stmt->get_result()->fetch_assoc();
        $newRound = ($state['round_number'] ?? 0) + 1;
        
        $currentMs = round(microtime(true) * 1000);
        $stmt = $conn->prepare("UPDATE game_state SET phase = 'waiting', timer = 12, multiplier = 1.00, round_number = ?, crash_point = NULL, plane_x = 10, plane_y = 80, target_crash = NULL, last_tick_ms = ? WHERE game_type = 'aviator'");
        $stmt->bind_param("ii", $newRound, $currentMs);
        $stmt->execute();
        
        echo json_encode(['status' => true, 'message' => 'Game reset']);
        break;

    default:
        echo json_encode(['status' => false, 'message' => 'Invalid action']);
}

$conn->close();
?>
