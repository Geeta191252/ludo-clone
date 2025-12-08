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
        // Cash out a specific bet (by bet_area)
        $mobile = $data['mobile'] ?? '';
        $roundNumber = $data['round_number'] ?? 1;
        $odds = $data['odds'] ?? 'x1';
        $winAmount = $data['win_amount'] ?? 0;
        $betArea = $data['bet_area'] ?? null;
        
        // Cash out only the specific bet area (bet1 or bet2)
        if ($betArea) {
            $stmt = $conn->prepare("UPDATE game_bets SET cashed_out = 1, odds = ?, win_amount = ? WHERE game_type = ? AND round_number = ? AND mobile = ? AND bet_area = ? AND cashed_out = 0 LIMIT 1");
            $stmt->bind_param("sdsiss", $odds, $winAmount, $gameType, $roundNumber, $mobile, $betArea);
        } else {
            // Fallback: cash out first uncashed bet
            $stmt = $conn->prepare("UPDATE game_bets SET cashed_out = 1, odds = ?, win_amount = ? WHERE game_type = ? AND round_number = ? AND mobile = ? AND cashed_out = 0 LIMIT 1");
            $stmt->bind_param("sdssi", $odds, $winAmount, $gameType, $roundNumber, $mobile);
        }
        $stmt->execute();
        
        echo json_encode(['status' => true]);
    
    } elseif ($action === 'cancel_bet') {
        // Cancel/delete a bet
        $mobile = $data['mobile'] ?? '';
        $roundNumber = $data['round_number'] ?? 1;
        $betArea = $data['bet_area'] ?? null;
        
        if ($betArea) {
            $stmt = $conn->prepare("DELETE FROM game_bets WHERE game_type = ? AND round_number = ? AND mobile = ? AND bet_area = ? AND cashed_out = 0 LIMIT 1");
            $stmt->bind_param("siss", $gameType, $roundNumber, $mobile, $betArea);
        } else {
            $stmt = $conn->prepare("DELETE FROM game_bets WHERE game_type = ? AND round_number = ? AND mobile = ? AND cashed_out = 0 LIMIT 1");
            $stmt->bind_param("sis", $gameType, $roundNumber, $mobile);
        }
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

    } elseif ($action === 'set_winner') {
        // Set winner manually by admin
        $winner = $data['winner'] ?? '';
        $roundNumber = $data['round_id'] ?? 1;
        
        if (!in_array($winner, ['dragon', 'tiger', 'tie'])) {
            echo json_encode(['status' => false, 'message' => 'Invalid winner']);
            exit;
        }
        
        // Get current history and add new winner
        $stmt = $conn->prepare("SELECT history FROM game_state WHERE game_type = ?");
        $stmt->bind_param("s", $gameType);
        $stmt->execute();
        $historyResult = $stmt->get_result();
        $historyRow = $historyResult->fetch_assoc();
        $currentHistory = json_decode($historyRow['history'] ?? '[]', true);
        if (!is_array($currentHistory)) $currentHistory = [];
        
        // Add new winner at the beginning (most recent first)
        array_unshift($currentHistory, ['winner' => $winner, 'round' => $roundNumber]);
        // Keep only last 50 entries
        $currentHistory = array_slice($currentHistory, 0, 50);
        $updatedHistory = json_encode($currentHistory);
        
        // Update game state with winner, history and set phase to result
        $stmt = $conn->prepare("UPDATE game_state SET winner = ?, phase = 'result', history = ? WHERE game_type = ?");
        $stmt->bind_param("sss", $winner, $updatedHistory, $gameType);
        $stmt->execute();
        
        // Calculate multiplier - Tie = 8x, Dragon/Tiger = 2x
        $multiplier = ($winner === 'tie') ? 8 : 2;
        
        // Get all winning bets for this round
        $stmt = $conn->prepare("SELECT * FROM game_bets WHERE game_type = ? AND round_number = ? AND bet_area = ? AND cashed_out = 0");
        $stmt->bind_param("sis", $gameType, $roundNumber, $winner);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($bet = $result->fetch_assoc()) {
            $winAmount = $bet['bet_amount'] * $multiplier;
            
            // Add winning amount to user's winning_balance
            $stmt2 = $conn->prepare("UPDATE users SET winning_balance = winning_balance + ? WHERE mobile = ?");
            $stmt2->bind_param("ds", $winAmount, $bet['mobile']);
            $stmt2->execute();
            
            // Mark bet as won with win amount
            $stmt3 = $conn->prepare("UPDATE game_bets SET win_amount = ?, cashed_out = 1 WHERE id = ?");
            $stmt3->bind_param("di", $winAmount, $bet['id']);
            $stmt3->execute();
        }
        
        // Mark losing bets as processed
        $stmt = $conn->prepare("UPDATE game_bets SET cashed_out = 1 WHERE game_type = ? AND round_number = ? AND bet_area != ? AND cashed_out = 0");
        $stmt->bind_param("sis", $gameType, $roundNumber, $winner);
        $stmt->execute();
        
        echo json_encode(['status' => true, 'winner' => $winner, 'message' => 'Winner set and payouts processed']);
        
    } elseif ($action === 'auto_set_winner') {
        // Auto select winner based on betting amounts (house profit maximization)
        
        // First get the current round_number from game_state (most reliable)
        $stmt = $conn->prepare("SELECT round_number FROM game_state WHERE game_type = ?");
        $stmt->bind_param("s", $gameType);
        $stmt->execute();
        $roundResult = $stmt->get_result();
        $roundRow = $roundResult->fetch_assoc();
        $roundNumber = $roundRow['round_number'] ?? 1;
        
        // Get total bets for each area for this round
        $stmt = $conn->prepare("SELECT bet_area, SUM(bet_amount) as total FROM game_bets WHERE game_type = ? AND round_number = ? AND cashed_out = 0 GROUP BY bet_area");
        $stmt->bind_param("si", $gameType, $roundNumber);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $dragonTotal = 0;
        $tigerTotal = 0;
        $tieTotal = 0;
        
        while ($row = $result->fetch_assoc()) {
            if ($row['bet_area'] === 'dragon') $dragonTotal = (float)$row['total'];
            else if ($row['bet_area'] === 'tiger') $tigerTotal = (float)$row['total'];
            else if ($row['bet_area'] === 'tie') $tieTotal = (float)$row['total'];
        }
        
        // Calculate potential payouts for each winner
        // Dragon/Tiger = 2x, Tie = 8x
        $dragonPayout = $dragonTotal * 2;  // If dragon wins, pay this
        $tigerPayout = $tigerTotal * 2;    // If tiger wins, pay this
        $tiePayout = $tieTotal * 8;        // If tie wins, pay this
        
        // Calculate house profit for each scenario
        $totalBets = $dragonTotal + $tigerTotal + $tieTotal;
        $profitIfDragonWins = $totalBets - $dragonPayout;  // House collects all, pays dragon winners
        $profitIfTigerWins = $totalBets - $tigerPayout;    // House collects all, pays tiger winners
        $profitIfTieWins = $totalBets - $tiePayout;        // House collects all, pays tie winners
        
        // Find winner with maximum house profit (minimum payout)
        $winner = 'dragon';
        $maxProfit = $profitIfDragonWins;
        
        if ($profitIfTigerWins > $maxProfit) {
            $winner = 'tiger';
            $maxProfit = $profitIfTigerWins;
        }
        
        // Only select tie if it's profitable (tie pays 8x so usually high risk)
        if ($profitIfTieWins > $maxProfit) {
            $winner = 'tie';
            $maxProfit = $profitIfTieWins;
        }
        
        // If no bets at all, randomly select dragon or tiger
        if ($totalBets == 0) {
            $winner = (rand(0, 1) === 0) ? 'dragon' : 'tiger';
        }
        
        // Get current history
        $stmt = $conn->prepare("SELECT history FROM game_state WHERE game_type = ?");
        $stmt->bind_param("s", $gameType);
        $stmt->execute();
        $historyResult = $stmt->get_result();
        $historyRow = $historyResult->fetch_assoc();
        $currentHistory = json_decode($historyRow['history'] ?? '[]', true);
        if (!is_array($currentHistory)) $currentHistory = [];
        
        // Add new winner at the beginning (most recent first)
        array_unshift($currentHistory, ['winner' => $winner, 'round' => $roundNumber]);
        // Keep only last 50 entries
        $currentHistory = array_slice($currentHistory, 0, 50);
        $updatedHistory = json_encode($currentHistory);
        
        // Update game state with winner, history and set phase to result
        $stmt = $conn->prepare("UPDATE game_state SET winner = ?, phase = 'result', history = ? WHERE game_type = ?");
        $stmt->bind_param("sss", $winner, $updatedHistory, $gameType);
        $stmt->execute();
        
        // Calculate multiplier
        $multiplier = ($winner === 'tie') ? 8 : 2;
        
        // Get all winning bets for this round
        $stmt = $conn->prepare("SELECT * FROM game_bets WHERE game_type = ? AND round_number = ? AND bet_area = ? AND cashed_out = 0");
        $stmt->bind_param("sis", $gameType, $roundNumber, $winner);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($bet = $result->fetch_assoc()) {
            $winAmount = $bet['bet_amount'] * $multiplier;
            
            // Add winning amount to user's winning_balance
            $stmt2 = $conn->prepare("UPDATE users SET winning_balance = winning_balance + ? WHERE mobile = ?");
            $stmt2->bind_param("ds", $winAmount, $bet['mobile']);
            $stmt2->execute();
            
            // Mark bet as won with win amount
            $stmt3 = $conn->prepare("UPDATE game_bets SET win_amount = ?, cashed_out = 1 WHERE id = ?");
            $stmt3->bind_param("di", $winAmount, $bet['id']);
            $stmt3->execute();
        }
        
        // Mark losing bets as processed
        $stmt = $conn->prepare("UPDATE game_bets SET cashed_out = 1 WHERE game_type = ? AND round_number = ? AND bet_area != ? AND cashed_out = 0");
        $stmt->bind_param("sis", $gameType, $roundNumber, $winner);
        $stmt->execute();
        
        echo json_encode([
            'status' => true, 
            'winner' => $winner, 
            'bets' => [
                'dragon' => $dragonTotal,
                'tiger' => $tigerTotal,
                'tie' => $tieTotal
            ],
            'profit' => $maxProfit,
            'message' => 'Auto winner selected: ' . strtoupper($winner) . ' (House profit: ₹' . $maxProfit . ')'
        ]);
    }
}

$conn->close();
?>