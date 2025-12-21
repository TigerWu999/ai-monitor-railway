# AI Monitor 整合指南

## 需要複製的檔案清單

### 1. API 路由
**源檔案**: `app/api/ai-monitor/route.ts`
**目標位置**: `[主專案]/app/api/ai-monitor/route.ts`

此檔案處理 AI Monitor API 端點，連接到 XCMS 系統。

### 2. AI Monitor 頁面
**源檔案**: `app/ai-monitor/page.tsx`
**目標位置**: `[主專案]/app/ai-monitor/page.tsx`

顯示 AI 監控介面的主頁面。

### 3. React 元件
**源檔案**: `components/AICameraGrid.tsx`
**目標位置**: `[主專案]/components/AICameraGrid.tsx`

顯示攝影機網格和狀態的元件。

## 環境變數設定

在 Railway Dashboard (sparkling-inspiration 專案) 添加：

```
AI_MONITOR_HOST=concerned-commit-superior-vpn.trycloudflare.com
AI_MONITOR_PORT=443
AI_MONITOR_USE_HTTPS=true
```

## 套件依賴

在主專案執行：
```bash
npm install axios lucide-react
```

## 訪問路徑

整合完成後，可以訪問：
- API: https://www.qcair.us/api/ai-monitor
- 頁面: https://www.qcair.us/ai-monitor

## XCMS 登入

本地 XCMS 管理介面：http://localhost:9001/login
透過 Cloudflare Tunnel：https://concerned-commit-superior-vpn.trycloudflare.com/login

## 檔案內容

所有需要的檔案都在 `/home/tigerwu/railway-ai-monitor-test/` 目錄中。