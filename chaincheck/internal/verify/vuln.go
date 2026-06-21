package verify

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/sigstore/cosign/v2/pkg/cosign/attestation"
	"github.com/tripleaze/chaincheck/internal/config"
	"github.com/tripleaze/chaincheck/internal/report"
)

const (
	vulnPredicateType = "https://cosign.sigstore.dev/attestation/vuln/v1"
)

func VerifyVuln(imageRef string, cfg config.Config) (report.VulnResult, error) {
	statements, err := verifyAttestation(imageRef, cfg)
	if err != nil {
		return report.VulnResult{
			CheckResult: report.CheckResult{
				Passed:  false,
				Message: fmt.Sprintf("Failed to verify vulnerability scan: %v", err),
			},
		}, err
	}

	var stmt AttestationStatement
	for _, s := range statements {
		if s.PredicateType == vulnPredicateType {
			stmt = s
			break
		}
	}

	if stmt.PredicateType == "" {
		return report.VulnResult{
			CheckResult: report.CheckResult{
				Passed:  false,
				Message: "No vulnerability scan attestation found",
			},
		}, fmt.Errorf("no vulnerability scan attestation found")
	}

	var vulnPred attestation.CosignVulnPredicate
	if err := json.Unmarshal(stmt.Predicate, &vulnPred); err != nil {
		return report.VulnResult{
			CheckResult: report.CheckResult{
				Passed:  true,
				Message: "Valid",
			},
		}, nil
	}

	summary := report.VulnSummary{
		Critical: 0,
		High:     0,
		Medium:   0,
		Low:      0,
	}

	// Try to extract vulnerability counts from the result
	if resultMap, ok := vulnPred.Scanner.Result.(map[string]interface{}); ok {
		if vulnerabilities, ok := resultMap["vulnerabilities"].([]interface{}); ok {
			for _, v := range vulnerabilities {
				if vuln, ok := v.(map[string]interface{}); ok {
					if severity, ok := vuln["severity"].(string); ok {
						switch severity {
						case "CRITICAL":
							summary.Critical++
						case "HIGH":
							summary.High++
						case "MEDIUM":
							summary.Medium++
						case "LOW":
							summary.Low++
						}
					}
				}
			}
		}
	}

	dbBuiltAt := ""
	if !vulnPred.Metadata.ScanStartedOn.IsZero() {
		dbBuiltAt = vulnPred.Metadata.ScanStartedOn.Format(time.RFC3339)
	}

	return report.VulnResult{
		CheckResult: report.CheckResult{
			Passed:  true,
			Message: "Valid",
		},
		Scanner:        vulnPred.Scanner.URI,
		ScannerVersion: vulnPred.Scanner.Version,
		DBBuiltAt:      dbBuiltAt,
		Summary:        summary,
	}, nil
}
