#!/bin/bash

echo "================================================"
echo "AI Monitor 整合到主網站 (www.qcair.us)"
echo "================================================"
echo ""
echo "這個腳本會將 AI Monitor 的所有檔案整合到您的主專案"
echo ""

# 主專案路徑（您需要提供）
MAIN_PROJECT_PATH="$1"

if [ -z "$MAIN_PROJECT_PATH" ]; then
    echo "使用方法: ./integrate-to-main-project.sh /path/to/main/project"
    echo "範例: ./integrate-to-main-project.sh /home/tigerwu/qcair-website"
    exit 1
fi

echo "整合到: $MAIN_PROJECT_PATH"
echo ""

# 確認主專案存在
if [ ! -d "$MAIN_PROJECT_PATH" ]; then
    echo "❌ 錯誤: 主專案目錄不存在: $MAIN_PROJECT_PATH"
    exit 1
fi

# 1. 複製 AI Monitor API 路由
echo "📁 複製 API 路由..."
mkdir -p "$MAIN_PROJECT_PATH/app/api/ai-monitor"
cp app/api/ai-monitor/route.ts "$MAIN_PROJECT_PATH/app/api/ai-monitor/"
echo "   ✅ /api/ai-monitor 路由已複製"

# 2. 複製 AI Monitor 頁面
echo "📁 複製 AI Monitor 頁面..."
mkdir -p "$MAIN_PROJECT_PATH/app/ai-monitor"
cp app/ai-monitor/page.tsx "$MAIN_PROJECT_PATH/app/ai-monitor/"
echo "   ✅ /ai-monitor 頁面已複製"

# 3. 複製元件
echo "📁 複製 React 元件..."
mkdir -p "$MAIN_PROJECT_PATH/components"
cp components/AICameraGrid.tsx "$MAIN_PROJECT_PATH/components/"
echo "   ✅ AICameraGrid 元件已複製"

# 4. 複製樣式（如果有）
if [ -f "app/ai-monitor/styles.css" ]; then
    cp app/ai-monitor/styles.css "$MAIN_PROJECT_PATH/app/ai-monitor/"
    echo "   ✅ 樣式檔案已複製"
fi

# 5. 更新 package.json 依賴
echo ""
echo "📦 需要安裝的套件:"
echo "   - axios"
echo "   - lucide-react"
echo ""
echo "請在主專案執行:"
echo "   cd $MAIN_PROJECT_PATH"
echo "   npm install axios lucide-react"

# 6. 環境變數設定
echo ""
echo "🔧 需要在 Railway 設定的環境變數:"
echo "   AI_MONITOR_HOST=concerned-commit-superior-vpn.trycloudflare.com"
echo "   AI_MONITOR_PORT=443"
echo "   AI_MONITOR_USE_HTTPS=true"

echo ""
echo "✅ 整合準備完成！"
echo ""
echo "下一步驟:"
echo "1. cd $MAIN_PROJECT_PATH"
echo "2. npm install axios lucide-react"
echo "3. git add ."
echo "4. git commit -m 'Add AI Monitor integration'"
echo "5. git push"
echo ""
echo "訪問路徑:"
echo "- API: https://www.qcair.us/api/ai-monitor"
echo "- 頁面: https://www.qcair.us/ai-monitor"