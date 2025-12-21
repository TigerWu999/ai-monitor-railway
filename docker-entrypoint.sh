#!/bin/bash
set -e

echo "Starting AI Monitor container with Tailscale..."

# Check if Tailscale auth key is provided
if [ -n "$TAILSCALE_AUTH_KEY" ]; then
    echo "Configuring Tailscale..."

    # Start tailscaled in the background
    tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &

    # Wait for tailscaled to start
    sleep 5

    # Connect to Tailscale network
    tailscale up --authkey="$TAILSCALE_AUTH_KEY" --accept-routes --hostname="railway-ai-monitor"

    # Wait for connection to establish
    sleep 5

    # Show Tailscale status
    tailscale status

    echo "Tailscale connected successfully"
else
    echo "TAILSCALE_AUTH_KEY not provided, skipping Tailscale setup"
fi

# Start the Next.js application
echo "Starting Next.js application on port $PORT..."
exec node server.js