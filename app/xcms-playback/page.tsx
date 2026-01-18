import XCMSPlayback from '@/components/XCMSPlayback';

export default function XCMSPlaybackPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            錄影回放
          </h1>
          <p className="text-gray-600">
            瀏覽和播放 H.265 高畫質錄影檔案
          </p>
        </div>

        <XCMSPlayback />
      </div>
    </div>
  );
}
