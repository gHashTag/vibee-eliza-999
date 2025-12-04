# 🔐 ИСПРАВЛЕНИЕ: Валидация Instagram токенов

**Дата:** 23 ноября 2025 г.
**Статус:** ✅ ВЫПОЛНЕНО
**Проблема:** Instagram Expert не проверял валидность токенов, только их наличие

---

## 🚨 ПРОБЛЕМА ПОЛЬЗОВАТЕЛЯ

Пользователь попытался использовать Instagram Expert, но получил ошибку:
```
Error validating access token: Session has expired on Friday, 21-Nov-25 02:00:00 PST
```

**Критика пользователя:**
> "А как ты проверяешь, если у тебя не проверены?"
> - Пользователь правильно указал, что я проверял только наличие токенов, а не их валидность

---

## ✅ РЕШЕНИЕ

Добавлена **реальная валидация** Instagram токенов через Instagram API.

### 1. Функция `validateToken()` (строки 63-107)

```typescript
/**
 * Проверка валидности токена Instagram API
 */
async validateToken(): Promise<{ valid: boolean; error?: string; expiresAt?: string }> {
  try {
    if (!this.accessToken || !this.instagramAccountId) {
      return {
        valid: false,
        error: 'INSTAGRAM_ACCESS_TOKEN или INSTAGRAM_ACCOUNT_ID не найдены в Infisical'
      };
    }

    // Проверяем токен через Instagram API
    const response = await fetch(
      `${this.baseUrl}/me?fields=id,username,account_type&access_token=${this.accessToken}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || 'Неизвестная ошибка';

      // Проверяем, истёк ли токен
      if (errorMessage.includes('expired') || errorMessage.includes('Session has expired')) {
        return {
          valid: false,
          error: `❌ Токен истёк: ${errorMessage}`
        };
      }

      return {
        valid: false,
        error: `❌ Ошибка валидации токена: ${errorMessage}`
      };
    }

    const data = await response.json();
    return {
      valid: true,
      expiresAt: `Account: ${data.username} (${data.account_type})`
    };

  } catch (error) {
    return {
      valid: false,
      error: `❌ Ошибка проверки токена: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
```

### 2. Валидация при старте сервиса (строки 49-60)

```typescript
// Проверяем валидность токена при старте
if (service.accessToken && service.instagramAccountId) {
  console.log('🔐 Проверка валидности Instagram токена...');
  const validation = await service.validateToken();

  if (validation.valid) {
    console.log('✅ Instagram токен валиден:', validation.expiresAt);
  } else {
    console.error('❌ Instagram токен невалиден:', validation.error);
    console.error('⚠️ Необходимо обновить Instagram токены в Infisical!');
  }
}
```

### 3. Валидация перед публикацией (строки 114-118)

```typescript
// Сначала проверяем токен
const tokenValidation = await this.validateToken();
if (!tokenValidation.valid) {
  throw new Error(`Instagram токен невалиден: ${tokenValidation.error}`);
}
```

---

## 📊 ЧТО ТЕПЕРЬ ПРОИСХОДИТ

### ✅ При запуске агента:
1. Проверяется наличие токенов (как было)
2. **НОВОЕ:** Проверяется валидность токена через Instagram API
3. Выводится результат валидации в консоль

### ✅ При публикации поста:
1. **НОВОЕ:** Проверяется валидность токена
2. Если токен истёк - показывается понятная ошибка
3. Если токен валиден - выполняется публикация

### ✅ Обработка ошибок:
- **"Session has expired"** → Понятная ошибка об истечении токена
- **"Invalid token"** → Понятная ошибка о невалидном токене
- **API errors** → Детальная информация об ошибке

---

## 🔧 ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Файл: `src/instagram-plugin/services/instagramService.ts`

**Изменённые строки:**
- **63-107:** Добавлена функция `validateToken()`
- **49-60:** Добавлена валидация при старте
- **114-118:** Добавлена валидация перед публикацией

**API Endpoint для проверки:**
```
GET https://graph.facebook.com/v18.0/me?fields=id,username,account_type&access_token={token}
```

**Ответ при валидном токене:**
```json
{
  "id": "17841400000000000",
  "username": "instagram_username",
  "account_type": "BUSINESS"
}
```

**Ответ при истёкшем токене:**
```json
{
  "error": {
    "message": "Session has expired on Friday, 21-Nov-25 02:00:00 PST",
    "type": "OAuthException",
    "code": 190
  }
}
```

---

## 🚀 ГОТОВНОСТЬ К ТЕСТИРОВАНИЮ

Теперь пользователь увидит ошибку истечения токена **сразу при запуске агента**, а не только при попытке публикации.

### При запуске агента увидите:
```
🔐 Проверка валидности Instagram токена...
❌ Instagram токен невалиден: ❌ Токен истёк: Session has expired on Friday, 21-Nov-25 02:00:00 PST
⚠️ Необходимо обновить Instagram токены в Infisical!
```

---

## 📝 ЗАКЛЮЧЕНИЕ

**Исправлена критическая проблема:** Instagram Expert теперь **реально проверяет валидность токенов**, а не только их наличие.

**Результат:** Пользователь сразу узнает, что токены истекли, и сможет обновить их в Infisical.

**Файлы изменены:**
- ✅ `src/instagram-plugin/services/instagramService.ts` - добавлена валидация

**Статус:** ✅ ГОТОВО К ИСПОЛЬЗОВАНИЮ

---

*Система агентов-пчелок VIBEE - исправление валидации Instagram токенов*
