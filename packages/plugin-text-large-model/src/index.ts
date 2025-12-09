import {
    Action,
    IAgentRuntime,
    Memory,
    Provider,
    Service,
    State,
    logger,
    ProviderResult,
} from "@elizaos/core";

/**
 * TEXT_LARGE Model Handler Plugin for NeuroPhoto Agent
 *
 * Регистрирует модель TEXT_LARGE через OpenRouter API с использованием Gemini 3 Pro
 * для обработки промптов генерации изображений
 */

const TextLargeModelHandler = {
    async handle(runtime: IAgentRuntime, params: any): Promise<string> {
        try {
            logger.info("[TEXT_LARGE] Обработка запроса через Gemini 3 Pro...", { params });

            const openrouterApiKey = runtime.getSetting("OPENROUTER_API_KEY");

            if (!openrouterApiKey) {
                logger.warn("[TEXT_LARGE] OPENROUTER_API_KEY не найден в настройках");
                return "⚠️ API ключ OpenRouter не настроен. Пожалуйста, добавьте OPENROUTER_API_KEY в настройки.";
            }

            const prompt = params.prompt || params.text || "Создай изображение";
            logger.info(`[TEXT_LARGE] Обрабатываю промпт: "${prompt}"`);

            // Вызов OpenRouter API с Gemini 3 Pro
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openrouterApiKey}`,
                    "HTTP-Referer": "https://vibee.elizaos.dev",
                    "X-Title": "VIBEE NeuroPhoto"
                },
                body: JSON.stringify({
                    model: "google/gemini-3-pro-exp-02-05",
                    messages: [
                        {
                            role: "system",
                            content: `Ты - специалист по генерации изображений с использованием LoRA моделей.
Твоя задача - анализировать запрос пользователя и создать оптимальный промпт для генерации изображения.

ВАЖНО:
1. Если пользователь просит создать фото себя (персонализированное изображение), скажи что нужна LoRA модель
2. Если пользователь просит обычное изображение, создай детальный промпт для генерации
3. Всегда отвечай на русском языке
4. Используй эмодзи для лучшего восприятия

Примеры ответов:
- Для персонализированного запроса: "🎨 Отлично! Для создания персонального изображения с вашим лицом нужно сначала обучить LoRA модель через команду /face train"
- Для обычного изображения: "🎨 Создаю изображение: [детальный промпт]" или "Не могу создать такое изображение, попробуйте другой запрос"`
                        },
                        {
                            role: "user",
                            content: `Пользователь просит: "${prompt}". Проанализируй запрос и дай ответ.`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000,
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                logger.error("[TEXT_LARGE] Ошибка API OpenRouter:", { status: response.status, error: errorData });
                throw new Error(`OpenRouter API error: ${response.status}`);
            }

            const data = await response.json();
            logger.info("[TEXT_LARGE] Получен ответ от Gemini 3 Pro", { data });

            const result = data.choices?.[0]?.message?.content || "Извините, не удалось обработать запрос.";
            logger.info(`[TEXT_LARGE] Результат: "${result}"`);

            return result;

        } catch (error) {
            logger.error("[TEXT_LARGE] Ошибка при обработке запроса:", error);
            return `❌ Ошибка при обработке запроса: ${error.message}`;
        }
    }
};

export default {
    name: "@elizaos/plugin-text-large-model",
    description: "TEXT_LARGE model handler for NeuroPhoto via OpenRouter + Gemini 3 Pro",
    actions: [
        {
            name: "GENERATE_NEUROPHOTO",
            description: "Генерация изображения для NeuroPhoto агента",
            handler: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<string> => {
                try {
                    logger.info("[GENERATE_NEUROPHOTO] Начинаю генерацию изображения...", { message: message.content?.text });

                    // Извлекаем промпт из сообщения
                    const prompt = message.content?.text || "Создай изображение";
                    logger.info(`[GENERATE_NEUROPHOTO] Промпт: "${prompt}"`);

                    // Определяем, является ли запрос персонализированным
                    const isPersonalRequest = /я\s+(сижу|стою|в|Rolls-Royce|смокинге|в\s+смокинге|фото|image|фотография|себя|меня)/i.test(prompt) ||
                                             /my\s+(photo|image|face|self)/i.test(prompt);

                    if (isPersonalRequest) {
                        logger.info("[GENERATE_NEUROPHOTO] Обнаружен персонализированный запрос, требующий LoRA");
                        return `🎨 **Нейрофото**

Для создания персонализированного изображения мне нужна ваша LoRA модель!

📋 **Шаги для создания:**
1. Отправьте 10-25 фотографий вашего лица (разные ракурсы, хорошее освещение)
2. Выполните команду: \`/face train <имя_модели>\`
3. После обучения LoRA я смогу создавать персональные изображения!

💡 **Пример:** \`/face train my_avatar\`

⏰ Обучение занимает ~10-15 минут. После этого я смогу создавать уникальные изображения именно с вашим лицом! ✨`;
                    }

                    // Для обычных запросов используем TEXT_LARGE модель
                    logger.info("[GENERATE_NEUROPHOTO] Обычный запрос, использую TEXT_LARGE модель");
                    const result = await TextLargeModelHandler.handle(runtime, { prompt });

                    logger.info(`[GENERATE_NEUROPHOTO] Генерация завершена: "${result}"`);
                    return result;

                } catch (error) {
                    logger.error("[GENERATE_NEUROPHOTO] Ошибка:", error);
                    return `❌ **Ошибка генерации**

Не удалось создать изображение: ${error.message}

🔧 **Попробуйте:**
- Уточнить запрос
- Использовать команду /face train для персональных изображений
- Проверить настройки API ключей`;
                }
            }
        }
    ],
    providers: [],
    services: []
};
