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

// Create battles table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS ludo_battles (
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

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all open and running battles
    $openBattles = [];
    $runningBattles = [];
    
    $result = $conn->query("SELECT * FROM ludo_battles WHERE status = 'open' ORDER BY created_at DESC LIMIT 20");
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
    
    $result = $conn->query("SELECT * FROM ludo_battles WHERE status = 'running' ORDER BY updated_at DESC LIMIT 20");
    while ($row = $result->fetch_assoc()) {
        $runningBattles[] = [
            'id' => $row['id'],
            'player1' => ['id' => $row['creator_id'], 'name' => $row['creator_name']],
            'player2' => ['id' => $row['opponent_id'], 'name' => $row['opponent_name']],
            'entryFee' => (int)$row['entry_fee'],
            'prize' => (int)$row['prize']
        ];
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
            $creatorId = $data['creatorId'] ?? '';
            $creatorName = $data['creatorName'] ?? '';
            $entryFee = (int)($data['entryFee'] ?? 0);
            $prize = (int)floor($entryFee * 2 - $entryFee * 0.05);
            
            if (empty($creatorId) || $entryFee <= 0) {
                echo json_encode(['success' => false, 'message' => 'Invalid data']);
                exit();
            }
            
            $stmt = $conn->prepare("INSERT INTO ludo_battles (id, creator_id, creator_name, entry_fee, prize) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sssii", $id, $creatorId, $creatorName, $entryFee, $prize);
            
            if ($stmt->execute()) {
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
                echo json_encode(['success' => false, 'message' => 'Failed to create battle']);
            }
            break;
            
        case 'join':
            $battleId = $data['battleId'] ?? '';
            $opponentId = $data['opponentId'] ?? '';
            $opponentName = $data['opponentName'] ?? '';
            
            $stmt = $conn->prepare("UPDATE ludo_battles SET opponent_id = ?, opponent_name = ?, status = 'running' WHERE id = ? AND status = 'open'");
            $stmt->bind_param("sss", $opponentId, $opponentName, $battleId);
            
            if ($stmt->execute() && $stmt->affected_rows > 0) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Battle not available']);
            }
            break;
            
        case 'cancel':
            $battleId = $data['battleId'] ?? '';
            $creatorId = $data['creatorId'] ?? '';
            
            $stmt = $conn->prepare("DELETE FROM ludo_battles WHERE id = ? AND creator_id = ? AND status = 'open'");
            $stmt->bind_param("ss", $battleId, $creatorId);
            
            if ($stmt->execute() && $stmt->affected_rows > 0) {
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
