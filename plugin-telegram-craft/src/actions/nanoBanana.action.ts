// @ts-nocheck
/**
 * nanoBanana.action.ts
 *
 * Action для генерации изображений и лидмагнитов через Nano Banana Pro
 *
 * Команды:
 * - /generate <prompt> - генерация изображения
 * - /gen <prompt> - короткая версия
 * - /leadmagnet <type> - создание лидмагнита из аватарки
 * - /edit <prompt> (ответ на фото) - редактирование фото
 */

import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionResult,
} from '@elizaos/core';
import { z } from 'zod';
import { NanoBananaService, type LeadMagnetOptions, type AspectRatio, type Resolution } from '../services/nanoBanana.service';
import { TelegramService } from '../services/telegram.service';
import { PaymentService, PRICES } from '../services/payment.service';
import { CryptoPaymentService, CRYPTO_RATES } from '../services/cryptoPayment.service';
import { detectGenderByName } from '../utils/genderDetection';
import { promptEnhancer } from '../services/promptEnhancer.service';

/**
 * Типы команд
 */
type CommandType = 'generate' | 'leadmagnet' | 'edit' | 'avatar_photo' | 'repeat';

/** Хранилище последнего промпта для повторной генерации (userId -> prompt) */
const lastPromptCache = new Map<string, string>();

/**
 * Схема валидации для генерации
 */
const GenerateInputSchema = z.object({
  prompt: z.string().min(3).max(1000),
  aspectRatio: z.enum(['1:1', '4:3', '16:9', '3:4', '9:16']).optional(),
  resolution: z.enum(['1K', '2K', '4K']).optional(),
});

/**
 * Схема для лидмагнита
 */
const LeadMagnetInputSchema = z.object({
  type: z.enum(['business_card', 'social_media', 'promo_banner', 'profile_photo', 'custom']),
  headline: z.string().optional(),
  customPrompt: z.string().optional(),
});

/**
 * NANO_BANANA_GENERATE Action
 *
 * Генерация изображений через Nano Banana Pro
 */
export const nanoBananaAction: Action = {
  name: 'NANO_BANANA_GENERATE',
  similes: ['GENERATE_IMAGE', 'CREATE_IMAGE', 'MAKE_PICTURE', 'LEADMAGNET'],
  description: 'Генерация изображений и лидмагнитов через Nano Banana Pro (google/nano-banana-pro)',

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';

    console.log('[NanoBanana] validate() called with text:', text.substring(0, 100));

    // Команды для генерации (БЕЗ /neurophoto - его обрабатывает plugin-vibe-face-avatar с LoRA)
    const generateCommands = ['/generate', '/gen', '/image', '/img', '/картинка'];
    const generateIntents = [
      'сгенерируй', 'нарисуй', 'создай картинку', 'создай изображение',
      'generate', 'create image', 'make image', 'draw',
    ];

    // Паттерны для кастомных фото с аватаркой
    const avatarPhotoIntents = [
      'сделай из моей аватарки', 'сделай из аватарки', 'из моей аватарки',
      'сделай фото', 'сделай мне фото', 'сделай моё фото',
      'фото сделай', 'фото где я', 'фото как я',
      'make me a photo', 'make photo from my avatar',
    ];

    // Команды для лидмагнитов
    const leadMagnetCommands = ['/leadmagnet', '/лидмагнит', '/визитка', '/аватар'];
    const leadMagnetIntents = [
      'создай визитку', 'сделай визитку', 'лидмагнит из аватарки',
      'business card', 'create lead magnet', 'make business card',
    ];

    // Команды для редактирования
    const editCommands = ['/edit', '/редактировать'];
    const editIntents = ['отредактируй', 'измени фото', 'edit photo'];

    // Команды для повторной генерации (короткие триггеры)
    const repeatTriggers = ['ещё', 'еще', 'ещё варианты', 'еще варианты', 'другой вариант'];
    const isRepeat = repeatTriggers.some((t) => text === t || text.startsWith(t + ' '));

    // === УМНОЕ ОПРЕДЕЛЕНИЕ НАМЕРЕНИЯ ===
    // Паттерны "я + где/как/кем" - пользователь описывает себя в ситуации
    const selfDescriptionPatterns = [
      /\bя\s+(в|на|как|типа|будто)\s+\w+/i,        // "я в клубе", "я на пляже", "я как супермен"
      /\b(меня|мне)\s+(в|на|как)\s+\w+/i,          // "меня в костюме", "мне как рокеру"
      /\bфото\s+.{2,30}$/i,                         // "фото астронавта", "фото киберпанк" (короткие запросы с "фото")
      /\b(хочу|давай|покажи)\s+.{0,10}(фото|картинк|изображ)/i, // "хочу фото", "давай картинку"
      /\bв\s+(стиле|образе|роли)\s+\w+/i,          // "в стиле киберпанк", "в образе рокера"
      /\b(супермен|бэтмен|астронавт|диджей|рокер|бизнесмен|пират|ковбой|самурай|ниндзя|викинг|рыцарь)\b/i, // популярные образы
    ];
    const isSelfDescription = selfDescriptionPatterns.some((pattern) => pattern.test(text));

    // Проверка на короткие креативные запросы (3-50 символов, без вопросов)
    const isShortCreativeRequest =
      text.length >= 3 &&
      text.length <= 50 &&
      !text.includes('?') &&
      !text.startsWith('как ') &&
      !text.startsWith('что ') &&
      !text.startsWith('почему ') &&
      !text.startsWith('когда ') &&
      (text.includes(' я ') || text.startsWith('я ') || text.endsWith(' я') || isSelfDescription);

    return (
      isRepeat ||
      generateCommands.some((cmd) => text.startsWith(cmd)) ||
      generateIntents.some((intent) => text.includes(intent)) ||
      avatarPhotoIntents.some((intent) => text.includes(intent)) ||
      leadMagnetCommands.some((cmd) => text.startsWith(cmd)) ||
      leadMagnetIntents.some((intent) => text.includes(intent)) ||
      editCommands.some((cmd) => text.startsWith(cmd)) ||
      editIntents.some((intent) => text.includes(intent)) ||
      isSelfDescription ||
      isShortCreativeRequest
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const text = message.content?.text || '';
      const lowerText = text.toLowerCase();

      // Получаем сервисы
      const nanoBanana = runtime.getService<NanoBananaService>('nano-banana');
      const telegram = runtime.getService<TelegramService>('telegram-craft');
      const paymentServiceForNano = runtime.getService<PaymentService>('payment');
      const cryptoPayment = runtime.getService<CryptoPaymentService>('crypto-payment');

      if (!nanoBanana) {
        throw new Error('NanoBananaService not available');
      }

      if (!nanoBanana.isAvailable()) {
        throw new Error('NanoBananaService not initialized. Check REPLICATE_API_KEY.');
      }

      // Определяем тип команды
      const commandType = detectCommandType(lowerText);

      switch (commandType) {
        case 'generate':
          return await handleGenerate(text, nanoBanana, telegram, message, callback, runtime);

        case 'leadmagnet':
          return await handleLeadMagnet(text, nanoBanana, telegram, message, callback);

        case 'edit':
          return await handleEdit(text, nanoBanana, telegram, message, callback);

        case 'avatar_photo':
          return await handleAvatarPhoto(text, nanoBanana, telegram, message, callback, paymentServiceForNano, cryptoPayment);

        case 'repeat':
          return await handleRepeat(nanoBanana, telegram, message, callback, paymentServiceForNano, cryptoPayment);

        default:
          throw new Error('Unknown command type');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const userFriendlyMessage = formatUserFriendlyError(errorMessage);

      await callback?.({
        text: userFriendlyMessage,
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
      };
    }
  },

  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: '/generate котик в космосе' },
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Генерирую изображение котика в космосе...',
          action: 'NANO_BANANA_GENERATE',
        },
      },
    ],
    [
      {
        user: '{{user1}}',
        content: { text: '/leadmagnet business_card' },
      },
      {
        user: '{{agent}}',
        content: {
          text: 'Создаю визитку из вашей аватарки...',
          action: 'NANO_BANANA_GENERATE',
        },
      },
    ],
  ],
};

/**
 * Определение типа команды
 */
function detectCommandType(text: string): CommandType {
  // Повторная генерация - проверяем ПЕРВЫМ
  const repeatTriggers = ['ещё', 'еще', 'ещё варианты', 'еще варианты', 'другой вариант'];
  if (repeatTriggers.some((t) => text === t || text.startsWith(t + ' '))) {
    return 'repeat';
  }

  const leadMagnetTriggers = ['/leadmagnet', '/лидмагнит', '/визитка', 'визитку', 'лидмагнит', 'business card', 'lead magnet'];
  const editTriggers = ['/edit', '/редактировать', 'отредактируй', 'измени фото'];

  // Кастомное фото из аватарки: "сделай из моей аватарки фото супермена"
  const avatarPhotoTriggers = [
    'сделай из моей аватарки', 'сделай из аватарки', 'из моей аватарки',
    'сделай фото', 'сделай мне фото', 'сделай моё фото',
    'make me a photo', 'make photo from my avatar',
  ];

  // Умные паттерны - пользователь описывает себя в ситуации
  const selfDescriptionPatterns = [
    /\bя\s+(в|на|как|типа|будто)\s+\w+/i,
    /\b(меня|мне)\s+(в|на|как)\s+\w+/i,
    /\bфото\s+.{2,30}$/i,
    /\b(хочу|давай|покажи)\s+.{0,10}(фото|картинк|изображ)/i,
    /\bв\s+(стиле|образе|роли)\s+\w+/i,
    /\b(супермен|бэтмен|астронавт|диджей|рокер|бизнесмен|пират|ковбой|самурай|ниндзя|викинг|рыцарь)\b/i,
  ];
  const isSelfDescription = selfDescriptionPatterns.some((pattern) => pattern.test(text));

  if (leadMagnetTriggers.some((t) => text.includes(t))) {
    return 'leadmagnet';
  }

  if (editTriggers.some((t) => text.includes(t))) {
    return 'edit';
  }

  // Проверка avatar_photo - включая умные паттерны
  if (avatarPhotoTriggers.some((t) => text.includes(t)) || isSelfDescription) {
    return 'avatar_photo';
  }

  // Короткие креативные запросы с "я" тоже идут в avatar_photo
  if (text.length <= 50 && (text.includes(' я ') || text.startsWith('я ') || text.endsWith(' я'))) {
    return 'avatar_photo';
  }

  return 'generate';
}

/**
 * Обработка генерации изображения
 * Поддерживает:
 * - Генерацию с нуля (только промпт)
 * - Генерацию из фото (1-14 фото в attachments)
 * - Смешивание фото (2+ фото)
 */
async function handleGenerate(
  text: string,
  nanoBanana: NanoBananaService,
  telegram: TelegramService | undefined,
  message: Memory,
  callback?: HandlerCallback,
  runtime?: IAgentRuntime
): Promise<ActionResult> {
  // Извлекаем промпт
  const prompt = extractPrompt(text);

  if (!prompt || prompt.length < 3) {
    await callback?.({
      text: 'Пожалуйста, укажите промпт для генерации. Пример: /generate котик в космосе',
    });
    return { success: false, error: new Error('Prompt required') };
  }

  // Извлекаем фото из attachments (от PhotoSessionService)
  const attachments = message.content?.attachments || [];
  const photoUrls = attachments
    .filter((a: any) => a.url && (a.contentType?.startsWith('image/') || a.type === 'image'))
    .map((a: any) => a.url);

  // Извлекаем параметры
  const params = extractGenerateParams(text);

  // RAG: Улучшаем промпт через knowledge base с гайдами по промптингу
  let enhancedPrompt = prompt;
  if (runtime) {
    try {
      console.log(`[NanoBanana] Улучшаю промпт через RAG: "${prompt.substring(0, 50)}..."`);
      enhancedPrompt = await promptEnhancer.enhancePrompt(prompt, runtime);
      console.log(`[NanoBanana] Улучшенный промпт: "${enhancedPrompt.substring(0, 80)}..."`);
    } catch (err) {
      console.warn('[NanoBanana] Ошибка улучшения промпта, используем оригинальный:', err);
    }
  }

  // Формируем сообщение статуса с улучшенным промптом
  const statusMsg = photoUrls.length > 1
    ? `Генерирую из ${photoUrls.length} фото...`
    : photoUrls.length === 1
    ? `Генерирую с твоим фото...`
    : `Генерирую: "${enhancedPrompt.substring(0, 60)}${enhancedPrompt.length > 60 ? '...' : ''}"`;

  await callback?.({
    text: statusMsg,
  });

  // Генерируем с улучшенным промптом
  const result = photoUrls.length >= 2
    ? await nanoBanana.blendImages(photoUrls, enhancedPrompt, {
        aspectRatio: params.aspectRatio,
        resolution: params.resolution,
      })
    : await nanoBanana.generate({
        prompt: enhancedPrompt,
        images: photoUrls,
        aspectRatio: params.aspectRatio,
        resolution: params.resolution,
      });

  if (!result.success || !result.imageUrl) {
    throw new Error(result.error || 'Generation failed');
  }

  // Отправляем изображение через Telegram
  if (telegram && message.roomId) {
    const chatId = extractChatId(message);
    if (chatId) {
      const caption = photoUrls.length > 0
        ? `Создано из ${photoUrls.length} фото: ${prompt}`
        : `Сгенерировано: ${prompt}`;
      await telegram.sendPhoto(chatId, result.imageUrl, caption);
    }
  }

  // Формируем финальное сообщение
  const modelName = result.metadata?.model || 'google/nano-banana-pro';
  const successMsg = photoUrls.length > 1
    ? `Готово! Создано из ${photoUrls.length} фото.`
    : photoUrls.length === 1
    ? `Готово! Изображение создано с твоим фото.`
    : `Готово! Изображение сгенерировано.\n\nХочешь с твоими фото? Отправь фото и напиши что сделать.`;

  await callback?.({
    text: successMsg,
    attachments: [{ url: result.imageUrl, type: 'image' }],
  });

  return {
    success: true,
    data: {
      imageUrl: result.imageUrl,
      metadata: result.metadata,
    },
  };
}

/**
 * Обработка создания лидмагнита
 */
async function handleLeadMagnet(
  text: string,
  nanoBanana: NanoBananaService,
  telegram: TelegramService | undefined,
  message: Memory,
  callback?: HandlerCallback
): Promise<ActionResult> {
  // Определяем тип лидмагнита
  const leadMagnetType = extractLeadMagnetType(text);

  // Получаем аватарку пользователя
  let avatarUrl: string | undefined;

  if (telegram && message.userId) {
    try {
      const userId = message.userId.toString();
      avatarUrl = await telegram.getUserAvatar(userId);
    } catch (e) {
      console.warn('Could not get user avatar:', e);
    }
  }

  if (!avatarUrl) {
    await callback?.({
      text: 'Не удалось получить твою аватарку. Отправь фото с командой /leadmagnet для создания лидмагнита.',
    });
    return { success: false, error: new Error('Avatar not found') };
  }

  // Извлекаем заголовок если есть
  const headline = extractHeadline(text);

  // Получаем имя пользователя
  const userName = message.content?.name || 'User';

  await callback?.({
    text: `Создаю ${getLeadMagnetTypeName(leadMagnetType)} из твоей аватарки...`,
  });

  const result = await nanoBanana.createLeadMagnet({
    avatarUrl,
    type: leadMagnetType,
    userName,
    headline: headline || undefined,
  });

  if (!result.success || !result.imageUrl) {
    throw new Error(result.error || 'Lead magnet creation failed');
  }

  // Отправляем изображение
  if (telegram && message.roomId) {
    const chatId = extractChatId(message);
    if (chatId) {
      await telegram.sendPhoto(chatId, result.imageUrl, `${getLeadMagnetTypeName(leadMagnetType)} для ${userName}`);
    }
  }

  await callback?.({
    text: `Готово! ${getLeadMagnetTypeName(leadMagnetType)} создан.\n\nДругие варианты:\n- /leadmagnet business_card - визитка\n- /leadmagnet social_media - аватар для соцсетей\n- /leadmagnet promo_banner - промо-баннер`,
    attachments: [{ url: result.imageUrl, type: 'image' }],
  });

  return {
    success: true,
    data: {
      imageUrl: result.imageUrl,
      type: leadMagnetType,
    },
  };
}

/**
 * Обработка редактирования фото
 */
async function handleEdit(
  text: string,
  nanoBanana: NanoBananaService,
  telegram: TelegramService | undefined,
  message: Memory,
  callback?: HandlerCallback
): Promise<ActionResult> {
  // Проверяем есть ли прикреплённое фото
  const photoUrl = message.content?.attachments?.[0]?.url ||
                   message.content?.replyTo?.attachments?.[0]?.url;

  if (!photoUrl) {
    await callback?.({
      text: 'Для редактирования отправь фото или ответь на сообщение с фото, добавив промпт что изменить.',
    });
    return { success: false, error: new Error('Photo required') };
  }

  const prompt = extractPrompt(text);

  if (!prompt || prompt.length < 3) {
    await callback?.({
      text: 'Напиши что нужно изменить на фото. Пример: /edit сделай фон космическим',
    });
    return { success: false, error: new Error('Prompt required') };
  }

  await callback?.({
    text: `Редактирую фото: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
  });

  const result = await nanoBanana.editPhoto(photoUrl, prompt);

  if (!result.success || !result.imageUrl) {
    throw new Error(result.error || 'Edit failed');
  }

  // Отправляем результат
  if (telegram && message.roomId) {
    const chatId = extractChatId(message);
    if (chatId) {
      await telegram.sendPhoto(chatId, result.imageUrl, `Отредактировано: ${prompt}`);
    }
  }

  await callback?.({
    text: 'Готово! Фото отредактировано.',
    attachments: [{ url: result.imageUrl, type: 'image' }],
  });

  return {
    success: true,
    data: {
      imageUrl: result.imageUrl,
      originalPrompt: prompt,
    },
  };
}

/**
 * Обработка кастомного фото из аватарки
 * Примеры: "сделай из моей аватарки фото супермена", "сделай фото как бизнесмен"
 */
async function handleAvatarPhoto(
  text: string,
  nanoBanana: NanoBananaService,
  telegram: TelegramService | undefined,
  message: Memory,
  callback?: HandlerCallback,
  paymentService?: PaymentService | null,
  cryptoPayment?: CryptoPaymentService | null
): Promise<ActionResult> {
  // Извлекаем Telegram ID из metadata сообщения
  const telegramUserId = (message.content as any)?.metadata?.fromId
    || (message.content as any)?.fromId
    || (message as any).fromId;

  // ============ ПРОВЕРКА КВОТЫ ============
  if (paymentService && telegramUserId) {
    const userId = telegramUserId.toString();
    const hasPhotos = paymentService.hasAvailablePhotos(userId);

    if (!hasPhotos) {
      // Уведомляем владельца о paywall
      paymentService.notifyOwner('paywall', {
        userId,
        username: (message.content as any)?.metadata?.username,
        firstName: (message.content as any)?.metadata?.firstName,
        chatId: extractChatId(message) || undefined,
      }).catch((err) => console.error('Failed to notify owner about paywall', err));

      // Показываем инструкцию оплаты
      const paymentInstructions = generatePaymentInstructions(cryptoPayment);
      await callback?.({
        text: paymentInstructions,
      });
      return { success: false, error: new Error('Quota exhausted') };
    }
  }

  // Определяем пол пользователя по имени из metadata
  const firstName = (message.content as any)?.metadata?.firstName;
  const lastName = (message.content as any)?.metadata?.lastName;
  const username = (message.content as any)?.metadata?.username;
  const detectedGender = detectGenderByName(firstName, lastName, username);
  console.log(`[AvatarPhoto] Detected gender: ${detectedGender} for firstName="${firstName}", username="${username}"`);

  // Извлекаем кастомный промпт с учётом пола
  const customPrompt = extractAvatarPhotoPrompt(text, detectedGender);

  if (!customPrompt || customPrompt.length < 3) {
    await callback?.({
      text: 'Напиши что хочешь получить. Пример: "сделай из моей аватарки фото супермена" или "сделай фото в стиле киберпанк"',
    });
    return { success: false, error: new Error('Prompt required') };
  }

  // Получаем аватарку пользователя
  let avatarUrl: string | undefined;

  console.log('[AvatarPhoto] Looking for avatar, telegramUserId:', telegramUserId, 'message.userId:', message.userId);

  if (telegram && telegramUserId) {
    try {
      avatarUrl = await telegram.getUserAvatar(telegramUserId.toString());
      console.log('[AvatarPhoto] Got avatar URL:', avatarUrl ? `${avatarUrl.substring(0, 50)}...` : 'null');
    } catch (e) {
      console.warn('[AvatarPhoto] Could not get user avatar:', e);
    }
  }

  if (!avatarUrl) {
    await callback?.({
      text: 'Не удалось получить твою аватарку. Убедись что у тебя есть фото профиля в Telegram.',
    });
    return { success: false, error: new Error('Avatar not found') };
  }

  // Извлекаем aspect ratio из запроса пользователя
  const aspectRatio = extractAspectRatio(text);

  await callback?.({
    text: `Создаю твоё персональное фото (${aspectRatio}): "${customPrompt.substring(0, 50)}${customPrompt.length > 50 ? '...' : ''}"...`,
  });

  // Генерируем с аватаркой как base image
  const result = await nanoBanana.generate({
    prompt: customPrompt,
    images: [avatarUrl],
    aspectRatio,
  });

  if (!result.success || !result.imageUrl) {
    throw new Error(result.error || 'Generation failed');
  }

  // ============ ИСПОЛЬЗОВАНИЕ КВОТЫ ============
  if (paymentService && telegramUserId) {
    const userId = telegramUserId.toString();

    // Проверяем, первая ли это генерация для пользователя
    const freeUsedBefore = paymentService.getFreePhotosUsed(userId);
    if (freeUsedBefore === 0) {
      // Уведомляем владельца о новом пользователе
      paymentService.notifyOwner('new_user', {
        userId,
        username: (message.content as any)?.metadata?.username,
        firstName: (message.content as any)?.metadata?.firstName,
        chatId: extractChatId(message) || undefined,
      }).catch((err) => console.error('Failed to notify owner about new user', err));
    }

    paymentService.usePhoto(userId);
    const quota = paymentService.getQuotaStatus(userId);
    console.log(`[AvatarPhoto] Used photo for user ${telegramUserId}, remaining: free=${quota.freeRemaining}, paid=${quota.paidPhotos}`);
  }

  // Отправляем изображение через Telegram
  if (telegram && message.roomId) {
    const chatId = extractChatId(message);
    if (chatId) {
      await telegram.sendPhoto(chatId, result.imageUrl, `Твоё AI-фото: ${customPrompt}`);
    }
  }

  // Используем централизованную функцию баланса
  const balanceMessage = paymentService && telegramUserId
    ? paymentService.formatBalanceMessage(telegramUserId.toString())
    : '';

  // Сохраняем промпт для повторной генерации
  if (telegramUserId) {
    lastPromptCache.set(telegramUserId.toString(), customPrompt);
  }

  const modelName = result.metadata?.model || 'google/nano-banana-pro';
  await callback?.({
    text: `Готово! Твоё персональное фото создано.${balanceMessage}\n\nХочешь ещё? Напиши "ещё" или новый промпт!`,
    attachments: [{ url: result.imageUrl, type: 'image' }],
  });

  return {
    success: true,
    data: {
      imageUrl: result.imageUrl,
      prompt: customPrompt,
    },
  };
}

/**
 * Обработка повторной генерации ("ещё")
 */
async function handleRepeat(
  nanoBanana: NanoBananaService,
  telegram: TelegramService | undefined,
  message: Memory,
  callback?: HandlerCallback,
  paymentService?: PaymentService | null,
  cryptoPayment?: CryptoPaymentService | null
): Promise<ActionResult> {
  const telegramUserId = (message.content as any)?.metadata?.fromId
    || (message.content as any)?.fromId
    || (message as any).fromId;

  if (!telegramUserId) {
    await callback?.({
      text: 'Не удалось определить пользователя. Напиши, что хочешь сгенерировать.',
    });
    return { success: false, error: new Error('User ID not found') };
  }

  const userId = telegramUserId.toString();
  const lastPrompt = lastPromptCache.get(userId);

  if (!lastPrompt) {
    await callback?.({
      text: 'Нет предыдущего запроса для повтора. Напиши, что хочешь сгенерировать!',
    });
    return { success: false, error: new Error('No previous prompt') };
  }

  // Используем handleAvatarPhoto с сохранённым промптом
  // Создаём fake message с последним промптом
  const fakeMessage = {
    ...message,
    content: {
      ...message.content,
      text: `сделай фото ${lastPrompt.replace('Professional photorealistic portrait, ', '').replace(', high quality, studio lighting', '')}`,
    },
  } as Memory;

  return await handleAvatarPhoto(
    fakeMessage.content?.text || lastPrompt,
    nanoBanana,
    telegram,
    fakeMessage,
    callback,
    paymentService,
    cryptoPayment
  );
}

/**
 * Генерация инструкции оплаты с лесенкой цен
 */
function generatePaymentInstructions(cryptoPayment?: CryptoPaymentService | null): string {
  // Наценка 150%: себестоимость ~4₽/фото, продаём по ~6₽/фото
  return `Бесплатный лимит исчерпан!

Выбери пакет фото:

📋 Рубли (через @push):
• @push 60 руб → 10 фото
• @push 150 руб → 25 фото
• @push 300 руб → 50 фото (+5 бонус!)
• @push 600 руб → 100 фото (+15 бонус!)
• @push 1200 руб → 200 фото (+40 бонус!)

💎 Крипто (1 TON ≈ 500₽, 1 USDT ≈ 100₽):
• @push 0.12 TON → 10 фото
• @push 0.3 TON → 25 фото
• @push 0.6 TON → 50 фото (+5 бонус!)
• @push 1.2 TON → 100 фото (+15 бонус!)

• @push 0.6 USDT → 10 фото
• @push 1.5 USDT → 25 фото
• @push 3 USDT → 50 фото (+5 бонус!)
• @push 6 USDT → 100 фото (+15 бонус!)

Просто отправь команду в этот чат, баланс пополнится автоматически!`;
}

/**
 * Извлечение размера из текста
 * Поддержка: квадрат/square, вертикаль/portrait, горизонталь/landscape, 4:3, 16:9 и т.д.
 */
function extractAspectRatio(text: string): AspectRatio {
  const lowerText = text.toLowerCase();

  // Explicit ratio formats
  if (lowerText.includes('1:1') || lowerText.includes('квадрат') || lowerText.includes('square')) {
    return '1:1';
  }
  if (lowerText.includes('16:9') || lowerText.includes('широкий') || lowerText.includes('wide') || lowerText.includes('landscape')) {
    return '16:9';
  }
  if (lowerText.includes('9:16') || lowerText.includes('вертикаль') || lowerText.includes('portrait') || lowerText.includes('stories') || lowerText.includes('reels')) {
    return '9:16';
  }
  if (lowerText.includes('4:3')) {
    return '4:3';
  }
  if (lowerText.includes('3:4')) {
    return '3:4';
  }

  // По умолчанию вертикальный формат (оптимально для Stories/Reels)
  return '9:16';
}

/**
 * Извлечение промпта для avatar_photo из текста
 * "сделай из моей аватарки фото супермена" → "superhero superman portrait"
 */
function extractAvatarPhotoPrompt(text: string, gender: 'male' | 'female' = 'male'): string {
  // Убираем триггеры и оставляем только описание
  const triggers = [
    'сделай из моей аватарки фото', 'сделай из аватарки фото',
    'сделай из моей аватарки', 'сделай из аватарки',
    'из моей аватарки', 'сделай фото', 'сделай мне фото', 'сделай моё фото',
    'make me a photo', 'make photo from my avatar',
  ];

  let prompt = text.toLowerCase();

  for (const trigger of triggers) {
    if (prompt.includes(trigger)) {
      prompt = prompt.replace(trigger, '').trim();
      break;
    }
  }

  // Убираем размеры из промпта (они обрабатываются отдельно)
  prompt = prompt
    .replace(/\b(квадрат|square|вертикаль|portrait|горизонталь|landscape|wide|широкий|stories|reels)\b/gi, '')
    .replace(/\b(1:1|4:3|16:9|9:16|3:4)\b/g, '')
    .trim();

  // Убираем лишние слова и формируем английский промпт для AI
  // Сохраняем оригинальное описание но добавляем контекст
  const cleanPrompt = prompt.replace(/^\s*(как|в образе|в стиле|типа)\s*/i, '').trim();

  // Определяем слово для пола
  const genderWord = gender === 'female' ? 'woman' : 'man';

  // Создаём английский промпт для генерации с указанием пола
  return `Professional photorealistic portrait of a ${genderWord}, ${cleanPrompt}, high quality, studio lighting`;
}

/**
 * Извлечение промпта из текста
 */
function extractPrompt(text: string): string {
  // Убираем команду
  const commands = ['/generate', '/gen', '/image', '/img', '/картинка', '/neurophoto', '/нейрофото', '/edit', '/редактировать'];
  let prompt = text;

  for (const cmd of commands) {
    if (prompt.toLowerCase().startsWith(cmd)) {
      prompt = prompt.substring(cmd.length).trim();
      break;
    }
  }

  // Убираем параметры вида --aspect 16:9
  prompt = prompt.replace(/--\w+\s+\S+/g, '').trim();

  return prompt;
}

/**
 * Извлечение параметров генерации
 */
function extractGenerateParams(text: string): { aspectRatio?: AspectRatio; resolution?: Resolution } {
  const params: { aspectRatio?: AspectRatio; resolution?: Resolution } = {};

  // Aspect ratio
  const aspectMatch = text.match(/--aspect\s+(1:1|4:3|16:9|3:4|9:16)/i);
  if (aspectMatch) {
    params.aspectRatio = aspectMatch[1] as AspectRatio;
  }

  // Resolution
  const resMatch = text.match(/--res(?:olution)?\s+(1K|2K|4K)/i);
  if (resMatch) {
    params.resolution = resMatch[1] as Resolution;
  }

  return params;
}

/**
 * Извлечение типа лидмагнита
 */
function extractLeadMagnetType(text: string): LeadMagnetOptions['type'] {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('business_card') || lowerText.includes('визитк')) {
    return 'business_card';
  }
  if (lowerText.includes('social_media') || lowerText.includes('соцсет') || lowerText.includes('аватар')) {
    return 'social_media';
  }
  if (lowerText.includes('promo_banner') || lowerText.includes('баннер') || lowerText.includes('промо')) {
    return 'promo_banner';
  }
  if (lowerText.includes('profile_photo') || lowerText.includes('профил')) {
    return 'profile_photo';
  }

  // По умолчанию - визитка
  return 'business_card';
}

/**
 * Получение названия типа лидмагнита на русском
 */
function getLeadMagnetTypeName(type: LeadMagnetOptions['type']): string {
  const names: Record<LeadMagnetOptions['type'], string> = {
    business_card: 'Визитка',
    social_media: 'Аватар для соцсетей',
    promo_banner: 'Промо-баннер',
    profile_photo: 'Профессиональное фото',
    custom: 'Кастомный лидмагнит',
  };
  return names[type];
}

/**
 * Извлечение заголовка для лидмагнита
 */
function extractHeadline(text: string): string | null {
  const match = text.match(/--headline\s+"([^"]+)"/i) ||
                text.match(/--headline\s+(\S+)/i);
  return match ? match[1] : null;
}

/**
 * Извлечение chatId из message
 */
function extractChatId(message: Memory): string | null {
  // roomId может содержать chatId
  if (message.roomId) {
    const roomStr = message.roomId.toString();
    // Если это UUID, пытаемся извлечь chatId из metadata
    if (message.content?.metadata?.chatId) {
      return message.content.metadata.chatId.toString();
    }
    return roomStr;
  }
  return null;
}

/**
 * Форматирование ошибок в понятный для пользователя текст
 */
function formatUserFriendlyError(errorMessage: string): string {
  // E005 - Sensitive content (NSFW, violence, etc.)
  if (errorMessage.includes('E005') || errorMessage.includes('sensitive')) {
    return `Не удалось сгенерировать изображение.

Причина: Фото или промпт содержат контент, который модель не может обработать (откровенный контент, насилие и т.п.)

Что делать:
• Попробуй другое фото (без откровенных поз)
• Измени промпт на более нейтральный
• Используй фото в одежде`;
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return `Превышено время ожидания генерации.

Сервер перегружен. Попробуй через минуту.`;
  }

  // Rate limit
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return `Слишком много запросов.

Подожди немного и попробуй снова.`;
  }

  // Invalid image
  if (errorMessage.includes('invalid image') || errorMessage.includes('Invalid image')) {
    return `Не удалось обработать фото.

Убедись что:
• Фото в формате JPG или PNG
• Размер не больше 10 МБ
• Фото не повреждено`;
  }

  // API key / auth errors
  if (errorMessage.includes('API key') || errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
    return `Ошибка настройки сервиса. Обратись к администратору.`;
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch')) {
    return `Ошибка соединения с сервисом генерации.

Попробуй позже или обратись к администратору.`;
  }

  // Generic prediction failed
  if (errorMessage.includes('Prediction failed')) {
    // Extract the actual reason if present
    const reasonMatch = errorMessage.match(/Prediction failed: (.+?)(?:\s*\(|$)/);
    const reason = reasonMatch ? reasonMatch[1] : 'неизвестная ошибка';
    return `Генерация не удалась: ${reason}

Попробуй:
• Изменить промпт
• Использовать другое фото
• Повторить через минуту`;
  }

  // Default - return original but cleaned up
  return `Ошибка генерации.

${errorMessage.substring(0, 200)}${errorMessage.length > 200 ? '...' : ''}

Попробуй изменить промпт или фото.`;
}

export default nanoBananaAction;
