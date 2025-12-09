package config

import (
	"fmt"
	"os"
)

// Config holds all configuration for the telegram bridge
type Config struct {
	// Server config
	Port string

	// Telegram MTProto config
	AppID   int
	AppHash string

	// Session storage
	SessionDir string

	// PostgreSQL (optional, for session persistence)
	DatabaseURL string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	cfg := &Config{
		Port:       getEnv("PORT", "8081"), // Default to 8081 to not conflict with Gleam on 8080
		SessionDir: getEnv("SESSION_DIR", "./sessions"),
	}

	// Telegram credentials are optional at startup
	// They can be provided via API when connecting
	appIDStr := os.Getenv("TELEGRAM_APP_ID")
	if appIDStr != "" {
		var appID int
		_, err := fmt.Sscanf(appIDStr, "%d", &appID)
		if err != nil {
			return nil, fmt.Errorf("invalid TELEGRAM_APP_ID: %w", err)
		}
		cfg.AppID = appID
	}

	cfg.AppHash = os.Getenv("TELEGRAM_APP_HASH")
	cfg.DatabaseURL = os.Getenv("DATABASE_URL")

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
