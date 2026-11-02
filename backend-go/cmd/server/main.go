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
	// Vault/search infrastructure is optional. AI BYOK can run without database or Redis.
	dbURL := resolveDatabaseURL()
	redisURL := strings.TrimSpace(os.Getenv("REDIS_URL"))
	port := getEnv("PORT", "8080")
	openaiAPIKey := strings.TrimSpace(os.Getenv("OPENAI_API_KEY"))
	vaultEnabled := dbURL != "" && redisURL != ""

	log.Printf("GhostWriter API starting up on 0.0.0.0:%s", port)
	log.Printf("Vault database configured: %v", dbURL != "")
	log.Printf("Vault Redis configured: %v", redisURL != "")
	log.Printf("Vault routes enabled: %v", vaultEnabled)

	if (dbURL == "") != (redisURL == "") {
		log.Println("Warning: partial vault configuration detected; vault/search/WebSocket routes will remain disabled")
	}

	var db database.DB
	var redisClient *redis.RedisClient
	var embeddingService *embeddings.EmbeddingService

	if vaultEnabled {
		if err := retry(maxRetries, retryInterval, func() error {
			var err error
			db, err = database.NewDatabaseFromURL(dbURL)
			return err
		}); err != nil {
			log.Fatalf("FATAL: could not connect to configured vault database after %d attempts: %v", maxRetries, err)
		}
		defer db.Close()

		ctx := context.Background()
		if err := db.InitSchema(ctx); err != nil {
			log.Fatalf("FATAL: failed to initialize configured vault database schema: %v", err)
		}

		if err := retry(maxRetries, retryInterval, func() error {
			var err error
			redisClient, err = redis.NewRedisClient(redisURL)
			return err
		}); err != nil {
			log.Fatalf("FATAL: could not connect to configured vault Redis after %d attempts: %v", maxRetries, err)
		}
		defer redisClient.Close()

		if openaiAPIKey != "" {
			embeddingService = embeddings.NewEmbeddingService(openaiAPIKey)
			log.Println("OpenAI embedding service initialized for vault search")
		} else {
			log.Println("Vault search will use keyword-only mode because OPENAI_API_KEY is not configured")
		}
	} else {
		log.Println("Starting in AI-only/local-editor API mode; vault infrastructure is not configured")
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
	handler := handlers.NewHandler(db, redisClient, apnsClient, embeddingService, vaultEnabled)

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

	// Always-available truth/AI routes.
	app.Get("/health", handler.HealthCheck)
	app.Post("/ai/write", handler.AIWrite)

	// Vault routes exist only when both database and Redis were configured and initialized.
	if vaultEnabled {
		app.Get("/entries", handler.GetEntries)
		app.Post("/vault/search", handler.SearchVault)
		app.Get("/ws", websocket.New(handler.HandleWebSocket))
	}

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
	dbURL := strings.TrimSpace(os.Getenv("DB_URL"))
	if strings.HasPrefix(dbURL, "mongodb://") || strings.HasPrefix(dbURL, "mongodb+srv://") {
		log.Println("DB_URL contains a MongoDB URI; using MongoDB driver")
	}
	return dbURL
}
