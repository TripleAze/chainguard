package db

import (
	"context"
	_ "embed"
	"fmt"
	"time"

	"github.com/TripleAze/chainguard/dashboard/backend/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/001_init.sql
var migration001 string

// Connect creates a PostgreSQL connection pool
func Connect(databaseURL string) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("pgxpool.New: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping: %w", err)
	}

	return pool, nil
}

// Migrate runs all embedded migrations in order
func Migrate(pool *pgxpool.Pool, _ string) error {
	ctx := context.Background()
	if _, err := pool.Exec(ctx, migration001); err != nil {
		return fmt.Errorf("run migration 001_init.sql: %w", err)
	}
	return nil
}

// InsertRelease inserts a new release record
func InsertRelease(ctx context.Context, pool *pgxpool.Pool, r *models.Release) error {
	_, err := pool.Exec(ctx, `
		INSERT INTO releases (
			image_ref, digest, git_commit, git_ref, workflow_run, built_at,
			passed, overall,
			sig_passed, sig_detail,
			sbom_passed, sbom_packages, sbom_format, sbom_version,
			vuln_passed, vuln_critical, vuln_high, vuln_medium, vuln_low,
			vuln_scanner, vuln_db_date,
			prov_passed, prov_commit, prov_ref, prov_builder, slsa_level,
			raw_report
		) VALUES (
			$1,$2,$3,$4,$5,$6,
			$7,$8,
			$9,$10,
			$11,$12,$13,$14,
			$15,$16,$17,$18,$19,
			$20,$21,
			$22,$23,$24,$25,$26,
			$27
		)
		ON CONFLICT (digest) DO NOTHING`,
		r.ImageRef, r.Digest, r.GitCommit, r.GitRef, r.WorkflowRun, r.BuiltAt,
		r.Passed, r.Overall,
		r.SigPassed, r.SigDetail,
		r.SBOMPassed, r.SBOMPackages, r.SBOMFormat, r.SBOMVersion,
		r.VulnPassed, r.VulnCritical, r.VulnHigh, r.VulnMedium, r.VulnLow,
		r.VulnScanner, r.VulnDBDate,
		r.ProvPassed, r.ProvCommit, r.ProvRef, r.ProvBuilder, r.SLSALevel,
		r.RawReport,
	)
	return err
}

// ListReleases returns paginated releases ordered by built_at DESC
func ListReleases(ctx context.Context, pool *pgxpool.Pool, limit, offset int) ([]models.Release, int, error) {
	var total int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM releases`).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := pool.Query(ctx, `
		SELECT id, image_ref, digest, git_commit, git_ref, workflow_run,
		       built_at, ingested_at, passed, overall,
		       sig_passed, sig_detail,
		       sbom_passed, sbom_packages, sbom_format, sbom_version,
		       vuln_passed, vuln_critical, vuln_high, vuln_medium, vuln_low,
		       vuln_scanner, vuln_db_date,
		       prov_passed, prov_commit, prov_ref, prov_builder, slsa_level,
		       raw_report
		FROM releases
		ORDER BY built_at DESC
		LIMIT $1 OFFSET $2`,
		limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var releases []models.Release
	for rows.Next() {
		var r models.Release
		if err := rows.Scan(
			&r.ID, &r.ImageRef, &r.Digest, &r.GitCommit, &r.GitRef, &r.WorkflowRun,
			&r.BuiltAt, &r.IngestedAt, &r.Passed, &r.Overall,
			&r.SigPassed, &r.SigDetail,
			&r.SBOMPassed, &r.SBOMPackages, &r.SBOMFormat, &r.SBOMVersion,
			&r.VulnPassed, &r.VulnCritical, &r.VulnHigh, &r.VulnMedium, &r.VulnLow,
			&r.VulnScanner, &r.VulnDBDate,
			&r.ProvPassed, &r.ProvCommit, &r.ProvRef, &r.ProvBuilder, &r.SLSALevel,
			&r.RawReport,
		); err != nil {
			return nil, 0, err
		}
		releases = append(releases, r)
	}
	return releases, total, rows.Err()
}

// GetReleaseByDigest returns a single release by image digest
func GetReleaseByDigest(ctx context.Context, pool *pgxpool.Pool, digest string) (*models.Release, error) {
	var r models.Release
	err := pool.QueryRow(ctx, `
		SELECT id, image_ref, digest, git_commit, git_ref, workflow_run,
		       built_at, ingested_at, passed, overall,
		       sig_passed, sig_detail,
		       sbom_passed, sbom_packages, sbom_format, sbom_version,
		       vuln_passed, vuln_critical, vuln_high, vuln_medium, vuln_low,
		       vuln_scanner, vuln_db_date,
		       prov_passed, prov_commit, prov_ref, prov_builder, slsa_level,
		       raw_report
		FROM releases WHERE digest = $1`, digest,
	).Scan(
		&r.ID, &r.ImageRef, &r.Digest, &r.GitCommit, &r.GitRef, &r.WorkflowRun,
		&r.BuiltAt, &r.IngestedAt, &r.Passed, &r.Overall,
		&r.SigPassed, &r.SigDetail,
		&r.SBOMPassed, &r.SBOMPackages, &r.SBOMFormat, &r.SBOMVersion,
		&r.VulnPassed, &r.VulnCritical, &r.VulnHigh, &r.VulnMedium, &r.VulnLow,
		&r.VulnScanner, &r.VulnDBDate,
		&r.ProvPassed, &r.ProvCommit, &r.ProvRef, &r.ProvBuilder, &r.SLSALevel,
		&r.RawReport,
	)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

// GetSummary returns aggregate stats for the summary cards
func GetSummary(ctx context.Context, pool *pgxpool.Pool) (*models.Summary, error) {
	var s models.Summary
	err := pool.QueryRow(ctx, `
		SELECT total_releases, passed_releases, failed_releases,
		       COALESCE(pass_rate, 0), last_deploy_at, COALESCE(total_critical, 0), COALESCE(total_high, 0)
		FROM release_summary`,
	).Scan(
		&s.TotalReleases, &s.PassedReleases, &s.FailedReleases,
		&s.PassRate, &s.LastDeployAt, &s.TotalCritical, &s.TotalHigh,
	)
	return &s, err
}

// GetCVETrend returns daily CVE counts for the last N days
func GetCVETrend(ctx context.Context, pool *pgxpool.Pool, days int) ([]models.CVETrendPoint, error) {
	rows, err := pool.Query(ctx, `
		SELECT day, total_releases, critical, high, medium, low
		FROM cve_trend
		WHERE day >= NOW() - make_interval(days => $1)
		ORDER BY day ASC`, days,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var points []models.CVETrendPoint
	for rows.Next() {
		var p models.CVETrendPoint
		if err := rows.Scan(&p.Day, &p.Releases, &p.Critical, &p.High, &p.Medium, &p.Low); err != nil {
			return nil, err
		}
		points = append(points, p)
	}
	return points, rows.Err()
}
