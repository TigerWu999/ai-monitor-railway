# XCMS AI 攝影機整合指南

## 🎯 整合完成！

您的 IoT 平台現在已經整合 XCMS 視頻行為分析系統，可以：
- ✅ 顯示 XCMS 攝影機
- ✅ 獲取 AI 算法分析結果
- ✅ 查看即時檢測
- ✅ 獲取歷史事件
- ✅ 查看統計分析

---

## 📊 API 端點

### 1. 獲取攝影機列表（含 AI 功能）

```typescript
GET /api/ai-monitor/cameras

Response:
{
  "cameras": [
    {
      "id": 1,
      "name": "入口攝影機",
      "status": "online",
      "streamUrl": "http://192.168.1.184:9002/stream/1",
      "snapshotUrl": "http://192.168.1.184:9002/snapshot/1.jpg",
      "rtspUrl": "rtsp://192.168.1.184:9554/stream/1",
      "hlsUrl": "http://192.168.1.184:9002/stream/1.m3u8",
      "aiFeatures": {
        "motionDetection": true,
        "faceRecognition": true,
        "objectTracking": true,
        "anomalyDetection": true
      },
      "analytics": {
        "lastMotion": "2025-12-21T15:00:00Z",
        "detectedObjects": ["person", "vehicle"],
        "alertCount": 5
      }
    }
  ],
  "aiStatus": "active",
  "source": "xcms"
}
```

### 2. 獲取 AI 事件（行為分析結果）

```typescript
GET /api/ai-monitor/events?cameraId=1&limit=50

Query Parameters:
- cameraId (optional): 攝影機 ID
- startTime (optional): 開始時間 ISO string
- endTime (optional): 結束時間 ISO string
- eventType (optional): 事件類型 (motion, person, vehicle, etc.)
- limit (optional): 限制數量，默認 50

Response:
{
  "success": true,
  "events": [
    {
      "id": 1,
      "cameraId": 1,
      "cameraName": "入口攝影機",
      "type": "person",
      "timestamp": "2025-12-21T15:00:00Z",
      "confidence": 0.95,
      "snapshot": "http://...",
      "video": "http://...",
      "metadata": {
        "objects": [
          {
            "type": "person",
            "confidence": 0.95,
            "bbox": [100, 100, 200, 300]
          }
        ]
      }
    }
  ],
  "total": 1
}
```

### 3. 獲取分析統計

```typescript
GET /api/ai-monitor/analytics?cameraId=1&period=24h

Query Parameters:
- cameraId (required): 攝影機 ID
- period (optional): 統計週期 (1h, 24h, 7d, 30d)

Response:
{
  "success": true,
  "analytics": {
    "cameraId": 1,
    "period": "24h",
    "stats": {
      "totalEvents": 100,
      "motionEvents": 50,
      "personDetections": 30,
      "vehicleDetections": 20,
      "alerts": 5
    },
    "timeline": [
      {
        "timestamp": "2025-12-21T14:00:00Z",
        "eventType": "person",
        "count": 5
      }
    ]
  }
}
```

### 4. 獲取即時檢測結果

```typescript
GET /api/ai-monitor/realtime?cameraId=1

Response:
{
  "success": true,
  "cameraId": 1,
  "detections": [
    {
      "type": "person",
      "confidence": 0.92,
      "bbox": [100, 150, 250, 400],
      "timestamp": "2025-12-21T15:00:00Z"
    }
  ],
  "timestamp": "2025-12-21T15:00:00Z"
}
```

---

## 🎨 前端使用範例

### 1. 在頁面中顯示攝影機

```typescript
// app/cameras/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function CamerasPage() {
  const [cameras, setCameras] = useState([]);

  useEffect(() => {
    // 獲取攝影機列表
    fetch('/api/ai-monitor/cameras')
      .then(res => res.json())
      .then(data => setCameras(data.cameras));
  }, []);

  return (
    <div>
      <h1>AI 攝影機監控</h1>
      <div className="grid grid-cols-2 gap-4">
        {cameras.map(camera => (
          <div key={camera.id} className="camera-card">
            <h3>{camera.name}</h3>
            <img src={camera.snapshotUrl} alt={camera.name} />
            <div>
              <span>狀態: {camera.status}</span>
              <span>警報: {camera.analytics?.alertCount}</span>
            </div>
            <div>
              檢測到: {camera.analytics?.detectedObjects.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. 顯示即時檢測結果

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function RealtimeDetection({ cameraId }: { cameraId: number }) {
  const [detections, setDetections] = useState([]);

  useEffect(() => {
    // 每秒更新一次
    const interval = setInterval(() => {
      fetch(`/api/ai-monitor/realtime?cameraId=${cameraId}`)
        .then(res => res.json())
        .then(data => setDetections(data.detections));
    }, 1000);

    return () => clearInterval(interval);
  }, [cameraId]);

  return (
    <div className="detections">
      <h3>即時檢測</h3>
      {detections.map((det, idx) => (
        <div key={idx} className="detection-item">
          <span>{det.type}</span>
          <span>信心度: {(det.confidence * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
```

### 3. 顯示歷史事件

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function EventsTimeline({ cameraId }: { cameraId: number }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch(`/api/ai-monitor/events?cameraId=${cameraId}&limit=20`)
      .then(res => res.json())
      .then(data => setEvents(data.events));
  }, [cameraId]);

  return (
    <div className="timeline">
      <h3>事件歷史</h3>
      {events.map(event => (
        <div key={event.id} className="event-item">
          <div className="time">{new Date(event.timestamp).toLocaleString()}</div>
          <div className="type">{event.type}</div>
          <div className="camera">{event.cameraName}</div>
          {event.snapshot && (
            <img src={event.snapshot} alt="Event snapshot" />
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔧 配置

### 環境變數設定

在 `.env.local` 或 Railway 環境變數中設定：

```bash
# XCMS 連接（選擇其中一種）

# 方案 1：本地網路
XCMS_HOST=192.168.1.184
XCMS_PORT=9001

# 方案 2：Tailscale VPN
XCMS_HOST=100.113.105.10
XCMS_PORT=9001

# 方案 3：Cloudflare Tunnel
XCMS_HOST=xcms-api.tigerwu.com
XCMS_PORT=443

# API 金鑰（可選）
XCMS_API_KEY=your-api-key

# 串流端口
XCMS_RTSP_PORT=9554
XCMS_MEDIA_PORT=9002
```

---

## 🎬 影像串流整合

### 支援的串流格式

1. **RTSP** (適合 VLC, ffmpeg)
   ```
   rtsp://192.168.1.184:9554/stream/1
   ```

2. **HTTP** (適合網頁)
   ```
   http://192.168.1.184:9002/stream/1
   ```

3. **HLS** (適合 iOS, Safari)
   ```
   http://192.168.1.184:9002/stream/1.m3u8
   ```

4. **快照**
   ```
   http://192.168.1.184:9002/snapshot/1.jpg
   ```

### 在網頁中播放串流

```typescript
// 使用 HLS.js
import Hls from 'hls.js';

function VideoPlayer({ streamUrl }: { streamUrl: string }) {
  useEffect(() => {
    const video = document.getElementById('video') as HTMLVideoElement;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    }
  }, [streamUrl]);

  return <video id="video" controls />;
}
```

---

## 📈 AI 算法功能

XCMS 提供以下 AI 功能：

### 1. 動態偵測 (Motion Detection)
- 檢測畫面中的移動
- 排除風吹草動等干擾

### 2. 人員識別 (Person Detection)
- 識別人員進入畫面
- 追蹤人員移動軌跡

### 3. 車輛識別 (Vehicle Detection)
- 識別車輛類型
- 車牌識別（需要特定模型）

### 4. 行為分析 (Behavior Analysis)
- 入侵偵測 (Intrusion Detection)
- 徘徊偵測 (Loitering Detection)
- 跌倒偵測 (Fall Detection)
- 打鬥偵測 (Fight Detection)

### 5. 異常偵測 (Anomaly Detection)
- 偵測異常行為
- 物品遺留/移除

---

## 🚀 部署步驟

### 1. 確保 XCMS 運行

```bash
# 檢查 XCMS 狀態
curl http://192.168.1.184:9001

# 如果沒有運行，啟動 XCMS
cd /path/to/xcms
export LD_LIBRARY_PATH=./xcms_core:$LD_LIBRARY_PATH
./xcms
```

### 2. 測試 API

```bash
# 測試攝影機 API
curl http://localhost:3000/api/ai-monitor/cameras

# 測試事件 API
curl http://localhost:3000/api/ai-monitor/events?limit=10

# 測試即時檢測
curl http://localhost:3000/api/ai-monitor/realtime?cameraId=1
```

### 3. 部署到 Railway

```bash
# 提交代碼
git add .
git commit -m "Add XCMS AI integration"
git push

# Railway 會自動部署
```

### 4. 設定 Railway 環境變數

在 Railway 控制台設定：
- `XCMS_HOST=100.113.105.10` （或 Cloudflare Tunnel URL）
- `XCMS_PORT=9001`
- `XCMS_API_KEY=your-api-key`

---

## 🔒 安全性建議

1. **API 金鑰**
   - 使用強密碼作為 API 金鑰
   - 不要在前端暴露 API 金鑰

2. **網路安全**
   - 優先使用 Tailscale VPN
   - 或使用 Cloudflare Tunnel
   - 不要直接開放公網 IP

3. **串流安全**
   - 在 Railway API 中轉發串流
   - 添加身份驗證
   - 限制訪問權限

---

## 🎯 下一步

1. **前端整合**
   - 更新前端組件顯示攝影機
   - 添加即時串流播放器
   - 顯示 AI 檢測結果

2. **功能擴展**
   - 添加警報推送
   - 錄影回放功能
   - 統計報表

3. **優化**
   - 添加緩存減少 API 調用
   - WebSocket 即時更新
   - 離線數據同步

---

## 📞 支援

如有問題，請參考：
- XCMS 文檔：查看 XCMS 安裝目錄
- API 測試：使用 Postman 或 curl

---

生成時間：2025-12-21 23:45
整合版本：v1.0
