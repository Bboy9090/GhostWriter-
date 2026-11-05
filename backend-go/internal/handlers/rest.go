package handlers

import (
	"log"
	"strings"
	"time"

	"github.com/Bboy9090/GhostWriter/backend-go/internal/aiwriting"

	"github.com/Bboy9090/GhostWriter/backend-go/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// SearchVault handles the /vault/search endpoint
func (h *Handler) SearchVault(c *fiber.Ctx) error {
	var searchQuery models.SearchQuery

	// Parse request body
	if err := c.BodyParser(&searchQuery); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate user ID
	if searchQuery.UserID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "user_id is required",
		})
	}

	// If no query text, return recent entries
	if searchQuery.Query == "" {
		limit := searchQuery.Limit
		if limit <= 0 {
			limit = 10
		}
		entries, err := h.db.GetEntriesByUserID(c.Context(), searchQuery.UserID, limit)
		if err != nil {
			log.Printf("Error fetching entries: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Error fetching entries",
			})
		}

		return c.JSON(fiber.Map{
			"results": entries,
			"count":   len(entries),
		})
	}

	limit := searchQuery.Limit
	if limit <= 0 {
		limit = 10
	}

	var vecResults []models.SearchResult

	if h.embedding != nil {
		queryEmbedding, err := h.embedding.GenerateEmbedding(searchQuery.Query)
		if err != nil {
			log.Printf("Error generating query embedding (falling back to keyword search): %v", err)
		} else {
			vecResults, err = h.db.SearchEntries(c.Context(), &searchQuery, queryEmbedding)
			if err != nil {
				log.Printf("Error in vector search (falling back to keyword): %v", err)
				vecResults = nil
			}
		}
	} else {
		log.Printf("Embedding service disabled: vector leg of search skipped")
	}

	kwLimit := limit * 3
	if kwLimit < 20 {
		kwLimit = 20
	}
	kwEntries, err := h.db.SearchEntriesKeyword(c.Context(), searchQuery.UserID, searchQuery.Query, kwLimit)
	if err != nil {
		log.Printf("Error keyword searching entries: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error performing search",
		})
	}

	results := mergeVectorAndKeyword(vecResults, kwEntries, searchQuery.Query, limit)

	return c.JSON(fiber.Map{
		"results": results,
		"count":   len(results),
		"query":   searchQuery.Query,
	})
}

// HealthCheck handles the /health endpoint
func (h *Handler) HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"service":       "ghostwriter-api",
		"ai_writing":    "byok",
		"vault_enabled": h.vaultEnabled,
	})
}

// GetEntries handles the /entries endpoint
func (h *Handler) GetEntries(c *fiber.Ctx) error {
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "user_id query parameter is required",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user_id format",
		})
	}

	limit := c.QueryInt("limit", 100)
	if limit > 1000 {
		limit = 1000
	}

	entries, err := h.db.GetEntriesByUserID(c.Context(), userID, limit)
	if err != nil {
		log.Printf("Error fetching entries: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error fetching entries",
		})
	}

	return c.JSON(fiber.Map{
		"entries": entries,
		"count":   len(entries),
	})
}


type aiWriteRequest struct {
	Action string `json:"action"`
	Text   string `json:"text"`
	Model  string `json:"model"`
}

// AIWrite performs an explicit BYOK writing transformation.
// The bearer credential is forwarded to OpenAI for this request only and is never persisted.
func (h *Handler) AIWrite(c *fiber.Ctx) error {
	auth := strings.TrimSpace(c.Get("Authorization"))
	if !strings.HasPrefix(auth, "Bearer ") || strings.TrimSpace(strings.TrimPrefix(auth, "Bearer ")) == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"ok":    false,
			"code":  "AI_CREDENTIAL_REQUIRED",
			"error": "An OpenAI API key is required for this explicit AI request.",
		})
	}
	apiKey := strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))

	var input aiWriteRequest
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"ok": false, "code": "INVALID_REQUEST", "error": "Invalid JSON request body.",
		})
	}

	service := aiwriting.NewService("")
	result, err := service.Generate(c.UserContext(), apiKey, aiwriting.Request{
		Action: input.Action,
		Text:   input.Text,
		Model:  input.Model,
	})
	if err != nil {
		log.Printf("AI writing request failed: %v", err)
		status := fiber.StatusBadGateway
		if strings.Contains(err.Error(), "required") || strings.Contains(err.Error(), "unsupported") || strings.Contains(err.Error(), "limit") || strings.Contains(err.Error(), "invalid model") {
			status = fiber.StatusBadRequest
		}
		return c.Status(status).JSON(fiber.Map{
			"ok": false, "code": "AI_WRITE_FAILED", "error": err.Error(),
		})
	}

	c.Set("Cache-Control", "no-store")
	return c.JSON(fiber.Map{
		"ok":       true,
		"action":   input.Action,
		"text":     result.Text,
		"provider": "openai",
		"model":    result.Model,
	})
}
