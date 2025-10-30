#!/bin/bash

# Complete setup script for Docker Swarm deployment
# This script automates the entire deployment process:
# 1. Initialize DinD infrastructure and Swarm cluster
# 2. Build Docker images
# 3. Deploy the stack

set -e

echo "🚀 Starting complete setup..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Step 1: Initialize Swarm infrastructure
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1/3: Initializing DinD infrastructure and Swarm cluster"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
"$SCRIPT_DIR/init-swarm.sh"
echo ""

# Step 2: Build images
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2/3: Building Docker images"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
"$SCRIPT_DIR/build-images.sh"
echo ""

# Step 3: Deploy stack
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3/3: Deploying the stack"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
"$SCRIPT_DIR/deploy.sh"
echo ""

# Final status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Complete setup finished!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend:     http://localhost"
echo "   API:          http://localhost:8080"
echo "   Health check: http://localhost/healthz"
echo ""
echo "📊 Quick status check:"
docker exec swarm-manager docker service ls
echo ""
echo "💡 Next steps:"
echo "   • Open http://localhost in your browser"
echo "   • Test the API: curl http://localhost/api/names"
echo "   • View logs: docker exec swarm-manager docker service logs mcapp_api"
echo "   • Cleanup: ./ops/cleanup.sh"
echo ""
