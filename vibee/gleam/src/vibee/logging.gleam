// VIBEE Logging Module
// Writes logs to file for real-time monitoring

import gleam/io
import gleam/string
import simplifile

const log_file = "/Users/playra/vibee-eliza-999/vibee/gleam/logs/vibee.log"

/// Log levels
pub type LogLevel {
  Info
  Warn
  Error
  Debug
}

fn level_to_string(level: LogLevel) -> String {
  case level {
    Info -> "[INFO]"
    Warn -> "[WARN]"
    Error -> "[ERROR]"
    Debug -> "[DEBUG]"
  }
}

fn level_emoji(level: LogLevel) -> String {
  case level {
    Info -> "📝"
    Warn -> "⚠️"
    Error -> "❌"
    Debug -> "🔍"
  }
}

/// Write a log message to file only (no console output for MCP compatibility)
pub fn log(level: LogLevel, message: String) -> Nil {
  let timestamp = get_timestamp()
  let level_str = level_to_string(level)
  let emoji = level_emoji(level)
  let line = timestamp <> " " <> level_str <> " " <> emoji <> " " <> message <> "\n"

  // Only write to file - MCP requires clean stdout for JSON-RPC
  let _ = simplifile.append(log_file, line)
  Nil
}

/// Convenience functions
pub fn info(message: String) -> Nil {
  log(Info, message)
}

pub fn warn(message: String) -> Nil {
  log(Warn, message)
}

pub fn error(message: String) -> Nil {
  log(Error, message)
}

pub fn debug(message: String) -> Nil {
  log(Debug, message)
}

/// Log Telegram message
pub fn telegram_message(group: String, sender: String, text: String) -> Nil {
  let message = "💬 [" <> group <> "] " <> sender <> ": " <> string.slice(text, 0, 100)
  log(Info, message)
}

/// Log API request
pub fn api_request(method: String, path: String) -> Nil {
  let message = "🌐 " <> method <> " " <> path
  log(Debug, message)
}

/// Log WebSocket event
pub fn ws_event(event: String, details: String) -> Nil {
  let message = "🔌 WS: " <> event <> " - " <> details
  log(Debug, message)
}

/// Get current timestamp using Erlang FFI
@external(erlang, "vibee_ffi", "get_formatted_timestamp")
fn get_timestamp() -> String
