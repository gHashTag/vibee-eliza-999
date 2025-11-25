import { Plugin } from '@elizaos/core'

// Импортируем все плагины проекта
import { telegramCraftPlugin } from '../../plugin-telegram-craft/src/plugin'

// Импортируем плагин Avatar Face (если есть)
// import { vibeFaceAvatarPlugin } from '../../plugin-vibe-face-avatar/src/index'

/**
 * Главный плагин VIBEE - объединяет все плагины проекта
 */
export const vibeeMainPlugin: Plugin = {
  name: 'vibee-main',
  description: 'Главный плагин VIBEE агента - объединяет все функциональные плагины',

  // Подключаем все плагины как сервисы
  services: [
    // Telegram Craft Plugin
    telegramCraftPlugin.services?.[0],

    // Другие плагины можно добавить здесь
    // vibeFaceAvatarPlugin.services?.[0],
  ].filter(Boolean) as any[],

  // Подключаем все actions
  actions: [
    ...(telegramCraftPlugin.actions || []),
    // ...(vibeFaceAvatarPlugin.actions || []),
  ],

  // Подключаем все providers
  providers: [
    ...(telegramCraftPlugin.providers || []),
    // ...(vibeFaceAvatarPlugin.providers || []),
  ],

  // Подключаем все evaluators
  evaluators: [
    ...(telegramCraftPlugin.evaluators || []),
    // ...(vibeFaceAvatarPlugin.evaluators || []),
  ],

  /**
   * Инициализация - подключаем все плагины
   */
  init: async (config, runtime) => {
    console.log('🚀 [VIBEE Main Plugin] Initializing...')

    // Инициализируем Telegram Craft Plugin
    if (telegramCraftPlugin.init) {
      await telegramCraftPlugin.init(config, runtime)
    }

    // Инициализируем другие плагины
    // if (vibeFaceAvatarPlugin.init) {
    //   await vibeFaceAvatarPlugin.init(config, runtime)
    // }

    console.log('✅ [VIBEE Main Plugin] All plugins initialized')
  },
}

export default vibeeMainPlugin
