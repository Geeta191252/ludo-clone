<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

$admin = requireAdmin();
$conn = getDBConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'all';
    
    switch ($action) {
        case 'stats':
            $stats = [
                'total_battles' => 0,
                'open_battles' => 0,
                'running_battles' => 0,
                'completed_battles' => 0,
                'disputed_battles' => 0,
                'cancelled_battles' => 0,
                'total_prize_pool' => 0,
                'total_commission' => 0
            ];
            
            // Total battles
            $result = $conn->query("SELECT COUNT(*) as count FROM ludo_battles");
            if ($row = $result->fetch_assoc()) $stats['total_battles'] = (int)$row['count'];
            
            // Open battles
            $result = $conn->query("SELECT COUNT(*) as count FROM ludo_battles WHERE status = 'open'");
            if ($row = $result->fetch_assoc()) $stats['open_battles'] = (int)$row['count'];
            
            // Running battles
            $result = $conn->query("SELECT COUNT(*) as count FROM ludo_battles WHERE status = 'running'");
            if ($row = $result->fetch_assoc()) $stats['running_battles'] = (int)$row['count'];
            
            // Completed battles
            $result = $conn->query("SELECT COUNT(*) as count FROM ludo_battles WHERE status = 'completed' AND winner_id != 'ADMIN_DISPUTE'");
            if ($row = $result->fetch_assoc()) $stats['completed_battles'] = (int)$row['count'];
            
            // Disputed battles
            $result = $conn->query("SELECT COUNT(*) as count FROM ludo_battles WHERE winner_id = 'ADMIN_DISPUTE'");
            if ($row = $result->fetch_assoc()) $stats['disputed_battles'] = (int)$row['count'];
            
            // Cancelled battles
            $result = $conn->query("SELECT COUNT(*) as count FROM ludo_battles WHERE status = 'cancelled'");
            if ($row = $result->fetch_assoc()) $stats['cancelled_battles'] = (int)$row['count'];
            
            // Total prize pool from completed battles
            $result = $conn->query("SELECT SUM(prize) as total FROM ludo_battles WHERE status = 'completed' AND winner_id != 'ADMIN_DISPUTE'");
            if ($row = $result->fetch_assoc()) $stats['total_prize_pool'] = (int)($row['total'] ?? 0);
            
            // Total commission (5% of entry_fee * 2 for completed battles)
            $result = $conn->query("SELECT SUM(entry_fee * 2 * 0.05) as total FROM ludo_battles WHERE status = 'completed'");
            if ($row = $result->fetch_assoc()) $stats['total_commission'] = (int)($row['total'] ?? 0);
            
            echo json_encode(['status' => true, 'stats' => $stats]);
            break;
            
        case 'disputed':
            $battles = [];
            $result = $conn->query("SELECT * FROM ludo_battles WHERE winner_id = 'ADMIN_DISPUTE' ORDER BY updated_at DESC");
            while ($row = $result->fetch_assoc()) {
                $battles[] = [
                    'id' => $row['id'],
                    'creator_id' => $row['creator_id'],
                    'creator_name' => $row['creator_name'],
                    'opponent_id' => $row['opponent_id'],
                    'opponent_name' => $row['opponent_name'],
                    'entry_fee' => (int)$row['entry_fee'],
                    'prize' => (int)$row['prize'],
                    'room_code' => $row['room_code'],
                    'creator_result' => $row['creator_result'],
                    'opponent_result' => $row['opponent_result'],
                    'creator_screenshot' => $row['creator_screenshot'],
                    'opponent_screenshot' => $row['opponent_screenshot'],
                    'status' => $row['status'],
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at']
                ];
            }
            echo json_encode(['status' => true, 'battles' => $battles]);
            break;
            
        case 'all':
        default:
            $status = $_GET['status'] ?? '';
            $battles = [];
            
            $sql = "SELECT * FROM ludo_battles";
            if (!empty($status) && in_array($status, ['open', 'requested', 'running', 'completed', 'cancelled'])) {
                $sql .= " WHERE status = '$status'";
            }
            $sql .= " ORDER BY created_at DESC LIMIT 200";
            
            $result = $conn->query($sql);
            while ($row = $result->fetch_assoc()) {
                $battles[] = [
                    'id' => $row['id'],
                    'creator_id' => $row['creator_id'],
                    'creator_name' => $row['creator_name'],
                    'opponent_id' => $row['opponent_id'],
                    'opponent_name' => $row['opponent_name'],
                    'entry_fee' => (int)$row['entry_fee'],
                    'prize' => (int)$row['prize'],
                    'room_code' => $row['room_code'],
                    'winner_id' => $row['winner_id'],
                    'creator_result' => $row['creator_result'],
                    'opponent_result' => $row['opponent_result'],
                    'status' => $row['status'],
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at']
                ];
            }
            echo json_encode(['status' => true, 'battles' => $battles]);
            break;
    }
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';
    
    switch ($action) {
        case 'resolve_dispute':
            $battleId = $conn->real_escape_string($data['battle_id'] ?? '');
            $winnerId = $conn->real_escape_string($data['winner_id'] ?? '');
            $winnerType = $data['winner_type'] ?? ''; // 'creator' or 'opponent'
            
            // Get battle details
            $result = $conn->query("SELECT * FROM ludo_battles WHERE id = '$battleId' AND winner_id = 'ADMIN_DISPUTE'");
            if (!$result || !$battle = $result->fetch_assoc()) {
                echo json_encode(['status' => false, 'message' => 'Battle not found or not disputed']);
                break;
            }
            
            $entryFee = (int)$battle['entry_fee'];
            $winAmount = floor($entryFee * 2 * 0.95); // 95% of total pool
            
            $actualWinnerId = $winnerType === 'creator' ? $battle['creator_id'] : $battle['opponent_id'];
            
            // Update battle winner
            $conn->query("UPDATE ludo_battles SET winner_id = '$actualWinnerId' WHERE id = '$battleId'");
            
            // Add winnings to winner's wallet
            $conn->query("UPDATE users SET winning_balance = winning_balance + $winAmount WHERE mobile = '$actualWinnerId'");
            
            // Log admin action
            $stmt = $conn->prepare("INSERT INTO admin_logs (admin_id, action, details, created_at) VALUES (?, 'RESOLVE_LUDO_DISPUTE', ?, NOW())");
            $details = json_encode(['battle_id' => $battleId, 'winner' => $actualWinnerId, 'amount' => $winAmount]);
            $stmt->bind_param("is", $admin['id'], $details);
            $stmt->execute();
            
            echo json_encode(['status' => true, 'message' => "Dispute resolved. ₹$winAmount credited to winner."]);
            break;
            
        case 'cancel_battle':
            $battleId = $conn->real_escape_string($data['battle_id'] ?? '');
            $refund = $data['refund'] ?? true;
            
            // Get battle details
            $result = $conn->query("SELECT * FROM ludo_battles WHERE id = '$battleId'");
            if (!$result || !$battle = $result->fetch_assoc()) {
                echo json_encode(['status' => false, 'message' => 'Battle not found']);
                break;
            }
            
            $entryFee = (int)$battle['entry_fee'];
            
            // If refund requested and battle was running
            if ($refund && in_array($battle['status'], ['running', 'completed'])) {
                // Refund both players
                $conn->query("UPDATE users SET wallet_balance = wallet_balance + $entryFee WHERE mobile = '{$battle['creator_id']}'");
                if (!empty($battle['opponent_id'])) {
                    $conn->query("UPDATE users SET wallet_balance = wallet_balance + $entryFee WHERE mobile = '{$battle['opponent_id']}'");
                }
            }
            
            // Update battle status
            $conn->query("UPDATE ludo_battles SET status = 'cancelled', winner_id = NULL WHERE id = '$battleId'");
            
            // Log admin action
            $stmt = $conn->prepare("INSERT INTO admin_logs (admin_id, action, details, created_at) VALUES (?, 'CANCEL_LUDO_BATTLE', ?, NOW())");
            $details = json_encode(['battle_id' => $battleId, 'refund' => $refund]);
            $stmt->bind_param("is", $admin['id'], $details);
            $stmt->execute();
            
            echo json_encode(['status' => true, 'message' => 'Battle cancelled' . ($refund ? ' and refunds processed' : '')]);
            break;
            
        case 'delete_battle':
            $battleId = $conn->real_escape_string($data['battle_id'] ?? '');
            
            $conn->query("DELETE FROM ludo_battles WHERE id = '$battleId'");
            
            echo json_encode(['status' => true, 'message' => 'Battle deleted']);
            break;
            
        default:
            echo json_encode(['status' => false, 'message' => 'Invalid action']);
    }
    exit();
}

echo json_encode(['status' => false, 'message' => 'Invalid request']);
$conn->close();
?>
