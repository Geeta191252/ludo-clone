-- Admin Panel Database Schema
-- Run this AFTER database.sql

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin Tokens Table
CREATE TABLE IF NOT EXISTS admin_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- Admin Logs Table
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    details JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- Games Table
CREATE TABLE IF NOT EXISTS games (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    enabled TINYINT(1) DEFAULT 1,
    min_bet DECIMAL(10,2) DEFAULT 10,
    max_bet DECIMAL(10,2) DEFAULT 10000,
    house_edge DECIMAL(5,2) DEFAULT 5,
    multiplier DECIMAL(5,2) DEFAULT 2,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_type ENUM('site', 'payment') NOT NULL,
    setting_key VARCHAR(50) NOT NULL,
    setting_value TEXT,
    UNIQUE KEY unique_setting (setting_type, setting_key)
);

-- Add player_name and status to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS player_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('active', 'blocked') DEFAULT 'active';

-- Add upi_id to transactions table if not exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS upi_id VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type ENUM('DEPOSIT', 'WITHDRAWAL') DEFAULT 'DEPOSIT';

-- Insert Default Admin (username: admin, password: admin123)
-- IMPORTANT: Change this password after first login!
INSERT INTO admins (username, password, name) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Admin')
ON DUPLICATE KEY UPDATE username = username;

-- Insert Default Games
INSERT INTO games (id, name, slug, enabled, min_bet, max_bet, house_edge, multiplier) VALUES
(1, 'Aviator', 'aviator', 1, 10, 10000, 5, 1.5),
(2, 'Dragon Tiger', 'dragon-tiger', 1, 10, 50000, 3, 2),
(3, 'Ludo Classic', 'ludo-classic', 1, 50, 5000, 5, 2),
(4, 'Ludo Popular', 'ludo-popular', 1, 100, 10000, 5, 2),
(5, 'Snake & Ladders', 'snake-ladders', 1, 10, 5000, 5, 2)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert Default Settings
INSERT INTO settings (setting_type, setting_key, setting_value) VALUES
('site', 'site_name', 'Ludo Empire'),
('site', 'min_deposit', '100'),
('site', 'max_deposit', '50000'),
('site', 'min_withdrawal', '100'),
('site', 'max_withdrawal', '25000'),
('payment', 'pay0_api_key', ''),
('payment', 'upi_id', '')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_tokens_token ON admin_tokens(token);
CREATE INDEX IF NOT EXISTS idx_settings_type_key ON settings(setting_type, setting_key);
