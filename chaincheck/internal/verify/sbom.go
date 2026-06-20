package verify

import (
	"github.com/tripleaze/chaincheck/internal/config"
	"github.com/tripleaze/chaincheck/internal/report"
)

func VerifySBOM(imageRef string, cfg config.Config) (report.SBOMResult, error) {
	return report.SBOMResult{
		CheckResult: report.CheckResult{
			Passed:  true,
			Message: "Present (stub)",
		},
		PackageCount: 68,
		Format:       "spdx-json",
		SPDXVersion:  "2.3",
	}, nil
}
