package handlers

import (
	"log"
	"time"

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

	// Generate embedding for search query
	queryEmbedding, err := h.embedding.GenerateEmbedding(searchQuery.Query)
	if err != nil {
		log.Printf("Error generating query embedding: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error processing search query",
		})
	}

	// Perform similarity search
	results, err := h.db.SearchEntries(c.Context(), &searchQuery, queryEmbedding)
	if err != nil {
		log.Printf("Error searching entries: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error performing search",
		})
	}

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
		"service":   "ghostwriter-api",
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
