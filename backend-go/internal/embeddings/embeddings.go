package embeddings

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/pgvector/pgvector-go"
)

const (
	OpenAIEmbeddingsURL = "https://api.openai.com/v1/embeddings"
	EmbeddingModel      = "text-embedding-3-small"
	EmbeddingDimension  = 512
)

type EmbeddingService struct {
	apiKey string
	client *http.Client
}

type embeddingRequest struct {
	Input      string `json:"input"`
	Model      string `json:"model"`
	Dimensions int    `json:"dimensions"`
}

type embeddingResponse struct {
	Data []struct {
		Embedding []float64 `json:"embedding"`
	} `json:"data"`
}

// NewEmbeddingService creates a new embedding service
func NewEmbeddingService(apiKey string) *EmbeddingService {
	return &EmbeddingService{
		apiKey: apiKey,
		client: &http.Client{},
	}
}

// GenerateEmbedding generates a vector embedding for the given text
func (e *EmbeddingService) GenerateEmbedding(text string) (pgvector.Vector, error) {
	reqBody := embeddingRequest{
		Input:      text,
		Model:      EmbeddingModel,
		Dimensions: EmbeddingDimension,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("error marshaling request: %w", err)
	}

	req, err := http.NewRequest("POST", OpenAIEmbeddingsURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+e.apiKey)

	resp, err := e.client.Do(req)
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return pgvector.Vector{}, fmt.Errorf("OpenAI API error (status %d): %s", resp.StatusCode, string(body))
	}

	var embResp embeddingResponse
	if err := json.NewDecoder(resp.Body).Decode(&embResp); err != nil {
		return pgvector.Vector{}, fmt.Errorf("error decoding response: %w", err)
	}

	if len(embResp.Data) == 0 {
		return pgvector.Vector{}, fmt.Errorf("no embedding returned from API")
	}

	// Convert []float64 to []float32 for pgvector
	embedding := make([]float32, len(embResp.Data[0].Embedding))
	for i, v := range embResp.Data[0].Embedding {
		embedding[i] = float32(v)
	}

	return pgvector.NewVector(embedding), nil
}

// GenerateEmbeddingBatch generates embeddings for multiple texts
func (e *EmbeddingService) GenerateEmbeddingBatch(texts []string) ([]pgvector.Vector, error) {
	vectors := make([]pgvector.Vector, len(texts))
	for i, text := range texts {
		vec, err := e.GenerateEmbedding(text)
		if err != nil {
			return nil, fmt.Errorf("error generating embedding for text %d: %w", i, err)
		}
		vectors[i] = vec
	}
	return vectors, nil
}
