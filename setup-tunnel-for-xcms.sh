#!/bin/bash

echo "========================================="
echo "設定 Cloudflare Tunnel 連接 XCMS"
echo "========================================="
echo ""
echo "這個方案不需要 Tailscale，也不需要修改 Railway！"
echo ""
echo "步驟 1: 安裝 cloudflared"
echo "-----------------------------------------"
echo "sudo apt update"
echo "sudo apt install -y cloudflared"
echo ""
echo "步驟 2: 登入 Cloudflare（會開啟瀏覽器）"
echo "-----------------------------------------"
echo "cloudflared tunnel login"
echo ""
echo "步驟 3: 創建隧道"
echo "-----------------------------------------"
echo "cloudflared tunnel create xcms-monitor"
echo ""
echo "步驟 4: 創建配置"
echo "-----------------------------------------"
cat << 'CONFIG'
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << EOF
url: http://localhost:9001
tunnel: <您的隧道ID>
credentials-file: /home/tigerwu/.cloudflared/<隧道ID>.json
EOF
CONFIG
echo ""
echo "步驟 5: 安裝為服務（自動啟動）"
echo "-----------------------------------------"
echo "sudo cloudflared service install"
echo "sudo systemctl start cloudflared"
echo ""
echo "步驟 6: 獲取公開 URL"
echo "-----------------------------------------"
echo "cloudflared tunnel info xcms-monitor"
echo ""
echo "然後在 Railway 設定："
echo "AI_MONITOR_HOST=<您的隧道URL>"
echo "AI_MONITOR_PORT=443"