// app/api/jetson/nodes/route.ts
/**
 * Jetson Edge Nodes API
 * 管理 Jetson 邊緣節點
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - 獲取所有 Jetson 節點
export async function GET(request: NextRequest) {
  try {
    const result = await query(`
      SELECT
        n.*,
        COUNT(DISTINCT c.id) as cameras_count,
        COUNT(DISTINCT a.id) FILTER (WHERE a.created_at > NOW() - INTERVAL '24 hours') as alerts_today
      FROM edge_nodes n
      LEFT JOIN edge_cameras c ON n.id = c.node_id
      LEFT JOIN edge_alerts a ON n.id = a.node_id
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `);

    return NextResponse.json({
      nodes: result.rows,
      total: result.rowCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get nodes:', error);
    return NextResponse.json(
      { error: 'Failed to get nodes' },
      { status: 500 }
    );
  }
}

// POST - 註冊新的 Jetson 節點
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { node_id, name, host, port, location, api_key } = body;

    if (!node_id || !name || !host) {
      return NextResponse.json(
        { error: 'Missing required fields: node_id, name, host' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO edge_nodes (node_id, name, host, port, location, api_key, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'offline')
      ON CONFLICT (node_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        host = EXCLUDED.host,
        port = EXCLUDED.port,
        location = EXCLUDED.location,
        api_key = EXCLUDED.api_key,
        updated_at = NOW()
      RETURNING *
    `, [node_id, name, host, port || 8000, location, api_key]);

    return NextResponse.json({
      message: 'Node registered successfully',
      node: result.rows[0]
    });
  } catch (error) {
    console.error('Failed to register node:', error);
    return NextResponse.json(
      { error: 'Failed to register node' },
      { status: 500 }
    );
  }
}
