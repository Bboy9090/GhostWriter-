package aiwriting

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const defaultEndpoint = "https://api.openai.com/v1/responses"

type Service struct {
	client   *http.Client
	endpoint string
}

type Request struct {
	Action string `json:"action"`
	Text   string `json:"text"`
	Model  string `json:"model"`
}

type Result struct {
	Text  string `json:"text"`
	Model string `json:"model"`
}

type responsesRequest struct {
	Model        string `json:"model"`
	Instructions string `json:"instructions"`
	Input        string `json:"input"`
	Store        bool   `json:"store"`
}

type responsesEnvelope struct {
	Output []struct {
		Type    string `json:"type"`
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
	} `json:"output"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func NewService(endpoint string) *Service {
	if strings.TrimSpace(endpoint) == "" {
		endpoint = defaultEndpoint
	}
	return &Service{
		client: &http.Client{Timeout: 45 * time.Second},
		endpoint: endpoint,
	}
}

func instructionFor(action string) (string, error) {
	switch action {
	case "improve":
		return "Improve clarity, flow, and style while preserving the author's meaning, facts, voice, and point of view. Return only the revised text.", nil
	case "shorten":
		return "Make the text substantially more concise while preserving the essential meaning, facts, voice, and point of view. Return only the revised text.", nil
	case "expand":
		return "Expand the text with useful detail, transitions, and specificity without inventing factual claims that are not supported by the input. Return only the revised text.", nil
	case "grammar":
		return "Correct grammar, spelling, punctuation, and obvious usage errors while changing wording as little as possible. Return only the corrected text.", nil
	case "professional":
		return "Rewrite the text in a polished professional tone while preserving meaning and factual content. Return only the revised text.", nil
	case "casual":
		return "Rewrite the text in a natural, conversational tone while preserving meaning and factual content. Return only the revised text.", nil
	case "summarize":
		return "Produce a concise summary faithful to the supplied text. Do not add unsupported facts. Return only the summary.", nil
	default:
		return "", fmt.Errorf("unsupported AI action %q", action)
	}
}

func (s *Service) Generate(ctx context.Context, apiKey string, input Request) (Result, error) {
	apiKey = strings.TrimSpace(apiKey)
	if apiKey == "" {
		return Result{}, errors.New("OpenAI API key is required")
	}
	input.Text = strings.TrimSpace(input.Text)
	if input.Text == "" {
		return Result{}, errors.New("text is required")
	}
	if len(input.Text) > 120000 {
		return Result{}, errors.New("text exceeds the 120000 character request limit")
	}
	model := strings.TrimSpace(input.Model)
	if model == "" {
		return Result{}, errors.New("model is required")
	}
	if len(model) > 100 {
		return Result{}, errors.New("invalid model")
	}
	instructions, err := instructionFor(input.Action)
	if err != nil {
		return Result{}, err
	}

	payload, err := json.Marshal(responsesRequest{
		Model: model, Instructions: instructions, Input: input.Text, Store: false,
	})
	if err != nil {
		return Result{}, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.endpoint, bytes.NewReader(payload))
	if err != nil {
		return Result{}, err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return Result{}, fmt.Errorf("AI provider request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	if err != nil {
		return Result{}, fmt.Errorf("AI provider response read failed: %w", err)
	}

	var envelope responsesEnvelope
	if err := json.Unmarshal(body, &envelope); err != nil {
		return Result{}, fmt.Errorf("AI provider returned malformed JSON")
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		if envelope.Error != nil && strings.TrimSpace(envelope.Error.Message) != "" {
			return Result{}, fmt.Errorf("AI provider rejected the request: %s", envelope.Error.Message)
		}
		return Result{}, fmt.Errorf("AI provider rejected the request with status %d", resp.StatusCode)
	}

	var parts []string
	for _, output := range envelope.Output {
		for _, content := range output.Content {
			if content.Type == "output_text" && strings.TrimSpace(content.Text) != "" {
				parts = append(parts, content.Text)
			}
		}
	}
	text := strings.TrimSpace(strings.Join(parts, "\n"))
	if text == "" {
		return Result{}, errors.New("AI provider returned no text")
	}
	return Result{Text: text, Model: model}, nil
}
