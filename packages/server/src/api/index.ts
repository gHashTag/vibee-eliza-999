import type { Express, Router } from 'express';
import type { Server as HTTPServer } from 'http';
import type { ElizaOS } from '@elizaos/core';
import express from 'express';
import { Server } from 'socket.io';

/**
 * Создает основной API роутер для приложения
 */
export function createApiRouter(elizaOS: ElizaOS, server: any): Router {
  const router = express.Router();

  // Базовые роуты API
  router.get('/ping', (_req: any, res: any) => {
    res.json({ ok: true, status: 'pong' });
  });

  // Добавляем роуты для агентов
  router.get('/agents', (_req: any, res: any) => {
    res.json({ ok: true, agents: [] });
  });

  // Добавляем роуты для сообщений
  router.get('/messages', (_req: any, res: any) => {
    res.json({ ok: true, messages: [] });
  });

  // Добавляем роут для версии системы
  router.get('/system/version', (_req: any, res: any) => {
    res.json({ 
      ok: true, 
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    });
  });

  console.log('✅ API router created');
  return router;
}

/**
 * Создает обработчик маршрутов для плагинов
 */
export function createPluginRouteHandler(elizaOS: ElizaOS): any {
  const router = express.Router();

  // Обработчик для плагинов
  router.use((req: any, res: any, next: any) => {
    console.log(`Plugin route: ${req.method} ${req.path}`);
    next();
  });

  console.log('✅ Plugin route handler created');
  return router;
}

/**
 * Настраивает Socket.IO сервер
 */
export function setupSocketIO(httpServer: HTTPServer, elizaOS: ElizaOS, agentServer?: any): any {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: any) => {
    console.log(`✅ Socket.IO client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`❌ Socket.IO client disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
}
