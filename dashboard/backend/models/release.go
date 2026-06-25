package models

import (
	"encoding/json"
	"time"
)

// Release represents one pipeline run that produced a chaincheck report.
// Maps 1:1 with the releases table.
type Release struct {
	ID          string          `db:"id"           json:"id"`
	ImageRef    string          `db:"image_ref"    json:"image_ref"`
	Digest      string          `db:"digest"       json:"digest"`
	GitCommit   string          `db:"git_commit"   json:"git_commit"`
	GitRef      string          `db:"git_ref"      json:"git_ref"`
	WorkflowRun string          `db:"workflow_run" json:"workflow_run"`
	BuiltAt     time.Time       `db:"built_at"     json:"built_at"`
	IngestedAt  time.Time       `db:"ingested_at"  json:"ingested_at"`

	Passed  bool   `db:"passed"  json:"passed"`
	Overall string `db:"overall" json:"overall"`

	SigPassed bool   `db:"sig_passed" json:"sig_passed"`
	SigDetail string `db:"sig_detail" json:"sig_detail"`

	SBOMPassed   bool   `db:"sbom_passed"   json:"sbom_passed"`
	SBOMPackages int    `db:"sbom_packages" json:"sbom_packages"`
	SBOMFormat   string `db:"sbom_format"   json:"sbom_format"`
	SBOMVersion  string `db:"sbom_version"  json:"sbom_version"`

	VulnPassed   bool   `db:"vuln_passed"   json:"vuln_passed"`
	VulnCritical int    `db:"vuln_critical" json:"vuln_critical"`
	VulnHigh     int    `db:"vuln_high"     json:"vuln_high"`
	VulnMedium   int    `db:"vuln_medium"   json:"vuln_medium"`
	VulnLow      int    `db:"vuln_low"      json:"vuln_low"`
	VulnScanner  string `db:"vuln_scanner"  json:"vuln_scanner"`
	VulnDBDate   string `db:"vuln_db_date"  json:"vuln_db_date"`

	ProvPassed  bool   `db:"prov_passed"  json:"prov_passed"`
	ProvCommit  string `db:"prov_commit"  json:"prov_commit"`
	ProvRef     string `db:"prov_ref"     json:"prov_ref"`
	ProvBuilder string `db:"prov_builder" json:"prov_builder"`
	SLSALevel   int    `db:"slsa_level"   json:"slsa_level"`

	RawReport json.RawMessage `db:"raw_report" json:"raw_report"`
}

// IngestRequest is the payload sent by CI to POST /api/ingest.
// It is the chaincheck JSON report enriched with GitHub Actions context.
type IngestRequest struct {
	// chaincheck report fields
	Image   string          `json:"image"`
	Digest  string          `json:"digest"`
	Report  json.RawMessage `json:"report"` // full chaincheck --output json payload

	// GitHub Actions context — added by CI step
	GitCommit   string `json:"git_commit"`
	GitRef      string `json:"git_ref"`
	WorkflowRun string `json:"workflow_run"`
	BuiltAt     string `json:"built_at"` // RFC3339
}

// Summary is returned by GET /api/stats
type Summary struct {
	TotalReleases  int        `json:"total_releases"`
	PassedReleases int        `json:"passed_releases"`
	FailedReleases int        `json:"failed_releases"`
	PassRate       float64    `json:"pass_rate"`
	LastDeployAt   *time.Time `json:"last_deploy_at"`
	TotalCritical  int        `json:"total_critical"`
	TotalHigh      int        `json:"total_high"`
}

// CVETrendPoint is one data point in the CVE trend chart
type CVETrendPoint struct {
	Day      time.Time `db:"day"             json:"day"`
	Releases int       `db:"total_releases"  json:"releases"`
	Critical int       `db:"critical"        json:"critical"`
	High     int       `db:"high"            json:"high"`
	Medium   int       `db:"medium"          json:"medium"`
	Low      int       `db:"low"             json:"low"`
}

// ChaincheckReport mirrors the JSON output of chaincheck --output json
// Used to parse the ingest payload and extract individual check results
type ChaincheckReport struct {
	Image   string `json:"image"`
	Digest  string `json:"digest"`
	Overall string `json:"overall"`
	Passed  bool   `json:"passed"`

	Signature struct {
		Passed  bool   `json:"passed"`
		Message string `json:"message"`
		Detail  string `json:"detail"`
	} `json:"signature"`

	SBOM struct {
		Passed       bool   `json:"passed"`
		Message      string `json:"message"`
		PackageCount int    `json:"package_count"`
		Format       string `json:"format"`
		SPDXVersion  string `json:"spdx_version"`
	} `json:"sbom"`

	VulnScan struct {
		Passed         bool   `json:"passed"`
		Message        string `json:"message"`
		Scanner        string `json:"scanner"`
		ScannerVersion string `json:"scanner_version"`
		DBBuiltAt      string `json:"db_built_at"`
		Summary        struct {
			Critical int `json:"critical"`
			High     int `json:"high"`
			Medium   int `json:"medium"`
			Low      int `json:"low"`
		} `json:"summary"`
	} `json:"vuln_scan"`

	Provenance struct {
		Passed       bool   `json:"passed"`
		Message      string `json:"message"`
		SourceRepo   string `json:"source_repo"`
		SourceCommit string `json:"source_commit"`
		SourceRef    string `json:"source_ref"`
		BuilderID    string `json:"builder_id"`
		SLSALevel    int    `json:"slsa_level"`
	} `json:"provenance"`
}
