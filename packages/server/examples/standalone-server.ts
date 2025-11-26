/**
 * TypeScript Example: Standalone Server Usage
 *
 * This example demonstrates how to use @elizaos/server as a standalone package
 * to create a custom agent server without the CLI dependency.
 */

import { AgentServer, ServerOptions, ServerMiddleware } from '@elizaos/server';
import { logger } from '@elizaos/core';
import { Request, Response, NextFunction } from 'express';

// Custom middleware example
const customLoggingMiddleware: ServerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

// Server configuration
const serverOptions: ServerOptions = {
  dataDir: './data/eliza-server',
  middlewares: [customLoggingMiddleware],
  // postgresUrl: process.env.DATABASE_URL, // Optional PostgreSQL
};

async function createStandaloneServer() {
  try {
    logger.info('🚀 Creating standalone ElizaOS server...');

    // Create server instance
    const server = new AgentServer();

    // Initialize with options
    logger.info('⚙️  Initializing server...');
    await server.initialize(serverOptions);

    // Register custom middleware if needed
    server.registerMiddleware((req: Request, res: Response, next: NextFunction) => {
      // Custom request processing
      res.setHeader('X-Powered-By', 'ElizaOS-Standalone');
      next();
    });

    logger.success('✅ Server initialized successfully');

    return server;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Failed to create server:', errorMessage);
    throw error;
  }
}

async function startServer() {
  try {
    const server = await createStandaloneServer();

    // Start server
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || 'localhost';

    logger.info(`🌐 Starting server on ${host}:${port}...`);
    server.start(port);

    // Log available endpoints
    logger.info('📡 Available endpoints:');
    logger.info(`   Dashboard: http://${host}:${port}/`);
    logger.info(`   API: http://${host}:${port}/api/`);
    logger.info(`   Health: http://${host}:${port}/api/health`);
    logger.info(`   WebSocket: ws://${host}:${port}/`);

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('🛑 Graceful shutdown initiated...');
      await server.stop();
      logger.success('✅ Server stopped successfully');
      process.exit(0);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('❌ Server startup failed:', errorMessage);
    process.exit(1);
  }
}

// Export for programmatic usage
export { createStandaloneServer, startServer };

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Fatal error:', errorMessage);
    process.exit(1);
  });
}
