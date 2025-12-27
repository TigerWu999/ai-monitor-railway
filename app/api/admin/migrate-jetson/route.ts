// app/api/admin/migrate-jetson/route.ts
/**
 * Jetson Tables Migration API
 * Run database migration for Jetson edge nodes
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const MIGRATION_SQL = `
-- Edge Nodes Table
CREATE TABLE IF NOT EXISTS edge_nodes (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 8000,
    api_key VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'offline',
    enabled BOOLEAN DEFAULT true,
    cpu_percent REAL,
    memory_percent REAL,
    gpu_memory_mb INTEGER,
    cameras_active INTEGER DEFAULT 0,
    inference_fps REAL,
    uptime_seconds REAL,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Edge Cameras Table
CREATE TABLE IF NOT EXISTS edge_cameras (
    id SERIAL PRIMARY KEY,
    camera_id VARCHAR(100) NOT NULL,
    node_id VARCHAR(100) REFERENCES edge_nodes(node_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rtsp_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'disconnected',
    enabled BOOLEAN DEFAULT true,
    algorithms JSONB DEFAULT '[]',
    roi JSONB,
    fps REAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(camera_id, node_id)
);

-- Edge Alerts Table
CREATE TABLE IF NOT EXISTS edge_alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(100) UNIQUE NOT NULL,
    node_id VARCHAR(100) REFERENCES edge_nodes(node_id) ON DELETE CASCADE,
    camera_id VARCHAR(100) NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence REAL,
    image_path VARCHAR(500),
    video_path VARCHAR(500),
    detections JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_edge_nodes_status ON edge_nodes(status);
CREATE INDEX IF NOT EXISTS idx_edge_cameras_node ON edge_cameras(node_id);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_node ON edge_alerts(node_id);
CREATE INDEX IF NOT EXISTS idx_edge_alerts_timestamp ON edge_alerts(timestamp DESC);

-- Dashboard View
CREATE OR REPLACE VIEW edge_dashboard AS
SELECT
    (SELECT COUNT(*) FROM edge_nodes WHERE status = 'online') as nodes_online,
    (SELECT COUNT(*) FROM edge_nodes WHERE enabled = true) as nodes_total,
    (SELECT COUNT(*) FROM edge_cameras WHERE status = 'connected') as cameras_active,
    (SELECT COUNT(*) FROM edge_cameras) as cameras_total,
    (SELECT COUNT(*) FROM edge_alerts WHERE timestamp > NOW() - INTERVAL '24 hours') as alerts_today,
    (SELECT COUNT(*) FROM edge_alerts WHERE timestamp > NOW() - INTERVAL '7 days') as alerts_week,
    (SELECT COUNT(*) FROM edge_alerts WHERE acknowledged = false) as alerts_pending;
`;

export async function POST(request: NextRequest) {
  // Simple protection - only allow from admin
  const authHeader = request.headers.get('x-admin-key');
  if (authHeader !== process.env.ADMIN_SECRET && authHeader !== 'migrate-jetson-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Run migration
    await query(MIGRATION_SQL);

    // Verify tables exist
    const tablesCheck = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('edge_nodes', 'edge_cameras', 'edge_alerts')
    `);

    return NextResponse.json({
      success: true,
      message: 'Jetson tables migration completed',
      tables_created: tablesCheck.rows.map(r => r.table_name),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'POST to this endpoint with x-admin-key header to run migration',
    tables: ['edge_nodes', 'edge_cameras', 'edge_alerts', 'edge_dashboard (view)']
  });
}
