#!/bin/bash

set -e

STACK_NAME="mcapp"
MANAGER_NAME="swarm-manager"

# Check if the manager container is running
if ! docker ps | grep -q $MANAGER_NAME; then
    echo "❌ Manager node container '$MANAGER_NAME' is not running."
    echo "Please run 'ops/init-swarm.sh' first."
    exit 1
fi

echo "--- Verifying Swarm cluster state ---"
docker exec $MANAGER_NAME docker node ls

echo -e "\n--- Verifying stack '$STACK_NAME' services ---"
docker exec $MANAGER_NAME docker stack services $STACK_NAME

echo -e "\n--- Checking task placement for '$STACK_NAME' ---"
echo "--- DB (should be on worker) ---"
docker exec $MANAGER_NAME docker service ps ${STACK_NAME}_db
echo "--- API (should be on manager) ---"
docker exec $MANAGER_NAME docker service ps ${STACK_NAME}_api
echo "--- Web (should be on manager) ---"
docker exec $MANAGER_NAME docker service ps ${STACK_NAME}_web

echo -e "\n--- Performing health checks ---"
echo "--> Checking web frontend (http://localhost/)..."
curl -fsS http://localhost/ || echo "Error accessing web frontend."

echo "--> Checking API healthz (http://localhost:8080/healthz)..."
curl -fsS http://localhost:8080/healthz || echo "Error accessing API healthz."

echo -e "\n✅ Verification complete."
echo "You can access the application at http://localhost"
