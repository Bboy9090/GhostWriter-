package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/pgvector/pgvector-go"
)

// PortalEntry represents a text entry with vector embeddings
type PortalEntry struct {
	ID          int              `json:"id" db:"id"`
	UserID      uuid.UUID        `json:"user_id" db:"user_id"`
	TextContent string           `json:"text_content" db:"text_content"`
	Embedding   pgvector.Vector  `json:"embedding,omitempty" db:"embedding"`
	CreatedAt   time.Time        `json:"created_at" db:"created_at"`
}

// PortalEntryInput represents the input for creating a new entry
type PortalEntryInput struct {
	UserID      uuid.UUID `json:"user_id"`
	TextContent string    `json:"text_content"`
}

// SearchQuery represents a search request
type SearchQuery struct {
	UserID    uuid.UUID `json:"user_id"`
	Query     string    `json:"query,omitempty"`
	StartDate *time.Time `json:"start_date,omitempty"`
	EndDate   *time.Time `json:"end_date,omitempty"`
	Limit     int       `json:"limit,omitempty"`
}

// SearchResult represents a search result with similarity score
type SearchResult struct {
	PortalEntry
	Similarity float64 `json:"similarity" db:"similarity"`
}
