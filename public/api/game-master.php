<?php
// Game Master - Single Source of Truth
// This file manages the game loop - uses locking to ensure ONLY ONE client runs the tick
// This prevents race conditions when multiple devices are connected

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
$gameType = $_GET['game_type'] ?? 'aviator';
$action = $_GET['action'] ?? 'tick';
$clientSession = $_GET['session_id'] ?? 'unknown';

// Create game_lock table if not exists to prevent multiple clients from running game tick
$conn->query("CREATE TABLE IF NOT EXISTS game_lock (
    game_type VARCHAR(50) PRIMARY KEY,
    lock_holder VARCHAR(100) DEFAULT NULL,
    last_tick TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    tick_count INT DEFAULT 0
)");

// Initialize lock row if not exists
$stmt = $conn->prepare("INSERT IGNORE INTO game_lock (game_type, last_tick) VALUES (?, NOW())");
$stmt->bind_param("s", $gameType);
$stmt->execute();

// Try to acquire lock - only proceed if lock is stale (>500ms for flying phase) or we already hold it
$stmt = $conn->prepare("UPDATE game_lock 
    SET lock_holder = ?, last_tick = NOW(), tick_count = tick_count + 1 
    WHERE game_type = ? 
    AND (lock_holder IS NULL OR lock_holder = ? OR last_tick < DATE_SUB(NOW(), INTERVAL 500 MILLISECOND))");
$stmt->bind_param("sss", $clientSession, $gameType, $clientSession);
$stmt->execute();

$canTick = $conn->affected_rows > 0;

// If we don't have the lock, just return current state without modifying
if (!$canTick) {
    $stmt = $conn->prepare("SELECT * FROM game_state WHERE game_type = ?");
    $stmt->bind_param("s", $gameType);
    $stmt->execute();
    $state = $stmt->get_result()->fetch_assoc();
    
    if ($state) {
        $state['history'] = json_decode($state['history'] ?? '[]');
    }
    
    echo json_encode(['status' => 'slave', 'can_tick' => false, 'state' => $state]);
    $conn->close();
    exit();
}

// We have the lock - proceed with game tick
$CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
$CARD_SUITS = ['♠', '♥', '♦', '♣'];

$stmt = $conn->prepare("SELECT * FROM game_state WHERE game_type = ?");
$stmt->bind_param("s", $gameType);
$stmt->execute();
$state = $stmt->get_result()->fetch_assoc();

if (!$state) {
    $history = json_encode([5.01, 2.60, 3.45, 1.23, 8.92, 1.05]);
    $initialPhase = $gameType === 'dragon-tiger' ? 'betting' : 'waiting';
    $stmt = $conn->prepare("INSERT INTO game_state (game_type, phase, timer, multiplier, round_number, history) VALUES (?, ?, 12, 1.00, 1, ?)");
    $stmt->bind_param("sss", $gameType, $initialPhase, $history);
    $stmt->execute();
    
    echo json_encode(['status' => 'master', 'can_tick' => true, 'message' => 'Initialized']);
    $conn->close();
    exit;
}

if ($action === 'tick') {
    $phase = $state['phase'];
    $timer = (int)$state['timer'];
    $multiplier = (float)$state['multiplier'];
    $roundNumber = (int)$state['round_number'];
    $history = json_decode($state['history'] ?? '[]', true);
    
    if ($gameType === 'aviator') {
        if ($phase === 'waiting') {
            $timer--;
            if ($timer <= 0) {
                // Start flying
                $phase = 'flying';
                $multiplier = 1.00;
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'flying', timer = 0, multiplier = 1.00, plane_x = 10, plane_y = 80 WHERE game_type = ?");
                $stmt->bind_param("s", $gameType);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE game_state SET timer = ? WHERE game_type = ?");
                $stmt->bind_param("is", $timer, $gameType);
                $stmt->execute();
            }
        } elseif ($phase === 'flying') {
            // Increase multiplier
            $increment = (mt_rand(2, 8) / 100);
            $multiplier += $increment;
            
            // Calculate crash chance
            $crashChance = ($multiplier - 1) * 0.012;
            $shouldCrash = (mt_rand(1, 1000) / 1000) < $crashChance || $multiplier > 20;
            
            // Update plane position
            $progress = min(($multiplier - 1) / 10, 1);
            $curve = pow($progress, 0.5);
            $planeX = 5 + $curve * 70;
            $planeY = 95 - $curve * 65;
            
            if ($shouldCrash) {
                // Crashed
                $crashPoint = round($multiplier, 2);
                array_unshift($history, $crashPoint);
                $history = array_slice($history, 0, 20);
                $historyJson = json_encode($history);
                
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'crashed', multiplier = ?, crash_point = ?, history = ?, plane_x = ?, plane_y = ? WHERE game_type = ?");
                $stmt->bind_param("ddsdds", $multiplier, $crashPoint, $historyJson, $planeX, $planeY, $gameType);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE game_state SET multiplier = ?, plane_x = ?, plane_y = ? WHERE game_type = ?");
                $stmt->bind_param("ddds", $multiplier, $planeX, $planeY, $gameType);
                $stmt->execute();
            }
        } elseif ($phase === 'crashed') {
            // Wait 3 seconds then reset
            $timer++;
            if ($timer >= 3) {
                $newRound = $roundNumber + 1;
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'waiting', timer = 12, multiplier = 1.00, round_number = ?, crash_point = NULL, plane_x = 10, plane_y = 80 WHERE game_type = ?");
                $stmt->bind_param("is", $newRound, $gameType);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE game_state SET timer = ? WHERE game_type = ?");
                $stmt->bind_param("is", $timer, $gameType);
                $stmt->execute();
            }
        }
    } elseif ($gameType === 'dragon-tiger') {
        if ($phase === 'betting' || $phase === 'waiting') {
            if ($phase === 'waiting') {
                $phase = 'betting';
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'betting' WHERE game_type = ?");
                $stmt->bind_param("s", $gameType);
                $stmt->execute();
            }
            
            $timer--;
            if ($timer <= 0) {
                // Deal cards
                $phase = 'dealing';
                
                // Determine winner
                $weights = [45, 45, 10];
                $rand = mt_rand(1, 100);
                if ($rand <= $weights[0]) {
                    $winner = 'dragon';
                } elseif ($rand <= $weights[0] + $weights[1]) {
                    $winner = 'tiger';
                } else {
                    $winner = 'tie';
                }
                
                // Generate cards based on winner
                if ($winner === 'dragon') {
                    $dragonValue = mt_rand(7, 12);
                    $tigerValue = mt_rand(0, $dragonValue - 1);
                } elseif ($winner === 'tiger') {
                    $tigerValue = mt_rand(7, 12);
                    $dragonValue = mt_rand(0, $tigerValue - 1);
                } else {
                    $dragonValue = mt_rand(0, 12);
                    $tigerValue = $dragonValue;
                }
                
                $dragonCardValue = $CARD_VALUES[$dragonValue];
                $dragonCardSuit = $CARD_SUITS[mt_rand(0, 3)];
                $tigerCardValue = $CARD_VALUES[$tigerValue];
                $tigerCardSuit = $CARD_SUITS[mt_rand(0, 3)];
                
                array_unshift($history, ['id' => time(), 'winner' => $winner]);
                $history = array_slice($history, 0, 20);
                $historyJson = json_encode($history);
                
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'dealing', timer = 0, dragon_card_value = ?, dragon_card_suit = ?, tiger_card_value = ?, tiger_card_suit = ?, winner = ?, history = ? WHERE game_type = ?");
                $stmt->bind_param("sssssss", $dragonCardValue, $dragonCardSuit, $tigerCardValue, $tigerCardSuit, $winner, $historyJson, $gameType);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE game_state SET timer = ? WHERE game_type = ?");
                $stmt->bind_param("is", $timer, $gameType);
                $stmt->execute();
            }
        } elseif ($phase === 'dealing') {
            $timer++;
            if ($timer >= 3) {
                $phase = 'result';
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'result', timer = 0 WHERE game_type = ?");
                $stmt->bind_param("s", $gameType);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE game_state SET timer = ? WHERE game_type = ?");
                $stmt->bind_param("is", $timer, $gameType);
                $stmt->execute();
            }
        } elseif ($phase === 'result') {
            $timer++;
            if ($timer >= 2) {
                $newRound = $roundNumber + 1;
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'betting', timer = 15, round_number = ?, dragon_card_value = NULL, dragon_card_suit = NULL, tiger_card_value = NULL, tiger_card_suit = NULL, winner = NULL WHERE game_type = ?");
                $stmt->bind_param("is", $newRound, $gameType);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE game_state SET timer = ? WHERE game_type = ?");
                $stmt->bind_param("is", $timer, $gameType);
                $stmt->execute();
            }
        }
    }
    
    echo json_encode(['status' => 'master', 'can_tick' => true, 'phase' => $phase, 'timer' => $timer, 'multiplier' => $multiplier]);
}

$conn->close();
?>
