-- Account self-deletion: cột mốc xoá (soft-delete). Additive, an toàn.
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index hỗ trợ lọc user còn sống (đa số truy vấn WHERE deleted_at IS NULL).
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);
