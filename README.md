# ChainGuard

A supply chain security enforcement toolkit for container-based workflows implementing SBOM generation, vulnerability scanning, keyless image signing, SLSA provenance, and Kubernetes admission control, all enforced end to end with zero stored secrets.

## What This Is

Every container image that comes out of this pipeline carries cryptographic evidence answering four questions:

1. **What's inside it?**  a full Software Bill of Materials (SBOM)
2. **Is it safe?**  scanned against the live CVE database, gated on criticals, with a documented exception policy
3. **Did it come from us?**  signed using keyless OIDC-based signing (no stored private keys)
4. **How was it built?**  SLSA Level 2 provenance recording the exact commit, workflow, and builder

And at deploy time, **Kyverno admission control enforces all four** nothing runs in the cluster unless it can prove all of the above.

## Architecture

```
Developer pushes code
        │
        ▼
┌───────────────────────────────────────────────────────┐
│                   GitHub Actions CI                    │
│                                                        │
│  build ──▶ generate-sbom ──▶ scan-sbom                │
│                                   │                   │
│                              CVE gate                  │
│                           (fail on critical)           │
│                                   │                   │
│                                   ▼                   │
│                          sign-and-attest               │
│                         ┌──────────────┐              │
│                         │ cosign sign  │ → .sig       │
│                         │ attest SBOM  │ → .att       │
│                         │ attest vuln  │ → .att       │
│                         │ attest prov  │ → OCI ref    │
│                         └──────────────┘              │
│                                   │                   │
│                            provenance                  │
│                         (SLSA generator)               │
│                                   │                   │
│                          update-manifest               │
│                      (pins digest in Git)              │
└───────────────────────────────────────────────────────┘
        │
        ▼ Git commit to deploy/deployment.yml
┌───────────────────────────────────────────────────────┐
│                       ArgoCD                           │
│                                                        │
│  Watches deploy/ directory                             │
│  Detects digest change → syncs EKS cluster            │
│  Self-healing: reverts manual cluster changes          │
│  Every deployment traceable to a Git commit            │
└───────────────────────────────────────────────────────┘
        │
        ▼ pod admission
┌───────────────────────────────────────────────────────┐
│              Kyverno Admission Control (EKS)           │
│                                                        │
│  require-signature     → Enforce                       │
│  require-provenance    → Enforce                       │
│  require-sbom          → Enforce                       │
│  block-critical-cves   → Enforce                       │
│                                                        │
│  Unsigned or unattested images → BLOCKED               │
└───────────────────────────────────────────────────────┘
```

## What Gets Produced Per Build

| Artifact | Format | Location |
|---|---|---|
| Container image | OCI, linux/amd64 | GHCR, tagged `main` / `sha-<commit>` |
| SBOM | SPDX JSON | Workflow artifact + OCI `.att` attestation |
| CVE scan results | SARIF | GitHub Security tab (Code Scanning) |
| Vuln attestation | cosign vuln predicate | OCI `.att` attestation |
| Image signature | Cosign keyless | OCI `.sig` tag |
| SLSA provenance | SLSA v0.2 | OCI referrers API |
| Deployment manifest | Kubernetes YAML | `deploy/deployment.yml` (digest-pinned) |

## Verifying an Image

```bash
# View the full supply chain artifact tree
cosign tree ghcr.io/tripleaze/chainguard@sha256:<digest>

# Verify the Cosign signature
cosign verify \
  --certificate-identity-regexp="https://github.com/TripleAze/chainguard" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  ghcr.io/tripleaze/chainguard@sha256:<digest>

# Verify SLSA provenance via GitHub CLI
gh attestation verify oci://ghcr.io/tripleaze/chainguard@sha256:<digest> -o tripleaze

# Extract the SBOM
cosign download attestation ghcr.io/tripleaze/chainguard@sha256:<digest> \
  | jq -r '.payload' | base64 -d \
  | jq 'select(.predicateType == "https://spdx.dev/Document") | .predicate'

# Extract the vuln attestation summary
cosign download attestation ghcr.io/tripleaze/chainguard@sha256:<digest> \
  | jq -r '.payload' | base64 -d \
  | jq 'select(.predicateType == "cosign.sigstore.dev/attestation/vuln/v1")
        | .predicate.scanner | {version, db, findings: (.result | length)}'
```

## CVE Exception Policy

CVEs with no available fix are documented in [`.grype.yaml`](.grype.yaml), each with a specific CVE identifier, a written justification and mitigation, and an expiry date forcing periodic re-evaluation. No blanket ignores are permitted.

The pipeline gate fails on any critical CVE that has an available fix and is not explicitly documented. High/medium findings are surfaced via SARIF for visibility without blocking.

## Repo Structure

```
chainguard/
├── .github/workflows/ci.yml       # 6-job CI pipeline
├── razz-bug-calenderapp/          # Sample app (nginx SPA, multi-stage Dockerfile)
├── deploy/deployment.yml          # Digest-pinned manifest, managed by CI + ArgoCD
├── argocd/application.yaml        # ArgoCD Application manifest
├── policy/kyverno/                # Kyverno ClusterPolicies (all in Enforce)
├── .grype.yaml                    # CVE exception policy with documented ignores
└── docs/architecture.md           # Design rationale and decisions
```

## Roadmap

- [x] **Phase 1** — CI pipeline: SBOM, CVE gate, sign, attest (SBOM + vuln + provenance)
- [x] **Phase 2** — GitOps CD with ArgoCD + Kyverno admission enforcement on EKS
- [x] **Phase 3** — `chaincheck` CLI: one-command trust inspection for any image
- [X] **Phase 4** — Compliance dashboard: release history, CVE trends, policy pass/fail
