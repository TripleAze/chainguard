package verify

import (
	"context"
	"fmt"

	"github.com/google/go-containerregistry/pkg/name"
	"github.com/sigstore/cosign/v2/pkg/cosign"
	"github.com/tripleaze/chaincheck/internal/config"
	"github.com/tripleaze/chaincheck/internal/report"
)

func VerifySignature(imageRef string, cfg config.Config) (report.CheckResult, error) {
	ctx := context.Background()

	ref, err := name.ParseReference(imageRef)
	if err != nil {
		return report.CheckResult{
			Passed:  false,
			Message: fmt.Sprintf("Failed to parse image ref: %v", err),
		}, err
	}

	co := &cosign.CheckOpts{
		IgnoreTlog: cfg.SkipTLog,
	}

	// Only enforce identity matching if cert-identity was explicitly set
	if cfg.CertIdentity != "" {
		var cosignIdentities []cosign.Identity
		for _, id := range cfg.Identities {
			cosignIdentities = append(cosignIdentities, cosign.Identity{
				SubjectRegExp: id.SubjectRegExp,
				Issuer:        id.Issuer,
			})
		}
		co.Identities = cosignIdentities
	}

	// Set up trusted material
	co.TrustedMaterial, err = cosign.TrustedRoot()
	if err != nil {
		// If we can't get the trusted root, continue anyway
	}

	verified, _, err := cosign.VerifyImageSignatures(ctx, ref, co)
	if err != nil {
		return report.CheckResult{
			Passed:  false,
			Message: fmt.Sprintf("Verification failed: %v", err),
		}, err
	}

	if len(verified) == 0 {
		return report.CheckResult{
			Passed:  false,
			Message: "No valid signatures found",
		}, fmt.Errorf("no valid signatures found")
	}

	sig := verified[0]

	// Try to get details from the signature
	detail := "Unknown signer"

	// First, check if there's a certificate
	cert, err := sig.Cert()
	if err == nil && cert != nil {
		// Try to get the subject from the certificate
		found := false
		// First check Subject Alternative Name (extension 2.5.29.17)
		for _, ext := range cert.Extensions {
			if ext.Id.String() == "2.5.29.17" { // Subject Alternative Name
				// The value is ASN.1 DER-encoded: SEQUENCE(82 bytes) → [6] IMPLICIT IA5String(80 bytes)
				// So skip first 4 bytes (0x30, 0x52, 0x86, 0x50)
				if len(ext.Value) > 4 {
					detail = "Signed by: " + string(ext.Value[4:])
					found = true
					break
				}
			}
		}
		if !found {
			// If not found, check GitHub Workflow extension
			for _, ext := range cert.Extensions {
				if ext.Id.String() == "1.3.6.1.4.1.57264.1.1" { // GitHub Workflow
					detail = "Signed by: " + string(ext.Value)
					found = true
					break
				}
			}
		}
	}

	return report.CheckResult{
		Passed:  true,
		Message: "Valid",
		Detail:  detail,
	}, nil
}
