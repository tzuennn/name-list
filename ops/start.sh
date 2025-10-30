#!/bin/bash

COMPOSE_FILE="docker-compose.dind.yml"

echo "--- Starting the Swarm cluster (reusing existing volumes) ---"
docker-compose -f $COMPOSE_FILE up -d

echo -e "\n✅ Cluster started."
echo "💡 Waiting for services to be ready..."
sleep 10

echo -e "\n📊 Current status:"
docker-compose -f $COMPOSE_FILE ps
