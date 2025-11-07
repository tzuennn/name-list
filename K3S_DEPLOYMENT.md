# K3s Deployment Guide

**Date**: 2025-11-07  
**Status**: ✅ OPERATIONAL  
**Cluster**: k3d multi-node (1 server + 1 agent)

---

## 🎯 Quick Start

```bash
# 1. Build and import images
./ops/k3s-build-images.sh

# 2. Deploy application
./ops/k3s-deploy.sh

# 3. Verify deployment
./ops/k3s-verify.sh

# 4. Access application
open http://localhost
```

---

## 📊 Cluster Overview

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  k3d Load Balancer                   │
│                 (ports 80, 8080)                     │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│ k3d-server-0   │         │ k3d-agent-0     │
│ (control-plane)│         │ (worker)        │
├────────────────┤         ├─────────────────┤
│ • API (x2)     │         │ • Database (x1) │
│ • Web (x2)     │         │ • PostgreSQL    │
│ • Traefik      │         │ • PVC (1Gi)     │
└────────────────┘         └─────────────────┘
```

### Node Labels

- **server-0**: `control-plane`, `master` (runs API + Web)
- **agent-0**: `node-role=database` (runs PostgreSQL only)

---

## 📁 Project Structure

```
k8s/
├── 00-namespace.yaml      # namelist namespace
├── 01-configmap.yaml      # DB connection config
├── 02-secrets.yaml        # DB credentials
├── 10-database.yaml       # PostgreSQL StatefulSet + PVC
├── 20-api.yaml            # Backend Deployment + Service
├── 30-web.yaml            # Frontend Deployment + Service
└── 40-ingress.yaml        # Traefik routing rules

ops/
├── k3s-build-images.sh    # Build & import Docker images
├── k3s-deploy.sh          # Deploy to K3s
├── k3s-verify.sh          # Verify deployment
└── k3s-cleanup.sh         # Clean up resources
```

---

## 🚀 Deployment Details

### Services

| Component | Type        | Port | Replicas | Node Affinity        |
| --------- | ----------- | ---- | -------- | -------------------- |
| Database  | StatefulSet | 5432 | 1        | agent-0 (required)   |
| API       | Deployment  | 8000 | 2        | server-0 (preferred) |
| Web       | Deployment  | 80   | 2        | server-0 (preferred) |

### Routing (Traefik Ingress)

- `http://localhost/` → Web frontend
- `http://localhost/api/*` → API backend
- `http://localhost/healthz` → API health check

### Storage

- **PersistentVolumeClaim**: `db-data` (1Gi, local-path storage class)
- **Mount Path**: `/var/lib/postgresql/data`
- **Persistence**: ✅ Data survives pod restarts

---

## 🔍 Common Commands

### Cluster Management

```bash
# List clusters
k3d cluster list

# Start/stop cluster
k3d cluster start namelist
k3d cluster stop namelist

# Delete cluster
k3d cluster delete namelist
```

### Application Management

```bash
# Check pod status
kubectl get pods -n namelist -o wide

# View logs
kubectl logs -f deployment/api -n namelist
kubectl logs -f deployment/web -n namelist
kubectl logs db-0 -n namelist

# Restart deployments
kubectl rollout restart deployment/api -n namelist
kubectl rollout restart deployment/web -n namelist

# Scale API
kubectl scale deployment api --replicas=3 -n namelist

# Delete database pod (test persistence)
kubectl delete pod db-0 -n namelist
```

### Debugging

```bash
# Describe pod
kubectl describe pod <pod-name> -n namelist

# Get events
kubectl get events -n namelist --sort-by='.lastTimestamp'

# Shell into container
kubectl exec -it deployment/api -n namelist -- sh
kubectl exec -it db-0 -n namelist -- psql -U myuser -d names_db

# Port forward (for direct access)
kubectl port-forward deployment/api 8000:8000 -n namelist
kubectl port-forward db-0 5432:5432 -n namelist
```

---

## 🧪 Testing

### Functional Tests

```bash
# Health check
curl http://localhost/healthz

# List names
curl http://localhost/api/names

# Add name
curl -X POST http://localhost/api/names \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User"}'

# Delete name
curl -X DELETE http://localhost/api/names/1
```

### Persistence Test

```bash
# 1. Add test data
curl -X POST http://localhost/api/names \
  -H "Content-Type: application/json" \
  -d '{"name":"Persistence Test"}'

# 2. Delete database pod
kubectl delete pod db-0 -n namelist

# 3. Wait for restart
kubectl wait --for=condition=ready pod/db-0 -n namelist

# 4. Restart API (reconnect to DB)
kubectl rollout restart deployment/api -n namelist

# 5. Verify data persists
curl http://localhost/api/names | grep "Persistence Test"
```

### Load Test

```bash
# Send multiple requests
for i in {1..100}; do
  curl -s http://localhost/api/names > /dev/null
  echo "Request $i completed"
done
```

---

## 📈 Monitoring

### Resource Usage

```bash
# Node resources
kubectl top nodes

# Pod resources
kubectl top pods -n namelist

# Resource quotas
kubectl describe resourcequota -n namelist
```

### Health Checks

All pods have liveness and readiness probes configured:

- **Database**: `pg_isready` every 10s
- **API**: `GET /healthz` every 10s
- **Web**: `GET /` every 10s

---

## 🔧 Configuration

### Environment Variables (ConfigMap)

```yaml
POSTGRES_DB: names_db
POSTGRES_USER: myuser
DB_HOST: db-service
DB_PORT: 5432
```

### Secrets

```yaml
POSTGRES_PASSWORD: mypassword
DB_PASSWORD: mypassword
```

To update secrets:

```bash
# Edit secret
kubectl edit secret db-secret -n namelist

# Restart pods to pick up changes
kubectl rollout restart deployment/api -n namelist
kubectl delete pod db-0 -n namelist
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] All pods running: `kubectl get pods -n namelist`
- [ ] Database on agent node: `kubectl get pod db-0 -n namelist -o wide`
- [ ] API/Web on server node: `kubectl get pods -n namelist -o wide | grep api`
- [ ] Health check passes: `curl http://localhost/healthz`
- [ ] Can list names: `curl http://localhost/api/names`
- [ ] Can add name: `curl -X POST ... -d '{"name":"Test"}'`
- [ ] Can delete name: `curl -X DELETE http://localhost/api/names/1`
- [ ] Web accessible: `curl http://localhost`
- [ ] Data persists: Delete db-0 pod and verify data remains

---

## 🚨 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n namelist

# Check events
kubectl get events -n namelist --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name> -n namelist
```

### Image Pull Errors

```bash
# Verify images imported
kubectl describe pod <pod-name> -n namelist | grep Image

# Re-import images
k3d image import tzuennn/name-list-backend:latest -c namelist
k3d image import tzuennn/name-list-frontend:latest -c namelist
```

### Database Connection Issues

```bash
# Verify database is ready
kubectl get pod db-0 -n namelist

# Check database logs
kubectl logs db-0 -n namelist

# Test connection from API pod
kubectl exec -it deployment/api -n namelist -- sh
apk add postgresql-client
psql -h db-service -U myuser -d names_db
```

### Ingress Not Working

```bash
# Check ingress
kubectl get ingress -n namelist
kubectl describe ingress namelist-ingress -n namelist

# Check Traefik logs
kubectl logs -n kube-system -l app.kubernetes.io/name=traefik

# Verify service endpoints
kubectl get endpoints -n namelist
```

---

## 📝 Migration Summary

### From Docker Swarm to K3s

| Aspect                | Docker Swarm DinD    | K3s (k3d)             |
| --------------------- | -------------------- | --------------------- |
| **Infrastructure**    | 2 Docker containers  | 2 Docker containers   |
| **Manager/Server**    | swarm-manager        | k3d-namelist-server-0 |
| **Worker/Agent**      | swarm-worker         | k3d-namelist-agent-0  |
| **Orchestration**     | Docker Swarm         | Kubernetes (K3s)      |
| **Service Discovery** | overlay network      | kube-dns              |
| **Load Balancing**    | ingress routing mesh | Traefik ingress       |
| **Storage**           | named volumes        | PersistentVolumeClaim |
| **Deployment Tool**   | docker stack deploy  | kubectl apply         |
| **Port Mapping**      | 80:80, 8080:8080     | 80:80, 8080:8080      |

### Key Improvements

✅ **Production-grade orchestration** - K3s provides full Kubernetes features  
✅ **Better health monitoring** - Liveness and readiness probes  
✅ **Declarative configuration** - All resources in YAML manifests  
✅ **Easier scaling** - `kubectl scale` command  
✅ **Standard tooling** - kubectl, Helm compatibility  
✅ **Pod affinity/anti-affinity** - Fine-grained placement control

---

## 🎓 Learning Resources

### K3s Documentation

- [K3s Official Docs](https://docs.k3s.io/)
- [k3d Documentation](https://k3d.io/)

### Kubernetes Basics

- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/)

### Related Files

- `specs/k3s-migration/K3D-IMPLEMENTATION-PLAN.md` - Full implementation plan
- `specs/k3s-migration/00-k3s-migration-overview.md` - Migration overview

---

## 📞 Support

For issues or questions:

1. Check logs: `kubectl logs <pod-name> -n namelist`
2. Check events: `kubectl get events -n namelist`
3. Verify pod placement: `kubectl get pods -n namelist -o wide`
4. Test endpoints manually: `curl http://localhost/...`

---

**Last Updated**: 2025-11-07  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
