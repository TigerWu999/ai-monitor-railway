// app/api/ai-monitor/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { xcmsService } from '@/lib/xcms-service';

/**
 * Get AI Analytics from XCMS
 * 獲取 XCMS AI 分析統計
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const cameraId = searchParams.get('cameraId');
  const period = searchParams.get('period') as '1h' | '24h' | '7d' | '30d' || '24h';

  if (!cameraId) {
    return NextResponse.json(
      { error: 'cameraId is required' },
      { status: 400 }
    );
  }

  try {
    const analytics = await xcmsService.getAnalytics(parseInt(cameraId), period);

    return NextResponse.json({
      success: true,
      analytics,
      source: 'xcms',
    });
  } catch (error) {
    console.error('Failed to fetch XCMS analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}
