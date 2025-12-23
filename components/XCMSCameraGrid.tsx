'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface XCMSInfo {
  cameraId: number;
  host: string;
  source: string;
}

interface StreamUrls {
  rtsp?: string;
  http?: string;
  hls?: string;
  snapshot?: string;
  tailscale_rtsp?: string;
  tailscale_http?: string;
}

interface Camera {
  id: string;
  name: string;
  deviceId: string;
  type: string;
  status: string;
  location: {
    address: string;
    zone: string;
  };
  xcms: XCMSInfo | null;
  streamUrls: StreamUrls;
  aiCapabilities: Record<string, boolean>;
  specs: Record<string, any>;
  ownershipType: 'owned' | 'authorized';
  permissions: string[] | null;
  isActive: boolean;
  createdAt: string;
}

interface CameraGridProps {
  tenantId?: string;
}

export default function XCMSCameraGrid({ tenantId = 'platform-system' }: CameraGridProps) {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 30000); // 每 30 秒更新
    return () => clearInterval(interval);
  }, [tenantId]);

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cameras/authorized?tenant_id=${tenantId}`);
      const data = await response.json();

      if (data.success) {
        setCameras(data.cameras);
        setSummary(data.summary);
        setError(null);
      } else {
        setError(data.error || '獲取攝影機資料失敗');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      console.error('獲取攝影機失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return '🔒';
      case 'safety': return '🦺';
      case 'traffic': return '🚦';
      case 'environment': return '🌳';
      default: return '📹';
    }
  };

  if (loading && cameras.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">載入攝影機資料中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">❌ {error}</p>
        <button
          onClick={fetchCameras}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          重試
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 摘要統計 */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
              <div className="text-sm text-gray-600">總攝影機</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{summary.owned}</div>
              <div className="text-sm text-gray-600">自有</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">{summary.authorized}</div>
              <div className="text-sm text-gray-600">授權查看</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{summary.xcms}</div>
              <div className="text-sm text-gray-600">XCMS 攝影機</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-emerald-600">{summary.online}</div>
              <div className="text-sm text-gray-600">線上</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 攝影機網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((camera) => (
          <Card key={camera.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>{getTypeIcon(camera.type)}</span>
                    <span>{camera.name}</span>
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{camera.deviceId}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(camera.status)}`} />
                  {camera.xcms && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      XCMS
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 擁有權標記 */}
              <div className="flex gap-2">
                {camera.ownershipType === 'owned' ? (
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    自有攝影機
                  </Badge>
                ) : (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                    授權查看
                  </Badge>
                )}
                {camera.permissions && (
                  <Badge variant="outline" className="text-xs">
                    {camera.permissions.join(', ')}
                  </Badge>
                )}
              </div>

              {/* 位置資訊 */}
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">📍</span>
                  <span>{camera.location.address}</span>
                </div>
                {camera.location.zone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">🏢</span>
                    <span className="text-gray-600">{camera.location.zone}</span>
                  </div>
                )}
              </div>

              {/* XCMS 資訊 */}
              {camera.xcms && (
                <div className="bg-orange-50 rounded-lg p-3 text-sm">
                  <div className="font-medium text-orange-800 mb-1">XCMS 資訊</div>
                  <div className="space-y-1 text-gray-700">
                    <div>攝影機 ID: #{camera.xcms.cameraId}</div>
                    <div className="text-xs text-gray-500">{camera.xcms.host}</div>
                  </div>
                </div>
              )}

              {/* AI 能力 */}
              {camera.aiCapabilities && Object.keys(camera.aiCapabilities).length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">AI 能力</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(camera.aiCapabilities)
                      .filter(([_, enabled]) => enabled)
                      .map(([capability]) => (
                        <Badge
                          key={capability}
                          variant="secondary"
                          className="text-xs bg-blue-50 text-blue-700"
                        >
                          {capability}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* 串流連結 */}
              <div className="flex gap-2">
                {camera.streamUrls.snapshot && (
                  <button
                    onClick={() => window.open(camera.streamUrls.snapshot, '_blank')}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    📸 快照
                  </button>
                )}
                {(camera.streamUrls.hls || camera.streamUrls.http) && (
                  <button
                    onClick={() => {
                      const url = camera.streamUrls.tailscale_http || camera.streamUrls.http;
                      if (url) window.open(url, '_blank');
                    }}
                    className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                  >
                    ▶️ 串流
                  </button>
                )}
              </div>

              {/* 技術規格 */}
              {camera.specs && (
                <div className="text-xs text-gray-500 pt-2 border-t">
                  {camera.specs.resolution && <span>{camera.specs.resolution}</span>}
                  {camera.specs.fps && <span> • {camera.specs.fps} FPS</span>}
                  {camera.specs.ai_engine && (
                    <div className="mt-1">{camera.specs.ai_engine}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {cameras.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">目前沒有可用的攝影機</p>
          <p className="text-sm mt-2">請確認您的租戶權限設定</p>
        </div>
      )}
    </div>
  );
}
