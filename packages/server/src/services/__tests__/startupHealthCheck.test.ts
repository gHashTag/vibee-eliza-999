import { describe, test, expect, beforeEach, vi } from 'bun:test';
import { StartupHealthCheck } from '../startupHealthCheck';
import { EnvironmentValidator } from '../environmentValidator';

describe('StartupHealthCheck', () => {
  let healthCheck: StartupHealthCheck;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset environment
    process.env.POSTGRES_URL =
      'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
    process.env.INFISICAL_CLIENT_ID = '88fcf0cd-cce9-4844-bad2-8e19b4bad3ed';
    process.env.INFISICAL_CLIENT_SECRET = 'b377e7a60b669ea2317f339dc6cb79ce49d588a7bbed92433bb2a73dedff3314';
    process.env.INFISICAL_PROJECT_ID = 'fd763fa3-35d5-4045-93bd-1795c5f00fc3';
    process.env.INFISICAL_ENVIRONMENT = 'dev';
    process.env.NODE_ENV = 'development';
  });

  describe('performStartupChecks()', () => {
    test('should return healthy status when all checks pass', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.OPENROUTER_API_KEY = 'test-key';
      process.env.FAL_KEY = 'test-fal-key';

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.overall).toBe('healthy');
      expect(result.environment.status).toBe('healthy');
      expect(result.database.status).toBe('healthy');
      expect(result.infisical.status).toBe('healthy');
      expect(result.criticalErrors.length).toBe(0);
    });

    test('should return unhealthy status when environment validation fails', async () => {
      delete process.env.POSTGRES_URL;

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.overall).toBe('unhealthy');
      expect(result.environment.status).toBe('unhealthy');
      expect(result.criticalErrors.length).toBeGreaterThan(0);
    });

    test('should return warning status when optional variables are missing', async () => {
      // Critical vars present, but optional missing
      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.overall).toBe('warning');
      expect(result.environment.status).toBe('warning');
      expect(result.infisical.status).toBe('healthy');
      expect(result.database.status).toBe('healthy');
    });

    test('should collect all critical errors', async () => {
      delete process.env.POSTGRES_URL;
      delete process.env.INFISICAL_CLIENT_ID;

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.criticalErrors.length).toBeGreaterThanOrEqual(1);
      expect(result.criticalErrors[0]).toContain('POSTGRES_URL');
      expect(result.criticalErrors[0]).toContain('INFISICAL_CLIENT_ID');
    });
  });

  describe('canStartApplication()', () => {
    test('should return true when overall status is healthy', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.OPENROUTER_API_KEY = 'test-key';

      healthCheck = new StartupHealthCheck();
      await healthCheck.performStartupChecks();

      expect(healthCheck.canStartApplication()).toBe(true);
    });

    test('should return false when overall status is unhealthy', async () => {
      delete process.env.POSTGRES_URL;

      healthCheck = new StartupHealthCheck();
      await healthCheck.performStartupChecks();

      expect(healthCheck.canStartApplication()).toBe(false);
    });

    test('should return false when overall status is warning but has critical errors', async () => {
      // Set up warning state but with critical errors
      delete process.env.POSTGRES_URL;

      healthCheck = new StartupHealthCheck();
      await healthCheck.performStartupChecks();

      expect(healthCheck.canStartApplication()).toBe(false);
    });
  });

  describe('getOverallStatus()', () => {
    test('should return healthy for valid environment', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';

      healthCheck = new StartupHealthCheck();
      await healthCheck.performStartupChecks();

      expect(healthCheck.getOverallStatus()).toBe('healthy');
    });

    test('should return warning for missing optional variables', async () => {
      healthCheck = new StartupHealthCheck();
      await healthCheck.performStartupChecks();

      expect(healthCheck.getOverallStatus()).toBe('warning');
    });

    test('should return unhealthy for missing critical variables', async () => {
      delete process.env.POSTGRES_URL;

      healthCheck = new StartupHealthCheck();
      await healthCheck.performStartupChecks();

      expect(healthCheck.getOverallStatus()).toBe('unhealthy');
    });
  });

  describe('Environment Checks', () => {
    test('should validate Neon PostgreSQL URL format', async () => {
      const neonUrl =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
      process.env.POSTGRES_URL = neonUrl;

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.environment.status).toBe('warning'); // Warning because optional vars missing
      expect(result.environment.details).toContain('Neon PostgreSQL');
      expect(result.database.status).toBe('healthy');
    });

    test('should fail for invalid database URL', async () => {
      process.env.POSTGRES_URL = 'invalid-url';

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.environment.status).toBe('unhealthy');
      expect(result.database.status).toBe('unhealthy');
      expect(result.criticalErrors.length).toBeGreaterThan(0);
    });

    test('should validate all Infisical credentials', async () => {
      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.infisical.status).toBe('healthy');
      expect(result.infisical.details).toContain('Project ID');
      expect(result.infisical.details).toContain('Environment');
    });

    test('should detect missing Infisical CLIENT_ID', async () => {
      delete process.env.INFISICAL_CLIENT_ID;

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.infisical.status).toBe('unhealthy');
      expect(result.criticalErrors.some(e => e.includes('INFISICAL_CLIENT_ID'))).toBe(true);
    });

    test('should detect missing Infisical CLIENT_SECRET', async () => {
      delete process.env.INFISICAL_CLIENT_SECRET;

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.infisical.status).toBe('unhealthy');
      expect(result.criticalErrors.some(e => e.includes('INFISICAL_CLIENT_SECRET'))).toBe(true);
    });

    test('should validate INFISICAL_ENVIRONMENT', async () => {
      process.env.INFISICAL_ENVIRONMENT = 'production';

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.infisical.status).toBe('healthy');
    });
  });

  describe('Optional Variables Detection', () => {
    test('should detect missing TELEGRAM_BOT_TOKEN as warning', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.environment.warnings.some(w => w.includes('TELEGRAM_BOT_TOKEN'))).toBe(true);
      expect(result.environment.status).toBe('warning');
    });

    test('should detect missing OPENROUTER_API_KEY as warning', async () => {
      delete process.env.OPENROUTER_API_KEY;

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.environment.warnings.some(w => w.includes('OPENROUTER_API_KEY'))).toBe(true);
    });

    test('should detect missing FAL_KEY as warning', async () => {
      delete process.env.FAL_KEY;

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.environment.warnings.some(w => w.includes('FAL_KEY'))).toBe(true);
    });

    test('should pass when all optional variables are present', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.OPENROUTER_API_KEY = 'test-key';
      process.env.FAL_KEY = 'test-fal-key';

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.environment.status).toBe('healthy');
      expect(result.environment.warnings.length).toBe(0);
    });
  });

  describe('Integration with EnvironmentValidator', () => {
    test('should use EnvironmentValidator for validation', async () => {
      // Mock EnvironmentValidator
      const mockValidate = vi.fn().mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
        criticalMissing: [],
      });

      vi.spyOn(EnvironmentValidator, 'getInstance').mockReturnValue({
        validate: mockValidate,
        getDetailedReport: () => 'Mock Report',
        getLoadedVariables: () => [],
        getMissingCriticalVariables: () => [],
      } as any);

      healthCheck = new StartupHealthCheck();
      await healthCheck.performStartupChecks();

      expect(mockValidate).toHaveBeenCalled();
    });

    test('should handle validation failures correctly', async () => {
      vi.spyOn(EnvironmentValidator, 'getInstance').mockReturnValue({
        validate: () => ({
          valid: false,
          errors: ['POSTGRES_URL is required'],
          warnings: [],
          criticalMissing: ['POSTGRES_URL'],
        }),
        getDetailedReport: () => 'Mock Report',
        getLoadedVariables: () => [],
        getMissingCriticalVariables: () => ['POSTGRES_URL'],
      } as any);

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.overall).toBe('unhealthy');
      expect(result.criticalErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check Results Structure', () => {
    test('should return complete result structure', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('infisical');
      expect(result).toHaveProperty('criticalErrors');
      expect(result).toHaveProperty('warnings');

      expect(result.environment).toHaveProperty('status');
      expect(result.environment).toHaveProperty('details');
      expect(result.environment).toHaveProperty('errors');
      expect(result.environment).toHaveProperty('warnings');

      expect(result.database).toHaveProperty('status');
      expect(result.database).toHaveProperty('details');

      expect(result.infisical).toHaveProperty('status');
      expect(result.infisical).toHaveProperty('details');
    });

    test('should provide meaningful status descriptions', async () => {
      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(['healthy', 'warning', 'unhealthy']).toContain(result.overall);
      expect(['healthy', 'warning', 'unhealthy']).toContain(result.environment.status);
      expect(['healthy', 'warning', 'unhealthy']).toContain(result.database.status);
      expect(['healthy', 'warning', 'unhealthy']).toContain(result.infisical.status);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty environment', async () => {
      // Clear all env vars
      Object.keys(process.env).forEach(key => {
        if (key.includes('POSTGRES') || key.includes('INFISICAL') || key.includes('TELEGRAM') || key.includes('OPENROUTER') || key.includes('FAL_')) {
          delete process.env[key];
        }
      });

      healthCheck = new StartupHealthCheck();
      const result = await healthCheck.performStartupChecks();

      expect(result.overall).toBe('unhealthy');
      expect(result.criticalErrors.length).toBeGreaterThan(0);
      expect(result.canStart).toBe(false);
    });

    test('should be idempotent - calling multiple times gives same result', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';

      healthCheck = new StartupHealthCheck();
      const result1 = await healthCheck.performStartupChecks();
      const result2 = await healthCheck.performStartupChecks();

      expect(result1.overall).toBe(result2.overall);
      expect(result1.canStart).toBe(result2.canStart);
    });
  });
});
