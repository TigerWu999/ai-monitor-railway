# 多租戶攝影機授權系統 - 設置指南

## 📋 系統概述

這個多租戶系統允許您在總平台管理所有 XCMS 攝影機，並按場域授權給不同的租戶（工地、辦公室等）。

## 🏗️ 架構

```
┌───────────────────────────────────────────┐
│   QCAir 總平台 (www.qcair.us)            │
│                                           │
│   所有 XCMS 攝影機集中管理                │
│   ├── 攝影機 1: 入口攝影機                │
│   ├── 攝影機 2: 工地A區                   │
│   └── 攝影機 3: 工地B區                   │
└───────────────────────────────────────────┘
           ↓ 按租戶授權
    ┌──────┴──────┬──────────┐
    ↓             ↓          ↓
┌─────────┐  ┌─────────┐  ┌─────────┐
│ 工地 A   │  │ 工地 B   │  │ 辦公室   │
│ 可看:    │  │ 可看:    │  │ 可看:    │
│ - 攝影機1 │  │ - 攝影機1 │  │ - 攝影機3 │
│ - 攝影機2 │  │ - 攝影機3 │  │          │
└─────────┘  └─────────┘  └─────────┘
```

## 📊 資料庫結構

### 1. `tenants` - 租戶表
儲存所有租戶（工地、辦公室等）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | SERIAL | 租戶ID |
| name | VARCHAR | 租戶名稱（例如：工地A） |
| domain | VARCHAR | 子網域（例如：sitea.qcair.us） |
| status | VARCHAR | 狀態：active/suspended/expired |
| subscription_expires_at | TIMESTAMP | 訂閱到期時間 |

### 2. `cameras` - 攝影機表
儲存所有 XCMS 攝影機的參照

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | SERIAL | 內部ID |
| xcms_camera_id | INTEGER | XCMS 系統中的攝影機ID |
| name | VARCHAR | 攝影機名稱 |
| location | VARCHAR | 位置 |
| status | VARCHAR | 狀態：online/offline/processing |

### 3. `camera_authorizations` - 授權表
管理哪些租戶可以訪問哪些攝影機

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | SERIAL | 授權ID |
| camera_id | INTEGER | 攝影機ID（關聯到cameras表） |
| tenant_id | INTEGER | 租戶ID（關聯到tenants表） |
| permissions | JSONB | 權限：["view", "control", "analytics"] |
| expires_at | TIMESTAMP | 授權到期時間（NULL=永久） |

### 4. `user_tenants` - 用戶租戶關聯表
管理使用者屬於哪些租戶

| 欄位 | 類型 | 說明 |
|------|------|------|
| user_id | INTEGER | 使用者ID |
| tenant_id | INTEGER | 租戶ID |
| role | VARCHAR | 角色：admin/operator/viewer |

## 🚀 安裝步驟

### 步驟 1: 部署到 Railway

程式碼已經推送到 GitHub，Railway 會自動部署。

### 步驟 2: 執行資料庫遷移

部署完成後，訪問以下 URL 來建立資料庫表格：

```bash
curl -X GET "https://www.qcair.us/api/admin/migrate" \
  -H "Authorization: Bearer migration-secret-key"
```

**注意**：為了安全，建議在 Railway 環境變數中設置 `ADMIN_SECRET`

### 步驟 3: 驗證遷移成功

遷移成功後，API 會返回：

```json
{
  "success": true,
  "message": "資料庫遷移成功",
  "stats": {
    "tenants": 3,
    "cameras": 3,
    "authorizations": 4
  },
  "logs": [...]
}
```

## 📝 測試數據

遷移腳本會自動插入以下測試數據：

### 租戶：
1. **總平台管理** (platform.qcair.us)
2. **工地A** (sitea.qcair.us)
3. **工地B** (siteb.qcair.us)

### 攝影機：
1. **入口攝影機** (XCMS ID: 1)
2. **工地A區攝影機** (XCMS ID: 2)
3. **工地B區攝影機** (XCMS ID: 3)

### 授權關係：
- 工地A 可以看到：攝影機 1, 2
- 工地B 可以看到：攝影機 1, 3

## 🔧 API 使用方式

### 查詢租戶的攝影機

```typescript
import { getCamerasByTenant } from '@/lib/db';

// 查詢租戶 ID 為 2 (工地A) 的所有攝影機
const cameras = await getCamerasByTenant(2);

// 返回：
// [
//   {
//     id: 1,
//     xcms_camera_id: 1,
//     name: "入口攝影機",
//     permissions: ["view", "analytics"],
//     ...
//   },
//   {
//     id: 2,
//     xcms_camera_id: 2,
//     name: "工地A區攝影機",
//     ...
//   }
// ]
```

### 檢查權限

```typescript
import { checkCameraAccess } from '@/lib/db';

// 檢查租戶 2 是否可以查看 XCMS 攝影機 1
const hasAccess = await checkCameraAccess(2, 1, 'view');
// 返回: true
```

### 創建新授權

```typescript
import { createAuthorization } from '@/lib/db';

// 授權租戶 3 訪問攝影機 2
await createAuthorization({
  cameraId: 2,
  tenantId: 3,
  permissions: ['view', 'analytics'],
  expiresAt: new Date('2025-12-31')
});
```

## 🔐 安全建議

1. **設置 ADMIN_SECRET**
   ```bash
   railway variables set ADMIN_SECRET=your-strong-random-secret
   ```

2. **遷移完成後禁用遷移 API**
   - 刪除 `/api/admin/migrate/route.ts` 檔案
   - 或在檔案中檢查環境變數 `ENABLE_MIGRATION`

3. **實作用戶認證**
   - 使用 JWT token 識別租戶
   - 在 API 中驗證用戶權限

## 📚 下一步

1. ✅ 資料庫遷移完成
2. ⏳ 修改 `/api/ai-monitor/cameras` 支援多租戶過濾
3. ⏳ 建立管理介面
4. ⏳ 實作權限中間件
5. ⏳ 整合到現有的 AI 攝影機側邊欄

## 🆘 故障排除

### 問題：遷移 API 返回 401 Unauthorized

**解決方案**：確保請求 header 包含正確的 Authorization

```bash
curl -H "Authorization: Bearer migration-secret-key" \
  https://www.qcair.us/api/admin/migrate
```

### 問題：遷移失敗，提示連接錯誤

**解決方案**：
1. 檢查 Railway 環境變數 `DATABASE_URL` 是否正確
2. 確保 PostgreSQL 服務正在運行
3. 檢查 Railway logs: `railway logs`

### 問題：表格已存在

**解決方案**：SQL 使用 `CREATE TABLE IF NOT EXISTS`，重複執行是安全的。如需重置：

```sql
DROP TABLE IF EXISTS camera_authorizations CASCADE;
DROP TABLE IF EXISTS user_tenants CASCADE;
DROP TABLE IF EXISTS cameras CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
```

然後重新執行遷移 API。

## 📞 支援

如有問題，請檢查：
- Railway 部署日誌
- PostgreSQL 連接狀態
- 環境變數配置
