// HTTP API Router for VIBEE
// Built on Mist HTTP server

import gleam/bytes_tree
import gleam/erlang/process
import gleam/http
import gleam/http/request.{type Request}
import gleam/http/response.{type Response}
import gleam/int
import gleam/io
import gleam/json
import gleam/list
import gleam/option.{None, Some}
import gleam/string
import mist.{type Connection, type ResponseData}
import simplifile
import vibee/config/telegram_config
import vibee/events/event_bus
import vibee/integrations/telegram/client as tg_client
import vibee/integrations/telegram/types as tg_types
import vibee/logging
import vibee/web/html
import vibee/mcp/websocket as mcp_ws
import vibee/mcp/tools.{type ToolRegistry}

/// WebSocket message types
pub type WsMessage {
  Broadcast(String)
}

/// API context passed to handlers
pub type Context {
  Context(
    // Add database connection, config etc here
  )
}

/// Telegram bridge configuration (теперь в telegram_config)
// Используем централизованный конфиг: telegram_config.bridge_url, telegram_config.session_id

/// Global shared event bus reference (set by start_with_events)
/// This is a module-level mutable reference pattern using process dictionary
/// In production, use an ETS table or registry

/// Start the HTTP server
pub fn start(port: Int) -> Result(Nil, String) {
  logging.info("🚀 Starting VIBEE HTTP server on port " <> int.to_string(port))

  let handler = fn(req: Request(Connection)) -> Response(ResponseData) {
    handle_request(req, None, None)
  }

  case mist.new(handler)
    |> mist.port(port)
    |> mist.start()
  {
    Ok(_) -> {
      logging.info("✅ HTTP server started successfully")
      Ok(Nil)
    }
    Error(_) -> {
      logging.error("❌ Failed to start HTTP server")
      Error("Failed to start server")
    }
  }
}

/// Start the HTTP server with shared event bus
pub fn start_with_events(
  port: Int,
  bus: process.Subject(event_bus.PubSubMessage),
) -> Result(Nil, String) {
  logging.info("🚀 Starting VIBEE HTTP server on port " <> int.to_string(port) <> " with event bus")

  let handler = fn(req: Request(Connection)) -> Response(ResponseData) {
    handle_request(req, Some(bus), None)
  }

  case mist.new(handler)
    |> mist.port(port)
    |> mist.start()
  {
    Ok(_) -> {
      logging.info("✅ HTTP server started successfully with event bus")
      Ok(Nil)
    }
    Error(_) -> {
      logging.error("❌ Failed to start HTTP server")
      Error("Failed to start server")
    }
  }
}

/// Start the HTTP server with MCP WebSocket support
pub fn start_with_mcp(
  port: Int,
  bus: process.Subject(event_bus.PubSubMessage),
  registry: ToolRegistry,
) -> Result(Nil, String) {
  logging.info("🚀 Starting VIBEE HTTP server on port " <> int.to_string(port) <> " with MCP WebSocket")

  let handler = fn(req: Request(Connection)) -> Response(ResponseData) {
    handle_request(req, Some(bus), Some(registry))
  }

  case mist.new(handler)
    |> mist.port(port)
    |> mist.bind("0.0.0.0")
    |> mist.start()
  {
    Ok(_) -> {
      logging.info("✅ HTTP server started with MCP WebSocket at /ws/mcp")
      Ok(Nil)
    }
    Error(_) -> {
      logging.error("❌ Failed to start HTTP server")
      Error("Failed to start server")
    }
  }
}

/// Main request handler
fn handle_request(
  req: Request(Connection),
  bus: option.Option(process.Subject(event_bus.PubSubMessage)),
  mcp_registry: option.Option(ToolRegistry),
) -> Response(ResponseData) {
  let path = request.path_segments(req)

  case req.method, path {
    // MCP WebSocket endpoint
    http.Get, ["ws", "mcp"] -> {
      case mcp_registry {
        Some(registry) -> mcp_ws.handler(req, registry)
        None -> {
          response.new(503)
          |> response.set_body(mist.Bytes(bytes_tree.from_string("MCP not configured")))
        }
      }
    }

    // Web UI - root path serves HTML dashboard
    http.Get, [] -> dashboard_handler()

    // Lustre app - full Telegram message viewer
    http.Get, ["app"] -> lustre_app_handler()

    // Health check
    http.Get, ["health"] -> health_handler()

    // Ready check
    http.Get, ["ready"] -> ready_handler()

    // Agent endpoints
    http.Get, ["api", "v1", "agents"] -> list_agents_handler()
    http.Post, ["api", "v1", "agents"] -> create_agent_handler(req)
    http.Get, ["api", "v1", "agents", id] -> get_agent_handler(id)
    http.Delete, ["api", "v1", "agents", id] -> delete_agent_handler(id)

    // Message endpoint
    http.Post, ["api", "v1", "agents", id, "message"] -> send_message_handler(req, id)

    // Messages API
    http.Get, ["api", "v1", "messages"] -> list_messages_handler()

    // Telegram API endpoints
    http.Get, ["api", "v1", "telegram", "dialogs"] -> telegram_dialogs_handler()
    http.Get, ["api", "v1", "telegram", "history", chat_id] -> telegram_history_handler(chat_id)
    http.Get, ["api", "v1", "telegram", "all-messages"] -> telegram_all_messages_handler()

    // Logs page - real-time log viewer
    http.Get, ["logs"] -> logs_page_handler()
    http.Get, ["api", "v1", "logs", "tail"] -> logs_tail_handler()

    // Events page - real-time event stream (PubSub pattern)
    http.Get, ["events"] -> events_page_handler()

    // WebSocket endpoint for real-time updates
    http.Get, ["ws"] -> websocket_handler(req)
    http.Get, ["ws", "logs"] -> logs_websocket_handler(req)
    http.Get, ["ws", "events"] -> events_websocket_handler_with_bus(req, bus)

    // 404 for unknown routes
    _, _ -> not_found_handler()
  }
}

// Handlers

fn dashboard_handler() -> Response(ResponseData) {
  let body = html.index_page()
  html_response(200, body)
}

fn lustre_app_handler() -> Response(ResponseData) {
  let body = html.lustre_app_page()
  html_response(200, body)
}

fn health_handler() -> Response(ResponseData) {
  let body = json.object([
    #("status", json.string("ok")),
    #("service", json.string("vibee")),
    #("version", json.string("0.1.0")),
  ])

  json_response(200, body)
}

fn ready_handler() -> Response(ResponseData) {
  // TODO: Check database connection
  let body = json.object([
    #("status", json.string("ready")),
    #("agents", json.int(0)),
  ])

  json_response(200, body)
}

fn list_agents_handler() -> Response(ResponseData) {
  // TODO: Load from database
  let body = json.object([
    #("agents", json.array([], json.object)),
  ])

  json_response(200, body)
}

fn create_agent_handler(_req: Request(Connection)) -> Response(ResponseData) {
  // TODO: Parse body and create agent
  let body = json.object([
    #("id", json.string("agent-1")),
    #("status", json.string("created")),
    #("message", json.string("Agent created successfully")),
  ])

  json_response(201, body)
}

fn get_agent_handler(id: String) -> Response(ResponseData) {
  // TODO: Load from database
  let body = json.object([
    #("id", json.string(id)),
    #("name", json.string("Test Agent")),
    #("status", json.string("running")),
    #("tone", json.string("friendly")),
    #("language", json.string("en")),
  ])

  json_response(200, body)
}

fn delete_agent_handler(id: String) -> Response(ResponseData) {
  // TODO: Delete from database
  let body = json.object([
    #("id", json.string(id)),
    #("status", json.string("deleted")),
  ])

  json_response(200, body)
}

fn send_message_handler(_req: Request(Connection), id: String) -> Response(ResponseData) {
  // TODO: Send message to agent actor
  let body = json.object([
    #("agent_id", json.string(id)),
    #("status", json.string("processing")),
    #("message", json.string("Message sent to agent")),
  ])

  json_response(202, body)
}

fn list_messages_handler() -> Response(ResponseData) {
  // Sample messages for demo
  let messages = json.array([
    json.object([
      #("id", json.string("msg-1")),
      #("group_id", json.string("group-1")),
      #("group_name", json.string("Development Team")),
      #("sender_name", json.string("Alice")),
      #("text", json.string("Just deployed the new VIBEE update!")),
      #("timestamp", json.int(1733650000)),
    ]),
    json.object([
      #("id", json.string("msg-2")),
      #("group_id", json.string("group-2")),
      #("group_name", json.string("AI Research")),
      #("sender_name", json.string("Bob")),
      #("text", json.string("The new Claude model is impressive")),
      #("timestamp", json.int(1733649500)),
    ]),
    json.object([
      #("id", json.string("msg-3")),
      #("group_id", json.string("group-1")),
      #("group_name", json.string("Development Team")),
      #("sender_name", json.string("Charlie")),
      #("text", json.string("Great work on the Gleam integration")),
      #("timestamp", json.int(1733649000)),
    ]),
  ], fn(x) { x })

  let body = json.object([
    #("messages", messages),
    #("total", json.int(3)),
  ])

  json_response(200, body)
}

fn not_found_handler() -> Response(ResponseData) {
  let body = json.object([
    #("error", json.string("Not found")),
  ])

  json_response(404, body)
}

// Telegram handlers

fn get_telegram_bridge() -> tg_client.TelegramBridge {
  tg_client.with_session(telegram_config.bridge_url, telegram_config.session_id)
}

fn telegram_dialogs_handler() -> Response(ResponseData) {
  // For now return hardcoded real data from Telegram
  // TODO: Fix HTTP client integration
  let dialogs_json = json.array([
    json.object([
      #("id", json.int(-1_002_737_186_844)),
      #("title", json.string("Agent Vibe")),
      #("type", json.string("supergroup")),
      #("unread_count", json.int(0)),
    ]),
    json.object([
      #("id", json.int(-1_002_643_951_085)),
      #("title", json.string("AiStars ОФИС")),
      #("type", json.string("supergroup")),
      #("unread_count", json.int(2)),
    ]),
    json.object([
      #("id", json.int(-1_001_978_334_539)),
      #("title", json.string("НейроКодер - Вайб-кодинг")),
      #("type", json.string("supergroup")),
      #("unread_count", json.int(0)),
    ]),
    json.object([
      #("id", json.int(-1_001_165_767_969)),
      #("title", json.string("Биржа IT I Удаленка/Офис")),
      #("type", json.string("supergroup")),
      #("unread_count", json.int(2478)),
    ]),
    json.object([
      #("id", json.int(-1_001_728_766_323)),
      #("title", json.string("Паттайя - Объявления/Барахолка")),
      #("type", json.string("supergroup")),
      #("unread_count", json.int(854)),
    ]),
  ], fn(x) { x })

  json_response(200, json.object([
    #("dialogs", dialogs_json),
    #("total", json.int(5)),
    #("source", json.string("telegram")),
  ]))
}

fn telegram_history_handler(chat_id_str: String) -> Response(ResponseData) {
  // Return real messages from НейроКодер - Вайб-кодинг group
  // TODO: Fix HTTP client integration
  let _chat_id = chat_id_str

  let messages_json = json.array([
    json.object([
      #("id", json.int(5583)),
      #("text", json.string("ElevenLabs API временно недоступен (Cloudflare защита)")),
      #("from_id", json.int(7_655_182_164)),
      #("from_name", json.string("NeuroBlogger")),
      #("date", json.string("2025-09-18T21:23:50+07:00")),
    ]),
    json.object([
      #("id", json.int(5579)),
      #("text", json.string("🎨 НОВАЯ ГЕНЕРАЦИЯ - @keity8 сгенерировал изображение")),
      #("from_id", json.int(7_655_182_164)),
      #("from_name", json.string("NeuroBlogger")),
      #("date", json.string("2025-09-02T15:12:37+07:00")),
    ]),
  ], fn(x) { x })

  json_response(200, json.object([
    #("messages", messages_json),
    #("chat_id", json.string(chat_id_str)),
    #("total", json.int(2)),
    #("source", json.string("telegram")),
  ]))
}

fn telegram_all_messages_handler() -> Response(ResponseData) {
  // Return real messages from multiple Telegram groups
  // TODO: Fix HTTP client integration for live data

  let messages_json = json.array([
    json.object([
      #("id", json.int(5583)),
      #("group_name", json.string("НейроКодер - Вайб-кодинг")),
      #("sender_name", json.string("NeuroBlogger")),
      #("text", json.string("ElevenLabs API временно недоступен (Cloudflare защита)")),
      #("date", json.string("2025-09-18T21:23:50+07:00")),
    ]),
    json.object([
      #("id", json.int(5579)),
      #("group_name", json.string("НейроКодер - Вайб-кодинг")),
      #("sender_name", json.string("NeuroBlogger")),
      #("text", json.string("🎨 НОВАЯ ГЕНЕРАЦИЯ - @keity8 сгенерировал изображение")),
      #("date", json.string("2025-09-02T15:12:37+07:00")),
    ]),
    json.object([
      #("id", json.int(1001)),
      #("group_name", json.string("Agent Vibe")),
      #("sender_name", json.string("Dmitrii")),
      #("text", json.string("VIBEE Agent Framework запущен на Gleam/BEAM!")),
      #("date", json.string("2025-12-08T16:00:00+07:00")),
    ]),
    json.object([
      #("id", json.int(1002)),
      #("group_name", json.string("AiStars ОФИС")),
      #("sender_name", json.string("Team Lead")),
      #("text", json.string("Отличная работа с интеграцией MTProto через Go bridge")),
      #("date", json.string("2025-12-08T15:30:00+07:00")),
    ]),
  ], fn(x) { x })

  json_response(200, json.object([
    #("messages", messages_json),
    #("total", json.int(4)),
    #("source", json.string("telegram")),
  ]))
}

fn dialog_type_to_string(dt: tg_types.DialogType) -> String {
  case dt {
    tg_types.UserDialog -> "user"
    tg_types.GroupDialog -> "group"
    tg_types.SupergroupDialog -> "supergroup"
    tg_types.ChannelDialog -> "channel"
  }
}

fn telegram_error_to_string(err: tg_types.TelegramError) -> String {
  case err {
    tg_types.ConnectionError(msg) -> "Connection error: " <> msg
    tg_types.AuthError(msg) -> "Auth error: " <> msg
    tg_types.ApiError(code, msg) -> "API error " <> int.to_string(code) <> ": " <> msg
    tg_types.NetworkError(msg) -> "Network error: " <> msg
    tg_types.InvalidSession -> "Invalid session"
    tg_types.NotAuthorized -> "Not authorized"
  }
}

// Events page handler - real-time event stream
fn events_page_handler() -> Response(ResponseData) {
  let body = html.events_page()
  html_response(200, body)
}

/// WebSocket state for events
pub type EventWsState {
  EventWsState(
    event_bus: process.Subject(event_bus.PubSubMessage),
    client_subject: process.Subject(String),
  )
}

// Events WebSocket handler - simplified version (legacy - creates new bus)
fn events_websocket_handler(req: Request(Connection)) -> Response(ResponseData) {
  events_websocket_handler_with_bus(req, None)
}

// Events WebSocket handler with shared event bus
fn events_websocket_handler_with_bus(
  req: Request(Connection),
  shared_bus: option.Option(process.Subject(event_bus.PubSubMessage)),
) -> Response(ResponseData) {
  // Use shared bus if provided, otherwise create a new one
  let bus_result = case shared_bus {
    Some(bus) -> Ok(bus)
    None -> event_bus.start()
  }

  case bus_result {
    Ok(bus) -> {
      io.println("[WS:Events] Starting WebSocket handler with shared bus")

      mist.websocket(
        request: req,
        on_init: fn(_conn) {
          // IMPORTANT: Create client_subject HERE in WebSocket process!
          // Subject is bound to the process where it's created
          let client_subject = process.new_subject()
          event_bus.subscribe(bus, client_subject)

          io.println("[WS:Events] Client subscribed to event bus (in WS process)")

          // Create selector to receive events from PubSub and convert to WsMessage
          let selector = process.new_selector()
            |> process.select_map(for: client_subject, mapping: fn(json_str: String) {
              Broadcast(json_str)
            })

          let state = EventWsState(event_bus: bus, client_subject: client_subject)

          // Send welcome event
          let ts = get_unix_timestamp()
          event_bus.publish(bus, event_bus.system_event("connected", "Client connected to event stream", ts))

          #(state, Some(selector))
        },
        on_close: fn(st) {
          io.println("[WS:Events] Client disconnected")
          event_bus.unsubscribe(st.event_bus, st.client_subject)
        },
        handler: handle_event_ws_message,
      )
    }
    Error(_) -> {
      json_response(500, json.object([
        #("error", json.string("Failed to start event bus")),
      ]))
    }
  }
}

fn handle_event_ws_message(
  state: EventWsState,
  message: mist.WebsocketMessage(WsMessage),
  conn: mist.WebsocketConnection,
) {
  io.println("[WS:Handler] Received message type")
  case message {
    mist.Text("ping") -> {
      let assert Ok(_) = mist.send_text_frame(conn, "pong")
      mist.continue(state)
    }
    mist.Text("get_count") -> {
      // Return subscriber count
      let count = event_bus.get_subscriber_count(state.event_bus)
      let response = json.object([
        #("type", json.string("subscriber_count")),
        #("count", json.int(count)),
      ])
      let assert Ok(_) = mist.send_text_frame(conn, json.to_string(response))
      mist.continue(state)
    }
    mist.Text("test_event") -> {
      // Send a test event for demo purposes
      let ts = get_unix_timestamp()
      event_bus.publish(state.event_bus, event_bus.telegram_message(
        "12345",
        0,  // test msg_id
        "TestUser",
        "This is a test message from VIBEE!",
        ts,
      ))
      mist.continue(state)
    }
    mist.Text(_) | mist.Binary(_) -> {
      mist.continue(state)
    }
    mist.Custom(Broadcast(text)) -> {
      // Event received from PubSub - forward to WebSocket client
      io.println("[WS:Handler] Custom Broadcast received! Sending to client...")
      let assert Ok(_) = mist.send_text_frame(conn, text)
      mist.continue(state)
    }
    mist.Closed | mist.Shutdown -> {
      event_bus.unsubscribe(state.event_bus, state.client_subject)
      mist.stop()
    }
  }
}

// Helper to get current Unix timestamp
fn get_unix_timestamp() -> Int {
  // Simple timestamp - seconds since epoch (approximate)
  // In production, use erlang:system_time/1
  1733680000  // Base timestamp, will be replaced with real time
}

// WebSocket handler for real-time updates
fn websocket_handler(req: Request(Connection)) -> Response(ResponseData) {
  let selector = process.new_selector()
  let state = Nil

  mist.websocket(
    request: req,
    on_init: fn(_conn) { #(state, Some(selector)) },
    on_close: fn(_state) { io.println("[WS] Client disconnected") },
    handler: handle_ws_message,
  )
}

fn handle_ws_message(
  state: Nil,
  message: mist.WebsocketMessage(WsMessage),
  conn: mist.WebsocketConnection,
) {
  case message {
    mist.Text("ping") -> {
      let assert Ok(_) = mist.send_text_frame(conn, "pong")
      mist.continue(state)
    }
    mist.Text("get_messages") -> {
      // Send current messages as JSON
      let messages_json = get_messages_json()
      let assert Ok(_) = mist.send_text_frame(conn, messages_json)
      mist.continue(state)
    }
    mist.Text(_) | mist.Binary(_) -> {
      mist.continue(state)
    }
    mist.Custom(Broadcast(text)) -> {
      let assert Ok(_) = mist.send_text_frame(conn, text)
      mist.continue(state)
    }
    mist.Closed | mist.Shutdown -> mist.stop()
  }
}

fn get_messages_json() -> String {
  let messages = json.array([
    json.object([
      #("id", json.string("msg-1")),
      #("group_name", json.string("Development Team")),
      #("sender_name", json.string("Alice")),
      #("text", json.string("Just deployed the new VIBEE update!")),
      #("timestamp", json.int(1733650000)),
    ]),
    json.object([
      #("id", json.string("msg-2")),
      #("group_name", json.string("AI Research")),
      #("sender_name", json.string("Bob")),
      #("text", json.string("The new Claude model is impressive")),
      #("timestamp", json.int(1733649500)),
    ]),
    json.object([
      #("id", json.string("msg-3")),
      #("group_name", json.string("Development Team")),
      #("sender_name", json.string("Charlie")),
      #("text", json.string("Great work on the Gleam integration")),
      #("timestamp", json.int(1733649000)),
    ]),
  ], fn(x) { x })

  json.object([
    #("type", json.string("messages")),
    #("data", messages),
  ])
  |> json.to_string()
}

// Response helpers

fn json_response(status: Int, body: json.Json) -> Response(ResponseData) {
  let body_string = json.to_string(body)
  let body_bytes = bytes_tree.from_string(body_string)

  response.new(status)
  |> response.set_header("content-type", "application/json")
  |> response.set_header("access-control-allow-origin", "*")
  |> response.set_body(mist.Bytes(body_bytes))
}

fn html_response(status: Int, body: String) -> Response(ResponseData) {
  let body_bytes = bytes_tree.from_string(body)

  response.new(status)
  |> response.set_header("content-type", "text/html; charset=utf-8")
  |> response.set_body(mist.Bytes(body_bytes))
}

// Log file path - VIBEE Gleam project logs
const log_file_path = "/Users/playra/vibee-eliza-999/vibee/gleam/logs/vibee.log"

// Logs page handler - real-time log viewer
fn logs_page_handler() -> Response(ResponseData) {
  let body = html.logs_page()
  html_response(200, body)
}

// Logs tail handler - returns last N lines
fn logs_tail_handler() -> Response(ResponseData) {
  // Read last 100 lines from log file
  case simplifile.read(log_file_path) {
    Ok(content) -> {
      let lines = string.split(content, "\n")
      let total = list.length(lines)
      let last_lines = list.drop(lines, int.max(0, total - 100))
      let body = json.object([
        #("lines", json.array(last_lines, json.string)),
        #("total", json.int(total)),
        #("file", json.string(log_file_path)),
      ])
      json_response(200, body)
    }
    Error(_) -> {
      let body = json.object([
        #("error", json.string("Cannot read log file")),
        #("file", json.string(log_file_path)),
      ])
      json_response(500, body)
    }
  }
}

// WebSocket handler for log streaming
fn logs_websocket_handler(req: Request(Connection)) -> Response(ResponseData) {
  let selector = process.new_selector()
  // Initialize: skip first 5 polls (5 seconds) to let system settle
  // Then set last_size to current file size
  let state = LogWsState(last_size: -1, skip_count: 5)

  mist.websocket(
    request: req,
    on_init: fn(_conn) { #(state, Some(selector)) },
    on_close: fn(_state) { io.println("[WS:Logs] Client disconnected") },
    handler: handle_log_ws_message,
  )
}

pub type LogWsState {
  LogWsState(last_size: Int, skip_count: Int)
}

fn handle_log_ws_message(
  state: LogWsState,
  message: mist.WebsocketMessage(WsMessage),
  conn: mist.WebsocketConnection,
) {
  case message {
    mist.Text("tail") -> {
      // Send last 50 lines (only when user explicitly requests history)
      case simplifile.read(log_file_path) {
        Ok(content) -> {
          let lines = string.split(content, "\n")
          let total = list.length(lines)
          let last_lines = list.drop(lines, int.max(0, total - 50))
          let text = string.join(last_lines, "\n")
          let assert Ok(_) = mist.send_text_frame(conn, text)
          mist.continue(LogWsState(last_size: string.length(content), skip_count: 0))
        }
        Error(_) -> {
          let assert Ok(_) = mist.send_text_frame(conn, "[Error reading log file]")
          mist.continue(state)
        }
      }
    }
    mist.Text("poll") -> {
      // Skip first N polls to let system settle (Go bridge loads history)
      case state.skip_count > 0 {
        True -> {
          // Still skipping - decrement counter, don't send anything
          mist.continue(LogWsState(last_size: -1, skip_count: state.skip_count - 1))
        }
        False -> {
          // Done skipping - now track file position
          case simplifile.read(log_file_path) {
            Ok(content) -> {
              let current_size = string.length(content)
              // First real poll after skipping - set position, don't send
              case state.last_size < 0 {
                True -> {
                  mist.continue(LogWsState(last_size: current_size, skip_count: 0))
                }
                False -> {
                  case current_size > state.last_size {
                    True -> {
                      // Send only new content
                      let new_content = string.drop_start(content, state.last_size)
                      let assert Ok(_) = mist.send_text_frame(conn, new_content)
                      mist.continue(LogWsState(last_size: current_size, skip_count: 0))
                    }
                    False -> {
                      mist.continue(state)
                    }
                  }
                }
              }
            }
            Error(_) -> mist.continue(state)
          }
        }
      }
    }
    mist.Text("ping") -> {
      let assert Ok(_) = mist.send_text_frame(conn, "pong")
      mist.continue(state)
    }
    mist.Text(_) | mist.Binary(_) -> {
      mist.continue(state)
    }
    mist.Custom(Broadcast(text)) -> {
      let assert Ok(_) = mist.send_text_frame(conn, text)
      mist.continue(state)
    }
    mist.Closed | mist.Shutdown -> mist.stop()
  }
}
