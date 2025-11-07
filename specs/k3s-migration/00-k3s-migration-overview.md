# K3s Migration Overview

**Branch**: `k3s-refactor` | **Date**: 2025-11-07 | **Status**: PLANNING
**Migration From**: Docker Swarm (DinD) | **Migration To**: K3s Kubernetes Cluster

## Executive Summary

This document outlines the complete migration strategy from Docker Swarm orchestration to K3s (lightweight Kubernetes) for the Names List 3-tier application. The migration maintains all functional requirements while leveraging Kubernetes-native features for improved scalability, portability, and industry-standard orchestration.

## Why K3s?

### Advantages Over Docker Swarm

1. **Industry Standard**: Kubernetes is the de facto standard for container orchestration
2. **Rich Ecosystem**: Extensive tooling, operators, and community support
3. **Advanced Features**: StatefulSets, DaemonSets, Jobs, CronJobs, NetworkPolicies
4. **Better Scaling**: Horizontal Pod Autoscaler, Vertical Pod Autoscaler
5. **Declarative Management**: kubectl apply for GitOps workflows
6. **Service Mesh Ready**: Easy integration with Istio, Linkerd
7. **Monitoring**: Native Prometheus/Grafana integration

### Why K3s Specifically?

- **Lightweight**: ~60MB binary vs full Kubernetes
- **Single Binary**: Easy installation and updates
- **Production Ready**: CNCF certified Kubernetes distribution
- **Edge Optimized**: Perfect for resource-constrained environments
- **Built-in Components**: Traefik ingress, CoreDNS, ServiceLB
- **Storage**: Local-path provisioner included

## Current vs Target Architecture

### Current: Docker Swarm (DinD)

```
┌────────────────────────────────────────────────────────┐
│ Host (macOS Docker Desktop)                           │
│  ┌──────────────────────────────────────────────┐    │
│  │ swarm-manager (docker:24-dind)               │    │
│  │ • Services: web (2), api (1)                 │    │
│  │ • Ports: 80:80, 8080:8080                    │    │
│  │ • Orchestration: Docker Swarm                │    │
│  └──────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────┐    │
│  │ swarm-worker (docker:24-dind)                │    │
│  │ • Services: db (1)                           │    │
│  │ • Volume: db-data                            │    │
│  └──────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

### Target: K3s Multi-Node Cluster

```
┌────────────────────────────────────────────────────────┐
│ Docker Host (macOS)                                    │
│  ┌──────────────────────────────────────────────────┐ │
│  │ k3d-namelist-server-0 (K3s Server)               │ │
│  │ • Control Plane: API Server, Scheduler           │ │
│  │ • Worker Capabilities: Can run pods              │ │
│  │ • Workload: web (2 replicas), api (2 replicas)  │ │
│  │ • Ingress: Traefik (built-in)                    │ │
│  │ • DNS: CoreDNS                                   │ │
│  │ • Role: Control plane + Worker                  │ │
│  └──────────────────────────────────────────────────┘ │
│         ↓ (K3s cluster network - Docker)              │
│  ┌──────────────────────────────────────────────────┐ │
│  │ k3d-namelist-agent-0 (K3s Agent)                 │ │
│  │ • Role: Worker Only                              │ │
│  │ • Workload: db (StatefulSet, 1 replica)         │ │
│  │ • Storage: PersistentVolume (local-path)        │ │
│  │ • Label: node-role=database                     │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │ k3d-namelist-serverlb (LoadBalancer)             │ │
│  │ • Ports: 80:80, 8080:8080 → localhost           │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**Key Multi-Node Features:**

- True multi-node K3s cluster (server + agent)
- Database isolated on dedicated agent node
- Web/API services on server node
- Node affinity for service placement
- Production Kubernetes features
- Docker-based infrastructure (consistent with current Swarm DinD)

## Migration Scope

### In Scope

✅ Convert Docker Swarm stack to Kubernetes manifests
✅ Migrate services to Deployments/StatefulSets
✅ Configure Kubernetes Service objects for networking
✅ Set up Ingress for external access
✅ Migrate persistent storage to PersistentVolumes
✅ Update operational scripts (kubectl instead of docker)
✅ Adapt health checks to Kubernetes probes
✅ Update documentation and evidence collection
✅ Support both single-node and multi-node deployments

### Out of Scope

❌ Application code changes (reuse existing containers)
❌ Testing suite changes (same tests, different deployment)
❌ UI/UX modifications
❌ Database schema changes
❌ CI/CD pipeline setup (can be added later)

## High-Level Migration Strategy

### Phase 1: Environment Setup

- Set up K3s cluster (Vagrant VM or k3d)
- Install kubectl and supporting tools
- Verify cluster connectivity

### Phase 2: Manifest Creation

- Convert stack.yaml to Kubernetes manifests
- Create Namespace for application
- Define ConfigMaps and Secrets
- Create Deployments for web/api
- Create StatefulSet for database
- Define Services for networking
- Configure Ingress for external access
- Set up PersistentVolumeClaims

### Phase 3: Deployment Scripts

- Create k8s/ directory for manifests
- Write ops/k3s-\*.sh scripts for lifecycle
- Implement kubectl-based verification
- Build automated deployment pipeline

### Phase 4: Testing & Validation

- Functional testing in K3s environment
- Performance comparison with Swarm
- Persistence validation
- Scaling tests

### Phase 5: Documentation

- Update all specs for K3s
- Create K3s deployment guide
- Document kubectl commands
- Provide troubleshooting guide
- Generate evidence package

## Key Technical Decisions

### 1. Cluster Infrastructure

**Multi-Node Vagrant VMs (Production-Like)**

- Two separate VirtualBox VMs
- K3s server: Control plane + worker (192.168.56.10)
- K3s agent: Worker only (192.168.56.11)
- True distributed Kubernetes cluster
- Each VM: 2GB RAM, 2 CPUs, Ubuntu 22.04
- Private network for inter-node communication
- Most realistic production topology

**Why Multi-Node?**

- Demonstrates true distributed system
- Database isolation on dedicated worker
- Realistic node failure scenarios
- Better alignment with production practices
- Shows Kubernetes networking in action

### 2. Storage Strategy

**Database Storage**:

- Use **PersistentVolumeClaim** with local-path storage class
- StatefulSet ensures stable network identity
- Backup strategy via volumeSnapshot or pod exec

**Choice**: local-path-provisioner (included in K3s) for simplicity

### 3. Ingress Configuration

**Built-in Traefik**:

- Use K3s built-in Traefik ingress controller
- Configure IngressRoute or standard Ingress resource
- Map to host port 80

**Alternative**: Install Nginx ingress controller if needed

### 4. Networking

**Service Types**:

- Database: ClusterIP (internal only)
- API: ClusterIP (accessed via Ingress)
- Web: ClusterIP (accessed via Ingress)

**DNS**: CoreDNS provides service discovery (db.default.svc.cluster.local)

### 5. Deployment Patterns

**Stateless Services (web, api)**:

- Use Deployments
- Multiple replicas for HA
- Rolling update strategy

**Stateful Services (db)**:

- Use StatefulSet
- Single replica (can be scaled later)
- Persistent storage

## Success Criteria

### Functional Requirements

- [ ] Application accessible via Ingress on port 80
- [ ] All features from Swarm version work identically
- [ ] Database data persists across pod restarts
- [ ] Service-to-service communication works
- [ ] Health checks integrated with Kubernetes probes

### Operational Requirements

- [ ] K3s cluster with 1+ nodes operational
- [ ] All pods running and healthy
- [ ] kubectl commands for common operations documented
- [ ] Automated deployment scripts functional
- [ ] Backup/restore procedures documented

### Performance Requirements

- [ ] Application response time ≤ Swarm baseline
- [ ] Pod startup time < 60 seconds
- [ ] Resource utilization within acceptable limits

### Documentation Requirements

- [ ] Complete K3s deployment guide
- [ ] Comparison: Docker Swarm vs K3s
- [ ] Troubleshooting guide
- [ ] Evidence package with kubectl outputs

## Risk Assessment

### Technical Risks

| Risk                              | Impact | Likelihood | Mitigation                                |
| --------------------------------- | ------ | ---------- | ----------------------------------------- |
| Learning curve for Kubernetes     | Medium | High       | Comprehensive docs, incremental migration |
| Storage configuration complexity  | Medium | Medium     | Use built-in local-path provisioner       |
| Networking differences from Swarm | Low    | Low        | K8s DNS is more mature than Swarm         |
| Ingress configuration             | Medium | Low        | Use built-in Traefik, well-documented     |

### Operational Risks

| Risk                              | Impact | Likelihood | Mitigation                        |
| --------------------------------- | ------ | ---------- | --------------------------------- |
| Vagrant VM resource requirements  | Low    | Medium     | Provide k3d alternative           |
| Cluster initialization complexity | Medium | Low        | Automated scripts                 |
| Migration downtime                | Low    | Low        | New deployment, no live migration |

## Timeline Estimate

| Phase                         | Duration        | Effort     |
| ----------------------------- | --------------- | ---------- |
| Phase 1: Environment Setup    | 1-2 hours       | Low        |
| Phase 2: Manifest Creation    | 3-4 hours       | Medium     |
| Phase 3: Deployment Scripts   | 2-3 hours       | Medium     |
| Phase 4: Testing & Validation | 2-3 hours       | Medium     |
| Phase 5: Documentation        | 2-3 hours       | Low-Medium |
| **Total**                     | **10-15 hours** | **Medium** |

## Next Steps

1. **Review this overview** - Assess approach and timeline
2. **Read detailed migration plan** - See `01-k3s-migration-plan.md`
3. **Review manifest specifications** - See `02-k3s-manifests-spec.md`
4. **Check operational guide** - See `03-k3s-operations.md`
5. **Begin implementation** - Follow phase-by-phase approach

## References

- [K3s Documentation](https://docs.k3s.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Swarm to Kubernetes Migration](https://kubernetes.io/docs/reference/kubectl/docker-cli-to-kubectl/)
- [Current Swarm Spec](../dind-swarm-deployment/spec.md)
- [Current Architecture](../20-target-spec.md)

---

**Status**: Ready for review and approval before implementation begins.
