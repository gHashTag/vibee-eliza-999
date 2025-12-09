// Response Caching for MCP Tools
// ETS-backed cache with TTL support for idempotent tool responses

import gleam/json
import gleam/list

/// Cache entry with TTL
pub type CacheEntry {
  CacheEntry(
    key: String,
    value: String,
    created_at: Int,
    ttl_seconds: Int,
  )
}

/// Cache result
pub type CacheResult {
  Hit(value: String)
  Miss
  Expired
}

/// Check if tool is cacheable (idempotent, read-only)
pub fn is_cacheable(tool_name: String) -> Bool {
  let cacheable_tools = [
    // Read-only file operations
    "file_read", "file_list",
    // Telegram read operations (short TTL)
    "telegram_get_me",
    // Code analysis (deterministic)
    "code_explain", "code_find_similar",
    // Debug info (build output changes rarely)
    "debug_build",
    // Agent status
    "agent_status",
    // Auth status
    "auth_status",
  ]
  list.contains(cacheable_tools, tool_name)
}

/// Get TTL for tool (seconds)
pub fn get_tool_ttl(tool_name: String) -> Int {
  case tool_name {
    // Very short TTL for dynamic data
    "telegram_get_me" -> 60  // 1 minute
    "agent_status" -> 10  // 10 seconds
    "auth_status" -> 30  // 30 seconds

    // Medium TTL for semi-static data
    "debug_build" -> 120  // 2 minutes (until code changes)
    "telegram_get_dialogs" -> 300  // 5 minutes

    // Long TTL for static data
    "file_read" -> 600  // 10 minutes
    "file_list" -> 300  // 5 minutes
    "code_explain" -> 3600  // 1 hour (deterministic)
    "code_find_similar" -> 1800  // 30 minutes

    // Default
    _ -> 60
  }
}

/// Generate cache key from tool name and arguments
pub fn make_cache_key(tool_name: String, args: json.Json) -> String {
  let args_str = json.to_string(args)
  let args_hash = hash_string(args_str)
  tool_name <> ":" <> args_hash
}

/// Get cached response
pub fn get(key: String) -> CacheResult {
  case cache_get(key) {
    CacheNotFound -> Miss
    CacheExpired -> Expired
    CacheFound(value) -> Hit(value)
  }
}

/// Set cached response
pub fn set(key: String, value: String, ttl: Int) -> Nil {
  cache_set(key, value, ttl)
}

/// Invalidate cache entry
pub fn invalidate(key: String) -> Nil {
  cache_delete(key)
}

/// Invalidate all entries for a tool
pub fn invalidate_tool(tool_name: String) -> Nil {
  cache_delete_prefix(tool_name <> ":")
}

/// Clear entire cache
pub fn clear() -> Nil {
  cache_clear()
}

/// Get cache statistics
pub fn stats() -> CacheStats {
  cache_stats()
}

/// Cache statistics
pub type CacheStats {
  CacheStats(
    size: Int,
    hits: Int,
    misses: Int,
    hit_rate: Float,
  )
}

// ============================================================
// Internal types for FFI
// ============================================================

type CacheLookup {
  CacheFound(value: String)
  CacheNotFound
  CacheExpired
}

// ============================================================
// FFI for ETS cache operations
// ============================================================

@external(erlang, "vibee_cache_ffi", "init")
pub fn init() -> Nil

@external(erlang, "vibee_cache_ffi", "get")
fn cache_get(key: String) -> CacheLookup

@external(erlang, "vibee_cache_ffi", "set")
fn cache_set(key: String, value: String, ttl: Int) -> Nil

@external(erlang, "vibee_cache_ffi", "delete")
fn cache_delete(key: String) -> Nil

@external(erlang, "vibee_cache_ffi", "delete_prefix")
fn cache_delete_prefix(prefix: String) -> Nil

@external(erlang, "vibee_cache_ffi", "clear")
fn cache_clear() -> Nil

@external(erlang, "vibee_cache_ffi", "stats")
fn cache_stats() -> CacheStats

@external(erlang, "vibee_cache_ffi", "hash_string")
fn hash_string(s: String) -> String
