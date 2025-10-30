#!/bin/bash

set -e

STACK_NAME="mcapp"
MANAGER_NAME="swarm-manager"

# Check if the manager container is running
if ! docker ps | grep -q $MANAGER_NAME; then
    echo "❌ Manager node container '$MANAGER_NAME' is not running."
    echo "Please run 'ops/init-swarm.sh' first to set up the cluster."
    exit 1
fi

echo "--- Deploying stack '$STACK_NAME' to the Swarm cluster ---"

# The stack file is at /app/swarm/stack.yaml inside the container
docker exec $MANAGER_NAME docker stack deploy -c /app/swarm/stack.yaml $STACK_NAME

echo -e "\nStack deployment initiated."
echo "It may take a few minutes for all services to be available."
echo "Use 'ops/verify.sh' to check the status."
