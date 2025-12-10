<?php
// Enable detailed error logging to file but not to output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

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

// Custom database connection with detailed error reporting
function getLudoDBConnection(&$error_message) {
    // Include config for constants only
    if (!defined('DB_HOST')) {
        @include_once 'config.php';
    }
    
    // Check if constants are defined
    if (!defined('DB_HOST')) {
        $error_message = 'DB_HOST not defined';
        return null;
    }
    if (!defined('DB_USER')) {
        $error_message = 'DB_USER not defined';
        return null;
    }
    if (!defined('DB_PASS')) {
        $error_message = 'DB_PASS not defined';
        return null;
    }
    if (!defined('DB_NAME')) {
        $error_message = 'DB_NAME not defined';
        return null;
    }
    
    // Create connection - allow errors to be captured
    mysqli_report(MYSQLI_REPORT_OFF);
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_errno) {
        $error_message = 'MySQL Error (' . $conn->connect_errno . '): ' . $conn->connect_error;
        return null;
    }
    
    $conn->set_charset('utf8mb4');
    return $conn;
}

// Get database connection
$db_error = '';
$conn = getLudoDBConnection($db_error);

if (!$conn) {
    echo json_encode(['success' => false, 'message' => $db_error ?: 'Database connection failed', 'debug' => ['host' => defined('DB_HOST') ? DB_HOST : 'undefined', 'user' => defined('DB_USER') ? DB_USER : 'undefined', 'db' => defined('DB_NAME') ? DB_NAME : 'undefined']]);
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
    status ENUM('open', 'requested', 'running', 'completed', 'cancelled') DEFAULT 'open',
    room_code VARCHAR(20) DEFAULT NULL,
    winner_id VARCHAR(50) DEFAULT NULL,
    creator_result VARCHAR(20) DEFAULT NULL,
    opponent_result VARCHAR(20) DEFAULT NULL,
    creator_screenshot TEXT DEFAULT NULL,
    opponent_screenshot TEXT DEFAULT NULL,
    game_type VARCHAR(50) DEFAULT 'ludo-classic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Alter table to add columns if needed
@$conn->query("ALTER TABLE ludo_battles MODIFY COLUMN status ENUM('open', 'requested', 'running', 'completed', 'cancelled') DEFAULT 'open'");
@$conn->query("ALTER TABLE ludo_battles ADD COLUMN room_code VARCHAR(20) DEFAULT NULL");
@$conn->query("ALTER TABLE ludo_battles ADD COLUMN creator_result VARCHAR(20) DEFAULT NULL");
@$conn->query("ALTER TABLE ludo_battles ADD COLUMN opponent_result VARCHAR(20) DEFAULT NULL");
@$conn->query("ALTER TABLE ludo_battles ADD COLUMN creator_screenshot TEXT DEFAULT NULL");
@$conn->query("ALTER TABLE ludo_battles ADD COLUMN opponent_screenshot TEXT DEFAULT NULL");
@$conn->query("ALTER TABLE ludo_battles ADD COLUMN game_type VARCHAR(50) DEFAULT 'ludo-classic'");

if (!$tableCreated) {
    echo json_encode(['success' => false, 'message' => 'Table creation failed: ' . $conn->error]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get game_type from query parameter
    $gameType = isset($_GET['game_type']) ? $conn->real_escape_string($_GET['game_type']) : '';
    $gameTypeCondition = $gameType ? " AND game_type = '$gameType'" : "";
    
    // Get all open, requested and running battles
    $openBattles = [];
    $requestedBattles = [];
    $runningBattles = [];
    
    // Open battles (waiting for someone to click Play)
    $result = $conn->query("SELECT * FROM ludo_battles WHERE status = 'open'$gameTypeCondition ORDER BY created_at DESC LIMIT 20");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $openBattles[] = [
                'id' => $row['id'],
                'creatorId' => $row['creator_id'],
                'creatorName' => $row['creator_name'],
                'entryFee' => (int)$row['entry_fee'],
                'prize' => (int)$row['prize'],
                'createdAt' => $row['created_at'],
                'gameType' => $row['game_type'] ?? 'ludo-classic'
            ];
        }
    }
    
    // Requested battles (someone clicked Play, waiting for creator to Start/Reject)
    $result = $conn->query("SELECT * FROM ludo_battles WHERE status = 'requested'$gameTypeCondition ORDER BY updated_at DESC LIMIT 20");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $requestedBattles[] = [
                'id' => $row['id'],
                'creatorId' => $row['creator_id'],
                'creatorName' => $row['creator_name'],
                'opponentId' => $row['opponent_id'],
                'opponentName' => $row['opponent_name'],
                'entryFee' => (int)$row['entry_fee'],
                'prize' => (int)$row['prize'],
                'gameType' => $row['game_type'] ?? 'ludo-classic'
            ];
        }
    }
    
    // Running battles
    $result = $conn->query("SELECT * FROM ludo_battles WHERE status = 'running'$gameTypeCondition ORDER BY updated_at DESC LIMIT 20");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $runningBattles[] = [
                'id' => $row['id'],
                'player1' => ['id' => $row['creator_id'], 'name' => $row['creator_name']],
                'player2' => ['id' => $row['opponent_id'], 'name' => $row['opponent_name']],
                'entryFee' => (int)$row['entry_fee'],
                'prize' => (int)$row['prize'],
                'roomCode' => $row['room_code'],
                'gameType' => $row['game_type'] ?? 'ludo-classic'
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
            $gameType = $conn->real_escape_string($data['gameType'] ?? 'ludo-classic');
            $prize = (int)floor($entryFee * 2 - $entryFee * 0.05);
            
            if (empty($creatorId) || $entryFee <= 0) {
                echo json_encode(['success' => false, 'message' => 'Invalid data - creatorId or entryFee missing']);
                exit();
            }
            
            $sql = "INSERT INTO ludo_battles (id, creator_id, creator_name, entry_fee, prize, game_type) VALUES ('$id', '$creatorId', '$creatorName', $entryFee, $prize, '$gameType')";
            
            if ($conn->query($sql)) {
                echo json_encode([
                    'success' => true,
                    'battle' => [
                        'id' => $id,
                        'creatorId' => $creatorId,
                        'creatorName' => $creatorName,
                        'entryFee' => $entryFee,
                        'prize' => $prize,
                        'gameType' => $gameType
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
            // Creator clicks Start - move to running and deduct balance from both players
            $battleId = $conn->real_escape_string($data['battleId'] ?? '');
            $creatorId = $conn->real_escape_string($data['creatorId'] ?? '');
            
            // Get battle details first
            $battleCheck = $conn->query("SELECT * FROM ludo_battles WHERE id = '$battleId' AND creator_id = '$creatorId' AND status = 'requested'");
            if (!$battleCheck || !$battleRow = $battleCheck->fetch_assoc()) {
                echo json_encode(['success' => false, 'message' => 'Battle not found or already started']);
                break;
            }
            
            $entryFee = (int)$battleRow['entry_fee'];
            $opponentId = $battleRow['opponent_id'];
            
            // Check creator balance
            $creatorBalance = $conn->query("SELECT wallet_balance, winning_balance FROM users WHERE mobile = '$creatorId'");
            if ($creatorBalance && $creatorRow = $creatorBalance->fetch_assoc()) {
                $totalCreatorBalance = floatval($creatorRow['wallet_balance']) + floatval($creatorRow['winning_balance']);
                if ($totalCreatorBalance < $entryFee) {
                    echo json_encode(['success' => false, 'message' => 'Creator has insufficient balance']);
                    break;
                }
            }
            
            // Check opponent balance
            $opponentBalance = $conn->query("SELECT wallet_balance, winning_balance FROM users WHERE mobile = '$opponentId'");
            if ($opponentBalance && $opponentRow = $opponentBalance->fetch_assoc()) {
                $totalOpponentBalance = floatval($opponentRow['wallet_balance']) + floatval($opponentRow['winning_balance']);
                if ($totalOpponentBalance < $entryFee) {
                    echo json_encode(['success' => false, 'message' => 'Opponent has insufficient balance']);
                    break;
                }
            }
            
            // Start transaction
            $conn->begin_transaction();
            
            try {
                // Deduct from creator - first from wallet, then from winning
                $creatorWallet = floatval($creatorRow['wallet_balance']);
                $creatorWinning = floatval($creatorRow['winning_balance']);
                
                if ($creatorWallet >= $entryFee) {
                    $conn->query("UPDATE users SET wallet_balance = wallet_balance - $entryFee WHERE mobile = '$creatorId'");
                } else {
                    $fromWinning = $entryFee - $creatorWallet;
                    $conn->query("UPDATE users SET wallet_balance = 0, winning_balance = winning_balance - $fromWinning WHERE mobile = '$creatorId'");
                }
                
                // Deduct from opponent - first from wallet, then from winning
                $opponentWallet = floatval($opponentRow['wallet_balance']);
                $opponentWinning = floatval($opponentRow['winning_balance']);
                
                if ($opponentWallet >= $entryFee) {
                    $conn->query("UPDATE users SET wallet_balance = wallet_balance - $entryFee WHERE mobile = '$opponentId'");
                } else {
                    $fromWinning = $entryFee - $opponentWallet;
                    $conn->query("UPDATE users SET wallet_balance = 0, winning_balance = winning_balance - $fromWinning WHERE mobile = '$opponentId'");
                }
                
                // Update battle status to running
                $conn->query("UPDATE ludo_battles SET status = 'running' WHERE id = '$battleId'");
                
                $conn->commit();
                echo json_encode(['success' => true, 'message' => 'Battle started! Entry fees deducted from both players.']);
            } catch (Exception $e) {
                $conn->rollback();
                echo json_encode(['success' => false, 'message' => 'Failed to process payment']);
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
            
        case 'submit_result':
            // Handle result submission with screenshot
            $battleId = $conn->real_escape_string($data['battleId'] ?? '');
            $userId = $conn->real_escape_string($data['userId'] ?? '');
            $result_type = $conn->real_escape_string($data['result'] ?? '');
            $screenshot = $data['screenshot'] ?? null;
            $mobile = $conn->real_escape_string($data['mobile'] ?? '');
            
            // Get battle details
            $battleResult = $conn->query("SELECT * FROM ludo_battles WHERE id = '$battleId' AND status = 'running'");
            if (!$battleResult || !$battle_data = $battleResult->fetch_assoc()) {
                echo json_encode(['success' => false, 'message' => 'Battle not found or not running']);
                break;
            }
            
            // Get entry fee from database, not client request
            $entryFee = (int)$battle_data['entry_fee'];
            
            $isCreator = ($userId === $battle_data['creator_id'] || $userId === 'YOU');
            $isOpponent = ($userId === $battle_data['opponent_id'] || $userId === 'YOU');
            
            // Determine which player is submitting based on context
            // If creator_result is null and user claims to be YOU as creator, treat as creator
            // This is a simplified check - in production, use proper user session
            if ($battle_data['creator_result'] === null && $result_type !== null) {
                // First submission - could be either player
                if ($isCreator || $battle_data['opponent_result'] !== null) {
                    // Treat as creator
                    $updateField = 'creator_result';
                    $screenshotField = 'creator_screenshot';
                    $submitter = 'creator';
                } else {
                    $updateField = 'opponent_result';
                    $screenshotField = 'opponent_screenshot';
                    $submitter = 'opponent';
                }
            } else if ($battle_data['creator_result'] !== null && $battle_data['opponent_result'] === null) {
                // Creator already submitted, this must be opponent
                $updateField = 'opponent_result';
                $screenshotField = 'opponent_screenshot';
                $submitter = 'opponent';
            } else if ($battle_data['creator_result'] === null) {
                $updateField = 'creator_result';
                $screenshotField = 'creator_screenshot';
                $submitter = 'creator';
            } else {
                echo json_encode(['success' => false, 'message' => 'Both players already submitted results']);
                break;
            }
            
            // Save the result and screenshot
            $screenshotData = $screenshot ? $conn->real_escape_string($screenshot) : '';
            $sql = "UPDATE ludo_battles SET $updateField = '$result_type', $screenshotField = '$screenshotData' WHERE id = '$battleId'";
            $conn->query($sql);
            
            // Reload battle data
            $battleResult = $conn->query("SELECT * FROM ludo_battles WHERE id = '$battleId'");
            $battle_data = $battleResult->fetch_assoc();
            
            // Check if both players submitted
            if ($battle_data['creator_result'] !== null && $battle_data['opponent_result'] !== null) {
                // Both submitted - determine winner
                $creatorResult = $battle_data['creator_result'];
                $opponentResult = $battle_data['opponent_result'];
                $winnerMobile = null;
                $winnerId = null;
                $winnerName = null;
                
                // Prize calculation: 200 total bet (100 each) - 5% = 190 winner gets
                $totalBet = $entryFee * 2;
                $commission = floor($totalBet * 0.05); // 5% commission
                $winAmount = $totalBet - $commission;
                
                if ($creatorResult === 'won' && $opponentResult === 'lost') {
                    // Creator wins
                    $winnerId = $battle_data['creator_id'];
                    $winnerName = $battle_data['creator_name'];
                    // Get creator mobile from users table or use passed mobile
                } else if ($creatorResult === 'lost' && $opponentResult === 'won') {
                    // Opponent wins  
                    $winnerId = $battle_data['opponent_id'];
                    $winnerName = $battle_data['opponent_name'];
                } else if ($creatorResult === 'won' && $opponentResult === 'won') {
                    // Both claim win - admin/platform wins, battle disputed
                    $conn->query("UPDATE ludo_battles SET status = 'completed', winner_id = 'ADMIN_DISPUTE' WHERE id = '$battleId'");
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Both players claimed win. Match disputed - Admin will review.',
                        'winner' => false,
                        'disputed' => true
                    ]);
                    break;
                } else if ($creatorResult === 'cancel' && $opponentResult === 'cancel') {
                    // Both cancel - refund both players automatically
                    $conn->query("UPDATE ludo_battles SET status = 'cancelled' WHERE id = '$battleId'");
                    
                    // Refund both players to wallet_balance
                    $creatorMobile = $battle_data['creator_id'];
                    $opponentMobile = $battle_data['opponent_id'];
                    $refund1 = $conn->query("UPDATE users SET wallet_balance = wallet_balance + $entryFee WHERE mobile = '$creatorMobile'");
                    $refund2 = $conn->query("UPDATE users SET wallet_balance = wallet_balance + $entryFee WHERE mobile = '$opponentMobile'");
                    
                    error_log("Ludo Cancel Refund Debug: Creator=$creatorMobile, Opponent=$opponentMobile, EntryFee=$entryFee, Refund1=" . ($refund1 ? 'OK' : $conn->error) . ", Refund2=" . ($refund2 ? 'OK' : $conn->error));
                    
                    error_log("Ludo Cancel Refund: Battle $battleId, Creator $creatorMobile, Opponent $opponentMobile, Amount $entryFee each");
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Both players cancelled. Entry fees refunded to both.',
                        'winner' => false,
                        'cancelled' => true,
                        'refunded' => true
                    ]);
                    break;
                } else if (($creatorResult === 'won' && $opponentResult === 'cancel') || 
                           ($creatorResult === 'cancel' && $opponentResult === 'won')) {
                    // One claims win, other cancels - Admin needs to decide
                    $conn->query("UPDATE ludo_battles SET status = 'completed', winner_id = 'ADMIN_DISPUTE' WHERE id = '$battleId'");
                    echo json_encode([
                        'success' => true,
                        'message' => 'One player claimed win, other cancelled. Admin will review and decide.',
                        'winner' => false,
                        'disputed' => true
                    ]);
                    break;
                } else if ($creatorResult === 'lost' && $opponentResult === 'lost') {
                    // Both claim loss - unusual, treat as cancel with refund
                    $conn->query("UPDATE ludo_battles SET status = 'cancelled' WHERE id = '$battleId'");
                    
                    // Refund both players to wallet_balance
                    $creatorMobile = $battle_data['creator_id'];
                    $opponentMobile = $battle_data['opponent_id'];
                    $conn->query("UPDATE users SET wallet_balance = wallet_balance + $entryFee WHERE mobile = '$creatorMobile'");
                    $conn->query("UPDATE users SET wallet_balance = wallet_balance + $entryFee WHERE mobile = '$opponentMobile'");
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Both players claimed loss. Entry fees refunded.',
                        'winner' => false,
                        'refunded' => true
                    ]);
                    break;
                }
                
                // Update winner in database
                if ($winnerId) {
                    $conn->query("UPDATE ludo_battles SET status = 'completed', winner_id = '$winnerId' WHERE id = '$battleId'");
                    
                    // Add winnings to winner's wallet
                    // winnerId is actually the mobile number (creator_id/opponent_id stores mobile)
                    $winnerMobile = $winnerId;
                    $updateResult = $conn->query("UPDATE users SET winning_balance = winning_balance + $winAmount WHERE mobile = '$winnerMobile'");
                    
                    // Log for debugging
                    error_log("Ludo Winner Payment: Battle $battleId, Winner $winnerMobile, Amount $winAmount, Update Result: " . ($updateResult ? 'Success' : 'Failed - ' . $conn->error));
                    
                    $isWinner = ($submitter === 'creator' && $winnerId === $battle_data['creator_id']) || 
                                ($submitter === 'opponent' && $winnerId === $battle_data['opponent_id']);
                    
                    echo json_encode([
                        'success' => true,
                        'message' => $isWinner ? "Congratulations! You won ₹$winAmount!" : "You lost this match.",
                        'winner' => $isWinner,
                        'winAmount' => $winAmount,
                        'winnerMobile' => $winnerMobile
                    ]);
                    break;
                }
            }
            
            // Only one player submitted so far
            echo json_encode([
                'success' => true,
                'message' => 'Result submitted. Waiting for opponent to submit their result.',
                'winner' => false,
                'waiting' => true
            ]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request']);
?>
