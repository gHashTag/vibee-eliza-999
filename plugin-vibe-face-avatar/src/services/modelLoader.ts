import { TaskEither, tryCatchAsync } from '../utils/functional/result';
import { db, userModels } from '../db/client';
import { eq, and } from 'drizzle-orm';

/**
 * User Model from Database
 */
export interface UserModelDB {
  id: string;
  telegram_id: number;
  bot_name: string;
  model_name: string;
  model_url: string; // URL to LoRA on Fal.ai
  trigger_word: string; // e.g., 'NEURO_SAGE'
  gender?: string;
  status: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Load user's active LoRA models from database
 *
 * @param userIdentifier - User's Telegram ID (number) or UUID/identifier (string)
 * @param botName - Bot name (default: 'neuro_face_bot')
 * @returns TaskEither with array of user models or error
 *
 * @example
 * ```typescript
 * // For Telegram users (numeric ID)
 * const modelsTask = getUserModelsTask(123456);
 *
 * // For Web UI users (UUID string)
 * const modelsTask = getUserModelsTask('uuid-string-here');
 *
 * const models = await runTaskEither(modelsTask);
 *
 * fold(
 *   (error) => console.error('Failed to load models:', error),
 *   (models) => console.log('Loaded models:', models)
 * )(models);
 * ```
 */
export const getUserModelsTask = (
  userIdentifier: number | string,
  botName: string = 'neuro_face_bot'
): TaskEither<Error, UserModelDB[]> =>
  tryCatchAsync(
    async () => {
      try {
        let models;

        // Determine identifier type and search strategy
        if (typeof userIdentifier === 'number') {
          // Telegram user - search by telegram_id
          console.log(`[ModelLoader] Searching by telegram_id: ${userIdentifier}`);
          models = await db
            .select()
            .from(userModels)
            .where(
              and(
                eq(userModels.telegram_id, userIdentifier),
                eq(userModels.bot_name, botName),
                eq(userModels.is_active, true),
                eq(userModels.status, 'completed') // Only completed models
              )
            )
            .orderBy(userModels.created_at); // Most recent first
        } else {
          // Web UI user or UUID - try multiple strategies
          const identifier = userIdentifier as string;
          console.log(`[ModelLoader] Searching for identifier: ${identifier}`);

          // Strategy 1: Direct match on id field (if identifier is a model UUID)
          models = await db
            .select()
            .from(userModels)
            .where(
              and(
                eq(userModels.id, identifier),
                eq(userModels.bot_name, botName),
                eq(userModels.is_active, true),
                eq(userModels.status, 'completed')
              )
            )
            .orderBy(userModels.created_at);

          // Strategy 2: If no models found and identifier looks like telegram ID, try numeric conversion
          if (models.length === 0 && /^\d+$/.test(identifier)) {
            const telegramId = parseInt(identifier, 10);
            console.log(`[ModelLoader] Strategy 2: Trying as telegram_id: ${telegramId}`);
            models = await db
              .select()
              .from(userModels)
              .where(
                and(
                  eq(userModels.telegram_id, telegramId),
                  eq(userModels.bot_name, botName),
                  eq(userModels.is_active, true),
                  eq(userModels.status, 'completed')
                )
              )
              .orderBy(userModels.created_at);
          }
        }

        console.log(`[ModelLoader] Found ${models.length} active models for identifier: ${userIdentifier}`);

        return models as UserModelDB[];
      } catch (dbError) {
        console.error('[ModelLoader] Database query failed:', dbError);
        // Fallback: return empty array if DB is unavailable
        console.warn('[ModelLoader] Returning empty models array (DB unavailable)');
        return [];
      }
    },
    (error) => {
      const errorMessage = `Failed to load user models: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[ModelLoader] ${errorMessage}`);
      return new Error(errorMessage);
    }
  );

/**
 * Get a specific user model by ID
 * 
 * @param modelId - Model UUID
 * @returns TaskEither with model or error
 */
export const getUserModelByIdTask = (
  modelId: string
): TaskEither<Error, UserModelDB | null> =>
  tryCatchAsync(
    async () => {
      try {
        const [model] = await db
          .select()
          .from(userModels)
          .where(eq(userModels.id, modelId))
          .limit(1);
        
        return (model as UserModelDB) || null;
      } catch (dbError) {
        console.error('[ModelLoader] Failed to fetch model by ID:', dbError);
        return null;
      }
    },
    (error) => new Error(`Failed to load model: ${error}`)
  );
