-- Users table mein password column add karo (agar nahi hai)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT NULL;

-- Ya agar IF NOT EXISTS support nahi karta to ye try karo:
-- ALTER TABLE users ADD COLUMN password VARCHAR(255) DEFAULT NULL;
