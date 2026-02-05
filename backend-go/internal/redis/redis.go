package redis

import (
	"context"
	"fmt"
	"log"

	"github.com/go-redis/redis/v8"
)

const (
	ChannelPortalUpdates = "portal:updates"
)

type RedisClient struct {
	client *redis.Client
}

// NewRedisClient creates a new Redis client
func NewRedisClient(redisURL string) (*RedisClient, error) {
	opts, err := redis.ParseURL("redis://" + redisURL)
	if err != nil {
		return nil, fmt.Errorf("error parsing redis URL: %w", err)
	}

	client := redis.NewClient(opts)

	// Test connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("error connecting to redis: %w", err)
	}

	log.Println("Redis connection established")

	return &RedisClient{client: client}, nil
}

// Publish publishes a message to a channel
func (r *RedisClient) Publish(ctx context.Context, channel string, message string) error {
	err := r.client.Publish(ctx, channel, message).Err()
	if err != nil {
		return fmt.Errorf("error publishing message: %w", err)
	}
	return nil
}

// Subscribe subscribes to a channel
func (r *RedisClient) Subscribe(ctx context.Context, channel string) *redis.PubSub {
	return r.client.Subscribe(ctx, channel)
}

// Close closes the Redis connection
func (r *RedisClient) Close() error {
	return r.client.Close()
}
