// app/api/xcms/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Real XCMS Integration API
 * Connects to actual XCMS system through Railway-XCMS Bridge
 */

// Railway-XCMS Bridge 配置
const XCMS_BRIDGE_URL = process.env.XCMS_BRIDGE_URL || 'http://100.113.105.10:8080';
const XCMS_API_KEY = process.env.XCMS_API_KEY || 'ba980299eaa093c9a3805a779b32c2a619fb5e69737ca721b7ce537910c9d0bb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'status';

  try {
    switch (endpoint) {
      case 'cameras':
        // 透過 Bridge 獲取攝影機列表
        const camerasResponse = await fetch(`${XCMS_BRIDGE_URL}/api/cameras`, {
          headers: {
            'X-API-Key': XCMS_API_KEY
          },
          signal: AbortSignal.timeout(5000)
        });

        if (!camerasResponse.ok) {
          throw new Error('Failed to fetch cameras from Bridge');
        }

        const camerasData = await camerasResponse.json();
        return NextResponse.json({
          success: true,
          ...camerasData
        });

      case 'system':
        // 透過 Bridge 獲取系統狀態
        const systemResponse = await fetch(`${XCMS_BRIDGE_URL}/api/status`, {
          headers: {
            'X-API-Key': XCMS_API_KEY
          },
          signal: AbortSignal.timeout(5000)
        });

        if (!systemResponse.ok) {
          throw new Error('Failed to fetch system status from Bridge');
        }

        const systemData = await systemResponse.json();
        return NextResponse.json({
          success: true,
          system: systemData
        });

      case 'alerts':
        // 透過 Bridge 獲取警報列表
        const alertsResponse = await fetch(`${XCMS_BRIDGE_URL}/api/alerts`, {
          headers: {
            'X-API-Key': XCMS_API_KEY
          },
          signal: AbortSignal.timeout(5000)
        });

        if (!alertsResponse.ok) {
          throw new Error('Failed to fetch alerts from Bridge');
        }

        const alertsData = await alertsResponse.json();
        return NextResponse.json({
          success: true,
          ...alertsData
        });

      default:
        // 默認狀態檢查 - 檢查 Bridge 服務狀態
        const statusResponse = await fetch(`${XCMS_BRIDGE_URL}/`, {
          signal: AbortSignal.timeout(3000)
        });

        const statusData = await statusResponse.json();

        return NextResponse.json({
          success: true,
          status: 'operational',
          bridge: statusData,
          endpoints: {
            cameras: '/api/xcms?endpoint=cameras',
            system: '/api/xcms?endpoint=system',
            alerts: '/api/xcms?endpoint=alerts'
          }
        });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      bridge: {
        url: XCMS_BRIDGE_URL
      }
    }, { status: 500 });
  }
}

// POST - 控制 XCMS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, cameraId } = body;

    // 透過 Bridge 控制攝影機
    const controlResponse = await fetch(`${XCMS_BRIDGE_URL}/api/control/${cameraId}/${action}`, {
      method: 'POST',
      headers: {
        'X-API-Key': XCMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000)
    });

    if (!controlResponse.ok) {
      throw new Error('Failed to control camera through Bridge');
    }

    const controlData = await controlResponse.json();

    return NextResponse.json({
      success: true,
      ...controlData
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}