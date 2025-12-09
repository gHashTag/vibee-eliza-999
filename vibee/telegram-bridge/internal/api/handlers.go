package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/vibee/telegram-bridge/internal/config"
	"github.com/vibee/telegram-bridge/internal/telegram"
)

// Router handles HTTP requests
type Router struct {
	cfg      *config.Config
	mux      *http.ServeMux
	db       *sql.DB
	clients  map[string]*telegram.Client
	upgrader websocket.Upgrader
	wsHub    *WSHub
	mu       sync.RWMutex
}

// NewRouter creates a new HTTP router
func NewRouter(cfg *config.Config, db *sql.DB) *Router {
	r := &Router{
		cfg:     cfg,
		mux:     http.NewServeMux(),
		db:      db,
		clients: make(map[string]*telegram.Client),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins for development
			},
		},
		wsHub: NewWSHub(),
	}

	// Start WebSocket hub
	go r.wsHub.Run()

	r.setupRoutes()
	return r
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	// Add CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-ID")

	if req.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	r.mux.ServeHTTP(w, req)
}

func (r *Router) setupRoutes() {
	// Health check
	r.mux.HandleFunc("/health", r.handleHealth)

	// API v1 routes
	r.mux.HandleFunc("/api/v1/connect", r.handleConnect)
	r.mux.HandleFunc("/api/v1/auth/status", r.handleAuthStatus)
	r.mux.HandleFunc("/api/v1/auth/phone", r.handleAuthPhone)
	r.mux.HandleFunc("/api/v1/auth/code", r.handleAuthCode)
	r.mux.HandleFunc("/api/v1/auth/2fa", r.handleAuth2FA)
	r.mux.HandleFunc("/api/v1/me", r.handleGetMe)
	r.mux.HandleFunc("/api/v1/dialogs", r.handleGetDialogs)
	r.mux.HandleFunc("/api/v1/history/", r.handleGetHistory)
	r.mux.HandleFunc("/api/v1/send", r.handleSendMessage)

	// WebSocket for updates
	r.mux.HandleFunc("/api/v1/updates", r.handleWebSocket)
}

// Response helpers
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Error encoding JSON: %v", err)
	}
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

// Handlers

func (r *Router) handleHealth(w http.ResponseWriter, req *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "ok",
		"service": "telegram-bridge",
		"version": "0.1.0",
	})
}

func (r *Router) handleAuthStatus(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	sessionID := req.Header.Get("X-Session-ID")

	// If no session provided, return list of active sessions
	if sessionID == "" {
		r.mu.RLock()
		sessions := make([]map[string]interface{}, 0, len(r.clients))
		for id, client := range r.clients {
			sessions = append(sessions, map[string]interface{}{
				"session_id": id,
				"authorized": client.IsAuthorized(),
			})
		}
		r.mu.RUnlock()

		respondJSON(w, http.StatusOK, map[string]interface{}{
			"status":        "ok",
			"sessions":      sessions,
			"total_sessions": len(sessions),
		})
		return
	}

	// Check specific session
	client := r.getClient(sessionID)
	if client == nil {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"status":     "not_found",
			"session_id": sessionID,
			"authorized": false,
			"message":    "Session not found. Use /api/v1/connect to create a new session.",
		})
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":     "ok",
		"session_id": sessionID,
		"authorized": client.IsAuthorized(),
	})
}

// ConnectRequest is the request body for /connect
type ConnectRequest struct {
	AppID   int    `json:"app_id"`
	AppHash string `json:"app_hash"`
	Phone   string `json:"phone,omitempty"`
}

func (r *Router) handleConnect(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var body ConnectRequest
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	if body.AppID == 0 || body.AppHash == "" {
		respondError(w, http.StatusBadRequest, "app_id and app_hash are required")
		return
	}

	// Generate session ID
	sessionID := generateSessionID()

	// Create session storage
	var sessionStorage interface {
		LoadSession(ctx context.Context) ([]byte, error)
		StoreSession(ctx context.Context, data []byte) error
	}

	if r.db != nil && body.Phone != "" {
		sessionStorage = telegram.NewPostgresSessionStorage(r.db, body.Phone)
	} else {
		sessionStorage = telegram.NewFileSessionStorage(r.cfg.SessionDir + "/" + sessionID + ".session")
	}

	// Create Telegram client
	client, err := telegram.NewClient(body.AppID, body.AppHash, sessionStorage)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create client: "+err.Error())
		return
	}

	// Connect to Telegram
	ctx := context.Background()
	if err := client.Connect(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to connect: "+err.Error())
		return
	}

	// Store client
	r.mu.Lock()
	r.clients[sessionID] = client
	r.mu.Unlock()

	// Start forwarding updates to WebSocket
	go r.forwardUpdates(sessionID, client)

	log.Printf("Connect request: app_id=%d, session=%s", body.AppID, sessionID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":      "connected",
		"session_id":  sessionID,
		"authorized":  client.IsAuthorized(),
		"message":     "Connection established. Use /auth/phone to start authentication if not authorized.",
	})
}

// AuthPhoneRequest is the request for /auth/phone
type AuthPhoneRequest struct {
	Phone string `json:"phone"`
}

func (r *Router) handleAuthPhone(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	sessionID := req.Header.Get("X-Session-ID")
	client := r.getClient(sessionID)
	if client == nil {
		respondError(w, http.StatusUnauthorized, "Invalid or missing session")
		return
	}

	var body AuthPhoneRequest
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	if body.Phone == "" {
		respondError(w, http.StatusBadRequest, "phone is required")
		return
	}

	ctx := context.Background()
	codeHash, err := client.SendCode(ctx, body.Phone)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to send code: "+err.Error())
		return
	}

	log.Printf("Auth phone request: phone=%s", body.Phone)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "code_sent",
		"code_hash": codeHash,
		"message":   "Verification code sent to phone",
	})
}

// AuthCodeRequest is the request for /auth/code
type AuthCodeRequest struct {
	Code string `json:"code"`
}

func (r *Router) handleAuthCode(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	sessionID := req.Header.Get("X-Session-ID")
	client := r.getClient(sessionID)
	if client == nil {
		respondError(w, http.StatusUnauthorized, "Invalid or missing session")
		return
	}

	var body AuthCodeRequest
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	if body.Code == "" {
		respondError(w, http.StatusBadRequest, "code is required")
		return
	}

	ctx := context.Background()
	user, err := client.SignIn(ctx, body.Code)
	if err != nil {
		// Check if 2FA required
		if strings.Contains(err.Error(), "SESSION_PASSWORD_NEEDED") {
			respondJSON(w, http.StatusOK, map[string]interface{}{
				"status":  "2fa_required",
				"message": "Two-factor authentication required",
			})
			return
		}
		respondError(w, http.StatusUnauthorized, "Failed to sign in: "+err.Error())
		return
	}

	log.Printf("Auth code request: user=%s", user.Username)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "authenticated",
		"message": "Successfully authenticated",
		"user":    user,
	})
}

// Auth2FARequest is the request for /auth/2fa
type Auth2FARequest struct {
	Password string `json:"password"`
}

func (r *Router) handleAuth2FA(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	sessionID := req.Header.Get("X-Session-ID")
	client := r.getClient(sessionID)
	if client == nil {
		respondError(w, http.StatusUnauthorized, "Invalid or missing session")
		return
	}

	var body Auth2FARequest
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	if body.Password == "" {
		respondError(w, http.StatusBadRequest, "password is required")
		return
	}

	ctx := context.Background()
	user, err := client.Check2FA(ctx, body.Password)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "2FA verification failed: "+err.Error())
		return
	}

	log.Printf("Auth 2FA request: user=%s", user.Username)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "authenticated",
		"message": "2FA verification successful",
		"user":    user,
	})
}

func (r *Router) handleGetMe(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	sessionID := req.Header.Get("X-Session-ID")
	client := r.getClient(sessionID)
	if client == nil {
		respondError(w, http.StatusUnauthorized, "Invalid or missing session")
		return
	}

	ctx := context.Background()
	user, err := client.GetMe(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get user: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, user)
}

func (r *Router) handleGetDialogs(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	sessionID := req.Header.Get("X-Session-ID")
	client := r.getClient(sessionID)
	if client == nil {
		respondError(w, http.StatusUnauthorized, "Invalid or missing session")
		return
	}

	limit := 100
	if l := req.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	ctx := context.Background()
	dialogs, err := client.GetDialogs(ctx, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get dialogs: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"dialogs": dialogs,
	})
}

func (r *Router) handleGetHistory(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodGet {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	sessionID := req.Header.Get("X-Session-ID")
	client := r.getClient(sessionID)
	if client == nil {
		respondError(w, http.StatusUnauthorized, "Invalid or missing session")
		return
	}

	// Extract chat ID from path: /api/v1/history/{chat_id}
	path := strings.TrimPrefix(req.URL.Path, "/api/v1/history/")
	chatID, err := strconv.ParseInt(path, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid chat_id")
		return
	}

	limit := 100
	if l := req.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	ctx := context.Background()
	messages, err := client.GetHistory(ctx, chatID, limit)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get history: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"messages": messages,
	})
}

// SendMessageRequest is the request for /send
type SendMessageRequest struct {
	ChatID  int64  `json:"chat_id"`
	Text    string `json:"text"`
	ReplyTo int    `json:"reply_to,omitempty"`
}

func (r *Router) handleSendMessage(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	sessionID := req.Header.Get("X-Session-ID")
	client := r.getClient(sessionID)
	if client == nil {
		respondError(w, http.StatusUnauthorized, "Invalid or missing session")
		return
	}

	var body SendMessageRequest
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	if body.ChatID == 0 || body.Text == "" {
		respondError(w, http.StatusBadRequest, "chat_id and text are required")
		return
	}

	ctx := context.Background()
	messageID, err := client.SendMessage(ctx, body.ChatID, body.Text, body.ReplyTo)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to send message: "+err.Error())
		return
	}

	log.Printf("Send message: chat_id=%d, message_id=%d", body.ChatID, messageID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":    true,
		"message_id": messageID,
	})
}

// WebSocket handler
func (r *Router) handleWebSocket(w http.ResponseWriter, req *http.Request) {
	sessionID := req.URL.Query().Get("session_id")
	if sessionID == "" {
		respondError(w, http.StatusBadRequest, "session_id query parameter required")
		return
	}

	client := r.getClient(sessionID)
	if client == nil {
		respondError(w, http.StatusUnauthorized, "Invalid session")
		return
	}

	conn, err := r.upgrader.Upgrade(w, req, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	wsClient := &WSClient{
		hub:       r.wsHub,
		conn:      conn,
		send:      make(chan []byte, 256),
		sessionID: sessionID,
	}

	r.wsHub.register <- wsClient

	go wsClient.writePump()
	go wsClient.readPump()
}

// Helper methods

func (r *Router) getClient(sessionID string) *telegram.Client {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.clients[sessionID]
}

func (r *Router) forwardUpdates(sessionID string, client *telegram.Client) {
	for update := range client.Updates() {
		data, err := json.Marshal(update)
		if err != nil {
			continue
		}
		r.wsHub.broadcast <- WSMessage{
			SessionID: sessionID,
			Data:      data,
		}
	}
}

func generateSessionID() string {
	// Simple session ID generation
	return "sess_" + strconv.FormatInt(time.Now().UnixNano(), 36)
}
