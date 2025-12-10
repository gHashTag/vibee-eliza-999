#!/bin/bash
# VIBEE MCP Server launcher
cd /Users/playra/vibee-eliza-999/vibee/gleam
export PATH="/opt/homebrew/bin:$PATH"
export DATABASE_URL="postgresql://neondb_owner:npg_A9z2dErbkfhw@ep-bitter-frog-a1bewei7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
exec gleam run -m mcp_server 2>/tmp/vibee-mcp.log
