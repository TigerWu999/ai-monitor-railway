#!/bin/sh
set -e

echo "Starting AI Monitor container..."
echo "Using Cloudflare Tunnel - no Tailscale needed!"

# Start the Next.js application
echo "Starting Next.js application on port $PORT..."
exec node server.js