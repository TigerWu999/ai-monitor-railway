# 資料庫遷移執行狀況報告

## 📊 當前狀況

### ✅ 已完成的工作

1. **資料庫結構設計完成**
   - 多租戶授權系統架構 (`migrations/001_create_multi_tenant_structure.sql`)
   - 4 個核心表格：`tenants`, `cameras`, `camera_authorizations`, `user_tenants`
   - 包含測試數據：3 個租戶、3 個攝影機、4 個授權關係

2. **TypeScript 錯誤已修復**
   - `lib/xcms-service.ts` - getStreamUrl 返回類型錯誤已修復
   - `lib/db.ts` - QueryResultRow 約束錯誤已修復
   - Railway 部署成功，無編譯錯誤

3. **建立了多個遷移工具**
   - `scripts/migrate-database.js` - Node.js 遷移腳本
   - `scripts/migrate.ts` - TypeScript 遷移工具（推薦）
   - `migrations/run-migration.sh` - Bash 遷移腳本
   - `app/api/admin/migrate/route.ts` - HTTP API 端點

4. **完整的文檔**
   - `RAILWAY_DB_SETUP_GUIDE.md` - 資料庫設置指南
   - `SIMPLE_MIGRATION_GUIDE.md` - 簡化遷移指南
   - `MULTI_TENANT_SETUP.md` - 多租戶架構說明

### ❌ 遇到的問題

**核心問題：無法從本地環境連接到 Railway PostgreSQL 內部網路**

```
Error: getaddrinfo ENOTFOUND postgres.railway.internal
```

#### 為什麼會出現這個問題？

Railway PostgreSQL 使用兩種連接方式：

1. **內部連接** (postgres.railway.internal)
   - 只能從 Railway 容器內訪問
   - 速度快、安全
   - 環境變數：`DATABASE_URL`

2. **公共連接** (junction.proxy.rlwy.net)
   - 可從互聯網訪問
   - 需要正確的憑證
   - 環境變數：`DATABASE_PUBLIC_URL` (可能未設置)

#### 嘗試過的方法

| 方法 | 結果 | 原因 |
|------|------|------|
| `railway run psql $DATABASE_URL < sql` | ❌ 失敗 | `railway run` 在本地執行，無法解析內部域名 |
| `railway run node scripts/migrate.js` | ❌ 失敗 | 同上 |
| `railway run npx tsx scripts/migrate.ts` | ❌ 失敗 | 同上 |
| `curl https://www.qcair.us/api/admin/migrate` | ❌ 404 | 該域名指向不同的專案 (platform-system) |
| `curl https://web-app-production-125d.up.railway.app/api/admin/migrate` | ❌ 404 | 同上 |

---

## 🚀 解決方案

### 方案 1：使用 Railway Dashboard Query 介面（**您確認無此功能**）

~~在 Railway Dashboard 的 PostgreSQL 服務中直接執行 SQL~~

**用戶回饋：** "在 Query 介面執 railway 沒這功能"

### 方案 2：使用第三方資料庫管理工具 ✅ **推薦**

使用 PostgreSQL 客戶端連接到公共 URL：

#### 可用的工具：
- **DBeaver** (免費，跨平台) - https://dbeaver.io/
- **pgAdmin** (PostgreSQL 官方工具) - https://www.pgadmin.org/
- **TablePlus** (Mac/Windows，有免費版)
- **Postico** (Mac only)
- **在線工具：** https://sqliteonline.com/ (選擇 PostgreSQL)

#### 連接資訊：

需要從 Railway Dashboard 獲取**公共**連接字串：

1. 進入 Railway Project "sparkling-inspiration"
2. 選擇 PostgreSQL 服務
3. 進入 "Connect" 標籤
4. 複製 "External Database URL" 或 "Public Network URL"

格式類似：
```
postgresql://postgres:[password]@junction.proxy.rlwy.net:[port]/railway
```

#### 執行步驟：

1. 打開您選擇的 PostgreSQL 客戶端
2. 創建新連接，輸入上述連接資訊
3. 連接成功後，打開 SQL 編輯器
4. 複製 `migrations/001_create_multi_tenant_structure.sql` 的完整內容
5. 貼上並執行
6. 確認看到成功訊息

### 方案 3：使用 Railway CLI + 公共 URL ⚠️ **需要正確憑證**

如果能獲取公共 DATABASE_URL：

```bash
# 設置公共 URL
export DATABASE_PUBLIC_URL="postgresql://postgres:[password]@junction.proxy.rlwy.net:[port]/railway"

# 執行遷移
psql "$DATABASE_PUBLIC_URL" < migrations/001_create_multi_tenant_structure.sql
```

**問題：** 目前無法確認公共 URL 憑證是否正確

### 方案 4：修改代碼，從 Railway 容器內執行 🔧 **技術方案**

在 Railway 容器內創建一個臨時的 API 端點或命令：

**問題：** 目前推送的代碼未部署到正確的 Railway 服務

#### 需要確認：
- `ai-monitor-railway` GitHub repo 是否連接到 Railway？
- 哪個 Railway 服務應該接收部署？
- `www.qcair.us` 指向的是 `platform-system`，不是 `ai-monitor-railway`

---

## 📝 建議的下一步

### 最簡單的方法：使用 DBeaver 或 pgAdmin

1. **下載並安裝 DBeaver**
   ```bash
   # Ubuntu/Debian
   sudo snap install dbeaver-ce

   # macOS
   brew install --cask dbeaver-community

   # Windows: 從 https://dbeaver.io/ 下載安裝包
   ```

2. **從 Railway 獲取公共連接字串**
   - Railway Dashboard → PostgreSQL → Connect Tab
   - 複製 "External" 或 "Public" URL

3. **在 DBeaver 中連接**
   - 新建連接 → PostgreSQL
   - 輸入主機、端口、資料庫、用戶名、密碼
   - 測試連接

4. **執行 SQL**
   - 打開 SQL 編輯器
   - 貼上 `migrations/001_create_multi_tenant_structure.sql`
   - 按 Ctrl+Enter 執行

5. **驗證**
   執行以下查詢確認：
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN ('tenants', 'cameras', 'camera_authorizations', 'user_tenants');
   ```

---

## 🔍 故障排除

### 如果公共 URL 連接失敗

1. **檢查 Railway 防火牆設置**
   - PostgreSQL 服務可能未啟用公共訪問
   - 在 Railway Dashboard 確認 "Public Networking" 已啟用

2. **檢查 IP 白名單**
   - 某些 Railway 設定可能限制 IP
   - 確認您的 IP 未被封鎖

3. **確認憑證正確**
   - 密碼是否包含特殊字符需要 URL 編碼
   - 端口號是否正確

### 如果還是無法執行

**臨時方案：** 我可以創建一個簡單的 Web UI 管理介面：

- 在 `/admin/database/migrate` 創建一個受保護的頁面
- 點擊按鈕即可執行遷移
- 這需要確認代碼已正確部署到 Railway

---

## 📂 相關檔案

- `migrations/001_create_multi_tenant_structure.sql` - 遷移 SQL（即將執行）
- `scripts/migrate.ts` - TypeScript 遷移工具
- `scripts/migrate-database.js` - Node.js 遷移工具
- `app/api/admin/migrate/route.ts` - HTTP API 端點（未部署）
- `RAILWAY_DB_SETUP_GUIDE.md` - 詳細設置指南
- `SIMPLE_MIGRATION_GUIDE.md` - 簡化指南

---

## 💡 總結

**當前最佳方案：使用 DBeaver 或其他 PostgreSQL 客戶端**

原因：
1. ✅ 簡單直接，無需編程
2. ✅ 可視化操作，易於驗證
3. ✅ 不受 Railway CLI 限制
4. ✅ 可以同時執行和驗證

**替代方案：** 如果您提供 Railway PostgreSQL 的公共連接字串，我可以直接從本地執行遷移。

---

**需要我幫忙嗎？**

如果您：
- 想要我幫您安裝 DBeaver
- 需要取得 Railway 公共連接字串的指引
- 想要創建一個 Web UI 管理介面

請告訴我！
