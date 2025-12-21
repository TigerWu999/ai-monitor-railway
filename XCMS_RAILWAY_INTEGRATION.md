# XCMS Railway 整合部署指南

## 整合架構

```
[Railway App] <--Tailscale--> [Bridge Service:8080] <--Local--> [XCMS:9001]
     ↑                              ↑                              ↑
  Web 介面                     API 轉發                        影像處理
  (雲端訪問)                   (認證授權)                      (本地運行)
```

## 已完成的整合

### 1. Bridge 服務 ✅
- 位置：`http://100.113.105.10:8080`（透過 Tailscale）
- 狀態：運行中
- API 端點：
  - `GET /` - 服務狀態
  - `GET /api/status` - XCMS 系統狀態
  - `GET /api/cameras` - 攝影機列表
  - `GET /api/alerts` - 警報列表
  - `POST /api/control/:cameraId/:action` - 控制攝影機

### 2. Railway IoT 前端整合 ✅
- 已更新 API 路由使用 Bridge 服務
- 支援的端點：
  - `/api/xcms` - XCMS 主 API
  - `/api/xcms/[...path]` - 代理路由
- 本地測試通過 ✅

## Railway 部署步驟

### 步驟 1：設定環境變數

在 Railway 專案控制台設定以下環境變數：

```bash
XCMS_BRIDGE_URL=http://100.113.105.10:8080
XCMS_API_KEY=ba980299eaa093c9a3805a779b32c2a619fb5e69737ca721b7ce537910c9d0bb
```

#### 如何設定：
1. 登入 Railway: https://railway.app/
2. 進入專案 "sparkling-inspiration"
3. 點擊 "web-app" 服務
4. 進入 "Variables" 標籤
5. 點擊 "New Variable"
6. 添加上述兩個變數
7. 點擊 "Deploy" 重新部署

### 步驟 2：驗證部署

部署完成後，訪問以下端點驗證整合：

```bash
# 檢查 Bridge 連接
curl https://your-railway-app.up.railway.app/api/xcms

# 檢查攝影機
curl https://your-railway-app.up.railway.app/api/xcms?endpoint=cameras

# 檢查系統狀態
curl https://your-railway-app.up.railway.app/api/xcms?endpoint=system
```

## 網路需求

### Tailscale VPN
Railway 應用必須能夠連接到 Tailscale 網路上的 IP：`100.113.105.10`

**重要提醒**：
- Bridge 服務必須持續運行在 `100.113.105.10:8080`
- 確保 XCMS 在 `192.168.1.184:9001` 運行中
- 兩者之間的網路必須暢通

### 替代方案：Cloudflare Tunnel

如果 Railway 無法直接訪問 Tailscale IP，可以考慮使用 Cloudflare Tunnel：

```bash
# 在本地機器安裝並啟動 Cloudflare Tunnel
cloudflared tunnel create xcms-bridge
cloudflared tunnel route dns xcms-bridge bridge.yourdomain.com
cloudflared tunnel run xcms-bridge --url http://localhost:8080
```

然後更新環境變數：
```bash
XCMS_BRIDGE_URL=https://bridge.yourdomain.com
```

## API 使用範例

### 前端使用 XCMS API

```javascript
// 獲取攝影機列表
const response = await fetch('/api/xcms?endpoint=cameras');
const data = await response.json();
console.log(data.cameras);

// 獲取系統狀態
const status = await fetch('/api/xcms?endpoint=system');
const sysData = await status.json();
console.log(sysData.system);

// 控制攝影機
const control = await fetch('/api/xcms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'start_recording',
    cameraId: 1
  })
});
```

## 監控與維護

### 檢查 Bridge 服務狀態

```bash
# 本地檢查
curl http://100.113.105.10:8080/

# 檢查 XCMS 連接
curl -H "X-API-Key: ba980299eaa093c9a3805a779b32c2a619fb5e69737ca721b7ce537910c9d0bb" \
  http://100.113.105.10:8080/api/status
```

### 重啟服務

```bash
# 重啟 Bridge 服務
cd /home/tigerwu/Downloads/xcms.x64.ubuntu20.ovtrt/xcms.4.721.x64.ubuntu20.ovtrt/railway-xcms-bridge
source venv/bin/activate
python app.py
```

## 故障排除

### 問題 1：Railway 無法連接到 Bridge
- 檢查 Tailscale 是否運行
- 確認 `100.113.105.10` 是否可訪問
- 檢查防火牆設定

### 問題 2：Bridge 無法連接到 XCMS
- 確認 XCMS 在 `192.168.1.184:9001` 運行
- 測試本地網路連接：`curl http://192.168.1.184:9001`

### 問題 3：API 返回 401 錯誤
- 檢查 `XCMS_API_KEY` 環境變數是否正確設定
- 確認 API Key 與 Bridge 服務的配置一致

## 下一步

- [ ] 在 Railway 設定環境變數
- [ ] 驗證 Railway 到 Tailscale 的連接
- [ ] 測試所有 API 端點
- [ ] 監控應用效能和錯誤
- [ ] 考慮設定 Cloudflare Tunnel 作為備用方案

## 相關資源

- Railway 專案：https://railway.app/project/sparkling-inspiration
- GitHub Repo：https://github.com/TigerWu999/ai-monitor-railway
- XCMS 管理介面：http://192.168.1.184:9001
- Tailscale 管理：https://login.tailscale.com/admin

---

🤖 自動生成於 2025-12-21
