<?php
require_once 'config.php';
header('Content-Type: application/json');

$mobile = $_GET['mobile'] ?? '';

if (empty($mobile)) {
    echo json_encode(['status' => false, 'message' => 'Mobile number required']);
    exit;
}

$conn = getDBConnection();

// Get user info
$stmt = $conn->prepare("SELECT id, mobile, name, email, wallet_balance, winning_balance FROM users WHERE mobile = ?");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$userResult = $stmt->get_result();
$user = $userResult->fetch_assoc();

if (!$user) {
    echo json_encode(['status' => false, 'message' => 'User not found']);
    exit;
}

// Get total winnings (coin won) - sum of all successful deposits to winning_balance
$stmt = $conn->prepare("SELECT COALESCE(SUM(amount), 0) as total_won FROM transactions WHERE mobile = ? AND type = 'deposit' AND status = 'SUCCESS'");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$wonResult = $stmt->get_result();
$coinWon = $wonResult->fetch_assoc()['total_won'];

// Get battle played count (games played) - for now count game transactions
$stmt = $conn->prepare("SELECT COUNT(*) as battles FROM transactions WHERE mobile = ? AND type = 'game'");
$stmt->bind_param("s", $mobile);
$stmt->execute();
$battleResult = $stmt->get_result();
$battlePlayed = $battleResult->fetch_assoc()['battles'];

// Get referral count - users who have this user's referral code
$referralCode = 'REF' . $user['id'];
$stmt = $conn->prepare("SELECT COUNT(*) as referrals FROM users WHERE referred_by = ?");
$stmt->bind_param("s", $referralCode);
$stmt->execute();
$refResult = $stmt->get_result();
$referralCount = $refResult->fetch_assoc()['referrals'];

echo json_encode([
    'status' => true,
    'user' => [
        'name' => $user['name'] ?? 'Player',
        'mobile' => $user['mobile'],
        'email' => $user['email'] ?? '',
        'wallet_balance' => floatval($user['wallet_balance']),
        'winning_balance' => floatval($user['winning_balance'] ?? 0)
    ],
    'stats' => [
        'coin_won' => floatval($coinWon),
        'battle_played' => intval($battlePlayed),
        'referral_count' => intval($referralCount)
    ]
]);

$conn->close();
?>
