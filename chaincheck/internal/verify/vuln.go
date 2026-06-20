package verify

import (
	"github.com/tripleaze/chaincheck/internal/config"
	"github.com/tripleaze/chaincheck/internal/report"
)

func VerifyVuln(imageRef string, cfg config.Config) (report.VulnResult, error) {
	return report.VulnResult{
		CheckResult: report.CheckResult{
			Passed:  true,
			Message: "Signed attestation present (stub)",
		},
		Scanner:        "Grype",
		ScannerVersion: "0.114.0",
		DBBuiltAt:      "2026-06-20",
		Summary: report.VulnSummary{
			Critical: 0,
			High:     53,
			Medium:   59,
			Low:      13,
		},
	}, nil
}
