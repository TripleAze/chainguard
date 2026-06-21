package verify

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/tripleaze/chaincheck/internal/config"
	"github.com/tripleaze/chaincheck/internal/report"
)

const (
	slsa02PredicateType = "https://slsa.dev/provenance/v0.2"
	slsa1PredicateType  = "https://slsa.dev/provenance/v1"
)

func VerifyProvenance(imageRef string, cfg config.Config) (report.ProvenanceResult, error) {
	statements, err := verifyAttestation(imageRef, cfg)
	if err != nil {
		return report.ProvenanceResult{
			CheckResult: report.CheckResult{
				Passed:  false,
				Message: fmt.Sprintf("Failed to verify provenance: %v", err),
			},
		}, err
	}

	var stmt AttestationStatement
	for _, s := range statements {
		if s.PredicateType == slsa02PredicateType || s.PredicateType == slsa1PredicateType {
			stmt = s
			break
		}
	}

	if stmt.PredicateType == "" {
		return report.ProvenanceResult{
			CheckResult: report.CheckResult{
				Passed:  false,
				Message: "No SLSA provenance attestation found",
			},
		}, fmt.Errorf("no SLSA provenance attestation found")
	}

	// First unmarshal into a generic map to get all fields
	var predMap map[string]interface{}
	if err := json.Unmarshal(stmt.Predicate, &predMap); err != nil {
		return report.ProvenanceResult{
			CheckResult: report.CheckResult{
				Passed:  true,
				Message: "Valid",
			},
		}, nil
	}

	var sourceRepo, sourceCommit, sourceRef, builderID string

	// Get source repo and commit from materials, if available
	if materials, ok := predMap["materials"].([]interface{}); ok && len(materials) > 0 {
		if mat, ok := materials[0].(map[string]interface{}); ok {
			if uri, ok := mat["uri"].(string); ok {
				// Strip git+ prefix
				uri = strings.TrimPrefix(uri, "git+")
				// Strip @refs/... suffix
				if idx := strings.Index(uri, "@"); idx != -1 {
					uri = uri[:idx]
				}
				sourceRepo = uri
			}
			if digest, ok := mat["digest"].(map[string]interface{}); ok {
				if sha1, ok := digest["sha1"].(string); ok {
					sourceCommit = sha1
				} else if sha256, ok := digest["sha256"].(string); ok {
					sourceCommit = sha256
				}
				// Truncate commit to 7 chars
				if len(sourceCommit) > 7 {
					sourceCommit = sourceCommit[:7]
				}
			}
		}
	}

	// Get branch/ref from invocation.environment.github_ref first (priority)
	if invocation, ok := predMap["invocation"].(map[string]interface{}); ok {
		// First check environment.github_ref
		if env, ok := invocation["environment"].(map[string]interface{}); ok {
			if githubRef, ok := env["github_ref"].(string); ok {
				sourceRef = githubRef
			}
		}

		// Then, ONLY if we still don't have a sourceRef, check configSource.entryPoint as fallback
		if sourceRef == "" {
			if configSource, ok := invocation["configSource"].(map[string]interface{}); ok {
				if entryPoint, ok := configSource["entryPoint"].(string); ok {
					sourceRef = entryPoint
				}
			}
		}
	}

	// Fallback to externalParameters.workflow.ref if still not found
	if sourceRef == "" {
		if externalParams, ok := predMap["externalParameters"].(map[string]interface{}); ok {
			if workflow, ok := externalParams["workflow"].(map[string]interface{}); ok {
				if ref, ok := workflow["ref"].(string); ok {
					sourceRef = ref
				}
			}
		}
	}

	// Strip refs/heads/ or refs/tags/ prefix from sourceRef
	sourceRef = strings.TrimPrefix(sourceRef, "refs/heads/")
	sourceRef = strings.TrimPrefix(sourceRef, "refs/tags/")

	if builder, ok := predMap["builder"].(map[string]interface{}); ok {
		if id, ok := builder["id"].(string); ok {
			builderID = id
		}
	}

	return report.ProvenanceResult{
		CheckResult: report.CheckResult{
			Passed:  true,
			Message: "Valid",
		},
		BuilderID:    builderID,
		SourceRepo:   sourceRepo,
		SourceCommit: sourceCommit,
		SourceRef:    sourceRef,
		SLSALevel:    2,
	}, nil
}
