<?php
// Suppress PHP errors from appearing in output
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include config with error handling
if (!file_exists('config.php')) {
    echo json_encode(['success' => false, 'message' => 'Config file not found']);
    exit();
}

// Custom database connection to avoid die() in config.php
function getLudoDBConnection() {
    // Include config for constants only
    if (!defined('DB_HOST')) {
        @include_once 'config.php';
    }
    
    // Check if constants are defined
    if (!defined('DB_HOST') || !defined('DB_USER') || !defined('DB_PASS') || !defined('DB_NAME')) {
        return null;
    }
    
    // Create connection with error suppression
    $conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        return null;
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

// Get database connection
$conn = getLudoDBConnection();

if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed - please check config.php credentials']);
    exit();
}

// Create battles table if not exists (with requested status for play requests)
$tableCreated = $conn->query("CREATE TABLE IF NOT EXISTS ludo_battles (
    id VARCHAR(50) PRIMARY KEY,
    creator_id VARCHAR(50) NOT NULL,
    creator_name VARCHAR(100) NOT NULL,
    opponent_id VARCHAR(50) DEFAULT NULL,
    opponent_name VARCHAR(100) DEFAULT NULL,
    entry_fee INT NOT NULL,
    prize INT NOT NULL,
    status ENUM('open', 'requested', 'running', 'completed', 'cancelled') DEFAULT 'open',
    room_code VARCHAR(20) DEFAULT NULL,
    winner_id VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Alter table to add 'requested' status if it doesn't exist
$conn->query("ALTER TABLE ludo_battles MODIFY COLUMN status ENUM('open', 'requested', 'running', 'completed', 'cancelled') DEFAULT 'open'");

// Add room_code column if it doesn't exist
$conn->query("ALTER TABLE ludo_battles ADD COLUMN room_code VARCHAR(20) DEFAULT NULL");

if (!$tableCreated) {
    echo json_encode(['success' => false, 'message' => 'Table creation failed: ' . $conn->error]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all open, requested and running battles
    $openBattles = [];
    $requestedBattles = [];
    $runningBattles = [];
    
    // Open battles (waiting for someone to click Play)
    $result = $conn->query("SELECT * FROM ludo_battles WHERE status = 'open' ORDER BY created_at DESC LIMIT 20");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $openBattles[] = [
                'id' => $row['id'],
                'creatorId' => $row['creator_id'],
                'creatorName' => $row['creator_name'],
                'entryFee' => (int)$row['entry_fee'],
                'prize' => (int)$row['prize'],
                'createdAt' => $row['created_at']
            ];
        }
    }
    
    // Requested battles (someone clicked Play, waiting for creator to Start/Reject)
    $result = $conn->query("SELECT * FROM ludo_battles WHERE status = 'requested' ORDER BY updated_at DESC LIMIT 20");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $requestedBattles[] = [
                'id' => $row['id'],
                'creatorId' => $row['creator_id'],
                'creatorName' => $row['creator_name'],
                'opponentId' => $row['opponent_id'],
                'opponentName' => $row['opponent_name'],
                'entryFee' => (int)$row['entry_fee'],
                'prize' => (int)$row['prize']
            ];
        }
    }
    
    // Running battles
    $result = $conn->query("SELECT * FROM ludo_battles WHERE status = 'running' ORDER BY updated_at DESC LIMIT 20");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $runningBattles[] = [
                'id' => $row['id'],
                'player1' => ['id' => $row['creator_id'], 'name' => $row['creator_name']],
                'player2' => ['id' => $row['opponent_id'], 'name' => $row['opponent_name']],
                'entryFee' => (int)$row['entry_fee'],
                'prize' => (int)$row['prize'],
                'roomCode' => $row['room_code']
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'openBattles' => $openBattles,
        'requestedBattles' => $requestedBattles,
        'runningBattles' => $runningBattles
    ]);
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';
    
    switch ($action) {
        case 'create':
            $id = 'battle_' . time() . '_' . rand(1000, 9999);
            $creatorId = $conn->real_escape_string($data['creatorId'] ?? '');
            $creatorName = $conn->real_escape_string($data['creatorName'] ?? '');
            $entryFee = (int)($data['entryFee'] ?? 0);
            $prize = (int)floor($entryFee * 2 - $entryFee * 0.05);
            
            if (empty($creatorId) || $entryFee <= 0) {
                echo json_encode(['success' => false, 'message' => 'Invalid data - creatorId or entryFee missing']);
                exit();
            }
            
            $sql = "INSERT INTO ludo_battles (id, creator_id, creator_name, entry_fee, prize) VALUES ('$id', '$creatorId', '$creatorName', $entryFee, $prize)";
            
            if ($conn->query($sql)) {
                echo json_encode([
                    'success' => true,
                    'battle' => [
                        'id' => $id,
                        'creatorId' => $creatorId,
                        'creatorName' => $creatorName,
                        'entryFee' => $entryFee,
                        'prize' => $prize
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create battle: ' . $conn->error]);
            }
            break;
            
        case 'join':
            // Someone clicked Play - move to requested status
            $battleId = $conn->real_escape_string($data['battleId'] ?? '');
            $opponentId = $conn->real_escape_string($data['opponentId'] ?? '');
            $opponentName = $conn->real_escape_string($data['opponentName'] ?? '');
            
            $sql = "UPDATE ludo_battles SET opponent_id = '$opponentId', opponent_name = '$opponentName', status = 'requested' WHERE id = '$battleId' AND status = 'open'";
            
            if ($conn->query($sql) && $conn->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Request sent to creator']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Battle not available']);
            }
            break;
            
        case 'accept':
            // Creator clicks Start - move to running
            $battleId = $conn->real_escape_string($data['battleId'] ?? '');
            $creatorId = $conn->real_escape_string($data['creatorId'] ?? '');
            
            $sql = "UPDATE ludo_battles SET status = 'running' WHERE id = '$battleId' AND creator_id = '$creatorId' AND status = 'requested'";
            
            if ($conn->query($sql) && $conn->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Battle started']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Cannot start battle']);
            }
            break;
            
        case 'reject':
            // Creator clicks Reject - reset to open and clear opponent
            $battleId = $conn->real_escape_string($data['battleId'] ?? '');
            $creatorId = $conn->real_escape_string($data['creatorId'] ?? '');
            
            $sql = "UPDATE ludo_battles SET opponent_id = NULL, opponent_name = NULL, status = 'open' WHERE id = '$battleId' AND creator_id = '$creatorId' AND status = 'requested'";
            
            if ($conn->query($sql) && $conn->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Request rejected']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Cannot reject request']);
            }
            break;
            
        case 'cancel':
            $battleId = $conn->real_escape_string($data['battleId'] ?? '');
            $creatorId = $conn->real_escape_string($data['creatorId'] ?? '');
            
            $sql = "DELETE FROM ludo_battles WHERE id = '$battleId' AND creator_id = '$creatorId' AND status = 'open'";
            
            if ($conn->query($sql) && $conn->affected_rows > 0) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Cannot cancel battle']);
            }
            break;
            
        case 'set_room_code':
            // Creator sets room code - save to database
            $battleId = $conn->real_escape_string($data['battleId'] ?? '');
            $creatorId = $conn->real_escape_string($data['creatorId'] ?? '');
            $roomCode = $conn->real_escape_string($data['roomCode'] ?? '');
            
            $sql = "UPDATE ludo_battles SET room_code = '$roomCode' WHERE id = '$battleId' AND creator_id = '$creatorId' AND status = 'running'";
            
            if ($conn->query($sql) && $conn->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Room code set', 'roomCode' => $roomCode]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Cannot set room code']);
            }
            break;
            
        case 'get_battle':
            // Get single battle details
            $battleId = $conn->real_escape_string($data['battleId'] ?? '');
            
            $result = $conn->query("SELECT * FROM ludo_battles WHERE id = '$battleId'");
            if ($result && $row = $result->fetch_assoc()) {
                echo json_encode([
                    'success' => true,
                    'battle' => [
                        'id' => $row['id'],
                        'player1' => ['id' => $row['creator_id'], 'name' => $row['creator_name']],
                        'player2' => ['id' => $row['opponent_id'], 'name' => $row['opponent_name']],
                        'entryFee' => (int)$row['entry_fee'],
                        'prize' => (int)$row['prize'],
                        'roomCode' => $row['room_code'],
                        'status' => $row['status']
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Battle not found']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>
