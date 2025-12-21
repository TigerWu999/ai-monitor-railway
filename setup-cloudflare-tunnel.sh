#!/bin/bash

# Cloudflare Tunnel 設定腳本
# 這會創建一個安全隧道，讓 Railway 可以訪問您的本地 XCMS

echo "==================================="
echo "Cloudflare Tunnel 設定"
echo "==================================="
echo ""
echo "這個方案完全免費，而且不需要 Tailscale！"
echo ""
echo "步驟 1: 安裝 cloudflared"
echo "-----------------------------------"
echo "在您的本地機器執行："
echo ""
echo "wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
echo "sudo dpkg -i cloudflared-linux-amd64.deb"
echo ""
echo "步驟 2: 登入 Cloudflare"
echo "-----------------------------------"
echo "cloudflared tunnel login"
echo ""
echo "步驟 3: 創建隧道"
echo "-----------------------------------"
echo "cloudflared tunnel create xcms-monitor"
echo ""
echo "步驟 4: 創建配置文件"
echo "-----------------------------------"
echo "創建 ~/.cloudflared/config.yml："
echo ""
cat << 'EOF'
url: http://localhost:9001
tunnel: <您的隧道ID>
credentials-file: /home/tigerwu/.cloudflared/<隧道ID>.json

ingress:
  - hostname: xcms-monitor.yourdomain.com
    service: http://localhost:9001
  - service: http_status:404
EOF
echo ""
echo "步驟 5: 運行隧道"
echo "-----------------------------------"
echo "cloudflared tunnel run xcms-monitor"
echo ""
echo "然後在 Railway 設定 AI_MONITOR_HOST 為您的隧道域名！"