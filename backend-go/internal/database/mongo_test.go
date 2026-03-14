package database

import (
	"os"
	"testing"
)

// TestPostTTLDays verifies that postTTLDays correctly reads and validates
// the POST_TTL_DAYS environment variable.
func TestPostTTLDays(t *testing.T) {
	tests := []struct {
		name     string
		envValue string
		want     int
	}{
		{
			name:     "unset means no TTL",
			envValue: "",
			want:     0,
		},
		{
			name:     "zero means no TTL",
			envValue: "0",
			want:     0,
		},
		{
			name:     "negative means no TTL",
			envValue: "-1",
			want:     0,
		},
		{
			name:     "invalid string means no TTL",
			envValue: "never",
			want:     0,
		},
		{
			name:     "positive integer sets TTL",
			envValue: "30",
			want:     30,
		},
		{
			name:     "one day TTL",
			envValue: "1",
			want:     1,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			os.Unsetenv("POST_TTL_DAYS")
			if tc.envValue != "" {
				os.Setenv("POST_TTL_DAYS", tc.envValue)
				defer os.Unsetenv("POST_TTL_DAYS")
			}

			got := postTTLDays()
			if got != tc.want {
				t.Errorf("postTTLDays() = %d, want %d (POST_TTL_DAYS=%q)", got, tc.want, tc.envValue)
			}
		})
	}
}

// TestNoTTLByDefault confirms that without POST_TTL_DAYS the TTL is disabled.
// This is the critical regression test for the "posts expire unexpectedly" bug:
// entries must persist forever unless the operator explicitly opts in to TTL.
func TestNoTTLByDefault(t *testing.T) {
	os.Unsetenv("POST_TTL_DAYS")

	days := postTTLDays()
	if days != 0 {
		t.Fatalf("expected TTL to be disabled (0) by default, got %d days", days)
	}
}
