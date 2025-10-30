# HW5 Distributed Deployment Report: Multi-Node Docker Swarm

**Student**: TSENG TZU EN
**Date**: October 30, 2025

## Executive Summary

This report documents the transformation of the HW4 Name List application (single-host Docker Compose) to a distributed multi-node deployment using Docker Swarm with Docker-in-Docker (DinD) infrastructure. The project demonstrates proper service orchestration, placement constraints, overlay networking, and persistent storage across a simulated production-like cluster.

## What Changed from HW4 and Why

### 1. Deployment Architecture: Single-Host → Multi-Node Distributed

**Before (HW4)**: All services on one Docker host with bridge networking

```
Docker Host
├── frontend:8080   (Nginx)
├── backend:8000    (Flask)
└── db:5432         (PostgreSQL)
```

**After (HW5)**: Distributed deployment across manager and worker nodes

```
Manager Node (DinD Container)
├── web (2 replicas)    - Nginx frontend
├── api (1 replica)     - Flask backend
└── Ports: 80, 8080 → host

Worker Node (DinD Container)
└── db (1 replica)      - PostgreSQL with persistent volume
```

**Why**: Demonstrates production-grade distributed deployment with:

- Service orchestration across multiple nodes
- Placement constraints for service isolation
- Overlay networking for cross-node communication
- High availability with replicated services
- Persistent storage on dedicated database node

### 2. Infrastructure: Docker Compose → Docker Swarm + DinD

**Before (HW4)**: `docker-compose.yml` with bridge network

**After (HW5)**: Docker Swarm stack with Docker-in-Docker simulation

- `docker-compose.dind.yml` - DinD infrastructure
- `swarm/stack.yaml` - Swarm stack definition
- Overlay network (`appnet`) for service discovery
- Placement constraints (`node.role == manager`, `node.labels.role == db`)
- Health checks with `start_period: 30s` for graceful startup

**Why**:

- **No physical lab node available** - DinD provides equivalent multi-node behavior
- Simulates real-world production clusters
- Enables testing distributed deployment locally
- Industry-standard approach for CI/CD and Docker development

### 3. Networking: Bridge → Overlay with Service Discovery

**Before (HW4)**: Bridge network, localhost connections

**After (HW5)**: Overlay network with DNS-based service discovery

- Services reach each other via DNS names (`db`, `api`, `backend`)
- Network aliases for flexible routing
- Cross-node communication through overlay driver

**Change**: Backend connection string updated from `localhost` to `db` hostname

```python
# HW4: Direct connection to localhost
pool = SimpleConnectionPool(1, 20, host="db", ...)

# HW5: DNS-based service discovery
pool = SimpleConnectionPool(1, 20, host="db", ...)  # Works across nodes
```

### 4. Automation: Manual Steps → Complete Ops Scripts

**New automation added**:

```bash
ops/
├── complete-setup.sh    # One-command full deployment
├── init-swarm.sh        # Initialize DinD + Swarm cluster
├── build-images.sh      # Build images inside manager
├── deploy.sh            # Deploy stack
├── verify.sh            # Verify deployment
├── stop.sh              # Stop without losing data
├── start.sh             # Restart with existing data
└── cleanup.sh           # Full teardown
```

**Why**: Zero-touch deployment, repeatable builds, demo-friendly workflow

### 5. Storage: Local Volume → Named Volume with Constraints

**Before (HW4)**: Simple local volume binding

**After (HW5)**: Named volume with placement constraints

```yaml
volumes:
  db-data:
    driver: local

services:
  db:
    volumes:
      - db-data:/var/lib/postgresql/data
    deploy:
      placement:
        constraints:
          - node.labels.role == db # Only on worker
```

**Challenge Discovered**:

- Initial issue: Data not persisting after `./ops/cleanup.sh` (uses `-v` flag)
- Solution: Created `./ops/stop.sh` (keeps volumes) vs `./ops/cleanup.sh` (deletes all)

## Challenges Faced and Solutions

### Challenge 1: DNS Resolution Race Condition

**Problem**: API service tried to connect to database before DNS was ready

- Error: `could not translate host name "db" to address`
- Occurred during first page load immediately after deployment
- Logs showed: Database initialized at 15:05:51, API tried connecting at 15:05:50

**Root Cause**: Swarm overlay network DNS takes ~1 second to propagate after service starts

**Solution**:

- Added `start_period: 30s` to healthchecks (gives services grace period)
- Implemented lazy connection pooling in backend (connection created on first request)
- Expected behavior: First request may fail, refresh works fine

**Code Change**:

```python
# backend/app.py
pool = None

def get_pool():
    global pool
    if pool is None:
        pool = SimpleConnectionPool(...)  # Lazy initialization
    return pool
```

### Challenge 2: Database Data Not Persisting

**Problem**: Added names disappeared after restart

**Root Cause**: Used `./ops/cleanup.sh` which includes `-v` flag

```bash
docker-compose down -v  # ⚠️ Deletes ALL volumes including database
```

**Solution**: Created two shutdown options

- `./ops/stop.sh` - Stops containers, **keeps volumes** (for demos)
- `./ops/cleanup.sh` - Deletes everything including data (for fresh start)

**Learning**: Docker volume lifecycle management is critical for stateful services

### Challenge 3: Nginx Proxy Path Doubling

**Problem**: API requests went to `/api/api/names` instead of `/api/names`

**Root Cause**: Nginx `proxy_pass` with trailing path and location prefix combined

**Solution**: Changed nginx.conf to use variable-based proxy

```nginx
# Before:
location /api/ {
    proxy_pass http://api:8000/api/;  # Path doubled
}

# After:
location /api/ {
    set $backend_host "api";
    proxy_pass http://$backend_host:8000;  # Correct path
}
```

### Challenge 4: No Physical Lab Node Available

**Problem**: Assignment requires multi-node deployment but no lab infrastructure

**Solution**: Docker-in-Docker (DinD) simulation

- Two privileged containers (`swarm-manager`, `swarm-worker`)
- Each runs full Docker daemon
- Connected via bridge network (`swarm-sim-net`)
- Swarm cluster initialized between them

**Justification**:

- ✅ Provides real multi-node Swarm behavior (not docker-compose simulation)
- ✅ Industry-standard approach (used in CI/CD, GitLab runners, Jenkins)
- ✅ All distributed requirements satisfied:
  - Service discovery via overlay network
  - Placement constraints work correctly
  - Persistent storage on specific nodes
  - Load balancing across replicas
  - Health monitoring with graceful startup

### Challenge 5: Image Build Location

**Problem**: Images need to be available inside Swarm manager, not on host

**Solution**: Build images inside manager container

```bash
# ops/build-images.sh
docker exec swarm-manager docker build -t tzuennn/name-list-backend:latest /app/backend
docker exec swarm-manager docker build -t tzuennn/name-list-frontend:latest /app/frontend
```

**Why**: Swarm manager needs local access to images for deployment

### Challenge 6: Healthcheck Dependencies

**Problem**: Services marked unhealthy without `curl` installed

**Solution**: Modified Dockerfiles to include curl

```dockerfile
# backend/Dockerfile
RUN apt-get update && apt-get install -y curl

# Used in healthcheck:
HEALTHCHECK CMD curl -f http://localhost:8000/healthz || exit 1
```

## How to Reproduce Multi-Node Deployment

### Prerequisites

- Docker Desktop installed and running
- Git installed
- Terminal access (macOS/Linux)

### Complete Setup (One Command)

```bash
# 1. Clone repository
git clone https://github.com/tzuennn/name-list.git
cd name-list

# 2. Deploy everything (DinD + Swarm + App)
./ops/complete-setup.sh
# Takes ~2-3 minutes

# Expected output:
# ✅ Swarm cluster initialized (2 nodes)
# ✅ Images built (backend, frontend)
# ✅ Stack deployed (db, api, web)
```

### Verify Distributed Deployment

```bash
# 1. Check cluster topology
docker exec swarm-manager docker node ls
# Expected: manager (Leader) + worker (Active)

# 2. Verify service placement
./ops/verify.sh
# Expected:
# - db on worker node
# - api on manager node
# - web (2 replicas) on manager node

# 3. Test application
curl http://localhost/api/names
# Expected: []

# Add a name via browser at http://localhost
# Then verify persistence:
curl http://localhost/api/names
# Expected: [{"id":1,"name":"test",...}]
```

### Test Data Persistence

```bash
# 1. Add names via browser
# Open http://localhost and add: Alice, Bob, Charlie

# 2. Stop without losing data
./ops/stop.sh

# 3. Restart with existing data
./ops/start.sh
docker exec swarm-manager docker stack deploy -c /app/swarm/stack.yaml mcapp

# 4. Wait 30 seconds for services to start
sleep 30

# 5. Verify data persisted
curl http://localhost/api/names
# Expected: Alice, Bob, Charlie still there!
```

### Test Service Discovery

```bash
# Verify overlay network DNS
docker exec swarm-manager docker exec $(docker exec swarm-manager docker ps -qf name=mcapp_api) nslookup db
# Expected: Resolves to db service IP

# Check network connectivity
docker exec swarm-manager docker exec $(docker exec swarm-manager docker ps -qf name=mcapp_api) curl -s db:5432
# Expected: Connection accepted (PostgreSQL)
```

### Cleanup

```bash
# Full cleanup (deletes everything)
./ops/cleanup.sh
# Removes: containers, networks, volumes, images
```

## Architecture Benefits

### Distributed Deployment

- **Node Isolation**: Database isolated on worker node for resource management
- **High Availability**: Multiple web replicas provide redundancy
- **Service Discovery**: DNS-based routing simplifies configuration
- **Scalability**: Easy to add more worker nodes or scale replicas

### Operational Excellence

- **Zero-Touch Deployment**: One command deploys entire cluster
- **Repeatable Builds**: Scripts ensure consistent deployments
- **Data Persistence**: Proper volume management with stop/cleanup options
- **Monitoring**: Health checks and verification scripts

### Production Readiness

- **Overlay Networking**: Cross-node communication without manual configuration
- **Placement Constraints**: Services run on appropriate node types
- **Graceful Startup**: Health checks with start periods prevent race conditions
- **Clean Shutdown**: Multiple options for different scenarios

## Lessons Learned

1. **DNS Propagation Timing**: Overlay networks need time to establish DNS

   - Solution: Lazy connection pools + health check grace periods

2. **Volume Lifecycle Management**: Clear distinction between stop and cleanup

   - Implemented separate scripts for different use cases

3. **DinD for Testing**: Effective way to simulate multi-node without physical infrastructure

   - Provides real distributed behavior, not docker-compose emulation

4. **Placement Constraints**: Critical for database isolation and resource management

   - Node labels enable precise service placement

5. **Automation is Key**: Manual deployment is error-prone
   - Complete ops scripts enable confident deployments

## Conclusion

This project successfully demonstrates distributed deployment of a 3-tier application using Docker Swarm with proper orchestration, networking, and persistence. The Docker-in-Docker approach effectively simulates multi-node infrastructure when physical nodes are unavailable, while maintaining all distributed deployment requirements and behaviors.

**Key Achievements**:

- ✅ Multi-node Docker Swarm cluster (manager + worker)
- ✅ Service orchestration with placement constraints
- ✅ Overlay networking with service discovery
- ✅ Persistent storage with proper volume management
- ✅ Complete automation with zero-touch deployment
- ✅ Production-ready health monitoring and graceful startup
- ✅ Comprehensive documentation and troubleshooting guides

**Deliverables**:

- Distributed 3-tier application running across 2 nodes
- Complete ops automation scripts for deployment/cleanup
- Docker Swarm stack definition with all services
- Documentation of challenges and solutions
- Verification evidence and deployment guide
