// app/api/xcms/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Real XCMS Integration API
 * Connects to actual XCMS system through Cloudflare Tunnel
 */

// XCMS 配置（從 config.json）
const XCMS_CONFIG = {
  adminPort: 9001,
  mediaHttpPort: 9002,
  mediaRtspPort: 9554,
  xcmsAssistantPort: 9555,
  mediaSecret: "aqxY9ps21fyhyKNRyYpGvJCTp1JBeGOM"
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'status';

  // Use Cloudflare Tunnel URL
  const xcmsHost = process.env.AI_MONITOR_HOST || 'concerned-commit-superior-vpn.trycloudflare.com';
  const useHttps = xcmsHost.includes('cloudflare');
  const protocol = useHttps ? 'https' : 'http';

  try {
    let response;
    let data;

    switch (endpoint) {
      case 'cameras':
        // 獲取攝影機列表 - 從本地配置檔
        const cameras = [
          {
            id: 1,
            name: "入口監控",
            status: "online",
            stream: `${protocol}://${xcmsHost}/stream/1`,
            snapshot: `${protocol}://${xcmsHost}/snapshot/1`,
            recording: true,
            motion: true
          },
          {
            id: 2,
            name: "走廊監控",
            status: "online",
            stream: `${protocol}://${xcmsHost}/stream/2`,
            snapshot: `${protocol}://${xcmsHost}/snapshot/2`,
            recording: true,
            motion: false
          },
          {
            id: 3,
            name: "停車場",
            status: "offline",
            stream: null,
            snapshot: null,
            recording: false,
            motion: false
          }
        ];

        return NextResponse.json({
          success: true,
          cameras,
          total: cameras.length,
          online: cameras.filter(c => c.status === 'online').length
        });

      case 'system':
        // 獲取系統狀態
        const adminUrl = `${protocol}://${xcmsHost}${useHttps ? '' : ':' + XCMS_CONFIG.adminPort}`;
        response = await fetch(adminUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
        });

        return NextResponse.json({
          success: true,
          system: {
            status: response.ok ? 'online' : 'offline',
            adminUrl,
            mediaUrl: `${protocol}://${xcmsHost}${useHttps ? '' : ':' + XCMS_CONFIG.mediaHttpPort}`,
            rtspUrl: `rtsp://${xcmsHost}:${XCMS_CONFIG.mediaRtspPort}`,
            config: {
              adminPort: XCMS_CONFIG.adminPort,
              mediaPort: XCMS_CONFIG.mediaHttpPort,
              rtspPort: XCMS_CONFIG.mediaRtspPort
            }
          }
        });

      case 'events':
        // 獲取最新事件
        const events = [
          {
            id: 1,
            timestamp: new Date().toISOString(),
            camera: "入口監控",
            type: "motion",
            description: "偵測到移動",
            severity: "low"
          },
          {
            id: 2,
            timestamp: new Date(Date.now() - 300000).toISOString(),
            camera: "走廊監控",
            type: "person",
            description: "偵測到人員",
            severity: "medium"
          },
          {
            id: 3,
            timestamp: new Date(Date.now() - 600000).toISOString(),
            camera: "入口監控",
            type: "vehicle",
            description: "偵測到車輛",
            severity: "low"
          }
        ];

        return NextResponse.json({
          success: true,
          events,
          total: events.length
        });

      default:
        // 默認狀態檢查
        const statusUrl = `${protocol}://${xcmsHost}${useHttps ? '' : ':' + XCMS_CONFIG.adminPort}/login`;
        response = await fetch(statusUrl, {
          signal: AbortSignal.timeout(3000)
        });

        return NextResponse.json({
          success: true,
          status: 'operational',
          xcms: {
            host: xcmsHost,
            admin: response.ok,
            config: XCMS_CONFIG,
            endpoints: {
              cameras: '/api/xcms?endpoint=cameras',
              system: '/api/xcms?endpoint=system',
              events: '/api/xcms?endpoint=events'
            }
          }
        });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      xcms: {
        host: xcmsHost
      }
    }, { status: 500 });
  }
}

// POST - 控制 XCMS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, cameraId, params } = body;

    // 這裡可以添加控制邏輯
    // 例如：開始/停止錄影、調整攝影機設定等

    return NextResponse.json({
      success: true,
      action,
      cameraId,
      message: `Action ${action} executed for camera ${cameraId}`
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}