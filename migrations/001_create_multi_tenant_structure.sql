-- Multi-Tenant Camera Authorization System
-- 多租戶攝影機授權系統資料庫結構

-- 1. 租戶表 (tenants)
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),  -- 子網域，例如：sitea.qcair.us
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  subscription_expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',  -- 額外的租戶資訊
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 建立索引加速查詢
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- 2. 攝影機表 (cameras)
CREATE TABLE IF NOT EXISTS cameras (
  id SERIAL PRIMARY KEY,
  xcms_camera_id INTEGER NOT NULL,  -- XCMS 系統中的攝影機 ID
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'online' CHECK (status IN ('online', 'offline', 'processing', 'maintenance')),
  metadata JSONB DEFAULT '{}',  -- 儲存額外資訊（IP、端口等）
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(xcms_camera_id)  -- 確保同一個 XCMS 攝影機不會重複
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);
CREATE INDEX IF NOT EXISTS idx_cameras_xcms_id ON cameras(xcms_camera_id);

-- 3. 攝影機授權表 (camera_authorizations)
CREATE TABLE IF NOT EXISTS camera_authorizations (
  id SERIAL PRIMARY KEY,
  camera_id INTEGER NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '["view"]',  -- ["view", "control", "analytics", "export"]
  authorized_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,  -- NULL 表示永久授權
  created_by INTEGER,  -- 授權者的用戶 ID（可選）
  metadata JSONB DEFAULT '{}',
  UNIQUE(camera_id, tenant_id)  -- 同一攝影機不能重複授權給同一租戶
);

-- 建立索引加速查詢
CREATE INDEX IF NOT EXISTS idx_auth_camera ON camera_authorizations(camera_id);
CREATE INDEX IF NOT EXISTS idx_auth_tenant ON camera_authorizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_expires ON camera_authorizations(expires_at);

-- 4. 使用者租戶關聯表 (user_tenants) - 如果還沒有的話
CREATE TABLE IF NOT EXISTS user_tenants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,  -- 關聯到您現有的 users 表
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'operator', 'viewer')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)  -- 同一用戶在同一租戶只能有一個角色
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON user_tenants(tenant_id);

-- 5. 創建更新時間戳記的觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為 tenants 表創建觸發器
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 為 cameras 表創建觸發器
DROP TRIGGER IF EXISTS update_cameras_updated_at ON cameras;
CREATE TRIGGER update_cameras_updated_at
  BEFORE UPDATE ON cameras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. 插入初始測試數據

-- 插入測試租戶
INSERT INTO tenants (name, domain, status, subscription_expires_at) VALUES
  ('總平台管理', 'platform.qcair.us', 'active', NULL),
  ('工地A', 'sitea.qcair.us', 'active', '2025-12-31 23:59:59'),
  ('工地B', 'siteb.qcair.us', 'active', '2025-12-31 23:59:59')
ON CONFLICT DO NOTHING;

-- 插入 XCMS 攝影機（從 XCMS 系統同步過來的）
INSERT INTO cameras (xcms_camera_id, name, location, status, metadata) VALUES
  (1, '入口攝影機', '工地主入口', 'online', '{"ip": "192.168.1.184", "port": 9002}'),
  (2, '工地A區攝影機', '工地A區施工區', 'online', '{"ip": "192.168.1.184", "port": 9002}'),
  (3, '工地B區攝影機', '工地B區倉庫', 'online', '{"ip": "192.168.1.184", "port": 9002}')
ON CONFLICT (xcms_camera_id) DO NOTHING;

-- 插入授權關係
-- 工地A 可以看到攝影機 1, 2
-- 工地B 可以看到攝影機 1, 3
INSERT INTO camera_authorizations (camera_id, tenant_id, permissions, expires_at)
SELECT c.id, t.id, '["view", "analytics"]', '2025-12-31 23:59:59'
FROM cameras c, tenants t
WHERE (c.xcms_camera_id = 1 AND t.name = '工地A')
   OR (c.xcms_camera_id = 2 AND t.name = '工地A')
   OR (c.xcms_camera_id = 1 AND t.name = '工地B')
   OR (c.xcms_camera_id = 3 AND t.name = '工地B')
ON CONFLICT (camera_id, tenant_id) DO NOTHING;

-- 7. 創建查詢視圖方便使用
CREATE OR REPLACE VIEW vw_tenant_cameras AS
SELECT
  t.id AS tenant_id,
  t.name AS tenant_name,
  c.id AS camera_id,
  c.xcms_camera_id,
  c.name AS camera_name,
  c.location,
  c.status,
  ca.permissions,
  ca.expires_at,
  CASE
    WHEN ca.expires_at IS NULL THEN TRUE
    WHEN ca.expires_at > NOW() THEN TRUE
    ELSE FALSE
  END AS is_active
FROM tenants t
JOIN camera_authorizations ca ON t.id = ca.tenant_id
JOIN cameras c ON ca.camera_id = c.id
WHERE t.status = 'active';

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE '多租戶攝影機授權系統資料庫建立完成！';
  RAISE NOTICE '======================================';
  RAISE NOTICE '已創建表格：';
  RAISE NOTICE '  - tenants (租戶表)';
  RAISE NOTICE '  - cameras (攝影機表)';
  RAISE NOTICE '  - camera_authorizations (授權表)';
  RAISE NOTICE '  - user_tenants (用戶租戶關聯表)';
  RAISE NOTICE '';
  RAISE NOTICE '已創建視圖：';
  RAISE NOTICE '  - vw_tenant_cameras (租戶攝影機查詢視圖)';
  RAISE NOTICE '';
  RAISE NOTICE '測試數據已插入，可以開始使用！';
  RAISE NOTICE '======================================';
END $$;
