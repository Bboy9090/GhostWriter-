package database

import (
	"context"
	"fmt"
	"log"
	"math"
	"os"
	"sort"
	"strconv"
	"time"

	"github.com/Bboy9090/GhostWriter/backend-go/internal/models"
	"github.com/google/uuid"
	"github.com/pgvector/pgvector-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	mongoDBName         = "ghostwriter"
	mongoCollection     = "portal_entries"
	mongoCountersColl   = "counters"
	mongoCounterEntryID = "portal_entry_id"
)

// mongoEntry is the BSON representation of a portal entry.
type mongoEntry struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	SeqID       int64              `bson:"seq_id"`
	UserID      string             `bson:"user_id"`
	TextContent string             `bson:"text_content"`
	Embedding   []float32          `bson:"embedding,omitempty"`
	CreatedAt   time.Time          `bson:"created_at"`
}

// MongoDatabase implements the DB interface using MongoDB.
type MongoDatabase struct {
	client *mongo.Client
	db     *mongo.Database
}

// NewMongoDatabase creates a MongoDB-backed database connection.
func NewMongoDatabase(uri string) (*MongoDatabase, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		return nil, fmt.Errorf("error opening MongoDB connection: %w", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("error connecting to MongoDB: %w", err)
	}

	log.Println("MongoDB connection established")

	return &MongoDatabase{
		client: client,
		db:     client.Database(mongoDBName),
	}, nil
}

// InitSchema creates the necessary MongoDB indexes.
// By default posts persist forever. Set the POST_TTL_DAYS environment variable
// to a positive integer to enable automatic deletion of entries older than that
// many days (MongoDB TTL index). Set it to 0 or leave it unset to disable
// expiration entirely.
func (m *MongoDatabase) InitSchema(ctx context.Context) error {
	coll := m.db.Collection(mongoCollection)

	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "user_id", Value: 1}},
			Options: options.Index().SetName("idx_user_id"),
		},
		{
			Keys:    bson.D{{Key: "created_at", Value: -1}},
			Options: options.Index().SetName("idx_created_at"),
		},
		{
			Keys:    bson.D{{Key: "seq_id", Value: 1}},
			Options: options.Index().SetUnique(true).SetName("idx_seq_id"),
		},
	}

	// Optionally add a TTL index when POST_TTL_DAYS is configured.
	if ttlDays := postTTLDays(); ttlDays > 0 {
		ttlSeconds := int32(ttlDays * secondsPerDay)
		indexes = append(indexes, mongo.IndexModel{
			Keys:    bson.D{{Key: "created_at", Value: 1}},
			Options: options.Index().SetName("idx_ttl_created_at").SetExpireAfterSeconds(ttlSeconds),
		})
		log.Printf("MongoDB TTL index set: entries expire after %d day(s)", ttlDays)
	} else {
		log.Println("MongoDB TTL: disabled (POST_TTL_DAYS not set or 0 – entries persist forever)")
	}

	if _, err := coll.Indexes().CreateMany(ctx, indexes); err != nil {
		return fmt.Errorf("error creating MongoDB indexes: %w", err)
	}

	log.Println("MongoDB schema initialized")
	return nil
}

// postTTLDays reads POST_TTL_DAYS from the environment and returns the configured
// number of days. Returns 0 if the variable is absent, empty, or non-positive,
// meaning no TTL is applied.
func postTTLDays() int {
	raw := os.Getenv("POST_TTL_DAYS")
	if raw == "" {
		return 0
	}
	days, err := strconv.Atoi(raw)
	if err != nil || days <= 0 {
		return 0
	}
	return days
}

const secondsPerDay = 24 * 60 * 60

// nextSeqID atomically increments and returns the next integer ID for entries.
func (m *MongoDatabase) nextSeqID(ctx context.Context) (int64, error) {
	result := m.db.Collection(mongoCountersColl).FindOneAndUpdate(
		ctx,
		bson.M{"_id": mongoCounterEntryID},
		bson.M{"$inc": bson.M{"seq": int64(1)}},
		options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After),
	)

	var counter struct {
		Seq int64 `bson:"seq"`
	}
	if err := result.Decode(&counter); err != nil {
		return 0, fmt.Errorf("error generating sequence ID: %w", err)
	}
	return counter.Seq, nil
}

// InsertEntry inserts a new portal entry into MongoDB.
func (m *MongoDatabase) InsertEntry(ctx context.Context, entry *models.PortalEntry) error {
	seqID, err := m.nextSeqID(ctx)
	if err != nil {
		return err
	}

	doc := mongoEntry{
		SeqID:       seqID,
		UserID:      entry.UserID.String(),
		TextContent: entry.TextContent,
		Embedding:   entry.Embedding.Slice(),
		CreatedAt:   entry.CreatedAt,
	}

	if _, err := m.db.Collection(mongoCollection).InsertOne(ctx, doc); err != nil {
		return fmt.Errorf("error inserting entry: %w", err)
	}

	entry.ID = int(seqID)
	return nil
}

// SearchEntries performs a similarity search over MongoDB entries for the given user.
// Cosine similarity is computed in-memory since standard MongoDB deployments do not
// provide server-side vector search without Atlas.
func (m *MongoDatabase) SearchEntries(ctx context.Context, query *models.SearchQuery, queryEmbedding pgvector.Vector) ([]models.SearchResult, error) {
	filter := bson.M{"user_id": query.UserID.String()}

	if query.StartDate != nil {
		filter["created_at"] = bson.M{"$gte": query.StartDate}
	}
	if query.EndDate != nil {
		if _, ok := filter["created_at"]; ok {
			filter["created_at"].(bson.M)["$lte"] = query.EndDate
		} else {
			filter["created_at"] = bson.M{"$lte": query.EndDate}
		}
	}

	cursor, err := m.db.Collection(mongoCollection).Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("error searching MongoDB entries: %w", err)
	}
	defer cursor.Close(ctx)

	qVec := queryEmbedding.Slice()

	type scoredResult struct {
		result models.SearchResult
		score  float64
	}
	var scored []scoredResult

	for cursor.Next(ctx) {
		var doc mongoEntry
		if err := cursor.Decode(&doc); err != nil {
			return nil, fmt.Errorf("error decoding MongoDB entry: %w", err)
		}

		similarity := cosineSimilarity(qVec, doc.Embedding)

		uid, err := uuid.Parse(doc.UserID)
		if err != nil {
			log.Printf("warning: skipping entry with invalid user_id %q: %v", doc.UserID, err)
			continue
		}
		scored = append(scored, scoredResult{
			result: models.SearchResult{
				PortalEntry: models.PortalEntry{
					ID:          int(doc.SeqID),
					UserID:      uid,
					TextContent: doc.TextContent,
					Embedding:   pgvector.NewVector(doc.Embedding),
					CreatedAt:   doc.CreatedAt,
				},
				Similarity: similarity,
			},
			score: similarity,
		})
	}
	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("error iterating MongoDB cursor: %w", err)
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	limit := query.Limit
	if limit <= 0 {
		limit = 10
	}
	if limit > len(scored) {
		limit = len(scored)
	}

	results := make([]models.SearchResult, limit)
	for i := 0; i < limit; i++ {
		results[i] = scored[i].result
	}
	return results, nil
}

// GetEntriesByUserID retrieves the most recent entries for a user.
func (m *MongoDatabase) GetEntriesByUserID(ctx context.Context, userID uuid.UUID, limit int) ([]models.PortalEntry, error) {
	if limit <= 0 {
		limit = 100
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetLimit(int64(limit))

	cursor, err := m.db.Collection(mongoCollection).Find(ctx,
		bson.M{"user_id": userID.String()}, opts)
	if err != nil {
		return nil, fmt.Errorf("error querying MongoDB entries: %w", err)
	}
	defer cursor.Close(ctx)

	var entries []models.PortalEntry
	for cursor.Next(ctx) {
		var doc mongoEntry
		if err := cursor.Decode(&doc); err != nil {
			return nil, fmt.Errorf("error decoding MongoDB entry: %w", err)
		}
		uid, err := uuid.Parse(doc.UserID)
		if err != nil {
			log.Printf("warning: skipping entry with invalid user_id %q: %v", doc.UserID, err)
			continue
		}
		entries = append(entries, models.PortalEntry{
			ID:          int(doc.SeqID),
			UserID:      uid,
			TextContent: doc.TextContent,
			Embedding:   pgvector.NewVector(doc.Embedding),
			CreatedAt:   doc.CreatedAt,
		})
	}
	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("error iterating MongoDB cursor: %w", err)
	}

	return entries, nil
}

// Close disconnects the MongoDB client.
func (m *MongoDatabase) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return m.client.Disconnect(ctx)
}

// cosineSimilarity computes the cosine similarity between two float32 slices.
// Returns 0 if either slice is empty or has zero magnitude.
func cosineSimilarity(a, b []float32) float64 {
	if len(a) == 0 || len(b) == 0 || len(a) != len(b) {
		return 0
	}

	var dot, magA, magB float64
	for i := range a {
		dot += float64(a[i]) * float64(b[i])
		magA += float64(a[i]) * float64(a[i])
		magB += float64(b[i]) * float64(b[i])
	}

	denom := math.Sqrt(magA) * math.Sqrt(magB)
	if denom == 0 {
		return 0
	}
	return dot / denom
}
