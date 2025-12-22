#!/bin/bash

# 資料庫遷移執行腳本
# 此腳本應該在 Railway 容器內執行，可以訪問內部資料庫

echo "========================================="
echo "開始執行資料庫遷移..."
echo "========================================="

# 檢查環境變數
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 錯誤：DATABASE_URL 環境變數未設置"
    exit 1
fi

echo "✓ 資料庫連接字串已設置"

# 執行 SQL 遷移
echo ""
echo "執行 SQL 檔案: migrations/001_create_multi_tenant_structure.sql"
echo ""

# 使用 psql 執行 SQL
# 腳本路徑相對於專案根目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
psql "$DATABASE_URL" < "$SCRIPT_DIR/001_create_multi_tenant_structure.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ 遷移成功完成！"
    echo "========================================="

    # 驗證表格
    echo ""
    echo "驗證表格..."
    psql "$DATABASE_URL" -c "
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('tenants', 'cameras', 'camera_authorizations', 'user_tenants')
        ORDER BY table_name;
    "

    # 顯示數據統計
    echo ""
    echo "數據統計..."
    psql "$DATABASE_URL" -c "
        SELECT
            (SELECT COUNT(*) FROM tenants) AS tenants,
            (SELECT COUNT(*) FROM cameras) AS cameras,
            (SELECT COUNT(*) FROM camera_authorizations) AS authorizations;
    "

else
    echo ""
    echo "========================================="
    echo "❌ 遷移失敗"
    echo "========================================="
    exit 1
fi
