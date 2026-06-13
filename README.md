# ChainGuard

ChainGuard is a supply chain security enforcement pipeline for container-based workflows, implementing SBOM generation, vulnerability scanning, keyless image signing, and SLSA provenance attestation, all enforced as CI gates with zero stored secrets.

## What This Is

Every container image that comes out of this pipeline carries cryptographic evidence answering four questions:

1. **What's inside it?** — a full Software Bill of Materials (SBOM)
2. **Is it safe?** — scanned against the live CVE database, with a documented exception policy
3. **Did it come from us?** — signed using keyless OIDC-based signing (no stored private keys)
4. **How was it built?** — SLSA Level 2 provenance recording the exact commit, workflow, and builder

## Pipeline Overview

```
push to main
     │
     ▼
┌─────────┐   ┌──────────────┐   ┌───────────┐   ┌──────────────────┐   ┌────────────┐
│  build  │──▶│ generate-sbom│──▶│ scan-sbom │──▶│  sign-and-attest │──▶│ provenance │
└─────────┘   └──────────────┘   └───────────┘   └──────────────────┘   └────────────┘
   builds        Syft generates      Grype scans     Cosign signs the      SLSA generator
   multi-arch    SPDX SBOM from      SBOM, fails      image digest and      produces signed
   image, push   the pushed image    on unfixed       attaches SBOM as      provenance,
   to GHCR       digest              criticals        a signed attestation  attached to image
```

Every step operates on the **image digest**, never a mutable tag, so what gets scanned, signed, and attested is guaranteed to be exactly what was pushed.

## What Gets Produced

For an image at `ghcr.io/tripleaze/chainguard@sha256:<digest>`:

| Artifact | Format | Where |
|---|---|---|
| Container image | OCI image, multi-arch | GHCR, tagged `main` / `sha-<commit>` |
| SBOM | SPDX JSON | Workflow artifact (`sbom.spdx.json`) |
| SBOM attestation | Signed in-toto attestation | GHCR, `.att` tag |
| Image signature | Cosign signature | GHCR, `.sig` tag |
| SLSA provenance | Signed in-toto attestation (SLSA v1) | GHCR `.att` tag + GitHub Attestations API |
| CVE scan results | SARIF | GitHub Security tab (Code Scanning) |

## Verifying an Image

```bash
# Verify the signature was produced by this repo's CI
cosign verify \
  --certificate-identity-regexp="https://github.com/TripleAze/chainguard" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  ghcr.io/tripleaze/chainguard@sha256:<digest>

# View the SLSA provenance
gh attestation verify oci://ghcr.io/tripleaze/chainguard@sha256:<digest> -o tripleaze

# Extract the SBOM attestation
cosign download attestation ghcr.io/tripleaze/chainguard@sha256:<digest> \
  | jq -r '.payload' | base64 -d | jq '.predicate'
```

## CVE Exception Policy

CVEs with no available fix are documented in [`.grype.yaml`](.grype.yaml), each with:
- A specific CVE identifier (no blanket ignores)
- A written justification and mitigation
- An expiry date forcing periodic re-evaluation

The pipeline gate fails the build on any **critical** CVE that has an available fix and is not explicitly documented as an exception. High/medium findings are surfaced via SARIF for visibility without blocking.

## Multi-Stage Build Hardening

The Dockerfile is multi-stage (`build` → `production`). OS package upgrades (`apk upgrade --no-cache`) are applied in **every stage that contributes to the final image**, as patching only the build stage has no effect on the shipped image, since only the final `FROM` stage's layers are retained.

## Architecture & Design Decisions

See [`docs/architecture.md`](docs/architecture.md) for the full design rationale, including why keyless signing was chosen over stored keys, how the digest-pinning guarantee works end to end, and the SLSA level achieved.

## Roadmap

- [x] **Phase 1** — CI pipeline: SBOM, scan, sign, attest, provenance
- [ ] **Phase 2** — Kyverno admission policies enforcing signature/SBOM/provenance at deploy time
- [ ] **Phase 3** — `chaincheck` CLI for one-command trust inspection of any image
- [ ] **Phase 4** — Compliance dashboard with release history and CVE trends
