# DBeaver 連接指南

## 📊 第一步：從 Railway 獲取資料庫連接資訊

### 方法 1：使用 Railway Dashboard (推薦)

1. **打開 Railway Dashboard**
   - 瀏覽器訪問：https://railway.app/
   - 登入您的帳號

2. **選擇專案**
   - 找到並點擊 `sparkling-inspiration` 專案

3. **進入 PostgreSQL 服務**
   - 在專案中找到 PostgreSQL 服務（圖標為 🐘）
   - 點擊進入

4. **獲取連接資訊**
   - 點擊上方的 **"Connect"** 或 **"Variables"** 標籤
   - 尋找以下任一選項：
     - `DATABASE_PUBLIC_URL` 或
     - `POSTGRES_URL` 或
     - `External Connection URL`

   連接字串格式類似：
   ```
   postgresql://postgres:[password]@junction.proxy.rlwy.net:[port]/railway
   ```

5. **複製完整連接字串**
   - 點擊複製按鈕
   - 保存到記事本備用

### 方法 2：從連接字串中提取資訊

如果您看到完整的連接字串，例如：
```
postgresql://postgres:QSnczlsEKQDnkYmWjmWiVwmMNIXWZeOo@junction.proxy.rlwy.net:54732/railway
```

提取以下資訊：
- **Host（主機）**: `junction.proxy.rlwy.net`
- **Port（端口）**: `54732`
- **Database（資料庫）**: `railway`
- **Username（用戶名）**: `postgres`
- **Password（密碼）**: `QSnczlsEKQDnkYmWjmWiVwmMNIXWZeOo`

⚠️ **注意：** 上述憑證可能已過期，請從 Railway Dashboard 獲取最新的！

---

## 🔧 第二步：在 DBeaver 中建立連接

### 啟動 DBeaver

```bash
dbeaver-ce &
```

或從應用程式選單中啟動 DBeaver

### 建立新連接

1. **打開新連接嚮導**
   - 點擊左上角的 **"New Database Connection"** 按鈕（插頭圖標）
   - 或使用快捷鍵：`Ctrl + Shift + N`

2. **選擇資料庫類型**
   - 在列表中找到並選擇 **PostgreSQL**
   - 點擊 **"Next"**

3. **輸入連接資訊**

   填入從 Railway 獲取的資訊：

   | 欄位 | 值 | 說明 |
   |------|-----|------|
   | **Host** | `junction.proxy.rlwy.net` | 從 Railway 獲取 |
   | **Port** | `54732` 或其他 | 從 Railway 獲取 |
   | **Database** | `railway` | 固定值 |
   | **Username** | `postgres` | 固定值 |
   | **Password** | `從 Railway 複製` | ⚠️ 重要！ |

4. **測試連接**
   - 點擊左下角的 **"Test Connection"** 按鈕
   - 如果出現 "驅動程式未安裝" 提示：
     - 點擊 **"Download"** 下載 PostgreSQL JDBC 驅動
     - 等待下載完成
     - 再次點擊 **"Test Connection"**

5. **驗證連接成功**
   - 應該看到 **"Connected"** 或綠色勾選標記
   - 如果失敗，請檢查：
     - Railway 連接資訊是否正確
     - 密碼是否包含特殊字符（可能需要重新複製）
     - 網路是否正常

6. **完成設置**
   - 點擊 **"Finish"** 完成連接建立
   - 左側資料庫導航欄會出現新連接

---

## 📝 第三步：執行資料庫遷移

### 打開 SQL 編輯器

1. **展開連接**
   - 在左側導航欄中，展開剛建立的 PostgreSQL 連接
   - 展開 `railway` 資料庫
   - 展開 `Schemas` → `public`

2. **打開 SQL 編輯器**
   - 右鍵點擊連接名稱
   - 選擇 **"SQL Editor"** → **"New SQL Script"**
   - 或使用快捷鍵：`Ctrl + ]`

### 載入遷移 SQL

1. **打開 SQL 檔案**
   - 在 SQL 編輯器中，點擊 **"File"** → **"Open File"**
   - 瀏覽到：
     ```
     /home/tigerwu/railway-ai-monitor-test/migrations/001_create_multi_tenant_structure.sql
     ```
   - 點擊 **"Open"**

   或者：

2. **複製貼上 SQL**
   - 使用文字編輯器打開 SQL 檔案
   - 複製全部內容
   - 貼上到 DBeaver SQL 編輯器中

### 執行遷移

1. **執行 SQL**
   - 確保整個 SQL 腳本都在編輯器中
   - 點擊工具欄的 **"Execute SQL Statement"** 按鈕（橙色播放圖標）
   - 或使用快捷鍵：`Ctrl + Enter`

2. **查看執行結果**
   - 底部的 **"Log"** 面板會顯示執行進度
   - 成功應該看到類似：
     ```
     CREATE TABLE
     CREATE INDEX
     CREATE TRIGGER
     INSERT 0 3
     ...
     ```

3. **確認完成**
   - 沒有紅色錯誤訊息 = 成功！
   - 如果有錯誤，檢查：
     - SQL 是否完整
     - 表格是否已存在（可以先刪除再重試）

---

## ✅ 第四步：驗證遷移成功

### 查看表格

1. **刷新資料庫結構**
   - 右鍵點擊左側的 `public` schema
   - 選擇 **"Refresh"**

2. **展開 Tables**
   - 應該看到以下 4 個表格：
     - ✓ `tenants`
     - ✓ `cameras`
     - ✓ `camera_authorizations`
     - ✓ `user_tenants`

### 查看資料

1. **新建 SQL 查詢**
   - 打開新的 SQL 編輯器
   - 複製貼上以下驗證查詢：

```sql
-- 1. 檢查表格是否存在
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('tenants', 'cameras', 'camera_authorizations', 'user_tenants')
ORDER BY table_name;

-- 2. 檢查資料統計
SELECT
    (SELECT COUNT(*) FROM tenants) AS tenants,
    (SELECT COUNT(*) FROM cameras) AS cameras,
    (SELECT COUNT(*) FROM camera_authorizations) AS authorizations,
    (SELECT COUNT(*) FROM user_tenants) AS user_tenants;

-- 3. 查看租戶列表
SELECT id, name, domain, status, created_at
FROM tenants
ORDER BY id;

-- 4. 查看攝影機列表
SELECT id, xcms_camera_id, name, location, status
FROM cameras
ORDER BY id;

-- 5. 查看授權關係
SELECT
    t.name AS tenant_name,
    c.name AS camera_name,
    c.location AS camera_location,
    ca.permissions,
    ca.authorized_at
FROM camera_authorizations ca
JOIN tenants t ON ca.tenant_id = t.id
JOIN cameras c ON ca.camera_id = c.id
ORDER BY t.id, c.id;
```

2. **執行驗證查詢**
   - 逐個執行上述查詢（選中一段 SQL，然後 `Ctrl + Enter`）
   - 或一次執行全部（`Ctrl + Shift + Enter`）

### 預期結果

**表格檢查：** 應該返回 4 行
```
tenants
cameras
camera_authorizations
user_tenants
```

**資料統計：**
```
tenants: 3
cameras: 3
authorizations: 4
user_tenants: 0
```

**租戶列表：**
```
1 | 總平台管理 | platform.example.com | active
2 | 工地A | site-a.example.com | active
3 | 工地B | site-b.example.com | active
```

**攝影機列表：**
```
1 | 1 | 大門入口攝影機 | 主建築大門 | online
2 | 2 | 停車場攝影機 | 地下停車場B1 | online
3 | 3 | 辦公區攝影機 | 3F辦公區走廊 | online
```

**授權關係：**
```
總平台管理 → 大門入口攝影機 [view, manage]
總平台管理 → 停車場攝影機 [view, manage]
總平台管理 → 辦公區攝影機 [view, manage]
工地A → 大門入口攝影機 [view]
```

---

## 🎉 完成！

如果看到上述預期結果，恭喜！資料庫遷移已成功完成。

### 下一步

資料庫已準備好，現在可以：

1. **測試 API 端點**
   ```bash
   curl https://www.qcair.us/api/ai-monitor/cameras
   ```

2. **在前端查看攝影機**
   - 訪問：https://www.qcair.us/platform/dashboard/main
   - 點擊左側 "AI 攝影機" 側邊欄

3. **開始開發授權管理功能**
   - 實作租戶切換
   - 實作攝影機授權介面

---

## 🔧 故障排除

### 問題 1: "驅動程式下載失敗"

**解決方案：**
```bash
# 手動下載 PostgreSQL JDBC 驅動
cd ~/.local/share/DBeaverData/drivers/postgresql
wget https://jdbc.postgresql.org/download/postgresql-42.7.1.jar
```

然後在 DBeaver 中：
- Database → Driver Manager → PostgreSQL
- 點擊 "Libraries" 標籤
- 點擊 "Add File"
- 選擇下載的 .jar 檔案

### 問題 2: "連接超時"

**可能原因：**
- Railway 防火牆設置
- Railway 公共網路未啟用

**解決方案：**
在 Railway Dashboard 中：
1. 進入 PostgreSQL 服務
2. 檢查 Settings → Networking
3. 確認 "Enable Public Networking" 已開啟

### 問題 3: "認證失敗"

**解決方案：**
- 重新從 Railway Dashboard 複製密碼
- 確認沒有多餘的空格
- 嘗試在 DBeaver 中顯示密碼（眼睛圖標）確認正確

### 問題 4: "表格已存在"

如果重複執行遷移：

```sql
-- 刪除現有表格（謹慎使用！）
DROP TABLE IF EXISTS camera_authorizations CASCADE;
DROP TABLE IF EXISTS user_tenants CASCADE;
DROP TABLE IF EXISTS cameras CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- 然後重新執行遷移 SQL
```

---

## 📞 需要幫助？

如果遇到問題：
1. 檢查 Railway Dashboard 中的連接資訊是否正確
2. 確認 Railway PostgreSQL 服務正在運行（綠色狀態）
3. 查看 DBeaver 的錯誤日誌（Window → Show View → Error Log）

**準備好開始了嗎？**

讓我知道您在哪一步，我可以提供更詳細的協助！
