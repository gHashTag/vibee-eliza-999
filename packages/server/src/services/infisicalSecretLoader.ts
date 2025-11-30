/**
 * 🕉️ ЦЕНТРАЛИЗОВАННЫЙ СЕРВИС ЗАГРУЗКИ СЕКРЕТОВ ИЗ INFISICAL CLOUD
 *
 * ⚠️ КРИТИЧЕСКИ ВАЖНО: Этот сервис должен быть ЕДИНСТВЕННЫМ местом загрузки секретов!
 *
 * Правила использования:
 * 1. ВСЕГДА используйте этот сервис для загрузки секретов
 * 2. НИКОГДА не создавайте дублирующие функции загрузки секретов
 * 3. Вызывайте loadSecrets() ОДИН РАЗ при старте приложения
 * 4. После загрузки секреты доступны через process.env
 */

import { InfisicalSDK } from '@infisical/sdk';

export interface InfisicalConfig {
  clientId: string;
  clientSecret: string;
  projectId: string;
  environment: string;
  siteUrl?: string;
}

export interface SecretLoadResult {
  success: boolean;
  secretsLoaded: number;
  errors: string[];
  criticalSecrets: {
    [key: string]: 'loaded' | 'missing' | 'error';
  };
}

/**
 * Централизованный сервис для загрузки секретов из Infisical Cloud
 *
 * Использование:
 * ```typescript
 * import { InfisicalSecretLoader } from './services/infisicalSecretLoader';
 *
 * const loader = new InfisicalSecretLoader();
 * const result = await loader.loadSecrets();
 *
 * if (!result.success) {
 *   console.error('Failed to load secrets:', result.errors);
 *   process.exit(1);
 * }
 * ```
 */
export class InfisicalSecretLoader {
  private static instance: InfisicalSecretLoader | null = null;
  private loaded: boolean = false;
  private loadPromise: Promise<SecretLoadResult> | null = null;

  /**
   * Получить singleton экземпляр загрузчика
   */
  public static getInstance(): InfisicalSecretLoader {
    if (!InfisicalSecretLoader.instance) {
      InfisicalSecretLoader.instance = new InfisicalSecretLoader();
    }
    return InfisicalSecretLoader.instance;
  }

  /**
   * Загрузить секреты из Infisical Cloud
   *
   * @param config - Опциональная конфигурация (если не указана, берется из process.env)
   * @param forceReload - Принудительная перезагрузка (по умолчанию false - загружает только один раз)
   * @returns Результат загрузки секретов
   */
  public async loadSecrets(
    config?: Partial<InfisicalConfig>,
    forceReload: boolean = false
  ): Promise<SecretLoadResult> {
    // Если уже загружено и не требуется перезагрузка, возвращаем кэшированный результат
    if (this.loaded && !forceReload && this.loadPromise) {
      return this.loadPromise;
    }

    // Если загрузка уже идет, возвращаем тот же промис
    if (this.loadPromise && !forceReload) {
      return this.loadPromise;
    }

    // Начинаем новую загрузку
    this.loadPromise = this._loadSecretsInternal(config);
    const result = await this.loadPromise;

    if (result.success) {
      this.loaded = true;
    }

    return result;
  }

  /**
   * Внутренняя реализация загрузки секретов
   */
  private async _loadSecretsInternal(config?: Partial<InfisicalConfig>): Promise<SecretLoadResult> {
    const result: SecretLoadResult = {
      success: false,
      secretsLoaded: 0,
      errors: [],
      criticalSecrets: {},
    };

    const criticalSecrets = [
      'POSTGRES_URL',
      'TELEGRAM_BOT_TOKEN',
      'OPENROUTER_API_KEY',
      'OPENAI_API_KEY',
    ];

    // Инициализируем criticalSecrets
    for (const secret of criticalSecrets) {
      result.criticalSecrets[secret] = 'missing';
    }

    try {
      // Шаг 1: Получаем конфигурацию
      const fullConfig = this._getConfig(config);

      if (!fullConfig) {
        result.errors.push('Infisical configuration is incomplete');
        return result;
      }

      console.log('\x1b[36m🔐\x1b[0m \x1b[33mЗАГРУЗКА СЕКРЕТОВ ИЗ INFISICAL CLOUD\x1b[0m');
      console.log(`\x1b[36m🔍 Определение environment:\x1b[0m`);
      console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
      console.log(`   INFISICAL_ENVIRONMENT (явный): ${fullConfig.environment}`);
      console.log(`   Используемый environment: \x1b[36m${fullConfig.environment}\x1b[0m`);
      console.log(`\x1b[36m🔑 Подключение к Infisical...\x1b[0m`);
      console.log(`   Project: \x1b[36m${fullConfig.projectId}\x1b[0m`);
      console.log(`   Environment: \x1b[36m${fullConfig.environment}\x1b[0m`);

      // Шаг 2: Инициализируем SDK
      const client = new InfisicalSDK({
        siteUrl: fullConfig.siteUrl || 'https://app.infisical.com',
      });

      // Шаг 3: Аутентификация
      const authenticatedClient = await client.auth().universalAuth.login({
        clientId: fullConfig.clientId,
        clientSecret: fullConfig.clientSecret,
      });

      console.log(`\x1b[32m✅ Аутентификация успешна!\x1b[0m`);

      // Шаг 4: Получаем секреты
      console.log(`\x1b[36m📥 Получение секретов...\x1b[0m`);
      const secretsResponse = await (authenticatedClient as any).secretsClient.listSecrets({
        projectId: fullConfig.projectId,
        environment: fullConfig.environment,
      });

      if (!secretsResponse || !secretsResponse.secrets || secretsResponse.secrets.length === 0) {
        result.errors.push('No secrets found in Infisical');
        console.log(`\x1b[33m⚠️  Секреты не найдены в Infisical\x1b[0m`);
        return result;
      }

      console.log(`\x1b[32m📊 Получено секретов: ${secretsResponse.secrets.length}\x1b[0m`);

      // Шаг 5: Устанавливаем переменные окружения
      let loadedCount = 0;
      const loadedSecrets = new Set<string>();

      for (const secret of secretsResponse.secrets) {
        if (!secret.secretKey || !secret.secretValue) {
          continue;
        }

        // Очищаем значение от возможных невидимых символов (переносы строк, пробелы)
        const cleanValue = secret.secretValue.trim().replace(/\s+/g, '');

        // Устанавливаем в process.env (перезаписываем существующие значения)
        process.env[secret.secretKey] = cleanValue;
        loadedSecrets.add(secret.secretKey);
        loadedCount++;

        // Проверяем критичные секреты
        if (criticalSecrets.includes(secret.secretKey)) {
          result.criticalSecrets[secret.secretKey] = 'loaded';

          // Показываем прогресс для критичных секретов
          const masked =
            cleanValue.length > 20
              ? `${cleanValue.substring(0, 8)}...${cleanValue.substring(cleanValue.length - 4)}`
              : '***скрыто***';
          console.log(`   \x1b[32m✓\x1b[0m ${secret.secretKey} = \x1b[36m${masked}\x1b[0m`);

          // Для POSTGRES_URL показываем дополнительную диагностику
          if (secret.secretKey === 'POSTGRES_URL') {
            console.log(`      Длина: ${cleanValue.length} символов`);
            console.log(`      Начинается с: "${cleanValue.substring(0, 30)}..."`);
            console.log(
              `      Заканчивается на: "...${cleanValue.substring(cleanValue.length - 30)}"`
            );
            try {
              const url = new URL(cleanValue);
              console.log(`      Хост: ${url.hostname}`);
              console.log(`      Порт: ${url.port || '5432'}`);
              console.log(`      База данных: ${url.pathname.substring(1)}`);
              console.log(`      Протокол: ${url.protocol}`);
              // Показываем маскированный URL для диагностики
              const maskedUrl = cleanValue.replace(/:([^:@]+)@/, ':***@');
              console.log(`      POSTGRES_URL (маскированный): ${maskedUrl}`);
            } catch (e) {
              console.log(`      ⚠️  Ошибка парсинга URL: ${e}`);
              console.log(`      Первые 50 символов: "${cleanValue.substring(0, 50)}"`);
              result.criticalSecrets[secret.secretKey] = 'error';
              result.errors.push(`POSTGRES_URL parsing error: ${e}`);
            }
          }
        }
      }

      result.secretsLoaded = loadedCount;
      console.log(
        `\x1b[32m🎉 Секреты загружены: ${loadedCount}/${secretsResponse.secrets.length}\x1b[0m\n`
      );

      // Проверяем наличие критичных секретов
      const missingCritical = criticalSecrets.filter((secret) => !loadedSecrets.has(secret));

      if (missingCritical.length > 0) {
        console.log(`\x1b[33m⚠️  ВНИМАНИЕ: Критичные секреты не найдены:\x1b[0m`);
        for (const secret of missingCritical) {
          console.log(`   - ${secret}`);
          result.criticalSecrets[secret] = 'missing';
        }
        result.errors.push(`Missing critical secrets: ${missingCritical.join(', ')}`);
      } else {
        console.log(`\x1b[32m✅ Все критичные секреты загружены!\x1b[0m\n`);
      }

      // Проверяем POSTGRES_URL отдельно
      const postgresUrl = process.env.POSTGRES_URL;
      if (!postgresUrl || postgresUrl.trim() === '') {
        console.log(`\x1b[33m⚠️  ВНИМАНИЕ: POSTGRES_URL не найден после загрузки секретов!\x1b[0m`);
        console.log(`\x1b[33m⚠️  Приложение может не подключиться к базе данных!\x1b[0m`);
        console.log(
          `\x1b[33m⚠️  Проверьте, что POSTGRES_URL установлен в Infisical Cloud!\x1b[0m\n`
        );
      } else {
        console.log(`\x1b[32m✅ POSTGRES_URL найден после загрузки секретов\x1b[0m\n`);
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      const errorStack = error.stack || 'No stack trace';

      console.log(`\x1b[31m❌ Ошибка загрузки секретов:\x1b[0m ${errorMessage}`);
      console.log(`\x1b[31m❌ Стек ошибки:\x1b[0m ${errorStack}\n`);

      result.errors.push(errorMessage);
      result.success = false;

      console.log(`\x1b[33m⚠️  ПРОДОЛЖАЕМ ЗАПУСК БЕЗ СЕКРЕТОВ ИЗ INFISICAL\x1b[0m`);
      console.log(`\x1b[33m⚠️  Это может привести к ошибкам подключения к базе данных!\x1b[0m\n`);

      return result;
    }
  }

  /**
   * Получить конфигурацию Infisical из process.env или переданной конфигурации
   */
  private _getConfig(config?: Partial<InfisicalConfig>): InfisicalConfig | null {
    const clientId = config?.clientId || process.env.INFISICAL_CLIENT_ID;
    const clientSecret = config?.clientSecret || process.env.INFISICAL_CLIENT_SECRET;
    const projectId = config?.projectId || process.env.INFISICAL_PROJECT_ID;

    if (!clientId || !clientSecret || !projectId) {
      return null;
    }

    // Определяем environment: в production используем 'production', иначе 'dev'
    // Но если явно указан INFISICAL_ENVIRONMENT, используем его
    const nodeEnv = process.env.NODE_ENV;
    const explicitEnv = config?.environment || process.env.INFISICAL_ENVIRONMENT;
    const environment = explicitEnv || (nodeEnv === 'production' ? 'production' : 'dev');

    return {
      clientId,
      clientSecret,
      projectId,
      environment,
      siteUrl: config?.siteUrl || 'https://app.infisical.com',
    };
  }

  /**
   * Проверить, загружены ли секреты
   */
  public isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Сбросить состояние загрузчика (для тестов)
   */
  public reset(): void {
    this.loaded = false;
    this.loadPromise = null;
    InfisicalSecretLoader.instance = null;
  }
}

/**
 * Удобная функция для загрузки секретов (использует singleton)
 */
export async function loadInfisicalSecrets(
  config?: Partial<InfisicalConfig>,
  forceReload: boolean = false
): Promise<SecretLoadResult> {
  const loader = InfisicalSecretLoader.getInstance();
  return loader.loadSecrets(config, forceReload);
}
