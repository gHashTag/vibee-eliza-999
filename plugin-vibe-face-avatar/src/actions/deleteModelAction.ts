import { Action, ActionResult, ActionExample } from '@elizaos/core';
import { db } from '../db/client';
import { userModels } from '../db/client';
import { eq, and } from 'drizzle-orm';
import { uuidToTelegramId } from '../utils/userHelpers';
import { randomUUID } from 'crypto';

export const deleteModelAction: Action = {
    name: 'DELETE_MODEL',
    description: 'Удаляет модель пользователя (мягкое удаление)',

    validate: async (runtime, message) => {
        const text = message.content.text?.toLowerCase() || '';
        return text.includes('/delete model') || text.includes('/remove model');
    },

    handler: async (runtime, message, state, options, callback): Promise<ActionResult> => {
        try {
            const text = message.content.text || '';
            const parts = text.split(' ');
            const modelIdentifier = parts.slice(2).join(' ').trim();

            if (!modelIdentifier) {
                await callback({
                    text: '❌ Укажите название модели. Пример: `/delete model MyModel`',
                });
                return { success: false, error: new Error('Model name not provided') };
            }

            const telegramId = uuidToTelegramId(message.userId);
            if (!telegramId) {
                await callback({
                    text: '❌ Ошибка определения пользователя. Попробуйте еще раз.',
                });
                return { success: false, error: new Error('Failed to extract telegram ID') };
            }

            // Try to find model by ID first (if it looks like a UUID)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelIdentifier);
            let model;

            if (isUUID) {
                const result = await db
                    .select()
                    .from(userModels)
                    .where(and(
                        eq(userModels.id, modelIdentifier),
                        eq(userModels.telegram_id, telegramId)
                    ));
                model = result[0];
            }

            // If not found by ID, try by name
            if (!model) {
                const result = await db
                    .select()
                    .from(userModels)
                    .where(and(
                        eq(userModels.model_name, modelIdentifier),
                        eq(userModels.telegram_id, telegramId)
                    ));
                model = result[0];
            }

            if (!model) {
                await callback({
                    text: '❌ Модель не найдена. Используйте `/list models` чтобы увидеть ваши модели.',
                });
                return { success: false, error: new Error('Model not found') };
            }

            // Check if this is the user's last active model
            const activeModels = await db
                .select()
                .from(userModels)
                .where(and(
                    eq(userModels.telegram_id, telegramId),
                    eq(userModels.is_active, true),
                    eq(userModels.status, 'completed')
                ));

            const isLastActive = activeModels.length === 1 && model.is_active && model.status === 'completed';

            // Perform soft delete
            await db
                .update(userModels)
                .set({
                    is_active: false,
                    updated_at: new Date().toISOString(),
                })
                .where(eq(userModels.id, model.id));

            let responseText = `✅ Модель **${model.model_name}** удалена. Вы можете восстановить её, обратившись в поддержку.`;

            if (isLastActive) {
                responseText += '\n\n⚠️ Это была ваша последняя активная модель. После удаления вы не сможете генерировать изображения.';
            }

            await callback({
                text: responseText,
            });

            return {
                success: true,
                data: {
                    deletedModel: {
                        id: model.id,
                        name: model.model_name,
                        trigger_word: model.trigger_word,
                    },
                    wasLastActive: isLastActive,
                },
            };
        } catch (error) {
            console.error('Error in deleteModelAction:', error);
            await callback({
                text: '❌ Ошибка при удалении модели. Попробуйте позже.',
            });
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    },

    examples: [
        [
            {
                name: 'user',
                content: { text: '/delete model MyModel' },
            },
            {
                name: 'assistant',
                content: {
                    text: '✅ Модель **MyModel** удалена. Вы можете восстановить её, обратившись в поддержку.',
                },
            },
        ],
        [
            {
                name: 'user',
                content: { text: '/remove model OldModel' },
            },
            {
                name: 'assistant',
                content: {
                    text: '✅ Модель **OldModel** удалена. Вы можете восстановить её, обратившись в поддержку.',
                },
            },
        ],
    ] as ActionExample[][],
};
