# 部署 AI Monitor 到 GitHub 和 Railway

## 📋 快速部署步驟

### 步驟 1：登入 GitHub（如果還沒登入）

```bash
gh auth login
```
選擇：
- GitHub.com
- HTTPS
- Y (authenticate with credentials)
- Login with a web browser

### 步驟 2：創建 GitHub Repository

```bash
cd ~/railway-ai-monitor-test

# 創建公開 repository
gh repo create ai-monitor-railway --public --source=. --remote=origin --push

# 或創建私有 repository
gh repo create ai-monitor-railway --private --source=. --remote=origin --push
```

### 步驟 3：連接 Railway 到 GitHub

#### 方法 A：使用 Railway CLI
```bash
railway link
# 選擇 sparkling-inspiration
# 選擇 production environment
# 選擇 web-app service

railway up
```

#### 方法 B：使用 Railway Dashboard

1. 開啟 https://railway.app/dashboard
2. 選擇 `sparkling-inspiration` 專案
3. 點擊 "+ New Service"
4. 選擇 "Deploy from GitHub repo"
5. 選擇剛創建的 `ai-monitor-railway` repository
6. Railway 會自動開始部署

### 步驟 4：確認環境變數

在 Railway Dashboard 確認以下環境變數已設定：

```env
AI_MONITOR_HOST=100.113.105.10
AI_MONITOR_PORT=9001
AI_MONITOR_API_KEY=ba980299eaa093c9a3805a779b32c2a619fb5e69737ca721b7ce537910c9d0bb
```

### 步驟 5：訪問您的 AI Monitor

部署完成後（約 2-3 分鐘），訪問：

- 主頁：https://www.qcair.us
- AI Monitor：https://www.qcair.us/ai-monitor
- API 狀態：https://www.qcair.us/api/ai-monitor

## 🚀 一鍵部署腳本

```bash
#!/bin/bash
# deploy.sh

# 1. 創建 GitHub repo
gh repo create ai-monitor-railway --public --source=. --remote=origin --push

# 2. 連接並部署到 Railway
railway link
railway up

echo "✅ 部署完成！"
echo "訪問: https://www.qcair.us/ai-monitor"
```

## 🔧 如果遇到問題

### GitHub 登入失敗？
```bash
# 使用個人訪問令牌
gh auth login --with-token < your-token.txt
```

### Railway 部署失敗？
```bash
# 查看日誌
railway logs

# 重新部署
railway up --detach
```

### 無法訪問 AI Monitor？
1. 檢查 Tailscale 連線：`tailscale status`
2. 確認環境變數：`railway variables`
3. 查看錯誤日誌：`railway logs --tail`

## 📝 專案資訊

- **專案名稱**：AI Monitor Integration
- **技術堆疊**：Next.js 14 + TypeScript + Tailwind CSS
- **AI 功能**：
  - 即時監控
  - 物件偵測
  - 人臉辨識
  - 異常檢測
- **連接方式**：Tailscale VPN (100.113.105.10)

## ✅ 檢查清單

- [ ] GitHub 已登入
- [ ] Repository 已創建
- [ ] Railway 已連接
- [ ] 環境變數已設定
- [ ] 部署成功
- [ ] AI Monitor 頁面可訪問
- [ ] API 正常運作

---

Created with AI Monitor Integration System
Tailscale IP: 100.113.105.10