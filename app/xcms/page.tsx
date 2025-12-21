'use client';

import { useEffect } from 'react';

export default function XCMSPage() {
  useEffect(() => {
    // 當頁面載入時，自動跳轉到 XCMS 系統 (使用 Tailscale IP)
    const xcmsUrl = process.env.NEXT_PUBLIC_XCMS_URL || 'http://100.113.105.10:9001';

    // 使用 iframe 嵌入或直接跳轉
    const iframe = document.getElementById('xcms-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = xcmsUrl;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            XCMS 視頻行為分析系統
          </h1>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400">
                <p className="text-green-700">
                  <strong>系統狀態：</strong>已授權運行中
                </p>
                <p className="text-green-700">
                  <strong>有效期限：</strong>至 2025-12-22 21:12:45
                </p>
              </div>

              {/* 嵌入 XCMS 介面 */}
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden" style={{ height: '800px' }}>
                <iframe
                  id="xcms-iframe"
                  src="http://100.113.105.10:9001"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="camera; microphone"
                  title="XCMS System"
                />
              </div>

              <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400">
                <p className="text-blue-700 text-sm">
                  <strong>登入資訊：</strong>帳號 admin / 密碼 admin
                </p>
                <p className="text-blue-700 text-sm mt-2">
                  如無法顯示，請<a
                    href="http://100.113.105.10:9001"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    點擊這裡在新視窗開啟
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}