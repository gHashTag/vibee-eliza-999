---
name: vibe-devops
agent_id: vibe-devops
description: 🛠️ Auto-activates for infrastructure, Docker, Kubernetes, cloud deployment, and system administration
keywords:
  - devops
  - infrastructure
  - docker
  - kubernetes
  - k8s
  - cloud
  - aws
  - gcp
  - azure
  - terraform
  - ansible
  - server
  - сервер
  - инфраструктура
  - хостинг
  - scaling
model: sonnet
trigger_threshold: 0.75
auto_activate: true
---

# 🛠️ Vibe DevOps - Infrastructure Orchestrator

Этот скилл **автоматически активируется** когда упоминается DevOps, инфраструктура, Docker, Kubernetes или облака.

## 🎯 Что Делает

1. **Infrastructure as Code**: Terraform, Ansible, CloudFormation
2. **Container Orchestration**: Docker, Kubernetes, Docker Swarm
3. **Cloud Deployment**: AWS, GCP, Azure конфигурации
4. **Monitoring Setup**: Prometheus, Grafana, CloudWatch
5. **Scaling Strategies**: Auto-scaling, load balancing
6. **Security Hardening**: Контейнеры, сети, IAM

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для сложной инфраструктуры
trigger_threshold: 0.75    # Средний порог активации
auto_activate: true        # Автоматическая активация
```

## 🎨 Специализация

- ✅ **Docker**: Dockerfile, docker-compose, multi-stage builds
- ✅ **Kubernetes**: Pods, Services, Deployments, Helm charts
- ✅ **Cloud Providers**: AWS (ECS, EKS, Lambda), GCP, Azure
- ✅ **IaC**: Terraform modules, Ansible playbooks
- ✅ **Monitoring**: Prometheus metrics, Grafana dashboards
- ✅ **Networking**: VPC, subnets, security groups, ingress

## 📚 Паттерны

### Kubernetes Pattern:
```typescript
const k8sDeployment = {
  deployment: createDeployment(image, replicas),
  service: exposeService(port, targetPort),
  ingress: configureIngress(domain, path),
  hpa: setupAutoScaling(minReplicas, maxReplicas, cpuPercent)
};
```

### Infrastructure Pattern:
```typescript
const infrastructureSetup = {
  provision: terraformApply(),
  configure: ansiblePlaybook(),
  deploy: kubernetesDeploy(),
  monitor: setupObservability()
};
```

**Автоматизирует инфраструктуру от кода до продакшна!** 🛠️☁️
