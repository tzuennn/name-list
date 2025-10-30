# Tasks: Distributed 3-Tier App with Docker Swarm (HW5)

**Input**: HW5 specification for multi-node distributed deployment
**Prerequisites**: HW4 enhanced application completed and tested
**Target**: Docker Swarm orchestration across manager + worker

## Task Organization

Tasks grouped by implementation phases for systematic distributed deployment development. Each task includes specific deliverables and acceptance criteria.

## Format: `[ID] [P?] [Phase] Description`

- **[P]**: Can run in parallel (independent components)
- **[Phase]**: Infrastructure, Swarm, Stack, Ops, or Evidence
- Include exact file paths and verification criteria

---

## Phase 1: Infrastructure Setup

**Purpose**: Create Docker-in-Docker infrastructure for multi-node simulation

### DinD Infrastructure Creation

- [x] T001 Create `docker-compose.dind.yml` with manager and worker services — docker:24-dind images
- [x] T002 Configure privileged mode for both containers — enable Docker-in-Docker
- [x] T003 Set up bridge network `swarm-sim-net` — inter-container communication
- [x] T004 Configure port mappings — 80:80, 8080:8080 from manager to host
- [x] T005 Configure volumes — manager-state, worker-state, db-data, project mount at /app

### Infrastructure Startup & Verification

- [x] T006 Start DinD infrastructure — `docker-compose -f docker-compose.dind.yml up -d`
- [x] T007 Verify containers running — `docker ps` shows swarm-manager and swarm-worker
- [x] T008 Test Docker daemon in manager — `docker exec swarm-manager docker ps`
- [x] T009 Test Docker daemon in worker — `docker exec swarm-worker docker ps`

**Checkpoint**: ✅ DinD infrastructure operational with both containers running

---

## Phase 2: Swarm Infrastructure

**Purpose**: Initialize Docker Swarm cluster within DinD containers

### Swarm Initialization Script

- [x] T010 Create `ops/init-swarm.sh` — Automated swarm setup with 10s wait for Docker daemons
- [x] T011 Get manager IP from bridge network — `docker inspect swarm-manager`
- [x] T012 Initialize swarm on manager — `docker swarm init --advertise-addr $MANAGER_IP`
- [x] T013 Get worker join token — `docker swarm join-token worker -q`

### Swarm Configuration

- [x] T014 Join worker to swarm — Execute join command in worker container
- [x] T015 Apply `role=db` label to worker — `docker node update --label-add role=db worker`
- [x] T016 Verify swarm topology — `docker node ls` shows manager (Leader) + worker
- [x] T017 Create `ops/cleanup.sh` — Tear down stack and DinD infrastructure

**Checkpoint**: ✅ Docker Swarm cluster operational with 2 nodes and worker labeled

---

## Phase 3: Stack Definition & Image Building

**Purpose**: Create Docker Swarm stack and build application images

### Directory Structure

- [x] T020 [P] Create `swarm/` directory for stack configuration files
- [x] T021 [P] Create `docs/` directory for evidence and documentation

### Stack Configuration

- [x] T022 Create `swarm/stack.yaml` with overlay network `appnet` (driver: overlay, attachable: true)
- [x] T023 Configure database service — postgres:14-alpine, worker placement, `node.labels.role == db`
- [x] T024 Configure API service — Flask backend, manager placement, `node.role == manager`
- [x] T025 Configure web service — Nginx frontend, manager placement, 2 replicas
- [x] T026 Add persistent volume — `db-data` named volume (local driver)

### Service Details & Health Checks

- [x] T027 Database: Add Docker config for init.sql, pg_isready healthcheck, 30s start_period
- [x] T028 API: Add network aliases (api, backend), environment vars, curl /healthz healthcheck
- [x] T029 Web: Port 80 published, depends on api, 2 replicas for load balancing
- [x] T030 Overlay network with service discovery via network aliases

### Image Building

- [x] T031 Create `ops/build-images.sh` — Build images inside manager container
- [x] T032 Build backend image — `tzuennn/name-list-backend:latest` from /app/backend
- [x] T033 Build frontend image — `tzuennn/name-list-frontend:latest` from /app/frontend
- [x] T034 Verify images built — `docker images` shows both images

**Checkpoint**: ✅ Stack definition complete and images built successfully

---

## Phase 4: Deployment & Operations

**Purpose**: Deploy stack and create automation scripts

### Deployment Scripts

- [x] T040 Create `ops/deploy.sh` — Deploy stack from `swarm/stack.yaml` inside manager
- [x] T041 Create `ops/verify.sh` — Service status and health verification
- [x] T042 Create `ops/complete-setup.sh` — One-command: init → build → deploy
- [x] T043 Test deployment — `./ops/deploy.sh` successfully deploys all services

### Service Deployment & Verification

- [x] T044 Deploy stack — `docker stack deploy -c /app/swarm/stack.yaml mcapp`
- [x] T045 Verify service creation — `docker service ls` shows web, api, db
- [x] T046 Verify service placement — DB on worker, web/api on manager
- [x] T047 Wait for services to start — Monitor `docker service ps mcapp_*`
- [x] T048 Verify all replicas running — web: 2/2, api: 1/1, db: 1/1

### Bug Fixes & Improvements

- [x] T049 Fix DNS resolution — Implement lazy connection pooling in backend
- [x] T050 Add /healthz endpoint — Lightweight health check without DB dependency
- [x] T051 Install curl in backend — Enable healthcheck execution
- [x] T052 Fix nginx proxy path — Remove trailing /api/ from proxy_pass
- [x] T053 Add network aliases — api, backend, db for service discovery

**Checkpoint**: ✅ All services deployed and operational with fixes applied

---

## Phase 5: Documentation & Evidence

**Purpose**: Create comprehensive documentation and evidence package

### Evidence Collection

- [x] T060 Create `docs/EVIDENCE.md` with command outputs and screenshots
- [x] T061 Collect swarm topology evidence — `docker node ls` output
- [x] T062 Collect service placement evidence — `docker service ps` for all services
- [x] T063 Collect network connectivity evidence — curl tests for /, /api/names, /healthz
- [x] T064 Collect persistence evidence — Data survives service updates
- [x] T065 Collect health status — All services reporting healthy

### Specification Updates

- [x] T066 Update `specs/20-target-spec.md` — DinD architecture, resolved issues
- [x] T067 Update `specs/30-plan.md` — DinD approach, build process, fixes
- [x] T068 Update `specs/10-current-state-spec.md` — Correct docker-compose structure
- [x] T069 Create `swarm/README.md` — DinD deployment instructions

### AI Log & Reports

- [x] T070 Create `ai-log/hw3-development-report.md` — Changes from HW4, DinD rationale
- [x] T071 Document tools and models used — GPT-4, Claude, timestamps
- [x] T072 Document approach — DNS fixes, nginx proxy, healthchecks

**Checkpoint**: ✅ Complete documentation and evidence package ready

---

## Phase 6: Testing & Validation

**Purpose**: Ensure distributed deployment maintains HW4 functionality

### Functional Testing

- [x] T080 Test application accessibility — `curl http://localhost/` returns frontend
- [x] T081 Test API endpoints — GET /api/names returns JSON data
- [x] T082 Test data persistence — POST new name, verify it persists
- [x] T083 Test CRUD operations — Create, Read, Delete operations functional

### Integration Testing

- [x] T084 Test cross-node communication — API successfully connects to DB on worker
- [x] T085 Test overlay network — Service discovery via DNS (db, api, backend aliases)
- [x] T086 Test health checks — All services report healthy status
- [x] T087 Verify placement constraints — DB on worker, web/api on manager

### End-to-End Validation

- [x] T088 Test complete workflow — Add data via frontend, verify in database
- [x] T089 Test service updates — `docker service update` preserves data
- [x] T090 Test multiple requests — Load balancing across web replicas
- [x] T091 Verify all HW4 features — Application fully functional

**Checkpoint**: ✅ All testing complete, application fully operational

---

## Dependencies & Execution Order

### Phase Dependencies

```
Infrastructure (T001-T009) →
Swarm (T010-T017) →
Stack & Build (T020-T034) →
Deployment (T040-T053) →
Documentation (T060-T072) →
Testing (T080-T091)
```

### Critical Path

1. DinD infrastructure setup (T001-T009) ✅
2. Swarm cluster initialization (T010-T017) ✅
3. Stack definition and image building (T020-T034) ✅
4. Deployment and bug fixes (T040-T053) ✅
5. Documentation and evidence (T060-T072) ✅
6. Testing and validation (T080-T091) ✅

### Parallel Opportunities

- VM setup and script development can proceed in parallel after T005
- Documentation can begin during operations phase
- Evidence collection ongoing throughout testing phases

---

## Validation Criteria

### Technical Requirements

- [x] Docker Swarm with 2 nodes (manager + worker via DinD)
- [x] Database service runs only on worker node with persistent storage
- [x] Web/API services run only on manager node
- [x] Overlay network enables cross-node service communication
- [x] Application accessible at `http://localhost/` on host machine

### Operational Requirements

- [x] Complete ops automation (init-swarm.sh, build-images.sh, deploy.sh, verify.sh, cleanup.sh, complete-setup.sh)
- [x] End-to-end deployment with one command (complete-setup.sh)
- [x] Data persistence across container lifecycle verified
- [x] Health monitoring functional (all services healthy)
- [x] Load balancing via 2 web replicas

### Documentation Requirements

- [x] Evidence package in docs/EVIDENCE.md with all outputs
- [x] Updated specs reflecting DinD architecture
- [x] AI log with development report (hw3-development-report.md)
- [x] Deployment instructions in swarm/README.md

## Success Metrics

- **Deployment Speed**: Complete deployment in <10 minutes
- **Reliability**: 100% success rate for automated deployment
- **Performance**: Response times within 20% of single-host deployment
- **Documentation**: Independent deployment possible using provided docs

---

## Issues Resolved

### DNS & Connection Issues

- [x] T095 Fixed "could not translate host name 'db'" — Lazy connection pooling
- [x] T096 Fixed "host not found in upstream" — Variable-based nginx upstream
- [x] T097 Added resolver directive to nginx — 127.0.0.11 for Docker DNS

### Health Check Issues

- [x] T098 Added /healthz endpoint to backend — Lightweight check without DB
- [x] T099 Installed curl in backend Dockerfile — Enable healthcheck execution
- [x] T100 Added 30s start_period — Allow services time to initialize

### Proxy Configuration Issues

- [x] T101 Fixed nginx path doubling — Removed /api/ suffix from proxy_pass
- [x] T102 Added network aliases — api, backend, db for service discovery
- [x] T103 Verified end-to-end CRUD — All operations working through proxy

---

**Total Tasks**: 103 (100 planned + 3 additional fixes)
**Actual Effort**: ~8 hours for complete implementation
**Status**: ✅ All tasks complete, system fully operational
**Dependencies**: Docker Desktop, HW4 application functional
