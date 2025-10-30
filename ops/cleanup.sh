#!/bin/bash

COMPOSE_FILE="docker-compose.dind.yml"

echo "--- Tearing down the simulated Swarm cluster ---"
docker-compose -f $COMPOSE_FILE down -v --remove-orphans

echo -e "\n✅ Cleanup complete. All containers and volumes have been removed."
