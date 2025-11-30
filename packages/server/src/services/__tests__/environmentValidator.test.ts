import { describe, test, expect, beforeEach, vi } from 'bun:test';
import { EnvironmentValidator } from '../environmentValidator';

describe('EnvironmentValidator', () => {
  let validator: EnvironmentValidator;

  beforeEach(() => {
    // Reset singleton instance
    (EnvironmentValidator as any).instance = null;

    // Clear environment variables
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('should return same instance on multiple calls', () => {
      const instance1 = EnvironmentValidator.getInstance();
      const instance2 = EnvironmentValidator.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('validate() - Critical Variables', () => {
    test('should fail when POSTGRES_URL is missing', () => {
      delete process.env.POSTGRES_URL;
      validator = EnvironmentValidator.getInstance();
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('POSTGRES_URL'))).toBe(true);
    });

    test('should fail when POSTGRES_URL is invalid', () => {
      process.env.POSTGRES_URL = 'invalid-url';
      validator = EnvironmentValidator.getInstance();
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('POSTGRES_URL'))).toBe(true);
    });

    test('should pass with valid Neon POSTGRES_URL', () => {
      process.env.POSTGRES_URL =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
      validator = EnvironmentValidator.getInstance();
      const result = validator.validate();

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should detect missing TELEGRAM_BOT_TOKEN', () => {
      process.env.POSTGRES_URL =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
      delete process.env.TELEGRAM_BOT_TOKEN;
      validator = EnvironmentValidator.getInstance();
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.warnings.some(w => w.includes('TELEGRAM_BOT_TOKEN'))).toBe(true);
    });

    test('should detect missing OPENROUTER_API_KEY', () => {
      process.env.POSTGRES_URL =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
      delete process.env.OPENROUTER_API_KEY;
      validator = EnvironmentValidator.getInstance();
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.warnings.some(w => w.includes('OPENROUTER_API_KEY'))).toBe(true);
    });
  });

  describe('validate() - Infisical Configuration', () => {
    test('should validate Infisical credentials', () => {
      process.env.POSTGRES_URL =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
      process.env.INFISICAL_CLIENT_ID = 'test-client-id';
      process.env.INFISICAL_CLIENT_SECRET = 'test-client-secret';
      process.env.INFISICAL_PROJECT_ID = 'test-project-id';
      process.env.INFISICAL_ENVIRONMENT = 'dev';

      validator = EnvironmentValidator.getInstance();
      const result = validator.validate();

      expect(result.errors.some(e => e.includes('INFISICAL_CLIENT_ID'))).toBe(false);
      expect(result.errors.some(e => e.includes('INFISICAL_CLIENT_SECRET'))).toBe(false);
      expect(result.errors.some(e => e.includes('INFISICAL_PROJECT_ID'))).toBe(false);
    });

    test('should fail when Infisical CLIENT_ID is missing', () => {
      process.env.POSTGRES_URL =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
      delete process.env.INFISICAL_CLIENT_ID;

      validator = EnvironmentValidator.getInstance();
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('INFISICAL_CLIENT_ID'))).toBe(true);
    });
  });

  describe('getDetailedReport()', () => {
    test('should generate detailed report with all sections', () => {
      process.env.POSTGRES_URL =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.OPENROUTER_API_KEY = 'test-key';

      validator = EnvironmentValidator.getInstance();
      const report = validator.getDetailedReport();

      expect(report).toContain('ENVIRONMENT VARIABLE VALIDATION');
      expect(report).toContain('✅ Loaded:');
      expect(report).toContain('❌ Errors:');
      expect(report).toContain('⚠️  Warnings:');
      expect(report).toContain('🔴 Critical Missing:');
    });

    test('should show correct counts when all is good', () => {
      process.env.POSTGRES_URL =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
      process.env.INFISICAL_CLIENT_ID = 'test';
      process.env.INFISICAL_CLIENT_SECRET = 'test';
      process.env.INFISICAL_PROJECT_ID = 'test';
      process.env.INFISICAL_ENVIRONMENT = 'dev';
      process.env.NODE_ENV = 'development';

      validator = EnvironmentValidator.getInstance();
      const report = validator.getDetailedReport();

      expect(report).toContain('✅ Loaded: 5 variables');
      expect(report).toContain('❌ Errors: 0');
      expect(report).toContain('🔴 Critical Missing: 0');
      expect(report).toContain('✅ ALL CRITICAL VARIABLES ARE SET!');
    });
  });

  describe('getLoadedVariables()', () => {
    test('should return list of loaded variables', () => {
      process.env.POSTGRES_URL =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
      process.env.INFISICAL_CLIENT_ID = 'test';

      validator = EnvironmentValidator.getInstance();
      const loaded = validator.getLoadedVariables();

      expect(loaded).toContain('POSTGRES_URL');
      expect(loaded).toContain('INFISICAL_CLIENT_ID');
      expect(loaded).not.toContain('TELEGRAM_BOT_TOKEN');
    });
  });

  describe('getMissingCriticalVariables()', () => {
    test('should return missing critical variables', () => {
      process.env.POSTGRES_URL =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
      delete process.env.INFISICAL_CLIENT_ID;

      validator = EnvironmentValidator.getInstance();
      const missing = validator.getMissingCriticalVariables();

      expect(missing).toContain('INFISICAL_CLIENT_ID');
      expect(missing).not.toContain('POSTGRES_URL');
    });

    test('should return empty array when all critical variables are present', () => {
      process.env.POSTGRES_URL =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
      process.env.INFISICAL_CLIENT_ID = 'test';
      process.env.INFISICAL_CLIENT_SECRET = 'test';
      process.env.INFISICAL_PROJECT_ID = 'test';
      process.env.INFISICAL_ENVIRONMENT = 'dev';

      validator = EnvironmentValidator.getInstance();
      const missing = validator.getMissingCriticalVariables();

      expect(missing.length).toBe(0);
    });
  });

  describe('Database URL Validation', () => {
    test('should accept standard postgres:// URLs', () => {
      const testUrls = [
        'postgresql://user:pass@host:5432/db',
        'postgres://user:pass@host:5432/db',
        'postgresql://user:pass@host/db',
      ];

      testUrls.forEach(url => {
        process.env.POSTGRES_URL = url;
        validator = EnvironmentValidator.getInstance();
        const result = validator.validate();
        expect(result.errors.some(e => e.includes('POSTGRES_URL'))).toBe(false);
      });
    });

    test('should accept Neon-specific URLs with SSL and channel_binding', () => {
      const neonUrl =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
      process.env.POSTGRES_URL = neonUrl;

      validator = EnvironmentValidator.getInstance();
      const result = validator.validate();

      expect(result.errors.some(e => e.includes('POSTGRES_URL'))).toBe(false);
      expect(result.valid).toBe(true);
    });

    test('should reject invalid URLs', () => {
      const invalidUrls = [
        'invalid-url',
        'http://example.com',
        '',
        'mysql://user:pass@host/db',
      ];

      invalidUrls.forEach(url => {
        process.env.POSTGRES_URL = url;
        validator = EnvironmentValidator.getInstance();
        const result = validator.validate();
        expect(result.errors.some(e => e.includes('POSTGRES_URL'))).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty environment gracefully', () => {
      // Clear all env vars
      Object.keys(process.env).forEach(key => {
        if (key.includes('POSTGRES') || key.includes('INFISICAL') || key.includes('TELEGRAM') || key.includes('OPENROUTER') || key.includes('FAL_')) {
          delete process.env[key];
        }
      });

      validator = EnvironmentValidator.getInstance();
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.criticalMissing.length).toBeGreaterThan(0);
    });

    test('should handle case when validation called multiple times', () => {
      process.env.POSTGRES_URL =
        'postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

      validator = EnvironmentValidator.getInstance();
      const result1 = validator.validate();
      const result2 = validator.validate();

      expect(result1.valid).toBe(result2.valid);
      expect(result1.errors.length).toBe(result2.errors.length);
    });
  });
});
