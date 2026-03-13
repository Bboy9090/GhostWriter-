package main

import (
	"errors"
	"os"
	"testing"
	"time"
)

func TestGetEnv(t *testing.T) {
	const key = "TEST_GET_ENV_KEY"
	defer os.Unsetenv(key)

	// Returns default when unset
	if got := getEnv(key, "default"); got != "default" {
		t.Errorf("getEnv unset: got %q, want %q", got, "default")
	}

	// Returns env value when set
	os.Setenv(key, "value")
	if got := getEnv(key, "default"); got != "value" {
		t.Errorf("getEnv set: got %q, want %q", got, "value")
	}
}

func TestResolveDatabaseURL_MongoDBURITakesPrecedence(t *testing.T) {
	const mongoURI = "mongodb://user:pass@host:27017/db"
	os.Setenv("MONGODB_URI", mongoURI)
	defer os.Unsetenv("MONGODB_URI")
	os.Setenv("DB_URL", "postgres://user:pass@host:5432/db")
	defer os.Unsetenv("DB_URL")

	got := resolveDatabaseURL()
	if got != mongoURI {
		t.Errorf("resolveDatabaseURL() = %q, want MONGODB_URI %q", got, mongoURI)
	}
}

func TestResolveDatabaseURL_FallsBackToDBURL(t *testing.T) {
	os.Unsetenv("MONGODB_URI")
	const pgURL = "postgres://user:pass@host:5432/db?sslmode=disable"
	os.Setenv("DB_URL", pgURL)
	defer os.Unsetenv("DB_URL")

	got := resolveDatabaseURL()
	if got != pgURL {
		t.Errorf("resolveDatabaseURL() = %q, want %q", got, pgURL)
	}
}

func TestResolveDatabaseURL_MongoDBViaDBURL(t *testing.T) {
	os.Unsetenv("MONGODB_URI")
	const mongoURL = "mongodb://user:pass@host:27017/db"
	os.Setenv("DB_URL", mongoURL)
	defer os.Unsetenv("DB_URL")

	got := resolveDatabaseURL()
	if got != mongoURL {
		t.Errorf("resolveDatabaseURL() = %q, want %q", got, mongoURL)
	}
}

func TestRetry_SuccessOnFirstAttempt(t *testing.T) {
	calls := 0
	err := retry(3, time.Millisecond, func() error {
		calls++
		return nil
	})
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if calls != 1 {
		t.Errorf("expected 1 call, got %d", calls)
	}
}

func TestRetry_SuccessAfterRetries(t *testing.T) {
	calls := 0
	err := retry(3, time.Millisecond, func() error {
		calls++
		if calls < 3 {
			return errors.New("temporary error")
		}
		return nil
	})
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if calls != 3 {
		t.Errorf("expected 3 calls, got %d", calls)
	}
}

func TestRetry_ExhaustsAttempts(t *testing.T) {
	calls := 0
	sentinel := errors.New("persistent error")
	err := retry(3, time.Millisecond, func() error {
		calls++
		return sentinel
	})
	if err == nil {
		t.Error("expected error, got nil")
	}
	if calls != 3 {
		t.Errorf("expected 3 calls, got %d", calls)
	}
}
