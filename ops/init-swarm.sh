#!/bin/bash

# This script sets up a complete Docker Swarm cluster locally
# using Docker-in-Docker (DinD) containers for the nodes.

set -e

COMPOSE_FILE="docker-compose.dind.yml"
MANAGER_NAME="swarm-manager"
WORKER_NAME="swarm-worker"
MANAGER_HOSTNAME="manager"
WORKER_HOSTNAME="worker"

echo "--- Starting Swarm nodes (manager and worker) using Docker-in-Docker ---"
# Clean up previous run first
docker-compose -f $COMPOSE_FILE down -v --remove-orphans
docker-compose -f $COMPOSE_FILE up -d

# Wait for Docker daemons to be ready inside the containers
echo "--- Waiting for nodes to be ready (this may take a moment)... ---"
sleep 10

echo "--- Initializing Swarm on the manager node ---"
# Get the manager's IP address within the Docker network
MANAGER_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $MANAGER_NAME)
echo "Manager IP: $MANAGER_IP"
docker exec $MANAGER_NAME docker swarm init --advertise-addr $MANAGER_IP

echo "--- Getting the worker join token ---"
JOIN_TOKEN=$(docker exec $MANAGER_NAME docker swarm join-token worker -q)

echo "--- Joining the worker node to the Swarm ---"
docker exec $WORKER_NAME docker swarm join --token $JOIN_TOKEN $MANAGER_IP:2377

echo "--- Labeling the worker node for database placement ---"
# Use the hostname 'worker' which is now predictable
docker exec $MANAGER_NAME docker node update --label-add role=db $WORKER_HOSTNAME

echo -e "\n✅ Swarm cluster is ready!"
echo "--- Cluster status: ---"
docker exec $MANAGER_NAME docker node ls