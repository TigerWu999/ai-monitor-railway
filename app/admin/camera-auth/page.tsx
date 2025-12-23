'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Authorization {
  id: string;
  cameraId: string;
  cameraName: string;
  ownerTenant: string;
  authorizedTenant: string;
  permissions: string[];
  isActive: boolean;
  authorizedAt: string;
  expiresAt: string | null;
}

export default function CameraAuthorizationPage() {
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 這裡暫時使用模擬資料
    // 實際應該呼叫 API: /api/admin/camera-authorizations
    setTimeout(() => {
      setAuthorizations([
        {
          id: '1',
          cameraId: 'cam-001',
          cameraName: 'XCMS 大門入口攝影機',
          ownerTenant: '總平台系統',
          authorizedTenant: '桃園市環保局',
          permissions: ['view'],
          isActive: true,
          authorizedAt: '2025-12-22T15:30:00Z',
          expiresAt: null,
        },
        {
          id: '2',
          cameraId: 'cam-002',
          cameraName: 'XCMS 停車場監控',
          ownerTenant: '總平台系統',
          authorizedTenant: '桃園市環保局',
          permissions: ['view'],
          isActive: true,
          authorizedAt: '2025-12-22T15:30:00Z',
          expiresAt: null,
        },
        {
          id: '3',
          cameraId: 'cam-002',
          cameraName: 'XCMS 停車場監控',
          ownerTenant: '總平台系統',
          authorizedTenant: '臺北市環保局',
          permissions: ['view'],
          isActive: true,
          authorizedAt: '2025-12-22T15:30:00Z',
          expiresAt: null,
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            攝影機授權管理
          </h1>
          <p className="text-gray-600">
            管理 XCMS 攝影機的跨租戶授權關係
          </p>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{authorizations.length}</div>
              <div className="text-sm text-gray-600">總授權數</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {authorizations.filter(a => a.isActive).length}
              </div>
              <div className="text-sm text-gray-600">啟用中</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {new Set(authorizations.map(a => a.cameraId)).size}
              </div>
              <div className="text-sm text-gray-600">已授權攝影機</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(authorizations.map(a => a.authorizedTenant)).size}
              </div>
              <div className="text-sm text-gray-600">授權租戶數</div>
            </CardContent>
          </Card>
        </div>

        {/* 授權列表 */}
        <Card>
          <CardHeader>
            <CardTitle>授權關係列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">攝影機</th>
                    <th className="text-left py-3 px-4">擁有者</th>
                    <th className="text-left py-3 px-4">授權給</th>
                    <th className="text-left py-3 px-4">權限</th>
                    <th className="text-left py-3 px-4">狀態</th>
                    <th className="text-left py-3 px-4">授權日期</th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {authorizations.map((auth) => (
                    <tr key={auth.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{auth.cameraName}</div>
                        <div className="text-sm text-gray-500">{auth.cameraId}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {auth.ownerTenant}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {auth.authorizedTenant}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {auth.permissions.map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {auth.isActive ? (
                          <Badge className="bg-green-100 text-green-800">啟用</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">停用</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(auth.authorizedAt).toLocaleDateString('zh-TW')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            編輯
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm">
                            撤銷
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 新增授權按鈕 */}
        <div className="mt-6">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            ➕ 新增授權
          </button>
        </div>

        {/* 說明 */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 授權說明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>view</strong>: 可查看即時影像和快照</li>
              <li>• <strong>manage</strong>: 可控制攝影機（PTZ、設定等）</li>
              <li>• <strong>admin</strong>: 完整管理權限</li>
              <li>• 授權可設定過期時間，到期後自動停用</li>
              <li>• 撤銷授權後，被授權租戶將無法再訪問該攝影機</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
