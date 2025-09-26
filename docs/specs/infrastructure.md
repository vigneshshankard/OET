# Infrastructure Specification

Version: 1.0  
Last Updated: September 21, 2025

## Overview

This document specifies the infrastructure requirements for the OET Praxis platform, based on the system architecture and performance requirements defined in the system-architecture.md document.

## 1. Service Requirements

### 1.1 Resource Requirements
Based on performance targets in system-architecture.md:

| Service | CPU | Memory | Storage |
|---------|-----|---------|----------|
| API Gateway | 2 cores | 4GB | 20GB |
| Session Service | 4 cores | 8GB | 40GB |
| User Service | 2 cores | 4GB | 20GB |
| Content Service | 2 cores | 4GB | 20GB |
| AI Services | 4 cores | 16GB | 40GB |

### 1.2 Scaling Parameters
```yaml
scaling:
  min_replicas: 2
  max_replicas: 10
  cpu_threshold: 70%
  memory_threshold: 80%
```

## 2. Database Configuration

### 2.1 PostgreSQL Requirements
From database-schema.md:
```yaml
postgresql:
  version: "15"
  resources:
    cpu: 4 cores
    memory: 16GB
    storage: 100GB
  replicas: 2
  backup_retention: 30 days
```

### 2.2 Redis Cache
```yaml
redis:
  version: "7"
  mode: cluster
  nodes: 3
  memory: 4GB per node
```

## 3. Network Configuration

### 3.1 Service Communication
Based on system-architecture.md:
```yaml
networking:
  protocol: HTTP/2
  internal_port_range: 8000-9000
  service_mesh: false
  load_balancer: nginx
```

### 3.2 Security Groups
```yaml
security:
  internal_traffic: allow
  external_ports:
    - 443
    - 80 (redirect)
```

## 4. Deployment Configuration

### 4.1 Basic Kubernetes Resources
```yaml
resources:
  - Deployments
  - Services
  - ConfigMaps
  - Secrets
  - Ingress
```

### 4.2 Environment Config
```yaml
environments:
  production:
    domain: api.oetpraxis.com
    replicas: 2-10
    monitoring: enabled
  staging:
    domain: api.staging.oetpraxis.com
    replicas: 1-3
    monitoring: enabled
```

## 5. Backup Requirements

From database-operations.md:
### 5.1 Database Backups
```yaml
backup:
  schedule: "0 0 * * *"
  retention: 30 days
  type: full
  storage: object_storage
```

## 6. Monitoring Integration

From monitoring-service.md:
```yaml
monitoring:
  metrics_retention: 30 days
  log_retention: 7 days
  alert_integration: true
```

## 7. Implementation Notes

1. Use standard Kubernetes deployments
2. No custom schedulers
3. Basic health checks
4. Standard rolling updates
5. Default resource quotas

## 8. Limitations

- No service mesh
- No custom schedulers
- No advanced auto-scaling
- No multi-cluster setup
- No custom network policies