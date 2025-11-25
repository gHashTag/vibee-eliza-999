// Temporary simplified implementation for build compatibility
export interface UserSecret {
  key: string;
  value: string;
  updatedAt: string;
}

export interface UserSecrets {
  telegramId: string;
  secrets: UserSecret[];
}

/**
 * Сервис для работы с пользовательскими секретами через Infisical
 * Временно упрощенная реализация для совместимости сборки
 */
export class InfisicalService {
  private client: any = null;

  constructor() {
    // TODO: Implement proper Infisical SDK integration
    // The @infisical/sdk API has changed and needs to be updated
    // Temporary stub for build compatibility
  }

  /**
   * Получить секреты пользователя по Telegram ID
   */
  async getUserSecrets(telegramId: string, environment: string = 'dev'): Promise<UserSecret[]> {
    try {
      const path = `users/${telegramId}`;

      const secrets = await this.client.listSecrets({
        environment,
        path,
      });

      return secrets.secrets.map(s => ({
        key: s.secretKey,
        value: s.secretValue || '',
        updatedAt: s.updatedAt,
      }));
    } catch (error) {
      console.error(`Failed to get secrets for user ${telegramId}:`, error);
      return [];
    }
  }

  /**
   * Получить конкретный секрет пользователя
   */
  async getUserSecret(telegramId: string, secretName: string, environment: string = 'dev'): Promise<string | null> {
    try {
      const path = `users/${telegramId}/${secretName}`;

      const secret = await this.client.getSecret({
        environment,
        path,
      });

      return secret.secretValue || null;
    } catch (error) {
      console.error(`Failed to get secret ${secretName} for user ${telegramId}:`, error);
      return null;
    }
  }

  /**
   * Создать/обновить секрет пользователя
   */
  async setUserSecret(
    telegramId: string,
    secretName: string,
    secretValue: string,
    environment: string = 'dev'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const path = `users/${telegramId}/${secretName}`;

      // Сначала пробуем создать
      try {
        await this.client.createSecret({
          environment,
          path,
          type: 'shared',
          secretKey: secretName,
          secretValue,
        });
      } catch (createError: any) {
        // Если секрет уже существует, обновляем
        if (createError.message?.includes('already exists')) {
          await this.client.updateSecret({
            environment,
            path,
            secretKey: secretName,
            secretValue,
          });
        } else {
          throw createError;
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error(`Failed to set secret ${secretName} for user ${telegramId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Удалить секрет пользователя
   */
  async deleteUserSecret(telegramId: string, secretName: string, environment: string = 'dev'): Promise<{ success: boolean; error?: string }> {
    try {
      const path = `users/${telegramId}/${secretName}`;

      await this.client.deleteSecret({
        environment,
        path,
      });

      return { success: true };
    } catch (error: any) {
      console.error(`Failed to delete secret ${secretName} for user ${telegramId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Получить все пути секретов пользователя (для UI)
   */
  async getUserSecretPaths(telegramId: string, environment: string = 'dev'): Promise<UserSecret[]> {
    try {
      const secrets = await this.client.listSecrets({
        environment,
        path: `users/${telegramId}`,
      });

      return secrets.secrets.map(s => ({
        key: s.secretKey,
        value: '', // Не возвращаем значения в списке
        updatedAt: s.updatedAt,
      }));
    } catch (error) {
      return [];
    }
  }
}
