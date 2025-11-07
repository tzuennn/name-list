# K3s Migration Quick Reference

**Purpose**: Quick reference for common operations during and after migration

---

## Quick Start Commands

### Setup (Choose One)

**Option 1: Vagrant VM**

```bash
vagrant up k3s-server
export KUBECONFIG=$(pwd)/k3s.yaml
kubectl get nodes
```

**Option 2: k3d**

```bash
k3d cluster create namelist --port "80:80@loadbalancer"
kubectl get nodes
```

### Deploy Application

```bash
# Build images
./ops/k3s-build-images.sh

# Deploy to cluster
./ops/k3s-deploy.sh

# Verify deployment
./ops/k3s-verify.sh

# Access application
# Vagrant: http://192.168.56.10
# k3d: http://localhost
```

---

## Common kubectl Commands

### Cluster Management

```bash
# View cluster info
kubectl cluster-info

# View nodes
kubectl get nodes
kubectl get nodes -o wide

# View all resources in namespace
kubectl get all -n namelist

# View resource usage
kubectl top nodes
kubectl top pods -n namelist
```

### Pod Management

```bash
# List pods
kubectl get pods -n namelist
kubectl get pods -n namelist -o wide

# Describe pod
kubectl describe pod <pod-name> -n namelist

# View pod logs
kubectl logs <pod-name> -n namelist
kubectl logs -f <pod-name> -n namelist  # Follow logs
kubectl logs --previous <pod-name> -n namelist  # Previous container

# Exec into pod
kubectl exec -it <pod-name> -n namelist -- /bin/sh
kubectl exec <pod-name> -n namelist -- env  # View environment

# Delete pod (will be recreated)
kubectl delete pod <pod-name> -n namelist
```

### Deployment Management

```bash
# List deployments
kubectl get deployments -n namelist

# Describe deployment
kubectl describe deployment api -n namelist

# Scale deployment
kubectl scale deployment api --replicas=3 -n namelist

# Update image
kubectl set image deployment/api api=tzuennn/name-list-backend:v2 -n namelist

# Rollout status
kubectl rollout status deployment/api -n namelist

# Rollout history
kubectl rollout history deployment/api -n namelist

# Rollback deployment
kubectl rollout undo deployment/api -n namelist
kubectl rollout undo deployment/api --to-revision=2 -n namelist

# Restart deployment
kubectl rollout restart deployment/api -n namelist
```

### Service Management

```bash
# List services
kubectl get svc -n namelist

# Describe service
kubectl describe svc api -n namelist

# Get service endpoints
kubectl get endpoints -n namelist

# Test service from within cluster
kubectl run test --rm -it --image=alpine -- sh
# Inside container: wget -O- http://api.namelist.svc.cluster.local:8000/healthz
```

### Ingress Management

```bash
# List ingresses
kubectl get ingress -n namelist

# Describe ingress
kubectl describe ingress namelist-ingress -n namelist

# View ingress controller
kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik
```

### Storage Management

```bash
# List PVCs
kubectl get pvc -n namelist

# Describe PVC
kubectl describe pvc postgres-pvc -n namelist

# List PVs
kubectl get pv

# View storage classes
kubectl get storageclass
```

### ConfigMap & Secret Management

```bash
# List ConfigMaps
kubectl get configmap -n namelist

# View ConfigMap contents
kubectl describe configmap postgres-config -n namelist
kubectl get configmap init-db-script -n namelist -o yaml

# List Secrets
kubectl get secrets -n namelist

# View Secret (base64 encoded)
kubectl get secret postgres-secret -n namelist -o yaml

# Decode secret
kubectl get secret postgres-secret -n namelist -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

---

## Troubleshooting Commands

### Pod Not Starting

```bash
# Check pod status
kubectl get pods -n namelist

# Describe pod for events
kubectl describe pod <pod-name> -n namelist

# Check logs
kubectl logs <pod-name> -n namelist

# Check events
kubectl get events -n namelist --sort-by='.lastTimestamp'
```

### Service Not Accessible

```bash
# Check service
kubectl get svc -n namelist

# Check endpoints
kubectl get endpoints api -n namelist

# Check pod labels
kubectl get pods -n namelist --show-labels

# Test from within cluster
kubectl run debug --rm -it --image=alpine -- sh
# wget -O- http://api:8000/healthz
```

### Database Connection Issues

```bash
# Check database pod
kubectl get pod db-0 -n namelist

# Check database logs
kubectl logs db-0 -n namelist

# Test database connection from API pod
kubectl exec -it deployment/api -n namelist -- sh
# env | grep DB
# nc -zv db 5432
```

### Persistent Data Issues

```bash
# Check PVC
kubectl get pvc postgres-pvc -n namelist

# Check PV
kubectl get pv

# Describe PVC
kubectl describe pvc postgres-pvc -n namelist

# Check volume mount in pod
kubectl describe pod db-0 -n namelist | grep -A5 Mounts
```

---

## Maintenance Operations

### Update Application

```bash
# Build new image
docker build -t tzuennn/name-list-backend:latest ./backend

# Update deployment
kubectl rollout restart deployment/api -n namelist

# Wait for rollout
kubectl rollout status deployment/api -n namelist

# Verify
curl http://localhost/api/names
```

### Backup Database

```bash
# Backup to local file
kubectl exec db-0 -n namelist -- pg_dump -U user mydatabase > backup-$(date +%Y%m%d).sql

# Or backup to pod and copy
kubectl exec db-0 -n namelist -- pg_dump -U user mydatabase > /tmp/backup.sql
kubectl cp namelist/db-0:/tmp/backup.sql ./backup.sql
```

### Restore Database

```bash
# Restore from local file
kubectl exec -i db-0 -n namelist -- psql -U user mydatabase < backup.sql

# Or copy and restore
kubectl cp ./backup.sql namelist/db-0:/tmp/backup.sql
kubectl exec db-0 -n namelist -- psql -U user mydatabase < /tmp/backup.sql
```

### View Resource Usage

```bash
# Install metrics-server (if not installed)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# View node resources
kubectl top nodes

# View pod resources
kubectl top pods -n namelist

# Detailed resource allocation
kubectl describe nodes
```

---

## Comparison with Docker Swarm

| Task   | Docker Swarm                                  | K3s/Kubernetes                                          |
| ------ | --------------------------------------------- | ------------------------------------------------------- |
| Deploy | `docker stack deploy -c stack.yaml myapp`     | `kubectl apply -f manifests/`                           |
| List   | `docker service ls`                           | `kubectl get deployments -n namelist`                   |
| Logs   | `docker service logs mcapp_api`               | `kubectl logs deployment/api -n namelist`               |
| Scale  | `docker service scale mcapp_web=3`            | `kubectl scale deployment web --replicas=3 -n namelist` |
| Update | `docker service update --image new mcapp_api` | `kubectl set image deployment/api api=new -n namelist`  |
| Remove | `docker stack rm mcapp`                       | `kubectl delete namespace namelist`                     |
| Exec   | `docker exec $(docker ps ...) sh`             | `kubectl exec -it deployment/api -n namelist -- sh`     |

---

## Useful Aliases

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Kubectl shortcuts
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get svc'
alias kgd='kubectl get deployments'
alias kga='kubectl get all'
alias kd='kubectl describe'
alias kl='kubectl logs'
alias ke='kubectl exec -it'

# Namelist-specific
alias knl='kubectl -n namelist'
alias kgpnl='kubectl get pods -n namelist'
alias klnl='kubectl logs -n namelist'
```

Usage:

```bash
kgpnl              # kubectl get pods -n namelist
klnl api-xxx       # kubectl logs -n namelist api-xxx
ke deployment/api -n namelist -- sh
```

---

## Quick Testing

### API Endpoints

```bash
# Set base URL based on infrastructure
if [ -f "Vagrantfile" ]; then
    BASE_URL="http://192.168.56.10"
else
    BASE_URL="http://localhost"
fi

# Health check
curl $BASE_URL/healthz

# Get names
curl $BASE_URL/api/names

# Add name
curl -X POST $BASE_URL/api/names \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User"}'

# Delete name (replace ID)
curl -X DELETE $BASE_URL/api/names/1
```

### Load Testing

```bash
# Simple load test
for i in {1..100}; do
  curl -s $BASE_URL/api/names > /dev/null &
done
wait

# Check which pods handled requests
kubectl logs -n namelist -l component=api --tail=50 | grep "GET /api/names"
```

---

## Emergency Procedures

### Application Not Responding

```bash
# 1. Check pod status
kubectl get pods -n namelist

# 2. Restart deployments
kubectl rollout restart deployment/api -n namelist
kubectl rollout restart deployment/web -n namelist

# 3. Wait for rollout
kubectl rollout status deployment/api -n namelist

# 4. Check logs
kubectl logs -n namelist -l component=api --tail=100
```

### Database Issues

```bash
# 1. Check database pod
kubectl get pod db-0 -n namelist

# 2. View logs
kubectl logs db-0 -n namelist --tail=100

# 3. Restart database (StatefulSet will recreate)
kubectl delete pod db-0 -n namelist

# 4. Wait for ready
kubectl wait --for=condition=ready pod/db-0 -n namelist --timeout=120s
```

### Complete Reset

```bash
# 1. Delete all application resources
kubectl delete namespace namelist

# 2. Recreate
kubectl create namespace namelist

# 3. Redeploy
kubectl apply -k k8s/base/

# 4. Wait for ready
kubectl wait --for=condition=available --timeout=300s \
  deployment/api deployment/web -n namelist
```

---

## Monitoring Dashboard

### k9s (Recommended)

```bash
# Install
brew install k9s

# Run
k9s -n namelist

# Navigation:
# :pods     - View pods
# :svc      - View services
# :deploy   - View deployments
# :ingress  - View ingresses
# l         - View logs
# d         - Describe resource
# y         - View YAML
# q         - Quit
```

### Kubernetes Dashboard (Optional)

```bash
# Deploy dashboard
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# Create service account
kubectl create serviceaccount dashboard-admin -n kubernetes-dashboard
kubectl create clusterrolebinding dashboard-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=kubernetes-dashboard:dashboard-admin

# Get token
kubectl -n kubernetes-dashboard create token dashboard-admin

# Access dashboard
kubectl proxy
# Open: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

---

## Next Steps

1. **Familiarize**: Practice these commands in test environment
2. **Customize**: Add your own aliases and scripts
3. **Document**: Note any project-specific variations
4. **Automate**: Create scripts for common workflows

---

**Reference Links**:

- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [K3s Documentation](https://docs.k3s.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
