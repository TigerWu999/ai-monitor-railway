'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CameraInfo {
  camera_id: string;
  total_recordings: number;
  total_size_mb: number;
  dates: string[];
}

interface Recording {
  filename: string;
  time: string;
  size_mb: number;
  duration_estimate: string;
  url: string;
}

interface PlaybackSummary {
  recordings_dir: string;
  total_cameras: number;
  total_recordings: number;
  total_size_mb: number;
  total_size_gb: number;
}

// XMCS Bridge URL - 透過 xmcs-bridge.qcair.us 存取本地 API
const XMCS_BRIDGE_URL = process.env.NEXT_PUBLIC_XMCS_URL || 'https://xmcs-bridge.qcair.us';

export default function XCMSPlayback() {
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [summary, setSummary] = useState<PlaybackSummary | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 載入攝影機列表
  useEffect(() => {
    fetchCameras();
    fetchSummary();
  }, []);

  // 當選擇攝影機和日期時載入錄影列表
  useEffect(() => {
    if (selectedCamera && selectedDate) {
      fetchRecordings(selectedCamera, selectedDate);
    }
  }, [selectedCamera, selectedDate]);

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${XMCS_BRIDGE_URL}/api/v1/playback/summary`);
      const data = await response.json();
      if (data.code === 0) {
        setSummary(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${XMCS_BRIDGE_URL}/api/v1/playback/cameras`);
      const data = await response.json();

      if (data.code === 0) {
        setCameras(data.data);
        setError(null);
        // 自動選擇第一個攝影機和日期
        if (data.data.length > 0) {
          const firstCamera = data.data[0];
          setSelectedCamera(firstCamera.camera_id);
          if (firstCamera.dates.length > 0) {
            setSelectedDate(firstCamera.dates[0]);
          }
        }
      } else {
        setError(data.error || '獲取攝影機列表失敗');
      }
    } catch (err) {
      setError('無法連接到 XMCS Bridge');
      console.error('Failed to fetch cameras:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordings = async (cameraId: string, date: string) => {
    try {
      const response = await fetch(`${XMCS_BRIDGE_URL}/api/v1/playback/list/${cameraId}/${date}`);
      const data = await response.json();

      if (data.code === 0) {
        setRecordings(data.data);
        // 自動選擇第一個錄影
        if (data.data.length > 0) {
          setSelectedVideo(`${XMCS_BRIDGE_URL}${data.data[0].url}`);
        }
      } else {
        setRecordings([]);
      }
    } catch (err) {
      console.error('Failed to fetch recordings:', err);
      setRecordings([]);
    }
  };

  const handleCameraChange = (cameraId: string) => {
    setSelectedCamera(cameraId);
    const camera = cameras.find(c => c.camera_id === cameraId);
    if (camera && camera.dates.length > 0) {
      setSelectedDate(camera.dates[0]);
    } else {
      setSelectedDate('');
      setRecordings([]);
    }
    setSelectedVideo('');
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedVideo('');
  };

  const handleRecordingClick = (recording: Recording) => {
    setSelectedVideo(`${XMCS_BRIDGE_URL}${recording.url}`);
  };

  const getCameraDisplayName = (cameraId: string) => {
    // 將 camera ID 轉換為顯示名稱
    const nameMap: Record<string, string> = {
      'cam001': '移動式攝影機-1',
      'cam002': '移動式攝影機-2',
    };
    return nameMap[cameraId] || cameraId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">載入中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">錯誤</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchCameras}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          重試
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 摘要卡片 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{summary.total_cameras}</div>
              <div className="text-sm text-gray-500">攝影機數量</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{summary.total_recordings}</div>
              <div className="text-sm text-gray-500">錄影檔數量</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{summary.total_size_mb.toFixed(1)} MB</div>
              <div className="text-sm text-gray-500">總檔案大小</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">H.265</div>
              <div className="text-sm text-gray-500">編碼格式</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：選擇面板 */}
        <div className="space-y-4">
          {/* 攝影機選擇 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">選擇攝影機</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cameras.map((camera) => (
                  <button
                    key={camera.camera_id}
                    onClick={() => handleCameraChange(camera.camera_id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedCamera === camera.camera_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{getCameraDisplayName(camera.camera_id)}</div>
                    <div className="text-sm text-gray-500">
                      {camera.total_recordings} 個錄影 · {camera.total_size_mb.toFixed(1)} MB
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 日期選擇 */}
          {selectedCamera && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">選擇日期</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cameras
                    .find(c => c.camera_id === selectedCamera)
                    ?.dates.map((date) => (
                      <button
                        key={date}
                        onClick={() => handleDateChange(date)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedDate === date
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">{date}</div>
                      </button>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 錄影列表 */}
          {recordings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">錄影檔案</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recordings.map((recording) => (
                    <button
                      key={recording.filename}
                      onClick={() => handleRecordingClick(recording)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedVideo.includes(recording.filename)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{recording.time}</div>
                        <Badge variant="secondary">{recording.size_mb.toFixed(1)} MB</Badge>
                      </div>
                      <div className="text-sm text-gray-500">{recording.duration_estimate}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右側：影片播放器 */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>影片播放</span>
                {selectedVideo && (
                  <a
                    href={selectedVideo}
                    download
                    className="text-sm font-normal text-blue-600 hover:text-blue-800"
                  >
                    下載影片
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedVideo ? (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    key={selectedVideo}
                    controls
                    className="w-full aspect-video"
                    src={selectedVideo}
                  >
                    您的瀏覽器不支援影片播放
                  </video>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <div className="text-center text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mt-2">選擇錄影檔案以開始播放</p>
                  </div>
                </div>
              )}

              {/* 播放資訊 */}
              {selectedVideo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">攝影機：</span>
                      <span className="font-medium ml-1">{getCameraDisplayName(selectedCamera)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">日期：</span>
                      <span className="font-medium ml-1">{selectedDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">編碼：</span>
                      <span className="font-medium ml-1">H.265 (HEVC)</span>
                    </div>
                    <div>
                      <span className="text-gray-500">格式：</span>
                      <span className="font-medium ml-1">MP4</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
