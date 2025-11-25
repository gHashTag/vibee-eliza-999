// src/plugin.ts
import { ModelType, Service, logger } from "@elizaos/core";
import { z } from "zod";
var configSchema = z.object({
  EXAMPLE_PLUGIN_VARIABLE: z.string().min(1, "Example plugin variable is not provided").optional().transform((val) => {
    if (!val) {
      logger.warn("Example plugin variable is not provided (this is expected)");
    }
    return val;
  })
});
var helloWorldAction = {
  name: "HELLO_WORLD",
  similes: ["GREET", "SAY_HELLO"],
  description: "Responds with a simple hello world message",
  validate: async (_runtime, _message, _state) => {
    return true;
  },
  handler: async (_runtime, message, _state, _options, callback, _responses) => {
    try {
      const response = "Hello world!";
      if (callback) {
        await callback({
          text: response,
          actions: ["HELLO_WORLD"],
          source: message.content.source
        });
      }
      return {
        text: response,
        success: true,
        data: {
          actions: ["HELLO_WORLD"],
          source: message.content.source
        }
      };
    } catch (error) {
      logger.error({ error }, "Error in HelloWorld action:");
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },
  examples: [
    [
      {
        name: "{{userName}}",
        content: {
          text: "hello",
          actions: []
        }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "Hello world!",
          actions: ["HELLO_WORLD"]
        }
      }
    ]
  ]
};
var helloWorldProvider = {
  name: "HELLO_WORLD_PROVIDER",
  description: "A simple example provider",
  get: async (_runtime, _message, _state) => {
    return {
      text: "I am a provider",
      values: {},
      data: {}
    };
  }
};

class StarterService extends Service {
  runtime;
  static serviceType = "starter";
  capabilityDescription = "This is a starter service which is attached to the agent through the starter plugin.";
  constructor(runtime) {
    super(runtime);
    this.runtime = runtime;
  }
  static async start(runtime) {
    logger.info("Starting starter service");
    const service = new StarterService(runtime);
    return service;
  }
  static async stop(runtime) {
    logger.info("Stopping starter service");
    const service = runtime.getService(StarterService.serviceType);
    if (!service) {
      throw new Error("Starter service not found");
    }
    service.stop();
  }
  async stop() {
    logger.info("Stopping StarterService");
  }
}
var starterPlugin = {
  name: "plugin-starter",
  description: "Plugin starter for elizaOS",
  config: {
    EXAMPLE_PLUGIN_VARIABLE: process.env.EXAMPLE_PLUGIN_VARIABLE
  },
  async init(config) {
    logger.debug("Plugin initialized");
    try {
      const validatedConfig = await configSchema.parseAsync(config);
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value)
          process.env[key] = value;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues?.map((e) => e.message)?.join(", ") || "Unknown validation error";
        throw new Error(`Invalid plugin configuration: ${errorMessages}`);
      }
      throw new Error(`Invalid plugin configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  models: {
    [ModelType.TEXT_SMALL]: async (_runtime, { prompt, stopSequences = [] }) => {
      return "Never gonna give you up, never gonna let you down, never gonna run around and desert you...";
    },
    [ModelType.TEXT_LARGE]: async (_runtime, {
      prompt,
      stopSequences = [],
      maxTokens = 8192,
      temperature = 0.7,
      frequencyPenalty = 0.7,
      presencePenalty = 0.7
    }) => {
      return "Never gonna make you cry, never gonna say goodbye, never gonna tell a lie and hurt you...";
    }
  },
  routes: [
    {
      name: "hello-world-route",
      path: "/helloworld",
      type: "GET",
      handler: async (_req, res) => {
        res.json({
          message: "Hello World!"
        });
      }
    },
    {
      name: "current-time-route",
      path: "/api/time",
      type: "GET",
      handler: async (_req, res) => {
        const now = new Date;
        res.json({
          timestamp: now.toISOString(),
          unix: Math.floor(now.getTime() / 1000),
          formatted: now.toLocaleString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      }
    }
  ],
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.debug("MESSAGE_RECEIVED event received");
        logger.debug({ keys: Object.keys(params) }, "MESSAGE_RECEIVED param keys");
      }
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        logger.debug("VOICE_MESSAGE_RECEIVED event received");
        logger.debug({ keys: Object.keys(params) }, "VOICE_MESSAGE_RECEIVED param keys");
      }
    ],
    WORLD_CONNECTED: [
      async (params) => {
        logger.debug("WORLD_CONNECTED event received");
        logger.debug({ keys: Object.keys(params) }, "WORLD_CONNECTED param keys");
      }
    ],
    WORLD_JOINED: [
      async (params) => {
        logger.debug("WORLD_JOINED event received");
        logger.debug({ keys: Object.keys(params) }, "WORLD_JOINED param keys");
      }
    ]
  },
  services: [StarterService],
  actions: [helloWorldAction],
  providers: [helloWorldProvider]
};

// src/index.ts
var src_default = starterPlugin;
export {
  starterPlugin,
  src_default as default,
  StarterService
};

//# debugId=66AB75656341D5D764756E2164756E21
//# sourceMappingURL=index.js.map
