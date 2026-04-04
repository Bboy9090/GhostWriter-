package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strings"

	"github.com/Bboy9090/GhostWriter/backend-go/internal/models"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/pgvector/pgvector-go"
)

type Database struct {
	db *sql.DB
}

// compile-time assertion: *Database must implement DB.
var _ DB = (*Database)(nil)

// NewDatabase creates a new PostgreSQL database connection.
// Pass a postgres:// URI or a libpq key=value DSN.
// MongoDB URIs (mongodb://, mongodb+srv://) must be handled via NewDatabaseFromURL.
func NewDatabase(dbURL string) (*Database, error) {
	if isMongoDB(dbURL) {
		return nil, fmt.Errorf("error opening database: received a MongoDB URI (%s) but the PostgreSQL driver was selected; use MONGODB_URI or a postgres:// URI for DB_URL", redactURL(dbURL))
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %w", err)
	}

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error connecting to database: %w", err)
	}

	log.Println("Database connection established")

	return &Database{db: db}, nil
}

// InitSchema creates the necessary tables and extensions
func (d *Database) InitSchema(ctx context.Context) error {
	queries := []string{
		`CREATE EXTENSION IF NOT EXISTS vector;`,
		`CREATE TABLE IF NOT EXISTS portal_entries (
			id SERIAL PRIMARY KEY,
			user_id UUID NOT NULL,
			text_content TEXT NOT NULL,
			embedding VECTOR(512),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE INDEX IF NOT EXISTS idx_portal_entries_user_id ON portal_entries(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_portal_entries_created_at ON portal_entries(created_at);`,
		`CREATE INDEX IF NOT EXISTS idx_portal_entries_embedding ON portal_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`,
	}

	for _, query := range queries {
		if _, err := d.db.ExecContext(ctx, query); err != nil {
			return fmt.Errorf("error executing query: %w", err)
		}
	}

	log.Println("Database schema initialized")
	return nil
}

// InsertEntry inserts a new portal entry
func (d *Database) InsertEntry(ctx context.Context, entry *models.PortalEntry) error {
	query := `
		INSERT INTO portal_entries (user_id, text_content, embedding, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`

	err := d.db.QueryRowContext(
		ctx,
		query,
		entry.UserID,
		entry.TextContent,
		entry.Embedding,
		entry.CreatedAt,
	).Scan(&entry.ID)

	if err != nil {
		return fmt.Errorf("error inserting entry: %w", err)
	}

	return nil
}

// SearchEntries performs similarity search with optional filters
func (d *Database) SearchEntries(ctx context.Context, query *models.SearchQuery, queryEmbedding pgvector.Vector) ([]models.SearchResult, error) {
	var results []models.SearchResult
	
	// Build SQL query
	sqlQuery := `
		SELECT 
			id, user_id, text_content, embedding, created_at,
			1 - (embedding <=> $1) AS similarity
		FROM portal_entries
		WHERE user_id = $2
	`
	
	args := []interface{}{queryEmbedding, query.UserID}
	argIndex := 3

	if query.StartDate != nil {
		sqlQuery += fmt.Sprintf(" AND created_at >= $%d", argIndex)
		args = append(args, query.StartDate)
		argIndex++
	}

	if query.EndDate != nil {
		sqlQuery += fmt.Sprintf(" AND created_at <= $%d", argIndex)
		args = append(args, query.EndDate)
		argIndex++
	}

	sqlQuery += " ORDER BY similarity DESC"

	limit := query.Limit
	if limit <= 0 {
		limit = 10
	}
	sqlQuery += fmt.Sprintf(" LIMIT %d", limit)

	rows, err := d.db.QueryContext(ctx, sqlQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("error executing search query: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var result models.SearchResult
		err := rows.Scan(
			&result.ID,
			&result.UserID,
			&result.TextContent,
			&result.Embedding,
			&result.CreatedAt,
			&result.Similarity,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning result: %w", err)
		}
		results = append(results, result)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating results: %w", err)
	}

	return results, nil
}

// SearchEntriesKeyword finds entries containing the substring (case-insensitive).
func (d *Database) SearchEntriesKeyword(ctx context.Context, userID uuid.UUID, query string, limit int) ([]models.PortalEntry, error) {
	q := strings.TrimSpace(query)
	if q == "" {
		return nil, nil
	}
	if limit <= 0 {
		limit = 20
	}

	sqlQuery := `
		SELECT id, user_id, text_content, embedding, created_at
		FROM portal_entries
		WHERE user_id = $1 AND position(lower($2) in lower(text_content)) > 0
		ORDER BY created_at DESC
		LIMIT $3
	`

	rows, err := d.db.QueryContext(ctx, sqlQuery, userID, q, limit)
	if err != nil {
		return nil, fmt.Errorf("error executing keyword search: %w", err)
	}
	defer rows.Close()

	var entries []models.PortalEntry
	for rows.Next() {
		var entry models.PortalEntry
		err := rows.Scan(
			&entry.ID,
			&entry.UserID,
			&entry.TextContent,
			&entry.Embedding,
			&entry.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning entry: %w", err)
		}
		entries = append(entries, entry)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating keyword results: %w", err)
	}
	return entries, nil
}

// GetEntriesByUserID retrieves entries for a specific user
func (d *Database) GetEntriesByUserID(ctx context.Context, userID uuid.UUID, limit int) ([]models.PortalEntry, error) {
	if limit <= 0 {
		limit = 100
	}

	query := `
		SELECT id, user_id, text_content, embedding, created_at
		FROM portal_entries
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := d.db.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("error querying entries: %w", err)
	}
	defer rows.Close()

	var entries []models.PortalEntry
	for rows.Next() {
		var entry models.PortalEntry
		err := rows.Scan(
			&entry.ID,
			&entry.UserID,
			&entry.TextContent,
			&entry.Embedding,
			&entry.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning entry: %w", err)
		}
		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating entries: %w", err)
	}

	return entries, nil
}

// Close closes the database connection
func (d *Database) Close() error {
	return d.db.Close()
}
