package database

import (
	"context"

	"github.com/Bboy9090/GhostWriter/backend-go/internal/models"
	"github.com/google/uuid"
	"github.com/pgvector/pgvector-go"
)

// DB is the database interface implemented by both the PostgreSQL and MongoDB backends.
type DB interface {
	InitSchema(ctx context.Context) error
	InsertEntry(ctx context.Context, entry *models.PortalEntry) error
	SearchEntries(ctx context.Context, query *models.SearchQuery, queryEmbedding pgvector.Vector) ([]models.SearchResult, error)
	GetEntriesByUserID(ctx context.Context, userID uuid.UUID, limit int) ([]models.PortalEntry, error)
	Close() error
}
