#!/bin/sh

# CLI Agent Template для VIBEE Agent System
# Available environment variables:
#   $TRAYCER_PROMPT - The prompt to be executed
#   $TRAYCER_PROMPT_TMP_FILE - Temporary file path containing the prompt content
#   $TRAYCER_TASK_ID - Traycer task identifier
#   $TRAYCER_PHASE_BREAKDOWN_ID - Traycer phase breakdown identifier
#   $TRAYCER_PHASE_ID - Traycer per phase identifier

# Запускаем VIBEE Agent System вместо Claude CLI
exec "$(dirname "$0")/traycer-vibee-agent.sh" "$@"
