package verify

import (
	"github.com/tripleaze/chaincheck/internal/config"
	"github.com/tripleaze/chaincheck/internal/report"
)

func VerifyProvenance(imageRef string, cfg config.Config) (report.ProvenanceResult, error) {
	return report.ProvenanceResult{
		CheckResult: report.CheckResult{
			Passed:  true,
			Message: "SLSA Level 2 (stub)",
		},
		BuilderID:    "https://github.com/slsa-framework/slsa-github-generator",
		SourceRepo:   "github.com/TripleAze/chainguard",
		SourceCommit: "cdfc1d3",
		SourceRef:    "refs/heads/main",
		SLSALevel:    2,
	}, nil
}
