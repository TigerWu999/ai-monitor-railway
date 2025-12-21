// app/api/ai-monitor/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Monitor System API - System Status
 */
export async function GET(request: NextRequest) {
  const aiMonitorHost = process.env.AI_MONITOR_HOST || '192.168.1.184';
  const aiMonitorPort = process.env.AI_MONITOR_PORT || '9001';
  const apiKey = process.env.AI_MONITOR_API_KEY;

  try {
    const response = await fetch(`http://${aiMonitorHost}:${aiMonitorPort}`, {
      headers: {
        'X-API-Key': apiKey || '',
      },
      signal: AbortSignal.timeout(5000),
    });

    const online = response.ok;

    return NextResponse.json({
      service: 'AI Monitor',
      status: online ? 'operational' : 'offline',
      system: {
        host: aiMonitorHost,
        port: aiMonitorPort,
        capabilities: {
          vision: true,
          analytics: true,
          recording: true,
          alerts: true,
        },
        endpoints: {
          admin: `http://${aiMonitorHost}:${aiMonitorPort}`,
          media: `http://${aiMonitorHost}:9002`,
          stream: `rtsp://${aiMonitorHost}:9554`,
          analytics: `http://${aiMonitorHost}:9555`,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        service: 'AI Monitor',
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection failed',
        system: {
          host: aiMonitorHost,
          port: aiMonitorPort,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}