<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

// Check database connection
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

// Create battles table if not exists
$tableCreated = $conn->query("CREATE TABLE IF NOT EXISTS ludo_battles (
    id VARCHAR(50) PRIMARY KEY,
    creator_id VARCHAR(50) NOT NULL,
    creator_name VARCHAR(100) NOT NULL,
    opponent_id VARCHAR(50) DEFAULT NULL,
    opponent_name VARCHAR(100) DEFAULT NULL,
    entry_fee INT NOT NULL,
    prize INT NOT NULL,
    status ENUM('open', 'running', 'completed', 'cancelled') DEFAULT 'open',
    winner_id VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

if (!$tableCreated) {
    echo json_encode(['success' => false, 'message' => 'Table creation failed: ' . $conn->error]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all open and running battles
    $openBattles = [];
    $runningBattles = [];
    
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
    
    $result = $conn->query("SELECT * FROM ludo_battles WHERE status = 'running' ORDER BY updated_at DESC LIMIT 20");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $runningBattles[] = [
                'id' => $row['id'],
                'player1' => ['id' => $row['creator_id'], 'name' => $row['creator_name']],
                'player2' => ['id' => $row['opponent_id'], 'name' => $row['opponent_name']],
                'entryFee' => (int)$row['entry_fee'],
                'prize' => (int)$row['prize']
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'openBattles' => $openBattles,
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
            $battleId = $conn->real_escape_string($data['battleId'] ?? '');
            $opponentId = $conn->real_escape_string($data['opponentId'] ?? '');
            $opponentName = $conn->real_escape_string($data['opponentName'] ?? '');
            
            $sql = "UPDATE ludo_battles SET opponent_id = '$opponentId', opponent_name = '$opponentName', status = 'running' WHERE id = '$battleId' AND status = 'open'";
            
            if ($conn->query($sql) && $conn->affected_rows > 0) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Battle not available']);
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
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>
