import XCMSCameraGrid from '@/components/XCMSCameraGrid';

export default function XCMSCamerasPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            XCMS 攝影機監控系統
          </h1>
          <p className="text-gray-600">
            整合 XCMS 視頻行為分析系統，支援多租戶授權管理
          </p>
        </div>

        <XCMSCameraGrid tenantId="platform-system" />
      </div>
    </div>
  );
}
