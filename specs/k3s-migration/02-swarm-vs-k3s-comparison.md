# Docker Swarm vs K3s: Comparison and Migration Guide

**Date**: 2025-11-07 | **Purpose**: Technical Comparison for Migration Decision

## Overview

This document provides a detailed comparison between the current Docker Swarm implementation and the target K3s deployment, helping assess the migration benefits and challenges.

---

## Architecture Comparison

### Docker Swarm (Current)

```
┌─────────────────────────────────────────────────┐
│ Docker Host                                     │
│  ┌──────────────────────────────────────────┐  │
│  │ swarm-manager (DinD)                     │  │
│  │ • Stack: mcapp                           │  │
│  │ • Services: web (2), api (1)            │  │
│  │ • Network: overlay (appnet)             │  │
│  │ • Port: 80:80, 8080:8080                │  │
│  └──────────────────────────────────────────┘  │
│          ↓ (swarm-sim-net bridge)              │
│  ┌──────────────────────────────────────────┐  │
│  │ swarm-worker (DinD)                      │  │
│  │ • Services: db (1)                       │  │
│  │ • Volume: db-data                        │  │
│  │ • Label: role=db                         │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Key Components:**

- Orchestration: Docker Swarm
- Networking: Overlay network
- Storage: Named Docker volume
- Load Balancing: Swarm ingress
- Service Discovery: DNS

### K3s (Target)

```
┌─────────────────────────────────────────────────┐
│ K3s Cluster                                     │
│  ┌──────────────────────────────────────────┐  │
│  │ k3s-server (VM or Container)             │  │
│  │ • Control Plane + Worker                 │  │
│  │ • Pods: web, api, db                     │  │
│  │ • Ingress: Traefik (built-in)           │  │
│  │ • Storage: local-path-provisioner        │  │
│  │ • DNS: CoreDNS                           │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Optional Multi-Node:                          │
│  ┌──────────────────────────────────────────┐  │
│  │ k3s-agent (Worker)                       │  │
│  │ • Pods: db (StatefulSet)                 │  │
│  │ • PVC: postgres-pvc                      │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Key Components:**

- Orchestration: Kubernetes (K3s)
- Networking: Service mesh ready
- Storage: PV/PVC with storage classes
- Load Balancing: Traefik ingress
- Service Discovery: CoreDNS

---

## Feature Comparison

### Orchestration

| Feature                | Docker Swarm       | K3s                               |
| ---------------------- | ------------------ | --------------------------------- |
| **Deployment Model**   | Stack (YAML)       | Manifests (YAML)                  |
| **Service Definition** | Service + Replicas | Deployment + ReplicaSet           |
| **Updates**            | Rolling by default | RollingUpdate strategy            |
| **Rollback**           | Manual             | Built-in (`kubectl rollout undo`) |
| **Config Management**  | Configs/Secrets    | ConfigMaps/Secrets                |
| **Job Scheduling**     | Not supported      | Jobs, CronJobs                    |
| **Auto-scaling**       | Manual only        | HPA, VPA supported                |

**Winner**: K3s - More sophisticated orchestration

### Networking

| Feature               | Docker Swarm      | K3s                               |
| --------------------- | ----------------- | --------------------------------- |
| **Service Discovery** | DNS               | CoreDNS                           |
| **Load Balancing**    | Ingress mesh      | Traefik (built-in)                |
| **Network Policies**  | Limited           | Full NetworkPolicy support        |
| **Service Types**     | Replicated/Global | ClusterIP, NodePort, LoadBalancer |
| **Ingress**           | Third-party       | Built-in Traefik                  |
| **Service Mesh**      | Manual setup      | Easy integration (Linkerd, Istio) |

**Winner**: K3s - More flexible networking

### Storage

| Feature                  | Docker Swarm  | K3s                          |
| ------------------------ | ------------- | ---------------------------- |
| **Persistence**          | Named volumes | PV/PVC with storage classes  |
| **Dynamic Provisioning** | No            | Yes (local-path-provisioner) |
| **Storage Classes**      | No            | Yes                          |
| **Volume Snapshots**     | No            | Yes (via CSI)                |
| **Multi-attach**         | No            | ReadWriteMany supported      |

**Winner**: K3s - More sophisticated storage

### Health & Monitoring

| Feature            | Docker Swarm       | K3s                       |
| ------------------ | ------------------ | ------------------------- |
| **Health Checks**  | Simple healthcheck | Liveness/Readiness probes |
| **Startup Probes** | start_period only  | Dedicated startup probe   |
| **Metrics**        | Manual setup       | Metrics server included   |
| **Monitoring**     | External tools     | Prometheus-ready          |
| **Logging**        | Docker logs        | FluentBit integration     |

**Winner**: K3s - Better observability

### Scaling & Availability

| Feature                | Docker Swarm                    | K3s                        |
| ---------------------- | ------------------------------- | -------------------------- |
| **Horizontal Scaling** | Manual (`docker service scale`) | Manual + HPA               |
| **Vertical Scaling**   | Manual                          | VPA available              |
| **Self-healing**       | Yes (restarts)                  | Yes (more sophisticated)   |
| **Pod Disruption**     | No                              | PodDisruptionBudget        |
| **Resource Limits**    | Basic                           | Detailed (requests/limits) |

**Winner**: K3s - More scaling options

---

## Concept Mapping

### Service Translation

**Docker Swarm Service → Kubernetes Resources:**

```yaml
# Swarm: services.web
services:
  web:
    image: frontend:latest
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.role == manager
    ports:
      - "80:80"
    networks:
      - appnet
```

**Becomes:**

```yaml
# K8s: Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    spec:
      nodeSelector:
        node-role.kubernetes.io/control-plane: ""
      containers:
        - name: web
          image: frontend:latest
          ports:
            - containerPort: 80

---
# K8s: Service
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80

---
# K8s: Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
spec:
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 80
```

### Placement Constraints

**Swarm:**

```yaml
deploy:
  placement:
    constraints:
      - node.labels.role == db
```

**K8s:**

```yaml
spec:
  nodeSelector:
    role: db
  # Or more advanced:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: role
                operator: In
                values:
                  - db
```

### Health Checks

**Swarm:**

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/healthz"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

**K8s:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 30
  timeoutSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /healthz
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Configs & Secrets

**Swarm:**

```yaml
configs:
  db_init:
    file: /app/db/init.sql

services:
  db:
    configs:
      - source: db_init
        target: /docker-entrypoint-initdb.d/init.sql
```

**K8s:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: init-db-script
data:
  init.sql: |
    CREATE TABLE...

---
# In pod:
volumes:
  - name: init-script
    configMap:
      name: init-db-script
volumeMounts:
  - name: init-script
    mountPath: /docker-entrypoint-initdb.d
```

---

## Command Comparison

| Operation           | Docker Swarm                                       | K3s/Kubernetes                                 |
| ------------------- | -------------------------------------------------- | ---------------------------------------------- |
| **Deploy**          | `docker stack deploy -c stack.yaml myapp`          | `kubectl apply -f manifests/`                  |
| **List Services**   | `docker service ls`                                | `kubectl get deployments`                      |
| **List Containers** | `docker service ps myapp_web`                      | `kubectl get pods`                             |
| **Scale**           | `docker service scale myapp_web=3`                 | `kubectl scale deployment web --replicas=3`    |
| **Logs**            | `docker service logs myapp_web`                    | `kubectl logs deployment/web`                  |
| **Update**          | `docker service update --image new:tag myapp_web`  | `kubectl set image deployment/web web=new:tag` |
| **Rollback**        | `docker service rollback myapp_web`                | `kubectl rollout undo deployment/web`          |
| **Remove**          | `docker stack rm myapp`                            | `kubectl delete -f manifests/`                 |
| **Inspect**         | `docker service inspect myapp_web`                 | `kubectl describe deployment web`              |
| **Exec**            | `docker exec $(docker ps -q -f name=myapp_web) sh` | `kubectl exec -it deployment/web -- sh`        |

---

## Migration Impact Analysis

### Application Code Changes

**Required**: ✅ **NONE**

- Same Docker images work in both
- Environment variables remain the same
- Service discovery DNS names preserved (create alias services)

### Configuration Changes

**Required**: ✅ **YES** (Format only, not values)

- Convert stack.yaml to K8s manifests
- Split into multiple resource files
- Add Service and Ingress resources
- Convert Configs to ConfigMaps

### Operational Changes

**Required**: ✅ **YES**

| Task         | Swarm Command           | K8s Command       |
| ------------ | ----------------------- | ----------------- |
| Check status | `docker service ls`     | `kubectl get all` |
| View logs    | `docker service logs`   | `kubectl logs`    |
| Scale        | `docker service scale`  | `kubectl scale`   |
| Update       | `docker service update` | `kubectl rollout` |

**Learning Curve**: Medium (kubectl syntax, YAML structure)

### Storage Migration

**Required**: ✅ **YES** (Different mechanism)

- **Swarm**: Named volumes (`db-data`)
- **K8s**: PVC + PV (`postgres-pvc` → local-path)

**Data Migration**: Export/import SQL dump

```bash
# Export from Swarm
docker exec mcapp_db.1.xxx pg_dump -U user mydatabase > backup.sql

# Import to K8s
kubectl exec -i db-0 -n namelist -- psql -U user mydatabase < backup.sql
```

### Network Migration

**Required**: ✅ **MINOR**

- **Swarm**: Overlay network with service names
- **K8s**: Service ClusterIP with DNS

**Changes**: Mostly transparent, DNS names work the same

---

## Benefits of Migration

### Immediate Benefits

1. **Industry Standard**: Kubernetes skills more marketable
2. **Better Tooling**: kubectl, helm, k9s, kustomize
3. **Richer Ecosystem**: Operators, CRDs, extensions
4. **Built-in Ingress**: Traefik included in K3s
5. **Better Monitoring**: Metrics server, Prometheus ready

### Long-term Benefits

1. **Scalability**: HPA, VPA for auto-scaling
2. **Advanced Deployments**: Canary, blue-green strategies
3. **Service Mesh**: Easy Istio/Linkerd integration
4. **GitOps**: ArgoCD, Flux for CD
5. **Multi-cluster**: Federation capabilities

### Educational Benefits

1. Learn industry-standard orchestration
2. Understand Kubernetes concepts
3. Practice cloud-native patterns
4. Prepare for certifications (CKA, CKAD)

---

## Challenges & Mitigation

### Challenge 1: Increased Complexity

**Issue**: More resources (Deployment, Service, Ingress vs just Service)

**Mitigation**:

- Use Kustomize for organization
- Template with Helm if needed
- Comprehensive documentation

### Challenge 2: Learning Curve

**Issue**: kubectl vs docker commands, K8s concepts

**Mitigation**:

- Command comparison cheat sheet (above)
- Step-by-step scripts
- Extensive comments in manifests

### Challenge 3: Resource Overhead

**Issue**: K3s uses more memory than Swarm

**Mitigation**:

- K3s is already optimized (~500MB vs 2GB+ full K8s)
- Resource limits in manifests
- Single-node deployment option

### Challenge 4: Storage Differences

**Issue**: Different persistence mechanisms

**Mitigation**:

- Use local-path-provisioner (simple)
- Document backup/restore
- Test persistence thoroughly

---

## Migration Checklist

### Pre-Migration

- [ ] Review this comparison document
- [ ] Assess team Kubernetes knowledge
- [ ] Verify infrastructure resources (2GB+ RAM)
- [ ] Backup current Swarm data
- [ ] Test K3s installation

### During Migration

- [ ] Keep Swarm deployment running
- [ ] Create K8s manifests incrementally
- [ ] Test each component separately
- [ ] Migrate data from Swarm to K8s
- [ ] Verify all functionality

### Post-Migration

- [ ] Update all documentation
- [ ] Train team on kubectl commands
- [ ] Document troubleshooting steps
- [ ] Gather performance metrics
- [ ] Create evidence package

---

## Recommendation

### For This Project

✅ **Recommended**: Migrate to K3s

**Reasons**:

1. **Learning**: Valuable Kubernetes experience
2. **Industry Alignment**: More relevant than Swarm
3. **Future-proof**: Better long-term support
4. **Features**: Access to K8s ecosystem
5. **Complexity**: K3s reduces overhead vs full K8s

### When to Stay with Swarm

Consider staying if:

- Very short timeline (<1 week)
- Team has no K8s experience and no time to learn
- Project is simple and won't evolve
- Resource constraints (<1GB RAM)

### Hybrid Approach

Could maintain both:

- **Development**: Docker Compose (fastest)
- **Testing**: K3s (production-like)
- **Documentation**: Both deployment options

This provides flexibility and learning opportunities.

---

## Conclusion

K3s provides significant advantages over Docker Swarm for this project:

- More industry-relevant skills
- Richer ecosystem and tooling
- Better long-term scalability
- Similar operational complexity with proper documentation

The migration is feasible with moderate effort (10-15 hours) and the benefits outweigh the costs for educational and practical purposes.

---

**Next Steps**: Review migration plan in `01-k3s-migration-plan.md`
