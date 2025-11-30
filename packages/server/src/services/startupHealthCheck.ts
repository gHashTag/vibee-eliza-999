/**
 * Система проверки здоровья приложения при запуске
 * Предотвращает запуск с некорректной конфигурацией
 */

import { envValidator } from './environmentValidator';
import { isDatabaseConfigured } from './drizzle';
import { sql } from 'drizzle-orm';

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'unhealthy';
  timestamp: string;
  checks: {
    environment: {
      status: 'ok' | 'warning' | 'error';
      message: string;
      details?: any;
    };
    database: {
      status: 'ok' | 'warning' | 'error';
      message: string;
      details?: any;
    };
    infisical: {
      status: 'ok' | 'warning' | 'error';
      message: string;
      details?: any;
    };
  };
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export class StartupHealthCheck {
  private static instance: StartupHealthCheck;
  private healthResult: HealthCheckResult | null = null;

  private constructor() {}

  public static getInstance(): StartupHealthCheck {
    if (!StartupHealthCheck.instance) {
      StartupHealthCheck.instance = new StartupHealthCheck();
    }
    return StartupHealthCheck.instance;
  }

  /**
   * Выполнить полную проверку здоровья приложения при запуске
   */
  public async performStartupChecks(): Promise<HealthCheckResult> {
    console.log('\n🏥 STARTUP HEALTH CHECK SYSTEM');
    console.log('='.repeat(70));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'not set'}`);
    console.log('');

    const checks = {
      environment: this.checkEnvironment(),
      database: await this.checkDatabase(),
      infisical: this.checkInfisical(),
    };

    // Подсчитываем статистику
    const summary = {
      totalChecks: 3,
      passed: 0,
      failed: 0,
      warnings: 0,
    };

    Object.values(checks).forEach((check) => {
      if (check.status === 'ok') summary.passed++;
      else if (check.status === 'error') summary.failed++;
      else if (check.status === 'warning') summary.warnings++;
    });

    // Определяем общий статус
    let overallStatus: 'healthy' | 'warning' | 'unhealthy';
    if (summary.failed > 0) {
      overallStatus = 'unhealthy';
    } else if (summary.warnings > 0) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'healthy';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      summary,
    };

    this.healthResult = result;
    this.displayResults(result);

    return result;
  }

  /**
   * Проверка переменных окружения
   */
  private checkEnvironment() {
    console.log('🔍 Checking Environment Variables...');

    const validation = envValidator.validate();

    if (validation.missingCritical.length === 0 && validation.errors.length === 0) {
      console.log('   ✅ All critical environment variables are set');
      return {
        status: 'ok' as const,
        message: 'All critical environment variables are configured',
        details: {
          loaded:
            validation.missingCritical.length === 0
              ? 'All required variables loaded'
              : 'Some variables missing',
        },
      };
    } else if (validation.warnings.length > 0) {
      console.log('   ⚠️ Some environment variables have warnings');
      return {
        status: 'warning' as const,
        message: 'Some environment variables have warnings',
        details: {
          warnings: validation.warnings,
          missing: validation.missingCritical,
        },
      };
    } else {
      console.log('   ❌ Critical environment variables are missing');
      return {
        status: 'error' as const,
        message: 'Critical environment variables are missing',
        details: {
          errors: validation.errors,
          missing: validation.missingCritical,
        },
      };
    }
  }

  /**
   * Проверка подключения к базе данных
   */
  private async checkDatabase() {
    console.log('🗄️ Checking Database Connection...');

    const postgresUrl = process.env.POSTGRES_URL;
    const dbConfigured = isDatabaseConfigured();
    const isProduction = process.env.NODE_ENV === 'production';

    // Если POSTGRES_URL пустой, используем PGLite fallback - это нормально
    if (!postgresUrl || postgresUrl.trim() === '') {
      console.log('   ✅ Using PGLite fallback mode (no PostgreSQL URL)');
      return {
        status: 'ok' as const,
        message: 'PGLite fallback mode is configured',
        details: {
          mode: 'PGLite',
          configured: true,
          note: 'Using local SQLite database',
        },
      };
    }

    if (!dbConfigured) {
      console.log('   ❌ Database configuration is invalid');
      // В production делаем WARNING вместо ERROR, чтобы не блокировать запуск
      if (isProduction) {
        console.log('   ⚠️ PRODUCTION MODE: Allowing server to start despite DB issues');
        return {
          status: 'warning' as const,
          message: 'Database configuration invalid in production - using fallback',
          details: {
            issue: 'POSTGRES_URL is not set or invalid',
            suggestion: 'Check Infisical Cloud configuration',
            mode: 'FALLBACK_TO_PGLITE',
          },
        };
      }
      return {
        status: 'error' as const,
        message: 'Database is not properly configured',
        details: {
          issue: 'POSTGRES_URL is not set or invalid',
          suggestion: 'Check Infisical Cloud configuration',
        },
      };
    }

    try {
      // Импортируем db динамически для избежания циклических зависимостей
      const { db } = await import('./drizzle');

      // Тестируем подключение
      const result = await db.execute(sql`SELECT 1 as test`);

      if (result && result.rows && result.rows.length > 0) {
        console.log('   ✅ Database connection successful');
        return {
          status: 'ok' as const,
          message: 'Database connection is working',
          details: {
            testQuery: 'SELECT 1 executed successfully',
            configured: true,
          },
        };
      } else {
        console.log('   ❌ Database test query failed');
        return {
          status: 'error' as const,
          message: 'Database test query returned unexpected result',
          details: {
            result,
          },
        };
      }
    } catch (error: any) {
      console.log(`   ❌ Database connection failed: ${error.message}`);

      // Дополнительная диагностика для ECONNREFUSED
      if (error.code === 'ECONNREFUSED') {
        console.log(`   🔍 Диагностика ECONNREFUSED:`);
        console.log(`      - POSTGRES_URL установлен: ${postgresUrl ? 'ДА' : 'НЕТ'}`);
        if (postgresUrl) {
          // Показываем хост из URL для диагностики
          try {
            const url = new URL(postgresUrl);
            console.log(`      - Длина URL: ${postgresUrl.length} символов`);
            console.log(`      - Хост базы данных: ${url.hostname}`);
            console.log(`      - Порт базы данных: ${url.port || '5432 (по умолчанию)'}`);
            console.log(`      - База данных: ${url.pathname.substring(1)}`);
            console.log(`      - Протокол: ${url.protocol}`);
            console.log(`      - Начинается с: "${postgresUrl.substring(0, 30)}..."`);
            console.log(
              `      - Заканчивается на: "...${postgresUrl.substring(postgresUrl.length - 30)}"`
            );
            // Показываем полный URL (маскируем только пароль)
            const maskedUrl = postgresUrl.replace(/:([^:@]+)@/, ':***@');
            console.log(`      - POSTGRES_URL (маскированный): ${maskedUrl}`);
          } catch (e) {
            console.log(`      - ⚠️  Не удалось разобрать POSTGRES_URL: ${e}`);
            console.log(`      - Первые 50 символов: "${postgresUrl.substring(0, 50)}"`);
          }
        }
        console.log(`   💡 Возможные причины:`);
        console.log(`      - База данных недоступна из сети Fly.io`);
        console.log(
          `      - Неправильный POSTGRES_URL в Infisical Cloud (environment: ${process.env.INFISICAL_ENVIRONMENT || 'dev'})`
        );
        console.log(`      - База данных не запущена или недоступна`);
        console.log(`      - Проблемы с сетью или файрволом`);
        console.log(
          `      - Проверьте, что POSTGRES_URL в Infisical Cloud указывает на доступную БД`
        );
      }

      return {
        status: 'error' as const,
        message: 'Database connection failed',
        details: {
          error: error.message,
          code: error.code,
          hint: error.hint,
          postgresUrlSet: !!postgresUrl,
          postgresUrlLength: postgresUrl ? postgresUrl.length : 0,
        },
      };
    }
  }

  /**
   * Проверка Infisical подключения
   */
  private checkInfisical() {
    console.log('🔐 Checking Infisical Configuration...');

    const requiredVars = [
      'INFISICAL_CLIENT_ID',
      'INFISICAL_CLIENT_SECRET',
      'INFISICAL_PROJECT_ID',
      'INFISICAL_ENVIRONMENT',
    ];

    const missing = requiredVars.filter((varName) => !process.env[varName]);

    if (missing.length === 0) {
      console.log('   ✅ Infisical configuration is complete');
      return {
        status: 'ok' as const,
        message: 'Infisical Cloud configuration is complete',
        details: {
          projectId: process.env.INFISICAL_PROJECT_ID,
          environment: process.env.INFISICAL_ENVIRONMENT,
          clientId: process.env.INFISICAL_CLIENT_ID ? 'Set' : 'Not set',
        },
      };
    } else {
      console.log(`   ❌ Infisical configuration is incomplete: ${missing.join(', ')}`);
      return {
        status: 'error' as const,
        message: 'Infisical Cloud configuration is incomplete',
        details: {
          missing,
          required: requiredVars,
        },
      };
    }
  }

  /**
   * Отображение результатов проверки
   */
  private displayResults(result: HealthCheckResult): void {
    console.log('\n📊 HEALTH CHECK RESULTS');
    console.log('='.repeat(70));

    const statusEmoji = {
      healthy: '✅',
      warning: '⚠️',
      unhealthy: '❌',
    };

    console.log(
      `\n🎯 Overall Status: ${statusEmoji[result.status]} ${result.status.toUpperCase()}`
    );
    console.log(
      `📈 Summary: ${result.summary.passed} passed, ${result.summary.warnings} warnings, ${result.summary.failed} failed`
    );

    // Детали по каждой проверке
    console.log('\n📋 Individual Checks:');

    Object.entries(result.checks).forEach(([name, check]) => {
      const emoji = {
        ok: '✅',
        warning: '⚠️',
        error: '❌',
      };
      console.log(`   ${emoji[check.status]} ${name}: ${check.message}`);
    });

    console.log('\n💡 RECOMMENDATIONS:');

    if (result.status === 'healthy') {
      console.log('   ✅ Application is ready to run!');
      console.log('   ✅ All systems are properly configured');
    } else if (result.status === 'warning') {
      console.log('   ⚠️ Application can run but some features may be limited');
      console.log('   ⚠️ Review warnings and consider fixing them');
    } else {
      console.log('   ❌ Application has critical configuration issues');
      console.log('   ❌ Fix errors before starting the application');
      console.log('   ❌ Check the details above for specific issues');
    }

    console.log('\n🔍 For detailed information, see the logs above');
    console.log('='.repeat(70) + '\n');

    // Сохраняем результат для дальнейшего использования
    process.env.HEALTH_CHECK_STATUS = result.status;
    process.env.HEALTH_CHECK_TIMESTAMP = result.timestamp;
  }

  /**
   * Получить текущие результаты проверки
   */
  public getHealthResult(): HealthCheckResult | null {
    return this.healthResult;
  }

  /**
   * Проверить, можно ли запускать приложение
   */
  public canStartApplication(): boolean {
    if (!this.healthResult) {
      console.warn('⚠️ Health check not performed yet');
      return false;
    }

    return this.healthResult.status !== 'unhealthy';
  }

  /**
   * Получить отчет в JSON формате
   */
  public getHealthReport(): string {
    if (!this.healthResult) {
      return JSON.stringify(
        {
          status: 'unknown',
          message: 'Health check not performed yet',
          timestamp: new Date().toISOString(),
        },
        null,
        2
      );
    }

    return JSON.stringify(this.healthResult, null, 2);
  }
}

// Экспортируем singleton instance
export const startupHealthCheck = StartupHealthCheck.getInstance();
