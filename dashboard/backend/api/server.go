package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tripleaze/chainguard/dashboard/backend/db"
	"github.com/tripleaze/chainguard/dashboard/backend/models"
)

// Server holds shared dependencies
type Server struct {
	pool      *pgxpool.Pool
	ingestKey string
	version   string
	mux       *http.ServeMux
}

// NewServer wires up all routes and returns a ready Server
func NewServer(pool *pgxpool.Pool, ingestKey, version string) *Server {
	s := &Server{
		pool:      pool,
		ingestKey: ingestKey,
		version:   version,
		mux:       http.NewServeMux(),
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

	// Dashboard API — read endpoints (no auth for internal use)
	s.mux.HandleFunc("GET /api/releases", s.handleListReleases)
	s.mux.HandleFunc("GET /api/releases/{digest}", s.handleGetRelease)
	s.mux.HandleFunc("GET /api/stats", s.handleStats)
	s.mux.HandleFunc("GET /api/stats/cve-trend", s.handleCVETrend)

	// Ingest endpoint — requires API key (called by CI)
	s.mux.HandleFunc("POST /api/ingest", s.requireAPIKey(s.handleIngest))
}

// ── Middleware ────────────────────────────────────────────────────────────────

func (s *Server) withMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
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
			s.writeError(w, http.StatusUnauthorized, "invalid or missing API key")
			return
		}
		next(w, r)
	}
}

// ── Handlers ──────────────────────────────────────────────────────────────────

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
