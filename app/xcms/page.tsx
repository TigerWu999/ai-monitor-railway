'use client';

import { useEffect, useState } from 'react';

export default function XCMSPage() {
  const xcmsUrl = 'https://attachments-surfaces-telecommunications-operating.trycloudflare.com';

  useEffect(() => {
    // 立即重導向到 XCMS（使用 Cloudflare Tunnel）
    window.location.href = xcmsUrl;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🎥 XCMS 視頻行為分析系統
              </h1>
              <p className="text-lg text-gray-600">
                AI 智慧監控管理平台
              </p>
            </div>

            <div className="mb-8 p-6 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <p className="text-green-800 font-medium text-lg mb-2">系統狀態：已授權運行中</p>
              <p className="text-green-700">有效期限：至 2025-12-22 21:12:45</p>
            </div>

            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
              <p className="text-gray-600 text-lg mt-4">
                正在載入 XCMS 系統...
              </p>
            </div>

            <div className="space-y-4">
              <a
                href="https://attachments-surfaces-telecommunications-operating.trycloudflare.com"
                className="block w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-lg"
              >
                立即進入 XCMS 系統
              </a>

              <div className="text-sm text-gray-500 space-y-2">
                <p>如果沒有自動跳轉，請點擊上方按鈕</p>
                <p className="font-mono bg-gray-100 px-3 py-2 rounded">
                  {xcmsUrl}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800 font-semibold mb-2">🔑 登入資訊</p>
                <div className="text-blue-700 text-sm space-y-1">
                  <p>帳號：admin</p>
                  <p>密碼：admin</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">連線方式</p>
                <p className="font-semibold text-gray-900">Tailscale VPN</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-1">系統版本</p>
                <p className="font-semibold text-gray-900">v4.721</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>需要安裝 Tailscale 並連接到同一網路才能訪問</p>
          <p className="mt-2">
            <a
              href="https://tailscale.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              下載 Tailscale →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}