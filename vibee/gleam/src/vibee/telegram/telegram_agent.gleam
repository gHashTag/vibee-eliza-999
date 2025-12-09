// VIBEE Telegram Agent
// Аналог TelegramService из plugin-telegram-craft
// Работает через Go bridge для MTProto

import gleam/http
import gleam/http/request
import gleam/httpc
import gleam/int
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
import vibee/config/target_chats
import vibee/config/telegram_config
import vibee/logging

/// Конфигурация Telegram агента
pub type TelegramAgentConfig {
  TelegramAgentConfig(
    bridge_url: String,
    session_id: String,
    llm_api_key: Option(String),
    llm_model: String,
    auto_reply_enabled: Bool,
    cooldown_ms: Int,
  )
}

/// Состояние агента
pub type AgentState {
  AgentState(
    config: TelegramAgentConfig,
    is_monitoring: Bool,
    total_messages: Int,
    last_reply_time: Int,
    monitored_chats: List(String),
  )
}

/// Сообщения для актора
pub type AgentMessage {
  StartMonitoring
  StopMonitoring
  ProcessMessage(chat_id: String, from_name: String, text: String, message_id: Int)
  SendReply(chat_id: String, text: String, reply_to: Option(Int))
  GetStatus
  Shutdown
}

/// Результат отправки сообщения
pub type SendResult {
  SendOk(message_id: Int)
  SendError(reason: String)
}

/// Создать конфигурацию по умолчанию (используем централизованный конфиг)
pub fn default_config() -> TelegramAgentConfig {
  TelegramAgentConfig(
    bridge_url: telegram_config.bridge_url,
    session_id: telegram_config.session_id,
    llm_api_key: None,
    llm_model: "x-ai/grok-4.1-fast",
    auto_reply_enabled: True,
    cooldown_ms: 30_000,
  )
}

/// Инициализация агента
pub fn init(config: TelegramAgentConfig) -> AgentState {
  logging.info("Telegram Agent initialized")
  logging.info("Bridge URL: " <> config.bridge_url)
  logging.info("Auto-reply: " <> case config.auto_reply_enabled {
    True -> "enabled"
    False -> "disabled"
  })

  AgentState(
    config: config,
    is_monitoring: False,
    total_messages: 0,
    last_reply_time: 0,
    monitored_chats: target_chats.target_chats,
  )
}

/// Обработка входящего сообщения
pub fn handle_incoming_message(
  state: AgentState,
  chat_id: String,
  from_name: String,
  text: String,
  message_id: Int,
) -> AgentState {
  // Логируем сообщение
  logging.telegram_message(chat_id, from_name, text)

  // Проверяем, нужно ли обрабатывать этот чат
  case target_chats.should_process_chat(chat_id) {
    False -> {
      logging.debug("Skipping non-target chat: " <> chat_id)
      state
    }
    True -> {
      logging.info("Processing message from target chat: " <> chat_id)

      // Проверяем триггеры
      case should_reply(state, text) {
        False -> {
          logging.debug("No trigger found, skipping reply")
          AgentState(..state, total_messages: state.total_messages + 1)
        }
        True -> {
          logging.info("Trigger found! Generating reply...")

          // Генерируем и отправляем ответ
          case generate_reply(state.config, text) {
            Ok(reply) -> {
              logging.info("Reply generated: " <> string.slice(reply, 0, 50) <> "...")
              let _ = send_message(state.config, chat_id, reply, Some(message_id))
              AgentState(..state, total_messages: state.total_messages + 1)
            }
            Error(err) -> {
              logging.error("Failed to generate reply: " <> err)
              AgentState(..state, total_messages: state.total_messages + 1)
            }
          }
        }
      }
    }
  }
}

/// Проверяет, нужно ли отвечать на сообщение
fn should_reply(state: AgentState, text: String) -> Bool {
  case state.config.auto_reply_enabled {
    False -> False
    True -> {
      let lower_text = string.lowercase(text)
      // Проверяем триггеры
      let triggers = ["vibee", "vibe", "@vibee", "бот", "агент", "вайб"]
      list.any(triggers, fn(trigger) {
        string.contains(lower_text, trigger)
      })
    }
  }
}

/// Генерация ответа через LLM (OpenRouter)
fn generate_reply(config: TelegramAgentConfig, user_message: String) -> Result(String, String) {
  case config.llm_api_key {
    None -> {
      // Без LLM - простой fallback ответ
      Ok("Privet! Ya VIBEE agent na Gleam/BEAM. Polnyj LLM otvet budet dostupem posle nastrojki OPENROUTER_API_KEY.")
    }
    Some(api_key) -> {
      // Вызов OpenRouter API
      call_openrouter(api_key, config.llm_model, user_message)
    }
  }
}

/// Вызов OpenRouter API для генерации ответа
fn call_openrouter(api_key: String, model: String, user_message: String) -> Result(String, String) {
  let system_prompt = "Ты VIBEE - дружелюбный AI-агент на Gleam/BEAM платформе. Отвечай кратко и полезно на русском языке. Ты эксперт по вайбкодингу - программированию с помощью AI-ассистентов."

  let body = json.object([
    #("model", json.string(model)),
    #("messages", json.array([
      json.object([
        #("role", json.string("system")),
        #("content", json.string(system_prompt)),
      ]),
      json.object([
        #("role", json.string("user")),
        #("content", json.string(user_message)),
      ]),
    ], fn(x) { x })),
  ])
  |> json.to_string()

  logging.debug("Calling OpenRouter API with model: " <> model)

  let req = request.new()
    |> request.set_scheme(http.Https)
    |> request.set_method(http.Post)
    |> request.set_host("openrouter.ai")
    |> request.set_path("/api/v1/chat/completions")
    |> request.set_header("Authorization", "Bearer " <> api_key)
    |> request.set_header("Content-Type", "application/json")
    |> request.set_header("HTTP-Referer", "https://vibee.ai")
    |> request.set_header("X-Title", "VIBEE Agent")
    |> request.set_body(body)

  case httpc.send(req) {
    Ok(response) -> {
      logging.debug("OpenRouter response status: " <> int.to_string(response.status))
      // Парсим JSON ответ и извлекаем content
      case response.status {
        200 -> {
          // Ищем "content":" в ответе и извлекаем текст
          case extract_content_from_response(response.body) {
            Ok(content) -> Ok(content)
            Error(err) -> {
              logging.error("Failed to parse OpenRouter response: " <> err)
              logging.debug("Response body: " <> string.slice(response.body, 0, 200))
              Error("Parse error: " <> err)
            }
          }
        }
        status -> {
          logging.error("OpenRouter API error: HTTP " <> int.to_string(status))
          logging.debug("Error body: " <> string.slice(response.body, 0, 200))
          Error("API error: HTTP " <> int.to_string(status))
        }
      }
    }
    Error(_) -> {
      logging.error("HTTP request to OpenRouter failed")
      Error("HTTP request failed")
    }
  }
}

/// Извлекает content из JSON ответа OpenRouter
/// Формат: {"choices":[{"message":{"content":"..."}}]}
fn extract_content_from_response(body: String) -> Result(String, String) {
  // Ищем "content":" и берём текст до следующей кавычки
  let pattern = "\"content\":\""
  case string.split(body, pattern) {
    [_, rest, ..] -> {
      // Ищем закрывающую кавычку (с учётом escaped quotes)
      case find_closing_quote(rest, "", False) {
        Ok(content) -> {
          // Декодируем escaped символы
          let decoded = content
            |> string.replace("\\n", "\n")
            |> string.replace("\\\"", "\"")
            |> string.replace("\\\\", "\\")
          Ok(decoded)
        }
        Error(e) -> Error(e)
      }
    }
    _ -> Error("No content field found")
  }
}

/// Находит закрывающую кавычку с учётом escape-последовательностей
fn find_closing_quote(s: String, acc: String, escaped: Bool) -> Result(String, String) {
  case string.pop_grapheme(s) {
    Ok(#(char, rest)) -> {
      case escaped {
        True -> find_closing_quote(rest, acc <> char, False)
        False -> {
          case char {
            "\\" -> find_closing_quote(rest, acc <> char, True)
            "\"" -> Ok(acc)
            _ -> find_closing_quote(rest, acc <> char, False)
          }
        }
      }
    }
    Error(_) -> Error("Unexpected end of string")
  }
}

/// Отправка сообщения через Go bridge
pub fn send_message(
  config: TelegramAgentConfig,
  chat_id: String,
  text: String,
  reply_to: Option(Int),
) -> Result(Int, String) {
  let reply_to_str = case reply_to {
    None -> "null"
    Some(id) -> int.to_string(id)
  }

  // Parse chat_id to int for Go bridge
  let chat_id_int = case int.parse(chat_id) {
    Ok(id) -> id
    Error(_) -> 0
  }

  let body = json.object([
    #("chat_id", json.int(chat_id_int)),
    #("text", json.string(text)),
    #("reply_to", case reply_to {
      None -> json.null()
      Some(id) -> json.int(id)
    }),
  ])
  |> json.to_string()

  let url = config.bridge_url <> "/api/v1/send"

  logging.info("Sending message to " <> chat_id <> " via " <> url)

  let req = request.new()
    |> request.set_scheme(http.Http)
    |> request.set_method(http.Post)
    |> request.set_host("localhost")
    |> request.set_port(8081)
    |> request.set_path("/api/v1/send")
    |> request.set_header("Content-Type", "application/json")
    |> request.set_header("X-Session-ID", config.session_id)
    |> request.set_body(body)

  case httpc.send(req) {
    Ok(response) -> {
      case response.status {
        200 -> {
          logging.info("Message sent successfully")
          Ok(0)  // TODO: parse message_id from response
        }
        status -> {
          let err = "HTTP " <> int.to_string(status)
          logging.error("Failed to send: " <> err)
          Error(err)
        }
      }
    }
    Error(_) -> {
      logging.error("HTTP request failed")
      Error("Network error")
    }
  }
}

/// Получить историю сообщений из чата
pub fn get_history(config: TelegramAgentConfig, chat_id: String, limit: Int) -> Result(String, String) {
  let url = config.bridge_url <> "/api/v1/history/" <> chat_id <> "?limit=" <> int.to_string(limit)

  let req = request.new()
    |> request.set_scheme(http.Http)
    |> request.set_method(http.Get)
    |> request.set_host("localhost")
    |> request.set_port(8081)
    |> request.set_path("/api/v1/history/" <> chat_id)
    |> request.set_header("X-Session-ID", config.session_id)

  case httpc.send(req) {
    Ok(response) -> Ok(response.body)
    Error(_) -> Error("Failed to get history")
  }
}

/// Получить список диалогов
pub fn get_dialogs(config: TelegramAgentConfig, limit: Int) -> Result(String, String) {
  let req = request.new()
    |> request.set_scheme(http.Http)
    |> request.set_method(http.Get)
    |> request.set_host("localhost")
    |> request.set_port(8081)
    |> request.set_path("/api/v1/dialogs")
    |> request.set_header("X-Session-ID", config.session_id)

  case httpc.send(req) {
    Ok(response) -> Ok(response.body)
    Error(_) -> Error("Failed to get dialogs")
  }
}
