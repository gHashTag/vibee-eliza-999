import type { ElizaOS } from '@elizaos/core';

/**
 * Заглушка для message bus connector plugin
 */
export const messageBusConnectorPlugin = {
  name: 'message-bus-connector',
  description: 'Message bus connector plugin',
  actions: [],
  evaluators: [],
  providers: [],
  services: [],
};

/**
 * Глобальная переменная для ElizaOS
 */
let globalElizaOS: ElizaOS | null = null;

/**
 * Установить глобальный экземпляр ElizaOS
 */
export function setGlobalElizaOS(elizaOS: ElizaOS) {
  globalElizaOS = elizaOS;
  console.log('✅ Global ElizaOS set');
}

/**
 * Глобальная переменная для AgentServer
 */
let globalAgentServer: any = null;

/**
 * Установить глобальный экземпляр AgentServer
 */
export function setGlobalAgentServer(server: any) {
  globalAgentServer = server;
  console.log('✅ Global AgentServer set');
}

/**
 * Получить глобальный экземпляр ElizaOS
 */
export function getGlobalElizaOS(): ElizaOS | null {
  return globalElizaOS;
}

/**
 * Получить глобальный экземпляр AgentServer
 */
export function getGlobalAgentServer(): any {
  return globalAgentServer;
}
