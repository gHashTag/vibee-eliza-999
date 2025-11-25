import { IAgentRuntime } from "@elizaos/core";
import { imageProviderRegistry } from "./provider-registry";
import { ReplicateProvider } from "../providers/replicateProvider";
import { FalProvider } from "../providers/falProvider";

/**
 * Инициализация и регистрация всех провайдеров
 */
export function initializeProviders(runtime: IAgentRuntime): void {
  // Регистрация Replicate Provider
  const replicateApiKey = runtime.getSetting("REPLICATE_API_KEY");
  if (replicateApiKey) {
    const replicateProvider = new ReplicateProvider(replicateApiKey);
    imageProviderRegistry.register(replicateProvider);
  }

  // Регистрация Fal.ai Provider
  const falApiKey = runtime.getSetting("FAL_KEY");
  if (falApiKey) {
    const defaultLoRA = {
      path: runtime.getSetting("FAL_DEFAULT_LORA_PATH") || "",
      scale: Number(runtime.getSetting("FAL_DEFAULT_LORA_SCALE")) || 1.0,
      triggerWord: runtime.getSetting("FAL_LORA_TRIGGER") || "NEURO_SAGE",
    };

    const falProvider = new FalProvider(falApiKey, defaultLoRA);
    imageProviderRegistry.register(falProvider);
  }

  console.log(
    `✅ Зарегистрировано провайдеров: ${imageProviderRegistry.getAll().length}`
  );
}

/**
 * Инициализация провайдеров из переменных окружения (для API сервера)
 */
export function initializeProvidersFromEnv(): void {
  // Регистрация Replicate Provider
  const replicateApiKey = process.env.REPLICATE_API_KEY;
  if (replicateApiKey) {
    const replicateProvider = new ReplicateProvider(replicateApiKey);
    imageProviderRegistry.register(replicateProvider);
  }

  // Регистрация Fal.ai Provider
  const falApiKey = process.env.FAL_KEY;
  if (falApiKey) {
    const defaultLoRA = {
      path: process.env.FAL_DEFAULT_LORA_PATH || "",
      scale: Number(process.env.FAL_DEFAULT_LORA_SCALE) || 1.0,
      triggerWord: process.env.FAL_LORA_TRIGGER || "NEURO_SAGE",
    };

    const falProvider = new FalProvider(falApiKey, defaultLoRA);
    imageProviderRegistry.register(falProvider);
  }

  console.log(
    `✅ [Env Init] Зарегистрировано провайдеров: ${imageProviderRegistry.getAll().length}`
  );
}
