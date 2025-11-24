---
name: vibe-security
agent_id: vibe-security
description: 🔒 Auto-activates for security engineering, vulnerability assessment, compliance audits, and threat modeling
keywords:
  - security
  - безопасность
  - vulnerability
  - уязвимость
  - audit
  - аудит
  - compliance
  - соответствие
  - threat
  - угроза
  - penetration
  - пентест
  - encryption
  - шифрование
  - authentication
  - аутентификация
  - authorization
  - авторизация
model: sonnet
trigger_threshold: 0.85
auto_activate: true
---

# 🔒 Vibe Security - Security Engineering Orchestrator

Этот скилл **автоматически активируется** когда упоминается безопасность, уязвимости, аудит или соответствие требованиям.

## 🎯 Что Делает

1. **Security Audits**: Аудит кода и инфраструктуры
2. **Vulnerability Assessment**: Поиск и анализ уязвимостей
3. **Threat Modeling**: Моделирование угроз и рисков
4. **Compliance**: GDPR, SOC2, ISO 27001, PCI DSS
5. **Penetration Testing**: Тестирование безопасности
6. **Incident Response**: Реагирование на инциденты

## ⚙️ Конфигурация

```yaml
model: sonnet              # Самая мощная модель для безопасности
trigger_threshold: 0.85    # Очень высокий порог активации
auto_activate: true        # Автоматическая активация
```

## 🎨 Специализация

- ✅ **OWASP Top 10**: Injection, XSS, broken auth
- ✅ **Security Testing**: SAST, DAST, IAST, penetration
- ✅ **Encryption**: TLS, at-rest, key management
- ✅ **Access Control**: RBAC, ABAC, zero-trust
- ✅ **Compliance**: Audit trails, data protection
- ✅ **Security Monitoring**: SIEM, alerting, forensics

## 📚 Паттерны

### Security Audit:
```typescript
const securityAudit = {
  scan: performSecurityScan(code, dependencies),
  test: runVulnerabilityScans(),
  analyze: assessRisks(findings, cvss, likelihood),
  prioritize: rankByImpact(critical, high, medium, low),
  remediate: fixVulnerabilities(patches, codeChanges),
  verify: confirmResolution(tests, scans)
};
```

### Threat Modeling:
```typescript
const threatModeling = {
  identify: mapAssets(critical, data, systems),
  analyze: findThreats(actors, vectors, motivation),
  assess: calculateRisk(impact, likelihood, controls),
  mitigate: implementControls(preventive, detective),
  monitor: trackIncidents(alerts, response, lessons),
  update: reviseModel(changes, newThreats)
};
```

**Обеспечивает безопасность на всех уровнях!** 🔒🛡️
