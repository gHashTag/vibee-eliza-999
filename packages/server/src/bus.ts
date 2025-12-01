/**
 * Internal message bus for server-wide event communication
 * используется для передачи событий между различными сервисами
 */
import { EventEmitter } from 'node:events';

const internalMessageBus = new EventEmitter();

// Увеличиваем лимит listeners для большего количества подписчиков
internalMessageBus.setMaxListeners(50);

export default internalMessageBus;
