# Target: Distributed 3-Tier App with Docker Swarm (HW5)

**Date**: 2025-10-28 | **Status**: PLANNED - Multi-Node Swarm Architecture

## 🎯 HW5 Goal: Multi-Node Distributed Deployment

Transform the enhanced single-host application (HW4) into a distributed system using Docker Swarm orchestration across two nodes.

## Target Architecture Overview

### Node Distribution Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ MANAGER NODE (Student Laptop - macOS)                      │
├─────────────────────────────────────────────────────────────┤
│ • Swarm Manager Role                                        │
│ • Services: web (Nginx), api (Flask)                       │
│ • Ingress: Port 80 → web service                          │
│ • Overlay Network: appnet                                   │
└─────────────────────────────────────────────────────────────┘
              ↕ (Docker Swarm Communication)
┌─────────────────────────────────────────────────────────────┐
│ WORKER NODE (VirtualBox VM - Ubuntu)                       │
├─────────────────────────────────────────────────────────────┤
│ • Swarm Worker Role                                         │
│ • Services: db (PostgreSQL) ONLY                           │
│ • Storage: /var/lib/postgres-data (persistent)             │
│ • Node Label: role=db                                       │
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

- **Database Persistence**: Bind mount to `/var/lib/postgres-data` on worker node
- **Data Durability**: Survives container recreation and node restarts
- **Backup Strategy**: Local filesystem on worker node (documented process)

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
├── init-swarm.sh      # Initialize swarm, output join token
├── setup-worker.sh    # Configure worker node (VirtualBox)
├── deploy.sh          # Deploy stack from manager
├── verify.sh          # End-to-end deployment verification
├── cleanup.sh         # Tear down stack and swarm
└── backup-db.sh       # Database backup procedure
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

- **Network Connectivity**: VirtualBox host-only adapter + NAT configuration
- **Storage Permissions**: Proper user/group mapping for bind mounts
- **Swarm Communication**: Firewall configuration for required ports (2377, 7946, 4789)
- **Resource Constraints**: VM sizing appropriate for PostgreSQL workload

### Operational Risks

- **VM Management**: Automated VM setup and configuration scripts
- **State Recovery**: Database backup strategy and restoration procedures
- **Version Control**: Stack definition versioning and rollback capability
- **Monitoring**: Health check configuration and alerting strategy

---
