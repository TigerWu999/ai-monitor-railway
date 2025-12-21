#!/bin/bash
set -e

echo "Starting AI Monitor container with Tailscale OAuth..."

# Check if OAuth credentials are provided
if [ -n "$TAILSCALE_OAUTH_CLIENT_ID" ] && [ -n "$TAILSCALE_OAUTH_CLIENT_SECRET" ]; then
    echo "Configuring Tailscale with OAuth..."

    # Start tailscaled in the background
    tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &

    # Wait for tailscaled to start
    sleep 5

    # Connect using OAuth (never expires!)
    tailscale up \
        --auth-key="oauth_client_id=${TAILSCALE_OAUTH_CLIENT_ID}&oauth_client_secret=${TAILSCALE_OAUTH_CLIENT_SECRET}" \
        --accept-routes \
        --hostname="railway-ai-monitor"

    # Wait for connection to establish
    sleep 5

    # Show Tailscale status
    tailscale status

    echo "Tailscale connected successfully with OAuth"
elif [ -n "$TAILSCALE_AUTH_KEY" ]; then
    echo "Using Auth Key (legacy mode)..."

    tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &
    sleep 5
    tailscale up --authkey="$TAILSCALE_AUTH_KEY" --accept-routes --hostname="railway-ai-monitor"
    sleep 5
    tailscale status
else
    echo "No Tailscale credentials provided, skipping Tailscale setup"
fi

# Start the Next.js application
echo "Starting Next.js application on port $PORT..."
exec node server.js