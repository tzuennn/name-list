# K3s Migration Implementation Plan (k3d)

**Date**: 2025-11-07 | **Approach**: k3d multi-node cluster  
**Status**: READY TO IMPLEMENT

---

## Quick Summary

Migrating from **Docker Swarm (DinD)** to **K3s (k3d)** - both use Docker containers for infrastructure, but K3s provides production-grade Kubernetes orchestration.

---

## Phase 1: Environment Setup ✅ COMPLETE

### Cluster Creation

```bash
# Create multi-node K3s cluster
k3d cluster create namelist \
  --servers 1 \
  --agents 1 \
  --port "80:80@loadbalancer" \
  --port "8080:8080@loadbalancer"
```

### Verification

```bash
# Check nodes
kubectl get nodes
# Expected: 2 nodes (server + agent)

# Label agent for database
kubectl label node k3d-namelist-agent-0 node-role=database

# Verify
kubectl get nodes --show-labels
```

**Result**: ✅ Multi-node cluster running

---

## Phase 2: Create Kubernetes Manifests

### Directory Structure

```
k8s/
├── 00-namespace.yaml          # Namespace definition
├── 01-configmap.yaml          # Configuration data  
├── 02-secrets.yaml            # Sensitive data
├── 10-database.yaml           # StatefulSet + PVC + Service
├── 20-api.yaml                # Deployment + Service
├── 30-web.yaml                # Deployment + Service
└── 40-ingress.yaml            # Ingress for external access
```

### Key Manifest Details

**Database** (10-database.yaml):
- StatefulSet with 1 replica
- PersistentVolumeClaim for data
- Node affinity to run on agent node only
- Health probes for readiness/liveness

**API** (20-api.yaml):
- Deployment with 2 replicas
- Env vars from ConfigMap/Secret
- Health probes
- Node affinity to run on server node

**Web** (30-web.yaml):
- Deployment with 2 replicas  
- Nginx configuration
- Health probes
- Node affinity to run on server node

**Ingress** (40-ingress.yaml):
- Routes /api → api service
- Routes /healthz → api service
- Routes / → web service
- Uses Traefik (built into K3s)

---

## Phase 3: Deployment Scripts

### Build Images Script

**ops/k3s-build-images.sh**:
```bash
#!/bin/bash
set -e

echo "=== Building Images ==="

# Build backend
docker build -t tzuennn/name-list-backend:latest ./backend

# Build frontend
docker build -t tzuennn/name-list-frontend:latest ./frontend

# Import into k3d cluster
k3d image import tzuennn/name-list-backend:latest -c namelist
k3d image import tzuennn/name-list-frontend:latest -c namelist

echo "✅ Images built and imported"
```

### Deploy Script

**ops/k3s-deploy.sh**:
```bash
#!/bin/bash
set -e

echo "=== Deploying to K3s ==="

# Create namespace
kubectl apply -f k8s/00-namespace.yaml

# Apply all manifests
kubectl apply -f k8s/

# Wait for deployments
kubectl wait --for=condition=available --timeout=300s \
  deployment/api deployment/web -n namelist

# Wait for StatefulSet
kubectl wait --for=condition=ready --timeout=300s \
  pod/db-0 -n namelist

echo "✅ Deployment complete"
echo "Access: http://localhost"
```

### Verify Script

**ops/k3s-verify.sh**:
```bash
#!/bin/bash
set -e

echo "=== Verification ==="

# Check cluster
kubectl get nodes

# Check pods
kubectl get pods -n namelist -o wide

# Check services
kubectl get svc -n namelist

# Check ingress
kubectl get ingress -n namelist

# Test endpoints
curl -f http://localhost/healthz && echo "✅ API health OK"
curl -f http://localhost/api/names && echo "✅ API names OK"

echo "✅ All checks passed"
```

### Cleanup Script

**ops/k3s-cleanup.sh**:
```bash
#!/bin/bash
set -e

echo "=== Cleanup ==="

# Delete application
kubectl delete -f k8s/ --ignore-not-found=true

# Optional: Delete cluster
read -p "Delete k3d cluster? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    k3d cluster delete namelist
    echo "✅ Cluster deleted"
fi
```

---

## Phase 4: Testing & Validation

### Functional Tests

```bash
# Add name
curl -X POST http://localhost/api/names \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User"}'

# Get names
curl http://localhost/api/names

# Delete name
curl -X DELETE http://localhost/api/names/1
```

### Persistence Test

```bash
# Add data
curl -X POST http://localhost/api/names \
  -H "Content-Type: application/json" \
  -d '{"name":"Persistence Test"}'

# Delete database pod
kubectl delete pod db-0 -n namelist

# Wait for restart
kubectl wait --for=condition=ready pod/db-0 -n namelist

# Verify data persists
curl http://localhost/api/names | grep "Persistence Test"
```

### Scaling Test

```bash
# Scale API
kubectl scale deployment api --replicas=3 -n namelist

# Verify
kubectl get pods -n namelist -l component=api

# Test load distribution
for i in {1..10}; do curl http://localhost/api/names; done
```

### Node Placement Verification

```bash
# Check where pods are running
kubectl get pods -n namelist -o wide

# Expected:
# - db-0 on k3d-namelist-agent-0
# - api-* on k3d-namelist-server-0
# - web-* on k3d-namelist-server-0
```

---

## Phase 5: Documentation

### Updates Needed

1. **README.md** - Add K3s deployment section
2. **EVIDENCE.md** - kubectl outputs and screenshots
3. **K3S_DEPLOYMENT.md** - Complete deployment guide
4. **K3S_TROUBLESHOOTING.md** - Common issues

### Evidence to Collect

```bash
# Cluster topology
kubectl get nodes -o wide

# Pod placement
kubectl get pods -n namelist -o wide

# Services
kubectl get svc -n namelist

# Ingress
kubectl get ingress -n namelist

# Resource usage
kubectl top nodes
kubectl top pods -n namelist

# Application test
curl http://localhost/api/names
```

---

## Success Criteria

- [ ] Multi-node cluster operational (server + agent)
- [ ] All pods running and healthy
- [ ] Database on agent node, web/api on server node
- [ ] Application accessible at http://localhost
- [ ] Data persists across pod restarts
- [ ] All original features working
- [ ] kubectl commands documented
- [ ] Evidence package complete

---

## Quick Command Reference

```bash
# Cluster management
k3d cluster list
k3d cluster start namelist
k3d cluster stop namelist
k3d cluster delete namelist

# kubectl basics
kubectl get nodes
kubectl get pods -n namelist
kubectl get svc -n namelist
kubectl logs -f deployment/api -n namelist
kubectl exec -it deployment/api -n namelist -- sh

# Debugging
kubectl describe pod <pod-name> -n namelist
kubectl get events -n namelist --sort-by='.lastTimestamp'
kubectl logs --previous <pod-name> -n namelist
```

---

## Next Steps

1. ✅ Phase 1 complete - Cluster created
2. ⏭️ Phase 2 - Create Kubernetes manifests
3. ⏭️ Phase 3 - Write deployment scripts
4. ⏭️ Phase 4 - Test and validate
5. ⏭️ Phase 5 - Document and create evidence

**Ready to proceed with Phase 2!**
