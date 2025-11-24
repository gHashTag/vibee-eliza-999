---
name: vibe-spec
agent_id: vibe-spec
description: 📋 Auto-activates for specifications, requirements, technical docs, and API schemas
keywords:
  - spec
  - specification
  - спецификация
  - requirements
  - требования
  - документация
  - documentation
  - api
  - schema
  - схема
  - openapi
  - описание
model: sonnet
trigger_threshold: 0.8
auto_activate: true
---

# 📋 Vibe Spec Skill - Specification Master

Этот скилл **автоматически активируется** когда упоминаются спецификации, требования, документация или API схемы.

## 🚀 Когда Активируется

### Ключевые Слова (_auto_activate: true_):
- `spec`, `specification`, `спецификация`
- `requirements`, `требования`
- `документация`, `documentation`
- `api`, `openapi`, `swagger`
- `schema`, `схема`, `json schema`
- `описание`, `description`
- `техническое задание`, `ТЗ`
- `architecture`, `архитектура`
- `design`, `дизайн`, `проектирование`

### Примеры:
```
"Создать спецификацию API"
→ Авто-активируется vibe-spec

"Написать техническое задание"
→ Авто-активируется vibe-spec

"Оформить документацию проекта"
→ Авто-активируется vibe-spec
```

## 🎯 Что Делает

1. **Requirements Analysis**: Анализ требований
2. **API Documentation**: Документирование API
3. **Schema Design**: Проектирование схем
4. **Technical Specs**: Технические спецификации
5. **Architecture Docs**: Документация архитектуры
6. **OpenAPI Generation**: Генерация OpenAPI схем

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для документирования
trigger_threshold: 0.8     # Высокий порог активации (80%)
auto_activate: true        # Автоматическая активация
```

## 🔄 Интеграция

- **Вызывается**: Автоматически при упоминании спецификаций
- **Координируется с**: vibe-lead, vibe-coder, vibe-tasker
- **Результат**: Полная документация + спецификации

## 💡 Использование

### Явный вызов:
```
Task(
  subagent_type="vibe-spec",
  description="Create comprehensive API specification",
  prompt="Generate OpenAPI 3.0 spec for the provided requirements"
)
```

### Автоматически:
```
"Создай схему базы данных"
→ vibe-spec активируется автоматически
```

## 🎨 Специализация

- ✅ **Requirements Gathering**: Сбор требований
- ✅ **API Specifications**: OpenAPI, GraphQL
- ✅ **Database Schemas**: SQL/NoSQL схемы
- ✅ **Technical Documentation**: Технические документы
- ✅ **Architecture Design**: Проектирование архитектуры
- ✅ **JSON Schema**: Валидация данных

## 📚 Паттерны

### API Specification Pattern:
```typescript
const createAPISpec = {
  endpoints: defineEndpoints,
  schemas: createSchemas,
  security: configureSecurity,
  examples: addExamples,
  documentation: generateDocs,
  validation: addValidation
};
```

### Requirements Analysis Pattern:
```typescript
const analyzeRequirements = {
  functional: identifyFunctional,
  nonFunctional: identifyNonFunctional,
  constraints: documentConstraints,
  assumptions: listAssumptions,
  risks: assessRisks,
  prioritization: prioritize
};
```

**Автоматически создает четкие и полные спецификации!** 📋✨
