#!/bin/bash

# =============================================================================
# 📡 VIBEE MONITOR - Быстрый мониторинг логов в реальном времени
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_VIEWER="$SCRIPT_DIR/scripts/log-viewer.sh"

# Запускаем live-режим log-viewer.sh
exec "$LOG_VIEWER" live
