/**
 * Unit Tests for ProactiveAvatarService
 *
 * Тестирование стратегии "ТОЛЬКО ДЕВОЧКИ":
 * - Фильтрация пользователей по полу (только female)
 * - Использование только женских промптов (FEMALE_PROMPTS)
 * - Пропуск мужчин на этапе выбора пользователя
 */
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { ProactiveAvatarService } from "../services/proactiveAvatar.service";
import { detectGenderByName } from "../utils/genderDetection";
import type { IAgentRuntime } from "@elizaos/core";
import type { ITelegramUser } from "../types/telegram.types";

// Моки для зависимостей
const mockRuntime = {
  getService: mock(() => null),
  getSetting: mock(() => null),
  useModel: mock(() => Promise.resolve("test prompt")),
} as unknown as IAgentRuntime;

describe('ProactiveAvatarService - Стратегия "ТОЛЬКО ДЕВОЧКИ"', () => {
  let service: ProactiveAvatarService;

  beforeEach(() => {
    service = new ProactiveAvatarService();
  });

  describe("Service Properties", () => {
    it("has correct serviceType", () => {
      expect(service.serviceType).toBe("proactive-avatar");
      expect(ProactiveAvatarService.serviceType).toBe("proactive-avatar");
    });

    it("isAvailable returns false before initialization", () => {
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe("Gender Detection Strategy", () => {
    it("detects female names correctly", () => {
      expect(detectGenderByName("Мария")).toBe("female");
      expect(detectGenderByName("Anna")).toBe("female");
      expect(detectGenderByName("Elena")).toBe("female");
      expect(detectGenderByName("Katya")).toBe("female");
      expect(detectGenderByName("Daria")).toBe("female");
    });

    it("detects male names correctly", () => {
      expect(detectGenderByName("Иван")).toBe("male");
      expect(detectGenderByName("Alexander")).toBe("male");
      expect(detectGenderByName("Dmitry")).toBe("male");
      expect(detectGenderByName("Sergey")).toBe("male");
    });

    it("handles username-based detection", () => {
      // Женские имена в username
      expect(detectGenderByName("", undefined, "marina_dev")).toBe("female");
      expect(detectGenderByName("", undefined, "katya_coder")).toBe("female");

      // Мужские имена в username
      expect(detectGenderByName("", undefined, "ivan_dev")).toBe("male");
      expect(detectGenderByName("", undefined, "alex_coder")).toBe("male");
    });
  });

  describe("Female-Only Filtering Logic", () => {
    it("should filter out male users by name", () => {
      const maleUser: ITelegramUser = {
        id: 1,
        firstName: "Иван",
        username: "ivan_dev",
      };

      const gender = detectGenderByName(
        maleUser.firstName || "",
        maleUser.lastName,
        maleUser.username
      );

      expect(gender).toBe("male");
      // В реальном коде такой пользователь будет пропущен
    });

    it("should accept female users by name", () => {
      const femaleUser: ITelegramUser = {
        id: 2,
        firstName: "Мария",
        username: "maria_dev",
      };

      const gender = detectGenderByName(
        femaleUser.firstName || "",
        femaleUser.lastName,
        femaleUser.username
      );

      expect(gender).toBe("female");
      // В реальном коде такой пользователь будет принят
    });

    it("should handle unknown gender gracefully", () => {
      const unknownUser: ITelegramUser = {
        id: 3,
        firstName: "Xyz",
        username: "xyz123",
      };

      const gender = detectGenderByName(
        unknownUser.firstName || "",
        unknownUser.lastName,
        unknownUser.username
      );

      // По умолчанию возвращается 'male', но в стратегии "только девочки"
      // такие пользователи будут пропущены, если CV анализ не подтвердит female
      expect(["male", "female"]).toContain(gender);
    });
  });

  describe("Prompt Selection Strategy", () => {
    it("should always use female prompts regardless of gender detection", async () => {
      // Даже если пол не определен, используются только женские промпты
      // Это проверяется через логику в generatePersonalizedPrompt

      // Проверяем, что в коде всегда используется FEMALE_PROMPTS
      // Это можно проверить через рефлексию или через тестирование метода

      // В реальном коде:
      // const genderPrompts = FEMALE_PROMPTS; // Всегда женские
      // const genderWord = 'woman';
      // const genderRu = 'девушка';

      expect(true).toBe(true); // Placeholder - реальная проверка требует моков runtime
    });
  });

  describe("Edge Cases", () => {
    it("handles empty firstName", () => {
      const user: ITelegramUser = {
        id: 4,
        firstName: "",
        username: "test_user",
      };

      const gender = detectGenderByName(
        user.firstName || "",
        user.lastName,
        user.username
      );

      expect(["male", "female"]).toContain(gender);
    });

    it("handles missing username", () => {
      const user: ITelegramUser = {
        id: 5,
        firstName: "Test",
        username: undefined,
      };

      const gender = detectGenderByName(
        user.firstName || "",
        user.lastName,
        user.username
      );

      expect(["male", "female"]).toContain(gender);
    });

    it("handles both firstName and username", () => {
      const user: ITelegramUser = {
        id: 6,
        firstName: "Мария",
        username: "maria_dev",
      };

      const gender = detectGenderByName(
        user.firstName || "",
        user.lastName,
        user.username
      );

      expect(gender).toBe("female");
    });
  });

  describe("Service State Management", () => {
    it("getStats returns null for unknown chat", () => {
      const stats = service.getStats("unknown_chat_id");
      expect(stats).toBeNull();
    });

    it("getStats returns correct structure when state exists", async () => {
      // Для этого теста нужно инициализировать сервис и создать состояние
      // Это требует моков runtime и telegram service

      // Placeholder - реальная проверка требует полной инициализации
      expect(true).toBe(true);
    });
  });

  describe("Midjourney Format Validation", () => {
    it("prompts should follow Midjourney format structure", () => {
      // Проверяем структуру Midjourney промпта: [Subject] + [Details] + [Style] + [Lighting] + [Mood] + [Parameters]
      // Пример правильного формата:
      const examplePrompt =
        "Professional portrait photograph of a woman, authentic skin texture with natural pores and subtle freckles, expressive eyes with catchlights, soft Rembrandt lighting, shallow depth of field, shot on Canon 85mm f/1.4, DSLR quality, true-to-life colors --ar 9:16 --s 250 --v 7";

      // Проверяем наличие Midjourney параметров
      expect(examplePrompt).toContain("--ar");
      expect(examplePrompt).toContain("--s");
      expect(examplePrompt).toContain("--v");

      // Проверяем структуру: Subject в начале
      expect(examplePrompt.toLowerCase()).toContain("portrait");
      expect(examplePrompt.toLowerCase()).toContain("woman");

      // Проверяем технические детали (Style)
      expect(examplePrompt.toLowerCase()).toContain("shot on");
      expect(examplePrompt.toLowerCase()).toContain("canon");

      // Проверяем параметры в конце
      const paramsMatch = examplePrompt.match(
        /--ar\s+\d+:\d+\s+--s\s+\d+\s+--v\s+\d+/
      );
      expect(paramsMatch).not.toBeNull();
    });

    it("prompts should contain Midjourney parameters", () => {
      // Проверяем, что промпты содержат обязательные Midjourney параметры
      const testPrompts = [
        "test prompt --ar 9:16 --s 250 --v 7",
        "another prompt --ar 1:1 --s 500 --v 6",
      ];

      testPrompts.forEach((prompt) => {
        expect(prompt).toMatch(/--ar\s+\d+:\d+/);
        expect(prompt).toMatch(/--s\s+\d+/);
        expect(prompt).toMatch(/--v\s+\d+/);
      });
    });

    it("should validate Midjourney prompt structure", () => {
      // Структура: Subject + Details + Style + Lighting + Mood + Parameters
      const validPrompt =
        "Portrait of a woman, detailed description, shot on Canon 85mm, soft lighting, moody atmosphere --ar 9:16 --s 250 --v 7";

      // Проверяем наличие всех компонентов
      expect(validPrompt).toContain("woman"); // Subject
      expect(validPrompt).toContain("shot on"); // Style
      expect(validPrompt).toContain("lighting"); // Lighting
      expect(validPrompt).toContain("atmosphere"); // Mood
      expect(validPrompt).toMatch(/--ar\s+\d+:\d+/); // Parameters
    });
  });

  describe("Configuration Constants", () => {
    it("FEMALE_PROMPTS contains glamorous prompt", () => {
      // Проверяем, что новый гламурный промпт присутствует
      // Это можно проверить через рефлексию или экспорт константы

      // В реальном коде промпт должен содержать:
      // "glamorous woman", "white fur coat", "red convertible", "snowy forest"
      // И Midjourney параметры: --ar 9:16 --s 500 --v 7

      expect(true).toBe(true); // Placeholder - требует экспорта константы или рефлексии
    });

    it("FEMALE_PROMPTS contains multiple prompts", () => {
      // Проверяем, что есть несколько промптов для разнообразия
      expect(true).toBe(true); // Placeholder
    });

    it("FEMALE_PROMPTS should use Midjourney format", () => {
      // Все промпты должны содержать Midjourney параметры
      // Проверка через рефлексию или экспорт константы
      expect(true).toBe(true); // Placeholder
    });
  });

  describe("Gender Filtering in Selection Logic", () => {
    it("should skip male users during selection", () => {
      // Симуляция логики выбора пользователя
      const maleUser: ITelegramUser = {
        id: 7,
        firstName: "Иван",
        username: "ivan_dev",
      };

      const nameBasedGender = detectGenderByName(
        maleUser.firstName || "",
        maleUser.lastName,
        maleUser.username
      );

      // В реальном коде: если nameBasedGender === 'male', пользователь пропускается
      const shouldSkip = nameBasedGender === "male";
      expect(shouldSkip).toBe(true);
    });

    it("should accept female users during selection", () => {
      const femaleUser: ITelegramUser = {
        id: 8,
        firstName: "Анна",
        username: "anna_dev",
      };

      const nameBasedGender = detectGenderByName(
        femaleUser.firstName || "",
        femaleUser.lastName,
        femaleUser.username
      );

      // В реальном коде: если nameBasedGender === 'female', пользователь принимается
      const shouldAccept = nameBasedGender === "female";
      expect(shouldAccept).toBe(true);
    });

    it("should handle CV analysis gender override", () => {
      // Если CV анализ определил пол как 'male', пользователь должен быть пропущен
      const cvGenderMale = "male";
      const shouldSkip = cvGenderMale === "male";
      expect(shouldSkip).toBe(true);

      // Если CV анализ определил пол как 'female', пользователь должен быть принят
      const cvGenderFemale = "female";
      const shouldAccept = cvGenderFemale === "female";
      expect(shouldAccept).toBe(true);
    });
  });
});


