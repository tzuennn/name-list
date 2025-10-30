# Feature Specification: Distributed 3-Tier Deployment with Docker-in-Docker

**Feature Branch**: `002-dind-swarm-deployment`  
**Created**: 2025-10-30  
**Status**: Implemented  
**Input**: Refactor the deployment to use a simulated, local Docker Swarm cluster via Docker-in-Docker (DinD) to eliminate VM networking issues.

## 1. Topology & Constraints (Simulated)

### 1.1. Node Roles

- **Manager Node**:
  - **Hosting**: A Docker container (`swarm-manager`) running a `docker:dind` image.
  - **Responsibilities**: Manages the Swarm cluster, runs `web` and `api` services.
- **Worker Node**:
  - **Hosting**: A Docker container (`swarm-worker`) running a `docker:dind` image.
  - **Responsibilities**: Runs the `db` (PostgreSQL) service exclusively.
  - **Constraints**: Labeled with `role=db` to ensure correct service placement.

### 1.2. Network Architecture

- **Simulation Network (`swarm-sim-net`)**: A standard Docker bridge network that connects the `manager` and `worker` containers, allowing them to communicate and form a Swarm.
- **Overlay Network (`appnet`)**: A Swarm overlay network created by the stack for service-to-service communication (e.g., `api` to `db`).
- **Ingress Network**: The `web` service is exposed on port `80` of the `swarm-manager` container, which is mapped to port `80` on the host machine (`localhost`).

### 1.3. Storage

- **Database Volume (`db-data`)**: A standard Docker named volume is used for PostgreSQL data.
- **Placement**: This volume is managed by the Docker daemon running on the host and is mounted into the `swarm-worker` container. The `postgres` service, running inside the worker, then mounts this path, ensuring data persistence even if the entire simulation is stopped and restarted.

## 2. Service Configuration (`swarm/stack.yaml`)

- **`services.web`**:
  - Published on port `80:80` via the ingress network.
  - Constrained to run only on `manager` nodes.
- **`services.api`**:
  - Not publicly exposed; communicates over the `appnet` overlay network.
  - Constrained to run only on `manager` nodes.
- **`services.db`**:
  - Constrained to run only on nodes with the label `node.labels.role == db`.
  - Mounts the `db-data` volume for data persistence.

## 3. Operational Scripts (`ops/`)

- **`init-swarm.sh`**: Fully automates the creation of the DinD cluster. It starts the containers, initializes the swarm, joins the worker, and labels the worker node.
- **`deploy.sh`**: Deploys the application stack into the running DinD cluster.
- **`verify.sh`**: Checks the status of the nodes and services within the DinD cluster and runs health checks against `localhost`.
- **`cleanup.sh`**: Stops and removes the DinD containers and associated volumes.

## 4. Risks & Mitigation

- **Risk**: Complexity of managing a distributed system.
  - **Mitigation**: The DinD approach encapsulates the entire cluster in a single `docker-compose.dind.yml` file, managed by simple `up` and `down` commands wrapped in the `ops` scripts. This significantly reduces setup friction.
- **Risk**: Data persistence.
  - **Mitigation**: A named Docker volume is used, which is independent of the container lifecycle, ensuring data is safe.

## 5. Acceptance Criteria

- **AC-001**: `./ops/init-swarm.sh` completes successfully and `docker exec swarm-manager docker node ls` shows one `Leader` and one `Ready` worker.
- **AC-002**: The `swarm-worker` node must have the label `role=db`.
- **AC-003**: After running `./ops/deploy.sh`, `docker exec swarm-manager docker service ps mcapp_db` shows the database task running on the `swarm-worker` node.
- **AC-004**: Accessing `http://localhost/` in a browser successfully loads the web application.
- **AC-005**: Data added to the application persists after running `./ops/cleanup.sh` and then re-running `./ops/init-swarm.sh` and `./ops/deploy.sh`.
