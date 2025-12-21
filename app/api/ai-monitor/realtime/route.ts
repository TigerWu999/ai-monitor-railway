// app/api/ai-monitor/realtime/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { xcmsService } from '@/lib/xcms-service';

/**
 * Get Realtime AI Detections from XCMS
 * 獲取即時 AI 檢測結果
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cameraId = searchParams.get('cameraId');

  if (!cameraId) {
    return NextResponse.json(
      { error: 'cameraId is required' },
      { status: 400 }
    );
  }

  try {
    const detections = await xcmsService.getRealtimeDetections(parseInt(cameraId));

    return NextResponse.json({
      success: true,
      cameraId: parseInt(cameraId),
      detections,
      timestamp: new Date().toISOString(),
      source: 'xcms',
    });
  } catch (error) {
    console.error('Failed to fetch realtime detections:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch detections',
        detections: [],
      },
      { status: 500 }
    );
  }
}
