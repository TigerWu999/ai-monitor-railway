// app/api/ai-monitor/cameras/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { xcmsService } from '@/lib/xcms-service';

interface AICamera {
  id: number;
  name: string;
  status: 'online' | 'offline' | 'processing';
  streamUrl: string;
  snapshotUrl?: string;
  rtspUrl?: string;
  hlsUrl?: string;
  aiFeatures: {
    motionDetection: boolean;
    faceRecognition: boolean;
    objectTracking: boolean;
    anomalyDetection: boolean;
  };
  analytics?: {
    lastMotion?: string;
    detectedObjects?: string[];
    alertCount?: number;
  };
  location?: string;
  lastUpdate?: string;
}

/**
 * AI Monitor - Get Camera List with AI Analytics from XCMS
 */
export async function GET(request: NextRequest) {
  try {
    // 從 XCMS 獲取攝影機列表
    const xcmsCameras = await xcmsService.getCameras();

    // 獲取最近的 AI 事件來填充分析數據
    const recentEvents = await xcmsService.getAIEvents({ limit: 100 });

    // 轉換為 AI Camera 格式並加入分析數據
    const aiCameras: AICamera[] = await Promise.all(
      xcmsCameras.map(async (cam) => {
        // 獲取該攝影機的串流 URL
        const streamUrls = xcmsService.getStreamUrl(cam.id);

        // 獲取該攝影機的事件
        const cameraEvents = recentEvents.filter(e => e.cameraId === cam.id);

        // 計算檢測到的物體類型
        const detectedObjects = Array.from(
          new Set(cameraEvents.map(e => e.type))
        );

        // 獲取最後一次動態偵測時間
        const lastMotionEvent = cameraEvents.find(e => e.type === 'motion');

        return {
          id: cam.id,
          name: cam.name,
          status: cam.status as 'online' | 'offline',
          streamUrl: streamUrls.http,
          snapshotUrl: streamUrls.snapshot,
          rtspUrl: streamUrls.rtsp,
          hlsUrl: streamUrls.hls,
          aiFeatures: {
            motionDetection: true,
            faceRecognition: true,
            objectTracking: true,
            anomalyDetection: true,
          },
          analytics: {
            lastMotion: lastMotionEvent?.timestamp || new Date().toISOString(),
            detectedObjects,
            alertCount: cameraEvents.length,
          },
          lastUpdate: new Date().toISOString(),
        };
      })
    );

    return NextResponse.json({
      cameras: aiCameras,
      aiStatus: 'active',
      source: 'xcms',
      totalCameras: aiCameras.length,
      onlineCameras: aiCameras.filter(c => c.status === 'online').length,
    });
  } catch (error) {
    console.error('XCMS Camera API Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch XCMS cameras',
        cameras: [],
        aiStatus: 'error',
        source: 'xcms',
      },
      { status: 500 }
    );
  }
}

/**
 * Add new AI-enabled camera
 */
export async function POST(request: NextRequest) {
  const aiMonitorHost = process.env.AI_MONITOR_HOST || '192.168.1.184';
  const aiMonitorPort = process.env.AI_MONITOR_PORT || '9001';
  const apiKey = process.env.AI_MONITOR_API_KEY;

  try {
    const body = await request.json();

    // Add AI configuration
    const aiEnhancedBody = {
      ...body,
      aiConfig: {
        enableMotionDetection: true,
        enableFaceRecognition: body.enableFaceRecognition ?? false,
        enableObjectTracking: body.enableObjectTracking ?? true,
        enableAnomalyDetection: body.enableAnomalyDetection ?? true,
        alertThreshold: body.alertThreshold ?? 0.8,
      },
    };

    const response = await fetch(`http://${aiMonitorHost}:${aiMonitorPort}/api/cameras`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiEnhancedBody),
    });

    const data = await response.json();
    return NextResponse.json({
      ...data,
      message: 'AI-enabled camera added successfully',
    }, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to add AI camera',
      },
      { status: 500 }
    );
  }
}