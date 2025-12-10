// VIBEE - Agent Framework on Gleam/BEAM
// Entry point for the application
// Checks VIBEE_MODE env var: "mcp" for MCP WebSocket Server, otherwise Telegram agent
// Build version: 2025-12-10-v14

import gleam/io
import gleam/erlang/process
import gleam/option.{None, Some}
import vibee/api/router
import vibee/agent/polling_actor
import vibee/config/telegram_config
import vibee/events/event_bus
import vibee/telegram/telegram_agent.{TelegramAgentConfig}
import vibee/mcp/config
import vibee/mcp/tools.{init_registry}
import vibee/mcp/events
import vibee/mcp/cache
import vibee/mcp/telemetry
import vibee/mcp/session_manager
import gleam/int

pub fn main() {
  run(Nil)
}

// Entry function for erlang-shipment entrypoint.sh
pub fn run(_arg) {
  // Check if we should run MCP server
  let mode = config.get_env("VIBEE_MODE")
  case mode {
    "mcp" -> run_mcp_server()
    _ -> run_telegram_agent()
  }
}

fn run_telegram_agent() {
  io.println("VIBEE Agent Framework v0.1.0")
  io.println("============================")

  // Start the global event bus first
  io.println("[EVENTS] Starting global event bus...")
  case event_bus.start() {
    Ok(event_bus_subject) -> {
      io.println("[EVENTS] ✓ Event bus started")

      // Конфигурация агента с OpenRouter API (используем централизованный конфиг)
      // Get active session from session manager, fall back to empty string if none
      let session_id = case session_manager.get_active() {
        Some(sid) -> sid
        None -> ""
      }
      let agent_config = TelegramAgentConfig(
        bridge_url: telegram_config.bridge_url,
        session_id: session_id,
        llm_api_key: Some("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"),
        llm_model: "x-ai/grok-4.1-fast",
        auto_reply_enabled: True,
        cooldown_ms: 30_000,
      )

      // Запускаем Polling Actor (Telegram Agent) with event bus
      io.println("[AGENT] Starting VIBEE Telegram Agent...")
      case polling_actor.start_with_events(agent_config, event_bus_subject) {
        Ok(agent_subject) -> {
          io.println("[AGENT] ✓ Polling Actor started with event bus")

          // Запускаем polling loop
          polling_actor.start_polling(agent_subject)
          io.println("[AGENT] ✓ Polling loop started (every 5s)")

          // Start HTTP API server with Web UI and shared event bus
          let port = 8080
          case router.start_with_events(port, event_bus_subject) {
            Ok(_) -> {
              io.println("[OK] HTTP API started on port " <> int_to_string(port))
              io.println("")
              io.println("VIBEE is ready!")
              io.println("  Dashboard: http://localhost:" <> int_to_string(port))
              io.println("  Events:    http://localhost:" <> int_to_string(port) <> "/events")
              io.println("  API:       http://localhost:" <> int_to_string(port) <> "/api/v1")
              io.println("  Health:    http://localhost:" <> int_to_string(port) <> "/health")
              io.println("")
              io.println("Target chat: Тестовая группа (2298297094)")
              io.println("Triggers: vibee, vibe, @vibee, бот, агент")
              io.println("")

              // Keep the main process alive
              process.sleep_forever()
            }
            Error(msg) -> {
              io.println("[ERROR] Failed to start HTTP API: " <> msg)
              Nil
            }
          }
        }
        Error(_) -> {
          io.println("[ERROR] Failed to start Polling Actor")
          Nil
        }
      }
    }
    Error(_) -> {
      io.println("[ERROR] Failed to start Event Bus")
      Nil
    }
  }
}

fn int_to_string(n: Int) -> String {
  case n {
    0 -> "0"
    _ -> do_int_to_string(n, "")
  }
}

fn do_int_to_string(n: Int, acc: String) -> String {
  case n {
    0 -> acc
    _ -> {
      let digit = n % 10
      let char = case digit {
        0 -> "0"
        1 -> "1"
        2 -> "2"
        3 -> "3"
        4 -> "4"
        5 -> "5"
        6 -> "6"
        7 -> "7"
        8 -> "8"
        9 -> "9"
        _ -> "?"
      }
      do_int_to_string(n / 10, char <> acc)
    }
  }
}

// MCP WebSocket Server mode
fn run_mcp_server() {
  io.println("VIBEE MCP WebSocket Server")
  io.println("==========================")

  // Initialize modules
  io.println("[INIT] Initializing modules...")
  events.init()
  cache.init()
  telemetry.init()
  io.println("[INIT] ✓ Modules initialized")

  // Create tool registry
  io.println("[MCP] Creating tool registry...")
  let registry = init_registry()
  io.println("[MCP] ✓ Tool registry created")

  // Start event bus
  io.println("[EVENTS] Starting event bus...")
  case event_bus.start() {
    Ok(bus) -> {
      io.println("[EVENTS] ✓ Event bus started")

      // Read port from ENV (for Fly.io) or use default
      let port = case config.get_env("PORT") {
        "" -> 8080
        port_str -> case int.parse(port_str) {
          Ok(p) -> p
          Error(_) -> 8080
        }
      }
      io.println("[HTTP] Starting server on port " <> int.to_string(port) <> "...")

      case router.start_with_mcp(port, bus, registry) {
        Ok(_) -> {
          io.println("")
          io.println("✅ MCP WebSocket Server Ready!")
          io.println("")
          io.println("  WebSocket: ws://0.0.0.0:" <> int.to_string(port) <> "/ws/mcp")
          io.println("  Health:    http://0.0.0.0:" <> int.to_string(port) <> "/health")
          io.println("  Dashboard: http://0.0.0.0:" <> int.to_string(port))
          io.println("")

          // Keep alive
          process.sleep_forever()
        }
        Error(msg) -> {
          io.println("[ERROR] Failed to start server: " <> msg)
          Nil
        }
      }
    }
    Error(_) -> {
      io.println("[ERROR] Failed to start event bus")
      Nil
    }
  }
}
