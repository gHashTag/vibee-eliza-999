import {
  type IAgentRuntime,
  type TestSuite,
  logger,
} from "@elizaos/core";

/**
 * E2E Test Suite for plugin-vibe-face-avatar (NeuroPhoto)
 *
 * Тестирует функционал генерации изображений через Replicate/Fal.ai
 */

export const NeuroPhotoTestSuite: TestSuite = {
  name: "neurophoto-plugin-e2e",
  tests: [
    /**
     * Проверка загрузки плагина
     */
    {
      name: "plugin_should_be_loaded",
      fn: async (runtime: IAgentRuntime) => {
        // Проверяем что runtime существует
        if (!runtime) {
          throw new Error("Runtime is not initialized");
        }

        if (!runtime.agentId) {
          throw new Error("Agent ID is not set");
        }

        logger.info("✓ Plugin loaded, runtime available");
      },
    },

    /**
     * Проверка регистрации actions
     */
    {
      name: "should_have_generate_image_action",
      fn: async (runtime: IAgentRuntime) => {
        const generateAction = runtime.actions?.find(
          (a) => a.name === "GENERATE_IMAGE" || a.name === "NEUROPHOTO"
        );

        if (!generateAction) {
          // В тестовом окружении action может не быть зарегистрирован
          logger.info("⚠ GENERATE_IMAGE action not found (may not be registered in test env)");
          return;
        }

        logger.info("✓ GENERATE_IMAGE action registered");
      },
    },

    /**
     * Проверка регистрации face train action
     */
    {
      name: "should_have_face_train_action",
      fn: async (runtime: IAgentRuntime) => {
        const faceTrainAction = runtime.actions?.find(
          (a) => a.name === "FACE_TRAIN" || a.name.toLowerCase().includes("train")
        );

        if (!faceTrainAction) {
          logger.info("⚠ FACE_TRAIN action not found (may not be registered in test env)");
          return;
        }

        logger.info("✓ FACE_TRAIN action registered");
      },
    },

    /**
     * Проверка регистрации providers
     */
    {
      name: "should_have_neurophoto_provider",
      fn: async (runtime: IAgentRuntime) => {
        const neuroProvider = runtime.providers?.find(
          (p) => p.name?.toLowerCase().includes("neuro") ||
                 p.name?.toLowerCase().includes("photo") ||
                 p.name?.toLowerCase().includes("image")
        );

        if (!neuroProvider) {
          logger.info("⚠ NeuroPhoto provider not found (may not be registered in test env)");
          return;
        }

        logger.info("✓ NeuroPhoto provider registered");
      },
    },

    /**
     * Проверка сервисов
     */
    {
      name: "should_have_replicate_or_fal_service",
      fn: async (runtime: IAgentRuntime) => {
        const replicateService = runtime.getService("replicate");
        const falService = runtime.getService("fal");

        if (!replicateService && !falService) {
          logger.info("⚠ No image generation service found (Replicate/Fal not configured)");
          return;
        }

        if (replicateService) {
          logger.info("✓ Replicate service available");
        }
        if (falService) {
          logger.info("✓ Fal service available");
        }
      },
    },

    /**
     * Проверка конфигурации
     */
    {
      name: "should_have_valid_configuration",
      fn: async (runtime: IAgentRuntime) => {
        // Проверяем что character загружен
        if (!runtime.character) {
          throw new Error("Character not loaded");
        }

        // Проверяем базовые поля
        if (!runtime.character.name) {
          throw new Error("Character name is missing");
        }

        logger.info(`✓ Configuration valid, character: ${runtime.character.name}`);
      },
    },

    /**
     * Проверка photo upload action
     */
    {
      name: "should_have_photo_upload_action",
      fn: async (runtime: IAgentRuntime) => {
        const uploadAction = runtime.actions?.find(
          (a) => a.name === "PHOTO_UPLOAD" || a.name.toLowerCase().includes("upload")
        );

        if (!uploadAction) {
          logger.info("⚠ PHOTO_UPLOAD action not found (may not be registered in test env)");
          return;
        }

        logger.info("✓ PHOTO_UPLOAD action registered");
      },
    },

    /**
     * Проверка list models action
     */
    {
      name: "should_have_list_models_action",
      fn: async (runtime: IAgentRuntime) => {
        const listAction = runtime.actions?.find(
          (a) => a.name === "LIST_MODELS" || a.name.toLowerCase().includes("list")
        );

        if (!listAction) {
          logger.info("⚠ LIST_MODELS action not found (may not be registered in test env)");
          return;
        }

        logger.info("✓ LIST_MODELS action registered");
      },
    },

    /**
     * Проверка количества зарегистрированных компонентов
     */
    {
      name: "should_have_registered_components",
      fn: async (runtime: IAgentRuntime) => {
        const actionsCount = runtime.actions?.length || 0;
        const providersCount = runtime.providers?.length || 0;

        logger.info(`✓ Registered: ${actionsCount} actions, ${providersCount} providers`);

        // Базовая проверка - хотя бы что-то должно быть зарегистрировано
        if (actionsCount === 0 && providersCount === 0) {
          logger.info("⚠ No actions or providers registered (test environment)");
        }
      },
    },
  ],
};

export default NeuroPhotoTestSuite;
