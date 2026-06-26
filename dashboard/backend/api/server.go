package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/sessions"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tripleaze/chainguard/dashboard/backend/db"
	"github.com/tripleaze/chainguard/dashboard/backend/models"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

// Server holds shared dependencies
type Server struct {
	pool         *pgxpool.Pool
	ingestKey    string
	version      string
	oauthCfg     *oauth2.Config
	sessionKey   []byte
	store        *sessions.CookieStore
	allowedUsers map[string]bool
	mux          *http.ServeMux
}

// NewServer wires up all routes and returns a ready Server
func NewServer(pool *pgxpool.Pool, ingestKey, version, githubClientID, githubClientSecret, callbackURL, sessionKey string, allowedUsers []string) *Server {
	oauthCfg := &oauth2.Config{
		ClientID:     githubClientID,
		ClientSecret: githubClientSecret,
		RedirectURL:  callbackURL,
		Scopes:       []string{"read:user", "user:email"},
		Endpoint:     github.Endpoint,
	}

	store := sessions.NewCookieStore([]byte(sessionKey))
	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7, // 1 week
		HttpOnly: true,
		Secure:   false, // Set to true in production
		SameSite: http.SameSiteLaxMode,
	}

	allowedUsersMap := make(map[string]bool)
	for _, u := range allowedUsers {
		if u != "" {
			allowedUsersMap[u] = true
		}
	}

	s := &Server{
		pool:         pool,
		ingestKey:    ingestKey,
		version:      version,
		oauthCfg:     oauthCfg,
		sessionKey:   []byte(sessionKey),
		store:        store,
		allowedUsers: allowedUsersMap,
		mux:          http.NewServeMux(),
	}
	s.routes()
	return s
}

// Listen starts the HTTP server
func (s *Server) Listen(addr string) error {
	return http.ListenAndServe(addr, s.withMiddleware(s.mux))
}

// routes registers all HTTP endpoints
func (s *Server) routes() {
	// Public
	s.mux.HandleFunc("GET /health", s.handleHealth)
	s.mux.HandleFunc("GET /api/auth/login", s.handleLogin)
	s.mux.HandleFunc("GET /api/auth/callback", s.handleCallback)

	// Ingest endpoint — requires API key (called by CI)
	s.mux.HandleFunc("POST /api/ingest", s.requireAPIKey(s.handleIngest))

	// Dashboard API — requires user auth
	s.mux.HandleFunc("GET /api/auth/user", s.requireAuth(s.handleUser))
	s.mux.HandleFunc("POST /api/auth/logout", s.requireAuth(s.handleLogout))
	s.mux.HandleFunc("GET /api/releases", s.requireAuth(s.handleListReleases))
	s.mux.HandleFunc("GET /api/releases/{digest}", s.requireAuth(s.handleGetRelease))
	s.mux.HandleFunc("GET /api/stats", s.requireAuth(s.handleStats))
	s.mux.HandleFunc("GET /api/stats/cve-trend", s.requireAuth(s.handleCVETrend))
}

// ── Middleware ────────────────────────────────────────────────────────────────

func (s *Server) withMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

func (s *Server) requireAPIKey(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		key := strings.TrimPrefix(auth, "Bearer ")
		if key == "" || key != s.ingestKey {
			s.writeError(w, http.StatusUnauthorized, "invalid ingest key")
			return
		}
		next(w, r)
	}
}

func (s *Server) requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// For local dev, always allow requests without auth
		next(w, r)
	}
}

// ── Handlers ──────────────────────────────────────────────────────────────────

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	session, err := s.store.Get(r, "chainguard-session")
	if err != nil {
		s.writeError(w, http.StatusInternalServerError, "failed to get session")
		return
	}

	state := fmt.Sprintf("%d", time.Now().UnixNano())
	session.Values["oauth_state"] = state
	if err := session.Save(r, w); err != nil {
		s.writeError(w, http.StatusInternalServerError, "failed to save session")
		return
	}

	http.Redirect(w, r, s.oauthCfg.AuthCodeURL(state), http.StatusFound)
}

func (s *Server) handleCallback(w http.ResponseWriter, r *http.Request) {
	session, err := s.store.Get(r, "chainguard-session")
	if err != nil {
		s.writeError(w, http.StatusInternalServerError, "failed to get session")
		return
	}

	if r.URL.Query().Get("state") != session.Values["oauth_state"] {
		s.writeError(w, http.StatusBadRequest, "invalid state parameter")
		return
	}

	code := r.URL.Query().Get("code")
	token, err := s.oauthCfg.Exchange(r.Context(), code)
	if err != nil {
		s.writeError(w, http.StatusInternalServerError, "failed to exchange code for token")
		return
	}

	client := s.oauthCfg.Client(r.Context(), token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		s.writeError(w, http.StatusInternalServerError, "failed to get user info")
		return
	}
	defer resp.Body.Close()

	var githubUser struct {
		Login     string `json:"login"`
		ID        int    `json:"id"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&githubUser); err != nil {
		s.writeError(w, http.StatusInternalServerError, "failed to parse user info")
		return
	}

	// Check if user is allowed
	if len(s.allowedUsers) > 0 && !s.allowedUsers[githubUser.Login] {
		session.Values["authenticated"] = false
		session.Options.MaxAge = -1
		_ = session.Save(r, w)
		s.writeError(w, http.StatusForbidden, "access denied: this GitHub account is not authorized")
		return
	}

	session.Values["authenticated"] = true
	session.Values["user_login"] = githubUser.Login
	session.Values["user_name"] = githubUser.Name
	session.Values["user_email"] = githubUser.Email
	session.Values["user_avatar"] = githubUser.AvatarURL
	if err := session.Save(r, w); err != nil {
		s.writeError(w, http.StatusInternalServerError, "failed to save session")
		return
	}

	http.Redirect(w, r, "/", http.StatusFound)
}

func (s *Server) handleUser(w http.ResponseWriter, r *http.Request) {
	session, err := s.store.Get(r, "chainguard-session")
	if err != nil {
		s.writeError(w, http.StatusInternalServerError, "failed to get session")
		return
	}

	s.writeJSON(w, http.StatusOK, map[string]interface{}{
		"login":  session.Values["user_login"],
		"name":   session.Values["user_name"],
		"email":  session.Values["user_email"],
		"avatar": session.Values["user_avatar"],
	})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	session, err := s.store.Get(r, "chainguard-session")
	if err != nil {
		s.writeError(w, http.StatusInternalServerError, "failed to get session")
		return
	}

	session.Values["authenticated"] = false
	delete(session.Values, "user_login")
	delete(session.Values, "user_name")
	delete(session.Values, "user_email")
	delete(session.Values, "user_avatar")
	session.Options.MaxAge = -1

	if err := session.Save(r, w); err != nil {
		s.writeError(w, http.StatusInternalServerError, "failed to save session")
		return
	}

	s.writeJSON(w, http.StatusOK, map[string]string{"status": "logged out"})
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	s.writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"version": s.version,
	})
}

// POST /api/ingest
// Called by CI with chaincheck JSON report + GitHub context
func (s *Server) handleIngest(w http.ResponseWriter, r *http.Request) {
	var req models.IngestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return
	}

	// Parse the inner chaincheck report
	var report models.ChaincheckReport
	if err := json.Unmarshal(req.Report, &report); err != nil {
		s.writeError(w, http.StatusBadRequest, "invalid chaincheck report: "+err.Error())
		return
	}

	// Parse built_at timestamp
	builtAt, err := time.Parse(time.RFC3339, req.BuiltAt)
	if err != nil {
		builtAt = time.Now()
	}

	// Map to DB model
	release := &models.Release{
		ImageRef:    report.Image,
		Digest:      report.Digest,
		GitCommit:   req.GitCommit,
		GitRef:      req.GitRef,
		WorkflowRun: req.WorkflowRun,
		BuiltAt:     builtAt,
		Passed:      report.Passed,
		Overall:     report.Overall,

		SigPassed: report.Signature.Passed,
		SigDetail: report.Signature.Detail,

		SBOMPassed:   report.SBOM.Passed,
		SBOMPackages: report.SBOM.PackageCount,
		SBOMFormat:   report.SBOM.Format,
		SBOMVersion:  report.SBOM.SPDXVersion,

		VulnPassed:   report.VulnScan.Passed,
		VulnCritical: report.VulnScan.Summary.Critical,
		VulnHigh:     report.VulnScan.Summary.High,
		VulnMedium:   report.VulnScan.Summary.Medium,
		VulnLow:      report.VulnScan.Summary.Low,
		VulnScanner:  fmt.Sprintf("%s %s", report.VulnScan.Scanner, report.VulnScan.ScannerVersion),
		VulnDBDate:   report.VulnScan.DBBuiltAt,

		ProvPassed:  report.Provenance.Passed,
		ProvCommit:  report.Provenance.SourceCommit,
		ProvRef:     report.Provenance.SourceRef,
		ProvBuilder: report.Provenance.BuilderID,
		SLSALevel:   report.Provenance.SLSALevel,

		RawReport: req.Report,
	}

	if err := db.InsertRelease(r.Context(), s.pool, release); err != nil {
		s.writeError(w, http.StatusInternalServerError, "failed to store release: "+err.Error())
		return
	}

	s.writeJSON(w, http.StatusCreated, map[string]string{
		"status": "ingested",
		"digest": report.Digest,
	})
}

// GET /api/releases?page=1&limit=20
func (s *Server) handleListReleases(w http.ResponseWriter, r *http.Request) {
	limit := queryInt(r, "limit", 20)
	page := queryInt(r, "page", 1)
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit

	releases, total, err := db.ListReleases(r.Context(), s.pool, limit, offset)
	if err != nil {
		s.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.writeJSON(w, http.StatusOK, map[string]any{
		"releases": releases,
		"total":    total,
		"page":     page,
		"limit":    limit,
		"pages":    (total + limit - 1) / limit,
	})
}

// GET /api/releases/{digest}
func (s *Server) handleGetRelease(w http.ResponseWriter, r *http.Request) {
	digest := r.PathValue("digest")
	release, err := db.GetReleaseByDigest(r.Context(), s.pool, digest)
	if err != nil {
		s.writeError(w, http.StatusNotFound, "release not found")
		return
	}
	s.writeJSON(w, http.StatusOK, release)
}

// GET /api/stats
func (s *Server) handleStats(w http.ResponseWriter, r *http.Request) {
	summary, err := db.GetSummary(r.Context(), s.pool)
	if err != nil {
		s.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	s.writeJSON(w, http.StatusOK, summary)
}

// GET /api/stats/cve-trend?days=30
func (s *Server) handleCVETrend(w http.ResponseWriter, r *http.Request) {
	days := queryInt(r, "days", 30)
	if days > 365 {
		days = 365
	}
	points, err := db.GetCVETrend(r.Context(), s.pool, days)
	if err != nil {
		s.writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]any{
		"days":   days,
		"points": points,
	})
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func (s *Server) writeJSON(w http.ResponseWriter, status int, v any) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func (s *Server) writeError(w http.ResponseWriter, status int, msg string) {
	s.writeJSON(w, status, map[string]string{"error": msg})
}

func queryInt(r *http.Request, key string, def int) int {
	v := r.URL.Query().Get(key)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil || n < 1 {
		return def
	}
	return n
}
