package handlers

import (
    "os"
    "strings"
    "testing"
)

// Prevent accidental reintroduction of raw manuscript search terms into service logs.
func TestVaultSearchDoesNotLogRawQuery(t *testing.T) {
    source, err := os.ReadFile("rest.go")
    if err != nil {
        t.Fatalf("read handler source: %v", err)
    }
    text := string(source)
    if strings.Contains(text, "search skipped for query %q") {
        t.Fatal("vault search fallback must not print a user's raw query")
    }
    if !strings.Contains(text, "Embedding service disabled: vector leg of search skipped") {
        t.Fatal("expected non-sensitive operational log marker")
    }
}
