// app/api/jetson/dashboard/route.ts
/**
 * Jetson Dashboard API
 * 邊緣節點儀表板統計
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 獲取儀表板統計
    const statsResult = await query(`
      SELECT * FROM edge_dashboard
    `);

    const stats = statsResult.rows[0] || {
      nodes_online: 0,
      nodes_total: 0,
      cameras_active: 0,
      cameras_total: 0,
      alerts_today: 0,
      alerts_week: 0,
      alerts_pending: 0
    };

    // 獲取最近告警
    const recentAlerts = await query(`
      SELECT
        a.alert_id,
        a.node_id,
        a.camera_id,
        a.alert_type,
        a.timestamp,
        a.confidence,
        n.name as node_name
      FROM edge_alerts a
      LEFT JOIN edge_nodes n ON a.node_id = n.node_id
      ORDER BY a.timestamp DESC
      LIMIT 10
    `);

    // 獲取節點狀態
    const nodes = await query(`
      SELECT
        node_id,
        name,
        status,
        cpu_percent,
        memory_percent,
        cameras_active,
        inference_fps,
        last_heartbeat
      FROM edge_nodes
      WHERE enabled = true
      ORDER BY status DESC, name ASC
    `);

    // 告警類型統計
    const alertsByType = await query(`
      SELECT
        alert_type,
        COUNT(*) as count
      FROM edge_alerts
      WHERE timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY alert_type
      ORDER BY count DESC
      LIMIT 10
    `);

    return NextResponse.json({
      stats: {
        nodes_online: parseInt(stats.nodes_online) || 0,
        nodes_total: parseInt(stats.nodes_total) || 0,
        cameras_active: parseInt(stats.cameras_active) || 0,
        cameras_total: parseInt(stats.cameras_total) || 0,
        alerts_today: parseInt(stats.alerts_today) || 0,
        alerts_week: parseInt(stats.alerts_week) || 0,
        alerts_pending: parseInt(stats.alerts_pending) || 0
      },
      nodes: nodes.rows,
      recent_alerts: recentAlerts.rows,
      alerts_by_type: alertsByType.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard data' },
      { status: 500 }
    );
  }
}
