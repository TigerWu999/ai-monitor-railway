// app/api/ai-monitor/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { xcmsService } from '@/lib/xcms-service';

/**
 * Get AI Detection Events from XCMS
 * 獲取 XCMS AI 行為分析事件
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const cameraId = searchParams.get('cameraId');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const eventType = searchParams.get('eventType');
  const limit = searchParams.get('limit');

  try {
    const events = await xcmsService.getAIEvents({
      cameraId: cameraId ? parseInt(cameraId) : undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      eventType: eventType || undefined,
      limit: limit ? parseInt(limit) : 50,
    });

    return NextResponse.json({
      success: true,
      events,
      total: events.length,
      source: 'xcms',
    });
  } catch (error) {
    console.error('Failed to fetch XCMS events:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch events',
        events: [],
      },
      { status: 500 }
    );
  }
}
