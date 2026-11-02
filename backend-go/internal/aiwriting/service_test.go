package aiwriting

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestGenerateReturnsProviderOutputText(t *testing.T) {
	var auth string
	var sawStoreFalse bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth = r.Header.Get("Authorization")
		buf := new(strings.Builder)
		_, _ = buf.ReadFrom(r.Body)
		sawStoreFalse = strings.Contains(buf.String(), `"store":false`)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"output":[{"type":"message","content":[{"type":"output_text","text":"Polished result."}]}]}`))
	}))
	defer server.Close()

	service := NewService(server.URL)
	result, err := service.Generate(context.Background(), "test-key", Request{
		Action: "improve",
		Text:   "rough text",
		Model:  "test-model",
	})
	if err != nil {
		t.Fatalf("Generate returned error: %v", err)
	}
	if result.Text != "Polished result." {
		t.Fatalf("unexpected result: %q", result.Text)
	}
	if result.Model != "test-model" {
		t.Fatalf("unexpected model: %q", result.Model)
	}
	if auth != "Bearer test-key" {
		t.Fatalf("provider authorization header missing")
	}
	if !sawStoreFalse {
		t.Fatalf("request must set store=false")
	}
}

func TestGenerateRejectsUnsupportedActionWithoutNetwork(t *testing.T) {
	called := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	service := NewService(server.URL)
	_, err := service.Generate(context.Background(), "test-key", Request{
		Action: "invent-secret-mode",
		Text:   "text",
		Model:  "test-model",
	})
	if err == nil || !strings.Contains(err.Error(), "unsupported") {
		t.Fatalf("expected unsupported-action error, got %v", err)
	}
	if called {
		t.Fatalf("unsupported action must not call provider")
	}
}

func TestGenerateFailsWhenProviderReturnsNoText(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"output":[]}`))
	}))
	defer server.Close()

	service := NewService(server.URL)
	_, err := service.Generate(context.Background(), "test-key", Request{
		Action: "summarize",
		Text:   "some text",
		Model:  "test-model",
	})
	if err == nil || !strings.Contains(err.Error(), "no text") {
		t.Fatalf("expected no-text error, got %v", err)
	}
}
