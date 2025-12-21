// app/api/ai-monitor/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Monitor System API - System Status
 */
export async function GET(request: NextRequest) {
  // Use Cloudflare Tunnel URL directly for reliable connection
  const aiMonitorHost = process.env.AI_MONITOR_HOST || 'suggested-combined-variations-licensed.trycloudflare.com';
  const aiMonitorPort = process.env.AI_MONITOR_PORT || '443';
  const useHttps = aiMonitorHost.includes('cloudflare') || process.env.AI_MONITOR_USE_HTTPS === 'true';
  const apiKey = process.env.AI_MONITOR_API_KEY;

  try {
    const protocol = useHttps ? 'https' : 'http';
    const url = useHttps ? `https://${aiMonitorHost}` : `http://${aiMonitorHost}:${aiMonitorPort}`;

    const response = await fetch(url, {
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