# Tasks: Distributed 3-Tier App with Docker Swarm (HW5)

**Input**: HW5 specification for multi-node distributed deployment
**Prerequisites**: HW4 enhanced application completed and tested
**Target**: Docker Swarm orchestration across manager (laptop) + worker (VirtualBox VM)

## Task Organization

Tasks grouped by implementation phases for systematic distributed deployment development. Each task includes specific deliverables and acceptance criteria.

## Format: `[ID] [P?] [Phase] Description`

- **[P]**: Can run in parallel (independent components)
- **[Phase]**: Infrastructure, Swarm, Stack, Ops, or Evidence
- Include exact file paths and verification criteria

---

## Phase 1: Infrastructure Setup

**Purpose**: Prepare VirtualBox VM and networking for distributed deployment

### VM Creation & Configuration

- [ ] T001 [P] Download and install VirtualBox + Ubuntu 22.04 LTS Server ISO
- [ ] T002 Create VirtualBox VM with dual network (NAT + Host-only adapter) — 2GB RAM, 20GB disk
- [ ] T003 Install Ubuntu Server with SSH enabled — user: `swarm`, minimal installation
- [ ] T004 Configure host-only network adapter with static IP — document IP address mapping
- [ ] T005 [P] Install Docker CE on VM and add user to docker group — verify with `docker run hello-world`

### Network Connectivity Verification

- [ ] T006 Test SSH from laptop to VM — `ssh swarm@VM_IP` success
- [ ] T007 Verify VM internet access — `docker pull alpine` success from VM
- [ ] T008 Test Docker daemon on VM — `docker ps` works without sudo
- [ ] T009 Document network configuration — IP addresses, adapter settings in `docs/VM-SETUP.md`

**Checkpoint**: VM operational with Docker and SSH connectivity verified

---

## Phase 2: Swarm Infrastructure

**Purpose**: Initialize Docker Swarm and configure node roles

### Swarm Initialization Scripts

- [ ] T010 Create `ops/init-swarm.sh` — Initialize swarm on laptop, output join command
- [ ] T011 Create `ops/setup-worker.sh` — SSH to VM and execute join command
- [ ] T012 Create `ops/label-nodes.sh` — Apply `role=db` label to worker node
- [ ] T013 [P] Create `ops/cleanup.sh` — Remove stack and leave swarm (both nodes)

### Swarm Configuration

- [ ] T014 Execute swarm initialization — `./ops/init-swarm.sh` success
- [ ] T015 Join worker node to swarm — `./ops/setup-worker.sh` success
- [ ] T016 Apply placement labels — `./ops/label-nodes.sh` success
- [ ] T017 Verify swarm topology — `docker node ls` shows manager + worker

**Checkpoint**: Docker Swarm operational with correctly labeled nodes

---

## Phase 3: Stack Definition

**Purpose**: Create Docker Swarm stack configuration for distributed services

### Directory Structure

- [ ] T020 [P] Create `swarm/` directory for stack configuration files
- [ ] T021 [P] Create `docs/` directory for evidence and documentation

### Stack Configuration

- [ ] T022 Create `swarm/stack.yaml` with overlay network `appnet`
- [ ] T023 Configure database service with worker placement constraint — `node.labels.role == db`
- [ ] T024 Configure web/api services with manager placement constraint — `node.role == manager`
- [ ] T025 [P] Add persistent volume configuration — bind mount `/var/lib/postgres-data` on worker
- [ ] T026 [P] Configure service health checks — pg_isready, curl /healthz endpoints

### Service Configuration Details

- [ ] T027 Database service: PostgreSQL with persistent storage, 1 replica, worker-only
- [ ] T028 API service: Flask backend, 2 replicas, manager-only, connects to `db` service
- [ ] T029 Web service: Nginx frontend, 2 replicas, manager-only, port 80 published
- [ ] T030 Overlay network: `appnet` for cross-node service communication

**Checkpoint**: Stack definition complete with proper service placement and networking

---

## Phase 4: Operations Automation

**Purpose**: Create deployment and verification automation scripts

### Deployment Scripts

- [ ] T040 Create `ops/deploy.sh` — Deploy stack from `swarm/stack.yaml`
- [ ] T041 Create `ops/verify.sh` — End-to-end deployment verification with health checks
- [ ] T042 [P] Create `ops/backup-db.sh` — Database backup procedure for worker node
- [ ] T043 [P] Create `ops/status.sh` — Show swarm status, service placement, and health

### Verification Procedures

- [ ] T044 Implement topology verification — `docker node ls` validation in verify.sh
- [ ] T045 Implement service placement verification — `docker service ps` validation for each service
- [ ] T046 Implement connectivity testing — curl tests for all endpoints in verify.sh
- [ ] T047 Implement persistence testing — data survival across database service restart
- [ ] T048 Implement load balancing demonstration — multiple requests showing different container IDs

### Script Testing

- [ ] T049 Test complete deployment cycle — deploy → verify → cleanup → redeploy
- [ ] T050 Validate automation scripts work without manual intervention
- [ ] T051 Test backup and restore procedures — data integrity validation

**Checkpoint**: Complete ops automation functional and tested

---

## Phase 5: Documentation & Evidence

**Purpose**: Create comprehensive documentation and evidence package

### Evidence Collection

- [ ] T060 Create `docs/EVIDENCE.md` with command outputs and screenshots
- [ ] T061 [P] Collect swarm topology evidence — `docker node ls` output
- [ ] T062 [P] Collect service placement evidence — `docker service ps` for all services
- [ ] T063 [P] Collect network connectivity evidence — curl outputs and timing
- [ ] T064 [P] Collect persistence evidence — before/after database restart comparisons
- [ ] T065 [P] Collect load balancing evidence — multiple web requests with container IDs

### Documentation Updates

- [ ] T066 Update `README.md` with distributed deployment section
- [ ] T067 Create `docs/TROUBLESHOOTING.md` — Common VirtualBox and Swarm issues
- [ ] T068 Create `docs/ARCHITECTURE.md` — Distributed system design documentation
- [ ] T069 [P] Create `docs/PERFORMANCE.md` — Distributed vs single-host performance comparison

### Video Documentation

- [ ] T070 Record demo video (≤5 minutes) — Complete deployment and verification process
- [ ] T071 Include evidence of topology, placement, connectivity, and persistence
- [ ] T072 Demonstrate load balancing across web service replicas

**Checkpoint**: Complete evidence package and documentation ready for submission

---

## Phase 6: Testing & Validation

**Purpose**: Ensure distributed deployment maintains HW4 functionality and performance

### Functional Testing

- [ ] T080 Verify all HW4 features work in distributed deployment — sorting, pagination, accessibility
- [ ] T081 Test application performance — response times comparable to single-host
- [ ] T082 [P] Test data persistence across various failure scenarios
- [ ] T083 [P] Test service recovery and health check functionality

### Integration Testing

- [ ] T084 Test cross-node service communication — API to database connectivity
- [ ] T085 Test overlay network functionality — DNS resolution between services
- [ ] T086 Test ingress load balancing — traffic distribution across web replicas
- [ ] T087 Test placement constraints — services stay on assigned nodes

### Edge Case Testing

- [ ] T088 Test VM restart scenario — data persistence and service recovery
- [ ] T089 Test network interruption recovery — temporary connectivity loss
- [ ] T090 [P] Test resource constraint scenarios — VM memory/CPU limits
- [ ] T091 [P] Test stack update scenarios — rolling updates and rollbacks

**Checkpoint**: All testing complete with documented results

---

## Dependencies & Execution Order

### Phase Dependencies

```
Infrastructure (T001-T009) →
Swarm (T010-T017) →
Stack (T020-T030) →
Operations (T040-T051) →
Documentation (T060-T072) →
Testing (T080-T091)
```

### Critical Path

1. VM setup and Docker installation (T001-T005)
2. Network connectivity verification (T006-T009)
3. Swarm initialization (T010-T017)
4. Stack development (T020-T030)
5. Deployment automation (T040-T051)

### Parallel Opportunities

- VM setup and script development can proceed in parallel after T005
- Documentation can begin during operations phase
- Evidence collection ongoing throughout testing phases

---

## Validation Criteria

### Technical Requirements

- [ ] Docker Swarm with 2+ nodes (manager + worker)
- [ ] Database service runs only on worker node with persistent storage
- [ ] Web/API services run only on manager node
- [ ] Overlay network enables cross-node service communication
- [ ] Application accessible at `http://localhost/` on manager node

### Operational Requirements

- [ ] Complete ops automation (5+ scripts)
- [ ] End-to-end deployment without manual intervention
- [ ] Data persistence across container lifecycle
- [ ] Health monitoring and service recovery
- [ ] Load balancing demonstration

### Documentation Requirements

- [ ] Evidence package with command outputs and screenshots
- [ ] Demo video showing complete deployment process
- [ ] Updated specs reflecting distributed architecture
- [ ] Troubleshooting guide for common issues

## Success Metrics

- **Deployment Speed**: Complete deployment in <10 minutes
- **Reliability**: 100% success rate for automated deployment
- **Performance**: Response times within 20% of single-host deployment
- **Documentation**: Independent deployment possible using provided docs

---

## Risk Mitigation Tasks

### Technical Risks

- [ ] T095 Document firewall configuration for swarm ports (2377, 7946, 4789)
- [ ] T096 Create network troubleshooting guide — connectivity testing procedures
- [ ] T097 Document VM resource tuning — memory and CPU optimization

### Operational Risks

- [ ] T098 Create rollback procedures — return to single-host deployment
- [ ] T099 Document manual deployment fallback — step-by-step procedures
- [ ] T100 Create monitoring and alerting strategy — health check interpretation

---

**Total Tasks**: 100
**Estimated Effort**: 8-12 hours for complete implementation
**Dependencies**: VirtualBox installed, HW4 application functional
