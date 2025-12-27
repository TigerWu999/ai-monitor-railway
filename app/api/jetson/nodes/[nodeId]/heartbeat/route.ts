// app/api/jetson/nodes/[nodeId]/heartbeat/route.ts
/**
 * Jetson Node Heartbeat API
 * 接收邊緣節點心跳，更新狀態
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST - 接收心跳
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const body = await request.json();

    const {
      cpu_percent,
      memory_percent,
      gpu_memory_mb,
      cameras_active,
      inference_fps,
      uptime_seconds
    } = body;

    // 更新節點狀態
    const result = await query(`
      UPDATE edge_nodes
      SET
        status = 'online',
        last_heartbeat = NOW(),
        cpu_percent = $2,
        memory_percent = $3,
        gpu_memory_mb = $4,
        cameras_active = $5,
        inference_fps = $6,
        uptime_seconds = $7,
        updated_at = NOW()
      WHERE node_id = $1
      RETURNING *
    `, [
      nodeId,
      cpu_percent,
      memory_percent,
      gpu_memory_mb,
      cameras_active,
      inference_fps,
      uptime_seconds
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      node: result.rows[0],
      server_time: new Date().toISOString()
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { error: 'Heartbeat failed' },
      { status: 500 }
    );
  }
}
