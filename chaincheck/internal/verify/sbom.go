package verify

import (
	"encoding/json"
	"fmt"

	"github.com/tripleaze/chaincheck/internal/config"
	"github.com/tripleaze/chaincheck/internal/report"
)

const (
	spdxPredicateType = "https://spdx.dev/Document"
)

func VerifySBOM(imageRef string, cfg config.Config) (report.SBOMResult, error) {
	statements, err := verifyAttestation(imageRef, cfg)
	if err != nil {
		return report.SBOMResult{
			CheckResult: report.CheckResult{
				Passed:  false,
				Message: fmt.Sprintf("Failed to verify SBOM: %v", err),
			},
		}, err
	}

	var stmt AttestationStatement
	for _, s := range statements {
		if s.PredicateType == spdxPredicateType {
			stmt = s
			break
		}
	}

	if stmt.PredicateType == "" {
		return report.SBOMResult{
			CheckResult: report.CheckResult{
				Passed:  false,
				Message: "No SBOM attestation found",
			},
		}, fmt.Errorf("no SBOM attestation found")
	}

	var packageCount int
	var spdxVersion string

	var predicate map[string]interface{}
	if err := json.Unmarshal(stmt.Predicate, &predicate); err != nil {
		return report.SBOMResult{
			CheckResult: report.CheckResult{
				Passed:  true,
				Message: "Present",
			},
		}, nil
	}

	if spdxVersionVal, ok := predicate["spdxVersion"].(string); ok {
		spdxVersion = spdxVersionVal
	}

	if packages, ok := predicate["packages"].([]interface{}); ok {
		packageCount = len(packages)
	}

	return report.SBOMResult{
		CheckResult: report.CheckResult{
			Passed:  true,
			Message: "Present",
		},
		PackageCount: packageCount,
		Format:       "spdx-json",
		SPDXVersion:  spdxVersion,
	}, nil
}
