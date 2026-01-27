package main

import (
	"context"
	"log"
	"os"
	"os/signal"
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

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Get configuration from environment
	dbURL := getEnv("DB_URL", "postgres://bobby_admin:bronx_password@localhost:5432/ghostwriter_vault?sslmode=disable")
	redisURL := getEnv("REDIS_URL", "localhost:6379")
	port := getEnv("PORT", "8080")
	openaiAPIKey := getEnv("OPENAI_API_KEY", "")

	// Initialize database
	db, err := database.NewDatabase(dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize schema
	ctx := context.Background()
	if err := db.InitSchema(ctx); err != nil {
		log.Fatalf("Failed to initialize database schema: %v", err)
	}

	// Initialize Redis
	redisClient, err := redis.NewRedisClient(redisURL)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	// Initialize embedding service
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

	// Graceful shutdown
	go func() {
		if err := app.Listen(":" + port); err != nil {
			log.Fatalf("Server error: %v", err)
		}
	}()

	log.Printf("GhostWriter API server started on port %s", port)

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	if err := app.Shutdown(); err != nil {
		log.Fatalf("Server shutdown error: %v", err)
	}

	log.Println("Server exited")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
