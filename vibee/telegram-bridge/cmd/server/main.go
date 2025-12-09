package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/lib/pq"
	"github.com/vibee/telegram-bridge/internal/api"
	"github.com/vibee/telegram-bridge/internal/config"
)

func main() {
	log.Println("🚀 Starting Telegram Bridge...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to PostgreSQL (optional)
	var db *sql.DB
	if cfg.DatabaseURL != "" {
		log.Println("📊 Connecting to PostgreSQL...")
		db, err = sql.Open("postgres", cfg.DatabaseURL)
		if err != nil {
			log.Printf("Warning: Failed to connect to database: %v", err)
		} else {
			if err := db.Ping(); err != nil {
				log.Printf("Warning: Database ping failed: %v", err)
				db = nil
			} else {
				log.Println("✅ Connected to PostgreSQL")
				defer db.Close()
			}
		}
	}

	// Create session directory if it doesn't exist
	if err := os.MkdirAll(cfg.SessionDir, 0755); err != nil {
		log.Printf("Warning: Failed to create session dir: %v", err)
	}

	// Create router
	router := api.NewRouter(cfg, db)

	// Create HTTP server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("📡 Telegram Bridge listening on port %s", cfg.Port)
		log.Printf("📝 API endpoints:")
		log.Printf("   POST /api/v1/connect     - Connect to Telegram")
		log.Printf("   POST /api/v1/auth/phone  - Send auth code")
		log.Printf("   POST /api/v1/auth/code   - Verify code")
		log.Printf("   POST /api/v1/auth/2fa    - 2FA password")
		log.Printf("   GET  /api/v1/me          - Get current user")
		log.Printf("   GET  /api/v1/dialogs     - Get dialogs")
		log.Printf("   GET  /api/v1/history/:id - Get chat history")
		log.Printf("   POST /api/v1/send        - Send message")
		log.Printf("   WS   /api/v1/updates     - WebSocket updates")

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server stopped gracefully")
}
