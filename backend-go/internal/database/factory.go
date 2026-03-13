package database

import (
	"net/url"
	"strings"
)

// NewDatabaseFromURL detects the URI scheme and returns the appropriate DB implementation.
//   - "mongodb://" and "mongodb+srv://" → MongoDatabase
//   - "postgres://" / "postgresql://" / key=value DSN → Database (PostgreSQL)
func NewDatabaseFromURL(dbURL string) (DB, error) {
	if isMongoDB(dbURL) {
		return NewMongoDatabase(dbURL)
	}
	return NewDatabase(dbURL)
}

// redactURL replaces the userinfo (credentials) in a URL string with "***".
// If the string cannot be parsed as a URL, it is returned unchanged.
func redactURL(raw string) string {
	u, err := url.Parse(raw)
	if err != nil || u.User == nil {
		return raw
	}
	u.User = url.UserPassword("***", "***")
	return u.String()
}

// isMongoDB returns true when the connection string uses a MongoDB URI scheme.
func isMongoDB(dbURL string) bool {
	return strings.HasPrefix(dbURL, "mongodb://") || strings.HasPrefix(dbURL, "mongodb+srv://")
}
