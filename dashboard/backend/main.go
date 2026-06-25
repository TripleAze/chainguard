package main

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"github.com/tripleaze/chainguard/dashboard/backend/api"
	"github.com/tripleaze/chainguard/dashboard/backend/db"
)

var version = "dev"

func main() {
	// Load .env file if present
	_ = godotenv.Load()

	// Required env vars
	databaseURL := mustEnv("DATABASE_URL")
	ingestKey := mustEnv("DASHBOARD_INGEST_KEY")
	githubClientID := mustEnv("GITHUB_CLIENT_ID")
	githubClientSecret := mustEnv("GITHUB_CLIENT_SECRET")
	callbackURL := mustEnv("GITHUB_CALLBACK_URL")
	sessionKey := mustEnv("SESSION_KEY")

	// Optional: allowed users (comma-separated)
	allowedUsersStr := os.Getenv("GITHUB_ALLOWED_USERS")
	var allowedUsers []string
	if allowedUsersStr != "" {
		allowedUsers = strings.Split(allowedUsersStr, ",")
		// Trim whitespace
		for i, u := range allowedUsers {
			allowedUsers[i] = strings.TrimSpace(u)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Connect to PostgreSQL
	pool, err := db.Connect(databaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Run migrations
	if err := db.Migrate(pool, "db/migrations"); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	// Start HTTP server
	srv := api.NewServer(pool, ingestKey, version, githubClientID, githubClientSecret, callbackURL, sessionKey, allowedUsers)
	log.Printf("ChainGuard dashboard backend v%s — listening on :%s", version, port)
	if err := srv.Listen(":" + port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

func mustEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("required environment variable %s is not set", key)
	}
	return val
}
