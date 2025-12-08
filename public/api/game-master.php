<?php
// Game Master - Single Source of Truth
// This file manages the game loop - uses time-based throttling
// All clients can call this, game state is synchronized via database

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

$CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
$CARD_SUITS = ['♠', '♥', '♦', '♣'];

// Ensure last_tick_ms column exists for precise timing
$conn->query("ALTER TABLE game_state ADD COLUMN IF NOT EXISTS last_tick_ms BIGINT DEFAULT 0");

// Get current state
$stmt = $conn->prepare("SELECT * FROM game_state WHERE game_type = ?");
$stmt->bind_param("s", $gameType);
$stmt->execute();
$state = $stmt->get_result()->fetch_assoc();

if (!$state) {
    $history = json_encode([5.01, 2.60, 3.45, 1.23, 8.92, 1.05]);
    $initialPhase = $gameType === 'dragon-tiger' ? 'betting' : 'waiting';
    $currentMs = round(microtime(true) * 1000);
    $stmt = $conn->prepare("INSERT INTO game_state (game_type, phase, timer, multiplier, round_number, history, last_tick_ms) VALUES (?, ?, 12, 1.00, 1, ?, ?)");
    $stmt->bind_param("sssi", $gameType, $initialPhase, $history, $currentMs);
    $stmt->execute();
    
    echo json_encode(['status' => 'ok', 'can_tick' => true, 'message' => 'Initialized']);
    $conn->close();
    exit;
}

// Check time since last tick using milliseconds
$lastTickMs = (int)($state['last_tick_ms'] ?? 0);
$currentMs = round(microtime(true) * 1000);
$timeSinceLastTick = $currentMs - $lastTickMs;

// Determine minimum interval based on phase
$phase = $state['phase'];
$minIntervalMs = 120; // 120ms for flying phase

if ($phase === 'waiting' || $phase === 'crashed') {
    $minIntervalMs = 900; // ~1 second for waiting/crashed
}

// Skip if not enough time has passed
if ($timeSinceLastTick < $minIntervalMs) {
    $state['history'] = json_decode($state['history'] ?? '[]');
    echo json_encode(['status' => 'skip', 'can_tick' => false, 'state' => $state, 'wait' => $minIntervalMs - $timeSinceLastTick]);
    $conn->close();
    exit();
}

if ($action === 'tick') {
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
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'flying', timer = 0, multiplier = 1.00, plane_x = 10, plane_y = 80, last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("is", $currentMs, $gameType);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE game_state SET timer = ?, last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("iis", $timer, $currentMs, $gameType);
                $stmt->execute();
            }
        } elseif ($phase === 'flying') {
            // Increase multiplier
            $increment = (mt_rand(3, 10) / 100);
            $multiplier += $increment;
            
            // Calculate crash chance - increases as multiplier grows
            $crashChance = pow(($multiplier - 1), 1.5) * 0.015;
            $randomValue = mt_rand(1, 1000) / 1000;
            $shouldCrash = $randomValue < $crashChance || $multiplier > 15;
            
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
                $phase = 'crashed';
                
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'crashed', timer = 0, multiplier = ?, crash_point = ?, history = ?, plane_x = ?, plane_y = ?, last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("ddsddis", $multiplier, $crashPoint, $historyJson, $planeX, $planeY, $currentMs, $gameType);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE game_state SET multiplier = ?, plane_x = ?, plane_y = ?, last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("dddis", $multiplier, $planeX, $planeY, $currentMs, $gameType);
                $stmt->execute();
            }
        } elseif ($phase === 'crashed') {
            // Wait 3 seconds then reset
            $timer++;
            if ($timer >= 3) {
                $newRound = $roundNumber + 1;
                $phase = 'waiting';
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'waiting', timer = 12, multiplier = 1.00, round_number = ?, crash_point = NULL, plane_x = 10, plane_y = 80, last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("iis", $newRound, $currentMs, $gameType);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE game_state SET timer = ?, last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("iis", $timer, $currentMs, $gameType);
                $stmt->execute();
            }
        }
    } elseif ($gameType === 'dragon-tiger') {
        if ($phase === 'betting' || $phase === 'waiting') {
            if ($phase === 'waiting') {
                $phase = 'betting';
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'betting', last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("is", $currentMs, $gameType);
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
                
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'dealing', timer = 0, dragon_card_value = ?, dragon_card_suit = ?, tiger_card_value = ?, tiger_card_suit = ?, winner = ?, history = ?, last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("ssssssis", $dragonCardValue, $dragonCardSuit, $tigerCardValue, $tigerCardSuit, $winner, $historyJson, $currentMs, $gameType);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE game_state SET timer = ?, last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("iis", $timer, $currentMs, $gameType);
                $stmt->execute();
            }
        } elseif ($phase === 'dealing') {
            $timer++;
            if ($timer >= 3) {
                $phase = 'result';
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'result', timer = 0, last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("is", $currentMs, $gameType);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE game_state SET timer = ?, last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("iis", $timer, $currentMs, $gameType);
                $stmt->execute();
            }
        } elseif ($phase === 'result') {
            $timer++;
            if ($timer >= 2) {
                $newRound = $roundNumber + 1;
                $stmt = $conn->prepare("UPDATE game_state SET phase = 'betting', timer = 15, round_number = ?, dragon_card_value = NULL, dragon_card_suit = NULL, tiger_card_value = NULL, tiger_card_suit = NULL, winner = NULL, last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("iis", $newRound, $currentMs, $gameType);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE game_state SET timer = ?, last_tick_ms = ? WHERE game_type = ?");
                $stmt->bind_param("iis", $timer, $currentMs, $gameType);
                $stmt->execute();
            }
        }
    }
    
    echo json_encode(['status' => 'ok', 'can_tick' => true, 'phase' => $phase, 'timer' => $timer, 'multiplier' => $multiplier]);
}

$conn->close();
?>