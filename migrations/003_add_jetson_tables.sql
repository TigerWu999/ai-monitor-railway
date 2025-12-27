-- Migration: Add Jetson Edge Node Tables
-- Run this SQL in Railway PostgreSQL database

-- =====================================================
-- Edge Nodes Table (Jetson 邊緣節點)
-- =====================================================
CREATE TABLE IF NOT EXISTS edge_nodes (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 8000,
    api_key VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'offline', -- online, offline, error
    enabled BOOLEAN DEFAULT true,

    -- 資源監控
    cpu_percent REAL,
    memory_percent REAL,
    gpu_memory_mb INTEGER,
    cameras_active INTEGER DEFAULT 0,
    inference_fps REAL,
    uptime_seconds REAL,

    -- 時間戳
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_edge_nodes_status ON edge_nodes(status);
CREATE INDEX IF NOT EXISTS idx_edge_nodes_enabled ON edge_nodes(enabled);

-- =====================================================
-- Edge Cameras Table (邊緣節點攝像頭)
-- =====================================================
CREATE TABLE IF NOT EXISTS edge_cameras (
    id SERIAL PRIMARY KEY,
    camera_id VARCHAR(100) NOT NULL,
    node_id VARCHAR(100) REFERENCES edge_nodes(node_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rtsp_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'disconnected', -- connected, disconnected, error
    enabled BOOLEAN DEFAULT true,

    -- 配置
    algorithms JSONB DEFAULT '[]',
    roi JSONB, -- Region of Interest

    -- 統計
    fps REAL DEFAULT 0,

    -- 時間戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(camera_id, node_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_edge_cameras_node ON edge_cameras(node_id);
CREATE INDEX IF NOT EXISTS idx_edge_cameras_status ON edge_cameras(status);

-- =====================================================
-- Edge Alerts Table (邊緣告警)
-- =====================================================
CREATE TABLE IF NOT EXISTS edge_alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(100) UNIQUE NOT NULL,
    node_id VARCHAR(100) REFERENCES edge_nodes(node_id) ON DELETE CASCADE,
    camera_id VARCHAR(100) NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence REAL,

    -- 媒體
    image_path VARCHAR(500),
    video_path VARCHAR(500),

    -- 偵測詳情
    detections JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',

    -- 狀態
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP WITH TIME ZONE,

    -- 時間戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_edge_alerts_node ON edge_alerts(node_id);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_camera ON edge_alerts(camera_id);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_type ON edge_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_timestamp ON edge_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_acknowledged ON edge_alerts(acknowledged);

-- =====================================================
-- Alert Rules Table (告警規則)
-- =====================================================
CREATE TABLE IF NOT EXISTS edge_alert_rules (
    id SERIAL PRIMARY KEY,
    rule_id VARCHAR(100) UNIQUE NOT NULL,
    camera_id VARCHAR(100) NOT NULL,
    node_id VARCHAR(100) REFERENCES edge_nodes(node_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,

    -- 規則配置
    target_classes JSONB DEFAULT '["person"]',
    min_confidence REAL DEFAULT 0.5,
    min_count INTEGER DEFAULT 1,
    cooldown_seconds INTEGER DEFAULT 30,
    roi JSONB,
    time_window JSONB, -- {"start": "08:00", "end": "18:00"}
    enabled BOOLEAN DEFAULT true,

    -- 時間戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_alert_rules_camera ON edge_alert_rules(camera_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_node ON edge_alert_rules(node_id);

-- =====================================================
-- Dashboard View (儀表板視圖)
-- =====================================================
CREATE OR REPLACE VIEW edge_dashboard AS
SELECT
    (SELECT COUNT(*) FROM edge_nodes WHERE status = 'online') as nodes_online,
    (SELECT COUNT(*) FROM edge_nodes WHERE enabled = true) as nodes_total,
    (SELECT COUNT(*) FROM edge_cameras WHERE status = 'connected') as cameras_active,
    (SELECT COUNT(*) FROM edge_cameras) as cameras_total,
    (SELECT COUNT(*) FROM edge_alerts WHERE timestamp > NOW() - INTERVAL '24 hours') as alerts_today,
    (SELECT COUNT(*) FROM edge_alerts WHERE timestamp > NOW() - INTERVAL '7 days') as alerts_week,
    (SELECT COUNT(*) FROM edge_alerts WHERE acknowledged = false) as alerts_pending;

-- =====================================================
-- Function: Update timestamp on modification
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trigger_edge_nodes_updated ON edge_nodes;
CREATE TRIGGER trigger_edge_nodes_updated
    BEFORE UPDATE ON edge_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_edge_cameras_updated ON edge_cameras;
CREATE TRIGGER trigger_edge_cameras_updated
    BEFORE UPDATE ON edge_cameras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_alert_rules_updated ON edge_alert_rules;
CREATE TRIGGER trigger_alert_rules_updated
    BEFORE UPDATE ON edge_alert_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Sample Data (可選)
-- =====================================================
-- INSERT INTO edge_nodes (node_id, name, host, port, location)
-- VALUES ('jetson-demo', 'Demo Jetson Node', '192.168.1.100', 8000, 'Office')
-- ON CONFLICT (node_id) DO NOTHING;
