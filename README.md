# ChainGuard

![Go](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-1.30+-326CE5?logo=kubernetes&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white)

A supply chain security enforcement toolkit for container-based workflows, bridging the gap between `git push` and `kubectl apply`. ChainGuard provides end-to-end verification: SBOM generation, vulnerability scanning, keyless image signing, SLSA provenance, and Kubernetes admission control — all enforced with zero stored secrets.

## What ChainGuard Solves

Containers move through a chain of hand-offs: source code → CI build → registry → CD deploy → runtime. At each step, something can go wrong: a vulnerable dependency, a tampered image, a build from an unreviewed source, or a deployment bypassing the security pipeline entirely.

ChainGuard ensures **every image reaching production carries verifiable, signed evidence** of what it contains and how it was built, enforced automatically at every layer.

## Architecture Overview

```
─────────────────────────────────────────────────────────────────────────────
 Developer pushes code
        │
        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          GitHub Actions CI Pipeline                        │
│                                                                           │
│  ┌──────┐     ┌──────────────┐     ┌──────────┐     ┌──────────────────┐ │
│  │Build │────▶│Generate SBOM │────▶│Vuln Scan│────▶│Sign & Attestations│ │
│  └──────┘     └──────────────┘     └──────────┘     └──────────────────┘ │
│                                                    │                      │
│                                                    ▼                      │
│                                         ┌──────────────────┐              │
│                                         │ SLSA Provenance  │              │
│                                         └──────────────────┘              │
│                                                    │                      │
│                                                    ▼                      │
│                                         Update deploy/deployment.yml      │
│                                         (pins image digest in Git)        │
└───────────────────────────────────────────────────────────────────────────┘
        │
        ▼ Git commit to deploy/deployment.yml
┌───────────────────────────────────────────────────────────────────────────┐
│                                ArgoCD                                     │
│                                                                           │
│  Watches deploy/ directory                                                │
│  Detects digest change → syncs EKS cluster                                │
│  Self-healing: reverts manual cluster changes                             │
│  Every deployment traceable to a Git commit                               │
└───────────────────────────────────────────────────────────────────────────┘
        │
        ▼ Pod admission request
┌───────────────────────────────────────────────────────────────────────────┐
│                  Kyverno Admission Control (EKS)                          │
│                                                                           │
│  1. Require Signature       → Enforce                                     │
│  2. Require Provenance      → Enforce                                     │
│  3. Require SBOM Attestation→ Enforce                                     │
│  4. Block Critical CVEs     → Enforce                                     │
│                                                                           │
│  Unsigned/unattested images → BLOCKED                                    │
└───────────────────────────────────────────────────────────────────────────┘
        │
        ▼
  Pod runs in cluster
─────────────────────────────────────────────────────────────────────────────
```

## The 4 Supply Chain Checks Every Image Must Pass

| Check | Purpose |
|-------|---------|
| **Signature** | Image was signed via Cosign keyless signing, certificate logged in Rekor |
| **SBOM** | Signed SPDX Software Bill of Materials attestation is attached |
| **Vulnerability Scan** | Signed Grype vulnerability scan attestation is present with severity breakdown |
| **Provenance** | SLSA Level 2 provenance records source commit, branch, and builder |

## Roadmap

- [x] **Phase 1** — CI pipeline: SBOM, CVE gate, sign, attest (SBOM + vuln + provenance)
- [x] **Phase 2** — GitOps CD with ArgoCD + Kyverno admission enforcement on EKS
- [x] **Phase 3** — `chaincheck` CLI: one-command trust inspection for any image
- [x] **Phase 4** — Compliance dashboard: release history, CVE trends, policy pass/fail

## Quick Start

### 1. Install chaincheck

```bash
curl -sSfL https://raw.githubusercontent.com/TripleAze/chainguard/main/chaincheck/install.sh | sh
```

### 2. Inspect an image

```bash
chaincheck inspect ghcr.io/yourorg/yourapp:latest
```

### 3. Deploy Kyverno policies

```bash
kubectl apply -k policy/kyverno/
```

### 4. Dashboard Setup

See [dashboard/README.md](dashboard/README.md) for full setup instructions.

## Repository Structure

| Path | Description |
|------|-------------|
| `.github/workflows/` | CI, dashboard build, and chaincheck release pipelines |
| `razz-bug-calenderapp/` | Sample app with multi-stage Dockerfile |
| `deploy/` | Digest-pinned Kubernetes manifests, ArgoCD managed |
| `argocd/` | ArgoCD Application manifest |
| `policy/kyverno/` | 4 ClusterPolicies in Enforce mode |
| `.grype.yaml` | CVE exception policy |
| `chaincheck/` | Go CLI tool for inspecting supply chain posture |
| `dashboard/backend/` | Go + PostgreSQL API server |
| `dashboard/frontend/` | Next.js web dashboard |
| `docs/` | Architecture and design documentation |

## Documentation

- [Architecture & Design Decisions](docs/architecture.md)
- [chaincheck CLI Documentation](chaincheck/README.md)

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
<<<<<<< HEAD
=======

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
>>>>>>> 90f78c3ca7f5e4def11e8e4d8dbc8d48737b9373
