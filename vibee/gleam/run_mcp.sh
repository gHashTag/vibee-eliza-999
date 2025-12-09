#!/bin/bash
# VIBEE MCP Server launcher
cd /Users/playra/vibee-eliza-999/vibee/gleam
export PATH="/opt/homebrew/bin:$PATH"
exec gleam run -m mcp_server 2>/tmp/vibee-mcp.log
