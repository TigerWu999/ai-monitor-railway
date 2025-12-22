# 簡單的資料庫遷移指南

由於 Railway PostgreSQL 的內部網路限制，最簡單的方法是**使用我們已經部署的 API**。

## 🚀 執行步驟（超簡單！）

### 方法 1：使用瀏覽器（最簡單）

1. **等待 Railway 部署完成**（約 3-5 分鐘）
   - 訪問 https://github.com/TigerWu999/ai-monitor-railway/actions
   - 確認最新的 commit 已部署成功

2. **在瀏覽器訪問遷移 API**

   打開瀏覽器，訪問以下任一URL：

   ```
   https://www.qcair.us/api/admin/migrate
   ```

   或

   ```
   https://ai-monitor-railway-production.up.railway.app/api/admin/migrate
   ```

3. **輸入授權密碼**

   瀏覽器會提示需要授權（401 Unauthorized），這是正常的。

   使用開發者工具或 Postman 添加 Header：
   ```
   Authorization: Bearer migration-secret-key
   ```

### 方法 2：使用 curl 命令（推薦）

等待 Railway 部署完成後，執行：

```bash
curl -X GET "https://www.qcair.us/api/admin/migrate" \
  -H "Authorization: Bearer migration-secret-key" \
  -H "Accept: application/json"
```

如果成功，會返回：
```json
{
  "success": true,
  "message": "資料庫遷移成功",
  "stats": {
    "tenants": 3,
    "cameras": 3,
    "authorizations": 4
  }
}
```

### 方法 3：暫時禁用授權檢查（最快）

如果上面都不行，我可以暫時移除 API 的授權檢查，讓您可以直接訪問。

---

## ✅ 驗證遷移成功

遷移完成後，檢查 Railway Dashboard：

1. 進入 PostgreSQL 服務
2. 點選 "Data" 標籤
3. 應該能看到以下表格：
   - tenants
   - cameras
   - camera_authorizations
   - user_tenants

---

## 🔧 故障排除

### 問題：API 返回 404

**原因**：`/api/admin/migrate` 可能部署在不同的服務

**解決**：嘗試另一個 URL
```bash
curl https://ai-monitor-railway-production.up.railway.app/api/admin/migrate \
  -H "Authorization: Bearer migration-secret-key"
```

### 問題：無法添加 Authorization Header

**解決**：我可以暫時修改 API，移除授權要求。請告訴我！

---

## 💡 最簡單的方法

**如果您覺得太複雜，我現在可以：**

1. 修改 `/api/admin/migrate` 暫時移除授權檢查
2. 您只需要在瀏覽器訪問一個 URL
3. 遷移完成後我再把授權加回來

要這樣做嗎？
