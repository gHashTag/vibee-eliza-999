/**
 * 🕉️ Централизованное управление сессиями Telegram юзер-ботов
 *
 * Использование:
 * 1. Добавь новую сессию в объект SESSIONS
 * 2. Установи активную сессию через setActiveSession()
 * 3. Получи активную сессию через getActiveSession()
 */

export interface UserbotSession {
  /** Уникальный ID сессии (например: "test", "production", "neuro_sage") */
  id: string;
  /** Название сессии для отображения */
  name: string;
  /** Описание назначения сессии */
  description?: string;
  /** TELEGRAM_SESSION_STRING */
  sessionString: string;
  /** TELEGRAM_API_ID (опционально, если отличается от дефолтного) */
  apiId?: string;
  /** TELEGRAM_API_HASH (опционально, если отличается от дефолтного) */
  apiHash?: string;
}

/**
 * Все доступные сессии юзер-ботов
 */
export const SESSIONS: Record<string, UserbotSession> = {
  test: {
    id: "test",
    name: "Тестовый аккаунт",
    description: "Тестовый юзер-бот для разработки",
    sessionString: process.env.TELEGRAM_SESSION_STRING_TEST || "",
  },
  production: {
    id: "production",
    name: "Продакшн (neuro_sage)",
    description: "Продакшн аккаунт @neuro_sage",
    sessionString:
      "1BQANOTEuMTA4LjU2LjE3OQG7hxJ0uhPXNkb+k7PjC0wVAfXJbFCM+yuXeXBgfw7Lv8JhhhxTB3AD7+21spB4itvQZnVm1UE6acv0etfIwUvMIESEMpsi+5LPzDd+FEk0Np3dgU1o7Kzpf7uusaA1YqGC9y52lP7rf1nND9w35/XZ5UblwBqKPkoiT2Dcy2F9uSxmUF2L8hO8vm82ChxLcRbQWpnbLCuZMcSX2DPE3gsSMoqLeDmZXotZgUDEabszdJkYSgjMRRllOMT5rwd8ijvUtfJSi81qj2BjUainSHnKuAbeX/NdVB98xobX4+GNU2mM+mZAXAfyXPUb+XnMZGgkYwYJ6QXyUQvP+MFW9u8rZg==",
  },
  // Добавь новые сессии здесь:
  // new_session: {
  //   id: "new_session",
  //   name: "Новая сессия",
  //   description: "Описание",
  //   sessionString: "...",
  // },
};

/**
 * ID активной сессии (по умолчанию из env или "production")
 */
let activeSessionId: string =
  process.env.ACTIVE_USERBOT_SESSION || "production";

/**
 * Получить активную сессию
 */
export function getActiveSession(): UserbotSession | null {
  const session = SESSIONS[activeSessionId];
  if (!session) {
    console.error(
      `[UserbotSessions] ❌ Сессия "${activeSessionId}" не найдена!`
    );
    return null;
  }
  return session;
}

/**
 * Установить активную сессию
 */
export function setActiveSession(sessionId: string): boolean {
  if (!SESSIONS[sessionId]) {
    console.error(`[UserbotSessions] ❌ Сессия "${sessionId}" не найдена!`);
    console.log(
      `[UserbotSessions] Доступные сессии: ${Object.keys(SESSIONS).join(", ")}`
    );
    return false;
  }
  activeSessionId = sessionId;
  console.log(
    `[UserbotSessions] ✅ Активная сессия изменена на: ${SESSIONS[sessionId].name} (${sessionId})`
  );
  return true;
}

/**
 * Получить все доступные сессии
 */
export function getAllSessions(): UserbotSession[] {
  return Object.values(SESSIONS);
}

/**
 * Получить сессию по ID
 */
export function getSession(sessionId: string): UserbotSession | null {
  return SESSIONS[sessionId] || null;
}

/**
 * Добавить новую сессию
 */
export function addSession(session: UserbotSession): void {
  SESSIONS[session.id] = session;
  console.log(
    `[UserbotSessions] ✅ Сессия "${session.name}" (${session.id}) добавлена`
  );
}

/**
 * Получить credentials для активной сессии
 */
export function getActiveCredentials(): {
  sessionString: string;
  apiId?: string;
  apiHash?: string;
} | null {
  const session = getActiveSession();
  if (!session) return null;

  return {
    sessionString: session.sessionString,
    apiId: session.apiId,
    apiHash: session.apiHash,
  };
}
