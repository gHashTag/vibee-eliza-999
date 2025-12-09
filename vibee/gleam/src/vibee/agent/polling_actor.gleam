// VIBEE Polling Actor
// OTP Actor для polling сообщений из Telegram через Go Bridge
// Аналог TelegramService.poll() из plugin-telegram-craft

import gleam/erlang/process.{type Subject}
import gleam/http
import gleam/http/request
import gleam/httpc
import gleam/int
import gleam/io
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/otp/actor
import gleam/set.{type Set}
import gleam/string
import vibee/config/target_chats
import vibee/events/event_bus
import vibee/logging
import vibee/telegram/telegram_agent

/// Состояние Polling актора
pub type PollingState {
  PollingState(
    config: telegram_agent.TelegramAgentConfig,
    agent_state: telegram_agent.AgentState,
    poll_count: Int,
    event_bus: Option(Subject(event_bus.PubSubMessage)),
    seen_ids: Set(String),  // ID уже обработанных сообщений (chat_id:msg_id)
  )
}

/// Сообщения для Polling Actor
pub type PollingMessage {
  Poll
  Stop
}

/// Создать начальное состояние
fn init_state(config: telegram_agent.TelegramAgentConfig) -> PollingState {
  PollingState(
    config: config,
    agent_state: telegram_agent.init(config),
    poll_count: 0,
    event_bus: None,
    seen_ids: set.new(),
  )
}

/// Создать начальное состояние с event bus
fn init_state_with_events(
  config: telegram_agent.TelegramAgentConfig,
  bus: Subject(event_bus.PubSubMessage),
) -> PollingState {
  PollingState(
    config: config,
    agent_state: telegram_agent.init(config),
    poll_count: 0,
    event_bus: Some(bus),
    seen_ids: set.new(),
  )
}

/// Запуск polling actor (новый API gleam_otp)
pub fn start(config: telegram_agent.TelegramAgentConfig) -> Result(Subject(PollingMessage), actor.StartError) {
  let initial_state = init_state(config)

  // Новый API: actor.new() |> actor.on_message() |> actor.start
  let spec = actor.new(initial_state)
    |> actor.on_message(handle_message)

  case actor.start(spec) {
    Ok(started) -> Ok(started.data)
    Error(err) -> Error(err)
  }
}

/// Запуск polling actor with shared event bus
pub fn start_with_events(
  config: telegram_agent.TelegramAgentConfig,
  bus: Subject(event_bus.PubSubMessage),
) -> Result(Subject(PollingMessage), actor.StartError) {
  let initial_state = init_state_with_events(config, bus)

  let spec = actor.new(initial_state)
    |> actor.on_message(handle_message)

  case actor.start(spec) {
    Ok(started) -> Ok(started.data)
    Error(err) -> Error(err)
  }
}

/// Обработчик сообщений актора
fn handle_message(
  state: PollingState,
  msg: PollingMessage,
) -> actor.Next(PollingState, PollingMessage) {
  case msg {
    Poll -> {
      // Выполняем polling
      let new_state = do_poll(state)

      // Планируем следующий poll через 5 секунд
      let _ = schedule_next_poll()

      actor.continue(new_state)
    }

    Stop -> {
      logging.info("Polling Actor stopped")
      actor.stop()
    }
  }
}

/// Планирование следующего poll (заглушка - таймер в start_polling)
fn schedule_next_poll() {
  // Таймер запускается в start_polling_loop
  Nil
}

/// Выполнить один цикл polling
fn do_poll(state: PollingState) -> PollingState {
  let poll_num = state.poll_count + 1

  case poll_num % 20 {
    0 -> logging.debug("Polling messages from Go bridge... (poll #" <> int.to_string(poll_num) <> ")")
    _ -> Nil
  }

  // Получаем список диалогов
  case get_dialogs(state.config) {
    Error(_) -> {
      logging.error("Failed to get dialogs from Go bridge")
      // Publish error event
      publish_event(state.event_bus, event_bus.error_event(
        "polling_error",
        "Failed to get dialogs from Go bridge",
        get_timestamp(),
      ))
      PollingState(..state, poll_count: poll_num)
    }
    Ok(dialogs_json) -> {
      // Парсим и обрабатываем диалоги, передаём seen_ids для дедупликации
      let #(new_agent_state, new_seen_ids) = process_dialogs_with_events(
        state.agent_state,
        dialogs_json,
        state.event_bus,
        state.seen_ids,
      )
      PollingState(..state, agent_state: new_agent_state, poll_count: poll_num, seen_ids: new_seen_ids)
    }
  }
}

/// Helper to publish event if event_bus is available
fn publish_event(
  bus: Option(Subject(event_bus.PubSubMessage)),
  event: event_bus.Event,
) {
  case bus {
    Some(b) -> event_bus.publish(b, event)
    None -> Nil
  }
}

/// Get current Unix timestamp using Erlang's os:system_time/1
@external(erlang, "vibee_ffi", "get_unix_timestamp")
fn get_timestamp() -> Int

/// Получить список диалогов
fn get_dialogs(config: telegram_agent.TelegramAgentConfig) -> Result(String, String) {
  let req = request.new()
    |> request.set_scheme(http.Http)
    |> request.set_method(http.Get)
    |> request.set_host("localhost")
    |> request.set_port(8081)
    |> request.set_path("/api/v1/dialogs")
    |> request.set_query([#("limit", "20")])
    |> request.set_header("X-Session-ID", config.session_id)

  case httpc.send(req) {
    Ok(response) -> Ok(response.body)
    Error(_) -> Error("HTTP request failed")
  }
}

/// Получить историю сообщений из чата
fn get_history(config: telegram_agent.TelegramAgentConfig, chat_id: String) -> Result(String, String) {
  let req = request.new()
    |> request.set_scheme(http.Http)
    |> request.set_method(http.Get)
    |> request.set_host("localhost")
    |> request.set_port(8081)
    |> request.set_path("/api/v1/history/" <> chat_id)
    |> request.set_query([#("limit", "5")])
    |> request.set_header("X-Session-ID", config.session_id)

  case httpc.send(req) {
    Ok(response) -> Ok(response.body)
    Error(_) -> Error("HTTP request failed")
  }
}

/// Обработать список диалогов with event bus и дедупликацией
fn process_dialogs_with_events(
  state: telegram_agent.AgentState,
  dialogs_json: String,
  bus: Option(Subject(event_bus.PubSubMessage)),
  seen_ids: Set(String),
) -> #(telegram_agent.AgentState, Set(String)) {
  // Находим все ID групп из JSON
  let group_ids = extract_group_ids(dialogs_json)

  // Обрабатываем КАЖДУЮ группу, передавая seen_ids через fold
  list.fold(group_ids, #(state, seen_ids), fn(acc, group_id) {
    let #(acc_state, acc_seen) = acc

    // Логируем сообщения из ВСЕХ групп (с фильтрацией уже виденных)
    let new_seen = log_chat_messages_with_events(acc_state.config, group_id, bus, acc_seen)

    // Авто-ответ только в целевых чатах
    case target_chats.should_process_chat(group_id) {
      False -> #(acc_state, new_seen)
      True -> {
        logging.info("Processing target chat for auto-reply: " <> group_id)
        process_chat_messages_with_events(acc_state, group_id, bus, new_seen)
      }
    }
  })
}

/// Логировать сообщения из чата with event bus и дедупликацией
fn log_chat_messages_with_events(
  config: telegram_agent.TelegramAgentConfig,
  chat_id: String,
  bus: Option(Subject(event_bus.PubSubMessage)),
  seen_ids: Set(String),
) -> Set(String) {
  case get_history(config, chat_id) {
    Error(_) -> seen_ids
    Ok(history_json) -> {
      // Парсим сообщения
      let messages = extract_messages(history_json)

      // Фильтруем и логируем только новые сообщения
      list.fold(messages, seen_ids, fn(acc_seen, msg) {
        let #(msg_id, from_name, text) = msg
        let unique_id = chat_id <> ":" <> int.to_string(msg_id)

        // Проверяем, видели ли мы это сообщение
        case set.contains(acc_seen, unique_id) {
          True -> acc_seen  // Уже видели - пропускаем
          False -> {
            // Новое сообщение - логируем и публикуем
            logging.telegram_message(chat_id, from_name, text)

            publish_event(bus, event_bus.telegram_message(
              chat_id,
              msg_id,
              from_name,
              text,
              get_timestamp(),
            ))

            // Добавляем в seen_ids
            set.insert(acc_seen, unique_id)
          }
        }
      })
    }
  }
}

/// Извлечь ID групп из JSON ответа
fn extract_group_ids(json: String) -> List(String) {
  // Простой парсинг - ищем "id": числа
  let parts = string.split(json, "\"id\":")

  list.filter_map(parts, fn(part) {
    case string.split(part, ",") {
      [first, ..] -> {
        let cleaned = string.trim(first)
        case string.starts_with(cleaned, "-") || is_digit_string(cleaned) {
          True -> Ok(cleaned)
          False -> Error(Nil)
        }
      }
      [] -> Error(Nil)
    }
  })
}

/// Проверить, является ли строка числом
fn is_digit_string(s: String) -> Bool {
  case int.parse(s) {
    Ok(_) -> True
    Error(_) -> False
  }
}

/// Обработать сообщения из чата with event bus и дедупликацией
fn process_chat_messages_with_events(
  state: telegram_agent.AgentState,
  chat_id: String,
  bus: Option(Subject(event_bus.PubSubMessage)),
  seen_ids: Set(String),
) -> #(telegram_agent.AgentState, Set(String)) {
  case get_history(state.config, chat_id) {
    Error(_) -> #(state, seen_ids)
    Ok(history_json) -> {
      // Парсим сообщения
      let messages = extract_messages(history_json)

      // Обрабатываем каждое сообщение с дедупликацией
      list.fold(messages, #(state, seen_ids), fn(acc, msg) {
        let #(acc_state, acc_seen) = acc
        let #(msg_id, from_name, text) = msg
        let unique_id = chat_id <> ":" <> int.to_string(msg_id)

        // Проверяем, видели ли мы это сообщение
        case set.contains(acc_seen, unique_id) {
          True -> acc  // Уже обработали - пропускаем
          False -> {
            // Логируем сообщение
            logging.telegram_message(chat_id, from_name, text)

            // Publish telegram message event
            publish_event(bus, event_bus.telegram_message(
              chat_id,
              msg_id,
              from_name,
              text,
              get_timestamp(),
            ))

            // Обрабатываем через telegram_agent и публикуем события
            let new_state = telegram_agent.handle_incoming_message(
              acc_state,
              chat_id,
              from_name,
              text,
              msg_id,
            )

            // Check if agent replied (state changed - reply was sent)
            case new_state.total_messages > acc_state.total_messages {
              True -> {
                // Agent processed and possibly replied - publish trigger event
                publish_event(bus, event_bus.trigger_detected(
                  chat_id,
                  "trigger_found",
                  get_timestamp(),
                ))
              }
              False -> Nil
            }

            // Возвращаем обновлённое состояние и seen_ids
            #(new_state, set.insert(acc_seen, unique_id))
          }
        }
      })
    }
  }
}

/// Извлечь сообщения из JSON ответа
/// Формат: {"messages":[{"id":123,"text":"...","from_name":"..."},...]}
fn extract_messages(json: String) -> List(#(Int, String, String)) {
  // Разбиваем по объектам сообщений
  let message_parts = string.split(json, "{\"id\":")

  list.filter_map(list.drop(message_parts, 1), fn(part) {
    // Парсим каждый объект сообщения
    parse_message_object(part)
  })
}

/// Парсит один объект сообщения из строки
fn parse_message_object(part: String) -> Result(#(Int, String, String), Nil) {
  // Извлекаем id (первое число до запятой)
  let id = case string.split(part, ",") {
    [id_str, ..] -> {
      case int.parse(string.trim(id_str)) {
        Ok(n) -> n
        Error(_) -> 0
      }
    }
    _ -> 0
  }

  // Извлекаем text
  let text = extract_json_field(part, "text")

  // Извлекаем from_name (fallback на "User" если пустое)
  let from_name = case extract_json_field(part, "from_name") {
    "" -> "User"
    name -> name
  }

  // Пропускаем только сообщения с пустым текстом (медиа-сообщения)
  case text {
    "" -> Error(Nil)
    _ -> Ok(#(id, from_name, text))
  }
}

/// Извлекает значение поля из JSON строки
fn extract_json_field(json: String, field: String) -> String {
  // Ищем "field":"value"
  let pattern = "\"" <> field <> "\":\""
  case string.split(json, pattern) {
    [_, rest, ..] -> {
      // Берём всё до закрывающей кавычки
      case string.split(rest, "\"") {
        [value, ..] -> value
        _ -> ""
      }
    }
    _ -> ""
  }
}

/// Запустить polling loop (бесконечный цикл в отдельном процессе)
pub fn start_polling(subject: Subject(PollingMessage)) {
  logging.info("Starting polling loop...")

  // Запускаем polling loop в отдельном linked-процессе
  let _ = process.spawn(fn() {
    polling_loop(subject)
  })
  Nil
}

/// Бесконечный цикл polling
fn polling_loop(subject: Subject(PollingMessage)) {
  // Отправляем Poll message
  process.send(subject, Poll)

  // Ждём 5 секунд
  process.sleep(5000)

  // Рекурсивный вызов
  polling_loop(subject)
}

/// Остановить polling
pub fn stop_polling(subject: Subject(PollingMessage)) {
  process.send(subject, Stop)
}
