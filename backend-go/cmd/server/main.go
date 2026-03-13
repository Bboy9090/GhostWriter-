package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/Bboy9090/GhostWriter/backend-go/internal/apns"
	"github.com/Bboy9090/GhostWriter/backend-go/internal/database"
	"github.com/Bboy9090/GhostWriter/backend-go/internal/embeddings"
	"github.com/Bboy9090/GhostWriter/backend-go/internal/handlers"
	"github.com/Bboy9090/GhostWriter/backend-go/internal/redis"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/websocket/v2"
	"github.com/joho/godotenv"
)

const (
	maxRetries    = 10
	retryInterval = 3 * time.Second
)

func main() {
	// Load .env file if it exists (ignored in production where env vars are set directly)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Get configuration from environment.
	// MONGODB_URI takes precedence over DB_URL when both are set,
	// and DB_URL may be a MongoDB URI when migrating from Railway.
	dbURL := resolveDatabaseURL()
	redisURL := getEnv("REDIS_URL", "localhost:6379")
	port := getEnv("PORT", "8080")
	openaiAPIKey := getEnv("OPENAI_API_KEY", "")

	log.Printf("GhostWriter API starting up on 0.0.0.0:%s", port)
	log.Printf("Database URL configured: %v", dbURL != "")
	log.Printf("Redis URL configured: %v", redisURL != "")

	// Initialize database with retry logic so the service survives a slow DB start.
	// NewDatabaseFromURL auto-detects PostgreSQL vs MongoDB from the URI scheme.
	var db database.DB
	if err := retry(maxRetries, retryInterval, func() error {
		var err error
		db, err = database.NewDatabaseFromURL(dbURL)
		return err
	}); err != nil {
		log.Fatalf("FATAL: could not connect to database after %d attempts: %v", maxRetries, err)
	}
	defer db.Close()

	// Initialize schema
	ctx := context.Background()
	if err := db.InitSchema(ctx); err != nil {
		log.Fatalf("FATAL: failed to initialize database schema: %v", err)
	}

	// Initialize Redis with retry logic
	var redisClient *redis.RedisClient
	if err := retry(maxRetries, retryInterval, func() error {
		var err error
		redisClient, err = redis.NewRedisClient(redisURL)
		return err
	}); err != nil {
		log.Fatalf("FATAL: could not connect to Redis after %d attempts: %v", maxRetries, err)
	}
	defer redisClient.Close()

	// Initialize embedding service (optional – only when API key is provided)
	var embeddingService *embeddings.EmbeddingService
	if openaiAPIKey != "" {
		embeddingService = embeddings.NewEmbeddingService(openaiAPIKey)
		log.Println("OpenAI embedding service initialized")
	} else {
		log.Println("Warning: OPENAI_API_KEY not set, embeddings will not be generated")
	}

	// Initialize APNS (optional)
	var apnsClient *apns.APNSClient
	if apns.IsAPNSConfigured() {
		authMode := getEnv("APNS_AUTH_MODE", "token")
		certPath := getEnv("APNS_CERT_PATH", "")
		keyPath := getEnv("APNS_KEY_PATH", "")
		keyID := getEnv("APNS_KEY_ID", "")
		teamID := getEnv("APNS_TEAM_ID", "")
		topic := getEnv("APNS_TOPIC", "com.ghostwriter.app")
		production := getEnv("APNS_PRODUCTION", "false") == "true"

		var err error
		apnsClient, err = apns.NewAPNSClient(authMode, certPath, keyPath, keyID, teamID, topic, production)
		if err != nil {
			log.Printf("Warning: Failed to initialize APNS: %v", err)
			apnsClient = nil
		}
	} else {
		log.Println("APNS not configured, push notifications will be disabled")
	}

	// Create handlers
	handler := handlers.NewHandler(db, redisClient, apnsClient, embeddingService)

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Routes
	app.Get("/health", handler.HealthCheck)
	app.Get("/entries", handler.GetEntries)
	app.Post("/vault/search", handler.SearchVault)

	// WebSocket route
	app.Get("/ws", websocket.New(handler.HandleWebSocket))

	// Start server – bind to 0.0.0.0 so it is reachable inside containers/VMs
	listenAddr := fmt.Sprintf("0.0.0.0:%s", port)
	go func() {
		log.Printf("Listening on %s", listenAddr)
		if err := app.Listen(listenAddr); err != nil {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal for graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server gracefully...")

	if err := app.Shutdown(); err != nil {
		log.Fatalf("Server shutdown error: %v", err)
	}

	log.Println("Server exited cleanly")
}

// retry calls fn up to attempts times, sleeping interval between each failure.
func retry(attempts int, interval time.Duration, fn func() error) error {
	var err error
	for i := 1; i <= attempts; i++ {
		if err = fn(); err == nil {
			return nil
		}
		if i < attempts {
			log.Printf("Attempt %d/%d failed: %v – retrying in %s", i, attempts, err, interval)
			time.Sleep(interval)
		}
	}
	return err
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// resolveDatabaseURL returns the database connection URL, preferring MONGODB_URI
// when it is set. If only DB_URL is provided it is returned as-is (the factory
// handles both PostgreSQL DSNs and MongoDB URIs).
func resolveDatabaseURL() string {
	if mongoURI := os.Getenv("MONGODB_URI"); mongoURI != "" {
		log.Println("Using MONGODB_URI for database connection")
		return mongoURI
	}
	dbURL := getEnv("DB_URL", "postgres://bobby_admin:bronx_password@localhost:5432/ghostwriter_vault?sslmode=disable")
	if strings.HasPrefix(dbURL, "mongodb://") || strings.HasPrefix(dbURL, "mongodb+srv://") {
		log.Println("DB_URL contains a MongoDB URI; using MongoDB driver")
	}
	return dbURL
}
