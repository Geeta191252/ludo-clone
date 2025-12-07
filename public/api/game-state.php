<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Cache-Control: no-cache, no-store, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Create game_state table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS game_state (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_type VARCHAR(50) NOT NULL UNIQUE,
    phase VARCHAR(50) NOT NULL,
    timer INT DEFAULT 15,
    multiplier DECIMAL(10,2) DEFAULT 1.00,
    round_number INT DEFAULT 1,
    dragon_card_value VARCHAR(10) DEFAULT NULL,
    dragon_card_suit VARCHAR(10) DEFAULT NULL,
    tiger_card_value VARCHAR(10) DEFAULT NULL,
    tiger_card_suit VARCHAR(10) DEFAULT NULL,
    winner VARCHAR(20) DEFAULT NULL,
    crash_point DECIMAL(10,2) DEFAULT NULL,
    history TEXT DEFAULT NULL,
    plane_x DECIMAL(10,2) DEFAULT 10,
    plane_y DECIMAL(10,2) DEFAULT 80,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Create game_bets table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS game_bets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_type VARCHAR(50) NOT NULL,
    round_number INT NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    username VARCHAR(100) NOT NULL,
    bet_area VARCHAR(20) DEFAULT NULL,
    bet_amount DECIMAL(10,2) NOT NULL,
    odds VARCHAR(20) DEFAULT 'x0',
    win_amount DECIMAL(10,2) DEFAULT 0,
    cashed_out TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_game_round (game_type, round_number)
)");

// Create active_sessions table to track live players
$conn->query("CREATE TABLE IF NOT EXISTS active_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    game_type VARCHAR(50) NOT NULL,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_game_type (game_type),
    INDEX idx_heartbeat (last_heartbeat)
)");

if ($method === 'GET') {
    $gameType = $_GET['game_type'] ?? 'aviator';
    $sessionId = $_GET['session_id'] ?? null;
    
    // Register/update session heartbeat if provided
    if ($sessionId) {
        $stmt = $conn->prepare("INSERT INTO active_sessions (session_id, game_type, last_heartbeat) 
                                VALUES (?, ?, NOW()) 
                                ON DUPLICATE KEY UPDATE last_heartbeat = NOW(), game_type = ?");
        $stmt->bind_param("sss", $sessionId, $gameType, $gameType);
        $stmt->execute();
    }
    
    // Clean up old sessions (older than 10 seconds)
    $conn->query("DELETE FROM active_sessions WHERE last_heartbeat < DATE_SUB(NOW(), INTERVAL 10 SECOND)");
    
    // Count active players for this game
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM active_sessions WHERE game_type = ?");
    $stmt->bind_param("s", $gameType);
    $stmt->execute();
    $activeResult = $stmt->get_result();
    $activeCount = $activeResult->fetch_assoc()['count'];
    
    $stmt = $conn->prepare("SELECT * FROM game_state WHERE game_type = ?");
    $stmt->bind_param("s", $gameType);
    $stmt->execute();
    $result = $stmt->get_result();
    $state = $result->fetch_assoc();
    
    if (!$state) {
        // Initialize game state with betting phase for dragon-tiger
        $phase = ($gameType === 'dragon-tiger') ? 'betting' : 'waiting';
        $history = json_encode([5.01, 2.60, 3.45, 1.23, 8.92, 1.05]);
        $stmt = $conn->prepare("INSERT INTO game_state (game_type, phase, timer, multiplier, round_number, history) VALUES (?, ?, 15, 1.00, 1, ?)");
        $stmt->bind_param("sss", $gameType, $phase, $history);
        $stmt->execute();
        
        $state = [
            'game_type' => $gameType,
            'phase' => $phase,
            'timer' => 15,
            'multiplier' => 1.00,
            'round_number' => 1,
            'history' => $history,
            'dragon_card_value' => null,
            'dragon_card_suit' => null,
            'tiger_card_value' => null,
            'tiger_card_suit' => null,
            'winner' => null,
            'crash_point' => null,
            'plane_x' => 10,
            'plane_y' => 80
        ];
    }
    
    // Get live bets for this round
    $stmt = $conn->prepare("SELECT mobile, username, bet_area, bet_amount, odds, win_amount, cashed_out FROM game_bets WHERE game_type = ? AND round_number = ? ORDER BY bet_amount DESC");
    $stmt->bind_param("si", $gameType, $state['round_number']);
    $stmt->execute();
    $betsResult = $stmt->get_result();
    $bets = [];
    while ($bet = $betsResult->fetch_assoc()) {
        $bets[] = $bet;
    }
    
    $state['live_bets'] = $bets;
    $state['history'] = json_decode($state['history'] ?? '[]');
    $state['active_players'] = max(1, (int)$activeCount);
    
    echo json_encode(['status' => true, 'state' => $state]);
    
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $gameType = $data['game_type'] ?? 'aviator';
    $action = $data['action'] ?? 'update';
    
    if ($action === 'heartbeat') {
        // Just update session heartbeat
        $sessionId = $data['session_id'] ?? null;
        if ($sessionId) {
            $stmt = $conn->prepare("INSERT INTO active_sessions (session_id, game_type, last_heartbeat) 
                                    VALUES (?, ?, NOW()) 
                                    ON DUPLICATE KEY UPDATE last_heartbeat = NOW(), game_type = ?");
            $stmt->bind_param("sss", $sessionId, $gameType, $gameType);
            $stmt->execute();
        }
        echo json_encode(['status' => true]);
        
    } elseif ($action === 'update') {
        // Update game state (called by game controller/first user)
        $phase = $data['phase'] ?? null;
        $timer = $data['timer'] ?? null;
        $multiplier = $data['multiplier'] ?? null;
        $roundNumber = $data['round_number'] ?? null;
        $history = isset($data['history']) ? json_encode($data['history']) : null;
        $dragonCardValue = $data['dragon_card_value'] ?? null;
        $dragonCardSuit = $data['dragon_card_suit'] ?? null;
        $tigerCardValue = $data['tiger_card_value'] ?? null;
        $tigerCardSuit = $data['tiger_card_suit'] ?? null;
        $winner = $data['winner'] ?? null;
        $crashPoint = $data['crash_point'] ?? null;
        $planeX = $data['plane_x'] ?? null;
        $planeY = $data['plane_y'] ?? null;
        
        // Check if state exists
        $stmt = $conn->prepare("SELECT id FROM game_state WHERE game_type = ?");
        $stmt->bind_param("s", $gameType);
        $stmt->execute();
        $exists = $stmt->get_result()->fetch_assoc();
        
        if ($exists) {
            $updates = [];
            $params = [];
            $types = "";
            
            if ($phase !== null) { $updates[] = "phase = ?"; $params[] = $phase; $types .= "s"; }
            if ($timer !== null) { $updates[] = "timer = ?"; $params[] = $timer; $types .= "i"; }
            if ($multiplier !== null) { $updates[] = "multiplier = ?"; $params[] = $multiplier; $types .= "d"; }
            if ($roundNumber !== null) { $updates[] = "round_number = ?"; $params[] = $roundNumber; $types .= "i"; }
            if ($history !== null) { $updates[] = "history = ?"; $params[] = $history; $types .= "s"; }
            if ($dragonCardValue !== null) { $updates[] = "dragon_card_value = ?"; $params[] = $dragonCardValue; $types .= "s"; }
            if ($dragonCardSuit !== null) { $updates[] = "dragon_card_suit = ?"; $params[] = $dragonCardSuit; $types .= "s"; }
            if ($tigerCardValue !== null) { $updates[] = "tiger_card_value = ?"; $params[] = $tigerCardValue; $types .= "s"; }
            if ($tigerCardSuit !== null) { $updates[] = "tiger_card_suit = ?"; $params[] = $tigerCardSuit; $types .= "s"; }
            if ($winner !== null) { $updates[] = "winner = ?"; $params[] = $winner; $types .= "s"; }
            if ($crashPoint !== null) { $updates[] = "crash_point = ?"; $params[] = $crashPoint; $types .= "d"; }
            if ($planeX !== null) { $updates[] = "plane_x = ?"; $params[] = $planeX; $types .= "d"; }
            if ($planeY !== null) { $updates[] = "plane_y = ?"; $params[] = $planeY; $types .= "d"; }
            
            if (!empty($updates)) {
                $sql = "UPDATE game_state SET " . implode(", ", $updates) . " WHERE game_type = ?";
                $params[] = $gameType;
                $types .= "s";
                
                $stmt = $conn->prepare($sql);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
            }
        } else {
            $defaultPhase = ($gameType === 'dragon-tiger') ? 'betting' : 'waiting';
            $historyDefault = json_encode([5.01, 2.60, 3.45, 1.23, 8.92, 1.05]);
            $stmt = $conn->prepare("INSERT INTO game_state (game_type, phase, timer, multiplier, round_number, history) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssidis", $gameType, $phase ?? $defaultPhase, $timer ?? 15, $multiplier ?? 1.00, $roundNumber ?? 1, $history ?? $historyDefault);
            $stmt->execute();
        }
        
        echo json_encode(['status' => true]);
        
    } elseif ($action === 'place_bet') {
        // Place a bet
        $mobile = $data['mobile'] ?? '';
        $username = $data['username'] ?? '';
        $betArea = $data['bet_area'] ?? null;
        $betAmount = $data['bet_amount'] ?? 0;
        $roundNumber = $data['round_number'] ?? 1;
        
        if (empty($mobile) || $betAmount <= 0) {
            echo json_encode(['status' => false, 'message' => 'Invalid bet']);
            exit;
        }
        
        $stmt = $conn->prepare("INSERT INTO game_bets (game_type, round_number, mobile, username, bet_area, bet_amount) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sisssd", $gameType, $roundNumber, $mobile, $username, $betArea, $betAmount);
        $stmt->execute();
        
        echo json_encode(['status' => true, 'bet_id' => $conn->insert_id]);
        
    } elseif ($action === 'cash_out') {
        // Cash out a bet
        $mobile = $data['mobile'] ?? '';
        $roundNumber = $data['round_number'] ?? 1;
        $odds = $data['odds'] ?? 'x1';
        $winAmount = $data['win_amount'] ?? 0;
        
        $stmt = $conn->prepare("UPDATE game_bets SET cashed_out = 1, odds = ?, win_amount = ? WHERE game_type = ? AND round_number = ? AND mobile = ? AND cashed_out = 0");
        $stmt->bind_param("sdssi", $odds, $winAmount, $gameType, $roundNumber, $mobile);
        $stmt->execute();
        
        echo json_encode(['status' => true]);
        
    } elseif ($action === 'new_round') {
        // Start new round - clear cards, reset timer, increment round
        $newRoundNumber = $data['round_number'] ?? 1;
        $defaultPhase = ($gameType === 'dragon-tiger') ? 'betting' : 'waiting';
        
        $stmt = $conn->prepare("UPDATE game_state SET phase = ?, timer = 15, multiplier = 1.00, round_number = ?, dragon_card_value = NULL, dragon_card_suit = NULL, tiger_card_value = NULL, tiger_card_suit = NULL, winner = NULL, crash_point = NULL, plane_x = 10, plane_y = 80 WHERE game_type = ?");
        $stmt->bind_param("sis", $defaultPhase, $newRoundNumber, $gameType);
        $stmt->execute();
        
        echo json_encode(['status' => true, 'round_number' => $newRoundNumber]);
    }
}

$conn->close();
?>