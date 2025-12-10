package telegram

import (
	"context"
	"crypto/rand"
	"fmt"
	"sync"
	"time"

	"github.com/go-faster/errors"
	"github.com/gotd/td/crypto/srp"
	"github.com/gotd/td/session"
	"github.com/gotd/td/telegram"
	"github.com/gotd/td/telegram/message"
	"github.com/gotd/td/telegram/updates"
	"github.com/gotd/td/tg"
)

// Client wraps gotd/td Telegram client
type Client struct {
	api       *telegram.Client
	sender    *message.Sender
	gaps      *updates.Manager
	sessionID string

	appID   int
	appHash string

	// Auth state
	authFlow    *authFlow
	isConnected bool
	isAuthed    bool

	// Updates channel
	updatesCh chan Update

	mu sync.RWMutex
}

// Update represents a Telegram update
type Update struct {
	Type      string      `json:"type"`
	ChatID    int64       `json:"chat_id"`
	MessageID int         `json:"message_id"`
	Text      string      `json:"text,omitempty"`
	SenderID  int64       `json:"sender_id,omitempty"`
	Timestamp int64       `json:"timestamp"`
	Raw       interface{} `json:"-"`
}

// Dialog represents a Telegram dialog/chat
type Dialog struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Type        string `json:"type"`
	UnreadCount int    `json:"unread_count"`
	LastMessage string `json:"last_message,omitempty"`
}

// Message represents a Telegram message
type Message struct {
	ID        int    `json:"id"`
	Text      string `json:"text"`
	FromID    int64  `json:"from_id"`
	FromName  string `json:"from_name"`
	Date      string `json:"date"`
	ReplyToID int    `json:"reply_to_id,omitempty"`
}

// User represents a Telegram user
type User struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name,omitempty"`
	Username  string `json:"username,omitempty"`
	Phone     string `json:"phone,omitempty"`
}

// NewClient creates a new Telegram client
func NewClient(appID int, appHash string, sessionStorage session.Storage) (*Client, error) {
	c := &Client{
		appID:     appID,
		appHash:   appHash,
		updatesCh: make(chan Update, 100),
		authFlow:  &authFlow{},
	}

	// Create updates manager for handling gaps
	dispatcher := tg.NewUpdateDispatcher()
	c.gaps = updates.New(updates.Config{
		Handler: dispatcher,
	})

	// Register update handlers
	dispatcher.OnNewMessage(c.onNewMessage)
	dispatcher.OnEditMessage(c.onEditMessage)
	dispatcher.OnDeleteMessages(c.onDeleteMessages)

	// Create client options
	opts := telegram.Options{
		SessionStorage: sessionStorage,
		UpdateHandler:  c.gaps,
	}

	// Create client
	c.api = telegram.NewClient(appID, appHash, opts)

	return c, nil
}

// Connect establishes connection to Telegram
func (c *Client) Connect(ctx context.Context) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.isConnected {
		return nil
	}

	// Start client in background
	go func() {
		err := c.api.Run(ctx, func(ctx context.Context) error {
			c.mu.Lock()
			c.isConnected = true
			c.sender = message.NewSender(c.api.API())
			c.mu.Unlock()

			// Check if already authorized
			status, err := c.api.Auth().Status(ctx)
			if err != nil {
				return err
			}

			c.mu.Lock()
			c.isAuthed = status.Authorized
			c.mu.Unlock()

			// Keep running
			<-ctx.Done()
			return ctx.Err()
		})
		if err != nil {
			fmt.Printf("Client error: %v\n", err)
		}
	}()

	// Wait for connection
	time.Sleep(500 * time.Millisecond)

	return nil
}

// SendCode sends authentication code to phone
func (c *Client) SendCode(ctx context.Context, phone string) (string, error) {
	c.mu.Lock()
	c.authFlow.phone = phone
	c.mu.Unlock()

	// Use raw API to send code
	sentCode, err := c.api.API().AuthSendCode(ctx, &tg.AuthSendCodeRequest{
		PhoneNumber: phone,
		APIID:       c.appID,
		APIHash:     c.appHash,
		Settings:    tg.CodeSettings{},
	})
	if err != nil {
		return "", fmt.Errorf("send code: %w", err)
	}

	// Extract phone code hash based on type
	var codeHash string
	switch v := sentCode.(type) {
	case *tg.AuthSentCode:
		codeHash = v.PhoneCodeHash
	case *tg.AuthSentCodeSuccess:
		// Already authorized
		c.mu.Lock()
		c.isAuthed = true
		c.mu.Unlock()
		return "", nil
	}

	c.mu.Lock()
	c.authFlow.codeHash = codeHash
	c.mu.Unlock()

	return codeHash, nil
}

// SignIn verifies code and signs in
func (c *Client) SignIn(ctx context.Context, code string) (*User, error) {
	c.mu.RLock()
	phone := c.authFlow.phone
	codeHash := c.authFlow.codeHash
	c.mu.RUnlock()

	if phone == "" || codeHash == "" {
		return nil, fmt.Errorf("send code first")
	}

	authResult, err := c.api.API().AuthSignIn(ctx, &tg.AuthSignInRequest{
		PhoneNumber:   phone,
		PhoneCodeHash: codeHash,
		PhoneCode:     code,
	})
	if err != nil {
		return nil, fmt.Errorf("sign in: %w", err)
	}

	// Handle different authorization results
	switch v := authResult.(type) {
	case *tg.AuthAuthorizationSignUpRequired:
		return nil, fmt.Errorf("sign up required")
	case *tg.AuthAuthorization:
		user, ok := v.User.(*tg.User)
		if !ok {
			return nil, fmt.Errorf("unexpected user type")
		}
		c.mu.Lock()
		c.isAuthed = true
		c.mu.Unlock()

		return &User{
			ID:        user.ID,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Username:  user.Username,
			Phone:     user.Phone,
		}, nil
	}

	return nil, fmt.Errorf("unexpected auth result")
}

// Check2FA checks if 2FA is required
func (c *Client) Check2FA(ctx context.Context, password string) (*User, error) {
	// Get password settings
	pwd, err := c.api.API().AccountGetPassword(ctx)
	if err != nil {
		return nil, fmt.Errorf("get password: %w", err)
	}

	// Compute SRP parameters
	srpAnswer, err := computeSRP(password, pwd)
	if err != nil {
		return nil, fmt.Errorf("compute srp: %w", err)
	}

	authResult, err := c.api.API().AuthCheckPassword(ctx, srpAnswer)
	if err != nil {
		return nil, fmt.Errorf("check password: %w", err)
	}

	// Handle different authorization results
	auth, ok := authResult.(*tg.AuthAuthorization)
	if !ok {
		return nil, fmt.Errorf("unexpected auth result type")
	}

	user, ok := auth.User.(*tg.User)
	if !ok {
		return nil, fmt.Errorf("unexpected user type")
	}

	c.mu.Lock()
	c.isAuthed = true
	c.mu.Unlock()

	return &User{
		ID:        user.ID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Username:  user.Username,
		Phone:     user.Phone,
	}, nil
}

// GetMe returns current user info
func (c *Client) GetMe(ctx context.Context) (*User, error) {
	users, err := c.api.API().UsersGetUsers(ctx, []tg.InputUserClass{&tg.InputUserSelf{}})
	if err != nil {
		return nil, fmt.Errorf("get users: %w", err)
	}

	if len(users) == 0 {
		return nil, fmt.Errorf("no user found")
	}

	user, ok := users[0].(*tg.User)
	if !ok {
		return nil, fmt.Errorf("unexpected user type")
	}

	return &User{
		ID:        user.ID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Username:  user.Username,
		Phone:     user.Phone,
	}, nil
}

// GetDialogs returns list of dialogs
func (c *Client) GetDialogs(ctx context.Context, limit int) ([]Dialog, error) {
	result, err := c.api.API().MessagesGetDialogs(ctx, &tg.MessagesGetDialogsRequest{
		OffsetPeer: &tg.InputPeerEmpty{},
		Limit:      limit,
	})
	if err != nil {
		return nil, fmt.Errorf("get dialogs: %w", err)
	}

	var dialogs []Dialog

	switch v := result.(type) {
	case *tg.MessagesDialogs:
		dialogs = c.parseDialogs(v.Dialogs, v.Chats, v.Users)
	case *tg.MessagesDialogsSlice:
		dialogs = c.parseDialogs(v.Dialogs, v.Chats, v.Users)
	}

	return dialogs, nil
}

func (c *Client) parseDialogs(dialogList []tg.DialogClass, chats []tg.ChatClass, users []tg.UserClass) []Dialog {
	// Build lookup maps
	chatMap := make(map[int64]tg.ChatClass)
	userMap := make(map[int64]tg.UserClass)

	for _, chat := range chats {
		switch v := chat.(type) {
		case *tg.Chat:
			chatMap[v.ID] = v
		case *tg.Channel:
			chatMap[v.ID] = v
		}
	}

	for _, user := range users {
		if u, ok := user.(*tg.User); ok {
			userMap[u.ID] = u
		}
	}

	var result []Dialog

	for _, d := range dialogList {
		dialog, ok := d.(*tg.Dialog)
		if !ok {
			continue
		}

		var item Dialog
		item.UnreadCount = dialog.UnreadCount

		switch peer := dialog.Peer.(type) {
		case *tg.PeerUser:
			if user, ok := userMap[peer.UserID].(*tg.User); ok {
				item.ID = user.ID
				item.Title = user.FirstName
				if user.LastName != "" {
					item.Title += " " + user.LastName
				}
				item.Type = "user"
			}
		case *tg.PeerChat:
			if chat, ok := chatMap[peer.ChatID].(*tg.Chat); ok {
				item.ID = -chat.ID
				item.Title = chat.Title
				item.Type = "group"
			}
		case *tg.PeerChannel:
			if channel, ok := chatMap[peer.ChannelID].(*tg.Channel); ok {
				item.ID = -1000000000000 - channel.ID
				item.Title = channel.Title
				if channel.Broadcast {
					item.Type = "channel"
				} else {
					item.Type = "supergroup"
				}
			}
		}

		if item.ID != 0 {
			result = append(result, item)
		}
	}

	return result
}

// GetHistory returns chat history with optional offset_id for pagination
func (c *Client) GetHistory(ctx context.Context, chatID int64, limit int) ([]Message, error) {
	return c.GetHistoryWithOffset(ctx, chatID, limit, 0)
}

// GetHistoryWithOffset returns chat history starting from offset_id (for pagination)
func (c *Client) GetHistoryWithOffset(ctx context.Context, chatID int64, limit int, offsetID int) ([]Message, error) {
	peer, err := c.resolvePeer(ctx, chatID)
	if err != nil {
		return nil, err
	}

	result, err := c.api.API().MessagesGetHistory(ctx, &tg.MessagesGetHistoryRequest{
		Peer:     peer,
		Limit:    limit,
		OffsetID: offsetID,
	})
	if err != nil {
		return nil, fmt.Errorf("get history: %w", err)
	}

	var messages []Message

	switch v := result.(type) {
	case *tg.MessagesMessages:
		messages = c.parseMessages(v.Messages, v.Users)
	case *tg.MessagesMessagesSlice:
		messages = c.parseMessages(v.Messages, v.Users)
	case *tg.MessagesChannelMessages:
		messages = c.parseMessages(v.Messages, v.Users)
	}

	return messages, nil
}

func (c *Client) parseMessages(msgList []tg.MessageClass, users []tg.UserClass) []Message {
	userMap := make(map[int64]*tg.User)
	for _, u := range users {
		if user, ok := u.(*tg.User); ok {
			userMap[user.ID] = user
		}
	}

	var result []Message

	for _, m := range msgList {
		msg, ok := m.(*tg.Message)
		if !ok {
			continue
		}

		item := Message{
			ID:   msg.ID,
			Text: msg.Message,
			Date: time.Unix(int64(msg.Date), 0).Format(time.RFC3339),
		}

		if msg.ReplyTo != nil {
			if reply, ok := msg.ReplyTo.(*tg.MessageReplyHeader); ok {
				item.ReplyToID = reply.ReplyToMsgID
			}
		}

		if from := msg.FromID; from != nil {
			if peer, ok := from.(*tg.PeerUser); ok {
				item.FromID = peer.UserID
				if user, ok := userMap[peer.UserID]; ok {
					item.FromName = user.FirstName
					if user.LastName != "" {
						item.FromName += " " + user.LastName
					}
				}
			}
		}

		result = append(result, item)
	}

	return result
}

// SendMessage sends a message to chat
func (c *Client) SendMessage(ctx context.Context, chatID int64, text string, replyTo int) (int, error) {
	c.mu.RLock()
	sender := c.sender
	c.mu.RUnlock()

	if sender == nil {
		return 0, fmt.Errorf("not connected")
	}

	peer, err := c.resolvePeer(ctx, chatID)
	if err != nil {
		return 0, err
	}

	var upd tg.UpdatesClass
	var sendErr error

	if replyTo > 0 {
		upd, sendErr = sender.To(peer).Reply(replyTo).Text(ctx, text)
	} else {
		upd, sendErr = sender.To(peer).Text(ctx, text)
	}

	if sendErr != nil {
		return 0, fmt.Errorf("send message: %w", sendErr)
	}

	// Extract message ID from updates
	switch u := upd.(type) {
	case *tg.Updates:
		for _, update := range u.Updates {
			switch upd := update.(type) {
			case *tg.UpdateNewMessage:
				if msg, ok := upd.Message.(*tg.Message); ok {
					return msg.ID, nil
				}
			case *tg.UpdateNewChannelMessage:
				if msg, ok := upd.Message.(*tg.Message); ok {
					return msg.ID, nil
				}
			}
		}
	case *tg.UpdateShortSentMessage:
		return u.ID, nil
	}

	return 0, nil
}

func (c *Client) resolvePeer(ctx context.Context, chatID int64) (tg.InputPeerClass, error) {
	if chatID > 0 {
		// User
		return &tg.InputPeerUser{UserID: chatID}, nil
	}

	if chatID > -1000000000000 {
		// Group chat
		return &tg.InputPeerChat{ChatID: -chatID}, nil
	}

	// Channel/Supergroup
	channelID := -chatID - 1000000000000

	// Need to get access hash for channels
	channels, err := c.api.API().ChannelsGetChannels(ctx, []tg.InputChannelClass{
		&tg.InputChannel{ChannelID: channelID},
	})
	if err != nil {
		return nil, fmt.Errorf("resolve channel: %w", err)
	}

	if chats, ok := channels.(*tg.MessagesChats); ok && len(chats.Chats) > 0 {
		if ch, ok := chats.Chats[0].(*tg.Channel); ok {
			return &tg.InputPeerChannel{
				ChannelID:  ch.ID,
				AccessHash: ch.AccessHash,
			}, nil
		}
	}

	return nil, fmt.Errorf("channel not found")
}

// Updates returns channel for receiving updates
func (c *Client) Updates() <-chan Update {
	return c.updatesCh
}

// IsAuthorized returns authorization status
func (c *Client) IsAuthorized() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.isAuthed
}

// Update handlers
func (c *Client) onNewMessage(ctx context.Context, e tg.Entities, update *tg.UpdateNewMessage) error {
	msg, ok := update.Message.(*tg.Message)
	if !ok {
		return nil
	}

	chatID := c.extractChatID(msg.PeerID)
	senderID := int64(0)
	if from := msg.FromID; from != nil {
		if peer, ok := from.(*tg.PeerUser); ok {
			senderID = peer.UserID
		}
	}

	c.updatesCh <- Update{
		Type:      "new_message",
		ChatID:    chatID,
		MessageID: msg.ID,
		Text:      msg.Message,
		SenderID:  senderID,
		Timestamp: int64(msg.Date),
		Raw:       msg,
	}

	return nil
}

func (c *Client) onEditMessage(ctx context.Context, e tg.Entities, update *tg.UpdateEditMessage) error {
	msg, ok := update.Message.(*tg.Message)
	if !ok {
		return nil
	}

	c.updatesCh <- Update{
		Type:      "edit_message",
		ChatID:    c.extractChatID(msg.PeerID),
		MessageID: msg.ID,
		Text:      msg.Message,
		Timestamp: int64(msg.EditDate),
		Raw:       msg,
	}

	return nil
}

func (c *Client) onDeleteMessages(ctx context.Context, e tg.Entities, update *tg.UpdateDeleteMessages) error {
	for _, msgID := range update.Messages {
		c.updatesCh <- Update{
			Type:      "delete_message",
			MessageID: msgID,
			Timestamp: time.Now().Unix(),
		}
	}

	return nil
}

func (c *Client) extractChatID(peer tg.PeerClass) int64 {
	switch p := peer.(type) {
	case *tg.PeerUser:
		return p.UserID
	case *tg.PeerChat:
		return -p.ChatID
	case *tg.PeerChannel:
		return -1000000000000 - p.ChannelID
	}
	return 0
}

// authFlow holds auth state
type authFlow struct {
	phone    string
	codeHash string
}

// computeSRP computes SRP parameters for 2FA using gotd/td crypto/srp package
func computeSRP(password string, accountPassword *tg.AccountPassword) (*tg.InputCheckPasswordSRP, error) {
	if accountPassword.CurrentAlgo == nil {
		return nil, errors.New("no password set")
	}

	algo, ok := accountPassword.CurrentAlgo.(*tg.PasswordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow)
	if !ok {
		return nil, errors.Errorf("unsupported algo type: %T", accountPassword.CurrentAlgo)
	}

	// Create SRP client with crypto/rand as random source
	srpClient := srp.NewSRP(rand.Reader)

	// Prepare input parameters
	input := srp.Input{
		Salt1: algo.Salt1,
		Salt2: algo.Salt2,
		G:     algo.G,
		P:     algo.P,
	}

	// Generate random bytes for SRP
	random := make([]byte, 256)
	if _, err := rand.Read(random); err != nil {
		return nil, errors.Wrap(err, "generate random")
	}

	// Compute SRP hash
	answer, err := srpClient.Hash([]byte(password), accountPassword.SRPB, random, input)
	if err != nil {
		return nil, errors.Wrap(err, "srp hash")
	}

	return &tg.InputCheckPasswordSRP{
		SRPID: accountPassword.SRPID,
		A:     answer.A,
		M1:    answer.M1,
	}, nil
}
