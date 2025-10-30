# HW3 Evidence Bundle - Docker Swarm Deployment

**Student:** 曾子恩  
**Date:** October 30, 2025  
**Assignment:** Distributed 3-Tier App on Docker Swarm

---

## Architecture Overview

This deployment uses Docker-in-Docker (DinD) to simulate a multi-node Docker Swarm cluster:

- **Manager Node**: Runs web (Nginx) and API (Flask) services
- **Worker Node**: Runs database (PostgreSQL) service with persistent storage
- **Network**: Overlay network for service discovery and communication

---

## 1. Node Status

### Command: `docker node ls`

```bash
$ docker exec swarm-manager docker node ls
```

**Output:**

```
ID                            HOSTNAME   STATUS    AVAILABILITY   MANAGER STATUS   ENGINE VERSION
yttcc9b6hwd8r8vontin8ramg *   manager    Ready     Active         Leader           24.0.9
nmtfvzzxdhns72z0jnice31w8     worker     Ready     Active                          24.0.9
```

**Analysis:**

- ✅ 2 nodes total (meets requirement of 2+ nodes)
- ✅ Manager node is Leader
- ✅ Both nodes are Ready and Active
- ✅ Worker node labeled with `role=db` for database placement

---

## 2. Stack Services

### Command: `docker stack services mcapp`

```bash
$ docker exec swarm-manager docker stack services mcapp
```

**Output:**

```
ID             NAME        MODE         REPLICAS   IMAGE                               PORTS
nogecxbeslax   mcapp_api   replicated   1/1        tzuennn/name-list-backend:latest    *:8080->8000/tcp
qc5vpamrqqvl   mcapp_db    replicated   1/1        postgres:14-alpine
zzzy7v9b88ff   mcapp_web   replicated   2/2        tzuennn/name-list-frontend:latest   *:80->80/tcp
```

**Analysis:**

- ✅ All services converged (replicas match desired state)
- ✅ Web has 2 replicas for load balancing
- ✅ API and DB have 1 replica each
- ✅ Ports correctly exposed (80 for web, 8080 for API)

---

## 3. Database Service Placement

### Command: `docker service ps mcapp_db`

```bash
$ docker exec swarm-manager docker service ps mcapp_db
```

**Output:**

```
ID             NAME         IMAGE                NODE      DESIRED STATE   CURRENT STATE            ERROR     PORTS
punraw1pz1ns   mcapp_db.1   postgres:14-alpine   worker    Running         Running 26 minutes ago
```

**Analysis:**

- ✅ Database runs ONLY on worker node (constraint satisfied)
- ✅ Service is Running and stable
- ✅ Placement constraint `node.labels.role == db` working correctly

---

## 4. API Service Placement

### Command: `docker service ps mcapp_api`

```bash
$ docker exec swarm-manager docker service ps mcapp_api
```

**Output:**

```
ID             NAME              IMAGE                              NODE      DESIRED STATE   CURRENT STATE
7x19cm3hkgld   mcapp_api.1       tzuennn/name-list-backend:latest   manager   Running         Running 25 seconds ago
```

**Analysis:**

- ✅ API runs on manager node (constraint satisfied)
- ✅ Placement constraint `node.role == manager` working correctly

---

## 5. Web Service Placement (Load Balanced)

### Command: `docker service ps mcapp_web`

```bash
$ docker exec swarm-manager docker service ps mcapp_web
```

**Output:**

```
ID             NAME          IMAGE                                NODE      DESIRED STATE   CURRENT STATE
pyrtxcf6losb   mcapp_web.1   tzuennn/name-list-frontend:latest    manager   Running         Running 19 minutes ago
sgxyvnvsbdjs   mcapp_web.2   tzuennn/name-list-frontend:latest    manager   Running         Running 19 minutes ago
```

**Analysis:**

- ✅ 2 web replicas for load balancing
- ✅ Both run on manager node (constraint satisfied)
- ✅ Swarm's ingress network provides round-robin load balancing

---

## 6. Database Volume Inspection

### Command: `docker inspect mount for mcapp_db`

```bash
$ docker exec swarm-manager docker service inspect mcapp_db --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}' | python3 -m json.tool
```

**Output:**

```json
[
  {
    "Type": "volume",
    "Source": "mcapp_db-data",
    "Target": "/var/lib/postgresql/data",
    "VolumeOptions": {
      "Labels": {
        "com.docker.stack.namespace": "mcapp"
      }
    }
  }
]
```

**Storage Path & Permissions:**

- **Volume Name**: `mcapp_db-data` (Docker-managed volume)
- **Mount Point**: `/var/lib/postgresql/data` (standard PostgreSQL data directory)
- **Location**: On worker node's Docker volume storage
- **Permissions**: Managed by PostgreSQL container (user `postgres`, UID 999)
- **Persistence**: Data survives container restarts and updates
- **Driver**: `local` (suitable for single-node, production would use distributed storage)

---

## 7. Web Frontend Access

### Command: `curl http://localhost/`

```bash
$ curl -s http://localhost/ | head -20
```

**Output:**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>3-Tier App</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      rel="stylesheet"
    />
    <style>
      body {
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        margin: 2rem;
        max-width: 600px;
      }
      input,
      button {
        padding: 0.5rem 1rem;
        font-size: 1rem;
```

**Analysis:**

- ✅ Web frontend accessible on port 80
- ✅ HTML loads correctly
- ✅ Multiple refreshes show load balancing across 2 replicas (Swarm ingress handles this transparently)

---

## 8. API Endpoint Access

### Command: `curl http://localhost/api/names`

```bash
$ curl http://localhost/api/names
```

**Output:**

```json
[
  {
    "created_at": "Thu, 30 Oct 2025 10:07:25 GMT",
    "id": 1,
    "name": "Docker Swarm Test"
  },
  {
    "created_at": "Thu, 30 Oct 2025 10:17:15 GMT",
    "id": 2,
    "name": "Frontend Test"
  }
]
```

**Analysis:**

- ✅ API accessible through frontend proxy at `/api/names`
- ✅ Data retrieved from PostgreSQL database
- ✅ Database connection working correctly

---

## 9. Direct API Access

### Command: `curl http://localhost:8080/api/names`

```bash
$ curl http://localhost:8080/api/names
```

**Output:**

```json
[
  {
    "created_at": "Thu, 30 Oct 2025 10:07:25 GMT",
    "id": 1,
    "name": "Docker Swarm Test"
  },
  {
    "created_at": "Thu, 30 Oct 2025 10:17:15 GMT",
    "id": 2,
    "name": "Frontend Test"
  }
]
```

**Analysis:**

- ✅ API directly accessible on port 8080
- ✅ Returns same data as proxy access

---

## 10. Health Check Endpoint

### Command: `curl http://localhost:8080/healthz`

```bash
$ curl http://localhost:8080/healthz
```

**Output:**

```json
{ "status": "ok" }
```

**Analysis:**

- ✅ Health endpoint returns OK
- ✅ Container healthchecks use this endpoint
- ✅ No database dependency for basic health (faster startup)

---

## 11. Data Persistence Test

### Test Steps:

#### Step 1: Insert test data

```bash
$ curl -X POST http://localhost/api/names -H "Content-Type: application/json" -d '{"name":"Persistence Test"}'
{"message":"Created"}
```

#### Step 2: Verify data exists

```bash
$ curl http://localhost/api/names | grep "Persistence Test"
{"created_at":"Thu, 30 Oct 2025 10:20:00 GMT","id":3,"name":"Persistence Test"}
```

#### Step 3: Update database service (triggers restart)

```bash
$ docker exec swarm-manager docker service update --force mcapp_db
mcapp_db
overall progress: 1 out of 1 tasks
verify: Service converged
```

#### Step 4: Verify data persists after restart

```bash
$ curl http://localhost/api/names | grep "Persistence Test"
{"created_at":"Thu, 30 Oct 2025 10:20:00 GMT","id":3,"name":"Persistence Test"}
```

**Analysis:**

- ✅ Data inserted successfully
- ✅ Service restarted without errors
- ✅ Data persists after database container restart
- ✅ Volume mount working correctly

---

## 12. Full Service Details

### Web Service

```bash
$ docker exec swarm-manager docker service inspect mcapp_web --pretty
```

**Key Configuration:**

- **Replicas**: 2
- **Image**: tzuennn/name-list-frontend:latest
- **Ports**: 80:80 (published)
- **Network**: appnet (overlay)
- **Placement**: node.role == manager

### API Service

```bash
$ docker exec swarm-manager docker service inspect mcapp_api --pretty
```

**Key Configuration:**

- **Replicas**: 1
- **Image**: tzuennn/name-list-backend:latest
- **Ports**: 8080:8000 (published)
- **Network**: appnet (overlay)
- **Environment Variables**: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- **Healthcheck**: curl -f http://localhost:8000/healthz (interval: 10s, start_period: 30s)
- **Placement**: node.role == manager

### Database Service

```bash
$ docker exec swarm-manager docker service inspect mcapp_db --pretty
```

**Key Configuration:**

- **Replicas**: 1
- **Image**: postgres:14-alpine
- **Network**: appnet (overlay)
- **Volume**: mcapp_db-data → /var/lib/postgresql/data
- **Environment Variables**: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
- **Healthcheck**: pg_isready -U user -d mydatabase (interval: 10s, start_period: 30s)
- **Placement**: node.labels.role == db
- **Configs**: init.sql mounted for schema initialization

---

## Architecture Decisions

### 1. Database Placement on Worker Node

**Decision**: Constrain database to worker node with label `role=db`

**Justification**:

- Separates compute (manager) from data (worker) tiers
- Allows independent scaling of database infrastructure
- Prevents resource contention with orchestration tasks on manager
- Follows best practice of not running stateful services on manager nodes
- Enables dedicated disk I/O for database operations

**Implementation**:

```yaml
deploy:
  placement:
    constraints:
      - node.labels.role == db
```

### 2. Overlay Network

**Decision**: Use overlay network for service-to-service communication

**Justification**:

- Enables services on different nodes to communicate seamlessly
- Provides built-in service discovery (DNS-based)
- Encrypts traffic between nodes (with `--opt encrypted` if needed)
- Isolates application traffic from host networks
- Supports multi-host deployments without manual network configuration

**Configuration**:

```yaml
networks:
  appnet:
    driver: overlay
    attachable: true
```

### 3. Persistent Storage

**Decision**: Use Docker volume with local driver

**Justification**:

- **Current Setup** (Development/Demo): Local driver sufficient for single-worker setup
- **Advantages**: Simple, fast, built-in Docker feature
- **Limitations**: Not suitable for multi-worker database scenarios

**Production Recommendations**:

- Use distributed storage driver (e.g., NFS, GlusterFS, Ceph)
- Consider cloud provider volumes (AWS EBS, Azure Disk)
- Implement backup/restore procedures
- Use database replication for high availability

### 4. Risks and Mitigations

| Risk                        | Impact                           | Mitigation Strategy                                                                      |
| --------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| **Single database replica** | High - Database is SPOF          | - Implement PostgreSQL replication<br>- Add monitoring and alerts<br>- Automated backups |
| **Local volume driver**     | High - Data loss if worker fails | - Use distributed storage<br>- Regular backups<br>- Database replication                 |
| **No resource limits**      | Medium - Resource exhaustion     | - Set memory/CPU limits in stack.yaml<br>- Monitor resource usage                        |
| **Secrets in environment**  | Medium - Security exposure       | - Use Docker secrets instead<br>- Rotate credentials regularly                           |
| **Network DNS timing**      | Low - Startup failures           | - Implemented lazy connection initialization<br>- Added health check start_period        |
| **Single manager node**     | High - Control plane SPOF        | - Add multiple manager nodes (3 or 5)<br>- Use manager quorum for fault tolerance        |

---

## Testing Results Summary

| Test Case              | Status  | Notes                            |
| ---------------------- | ------- | -------------------------------- |
| Node setup (2+ nodes)  | ✅ PASS | Manager + Worker nodes active    |
| DB placement on worker | ✅ PASS | Constraint working correctly     |
| Web load balancing     | ✅ PASS | 2 replicas distributing load     |
| Data insertion         | ✅ PASS | POST to /api/names successful    |
| Data persistence       | ✅ PASS | Survives database restart        |
| Health endpoint        | ✅ PASS | Returns OK status                |
| Frontend rendering     | ✅ PASS | HTML loads correctly             |
| API connectivity       | ✅ PASS | Backend reaches database         |
| Network isolation      | ✅ PASS | Services communicate via overlay |
| Service discovery      | ✅ PASS | DNS resolution working           |

---

## Deployment Verification Checklist

- [x] Docker Swarm initialized with 2+ nodes
- [x] Manager node is Leader
- [x] Worker node labeled with `role=db`
- [x] Database service constrained to worker node only
- [x] Web and API services on manager node
- [x] All services in Running state
- [x] Overlay network created and attached
- [x] Persistent volume mounted for database
- [x] Database schema initialized from init.sql
- [x] Web accessible on port 80
- [x] API accessible on port 8080
- [x] Health endpoint responds with OK
- [x] Data persists across database restarts
- [x] Load balancing working across web replicas
- [x] Service discovery via DNS working
- [x] No errors in service logs

---

## Infrastructure Details

### Docker-in-Docker Setup

- **Manager Container**: `swarm-manager` (docker:24-dind)
- **Worker Container**: `swarm-worker` (docker:24-dind)
- **Bridge Network**: `swarm-sim-net` (172.19.0.0/16)
- **Manager IP**: 172.19.0.2
- **Worker IP**: 172.19.0.3
- **Volumes**: manager-state, worker-state, db-data

### Host Access Points

- **Web Frontend**: http://localhost:80
- **API Backend**: http://localhost:8080
- **Ports Forwarded**: 80, 8080 from manager container to host

---

**Evidence collected on:** October 30, 2025  
**Deployment status:** ✅ All requirements met and verified
