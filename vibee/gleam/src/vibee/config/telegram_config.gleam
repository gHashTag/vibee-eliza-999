// Централизованная конфигурация Telegram
// Все настройки в одном месте
//
// NOTE: session_id больше не хардкодится здесь.
// Используйте session_manager для управления сессиями:
// - session_list - показать все сессии
// - session_set_active - установить активную сессию
// - session_create - создать новую сессию

/// Bridge URL для Go MTProto bridge
pub const bridge_url = "http://localhost:8081"

/// Телефон для авторизации (по умолчанию)
pub const phone = "+79933420465"

/// API ID (my.telegram.org)
pub const api_id = 94892

/// API Hash (my.telegram.org)
pub const api_hash = "cacf9ad137d228611b49b2ecc6d68d43"
