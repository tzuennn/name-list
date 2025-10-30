# Target: Distributed 3-Tier App with Docker Swarm (HW5)

**Date**: 2025-10-28 | **Status**: PLANNED - Multi-Node Swarm Architecture

## 🎯 HW5 Goal: Multi-Node Distributed Deployment

Transform the enhanced single-host application (HW4) into a distributed system using Docker Swarm orchestration across two nodes, simulated via Docker-in-Docker (DinD).

## Target Architecture Overview

### Node Distribution Strategy (Docker-in-Docker Simulation)

```
┌─────────────────────────────────────────────────────────────┐
│ HOST (macOS Laptop - Docker Desktop)                       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ MANAGER CONTAINER (docker:24-dind)                    │ │
│  │ • Swarm Manager Role                                  │ │
│  │ • Services: web (Nginx), api (Flask)                 │ │
│  │ • Ingress: Port 80/8080 → host                        │ │
│  │ • Overlay Network: appnet                             │ │
│  │ • Hostname: manager                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│               ↕ (Bridge Network: swarm-sim-net)            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ WORKER CONTAINER (docker:24-dind)                     │ │
│  │ • Swarm Worker Role                                   │ │
│  │ • Services: db (PostgreSQL) ONLY                      │ │
│  │ • Storage: db-data volume (persistent)                │ │
│  │ • Node Label: role=db                                 │ │
│  │ • Hostname: worker                                    │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Distributed Architecture Requirements

### 1. Docker Swarm Orchestration

```yaml
# Target swarm/stack.yaml structure:
networks:
  appnet:
    driver: overlay
    attachable: true

volumes:
  dbdata:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /var/lib/postgres-data

services:
  web:
    deploy:
      replicas: 2
      placement:
        constraints: ["node.role == manager"]
    ports: ["80:80"]

  api:
    deploy:
      replicas: 2
      placement:
        constraints: ["node.role == manager"]

  db:
    deploy:
      replicas: 1
      placement:
        constraints: ["node.labels.role == db"]
```

### 2. Network Architecture

- **Overlay Network**: `appnet` for cross-node service communication
- **Service Discovery**: DNS-based (api → db, web → api)
- **Ingress Load Balancing**: Automatic across web replicas
- **Port Publishing**: Only port 80 exposed on manager node

### 3. Storage Strategy

- **Database Persistence**: Docker named volume `db-data` managed by Docker Swarm
- **Data Durability**: Survives container recreation and service updates
- **Volume Location**: Stored within worker DinD container's Docker storage
- **Backup Strategy**: Volume backup via `docker cp` or `docker run --rm` commands

### 4. Deployment Constraints

- **DB Placement**: MUST run only on worker node (VirtualBox VM)
- **Web/API Placement**: MUST run only on manager node (laptop)
- **Replica Strategy**: 2 replicas each for web/api, 1 for database
- **Resource Allocation**: Appropriate limits for VM constraints

## Enhanced Features for Production-Like Deployment

### 1. Health Monitoring

```yaml
# Enhanced health checks:
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U dbuser"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s

api:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/healthz"]
    interval: 30s
    timeout: 10s
    retries: 3

web:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:80/"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### 2. Service Discovery Validation

- **Cross-node communication**: API connects to DB via `postgresql://dbuser:dbpass@db:5432/namesdb`
- **DNS resolution**: Services resolve by name across overlay network
- **Connection resilience**: Retry logic for temporary network issues

### 3. Load Balancing Demonstration

- **Multiple web replicas**: Show round-robin distribution
- **Session consistency**: Stateless design supports load balancing
- **Health-based routing**: Unhealthy replicas automatically excluded

## Operational Requirements

### 1. Automation Scripts

```bash
ops/
├── init-swarm.sh      # Initialize DinD containers and swarm cluster
├── build-images.sh    # Build Docker images inside manager container
├── deploy.sh          # Deploy stack from manager
├── verify.sh          # End-to-end deployment verification
├── cleanup.sh         # Tear down stack and DinD infrastructure
└── complete-setup.sh  # One-command setup (calls init, build, deploy)
```

### 2. Evidence Documentation

```markdown
docs/EVIDENCE.md structure:
├── Swarm Topology (docker node ls)
├── Service Placement (docker service ps)
├── Network Connectivity Tests
├── Load Balancing Demonstration
├── Data Persistence Validation
├── Health Check Status
└── Performance Metrics
```

### 3. Deployment Verification

- **Topology Verification**: `docker node ls` shows manager + worker
- **Service Placement**: DB on worker, web/api on manager
- **Connectivity**: End-to-end application functionality
- **Persistence**: Data survives database service updates
- **Load Balancing**: Multiple requests show different container IDs

## Success Criteria

### Functional Requirements

- [ ] Application accessible via `http://manager-ip/` (port 80)
- [ ] All HW4 features work in distributed deployment
- [ ] Database persistence across container recreation
- [ ] Service-to-service communication via overlay network
- [ ] Health checks report service status correctly

### Operational Requirements

- [ ] Swarm initialized with 2+ nodes (manager + worker)
- [ ] Services deployed with correct placement constraints
- [ ] Load balancing demonstrated across web replicas
- [ ] Database backup/restore procedure documented
- [ ] Complete ops automation scripts functional

### Documentation Requirements

- [ ] Updated specs reflect distributed architecture
- [ ] Evidence package with command outputs and screenshots
- [ ] Demo video showing end-to-end deployment
- [ ] Troubleshooting guide for common deployment issues

## Risk Mitigation

### Technical Risks

- **Docker-in-Docker DNS**: Service name resolution timing issues
  - **Mitigation**: Lazy connection pooling in backend, network aliases
  - **Status**: ✅ Resolved with `get_pool()` function
- **Nginx Proxy Configuration**: Path doubling issues with proxy_pass
  - **Mitigation**: Variable-based upstream, careful path configuration
  - **Status**: ✅ Resolved with `proxy_pass http://$backend_upstream;`
- **Healthcheck Failures**: Missing dependencies or wrong endpoints
  - **Mitigation**: Install curl in backend, add `/healthz` endpoint, 30s start_period
  - **Status**: ✅ All healthchecks passing

### Operational Risks

- **DinD Container Management**: Privileged containers required
  - **Mitigation**: Isolated bridge network, managed via docker-compose
  - **Status**: ✅ Infrastructure stable
- **State Recovery**: Database backup and restoration procedures
  - **Mitigation**: Named volumes persist independently, backup via `docker cp`
  - **Status**: ✅ Data persists across service updates
- **Resource Allocation**: Docker Desktop resource limits
  - **Mitigation**: Lightweight alpine images, efficient service design
  - **Status**: ✅ No resource constraints observed

---
