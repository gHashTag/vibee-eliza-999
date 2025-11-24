#!/usr/bin/env node

/**
 * Enhanced Sentry Instrumentation for ElizaOS
 * Implements best practices for error monitoring, performance tracking, and AI agent observability
 */

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Environment configuration
const ENV = process.env.NODE_ENV || 'production';
const SENTRY_DSN = process.env.SENTRY_DSN || "https://6775f4493fca5a1dff7fe154e30ecdf2@o4510419597656064.ingest.us.sentry.io/4510419598049280";

// Sample rates based on environment
const TRACES_SAMPLE_RATE = ENV === 'production' ? 0.1 : 1.0;
const PROFILES_SAMPLE_RATE = ENV === 'production' ? 0.1 : 0;
const REPLAYS_SESSION_SAMPLE_RATE = 0.1;
const REPLAYS_ON_ERROR_SAMPLE_RATE = 1.0;

/**
 * Initialize Sentry with enhanced configuration
 */
Sentry.init({
  dsn: SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: TRACES_SAMPLE_RATE,
  profilesSampleRate: PROFILES_SAMPLE_RATE,

  // Session replays for debugging user issues
  replaysSessionSampleRate: REPLAYS_SESSION_SAMPLE_RATE,
  replaysOnErrorSampleRate: REPLAYS_ON_ERROR_SAMPLE_RATE,

  // Environment
  environment: ENV,

  // PII handling
  sendDefaultPii: ENV !== 'production',

  // Integrations
  integrations: [
    nodeProfilingIntegration(),
    Sentry.captureConsoleIntegration({ levels: ['error'] }),
    Sentry.httpIntegration({ tracing: true }),
    Sentry.onUnhandledRejectionIntegration(),
    Sentry.onExceptionIntegration(),
  ],

  // Before send hooks for data sanitization
  beforeSend(event) {
    return sanitizeEvent(event);
  },

  beforeSendTransaction(event) {
    return sanitizeEvent(event);
  },

  beforeSendReplay(event) {
    return sanitizeReplay(event);
  },

  // Debug mode in development
  debug: ENV === 'development',

  // Auto session tracking
  autoSessionTracking: true,

  // Custom error sampling
  sampleRate: ENV === 'production' ? 0.95 : 1.0,
});

/**
 * Sanitize event data before sending to Sentry
 */
function sanitizeEvent(event) {
  // Remove sensitive data
  if (event.user) {
    delete event.user.ip_address;
    delete event.user.geo;
    delete event.user.geo;
  }

  // Sanitize headers
  if (event.request?.headers) {
    const headers = { ...event.request.headers };
    delete headers.authorization;
    delete headers.cookie;
    delete headers['x-api-key'];
    event.request.headers = headers;
  }

  // Sanitize extra data
  if (event.extra) {
    const extra = { ...event.extra };
    delete extra.password;
    delete extra.token;
    delete extra.apiKey;
    event.extra = extra;
  }

  return event;
}

/**
 * Sanitize replay data
 */
function sanitizeReplay(event) {
  // Implementation for replay sanitization
  // Remove sensitive DOM elements, input fields, etc.
  return event;
}

/**
 * Set global tags for all events
 */
Sentry.setTags({
  service: 'elizaos',
  version: process.env.APP_VERSION || 'unknown',
  environment: ENV,
});

/**
 * Set global extra data
 */
Sentry.setExtra('node_version', process.version);
Sentry.setExtra('platform', process.platform);
Sentry.setExtra('arch', process.arch);

/**
 * Setup global error handlers
 */
if (ENV === 'production') {
  // Capture uncaught exceptions
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error, {
      tags: {
        severity: 'critical',
        type: 'uncaughtException',
      },
      extra: {
        stack: error.stack,
      },
    });

    // Don't exit immediately in production, let Sentry send the error
    setTimeout(() => process.exit(1), 1000);
  });

  // Capture unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    Sentry.captureException(error, {
      tags: {
        severity: 'high',
        type: 'unhandledRejection',
      },
    });
  });
}

/**
 * Add request lifecycle tracking for Express apps
 */
export function trackRequestLifecycle(app) {
  // Add request tracking middleware
  app.use(Sentry.Handlers.requestHandler({
    traces: true,
  }));

  // Add error tracking middleware
  app.use(Sentry.Handlers.errorHandler({
    shouldHandleError: (error) => {
      // Only handle 5xx errors in production
      if (ENV === 'production') {
        return error.status >= 500;
      }
      return true;
    },
  }));

  // Add performance tracking
  app.use(Sentry.Handlers.tracingHandler());
}

/**
 * Track agent execution
 */
export function trackAgentExecution(agentId, operation) {
  const transaction = Sentry.startTransaction({
    op: 'agent.execution',
    name: `Agent ${agentId}: ${operation}`,
    tags: {
      agent_id: agentId,
      operation: operation,
    },
  });

  return transaction;
}

/**
 * Track AI model inference
 */
export function trackAIInference(agentId, model, prompt) {
  const span = Sentry.getActiveTransaction()?.startChild({
    op: 'ai.inference',
    description: `${model} inference`,
    data: {
      agent_id: agentId,
      model: model,
      prompt_length: prompt?.length || 0,
    },
  });

  return {
    finish: (result) => {
      if (span) {
        span.setData('result.success', result?.success || false);
        span.setData('result.tokens', result?.tokens || 0);
        span.setData('result.duration', result?.duration || 0);
        span.finish();
      }
    },
  };
}

/**
 * Track database operations
 */
export function trackDatabaseOperation(operation, table) {
  return Sentry.getActiveTransaction()?.startChild({
    op: 'db.operation',
    description: `${operation} ${table}`,
    data: {
      operation,
      table,
    },
  });
}

/**
 * Add custom metrics
 */
export function addMetric(name, value, type = 'counter', tags = {}) {
  Sentry.metrics.add(name, value, type, tags);
}

/**
 * Set user context
 */
export function setUserContext(user) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }
}

/**
 * Flush Sentry and exit gracefully
 */
export async function flushAndExit(timeout = 5000) {
  await Sentry.flush(timeout);
  process.exit(0);
}

/**
 * Health check for Sentry connectivity
 */
export async function healthCheck() {
  try {
    const transaction = Sentry.startTransaction({
      name: 'sentry.health_check',
      op: 'health_check',
    });

    await transaction.finish();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      sentry: 'connected',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      sentry: 'disconnected',
      error: error.message,
    };
  }
}

export default Sentry;
