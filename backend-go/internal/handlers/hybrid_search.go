package handlers

import (
	"sort"
	"strings"
	"unicode"

	"github.com/Bboy9090/GhostWriter/backend-go/internal/models"
)

func tokenizeSearchQuery(s string) []string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsNumber(r) {
			b.WriteRune(r)
		} else {
			b.WriteByte(' ')
		}
	}
	return strings.Fields(b.String())
}

// keywordRelevanceScore is in [0,1]: fraction of query tokens that appear in the document text.
func keywordRelevanceScore(query string, text string) float64 {
	qTok := tokenizeSearchQuery(query)
	if len(qTok) == 0 {
		return 0
	}
	textLower := strings.ToLower(text)
	matched := 0
	for _, t := range qTok {
		if strings.Contains(textLower, t) {
			matched++
		}
	}
	return float64(matched) / float64(len(qTok))
}

// mergeVectorAndKeyword combines vector similarity with lexical overlap so exact phrase matches
// still surface when embeddings are weak or missing dimensions.
func mergeVectorAndKeyword(
	vec []models.SearchResult,
	kw []models.PortalEntry,
	query string,
	limit int,
) []models.SearchResult {
	if limit <= 0 {
		limit = 10
	}

	type scored struct {
		entry models.PortalEntry
		score float64
	}
	byID := make(map[int]scored)

	for _, r := range vec {
		byID[r.ID] = scored{entry: r.PortalEntry, score: r.Similarity}
	}

	for _, e := range kw {
		kwPart := 0.35 + 0.65*keywordRelevanceScore(query, e.TextContent)
		if kwPart < 0.35 {
			kwPart = 0.35
		}
		if prev, ok := byID[e.ID]; ok {
			// Prefer the stronger of vector vs lexical signal; slight boost when both agree.
			combined := prev.score
			if kwPart > combined {
				combined = kwPart
			} else {
				combined = prev.score + 0.05*kwPart
				if combined > 1 {
					combined = 1
				}
			}
			byID[e.ID] = scored{entry: prev.entry, score: combined}
		} else {
			byID[e.ID] = scored{entry: e, score: kwPart}
		}
	}

	out := make([]models.SearchResult, 0, len(byID))
	for _, v := range byID {
		out = append(out, models.SearchResult{
			PortalEntry: v.entry,
			Similarity:  v.score,
		})
	}

	sort.Slice(out, func(i, j int) bool {
		return out[i].Similarity > out[j].Similarity
	})

	if len(out) > limit {
		out = out[:limit]
	}
	return out
}
