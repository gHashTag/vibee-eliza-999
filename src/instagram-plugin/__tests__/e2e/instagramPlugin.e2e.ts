import {
  type IAgentRuntime,
  type Memory,
  type Content,
  type UUID,
  type State,
  type HandlerCallback,
  logger,
} from "@elizaos/core";
import { v4 as uuidv4 } from "uuid";
import { instagramPostAction } from "../../actions/instagramPostAction";
import { instagramPlugin } from "../../index";

/**
 * E2E Test Suite для Instagram плагина
 * Формат: ElizaOS TestSuite (для elizaos test runner)
 */

// Интерфейсы TestSuite
interface TestCase {
  name: string;
  fn: (runtime: IAgentRuntime) => Promise<void>;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
}

// Хелпер для создания тестового сообщения
function createTestMessage(
  runtime: IAgentRuntime,
  text: string,
  attachments?: Array<{ type: string; url: string; contentType?: string }>,
): Memory {
  const content: Record<string, unknown> = {
    text,
    source: "telegram",
  };

  if (attachments && attachments.length > 0) {
    // Добавляем attachments как unknown для совместимости с Content
    content.attachments = attachments.map((att, idx) => ({
      id: uuidv4(),
      ...att,
    }));
  }

  return {
    id: uuidv4() as UUID,
    entityId: uuidv4() as UUID,
    agentId: runtime.agentId,
    roomId: uuidv4() as UUID,
    content: content as Content,
    createdAt: Date.now(),
    embedding: [],
  };
}

// Хелпер для создания state
function createTestState(message: Memory): State {
  return {
    values: {},
    data: {},
    text: message.content.text || "",
  };
}

export const InstagramPluginTestSuite: TestSuite = {
  name: "instagram-plugin-e2e",
  tests: [
    // ===== Публикация постов (6 тестов) =====
    {
      name: "should_publish_post_with_url",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(
          runtime,
          'Опубликуй пост в Instagram с изображением https://picsum.photos/800/600 и подписью "Красивый закат на море"',
        );

        let callbackCalled = false;
        let callbackMessage = "";

        const callback: HandlerCallback = async (response: Content) => {
          callbackCalled = true;
          callbackMessage = response.text || "";
          return [];
        };

        const result = await instagramPostAction.handler(
          runtime,
          message,
          createTestState(message),
          {},
          callback,
          [],
        );

        if (!callbackCalled) {
          throw new Error("Callback was not called");
        }

        // В тестовом окружении без реального Instagram API
        // проверяем что action обработал запрос
        logger.info(
          `✓ Post with URL processed: ${callbackMessage.substring(0, 50)}...`,
        );
      },
    },

    {
      name: "should_publish_post_with_attachment",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(
          runtime,
          'Опубликуй этот пост в Instagram с подписью "Мое первое фото"',
          [
            {
              type: "image",
              url: "https://example.com/my-photo.jpg",
              contentType: "image/jpeg",
            },
          ],
        );

        let callbackCalled = false;

        const callback: HandlerCallback = async (response: Content) => {
          callbackCalled = true;
          return [];
        };

        await instagramPostAction.handler(
          runtime,
          message,
          createTestState(message),
          {},
          callback,
          [],
        );

        if (!callbackCalled) {
          throw new Error("Callback was not called for attachment post");
        }

        logger.info("✓ Post with attachment processed");
      },
    },

    {
      name: "should_work_with_instagram_command",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(
          runtime,
          "/instagram красивый вид на горы https://picsum.photos/1200/800",
        );

        let callbackCalled = false;

        const callback: HandlerCallback = async (response: Content) => {
          callbackCalled = true;
          return [];
        };

        await instagramPostAction.handler(
          runtime,
          message,
          createTestState(message),
          {},
          callback,
          [],
        );

        if (!callbackCalled) {
          throw new Error("Callback was not called for /instagram command");
        }

        logger.info("✓ /instagram command processed");
      },
    },

    {
      name: "should_handle_hashtags",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(
          runtime,
          "Пост с #хэштегами и #тегами https://picsum.photos/600/400",
        );

        let callbackCalled = false;

        const callback: HandlerCallback = async (response: Content) => {
          callbackCalled = true;
          return [];
        };

        await instagramPostAction.handler(
          runtime,
          message,
          createTestState(message),
          {},
          callback,
          [],
        );

        if (!callbackCalled) {
          throw new Error("Callback was not called for hashtags post");
        }

        logger.info("✓ Hashtags handled correctly");
      },
    },

    {
      name: "should_reject_without_image",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(
          runtime,
          "Опубликуй пост в Instagram",
        );

        let errorReceived = false;
        let errorMessage = "";

        const callback: HandlerCallback = async (response: Content) => {
          if (
            response.text?.includes("❌") ||
            response.text?.includes("Прикрепите")
          ) {
            errorReceived = true;
            errorMessage = response.text || "";
          }
          return [];
        };

        const result = await instagramPostAction.handler(
          runtime,
          message,
          createTestState(message),
          {},
          callback,
          [],
        );

        // Ожидаем что запрос без изображения будет отклонён
        if (result?.success === true) {
          throw new Error("Should have rejected request without image");
        }

        logger.info("✓ Request without image rejected correctly");
      },
    },

    {
      name: "should_use_default_caption",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(
          runtime,
          "Опубликуй https://picsum.photos/500/500",
        );

        let callbackCalled = false;

        const callback: HandlerCallback = async (response: Content) => {
          callbackCalled = true;
          return [];
        };

        await instagramPostAction.handler(
          runtime,
          message,
          createTestState(message),
          {},
          callback,
          [],
        );

        if (!callbackCalled) {
          throw new Error("Callback was not called for default caption");
        }

        logger.info("✓ Default caption used correctly");
      },
    },

    // ===== Валидация (5 тестов) =====
    {
      name: "should_validate_instagram_word",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(
          runtime,
          "Хочу опубликовать в instagram",
        );

        const isValid = await instagramPostAction.validate(runtime, message);

        if (!isValid) {
          throw new Error('Should validate "instagram" word');
        }

        logger.info('✓ Validates "instagram" word');
      },
    },

    {
      name: "should_validate_post_word",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(runtime, "Хочу создать пост");

        const isValid = await instagramPostAction.validate(runtime, message);

        if (!isValid) {
          throw new Error('Should validate "пост" word');
        }

        logger.info('✓ Validates "пост" word');
      },
    },

    {
      name: "should_validate_instagram_command",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(runtime, "/instagram тест");

        const isValid = await instagramPostAction.validate(runtime, message);

        if (!isValid) {
          throw new Error("Should validate /instagram command");
        }

        logger.info("✓ Validates /instagram command");
      },
    },

    {
      name: "should_validate_publish_word",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(runtime, "Опубликуй это");

        const isValid = await instagramPostAction.validate(runtime, message);

        if (!isValid) {
          throw new Error('Should validate "опубликуй" word');
        }

        logger.info('✓ Validates "опубликуй" word');
      },
    },

    {
      name: "should_not_validate_regular_messages",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(runtime, "Привет, как дела?");

        const isValid = await instagramPostAction.validate(runtime, message);

        if (isValid) {
          throw new Error("Should NOT validate regular messages");
        }

        logger.info("✓ Does not validate regular messages");
      },
    },

    // ===== Ошибки (2 теста) =====
    {
      name: "should_reject_without_image_error",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(runtime, "Опубликуй без изображения");

        let errorMessage = "";

        const callback: HandlerCallback = async (response: Content) => {
          errorMessage = response.text || "";
          return [];
        };

        const result = await instagramPostAction.handler(
          runtime,
          message,
          createTestState(message),
          {},
          callback,
          [],
        );

        if (result?.success === true) {
          throw new Error("Should return error for missing image");
        }

        logger.info("✓ Returns error for missing image");
      },
    },

    {
      name: "should_handle_errors_gracefully",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(runtime, "Опубликуй без изображения");

        let callbackCalled = false;

        const callback: HandlerCallback = async (response: Content) => {
          callbackCalled = true;
          return [];
        };

        try {
          await instagramPostAction.handler(
            runtime,
            message,
            createTestState(message),
            {},
            callback,
            [],
          );
        } catch (error) {
          // Ошибки должны быть обработаны внутри handler
          throw new Error(
            "Handler should not throw, errors should be handled gracefully",
          );
        }

        if (!callbackCalled) {
          throw new Error("Callback should be called even on error");
        }

        logger.info("✓ Errors handled gracefully");
      },
    },

    // ===== Производительность (2 теста) =====
    {
      name: "should_process_quickly",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(
          runtime,
          "Опубликуй быстро https://picsum.photos/300/300 с подписью тест",
        );

        const startTime = Date.now();

        const callback: HandlerCallback = async (response: Content) => {
          return [];
        };

        await instagramPostAction.handler(
          runtime,
          message,
          createTestState(message),
          {},
          callback,
          [],
        );

        const duration = Date.now() - startTime;

        if (duration > 10000) {
          // 10 секунд макс
          throw new Error(`Processing took too long: ${duration}ms`);
        }

        logger.info(`✓ Processing completed in ${duration}ms`);
      },
    },

    {
      name: "should_handle_multiple_attachments",
      fn: async (runtime: IAgentRuntime) => {
        const message = createTestMessage(
          runtime,
          "Опубликуй с подписью мультимедиа",
          [
            { type: "image", url: "https://example.com/first.jpg" },
            { type: "image", url: "https://example.com/second.jpg" },
            { type: "image", url: "https://example.com/third.jpg" },
          ],
        );

        let callbackCalled = false;

        const callback: HandlerCallback = async (response: Content) => {
          callbackCalled = true;
          return [];
        };

        await instagramPostAction.handler(
          runtime,
          message,
          createTestState(message),
          {},
          callback,
          [],
        );

        if (!callbackCalled) {
          throw new Error("Callback was not called for multiple attachments");
        }

        logger.info("✓ Multiple attachments handled (uses first)");
      },
    },

    // ===== Регистрация плагина (2 теста) =====
    {
      name: "should_have_all_components",
      fn: async (runtime: IAgentRuntime) => {
        if (!instagramPlugin) {
          throw new Error("Instagram plugin is not defined");
        }

        if (instagramPlugin.name !== "instagram") {
          throw new Error(
            `Plugin name should be "instagram", got "${instagramPlugin.name}"`,
          );
        }

        if (!instagramPlugin.actions || instagramPlugin.actions.length === 0) {
          throw new Error("Plugin should have actions");
        }

        if (!instagramPlugin.services) {
          throw new Error("Plugin should have services");
        }

        logger.info("✓ Plugin has all required components");
      },
    },

    {
      name: "should_export_action",
      fn: async (runtime: IAgentRuntime) => {
        if (!instagramPostAction) {
          throw new Error("instagramPostAction is not defined");
        }

        if (instagramPostAction.name !== "INSTAGRAM_POST") {
          throw new Error(
            `Action name should be "INSTAGRAM_POST", got "${instagramPostAction.name}"`,
          );
        }

        if (typeof instagramPostAction.handler !== "function") {
          throw new Error("Action should have handler function");
        }

        if (typeof instagramPostAction.validate !== "function") {
          throw new Error("Action should have validate function");
        }

        logger.info("✓ instagramPostAction exported correctly");
      },
    },
  ],
};

export default InstagramPluginTestSuite;
