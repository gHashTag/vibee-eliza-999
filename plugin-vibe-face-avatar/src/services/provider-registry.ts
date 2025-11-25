import { ImageGenerationProvider } from "../types/provider.interface";

/**
 * Реестр всех провайдеров генерации изображений
 * Функциональный стиль, легко расширяемый
 */
export class ImageProviderRegistry {
  private providers = new Map<string, ImageGenerationProvider>();

  /**
   * Регистрация нового провайдера
   */
  register(provider: ImageGenerationProvider): void {
    this.providers.set(provider.name, provider);
    console.log(`✅ Зарегистрирован провайдер: ${provider.name}`);
  }

  /**
   * Получение провайдера по имени
   */
  get(name: string): ImageGenerationProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Получение всех провайдеров
   */
  getAll(): ImageGenerationProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Получение здоровых провайдеров
   */
  async getHealthyProviders(): Promise<ImageGenerationProvider[]> {
    const healthy: ImageGenerationProvider[] = [];

    for (const provider of this.providers.values()) {
      const health = await provider.healthCheck()();
      if (health.isRight() && health.value.status === "healthy") {
        healthy.push(provider);
      }
    }

    return healthy;
  }

  /**
   * Получение лучшего провайдера (по умолчанию первый здоровый)
   */
  async getBestProvider(): Promise<ImageGenerationProvider | undefined> {
    const healthy = await this.getHealthyProviders();
    return healthy[0];
  }
}

// Глобальный экземпляр реестра
export const imageProviderRegistry = new ImageProviderRegistry();
