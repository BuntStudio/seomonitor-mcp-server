#!/bin/bash

# SEOMonitor MCP Server Production Deployment Script
# Deploy to root@assistant.seomonitor.com at /srv/mcp-server

set -e

# Configuration
REMOTE_HOST="root@assistant.seomonitor.com"
REMOTE_PATH="/srv/mcp-server"
SERVICE_NAME="seomonitor-mcp"

echo "🚀 Starting SEOMonitor MCP Server deployment..."

# Check if we can connect to the server
echo "📡 Testing connection to $REMOTE_HOST..."
if ! ssh -o ConnectTimeout=10 $REMOTE_HOST 'echo "Connection successful"' 2>/dev/null; then
    echo "❌ Cannot connect to $REMOTE_HOST. Please check SSH access."
    exit 1
fi

echo "✅ Connection to server established"

# Create remote directory structure
echo "📁 Setting up remote directory structure..."
ssh $REMOTE_HOST "mkdir -p $REMOTE_PATH && mkdir -p $REMOTE_PATH/logs"

# Copy project files to server
echo "📦 Copying project files..."
rsync -avz --exclude 'node_modules' \
           --exclude 'dist' \
           --exclude '.git' \
           --exclude 'logs' \
           --exclude '*.log' \
           ./ $REMOTE_HOST:$REMOTE_PATH/

echo "✅ Files copied successfully"

# Build and deploy on server
echo "🔧 Building and deploying on server..."
ssh $REMOTE_HOST << 'EOF'
cd /srv/mcp-server

# Stop existing service if running
echo "🛑 Stopping existing service..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build new image
echo "🔨 Building Docker image..."
docker compose -f docker-compose.prod.yml build

# Start the service
echo "▶️ Starting SEOMonitor MCP service..."
docker compose -f docker-compose.prod.yml up -d

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 10

# Check if service is healthy
if docker compose -f docker-compose.prod.yml ps | grep -q "healthy\|Up"; then
    echo "✅ Service is running!"
else
    echo "⚠️ Service may still be starting..."
fi

# Show service status
echo "📊 Service status:"
docker compose -f docker-compose.prod.yml ps

# Show recent logs
echo "📝 Recent logs:"
docker compose -f docker-compose.prod.yml logs --tail=20
EOF

echo "🎉 Deployment completed!"
echo "🌐 MCP Server should be available at: https://mcp.seomonitor.com/api/mcp"
echo ""
echo "🔍 To check status: ssh $REMOTE_HOST 'cd $REMOTE_PATH && docker compose -f docker-compose.prod.yml ps'"
echo "📝 To view logs: ssh $REMOTE_HOST 'cd $REMOTE_PATH && docker compose -f docker-compose.prod.yml logs -f'"
echo "🔄 To restart: ssh $REMOTE_HOST 'cd $REMOTE_PATH && docker compose -f docker-compose.prod.yml restart'"