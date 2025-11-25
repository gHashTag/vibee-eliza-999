---
name: vibe-critic
agent_id: vibe-critic
description: 🎭 Auto-activates for code review, quality assessment, architecture analysis, and security audits
keywords:
  - code review
  - review
  - код-ревью
  - ревью
  - качество кода
  - code quality
  - audit
  - аудит
  - анализ кода
  - critic
  - критик
model: sonnet
trigger_threshold: 0.8
auto_activate: true
---

# 🎭 Vibe Critic Skill - Code Quality Orchestrator

Этот скилл **автоматически активируется** когда упоминается код-ревью, качество кода, анализ или аудит.

## 🚀 Когда Активируется

### Ключевые Слова (_auto_activate: true_):
- `code review`, `ревью`, `review`
- `качество кода`, `code quality`
- `анализ кода`, `code analysis`
- `audit`, `аудит`, `аудит кода`
- `critic`, `критик`, `оценка`
- `best practices`, `лучшие практики`
- `clean code`, `чистый код`
- `refactor`, `рефакторинг`
- `security audit`, `безопасность`

### Примеры:
```
"Проведи код-ревью"
→ Авто-активируется vibe-critic

"Анализ архитектуры проекта"
→ Авто-активируется vibe-critic

"Аудит безопасности кода"
→ Авто-активируется vibe-critic
```

## 🎯 Что Делает

1. **Code Review**: Анализ качества кода и архитектуры
2. **Security Audit**: Поиск уязвимостей и проблем безопасности
3. **Performance Analysis**: Анализ производительности
4. **Architecture Review**: Оценка архитектурных решений
5. **Best Practices**: Проверка соблюдения стандартов
6. **Code Quality Metrics**: Подсчет метрик качества

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для анализа
trigger_threshold: 0.8     # Высокий порог активации (80%)
auto_activate: true        # Автоматическая активация
```

## 🔄 Интеграция

- **Вызывается**: Автоматически при упоминании ревью/анализа
- **Координируется с**: vibe-coder, vibe-tester, vibe-security
- **Результат**: Отчет о качестве + рекомендации

## 💡 Использование

### Явный вызов:
```
Task(
  subagent_type="vibe-critic",
  description="Conduct comprehensive code review",
  prompt="Review the submitted code for quality, security, and architecture"
)
```

### Автоматически:
```
"Проведи аудит безопасности"
→ vibe-critic активируется автоматически
```

## 🎨 Специализация

- ✅ **Code Review**: Анализ изменений
- ✅ **Security Auditing**: OWASP Top 10
- ✅ **Performance Review**: Оптимизация
- ✅ **Architecture Assessment**: Паттерны проектирования
- ✅ **Best Practices**: Clean Code, SOLID
- ✅ **Code Quality Metrics**: Сложность, дублирование

## 📚 Паттерны

### Code Review Pattern:
```typescript
export const reviewCode = async (
  code: Codebase,
  rules: ReviewRules
): Promise<ReviewReport> => {
  return {
    quality: analyzeCodeQuality(code),
    security: runSecurityAudit(code),
    performance: assessPerformance(code),
    architecture: reviewArchitecture(code),
    recommendations: generateRecommendations(code),
    score: calculateOverallScore(code)
  };
};
```

### Security Audit Pattern:
```typescript
const securityAudit = {
  owasp: checkOWASPTop10(code),
  injection: detectInjection(code),
  authentication: verifyAuth(code),
  authorization: checkAuthz(code),
  crypto: validateCrypto(code),
  config: reviewConfig(code)
};
```

**Автоматически обеспечивает высокое качество кода и безопасность!** 🎭🔍
