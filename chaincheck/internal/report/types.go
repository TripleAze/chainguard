package report

// InspectResult is the top-level result of a chaincheck inspection.
// This is what gets serialised to JSON with --output json.
type InspectResult struct {
	Image      string          `json:"image"`
	Digest     string          `json:"digest"`
	Signature  CheckResult     `json:"signature"`
	SBOM       SBOMResult      `json:"sbom"`
	VulnScan   VulnResult      `json:"vuln_scan"`
	Provenance ProvenanceResult `json:"provenance"`
	Overall    string          `json:"overall"` // "PASS" or "FAIL"
	Passed     bool            `json:"passed"`
}

// CheckResult is the base result for any check.
type CheckResult struct {
	Passed  bool   `json:"passed"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
}

// SBOMResult extends CheckResult with SBOM-specific fields.
type SBOMResult struct {
	CheckResult
	PackageCount int    `json:"package_count,omitempty"`
	Format       string `json:"format,omitempty"`    // e.g. "spdx-json"
	SPDXVersion  string `json:"spdx_version,omitempty"`
}

// VulnResult extends CheckResult with vulnerability scan fields.
type VulnResult struct {
	CheckResult
	Scanner        string        `json:"scanner,omitempty"`
	ScannerVersion string        `json:"scanner_version,omitempty"`
	DBBuiltAt      string        `json:"db_built_at,omitempty"`
	Summary        VulnSummary   `json:"summary,omitempty"`
	Findings       []VulnFinding `json:"findings,omitempty"`
}

// VulnSummary counts findings by severity.
type VulnSummary struct {
	Critical int `json:"critical"`
	High     int `json:"high"`
	Medium   int `json:"medium"`
	Low      int `json:"low"`
}

// VulnFinding is a single CVE finding from the vuln attestation.
type VulnFinding struct {
	ID         string `json:"id"`
	Severity   string `json:"severity"`
	Package    string `json:"package"`
	Version    string `json:"version"`
	DataSource string `json:"data_source,omitempty"`
}

// ProvenanceResult extends CheckResult with SLSA provenance fields.
type ProvenanceResult struct {
	CheckResult
	BuilderID    string `json:"builder_id,omitempty"`
	SourceRepo   string `json:"source_repo,omitempty"`
	SourceCommit string `json:"source_commit,omitempty"`
	SourceRef    string `json:"source_ref,omitempty"`
	BuildTrigger string `json:"build_trigger,omitempty"`
	RunID        string `json:"run_id,omitempty"`
	SLSALevel    int    `json:"slsa_level,omitempty"`
}
