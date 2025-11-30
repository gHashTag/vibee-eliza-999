/**
 * Система валидации переменных окружения
 * Предотвращает ошибки конфигурации и обеспечивает корректную загрузку всех компонентов
 */

import dotenv from 'dotenv';

// Загружаем .env файл (для локальной разработки)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingCritical: string[];
}

interface EnvVarSpec {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  validate?: (value: string) => boolean;
}

export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private validationResults: ValidationResult | null = null;

  // Спецификация всех переменных окружения
  private readonly envSpecs: EnvVarSpec[] = [
    // 🔐 КРИТИЧЕСКИЕ - Infisical (обязательно в production)
    {
      name: 'INFISICAL_CLIENT_ID',
      required: true,
      description: 'Client ID для подключения к Infisical Cloud'
    },
    {
      name: 'INFISICAL_CLIENT_SECRET',
      required: true,
      description: 'Client Secret для подключения к Infisical Cloud'
    },
    {
      name: 'INFISICAL_PROJECT_ID',
      required: true,
      description: 'Project ID в Infisical Cloud'
    },
    {
      name: 'INFISICAL_ENVIRONMENT',
      required: true,
      description: 'Среда Infisical (dev/prod)'
    },

    // 🧪 NODE_ENV
    {
      name: 'NODE_ENV',
      required: true,
      description: 'Окружение приложения',
      validate: (value) => ['development', 'production', 'test'].includes(value)
    },

    // 🔑 Telegram Bot (загружается из Infisical)
    {
      name: 'TELEGRAM_BOT_TOKEN',
      required: true,
      description: 'Токен Telegram бота для авторизации'
    },

    // 🗄️ Database (загружается из Infisical)
    {
      name: 'POSTGRES_URL',
      required: true,
      description: 'URL подключения к PostgreSQL базе данных',
      validate: (value) => value.startsWith('postgresql://') || value.startsWith('postgres://')
    },

    // 🤖 LLM API Keys (загружаются из Infisical)
    {
      name: 'OPENROUTER_API_KEY',
      required: false,
      description: 'API ключ для OpenRouter LLM сервиса'
    },
    {
      name: 'OPENAI_API_KEY',
      required: false,
      description: 'API ключ для OpenAI'
    },
    {
      name: 'ANTHROPIC_API_KEY',
      required: false,
      description: 'API ключ для Anthropic Claude'
    },

    // 🖼️ Image Generation (загружается из Infisical)
    {
      name: 'FAL_KEY',
      required: false,
      description: 'API ключ для FAL AI генерации изображений'
    },

    // 📊 Monitoring (загружается из Infisical)
    {
      name: 'SENTRY_DSN',
      required: false,
      description: 'DSN для Sentry мониторинга ошибок'
    },
    {
      name: 'SENTRY_API_TOKEN',
      required: false,
      description: 'API токен для Sentry'
    },

    // 🌐 Discord (опционально)
    {
      name: 'DISCORD_APPLICATION_ID',
      required: false,
      description: 'ID Discord приложения'
    },
    {
      name: 'DISCORD_API_TOKEN',
      required: false,
      description: 'Токен Discord бота'
    },

    // 🐦 Twitter (опционально)
    {
      name: 'TWITTER_TARGET_USERS',
      required: false,
      description: 'Целевые пользователи Twitter'
    },
    {
      name: 'TWITTER_DRY_RUN',
      required: false,
      description: 'Режим dry run для Twitter',
      defaultValue: 'true'
    },

    // 🔐 Blockchain (опционально)
    {
      name: 'EVM_PRIVATE_KEY',
      required: false,
      description: 'Приватный ключ для EVM сетей'
    },
    {
      name: 'SOLANA_PRIVATE_KEY',
      required: false,
      description: 'Приватный ключ для Solana'
    }
  ];

  private constructor() {}

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  /**
   * Валидация всех переменных окружения
   */
  public validate(): ValidationResult {
    if (this.validationResults) {
      return this.validationResults;
    }

    console.log('\n🔍 ENVIRONMENT VALIDATION SYSTEM');
    console.log('=' .repeat(60));

    const errors: string[] = [];
    const warnings: string[] = [];
    const missingCritical: string[] = [];
    const loadedVars: string[] = [];

    // Проверяем загрузку .env файла
    if (process.env.NODE_ENV !== 'production') {
      console.log('📄 Loading .env file for local development...');
      const envVarsFromFile = Object.keys(process.env).filter(key =>
        !key.startsWith('_') &&
        !key.startsWith('npm_') &&
        !key.startsWith('CI') &&
        !key.startsWith('INFISICAL')
      );
      if (envVarsFromFile.length > 0) {
        console.log(`✅ Loaded ${envVarsFromFile.length} variables from .env`);
        loadedVars.push(...envVarsFromFile.slice(0, 5));
        if (envVarsFromFile.length > 5) {
          console.log(`   ... and ${envVarsFromFile.length - 5} more`);
        }
      } else {
        console.log('⚠️ No variables loaded from .env (this is normal in some cases)');
      }
    } else {
      console.log('🚀 Production mode: Using Infisical Cloud secrets');
    }

    // Проверяем каждую переменную
    console.log('\n📋 Checking environment variables...\n');

    for (const spec of this.envSpecs) {
      const value = process.env[spec.name];
      const isSet = value !== undefined && value !== null && value !== '';

      if (spec.required) {
        if (!isSet) {
          const error = `❌ MISSING: ${spec.name} - ${spec.description}`;
          errors.push(error);
          missingCritical.push(spec.name);
          console.log(error);

          // Проверяем, может ли эта переменная быть загружена из Infisical
          if (this.canLoadFromInfisical(spec.name)) {
            console.log(`   💡 Should be loaded from Infisical Cloud (env: ${process.env.INFISICAL_ENVIRONMENT || 'not set'})`);
          } else {
            console.log(`   💡 Add this variable to your .env file`);
          }
        } else {
          // Валидируем значение
          if (spec.validate && !spec.validate(value)) {
            const error = `❌ INVALID: ${spec.name} - Invalid format`;
            errors.push(error);
            console.log(error);
          } else {
            const success = `✅ OK: ${spec.name}`;
            console.log(success);
            loadedVars.push(spec.name);
          }
        }
      } else {
        // Опциональная переменная
        if (isSet) {
          if (spec.validate && !spec.validate(value)) {
            console.log(`⚠️ WARNING: ${spec.name} - Invalid format`);
          } else {
            console.log(`ℹ️  SET: ${spec.name} (optional)`);
          }
        } else {
          console.log(`⏭️  SKIP: ${spec.name} (optional) ${spec.defaultValue ? `(default: ${spec.defaultValue})` : ''}`);
        }
      }
    }

    // Проверяем специфичные для Infisical проблемы
    this.checkInfisicalConnection(errors);

    // Подводим итоги
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY:');
    console.log(`   ✅ Loaded: ${loadedVars.length} variables`);
    console.log(`   ❌ Errors: ${errors.length}`);
    console.log(`   ⚠️  Warnings: ${warnings.length}`);
    console.log(`   🔴 Critical Missing: ${missingCritical.length}`);

    if (missingCritical.length > 0) {
      console.log('\n🚨 CRITICAL ERRORS DETECTED:');
      missingCritical.forEach(varName => {
        console.log(`   - ${varName}`);
      });
    }

    if (errors.length === 0) {
      console.log('\n✅ ALL CRITICAL VARIABLES ARE SET!');
    }

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      missingCritical
    };

    this.validationResults = result;
    return result;
  }

  /**
   * Проверка подключения к Infisical
   */
  private checkInfisicalConnection(errors: string[]): void {
    const infisicalVars = ['INFISICAL_CLIENT_ID', 'INFISICAL_CLIENT_SECRET', 'INFISICAL_PROJECT_ID'];
    const infisicalMissing = infisicalVars.filter(name => !process.env[name]);

    if (infisicalMissing.length > 0) {
      errors.push('❌ Infisical Cloud variables missing - secrets cannot be loaded');
      console.log('\n🚨 INFISICAL CONNECTION ISSUE:');
      console.log('   Cannot connect to Infisical Cloud to load secrets');
      console.log('   All secrets will be unavailable!');
      return;
    }

    console.log('\n🔗 Infisical Cloud Connection:');
    console.log(`   Project ID: ${process.env.INFISICAL_PROJECT_ID}`);
    console.log(`   Environment: ${process.env.INFISICAL_ENVIRONMENT || 'not set'}`);
    console.log('   ✅ Configured to load secrets from cloud');
  }

  /**
   * Проверяет, может ли переменная быть загружена из Infisical
   */
  private canLoadFromInfisical(varName: string): boolean {
    // Все переменные кроме Infisical и NODE_ENV могут быть загружены из Infisical
    return !varName.startsWith('INFISICAL_') && varName !== 'NODE_ENV';
  }

  /**
   * Получить переменную с fallback
   */
  public getVar(name: string, defaultValue?: string): string | undefined {
    const value = process.env[name];
    if (value) {
      return value;
    }
    return defaultValue;
  }

  /**
   * Получить обязательную переменную (выбросит ошибку если не найдена)
   */
  public getRequiredVar(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
  }

  /**
   * Проверяет, все ли критические переменные загружены
   */
  public areCriticalVarsLoaded(): boolean {
    const result = this.validate();
    return result.missingCritical.length === 0;
  }

  /**
   * Получить детальный отчет о состоянии переменных
   */
  public getDetailedReport(): string {
    const result = this.validate();
    const report: string[] = [];

    report.push('ENVIRONMENT VALIDATION REPORT');
    report.push('=' .repeat(60));
    report.push(`Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
    report.push(`Errors: ${result.errors.length}`);
    report.push(`Warnings: ${result.warnings.length}`);
    report.push(`Missing Critical: ${result.missingCritical.length}`);
    report.push('');

    if (result.errors.length > 0) {
      report.push('ERRORS:');
      result.errors.forEach(err => report.push(`  ${err}`));
      report.push('');
    }

    if (result.warnings.length > 0) {
      report.push('WARNINGS:');
      result.warnings.forEach(warn => report.push(`  ${warn}`));
      report.push('');
    }

    if (result.missingCritical.length > 0) {
      report.push('MISSING CRITICAL VARIABLES:');
      result.missingCritical.forEach(varName => {
        const spec = this.envSpecs.find(s => s.name === varName);
        report.push(`  - ${varName}: ${spec?.description || 'No description'}`);
      });
      report.push('');
    }

    report.push('=' .repeat(60));

    return report.join('\n');
  }
}

// Экспортируем singleton instance
export const envValidator = EnvironmentValidator.getInstance();
