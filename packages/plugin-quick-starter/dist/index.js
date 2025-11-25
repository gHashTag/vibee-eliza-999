// src/plugin.ts
import {
  ModelType,
  Service,
  logger,
  EventType
} from "@elizaos/core";
import { z } from "zod";
var configSchema = z.object({
  EXAMPLE_PLUGIN_VARIABLE: z.string().min(1, "Example plugin variable is not provided").optional().transform((val) => {
    if (!val) {
      logger.warn("Example plugin variable is not provided (this is expected)");
    }
    return val;
  })
});
var quickAction = {
  name: "QUICK_ACTION",
  similes: ["GREET", "SAY_HELLO", "HELLO_WORLD"],
  description: "Responds with a simple hello world message",
  validate: async (_runtime, _message, _state) => {
    return true;
  },
  handler: async (_runtime, message, _state, _options = {}, callback, _responses) => {
    try {
      const response = "Hello world!";
      if (callback) {
        await callback({
          text: response,
          actions: ["QUICK_ACTION"],
          source: message.content.source
        });
      }
      return {
        text: response,
        success: true,
        data: {
          actions: ["QUICK_ACTION"],
          source: message.content.source
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you say hello?"
        }
      },
      {
        name: "{{name2}}",
        content: {
          text: "hello world!",
          actions: ["QUICK_ACTION"]
        }
      }
    ]
  ]
};
var quickProvider = {
  name: "QUICK_PROVIDER",
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
  static serviceType = "starter";
  capabilityDescription = "This is a starter service which is attached to the agent through the starter plugin.";
  constructor(runtime) {
    super(runtime);
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
    if ("stop" in service && typeof service.stop === "function") {
      await service.stop();
    }
  }
  async stop() {
    logger.info("Starter service stopped");
  }
}
var starterPlugin = {
  name: "plugin-quick-starter",
  description: "Quick backend-only plugin template for elizaOS",
  config: {
    EXAMPLE_PLUGIN_VARIABLE: process.env.EXAMPLE_PLUGIN_VARIABLE
  },
  async init(config) {
    logger.info("Initializing plugin-quick-starter");
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
      name: "api-status",
      path: "/api/status",
      type: "GET",
      handler: async (_req, res) => {
        res.json({
          status: "ok",
          plugin: "quick-starter",
          timestamp: new Date().toISOString()
        });
      }
    }
  ],
  events: {
    [EventType.MESSAGE_RECEIVED]: [
      async (params) => {
        logger.debug("MESSAGE_RECEIVED event received");
        logger.debug({ message: params.message }, "Message:");
      }
    ],
    [EventType.VOICE_MESSAGE_RECEIVED]: [
      async (params) => {
        logger.debug("VOICE_MESSAGE_RECEIVED event received");
        logger.debug({ message: params.message }, "Message:");
      }
    ],
    [EventType.WORLD_CONNECTED]: [
      async (params) => {
        logger.debug("WORLD_CONNECTED event received");
        logger.debug({ world: params.world }, "World:");
      }
    ],
    [EventType.WORLD_JOINED]: [
      async (params) => {
        logger.debug("WORLD_JOINED event received");
        logger.debug({ world: params.world }, "World:");
      }
    ]
  },
  services: [StarterService],
  actions: [quickAction],
  providers: [quickProvider]
};

// src/index.ts
var src_default = starterPlugin;
export {
  starterPlugin,
  src_default as default,
  StarterService
};

//# debugId=19B80FB8E6D49C0064756E2164756E21
//# sourceMappingURL=index.js.map
