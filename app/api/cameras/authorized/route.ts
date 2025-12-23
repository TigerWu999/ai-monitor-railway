import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * 獲取指定租戶有權查看的所有攝影機
 * 包括自有攝影機和被授權查看的攝影機
 *
 * GET /api/cameras/authorized?tenant_id=platform-system
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenant_id') || 'platform-system';

    // 查詢租戶能看到的所有攝影機（自有 + 授權）
    const result = await query(`
      SELECT
        c.id,
        c.tenant_id,
        c.name,
        c.device_id,
        c.type,
        c.status,
        c.location_address,
        c.location_zone,
        c.xcms_camera_id,
        c.xcms_host,
        c.xcms_source,
        c.stream_urls,
        c.ai_capabilities,
        c.specs,
        c.is_active,
        c.created_at,
        CASE
          WHEN c.tenant_id = $1 THEN 'owned'
          ELSE 'authorized'
        END as ownership_type,
        CASE
          WHEN c.tenant_id = $1 THEN NULL
          ELSE cta.permissions
        END as permissions
      FROM ai_cameras c
      LEFT JOIN camera_tenant_authorizations cta
        ON c.id = cta.camera_id
        AND cta.authorized_tenant_id = $1
        AND cta.is_active = true
      WHERE c.tenant_id = $1
         OR (cta.id IS NOT NULL AND cta.is_active = true)
      ORDER BY
        CASE WHEN c.tenant_id = $1 THEN 0 ELSE 1 END,
        c.created_at DESC
    `, [tenantId]);

    // 分類攝影機
    const cameras = result.rows;
    const ownedCameras = cameras.filter(c => c.ownership_type === 'owned');
    const authorizedCameras = cameras.filter(c => c.ownership_type === 'authorized');
    const xcmsCameras = cameras.filter(c => c.xcms_source === 'xcms');

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      summary: {
        total: cameras.length,
        owned: ownedCameras.length,
        authorized: authorizedCameras.length,
        xcms: xcmsCameras.length,
        online: cameras.filter(c => c.status === 'online').length,
      },
      cameras: cameras.map(camera => ({
        id: camera.id,
        name: camera.name,
        deviceId: camera.device_id,
        type: camera.type,
        status: camera.status,
        location: {
          address: camera.location_address,
          zone: camera.location_zone,
        },
        xcms: camera.xcms_camera_id ? {
          cameraId: camera.xcms_camera_id,
          host: camera.xcms_host,
          source: camera.xcms_source,
        } : null,
        streamUrls: camera.stream_urls,
        aiCapabilities: camera.ai_capabilities,
        specs: camera.specs,
        ownershipType: camera.ownership_type,
        permissions: camera.permissions,
        isActive: camera.is_active,
        createdAt: camera.created_at,
      })),
      xcms_endpoints: {
        local: 'http://192.168.1.184:9001',
        tailscale: 'http://100.113.105.10:9001',
        media_port: '9002',
        rtsp_port: '9554',
      },
    });

  } catch (error) {
    console.error('獲取授權攝影機失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: '獲取攝影機資料失敗',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
