<?php
require_once 'config.php';
require_once 'admin-auth.php';
header('Content-Type: application/json');

$admin = requireAdmin();
$input = json_decode(file_get_contents('php://input'), true);

$games = $input['games'] ?? [];

if (empty($games)) {
    echo json_encode(['status' => false, 'message' => 'No games data']);
    exit;
}

$conn = getDBConnection();

foreach ($games as $game) {
    $stmt = $conn->prepare("
        INSERT INTO games (id, name, slug, enabled, min_bet, max_bet, house_edge, multiplier) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            name = VALUES(name),
            enabled = VALUES(enabled),
            min_bet = VALUES(min_bet),
            max_bet = VALUES(max_bet),
            house_edge = VALUES(house_edge),
            multiplier = VALUES(multiplier)
    ");
    
    $enabled = $game['enabled'] ? 1 : 0;
    $stmt->bind_param("issidddd", 
        $game['id'], 
        $game['name'], 
        $game['slug'], 
        $enabled,
        $game['min_bet'], 
        $game['max_bet'], 
        $game['house_edge'], 
        $game['multiplier']
    );
    $stmt->execute();
}

echo json_encode(['status' => true, 'message' => 'Games saved successfully']);
$conn->close();
?>
