# XCMS 前端部署到 Railway 方案

## 架構設計

```
┌─────────────────┐         ┌──────────────────┐
│  Railway 雲端   │ <-----> │  GPU 電腦本地    │
│                 │         │                  │
│  XCMS 前端     │         │  XCMS 後端       │
│  - Django UI   │         │  - AI 處理引擎   │
│  - Web 介面    │         │  - GPU 運算      │
│  - 用戶訪問    │         │  - 影像分析      │
└─────────────────┘         └──────────────────┘
        ↑                           ↑
        │                           │
    使用者訪問               Cloudflare Tunnel
   www.qcair.us            (安全連接到本地)
```

## 部署方案

### 方案 A: 純靜態檔案部署 (簡單)
只部署 HTML/CSS/JS，適合簡單展示

優點：
- 簡單快速
- 不需要後端伺服器
- 成本低

缺點：
- 功能受限
- 無法處理複雜邏輯

### 方案 B: Django 應用部署 (完整) ✅ 推薦
部署完整的 Django 應用到 Railway

優點：
- 完整功能
- 保留所有 XCMS 前端特性
- 可以管理用戶權限

缺點：
- 需要更多配置
- 需要處理 Django 設定

### 方案 C: Next.js 重寫 (現代化)
用 Next.js 重寫前端介面

優點：
- 現代化技術棧
- 更好的性能
- React 生態系統

缺點：
- 需要重寫大量代碼
- 開發時間長

## 實施步驟 (方案 B - Django 部署)

### 1. 準備 XCMS 前端檔案
```bash
# 複製前端檔案到新目錄
cp -r xcms_admin /home/tigerwu/xcms-frontend-railway/
cp -r xcms_admin/static /home/tigerwu/xcms-frontend-railway/
cp -r xcms_admin/templates /home/tigerwu/xcms-frontend-railway/
```

### 2. 創建 Django 配置
```python
# settings.py
ALLOWED_HOSTS = ['*']
STATIC_URL = '/static/'
STATIC_ROOT = 'staticfiles'

# 連接到本地 XCMS 後端
XCMS_BACKEND_URL = os.environ.get('XCMS_BACKEND_URL',
    'https://concerned-commit-superior-vpn.trycloudflare.com')
```

### 3. 創建 requirements.txt
```
Django==4.2
requests
gunicorn
whitenoise
python-dotenv
```

### 4. 創建 Procfile (Railway 部署)
```
web: gunicorn xcms_admin.wsgi --bind 0.0.0.0:$PORT
```

### 5. 環境變數配置
```
XCMS_BACKEND_URL=https://concerned-commit-superior-vpn.trycloudflare.com
SECRET_KEY=your-secret-key
DEBUG=False
```

## API 橋接層

創建 API 代理來連接前端和後端：

```python
# views.py
import requests
from django.http import JsonResponse

def proxy_to_xcms(request, path):
    """代理請求到本地 XCMS 後端"""
    backend_url = settings.XCMS_BACKEND_URL

    # 轉發請求到 GPU 電腦
    response = requests.request(
        method=request.method,
        url=f"{backend_url}/{path}",
        headers=request.headers,
        data=request.body
    )

    return JsonResponse(response.json())
```

## Cloudflare Tunnel 設定

保持 Cloudflare Tunnel 運行在 GPU 電腦：

```bash
# GPU 電腦上運行
cloudflared tunnel --url http://localhost:9001
```

這會創建一個安全隧道，讓 Railway 上的前端可以訪問本地後端。

## 優勢

1. **前端在雲端**：全球訪問，高可用性
2. **後端在本地**：充分利用 GPU 資源
3. **安全連接**：Cloudflare Tunnel 加密
4. **易於維護**：前後端分離
5. **可擴展**：可以輕鬆添加更多功能

## 下一步行動

1. 確認要使用哪個方案
2. 準備前端檔案
3. 創建新的 GitHub repository
4. 部署到 Railway
5. 測試前後端連接