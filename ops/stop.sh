#!/bin/bash

COMPOSE_FILE="docker-compose.dind.yml"

echo "--- Stopping the Swarm cluster (keeping data) ---"
docker-compose -f $COMPOSE_FILE down

echo -e "\n✅ Cluster stopped. Volumes preserved."
echo "💡 To restart: docker-compose -f $COMPOSE_FILE up -d"
echo "💡 To clean everything: ./ops/cleanup.sh"
