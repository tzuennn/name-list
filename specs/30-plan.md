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

### Node Architecture

```
MANAGER NODE (macOS Laptop)
├── Docker Swarm Manager Role
├── Services: web (Nginx), api (Flask)
├── Ingress: Port 80 published
├── Networks: appnet overlay
└── Placement: node.role == manager

WORKER NODE (VirtualBox Ubuntu VM)
├── Docker Swarm Worker Role
├── Services: db (PostgreSQL) ONLY
├── Storage: /var/lib/postgres-data bind mount
├── Networks: appnet overlay
└── Placement: node.labels.role == db
```

### VirtualBox VM Setup

**VM Configuration**:

- Ubuntu 22.04 LTS Server
- 2GB RAM, 20GB disk
- Network: NAT + Host-only Network
- Docker CE installed
- SSH enabled for remote management

**Storage Strategy**:

- Bind mount: `/var/lib/postgres-data` on VM
- Persistent across container recreation
- Backup strategy: filesystem-level on VM

## Implementation Phases

### Phase 1: Infrastructure Preparation

**VirtualBox VM Setup**:

1. Download and install VirtualBox + Ubuntu Server ISO
2. Create VM with dual network adapters (NAT + Host-only)
3. Install Ubuntu with SSH server enabled
4. Install Docker CE and configure user permissions
5. Configure static IP on Host-only Network

**Network Configuration**:

1. Configure Host-only Network for VM ↔ laptop communication
2. Test SSH connectivity from laptop to VM
3. Verify internet access from VM (for Docker images)
4. Document IP addresses and network setup

### Phase 2: Swarm Initialization

**Swarm Setup Scripts**:

```bash
ops/init-swarm.sh       # Initialize swarm on laptop
ops/setup-worker.sh     # Configure VM to join swarm
ops/label-nodes.sh      # Apply placement constraint labels
```

**Network Creation**:

- Create overlay network `appnet` for service communication
- Configure service discovery (DNS-based)
- Test cross-node connectivity

### Phase 3: Stack Definition

**swarm/stack.yaml Development**:

```yaml
# Key requirements:
networks:
  appnet: { driver: overlay }

volumes:
  dbdata: { bind mount to /var/lib/postgres-data }

services:
  db:
    placement: ["node.labels.role == db"]
    replicas: 1
  web/api:
    placement: ["node.role == manager"]
    replicas: 2 each
```

**Service Configuration**:

- Database: PostgreSQL with persistent storage on worker
- API: Flask with environment pointing to `db` service
- Web: Nginx with load balancing across API replicas
- Health checks: pg_isready, curl /healthz

### Phase 4: Deployment Automation

**Operations Scripts**:

```bash
ops/deploy.sh          # Deploy stack from stack.yaml
ops/verify.sh          # End-to-end deployment verification
ops/cleanup.sh         # Remove stack and swarm
ops/backup-db.sh       # Database backup procedure
```

**Verification Process**:

- Topology: `docker node ls` shows manager + worker
- Placement: `docker service ps` confirms service distribution
- Connectivity: End-to-end application functionality
- Persistence: Data survives database service updates
- Load balancing: Multiple web replicas serve requests

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

### Technical Risks

**VirtualBox Networking**:

- Risk: VM network connectivity issues
- Mitigation: Detailed network configuration guide, test scripts
- Fallback: Document alternative VM platforms (VMware, etc.)

**Docker Swarm Communication**:

- Risk: Firewall blocking swarm ports (2377, 7946, 4789)
- Mitigation: Port configuration documentation, test connectivity
- Fallback: Provide firewall configuration examples

**Storage Persistence**:

- Risk: Data loss during VM operations
- Mitigation: Backup scripts, documented recovery procedures
- Fallback: Database migration procedures documented

### Operational Risks

**VM Resource Constraints**:

- Risk: VM performance impacting database operations
- Mitigation: Resource allocation guidelines, monitoring
- Fallback: Tuning recommendations for constrained environments

**Deployment Complexity**:

- Risk: Manual deployment steps prone to errors
- Mitigation: Complete automation scripts, verification checkpoints
- Fallback: Manual deployment procedures as backup

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
