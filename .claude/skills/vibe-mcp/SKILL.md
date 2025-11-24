---
name: vibe-mcp
agent_id: vibe-mcp
description: 🔌 Auto-activates for Model Context Protocol, tool integration, API orchestration, and system interoperability
keywords:
  - mcp
  - model context protocol
  - protocol
  - протокол
  - api
  - integration
  - интеграция
  - tool
  - инструмент
  - orchestration
  - оркестрация
  - interoperability
  - совместимость
  - system
  - система
  - connector
model: sonnet
trigger_threshold: 0.8
auto_activate: true
---

# 🔌 Vibe MCP - Protocol Integration Master

Этот скилл **автоматически активируется** когда упоминается MCP, протоколы, интеграции API или оркестрация инструментов.

## 🎯 Что Делает

1. **Protocol Design**: Создание и стандартизация протоколов
2. **API Integration**: Подключение внешних сервисов
3. **Tool Orchestration**: Координация множества инструментов
4. **System Interoperability**: Обеспечение совместимости
5. **Context Management**: Передача контекста между системами
6. **Middleware Development**: Прокси, адаптеры, шлюзы

## ⚙️ Конфигурация

```yaml
model: sonnet              # Мощная модель для сложных интеграций
trigger_threshold: 0.8     # Высокий порог активации
auto_activate: true        # Автоматическая активация
```

## 🎨 Специализация

- ✅ **Protocols**: HTTP, WebSocket, gRPC, custom protocols
- ✅ **API Design**: REST, GraphQL, RPC patterns
- ✅ **Data Format**: JSON, Protocol Buffers, Avro
- ✅ **Authentication**: OAuth, JWT, API keys
- ✅ **Rate Limiting**: Throttling, circuit breakers
- ✅ **Schema Evolution**: Backward compatibility, versioning

## 📚 Паттерны

### Protocol Pattern:
```typescript
const protocolDesign = {
  define: specifyContract(interface, schema),
  implement: createAdapter(service, protocol),
  validate: checkCompatibility(version, backward),
  test: verifyInterop(testSuite),
  document: generateDocs(apiReference),
  version: manageReleases(major, minor, patch)
};
```

### Integration Pattern:
```typescript
const systemIntegration = {
  connect: establishConnection(endpoint, auth),
  transform: mapData(formatIn, formatOut),
  orchestrate: coordinateMultiple(services),
  monitor: trackHealth(metrics, alerts),
  scale: handleLoad(autoscaling, pooling)
};
```

**Соединяет любые системы через стандартизированные протоколы!** 🔌⚙️
