package handlers

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/Bboy9090/GhostWriter/backend-go/internal/apns"
	"github.com/Bboy9090/GhostWriter/backend-go/internal/database"
	"github.com/Bboy9090/GhostWriter/backend-go/internal/embeddings"
	"github.com/Bboy9090/GhostWriter/backend-go/internal/models"
	"github.com/Bboy9090/GhostWriter/backend-go/internal/redis"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
)

type Handler struct {
	db        *database.Database
	redis     *redis.RedisClient
	apns      *apns.APNSClient
	embedding *embeddings.EmbeddingService
}

// NewHandler creates a new handler
func NewHandler(db *database.Database, redisClient *redis.RedisClient, apnsClient *apns.APNSClient, embeddingService *embeddings.EmbeddingService) *Handler {
	return &Handler{
		db:        db,
		redis:     redisClient,
		apns:      apnsClient,
		embedding: embeddingService,
	}
}

// WebSocketMessage represents a message received via WebSocket
type WebSocketMessage struct {
	Type        string    `json:"type"`
	UserID      string    `json:"user_id"`
	TextContent string    `json:"text_content"`
	DeviceToken string    `json:"device_token,omitempty"`
	Timestamp   time.Time `json:"timestamp"`
}

// HandleWebSocket handles WebSocket connections for real-time text syncing
func (h *Handler) HandleWebSocket(c *websocket.Conn) {
	var (
		msg []byte
		err error
	)

	log.Printf("WebSocket connection established from %s", c.RemoteAddr())

	for {
		if _, msg, err = c.ReadMessage(); err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}

		// Parse message
		var wsMsg WebSocketMessage
		if err := json.Unmarshal(msg, &wsMsg); err != nil {
			log.Printf("Error parsing WebSocket message: %v", err)
			c.WriteJSON(fiber.Map{"error": "Invalid message format"})
			continue
		}

		// Process message asynchronously
		go h.processTextEntry(wsMsg)

		// Send acknowledgment
		response := fiber.Map{
			"status":    "received",
			"timestamp": time.Now().UTC(),
		}
		if err := c.WriteJSON(response); err != nil {
			log.Printf("Error sending acknowledgment: %v", err)
		}
	}

	log.Printf("WebSocket connection closed from %s", c.RemoteAddr())
}

// processTextEntry processes the text entry asynchronously
func (h *Handler) processTextEntry(msg WebSocketMessage) {
	ctx := context.Background()

	// Parse user ID
	userID, err := uuid.Parse(msg.UserID)
	if err != nil {
		log.Printf("Error parsing user ID: %v", err)
		return
	}

	// Generate embedding for the text
	embedding, err := h.embedding.GenerateEmbedding(msg.TextContent)
	if err != nil {
		log.Printf("Error generating embedding: %v", err)
		// Continue without embedding
	}

	// Create portal entry
	entry := &models.PortalEntry{
		UserID:      userID,
		TextContent: msg.TextContent,
		Embedding:   embedding,
		CreatedAt:   time.Now().UTC(),
	}

	// Insert into database
	if err := h.db.InsertEntry(ctx, entry); err != nil {
		log.Printf("Error inserting entry: %v", err)
		return
	}

	log.Printf("Entry %d inserted for user %s", entry.ID, userID)

	// Broadcast update via Redis
	updateMsg := map[string]interface{}{
		"type":    "new_entry",
		"user_id": userID.String(),
		"entry_id": entry.ID,
		"timestamp": entry.CreatedAt,
	}
	updateJSON, _ := json.Marshal(updateMsg)
	if err := h.redis.Publish(ctx, redis.ChannelPortalUpdates, string(updateJSON)); err != nil {
		log.Printf("Error publishing to Redis: %v", err)
	}

	// Send push notification if device token provided and APNS is configured
	if msg.DeviceToken != "" && h.apns != nil {
		go h.sendProcessingNotification(msg.DeviceToken, entry.ID)
	}
}

// sendProcessingNotification sends a push notification about processing completion
func (h *Handler) sendProcessingNotification(deviceToken string, entryID int) {
	title := "GhostWriter"
	body := "Text processing complete"
	customData := map[string]interface{}{
		"entry_id": entryID,
		"type":     "processing_complete",
	}

	if err := h.apns.SendNotification(deviceToken, title, body, 1, customData); err != nil {
		log.Printf("Error sending push notification: %v", err)
	}
}
