-- Add last_update column for proper timing control
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS last_update TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Reset game state to fix stuck games
UPDATE game_state SET phase = 'waiting', timer = 12, multiplier = 1.00, last_update = NOW(3) WHERE game_type = 'aviator';