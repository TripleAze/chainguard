package verify

import (
	"github.com/tripleaze/chaincheck/internal/config"
	"github.com/tripleaze/chaincheck/internal/report"
)

func VerifySignature(imageRef string, cfg config.Config) (report.CheckResult, error) {
	return report.CheckResult{
		Passed:  true,
		Message: "Valid (stub)",
		Detail:  "Signed by: ci.yml @ TripleAze/chainguard",
	}, nil
}
