#!/bin/bash
set -e

echo "=== Building Docker Images for K3s ==="

# Build backend image
echo "Building backend image..."
docker build -t tzuennn/name-list-backend:latest ./backend

# Build frontend image
echo "Building frontend image..."
docker build -t tzuennn/name-list-frontend:latest ./frontend

# Import images into k3d cluster
echo "Importing images into k3d cluster..."
k3d image import tzuennn/name-list-backend:latest -c namelist
k3d image import tzuennn/name-list-frontend:latest -c namelist

echo "✅ Images built and imported successfully"
echo ""
echo "Images available in k3d cluster:"
echo "  - tzuennn/name-list-backend:latest"
echo "  - tzuennn/name-list-frontend:latest"
