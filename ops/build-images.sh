#!/bin/bash

set -e

MANAGER_NAME="swarm-manager"

echo "--- Building Docker images inside the Swarm manager ---"

echo "Building backend image..."
docker exec $MANAGER_NAME docker build -t tzuennn/name-list-backend:latest /app/backend

echo "Building frontend image..."
docker exec $MANAGER_NAME docker build -t tzuennn/name-list-frontend:latest /app/frontend

echo -e "\n✅ Images built successfully!"
echo "--- Listing images in manager: ---"
docker exec $MANAGER_NAME docker images | grep name-list
