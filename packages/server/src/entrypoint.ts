/**
 * Safe entry point that wraps server initialization in error handling
 */

import { AgentServer } from './index.js';
// import { vibeeAgent } from '../../agents/vibeeAgent.js';

const start = async () => {
  try {
    console.log('🚀 Starting ElizaOS Agent Server...');

    const server = new AgentServer();
    await server.start({
      // agents: [
      //   {
      //     character: vibeeAgent,
      //     plugins: [],
      //   }
      // ]
    });
  } catch (error) {
    console.error('❌ Fatal error starting server:', error);
    process.exit(1);
  }
};

// Only start if this file is being run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export { start };
