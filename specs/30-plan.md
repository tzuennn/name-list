# Implementation Plan: Distributed 3-Tier App with Docker Swarm (HW5)

**Branch**: `main2` | **Date**: 2025-10-28 | **Target**: Distributed Docker Swarm Deployment
**Input**: HW5 requirements for multi-node distributed 3-tier webapp

## Summary

Transform the enhanced single-host Name List application (HW4 baseline) into a distributed system using Docker Swarm orchestration. Deploy across two nodes: laptop (manager) running web/api services, and VirtualBox VM (worker) running database service only. Implement overlay networking, persistent storage, and production-like deployment automation.

## Technical Context

**Current State**: HW4 enhanced app with modular frontend, robust backend, comprehensive testing
**Target Architecture**: Docker Swarm with manager/worker node distribution
**Orchestration**: Docker Swarm with stack deployment (swarm/stack.yaml)
**Networking**: Overlay network for cross-node service communication
**Storage**: Persistent PostgreSQL data on worker node (/var/lib/postgres-data)
**Automation**: Complete ops scripts for deployment lifecycle management

## Constitution Compliance Check

**Code Quality**: Existing HW4 code meets standards (modular, tested, documented)
**Testing**: Maintain 98% backend, >90% frontend coverage during migration
**Performance**: Ensure distributed deployment doesn't degrade response times
**Accessibility**: Preserve WCAG 2.1 AA compliance in distributed environment

## Infrastructure Strategy

### Docker-in-Docker Architecture

```
HOST (macOS Docker Desktop)
├── swarm-manager container (docker:24-dind)
│   ├── Docker Swarm Manager Role
│   ├── Services: web (Nginx), api (Flask)
│   ├── Ports: 80:80, 8080:8080 published to host
│   ├── Networks: swarm-sim-net (bridge), appnet (overlay)
│   ├── Volume: manager-state, project mount at /app
│   └── Placement: node.role == manager
│
└── swarm-worker container (docker:24-dind)
    ├── Docker Swarm Worker Role
    ├── Services: db (PostgreSQL) ONLY
    ├── Networks: swarm-sim-net (bridge), appnet (overlay)
    ├── Volumes: worker-state, db-data
    └── Placement: node.labels.role == db
```

### DinD Setup via docker-compose.dind.yml

**Infrastructure Configuration**:

- Two privileged containers running docker:24-dind
- Bridge network `swarm-sim-net` for inter-container communication
- Manager exposes ports 80 and 8080 to host
- Project directory mounted at `/app` in manager
- Persistent volumes for Docker state and database data

**Storage Strategy**:

- Named volume: `db-data` for PostgreSQL persistence
- Volume managed by Docker within worker container
- Backup strategy: `docker cp` or volume backup commands

## Implementation Phases

### Phase 1: Infrastructure Preparation

**Docker-in-Docker Setup**:

1. Create `docker-compose.dind.yml` with manager and worker services
2. Configure privileged mode for both containers
3. Set up bridge network for inter-container communication
4. Configure port mappings (80, 8080 to host)
5. Mount project directory at `/app` in manager

**Infrastructure Startup**:

1. Run `docker-compose -f docker-compose.dind.yml up -d`
2. Wait for Docker daemons to start in both containers (~10s)
3. Verify both containers are running
4. Test Docker access inside containers

### Phase 2: Swarm Initialization

**Swarm Setup Script** (`ops/init-swarm.sh`):

1. Get manager container's IP address in bridge network
2. Execute `docker swarm init` inside manager container
3. Retrieve worker join token from manager
4. Execute `docker swarm join` inside worker container
5. Apply `role=db` label to worker node
6. Verify cluster topology with `docker node ls`

**Network Creation**:

- Overlay network `appnet` created via stack.yaml
- Service discovery via network aliases (api, backend, db)
- DNS resolver configured in nginx (127.0.0.11)

### Phase 3: Stack Definition

**swarm/stack.yaml Development**:

```yaml
# Actual implementation:
networks:
  appnet:
    driver: overlay
    attachable: true

volumes:
  db-data:
    driver: local

configs:
  db_init:
    file: /app/db/init.sql # Mounted from project dir

services:
  db:
    image: postgres:14-alpine
    placement: ["node.labels.role == db"]
    replicas: 1
    configs: [db_init]

  api:
    image: tzuennn/name-list-backend:latest
    placement: ["node.role == manager"]
    replicas: 1

  web:
    image: tzuennn/name-list-frontend:latest
    placement: ["node.role == manager"]
    replicas: 2
```

**Service Configuration**:

- Database: PostgreSQL 14-alpine with init.sql via Docker configs
- API: Flask backend with lazy connection pooling, curl installed
- Web: Nginx with variable-based upstream for runtime DNS resolution
- Health checks: pg_isready, curl /healthz with 30s start_period
- Network aliases: api, backend, db for service discovery

### Phase 4: Deployment Automation

**Operations Scripts**:

```bash
ops/init-swarm.sh       # DinD infrastructure + swarm cluster setup
ops/build-images.sh     # Build Docker images inside manager
ops/deploy.sh           # Deploy stack from swarm/stack.yaml
ops/verify.sh           # End-to-end deployment verification
ops/cleanup.sh          # Remove stack and DinD infrastructure
ops/complete-setup.sh   # One-command: init → build → deploy
```

**Build Process** (`ops/build-images.sh`):

- Builds frontend and backend images inside manager container
- Uses context from mounted `/app` directory
- Tags images as `tzuennn/name-list-backend:latest` and `tzuennn/name-list-frontend:latest`
- No registry push needed (built on manager, deployed on manager/worker)

**Verification Process**:

- Topology: `docker node ls` shows manager (Leader) + worker
- Placement: `docker service ps` confirms DB on worker, web/api on manager
- Connectivity: curl tests for `/`, `/api/names`, `/healthz`
- Persistence: Data survives `docker service update` operations
- Load balancing: Multiple web replicas handle requests

### Phase 5: Documentation & Evidence

**Evidence Collection**:

- Command outputs: node status, service placement, network info
- Screenshots: application running, admin commands
- Performance: response times in distributed setup
- Demo video: complete deployment and verification process

**Documentation Updates**:

- README: Add distributed deployment instructions
- TROUBLESHOOTING: Common VirtualBox and Swarm issues
- EVIDENCE.md: Complete verification package

## Risk Management

### Technical Risks (Resolved)

**DNS Resolution at Startup** ✅:

- Risk: API crashes with "could not translate host name 'db'"
- Solution: Lazy connection pooling - defer DB connection until first request
- Implementation: `get_pool()` function in backend/app.py

**Nginx Proxy Path Issues** ✅:

- Risk: Proxy doubling `/api/` prefix causing 404 errors
- Solution: Removed trailing `/api/` from proxy_pass directive
- Implementation: `proxy_pass http://$backend_upstream;`

**Healthcheck Failures** ✅:

- Risk: Services killed by failed healthchecks during startup
- Solution: Added `/healthz` endpoint, installed curl, 30s start_period
- Implementation: Lightweight health endpoint without DB dependency

### Operational Risks (Mitigated)

**DinD Container Startup Time** ✅:

- Risk: Services starting before Docker daemon ready
- Solution: 10-second sleep in init-swarm.sh
- Result: Reliable cluster initialization

**Image Build Context** ✅:

- Risk: Build failures due to missing context
- Solution: Project mounted at `/app` in manager container
- Result: Builds succeed with full project context

**Service Discovery Timing** ✅:

- Risk: Nginx fails with "host not found in upstream"
- Solution: Variable-based upstream for runtime DNS resolution
- Implementation: `set $backend_upstream "backend:8000";`

## Validation & Acceptance Criteria

### Functional Requirements

- [ ] Application accessible via `http://localhost/` on manager node
- [ ] All HW4 features functional in distributed deployment
- [ ] Database persistence across container lifecycle
- [ ] Service-to-service communication via overlay network

### Operational Requirements

- [ ] Swarm topology: 1 manager + 1 worker node
- [ ] Service placement: DB on worker, web/api on manager
- [ ] Health checks: All services report healthy status
- [ ] Load balancing: Demonstrated across web service replicas

### Documentation Requirements

- [ ] Complete ops automation (5 scripts minimum)
- [ ] Evidence package with command outputs and screenshots
- [ ] Demo video ≤5 minutes showing deployment
- [ ] Updated specs reflecting distributed architecture

## Timeline & Dependencies

**Prerequisites**: HW4 enhanced application completed and tested
**Phase 1-2**: VirtualBox and Swarm setup (2-3 hours)
**Phase 3-4**: Stack development and automation (3-4 hours)  
**Phase 5**: Documentation and evidence collection (1-2 hours)
**Total Effort**: 6-9 hours for complete implementation

## Success Metrics

- Swarm deployment completes without manual intervention
- Application performance comparable to single-host deployment
- Complete automation enables reproducible deployments
- Documentation sufficient for independent deployment by others

---
