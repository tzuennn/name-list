# HW6 Kubernetes Migration Report: K3s Multi-Node Cluster

**Student**: TSENG TZU EN
**Date**: November 10, 2025

## Executive Summary

This report documents the migration of the Name List application from Docker Swarm (HW5) to Kubernetes using K3s with k3d. The project demonstrates production-grade container orchestration with Kubernetes-native features including StatefulSets, Deployments, Ingress routing, persistent volumes, node affinity, and horizontal pod autoscaling across a multi-node cluster.

## What Changed from HW5 and Why

### 1. Orchestration Platform: Docker Swarm → Kubernetes (K3s)

**Before (HW5)**: Docker Swarm with DinD infrastructure

```
Swarm Manager Node (DinD)
├── web service (2 replicas)
├── api service (1 replica)
└── Ports: 80, 8080

Swarm Worker Node (DinD)
└── db service (1 replica)
    └── Named volume
```

**After (HW6)**: Kubernetes K3s with k3d multi-node cluster

```
K3s Server Node (k3d-namelist-server-0)
├── Control Plane (kube-apiserver, etcd, scheduler)
├── api Deployment (2 replicas)
├── web Deployment (2 replicas)
└── Traefik Ingress Controller

K3s Agent Node (k3d-namelist-agent-0)
├── db StatefulSet (1 replica)
└── PersistentVolumeClaim (1Gi)
```

**Why Migration to Kubernetes**:

- **Industry Standard**: Kubernetes is the de facto standard for container orchestration
- **Production-Grade Features**: StatefulSets, PersistentVolumes, Ingress, RBAC
- **Better Observability**: Built-in resource monitoring, event tracking, and logging
- **Declarative Configuration**: All resources defined in YAML manifests
- **Horizontal Scaling**: Native support with `kubectl scale`
- **Self-Healing**: Automatic pod restart and rescheduling
- **Service Discovery**: Built-in kube-dns for internal service resolution
- **Cloud-Native**: Standard APIs compatible with all cloud providers

### 2. Resource Definitions: Swarm Stack → Kubernetes Manifests

**Before (HW5)**: Single `swarm/stack.yaml` with service definitions

**After (HW6)**: Kubernetes-native manifest files

```
k8s/
├── 00-namespace.yaml       # Namespace isolation
├── 01-configmap.yaml       # Configuration data
├── 02-secrets.yaml         # Sensitive credentials
├── 10-database.yaml        # StatefulSet + PVC + Service
├── 20-api.yaml             # Deployment + Service
├── 30-web.yaml             # Deployment + Service
└── 40-ingress.yaml         # Traefik Ingress routing
```

**Key Differences**:

| Aspect             | Docker Swarm          | Kubernetes K3s          |
| ------------------ | --------------------- | ----------------------- |
| **Config Format**  | Single stack.yaml     | Multiple manifest files |
| **Stateful Apps**  | Service with volume   | StatefulSet + PVC       |
| **Stateless Apps** | Service with replicas | Deployment              |
| **Configuration**  | Environment variables | ConfigMaps + Secrets    |
| **Load Balancing** | Routing mesh          | Ingress + Service       |
| **Storage**        | Named volumes         | PersistentVolumeClaims  |
| **Placement**      | Constraints           | Node affinity/selectors |

**Benefits**:

- **Separation of Concerns**: Each resource type in its own file
- **Reusability**: ConfigMaps and Secrets shared across pods
- **Version Control Friendly**: Smaller files, easier diffs
- **Standard Format**: Works with all Kubernetes tooling

### 3. Networking: Swarm Overlay → Kubernetes Service Mesh

**Before (HW5)**: Docker Swarm overlay network with routing mesh

```yaml
# Swarm: Overlay network
networks:
  appnet:
    driver: overlay
```

**After (HW6)**: Kubernetes native networking with kube-dns and Ingress

```yaml
# K8s: ClusterIP Services
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: ClusterIP
  selector:
    app: namelist
    component: api
  ports:
    - port: 8000
      targetPort: 8000
```

**Key Changes**:

| Feature               | Docker Swarm              | Kubernetes K3s                                 |
| --------------------- | ------------------------- | ---------------------------------------------- |
| **Internal DNS**      | Swarm DNS (service names) | kube-dns (service.namespace.svc.cluster.local) |
| **Load Balancing**    | Routing mesh (VIP)        | kube-proxy (iptables/IPVS)                     |
| **External Access**   | Published ports           | Ingress Controller (Traefik)                   |
| **Service Discovery** | DNS + VIP                 | DNS + ClusterIP                                |
| **Network Policy**    | Limited                   | Full NetworkPolicy support                     |

**Backend Connection String** (No Change):

```python
# Same DNS-based service discovery
DB_HOST = os.getenv("DB_HOST", "db-service")  # Kubernetes Service name
```

### 4. Deployment Automation: Swarm Scripts → K8s Scripts

**Before (HW5)**: Docker Swarm DinD automation

```bash
ops/
├── complete-setup.sh    # DinD + Swarm + Deploy
├── init-swarm.sh        # Initialize Swarm cluster
├── build-images.sh      # Build in manager
├── deploy.sh            # Deploy stack
├── verify.sh            # Verify deployment
└── cleanup.sh           # Teardown
```

**After (HW6)**: Kubernetes-native automation

```bash
ops/
├── k3s-build-images.sh  # Build + import to k3d
├── k3s-deploy.sh        # kubectl apply manifests
├── k3s-verify.sh        # Verify K8s deployment
└── k3s-cleanup.sh       # Delete resources + cluster
```

**Key Differences**:

| Task                 | Docker Swarm                | Kubernetes K3s                          |
| -------------------- | --------------------------- | --------------------------------------- |
| **Cluster Creation** | `docker swarm init` in DinD | `k3d cluster create`                    |
| **Image Management** | Build inside manager        | Build + `k3d image import`              |
| **Deployment**       | `docker stack deploy`       | `kubectl apply -f k8s/`                 |
| **Verification**     | `docker service ls`         | `kubectl get pods/svc/ingress`          |
| **Scaling**          | `docker service scale`      | `kubectl scale deployment`              |
| **Cleanup**          | Remove containers + network | `kubectl delete` + `k3d cluster delete` |

**Deployment Command Comparison**:

```bash
# HW5 Swarm
docker exec swarm-manager docker stack deploy -c /app/swarm/stack.yaml mcapp

# HW6 K8s
kubectl apply -f k8s/
```

### 5. Storage: Docker Volumes → Kubernetes PersistentVolumes

**Before (HW5)**: Docker named volumes with Swarm placement

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
          - node.labels.role == db
```

**After (HW6)**: Kubernetes PersistentVolumeClaim with StatefulSet

```yaml
# PersistentVolumeClaim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-data
  namespace: namelist
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: local-path  # K3s default

# StatefulSet
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: db
spec:
  volumeClaimTemplates:
    - metadata:
        name: db-data
      spec:
        accessModes: [ "ReadWriteOnce" ]
        resources:
          requests:
            storage: 1Gi
```

**Key Advantages**:

| Feature          | Docker Swarm    | Kubernetes K3s               |
| ---------------- | --------------- | ---------------------------- |
| **Abstraction**  | Driver-specific | Storage class abstraction    |
| **Provisioning** | Manual          | Dynamic with storage classes |
| **Lifecycle**    | Tied to service | Independent resource         |
| **Portability**  | Docker-specific | Cloud provider agnostic      |
| **Snapshots**    | Not supported   | Supported via CSI            |

### 6. Health Monitoring: Swarm Healthchecks → Kubernetes Probes

**Before (HW5)**: Docker Swarm healthchecks

```yaml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/healthz"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
```

**After (HW6)**: Kubernetes liveness and readiness probes

```yaml
containers:
  - name: api
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8000
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /healthz
        port: 8000
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
```

**Key Differences**:

- **Liveness**: Restart pod if unhealthy
- **Readiness**: Remove from service if not ready (no traffic)
- **Startup**: Optional probe for slow-starting containers
- **Granular Control**: Different probes for different purposes

### 7. Node Placement: Swarm Constraints → Kubernetes Affinity

**Before (HW5)**: Swarm placement constraints

```yaml
services:
  db:
    deploy:
      placement:
        constraints:
          - node.labels.role == db
```

**After (HW6)**: Kubernetes node affinity

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: node-role
              operator: In
              values:
                - database
```

**Advantages**:

- **More Expressive**: Required vs preferred affinity
- **Pod Affinity**: Co-locate or separate pods
- **Anti-Affinity**: Spread replicas across nodes
- **Weights**: Preferred rules with priority

## Detailed Migration Changes

### Component-by-Component Comparison

#### Database (PostgreSQL)

| Aspect             | HW5 Swarm                    | HW6 K8s                                 |
| ------------------ | ---------------------------- | --------------------------------------- |
| **Resource Type**  | Service                      | StatefulSet                             |
| **Replicas**       | 1                            | 1 (stable network identity)             |
| **Storage**        | Named volume                 | PersistentVolumeClaim                   |
| **Placement**      | `node.labels.role == db`     | Node affinity with `node-role=database` |
| **Initialization** | Volume mount `db/init.sql`   | ConfigMap with init script              |
| **Health Check**   | `pg_isready` via healthcheck | `pg_isready` via liveness/readiness     |

#### API Backend (Flask)

| Aspect            | HW5 Swarm              | HW6 K8s                               |
| ----------------- | ---------------------- | ------------------------------------- |
| **Resource Type** | Service                | Deployment                            |
| **Replicas**      | 1                      | 2 (high availability)                 |
| **Configuration** | Environment variables  | ConfigMap + Secrets                   |
| **Port**          | 8000                   | 8000 (ClusterIP service)              |
| **Placement**     | Manager node           | Preferred server node (control plane) |
| **Scaling**       | `docker service scale` | `kubectl scale deployment`            |

#### Web Frontend (Nginx)

| Aspect            | HW5 Swarm                 | HW6 K8s                |
| ----------------- | ------------------------- | ---------------------- |
| **Resource Type** | Service                   | Deployment             |
| **Replicas**      | 2                         | 2 (load balanced)      |
| **Port**          | 80                        | 80 (ClusterIP service) |
| **Routing**       | Swarm routing mesh        | Traefik Ingress        |
| **Configuration** | Volume mount `nginx.conf` | ConfigMap (if needed)  |

#### External Access

| Aspect           | HW5 Swarm                  | HW6 K8s                     |
| ---------------- | -------------------------- | --------------------------- |
| **Method**       | Published ports on manager | Ingress Controller          |
| **Ports**        | 80:80, 8080:8080           | 80:80 via k3d load balancer |
| **Path Routing** | Nginx proxy_pass           | Ingress path rules          |
| **TLS**          | Manual                     | Cert-manager integration    |

## What We Learned from Migration

### 1. Kubernetes Complexity vs Power Trade-off

- **More verbose**: 7 manifest files vs 1 stack file
- **More powerful**: Finer-grained control over resources
- **Better separation**: Config, secrets, storage as first-class resources

### 2. Declarative Infrastructure is Superior

```bash
# Swarm: Imperative scaling
docker service scale mcapp_api=3

# K8s: Declarative scaling
kubectl patch deployment api -p '{"spec":{"replicas":3}}'
# Or edit manifest and reapply
```

### 3. StatefulSets for Stateful Applications

- Stable network identities (`db-0`, `db-1`)
- Ordered deployment and scaling
- Persistent storage per pod
- Better than Swarm services for databases

### 4. Resource Monitoring Built-In

```bash
# K8s provides native resource visibility
kubectl top nodes
kubectl top pods -n namelist

# Swarm requires external monitoring
```

### 5. Self-Healing is More Robust

- Pods automatically restarted on failure
- Failed nodes trigger pod rescheduling
- Readiness probes prevent traffic to unhealthy pods
- Liveness probes restart hung containers

##

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

## How to Reproduce K3s Multi-Node Deployment

### Prerequisites

- Docker Desktop installed and running
- k3d installed (`brew install k3d` on macOS)
- kubectl installed
- Git installed
- Terminal access (macOS/Linux)

### Complete Setup

```bash
# 1. Clone repository
git clone https://github.com/tzuennn/name-list.git
cd name-list
git checkout k3s-refactor

# 2. Create K3s multi-node cluster
k3d cluster create namelist \
  --servers 1 \
  --agents 1 \
  --port "80:80@loadbalancer" \
  --port "8080:8080@loadbalancer"

# 3. Label agent node for database
kubectl label node k3d-namelist-agent-0 node-role=database

# 4. Build and deploy
./ops/k3s-build-images.sh  # ~2 minutes
./ops/k3s-deploy.sh         # ~1 minute

# Expected output:
# ✅ K3s cluster created (2 nodes: server + agent)
# ✅ Images built and imported to k3d
# ✅ Application deployed (db, api, web)
# ✅ All pods running
```

### Verify Kubernetes Deployment

```bash
# 1. Check cluster nodes
kubectl get nodes -o wide
# Expected:
# k3d-namelist-server-0   Ready    control-plane,master
# k3d-namelist-agent-0    Ready    <none>

# 2. Verify pod placement
kubectl get pods -n namelist -o wide
# Expected:
# db-0          1/1     Running   k3d-namelist-agent-0
# api-xxx-yyy   1/1     Running   k3d-namelist-server-0
# web-xxx-yyy   1/1     Running   k3d-namelist-server-0

# 3. Check services and ingress
kubectl get svc,ingress -n namelist

# 4. Test application
curl http://localhost/healthz
curl http://localhost/api/names

# 5. Run complete verification
./ops/k3s-verify.sh
```

### Test Kubernetes Features

**1. Test Data Persistence**

```bash
# Add test data
curl -X POST http://localhost/api/names \
  -H "Content-Type: application/json" \
  -d '{"name":"Persistence Test"}'

# Delete database pod
kubectl delete pod db-0 -n namelist

# Wait for StatefulSet to recreate pod
kubectl wait --for=condition=ready pod/db-0 -n namelist --timeout=120s

# Restart API to reconnect
kubectl rollout restart deployment/api -n namelist

# Verify data persisted
curl http://localhost/api/names | grep "Persistence Test"
# Expected: Data still there! ✅
```

**2. Test Horizontal Scaling**

```bash
# Scale API to 4 replicas
kubectl scale deployment api --replicas=4 -n namelist

# Watch pods scale up
kubectl get pods -n namelist -w

# Verify all replicas running
kubectl get deployment api -n namelist

# Scale back down
kubectl scale deployment api --replicas=2 -n namelist
```

**3. Test Service Discovery**

```bash
# Exec into API pod
kubectl exec -it deployment/api -n namelist -- sh

# Inside pod:
nslookup db-service
# Expected: Resolves to ClusterIP

ping db-service.namelist.svc.cluster.local
# Expected: Responds
```

**4. Test Rolling Updates**

```bash
# Trigger rolling update
kubectl set image deployment/api api=tzuennn/name-list-backend:latest -n namelist

# Watch rollout
kubectl rollout status deployment/api -n namelist

# Check history
kubectl rollout history deployment/api -n namelist
```

**5. Monitor Resources**

```bash
# Node resources
kubectl top nodes

# Pod resources
kubectl top pods -n namelist

# Events
kubectl get events -n namelist --sort-by='.lastTimestamp'

# Logs
kubectl logs -f deployment/api -n namelist
```

### Cleanup

```bash
# Delete application only
kubectl delete namespace namelist

# Or full cleanup (including cluster)
./ops/k3s-cleanup.sh
# Removes: pods, services, ingress, volumes, cluster
```

## Architecture Benefits of K3s Over Swarm

### Kubernetes-Native Features

- **StatefulSets**: Proper stateful application management with stable identities
- **ConfigMaps/Secrets**: First-class configuration management
- **Ingress**: Standard HTTP routing with path-based rules
- **RBAC**: Fine-grained access control (not used but available)
- **NetworkPolicy**: Pod-level network segmentation (future capability)

### Better Observability

- **Resource Metrics**: Built-in `kubectl top` for CPU/memory usage
- **Event Tracking**: Detailed event log for debugging
- **Structured Logs**: Aggregated logging across all pods
- **Health States**: Clear distinction between liveness and readiness

### Operational Excellence

- **Declarative Configuration**: All manifests in version control
- **Rolling Updates**: Zero-downtime deployments with rollback
- **Horizontal Scaling**: Native autoscaling support
- **Self-Healing**: Automatic pod restart and rescheduling
- **Resource Quotas**: Limit resource usage per namespace

### Production Readiness

- **Industry Standard**: Runs identically on AWS, GCP, Azure
- **Cloud Portability**: Same manifests work everywhere
- **Ecosystem**: Helm charts, Operators, service meshes
- **Monitoring**: Prometheus/Grafana integration
- **CI/CD Integration**: Native support in all platforms

## Migration Lessons Learned

### 1. Kubernetes Complexity is Worth It

**Challenge**: K3s has steeper learning curve than Swarm

- 7 manifest files vs 1 stack file
- More concepts: namespaces, ConfigMaps, StatefulSets, Ingress

**Benefit**: More power and flexibility

- Fine-grained resource control
- Production-grade features built-in
- Industry-standard tooling and ecosystem

### 2. StatefulSets are Game-Changers for Databases

**Before (Swarm)**: Services with volume constraints

```yaml
services:
  db:
    deploy:
      replicas: 1 # Can't scale
```

**After (K3s)**: StatefulSets with stable identities

```yaml
kind: StatefulSet
spec:
  serviceName: db-service # Stable DNS: db-0.db-service
  volumeClaimTemplates: [...] # Per-pod storage
```

**Learning**: StatefulSets enable database clustering (future work)

### 3. Node Affinity is More Expressive

**Swarm Constraints**: Boolean match

```yaml
constraints:
  - node.labels.role == db # Required only
```

**K8s Affinity**: Required and preferred rules

```yaml
requiredDuringSchedulingIgnoredDuringExecution: [...] # Hard requirement
preferredDuringSchedulingIgnoredDuringExecution: [...] # Soft preference
```

**Learning**: Can express "prefer this node, but any will do"

### 4. Ingress Simplifies Routing

**Swarm**: Nginx reverse proxy configuration

```nginx
location /api/ {
    proxy_pass http://api:8000;
}
```

**K8s**: Declarative Ingress rules

```yaml
rules:
  - http:
      paths:
        - path: /api
          backend:
            service:
              name: api-service
```

**Learning**: Ingress is cloud-portable and standard

### 5. Health Probes Prevent Traffic to Unhealthy Pods

**Key Distinction**:

- **Liveness**: Restart pod if unhealthy
- **Readiness**: Remove from load balancer if not ready

**Result**: No 500 errors during database restart (readiness probe prevents traffic)

### 6. k3d is Perfect for Local K8s Testing

**Benefits**:

- Lightweight (K3s = minimal Kubernetes)
- Fast cluster creation (~10 seconds)
- Multiple nodes in Docker containers
- Perfect for CI/CD and local development

**Comparison**: Minikube (slower), kind (similar), microk8s (Linux only)

## Conclusion

This project successfully migrated a distributed 3-tier application from Docker Swarm to Kubernetes (K3s), demonstrating production-grade container orchestration with Kubernetes-native features including StatefulSets, Deployments, Ingress, persistent volumes, and horizontal scaling across a multi-node cluster.

**Key Achievements**:

- ✅ Multi-node K3s cluster (server + agent) with k3d
- ✅ Kubernetes-native resource definitions (7 manifest files)
- ✅ StatefulSet for database with PersistentVolumeClaim
- ✅ Deployments for stateless services with multiple replicas
- ✅ Traefik Ingress for HTTP routing
- ✅ Node affinity for database isolation on agent node
- ✅ ConfigMaps and Secrets for configuration management
- ✅ Liveness and readiness probes for health monitoring
- ✅ Horizontal pod autoscaling capability
- ✅ Complete automation with K8s-specific scripts
- ✅ Data persistence across pod restarts verified
- ✅ Rolling updates and self-healing tested

**Migration Accomplishments**:

| Aspect            | HW5 Swarm               | HW6 K3s                     |
| ----------------- | ----------------------- | --------------------------- |
| **Orchestration** | Docker Swarm            | Kubernetes (K3s)            |
| **Nodes**         | Manager + Worker (DinD) | Server + Agent (k3d)        |
| **Configuration** | 1 stack.yaml            | 7 manifest files            |
| **Stateful Apps** | Service with volume     | StatefulSet + PVC           |
| **Health Checks** | Basic healthcheck       | Liveness + Readiness probes |
| **Scaling**       | `docker service scale`  | `kubectl scale`             |
| **Routing**       | Published ports         | Ingress Controller          |
| **Monitoring**    | External tools          | Built-in `kubectl top`      |

**Deliverables**:

- Production-ready K3s deployment across 2 nodes
- 7 Kubernetes manifest files (namespace, config, deployments, services, ingress)
- Complete K8s automation scripts (build, deploy, verify, cleanup)
- Comprehensive documentation (K3S_DEPLOYMENT.md, K3S_DEMO_SCRIPT.md)
- Updated README with K3s deployment option
- Migration specifications and implementation plan
- Evidence of successful deployment and testing

**Why This Matters**:

- **Industry Standard**: Kubernetes skills directly transferable to production environments
- **Cloud Ready**: Same manifests work on AWS EKS, GCP GKE, Azure AKS
- **Enterprise Grade**: Features like RBAC, NetworkPolicy, and resource quotas available
- **Career Relevant**: K8s is the #1 container orchestration platform in industry
