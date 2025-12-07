<?php
require_once 'config.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Create game_state table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS game_state (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_type VARCHAR(50) NOT NULL UNIQUE,
    phase VARCHAR(50) NOT NULL,
    timer INT DEFAULT 0,
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

if ($method === 'GET') {
    $gameType = $_GET['game_type'] ?? 'aviator';
    
    $stmt = $conn->prepare("SELECT * FROM game_state WHERE game_type = ?");
    $stmt->bind_param("s", $gameType);
    $stmt->execute();
    $result = $stmt->get_result();
    $state = $result->fetch_assoc();
    
    if (!$state) {
        // Initialize game state
        $history = json_encode([5.01, 2.60, 3.45, 1.23, 8.92, 1.05]);
        $stmt = $conn->prepare("INSERT INTO game_state (game_type, phase, timer, multiplier, round_number, history) VALUES (?, 'waiting', 5, 1.00, 1, ?)");
        $stmt->bind_param("ss", $gameType, $history);
        $stmt->execute();
        
        $state = [
            'game_type' => $gameType,
            'phase' => 'waiting',
            'timer' => 5,
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
    
    echo json_encode(['status' => true, 'state' => $state]);
    
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $gameType = $data['game_type'] ?? 'aviator';
    $action = $data['action'] ?? 'update';
    
    if ($action === 'update') {
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
            $historyDefault = json_encode([5.01, 2.60, 3.45, 1.23, 8.92, 1.05]);
            $stmt = $conn->prepare("INSERT INTO game_state (game_type, phase, timer, multiplier, round_number, history) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssidis", $gameType, $phase ?? 'waiting', $timer ?? 5, $multiplier ?? 1.00, $roundNumber ?? 1, $history ?? $historyDefault);
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
        
        $stmt = $conn->prepare("UPDATE game_state SET phase = 'waiting', timer = 15, multiplier = 1.00, round_number = ?, dragon_card_value = NULL, dragon_card_suit = NULL, tiger_card_value = NULL, tiger_card_suit = NULL, winner = NULL, crash_point = NULL, plane_x = 10, plane_y = 80 WHERE game_type = ?");
        $stmt->bind_param("is", $newRoundNumber, $gameType);
        $stmt->execute();
        
        echo json_encode(['status' => true, 'round_number' => $newRoundNumber]);
    }
}

$conn->close();
?>
