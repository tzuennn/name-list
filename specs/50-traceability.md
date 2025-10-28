# Traceability: HW5 Distributed 3-Tier App Requirements → Implementation

**Date**: 2025-10-28 | **Target**: Multi-node Docker Swarm deployment
**Purpose**: Link HW5 requirements to specifications, tasks, and verification methods

## Requirements Traceability Matrix

| Requirement ID  | HW5 Requirement                                | Spec Reference                                                               | Task IDs   | Verification Method                                             | Status       |
| --------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- | ------------ |
| **HW5-ARCH-01** | Web and API run on laptop (Swarm manager)      | [Target-Spec §2.1](20-target-spec.md#node-distribution-strategy)             | T028, T029 | `docker service ps mcapp_api mcapp_web` shows manager placement | ⏳ Planned   |
| **HW5-ARCH-02** | DB runs on lab Linux node (Swarm worker)       | [Target-Spec §2.1](20-target-spec.md#node-distribution-strategy)             | T027       | `docker service ps mcapp_db` shows worker placement             | ⏳ Planned   |
| **HW5-ARCH-03** | Orchestrate with Docker Swarm using stack file | [Target-Spec §1](20-target-spec.md#target-architecture-overview)             | T022-T030  | Stack deploys successfully via `swarm/stack.yaml`               | ⏳ Planned   |
| **HW5-ARCH-04** | Keep Compose for local dev                     | [Current-State §4](10-current-state-spec.md#current-deployment-architecture) | N/A        | `docker-compose.yml` unchanged and functional                   | ✅ Preserved |

## Network & Communication Requirements

| Requirement ID | HW5 Requirement                                | Spec Reference                                                   | Task IDs   | Verification Method                                   | Status     |
| -------------- | ---------------------------------------------- | ---------------------------------------------------------------- | ---------- | ----------------------------------------------------- | ---------- |
| **HW5-NET-01** | Overlay network for service-to-service traffic | [Target-Spec §2.2](20-target-spec.md#network-architecture)       | T022, T030 | `docker network ls` shows overlay network `appnet`    | ⏳ Planned |
| **HW5-NET-02** | Service discovery (API → DB by DNS name)       | [Target-Spec §2.2](20-target-spec.md#network-architecture)       | T028, T046 | API connects to `postgresql://dbuser:dbpass@db:5432/` | ⏳ Planned |
| **HW5-NET-03** | Ingress publish: expose web on port 80         | [Target-Spec §2.1](20-target-spec.md#node-distribution-strategy) | T029       | `curl http://manager-ip/` returns application         | ⏳ Planned |

## Storage & Persistence Requirements

| Requirement ID  | HW5 Requirement                      | Spec Reference                                         | Task IDs   | Verification Method                                  | Status     |
| --------------- | ------------------------------------ | ------------------------------------------------------ | ---------- | ---------------------------------------------------- | ---------- |
| **HW5-STOR-01** | Persistent volume for DB on lab node | [Target-Spec §2.3](20-target-spec.md#storage-strategy) | T025, T027 | Bind mount `/var/lib/postgres-data` configured       | ⏳ Planned |
| **HW5-STOR-02** | Data survives container replacement  | [Target-Spec §2.3](20-target-spec.md#storage-strategy) | T047, T082 | Data persists after `docker service update mcapp_db` | ⏳ Planned |

## Operational Requirements

| Requirement ID | HW5 Requirement            | Spec Reference                                  | Task IDs | Verification Method                             | Status     |
| -------------- | -------------------------- | ----------------------------------------------- | -------- | ----------------------------------------------- | ---------- |
| **HW5-OPS-01** | `ops/init-swarm.sh` script | [Plan §3.2](30-plan-hw5.md#swarm-setup-scripts) | T010     | Script initializes swarm and outputs join token | ⏳ Planned |
| **HW5-OPS-02** | `ops/deploy.sh` script     | [Plan §3.4](30-plan-hw5.md#operations-scripts)  | T040     | Script deploys stack successfully               | ⏳ Planned |
| **HW5-OPS-03** | `ops/verify.sh` script     | [Plan §3.4](30-plan-hw5.md#operations-scripts)  | T041     | Script validates deployment end-to-end          | ⏳ Planned |
| **HW5-OPS-04** | `ops/cleanup.sh` script    | [Plan §3.4](30-plan-hw5.md#operations-scripts)  | T013     | Script removes stack and leaves swarm           | ⏳ Planned |

## Placement & Constraint Requirements

| Requirement ID   | HW5 Requirement                        | Spec Reference                                                              | Task IDs   | Verification Method                                     | Status     |
| ---------------- | -------------------------------------- | --------------------------------------------------------------------------- | ---------- | ------------------------------------------------------- | ---------- |
| **HW5-PLACE-01** | DB placement constraint: lab node only | [Target-Spec §1.1](20-target-spec.md#distributed-architecture-requirements) | T012, T023 | `node.labels.role == db` constraint in stack.yaml       | ⏳ Planned |
| **HW5-PLACE-02** | Manager node labeled and recognized    | [Plan §3.2](30-plan-hw5.md#swarm-setup-scripts)                             | T012       | `docker node ls` shows manager role                     | ⏳ Planned |
| **HW5-PLACE-03** | Worker node labeled for DB placement   | [Plan §3.2](30-plan-hw5.md#swarm-setup-scripts)                             | T012       | `docker node inspect worker-node` shows `role=db` label | ⏳ Planned |

## Health & Monitoring Requirements

| Requirement ID    | HW5 Requirement                                      | Spec Reference                                          | Task IDs | Verification Method                         | Status     |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------- | -------- | ------------------------------------------- | ---------- |
| **HW5-HEALTH-01** | DB readiness check (`pg_isready`)                    | [Target-Spec §3.1](20-target-spec.md#health-monitoring) | T026     | Health check defined in stack.yaml          | ⏳ Planned |
| **HW5-HEALTH-02** | API health endpoint (`/healthz` → `{"status":"ok"}`) | [Target-Spec §3.1](20-target-spec.md#health-monitoring) | T026     | `curl http://manager-ip/healthz` returns OK | ⏳ Planned |

## Documentation & Evidence Requirements

| Requirement ID | HW5 Requirement                                | Spec Reference                                           | Task IDs       | Verification Method                          | Status         |
| -------------- | ---------------------------------------------- | -------------------------------------------------------- | -------------- | -------------------------------------------- | -------------- |
| **HW5-DOC-01** | `docs/EVIDENCE.md` with command outputs        | [Plan §3.5](30-plan-hw5.md#evidence-collection)          | T060-T065      | Evidence file contains all required outputs  | ⏳ Planned     |
| **HW5-DOC-02** | Demo video (≤5 min) end-to-end deployment      | [Plan §3.5](30-plan-hw5.md#evidence-collection)          | T070-T072      | Video demonstrates complete deployment cycle | ⏳ Planned     |
| **HW5-DOC-03** | Spec-Kit updates describing distributed design | [Target-Spec](20-target-spec.md), [Plan](30-plan-hw5.md) | All Spec Tasks | Topology, constraints, risks documented      | 🔄 In Progress |

## Functional Preservation Requirements

| Requirement ID  | HW5 Requirement                           | Spec Reference                                             | Task IDs   | Verification Method                           | Status     |
| --------------- | ----------------------------------------- | ---------------------------------------------------------- | ---------- | --------------------------------------------- | ---------- |
| **HW5-FUNC-01** | All HW4 features work in distributed mode | [Target-Spec §Success](20-target-spec.md#success-criteria) | T080-T081  | Sorting, pagination, accessibility functional | ⏳ Planned |
| **HW5-FUNC-02** | Performance comparable to single-host     | [Plan §Risk](30-plan-hw5.md#risk-management)               | T081, T096 | Response times within 20% of HW4 baseline     | ⏳ Planned |

## Infrastructure Requirements (VirtualBox)

| Requirement ID   | Derived Requirement                     | Spec Reference                                    | Task IDs        | Verification Method                    | Status     |
| ---------------- | --------------------------------------- | ------------------------------------------------- | --------------- | -------------------------------------- | ---------- |
| **HW5-INFRA-01** | VirtualBox VM as lab node substitute    | [Plan §3.1](30-plan-hw5.md#virtualbox-vm-setup)   | T001-T005       | VM operational with Docker and SSH     | ⏳ Planned |
| **HW5-INFRA-02** | Dual network adapters (NAT + Host-only) | [Plan §3.1](30-plan-hw5.md#network-configuration) | T004, T006-T008 | SSH and internet connectivity verified | ⏳ Planned |
| **HW5-INFRA-03** | Ubuntu 22.04 with Docker CE             | [Plan §3.1](30-plan-hw5.md#virtualbox-vm-setup)   | T003, T005      | `docker --version` succeeds on VM      | ⏳ Planned |

## Validation Commands Mapping

### Topology Validation

```bash
# HW5-ARCH-01, HW5-ARCH-02: Service placement
docker node ls                           # Shows manager + worker
docker service ps mcapp_db               # DB on worker only
docker service ps mcapp_api mcapp_web    # Web/API on manager only
```

### Connectivity Validation

```bash
# HW5-NET-01, HW5-NET-02, HW5-NET-03: Network functionality
docker network ls | grep appnet          # Overlay network exists
curl http://localhost/                   # Web accessible
curl http://localhost/healthz            # API health endpoint
docker exec mcapp_api.1 nslookup db      # Service discovery
```

### Storage Validation

```bash
# HW5-STOR-01, HW5-STOR-02: Persistence
docker volume inspect mcapp_dbdata       # Volume configuration
docker service update mcapp_db           # Restart database service
# Verify data survives restart
```

### Automation Validation

```bash
# HW5-OPS-01 through HW5-OPS-04: Operations scripts
./ops/init-swarm.sh && echo "PASS" || echo "FAIL"
./ops/deploy.sh && echo "PASS" || echo "FAIL"
./ops/verify.sh && echo "PASS" || echo "FAIL"
./ops/cleanup.sh && echo "PASS" || echo "FAIL"
```

## Requirements Coverage Summary

| Category       | Total Requirements | Planned | In Progress | Complete |
| -------------- | ------------------ | ------- | ----------- | -------- |
| Architecture   | 4                  | 3       | 1           | 0        |
| Networking     | 3                  | 3       | 0           | 0        |
| Storage        | 2                  | 2       | 0           | 0        |
| Operations     | 4                  | 4       | 0           | 0        |
| Placement      | 3                  | 3       | 0           | 0        |
| Health         | 2                  | 2       | 0           | 0        |
| Documentation  | 3                  | 2       | 1           | 0        |
| Functional     | 2                  | 2       | 0           | 0        |
| Infrastructure | 3                  | 3       | 0           | 0        |
| **TOTAL**      | **26**             | **24**  | **2**       | **0**    |

## Risk → Mitigation Traceability

| Risk Category   | Risk Description               | Mitigation Tasks     | Verification                            |
| --------------- | ------------------------------ | -------------------- | --------------------------------------- |
| **Network**     | VirtualBox connectivity issues | T006-T009, T095-T096 | SSH and Docker communication tests      |
| **Storage**     | Data loss during operations    | T042, T047, T082     | Backup procedures and persistence tests |
| **Performance** | Distributed latency impact     | T081, T096           | Response time comparison testing        |
| **Deployment**  | Manual errors in complex setup | T040-T051            | Complete automation validation          |

## Acceptance Criteria Mapping

Each HW5 requirement maps to specific acceptance criteria in the target specification:

- **Functional**: Application accessible and preserves all HW4 features
- **Operational**: Complete automation with minimal manual intervention
- **Technical**: Proper service placement and network communication
- **Documentation**: Evidence package enabling independent verification

---

**Traceability Status**: 26/26 requirements mapped to implementation tasks
**Coverage**: 100% requirement coverage with verification methods defined
**Next**: Execute tasks according to dependencies in [Tasks](40-tasks-hw5.md)
