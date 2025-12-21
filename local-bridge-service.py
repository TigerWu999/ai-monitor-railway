#!/usr/bin/env python3
"""
本地橋接服務 - 使用 ngrok 或 localtunnel 暴露 XCMS API
這個方案不需要 Tailscale，也不需要 Auth Key！
"""

import subprocess
import json
import time
import requests
from flask import Flask, jsonify, request
import threading

app = Flask(__name__)

# XCMS 配置
XCMS_HOST = "localhost"
XCMS_PORT = 9001

@app.route('/api/xcms/<path:path>', methods=['GET', 'POST'])
def proxy_xcms(path):
    """代理 XCMS 請求"""
    try:
        url = f"http://{XCMS_HOST}:{XCMS_PORT}/{path}"

        if request.method == 'POST':
            resp = requests.post(url, json=request.json, timeout=5)
        else:
            resp = requests.get(url, timeout=5)

        return resp.json() if resp.headers.get('content-type') == 'application/json' else resp.text
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health')
def health():
    """健康檢查"""
    return jsonify({"status": "healthy", "xcms": f"{XCMS_HOST}:{XCMS_PORT}"})

def start_ngrok():
    """啟動 ngrok 隧道"""
    print("正在啟動 ngrok 隧道...")
    # 安裝 ngrok: https://ngrok.com/download
    # 運行: ngrok http 5000
    subprocess.run(["ngrok", "http", "5000"])

def start_localtunnel():
    """啟動 localtunnel (免費替代方案)"""
    print("正在啟動 localtunnel...")
    # 安裝: npm install -g localtunnel
    # 運行: lt --port 5000 --subdomain xcms-monitor
    subprocess.run(["lt", "--port", "5000", "--subdomain", "xcms-monitor"])

if __name__ == '__main__':
    print("""
    ==========================================
    XCMS 橋接服務 - 免 Tailscale 方案
    ==========================================

    選擇暴露方式：
    1. ngrok (需要註冊，但更穩定)
    2. localtunnel (完全免費)
    3. 只在本地運行

    """)

    # 啟動 Flask 服務
    app.run(host='0.0.0.0', port=5000, debug=False)