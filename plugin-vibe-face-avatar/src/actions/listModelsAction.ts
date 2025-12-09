import { Action, ActionResult, ActionExample } from '@elizaos/core';
import { db } from '../db/client';
import { userModels } from '../db/client';
import { eq, and } from 'drizzle-orm';
import { uuidToTelegramId } from '../utils/userHelpers';

export const listModelsAction: Action = {
    name: 'LIST_MODELS',
    description: 'Список всех моделей пользователя с их статусом и индикаторами',

    validate: async (runtime, message) => {
        const text = message.content.text?.toLowerCase() || '';
        return text.includes('/list models') ||
               text.includes('/models') ||
               text.includes('/my models');
    },

    handler: async (runtime, message, state, options, callback): Promise<ActionResult> => {
        try {
            const telegramId = uuidToTelegramId(message.entityId);
            if (!telegramId) {
                await callback({
                    text: '❌ Ошибка определения пользователя. Попробуйте еще раз.',
                });
                return { success: false, error: new Error('Failed to extract telegram ID') };
            }

            // Query all user models (including inactive ones)
            const models = await db
                .select()
                .from(userModels)
                .where(and(
                    eq(userModels.telegram_id, telegramId),
                    eq(userModels.bot_name, 'neuro_face_bot')
                ))
                .orderBy(userModels.created_at);

            if (!models || models.length === 0) {
                await callback({
                    text: '📝 У вас пока нет моделей. Создайте первую командой `/face train`',
                });
                return { success: true, data: { models: [] } };
            }

            // Format the model list
            const formattedModels = models.map(model => {
                let statusIcon = '';
                let statusText = '';
                let statusEmoji = '';

                if (model.is_active) {
                    if (model.status === 'completed') {
                        statusEmoji = '✅';
                        statusText = 'Активна';
                    } else if (model.status === 'training') {
                        statusEmoji = '🔄';
                        statusText = 'В обучении';
                    } else if (model.status === 'failed') {
                        statusEmoji = '❌';
                        statusText = 'Ошибка обучения';
                    }
                } else {
                    statusEmoji = '⏸️';
                    statusText = 'Неактивна';
                }

                const createdDate = new Date(model.created_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                return `${statusEmoji} **${model.model_name}** (trigger: ${model.trigger_word})\n   ${statusText} - Создана: ${createdDate}\n`;
            });

            const messageText = `📋 **Ваши модели:**\n\n${formattedModels.join('\n')}\n\n💡 Используйте \`/activate model <имя>\` для активации, \`/deactivate model <имя>\` для деактивации.`;

            await callback({
                text: messageText,
            });

            return {
                success: true,
                data: {
                    models: models,
                    count: models.length,
                    activeCount: models.filter(m => m.is_active && m.status === 'completed').length,
                },
            };
        } catch (error) {
            console.error('Error in listModelsAction:', error);
            await callback({
                text: '❌ Ошибка при получении списка моделей. Попробуйте позже.',
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
                content: { text: '/list models' },
            },
            {
                name: 'assistant',
                content: {
                    text: '📋 **Ваши модели:**\n\n✅ **MyModel** (trigger: NEURO_SAGE)\n   Активна - Создана: 15 янв 2024\n\n⏸️ **OldModel** (trigger: NEURO_OLD)\n   Неактивна - Создана: 10 янв 2024\n\n💡 Используйте `/activate model <имя>` для активации.',
                },
            },
        ],
    ] as ActionExample[][],
};
