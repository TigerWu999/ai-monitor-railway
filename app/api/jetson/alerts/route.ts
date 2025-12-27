// app/api/jetson/alerts/route.ts
/**
 * Jetson Edge Alerts API
 * 接收和查詢邊緣節點告警
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 查詢告警
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('node_id');
    const cameraId = searchParams.get('camera_id');
    const alertType = searchParams.get('alert_type');
    const acknowledged = searchParams.get('acknowledged');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (nodeId) {
      whereClause += ` AND a.node_id = $${paramIndex++}`;
      params.push(nodeId);
    }
    if (cameraId) {
      whereClause += ` AND a.camera_id = $${paramIndex++}`;
      params.push(cameraId);
    }
    if (alertType) {
      whereClause += ` AND a.alert_type = $${paramIndex++}`;
      params.push(alertType);
    }
    if (acknowledged !== null) {
      whereClause += ` AND a.acknowledged = $${paramIndex++}`;
      params.push(acknowledged === 'true');
    }

    params.push(limit, offset);

    const result = await query(`
      SELECT
        a.*,
        n.name as node_name,
        n.location as node_location
      FROM edge_alerts a
      LEFT JOIN edge_nodes n ON a.node_id = n.node_id
      ${whereClause}
      ORDER BY a.timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, params);

    // 獲取總數
    const countResult = await query(`
      SELECT COUNT(*) as total FROM edge_alerts a ${whereClause}
    `, params.slice(0, -2));

    return NextResponse.json({
      alerts: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
      limit,
      offset,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get alerts:', error);
    return NextResponse.json(
      { error: 'Failed to get alerts' },
      { status: 500 }
    );
  }
}

// POST - 接收新告警（來自 Jetson 節點）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 支援批量告警
    const alerts = Array.isArray(body) ? body : [body];
    const insertedAlerts = [];

    for (const alert of alerts) {
      const {
        alert_id,
        node_id,
        camera_id,
        alert_type,
        timestamp,
        confidence,
        image_base64,
        detections,
        metadata
      } = alert;

      if (!node_id || !camera_id || !alert_type) {
        continue; // 跳過無效告警
      }

      // 儲存圖片（如果有）
      let imagePath = null;
      if (image_base64) {
        // 這裡可以儲存到雲端存儲（S3, Cloudflare R2 等）
        // 暫時存入資料庫的 metadata
        imagePath = `alerts/${node_id}/${alert_id}.jpg`;
      }

      const result = await query(`
        INSERT INTO edge_alerts (
          alert_id, node_id, camera_id, alert_type,
          timestamp, confidence, image_path, detections, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (alert_id) DO NOTHING
        RETURNING *
      `, [
        alert_id || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        node_id,
        camera_id,
        alert_type,
        timestamp || new Date().toISOString(),
        confidence || 0,
        imagePath,
        JSON.stringify(detections || []),
        JSON.stringify(metadata || {})
      ]);

      if (result.rows[0]) {
        insertedAlerts.push(result.rows[0]);
      }
    }

    return NextResponse.json({
      message: 'Alerts received',
      count: insertedAlerts.length,
      alert_ids: insertedAlerts.map(a => a.alert_id)
    });
  } catch (error) {
    console.error('Failed to save alert:', error);
    return NextResponse.json(
      { error: 'Failed to save alert' },
      { status: 500 }
    );
  }
}
