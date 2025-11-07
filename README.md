# Names List - 3-Tier Web Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, accessible 3-tier web application for managing a persistent list of names. Built with Flask (Python), PostgreSQL, and vanilla JavaScript with a focus on accessibility, performance, and maintainability.

**Supports three deployment modes:**

- 🐳 **Single-host development** (Docker Compose)
- 🔄 **Distributed production** (Docker Swarm with multi-node deployment)
- ☸️ **Kubernetes orchestration** (K3s with multi-node cluster)

## ✨ Features

- **📝 Name Management**: Add and remove names with real-time updates
- **💾 Persistence**: All data persists across browser sessions
- **🔄 Flexible Sorting**: Sort by name (A→Z, Z→A) or by date added (newest/oldest first)
- **🎨 Modular Architecture**: Clean separation of concerns with modular JavaScript
- **🧪 Comprehensive Testing**: Unit and integration tests.
- **🐳 Containerized**: Easy deployment with Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Option 1: Single-Host Development (Docker Compose)

**For local development and testing:**

1. **Clone the repository**

   ```bash
   git clone https://github.com/tzuennn/name-list.git
   cd name-list
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**

   ```bash
   docker-compose up -d
   ```

4. **Access the application**

   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8080/api
   - Health check: http://localhost:8080/api/health

5. **Stop the application**
   ```bash
   docker-compose down
   ```

### Option 2: Distributed Deployment (Docker Swarm)

**For production-like multi-node deployment:**

1. **Start the Docker Swarm cluster**

   ```bash
   # Initialize DinD infrastructure and Swarm cluster
   ./ops/complete-setup.sh
   ```

   This single command will:

   - Create manager and worker containers (Docker-in-Docker)
   - Initialize Docker Swarm cluster
   - Build application images
   - Deploy the stack

2. **⏱️ Wait for services to be ready (Important!)**

   After deployment, **wait 30-60 seconds** for all services to initialize:

   ```bash
   # Option A: Use the automated wait script
   ./ops/wait-for-api.sh

   # Option B: Manual wait
   sleep 30
   ```

   **Why the wait?**

   - PostgreSQL needs 5-10 seconds to initialize
   - Docker Swarm overlay network DNS takes 5-10 seconds to propagate
   - API needs to establish database connection pool
   - First requests may fail with 500 errors until everything is ready
   - This is **expected behavior**

   > 💡 **Tip**: Always use `./ops/wait-for-api.sh` after:
   >
   > - Initial deployment (`./ops/complete-setup.sh`)
   > - Database restarts (`docker service update --force mcapp_db`)
   > - Stack redeployment

3. **Access the application**

   - Frontend: http://localhost
   - Backend API: http://localhost:8080
   - Health check: http://localhost/healthz

4. **Verify deployment**

   ```bash
   ./ops/verify.sh
   ```

5. **Shutdown options**

   **Option A: Stop and keep data (recommended for demos)**

   ```bash
   ./ops/stop.sh  # Stops containers but preserves database

   # To restart later with same data:
   ./ops/start.sh
   docker exec swarm-manager docker stack deploy -c /app/swarm/stack.yaml mcapp
   ```

   **Option B: Full cleanup (deletes everything including data)**

   ```bash
   ./ops/cleanup.sh  # ⚠️ Deletes all volumes and data
   ```

**Manual deployment steps** (if you prefer step-by-step):

```bash
# 1. Start DinD infrastructure and initialize Swarm
./ops/init-swarm.sh

# 2. Build images inside manager container
./ops/build-images.sh

# 3. Deploy the stack
./ops/deploy.sh

# 4. Verify deployment
./ops/verify.sh
```

For detailed Swarm deployment documentation, see [swarm/README.md](swarm/README.md).

### Option 3: Kubernetes Deployment (K3s)

**For production-grade Kubernetes orchestration:**

K3s provides a lightweight, certified Kubernetes distribution with full Kubernetes API compatibility. This deployment uses k3d to run K3s in Docker containers for easy local development and testing.

1. **Prerequisites**

   ```bash
   # Install k3d (if not already installed)
   brew install k3d  # macOS
   # Or: curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

   # Verify installation
   k3d version
   kubectl version --client
   ```

2. **Create K3s multi-node cluster**

   ```bash
   # Create cluster with 1 server + 1 agent node
   k3d cluster create namelist \
     --servers 1 \
     --agents 1 \
     --port "80:80@loadbalancer" \
     --port "8080:8080@loadbalancer"

   # Verify cluster
   kubectl get nodes

   # Label agent node for database placement
   kubectl label node k3d-namelist-agent-0 node-role=database
   ```

3. **Build and deploy application**

   ```bash
   # Build images and import into k3d cluster
   ./ops/k3s-build-images.sh

   # Deploy to Kubernetes
   ./ops/k3s-deploy.sh

   # Verify deployment
   ./ops/k3s-verify.sh
   ```

4. **Access the application**

   - Frontend: http://localhost
   - Backend API: http://localhost/api/names
   - Health check: http://localhost/healthz

5. **Monitor and manage**

   ```bash
   # Check pod status
   kubectl get pods -n namelist -o wide

   # View logs
   kubectl logs -f deployment/api -n namelist
   kubectl logs -f deployment/web -n namelist

   # Scale services
   kubectl scale deployment api --replicas=3 -n namelist

   # Check resource usage
   kubectl top nodes
   kubectl top pods -n namelist
   ```

6. **Cleanup options**

   **Option A: Stop cluster (keep for later)**

   ```bash
   k3d cluster stop namelist

   # Restart later
   k3d cluster start namelist
   ```

   **Option B: Full cleanup (deletes everything)**

   ```bash
   ./ops/k3s-cleanup.sh
   ```

**K3s Architecture:**

```
┌────────────────────────────────────────────────────┐
│ k3d Load Balancer (localhost:80, :8080)           │
└──────────────┬─────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│ Server Node │  │ Agent Node  │
│ (Control +  │  │ (Worker)    │
│  Worker)    │  │             │
├─────────────┤  ├─────────────┤
│ • API (x2)  │  │ • Database  │
│ • Web (x2)  │  │   (x1)      │
│ • Traefik   │  │ • PVC (1Gi) │
└─────────────┘  └─────────────┘
```

**K3s Key Features:**

- ✅ **Multi-node cluster**: Dedicated server and agent nodes
- ✅ **Node affinity**: Database isolated on agent node
- ✅ **Persistent storage**: Data survives pod restarts
- ✅ **Horizontal scaling**: Easy replica management
- ✅ **Health monitoring**: Liveness and readiness probes
- ✅ **Service discovery**: Built-in DNS and service mesh
- ✅ **Ingress routing**: Traefik for HTTP routing
- ✅ **Self-healing**: Automatic pod recreation

For complete K3s deployment documentation, see [K3S_DEPLOYMENT.md](K3S_DEPLOYMENT.md).

## 🏗️ Architecture

### Deployment Architecture

This project supports **three deployment modes**:

#### 1. Single-Host Development (docker-compose.yml)

```
┌─────────────────────────────────────────────────────────┐
│ Docker Host (Your Machine)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Frontend   │  │   Backend   │  │  Database   │   │
│  │  (Nginx)    │◄─┤   (Flask)   │◄─┤ (PostgreSQL)│   │
│  │  :8080      │  │   :8000     │  │   :5432     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│         Bridge Network (appnet)                        │
└─────────────────────────────────────────────────────────┘
```

#### 2. Distributed Production (Docker Swarm)

This project uses **Docker-in-Docker (DinD)** to simulate a multi-node Docker Swarm cluster. While physical lab infrastructure is ideal, DinD provides equivalent functionality for demonstrating distributed deployment concepts when physical infrastructure is unavailable.

```
┌──────────────────────────────────────────────────────────┐
│ Host (macOS Docker Desktop)                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ MANAGER CONTAINER (docker:24-dind)              │   │
│  │ • Swarm Manager Role                            │   │
│  │ • Services: web (Nginx x2), api (Flask x1)     │   │
│  │ • Ports: 80:80, 8080:8080 → host               │   │
│  │ • Overlay Network: appnet                       │   │
│  └─────────────────────────────────────────────────┘   │
│               ↕ (Bridge: swarm-sim-net)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ WORKER CONTAINER (docker:24-dind)               │   │
│  │ • Swarm Worker Role (labeled: role=db)          │   │
│  │ • Services: db (PostgreSQL x1)                  │   │
│  │ • Storage: db-data volume (persistent)          │   │
│  │ • Overlay Network: appnet                       │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Why Docker-in-Docker?**

- ✅ No physical lab node available
- ✅ Provides true Swarm multi-node behavior
- ✅ Commonly used in CI/CD and Docker development
- ✅ All distributed deployment requirements satisfied
- ✅ Overlay networking with service discovery
- ✅ Placement constraints and node labels
- ✅ Persistent storage across service updates

**Key Features of Swarm Deployment:**

- **Service Discovery**: API reaches database via DNS name (`db`)
- **Placement Constraints**: DB runs only on worker, web/api only on manager
- **Load Balancing**: 2 web replicas handle traffic automatically
- **Health Monitoring**: All services have healthchecks with 30s start period
- **Data Persistence**: Named volume survives container recreation

#### 3. Kubernetes Production (K3s with k3d)

```
┌──────────────────────────────────────────────────────┐
│ Host (macOS Docker Desktop)                          │
│  ┌────────────────────────────────────────────┐     │
│  │ k3d-namelist-server-0                      │     │
│  │ • K3s Control Plane + Worker               │     │
│  │ • Pods: api (x2), web (x2)                 │     │
│  │ • Traefik Ingress Controller               │     │
│  │ • Ports: 80:80, 8080:8080 → host          │     │
│  └────────────────────────────────────────────┘     │
│               ↕ (k3d-namelist network)               │
│  ┌────────────────────────────────────────────┐     │
│  │ k3d-namelist-agent-0                       │     │
│  │ • K3s Worker Node                          │     │
│  │ • Pods: db (x1)                            │     │
│  │ • PersistentVolume: db-data (1Gi)          │     │
│  │ • Node Label: node-role=database           │     │
│  └────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

**Key Features of K3s Deployment:**

- **Node Affinity**: Database guaranteed on agent node via node selector
- **StatefulSet**: PostgreSQL with persistent volume claims
- **Deployments**: Stateless API and web services with multiple replicas
- **Ingress**: Traefik routes `/api/*` to API, `/` to web
- **Health Probes**: Liveness and readiness checks on all pods
- **Service Discovery**: kube-dns for internal service resolution
- **Horizontal Scaling**: `kubectl scale` for dynamic replica adjustment
- **Self-Healing**: Automatic pod restart on failure

### Component Architecture

#### Frontend (Modular JavaScript)

- **State Management**: Centralized application state with event-driven updates
- **API Layer**: HTTP client with error handling and retry logic
- **UI Service**: DOM manipulation and rendering
- **Sorting Service**: Pure functions for data sorting

#### Backend (Flask)

- **RESTful API**: Clean HTTP endpoints for name operations
- **Database Layer**: PostgreSQL with connection pooling
- **Error Handling**: Comprehensive validation and error responses
- **Health Monitoring**: Built-in health check endpoints

#### Database (PostgreSQL)

- **Simple Schema**: Optimized for fast reads and writes
- **ACID Compliance**: Reliable data persistence
- **Connection Pooling**: Efficient resource management

## 📁 Project Structure

```
├── frontend/                    # Frontend application
│   ├── html/                   # Static web files
│   │   ├── js/                # JavaScript modules
│   │   ├── app.js             # Main application entry
│   │   └── index.html         # HTML structure
│   ├── tests/                 # Frontend tests
│   │   ├── unit/              # Unit tests
│   │   ├── integration/       # Integration tests
│   │   └── a11y/              # Accessibility tests
│   ├── nginx.conf             # Nginx configuration
│   └── Dockerfile
├── backend/                     # Backend API
│   ├── app.py                # Flask application
│   ├── tests/                # Backend tests
│   │   ├── unit/             # Unit tests
│   │   ├── integration/      # Integration tests
│   │   └── contract/         # API contract tests
│   ├── requirements.txt      # Python dependencies
│   ├── pytest.ini           # Test configuration
│   └── Dockerfile
├── db/
│   └── init.sql              # Database schema
├── k8s/                        # Kubernetes manifests
│   ├── 00-namespace.yaml     # Namespace definition
│   ├── 01-configmap.yaml     # Configuration data
│   ├── 02-secrets.yaml       # Sensitive data
│   ├── 10-database.yaml      # PostgreSQL StatefulSet
│   ├── 20-api.yaml           # API Deployment
│   ├── 30-web.yaml           # Web Deployment
│   └── 40-ingress.yaml       # Ingress routing
├── swarm/                      # Docker Swarm deployment
│   ├── stack.yaml            # Swarm stack definition
│   └── README.md             # Swarm deployment guide
├── ops/                        # Operations automation scripts
│   ├── init-swarm.sh         # Initialize DinD Swarm cluster
│   ├── build-images.sh       # Build images inside manager
│   ├── deploy.sh             # Deploy stack
│   ├── verify.sh             # Verify deployment
│   ├── cleanup.sh            # Tear down infrastructure
│   ├── complete-setup.sh     # One-command deployment
│   ├── k3s-build-images.sh   # Build and import K3s images
│   ├── k3s-deploy.sh         # Deploy to K3s
│   ├── k3s-verify.sh         # Verify K3s deployment
│   └── k3s-cleanup.sh        # Clean up K3s resources
├── docs/
│   └── EVIDENCE.md           # Deployment verification evidence
├── specs/                      # Project specifications
│   ├── 10-current-state-spec.md
│   ├── 20-target-spec.md
│   ├── 30-plan.md
│   ├── 40-tasks.md
│   ├── 50-traceability.md
│   └── k3s-migration/        # K3s migration specs
│       ├── 00-k3s-migration-overview.md
│       ├── K3D-IMPLEMENTATION-PLAN.md
│       └── README.md
├── ai-log/                     # Development logs
│   └── hw3-development-report.md
├── docker-compose.yml          # Single-host development
├── docker-compose.dind.yml     # DinD infrastructure
├── K3S_DEPLOYMENT.md           # K3s deployment guide
├── K3S_DEMO_SCRIPT.md          # K3s demo script
└── README.md                   # This file
```

**📊 Architecture Benefits:**

- **Clear separation**: Each tier has its own directory and concerns
- **Container-ready**: Each service has its own Dockerfile
- **Multi-deployment**: Supports single-host (Compose), distributed (Swarm), and Kubernetes (K3s)
- **Test organization**: Tests are co-located with their respective services
- **Automation**: Complete ops scripts for zero-touch deployment
- **Documentation**: Comprehensive specs and documentation
- **K8s-native**: Full Kubernetes manifests with best practices

**🎬 Quick Demo Workflows:**

**Docker Swarm:**

```bash
# Complete setup (first time)
./ops/complete-setup.sh

# ⏱️ Wait for services to be ready (important!)
./ops/wait-for-api.sh

# Add some data via browser at http://localhost

# Stop without losing data
./ops/stop.sh

# Resume with same data
./ops/start.sh
docker exec swarm-manager docker stack deploy -c /app/swarm/stack.yaml mcapp
./ops/wait-for-api.sh  # Wait again after redeployment

# Full cleanup when done
./ops/cleanup.sh
```

**K3s (Kubernetes):**

```bash
# Create cluster
k3d cluster create namelist --servers 1 --agents 1 \
  --port "80:80@loadbalancer" --port "8080:8080@loadbalancer"

# Label agent node
kubectl label node k3d-namelist-agent-0 node-role=database

# Build and deploy
./ops/k3s-build-images.sh
./ops/k3s-deploy.sh

# Access at http://localhost

# Scale services
kubectl scale deployment api --replicas=3 -n namelist

# Cleanup
./ops/k3s-cleanup.sh
```

> 💡 **Pro tip**: Always run `./ops/wait-for-api.sh` after deployment or restarts to ensure the API is ready before making requests. This avoids 500 errors during the DNS propagation period.

## 🛠️ Development

### Prerequisites for Development

- Docker and Docker Compose
- Git
- (Optional) Python 3.12+ and Node.js 18+ for native development

### Local Development Setup

**🐳 Single-Host Docker Development (Recommended)**

1. **Start development environment**

   ```bash
   # Build and start all services in development mode
   docker-compose up --build

   # Or run in background
   docker-compose up --build -d
   ```

2. **Access the application**

   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8080/api
   - Database: Available on port 5433 (mapped to 5432 internally)

3. **Make changes and auto-reload**

   - Frontend changes: Refresh browser (served by Nginx)
   - Backend changes: Container auto-reloads with volume mounts

4. **Running tests in containers**

   ```bash
   # Backend tests
   docker-compose exec backend python -m pytest tests/ -v

   # Frontend tests
   docker-compose exec frontend node /app/tests/unit/run_sorting_tests.js
   ```

**🔄 Swarm Development (Testing distributed deployment)**

For testing the distributed deployment locally:

```bash
# Complete setup (one command)
./ops/complete-setup.sh

# Or step-by-step
./ops/init-swarm.sh    # Initialize cluster
./ops/build-images.sh  # Build images
./ops/deploy.sh        # Deploy stack

# Make changes to code, then rebuild and update
docker exec swarm-manager docker build -t tzuennn/name-list-backend:latest /app/backend
docker exec swarm-manager docker service update --force mcapp_api

# Check logs
docker exec swarm-manager docker service logs mcapp_api
docker exec swarm-manager docker service logs mcapp_web
docker exec swarm-manager docker service logs mcapp_db
```

**☸️ K3s Development (Testing Kubernetes deployment)**

For testing Kubernetes orchestration locally:

```bash
# Create cluster
k3d cluster create namelist --servers 1 --agents 1 \
  --port "80:80@loadbalancer" --port "8080:8080@loadbalancer"

# Label agent node
kubectl label node k3d-namelist-agent-0 node-role=database

# Build and deploy
./ops/k3s-build-images.sh
./ops/k3s-deploy.sh

# Make changes to code, then rebuild and update
docker build -t tzuennn/name-list-backend:latest ./backend
k3d image import tzuennn/name-list-backend:latest -c namelist
kubectl rollout restart deployment/api -n namelist

# Check logs
kubectl logs -f deployment/api -n namelist
kubectl logs -f deployment/web -n namelist
kubectl logs db-0 -n namelist

# Scale services
kubectl scale deployment api --replicas=3 -n namelist

# Check status
kubectl get pods -n namelist -o wide
```

**💻 Native Development (Alternative)**

If you prefer to run services natively:

1. **Start only the database**

   ```bash
   docker-compose up -d db
   ```

2. **Backend Development**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

3. **Frontend Development**
   ```bash
   cd frontend/html
   python -m http.server 8080
   ```

### Code Quality

This project uses several tools to maintain code quality:

- **Python**: Black (formatting), Ruff (linting), pytest (testing)
- **JavaScript**: ESLint-compatible patterns, manual testing
- **Git**: Pre-commit hooks and conventional commits

```bash
# Format Python code
black backend/

# Lint Python code
ruff check backend/

# Run all tests
pytest backend/tests/
```

## 📖 API Documentation

### Endpoints

| Method | Endpoint          | Description          | Request Body        | Response                                                             |
| ------ | ----------------- | -------------------- | ------------------- | -------------------------------------------------------------------- |
| GET    | `/healthz`        | Simple health check  | -                   | `{"status": "ok"}`                                                   |
| GET    | `/api/health`     | Health check with DB | -                   | `{"status": "ok", "db": true}`                                       |
| GET    | `/api/names`      | List all names       | -                   | `[{"id": 1, "name": "Alice", "created_at": "2025-01-01T12:00:00Z"}]` |
| POST   | `/api/names`      | Add a new name       | `{"name": "Alice"}` | `{"message": "Created"}`                                             |
| DELETE | `/api/names/<id>` | Delete a name        | -                   | `{"message": "Deleted"}`                                             |

**Note**: The `/healthz` endpoint is used for container healthchecks and doesn't depend on database connectivity.

### Error Responses

```json
{
  "error": "Name cannot be empty",
  "code": "VALIDATION_ERROR"
}
```

## 🧪 Testing

### Test Types

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: End-to-end workflow testing
- **Contract Tests**: API interface validation

### Running Tests

**🐳 With Docker (Recommended)**

First, rebuild containers to include test dependencies:

```bash
# Rebuild containers with test dependencies
docker-compose build

# Start services
docker-compose up -d
```

Then run tests:

````bash
Then run tests:
```bash
# Backend tests with coverage
docker-compose exec backend python -m pytest tests/ -v --cov=app --cov-report=term-missing

# Frontend unit tests (comprehensive)
docker-compose exec frontend node tests/unit/test_runner.js

# Frontend unit tests (simple/quick)
docker-compose exec frontend node tests/unit/run_sorting_tests.js

# Frontend integration tests (work best from host due to API connectivity)
cd frontend/tests/integration
node test_runner.js


**📊 Expected Results:**

- Backend: 18/18 tests passed, ~98% coverage ✅
- Frontend Unit: 17/17 tests passed ✅
- Frontend Integration: 18/18 tests passed ✅

**📋 Test Summary:**

- **Backend**: Comprehensive API testing with 98% code coverage
- **Frontend Unit**: Pure function testing for sorting algorithms
- **Frontend Integration**: End-to-end workflow testing with real API
- **Accessibility**: Manual validation against WCAG 2.1 AA standards


## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## � Deployment Details

### Single-Host (Docker Compose)
- **Use case**: Local development, testing
- **Services**: All run on one host with bridge networking
- **Ports**: Frontend on 8080, Database on 5433
- **Storage**: Local Docker volume

### Distributed (Docker Swarm)
- **Use case**: Production-like multi-node deployment
- **Infrastructure**: Docker-in-Docker simulation
- **Services**:
  - Manager node: web (2 replicas), api (1 replica)
  - Worker node: db (1 replica)
- **Networking**: Overlay network with service discovery
- **Storage**: Named volume on worker node
- **Ports**: Frontend on 80, API on 8080
- **Health Monitoring**: All services with healthchecks

For complete Swarm deployment documentation, see:
- [swarm/README.md](swarm/README.md) - Deployment guide
- [docs/EVIDENCE.md](docs/EVIDENCE.md) - Verification evidence
- [specs/20-target-spec.md](specs/20-target-spec.md) - Architecture specification

## 🔧 Troubleshooting

### Common Issues Across All Deployments

#### Port Already in Use

```bash
# Check what's using port 80 or 8080
lsof -i :80
lsof -i :8080

# Kill the process or stop conflicting service
```

### Docker Compose Issues

#### Container Not Starting

```bash
# Check logs
docker-compose logs [service-name]

# Rebuild containers
docker-compose up --build
```

### Docker Swarm Issues

### "500 Internal Server Error" on First Request

**Symptom**: `curl http://localhost/api/names` returns 500 error immediately after deployment or database restart.

**Cause**: This is **expected behavior** due to distributed system startup timing:
1. **PostgreSQL initialization**: Database takes 5-10 seconds to be ready
2. **DNS propagation**: Docker Swarm overlay network DNS needs 5-10 seconds to propagate service names
3. **Connection pool**: Flask backend creates connection pool lazily on first request

**Solution**:
```bash
# Wait for API to be ready
./ops/wait-for-api.sh

# Or manually retry after 30 seconds
sleep 30
curl http://localhost/api/names
```

**Why we designed it this way**:
- **Lazy connection pooling** prevents startup failures if DB isn't ready yet
- **30-second healthcheck grace period** allows services time to stabilize
- **Distributed systems trade-off**: Eventual consistency over immediate availability
- **Real-world scenario**: Production systems also need warm-up time after deployment

### When to Use wait-for-api.sh

Always run `./ops/wait-for-api.sh` after:
- ✅ Initial deployment: `./ops/complete-setup.sh`
- ✅ Database restart: `docker service update --force mcapp_db`
- ✅ Stack redeployment: `docker stack deploy ...`
- ✅ Service scaling: `docker service scale mcapp_api=2`

### Database Data Not Persisting

**Symptom**: Added names disappear after restart

**Cause**: Used `./ops/cleanup.sh` which deletes volumes with `-v` flag

**Solution**:
- Use `./ops/stop.sh` to stop without losing data
- Use `./ops/cleanup.sh` only for fresh start (deletes everything)

### Swarm Services Not Starting

```bash
# Check service status
docker exec swarm-manager docker service ls

# Check service logs
docker exec swarm-manager docker service logs mcapp_api
docker exec swarm-manager docker service logs mcapp_db

# Check if nodes are healthy
docker exec swarm-manager docker node ls

# Restart services
docker exec swarm-manager docker service update --force mcapp_api
```

### K3s Issues

#### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n namelist

# Describe pod to see events
kubectl describe pod <pod-name> -n namelist

# Check logs
kubectl logs <pod-name> -n namelist

# Check recent events
kubectl get events -n namelist --sort-by='.lastTimestamp'
```

#### Image Pull Errors

```bash
# Verify images are imported
kubectl describe pod <pod-name> -n namelist | grep Image

# Re-import images
./ops/k3s-build-images.sh

# Or manually
k3d image import tzuennn/name-list-backend:latest -c namelist
k3d image import tzuennn/name-list-frontend:latest -c namelist
```

#### Database Connection Issues

```bash
# Check database pod
kubectl get pod db-0 -n namelist

# Check database logs
kubectl logs db-0 -n namelist

# Restart API to reconnect
kubectl rollout restart deployment/api -n namelist

# Test connection from API pod
kubectl exec -it deployment/api -n namelist -- sh
# Inside pod: ping db-service
```

#### Ingress Not Working

```bash
# Check ingress
kubectl get ingress -n namelist
kubectl describe ingress namelist-ingress -n namelist

# Check Traefik logs
kubectl logs -n kube-system -l app.kubernetes.io/name=traefik

# Verify service endpoints
kubectl get endpoints -n namelist
```

#### Cluster Issues

```bash
# Check cluster health
kubectl cluster-info
kubectl get nodes

# Restart cluster
k3d cluster stop namelist
k3d cluster start namelist

# Delete and recreate
k3d cluster delete namelist
# Then follow deployment steps again
```

## ��📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built following spec-driven development methodology using [GitHub Spec Kit](https://github.com/github/spec-kit)
- Accessibility guidelines from WCAG 2.1
- Modular architecture inspired by modern frontend frameworks
- Testing patterns from industry best practices
- Docker Swarm distributed deployment patterns

## 📞 Support

- **Documentation**: Check the [specs/](specs/) directory for detailed specifications
- **Swarm Deployment**: See [swarm/README.md](swarm/README.md) for distributed deployment
- **Issues**: Report bugs and request features via GitHub Issues
- **Development**: See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup

---
````
