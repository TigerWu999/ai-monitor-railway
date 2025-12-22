# Railway PostgreSQL 資料庫設置指南

## 📝 執行步驟

### 方式 1：在 Railway Dashboard 執行（推薦）

1. **登入 Railway**
   - 訪問 https://railway.app
   - 登入您的帳號

2. **選擇 PostgreSQL 服務**
   - 進入專案 "sparkling-inspiration"
   - 點選 **PostgreSQL** 服務

3. **開啟查詢介面**
   - 點選 "Data" 或 "Query" 標籤
   - 會看到 SQL 查詢輸入框

4. **複製並執行 SQL**
   - 打開本專案的檔案：`migrations/001_create_multi_tenant_structure.sql`
   - 全選複製整個檔案內容
   - 貼到 Railway 的查詢介面
   - 點選 "Run" 或 "Execute" 按鈕

5. **驗證結果**
   執行以下查詢確認表格已建立：
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('tenants', 'cameras', 'camera_authorizations', 'user_tenants')
   ORDER BY table_name;
   ```

   應該看到 4 個表格：
   - cameras
   - camera_authorizations
   - tenants
   - user_tenants

6. **查看測試數據**
   ```sql
   -- 查看租戶
   SELECT id, name, domain, status FROM tenants;

   -- 查看攝影機
   SELECT id, xcms_camera_id, name, location FROM cameras;

   -- 查看授權關係
   SELECT
     t.name AS tenant_name,
     c.name AS camera_name,
     ca.permissions
   FROM camera_authorizations ca
   JOIN tenants t ON ca.tenant_id = t.id
   JOIN cameras c ON ca.camera_id = c.id;
   ```

---

### 方式 2：使用 Railway CLI（進階）

如果您偏好使用命令行：

```bash
# 確保已安裝 Railway CLI
railway login

# 連接到專案
cd /home/tigerwu/railway-ai-monitor-test
railway link

# 執行遷移（需要本地有 psql 或使用 Railway shell）
railway run psql $DATABASE_URL < migrations/001_create_multi_tenant_structure.sql
```

---

## ✅ 預期結果

執行成功後，您會看到：

### 表格結構
1. **tenants** - 3 筆測試租戶
   - 總平台管理 (platform.qcair.us)
   - 工地A (sitea.qcair.us)
   - 工地B (siteb.qcair.us)

2. **cameras** - 3 個攝影機
   - 入口攝影機 (XCMS ID: 1)
   - 工地A區攝影機 (XCMS ID: 2)
   - 工地B區攝影機 (XCMS ID: 3)

3. **camera_authorizations** - 4 個授權關係
   - 工地A → 入口攝影機
   - 工地A → 工地A區攝影機
   - 工地B → 入口攝影機
   - 工地B → 工地B區攝影機

4. **user_tenants** - 用戶租戶關聯（空表，待後續使用）

### 視圖
- **vw_tenant_cameras** - 方便查詢租戶攝影機的視圖

---

## 🔧 測試查詢

執行這些查詢來驗證系統運作：

### 查詢工地A的所有攝影機
```sql
SELECT * FROM vw_tenant_cameras WHERE tenant_name = '工地A';
```

### 查詢某個攝影機被授權給哪些租戶
```sql
SELECT
  c.name AS camera_name,
  t.name AS tenant_name,
  ca.permissions,
  ca.expires_at
FROM cameras c
JOIN camera_authorizations ca ON c.id = ca.camera_id
JOIN tenants t ON ca.tenant_id = t.id
WHERE c.xcms_camera_id = 1;
```

### 檢查授權是否有效
```sql
SELECT
  tenant_name,
  camera_name,
  is_active
FROM vw_tenant_cameras
WHERE tenant_name = '工地A';
```

---

## 🚨 故障排除

### 問題：表格已存在
如果看到 "table already exists" 錯誤，這是正常的。SQL 使用了 `IF NOT EXISTS`，會自動跳過已存在的表格。

### 問題：需要重置資料庫
如果需要重新開始：
```sql
-- 刪除所有表格（小心使用！）
DROP TABLE IF EXISTS camera_authorizations CASCADE;
DROP TABLE IF EXISTS user_tenants CASCADE;
DROP TABLE IF EXISTS cameras CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP VIEW IF EXISTS vw_tenant_cameras;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

然後重新執行遷移 SQL。

### 問題：無法連接到 Railway
確保：
1. 已登入 Railway 帳號
2. 選擇了正確的專案 "sparkling-inspiration"
3. PostgreSQL 服務正在運行（綠色狀態）

---

## 📚 下一步

資料庫設置完成後，系統已準備好使用多租戶功能：

1. ✅ 資料庫結構已建立
2. ✅ 測試數據已插入
3. ⏳ 下一步：修改 API 使用資料庫數據
4. ⏳ 建立管理介面

---

## 📞 需要幫助？

如果遇到問題：
1. 檢查 Railway Dashboard 的 PostgreSQL 日誌
2. 確認環境變數 `DATABASE_URL` 已正確設置
3. 測試資料庫連接：在 Railway Query 介面執行 `SELECT version();`
