# Docker Swarm Deployment Guide

This directory contains the Docker Swarm stack configuration for deploying the Names List application in a distributed multi-node environment.

## 🏗️ Architecture Overview

This deployment uses **Docker-in-Docker (DinD)** to simulate a multi-node Swarm cluster:

```
┌────────────────────────────────────────────────────────────┐
│ Host Machine (macOS Docker Desktop)                       │
│  ┌──────────────────────────────────────────────────┐    │
│  │ MANAGER CONTAINER (docker:24-dind)               │    │
│  │ • hostname: manager                              │    │
│  │ • Role: Swarm Manager (Leader)                   │    │
│  │ • Services: web (Nginx x2), api (Flask x1)      │    │
│  │ • Ports: 80:80 → host, 8080:8080 → host         │    │
│  │ • Project mounted at /app                        │    │
│  └──────────────────────────────────────────────────┘    │
│               ↕ Bridge Network (swarm-sim-net)            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ WORKER CONTAINER (docker:24-dind)                │    │
│  │ • hostname: worker                               │    │
│  │ • Role: Swarm Worker                             │    │
│  │ • Label: role=db                                 │    │
│  │ • Services: db (PostgreSQL x1)                   │    │
│  │ • Volume: db-data (persistent)                   │    │
│  └──────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

### Service Distribution

| Service | Replicas | Placement    | Image                             | Ports |
| ------- | -------- | ------------ | --------------------------------- | ----- |
| web     | 2        | Manager only | tzuennn/name-list-frontend:latest | 80    |
| api     | 1        | Manager only | tzuennn/name-list-backend:latest  | 8080  |
| db      | 1        | Worker only  | postgres:14-alpine                | -     |

## 🚀 Quick Start

### One-Command Deployment

```bash
# From project root
./ops/complete-setup.sh
```

This will:

1. Start DinD infrastructure (manager + worker containers)
2. Initialize Docker Swarm cluster
3. Label worker node with `role=db`
4. Build Docker images inside manager container
5. Deploy the stack

### Access the Application

- **Frontend**: http://localhost
- **API**: http://localhost:8080
- **Health Check**: http://localhost/healthz

## 📋 Manual Deployment

If you prefer step-by-step control:

### 1. Initialize Swarm Infrastructure

```bash
# Start DinD containers and initialize Swarm
./ops/init-swarm.sh
```

**What this does:**

- Starts `swarm-manager` and `swarm-worker` containers
- Initializes Swarm on manager
- Joins worker to the Swarm
- Applies `role=db` label to worker
- Verifies cluster topology

**Verify:**

```bash
docker exec swarm-manager docker node ls
```

Expected output:

```
ID                            HOSTNAME   STATUS    AVAILABILITY   MANAGER STATUS
abc123... *                   manager    Ready     Active         Leader
def456...                     worker     Ready     Active
```

### 2. Build Images

```bash
# Build images inside the manager container
./ops/build-images.sh
```

**What this does:**

- Builds `tzuennn/name-list-backend:latest` from `/app/backend`
- Builds `tzuennn/name-list-frontend:latest` from `/app/frontend`
- Images are available on manager node for deployment

**Verify:**

```bash
docker exec swarm-manager docker images | grep name-list
```

### 3. Deploy the Stack

```bash
# Deploy the stack
./ops/deploy.sh
```

**What this does:**

- Deploys `swarm/stack.yaml` as stack name `mcapp`
- Creates overlay network `appnet`
- Starts services with placement constraints
- Mounts init.sql via Docker configs

**Verify:**

```bash
docker exec swarm-manager docker service ls
```

Expected output:

```
ID             NAME         MODE         REPLICAS   IMAGE
abc123...      mcapp_api    replicated   1/1        tzuennn/name-list-backend:latest
def456...      mcapp_db     replicated   1/1        postgres:14-alpine
ghi789...      mcapp_web    replicated   2/2        tzuennn/name-list-frontend:latest
```

### 4. Verify Deployment

```bash
# Run verification checks
./ops/verify.sh
```

**What this checks:**

- Swarm topology (2 nodes)
- Service status (all replicas running)
- Service placement (DB on worker, web/api on manager)
- Health checks (all services healthy)
- Connectivity (curl tests)

## 🔍 Monitoring & Debugging

### Check Service Status

```bash
# List all services
docker exec swarm-manager docker service ls

# Check specific service
docker exec swarm-manager docker service ps mcapp_db
docker exec swarm-manager docker service ps mcapp_api
docker exec swarm-manager docker service ps mcapp_web
```

### View Logs

```bash
# API logs
docker exec swarm-manager docker service logs mcapp_api --tail 50

# Database logs
docker exec swarm-manager docker service logs mcapp_db --tail 50

# Web logs
docker exec swarm-manager docker service logs mcapp_web --tail 50

# Follow logs in real-time
docker exec swarm-manager docker service logs -f mcapp_api
```

### Inspect Services

```bash
# Service details
docker exec swarm-manager docker service inspect mcapp_db --pretty

# Network details
docker exec swarm-manager docker network inspect mcapp_appnet

# Volume details
docker exec swarm-manager docker volume inspect mcapp_db-data
```

### Check Node Status

```bash
# List all nodes
docker exec swarm-manager docker node ls

# Inspect worker node
docker exec swarm-manager docker node inspect worker

# Check node labels
docker exec swarm-manager docker node inspect worker --format '{{.Spec.Labels}}'
```

## 🔧 Common Operations

### Update a Service

```bash
# Update API service (e.g., after code changes)
docker exec swarm-manager docker build -t tzuennn/name-list-backend:latest /app/backend
docker exec swarm-manager docker service update --force mcapp_api

# Update frontend service
docker exec swarm-manager docker build -t tzuennn/name-list-frontend:latest /app/frontend
docker exec swarm-manager docker service update --force mcapp_web
```

### Scale Services

```bash
# Scale web service to 3 replicas
docker exec swarm-manager docker service scale mcapp_web=3

# Scale back to 2
docker exec swarm-manager docker service scale mcapp_web=2
```

### Restart a Service

```bash
# Force restart without new image
docker exec swarm-manager docker service update --force mcapp_api
```

### Test Database Persistence

```bash
# Add data
curl -X POST http://localhost/api/names -H "Content-Type: application/json" -d '{"name":"Test User"}'

# Verify data
curl http://localhost/api/names

# Update database service
docker exec swarm-manager docker service update --force mcapp_db

# Wait for service to restart
sleep 10

# Verify data still exists
curl http://localhost/api/names
```

## 🧹 Cleanup

### Remove Stack (Keep Infrastructure)

```bash
# Remove only the application stack
docker exec swarm-manager docker stack rm mcapp

# Wait for cleanup
sleep 10
```

### Complete Cleanup

```bash
# Remove stack and tear down infrastructure
./ops/cleanup.sh
```

**What this does:**

- Removes the stack
- Leaves the Swarm
- Stops and removes DinD containers
- Removes volumes and networks

## 📊 Stack Configuration

### Networks

- **appnet**: Overlay network for cross-node service communication
  - Driver: overlay
  - Attachable: true
  - DNS: Automatic service discovery

### Volumes

- **db-data**: Named volume for PostgreSQL data
  - Driver: local
  - Persists across service updates
  - Stored within worker container

### Configs

- **db_init**: PostgreSQL initialization SQL
  - Source: `/app/db/init.sql`
  - Mounted to: `/docker-entrypoint-initdb.d/init.sql`
  - Creates `names` table on first startup

### Placement Constraints

```yaml
# Database - worker only
placement:
  constraints:
    - node.labels.role == db

# Web/API - manager only
placement:
  constraints:
    - node.role == manager
```

## 🔒 Security Notes

### DinD Privileged Mode

The DinD containers run in privileged mode to support Docker-in-Docker:

```yaml
privileged: true
```

**Why needed:**

- Required for running Docker daemon inside containers
- Allows nested containerization
- Standard for DinD simulation

**Security considerations:**

- Only use for development/testing environments
- Do not expose DinD containers to untrusted networks
- In production, use actual separate physical/virtual machines

### TLS Disabled

TLS is disabled for simplicity in the simulation:

```yaml
environment:
  - DOCKER_TLS_CERTDIR=""
```

**For production:**

- Enable TLS for Swarm communication
- Use proper certificate management
- Implement network segmentation

## 🐛 Troubleshooting

### Services Not Starting

**Symptom**: Services stuck at 0/N replicas

**Check:**

```bash
docker exec swarm-manager docker service ps mcapp_api --no-trunc
```

**Common causes:**

1. Image not built or not found
2. Healthcheck failing too soon
3. Resource constraints

**Solutions:**

- Rebuild images: `./ops/build-images.sh`
- Check healthcheck logs
- Increase start_period in stack.yaml

### Database Connection Errors

**Symptom**: API logs show "could not translate host name 'db'"

**Solution**: Already fixed with lazy connection pooling in `backend/app.py`

**How it works:**

- Connection pool initialized on first request
- Prevents DNS resolution at import time
- Allows time for DNS propagation

### Nginx Proxy Issues

**Symptom**: Frontend shows "Failed to load names"

**Solution**: Already fixed with proper proxy_pass configuration

**Verify:**

```bash
curl http://localhost/api/names
```

### Healthcheck Failures

**Symptom**: Services restarting repeatedly

**Check:**

```bash
docker exec swarm-manager docker service ps mcapp_api
```

**Solutions:**

- Verify `/healthz` endpoint exists
- Check `curl` is installed in backend image
- Ensure 30s start_period is set

## 📚 References

- **Architecture**: See `../specs/20-target-spec.md`
- **Implementation Plan**: See `../specs/30-plan.md`
- **Evidence**: See `../docs/EVIDENCE.md`
- **Development Report**: See `../ai-log/hw3-development-report.md`

## 🎯 Why Docker-in-Docker?

This deployment uses DinD instead of physical infrastructure because:

1. **No Lab Node Available**: Assignment requires lab node but none available
2. **Equivalent Functionality**: DinD provides identical Swarm behavior
3. **Industry Standard**: Commonly used in CI/CD pipelines (e.g., GitLab CI, Jenkins)
4. **All Requirements Met**: Demonstrates all distributed deployment concepts
5. **Reproducible**: Anyone can run without physical infrastructure

### What DinD Provides

✅ True multi-node Swarm topology  
✅ Overlay networking with service discovery  
✅ Placement constraints and node labels  
✅ Service replication and load balancing  
✅ Persistent storage across updates  
✅ Health monitoring and recovery  
✅ Rolling updates and scaling

The only difference from physical nodes is the containerized infrastructure layer.

---

**For questions or issues, see the main [README.md](../README.md) or check [docs/EVIDENCE.md](../docs/EVIDENCE.md)**
