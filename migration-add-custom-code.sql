-- Menambahkan kolom custom_code ke tabel users
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_code VARCHAR(12) UNIQUE;

-- Menambahkan kolom details ke tabel claims jika belum ada
ALTER TABLE claims ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- Menambahkan indeks untuk kolom custom_code
CREATE INDEX IF NOT EXISTS idx_users_custom_code ON users(custom_code);

-- Update kolom referral_code jika belum ada
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);

-- Pastikan tabel claims ada
CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(32) DEFAULT 'pending',
  type VARCHAR(32) NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  token VARCHAR(16) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pastikan kolom referred_by ada di tabel users
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by BIGINT REFERENCES users(id); 