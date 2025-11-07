# Detailed K3s Migration Plan

**Branch**: `k3s-refactor` | **Date**: 2025-11-07 | **Status**: PLANNING

## Phase-by-Phase Implementation Guide

This document provides detailed implementation steps for migrating from Docker Swarm to K3s.

---

## Phase 1: Environment Setup

### 1.1 Multi-Node Vagrant Setup

**Why Multi-Node**: True distributed deployment with dedicated database node, realistic production topology

**Requirements**:

- VirtualBox or VMware installed
- Vagrant installed (`brew install vagrant`)
- 4GB+ RAM available (2GB per VM)
- 40GB+ disk space

**Implementation**:

```ruby
# Vagrantfile for Multi-Node K3s Cluster
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"

  # K3s Server Node (Control Plane + Worker)
  config.vm.define "k3s-server" do |server|
    server.vm.hostname = "k3s-server"
    server.vm.network "private_network", ip: "192.168.56.10"

    server.vm.provider "virtualbox" do |vb|
      vb.memory = "2048"
      vb.cpus = 2
      vb.name = "k3s-server"
    end

    server.vm.provision "shell", inline: <<-SHELL
      # Update system
      apt-get update

      # Install K3s server
      curl -sfL https://get.k3s.io | sh -s - \
        --node-ip=192.168.56.10 \
        --flannel-iface=enp0s8 \
        --write-kubeconfig-mode=644

      # Wait for K3s to be ready
      until kubectl get nodes; do sleep 5; done

      # Save node token for agent
      sudo cat /var/lib/rancher/k3s/server/node-token > /vagrant/node-token

      # Copy kubeconfig for external access
      sudo cp /etc/rancher/k3s/k3s.yaml /vagrant/k3s.yaml
      sudo chmod 644 /vagrant/k3s.yaml

      # Update kubeconfig server address
      sudo sed -i 's/127.0.0.1/192.168.56.10/g' /vagrant/k3s.yaml

      echo "✅ K3s Server Node Ready"
      kubectl get nodes
    SHELL
  end

  # K3s Agent Node (Worker Only - for Database)
  config.vm.define "k3s-agent" do |agent|
    agent.vm.hostname = "k3s-agent"
    agent.vm.network "private_network", ip: "192.168.56.11"

    agent.vm.provider "virtualbox" do |vb|
      vb.memory = "2048"
      vb.cpus = 2
      vb.name = "k3s-agent"
    end

    agent.vm.provision "shell", inline: <<-SHELL
      # Wait for server to be ready and token to be available
      until [ -f /vagrant/node-token ]; do
        echo "Waiting for server node token..."
        sleep 5
      done

      # Get join token and URL from server
      K3S_TOKEN=$(cat /vagrant/node-token)
      K3S_URL="https://192.168.56.10:6443"

      # Install K3s agent
      curl -sfL https://get.k3s.io | K3S_URL=$K3S_URL K3S_TOKEN=$K3S_TOKEN sh -s - \
        --node-ip=192.168.56.11 \
        --flannel-iface=enp0s8

      echo "✅ K3s Agent Node Ready"
    SHELL
  end
end
```

**Setup Steps**:

```bash
# 1. Create Vagrantfile
cat > Vagrantfile << 'EOF'
# ... content above ...
EOF

# 2. Start both nodes (server first, then agent)
vagrant up k3s-server
vagrant up k3s-agent

# 3. Configure kubectl locally
export KUBECONFIG=$(pwd)/k3s.yaml
kubectl get nodes

# Expected output:
# NAME          STATUS   ROLES                  AGE   VERSION
# k3s-server    Ready    control-plane,master   2m    v1.28.x+k3s1
# k3s-agent     Ready    <none>                 1m    v1.28.x+k3s1

# 4. Label agent node for database placement
kubectl label node k3s-agent node-role=database

# 5. Verify labels
kubectl get nodes --show-labels
```

### 1.2 Verify Multi-Node Cluster Installation

```bash
# Check both nodes are ready
kubectl get nodes
# Expected output:
# NAME          STATUS   ROLES                  AGE   VERSION
# k3s-server    Ready    control-plane,master   5m    v1.28.x+k3s1
# k3s-agent     Ready    <none>                 3m    v1.28.x+k3s1

# Check nodes with details
kubectl get nodes -o wide
# Should show both nodes with their IPs (192.168.56.10 and 192.168.56.11)

# Verify node labels
kubectl get nodes --show-labels
# k3s-agent should have: node-role=database

# Check system pods on both nodes
kubectl get pods -n kube-system -o wide
# Should see pods distributed across both nodes

# Check Traefik ingress controller
kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik
# Expected: traefik pod Running on k3s-server

# Check CoreDNS
kubectl get pods -n kube-system -l k8s-app=kube-dns
# Expected: coredns pods Running

# Check storage class
kubectl get storageclass
# Expected: local-path (default)

# Test inter-node connectivity
kubectl run test-pod --image=busybox --rm -it --restart=Never -- ping -c 3 192.168.56.11
# Should successfully ping agent node from server
```

### 1.3 Install Supporting Tools

```bash
# kubectl (if not installed with K3s/k3d)
brew install kubectl

# Verify version compatibility
kubectl version --short

# (Optional) Install k9s for cluster visualization
brew install k9s

# (Optional) Install helm for package management
brew install helm
```

### 1.4 Prepare Local Environment

```bash
# Create directory structure
mkdir -p k8s/{base,overlays/{dev,prod}}
mkdir -p ops/k3s

# Set up namespace
kubectl create namespace namelist

# Create secrets (if needed)
kubectl create secret generic postgres-secret \
  --from-literal=username=user \
  --from-literal=password=password \
  --namespace=namelist

# Verify namespace
kubectl get namespace namelist
```

---

## Phase 2: Manifest Creation

### 2.1 Docker Swarm to Kubernetes Mapping

| Swarm Concept         | Kubernetes Equivalent     | Notes                                       |
| --------------------- | ------------------------- | ------------------------------------------- |
| Service               | Deployment + Service      | Deployment for pods, Service for networking |
| Stack                 | Namespace + Manifests     | Group resources in namespace                |
| Replicas              | Deployment.spec.replicas  | Same concept                                |
| Placement Constraints | NodeSelector / Affinity   | More flexible in K8s                        |
| Configs               | ConfigMap                 | Similar concept                             |
| Secrets               | Secret                    | Same concept                                |
| Volumes               | PersistentVolume + PVC    | More explicit in K8s                        |
| Networks (overlay)    | Service (ClusterIP)       | Automatic via DNS                           |
| Ingress               | Ingress                   | Built-in Traefik in K3s                     |
| Healthcheck           | Liveness/Readiness Probes | More sophisticated                          |

### 2.2 Create Namespace and Common Resources

**k8s/base/00-namespace.yaml**:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: namelist
  labels:
    app: namelist
    environment: production
```

**k8s/base/01-configmap.yaml**:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: namelist
data:
  POSTGRES_DB: mydatabase
  POSTGRES_USER: user
  DB_HOST: db
  DB_PORT: "5432"
  DB_NAME: mydatabase
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: init-db-script
  namespace: namelist
data:
  init.sql: |
    CREATE TABLE IF NOT EXISTS names (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
```

**k8s/base/02-secrets.yaml**:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: namelist
type: Opaque
stringData:
  POSTGRES_PASSWORD: password
  DB_PASSWORD: password
```

### 2.3 Create Database StatefulSet

**k8s/base/10-database.yaml**:

```yaml
---
# PersistentVolumeClaim for database
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: namelist
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 1Gi

---
# StatefulSet for PostgreSQL
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: db
  namespace: namelist
  labels:
    app: namelist
    component: database
spec:
  serviceName: db
  replicas: 1
  selector:
    matchLabels:
      app: namelist
      component: database
  template:
    metadata:
      labels:
        app: namelist
        component: database
    spec:
      # Node affinity to ensure DB runs on agent node only
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: node-role
                    operator: In
                    values:
                      - database

      containers:
        - name: postgres
          image: postgres:14-alpine
          ports:
            - containerPort: 5432
              name: postgres

          env:
            - name: POSTGRES_DB
              valueFrom:
                configMapKeyRef:
                  name: postgres-config
                  key: POSTGRES_DB
            - name: POSTGRES_USER
              valueFrom:
                configMapKeyRef:
                  name: postgres-config
                  key: POSTGRES_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD

          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
              subPath: postgres
            - name: init-script
              mountPath: /docker-entrypoint-initdb.d
              readOnly: true

          livenessProbe:
            exec:
              command:
                - /bin/sh
                - -c
                - pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3

          readinessProbe:
            exec:
              command:
                - /bin/sh
                - -c
                - pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3

          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"

      volumes:
        - name: postgres-storage
          persistentVolumeClaim:
            claimName: postgres-pvc
        - name: init-script
          configMap:
            name: init-db-script

---
# Service for database
apiVersion: v1
kind: Service
metadata:
  name: db
  namespace: namelist
  labels:
    app: namelist
    component: database
spec:
  type: ClusterIP
  clusterIP: None # Headless service for StatefulSet
  ports:
    - port: 5432
      targetPort: 5432
      name: postgres
  selector:
    app: namelist
    component: database
```

### 2.4 Create API Deployment

**k8s/base/20-api.yaml**:

```yaml
---
# Deployment for API
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: namelist
  labels:
    app: namelist
    component: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: namelist
      component: api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: namelist
        component: api
    spec:
      # Node affinity to ensure web/api run on server node
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: node-role.kubernetes.io/control-plane
                    operator: Exists

      containers:
        - name: api
          image: tzuennn/name-list-backend:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8000
              name: http

          env:
            - name: DB_HOST
              valueFrom:
                configMapKeyRef:
                  name: postgres-config
                  key: DB_HOST
            - name: DB_PORT
              valueFrom:
                configMapKeyRef:
                  name: postgres-config
                  key: DB_PORT
            - name: DB_NAME
              valueFrom:
                configMapKeyRef:
                  name: postgres-config
                  key: DB_NAME
            - name: DB_USER
              valueFrom:
                configMapKeyRef:
                  name: postgres-config
                  key: POSTGRES_USER
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: DB_PASSWORD

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

          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"

---
# Service for API
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: namelist
  labels:
    app: namelist
    component: api
spec:
  type: ClusterIP
  ports:
    - port: 8000
      targetPort: 8000
      name: http
  selector:
    app: namelist
    component: api
---
# Alternative Service with different name for compatibility
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: namelist
  labels:
    app: namelist
    component: api
spec:
  type: ClusterIP
  ports:
    - port: 8000
      targetPort: 8000
      name: http
  selector:
    app: namelist
    component: api
```

### 2.5 Create Web Deployment

**k8s/base/30-web.yaml**:

```yaml
---
# Deployment for Web
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: namelist
  labels:
    app: namelist
    component: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: namelist
      component: web
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: namelist
        component: web
    spec:
      containers:
        - name: web
          image: tzuennn/name-list-frontend:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 80
              name: http

          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3

          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3

          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "200m"

---
# Service for Web
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: namelist
  labels:
    app: namelist
    component: web
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 80
      name: http
  selector:
    app: namelist
    component: web
```

### 2.6 Create Ingress

**k8s/base/40-ingress.yaml**:

```yaml
---
# Ingress for external access
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: namelist-ingress
  namespace: namelist
  labels:
    app: namelist
  annotations:
    # Traefik-specific annotations
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  rules:
    - http:
        paths:
          # API routes
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 8000
          # Health check
          - path: /healthz
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 8000
          # Frontend (catch-all)
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 80
```

### 2.7 Create Kustomization File

**k8s/base/kustomization.yaml**:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: namelist

resources:
  - 00-namespace.yaml
  - 01-configmap.yaml
  - 02-secrets.yaml
  - 10-database.yaml
  - 20-api.yaml
  - 30-web.yaml
  - 40-ingress.yaml

commonLabels:
  app: namelist
  managed-by: kubectl
```

---

## Phase 3: Deployment Scripts

### 3.1 Build Images Script

**ops/k3s-build-images.sh**:

```bash
#!/bin/bash
set -e

echo "=== Building Docker Images for K3s ==="

# Determine if using Vagrant or k3d
if [ -f "Vagrantfile" ] && vagrant status | grep -q "k3s-server.*running"; then
    echo "Using Vagrant VM..."
    BUILD_CMD="vagrant ssh k3s-server -c"
    # Copy project to VM if needed
    echo "Syncing project files..."
    vagrant rsync k3s-server
elif command -v k3d &> /dev/null && k3d cluster list | grep -q "namelist"; then
    echo "Using k3d cluster..."
    BUILD_CMD="docker exec k3d-namelist-server-0"
else
    echo "Using local Docker..."
    BUILD_CMD="docker"
fi

# Build backend image
echo "Building backend image..."
docker build -t tzuennn/name-list-backend:latest ./backend

# Build frontend image
echo "Building frontend image..."
docker build -t tzuennn/name-list-frontend:latest ./frontend

echo "✅ Images built successfully"
docker images | grep name-list
```

### 3.2 Deploy Script

**ops/k3s-deploy.sh**:

```bash
#!/bin/bash
set -e

echo "=== Deploying to K3s Cluster ==="

# Check kubectl connectivity
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to K3s cluster"
    echo "Set KUBECONFIG or run: export KUBECONFIG=\$(pwd)/k3s.yaml"
    exit 1
fi

# Apply manifests
echo "Applying Kubernetes manifests..."
kubectl apply -k k8s/base/

# Wait for deployments
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s \
    deployment/api deployment/web -n namelist

# Wait for StatefulSet
kubectl wait --for=condition=ready --timeout=300s \
    pod/db-0 -n namelist

echo "✅ Deployment complete"
echo ""
echo "Access the application:"
if [ -f "Vagrantfile" ]; then
    echo "  http://192.168.56.10"
else
    echo "  http://localhost"
fi
```

### 3.3 Verify Script

**ops/k3s-verify.sh**:

```bash
#!/bin/bash
set -e

echo "=== Verifying K3s Deployment ==="

# Check cluster
echo "--- Cluster Info ---"
kubectl cluster-info
echo ""

# Check nodes
echo "--- Nodes ---"
kubectl get nodes -o wide
echo ""

# Check namespace
echo "--- Namespace ---"
kubectl get namespace namelist
echo ""

# Check all resources
echo "--- All Resources ---"
kubectl get all -n namelist
echo ""

# Check pods status
echo "--- Pod Status ---"
kubectl get pods -n namelist -o wide
echo ""

# Check services
echo "--- Services ---"
kubectl get svc -n namelist
echo ""

# Check ingress
echo "--- Ingress ---"
kubectl get ingress -n namelist
echo ""

# Check PVC
echo "--- Persistent Volumes ---"
kubectl get pvc -n namelist
echo ""

# Test connectivity
echo "--- Connectivity Tests ---"
echo "Testing API health..."
if [ -f "Vagrantfile" ]; then
    API_URL="http://192.168.56.10/healthz"
else
    API_URL="http://localhost/healthz"
fi

if curl -sf $API_URL; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
fi

echo ""
echo "Testing API names endpoint..."
if [ -f "Vagrantfile" ]; then
    NAMES_URL="http://192.168.56.10/api/names"
else
    NAMES_URL="http://localhost/api/names"
fi

if curl -sf $NAMES_URL; then
    echo "✅ API names endpoint accessible"
else
    echo "❌ API names endpoint failed"
fi

echo ""
echo "=== Verification Complete ==="
```

### 3.4 Cleanup Script

**ops/k3s-cleanup.sh**:

```bash
#!/bin/bash
set -e

echo "=== Cleaning up K3s Deployment ==="

# Delete application resources
echo "Deleting application resources..."
kubectl delete -k k8s/base/ --ignore-not-found=true

# Wait for cleanup
echo "Waiting for resources to be deleted..."
sleep 10

# Optional: Delete namespace (will delete everything inside)
read -p "Delete namespace 'namelist'? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kubectl delete namespace namelist --ignore-not-found=true
fi

# Optional: Destroy cluster
read -p "Destroy K3s cluster? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "Vagrantfile" ]; then
        echo "Destroying Vagrant VM..."
        vagrant destroy -f
        rm -f k3s.yaml node-token
    elif command -v k3d &> /dev/null; then
        echo "Destroying k3d cluster..."
        k3d cluster delete namelist
    fi
fi

echo "✅ Cleanup complete"
```

### 3.5 Complete Setup Script

**ops/k3s-complete-setup.sh**:

```bash
#!/bin/bash
set -e

echo "=== Complete K3s Setup ==="

# Build images
echo "Step 1/3: Building images..."
./ops/k3s-build-images.sh

# Deploy application
echo "Step 2/3: Deploying application..."
./ops/k3s-deploy.sh

# Verify deployment
echo "Step 3/3: Verifying deployment..."
sleep 10
./ops/k3s-verify.sh

echo ""
echo "=== Setup Complete ==="
echo "Access the application at:"
if [ -f "Vagrantfile" ]; then
    echo "  http://192.168.56.10"
else
    echo "  http://localhost"
fi
```

---

## Phase 4: Testing & Validation

### 4.1 Functional Testing Checklist

- [ ] Add name via UI - name appears
- [ ] Remove name via UI - name disappears
- [ ] Refresh page - data persists
- [ ] Sort by A-Z - correct order
- [ ] Sort by Z-A - correct order
- [ ] Sort by newest - correct order
- [ ] Sort by oldest - correct order
- [ ] Pagination works correctly

### 4.2 API Testing

```bash
# Health check
curl http://localhost/healthz

# Get names
curl http://localhost/api/names

# Add name
curl -X POST http://localhost/api/names \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User"}'

# Delete name (get ID from GET first)
curl -X DELETE http://localhost/api/names/1
```

### 4.3 Persistence Testing

```bash
# Add test data
curl -X POST http://localhost/api/names \
  -H "Content-Type: application/json" \
  -d '{"name":"Persistence Test"}'

# Verify data exists
curl http://localhost/api/names

# Delete pod
kubectl delete pod db-0 -n namelist

# Wait for pod to restart
kubectl wait --for=condition=ready pod/db-0 -n namelist

# Verify data still exists
curl http://localhost/api/names
```

### 4.4 Scaling Testing

```bash
# Scale API to 3 replicas
kubectl scale deployment api --replicas=3 -n namelist

# Verify scaling
kubectl get pods -n namelist -l component=api

# Test load distribution (check logs)
for i in {1..10}; do
  curl http://localhost/api/names
done

# Check which pods handled requests
kubectl logs -n namelist -l component=api --tail=20
```

---

## Phase 5: Documentation

### 5.1 Update README.md

Add K3s deployment section:

````markdown
### Option 3: Kubernetes Deployment (K3s)

**For production-like Kubernetes deployment:**

#### Quick Start with Vagrant

1. **Start K3s cluster**
   ```bash
   vagrant up k3s-server
   export KUBECONFIG=$(pwd)/k3s.yaml
   ```
````

2. **Deploy application**

   ```bash
   ./ops/k3s-complete-setup.sh
   ```

3. **Access application**
   - URL: http://192.168.56.10
   - API: http://192.168.56.10/api/names

#### Quick Start with k3d

1. **Create cluster**

   ```bash
   k3d cluster create namelist \
     --port "80:80@loadbalancer"
   ```

2. **Deploy application**

   ```bash
   ./ops/k3s-complete-setup.sh
   ```

3. **Access application**
   - URL: http://localhost
   - API: http://localhost/api/names

````

### 5.2 Create K3s Guide

**docs/K3S_DEPLOYMENT.md**: Complete deployment guide

### 5.3 Create Troubleshooting Guide

**docs/K3S_TROUBLESHOOTING.md**: Common issues and solutions

### 5.4 Update Specifications

- Update `20-target-spec.md` with K3s architecture
- Update `30-plan.md` with K3s implementation details
- Create evidence document with kubectl outputs

---

## Success Validation

### Deployment Success Criteria

```bash
# All checks should pass:
kubectl get nodes                              # All nodes Ready
kubectl get pods -n namelist                   # All pods Running
kubectl get ingress -n namelist                # Ingress configured
curl http://localhost/healthz                  # Returns {"status":"ok"}
curl http://localhost/api/names                # Returns JSON array
````

### Performance Benchmarks

Compare with Swarm baseline:

- Response time for /api/names < 100ms
- Pod startup time < 60s
- Memory usage per pod within limits

---

## Rollback Plan

If issues arise:

1. **Keep Swarm deployment intact** (don't delete until K3s proven)
2. **K3s issues**: Run `./ops/k3s-cleanup.sh`
3. **Return to Swarm**: Run `./ops/complete-setup.sh` (original)
4. **Document issues** for future reference

---

## Next Steps After Review

Once this plan is approved:

1. Begin Phase 1: Environment Setup
2. Create and test manifests incrementally
3. Validate each component before moving to next
4. Document any deviations from plan
5. Gather evidence for final submission

---

**Ready for Review**: Please assess this plan and provide feedback before implementation begins.
