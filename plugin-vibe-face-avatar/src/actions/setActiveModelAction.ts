import { Action, ActionResult, ActionExample } from '@elizaos/core';
import { db } from '../db/client';
import { userModels } from '../db/client';
import { eq, and } from 'drizzle-orm';
import { uuidToTelegramId } from '../utils/userHelpers';

export const setActiveModelAction: Action = {
    name: 'SET_ACTIVE_MODEL',
    description: 'Активирует или деактивирует модель пользователя',

    validate: async (runtime, message) => {
        const text = message.content.text?.toLowerCase() || '';
        return text.includes('/activate model') ||
               text.includes('/deactivate model') ||
               text.includes('/toggle model');
    },

    handler: async (runtime, message, state, options, callback): Promise<ActionResult> => {
        try {
            const text = message.content.text || '';
            const parts = text.split(' ');
            const actionType = parts[0].toLowerCase(); // /activate or /deactivate
            const modelIdentifier = parts.slice(2).join(' ').trim();

            if (!modelIdentifier) {
                const command = actionType.includes('activate') ? '/activate' : '/deactivate';
                await callback({
                    text: `❌ Укажите название модели. Пример: \`${command} model MyModel\``,
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

            // Check if model status allows activation
            if (actionType.includes('activate') && model.status !== 'completed') {
                await callback({
                    text: `❌ Модель **${model.model_name}** имеет статус "${model.status}". Активировать можно только завершенные модели.`,
                });
                return { success: false, error: new Error('Cannot activate non-completed model') };
            }

            // Determine new active state
            let newActiveState: boolean;
            let actionDescription: string;

            if (actionType.includes('activate')) {
                newActiveState = true;
                actionDescription = 'активирована';
            } else if (actionType.includes('deactivate')) {
                newActiveState = false;
                actionDescription = 'деактивирована';
            } else {
                // toggle
                newActiveState = !model.is_active;
                actionDescription = newActiveState ? 'активирована' : 'деактивирована';
            }

            // If trying to activate and already active
            if (newActiveState && model.is_active) {
                await callback({
                    text: `ℹ️ Модель **${model.model_name}** уже активирована.`,
                });
                return { success: true, data: { alreadyActive: true } };
            }

            // If trying to deactivate and already inactive
            if (!newActiveState && !model.is_active) {
                await callback({
                    text: `ℹ️ Модель **${model.model_name}** уже деактивирована.`,
                });
                return { success: true, data: { alreadyInactive: true } };
            }

            // Update model status
            await db
                .update(userModels)
                .set({
                    is_active: newActiveState,
                    updated_at: new Date().toISOString(),
                })
                .where(eq(userModels.id, model.id));

            let responseText = `✅ Модель **${model.model_name}** ${actionDescription}.`;

            if (newActiveState) {
                responseText += ' Теперь она будет использоваться для генерации изображений.';

                // Check if user has multiple active models
                const activeModels = await db
                    .select()
                    .from(userModels)
                    .where(and(
                        eq(userModels.telegram_id, telegramId),
                        eq(userModels.is_active, true),
                        eq(userModels.status, 'completed'),
                        eq(userModels.id, model.id)
                    ));

                const allActiveModels = await db
                    .select()
                    .from(userModels)
                    .where(and(
                        eq(userModels.telegram_id, telegramId),
                        eq(userModels.is_active, true),
                        eq(userModels.status, 'completed')
                    ));

                if (allActiveModels.length > 1) {
                    responseText += '\n\nℹ️ У вас несколько активных моделей. При генерации будет использоваться самая новая.';
                }
            } else {
                responseText += ' Она не будет использоваться для генерации.';

                // Check if this is the last active model
                const remainingActiveModels = await db
                    .select()
                    .from(userModels)
                    .where(and(
                        eq(userModels.telegram_id, telegramId),
                        eq(userModels.is_active, true),
                        eq(userModels.status, 'completed')
                    ));

                if (remainingActiveModels.length === 0) {
                    responseText += '\n\n⚠️ Это ваша последняя активная модель. После деактивации вы не сможете генерировать изображения.';
                }
            }

            await callback({
                text: responseText,
            });

            return {
                success: true,
                data: {
                    model: {
                        id: model.id,
                        name: model.model_name,
                        trigger_word: model.trigger_word,
                    },
                    action: actionDescription,
                    newActiveState: newActiveState,
                },
            };
        } catch (error) {
            console.error('Error in setActiveModelAction:', error);
            await callback({
                text: '❌ Ошибка при изменении статуса модели. Попробуйте позже.',
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
                content: { text: '/activate model MyModel' },
            },
            {
                name: 'assistant',
                content: {
                    text: '✅ Модель **MyModel** активирована. Теперь она будет использоваться для генерации изображений.',
                },
            },
        ],
        [
            {
                name: 'user',
                content: { text: '/deactivate model MyModel' },
            },
            {
                name: 'assistant',
                content: {
                    text: '⏸️ Модель **MyModel** деактивирована. Она не будет использоваться для генерации.',
                },
            },
        ],
        [
            {
                name: 'user',
                content: { text: '/toggle model MyModel' },
            },
            {
                name: 'assistant',
                content: {
                    text: '✅ Модель **MyModel** деактивирована. Она не будет использоваться для генерации.',
                },
            },
        ],
    ] as ActionExample[][],
};
