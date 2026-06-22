package verify

import (
	"context"
	"encoding/base64"
	"encoding/json"

	"github.com/TripleAze/chainguard/chaincheck/internal/config"
	"github.com/google/go-containerregistry/pkg/name"
	"github.com/sigstore/cosign/v2/pkg/cosign"
)

type DSSEEnvelope struct {
	Payload     string `json:"payload"`
	PayloadType string `json:"payloadType"`
}

type AttestationStatement struct {
	PredicateType string          `json:"predicateType"`
	Predicate     json.RawMessage `json:"predicate"`
}

func verifyAttestation(imageRef string, cfg config.Config) ([]AttestationStatement, error) {
	ctx := context.Background()

	ref, err := name.ParseReference(imageRef)
	if err != nil {
		return nil, err
	}

	var cosignIdentities []cosign.Identity
	if cfg.CertIdentity != "" {
		// If CertIdentity is set, add it to the identities, along with all cfg.Identities?
		// Wait, let's add CertIdentity first, then all cfg.Identities
		cosignIdentities = append(cosignIdentities, cosign.Identity{
			SubjectRegExp: cfg.CertIdentity,
			Issuer:        cfg.CertOIDCIssuer,
		})
		for _, id := range cfg.Identities {
			cosignIdentities = append(cosignIdentities, cosign.Identity{
				SubjectRegExp: id.SubjectRegExp,
				Issuer:        id.Issuer,
			})
		}
	} else {
		for _, id := range cfg.Identities {
			cosignIdentities = append(cosignIdentities, cosign.Identity{
				SubjectRegExp: id.SubjectRegExp,
				Issuer:        id.Issuer,
			})
		}
	}

	co := &cosign.CheckOpts{
		Identities: cosignIdentities,
		IgnoreTlog: cfg.SkipTLog,
	}

	// Set up trusted material
	co.TrustedMaterial, err = cosign.TrustedRoot()
	if err != nil {
		// If we can't get the trusted root, continue anyway
	}

	verified, _, err := cosign.VerifyImageAttestations(ctx, ref, co)
	if err != nil {
		return nil, err
	}

	var statements []AttestationStatement
	for _, att := range verified {
		rawPayload, err := att.Payload()
		if err != nil {
			continue
		}

		// Unmarshal as DSSE envelope
		var env DSSEEnvelope
		if err := json.Unmarshal(rawPayload, &env); err != nil {
			continue
		}

		// Base64 decode the inner payload
		innerPayload, err := base64.StdEncoding.DecodeString(env.Payload)
		if err != nil {
			continue
		}

		// Now unmarshal the inner payload as the in-toto statement
		var stmt AttestationStatement
		if err := json.Unmarshal(innerPayload, &stmt); err != nil {
			continue
		}

		statements = append(statements, stmt)
	}

	return statements, nil
}
